import { NextResponse, type NextRequest } from "next/server";
import { enforceRateLimit, rateLimitPolicies, type TokenBucketPolicy } from "@/lib/rate-limit";

type RoutePolicy = {
  scope: string;
  policy: TokenBucketPolicy;
};

const ADMIN_READ_PATHS = new Set([
  "/api/browsers",
  "/api/countries",
  "/api/dashboard",
  "/api/export",
  "/api/os",
  "/api/pages",
  "/api/sessions",
  "/api/visitors",
]);

function policyFor(request: NextRequest): RoutePolicy | undefined {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/admin/login" && request.method === "POST") {
    return { scope: "admin-login", policy: rateLimitPolicies.adminLogin };
  }

  if (pathname === "/api/verify-url" && (request.method === "GET" || request.method === "POST")) {
    return { scope: "verify-url", policy: rateLimitPolicies.verifyUrl };
  }

  if (pathname === "/api/analytics" && request.method === "POST") {
    return { scope: "analytics-write", policy: rateLimitPolicies.analyticsWrite };
  }

  if (ADMIN_READ_PATHS.has(pathname) && request.method === "GET") {
    return { scope: "admin-read", policy: rateLimitPolicies.adminRead };
  }

  return undefined;
}

export function proxy(request: NextRequest) {
  const routePolicy = policyFor(request);

  if (!routePolicy) {
    return NextResponse.next();
  }

  return enforceRateLimit(request, routePolicy.scope, routePolicy.policy);
}

export const config = {
  matcher: "/api/:path*",
};
