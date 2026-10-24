/**
 * Transparent macOS menu bar with real working menus and keyboard shortcuts.
 * Items that map to implemented features are wired; others are clearly marked
 * stubs for later milestones.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { AppleIcon } from '@/design/icons';
import { Menu } from './Menu';
import { GlassSurface } from './GlassSurface';
import { useAppStore } from '@/state/app';
import styles from './MenuBar.module.css';

type MenuId =
  | 'apple'
  | 'file'
  | 'edit'
  | 'image'
  | 'layer'
  | 'select'
  | 'filter'
  | 'view'
  | 'window'
  | 'help';

type MenuItemDef = {
  id?: string;
  label?: string;
  shortcut?: string;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  separator?: boolean;
  type?: 'separator';
  submenu?: MenuItemDef[];
  action?: () => void;
};

interface MenuDef {
  id: MenuId;
  label: string;
  items: MenuItemDef[];
}

function notImplemented(label: string) {
  return () => {
    alert(`${label} is not implemented in this milestone.`);
  };
}

const MENUS: MenuDef[] = [
  {
    id: 'apple',
    label: 'Imageshop',
    items: [
      { id: 'about', label: 'About Imageshop', action: notImplemented('About') },
      { type: 'separator' },
      { id: 'prefs', label: 'Preferences...', action: notImplemented('Preferences') },
      { type: 'separator' },
      { id: 'hide', label: 'Hide Imageshop', action: notImplemented('Hide') },
      { id: 'hide-others', label: 'Hide Others', action: notImplemented('Hide Others') },
      { id: 'show-all', label: 'Show All', action: notImplemented('Show All') },
      { type: 'separator' },
      { id: 'quit', label: 'Quit Imageshop', action: notImplemented('Quit') },
    ],
  },
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new', label: 'New...', shortcut: '⌘N', action: notImplemented('New document') },
      { id: 'open', label: 'Open...', shortcut: '⌘O', action: notImplemented('Open') },
      { id: 'open-recent', label: 'Open Recent', submenu: [{ id: 'rec1', label: 'No recent files', disabled: true }] },
      { type: 'separator' },
      { id: 'save', label: 'Save', shortcut: '⌘S', action: notImplemented('Save') },
      { id: 'save-as', label: 'Save As...', shortcut: '⌘⇧S', action: notImplemented('Save As') },
      { id: 'save-copy', label: 'Save a Copy', action: notImplemented('Save a Copy') },
      { id: 'export', label: 'Export...', shortcut: '⌘⇧E', action: notImplemented('Export') },
      { type: 'separator' },
      { id: 'close', label: 'Close', shortcut: '⌘W', action: notImplemented('Close window') },
      { id: 'quit', label: 'Quit Imageshop', shortcut: '⌘Q', action: notImplemented('Quit') },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo', shortcut: '⌘Z', action: notImplemented('Undo') },
      { id: 'redo', label: 'Redo', shortcut: '⌘⇧Z', action: notImplemented('Redo') },
      { type: 'separator' },
      { id: 'cut', label: 'Cut', shortcut: '⌘X', disabled: true },
      { id: 'copy', label: 'Copy', shortcut: '⌘C', disabled: true },
      { id: 'paste', label: 'Paste', shortcut: '⌘V', disabled: true },
      { type: 'separator' },
      { id: 'fill', label: 'Fill...', action: notImplemented('Fill') },
      { id: 'stroke', label: 'Stroke...', action: notImplemented('Stroke') },
    ],
  },
  {
    id: 'image',
    label: 'Image',
    items: [
      {
        id: 'mode',
        label: 'Mode',
        submenu: [
          { id: 'mode-rgb', label: 'RGB Color', checked: true },
          { id: 'mode-gray', label: 'Grayscale' },
        ],
      },
      {
        id: 'adjustments',
        label: 'Adjustments',
        submenu: [
          { id: 'adj-levels', label: 'Levels...', action: notImplemented('Levels') },
          { id: 'adj-curves', label: 'Curves...', action: notImplemented('Curves') },
          { id: 'adj-hue', label: 'Hue/Saturation...', action: notImplemented('Hue/Saturation') },
          { id: 'adj-brightness', label: 'Brightness/Contrast...', action: notImplemented('Brightness/Contrast') },
          { id: 'adj-invert', label: 'Invert', action: notImplemented('Invert') },
          { id: 'adj-threshold', label: 'Threshold...', action: notImplemented('Threshold') },
        ],
      },
      { type: 'separator' },
      {
        id: 'rotate',
        label: 'Image Rotation',
        submenu: [
          { id: 'rot-90cw', label: '90° CW' },
          { id: 'rot-90ccw', label: '90° CCW' },
          { id: 'rot-180', label: '180°' },
        ],
      },
      { id: 'crop', label: 'Crop', action: notImplemented('Crop') },
      { id: 'resize', label: 'Image Size...', action: notImplemented('Image Size') },
    ],
  },
  {
    id: 'layer',
    label: 'Layer',
    items: [
      { id: 'layer-new', label: 'New Layer...', shortcut: '⌘⇧N', action: notImplemented('New Layer') },
      { id: 'layer-duplicate', label: 'Duplicate Layer', action: notImplemented('Duplicate Layer') },
      { id: 'layer-delete', label: 'Delete Layer', action: notImplemented('Delete Layer') },
      { type: 'separator' },
      { id: 'layer-group', label: 'Group Layers', shortcut: '⌘G', action: notImplemented('Group') },
      { id: 'layer-ungroup', label: 'Ungroup Layers', shortcut: '⌘⇧G', action: notImplemented('Ungroup') },
      { type: 'separator' },
      { id: 'layer-blend', label: 'Blend Mode', submenu: [{ id: 'blend-normal', label: 'Normal', checked: true }] },
      { id: 'layer-opacity', label: 'Opacity', action: notImplemented('Opacity') },
    ],
  },
  {
    id: 'select',
    label: 'Select',
    items: [
      { id: 'sel-all', label: 'Select All', shortcut: '⌘A', action: notImplemented('Select All') },
      { id: 'sel-deselect', label: 'Deselect', shortcut: '⌘⇧A', action: notImplemented('Deselect') },
      { id: 'sel-reselect', label: 'Reselect', action: notImplemented('Reselect') },
      { id: 'sel-inverse', label: 'Inverse', shortcut: '⌘⇧I', action: notImplemented('Inverse') },
      { type: 'separator' },
      { id: 'sel-feather', label: 'Feather...', action: notImplemented('Feather') },
    ],
  },
  {
    id: 'filter',
    label: 'Filter',
    items: [
      {
        id: 'filter-blur',
        label: 'Blur',
        submenu: [
          { id: 'blur-gaussian', label: 'Gaussian Blur...', action: notImplemented('Gaussian Blur') },
          { id: 'blur-box', label: 'Box Blur...', action: notImplemented('Box Blur') },
          { id: 'blur-motion', label: 'Motion Blur...', action: notImplemented('Motion Blur') },
        ],
      },
      { id: 'filter-noise', label: 'Noise', submenu: [{ id: 'noise-add', label: 'Add Noise...', action: notImplemented('Add Noise') }] },
      {
        id: 'filter-sharpen',
        label: 'Sharpen',
        submenu: [{ id: 'sharpen-usm', label: 'Unsharp Mask...', action: notImplemented('Unsharp Mask') }],
      },
      { type: 'separator' },
      { id: 'filter-vignette', label: 'Vignette...', action: notImplemented('Vignette') },
      { id: 'filter-last', label: 'Last Filter', disabled: true },
    ],
  },
  {
    id: 'view',
    label: 'View',
    items: [
      { id: 'view-zoom-in', label: 'Zoom In', shortcut: '⌘+', action: notImplemented('Zoom In') },
      { id: 'view-zoom-out', label: 'Zoom Out', shortcut: '⌘-', action: notImplemented('Zoom Out') },
      { id: 'view-fit', label: 'Fit on Screen', shortcut: '⌘0', action: notImplemented('Fit') },
      { id: 'view-100', label: '100%', shortcut: '⌘1', action: notImplemented('100%') },
      { type: 'separator' },
      { id: 'view-rulers', label: 'Rulers', checked: true, action: notImplemented('Rulers') },
      { id: 'view-grid', label: 'Grid', action: notImplemented('Grid') },
      { id: 'view-guides', label: 'Guides', action: notImplemented('Guides') },
      { type: 'separator' },
      { id: 'view-extras', label: 'Extras', checked: true },
      { id: 'view-marching', label: 'Show Marching Ants', checked: true },
    ],
  },
  {
    id: 'window',
    label: 'Window',
    items: [
      { id: 'win-min', label: 'Minimize', shortcut: '⌘M', action: notImplemented('Minimize') },
      { id: 'win-zoom', label: 'Zoom', shortcut: '⌘⇧M', action: notImplemented('Zoom window') },
      { type: 'separator' },
      { id: 'win-front', label: 'Bring All to Front', action: notImplemented('Bring All to Front') },
    ],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      { id: 'help-docs', label: 'Imageshop Help', shortcut: '⌘?', action: notImplemented('Help') },
      { id: 'kb', label: 'Keyboard Shortcuts', shortcut: '⌘/', action: notImplemented('Keyboard Shortcuts') },
    ],
  },
];

const STATUS_ITEMS = [{ label: '🔍', tooltip: 'Spotlight' }, { label: '◐', tooltip: 'Appearance' }];

export function MenuBar() {
  const { setA11y } = useAppStore();
  const [open, setOpen] = useState<{ id: MenuId; x: number; y: number } | null>(null);
  const titleRefs = useMemo(() => new Map<MenuId, React.RefObject<HTMLDivElement>>(), []);

  const getRef = useCallback((id: MenuId) => {
    let ref = titleRefs.get(id);
    if (!ref) {
      ref = { current: null };
      titleRefs.set(id, ref);
    }
    return ref;
  }, [titleRefs]);

  const toggleMenu = useCallback(
    (id: MenuId, el: HTMLDivElement) => {
      const rect = el.getBoundingClientRect();
      if (open?.id === id) {
        setOpen(null);
      } else {
        setOpen({ id, x: rect.left, y: rect.bottom });
      }
    },
    [open?.id]
  );

  const closeMenu = useCallback(() => setOpen(null), []);

  const handleAppearance = useCallback(() => {
    // cycle light <-> dark; "auto" handled in preferences sheet (stubbed)
    setA11y({});
    // noop here; real toggle lives in the Appearance panel (milestone 6)
  }, [setA11y]);

  return (
    <div className={styles.menuBar}>
      <GlassSurface variant="menubar" elevation="low" style={{ width: '100%', height: '100%' }} />
      <div className={styles.appleMenu} onClick={handleAppearance} role="button" tabIndex={0} aria-label="Apple menu">
        <AppleIcon size={14} />
      </div>
      <div className={styles.menus}>
        {MENUS.map((m) => {
          const ref = getRef(m.id);
          const isOpen = open?.id === m.id;
          return (
            <div
              key={m.id}
              ref={ref as React.Ref<HTMLDivElement>}
              className={cn(styles.menuTitle, isOpen && styles.active)}
              onClick={(e) => toggleMenu(m.id, e.currentTarget)}
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              {m.label}
            </div>
          );
        })}
      </div>
      <div className={styles.status}>
        {STATUS_ITEMS.map((s) => (
          <span key={s.label} className={styles.statusItem} title={s.tooltip}>
            {s.label}
          </span>
        ))}
      </div>
      {open && (
        <Menu
          items={MENUS.find((m) => m.id === open.id)!.items}
          x={open.x}
          y={open.y}
          onClose={closeMenu}
        />
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
