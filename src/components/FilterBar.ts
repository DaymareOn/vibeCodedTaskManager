import type { TaskFilter, TaskStatus, TaskPriority } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';

export const FilterBar = (): HTMLElement => {
  const bar = DOM.create('div', 'filter-bar');

  const searchInput = DOM.create('input', 'filter-input') as HTMLInputElement;
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Search tasks…';

  const statusSelect = DOM.create('select', 'filter-select') as HTMLSelectElement;
  statusSelect.innerHTML = `
    <option value="">All Statuses</option>
    <option value="todo">To Do</option>
    <option value="in-progress">In Progress</option>
    <option value="done">Done</option>
  `;

  const prioritySelect = DOM.create('select', 'filter-select') as HTMLSelectElement;
  prioritySelect.innerHTML = `
    <option value="">All Priorities</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  `;

  const clearBtn = DOM.create('button', 'btn btn-secondary', 'Clear Filters');

  const applyFilters = (): void => {
    const filter: TaskFilter = {};
    if (searchInput.value) filter.search = searchInput.value;
    if (statusSelect.value) filter.status = statusSelect.value as TaskStatus;
    if (prioritySelect.value) filter.priority = prioritySelect.value as TaskPriority;
    useTaskStore.getState().setFilter(filter);
  };

  searchInput.addEventListener('input', applyFilters);
  statusSelect.addEventListener('change', applyFilters);
  prioritySelect.addEventListener('change', applyFilters);

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusSelect.value = '';
    prioritySelect.value = '';
    useTaskStore.getState().setFilter({});
  });

  DOM.append(bar, searchInput, statusSelect, prioritySelect, clearBtn);
  return bar;
};
