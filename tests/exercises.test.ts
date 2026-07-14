import { describe, expect, it } from "vitest";

import { runAdvancedExercise } from "../src/exercises/advanced-safe-agent.js";
import { runBeginnerExercise } from "../src/exercises/beginner-agent.js";
import { runIntermediateExercise } from "../src/exercises/intermediate-rag-agent.js";

describe("progressive agent exercises", () => {
  it("runs a complete beginner tool loop", async () => {
    const result = await runBeginnerExercise("计算 12 乘以 7");

    expect(result.answer).toContain("84");
    expect(result.events.map((event) => event.type)).toEqual([
      "turn",
      "tool_start",
      "tool_end",
      "turn",
      "final",
    ]);
  });

  it("returns only citations supplied by the retriever", async () => {
    const result = await runIntermediateExercise("什么是 Agent Loop？", async () => [
      {
        title: "Agent 基础",
        excerpt: "Agent 会观察环境、选择动作并处理工具反馈。",
        source: "data/notes/agent-basics.md",
        score: 2,
      },
    ]);

    expect(result.citations).toEqual([
      { title: "Agent 基础", source: "data/notes/agent-basics.md" },
    ]);
    expect(result.answer).toContain("[Agent 基础](data/notes/agent-basics.md)");
    expect(result.trace.at(-1)).toMatchObject({ step: "ground", valid: true });
  });

  it("refuses high-risk actions until a human approves", async () => {
    const blocked = await runAdvancedExercise("研究 Agent 并发布报告");
    const approved = await runAdvancedExercise("研究 Agent 并发布报告", {
      approvePublish: true,
    });

    expect(blocked.status).toBe("approval_required");
    expect(blocked.events.some((event) => event.type === "approval")).toBe(true);
    expect(approved.status).toBe("completed");
    expect(approved.metrics.toolCalls).toBe(2);
  });
});
