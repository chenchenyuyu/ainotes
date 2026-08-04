import { z } from "zod";

import { assessWeek } from "../../../src/assessment.js";
import { readSessionFromRequest } from "../../../src/auth/session.js";
import { findUserById } from "../../../src/auth/store.js";
import { getWeek } from "../../../src/curriculum.js";
import { mergeProgress } from "../../../src/learning/progress.js";

const requestSchema = z.object({
  week: z.number().int().min(1).max(9),
  answers: z.record(z.string(), z.string().max(4_000)),
  completedTaskIds: z.array(z.string().max(100)).default([]),
});

export async function POST(request: Request): Promise<Response> {
  try {
    const input = requestSchema.parse(await request.json());
    const week = getWeek(input.week);
    if (!week) {
      return Response.json({ error: "未找到对应学习周" }, { status: 404 });
    }

    const result = assessWeek(week, input.answers, input.completedTaskIds);

    const session = readSessionFromRequest(request);
    if (session) {
      const user = await findUserById(session.userId);
      if (user) {
        await mergeProgress(user.id, {
          scores: { [input.week]: result.score },
          completedTasks: { [input.week]: input.completedTaskIds },
          answers: { [input.week]: input.answers },
        });
      }
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "提交内容格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "评分服务暂时不可用" }, { status: 500 });
  }
}
