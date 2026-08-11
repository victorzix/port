import { describe, expect, it } from "vitest";

import { localizedSchema, pick } from "@/lib/localized";

describe("pick", () => {
  it("returns the requested locale when present", () => {
    expect(pick({ en: "Dark mode", pt: "Modo escuro" }, "pt")).toBe("Modo escuro");
  });

  it("falls back to en when the locale is missing", () => {
    expect(pick({ en: "Dark mode", pt: "Modo escuro" }, "es")).toBe("Dark mode");
  });

  it("returns en when asked for en", () => {
    expect(pick({ en: "Dark mode" }, "en")).toBe("Dark mode");
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
