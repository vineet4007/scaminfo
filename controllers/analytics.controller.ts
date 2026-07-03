import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { captureAnalytics, getDashboard, getDistributionFacet, getPages, getSessions, getVisitors } from "@/services/analytics.service";
import { isAdminRequest } from "@/lib/admin-auth";
import { clampLimit, getClientIp, parseDateParam, toCsv } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { AnalyticsFilters } from "@/types/analytics";

function filtersFromRequest(request: NextRequest): AnalyticsFilters {
  const { searchParams } = request.nextUrl;

  return {
    from: parseDateParam(searchParams.get("from")),
    to: parseDateParam(searchParams.get("to")),
    country: searchParams.get("country") ?? undefined,
    browser: searchParams.get("browser") ?? undefined,
    device: searchParams.get("device") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    limit: clampLimit(searchParams.get("limit")),
  };
}

function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json({ error: "Invalid analytics payload", issues: error.issues }, { status: 400 });
  }

  logger.error({ error }, "API request failed");
  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}

function requireAdmin(request: NextRequest) {
  if (isAdminRequest(request)) {
    return undefined;
  }

  return NextResponse.json({ error: "Admin authentication required" }, { status: 401 });
}

export async function postAnalytics(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await captureAnalytics(payload, {
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      acceptLanguage: request.headers.get("accept-language") ?? undefined,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return apiError(error);
  }
}

export async function getDashboardController(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    return NextResponse.json(await getDashboard(filtersFromRequest(request)));
  } catch (error) {
    return apiError(error);
  }
}

export async function getVisitorsController(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    return NextResponse.json({ visitors: await getVisitors(filtersFromRequest(request)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function getSessionsController(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    return NextResponse.json({ sessions: await getSessions(filtersFromRequest(request)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function getPagesController(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    return NextResponse.json({ pageViews: await getPages(filtersFromRequest(request)) });
  } catch (error) {
    return apiError(error);
  }
}

export async function getFacetController(request: NextRequest, name: "country" | "browser" | "os" | "page") {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    return NextResponse.json({ data: await getDistributionFacet(name) });
  } catch (error) {
    return apiError(error);
  }
}

export async function exportController(request: NextRequest) {
  try {
    const authError = requireAdmin(request);
    if (authError) {
      return authError;
    }

    const filters = filtersFromRequest(request);
    const resource = request.nextUrl.searchParams.get("resource") ?? "sessions";
    const format = request.nextUrl.searchParams.get("format") ?? "json";
    const rows =
      resource === "visitors"
        ? await getVisitors(filters)
        : resource === "pageviews"
          ? await getPages(filters)
          : await getSessions(filters);

    if (format === "csv") {
      return new NextResponse(toCsv(rows as Array<Record<string, unknown>>), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": `attachment; filename="scaminfo-${resource}.csv"`,
        },
      });
    }

    return NextResponse.json({ resource, rows });
  } catch (error) {
    return apiError(error);
  }
}
