import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

import { SITE_URL } from "./src/lib/site";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Hostnames that used to serve the site and now point at the canonical origin.
 * The name-matching root domain is what a search for the name should land on,
 * so everything else 301s to it, path preserved.
 *
 * Coolify's per-domain "Direction" only covers www ↔ non-www, never a sibling
 * subdomain — and keeping both rules here means the redirect is versioned and
 * testable with a Host header instead of living only in the proxy's UI.
 */
const LEGACY_HOSTS = ["portfolio.victoraphael.com", "www.victoraphael.com"];

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return LEGACY_HOSTS.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${SITE_URL}/:path*`,
      permanent: true,
    }));
  },
};

export default withNextIntl(nextConfig);
