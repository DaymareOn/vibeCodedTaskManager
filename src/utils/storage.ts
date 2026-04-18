import type { Task } from '../types/Task';
import { sampleTasks } from '../data/sampleTasks';

const STORAGE_KEY = 'tasks_data';
const SEEDED_FLAG_KEY = 'tasks_seeded';

export const StorageManager = {
  saveTasks: (tasks: Task[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  },

  loadTasks: (): Task[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
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
    return JSON.stringify(tasks, null, 2);
  },

  importTasks: (jsonData: string): Task[] => {
    try {
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Failed to parse imported tasks:', error);
      return [];
    }
  },
};