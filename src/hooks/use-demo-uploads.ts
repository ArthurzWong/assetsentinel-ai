"use client";

import { useCallback, useState } from "react";

/**
 * Demo-mode upload handling.
 *
 * Phase 1 has no backend: uploaded files are read in the browser and kept as
 * object URLs, which live only for the current page session and are NOT
 * persisted anywhere. The UI must always explain this to the user — we must
 * not simulate real persistence.
 */
export interface DemoUpload {
  id: string;
  fileName: string;
  objectUrl: string;
  addedAt: string;
}

export function useDemoUploads() {
  const [uploads, setUploads] = useState<DemoUpload[]>([]);

  const ingestFiles = useCallback((files: FileList | null): DemoUpload[] => {
    if (!files || files.length === 0) return [];
    const accepted: DemoUpload[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      accepted.push({
        id: `up_${Math.random().toString(36).slice(2, 10)}`,
        fileName: file.name,
        objectUrl: URL.createObjectURL(file),
        addedAt: new Date().toISOString(),
      });
    }
    setUploads((prev) => [...prev, ...accepted]);
    return accepted;
  }, []);

  const clear = useCallback(() => {
    setUploads((prev) => {
      for (const u of prev) URL.revokeObjectURL(u.objectUrl);
      return [];
    });
  }, []);

  return { uploads, ingestFiles, clear };
}
