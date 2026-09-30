import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { BookOpen } from "lucide-react";

import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import { REVIEWER_COOKIE } from "@/lib/isit-classification/review";
import { readStages } from "@/lib/isit-classification/stages";
import { loadIsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/nav-buttons";
import { AiSuggestionCard } from "@/components/isit-review/ai-suggestion-card";
import { ArticleCard } from "@/components/isit-review/article-card";
import { HistoryCard } from "@/components/isit-review/history-card";
import { RecordCard } from "@/components/isit-review/record-card";
import { IsitResultCard } from "@/components/isit-review/result-card";
import { ReviewCard } from "@/components/isit-review/review-card";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
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

  // Everything the AI quoted as evidence, highlighted in the title and the article.
  const quotes = [
    ...(record.ai?.codes ?? []).map((c) => c.evidence_quote ?? ""),
    stages.gate?.evidence_quote ?? "",
  ].filter(Boolean);

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
          <RecordCard record={record} news={news} quotes={quotes} />
          <AiSuggestionCard record={record} suggestion={suggestion} stages={stages} taxonomy={taxonomy} />
          <ReviewCard
            newsId={id}
            record={record}
            reviewer={cookieStore.get(REVIEWER_COOKIE)?.value ?? ""}
            taxonomyVersion={record.final?.taxonomy_version ?? suggestion?.taxonomy_version ?? taxonomy.version}
          />
          <HistoryCard events={events} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
          <ArticleCard content={news.content} quotes={quotes} />
          <IsitResultCard record={record} className="shrink-0 xl:max-h-[45vh] xl:overflow-y-auto" />
        </div>
      </div>
    </div>
  );
}
