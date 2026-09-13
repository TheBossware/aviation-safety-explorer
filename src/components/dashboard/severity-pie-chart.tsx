"use client";

import { Cell, Pie, PieChart } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SEVERITY_HEX } from "@/lib/shared/severity-colors";
import { SEVERITY_LABELS } from "@/lib/shared/types";
import type { SeverityCount } from "@/lib/aviation-news/repository";

function buildConfig(data: SeverityCount[]): ChartConfig {
  const config: ChartConfig = {};
  for (const row of data) {
    config[row.severity] = { label: SEVERITY_LABELS[row.severity], color: SEVERITY_HEX[row.severity] };
  }
  return config;
}

export function SeverityPieChart({ data }: { data: SeverityCount[] }) {
  const config = buildConfig(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports by severity</CardTitle>
        <CardDescription>All-time share</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="severity" />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="severity"
              innerRadius={55}
              minAngle={3}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.severity} fill={`var(--color-${entry.severity})`} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="severity" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
