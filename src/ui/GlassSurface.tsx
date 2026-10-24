/**
 * GlassSurface — macOS Tahoe Liquid Glass primitive.
 *
 * Anatomy (from back to front):
 *   1. Refraction layer — SVG feDisplacementMap lensing over the tinted layer
 *   2. Blur + saturation via backdrop-filter, translucent tint above
 *   3. Specular sheen — top-edge highlight + pointer-tracking directional sheen
 *   4. Rim light — 1px inner top highlight + outer hairline border
 *   5. Soft layered shadow (box-shadow on the host element)
 *
 * Variants: toolbar | panel | menu | dock | menubar
 * Glass is for the control layer only — children render in an opaque surface
 * so glass never sits on glass.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './GlassSurface.module.css';
import { cn } from '@/utils/cn';

export type GlassVariant = 'toolbar' | 'panel' | 'menu' | 'dock' | 'menubar';

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  children?: React.ReactNode;
  plain?: boolean;
  trackPointer?: boolean;
  elevation?: 'low' | 'medium' | 'high';
  className?: string;
}

const DISPLACEMENT_FILTER_ID = 'imageshop-displacement';

export function ensureDisplacementFilter() {
  if (typeof document === 'undefined' || document.getElementById(DISPLACEMENT_FILTER_ID)) {
    return;
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('id', DISPLACEMENT_FILTER_ID);
  svg.innerHTML = `
    <filter id="${DISPLACEMENT_FILTER_ID}" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  `;
  document.documentElement.appendChild(svg);
}

const SHADOW_BY_ELEVATION: Record<string, string> = {
  low: '0 8px 24px -10px rgba(0,0,0,0.22)',
  medium: '0 18px 48px -14px rgba(0,0,0,0.34)',
  high: '0 28px 72px -18px rgba(0,0,0,0.5)',
};

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  variant = 'panel',
  children,
  plain = false,
  trackPointer = false,
  elevation = 'medium',
  className,
  ...props
}) => {
  ensureDisplacementFilter();

  const ref = useRef<HTMLDivElement>(null);
  const [sheen, setSheen] = useState({ x: 50, visible: false });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackPointer || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setSheen({ x, visible: true });
    },
    [trackPointer]
  );

  const handleLeave = useCallback(() => setSheen((s) => ({ ...s, visible: false })), []);

  return (
    <div
      ref={ref}
      className={cn(styles.glass, `glass--${variant}`, plain && styles.plain, className)}
      style={{ boxShadow: SHADOW_BY_ELEVATION[elevation], ...props.style }}
      onMouseMove={trackPointer ? handleMove : undefined}
      onMouseLeave={trackPointer ? handleLeave : undefined}
      {...props}
    >
      <div className={styles.bg} />
      {!plain && <div className={styles.refract} />}
      <div className={styles.tint} />
      <div className={styles.sheen} />
      {trackPointer && (
        <div
          className={styles.sheenPointer}
          style={{
            left: `${sheen.x}%`,
            opacity: sheen.visible ? 1 : 0,
            transform: 'translate(-50%, -60%)',
          }}
        />
      )}
      <div className={styles.rim} />
      <div className={styles.content} onMouseMove={trackPointer ? handleMove : undefined} onMouseLeave={trackPointer ? handleLeave : undefined}>
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
