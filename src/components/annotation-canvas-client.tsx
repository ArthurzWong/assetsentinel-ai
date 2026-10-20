"use client";

import dynamic from "next/dynamic";
import type { AnnotationCanvasProps } from "./annotation-canvas";

// konva touches `window` at import time — load strictly client-side.
const AnnotationCanvas = dynamic(() => import("./annotation-canvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 text-xs text-navy-400">
      Loading annotation canvas…
    </div>
  ),
});

export function AnnotationCanvasClient(props: AnnotationCanvasProps) {
  return <AnnotationCanvas {...props} />;
}
