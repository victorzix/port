import { describe, expect, it } from "vitest";

import { projectSlugSchema, upsertProjectSchema } from "@/lib/validations/project";

const valid = {
  name: "Portfolio",
  description: { en: "This site." },
  status: "active",
  year: 2026,
};

describe("upsertProjectSchema", () => {
  it("accepts a minimal body and defaults stack and sortOrder", () => {
    const parsed = upsertProjectSchema.parse(valid);
    expect(parsed.stack).toEqual([]);
    expect(parsed.sortOrder).toBe(0);
  });

  it("rejects an unknown status", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, status: "paused" }).success,
    ).toBe(false);
  });

  it("rejects a description without en", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, description: { pt: "Este site." } })
        .success,
    ).toBe(false);
  });

  it("rejects a non-integer year", () => {
    expect(upsertProjectSchema.safeParse({ ...valid, year: 2026.5 }).success).toBe(
      false,
    );
  });

  it("rejects a non-url liveUrl", () => {
    expect(
      upsertProjectSchema.safeParse({ ...valid, liveUrl: "not-a-url" }).success,
    ).toBe(false);
  });

  it("strips unknown keys rather than storing them", () => {
    const parsed = upsertProjectSchema.parse({ ...valid, sneaky: "value" });
    expect("sneaky" in parsed).toBe(false);
  });
});

describe("projectSlugSchema", () => {
  it("accepts kebab-case", () => {
    expect(projectSlugSchema.safeParse("my-project").success).toBe(true);
  });

  it("rejects underscores and capitals", () => {
    expect(projectSlugSchema.safeParse("My_Project").success).toBe(false);
  });
});
