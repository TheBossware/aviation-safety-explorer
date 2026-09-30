import Link from "next/link";

import type { AviationNews } from "@/lib/aviation-news/types";
import { formatDate } from "@/lib/shared/format-date";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";

/** Compact news list: title, source and date, linking to the detail page. */
export function RecentNewsList({ items, emptyMessage }: { items: AviationNews[]; emptyMessage: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;

  return (
    <ul className="flex flex-col divide-y divide-border">
      {items.map((item) => (
        <li key={String(item._id)} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
          <Link href={`/aviation-news/${item._id}`} className="flex min-w-0 flex-col gap-0.5 hover:underline">
            <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
            <span className="text-xs text-muted-foreground">
              {item.source_name} · {formatDate(item.published_at)}
            </span>
          </Link>
          <SeverityBadge severity={item.severity} className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}
