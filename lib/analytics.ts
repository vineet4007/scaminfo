import { createHash } from "crypto";
import { DeviceType, EventType } from "@prisma/client";
import { UAParser } from "ua-parser-js";
import type { AnalyticsEventType, AnalyticsPayload, AnalyticsRequestContext } from "@/types/analytics";

type IpApiResponse = {
  status?: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  proxy?: boolean;
  hosting?: boolean;
  mobile?: boolean;
};

type IpInfoResponse = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  postal?: string;
  timezone?: string;
  org?: string;
};

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeEventType(type?: AnalyticsEventType): EventType {
  if (!type) {
    return EventType.PAGE_LOAD;
  }

  return EventType[type] ?? EventType.PAGE_LOAD;
}

export function mapDeviceType(type?: string, userAgent?: string): DeviceType {
  const normalized = type?.toLowerCase();

  if (normalized?.includes("bot") || /\b(bot|crawler|spider|slurp|headless)\b/i.test(userAgent ?? "")) {
    return DeviceType.BOT;
  }

  if (normalized?.includes("tablet")) {
    return DeviceType.TABLET;
  }

  if (normalized?.includes("mobile") || normalized?.includes("phone")) {
    return DeviceType.MOBILE;
  }

  if (normalized?.includes("desktop")) {
    return DeviceType.DESKTOP;
  }

  return DeviceType.UNKNOWN;
}

export function parseUserAgent(userAgent?: string) {
  if (!userAgent) {
    return {};
  }

  const result = new UAParser(userAgent).getResult();

  return {
    browser: result.browser.name,
    browserVersion: result.browser.version,
    engine: result.engine.name,
    engineVersion: result.engine.version,
    os: result.os.name,
    osVersion: result.os.version,
    cpuArchitecture: result.cpu.architecture,
    deviceType: result.device.type,
    deviceVendor: result.device.vendor,
    deviceModel: result.device.model,
  };
}

export function createFallbackFingerprint(payload: AnalyticsPayload, context: AnalyticsRequestContext): string {
  return hashValue(
    [
      payload.fingerprint,
      payload.visitorId,
      payload.browser?.name,
      payload.browser?.version,
      payload.os?.name,
      payload.os?.version,
      payload.screen?.width,
      payload.screen?.height,
      payload.screen?.pixelRatio,
      payload.locale?.timezone,
      context.userAgent,
    ]
      .filter(Boolean)
      .join("|"),
  );
}

export function isPrivateIp(ip?: string): boolean {
  if (!ip) {
    return false;
  }

  const normalized = ip.trim().replace(/^::ffff:/i, "");

  return /^(10\.|127\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.|::1$|localhost$|fc00:|fd00:|fe80:)/i.test(normalized);
}

export type IpEnrichment = {
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
  hosting: boolean;
  mobile?: boolean;
  bot: boolean;
};

export function inferNetworkRisk(ip: string | undefined, userAgent: string | undefined): IpEnrichment {
  const ua = userAgent ?? "";
  const privateIp = isPrivateIp(ip);
  const bot = /\b(bot|crawler|spider|slurp|headless|uptime|monitor)\b/i.test(ua);
  const hosting = /\b(aws|amazon|google cloud|azure|digitalocean|ovh|linode|hetzner|vultr|contabo)\b/i.test(ua);

  return {
    country: privateIp ? "Local network" : undefined,
    countryCode: privateIp ? "LOCAL" : undefined,
    region: undefined,
    city: undefined,
    postalCode: undefined,
    latitude: undefined,
    longitude: undefined,
    timezone: undefined,
    isp: privateIp ? "Private network" : hosting ? "Possible hosting provider" : undefined,
    organization: undefined,
    asn: undefined,
    vpn: false,
    proxy: /\b(proxy|vpn)\b/i.test(ua),
    tor: /\btor\b/i.test(ua),
    hosting,
    bot,
  };
}

function parseIpInfoLocation(loc?: string) {
  const [lat, lon] = loc?.split(",").map(Number) ?? [];

  return {
    latitude: Number.isFinite(lat) ? lat : undefined,
    longitude: Number.isFinite(lon) ? lon : undefined,
  };
}

function splitOrg(value?: string) {
  if (!value) {
    return {};
  }

  const [asn, ...rest] = value.split(" ");
  return {
    asn,
    organization: rest.join(" ") || value,
  };
}

export async function enrichIpAddress(ip: string | undefined, userAgent: string | undefined): Promise<IpEnrichment> {
  const inferred = inferNetworkRisk(ip, userAgent);

  if (!ip || isPrivateIp(ip)) {
    return inferred;
  }

  try {
    if (process.env.IPINFO_TOKEN) {
      const response = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${process.env.IPINFO_TOKEN}`, {
        signal: AbortSignal.timeout(2500),
      });

      if (response.ok) {
        const data = (await response.json()) as IpInfoResponse;
        const org = splitOrg(data.org);
        const coords = parseIpInfoLocation(data.loc);

        return {
          ...inferred,
          countryCode: data.country ?? inferred.countryCode,
          region: data.region ?? inferred.region,
          city: data.city ?? inferred.city,
          postalCode: data.postal ?? inferred.postalCode,
          latitude: coords.latitude ?? inferred.latitude,
          longitude: coords.longitude ?? inferred.longitude,
          timezone: data.timezone ?? inferred.timezone,
          isp: data.org ?? inferred.isp,
          organization: org.organization ?? inferred.organization,
          asn: org.asn ?? inferred.asn,
        };
      }
    }

    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,mobile`,
      { signal: AbortSignal.timeout(2500) },
    );

    if (!response.ok) {
      return inferred;
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== "success") {
      return inferred;
    }

    return {
      ...inferred,
      country: data.country ?? inferred.country,
      countryCode: data.countryCode ?? inferred.countryCode,
      region: data.regionName ?? inferred.region,
      city: data.city ?? inferred.city,
      postalCode: data.zip ?? inferred.postalCode,
      latitude: data.lat ?? inferred.latitude,
      longitude: data.lon ?? inferred.longitude,
      timezone: data.timezone ?? inferred.timezone,
      isp: data.isp ?? inferred.isp,
      organization: data.org ?? inferred.organization,
      asn: data.as ?? inferred.asn,
      proxy: data.proxy ?? inferred.proxy,
      hosting: data.hosting ?? inferred.hosting,
      mobile: data.mobile,
    };
  } catch {
    return inferred;
  }
}

export function safeDate(value?: string): Date {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}
