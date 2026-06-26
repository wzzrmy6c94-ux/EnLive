import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingControls } from "@/components/floating-controls";
import {
  defaultSeoKeywords,
  organizationJsonLd,
  siteDescription,
  siteName,
  siteUrl,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | Live Music Ratings and Leaderboards`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: defaultSeoKeywords,
  manifest: "/manifest.webmanifest",
  applicationName: siteName,
  alternates: {
    canonical: "/leaderboard",
  },
  openGraph: {
    title: `${siteName} | Live Music Ratings and Leaderboards`,
    description: siteDescription,
    url: "/leaderboard",
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
    title: `${siteName} | Live Music Ratings and Leaderboards`,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteName,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/assets/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/assets/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/assets/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/assets/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/favicon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/assets/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/assets/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/assets/favicon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/favicon-256x256.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/assets/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f4ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd, websiteJsonLd]),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
  const stored = localStorage.getItem("enlive-theme");
  const theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <FloatingControls />
      </body>
    </html>
  );
}
