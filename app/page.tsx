"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { CommunityTab } from "./components/CommunityTab.js";
import { FundamentalsTab } from "./components/FundamentalsTab.js";
import { IndustryTab } from "./components/IndustryTab.js";
import { InterviewTab, type InterviewQuestionView } from "./components/InterviewTab.js";
import { JobsTab } from "./components/JobsTab.js";
import type { AssessmentResult } from "../src/assessment.js";
import { curriculum } from "../src/curriculum.js";
import type { LearningReport } from "../src/learning/report.js";
import type { UserProgress } from "../src/learning/progress.js";

type MainTab = "fundamentals" | "path" | "industry" | "jobs" | "interview" | "community";

const MAIN_TABS: Array<{ id: MainTab; label: string; hint: string }> = [
  { id: "fundamentals", label: "发展史", hint: "AI Agent 时间轴" },
  { id: "path", label: "学习路线", hint: "9 阶段实践与验收" },
  { id: "industry", label: "行业热点", hint: "工程落地趋势" },
  { id: "jobs", label: "招聘市场", hint: "薪资与岗位要求" },
  { id: "interview", label: "面试题", hint: "热点排序题库" },
  { id: "community", label: "讨论问答", hint: "社区互助" },
];

type AuthUser = { id: string; username: string; role: "admin" | "user"; createdAt: string };
type DocMeta = {
  id: string;
  title: string;
  filename: string;
  charCount: number;
  createdAt: string;
};
type ManagedUser = AuthUser & {
  documentCount: number;
  stageScores: number;
  completedStages: number;
  averageScore: number;
  updatedAt: string | null;
};

type LearningStatsView = {
  learnerCount: number;
  activeLearnerCount?: number;
  totalAccounts?: number;
  visitCount: number;
  updatedAt: string;
};

const LOCAL_SCORES = "agent-learning-scores";
const LOCAL_TASKS = "agent-learning-tasks";

