import Link from "next/link";
import { AlertTriangle, Newspaper, Rss } from "lucide-react";

import { getDashboardData } from "@/lib/dashboard-data";
import { StatCard } from "@/components/stat-card";
import { SeverityBadge } from "@/components/aviation-news/severity-badge";
import { DailyVolumeChart } from "@/components/dashboard/daily-volume-chart";
import { SourcePieChart } from "@/components/dashboard/source-pie-chart";
import { SeverityPieChart } from "@/components/dashboard/severity-pie-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  let error: string | null = null;

  try {
    data = await getDashboardData();
  } catch {
    error =
      "Could not connect to MongoDB. Set MONGODB_URI in .env.local and make sure the database is reachable.";
  }

  if (error || !data) {
    return (
      <Card className="border-destructive/30">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <CardTitle>Database unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const { counts, recentNews, dailyVolume, topSources, sourceBreakdown, severityBreakdown } = data;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of aviation safety data across all collections.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Aviation News" value={counts.aviationNews} icon={Newspaper} />
        <StatCard title="Active Sources" value={counts.activeSources} icon={Rss} />
      </div>

      <DailyVolumeChart data={dailyVolume} topSources={topSources} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SourcePieChart data={sourceBreakdown} />
        <SeverityPieChart data={severityBreakdown} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Aviation News</CardTitle>
          <CardDescription>Latest 10 items across all sources.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentNews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No aviation news items yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {recentNews.map((item) => (
                <li
                  key={String(item._id)}
                  className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/aviation-news/${item._id}`}
                    className="flex flex-col gap-1 hover:underline"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} &middot; {new Date(item.published_at).toLocaleDateString()}
                    </p>
                  </Link>
                  <SeverityBadge severity={item.severity} className="shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
