import * as sourcesRepository from "@/lib/sources/repository";
import { Card, CardContent } from "@/components/ui/card";
import { SourceDialog } from "@/components/sources/source-dialog";
import { SourcesTable } from "@/components/sources/sources-table";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const sources = await sourcesRepository.findAll();

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Manage the feeds aviation news is pulled from.
          </p>
        </div>
        <SourceDialog />
      </div>

      <Card>
        <CardContent>
          <SourcesTable sources={sources} />
        </CardContent>
      </Card>
    </div>
  );
}