function weekAnswersKey(week: number) {
  return `agent-learning-week-${week}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<MainTab>("fundamentals");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<number, number>>({});
  const [completedTasks, setCompletedTasks] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [running, setRunning] = useState(false);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [documents, setDocuments] = useState<DocMeta[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [report, setReport] = useState<LearningReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminSection, setAdminSection] = useState<"users" | "interview">("users");
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminDetail, setAdminDetail] = useState<{
    user: AuthUser;
    progress: UserProgress;
    documents: DocMeta[];
  } | null>(null);
  const [adminQuestions, setAdminQuestions] = useState<InterviewQuestionView[]>([]);
  const [adminQuestionTitle, setAdminQuestionTitle] = useState("");
  const [adminQuestionPrompt, setAdminQuestionPrompt] = useState("");
  const [adminQuestionHint, setAdminQuestionHint] = useState("");
  const [adminQuestionCompanies, setAdminQuestionCompanies] = useState("");
  const [adminQuestionRecruitType, setAdminQuestionRecruitType] = useState<"校招" | "社招">("社招");
  const [adminQuestionTags, setAdminQuestionTags] = useState("");
  const [adminQuestionBoost, setAdminQuestionBoost] = useState(8);
  const [adminQuestionFeatured, setAdminQuestionFeatured] = useState(true);
  const [learningStats, setLearningStats] = useState<LearningStatsView | null>(null);

  const week = curriculum[selectedWeek - 1];
  const levels = ["初级", "中级", "高级"] as const;

  const applyProgress = useCallback((progress: UserProgress) => {
    const nextScores = Object.fromEntries(
      Object.entries(progress.scores).map(([key, value]) => [Number(key), value]),
    ) as Record<number, number>;
    const nextTasks = Object.fromEntries(
      Object.entries(progress.completedTasks).map(([key, value]) => [Number(key), value]),
    ) as Record<number, string[]>;
    setScores(nextScores);
    setCompletedTasks(nextTasks);
    localStorage.setItem(LOCAL_SCORES, JSON.stringify(nextScores));
    localStorage.setItem(LOCAL_TASKS, JSON.stringify(nextTasks));
    for (const [weekKey, weekAnswers] of Object.entries(progress.answers)) {
      localStorage.setItem(weekAnswersKey(Number(weekKey)), JSON.stringify(weekAnswers));
    }
  }, []);

  const syncProgress = useCallback(
    async (patch: {
      scores?: Record<number, number>;
      completedTasks?: Record<number, string[]>;
      answers?: Record<number, Record<string, string>>;
    }) => {
      if (!user) return;
      await fetch("/api/progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: patch.scores
            ? Object.fromEntries(Object.entries(patch.scores).map(([k, v]) => [String(k), v]))
            : undefined,
          completedTasks: patch.completedTasks
            ? Object.fromEntries(
                Object.entries(patch.completedTasks).map(([k, v]) => [String(k), v]),
              )
            : undefined,
          answers: patch.answers
            ? Object.fromEntries(Object.entries(patch.answers).map(([k, v]) => [String(k), v]))
            : undefined,
        }),
      });
    },
    [user],
  );

  const loadDocuments = useCallback(async () => {
    const response = await fetch("/api/documents");
    if (!response.ok) return;
    const data = (await response.json()) as { documents: DocMeta[] };
    setDocuments(data.documents);
  }, []);

  const loadLearningStats = useCallback(async (recordVisit = false) => {
    const response = await fetch(`/api/stats${recordVisit ? "?ping=1" : ""}`);
    if (!response.ok) return;
    const data = (await response.json()) as { stats?: LearningStatsView };
    if (data.stats) setLearningStats(data.stats);
  }, []);

  useEffect(() => {
    const savedScores = localStorage.getItem(LOCAL_SCORES);
    if (savedScores) setScores(JSON.parse(savedScores) as Record<number, number>);
    const savedTasks = localStorage.getItem(LOCAL_TASKS);
    if (savedTasks) setCompletedTasks(JSON.parse(savedTasks) as Record<number, string[]>);

    void (async () => {
      await loadLearningStats(true);
      const response = await fetch("/api/auth/me");
      if (!response.ok) return;
      const data = (await response.json()) as {
        user: AuthUser | null;
        progress?: UserProgress;
      };
      if (data.user) {
        setUser(data.user);
        if (data.progress) applyProgress(data.progress);
        await loadDocuments();
      }
    })();
  }, [applyProgress, loadDocuments, loadLearningStats]);

  useEffect(() => {
    const savedAnswers = localStorage.getItem(weekAnswersKey(selectedWeek));
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
    localStorage.setItem(weekAnswersKey(selectedWeek), JSON.stringify(next));
    void syncProgress({ answers: { [selectedWeek]: next } });
  }

  function toggleTask(taskId: string) {
    const current = completedTasks[selectedWeek] ?? [];
    const nextForStage = current.includes(taskId)
      ? current.filter((id) => id !== taskId)
      : [...current, taskId];
    const next = { ...completedTasks, [selectedWeek]: nextForStage };
    setCompletedTasks(next);
    setResult(null);
    localStorage.setItem(LOCAL_TASKS, JSON.stringify(next));
    void syncProgress({ completedTasks: next });
  }

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: authUsername, password: authPassword }),
      });
      const data = (await response.json()) as { user?: AuthUser; error?: string };
      if (!response.ok || !data.user) throw new Error(data.error ?? "认证失败");

      setUser(data.user);
      setAuthOpen(false);
      setAuthPassword("");

      if (authMode === "login") {
        const me = await fetch("/api/auth/me");
        const meData = (await me.json()) as { progress?: UserProgress };
        if (meData.progress && Object.keys(meData.progress.scores).length > 0) {
          applyProgress(meData.progress);
        } else {
          await syncLocalToServer(data.user);
        }
      } else {
        await syncLocalToServer(data.user);
      }
      await loadDocuments();
      await loadLearningStats(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "认证失败");
    } finally {
      setAuthBusy(false);
    }
  }

  async function syncLocalToServer(_user: AuthUser) {
    const localScores = JSON.parse(localStorage.getItem(LOCAL_SCORES) ?? "{}") as Record<
      number,
      number
    >;
    const localTasks = JSON.parse(localStorage.getItem(LOCAL_TASKS) ?? "{}") as Record<
      number,
      string[]
    >;
    const localAnswers: Record<number, Record<string, string>> = {};
    for (let weekNum = 1; weekNum <= 9; weekNum += 1) {
      const raw = localStorage.getItem(weekAnswersKey(weekNum));
      if (raw) localAnswers[weekNum] = JSON.parse(raw) as Record<string, string>;
    }
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scores: Object.fromEntries(Object.entries(localScores).map(([k, v]) => [String(k), v])),
        completedTasks: Object.fromEntries(
          Object.entries(localTasks).map(([k, v]) => [String(k), v]),
        ),
        answers: Object.fromEntries(Object.entries(localAnswers).map(([k, v]) => [String(k), v])),
      }),
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setDocuments([]);
    setReport(null);
    setAdminOpen(false);
    setManagedUsers([]);
    setAdminDetail(null);
    await loadLearningStats(false);
  }

  async function loadManagedUsers() {
    setAdminBusy(true);
    try {
      const response = await fetch("/api/admin/users");
      const data = (await response.json()) as { users?: ManagedUser[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "加载用户失败");
      setManagedUsers(data.users ?? []);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "加载用户失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function openAdminPanel() {
    setAdminOpen(true);
    setAdminSection("users");
    setAdminDetail(null);
    await loadManagedUsers();
    await loadAdminQuestions();
  }

  async function loadAdminQuestions() {
    const response = await fetch("/api/interview-questions");
    if (!response.ok) return;
    const data = (await response.json()) as { questions?: InterviewQuestionView[] };
    setAdminQuestions(data.questions ?? []);
  }

  async function submitAdminQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdminBusy(true);
    try {
      const response = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: adminQuestionTitle,
          prompt: adminQuestionPrompt,
          answerHint: adminQuestionHint,
          companies: adminQuestionCompanies
            .split(/[,，、;/；]+/)
            .map((company) => company.trim())
            .filter(Boolean),
          recruitType: adminQuestionRecruitType,
          tags: adminQuestionTags
            .split(/[,，、;/；]+/)
            .map((tag) => tag.trim())
            .filter(Boolean),
          featured: adminQuestionFeatured,
          adminBoost: adminQuestionBoost,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "上传失败");
      setAdminQuestionTitle("");
      setAdminQuestionPrompt("");
      setAdminQuestionHint("");
      setAdminQuestionCompanies("");
      setAdminQuestionRecruitType("社招");
      setAdminQuestionTags("");
      await loadAdminQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function toggleQuestionFeatured(id: string, featured: boolean) {
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/interview-questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !featured }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "更新失败");
      await loadAdminQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "更新失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function boostQuestion(id: string, current: number) {
    const next = window.prompt("设置管理员加权（0–20）", String(current));
    if (next === null) return;
    const value = Number(next);
    if (!Number.isFinite(value)) {
      window.alert("请输入数字");
      return;
    }
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/interview-questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminBoost: value }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "更新失败");
      await loadAdminQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "更新失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function removeAdminQuestion(id: string) {
    if (!window.confirm("确认删除该面试题？")) return;
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/interview-questions/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除失败");
      await loadAdminQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function viewManagedUser(id: string) {
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`);
      const data = (await response.json()) as {
        user?: AuthUser;
        progress?: UserProgress;
        documents?: DocMeta[];
        error?: string;
      };
      if (!response.ok || !data.user || !data.progress) {
        throw new Error(data.error ?? "加载用户详情失败");
      }
      setAdminDetail({
        user: data.user,
        progress: data.progress,
        documents: data.documents ?? [],
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "加载用户详情失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function resetManagedPassword(id: string, username: string) {
    const password = window.prompt(`为「${username}」设置新密码（至少 6 位）`);
    if (!password) return;
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "重置密码失败");
      window.alert("密码已重置");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "重置密码失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function toggleManagedRole(id: string, role: "admin" | "user") {
    const nextRole = role === "admin" ? "user" : "admin";
    if (!window.confirm(`确认将角色改为「${nextRole}」？`)) return;
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "更新角色失败");
      await loadManagedUsers();
      if (adminDetail?.user.id === id) {
        await viewManagedUser(id);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "更新角色失败");
    } finally {
      setAdminBusy(false);
    }
  }

  async function removeManagedUser(id: string, username: string) {
    if (!window.confirm(`确认删除用户「${username}」及其全部学习数据？此操作不可恢复。`)) return;
    setAdminBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除失败");
      if (adminDetail?.user.id === id) setAdminDetail(null);
      await loadManagedUsers();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setAdminBusy(false);
    }
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
      localStorage.setItem(LOCAL_SCORES, JSON.stringify(nextScores));
      void syncProgress({
        scores: nextScores,
        completedTasks,
        answers: { [selectedWeek]: answers },
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "评分失败");
    } finally {
      setRunning(false);
    }
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setDocBusy(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle || `阶段 ${selectedWeek} 笔记`,
          filename: `${noteTitle || `stage-${selectedWeek}`}.md`,
          content: noteContent,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "保存失败");
      setNoteContent("");
      setNoteTitle("");
      await loadDocuments();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "保存失败");
    } finally {
      setDocBusy(false);
    }
  }

  async function uploadFile(file: File) {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setDocBusy(true);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("title", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch("/api/documents", { method: "POST", body: form });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "上传失败");
      await loadDocuments();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setDocBusy(false);
    }
  }

  async function removeDocument(id: string) {
    if (!user) return;
    const response = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (response.ok) await loadDocuments();
  }

  async function generateReport() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setReportBusy(true);
    try {
      const response = await fetch("/api/report");
      const data = (await response.json()) as { report?: LearningReport; error?: string };
      if (!response.ok || !data.report) throw new Error(data.error ?? "生成报告失败");
      setReport(data.report);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "生成报告失败");
    } finally {
      setReportBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>
            Agent<span className="brand-light">Path</span>
          </span>
        </div>
        <div className="topbar-meta">
          {learningStats && (
            <>
              <span className="learner-stat-inline">
                学习人数 {learningStats.learnerCount}
              </span>
              <span className="meta-divider" />
              <span className="learner-stat-inline">
                累计访问 {learningStats.visitCount}
              </span>
              <span className="meta-divider" />
            </>
          )}
          <span>TS 65%</span>
          <span className="meta-divider" />
          <span>Python 35%</span>
          <span className="duration-pill">6 页签 · 学习台</span>
          {user ? (
            <div className="auth-chip">
              <span>
                {user.username}
                {user.role === "admin" ? " · 管理员" : ""}
              </span>
              {user.role === "admin" && (
                <button onClick={() => void openAdminPanel()} type="button">
                  用户管理
                </button>
              )}
              <button onClick={() => void logout()} type="button">
                退出
              </button>
            </div>
          ) : (
            <button className="auth-trigger" onClick={() => setAuthOpen(true)} type="button">
              登录 / 注册
            </button>
          )}
        </div>
      </header>

      {authOpen && (
        <div className="auth-backdrop" onClick={() => setAuthOpen(false)}>
          <div className="auth-panel" onClick={(event) => event.stopPropagation()}>
            <div className="auth-tabs">
              <button
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
                type="button"
              >
                登录
              </button>
              <button
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
                type="button"
              >
                注册
              </button>
            </div>
            <p className="auth-copy">
              登录后，学习进度、验收答案与个人文档会保存到你的账号，并可生成总学习报告。
              管理员账号默认可用 admin / admin123456（可用环境变量修改）。
            </p>
            <form onSubmit={(event) => void submitAuth(event)}>
              <label>
                用户名
                <input
                  autoComplete="username"
                  onChange={(event) => setAuthUsername(event.target.value)}
                  required
                  value={authUsername}
                />
              </label>
              <label>
                密码
                <input
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  required
                  type="password"
                  value={authPassword}
                />
              </label>
              {authError && <p className="auth-error">{authError}</p>}
              <button disabled={authBusy} type="submit">
                {authBusy ? "处理中…" : authMode === "login" ? "登录并同步进度" : "创建账号"}
              </button>
            </form>
          </div>
        </div>
      )}

      {adminOpen && user?.role === "admin" && (
        <div className="auth-backdrop" onClick={() => setAdminOpen(false)}>
          <div
            className="admin-panel admin-panel-wide"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-label="管理控制台"
          >
            <div className="admin-header">
              <div>
                <p className="section-label">ADMIN CONSOLE</p>
                <h3>管理控制台</h3>
                <p>管理登录用户，并上传/加权企业 AI Agent 面试题，汇总到学员「面试题」页签。</p>
              </div>
              <div className="admin-header-actions">
                <button
                  disabled={adminBusy}
                  onClick={() =>
                    void (adminSection === "users" ? loadManagedUsers() : loadAdminQuestions())
                  }
                  type="button"
                >
                  刷新
                </button>
                <button onClick={() => setAdminOpen(false)} type="button">
                  关闭
                </button>
              </div>
            </div>

            <div className="admin-section-tabs">
              <button
                className={adminSection === "users" ? "active" : ""}
                onClick={() => setAdminSection("users")}
                type="button"
              >
                用户管理
              </button>
              <button
                className={adminSection === "interview" ? "active" : ""}
                onClick={() => {
                  setAdminSection("interview");
                  void loadAdminQuestions();
                }}
                type="button"
              >
                面试题管理
              </button>
            </div>

            {adminSection === "users" && (
            <div className="admin-grid">
              <div className="admin-user-list">
                {managedUsers.length === 0 && !adminBusy && <p className="admin-empty">暂无用户</p>}
                {managedUsers.map((item) => (
                  <button
                    className={`admin-user-row ${adminDetail?.user.id === item.id ? "active" : ""}`}
                    key={item.id}
                    onClick={() => void viewManagedUser(item.id)}
                    type="button"
                  >
                    <span>
                      <strong>
                        {item.username}
                        {item.role === "admin" ? " · 管理员" : ""}
                      </strong>
                      <small>
                        文档 {item.documentCount} · 评分阶段 {item.stageScores} · 均分{" "}
                        {item.averageScore || "—"}
                      </small>
                    </span>
                    <em>{new Date(item.createdAt).toLocaleDateString()}</em>
                  </button>
                ))}
              </div>

              <div className="admin-detail">
                {!adminDetail && <p className="admin-empty">选择左侧用户查看详情</p>}
                {adminDetail && (
                  <>
                    <div className="admin-detail-head">
                      <div>
                        <h4>
                          {adminDetail.user.username}
                          <span>{adminDetail.user.role === "admin" ? "管理员" : "学员"}</span>
                        </h4>
                        <small>ID {adminDetail.user.id}</small>
                      </div>
                      <div className="admin-detail-actions">
                        <button
                          disabled={adminBusy}
                          onClick={() =>
                            void resetManagedPassword(adminDetail.user.id, adminDetail.user.username)
                          }
                          type="button"
                        >
                          重置密码
                        </button>
                        <button
                          disabled={adminBusy}
                          onClick={() =>
                            void toggleManagedRole(adminDetail.user.id, adminDetail.user.role)
                          }
                          type="button"
                        >
                          {adminDetail.user.role === "admin" ? "降为学员" : "设为管理员"}
                        </button>
                        <button
                          className="danger"
                          disabled={adminBusy || adminDetail.user.id === user.id}
                          onClick={() =>
                            void removeManagedUser(adminDetail.user.id, adminDetail.user.username)
                          }
                          type="button"
                        >
                          删除账号
                        </button>
                      </div>
                    </div>

                    <div className="admin-stats">
                      <p>
                        <strong>{Object.keys(adminDetail.progress.scores).length}</strong>
                        <span>已评阶段</span>
                      </p>
                      <p>
                        <strong>{adminDetail.documents.length}</strong>
                        <span>学习文档</span>
                      </p>
                      <p>
                        <strong>
                          {Object.values(adminDetail.progress.scores).length
                            ? Math.round(
                                Object.values(adminDetail.progress.scores).reduce(
                                  (total, score) => total + score,
                                  0,
                                ) / Object.values(adminDetail.progress.scores).length,
                              )
                            : "—"}
                        </strong>
                        <span>平均分</span>
                      </p>
                    </div>

                    <div className="admin-score-list">
                      <h5>阶段评分</h5>
                      {Object.keys(adminDetail.progress.scores).length === 0 && (
                        <p className="admin-empty">尚未提交验收</p>
                      )}
                      {Object.entries(adminDetail.progress.scores).map(([week, score]) => (
                        <div key={week}>
                          <span>阶段 {week}</span>
                          <strong>{score}</strong>
                          <small>
                            实践 {(adminDetail.progress.completedTasks[Number(week)] ?? []).length} 项
                          </small>
                        </div>
                      ))}
                    </div>

                    <div className="admin-doc-list">
                      <h5>文档</h5>
                      {adminDetail.documents.length === 0 && (
                        <p className="admin-empty">暂无上传文档</p>
                      )}
                      {adminDetail.documents.map((doc) => (
                        <div key={doc.id}>
                          <strong>{doc.title}</strong>
                          <small>
                            {doc.charCount} 字 · {new Date(doc.createdAt).toLocaleString()}
                          </small>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            )}

            {adminSection === "interview" && (
              <div className="admin-interview">
                <form
                  className="interview-form admin-interview-form"
                  onSubmit={(event) => void submitAdminQuestion(event)}
                >
                  <div className="block-heading">
                    <p className="section-label">PUBLISH</p>
                    <h4>管理员上传面试题</h4>
                    <p className="block-subcopy">上传后立即进入学员「面试题」页签，并按热点分排序。</p>
                  </div>
                  <input
                    onChange={(event) => setAdminQuestionTitle(event.target.value)}
                    placeholder="题目标题"
                    required
                    value={adminQuestionTitle}
                  />
                  <textarea
                    onChange={(event) => setAdminQuestionPrompt(event.target.value)}
                    placeholder="完整题目"
                    required
                    rows={4}
                    value={adminQuestionPrompt}
                  />
                  <textarea
                    onChange={(event) => setAdminQuestionHint(event.target.value)}
                    placeholder="参考要点（可选）"
                    rows={2}
                    value={adminQuestionHint}
                  />
                  <input
                    onChange={(event) => setAdminQuestionCompanies(event.target.value)}
                    placeholder="公司（必填，多家用逗号分隔，例如：字节跳动, 阿里, OpenAI）"
                    required
                    value={adminQuestionCompanies}
                  />
                  <div className="recruit-type-picker" role="radiogroup" aria-label="招聘类型">
                    <span>招聘类型</span>
                    <label>
                      <input
                        checked={adminQuestionRecruitType === "校招"}
                        name="adminRecruitType"
                        onChange={() => setAdminQuestionRecruitType("校招")}
                        type="radio"
                        value="校招"
                      />
                      校招
                    </label>
                    <label>
                      <input
                        checked={adminQuestionRecruitType === "社招"}
                        name="adminRecruitType"
                        onChange={() => setAdminQuestionRecruitType("社招")}
                        type="radio"
                        value="社招"
                      />
                      社招
                    </label>
                  </div>
                  <input
                    onChange={(event) => setAdminQuestionTags(event.target.value)}
                    placeholder="标签，逗号分隔"
                    value={adminQuestionTags}
                  />
                  <div className="admin-interview-options">
                    <label>
                      加权
                      <input
                        max={20}
                        min={0}
                        onChange={(event) => setAdminQuestionBoost(Number(event.target.value))}
                        type="number"
                        value={adminQuestionBoost}
                      />
                    </label>
                    <label className="checkbox-inline">
                      <input
                        checked={adminQuestionFeatured}
                        onChange={(event) => setAdminQuestionFeatured(event.target.checked)}
                        type="checkbox"
                      />
                      标记为精选
                    </label>
                    <button disabled={adminBusy} type="submit">
                      {adminBusy ? "上传中…" : "发布到学员题库"}
                    </button>
                  </div>
                </form>

                <div className="admin-question-list">
                  <div className="block-heading">
                    <p className="section-label">BANK</p>
                    <h4>当前题库（热点序）</h4>
                  </div>
                  {adminQuestions.length === 0 && <p className="admin-empty">暂无题目</p>}
                  {adminQuestions.map((item, index) => (
                    <div className="admin-question-row" key={item.id}>
                      <div>
                        <strong>
                          #{index + 1} {item.title}
                        </strong>
                        <small>
                          HOT {Math.round(item.hotScore)} · 有用{" "}
                          {item.usefulVotes ?? item.votes ?? 0} · 没用 {item.uselessVotes ?? 0} · 加权{" "}
                          {item.adminBoost} · {item.authorName}
                          {item.featured ? " · 精选" : ""}
                          {` · ${item.recruitType ?? "校招"}`}
                          {(item.companies ?? []).length > 0
                            ? ` · ${(item.companies ?? []).join(" / ")}`
                            : ""}
                        </small>
                      </div>
                      <div className="admin-detail-actions">
                        <button
                          disabled={adminBusy}
                          onClick={() => void toggleQuestionFeatured(item.id, item.featured)}
                          type="button"
                        >
                          {item.featured ? "取消精选" : "设为精选"}
                        </button>
                        <button
                          disabled={adminBusy}
                          onClick={() => void boostQuestion(item.id, item.adminBoost)}
                          type="button"
                        >
                          调加权
                        </button>
                        <button
                          className="danger"
                          disabled={adminBusy}
                          onClick={() => void removeAdminQuestion(item.id)}
                          type="button"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <nav className="main-tabs" aria-label="主导航页签" role="tablist">
        {MAIN_TABS.map((tab, index) => (
          <button
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            role="tab"
            type="button"
          >
            <span className="main-tab-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="main-tab-copy">
              <strong>{tab.label}</strong>
              <small>{tab.hint}</small>
            </span>
          </button>
        ))}
      </nav>

      {user?.role === "admin" && (
        <section className="learner-stats-bar" aria-label="学习人数统计">
          <div className="learner-stats-copy">
            <p className="section-label">LEARNING STATS</p>
            <strong>平台学习数据</strong>
            <p className="block-subcopy">管理员可查看完整统计。</p>
          </div>
          <div className="learner-stats-grid admin-view">
            <article>
              <small>学习人数</small>
              <strong>{learningStats?.learnerCount ?? "—"}</strong>
              <span>已注册学员账号</span>
            </article>
            <article>
              <small>累计访问</small>
              <strong>{learningStats?.visitCount ?? "—"}</strong>
              <span>学习台打开次数</span>
            </article>
            <article>
              <small>活跃学习</small>
              <strong>{learningStats?.activeLearnerCount ?? "—"}</strong>
              <span>已有进度的学员</span>
            </article>
            <article>
              <small>账号总数</small>
              <strong>{learningStats?.totalAccounts ?? "—"}</strong>
              <span>含管理员账号</span>
            </article>
          </div>
        </section>
      )}

      {activeTab === "fundamentals" && <FundamentalsTab />}
      {activeTab === "industry" && <IndustryTab />}
      {activeTab === "jobs" && <JobsTab />}
      {activeTab === "interview" && (
        <InterviewTab user={user} onRequireLogin={() => setAuthOpen(true)} />
      )}
      {activeTab === "community" && (
        <CommunityTab user={user} onRequireLogin={() => setAuthOpen(true)} />
      )}

      {activeTab === "path" && (
      <>
      <section className="hero">
        <div>
          <p className="eyebrow">AI AGENT ENGINEERING · LEARNING OS</p>
          <h1>
            <em>Agent Builder</em>
          </h1>
          <p className="hero-copy">
            Agent Learning 初级、中级、高级进阶路径。每阶段都有精读资料、可勾选实践、验收问题与量化评分；登录后可保存个人数据并生成总报告。
          </p>
        </div>
        <div className="progress-card">
          <div
            className="progress-ring"
            style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
          >
            <div>
              <strong>{progress}%</strong>
              <span>总进度</span>
            </div>
          </div>
          <div className="progress-stats">
            <p>
              <strong>{completedCount}</strong>
              <span>/ 9 阶段达标</span>
            </p>
            <p>
              <strong>{averageScore || "—"}</strong>
              <span>平均评分</span>
            </p>
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
                  {curriculum
                    .filter((item) => item.level === level)
                    .map((item) => {
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
                          <span
                            className="timeline-node"
                            style={{ "--week-color": item.color } as React.CSSProperties}
                          >
                            {completed ? "✓" : item.week}
                          </span>
                          <span className="timeline-copy">
                            <small>
                              {item.phase} · STAGE {String(item.week).padStart(2, "0")}
                            </small>
                            <strong>{item.title}</strong>
                          </span>
                          {scores[item.week] !== undefined && (
                            <span className="mini-score">{scores[item.week]}</span>
                          )}
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
                <span>
                  {week.level} · {week.phase}
                </span>
                <span>·</span>
                <span>{week.hours}</span>
              </div>
              <h2>{week.title}</h2>
              <p>{week.summary}</p>
            </div>
          </div>

          <div className="content-grid">
            <section className="content-card knowledge-card">
              <div className="card-kicker">
                <span>01</span> 核心知识点
              </div>
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
                <b>
                  {completedTasks[selectedWeek]?.length ?? 0}/{week.practice.length}
                </b>
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
                  <small>
                    <b>本阶段目标</b>
                    {resource.target}
                  </small>
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

            <form className="assessment-form" onSubmit={(event) => void submitAssessment(event)}>
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
                <div className="score-value">
                  <strong>{result.score}</strong>
                  <span>/ 100</span>
                </div>
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
                    {result.suggestions.map((suggestion) => (
                      <li key={suggestion}>{suggestion}</li>
                    ))}
                  </ol>
                </div>
              </div>

              {selectedWeek < curriculum.length &&
                result.score >= 75 &&
                result.completionScore === 100 && (
                  <button
                    className="next-week-button"
                    onClick={() => selectWeek(selectedWeek + 1)}
                    type="button"
                  >
                    进入阶段 {selectedWeek + 1} <span>→</span>
                  </button>
                )}
            </section>
          )}

          <section className="docs-section">
            <div className="docs-heading">
              <div>
                <p className="section-label">PERSONAL CORPUS</p>
                <h3>学习文档</h3>
                <p>粘贴笔记或上传 Markdown/文本，系统会据此分析知识覆盖并生成总报告建议。</p>
              </div>
              {!user && (
                <button className="ghost-button" onClick={() => setAuthOpen(true)} type="button">
                  登录后保存
                </button>
              )}
            </div>

            <form className="note-form" onSubmit={(event) => void saveNote(event)}>
              <input
                onChange={(event) => setNoteTitle(event.target.value)}
                placeholder="笔记标题（可选）"
                value={noteTitle}
              />
              <textarea
                onChange={(event) => setNoteContent(event.target.value)}
                placeholder="粘贴本周学习笔记、练习总结或项目复盘…"
                rows={6}
                value={noteContent}
              />
              <div className="note-actions">
                <label className="file-button">
                  上传文件
                  <input
                    accept=".md,.txt,.markdown,text/plain,text/markdown"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFile(file);
                      event.target.value = "";
                    }}
                    type="file"
                  />
                </label>
                <button disabled={docBusy || noteContent.trim().length < 20} type="submit">
                  {docBusy ? "保存中…" : "保存到我的学习库"}
                </button>
              </div>
            </form>

            {documents.length > 0 && (
              <ul className="doc-list">
                {documents.map((doc) => (
                  <li key={doc.id}>
                    <div>
                      <strong>{doc.title}</strong>
                      <small>
                        {doc.charCount} 字 · {new Date(doc.createdAt).toLocaleString()}
                      </small>
                    </div>
                    <button onClick={() => void removeDocument(doc.id)} type="button">
                      删除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="report-section">
            <div className="docs-heading">
              <div>
                <p className="section-label">FINAL REPORT</p>
                <h3>学习总报告</h3>
                <p>综合各阶段评分、实践完成度与个人文档覆盖，生成最终打分与今后学习建议。</p>
              </div>
              <button
                className="report-button"
                disabled={reportBusy}
                onClick={() => void generateReport()}
                type="button"
              >
                {reportBusy ? "生成中…" : "生成总报告"}
              </button>
            </div>

            {report && (
              <div className="final-report">
                <div className="final-score">
                  <strong>{report.overallScore}</strong>
                  <div>
                    <span className="level-badge">{report.level}</span>
                    <p>{report.summary}</p>
                    <small>
                      达标 {report.completedStages}/{report.totalStages} · 文档{" "}
                      {report.documentCount} 篇 · 下一步 {report.nextFocus}
                    </small>
                  </div>
                </div>

                <div className="report-columns">
                  <div>
                    <h4>优势</h4>
                    <ul>
                      {report.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>缺口</h4>
                    <ul>
                      {report.gaps.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4>今后学习建议</h4>
                    <ol>
                      {report.suggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="stage-report-grid">
                  {report.stages.map((stage) => (
                    <div className={`stage-pill status-${stage.status}`} key={stage.week}>
                      <span>S{stage.week}</span>
                      <strong>{stage.title}</strong>
                      <small>
                        {stage.status}
                        {stage.score !== null ? ` · ${stage.score}` : ""}
                      </small>
                    </div>
                  ))}
                </div>

                {report.documentCoverage.length > 0 && (
                  <div className="doc-coverage">
                    <h4>文档知识覆盖</h4>
                    {report.documentCoverage.map((item) => (
                      <div key={item.documentId}>
                        <div className="coverage-head">
                          <strong>{item.title}</strong>
                          <span>{item.coverageScore}%</span>
                        </div>
                        {item.coveredTopics.length > 0 && (
                          <p>已覆盖：{item.coveredTopics.slice(0, 5).join("、")}</p>
                        )}
                        {item.missingTopics.length > 0 && (
                          <p>待补：{item.missingTopics.slice(0, 4).join("、")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </section>
      </div>
      </>
      )}
    </main>
  );
}
