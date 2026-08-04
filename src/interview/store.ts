import { and, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { interviewSeed } from "../content/interview-seed.js";
import { getDb } from "../db/client.js";
import { interviewQuestions, interviewVotes } from "../db/schema.js";

export type VoteValue = "useful" | "useless";

export type RecruitType = "校招" | "社招";

export type InterviewQuestion = {
  id: string;
  title: string;
  prompt: string;
  answerHint: string;
  tags: string[];
  companies: string[];
  recruitType: RecruitType;
  /** @deprecated kept for backward compat; prefer usefulVotes */
  votes: number;
  usefulVotes: number;
  uselessVotes: number;
  adminBoost: number;
  hotScore: number;
  source: "admin" | "user" | "system";
  authorId: string;
  authorName: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizeRecruitType(value: string): RecruitType {
  return value === "社招" ? "社招" : "校招";
}

function computeHotScore(question: Omit<InterviewQuestion, "hotScore">): number {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(question.createdAt).getTime()) / (1000 * 60 * 60),
  );
  const recency = Math.max(0, 24 - Math.min(ageHours, 24)) * 0.15;
  const netUseful = question.usefulVotes * 3 - question.uselessVotes * 2;
  return Number(
    (
      netUseful +
      question.adminBoost * 5 +
      (question.featured ? 25 : 0) +
      recency
    ).toFixed(2),
  );
}

