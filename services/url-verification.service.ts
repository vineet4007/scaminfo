import { resolve4, resolve6, resolveAny } from "dns/promises";

type RdapEvent = {
  eventAction?: string;
  eventDate?: string;
};

type RdapResponse = {
  ldhName?: string;
  handle?: string;
  events?: RdapEvent[];
  entities?: Array<{
    roles?: string[];
    vcardArray?: unknown[];
  }>;
  nameservers?: Array<{ ldhName?: string }>;
  secureDNS?: { delegationSigned?: boolean };
};

type WebsiteIdentity = {
  fetched: boolean;
  status?: number;
  finalUrl?: string;
  title?: string;
  hasContactPage: boolean;
  hasAboutPage: boolean;
  hasPrivacyPolicy: boolean;
  hasTermsPage: boolean;
  emails: string[];
  phones: string[];
  addresses: string[];
  contactLinks: string[];
  socialLinks: string[];
};

type CommunityResult = {
  source: "reddit" | "web";
  provider: string;
  title: string;
  url: string;
  snippet?: string;
  community?: string;
  score?: number;
  postedAt?: string;
  matchedTerms: string[];
};

type CommunityReputation = {
  searched: boolean;
  automatedSources: string[];
  query: string;
  riskMentions: number;
  results: CommunityResult[];
  searchLinks: Array<{
    label: string;
    url: string;
  }>;
};

export type UrlVerificationResult = {
  input: string;
  normalizedUrl: string;
  hostname: string;
  rootDomain: string;
  checkedAt: string;
  riskScore: number;
  verdict: "low" | "medium" | "high";
  signals: Array<{
    label: string;
    status: "pass" | "warn" | "fail" | "info";
    detail: string;
  }>;
  dns: {
    hasDns: boolean;
    records: string[];
    addresses: string[];
  };
  https: {
    supported: boolean;
    status?: number;
    finalUrl?: string;
  };
  whois: {
    domain?: string;
    registrar?: string;
    createdAt?: string;
    updatedAt?: string;
    expiresAt?: string;
    domainAgeDays?: number;
    nameservers: string[];
    dnssec?: boolean;
    rawAvailable: boolean;
    contacts: Array<{
      roles: string[];
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
    }>;
  };
  siteIdentity: WebsiteIdentity;
  community: CommunityReputation;
};

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https URLs can be verified");
  }

  return url;
}

function getRootDomain(hostname: string) {
  const parts = hostname.toLowerCase().replace(/\.$/, "").split(".");

  if (parts.length <= 2) {
    return parts.join(".");
  }

  const secondLevelTlds = new Set(["co.in", "com.au", "co.uk", "org.uk", "gov.in", "ac.in"]);
  const lastTwo = parts.slice(-2).join(".");

  if (secondLevelTlds.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return lastTwo;
}

function getDomainLabel(rootDomain: string) {
  return rootDomain.split(".")[0]?.replace(/[-_]+/g, " ").trim() || rootDomain;
}

function daysBetween(start?: string, end = new Date()) {
  if (!start) {
    return undefined;
  }

  const date = new Date(start);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return Math.floor((end.getTime() - date.getTime()) / 86_400_000);
}

function extractRegistrar(response?: RdapResponse) {
  const registrar = response?.entities?.find((entity) => entity.roles?.includes("registrar"));
  const vcard = registrar?.vcardArray?.[1];

  if (!Array.isArray(vcard)) {
    return undefined;
  }

  const fn = vcard.find((entry) => Array.isArray(entry) && entry[0] === "fn");
  return Array.isArray(fn) ? String(fn[3] ?? "") : undefined;
}

function getVcardField(vcard: unknown, field: string) {
  if (!Array.isArray(vcard)) {
    return undefined;
  }

  const entry = vcard.find((item) => Array.isArray(item) && item[0] === field);

  if (!Array.isArray(entry)) {
    return undefined;
  }

  const value = entry[3];

  if (Array.isArray(value)) {
    return value.filter(Boolean).join(", ");
  }

  return value ? String(value) : undefined;
}

function extractRdapContacts(response?: RdapResponse) {
  return (
    response?.entities
      ?.map((entity) => {
        const vcard = entity.vcardArray?.[1];

        return {
          roles: entity.roles ?? [],
          name: getVcardField(vcard, "fn"),
          email: getVcardField(vcard, "email"),
          phone: getVcardField(vcard, "tel")?.replace(/^tel:/i, ""),
          address: getVcardField(vcard, "adr"),
        };
      })
      .filter((contact) => contact.name || contact.email || contact.phone || contact.address)
      .slice(0, 6) ?? []
  );
}

function extractEvent(response: RdapResponse | undefined, action: string) {
  return response?.events?.find((event) => event.eventAction?.toLowerCase().includes(action))?.eventDate;
}

async function getDns(hostname: string) {
  const [anyResult, ipv4Result, ipv6Result] = await Promise.allSettled([
    resolveAny(hostname),
    resolve4(hostname),
    resolve6(hostname),
  ]);

  const records =
    anyResult.status === "fulfilled"
      ? anyResult.value.map((record) => JSON.stringify(record)).slice(0, 20)
      : [];
  const addresses = [
    ...(ipv4Result.status === "fulfilled" ? ipv4Result.value : []),
    ...(ipv6Result.status === "fulfilled" ? ipv6Result.value : []),
  ];

  return { hasDns: records.length > 0 || addresses.length > 0, records, addresses };
}

async function getHttps(hostname: string) {
  try {
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });

    return { supported: true, status: response.status, finalUrl: response.url };
  } catch {
    return { supported: false };
  }
}

