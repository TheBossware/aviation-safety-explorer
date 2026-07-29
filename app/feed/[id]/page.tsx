"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight, ArrowLeft, Building2, Calendar, FolderOpen, MapPin, ExternalLink,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import DetailActions from "@/components/DetailActions";
import { severityStyles, typeStyles, categoryColor, ContentItem, Severity } from "@/lib/data";

// The /api/items proxy returns mapped ContentItem objects that may also carry
// an optional external `url` (from the n8n source article).
type FeedItem = ContentItem & { url?: string };

function formatDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d.length <= 10 ? d + "T00:00:00" : d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

// Fallback severity derivation from category (used only if the item has none).
function severityFromCategory(category: string): Severity {
  const c = (category || "").toLowerCase();
  if (c.includes("airworthiness")) return "HIGH";
  if (c.includes("safety")) return "MEDIUM";
  if (c.includes("boeing") || c.includes("airbus")) return "LOW";
  return "INFO";
}

function DetailSkeleton() {
  return (
    <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 animate-pulse rounded-xl border border-gray-100 bg-white p-7 shadow-sm">
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-md bg-gray-100" />
          <div className="h-6 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="mt-4 h-8 w-3/4 rounded bg-gray-100" />
        <div className="mt-3 h-4 w-full rounded bg-gray-100" />
        <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
        <div className="mt-5 h-24 w-full rounded-xl bg-gray-100" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-full rounded bg-gray-100" />
          ))}
        </div>
      </div>
      <div className="animate-pulse space-y-6">
        <div className="h-40 rounded-xl border border-gray-100 bg-white shadow-sm" />
        <div className="h-64 rounded-xl border border-gray-100 bg-white shadow-sm" />
      </div>
    </div>
  );
}

export default function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/items", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
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

  const item = items.find((i) => i.id === id);

  return (
    <AppShell title="Item Detail" subtitle="Full safety intelligence report">
      {/* Breadcrumb + back */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/" className="hover:text-slate-600">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/browse" className="hover:text-slate-600">Browse</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="max-w-[240px] truncate font-medium text-slate-600">
            {item ? item.title : "Item"}
          </span>
        </nav>
        <Link href="/browse" className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>
      </div>

      {loading ? (
        <DetailSkeleton />
      ) : !item ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-gray-100 bg-white py-16 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-2xl">🔍</div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Item not found</h2>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            The item you&apos;re looking for doesn&apos;t exist or may have been removed from the feed.
          </p>
          <Link href="/browse" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4" /> Back to Browse
          </Link>
        </div>
      ) : (
        (() => {
          const severity: Severity = item.severity ?? severityFromCategory(item.category);
          const sev = severityStyles[severity];
          const sourceName = item.source || "Unknown Source";
          const initials = item.sourceInitials || sourceName.slice(0, 2).toUpperCase();
          const sourceColor = item.sourceColor || categoryColor(item.category);
          const paragraphs = Array.isArray(item.content)
            ? item.content
            : [String(item.content || item.summary || "")];

          const related = items
            .filter((i) => i.id !== item.id && (i.category === item.category || i.source === item.source))
            .slice(0, 4);
          const relatedFallback = related.length
            ? related
            : items.filter((i) => i.id !== item.id).slice(0, 4);

          const meta = [
            { icon: Building2, label: "Source", value: sourceName },
            { icon: Calendar, label: "Published", value: formatDate(item.date) },
            { icon: FolderOpen, label: "Category", value: item.category },
            { icon: MapPin, label: "Region", value: item.region || "Global" },
          ];

          return (
            <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Main article */}
              <article className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-7 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  {item.type ? (
                    <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${typeStyles[item.type]}`}>{item.type}</span>
                  ) : null}
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${sev.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />{severity}
                  </span>
                </div>

                <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-900">{item.title}</h1>
                {item.summary ? (
                  <p className="mt-3 text-base leading-relaxed text-slate-500">{item.summary}</p>
                ) : null}

                <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:grid-cols-4">
                  {meta.map((m) => (
                    <div key={m.label} className="flex items-start gap-2.5">
                      <m.icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">{m.label}</div>
                        <div className="truncate text-sm font-medium text-slate-700">{m.value}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <DetailActions title={item.title} />

                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    View Original Source <ExternalLink className="h-4 w-4" />
                  </a>
                ) : null}

                <div className="prose mt-6 max-w-none space-y-4">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="text-[15px] leading-7 text-slate-600">{p}</p>
                  ))}
                </div>

                {item.tags && item.tags.length ? (
                  <div className="mt-7 border-t border-gray-100 pt-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.tags.map((t) => (
                        <span key={t} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-slate-600">#{t}</span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>

              {/* Sidebar */}
              <aside className="space-y-6">
                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${sourceColor} text-sm font-bold text-white`}>
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{sourceName}</div>
                      <div className="text-xs text-slate-400">Verified source</div>
                    </div>
                  </div>
                  <Link href="/sources" className="mt-4 block w-full rounded-lg border border-gray-200 py-2 text-center text-sm font-medium text-slate-600 transition hover:bg-gray-50">
                    View source profile
                  </Link>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-900">Related Items</h3>
                  <div className="mt-3 space-y-3">
                    {relatedFallback.map((r) => {
                      const rSeverity: Severity = r.severity ?? severityFromCategory(r.category);
                      const rsev = severityStyles[rSeverity];
                      return (
                        <Link key={r.id} href={`/feed/${r.id}`} className="group block rounded-lg border border-gray-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rsev.badge}`}>
                              <span className={`h-1 w-1 rounded-full ${rsev.dot}`} />{rSeverity}
                            </span>
                            <span className="text-[11px] text-slate-400">{formatDate(r.date)}</span>
                          </div>
                          <div className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-700 group-hover:text-blue-700">{r.title}</div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </aside>
            </div>
          );
        })()
      )}
    </AppShell>
  );
}
