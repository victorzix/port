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
