# Resume state — Projects & Releases

**Purpose:** this file exists because the SDD execution ledger lives in `.superpowers/sdd/`, which is git-ignored and therefore does not travel between machines. This is the durable replacement. Read it before resuming.

**Plan:** `docs/superpowers/plans/2026-08-11-projects-releases.md`
**Spec:** `docs/superpowers/specs/2026-08-11-projects-releases-design.md`
**Branch:** `feat/projects-releases`, branched from `main` at `3ca9dac`, pushed to `origin`
**Last updated:** 2026-08-11, after the final whole-branch review and its fix wave

## Where this stands

**All 11 code tasks are complete, individually reviewed, and the whole branch has passed a final review plus one fix wave.** `main` is untouched.

**Only Task 12 remains, and it needs a human.** It applies the migration through an SSH tunnel and verifies the API against a real database. Nothing before it has touched any database.

Current state of the branch:

- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `npm test` — 41 passing across 5 files
- Message key parity exact across `en` / `pt` / `es`
- No `Co-Authored-By` or Claude/Anthropic trailer in any of the 21 commits, single author

## How to resume

1. `git fetch && git switch feat/projects-releases`
2. `npm install` — the branch added `vitest` as a devDependency
3. `npm test` — expect **41 passing**. A different number means something is out of sync; trust `git log` over this file.
4. Regenerate the Task 12 brief, which is git-ignored:
   `bash ~/.claude/skills/subagent-driven-development/scripts/task-brief docs/superpowers/plans/2026-08-11-projects-releases.md 12`
5. Execute Task 12 (see below).

## Task status

| Task | Status | Commits |
| --- | --- | --- |
| 1 · vitest harness, `localized.ts`, `project-enums.ts` | complete, review clean | `9b8b5cf..040b780` |
| 2 · `version-key.ts` | complete, review clean | `040b780..8da994f` |
| 3 · `project-ordering.ts` | complete, clean after 1 fix round | `8da994f..def3f19` |
| 4 · schema + initial migration | complete, review clean | `05c6b48..c0d87bb` |
| 5 · zod validation schemas | complete, review clean | `c0d87bb..3fd34ca` |
| 6 · services (view models + upserts) | complete — degraded gate, re-examined and cleared by the final review | `41dce6c..67bca94` |
| 7 · API routes (two PUTs) | complete, review clean | `67bca94..2e3b6de` |
| 8 · message keys ×3 locales | complete, review clean | `2e3b6de..d317c51` |
| 9 · `StackList` + nav config | complete — degraded gate, and the final review found a real defect here (see below) | `d317c51..70080ac` |
| 10 · projects ledger screen | complete, clean after 1 fix round | `70080ac..71faf2b` |
| 11 · project detail + release timeline | complete, review clean | `71faf2b..b630b96` |
| final review fix wave | complete, re-reviewed clean | `f90f511..fbe6a65` |
| 12 · database reconcile + end-to-end verify | **done against a local Postgres. Production migration deliberately deferred** — see below | — |

## Task 12 as actually executed — local, not production

The owner chose to verify against a **local Postgres 18** rather than tunnelling into Coolify, and to migrate production separately at deploy time. That is a smaller, cleaner path and it exercised everything the checklist covers.

What was done and confirmed on 2026-08-12:

- Local database `portf-local` created (it did not exist yet), migration applied cleanly. The database was empty, so this was Case A — nothing to reconcile.
- Schema verified against the spec: three tables, the four index names exactly as specified, both foreign keys `ON DELETE CASCADE`, `projects.stack` as `text[] NOT NULL DEFAULT '{}'`, no `changelog_entries`.
- **API checklist: 14 of 14 passed** — 401 without a token and with a wrong token, 400 for malformed JSON / incomplete body / bad slug / bad version, 201 create, 200 idempotent re-send, 404 for an unknown project without an inline `project`, and 201 for inline project creation.
- **Database-level verification of what status codes cannot prove:** re-sending release `1.4.0` with one change left exactly one row, not three — the replacement converges. `versionKey` ordering puts `1.10.0` above `1.9.0`. Localized content stored as `{"en":…,"pt":…}` with `es` absent, so the fallback path is real.
- **Both screens verified with real data**, which is where two fix-wave fixes proved out end to end: release dates render as `12 de agosto de 2026` rather than a raw `Date.toString()`, and the header's hrefs resolve to `/#about` from `/projects/portfolio` and to `/es#about` from `/es/projects/portfolio` — so the nav genuinely works off the home page in every locale. On the `/es` page, labels are Spanish while a change whose payload carried only `en` renders its English text: the fallback behaving as designed.
- Smoke-test rows deleted; cascades removed their releases and changes; `/projects` renders its empty state again.

### Two corrections made to `.env` along the way

- `?schema=public` was removed from `DATABASE_URL`. It is a Prisma convention; `postgres-js` forwards it as a session parameter and Postgres rejects it with `FATAL: unrecognized configuration parameter "schema"`. It would have broken the app, not just tooling. **Do not put it back, and do not include it in the production URL.**
- `CHANGELOG_API_TOKEN` was empty; a 64-hex-character local token was generated. Production needs its own separate value.

