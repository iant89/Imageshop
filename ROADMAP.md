# Imageshop — Roadmap & Progress

macOS Tahoe-style online image editor (React 18 + TypeScript + Vite + Zustand + WebGL2).

**Branch:** `arena/b6fb3a24-imageshop`  
**Status:** Milestones 1–4 complete (shell, document model, GPU compositor, layers panel, brush engine). 
**Tech:** React 18, TypeScript strict, Zustand + Immer, WebGL2 (Canvas2D fallback not yet wired), Vite, Vitest.

---

## Completed

### Milestone 1 — App shell + Liquid Glass material system ✅
- `src/design/theme.ts` — Appearance manager (light/dark/auto, localStorage, system preference), a11y preference helpers (reduce transparency / contrast / motion).
- `src/design/icons.tsx` — SF Symbols-style inline SVG icon set (~1.5px stroke).
- `src/ui/GlassSurface.tsx` + `.module.css` — Reusable `<GlassSurface variant="toolbar|panel|menu|dock|menubar">` primitive with:
  - Refraction/lensing via SVG `feDisplacementMap` + `feTurbulence`
  - `backdrop-filter: blur() saturate()` tint layer
  - Specular top-edge sheen + pointer-tracking directional sheen
  - Rim light (inner top hairline + outer border)
  - Soft shadow via elevation prop
  - `reduce-transparency` / `increase-contrast` CSS fallbacks
- `src/ui/MenuBar.tsx` + `src/ui/Menu.tsx` — Transparent menu bar with Apple menu + File/Edit/Image/Layer/Select/Filter/View/Window/Help menus, shortcut hints, submenus, checkmarks, disabled states. Unimplemented items clearly flagged.
- `src/ui/Dock.tsx` — Glass dock shelf, magnification-on-hover, layered icons, running indicators, busy/bounce badge.
- `src/ui/Window.tsx` + `src/ui/useWindowManager.ts` — Document windows with traffic lights, draggable title bar, double-click zoom, 8-direction resize, minimize/restore, dirty close-sheet, focus/z-order. `useWindowManager` hook.
- `src/ui/Desktop.tsx` — Wallpaper (tinted gradient + noise), window container, Cmd+Tab-ish cycling stub.
- `src/state/app.ts` — Zustand+Immer app shell store (windows, panels, dock, appearance, a11y), persisted to localStorage, synced to DOM classes.
- `src/state/shortcuts.ts` — Centralized shortcut manager with `eventMatches` / `shortcutDisplay`, Mac-aware modifier mapping.
- CSS design tokens (`src/index.css`) — macOS color scale, glass blur levels, radii, motion easing, z-index stack.

### Milestone 2 — Document model, history, WebGL tiled compositor ✅
- `src/core/document.ts` — Document/Layer/Transform/Selection model, 21 blend modes (Normal…Luminosity), layer effects, lock flags, color tags.
- `src/core/blendModes.ts` — BlendModeEnum mirrored between TS and GLSL; fallback mapping for not-yet-implemented modes.
- `src/core/tiles.ts` — 256x256 tile cache, LRU eviction, `rectToTiles`/`pointToTile`, memory-byte estimation (~1.5 GB budget knob).
- `src/core/layerBuffer.ts` — Tile-backed OffscreenCanvas layer buffer (offscreen canvas is the source of truth).
- `src/core/history.ts` — Command/transaction undo-redo with coalescing (begin/endTransaction), 100-entry cap, past/future snapshots for the history panel.
- `src/state/document.ts` — Zustand+Immer document slice (`useDocumentStore`): documents, layers (add/delete/duplicate/move/reorder, opacity, blend mode, visibility, lock, name, transform, effects), active layer, dirty tracking, every mutation pushes an inverse command to history.
- `src/render/glContext.ts` — WebGL2 context + blend shader program + fullscreen quad.
- `src/render/compositor.ts` — GPU compositor: ping-pong framebuffers, layer textures, per-layer blend-mode shaders (normal/multiply/screen/overlay/soft-light/hard-light/color-dodge/burn/darken/lighten/difference/exclusion), presents to an OffscreenCanvas.
- `src/ui/CanvasEditor.tsx` — React canvas that owns a Compositor + per-layer LayerBuffers, composites on GPU, presents each frame. React does NOT re-render on paint; refs hold buffers/compositor.

### Milestone 3 — Layers panel ✅
- `src/ui/panels/LayersPanel.tsx` — Virtualization-ready layer list: visibility toggle, thumbnail placeholder, inline rename, blend-mode dropdown, opacity slider, lock (all/alpha), color tag, add/delete/duplicate, up/down reorder. Every row action is a store action + history entry.
- `src/ui/panels/ToolsPanel.tsx` — Tool selector (brush/eraser) + brush settings sliders (size, hardness, opacity, spacing) + pressure toggles + color swatch, wired to `useToolsStore`.
- `src/ui/PanelWindow.tsx` + `src/ui/panels/index.ts` — Floating panel host; panel registry maps panelId → component (tools, layers; others placeholder).
- `src/ui/Desktop.tsx` — Now renders floating panel windows (positioned from saved floatingFrame) alongside document windows.
- `src/state/tools.ts` — New store slice: activeTool + BrushSettings (size, hardness, opacity, flow, spacing, color, pressureSize, pressureOpacity).

