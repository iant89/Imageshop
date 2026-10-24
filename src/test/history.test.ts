import { describe, it, expect } from 'vitest';
import { HistoryManager } from '@/core/history';

describe('history manager', () => {
  it('undoes and redoes a single command', () => {
    const h = new HistoryManager();
    let value = 0;
    h.push({
      id: '1',
      label: 'set 5',
      do: () => { value = 5; },
      undo: () => { value = 0; },
    });
    expect(value).toBe(0);
    expect(h.canUndo).toBe(true);
    h.undoOne();
    expect(value).toBe(0);
    expect(h.canRedo).toBe(true);
    h.redoOne();
    expect(value).toBe(5);
  });

  it('coalesces a transaction into one entry', () => {
    const h = new HistoryManager();
    let value = 0;
    let undoCount = 0;
    // The store applies the change directly; history records do/undo for later.
    h.beginTransaction('paint stroke');
    value += 1;
    h.push({ id: 'a', label: 'a', do: () => { value += 1; }, undo: () => { value -= 1; undoCount++; } });
    value += 1;
    h.push({ id: 'b', label: 'b', do: () => { value += 1; }, undo: () => { value -= 1; undoCount++; } });
    h.endTransaction();
    expect(h.getPast().length).toBe(1);
    expect(value).toBe(2);
    h.undoOne();
    expect(value).toBe(0);
    expect(undoCount).toBe(2); // undone in reverse
    h.redoOne();
    expect(value).toBe(2);
  });

  it('caps entries and drops oldest', () => {
    const h = new HistoryManager({ maxEntries: 3 });
    for (let i = 0; i < 5; i++) {
      h.push({ id: String(i), label: `e${i}`, do: () => {}, undo: () => {} });
    }
    expect(h.getPast().length).toBe(3);
    // getPast is newest-first.
    expect(h.getPast()[0]!.label).toBe('e4');
    expect(h.getPast()[2]!.label).toBe('e2');
  });

  it('clear empties', () => {
    const h = new HistoryManager();
    h.push({ id: '1', label: 'x', do: () => {}, undo: () => {} });
    h.clear();
    expect(h.canUndo).toBe(false);
    expect(h.canRedo).toBe(false);
  });
});
