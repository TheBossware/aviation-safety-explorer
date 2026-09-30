import { CalendarDays, Plane, PlaneTakeoff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AirlineNames } from "@/components/aviation-news/airline-names";
import { IsitSummary } from "@/components/aviation-news/isit-summary";
import { DetailsButton } from "@/components/nav-buttons";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitClassification } from "@/lib/isit-classification/types";

const MAX_TAGS = 3;

function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function IncidentCard({ item, isit }: { item: AviationNews; isit?: IsitClassification }) {
  const visibleTags = item.tags.slice(0, MAX_TAGS);
  const extraTagCount = item.tags.length - visibleTags.length;

  return (
    <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {item.category}
        </span>
        <SeverityBadge severity={item.severity} />
      </div>

      <h3 className="line-clamp-2 text-base leading-6 font-semibold">{item.title}</h3>

      {item.airlines && item.airlines.length > 0 && (
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <PlaneTakeoff className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">
            <AirlineNames item={item} />
          </span>
        </div>
      )}

      {item.source_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {item.source_tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
            >
              <Plane className="size-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        {formatDate(item.published_at)}
      </div>

      {item.summary && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
      )}

      {isit && <IsitSummary record={isit} />}

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
          {extraTagCount > 0 && (
            <Badge variant="secondary" className="font-normal">
              +{extraTagCount}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">{item.source_name}</span>
        <DetailsButton href={`/aviation-news/${item._id}`}>View details</DetailsButton>
      </div>
    </Card>
  );
}
