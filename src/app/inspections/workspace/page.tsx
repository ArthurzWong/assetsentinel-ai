"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  ImagePlus,
  Info,
  MapPin,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useDemoUploads } from "@/hooks/use-demo-uploads";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  TableWrap,
  Td,
  Th,
  formatDate,
  formatDateTime,
} from "@/components/ui";
import { inspectionStatusLabel, reviewGate, severityColor, statusBadgeClass } from "@/lib/workflow";

function InspectionWorkspacePageInner() {
  const search = useSearchParams();
  const id = search.get("id") ?? "";
  const { state, hydrated } = useStore();
  const { uploads, ingestFiles } = useDemoUploads();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadNote, setUploadNote] = useState("");

  const inspection = useMemo(
    () => state.inspections.find((i) => i.id === id),
    [state.inspections, id]
  );
  const property = useMemo(
    () => (inspection ? state.properties.find((p) => p.id === inspection.propertyId) : undefined),
    [state.properties, inspection]
  );
  const images = useMemo(
    () => state.images.filter((img) => img.inspectionId === id),
    [state.images, id]
  );
  const findings = useMemo(
    () => state.findings.filter((f) => f.inspectionId === id),
    [state.findings, id]
  );
  const gate = reviewGate(findings);

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  if (!inspection) {
    return (
      <EmptyState
        title="Inspection not found"
        hint="Demo data is stored per browser. Reset the demo from the sidebar to restore the seeded dataset."
        action={<Link href="/inspections" className="text-sm font-medium text-teal-700 hover:underline">Back to inspections</Link>}
      />
    );
  }

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const added = ingestFiles(e.target.files);
    e.target.value = "";
    setUploadNote(
      added.length > 0
        ? `Demo mode: ${added.length} image${added.length === 1 ? "" : "s"} held in this browser session only — nothing is uploaded to a server or saved permanently.`
        : "No images were added — demo mode accepts image files only."
    );
  }

  return (
    <div>
      <PageHeader
        title={`${inspection.reference} — ${inspection.title}`}
        subtitle={`${property?.name ?? "Unknown property"} · ${property?.town ?? ""} · ${formatDate(inspection.scheduledDate)} · ${inspection.inspector}`}
        actions={
          <>
            <Badge
              className={
                inspection.status === "published"
                  ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                  : inspection.status === "review"
                    ? "border-amber-200 bg-amber-100 text-amber-800"
                    : "border-navy-200 bg-navy-50 text-navy-700"
              }
            >
              {inspectionStatusLabel(inspection.status)}
            </Badge>
            <Link
              href={`/reports/preview?id=${inspection.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 text-sm font-medium text-navy-800 hover:bg-navy-50"
            >
              Report preview
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Images" value={images.length} hint="Demo gallery" accent="navy" />
        <StatCard label="Findings" value={findings.length} accent="navy" />
        <StatCard label="Pending review" value={gate.pending} hint="Blocks publication" accent="amber" />
        <StatCard label="Report-ready" value={gate.approved} hint="Approved / edited" accent="teal" />
      </div>

      {inspection.summary ? (
        <p className="mt-4 rounded-lg border border-navy-100 bg-white px-4 py-3 text-sm leading-relaxed text-navy-600 shadow-card">
          {inspection.summary}
          {inspection.weather ? <span className="mt-1 block text-xs text-navy-400">Weather: {inspection.weather}</span> : null}
        </p>
      ) : null}

      {/* Review gate banner */}
      <div className={`mt-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${gate.canPublish ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
        {gate.canPublish ? (
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        )}
        <span>
          {gate.canPublish
            ? "All findings reviewed — the report can be published for this inspection."
            : `Publication blocked: ${gate.pending} finding${gate.pending === 1 ? "" : "s"} awaiting human review. Every finding must be approved, edited or rejected first.`}
        </span>
      </div>

      {/* Image gallery + upload */}
      <Card className="mt-6">
        <CardHeader
          title="Image gallery"
          subtitle="Demo scene images; uploaded files stay in this browser session"
          action={
            <>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onFiles}
                aria-label="Upload inspection images (demo, session only)"
              />
              <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden /> Upload images
              </Button>
            </>
          }
        />
        <CardBody>
          {uploadNote ? (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {uploadNote}
            </p>
          ) : null}

          {images.length === 0 ? (
            <EmptyState
              title="No images in this inspection"
              hint="Demo scene images would appear here. Use upload to try the session-only demo flow."
              action={
                <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
                  <ImagePlus className="h-4 w-4" aria-hidden /> Upload images
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((img) => {
                const imgFindings = findings.filter((f) => f.imageId === img.id);
                return (
                  <div key={img.id} className="overflow-hidden rounded-xl border border-navy-100 bg-white shadow-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={`Demo inspection image — ${img.locationLabel}`} className="aspect-[3/2] w-full object-cover" />
                    <div className="space-y-2 px-4 py-3">
                      <p className="text-sm font-medium text-navy-800">{img.locationLabel}</p>
                      <p className="text-xs text-navy-400">{formatDateTime(img.capturedAt)}</p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {imgFindings.length === 0 ? (
                          <Badge className="border-navy-200 bg-navy-50 text-navy-500">No findings yet</Badge>
                        ) : (
                          imgFindings.map((f) => (
                            <Badge key={f.id} className={statusBadgeClass(f.status)}>
                              {f.reference} · <span className={`ml-1 rounded-full px-1.5 ${severityColor(f.severity)}`}>{f.severity}</span>
                            </Badge>
                          ))
                        )}
                      </div>
                      <Link
                        href={`/inspections/finding-new?id=${inspection.id}&image=${img.id}`}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 hover:bg-navy-50"
                      >
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden /> Add finding on this image
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {uploads.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-500">Session uploads (demo, not persisted)</p>
              <div className="flex flex-wrap gap-3">
                {uploads.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u.id} src={u.objectUrl} alt={`Session upload ${u.fileName}`} className="h-20 w-28 rounded-lg border border-navy-200 object-cover" />
                ))}
              </div>
              <p className="mt-2 text-xs text-navy-400">
                These previews disappear when the page unloads — nothing was uploaded to a server.
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {/* Findings list */}
      <Card className="mt-6">
        <CardHeader
          title="Findings"
          subtitle="Each finding goes through human review before it can appear in a report"
          action={
            <Link
              href={`/inspections/finding-new?id=${inspection.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-xs font-medium text-white hover:bg-teal-700"
            >
              New finding
            </Link>
          }
        />
        {findings.length === 0 ? (
          <CardBody>
            <EmptyState
              title="No findings captured yet"
              hint="Open an image above and place annotations to record demo findings."
            />
          </CardBody>
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b border-navy-100">
                <Th>Ref</Th>
                <Th>Finding</Th>
                <Th className="hidden md:table-cell">Defect type</Th>
                <Th>Severity</Th>
                <Th>Status</Th>
                <Th className="hidden lg:table-cell">AI suggestion</Th>
                <Th className="text-right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {[...findings]
                .sort((a, b) => a.reference.localeCompare(b.reference))
                .map((f) => (
                  <tr key={f.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <Td className="font-medium text-navy-900">{f.reference}</Td>
                    <Td className="max-w-[220px] truncate">{f.title}</Td>
                    <Td className="hidden md:table-cell">{f.defectType}</Td>
                    <Td>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityColor(f.severity)}`}>
                        {f.severity}
                      </span>
                    </Td>
                    <Td>
                      <Badge className={statusBadgeClass(f.status)}>
                        {f.status === "pending_review" ? "Pending review" : f.status === "edited" ? "Edited" : f.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    </Td>
                    <Td className="hidden lg:table-cell">
                      {f.isAiSuggestion ? (
                        <Badge className="border-violet-200 bg-violet-100 text-violet-800">Demo suggestion</Badge>
                      ) : (
                        <span className="text-xs text-navy-400">—</span>
                      )}
                    </Td>
                    <Td className="text-right">
                      <Link href={`/inspections/finding-editor?id=${inspection.id}&finding=${f.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                        Editor
                      </Link>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </TableWrap>
        )}
      </Card>

      <p className="mt-4 flex items-center gap-2 text-xs text-navy-400">
        <MapPin className="h-3.5 w-3.5" aria-hidden />
        All images in this demo are synthetic scenes — no real premises were photographed, and no real defect has been identified.
      </p>
    </div>
  );
}

export default function InspectionWorkspacePage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <InspectionWorkspacePageInner />
    </Suspense>
  );
}
