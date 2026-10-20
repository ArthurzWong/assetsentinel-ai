import type {
  CompanyProfile,
  Finding,
  ImageAsset,
  Inspection,
  Property,
  ReviewRecord,
} from "./types";

/**
 * Repository seam. In Phase 1 everything resolves from the in-memory demo
 * store. When Supabase integration starts, implement the same functions
 * against supabase-js and swap `makeDemoRepo` for `makeSupabaseRepo` — the
 * UI layer depends only on these signatures.
 */

export interface Repo {
  listProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  listInspections(propertyId?: string): Promise<Inspection[]>;
  getInspection(id: string): Promise<Inspection | undefined>;
  listImages(inspectionId: string): Promise<ImageAsset[]>;
  listFindings(inspectionId: string): Promise<Finding[]>;
  listReviews(findingId?: string): Promise<ReviewRecord[]>;
  getCompany(): Promise<CompanyProfile>;
}

export function makeDemoRepo(get: () => {
  properties: Property[];
  inspections: Inspection[];
  images: ImageAsset[];
  findings: Finding[];
  reviews: ReviewRecord[];
  company: CompanyProfile;
}): Repo {
  return {
    async listProperties() {
      return get().properties;
    },
    async getProperty(id) {
      return get().properties.find((p) => p.id === id);
    },
    async listInspections(propertyId) {
      return propertyId
        ? get().inspections.filter((i) => i.propertyId === propertyId)
        : get().inspections;
    },
    async getInspection(id) {
      return get().inspections.find((i) => i.id === id);
    },
    async listImages(inspectionId) {
      return get().images.filter((i) => i.inspectionId === inspectionId);
    },
    async listFindings(inspectionId) {
      return get().findings.filter((f) => f.inspectionId === inspectionId);
    },
    async listReviews(findingId) {
      return findingId
        ? get().reviews.filter((r) => r.findingId === findingId)
        : get().reviews;
    },
    async getCompany() {
      return get().company;
    },
  };
}
