# Quiet Timeline (Nodes + Rail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the release timeline as a quiet vertical timeline — a thin left rail with a brand node per release and a nested secondary rail + fainter node per patch — replacing the top-border separators.

**Architecture:** Pure Tailwind className changes across the three timeline components: the list container draws the rail (`before:` pseudo) and insets its children; each `ReleaseItem` article drops its top border and gets a brand node dot; the patch group swaps its top-border for an indented secondary rail with a faint node per patch. No TS/logic/behavior changes.

**Tech Stack:** Next.js 16 (RSC), TypeScript, Tailwind v4, tokens in `src/app/globals.css` (`--brand`, `--border`, `--muted-foreground`).

## Global Constraints

- **Presentation-only.** Only Tailwind `className` strings change. No changes to component props, logic, `groupReleases`, `version-bump`, `release-disclosure.tsx` behavior, `release-index.tsx`, `page.tsx`, view-models, services, schema, or i18n.
- **Behavior unchanged:** collapse (newest open / older headers), hash auto-expand, version index, tier styling, and the patch collapsible all keep working.
- **Theme-safe:** colors come from existing tokens (`bg-brand`, `bg-border`, `bg-muted-foreground`) so light and dark both work. No literal colors.
- **Mobile-first;** the rail/nodes must hold at mobile and desktop widths.
- **Commit authorship:** never add a `Co-Authored-By` trailer. Commits authored solely by the user.
- **Tests:** no new pure logic → no new unit tests (Vitest env `node`, no jsdom). Verify with `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- **Branch:** `feat/timeline-nodes` (already created off `main`; the design spec is committed on it).
- **Staging:** `git add` only the exact paths named; never `git add -A` (untracked `drizzle-migrate.sql` must not be committed).
- **Pixel note:** the rail/node offsets below are calibrated starting values (from mockup Variant D). Exact alignment (dot centered on the rail, node aligned to the version row) is confirmed by eye after rendering; small nudges are expected and are NOT defects.

---

### Task 1: apply the quiet-timeline styling (rail + nodes)

**Files:**
- Modify: `src/components/releases/release-timeline.tsx`
- Modify: `src/components/releases/release-item.tsx`
- Modify: `src/components/releases/release-patch-group.tsx`

**Interfaces:**
- Consumes/Produces: nothing new — className-only edits. All component signatures unchanged.

- [ ] **Step 1: Draw the rail on the timeline container**

In `src/components/releases/release-timeline.tsx`, change the list container's className. From:

```tsx
    <div className="mt-6 flex flex-col sm:mt-8">
```

to:

```tsx
    <div className="relative mt-6 flex flex-col pl-6 before:absolute before:top-4 before:bottom-4 before:left-2 before:w-px before:bg-border sm:mt-8">
```

(Leave the empty-state `<p>` branch and everything inside the map unchanged.)

- [ ] **Step 2: Give each release a brand node and drop its top border**

In `src/components/releases/release-item.tsx`, change the `Reveal` article's className. From:

```tsx
      className="scroll-mt-28 border-t border-border py-6 sm:py-8"
```

to:

```tsx
      className="relative scroll-mt-28 py-6 before:absolute before:left-[-20px] before:top-[26px] before:size-2 before:rounded-full before:bg-brand sm:py-8"
```

(Nothing else in the file changes — the header, disclosure, tier styling, and notes stay as-is.)

- [ ] **Step 3: Nest the patch group under a secondary rail with faint nodes**

In `src/components/releases/release-patch-group.tsx`, make two className changes.

(a) The outer wrapper `<div>`. From:

```tsx
    <div className="mt-4 border-t border-border/60 pt-4 pl-4">
```

to:

```tsx
    <div className="mt-5 ml-2 border-l border-border pl-5">
```

(b) Each patch `<li>`. From:

```tsx
            <li
              key={patch.id}
              id={versionAnchor(patch.version)}
              className="scroll-mt-28"
            >
```

to:

```tsx
            <li
              key={patch.id}
              id={versionAnchor(patch.version)}
              className="relative scroll-mt-28 before:absolute before:left-[-23px] before:top-[7px] before:size-1.5 before:rounded-full before:bg-muted-foreground"
            >
```

(The toggle button, the `<ul>`, the version/date row, and `ReleaseChangeList` stay unchanged.)

- [ ] **Step 4: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: typecheck clean; lint no errors (the 3 pre-existing `<img>` warnings in `device-frames/*` are unrelated and acceptable); build succeeds; `/[locale]/projects/[slug]` stays dynamic (`ƒ`).

- [ ] **Step 5: Commit**

```bash
git add src/components/releases/release-timeline.tsx src/components/releases/release-item.tsx src/components/releases/release-patch-group.tsx
git commit -m "feat: render release timeline as a quiet vertical timeline"
```

---

### Task 2: full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass, unchanged count (this feature adds no tests and touches no tested logic).

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: typecheck clean; lint no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; projects routes dynamic (`ƒ`).

- [ ] **Step 4: Visual check (human/controller — subagents can't see rendering)**

Start a dev server on a non-3000 port and open a project with several releases (major + minor + at least one patch):

Run: `npm run dev -- -p 3100`
Verify at mobile and desktop, light and dark: a thin rail runs down the release column; each release sits on a brand node aligned with its version row; the patch group is indented under its release on a secondary rail, each patch marked by a smaller faint node; no top-border separators remain; spacing reads with more breathing room between releases than within one. If a dot is off-center from its rail or misaligned from the version row, nudge the `before:left-*` / `before:top-*` values (Task 1, Steps 2–3) and rebuild — expected fine-tuning, not a defect.

---

## Self-Review

**Spec coverage:**
- Rail + brand node per release → Task 1 Steps 1–2. ✓
- Patches nested under a secondary rail with fainter nodes → Task 1 Step 3. ✓
- Top borders replaced by the rail → Task 1 Steps 1 (container) & 2 (article drops `border-t`). ✓
- Token-based colors (light/dark safe) → `bg-brand`, `bg-border`, `bg-muted-foreground`. ✓
- Behavior/data unchanged → only className strings edited; no other files. ✓
- Rhythm (breathing room) → rail replaces borders; `py-6/8` + `mt-5` spacing; visual tune in Task 2 Step 4. ✓

**Placeholder scan:** none — every step gives the exact before/after className. Pixel offsets are concrete values flagged for optional visual nudging, not placeholders.

**Type consistency:** no types or signatures touched — className-only edits. The three components' props are unchanged, so the timeline still passes `groups`, and `ReleaseItem`/`ReleasePatchGroup` still receive exactly what they do today.

## Merge note

This branch is based on current `main` and touches only the three timeline
component files. No overlap expected with other work.
