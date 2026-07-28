import Link from "next/link";
import {
  Database, AlertTriangle, FileWarning, Globe, ArrowUpRight,
  TrendingUp, ChevronRight, CircleDot,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import ActivityChart from "@/components/ActivityChart";
import SourceLogo from "@/components/SourceLogo";
import {
  items, stats, topSources, categoryCoverage, categoryColor,
  severityStyles, typeStyles,
} from "@/lib/data";

const iconMap = { Database, AlertTriangle, FileWarning, Globe };

const chartLegend = [
  { name: "Alerts", color: "bg-red-500" },
  { name: "ADs", color: "bg-orange-500" },
  { name: "Reports", color: "bg-blue-600" },
  { name: "Advisories", color: "bg-green-600" },
];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const recent = items.slice(0, 6);
  const maxCoverage = Math.max(...categoryCoverage.map((c) => c.count));

  return (
    <AppShell title="Dashboard" subtitle="Overview of your aviation safety intelligence activity">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = iconMap[s.icon as keyof typeof iconMap];
          const urgent = s.trend === "urgent";
          return (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.bg}`}>
                  {Icon ? <Icon className={`h-5 w-5 ${s.color}`} /> : null}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    urgent ? "bg-red-100 text-red-700" : "text-green-600"
                  }`}
                >
                  {urgent ? <AlertTriangle className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                  {s.change}
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{s.value}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{s.label}</span>
                <span className="text-xs text-slate-400">{s.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-width activity chart */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Safety Activity Over Time</h2>
            <p className="text-xs text-slate-500">Alerts, airworthiness directives, reports and advisories over the last 30 days</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {chartLegend.map((l) => (
              <span key={l.name} className="flex items-center gap-1.5 text-slate-500">
                <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                {l.name}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <ActivityChart />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent items */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Recent Items</h2>
              <p className="text-xs text-slate-500">Latest updates across all monitored sources</p>
            </div>
            <Link href="/browse" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recent.map((item) => {
              const sev = severityStyles[item.severity];
              return (
                <Link key={item.id} href={`/feed/${item.id}`} className="flex items-center gap-4 px-6 py-4 transition hover:bg-gray-50">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.sourceColor} text-xs font-bold text-white`}>
                    {item.sourceInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-900">{item.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span>{item.source}</span>
                      <span>·</span>
                      <span>{formatDate(item.date)}</span>
                      <span className={`hidden rounded px-1.5 py-0.5 font-medium sm:inline ${typeStyles[item.type]}`}>{item.type}</span>
                    </div>
                  </div>
                  <span className={`hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${sev.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
                    {item.severity}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Category coverage */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Category Coverage</h2>
            <Link href="/sources" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <p className="text-xs text-slate-500">Sources monitored per category</p>
          <div className="mt-4 space-y-3">
            {categoryCoverage.slice(0, 10).map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="truncate pr-2 font-medium text-slate-600">{c.category}</span>
                  <span className="shrink-0 font-semibold text-slate-400">{c.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${categoryColor(c.category)}`}
                    style={{ width: `${Math.max(8, (c.count / maxCoverage) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top sources grid */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Top Sources</h2>
            <p className="text-xs text-slate-500">Highest-activity safety sources this week</p>
          </div>
          <Link href="/sources" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
          {topSources.map((s) => (
            <div key={s.name} className="flex gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:shadow-sm">
              <SourceLogo domain={s.domain} initials={s.initials} color={s.color} name={s.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{s.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-green-600">
                    <TrendingUp className="h-3 w-3" />{s.trend}
                  </span>
                </div>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${categoryColor(s.category)}`}>
                  {s.category}
                </span>
                <p className="mt-1.5 line-clamp-2 text-xs text-slate-500">{s.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-600">{s.items} items</span>
                  <span className="flex items-center gap-1">
                    <CircleDot className={`h-3 w-3 ${s.status === "active" ? "text-green-500" : "text-slate-300"}`} />
                    {s.status === "active" ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
