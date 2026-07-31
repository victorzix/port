import { eq } from "drizzle-orm";

import { db } from "@/db";
import { changelogEntries, projects } from "@/db/schema";
import type { CreateChangelogEntryInput } from "@/lib/validations/changelog";

export class ProjectNotFoundError extends Error {
  constructor(slug: string) {
    super(`Project with slug "${slug}" not found`);
    this.name = "ProjectNotFoundError";
  }
}

export async function createChangelogEntry(input: CreateChangelogEntryInput) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, input.projectSlug),
  });

  if (!project) {
    throw new ProjectNotFoundError(input.projectSlug);
  }

  const [entry] = await db
    .insert(changelogEntries)
    .values({
      projectId: project.id,
      title: input.title,
      body: input.body,
      ...(input.publishedAt ? { publishedAt: new Date(input.publishedAt) } : {}),
    })
    .returning();

  return entry;
}
