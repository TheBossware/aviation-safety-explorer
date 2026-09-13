import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Plane } from "lucide-react";

import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value: string | Date | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const item = await aviationNewsRepository.findById(id);
  if (!item) notFound();

  const hasClassification =
    item.rule_category || item.rule_severity || item.classification_reasoning || item.effective_on;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/aviation-news"
        className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Incidents
      </Link>

      <Card className="p-6">
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
              {formatDate(item.published_at)}
            </span>
            <span>{item.source_name}</span>
          </div>

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
                {item.effective_on && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Effective on</dt>
                    <dd>{formatDate(item.effective_on)}</dd>
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

          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            View original source &rarr;
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
