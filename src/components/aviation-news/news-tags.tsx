import { Plane } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const AIRCRAFT_TAG_SIZE = {
  sm: "px-1.5 py-0.5 text-[11px]",
  md: "px-2 py-1 text-xs",
};

/** Aircraft type, registration and flight number chips (`source_tags`); nothing when there are none. */
export function AircraftTags({ tags, size }: { tags: string[]; size: keyof typeof AIRCRAFT_TAG_SIZE }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 rounded-md border bg-muted ${AIRCRAFT_TAG_SIZE[size]} text-muted-foreground`}
        >
          <Plane className="size-3" />
          {tag}
        </span>
      ))}
    </div>
  );
}

/** Topic tags (`tags`); with `max`, the rest collapse into a "+N" badge. Nothing when there are none. */
export function TopicTags({ tags, max }: { tags: string[]; max?: number }) {
  if (tags.length === 0) return null;
  const visible = max === undefined ? tags : tags.slice(0, max);
  const hidden = tags.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">
          {tag}
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge variant="secondary" className="font-normal">
          +{hidden}
        </Badge>
      )}
    </div>
  );
}
