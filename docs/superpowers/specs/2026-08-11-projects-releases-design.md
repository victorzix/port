# Projects & Releases — Design

**Date:** 2026-08-11
**Status:** approved, ready for implementation planning
**Scope:** phase 1 — data model, upload API, and the two screens. Git integration is phase 2 with its own spec.

## Problem

The repo already ships a skeleton for projects and changelogs: a `projects` table, a `changelog_entries` table, two `POST` endpoints behind a bearer token, and `/projects` + `/projects/[slug]` pages built from generic shadcn cards. Three things are wrong with it:

1. **No concept of a version.** A changelog entry is a free-form title plus markdown body. There is no release, no semver, no typed changes.
2. **The API cannot correct itself.** `POST` creates once; a typo means editing Postgres by hand.
3. **The screens are visually disconnected from the site.** They use `max-w-3xl` and plain cards, while every other page follows an editorial grammar: 1080px shell, mono numbered section rails, `clamp()` type scale, `border-t` rows, Simple Icons stack glyphs.

The design source in Claude Design (`Portfolio.dc.html`) covers only the home page — `01 Sobre`, `02 Experiência`, `03 Formação`. There is no design for projects or releases, so the new screens are authored here, derived from that established grammar rather than invented.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Changelog unit | A **release** is the unit: version + date + typed changes | Keep a Changelog / GitHub releases shape; maps directly onto git tags in phase 2 |
| Content i18n | **JSONB per locale, partial allowed**, `en` required, fallback to `en` | Lets content be translated progressively without blocking a publish |
| Upload shape | **Idempotent upsert** keyed on slug and (project, version) | Safe to retry from CI; re-sending a corrected payload fixes instead of duplicating |
| Screens | `/projects` index + `/projects/[slug]` detail only | A global `/changelog` and a home section can be added later without rework |
| Extra project fields | `sortOrder`, `summary`, `imageUrl` | Explicitly chosen; `role`/context was cut |
| What is a "project" | **Not work experience.** Experience stays in the Experience section and has no changelog | Owner's call; `/projects` is for open/personal work |

### Launch state

There are no qualifying projects yet ("por enquanto"). `/projects` **launches empty**, so the empty state is the real shipped state and gets designed properly, not treated as an edge case.

## Data model

Replaces `changelog_entries` with two tables. In `src/db/schema.ts`.

```
projects
  id           uuid pk default random
  slug         text not null, unique
  name         text not null            -- proper noun, not translated
  description  jsonb not null           -- Localized · one line, ledger + detail
  summary      jsonb                    -- Localized · long markdown, detail only
  stack        text[] not null default {} -- values must resolve in src/lib/stack-icons.ts
  status       text not null            -- 'active' | 'wip' | 'archived'
  year         integer not null         -- the "2026" in the ledger row
  sortOrder    integer not null default 0
  imageUrl     text                     -- og:image on the detail page
  repoUrl      text
  liveUrl      text
  createdAt    timestamptz not null default now()
  updatedAt    timestamptz not null default now()

releases
  id           uuid pk default random
  projectId    uuid not null → projects.id on delete cascade
  version      text not null            -- "1.4.0", no leading "v"
  versionKey   text not null            -- "00001.00004.00000", derived server-side
  releasedAt   timestamptz not null default now()
  title        jsonb                    -- Localized · optional headline
  notes        jsonb                    -- Localized · optional free markdown
  createdAt    timestamptz not null default now()
  updatedAt    timestamptz not null default now()
  unique (projectId, version)
  index (projectId)

release_changes
  id           uuid pk default random
  releaseId    uuid not null → releases.id on delete cascade
  type         text not null            -- 'added'|'changed'|'fixed'|'removed'|'deprecated'|'security'
  text         jsonb not null           -- Localized
  position     integer not null         -- order within the release
  index (releaseId)
```

`status` and `type` are `text` columns with a Drizzle `$type<...>()` union and zod enum validation at the boundary — not Postgres enums, which would need a migration to extend.

**`versionKey`** exists because ordering semver as text is wrong (`"1.10.0" < "1.9.0"`). Each numeric component is zero-padded to 5 digits at write time. It is always derived in the service from `version`, never accepted from the client. Non-semver versions (e.g. `2026.08.1`) pad the same way; a version that does not parse as dot-separated integers is a 400.

**Ledger ordering:** `sortOrder asc`, then status rank (`active` 0, `wip` 1, `archived` 2), then most recent release date desc, then `name asc`.

**Release ordering** on the detail page: `versionKey desc`.

### Migration

`changelog_entries` is dropped. This assumes the table is empty in production — verify before running. Workflow per `CLAUDE.md`: `npm run db:generate` locally, commit the generated SQL under `src/db/migrations/`, then open the SSH tunnel to the Coolify host and run `db:migrate`. Never in the Docker image, never at container boot.

## Localized content

New file `src/lib/localized.ts`, single responsibility:

