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

/**
 * Resolves stored content for one locale. The fallback is `en`, not the
 * site's DEFAULT_LOCALE ("pt") — `en` is the only locale guaranteed present.
 */
export function pick(value: Localized, locale: Locale): string {
  return value[locale] ?? value.en;
}
