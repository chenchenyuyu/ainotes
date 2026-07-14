import path from "node:path";
import { describe, expect, it } from "vitest";

import { searchNotes } from "../src/core/notes.js";

describe("local note retrieval", () => {
  it("returns ranked evidence with a traceable source", async () => {
    const directory = path.join(process.cwd(), "data", "notes");
    const hits = await searchNotes("MCP tools resources", directory);

    expect(hits[0]?.title).toBe("MCP 学习笔记");
    expect(hits[0]?.source).toContain("mcp.md");
    expect(hits[0]?.score).toBeGreaterThan(0);
  });

  it("returns no evidence for an unrelated query", async () => {
    await expect(searchNotes("火星土豆栽培")).resolves.toEqual([]);
  });
});
