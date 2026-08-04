import { z } from "zod";

import { requireUser } from "../../../src/auth/require-user.js";
import {
  createInterviewQuestion,
  listInterviewQuestions,
} from "../../../src/interview/store.js";

const createSchema = z.object({
  title: z.string().min(4).max(120),
  prompt: z.string().min(12).max(4_000),
  answerHint: z.string().max(1_000).optional(),
  tags: z.array(z.string().max(24)).max(6).optional(),
  companies: z.array(z.string().min(1).max(40)).min(1).max(8),
  recruitType: z.enum(["校招", "社招"]),
  featured: z.boolean().optional(),
  adminBoost: z.number().min(0).max(20).optional(),
});

export async function GET(): Promise<Response> {
  const questions = await listInterviewQuestions();
  return Response.json({ questions });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const gate = await requireUser(request);
    if (!gate.ok) return gate.response;

    const input = createSchema.parse(await request.json());
    const isAdmin = gate.user.role === "admin";
    const result = await createInterviewQuestion({
      title: input.title,
      prompt: input.prompt,
      answerHint: input.answerHint,
      tags: input.tags,
      companies: input.companies,
      recruitType: input.recruitType,
      authorId: gate.user.id,
      authorName: gate.user.username,
      source: isAdmin ? "admin" : "user",
      featured: isAdmin ? input.featured : false,
      adminBoost: isAdmin ? input.adminBoost : 0,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ question: result.question }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "题目格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "上传题目失败" }, { status: 500 });
  }
}
