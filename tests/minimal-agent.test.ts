import { describe, expect, it, vi } from "vitest";

import {
  calculatorTool,
  runAgent,
  type ModelProvider,
  type ModelTurn,
} from "../src/core/minimal-agent.js";

function scriptedProvider(turns: ModelTurn[]): ModelProvider {
  let index = 0;
  return {
    async complete() {
      const turn = turns[index];
      index += 1;
      if (!turn) throw new Error("Script has no more model turns");
      return turn;
    },
  };
}

describe("minimal agent loop", () => {
  it("executes a validated tool call and returns the final answer", async () => {
    const provider = scriptedProvider([
      {
        type: "tool_calls",
        calls: [
          {
            id: "call-1",
            name: "calculate",
            arguments: { operation: "multiply", left: 6, right: 7 },
          },
        ],
      },
      { type: "final", content: "答案是 42。" },
    ]);
    const onEvent = vi.fn();

    await expect(
      runAgent(provider, "6 × 7 等于多少？", [calculatorTool], { onEvent }),
    ).resolves.toBe("答案是 42。");
    expect(onEvent).toHaveBeenCalledWith({
      type: "tool_end",
      name: "calculate",
      output: 42,
    });
  });

  it("returns tool validation errors to the model so it can recover", async () => {
    const provider = scriptedProvider([
      {
        type: "tool_calls",
        calls: [
          {
            id: "bad-call",
            name: "calculate",
            arguments: { operation: "divide", left: 1, right: 0 },
          },
        ],
      },
      { type: "final", content: "不能除以零。" },
    ]);

    await expect(runAgent(provider, "1 / 0", [calculatorTool])).resolves.toBe("不能除以零。");
  });

  //补齐calculatorTool的power运算的测试
  it("executes a power operation", async () => {
    const provider = scriptedProvider([
      {
        type: "tool_calls",
        calls: [
          {
            id: "call-1",
            name: "calculate",
            arguments: { operation: "power", left: 2, right: 3 },
          },
        ],
      },
      { type: "final", content: "答案是 8。" },
    ]);
    const onEvent = vi.fn();
    await expect(runAgent(provider, "2 的 3 次方是多少？", [calculatorTool], { onEvent })).resolves.toBe("答案是 8。");
    expect(onEvent).toHaveBeenCalledWith({
      type: "tool_end",
      name: "calculate",
      output: 8,
    });
  });

  it("stops runaway agents at the configured step limit", async () => {
    const provider: ModelProvider = {
      async complete() {
        return { type: "tool_calls", calls: [] };
      },
    };

    await expect(runAgent(provider, "一直运行", [], { maxSteps: 2 })).rejects.toThrow(
      "2-step safety limit",
    );
  });
});
