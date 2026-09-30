import Link from "next/link";

import type { AviationNews } from "@/lib/aviation-news/types";
import type { IsitClassification, IsitRelation } from "@/lib/isit-classification/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ExternalButton } from "@/components/nav-buttons";
import { HighlightedText } from "@/components/isit-review/highlighted-text";
import { recordDate } from "@/components/isit-review/record-date";
import { FlagList, WorkflowStatusBadge } from "@/components/isit-review/status-badges";

/** The post a record is about: title with evidence highlighted, its dates, flags and related posts. */
export function RecordCard({
  record,
  news,
  quotes,
}: {
  record: IsitClassification;
  news: AviationNews;
  /** Evidence quoted by the AI, highlighted in the title. */
  quotes: string[];
}) {
  return (
    <Card className="p-6">
      <CardHeader className="gap-2 p-0">
        <div className="flex flex-wrap items-center gap-2">
          <WorkflowStatusBadge status={record.workflow_status} />
          <span className="text-xs text-muted-foreground">Title (the post this record is about)</span>
        </div>
        <h1 className="text-lg leading-7 font-semibold">
          <HighlightedText text={news.title} quotes={quotes} inline />
        </h1>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pt-4 text-sm">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Occurrence (from title)</dt>
            <dd>{recordDate(record.dates.event_date)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Posted</dt>
            <dd>{recordDate(news.published_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Fetched</dt>
            <dd>{recordDate(news.fetched_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Article created</dt>
            <dd>{recordDate(record.dates.article_created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Article updated</dt>
            <dd>{recordDate(record.dates.article_updated_at)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Article id</dt>
            <dd className="font-mono">{record.article_id ?? "—"}</dd>
          </div>
        </dl>

        <FlagList flags={record.flags} />

        <RelationList relations={record.relations} />

        <div className="flex flex-wrap gap-2">
          <ExternalButton href={news.url}>AvHerald article</ExternalButton>
          {news.post_url && <ExternalButton href={news.post_url}>Original post</ExternalButton>}
        </div>
      </CardContent>
    </Card>
  );
}

function RelationList({ relations }: { relations: IsitRelation[] }) {
  if (relations.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
      {relations.map((relation, i) => (
        <li key={i}>
          {relation.type} article {relation.article_id ?? "—"}
          {relation.news_id ? (
            <>
              {" "}
              (
              <Link href={`/isit-review/${relation.news_id}`} className="underline">
                record
              </Link>
              )
            </>
          ) : (
            " (not in aviation_news)"
          )}
          {relation.confirmed ? " · confirmed" : " · unconfirmed suggestion"}
        </li>
      ))}
    </ul>
  );
}
