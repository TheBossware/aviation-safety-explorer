import Link from "next/link";
import {
  FileText, Rss, AlertTriangle, Tag, ArrowUpRight, ArrowDownRight,
  TrendingUp, ChevronRight,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import ActivityChart from "@/components/ActivityChart";
import { items, stats, topSources, severityStyles } from "@/lib/data";

const iconMap = { FileText, Rss, AlertTriangle, Tag };

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const recent = items.slice(0, 6);

  return (
    <AppShell title="Dashboard" subtitle="Overview of your safety intelligence activity">
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = iconMap[s.icon as keyof typeof iconMap];
          return (
            <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${s.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {s.trend === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {s.change}
                </span>
              </div>
              <div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{s.value}</div>
              <div className="mt-1 text-sm text-slate-500">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Chart */}
        <div className="xl:col-span-2 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Activity Over Time</h2>
              <p className="text-xs text-slate-500">Items ingested and alerts raised over the last 30 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-blue-800" />Items</span>
              <span className="flex items-center gap-1.5 text-slate-500"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Alerts</span>
            </div>
          </div>
          <div className="mt-4">
            <ActivityChart />
          </div>
        </div>

        {/* Top sources */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Top Sources</h2>
            <Link href="/sources" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          <div className="mt-4 space-y-1">
            {topSources.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-gray-50">
                <span className="w-4 text-sm font-semibold text-slate-300">{i + 1}</span>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color} text-xs font-bold text-white`}>
                  {s.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-700">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.items} items</div>
                </div>
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${s.trend.startsWith("-") ? "text-red-500" : "text-green-600"}`}>
                  <TrendingUp className="h-3 w-3" />{s.trend}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent items */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Items</h2>
            <p className="text-xs text-slate-500">Latest updates across all monitored sources</p>
          </div>
          <Link href="/feed" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View feed <ChevronRight className="h-4 w-4" />
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
                  <div className="text-xs text-slate-400">{item.source} · {formatDate(item.date)}</div>
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
    </AppShell>
  );
}
