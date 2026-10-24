import { describe, it, expect } from 'vitest';
import { shortcuts, eventMatches, shortcutDisplay } from '@/state/shortcuts';

describe('shortcuts', () => {
  it('matches a cmd key event', () => {
    const handled: string[] = [];
    shortcuts.register({
      id: 'test-undo',
      label: 'Undo',
      key: 'z',
      cmd: true,
      handler: () => handled.push('undo'),
    });
    const evt = new KeyboardEvent('keydown', { key: 'z', metaKey: true, ctrlKey: true, bubbles: true, cancelable: true });
    evt.preventDefault = () => {};
    expect(eventMatches(evt, { id: 'x', label: 'x', key: 'z', cmd: true, handler: () => {} })).toBe(true);
    expect(shortcuts.handle(evt)).toBe(true);
    expect(handled).toEqual(['undo']);
    expect(eventMatches(evt, { id: 'x', label: 'x', key: 'Z', cmd: true, handler: () => {} })).toBe(true);
  });

  it('does not match wrong modifier', () => {
    expect(eventMatches(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }), { id: 'x', label: 'x', key: 'z', cmd: true, handler: () => {} })).toBe(true);
    expect(eventMatches(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }), { id: 'x', label: 'x', key: 'z', cmd: true, handler: () => {} })).toBe(false);
  });

  it('renders a display string', () => {
    expect(shortcutDisplay({ id: 'x', label: 'x', key: 'z', cmd: true, shift: true, handler: () => {} })).toContain('Z');
  });
});
