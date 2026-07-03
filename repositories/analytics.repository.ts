import { DeviceType, EventType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createFallbackFingerprint, enrichIpAddress, isPrivateIp, mapDeviceType, normalizeEventType, parseUserAgent, safeDate } from "@/lib/analytics";
import { daysAgo, startOfToday, stripUndefined } from "@/lib/utils";
import type { AnalyticsFilters, AnalyticsPayload, AnalyticsRequestContext, DashboardData, DistributionPoint, VisitorJourney, VisitorJourneyEvent } from "@/types/analytics";

function dateFilter(from?: Date, to?: Date) {
  if (!from && !to) {
    return undefined;
  }

  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

function toDeviceType(value?: string): DeviceType | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.toUpperCase();
  return Object.values(DeviceType).includes(normalized as DeviceType) ? (normalized as DeviceType) : undefined;
}

function createSessionWhere(filters: AnalyticsFilters): Prisma.SessionWhereInput {
  return {
    ...(dateFilter(filters.from, filters.to) ? { startedAt: dateFilter(filters.from, filters.to) } : {}),
    ...(filters.country ? { country: filters.country } : {}),
    ...(filters.browser ? { browser: filters.browser } : {}),
    ...(toDeviceType(filters.device) ? { deviceType: toDeviceType(filters.device) } : {}),
    ...(filters.page ? { pageViews: { some: { path: filters.page } } } : {}),
  };
}

function createPageViewWhere(filters: AnalyticsFilters): Prisma.PageViewWhereInput {
  const sessionWhere = createSessionWhere({ ...filters, page: undefined });

  return {
    ...(dateFilter(filters.from, filters.to) ? { createdAt: dateFilter(filters.from, filters.to) } : {}),
    ...(filters.page ? { path: filters.page } : {}),
    ...(Object.keys(sessionWhere).length ? { session: sessionWhere } : {}),
  };
}

function asDistribution<T extends Record<string, unknown>>(rows: T[], key: keyof T, countKey = "_count"): DistributionPoint[] {
  return rows
    .map((row) => {
      const countValue = row[countKey] as { _all?: number } | number | undefined;
      const value = typeof countValue === "number" ? countValue : countValue?._all ?? 0;

      return {
        label: String(row[key] ?? "Unknown"),
        value,
      };
    })
    .filter((point) => point.value > 0)
    .sort((a, b) => b.value - a.value);
}

