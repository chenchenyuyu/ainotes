import { count, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "../db/client.js";
import { users } from "../db/schema.js";
import { hashPassword, verifyPassword } from "./password.js";

export type UserRole = "admin" | "user";

export type UserRecord = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
};

function normalizeRole(role: string): UserRole {
  return role === "admin" ? "admin" : "user";
}

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    role: normalizeRole(row.role),
    createdAt: row.createdAt,
  };
}

export function publicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(sql`lower(${users.username}) = ${username.trim().toLocaleLowerCase()}`)
    .limit(1);
  return rows[0] ? toUserRecord(rows[0]) : null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ? toUserRecord(rows[0]) : null;
}

export async function listUsers(): Promise<PublicUser[]> {
  const db = getDb();
  const rows = await db.select().from(users);
  return rows.map((row) => publicUser(toUserRecord(row)));
}

export async function countAdmins(): Promise<number> {
  const db = getDb();
  const [{ value }] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "admin"));
  return Number(value);
}

export async function registerUser(
  username: string,
  password: string,
  role: UserRole = "user",
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const normalized = username.trim();
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{2,24}$/.test(normalized)) {
    return { ok: false, error: "用户名需为 2–24 个字母、数字、下划线或中文" };
  }
  if (password.length < 6 || password.length > 72) {
    return { ok: false, error: "密码长度需为 6–72 位" };
  }
  if (role !== "admin" && normalized.toLocaleLowerCase() === "admin") {
    return { ok: false, error: "用户名 admin 为系统保留，请更换" };
  }
  if (await findUserByUsername(normalized)) {
    return { ok: false, error: "用户名已被占用" };
  }

  const user: UserRecord = {
    id: randomUUID(),
    username: normalized,
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
  };

  const db = getDb();
  await db.insert(users).values({
    id: user.id,
    username: user.username,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: user.createdAt,
  });

  return { ok: true, user: publicUser(user) };
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  await ensureAdminUser();
  const user = await findUserByUsername(username.trim());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: "用户名或密码不正确" };
  }
  return { ok: true, user: publicUser(user) };
}

export async function resetUserPassword(
  userId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (password.length < 6 || password.length > 72) {
    return { ok: false, error: "密码长度需为 6–72 位" };
  }
  const user = await findUserById(userId);
  if (!user) return { ok: false, error: "用户不存在" };

  const db = getDb();
  await db
    .update(users)
    .set({ passwordHash: hashPassword(password) })
    .where(eq(users.id, userId));
  return { ok: true };
}

export async function setUserRole(
  userId: string,
  role: UserRole,
): Promise<{ ok: true; user: PublicUser } | { ok: false; error: string }> {
  const user = await findUserById(userId);
  if (!user) return { ok: false, error: "用户不存在" };

  if (user.role === "admin" && role !== "admin") {
    if ((await countAdmins()) <= 1) {
      return { ok: false, error: "至少保留一名管理员" };
    }
  }

  const db = getDb();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { ok: true, user: { ...publicUser(user), role } };
}

export async function deleteUser(
  userId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await findUserById(userId);
  if (!user) return { ok: false, error: "用户不存在" };

  if (user.role === "admin" && (await countAdmins()) <= 1) {
    return { ok: false, error: "不能删除唯一的管理员账号" };
  }

  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
  return { ok: true };
}

export function defaultAdminCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME?.trim() || "admin",
    password: process.env.ADMIN_PASSWORD?.trim() || "admin123456",
  };
}

/** Ensure a default admin account exists. Safe to call repeatedly. */
export async function ensureAdminUser(): Promise<PublicUser> {
  const { username, password } = defaultAdminCredentials();
  const existing = await findUserByUsername(username);
  if (existing) {
    if (existing.role !== "admin") {
      const db = getDb();
      await db.update(users).set({ role: "admin" }).where(eq(users.id, existing.id));
      return { ...publicUser(existing), role: "admin" };
    }
    return publicUser(existing);
  }

  const created = await registerUser(username, password, "admin");
  if (!created.ok) {
    throw new Error(created.error);
  }
  return created.user;
}
