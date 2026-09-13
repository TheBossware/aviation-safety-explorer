"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { buildCategoricalChartConfig } from "@/lib/shared/chart-palette";
import type { SourceCount } from "@/lib/aviation-news/repository";

export function SourcePieChart({ data }: { data: SourceCount[] }) {
  const config = buildCategoricalChartConfig(data.map((row) => row.source));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports by source</CardTitle>
        <CardDescription>All-time share</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="source" />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="source"
              innerRadius={55}
              minAngle={3}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.source} fill={`var(--color-${entry.source})`} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="source" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
