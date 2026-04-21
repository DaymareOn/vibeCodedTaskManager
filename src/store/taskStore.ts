import { create } from 'zustand';
import type { Task, TaskFilter } from '../types/Task';
import { StorageManager } from '../utils/storage';
import { Changelog } from '../utils/changelog';

const MS_PER_DAY = 86_400_000;
const EXCHANGE_RATE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type Theme = 'dark-pro' | 'light-pro' | 'pastel';

export interface TaskStore {
  tasks: Task[];
  filter: TaskFilter;

  // --- Timeline / UI settings ---
  taskHeight: number;
  horizontalZoom: number;
  verticalZoom: number;
  theme: Theme;
  timelineOriginMs: number;
  verticalOffset: number;

  // --- Currency settings ---
  /** ISO 4217 code for the user's main display currency (e.g. "EUR") */
  mainCurrency: string;
  /**
   * Exchange rates keyed by ISO 4217 code.
   * rates[X] = "how many X per 1 mainCurrency unit"
   * mainCurrency itself is always 1.0.
   */
  exchangeRates: Record<string, number>;
  /** UTC timestamp (ms) when rates were last fetched */
  exchangeRatesUpdatedAt: number;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: TaskFilter) => void;
  loadTasks: () => void;
  importTasks: (tasks: Task[]) => void;
  exportTasks: () => string;

  // UI actions
  setTaskHeight: (h: number) => void;
  setHorizontalZoom: (z: number) => void;
  setVerticalZoom: (z: number) => void;
  setTheme: (t: Theme) => void;
  setTimelineOriginMs: (ms: number) => void;
  setVerticalOffset: (px: number) => void;

  // Currency actions
  setMainCurrency: (currency: string) => void;
  /** Fetch fresh exchange rates if they are older than 24 h or the base has changed. */
  fetchExchangeRatesIfNeeded: () => Promise<void>;

  // Getters
  getFilteredTasks: () => Task[];
  getSubTasks: (parentId: string) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: {},

  // Timeline / UI defaults
  taskHeight: 48,
  horizontalZoom: 100,
  verticalZoom: 100,
  theme: 'dark-pro',
  timelineOriginMs: Date.now() - 90 * MS_PER_DAY,
  verticalOffset: 0,

  // Currency defaults
  mainCurrency: 'EUR',
  exchangeRates: { EUR: 1 },
  exchangeRatesUpdatedAt: 0,

  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.tasks, newTask];
      StorageManager.saveTasks(updated);
      Changelog.recordCreate(newTask);
      return { tasks: updated };
    });
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => {
      const existing = state.tasks.find((t) => t.id === id);
      const completedAt =
        existing &&
        (updates.status === 'done' || updates.status === 'cancelled') &&
        existing.status !== updates.status
          ? new Date().toISOString()
          : undefined;
      const updated = state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...updates,
              ...(completedAt ? { completedAt } : {}),
              updatedAt: new Date().toISOString(),
            }
          : task,
      );
      StorageManager.saveTasks(updated);
      if (existing) {
        const newTask = updated.find((t) => t.id === id)!;
        Changelog.recordUpdate(existing, newTask);
      }
      return { tasks: updated };
    });
  },

  deleteTask: (id: string) => {
    set((state) => {
      // Also delete all sub-tasks recursively
      const toDelete = new Set<string>();
      const collect = (taskId: string): void => {
        toDelete.add(taskId);
        state.tasks.filter((t) => t.parentId === taskId).forEach((t) => collect(t.id));
      };
      collect(id);
      // Record deletions before removing from array
      state.tasks.filter((task) => toDelete.has(task.id)).forEach((task) => {
        Changelog.recordDelete(task);
      });
      const updated = state.tasks.filter((task) => !toDelete.has(task.id));
      StorageManager.saveTasks(updated);
      return { tasks: updated };
    });
  },

  setFilter: (filter: TaskFilter) => {
    set({ filter });
  },

  loadTasks: () => {
    const tasks = StorageManager.loadTasks();
    set({ tasks });
  },

  importTasks: (tasks: Task[]) => {
    StorageManager.saveTasks(tasks);
    Changelog.reset();
    set({ tasks });
  },

  exportTasks: () => {
    return StorageManager.exportTasks(get().tasks);
  },

  // UI actions
  setTaskHeight: (h) => set({ taskHeight: h }),
  setHorizontalZoom: (z) => set({ horizontalZoom: z }),
  setVerticalZoom: (z) => set({ verticalZoom: z }),
  setTheme: (t) => set({ theme: t }),
  setTimelineOriginMs: (ms) => set({ timelineOriginMs: ms }),
  setVerticalOffset: (px) => set({ verticalOffset: px }),

  // Currency actions
  setMainCurrency: (currency: string) => {
    set({ mainCurrency: currency, exchangeRatesUpdatedAt: 0 }); // force refresh
    get().fetchExchangeRatesIfNeeded();
  },

  fetchExchangeRatesIfNeeded: async () => {
    const { mainCurrency, exchangeRates, exchangeRatesUpdatedAt } = get();
    const age = Date.now() - exchangeRatesUpdatedAt;
    // Skip if rates are fresh and already for this base
    if (age < EXCHANGE_RATE_TTL_MS && exchangeRates[mainCurrency] === 1) return;
    try {
      // Call the backend proxy instead of the external API directly.
      // Server-to-server requests bypass the browser CORS restriction.
      const res = await fetch(`/api/exchange-rates?from=${mainCurrency}`);
      if (!res.ok) {
        console.debug(`[TaskManager] Failed to fetch exchange rates: HTTP ${res.status}`);
        return;
      }
      const data: unknown = await res.json();

      // Sanitize: confirm the payload has the expected shape before storing.
      if (
        typeof data !== 'object' ||
        data === null ||
        typeof (data as Record<string, unknown>).rates !== 'object' ||
        (data as Record<string, unknown>).rates === null
      ) {
        console.debug('[TaskManager] Exchange rate response missing expected "rates" object.');
        return;
      }

      const rawRates = (data as { rates: Record<string, unknown> }).rates;
      const rates: Record<string, number> = { [mainCurrency]: 1 };
      for (const [key, value] of Object.entries(rawRates)) {
        if (typeof value === 'number' && isFinite(value) && value > 0) {
          rates[key] = value;
        }
      }
      set({ exchangeRates: rates, exchangeRatesUpdatedAt: Date.now() });
    } catch (err) {
      // Network failure — keep stale rates and log for debugging
      console.debug('[TaskManager] Exchange rate fetch failed, using stale/no-conversion rates.', err);
    }
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();

    return tasks.filter((task) => {
      if (task.parentId) return false;
      if (filter.hiddenStatuses?.includes(task.status)) return false;
      if (
        filter.search &&
        !task.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !task.description.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  },

  getSubTasks: (parentId: string) => {
    return get().tasks.filter((task) => task.parentId === parentId);
  },
}));
