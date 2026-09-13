import Link from "next/link";

import { Button } from "@/components/ui/button";
import { withPage, type SearchParams } from "@/lib/shared/search-params";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  searchParams: SearchParams;
}

export function Pagination({ page, pageSize, total, searchParams }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} &middot; {total} incidents
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/aviation-news?${withPage(searchParams, page - 1)}`} />}
          >
            Previous
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
        )}
        {page < totalPages ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={`/aviation-news?${withPage(searchParams, page + 1)}`} />}
          >
            Next
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
