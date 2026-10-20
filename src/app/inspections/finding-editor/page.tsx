"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, Pencil, ShieldCheck, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { AnnotationCanvasClient } from "@/components/annotation-canvas-client";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DemoPill,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
  formatDateTime,
} from "@/components/ui";
import { reviewHistory, severityColor, statusBadgeClass } from "@/lib/workflow";
import type { Annotation, Severity } from "@/lib/types";

function FindingEditorPageInner() {
  const search = useSearchParams();
  const inspectionId = search.get("id") ?? "";
  const findingId = search.get("finding") ?? "";
  const justCreated = search.get("created") === "1";
  const { state, hydrated, updateFinding, reviewFinding } = useStore();

  const inspection = state.inspections.find((i) => i.id === inspectionId);
  const finding = state.findings.find((f) => f.id === findingId);

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(finding?.title ?? "");
  const [defectType, setDefectType] = useState(finding?.defectType ?? "Corrosion");
  const [severity, setSeverity] = useState<Severity>(finding?.severity ?? "medium");
  const [notes, setNotes] = useState(finding?.notes ?? "");
  const [recommendations, setRecommendations] = useState(finding?.recommendations ?? "");
  const [annotations, setAnnotations] = useState<Annotation[]>(finding?.annotations ?? []);
  const [armed, setArmed] = useState(false);
  const [reviewComment, setReviewComment] = useState("");

  const image = useMemo(
    () => (finding ? state.images.find((img) => img.id === finding.imageId) : undefined),
    [state.images, finding]
  );
  const history = useMemo(
    () => (finding ? reviewHistory(state.reviews, finding.id) : []),
    [state.reviews, finding]
  );

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  if (!inspection || !finding) {
    return (
      <EmptyState
        title="Finding not found"
        hint="Demo data is per-browser; reset the demo from the sidebar to restore seed data."
        action={<Link href={inspection ? `/inspections/workspace?id=${inspection.id}` : "/inspections"} className="text-sm font-medium text-teal-700 hover:underline">Back</Link>}
      />
    );
  }

  function startEdit() {
    if (!finding) return;
    setTitle(finding.title);
    setDefectType(finding.defectType);
    setSeverity(finding.severity);
    setNotes(finding.notes);
    setRecommendations(finding.recommendations);
    setAnnotations(finding.annotations);
    setEditMode(true);
  }

  function saveEdits() {
    if (!finding) return;
    updateFinding(finding.id, { title, defectType, severity, notes, recommendations, annotations });
    setEditMode(false);
  }

  function act(action: "approve" | "reject" | "edit") {
    if (!finding) return;
    reviewFinding(finding.id, action, "Siva R. (demo reviewer)", reviewComment.trim() || `Finding ${action}d from the editor (demo).`);
    setReviewComment("");
  }

  return (
    <div>
      <PageHeader
        title={`${finding.reference} — ${finding.title}`}
        subtitle={`${inspection.reference} · ${inspection.title}`}
        actions={
          <>
            <DemoPill />
            <Badge className={statusBadgeClass(finding.status)}>
              {finding.status === "pending_review" ? "Pending review" : finding.status === "edited" ? "Edited" : finding.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
            {finding.isAiSuggestion ? <Badge className="border-violet-200 bg-violet-100 text-violet-800">Demo AI suggestion</Badge> : null}
          </>
        }
      />

      {justCreated ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Finding created (demo). It now sits in the review queue — it cannot appear in a report until a human reviewer approves it.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card>
            <CardHeader
              title="Annotated photo"
              subtitle={image ? image.locationLabel : "Image missing"}
              action={
                editMode ? (
                  <Button size="sm" variant={armed ? "default" : "outline"} onClick={() => setArmed((v) => !v)}>
                    {armed ? "Placing: on" : "Placing: off"}
                  </Button>
                ) : undefined
              }
            />
            <CardBody>
              {image ? (
                <AnnotationCanvasClient
                  src={image.src}
                  annotations={editMode ? annotations : finding.annotations}
                  armed={editMode && armed}
                  onAdd={(x: number, y: number) =>
                    setAnnotations((prev) => [
                      ...prev,
                      { id: `a_${Math.random().toString(36).slice(2, 8)}`, x, y, label: `Point ${prev.length + 1}`, severity },
                    ])
                  }
                />
              ) : (
                <p className="text-sm text-navy-400">The referenced demo image is no longer available.</p>
              )}
              {editMode && annotations.length > 0 ? (
                <div className="mt-3">
                  <Button size="sm" variant="dangerOutline" onClick={() => setAnnotations((prev) => prev.slice(0, -1))}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Undo last point
                  </Button>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {/* Details / edit */}
          <Card>
            <CardHeader
              title="Finding details"
              subtitle="Defect classification and observation notes"
              action={
                !editMode ? (
                  <Button size="sm" variant="outline" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
                  </Button>
                ) : undefined
              }
            />
            <CardBody className="space-y-4">
              {editMode ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title">
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>
                    <Field label="Defect type">
                      <Select value={defectType} onChange={(e) => setDefectType(e.target.value)}>
                        {["Corrosion", "Open seam", "Choked gutter", "Ponding", "Flashing defect", "Coating failure", "Loose fasteners", "Cladding damage", "Downpipe damage", "Vegetation growth", "Seam wear", "Staining", "Other"].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Severity">
                      <Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Notes">
                    <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </Field>
                  <Field label="Recommendation">
                    <Textarea rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
                  </Field>
                  <div className="flex gap-3">
                    <Button onClick={saveEdits}><Check className="h-4 w-4" aria-hidden /> Save changes</Button>
                    <Button variant="ghost" onClick={() => setEditMode(false)}><X className="h-4 w-4" aria-hidden /> Cancel</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Defect type</p>
                      <p className="mt-1 text-sm text-navy-800">{finding.defectType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Severity</p>
                      <p className="mt-1">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityColor(finding.severity)}`}>
                          {finding.severity}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Notes</p>
                    <p className="mt-1 text-sm leading-relaxed text-navy-700">{finding.notes || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-navy-400">Recommendation</p>
                    <p className="mt-1 text-sm leading-relaxed text-navy-700">{finding.recommendations || "—"}</p>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Review panel */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Human review" subtitle="Required before any report publication" />
            <CardBody className="space-y-4">
              <Field label="Review comment">
                <Textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Why this finding is approved, edited or rejected (recorded in history)"
                />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="default" onClick={() => act("approve")}>
                  <Check className="h-4 w-4" aria-hidden /> Approve
                </Button>
                <Button variant="navy" onClick={() => act("edit")}>
                  <Pencil className="h-4 w-4" aria-hidden /> Edit
                </Button>
                <Button variant="destructive" onClick={() => act("reject")}>
                  <X className="h-4 w-4" aria-hidden /> Reject
                </Button>
              </div>
              <p className="text-xs text-navy-400">
                “Edit” records that the reviewer adjusted the finding and keeps it report-ready. Approvals and edits are
                recorded as reviewer actions by <strong>Siva R. (demo reviewer)</strong> — no real reviewer account exists in Phase 1.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Review history" subtitle="Newest first" />
            <CardBody>
              {history.length === 0 ? (
                <p className="text-sm text-navy-400">No review actions recorded yet for this finding.</p>
              ) : (
                <ol className="space-y-4">
                  {history.map((r) => (
                    <li key={r.id} className="border-l-2 border-teal-200 pl-3">
                      <p className="text-sm">
                        <Badge className={statusBadgeClass(r.action)}>{r.action}</Badge>{" "}
                        <span className="text-navy-600">by {r.reviewer}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400">{formatDateTime(r.at)}</p>
                      {r.comment ? <p className="mt-1 text-xs leading-relaxed text-navy-600">{r.comment}</p> : null}
                    </li>
                  ))}
                </ol>
              )}
            </CardBody>
          </Card>

          <Link href={`/inspections/workspace?id=${inspection.id}`} className="flex items-center gap-2 text-sm font-medium text-teal-700 hover:underline">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to inspection workspace
          </Link>
          <p className="flex items-start gap-2 text-xs text-navy-400">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            This demo does not verify defect identities. Everything shown is fictional training-style content.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FindingEditorPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <FindingEditorPageInner />
    </Suspense>
  );
}
