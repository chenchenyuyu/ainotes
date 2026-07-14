"""A small, testable LangGraph workflow for weeks 5–6.

The nodes are deterministic on purpose: learners can understand state, routing,
checkpointing, and human approval before replacing individual nodes with LLM calls.
"""

from __future__ import annotations

from typing import Literal, TypedDict

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import interrupt


class ResearchState(TypedDict, total=False):
    question: str
    plan: list[str]
    evidence: list[str]
    draft: str
    quality_score: float
    revision_count: int
    approved: bool


def plan_research(state: ResearchState) -> ResearchState:
    question = state["question"].strip()
    if len(question) < 2:
        raise ValueError("question must contain at least two characters")
    return {
        "plan": [
            f"定义问题边界：{question}",
            "检索本地笔记并保存来源",
            "综合证据，明确未知项",
        ],
        "revision_count": 0,
    }


def retrieve_evidence(state: ResearchState) -> ResearchState:
    # Week 6 exercise: replace this seam with an MCP client.
    return {
        "evidence": [
            "本地笔记：先使用简单、可组合的 Agent 模式。",
            "课程计划：从第一周开始维护失败样例。",
        ]
    }


def write_draft(state: ResearchState) -> ResearchState:
    evidence = "\n".join(f"- {item}" for item in state["evidence"])
    revision = state.get("revision_count", 0)
    return {
        "draft": (
            f"问题：{state['question']}\n\n"
            f"证据：\n{evidence}\n\n"
            f"建议：先实现可评估的单 Agent，再按失败数据增加复杂度。"
            f"\n修订次数：{revision}"
        )
    }


def check_quality(state: ResearchState) -> ResearchState:
    draft = state["draft"]
    has_evidence = "证据：" in draft and len(state.get("evidence", [])) >= 2
    has_recommendation = "建议：" in draft
    return {"quality_score": float(has_evidence) * 0.6 + float(has_recommendation) * 0.4}


def quality_route(state: ResearchState) -> Literal["revise", "approve"]:
    if state["quality_score"] >= 0.8 or state.get("revision_count", 0) >= 2:
        return "approve"
    return "revise"


def revise(state: ResearchState) -> ResearchState:
    return {"revision_count": state.get("revision_count", 0) + 1}


def request_approval(state: ResearchState) -> ResearchState:
    approved = interrupt(
        {
            "type": "approval",
            "question": "是否批准这份研究报告？",
            "draft": state["draft"],
        }
    )
    return {"approved": bool(approved)}


def approval_route(state: ResearchState) -> Literal["finish", "revise"]:
    return "finish" if state.get("approved") else "revise"


def build_graph():
    builder = StateGraph(ResearchState)
    builder.add_node("plan", plan_research)
    builder.add_node("retrieve", retrieve_evidence)
    builder.add_node("draft", write_draft)
    builder.add_node("quality", check_quality)
    builder.add_node("revise", revise)
    builder.add_node("approve", request_approval)

    builder.add_edge(START, "plan")
    builder.add_edge("plan", "retrieve")
    builder.add_edge("retrieve", "draft")
    builder.add_edge("draft", "quality")
    builder.add_conditional_edges("quality", quality_route, {"revise": "revise", "approve": "approve"})
    builder.add_edge("revise", "draft")
    builder.add_conditional_edges("approve", approval_route, {"finish": END, "revise": "revise"})
    return builder.compile(checkpointer=InMemorySaver())


research_graph = build_graph()
