import type { Task } from '../types/Task';

const STORAGE_KEY = 'tasks_data';

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
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  },

  clearTasks: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY);
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
