import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "enlive_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.ENLIVE_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("ENLIVE_SESSION_SECRET must be set in production for security.");
  }
  return secret || "dev-enlive-session-secret-change-me";
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function hashPassword(password: string) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, stored: string) {
  if (!stored) return false;
  if (stored.startsWith("$2")) {
    return bcrypt.compareSync(password, stored);
  }
  return password === stored;
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionToken(data: { userId: string; role: string }) {
  const payload = {
    userId: data.userId,
    role: data.role,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(encoded);
  return `${encoded}.${sig}`;
}

export function readSessionToken(token: string | undefined | null): { userId: string; role: string } | null {
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  if (sign(encoded) !== sig) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as {
      userId: string;
      role: string;
      exp: number;
    };
    if (!parsed.userId || !parsed.role || !parsed.exp) return null;
    if (Date.now() > parsed.exp) return null;
    return { userId: parsed.userId, role: parsed.role };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return readSessionToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
