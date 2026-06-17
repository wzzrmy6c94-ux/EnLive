import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const verifySchema = z.object({
  token: z.string().transform(sanitizeText).pipe(z.string().min(20).max(500)),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    logWarn("auth.verify_email.bad_request", { requestId });
    return withRequestId(NextResponse.json({ error: "Invalid verification link." }, { status: 400 }), requestId);
  }

  const result = await verifyEmailToken(parsed.data.token);
  if (!result.ok) {
    logWarn("auth.verify_email.failed", { requestId });
    return withRequestId(NextResponse.json({ error: result.error }, { status: 400 }), requestId);
  }

  logInfo("auth.verify_email.success", { requestId, userId: result.user.id });
  return withRequestId(NextResponse.json({ ok: true, username: result.user.username }), requestId);
}
