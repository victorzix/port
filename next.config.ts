import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  // next-intl loads messages via a dynamic import (`../../messages/${locale}.json`),
  // which Next's file tracer can't resolve statically — include it explicitly
  // so the JSON files make it into the standalone/Docker output.
  outputFileTracingIncludes: {
    "/*": ["./messages/**/*"],
  },
};

export default withNextIntl(nextConfig);
