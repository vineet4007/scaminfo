import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About the ScamInfo education and analytics platform.",
};

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">About ScamInfo</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">A practical scam-awareness and analytics workspace.</h1>
        <div className="mt-6 space-y-5 text-base leading-8 text-slate-600">
          <p>
            ScamInfo is built as a public education site with a first-party analytics layer for awareness teams. It teaches common scam patterns while measuring traffic, sessions, events, and suspicious access signals.
          </p>
          <p>
            The goal is simple: make safer choices easier, then help campaign owners understand which pages people read, where users drop off, and what technical signals may indicate risky or automated traffic.
          </p>
        </div>
      </section>
    </main>
  );
}
