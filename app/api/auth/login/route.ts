import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, getSessionCookieName, sessionCookieOptions } from "@/lib/server/auth";
import { authenticateUser, startLoginEmailVerification } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { sanitizeEmail, sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().transform(sanitizeText).pipe(z.string().min(3).max(30)),
  password: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
  email: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().transform(sanitizeEmail).pipe(z.string().email().max(320)).optional(),
  ),
});

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<unknown>(request).catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      logWarn("auth.login.bad_request", { requestId });
      return withRequestId(
        NextResponse.json({ error: "Username and password are required." }, { status: 400 }),
        requestId,
      );
    }
    const bodyData = parsed.data;

    const result = await authenticateUser(bodyData.username, bodyData.password);
    if (!result.ok) {
      logWarn("auth.login.failed", { requestId, username: bodyData.username.toLowerCase(), reason: result.reason });
      if (result.reason === "unverified") {
        if (bodyData.email) {
          const verification = await startLoginEmailVerification({
            username: bodyData.username,
            password: bodyData.password,
            email: bodyData.email,
          });
          if (!verification.ok) {
            return withRequestId(
              NextResponse.json({ error: verification.error }, { status: 400 }),
              requestId,
            );
          }

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
          const verificationUrl = `${appUrl.replace(/\/$/, "")}/users/verify-email?token=${encodeURIComponent(verification.verificationToken)}`;
          return withRequestId(
            NextResponse.json({
              ok: true,
              verificationRequired: true,
              verificationUrl,
              username: verification.username,
            }, { status: 202 }),
            requestId,
          );
        }

        return withRequestId(
          NextResponse.json({
            error: "Please enter an email address to verify this account.",
            emailRequired: true,
            verificationRequired: true,
          }, { status: 403 }),
          requestId,
        );
      }
      return withRequestId(
        NextResponse.json({ error: "Invalid username/password." }, { status: 401 }),
        requestId,
      );
    }
    const { user } = result;

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
