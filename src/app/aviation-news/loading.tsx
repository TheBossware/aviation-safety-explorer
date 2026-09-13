import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton() {
  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-md" />
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="mt-auto flex items-center justify-between border-t pt-3">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    </Card>
  );
}

export default function AviationNewsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-start lg:gap-2">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-2">
            <Skeleton className="mt-1 size-5" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-full sm:w-[360px]" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <div className="hidden flex-wrap gap-2 md:flex">
            <Skeleton className="h-9 w-[170px]" />
            <Skeleton className="h-9 w-[156px]" />
            <Skeleton className="h-9 w-[156px]" />
            <Skeleton className="h-9 w-[156px]" />
          </div>
          <Skeleton className="h-9 w-24 lg:hidden" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Skeleton className="h-3.5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>

      <aside className="hidden w-[290px] shrink-0 border-l bg-card p-5 lg:block">
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3.5 w-14" />
        </div>
        <div className="flex flex-col gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
    </div>
  );
}
