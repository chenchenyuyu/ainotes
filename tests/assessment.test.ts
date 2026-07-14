import { describe, expect, it } from "vitest";

import { assessWeek } from "../src/assessment.js";
import { curriculum } from "../src/curriculum.js";

describe("learning assessment", () => {
  it("scores concept coverage and returns actionable suggestions", () => {
    const week = curriculum[0];
    const answers = {
      "w1-q1":
        "Chatbot 主要完成对话和单次回答；Workflow 按预定义固定流程执行，更确定可预测；Agent 会自主决策并选择工具，但复杂度、成本和风险也更高。例如固定报表应使用工作流。",
      "w1-q2":
        "当任务流程稳定且可预测时不应使用 Agent，普通脚本或规则 Workflow 更便宜可靠。例如每天按固定格式汇总数据，用 Agent 会增加不确定性、延迟和成本。",
    };

    const result = assessWeek(week, answers, week.practice.map((task) => task.id));

    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.level).not.toBe("需要复习");
    expect(result.questions).toHaveLength(2);
    expect(result.completionScore).toBe(100);
    expect(result.suggestions.at(-1)).toContain("已达标");
  });

  it("identifies missing concepts in short answers", () => {
    const week = curriculum[0];
    const result = assessWeek(week, {
      "w1-q1": "调用模型和工具。",
      "w1-q2": "为了处理错误。",
    });

    expect(result.score).toBeLessThan(60);
    expect(result.level).toBe("需要复习");
    expect(result.completionScore).toBe(0);
    expect(result.suggestions.join("")).toContain("回看");
  });

  it("includes verified task completion in the final score", () => {
    const week = curriculum[0];
    const answers = Object.fromEntries(
      week.questions.map((question) => [
        question.id,
        question.criteria.map((criterion) => criterion.terms.join("、")).join("；") + "。例如项目实践。",
      ]),
    );

    const withoutPractice = assessWeek(week, answers);
    const withPractice = assessWeek(week, answers, week.practice.map((task) => task.id));

    expect(withPractice.score).toBeGreaterThan(withoutPractice.score);
    expect(withPractice.completionScore).toBe(100);
  });
});
