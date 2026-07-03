"use client";

import { FormEvent, useState } from "react";
import type { UrlVerificationResult } from "@/services/url-verification.service";

const statusClass = {
  pass: "border-teal-200 bg-teal-50 text-teal-950",
  warn: "border-amber-200 bg-amber-50 text-amber-950",
  fail: "border-rose-200 bg-rose-50 text-rose-950",
  info: "border-slate-200 bg-slate-50 text-slate-800",
};

export function VerifyUrlForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<UrlVerificationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/verify-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Verification failed");
      }

      setResult(data as UrlVerificationResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <label htmlFor="url" className="text-sm font-bold text-slate-950">
          Website URL
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="example.com or https://example.com/login"
            className="min-h-12 flex-1 rounded-md border border-slate-300 px-4 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-rose-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "Checking" : "Check"}
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The tool checks DNS, HTTPS, domain age, registrar data, nameservers, public contact details, policies, and suspicious hostname patterns.
        </p>
        {error ? <p className="mt-4 rounded-md bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      </form>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {result ? (
          <div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Result</p>
                <h2 className="mt-2 break-words text-2xl font-black text-slate-950">{result.hostname}</h2>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 text-center">
                <p className="text-3xl font-black text-slate-950">{result.riskScore}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{result.verdict} risk</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <span className="block font-bold text-slate-950">Domain age</span>
                {result.whois.domainAgeDays !== undefined ? `${result.whois.domainAgeDays} days` : "Unknown"}
              </p>
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <span className="block font-bold text-slate-950">Registrar</span>
                {result.whois.registrar ?? "Unknown"}
              </p>
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <span className="block font-bold text-slate-950">HTTPS</span>
                {result.https.supported ? `Supported (${result.https.status ?? "status unknown"})` : "Not reached"}
              </p>
              <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                <span className="block font-bold text-slate-950">DNS records</span>
                {result.dns.hasDns ? `${result.dns.records.length + result.dns.addresses.length} found` : "None found"}
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-black text-slate-950">Public identity found on site</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">Email</span>
                  {result.siteIdentity.emails.length ? result.siteIdentity.emails.join(", ") : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">Phone</span>
                  {result.siteIdentity.phones.length ? result.siteIdentity.phones.join(", ") : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700 sm:col-span-2">
                  <span className="block font-bold text-slate-950">Address-like details</span>
                  {result.siteIdentity.addresses.length ? result.siteIdentity.addresses.join(" | ") : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">Contact page</span>
                  {result.siteIdentity.hasContactPage ? "Detected" : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">About page</span>
                  {result.siteIdentity.hasAboutPage ? "Detected" : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">Privacy policy</span>
                  {result.siteIdentity.hasPrivacyPolicy ? "Detected" : "Not detected"}
                </p>
                <p className="rounded-md bg-white p-3 text-sm text-slate-700">
                  <span className="block font-bold text-slate-950">Terms / refund</span>
                  {result.siteIdentity.hasTermsPage ? "Detected" : "Not detected"}
                </p>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                HTTPS is cheap and common now. A real business should still make its identity, support route, and policies easy to verify.
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              {result.signals.map((signal) => (
                <article key={`${signal.label}-${signal.detail}`} className={`rounded-md border p-4 ${statusClass[signal.status]}`}>
                  <h3 className="font-bold">{signal.label}</h3>
                  <p className="mt-1 text-sm leading-6">{signal.detail}</p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center text-center">
            <div>
              <p className="text-lg font-bold text-slate-950">Enter a URL to see verification signals.</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                A low score is not a guarantee of safety. Use the result as a structured starting point for manual review.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
