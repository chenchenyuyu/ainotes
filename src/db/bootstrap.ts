import { ensureAdminUser, defaultAdminCredentials } from "../auth/store.js";
import { getDb } from "./client.js";
import { communityPosts, interviewQuestions, siteStats } from "./schema.js";
import { communitySeed } from "../content/community-seed.js";
import { interviewSeed } from "../content/interview-seed.js";
import { count } from "drizzle-orm";

async function ensureSiteStatsRow(): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(siteStats).limit(1);
  if (existing.length > 0) return;
  await db.insert(siteStats).values({
    id: 1,
    visitCount: 0,
    updatedAt: new Date().toISOString(),
  });
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

async function ensureCommunitySeed(): Promise<void> {
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(communityPosts);
  if (Number(value) > 0) return;
  const base = Date.now();
  await db.insert(communityPosts).values(
    communitySeed.map((item, index) => {
      const createdAt = new Date(base - index * 3_600_000).toISOString();
      return {
        id: `community-seed-${index + 1}`,
        title: item.title,
        body: item.body,
        category: item.category,
        tags: item.tags,
        authorId: "system",
        authorName: "学习台小助手",
        helpfulVotes: 2 + ((index * 3) % 4),
        createdAt,
        updatedAt: createdAt,
      };
    }),
  );
}

export async function bootstrapDatabase(): Promise<void> {
  await ensureSiteStatsRow();
  await ensureAdminUser();
  await ensureInterviewSeed();
  await ensureCommunitySeed();
}

async function main() {
  await bootstrapDatabase();
  const { username, password } = defaultAdminCredentials();
  console.log("Database bootstrap complete.");
  console.log(`Admin login: username="${username}" password="${password}"`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
