"use client";

import { useEffect, useState } from "react";
import { Check, Database, Loader2, PlugZap, Unplug } from "lucide-react";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input } from "@/components/ui";
import {
  clearSupabaseConfig,
  readSupabaseConfig,
  writeSupabaseConfig,
  type SupabaseConfig,
} from "@/lib/supabase";
import type { SyncStatus } from "@/lib/supabase-sync";

export interface SupabaseSettingsProps {
  onConnect: (cfg: SupabaseConfig) => Promise<{ ok: boolean; message: string }>;
  onDisconnect: () => void;
}

export function SupabaseSettingsPanel({ onConnect, onDisconnect }: SupabaseSettingsProps) {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [status, setStatus] = useState<SyncStatus>({ state: "disconnected" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [savedCfg, setSavedCfg] = useState<SupabaseConfig | null>(null);

  useEffect(() => {
    const existing = readSupabaseConfig();
    setSavedCfg(existing);
    if (existing) {
      setUrl(existing.url);
      setAnonKey(existing.anonKey);
    }
  }, []);

  async function connect() {
    setBusy(true);
    setResult(null);
    const cfg = { url: url.trim().replace(/\/$/, ""), anonKey: anonKey.trim() };
    if (!cfg.url.startsWith("https://") || cfg.anonKey.length < 20) {
      setResult({ ok: false, message: "URL must be https://….supabase.co and the anon key looks too short." });
      setBusy(false);
      return;
    }
    writeSupabaseConfig(cfg);
    const res = await onConnect(cfg);
    setResult(res);
    setBusy(false);
    if (res.ok) setSavedCfg(cfg);
  }

  function disconnect() {
    clearSupabaseConfig();
    setSavedCfg(null);
    setStatus({ state: "disconnected" });
    setResult(null);
    onDisconnect();
  }

  const connected = status.state === "connected";

  return (
    <Card>
      <CardHeader
        title="Supabase backend (pilot)"
        subtitle="Paste your project URL + anon key to enable cross-device persistence"
        action={<Database className="h-4 w-4 text-teal-600" aria-hidden />}
      />
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge
            className={
              connected
                ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                : status.state === "error"
                  ? "border-red-200 bg-red-100 text-red-700"
                  : "border-navy-200 bg-navy-50 text-navy-600"
            }
          >
            {status.state === "connected"
              ? "Connected"
              : status.state === "connecting"
                ? "Connecting…"
                : status.state === "error"
                  ? "Error"
                  : "Demo store only"}
          </Badge>
          {savedCfg ? (
            <span className="truncate text-xs text-navy-400">{savedCfg.url}</span>
          ) : (
            <span className="text-xs text-navy-400">Not configured — data lives in this browser</span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project URL">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
          <Field label="Anon public key">
            <Input
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOi…"
              autoComplete="off"
              spellCheck={false}
            />
          </Field>
        </div>

        <p className="text-xs leading-relaxed text-navy-500">
          The <strong>anon key is a public value</strong> — safe to paste here; protection comes from row-level
          security. Run <code className="rounded bg-navy-100 px-1">supabase/schema.sql</code> in the Supabase SQL
          Editor first. Pilot RLS is permissive by design; harden before real customer data.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          {connected ? (
            <Button variant="dangerOutline" onClick={disconnect}>
              <Unplug className="h-4 w-4" aria-hidden /> Disconnect
            </Button>
          ) : (
            <Button onClick={connect} disabled={busy || !url || !anonKey}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <PlugZap className="h-4 w-4" aria-hidden />
              )}
              {busy ? "Connecting…" : "Connect & sync"}
            </Button>
          )}
          {result ? (
            <span className={`inline-flex items-center gap-1.5 text-sm ${result.ok ? "text-emerald-600" : "text-red-600"}`}>
              {result.ok ? <Check className="h-4 w-4" aria-hidden /> : null}
              {result.message}
            </span>
          ) : null}
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-900">
          When connected: every create/review/publish action also persists to Supabase; the demo seed pushes once on
          first connect; session-only uploads (blob previews) still don't persist — use the storage-backed upload
          button in the inspection workspace.
        </div>
      </CardBody>
    </Card>
  );
}
