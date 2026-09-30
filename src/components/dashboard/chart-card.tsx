import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** A titled dashboard panel with a one-line explanation and an optional button top right. */
export function ChartCard({
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
