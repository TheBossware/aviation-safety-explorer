import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SourcesLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-4 border-b pb-3">
            {["Name", "Type", "Category", "URL", "Status", ""].map((label, i) => (
              <Skeleton key={i} className={i === 5 ? "ml-auto h-4 w-16" : "h-4 w-20"} />
            ))}
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <div className="ml-auto flex gap-1">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="size-7 rounded-md" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
