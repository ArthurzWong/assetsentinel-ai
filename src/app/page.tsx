"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileBarChart,
  FlaskConical,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  DemoPill,
  EmptyState,
  PageHeader,
  StatCard,
  Td,
  Th,
  TableWrap,
  formatDateTime,
} from "@/components/ui";
import { inspectionStatusLabel, isReviewed, reviewGate, severityColor } from "@/lib/workflow";
import type { Severity } from "@/lib/types";

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export default function DashboardPage() {
  const { state, hydrated } = useStore();
  const { properties, inspections, findings, reviews, activity } = state;
  const reportsDone = inspections.filter((i) => i.status === "published").length;

  const pending = findings.filter((f) => !isReviewed(f));
  const gate = reviewGate(findings);
  const bySeverity = SEVERITIES.map((s) => ({
    severity: s,
    count: findings.filter((f) => f.severity === s).length,
  }));
  const maxSev = Math.max(1, ...bySeverity.map((b) => b.count));

  const activityKindClass = (kind: string) =>
    kind === "review"
      ? "bg-teal-100 text-teal-800 border-teal-200"
      : kind === "report"
        ? "bg-navy-100 text-navy-800 border-navy-200"
        : kind === "finding"
          ? "bg-amber-100 text-amber-800 border-amber-200"
          : "bg-navy-50 text-navy-600 border-navy-200";

  if (!hydrated) {
    return (
      <div className="py-24 text-center text-sm text-navy-400" role="status">
        Loading demo workspace…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Portfolio health at a glance — demo dataset, fictional properties."
        actions={
          <>
            <DemoPill />
            <Link
              href="/inspections/new"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden /> New inspection
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Properties" value={properties.length} hint="Demo industrial sites" accent="navy" />
        <StatCard label="Inspections" value={inspections.length} hint={`${reportsDone} report${reportsDone === 1 ? "" : "s"} published`} accent="teal" />
        <StatCard label="Findings pending review" value={pending.length} hint="Human review required" accent="amber" />
        <StatCard label="Reports" value={reportsDone} hint="Approved findings only" accent="navy" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Severity breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Findings by severity"
            subtitle={`${findings.length} demo findings across ${inspections.length} inspections`}
            action={
              <Badge className="border-navy-200 bg-navy-50 text-navy-600">
                <FlaskConical className="mr-1 h-3 w-3" aria-hidden /> Demo data
              </Badge>
            }
          />
          <CardBody>
            <div className="space-y-3">
              {bySeverity.map(({ severity, count }) => (
                <div key={severity} className="flex items-center gap-3">
                  <span className={`inline-flex w-20 justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityColor(severity)}`}>
                    {severity}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                    <div
                      className={
                        severity === "critical"
                          ? "h-full rounded-full bg-red-600"
                          : severity === "high"
                            ? "h-full rounded-full bg-orange-500"
                            : severity === "medium"
                              ? "h-full rounded-full bg-amber-400"
                              : "h-full rounded-full bg-emerald-500"
                      }
                      style={{ width: `${Math.round((count / maxSev) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-navy-800">{count}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <strong>Review gate:</strong>{" "}
              {gate.canPublish
                ? "all findings have been reviewed — reports can be published for reviewed inspections."
                : `${gate.pending} finding${gate.pending === 1 ? "" : "s"} still pending review. Reports stay blocked until every finding is approved, edited or rejected.`}
            </div>
          </CardBody>
        </Card>

        {/* Review pipeline */}
        <Card>
          <CardHeader title="Review pipeline" subtitle="Human-in-the-loop status" />
          <CardBody>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-navy-600">Pending review</span>
                <span className="font-bold text-amber-600">{gate.pending}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-600">Approved / edited</span>
                <span className="font-bold text-emerald-600">{gate.approved}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-600">Rejected</span>
                <span className="font-bold text-red-500">{gate.rejected}</span>
              </li>
              <li className="flex items-center justify-between border-t border-navy-100 pt-3">
                <span className="text-navy-600">Review records</span>
                <span className="font-bold text-navy-900">{reviews.length}</span>
              </li>
            </ul>
            <Link
              href="/review"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-800 hover:bg-navy-50"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden /> Open review queue <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </CardBody>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" subtitle="Demo event log (newest first)" />
          <CardBody className="space-y-3">
            {activity.length === 0 ? (
              <EmptyState title="No activity yet" hint="Actions you take in the demo will appear here." />
            ) : (
              activity.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <Badge className={`mt-0.5 shrink-0 ${activityKindClass(a.kind)}`}>{a.kind}</Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-navy-800">{a.message}</p>
                    <p className="text-xs text-navy-400">{formatDateTime(a.at)}</p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Inspections" subtitle="Latest demo surveys" action={<Link href="/inspections" className="text-xs font-medium text-teal-700 hover:underline">View all</Link>} />
          <TableWrap>
            <thead>
              <tr className="border-b border-navy-100">
                <Th>Ref</Th>
                <Th>Property</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {inspections.slice(0, 5).map((i) => {
                const prop = properties.find((p) => p.id === i.propertyId);
                return (
                  <tr key={i.id} className="border-b border-navy-50 last:border-0">
                    <Td>
                      <Link href={`/inspections/workspace?id=${i.id}`} className="font-medium text-teal-700 hover:underline">
                        {i.reference}
                      </Link>
                    </Td>
                    <Td className="max-w-[180px] truncate">{prop?.name ?? "—"}</Td>
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
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Card>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { href: "/properties", label: "Properties", icon: Building2 },
          { href: "/inspections", label: "Inspections", icon: ClipboardCheck },
          { href: "/review", label: "Human review", icon: ShieldCheck },
          { href: "/reports", label: "Reports", icon: FileBarChart },
        ].map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-2 rounded-xl border border-navy-100 bg-white p-5 text-center shadow-card transition hover:border-teal-300 hover:shadow-pop"
          >
            <Icon className="h-6 w-6 text-teal-600" aria-hidden />
            <span className="text-sm font-medium text-navy-800 group-hover:text-teal-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
