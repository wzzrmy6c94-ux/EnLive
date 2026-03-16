import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { clearAllRatings, resetDatabaseToSeed } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { z } from "zod";

export const runtime = "nodejs";

const adminActionSchema = z.object({
  action: z.enum(["clearRatings", "resetDatabase"]),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const session = getSessionFromRequest(request);
  if (session?.role !== "admin") {
    logWarn("admin.actions.forbidden", { requestId, role: session?.role ?? null });
    return withRequestId(NextResponse.json({ error: "Forbidden" }, { status: 403 }), requestId);
  }

  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = adminActionSchema.safeParse(body);
  if (!parsed.success) {
    logWarn("admin.actions.bad_request", { requestId, adminUserId: session.userId });
    return withRequestId(NextResponse.json({ error: "Invalid action." }, { status: 400 }), requestId);
  }
  const { action } = parsed.data;
  if (action === "clearRatings") {
    await clearAllRatings();
    logInfo("admin.actions.clear_ratings", { requestId, adminUserId: session.userId });
    return withRequestId(NextResponse.json({ ok: true }), requestId);
  }
  if (action === "resetDatabase") {
    await resetDatabaseToSeed();
    logInfo("admin.actions.reset_database", { requestId, adminUserId: session.userId });
    return withRequestId(NextResponse.json({ ok: true }), requestId);
  }
  return withRequestId(NextResponse.json({ error: "Invalid action." }, { status: 400 }), requestId);
}
