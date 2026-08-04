import { clearSessionCookieHeader } from "../../../../src/auth/session.js";

export async function POST(): Promise<Response> {
  return Response.json(
    { ok: true },
    { headers: { "Set-Cookie": clearSessionCookieHeader() } },
  );
}
