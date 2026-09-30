import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IsitReviewDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-40" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </Card>
          <Card className="flex flex-col gap-3 p-6">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
        </div>
        <Card className="flex flex-col gap-2 p-6">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}
