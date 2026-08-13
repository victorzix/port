# Release Bump-Tier Differentiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Differentiate releases on the project-detail timeline by their version bump (major/minor/patch/initial), collapse patches under their parent minor, and add a clickable version index — all derived from the version numbers, presentation-only.

**Architecture:** Two pure helpers (`bumpTier`, `groupReleases`) turn the flat, desc-sorted `ReleaseView[]` into tiered groups with patches nested under their minor anchor. The detail page computes the groups once and feeds both a new inline `ReleaseIndex` (table of contents) and the refactored `ReleaseTimeline`, which renders each anchor with tier styling plus a collapsible patch list.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, next-intl v4, Vitest (node env).

## Global Constraints

- **i18n mandatory, 3 locales.** Every user-facing string goes through next-intl; every key added to `messages/en.json` must be added to `messages/pt.json` and `messages/es.json` in the same change.
- **Tier labels stay English** (`Major`/`Minor`/`Patch`/`Initial`) across all three locales, but routed through i18n.
- **Mobile-first.** Base classes target mobile; scale up with `sm:`.
- **One component per file, one hook per file.**
- **No DB/API/schema/migration changes. No new change types.** Presentation + pure helpers + i18n + tests only.
- **Commit authorship:** never add a `Co-Authored-By: Claude` (or any Claude/Anthropic) trailer. Commits are authored solely by the user.
- **Tests:** pure logic (`src/lib/**`) gets Vitest unit tests. Components have **no** unit tests (the Vitest env is `node`, no jsdom) — verify them with `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
- **Branch:** `feat/release-tiers` (already created off `main`; the design spec is already committed on it).

---

### Task 1: `bumpTier` pure helper

**Files:**
- Create: `src/lib/version-bump.ts`
- Test: `src/lib/version-bump.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type BumpTier = "major" | "minor" | "patch" | "initial"` and `bumpTier(version: string, previousVersion: string | null): BumpTier`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/version-bump.test.ts
import { describe, expect, it } from "vitest";

import { bumpTier } from "@/lib/version-bump";

describe("bumpTier", () => {
  it("returns initial when there is no previous version", () => {
    expect(bumpTier("1.0.0", null)).toBe("initial");
  });

  it("detects a major bump", () => {
    expect(bumpTier("2.0.0", "1.4.0")).toBe("major");
  });

  it("detects a minor bump", () => {
    expect(bumpTier("1.4.0", "1.3.5")).toBe("minor");
  });

  it("detects a patch bump", () => {
    expect(bumpTier("1.4.1", "1.4.0")).toBe("patch");
  });

  it("treats a first-position change in a two-part version as major", () => {
    expect(bumpTier("2", "1.9")).toBe("major");
  });

  it("treats a third-position change as patch when lengths differ", () => {
    expect(bumpTier("1.2.1", "1.2")).toBe("patch");
  });

  it("compares components numerically, not lexically", () => {
    expect(bumpTier("1.10.0", "1.9.0")).toBe("minor");
  });

  it("is positional for 0.x versions (no special pre-1.0 rule)", () => {
    expect(bumpTier("0.2.0", "0.1.0")).toBe("minor");
    expect(bumpTier("0.0.2", "0.0.1")).toBe("patch");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/version-bump.test.ts`
Expected: FAIL — cannot find module `@/lib/version-bump`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/version-bump.ts
export type BumpTier = "major" | "minor" | "patch" | "initial";

/**
 * Classifies a release by which version component changed vs. the previous
 * release. Purely positional — index 0 is major, index 1 minor, index >= 2
 * patch. No previous version means the first-ever release ("initial").
 */
