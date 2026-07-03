import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardCharts } from "@/components/dashboard-charts";
import { isAdminSession } from "@/lib/admin-auth";
import { getDashboard } from "@/services/analytics.service";
import type { AnalyticsFilters, DashboardData, VisitorJourney } from "@/types/analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Analytics Dashboard",
  description: "Admin-only visitor, session, page-view, event, and threat-intelligence analytics for ScamInfo.",
};

type DashboardSearchParams = Promise<Record<string, string | string[] | undefined>>;

const emptyDashboard: DashboardData = {
  totals: {
    visitorsToday: 0,
    totalVisitors: 0,
    uniqueVisitors: 0,
    sessions: 0,
    pageViews: 0,
    events: 0,
    averageSessionDurationSeconds: 0,
    bounceRate: 0,
  },
  distributions: {
    dailyVisitors: [],
    browsers: [],
    operatingSystems: [],
    devices: [],
    countries: [],
    pages: [],
  },
  threat: {
    vpnVisitors: 0,
    proxyVisitors: 0,
    torVisitors: 0,
    hostingIps: 0,
    highestRiskScore: 0,
    badVisitors: 0,
    repeatedFingerprints: [],
    repeatedIps: [],
    highFrequencyVisitors: [],
    botIndicators: 0,
  },
  recent: {
    visitors: [],
    sessions: [],
    pageViews: [],
  },
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDate(value: unknown) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function locationLine(journey: VisitorJourney) {
  const location = journey.latestLocation;
  const cityRegion = [location.city, location.region].filter(Boolean).join(", ");
  const country = [location.country, location.countryCode ? `(${location.countryCode})` : undefined].filter(Boolean).join(" ");

  return [cityRegion, country].filter(Boolean).join(" - ") || "Location unavailable";
}

function coordsLine(latitude?: number, longitude?: number) {
  if (latitude === undefined || longitude === undefined) {
    return "Coordinates unavailable";
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function eventClass(type: string) {
  if (type === "PAGE_LOAD" || type === "PAGE_VIEW") {
    return "bg-teal-50 text-teal-800";
  }

  if (type === "CLICK" || type === "DOWNLOAD") {
    return "bg-rose-50 text-rose-800";
  }

  return "bg-slate-100 text-slate-700";
}

function riskLabel(score: number) {
  return score > 3 ? "Bad" : "Normal";
}

function riskClass(score: number) {
  return score > 3 ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <h2 className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{label}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function SimpleList({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 rounded-md bg-slate-50 p-3 text-sm">
              <span className="min-w-0 truncate font-semibold text-slate-700">{item.label}</span>
              <span className="font-black text-slate-950">{item.value}</span>
            </div>
          ))
        ) : (
          <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-500">No data yet</p>
        )}
      </div>
    </section>
  );
}

