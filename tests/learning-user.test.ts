import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createSessionToken, parseSessionToken } from "../src/auth/session.js";
import { hashPassword, verifyPassword } from "../src/auth/password.js";
import { emptyProgress } from "../src/learning/progress.js";
import { buildLearningReport } from "../src/learning/report.js";
import type { UserDocument } from "../src/learning/documents.js";
import { resetAllTables } from "../src/db/test-utils.js";

const hasDatabase = Boolean(process.env.DATABASE_URL?.trim());

describe("auth primitives", () => {
  it("hashes and verifies passwords", () => {
    const stored = hashPassword("secret-pass");
    expect(verifyPassword("secret-pass", stored)).toBe(true);
    expect(verifyPassword("wrong-pass", stored)).toBe(false);
  });

  it("creates and parses signed session tokens", () => {
    const token = createSessionToken("user-1", "alice");
    const session = parseSessionToken(token);
    expect(session?.userId).toBe("user-1");
    expect(session?.username).toBe("alice");
    expect(parseSessionToken("tampered.token")).toBeNull();
  });
});

describe("learning report", () => {
  it("builds a final report from progress and documents", () => {
    const progress = emptyProgress();
    progress.scores = { 1: 88, 2: 70 };
    progress.completedTasks = {
      1: ["s1-note", "s1-case", "s1-boundary"],
      2: ["s2-loop"],
    };

    const documents: UserDocument[] = [
      {
        id: "doc-1",
        title: "Agent 笔记",
        filename: "agent.md",
        content:
          "Chatbot 与 Workflow 不同。Agent 会自主决策并选择工具，Observe Think Act 循环很关键。例如项目中用工具调用完成计算。RAG 检索需要 citation 与拒答。MCP 提供工具协议。",
        charCount: 120,
        createdAt: new Date().toISOString(),
      },
    ];

    const report = buildLearningReport(progress, documents);
    expect(report.completedStages).toBeGreaterThanOrEqual(1);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.suggestions.length).toBeGreaterThan(0);
    expect(report.documentCoverage).toHaveLength(1);
    expect(report.nextFocus).toMatch(/^S\d/);
  });

  it("flags missing documents as a learning gap", () => {
    const report = buildLearningReport(emptyProgress(), []);
    expect(report.documentCount).toBe(0);
    expect(report.gaps.join("")).toContain("文档");
    expect(report.level).toBe("需要系统复习");
  });
});

describe.runIf(hasDatabase)("admin user store", () => {
  beforeEach(async () => {
    await resetAllTables();
  });

  afterEach(async () => {
    await resetAllTables();
  });

  it("ensures a default admin and supports user management", async () => {
    const {
      ensureAdminUser,
      registerUser,
      deleteUser,
      resetUserPassword,
      authenticateUser,
      listUsers,
    } = await import("../src/auth/store.js");

    const admin = await ensureAdminUser();
    expect(admin.role).toBe("admin");
    expect(admin.username).toBe("admin");

    const learner = await registerUser("learner1", "pass1234");
    expect(learner.ok).toBe(true);
    if (!learner.ok) return;

    const users = await listUsers();
    expect(users.some((user) => user.username === "learner1")).toBe(true);

    const reset = await resetUserPassword(learner.user.id, "newpass99");
    expect(reset.ok).toBe(true);
    const login = await authenticateUser("learner1", "newpass99");
    expect(login.ok).toBe(true);

    const removed = await deleteUser(learner.user.id);
    expect(removed.ok).toBe(true);

    const blocked = await deleteUser(admin.id);
    expect(blocked.ok).toBe(false);
  });
});

describe.runIf(hasDatabase)("interview question store", () => {
  beforeEach(async () => {
    await resetAllTables();
  });

  afterEach(async () => {
    await resetAllTables();
  });

  it("seeds questions and ranks by hot score", async () => {
    const {
      listInterviewQuestions,
      createInterviewQuestion,
      voteInterviewQuestion,
    } = await import("../src/interview/store.js");

    const seeded = await listInterviewQuestions();
    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded[0].hotScore).toBeGreaterThanOrEqual(seeded[seeded.length - 1].hotScore);

    const created = await createInterviewQuestion({
      title: "如何设计 Agent 预算护栏",
      prompt: "请说明 token、步骤和费用预算如何共同约束 Agent 循环。",
      answerHint: "总预算、单工具超时、最大步数",
      tags: ["Harness"],
      companies: ["字节跳动", "阿里巴巴"],
      recruitType: "社招",
      authorId: "u1",
      authorName: "learner",
      source: "user",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.question.companies).toEqual(["字节跳动", "阿里巴巴"]);
    expect(created.question.recruitType).toBe("社招");
    expect(seeded.every((item) => item.recruitType === "校招" || item.recruitType === "社招")).toBe(
      true,
    );

    const voted = await voteInterviewQuestion(created.question.id, "u2", "useful");
    expect(voted.ok).toBe(true);
    if (voted.ok) {
      expect(voted.question.usefulVotes).toBe(1);
      expect(voted.question.uselessVotes).toBe(0);
    }

    const same = await voteInterviewQuestion(created.question.id, "u2", "useful");
    expect(same.ok).toBe(false);

    const switched = await voteInterviewQuestion(created.question.id, "u2", "useless");
    expect(switched.ok).toBe(true);
    if (switched.ok) {
      expect(switched.question.usefulVotes).toBe(0);
      expect(switched.question.uselessVotes).toBe(1);
    }

    const ranked = await listInterviewQuestions();
    expect(ranked.some((item) => item.id === created.question.id)).toBe(true);
  });
});

