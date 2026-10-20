"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Bot, MousePointerClick, Trash2 } from "lucide-react";
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
} from "@/components/ui";
import type { Annotation, Severity } from "@/lib/types";

function NewFindingPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const { state, hydrated, addFinding } = useStore();

  const id = search.get("id") ?? "";
  const preselect = search.get("image") ?? "";

  const inspection = state.inspections.find((i) => i.id === id);
  const images = state.images.filter((img) => img.inspectionId === id);
  const [imageId, setImageId] = useState<string>(preselect);
  const [defectType, setDefectType] = useState("Corrosion");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [armed, setArmed] = useState(true);
  const [error, setError] = useState("");

  const image = useMemo(() => images.find((i) => i.id === imageId), [images, imageId]);

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  if (!inspection) {
    return (
      <EmptyState
        title="Inspection not found"
        hint="Demo data is per-browser; reset the demo from the sidebar to restore seed data."
        action={<Link href="/inspections" className="text-sm font-medium text-teal-700 hover:underline">Back to inspections</Link>}
      />
    );
  }

  function addAnnotation(x: number, y: number) {
    setAnnotations((prev) => [
      ...prev,
      { id: `a_${Math.random().toString(36).slice(2, 8)}`, x, y, label: `Point ${prev.length + 1}`, severity },
    ]);
  }

  function submit() {
    if (!inspection) {
      setError("Inspection not found — reset the demo from the sidebar.");
      return;
    }
    if (!imageId) {
      setError("Choose the image this finding refers to.");
      return;
    }
    if (!title.trim()) {
      setError("Give the finding a short title.");
      return;
    }
    const created = addFinding({
      inspectionId: inspection.id,
      imageId,
      defectType: defectType.trim() || "Unclassified",
      severity,
      title: title.trim(),
      notes: notes.trim(),
      recommendations: recommendations.trim(),
      annotations,
      isAiSuggestion: false,
    });
    router.push(`/inspections/finding-editor?id=${inspection.id}&finding=${created.id}&created=1`);
  }

  return (
    <div>
      <PageHeader
        title="New finding"
        subtitle={`${inspection.reference} — click on the photo to place annotation points (stored as % coordinates).`}
        actions={<DemoPill />}
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Annotation canvas */}
        <Card className="lg:col-span-3">
          <CardHeader
            title="Photo annotation"
            subtitle="Synthetic demo image — no real premises"
            action={
              <Button size="sm" variant={armed ? "default" : "outline"} onClick={() => setArmed((v) => !v)}>
                <MousePointerClick className="h-4 w-4" aria-hidden />
                {armed ? "Placing: on" : "Placing: off"}
              </Button>
            }
          />
          <CardBody>
            {image ? (
              <>
                <AnnotationCanvasClient
                  src={image.src}
                  annotations={annotations}
                  armed={armed}
                  onAdd={addAnnotation}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-navy-400">
                    {annotations.length} annotation point{annotations.length === 1 ? "" : "s"} — marker colour follows the selected severity.
                  </p>
                  {annotations.length > 0 ? (
                    <Button size="sm" variant="dangerOutline" onClick={() => setAnnotations((prev) => prev.slice(0, -1))}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Undo last
                    </Button>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyState
                title="No image selected"
                hint="This inspection has no demo images yet — add images from the inspection workspace first."
                action={
                  <Link href={`/inspections/workspace?id=${inspection.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                    Back to workspace
                  </Link>
                }
              />
            )}
          </CardBody>
        </Card>

        {/* Finding details */}
        <Card className="lg:col-span-2">
          <CardHeader title="Finding details" subtitle="Everything here is demo content" />
          <CardBody className="space-y-4">
            <Field label="Photo *">
              <Select value={imageId} onChange={(e) => setImageId(e.target.value)}>
                <option value="">Select an image…</option>
                {images.map((img) => (
                  <option key={img.id} value={img.id}>{img.locationLabel}</option>
                ))}
              </Select>
            </Field>
            <Field label="Defect type">
              <Select value={defectType} onChange={(e) => setDefectType(e.target.value)}>
                {["Corrosion", "Open seam", "Choked gutter", "Ponding", "Flashing defect", "Coating failure", "Loose fasteners", "Cladding damage", "Downpipe damage", "Vegetation growth", "Seam wear", "Staining", "Other"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Severity">
              <Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </Field>
            <Field label="Title *">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short description, e.g. Rust bleeding along sheet laps" />
            </Field>
            <Field label="Notes">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was observed (demo observation only)" />
            </Field>
            <Field label="Recommendation">
              <Textarea rows={2} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} placeholder="Suggested action for the client" />
            </Field>
            <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs text-violet-900">
              <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                In Phase 1 there is no AI: findings created here are manual demo entries. Any future model-assisted
                suggestion will stay labelled as a suggestion until a human reviewer approves it.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={submit} disabled={!image}>Create finding</Button>
              <Link href={`/inspections/workspace?id=${inspection.id}`}>
                <Button variant="ghost" type="button"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to workspace</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default function NewFindingPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <NewFindingPageInner />
    </Suspense>
  );
}
