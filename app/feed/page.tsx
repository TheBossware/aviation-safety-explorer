"use client";

import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react";
import AppShell from "@/components/AppShell";
import ItemCard from "@/components/ItemCard";
import { items, ItemType } from "@/lib/data";

const tabs: { label: string; type: ItemType | "All" }[] = [
  { label: "All", type: "All" },
  { label: "Alerts", type: "Alert" },
  { label: "Warnings", type: "Warning" },
  { label: "Reports", type: "Report" },
  { label: "Advisories", type: "Advisory" },
];

const severityRank = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1 };

export default function FeedPage() {
  const [active, setActive] = useState<ItemType | "All">("All");
  const [sort, setSort] = useState("newest");

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: items.length };
    for (const t of ["Alert", "Warning", "Report", "Advisory"]) {
      c[t] = items.filter((i) => i.type === t).length;
    }
    return c;
  }, []);

  const filtered = useMemo(() => {
    let list = active === "All" ? [...items] : items.filter((i) => i.type === active);
    if (sort === "newest") list.sort((a, b) => b.date.localeCompare(a.date));
    else if (sort === "oldest") list.sort((a, b) => a.date.localeCompare(b.date));
    else if (sort === "severity") list.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
    return list;
  }, [active, sort]);

  return (
    <AppShell title="Content Feed" subtitle="Aggregated safety intelligence from all active sources">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-2">
        <div className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => setActive(t.type)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                active === t.type
                  ? "bg-blue-800 text-white shadow-sm"
                  : "text-slate-500 hover:bg-gray-50 hover:text-slate-700"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active === t.type ? "bg-white/20" : "bg-gray-100 text-slate-500"}`}>
                {counts[t.type] ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex items-center gap-2 pr-1">
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

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> items
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-700"><List className="h-4 w-4" /></span>
          <span className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400"><LayoutGrid className="h-4 w-4" /></span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </AppShell>
  );
}
