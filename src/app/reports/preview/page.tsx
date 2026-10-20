"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AlertTriangle, Download, Lock, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DemoPill,
  EmptyState,
  PageHeader,
  formatDateTime,
} from "@/components/ui";
import { isPublishable, reviewGate, severityColor } from "@/lib/workflow";
import { SEVERITY_FILL } from "@/lib/severity";
import type { Annotation, ImageAsset } from "@/lib/types";

/** Draw an image plus its annotation markers onto a canvas → JPEG data URL for the PDF. */
async function composeEvidence(
  src: string,
  annotations: Annotation[]
): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.crossOrigin = "anonymous";
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const canvas = document.createElement("canvas");
    const W = 1200;
    const H = Math.round((img.naturalHeight / img.naturalWidth) * W);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    for (let i = 0; i < annotations.length; i++) {
      const a = annotations[i];
      const cx = (a.x / 100) * W;
      const cy = (a.y / 100) * H;
      ctx.beginPath();
      ctx.arc(cx, cy, 16, 0, Math.PI * 2);
      ctx.fillStyle = SEVERITY_FILL[a.severity] ?? "#334155";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), cx, cy + 1);
    }
    return { dataUrl: canvas.toDataURL("image/jpeg", 0.85), w: W, h: H };
  } catch {
    return null;
  }
}

