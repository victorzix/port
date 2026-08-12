import type { ProjectStatus } from "@/lib/project-enums";

const STATUS_RANK: Record<ProjectStatus, number> = {
  active: 0,
  wip: 1,
  archived: 2,
};

export interface OrderableProject {
  sortOrder: number;
  status: ProjectStatus;
  /** Release date of the newest release, or null when there are none. */
  latestReleasedAt: Date | null;
  name: string;
}

/**
 * Ledger order: manual sortOrder, then status, then most recently released,
 * then name. Sorting happens in memory because `latestReleasedAt` is derived
 * from the joined releases — the row count here is small enough that a SQL
 * window function would cost more in complexity than it saves.
 */
export function compareProjects(a: OrderableProject, b: OrderableProject): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rank !== 0) return rank;

  const aTime = a.latestReleasedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTime = b.latestReleasedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (aTime !== bTime) return bTime - aTime;

  return a.name.localeCompare(b.name);
}
