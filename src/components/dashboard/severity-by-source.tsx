import Link from "next/link";

import { SEVERITY_DOT_COLOR } from "@/components/aviation-news/severity-badge";
import type { SourceActivity } from "@/lib/aviation-news/repository";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";

function formatShortDate(value: Date | null): string {
  return value
    ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    : "—";
}

/**
 * One stacked bar per source (severity mix, low → high left to right), scaled to the busiest
 * source so sizes compare across rows. The total and last delivery are printed on every row.
 */
export function SeverityBySource({ rows }: { rows: SourceActivity[] }) {
  const max = Math.max(1, ...rows.map((row) => row.total));

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.sourceId}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <Link href={`/aviation-news?source=${encodeURIComponent(row.sourceId)}`} className="min-w-0 truncate font-medium hover:underline">
              {row.source}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">
              {row.total === 0 ? (
                <span className="font-medium text-destructive">No items received</span>
              ) : (
                <>last fetched {formatShortDate(row.lastFetchedAt)}</>
              )}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex h-2.5 min-w-0 flex-1 gap-[2px]">
              {row.total > 0 &&
                SEVERITY_VALUES.filter((s) => row.bySeverity[s]).map((severity, i, shown) => (
                  <div
                    key={severity}
                    className={`h-full ${SEVERITY_DOT_COLOR[severity]} ${i === shown.length - 1 ? "rounded-r-[4px]" : ""}`}
                    style={{ width: `${(row.bySeverity[severity]! / max) * 100}%` }}
                    title={`${row.source}: ${row.bySeverity[severity]} ${SEVERITY_LABELS[severity]}`}
                  />
                ))}
            </div>
            <span className="w-8 shrink-0 text-right text-xs font-medium tabular-nums">{row.total}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
