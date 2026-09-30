import { AlertTriangle } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Shown instead of the dashboard when its data could not be loaded. */
export function DatabaseUnavailable() {
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
