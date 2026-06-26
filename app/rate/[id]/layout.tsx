import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Rating Form",
  ...noIndexMetadata,
};

export default function RatingFormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
