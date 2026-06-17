import { NextRequest } from "next/server";
import { fail, ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import {
  deleteRatingForAdmin,
  deleteTargetRatingsForAdmin,
  listRatingsForAdmin,
} from "@/lib/server/db";
import { readJsonBody } from "@/lib/server/http";
import { logInfo, logWarn } from "@/lib/server/log";
import { z } from "zod";

export const runtime = "nodejs";

const deleteRatingSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("deleteRating"),
    ratingId: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal("deleteTargetHistory"),
    targetId: z.string().min(1).max(200),
  }),
]);

function assertAdmin(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return session?.role === "admin" ? session : null;
}

function optionalParam(request: NextRequest, key: string) {
  const value = request.nextUrl.searchParams.get(key)?.trim();
  return value || undefined;
}

function ratingLimit(request: NextRequest) {
  const raw = Number(request.nextUrl.searchParams.get("limit") ?? 75);
  return Number.isFinite(raw) ? Math.trunc(raw) : 75;
}

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const session = assertAdmin(request);
  if (!session) {
    logWarn("admin.ratings.forbidden", { requestId });
    return fail(requestId, 403, "Forbidden");
  }

  const ratings = await listRatingsForAdmin({
    targetId: optionalParam(request, "targetId"),
    deviceId: optionalParam(request, "deviceId"),
    limit: ratingLimit(request),
  });
  return ok(requestId, { ratings });
});

export const DELETE = withApi(async (request: NextRequest, { requestId }) => {
  const session = assertAdmin(request);
  if (!session) {
    logWarn("admin.ratings.delete_forbidden", { requestId });
    return fail(requestId, 403, "Forbidden");
  }

  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = deleteRatingSchema.safeParse(body);
  if (!parsed.success) {
    logWarn("admin.ratings.bad_request", { requestId, adminUserId: session.userId });
    return fail(requestId, 400, "Invalid rating action.");
  }

  if (parsed.data.action === "deleteRating") {
    const result = await deleteRatingForAdmin(parsed.data.ratingId);
    if (!result.ok) {
      logWarn("admin.ratings.delete_missing", {
        requestId,
        adminUserId: session.userId,
        ratingId: parsed.data.ratingId,
      });
      return fail(requestId, 404, result.error);
    }

    logInfo("admin.ratings.deleted", {
      requestId,
      adminUserId: session.userId,
      ratingId: parsed.data.ratingId,
      targetId: result.targetId,
    });
    return ok(requestId, result);
  }

  const result = await deleteTargetRatingsForAdmin(parsed.data.targetId);
  if (!result.ok) {
    logWarn("admin.ratings.target_history_missing", {
      requestId,
      adminUserId: session.userId,
      targetId: parsed.data.targetId,
    });
    return fail(requestId, 404, result.error);
  }

  logInfo("admin.ratings.target_history_deleted", {
    requestId,
    adminUserId: session.userId,
    targetId: result.targetId,
    deletedCount: result.deletedCount,
  });
  return ok(requestId, result);
});
