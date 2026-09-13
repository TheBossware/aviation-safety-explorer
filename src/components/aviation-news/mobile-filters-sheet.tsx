"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterForm } from "@/components/aviation-news/filter-form";
import type { SearchParams } from "@/lib/shared/search-params";
import type { Source } from "@/lib/sources/types";

interface MobileFiltersSheetProps {
  categories: string[];
  sources: Source[];
  searchParams: SearchParams;
}

export function MobileFiltersSheet({ categories, sources, searchParams }: MobileFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="lg:hidden" />}>
        <SlidersHorizontal className="size-4" />
        Filters
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-5">
          {/* Remounting on open resets any in-progress edits each time the sheet opens. */}
          {open && (
            <FilterForm
              key={JSON.stringify(searchParams)}
              idPrefix="mobile"
              categories={categories}
              sources={sources}
              searchParams={searchParams}
              onSubmitted={() => setOpen(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
