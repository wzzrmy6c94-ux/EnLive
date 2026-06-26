import type { Metadata } from "next";

export const siteName = "EnLive";

export const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL || "https://www.enlive.app"
).replace(/\/$/, "");

export const siteDescription =
  "Discover live music venues and artists through fan-powered EnLive ratings, public leaderboards, and city rankings.";

export const defaultSeoKeywords = [
  "EnLive",
  "live music rankings",
  "live music ratings",
  "venue rankings",
  "artist rankings",
  "music venue reviews",
  "fan powered leaderboards",
  "live music discovery",
];

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}

export function canonicalPath(path = "/") {
  return path.startsWith("/") ? path : `/${path}`;
}

export function publicPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  const canonical = canonicalPath(input.path);

  return {
    title: input.title,
    description: input.description,
    keywords: [...defaultSeoKeywords, ...(input.keywords ?? [])],
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${input.title} | ${siteName}`,
      description: input.description,
      url: canonical,
      siteName,
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "EnLive live music leaderboards",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${siteName}`,
      description: input.description,
      images: ["/opengraph-image"],
    },
  };
}

export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: absoluteUrl("/assets/favicon-512x512.png"),
  description: siteDescription,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description: siteDescription,
};
