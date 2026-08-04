import { requireUser } from "../../../../../../src/auth/require-user.js";
import { markCommunityPostHelpful } from "../../../../../../src/community/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  const gate = await requireUser(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const result = await markCommunityPostHelpful(id, gate.user.id);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ post: result.post });
}
