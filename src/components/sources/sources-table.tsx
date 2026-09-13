import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SourceDialog } from "@/components/sources/source-dialog";
import { DeleteSourceAlert } from "@/components/sources/delete-source-alert";
import { SOURCE_TYPE_LABELS, type Source } from "@/lib/sources/types";

export function SourcesTable({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No sources yet. Add one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sources.map((source) => (
          <TableRow key={String(source._id)}>
            <TableCell className="font-medium">{source.name}</TableCell>
            <TableCell>{SOURCE_TYPE_LABELS[source.type] ?? source.type}</TableCell>
            <TableCell>{source.category}</TableCell>
            <TableCell className="max-w-56 truncate">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {source.url}
              </a>
            </TableCell>
            <TableCell>
              <Badge variant={source.active ? "default" : "secondary"}>
                {source.active ? "Active" : "Inactive"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                <SourceDialog source={source} />
                <DeleteSourceAlert id={String(source._id)} name={source.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
