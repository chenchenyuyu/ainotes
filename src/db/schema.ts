import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const userProgress = pgTable("user_progress", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  scores: jsonb("scores").$type<Record<string, number>>().notNull().default({}),
  completedTasks: jsonb("completed_tasks")
    .$type<Record<string, string[]>>()
    .notNull()
    .default({}),
  answers: jsonb("answers")
    .$type<Record<string, Record<string, string>>>()
    .notNull()
    .default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const userDocuments = pgTable("user_documents", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  charCount: integer("char_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const siteStats = pgTable("site_stats", {
  id: integer("id").primaryKey().default(1),
  visitCount: integer("visit_count").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  answerHint: text("answer_hint").notNull().default(""),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  companies: jsonb("companies").$type<string[]>().notNull().default([]),
  recruitType: text("recruit_type").notNull().default("校招"),
  usefulVotes: integer("useful_votes").notNull().default(0),
  uselessVotes: integer("useless_votes").notNull().default(0),
  adminBoost: integer("admin_boost").notNull().default(0),
  source: text("source").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const interviewVotes = pgTable(
  "interview_votes",
  {
    questionId: text("question_id")
      .notNull()
      .references(() => interviewQuestions.id, { onDelete: "cascade" }),
    voterKey: text("voter_key").notNull(),
    value: text("value").notNull(),
  },
  (table) => [primaryKey({ columns: [table.questionId, table.voterKey] })],
);

export const communityPosts = pgTable("community_posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  helpfulVotes: integer("helpful_votes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const communityReplies = pgTable("community_replies", {
  id: text("id").primaryKey(),
  postId: text("post_id")
    .notNull()
    .references(() => communityPosts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const communityHelpful = pgTable(
  "community_helpful",
  {
    postId: text("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    voterKey: text("voter_key").notNull(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.voterKey] })],
);
