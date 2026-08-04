import { requireAdmin } from "../../../../src/auth/admin.js";
import { listManagedUsers } from "../../../../src/auth/manage.js";
import { ensureAdminUser } from "../../../../src/auth/store.js";

export async function GET(request: Request): Promise<Response> {
  await ensureAdminUser();
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const users = await listManagedUsers();
  return Response.json({ users });
}
