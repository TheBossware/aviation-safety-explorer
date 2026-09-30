import Link from "next/link";
import { AlertTriangle, ClipboardCheck, Newspaper, Rss, Siren } from "lucide-react";

import { getDashboardData } from "@/lib/dashboard-data";
import {
  ISIT_OUTCOME_VALUES,
  ISIT_WORKFLOW_STATUS_VALUES,
  OUTCOME_LABELS,
  WORKFLOW_STATUS_LABELS,
} from "@/lib/isit-classification/types";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import { BarList } from "@/components/dashboard/bar-list";
import { SeverityBySource } from "@/components/dashboard/severity-by-source";
import { SeverityLegend } from "@/components/dashboard/severity-legend";
import { Meter, StatCard } from "@/components/dashboard/stat-card";
import { WeeklySeverityChart } from "@/components/dashboard/weekly-severity-chart";
import { DetailsButton } from "@/components/nav-buttons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null): string {
  return value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short",
      })
    : "never";
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData();
  } catch {
    return (
      <Card className="border-destructive/30">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <CardTitle>Database unavailable</CardTitle>
            <CardDescription>
              Could not connect to MongoDB. Set MONGODB_URI in .env.local and make sure the database is reachable.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const { news, weekly, sources, categories, airlines, recentHigh, isit } = data;
  const weeklyTotal = weekly.reduce((sum, w) => sum + w.INFO + w.LOW + w.MEDIUM + w.HIGH + w.CRITICAL, 0);
  const delta = news.fetchedLast7d - news.fetchedPrev7d;
  const approved = isit.status.approved ?? 0;
  const needsAttention = (isit.status.needs_review ?? 0) + (isit.status.stale ?? 0);

  const statusRows = ISIT_WORKFLOW_STATUS_VALUES.filter((s) => isit.status[s]).map((s) => ({
    key: s,
    label: WORKFLOW_STATUS_LABELS[s],
    count: isit.status[s]!,
  }));
  const outcomeLine = ISIT_OUTCOME_VALUES.filter((o) => isit.outcomes[o])
    .map((o) => `${OUTCOME_LABELS[o]} ${isit.outcomes[o]}`)
    .join(" · ");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Aviation safety news from {sources.rows.length} sources · last item received {formatDateTime(data.lastIngestAt)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="News items"
          value={news.total.toLocaleString("en-US")}
          icon={Newspaper}
          href="/aviation-news"
          description={
            <>
              <span className="font-medium text-foreground">{news.fetchedLast7d}</span> received in the last 7 days (
              {delta >= 0 ? "+" : "−"}
              {Math.abs(delta)} vs the 7 days before)
            </>
          }
        />
        <StatCard
          title="High & critical, last 30 days"
          value={news.highLast30d}
          icon={Siren}
          href="/aviation-news?severity=HIGH&severity=CRITICAL&range=30d"
          description="By publication date. Opens the filtered list."
        />
        <StatCard
          title="Active sources"
          value={sources.activeCount}
          icon={Rss}
          href="/sources"
          tone={sources.silent.length ? "warning" : "default"}
          description={
            sources.silent.length ? (
              <span className="text-destructive">No items yet from: {sources.silent.join(", ")}</span>
            ) : (
              "All active sources have delivered items."
            )
          }
        />
        <StatCard
          title="ISIT reviewed"
          value={`${approved} / ${isit.total}`}
          icon={ClipboardCheck}
          href="/isit-review"
          description={`${needsAttention} flagged for review · the rest are AI suggestions awaiting approval`}
        >
          <Meter value={approved} max={isit.total} label="ISIT records approved by a reviewer" />
        </StatCard>
      </div>

      <ChartCard
        title="Reports per week"
        description={`${weeklyTotal} items published in the last ${weekly.length} weeks, by severity. Hover a week for its numbers.`}
      >
        <div className="flex flex-col gap-3">
          <SeverityLegend />
          <WeeklySeverityChart data={weekly} />
        </div>
      </ChartCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Sources" description="All-time items per source and their severity mix. Click a source to see its items.">
          <div className="flex flex-col gap-4">
            <SeverityLegend />
            <SeverityBySource rows={sources.rows} />
          </div>
        </ChartCard>
        <ChartCard title="Categories" description="All-time items per category. Click to filter the list.">
          <BarList rows={categories} href={(row) => `/aviation-news?category=${encodeURIComponent(row.key)}`} />
        </ChartCard>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">ISIT classification</h2>
        <p className="text-sm text-muted-foreground">
          AvHerald occurrences classified against the IATA Safety Incident Taxonomy. Counts use the approved result where
          a reviewer approved one, otherwise the AI suggestion.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title="Review status"
          description={outcomeLine || "No classifications yet."}
          action={<DetailsButton href="/isit-review">Review</DetailsButton>}
        >
          <BarList rows={statusRows} href={(row) => `/isit-review?status=${row.key}`} barClassName="bg-primary" />
        </ChartCard>
        <ChartCard title="What happened, by ISIT group" description="Records with at least one event code in the group.">
          <BarList rows={isit.groups} />
        </ChartCard>
        <ChartCard title="Most frequent events" description={`Top ${isit.eventCodes.length} event codes, with the event type they belong to.`}>
          <BarList rows={isit.eventCodes} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Operational context" description="Most frequent context codes: phase of flight, operational impact, damage.">
          <BarList rows={isit.contextCodes} />
        </ChartCard>
        <ChartCard title="Review flags" description="Why records were sent to a reviewer. Hover a flag in the review queue for its meaning.">
          <BarList rows={isit.flags} emptyMessage="No flags raised." barClassName="bg-destructive/70" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Most mentioned airlines" description={`Top ${airlines.length} operators and airlines named in the news. Click to filter.`}>
          <BarList rows={airlines} href={(row) => `/aviation-news?airline=${encodeURIComponent(row.key)}`} />
        </ChartCard>
        <ChartCard
          title="Latest high & critical"
          description="Most recently published high and critical severity items."
          action={<DetailsButton href="/aviation-news?severity=HIGH&severity=CRITICAL">All</DetailsButton>}
        >
          {recentHigh.length === 0 ? (
            <p className="text-sm text-muted-foreground">No high or critical items.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentHigh.map((item) => (
                <li key={String(item._id)} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/aviation-news/${item._id}`} className="flex min-w-0 flex-col gap-0.5 hover:underline">
                    <span className="line-clamp-2 text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.source_name} · {formatDate(item.published_at)}
                    </span>
                  </Link>
                  <SeverityBadge severity={item.severity} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
