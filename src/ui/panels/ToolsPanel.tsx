/**
 * Tools panel — active tool + brush settings (size, hardness, opacity,
 * spacing, pressure response). Built with @enterprise-ui/react components.
 */

import React from 'react';
import { useToolsStore } from '@/state/tools';
import type { ToolId } from '@/state/tools';
import {
  Button,
  SegmentedButton,
  Slider,
  Switch,
} from '@enterprise-ui/react';
import type { BrushSettings } from '@/state/tools';
import { cn } from '@/utils/cn';
import styles from './ToolsPanel.module.css';

const TOOL_ITEMS = [
  { value: 'brush', label: 'Brush', icon: 'brush' as any, ariaLabel: 'Brush tool' },
  { value: 'eraser', label: 'Eraser', icon: 'eraser' as any, ariaLabel: 'Eraser tool' },
];

export function ToolsPanel() {
  const { activeTool, setActiveTool, brush, setBrushSetting, setBrushSettings } =
    useToolsStore();

  const slider = (
    label: string,
    key: keyof typeof brush,
    min: number,
    max: number,
    step: number,
    fmt: (v: number) => string
  ) => {
    const value = brush[key];
    return (
      <div className={styles.sliderRow} key={label}>
        <label className={styles.sliderLabel}>{label}</label>
        <Slider
          value={value as number}
          onChange={(v) =>
            setBrushSetting(key, v as BrushSettings[keyof BrushSettings])
          }
          min={min}
          max={max}
          step={step}
          showValue
          formatValue={fmt}
        />
      </div>
    );
  };

  return (
    <div className={cn(styles.panel, styles.toolsPanel)}>
      <div className={styles.header}>
        <span className={styles.title}>Tools</span>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Tool</div>
        <SegmentedButton
          items={TOOL_ITEMS}
          value={[activeTool]}
          onChange={(selected) => setActiveTool(selected[0] as ToolId)}
          selectionMode="single"
          size="sm"
          aria-label="Tool selection"
        />
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Brush</div>
        {slider('Size', 'size', 2, 200, 1, (v) => `${v}px`)}
        {slider('Hardness', 'hardness', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`)}
        {slider('Opacity', 'opacity', 0, 100, 1, (v) => `${v}%`)}
        {slider('Spacing', 'spacing', 0, 1, 0.05, (v) => `${Math.round(v * 100)}%`)}
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Pressure</div>
        <label className={styles.toggleRow}>
          <Switch
            checked={brush.pressureSize}
            onChange={(checked) => setBrushSetting('pressureSize', checked)}
            label="Size"
          />
        </label>
        <label className={styles.toggleRow}>
          <Switch
            checked={brush.pressureOpacity}
            onChange={(checked) => setBrushSetting('pressureOpacity', checked)}
            label="Opacity"
          />
        </label>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Color</div>
        <button
          className={styles.colorSwatch}
          style={{ backgroundColor: brush.color }}
          title="Foreground color (color picker — Milestone 4)"
          onClick={() => alert('Color picker arrives in Milestone 4')}
        />
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setBrushSettings({ ...brush, size: 30, hardness: 0.4, opacity: 1 })
          }
        >
          Reset
        </Button>
      </div>

      <div className={styles.hint}>
        {activeTool === 'brush' ? 'Drag on canvas to paint.' : 'Select a tool to paint.'}
      </div>
    </div>
  );
}