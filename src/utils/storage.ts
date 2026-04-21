import type { Task } from '../types/Task';
import { sampleTasks } from '../data/sampleTasks';
import { DATA_VERSION, migrate } from './migrations';

const STORAGE_KEY = 'tasks_data';
const SEEDED_FLAG_KEY = 'tasks_seeded';

/** Versioned envelope stored in localStorage under STORAGE_KEY. */
interface StoredData {
  dataVersion: string;
  tasks: Task[];
}

/**
 * Parse a raw localStorage value and return the tasks array.
 * Handles both the legacy format (plain JSON array) and the current
 * versioned envelope `{ dataVersion, tasks }`.  When the stored version
 * is older than DATA_VERSION, migrations are run automatically.
 */
function parseStoredData(raw: string): Task[] {
  const parsed: unknown = JSON.parse(raw);

  // Legacy format: plain array (pre-versioning).
  if (Array.isArray(parsed)) {
    // Treat as data from before versioning was introduced; run all
    // available migrations starting from a synthetic "0.0.0" baseline.
    return migrate(parsed, '0.0.0');
  }

  // Versioned envelope.
  const envelope = parsed as StoredData;
  const fromVersion = envelope.dataVersion ?? '0.0.0';
  const tasks = Array.isArray(envelope.tasks) ? envelope.tasks : [];

  if (fromVersion === DATA_VERSION) {
    return tasks;
  }

  // Stored version is older than the running app – migrate.
  console.info(
    `[TaskManager] Migrating data from v${fromVersion} → v${DATA_VERSION}`,
  );
  return migrate(tasks, fromVersion);
}

export const StorageManager = {
  saveTasks: (tasks: Task[]): void => {
    try {
      const envelope: StoredData = { dataVersion: DATA_VERSION, tasks };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  },

  loadTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return parseStoredData(data);
      }
      // Seed with sample tasks only on first install (when seeded flag is not set)
      const seeded = localStorage.getItem(SEEDED_FLAG_KEY);
      if (!seeded) {
        StorageManager.saveTasks(sampleTasks);
        localStorage.setItem(SEEDED_FLAG_KEY, 'true');
        return sampleTasks;
      }
      // User cleared tasks deliberately, return empty array
      return [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  },

  clearTasks: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Keep the seeded flag set to prevent reseeding after user clears tasks
      localStorage.setItem(SEEDED_FLAG_KEY, 'true');
    } catch (error) {
      console.error('Failed to clear tasks:', error);
    }
  },

  exportTasks: (tasks: Task[]): string => {
    const envelope: StoredData = { dataVersion: DATA_VERSION, tasks };
    return JSON.stringify(envelope, null, 2);
  },

  importTasks: (jsonData: string): Task[] => {
    try {
      // Reuse parseStoredData so that both plain-array and versioned-envelope
      // imports are migrated to the current schema just like localStorage loads.
      return parseStoredData(jsonData);
    } catch (error) {
      console.error('Failed to parse imported tasks:', error);
      return [];
    }
  },
};