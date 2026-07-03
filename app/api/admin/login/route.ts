import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSessionToken, safeNextPath, verifyAdminPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? ((await request.json()) as { password?: string; next?: string }) : undefined;
  const form = isJson ? undefined : await request.formData();
  const password = isJson ? body?.password ?? "" : String(form?.get("password") ?? "");
  const next = safeNextPath(isJson ? body?.next ?? "/dashboard" : form?.get("next") ?? "/dashboard");

  if (!verifyAdminPassword(password)) {
    if (isJson) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(next)}&error=1`, request.url), 303);
  }

  const response = isJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL(next, request.url), 303);

  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60,
  });

  return response;
}
