import { describe, expect, it } from "vitest";

import {
  localeAlternates,
  localePath,
  localeUrl,
  localeUrlMap,
  ogLocales,
} from "@/lib/locale-metadata";
import { SITE_URL } from "@/lib/site";

describe("localePath", () => {
  it("leaves the default locale unprefixed", () => {
    expect(localePath("pt", "/projects")).toBe("/projects");
  });

  it("prefixes the other locales", () => {
    expect(localePath("en", "/projects")).toBe("/en/projects");
    expect(localePath("es", "/projects")).toBe("/es/projects");
  });

  it("keeps the root path a single slash for the default locale", () => {
    expect(localePath("pt")).toBe("/");
  });

  it("has no trailing slash on a prefixed root", () => {
    expect(localePath("en")).toBe("/en");
  });
});

describe("localeUrl", () => {
  it("is absolute, without doubling the slash at the root", () => {
    expect(localeUrl("pt")).toBe(SITE_URL);
    expect(localeUrl("en", "/projects")).toBe(`${SITE_URL}/en/projects`);
  });
});

describe("localeAlternates", () => {
  it("points the canonical at the current locale", () => {
    expect(localeAlternates("en", "/projects").canonical).toBe("/en/projects");
  });

  it("lists every locale plus x-default on the default locale", () => {
    expect(localeAlternates("es").languages).toEqual({
      pt: "/",
      en: "/en",
      es: "/es",
      "x-default": "/",
    });
  });

  it("gives the same language map whichever locale asks", () => {
    expect(localeAlternates("pt", "/projects").languages).toEqual(
      localeAlternates("en", "/projects").languages,
    );
  });
});

describe("localeUrlMap", () => {
  it("is absolute, as the sitemap needs", () => {
    expect(localeUrlMap("/projects")).toEqual({
      pt: `${SITE_URL}/projects`,
      en: `${SITE_URL}/en/projects`,
      es: `${SITE_URL}/es/projects`,
      "x-default": `${SITE_URL}/projects`,
    });
  });
});

describe("ogLocales", () => {
  it("uses language_TERRITORY tags and excludes the current locale", () => {
    expect(ogLocales("pt")).toEqual({
      locale: "pt_BR",
      alternateLocale: ["en_US", "es_ES"],
    });
  });
});
