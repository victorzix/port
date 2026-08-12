import { relations, type InferSelectModel } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Localized } from "@/lib/localized";
import type { ChangeType, ProjectStatus } from "@/lib/project-enums";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    /** Proper noun — not localized. */
    name: text("name").notNull(),
    description: jsonb("description").$type<Localized>().notNull(),
    /** Long markdown, detail page only. */
    summary: jsonb("summary").$type<Localized>(),
    /** Labels matched against STACK_ICONS in src/lib/stack-icons.ts. */
    stack: text("stack").array().notNull().default([]),
    status: text("status").$type<ProjectStatus>().notNull(),
    year: integer("year").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    imageUrl: text("image_url"),
    repoUrl: text("repo_url"),
    liveUrl: text("live_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("projects_slug_unique_idx").on(table.slug)],
);

export const releases = pgTable(
  "releases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    /** "1.4.0" — no leading "v". */
    version: text("version").notNull(),
    /** Zero-padded form for correct ordering; derived server-side. */
    versionKey: text("version_key").notNull(),
    releasedAt: timestamp("released_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    title: jsonb("title").$type<Localized>(),
    notes: jsonb("notes").$type<Localized>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("releases_project_version_unique_idx").on(
      table.projectId,
      table.version,
    ),
    index("releases_project_id_idx").on(table.projectId),
  ],
);

export const releaseChanges = pgTable(
  "release_changes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    releaseId: uuid("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    type: text("type").$type<ChangeType>().notNull(),
    text: jsonb("text").$type<Localized>().notNull(),
    /** Order within the release, assigned from payload array order. */
    position: integer("position").notNull(),
  },
  (table) => [index("release_changes_release_id_idx").on(table.releaseId)],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  releases: many(releases),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  project: one(projects, {
    fields: [releases.projectId],
    references: [projects.id],
  }),
  changes: many(releaseChanges),
}));

export const releaseChangesRelations = relations(releaseChanges, ({ one }) => ({
  release: one(releases, {
    fields: [releaseChanges.releaseId],
    references: [releases.id],
  }),
}));

export type Project = InferSelectModel<typeof projects>;
export type Release = InferSelectModel<typeof releases>;
export type ReleaseChange = InferSelectModel<typeof releaseChanges>;
