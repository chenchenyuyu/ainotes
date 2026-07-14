import type { AssessmentQuestion, CurriculumWeek } from "./curriculum.js";

export type QuestionAssessment = {
  questionId: string;
  score: number;
  matched: string[];
  missing: string[];
  feedback: string;
};

export type AssessmentResult = {
  score: number;
  knowledgeScore: number;
  completionScore: number;
  level: "需要复习" | "基础达标" | "掌握良好" | "优秀";
  summary: string;
  strengths: string[];
  suggestions: string[];
  questions: QuestionAssessment[];
};

function includesAny(answer: string, terms: string[]): boolean {
  const normalized = answer.toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term.toLocaleLowerCase()));
}

function assessQuestion(
  question: AssessmentQuestion,
  rawAnswer: string,
): QuestionAssessment {
  const answer = rawAnswer.trim();
  const matched = question.criteria
    .filter((criterion) => includesAny(answer, criterion.terms))
    .map((criterion) => criterion.label);
  const missing = question.criteria
    .filter((criterion) => !matched.includes(criterion.label))
    .map((criterion) => criterion.label);

  const coverage = matched.length / question.criteria.length;
  const depth = Math.min(answer.length / 180, 1);
  const hasExample = includesAny(answer, ["例如", "比如", "项目", "实践", "场景", "遇到"]);
  const score = Math.round(coverage * 75 + depth * 15 + Number(hasExample) * 10);

  let feedback = "回答覆盖完整，并且给出了实践语境。";
  if (answer.length < 30) {
    feedback = "回答过于简短，建议补充因果关系和一个实际例子。";
  } else if (missing.length > 0) {
    feedback = `核心方向正确，还需要补充：${missing.join("、")}。`;
  } else if (!hasExample) {
    feedback = "概念覆盖完整；加入一个项目中的具体例子会更有说服力。";
  }

  return { questionId: question.id, score, matched, missing, feedback };
}

export function assessWeek(
  week: CurriculumWeek,
  answers: Record<string, string>,
  completedTaskIds: string[] = [],
): AssessmentResult {
  const questions = week.questions.map((question) =>
    assessQuestion(question, answers[question.id] ?? ""),
  );
  const knowledgeScore = Math.round(
    questions.reduce((total, question) => total + question.score, 0) / questions.length,
  );
  const validCompletedTasks = new Set(
    completedTaskIds.filter((taskId) => week.practice.some((task) => task.id === taskId)),
  );
  const completionScore = Math.round(
    (validCompletedTasks.size / week.practice.length) * 100,
  );
  const score = Math.round(knowledgeScore * 0.8 + completionScore * 0.2);

  const allMatched = [...new Set(questions.flatMap((question) => question.matched))];
  const allMissing = [...new Set(questions.flatMap((question) => question.missing))];
  const level =
    score >= 90
      ? "优秀"
      : score >= 75
        ? "掌握良好"
        : score >= 60
          ? "基础达标"
          : "需要复习";

  const suggestions: string[] = [];
  if (allMissing.length > 0) {
    suggestions.push(`优先回看本周知识点：${allMissing.slice(0, 4).join("、")}。`);
  }
  if (questions.some((question) => question.score < 60)) {
    suggestions.push("重新手写一个最小示例，并用“输入—决策—输出—失败”四步解释它。");
  }
  if (questions.some((question) => question.feedback.includes("实际例子"))) {
    suggestions.push("把概念对应到本周项目，补充一次真实成功或失败案例。");
  }
  if (completionScore < 100) {
    suggestions.push(`实践清单已完成 ${validCompletedTasks.size}/${week.practice.length} 项；请按验收标准补齐后再标记完成。`);
  }
  if (score >= 75 && completionScore === 100) {
    suggestions.push(`本阶段已达标；请保存交付物「${week.deliverable}」和评估基线。`);
  } else {
    suggestions.push("建议暂缓进入下一阶段，补齐实践项或知识缺口后再次验收。");
  }

  return {
    score,
    knowledgeScore,
    completionScore,
    level,
    summary:
      score >= 75 && completionScore === 100
        ? `你已通过「${week.title}」阶段，可以继续进入下一阶段。`
        : `「${week.title}」仍有知识或实践缺口，请按建议补齐后重试。`,
    strengths: allMatched.slice(0, 5),
    suggestions,
    questions,
  };
}
