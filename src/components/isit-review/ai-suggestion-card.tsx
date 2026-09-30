import type { IsitClassification, IsitSuggestion } from "@/lib/isit-classification/types";
import type { StoredStages } from "@/lib/isit-classification/stages";
import { toTreePayload, type IsitTaxonomy } from "@/lib/isit-taxonomy/taxonomy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildIsitTree } from "@/components/isit-review/isit-tree";
import { recordDate } from "@/components/isit-review/record-date";
import { OutcomeBadge } from "@/components/isit-review/status-badges";
import { TreeView } from "@/components/isit-review/tree-view";

/** The latest AI run: which model and prompt, the gate's verdict, and the suggested codes in place in the taxonomy. */
export function AiSuggestionCard({
  record,
  suggestion,
  stages,
  taxonomy,
}: {
  record: IsitClassification;
  suggestion: IsitSuggestion | null;
  stages: StoredStages;
  taxonomy: IsitTaxonomy;
}) {
  const aiCodes = record.ai?.codes ?? [];
  const tree = aiCodes.length ? suggestionTree(record, stages, taxonomy) : [];

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          AI suggestion <OutcomeBadge outcome={record.ai?.outcome ?? null} />
        </CardTitle>
        {suggestion && (
          <p className="text-xs text-muted-foreground">
            {suggestion.model} · prompt {suggestion.prompt_version} · taxonomy {suggestion.taxonomy_version} ·{" "}
            {recordDate(suggestion.created_at)}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 pt-4 text-sm">
        {!record.ai && <p className="text-muted-foreground">No AI suggestion yet.</p>}

        {stages.gate && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Gate: {stages.gate.post_type} → {stages.gate.decision}
              {!stages.gate.title_content_consistent && " · title and article disagree"}
            </p>
            <p className="mt-1">{stages.gate.rationale}</p>
          </div>
        )}

        {tree.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              ISIT codes ({aiCodes.length})
            </p>
            <TreeView nodes={tree} aria-label="AI-suggested ISIT codes" defaultExpanded="all" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Only the suggested codes and their ancestors, each with the model's confidence, quote and rationale. */
function suggestionTree(record: IsitClassification, stages: StoredStages, taxonomy: IsitTaxonomy) {
  const confidence = new Map(stages.select?.output.codes.map((c) => [c.code, c.confidence]) ?? []);
  const aiByCode = new Map((record.ai?.codes ?? []).map((c) => [c.code, c]));

  return buildIsitTree(toTreePayload(taxonomy), {
    include: aiByCode.keys(),
    decorate: (code) => {
      const c = aiByCode.get(code);
      if (!c) return undefined;
      return {
        badges: confidence.get(code) ? (
          <span className="text-xs text-muted-foreground">({confidence.get(code)} confidence)</span>
        ) : undefined,
        detail: (
          <div className="flex flex-col gap-0.5">
            {c.evidence_quote && <p className="text-sm text-muted-foreground italic">“{c.evidence_quote}”</p>}
            {c.rationale && <p className="text-xs text-muted-foreground">{c.rationale}</p>}
          </div>
        ),
      };
    },
  });
}
