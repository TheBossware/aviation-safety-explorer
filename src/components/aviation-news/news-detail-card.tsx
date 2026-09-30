import { CalendarDays, PlaneTakeoff } from "lucide-react";

import type { AviationNews } from "@/lib/aviation-news/types";
import { formatDate } from "@/lib/shared/format-date";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AirlineNames } from "@/components/aviation-news/airline-names";
import { AircraftTags, TopicTags } from "@/components/aviation-news/news-tags";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import { ExternalButton } from "@/components/nav-buttons";

/** One news item in full: header, airlines, tags, article text and n8n's rule classification. */
export function NewsDetailCard({ item }: { item: AviationNews }) {
  return (
    <Card className="min-w-0 p-6">
      <CardHeader className="flex-row items-start justify-between gap-3 p-0">
        <div>
          <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {item.category}
          </span>
          <h1 className="mt-1 text-xl leading-7 font-semibold">{item.title}</h1>
        </div>
        <SeverityBadge severity={item.severity} className="shrink-0" />
      </CardHeader>

      <CardContent className="flex flex-col gap-5 p-0 pt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {item.published_at ? formatDate(item.published_at) : null}
          </span>
          <span>{item.source_name}</span>
        </div>

        {item.airlines && item.airlines.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <PlaneTakeoff className="size-4 text-muted-foreground" />
            <AirlineNames item={item} linked />
          </div>
        )}

        <AircraftTags tags={item.source_tags} size="md" />
        <TopicTags tags={item.tags} />

        <div className="text-sm leading-6 whitespace-pre-line text-foreground">{item.content}</div>

        <RuleClassification item={item} />

        <ExternalButton href={item.url}>View original source</ExternalButton>
      </CardContent>
    </Card>
  );
}

/** How n8n's rules classified the item; nothing when it has no rule result. */
function RuleClassification({ item }: { item: AviationNews }) {
  if (!item.rule_category && !item.rule_severity && !item.classification_reasoning) return null;
  return (
    <div className="rounded-lg border bg-muted/50 p-4 text-sm">
      <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Classification</p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {item.rule_category && (
          <div>
            <dt className="text-xs text-muted-foreground">Rule category</dt>
            <dd>{item.rule_category}</dd>
          </div>
        )}
        {item.rule_severity && (
          <div>
            <dt className="text-xs text-muted-foreground">Rule severity</dt>
            <dd>{item.rule_severity}</dd>
          </div>
        )}
        {item.classification_reasoning && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Reasoning</dt>
            <dd>{item.classification_reasoning}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
