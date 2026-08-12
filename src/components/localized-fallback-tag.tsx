import { useTranslations } from "next-intl";

import type { Locale } from "@/i18n/locales";

interface LocalizedFallbackTagProps {
  sourceLocale: Locale;
}

/**
 * Marks text shown in a language other than the one requested. Rendered only
 * where a localized field fell back, so a reader is never misled into thinking
 * untranslated content was translated.
 */
export function LocalizedFallbackTag({ sourceLocale }: LocalizedFallbackTagProps) {
  const t = useTranslations("Localized");

  return (
    <abbr
      title={t("notTranslated")}
      className="ml-1.5 align-super font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase no-underline"
    >
      {sourceLocale}
    </abbr>
  );
}
