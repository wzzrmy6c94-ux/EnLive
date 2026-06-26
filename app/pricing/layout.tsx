import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing",
  ...noIndexMetadata,
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
