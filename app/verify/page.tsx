import type { Metadata } from "next";
import { VerifyUrlForm } from "@/components/verify-url-form";

export const metadata: Metadata = {
  title: "Verify Website Tool",
  description: "Check a website URL using DNS, HTTPS, WHOIS/RDAP registration data, public website details, community reports, and explainable risk signals.",
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
            Review DNS and HTTPS checks, WHOIS/RDAP registration data, public contact details, policies, community reports, and suspicious patterns—with the source and reasoning shown for each assessment.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
            These signals support your investigation; they do not certify that a website is safe or fraudulent. Verify important claims independently and use your own discretion.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <VerifyUrlForm />
      </section>
    </main>
  );
}
