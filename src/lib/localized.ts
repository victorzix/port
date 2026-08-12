import { z } from "zod";

import type { Locale } from "@/i18n/locales";

/**
 * Per-locale content stored as JSONB. Only `en` is required — a missing
 * locale falls back to it, so content can be translated progressively
 * without blocking a publish.
 */
export type Localized = { en: string; pt?: string; es?: string };

export const localizedSchema = z.object({
  en: z.string().min(1),
  pt: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
});

export interface Resolved {
  text: string;
  /** Locale the text actually came from — may differ from the one requested. */
  sourceLocale: Locale;
  /** True when the requested locale had no value and `en` was used instead. */
  isFallback: boolean;
}

/**
 * Resolves stored content for one locale, reporting whether a fallback was
 * needed so the UI can mark untranslated text rather than passing it off as
 * translated. The fallback is `en`, not the site's DEFAULT_LOCALE ("pt") —
 * `en` is the only locale guaranteed present.
 */
export function resolve(value: Localized, locale: Locale): Resolved {
  const own = value[locale];
  if (own) return { text: own, sourceLocale: locale, isFallback: false };
  return { text: value.en, sourceLocale: "en", isFallback: true };
}
