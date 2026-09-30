import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  /** One line under the value: context, a delta, a warning. */
  description?: React.ReactNode;
  /** Makes the whole tile a link to the data behind the number. */
  href?: string;
  /** Extra visual under the value, e.g. a meter. */
  children?: React.ReactNode;
  tone?: "default" | "warning";
}

export function StatCard({ title, value, icon: Icon, description, href, children, tone = "default" }: StatCardProps) {
  const card = (
    <Card className={cn("h-full gap-2", href && "transition-shadow hover:shadow-md")}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "warning" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        {children}
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
  return href ? (
    <Link href={href} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      {card}
    </Link>
  ) : (
    card
  );
}

/** Share of a whole: filled part in the accent, the track a lighter step of the same hue. */
export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-primary/15" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(percent, value > 0 ? 2 : 0)}%` }} />
    </div>
  );
}
