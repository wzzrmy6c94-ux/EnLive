import { NextRequest } from "next/server";
import { fail, ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getTargetById, getUserById } from "@/lib/server/db";

export const runtime = "nodejs";

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const session = getSessionFromRequest(request);
  if (!session) return fail(requestId, 401, "Unauthorized");

  const user = await getUserById(session.userId);
  if (!user) return fail(requestId, 401, "Unauthorized");

  if (user.role === "admin") {
    return ok(requestId, { user, target: null });
  }

  const target = await getTargetById(user.id);
  return ok(requestId, { user, target });
});
