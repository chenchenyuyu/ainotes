import { z } from "zod";

import { requireAdmin } from "../../../../../src/auth/admin.js";
import { getManagedUserDetail } from "../../../../../src/auth/manage.js";
import {
  deleteUser,
  resetUserPassword,
  setUserRole,
} from "../../../../../src/auth/store.js";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const patchSchema = z
  .object({
    password: z.string().min(6).max(72).optional(),
    role: z.enum(["admin", "user"]).optional(),
  })
  .refine((value) => value.password !== undefined || value.role !== undefined, {
    message: "需要提供 password 或 role",
  });

export async function GET(request: Request, context: RouteContext): Promise<Response> {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  const detail = await getManagedUserDetail(id);
  if (!detail) return Response.json({ error: "用户不存在" }, { status: 404 });
  return Response.json(detail);
}

export async function PATCH(request: Request, context: RouteContext): Promise<Response> {
  try {
    const gate = await requireAdmin(request);
    if (!gate.ok) return gate.response;

    const { id } = await context.params;
    const input = patchSchema.parse(await request.json());

    if (input.password) {
      const result = await resetUserPassword(id, input.password);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
    }

    if (input.role) {
      const result = await setUserRole(id, input.role);
      if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
      return Response.json({ user: result.user });
    }

    const detail = await getManagedUserDetail(id);
    if (!detail) return Response.json({ error: "用户不存在" }, { status: 404 });
    return Response.json({ user: detail.user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: "请求格式不正确" }, { status: 400 });
    }
    return Response.json({ error: "更新用户失败" }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<Response> {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  if (id === gate.admin.id) {
    return Response.json({ error: "不能删除当前登录的管理员账号" }, { status: 400 });
  }

  const result = await deleteUser(id);
  if (!result.ok) return Response.json({ error: result.error }, { status: 400 });
  return Response.json({ ok: true });
}
