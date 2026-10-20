"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KImage, Layer, Stage, Text } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { Severity } from "@/lib/types";
import type { Annotation } from "@/lib/types";
import { SEVERITY_FILL } from "@/lib/severity";

function useHtmlImage(src: string): HTMLImageElement | undefined {
  const [img, setImg] = useState<HTMLImageElement | undefined>();
  useEffect(() => {
    const el = new window.Image();
    el.crossOrigin = "anonymous";
    el.onload = () => setImg(el);
    el.src = src;
    return () => {
      el.onload = null;
    };
  }, [src]);
  return img;
}

export interface AnnotationCanvasProps {
  src: string;
  annotations: Annotation[];
  armed?: boolean;
  onAdd?: (xPercent: number, yPercent: number) => void;
  onSelect?: (annotationId: string) => void;
  maxHeight?: number;
}

/**
 * Click-to-place annotation canvas over an inspection photo.
 * Coordinates are stored as percentages of the image so they survive resizing.
 * Rendered with react-konva; must be dynamically imported with ssr:false.
 */
export default function AnnotationCanvas({
  src,
  annotations,
  armed = false,
  onAdd,
  onSelect,
  maxHeight = 480,
}: AnnotationCanvasProps) {
  const img = useHtmlImage(src);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [wrapWidth, setWrapWidth] = useState(640);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setWrapWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dims = useMemo(() => {
    const iw = img?.width ?? 1200;
    const ih = img?.height ?? 800;
    const w = Math.max(280, Math.min(wrapWidth, 900));
    const h = Math.round((w * ih) / iw);
    const capped = h > maxHeight ? maxHeight : h;
    return { w, h: capped, scale: capped / h === 1 ? w / iw : capped / ((w * ih) / iw) };
  }, [img, wrapWidth, maxHeight]);

  if (!img) {
    return (
      <div ref={wrapRef} className="flex h-64 items-center justify-center rounded-lg border border-navy-100 bg-navy-50 text-xs text-navy-400">
        Loading image…
      </div>
    );
  }

  const naturalW = img.width;
  const naturalH = img.height;
  const targetW = Math.max(280, Math.min(wrapWidth, 900));
  let h = Math.round((targetW * naturalH) / naturalW);
  let w = targetW;
  if (h > maxHeight) {
    h = maxHeight;
    w = Math.round((h * naturalW) / naturalH);
  }

  function handleClick(e: KonvaEventObject<MouseEvent>) {
    if (!armed || !onAdd) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const xPct = Math.min(100, Math.max(0, (pos.x / w) * 100));
    const yPct = Math.min(100, Math.max(0, (pos.y / h) * 100));
    onAdd(Math.round(xPct * 10) / 10, Math.round(yPct * 10) / 10);
  }

  return (
    <div ref={wrapRef} className="w-full">
      <Stage width={w} height={h} onClick={handleClick} style={{ cursor: armed ? "crosshair" : "default", borderRadius: 8 }}>
        <Layer>
          <KImage image={img} width={w} height={h} />
          {annotations.map((a) => (
            <Group
              key={a.id}
              x={(a.x / 100) * w}
              y={(a.y / 100) * h}
              onClick={() => onSelect?.(a.id)}
              onTap={() => onSelect?.(a.id)}
            >
              <Circle
                radius={11}
                fill={SEVERITY_FILL[a.severity] ?? "#334155"}
                stroke="white"
                strokeWidth={2.5}
                shadowColor="#131e30"
                shadowBlur={6}
                shadowOpacity={0.45}
              />
              <Text
                text={String(annotations.indexOf(a) + 1)}
                x={-5}
                y={-5.5}
                width={10}
                height={10}
                fontSize={9}
                fontStyle="bold"
                fill="white"
                align="center"
                listening={false}
              />
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
