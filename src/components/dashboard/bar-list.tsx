import Link from "next/link";

import type { CountRow } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

/**
 * Horizontal bars for one series, largest first: label above, bar with the value at its tip.
 * Every value is printed, so the list doubles as its own table view (no hover needed).
 */
export function BarList({
  rows,
  href,
  emptyMessage = "No data yet.",
  barClassName = "bg-chart-2",
}: {
  rows: CountRow[];
  /** Makes each row a link, e.g. to the filtered list behind the number. */
  href?: (row: CountRow) => string;
  emptyMessage?: string;
  barClassName?: string;
}) {
  if (rows.length === 0) return <p className="py-4 text-sm text-muted-foreground">{emptyMessage}</p>;
  const max = Math.max(...rows.map((row) => row.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const content = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate" title={row.hint ? `${row.label} · ${row.hint}` : row.label}>
                {row.label}
                {row.hint && <span className="ml-1.5 text-xs text-muted-foreground">{row.hint}</span>}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 min-w-0 flex-1">
                <div
                  className={cn("h-full rounded-r-[4px]", barClassName)}
                  style={{ width: `${Math.max((row.count / max) * 100, 1.5)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">{row.count}</span>
            </div>
          </>
        );
        return (
          <li key={row.key}>
            {href ? (
              <Link href={href(row)} className="block rounded-md outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50">
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}
