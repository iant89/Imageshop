/**
 * History / undo-redo.
 *
 * Command/transaction log with coalescing: a whole brush stroke is one entry.
 * Each command is a pair of inverse functions applied against the document
 * store. A transaction can group several commands into a single undo entry.
 *
 * Memory is capped (default 100 entries); old entries are dropped.
 */

export interface Command {
  id: string;
  label: string;
  /** Apply the command forward. */
  do: () => void;
  /** Revert the command. */
  undo: () => void;
}

interface HistoryEntry {
  id: string;
  label: string;
  timestamp: number;
  command: Command;
}

export interface HistoryOptions {
  /** Maximum number of undo entries to keep. */
  maxEntries?: number;
}

export class HistoryManager {
  private entries: HistoryEntry[] = [];
  private pointer = -1; // index of last applied entry
  private readonly maxEntries: number;
  private transactionOpen = false;
  private transactionCommands: Command[] = [];
  private transactionLabel = '';

  private _listeners: Set<() => void> = new Set();

  constructor(options: HistoryOptions = {}) {
    this.maxEntries = options.maxEntries ?? 100;
  }

  subscribe(fn: () => void) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private notify() {
    for (const fn of this._listeners) fn();
  }

  get canUndo() {
    return this.pointer >= 0;
  }

  get canRedo() {
    return this.pointer < this.entries.length - 1;
  }

  get label() {
    return this.entries[this.pointer]?.label;
  }

  /**
   * Begin a coalescing transaction. All commands pushed until endTransaction()
   * are squashed into a single undo entry.
   */
  beginTransaction(label: string) {
    this.transactionOpen = true;
    this.transactionLabel = label;
    this.transactionCommands = [];
  }

  /**
   * End the current transaction, pushing one combined entry (or nothing if
   * no commands were pushed).
   */
  endTransaction() {
    if (!this.transactionOpen) return;
    this.transactionOpen = false;
    if (this.transactionCommands.length === 0) return;
    this.pushCombined(this.transactionLabel, this.transactionCommands);
    this.transactionCommands = [];
  }

  /**
   * Push a single command as its own undo entry (no transaction).
   */
  push(command: Command) {
    if (this.transactionOpen) {
      this.transactionCommands.push(command);
      return;
    }
    this.pushCombined(command.label, [command]);
  }

  private pushCombined(label: string, commands: Command[]) {
    const combined: Command = {
      id: crypto.randomUUID(),
      label,
      do: () => {
        for (const c of commands) c.do();
      },
      undo: () => {
        // Undo in reverse order.
        for (let i = commands.length - 1; i >= 0; i--) {
          commands[i]!.undo();
        }
      },
    };
    // Drop any redo stack ahead of the pointer.
    this.entries = this.entries.slice(0, this.pointer + 1);
    this.entries.push({ id: combined.id, label, timestamp: Date.now(), command: combined });
    this.pointer++;
    this.enforceCap();
    this.notify();
  }

  /** Redo one step forward (re-apply the next undone entry). */
  redoOne() {
    if (!this.canRedo) return;
    this.pointer++;
    this.entries[this.pointer]!.command.do();
    this.notify();
  }

  /** Undo one step back (revert the current entry). */
  undoOne() {
    if (!this.canUndo) return;
    this.entries[this.pointer]!.command.undo();
    this.pointer--;
    this.notify();
  }

  /** Undo everything. */
  undoAll() {
    while (this.canUndo) this.undoOne();
  }

  /** Redo everything. */
  redoAll() {
    while (this.canRedo) this.redoOne();
  }

  /** Clear history. */
  clear() {
    this.entries = [];
    this.pointer = -1;
    this.transactionOpen = false;
    this.transactionCommands = [];
    this.notify();
  }

  /** Snapshot of past labels for the history panel UI. */
  getPast() {
    return this.entries
      .slice(0, this.pointer + 1)
      .map((e) => ({ id: e.id, label: e.label, timestamp: e.timestamp }))
      .reverse();
  }

  /** Snapshot of future (redo) labels. */
  getFuture() {
    return this.entries
      .slice(this.pointer + 1)
      .map((e) => ({ id: e.id, label: e.label, timestamp: e.timestamp }));
  }

  private enforceCap() {
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
      this.pointer--;
    }
    if (this.pointer < 0) this.pointer = -1;
  }
}

let globalHistory: HistoryManager | null = null;

export function getGlobalHistory(): HistoryManager {
  if (!globalHistory) globalHistory = new HistoryManager({ maxEntries: 100 });
  return globalHistory;
}
