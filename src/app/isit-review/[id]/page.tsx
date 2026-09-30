import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { BookOpen } from "lucide-react";

import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import { currentProposal, REVIEWER_COOKIE } from "@/lib/isit-classification/review";
import { readStages } from "@/lib/isit-classification/stages";
import { OUTCOME_LABELS, type IsitCodeAssignment, type IsitReviewEvent } from "@/lib/isit-classification/types";
import { loadIsitTaxonomy, toTreePayload } from "@/lib/isit-taxonomy/taxonomy";
import { formatDateUtc } from "@/lib/shared/format-date";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton, ExternalButton } from "@/components/nav-buttons";
import { HighlightedText } from "@/components/isit-review/highlighted-text";
import { ReviewForm } from "@/components/isit-review/review-form";
import { buildIsitTree } from "@/components/isit-review/isit-tree";
import { TreeView } from "@/components/isit-review/tree-view";
import { IsitResultCard } from "@/components/isit-review/result-card";
import { FlagList, OutcomeBadge, WorkflowStatusBadge } from "@/components/isit-review/status-badges";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** A date of the record in UTC, "—" when the record doesn't have it (yet). */
function dateOrDash(value: Date | string | null | undefined): string {
  return value ? formatDateUtc(value) : "—";
}

function describeEvent(event: IsitReviewEvent): string {
  const code = (value: unknown) => {
    const c = value as IsitCodeAssignment | null;
    return c ? `${c.code} ${c.label}` : "";
  };
  switch (event.action) {
    case "set_outcome":
      return `outcome ${event.before ?? "none"} → ${event.after}`;
    case "reject_code":
      return `removed ${code(event.before)}`;
    case "add_code":
      return `added ${code(event.after)}`;
    case "approve":
      return event.before ? "updated the approved result" : "approved";
    default:
      return event.action;
  }
}

const OBJECT_ID = /^[0-9a-f]{24}$/i;

