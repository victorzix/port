import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/locales";
import { localeUrl } from "@/lib/locale-metadata";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const PROFILES = [
  "https://github.com/victorzix",
  "https://www.linkedin.com/in/victorphael",
];

interface JsonLdProps {
  locale: Locale;
}

/**
 * Person + WebSite structured data, so search engines read the site as someone's
 * profile rather than an anonymous page. Both nodes live in one `@graph` and
 * reference each other by `@id`, which is what lets the site inherit the author.
 */
export async function JsonLd({ locale }: JsonLdProps) {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const hero = await getTranslations({ locale, namespace: "Hero" });

  const personId = `${SITE_URL}/#person`;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: t("ogTitle").split("|")[0].trim(),
        jobTitle: hero("kicker"),
        description: t("ogDescription"),
        url: localeUrl(locale),
        image: absoluteUrl("/og.png"),
        sameAs: PROFILES,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: t("siteName"),
        description: t("description"),
        url: localeUrl(locale),
        inLanguage: locale,
        author: { "@id": personId },
        publisher: { "@id": personId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Serialized server-side from our own message files, never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
