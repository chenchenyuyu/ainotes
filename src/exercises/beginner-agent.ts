import type {
  AgentEvent,
  Message,
  ModelProvider,
  ModelTurn,
  ToolDefinition,
} from "../core/minimal-agent.js";
import { calculatorTool, runAgent } from "../core/minimal-agent.js";

/**
 * 初级练习：用一个可预测的本地 Provider 看清 Agent Loop。
 *
 * 这里故意不调用真实 LLM。先理解「模型决定调用工具 → 程序执行工具 →
 * 工具结果作为新 observation 返回模型」之后，再接 API，调试会简单很多。
 */
export class BeginnerPracticeProvider implements ModelProvider {
  async complete(messages: Message[], tools: ToolDefinition[]): Promise<ModelTurn> {
    const toolResult = [...messages].reverse().find((message) => message.role === "tool");

    if (toolResult) {
      const observation = JSON.parse(toolResult.content) as {
        ok: boolean;
        output?: unknown;
        error?: string;
      };
      return observation.ok
        ? { type: "final", content: `计算完成，答案是 ${String(observation.output)}。` }
        : { type: "final", content: `工具执行失败：${observation.error ?? "未知错误"}` };
    }

    const prompt = messages.find((message) => message.role === "user")?.content ?? "";
    const numbers = prompt.match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
    const calculator = tools.find((tool) => tool.name === "calculate");

    if (!calculator || numbers.length < 2) {
      return { type: "final", content: "请给出两个数字，例如：计算 12 × 7。" };
    }

    const operation = prompt.includes("除")
      ? "divide"
      : prompt.includes("减")
        ? "subtract"
        : prompt.includes("加")
          ? "add"
          : "multiply";

    return {
      type: "tool_calls",
      calls: [
        {
          id: "practice-call-1",
          name: calculator.name,
          arguments: { operation, left: numbers[0], right: numbers[1] },
        },
      ],
    };
  }
}

export type BeginnerExerciseResult = {
  answer: string;
  events: AgentEvent[];
};

export async function runBeginnerExercise(
  prompt = "计算 12 乘以 7",
): Promise<BeginnerExerciseResult> {
  const events: AgentEvent[] = [];

  const answer = await runAgent(
    new BeginnerPracticeProvider(),
    prompt,
    [calculatorTool],
    {
      maxSteps: 4,
      timeoutMs: 1_000,
      onEvent: (event) => events.push(event),
    },
  );

  return { answer, events };
}

/*
 * 重点练习（建议按顺序完成）：
 *
 * TODO 1：给 calculatorTool 增加 power 运算，并补测试。
 *         重点：Schema、实现和测试必须同时修改。
 * TODO 2：让 Provider 支持一次请求中的两个连续计算。
 *         重点：不能假设 Agent 只调用一次工具。
 * TODO 3：故意调用不存在的工具，观察结构化错误如何回到消息历史。
 * TODO 4：实现真实 ModelProvider，但保留 maxSteps、timeout 和事件记录。
 */

if (import.meta.url === `file://${process.argv[1]}`) {
  const prompt = process.argv.slice(2).join(" ") || "计算 12 乘以 7";
  runBeginnerExercise(prompt)
    .then(({ answer, events }) => {
      console.log("=== Agent Trace ===");
      events.forEach((event) => console.log(JSON.stringify(event)));
      console.log("\n=== Final Answer ===");
      console.log(answer);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
