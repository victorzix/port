# Projects & Releases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder projects/changelog skeleton with a release-based data model, an idempotent upload API, and two screens authored in the site's editorial grammar.

**Architecture:** Three tables (`projects`, `releases`, `release_changes`) hold content as per-locale JSONB with an `en` fallback. Two `PUT` routes upsert projects and releases idempotently, replacing child rows wholesale. Route handlers stay thin — token check, zod parse, delegate. Services resolve JSONB into plain-string view models so no component ever sees a `Localized` object. Screens reuse the `RoleItem` grammar: `border-t` rows, mono meta, `clamp()` type, Simple Icons glyphs.

**Tech Stack:** Next.js 16.2.12 (App Router), React 19.2.4, Drizzle ORM 0.45 + postgres-js, zod 4, next-intl 4.13, Tailwind 4, vitest (new).

**Spec:** `docs/superpowers/specs/2026-08-11-projects-releases-design.md`

## Global Constraints

- **This is not the Next.js in your training data.** Read the relevant guide under `node_modules/next/dist/docs/` before writing route or page code. Route handler `params` is a **Promise** — `{ params }: { params: Promise<{ slug: string }> }`, then `await params`.
- **Never add `Co-Authored-By: Claude`** or any Claude/Anthropic author trailer to commits in this repo.
- **i18n is mandatory.** No user-facing string is hardcoded in a component. Every key added to `messages/en.json` must be added to `messages/pt.json` and `messages/es.json` **in the same commit**.
- **Content fallback is `en`, not the site default.** `DEFAULT_LOCALE` in `src/i18n/locales.ts` is `"pt"`, but DB content falls back to `en` because `en` is the only required locale in the payload. This is deliberate, not a bug — do not "fix" it.
- **Mobile-first.** Base Tailwind classes target mobile; scale up with `sm:`/`md:`/`lg:`. Never the reverse. Check every component at mobile, tablet, and desktop widths.
- **One component per file, one hook per file.** Split the moment a file takes on more than one responsibility.
- **Route handlers stay thin:** auth check + zod validation only. All business logic lives in `src/server/services/*`.
- **Pages under `src/app/[locale]/projects/**` keep `export const dynamic = "force-dynamic"`.** The Coolify build stage has no network access to Postgres; static prerendering breaks the build.
- **Migrations are never run inside the Docker image or at container boot.** `npm run db:generate` locally, commit the SQL, then SSH tunnel + `npm run db:migrate`.
- **Dev server:** never use port 3000 — that is the user's own terminal. Use 3100+.
- Locale type: `type Locale = "pt" | "en" | "es"` from `@/i18n/locales`.
- Internal links use `Link` from `@/i18n/navigation`, never `next/link` — locale prefixes depend on it.

---

### Task 1: Test harness and foundation types

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/localized.ts`
- Create: `src/lib/localized.test.ts`
- Create: `src/lib/project-enums.ts`
- Modify: `package.json` (scripts + devDependency)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type Localized = { en: string; pt?: string; es?: string }`
  - `localizedSchema` — zod object, `en` required
  - `pick(value: Localized, locale: Locale): string`
  - `PROJECT_STATUSES: readonly ["active", "wip", "archived"]`, `type ProjectStatus`
  - `CHANGE_TYPES: readonly ["added","changed","fixed","removed","deprecated","security"]`, `type ChangeType`

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create the vitest config**

Tests are colocated next to the code they cover. The `@` alias must be declared here — vitest does not read `tsconfig.json` paths on its own.

```ts
// vitest.config.ts
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3: Add the test scripts**

In `package.json`, alongside the existing scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write the failing test for `pick`**

```ts
// src/lib/localized.test.ts
import { describe, expect, it } from "vitest";

import { localizedSchema, pick } from "@/lib/localized";

describe("pick", () => {
  it("returns the requested locale when present", () => {
    expect(pick({ en: "Dark mode", pt: "Modo escuro" }, "pt")).toBe("Modo escuro");
  });

  it("falls back to en when the locale is missing", () => {
    expect(pick({ en: "Dark mode", pt: "Modo escuro" }, "es")).toBe("Dark mode");
  });

  it("returns en when asked for en", () => {
    expect(pick({ en: "Dark mode" }, "en")).toBe("Dark mode");
  });
});

