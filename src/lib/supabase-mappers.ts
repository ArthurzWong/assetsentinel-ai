"use client";

import type {
  ActivityEntry,
  Annotation,
  CompanyProfile,
  Finding,
  FindingStatus,
  ImageAsset,
  Inspection,
  InspectionStatus,
  Property,
  ReviewRecord,
  Severity,
} from "./types";

/**
 * Row mappers between Supabase snake_case rows and the app's typed domain
 * model. Keeping them in one place means schema changes touch exactly this
 * file.
 */

export interface PropertyRow {
  id: string;
  name: string;
  address: string | null;
  town: string;
  state: string | null;
  type: string;
  roof_area_sqm: number | null;
  year_built: number | null;
  contact_person: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

export function propertyToRow(p: Property): PropertyRow {
  return {
    id: p.id,
    name: p.name,
    address: p.address,
    town: p.town,
    state: p.state,
    type: p.type,
    roof_area_sqm: p.roofAreaSqm,
    year_built: p.yearBuilt,
    contact_person: p.contactPerson,
    contact_phone: p.contactPhone,
    notes: p.notes,
    created_at: p.createdAt,
  };
}

export function rowToProperty(r: PropertyRow): Property {
  return {
    id: r.id,
    name: r.name,
    address: r.address ?? "",
    town: r.town,
    state: r.state ?? "Selangor",
    type: (r.type as Property["type"]) ?? "factory",
    roofAreaSqm: r.roof_area_sqm ?? 0,
    yearBuilt: r.year_built ?? 2000,
    contactPerson: r.contact_person ?? "",
    contactPhone: r.contact_phone ?? "",
    notes: r.notes ?? "",
    createdAt: r.created_at,
  };
}

export interface InspectionRow {
  id: string;
  property_id: string | null;
  reference: string;
  title: string;
  inspector: string | null;
  scheduled_date: string | null;
  status: string;
  weather: string | null;
  summary: string | null;
  created_at: string;
}

export function inspectionToRow(i: Inspection): InspectionRow {
  return {
    id: i.id,
    property_id: i.propertyId,
    reference: i.reference,
    title: i.title,
    inspector: i.inspector,
    scheduled_date: i.scheduledDate,
    status: i.status,
    weather: i.weather,
    summary: i.summary,
    created_at: i.createdAt,
  };
}

export function rowToInspection(r: InspectionRow): Inspection {
  return {
    id: r.id,
    propertyId: r.property_id ?? "",
    reference: r.reference,
    title: r.title,
    inspector: r.inspector ?? "",
    scheduledDate: r.scheduled_date ?? r.created_at.slice(0, 10),
    status: (r.status as InspectionStatus) ?? "in_progress",
    weather: r.weather ?? "",
    summary: r.summary ?? "",
    createdAt: r.created_at,
  };
}

export interface ImageRow {
  id: string;
  inspection_id: string | null;
  file_name: string | null;
  storage_path: string | null;
  src: string;
  captured_at: string | null;
  location_label: string | null;
  width: number | null;
  height: number | null;
}

export function imageToRow(i: ImageAsset, storagePath: string): ImageRow {
  return {
    id: i.id,
    inspection_id: i.inspectionId,
    file_name: i.fileName,
    storage_path: storagePath,
    src: i.src,
    captured_at: i.capturedAt,
    location_label: i.locationLabel,
    width: i.width ?? null,
    height: i.height ?? null,
  };
}

export function rowToImage(r: ImageRow): ImageAsset {
  return {
    id: r.id,
    inspectionId: r.inspection_id ?? "",
    fileName: r.file_name ?? "",
    src: r.src,
    capturedAt: r.captured_at ?? new Date().toISOString(),
    locationLabel: r.location_label ?? "",
    width: r.width ?? undefined,
    height: r.height ?? undefined,
  };
}

export interface FindingRow {
  id: string;
  inspection_id: string | null;
  image_id: string | null;
  reference: string;
  defect_type: string | null;
  severity: string;
  title: string;
  notes: string | null;
  recommendations: string | null;
  status: string;
  is_ai_suggestion: boolean;
  annotations: Annotation[] | null;
  created_at: string;
}

export function findingToRow(f: Finding): FindingRow {
  return {
    id: f.id,
    inspection_id: f.inspectionId,
    image_id: f.imageId,
    reference: f.reference,
    defect_type: f.defectType,
    severity: f.severity,
    title: f.title,
    notes: f.notes,
    recommendations: f.recommendations,
    status: f.status,
    is_ai_suggestion: f.isAiSuggestion,
    annotations: f.annotations,
    created_at: f.createdAt,
  };
}

export function rowToFinding(r: FindingRow): Finding {
  return {
    id: r.id,
    inspectionId: r.inspection_id ?? "",
    imageId: r.image_id ?? "",
    reference: r.reference,
    defectType: r.defect_type ?? "Other",
    severity: (r.severity as Severity) ?? "medium",
    title: r.title,
    notes: r.notes ?? "",
    recommendations: r.recommendations ?? "",
    status: (r.status as FindingStatus) ?? "pending_review",
    isAiSuggestion: r.is_ai_suggestion,
    annotations: r.annotations ?? [],
    createdAt: r.created_at,
  };
}

export interface ReviewRow {
  id: string;
  finding_id: string | null;
  action: string;
  reviewer: string | null;
  comment: string | null;
  at: string;
}

export function reviewToRow(r: ReviewRecord): ReviewRow {
  return {
    id: r.id,
    finding_id: r.findingId,
    action: r.action,
    reviewer: r.reviewer,
    comment: r.comment,
    at: r.at,
  };
}

export function rowToReview(r: ReviewRow): ReviewRecord {
  return {
    id: r.id,
    findingId: r.finding_id ?? "",
    action: r.action as ReviewRecord["action"],
    reviewer: r.reviewer ?? "",
    comment: r.comment ?? "",
    at: r.at,
  };
}

export interface ActivityRow {
  id: string;
  at: string;
  kind: string;
  message: string;
}

export function activityToRow(a: ActivityEntry): ActivityRow {
  return { id: a.id, at: a.at, kind: a.kind, message: a.message };
}

export function rowToActivity(r: ActivityRow): ActivityEntry {
  return { id: r.id, at: r.at, kind: r.kind as ActivityEntry["kind"], message: r.message };
}
