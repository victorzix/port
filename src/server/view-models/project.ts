import type { ChangeType, ProjectStatus } from "@/lib/project-enums";
import type { Resolved } from "@/lib/localized";

export interface ProjectListItem {
  slug: string;
  name: string;
  description: Resolved;
  stack: string[];
  status: ProjectStatus;
  year: number;
  latestVersion: string | null;
  releaseCount: number;
}

export interface ReleaseChangeView {
  id: string;
  type: ChangeType;
  text: Resolved;
}

export interface ReleaseView {
  id: string;
  version: string;
  releasedAt: Date;
  title: Resolved | null;
  notes: Resolved | null;
  changes: ReleaseChangeView[];
}

export interface ProjectDetailView {
  slug: string;
  name: string;
  description: Resolved;
  summary: Resolved | null;
  stack: string[];
  status: ProjectStatus;
  year: number;
  imageUrl: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  releases: ReleaseView[];
}
