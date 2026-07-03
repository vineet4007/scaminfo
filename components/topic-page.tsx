import Link from "next/link";
import type { TopicContent } from "@/lib/content";

export function TopicPage({ topic }: { topic: TopicContent }) {
  return (
    <main>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">{topic.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {topic.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{topic.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/verify" className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
                Check a URL
              </Link>
              <Link href="/report-scam" className="rounded-md border border-slate-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
                Report resources
              </Link>
            </div>
          </div>
          <div className="mt-10 border-l-4 border-amber-400 bg-amber-50 p-6 lg:mt-0">
            <p className="text-base leading-7 text-slate-800">{topic.intro}</p>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          {topic.sections.map((section) => (
            <article key={section.title} className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-rose-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Scam examples</p>
            <div className="mt-5 grid gap-4">
              {topic.examples.map((example) => (
                <article key={example.title} className="rounded-lg border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-950">{example.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{example.description}</p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">FAQ</p>
            <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
              {topic.faqs.map((faq) => (
                <article key={faq.question} className="py-5">
                  <h3 className="font-bold text-slate-950">{faq.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
