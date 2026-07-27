import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentItem, severityStyles, typeStyles } from "@/lib/data";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ItemCard({ item }: { item: ContentItem }) {
  const sev = severityStyles[item.severity];
  return (
    <Link
      href={`/feed/${item.id}`}
      className="group block rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.sourceColor} text-xs font-bold text-white`}>
            {item.sourceInitials}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-slate-700">{item.source}</div>
            <div className="text-xs text-slate-400">{formatDate(item.date)} · {item.region}</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-[11px] font-medium ${typeStyles[item.type]}`}>
            {item.type}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${sev.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
            {item.severity}
          </span>
        </div>
      </div>

      <h3 className="mt-4 text-[15px] font-semibold leading-snug text-slate-900 group-hover:text-blue-700">
        {item.title}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500">{item.summary}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {item.tags.slice(0, 3).map((t) => (
            <span key={t} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {t}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
          Read <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
