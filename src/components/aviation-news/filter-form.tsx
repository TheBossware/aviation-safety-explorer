"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SEVERITY_DOT_COLOR } from "@/components/aviation-news/severity-badge";
import { ALL } from "@/lib/aviation-news/filters";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";
import { toArray, toSingle, type SearchParams } from "@/lib/shared/search-params";
import {
  airlineOptions,
  categoryOptions,
  DATE_RANGE_OPTIONS,
  SORT_OPTIONS,
  sourceOptions,
  type FilterChoices,
} from "@/components/aviation-news/filter-options";
import { FilterSelect } from "@/components/aviation-news/filter-select";

interface FilterFormProps extends FilterChoices {
  /** Distinguishes ids between the desktop aside and mobile sheet instances. */
  idPrefix: string;
  searchParams: SearchParams;
  /** Called right after navigating, e.g. to close the mobile sheet. */
  onSubmitted?: () => void;
}

const SELECT_TRIGGER = "w-full bg-card dark:bg-card";

export function FilterForm({
  idPrefix,
  categories,
  sources,
  airlines,
  searchParams,
  onSubmitted,
}: FilterFormProps) {
  const router = useRouter();
  const selectedSeverities = toArray(searchParams.severity);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Intercept so this goes through the client router (shows loading.tsx)
    // instead of a full page reload; falls back to the native GET without JS.
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value && value !== ALL) {
        params.append(key, value);
      }
    }
    router.push(`/aviation-news?${params.toString()}`);
    onSubmitted?.();
  }

  return (
    <form
      method="GET"
      action="/aviation-news"
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-q`}>Search</Label>
        <Input
          id={`${idPrefix}-q`}
          name="q"
          className="bg-card dark:bg-card"
          defaultValue={toSingle(searchParams.q)}
          placeholder="Search by aircraft, flight, source, tag..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <FilterSelect
          name="category"
          defaultValue={toSingle(searchParams.category) ?? ALL}
          options={categoryOptions(categories)}
          placeholder="All categories"
          triggerId={`${idPrefix}-category`}
          triggerClassName={SELECT_TRIGGER}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Severity</Label>
        {SEVERITY_VALUES.map((severity) => (
          <label
            key={severity}
            htmlFor={`${idPrefix}-severity-${severity}`}
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id={`${idPrefix}-severity-${severity}`}
              name="severity"
              value={severity}
              defaultChecked={selectedSeverities.includes(severity)}
            />
            <span className={`size-2 rounded-full ${SEVERITY_DOT_COLOR[severity]}`} />
            {SEVERITY_LABELS[severity]}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-source`}>Source</Label>
        <FilterSelect
          name="source"
          defaultValue={toSingle(searchParams.source) ?? ALL}
          options={sourceOptions(sources)}
          placeholder="All sources"
          triggerId={`${idPrefix}-source`}
          triggerClassName={SELECT_TRIGGER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-airline`}>Airline</Label>
        <FilterSelect
          name="airline"
          defaultValue={toSingle(searchParams.airline) ?? ALL}
          options={airlineOptions(airlines)}
          placeholder="All airlines"
          triggerId={`${idPrefix}-airline`}
          triggerClassName={SELECT_TRIGGER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-range`}>Date Range</Label>
        <FilterSelect
          name="range"
          defaultValue={toSingle(searchParams.range) ?? ALL}
          options={DATE_RANGE_OPTIONS}
          placeholder="All time"
          triggerId={`${idPrefix}-range`}
          triggerClassName={SELECT_TRIGGER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>Sort by Published Date</Label>
        <FilterSelect
          name="sort"
          defaultValue={toSingle(searchParams.sort) ?? "desc"}
          options={SORT_OPTIONS}
          placeholder="Newest first"
          triggerId={`${idPrefix}-sort`}
          triggerClassName={SELECT_TRIGGER}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-aircraft`}>Aircraft / Flight</Label>
        <Input
          id={`${idPrefix}-aircraft`}
          name="aircraft"
          className="bg-card dark:bg-card"
          defaultValue={toSingle(searchParams.aircraft)}
          placeholder="e.g. B788, UA-108"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-tag`}>Tags</Label>
        <Input
          id={`${idPrefix}-tag`}
          name="tag"
          className="bg-card dark:bg-card"
          defaultValue={toSingle(searchParams.tag)}
          placeholder="e.g. diversion, turbulence"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit">Apply filters</Button>
        <Button
          variant="outline"
          className="bg-card dark:bg-card"
          nativeButton={false}
          onClick={() => onSubmitted?.()}
          render={<Link href="/aviation-news" />}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}
