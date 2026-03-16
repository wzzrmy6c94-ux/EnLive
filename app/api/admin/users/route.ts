import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/server/auth";
import { createManagedUser } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { sanitizeEmail, sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const adminCreateUserSchema = z.object({
  name: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
  email: z.string().transform(sanitizeEmail).pipe(z.string().email().max(320)),
  role: z.enum(["venue", "artist"]),
  location: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const session = getSessionFromRequest(request);
  if (session?.role !== "admin") {
    logWarn("admin.users.forbidden", { requestId, role: session?.role ?? null });
    return withRequestId(NextResponse.json({ error: "Forbidden" }, { status: 403 }), requestId);
  }

  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = adminCreateUserSchema.safeParse(body);
  if (!parsed.success) {
    logWarn("admin.users.bad_request", { requestId, adminUserId: session.userId });
    return withRequestId(NextResponse.json({ error: "Missing required fields." }, { status: 400 }), requestId);
  }
  const payload = parsed.data;

  const result = await createManagedUser({ name: payload.name, email: payload.email, role: payload.role, location: payload.location });
  if (!result.ok) {
    logWarn("admin.users.create_failed", { requestId, adminUserId: session.userId, reason: result.error });
    return withRequestId(NextResponse.json({ error: result.error }, { status: 400 }), requestId);
  }
  logInfo("admin.users.created", { requestId, adminUserId: session.userId, userId: result.user.id, role: result.user.role });
  return withRequestId(NextResponse.json(result, { status: 201 }), requestId);
}
