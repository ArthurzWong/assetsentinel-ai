"use client";

import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  TableWrap,
  Td,
  Th,
  formatDate,
} from "@/components/ui";
import { inspectionStatusLabel } from "@/lib/workflow";

export default function InspectionsPage() {
  const { state, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  const inspections = [...state.inspections].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Inspections"
        subtitle="Roof & exterior surveys across the demo portfolio."
        actions={
          <Link href="/inspections/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden /> New inspection
            </Button>
          </Link>
        }
      />

      {inspections.length === 0 ? (
        <EmptyState
          title="No inspections yet"
          hint="Create the first demo inspection to capture images and findings."
          action={
            <Link href="/inspections/new">
              <Button variant="outline" size="sm">New inspection</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <TableWrap>
            <thead>
              <tr className="border-b border-navy-100">
                <Th>Reference</Th>
                <Th>Property</Th>
                <Th className="hidden md:table-cell">Date</Th>
                <Th className="hidden md:table-cell">Inspector</Th>
                <Th>Findings</Th>
                <Th>Status</Th>
                <Th className="text-right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => {
                const prop = state.properties.find((p) => p.id === i.propertyId);
                const fs = state.findings.filter((f) => f.inspectionId === i.id);
                const pending = fs.filter((f) => f.status === "pending_review").length;
                return (
                  <tr key={i.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <Td>
                      <Link href={`/inspections/workspace?id=${i.id}`} className="font-medium text-teal-700 hover:underline">
                        {i.reference}
                      </Link>
                      <p className="max-w-[200px] truncate text-xs text-navy-400">{i.title}</p>
                    </Td>
                    <Td className="max-w-[180px] truncate">{prop?.name ?? "—"}</Td>
                    <Td className="hidden md:table-cell">{formatDate(i.scheduledDate)}</Td>
                    <Td className="hidden md:table-cell">{i.inspector}</Td>
                    <Td>
                      {fs.length}
                      {pending > 0 ? (
                        <Badge className="ml-2 border-amber-200 bg-amber-100 text-amber-800">{pending} pending</Badge>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge
                        className={
                          i.status === "published"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                            : i.status === "review"
                              ? "border-amber-200 bg-amber-100 text-amber-800"
                              : "border-navy-200 bg-navy-50 text-navy-700"
                        }
                      >
                        {inspectionStatusLabel(i.status)}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link href={`/inspections/workspace?id=${i.id}`} className="text-sm font-medium text-teal-700 hover:underline">
                        Workspace
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Card>
      )}

      <div className="mt-6 flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 text-xs text-navy-500 shadow-card">
        <ClipboardList className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
        Workflow: Property → Inspection → Images → Findings → Human review → Approved report → PDF. Reports stay blocked while any finding is unreviewed.
      </div>
    </div>
  );
}
