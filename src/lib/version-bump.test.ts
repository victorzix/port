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
