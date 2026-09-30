import { Sparkles } from "lucide-react";

import { compareIsitCodes } from "@/components/isit-review/isit-tree";
import { currentProposal } from "@/lib/isit-classification/review";
import type { IsitClassification } from "@/lib/isit-classification/types";
import { DetailsButton } from "@/components/nav-buttons";
import { OutcomeBadge, WorkflowStatusBadge } from "@/components/isit-review/status-badges";

/**
 * Compact, deliberately eye-catching ISIT box for a news card: status on the first line, the
 * leading code on the second. Only shown once the record has an AI suggestion or a human result.
 */
export function IsitSummary({ record }: { record: IsitClassification }) {
  if (!record.ai && !record.final) return null;

  const { outcome, codes } = currentProposal(record);
  // Lead with an event (what happened), in ISIT order.
  const [first, ...rest] = [...codes].sort(
    (a, b) => Number(b.dimension === "event") - Number(a.dimension === "event") || compareIsitCodes(a.code, b.code)
  );

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-primary/60 bg-primary/10 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          ISIT
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          <WorkflowStatusBadge status={record.workflow_status} />
          <OutcomeBadge outcome={outcome} />
        </div>
        <DetailsButton href={`/isit-review/${String(record.news_id)}`} size="xs" />
      </div>

      {first && (
        <p
          className="flex min-w-0 items-baseline gap-1.5 text-xs"
          title={codes.map((c) => `${c.code} ${c.label}`).join("\n")}
        >
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{first.code}</span>
          <span className="truncate">{first.label}</span>
          {rest.length > 0 && <span className="shrink-0 text-muted-foreground">+{rest.length} more</span>}
        </p>
      )}
    </div>
  );
}
