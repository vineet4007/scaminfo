import Image from "next/image";
import Link from "next/link";
import { educationCards, latestAlerts, scamCategories, scamStats } from "@/lib/content";

export default function Home() {
  return (
    <main>
      <section className="overflow-hidden bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-rose-600">Scam awareness platform</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Learn the scam before it learns you.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              ScamInfo combines practical education with first-party visitor analytics, so awareness campaigns can teach safer decisions and understand how people engage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/verify" className="rounded-md bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700">
                Verify a website
              </Link>
              <Link href="/dashboard" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-white">
                View analytics
              </Link>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <Image
              src="/scaminfo-hero.png"
              alt="Illustration of scam website verification and visitor analytics on a laptop"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-px overflow-hidden px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          {scamStats.map((stat) => (
            <article key={stat.label} className="bg-slate-50 p-6">
              <p className="text-3xl font-black text-slate-950">{stat.value}</p>
              <h2 className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">{stat.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{stat.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Featured guides</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Start with the highest-risk scams</h2>
            </div>
            <Link href="/report-scam" className="text-sm font-bold text-rose-700 hover:text-rose-800">
              Reporting resources
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {scamCategories.map((category) => (
              <Link key={category.href} href={category.href} className="rounded-lg border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md">
                <h3 className="text-lg font-bold text-slate-950">{category.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{category.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Latest alerts</p>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {latestAlerts.map((alert) => (
                <p key={alert} className="py-4 text-sm leading-6 text-slate-700">{alert}</p>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            {educationCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-slate-200 p-5">
                <h3 className="font-bold text-slate-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Build safer browsing habits.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Use the URL verification tool, read the guides, and review dashboard patterns to improve future awareness campaigns.
            </p>
          </div>
          <Link href="/verify" className="w-fit rounded-md bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
            Run a URL check
          </Link>
        </div>
      </section>
    </main>
  );
}
