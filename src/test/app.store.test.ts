import { describe, it, expect } from 'vitest';
import { useAppStore } from '@/state/app';
import type { PanelConfig } from '@/state/app';

describe('app store', () => {
  it('toggles panel visibility', () => {
    const { togglePanel, getPanel } = useAppStore.getState();
    togglePanel('color');
    expect(getPanel('color')?.visible).toBe(true);
    togglePanel('color');
    expect(getPanel('color')?.visible).toBe(false);
  });

  it('updates panel config', () => {
    const { updatePanel, getPanel } = useAppStore.getState();
    updatePanel('color', { title: 'Custom Color' });
    expect(getPanel('color')?.title).toBe('Custom Color');
  });

  it('cycles appearance', () => {
    const { setAppearance } = useAppStore.getState();
    setAppearance('dark');
    expect(useAppStore.getState().appearance).toBe('dark');
    setAppearance('light');
    expect(useAppStore.getState().appearance).toBe('light');
    setAppearance('auto');
    expect(useAppStore.getState().appearance).toBe('auto');
  });

  it('sets a11y preferences', () => {
    const { setA11y } = useAppStore.getState();
    setA11y({ reduceTransparency: true });
    expect(useAppStore.getState().reduceTransparency).toBe(true);
    setA11y({ increaseContrast: true, reduceMotion: true });
    expect(useAppStore.getState().increaseContrast).toBe(true);
    expect(useAppStore.getState().reduceMotion).toBe(true);
  });

  it('initial panels include tools and layers', () => {
    const { getPanel } = useAppStore.getState();
    expect(getPanel('tools')).toBeDefined();
    expect(getPanel('layers')).toBeDefined();
    expect(getPanel('tools')?.visible).toBe(true);
    expect(getPanel('layers')?.visible).toBe(true);
  });

  it('panel is typed as PanelConfig', () => {
    const { getPanel } = useAppStore.getState();
    const p: PanelConfig | undefined = getPanel('tools');
    expect(p?.id).toBe('tools');
  });
});