function toQuestion(row: typeof interviewQuestions.$inferSelect): InterviewQuestion {
  const base = {
    id: row.id,
    title: row.title,
    prompt: row.prompt,
    answerHint: row.answerHint ?? "",
    tags: row.tags ?? [],
    companies: row.companies ?? [],
    recruitType: normalizeRecruitType(row.recruitType),
    votes: row.usefulVotes,
    usefulVotes: row.usefulVotes,
    uselessVotes: row.uselessVotes,
    adminBoost: row.adminBoost,
    source: row.source as InterviewQuestion["source"],
    authorId: row.authorId,
    authorName: row.authorName,
    featured: Boolean(row.featured),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return { ...base, hotScore: computeHotScore(base) };
}

async function ensureInterviewSeed(): Promise<void> {
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(interviewQuestions);
  if (Number(value) > 0) return;

  const stamped = new Date().toISOString();
  await db.insert(interviewQuestions).values(
    interviewSeed.map((item, index) => ({
      id: `seed-${index + 1}`,
      title: item.title,
      prompt: item.prompt,
      answerHint: item.answerHint,
      tags: item.tags,
      companies: item.companies,
      recruitType: item.recruitType,
      usefulVotes: 3 + ((index * 2) % 5),
      uselessVotes: index % 2,
      adminBoost: item.adminBoost,
      source: "system",
      authorId: "system",
      authorName: "系统精选",
      featured: index < 3,
      createdAt: stamped,
      updatedAt: stamped,
    })),
  );
}

export function sortByHot(questions: InterviewQuestion[]): InterviewQuestion[] {
  return [...questions].sort((a, b) => {
    if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function listInterviewQuestions(): Promise<InterviewQuestion[]> {
  await ensureInterviewSeed();
  const db = getDb();
  const rows = await db.select().from(interviewQuestions);
  return sortByHot(rows.map(toQuestion));
}

export async function createInterviewQuestion(input: {
  title: string;
  prompt: string;
  answerHint?: string;
  tags?: string[];
  companies?: string[];
  recruitType: RecruitType;
  authorId: string;
  authorName: string;
  source: "admin" | "user";
  featured?: boolean;
  adminBoost?: number;
}): Promise<{ ok: true; question: InterviewQuestion } | { ok: false; error: string }> {
  const title = input.title.trim();
  const prompt = input.prompt.trim();
  if (title.length < 4 || title.length > 120) {
    return { ok: false, error: "题目标题需为 4–120 字" };
  }
  if (prompt.length < 12 || prompt.length > 4_000) {
    return { ok: false, error: "题目内容需为 12–4000 字" };
  }
  if (input.recruitType !== "校招" && input.recruitType !== "社招") {
    return { ok: false, error: "请选择校招或社招" };
  }

  const companies = (input.companies ?? [])
    .map((company) => company.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (companies.length === 0) {
    return { ok: false, error: "请至少填写一家公司" };
  }

  await ensureInterviewSeed();
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(interviewQuestions);
  if (Number(value) >= 500) {
    return { ok: false, error: "题库已满，请先清理旧题" };
  }

  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    title,
    prompt,
    answerHint: (input.answerHint ?? "").trim().slice(0, 1_000),
    tags: (input.tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6),
    companies,
    recruitType: input.recruitType,
    usefulVotes: 0,
    uselessVotes: 0,
    adminBoost: input.source === "admin" ? (input.adminBoost ?? 6) : 0,
    source: input.source,
    authorId: input.authorId,
    authorName: input.authorName,
    featured: input.source === "admin" ? Boolean(input.featured) : false,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(interviewQuestions).values(row);
  return { ok: true, question: toQuestion(row) };
}

export async function voteInterviewQuestion(
  id: string,
  voterKey: string,
  value: VoteValue,
): Promise<
  | { ok: true; question: InterviewQuestion; previous: VoteValue | null }
  | { ok: false; error: string }
> {
  const db = getDb();
  const questions = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, id))
    .limit(1);
  const question = questions[0];
  if (!question) return { ok: false, error: "题目不存在" };

  const previousRows = await db
    .select()
    .from(interviewVotes)
    .where(and(eq(interviewVotes.questionId, id), eq(interviewVotes.voterKey, voterKey)))
    .limit(1);
  const previous = (previousRows[0]?.value as VoteValue | undefined) ?? null;

  if (previous === value) {
    return { ok: false, error: value === "useful" ? "你已经投过「有用」" : "你已经投过「没用」" };
  }

  let usefulVotes = question.usefulVotes;
  let uselessVotes = question.uselessVotes;
  if (previous === "useful") usefulVotes = Math.max(0, usefulVotes - 1);
  if (previous === "useless") uselessVotes = Math.max(0, uselessVotes - 1);
  if (value === "useful") usefulVotes += 1;
  if (value === "useless") uselessVotes += 1;

  const updatedAt = new Date().toISOString();
  await db
    .update(interviewQuestions)
    .set({ usefulVotes, uselessVotes, updatedAt })
    .where(eq(interviewQuestions.id, id));

  if (previous) {
    await db
      .update(interviewVotes)
      .set({ value })
      .where(and(eq(interviewVotes.questionId, id), eq(interviewVotes.voterKey, voterKey)));
  } else {
    await db.insert(interviewVotes).values({ questionId: id, voterKey, value });
  }

  return {
    ok: true,
    question: toQuestion({ ...question, usefulVotes, uselessVotes, updatedAt }),
    previous,
  };
}

export async function updateInterviewQuestion(
  id: string,
  patch: {
    featured?: boolean;
    adminBoost?: number;
    title?: string;
    prompt?: string;
    answerHint?: string;
  },
): Promise<{ ok: true; question: InterviewQuestion } | { ok: false; error: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, id))
    .limit(1);
  const question = rows[0];
  if (!question) return { ok: false, error: "题目不存在" };

  const next = { ...question };
  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (title.length < 4 || title.length > 120) return { ok: false, error: "题目标题需为 4–120 字" };
    next.title = title;
  }
  if (patch.prompt !== undefined) {
    const prompt = patch.prompt.trim();
    if (prompt.length < 12 || prompt.length > 4_000) {
      return { ok: false, error: "题目内容需为 12–4000 字" };
    }
    next.prompt = prompt;
  }
  if (patch.answerHint !== undefined) next.answerHint = patch.answerHint.trim().slice(0, 1_000);
  if (patch.featured !== undefined) next.featured = patch.featured;
  if (patch.adminBoost !== undefined) {
    next.adminBoost = Math.max(0, Math.min(20, Math.round(patch.adminBoost)));
  }
  next.updatedAt = new Date().toISOString();

  await db
    .update(interviewQuestions)
    .set({
      title: next.title,
      prompt: next.prompt,
      answerHint: next.answerHint,
      featured: next.featured,
      adminBoost: next.adminBoost,
      updatedAt: next.updatedAt,
    })
    .where(eq(interviewQuestions.id, id));

  return { ok: true, question: toQuestion(next) };
}

export async function deleteInterviewQuestion(
  id: string,
  actor: { userId: string; isAdmin: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const rows = await db
    .select()
    .from(interviewQuestions)
    .where(eq(interviewQuestions.id, id))
    .limit(1);
  const question = rows[0];
  if (!question) return { ok: false, error: "题目不存在" };
  if (!actor.isAdmin && question.authorId !== actor.userId) {
    return { ok: false, error: "只能删除自己上传的题目" };
  }
  if (question.source === "system" && !actor.isAdmin) {
    return { ok: false, error: "系统精选题仅管理员可删除" };
  }

  await db.delete(interviewQuestions).where(eq(interviewQuestions.id, id));
  return { ok: true };
}
