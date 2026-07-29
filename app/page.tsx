"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Database, AlertTriangle, FileWarning, Globe, ArrowUpRight,
  ChevronRight, Radio,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import ActivityChart from "@/components/ActivityChart";
import SourceLogo from "@/components/SourceLogo";
import { categoryColor, severityStyles, typeStyles, ContentItem } from "@/lib/data";

const iconMap = { Database, AlertTriangle, FileWarning, Globe };

const chartLegend = [
  { name: "Alerts", color: "bg-red-500" },
  { name: "ADs", color: "bg-orange-500" },
  { name: "Reports", color: "bg-blue-600" },
  { name: "Advisories", color: "bg-green-600" },
];

// Visual template for the four stat cards — values are filled in at runtime.
const statMeta = [
  { icon: "Database", color: "text-blue-700", bg: "bg-blue-50", label: "Total Items", sub: "in database" },
  { icon: "FileWarning", color: "text-orange-700", bg: "bg-orange-50", label: "ADs Tracked", sub: "airworthiness" },
  { icon: "Globe", color: "text-teal-700", bg: "bg-teal-50", label: "Sources", sub: "monitored" },
  { icon: "AlertTriangle", color: "text-indigo-700", bg: "bg-indigo-50", label: "Categories", sub: "topics" },
];

interface TopSource {
  name: string;
  count: number;
  initials: string;
  color: string;
  category: string;
}

function formatDate(d: string) {
  const dt = new Date(d.length <= 10 ? d + "T00:00:00" : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ConnectionBadge({ live }: { live: boolean }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        Connected to live data
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
      <span className="h-2 w-2 rounded-full bg-slate-400" />
      Demo mode
    </span>
  );
}

// Aggregate dashboard metrics from the raw item list (client-side).
function computeDashboard(items: ContentItem[]) {
  const total = items.length;
  const sources = new Set(items.map((i) => i.source)).size;
  const adCount = items.filter(
    (i) => i.category === "Airworthiness Directive" || (i.tags || []).includes("AD")
  ).length;
  const categories = new Set(items.map((i) => i.category)).size;

  const recentItems = items.slice(0, 6);

  const bySource: Record<string, TopSource> = {};
  items.forEach((it) => {
    const key = it.source;
    if (!bySource[key]) {
      bySource[key] = {
        name: key,
        count: 0,
        initials: it.sourceInitials,
        color: it.sourceColor,
        category: it.category,
      };
    }
    bySource[key].count += 1;
  });
  const topSources = Object.values(bySource)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const byCat: Record<string, number> = {};
  items.forEach((it) => {
    byCat[it.category] = (byCat[it.category] || 0) + 1;
  });
  const categoryCoverage = Object.entries(byCat)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const stats = [
    { ...statMeta[0], value: String(total), change: "total", trend: "up" },
    { ...statMeta[1], value: String(adCount), change: adCount > 0 ? "active" : "none", trend: adCount > 0 ? "urgent" : "up" },
    { ...statMeta[2], value: String(sources), change: "active", trend: "up" },
    { ...statMeta[3], value: String(categories), change: "covered", trend: "up" },
  ];

  return { stats, recentItems, topSources, categoryCoverage };
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-5 h-8 w-56 rounded-full bg-gray-100" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="h-11 w-11 rounded-lg bg-gray-100" />
            <div className="mt-4 h-8 w-20 rounded bg-gray-100" />
            <div className="mt-2 h-4 w-28 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 h-80 rounded-xl border border-gray-100 bg-white shadow-sm" />
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="h-96 rounded-xl border border-gray-100 bg-white shadow-sm xl:col-span-2" />
        <div className="h-96 rounded-xl border border-gray-100 bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setIsLive(Boolean(data.isLive));
        setLastUpdated(data.lastUpdated ?? null);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { stats, recentItems, topSources, categoryCoverage } = computeDashboard(items);
  const maxCoverage = Math.max(1, ...categoryCoverage.map((c) => c.count));

  return (
    <AppShell title="Dashboard" subtitle="Overview of your aviation safety intelligence activity">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Connection status */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <ConnectionBadge live={isLive} />
            {lastUpdated ? (
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Radio className="h-3.5 w-3.5" />
                Last updated {formatDate(lastUpdated)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Showing sample data — configure the API for live updates</span>
            )}
          </div>

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
                {recentItems.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-slate-400">No items available.</div>
                ) : (
                  recentItems.map((item) => {
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
                  })
                )}
              </div>
            </div>

            {/* Category coverage */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">Category Coverage</h2>
                <Link href="/sources" className="text-xs font-medium text-blue-600 hover:text-blue-700">View all</Link>
              </div>
              <p className="text-xs text-slate-500">Items per category</p>
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
                <p className="text-xs text-slate-500">Most active sources in the feed</p>
              </div>
              <Link href="/sources" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {topSources.map((s, i) => (
                <div key={`${s.name}-${i}`} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:border-blue-200 hover:shadow-sm">
                  <SourceLogo domain={s.name} initials={s.initials} color={s.color} name={s.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">{s.name}</div>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${categoryColor(s.category)}`}>
                      {s.category}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-lg font-bold text-slate-900">{s.count}</div>
                    <div className="text-[11px] text-slate-400">items</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
