import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { listPublicTargetsForSitemap } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/leaderboard"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/contributors"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const targets = await listPublicTargetsForSitemap();
    return [
      ...staticRoutes,
      ...targets.map((target) => ({
        url: absoluteUrl(`/target/${target.id}`),
        lastModified: new Date(target.lastModified),
        changeFrequency: "weekly" as const,
        priority: target.ratingCount >= 5 ? 0.8 : 0.5,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
