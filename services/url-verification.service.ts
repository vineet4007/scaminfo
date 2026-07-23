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
  scannedUrls: string[];
  pages: Array<{
    url: string;
    kind: "home" | "contact" | "about" | "policy";
    fetched: boolean;
    status?: number;
    title?: string;
    emails: string[];
    phones: string[];
    addresses: string[];
    error?: string;
  }>;
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

type SearchProviderResult = {
  provider: string;
  available: boolean;
  results: CommunityResult[];
};

type ReputationProviderResult = {
  provider: "Google Safe Browsing" | "VirusTotal" | "urlscan.io";
  status: "match" | "clear" | "unknown" | "not_configured" | "error";
  detail: string;
  matchedThreats: string[];
  url?: string;
};

type ReputationChecks = {
  checked: boolean;
  matches: number;
  providers: ReputationProviderResult[];
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
  reputation: ReputationChecks;
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

function buildCommunityQuery(rootDomain: string, hostname: string) {
  const domainLabel = getDomainLabel(rootDomain);

  return unique([rootDomain, hostname, domainLabel, `${domainLabel} scam`, `${domainLabel} review`, `${rootDomain} reddit`, `${rootDomain} quora`], 8).join(" ");
}

function buildCommunitySearchLinks(query: string, rootDomain: string) {
  const encodedQuery = encodeURIComponent(query);
  const quoraQuery = encodeURIComponent(`site:quora.com ${rootDomain} review`);

  return [
    { label: "Search Reddit", url: `https://www.reddit.com/search/?q=${encodedQuery}` },
    { label: "Search web", url: `https://duckduckgo.com/?q=${encodedQuery}` },
    { label: "Search Quora", url: `https://www.google.com/search?q=${quoraQuery}` },
  ];
}

function findMatchedTerms(text: string) {
  const lowerText = text.toLowerCase();
  const terms = ["scam", "fraud", "fake", "phish", "phishing", "ripoff", "complaint", "warning", "avoid", "suspicious", "not legit", "stay away", "chargeback", "stolen", "refund"];

  return terms.filter((term) => lowerText.includes(term));
}

function normalizeResultUrl(url?: string, fallback?: string) {
  const candidate = url ?? fallback;

  if (!candidate) {
    return undefined;
  }

  try {
    return new URL(candidate).toString();
  } catch {
    return undefined;
  }
}

function dedupeCommunityResults(results: CommunityResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = result.url.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function getRedditCommunityResults(query: string): Promise<SearchProviderResult> {
  try {
    const response = await fetch(`https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=all&limit=8&include_over_18=on&raw_json=1`, {
      headers: {
        accept: "application/json",
        "user-agent": "ScamInfo URL verifier (+https://scaminfo.local)",
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return { provider: "reddit", available: false, results: [] };
    }

    const data = (await response.json()) as {
      data?: {
        children?: Array<{
          data?: {
            title?: string;
            selftext?: string;
            subreddit_name_prefixed?: string;
            permalink?: string;
            url?: string;
            score?: number;
            created_utc?: number;
          };
        }>;
      };
    };

    const results =
      data.data?.children
        ?.map((child) => {
          const post = child.data;

          if (!post) {
            return undefined;
          }

          const title = post.title?.trim();
          const snippet = [post.title, post.selftext].filter(Boolean).join(" · ").trim();
          const matchedTerms = findMatchedTerms(`${post.title ?? ""} ${post.selftext ?? ""} ${post.subreddit_name_prefixed ?? ""}`);
          const url = normalizeResultUrl(post.permalink ? `https://www.reddit.com${post.permalink}` : undefined, post.url);

          if (!title || !url) {
            return undefined;
          }

          return {
            source: "reddit" as const,
            provider: "Reddit search",
            title,
            url,
            snippet: snippet || undefined,
            community: post.subreddit_name_prefixed,
            score: post.score,
            postedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
            matchedTerms,
          } as CommunityResult;
        })
        .filter((result): result is CommunityResult => Boolean(result)) ?? [];

    return { provider: "reddit", available: true, results: dedupeCommunityResults(results).slice(0, 5) };
  } catch {
    return { provider: "reddit", available: false, results: [] };
  }
}

async function getBraveCommunityResults(query: string): Promise<SearchProviderResult | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=8&search_lang=en`, {
      headers: {
        accept: "application/json",
        "x-subscription-token": apiKey,
      },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return { provider: "brave", available: false, results: [] };
    }

    const data = (await response.json()) as {
      web?: {
        results?: Array<{
          title?: string;
          url?: string;
          description?: string;
        }>;
      };
    };

    const results =
      data.web?.results
        ?.map((item) => {
          const url = normalizeResultUrl(item.url);
          const title = item.title?.trim();
          const snippet = item.description?.trim();

          if (!title || !url) {
            return undefined;
          }

          const matchedTerms = findMatchedTerms(`${title} ${snippet ?? ""}`);

          return {
            source: "web" as const,
            provider: "Brave Search",
            title,
            url,
            snippet: snippet || undefined,
            score: matchedTerms.length > 0 ? matchedTerms.length : undefined,
            matchedTerms,
          } as CommunityResult;
        })
        .filter((result): result is CommunityResult => Boolean(result)) ?? [];

    return { provider: "brave", available: true, results: dedupeCommunityResults(results).slice(0, 5) };
  } catch {
    return { provider: "brave", available: false, results: [] };
  }
}

async function getSerpApiCommunityResults(query: string): Promise<SearchProviderResult | null> {
  const apiKey = process.env.SERPAPI_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=8&api_key=${encodeURIComponent(apiKey)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(7000),
    });

    if (!response.ok) {
      return { provider: "serpapi", available: false, results: [] };
    }

    const data = (await response.json()) as {
      organic_results?: Array<{
        title?: string;
        link?: string;
        snippet?: string;
      }>;
    };

    const results =
      data.organic_results
        ?.map((item) => {
          const url = normalizeResultUrl(item.link);
          const title = item.title?.trim();
          const snippet = item.snippet?.trim();

          if (!title || !url) {
            return undefined;
          }

          const matchedTerms = findMatchedTerms(`${title} ${snippet ?? ""}`);

          return {
            source: "web" as const,
            provider: "SerpAPI",
            title,
            url,
            snippet: snippet || undefined,
            score: matchedTerms.length > 0 ? matchedTerms.length : undefined,
            matchedTerms,
          } as CommunityResult;
        })
        .filter((result): result is CommunityResult => Boolean(result)) ?? [];

    return { provider: "serpapi", available: true, results: dedupeCommunityResults(results).slice(0, 5) };
  } catch {
    return { provider: "serpapi", available: false, results: [] };
  }
}

async function getCommunityReputation(url: URL): Promise<CommunityReputation> {
  const rootDomain = getRootDomain(url.hostname);
  const query = buildCommunityQuery(rootDomain, url.hostname);
  const searchLinks = buildCommunitySearchLinks(query, rootDomain);
  const searches = await Promise.all([getRedditCommunityResults(query), getBraveCommunityResults(query), getSerpApiCommunityResults(query)]);
  const activeSearches = searches.filter(Boolean) as SearchProviderResult[];
  const results = dedupeCommunityResults(activeSearches.flatMap((search) => search.results));
  const automatedSources = unique(activeSearches.filter((search) => search.available).map((search) => search.provider));
  const riskMentions = results.filter((result) => result.matchedTerms.length > 0).length;

  return {
    searched: automatedSources.length > 0,
    automatedSources,
    query,
    riskMentions,
    results,
    searchLinks,
  };
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

function classifyIdentityPage(url: string): "home" | "contact" | "about" | "policy" {
  if (/(contact|support|help)/i.test(url)) {
    return "contact";
  }

  if (/(about|company|team)/i.test(url)) {
    return "about";
  }

  if (/(privacy|terms|conditions|refund|return-policy|returns)/i.test(url)) {
    return "policy";
  }

  return "home";
}

function emptyWebsiteIdentity(url?: string, kind: "home" | "contact" | "about" | "policy" = "home", error?: string): WebsiteIdentity {
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
    scannedUrls: url ? [url] : [],
    pages: url
      ? [
          {
            url,
            kind,
            fetched: false,
            emails: [],
            phones: [],
            addresses: [],
            error,
          },
        ]
      : [],
  };
}

function analyzeWebsiteIdentity(html: string, response: Response, kind: "home" | "contact" | "about" | "policy" = "home"): WebsiteIdentity {
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
    hasContactPage: kind === "contact" || contactLinks.some((link) => /(contact|support|help)/i.test(link)),
    hasAboutPage: kind === "about" || contactLinks.some((link) => /(about|company|team)/i.test(link)),
    hasPrivacyPolicy: /privacy/i.test(response.url) || links.some((link) => /privacy/i.test(link)),
    hasTermsPage: /(terms|conditions|refund|return-policy|returns)/i.test(response.url) || links.some((link) => /(terms|conditions|refund|return-policy|returns)/i.test(link)),
    emails,
    phones,
    addresses: extractAddresses(text),
    contactLinks: unique(contactLinks, 8),
    socialLinks: unique(socialLinks, 8),
    scannedUrls: [response.url],
    pages: [
      {
        url: response.url,
        kind,
        fetched: true,
        status: response.status,
        title: title || undefined,
        emails,
        phones,
        addresses: extractAddresses(text),
      },
    ],
  };
}

function mergeWebsiteIdentities(identities: WebsiteIdentity[]): WebsiteIdentity {
  const fetchedPages = identities.flatMap((identity) => identity.pages).filter((page) => page.fetched);
  const firstFetched = identities.find((identity) => identity.fetched);

  return {
    fetched: identities.some((identity) => identity.fetched),
    status: firstFetched?.status,
    finalUrl: firstFetched?.finalUrl,
    title: firstFetched?.title,
    hasContactPage: identities.some((identity) => identity.hasContactPage),
    hasAboutPage: identities.some((identity) => identity.hasAboutPage),
    hasPrivacyPolicy: identities.some((identity) => identity.hasPrivacyPolicy),
    hasTermsPage: identities.some((identity) => identity.hasTermsPage),
    emails: unique(identities.flatMap((identity) => identity.emails), 12),
    phones: unique(identities.flatMap((identity) => identity.phones), 12),
    addresses: unique(identities.flatMap((identity) => identity.addresses), 8),
    contactLinks: unique(identities.flatMap((identity) => identity.contactLinks), 12),
    socialLinks: unique(identities.flatMap((identity) => identity.socialLinks), 12),
    scannedUrls: unique(identities.flatMap((identity) => identity.scannedUrls), 12),
    pages: identities.flatMap((identity) => identity.pages).slice(0, 12),
  };
}

function buildIdentityCrawlTargets(baseUrl: URL, homepageHtml: string, responseUrl: string) {
  const homepageLinks = extractLinks(homepageHtml, responseUrl);
  const sameOriginLinks = homepageLinks
    .map((link) => {
      try {
        return new URL(link);
      } catch {
        return undefined;
      }
    })
    .filter((link): link is URL => link !== undefined && link.origin === baseUrl.origin);
  const pathTargets = [
    "/contact",
    "/contact-us",
    "/support",
    "/help",
    "/about",
    "/about-us",
    "/company",
    "/privacy",
    "/privacy-policy",
    "/terms",
    "/terms-and-conditions",
    "/refund",
    "/refund-policy",
    "/returns",
    "/return-policy",
  ].map((path) => new URL(path, baseUrl.origin));
  const linkedTargets = sameOriginLinks.filter((link) => /(contact|support|help|about|company|team|privacy|terms|conditions|refund|return-policy|returns)/i.test(link.pathname));
  const targets = [...linkedTargets, ...pathTargets]
    .map((target) => {
      target.hash = "";
      target.search = "";
      return target;
    })
    .filter((target) => target.toString() !== responseUrl);
  const seen = new Set<string>();

  return targets
    .filter((target) => {
      const key = target.toString().toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

async function fetchIdentityPage(url: URL, kind: "home" | "contact" | "about" | "policy"): Promise<{ identity: WebsiteIdentity; html?: string }> {
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
      const identity = emptyWebsiteIdentity(response.url, kind);

      return {
        identity: {
          ...identity,
          fetched: true,
        status: response.status,
        finalUrl: response.url,
          scannedUrls: [response.url],
          pages: identity.pages.map((page) => ({ ...page, fetched: true, status: response.status })),
        },
      };
    }

    const html = await response.text();
    return { identity: analyzeWebsiteIdentity(html.slice(0, 1_000_000), response, kind), html };
  } catch {
    return { identity: emptyWebsiteIdentity(url.toString(), kind, "Could not fetch page") };
  }
}

async function getWebsiteIdentity(url: URL): Promise<WebsiteIdentity> {
  const homepage = await fetchIdentityPage(url, "home");

  if (!homepage.html) {
    return homepage.identity;
  }

  const crawlTargets = buildIdentityCrawlTargets(url, homepage.html, homepage.identity.finalUrl ?? url.toString());
  const crawledPages = await Promise.all(crawlTargets.map((target) => fetchIdentityPage(target, classifyIdentityPage(target.toString()))));

  return mergeWebsiteIdentities([homepage.identity, ...crawledPages.map((page) => page.identity)]);
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

  if (result.community.results.length > 0) {
    if (result.community.riskMentions >= 3) {
      riskScore += 35;
      signals.push({
        label: "Community reputation",
        status: "fail",
        detail: `Automated community search found ${result.community.riskMentions} risk-related mention(s) across ${result.community.results.length} result(s).`,
      });
    } else if (result.community.riskMentions > 0) {
      riskScore += 22;
      signals.push({
        label: "Community reputation",
        status: "warn",
        detail: `Automated community search found ${result.community.riskMentions} risk-related mention(s). Open the linked Reddit/search results and review manually.`,
      });
    } else {
      signals.push({
        label: "Community reputation",
        status: "info",
        detail: `Automated community search found ${result.community.results.length} result(s) without obvious scam or complaint keywords. Absence of reports is not proof of safety.`,
      });
    }

    signals.push({
      label: "Community sources",
      status: "info",
      detail: `Automated checks ran through ${result.community.automatedSources.join(", ")}.`,
    });
  } else {
    signals.push({
      label: "Community reputation",
      status: "info",
      detail: "No clear community results were found automatically; manual Reddit, web, and Quora search links are still provided.",
    });
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
  const [dns, https, rdap, siteIdentity, community] = await Promise.all([
    getDns(hostname),
    getHttps(hostname),
    getRdap(rootDomain),
    getWebsiteIdentity(url),
    getCommunityReputation(url),
  ]);
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
    community,
    reputation: {
      checked: false,
      matches: 0,
      providers: [],
    },
  };
  const scored = scoreSignals(base);

  return { ...base, ...scored };
}
