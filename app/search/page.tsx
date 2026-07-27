"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import ItemCard from "@/components/ItemCard";
import { items, categories, Severity } from "@/lib/data";

const severities: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
const dateRanges = ["Any time", "Last 7 days", "Last 30 days", "Last 90 days"];
const allSources = Array.from(new Set(items.map((i) => i.source)));

function daysBetween(dateStr: string) {
  const now = new Date("2026-07-27T00:00:00").getTime();
  const d = new Date(dateStr + "T00:00:00").getTime();
  return (now - d) / (1000 * 60 * 60 * 24);
}

function SearchInner() {
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [sevs, setSevs] = useState<Severity[]>([]);
  const [range, setRange] = useState("Any time");
  const [srcs, setSrcs] = useState<string[]>([]);

  useEffect(() => {
    setQuery(params.get("q") ?? "");
  }, [params]);

  const toggle = <T,>(val: T, list: T[], set: (v: T[]) => void) =>
    set(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const matchQ =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.summary.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        i.source.toLowerCase().includes(q);
      const matchCat = !cats.length || cats.includes(i.category);
      const matchSev = !sevs.length || sevs.includes(i.severity);
      const matchSrc = !srcs.length || srcs.includes(i.source);
      let matchDate = true;
      if (range === "Last 7 days") matchDate = daysBetween(i.date) <= 7;
      else if (range === "Last 30 days") matchDate = daysBetween(i.date) <= 30;
      else if (range === "Last 90 days") matchDate = daysBetween(i.date) <= 90;
      return matchQ && matchCat && matchSev && matchSrc && matchDate;
    });
  }, [query, cats, sevs, srcs, range]);

  const activeFilters = cats.length + sevs.length + srcs.length + (range !== "Any time" ? 1 : 0);
  const clearAll = () => { setCats([]); setSevs([]); setSrcs([]); setRange("Any time"); };

  return (
    <>
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search alerts, advisories, reports, tags, sources…"
            className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-12 pr-10 text-[15px] outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters */}
        <aside className="lg:col-span-1">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
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

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{results.length}</span> result{results.length !== 1 ? "s" : ""}
              {query && <> for “<span className="font-medium text-slate-700">{query}</span>”</>}
            </p>
          </div>

          {results.length ? (
            <div className="grid grid-cols-1 gap-4">
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

export default function SearchPage() {
  return (
    <AppShell title="Search" subtitle="Find safety intelligence across all sources">
      <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
        <SearchInner />
      </Suspense>
    </AppShell>
  );
}
