"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  ActivityEntry,
  CompanyProfile,
  Finding,
  ImageAsset,
  Inspection,
  Property,
  ReviewRecord,
} from "./types";
import { DEMO_ACTIVITY, DEMO_COMPANY, DEMO_FINDINGS, DEMO_IMAGES, DEMO_INSPECTIONS, DEMO_PROPERTIES, DEMO_REVIEWS } from "./data";
import { applyReview, nextFindingReference } from "./workflow";

/**
 * Demo-mode store. State lives in React and mirrors to localStorage so a demo
 * survives a refresh on the same browser. This is explicitly NOT a durable
 * database — the UI labels it as demo persistence.
 */

const LS_KEY = "assetsentinel-demo-v1";

interface StoreState {
  properties: Property[];
  inspections: Inspection[];
  images: ImageAsset[];
  findings: Finding[];
  reviews: ReviewRecord[];
  activity: ActivityEntry[];
  company: CompanyProfile;
}

function initialStore(): StoreState {
  return {
    properties: DEMO_PROPERTIES,
    inspections: DEMO_INSPECTIONS,
    images: DEMO_IMAGES,
    findings: DEMO_FINDINGS,
    reviews: DEMO_REVIEWS,
    activity: DEMO_ACTIVITY,
    company: DEMO_COMPANY,
  };
}

function loadStore(): StoreState {
  if (typeof window === "undefined") return initialStore();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return initialStore();
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    const base = initialStore();
    return {
      properties: parsed.properties ?? base.properties,
      inspections: parsed.inspections ?? base.inspections,
      images: parsed.images ?? base.images,
      findings: parsed.findings ?? base.findings,
      reviews: parsed.reviews ?? base.reviews,
      activity: parsed.activity ?? base.activity,
      company: parsed.company ?? base.company,
    };
  } catch {
    return initialStore();
  }
}

function persist(state: StoreState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked — demo continues in memory only
  }
}

export interface NewPropertyInput {
  name: string;
  address: string;
  town: string;
  state: string;
  type: Property["type"];
  roofAreaSqm: number;
  yearBuilt: number;
  contactPerson: string;
  contactPhone: string;
  notes: string;
}

export interface NewInspectionInput {
  propertyId: string;
  title: string;
  inspector: string;
  scheduledDate: string;
  weather: string;
  summary: string;
}

export interface NewFindingInput {
  inspectionId: string;
  imageId: string;
  defectType: string;
  severity: Finding["severity"];
  title: string;
  notes: string;
  recommendations: string;
  annotations: Finding["annotations"];
  isAiSuggestion: boolean;
}

