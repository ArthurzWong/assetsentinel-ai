"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase configuration resolution for the pilot backend.
 *
 * Order of precedence:
 *   1. Runtime config saved in localStorage (lets the demo enable Supabase
 *      without a rebuild — URL + anon key only, both are public values).
 *   2. Build-time NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.
 *
 * The anon key is designed to be public; real protection comes from RLS
 * policies. See supabase/schema.sql for the pilot-mode caveats.
 */

const LS_CONFIG_KEY = "assetsentinel-supabase-config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function readSupabaseConfig(): SupabaseConfig | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(LS_CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
        if (parsed.url && parsed.anonKey) {
          return { url: parsed.url, anonKey: parsed.anonKey };
        }
      }
    } catch {
      // fall through to env
    }
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anonKey) return { url, anonKey };
  return null;
}

export function writeSupabaseConfig(cfg: SupabaseConfig): void {
  window.localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearSupabaseConfig(): void {
  window.localStorage.removeItem(LS_CONFIG_KEY);
}

let cached: { key: string; client: SupabaseClient } | null = null;

export function getSupabaseClient(cfg: SupabaseConfig): SupabaseClient {
  const key = `${cfg.url}::${cfg.anonKey.slice(0, 12)}`;
  if (cached && cached.key === key) return cached.client;
  const client = createClient(cfg.url, cfg.anonKey, {
    auth: { persistSession: false },
  });
  cached = { key, client };
  return client;
}
