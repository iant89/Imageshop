/**
 * Brush engine primitives.
 *
 * - Soft/hard round stamp via radial gradient.
 * * Pointer-coalesced stroke interpolation (evenly spaced stamps).
 * * Pressure-driven size and opacity.
 *
 * The actual pixel write happens against a CanvasRenderingContext2D owned by
 * a LayerBuffer; the compositor uploads the result to the GPU on the next
 * frame. React never re-renders during a stroke.
 */

export interface BrushPoint {
  x: number;
  y: number;
  pressure: number; // 0..1
  timestamp: number;
}

export type BrushCtx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface BrushStampOptions {
  ctx: BrushCtx;
  x: number;
  y: number;
  radius: number;
  hardness: number; // 0..1
  opacity: number; // 0..1
  color: string; // #rrggbb
  composite?: string; // e.g. 'destination-out' for eraser
}

/** Draw a single round brush stamp at (x, y). */
export function brushStamp({
  ctx,
  x,
  y,
  radius,
  hardness,
  opacity,
  color,
  composite = 'source-over',
}: BrushStampOptions) {
  const innerRadius = radius * Math.max(0, 1 - hardness);
  const grad = ctx.createRadialGradient(x, y, innerRadius, x, y, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, colorWithAlpha(color, 0));

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.globalCompositeOperation = composite as CanvasRenderingContext2D['globalCompositeOperation'];
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function colorWithAlpha(hex: string, alpha: number): string {
  const m = hex.trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(m[1] ?? '0', 16);
  const g = parseInt(m[2] ?? '0', 16);
  const b = parseInt(m[3] ?? '0', 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Radius in px for a stamp given settings + pressure. */
export function brushRadius(settings: { size: number; pressureSize: boolean }, pressure: number): number {
  let r = settings.size / 2;
  if (settings.pressureSize) r *= 0.35 + 0.65 * pressure;
  return Math.max(1, r);
}

/** Opacity 0..1 for a stamp given settings + pressure. */
export function brushOpacity(
  settings: { opacity: number; pressureOpacity: boolean },
  pressure: number
): number {
  let o = settings.opacity;
  if (settings.pressureOpacity) o *= 0.35 + 0.65 * pressure;
  return Math.max(0, Math.min(1, o));
}

/** Spacing in px between stamps (fraction of diameter). */
export function brushSpacing(settings: { size: number; spacing: number }): number {
  return Math.max(1, settings.size * settings.spacing);
}

/**
 * Interpolate evenly spaced points between p0 and p1 so a fast pointer move
 * still produces a continuous stroke (spacing = brush diameter * spacing).
 */
export function interpolatePoints(
  p0: BrushPoint,
  p1: BrushPoint,
  spacingPx: number
): BrushPoint[] {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const dist = Math.hypot(dx, dy);
  const count = Math.max(1, Math.ceil(dist / Math.max(spacingPx, 0.1)));
  const out: BrushPoint[] = [];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    out.push({
      x: p0.x + dx * t,
      y: p0.y + dy * t,
      pressure: p0.pressure + (p1.pressure - p0.pressure) * t,
      timestamp: p1.timestamp,
    });
  }
  return out;
}
