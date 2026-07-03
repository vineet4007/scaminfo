import type { Metadata } from "next";
import Link from "next/link";
import { reportingResources } from "@/lib/content";

export const metadata: Metadata = {
  title: "Report a Scam",
  description: "Find official cybercrime and fraud reporting resources by country.",
};

export default function ReportScamPage() {
  return (
    <main className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Report safely</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Preserve evidence and report through official channels.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            If money, credentials, identity documents, or intimate images are involved, act quickly. Save records, stop contact, notify financial providers, and use official cybercrime portals.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {reportingResources.map((resource) => (
            <article key={`${resource.region}-${resource.title}`} className="rounded-lg border border-slate-200 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{resource.region}</p>
              <h2 className="mt-3 text-xl font-bold text-slate-950">{resource.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{resource.detail}</p>
              <Link
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                Open official site
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-amber-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-950">Evidence checklist</h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-slate-700 md:grid-cols-4">
            {["Screenshots and messages", "Phone numbers and emails", "Payment receipts and wallet addresses", "Profile URLs and website domains"].map((item) => (
              <p key={item} className="rounded-lg border border-amber-200 bg-white p-4">{item}</p>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
