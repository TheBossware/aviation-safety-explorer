import { notFound } from "next/navigation";
import { CalendarDays, Plane, PlaneTakeoff, Sparkles } from "lucide-react";

import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import { formatDate } from "@/lib/shared/format-date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AirlineNames } from "@/components/aviation-news/airline-names";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import { IsitResultCard } from "@/components/isit-review/result-card";
import { BackButton, DetailsButton, ExternalButton } from "@/components/nav-buttons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await aviationNewsRepository.findById(id);
  if (!item) notFound();

  const hasClassification = item.rule_category || item.rule_severity || item.classification_reasoning;

  // Only AvHerald items have ISIT records; show one once the AI or a reviewer has produced a result.
  const isit = await isitRepository.findByNewsId(String(item._id));
  const hasIsit = Boolean(isit && (isit.ai || isit.final));

  const detailCard = (
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

        {item.source_tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.source_tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                <Plane className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="text-sm leading-6 whitespace-pre-line text-foreground">{item.content}</div>

        {hasClassification && (
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Classification
            </p>
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
        )}

        <ExternalButton href={item.url}>View original source</ExternalButton>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/aviation-news">Back to Incidents</BackButton>

      {hasIsit && isit ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
          {detailCard}
          <IsitResultCard
            record={isit}
            title={
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" />
                ISIT Taxonomy
              </span>
            }
            action={<DetailsButton href={`/isit-review/${String(item._id)}`}>ISIT Review</DetailsButton>}
            className="border border-primary/60 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
          />
        </div>
      ) : (
        detailCard
      )}
    </div>
  );
}
