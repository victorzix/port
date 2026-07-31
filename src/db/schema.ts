import { relations, type InferSelectModel } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
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

export const changelogEntries = pgTable(
  "changelog_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("changelog_entries_project_id_idx").on(table.projectId)],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  changelogEntries: many(changelogEntries),
}));

export const changelogEntriesRelations = relations(
  changelogEntries,
  ({ one }) => ({
    project: one(projects, {
      fields: [changelogEntries.projectId],
      references: [projects.id],
    }),
  }),
);

export type Project = InferSelectModel<typeof projects>;
export type ChangelogEntry = InferSelectModel<typeof changelogEntries>;
