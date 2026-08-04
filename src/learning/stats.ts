import { eq, sql } from "drizzle-orm";

import { listUsers } from "../auth/store.js";
import { getDb } from "../db/client.js";
import { siteStats, userProgress } from "../db/schema.js";
import { readProgress } from "./progress.js";

export type LearningStats = {
  learnerCount: number;
  activeLearnerCount: number;
  totalAccounts: number;
  visitCount: number;
  updatedAt: string;
};

async function ensureSiteStatsRow(): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(siteStats).where(eq(siteStats.id, 1)).limit(1);
  if (existing.length > 0) return;
  await db.insert(siteStats).values({
    id: 1,
    visitCount: 0,
    updatedAt: new Date().toISOString(),
  });
}

export async function recordVisit(): Promise<number> {
  await ensureSiteStatsRow();
  const db = getDb();
  const updatedAt = new Date().toISOString();
  const rows = await db
    .update(siteStats)
    .set({
      visitCount: sql`${siteStats.visitCount} + 1`,
      updatedAt,
    })
    .where(eq(siteStats.id, 1))
    .returning({ visitCount: siteStats.visitCount });
  return rows[0]?.visitCount ?? 0;
}

function hasLearningActivity(progress: Awaited<ReturnType<typeof readProgress>>): boolean {
  return (
    Object.keys(progress.scores).length > 0 ||
    Object.values(progress.completedTasks).some((tasks) => tasks.length > 0) ||
    Object.keys(progress.answers).length > 0
  );
}

export async function getLearningStats(): Promise<LearningStats> {
  await ensureSiteStatsRow();
  const db = getDb();
  const allUsers = await listUsers();
  const learners = allUsers.filter((user) => user.role !== "admin");

  const progressRows = await db.select({ userId: userProgress.userId }).from(userProgress);
  const learnerIds = new Set(learners.map((user) => user.id));
  let activeLearnerCount = 0;
  for (const row of progressRows) {
    if (!learnerIds.has(row.userId)) continue;
    const progress = await readProgress(row.userId);
    if (hasLearningActivity(progress)) activeLearnerCount += 1;
  }

  const [visitRow] = await db
    .select({ visitCount: siteStats.visitCount })
    .from(siteStats)
    .where(eq(siteStats.id, 1))
    .limit(1);

  return {
    learnerCount: learners.length,
    activeLearnerCount,
    totalAccounts: allUsers.length,
    visitCount: visitRow?.visitCount ?? 0,
    updatedAt: new Date().toISOString(),
  };
}
