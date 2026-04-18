import { create } from 'zustand';
import type { TaskGroup } from '../types/TaskGroup';

const STORAGE_KEY = 'groups_data';

function load(): TaskGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TaskGroup[]) : [];
  } catch {
    return [];
  }
}

function save(groups: TaskGroup[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.error('Failed to save groups:', e);
  }
}

export interface GroupStore {
  groups: TaskGroup[];
  addGroup: (name: string, priorityCoefficient?: number) => void;
  updateGroup: (id: string, updates: Partial<Omit<TaskGroup, 'id'>>) => void;
  deleteGroup: (id: string) => void;
  loadGroups: () => void;
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: [],

  addGroup: (name, priorityCoefficient = 1.0) => {
    const group: TaskGroup = { id: crypto.randomUUID(), name, priorityCoefficient };
    set((state) => {
      const updated = [...state.groups, group];
      save(updated);
      return { groups: updated };
    });
  },

  updateGroup: (id, updates) => {
    set((state) => {
      const updated = state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g));
      save(updated);
      return { groups: updated };
    });
  },

  deleteGroup: (id) => {
    set((state) => {
      const updated = state.groups.filter((g) => g.id !== id);
      save(updated);
      return { groups: updated };
    });
  },

  loadGroups: () => {
    set({ groups: load() });
  },
}));