function ReportPreviewPageInner() {
  const search = useSearchParams();
  const id = search.get("id") ?? "";
  const { state, hydrated, updateInspectionStatus } = useStore();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const inspection = useMemo(() => state.inspections.find((i) => i.id === id), [state.inspections, id]);
  const property = useMemo(
    () => (inspection ? state.properties.find((p) => p.id === inspection.propertyId) : undefined),
    [state.properties, inspection]
  );
  const findings = useMemo(
    () => state.findings.filter((f) => f.inspectionId === id).sort((a, b) => a.reference.localeCompare(b.reference)),
    [state.findings, id]
  );
  const gate = reviewGate(findings);
  const approved = useMemo(() => findings.filter((f) => isPublishable(f)), [findings]);
  const imagesById = useMemo(() => {
    const m = new Map<string, ImageAsset>();
    for (const img of state.images) m.set(img.id, img);
    return m;
  }, [state.images]);

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  if (!inspection) {
    return (
      <EmptyState
        title="Inspection not found"
        hint="Demo data is per-browser; reset the demo from the sidebar to restore seed data."
        action={<Link href="/reports" className="text-sm font-medium text-teal-700 hover:underline">Back to reports</Link>}
      />
    );
  }

  const reportRef = `RPT-${new Date(inspection.scheduledDate).getFullYear()}-${inspection.reference.replace(/\D/g, "").slice(-3)}`;
  const company = state.company;
  const canPublish = gate.canPublish && approved.length > 0;

  async function exportPdf() {
    if (!inspection) return;
    setExporting(true);
    setExportError("");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const PW = doc.internal.pageSize.getWidth();
      const PH = doc.internal.pageSize.getHeight();
      const M = 48;
      const CW = PW - M * 2;
      let y = M;

      const ensure = (h: number) => {
        if (y + h > PH - M - 40) {
          doc.addPage();
          y = M;
        }
      };
      const text = (
        s: string,
        size: number,
        style: "normal" | "bold",
        color: [number, number, number],
        x = M,
        yy?: number
      ) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(s, x, yy ?? y);
      };
      const wrap = (s: string, size: number, width: number): string[] => doc.splitTextToSize(s, width);

      // Header band
      doc.setFillColor(19, 30, 48);
      doc.rect(0, 0, PW, 86, "F");
      doc.setFillColor(20, 184, 166);
      doc.rect(0, 86, PW, 4, "F");
      text(company.name, 16, "bold", [255, 255, 255], M, 40);
      text(company.tagline, 9, "normal", [153, 246, 228], M, 58);
      text("DEMO REPORT — SYNTHETIC DATA ONLY", 9, "bold", [251, 191, 36], M, 72);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(reportRef, PW - M, 40, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Issued ${new Date().toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}`, PW - M, 58, { align: "right" });

      y = 116;
      text(inspection.title, 15, "bold", [19, 30, 48]);
      y += 20;

      // Property block
      const propLines = [
        `Property: ${property?.name ?? "—"} (DEMO)`,
        `Location: ${property?.address ? property.address + ", " : ""}${property?.town ?? ""}, ${property?.state ?? ""}`,
        `Type: ${property?.type ?? "—"} · Roof area: ${(property?.roofAreaSqm ?? 0).toLocaleString()} m² · Built: ${property?.yearBuilt ?? "—"}`,
        `Inspection: ${inspection.reference} · ${new Date(inspection.scheduledDate).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })} · Inspector: ${inspection.inspector}`,
        `Weather: ${inspection.weather || "not recorded"}`,
      ];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      for (const line of propLines) {
        doc.text(line, M, y);
        y += 14;
      }
      y += 6;

      if (inspection.summary) {
        const lines = wrap(inspection.summary, 9.5, CW);
        for (const line of lines) {
          ensure(14);
          doc.text(line, M, y);
          y += 13;
        }
        y += 8;
      }

      // Scope note
      ensure(46);
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(M, y, CW, 40, 4, 4, "F");
      text(
        `Scope of this report: ${approved.length} human-approved finding${approved.length === 1 ? "" : "s"} (approved or edited by the reviewer). Rejected findings are excluded. Any AI-assisted items were labelled as demo suggestions and separately reviewed.`,
        8.5,
        "normal",
        [15, 118, 110],
        M + 10,
        y + 16
      );
      y += 56;

      // Findings
      text("Approved findings", 12, "bold", [19, 30, 48]);
      y += 18;

      if (approved.length === 0) {
        ensure(30);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9.5);
        doc.setTextColor(100, 116, 139);
        doc.text("No approved findings yet — the review gate blocks publication.", M, y);
        y += 24;
      }

      for (const f of approved) {
        const notesLines = wrap(f.notes || "—", 9, CW - 16);
        const recLines = wrap(f.recommendations || "—", 9, CW - 16);
        const blockH = 44 + (notesLines.length + recLines.length) * 12 + 18;
        ensure(blockH);

        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(M, y, CW, blockH - 8, 4, 4, "S");
        let fy = y + 16;
        text(`${f.reference} — ${f.title}`, 10.5, "bold", [19, 30, 48], M + 10, fy);
        fy += 14;
        text(`${f.defectType} · Severity: ${f.severity.toUpperCase()} · Photo: ${imagesById.get(f.imageId)?.locationLabel ?? "—"}`, 8.5, "normal", [100, 116, 139], M + 10, fy);
        fy += 15;
        text("Observation: ", 8.5, "bold", [51, 65, 85], M + 10, fy);
        const obsX = M + 10 + doc.getTextWidth("Observation: ");
        doc.setFont("helvetica", "normal");
        notesLines.forEach((line, idx) => {
          doc.text(line, idx === 0 ? obsX : M + 10, fy + idx * 12);
        });
        fy += notesLines.length * 12 + 4;
        text("Recommendation: ", 8.5, "bold", [51, 65, 85], M + 10, fy);
        const recX = M + 10 + doc.getTextWidth("Recommendation: ");
        doc.setFont("helvetica", "normal");
        recLines.forEach((line, idx) => {
          doc.text(line, idx === 0 ? recX : M + 10, fy + idx * 12);
        });
        fy += recLines.length * 12 + 6;
        y = fy + 8;
      }

      // Evidence photos with annotations baked in
      const seen = new Set<string>();
      const uniqueEvidence = approved.filter((f) => {
        const img = imagesById.get(f.imageId);
        if (!img || seen.has(img.id)) return false;
        seen.add(img.id);
        return true;
      });

      if (uniqueEvidence.length > 0) {
        doc.addPage();
        y = M;
        text("Evidence photos (annotated)", 12, "bold", [19, 30, 48]);
        y += 16;
        for (const f of uniqueEvidence) {
          const img = imagesById.get(f.imageId)!;
          const composed = await composeEvidence(img.src, f.annotations);
          if (!composed) continue;
          const maxW = CW;
          const maxH = 300;
          let w = maxW;
          let h = (composed.h / composed.w) * w;
          if (h > maxH) {
            h = maxH;
            w = (composed.w / composed.h) * h;
          }
          ensure(h + 40);
          doc.addImage(composed.dataUrl, "JPEG", M, y, w, h);
          y += h + 8;
          const refs = approved
            .filter((ff) => ff.imageId === img.id)
            .map((ff) => ff.reference)
            .join(", ");
          text(`Photo: ${img.locationLabel} — findings ${refs}. Synthetic demo image.`, 8, "normal", [100, 116, 139], M, y);
          y += 26;
        }
      }

      // Review sign-off
      ensure(120);
      y += 8;
      text("Review record", 12, "bold", [19, 30, 48]);
      y += 16;
      const reviewActions = state.reviews.filter((r) => approved.some((f) => f.id === r.findingId));
      const reviewers = Array.from(new Set(reviewActions.map((r) => r.reviewer)));
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text(`Findings approved: ${approved.length} · Review actions recorded: ${reviewActions.length}`, M, y);
      y += 14;
      doc.text(`Reviewer(s) of record (demo): ${reviewers.join(", ") || "—"}`, M, y);
      y += 14;
      doc.text(`Report status: ${inspection.status === "published" ? "PUBLISHED (demo)" : "PREVIEW — not yet published"}`, M, y);
      y += 22;

      // Footer disclaimer
      ensure(56);
      doc.setFillColor(254, 249, 231);
      doc.roundedRect(M, y, CW, 44, 4, 4, "F");
      const footLines = wrap(company.reportFooter, 8.5, CW - 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(146, 64, 14);
      footLines.forEach((line, idx) => doc.text(line, M + 10, y + 16 + idx * 12));

      // Footer on every page
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`${company.name} · ${reportRef} · DEMO — synthetic data, not a structural certification`, M, PH - 24);
        doc.text(`Page ${p} of ${pages}`, PW - M, PH - 24, { align: "right" });
      }

      doc.save(`${reportRef}-assetsentinel-demo.pdf`);
    } catch {
      setExportError("PDF export failed in this browser. The on-screen preview above remains available.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`${reportRef} — report preview`}
        subtitle={`${inspection.reference} · ${property?.name ?? "Unknown property"} (DEMO)`}
        actions={
          <>
            <DemoPill />
            <Button onClick={exportPdf} disabled={exporting || approved.length === 0}>
              <Download className="h-4 w-4" aria-hidden /> {exporting ? "Generating…" : "Export PDF"}
            </Button>
            {inspection.status !== "published" ? (
              <Button
                variant="navy"
                disabled={!canPublish}
                onClick={() => updateInspectionStatus(inspection.id, "published")}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden /> Publish report
              </Button>
            ) : (
              <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">Published</Badge>
            )}
          </>
        }
      />

      {!canPublish && inspection.status !== "published" ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {gate.canPublish ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
          <span>
            {gate.canPublish
              ? "Every finding has been reviewed, but there are no approved findings to publish yet. Approve at least one finding to unlock publication."
              : `Publication blocked: ${gate.pending} finding${gate.pending === 1 ? "" : "s"} still pending human review.`}{" "}
            <Link href={gate.canPublish ? "/review" : `/inspections/workspace?id=${inspection.id}`} className="font-medium underline">
              {gate.canPublish ? "Open review queue" : "Open workspace"}
            </Link>
          </span>
        </div>
      ) : null}

      {exportError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{exportError}</p>
      ) : null}

      {/* On-screen report preview */}
      <Card className="overflow-hidden">
        <div className="border-b-4 border-teal-500 bg-navy-950 px-6 py-6 text-white sm:px-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div>
              <p className="text-lg font-bold">{company.name}</p>
              <p className="text-xs text-teal-300">{company.tagline}</p>
              <p className="mt-1 inline-block rounded bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-300">
                DEMO REPORT — SYNTHETIC DATA ONLY
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{reportRef}</p>
              <p className="text-xs text-navy-300">Issued {new Date().toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}</p>
            </div>
          </div>
        </div>

        <CardBody className="space-y-6">
          <div>
            <h2 className="text-base font-bold text-navy-900">{inspection.title}</h2>
            <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Property</dt><dd className="text-navy-800">{property?.name ?? "—"} (DEMO)</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Location</dt><dd className="text-navy-800">{property?.town}, {property?.state}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Type</dt><dd className="text-navy-800 capitalize">{property?.type} · {property?.roofAreaSqm?.toLocaleString()} m² roof</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Inspection</dt><dd className="text-navy-800">{inspection.reference} · {inspection.inspector}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Date</dt><dd className="text-navy-800">{new Date(inspection.scheduledDate).toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
              <div className="flex gap-2"><dt className="w-24 shrink-0 text-navy-400">Weather</dt><dd className="text-navy-800">{inspection.weather || "—"}</dd></div>
            </dl>
            {inspection.summary ? <p className="mt-3 text-sm leading-relaxed text-navy-600">{inspection.summary}</p> : null}
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-xs text-teal-900">
            Scope: {approved.length} human-approved finding{approved.length === 1 ? "" : "s"} — approved or edited by the reviewer. Rejected findings are excluded. AI-assisted items stay labelled as demo suggestions until a human reviewer signs off.
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-500">Approved findings</h3>
            {approved.length === 0 ? (
              <EmptyState
                title="No approved findings"
                hint="Approve or edit findings in the review queue — the report updates automatically."
                action={<Link href="/review" className="text-sm font-medium text-teal-700 hover:underline">Open review queue</Link>}
              />
            ) : (
              <div className="space-y-3">
                {approved.map((f) => {
                  const img = imagesById.get(f.imageId);
                  return (
                    <div key={f.id} className="rounded-lg border border-navy-100 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-navy-900">{f.reference} — {f.title}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityColor(f.severity)}`}>{f.severity}</span>
                        <Badge className="border-navy-200 bg-navy-50 text-navy-600">{f.defectType}</Badge>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-navy-700"><span className="font-medium">Observation:</span> {f.notes || "—"}</p>
                      <p className="mt-1 text-sm leading-relaxed text-navy-700"><span className="font-medium">Recommendation:</span> {f.recommendations || "—"}</p>
                      <p className="mt-1.5 text-xs text-navy-400">Evidence: {img?.locationLabel ?? "—"}{f.annotations.length > 0 ? ` · ${f.annotations.length} annotation point${f.annotations.length === 1 ? "" : "s"}` : ""}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {approved.length > 0 ? (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-navy-500">Evidence photos</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from(new Set(approved.map((f) => f.imageId))).map((imageId) => {
                  const img = imagesById.get(imageId);
                  if (!img) return null;
                  const anns = approved.filter((f) => f.imageId === imageId).flatMap((f) => f.annotations);
                  return (
                    <figure key={imageId} className="overflow-hidden rounded-xl border border-navy-100">
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.src} alt={`Evidence — ${img.locationLabel}`} className="aspect-[3/2] w-full object-cover" />
                        {anns.map((a) => (
                          <span
                            key={a.id}
                            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow"
                            style={{ left: `${a.x}%`, top: `${a.y}%`, backgroundColor: SEVERITY_FILL[a.severity] ?? "#334155" }}
                          >
                            {anns.indexOf(a) + 1}
                          </span>
                        ))}
                      </div>
                      <figcaption className="px-3 py-2 text-xs text-navy-500">
                        {img.locationLabel} — findings {approved.filter((f) => f.imageId === imageId).map((f) => f.reference).join(", ")} · synthetic demo image
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="border-t border-navy-100 pt-4">
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-navy-500">Review record</h3>
            <p className="text-sm text-navy-700">
              Findings approved: <strong>{approved.length}</strong> · Review actions recorded: <strong>{state.reviews.filter((r) => approved.some((f) => f.id === r.findingId)).length}</strong> · Reviewer of record: <strong>Siva R. (demo reviewer)</strong>
            </p>
            <p className="mt-1 text-xs text-navy-400">Last gate check: {formatDateTime(new Date().toISOString())} (demo)</p>
          </div>

          <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            {company.reportFooter}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ReportPreviewPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <ReportPreviewPageInner />
    </Suspense>
  );
}
