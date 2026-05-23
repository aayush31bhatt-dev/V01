import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

// --- Circuit Trace Background ---

interface CircuitTraceProps {
  viewportX: MotionValue<number>;
  viewportY: MotionValue<number>;
}

function generateTraces(width: number, height: number): Array<{ points: [number, number][] }> {
  const traces: Array<{ points: [number, number][] }> = [];
  const gridSnap = 40;

  for (let i = 0; i < 22; i++) {
    const segCount = 2 + Math.floor(Math.random() * 4);
    const startX = Math.round((Math.random() * width) / gridSnap) * gridSnap;
    const startY = Math.round((Math.random() * height) / gridSnap) * gridSnap;
    const points: [number, number][] = [[startX, startY]];

    let cx = startX;
    let cy = startY;
    let horizontal = Math.random() > 0.5;

    for (let s = 0; s < segCount; s++) {
      const length = (1 + Math.floor(Math.random() * 5)) * gridSnap;
      if (horizontal) {
        cx += (Math.random() > 0.5 ? 1 : -1) * length;
      } else {
        cy += (Math.random() > 0.5 ? 1 : -1) * length;
      }
      points.push([cx, cy]);
      horizontal = !horizontal;
    }

    traces.push({ points });
  }

  return traces;
}

function drawCircuitCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#0a0c10";
  ctx.fillRect(0, 0, w, h);

  const traces = generateTraces(w, h);

  ctx.strokeStyle = "rgba(83,74,183,0.35)";
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  for (const trace of traces) {
    const first = trace.points[0]!;
    ctx.beginPath();
    ctx.moveTo(first[0], first[1]);
    for (let i = 1; i < trace.points.length; i++) {
      const pt = trace.points[i]!;
      ctx.lineTo(pt[0], pt[1]);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(127,119,221,0.5)";
    for (const [px, py] of trace.points) {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function CircuitTraceBackground({ viewportX, viewportY }: CircuitTraceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawCircuitCanvas(canvas);

    const observer = new ResizeObserver(() => drawCircuitCanvas(canvas));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}

// --- Topographic Background ---

interface TopographicProps {
  viewportX: MotionValue<number>;
  viewportY: MotionValue<number>;
}

function noiseField(x: number, y: number): number {
  return Math.sin(x * 4) * Math.cos(y * 2.8) + Math.sin(x * 5.2 + 1) * Math.cos(y * 3.6);
}

function drawTopoCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#0c0e0f";
  ctx.fillRect(0, 0, w, h);

  const step = 4;
  const cols = Math.ceil(w / step) + 1;
  const rows = Math.ceil(h / step) + 1;

  const field = new Float64Array(rows * cols);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const nx = (c * step) / w;
      const ny = (r * step) / h;
      field[r * cols + c] = noiseField(nx * 10, ny * 10);
    }
  }

  const levels = 8;
  ctx.lineWidth = 1;

  for (let level = 0; level < levels; level++) {
    const threshold = -1 + (2 / (levels - 1)) * level;
    const alpha = 0.06 + level * 0.025;
    ctx.strokeStyle = `rgba(29,158,117,${alpha})`;
    ctx.beginPath();

    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const x = c * step;
        const y = r * step;
        const tl = field[r * cols + c]!;
        const tr = field[r * cols + c + 1]!;
        const bl = field[(r + 1) * cols + c]!;
        const br = field[(r + 1) * cols + c + 1]!;

        const top = (tl >= threshold) !== (tr >= threshold);
        const left = (tl >= threshold) !== (bl >= threshold);
        const bottom = (bl >= threshold) !== (br >= threshold);
        const right = (tr >= threshold) !== (br >= threshold);

        if (top) {
          const t = (threshold - tl) / (tr - tl);
          const px = x + t * step;
          if (left) {
            const t2 = (threshold - tl) / (bl - tl);
            ctx.moveTo(px, y);
            ctx.lineTo(x, y + t2 * step);
          } else if (right) {
            const t2 = (threshold - tr) / (br - tr);
            ctx.moveTo(px, y);
            ctx.lineTo(x + step, y + t2 * step);
          } else if (bottom) {
            const t2 = (threshold - bl) / (br - bl);
            ctx.moveTo(px, y);
            ctx.lineTo(x + t2 * step, y + step);
          }
        } else if (left) {
          const t = (threshold - tl) / (bl - tl);
          if (right) {
            const t2 = (threshold - tr) / (br - tr);
            ctx.moveTo(x, y + t * step);
            ctx.lineTo(x + step, y + t2 * step);
          } else if (bottom) {
            const t2 = (threshold - bl) / (br - bl);
            ctx.moveTo(x, y + t * step);
            ctx.lineTo(x + t2 * step, y + step);
          }
        } else if (right && bottom) {
          const t = (threshold - tr) / (br - tr);
          const t2 = (threshold - bl) / (br - bl);
          ctx.moveTo(x + step, y + t * step);
          ctx.lineTo(x + t2 * step, y + step);
        }
      }
    }

    ctx.stroke();
  }
}

