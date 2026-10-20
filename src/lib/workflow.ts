import type { Finding, FindingStatus, Inspection, ReviewRecord, Severity } from "./types";

export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function severityRank(s: Severity): number {
  return SEVERITY_ORDER[s] ?? 0;
}

export function isReviewed(f: Finding): boolean {
  return f.status === "approved" || f.status === "rejected" || f.status === "edited";
}

export function isPublishable(f: Finding): boolean {
  return f.status === "approved" || f.status === "edited";
}

/** Findings that still block publication of an inspection's report. */
export function blockingFindings(findings: Finding[]): Finding[] {
  return findings.filter((f) => !isReviewed(f));
}

export interface ReviewGate {
  canPublish: boolean;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function reviewGate(findings: Finding[]): ReviewGate {
  const pending = findings.filter((f) => f.status === "pending_review").length;
  const approved = findings.filter((f) => isPublishable(f)).length;
  const rejected = findings.filter((f) => f.status === "rejected").length;
  return {
    canPublish: pending === 0 && findings.length > 0,
    total: findings.length,
    pending,
    approved,
    rejected,
  };
}

/** Latest action per finding, derived from the review history. */
export function latestReview(
  records: ReviewRecord[],
  findingId: string
): ReviewRecord | undefined {
  const forFinding = records
    .filter((r) => r.findingId === findingId)
    .sort((a, b) => a.at.localeCompare(b.at));
  return forFinding[forFinding.length - 1];
}

export function reviewHistory(records: ReviewRecord[], findingId: string): ReviewRecord[] {
  return records
    .filter((r) => r.findingId === findingId)
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function applyReview(
  finding: Finding,
  action: "approve" | "reject" | "edit",
  reviewer: string,
  comment: string,
  now: string
): { finding: Finding; record: ReviewRecord } {
  const status: FindingStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "edited";
  const next: Finding = { ...finding, status };
  const record: ReviewRecord = {
    id: `r_${Math.random().toString(36).slice(2, 10)}`,
    findingId: finding.id,
    action: status,
    reviewer,
    comment,
    at: now,
  };
  return { finding: next, record };
}

export function nextFindingReference(findings: Finding[]): string {
  const nums = findings
    .map((f) => parseInt(f.reference.replace(/^F-/, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `F-${String(max + 1).padStart(3, "0")}`;
}

export function severityColor(s: Severity): string {
  switch (s) {
    case "critical":
      return "bg-red-600 text-white";
    case "high":
      return "bg-orange-500 text-white";
    case "medium":
      return "bg-amber-400 text-navy-900";
    case "low":
      return "bg-emerald-500 text-white";
    default:
      return "bg-gray-400 text-white";
  }
}

export function statusBadgeClass(status: FindingStatus): string {
  switch (status) {
    case "pending_review":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "edited":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function inspectionStatusLabel(status: Inspection["status"]): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "in_progress":
      return "In progress";
    case "review":
      return "In review";
    case "published":
      return "Report published";
  }
}

/** Simple slug for property names → used in detail routes. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
