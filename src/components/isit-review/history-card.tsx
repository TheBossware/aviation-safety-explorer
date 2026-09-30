import { describeReviewEvent } from "@/lib/isit-classification/review-history";
import type { IsitReviewEvent } from "@/lib/isit-classification/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordDate } from "@/components/isit-review/record-date";

/** Every review action on the record, newest first; nothing when it was never reviewed. */
export function HistoryCard({ events }: { events: IsitReviewEvent[] }) {
  if (events.length === 0) return null;

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <ul className="flex flex-col gap-2 text-sm">
          {events.map((event) => (
            <li key={String(event._id)} className="border-l-2 pl-3">
              <span className="text-xs text-muted-foreground">{recordDate(event.at)}</span>{" "}
              <span className="font-medium">{event.actor}</span> {describeReviewEvent(event)}
              {event.comment && <p className="text-muted-foreground">“{event.comment}”</p>}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
