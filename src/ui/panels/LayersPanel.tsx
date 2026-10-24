/**
 * Layers panel — layer stack with visibility, blend mode, opacity, lock,
 * color tag, add/delete/duplicate, and reorder.
 *
 * Rows are rendered flat here; nested groups + drag-and-drop reorder arrive
 * in a later milestone (the store already supports parentId / moveLayer).
 * The list is small enough to render directly; a virtualization hook point is
 * marked for the 20+-layer case (see core/tiles.ts budget).
 */

import React, { useCallback } from 'react';
import { useDocumentStore } from '@/state/document';
import type { Layer, BlendMode } from '@/core/document';
import { EyeIcon, EyeOffIcon, PlusIcon, TrashIcon, LayersIcon } from '@/design/icons';
import { cn } from '@/utils/cn';
import styles from './LayersPanel.module.css';

export function LayersPanel() {
  const {
    getActiveDocument,
    addLayer,
    deleteLayer,
    duplicateLayer,
    moveLayer,
    setLayerOpacity,
    setLayerBlendMode,
    setLayerVisibility,
    setLayerLock,
    setActiveLayer,
    setLayerName,
    setDocumentDirty,
  } = useDocumentStore();

  const doc = getActiveDocument();

  const handleAdd = useCallback(() => {
    if (!doc) return;
    addLayer(doc.id, {
      parentId: null,
      kind: 'image',
      name: 'Layer ' + (doc.layers.length + 1),
      visible: true,
      opacity: 1,
      blendMode: 'normal',
      lock: 'none',
      effects: [],
      transform: { translateX: 0, translateY: 0, scaleX: 1, scaleY: 1, rotate: 0, skewX: 0, skewY: 0 },
      width: doc.width,
      height: doc.height,
      tileKey: null,
    });
    setDocumentDirty(doc.id, true);
  }, [doc, addLayer, setDocumentDirty]);

  if (!doc) {
    return (
      <div className={cn(styles.panel, styles.empty)}>
        <LayersIcon size={14} />
        <div className={styles.emptyLabel}>No document open</div>
      </div>
    );
  }

  const layers: Layer[] = doc.layers;

  return (
    <div className={cn(styles.panel, styles.layersPanel)}>
      <div className={styles.header}>
        <LayersIcon size={13} />
        <span className={styles.title}>Layers</span>
        <button className={cn(styles.iconBtn, styles.btnAdd)} onClick={handleAdd} title="New layer">
          <PlusIcon size={12} />
        </button>
      </div>

      <div className={styles.list}>
        {/* Virtualization hook point: replace this map with a virtualized
            renderer when layer counts exceed ~50. */}
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            active={layer.id === doc.activeLayerId}
            documentId={doc.id}
            onToggleVisibility={() => {
              setLayerVisibility(doc.id, layer.id, !layer.visible);
              setDocumentDirty(doc.id, true);
            }}
            onSetOpacity={useCallback(
              (v: number) => {
                setLayerOpacity(doc.id, layer.id, v);
                setDocumentDirty(doc.id, true);
              },
              [doc.id, layer.id, setLayerOpacity, setDocumentDirty]
            )}
            onSetBlend={useCallback(
              (v: BlendMode) => {
                setLayerBlendMode(doc.id, layer.id, v);
                setDocumentDirty(doc.id, true);
              },
              [doc.id, layer.id, setLayerBlendMode, setDocumentDirty]
            )}
            onSetLock={useCallback(
              (v: 'none' | 'alpha' | 'position' | 'all') => {
                setLayerLock(doc.id, layer.id, v);
                setDocumentDirty(doc.id, true);
              },
              [doc.id, layer.id, setLayerLock, setDocumentDirty]
            )}
            onSetName={useCallback(
              (v: string) => {
                setLayerName(doc.id, layer.id, v);
                setDocumentDirty(doc.id, true);
              },
              [doc.id, layer.id, setLayerName, setDocumentDirty]
            )}
            onDelete={() => {
              deleteLayer(doc.id, layer.id);
              setDocumentDirty(doc.id, true);
            }}
            onDuplicate={() => {
              duplicateLayer(doc.id, layer.id);
              setDocumentDirty(doc.id, true);
            }}
            onMoveUp={() => {
              const idx = layers.findIndex((l) => l.id === layer.id);
              if (idx <= 0) return;
              moveLayer(doc.id, layer.id, idx - 1);
              setDocumentDirty(doc.id, true);
            }}
            onMoveDown={() => {
              const idx = layers.findIndex((l) => l.id === layer.id);
              if (idx < 0 || idx >= layers.length - 1) return;
              moveLayer(doc.id, layer.id, idx + 1);
              setDocumentDirty(doc.id, true);
            }}
            onSetActive={() => setActiveLayer(doc.id, layer.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface LayerRowProps {
  layer: Layer;
  active: boolean;
  documentId: string;
  onToggleVisibility: () => void;
  onSetOpacity: (v: number) => void;
  onSetBlend: (v: BlendMode) => void;
  onSetLock: (v: 'none' | 'alpha' | 'position' | 'all') => void;
  onSetName: (v: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetActive: () => void;
}

function LayerRow({
  layer,
  active,
  documentId,
  onToggleVisibility,
  onSetOpacity,
  onSetBlend,
  onSetLock,
  onSetName,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onSetActive,
}: LayerRowProps) {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(layer.name);

  const blendLabel = (m: BlendMode): string => {
    switch (m) {
      case 'normal': return 'Normal';
      case 'multiply': return 'Multiply';
      case 'screen': return 'Screen';
      case 'overlay': return 'Overlay';
      case 'soft-light': return 'Soft Light';
      case 'hard-light': return 'Hard Light';
      case 'color-dodge': return 'Color Dodge';
      case 'color-burn': return 'Color Burn';
      case 'linear-dodge': return 'Linear Dodge';
      case 'linear-burn': return 'Linear Burn';
      case 'vivid-light': return 'Vivid Light';
      case 'pin-light': return 'Pin Light';
      case 'hard-mix': return 'Hard Mix';
      case 'difference': return 'Difference';
      case 'exclusion': return 'Exclusion';
      case 'hue': return 'Hue';
      case 'saturation': return 'Saturation';
      case 'color': return 'Color';
      case 'luminosity': return 'Luminosity';
      case 'dissolve': return 'Dissolve';
    }
    return 'Normal';
  };

  return (
    <div
      className={cn(styles.row, active && styles.rowActive)}
      onClick={onSetActive}
      role="listitem"
      aria-label={layer.name}
      aria-checked={layer.visible ? 'true' : 'false'}
    >
      {/* Visibility */}
      <button
        className={cn(styles.iconBtn, !layer.visible && styles.hidden)}
        onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
        title="Toggle visibility"
        aria-pressed={layer.visible}
      >
        {layer.visible ? <EyeIcon size={11} /> : <EyeOffIcon size={11} />}
      </button>

      {/* Thumbnail placeholder — live off-thread thumbnails arrive with the
          tile-cache preview pipeline (Milestone 5/perf). */}
      <div className={styles.thumbWrap}>
        <div className={cn(styles.thumb, styles.thumbBg)} />
        {layer.colorTag && (
          <div className={cn(styles.tag, `tag-${layer.colorTag}`)} title={layer.colorTag} />
        )}
      </div>

      {/* Name */}
      {renaming ? (
        <input
          className={styles.nameInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { setRenaming(false); onSetName(name); }}
          onKeyDown={(e) => {
            const t = e.target as HTMLInputElement;
            if (e.key === 'Enter') t.blur();
            if (e.key === 'Escape') { setRenaming(false); setName(layer.name); }
          }}
          autoFocus
        />
      ) : (
        <div
          className={styles.name}
          title={layer.name}
          onDoubleClick={() => { setRenaming(true); setName(layer.name); }}
        >
          {layer.name}
        </div>
      )}

      {/* Blend mode */}
      <select
        className={styles.blendSelect}
        value={layer.blendMode}
        onChange={(e) => onSetBlend(e.target.value as BlendMode)}
        title="Blend mode"
      >
        {['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference'].map((m) => (
          <option key={m} value={m}>{blendLabel(m as BlendMode)}</option>
        ))}
      </select>

      {/* Opacity */}
      <div className={styles.opacityWrap}>
        <span className={styles.opacityLabel}>{Math.round(layer.opacity * 100)}%</span>
        <input
          className={styles.opacitySlider}
          type="range"
          min="0"
          max="100"
          value={Math.round(layer.opacity * 100)}
          onChange={(e) => onSetOpacity(parseInt(e.target.value, 10) / 100)}
        />
      </div>

      {/* Lock */}
      <div className={cn(styles.lockWrap, layer.lock !== 'none' && styles.locked)}>
        <button
          className={cn(styles.lockBtn, layer.lock === 'all' && styles.lockActive)}
          title="Lock all"
          onClick={(e) => { e.stopPropagation(); onSetLock(layer.lock === 'all' ? 'none' : 'all'); }}
        >
          {'🔒'}
        </button>
        <button
          className={cn(styles.lockBtn, layer.lock === 'alpha' && styles.lockActive)}
          title="Lock alpha"
          onClick={(e) => { e.stopPropagation(); onSetLock(layer.lock === 'alpha' ? 'none' : 'alpha'); }}
        >
          {'🅰'}
        </button>
      </div>

      {/* Reorder */}
      <div className={styles.reorder}>
        <button className={styles.reorderBtn} onClick={onMoveUp} title="Move up">
          <svg className={styles.reorderIcon} viewBox="0 0 10 10"><path d="M5 2l-3 3 3 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>
        </button>
        <button className={styles.reorderBtn} onClick={onMoveDown} title="Move down">
          <svg className={styles.reorderIcon} viewBox="0 0 10 10"><path d="M5 8l-3-3 3-3" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" /></svg>
        </button>
      </div>

      <button className={cn(styles.iconBtn, styles.btnDup)} onClick={onDuplicate} title="Duplicate layer">
        <svg className={styles.dupIcon} viewBox="0 0 10 10"><rect width="7" height="7" x="1.5" y="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" /><path d="M1.5 1.5h3v3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.2" /></svg>
      </button>
      <button className={cn(styles.iconBtn, styles.btnDel)} onClick={onDelete} title="Delete layer">
        <TrashIcon size={10} />
      </button>
    </div>
  );
}
