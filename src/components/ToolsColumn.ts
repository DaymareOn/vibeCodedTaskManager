import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import type { Theme } from '../store/taskStore';
import { FilterBar } from './FilterBar';
import { ImportExport } from './ImportExport';

// ---- Helper: collapsible section ----
function createSection(title: string): HTMLElement {
  const section = DOM.create('div', 'tools-section');
  const header = DOM.create('div', 'tools-section-header', title);
  DOM.append(section, header);
  return section;
}

// ---- Helper: mouse-wheel adjustable control ----
function createWheelControl(
  label: string,
  getValue: () => number,
  setValue: (v: number) => void,
  step: number,
  unit: string,
): HTMLElement {
  const row = DOM.create('div', 'tools-row');
  const labelEl = DOM.create('span', 'tools-label', label);
  const zone = DOM.create('div', 'tools-wheel-zone');
  zone.title = 'Scroll to adjust';
  const valueDisplay = DOM.create('span', 'tools-value', `${getValue()}${unit}`);
  DOM.append(zone, valueDisplay);

  zone.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setValue(getValue() + delta);
    valueDisplay.textContent = `${getValue()}${unit}`;
  }, { passive: false });

  DOM.append(row, labelEl, zone);
  return row;
}

// ---- Helper: read-only display row ----
function createDisplayRow(label: string, initialValue: string, cssClass: string): HTMLElement {
  const row = DOM.create('div', 'tools-row');
  const labelEl = DOM.create('span', 'tools-label', label);
  const valueEl = DOM.create('span', `tools-value ${cssClass}`, initialValue);
  DOM.append(row, labelEl, valueEl);
  return row;
}

export const ToolsColumn = (): HTMLElement => {
  const col = DOM.create('div', 'tools-column');
  const inner = DOM.create('div', 'tools-column-inner');

  let collapsed = false;

  // ---- Collapse toggle ----
  const toggleBtn = DOM.create('button', 'tools-toggle-btn', '◀');
  toggleBtn.title = 'Collapse tools panel';
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    col.classList.toggle('collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '▶' : '◀';
    toggleBtn.title = collapsed ? 'Expand tools panel' : 'Collapse tools panel';
  });

  // ---- Title ----
  const titleEl = DOM.create('div', 'tools-title');
  titleEl.innerHTML = `
    <div class="tools-title-icon">📋</div>
    <div class="tools-title-text">Vibe Coded<br><strong>Task Manager</strong></div>
  `;

  // ---- Search & Filter section ----
  const searchSection = createSection('🔍 Search & Filter');
  const filterBar = FilterBar();
  filterBar.classList.add('tools-filter-bar');
  DOM.append(searchSection, filterBar);

  // ---- Import / Export section ----
  const ioSection = createSection('📂 Import / Export');
  const importExportBar = ImportExport();
  importExportBar.classList.add('tools-io-bar');
  DOM.append(ioSection, importExportBar);

  // ---- Display section ----
  const displaySection = createSection('⚙ Display');

  const taskHeightRow = createWheelControl(
    '↕ Task height',
    () => useTaskStore.getState().taskHeight,
    (v) => useTaskStore.getState().setTaskHeight(Math.max(16, Math.min(200, v))),
    4,
    'px',
  );

  const opacityRow = createWheelControl(
    '👁 Cancelled opacity',
    () => Math.round(useTaskStore.getState().cancelledOpacity * 100),
    (v) => useTaskStore.getState().setCancelledOpacity(Math.max(0, Math.min(100, v)) / 100),
    5,
    '%',
  );

  // Show/hide cancelled toggle
  const showCancelledRow = DOM.create('div', 'tools-row');
  const showCancelledLabel = DOM.create('label', 'tools-toggle-label');
  const showCancelledCheckbox = DOM.create('input', 'tools-checkbox') as HTMLInputElement;
  (showCancelledCheckbox as HTMLInputElement).type = 'checkbox';
  (showCancelledCheckbox as HTMLInputElement).checked = useTaskStore.getState().showCancelled;
  showCancelledLabel.textContent = ' Show Cancelled';
  showCancelledLabel.prepend(showCancelledCheckbox);
  DOM.append(showCancelledRow, showCancelledLabel);

  showCancelledCheckbox.addEventListener('change', () => {
    useTaskStore.getState().setShowCancelled(showCancelledCheckbox.checked);
  });

  // Zoom display rows
  const hZoomRow = createDisplayRow('↔ H. Zoom', `${useTaskStore.getState().horizontalZoom}%`, 'hzoom-value');
  const vZoomRow = createDisplayRow('↕ V. Zoom', `${useTaskStore.getState().verticalZoom}%`, 'vzoom-value');

  DOM.append(displaySection, taskHeightRow, opacityRow, showCancelledRow, hZoomRow, vZoomRow);

  // ---- Theme section ----
  const themeSection = createSection('🎨 Theme');

  const themes: Array<{ key: Theme; label: string }> = [
    { key: 'dark-pro', label: '🌙 Dark Pro' },
    { key: 'light-pro', label: '☀ Light Pro' },
    { key: 'pastel', label: '🌸 Pastel' },
  ];

  themes.forEach(({ key, label }) => {
    const btn = DOM.create('button', 'btn btn-theme', label);
    btn.dataset.theme = key;
    btn.addEventListener('click', () => {
      useTaskStore.getState().setTheme(key);
    });
    DOM.append(themeSection, btn);
  });

  // Assemble inner
  DOM.append(inner, titleEl, searchSection, ioSection, displaySection, themeSection);
  DOM.append(col, toggleBtn, inner);

  // ---- Subscribe to store for live updates ----
  const updateFromStore = (): void => {
    const state = useTaskStore.getState();

    // Zoom displays
    const hZoomEl = hZoomRow.querySelector('.hzoom-value');
    const vZoomEl = vZoomRow.querySelector('.vzoom-value');
    if (hZoomEl) hZoomEl.textContent = `${state.horizontalZoom}%`;
    if (vZoomEl) vZoomEl.textContent = `${state.verticalZoom}%`;

    // Show-cancelled checkbox
    showCancelledCheckbox.checked = state.showCancelled;

    // Theme buttons
    themeSection.querySelectorAll<HTMLElement>('.btn-theme').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === state.theme);
    });

    // Wheel zone value displays
    const taskHeightVal = taskHeightRow.querySelector('.tools-value');
    const opacityVal = opacityRow.querySelector('.tools-value');
    if (taskHeightVal) taskHeightVal.textContent = `${state.taskHeight}px`;
    if (opacityVal) opacityVal.textContent = `${Math.round(state.cancelledOpacity * 100)}%`;
  };

  useTaskStore.subscribe(updateFromStore);
  updateFromStore();

  return col;
};
