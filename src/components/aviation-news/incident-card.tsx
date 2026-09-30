import { CalendarDays, PlaneTakeoff } from "lucide-react";

import { Card } from "@/components/ui/card";
import { AirlineNames } from "@/components/aviation-news/airline-names";
import { IsitSummary } from "@/components/aviation-news/isit-summary";
import { AircraftTags, TopicTags } from "@/components/aviation-news/news-tags";
import { DetailsButton } from "@/components/nav-buttons";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitClassification } from "@/lib/isit-classification/types";
import { formatDate } from "@/lib/shared/format-date";

const MAX_TAGS = 3;

export function IncidentCard({ item, isit }: { item: AviationNews; isit?: IsitClassification }) {
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

      <AircraftTags tags={item.source_tags} size="sm" />

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarDays className="size-3.5" />
        {formatDate(item.published_at)}
      </div>

      {item.summary && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>
      )}

      {isit && <IsitSummary record={isit} />}

      <TopicTags tags={item.tags} max={MAX_TAGS} />

      <div className="mt-auto flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground">{item.source_name}</span>
        <DetailsButton href={`/aviation-news/${item._id}`}>View details</DetailsButton>
      </div>
    </Card>
  );
}
