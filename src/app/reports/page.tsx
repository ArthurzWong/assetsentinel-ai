"use client";

import Link from "next/link";
import { FileBarChart, Lock } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  TableWrap,
  Td,
  Th,
  formatDate,
} from "@/components/ui";
import { reviewGate } from "@/lib/workflow";

export default function ReportsIndexPage() {
  const { state, hydrated } = useStore();
  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  const inspections = [...state.inspections].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Professional PDF reports built only from approved findings — publication stays blocked while review is pending."
      />
      <Card>
        <CardHeader title="Inspection reports" subtitle="Demo dataset" />
        {inspections.length === 0 ? (
          <CardBody>
            <EmptyState title="No inspections yet" hint="Create an inspection first — reports are generated per inspection." />
          </CardBody>
        ) : (
          <TableWrap>
            <thead>
              <tr className="border-b border-navy-100">
                <Th>Reference</Th>
                <Th>Property</Th>
                <Th className="hidden md:table-cell">Date</Th>
                <Th>Review gate</Th>
                <Th>Status</Th>
                <Th className="text-right">Open</Th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => {
                const prop = state.properties.find((p) => p.id === i.propertyId);
                const findings = state.findings.filter((f) => f.inspectionId === i.id);
                const gate = reviewGate(findings);
                return (
                  <tr key={i.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <Td>
                      <Link href={`/inspections/workspace?id=${i.id}`} className="font-medium text-teal-700 hover:underline">{i.reference}</Link>
                    </Td>
                    <Td className="max-w-[200px] truncate">{prop?.name ?? "—"}</Td>
                    <Td className="hidden md:table-cell">{formatDate(i.scheduledDate)}</Td>
                    <Td>
                      {gate.canPublish ? (
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-800">{gate.approved} report-ready</Badge>
                      ) : (
                        <Badge className="border-amber-200 bg-amber-100 text-amber-800">
                          <Lock className="mr-1 h-3 w-3" aria-hidden /> {gate.pending} pending
                        </Badge>
                      )}
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
                        {i.status === "published" ? "Published" : i.status === "review" ? "In review" : i.status === "draft" ? "Draft" : "In progress"}
                      </Badge>
                    </Td>
                    <Td className="text-right">
                      <Link href={`/reports/preview?id=${i.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:underline">
                        <FileBarChart className="h-4 w-4" aria-hidden /> Preview
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Card>
    </div>
  );
}
