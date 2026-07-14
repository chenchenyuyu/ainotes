from research_workflow import (
    check_quality,
    plan_research,
    quality_route,
    retrieve_evidence,
    write_draft,
)


def test_research_nodes_produce_an_evidence_based_draft():
    state = {"question": "如何学习 Agent 工具设计？"}
    state.update(plan_research(state))
    state.update(retrieve_evidence(state))
    state.update(write_draft(state))
    state.update(check_quality(state))

    assert len(state["plan"]) == 3
    assert "证据：" in state["draft"]
    assert state["quality_score"] == 1.0
    assert quality_route(state) == "approve"


def test_plan_rejects_an_empty_question():
    try:
        plan_research({"question": " "})
    except ValueError as error:
        assert "at least two" in str(error)
    else:
        raise AssertionError("empty questions must be rejected")
