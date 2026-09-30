import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IsitReviewLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1 size-5" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 flex-1" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </Card>
    </div>
  );
}
