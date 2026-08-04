import { z } from "zod";

import { readSessionFromRequest } from "../../../src/auth/session.js";
import { findUserById } from "../../../src/auth/store.js";
import { mergeProgress, readProgress } from "../../../src/learning/progress.js";

const patchSchema = z.object({
  scores: z.record(z.string(), z.number().min(0).max(100)).optional(),
  completedTasks: z.record(z.string(), z.array(z.string().max(100))).optional(),
  answers: z.record(z.string(), z.record(z.string(), z.string().max(4_000))).optional(),
});

function normalizeNumberKeyed<T>(input: Record<string, T> | undefined): Record<number, T> {
  if (!input) return {};
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [Number(key), value]),
  );
}

export async function GET(request: Request): Promise<Response> {
  const session = readSessionFromRequest(request);
  if (!session) return Response.json({ error: "请先登录" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });
  return Response.json(await readProgress(user.id));
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const session = readSessionFromRequest(request);
    if (!session) return Response.json({ error: "请先登录" }, { status: 401 });
    const user = await findUserById(session.userId);
    if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });

    const input = patchSchema.parse(await request.json());
    const progress = await mergeProgress(user.id, {
      scores: normalizeNumberKeyed(input.scores),
      completedTasks: normalizeNumberKeyed(input.completedTasks),
      answers: normalizeNumberKeyed(input.answers),
    });
    return Response.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "进度数据格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "保存进度失败" }, { status: 500 });
  }
}
