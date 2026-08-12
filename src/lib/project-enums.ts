export const PROJECT_STATUSES = ["active", "wip", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Keep a Changelog change categories. */
export const CHANGE_TYPES = [
  "added",
  "changed",
  "fixed",
  "removed",
  "deprecated",
  "security",
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
