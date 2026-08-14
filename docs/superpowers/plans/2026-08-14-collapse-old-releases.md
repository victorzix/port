# Collapse Older Releases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the project detail timeline, keep only the newest release expanded and collapse every older major/minor to a clickable header, with the targeted release auto-expanding on hash navigation.

**Architecture:** A new client component `ReleaseDisclosure` owns the open/closed state and a chevron toggle, and auto-opens when the URL hash matches its anchor. `ReleaseItem` (server) composes an always-visible header (version + tier tag + date + title) and passes the change list + notes as the disclosure's collapsible children. `ReleaseTimeline` opens only the first group. No grouping/data/schema changes.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, next-intl v4, Vitest (node env).

## Global Constraints

- **i18n mandatory, 3 locales.** Every user-facing string via next-intl; every key added to `messages/en.json` must be added to `messages/pt.json` and `messages/es.json` in the same change.
- **Mobile-first** Tailwind; light/dark via existing tokens (`brand`/`muted-foreground`/`border`).
- **One component per file.**
- **Presentation-only.** No changes to `groupReleases`, `version-bump`, `page.tsx`, view-models, services, schema, or `ReleasePatchGroup`.
- **Commit authorship:** never add a `Co-Authored-By: Claude` (or any Claude/Anthropic) trailer. Commits are authored solely by the user.
- **Tests:** no new pure logic → no new unit tests (Vitest env is `node`, no jsdom). Verify components with `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- **Branch:** `feat/collapse-old-releases` (already created off `main`; the design spec is already committed on it).
- **Staging:** `git add` only the exact paths named per task; never `git add -A` (an untracked `drizzle-migrate.sql` at the repo root must not be committed).

---

### Task 1: i18n strings for the disclosure toggle

**Files:**
- Modify: `messages/en.json`, `messages/pt.json`, `messages/es.json`

**Interfaces:**
- Produces: `ProjectDetail.releaseExpand` and `ProjectDetail.releaseCollapse` in all three locales.

- [ ] **Step 1: Add the two keys — English**

In `messages/en.json`, the `ProjectDetail` object currently ends with `"galleryClose": "Close"`. Add a comma and the two keys:

```json
    "galleryClose": "Close",
    "releaseExpand": "Show changes",
    "releaseCollapse": "Hide changes"
```

- [ ] **Step 2: Add the two keys — Portuguese**

In `messages/pt.json`, `ProjectDetail` ends with `"galleryClose": "Fechar"`. Change to:

```json
    "galleryClose": "Fechar",
    "releaseExpand": "Mostrar mudanças",
    "releaseCollapse": "Ocultar mudanças"
```

- [ ] **Step 3: Add the two keys — Spanish**

In `messages/es.json`, `ProjectDetail` ends with `"galleryClose": "Cerrar"`. Change to:

```json
    "galleryClose": "Cerrar",
    "releaseExpand": "Mostrar cambios",
    "releaseCollapse": "Ocultar cambios"
```

- [ ] **Step 4: Verify all three parse**

Run: `node -e "['en','pt','es'].forEach(l=>{JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8'));console.log(l,'ok')})"`
Expected: `en ok` / `pt ok` / `es ok`.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/pt.json messages/es.json
git commit -m "feat: add release expand/collapse i18n strings"
```

---

### Task 2: `ReleaseDisclosure` client component

**Files:**
- Create: `src/components/releases/release-disclosure.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces: a client component
  `ReleaseDisclosure(props: { defaultOpen: boolean; anchorId: string; labels: { expand: string; collapse: string }; header: ReactNode; children: ReactNode })`.
  Renders the header row + a chevron toggle button, then the children only when open. Opens itself when `window.location.hash === "#" + anchorId` (on mount and on `hashchange`); never force-closes.

- [ ] **Step 1: Create the component**

```tsx
// src/components/releases/release-disclosure.tsx
"use client";

import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ReleaseDisclosureProps {
  /** Whether the body starts visible (the newest release does). */
  defaultOpen: boolean;
  /** This release's anchor id (e.g. "v2-0-0") — drives hash auto-expand. */
  anchorId: string;
  labels: { expand: string; collapse: string };
  /** Always-visible header (version link + tier tag + date + title). */
  header: ReactNode;
  /** Collapsible body (changes + notes). */
  children: ReactNode;
}

