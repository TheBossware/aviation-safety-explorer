import { currentProposal } from "@/lib/isit-classification/review";
import { OUTCOME_LABELS, type IsitClassification } from "@/lib/isit-classification/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordDate } from "@/components/isit-review/record-date";
import { ReviewForm } from "@/components/isit-review/review-form";

/** The reviewer's decision: who approved what, and the form to approve or change it. */
export function ReviewCard({
  newsId,
  record,
  reviewer,
  taxonomyVersion,
}: {
  newsId: string;
  record: IsitClassification;
  /** Name remembered from the reviewer's last review, prefilled in the form. */
  reviewer: string;
  /** Taxonomy the code picker shows: of the approved result, else of the AI run, else the current one. */
  taxonomyVersion: string;
}) {
  const proposal = currentProposal(record);

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-base">Review</CardTitle>
        {record.final && (
          <p className="text-xs text-muted-foreground">
            Approved as {OUTCOME_LABELS[record.final.outcome]} by {record.final.approved_by} on{" "}
            {recordDate(record.final.approved_at)} (reviewer names are not verified)
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <ReviewForm
          key={String(record.final?.approved_at ?? record.ai?.suggestion_id ?? "new")}
          newsId={newsId}
          reviewer={reviewer}
          outcome={proposal.outcome}
          taxonomyVersion={taxonomyVersion}
          codes={proposal.codes.map((c) => c.code)}
          aiCodes={(record.ai?.codes ?? []).map((c) => c.code)}
          isApproved={Boolean(record.final)}
        />
      </CardContent>
    </Card>
  );
}
