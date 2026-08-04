import { z } from "zod";

import { requireUser } from "../../../../../../src/auth/require-user.js";
import { addCommunityReply } from "../../../../../../src/community/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const replySchema = z.object({
  body: z.string().min(4).max(2_000),
});

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const gate = await requireUser(request);
    if (!gate.ok) return gate.response;

    const { id } = await context.params;
    const input = replySchema.parse(await request.json());
    const result = await addCommunityReply({
      postId: id,
      body: input.body,
      authorId: gate.user.id,
      authorName: gate.user.username,
    });
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    return Response.json({ post: result.post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "回复格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "回复失败" }, { status: 500 });
  }
}
