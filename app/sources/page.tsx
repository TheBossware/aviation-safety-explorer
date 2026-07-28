"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, ExternalLink, X, Search as SearchIcon, Rss,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { sources as initialSources, Source, categories } from "@/lib/data";

const palette = ["bg-blue-700", "bg-teal-600", "bg-indigo-600", "bg-orange-600", "bg-red-600", "bg-cyan-700"];

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SourcesPage() {
  const [list, setList] = useState<Source[]>(initialSources);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", url: "", category: categories[0] });

  const toggle = (id: string) =>
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));

  const remove = (id: string) => setList((prev) => prev.filter((s) => s.id !== id));

  const addSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    const initials = form.name.trim().slice(0, 2).toUpperCase();
    const domain = form.url.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    setList((prev) => [
      {
        id: `s${Date.now()}`,
        name: form.name.trim(),
        domain,
        url: form.url.trim().replace(/^https?:\/\//, ""),
        category: form.category,
        description: `User-added source in ${form.category}.`,
        status: "active" as const,
        itemCount: 0,
        active: true,
        lastUpdated: new Date().toISOString().slice(0, 10),
        items: 0,
        initials,
        color: palette[prev.length % palette.length],
        logo: "",
      },
      ...prev,
    ]);
    setForm({ name: "", url: "", category: categories[0] });
    setOpen(false);
  };

  const visible = list.filter(
    (s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.category.toLowerCase().includes(query.toLowerCase())
  );

  const activeCount = list.filter((s) => s.active).length;

  return (
    <AppShell title="Source Management" subtitle="Manage the feeds and publishers you monitor">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-xs text-slate-400">Total Sources</div>
            <div className="text-lg font-bold text-slate-900">{list.length}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-xs text-slate-400">Active</div>
            <div className="text-lg font-bold text-green-600">{activeCount}</div>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
            <div className="text-xs text-slate-400">Inactive</div>
            <div className="text-lg font-bold text-slate-400">{list.length - activeCount}</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-900"
        >
          <Plus className="h-4 w-4" /> Add Source
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="relative w-full max-w-xs">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter sources…"
              className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">URL</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Updated</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((s) => (
                <tr key={s.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color} text-xs font-bold text-white`}>
                        {s.initials}
                      </div>
                      <span className="font-medium text-slate-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <a href={`https://${s.url}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-blue-700">
                      {s.url} <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-slate-600">{s.category}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggle(s.id)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${s.active ? "bg-green-500" : "bg-gray-300"}`}
                      aria-label="Toggle status"
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${s.active ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <span className={`ml-2 text-xs font-medium ${s.active ? "text-green-600" : "text-slate-400"}`}>
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(s.lastUpdated)}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-700">{s.items.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(s.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">No sources match your filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add source modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Rss className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Add New Source</h3>
                  <p className="text-xs text-slate-500">Connect a feed to start monitoring</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={addSource} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Source Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. OSHA Newsroom"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Feed URL</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="e.g. osha.gov/news"
                  className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-900">
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