export function bumpTier(
  version: string,
  previousVersion: string | null,
): BumpTier {
  if (previousVersion === null) return "initial";

  const current = version.split(".").map(Number);
  const previous = previousVersion.split(".").map(Number);
  const length = Math.max(current.length, previous.length);

  for (let index = 0; index < length; index += 1) {
    const a = current[index] ?? 0;
    const b = previous[index] ?? 0;
    if (a !== b) {
      if (index === 0) return "major";
      if (index === 1) return "minor";
      return "patch";
    }
  }

  return "patch";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/version-bump.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/version-bump.ts src/lib/version-bump.test.ts
git commit -m "feat: add bumpTier helper for release tier derivation"
```

---

### Task 2: `groupReleases` pure helper

**Files:**
- Create: `src/lib/release-grouping.ts`
- Test: `src/lib/release-grouping.test.ts`

**Interfaces:**
- Consumes: `bumpTier`, `BumpTier` (Task 1); `toVersionKey` from `@/lib/version-key`; `ReleaseView` from `@/server/view-models/project`.
- Produces: `interface ReleaseGroup { anchor: ReleaseView; tier: BumpTier; patches: ReleaseView[] }` and `groupReleases(releases: ReleaseView[]): ReleaseGroup[]`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/release-grouping.test.ts
import { describe, expect, it } from "vitest";

import { groupReleases } from "@/lib/release-grouping";
import type { ReleaseView } from "@/server/view-models/project";

function release(version: string): ReleaseView {
  return {
    id: version,
    version,
    releasedAt: new Date("2026-01-01T00:00:00Z"),
    title: null,
    notes: null,
    changes: [],
  };
}

const versions = (list: ReleaseView[]) => list.map((r) => r.version);

describe("groupReleases", () => {
  it("nests patches under their minor anchor", () => {
    const groups = groupReleases([
      release("1.4.2"),
      release("1.4.1"),
      release("1.4.0"),
      release("1.3.0"),
    ]);
    expect(groups[0].anchor.version).toBe("1.4.0");
    expect(versions(groups[0].patches)).toEqual(["1.4.2", "1.4.1"]);
    expect(groups[0].tier).toBe("minor");
    expect(groups[1].anchor.version).toBe("1.3.0");
    expect(groups[1].patches).toEqual([]);
  });

  it("marks the oldest release as initial", () => {
    const groups = groupReleases([release("1.0.0")]);
    expect(groups[0].tier).toBe("initial");
    expect(groups[0].patches).toEqual([]);
  });

  it("marks a top-level major bump", () => {
    const groups = groupReleases([release("2.0.0"), release("1.4.0")]);
    expect(groups[0].anchor.version).toBe("2.0.0");
    expect(groups[0].tier).toBe("major");
  });

  it("uses the oldest release as anchor when there is no x.y.0", () => {
    const groups = groupReleases([release("1.4.2"), release("1.4.1")]);
    expect(groups[0].anchor.version).toBe("1.4.1");
    expect(versions(groups[0].patches)).toEqual(["1.4.2"]);
  });

  it("orders groups by anchor version regardless of input order", () => {
    const groups = groupReleases([
      release("1.3.0"),
      release("2.0.0"),
      release("1.4.0"),
    ]);
    expect(groups.map((g) => g.anchor.version)).toEqual([
      "2.0.0",
      "1.4.0",
      "1.3.0",
    ]);
  });

  it("keeps multi-digit minors in separate groups, ordered numerically", () => {
    const groups = groupReleases([release("1.10.0"), release("1.9.0")]);
    expect(groups.map((g) => g.anchor.version)).toEqual(["1.10.0", "1.9.0"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/release-grouping.test.ts`
Expected: FAIL — cannot find module `@/lib/release-grouping`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/release-grouping.ts
import { type BumpTier, bumpTier } from "@/lib/version-bump";
import { toVersionKey } from "@/lib/version-key";
import type { ReleaseView } from "@/server/view-models/project";

export interface ReleaseGroup {
  /** The release shown on the main timeline line. */
  anchor: ReleaseView;
  /** Tier of the anchor vs. the release immediately older than it. */
  tier: BumpTier;
  /** Patch releases nested under the anchor, newest first. */
  patches: ReleaseView[];
}

/** Newest-first by version, independent of input order. */
function byVersionDesc(a: ReleaseView, b: ReleaseView): number {
  return toVersionKey(a.version) < toVersionKey(b.version) ? 1 : -1;
}

/** "1.4.2" -> "1.4"; a missing component counts as 0 ("2" -> "2.0"). */
function lineKey(version: string): string {
  const [major = "0", minor = "0"] = version.split(".");
  return `${major}.${minor}`;
}

function patchComponent(version: string): number {
  return Number(version.split(".")[2] ?? "0");
}

export function groupReleases(releases: ReleaseView[]): ReleaseGroup[] {
  const sorted = [...releases].sort(byVersionDesc);

  // Each release's predecessor (next older overall) decides its tier.
  const predecessor = new Map<string, string | null>();
  sorted.forEach((rel, index) => {
    predecessor.set(rel.version, sorted[index + 1]?.version ?? null);
  });

  // Bucket by minor line, preserving the desc order.
  const buckets = new Map<string, ReleaseView[]>();
  for (const rel of sorted) {
    const key = lineKey(rel.version);
    const bucket = buckets.get(key) ?? [];
    bucket.push(rel);
    buckets.set(key, bucket);
  }

  const groups: ReleaseGroup[] = [];
  for (const bucket of buckets.values()) {
    const anchor =
      bucket.find((rel) => patchComponent(rel.version) === 0) ??
      bucket[bucket.length - 1];
    groups.push({
      anchor,
      tier: bumpTier(anchor.version, predecessor.get(anchor.version) ?? null),
      patches: bucket.filter((rel) => rel !== anchor),
    });
  }

  return groups.sort((a, b) => byVersionDesc(a.anchor, b.anchor));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/release-grouping.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/release-grouping.ts src/lib/release-grouping.test.ts
git commit -m "feat: group releases with patches nested under their minor anchor"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `messages/en.json`, `messages/pt.json`, `messages/es.json`

**Interfaces:**
- Produces: namespace `ReleaseBump` with keys `major`, `minor`, `patch`, `initial`, `patchesToggle`, `patchesExpand`, `patchesCollapse`; plus `ProjectDetail.releaseIndexLabel`.

- [ ] **Step 1: Add the `ReleaseBump` namespace and index label — English**

In `messages/en.json`, add `releaseIndexLabel` to the existing `ProjectDetail` object (after `liveLink`):

```json
    "liveLink": "Live",
    "releaseIndexLabel": "Version index"
```

Then add a new top-level `ReleaseBump` namespace (place it next to `ReleaseChange`):

```json
  "ReleaseBump": {
    "major": "Major",
    "minor": "Minor",
    "patch": "Patch",
    "initial": "Initial",
    "patchesToggle": "{count, plural, one {# patch} other {# patches}}",
    "patchesExpand": "Show patches",
    "patchesCollapse": "Hide patches"
  },
```

- [ ] **Step 2: Add the same keys — Portuguese**

In `messages/pt.json`, add to `ProjectDetail`:

```json
    "liveLink": "No ar",
    "releaseIndexLabel": "Índice de versões"
```

And the `ReleaseBump` namespace:

```json
  "ReleaseBump": {
    "major": "Major",
    "minor": "Minor",
    "patch": "Patch",
    "initial": "Initial",
    "patchesToggle": "{count, plural, one {# patch} other {# patches}}",
    "patchesExpand": "Mostrar patches",
    "patchesCollapse": "Ocultar patches"
  },
```

- [ ] **Step 3: Add the same keys — Spanish**

In `messages/es.json`, add to `ProjectDetail`:

```json
    "liveLink": "En vivo",
    "releaseIndexLabel": "Índice de versiones"
```

And the `ReleaseBump` namespace:

```json
  "ReleaseBump": {
    "major": "Major",
    "minor": "Minor",
    "patch": "Patch",
    "initial": "Initial",
    "patchesToggle": "{count, plural, one {# patch} other {# patches}}",
    "patchesExpand": "Mostrar patches",
    "patchesCollapse": "Ocultar patches"
  },
```

- [ ] **Step 4: Verify all three files still parse**

Run: `node -e "['en','pt','es'].forEach(l=>{JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8'));console.log(l,'ok')})"`
Expected: `en ok` / `pt ok` / `es ok`.

- [ ] **Step 5: Commit**

```bash
git add messages/en.json messages/pt.json messages/es.json
git commit -m "feat: add release tier and patch-index i18n strings"
```

---

### Task 4: tier styles + `ReleaseTierTag`

**Files:**
- Create: `src/components/releases/tier-styles.ts`
- Create: `src/components/releases/release-tier-tag.tsx`

**Interfaces:**
- Consumes: `BumpTier` (Task 1); `ReleaseBump` messages (Task 3); `cn` from `@/lib/utils`.
- Produces: `TIER_TEXT_COLOR: Record<BumpTier, string>` and `TIER_VERSION_STYLE: Record<BumpTier, string>` from `tier-styles.ts`; `<ReleaseTierTag tier={...} />`.

- [ ] **Step 1: Create the shared tier-style maps**

```ts
// src/components/releases/tier-styles.ts
import type { BumpTier } from "@/lib/version-bump";

/** Text color per tier — shared by the tag, the version number, and the index. */
export const TIER_TEXT_COLOR: Record<BumpTier, string> = {
  major: "text-brand",
  initial: "text-brand",
  minor: "text-foreground",
  patch: "text-muted-foreground",
};

/** Version-number scale/weight per tier, layered on top of the color. */
export const TIER_VERSION_STYLE: Record<BumpTier, string> = {
  major: "text-[19px] font-bold sm:text-[22px]",
  initial: "text-[19px] font-bold sm:text-[22px]",
  minor: "text-[15px] font-semibold",
  patch: "text-[14px] font-medium",
};
```

- [ ] **Step 2: Create the tag component**

```tsx
// src/components/releases/release-tier-tag.tsx
import { useTranslations } from "next-intl";

import { TIER_TEXT_COLOR } from "@/components/releases/tier-styles";
import type { BumpTier } from "@/lib/version-bump";
import { cn } from "@/lib/utils";

interface ReleaseTierTagProps {
  tier: BumpTier;
}

export function ReleaseTierTag({ tier }: ReleaseTierTagProps) {
  const t = useTranslations("ReleaseBump");

  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="text-border">
        │
      </span>
      <span
        className={cn(
          "font-mono text-[9px] tracking-[0.14em] uppercase",
          TIER_TEXT_COLOR[tier],
        )}
      >
        {t(tier)}
      </span>
    </span>
  );
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (warnings unrelated to these files are fine).

- [ ] **Step 4: Commit**

```bash
git add src/components/releases/tier-styles.ts src/components/releases/release-tier-tag.tsx
git commit -m "feat: add release tier tag and shared tier styles"
```

---

### Task 5: `ReleasePatchGroup` collapsible

**Files:**
- Create: `src/components/releases/release-patch-group.tsx`

**Interfaces:**
- Consumes: `ReleaseView` from `@/server/view-models/project`; `ReleaseChangeList` from `@/components/releases/release-change-list`; `versionAnchor` from `@/lib/version-key`; `ReleaseBump` messages (Task 3).
- Produces: `<ReleasePatchGroup patches={ReleaseView[]} />`. Renders nothing when `patches` is empty.

- [ ] **Step 1: Create the component**

```tsx
// src/components/releases/release-patch-group.tsx
"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { ReleaseChangeList } from "@/components/releases/release-change-list";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";
import type { ReleaseView } from "@/server/view-models/project";

interface ReleasePatchGroupProps {
  patches: ReleaseView[];
}

export function ReleasePatchGroup({ patches }: ReleasePatchGroupProps) {
  const t = useTranslations("ReleaseBump");
  const format = useFormatter();
  const [open, setOpen] = useState(false);

  if (patches.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border/60 pt-4 pl-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.12em] text-muted-foreground uppercase transition-colors hover:text-brand"
      >
        <span
          aria-hidden="true"
          className={cn("text-[11px] transition-transform", open && "rotate-90")}
        >
          ›
        </span>
        {t("patchesToggle", { count: patches.length })}
        <span className="sr-only">
          {open ? t("patchesCollapse") : t("patchesExpand")}
        </span>
      </button>

      {open && (
        <ul className="mt-4 flex flex-col gap-5">
          {patches.map((patch) => (
            <li
              key={patch.id}
              id={versionAnchor(patch.version)}
              className="scroll-mt-28"
            >
              <div className="flex items-baseline justify-between gap-4">
                <a
                  href={`#${versionAnchor(patch.version)}`}
                  className="font-mono text-[13px] text-muted-foreground transition-opacity hover:opacity-70"
                >
                  v{patch.version}
                </a>
                <span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
                  {format.dateTime(patch.releasedAt, "long")}
                </span>
              </div>
              <ReleaseChangeList changes={patch.changes} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/releases/release-patch-group.tsx
git commit -m "feat: add collapsible patch group for the release timeline"
```

---

### Task 6: wire tiers + grouping into the timeline and page

**Files:**
- Modify: `src/components/releases/release-item.tsx`
- Modify: `src/components/releases/release-timeline.tsx`
- Modify: `src/app/[locale]/projects/[slug]/page.tsx`

**Interfaces:**
- Consumes: `groupReleases`/`ReleaseGroup` (Task 2); `ReleaseTierTag` (Task 4); `TIER_TEXT_COLOR`/`TIER_VERSION_STYLE` (Task 4); `ReleasePatchGroup` (Task 5); `BumpTier` (Task 1).
- Produces: `ReleaseItem` now requires a `tier: BumpTier` prop; `ReleaseTimeline` now takes `groups: ReleaseGroup[]` instead of `releases`.

- [ ] **Step 1: Update `ReleaseItem` to take a tier and style the version**

Replace the entire file with:

```tsx
// src/components/releases/release-item.tsx
import { useFormatter } from "next-intl";

import { LocalizedFallbackTag } from "@/components/localized-fallback-tag";
import { MarkdownContent } from "@/components/markdown-content";
import { Reveal } from "@/components/motion/reveal";
import { ReleaseChangeList } from "@/components/releases/release-change-list";
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
  /** Position in the timeline — drives the reveal stagger. */
  index?: number;
}

export function ReleaseItem({ release, tier, index = 0 }: ReleaseItemProps) {
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

      <ReleaseChangeList changes={release.changes} />

      {release.notes && (
        <div className="mt-4">
          <MarkdownContent content={release.notes.text} />
          {release.notes.isFallback && (
            <LocalizedFallbackTag sourceLocale={release.notes.sourceLocale} />
          )}
        </div>
      )}
    </Reveal>
  );
}
```

- [ ] **Step 2: Update `ReleaseTimeline` to consume groups**

Replace the entire file with:

```tsx
// src/components/releases/release-timeline.tsx
import { useTranslations } from "next-intl";

import { ReleaseItem } from "@/components/releases/release-item";
import { ReleasePatchGroup } from "@/components/releases/release-patch-group";
import type { ReleaseGroup } from "@/lib/release-grouping";

interface ReleaseTimelineProps {
  groups: ReleaseGroup[];
}

export function ReleaseTimeline({ groups }: ReleaseTimelineProps) {
  const t = useTranslations("ProjectDetail");

  if (groups.length === 0) {
    return (
      <p className="mt-6 border-t border-border pt-6 text-[14px] leading-[1.6] text-muted-foreground sm:text-[15.5px]">
        {t("releasesEmpty")}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col sm:mt-8">
      {groups.map((group, index) => (
        <div key={group.anchor.id}>
          <ReleaseItem release={group.anchor} tier={group.tier} index={index} />
          <ReleasePatchGroup patches={group.patches} />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update the detail page to compute groups once**

In `src/app/[locale]/projects/[slug]/page.tsx`:

Add the import (next to the other `@/server` / `@/lib` imports):

```tsx
import { groupReleases } from "@/lib/release-grouping";
```

After `const t = await getTranslations("ProjectDetail");`, add:

```tsx
  const releaseGroups = groupReleases(project.releases);
```

Change the timeline usage from:

```tsx
          <ReleaseTimeline releases={project.releases} />
```

to:

```tsx
          <ReleaseTimeline groups={releaseGroups} />
```

- [ ] **Step 4: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: typecheck clean; lint no errors; build succeeds (projects routes remain dynamic `ƒ`).

- [ ] **Step 5: Commit**

```bash
git add src/components/releases/release-item.tsx src/components/releases/release-timeline.tsx "src/app/[locale]/projects/[slug]/page.tsx"
git commit -m "feat: render release timeline grouped and styled by bump tier"
```

---

### Task 7: `ReleaseIndex` (version table of contents)

**Files:**
- Create: `src/components/releases/release-index.tsx`
- Modify: `src/app/[locale]/projects/[slug]/page.tsx`

**Interfaces:**
- Consumes: `ReleaseGroup` (Task 2); `TIER_TEXT_COLOR` (Task 4); `versionAnchor` from `@/lib/version-key`; `ProjectDetail.releaseIndexLabel` (Task 3); the `releaseGroups` already computed in the page (Task 6).
- Produces: `<ReleaseIndex groups={ReleaseGroup[]} />`. Renders nothing with fewer than 2 groups.

- [ ] **Step 1: Create the index component**

```tsx
// src/components/releases/release-index.tsx
import { useTranslations } from "next-intl";

import { TIER_TEXT_COLOR } from "@/components/releases/tier-styles";
import type { ReleaseGroup } from "@/lib/release-grouping";
import { versionAnchor } from "@/lib/version-key";
import { cn } from "@/lib/utils";

interface ReleaseIndexProps {
  groups: ReleaseGroup[];
}

export function ReleaseIndex({ groups }: ReleaseIndexProps) {
  const t = useTranslations("ProjectDetail");

  if (groups.length < 2) return null;

  return (
    <nav
      aria-label={t("releaseIndexLabel")}
      className="mt-5 flex flex-wrap gap-x-4 gap-y-2"
    >
      {groups.map((group) => (
        <a
          key={group.anchor.id}
          href={`#${versionAnchor(group.anchor.version)}`}
          className={cn(
            "font-mono text-[12px] tracking-[0.02em] transition-opacity hover:opacity-70",
            TIER_TEXT_COLOR[group.tier],
          )}
        >
          v{group.anchor.version}
        </a>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Render the index in the Releases section**

In `src/app/[locale]/projects/[slug]/page.tsx`, add the import:

```tsx
import { ReleaseIndex } from "@/components/releases/release-index";
```

In the releases `<section>`, insert `<ReleaseIndex>` between the heading `<span>` and the `<ReleaseTimeline>`:

```tsx
        <section className="mt-11 sm:mt-16">
          <span className="font-mono text-[9.5px] tracking-[0.14em] text-muted-foreground uppercase">
            {t("releasesHeading")}
          </span>
          <ReleaseIndex groups={releaseGroups} />
          <ReleaseTimeline groups={releaseGroups} />
        </section>
```

- [ ] **Step 3: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all clean; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/releases/release-index.tsx "src/app/[locale]/projects/[slug]/page.tsx"
git commit -m "feat: add clickable version index to the project detail page"
```

---

### Task 8: full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass, including the new `version-bump` and `release-grouping` tests (previous 42 + 14 new = 56).

- [ ] **Step 2: Lint and typecheck the whole project**

Run: `npx tsc --noEmit && npm run lint`
Expected: typecheck clean; lint reports no errors.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds; `/[locale]/projects/[slug]` stays dynamic (`ƒ`).

- [ ] **Step 4: Manual visual check (optional but recommended)**

Start a dev server on a non-3000 port and open a project with several versions:

Run: `npm run dev -- -p 3100`
Verify at mobile and desktop widths: major/minor render with the tier tag and scaled version number; the version index appears above the timeline and jumps to each release; patches sit collapsed under their minor and expand on click; light and dark both read correctly.

---

## Self-Review

**Spec coverage:**
- Tier derivation → Task 1. ✓
- Patch grouping under minor → Task 2. ✓
- Tier styling (scale + tag, tier color) → Task 4 (styles/tag) + Task 6 (applied in `ReleaseItem`). ✓
- Collapsible patches, closed by default → Task 5. ✓
- Version index (TOC), anchors only, 2+ groups, `<nav aria-label>` → Task 7. ✓
- i18n en/pt/es (`ReleaseBump` + `releaseIndexLabel`), English tier labels, ICU plural → Task 3. ✓
- Tests for both pure helpers → Tasks 1 & 2. ✓
- No DB/API/schema/migration/new-change-type → none touched. ✓

**Placeholder scan:** none — every step carries real code or an exact command.

**Type consistency:** `BumpTier` (Task 1) is used identically in `release-grouping`, `tier-styles`, `release-tier-tag`, `release-item`, `release-index`. `ReleaseGroup { anchor, tier, patches }` (Task 2) is consumed unchanged by `ReleaseTimeline` (Task 6) and `ReleaseIndex` (Task 7). `ReleaseTimeline` prop is `groups` in both its definition (Task 6) and both call sites (Tasks 6 & 7). `ReleaseItem` gains required `tier` (Task 6) and its only caller passes it.

## Merge note

This branch and `feat/project-media` both touch `src/app/[locale]/projects/[slug]/page.tsx` and `messages/{en,pt,es}.json`. Expect small merge conflicts in those files when the second branch lands — resolve by keeping both sets of additions. No other files overlap (`release-item.tsx` is only touched here; `release-change-list.tsx` only there).