function unique(values: string[], limit = 8) {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const normalized = value.replace(/\s+/g, " ").trim();
    const key = normalized.toLowerCase();

    if (normalized && !seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  });

  return result.slice(0, limit);
}

function decodeHtmlEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function htmlToText(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function extractLinks(html: string, baseUrl: string) {
  const links: string[] = [];
  const linkPattern = /<a\b[^>]*\bhref=(["'])(.*?)\1/gi;
  let match = linkPattern.exec(html);

  while (match) {
    try {
      const href = decodeHtmlEntities(match[2]);
      const url = new URL(href, baseUrl);

      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:") {
        links.push(url.toString());
      }
    } catch {
      // Ignore malformed page links.
    }

    match = linkPattern.exec(html);
  }

  return unique(links, 30);
}

function extractAddresses(text: string) {
  const addressMatches = [
    ...text.matchAll(
      /\b\d{1,6}\s+[a-z0-9.,' -]{3,80}\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|floor|suite|unit|building|tower|sector|nagar|colony|market|plaza)\b[a-z0-9.,' -]{0,100}/gi,
    ),
    ...text.matchAll(/\b(?:registered office|office address|head office|corporate office|our address)\b[\s:.-]{0,20}.{10,160}/gi),
  ].map((match) => match[0]);

  return unique(addressMatches, 5);
}

function analyzeWebsiteIdentity(html: string, response: Response): WebsiteIdentity {
  const text = htmlToText(html);
  const links = extractLinks(html, response.url);
  const title = decodeHtmlEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "");
  const emails = unique(
    [
      ...html.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi),
      ...links.filter((link) => link.startsWith("mailto:")).map((link) => [link.replace(/^mailto:/i, "").split("?")[0]] as RegExpMatchArray),
    ].map((match) => String(match[0]).replace(/^mailto:/i, "").split("?")[0]),
    6,
  );
  const phones = unique(
    [
      ...text.matchAll(/(?:\+?\d[\d\s().-]{7,}\d)/g),
      ...links.filter((link) => link.startsWith("tel:")).map((link) => [link.replace(/^tel:/i, "")] as RegExpMatchArray),
    ]
      .map((match) => String(match[0]).replace(/^tel:/i, ""))
      .filter((phone) => phone.replace(/\D/g, "").length >= 8),
    6,
  );
  const contactLinks = links.filter((link) => /(contact|support|help|about|company|team)/i.test(link));
  const socialLinks = links.filter((link) => /(facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|youtube\.com|t\.me|telegram\.me)/i.test(link));

  return {
    fetched: true,
    status: response.status,
    finalUrl: response.url,
    title: title || undefined,
    hasContactPage: contactLinks.some((link) => /(contact|support|help)/i.test(link)),
    hasAboutPage: contactLinks.some((link) => /(about|company|team)/i.test(link)),
    hasPrivacyPolicy: links.some((link) => /privacy/i.test(link)),
    hasTermsPage: links.some((link) => /(terms|conditions|refund|return-policy)/i.test(link)),
    emails,
    phones,
    addresses: extractAddresses(text),
    contactLinks: unique(contactLinks, 8),
    socialLinks: unique(socialLinks, 8),
  };
}

