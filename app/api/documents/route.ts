import { z } from "zod";

import { readSessionFromRequest } from "../../../src/auth/session.js";
import { findUserById } from "../../../src/auth/store.js";
import {
  deleteDocument,
  listDocuments,
  saveDocument,
} from "../../../src/learning/documents.js";

const createSchema = z.object({
  title: z.string().max(120).optional(),
  filename: z.string().max(120).optional(),
  content: z.string().min(20).max(80_000),
});

export async function GET(request: Request): Promise<Response> {
  const session = readSessionFromRequest(request);
  if (!session) return Response.json({ error: "请先登录" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });
  return Response.json({ documents: await listDocuments(user.id) });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const session = readSessionFromRequest(request);
    if (!session) return Response.json({ error: "请先登录" }, { status: 401 });
    const user = await findUserById(session.userId);
    if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });

    const contentType = request.headers.get("content-type") ?? "";
    let payload: z.infer<typeof createSchema>;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return Response.json({ error: "请上传文本或 Markdown 文件" }, { status: 400 });
      }
      if (file.size > 200_000) {
        return Response.json({ error: "文件过大，请控制在 200KB 以内" }, { status: 400 });
      }
      const content = await file.text();
      payload = {
        title: String(form.get("title") ?? file.name.replace(/\.[^.]+$/, "")),
        filename: file.name,
        content,
      };
    } else {
      payload = createSchema.parse(await request.json());
    }

    const parsed = createSchema.parse(payload);
    const result = await saveDocument(user.id, {
      title: parsed.title ?? "学习笔记",
      filename: parsed.filename ?? "note.md",
      content: parsed.content,
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 400 });
    }
    return Response.json({ document: result.document }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "文档内容格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "上传文档失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const session = readSessionFromRequest(request);
  if (!session) return Response.json({ error: "请先登录" }, { status: 401 });
  const user = await findUserById(session.userId);
  if (!user) return Response.json({ error: "用户不存在" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "缺少文档 id" }, { status: 400 });
  const ok = await deleteDocument(user.id, id);
  if (!ok) return Response.json({ error: "文档不存在" }, { status: 404 });
  return Response.json({ ok: true });
}
