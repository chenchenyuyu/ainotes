import { and, asc, count, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "../db/client.js";
import { userDocuments } from "../db/schema.js";

export type UserDocument = {
  id: string;
  title: string;
  filename: string;
  content: string;
  charCount: number;
  createdAt: string;
};

export async function listDocuments(userId: string): Promise<Array<Omit<UserDocument, "content">>> {
  const db = getDb();
  const rows = await db
    .select({
      id: userDocuments.id,
      title: userDocuments.title,
      filename: userDocuments.filename,
      charCount: userDocuments.charCount,
      createdAt: userDocuments.createdAt,
    })
    .from(userDocuments)
    .where(eq(userDocuments.userId, userId))
    .orderBy(desc(userDocuments.createdAt));
  return rows;
}

export async function readDocument(userId: string, id: string): Promise<UserDocument | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(userDocuments)
    .where(and(eq(userDocuments.userId, userId), eq(userDocuments.id, id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function readAllDocuments(userId: string): Promise<UserDocument[]> {
  const db = getDb();
  return db
    .select()
    .from(userDocuments)
    .where(eq(userDocuments.userId, userId))
    .orderBy(asc(userDocuments.createdAt));
}

export async function saveDocument(
  userId: string,
  input: { title: string; filename: string; content: string },
): Promise<{ ok: true; document: Omit<UserDocument, "content"> } | { ok: false; error: string }> {
  const content = input.content.trim();
  if (content.length < 20) {
    return { ok: false, error: "文档内容至少 20 字" };
  }
  if (content.length > 80_000) {
    return { ok: false, error: "单篇文档不超过 8 万字" };
  }

  const db = getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(userDocuments)
    .where(eq(userDocuments.userId, userId));
  if (Number(value) >= 30) {
    return { ok: false, error: "每位用户最多保存 30 篇学习文档" };
  }

  const document: Omit<UserDocument, "content"> = {
    id: randomUUID(),
    title: input.title.trim().slice(0, 120) || "未命名笔记",
    filename: input.filename.trim().slice(0, 120) || "note.md",
    charCount: content.length,
    createdAt: new Date().toISOString(),
  };

  await db.insert(userDocuments).values({
    ...document,
    userId,
    content,
  });

  return { ok: true, document };
}

export async function deleteDocument(userId: string, id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(userDocuments)
    .where(and(eq(userDocuments.userId, userId), eq(userDocuments.id, id)))
    .returning({ id: userDocuments.id });
  return deleted.length > 0;
}
