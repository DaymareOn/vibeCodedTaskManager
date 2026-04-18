import { create } from 'zustand';
import type { Task, TaskFilter } from '../types/Task';
import { StorageManager } from '../utils/storage';

interface TaskStore {
  tasks: Task[];
  filter: TaskFilter;
  
  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: TaskFilter) => void;
  loadTasks: () => void;
  
  // Getters
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  filter: {},

  addTask: (taskData) => {
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

  updateTask: (id, updates) => {
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

  deleteTask: (id) => {
    set((state) => {
      const updated = state.tasks.filter((task) => task.id !== id);
      StorageManager.saveTasks(updated);
      return { tasks: updated };
    });
  },

  setFilter: (filter) => {
    set({ filter });
  },

  loadTasks: () => {
    const tasks = StorageManager.loadTasks();
    set({ tasks });
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    return tasks.filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
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
}));