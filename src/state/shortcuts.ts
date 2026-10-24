/**
 * Centralized keyboard shortcut map.
 * Modifiers: cmd/ctrl (meta on mac), shift, alt, plus the key.
 * Returns true if a shortcut was handled.
 */

export type ShortcutKey = string;
export type ShortcutScope = 'global' | 'document' | 'document-only';

export interface ShortcutDef {
  id: string;
  label: string; // human-readable, shown in menus
  key: string;
  cmd?: boolean; // meta on mac / ctrl elsewhere
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  scope?: ShortcutScope; // default global
}

export function shortcutDisplay(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.cmd) parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
  if (def.alt) parts.push('⌥');
  if (def.shift) parts.push('⇧');
  if (def.key) parts.push(def.key.toUpperCase());
  return parts.join('+');
}

export function eventMatches(evt: KeyboardEvent, def: ShortcutDef): boolean {
  const isMac = navigator.platform.includes('Mac');
  const cmd = isMac ? evt.metaKey : evt.ctrlKey;
  const ctrl = isMac ? evt.ctrlKey : false;
  return (
    (def.cmd ? cmd || ctrl : !cmd && !ctrl) &&
    (def.shift ? evt.shiftKey : !evt.shiftKey) &&
    (def.alt ? evt.altKey : !evt.altKey) &&
    evt.key.toLowerCase() === def.key.toLowerCase() &&
    !evt.defaultPrevented
  );
}

export class ShortcutManager {
  private shortcuts: ShortcutDef[] = [];
  private enabled = true;

  register(def: ShortcutDef) {
    this.shortcuts.push(def);
  }

  unregister(id: string) {
    this.shortcuts = this.shortcuts.filter((s) => s.id !== id);
  }

  handle(evt: KeyboardEvent): boolean {
    if (!this.enabled) return false;
    for (const def of this.shortcuts) {
      if (eventMatches(evt, def)) {
        def.handler();
        evt.preventDefault();
        return true;
      }
    }
    return false;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
  }

  listForMenu(): ShortcutDef[] {
    return this.shortcuts.filter((s) => s.scope !== 'document-only');
  }}

export const shortcuts = new ShortcutManager();
