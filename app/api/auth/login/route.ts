import { z } from "zod";

import { createSessionToken, sessionCookieHeader } from "../../../../src/auth/session.js";
import { authenticateUser, ensureAdminUser } from "../../../../src/auth/store.js";

const schema = z.object({
  username: z.string().min(2).max(24),
  password: z.string().min(6).max(72),
});

export async function POST(request: Request): Promise<Response> {
  try {
    await ensureAdminUser();
    const input = schema.parse(await request.json());
    const result = await authenticateUser(input.username, input.password);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    const token = createSessionToken(result.user.id, result.user.username);
    return Response.json(
      { user: result.user },
      { headers: { "Set-Cookie": sessionCookieHeader(token) } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "登录信息格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
