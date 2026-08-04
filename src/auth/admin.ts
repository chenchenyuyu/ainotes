import { findUserById, type PublicUser, type UserRecord } from "./store.js";
import { readSessionFromRequest } from "./session.js";

export async function requireAdmin(
  request: Request,
): Promise<{ ok: true; admin: PublicUser; record: UserRecord } | { ok: false; response: Response }> {
  const session = readSessionFromRequest(request);
  if (!session) {
    return {
      ok: false,
      response: Response.json({ error: "请先登录" }, { status: 401 }),
    };
  }

  const record = await findUserById(session.userId);
  if (!record) {
    return {
      ok: false,
      response: Response.json({ error: "用户不存在" }, { status: 401 }),
    };
  }

  if (record.role !== "admin") {
    return {
      ok: false,
      response: Response.json({ error: "需要管理员权限" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    admin: {
      id: record.id,
      username: record.username,
      role: "admin",
      createdAt: record.createdAt,
    },
    record,
  };
}
