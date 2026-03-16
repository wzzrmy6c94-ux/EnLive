import { NextRequest, NextResponse } from "next/server";
import { getRequestId, withRequestId } from "@/lib/server/http";
import { logError } from "@/lib/server/log";

export type ApiContext<T = unknown> = { requestId: string; params?: T };

export function ok(requestId: string, body: unknown, init?: ResponseInit) {
  return withRequestId(NextResponse.json(body, init), requestId);
}

export function fail(requestId: string, status: number, error: string) {
  return withRequestId(NextResponse.json({ error }, { status }), requestId);
}

export function withApi<TParams = unknown>(
  handler: (req: NextRequest, ctx: ApiContext<TParams>) => Promise<NextResponse>,
) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<TParams> }) => {
    const requestId = getRequestId(req);
    try {
      const params = routeCtx?.params ? await routeCtx.params : undefined;
      return await handler(req, { requestId, params });
    } catch (error) {
      logError("api.unhandled", {
        requestId,
        path: req.nextUrl.pathname,
        method: req.method,
        error: error instanceof Error ? error.message : String(error),
      });
      return fail(requestId, 500, "Internal server error");
    }
  };
}
