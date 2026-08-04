import { ensureAdminUser, findUserById, publicUser } from "../../../../src/auth/store.js";
import { readSessionFromRequest } from "../../../../src/auth/session.js";
import { readProgress } from "../../../../src/learning/progress.js";

export async function GET(request: Request): Promise<Response> {
  await ensureAdminUser();
  const session = readSessionFromRequest(request);
  if (!session) {
    return Response.json({ user: null }, { status: 200 });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return Response.json({ user: null }, { status: 200 });
  }

  const progress = await readProgress(user.id);
  return Response.json({ user: publicUser(user), progress });
}
