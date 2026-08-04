import { requireUser } from "../../../../../src/auth/require-user.js";
import {
  deleteCommunityPost,
  getCommunityPost,
} from "../../../../../src/community/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  const { id } = await context.params;
  const post = await getCommunityPost(id);
  if (!post) return Response.json({ error: "帖子不存在" }, { status: 404 });
  return Response.json({ post });
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const gate = await requireUser(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const result = await deleteCommunityPost(id, {
    userId: gate.user.id,
    isAdmin: gate.user.role === "admin",
  });
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
