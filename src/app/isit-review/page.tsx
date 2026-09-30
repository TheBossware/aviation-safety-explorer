import Link from "next/link";
import { BookOpen, ClipboardCheck } from "lucide-react";

import * as isitRepository from "@/lib/isit-classification/repository";
import {
  ISIT_WORKFLOW_STATUS_VALUES,
  WORKFLOW_STATUS_LABELS,
  type IsitWorkflowStatus,
} from "@/lib/isit-classification/types";
import { formatDate } from "@/lib/shared/format-date";
import { isOneOf } from "@/lib/shared/guards";
import { toSingle, type SearchParams } from "@/lib/shared/search-params";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlagList, OutcomeBadge, WorkflowStatusBadge } from "@/components/isit-review/status-badges";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

/** Order of the status tabs: what needs a human first. */
const TAB_ORDER: IsitWorkflowStatus[] = ["needs_review", "ai_suggested", "stale", "ai_failed", "approved", "pending"];

export default async function IsitReviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = toSingle(params.status);
  const status = isOneOf(ISIT_WORKFLOW_STATUS_VALUES, requested) ? requested : undefined;

  const [rows, counts] = await Promise.all([isitRepository.findForReview({ status }), isitRepository.countByStatus()]);
  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const tabClass = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-sm ${active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <ClipboardCheck className="mt-1 size-5 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold">ISIT Review</h1>
            <p className="text-sm text-muted-foreground">
              AvHerald items classified against the IATA Safety Incident Taxonomy. AI suggestions become final only when
              approved here.
            </p>
          </div>
        </div>
        <Button nativeButton={false} render={<Link href="/isit-review/guide" />}>
          <BookOpen />
          Review guide
        </Button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b pb-4" aria-label="Filter by status">
        <Link href="/isit-review" className={tabClass(!status)}>
          All ({total})
        </Link>
        {TAB_ORDER.filter((s) => counts[s]).map((s) => (
          <Link key={s} href={`/isit-review?status=${s}`} className={tabClass(status === s)}>
            {WORKFLOW_STATUS_LABELS[s]} ({counts[s]})
          </Link>
        ))}
      </nav>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>News</TableHead>
              <TableHead className="w-56">Flags</TableHead>
              <TableHead className="w-28">Posted</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">AI suggestion</TableHead>
              <TableHead className="w-36">Final</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.newsId}>
                <TableCell className="text-center text-muted-foreground tabular-nums">{index + 1}</TableCell>
                <TableCell className="max-w-0 whitespace-normal">
                  <Link href={`/isit-review/${row.newsId}`} className="font-medium hover:underline">
                    {row.title}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-normal">
                  {row.flags.length > 0 ? <FlagList flags={row.flags} /> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.publishedAt ? formatDate(row.publishedAt) : "—"}</TableCell>
                <TableCell>
                  <WorkflowStatusBadge status={row.workflowStatus} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <OutcomeBadge outcome={row.aiOutcome} />
                    {row.aiCodeCount > 0 && <span className="text-xs text-muted-foreground">{row.aiCodeCount} codes</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <OutcomeBadge outcome={row.finalOutcome} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No records with this status.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
