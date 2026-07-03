import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Admin login for the ScamInfo analytics dashboard.",
};

type LoginSearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: { searchParams?: LoginSearchParams }) {
  const params = searchParams ? await searchParams : {};
  const next = first(params.next) ?? "/dashboard";
  const error = first(params.error);

  return (
    <main className="bg-slate-50">
      <section className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <form action="/api/admin/login" method="post" className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-rose-600">Admin only</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Sign in to view analytics.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Dashboard data includes visitor IP addresses, locations, and behavioral timelines.
          </p>
          <input type="hidden" name="next" value={next} />
          <label htmlFor="password" className="mt-6 block text-sm font-bold text-slate-950">
            Admin password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="mt-2 min-h-12 w-full rounded-md border border-slate-300 px-4 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
            required
          />
          {error ? (
            <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
              Invalid admin password.
            </p>
          ) : null}
          <button type="submit" className="mt-5 w-full rounded-md bg-rose-600 px-5 py-3 text-sm font-bold text-white hover:bg-rose-700">
            Sign in
          </button>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in production. Local development uses password admin when ADMIN_PASSWORD is not set.
          </p>
        </form>
      </section>
    </main>
  );
}
