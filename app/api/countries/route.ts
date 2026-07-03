import { getFacetController } from "@/controllers/analytics.controller";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return getFacetController(request, "country");
}
