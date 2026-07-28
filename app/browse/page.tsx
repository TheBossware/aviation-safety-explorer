"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, X, ChevronDown, SlidersHorizontal } from "lucide-react";
import AppShell from "@/components/AppShell";
import ItemCard from "@/components/ItemCard";
import { items, categories, ItemType, Severity } from "@/lib/data";

const tabs: { label: string; type: ItemType | "All" }[] = [
  { label: "All", type: "All" },
  { label: "Alerts", type: "Alert" },
  { label: "Warnings", type: "Warning" },
  { label: "Reports", type: "Report" },
  { label: "Advisories", type: "Advisory" },
];

const severities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const dateRanges = ["Any time", "Last 7 days", "Last 30 days", "Last 90 days"];
const allSources = Array.from(new Set(items.map((i) => i.source)));
const severityRank: Record<Severity, number> = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };

function daysBetween(dateStr: string) {
  const now = new Date("2026-07-27T00:00:00").getTime();
  const d = new Date(dateStr + "T00:00:00").getTime();
  return (now - d) / (1000 * 60 * 60 * 24);
}

function BrowseInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<ItemType | "All">("All");
  const [sort, setSort] = useState("newest");
  const [sevs, setSevs] = useState<Severity[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [srcs, setSrcs] = useState<string[]>([]);
  const [range, setRange] = useState("Any time");

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const toggle = <T,>(val: T, list: T[], set: (v: T[]) => void) =>
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    for (const t of ["Alert", "Warning", "Report", "Advisory"]) c[t] = items.filter((i) => i.type === t).length;
    return c;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((i) => {
      const matchQ =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        i.source.toLowerCase().includes(q);
      const matchTab = active === "All" || i.type === active;
      const matchSev = !sevs.length || sevs.includes(i.severity);
      const matchCat = !cats.length || cats.includes(i.category);
      const matchSrc = !srcs.length || srcs.includes(i.source);
      let matchDate = true;
      if (range === "Last 7 days") matchDate = daysBetween(i.date) <= 7;
      else if (range === "Last 30 days") matchDate = daysBetween(i.date) <= 30;
      else if (range === "Last 90 days") matchDate = daysBetween(i.date) <= 90;
      return matchQ && matchTab && matchSev && matchCat && matchSrc && matchDate;
    });
    if (sort === "newest") list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === "oldest") list = [...list].sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === "severity") list = [...list].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
    return list;
  }, [query, active, sort, sevs, cats, srcs, range]);

  const activeFilters = sevs.length + cats.length + srcs.length + (range !== "Any time" ? 1 : 0);
  const clearAll = () => { setSevs([]); setCats([]); setSrcs([]); setRange("Any time"); };

  return (
    <>
      {/* Prominent search bar */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="Search safety intelligence..."
          className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-13 pr-12 text-[15px] shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          style={{ paddingLeft: "3.25rem" }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter row: tabs left, severity + sort right */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-2 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setActive(t.type)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                active === t.type ? "bg-blue-800 text-white shadow-sm" : "text-slate-500 hover:bg-gray-50 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active === t.type ? "bg-white/20" : "bg-gray-100 text-slate-500"}`}>
                {counts[t.type] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-1">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="severity">By severity</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main: sidebar filters + results */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
              {activeFilters > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-blue-600 hover:text-blue-700">Clear all</button>
              )}
            </div>

            <FilterGroup title="Severity">
              {severities.map((s) => (
                <Check key={s} label={s} checked={sevs.includes(s)} onChange={() => toggle(s, sevs, setSevs)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Category">
              {categories.map((c) => (
                <Check key={c} label={c} checked={cats.includes(c)} onChange={() => toggle(c, cats, setCats)} />
              ))}
            </FilterGroup>

            <FilterGroup title="Date Range">
              {dateRanges.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-slate-600">
                  <input type="radio" name="range" checked={range === r} onChange={() => setRange(r)} className="h-4 w-4 accent-blue-700" />
                  {r}
                </label>
              ))}
            </FilterGroup>

            <FilterGroup title="Source" last>
              {allSources.map((s) => (
                <Check key={s} label={s} checked={srcs.includes(s)} onChange={() => toggle(s, srcs, setSrcs)} />
              ))}
            </FilterGroup>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{results.length}</span> of{" "}
              <span className="font-semibold text-slate-800">{items.length}</span> results
              {query && <> for “<span className="font-medium text-slate-700">{query}</span>”</>}
            </p>
          </div>

          {results.length ? (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {results.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white py-20 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <SearchIcon className="h-6 w-6 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-700">No results found</p>
              <p className="mt-1 text-sm text-slate-400">Try adjusting your search terms or filters.</p>
              {(query || activeFilters > 0 || active !== "All") && (
                <button
                  onClick={() => { setQuery(""); setActive("All"); clearAll(); }}
                  className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50"
                >
                  Reset all
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterGroup({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`mt-4 ${last ? "" : "border-b border-gray-100 pb-4"}`}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</div>
      <div className="max-h-48 space-y-0.5 overflow-y-auto">{children}</div>
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-slate-600">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-blue-700" />
      {label}
    </label>
  );
}

export default function BrowsePage() {
  return (
    <AppShell title="Browse" subtitle="Search and filter safety intelligence across all sources">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <BrowseInner />
      </Suspense>
    </AppShell>
  );
}
