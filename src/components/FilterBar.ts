import type { TaskFilter, TaskStatus } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';

const STATUS_CONFIG: Array<{ status: TaskStatus; label: string; cssClass: string }> = [
  { status: 'todo',        label: '⬜ To Do',      cssClass: 'status-btn-todo' },
  { status: 'in-progress', label: '🔄 In Progress', cssClass: 'status-btn-in-progress' },
  { status: 'done',        label: '✅ Done',        cssClass: 'status-btn-done' },
  { status: 'cancelled',   label: '❌ Cancelled',   cssClass: 'status-btn-cancelled' },
];

export const FilterBar = (): HTMLElement => {
  const bar = DOM.create('div', 'filter-bar');

  const searchInput = DOM.create('input', 'filter-input') as HTMLInputElement;
  searchInput.type = 'text';
  searchInput.placeholder = '🔍 Search tasks…';

  // Status toggle buttons – one per status; active = visible, inactive = hidden
  const statusButtonsRow = DOM.create('div', 'status-filter-buttons');
  const hiddenStatuses = new Set<TaskStatus>();

  const applyFilters = (): void => {
    const filter: TaskFilter = {};
    if (searchInput.value) filter.search = searchInput.value;
    if (hiddenStatuses.size > 0) filter.hiddenStatuses = [...hiddenStatuses];
    useTaskStore.getState().setFilter(filter);
  };

  STATUS_CONFIG.forEach(({ status, label, cssClass }) => {
    const btn = DOM.create('button', `status-btn ${cssClass} active`) as HTMLButtonElement;
    btn.type = 'button';
    btn.textContent = label;
    btn.title = `Toggle visibility of "${label}" tasks`;
    btn.addEventListener('click', () => {
      if (hiddenStatuses.has(status)) {
        hiddenStatuses.delete(status);
        btn.classList.add('active');
      } else {
        hiddenStatuses.add(status);
        btn.classList.remove('active');
      }
      applyFilters();
    });
    DOM.append(statusButtonsRow, btn);
  });

  searchInput.addEventListener('input', applyFilters);

  DOM.append(bar, searchInput, statusButtonsRow);
  return bar;
};

