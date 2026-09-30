"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY_DOT_COLOR } from "@/components/aviation-news/severity-badge";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";
import { toArray, toSingle, type SearchParams } from "@/lib/shared/search-params";
import type { Source } from "@/lib/sources/types";
import type { AirlineCount } from "@/lib/aviation-news/repository";
import {
  DATE_RANGE_LABELS,
  DATE_RANGES,
  selectLabel,
  SORT_LABELS,
  SORT_OPTIONS,
} from "@/components/aviation-news/filter-options";

interface FilterFormProps {
  /** Distinguishes ids between the desktop aside and mobile sheet instances. */
  idPrefix: string;
  categories: string[];
  sources: Source[];
  /** Airlines named in the news, with item counts. */
  airlines: AirlineCount[];
  searchParams: SearchParams;
  /** Called right after navigating, e.g. to close the mobile sheet. */
  onSubmitted?: () => void;
}

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
  const sourceLabels = Object.fromEntries(sources.map((s) => [s.id, s.name]));

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Intercept so this goes through the client router (shows loading.tsx)
    // instead of a full page reload; falls back to the native GET without JS.
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value && value !== "All") {
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
        <Select name="category" defaultValue={toSingle(searchParams.category) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-category`} className="w-full bg-card dark:bg-card">
            <SelectValue>{selectLabel("All categories")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Select name="source" defaultValue={toSingle(searchParams.source) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-source`} className="w-full bg-card dark:bg-card">
            <SelectValue>{selectLabel("All sources", sourceLabels)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source.id} value={source.id}>
                {source.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-airline`}>Airline</Label>
        <Select name="airline" defaultValue={toSingle(searchParams.airline) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-airline`} className="w-full bg-card dark:bg-card">
            <SelectValue>{selectLabel("All airlines")}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Airlines</SelectItem>
            {airlines.map((airline) => (
              <SelectItem key={airline.name} value={airline.name}>
                {airline.name} ({airline.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-range`}>Date Range</Label>
        <Select name="range" defaultValue={toSingle(searchParams.range) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-range`} className="w-full bg-card dark:bg-card">
            <SelectValue>{selectLabel("All time", DATE_RANGE_LABELS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-sort`}>Sort by Published Date</Label>
        <Select name="sort" defaultValue={toSingle(searchParams.sort) ?? "desc"}>
          <SelectTrigger id={`${idPrefix}-sort`} className="w-full bg-card dark:bg-card">
            <SelectValue>{selectLabel("Newest first", SORT_LABELS)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
