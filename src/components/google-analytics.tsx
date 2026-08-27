import { GoogleAnalytics as GoogleAnalyticsTag } from "@next/third-parties/google";

/**
 * GA4 tag, rendered only when `NEXT_PUBLIC_GA_ID` is set — so local dev and any
 * environment without the variable ship no tracking script at all.
 *
 * The id is inlined at build time (`NEXT_PUBLIC_*`), which the Dockerfile takes
 * as a build arg. That is fine here: every locale route is prerendered by
 * `generateStaticParams`, so a runtime-only variable would be baked into the
 * static HTML as empty anyway — and a GA measurement id is public by design,
 * it ships in the page source.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) return null;

  return <GoogleAnalyticsTag gaId={gaId} />;
}
