"use client";

import { useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";
import { getSupabaseClient, readSupabaseConfig } from "@/lib/supabase";

export interface StorageUploadButtonProps {
  inspectionId: string;
  disabled?: boolean;
  onUploaded: (image: {
    id: string;
    fileName: string;
    publicUrl: string;
    storagePath: string;
    width?: number;
    height?: number;
  }) => void;
}

/**
 * Uploads an image to the Supabase Storage `inspection-images` bucket and
 * reports the public URL back. Only rendered when Supabase is configured —
 * otherwise the workspace shows the session-only demo upload flow.
 */
export function StorageUploadButton({ inspectionId, disabled, onUploaded }: StorageUploadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputId = `storage-upload-${inspectionId}`;

  async function handleFiles(files: FileList | null) {
    setError("");
    if (!files || files.length === 0) return;
    const cfg = readSupabaseConfig();
    if (!cfg) {
      setError("Supabase is not connected — configure it in Settings first.");
      return;
    }
    setBusy(true);
    try {
      const sb = getSupabaseClient(cfg);
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `${inspectionId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await sb.storage
          .from("inspection-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) throw upErr;
        const { data } = sb.storage.from("inspection-images").getPublicUrl(path);
        const url = data.publicUrl;
        // Read natural dimensions for the record
        const dims = await new Promise<{ width?: number; height?: number }>((resolve) => {
          const el = new window.Image();
          el.onload = () => resolve({ width: el.naturalWidth, height: el.naturalHeight });
          el.onerror = () => resolve({});
          el.src = url;
        });
        onUploaded({
          id: `img_${Math.random().toString(36).slice(2, 10)}`,
          fileName: file.name,
          publicUrl: url,
          storagePath: path,
          width: dims.width,
          height: dims.height,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
        disabled={disabled || busy}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => document.getElementById(inputId)?.click()}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-teal-300 bg-teal-50 px-3 text-xs font-medium text-teal-800 hover:bg-teal-100 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <CloudUpload className="h-3.5 w-3.5" aria-hidden />}
        {busy ? "Uploading…" : "Upload to Supabase Storage"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
