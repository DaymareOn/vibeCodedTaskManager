import type { Task } from '../types/Task';
import { DATA_VERSION } from './migrations';

const CHANGELOG_KEY = 'tasks_changelog';

/** Type of mutation that produced a change entry. */
export type ChangeType = 'create' | 'update' | 'delete';

/**
 * A single immutable record of one task mutation.
 *
 * - `previousState` is null for 'create' entries.
 * - `newState`      is null for 'delete' entries.
 * - `dataVersion`   mirrors the app's DATA_VERSION at the time the entry was
 *   written, so older entries can be interpreted correctly after schema upgrades.
 */
export interface ChangeEntry {
  /** Auto-incremented sequence number (1-based). */
  seq: number;
  /** ISO 8601 datetime when the change occurred. */
  timestamp: string;
  /** ID of the task that was changed. */
  taskId: string;
  type: ChangeType;
  /** Snapshot of the task before the change (null for creates). */
  previousState: Task | null;
  /** Snapshot of the task after the change (null for deletes). */
  newState: Task | null;
  /** Data model version active at write time. */
  dataVersion: string;
}

// ---- In-memory cache ----
let _seq = 0;
let _log: ChangeEntry[] = [];
let _loaded = false;

function ensureLoaded(): void {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = localStorage.getItem(CHANGELOG_KEY);
    if (raw) {
      _log = JSON.parse(raw) as ChangeEntry[];
      _seq = _log.length > 0 ? _log[_log.length - 1].seq : 0;
    }
  } catch {
    _log = [];
    _seq = 0;
  }
}

function persist(): void {
  try {
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(_log));
  } catch {
    // Storage quota exceeded – trim the oldest half and retry once.
    _log = _log.slice(Math.floor(_log.length / 2));
    try {
      localStorage.setItem(CHANGELOG_KEY, JSON.stringify(_log));
    } catch {
      // Give up silently.
    }
  }
}

export const Changelog = {
  /** Append a 'create' entry when a new task is added. */
  recordCreate(newTask: Task): void {
    ensureLoaded();
    _seq += 1;
    _log.push({
      seq: _seq,
      timestamp: new Date().toISOString(),
      taskId: newTask.id,
      type: 'create',
      previousState: null,
      newState: newTask,
      dataVersion: DATA_VERSION,
    });
    persist();
  },

  /** Append an 'update' entry when an existing task is modified. */
  recordUpdate(previousTask: Task, newTask: Task): void {
    ensureLoaded();
    _seq += 1;
    _log.push({
      seq: _seq,
      timestamp: new Date().toISOString(),
      taskId: newTask.id,
      type: 'update',
      previousState: previousTask,
      newState: newTask,
      dataVersion: DATA_VERSION,
    });
    persist();
  },

  /** Append a 'delete' entry when a task (or sub-task) is removed. */
  recordDelete(deletedTask: Task): void {
    ensureLoaded();
    _seq += 1;
    _log.push({
      seq: _seq,
      timestamp: new Date().toISOString(),
      taskId: deletedTask.id,
      type: 'delete',
      previousState: deletedTask,
      newState: null,
      dataVersion: DATA_VERSION,
    });
    persist();
  },

  /** Return a copy of the entire changelog, oldest-first. */
  getAll(): ChangeEntry[] {
    ensureLoaded();
    return [..._log];
  },

  /** Clear the in-memory cache (used after import to start fresh). */
  reset(): void {
    _log = [];
    _seq = 0;
    _loaded = true;
    try {
      localStorage.removeItem(CHANGELOG_KEY);
    } catch {
      // ignore
    }
  },

  /**
   * Export the changelog as a JSON string.
   * Useful when bundling task data with its full history.
   */
  exportJSON(): string {
    ensureLoaded();
    return JSON.stringify(_log, null, 2);
  },

  /**
   * Import a changelog from a JSON string.
   * Replaces the current in-memory log and persists.
   */
  importJSON(json: string): void {
    try {
      const entries = JSON.parse(json) as ChangeEntry[];
      if (!Array.isArray(entries)) return;
      _log = entries;
      _seq = entries.length > 0 ? entries[entries.length - 1].seq : 0;
      _loaded = true;
      persist();
    } catch {
      // Invalid JSON – ignore.
    }
  },
};
