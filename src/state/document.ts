/**
 * Document store slice — documents, layers, and history.
 *
 * Document metadata lives here; pixel buffers live in the tiled tile cache
 * (core/tiles.ts). Every mutating action pushes an inverse command onto the
 * history stack so undo/redo is structural and coherent.
 *
 * Usage:
 *   const useDocumentStore = create<DocumentState & DocumentActions>()(
 *     documentSlice
 *   );
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  Document,
  Layer,
  BlendMode,
  LockFlags,
  ColorMode,
  Transform,
} from '@/core/document';
import {
  createDocument,
  getLayer,
} from '@/core/document';
import { HistoryManager } from '@/core/history';

export interface DocumentActions {
  // Document lifecycle
  createDocument: (
    title: string,
    width: number,
    height: number,
    dpi?: number,
    colorMode?: ColorMode
  ) => string;
  setActiveDocument: (id: string | null) => void;
  closeDocument: (id: string) => void;
  setDocumentSize: (id: string, width: number, height: number) => void;
  setDocumentDirty: (id: string, dirty: boolean) => void;

  // Layers
  addLayer: (
    documentId: string,
    layer: Omit<Layer, 'id'>,
    index?: number
  ) => string;
  deleteLayer: (documentId: string, layerId: string) => void;
  duplicateLayer: (documentId: string, layerId: string) => string;
  moveLayer: (documentId: string, layerId: string, newIndex: number) => void;
  setLayerOpacity: (documentId: string, layerId: string, opacity: number) => void;
  setLayerBlendMode: (documentId: string, layerId: string, blendMode: BlendMode) => void;
  setLayerVisibility: (documentId: string, layerId: string, visible: boolean) => void;
  setLayerLock: (documentId: string, layerId: string, lock: LockFlags) => void;
  setLayerName: (documentId: string, layerId: string, name: string) => void;
  setLayerTransform: (
    documentId: string,
    layerId: string,
    transform: Partial<Transform>
  ) => void;
  addLayerEffect: (
    documentId: string,
    layerId: string,
    effect: Layer['effects'][number]
  ) => void;
  toggleLayerEffect: (documentId: string, layerId: string, effectId: string) => void;
  setActiveLayer: (documentId: string, layerId: string | null) => void;

  // Accessors
  getDocument: (id: string) => Document | undefined;
  getActiveDocument: () => Document | undefined;
  getActiveLayer: (documentId: string) => Layer | undefined;
}

export interface DocumentState {
  documents: Map<string, Document>;
  activeDocumentId: string | null;
  history: HistoryManager;
}

export type DocumentStore = DocumentState & DocumentActions;

export const documentSlice = (
  set: (fn: (s: DocumentStore) => void) => void,
  get: () => DocumentStore
): DocumentState & DocumentActions => {
  const history = new HistoryManager({ maxEntries: 100 });

  return {
    documents: new Map(),
    activeDocumentId: null,
    history,

    createDocument: (title, width, height, dpi = 72, colorMode = 'RGB') => {
      const id = `doc-${crypto.randomUUID()}`;
      const doc = createDocument(id, title, width, height, dpi, colorMode);
      set((s) => {
        s.documents.set(id, doc);
        if (s.activeDocumentId === null) s.activeDocumentId = id;
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'New Document',
        do: () => {
          set((s) => {
            s.documents.set(id, doc);
            if (s.activeDocumentId === null) s.activeDocumentId = id;
          });
        },
        undo: () => {
          set((s) => {
            s.documents.delete(id);
            if (s.activeDocumentId === id) s.activeDocumentId = null;
          });
        },
      });
      return id;
    },

    setActiveDocument: (id) => {
      set((s) => {
        s.activeDocumentId = id;
      });
    },

    closeDocument: (id) => {
      const doc = get().documents.get(id);
      set((s) => {
        s.documents.delete(id);
        if (s.activeDocumentId === id) {
          const remaining = Array.from(s.documents.keys());
          s.activeDocumentId = remaining.length ? (remaining[0] ?? null) : null;
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Close Document',
        do: () => {
          set((s) => {
            s.documents.delete(id);
            if (s.activeDocumentId === id) {
            const remaining = Array.from(s.documents.keys());
            s.activeDocumentId = remaining.length ? (remaining[0] ?? null) : null;
            }
          });
        },
        undo: () => {
          if (doc) {
            set((s) => {
              s.documents.set(id, doc);
              if (s.activeDocumentId === null) s.activeDocumentId = id;
            });
          }
        },
      });
    },

    setDocumentSize: (id, width, height) => {
      const doc = get().documents.get(id);
      if (!doc) return;
      const prevW = doc.width;
      const prevH = doc.height;
      set((s) => {
        const d = s.documents.get(id);
        if (d) {
          d.width = width;
          d.height = height;
          d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Canvas Size',
        do: () => {
          set((s) => {
            const d = s.documents.get(id);
            if (d) { d.width = width; d.height = height; d.updatedAt = Date.now(); }
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(id);
            if (d) { d.width = prevW; d.height = prevH; d.updatedAt = Date.now(); }
          });
        },
      });
    },

    setDocumentDirty: (id, dirty) => {
      set((s) => {
        const d = s.documents.get(id);
        if (d) d.dirty = dirty;
      });
    },

    // ---------- Layers ----------

    addLayer: (documentId, layer, index) => {
      const doc = get().documents.get(documentId);
      if (!doc) return '';
      const id = `layer-${crypto.randomUUID()}`;
      const newLayer: Layer = { ...layer, id };
      const prevLayers = [...doc.layers];
      const insertIndex = index == null ? prevLayers.length : Math.min(index, prevLayers.length);
      const nextLayers = [...prevLayers];
      nextLayers.splice(insertIndex, 0, newLayer);

      set((s) => {
        const d = s.documents.get(documentId);
        if (d) {
          d.layers = nextLayers;
          d.activeLayerId = newLayer.id;
          d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'New Layer',
        do: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = nextLayers;
              d.activeLayerId = newLayer.id;
              d.updatedAt = Date.now();
            }
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = prevLayers;
              d.activeLayerId = doc.activeLayerId;
              d.updatedAt = Date.now();
            }
          });
        },
      });
      return id;
    },

    deleteLayer: (documentId, layerId) => {
      const doc = get().documents.get(documentId);
      const layer = doc?.layers.find((l) => l.id === layerId);
      if (!doc || !layer) return;
      const prevLayers = [...doc.layers];
      const prevActive = doc.activeLayerId;
      const layerIndex = prevLayers.findIndex((l) => l.id === layerId);
      const nextLayers = prevLayers.filter((l) => l.id !== layerId);
      // Pick a new active layer.
      let newActive: string | null = null;
      if (nextLayers.length) {
        const idx = Math.min(layerIndex, nextLayers.length - 1);
        const nxt = nextLayers[idx];
        if (!nxt) return;
        newActive = nxt.id;
      }

      set((s) => {
        const d = s.documents.get(documentId);
        if (d) {
          d.layers = nextLayers;
          d.activeLayerId = newActive;
          d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Delete Layer',
        do: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = nextLayers;
              d.activeLayerId = newActive;
              d.updatedAt = Date.now();
            }
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = prevLayers;
              d.activeLayerId = prevActive;
              d.updatedAt = Date.now();
            }
          });
        },
      });
    },

    duplicateLayer: (documentId, layerId) => {
      const doc = get().documents.get(documentId);
      const layer = doc?.layers.find((l) => l.id === layerId);
      if (!doc || !layer) return '';
      const id = `layer-${crypto.randomUUID()}`;
      const copy: Layer = { ...layer, id, name: `${layer.name} copy`, tileKey: null };
      const insertAt = doc.layers.findIndex((l) => l.id === layerId) + 1;
      const prevLayers = [...doc.layers];
      const nextLayers = [...prevLayers];
      nextLayers.splice(insertAt, 0, copy);

      set((s) => {
        const d = s.documents.get(documentId);
        if (d) {
          d.layers = nextLayers;
          d.activeLayerId = id;
          d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Duplicate Layer',
        do: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = nextLayers;
              d.activeLayerId = id;
              d.updatedAt = Date.now();
            }
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) {
              d.layers = prevLayers;
              d.activeLayerId = doc.activeLayerId;
              d.updatedAt = Date.now();
            }
          });
        },
      });
      return id;
    },

    moveLayer: (documentId, layerId, newIndex) => {
      const doc = get().documents.get(documentId);
      if (!doc) return;
      const prevLayers = [...doc.layers];
      const layerIndex = prevLayers.findIndex((l) => l.id === layerId);
      if (layerIndex === -1) return;
      const [moved] = prevLayers.splice(layerIndex, 1);
      if (!moved) return;
      newIndex = Math.min(Math.max(newIndex, 0), prevLayers.length - 1);
      prevLayers.splice(newIndex, 0, moved);
      set((s) => {
        const d = s.documents.get(documentId);
        if (d) d.layers = prevLayers;
        d!.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Move Layer',
        do: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) d.layers = prevLayers;
            d!.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) d.layers = doc.layers;
            d!.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerOpacity: (documentId, layerId, opacity) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer) return;
      const prev = layer.opacity;
      const next = Math.min(1, Math.max(0, opacity));
      if (prev === next) return;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) l.opacity = next;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Layer Opacity',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.opacity = next;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.opacity = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerBlendMode: (documentId, layerId, blendMode) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer || layer.blendMode === blendMode) return;
      const prev = layer.blendMode;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) l.blendMode = blendMode;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Blend Mode',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.blendMode = blendMode;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.blendMode = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerVisibility: (documentId, layerId, visible) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer || layer.visible === visible) return;
      const prev = layer.visible;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) l.visible = visible;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Layer Visibility',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.visible = visible;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.visible = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerLock: (documentId, layerId, lock) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer || layer.lock === lock) return;
      const prev = layer.lock;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) l.lock = lock;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Layer Lock',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.lock = lock;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.lock = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerName: (documentId, layerId, name) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer || layer.name === name) return;
      const prev = layer.name;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) l.name = name;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Rename Layer',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.name = name;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) l.name = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setLayerTransform: (documentId, layerId, transform) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer) return;
      const prev = { ...layer.transform };
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) {
          Object.assign(l.transform, transform);
          const d = s.documents.get(documentId);
          if (d) d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Transform Layer',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) {
              Object.assign(l.transform, transform);
              const d = s.documents.get(documentId);
              if (d) d.updatedAt = Date.now();
            }
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) {
              l.transform = prev;
              const d = s.documents.get(documentId);
              if (d) d.updatedAt = Date.now();
            }
          });
        },
      });
    },

    addLayerEffect: (documentId, layerId, effect) => {
      const layer = getLayerOp(get(), documentId, layerId);
      if (!layer) return;
      const prev = layer.effects;
      const next = [...prev, effect];
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        if (l) {
          l.effects = next;
          const d = s.documents.get(documentId);
          if (d) d.updatedAt = Date.now();
        }
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Add Layer Effect',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) {
              l.effects = next;
              const d = s.documents.get(documentId);
              if (d) d.updatedAt = Date.now();
            }
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            if (l) {
              l.effects = prev;
              const d = s.documents.get(documentId);
              if (d) d.updatedAt = Date.now();
            }
          });
        },
      });
    },

    toggleLayerEffect: (documentId, layerId, effectId) => {
      const layer = getLayerOp(get(), documentId, layerId);
      const fx = layer?.effects.find((e) => e.id === effectId);
      if (!layer || !fx) return;
      const prev = fx.enabled;
      set((s) => {
        const l = getLayerOp(s, documentId, layerId);
        const f = l?.effects.find((e) => e.id === effectId);
        if (f) f.enabled = !prev;
        const d = s.documents.get(documentId);
        if (d) d.updatedAt = Date.now();
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Toggle Layer Effect',
        do: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            const f = l?.effects.find((e) => e.id === effectId);
            if (f) f.enabled = !prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
        undo: () => {
          set((s) => {
            const l = getLayerOp(s, documentId, layerId);
            const f = l?.effects.find((e) => e.id === effectId);
            if (f) f.enabled = prev;
            const d = s.documents.get(documentId);
            if (d) d.updatedAt = Date.now();
          });
        },
      });
    },

    setActiveLayer: (documentId, layerId) => {
      const doc = get().documents.get(documentId);
      if (!doc) return;
      const prev = doc.activeLayerId;
      if (prev === layerId) return;
      set((s) => {
        const d = s.documents.get(documentId);
        if (d) d.activeLayerId = layerId;
      });
      history.push({
        id: `hist-${crypto.randomUUID()}`,
        label: 'Set Active Layer',
        do: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) d.activeLayerId = layerId;
          });
        },
        undo: () => {
          set((s) => {
            const d = s.documents.get(documentId);
            if (d) d.activeLayerId = prev;
          });
        },
      });
    },

    // ---------- Accessors ----------

    getDocument: (id) => get().documents.get(id),

    getActiveDocument: () => {
      const id = get().activeDocumentId;
      return id ? get().documents.get(id) : undefined;
    },

    getActiveLayer: (documentId) => {
      const doc = get().documents.get(documentId);
      if (!doc || !doc.activeLayerId) return undefined;
      return doc.layers.find((l) => l.id === doc.activeLayerId);
    },
  };
};

/** Read a layer from a (possibly draft) store without immer typing friction. */
function getLayerOp(
  s: { documents: Map<string, Document> },
  documentId: string,
  layerId: string
): Layer | undefined {
  return s.documents.get(documentId)?.layers.find((l) => l.id === layerId);
}

export const useDocumentStore = create<DocumentStore>()(immer(documentSlice));
