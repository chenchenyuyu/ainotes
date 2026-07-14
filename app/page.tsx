"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import type { AssessmentResult } from "../src/assessment.js";
import { curriculum } from "../src/curriculum.js";

export default function Home() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<number, number>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [running, setRunning] = useState(false);
  const week = curriculum[selectedWeek - 1];
  const levels = ["初级", "中级", "高级"] as const;

  useEffect(() => {
    const savedScores = localStorage.getItem("agent-learning-scores");
    if (savedScores) setScores(JSON.parse(savedScores) as Record<number, number>);
    const savedTasks = localStorage.getItem("agent-learning-tasks");
    if (savedTasks) setCompletedTasks(JSON.parse(savedTasks) as Record<number, string[]>);
  }, []);

  useEffect(() => {
    const savedAnswers = localStorage.getItem(`agent-learning-week-${selectedWeek}`);
    setAnswers(savedAnswers ? (JSON.parse(savedAnswers) as Record<string, string>) : {});
    setResult(null);
  }, [selectedWeek]);

  const completedCount = curriculum.filter(
    (item) =>
      (scores[item.week] ?? 0) >= 75 &&
      (completedTasks[item.week]?.length ?? 0) === item.practice.length,
  ).length;
  const totalTaskCount = curriculum.reduce((total, item) => total + item.practice.length, 0);
  const checkedTaskCount = curriculum.reduce(
    (total, item) => total + (completedTasks[item.week]?.length ?? 0),
    0,
  );
  const progress = Math.round((checkedTaskCount / totalTaskCount) * 100);
  const averageScore = useMemo(() => {
    const values = Object.values(scores);
    return values.length
      ? Math.round(values.reduce((total, score) => total + score, 0) / values.length)
      : 0;
  }, [scores]);
  const canSubmit = week.questions.every(
    (question) => (answers[question.id]?.trim().length ?? 0) >= 12,
  );

  function selectWeek(nextWeek: number) {
    setSelectedWeek(nextWeek);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateAnswer(questionId: string, answer: string) {
    const next = { ...answers, [questionId]: answer };
    setAnswers(next);
    localStorage.setItem(`agent-learning-week-${selectedWeek}`, JSON.stringify(next));
  }

  function toggleTask(taskId: string) {
    const current = completedTasks[selectedWeek] ?? [];
    const nextForStage = current.includes(taskId)
      ? current.filter((id) => id !== taskId)
      : [...current, taskId];
    const next = { ...completedTasks, [selectedWeek]: nextForStage };
    setCompletedTasks(next);
    setResult(null);
    localStorage.setItem("agent-learning-tasks", JSON.stringify(next));
  }

  async function submitAssessment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || running) return;
    setRunning(true);
    try {
      const response = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week: selectedWeek,
          answers,
          completedTaskIds: completedTasks[selectedWeek] ?? [],
        }),
      });
      if (!response.ok) throw new Error("评分失败，请稍后重试");
      const assessment = (await response.json()) as AssessmentResult;
      setResult(assessment);
      const nextScores = { ...scores, [selectedWeek]: assessment.score };
      setScores(nextScores);
      localStorage.setItem("agent-learning-scores", JSON.stringify(nextScores));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "评分失败");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>Agent<span className="brand-light">Path</span></span>
        </div>
        <div className="topbar-meta">
          <span>TS 65%</span>
          <span className="meta-divider" />
          <span>Python 35%</span>
          <span className="duration-pill">3 级 · 9 阶段</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">AI AGENT ENGINEERING · LEARNING OS</p>
          {/* <h1>从前端工程师到<br /><em>Agent Builder</em></h1> */}
          <h1><em>Agent Builder</em></h1>
          <p className="hero-copy">
            Agent Learning初级、中级、高级进阶路径。
            每阶段都有精读资料、可勾选实践、验收问题与量化评分。
          </p>
        </div>
        <div className="progress-card">
          <div className="progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{progress}%</strong><span>总进度</span></div>
          </div>
          <div className="progress-stats">
            <p><strong>{completedCount}</strong><span>/ 9 阶段达标</span></p>
            <p><strong>{averageScore || "—"}</strong><span>平均评分</span></p>
          </div>
        </div>
      </section>

      <div className="workspace">
        <aside className="timeline" aria-label="三级 Agent 学习路线">
          <div className="section-label">LEARNING ROADMAP</div>
          <div className="level-list">
            {levels.map((level) => (
              <section className="level-group" key={level}>
                <div className="level-title">
                  <strong>{level}</strong>
                  <span>{curriculum.filter((item) => item.level === level).length} 阶段</span>
                </div>
                <div className="timeline-list">
                  {curriculum.filter((item) => item.level === level).map((item) => {
                    const completed =
                      (scores[item.week] ?? 0) >= 75 &&
                      (completedTasks[item.week]?.length ?? 0) === item.practice.length;
                    const active = item.week === selectedWeek;
                    return (
                      <button
                        aria-current={active ? "step" : undefined}
                        className={`timeline-item ${active ? "active" : ""} ${completed ? "completed" : ""}`}
                        key={item.week}
                        onClick={() => selectWeek(item.week)}
                        type="button"
                      >
                        <span className="timeline-node" style={{ "--week-color": item.color } as React.CSSProperties}>
                          {completed ? "✓" : item.week}
                        </span>
                        <span className="timeline-copy">
                          <small>{item.phase} · STAGE {String(item.week).padStart(2, "0")}</small>
                          <strong>{item.title}</strong>
                        </span>
                        {scores[item.week] !== undefined && <span className="mini-score">{scores[item.week]}</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>

        <section className="week-panel">
          <div className="week-heading">
            <div className="week-index" style={{ color: week.color }}>
              {String(week.week).padStart(2, "0")}
            </div>
            <div>
              <div className="week-meta">
                <span>{week.level} · {week.phase}</span>
                <span>·</span>
                <span>{week.hours}</span>
              </div>
              <h2>{week.title}</h2>
              <p>{week.summary}</p>
            </div>
          </div>

          <div className="content-grid">
            <section className="content-card knowledge-card">
              <div className="card-kicker"><span>01</span> 核心知识点</div>
              <div className="knowledge-list">
                {week.knowledge.map((point, index) => (
                  <div key={point}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {point}
                  </div>
                ))}
              </div>
            </section>

            <section className="content-card">
              <div className="card-kicker">
                <span>02</span> 实践清单
                <b>{completedTasks[selectedWeek]?.length ?? 0}/{week.practice.length}</b>
              </div>
              <div className="practice-list">
                {week.practice.map((item) => {
                  const checked = completedTasks[selectedWeek]?.includes(item.id) ?? false;
                  return (
                    <label className={checked ? "checked" : ""} key={item.id}>
                      <input
                        checked={checked}
                        onChange={() => toggleTask(item.id)}
                        type="checkbox"
                      />
                      <span>
                        <strong>{item.title}</strong>
                        <small>验收：{item.acceptance}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="deliverable">
                <small>DELIVERABLE</small>
                <strong>{week.deliverable}</strong>
              </div>
            </section>
          </div>

          <section className="resources-section">
            <div className="resources-heading">
              <div>
                <p className="section-label">CURATED MATERIALS</p>
                <h3>学习资料</h3>
              </div>
              <p>按“学习目标”阅读，避免无目的收藏。</p>
            </div>
            <div className="resource-grid">
              {week.resources.map((resource) => (
                <a href={resource.url} key={resource.url} rel="noreferrer" target="_blank">
                  <span>{resource.kind}</span>
                  <h4>{resource.title}</h4>
                  <p>{resource.description}</p>
                  <small><b>本阶段目标</b>{resource.target}</small>
                  <i aria-hidden="true">↗</i>
                </a>
              ))}
            </div>
          </section>

          <section className="assessment-section">
            <div className="assessment-heading">
              <div>
                <p className="section-label">KNOWLEDGE CHECK</p>
                <h3>学习验收</h3>
                <p>总分 = 知识作答 80% + 实践完成 20%；达到 75 分且清单全完成才算达标。</p>
              </div>
              <span className="question-count">{week.questions.length} QUESTIONS</span>
            </div>

            <form className="assessment-form" onSubmit={submitAssessment}>
              {week.questions.map((question, index) => (
                <div className="question-block" key={question.id}>
                  <div className="question-number">Q{index + 1}</div>
                  <div className="question-body">
                    <label htmlFor={question.id}>{question.prompt}</label>
                    <p>{question.hint}</p>
                    <textarea
                      id={question.id}
                      onChange={(event) => updateAnswer(question.id, event.target.value)}
                      placeholder="请结合概念、原因和实际场景作答…"
                      rows={5}
                      value={answers[question.id] ?? ""}
                    />
                    <small>{answers[question.id]?.trim().length ?? 0} 字 · 至少 12 字</small>
                  </div>
                </div>
              ))}
              <button className="submit-button" disabled={!canSubmit || running} type="submit">
                <span>{running ? "正在分析回答…" : "提交验收并评分"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>

          {result && (
            <section className="result-panel" aria-live="polite">
              <div className="score-summary">
                <div className="score-value"><strong>{result.score}</strong><span>/ 100</span></div>
                <div>
                  <span className="level-badge">{result.level}</span>
                  <h3>{result.summary}</h3>
                  <p className="score-breakdown">
                    知识 {result.knowledgeScore} · 实践 {result.completionScore}
                  </p>
                </div>
              </div>

              <div className="feedback-grid">
                <div>
                  <h4>逐题反馈</h4>
                  {result.questions.map((question, index) => (
                    <div className="question-feedback" key={question.questionId}>
                      <span>Q{index + 1}</span>
                      <p>{question.feedback}</p>
                      <strong>{question.score}</strong>
                    </div>
                  ))}
                </div>
                <div className="advice-card">
                  <h4>下一步建议</h4>
                  <ol>
                    {result.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
                  </ol>
                </div>
              </div>

              {selectedWeek < curriculum.length && result.score >= 75 && result.completionScore === 100 && (
                <button className="next-week-button" onClick={() => selectWeek(selectedWeek + 1)} type="button">
                  进入阶段 {selectedWeek + 1} <span>→</span>
                </button>
              )}
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
