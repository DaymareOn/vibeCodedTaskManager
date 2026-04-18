import { create } from 'zustand';
import type { Task, TaskFilter } from '../types/Task';
import { StorageManager } from '../utils/storage';
import { computePriorityScore } from '../utils/priority';
import { useGroupStore } from './groupStore';

export interface TaskStore {
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
      const updated = state.tasks.filter((task) => task.id !== id);
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

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    const now = Date.now();

    let result = tasks.filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.groupId && task.groupId !== filter.groupId) return false;
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
      const groups = useGroupStore.getState().groups;
      result = [...result].sort((a, b) => {
        const kA = groups.find((g) => g.id === a.groupId)?.priorityCoefficient ?? 1.0;
        const kB = groups.find((g) => g.id === b.groupId)?.priorityCoefficient ?? 1.0;
        const scoreA = computePriorityScore(a, kA, now) ?? -Infinity;
        const scoreB = computePriorityScore(b, kB, now) ?? -Infinity;
        return scoreB - scoreA;
      });
    }

    return result;
  },
}));