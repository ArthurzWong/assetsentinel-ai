"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import {
  attachSupabaseSync,
  type SupabaseSyncApi,
  type SyncStatus,
} from "@/lib/supabase-sync";
import { readSupabaseConfig, type SupabaseConfig } from "@/lib/supabase";

interface SyncContextValue {
  sync: SupabaseSyncApi | null;
  status: SyncStatus;
  connect: (cfg: SupabaseConfig) => Promise<{ ok: boolean; message: string }>;
  disconnect: () => void;
  isConfigured: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  sync: null,
  status: { state: "disconnected" },
  connect: async () => ({ ok: false, message: "not ready" }),
  disconnect: () => {},
  isConfigured: false,
});

export function SupabaseSyncProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [status, setStatus] = useState<SyncStatus>({ state: "disconnected" });
  const [configured, setConfigured] = useState(false);
  const syncRef = useRef<SupabaseSyncApi | null>(null);
  const storeRef = useRef(store);
  storeRef.current = store;

  // Create the syncer once, pointing at the latest store instance.
  useEffect(() => {
    if (!syncRef.current) {
      syncRef.current = attachSupabaseSync(
        {
          ...storeRef.current,
          // always operate on the freshest store handle
          get state() {
            return storeRef.current.state;
          },
        } as typeof storeRef.current,
        (s) => setStatus(s)
      );
      setConfigured(!!readSupabaseConfig());
    }
  }, []);

  const value = useMemo<SyncContextValue>(
    () => ({
      sync: syncRef.current,
      status,
      connect: async (cfg) => {
        if (!syncRef.current) return { ok: false, message: "sync not initialised" };
        const res = await syncRef.current.connect(cfg);
        setConfigured(true);
        return res;
      },
      disconnect: () => {
        syncRef.current?.disconnect();
        setConfigured(false);
      },
      isConfigured: configured,
    }),
    [status, configured]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSupabaseSync(): SyncContextValue {
  return useContext(SyncContext);
}
