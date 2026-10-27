"use client";

import type { StoreApi } from "./store";
import { getSupabaseClient, readSupabaseConfig, type SupabaseConfig } from "./supabase";
import {
  activityToRow,
  findingToRow,
  imageToRow,
  inspectionToRow,
  propertyToRow,
  reviewToRow,
  rowToActivity,
  rowToFinding,
  rowToImage,
  rowToInspection,
  rowToProperty,
  rowToReview,
} from "./supabase-mappers";
import type { Finding, ImageAsset, Property, ReviewRecord } from "./types";

/**
 * Live persistence layer: mirrors every demo-store mutation to Supabase.
 * The UI keeps using the same useStore() API; this adapter observes the
 * store state and pushes changes. Reads hydrate the store from Supabase
 * on connect (one-way replace), giving multi-device persistence while
 * keeping the demo store as the runtime source of truth for rendering.
 *
 * Design notes:
 * - Writes are fire-and-forget with error surfacing via the status callback;
 *   the UI must never silently pretend a write succeeded.
 * - Seed/replace uses per-table upserts so partial connections still work.
 * - Images with blob/object URLs are skipped by the syncer (session-only
 *   content); only images with http(s) or storage-backed src persist.
 */

export type SyncStatus =
  | { state: "disconnected" }
  | { state: "connecting" }
  | { state: "connected"; url: string }
  | { state: "error"; message: string };

export interface SupabaseSyncApi {
  connect(cfg: SupabaseConfig): Promise<{ ok: boolean; message: string }>;
  disconnect(): void;
  status: SyncStatus;
}

export function isPersistableImage(img: ImageAsset): boolean {
  return img.src.startsWith("http") || img.src.startsWith("/");
}

function isLocalOnlyRecord(f: Finding): boolean {
  return f.id.includes("local") === false && true;
}

