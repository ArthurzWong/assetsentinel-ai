"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Building2, CalendarDays, ClipboardList, MapPin, Pencil, Ruler } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
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
} from "@/components/ui";
import { inspectionStatusLabel } from "@/lib/workflow";

function PropertyDetailPageInner() {
  const search = useSearchParams();
  const id = search.get("id") ?? "";
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  const property = state.properties.find((p) => p.id === id);
  if (!property) {
    return (
      <EmptyState
        title="Property not found"
        hint="It may have been created in another browser — demo data is stored locally. Reset the demo to restore the seeded dataset."
        action={<Link href="/properties" className="text-sm font-medium text-teal-700 hover:underline">Back to properties</Link>}
      />
    );
  }

  const inspections = state.inspections
    .filter((i) => i.propertyId === property.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <PageHeader
        title={property.name}
        subtitle={`${property.address ? property.address + ", " : ""}${property.town}, ${property.state} — DEMO property`}
        actions={
          <>
            <Badge className="border-amber-300 bg-amber-100 text-amber-800">DEMO</Badge>
            <Link
              href={`/properties/edit?id=${property.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 text-sm font-medium text-navy-800 hover:bg-navy-50"
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit
            </Link>
            <Link
              href="/inspections/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              <ClipboardList className="h-4 w-4" aria-hidden /> New inspection
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roof area" value={`${property.roofAreaSqm.toLocaleString()} m²`} accent="navy" />
        <StatCard label="Year built" value={property.yearBuilt} accent="navy" />
        <StatCard label="Inspections" value={inspections.length} accent="teal" />
        <StatCard
          label="Findings recorded"
          value={inspections.reduce((acc, i) => acc + state.findings.filter((f) => f.inspectionId === i.id).length, 0)}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Inspection history" subtitle="Every demo survey recorded for this property" />
          {inspections.length === 0 ? (
            <CardBody>
              <EmptyState
                title="No inspections yet"
                hint="Start the first survey for this demo property."
                action={
                  <Link
                    href="/inspections/new"
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700"
                  >
                    New inspection
                  </Link>
                }
              />
            </CardBody>
          ) : (
            <TableWrap>
              <thead>
                <tr className="border-b border-navy-100">
                  <Th>Reference</Th>
                  <Th>Date</Th>
                  <Th className="hidden sm:table-cell">Inspector</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Open</Th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((i) => (
                  <tr key={i.id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <Td>
                      <Link href={`/inspections/workspace?id=${i.id}`} className="font-medium text-teal-700 hover:underline">
                        {i.reference}
                      </Link>
                      <p className="max-w-[220px] truncate text-xs text-navy-400">{i.title}</p>
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-navy-300" aria-hidden />
                        {formatDate(i.scheduledDate)}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell">{i.inspector}</Td>
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
                        View
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Property details" />
            <CardBody className="space-y-3 text-sm">
              <p className="flex items-start gap-2 text-navy-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-300" aria-hidden />
                <span>
                  {property.address ? `${property.address}, ` : ""}
                  {property.town}, {property.state}
                </span>
              </p>
              <p className="flex items-center gap-2 text-navy-700">
                <Building2 className="h-4 w-4 shrink-0 text-navy-300" aria-hidden />
                <span className="capitalize">{property.type}</span>
              </p>
              <p className="flex items-center gap-2 text-navy-700">
                <Ruler className="h-4 w-4 shrink-0 text-navy-300" aria-hidden />
                {property.roofAreaSqm.toLocaleString()} m² roof area
              </p>
              <p className="text-xs text-navy-400">Added {formatDate(property.createdAt)}</p>
              {property.notes ? <p className="border-t border-navy-100 pt-3 text-xs leading-relaxed text-navy-500">{property.notes}</p> : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Site contact" subtitle="Fictional demo contact" />
            <CardBody className="text-sm">
              <p className="font-medium text-navy-800">{property.contactPerson}</p>
              <p className="text-navy-500">{property.contactPhone}</p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <PropertyDetailPageInner />
    </Suspense>
  );
}
