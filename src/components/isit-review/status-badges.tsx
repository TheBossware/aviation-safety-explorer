import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { describeFlag } from "@/components/isit-review/flag-descriptions";
import type { IsitOutcome, IsitWorkflowStatus } from "@/lib/isit-classification/types";

export const WORKFLOW_STATUS_LABELS: Record<IsitWorkflowStatus, string> = {
  pending: "Pending",
  ai_failed: "AI failed",
  ai_suggested: "AI suggested",
  needs_review: "Needs review",
  approved: "Approved",
  stale: "Stale",
};

const WORKFLOW_STATUS_VARIANT: Record<IsitWorkflowStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  ai_failed: "destructive",
  ai_suggested: "secondary",
  needs_review: "destructive",
  approved: "default",
  stale: "outline",
};

export const OUTCOME_LABELS: Record<IsitOutcome, string> = {
  classified: "Classified",
  not_applicable: "Not applicable",
  insufficient_evidence: "Insufficient evidence",
  revoked: "Revoked",
};

export function WorkflowStatusBadge({ status }: { status: IsitWorkflowStatus }) {
  return <Badge variant={WORKFLOW_STATUS_VARIANT[status]}>{WORKFLOW_STATUS_LABELS[status]}</Badge>;
}

export function OutcomeBadge({ outcome }: { outcome: IsitOutcome | null }) {
  if (!outcome) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant={outcome === "classified" ? "secondary" : "outline"} className="font-normal">
      {OUTCOME_LABELS[outcome]}
    </Badge>
  );
}

/** Who put a code into the result: the AI suggestion or a subject-matter expert (reviewer). */
export function CodeSourceBadge({ source }: { source: "ai" | "sme" }) {
  return (
    <Badge variant={source === "sme" ? "default" : "outline"} className="h-4 px-1.5 text-[10px]">
      {source === "sme" ? "SME" : "AI"}
    </Badge>
  );
}

export function FlagList({ flags }: { flags: string[] }) {
  if (!flags.length) return null;
  const chipClass = "rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground";
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => {
        const description = describeFlag(flag);
        if (!description) {
          return (
            <span key={flag} className={chipClass}>
              {flag}
            </span>
          );
        }
        return (
          <Tooltip key={flag}>
            <TooltipTrigger
              render={<span tabIndex={0} aria-label={`${flag}: ${description}`} />}
              className={cn(chipClass, "cursor-help hover:text-foreground")}
            >
              {flag}
            </TooltipTrigger>
            <TooltipContent>{description}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
