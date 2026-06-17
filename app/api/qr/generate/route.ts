import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getRequestId, withRequestId } from "@/lib/server/http";
import { logWarn } from "@/lib/server/log";
import { sanitizeText } from "@/lib/server/sanitize";
import { generateQrCode } from "@/services/qrService";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  targetId: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
});

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  const session = getSessionFromRequest(req);
  if (!session) {
    logWarn("qr.generate.unauthorized", { requestId });
    return withRequestId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), requestId);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    logWarn("qr.generate.bad_request", { requestId, userId: session.userId });
    return withRequestId(NextResponse.json({ error: "Invalid input" }, { status: 400 }), requestId);
  }

  const { targetId } = parsed.data;
  if (session.role !== "admin" && session.userId !== targetId) {
    logWarn("qr.generate.forbidden", { requestId, userId: session.userId, targetId });
    return withRequestId(NextResponse.json({ error: "Forbidden" }, { status: 403 }), requestId);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const result = await generateQrCode(targetId, appUrl);
  if (!result.ok) {
    return withRequestId(NextResponse.json({ error: result.error }, { status: 404 }), requestId);
  }

  return withRequestId(NextResponse.json(result), requestId);
}