describe("localizedSchema", () => {
  it("accepts en alone", () => {
    expect(localizedSchema.safeParse({ en: "Dark mode" }).success).toBe(true);
  });

  it("rejects a missing en", () => {
    expect(localizedSchema.safeParse({ pt: "Modo escuro" }).success).toBe(false);
  });

  it("rejects an empty en", () => {
    expect(localizedSchema.safeParse({ en: "" }).success).toBe(false);
  });

  it("rejects an empty optional locale rather than storing blank text", () => {
    expect(localizedSchema.safeParse({ en: "Dark mode", pt: "" }).success).toBe(false);
  });
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `npm test -- src/lib/localized.test.ts`
Expected: FAIL — cannot resolve `@/lib/localized`.

- [ ] **Step 6: Implement `localized.ts`**

```ts
// src/lib/localized.ts
import { z } from "zod";

import type { Locale } from "@/i18n/locales";

/**
 * Per-locale content stored as JSONB. Only `en` is required — a missing
 * locale falls back to it, so content can be translated progressively
 * without blocking a publish.
 */
export type Localized = { en: string; pt?: string; es?: string };

export const localizedSchema = z.object({
  en: z.string().min(1),
  pt: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
});

/**
 * Resolves stored content for one locale. The fallback is `en`, not the
 * site's DEFAULT_LOCALE ("pt") — `en` is the only locale guaranteed present.
 */
export function pick(value: Localized, locale: Locale): string {
  return value[locale] ?? value.en;
}
```

- [ ] **Step 7: Run the tests and confirm they pass**

Run: `npm test -- src/lib/localized.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 8: Create the shared enums**

These are plain constants with no branching, so they get no unit test — the zod schemas built from them in Task 4 are what carry test coverage. They live in their own module so the schema, the validations, and the ordering comparator share one source of truth without importing Drizzle into test-only code.

```ts
// src/lib/project-enums.ts
export const PROJECT_STATUSES = ["active", "wip", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Keep a Changelog change categories. */
export const CHANGE_TYPES = [
  "added",
  "changed",
  "fixed",
  "removed",
  "deprecated",
  "security",
] as const;
export type ChangeType = (typeof CHANGE_TYPES)[number];
```

- [ ] **Step 9: Verify lint and types are clean**

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/localized.ts src/lib/localized.test.ts src/lib/project-enums.ts
git commit -m "Add vitest harness, localized content helper and shared enums"
```

---

### Task 2: Version key derivation

Ordering versions as text is wrong — `"1.10.0" < "1.9.0"`. Every numeric component is zero-padded to 5 digits at write time and stored in `releases.versionKey`, so a plain `ORDER BY versionKey DESC` is correct.

**Files:**
- Create: `src/lib/version-key.ts`
- Create: `src/lib/version-key.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `class InvalidVersionError extends Error`
  - `toVersionKey(version: string): string` — throws `InvalidVersionError`
  - `isValidVersion(version: string): boolean`
  - `versionAnchor(version: string): string` — `"1.4.0"` → `"v1-4-0"`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/version-key.test.ts
import { describe, expect, it } from "vitest";

import {
  InvalidVersionError,
  isValidVersion,
  toVersionKey,
  versionAnchor,
} from "@/lib/version-key";

describe("toVersionKey", () => {
  it("pads each component to five digits", () => {
    expect(toVersionKey("1.4.0")).toBe("00001.00004.00000");
  });

  it("sorts 1.10.0 above 1.9.0", () => {
    expect(toVersionKey("1.10.0") > toVersionKey("1.9.0")).toBe(true);
  });

  it("handles date-style versions", () => {
    expect(toVersionKey("2026.8.1")).toBe("02026.00008.00001");
  });

  it("accepts a two-component version", () => {
    expect(toVersionKey("1.4")).toBe("00001.00004");
  });

  it("rejects a leading v", () => {
    expect(() => toVersionKey("v1.4.0")).toThrow(InvalidVersionError);
  });

  it("rejects non-numeric components", () => {
    expect(() => toVersionKey("1.4.0-beta")).toThrow(InvalidVersionError);
  });

  it("rejects an empty string", () => {
    expect(() => toVersionKey("")).toThrow(InvalidVersionError);
  });

  it("rejects a component that would overflow the padding", () => {
    expect(() => toVersionKey("1.123456.0")).toThrow(InvalidVersionError);
  });
});

describe("isValidVersion", () => {
  it("is true for a semver triple", () => {
    expect(isValidVersion("1.4.0")).toBe(true);
  });

  it("is false for a leading v", () => {
    expect(isValidVersion("v1.4.0")).toBe(false);
  });
});

describe("versionAnchor", () => {
  it("builds a deep-link anchor", () => {
    expect(versionAnchor("1.4.0")).toBe("v1-4-0");
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/lib/version-key.test.ts`
Expected: FAIL — cannot resolve `@/lib/version-key`.

- [ ] **Step 3: Implement `version-key.ts`**

```ts
// src/lib/version-key.ts

/** Dot-separated integers, no leading "v", no pre-release suffix. */
const VERSION_PATTERN = /^\d+(?:\.\d+)*$/;
const COMPONENT_WIDTH = 5;

export class InvalidVersionError extends Error {
  constructor(version: string) {
    super(
      `Version "${version}" must be dot-separated integers of at most ${COMPONENT_WIDTH} digits, with no leading "v"`,
    );
    this.name = "InvalidVersionError";
  }
}

export function isValidVersion(version: string): boolean {
  if (!VERSION_PATTERN.test(version)) return false;
  return version.split(".").every((part) => part.length <= COMPONENT_WIDTH);
}

/**
 * Zero-pads each component so string ordering matches numeric ordering:
 * "1.10.0" → "00001.00010.00000" sorts above "1.9.0" → "00001.00009.00000".
 */
export function toVersionKey(version: string): string {
  if (!isValidVersion(version)) throw new InvalidVersionError(version);

  return version
    .split(".")
    .map((part) => part.padStart(COMPONENT_WIDTH, "0"))
    .join(".");
}

/** Deep-link anchor for one release: "1.4.0" → "v1-4-0". */
export function versionAnchor(version: string): string {
  return `v${version.replaceAll(".", "-")}`;
}
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npm test -- src/lib/version-key.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/version-key.ts src/lib/version-key.test.ts
git commit -m "Add semver-correct version key derivation"
```

---

### Task 3: Ledger ordering comparator

Extracted as a pure function so it is testable without a database. The service in Task 6 fetches rows and sorts with this.

**Files:**
- Create: `src/lib/project-ordering.ts`
- Create: `src/lib/project-ordering.test.ts`

**Interfaces:**
- Consumes: `ProjectStatus` from `@/lib/project-enums` (Task 1).
- Produces:
  - `interface OrderableProject { sortOrder: number; status: ProjectStatus; latestReleasedAt: Date | null; name: string }`
  - `compareProjects(a: OrderableProject, b: OrderableProject): number`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/project-ordering.test.ts
import { describe, expect, it } from "vitest";

import { compareProjects, type OrderableProject } from "@/lib/project-ordering";

function project(overrides: Partial<OrderableProject> = {}): OrderableProject {
  return {
    sortOrder: 0,
    status: "active",
    latestReleasedAt: new Date("2026-01-01T00:00:00Z"),
    name: "Project",
    ...overrides,
  };
}

describe("compareProjects", () => {
  it("puts a lower sortOrder first", () => {
    const a = project({ sortOrder: 10, name: "Zebra" });
    const b = project({ sortOrder: 20, name: "Alpha" });
    expect([b, a].sort(compareProjects)).toEqual([a, b]);
  });

  it("ranks active above wip above archived when sortOrder ties", () => {
    const active = project({ status: "active", name: "A" });
    const wip = project({ status: "wip", name: "B" });
    const archived = project({ status: "archived", name: "C" });
    expect([archived, wip, active].sort(compareProjects)).toEqual([
      active,
      wip,
      archived,
    ]);
  });

  it("puts the most recent release first when status ties", () => {
    const older = project({ latestReleasedAt: new Date("2025-01-01T00:00:00Z"), name: "A" });
    const newer = project({ latestReleasedAt: new Date("2026-06-01T00:00:00Z"), name: "B" });
    expect([older, newer].sort(compareProjects)).toEqual([newer, older]);
  });

  it("sinks a project with no releases below one that has them", () => {
    const released = project({ name: "A" });
    const unreleased = project({ latestReleasedAt: null, name: "B" });
    expect([unreleased, released].sort(compareProjects)).toEqual([
      released,
      unreleased,
    ]);
  });

  it("falls back to name when everything else ties", () => {
    const alpha = project({ name: "Alpha" });
    const zebra = project({ name: "Zebra" });
    expect([zebra, alpha].sort(compareProjects)).toEqual([alpha, zebra]);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/lib/project-ordering.test.ts`
Expected: FAIL — cannot resolve `@/lib/project-ordering`.

- [ ] **Step 3: Implement the comparator**

```ts
// src/lib/project-ordering.ts
import type { ProjectStatus } from "@/lib/project-enums";

const STATUS_RANK: Record<ProjectStatus, number> = {
  active: 0,
  wip: 1,
  archived: 2,
};

export interface OrderableProject {
  sortOrder: number;
  status: ProjectStatus;
  /** Release date of the newest release, or null when there are none. */
  latestReleasedAt: Date | null;
  name: string;
}

/**
 * Ledger order: manual sortOrder, then status, then most recently released,
 * then name. Sorting happens in memory because `latestReleasedAt` is derived
 * from the joined releases — the row count here is small enough that a SQL
 * window function would cost more in complexity than it saves.
 */
export function compareProjects(a: OrderableProject, b: OrderableProject): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

  const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (rank !== 0) return rank;

  const aTime = a.latestReleasedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const bTime = b.latestReleasedAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  if (aTime !== bTime) return bTime - aTime;

  return a.name.localeCompare(b.name);
}
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npm test -- src/lib/project-ordering.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/project-ordering.ts src/lib/project-ordering.test.ts
git commit -m "Add project ledger ordering comparator"
```

---

### Task 4: Database schema and migration

**Files:**
- Modify: `src/db/schema.ts` (full rewrite)
- Create: `src/db/migrations/*` (generated — do not hand-write)

**Interfaces:**
- Consumes: `Localized` (Task 1), `ProjectStatus` / `ChangeType` (Task 1).
- Produces: `projects`, `releases`, `releaseChanges` tables; `projectsRelations`, `releasesRelations`, `releaseChangesRelations`; types `Project`, `Release`, `ReleaseChange`.

- [ ] **Step 1: Rewrite the schema**

`changelogEntries` is deleted. `status` and `type` are `text` columns with a `$type<>()` union rather than Postgres enums — extending a PG enum needs its own migration, and validation already happens at the API boundary.

```ts
// src/db/schema.ts
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
```

- [ ] **Step 2: Generate the migration**

```bash
npm run db:generate
```

Expected: a new `src/db/migrations/0000_*.sql` plus `meta/`. **`src/db/migrations/` does not exist yet** — no migration has ever been generated in this repo, so this produces the *initial* migration containing all three tables, not an incremental diff.

- [ ] **Step 3: Read the generated SQL and confirm it matches the schema**

Run: `ls src/db/migrations && cat src/db/migrations/0000_*.sql`

Confirm: three `CREATE TABLE` statements, the unique index on `projects.slug`, the composite unique index on `(project_id, version)`, both foreign keys with `ON DELETE CASCADE`, and `stack` as `text[] DEFAULT '{}'`. There must be **no** `changelog_entries` table.

- [ ] **Step 4: Confirm types and lint are clean**

Run: `npm run lint && npx tsc --noEmit`
Expected: errors *only* in files still importing the deleted `changelogEntries` — specifically `src/server/services/changelog-service.ts`, `src/app/api/changelog/route.ts`, and the changelog components. Those are deleted in Tasks 6, 7 and 11. Note them and move on; do not fix them here.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrations
git commit -m "Replace changelog entries with releases and typed changes"
```

> **Do not run `db:migrate` yet.** The remote database is reconciled in Task 12, after the code that depends on the schema exists.

---

### Task 5: API validation schemas

**Files:**
- Create: `src/lib/validations/project.ts` (full rewrite of the existing file)
- Create: `src/lib/validations/project.test.ts`
- Create: `src/lib/validations/release.ts`
- Create: `src/lib/validations/release.test.ts`
- Delete: `src/lib/validations/changelog.ts`

**Interfaces:**
- Consumes: `localizedSchema` (Task 1), `PROJECT_STATUSES` / `CHANGE_TYPES` (Task 1), `isValidVersion` (Task 2).
- Produces:
  - `projectSlugSchema`, `upsertProjectSchema`, `type UpsertProjectInput`
  - `versionParamSchema`, `upsertReleaseSchema`, `type UpsertReleaseInput`

- [ ] **Step 1: Write the failing project validation tests**

```ts
// src/lib/validations/project.test.ts
import { describe, expect, it } from "vitest";

import { projectSlugSchema, upsertProjectSchema } from "@/lib/validations/project";

const valid = {
  name: "Portfolio",
  description: { en: "This site." },
  status: "active",
  year: 2026,
};

describe("upsertProjectSchema", () => {
  it("accepts a minimal body and defaults stack and sortOrder", () => {
    const parsed = upsertProjectSchema.parse(valid);
    expect(parsed.stack).toEqual([]);
    expect(parsed.sortOrder).toBe(0);
  });

  it("rejects an unknown status", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, status: "paused" }).success,
    ).toBe(false);
  });

  it("rejects a description without en", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, description: { pt: "Este site." } })
        .success,
    ).toBe(false);
  });

  it("rejects a non-integer year", () => {
    expect(upsertProjectSchema.safeParse({ ...valid, year: 2026.5 }).success).toBe(
      false,
    );
  });

  it("rejects a non-url liveUrl", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, liveUrl: "not-a-url" }).success,
    ).toBe(false);
  });

  it("strips unknown keys rather than storing them", () => {
    const parsed = upsertProjectSchema.parse({ ...valid, sneaky: "value" });
    expect("sneaky" in parsed).toBe(false);
  });
});

describe("projectSlugSchema", () => {
  it("accepts kebab-case", () => {
    expect(projectSlugSchema.safeParse("my-project").success).toBe(true);
  });

  it("rejects underscores and capitals", () => {
    expect(projectSlugSchema.safeParse("My_Project").success).toBe(false);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/lib/validations/project.test.ts`
Expected: FAIL — `projectSlugSchema` / `upsertProjectSchema` are not exported yet.

- [ ] **Step 3: Rewrite `validations/project.ts`**

```ts
// src/lib/validations/project.ts
import { z } from "zod";

import { localizedSchema } from "@/lib/localized";
import { PROJECT_STATUSES } from "@/lib/project-enums";

export const projectSlugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be kebab-case");

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
});

export type UpsertProjectInput = z.infer<typeof upsertProjectSchema>;
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npm test -- src/lib/validations/project.test.ts`
Expected: PASS, 8 tests.

If the "strips unknown keys" test fails, zod 4 objects strip by default — check you did not use `.passthrough()` or `.loose()`.

- [ ] **Step 5: Write the failing release validation tests**

```ts
// src/lib/validations/release.test.ts
import { describe, expect, it } from "vitest";

import { upsertReleaseSchema, versionParamSchema } from "@/lib/validations/release";

describe("upsertReleaseSchema", () => {
  it("accepts a release with typed changes", () => {
    const parsed = upsertReleaseSchema.parse({
      changes: [{ type: "added", text: { en: "Dark mode", pt: "Modo escuro" } }],
    });
    expect(parsed.changes).toHaveLength(1);
  });

  it("accepts an empty changes array when a title carries the content", () => {
    const parsed = upsertReleaseSchema.parse({
      title: { en: "Housekeeping" },
      changes: [],
    });
    expect(parsed.changes).toEqual([]);
  });

  it("defaults changes to an empty array when omitted", () => {
    expect(upsertReleaseSchema.parse({ notes: { en: "Notes." } }).changes).toEqual(
      [],
    );
  });

  it("rejects an unknown change type", () => {
    expect(
      upsertReleaseSchema.safeParse({
        changes: [{ type: "improved", text: { en: "Faster" } }],
      }).success,
    ).toBe(false);
  });

  it("rejects a change without en text", () => {
    expect(
      upsertReleaseSchema.safeParse({
        changes: [{ type: "added", text: { pt: "Modo escuro" } }],
      }).success,
    ).toBe(false);
  });

  it("rejects a non-ISO releasedAt", () => {
    expect(
      upsertReleaseSchema.safeParse({ releasedAt: "10/08/2026", changes: [] })
        .success,
    ).toBe(false);
  });

  it("accepts an inline project for first-release creation", () => {
    const parsed = upsertReleaseSchema.parse({
      changes: [],
      project: {
        name: "Portfolio",
        description: { en: "This site." },
        status: "active",
        year: 2026,
      },
    });
    expect(parsed.project?.name).toBe("Portfolio");
  });
});

describe("versionParamSchema", () => {
  it("accepts dot-separated integers", () => {
    expect(versionParamSchema.safeParse("1.4.0").success).toBe(true);
  });

  it("rejects a leading v", () => {
    expect(versionParamSchema.safeParse("v1.4.0").success).toBe(false);
  });

  it("rejects a pre-release suffix", () => {
    expect(versionParamSchema.safeParse("1.4.0-beta").success).toBe(false);
  });
});
```

- [ ] **Step 6: Run and confirm failure**

Run: `npm test -- src/lib/validations/release.test.ts`
Expected: FAIL — cannot resolve `@/lib/validations/release`.

- [ ] **Step 7: Implement `validations/release.ts`**

```ts
// src/lib/validations/release.ts
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
```

- [ ] **Step 8: Run and confirm they pass**

Run: `npm test -- src/lib/validations/release.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 9: Delete the obsolete changelog validation**

```bash
git rm src/lib/validations/changelog.ts
```

- [ ] **Step 10: Run the whole suite and lint**

Run: `npm test && npm run lint`
Expected: all tests pass (34 total across four files).

- [ ] **Step 11: Commit**

```bash
git add src/lib/validations
git commit -m "Add zod schemas for project and release upserts"
```

---

### Task 6: Services — read and upsert

**Files:**
- Create: `src/server/view-models/project.ts`
- Modify: `src/server/services/project-service.ts` (full rewrite)
- Create: `src/server/services/release-service.ts`
- Delete: `src/server/services/changelog-service.ts`

**Interfaces:**
- Consumes: schema tables (Task 4), `pick` (Task 1), `compareProjects` (Task 3), `toVersionKey` (Task 2), `UpsertProjectInput` / `UpsertReleaseInput` (Task 5).
- Produces:
  - `interface ProjectListItem`, `interface ProjectDetailView`, `interface ReleaseView`, `interface ReleaseChangeView`
  - `getProjectsForLocale(locale: Locale): Promise<ProjectListItem[]>`
  - `getProjectBySlugForLocale(slug: string, locale: Locale): Promise<ProjectDetailView | undefined>`
  - `upsertProject(slug: string, input: UpsertProjectInput): Promise<{ created: boolean }>`
  - `upsertRelease(slug: string, version: string, input: UpsertReleaseInput): Promise<{ created: boolean }>`
  - `class ProjectNotFoundError extends Error`

- [ ] **Step 1: Define the view models**

Plain strings only — no `Localized` reaches a component.

```ts
// src/server/view-models/project.ts
import type { ChangeType, ProjectStatus } from "@/lib/project-enums";

export interface ProjectListItem {
  slug: string;
  name: string;
  description: string;
  stack: string[];
  status: ProjectStatus;
  year: number;
  latestVersion: string | null;
  releaseCount: number;
}

export interface ReleaseChangeView {
  id: string;
  type: ChangeType;
  text: string;
}

export interface ReleaseView {
  id: string;
  version: string;
  releasedAt: Date;
  title: string | null;
  notes: string | null;
  changes: ReleaseChangeView[];
}

export interface ProjectDetailView {
  slug: string;
  name: string;
  description: string;
  summary: string | null;
  stack: string[];
  status: ProjectStatus;
  year: number;
  imageUrl: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  releases: ReleaseView[];
}
```

- [ ] **Step 2: Rewrite the project service**

```ts
// src/server/services/project-service.ts
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
```

The `orderBy` callbacks alias `desc` as `descending` because `desc` is not imported at module scope here — only `eq` is. Do not add a bare `desc` import; `npm run lint` flags it as unused.

- [ ] **Step 3: Implement the release service**

```ts
// src/server/services/release-service.ts
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
          position,
        })),
      );
    }

    return { created };
  });
}
```

- [ ] **Step 4: Delete the obsolete service**

```bash
git rm src/server/services/changelog-service.ts
```

- [ ] **Step 5: Confirm types compile**

Run: `npx tsc --noEmit`
Expected: remaining errors only in `src/app/api/changelog/route.ts`, `src/app/api/projects/route.ts`, and the projects/changelog components — all replaced in Tasks 7, 10 and 11.

- [ ] **Step 6: Commit**

```bash
git add src/server
git commit -m "Add locale-aware readers and idempotent upsert services"
```

---

### Task 7: API routes

**Files:**
- Create: `src/app/api/projects/[slug]/route.ts`
- Create: `src/app/api/projects/[slug]/releases/[version]/route.ts`
- Delete: `src/app/api/projects/route.ts`
- Delete: `src/app/api/changelog/route.ts`

**Interfaces:**
- Consumes: `verifyApiToken` (existing, unchanged), `upsertProjectSchema` / `projectSlugSchema` / `upsertReleaseSchema` / `versionParamSchema` (Task 5), `upsertProject` / `upsertRelease` / `ProjectNotFoundError` (Task 6).
- Produces: two `PUT` endpoints.

Both handlers stay thin: token → parse → delegate → map errors.

- [ ] **Step 1: Read the route handler docs for this Next version**

Run: `sed -n 70,125p node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`

Confirm: `params` is a `Promise` and must be awaited.

- [ ] **Step 2: Implement the project route**

```ts
// src/app/api/projects/[slug]/route.ts
import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { projectSlugSchema, upsertProjectSchema } from "@/lib/validations/project";
import { upsertProject } from "@/server/services/project-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const parsedSlug = projectSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: "Invalid slug", issues: parsedSlug.error.issues },
      { status: 400 },
    );
  }

  const parsed = upsertProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { created } = await upsertProject(parsedSlug.data, parsed.data);
  return NextResponse.json({ slug: parsedSlug.data }, { status: created ? 201 : 200 });
}
```

- [ ] **Step 3: Implement the release route**

```ts
// src/app/api/projects/[slug]/releases/[version]/route.ts
import { NextResponse } from "next/server";

import { verifyApiToken } from "@/lib/api-auth";
import { projectSlugSchema } from "@/lib/validations/project";
import { upsertReleaseSchema, versionParamSchema } from "@/lib/validations/release";
import {
  ProjectNotFoundError,
  upsertRelease,
} from "@/server/services/release-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; version: string }> },
) {
  if (!verifyApiToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, version } = await params;

  const parsedSlug = projectSlugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return NextResponse.json(
      { error: "Invalid slug", issues: parsedSlug.error.issues },
      { status: 400 },
    );
  }

  const parsedVersion = versionParamSchema.safeParse(version);
  if (!parsedVersion.success) {
    return NextResponse.json(
      { error: "Invalid version", issues: parsedVersion.error.issues },
      { status: 400 },
    );
  }

  const parsed = upsertReleaseSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const { created } = await upsertRelease(
      parsedSlug.data,
      parsedVersion.data,
      parsed.data,
    );
    return NextResponse.json(
      { slug: parsedSlug.data, version: parsedVersion.data },
      { status: created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof ProjectNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    throw error;
  }
}
```

- [ ] **Step 4: Delete the obsolete routes**

```bash
git rm src/app/api/projects/route.ts src/app/api/changelog/route.ts
```

- [ ] **Step 5: Confirm types and lint**

Run: `npm run lint && npx tsc --noEmit`
Expected: remaining errors only in the projects/changelog components, replaced in Tasks 10 and 11.

- [ ] **Step 6: Commit**

```bash
git add src/app/api
git commit -m "Replace changelog POST routes with idempotent PUT upserts"
```

> The API is exercised against a real database in Task 12 — there is no local Postgres to test it against now.

---

### Task 8: Message keys for all three locales

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/pt.json`
- Modify: `messages/es.json`

Every key goes into all three files in this one commit. `releaseCount` uses next-intl's ICU plural syntax.

**Interfaces:**
- Consumes: nothing.
- Produces: namespaces `ProjectsPage`, `ProjectDetail`, `ReleaseChange`; a fourth entry in `Nav.items`.

- [ ] **Step 1: Add the English keys**

Replace the existing `ProjectsPage`, `ProjectDetail` and `ChangelogEntry` blocks in `messages/en.json`. `ChangelogEntry` is deleted.

```json
"ProjectsPage": {
  "num": "03",
  "label": "Projects",
  "title": "Things I build and keep in the open.",
  "lead": "Personal and open work, each with its own release history. Client and employer systems live in Experience.",
  "empty": {
    "title": "Nothing published yet.",
    "body": "The first open projects land here with their full release history."
  },
  "status": {
    "active": "Active",
    "wip": "In progress",
    "archived": "Archived"
  },
  "releaseCount": "{count, plural, =0 {no releases} one {# release} other {# releases}}",
  "latestVersion": "Latest"
},
"ProjectDetail": {
  "back": "All projects",
  "startedIn": "Started in {year}",
  "releasesHeading": "Releases",
  "releasesEmpty": "No releases published yet.",
  "repoLink": "Source",
  "liveLink": "Live"
},
"ReleaseChange": {
  "type": {
    "added": "Added",
    "changed": "Changed",
    "fixed": "Fixed",
    "removed": "Removed",
    "deprecated": "Deprecated",
    "security": "Security"
  }
}
```

And change `Nav.items` to add `Projects` in third position:

```json
"items": ["About", "Experience", "Projects", "Contact"]
```

- [ ] **Step 2: Add the Portuguese keys**

```json
"ProjectsPage": {
  "num": "03",
  "label": "Projetos",
  "title": "Coisas que eu construo e mantenho no aberto.",
  "lead": "Trabalho pessoal e aberto, cada um com seu histórico de versões. Sistemas de clientes e empresas ficam em Experiência.",
  "empty": {
    "title": "Nada publicado ainda.",
    "body": "Os primeiros projetos abertos aparecem aqui com o histórico completo de versões."
  },
  "status": {
    "active": "Ativo",
    "wip": "Em andamento",
    "archived": "Arquivado"
  },
  "releaseCount": "{count, plural, =0 {sem versões} one {# versão} other {# versões}}",
  "latestVersion": "Última"
},
"ProjectDetail": {
  "back": "Todos os projetos",
  "startedIn": "Começou em {year}",
  "releasesHeading": "Versões",
  "releasesEmpty": "Nenhuma versão publicada ainda.",
  "repoLink": "Código",
  "liveLink": "No ar"
},
"ReleaseChange": {
  "type": {
    "added": "Adicionado",
    "changed": "Alterado",
    "fixed": "Corrigido",
    "removed": "Removido",
    "deprecated": "Descontinuado",
    "security": "Segurança"
  }
}
```

`Nav.items` becomes:

```json
"items": ["Sobre", "Experiência", "Projetos", "Contato"]
```

- [ ] **Step 3: Add the Spanish keys**

```json
"ProjectsPage": {
  "num": "03",
  "label": "Proyectos",
  "title": "Cosas que construyo y mantengo en abierto.",
  "lead": "Trabajo personal y abierto, cada uno con su historial de versiones. Los sistemas de clientes y empresas están en Experiencia.",
  "empty": {
    "title": "Nada publicado todavía.",
    "body": "Los primeros proyectos abiertos aparecerán aquí con su historial completo de versiones."
  },
  "status": {
    "active": "Activo",
    "wip": "En curso",
    "archived": "Archivado"
  },
  "releaseCount": "{count, plural, =0 {sin versiones} one {# versión} other {# versiones}}",
  "latestVersion": "Última"
},
"ProjectDetail": {
  "back": "Todos los proyectos",
  "startedIn": "Comenzó en {year}",
  "releasesHeading": "Versiones",
  "releasesEmpty": "Ninguna versión publicada todavía.",
  "repoLink": "Código",
  "liveLink": "En vivo"
},
"ReleaseChange": {
  "type": {
    "added": "Añadido",
    "changed": "Cambiado",
    "fixed": "Corregido",
    "removed": "Eliminado",
    "deprecated": "Obsoleto",
    "security": "Seguridad"
  }
}
```

`Nav.items` becomes:

```json
"items": ["Sobre mí", "Experiencia", "Proyectos", "Contacto"]
```

- [ ] **Step 4: Verify all three files parse and have identical key sets**

```bash
node -e "
const l = ['en','pt','es'].map(n => [n, require('./messages/'+n+'.json')]);
const keys = o => Object.entries(o).flatMap(([k,v]) => v && typeof v === 'object' && !Array.isArray(v) ? keys(v).map(s => k+'.'+s) : [k]).sort();
const [base, ...rest] = l.map(([n,o]) => [n, keys(o)]);
for (const [n, k] of rest) {
  const missing = base[1].filter(x => !k.includes(x));
  const extra = k.filter(x => !base[1].includes(x));
  console.log(n, 'missing:', missing, 'extra:', extra);
}
"
```

Expected: `missing: [] extra: []` for both `pt` and `es`.

- [ ] **Step 5: Commit**

```bash
git add messages
git commit -m "Add projects and releases message keys for all locales"
```

---

### Task 9: Shared components and nav config

Two components become shared and move out of feature folders. The nav gets a single config so a route-based entry can coexist with the anchors.

**Files:**
- Move: `src/components/experience/stack-icon.tsx` → `src/components/stack-icon.tsx`
- Move: `src/components/changelog/markdown-content.tsx` → `src/components/markdown-content.tsx`
- Create: `src/components/stack-list.tsx`
- Modify: `src/components/experience/role-item.tsx` (import path + use `StackList`)
- Create: `src/components/site-header/nav-items.ts`
- Modify: `src/components/site-header/desktop-nav.tsx`
- Modify: `src/components/site-header/mobile-sheet.tsx`

**Interfaces:**
- Produces:
  - `StackList({ items }: { items: string[] })` — the glyph + label row, used by `role-item.tsx` (this task), `project-ledger-row.tsx` (Task 10) and the detail page (Task 11)
  - `NAV_ITEMS: readonly NavItem[]` where `NavItem = { href: string; kind: "anchor" | "route"; disabled?: boolean }`

- [ ] **Step 1: Move the shared components**

```bash
git mv src/components/experience/stack-icon.tsx src/components/stack-icon.tsx
git mv src/components/changelog/markdown-content.tsx src/components/markdown-content.tsx
```

- [ ] **Step 2: Extract the shared stack list and fix importers**

Three places need the same glyph + label row — `role-item.tsx` already has it, and Tasks 10 and 11 both need it. Extract it once rather than writing it three times.

Copy the markup verbatim from the existing block in `src/components/experience/role-item.tsx` so the experience timeline is pixel-identical afterwards:

```tsx
// src/components/stack-list.tsx
import { StackIcon } from "@/components/stack-icon";

interface StackListProps {
  items: string[];
}

/**
 * Stack labels with their monochrome brand glyphs. Shared by the experience
 * timeline, the projects ledger and the project detail header so the three
 * stay visually identical.
 */
export function StackList({ items }: StackListProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-[7px] font-mono text-[11.5px] tracking-[0.01em] text-foreground"
        >
          <StackIcon name={item} />
          {item}
        </span>
      ))}
    </div>
  );
}
```

Then in `src/components/experience/role-item.tsx`: replace the `import { StackIcon } from "@/components/experience/stack-icon";` line with `import { StackList } from "@/components/stack-list";`, and replace that component's inline `<div className="flex flex-wrap items-center gap-x-4 gap-y-2">…</div>` stack block with `<StackList items={role.stack} />`.

Then confirm no stale import paths remain:

Run: `grep -rn "experience/stack-icon\|changelog/markdown-content" src`
Expected: no matches.

Verify the experience section is visually unchanged when you check the browser in Step 6.

- [ ] **Step 3: Create the nav config**

Today `desktop-nav.tsx` and `mobile-sheet.tsx` each hold their own `const HREFS = [...]` and each hardcodes `const disabled = index === 2`. Appending a fourth label would dim the wrong item and give `/projects` an anchor instead of a route. One config, consumed by both:

```ts
// src/components/site-header/nav-items.ts

/**
 * Nav entries in display order. Labels live in `Nav.items` in the message
 * files and are matched to these by index — keep the two in the same order.
 * `route` entries render through the locale-aware Link; `anchor` entries
 * stay plain in-page hashes.
 */
export interface NavItem {
  href: string;
  kind: "anchor" | "route";
  /** Dimmed and unclickable — the section does not exist yet. */
  disabled?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "#about", kind: "anchor" },
  { href: "#experience", kind: "anchor" },
  { href: "/projects", kind: "route" },
  { href: "#contact", kind: "anchor", disabled: true },
];
```

- [ ] **Step 4: Rewrite the desktop nav**

```tsx
// src/components/site-header/desktop-nav.tsx
import { useTranslations } from "next-intl";

import { NAV_ITEMS } from "@/components/site-header/nav-items";
import { Link } from "@/i18n/navigation";

const LINK_CLASS =
  "flex items-center gap-1.5 px-3.5 text-[13.5px] font-medium tracking-[-0.01em] text-muted-foreground transition-colors hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-[0.38]";

export function DesktopNav() {
  const t = useTranslations("Nav");
  const items = t.raw("items") as string[];

  return (
    <nav
      aria-label="Primary"
      className="hidden items-stretch self-stretch lg:ml-auto lg:flex"
    >
      {NAV_ITEMS.map((item, index) => {
        const label = items[index];
        const num = <span className="font-mono text-[9.5px] tracking-[0.06em] text-border">0{index + 1}</span>;

        if (item.kind === "route") {
          return (
            <Link key={item.href} href={item.href} className={LINK_CLASS}>
              {num}
              {label}
            </Link>
          );
        }

        return (
          <a
            key={item.href}
            href={item.href}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : undefined}
            className={LINK_CLASS}
          >
            {num}
            {label}
          </a>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Rewrite the mobile sheet nav block**

Keep everything else in the file as-is — only the `HREFS` constant and the `items.map(...)` block change.

```tsx
// src/components/site-header/mobile-sheet.tsx — imports
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_ITEMS } from "@/components/site-header/nav-items";
import { Link } from "@/i18n/navigation";
```

```tsx
// …replacing the <div className="flex flex-col py-4"> block
const ITEM_CLASS =
  "flex items-baseline gap-3 py-2.5 text-foreground transition-colors hover:text-brand active:text-brand aria-disabled:pointer-events-none aria-disabled:opacity-[0.38]";

// inside the component's return:
<div className="flex flex-col py-4">
  {NAV_ITEMS.map((item, index) => {
    const label = items[index];
    const body = (
      <>
        <span className="w-5 shrink-0 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
          0{index + 1}
        </span>
        <span className="text-3xl leading-[1.06] font-semibold tracking-[-0.045em]">
          {label}
        </span>
      </>
    );

    if (item.kind === "route") {
      return (
        <Link key={item.href} href={item.href} onClick={onClose} className={ITEM_CLASS}>
          {body}
        </Link>
      );
    }

    return (
      <a
        key={item.href}
        href={item.href}
        onClick={item.disabled ? undefined : onClose}
        aria-disabled={item.disabled}
        tabIndex={item.disabled ? -1 : undefined}
        className={ITEM_CLASS}
      >
        {body}
      </a>
    );
  })}
</div>
```

Declare `ITEM_CLASS` at module scope, next to the imports — not inside the component.

- [ ] **Step 6: Verify in the browser**

```bash
npm run dev -- --port 3100
```

Check at desktop and mobile widths: the nav reads About 01, Experience 02, Projects 03, Contact 04; Contact is dimmed and unclickable; Projects navigates to `/projects` and keeps the locale prefix (from `/es`, it goes to `/es/projects`). The mobile sheet closes when Projects is tapped.

- [ ] **Step 7: Lint and commit**

```bash
npm run lint && npx tsc --noEmit
git add src/components
git commit -m "Share stack icon and markdown content, add nav config with routes"
```

---

### Task 10: The projects ledger screen

**Files:**
- Create: `src/components/projects/project-ledger.tsx`
- Create: `src/components/projects/project-ledger-row.tsx`
- Create: `src/components/projects/project-status-badge.tsx`
- Create: `src/components/projects/projects-empty.tsx`
- Modify: `src/app/[locale]/projects/page.tsx` (full rewrite)
- Delete: `src/components/projects/project-card.tsx`
- Delete: `src/components/projects/project-list.tsx`

**Interfaces:**
- Consumes: `ProjectListItem` (Task 6), `getProjectsForLocale` (Task 6), `StackList` (Task 9), `Reveal` (existing), message keys (Task 8).
- Produces: `ProjectLedger`, `ProjectLedgerRow`, `ProjectStatusBadge`, `ProjectsEmpty`.

Measurements come from `src/components/experience/role-item.tsx` — read it first and match it rather than inventing spacing.

- [ ] **Step 1: Build the status badge**

```tsx
// src/components/projects/project-status-badge.tsx
import { useTranslations } from "next-intl";

import type { ProjectStatus } from "@/lib/project-enums";
import { cn } from "@/lib/utils";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
}

export function ProjectStatusBadge({ status }: ProjectStatusBadgeProps) {
  const t = useTranslations("ProjectsPage");

  return (
    <span
      className={cn(
        "font-mono text-[9.5px] tracking-[0.1em] uppercase",
        status === "active" ? "text-brand" : "text-muted-foreground",
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
```

- [ ] **Step 2: Build the ledger row**

Mobile stacks to one column; `sm:` splits into the same `1fr / 184px` grid the experience timeline uses.

```tsx
// src/components/projects/project-ledger-row.tsx
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/motion/reveal";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { StackList } from "@/components/stack-list";
import { Link } from "@/i18n/navigation";
import type { ProjectListItem } from "@/server/view-models/project";

interface ProjectLedgerRowProps {
  project: ProjectListItem;
  /** Position in the ledger — drives the reveal stagger. */
  index?: number;
}

export function ProjectLedgerRow({ project, index = 0 }: ProjectLedgerRowProps) {
  const t = useTranslations("ProjectsPage");

  return (
    <Reveal as="article" delay={(index % 4) * 70} className="border-t border-border">
      <Link
        href={`/projects/${project.slug}`}
        className="group grid grid-cols-1 gap-3.5 py-6 sm:grid-cols-[1fr_184px] sm:gap-x-10 sm:py-8"
      >
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="flex flex-col gap-1">
            <div className="mb-0.5 flex flex-wrap items-baseline gap-2">
              <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
                {project.year}
              </span>
              <span className="font-mono text-[9.5px] text-muted-foreground">·</span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <h2 className="text-xl leading-[1.1] font-semibold tracking-[-0.036em] text-balance text-foreground transition-colors group-hover:text-brand sm:text-[27px]">
              {project.name}
            </h2>
          </div>
          <p className="max-w-[74ch] text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
            {project.description}
          </p>
          <StackList items={project.stack} />
        </div>

        <div className="flex flex-row items-baseline gap-3 sm:flex-col sm:items-end sm:gap-1 sm:text-right">
          {project.latestVersion && (
            <span className="font-mono text-[13px] tracking-[0.02em] text-brand">
              v{project.latestVersion}
            </span>
          )}
          <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
            {t("releaseCount", { count: project.releaseCount })}
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
```

`count` is passed as a raw number, not through `format.number()` — the ICU plural rule needs a number to select the `=0` / `one` / `other` branch, and `#` inside the message is what formats it.

- [ ] **Step 3: Build the ledger list**

```tsx
// src/components/projects/project-ledger.tsx
import { ProjectLedgerRow } from "@/components/projects/project-ledger-row";
import type { ProjectListItem } from "@/server/view-models/project";

interface ProjectLedgerProps {
  projects: ProjectListItem[];
}

export function ProjectLedger({ projects }: ProjectLedgerProps) {
  return (
    <div className="mt-10 flex flex-col sm:mt-16">
      {projects.map((project, index) => (
        <ProjectLedgerRow key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Build the empty state**

This is the real launch state, not an edge case — it gets the same care as a populated row.

```tsx
// src/components/projects/projects-empty.tsx
import { useTranslations } from "next-intl";

export function ProjectsEmpty() {
  const t = useTranslations("ProjectsPage");

  return (
    <div className="mt-10 border-t border-border pt-6 sm:mt-16 sm:pt-7.5">
      <p className="text-xl leading-[1.1] font-semibold tracking-[-0.036em] text-balance text-foreground sm:text-[27px]">
        {t("empty.title")}
      </p>
      <p className="mt-3 max-w-[52ch] text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-muted-foreground sm:text-[15.5px]">
        {t("empty.body")}
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the page**

The shell matches the home page: `max-w-[1080px]`, same padding, header and footer included.

```tsx
// src/app/[locale]/projects/page.tsx
import { getTranslations } from "next-intl/server";

import { ProjectLedger } from "@/components/projects/project-ledger";
import { ProjectsEmpty } from "@/components/projects/projects-empty";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";
import type { Locale } from "@/i18n/locales";
import { getProjectsForLocale } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

interface ProjectsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  const projects = await getProjectsForLocale(locale as Locale);
  const t = await getTranslations("ProjectsPage");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1080px] overflow-x-clip px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <section>
          <div className="mb-4.5 flex items-baseline gap-3 sm:mb-6.5">
            <span className="font-mono text-[10px] tracking-[0.12em] text-brand">
              {t("num")}
            </span>
            <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
              {t("label")}
            </span>
          </div>

          <h1 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:mt-5.5 sm:text-[17px]">
            {t("lead")}
          </p>

          {projects.length === 0 ? (
            <ProjectsEmpty />
          ) : (
            <ProjectLedger projects={projects} />
          )}
        </section>
        <SiteFooter />
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Delete the placeholder components**

```bash
git rm src/components/projects/project-card.tsx src/components/projects/project-list.tsx
```

- [ ] **Step 7: Verify in the browser**

The database has no `projects` table yet (Task 12 migrates), so expect the page to error on the query. To see the screen now, temporarily stub `getProjectsForLocale` to return `[]` and then a hand-written array of two `ProjectListItem` objects — **revert the stub before committing.**

```bash
npm run dev -- --port 3100
```

Check `/projects`, `/en/projects`, `/es/projects` at 375px, 768px and 1440px, in light and dark: the empty state reads as designed, a populated row aligns its version column with the experience timeline, the page never scrolls sideways, and the row title turns brand-coloured on hover.

- [ ] **Step 8: Lint and commit**

```bash
npm run lint && npx tsc --noEmit
git add src/components/projects "src/app/[locale]/projects/page.tsx"
git commit -m "Rebuild projects index as an editorial ledger"
```

---

### Task 11: The project detail screen

**Files:**
- Create: `src/components/releases/change-type-glyph.tsx`
- Create: `src/components/releases/release-change-list.tsx`
- Create: `src/components/releases/release-item.tsx`
- Create: `src/components/releases/release-timeline.tsx`
- Modify: `src/components/projects/project-links.tsx` (restyle)
- Modify: `src/app/[locale]/projects/[slug]/page.tsx` (full rewrite)
- Delete: `src/components/changelog/changelog-timeline.tsx`
- Delete: `src/components/changelog/changelog-entry-item.tsx`

**Interfaces:**
- Consumes: `ProjectDetailView` / `ReleaseView` / `ReleaseChangeView` (Task 6), `getProjectBySlugForLocale` (Task 6), `versionAnchor` (Task 2), `MarkdownContent` / `StackList` (Task 9), message keys (Task 8).
- Produces: `ReleaseTimeline`, `ReleaseItem`, `ReleaseChangeList`, `ChangeTypeGlyph`.

- [ ] **Step 1: Build the change glyph**

One glyph and colour per change type. The visible label comes from the message file — the glyph is decorative.

```tsx
// src/components/releases/change-type-glyph.tsx
import type { ChangeType } from "@/lib/project-enums";
import { cn } from "@/lib/utils";

const GLYPHS: Record<ChangeType, string> = {
  added: "+",
  changed: "~",
  fixed: "✓",
  removed: "−",
  deprecated: "!",
  security: "△",
};

const COLORS: Record<ChangeType, string> = {
  added: "text-brand",
  changed: "text-foreground",
  fixed: "text-foreground",
  removed: "text-muted-foreground",
  deprecated: "text-muted-foreground",
  security: "text-brand",
};

interface ChangeTypeGlyphProps {
  type: ChangeType;
}

export function ChangeTypeGlyph({ type }: ChangeTypeGlyphProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "w-3 shrink-0 text-center font-mono text-[12px] leading-[1.6]",
        COLORS[type],
      )}
    >
      {GLYPHS[type]}
    </span>
  );
}
```

- [ ] **Step 2: Build the change list**

```tsx
// src/components/releases/release-change-list.tsx
import { useTranslations } from "next-intl";

import { ChangeTypeGlyph } from "@/components/releases/change-type-glyph";
import type { ReleaseChangeView } from "@/server/view-models/project";

interface ReleaseChangeListProps {
  changes: ReleaseChangeView[];
}

export function ReleaseChangeList({ changes }: ReleaseChangeListProps) {
  const t = useTranslations("ReleaseChange");

  if (changes.length === 0) return null;

  return (
    <ul className="mt-3.5 flex flex-col gap-2">
      {changes.map((change) => (
        <li key={change.id} className="flex items-baseline gap-2.5">
          <ChangeTypeGlyph type={change.type} />
          <span className="font-mono text-[9.5px] tracking-[0.1em] text-muted-foreground uppercase sm:w-24 sm:shrink-0">
            {t(`type.${change.type}`)}
          </span>
          <span className="min-w-0 text-[14px] leading-[1.6] tracking-[-0.006em] text-pretty text-foreground sm:text-[15px]">
            {change.text}
          </span>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Build the release item**

```tsx
// src/components/releases/release-item.tsx
import { useFormatter } from "next-intl";

import { MarkdownContent } from "@/components/markdown-content";
import { Reveal } from "@/components/motion/reveal";
import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { versionAnchor } from "@/lib/version-key";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseItemProps {
  release: ReleaseView;
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function ReleaseItem({ release, index = 0 }: ReleaseItemProps) {
  const format = useFormatter();
  const anchor = versionAnchor(release.version);

  return (
    <Reveal
      as="article"
      id={anchor}
      delay={(index % 4) * 70}
      className="scroll-mt-28 border-t border-border py-6 sm:py-8"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <a
          href={`#${anchor}`}
          className="font-mono text-[15px] tracking-[0.02em] text-brand transition-opacity hover:opacity-70"
        >
          v{release.version}
        </a>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
          {format.dateTime(release.releasedAt, "long")}
        </span>
      </div>

      {release.title && (
        <h3 className="mt-2 text-lg leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-xl">
          {release.title}
        </h3>
      )}

      <ReleaseChangeList changes={release.changes} />

      {release.notes && (
        <div className="mt-4">
          <MarkdownContent content={release.notes} />
        </div>
      )}
    </Reveal>
  );
}
```

- [ ] **Step 4: Build the timeline**

```tsx
// src/components/releases/release-timeline.tsx
import { useTranslations } from "next-intl";

import { ReleaseItem } from "@/components/releases/release-item";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseTimelineProps {
  releases: ReleaseView[];
}

export function ReleaseTimeline({ releases }: ReleaseTimelineProps) {
  const t = useTranslations("ProjectDetail");

  if (releases.length === 0) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-[14px] leading-[1.6] text-muted-foreground sm:text-[15.5px]">
        {t("releasesEmpty")}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col sm:mt-8">
      {releases.map((release, index) => (
        <ReleaseItem key={release.id} release={release} index={index} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Restyle the project links**

Replace the body of `src/components/projects/project-links.tsx`, keeping the same props:

```tsx
// src/components/projects/project-links.tsx
import { useTranslations } from "next-intl";

interface ProjectLinksProps {
  repoUrl: string | null;
  liveUrl: string | null;
}

const LINK_CLASS =
  "font-mono text-[11.5px] tracking-[0.08em] text-muted-foreground uppercase transition-colors hover:text-brand";

export function ProjectLinks({ repoUrl, liveUrl }: ProjectLinksProps) {
  const t = useTranslations("ProjectDetail");

  if (!repoUrl && !liveUrl) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {repoUrl && (
        <a href={repoUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {t("repoLink")} ↗
        </a>
      )}
      {liveUrl && (
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {t("liveLink")} ↗
        </a>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Rewrite the detail page**

```tsx
// src/app/[locale]/projects/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ProjectLinks } from "@/components/projects/project-links";
import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { ReleaseTimeline } from "@/components/releases/release-timeline";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header/site-header";
import { MarkdownContent } from "@/components/markdown-content";
import { StackList } from "@/components/stack-list";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/locales";
import { getProjectBySlugForLocale } from "@/server/services/project-service";

export const dynamic = "force-dynamic";

interface ProjectDetailPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProjectBySlugForLocale(slug, locale as Locale);

  if (!project) return {};

  return {
    title: project.name,
    description: project.description,
    openGraph: {
      title: project.name,
      description: project.description,
      ...(project.imageUrl ? { images: [{ url: project.imageUrl }] } : {}),
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { locale, slug } = await params;
  const project = await getProjectBySlugForLocale(slug, locale as Locale);

  if (!project) notFound();

  const t = await getTranslations("ProjectDetail");

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-[1080px] overflow-x-clip px-4 pt-10 pb-18 sm:px-16 sm:pt-16 sm:pb-35">
        <Link
          href="/projects"
          className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-brand"
        >
          ← {t("back")}
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:mt-8">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
              {t("startedIn", { year: project.year })}
            </span>
            <span className="font-mono text-[9.5px] text-muted-foreground">·</span>
            <ProjectStatusBadge status={project.status} />
          </div>

          <h1 className="max-w-[20ch] text-[28px] leading-[1.04] font-bold tracking-[-0.042em] text-balance text-foreground sm:text-5xl">
            {project.name}
          </h1>

          <p className="max-w-[58ch] text-[14.5px] leading-[1.55] tracking-[-0.008em] text-pretty text-muted-foreground sm:text-[17px]">
            {project.description}
          </p>

          <StackList items={project.stack} />

          <ProjectLinks repoUrl={project.repoUrl} liveUrl={project.liveUrl} />
        </div>

        {project.summary && (
          <div className="mt-8 max-w-[68ch] sm:mt-11">
            <MarkdownContent content={project.summary} />
          </div>
        )}

        <section className="mt-11 sm:mt-16">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {t("releasesHeading")}
          </span>
          <ReleaseTimeline releases={project.releases} />
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
```

- [ ] **Step 7: Delete the changelog components**

```bash
git rm src/components/changelog/changelog-timeline.tsx src/components/changelog/changelog-entry-item.tsx
```

Run: `ls src/components/changelog 2>/dev/null`
Expected: nothing — the directory is gone (`markdown-content.tsx` moved out in Task 9).

- [ ] **Step 8: Verify in the browser**

Same stubbing caveat as Task 10 — there is still no `releases` table. Temporarily stub `getProjectBySlugForLocale` to return a hand-written `ProjectDetailView` with two releases, one carrying all six change types and a `notes` markdown block, the other with an empty `changes` array and a title. **Revert the stub before committing.**

Check at 375px, 768px and 1440px, light and dark: change rows align their labels without wrapping badly on mobile, the version anchor scrolls with clearance under the sticky header, an empty release renders its title cleanly, markdown in `notes` and `summary` is styled by the typography plugin, and the page never scrolls sideways.

- [ ] **Step 9: Lint, full test suite, commit**

```bash
npm run lint && npx tsc --noEmit && npm test
git add src/components "src/app/[locale]/projects"
git commit -m "Rebuild project detail with a typed release timeline"
```

---

### Task 12: Reconcile the database and verify end to end

This is the only task that touches production. Nothing before it ran a migration.

**Files:** none — operational.

- [ ] **Step 1: Open the tunnel to the Coolify Postgres**

```bash
ssh -L 5433:<postgres-internal-host>:5432 <user>@<coolify-host>
```

Leave it open in its own terminal. Everything below uses `localhost:5433`.

- [ ] **Step 2: Inspect what actually exists in the remote database**

`src/db/migrations/` did not exist before Task 4, so there is **no migration journal** — whatever tables exist were created by some other means. Find out before writing:

```bash
DATABASE_URL="postgres://<user>:<pass>@localhost:5433/<db>" node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  const tables = await sql\`select table_name from information_schema.tables where table_schema = 'public' order by table_name\`;
  console.log('tables:', tables.map(t => t.table_name));
  for (const t of ['projects', 'changelog_entries']) {
    if (tables.some(x => x.table_name === t)) {
      const [{ count }] = await sql\`select count(*)::int as count from \${sql(t)}\`;
      console.log(t, 'rows:', count);
    }
  }
  await sql.end();
})();
"
```

- [ ] **Step 3: Branch on what you found**

**Case A — no `projects` table and no `drizzle` schema/journal table.** The database is clean for this feature. Go to Step 4.

**Case B — `projects` and/or `changelog_entries` exist with 0 rows.** The generated migration's `CREATE TABLE` will collide. Drop them, then go to Step 4:

```bash
DATABASE_URL="postgres://<user>:<pass>@localhost:5433/<db>" node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  await sql\`drop table if exists changelog_entries cascade\`;
  await sql\`drop table if exists projects cascade\`;
  console.log('dropped');
  await sql.end();
})();
"
```

**Case C — either table has rows.** Stop. Do not drop anything. Report the row counts and the contents to the user and ask how to proceed — the spec assumed these tables were empty, and that assumption is now known to be false.

- [ ] **Step 4: Run the migration**

```bash
DATABASE_URL="postgres://<user>:<pass>@localhost:5433/<db>" npm run db:migrate
```

Expected: the initial migration applies, creating `projects`, `releases`, `release_changes` and the `drizzle` journal table.

- [ ] **Step 5: Confirm the tables landed**

Re-run the inspection command from Step 2. Expected tables: `projects`, `releases`, `release_changes`, plus drizzle's journal.

- [ ] **Step 6: Smoke-test the API against a local dev server on the tunnelled database**

```bash
DATABASE_URL="postgres://<user>:<pass>@localhost:5433/<db>" CHANGELOG_API_TOKEN=localtest npm run dev -- --port 3100
```

Then, in another terminal, work through the checklist. Each command states the expected status.

```bash
BASE=http://localhost:3100
TOKEN=localtest

# 401 — no token
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio"

# 400 — bad body
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Portfolio"}'

# 201 — created
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Portfolio","description":{"en":"This site.","pt":"Este site."},"stack":["Next.js","PostgreSQL"],"status":"active","year":2026}'

# 200 — same payload again, idempotent
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Portfolio","description":{"en":"This site.","pt":"Este site."},"stack":["Next.js","PostgreSQL"],"status":"active","year":2026}'

# 404 — release on an unknown project, no inline project
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/ghost/releases/1.0.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"changes":[]}'

# 400 — bad version in the path
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio/releases/v1.0.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"changes":[]}'

# 201 — release created
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio/releases/1.4.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"releasedAt":"2026-08-10T12:00:00Z","title":{"en":"Theming release"},"changes":[{"type":"added","text":{"en":"Dark mode","pt":"Modo escuro"}},{"type":"fixed","text":{"en":"Upload crash"}}]}'

# 200 — re-sent with ONE change; the list must be replaced, not appended
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio/releases/1.4.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"releasedAt":"2026-08-10T12:00:00Z","title":{"en":"Theming release"},"changes":[{"type":"added","text":{"en":"Dark mode","pt":"Modo escuro"}}]}'

# 201 — ordering check: 1.10.0 must sort above 1.9.0 on the page
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio/releases/1.9.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"changes":[{"type":"changed","text":{"en":"Nine"}}]}'
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/portfolio/releases/1.10.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"changes":[{"type":"changed","text":{"en":"Ten"}}]}'

# 201 — inline project creation on first release
curl -s -o /dev/null -w '%{http_code}\n' -X PUT "$BASE/api/projects/cli-deploy/releases/0.1.0" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"changes":[{"type":"added","text":{"en":"Everything"}}],"project":{"name":"CLI Deploy","description":{"en":"A deploy CLI."},"status":"wip","year":2025}}'
```

- [ ] **Step 7: Verify the screens against real data**

Visit `/projects`, `/en/projects`, `/es/projects` and `/projects/portfolio`. Confirm:

- Release `1.10.0` appears **above** `1.9.0`
- Release `1.4.0` shows exactly **one** change, not three — the replacement worked
- `/es/projects` shows English descriptions (the fallback) while labels, dates and change types are Spanish
- `/projects` shows two rows, `portfolio` (active) above `cli-deploy` (wip)
- The `cli-deploy` detail page renders with no repo or live link
- Check all of the above at 375px, 768px and 1440px, in light and dark

- [ ] **Step 8: Clean up the smoke-test rows**

These are test fixtures, not content. Delete them so the site launches with the real empty state:

```bash
DATABASE_URL="postgres://<user>:<pass>@localhost:5433/<db>" node -e "
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL);
(async () => {
  await sql\`delete from projects where slug in ('portfolio', 'cli-deploy')\`;
  console.log('cleaned');
  await sql.end();
})();
"
```

Cascade deletes take the releases and changes with them. Re-check `/projects` and confirm the empty state renders.

- [ ] **Step 9: Confirm `/projects` empty state in production after deploy**

Once the code is deployed to Coolify, visit the live `/projects` in all three locales and confirm the empty state and the nav entry. Then fill in the real domain in `CHANGELOG-API.md` where `PORTFOLIO_API_URL` is described, and commit that.

```bash
git add CHANGELOG-API.md
git commit -m "Document the production base URL for the changelog API"
```

---

## Deferred to phase 2

Not in this plan, by design: the GitHub webhook adapter, a global `/changelog` page, a projects block on the home page, public `GET` endpoints, `DELETE` endpoints, and content translation tooling. The idempotent `PUT` surface is what makes the webhook a thin adapter later.
