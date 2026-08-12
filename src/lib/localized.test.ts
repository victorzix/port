import { describe, expect, it } from "vitest";

import { localizedSchema, resolve } from "@/lib/localized";

describe("resolve", () => {
  it("returns the requested locale when present, not a fallback", () => {
    expect(resolve({ en: "Dark mode", pt: "Modo escuro" }, "pt")).toEqual({
      text: "Modo escuro",
      sourceLocale: "pt",
      isFallback: false,
    });
  });

  it("falls back to en when the requested locale is missing", () => {
    expect(resolve({ en: "Dark mode", pt: "Modo escuro" }, "es")).toEqual({
      text: "Dark mode",
      sourceLocale: "en",
      isFallback: true,
    });
  });

  it("is not a fallback when asked for en and only en exists", () => {
    expect(resolve({ en: "Dark mode" }, "en")).toEqual({
      text: "Dark mode",
      sourceLocale: "en",
      isFallback: false,
    });
  });

  it("is not a fallback when asked for pt and pt exists", () => {
    expect(resolve({ en: "Dark mode", pt: "Modo escuro" }, "pt")).toEqual({
      text: "Modo escuro",
      sourceLocale: "pt",
      isFallback: false,
    });
  });
});

describe("localizedSchema", () => {
  it("accepts en alone", () => {
    expect(localizedSchema.safeParse({ en: "Dark mode" }).success).toBe(true);
  });

  it("rejects a missing en", () => {
    expect(localizedSchema.safeParse({ pt: "Modo escuro" }).success).toBe(false);
  });

  it("rejects an empty en", () => {
    expect(localizedSchema.safeParse({ en: "" }).success).toBe(false);
  });

  it("rejects an empty optional locale rather than storing blank text", () => {
    expect(localizedSchema.safeParse({ en: "Dark mode", pt: "" }).success).toBe(false);
  });
});
