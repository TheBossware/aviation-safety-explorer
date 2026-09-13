import { cn } from "@/lib/utils";
import { SEVERITY_LABELS, type Severity } from "@/lib/shared/types";

/**
 * Deliberate exception to the app's slate/orange palette: the design spec calls
 * for a distinct semantic color per severity, used only on this badge.
 */
const SEVERITY_STYLES: Record<Severity, string> = {
  INFO: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400",
  CRITICAL: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}

export const SEVERITY_DOT_COLOR: Record<Severity, string> = {
  INFO: "bg-slate-400",
  LOW: "bg-emerald-500",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};
