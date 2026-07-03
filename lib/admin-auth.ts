import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "scaminfo_admin";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? (process.env.NODE_ENV === "production" ? undefined : "admin");
}

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET ?? adminPassword() ?? "scaminfo-local-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(password: string) {
  const configured = adminPassword();

  if (!configured) {
    return false;
  }

  return safeEqual(password, configured);
}

export function createAdminSessionToken() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = String(expiresAt);

  return `${payload}.${sign(payload)}`;
}

export function isValidAdminSessionToken(token?: string) {
  if (!token) {
    return false;
  }

  const [expiresAt, signature] = token.split(".");
  if (!expiresAt || !signature || Number(expiresAt) < Date.now()) {
    return false;
  }

  return safeEqual(signature, sign(expiresAt));
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminSessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function isAdminRequest(request: NextRequest) {
  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (isValidAdminSessionToken(cookieToken)) {
    return true;
  }

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) {
    return false;
  }

  try {
    const decoded = Buffer.from(auth.slice("Basic ".length), "base64").toString("utf8");
    const [, password = ""] = decoded.split(":");
    return verifyAdminPassword(password);
  } catch {
    return false;
  }
}

export function safeNextPath(value: FormDataEntryValue | string | null) {
  const next = String(value ?? "/dashboard");

  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}
