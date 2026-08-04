import { getLearningStats, recordVisit } from "../../../src/learning/stats.js";
import { ensureAdminUser, findUserById } from "../../../src/auth/store.js";
import { readSessionFromRequest } from "../../../src/auth/session.js";

export async function GET(request: Request): Promise<Response> {
  try {
    await ensureAdminUser();
    const shouldRecord = new URL(request.url).searchParams.get("ping") === "1";
    if (shouldRecord) {
      await recordVisit();
    }

    const full = await getLearningStats();
    const session = readSessionFromRequest(request);
    const user = session ? await findUserById(session.userId) : null;
    const isAdmin = user?.role === "admin";

    if (isAdmin) {
      return Response.json({
        stats: full,
        scope: "admin" as const,
      });
    }

    return Response.json({
      stats: {
        learnerCount: full.learnerCount,
        visitCount: full.visitCount,
        updatedAt: full.updatedAt,
      },
      scope: "public" as const,
    });
  } catch {
    return Response.json({ error: "统计服务暂时不可用" }, { status: 500 });
  }
}
