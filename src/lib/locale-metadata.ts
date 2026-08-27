import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/i18n/locales";
import { absoluteUrl } from "@/lib/site";

/**
 * Open Graph wants a language_TERRITORY tag, not the bare locale code we route
 * with. Keep the territories aligned with the audience the copy is written for.
 */
const OG_LOCALES: Record<Locale, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
};

/**
 * Path a route takes under `localePrefix: "as-needed"`: the default locale is
 * served unprefixed (`/projects`), the others carry their code (`/en/projects`).
 */
export function localePath(locale: Locale, path = "/"): string {
  const suffix = path === "/" ? "" : path;
  return locale === DEFAULT_LOCALE ? suffix || "/" : `/${locale}${suffix}`;
}

/** Same path, absolute — for the sitemap and for `og:url`. */
export function localeUrl(locale: Locale, path = "/"): string {
  return absoluteUrl(localePath(locale, path));
}

/**
 * `canonical` + `hreflang` set for one route, so the three locales point at each
 * other instead of competing as duplicate content. `x-default` goes to the
 * default locale, which is what a crawler without a language preference gets.
 */
export function localeAlternates(locale: Locale, path = "/") {
  return {
    canonical: localePath(locale, path),
    languages: {
      ...Object.fromEntries(LOCALES.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(DEFAULT_LOCALE, path),
    },
  };
}

/**
 * Absolute hreflang map for one route. The sitemap needs full URLs — it is not
 * resolved against `metadataBase` the way page metadata is.
 */
export function localeUrlMap(path = "/"): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, localeUrl(l, path)])),
    "x-default": localeUrl(DEFAULT_LOCALE, path),
  };
}

/** `og:locale` for the current locale, plus `og:locale:alternate` for the rest. */
export function ogLocales(locale: Locale) {
  return {
    locale: OG_LOCALES[locale],
    alternateLocale: LOCALES.filter((l) => l !== locale).map(
      (l) => OG_LOCALES[l],
    ),
  };
}
