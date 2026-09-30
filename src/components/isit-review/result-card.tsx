import { currentProposal } from "@/lib/isit-classification/review";
import type { IsitClassification } from "@/lib/isit-classification/types";
import { loadIsitTaxonomy, toTreePayload } from "@/lib/isit-taxonomy/taxonomy";
import { formatDateUtc } from "@/lib/shared/format-date";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildIsitTree } from "@/components/isit-review/isit-tree";
import { TreeView } from "@/components/isit-review/tree-view";
import { CodeSourceBadge, OutcomeBadge } from "@/components/isit-review/status-badges";

/**
 * The record's current ISIT result as a tree: the approved `final` if there is one, otherwise the AI
 * suggestion. Each code is badged AI (suggested by the model) or SME (added by a reviewer), and AI
 * codes a reviewer removed are listed struck through. Server-only (loads the taxonomy).
 */
export function IsitResultCard({
  record,
  title = "Current result",
  action,
  className,
}: {
  record: IsitClassification;
  title?: React.ReactNode;
  /** Optional control in the header's top-right corner, e.g. a link to the review page. */
  action?: React.ReactNode;
  className?: string;
}) {
  const proposal = currentProposal(record);
  const aiCodes = record.ai?.codes ?? [];
  const aiCodeSet = new Set(aiCodes.map((c) => c.code));
  const resultCodes = new Set(proposal.codes.map((c) => c.code));
  const removedAiCodes = record.final ? aiCodes.filter((c) => !resultCodes.has(c.code)) : [];
  const resultTree = proposal.codes.length
    ? buildIsitTree(toTreePayload(loadIsitTaxonomy()), {
        include: resultCodes,
        decorate: (code) =>
          resultCodes.has(code) ? { badges: <CodeSourceBadge source={aiCodeSet.has(code) ? "ai" : "sme"} /> } : undefined,
      })
    : [];

  return (
    <Card className={cn("p-6", className)}>
      <CardHeader className="p-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {title} <OutcomeBadge outcome={proposal.outcome} />
          </CardTitle>
          {action}
        </div>
        <p className="text-xs text-muted-foreground">
          {record.final
            ? `Approved by ${record.final.approved_by} on ${formatDateUtc(record.final.approved_at)}.`
            : "Not reviewed yet: this is the AI suggestion."}{" "}
          <CodeSourceBadge source="ai" /> suggested by the AI · <CodeSourceBadge source="sme" /> added by a reviewer
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-0 pt-4 text-sm">
        {resultTree.length > 0 ? (
          <TreeView nodes={resultTree} aria-label="Current ISIT codes" defaultExpanded="all" />
        ) : (
          <p className="text-muted-foreground">No ISIT codes.</p>
        )}
        {removedAiCodes.length > 0 && (
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <p className="font-semibold tracking-wide uppercase">Removed by reviewer ({removedAiCodes.length})</p>
            <ul className="flex flex-col gap-0.5">
              {removedAiCodes.map((c) => (
                <li key={c.code} className="line-through">
                  <span className="font-mono">{c.code}</span> {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
