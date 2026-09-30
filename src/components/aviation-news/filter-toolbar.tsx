"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";
import { toArray, toSingle, withParam, type SearchParams } from "@/lib/shared/search-params";
import type { Source } from "@/lib/sources/types";
import type { AirlineCount } from "@/lib/aviation-news/types";
import { DATE_RANGES } from "@/lib/aviation-news/filters";
import {
  DATE_RANGE_LABELS,
  selectLabel,
  SORT_LABELS,
  SORT_OPTIONS,
} from "@/components/aviation-news/filter-options";

interface FilterToolbarProps {
  categories: string[];
  sources: Source[];
  airlines: AirlineCount[];
  searchParams: SearchParams;
}

export function FilterToolbar({ categories, sources, airlines, searchParams }: FilterToolbarProps) {
  const router = useRouter();
  const sourceLabels = Object.fromEntries(sources.map((s) => [s.id, s.name]));

  function navigate(key: string, value: string | null) {
    router.push(`/aviation-news?${withParam(searchParams, key, value ?? "All")}`);
  }

  return (
    <div className="hidden flex-wrap items-center gap-2 md:flex">
      <Select
        value={toSingle(searchParams.category) ?? "All"}
        onValueChange={(v) => navigate("category", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[170px]">
          <SelectValue>{selectLabel("Categories")}</SelectValue>
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

      <Select
        value={toArray(searchParams.severity)[0] ?? "All"}
        onValueChange={(v) => navigate("severity", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[156px]">
          <SelectValue>{selectLabel("Severities", SEVERITY_LABELS)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Severities</SelectItem>
          {SEVERITY_VALUES.map((severity) => (
            <SelectItem key={severity} value={severity}>
              {SEVERITY_LABELS[severity]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSingle(searchParams.source) ?? "All"}
        onValueChange={(v) => navigate("source", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[156px]">
          <SelectValue>{selectLabel("Sources", sourceLabels)}</SelectValue>
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

      <Select
        value={toSingle(searchParams.airline) ?? "All"}
        onValueChange={(v) => navigate("airline", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[180px]">
          <SelectValue>{selectLabel("Airlines")}</SelectValue>
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

      <Select
        value={toSingle(searchParams.range) ?? "All"}
        onValueChange={(v) => navigate("range", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[156px]">
          <SelectValue>{selectLabel("Date range", DATE_RANGE_LABELS)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DATE_RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={toSingle(searchParams.sort) ?? "desc"}
        onValueChange={(v) => navigate("sort", v)}
      >
        <SelectTrigger className="h-9 bg-card dark:bg-card w-[156px]">
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
  );
}
