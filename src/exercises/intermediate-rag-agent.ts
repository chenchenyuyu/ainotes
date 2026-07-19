import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { searchNotes } from "../core/notes.js";

const VECTOR_DIMENSIONS = 384;
const CHUNK_LINES = 6;
const CHUNK_OVERLAP_LINES = 2;

export type EvidenceMetadata = {
  chunkId: string;
  documentSource: string;
  startLine: number;
  endLine: number;
  modifiedAt: string;
};

export type EvidenceHit = {
  title: string;
  excerpt: string;
  source: string;
  score: number;
  metadata: EvidenceMetadata;
};

export type EvidenceConflict = {
  leftSource: string;
  rightSource: string;
  reason: string;
};

export type ResearchTrace =
  | { step: "rewrite"; detail: string }
  | { step: "retrieve"; detail: string; hitCount: number }
  | { step: "conflict"; detail: string; conflictCount: number }
  | { step: "summarize"; detail: string; model: "local" | "openai" }
  | { step: "ground"; detail: string; valid: boolean };

export type GroundedAnswer = {
  answer: string;
  citations: Array<{
    title: string;
    source: string;
    chunkId: string;
    lines: string;
  }>;
  conflicts: EvidenceConflict[];
  trace: ResearchTrace[];
};

export type Retriever = (query: string, limit?: number) => Promise<EvidenceHit[]>;
export type Summarizer = (
  question: string,
  hits: EvidenceHit[],
  conflicts: EvidenceConflict[],
) => Promise<string>;

