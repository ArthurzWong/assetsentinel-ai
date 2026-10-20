import type { Severity } from "./types";

/** Fill colours for severity markers — shared by the konva canvas, HTML overlays and the PDF composer. */
export const SEVERITY_FILL: Record<Severity, string> = {
  critical: "#dc2626",
  high: "#f97316",
  medium: "#fbbf24",
  low: "#10b981",
};
