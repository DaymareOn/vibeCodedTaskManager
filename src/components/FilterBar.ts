import type { TaskFilter, TaskStatus } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { t, onLocaleChange } from '../utils/i18n';

const STATUS_CONFIG: Array<{ status: TaskStatus; labelKey: string; cssClass: string }> = [
  { status: 'todo',        labelKey: 'filter.todo',       cssClass: 'status-btn-todo' },
  { status: 'in-progress', labelKey: 'filter.inProgress', cssClass: 'status-btn-in-progress' },
  { status: 'done',        labelKey: 'filter.done',       cssClass: 'status-btn-done' },
  { status: 'cancelled',   labelKey: 'filter.cancelled',  cssClass: 'status-btn-cancelled' },
];

export const FilterBar = (): HTMLElement => {
  const bar = DOM.create('div', 'filter-bar');

  const searchInput = DOM.create('input', 'filter-input') as HTMLInputElement;
  searchInput.type = 'text';
  searchInput.placeholder = t('filter.search');

  // Status toggle buttons – one per status; active = visible, inactive = hidden
  const statusButtonsRow = DOM.create('div', 'status-filter-buttons');
  const hiddenStatuses = new Set<TaskStatus>();

  const applyFilters = (): void => {
    const filter: TaskFilter = {};
    if (searchInput.value) filter.search = searchInput.value;
    if (hiddenStatuses.size > 0) filter.hiddenStatuses = [...hiddenStatuses];
    useTaskStore.getState().setFilter(filter);
  };

  const statusBtns: HTMLButtonElement[] = [];

  STATUS_CONFIG.forEach(({ status, labelKey, cssClass }) => {
    const btn = DOM.create('button', `status-btn ${cssClass} active`) as HTMLButtonElement;
    btn.type = 'button';
    btn.textContent = t(labelKey);
    btn.dataset.labelKey = labelKey;
    btn.title = `Toggle visibility of "${t(labelKey)}" tasks`;
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
    statusBtns.push(btn);
  });

  searchInput.addEventListener('input', applyFilters);

  onLocaleChange(() => {
    searchInput.placeholder = t('filter.search');
    statusBtns.forEach((btn) => {
      const key = btn.dataset.labelKey ?? '';
      btn.textContent = t(key);
    });
  });

  DOM.append(bar, searchInput, statusButtonsRow);
  return bar;
};

