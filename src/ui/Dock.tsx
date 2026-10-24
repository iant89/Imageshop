/**
 * Liquid Glass Dock at the bottom of the desktop:
 * glass shelf, magnification-on-hover, layered app icons,
 * running indicators, minimize/restore bounce.
 */

import React, { useCallback, useRef, useState } from 'react';
import { useAppStore } from '@/state/app';
import { GlassSurface } from './GlassSurface';
import styles from './Dock.module.css';

interface DockApp {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const DOCK_APPS: DockApp[] = [
  { id: 'finder', label: 'Finder', icon: <DockIcon kind="finder" /> },
  { id: 'imageshop', label: 'Imageshop', icon: <DockIcon kind="imageshop" /> },
  { id: 'safari', label: 'Safari', icon: <DockIcon kind="safari" /> },
  { id: 'mail', label: 'Mail', icon: <DockIcon kind="mail" /> },
  { id: 'photos', label: 'Photos', icon: <DockIcon kind="photos" /> },
];

const MAGNIFIED_SIZE = 96;
const NORMAL_SIZE = 68;

export function Dock() {
  const { dockItems, setDockBusy } = useAppStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const byId = useMemoById(dockItems);

  return (
    <div className={styles.dock} onMouseLeave={() => setHovered(null)}>
      <GlassSurface variant="dock" elevation="high" style={{ width: '100%', height: '100%' }} />
      <div className={styles.items}>
        {DOCK_APPS.map((app) => {
          const item = byId[app.id];
          const running = item?.running ?? false;
          const busy = item?.busy ?? false;
          const active = hovered === app.id;
          const size = active ? MAGNIFIED_SIZE : NORMAL_SIZE;
          return (
            <div
              key={app.id}
              className={cn(styles.item, running && styles.running, busy && styles.busy, active && styles.hovered)}
              onMouseEnter={() => setHovered(app.id)}
              onClick={() => {
                if (app.id === 'imageshop') {
                  setDockBusy('imageshop', true);
                  setTimeout(() => setDockBusy('imageshop', false), 1000);
                }
              }}
            >
              <div className={styles.iconWrap} style={{ width: size, height: size }}>
                {app.icon}
              </div>
              <span className={styles.label}>{app.label}</span>
              {running && <div className={styles.indicator} />}
              {busy && <div className={styles.badge} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function useMemoById(items: any[]) {
  const map: Record<string, any> = {};
  for (const it of items) map[it.id] = it;
  return map;
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

function DockIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'finder':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <path d="M4 6h14v12H4z" />
          <path d="M4 10h4M8 10h4M12 10h4" />
        </svg>
      );
    case 'imageshop':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6">
          <rect width="14" height="14" x="4" y="4" rx="3" />
          <path d="M8 8l6 6M14 8l-6 6" />
        </svg>
      );
    case 'safari':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <path d="M4 4c4 4 10 4 14 0s-4-10-8-6-6 6-6 6" />
          <path d="M9 12l2 2M11 12l2-2" />
        </svg>
      );
    case 'mail':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <rect width="14" height="10" x="4" y="6" rx="2" />
          <path d="M4 11l7 3 7-3" />
        </svg>
      );
    case 'photos':
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">
          <rect width="14" height="10" x="4" y="6" rx="2" />
          <circle cx="11" cy="11" r="3" />
          <path d="M7 7l4 4M15 7l-4 4" />
        </svg>
      );
    default:
      return <span style={{ fontSize: 14 }}>{kind}</span>;
  }
}
