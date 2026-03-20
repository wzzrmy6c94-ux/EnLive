import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, sessionCookieOptions } from "@/lib/server/auth";
import { authenticateUser } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { sanitizeEmail, sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().transform(sanitizeEmail).pipe(z.string().email().max(320)),
  password: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<unknown>(request).catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      logWarn("auth.login.bad_request", { requestId });
      return withRequestId(
        NextResponse.json({ error: "Email and password are required." }, { status: 400 }),
        requestId,
      );
    }
    const bodyData = parsed.data;

    const user = await authenticateUser(bodyData.email, bodyData.password);
    if (!user) {
      logWarn("auth.login.failed", { requestId, email: bodyData.email.toLowerCase() });
      return withRequestId(
        NextResponse.json({ error: "Invalid email/password." }, { status: 401 }),
        requestId,
      );
    }

    const token = createSessionToken({ userId: user.id, role: user.role });
    const response = NextResponse.json({ user });
    response.cookies.set(getSessionCookieName(), token, sessionCookieOptions());
    logInfo("auth.login.success", { requestId, userId: user.id, role: user.role });
    return withRequestId(response, requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWarn("auth.login.error", { requestId, error: message });
    return withRequestId(
      NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 }),
      requestId,
    );
  }
}
