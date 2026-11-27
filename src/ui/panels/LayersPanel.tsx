/**
 * Layers panel — layer stack with visibility, blend mode, opacity, lock,
 * color tag, add/delete/duplicate, and reorder.
 * Built with @enterprise-ui/react components.
 */

import React, { useCallback } from 'react';
import { useDocumentStore } from '@/state/document';
import type { Layer, BlendMode } from '@/core/document';
import {
  Panel,
  Button,
  IconButton,
  Slider,
  Select,
  Switch,
  Input,
} from '@enterprise-ui/react';
import { cn } from '@/utils/cn';
import styles from './LayersPanel.module.css';

const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'soft-light', label: 'Soft Light' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'difference', label: 'Difference' },
];

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
      transform: {
        translateX: 0,
        translateY: 0,
        scaleX: 1,
        scaleY: 1,
        rotate: 0,
        skewX: 0,
        skewY: 0,
      },
      width: doc.width,
      height: doc.height,
      tileKey: null,
    });
    setDocumentDirty(doc.id, true);
  }, [doc, addLayer, setDocumentDirty]);

  if (!doc) {
    return (
      <div className={cn(styles.panel, styles.empty)}>
        <div className={styles.emptyLabel}>No document open</div>
      </div>
    );
  }

  const layers: Layer[] = doc.layers;

  return (
    <div className={cn(styles.panel, styles.layersPanel)}>
      <div className={styles.header}>
        <span className={styles.title}>Layers</span>
        <Button
          variant="secondary"
          size="sm"
          icon="add"
          onClick={handleAdd}
          title="New layer"
        />
      </div>

      <div className={styles.list}>
        {layers.map((layer) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            active={layer.id === doc.activeLayerId}
            documentId={doc.id}
            layers={layers}
            onToggleVisibility={() => {
              setLayerVisibility(doc.id, layer.id, !layer.visible);
              setDocumentDirty(doc.id, true);
            }}
            setLayerOpacity={setLayerOpacity}
            setLayerBlendMode={setLayerBlendMode}
            setLayerLock={setLayerLock}
            setLayerName={setLayerName}
            deleteLayer={deleteLayer}
            duplicateLayer={duplicateLayer}
            moveLayer={moveLayer}
            setActiveLayer={setActiveLayer}
            setDocumentDirty={setDocumentDirty}
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
  layers: Layer[];
  onToggleVisibility: () => void;
  setLayerOpacity: (id: string, layerId: string, v: number) => void;
  setLayerBlendMode: (id: string, layerId: string, v: BlendMode) => void;
  setLayerLock: (
    id: string,
    layerId: string,
    v: 'none' | 'alpha' | 'position' | 'all'
  ) => void;
  setLayerName: (id: string, layerId: string, v: string) => void;
  deleteLayer: (id: string, layerId: string) => void;
  duplicateLayer: (id: string, layerId: string) => void;
  moveLayer: (id: string, layerId: string, newIndex: number) => void;
  setActiveLayer: (id: string, layerId: string) => void;
  setDocumentDirty: (id: string, dirty: boolean) => void;
}

function LayerRow({
  layer,
  active,
  documentId,
  layers,
  onToggleVisibility,
  setLayerOpacity,
  setLayerBlendMode,
  setLayerLock,
  setLayerName,
  deleteLayer,
  duplicateLayer,
  moveLayer,
  setActiveLayer,
  setDocumentDirty,
}: LayerRowProps) {
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(layer.name);

  const onSetOpacity = useCallback(
    (v: number) => {
      setLayerOpacity(documentId, layer.id, v);
      setDocumentDirty(documentId, true);
    },
    [documentId, layer.id, setLayerOpacity, setDocumentDirty]
  );

  const onSetBlend = useCallback(
    (v: BlendMode) => {
      setLayerBlendMode(documentId, layer.id, v);
      setDocumentDirty(documentId, true);
    },
    [documentId, layer.id, setLayerBlendMode, setDocumentDirty]
  );

  const onSetLock = useCallback(
    (v: 'none' | 'alpha' | 'position' | 'all') => {
      setLayerLock(documentId, layer.id, v);
      setDocumentDirty(documentId, true);
    },
    [documentId, layer.id, setLayerLock, setDocumentDirty]
  );

  const onSetName = useCallback(
    (v: string) => {
      setLayerName(documentId, layer.id, v);
      setDocumentDirty(documentId, true);
    },
    [documentId, layer.id, setLayerName, setDocumentDirty]
  );

  const onDelete = useCallback(() => {
    deleteLayer(documentId, layer.id);
    setDocumentDirty(documentId, true);
  }, [documentId, layer.id, deleteLayer, setDocumentDirty]);

  const onDuplicate = useCallback(() => {
    duplicateLayer(documentId, layer.id);
    setDocumentDirty(documentId, true);
  }, [documentId, layer.id, duplicateLayer, setDocumentDirty]);

  const onMoveUp = useCallback(() => {
    const idx = layers.findIndex((l) => l.id === layer.id);
    if (idx <= 0) return;
    moveLayer(documentId, layer.id, idx - 1);
    setDocumentDirty(documentId, true);
  }, [documentId, layer.id, layers, moveLayer, setDocumentDirty]);

  const onMoveDown = useCallback(() => {
    const idx = layers.findIndex((l) => l.id === layer.id);
    if (idx < 0 || idx >= layers.length - 1) return;
    moveLayer(documentId, layer.id, idx + 1);
    setDocumentDirty(documentId, true);
  }, [documentId, layer.id, layers, moveLayer, setDocumentDirty]);

  const onSetActive = useCallback(() => setActiveLayer(documentId, layer.id), [
    documentId,
    layer.id,
    setActiveLayer,
  ]);

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
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        title="Toggle visibility"
        aria-pressed={layer.visible}
      >
        {layer.visible ? '👁️' : '🙈'}
      </button>

      {/* Thumbnail placeholder */}
      <div className={styles.thumbWrap}>
        <div className={cn(styles.thumb, styles.thumbBg)} />
        {layer.colorTag && (
          <div className={cn(styles.tag, `tag-${layer.colorTag}`)} title={layer.colorTag} />
        )}
      </div>

      {/* Name */}
      {renaming ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            setRenaming(false);
            onSetName(name);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') {
              setRenaming(false);
              setName(layer.name);
            }
          }}
          autoFocus
          size="sm"
          hideLabel
        />
      ) : (
        <div
          className={styles.name}
          title={layer.name}
          onDoubleClick={() => {
            setRenaming(true);
            setName(layer.name);
          }}
        >
          {layer.name}
        </div>
      )}

      {/* Blend mode */}
      <div className={styles.blendSelectWrap}>
        <Select
          value={layer.blendMode}
          onChange={(v) => onSetBlend(v as BlendMode)}
          options={BLEND_MODES.map((m) => ({ value: m.value, label: m.label }))}
          size="sm"
        />
      </div>

      {/* Opacity */}
      <div className={styles.opacityWrap}>
        <span className={styles.opacityLabel}>{Math.round(layer.opacity * 100)}%</span>
        <div className={styles.opacitySliderWrap}>
          <Slider
            value={layer.opacity * 100}
            onChange={(v) => onSetOpacity(v as number)}
            min={0}
            max={100}
            step={1}
            showValue
            formatValue={(v) => `${Math.round(v)}%`}
          />
        </div>
      </div>

      {/* Lock */}
      <div className={cn(styles.lockWrap, layer.lock !== 'none' && styles.locked)}>
        <button
          className={cn(styles.lockBtn, layer.lock === 'all' && styles.lockActive)}
          title="Lock all"
          onClick={(e) => {
            e.stopPropagation();
            onSetLock(layer.lock === 'all' ? 'none' : 'all');
          }}
        >
          🔒
        </button>
        <button
          className={cn(styles.lockBtn, layer.lock === 'alpha' && styles.lockActive)}
          title="Lock alpha"
          onClick={(e) => {
            e.stopPropagation();
            onSetLock(layer.lock === 'alpha' ? 'none' : 'alpha');
          }}
        >
          🅰
        </button>
      </div>

      {/* Reorder */}
      <div className={styles.reorder}>
        <button className={styles.reorderBtn} onClick={onMoveUp} title="Move up">
          ▲
        </button>
        <button className={styles.reorderBtn} onClick={onMoveDown} title="Move down">
          ▼
        </button>
      </div>

      <button className={cn(styles.iconBtn, styles.btnDup)} onClick={onDuplicate} title="Duplicate layer">
        📋
      </button>
      <button className={cn(styles.iconBtn, styles.btnDel)} onClick={onDelete} title="Delete layer">
        🗑️
      </button>
    </div>
  );
}