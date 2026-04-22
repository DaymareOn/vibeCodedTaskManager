import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import type { Theme } from '../store/taskStore';
import { FilterBar } from './FilterBar';
import { ImportExport } from './ImportExport';
import { KeyboardConfigManager } from '../utils/keyboardConfig';
import { ConceptsConfigManager } from '../utils/conceptsConfig';
import { t, onLocaleChange, getLocale, setLocale, SUPPORTED_LOCALES, type LocaleCode } from '../utils/i18n';
import { COUNTRIES } from '../data/countries';

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

export const ToolsColumn = (): HTMLElement => {
  const col = DOM.create('div', 'tools-column');
  const inner = DOM.create('div', 'tools-column-inner');

  let collapsed = false;

  // ---- Collapse toggle ----
  const toggleBtn = DOM.create('button', 'tools-toggle-btn', '◀');
  toggleBtn.title = t('tools.collapse');
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    col.classList.toggle('collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '▶' : '◀';
    toggleBtn.title = collapsed ? t('tools.expand') : t('tools.collapse');
  });

  // ---- Title ----
  const titleEl = DOM.create('div', 'tools-title');
  const titleIcon = DOM.create('div', 'tools-title-icon', '📋');
  const titleText = DOM.create('div', 'tools-title-text');
  titleText.innerHTML = `Vibe Coded<br><strong>${t('app.subtitle')}</strong>`;
  DOM.append(titleEl, titleIcon, titleText);

  // ---- Search & Filter section ----
  const searchSectionHeader = DOM.create('div', 'tools-section-header', t('tools.searchFilter'));
  const searchSection = DOM.create('div', 'tools-section');
  const filterBar = FilterBar();
  filterBar.classList.add('tools-filter-bar');
  DOM.append(searchSection, searchSectionHeader, filterBar);

  // ---- Import / Export section ----
  const ioSectionHeader = DOM.create('div', 'tools-section-header', t('tools.importExport'));
  const ioSection = DOM.create('div', 'tools-section');
  const importExportBar = ImportExport();
  importExportBar.classList.add('tools-io-bar');
  DOM.append(ioSection, ioSectionHeader, importExportBar);

  // ---- Display section ----
  const displaySectionHeader = DOM.create('div', 'tools-section-header', t('tools.display'));
  const displaySection = DOM.create('div', 'tools-section');

  const taskHeightLabel = DOM.create('span', 'tools-label', t('tools.taskHeight'));
  const taskHeightZone  = DOM.create('div', 'tools-wheel-zone');
  taskHeightZone.title  = 'Scroll to adjust';
  const taskHeightVal   = DOM.create('span', 'tools-value', `${useTaskStore.getState().taskHeight}px`);
  DOM.append(taskHeightZone, taskHeightVal);
  taskHeightZone.addEventListener('wheel', (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 4 : -4;
    useTaskStore.getState().setTaskHeight(Math.max(16, Math.min(200, useTaskStore.getState().taskHeight + delta)));
    taskHeightVal.textContent = `${useTaskStore.getState().taskHeight}px`;
  }, { passive: false });
  const taskHeightRow = DOM.create('div', 'tools-row');
  DOM.append(taskHeightRow, taskHeightLabel, taskHeightZone);
  DOM.append(displaySection, displaySectionHeader, taskHeightRow);

  // ---- Currency section ----
  const currencySectionHeader = DOM.create('div', 'tools-section-header', t('tools.currency'));
  const currencySection = DOM.create('div', 'tools-section');

  const currencyRow = DOM.create('div', 'tools-row');
  const currencyLabel = DOM.create('span', 'tools-label', t('tools.currency.label'));
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
  DOM.append(currencySection, currencySectionHeader, currencyRow);

  // ---- Theme section ----
  const themeSectionHeader = DOM.create('div', 'tools-section-header', t('tools.theme'));
  const themeSection = DOM.create('div', 'tools-section');

  const themes: Array<{ key: Theme; labelKey: string }> = [
    { key: 'dark-pro',   labelKey: 'theme.darkPro'   },
    { key: 'light-pro',  labelKey: 'theme.lightPro'  },
    { key: 'pastel',     labelKey: 'theme.pastel'    },
  ];

  themes.forEach(({ key, labelKey }) => {
    const btn = DOM.create('button', 'btn btn-theme', t(labelKey));
    btn.dataset.theme    = key;
    btn.dataset.labelKey = labelKey;
    btn.addEventListener('click', () => {
      useTaskStore.getState().setTheme(key);
    });
    DOM.append(themeSection, btn);
  });
  // Insert the section header before the buttons so it appears at the top
  themeSection.insertBefore(themeSectionHeader, themeSection.firstChild);

  // ---- Overlays section ----
  const overlaysSectionHeader = DOM.create('div', 'tools-section-header', t('tools.overlays'));
  const overlaysSection = DOM.create('div', 'tools-section');

  // F1 – Keyboard reference overlay
  const helpKeyRow   = DOM.create('div', 'tools-row');
  const helpKeyLabel = DOM.create('span', 'tools-label', t('tools.helpKey'));
  const helpKeyInput = DOM.create('input', 'form-input tools-help-key-input') as HTMLInputElement;
  helpKeyInput.type        = 'text';
  helpKeyInput.maxLength   = 20;
  helpKeyInput.value       = KeyboardConfigManager.get().helpKey;
  helpKeyInput.placeholder = 'e.g. F1';
  helpKeyInput.title       = 'Press a key to set the shortcut that opens the keyboard/mouse overlay';

  helpKeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    const key = e.key;
    if (key === 'Escape') { helpKeyInput.blur(); return; }
    helpKeyInput.value = key;
    KeyboardConfigManager.setHelpKey(key);
  });

  DOM.append(helpKeyRow, helpKeyLabel, helpKeyInput);

  const openHelpBtn = DOM.create('button', 'btn btn-secondary tools-open-help-btn', t('tools.openKeyboard'));
  openHelpBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-keyboard-overlay'));
  });

  // F2 – Concepts overlay
  const conceptsKeyRow   = DOM.create('div', 'tools-row');
  const conceptsKeyLabel = DOM.create('span', 'tools-label', t('tools.conceptsKey'));
  const conceptsKeyInput = DOM.create('input', 'form-input tools-help-key-input') as HTMLInputElement;
  conceptsKeyInput.type        = 'text';
  conceptsKeyInput.maxLength   = 20;
  conceptsKeyInput.value       = ConceptsConfigManager.get().conceptsKey;
  conceptsKeyInput.placeholder = 'e.g. F2';
  conceptsKeyInput.title       = 'Press a key to set the shortcut that opens the concepts & glossary overlay';

  conceptsKeyInput.addEventListener('keydown', (e) => {
    e.preventDefault();
    const key = e.key;
    if (key === 'Escape') { conceptsKeyInput.blur(); return; }
    conceptsKeyInput.value = key;
    ConceptsConfigManager.setConceptsKey(key);
  });

  DOM.append(conceptsKeyRow, conceptsKeyLabel, conceptsKeyInput);

  const openConceptsBtn = DOM.create('button', 'btn btn-secondary tools-open-help-btn', t('tools.openConcepts'));
  openConceptsBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-concepts-overlay'));
  });

  const openDataModelBtn = DOM.create('button', 'btn btn-secondary tools-open-help-btn', t('tools.openDataModel'));
  openDataModelBtn.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('open-datamodel-overlay'));
  });

  DOM.append(overlaysSection, overlaysSectionHeader, helpKeyRow, openHelpBtn, conceptsKeyRow, openConceptsBtn, openDataModelBtn);

  // ---- Language / Locale section ----
  const localeSectionHeader = DOM.create('div', 'tools-section-header', t('tools.locale'));
  const localeSection = DOM.create('div', 'tools-section');

  const countryRow    = DOM.create('div', 'tools-row');
  const countryLabel  = DOM.create('span', 'tools-label', t('tools.country'));
  const countrySelect = DOM.create('select', 'tools-currency-select') as HTMLSelectElement;

  COUNTRIES.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.code;
    opt.textContent = `${c.flag} ${c.name}`;
    countrySelect.appendChild(opt);
  });
  DOM.append(countryRow, countryLabel, countrySelect);

  const langRow    = DOM.create('div', 'tools-row');
  const langLabel  = DOM.create('span', 'tools-label', t('tools.language'));
  const langSelect = DOM.create('select', 'tools-currency-select') as HTMLSelectElement;
  DOM.append(langRow, langLabel, langSelect);

  // Pre-select country based on current locale
  function getCountryForLocale(locale: LocaleCode): string {
    const found = COUNTRIES.find((c) => c.locales.some((l) => l.code === locale));
    return found ? found.code : 'US';
  }

  function populateLangSelect(countryCode: string): void {
    DOM.clear(langSelect);
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (!country) return;
    country.locales.forEach(({ code, label }) => {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = label;
      if (code === getLocale()) opt.selected = true;
      langSelect.appendChild(opt);
    });
  }

  countrySelect.value = getCountryForLocale(getLocale());
  populateLangSelect(countrySelect.value);

  countrySelect.addEventListener('change', () => {
    populateLangSelect(countrySelect.value);
    const firstLocale = COUNTRIES.find((c) => c.code === countrySelect.value)?.locales[0]?.code;
    if (firstLocale && SUPPORTED_LOCALES.includes(firstLocale)) {
      setLocale(firstLocale);
    }
  });

  langSelect.addEventListener('change', () => {
    const code = langSelect.value as LocaleCode;
    if (SUPPORTED_LOCALES.includes(code)) setLocale(code);
  });

  DOM.append(localeSection, localeSectionHeader, countryRow, langRow);

  // Assemble inner
  DOM.append(
    inner,
    titleEl,
    searchSection,
    ioSection,
    displaySection,
    currencySection,
    themeSection,
    overlaysSection,
    localeSection,
  );
  DOM.append(col, toggleBtn, inner);

  // ---- Subscribe to store for live updates ----
  const updateFromStore = (): void => {
    const state = useTaskStore.getState();

    // Theme buttons
    themeSection.querySelectorAll<HTMLElement>('.btn-theme').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.theme === state.theme);
    });

    // Wheel zone value displays
    taskHeightVal.textContent = `${state.taskHeight}px`;

    // Currency selector
    currencySelect.value = state.mainCurrency;
  };

  // ---- Update locale strings ----
  onLocaleChange(() => {
    titleText.innerHTML = `Vibe Coded<br><strong>${t('app.subtitle')}</strong>`;
    toggleBtn.title = collapsed ? t('tools.expand') : t('tools.collapse');
    searchSectionHeader.textContent  = t('tools.searchFilter');
    ioSectionHeader.textContent      = t('tools.importExport');
    displaySectionHeader.textContent = t('tools.display');
    currencySectionHeader.textContent = t('tools.currency');
    themeSectionHeader.textContent   = t('tools.theme');
    overlaysSectionHeader.textContent = t('tools.overlays');
    localeSectionHeader.textContent  = t('tools.locale');
    taskHeightLabel.textContent      = t('tools.taskHeight');
    currencyLabel.textContent        = t('tools.currency.label');
    helpKeyLabel.textContent         = t('tools.helpKey');
    conceptsKeyLabel.textContent     = t('tools.conceptsKey');
    openHelpBtn.textContent          = t('tools.openKeyboard');
    openConceptsBtn.textContent      = t('tools.openConcepts');
    openDataModelBtn.textContent     = t('tools.openDataModel');
    countryLabel.textContent         = t('tools.country');
    langLabel.textContent            = t('tools.language');
    // Theme buttons
    themeSection.querySelectorAll<HTMLElement>('.btn-theme').forEach((btn) => {
      const key = btn.dataset.labelKey;
      if (key) btn.textContent = t(key);
    });
    // Re-populate lang select with translated labels
    const currentLang = langSelect.value as LocaleCode;
    populateLangSelect(countrySelect.value);
    langSelect.value = currentLang;
    // Sync locale selector to new locale
    const newCountry = getCountryForLocale(getLocale());
    countrySelect.value = newCountry;
  });

  useTaskStore.subscribe(updateFromStore);
  updateFromStore();

  // Trigger initial exchange rate fetch
  useTaskStore.getState().fetchExchangeRatesIfNeeded();

  return col;
};
