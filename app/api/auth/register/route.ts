import { z } from "zod";

import { createSessionToken, sessionCookieHeader } from "../../../../src/auth/session.js";
import { ensureAdminUser, registerUser } from "../../../../src/auth/store.js";
import { writeProgress, emptyProgress } from "../../../../src/learning/progress.js";

const schema = z.object({
  username: z.string().min(2).max(24),
  password: z.string().min(6).max(72),
});

export async function POST(request: Request): Promise<Response> {
  try {
    await ensureAdminUser();
    const input = schema.parse(await request.json());
    const result = await registerUser(input.username, input.password);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }

    await writeProgress(result.user.id, emptyProgress());
    const token = createSessionToken(result.user.id, result.user.username);
    return Response.json(
      { user: result.user },
      { headers: { "Set-Cookie": sessionCookieHeader(token) } },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "注册信息格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
