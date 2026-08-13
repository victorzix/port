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
