import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, readSessionToken } from "@/lib/server/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const session = readSessionToken(token);

  if (!session) {
    redirect("/admin/auth/login");
  }

  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return children;
}
