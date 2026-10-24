/**
 * Card — a clean, modern content container with subtle border and shadow.
 * Replaces the macOS Window (no traffic lights, no title-bar dragging).
 */

import React, { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  onClose?: () => void;
  padded?: boolean;
}

export function Card({ children, className, title, onClose, padded = true }: CardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {title && (
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>{title}</span>
          {onClose && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      )}
      <div className={`${styles.cardContent} ${padded ? styles.padded : ''}`}>{children}</div>
    </div>
  );
}