import { curriculum, type CurriculumWeek } from "../curriculum.js";
import type { UserDocument } from "./documents.js";
import type { UserProgress } from "./progress.js";

export type StageReport = {
  week: number;
  title: string;
  level: string;
  score: number | null;
  practiceDone: number;
  practiceTotal: number;
  passed: boolean;
  status: "未开始" | "进行中" | "已达标" | "需加强";
};

export type DocumentCoverage = {
  documentId: string;
  title: string;
  coveredTopics: string[];
  missingTopics: string[];
  coverageScore: number;
};

export type LearningReport = {
  generatedAt: string;
  overallScore: number;
  level: "需要系统复习" | "基础成型" | "掌握良好" | "可进入实战交付";
  summary: string;
  completedStages: number;
  totalStages: number;
  documentCount: number;
  strengths: string[];
  gaps: string[];
  suggestions: string[];
  stages: StageReport[];
  documentCoverage: DocumentCoverage[];
  nextFocus: string;
};

function includesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLocaleLowerCase();
  return terms.some((term) => normalized.includes(term.toLocaleLowerCase()));
}

function collectWeekTerms(week: CurriculumWeek): Array<{ label: string; terms: string[] }> {
  const fromQuestions = week.questions.flatMap((question) => question.criteria);
  const fromKnowledge = week.knowledge.map((point) => ({
    label: point.slice(0, 24),
    terms: point
      .split(/[、，,；;：:\s]+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 2)
      .slice(0, 4),
  }));
  return [...fromQuestions, ...fromKnowledge];
}

function assessDocumentAgainstCurriculum(doc: UserDocument): DocumentCoverage {
  const allTopics = curriculum.flatMap((week) =>
    collectWeekTerms(week).map((topic) => ({ ...topic, week: week.week, title: week.title })),
  );
  const uniqueLabels = new Map<string, string[]>();
  for (const topic of allTopics) {
    if (!uniqueLabels.has(topic.label)) uniqueLabels.set(topic.label, topic.terms);
  }

  const coveredTopics: string[] = [];
  const missingTopics: string[] = [];
  for (const [label, terms] of uniqueLabels) {
    if (includesAny(doc.content, terms)) coveredTopics.push(label);
    else missingTopics.push(label);
  }

  const sampleMissing = missingTopics.slice(0, 8);
  const coverageScore = Math.round((coveredTopics.length / Math.max(uniqueLabels.size, 1)) * 100);
  return {
    documentId: doc.id,
    title: doc.title,
    coveredTopics: coveredTopics.slice(0, 10),
    missingTopics: sampleMissing,
    coverageScore,
  };
}

function stageStatus(
  week: CurriculumWeek,
  score: number | undefined,
  completed: string[],
): StageReport["status"] {
  if (score === undefined && completed.length === 0) return "未开始";
  const passed = (score ?? 0) >= 75 && completed.length === week.practice.length;
  if (passed) return "已达标";
  if ((score ?? 0) > 0 || completed.length > 0) {
    return (score ?? 0) > 0 && (score ?? 0) < 60 ? "需加强" : "进行中";
  }
  return "未开始";
}

