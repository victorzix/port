import { z } from "zod";

export const createChangelogEntrySchema = z.object({
  projectSlug: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  publishedAt: z.iso.datetime().optional(),
});

export type CreateChangelogEntryInput = z.infer<
  typeof createChangelogEntrySchema
>;
