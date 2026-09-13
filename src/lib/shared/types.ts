/** Severity levels shared by aviation news and recipient group filtering (stored uppercase in the DB). */
export type Severity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const SEVERITY_VALUES: readonly Severity[] = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const SEVERITY_LABELS: Record<Severity, string> = {
  INFO: "Info",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};