### What production still needs

1. **Set the app service's env vars in Coolify:** `DATABASE_URL` using the **internal** Docker URL (`postgres://postgres:…@dkj7jjl60gnb18jzuythkthl:5432/postgres`, no `?schema=public`) and `CHANGELOG_API_TOKEN`. Without `DATABASE_URL`, `src/db/index.ts` throws at module load and `/projects` returns 500.
2. **Apply the migration to the production database.** The `CLAUDE.md` rule stands: never inside the Docker image, never at container boot. Either tunnel and run `npm run db:migrate` with the tunnelled URL, or run it from anywhere with network access to that Postgres.
3. **Decide the merge order.** This branch adds `Projetos` to the primary nav in all three locales, so merging before production has a database means a visible link to a page that 500s. Either configure the database first, or ship with `disabled: true` on the projects entry in `src/components/site-header/nav-items.ts` and flip it when the database is up.
4. **Fill in the production domain** in `CHANGELOG-API.md` where `PORTFOLIO_API_URL` is described, drop its "Not live yet" banner, and correct its field table — it marks `changes` as required when the schema defaults it to `[]`.

## Task 12's original procedure, for the production run

This is the only task that touches production. Its brief has the full procedure; the shape of it:

1. **Open an SSH tunnel** to the Coolify host: `ssh -L 5433:<postgres-internal-host>:5432 <user>@<coolify-host>`. Leave it open in its own terminal.
2. **Inspect the remote database before writing anything.** `src/db/migrations/` did not exist before this branch, so there is no Drizzle journal — whatever tables exist were created by some other means. The task lists the tables and row counts first.
3. **Branch on what it finds.** Clean database → apply. Pre-existing `projects` / `changelog_entries` with **zero rows** → drop them, then apply, because the generated `0000` baseline issues `CREATE TABLE` and would collide. **Either table holding rows → STOP and ask**, because the spec's "these tables are empty" assumption would be proven false.
4. **Apply the migration:** `DATABASE_URL="postgres://…@localhost:5433/<db>" npm run db:migrate`.
5. **Smoke-test the API** with an 11-command curl checklist covering 401, 400 (bad body), 201 create, 200 idempotent re-send, 404 unknown slug, 400 bad version, change-list replacement, semver ordering, and inline project creation.
6. **Verify both screens against real data** at three widths in both themes — the first time they are seen without a stub.
7. **Delete the smoke-test rows** so the site launches with the real empty state.
8. **Fill in the production domain** in `CHANGELOG-API.md`, where `PORTFOLIO_API_URL` is described.

You do not need to paste credentials into a chat. Put the tunnelled `DATABASE_URL` in `.env` (git-ignored) and the migration command can read it from there.

## Work added after the final review, at the owner's request

**Self-publishing content** (`4c64ed0`). The portfolio publishes its own release history from files in the repo, so the text is versioned and reviewed like any other change:

```
content/project.json        the project record, all three locales
content/releases/0.2.0.json this branch's release
scripts/publish-releases.mjs
npm run release:publish     (--dry-run prints without sending)
```

The script uses Node's native `fetch`, so it adds no dependency and could run inside the container. Verified against the local database: first run `201/201`, subsequent runs `200/200` — idempotent, so it is safe to run on every deploy or by hand to correct a typo.

**How to wire it to deploys.** Releases are rows in Postgres, so they survive redeploys — you only need to publish when there is a new version. Two options:

- **Coolify post-deployment command** running `npm run release:publish`. This only works if that hook executes *inside the container*, which the current Dockerfile is not set up for — the runner stage copies only `public`, `.next/standalone` and `.next/static`, so neither the script nor `content/` is present. Two `COPY` lines would fix that, and from inside the container the script can target `http://127.0.0.1:3000`, needing no public domain and no duplicated secret. **Confirm where that hook runs before relying on it.**
- **GitHub Actions** on `release: published`, where the repo is genuinely checked out. Needs the public domain and two secrets.

**Do not put migrations in the Dockerfile.** This was considered and rejected: the build stage has no network access to Postgres, `drizzle-kit` is a devDependency absent from the runner image along with `src/db/migrations/`, and boot-time migration means replicas racing each other and a failed migration keeping the site down. `db:generate` there is worse still — it emits SQL that must be committed and reviewed, not produced in an ephemeral filesystem.

**Untranslated content is now marked** (`2028427`, `4945697`). `pick()` became `resolve()`, returning `{ text, sourceLocale, isFallback }`, and the view models carry that provenance. Where a field falls back to `en`, a small mono tag names the language, with a screen-reader-only expansion so the meaning survives on touch devices and in assistive technology. The English text is still shown — it carries the information, which "not available" would destroy.

Note the tension this creates with `CHANGELOG-API.md`, which tells other projects that writing only `en` is fine. That advice still holds: the reader gets the information plus an honest signal about its language.

## Decisions made during execution — do not re-litigate