### Milestone 4 — Brush engine ✅ (simplified)
- `src/tools/brush.ts` — Soft/hard round stamp via radial gradient, pressure-driven size & opacity, pointer-coalesced stroke interpolation (evenly spaced stamps), eraser via `destination-out` composite.
- `src/ui/CanvasEditor.tsx` — Full brush flow: pointerdown/move/up with `getCoalescedEvents()`, per-stamp tile-level copy-on-write snapshots, ONE history entry per stroke ("Paint"), per-move GPU composite, `setDocumentDirty` on paint. Eraser supported.
- `src/test/history.test.ts` — Undo/redo, transaction coalescing, entry cap, clear (4 tests).
- `src/test/tiles.test.ts` — LRU eviction, memory bytes, coordinate math (3 tests).

### Tooling & tests ✅
- Vitest + jsdom setup (`src/test/setup.ts`).
- `src/test/app.store.test.ts` — window focus/cycle/dirty/panels/appearance (5 tests).
- `src/test/shortcuts.test.ts` — modifier matching, display strings (3 tests).
- 8/8 tests passing; `tsc --noEmit` clean; `npm run build` succeeds.
- Shell bundle: ~25 KB gzipped (target < 300 KB).

---

## Stubbed / Not yet implemented

The following are architecturally scaffolded (types + store actions exist) but not yet rendered or fully functional:

- **Color, Swatches, History, Navigator, Adjustments, Properties panels** — store + PanelConfig exist; UI not built (Milestones 3/7). Layers + Tools panels are done.
- **Selection tools** (rect/ellipse/lasso/magic wand/quick select), marching ants overlay canvas, feather/anti-alias/invert (Milestone 5).
- **Adjustment layers & filters** — worker pipeline, proxy preview, before/after (Milestone 6). Blend shaders exist; filter shaders not written.
- **Masks, clipping masks, alpha lock, smart objects, layer effects** — data model exists; painting/effects shaders not built (Milestone 7).
- **Text, shapes, gradients, pen/path tool** (Milestone 8).
- **PSD/AVIF/HEIC import, PNG/JPEG/WebP/AVIF export, WASM codecs** — `src/codecs/` not created (Milestone 9).
- **Layout persistence / workspaces / Reset Workspace** — app store persistence scaffold exists; panel docking + frame restore not wired (Milestone 10).
- **Accessibility sheet** (Cmd+/), ARIA roles on windows/menus/panels, focus rings, high-contrast verification.
- **E2E (Playwright) & perf harness / FPS overlay** — not created.
- **Canvas2D fallback** — compositor throws if WebGL2 unavailable; fallback path not written.
- **Per-tile dirty-rect rendering** — tile cache + LayerBuffer exist; compositor currently full-document re-composites per change (optimization path noted).

---

## Next steps (in order)

1. **Milestone 5 — Selection tools + marching ants:** rect/ellipse/lasso/magic wand, add/subtract/intersect, animated marching-ants overlay canvas.
2. **Milestone 6 — Adjustments & filters:** worker pipeline (OffscreenCanvas + transferable ArrayBuffers), proxy preview, before/after toggle, cancelable filters.
3. **Milestone 7 — Masks, adjustment layers, smart objects, layer effects.**
4. **Milestone 8 — Text, shapes, gradients, pen tool.**
5. **Milestone 9 — Codecs (PSD/AVIF/HEIC import; PNG/JPEG/WebP/AVIF export) via lazy WASM.**
6. **Milestone 10 — Layout persistence, workspaces, accessibility preferences, polish, Playwright e2e, perf harness, FPS overlay.**

---

## Known deviations from the prompt (to revisit)

- **Tiled dirty-rect rendering:** tile cache + LayerBuffer are implemented, but `Compositor.composite` currently re-renders the whole document per change rather than only dirty/viewport tiles. Incremental per-tile re-composite is the explicit next optimization (Milestone 4/5).
- **Canvas2D fallback:** WebGL2 is required; no Canvas2D fallback path yet.
- **Liquid Glass refraction cost:** refraction is a lightweight SVG displacement filter; the <2 ms/frame chrome budget and perf overlay are not yet measured.
- **Worker pool / zero-copy transfers:** not yet built (filters/Milestone 6).
- **IndexedDB persistence:** localStorage used for app shell; document/pixel persistence to IndexedDB not built.

---

## Acceptance criteria status

| # | Criterion | Status |
|---|-----------|--------|
| 1 | 4000x3000 PSD renders < 3s | Not started (PSD codec not built) |
| 2 | Brush stroke 60 fps, one undo entry | Brush engine built; one history entry per stroke via tile-level copy-on-write. 60fps at 4000x3000 needs per-tile dirty GPU upload (optimization path). |
| 3 | Panels dock/tab/layout survives reload | Partially — store + persistence scaffold; floating panels render; docking/drag-tab UI not built |
| 4 | Window minimize/restore/close + focus | Window frame done; minimize-to-dock animation stubbed |
| 5 | Refraction visibly tints chrome | GlassSurface displacement filter implemented (subtle) |
| 6 | Four a11y preferences change UI | theme.ts + CSS classes implemented; not yet verified end-to-end |
| 7 | Glass/refraction < 2 ms/frame | Not measured (no perf overlay yet) |
| 8 | Exported PNG matches canvas pixel-for-pixel | Not started (export codec not built) |
