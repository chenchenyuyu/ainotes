"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

export type CommunityReplyView = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type CommunityPostView = {
  id: string;
  title: string;
  body: string;
  category: "提问" | "经验" | "讨论";
  tags: string[];
  authorId: string;
  authorName: string;
  replyCount: number;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
  replies: CommunityReplyView[];
};

type AuthUser = { id: string; username: string; role: "admin" | "user"; createdAt: string };

type Props = {
  user: AuthUser | null;
  onRequireLogin: () => void;
};

const CATEGORIES = ["全部", "提问", "经验", "讨论"] as const;

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommunityTab({ user, onRequireLogin }: Props) {
  const [posts, setPosts] = useState<CommunityPostView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof CATEGORIES)[number]>("全部");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<"提问" | "经验" | "讨论">("提问");
  const [tags, setTags] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/community/posts");
      const data = (await response.json()) as { posts?: CommunityPostView[] };
      setPosts(data.posts ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const visible = useMemo(() => {
    const keyword = filter.trim().toLocaleLowerCase();
    return posts.filter((item) => {
      if (categoryFilter !== "全部" && item.category !== categoryFilter) return false;
      if (!keyword) return true;
      return (
        item.title.toLocaleLowerCase().includes(keyword) ||
        item.body.toLocaleLowerCase().includes(keyword) ||
        item.authorName.toLocaleLowerCase().includes(keyword) ||
        (item.tags ?? []).some((tag) => tag.toLocaleLowerCase().includes(keyword))
      );
    });
  }, [categoryFilter, filter, posts]);

  function splitTags(value: string): string[] {
    return value
      .split(/[,，、;/；]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  async function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      onRequireLogin();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          category,
          tags: splitTags(tags),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "发布失败");
      setTitle("");
      setBody("");
      setCategory("提问");
      setTags("");
      await loadPosts();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "发布失败");
    } finally {
      setBusy(false);
    }
  }

  async function submitReply(postId: string) {
    if (!user) {
      onRequireLogin();
      return;
    }
    const draft = (replyDrafts[postId] ?? "").trim();
    if (!draft) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = (await response.json()) as { error?: string; post?: CommunityPostView };
      if (!response.ok) throw new Error(data.error ?? "回复失败");
      setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
      if (data.post) {
        setPosts((prev) => prev.map((item) => (item.id === postId ? data.post! : item)));
      } else {
        await loadPosts();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "回复失败");
    } finally {
      setBusy(false);
    }
  }

  async function markHelpful(postId: string) {
    if (!user) {
      onRequireLogin();
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}/helpful`, { method: "POST" });
      const data = (await response.json()) as { error?: string; post?: CommunityPostView };
      if (!response.ok) throw new Error(data.error ?? "标记失败");
      if (data.post) {
        setPosts((prev) => prev.map((item) => (item.id === postId ? data.post! : item)));
      } else {
        await loadPosts();
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "标记失败");
    } finally {
      setBusy(false);
    }
  }

  async function removePost(postId: string) {
    if (!user) return;
    if (!window.confirm("确认删除这条帖子？")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/community/posts/${postId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "删除失败");
      if (expandedId === postId) setExpandedId(null);
      await loadPosts();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tab-page">
      <header className="tab-hero">
        <p className="eyebrow">LEARNER COMMUNITY</p>
        <h1>讨论与问答</h1>
        <p className="hero-copy">
          学员社区：提问解惑、分享踩坑经验、一起讨论 Agent 工程落地。登录后可发帖、回复，并为有帮助的内容点赞。
        </p>
      </header>

      <section className="content-block">
        <div className="community-list-head">
          <div className="block-heading">
            <p className="section-label">THREAD BOARD</p>
            <h2>社区动态</h2>
            <p className="block-subcopy">按「有帮助 × 3 + 回复数 × 2」排序，新回复会刷新帖子活跃时间。</p>
          </div>
          <div className="community-list-controls">
            <input
              className="interview-filter"
              onChange={(event) => setFilter(event.target.value)}
              placeholder="搜索标题 / 内容 / 标签 / 作者"
              value={filter}
            />
            <div className="recruit-filter">
              {CATEGORIES.map((option) => (
                <button
                  className={categoryFilter === option ? "active" : ""}
                  key={option}
                  onClick={() => setCategoryFilter(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <p className="admin-empty">加载社区中…</p>}
        {!loading && visible.length === 0 && <p className="admin-empty">暂无匹配帖子，来发第一条吧</p>}

        <div className="community-feed">
          {visible.map((post) => {
            const expanded = expandedId === post.id;
            const canDelete = Boolean(user && (user.role === "admin" || user.id === post.authorId));
            return (
              <article className="community-card" key={post.id}>
                <div className="community-card-top">
                  <span className={`community-category cat-${post.category}`}>{post.category}</span>
                  <small>
                    {post.authorName} · {formatTime(post.updatedAt)}
                  </small>
                </div>
                <h3>{post.title}</h3>
                <p className={expanded ? "" : "community-body-clamp"}>{post.body}</p>
                <div className="community-meta">
                  <div className="history-tags">
                    {(post.tags ?? []).map((tag) => (
                      <span key={`${post.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                  <small>
                    有帮助 {post.helpfulVotes} · 回复 {post.replyCount}
                  </small>
                </div>
                <div className="community-actions">
                  <button disabled={busy} onClick={() => void markHelpful(post.id)} type="button">
                    有帮助
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setExpandedId(expanded ? null : post.id)}
                    type="button"
                  >
                    {expanded ? "收起讨论" : `查看讨论 (${post.replyCount})`}
                  </button>
                  {canDelete && (
                    <button
                      className="danger-text"
                      disabled={busy}
                      onClick={() => void removePost(post.id)}
                      type="button"
                    >
                      删除
                    </button>
                  )}
                </div>

                {expanded && (
                  <div className="community-thread">
                    {(post.replies ?? []).length === 0 && (
                      <p className="admin-empty">还没有回复，来分享你的思路吧。</p>
                    )}
                    {(post.replies ?? []).map((reply) => (
                      <div className="community-reply" key={reply.id}>
                        <div className="community-reply-head">
                          <strong>{reply.authorName}</strong>
                          <small>{formatTime(reply.createdAt)}</small>
                        </div>
                        <p>{reply.body}</p>
                      </div>
                    ))}
                    <div className="community-reply-form">
                      <textarea
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))
                        }
                        placeholder={user ? "写下你的回答或补充经验…" : "登录后即可回复"}
                        rows={3}
                        value={replyDrafts[post.id] ?? ""}
                      />
                      <button
                        disabled={busy || !(replyDrafts[post.id] ?? "").trim()}
                        onClick={() => {
                          if (!user) {
                            onRequireLogin();
                            return;
                          }
                          void submitReply(post.id);
                        }}
                        type="button"
                      >
                        {user ? "发布回复" : "登录后回复"}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-block">
        <div className="block-heading">
          <p className="section-label">NEW THREAD</p>
          <h2>发起提问 / 分享经验</h2>
          <p className="block-subcopy">
            {user
              ? `当前身份：${user.username}。请选择类型后发布，方便同学筛选。`
              : "登录后可发帖；也可先浏览社区内容。"}
          </p>
        </div>
        <form className="community-form" onSubmit={(event) => void submitPost(event)}>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="标题，例如：RAG 空召回时该拒答还是降级？"
            required
            value={title}
          />
          <textarea
            onChange={(event) => setBody(event.target.value)}
            placeholder="把背景、已尝试方案和具体卡点写清楚，更容易得到有效回复。"
            required
            rows={5}
            value={body}
          />
          <div className="recruit-type-picker" role="radiogroup" aria-label="帖子类型">
            <span>类型</span>
            {(["提问", "经验", "讨论"] as const).map((option) => (
              <label key={option}>
                <input
                  checked={category === option}
                  name="communityCategory"
                  onChange={() => setCategory(option)}
                  type="radio"
                  value={option}
                />
                {option}
              </label>
            ))}
          </div>
          <input
            onChange={(event) => setTags(event.target.value)}
            placeholder="标签，逗号分隔，例如：RAG, Harness, 面试"
            value={tags}
          />
          <button disabled={busy} type="submit">
            {!user ? "登录后发布" : busy ? "发布中…" : "发布到社区"}
          </button>
        </form>
      </section>
    </section>
  );
}
