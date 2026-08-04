import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema.js";

config({ path: ".env.local" });
config();

export type AppDb = ReturnType<typeof createDb>;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "缺少 DATABASE_URL。请在 .env.local 或 Vercel 环境变量中配置 Neon 连接串。",
    );
  }
  return url;
}

function createDb(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

declare global {
  // eslint-disable-next-line no-var
  var __ainotesDb: AppDb | undefined;
}

export function getDb(): AppDb {
  if (!globalThis.__ainotesDb) {
    globalThis.__ainotesDb = createDb(requireDatabaseUrl());
  }
  return globalThis.__ainotesDb;
}

/** Test helper: rebuild client after env changes. */
export function resetDbClient(): void {
  globalThis.__ainotesDb = undefined;
}
