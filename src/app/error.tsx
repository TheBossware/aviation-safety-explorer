"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Fallback for any page that throws while rendering. In production the message of a Server
 * Component error is replaced by Next.js; `digest` matches the full error in the server logs.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="border-destructive/30">
      <CardHeader className="flex flex-row items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            This page could not be loaded. Try again; if it keeps failing, check the server logs
            {error.digest ? ` for error ${error.digest}` : ""}.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={() => retry()}>
          <RotateCw data-icon="inline-start" />
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
