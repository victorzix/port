import { z } from "zod";

import { localizedSchema } from "@/lib/localized";
import { CHANGE_TYPES } from "@/lib/project-enums";
import { isValidVersion } from "@/lib/version-key";
import { upsertProjectSchema } from "@/lib/validations/project";

/** The version comes from the URL path, so it is validated separately. */
export const versionParamSchema = z
  .string()
  .refine(isValidVersion, "version must be dot-separated integers with no leading \"v\"");

export const releaseChangeSchema = z.object({
  type: z.enum(CHANGE_TYPES),
  text: localizedSchema,
});

export const upsertReleaseSchema = z.object({
  releasedAt: z.iso.datetime().optional(),
  title: localizedSchema.optional(),
  notes: localizedSchema.optional(),
  /** Replaced wholesale on every write; order here becomes `position`. */
  changes: z.array(releaseChangeSchema).default([]),
  /** Used only when the project does not exist yet. */
  project: upsertProjectSchema.optional(),
});

export type UpsertReleaseInput = z.infer<typeof upsertReleaseSchema>;