export default async function IsitReviewDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!OBJECT_ID.test(id)) notFound();

  const [record, news, events, cookieStore] = await Promise.all([
    isitRepository.findByNewsId(id),
    aviationNewsRepository.findById(id),
    isitRepository.findReviewEvents(id),
    cookies(),
  ]);
  if (!record || !news) notFound();

  const suggestion = record.ai ? await isitRepository.findSuggestionById(String(record.ai.suggestion_id)) : null;
  const stages = readStages(suggestion);
  const taxonomy = loadIsitTaxonomy();

  const confidence = new Map(stages.select?.output.codes.map((c) => [c.code, c.confidence]) ?? []);
  const proposal = currentProposal(record);
  const quotes = [
    ...(record.ai?.codes ?? []).map((c) => c.evidence_quote ?? ""),
    stages.gate?.evidence_quote ?? "",
  ].filter(Boolean);

  const aiCodes = record.ai?.codes ?? [];
  const aiByCode = new Map(aiCodes.map((c) => [c.code, c]));
  // The suggestion shown in place in the taxonomy: only suggested codes and their ancestors.
  const suggestionTree = aiCodes.length
    ? buildIsitTree(toTreePayload(taxonomy), {
        include: aiByCode.keys(),
        decorate: (code) => {
          const c = aiByCode.get(code);
          if (!c) return undefined;
          return {
            badges: confidence.get(code) ? (
              <span className="text-xs text-muted-foreground">({confidence.get(code)} confidence)</span>
            ) : undefined,
            detail: (
              <div className="flex flex-col gap-0.5">
                {c.evidence_quote && <p className="text-sm text-muted-foreground italic">“{c.evidence_quote}”</p>}
                {c.rationale && <p className="text-xs text-muted-foreground">{c.rationale}</p>}
              </div>
            ),
          };
        },
      })
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BackButton href="/isit-review">Back to review queue</BackButton>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/isit-review/guide" />}>
          <BookOpen data-icon="inline-start" />
          Review guide
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
        <div className="flex min-w-0 flex-col gap-4">
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
                  <dd>{dateOrDash(record.dates.event_date)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Posted</dt>
                  <dd>{dateOrDash(news.published_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Fetched</dt>
                  <dd>{dateOrDash(news.fetched_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Article created</dt>
                  <dd>{dateOrDash(record.dates.article_created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Article updated</dt>
                  <dd>{dateOrDash(record.dates.article_updated_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Article id</dt>
                  <dd className="font-mono">{record.article_id ?? "—"}</dd>
                </div>
              </dl>

              <FlagList flags={record.flags} />

              {record.relations.length > 0 && (
                <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
                  {record.relations.map((relation, i) => (
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
              )}

              <div className="flex flex-wrap gap-2">
                <ExternalButton href={news.url}>AvHerald article</ExternalButton>
                {news.post_url && <ExternalButton href={news.post_url}>Original post</ExternalButton>}
              </div>
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                AI suggestion <OutcomeBadge outcome={record.ai?.outcome ?? null} />
              </CardTitle>
              {suggestion && (
                <p className="text-xs text-muted-foreground">
                  {suggestion.model} · prompt {suggestion.prompt_version} · taxonomy {suggestion.taxonomy_version} ·{" "}
                  {dateOrDash(suggestion.created_at)}
                </p>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 p-0 pt-4 text-sm">
              {!record.ai && <p className="text-muted-foreground">No AI suggestion yet.</p>}

              {stages.gate && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Gate: {stages.gate.post_type} → {stages.gate.decision}
                    {!stages.gate.title_content_consistent && " · title and article disagree"}
                  </p>
                  <p className="mt-1">{stages.gate.rationale}</p>
                </div>
              )}

              {suggestionTree.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    ISIT codes ({aiCodes.length})
                  </p>
                  <TreeView nodes={suggestionTree} aria-label="AI-suggested ISIT codes" defaultExpanded="all" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Review</CardTitle>
              {record.final && (
                <p className="text-xs text-muted-foreground">
                  Approved as {OUTCOME_LABELS[record.final.outcome]} by {record.final.approved_by} on{" "}
                  {dateOrDash(record.final.approved_at)} (reviewer names are not verified)
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <ReviewForm
                key={String(record.final?.approved_at ?? record.ai?.suggestion_id ?? "new")}
                newsId={id}
                reviewer={cookieStore.get(REVIEWER_COOKIE)?.value ?? ""}
                outcome={proposal.outcome}
                taxonomyVersion={record.final?.taxonomy_version ?? suggestion?.taxonomy_version ?? taxonomy.version}
                codes={proposal.codes.map((c) => c.code)}
                aiCodes={aiCodes.map((c) => c.code)}
                isApproved={Boolean(record.final)}
              />
            </CardContent>
          </Card>

          {events.length > 0 && (
            <Card className="p-6">
              <CardHeader className="p-0">
                <CardTitle className="text-base">History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {events.map((event) => (
                    <li key={String(event._id)} className="border-l-2 pl-3">
                      <span className="text-xs text-muted-foreground">{dateOrDash(event.at)}</span>{" "}
                      <span className="font-medium">{event.actor}</span> {describeEvent(event)}
                      {event.comment && <p className="text-muted-foreground">“{event.comment}”</p>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
          <Card className="min-h-0 p-6 xl:overflow-y-auto">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Article</CardTitle>
              <p className="text-xs text-muted-foreground">
                AvHerald page linked from the post. It may describe an older or withdrawn story. Highlighted: evidence quoted by the AI.
              </p>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <HighlightedText text={news.content || "(no article text)"} quotes={quotes} />
            </CardContent>
          </Card>

          <IsitResultCard record={record} className="shrink-0 xl:max-h-[45vh] xl:overflow-y-auto" />
        </div>
      </div>
    </div>
  );
}
