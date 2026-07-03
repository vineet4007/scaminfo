import { NextResponse, type NextRequest } from "next/server";
import { verifyUrl } from "@/services/url-verification.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("url") ?? "";

  try {
    return NextResponse.json(await verifyUrl(input));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify URL" },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url?: string };
    return NextResponse.json(await verifyUrl(body.url ?? ""));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify URL" },
      { status: 400 },
    );
  }
}
