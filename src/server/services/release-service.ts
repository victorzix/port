import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { projects, releaseChanges, releases } from "@/db/schema";
import { toVersionKey } from "@/lib/version-key";
import type { UpsertReleaseInput } from "@/lib/validations/release";

export class ProjectNotFoundError extends Error {
  constructor(slug: string) {
    super(`Project with slug "${slug}" not found`);
    this.name = "ProjectNotFoundError";
  }
}

/**
 * Upserts one release and REPLACES its changes, so re-sending a corrected
 * payload converges instead of accumulating rows. Creates the project first
 * when `input.project` is present and the slug does not exist yet.
 */
export async function upsertRelease(
  slug: string,
  version: string,
  input: UpsertReleaseInput,
): Promise<{ created: boolean }> {
  const versionKey = toVersionKey(version);

  return db.transaction(async (tx) => {
    let project = await tx.query.projects.findFirst({
      where: eq(projects.slug, slug),
      columns: { id: true },
    });

    if (!project) {
      if (!input.project) throw new ProjectNotFoundError(slug);

      const [inserted] = await tx
        .insert(projects)
        .values({
          slug,
          name: input.project.name,
          description: input.project.description,
          summary: input.project.summary ?? null,
          stack: input.project.stack,
          status: input.project.status,
          year: input.project.year,
          sortOrder: input.project.sortOrder,
          imageUrl: input.project.imageUrl ?? null,
          bannerImage: input.project.bannerImage ?? null,
          gallery: input.project.gallery,
          repoUrl: input.project.repoUrl ?? null,
          liveUrl: input.project.liveUrl ?? null,
        })
        .returning({ id: projects.id });
      project = inserted;
    }

    const values = {
      projectId: project.id,
      version,
      versionKey,
      releasedAt: input.releasedAt ? new Date(input.releasedAt) : new Date(),
      title: input.title ?? null,
      notes: input.notes ?? null,
    };

    const existing = await tx.query.releases.findFirst({
      where: and(eq(releases.projectId, project.id), eq(releases.version, version)),
      columns: { id: true },
    });

    let releaseId: string;
    let created: boolean;

    if (existing) {
      await tx
        .update(releases)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(releases.id, existing.id));
      await tx.delete(releaseChanges).where(eq(releaseChanges.releaseId, existing.id));
      releaseId = existing.id;
      created = false;
    } else {
      const [inserted] = await tx
        .insert(releases)
        .values(values)
        .returning({ id: releases.id });
      releaseId = inserted.id;
      created = true;
    }

    if (input.changes.length > 0) {
      await tx.insert(releaseChanges).values(
        input.changes.map((change, position) => ({
          releaseId,
          type: change.type,
          text: change.text,
          image: change.image ?? null,
          position,
        })),
      );
    }

    return { created };
  });
}