async function getWebsiteIdentity(url: URL): Promise<WebsiteIdentity> {
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "ScamInfo URL verifier (+https://scaminfo.local)",
      },
      signal: AbortSignal.timeout(8000),
    });
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      return {
        fetched: true,
        status: response.status,
        finalUrl: response.url,
        hasContactPage: false,
        hasAboutPage: false,
        hasPrivacyPolicy: false,
        hasTermsPage: false,
        emails: [],
        phones: [],
        addresses: [],
        contactLinks: [],
        socialLinks: [],
      };
    }

    const html = await response.text();
    return analyzeWebsiteIdentity(html.slice(0, 1_000_000), response);
  } catch {
    return {
      fetched: false,
      hasContactPage: false,
      hasAboutPage: false,
      hasPrivacyPolicy: false,
      hasTermsPage: false,
      emails: [],
      phones: [],
      addresses: [],
      contactLinks: [],
      socialLinks: [],
    };
  }
}

async function getRdap(rootDomain: string) {
  try {
    const response = await fetch(`https://rdap.org/domain/${encodeURIComponent(rootDomain)}`, {
      headers: { accept: "application/rdap+json, application/json" },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return undefined;
    }

    return (await response.json()) as RdapResponse;
  } catch {
    return undefined;
  }
}

function scoreSignals(result: Omit<UrlVerificationResult, "riskScore" | "verdict" | "signals">) {
  const signals: UrlVerificationResult["signals"] = [];
  let riskScore = 0;
  const hostname = result.hostname;

  if (result.dns.hasDns) {
    signals.push({ label: "DNS", status: "pass", detail: "Domain resolves to DNS records." });
  } else {
    riskScore += 25;
    signals.push({ label: "DNS", status: "fail", detail: "No DNS records were found from this environment." });
  }

  if (result.https.supported) {
    signals.push({
      label: "HTTPS",
      status: "info",
      detail: `HTTPS responded with status ${result.https.status ?? "unknown"}. This only proves encryption, not business legitimacy.`,
    });
  } else {
    riskScore += 20;
    signals.push({ label: "HTTPS", status: "warn", detail: "HTTPS could not be reached. Do not submit forms or payments." });
  }

  if (result.whois.domainAgeDays !== undefined) {
    if (result.whois.domainAgeDays < 60) {
      riskScore += 35;
      signals.push({ label: "Domain age", status: "fail", detail: `Domain appears very new: ${result.whois.domainAgeDays} days old.` });
    } else if (result.whois.domainAgeDays < 180) {
      riskScore += 22;
      signals.push({ label: "Domain age", status: "warn", detail: `Domain is relatively new: ${result.whois.domainAgeDays} days old.` });
    } else if (result.whois.domainAgeDays < 365) {
      riskScore += 8;
      signals.push({ label: "Domain age", status: "warn", detail: `Domain is under one year old: ${result.whois.domainAgeDays} days old.` });
    } else {
      signals.push({ label: "Domain age", status: "pass", detail: `Domain age is about ${result.whois.domainAgeDays} days.` });
    }
  } else {
    riskScore += 8;
    signals.push({ label: "Domain age", status: "info", detail: "Domain creation date was not available from RDAP." });
  }

  if (/xn--/.test(hostname)) {
    riskScore += 15;
    signals.push({ label: "Internationalized domain", status: "warn", detail: "Hostname uses punycode. Confirm the intended brand carefully." });
  }

  if (hostname.split("-").length > 3 || /\d{4,}/.test(hostname)) {
    riskScore += 8;
    signals.push({ label: "Hostname pattern", status: "warn", detail: "Hostname contains unusual hyphen or number patterns." });
  }

  if (/(login|verify|secure|wallet|bonus|airdrop|support|claim|gift|refund)/i.test(hostname)) {
    riskScore += 8;
    signals.push({ label: "Keyword pattern", status: "warn", detail: "Hostname contains words often used in phishing lures." });
  }

  if (result.siteIdentity.fetched) {
    const hasDirectContact = result.siteIdentity.emails.length > 0 || result.siteIdentity.phones.length > 0 || result.siteIdentity.addresses.length > 0;

    if (hasDirectContact) {
      signals.push({
        label: "Public identity",
        status: "pass",
        detail: `Found ${result.siteIdentity.emails.length} email(s), ${result.siteIdentity.phones.length} phone number(s), and ${result.siteIdentity.addresses.length} address-like item(s) on the site.`,
      });
    } else {
      riskScore += 18;
      signals.push({
        label: "Public identity",
        status: "fail",
        detail: "No public email, phone number, or address-like business detail was detected on the homepage.",
      });
    }

    if (!result.siteIdentity.hasContactPage) {
      riskScore += 8;
      signals.push({ label: "Contact page", status: "warn", detail: "No obvious contact, support, or help page link was detected." });
    } else {
      signals.push({ label: "Contact page", status: "pass", detail: "A contact, support, or help page link was detected." });
    }

    if (!result.siteIdentity.hasAboutPage) {
      riskScore += 5;
      signals.push({ label: "About page", status: "warn", detail: "No obvious about, company, or team page link was detected." });
    }

    if (!result.siteIdentity.hasPrivacyPolicy || !result.siteIdentity.hasTermsPage) {
      riskScore += 7;
      signals.push({ label: "Policies", status: "warn", detail: "Privacy policy and terms/refund links were not both detected." });
    } else {
      signals.push({ label: "Policies", status: "pass", detail: "Privacy policy and terms/refund links were detected." });
    }
  } else {
    riskScore += 12;
    signals.push({ label: "Website content", status: "warn", detail: "Homepage content could not be fetched for identity checks." });
  }

  const registrantContacts = result.whois.contacts.filter((contact) => !contact.roles.includes("registrar"));

  if (registrantContacts.some((contact) => contact.email || contact.phone || contact.address)) {
    signals.push({ label: "RDAP contact", status: "info", detail: "RDAP exposes some non-registrar contact information." });
  } else {
    signals.push({ label: "RDAP contact", status: "info", detail: "RDAP does not expose public registrant phone, email, or address details." });
  }

  if (result.whois.registrar) {
    signals.push({ label: "Registrar", status: "info", detail: result.whois.registrar });
  }

  if (result.whois.nameservers.length) {
    signals.push({ label: "Nameservers", status: "info", detail: result.whois.nameservers.slice(0, 3).join(", ") });
  }

  const verdict: UrlVerificationResult["verdict"] = riskScore >= 55 ? "high" : riskScore >= 25 ? "medium" : "low";

  return { riskScore: Math.min(100, riskScore), verdict, signals };
}

export async function verifyUrl(input: string): Promise<UrlVerificationResult> {
  if (!input.trim()) {
    throw new Error("URL is required");
  }

  const url = normalizeUrl(input);
  const hostname = url.hostname.toLowerCase();
  const rootDomain = getRootDomain(hostname);
  const [dns, https, rdap, siteIdentity] = await Promise.all([getDns(hostname), getHttps(hostname), getRdap(rootDomain), getWebsiteIdentity(url)]);
  const createdAt = extractEvent(rdap, "registration") ?? extractEvent(rdap, "registered");
  const updatedAt = extractEvent(rdap, "last changed") ?? extractEvent(rdap, "last update");
  const expiresAt = extractEvent(rdap, "expiration") ?? extractEvent(rdap, "expiry");
  const base = {
    input,
    normalizedUrl: url.toString(),
    hostname,
    rootDomain,
    checkedAt: new Date().toISOString(),
    dns,
    https,
    whois: {
      domain: rdap?.ldhName ?? rdap?.handle ?? rootDomain,
      registrar: extractRegistrar(rdap),
      createdAt,
      updatedAt,
      expiresAt,
      domainAgeDays: daysBetween(createdAt),
      nameservers: rdap?.nameservers?.map((server) => server.ldhName).filter(Boolean) as string[] ?? [],
      dnssec: rdap?.secureDNS?.delegationSigned,
      rawAvailable: Boolean(rdap),
      contacts: extractRdapContacts(rdap),
    },
    siteIdentity,
  };
  const scored = scoreSignals(base);

  return { ...base, ...scored };
}
