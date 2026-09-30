import { SEVERITY_DOT_COLOR } from "@/components/aviation-news/severity-badge";
import { SEVERITY_LABELS, SEVERITY_VALUES } from "@/lib/shared/types";

/** Severity key shared by every severity-colored chart; identity never relies on color alone. */
export function SeverityLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {SEVERITY_VALUES.map((severity) => (
        <li key={severity} className="inline-flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${SEVERITY_DOT_COLOR[severity]}`} />
          {SEVERITY_LABELS[severity]}
        </li>
      ))}
    </ul>
  );
}
