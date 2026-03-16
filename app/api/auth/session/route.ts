import { NextRequest } from "next/server";
import { ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById } from "@/lib/server/db";

export const runtime = "nodejs";

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    return ok(requestId, { user: null });
  }

  const user = await getUserById(session.userId);
  if (!user) {
    return ok(requestId, { user: null });
  }

  return ok(requestId, { user });
});