```ts
type Localized = { en: string; pt?: string; es?: string }
const localizedSchema  // zod: en required min(1), pt/es optional
function pick(value: Localized, locale: Locale): string  // falls back to en
```

The fallback must not leak into components. Services expose locale-aware readers that resolve JSONB into plain strings:

- `getProjectsForLocale(locale)` → `ProjectListItem[]`
- `getProjectBySlugForLocale(slug, locale)` → `ProjectDetailView | undefined`

View model types live in `src/server/view-models/project.ts`. Components receive resolved strings and never see `Localized`. The detail type is named `ProjectDetailView`, not `ProjectDetail`, to avoid reading as the `ProjectDetail` i18n namespace.

`ProjectListItem` carries exactly what the ledger row renders: `slug, name, description, stack, status, year, latestVersion | null, releaseCount`. Repo and live links are detail-page only, so they are not in the list view model.

`ProjectDetailView` carries the full project plus `releases: ReleaseView[]`, each with `version, releasedAt, title | null, notes | null, changes: { type, text }[]`.

## API

Auth keeps the existing `CHANGELOG_API_TOKEN` env var and `src/lib/api-auth.ts` unchanged — renaming would mean touching the Coolify environment for no gain.

Route handlers stay thin: verify token → zod parse → delegate to a service → map known errors to status codes.

### `PUT /api/projects/[slug]`

Upsert a project by slug. Body: every field except `slug`. Returns `201` when created, `200` when updated (determined by looking the row up inside the transaction).

The body is a **full replacement**, not a patch: on update, an omitted optional field is written as `null` (or its default, for `sortOrder` and `stack`). This is what makes re-sending a corrected payload converge — a partial-patch reading would leave stale values behind with no way to clear them.

```jsonc
{
  "name": "Portfolio",
  "description": { "en": "This site.", "pt": "Este site." },
  "summary": { "en": "Long markdown…" },        // optional
  "stack": ["Next.js", "PostgreSQL", "Tailwind CSS"],
  "status": "active",
  "year": 2026,
  "sortOrder": 10,                               // optional, default 0
  "imageUrl": "https://…",                       // optional
  "repoUrl": "https://…",                        // optional
  "liveUrl": "https://…"                         // optional
}
```

### `PUT /api/projects/[slug]/releases/[version]`

Upsert a release on `(projectId, version)` in a single transaction, and **replace** its changes (delete all, insert the payload) so a corrected re-send converges instead of accumulating. `position` is assigned from array order. Returns `201` created / `200` updated.

```jsonc
{
  "releasedAt": "2026-08-10T12:00:00Z",          // optional, default now
  "title": { "en": "Theming release" },          // optional
  "notes": { "en": "Long markdown…" },           // optional
  "changes": [
    { "type": "added", "text": { "en": "Dark mode", "pt": "Modo escuro" } },
    { "type": "fixed", "text": { "en": "Upload crash" } }
  ],
  "project": { /* same body as PUT /api/projects/[slug] */ }  // optional
}
```

`changes` may be an empty array — a release carrying only a `title` and `notes` is valid. Everything else follows the same full-replacement rule as the project route.

`project` is optional and only used when the project does not exist yet, creating both in one request. Without it, an unknown slug is a `404` — auto-creating a project from a release payload alone would write a row with no name or description.

### Not included

- No public `GET` endpoints. Pages read through services directly; nobody asked for a read API.
- No `DELETE`. Removal happens in psql if it ever comes up.
- `POST /api/changelog` and `POST /api/projects` are removed, replaced by the two `PUT` routes above.

### Status codes

`401` missing or bad token · `400` zod failure or unparseable version · `404` unknown project slug (release upsert without `project`) · `200`/`201` success · `500` anything else.

## Screens

Both routes keep `export const dynamic = "force-dynamic"` — the Coolify build stage has no network access to Postgres.

Mobile-first throughout: base classes target mobile, `sm:`/`md:`/`lg:` scale up. Every component is checked at mobile, tablet, and desktop widths.

### `/projects` — the ledger

Page structure mirrors a home section: mono rail (`04` + `PROJETOS`), `h2` at `clamp(28px, 6.4vw, 54px)` with `-0.042em` tracking, lead paragraph, then the ledger.

```
04  PROJETOS

Coisas que eu construo
e mantenho no aberto.

──────────────────────────────────────────
2026 · ATIVO                    │  v1.4.0
Portfolio                       │  8 releases
Site pessoal com changelog
público alimentado por API.
△ Next.js   ⬡ PostgreSQL
──────────────────────────────────────────
```

Components:

- `src/components/projects/project-ledger.tsx` — the list
- `src/components/projects/project-ledger-row.tsx` — one row: `border-t`, `grid-cols-1` on mobile, `sm:grid-cols-[1fr_184px]` with version and release count in the right column, reusing the `RoleItem` measurements exactly (`py-6 sm:py-8`, `gap-x-10`)
- `src/components/projects/project-status-badge.tsx` — mono uppercase, `text-brand` when `active`, `text-muted-foreground` otherwise
- `src/components/projects/projects-empty.tsx` — the empty state, authored in the site grammar (mono label + a real sentence in the lead style), not a grey `<p>`

