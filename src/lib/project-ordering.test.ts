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
