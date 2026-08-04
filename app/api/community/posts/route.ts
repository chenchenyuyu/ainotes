import { z } from "zod";

import { requireUser } from "../../../../src/auth/require-user.js";
import {
  createCommunityPost,
  listCommunityPosts,
} from "../../../../src/community/store.js";

const createSchema = z.object({
  title: z.string().min(4).max(120),
  body: z.string().min(12).max(4_000),
  category: z.enum(["提问", "经验", "讨论"]),
  tags: z.array(z.string().max(24)).max(6).optional(),
});

export async function GET(): Promise<Response> {
  const posts = await listCommunityPosts();
  return Response.json({ posts });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const gate = await requireUser(request);
    if (!gate.ok) return gate.response;

    const input = createSchema.parse(await request.json());
    const result = await createCommunityPost({
      title: input.title,
      body: input.body,
      category: input.category,
      tags: input.tags,
      authorId: gate.user.id,
      authorName: gate.user.username,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ post: result.post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "帖子格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "发布失败" }, { status: 500 });
  }
}
