"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildCategoricalChartConfig, OTHER_KEY } from "@/lib/shared/chart-palette";
import type { DailyVolumePoint } from "@/lib/dashboard-data";

function formatDayLabel(value: string): string {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface DailyVolumeChartProps {
  data: DailyVolumePoint[];
  topSources: string[];
}

export function DailyVolumeChart({ data, topSources }: DailyVolumeChartProps) {
  const seriesKeys = [...topSources, OTHER_KEY];
  const config = buildCategoricalChartConfig(seriesKeys);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily incoming volume</CardTitle>
        <CardDescription>Reports ingested per day, last 14 days, by source</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
          <BarChart data={data} margin={{ left: 0, right: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={formatDayLabel}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent labelFormatter={(value) => formatDayLabel(String(value))} />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {seriesKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="volume"
                fill={`var(--color-${key})`}
                maxBarSize={24}
                radius={index === seriesKeys.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
