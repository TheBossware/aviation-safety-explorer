"use client";

import { useRouter } from "next/navigation";

import { ALL } from "@/lib/aviation-news/filters";
import { toArray, toSingle, withParam, type SearchParams } from "@/lib/shared/search-params";
import {
  airlineOptions,
  categoryOptions,
  DATE_RANGE_OPTIONS,
  severityOptions,
  SORT_OPTIONS,
  sourceOptions,
  type FilterChoices,
} from "@/components/aviation-news/filter-options";
import { FilterSelect } from "@/components/aviation-news/filter-select";

interface FilterToolbarProps extends FilterChoices {
  searchParams: SearchParams;
}

/** One Select per filter above the list (md and up); each change navigates right away. */
export function FilterToolbar({ categories, sources, airlines, searchParams }: FilterToolbarProps) {
  const router = useRouter();

  function navigate(key: string, value: string | null) {
    router.push(`/aviation-news?${withParam(searchParams, key, value ?? ALL)}`);
  }

  return (
    <div className="hidden flex-wrap items-center gap-2 md:flex">
      <FilterSelect
        options={categoryOptions(categories)}
        placeholder="Categories"
        triggerClassName="h-9 bg-card dark:bg-card w-[170px]"
        value={toSingle(searchParams.category) ?? ALL}
        onValueChange={(v) => navigate("category", v)}
      />
      <FilterSelect
        options={severityOptions()}
        placeholder="Severities"
        triggerClassName="h-9 bg-card dark:bg-card w-[156px]"
        value={toArray(searchParams.severity)[0] ?? ALL}
        onValueChange={(v) => navigate("severity", v)}
      />
      <FilterSelect
        options={sourceOptions(sources)}
        placeholder="Sources"
        triggerClassName="h-9 bg-card dark:bg-card w-[156px]"
        value={toSingle(searchParams.source) ?? ALL}
        onValueChange={(v) => navigate("source", v)}
      />
      <FilterSelect
        options={airlineOptions(airlines)}
        placeholder="Airlines"
        triggerClassName="h-9 bg-card dark:bg-card w-[180px]"
        value={toSingle(searchParams.airline) ?? ALL}
        onValueChange={(v) => navigate("airline", v)}
      />
      <FilterSelect
        options={DATE_RANGE_OPTIONS}
        placeholder="Date range"
        triggerClassName="h-9 bg-card dark:bg-card w-[156px]"
        value={toSingle(searchParams.range) ?? ALL}
        onValueChange={(v) => navigate("range", v)}
      />
      <FilterSelect
        options={SORT_OPTIONS}
        placeholder="Newest first"
        triggerClassName="h-9 bg-card dark:bg-card w-[156px]"
        value={toSingle(searchParams.sort) ?? "desc"}
        onValueChange={(v) => navigate("sort", v)}
      />
    </div>
  );
}
