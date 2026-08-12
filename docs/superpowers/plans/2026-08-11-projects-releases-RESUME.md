# Resume state — Projects & Releases

**Purpose:** this file exists because the SDD execution ledger lives in `.superpowers/sdd/`, which is git-ignored and therefore does not travel between machines. This is the durable replacement. Read it before resuming.

**Plan:** `docs/superpowers/plans/2026-08-11-projects-releases.md`
**Spec:** `docs/superpowers/specs/2026-08-11-projects-releases-design.md`
**Branch:** `feat/projects-releases` (branched from `main` at `3ca9dac`)
**Last updated:** 2026-08-11, after Task 5 completed and passed review

## How to resume

1. `git switch feat/projects-releases` and confirm `git log --oneline` matches the completed-task SHAs below.
2. `npm install` (the branch added `vitest` as a devDependency).
3. `npm test` — expect **41 passing** across 5 files. If that number differs, something is out of sync; trust `git log` over this file.
4. `npx tsc --noEmit` is **expected to be dirty** at this point. See "Known broken state" below.
5. Regenerate the task briefs (they are also git-ignored): for each remaining task N, run
   `bash ~/.claude/skills/subagent-driven-development/scripts/task-brief docs/superpowers/plans/2026-08-11-projects-releases.md N`
6. Resume at **Task 6**, or at Task 5's review if the table below still shows it unverified.

## Task status

| Task | Status | Commits |
| --- | --- | --- |
| 1 · vitest harness, `localized.ts`, `project-enums.ts` | complete, review clean | `9b8b5cf..040b780` |
| 2 · `version-key.ts` | complete, review clean | `040b780..8da994f` |
| 3 · `project-ordering.ts` | complete, review clean after 1 fix round | `8da994f..def3f19` |
| 4 · schema + initial migration | complete, review clean | `05c6b48..c0d87bb` |
| 5 · zod validation schemas | complete, review clean | `c0d87bb..3fd34ca` |
| 6 · services (view models + upserts) | complete, review clean — but see "Degraded review gate" below | `41dce6c..67bca94` |
| 7 · API routes (two PUTs) | complete, review clean | `67bca94..2e3b6de` |
| 8 · message keys ×3 locales | complete, review clean | `2e3b6de..d317c51` |
| 9 · `StackList` + nav config | complete, review clean — haiku gate, see below | `d317c51..70080ac` |
| 10 · projects ledger screen | complete, review clean after 1 fix round | `70080ac..71faf2b` |
| 11 · project detail + release timeline | complete, review clean | `71faf2b..b630b96` |
| 12 · database reconcile + end-to-end verify | not started, **needs the human** | — |

Two plan-maintenance commits also exist on the branch: `05c6b48` (aligns the plan's Task 3 test data with the ruling below) and one before it fixing stale `StackIcon` references.

## Decisions made during execution — do not re-litigate

1. **`StackList` extracted (pre-flight ruling).** The plan originally had Tasks 10 and 11 each write the stack-glyph markup inline, duplicating a block that already existed in `role-item.tsx`. Ruled: extract `src/components/stack-list.tsx` in Task 9, copying the markup verbatim from `role-item.tsx` so the experience timeline stays pixel-identical, and have all three consumers use it. The plan has been amended accordingly.

2. **Task 3's null-release test data (fix-round ruling).** The plan's test used names `"A"` / `"B"`, so alphabetical ordering produced the same result as the rule under test — it would have passed even with the null-sinking rule broken. Ruled: fix. Now uses `released = "Zebra"` / `unreleased = "Alpha"`, and the implementer proved it discriminates by removing the release-date comparison, watching the test fail, and restoring. The plan text was amended to match.

## Degraded review gate — Task 6 needs a second look

The Anthropic API was returning sustained 529 overload errors while Task 6 ran. Four dispatches died: two implementer attempts and two reviewer attempts, all on the stronger model. Both roles ultimately ran on a lighter model instead. That was a capacity decision, not a judgement that the task was simple.

Task 6 is the largest and most consequential task in the plan — the transaction boundaries and the `?? null` full-replacement semantics live there. **The final whole-branch review must re-examine `src/server/services/project-service.ts`, `src/server/services/release-service.ts` and `src/server/view-models/project.ts` from scratch rather than trusting the task gate.**

What was independently verified despite the degradation, by two separate paths (the reviewer's line-by-line enumeration and a mechanical grep by the controller), both agreeing:

- Exactly one `db.` call exists in `release-service.ts` — the `db.transaction(...)` opener. All seven database calls inside the callback use the `tx` handle, so atomicity holds.
- Six `?? null` in each service, which is the expected count.
- Six `pick(...)` calls in `project-service.ts` — every JSONB content field is resolved before leaving the service.
- `position` is assigned from the payload array index.
- Releases order by `versionKey` descending; changes by `position` ascending; the relation is queried as `changes`.

The reviewer reported zero findings at any severity. Treat that as encouraging but not conclusive.

## Known broken state (expected, not a bug)

`npx tsc --noEmit` currently reports ~13 errors. Every one is in a file that a later task rewrites or deletes. Do not fix them ad hoc — that would collide with the task that owns them:

| File | Owner |
| --- | --- |
| `src/server/services/changelog-service.ts` | Task 6 deletes |
| `src/server/services/project-service.ts` | Task 6 rewrites |
| `src/app/api/changelog/route.ts` | Task 7 deletes |
| `src/app/api/projects/route.ts` | Task 7 deletes |
| `src/components/projects/project-card.tsx`, `project-list.tsx` | Task 10 deletes |
| `src/app/[locale]/projects/[slug]/page.tsx` | Task 11 rewrites |
| `src/components/changelog/*` | Task 11 deletes |

## Deferred minor findings

Carried forward for the final whole-branch review to triage. None block progress.

- Task 1: `PROJECT_STATUSES` lacks JSDoc while `CHANGE_TYPES` has one — `src/lib/project-enums.ts:1`
- Task 2: `isValidVersion` and `InvalidVersionError` lack JSDoc while siblings have it — `src/lib/version-key.ts:4,13`
- Task 2: `versionAnchor` is untested against malformed input. In practice its input comes from database rows already validated by `toVersionKey` at write time, so the path is unreachable through the API.
- Task 4: no JSDoc on `projects.status` or `release_changes.type`, unlike sibling columns.
- Task 5: two tests assert only `.success === true` without checking the parsed value (`versionParamSchema` "accepts dot-separated integers", `projectSlugSchema` "accepts kebab-case"). Each is paired with strong negative cases in the same block.
- Task 5: long single-line `.refine(...)` at `src/lib/validations/release.ts:236` — stylistic, lint is clean.
- Plan bookkeeping: the plan's Task 5 text predicts "34 tests across four files"; the real total is 41 across five (7 + 11 + 5 + 8 + 10). Arithmetic slip in the plan, harmless.

## The database has not been touched

This is the most important thing to know. `src/db/migrations/0000_mute_shatterstar.sql` was **generated but never applied to any database**. Nothing in Tasks 1–11 runs a migration, by design.

Task 12 is the only task that touches production, and it needs values only the human has: the Coolify host, the Postgres internal host, and credentials for the SSH tunnel. It also begins by *inspecting* the remote database rather than assuming: if the pre-existing `projects` or `changelog_entries` tables contain rows, the plan says stop and ask rather than dropping anything, because the spec's "these tables are empty" assumption would have been proven false.

Do not run `npm run db:migrate` outside Task 12's procedure.
