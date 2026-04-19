import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import type { Theme } from '../store/taskStore';
import { FilterBar } from './FilterBar';
import { ImportExport } from './ImportExport';
import { KeyboardConfigManager } from '../utils/keyboardConfig';

/** ISO 4217 currencies shown in the Main Currency picker */
const CURRENCIES: Array<{ code: string; name: string }> = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'ISK', name: 'Icelandic Krona' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'TWD', name: 'Taiwan Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'RUB', name: 'Russian Ruble' },
];

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
    // Allow Ctrl+wheel to pass through so the browser can handle zoom.
    if (e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? step : -step;
    setValue(getValue() + delta);
    valueDisplay.textContent = `${getValue()}${unit}`;
  }, { passive: false });

  DOM.append(row, labelEl, zone);
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

  DOM.append(displaySection, taskHeightRow);

  // ---- Currency section ----
  const currencySection = createSection('💱 Main Currency');

  const currencyRow = DOM.create('div', 'tools-row');
  const currencyLabel = DOM.create('span', 'tools-label', '🪙 Currency');
  const currencySelect = DOM.create('select', 'tools-currency-select') as HTMLSelectElement;

  const currentMain = useTaskStore.getState().mainCurrency;
  CURRENCIES.forEach(({ code, name }) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${code} – ${name}`;
    if (code === currentMain) opt.selected = true;
    currencySelect.appendChild(opt);
  });

  currencySelect.addEventListener('change', () => {
    useTaskStore.getState().setMainCurrency(currencySelect.value);
  });

  DOM.append(currencyRow, currencyLabel, currencySelect);
  DOM.append(currencySection, currencyRow);

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

  // ---- Help section ----
  const helpSection = createSection('⌨ Keyboard Help');

  const helpKeyRow  = DOM.create('div', 'tools-row');
  const helpKeyLabel = DOM.create('span', 'tools-label', '🆘 Help key');
  const helpKeyInput = DOM.create('input', 'form-input tools-help-key-input') as HTMLInputElement;
  helpKeyInput.type        = 'text';
  helpKeyInput.maxLength   = 20;
  helpKeyInput.value       = KeyboardConfigManager.get().helpKey;
  helpKeyInput.placeholder = 'e.g. F1';
  helpKeyInput.title       = 'Press a key to set the shortcut that opens the overlay';

  // Update the config when the user focuses the input and presses a key
  helpKeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    const key = e.key;
    if (key === 'Escape') {
      helpKeyInput.blur();
      return;
    }
    helpKeyInput.value = key;
    KeyboardConfigManager.setHelpKey(key);
  });

  DOM.append(helpKeyRow, helpKeyLabel, helpKeyInput);

  const openHelpBtn = DOM.create('button', 'btn btn-secondary tools-open-help-btn', '⌨ Open overlay (F1)');
  openHelpBtn.addEventListener('click', () => {
    // Dispatch a custom event that main.ts listens to
    document.dispatchEvent(new CustomEvent('open-keyboard-overlay'));
  });

  DOM.append(helpSection, helpKeyRow, openHelpBtn);

  // Assemble inner
  DOM.append(inner, titleEl, searchSection, ioSection, displaySection, currencySection, themeSection, helpSection);
  DOM.append(col, toggleBtn, inner);

  // ---- Subscribe to store for live updates ----
  const updateFromStore = (): void => {
    const state = useTaskStore.getState();

    // Theme buttons
    themeSection.querySelectorAll<HTMLElement>('.btn-theme').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === state.theme);
    });

    // Wheel zone value displays
    const taskHeightVal = taskHeightRow.querySelector('.tools-value');
    if (taskHeightVal) taskHeightVal.textContent = `${state.taskHeight}px`;

    // Currency selector
    currencySelect.value = state.mainCurrency;
  };

  useTaskStore.subscribe(updateFromStore);
  updateFromStore();

  // Trigger initial exchange rate fetch
  useTaskStore.getState().fetchExchangeRatesIfNeeded();

  return col;
};
