import { NextRequest } from "next/server";
import { fail, ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import { listRecentRatingsForAdmin, listUsersForAdmin } from "@/lib/server/db";
import { logWarn } from "@/lib/server/log";

export const runtime = "nodejs";

function assertAdmin(req: NextRequest) {
  const session = getSessionFromRequest(req);
  return session?.role === "admin" ? session : null;
}

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const session = assertAdmin(request);
  if (!session) {
    logWarn("admin.overview.forbidden", { requestId });
    return fail(requestId, 403, "Forbidden");
  }
  const [users, ratings] = await Promise.all([listUsersForAdmin(), listRecentRatingsForAdmin(20)]);
  return ok(requestId, { users, ratings });
});
