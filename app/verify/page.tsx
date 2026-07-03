import type { Metadata } from "next";
import { VerifyUrlForm } from "@/components/verify-url-form";

export const metadata: Metadata = {
  title: "Verify Website Tool",
  description: "Check a website URL for DNS, HTTPS, domain age, registrar, WHOIS, public contact details, and basic reputation signals.",
};

export default function VerifyPage() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">Verify website</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Inspect the signals behind a suspicious URL.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
            Check domain age, registrar information, HTTPS reachability, DNS records, public contact details, policies, and suspicious patterns before you trust a site.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <VerifyUrlForm />
      </section>
    </main>
  );
}
