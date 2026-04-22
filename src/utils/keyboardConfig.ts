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
  'mouse:left':         'Open task (click task bar) / Add task (click empty area)',
  'mouse:right':        '(no action)',
  'mouse:middle':       '(no action)',
  'mouse:wheel-up':     'Scroll tasks up',
  'mouse:wheel-down':   'Scroll tasks down',
  'mouse:wheel-left':   'Pan timeline left (touchpad horizontal swipe)',
  'mouse:wheel-right':  'Pan timeline right (touchpad horizontal swipe)',
  // Keyboard
  'key:F1':             'Open keyboard & mouse reference overlay',
  'key:F2':             'Open concepts & glossary overlay',
  'key:F3':             'Open data model class diagram overlay',
  'key:Escape':         'Close modal / overlay',
  'key:ArrowLeft':      'History scrubber: go to previous recorded version (when scrubber is focused)',
  'key:ArrowRight':     'History scrubber: go to next recorded version (when scrubber is focused)',
  'key:ArrowUp':        'Navigate to next-higher-priority task (when Edit column is open, no text field focused)',
  'key:ArrowDown':      'Navigate to next-lower-priority task (when Edit column is open, no text field focused)',
  'key:d':              'Delete focused task (when Edit column is open, no text field focused)',
  'key:c':              'Create new task on Timeline, or sub-task when hovering a task bar',
  'key:Ctrl+Wheel':     'Horizontal zoom (keeps the time under the cursor fixed)',
  'key:Shift+Wheel':    'Vertical zoom (adjusts task bar height)',
};

export const DEFAULT_HELP_KEY = 'F1';

function load(): KeyboardConfig {
  if (typeof localStorage === 'undefined') {
    // Running outside a browser (e.g. Node.js test environment) – return defaults.
    return { helpKey: DEFAULT_HELP_KEY, bindings: { ...DEFAULT_BINDINGS } };
  }
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
