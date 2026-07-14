import { z } from "zod";

export type Message =
  | { role: "user" | "assistant"; content: string }
  | { role: "tool"; content: string; toolCallId: string };

export type ToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type ModelTurn =
  | { type: "final"; content: string }
  | { type: "tool_calls"; calls: ToolCall[] };

export interface ModelProvider {
  complete(messages: Message[], tools: ToolDefinition[]): Promise<ModelTurn>;
}

export type ToolDefinition<TSchema extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  schema: TSchema;
  execute: (input: z.infer<TSchema>) => Promise<unknown>;
};

export type AgentEvent =
  | { type: "turn"; step: number }
  | { type: "tool_start"; name: string; input: unknown }
  | { type: "tool_end"; name: string; output: unknown }
  | { type: "tool_error"; name: string; error: string }
  | { type: "final"; content: string };

export type AgentOptions = {
  maxSteps?: number;
  timeoutMs?: number;
  onEvent?: (event: AgentEvent) => void;
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Tool timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
};

export async function runAgent(
  provider: ModelProvider,
  prompt: string,
  tools: ToolDefinition[],
  options: AgentOptions = {},
): Promise<string> {
  const maxSteps = options.maxSteps ?? 8;
  const timeoutMs = options.timeoutMs ?? 10_000;
  const messages: Message[] = [{ role: "user", content: prompt }];
  const toolMap = new Map(tools.map((tool) => [tool.name, tool]));

  for (let step = 1; step <= maxSteps; step += 1) {
    options.onEvent?.({ type: "turn", step });
    const turn = await provider.complete(messages, tools);

    if (turn.type === "final") {
      options.onEvent?.({ type: "final", content: turn.content });
      return turn.content;
    }

    for (const call of turn.calls) {
      const tool = toolMap.get(call.name);
      if (!tool) {
        messages.push({
          role: "tool",
          toolCallId: call.id,
          content: JSON.stringify({ error: `Unknown tool: ${call.name}` }),
        });
        continue;
      }

      options.onEvent?.({ type: "tool_start", name: tool.name, input: call.arguments });
      try {
        const input = tool.schema.parse(call.arguments);
        const output = await withTimeout(tool.execute(input), timeoutMs);
        options.onEvent?.({ type: "tool_end", name: tool.name, output });
        messages.push({
          role: "tool",
          toolCallId: call.id,
          content: JSON.stringify({ ok: true, output }),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        options.onEvent?.({ type: "tool_error", name: tool.name, error: message });
        messages.push({
          role: "tool",
          toolCallId: call.id,
          content: JSON.stringify({ ok: false, error: message }),
        });
      }
    }
  }

  throw new Error(`Agent exceeded the ${maxSteps}-step safety limit`);
}

const calculatorSchema = z.object({
  operation: z.enum(["add", "subtract", "multiply", "divide"]),
  left: z.number().finite(),
  right: z.number().finite(),
});

export const calculatorTool: ToolDefinition<typeof calculatorSchema> = {
  name: "calculate",
  description: "Perform one arithmetic operation on two finite numbers.",
  schema: calculatorSchema,
  async execute(input) {
    const { operation, left, right } = input;
    if (operation === "divide" && right === 0) {
      throw new Error("Division by zero is not allowed");
    }
    return {
      add: left + right,
      subtract: left - right,
      multiply: left * right,
      divide: left / right,
    }[operation];
  },
};
