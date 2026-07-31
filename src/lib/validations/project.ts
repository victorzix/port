import { z } from "zod";

export const createProjectSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string().min(1),
  repoUrl: z.url().optional(),
  liveUrl: z.url().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
