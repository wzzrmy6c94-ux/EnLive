import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FloatingControls } from "@/components/floating-controls";
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
  title: {
    default: "EnLive",
    template: "%s | EnLive",
  },
  description: "Location-based live music rating and leaderboard",
  manifest: "/manifest.webmanifest",
  applicationName: "EnLive",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EnLive",
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
