import { z } from "zod";

import { localizedSchema } from "@/lib/localized";
import { DEVICE_FRAMES } from "@/lib/project-media";
import { PROJECT_STATUSES } from "@/lib/project-enums";

export const projectSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

/** A screenshot/video, optionally wrapped in a device mockup. */
export const projectImageSchema = z.object({
  url: z.url(),
  frame: z.enum(DEVICE_FRAMES).optional(),
  videoUrl: z.url().optional(),
  alt: localizedSchema.optional(),
  caption: localizedSchema.optional(),
  browserUrl: z.string().min(1).optional(),
});

/**
 * Full replacement, not a patch: an omitted optional field is written as
 * null (or its default) on update. That is what lets a corrected re-send
 * converge instead of leaving stale values behind.
 */
export const upsertProjectSchema = z.object({
  name: z.string().min(1),
  description: localizedSchema,
  summary: localizedSchema.optional(),
  stack: z.array(z.string().min(1)).default([]),
  status: z.enum(PROJECT_STATUSES),
  year: z.int(),
  sortOrder: z.int().default(0),
  imageUrl: z.url().optional(),
  repoUrl: z.url().optional(),
  liveUrl: z.url().optional(),
  bannerImage: projectImageSchema.optional(),
  gallery: z.array(projectImageSchema).default([]),
});

export type UpsertProjectInput = z.infer<typeof upsertProjectSchema>;