export function ReleaseDisclosure({
  defaultOpen,
  anchorId,
  labels,
  header,
  children,
}: ReleaseDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const openIfTargeted = () => {
      if (window.location.hash === `#${anchorId}`) setOpen(true);
    };
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, [anchorId]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-brand"
        >
          <span
            aria-hidden="true"
            className={cn(
              "inline-block font-mono text-[13px] leading-none transition-transform",
              open && "rotate-90",
            )}
          >
            ›
          </span>
          <span className="sr-only">{open ? labels.collapse : labels.expand}</span>
        </button>
      </div>
      {open && <div>{children}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (the 3 pre-existing `<img>` warnings in `device-frames/*` are unrelated and acceptable; there must be no new errors/warnings in this file).

- [ ] **Step 3: Commit**

```bash
git add src/components/releases/release-disclosure.tsx
git commit -m "feat: add ReleaseDisclosure collapsible with hash auto-expand"
```

---

### Task 3: wire the disclosure into ReleaseItem and open only the newest

**Files:**
- Modify: `src/components/releases/release-item.tsx`
- Modify: `src/components/releases/release-timeline.tsx`

**Interfaces:**
- Consumes: `ReleaseDisclosure` (Task 2); `ProjectDetail.releaseExpand`/`releaseCollapse` (Task 1).
- Produces: `ReleaseItem` gains a required `defaultOpen: boolean` prop; `ReleaseTimeline` passes `defaultOpen={index === 0}`.

- [ ] **Step 1: Replace `ReleaseItem` with the disclosure-wrapped version**

Replace the entire contents of `src/components/releases/release-item.tsx` with:

```tsx
import { useFormatter, useTranslations } from "next-intl";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { MarkdownContent } from "@/components/markdown-content";
import { Reveal } from "@/components/motion/reveal";
import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { ReleaseDisclosure } from "@/components/releases/release-disclosure";
import { ReleaseTierTag } from "@/components/releases/release-tier-tag";
import {
  TIER_TEXT_COLOR,
  TIER_VERSION_STYLE,
} from "@/components/releases/tier-styles";
import type { BumpTier } from "@/lib/version-bump";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleaseItemProps {
  release: ReleaseView;
  /** Bump tier of this release, driving its size, color, and tag. */
  tier: BumpTier;
  /** Whether this release starts expanded (the newest one does). */
  defaultOpen: boolean;
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function ReleaseItem({
  release,
  tier,
  defaultOpen,
  index = 0,
}: ReleaseItemProps) {
  const format = useFormatter();
  const t = useTranslations("ProjectDetail");
  const anchor = versionAnchor(release.version);

  const header = (
    <>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
        <div className="flex items-center gap-2">
          <a
            href={`#${anchor}`}
            className={cn(
              "font-mono tracking-[0.02em] transition-opacity hover:opacity-70",
              TIER_VERSION_STYLE[tier],
              TIER_TEXT_COLOR[tier],
            )}
          >
            v{release.version}
          </a>
          <ReleaseTierTag tier={tier} />
        </div>
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-muted-foreground">
          {format.dateTime(release.releasedAt, "long")}
        </span>
      </div>

      {release.title && (
        <h3 className="mt-2 text-lg leading-[1.15] font-semibold tracking-[-0.03em] text-balance text-foreground sm:text-xl">
          {release.title.text}
          {release.title.isFallback && (
            <LocalizedFallbackTag sourceLocale={release.title.sourceLocale} />
          )}
        </h3>
      )}
    </>
  );

  return (
    <Reveal
      as="article"
      id={anchor}
      delay={(index % 4) * 70}
      className="scroll-mt-28 border-t border-border py-6 sm:py-8"
    >
      <ReleaseDisclosure
        defaultOpen={defaultOpen}
        anchorId={anchor}
        labels={{ expand: t("releaseExpand"), collapse: t("releaseCollapse") }}
        header={header}
      >
        <ReleaseChangeList changes={release.changes} />
        {release.notes && (
          <div className="mt-4">
            <MarkdownContent content={release.notes.text} />
            {release.notes.isFallback && (
              <LocalizedFallbackTag sourceLocale={release.notes.sourceLocale} />
            )}
          </div>
        )}
      </ReleaseDisclosure>
    </Reveal>
  );
}
```

- [ ] **Step 2: Pass `defaultOpen` from `ReleaseTimeline`**

In `src/components/releases/release-timeline.tsx`, change the `ReleaseItem` line inside the map from:

```tsx
          <ReleaseItem release={group.anchor} tier={group.tier} index={index} />
```

to:

```tsx
          <ReleaseItem
            release={group.anchor}
            tier={group.tier}
            index={index}
            defaultOpen={index === 0}
          />
```

(Leave the rest of the file — the empty-state branch, the `key`, the `ReleasePatchGroup` sibling — unchanged.)

- [ ] **Step 3: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: typecheck clean; lint no errors; build succeeds; `/[locale]/projects/[slug]` stays dynamic (`ƒ`).

- [ ] **Step 4: Commit**

```bash
git add src/components/releases/release-item.tsx src/components/releases/release-timeline.tsx
git commit -m "feat: collapse older releases, keep the newest expanded"
```

---

### Task 4: full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass (unchanged count — this feature adds no tests and touches no tested pure logic).

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: typecheck clean; lint reports no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; projects routes dynamic (`ƒ`).

- [ ] **Step 4: Manual visual check (recommended)**

Start a dev server on a non-3000 port and open a project with several releases:

Run: `npm run dev -- -p 3100`
Verify at mobile and desktop: only the newest release shows its changes; older majors/minors show just their header (version + tier tag + date + title) with a chevron that expands/collapses; patches still collapse under their minor; clicking a version in the index scrolls to that release AND expands it (hash auto-expand); light and dark both read correctly.

---

## Self-Review

**Spec coverage:**
- Newest open, older collapsed to header → Task 3 (`defaultOpen={index === 0}`) + Task 2 (disclosure). ✓
- Title visible in collapsed header → Task 3 (`header` includes the `<h3>`). ✓
- Hash auto-expand → Task 2 (`useEffect` on mount + `hashchange`). ✓
- i18n en/pt/es for expand/collapse → Task 1. ✓
- Patches unchanged (independent sibling) → `ReleaseTimeline` still renders `ReleasePatchGroup`; not modified. ✓
- No grouping/data/schema change → only the three files + messages touched. ✓

**Placeholder scan:** none — every step carries real code or an exact command.

**Type consistency:** `ReleaseDisclosure` props (`defaultOpen`, `anchorId`, `labels.{expand,collapse}`, `header`, `children`) defined in Task 2 are used identically in Task 3. `ReleaseItem` gains required `defaultOpen: boolean` (Task 3, Step 1) and its only caller passes it (Task 3, Step 2). Label keys `releaseExpand`/`releaseCollapse` match between Task 1 (messages) and Task 3 (`t("releaseExpand")`/`t("releaseCollapse")`).

## Merge note

This branch is based on current `main` and touches only `release-item.tsx`,
`release-timeline.tsx`, and the `ProjectDetail` block of the three message
files. No overlap is expected with other outstanding branches.
