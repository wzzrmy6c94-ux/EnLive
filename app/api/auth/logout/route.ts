import { NextRequest, NextResponse } from "next/server";
import { getSessionCookieName } from "@/lib/server/auth";
import { getRequestId, withRequestId } from "@/lib/server/http";
import { logInfo } from "@/lib/server/log";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
  });
  logInfo("auth.logout", { requestId });
  return withRequestId(response, requestId);
}
