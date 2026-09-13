import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";

import { FilterForm } from "@/components/aviation-news/filter-form";
import type { SearchParams } from "@/lib/shared/search-params";
import type { Source } from "@/lib/sources/types";

interface FilterPanelDesktopProps {
  categories: string[];
  sources: Source[];
  searchParams: SearchParams;
}

export function FilterPanelDesktop({ categories, sources, searchParams }: FilterPanelDesktopProps) {
  return (
    <aside className="hidden w-[290px] shrink-0 border-l bg-card p-5 lg:block">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold">
          <SlidersHorizontal className="size-4" />
          Filters
        </h2>
        <Link href="/aviation-news" className="text-xs text-muted-foreground hover:text-foreground">
          Clear all
        </Link>
      </div>
      {/* Remount whenever the filters change so uncontrolled fields (checkboxes,
          selects) re-initialize from the new URL instead of keeping stale state. */}
      <FilterForm
        key={JSON.stringify(searchParams)}
        idPrefix="desktop"
        categories={categories}
        sources={sources}
        searchParams={searchParams}
      />
    </aside>
  );
}
