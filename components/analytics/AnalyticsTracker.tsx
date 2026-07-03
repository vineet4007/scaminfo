"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { UAParser } from "ua-parser-js";
import type { AnalyticsEventType, AnalyticsPayload } from "@/types/analytics";

type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

type ExtendedNavigator = Navigator & {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
  deviceMemory?: number;
  pdfViewerEnabled?: boolean;
};

function createId(prefix: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${prefix}_${random}`;
}

function storageAvailable(storage: Storage | undefined) {
  if (!storage) {
    return false;
  }

  try {
    const key = "__scaminfo_test__";
    storage.setItem(key, "1");
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getPersistentId() {
  if (!storageAvailable(window.localStorage)) {
    return createId("visitor");
  }

  const existing = window.localStorage.getItem("scaminfo_visitor_id");
  if (existing) {
    return existing;
  }

  const created = createId("visitor");
  window.localStorage.setItem("scaminfo_visitor_id", created);
  return created;
}

function getSessionId() {
  if (!storageAvailable(window.sessionStorage)) {
    return createId("session");
  }

  const existing = window.sessionStorage.getItem("scaminfo_session_id");
  if (existing) {
    return existing;
  }

  const created = createId("session");
  window.sessionStorage.setItem("scaminfo_session_id", created);
  return created;
}

function canvasFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 80;
    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    context.textBaseline = "top";
    context.font = "16px Arial";
    context.fillStyle = "#f43f5e";
    context.fillRect(0, 0, 240, 80);
    context.fillStyle = "#0f172a";
    context.fillText("ScamInfo canvas check", 12, 18);
    context.strokeStyle = "#14b8a6";
    context.arc(170, 42, 18, 0, Math.PI * 2);
    context.stroke();

    return canvas.toDataURL();
  } catch {
    return undefined;
  }
}

function webglFingerprint() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");

    if (!gl || !("getExtension" in gl)) {
      return {};
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");

    return {
      webglVendor: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)) : String(gl.getParameter(gl.VENDOR)),
      webglRenderer: debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER)),
    };
  } catch {
    return {};
  }
}

function detectFonts() {
  const baseFonts = ["monospace", "sans-serif", "serif"];
  const testFonts = ["Arial", "Verdana", "Times New Roman", "Courier New", "Georgia", "Inter", "Roboto"];
  const testText = "mmmmmmmmmmlli";
  const testSize = "72px";
  const body = document.body;
  const baseline: Record<string, { width: number; height: number }> = {};

  if (!body) {
    return [];
  }

  const measure = (fontFamily: string) => {
    const span = document.createElement("span");
    span.style.position = "absolute";
    span.style.left = "-9999px";
    span.style.fontSize = testSize;
    span.style.fontFamily = fontFamily;
    span.textContent = testText;
    body.appendChild(span);
    const size = { width: span.offsetWidth, height: span.offsetHeight };
    body.removeChild(span);
    return size;
  };

  baseFonts.forEach((font) => {
    baseline[font] = measure(font);
  });

  return testFonts.filter((font) =>
    baseFonts.some((baseFont) => {
      const size = measure(`"${font}",${baseFont}`);
      return size.width !== baseline[baseFont].width || size.height !== baseline[baseFont].height;
    }),
  );
}

function getBasePayload(type: AnalyticsEventType, metadata?: Record<string, unknown>): AnalyticsPayload {
  const extendedNavigator = navigator as ExtendedNavigator;
  const parser = new UAParser(navigator.userAgent).getResult();
  const connection = extendedNavigator.connection ?? extendedNavigator.mozConnection ?? extendedNavigator.webkitConnection;
  const webgl = webglFingerprint();

  return {
    visitorId: getPersistentId(),
    sessionId: getSessionId(),
    fingerprint: window.localStorage?.getItem("scaminfo_visitor_id") ?? undefined,
    referrer: document.referrer,
    currentPage: `${window.location.pathname}${window.location.search}`,
    pageTitle: document.title,
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString(),
    browser: {
      name: parser.browser.name,
      version: parser.browser.version,
      engine: parser.engine.name,
      engineVersion: parser.engine.version,
    },
    os: {
      name: parser.os.name,
      version: parser.os.version,
      platform: navigator.platform,
      cpuArchitecture: parser.cpu.architecture,
    },
    device: {
      type: parser.device.type ?? (matchMedia("(pointer: coarse)").matches ? "mobile" : "desktop"),
      vendor: parser.device.vendor,
      model: parser.device.model,
      maxTouchPoints: navigator.maxTouchPoints,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type,
      colorDepth: window.screen.colorDepth,
    },
    locale: {
      language: navigator.language,
      languages: Array.from(navigator.languages ?? []),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      utcOffset: new Date().getTimezoneOffset(),
    },
    features: {
      cookiesEnabled: navigator.cookieEnabled,
      javascriptEnabled: true,
      localStorage: storageAvailable(window.localStorage),
      sessionStorage: storageAvailable(window.sessionStorage),
      indexedDB: "indexedDB" in window,
      pdfViewer: Boolean(extendedNavigator.pdfViewerEnabled),
      serviceWorker: "serviceWorker" in navigator,
    },
    performance: {
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: extendedNavigator.deviceMemory,
      networkType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      saveData: connection?.saveData,
    },
    fingerprints: {
      canvas: canvasFingerprint(),
      webglVendor: webgl.webglVendor,
      webglRenderer: webgl.webglRenderer,
      fonts: detectFonts(),
    },
    event: { type, metadata },
  };
}

function sendAnalytics(type: AnalyticsEventType, metadata?: Record<string, unknown>, beacon = false) {
  const payload = getBasePayload(type, metadata);
  const body = JSON.stringify(payload);

  if (beacon && "sendBeacon" in navigator) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const maxScrollDepth = useRef(0);

  useEffect(() => {
    maxScrollDepth.current = 0;
    sendAnalytics("PAGE_LOAD", { source: "route-change" });
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest("a,button,[data-analytics-event]") : null;
      if (!target) {
        return;
      }

      const anchor = target instanceof HTMLAnchorElement ? target : target.closest("a");
      const href = anchor?.href;
      const isDownload = Boolean(anchor?.download) || /\.(pdf|zip|csv|json|xlsx|docx)$/i.test(href ?? "");
      const isExternal = href ? new URL(href, window.location.href).hostname !== window.location.hostname : false;

      sendAnalytics(isDownload ? "DOWNLOAD" : "CLICK", {
        tagName: target.tagName,
        label: (target.textContent ?? "").trim().slice(0, 120),
        href,
        external: isExternal,
      });
    };

    const onCopy = () => {
      sendAnalytics("COPY", { selectionLength: String(window.getSelection() ?? "").length });
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        return;
      }

      const depth = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      const bucket = Math.floor(depth / 25) * 25;

      if (bucket >= 25 && bucket > maxScrollDepth.current) {
        maxScrollDepth.current = bucket;
        sendAnalytics("SCROLL", { depth: bucket });
      }
    };

    const onUnload = () => {
      sendAnalytics("EXIT", { maxScrollDepth: maxScrollDepth.current }, true);
    };

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("copy", onCopy);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pagehide", onUnload);

    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("copy", onCopy);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", onUnload);
    };
  }, []);

  return null;
}