function rewriteQuery(question: string): string {
  return question
    .replace(/[？?。！!]/gu, " ")
    .replace(/什么是|请解释|如何理解/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * 将中英文文本转换成固定维度的本地向量。
 *
 * 重点学习：
 * - 英文使用单词，中文补充 2 字符 n-gram，避免整句中文只得到一个 token。
 * - Hashing trick 不需要词表，适合无 API Key 的教学；生产环境可替换成 embedding API。
 * - 最后的 L2 归一化让点积等价于余弦相似度。
 */
function embedLocally(text: string): number[] {
  const normalized = text.toLocaleLowerCase().replace(/\s+/gu, " ").trim();
  const words = normalized.match(/[a-z0-9_-]{2,}|[\p{Script=Han}]/gu) ?? [];
  const chinese = [...normalized.replace(/[^\p{Script=Han}]/gu, "")];
  const chineseBigrams = chinese.slice(0, -1).map((character, index) =>
    `${character}${chinese[index + 1]}`,
  );
  const features = [...words, ...chineseBigrams];
  const vector = Array.from({ length: VECTOR_DIMENSIONS }, () => 0);

  for (const feature of features) {
    let hash = 2_166_136_261;
    for (const character of feature) {
      hash ^= character.codePointAt(0) ?? 0;
      hash = Math.imul(hash, 16_777_619);
    }
    vector[(hash >>> 0) % VECTOR_DIMENSIONS] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((total, value) => total + value ** 2, 0));
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

function cosineSimilarity(left: number[], right: number[]): number {
  return left.reduce((total, value, index) => total + value * (right[index] ?? 0), 0);
}

/**
 * 按行切 Chunk，并把可定位引用需要的 metadata 一起保存。
 *
 * 重叠行可以减少关键信息刚好落在 Chunk 边界时的语义损失；代价是索引体积增大。
 */
function chunkDocument(
  content: string,
  documentSource: string,
  modifiedAt: string,
): EvidenceHit[] {
  const lines = content.split("\n");
  const title = content.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(documentSource);
  const chunks: EvidenceHit[] = [];
  const stride = CHUNK_LINES - CHUNK_OVERLAP_LINES;

  for (let start = 0; start < lines.length; start += stride) {
    const end = Math.min(start + CHUNK_LINES, lines.length);
    const excerpt = lines.slice(start, end).join("\n").trim();
    if (!excerpt) continue;

    const startLine = start + 1;
    const endLine = end;
    const chunkId = `${documentSource}:${startLine}-${endLine}`;
    chunks.push({
      title,
      excerpt,
      source: `${documentSource}#L${startLine}-L${endLine}`,
      score: 0,
      metadata: {
        chunkId,
        documentSource,
        startLine,
        endLine,
        modifiedAt,
      },
    });
  }

  return chunks;
}

/**
 * 完成 TODO 1 + 2：本地向量检索，接口仍然满足 Retriever。
 *
 * 旧版关键词检索保留作对照：
 * const oldRetriever: Retriever =
 *   (query, limit = 3) => searchNotes(query, undefined, limit);
 *
 * 新旧实现拥有相同调用形状，因此可直接复用同一组评估，不改 Agent 主流程。
 */
export async function vectorSearchNotes(
  query: string,
  limit = 3,
  notesDirectory = path.join(process.cwd(), "data", "notes"),
): Promise<EvidenceHit[]> {
  const queryVector = embedLocally(query);
  const files = (await readdir(notesDirectory)).filter((file) => file.endsWith(".md"));
  const documents = await Promise.all(
    files.map(async (file) => {
      const absoluteSource = path.join(notesDirectory, file);
      const [content, fileStat] = await Promise.all([
        readFile(absoluteSource, "utf8"),
        stat(absoluteSource),
      ]);
      return chunkDocument(
        content,
        path.relative(process.cwd(), absoluteSource),
        fileStat.mtime.toISOString(),
      );
    }),
  );

  return documents
    .flat()
    .map((hit) => ({
      ...hit,
      score: cosineSimilarity(queryVector, embedLocally(hit.excerpt)),
    }))
    .filter((hit) => hit.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

type RetrievalEvalCase = {
  id: string;
  query: string;
  expectedSource: string;
  expectedTerms: string[];
};

export type RetrieverBenchmark = {
  name: "keyword" | "local-vector";
  total: number;
  passed: number;
  passRate: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  estimatedApiCostUsd: number;
  failedCaseIds: string[];
};

/**
 * 使用完全相同的 50 条 Eval 比较旧关键词检索与新向量检索。
 *
 * 重点：比较实现时不能更换题目或验收标准，否则提升可能只是测试集变化。
 * 两种本地实现都不调用外部 API，所以估算 API 成本为 0；接入真实 Embedding
 * 后，应在这里根据 token 用量计算成本。
 */
export async function compareRetrievers(
  evalFile = path.join(process.cwd(), "data", "evals", "retrieval.jsonl"),
): Promise<RetrieverBenchmark[]> {
  const cases = (await readFile(evalFile, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as RetrievalEvalCase);

  const candidates = [
    {
      name: "keyword" as const,
      retrieve: (query: string) => searchNotes(query),
    },
    {
      name: "local-vector" as const,
      retrieve: (query: string) => vectorSearchNotes(query, 5),
    },
  ];

  return Promise.all(
    candidates.map(async ({ name, retrieve }) => {
      const results = [];
      for (const testCase of cases) {
        const startedAt = performance.now();
        const hits = await retrieve(testCase.query);
        const latencyMs = performance.now() - startedAt;
        const topDocument = hits[0]?.source.split("#")[0] ?? "";
        const combined = hits
          .map((hit) => `${hit.title}\n${hit.excerpt}`)
          .join("\n")
          .toLocaleLowerCase();
        const passed =
          topDocument.endsWith(testCase.expectedSource) &&
          testCase.expectedTerms.every((term) =>
            combined.includes(term.toLocaleLowerCase()),
          );
        results.push({ id: testCase.id, passed, latencyMs });
      }

      const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
      const passed = results.filter((result) => result.passed).length;
      const averageLatency =
        latencies.reduce((total, latency) => total + latency, 0) / latencies.length;
      const p95Index = Math.max(0, Math.ceil(latencies.length * 0.95) - 1);
      return {
        name,
        total: results.length,
        passed,
        passRate: passed / results.length,
        averageLatencyMs: Math.round(averageLatency * 100) / 100,
        p95LatencyMs: Math.round((latencies[p95Index] ?? 0) * 100) / 100,
        estimatedApiCostUsd: 0,
        failedCaseIds: results
          .filter((result) => !result.passed)
          .map((result) => result.id),
      };
    }),
  );
}

function conflictTerms(text: string): Set<string> {
  const normalized = text.toLocaleLowerCase();
  const english = normalized.match(/[a-z0-9_-]{3,}/gu) ?? [];
  const chinese = [...normalized.replace(/[^\p{Script=Han}]/gu, "")];
  const bigrams = chinese.slice(0, -1).map((character, index) =>
    `${character}${chinese[index + 1]}`,
  );
  return new Set([...english, ...bigrams]);
}

function termSimilarity(left: string, right: string): number {
  const leftTerms = conflictTerms(left);
  const rightTerms = conflictTerms(right);
  if (leftTerms.size === 0 || rightTerms.size === 0) return 0;
  const intersection = [...leftTerms].filter((term) => rightTerms.has(term)).length;
  const union = new Set([...leftTerms, ...rightTerms]).size;
  return intersection / union;
}

/**
 * 完成 TODO 5：检测“讨论同一主题但立场相反”的候选证据。
 *
 * 这是可解释的规则基线，不等于完整 NLI 模型。它宁可提示用户复核，也不会擅自
 * 选择其中一条。生产环境可用自然语言推断模型替换，但输出接口应保持不变。
 */
export function detectConflicts(hits: EvidenceHit[]): EvidenceConflict[] {
  const conflicts: EvidenceConflict[] = [];
  const hasNegation = (text: string): boolean =>
    /不应|不能|禁止|并非|不是|not|never|must not/iu.test(text);

  for (let left = 0; left < hits.length; left += 1) {
    for (let right = left + 1; right < hits.length; right += 1) {
      const leftHit = hits[left];
      const rightHit = hits[right];
      const similarTopic = termSimilarity(leftHit.excerpt, rightHit.excerpt) >= 0.35;
      const oppositeStance = hasNegation(leftHit.excerpt) !== hasNegation(rightHit.excerpt);

      if (similarTopic && oppositeStance) {
        conflicts.push({
          leftSource: leftHit.source,
          rightSource: rightHit.source,
          reason: "两段证据主题高度重合，但只有一段包含明确否定表达。",
        });
      }
    }
  }

  return conflicts;
}

export function validateCitations(answer: string, hits: EvidenceHit[]): boolean {
  const allowedSources = new Set(hits.map((hit) => hit.source));
  const citedSources = [...answer.matchAll(/\]\(([^)]+)\)/gu)].map((match) => match[1]);
  return citedSources.length > 0 && citedSources.every((source) => allowedSources.has(source));
}

const summarizeLocally: Summarizer = async (_question, hits, conflicts) => {
  const conflictWarning =
    conflicts.length > 0
      ? `⚠️ 检测到 ${conflicts.length} 组潜在冲突证据，请人工复核后再下结论。\n`
      : "";
  const evidence = hits
    .map((hit) => `${hit.excerpt} [${hit.title}](${hit.source})`)
    .join("\n");
  return `${conflictWarning}根据本地资料，与你的问题最相关的证据如下：\n${evidence}`;
};

/**
 * 完成 TODO 3：真实模型摘要入口。
 *
 * 重点：模型只负责“根据证据组织语言”，不能自行扩展来源。即使 Prompt 被绕过，
 * 后面的 validateCitations 仍会用确定性白名单阻止伪造 source。
 */
export const summarizeWithOpenAI: Summarizer = async (question, hits, conflicts) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("使用 --real-model 前请配置 OPENAI_API_KEY");
  }

  await import("../agent/network.js");
  const { Agent, run } = await import("@openai/agents");
  const allowedSources = hits.map((hit) => hit.source);
  const evidence = hits
    .map((hit) => `SOURCE: ${hit.source}\nTITLE: ${hit.title}\nCONTENT:\n${hit.excerpt}`)
    .join("\n\n---\n\n");
  const agent = new Agent({
    name: "Grounded summarizer",
    instructions: [
      "只能使用用户消息中 EVIDENCE 区域提供的事实。",
      "每个事实后必须使用 Markdown 链接引用对应的 SOURCE，链接必须逐字复制。",
      "不得使用模型记忆补充事实，不得创建新 URL；证据不足时明确说明。",
      "如果存在 CONFLICTS，必须分别陈述双方证据，不得擅自选择一方。",
    ].join("\n"),
  });
  const result = await run(
    agent,
    [
      `QUESTION:\n${question}`,
      `ALLOWED SOURCES:\n${allowedSources.join("\n")}`,
      `CONFLICTS:\n${JSON.stringify(conflicts, null, 2)}`,
      `EVIDENCE:\n${evidence}`,
    ].join("\n\n"),
    { maxTurns: 2 },
  );

  if (!result.finalOutput) {
    throw new Error("真实模型没有返回摘要");
  }
  return result.finalOutput;
};

/**
 * 中级练习：Grounded Research Agent 完整数据流。
 *
 * query rewrite → vector retrieve → conflict detection → summarize →
 * citation allowlist validation。
 */
export async function runIntermediateExercise(
  question = "Agent loop 是什么？",
  retrieve: Retriever = vectorSearchNotes,
  summarize: Summarizer = summarizeLocally,
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
    detail: hits.length > 0 ? "向量检索已找到本地证据" : "本地知识库没有相关证据",
    hitCount: hits.length,
  });

  // 重点：无证据时拒答比让模型凭参数记忆补全更可靠。
  if (hits.length === 0) {
    trace.push({ step: "ground", detail: "无引用可验证，返回明确拒答", valid: false });
    return {
      answer: "本地资料中没有足够证据回答这个问题。请补充资料或调整查询。",
      citations: [],
      conflicts: [],
      trace,
    };
  }

  const conflicts = detectConflicts(hits);
  trace.push({
    step: "conflict",
    detail:
      conflicts.length > 0
        ? "发现潜在冲突，摘要必须同时保留双方证据"
        : "未发现明显冲突证据",
    conflictCount: conflicts.length,
  });

  const citations = hits.map(({ title, source, metadata }) => ({
    title,
    source,
    chunkId: metadata.chunkId,
    lines: `${metadata.startLine}-${metadata.endLine}`,
  }));

  /*
   * 旧版对照：直接拼接 excerpt，可靠但不能形成自然摘要。
   *
   * const evidence = hits
   *   .map((hit) => `${hit.excerpt} [${hit.title}](${hit.source})`)
   *   .join("\n");
   * const answer = `根据本地资料：\n${evidence}`;
   *
   * 新版把摘要器作为可注入依赖：默认本地确定性实现，--real-model 时换成 OpenAI。
   */
  const answer = await summarize(question, hits, conflicts);
  trace.push({
    step: "summarize",
    detail: summarize === summarizeWithOpenAI ? "真实模型已根据限定证据生成摘要" : "本地摘要已生成",
    model: summarize === summarizeWithOpenAI ? "openai" : "local",
  });

  // 完成 TODO 4：白名单校验是模型外的最后一道门禁；对应伪造来源测试见 tests。
  const valid = validateCitations(answer, hits);
  trace.push({
    step: "ground",
    detail: valid ? "所有引用都来自本次检索结果" : "检测到缺失或伪造引用",
    valid,
  });

  if (!valid) {
    throw new Error("引用校验失败：回答缺少引用或包含检索结果之外的来源");
  }

  return { answer, citations, conflicts, trace };
}

