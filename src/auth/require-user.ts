import { findUserById, type PublicUser, type UserRecord } from "./store.js";
import { readSessionFromRequest } from "./session.js";

export async function requireUser(
  request: Request,
): Promise<{ ok: true; user: PublicUser; record: UserRecord } | { ok: false; response: Response }> {
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

  return {
    ok: true,
    user: {
      id: record.id,
      username: record.username,
      role: record.role === "admin" ? "admin" : "user",
      createdAt: record.createdAt,
    },
    record,
  };
}
