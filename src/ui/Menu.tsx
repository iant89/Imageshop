/**
 * macOS-style menu dropdown. Glass panel, shortcut hints right-aligned,
 * separators, submenus, checkmarks, disabled states, full keyboard nav.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Menu.module.css';
import { shortcutDisplay } from '@/state/shortcuts';

export interface MenuItemDef {
  id?: string;
  label?: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  separator?: boolean;
  submenu?: MenuItemDef[];
  action?: () => void;
  type?: 'separator';
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
  >
    <path d="M3 3l4 4M3 7l-4-4" />
  </svg>
);

interface MenuBaseProps {
  items: MenuItemDef[];
  x: number;
  y: number;
  onClose: () => void;
  className?: string;
}

export function Menu({ items, x, y, onClose, className }: MenuBaseProps) {
  const [submenu, setSubmenu] = useState<{ anchor: HTMLElement | null; items: MenuItemDef[]; x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSubmenu(null);
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const openAt = useCallback(
    (anchor: HTMLElement, itemItems: MenuItemDef[]) => {
      const rect = anchor.getBoundingClientRect();
      setSubmenu({ anchor, items: itemItems, x: rect.right + 6, y: rect.top });
    },
    []
  );

  return (
    <>
      <div
        className={cn(styles.menu, className)}
        style={{ left: x, top: y }}
        role="menu"
      >
        {items.map((item) => {
          if (item.separator) {
            return (
              <div key={item.id ?? `sep-${Math.random()}`} className={styles.separator} role="separator" aria-orientation="horizontal" />
            );
          }
          if (item.hidden) return null;
          const hasSub = Boolean(item.submenu?.length);
          const handleSelect = () => {
            if (item.action && !item.disabled) {
              item.action();
            }
            setSubmenu(null);
            onClose();
          };
          const itemRef = useRef<HTMLDivElement>(null);
          return (
            <div
              ref={itemRef}
              key={item.id ?? String(Math.random())}
              className={cn(styles.item, item.disabled && styles.disabled)}
              role="menuitem"
              aria-disabled={item.disabled ? true : undefined}
              aria-checked={item.checked ? true : undefined}
              onMouseEnter={() => hasSub && openAt(itemRef.current!, item.submenu!)}
              onMouseLeave={() => {}}
              onClick={handleSelect}
            >
              <span className={styles.label}>{item.label}</span>
              {item.checked && <span className={styles.check}>✓</span>}
              {hasSub && <ChevronRight className={styles.chevron} />}
              {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
            </div>
          );
        })}
      </div>
      {submenu && (
        <div
          className={cn(styles.menu, styles.submenu)}
          style={{ left: submenu.x, top: submenu.y }}
          role="menu"
          onMouseLeave={() => setSubmenu(null)}
        >
          {submenu.items.map((item) => {
            if (item.separator) {
              return (
                <div key={item.id ?? `sep-${Math.random()}`} className={styles.separator} role="separator" aria-orientation="horizontal" />
              );
            }
            if (item.hidden) return null;
            return (
              <div
                key={item.id ?? String(Math.random())}
                className={cn(styles.item, item.disabled && styles.disabled)}
                role="menuitem"
                aria-disabled={item.disabled ? true : undefined}
                onClick={() => {
                  if (item.action && !item.disabled) item.action();
                  setSubmenu(null);
                  onClose();
                }}
              >
                <span className={styles.label}>{item.label}</span>
                {item.checked && <span className={styles.check}>✓</span>}
                {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
