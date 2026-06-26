import type { Metadata } from "next";
import { noIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  title: "User Account",
  ...noIndexMetadata,
};

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
