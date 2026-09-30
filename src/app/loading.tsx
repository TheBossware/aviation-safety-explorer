import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function BarListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-2" style={{ width: `${90 - i * 12}%` }} />
        </div>
      ))}
    </div>
  );
}

function ChartCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-8 rounded-lg" />
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <ChartCardSkeleton>
        <Skeleton className="h-[260px] w-full" />
      </ChartCardSkeleton>

      {[2, 3, 2, 2].map((columns, row) => (
        <div key={row} className={`grid grid-cols-1 gap-4 ${columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {Array.from({ length: columns }).map((_, i) => (
            <ChartCardSkeleton key={i}>
              <BarListSkeleton />
            </ChartCardSkeleton>
          ))}
        </div>
      ))}
    </div>
  );
}
