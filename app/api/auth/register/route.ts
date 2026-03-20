import { NextRequest, NextResponse } from "next/server";
import { createManagedUser } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { sanitizeEmail, sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
  email: z.string().transform(sanitizeEmail).pipe(z.string().email().max(320)),
  password: z.string().transform(sanitizeText).pipe(z.string().min(6).max(200)),
  role: z.enum(["venue", "artist"]),
  location: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
  genre: z.string().transform(sanitizeText).pipe(z.string().max(80)).optional(),
  recaptchaToken: z.string().min(1),
});

async function verifyRecaptcha(token: string, action: string) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    throw new Error("RECAPTCHA_SECRET_KEY is not set.");
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
    }),
  });

  if (!response.ok) return false;

  const data = (await response.json()) as {
    success: boolean;
    score?: number;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };

  return Boolean(data.success && data.action === action && (data.score ?? 0) >= 0.5);
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  try {
    const body = await readJsonBody<unknown>(request).catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      logWarn("auth.register.bad_request", { requestId });
      return withRequestId(
        NextResponse.json({ error: "Please fill in all required fields correctly." }, { status: 400 }),
        requestId,
      );
    }
    const { name, email, password, role, location, genre, recaptchaToken } = parsed.data;

    const recaptchaAction = role === "venue" ? "register_venue" : "register_artist";
    const recaptchaOk = await verifyRecaptcha(recaptchaToken, recaptchaAction).catch(() => false);
    if (!recaptchaOk) {
      logWarn("auth.register.recaptcha_failed", { requestId, role });
      return withRequestId(
        NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 }),
        requestId,
      );
    }

    const result = await createManagedUser({ name, email, role, location, password, genre });
    if (!result.ok) {
      logWarn("auth.register.failed", { requestId, reason: result.error });
      return withRequestId(
        NextResponse.json({ error: result.error }, { status: 400 }),
        requestId,
      );
    }

    logInfo("auth.register.success", { requestId, userId: result.user.id, role: result.user.role });
    return withRequestId(NextResponse.json({ ok: true }, { status: 201 }), requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logWarn("auth.register.error", { requestId, error: message });
    return withRequestId(
      NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 }),
      requestId,
    );
  }
}
