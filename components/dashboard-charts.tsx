"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardData, DistributionPoint } from "@/types/analytics";

const chartColors = ["#e11d48", "#0f766e", "#f59e0b", "#334155", "#2563eb", "#7c3aed", "#16a34a", "#ea580c"];

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-500">
      {label}
    </div>
  );
}

function hasData(points: DistributionPoint[]) {
  return points.some((point) => point.value > 0);
}

export function DashboardCharts({ distributions }: { distributions: DashboardData["distributions"] }) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Daily visitors</h2>
        <div className="mt-4 h-64">
          {hasData(distributions.dailyVisitors) ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={distributions.dailyVisitors}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#e11d48" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No daily visitor data yet" />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Browser distribution</h2>
        <div className="mt-4 h-64">
          {hasData(distributions.browsers) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributions.browsers} dataKey="value" nameKey="label" outerRadius={92} label>
                  {distributions.browsers.map((entry, index) => (
                    <Cell key={entry.label} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No browser data yet" />
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">OS and device mix</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="h-64">
            {hasData(distributions.operatingSystems) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.operatingSystems}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No OS data yet" />
            )}
          </div>
          <div className="h-64">
            {hasData(distributions.devices) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributions.devices}>
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No device data yet" />
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">Country heat map</h2>
        <div className="mt-4 h-64">
          {hasData(distributions.countries) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributions.countries} layout="vertical" margin={{ left: 32 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={92} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No country data yet" />
          )}
        </div>
      </section>
    </div>
  );
}
