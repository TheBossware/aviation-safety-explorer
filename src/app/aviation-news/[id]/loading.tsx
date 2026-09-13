import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IncidentDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-32" />

      <Card className="p-6">
        <CardHeader className="flex-row items-start justify-between gap-3 p-0">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </div>
          <Skeleton className="h-5 w-16 shrink-0 rounded-md" />
        </CardHeader>

        <CardContent className="flex flex-col gap-5 p-0 pt-4">
          <div className="flex gap-3">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>

          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>

          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <Skeleton className="h-28 w-full rounded-lg" />

          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}
