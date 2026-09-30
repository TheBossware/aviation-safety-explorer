"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { TreeView } from "@/components/isit-review/tree-view";
import { submitReviewAction, type ReviewFormState } from "@/app/isit-review/actions";
import { buildIsitTree, isitAncestorIds } from "@/components/isit-review/isit-tree";
import { OUTCOME_LABELS, type IsitOutcome } from "@/lib/isit-classification/types";
import type { IsitTreePayload } from "@/lib/isit-taxonomy/taxonomy";

interface ReviewFormProps {
  newsId: string;
  taxonomyVersion: string;
  reviewer: string;
  outcome: IsitOutcome | null;
  /** Codes the form starts with (the approved result, else the AI suggestion). */
  codes: string[];
  /** Codes the AI suggested, marked in the tree. */
  aiCodes: string[];
  isApproved: boolean;
}

const selectClassName =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** One fetch per taxonomy version per page session; the response itself is cached by the browser. */
const payloadCache = new Map<string, Promise<IsitTreePayload>>();
function fetchTaxonomy(version: string): Promise<IsitTreePayload> {
  let promise = payloadCache.get(version);
  if (!promise) {
    promise = fetch(`/isit-taxonomy/${version}`).then((response) => {
      if (!response.ok) throw new Error(`Taxonomy ${version} unavailable (${response.status})`);
      return response.json() as Promise<IsitTreePayload>;
    });
    promise.catch(() => payloadCache.delete(version));
    payloadCache.set(version, promise);
  }
  return promise;
}

function CodePicker({ version, codes, aiCodes }: { version: string; codes: string[]; aiCodes: string[] }) {
  const [payload, setPayload] = useState<IsitTreePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchTaxonomy(version)
      .then((data) => active && setPayload(data))
      .catch((err: Error) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [version]);

  const tree = useMemo(() => {
    if (!payload) return null;
    const ai = new Set(aiCodes);
    return buildIsitTree(payload, {
      decorate: (code) =>
        ai.has(code)
          ? {
              badges: (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  AI
                </Badge>
              ),
            }
          : undefined,
    });
  }, [payload, aiCodes]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!tree) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    );
  }

  return (
    <TreeView
      nodes={tree}
      aria-label="ISIT codes"
      selectionMode="multiple"
      name="codes"
      defaultSelected={codes}
      defaultExpanded={isitAncestorIds(tree, codes)}
      searchable
      searchPlaceholder="Search all ISIT codes by name, code or definition"
      listClassName="max-h-[28rem] overflow-y-auto rounded-lg border p-1"
    />
  );
}

export function ReviewForm({ newsId, taxonomyVersion, reviewer, outcome, codes, aiCodes, isApproved }: ReviewFormProps) {
  const [state, formAction, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction.bind(null, newsId),
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="actor">Reviewer</Label>
          <Input id="actor" name="actor" defaultValue={reviewer} placeholder="Your name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="outcome">Outcome</Label>
          <select id="outcome" name="outcome" defaultValue={outcome ?? "classified"} className={selectClassName}>
            {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>ISIT codes</Label>
        <p className="text-xs text-muted-foreground">
          Only used when the outcome is Classified. Pre-selected: {isApproved ? "the approved result" : "the AI suggestion"}{" "}
          (<span className="font-medium">AI</span> marks what the model proposed). Codes are in IATA&apos;s structure,
          sorted by code. Pick the most specific code the text supports.
        </p>
        <CodePicker version={taxonomyVersion} codes={codes} aiCodes={aiCodes} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" placeholder="Why you changed the suggestion (optional)" />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.savedAt && !state.error && <p className="text-sm text-muted-foreground">Saved.</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving..." : isApproved ? "Update approved result" : "Approve"}
      </Button>
    </form>
  );
}
