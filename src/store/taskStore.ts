import { create } from 'zustand';
import type { Task, TaskFilter } from '../types/Task';
import { StorageManager } from '../utils/storage';
import { computePriorityScore } from '../utils/priority';

export interface TaskStore {
  tasks: Task[];
  filter: TaskFilter;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: TaskFilter) => void;
  loadTasks: () => void;
  importTasks: (tasks: Task[]) => void;
  exportTasks: () => string;
  
  // Getters
  getFilteredTasks: () => Task[];
  getSubTasks: (parentId: string) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: {},

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
      return { tasks: updated };
    });
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    set((state) => {
      const updated = state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      );
      StorageManager.saveTasks(updated);
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
    set({ tasks });
  },

  exportTasks: () => {
    return StorageManager.exportTasks(get().tasks);
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    const now = Date.now();

    // Only return root tasks (no parentId) at the top level
    let result = tasks.filter((task) => {
      if (task.parentId) return false;
      if (filter.status && task.status !== filter.status) return false;
      if (
        filter.search &&
        !task.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !task.description.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    if (filter.sortByScore) {
      result = [...result].sort((a, b) => {
        const scoreA = computePriorityScore(a, 1.0, now);
        const scoreB = computePriorityScore(b, 1.0, now);
        return scoreB - scoreA;
      });
    }

    return result;
  },

  getSubTasks: (parentId: string) => {
    return get().tasks.filter((task) => task.parentId === parentId);
  },
}));
