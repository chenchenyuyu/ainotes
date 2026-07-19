import { describe, expect, it } from "vitest";

import { runAdvancedExercise } from "../src/exercises/advanced-safe-agent.js";
import { runBeginnerExercise } from "../src/exercises/beginner-agent.js";
import {
  runIntermediateExercise,
  type EvidenceHit,
} from "../src/exercises/intermediate-rag-agent.js";

function evidenceHit(
  excerpt: string,
  source = "data/notes/agent-basics.md#L1-L4",
): EvidenceHit {
  return {
    title: "Agent 基础",
    excerpt,
    source,
    score: 0.9,
    metadata: {
      chunkId: `${source}:chunk`,
      documentSource: source.split("#")[0],
      startLine: 1,
      endLine: 4,
      modifiedAt: "2026-07-15T00:00:00.000Z",
    },
  };
}

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
      evidenceHit("Agent 会观察环境、选择动作并处理工具反馈。"),
    ]);

    expect(result.citations).toEqual([
      {
        title: "Agent 基础",
        source: "data/notes/agent-basics.md#L1-L4",
        chunkId: "data/notes/agent-basics.md#L1-L4:chunk",
        lines: "1-4",
      },
    ]);
    expect(result.answer).toContain("[Agent 基础](data/notes/agent-basics.md#L1-L4)");
    expect(result.trace.at(-1)).toMatchObject({ step: "ground", valid: true });
  });

  it("blocks a model answer that invents a source", async () => {
    await expect(
      runIntermediateExercise(
        "什么是 Agent Loop？",
        async () => [evidenceHit("Agent 使用工具完成任务。")],
        async () => "这是伪造的回答。[不存在的资料](https://invalid.example/fake)",
      ),
    ).rejects.toThrow("引用校验失败");
  });

  it("flags contradictory evidence instead of silently merging it", async () => {
    const result = await runIntermediateExercise("Agent 是否可以自动发布？", async () => [
      evidenceHit(
        "Agent 生产环境应允许自动发布报告。",
        "data/notes/allow.md#L1-L2",
      ),
      evidenceHit(
        "Agent 生产环境不应允许自动发布报告。",
        "data/notes/deny.md#L1-L2",
      ),
    ]);

    expect(result.conflicts).toHaveLength(1);
    expect(result.answer).toContain("潜在冲突证据");
    expect(result.trace.some((event) => event.step === "conflict")).toBe(true);
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
