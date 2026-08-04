import { z } from "zod";

import { requireUser } from "../../../../../src/auth/require-user.js";
import { voteInterviewQuestion } from "../../../../../src/interview/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  value: z.enum(["useful", "useless"]),
});

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const gate = await requireUser(request);
    if (!gate.ok) return gate.response;

    const { id } = await context.params;
    const input = bodySchema.parse(await request.json());
    const result = await voteInterviewQuestion(id, gate.user.id, input.value);
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ question: result.question, previous: result.previous });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "请选择「有用」或「没用」" }, { status: 400 });
    }
    return Response.json({ error: "投票失败" }, { status: 500 });
  }
}