export function TopographicBackground({ viewportX, viewportY }: TopographicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawTopoCanvas(canvas);

    const observer = new ResizeObserver(() => drawTopoCanvas(canvas));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
    />
  );
}

// --- Mini Canvas Previews for Settings ---

export function DotGridPreview() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#0e1110]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(244,241,232,0.18) 0.7px, transparent 1px)",
          backgroundSize: "8px 8px"
        }}
      />
    </div>
  );
}

export function CircuitTracePreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0a0c10";
    ctx.fillRect(0, 0, w, h);

    const gridSnap = 10;
    ctx.lineCap = "round";

    for (let i = 0; i < 8; i++) {
      const segCount = 2 + Math.floor(Math.random() * 3);
      const startX = Math.round((Math.random() * w) / gridSnap) * gridSnap;
      const startY = Math.round((Math.random() * h) / gridSnap) * gridSnap;

      ctx.strokeStyle = "rgba(83,74,183,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      let px = startX;
      let py = startY;
      let horiz = Math.random() > 0.5;
      for (let s = 0; s < segCount; s++) {
        const len = (1 + Math.floor(Math.random() * 3)) * gridSnap;
        if (horiz) px += (Math.random() > 0.5 ? 1 : -1) * len;
        else py += (Math.random() > 0.5 ? 1 : -1) * len;
        ctx.lineTo(px, py);
        horiz = !horiz;
      }
      ctx.stroke();

      ctx.fillStyle = "rgba(127,119,221,0.55)";
      ctx.beginPath();
      ctx.arc(startX, startY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full rounded-lg" />
  );
}

export function TopographicPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0c0e0f";
    ctx.fillRect(0, 0, w, h);

    const step = 3;
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;
    const field = new Float64Array(rows * cols);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const nx = (c * step) / w * 10;
        const ny = (r * step) / h * 10;
        field[r * cols + c] = Math.sin(nx * 4) * Math.cos(ny * 2.8) + Math.sin(nx * 5.2 + 1) * Math.cos(ny * 3.6);
      }
    }

    const levels = 6;
    ctx.lineWidth = 0.8;
    for (let level = 0; level < levels; level++) {
      const threshold = -1 + (2 / (levels - 1)) * level;
      const alpha = 0.06 + level * 0.02;
      ctx.strokeStyle = `rgba(29,158,117,${alpha})`;
      ctx.beginPath();
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const x = c * step;
          const y = r * step;
          const tl = field[r * cols + c]!;
          const tr = field[r * cols + c + 1]!;
          const bl = field[(r + 1) * cols + c]!;
          const br = field[(r + 1) * cols + c + 1]!;
          const top = (tl >= threshold) !== (tr >= threshold);
          const left = (tl >= threshold) !== (bl >= threshold);
          const bottom = (bl >= threshold) !== (br >= threshold);
          const right = (tr >= threshold) !== (br >= threshold);

          if (top && left) {
            ctx.moveTo(x + ((threshold - tl) / (tr - tl)) * step, y);
            ctx.lineTo(x, y + ((threshold - tl) / (bl - tl)) * step);
          } else if (top && right) {
            ctx.moveTo(x + ((threshold - tl) / (tr - tl)) * step, y);
            ctx.lineTo(x + step, y + ((threshold - tr) / (br - tr)) * step);
          } else if (top && bottom) {
            ctx.moveTo(x + ((threshold - tl) / (tr - tl)) * step, y);
            ctx.lineTo(x + ((threshold - bl) / (br - bl)) * step, y + step);
          } else if (left && right) {
            ctx.moveTo(x, y + ((threshold - tl) / (bl - tl)) * step);
            ctx.lineTo(x + step, y + ((threshold - tr) / (br - tr)) * step);
          } else if (left && bottom) {
            ctx.moveTo(x, y + ((threshold - tl) / (bl - tl)) * step);
            ctx.lineTo(x + ((threshold - bl) / (br - bl)) * step, y + step);
          } else if (right && bottom) {
            ctx.moveTo(x + step, y + ((threshold - tr) / (br - tr)) * step);
            ctx.lineTo(x + ((threshold - bl) / (br - bl)) * step, y + step);
          }
        }
      }
      ctx.stroke();
    }
  }, []);

  return (
    <canvas ref={canvasRef} className="h-full w-full rounded-lg" />
  );
}
