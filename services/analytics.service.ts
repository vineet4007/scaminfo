import type { AnalyticsFilters, AnalyticsPayload, AnalyticsRequestContext } from "@/types/analytics";
import { analyticsPayloadSchema } from "@/validators/analytics.validator";
import {
  getDashboardData,
  getFacet,
  listPageViews,
  listSessions,
  listVisitors,
  recordAnalytics,
} from "@/repositories/analytics.repository";

export async function captureAnalytics(payload: unknown, context: AnalyticsRequestContext) {
  const parsed = analyticsPayloadSchema.parse(payload) as AnalyticsPayload;
  return recordAnalytics(parsed, context);
}

export async function getDashboard(filters: AnalyticsFilters) {
  return getDashboardData(filters);
}

export async function getVisitors(filters: AnalyticsFilters) {
  return listVisitors(filters);
}

export async function getSessions(filters: AnalyticsFilters) {
  return listSessions(filters);
}

export async function getPages(filters: AnalyticsFilters) {
  return listPageViews(filters);
}

export async function getDistributionFacet(name: "country" | "browser" | "os" | "page") {
  return getFacet(name);
}
