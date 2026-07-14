import { readFile } from "node:fs/promises";
import path from "node:path";

import { searchNotes } from "../core/notes.js";

type EvalCase = {
  id: string;
  query: string;
  expectedSource: string;
  expectedTerms: string[];
};

type CaseResult = EvalCase & {
  passed: boolean;
  topSource: string | null;
  latencyMs: number;
  reason?: string;
};

async function loadCases(): Promise<EvalCase[]> {
  const file = path.join(process.cwd(), "data", "evals", "retrieval.jsonl");
  const content = await readFile(file, "utf8");
  return content
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as EvalCase);
}

async function evaluate(testCase: EvalCase): Promise<CaseResult> {
  const started = performance.now();
  const hits = await searchNotes(testCase.query);
  const top = hits[0];
  const combined = hits.map((hit) => `${hit.title}\n${hit.excerpt}`).join("\n").toLowerCase();
  const sourcePassed = top?.source.endsWith(testCase.expectedSource) ?? false;
  const termsPassed = testCase.expectedTerms.every((term) =>
    combined.includes(term.toLowerCase()),
  );

  return {
    ...testCase,
    passed: sourcePassed && termsPassed,
    topSource: top?.source ?? null,
    latencyMs: Math.round((performance.now() - started) * 100) / 100,
    reason: sourcePassed && termsPassed ? undefined : "source or expected term mismatch",
  };
}

const cases = await loadCases();
const results = await Promise.all(cases.map(evaluate));
const passed = results.filter((result) => result.passed).length;
const latency = results.reduce((total, result) => total + result.latencyMs, 0) / results.length;

console.log(
  JSON.stringify(
    {
      summary: {
        total: results.length,
        passed,
        passRate: passed / results.length,
        averageLatencyMs: Math.round(latency * 100) / 100,
      },
      failures: results.filter((result) => !result.passed),
    },
    null,
    2,
  ),
);

if (passed !== results.length) process.exitCode = 1;
