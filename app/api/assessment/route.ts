import { z } from "zod";

import { assessWeek } from "../../../src/assessment.js";
import { getWeek } from "../../../src/curriculum.js";

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

    return Response.json(assessWeek(week, input.answers, input.completedTaskIds));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "提交内容格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "评分服务暂时不可用" }, { status: 500 });
  }
}
