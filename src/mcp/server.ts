import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { searchNotes } from "../core/notes.js";

export const server = new McpServer({
  name: "ai-learning-notes",
  version: "1.0.0",
});

server.registerTool(
  "search_notes",
  {
    title: "Search AI learning notes",
    description: "Find relevant passages in local Markdown learning notes.",
    inputSchema: {
      query: z.string().min(2).max(300),
      limit: z.number().int().min(1).max(8).default(5),
    },
  },
  async ({ query, limit }) => {
    const hits = await searchNotes(query, undefined, limit);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(hits, null, 2),
        },
      ],
      structuredContent: { hits },
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI learning notes MCP server is running over stdio");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
