/**
 * Tools panel — active tool + brush settings (size, hardness, opacity,
 * spacing, pressure response). Wired to @/state/tools.
 */

import React from 'react';
import { useToolsStore } from '@/state/tools';
import { BrushIcon, EraserIcon, ColorIcon } from '@/design/icons';
import { cn } from '@/utils/cn';
import styles from './ToolsPanel.module.css';

export function ToolsPanel() {
  const { activeTool, setActiveTool, brush, setBrushSetting, setBrushSettings } = useToolsStore();

  const slider = (label: string, key: keyof typeof brush, min: number, max: number, step: number, fmt: (v: number) => string) => {
    const value = brush[key];
    return (
      <div className={styles.sliderRow} key={label}>
        <label className={styles.sliderLabel}>{label}</label>
        <span className={styles.sliderValue}>{fmt(value as number)}</span>
        <input
          className={styles.slider}
          type="range"
          min={String(min)}
          max={String(max)}
          step={String(step)}
          value={String(value)}
          onChange={(e) => setBrushSetting(key, parseFloat(e.target.value))}
        />
      </div>
    );
  };

  return (
    <div className={cn(styles.panel, styles.toolsPanel)}>
      <div className={styles.header}>
        <BrushIcon size={13} />
        <span className={styles.title}>Tools</span>
      </div>

      <div className={styles.group}>
        <div className={styles.groupLabel}>Tool</div>
        <div className={styles.toolRow}>
          <ToolButton
            id="brush"
            active={activeTool === 'brush'}
            onClick={() => setActiveTool('brush')}
            icon={<BrushIcon size={11} />}
            label="Brush"
          />
          <ToolButton
            id="eraser"
            active={activeTool === 'eraser'}
            onClick={() => setActiveTool('eraser')}
            icon={<EraserIcon size={11} />}
            label="Eraser"
          />

        </div>
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
          <input
            type="checkbox"
            checked={brush.pressureSize}
            onChange={(e) => setBrushSetting('pressureSize', e.target.checked)}
          />
          Size
        </label>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            checked={brush.pressureOpacity}
            onChange={(e) => setBrushSetting('pressureOpacity', e.target.checked)}
          />
          Opacity
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
        <button className={styles.btnReset} onClick={() => setBrushSettings({ ...brush, size: 30, hardness: 0.4, opacity: 1 })}>
          Reset
        </button>
      </div>

      <div className={styles.hint}>
        {activeTool === 'brush' ? 'Drag on canvas to paint.' : 'Select a tool to paint.'}
      </div>
    </div>
  );
}

function ToolButton({ id, active, onClick, icon, label }: { id: string; active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      className={cn(styles.toolBtn, active && styles.toolBtnActive)}
      onClick={onClick}
      title={label}
      role="button"
      aria-pressed={active}
    >
      {icon}
      <span className={styles.toolLabel}>{label}</span>
    </button>
  );
}
