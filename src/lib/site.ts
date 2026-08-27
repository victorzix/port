/**
 * Canonical origin of the deployed site. Metadata, the sitemap and robots.txt
 * all build absolute URLs from here, so a domain change is a one-line change.
 */
export const SITE_URL = "https://portfolio.victoraphael.com";

/** Joins a root-relative path onto {@link SITE_URL} without doubling slashes. */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
