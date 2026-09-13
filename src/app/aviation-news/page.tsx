import * as aviationNewsRepository from "@/lib/aviation-news/repository";
import * as sourcesRepository from "@/lib/sources/repository";
import { SEVERITY_VALUES, type Severity } from "@/lib/shared/types";
import { toArray, toSingle, type SearchParams } from "@/lib/shared/search-params";
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

/** The "All" sentinel is how Select components represent "no filter"; normalize it away here. */
function normalize(value: string | undefined): string | undefined {
  return value && value !== "All" ? value : undefined;
}

function toSeverityFilter(value: string | string[] | undefined): Severity[] {
  return toArray(value).filter((v): v is Severity => (SEVERITY_VALUES as string[]).includes(v));
}

function publishedAfterFromRange(range: string | undefined): Date | undefined {
  if (!range) return undefined;
  const from = new Date();
  switch (range) {
    case "7d":
      from.setDate(from.getDate() - 7);
      return from;
    case "30d":
      from.setDate(from.getDate() - 30);
      return from;
    case "90d":
      from.setDate(from.getDate() - 90);
      return from;
    case "6m":
      from.setMonth(from.getMonth() - 6);
      return from;
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      return from;
    default:
      return undefined;
  }
}

export default async function AviationNewsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filter = {
    category: normalize(toSingle(params.category)),
    severity: toSeverityFilter(params.severity),
    sourceId: normalize(toSingle(params.source)),
    publishedAfter: publishedAfterFromRange(normalize(toSingle(params.range))),
    q: toSingle(params.q),
    aircraft: toSingle(params.aircraft),
    tag: toSingle(params.tag),
    page: Number(toSingle(params.page)) || 1,
  };

  const [{ items, total, page, pageSize }, categories, sources] = await Promise.all([
    aviationNewsRepository.findFiltered(filter),
    aviationNewsRepository.distinctCategories(),
    sourcesRepository.findAll({ active: true }),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <IncidentHeader searchParams={params} />

        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <FilterToolbar categories={categories} sources={sources} searchParams={params} />
          <MobileFiltersSheet categories={categories} sources={sources} searchParams={params} />
        </div>

        <IncidentGrid items={items} />

        <Pagination page={page} pageSize={pageSize} total={total} searchParams={params} />
      </div>

      <FilterPanelDesktop categories={categories} sources={sources} searchParams={params} />
    </div>
  );
}