export interface StoreApi {
  state: StoreState;
  hydrated: boolean;
  addProperty: (input: NewPropertyInput) => Property;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  addInspection: (input: NewInspectionInput) => Inspection;
  updateInspectionStatus: (id: string, status: Inspection["status"]) => void;
  addImage: (image: Omit<ImageAsset, "id">) => ImageAsset;
  addFinding: (input: NewFindingInput) => Finding;
  reviewFinding: (findingId: string, action: "approve" | "reject" | "edit", reviewer: string, comment: string) => void;
  updateFinding: (id: string, patch: Partial<Finding>) => void;
  setCompany: (patch: Partial<CompanyProfile>) => void;
  resetDemo: () => void;
  subscribe: (listener: () => void) => () => void;
  replaceAll: (next: Omit<StoreState, "company"> & { company?: CompanyProfile }) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

function useCreateStore(): StoreApi {
  const [state, setState] = useState<StoreState>(initialStore);
  const [hydrated, setHydrated] = useState(false);
  const listenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    setState(loadStore());
    setHydrated(true);
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const replaceAll = useCallback((next: Omit<StoreState, "company"> & { company?: CompanyProfile }) => {
    setState((prev) => {
      const merged: StoreState = {
        properties: next.properties,
        inspections: next.inspections,
        images: next.images,
        findings: next.findings,
        reviews: next.reviews,
        activity: next.activity,
        company: next.company ?? prev.company,
      };
      persist(merged);
      return merged;
    });
  }, []);

  const mutate = useCallback((fn: (s: StoreState) => StoreState) => {
    setState((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });
    // notify sync listeners after state update is scheduled
    queueMicrotask(() => {
      for (const l of listenersRef.current) l();
    });
  }, []);

  const addActivity = (s: StoreState, kind: ActivityEntry["kind"], message: string): StoreState => {
    const entry: ActivityEntry = {
      id: `act_${Math.random().toString(36).slice(2, 10)}`,
      at: new Date().toISOString(),
      kind,
      message,
    };
    return { ...s, activity: [entry, ...s.activity].slice(0, 50) };
  };

  const addProperty = useCallback(
    (input: NewPropertyInput): Property => {
      const property: Property = {
        ...input,
        id: `p_${Math.random().toString(36).slice(2, 10)}`,
        createdAt: new Date().toISOString(),
      };
      mutate((s) => {
        const withNew = { ...s, properties: [...s.properties, property] };
        return addActivity(withNew, "property", `${property.name} added to portfolio (demo)`);
      });
      return property;
    },
    [mutate]
  );

  const updateProperty = useCallback(
    (id: string, patch: Partial<Property>) => {
      mutate((s) => ({
        ...s,
        properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [mutate]
  );

  const addInspection = useCallback(
    (input: NewInspectionInput): Inspection => {
      const year = new Date().getFullYear();
      const inspection: Inspection = {
        ...input,
        id: `i_${Math.random().toString(36).slice(2, 10)}`,
        reference: `INSP-${year}-${String(Math.floor(Math.random() * 900) + 100)}`,
        status: "in_progress",
        createdAt: new Date().toISOString(),
      };
      mutate((s) => {
        const withNew = { ...s, inspections: [...s.inspections, inspection] };
        return addActivity(withNew, "inspection", `${inspection.reference} started (demo)`);
      });
      return inspection;
    },
    [mutate]
  );

  const updateInspectionStatus = useCallback(
    (id: string, status: Inspection["status"]) => {
      mutate((s) => {
        const insp = s.inspections.find((i) => i.id === id);
        let next = { ...s, inspections: s.inspections.map((i) => (i.id === id ? { ...i, status } : i)) };
        if (insp && status === "published") {
          next = addActivity(next, "report", `Report published for ${insp.reference} (demo)`);
        }
        return next;
      });
    },
    [mutate]
  );

  const addImage = useCallback(
    (image: Omit<ImageAsset, "id">): ImageAsset => {
      const full: ImageAsset = { ...image, id: `img_${Math.random().toString(36).slice(2, 10)}` };
      mutate((s) => ({ ...s, images: [...s.images, full] }));
      return full;
    },
    [mutate]
  );

  const addFinding = useCallback(
    (input: NewFindingInput): Finding => {
      const finding: Finding = {
        ...input,
        id: `f_${Math.random().toString(36).slice(2, 10)}`,
        reference: "F-000", // replaced below with a proper sequence
        status: "pending_review",
        createdAt: new Date().toISOString(),
      };
      mutate((s) => {
        const reference = nextFindingReference(s.findings);
        const withRef = { ...finding, reference };
        const withNew = { ...s, findings: [...s.findings, withRef] };
        return addActivity(withNew, "finding", `${reference} captured for ${input.inspectionId.startsWith("i_") ? "inspection" : "inspection"} (demo)`);
      });
      return { ...finding, reference: "F-NEW" };
    },
    [mutate]
  );

  const reviewFinding = useCallback(
    (findingId: string, action: "approve" | "reject" | "edit", reviewer: string, comment: string) => {
      mutate((s) => {
        const finding = s.findings.find((f) => f.id === findingId);
        if (!finding) return s;
        const { finding: updated, record } = applyReview(
          finding,
          action,
          reviewer || "Demo reviewer",
          comment,
          new Date().toISOString()
        );
        let next: StoreState = {
          ...s,
          findings: s.findings.map((f) => (f.id === findingId ? updated : f)),
          reviews: [...s.reviews, record],
        };
        next = addActivity(next, "review", `${finding.reference} ${record.action} by ${record.reviewer}`);
        return next;
      });
    },
    [mutate]
  );

  const updateFinding = useCallback(
    (id: string, patch: Partial<Finding>) => {
      mutate((s) => ({
        ...s,
        findings: s.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      }));
    },
    [mutate]
  );

  const setCompany = useCallback(
    (patch: Partial<CompanyProfile>) => {
      mutate((s) => ({ ...s, company: { ...s.company, ...patch } }));
    },
    [mutate]
  );

  const resetDemo = useCallback(() => {
    if (typeof window !== "undefined") window.localStorage.removeItem(LS_KEY);
    setState(initialStore());
  }, []);

  return useMemo(
    () => ({
      state,
      hydrated,
      addProperty,
      updateProperty,
      addInspection,
      updateInspectionStatus,
      addImage,
      addFinding,
      reviewFinding,
      updateFinding,
      setCompany,
      resetDemo,
      subscribe,
      replaceAll,
    }),
    [state, hydrated, addProperty, updateProperty, addInspection, updateInspectionStatus, addImage, addFinding, reviewFinding, updateFinding, setCompany, resetDemo, subscribe, replaceAll]
  );
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const api = useCreateStore();
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <DemoStoreProvider>");
  return ctx;
}
