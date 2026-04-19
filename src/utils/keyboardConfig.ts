/**
 * Keyboard & Mouse overlay configuration.
 * Stored in localStorage under a per-user key that is independent of task data.
 */

const STORAGE_KEY = 'user_keyboard_config';

/** Configuration for the help overlay. */
export interface KeyboardConfig {
  /** The keyboard key that opens the overlay (e.g. "F1"). */
  helpKey: string;
  /**
   * Map of binding identifier → user-visible description.
   * Keys follow the format produced by `buildBindingId`.
   */
  bindings: Record<string, string>;
}

// ---- Default descriptions ----
export const DEFAULT_BINDINGS: Record<string, string> = {
  // Mouse
  'mouse:left':         'Open task / Add task (click empty area)',
  'mouse:right':        '(no action)',
  'mouse:middle':       '(no action)',
  'mouse:wheel-up':     'Scroll up',
  'mouse:wheel-down':   'Scroll down',
  'mouse:wheel-left':   'Pan timeline left',
  'mouse:wheel-right':  'Pan timeline right',
  // Keyboard
  'key:F1':             'Open keyboard help overlay',
  'key:Escape':         'Close modal / overlay',
  'key:Ctrl+Wheel':     'Horizontal zoom (keep cursor position)',
  'key:Shift+Wheel':    'Vertical zoom',
};

export const DEFAULT_HELP_KEY = 'F1';

function load(): KeyboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<KeyboardConfig>;
      return {
        helpKey: parsed.helpKey ?? DEFAULT_HELP_KEY,
        bindings: { ...DEFAULT_BINDINGS, ...(parsed.bindings ?? {}) },
      };
    }
  } catch {
    // ignore parse errors
  }
  return { helpKey: DEFAULT_HELP_KEY, bindings: { ...DEFAULT_BINDINGS } };
}

function save(config: KeyboardConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }
}

// Singleton in-memory config
let _config: KeyboardConfig = load();

export const KeyboardConfigManager = {
  get(): KeyboardConfig {
    return _config;
  },

  setHelpKey(key: string): void {
    _config = { ..._config, helpKey: key };
    save(_config);
  },

  setBinding(id: string, description: string): void {
    _config = { ..._config, bindings: { ..._config.bindings, [id]: description } };
    save(_config);
  },

  getBinding(id: string): string {
    return _config.bindings[id] ?? '';
  },

  reload(): void {
    _config = load();
  },
};

/**
 * Convert a WheelEvent modifier + direction into a binding id string.
 * Used to map keydown events to the config keys shown in the overlay.
 */
export function keyEventToBindingId(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(e.key);
  return `key:${parts.join('+')}`;
}
