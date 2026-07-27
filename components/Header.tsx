"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white/80 px-8 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search");
          }}
          className="hidden md:block"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search safety intelligence…"
              className="h-9 w-72 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </form>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-slate-500 transition hover:bg-gray-50 hover:text-slate-700">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button className="flex items-center gap-2 rounded-lg border border-gray-200 py-1 pl-1 pr-2.5 transition hover:bg-gray-50">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-xs font-semibold text-white">
            JC
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
