import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/leaderboard", "/target/", "/contributors", "/assets/"],
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/pricing",
          "/rate/",
          "/users/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
