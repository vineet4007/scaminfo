export type AnalyticsEventType =
  | "PAGE_LOAD"
  | "PAGE_VIEW"
  | "CLICK"
  | "SCROLL"
  | "COPY"
  | "DOWNLOAD"
  | "EXIT";

export type AnalyticsPayload = {
  visitorId: string;
  sessionId: string;
  fingerprint?: string;
  referrer?: string;
  currentPage: string;
  pageTitle?: string;
  url?: string;
  hostname?: string;
  timestamp?: string;
  browser?: {
    name?: string;
    version?: string;
    engine?: string;
    engineVersion?: string;
  };
  os?: {
    name?: string;
    version?: string;
    platform?: string;
    cpuArchitecture?: string;
  };
  device?: {
    type?: string;
    vendor?: string;
    model?: string;
    maxTouchPoints?: number;
  };
  screen?: {
    width?: number;
    height?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    pixelRatio?: number;
    orientation?: string;
    colorDepth?: number;
  };
  locale?: {
    language?: string;
    languages?: string[];
    timezone?: string;
    utcOffset?: number;
  };
  features?: {
    cookiesEnabled?: boolean;
    javascriptEnabled?: boolean;
    localStorage?: boolean;
    sessionStorage?: boolean;
    indexedDB?: boolean;
    pdfViewer?: boolean;
    serviceWorker?: boolean;
  };
  performance?: {
    hardwareConcurrency?: number;
    deviceMemory?: number;
    networkType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  };
  fingerprints?: {
    canvas?: string;
    webglVendor?: string;
    webglRenderer?: string;
    audio?: string;
    fonts?: string[];
  };
  event?: {
    type: AnalyticsEventType;
    metadata?: Record<string, unknown>;
  };
};

export type AnalyticsRequestContext = {
  ip?: string;
  userAgent?: string;
  acceptLanguage?: string;
};

export type AnalyticsFilters = {
  from?: Date;
  to?: Date;
  country?: string;
  browser?: string;
  device?: string;
  page?: string;
  limit?: number;
};

export type DistributionPoint = {
  label: string;
  value: number;
};

export type VisitorJourneyEvent = {
  id: string;
  type: AnalyticsEventType;
  createdAt: string;
  page?: string;
  label?: string;
  href?: string;
  depth?: number;
  metadata?: Record<string, unknown>;
};

export type VisitorJourney = {
  visitorId: string;
  firstSeen: string;
  lastSeen: string;
  totalSessions: number;
  riskScore: number;
  riskStatus: "normal" | "bad";
  riskReasons: string[];
  latestLocation: {
    ip?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    organization?: string;
    asn?: string;
  };
  sessions: Array<{
    id: string;
    ip?: string;
    browser?: string;
    browserVersion?: string;
    os?: string;
    osVersion?: string;
    deviceType: string;
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isp?: string;
    organization?: string;
    asn?: string;
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    riskScore: number;
    riskReasons: string[];
    startedAt: string;
    endedAt?: string;
    pageViews: Array<{
      id: string;
      path: string;
      title?: string;
      referrer?: string;
      createdAt: string;
    }>;
    events: VisitorJourneyEvent[];
  }>;
};

export type DashboardData = {
  totals: {
    visitorsToday: number;
    totalVisitors: number;
    uniqueVisitors: number;
    sessions: number;
    pageViews: number;
    events: number;
    averageSessionDurationSeconds: number;
    bounceRate: number;
  };
  distributions: {
    dailyVisitors: DistributionPoint[];
    browsers: DistributionPoint[];
    operatingSystems: DistributionPoint[];
    devices: DistributionPoint[];
    countries: DistributionPoint[];
    pages: DistributionPoint[];
  };
  threat: {
    vpnVisitors: number;
    proxyVisitors: number;
    torVisitors: number;
    hostingIps: number;
    highestRiskScore: number;
    badVisitors: number;
    repeatedFingerprints: DistributionPoint[];
    repeatedIps: DistributionPoint[];
    highFrequencyVisitors: DistributionPoint[];
    botIndicators: number;
  };
  recent: {
    visitors: VisitorJourney[];
    sessions: Array<Record<string, unknown>>;
    pageViews: Array<Record<string, unknown>>;
  };
};
