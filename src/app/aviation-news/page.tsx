import { parseAviationNewsFilter } from "@/lib/aviation-news/filters";
import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as isitRepository from "@/lib/isit-classification/repository";
import * as sourcesRepository from "@/lib/sources/repository";
import type { SearchParams } from "@/lib/shared/search-params";
import { IncidentHeader } from "@/components/aviation-news/incident-header";
import { FilterToolbar } from "@/components/aviation-news/filter-toolbar";
import { MobileFiltersSheet } from "@/components/aviation-news/mobile-filters-sheet";
import { IncidentGrid } from "@/components/aviation-news/incident-grid";
import { FilterPanelDesktop } from "@/components/aviation-news/filter-panel-desktop";
import { Pagination } from "@/components/aviation-news/pagination";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AviationNewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = parseAviationNewsFilter(params);

  const [{ items, total, page, pageSize }, categories, sources, airlines] = await Promise.all([
    aviationNewsRepository.findFiltered(filter),
    aviationNewsRepository.distinctCategories(),
    sourcesRepository.findAll({ active: true }),
    aviationNewsRepository.airlineCounts(),
  ]);
  const isitRecords = await isitRepository.findByNewsIds(items.map((item) => String(item._id)));
  const isitByNewsId = new Map(isitRecords.map((record) => [String(record.news_id), record]));

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <IncidentHeader searchParams={params} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <FilterToolbar categories={categories} sources={sources} airlines={airlines} searchParams={params} />
          <MobileFiltersSheet categories={categories} sources={sources} airlines={airlines} searchParams={params} />
        </div>

        <IncidentGrid items={items} isitByNewsId={isitByNewsId} />

        <Pagination page={page} pageSize={pageSize} total={total} searchParams={params} />
      </div>

      <FilterPanelDesktop categories={categories} sources={sources} airlines={airlines} searchParams={params} />
    </div>
  );
}
