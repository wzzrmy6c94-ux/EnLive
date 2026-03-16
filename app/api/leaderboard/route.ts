import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, withApi } from "@/lib/server/api";
import { getLeaderboard, listLocations, type TargetType } from "@/lib/server/db";
import { logInfo, logWarn } from "@/lib/server/log";

export const runtime = "nodejs";

const querySchema = z.object({
  type: z.enum(["venue", "artist", "city"]),
  location: z.string().optional(),
  minRatings: z.coerce.number().int().min(0).max(100).optional(),
});

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const search = request.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    type: search.get("type"),
    location: search.get("location") ?? undefined,
    minRatings: search.get("minRatings") ?? undefined,
  });
  if (!parsed.success) {
    logWarn("leaderboard.bad_request", { requestId });
    return fail(requestId, 400, "Query param 'type' must be 'venue', 'artist', or 'city'.");
  }
  const { type, location, minRatings = 1 } = parsed.data;

  const rows = await getLeaderboard({
    targetType: type as TargetType,
    location: location && location !== "All" ? location : undefined,
    minRatings,
  });
  logInfo("leaderboard.loaded", { requestId, type, location: location ?? "All", count: rows.length });
  return ok(requestId, { rows, locations: await listLocations() });
});
