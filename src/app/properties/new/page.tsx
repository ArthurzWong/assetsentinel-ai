"use client";

import { PageHeader } from "@/components/ui";
import { PropertyForm } from "@/components/property-form";

export default function NewPropertyPage() {
  return (
    <div>
      <PageHeader
        title="Add property"
        subtitle="Demo mode — new properties are stored in this browser only and labelled as demo data."
      />
      <PropertyForm />
    </div>
  );
}
