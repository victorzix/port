import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import type { CreateProjectInput } from "@/lib/validations/project";

export function getProjects() {
  return db.query.projects.findMany({
    orderBy: asc(projects.name),
  });
}

export function getProjectBySlug(slug: string) {
  return db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      changelogEntries: {
        orderBy: (entries, { desc }) => desc(entries.publishedAt),
      },
    },
  });
}

export async function createProject(input: CreateProjectInput) {
  const [project] = await db.insert(projects).values(input).returning();
  return project;
}
