import { readSessionFromRequest } from "../../../src/auth/session.js";
import { findUserById } from "../../../src/auth/store.js";
import { readAllDocuments } from "../../../src/learning/documents.js";
import { readProgress } from "../../../src/learning/progress.js";
import { buildLearningReport } from "../../../src/learning/report.js";

export async function GET(request: Request): Promise<Response> {
  const session = readSessionFromRequest(request);
  if (!session) return Response.json({ error: "请先登录后再生成学习报告" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });

  const [progress, documents] = await Promise.all([
    readProgress(user.id),
    readAllDocuments(user.id),
  ]);

  return Response.json({
    user: { id: user.id, username: user.username },
    report: buildLearningReport(progress, documents),
  });
}

export async function POST(request: Request): Promise<Response> {
  return GET(request);
}
