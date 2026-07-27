import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight, ArrowLeft, Building2, Calendar, FolderOpen, MapPin,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import DetailActions from "@/components/DetailActions";
import { items, severityStyles, typeStyles } from "@/lib/data";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

export function generateStaticParams() {
  return items.map((i) => ({ id: i.id }));
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = items.find((i) => i.id === id);
  if (!item) notFound();

  const sev = severityStyles[item.severity];
  const related = items.filter((i) => i.id !== item.id && (i.category === item.category || i.source === item.source)).slice(0, 4);
  const relatedFallback = related.length ? related : items.filter((i) => i.id !== item.id).slice(0, 4);

  const meta = [
    { icon: Building2, label: "Source", value: item.source },
    { icon: Calendar, label: "Published", value: formatDate(item.date) },
    { icon: FolderOpen, label: "Category", value: item.category },
    { icon: MapPin, label: "Region", value: item.region },
  ];

  return (
    <AppShell title="Item Detail" subtitle="Full safety intelligence report">
      {/* Breadcrumb + back */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-sm text-slate-400">
          <Link href="/" className="hover:text-slate-600">Dashboard</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/feed" className="hover:text-slate-600">Feed</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="max-w-[240px] truncate font-medium text-slate-600">{item.title}</span>
        </nav>
        <Link href="/feed" className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" /> Back to Feed
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main article */}
        <article className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${typeStyles[item.type]}`}>{item.type}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${sev.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />{item.severity}
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-slate-900">{item.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-slate-500">{item.summary}</p>

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

          <div className="prose mt-6 max-w-none space-y-4">
            {item.content.map((p, i) => (
              <p key={i} className="text-[15px] leading-7 text-slate-600">{p}</p>
            ))}
          </div>

          <div className="mt-7 border-t border-gray-100 pt-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span key={t} className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-slate-600">#{t}</span>
              ))}
            </div>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${item.sourceColor} text-sm font-bold text-white`}>
                {item.sourceInitials}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{item.source}</div>
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
                const rsev = severityStyles[r.severity];
                return (
                  <Link key={r.id} href={`/feed/${r.id}`} className="group block rounded-lg border border-gray-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rsev.badge}`}>
                        <span className={`h-1 w-1 rounded-full ${rsev.dot}`} />{r.severity}
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
    </AppShell>
  );
}
