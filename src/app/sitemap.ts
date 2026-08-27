import type { MetadataRoute } from "next";

import { LOCALES, type Locale } from "@/i18n/locales";
import { localeUrl, localeUrlMap } from "@/lib/locale-metadata";
import { getProjectSitemapEntries } from "@/server/services/project-service";

/**
 * Rendered per request, not at build: the project slugs come from Postgres, and
 * the Coolify build stage has no network access to it (see CLAUDE.md). Baking
 * this at build time would ship a sitemap missing every project.
 */
export const dynamic = "force-dynamic";

type SitemapEntry = MetadataRoute.Sitemap[number];
type ChangeFrequency = NonNullable<SitemapEntry["changeFrequency"]>;

interface RouteOptions {
  lastModified?: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
}

/** One `<url>` per locale for the same route, cross-linked with `hreflang`. */
function localizedRoute(path: string, options: RouteOptions): SitemapEntry[] {
  const languages = localeUrlMap(path);

  return LOCALES.map((locale: Locale) => ({
    url: localeUrl(locale, path),
    ...options,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjectSitemapEntries();

  return [
    ...localizedRoute("/", { changeFrequency: "monthly", priority: 1 }),
    ...localizedRoute("/projects", {
      changeFrequency: "weekly",
      priority: 0.8,
    }),
    ...projects.flatMap((project) =>
      localizedRoute(`/projects/${project.slug}`, {
        lastModified: project.lastModified,
        changeFrequency: "weekly",
        priority: 0.6,
      }),
    ),
  ];
}
