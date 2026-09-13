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

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 1 year" },
  { value: "All", label: "All time" },
];

interface FilterToolbarProps {
  categories: string[];
  sources: Source[];
  searchParams: SearchParams;
}

export function FilterToolbar({ categories, sources, searchParams }: FilterToolbarProps) {
  const router = useRouter();

  function navigate(key: string, value: string | null) {
    router.push(`/aviation-news?${withParam(searchParams, key, value ?? "All")}`);
  }

  return (
    <div className="hidden flex-wrap items-center gap-2 md:flex">
      <Select
        value={toSingle(searchParams.category) ?? "All"}
        onValueChange={(v) => navigate("category", v)}
      >
        <SelectTrigger className="h-9 w-[170px]">
          <SelectValue placeholder="All Categories" />
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
        <SelectTrigger className="h-9 w-[156px]">
          <SelectValue placeholder="All Severities" />
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
        <SelectTrigger className="h-9 w-[156px]">
          <SelectValue placeholder="All Sources" />
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
        value={toSingle(searchParams.range) ?? "All"}
        onValueChange={(v) => navigate("range", v)}
      >
        <SelectTrigger className="h-9 w-[156px]">
          <SelectValue placeholder="All time" />
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
  );
}