1. **`StackList` extracted** (pre-flight ruling). The plan had Tasks 10 and 11 each writing the stack-glyph markup inline, duplicating a block already in `role-item.tsx`. Ruled: extract `src/components/stack-list.tsx`, copying the markup verbatim so the experience timeline stays pixel-identical, and have all three consumers use it.
2. **Task 3's null-release test data** (fix-round ruling). The plan's test used names `"A"` / `"B"`, so alphabetical ordering produced the same result as the rule under test — it would have passed with the null-sinking rule broken. Now `"Zebra"` / `"Alpha"`, and the implementer proved it discriminates by removing the release-date comparison, watching the test fail, and restoring.
3. **The empty state carries a mono eyebrow** (Task 10 fix-round ruling). `projects-empty.tsx` originally had no `font-mono` element at all, unlike every populated row. Added `ProjectsPage.empty.meta` — `Soon` / `Em breve` / `Pronto`.
4. **`timeZone: "America/Sao_Paulo"`** (final-review ruling). Release dates read as the date the owner published, in their own zone, rather than UTC.

## What the final whole-branch review found

Verdict was **needs fixes before merge**: zero Critical, three Important, and all 13 deferred minors triaged as fine to leave. All three Important findings are now fixed in `fbe6a65` and re-reviewed clean.

Two of the three were defects in this project's own spec and plan, which the code implemented faithfully:

1. **The header was a navigational dead end on the new pages.** `#about`, `#experience` and the brand mark's `#top` are home-page section ids, and this branch is the first thing to render `SiteHeader` off the home page — so from `/projects` every header link was dead with no route back home, and on mobile the sheet closed on tap and looked broken. The spec enumerated the three things that break when a fourth nav label is appended and never considered that the existing three break when the nav starts appearing elsewhere. Fixed by routing anchor entries and the brand mark through the locale-aware `Link` with root-relative hrefs; the home page's smooth scroll was verified unaffected.
2. **Every release date rendered as a raw `Date.toString()`.** The plan prescribed `format.dateTime(x, "long")` but never defined a `formats` block, and next-intl ships no default named formats. It only shipped green because `/projects` launches empty. Fixed in `src/i18n/request.ts`. There is exactly one named-format usage in the codebase, so the fix is complete in scope.
3. **A malformed JSON body returned 500 instead of 400**, contradicting `CHANGELOG-API.md` — which tells calling agents that 500 is retryable, so an agent would have retried forever on a payload that could never succeed. Fixed with a try/catch around `request.json()` in both routes, with the auth check still running first.

On the two degraded gates: **Task 6 held up** under independent re-examination — atomicity, the `created` flag under a race, and the query shapes are all sound. **Task 9 was where the miss happened**, but the finding is invisible from inside its own files: seeing it requires knowing that `SiteHeader` now renders off-home, which Tasks 10 and 11 only established afterwards. That is a task-decomposition blind spot as much as a model-capability one.

## Deferred minor findings — all triaged as fine to leave

Kept for the record. None block merge; the final review gave each an individual verdict.

- Ledger ordering uses the date of the **highest version** rather than the most recent release date (`project-service.ts:29`). Diverges only on a backport, and only between projects sharing `sortOrder` and `status`.
- Concurrent first-write to the same slug can yield a spurious retryable 500 (read-then-write at READ COMMITTED). Never corruption, and `CHANGELOG-API.md` already tells callers 500 is safe to retry.
- Omitting `releasedAt` on an update re-stamps the release to `now()` — the one field where full replacement is not convergent. Worth a line in `CHANGELOG-API.md`.
- `z.url()` accepts `javascript:` and `data:` URLs. Exploitable only by the bearer-token holder, so hardening rather than a hole. `z.url({ protocol: /^https?$/ })` would close it.
- `z.iso.datetime()` rejects offset timestamps (`…-03:00`) and date-only strings, both valid ISO 8601. GitHub always sends `Z`, so phase 2 is safe.
- `ProjectsPage.latestVersion` is defined in all three locales but unread — either drop it or spend it as an `sr-only` label, since the version currently reaches a screen reader as a bare "v1.4.0".
- Duplicate `stack` entries would produce a React duplicate-key warning; best fixed in the schema with a dedupe transform.
- Nav labels are matched to `NAV_ITEMS` by index with no length guard.
- The detail query is unbounded — fine at tens of releases.
- The detail page calls `getProjectBySlugForLocale` twice per request (`generateMetadata` plus the component); Drizzle is not `fetch`-based so Next does not memoize it. React `cache()` is a three-line fix if wanted.
- `CHANGELOG-API.md` still carries its "Not live yet" banner and marks `changes` as required when the schema defaults it to `[]`. Both should be corrected in Task 12's final step.
- Several JSDoc gaps on self-explanatory exports, and two cosmetic Tailwind divergences from `role-item.tsx` (the release-count label's tracking and case; the dot separator).

## The database has still not been touched

`src/db/migrations/0000_mute_shatterstar.sql` was generated but **never applied anywhere**. Do not run `npm run db:migrate` outside Task 12's procedure.
