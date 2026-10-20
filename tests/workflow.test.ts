import { describe, expect, it } from "vitest";
import {
  applyReview,
  blockingFindings,
  isPublishable,
  isReviewed,
  latestReview,
  nextFindingReference,
  reviewGate,
  reviewHistory,
} from "@/lib/workflow";
import { DEMO_FINDINGS, DEMO_INSPECTIONS, DEMO_PROPERTIES, DEMO_REVIEWS } from "@/lib/data";
import type { Finding } from "@/lib/types";

const mkFinding = (over: Partial<Finding>): Finding => ({
  id: "fx",
  inspectionId: "i1",
  imageId: "img1",
  reference: "F-099",
  defectType: "Corrosion",
  severity: "medium",
  title: "Test finding",
  notes: "",
  recommendations: "",
  status: "pending_review",
  isAiSuggestion: false,
  annotations: [],
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("review gate", () => {
  it("blocks publication while any finding is pending review", () => {
    const gate = reviewGate([
      mkFinding({ id: "1", status: "approved" }),
      mkFinding({ id: "2", status: "pending_review" }),
    ]);
    expect(gate.canPublish).toBe(false);
    expect(gate.pending).toBe(1);
  });

  it("allows publication when every finding is reviewed and at least one exists", () => {
    const gate = reviewGate([
      mkFinding({ id: "1", status: "approved" }),
      mkFinding({ id: "2", status: "rejected" }),
      mkFinding({ id: "3", status: "edited" }),
    ]);
    expect(gate.canPublish).toBe(true);
  });

  it("never allows publishing an empty inspection", () => {
    expect(reviewGate([]).canPublish).toBe(false);
  });
});

describe("finding classification", () => {
  it("treats only approved and edited findings as publishable", () => {
    expect(isPublishable(mkFinding({ status: "approved" }))).toBe(true);
    expect(isPublishable(mkFinding({ status: "edited" }))).toBe(true);
    expect(isPublishable(mkFinding({ status: "rejected" }))).toBe(false);
    expect(isPublishable(mkFinding({ status: "pending_review" }))).toBe(false);
  });

  it("treats rejected findings as reviewed but not publishable", () => {
    const f = mkFinding({ status: "rejected" });
    expect(isReviewed(f)).toBe(true);
    expect(isPublishable(f)).toBe(false);
  });

  it("lists pending findings as blockers", () => {
    const blockers = blockingFindings([
      mkFinding({ id: "1", status: "approved" }),
      mkFinding({ id: "2", status: "pending_review" }),
      mkFinding({ id: "3", status: "pending_review" }),
    ]);
    expect(blockers.map((f) => f.id)).toEqual(["2", "3"]);
  });
});

describe("applyReview", () => {
  it("maps approve/reject/edit to statuses and creates a history record", () => {
    const f = mkFinding({});
    const a = applyReview(f, "approve", "Reviewer", "ok", "2026-01-02T00:00:00Z");
    expect(a.finding.status).toBe("approved");
    expect(a.record.findingId).toBe("fx");
    expect(a.record.reviewer).toBe("Reviewer");

    const r = applyReview(f, "reject", "Reviewer", "no", "2026-01-02T00:00:00Z");
    expect(r.finding.status).toBe("rejected");

    const e = applyReview(f, "edit", "Reviewer", "changed", "2026-01-02T00:00:00Z");
    expect(e.finding.status).toBe("edited");
  });
});

describe("review history", () => {
  it("returns newest-first history and latest review", () => {
    const records = [
      { id: "r1", findingId: "f1", action: "approved" as const, reviewer: "A", comment: "", at: "2026-01-01T10:00:00Z" },
      { id: "r2", findingId: "f1", action: "rejected" as const, reviewer: "B", comment: "", at: "2026-01-02T10:00:00Z" },
      { id: "r3", findingId: "f2", action: "approved" as const, reviewer: "A", comment: "", at: "2026-01-03T10:00:00Z" },
    ];
    const hist = reviewHistory(records, "f1");
    expect(hist.map((r) => r.id)).toEqual(["r2", "r1"]);
    expect(latestReview(records, "f1")?.id).toBe("r2");
  });
});

describe("reference sequencing", () => {
  it("produces the next F-xxx reference", () => {
    expect(nextFindingReference([])).toBe("F-001");
    expect(nextFindingReference([mkFinding({ reference: "F-007" })])).toBe("F-008");
    expect(nextFindingReference([mkFinding({ reference: "F-002" }), mkFinding({ reference: "F-011" })])).toBe("F-012");
  });
});

describe("demo seed integrity", () => {
  it("has exactly 4 demo properties in the required towns", () => {
    expect(DEMO_PROPERTIES.map((p) => p.town).sort()).toEqual(["Klang", "Puchong", "Rawang", "Shah Alam"]);
  });

  it("has 3 inspections linked to known properties", () => {
    expect(DEMO_INSPECTIONS).toHaveLength(3);
    const ids = new Set(DEMO_PROPERTIES.map((p) => p.id));
    for (const i of DEMO_INSPECTIONS) {
      expect(ids.has(i.propertyId)).toBe(true);
    }
  });

  it("has 15 findings, all linked to real inspections and images", () => {
    expect(DEMO_FINDINGS).toHaveLength(15);
    const insp = new Set(DEMO_INSPECTIONS.map((i) => i.id));
    for (const f of DEMO_FINDINGS) {
      expect(insp.has(f.inspectionId)).toBe(true);
    }
  });

  it("includes at least one pending finding so the review gate is demonstrable", () => {
    expect(DEMO_FINDINGS.filter((f) => f.status === "pending_review").length).toBeGreaterThan(0);
  });

  it("includes review records covering reviewed findings", () => {
    const reviewed = DEMO_FINDINGS.filter((f) => f.status !== "pending_review");
    for (const f of reviewed) {
      expect(DEMO_REVIEWS.some((r) => r.findingId === f.id)).toBe(true);
    }
  });
});
