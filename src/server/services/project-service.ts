import { eq } from "drizzle-orm";

import { db } from "@/db";
import { projects } from "@/db/schema";
import type { Locale } from "@/i18n/locales";
import { pick } from "@/lib/localized";
import { compareProjects } from "@/lib/project-ordering";
import type { UpsertProjectInput } from "@/lib/validations/project";
import type {
  ProjectDetailView,
  ProjectListItem,
} from "@/server/view-models/project";

export async function getProjectsForLocale(
  locale: Locale,
): Promise<ProjectListItem[]> {
  const rows = await db.query.projects.findMany({
    with: {
      releases: {
        orderBy: (releases, { desc: descending }) => descending(releases.versionKey),
        columns: { version: true, releasedAt: true },
      },
    },
  });

  return rows
    .map((row) => ({
      ...row,
      latestReleasedAt: row.releases[0]?.releasedAt ?? null,
    }))
    .sort(compareProjects)
    .map((row) => ({
      slug: row.slug,
      name: row.name,
      description: pick(row.description, locale),
      stack: row.stack,
      status: row.status,
      year: row.year,
      latestVersion: row.releases[0]?.version ?? null,
      releaseCount: row.releases.length,
    }));
}

export async function getProjectBySlugForLocale(
  slug: string,
  locale: Locale,
): Promise<ProjectDetailView | undefined> {
  const row = await db.query.projects.findFirst({
    where: eq(projects.slug, slug),
    with: {
      releases: {
        orderBy: (releases, { desc: descending }) => descending(releases.versionKey),
        with: {
          changes: {
            orderBy: (changes, { asc }) => asc(changes.position),
          },
        },
      },
    },
  });

  if (!row) return undefined;

  return {
    slug: row.slug,
    name: row.name,
    description: pick(row.description, locale),
    summary: row.summary ? pick(row.summary, locale) : null,
    stack: row.stack,
    status: row.status,
    year: row.year,
    imageUrl: row.imageUrl,
    repoUrl: row.repoUrl,
    liveUrl: row.liveUrl,
    releases: row.releases.map((release) => ({
      id: release.id,
      version: release.version,
      releasedAt: release.releasedAt,
      title: release.title ? pick(release.title, locale) : null,
      notes: release.notes ? pick(release.notes, locale) : null,
      changes: release.changes.map((change) => ({
        id: change.id,
        type: change.type,
        text: pick(change.text, locale),
      })),
    })),
  };
}

/**
 * Full replacement upsert. Optional fields absent from `input` are written
 * as null so a corrected re-send can clear a stale value.
 */
export async function upsertProject(
  slug: string,
  input: UpsertProjectInput,
): Promise<{ created: boolean }> {
  const values = {
    slug,
    name: input.name,
    description: input.description,
    summary: input.summary ?? null,
    stack: input.stack,
    status: input.status,
    year: input.year,
    sortOrder: input.sortOrder,
    imageUrl: input.imageUrl ?? null,
    repoUrl: input.repoUrl ?? null,
    liveUrl: input.liveUrl ?? null,
  };

  return db.transaction(async (tx) => {
    const existing = await tx.query.projects.findFirst({
      where: eq(projects.slug, slug),
      columns: { id: true },
    });

    if (existing) {
      await tx
        .update(projects)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(projects.slug, slug));
      return { created: false };
    }

    await tx.insert(projects).values(values);
    return { created: true };
  });
}
