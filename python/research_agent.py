"""Small Python companion to the TypeScript Agents SDK example."""

from __future__ import annotations

import asyncio
from pathlib import Path

from agents import Agent, Runner, function_tool

NOTES_DIR = Path(__file__).parent.parent / "data" / "notes"


@function_tool
def search_notes(query: str) -> str:
    """Search local Markdown notes and return matching passages with source paths."""
    words = {word.lower() for word in query.split() if len(word) > 1}
    matches: list[str] = []
    for note in NOTES_DIR.glob("*.md"):
        content = note.read_text(encoding="utf-8")
        if any(word in content.lower() for word in words):
            matches.append(f"SOURCE: data/notes/{note.name}\n{content[:600]}")
    return "\n\n".join(matches[:5]) or "NO_EVIDENCE"


research_agent = Agent(
    name="Python research assistant",
    instructions=(
        "Answer questions about AI Agent learning. Search notes first, cite each source, "
        "and explicitly say when no evidence was found."
    ),
    tools=[search_notes],
)


async def answer(question: str) -> str:
    if len(question.strip()) < 2:
        raise ValueError("question must contain at least two characters")
    result = await Runner.run(research_agent, question, max_turns=8)
    return str(result.final_output)


if __name__ == "__main__":
    import sys

    user_question = " ".join(sys.argv[1:]) or "MCP 是什么？"
    print(asyncio.run(answer(user_question)))
