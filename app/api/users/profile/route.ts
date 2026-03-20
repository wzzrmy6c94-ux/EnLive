import { NextRequest } from "next/server";
import { fail, ok, withApi } from "@/lib/server/api";
import { getSessionFromRequest } from "@/lib/server/auth";
import { getUserById, updateUserProfile } from "@/lib/server/db";
import { readJsonBody } from "@/lib/server/http";
import { sanitizeText } from "@/lib/server/sanitize";
import { z } from "zod";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
  location: z.string().transform(sanitizeText).pipe(z.string().min(1).max(120)),
  genre: z.string().transform(sanitizeText).pipe(z.string().max(80)).optional(),
  bio: z.string().transform(sanitizeText).pipe(z.string().max(500)).optional(),
});

export const GET = withApi(async (request: NextRequest, { requestId }) => {
  const session = getSessionFromRequest(request);
  if (!session) return fail(requestId, 401, "Unauthorized");
  const user = await getUserById(session.userId);
  if (!user) return fail(requestId, 401, "Unauthorized");
  return ok(requestId, { user });
});

export const PATCH = withApi(async (request: NextRequest, { requestId }) => {
  const session = getSessionFromRequest(request);
  if (!session) return fail(requestId, 401, "Unauthorized");

  const body = await readJsonBody<unknown>(request).catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return fail(requestId, 400, "Invalid fields.");

  const result = await updateUserProfile(session.userId, parsed.data);
  if (!result.ok) return fail(requestId, 400, result.error);
  return ok(requestId, { ok: true });
});
