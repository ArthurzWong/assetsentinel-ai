"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmptyState, PageHeader, DemoPill } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";
import { useStore } from "@/lib/store";

function EditPropertyPageInner() {
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
        hint="Demo data lives in this browser only — reset the demo to restore the seeded dataset."
        action={<Link href="/properties" className="text-sm font-medium text-teal-700 hover:underline">Back to properties</Link>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit — ${property.name}`}
        subtitle="Changes apply to the local demo dataset only."
        actions={<DemoPill />}
      />
      <PropertyForm existing={property} />
    </div>
  );
}

export default function EditPropertyPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>}>
      <EditPropertyPageInner />
    </Suspense>
  );
}
