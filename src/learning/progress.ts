import { eq } from "drizzle-orm";

import { getDb } from "../db/client.js";
import { userProgress } from "../db/schema.js";

export type UserProgress = {
  scores: Record<number, number>;
  completedTasks: Record<number, string[]>;
  answers: Record<number, Record<string, string>>;
  updatedAt: string;
};

function toNumberKeyedScores(raw: Record<string, number> | null | undefined): Record<number, number> {
  const scores: Record<number, number> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    scores[Number(key)] = value;
  }
  return scores;
}

function toNumberKeyedTasks(
  raw: Record<string, string[]> | null | undefined,
): Record<number, string[]> {
  const tasks: Record<number, string[]> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    tasks[Number(key)] = value;
  }
  return tasks;
}

function toNumberKeyedAnswers(
  raw: Record<string, Record<string, string>> | null | undefined,
): Record<number, Record<string, string>> {
  const answers: Record<number, Record<string, string>> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    answers[Number(key)] = value;
  }
  return answers;
}

function stringifyKeyed<T>(raw: Record<number, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [String(key), value]));
}

export function emptyProgress(): UserProgress {
  return {
    scores: {},
    completedTasks: {},
    answers: {},
    updatedAt: new Date().toISOString(),
  };
}

export async function readProgress(userId: string): Promise<UserProgress> {
  const db = getDb();
  const rows = await db.select().from(userProgress).where(eq(userProgress.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return emptyProgress();
  return {
    scores: toNumberKeyedScores(row.scores),
    completedTasks: toNumberKeyedTasks(row.completedTasks),
    answers: toNumberKeyedAnswers(row.answers),
    updatedAt: row.updatedAt,
  };
}

export async function writeProgress(userId: string, progress: UserProgress): Promise<UserProgress> {
  const next: UserProgress = {
    scores: progress.scores,
    completedTasks: progress.completedTasks,
    answers: progress.answers,
    updatedAt: new Date().toISOString(),
  };

  const db = getDb();
  await db
    .insert(userProgress)
    .values({
      userId,
      scores: stringifyKeyed(next.scores),
      completedTasks: stringifyKeyed(next.completedTasks),
      answers: stringifyKeyed(next.answers),
      updatedAt: next.updatedAt,
    })
    .onConflictDoUpdate({
      target: userProgress.userId,
      set: {
        scores: stringifyKeyed(next.scores),
        completedTasks: stringifyKeyed(next.completedTasks),
        answers: stringifyKeyed(next.answers),
        updatedAt: next.updatedAt,
      },
    });

  return next;
}

export async function mergeProgress(
  userId: string,
  patch: Partial<Omit<UserProgress, "updatedAt">>,
): Promise<UserProgress> {
  const current = await readProgress(userId);
  return writeProgress(userId, {
    scores: { ...current.scores, ...(patch.scores ?? {}) },
    completedTasks: { ...current.completedTasks, ...(patch.completedTasks ?? {}) },
    answers: { ...current.answers, ...(patch.answers ?? {}) },
    updatedAt: current.updatedAt,
  });
}
