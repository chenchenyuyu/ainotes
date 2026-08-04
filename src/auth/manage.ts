import { listDocuments } from "../learning/documents.js";
import { readProgress, type UserProgress } from "../learning/progress.js";
import { listUsers, type PublicUser } from "./store.js";

export type ManagedUserSummary = PublicUser & {
  documentCount: number;
  stageScores: number;
  completedStages: number;
  averageScore: number;
  updatedAt: string | null;
};

function summarizeProgress(progress: UserProgress): {
  stageScores: number;
  completedStages: number;
  averageScore: number;
  updatedAt: string | null;
} {
  const scores = Object.values(progress.scores);
  const averageScore = scores.length
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : 0;
  const completedStages = Object.entries(progress.scores).filter(([week, score]) => {
    const tasks = progress.completedTasks[Number(week)] ?? [];
    return score >= 75 && tasks.length > 0;
  }).length;

  return {
    stageScores: scores.length,
    completedStages,
    averageScore,
    updatedAt: scores.length || Object.keys(progress.completedTasks).length ? progress.updatedAt : null,
  };
}

export async function listManagedUsers(): Promise<ManagedUserSummary[]> {
  const users = await listUsers();
  const rows: ManagedUserSummary[] = [];

  for (const user of users) {
    const [progress, documents] = await Promise.all([
      readProgress(user.id),
      listDocuments(user.id),
    ]);
    rows.push({
      ...user,
      documentCount: documents.length,
      ...summarizeProgress(progress),
    });
  }

  return rows.sort((a, b) => {
    if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
    return a.username.localeCompare(b.username, "zh-CN");
  });
}

export async function getManagedUserDetail(userId: string): Promise<{
  user: PublicUser;
  progress: UserProgress;
  documents: Array<{
    id: string;
    title: string;
    filename: string;
    charCount: number;
    createdAt: string;
  }>;
} | null> {
  const users = await listUsers();
  const user = users.find((item) => item.id === userId);
  if (!user) return null;

  const [progress, documents] = await Promise.all([
    readProgress(user.id),
    listDocuments(user.id),
  ]);

  return { user, progress, documents };
}
