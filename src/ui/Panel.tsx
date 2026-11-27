/**
 * Panel — a docked panel container using the modern Surface primitive.
 * Replaces the macOS PanelWindow (floating Window with title bar).
 */

import React from 'react';
import { useAppStore } from '@/state/app';
import { LayersPanel } from './panels/LayersPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { Surface } from './Surface';
import type { PanelConfig } from '@/state/app';
import styles from './Panel.module.css';

type PanelViewProps = { panel: PanelConfig };

const PANEL_VIEWS: Record<string, React.ComponentType<PanelViewProps>> = {
  tools: ToolsPanel,
  layers: LayersPanel,
};

function PlaceholderPanel({ panel }: PanelViewProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderLabel}>{panel.title}</span>
      <span className={styles.placeholderHint}>Panel — coming soon</span>
    </div>
  );
}

export function Panel({ panel }: { panel: PanelConfig }) {
  if (!panel.visible) return null;
  const View = PANEL_VIEWS[panel.id] ?? PlaceholderPanel;

  return (
    <Surface variant="default" className={styles.panel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelTitle}>{panel.title}</span>
      </div>
      <div className={styles.panelBody}>
        <View panel={panel} />
      </div>
    </Surface>
  );
}