export function buildLearningReport(
  progress: UserProgress,
  documents: UserDocument[],
): LearningReport {
  const stages: StageReport[] = curriculum.map((week) => {
    const score = progress.scores[week.week];
    const completed = progress.completedTasks[week.week] ?? [];
    const status = stageStatus(week, score, completed);
    return {
      week: week.week,
      title: week.title,
      level: week.level,
      score: score ?? null,
      practiceDone: completed.length,
      practiceTotal: week.practice.length,
      passed: status === "已达标",
      status,
    };
  });

  const scored = stages.filter((stage) => stage.score !== null);
  const completedStages = stages.filter((stage) => stage.passed).length;
  const averageScore = scored.length
    ? Math.round(scored.reduce((total, stage) => total + (stage.score ?? 0), 0) / scored.length)
    : 0;

  const documentCoverage = documents.map(assessDocumentAgainstCurriculum);
  const docBoost =
    documentCoverage.length === 0
      ? 0
      : Math.round(
          documentCoverage.reduce((total, item) => total + item.coverageScore, 0) /
            documentCoverage.length /
            5,
        );
  const practiceRatio = Math.round(
    (stages.reduce((total, stage) => total + stage.practiceDone, 0) /
      Math.max(
        stages.reduce((total, stage) => total + stage.practiceTotal, 0),
        1,
      )) *
      100,
  );
  const overallScore = Math.min(
    100,
    Math.round(averageScore * 0.7 + practiceRatio * 0.2 + Math.min(docBoost, 10)),
  );

  const level: LearningReport["level"] =
    overallScore >= 90
      ? "可进入实战交付"
      : overallScore >= 75
        ? "掌握良好"
        : overallScore >= 60
          ? "基础成型"
          : "需要系统复习";

  const weakStages = stages.filter((stage) => stage.status === "需加强" || (stage.score !== null && stage.score < 75));
  const missingFromDocs = [
    ...new Set(documentCoverage.flatMap((item) => item.missingTopics)),
  ].slice(0, 6);
  const coveredFromDocs = [
    ...new Set(documentCoverage.flatMap((item) => item.coveredTopics)),
  ].slice(0, 6);

  const strengths: string[] = [];
  if (completedStages > 0) strengths.push(`已达标 ${completedStages}/9 个阶段`);
  if (coveredFromDocs.length > 0) strengths.push(`学习文档已覆盖：${coveredFromDocs.slice(0, 4).join("、")}`);
  if (practiceRatio >= 60) strengths.push(`实践完成度 ${practiceRatio}%`);
  if (strengths.length === 0) strengths.push("已建立学习档案，可以从第一个阶段开始积累证据");

  const gaps: string[] = [];
  if (weakStages.length > 0) {
    gaps.push(`待加强阶段：${weakStages.slice(0, 3).map((stage) => `S${stage.week} ${stage.title}`).join("、")}`);
  }
  if (missingFromDocs.length > 0) {
    gaps.push(`文档尚未覆盖：${missingFromDocs.slice(0, 4).join("、")}`);
  }
  const notStarted = stages.filter((stage) => stage.status === "未开始");
  if (notStarted.length > 0) {
    gaps.push(`尚未开始：${notStarted.slice(0, 3).map((stage) => `S${stage.week}`).join("、")}${notStarted.length > 3 ? "…" : ""}`);
  }
  if (documents.length === 0) {
    gaps.push("尚未上传个人学习文档，报告缺少笔记证据");
  }

  const suggestions: string[] = [];
  const nextStage = stages.find((stage) => !stage.passed) ?? stages[stages.length - 1];
  suggestions.push(`下一步优先完成「S${nextStage.week} ${nextStage.title}」的实践清单与验收题。`);
  if (documents.length === 0) {
    suggestions.push("上传本周笔记或练习总结（Markdown/纯文本），系统会据此补全知识覆盖分析。");
  } else if (missingFromDocs.length > 0) {
    suggestions.push(`在笔记中补写：${missingFromDocs.slice(0, 3).join("、")}，并各附一个真实项目例子。`);
  }
  if (weakStages.length > 0) {
    suggestions.push(`重做低分阶段验收：针对「${weakStages[0].title}」用输入—决策—输出—失败四步重写答案。`);
  }
  if (completedStages >= 3 && completedStages < 9) {
    suggestions.push("把已达标阶段的交付物整理成个人知识库目录，方便后续 RAG 练习引用。");
  }
  if (overallScore >= 75) {
    suggestions.push("开始用真实任务串联 Reviewer、预算与人工审批，准备一份可交付的 Agent 报告。");
  } else {
    suggestions.push("先保证当前阶段实践 100% 完成，再提交验收；达标后再推进下一级。");
  }

  const summary =
    documents.length > 0
      ? `综合 ${scored.length} 个阶段评分与 ${documents.length} 篇学习文档，当前整体水平为「${level}」。`
      : `已记录 ${scored.length} 个阶段评分；上传学习文档后可生成更完整的知识覆盖报告。`;

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    level,
    summary,
    completedStages,
    totalStages: curriculum.length,
    documentCount: documents.length,
    strengths,
    gaps,
    suggestions,
    stages,
    documentCoverage,
    nextFocus: `S${nextStage.week} · ${nextStage.title}`,
  };
}
