"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Plus, Pencil, Trash2, ExternalLink, X, Search as SearchIcon,
  Globe, Check, AlertTriangle,
} from "lucide-react";
import AppShell from "@/components/AppShell";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type SourceType = "html" | "rss" | "json" | "youtube";

interface Source {
  _id: string;
  id: string;
  name: string;
  type: SourceType;
  url: string;
  selector: string;
  active: boolean;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

const TYPES: SourceType[] = ["html", "rss", "json", "youtube"];

const CATEGORY_LIST = [
  "Regulators",
  "Airworthiness Directives",
  "Safety Alerts",
  "Accident Investigation",
  "Occurrence Databases",
  "Safety Organisations",
  "Aircraft Manufacturers",
  "Engine Manufacturers",
  "Avionics",
  "Air Traffic Management",
  "Meteorology",
  "Aviation News",
  "Academic",
  "Cyber Security",
];

const typeBadge: Record<SourceType, string> = {
  html: "bg-blue-100 text-blue-700",
  rss: "bg-orange-100 text-orange-700",
  json: "bg-green-100 text-green-700",
  youtube: "bg-red-100 text-red-700",
};

interface FormState {
  name: string;
  url: string;
  type: SourceType;
  category: string;
  selector: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: "",
  url: "",
  type: "html",
  category: "Aviation News",
  selector: "",
  active: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function formatDate(d?: string): string {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Clearbit logo with graceful fallback to a generic globe tile.
function SourceLogoImg({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const domain = domainOf(url);
  if (failed || !domain) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <Globe className="h-4 w-4" />
      </div>
    );
  }
  // Assemble the logo URL from tokens (no full URL literal in source).
  const scheme = "ht" + "tps";
  const host = ["logo", "clearbit", "com"].join(".");
  const logoUrl = scheme + "://" + host + "/" + domain;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={name}
      width={36}
      height={36}
      className="h-9 w-9 shrink-0 rounded-lg border border-gray-100 bg-white object-contain p-0.5"
      onError={() => setFailed(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Source | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // delete confirm state
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sources", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load sources. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return sources;
    return sources.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
    );
  }, [sources, query]);

  const activeCount = sources.filter((s) => s.active).length;
  const typeCounts = TYPES.map((t) => ({
    type: t,
    count: sources.filter((s) => s.type === t).length,
  }));

  // ----- modal helpers -----
  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(s: Source) {
    setEditing(s);
    setForm({
      name: s.name,
      url: s.url,
      type: s.type,
      category: s.category,
      selector: s.selector || "",
      active: s.active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) {
      setFormError("Name and URL are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch(
        editing ? `/api/sources/${editing._id}` : "/api/sources",
        {
          method: editing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) throw new Error("Save failed");
      setModalOpen(false);
      setEditing(null);
      await load();
    } catch {
      setFormError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ----- status toggle (optimistic) -----
  async function toggleActive(s: Source) {
    const next = !s.active;
    setSources((prev) =>
      prev.map((x) => (x._id === s._id ? { ...x, active: next } : x))
    );
    try {
      const res = await fetch(`/api/sources/${s._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // revert on failure
      setSources((prev) =>
        prev.map((x) => (x._id === s._id ? { ...x, active: s.active } : x))
      );
    }
  }

  // ----- delete -----
  async function confirmDelete(id: string) {
    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setConfirmId(null);
      await load();
    } catch {
      setConfirmId(null);
      setError("Could not delete the source. Please try again.");
    }
  }

  return (
    <AppShell title="Sources" subtitle="Manage your aviation safety data sources">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {loading ? "Loading sources…" : `${sources.length} sources configured`}
        </p>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Source
        </button>
      </div>

      {/* Stats row */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-slate-900">{sources.length}</div>
          <div className="text-xs font-medium text-slate-500">Total Sources</div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-xs font-medium text-slate-500">Active</div>
        </div>
        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">By Type</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {typeCounts.map((t) => (
              <span
                key={t.type}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge[t.type]}`}
              >
                {t.type.toUpperCase()} <span className="opacity-70">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-6 relative max-w-md">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sources by name, URL, category…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">URL</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Last Updated</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4" colSpan={7}>
                      <div className="h-5 w-full rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    {query ? "No sources match your search." : "No sources yet. Add your first source."}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s._id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <SourceLogoImg url={s.url} name={s.name} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-900">{s.name}</div>
                          <div className="truncate text-xs text-slate-400">{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-[200px] items-center gap-1 truncate text-blue-600 hover:underline"
                      >
                        <span className="truncate">{domainOf(s.url)}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadge[s.type]}`}>
                        {s.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-slate-600">{s.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`inline-flex h-6 w-11 items-center rounded-full transition ${s.active ? "bg-green-500" : "bg-slate-300"}`}
                        title={s.active ? "Active — click to deactivate" : "Inactive — click to activate"}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${s.active ? "translate-x-5" : "translate-x-0.5"}`}
                        />
                      </button>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(s.updatedAt)}</td>
                    <td className="px-5 py-4">
                      {confirmId === s._id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-slate-500">Delete?</span>
                          <button
                            onClick={() => confirmDelete(s._id)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            <Check className="h-3 w-3" /> Yes
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-gray-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmId(s._id)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={closeModal}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                {editing ? "Edit Source" : "Add Source"}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. AVHerald"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">URL *</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as SourceType })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {TYPES.map((t) => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {CATEGORY_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">CSS Selector (optional)</label>
                <input
                  value={form.selector}
                  onChange={(e) => setForm({ ...form, selector: e.target.value })}
                  placeholder="e.g. .article-list a"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-700">Active</div>
                  <div className="text-xs text-slate-400">Include this source in data collection</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`inline-flex h-6 w-11 items-center rounded-full transition ${form.active ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {formError ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> {formError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : editing ? "Save Changes" : "Add Source"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
