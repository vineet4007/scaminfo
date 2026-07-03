import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy details for ScamInfo visitor analytics.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Privacy</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">First-party analytics with clear purpose.</h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
          <p>
            ScamInfo collects visitor, session, browser, device, page-view, and interaction data to understand educational reach and detect suspicious behavior.
          </p>
          <p>
            The implementation avoids third-party analytics scripts. Data is sent to this application&apos;s own API endpoint and stored in the configured database.
          </p>
          <p>
            Do not enter sensitive personal information into the URL verification tool. It is designed for domains and public website URLs, not passwords, tokens, or private links.
          </p>
        </div>
      </section>
    </main>
  );
}
