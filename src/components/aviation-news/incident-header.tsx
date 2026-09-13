"use client";

import { useRouter } from "next/navigation";
import { FileText, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { toArray, toSingle, type SearchParams } from "@/lib/shared/search-params";

/** Filters preserved as hidden fields so the search box doesn't reset them on submit. */
const PRESERVE_KEYS = ["category", "severity", "source", "range", "aircraft", "tag"] as const;

export function IncidentHeader({ searchParams }: { searchParams: SearchParams }) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Intercept so this goes through the client router (shows loading.tsx)
    // instead of a full page reload; falls back to the native GET without JS.
    event.preventDefault();
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string" && value) params.append(key, value);
    }
    router.push(`/aviation-news?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-2">
        <FileText className="mt-1 size-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Incidents</h1>
          <p className="text-sm text-muted-foreground">
            Stay informed with the latest aviation safety reports and incidents.
          </p>
        </div>
      </div>

      <form
        method="GET"
        action="/aviation-news"
        onSubmit={handleSubmit}
        className="relative w-full sm:w-[360px]"
      >
        {PRESERVE_KEYS.flatMap((key) =>
          toArray(searchParams[key]).map((value) => (
            <input key={`${key}-${value}`} type="hidden" name={key} value={value} />
          ))
        )}
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={toSingle(searchParams.q)}
          placeholder="Search by aircraft, flight, source, tag..."
          className="h-10 pl-9"
        />
      </form>
    </div>
  );
}
