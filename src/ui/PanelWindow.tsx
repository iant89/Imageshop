/**
 * PanelWindow — a floating/resizable panel hosted in a Window, positioned
 * from the panel config's floatingFrame. Renders the registered panel
 * component for the given panelId.
 */

import React from 'react';
import { useAppStore } from '@/state/app';
import { Window } from './Window';
import { LayersPanel } from './panels/LayersPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import type { PanelConfig } from '@/state/app';
import { cn } from '@/utils/cn';
import styles from './PanelWindow.module.css';

type PanelViewProps = { panel: PanelConfig };

const PANEL_VIEWS: Record<string, React.ComponentType<PanelViewProps>> = {
  tools: ToolsPanel,
  layers: LayersPanel,
};

function PlaceholderPanel({ panel }: PanelViewProps) {
  return (
    <div className={styles.placeholder}>
      <span className={styles.placeholderLabel}>{panel.title}</span>
      <span className={styles.placeholderHint}>Panel UI — Milestone 3/7</span>
    </div>
  );
}

export function PanelWindow({ panel }: { panel: PanelConfig }) {
  if (!panel.visible) return null;
  const frame = panel.floatingFrame ?? { x: 0, y: 0, width: 240, height: 300 };
  const View = PANEL_VIEWS[panel.id] ?? PlaceholderPanel;

  return (
    <div
      className={cn(styles.panelWrap)}
      style={{
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        zIndex: 20,
      }}
    >
      <Window id={`panel-${panel.id}`} title={panel.title} focused={false}>
        <div className={styles.view} style={{ width: frame.width, height: frame.height }}>
          <View panel={panel} />
        </div>
      </Window>
    </div>
  );
}
