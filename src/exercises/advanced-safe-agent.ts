import { z } from "zod";

import { searchNotes } from "../core/notes.js";

type RiskLevel = "read" | "write";

type SafeTool<TSchema extends z.ZodType> = {
  name: string;
  risk: RiskLevel;
  schema: TSchema;
  execute: (input: z.infer<TSchema>) => Promise<unknown>;
};

export type SafeAgentEvent = {
  step: number;
  type: "plan" | "tool" | "approval" | "review" | "stop";
  detail: string;
  durationMs?: number;
};

export type SafeAgentResult = {
  status: "completed" | "approval_required";
  output: string;
  qualityScore: number;
  events: SafeAgentEvent[];
  metrics: {
    steps: number;
    toolCalls: number;
    durationMs: number;
  };
};

export type SafeAgentOptions = {
  approvePublish?: boolean;
  maxSteps?: number;
  timeoutMs?: number;
};

const searchSchema = z.object({
  query: z.string().min(2).max(300),
});

const publishSchema = z.object({
  title: z.string().min(2).max(100),
  body: z.string().min(10).max(4_000),
});

const tools = {
  search_notes: {
    name: "search_notes",
    risk: "read",
    schema: searchSchema,
    execute: async ({ query }) => searchNotes(query, undefined, 3),
  } satisfies SafeTool<typeof searchSchema>,
  publish_report: {
    name: "publish_report",
    risk: "write",
    schema: publishSchema,
    // 练习环境不做真实外部写入；生产中应替换为受审计、可撤销的实现。
    execute: async ({ title, body }) => ({
      published: true,
      title,
      characters: body.length,
    }),
  } satisfies SafeTool<typeof publishSchema>,
};

async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`工具执行超过 ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function reviewReport(report: string, hasEvidence: boolean): {
  score: number;
  feedback: string;
} {
  const hasStructure = report.includes("结论：") && report.includes("证据：");
  const hasLimit = report.includes("限制：");
  const score =
    Number(hasEvidence) * 50 +
    Number(hasStructure) * 30 +
    Number(hasLimit) * 20;
  return {
    score,
    feedback:
      score >= 80
        ? "证据、结构和限制说明均达标。"
        : "报告缺少证据、结构或限制说明，不应发布。",
  };
}

/**
 * 高级练习：带权限、预算、Trace 和 Reviewer 的最小安全 Harness。
 *
 * 这里把“规划、执行、审批、复核”写成显式控制流。高风险动作不能依赖
 * Prompt 中的一句“请谨慎”，必须在模型之外用代码强制拦截。
 */
export async function runAdvancedExercise(
  request = "研究 Agent Harness，并发布一份报告",
  options: SafeAgentOptions = {},
): Promise<SafeAgentResult> {
  const startedAt = Date.now();
  const maxSteps = options.maxSteps ?? 5;
  const timeoutMs = options.timeoutMs ?? 2_000;
  const events: SafeAgentEvent[] = [];
  let step = 0;
  let toolCalls = 0;

  const record = (
    type: SafeAgentEvent["type"],
    detail: string,
    durationMs?: number,
  ): void => {
    events.push({ step, type, detail, durationMs });
  };

  const nextStep = (): void => {
    step += 1;
    if (step > maxSteps) {
      throw new Error(`Agent 超过 ${maxSteps} 步预算，已强制停止`);
    }
  };

  nextStep();
  const shouldPublish = /发布|publish/iu.test(request);
  record(
    "plan",
    shouldPublish
      ? "计划：检索证据 → 写报告 → Reviewer 评分 → 请求发布审批"
      : "计划：检索证据 → 写报告 → Reviewer 评分",
  );

  nextStep();
  const searchStartedAt = Date.now();
  const searchInput = tools.search_notes.schema.parse({ query: request });
  const hits = await withTimeout(tools.search_notes.execute(searchInput), timeoutMs);
  toolCalls += 1;
  record(
    "tool",
    `search_notes 返回 ${hits.length} 条证据`,
    Date.now() - searchStartedAt,
  );

  nextStep();
  const evidence = hits.map((hit) => `- ${hit.excerpt} [${hit.title}](${hit.source})`).join("\n");
  const report = [
    "结论：应先构建可测试的单 Agent，再根据失败数据增加 Harness 能力。",
    `证据：\n${evidence || "- 本地资料暂无相关证据。"}`,
    "限制：本报告只使用本地笔记，未验证外部最新资料。",
  ].join("\n\n");
  const review = reviewReport(report, hits.length > 0);
  record("review", `${review.feedback} Reviewer 得分 ${review.score}/100`);

  if (review.score < 80) {
    record("stop", "质量门禁未通过，禁止进入发布步骤");
    return {
      status: "completed",
      output: report,
      qualityScore: review.score,
      events,
      metrics: {
        steps: step,
        toolCalls,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  if (shouldPublish) {
    nextStep();
    // 重点：权限判断位于工具执行之前，而且由确定性代码完成。
    if (!options.approvePublish) {
      record("approval", "publish_report 是写操作，需要人工明确批准");
      return {
        status: "approval_required",
        output: report,
        qualityScore: review.score,
        events,
        metrics: {
          steps: step,
          toolCalls,
          durationMs: Date.now() - startedAt,
        },
      };
    }

    const publishInput = tools.publish_report.schema.parse({
      title: "Agent Harness 学习报告",
      body: report,
    });
    const publishStartedAt = Date.now();
    await withTimeout(tools.publish_report.execute(publishInput), timeoutMs);
    toolCalls += 1;
    record("tool", "publish_report 已在批准后执行", Date.now() - publishStartedAt);
  }

  record("stop", "任务完成，保存 Trace 与指标");
  return {
    status: "completed",
    output: report,
    qualityScore: review.score,
    events,
    metrics: {
      steps: step,
      toolCalls,
      durationMs: Date.now() - startedAt,
    },
  };
}

/*
 * 重点练习：
 *
 * TODO 1：增加 delete_file 高风险工具，验证未批准时永远不会进入 execute。
 * TODO 2：把确定性 plan 替换为模型输出，但必须用 Zod 校验计划 Schema。
 * TODO 3：给每个工具增加 cost 字段，实现“步数 + 金额”双预算。
 * TODO 4：把 Reviewer 替换为规则 + LLM-as-Judge，并用人工样本校准偏差。
 * TODO 5：把 events 写入 JSONL，建立失败分类和可回放机制。
 * TODO 6：针对 prompt injection 构造红队用例，确认外部文本不能修改权限。
 */

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const approvePublish = args.includes("--approve");
  const request = args.filter((arg) => arg !== "--approve").join(" ")
    || "研究 Agent Harness，并发布一份报告";

  runAdvancedExercise(request, { approvePublish })
    .then((result) => {
      console.log("=== Safe Agent Trace ===");
      result.events.forEach((event) => console.log(JSON.stringify(event)));
      console.log("\n=== Metrics ===");
      console.log(JSON.stringify(result.metrics, null, 2));
      console.log(`\n状态：${result.status}，质量分：${result.qualityScore}`);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
