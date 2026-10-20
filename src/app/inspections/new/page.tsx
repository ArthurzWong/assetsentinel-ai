"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, DemoPill, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function NewInspectionPage() {
  const router = useRouter();
  const { state, addInspection, hydrated } = useStore();
  const [propertyId, setPropertyId] = useState("");
  const [title, setTitle] = useState("");
  const [inspector, setInspector] = useState("S. Ibrahim (demo)");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState("");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState("");

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!propertyId) {
      setError("Choose a property for this inspection.");
      return;
    }
    if (!title.trim()) {
      setError("Give the inspection a short title.");
      return;
    }
    const created = addInspection({
      propertyId,
      title: title.trim(),
      inspector: inspector.trim() || "Demo inspector",
      scheduledDate: date,
      weather: weather.trim(),
      summary: summary.trim(),
    });
    router.push(`/inspections/${created.id}`);
  }

  return (
    <div>
      <PageHeader
        title="New inspection"
        subtitle="Creates a demo survey under the selected property — stored in this browser only."
        actions={<DemoPill />}
      />
      <form onSubmit={submit} className="max-w-2xl space-y-5" aria-label="New inspection form">
        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">{error}</p>
        ) : null}
        <Card>
          <CardBody className="space-y-4">
            <Field label="Property *">
              <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
                <option value="">Select a property…</option>
                {state.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.town}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Inspection title *">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quarterly roof condition survey" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Inspector">
                <Input value={inspector} onChange={(e) => setInspector(e.target.value)} />
              </Field>
              <Field label="Scheduled date">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </Field>
              <Field label="Weather">
                <Input value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Hot, clear" />
              </Field>
            </div>
            <Field label="Summary / scope">
              <Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What this survey covers (roof fields, gutters, elevations…)" />
            </Field>
          </CardBody>
        </Card>
        <div className="flex items-center gap-3">
          <Button type="submit">Create inspection</Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
