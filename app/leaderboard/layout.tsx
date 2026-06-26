import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Live Music Leaderboards",
  description:
    "Explore EnLive's fan-powered live music leaderboards for venues, artists, and cities. Discover who is ranking highest in your local scene.",
  path: "/leaderboard",
  keywords: [
    "live music leaderboard",
    "top live music venues",
    "top live artists",
    "city music rankings",
  ],
});

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
