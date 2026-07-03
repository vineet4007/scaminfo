import { z } from "zod";

const optionalString = z.string().trim().min(1).max(2000).optional();
const optionalShortString = z.string().trim().min(1).max(255).optional();
const optionalLargeString = z.string().trim().min(1).max(250000).optional();
const optionalNumber = z.number().finite().optional();

export const analyticsEventTypeSchema = z.enum([
  "PAGE_LOAD",
  "PAGE_VIEW",
  "CLICK",
  "SCROLL",
  "COPY",
  "DOWNLOAD",
  "EXIT",
]);

export const analyticsPayloadSchema = z.object({
  visitorId: z.string().trim().min(8).max(200),
  sessionId: z.string().trim().min(8).max(200),
  fingerprint: optionalShortString,
  referrer: z.string().max(2000).optional().nullable(),
  currentPage: z.string().trim().min(1).max(2000),
  pageTitle: z.string().max(500).optional().nullable(),
  url: optionalString,
  hostname: optionalShortString,
  timestamp: z.string().datetime().optional(),
  browser: z
    .object({
      name: optionalShortString,
      version: optionalShortString,
      engine: optionalShortString,
      engineVersion: optionalShortString,
    })
    .optional(),
  os: z
    .object({
      name: optionalShortString,
      version: optionalShortString,
      platform: optionalShortString,
      cpuArchitecture: optionalShortString,
    })
    .optional(),
  device: z
    .object({
      type: optionalShortString,
      vendor: optionalShortString,
      model: optionalShortString,
      maxTouchPoints: z.number().int().nonnegative().optional(),
    })
    .optional(),
  screen: z
    .object({
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      viewportWidth: z.number().int().positive().optional(),
      viewportHeight: z.number().int().positive().optional(),
      pixelRatio: optionalNumber,
      orientation: optionalShortString,
      colorDepth: z.number().int().positive().optional(),
    })
    .optional(),
  locale: z
    .object({
      language: optionalShortString,
      languages: z.array(z.string().max(80)).max(20).optional(),
      timezone: optionalShortString,
      utcOffset: optionalNumber,
    })
    .optional(),
  features: z
    .object({
      cookiesEnabled: z.boolean().optional(),
      javascriptEnabled: z.boolean().optional(),
      localStorage: z.boolean().optional(),
      sessionStorage: z.boolean().optional(),
      indexedDB: z.boolean().optional(),
      pdfViewer: z.boolean().optional(),
      serviceWorker: z.boolean().optional(),
    })
    .optional(),
  performance: z
    .object({
      hardwareConcurrency: z.number().int().positive().optional(),
      deviceMemory: optionalNumber,
      networkType: optionalShortString,
      downlink: optionalNumber,
      rtt: optionalNumber,
      saveData: z.boolean().optional(),
    })
    .optional(),
  fingerprints: z
    .object({
      canvas: optionalLargeString,
      webglVendor: optionalShortString,
      webglRenderer: optionalShortString,
      audio: optionalLargeString,
      fonts: z.array(z.string().max(120)).max(100).optional(),
    })
    .optional(),
  event: z
    .object({
      type: analyticsEventTypeSchema,
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export const dashboardQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  country: z.string().optional(),
  browser: z.string().optional(),
  device: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type AnalyticsPayloadInput = z.infer<typeof analyticsPayloadSchema>;
