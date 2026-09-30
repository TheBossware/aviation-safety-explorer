import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";

import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import { isObjectId } from "@/lib/shared/guards";
import { NewsDetailCard } from "@/components/aviation-news/news-detail-card";
import { IsitResultCard } from "@/components/isit-review/result-card";
import { BackButton, DetailsButton } from "@/components/nav-buttons";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isObjectId(id)) notFound();
  const item = await aviationNewsRepository.findById(id);
  if (!item) notFound();

  // Only AvHerald items have ISIT records; show one once the AI or a reviewer has produced a result.
  const isit = await isitRepository.findByNewsId(item._id);
  const hasIsit = Boolean(isit && (isit.ai || isit.final));

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/aviation-news">Back to Incidents</BackButton>

      {hasIsit && isit ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
          <NewsDetailCard item={item} />
          <IsitResultCard
            record={isit}
            title={
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" />
                ISIT Taxonomy
              </span>
            }
            action={<DetailsButton href={`/isit-review/${item._id}`}>ISIT Review</DetailsButton>}
            className="border border-primary/60 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
          />
        </div>
      ) : (
        <NewsDetailCard item={item} />
      )}
    </div>
  );
}
