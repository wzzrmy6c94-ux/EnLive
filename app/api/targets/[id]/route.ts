import { NextRequest } from "next/server";
import { z } from "zod";
import { fail, ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getTargetById } from "@/lib/server/db";
import { logWarn } from "@/lib/server/log";

export const runtime = "nodejs";

const paramsSchema = z.object({ id: z.string().min(1).max(200) });

export const GET = withApi<{ id: string }>(async (request: NextRequest, { requestId, params }) => {
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) return fail(requestId, 400, "Invalid target id.");
  const { id } = parsed.data;
  const session = getSessionFromRequest(request);
  const includeDisabled = session?.role === "admin" || session?.userId === id;
  const target = await getTargetById(id, { includeDisabled, includeModeration: includeDisabled });
  if (!target) {
    logWarn("targets.not_found", { requestId, id });
    return fail(requestId, 404, "Target not found.");
  }
  return ok(requestId, { target });
});
