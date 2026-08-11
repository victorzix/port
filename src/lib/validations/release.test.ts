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
