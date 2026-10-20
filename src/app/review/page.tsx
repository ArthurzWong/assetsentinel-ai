"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Pencil, ShieldCheck, X } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  Textarea,
  formatDateTime,
} from "@/components/ui";
import { severityColor, statusBadgeClass } from "@/lib/workflow";

export default function ReviewQueuePage() {
  const { state, hydrated, reviewFinding } = useStore();
  const [inspectionFilter, setInspectionFilter] = useState("all");
  const [comment, setComment] = useState("");

  const pending = useMemo(
    () =>
      state.findings
        .filter((f) => f.status === "pending_review")
        .filter((f) => inspectionFilter === "all" || f.inspectionId === inspectionFilter)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [state.findings, inspectionFilter]
  );

  const recentlyReviewed = useMemo(
    () =>
      state.findings
        .filter((f) => f.status !== "pending_review")
        .sort((a, b) => {
          const la = state.reviews.filter((r) => r.findingId === a.id).map((r) => r.at).sort().pop() ?? a.createdAt;
          const lb = state.reviews.filter((r) => r.findingId === b.id).map((r) => r.at).sort().pop() ?? b.createdAt;
          return lb.localeCompare(la);
        })
        .slice(0, 6),
    [state.findings, state.reviews]
  );

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  function act(findingId: string, action: "approve" | "reject" | "edit") {
    reviewFinding(findingId, action, "Siva R. (demo reviewer)", comment.trim() || `Queue ${action} (demo)`);
    setComment("");
  }

  return (
    <div>
      <PageHeader
        title="Human review"
        subtitle="Nothing becomes report-visible until a person signs off. Demo reviewer: Siva R."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={inspectionFilter} onChange={(e) => setInspectionFilter(e.target.value)} className="sm:w-72" aria-label="Filter by inspection">
          <option value="all">All inspections</option>
          {state.inspections.map((i) => (
            <option key={i.id} value={i.id}>{i.reference} — {i.title}</option>
          ))}
        </Select>
        <p className="text-sm text-navy-500">
          {pending.length} finding{pending.length === 1 ? "" : "s"} waiting
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          title="Review queue is clear"
          hint="Every finding has been reviewed. New pending findings will appear here."
          action={<Link href="/reports" className="text-sm font-medium text-teal-700 hover:underline">Go to reports</Link>}
        />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardBody>
              <label className="mb-1.5 block text-xs font-medium text-navy-700" htmlFor="bulk-comment">
                Comment applied to the next action (optional)
              </label>
              <Textarea
                id="bulk-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Verified against close-up photo — include in report"
              />
            </CardBody>
          </Card>

          {pending.map((f) => {
            const inspection = state.inspections.find((i) => i.id === f.inspectionId);
            const property = inspection ? state.properties.find((p) => p.id === inspection.propertyId) : undefined;
            const image = state.images.find((img) => img.id === f.imageId);
            return (
              <Card key={f.id}>
                <CardBody className="flex flex-col gap-4 sm:flex-row">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.src}
                      alt={`Evidence photo for ${f.reference}`}
                      className="h-28 w-full shrink-0 rounded-lg border border-navy-100 object-cover sm:w-44"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-navy-900">{f.reference}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityColor(f.severity)}`}>{f.severity}</span>
                      {f.isAiSuggestion ? <Badge className="border-violet-200 bg-violet-100 text-violet-800">Demo AI suggestion</Badge> : null}
                      <Badge className={statusBadgeClass(f.status)}>Pending review</Badge>
                    </div>
                    <p className="mt-1 font-medium text-navy-800">{f.title}</p>
                    <p className="mt-0.5 text-xs text-navy-400">
                      {inspection?.reference} · {property?.name ?? "Unknown property"} · {image?.locationLabel ?? "unknown location"} · captured {formatDateTime(f.createdAt)}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-navy-600">{f.notes}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button size="sm" onClick={() => act(f.id, "approve")}><Check className="h-3.5 w-3.5" aria-hidden /> Approve</Button>
                      <Button size="sm" variant="navy" onClick={() => act(f.id, "edit")}><Pencil className="h-3.5 w-3.5" aria-hidden /> Mark edited</Button>
                      <Button size="sm" variant="destructive" onClick={() => act(f.id, "reject")}><X className="h-3.5 w-3.5" aria-hidden /> Reject</Button>
                      <Link
                        href={`/inspections/finding-editor?id=${f.inspectionId}&finding=${f.id}`}
                        className="text-xs font-medium text-teal-700 hover:underline"
                      >
                        Open editor →
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="mt-8">
        <CardHeader
          title="Recently reviewed"
          subtitle="Latest demo review outcomes"
          action={<ShieldCheck className="h-4 w-4 text-teal-600" aria-hidden />}
        />
        <CardBody className="space-y-3">
          {recentlyReviewed.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-navy-700">
                <span className="font-medium text-navy-900">{f.reference}</span> — {f.title}
              </span>
              <Badge className={`shrink-0 ${statusBadgeClass(f.status)}`}>
                {f.status === "edited" ? "Edited" : f.status === "approved" ? "Approved" : "Rejected"}
              </Badge>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
