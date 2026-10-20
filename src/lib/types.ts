export type Severity = "low" | "medium" | "high" | "critical";

export type FindingStatus = "pending_review" | "approved" | "rejected" | "edited";

export type ReviewAction = "approved" | "rejected" | "edited";

export type InspectionStatus = "draft" | "in_progress" | "review" | "published";

export interface Property {
  id: string;
  name: string;
  address: string;
  town: string;
  state: string;
  type: "factory" | "warehouse" | "depot" | "workshop";
  roofAreaSqm: number;
  yearBuilt: number;
  contactPerson: string;
  contactPhone: string;
  notes: string;
  createdAt: string;
}

export interface ImageAsset {
  id: string;
  inspectionId: string;
  fileName: string;
  src: string; // path under /images or a session object URL (demo uploads)
  capturedAt: string;
  locationLabel: string;
  isDemoUpload?: boolean;
  width?: number;
  height?: number;
}

export interface Annotation {
  id: string;
  x: number; // percentage of image width (0-100)
  y: number; // percentage of image height (0-100)
  label: string;
  severity: Severity;
}

export interface Finding {
  id: string;
  inspectionId: string;
  imageId: string;
  reference: string; // e.g. F-001
  defectType: string;
  severity: Severity;
  title: string;
  notes: string;
  recommendations: string;
  status: FindingStatus;
  isAiSuggestion: boolean;
  annotations: Annotation[];
  createdAt: string;
}

export interface ReviewRecord {
  id: string;
  findingId: string;
  action: ReviewAction;
  reviewer: string;
  comment: string;
  at: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  reference: string; // e.g. INSP-2026-014
  title: string;
  inspector: string;
  scheduledDate: string;
  status: InspectionStatus;
  weather: string;
  summary: string;
  createdAt: string;
}

export interface CompanyProfile {
  name: string;
  tagline: string;
  registrationNo: string;
  email: string;
  phone: string;
  address: string;
  reportFooter: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: "admin" | "inspector" | "reviewer" | "viewer";
  email: string;
}

export interface PricingTier {
  id: string;
  name: string;
  priceMYR: number;
  per: string;
  features: string[];
  highlighted?: boolean;
}

export interface BrandingSettings {
  primary: "navy" | "teal";
  reportAccent: string;
  logoText: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  kind: "property" | "inspection" | "finding" | "review" | "report" | "settings";
  message: string;
}
