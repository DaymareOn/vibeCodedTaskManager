/**
 * Internationalisation (I18N) utility.
 * Supports US English (en-US) and French France (fr-FR).
 * The active locale is saved in localStorage and defaults to the browser locale.
 */
import { en_US } from '../locales/en-US';
import { fr_FR } from '../locales/fr-FR';

export type LocaleCode = 'en-US' | 'fr-FR';

const STORAGE_KEY = 'user_locale';

const LOCALES: Record<LocaleCode, Record<string, string>> = {
  'en-US': en_US,
  'fr-FR': fr_FR,
};

/** All supported locale codes */
export const SUPPORTED_LOCALES: LocaleCode[] = ['en-US', 'fr-FR'];

/** Detect the best matching supported locale from the browser. */
function detectBrowserLocale(): LocaleCode {
  const candidates = navigator.languages ?? [navigator.language];
  for (const lang of candidates) {
    // Exact match first
    if (SUPPORTED_LOCALES.includes(lang as LocaleCode)) return lang as LocaleCode;
    // Prefix match (e.g. "fr" → "fr-FR")
    const prefix = lang.split('-')[0].toLowerCase();
    const match = SUPPORTED_LOCALES.find((l) => l.toLowerCase().startsWith(prefix));
    if (match) return match;
  }
  return 'en-US';
}

function loadLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as LocaleCode)) return stored as LocaleCode;
  } catch {
    // ignore
  }
  return detectBrowserLocale();
}

let _locale: LocaleCode = loadLocale();
const _listeners = new Set<() => void>();

/** Subscribe to locale changes. Returns an unsubscribe function. */
export function onLocaleChange(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function notifyListeners(): void {
  _listeners.forEach((fn) => fn());
}

/** Get the current active locale code. */
export function getLocale(): LocaleCode {
  return _locale;
}

/** Set the active locale and save it to localStorage. */
export function setLocale(code: LocaleCode): void {
  if (code === _locale) return;
  _locale = code;
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // ignore quota errors
  }
  notifyListeners();
}

/**
 * Translate a key to the current locale string.
 * Supports simple `{placeholder}` interpolation.
 * Falls back to the en-US string, then the key itself.
 */
export function t(key: string, params?: Record<string, string>): string {
  const map = LOCALES[_locale];
  let str = map[key] ?? LOCALES['en-US'][key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.split(`{${k}}`).join(v);
    });
  }
  return str;
}

/**
 * Create a live <span> element whose text content automatically updates
 * when the locale changes.
 */
export function liveT(key: string, params?: Record<string, string>): HTMLElement {
  const span = document.createElement('span');
  span.className = 'i18n-live';
  const update = (): void => { span.textContent = t(key, params); };
  update();
  onLocaleChange(update);
  return span;
}