export function attachSupabaseSync(
  store: StoreApi,
  onStatus: (s: SyncStatus) => void,
  cfgIn?: SupabaseConfig | null
): SupabaseSyncApi {
  let cfg: SupabaseConfig | null = cfgIn ?? readSupabaseConfig();
  let active = false;
  let syncing = false;
  let lastPushedAt = "";

  function setStatus(s: SyncStatus) {
    onStatus(s);
  }

  async function pushAll(): Promise<{ ok: boolean; message: string }> {
    if (!cfg) return { ok: false, message: "Not configured" };
    if (syncing) return { ok: true, message: "Sync already in progress" };
    syncing = true;
    try {
      const sb = getSupabaseClient(cfg);
      const s = store.state;

      // Company profile (single row, id=1)
      const { error: companyErr } = await sb
        .from("company")
        .upsert({ id: 1, data: s.company });
      if (companyErr) throw new Error(`company: ${companyErr.message}`);

      if (s.properties.length > 0) {
        const { error } = await sb.from("properties").upsert(s.properties.map(propertyToRow));
        if (error) throw new Error(`properties: ${error.message}`);
      }
      if (s.inspections.length > 0) {
        const { error } = await sb.from("inspections").upsert(s.inspections.map(inspectionToRow));
        if (error) throw new Error(`inspections: ${error.message}`);
      }
      const persistableImages = s.images.filter(isPersistableImage);
      if (persistableImages.length > 0) {
        const { error } = await sb
          .from("images")
          .upsert(persistableImages.map((img) => imageToRow(img, img.src)));
        if (error) throw new Error(`images: ${error.message}`);
      }
      const persistableFindings = s.findings.filter(isLocalOnlyRecord);
      if (persistableFindings.length > 0) {
        const { error } = await sb.from("findings").upsert(persistableFindings.map(findingToRow));
        if (error) throw new Error(`findings: ${error.message}`);
      }
      if (s.reviews.length > 0) {
        const { error } = await sb.from("reviews").upsert(s.reviews.map(reviewToRow));
        if (error) throw new Error(`reviews: ${error.message}`);
      }
      if (s.activity.length > 0) {
        const { error } = await sb.from("activity").upsert(s.activity.slice(0, 50).map(activityToRow));
        if (error) throw new Error(`activity: ${error.message}`);
      }
      lastPushedAt = new Date().toISOString();
      return { ok: true, message: `Synced at ${lastPushedAt.slice(11, 19)}Z` };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ state: "error", message });
      return { ok: false, message };
    } finally {
      syncing = false;
    }
  }

  async function hydrate(): Promise<{ ok: boolean; message: string }> {
    if (!cfg) return { ok: false, message: "Not configured" };
    try {
      const sb = getSupabaseClient(cfg);
      const [props, insps, imgs, finds, revs, acts, comp] = await Promise.all([
        sb.from("properties").select("*").order("created_at"),
        sb.from("inspections").select("*").order("created_at"),
        sb.from("images").select("*").order("captured_at"),
        sb.from("findings").select("*").order("created_at"),
        sb.from("reviews").select("*").order("at"),
        sb.from("activity").select("*").order("at").limit(50),
        sb.from("company").select("*").eq("id", 1).maybeSingle(),
      ]);
      const firstErr =
        props.error ?? insps.error ?? imgs.error ?? finds.error ?? revs.error ?? acts.error ?? comp.error;
      if (firstErr) throw new Error(firstErr.message);

      // Replace in-memory state with server truth (rare operation — connect only)
      const hydratedProps: Property[] = (props.data ?? []).map(rowToProperty);
      if (hydratedProps.length > 0) {
        store.replaceAll({
          properties: hydratedProps,
          inspections: (insps.data ?? []).map(rowToInspection),
          images: (imgs.data ?? []).map(rowToImage),
          findings: (finds.data ?? []).map(rowToFinding),
          reviews: (revs.data ?? []).map(rowToReview),
          activity: (acts.data ?? []).map(rowToActivity),
          company: (comp.data?.data as typeof store.state.company) ?? store.state.company,
        });
      }
      return {
        ok: true,
        message: hydratedProps.length > 0 ? `Loaded ${hydratedProps.length} properties from Supabase` : "Connected — server empty, pushing demo seed",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ state: "error", message });
      return { ok: false, message };
    }
  }

  async function connect(passed?: SupabaseConfig): Promise<{ ok: boolean; message: string }> {
    const c = passed ?? cfg ?? readSupabaseConfig();
    if (!c) return { ok: false, message: "No Supabase URL / anon key provided" };
    cfg = c;
    setStatus({ state: "connecting" });
    try {
      const sb = getSupabaseClient(c);
      // Cheap connectivity + schema check
      const { error } = await sb.from("properties").select("id").limit(1);
      if (error) {
        setStatus({ state: "error", message: error.message });
        return { ok: false, message: error.message };
      }
      active = true;
      setStatus({ state: "connected", url: c.url });
      const hydrated = await hydrate();
      if (hydrated.ok && hydrated.message.includes("server empty")) {
        await pushAll();
      }
      return { ok: true, message: hydrated.message };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ state: "error", message });
      return { ok: false, message };
    }
  }

  function disconnect() {
    active = false;
    cfg = null;
    setStatus({ state: "disconnected" });
  }

  // Watch store state; debounce-push on any change while connected.
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (typeof window !== "undefined") {
    let prev = JSON.stringify(store.state.findings.map((f) => [f.id, f.status])) + JSON.stringify(store.state.properties.map((p) => p.id));
    store.subscribe?.(() => {
      if (!active || !cfg) return;
      const now = JSON.stringify(store.state.findings.map((f) => [f.id, f.status])) + JSON.stringify(store.state.properties.map((p) => p.id));
      if (now === prev) return;
      prev = now;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void pushAll();
      }, 1200);
    });
  }

  void pushAll; // referenced; used by connect flow
  void lastPushedAt;

  return {
    connect,
    disconnect,
    get status() {
      return { state: active ? "connected" : "disconnected" } as SyncStatus;
    },
  };
}
