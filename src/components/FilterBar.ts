import type { TaskFilter, TaskStatus, TaskPriority } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { useGroupStore } from '../store/groupStore';

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

  const groupSelect = DOM.create('select', 'filter-select') as HTMLSelectElement;
  const refreshGroupOptions = (): void => {
    const { groups } = useGroupStore.getState();
    groupSelect.innerHTML = '<option value="">All Groups</option>';
    groups.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = g.name;
      groupSelect.appendChild(opt);
    });
  };
  useGroupStore.subscribe(refreshGroupOptions);
  refreshGroupOptions();

  const sortScoreLabel = DOM.create('label', 'filter-sort-label');
  sortScoreLabel.innerHTML = `
    <input type="checkbox" id="sort-by-score" class="filter-checkbox" />
    ⚡ Sort by score
  `;

  const clearBtn = DOM.create('button', 'btn btn-secondary', 'Clear Filters');

  const applyFilters = (): void => {
    const sortCheckbox = sortScoreLabel.querySelector('#sort-by-score') as HTMLInputElement;
    const filter: TaskFilter = {};
    if (searchInput.value) filter.search = searchInput.value;
    if (statusSelect.value) filter.status = statusSelect.value as TaskStatus;
    if (prioritySelect.value) filter.priority = prioritySelect.value as TaskPriority;
    if (groupSelect.value) filter.groupId = groupSelect.value;
    if (sortCheckbox?.checked) filter.sortByScore = true;
    useTaskStore.getState().setFilter(filter);
  };

  searchInput.addEventListener('input', applyFilters);
  statusSelect.addEventListener('change', applyFilters);
  prioritySelect.addEventListener('change', applyFilters);
  groupSelect.addEventListener('change', applyFilters);
  sortScoreLabel.addEventListener('change', applyFilters);

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusSelect.value = '';
    prioritySelect.value = '';
    groupSelect.value = '';
    const sortCheckbox = sortScoreLabel.querySelector('#sort-by-score') as HTMLInputElement;
    if (sortCheckbox) sortCheckbox.checked = false;
    useTaskStore.getState().setFilter({});
  });

  DOM.append(bar, searchInput, statusSelect, prioritySelect, groupSelect, sortScoreLabel, clearBtn);
  return bar;
};
