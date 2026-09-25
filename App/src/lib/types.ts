export const PROJECT_STATUSES = ['active', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  github_url: string | null;
  live_demo_url: string | null;
  thumbnail_url: string | null;
  status: ProjectStatus;
  ai_score: number | null;
  created_at: string;
  updated_at: string;
};
