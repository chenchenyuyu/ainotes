import { searchNotes, type NoteHit } from "../core/notes.js";

export type ResearchTrace =
  | { step: "rewrite"; detail: string }
  | { step: "retrieve"; detail: string; hitCount: number }
  | { step: "ground"; detail: string; valid: boolean };

export type GroundedAnswer = {
  answer: string;
  citations: Array<{ title: string; source: string }>;
  trace: ResearchTrace[];
};

type Retriever = (query: string, limit?: number) => Promise<NoteHit[]>;

function rewriteQuery(question: string): string {
  return question
    .replace(/[？?。！!]/gu, " ")
    .replace(/什么是|请解释|如何理解/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function validateCitations(answer: string, hits: NoteHit[]): boolean {
  const allowedSources = new Set(hits.map((hit) => hit.source));
  const citedSources = [...answer.matchAll(/\]\(([^)]+)\)/gu)].map((match) => match[1]);
  return citedSources.length > 0 && citedSources.every((source) => allowedSources.has(source));
}

/**
 * 中级练习：最小 Grounded Research Agent。
 *
 * 重点不是“生成一段像答案的文字”，而是建立可验证的数据流：
 * query rewrite → retrieve → answer with citations → citation validation。
 */
export async function runIntermediateExercise(
  question = "Agent loop 是什么？",
  retrieve: Retriever = (query, limit = 3) => searchNotes(query, undefined, limit),
): Promise<GroundedAnswer> {
  if (question.trim().length < 2) {
    throw new Error("问题至少需要两个字符");
  }

  const trace: ResearchTrace[] = [];
  const query = rewriteQuery(question);
  trace.push({ step: "rewrite", detail: `检索查询：${query}` });

  const hits = await retrieve(query, 3);
  trace.push({
    step: "retrieve",
    detail: hits.length > 0 ? "已找到本地证据" : "本地知识库没有相关证据",
    hitCount: hits.length,
  });

  // 重点：无证据时拒答比让模型凭参数记忆补全更可靠。
  if (hits.length === 0) {
    trace.push({ step: "ground", detail: "无引用可验证，返回明确拒答", valid: false });
    return {
      answer: "本地资料中没有足够证据回答这个问题。请补充资料或调整查询。",
      citations: [],
      trace,
    };
  }

  const citations = hits.map(({ title, source }) => ({ title, source }));
  const evidence = hits
    .map((hit) => `${hit.excerpt} [${hit.title}](${hit.source})`)
    .join("\n");
  const answer = `根据本地资料，与你的问题最相关的证据如下：\n${evidence}`;
  const valid = validateCitations(answer, hits);
  trace.push({
    step: "ground",
    detail: valid ? "所有引用都来自本次检索结果" : "检测到无效引用",
    valid,
  });

  if (!valid) {
    throw new Error("引用校验失败：回答包含检索结果之外的来源");
  }

  return { answer, citations, trace };
}

/*
 * 重点练习：
 *
 * TODO 1：把 searchNotes 替换为向量检索，但保持 Retriever 接口不变。
 *         用同一批 eval 比较命中率、延迟和成本，不要只凭主观感受。
 * TODO 2：加入 chunkId、起止行、文档时间等 metadata，并把引用定位到片段。
 * TODO 3：让真实模型根据 hits 生成摘要；系统提示必须要求“只能使用给定证据”。
 * TODO 4：构造一个不存在的 source，确认 validateCitations 会阻止输出。
 * TODO 5：加入冲突证据检测，不能简单拼接互相矛盾的结论。
 */

if (import.meta.url === `file://${process.argv[1]}`) {
  const question = process.argv.slice(2).join(" ") || "Agent loop 是什么？";
  runIntermediateExercise(question)
    .then((result) => {
      console.log("=== Research Trace ===");
      result.trace.forEach((event) => console.log(JSON.stringify(event)));
      console.log("\n=== Grounded Answer ===");
      console.log(result.answer);
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
