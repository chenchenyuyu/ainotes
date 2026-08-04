import { getDb, resetDbClient } from "./client.js";
import {
  communityHelpful,
  communityPosts,
  communityReplies,
  interviewQuestions,
  interviewVotes,
  siteStats,
  userDocuments,
  userProgress,
  users,
} from "./schema.js";

/** Wipe all app tables. Intended for tests only. */
export async function resetAllTables(): Promise<void> {
  resetDbClient();
  const db = getDb();
  await db.delete(communityHelpful);
  await db.delete(communityReplies);
  await db.delete(communityPosts);
  await db.delete(interviewVotes);
  await db.delete(interviewQuestions);
  await db.delete(userDocuments);
  await db.delete(userProgress);
  await db.delete(users);
  await db.delete(siteStats);
}
