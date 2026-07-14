import { answerResearchQuestion } from "../../../src/agent/research-agent.js";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("请求体必须是 JSON", { status: 400 });
  }

  const question =
    typeof body === "object" && body !== null && "question" in body
      ? String(body.question).trim()
      : "";
  if (question.length < 2 || question.length > 2_000) {
    return new Response("问题长度必须为 2–2000 个字符", { status: 400 });
  }
  if (!process.env.OPENAI_API_KEY) {
    return new Response("服务端尚未配置 OPENAI_API_KEY", { status: 503 });
  }

  try {
    const answer = await answerResearchQuestion(question);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for (const paragraph of answer.split(/(?<=。|\n)/u)) {
          controller.enqueue(encoder.encode(paragraph));
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent 执行失败";
    return new Response(message, { status: 500 });
  }
}
