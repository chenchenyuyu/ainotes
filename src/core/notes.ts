import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export type NoteHit = {
  title: string;
  excerpt: string;
  source: string;
  score: number;
};

const tokenize = (text: string): string[] =>
  text
    .toLocaleLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 1);

export async function searchNotes(
  query: string,
  notesDirectory = path.join(process.cwd(), "data", "notes"),
  limit = 5,
): Promise<NoteHit[]> {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return [];

  const files = (await readdir(notesDirectory)).filter((file) => file.endsWith(".md"));
  const hits = await Promise.all(
    files.map(async (file): Promise<NoteHit | null> => {
      const source = path.join(notesDirectory, file);
      const content = await readFile(source, "utf8");
      const tokens = tokenize(content);
      const score = tokens.reduce((total, token) => total + Number(queryTokens.has(token)), 0);
      if (score === 0) return null;

      const firstMatch = content
        .split("\n")
        .find((line) => tokenize(line).some((token) => queryTokens.has(token)));
      return {
        title: content.match(/^#\s+(.+)$/m)?.[1] ?? file,
        excerpt: (firstMatch ?? content).slice(0, 280),
        source: path.relative(process.cwd(), source),
        score,
      };
    }),
  );

  return hits
    .filter((hit): hit is NoteHit => hit !== null)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