function groupByDate(rows: Array<{ createdAt?: Date; startedAt?: Date }>): DistributionPoint[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const date = row.createdAt ?? row.startedAt;
    if (!date) {
      return;
    }

    const label = date.toISOString().slice(0, 10);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function recordAnalytics(payload: AnalyticsPayload, context: AnalyticsRequestContext) {
  const eventType = normalizeEventType(payload.event?.type);
  const timestamp = safeDate(payload.timestamp);
  const userAgent = context.userAgent;
  const parsedUa = parseUserAgent(userAgent);
  const networkRisk = await enrichIpAddress(context.ip, userAgent);
  const fingerprint = payload.fingerprint ?? createFallbackFingerprint(payload, context);
  const deviceType = mapDeviceType(payload.device?.type ?? parsedUa.deviceType, userAgent);
  const browser = payload.browser?.name ?? parsedUa.browser;
  const browserVersion = payload.browser?.version ?? parsedUa.browserVersion;
  const os = payload.os?.name ?? parsedUa.os;
  const osVersion = payload.os?.version ?? parsedUa.osVersion;
  const existingSession = await prisma.session.findUnique({ where: { id: payload.sessionId } });

  await prisma.visitor.upsert({
    where: { visitorId: payload.visitorId },
    create: {
      visitorId: payload.visitorId,
      firstSeen: timestamp,
      lastSeen: timestamp,
      totalSessions: 1,
    },
    update: {
      lastSeen: timestamp,
      ...(existingSession ? {} : { totalSessions: { increment: 1 } }),
    },
  });

  const session = await prisma.session.upsert({
    where: { id: payload.sessionId },
    create: {
      id: payload.sessionId,
      visitorId: payload.visitorId,
      ip: context.ip,
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      language: payload.locale?.language ?? context.acceptLanguage,
      timezone: payload.locale?.timezone ?? networkRisk.timezone,
      country: networkRisk.country,
      countryCode: networkRisk.countryCode,
      region: networkRisk.region,
      city: networkRisk.city,
      postalCode: networkRisk.postalCode,
      latitude: networkRisk.latitude,
      longitude: networkRisk.longitude,
      isp: networkRisk.isp,
      organization: networkRisk.organization,
      asn: networkRisk.asn,
      vpn: networkRisk.vpn,
      proxy: networkRisk.proxy,
      tor: networkRisk.tor,
      screenWidth: payload.screen?.width,
      screenHeight: payload.screen?.height,
      viewportWidth: payload.screen?.viewportWidth,
      viewportHeight: payload.screen?.viewportHeight,
      userAgent,
      startedAt: timestamp,
      endedAt: eventType === EventType.EXIT ? timestamp : undefined,
    },
    update: {
      ip: context.ip,
      browser,
      browserVersion,
      os,
      osVersion,
      deviceType,
      language: payload.locale?.language ?? context.acceptLanguage,
      timezone: payload.locale?.timezone ?? networkRisk.timezone,
      country: networkRisk.country,
      countryCode: networkRisk.countryCode,
      region: networkRisk.region,
      city: networkRisk.city,
      postalCode: networkRisk.postalCode,
      latitude: networkRisk.latitude,
      longitude: networkRisk.longitude,
      isp: networkRisk.isp,
      organization: networkRisk.organization,
      asn: networkRisk.asn,
      vpn: networkRisk.vpn,
      proxy: networkRisk.proxy,
      tor: networkRisk.tor,
      screenWidth: payload.screen?.width,
      screenHeight: payload.screen?.height,
      viewportWidth: payload.screen?.viewportWidth,
      viewportHeight: payload.screen?.viewportHeight,
      userAgent,
      ...(eventType === EventType.EXIT ? { endedAt: timestamp } : {}),
    },
  });

  if (eventType === EventType.PAGE_LOAD || eventType === EventType.PAGE_VIEW) {
    await prisma.pageView.create({
      data: {
        sessionId: session.id,
        path: payload.currentPage,
        title: payload.pageTitle,
        referrer: payload.referrer ?? undefined,
        createdAt: timestamp,
      },
    });
  }

  const metadata = stripUndefined({
    fingerprint,
    page: {
      path: payload.currentPage,
      title: payload.pageTitle,
      url: payload.url,
      hostname: payload.hostname,
      referrer: payload.referrer,
    },
    browser: {
      ...payload.browser,
      engine: payload.browser?.engine ?? parsedUa.engine,
      engineVersion: payload.browser?.engineVersion ?? parsedUa.engineVersion,
    },
    os: {
      ...payload.os,
      cpuArchitecture: payload.os?.cpuArchitecture ?? parsedUa.cpuArchitecture,
    },
    device: {
      ...payload.device,
      vendor: payload.device?.vendor ?? parsedUa.deviceVendor,
      model: payload.device?.model ?? parsedUa.deviceModel,
    },
    screen: payload.screen,
    locale: payload.locale,
    features: payload.features,
    performance: payload.performance,
    fingerprints: payload.fingerprints,
    network: {
      ip: context.ip,
      country: networkRisk.country,
      countryCode: networkRisk.countryCode,
      region: networkRisk.region,
      city: networkRisk.city,
      postalCode: networkRisk.postalCode,
      latitude: networkRisk.latitude,
      longitude: networkRisk.longitude,
      timezone: networkRisk.timezone,
      isp: networkRisk.isp,
      organization: networkRisk.organization,
      asn: networkRisk.asn,
      hosting: networkRisk.hosting,
      mobile: networkRisk.mobile,
      bot: networkRisk.bot,
    },
    event: payload.event?.metadata,
  });

  const event = await prisma.event.create({
    data: {
      sessionId: session.id,
      eventType,
      metadata: metadata as Prisma.InputJsonValue,
      createdAt: timestamp,
    },
  });

  return { visitorId: payload.visitorId, sessionId: session.id, eventId: event.id };
}

function serializeDate(date?: Date | null) {
  return date ? date.toISOString() : undefined;
}

function eventLabel(eventType: EventType, metadata: Prisma.JsonValue | null) {
  const meta = metadata as {
    page?: { path?: string; title?: string; url?: string };
    event?: { label?: string; href?: string; depth?: number; external?: boolean; tagName?: string };
  } | null;

  if (eventType === EventType.PAGE_LOAD || eventType === EventType.PAGE_VIEW) {
    return meta?.page?.path ?? "Page view";
  }

  if (eventType === EventType.CLICK) {
    return meta?.event?.label || meta?.event?.href || "Click";
  }

  if (eventType === EventType.SCROLL) {
    return `${meta?.event?.depth ?? 0}% scroll`;
  }

  return eventType.replaceAll("_", " ").toLowerCase();
}

function toJourneyEvent(event: {
  id: string;
  eventType: EventType;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
}): VisitorJourneyEvent {
  const meta = event.metadata as {
    page?: { path?: string };
    event?: { label?: string; href?: string; depth?: number };
  } | null;

  return {
    id: event.id,
    type: event.eventType,
    createdAt: event.createdAt.toISOString(),
    page: meta?.page?.path,
    label: eventLabel(event.eventType, event.metadata),
    href: meta?.event?.href,
    depth: meta?.event?.depth,
    metadata: (event.metadata ?? undefined) as Record<string, unknown> | undefined,
  };
}

function clampRiskScore(score: number) {
  return Math.min(10, Math.max(0, score));
}

function uniqueReasons(reasons: string[]) {
  return Array.from(new Set(reasons));
}

function sessionRisk(session: {
  deviceType: DeviceType;
  userAgent?: string | null;
  isp?: string | null;
  organization?: string | null;
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
  pageViews: Array<unknown>;
  events: Array<{
    eventType: EventType;
    metadata: Prisma.JsonValue | null;
  }>;
}) {
  let score = 0;
  const reasons: string[] = [];
  const eventCount = session.events.length;
  const pageViewCount = session.pageViews.length;
  const externalClicks = session.events.filter((event) => {
    const metadata = event.metadata as { event?: { external?: boolean } } | null;
    return event.eventType === EventType.CLICK && metadata?.event?.external;
  }).length;
  const downloads = session.events.filter((event) => event.eventType === EventType.DOWNLOAD).length;
  const hostingHint = /hosting|cloud|aws|amazon|azure|google|digitalocean|ovh|linode|hetzner|vultr|contabo/i.test(
    `${session.isp ?? ""} ${session.organization ?? ""}`,
  );

  if (session.tor) {
    score += 5;
    reasons.push("Tor traffic");
  }

  if (session.vpn) {
    score += 2;
    reasons.push("VPN signal");
  }

  if (session.proxy) {
    score += 2;
    reasons.push("Proxy signal");
  }

  if (session.deviceType === DeviceType.BOT || /\b(bot|headless|crawler|spider)\b/i.test(session.userAgent ?? "")) {
    score += 4;
    reasons.push("Bot or headless browser indicator");
  }

  if (hostingHint) {
    score += 2;
    reasons.push("Hosting or data-center network");
  }

  if (eventCount >= 100) {
    score += 4;
    reasons.push("Very high event volume");
  } else if (eventCount >= 50) {
    score += 3;
    reasons.push("High event volume");
  } else if (eventCount >= 25) {
    score += 2;
    reasons.push("Elevated event volume");
  }

  if (pageViewCount >= 20) {
    score += 2;
    reasons.push("Many page views in one session");
  } else if (pageViewCount >= 10) {
    score += 1;
    reasons.push("Elevated page-view volume");
  }

  if (externalClicks >= 5) {
    score += 1;
    reasons.push("Many external-link clicks");
  }

  if (downloads > 0) {
    score += 1;
    reasons.push("Download activity");
  }

  return {
    riskScore: clampRiskScore(score),
    riskReasons: uniqueReasons(reasons),
  };
}

function toVisitorJourney(visitor: {
  visitorId: string;
  firstSeen: Date;
  lastSeen: Date;
  totalSessions: number;
  sessions: Array<{
    id: string;
    ip: string | null;
    browser: string | null;
    browserVersion: string | null;
    os: string | null;
    osVersion: string | null;
    deviceType: DeviceType;
    country: string | null;
    countryCode: string | null;
    region: string | null;
    city: string | null;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    isp: string | null;
    organization: string | null;
    asn: string | null;
    userAgent: string | null;
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    startedAt: Date;
    endedAt: Date | null;
    pageViews: Array<{
      id: string;
      path: string;
      title: string | null;
      referrer: string | null;
      createdAt: Date;
    }>;
    events: Array<{
      id: string;
      eventType: EventType;
      metadata: Prisma.JsonValue | null;
      createdAt: Date;
    }>;
  }>;
}): VisitorJourney {
  const latestSession = visitor.sessions[0];
  const latestIsPrivateIp = isPrivateIp(latestSession?.ip ?? undefined);
  const locationCountry = latestSession?.country ?? (latestIsPrivateIp ? "Local network" : undefined);
  const locationCountryCode = latestSession?.countryCode ?? (latestIsPrivateIp ? "LOCAL" : undefined);
  const locationIsp = latestSession?.isp ?? (latestIsPrivateIp ? "Private network" : undefined);
  const sessions = visitor.sessions.map((session) => {
    const privateIp = isPrivateIp(session.ip ?? undefined);
    const risk = sessionRisk(session);

    return {
      id: session.id,
      ip: session.ip ?? undefined,
      browser: session.browser ?? undefined,
      browserVersion: session.browserVersion ?? undefined,
      os: session.os ?? undefined,
      osVersion: session.osVersion ?? undefined,
      deviceType: session.deviceType,
      country: session.country ?? (privateIp ? "Local network" : undefined),
      countryCode: session.countryCode ?? (privateIp ? "LOCAL" : undefined),
      region: session.region ?? undefined,
      city: session.city ?? undefined,
      postalCode: session.postalCode ?? undefined,
      latitude: session.latitude ?? undefined,
      longitude: session.longitude ?? undefined,
      timezone: session.timezone ?? undefined,
      isp: session.isp ?? (privateIp ? "Private network" : undefined),
      organization: session.organization ?? undefined,
      asn: session.asn ?? undefined,
      vpn: session.vpn,
      proxy: session.proxy,
      tor: session.tor,
      riskScore: risk.riskScore,
      riskReasons: risk.riskReasons,
      startedAt: session.startedAt.toISOString(),
      endedAt: serializeDate(session.endedAt),
      pageViews: session.pageViews.map((pageView) => ({
        id: pageView.id,
        path: pageView.path,
        title: pageView.title ?? undefined,
        referrer: pageView.referrer ?? undefined,
        createdAt: pageView.createdAt.toISOString(),
      })),
      events: session.events.map(toJourneyEvent),
    };
  });
  const totalEvents = sessions.reduce((total, session) => total + session.events.length, 0);
  const riskReasons = uniqueReasons(sessions.flatMap((session) => session.riskReasons));
  let riskScore = sessions.reduce((highest, session) => Math.max(highest, session.riskScore), 0);

  if (totalEvents >= 100) {
    riskScore = Math.max(riskScore, 4);
    riskReasons.push("Very high event volume across sessions");
  } else if (totalEvents >= 50) {
    riskScore = Math.max(riskScore, 3);
    riskReasons.push("High event volume across sessions");
  }

  if (visitor.totalSessions >= 10) {
    riskScore = Math.max(riskScore, 4);
    riskReasons.push("Many sessions from same visitor");
  }

  riskScore = clampRiskScore(riskScore);

  return {
    visitorId: visitor.visitorId,
    firstSeen: visitor.firstSeen.toISOString(),
    lastSeen: visitor.lastSeen.toISOString(),
    totalSessions: visitor.totalSessions,
    riskScore,
    riskStatus: riskScore > 3 ? "bad" : "normal",
    riskReasons: uniqueReasons(riskReasons),
    latestLocation: {
      ip: latestSession?.ip ?? undefined,
      country: locationCountry,
      countryCode: locationCountryCode,
      region: latestSession?.region ?? undefined,
      city: latestSession?.city ?? undefined,
      postalCode: latestSession?.postalCode ?? undefined,
      latitude: latestSession?.latitude ?? undefined,
      longitude: latestSession?.longitude ?? undefined,
      timezone: latestSession?.timezone ?? undefined,
      isp: locationIsp,
      organization: latestSession?.organization ?? undefined,
      asn: latestSession?.asn ?? undefined,
    },
    sessions,
  };
}

export async function getDashboardData(filters: AnalyticsFilters): Promise<DashboardData> {
  const from = filters.from ?? daysAgo(29);
  const scopedFilters = { ...filters, from };
  const sessionWhere = createSessionWhere(scopedFilters);
  const pageViewWhere = createPageViewWhere(scopedFilters);
  const today = startOfToday();

  const [
    visitorsToday,
    totalVisitors,
    uniqueVisitors,
    sessions,
    pageViews,
    events,
    sessionRows,
    recentVisitors,
    recentSessions,
    recentPageViews,
    browserGroups,
    osGroups,
    deviceGroups,
    countryGroups,
    pageGroups,
  ] = await Promise.all([
    prisma.visitor.count({ where: { lastSeen: { gte: today } } }),
    prisma.visitor.count(),
    prisma.visitor.count(),
    prisma.session.count({ where: sessionWhere }),
    prisma.pageView.count({ where: pageViewWhere }),
    prisma.event.count({ where: { createdAt: dateFilter(scopedFilters.from, scopedFilters.to), session: sessionWhere } }),
    prisma.session.findMany({
      where: sessionWhere,
      take: 1000,
      orderBy: { startedAt: "desc" },
      include: { pageViews: true, events: true },
    }),
    prisma.visitor.findMany({
      take: filters.limit ?? 20,
      orderBy: { lastSeen: "desc" },
      include: {
        sessions: {
          where: sessionWhere,
          take: 5,
          orderBy: { startedAt: "desc" },
          include: {
            pageViews: { orderBy: { createdAt: "asc" } },
            events: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    }),
    prisma.session.findMany({
      where: sessionWhere,
      take: 10,
      orderBy: { startedAt: "desc" },
      include: { _count: { select: { pageViews: true, events: true } } },
    }),
    prisma.pageView.findMany({
      where: pageViewWhere,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { session: true },
    }),
    prisma.session.groupBy({ by: ["browser"], where: sessionWhere, _count: { _all: true } }),
    prisma.session.groupBy({ by: ["os"], where: sessionWhere, _count: { _all: true } }),
    prisma.session.groupBy({ by: ["deviceType"], where: sessionWhere, _count: { _all: true } }),
    prisma.session.groupBy({ by: ["country"], where: sessionWhere, _count: { _all: true } }),
    prisma.pageView.groupBy({ by: ["path"], where: pageViewWhere, _count: { _all: true } }),
  ]);

  const durationSeconds = sessionRows.map((session) => {
    const end = session.endedAt ?? new Date();
    return Math.max(0, Math.round((end.getTime() - session.startedAt.getTime()) / 1000));
  });
  const averageSessionDurationSeconds = durationSeconds.length
    ? Math.round(durationSeconds.reduce((total, value) => total + value, 0) / durationSeconds.length)
    : 0;
  const bouncedSessions = sessionRows.filter((session) => session.pageViews.length <= 1).length;
  const bounceRate = sessionRows.length ? Math.round((bouncedSessions / sessionRows.length) * 100) : 0;

  const fingerprintCounts = new Map<string, number>();
  const ipCounts = new Map<string, number>();
  const visitorEventCounts = new Map<string, number>();

  sessionRows.forEach((session) => {
    if (session.ip) {
      ipCounts.set(session.ip, (ipCounts.get(session.ip) ?? 0) + 1);
    }

    visitorEventCounts.set(session.visitorId, (visitorEventCounts.get(session.visitorId) ?? 0) + session.events.length);

    session.events.forEach((event) => {
      const metadata = event.metadata as { fingerprint?: string } | null;
      if (metadata?.fingerprint) {
        fingerprintCounts.set(metadata.fingerprint, (fingerprintCounts.get(metadata.fingerprint) ?? 0) + 1);
      }
    });
  });

  const toRepeated = (map: Map<string, number>) =>
    Array.from(map.entries())
      .filter(([, value]) => value > 1)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  const visitorJourneys = recentVisitors.map(toVisitorJourney).filter((visitor) => visitor.sessions.length > 0);
  const riskByVisitor = new Map<string, number>();

  sessionRows.forEach((session) => {
    const risk = sessionRisk(session);
    riskByVisitor.set(session.visitorId, Math.max(riskByVisitor.get(session.visitorId) ?? 0, risk.riskScore));
  });

  const riskScores = Array.from(riskByVisitor.values());
  const journeyRiskScores = visitorJourneys.map((visitor) => visitor.riskScore);
  const badVisitorIds = new Set(
    Array.from(riskByVisitor.entries())
      .filter(([, riskScore]) => riskScore > 3)
      .map(([visitorId]) => visitorId),
  );

  visitorJourneys.forEach((visitor) => {
    if (visitor.riskScore > 3) {
      badVisitorIds.add(visitor.visitorId);
    }
  });

  return {
    totals: {
      visitorsToday,
      totalVisitors,
      uniqueVisitors,
      sessions,
      pageViews,
      events,
      averageSessionDurationSeconds,
      bounceRate,
    },
    distributions: {
      dailyVisitors: groupByDate(sessionRows),
      browsers: asDistribution(browserGroups, "browser").slice(0, 10),
      operatingSystems: asDistribution(osGroups, "os").slice(0, 10),
      devices: asDistribution(deviceGroups, "deviceType").slice(0, 10),
      countries: asDistribution(countryGroups, "country").slice(0, 10),
      pages: asDistribution(pageGroups, "path").slice(0, 10),
    },
    threat: {
      vpnVisitors: sessionRows.filter((session) => session.vpn).length,
      proxyVisitors: sessionRows.filter((session) => session.proxy).length,
      torVisitors: sessionRows.filter((session) => session.tor).length,
      hostingIps: sessionRows.filter((session) => /hosting|cloud|provider/i.test(session.isp ?? "")).length,
      highestRiskScore: [...riskScores, ...journeyRiskScores].reduce((highest, riskScore) => Math.max(highest, riskScore), 0),
      badVisitors: badVisitorIds.size,
      repeatedFingerprints: toRepeated(fingerprintCounts),
      repeatedIps: toRepeated(ipCounts),
      highFrequencyVisitors: toRepeated(visitorEventCounts).filter((point) => point.value >= 10),
      botIndicators: sessionRows.filter((session) => session.deviceType === DeviceType.BOT || /\b(bot|headless|crawler)\b/i.test(session.userAgent ?? "")).length,
    },
    recent: {
      visitors: visitorJourneys,
      sessions: recentSessions,
      pageViews: recentPageViews,
    },
  };
}

export async function listVisitors(filters: AnalyticsFilters) {
  return prisma.visitor.findMany({
    take: filters.limit ?? 50,
    orderBy: { lastSeen: "desc" },
    include: {
      sessions: {
        take: 3,
        orderBy: { startedAt: "desc" },
        include: { _count: { select: { pageViews: true, events: true } } },
      },
    },
  });
}

export async function listSessions(filters: AnalyticsFilters) {
  return prisma.session.findMany({
    where: createSessionWhere(filters),
    take: filters.limit ?? 50,
    orderBy: { startedAt: "desc" },
    include: {
      visitor: true,
      pageViews: { take: 5, orderBy: { createdAt: "desc" } },
      _count: { select: { pageViews: true, events: true } },
    },
  });
}

export async function listPageViews(filters: AnalyticsFilters) {
  return prisma.pageView.findMany({
    where: createPageViewWhere(filters),
    take: filters.limit ?? 50,
    orderBy: { createdAt: "desc" },
    include: { session: true },
  });
}

export async function getFacet(name: "country" | "browser" | "os" | "page") {
  if (name === "page") {
    const rows = await prisma.pageView.groupBy({ by: ["path"], _count: { _all: true } });
    return asDistribution(rows, "path");
  }

  if (name === "country") {
    const rows = await prisma.session.groupBy({ by: ["country"], _count: { _all: true } });
    return asDistribution(rows, "country");
  }

  if (name === "browser") {
    const rows = await prisma.session.groupBy({ by: ["browser"], _count: { _all: true } });
    return asDistribution(rows, "browser");
  }

  const rows = await prisma.session.groupBy({ by: ["os"], _count: { _all: true } });
  return asDistribution(rows, "os");
}
