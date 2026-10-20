"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { Property } from "@/lib/types";

export function PropertyForm({ existing }: { existing?: Property }) {
  const router = useRouter();
  const { addProperty, updateProperty } = useStore();
  const [name, setName] = useState(existing?.name ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [town, setTown] = useState(existing?.town ?? "");
  const [stateSel, setStateSel] = useState(existing?.state ?? "Selangor");
  const [type, setType] = useState<Property["type"]>(existing?.type ?? "factory");
  const [roofAreaSqm, setRoofArea] = useState(existing ? String(existing.roofAreaSqm) : "");
  const [yearBuilt, setYearBuilt] = useState(existing ? String(existing.yearBuilt) : "");
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson ?? "");
  const [contactPhone, setContactPhone] = useState(existing?.contactPhone ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !town.trim()) {
      setError("Property name and town are required.");
      return;
    }
    const area = parseInt(roofAreaSqm, 10);
    const year = parseInt(yearBuilt, 10);
    const payload = {
      name: name.trim(),
      address: address.trim(),
      town: town.trim(),
      state: stateSel.trim() || "Selangor",
      type: type as Property["type"],
      roofAreaSqm: Number.isNaN(area) ? 0 : area,
      yearBuilt: Number.isNaN(year) ? new Date().getFullYear() : year,
      contactPerson: contactPerson.trim() || "Demo contact",
      contactPhone: contactPhone.trim() || "—",
      notes: notes.trim(),
    };
    if (existing) {
      updateProperty(existing.id, payload);
      router.push(`/properties/detail?id=${existing.id}`);
    } else {
      const created = addProperty(payload);
      router.push(`/properties/detail?id=${created.id}`);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5" aria-label={existing ? "Edit property form" : "New property form"}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <Card>
        <CardBody className="space-y-4">
          <Field label="Property name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bukit Raja Manufacturing Plant (demo)" required />
          </Field>
          <Field label="Street address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Lot / street, section" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Town *">
              <Input value={town} onChange={(e) => setTown(e.target.value)} placeholder="e.g. Klang" required />
            </Field>
            <Field label="State">
              <Select value={stateSel} onChange={(e) => setStateSel(e.target.value)}>
                {["Selangor", "Kuala Lumpur", "Putrajaya", "Johor", "Penang", "Perak", "Negeri Sembilan", "Melaka", "Other"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Building type">
              <Select value={type} onChange={(e) => setType(e.target.value as Property["type"])}>
                <option value="factory">Factory</option>
                <option value="warehouse">Warehouse</option>
                <option value="depot">Depot</option>
                <option value="workshop">Workshop</option>
              </Select>
            </Field>
            <Field label="Roof area (m²)">
              <Input type="number" min="0" value={roofAreaSqm} onChange={(e) => setRoofArea(e.target.value)} placeholder="e.g. 5000" />
            </Field>
            <Field label="Year built">
              <Input type="number" min="1900" max="2100" value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} placeholder="e.g. 2010" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person (demo)">
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Fictional contact" />
            </Field>
            <Field label="Contact phone (demo)">
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+60 …" />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Roof construction, access constraints, etc." />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit">{existing ? "Save changes" : "Create property"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <p className="ml-auto hidden text-xs text-navy-400 sm:block">
          Demo mode: stored in this browser only.
        </p>
      </div>
    </form>
  );
}
