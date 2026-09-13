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

const DATE_RANGES = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "6m", label: "Last 6 months" },
  { value: "1y", label: "Last 1 year" },
  { value: "All", label: "All time" },
];

interface FilterFormProps {
  /** Distinguishes ids between the desktop aside and mobile sheet instances. */
  idPrefix: string;
  categories: string[];
  sources: Source[];
  searchParams: SearchParams;
  /** Called right after navigating, e.g. to close the mobile sheet. */
  onSubmitted?: () => void;
}

export function FilterForm({
  idPrefix,
  categories,
  sources,
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
          defaultValue={toSingle(searchParams.q)}
          placeholder="Search by aircraft, flight, source, tag..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select name="category" defaultValue={toSingle(searchParams.category) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-category`} className="w-full">
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
          <SelectTrigger id={`${idPrefix}-source`} className="w-full">
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
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-range`}>Date Range</Label>
        <Select name="range" defaultValue={toSingle(searchParams.range) ?? "All"}>
          <SelectTrigger id={`${idPrefix}-range`} className="w-full">
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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-aircraft`}>Aircraft / Flight</Label>
        <Input
          id={`${idPrefix}-aircraft`}
          name="aircraft"
          defaultValue={toSingle(searchParams.aircraft)}
          placeholder="e.g. B788, UA-108"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-tag`}>Tags</Label>
        <Input
          id={`${idPrefix}-tag`}
          name="tag"
          defaultValue={toSingle(searchParams.tag)}
          placeholder="e.g. diversion, turbulence"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit">Apply filters</Button>
        <Button
          variant="outline"
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