/*
 * 已完成的重点练习：
 *
 * DONE 1：vectorSearchNotes 使用本地 Hash Embedding + 余弦相似度，保持 Retriever 接口。
 *         compareRetrievers 用同一批 Eval 输出通过率、平均/P95 延迟和 API 成本。
 * DONE 2：EvidenceMetadata 增加 chunkId、起止行、文档时间，source 可定位到行。
 * DONE 3：summarizeWithOpenAI 只接收检索证据，默认模式仍可离线学习。
 * DONE 4：validateCitations 使用 source 白名单，测试覆盖伪造链接。
 * DONE 5：detectConflicts 标记潜在矛盾，并要求摘要保留双方证据。
 *
 * 下一步挑战：用真实 Embedding API 替换 embedLocally，并在同一 eval 上记录
 * Recall@K、MRR、P95 延迟和单次查询成本，确认升级确实优于本地基线。
 */

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const useRealModel = args.includes("--real-model");
  const runBenchmark = args.includes("--benchmark");
  const question =
    args
      .filter((argument) => !["--real-model", "--benchmark"].includes(argument))
      .join(" ") || "Agent loop 是什么？";

  const execution = runBenchmark
    ? compareRetrievers().then((benchmark) => {
        console.log("=== Keyword vs Local Vector Benchmark ===");
        console.log(JSON.stringify(benchmark, null, 2));
      })
    : runIntermediateExercise(
        question,
        vectorSearchNotes,
        useRealModel ? summarizeWithOpenAI : summarizeLocally,
      ).then((result) => {
        console.log("=== Research Trace ===");
        result.trace.forEach((event) => console.log(JSON.stringify(event)));
        console.log("\n=== Citation Metadata ===");
        console.log(JSON.stringify(result.citations, null, 2));
        console.log("\n=== Grounded Answer ===");
        console.log(result.answer);
      });

  execution
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
