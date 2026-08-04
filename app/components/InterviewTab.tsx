"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

export type InterviewQuestionView = {
  id: string;
  title: string;
  prompt: string;
  answerHint: string;
  tags: string[];
  companies: string[];
  recruitType: "校招" | "社招";
  votes: number;
  usefulVotes: number;
  uselessVotes: number;
  adminBoost: number;
  hotScore: number;
  source: "admin" | "user" | "system";
  authorId: string;
  authorName: string;
  featured: boolean;
  createdAt: string;
};

type AuthUser = { id: string; username: string; role: "admin" | "user"; createdAt: string };

type Props = {
  user: AuthUser | null;
  onRequireLogin: () => void;
};

export function InterviewTab({ user, onRequireLogin }: Props) {
  const [questions, setQuestions] = useState<InterviewQuestionView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answerHint, setAnswerHint] = useState("");
  const [companies, setCompanies] = useState("");
  const [recruitType, setRecruitType] = useState<"校招" | "社招">("社招");
  const [tags, setTags] = useState("");
  const [filter, setFilter] = useState("");
  const [recruitFilter, setRecruitFilter] = useState<"全部" | "校招" | "社招">("全部");

  function splitList(value: string): string[] {
    return value
      .split(/[,，、;/；]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/interview-questions");
      const data = (await response.json()) as { questions?: InterviewQuestionView[] };
      setQuestions(data.questions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  const visible = useMemo(() => {
    const keyword = filter.trim().toLocaleLowerCase();
    return questions.filter((item) => {
      if (recruitFilter !== "全部" && (item.recruitType ?? "校招") !== recruitFilter) {
        return false;
      }
      if (!keyword) return true;
      return (
        item.title.toLocaleLowerCase().includes(keyword) ||
        item.prompt.toLocaleLowerCase().includes(keyword) ||
        (item.tags ?? []).some((tag) => tag.toLocaleLowerCase().includes(keyword)) ||
        (item.companies ?? []).some((company) => company.toLocaleLowerCase().includes(keyword))
      );
    });
  }, [filter, questions, recruitFilter]);

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      onRequireLogin();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          prompt,
          answerHint,
          companies: splitList(companies),
          recruitType,
          tags: splitList(tags),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "上传失败");
      setTitle("");
      setPrompt("");
      setAnswerHint("");
      setCompanies("");
      setRecruitType("社招");
      setTags("");
      await loadQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "上传失败");
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: string, value: "useful" | "useless") {
    if (!user) {
      onRequireLogin();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/interview-questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "投票失败");
      await loadQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "投票失败");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!user) return;
    if (!window.confirm("确认删除这道面试题？")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/interview-questions/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除失败");
      await loadQuestions();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tab-page">
      <header className="tab-hero">
        <p className="eyebrow">INTERVIEW HOTLIST</p>
        <h1>企业 AI Agent 面试题</h1>
        <p className="hero-copy">
          汇学员投稿与管理员精选，按热点分排序。登录后可对题目投「有用 / 没用」；管理员可在管理台批量补充并加权。
        </p>
      </header>

      <section className="content-block">
        <div className="interview-list-head">
          <div className="block-heading">
            <p className="section-label">HOT RANKING</p>
            <h2>热点排序题库</h2>
            <p className="block-subcopy">
              热点分 = 有用 × 3 − 没用 × 2 + 管理员加权 × 5 + 精选加成 + 新题时效分。
            </p>
          </div>
          <div className="interview-list-controls">
            <input
              className="interview-filter"
              onChange={(event) => setFilter(event.target.value)}
              placeholder="搜索题目 / 公司 / 标签"
              value={filter}
            />
            <div className="recruit-filter">
              {(["全部", "校招", "社招"] as const).map((option) => (
                <button
                  className={recruitFilter === option ? "active" : ""}
                  key={option}
                  onClick={() => setRecruitFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <p className="admin-empty">加载题库中…</p>}
        {!loading && visible.length === 0 && <p className="admin-empty">暂无匹配题目</p>}

        <ol className="interview-rank-list">
          {visible.map((item, index) => (
            <li key={item.id}>
              <div className="interview-rank">
                <strong>{index + 1}</strong>
                <small>HOT {Math.round(item.hotScore)}</small>
              </div>
              <div className="interview-body">
                <div className="interview-title-row">
                  <h3>{item.title}</h3>
                  <span
                    className={`recruit-tag ${(item.recruitType ?? "校招") === "校招" ? "campus" : "social"}`}
                  >
                    {item.recruitType ?? "校招"}
                  </span>
                  {item.featured && <span className="featured-pill">精选</span>}
                  <span className="source-pill" title="贡献者">
                    {item.authorName || "匿名贡献者"}
                  </span>
                </div>
                <p>{item.prompt}</p>
                {item.answerHint && (
                  <p className="interview-hint">
                    <b>参考要点</b>
                    {item.answerHint}
                  </p>
                )}
                <div className="interview-meta">
                  <div className="history-tags">
                    {(item.companies ?? []).map((company) => (
                      <span className="company-tag" key={`company-${company}`}>
                        {company}
                      </span>
                    ))}
                    {(item.tags ?? []).map((tag) => (
                      <span key={`tag-${tag}`}>{tag}</span>
                    ))}
                  </div>
                  <small>
                    有用 {item.usefulVotes ?? item.votes ?? 0} · 没用 {item.uselessVotes ?? 0}
                    {item.adminBoost > 0 ? ` · 加权 ${item.adminBoost}` : ""}
                  </small>
                </div>
                <div className="interview-actions">
                  <button
                    className="vote-useful"
                    disabled={busy}
                    onClick={() => void vote(item.id, "useful")}
                    type="button"
                  >
                    <span className="vote-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                        <path
                          d="M7 11v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm3 10h6.2a2 2 0 0 0 1.94-1.5l1.7-6.5A1.5 1.5 0 0 0 18.4 11H14V6.5A2.5 2.5 0 0 0 11.5 4h-.2a.8.8 0 0 0-.78.6L9.3 11H10v10Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    有用 {item.usefulVotes ?? item.votes ?? 0}
                  </button>
                  <button
                    className="vote-useless"
                    disabled={busy}
                    onClick={() => void vote(item.id, "useless")}
                    type="button"
                  >
                    <span className="vote-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                        <path
                          d="M17 13V3h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3Zm-3-10H7.8A2 2 0 0 0 5.86 4.5l-1.7 6.5A1.5 1.5 0 0 0 5.6 13H10v4.5A2.5 2.5 0 0 0 12.5 20h.2a.8.8 0 0 0 .78-.6L14.7 13H14V3Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    没用 {item.uselessVotes ?? 0}
                  </button>
                  {user && (user.role === "admin" || user.id === item.authorId) && (
                    <button
                      className="danger-text"
                      disabled={busy}
                      onClick={() => void remove(item.id)}
                      type="button"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-block interview-upload">
        <div className="block-heading">
          <p className="section-label">CONTRIBUTE</p>
          <h2>上传面试题</h2>
          <p className="block-subcopy">
            {user
              ? `当前账号：${user.username}${user.role === "admin" ? "（管理员投稿将自动加权）" : ""}`
              : "登录后即可投稿，题目会汇总到所有学员可见的热点榜。"}
          </p>
        </div>
        <form className="interview-form" onSubmit={(event) => void submitQuestion(event)}>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="题目标题，例如：解释 RAG 拒答策略"
            required
            value={title}
          />
          <textarea
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="完整题目描述 / 面试官常问法…"
            required
            rows={5}
            value={prompt}
          />
          <textarea
            onChange={(event) => setAnswerHint(event.target.value)}
            placeholder="参考要点（可选，不会替代你自己的答案）"
            rows={3}
            value={answerHint}
          />
          <input
            onChange={(event) => setCompanies(event.target.value)}
            placeholder="公司（必填，多家用逗号分隔，例如：字节跳动, 阿里巴巴, 腾讯）"
            required
            value={companies}
          />
          <div className="recruit-type-picker" role="radiogroup" aria-label="招聘类型">
            <span>招聘类型</span>
            <label>
              <input
                checked={recruitType === "校招"}
                name="recruitType"
                onChange={() => setRecruitType("校招")}
                type="radio"
                value="校招"
              />
              校招
            </label>
            <label>
              <input
                checked={recruitType === "社招"}
                name="recruitType"
                onChange={() => setRecruitType("社招")}
                type="radio"
                value="社招"
              />
              社招
            </label>
          </div>
          <input
            onChange={(event) => setTags(event.target.value)}
            placeholder="标签，逗号分隔，例如：RAG, 安全, 高级"
            value={tags}
          />
          <div className="note-actions">
            <button disabled={busy} type="submit">
              {busy ? "提交中…" : user ? "提交到题库" : "登录后提交"}
            </button>
          </div>
        </form>
      </section>
    </section>
  );
}