function VisitorJourneyCard({ journey }: { journey: VisitorJourney }) {
  const latest = journey.latestLocation;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Visitor journey</p>
          <h2 className="mt-2 truncate text-xl font-black text-slate-950">{journey.visitorId}</h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black ${riskClass(journey.riskScore)}`}>
              Risk {journey.riskScore}/10 - {riskLabel(journey.riskScore)}
            </span>
            <span className="text-xs font-semibold text-slate-500">Anything above 3 is bad.</span>
          </div>
          {journey.riskReasons.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {journey.riskReasons.map((reason) => (
                <span key={reason} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {reason}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This visitor came from <span className="font-bold text-slate-950">{locationLine(journey)}</span> and generated{" "}
            <span className="font-bold text-slate-950">
              {journey.sessions.reduce((total, session) => total + session.events.length, 0)}
            </span>{" "}
            tracked events across {journey.sessions.length} session{journey.sessions.length === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="grid shrink-0 gap-2 text-sm sm:grid-cols-2 xl:w-[520px]">
          <p className="rounded-md bg-slate-50 p-3">
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">IP address</span>
            <span className="mt-1 block font-semibold text-slate-950">{latest.ip ?? "Unknown"}</span>
          </p>
          <p className="rounded-md bg-slate-50 p-3">
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Coordinates</span>
            <span className="mt-1 block font-semibold text-slate-950">{coordsLine(latest.latitude, latest.longitude)}</span>
          </p>
          <p className="rounded-md bg-slate-50 p-3">
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">ISP / org</span>
            <span className="mt-1 block truncate font-semibold text-slate-950">{latest.organization ?? latest.isp ?? "Unknown"}</span>
          </p>
          <p className="rounded-md bg-slate-50 p-3">
            <span className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Last seen</span>
            <span className="mt-1 block font-semibold text-slate-950">{formatDate(journey.lastSeen)}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {journey.sessions.map((session) => (
          <section key={session.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <h3 className="font-bold text-slate-950">{session.browser ?? "Unknown browser"} / {session.os ?? "Unknown OS"}</h3>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <p><span className="font-semibold text-slate-500">Device:</span> {session.deviceType}</p>
                  <p><span className="font-semibold text-slate-500">Started:</span> {formatDate(session.startedAt)}</p>
                  <p><span className="font-semibold text-slate-500">Country:</span> {session.country ?? "Unknown"}</p>
                  <p><span className="font-semibold text-slate-500">City:</span> {session.city ?? "Unknown"}</p>
                  <p><span className="font-semibold text-slate-500">Latitude:</span> {session.latitude ?? "Unknown"}</p>
                  <p><span className="font-semibold text-slate-500">Longitude:</span> {session.longitude ?? "Unknown"}</p>
                  <p>
                    <span className="font-semibold text-slate-500">Risk:</span>{" "}
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${riskClass(session.riskScore)}`}>
                      {session.riskScore}/10 - {riskLabel(session.riskScore)}
                    </span>
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.vpn ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">VPN</span> : null}
                  {session.proxy ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Proxy</span> : null}
                  {session.tor ? <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-900">Tor</span> : null}
                  {session.riskReasons.map((reason) => (
                    <span key={reason} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-white p-3">
                  <h4 className="text-sm font-bold text-slate-950">Pages visited</h4>
                  <div className="mt-3 space-y-2">
                    {session.pageViews.length ? session.pageViews.map((pageView) => (
                      <div key={pageView.id} className="rounded-md border border-slate-100 p-2 text-sm">
                        <p className="truncate font-semibold text-slate-950">{pageView.path}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(pageView.createdAt)}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No page views stored.</p>
                    )}
                  </div>
                </div>
                <div className="rounded-md bg-white p-3">
                  <h4 className="text-sm font-bold text-slate-950">Event timeline</h4>
                  <div className="mt-3 space-y-2">
                    {session.events.length ? session.events.map((event) => (
                      <div key={event.id} className="rounded-md border border-slate-100 p-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${eventClass(event.type)}`}>{event.type}</span>
                          <span className="min-w-0 truncate font-semibold text-slate-950">{event.label ?? event.page ?? "Event"}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{formatDate(event.createdAt)}</p>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No events stored.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams?: DashboardSearchParams }) {
  const params = searchParams ? await searchParams : {};

  if (!(await isAdminSession())) {
    redirect(`/admin/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const filters: AnalyticsFilters = {
    from: toDate(first(params.from)),
    to: toDate(first(params.to)),
    country: first(params.country),
    browser: first(params.browser),
    device: first(params.device),
    page: first(params.page),
    limit: 50,
  };
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const stringValue = first(value);
    if (stringValue) {
      query.set(key, stringValue);
    }
  });

  let data = emptyDashboard;
  let dashboardError = "";

  try {
    data = await getDashboard(filters);
  } catch (error) {
    dashboardError = error instanceof Error ? error.message : "Dashboard data is unavailable";
  }

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Admin analytics</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Visitor journeys, IP location, and risk signals.</h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
                Group each visitor with their IP address, country, city, coordinates, sessions, page views, and event timeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={`/api/export?resource=sessions&format=csv&${query.toString()}`} className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800">
                Export CSV
              </Link>
              <Link href={`/api/export?resource=sessions&format=json&${query.toString()}`} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100">
                Export JSON
              </Link>
              <form action="/api/admin/logout" method="post">
                <button className="rounded-md border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50">Logout</button>
              </form>
            </div>
          </div>

          <form className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-6">
            <input name="from" type="date" defaultValue={first(params.from)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="to" type="date" defaultValue={first(params.to)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="country" placeholder="Country" defaultValue={first(params.country)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input name="browser" placeholder="Browser" defaultValue={first(params.browser)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <select name="device" defaultValue={first(params.device) ?? ""} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Any device</option>
              <option value="DESKTOP">Desktop</option>
              <option value="MOBILE">Mobile</option>
              <option value="TABLET">Tablet</option>
              <option value="BOT">Bot</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
            <button className="rounded-md bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Apply filters</button>
          </form>

          {dashboardError ? (
            <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Dashboard is showing an empty state because the database is not reachable: {dashboardError}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Visitors today" value={data.totals.visitorsToday} detail="Unique visitors seen since local midnight." />
          <StatCard label="Total visitors" value={data.totals.totalVisitors} detail="All tracked visitor IDs in the database." />
          <StatCard label="Sessions" value={data.totals.sessions} detail="Browsing sessions in the selected window." />
          <StatCard label="Page views" value={data.totals.pageViews} detail="Tracked page loads and page-view events." />
          <StatCard label="Events" value={data.totals.events} detail="Click, scroll, copy, download, exit, and load events." />
          <StatCard label="Avg duration" value={formatDuration(data.totals.averageSessionDurationSeconds)} detail="Estimated from session start and exit signals." />
          <StatCard label="Bounce rate" value={`${data.totals.bounceRate}%`} detail="Sessions with one or fewer page views." />
          <StatCard label="Bot indicators" value={data.threat.botIndicators} detail="Sessions flagged by UA or device heuristics." />
          <StatCard label="Highest risk score" value={`${data.threat.highestRiskScore}/10`} detail="Anything above 3 is bad." />
          <StatCard label="Bad visitors" value={data.threat.badVisitors} detail="Visitors in the selected window with risk above 3." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <DashboardCharts distributions={data.distributions} />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-4 lg:px-8">
        <StatCard label="VPN visitors" value={data.threat.vpnVisitors} detail="Visitors with VPN flags from enrichment rules." />
        <StatCard label="Proxy visitors" value={data.threat.proxyVisitors} detail="Visitors with proxy indicators." />
        <StatCard label="Tor visitors" value={data.threat.torVisitors} detail="Visitors with Tor indicators." />
        <StatCard label="Hosting IPs" value={data.threat.hostingIps} detail="Sessions associated with hosting provider hints." />
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <SimpleList title="Popular pages" items={data.distributions.pages} />
        <SimpleList title="Repeated IPs" items={data.threat.repeatedIps} />
        <SimpleList title="High-frequency visitors" items={data.threat.highFrequencyVisitors} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Visitor detail</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Grouped visitor journeys</h2>
        </div>
        <div className="grid gap-5">
          {data.recent.visitors.length ? (
            data.recent.visitors.map((journey) => <VisitorJourneyCard key={journey.visitorId} journey={journey} />)
          ) : (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">No visitor journeys yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
