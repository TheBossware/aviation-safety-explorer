import { IncidentCard } from "@/components/aviation-news/incident-card";
import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitClassification } from "@/lib/isit-classification/types";

export function IncidentGrid({
  items,
  isitByNewsId,
}: {
  items: AviationNews[];
  /** ISIT records of the listed items, keyed by news id. */
  isitByNewsId?: Map<string, IsitClassification>;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed py-16 text-sm text-muted-foreground">
        No incidents match the current filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <IncidentCard key={item._id} item={item} isit={isitByNewsId?.get(item._id)} />
      ))}
    </div>
  );
}
