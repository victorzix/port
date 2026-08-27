import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * Everything is meant to be indexed except the upload API, which only answers
 * authenticated PUTs and has nothing for a crawler to read.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
