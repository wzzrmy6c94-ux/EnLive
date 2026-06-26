import { cache } from "react";
import type { Metadata } from "next";
import { getTargetById } from "@/lib/server/db";
import { absoluteUrl, noIndexMetadata, publicPageMetadata, siteName } from "@/lib/seo";

export const runtime = "nodejs";

type TargetParamsProps = {
  params: Promise<{ id: string }>;
};

type TargetLayoutProps = TargetParamsProps & {
  children: React.ReactNode;
};

const getTargetForSeo = cache(async (id: string) => getTargetById(id));

function roleLabel(role: "venue" | "artist" | "city") {
  if (role === "venue") return "venue";
  if (role === "artist") return "artist";
  return "city";
}

function targetSchemaType(role: "venue" | "artist" | "city") {
  if (role === "venue") return "LocalBusiness";
  if (role === "artist") return "MusicGroup";
  return "City";
}

export async function generateMetadata({
  params,
}: TargetParamsProps): Promise<Metadata> {
  const { id } = await params;
  const target = await getTargetForSeo(id);

  if (!target) {
    return {
      title: "Profile Not Found",
      ...noIndexMetadata,
    };
  }

  const label = roleLabel(target.role);
  const title = `${target.name} ${label === "artist" ? "Artist" : label === "venue" ? "Venue" : "City"} Profile`;
  const description =
    target.bio?.trim() ||
    `View ${target.name}'s EnLive ${label} profile in ${target.location}, including fan-powered live music ratings and public ranking details.`;

  return publicPageMetadata({
    title,
    description: description.slice(0, 160),
    path: `/target/${target.id}`,
    keywords: [
      target.name,
      target.location,
      `${target.name} ${label}`,
      `${target.location} live music`,
    ],
  });
}

export default async function TargetLayout({
  children,
  params,
}: TargetLayoutProps) {
  const { id } = await params;
  const target = await getTargetForSeo(id);
  const jsonLd = target
    ? {
        "@context": "https://schema.org",
        "@type": targetSchemaType(target.role),
        name: target.name,
        url: absoluteUrl(`/target/${target.id}`),
        description:
          target.bio?.trim() ||
          `${target.name} is an EnLive ${roleLabel(target.role)} profile in ${target.location}.`,
        address:
          target.role === "venue" && target.address
            ? {
                "@type": "PostalAddress",
                streetAddress: target.address,
                addressLocality: target.location,
              }
            : undefined,
        genre: target.role === "artist" ? target.genre : undefined,
        location: target.location,
        sameAs: [
          target.socialLinks.website,
          target.socialLinks.instagram,
          target.socialLinks.tiktok,
        ].filter(Boolean),
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": absoluteUrl(`/target/${target.id}`),
        },
        publisher: {
          "@type": "Organization",
          name: siteName,
          url: absoluteUrl("/leaderboard"),
        },
      }
    : null;

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      {children}
    </>
  );
}
