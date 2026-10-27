"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Building, Check, Palette, RotateCcw, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { DEMO_TEAM } from "@/lib/data";
import { SupabaseSettingsPanel } from "@/components/supabase-settings";
import { useSupabaseSync } from "@/components/supabase-sync-provider";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DemoPill,
  Field,
  Input,
  PageHeader,
  TableWrap,
  Td,
  Textarea,
  Th,
} from "@/components/ui";

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  inspector: "Inspector",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

const ROLE_DESC: Record<string, string> = {
  admin: "Full access to properties, inspections, settings",
  inspector: "Creates inspections, uploads photos, captures findings",
  reviewer: "Approves / edits / rejects findings — the human gate",
  viewer: "Read-only access to published reports",
};

export default function SettingsPage() {
  const { state, setCompany, resetDemo, hydrated } = useStore();
  const { connect, disconnect } = useSupabaseSync();
  const [saved, setSaved] = useState(false);
  const company = state.company;

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-navy-400" role="status">Loading demo workspace…</div>;
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setCompany({
      name: String(fd.get("name") ?? company.name),
      tagline: String(fd.get("tagline") ?? company.tagline),
      registrationNo: String(fd.get("registrationNo") ?? company.registrationNo),
      email: String(fd.get("email") ?? company.email),
      phone: String(fd.get("phone") ?? company.phone),
      address: String(fd.get("address") ?? company.address),
      reportFooter: String(fd.get("reportFooter") ?? company.reportFooter),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Company profile, roles preview, pricing and branding — all demo configuration."
        actions={<DemoPill />}
      />

      <div className="mb-6">
        <SupabaseSettingsPanel onConnect={connect} onDisconnect={disconnect} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Company profile */}
        <Card>
          <CardHeader title="Company profile" subtitle="Appears on the report header and PDF footer" action={<Building className="h-4 w-4 text-teal-600" aria-hidden />} />
          <CardBody>
            <form onSubmit={submit} className="space-y-4" aria-label="Company profile form">
              <Field label="Company name">
                <Input name="name" defaultValue={company.name} />
              </Field>
              <Field label="Tagline">
                <Input name="tagline" defaultValue={company.tagline} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Registration no. (demo)">
                  <Input name="registrationNo" defaultValue={company.registrationNo} />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" defaultValue={company.email} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <Input name="phone" defaultValue={company.phone} />
                </Field>
                <Field label="Address">
                  <Input name="address" defaultValue={company.address} />
                </Field>
              </div>
              <Field label="Report footer / disclaimer">
                <Textarea name="reportFooter" rows={3} defaultValue={company.reportFooter} />
              </Field>
              <div className="flex items-center gap-3">
                <Button type="submit">Save profile</Button>
                {saved ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                    <Check className="h-4 w-4" aria-hidden /> Saved to demo storage
                  </span>
                ) : null}
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="space-y-6">
          {/* Users / roles preview */}
          <Card>
            <CardHeader title="Users & roles" subtitle="Phase 1 preview only — no real authentication" action={<Users className="h-4 w-4 text-teal-600" aria-hidden />} />
            <TableWrap>
              <thead>
                <tr className="border-b border-navy-100">
                  <Th>User</Th>
                  <Th>Role</Th>
                  <Th className="hidden sm:table-cell">Scope</Th>
                </tr>
              </thead>
              <tbody>
                {DEMO_TEAM.map((u) => (
                  <tr key={u.id} className="border-b border-navy-50 last:border-0">
                    <Td>
                      <p className="font-medium text-navy-800">{u.name}</p>
                      <p className="text-xs text-navy-400">{u.email}</p>
                    </Td>
                    <Td>
                      <Badge className="border-teal-200 bg-teal-100 text-teal-800">{ROLE_LABEL[u.role]}</Badge>
                    </Td>
                    <Td className="hidden text-xs text-navy-500 sm:table-cell">{ROLE_DESC[u.role]}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader title="Pricing" subtitle="Demo tiers — not live billing" />
            <CardBody className="grid gap-3 sm:grid-cols-3">
              {[
                { id: "t1", name: "Per-Survey", price: "RM 1,800", per: "per inspection", features: ["Single visit", "30 annotated photos", "PDF report"] },
                { id: "t2", name: "Portfolio Care", price: "RM 4,800", per: "per quarter", features: ["4 properties", "Quarterly surveys", "Priority review"] },
                { id: "t3", name: "Enterprise", price: "Custom", per: "planned", features: ["Unlimited sites", "API integration", "SLA support"] },
              ].map((t) => (
                <div key={t.id} className={`rounded-xl border p-4 ${t.id === "t2" ? "border-teal-300 bg-teal-50" : "border-navy-100"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">{t.name}</p>
                  <p className="mt-1 text-lg font-bold text-navy-900">{t.price}</p>
                  <p className="text-xs text-navy-400">{t.per}</p>
                  <ul className="mt-2 space-y-1">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-navy-600">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-teal-600" aria-hidden /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader title="Branding" subtitle="Phase 1 uses the fixed navy/teal enterprise theme" action={<Palette className="h-4 w-4 text-teal-600" aria-hidden />} />
            <CardBody>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-950 text-white font-bold">AS</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-600 text-white font-bold">AS</span>
                <div className="text-xs text-navy-500">
                  Logo text: <strong>AssetSentinel AI</strong> — custom logo upload arrives with the Supabase integration.
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Demo data controls */}
          <Card>
            <CardHeader title="Demo data" subtitle="Everything lives in this browser's localStorage" action={<RotateCcw className="h-4 w-4 text-teal-600" aria-hidden />} />
            <CardBody>
              <p className="text-xs leading-relaxed text-navy-500">
                Properties, inspections, findings, reviews and this profile are stored locally for the demo. Reset restores
                the original seeded dataset and removes your local changes.
              </p>
              <Button
                variant="dangerOutline"
                className="mt-3"
                onClick={() => {
                  if (window.confirm("Reset the demo dataset? Local changes will be removed.")) resetDemo();
                }}
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Reset demo data
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
