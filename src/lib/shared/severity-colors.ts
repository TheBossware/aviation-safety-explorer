import type { Severity } from "./types";

/**
 * Fixed status colors for severity — same hues used everywhere severity is
 * shown (badges, filter dots, charts), and unlike the categorical palette,
 * not swapped between light/dark (per dataviz skill: status steps are fixed).
 */
export const SEVERITY_HEX: Record<Severity, string> = {
  INFO: "#94a3b8", // slate-400
  LOW: "#10b981", // emerald-500
  MEDIUM: "#f59e0b", // amber-500
  HIGH: "#f97316", // orange-500
  CRITICAL: "#ef4444", // red-500
};
