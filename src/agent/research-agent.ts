import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

import { searchNotes } from "../core/notes.js";
import "./network.js";

const noteSearch = tool({
  name: "search_notes",
  description:
    "Search the learner's local Markdown notes. Use this before making claims about saved material.",
  parameters: z.object({
    query: z.string().min(2).max(300),
    limit: z.number().int().min(1).max(8).default(5),
  }),
  async execute({ query, limit }) {
    return searchNotes(query, undefined, limit);
  },
});

const outlineAgent = new Agent({
  name: "Research planner",
  instructions:
    "Turn the question into a short research outline. Identify missing evidence. Do not invent sources.",
});

export const researchAgent = new Agent({
  name: "AI learning research assistant",
  instructions: [
    "Help a senior frontend developer learn AI agent engineering.",
    "Search local notes before answering questions about the curriculum.",
    "Cite local evidence as [title](source).",
    "Clearly label assumptions and say when evidence is missing.",
    "Keep the answer actionable and under 800 Chinese characters unless asked for detail.",
  ].join("\n"),
  tools: [noteSearch],
  handoffs: [outlineAgent],
});

export async function answerResearchQuestion(question: string): Promise<string> {
  if (question.trim().length < 2) {
    throw new Error("Question must contain at least two characters");
  }

  const result = await run(researchAgent, question, { maxTurns: 8 });
  if (!result.finalOutput) {
    throw new Error("Agent completed without a final answer");
  }
  return result.finalOutput;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const question = process.argv.slice(2).join(" ") || "本周应该学习什么？";
  answerResearchQuestion(question)
    .then(console.log)
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