Rows are wrapped in `Reveal` with the same `(index % 4) * 70` stagger as the experience timeline. The whole row is a link to the detail page.

### `/projects/[slug]` — detail and release timeline

Header: back link, `name` as `h1`, `year · STATUS` in mono, description, stack glyphs, `ProjectLinks`, then `summary` rendered as markdown when present. Below it, the release timeline.

```
v1.4.0                          2026-08-10
Dark mode
  +  Modo escuro
  ✗  Crash no upload
  ~  Migrado pro Next 16
──────────────────────────────────────────
v1.3.0                          2026-07-02
```

Components:

- `src/components/releases/release-timeline.tsx` — the list, plus its own empty state
- `src/components/releases/release-item.tsx` — one release: version in mono `text-brand`, date right-aligned, optional title, changes, optional `notes` markdown
- `src/components/releases/release-change-list.tsx`
- `src/components/releases/change-type-glyph.tsx` — glyph and colour per change type
- Anchor `id` per release derived from the version (`v1.4.0` → `#v1-4-0`) for deep links, with `scroll-mt`
- `generateMetadata` producing title, description, and `og:image` from `imageUrl`

### Targeted cleanup

Two components are currently filed under a feature folder but become shared, and one folder goes away:

- `src/components/experience/stack-icon.tsx` → `src/components/stack-icon.tsx` (update the experience imports)
- `src/components/changelog/markdown-content.tsx` → `src/components/markdown-content.tsx`
- `src/components/changelog/` is deleted: `changelog-timeline.tsx` and `changelog-entry-item.tsx` are replaced by the release components
- `src/components/projects/project-card.tsx` and `project-list.tsx` are deleted, replaced by the ledger
- `ProjectLinks` is restyled to the mono grammar

Nothing outside this feature is refactored.

## i18n keys

Every key below is added to `messages/en.json`, `messages/pt.json`, and `messages/es.json` in the same change. No user-facing string is hardcoded in a component.

- `ProjectsPage`: `num`, `label`, `title`, `lead`, `empty.title`, `empty.body`, `status.active`, `status.wip`, `status.archived`, `releaseCount` (pluralised), `latestVersion`
- `ProjectDetail`: `back`, `startedIn`, `releasesHeading`, `releasesEmpty`, `repoLink`, `liveLink`
- `ReleaseChange`: `type.added`, `type.changed`, `type.fixed`, `type.removed`, `type.deprecated`, `type.security`
- `Nav.items`: gains a `Projects` / `Projetos` / `Proyectos` entry in third position, pushing `Contact` to fourth

## Navigation

The nav needs work before a `Projects` entry can be added. Today `src/components/site-header/desktop-nav.tsx` and `mobile-sheet.tsx` each hold their own copy of `const HREFS = ["#about", "#experience", "#contact"]` and each hardcodes `const disabled = index === 2`. Every entry is an in-page anchor rendered as a raw `<a>`. Three things break if a fourth label is appended: the duplicated arrays drift, the magic index dims the wrong item, and `/projects` needs a locale-aware route rather than an anchor.

Fix, scoped to what this feature requires:

- New `src/components/site-header/nav-items.ts` — one shared config array: `{ key, href, kind: 'anchor' | 'route', disabled?: true }`. Labels stay in `messages/*.json` and are matched to config entries by order, which is what both components already assume.
- Both nav components consume that config. `kind: 'route'` renders `Link` from `@/i18n/navigation` so the locale prefix is preserved; `kind: 'anchor'` keeps the plain `<a href="#…">`. `disabled` comes from the config instead of an index comparison, so `Contact` stays dimmed wherever it sits.
- The mono number stays `0{index + 1}`, so the order is About 01, Experience 02, Projects 03, Contact 04.

`Projects` ships enabled even though the page is empty at launch. Hiding it until content exists would make the header depend on a database query on every render.

## Testing

The repo has no test infrastructure. Vitest is added for pure logic only:

- `pick()` — locale hit, missing locale falling back to `en`, `en` always present
- `versionKey` derivation — padding, `1.10.0` sorting above `1.9.0`, rejection of non-numeric components
- The zod schemas — `localizedSchema` requiring `en`, status and change-type enums, version path validation

Database integration tests are out of scope: the Postgres instance is remote and the setup cost does not pay for itself yet. The API is verified with a curl checklist covering create, idempotent re-send, change replacement, unknown slug `404`, missing token `401`, and bad body `400`.

## Phase 2 hook (separate spec)

A GitHub webhook on `release`/`tag` events, translated by a thin adapter into `PUT /api/projects/[slug]/releases/[version]`. The idempotent upsert is precisely what makes that adapter trivial — it can replay and retry without duplicating. Nothing in phase 1 needs to change to accommodate it.
