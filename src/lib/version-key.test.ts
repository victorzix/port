import { describe, expect, it } from "vitest";

import {
  InvalidVersionError,
  isValidVersion,
  toVersionKey,
  versionAnchor,
} from "@/lib/version-key";

describe("toVersionKey", () => {
  it("pads each component to five digits", () => {
    expect(toVersionKey("1.4.0")).toBe("00001.00004.00000");
  });

  it("sorts 1.10.0 above 1.9.0", () => {
    expect(toVersionKey("1.10.0") > toVersionKey("1.9.0")).toBe(true);
  });

  it("handles date-style versions", () => {
    expect(toVersionKey("2026.8.1")).toBe("02026.00008.00001");
  });

  it("accepts a two-component version", () => {
    expect(toVersionKey("1.4")).toBe("00001.00004");
  });

  it("rejects a leading v", () => {
    expect(() => toVersionKey("v1.4.0")).toThrow(InvalidVersionError);
  });

  it("rejects non-numeric components", () => {
    expect(() => toVersionKey("1.4.0-beta")).toThrow(InvalidVersionError);
  });

  it("rejects an empty string", () => {
    expect(() => toVersionKey("")).toThrow(InvalidVersionError);
  });

  it("rejects a component that would overflow the padding", () => {
    expect(() => toVersionKey("1.123456.0")).toThrow(InvalidVersionError);
  });
});

describe("isValidVersion", () => {
  it("is true for a semver triple", () => {
    expect(isValidVersion("1.4.0")).toBe(true);
  });

  it("is false for a leading v", () => {
    expect(isValidVersion("v1.4.0")).toBe(false);
  });
});

describe("versionAnchor", () => {
  it("builds a deep-link anchor", () => {
    expect(versionAnchor("1.4.0")).toBe("v1-4-0");
  });
});
