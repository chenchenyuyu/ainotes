import { and, asc, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { communitySeed } from "../content/community-seed.js";
import { getDb } from "../db/client.js";
import { communityHelpful, communityPosts, communityReplies } from "../db/schema.js";

export type CommunityCategory = "提问" | "经验" | "讨论";

export type CommunityReply = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  category: CommunityCategory;
  tags: string[];
  authorId: string;
  authorName: string;
  replyCount: number;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  replies: CommunityReply[];
};

const CATEGORIES: CommunityCategory[] = ["提问", "经验", "讨论"];

function normalizeCategory(value: unknown): CommunityCategory {
  return CATEGORIES.includes(value as CommunityCategory) ? (value as CommunityCategory) : "讨论";
}

function sortPosts(posts: CommunityPost[]): CommunityPost[] {
  return [...posts].sort((a, b) => {
    const scoreA = a.helpfulVotes * 3 + a.replyCount * 2;
    const scoreB = b.helpfulVotes * 3 + b.replyCount * 2;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
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

async function loadPost(id: string): Promise<CommunityPost | null> {
  const db = getDb();
  const rows = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return null;

  const replies = await db
    .select()
    .from(communityReplies)
    .where(eq(communityReplies.postId, id))
    .orderBy(asc(communityReplies.createdAt));

  return {
    id: post.id,
    title: post.title,
    body: post.body,
    category: normalizeCategory(post.category),
    tags: post.tags ?? [],
    authorId: post.authorId,
    authorName: post.authorName,
    replyCount: replies.length,
    helpfulVotes: post.helpfulVotes,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    replies: replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      authorId: reply.authorId,
      authorName: reply.authorName,
      createdAt: reply.createdAt,
    })),
  };
}

export async function listCommunityPosts(): Promise<CommunityPost[]> {
  await ensureCommunitySeed();
  const db = getDb();
  const posts = await db.select().from(communityPosts);
  const replies = await db.select().from(communityReplies).orderBy(asc(communityReplies.createdAt));

  const repliesByPost = new Map<string, CommunityReply[]>();
  for (const reply of replies) {
    const list = repliesByPost.get(reply.postId) ?? [];
    list.push({
      id: reply.id,
      body: reply.body,
      authorId: reply.authorId,
      authorName: reply.authorName,
      createdAt: reply.createdAt,
    });
    repliesByPost.set(reply.postId, list);
  }

  return sortPosts(
    posts.map((post) => {
      const postReplies = repliesByPost.get(post.id) ?? [];
      return {
        id: post.id,
        title: post.title,
        body: post.body,
        category: normalizeCategory(post.category),
        tags: post.tags ?? [],
        authorId: post.authorId,
        authorName: post.authorName,
        replyCount: postReplies.length,
        helpfulVotes: post.helpfulVotes,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        replies: postReplies,
      };
    }),
  );
}

export async function getCommunityPost(id: string): Promise<CommunityPost | null> {
  await ensureCommunitySeed();
  return loadPost(id);
}

export async function createCommunityPost(input: {
  title: string;
  body: string;
  category: CommunityCategory;
  tags?: string[];
  authorId: string;
  authorName: string;
}): Promise<{ ok: true; post: CommunityPost } | { ok: false; error: string }> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 4 || title.length > 120) {
    return { ok: false, error: "标题需为 4–120 字" };
  }
  if (body.length < 12 || body.length > 4_000) {
    return { ok: false, error: "正文需为 12–4000 字" };
  }
  if (!CATEGORIES.includes(input.category)) {
    return { ok: false, error: "请选择提问、经验或讨论" };
  }

  await ensureCommunitySeed();
  const db = getDb();
  const [{ value }] = await db.select({ value: count() }).from(communityPosts);
  if (Number(value) >= 500) {
    return { ok: false, error: "社区帖子已满，请先清理旧帖" };
  }

  const now = new Date().toISOString();
  const post = {
    id: randomUUID(),
    title,
    body,
    category: input.category,
    tags: (input.tags ?? [])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 6),
    authorId: input.authorId,
    authorName: input.authorName,
    helpfulVotes: 0,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(communityPosts).values(post);
  return {
    ok: true,
    post: { ...post, category: normalizeCategory(post.category), replyCount: 0, replies: [] },
  };
}

export async function addCommunityReply(input: {
  postId: string;
  body: string;
  authorId: string;
  authorName: string;
}): Promise<{ ok: true; post: CommunityPost } | { ok: false; error: string }> {
  const body = input.body.trim();
  if (body.length < 4 || body.length > 2_000) {
    return { ok: false, error: "回复需为 4–2000 字" };
  }

  const existing = await loadPost(input.postId);
  if (!existing) return { ok: false, error: "帖子不存在" };

  const reply = {
    id: randomUUID(),
    postId: input.postId,
    body,
    authorId: input.authorId,
    authorName: input.authorName,
    createdAt: new Date().toISOString(),
  };

  const db = getDb();
  await db.insert(communityReplies).values(reply);
  await db
    .update(communityPosts)
    .set({ updatedAt: reply.createdAt })
    .where(eq(communityPosts.id, input.postId));

  const post = await loadPost(input.postId);
  if (!post) return { ok: false, error: "帖子不存在" };
  return { ok: true, post };
}

export async function markCommunityPostHelpful(
  postId: string,
  voterKey: string,
): Promise<{ ok: true; post: CommunityPost } | { ok: false; error: string }> {
  const db = getDb();
  const postRows = await db
    .select()
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);
  if (!postRows[0]) return { ok: false, error: "帖子不存在" };

  const existing = await db
    .select()
    .from(communityHelpful)
    .where(and(eq(communityHelpful.postId, postId), eq(communityHelpful.voterKey, voterKey)))
    .limit(1);
  if (existing[0]) {
    return { ok: false, error: "你已经标记过「有帮助」" };
  }

  const updatedAt = new Date().toISOString();
  await db.insert(communityHelpful).values({ postId, voterKey });
  await db
    .update(communityPosts)
    .set({
      helpfulVotes: postRows[0].helpfulVotes + 1,
      updatedAt,
    })
    .where(eq(communityPosts.id, postId));

  const post = await loadPost(postId);
  if (!post) return { ok: false, error: "帖子不存在" };
  return { ok: true, post };
}

export async function deleteCommunityPost(
  id: string,
  actor: { userId: string; isAdmin: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const rows = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return { ok: false, error: "帖子不存在" };
  if (!actor.isAdmin && post.authorId !== actor.userId) {
    return { ok: false, error: "只能删除自己的帖子" };
  }
  await db.delete(communityPosts).where(eq(communityPosts.id, id));
  return { ok: true };
}

export async function deleteCommunityReply(
  postId: string,
  replyId: string,
  actor: { userId: string; isAdmin: boolean },
): Promise<{ ok: true; post: CommunityPost } | { ok: false; error: string }> {
  const db = getDb();
  const replyRows = await db
    .select()
    .from(communityReplies)
    .where(and(eq(communityReplies.postId, postId), eq(communityReplies.id, replyId)))
    .limit(1);
  const reply = replyRows[0];
  if (!reply) return { ok: false, error: "回复不存在" };
  if (!actor.isAdmin && reply.authorId !== actor.userId) {
    return { ok: false, error: "只能删除自己的回复" };
  }

  await db.delete(communityReplies).where(eq(communityReplies.id, replyId));
  await db
    .update(communityPosts)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(communityPosts.id, postId));

  const post = await loadPost(postId);
  if (!post) return { ok: false, error: "帖子不存在" };
  return { ok: true, post };
}
