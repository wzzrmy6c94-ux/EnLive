import { NextRequest, NextResponse } from "next/server";
import { insertRating } from "@/lib/server/db";
import { getRequestId, readJsonBody, withRequestId } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { takePgRateLimit } from "@/lib/server/pg-rate-limit";
import { sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const ratingSchema = z.object({
  targetId: z.string().transform(sanitizeText).pipe(z.string().min(1).max(200)),
  category1: z.coerce.number(),
  category2: z.coerce.number(),
  category3: z.coerce.number(),
  category4: z.coerce.number().optional().nullable(),
});

function getDeviceId(req: NextRequest) {
  return (
    req.headers.get("x-device-id") ||
    req.cookies.get("enlive_device_id")?.value ||
    crypto.randomUUID()
  );
}

function getClientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const ip = getClientIp(request);
  const deviceId = getDeviceId(request);
  const [ipLimit, deviceLimit] = await Promise.all([
    takePgRateLimit(`ratings:ip:${ip}`, 20, 60_000),
    takePgRateLimit(`ratings:device:${deviceId}`, 10, 60_000),
  ]);
  if (!ipLimit.allowed || !deviceLimit.allowed) {
    logWarn("ratings.rate_limited", { requestId, ip, deviceId });
    const retryAfterSeconds = Math.ceil(
      (Math.min(ipLimit.resetAt, deviceLimit.resetAt) - Date.now()) / 1000,
    );
    return withRequestId(NextResponse.json(
      { error: "Too many rating attempts. Please try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) },
      },
    ), requestId);
  }

  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    logWarn("ratings.bad_request", { requestId, ip, reason: "schema_validation" });
    return withRequestId(NextResponse.json({ error: "Invalid rating payload." }, { status: 400 }), requestId);
  }
  const payload = parsed.data;

  const result = await insertRating({
    targetId: payload.targetId,
    category1: payload.category1,
    category2: payload.category2,
    category3: payload.category3,
    category4: payload.category4 == null ? undefined : payload.category4,
    deviceId,
  });

  if (!result.ok) {
    logWarn("ratings.rejected", { requestId, ip, deviceId, targetId: payload.targetId, reason: result.error });
    return withRequestId(NextResponse.json({ error: result.error }, { status: 400 }), requestId);
  }

  logInfo("ratings.created", { requestId, ip, deviceId, targetId: payload.targetId, ratingId: result.rating.id });

  const response = NextResponse.json(result, { status: 201 });
  response.cookies.set("enlive_device_id", deviceId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return withRequestId(response, requestId);
}
