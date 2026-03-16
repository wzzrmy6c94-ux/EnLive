import { NextRequest, NextResponse } from "next/server";

export function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

export async function readJsonBody<T>(request: NextRequest): Promise<T> {
  return (await request.json()) as T;
}

export function withRequestId(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}
