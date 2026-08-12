import type { ChangeType, ProjectStatus } from "@/lib/project-enums";

export interface ProjectListItem {
  slug: string;
  name: string;
  description: string;
  stack: string[];
  status: ProjectStatus;
  year: number;
  latestVersion: string | null;
  releaseCount: number;
}

export interface ReleaseChangeView {
  id: string;
  type: ChangeType;
  text: string;
}

export interface ReleaseView {
  id: string;
  version: string;
  releasedAt: Date;
  title: string | null;
  notes: string | null;
  changes: ReleaseChangeView[];
}

export interface ProjectDetailView {
  slug: string;
  name: string;
  description: string;
  summary: string | null;
  stack: string[];
  status: ProjectStatus;
  year: number;
  imageUrl: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  releases: ReleaseView[];
}
