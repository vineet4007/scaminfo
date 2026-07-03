import Link from "next/link";
import { navItems, scamCategories } from "@/lib/content";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-slate-950">
          <span className="flex size-10 items-center justify-center rounded-lg bg-rose-600 text-lg font-black text-white">
            SI
          </span>
          <span>
            <span className="block text-base font-bold tracking-tight">ScamInfo</span>
            <span className="block text-xs font-medium text-slate-500">Awareness and visitor analytics</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-700">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <p className="text-lg font-bold text-white">ScamInfo</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
            Educational guidance and first-party analytics for understanding scam awareness traffic, suspicious behavior, and safer online decisions.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {scamCategories.map((category) => (
            <Link key={category.href} href={category.href} className="group">
              <span className="block text-sm font-semibold text-white group-hover:text-rose-200">{category.title}</span>
              <span className="mt-2 block text-xs leading-5 text-slate-400">{category.summary}</span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
