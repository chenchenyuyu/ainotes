import { z } from "zod";

import { requireUser } from "../../../../src/auth/require-user.js";
import {
  deleteInterviewQuestion,
  updateInterviewQuestion,
} from "../../../../src/interview/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z.object({
  title: z.string().min(4).max(120).optional(),
  prompt: z.string().min(12).max(4_000).optional(),
  answerHint: z.string().max(1_000).optional(),
  featured: z.boolean().optional(),
  adminBoost: z.number().min(0).max(20).optional(),
});

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const gate = await requireUser(request);
    if (!gate.ok) return gate.response;
    if (gate.user.role !== "admin") {
      return Response.json({ error: "需要管理员权限" }, { status: 403 });
    }

    const { id } = await context.params;
    const input = patchSchema.parse(await request.json());
    const result = await updateInterviewQuestion(id, input);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ question: result.question });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "更新内容格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "更新题目失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const gate = await requireUser(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const result = await deleteInterviewQuestion(id, {
    userId: gate.user.id,
    isAdmin: gate.user.role === "admin",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