describe.runIf(hasDatabase)("community store", () => {
  beforeEach(async () => {
    await resetAllTables();
  });

  afterEach(async () => {
    await resetAllTables();
  });

  it("seeds posts and supports ask / reply / helpful", async () => {
    const {
      listCommunityPosts,
      createCommunityPost,
      addCommunityReply,
      markCommunityPostHelpful,
    } = await import("../src/community/store.js");

    const seeded = await listCommunityPosts();
    expect(seeded.length).toBeGreaterThan(0);
    expect(seeded.every((item) => ["提问", "经验", "讨论"].includes(item.category))).toBe(true);

    const created = await createCommunityPost({
      title: "工具超时后如何回传 observation？",
      body: "想确认失败结果应该作为 observation 还是直接抛错中断循环。",
      category: "提问",
      tags: ["Harness"],
      authorId: "u1",
      authorName: "learner",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const replied = await addCommunityReply({
      postId: created.post.id,
      body: "建议结构化错误回传，并计入步数预算。",
      authorId: "u2",
      authorName: "helper",
    });
    expect(replied.ok).toBe(true);
    if (replied.ok) {
      expect(replied.post.replyCount).toBe(1);
      expect(replied.post.replies[0]?.authorName).toBe("helper");
    }

    const helpful = await markCommunityPostHelpful(created.post.id, "u2");
    expect(helpful.ok).toBe(true);
    if (helpful.ok) expect(helpful.post.helpfulVotes).toBe(1);

    const again = await markCommunityPostHelpful(created.post.id, "u2");
    expect(again.ok).toBe(false);
  });
});

describe.runIf(hasDatabase)("learning stats", () => {
  beforeEach(async () => {
    await resetAllTables();
  });

  afterEach(async () => {
    await resetAllTables();
  });

  it("counts learners and visits", async () => {
    const { ensureAdminUser, registerUser } = await import("../src/auth/store.js");
    const { getLearningStats, recordVisit } = await import("../src/learning/stats.js");
    const { writeProgress, emptyProgress } = await import("../src/learning/progress.js");

    await ensureAdminUser();
    const learner = await registerUser("stats_user", "pass1234");
    expect(learner.ok).toBe(true);
    if (!learner.ok) return;

    await writeProgress(learner.user.id, {
      ...emptyProgress(),
      scores: { 1: 80 },
    });
    await recordVisit();
    await recordVisit();

    const stats = await getLearningStats();
    expect(stats.learnerCount).toBeGreaterThanOrEqual(1);
    expect(stats.activeLearnerCount).toBeGreaterThanOrEqual(1);
    expect(stats.visitCount).toBe(2);
    expect(stats.totalAccounts).toBeGreaterThanOrEqual(2);
  });
});

describe.runIf(hasDatabase)("user document persistence", () => {
  beforeEach(async () => {
    await resetAllTables();
  });

  afterEach(async () => {
    await resetAllTables();
  });

  it("saves and lists user documents in Postgres", async () => {
    const { registerUser } = await import("../src/auth/store.js");
    const { saveDocument, listDocuments, readDocument } = await import(
      "../src/learning/documents.js"
    );

    const user = await registerUser("doc_user", "pass1234");
    expect(user.ok).toBe(true);
    if (!user.ok) return;

    const saved = await saveDocument(user.user.id, {
      title: "阶段一笔记",
      filename: "w1.md",
      content: "这是一段足够长的学习笔记，用来验证个人文档存储是否正常工作。",
    });
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    const listed = await listDocuments(user.user.id);
    expect(listed).toHaveLength(1);
    const full = await readDocument(user.user.id, saved.document.id);
    expect(full?.content).toContain("学习笔记");
  });
});
