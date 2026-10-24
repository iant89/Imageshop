/**
 * Surface — a clean, modern container surface with subtle border and shadow.
 * Replaces the macOS Liquid Glass primitive (no blur, refraction, or sheen).
 */

import React, { ReactNode } from 'react';
import styles from './Surface.module.css';

export type SurfaceVariant = 'default' | 'elevated';

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  children?: ReactNode;
  className?: string;
}

export function Surface({ variant = 'default', children, className, ...props }: SurfaceProps) {
  return (
    <div
      className={`${styles.surface} ${styles[`surface--${variant}`]} ${className || ''}`}
      {...props}
    >
      {children}
    </div>
  );
}