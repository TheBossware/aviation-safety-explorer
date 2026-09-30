"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { WeeklyPoint } from "@/lib/dashboard/types";
import { formatDateUtc } from "@/lib/shared/format-date";
import { SEVERITY_HEX } from "@/lib/shared/severity-colors";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";

const config: ChartConfig = Object.fromEntries(
  SEVERITY_VALUES.map((severity) => [severity, { label: SEVERITY_LABELS[severity], color: SEVERITY_HEX[severity] }])
);

/** `week` is a YYYY-MM-DD key (Monday, UTC). */
function formatWeek(week: string): string {
  return formatDateUtc(`${week}T00:00:00Z`);
}

/** Items per publication week, stacked by severity (Info at the base, Critical on top). */
export function WeeklySeverityChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} margin={{ left: -16, right: 4, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} tickFormatter={formatWeek} />
        <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={40} />
        <ChartTooltip
          cursor={{ fillOpacity: 0.5 }}
          content={<ChartTooltipContent labelFormatter={(value) => `Week of ${formatWeek(String(value))}`} />}
        />
        {SEVERITY_VALUES.map((severity) => (
          <Bar
            key={severity}
            dataKey={severity}
            stackId="severity"
            fill={`var(--color-${severity})`}
            stroke="var(--card)"
            strokeWidth={1}
            maxBarSize={24}
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
