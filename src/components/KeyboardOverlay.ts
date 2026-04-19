import { DOM } from '../utils/dom';
import { KeyboardConfigManager, DEFAULT_BINDINGS, DEFAULT_HELP_KEY } from '../utils/keyboardConfig';
import { t, onLocaleChange } from '../utils/i18n';
import { getInputDevice, onInputDeviceChange, type InputDevice } from '../utils/deviceDetect';

// ─── Key layout definitions ──────────────────────────────────────────────────
// Each row is an array of [label, bindingId, widthMultiplier?]
type KeyDef = [label: string, bindingId: string, w?: number];

const KB_ROWS: KeyDef[][] = [
  // Row 0: Esc + F-row
  [
    ['Esc',  'key:Escape', 1],
    ['F1',   'key:F1',     1], ['F2',  'key:F2',  1], ['F3',  'key:F3',  1], ['F4',  'key:F4',  1],
    ['F5',   'key:F5',     1], ['F6',  'key:F6',  1], ['F7',  'key:F7',  1], ['F8',  'key:F8',  1],
    ['F9',   'key:F9',     1], ['F10', 'key:F10', 1], ['F11', 'key:F11', 1], ['F12', 'key:F12', 1],
  ],
  // Row 1: Numbers
  [
    ['`',  'key:`',  1], ['1', 'key:1', 1], ['2', 'key:2', 1], ['3', 'key:3', 1],
    ['4',  'key:4',  1], ['5', 'key:5', 1], ['6', 'key:6', 1], ['7', 'key:7', 1],
    ['8',  'key:8',  1], ['9', 'key:9', 1], ['0', 'key:0', 1], ['-', 'key:-', 1],
    ['=',  'key:=',  1], ['⌫ Backspace', 'key:Backspace', 2],
  ],
  // Row 2: QWERTY
  [
    ['Tab', 'key:Tab', 1.5], ['Q', 'key:q', 1], ['W', 'key:w', 1], ['E', 'key:e', 1],
    ['R',   'key:r',   1],   ['T', 'key:t', 1], ['Y', 'key:y', 1], ['U', 'key:u', 1],
    ['I',   'key:i',   1],   ['O', 'key:o', 1], ['P', 'key:p', 1], ['[', 'key:[', 1],
    [']',   'key:]',   1],   ['\\', 'key:\\', 1.5],
  ],
  // Row 3: ASDF
  [
    ['Caps', 'key:CapsLock', 1.75], ['A', 'key:a', 1], ['S', 'key:s', 1], ['D', 'key:d', 1],
    ['F',    'key:f',        1],    ['G', 'key:g', 1], ['H', 'key:h', 1], ['J', 'key:j', 1],
    ['K',    'key:k',        1],    ['L', 'key:l', 1], [';', 'key:;', 1], ["'", "key:'", 1],
    ['↵ Enter', 'key:Enter', 2.25],
  ],
  // Row 4: ZXCV
  [
    ['⇧ Shift', 'key:Shift', 2.25], ['Z', 'key:z', 1], ['X', 'key:x', 1], ['C', 'key:c', 1],
    ['V',       'key:v',     1],    ['B', 'key:b', 1], ['N', 'key:n', 1], ['M', 'key:m', 1],
    [',',       'key:,',     1],    ['.', 'key:.', 1], ['/', 'key:/', 1],
    ['⇧ Shift', 'key:Shift', 2.75],
  ],
  // Row 5: Modifiers + Space
  [
    ['Ctrl',  'key:Control', 1.5], ['Alt', 'key:Alt', 1.25],
    ['Space', 'key: ',        6],
    ['Alt',   'key:Alt',      1.25], ['Ctrl', 'key:Control', 1.5],
  ],
];

// ─── Helper: build one keyboard key element ───────────────────────────────────
function buildKey(label: string, bindingId: string, widthUnits: number): HTMLElement {
  const key = DOM.create('div', 'ko-key');
  key.dataset.binding = bindingId;
  key.style.flexBasis = `${widthUnits * 36}px`;
  key.style.minWidth  = `${widthUnits * 36}px`;

  const keyLabel = DOM.create('span', 'ko-key-label', label);
  const desc     = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(bindingId));
  DOM.append(key, keyLabel, desc);

  // Dim keys with no binding
  if (!KeyboardConfigManager.getBinding(bindingId)) {
    key.classList.add('ko-key-unused');
  }

  return key;
}

// ─── Graphical mouse SVG builder ─────────────────────────────────────────────
function buildMouseGraphic(): HTMLElement {
  const wrapper = DOM.create('div', 'ko-mouse-graphic-wrapper');

  // SVG mouse shape
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ko-mouse-svg');
  svg.setAttribute('viewBox', '0 0 120 180');
  svg.setAttribute('aria-hidden', 'true');

  // Mouse body
  const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  body.setAttribute('x', '10');
  body.setAttribute('y', '50');
  body.setAttribute('width', '100');
  body.setAttribute('height', '120');
  body.setAttribute('rx', '50');
  body.setAttribute('ry', '50');
  body.setAttribute('class', 'ko-mouse-body');

  // Left button
  const leftBtn = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leftBtn.setAttribute('d', 'M 10,50 Q 10,20 60,15 L 60,75 L 10,75 Z');
  leftBtn.setAttribute('class', 'ko-mouse-left');
  leftBtn.setAttribute('data-binding', 'mouse:left');

  // Right button
  const rightBtn = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  rightBtn.setAttribute('d', 'M 110,50 Q 110,20 60,15 L 60,75 L 110,75 Z');
  rightBtn.setAttribute('class', 'ko-mouse-right');
  rightBtn.setAttribute('data-binding', 'mouse:right');

  // Middle button / scroll wheel
  const middleBtn = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  middleBtn.setAttribute('x', '48');
  middleBtn.setAttribute('y', '20');
  middleBtn.setAttribute('width', '24');
  middleBtn.setAttribute('height', '40');
  middleBtn.setAttribute('rx', '12');
  middleBtn.setAttribute('class', 'ko-mouse-middle');
  middleBtn.setAttribute('data-binding', 'mouse:middle');

  // Dividing line
  const divLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  divLine.setAttribute('x1', '60');
  divLine.setAttribute('y1', '15');
  divLine.setAttribute('x2', '60');
  divLine.setAttribute('y2', '75');
  divLine.setAttribute('class', 'ko-mouse-divider');

  DOM.append(svg as unknown as HTMLElement,
    body as unknown as HTMLElement,
    leftBtn as unknown as HTMLElement,
    rightBtn as unknown as HTMLElement,
    middleBtn as unknown as HTMLElement,
    divLine as unknown as HTMLElement,
  );

  // Labels for mouse parts
  const labels = DOM.create('div', 'ko-mouse-labels');

  const partsData: Array<{ binding: string; label: string; cssClass: string }> = [
    { binding: 'mouse:left',        label: '← Left',       cssClass: 'ko-mlabel-left'   },
    { binding: 'mouse:middle',      label: '⊙ Middle',     cssClass: 'ko-mlabel-middle' },
    { binding: 'mouse:right',       label: 'Right →',      cssClass: 'ko-mlabel-right'  },
    { binding: 'mouse:wheel-up',    label: '↑ Scroll up',  cssClass: 'ko-mlabel-wheel'  },
    { binding: 'mouse:wheel-down',  label: '↓ Scroll down',cssClass: 'ko-mlabel-wheel'  },
    { binding: 'mouse:wheel-left',  label: '← Scroll left',cssClass: 'ko-mlabel-wheel'  },
    { binding: 'mouse:wheel-right', label: '→ Scroll right',cssClass: 'ko-mlabel-wheel' },
  ];

  partsData.forEach(({ binding, label, cssClass }) => {
    const row = DOM.create('div', `ko-mouse-label-row ${cssClass}`);
    row.dataset.binding = binding;
    const lbl  = DOM.create('span', 'ko-mouse-part-label', label);
    const desc = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(binding));
    DOM.append(row, lbl, desc);
    DOM.append(labels, row);
  });

  DOM.append(wrapper, svg as unknown as HTMLElement, labels);
  return wrapper;
}

// ─── Touchpad diagram ─────────────────────────────────────────────────────────
function buildTrackpadSection(): HTMLElement {
  const section = DOM.create('div', 'ko-trackpad-section');
  const title   = DOM.create('div', 'ko-mouse-title', t('keyboard.touchpad'));

  const pad = DOM.create('div', 'ko-trackpad-graphic');

  const gestures: Array<[string, string]> = [
    ['↕ Two-finger scroll',          'mouse:wheel-up'],
    ['↔ Two-finger swipe',           'mouse:wheel-left'],
    ['Pinch / spread',                'key:Ctrl+Wheel'],
    ['Click',                         'mouse:left'],
    ['Two-finger click (right-click)','mouse:right'],
  ];

  gestures.forEach(([label, id]) => {
    const row = DOM.create('div', 'ko-key ko-scroll-key');
    row.dataset.binding = id;
    const sl = DOM.create('span', 'ko-key-label', label);
    const sd = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(id));
    DOM.append(row, sl, sd);
    DOM.append(pad, row);
  });

  DOM.append(section, title, pad);
  return section;
}

// ─── Touch / smartphone section ───────────────────────────────────────────────
function buildTouchSection(): HTMLElement {
  const section = DOM.create('div', 'ko-touch-section');
  const title   = DOM.create('div', 'ko-mouse-title', t('keyboard.touch'));

  const gestures: Array<[string, string]> = [
    ['Tap',                       'mouse:left'],
    ['Long press',                'mouse:right'],
    ['Swipe up/down',             'mouse:wheel-up'],
    ['Swipe left/right',         'mouse:wheel-left'],
    ['Pinch / spread',            'key:Ctrl+Wheel'],
    ['Two-finger tap',            'mouse:middle'],
  ];

  gestures.forEach(([label, id]) => {
    const row = DOM.create('div', 'ko-key ko-scroll-key');
    row.dataset.binding = id;
    const sl = DOM.create('span', 'ko-key-label', label);
    const sd = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(id));
    DOM.append(row, sl, sd);
    DOM.append(section, row);
  });

  DOM.append(section, title);
  // Re-insert title before the rows
  section.insertBefore(title, section.firstChild);
  return section;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export interface KeyboardOverlayApi {
  /** Container element – mount once in main.ts. */
  element: HTMLElement;
  /** Show the overlay. */
  open(): void;
  /** Hide the overlay. */
  close(): void;
  /** Whether the overlay is currently visible. */
  isOpen(): boolean;
  /** Refresh text (call after config changes). */
  refresh(): void;
}

export const KeyboardOverlay = (): KeyboardOverlayApi => {
  const overlay = DOM.create('div', 'ko-overlay hidden');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // ---- Close on backdrop click ----
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ---- Inner panel ----
  const panel = DOM.create('div', 'ko-panel');

  // Title bar
  const titleBar = DOM.create('div', 'ko-title-bar');
  const title    = DOM.create('h2', 'ko-title', t('keyboard.title'));
  const hint     = DOM.create('span', 'ko-hint', t('keyboard.closeHint'));
  const closeBtn = DOM.create('button', 'ko-close-btn', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';
  closeBtn.addEventListener('click', close);
  DOM.append(titleBar, title, hint, closeBtn);

  // ---- Keyboard grid (always shown for devices with keyboards) ----
  const kbSection = DOM.create('div', 'ko-kb-section');
  const kbd = DOM.create('div', 'ko-keyboard');
  KB_ROWS.forEach((row) => {
    const rowEl = DOM.create('div', 'ko-row');
    row.forEach(([label, bindingId, w]) => {
      DOM.append(rowEl, buildKey(label, bindingId, w ?? 1));
    });
    DOM.append(kbd, rowEl);
  });

  // Modifier combos (Ctrl+Wheel, Shift+Wheel)
  const combosSection = DOM.create('div', 'ko-combos-section');
  const combosTitle   = DOM.create('div', 'ko-combos-title', t('keyboard.modifierScroll'));
  const combos: Array<[string, string]> = [
    ['Ctrl + ↕ Wheel', 'key:Ctrl+Wheel'],
    ['Shift + ↕ Wheel', 'key:Shift+Wheel'],
  ];
  const combosGrid = DOM.create('div', 'ko-combos-grid');
  combos.forEach(([label, id]) => {
    const combo = DOM.create('div', 'ko-key ko-combo-key');
    combo.dataset.binding = id;
    const comboLabel = DOM.create('span', 'ko-key-label', label);
    const comboDesc  = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(id));
    DOM.append(combo, comboLabel, comboDesc);
    DOM.append(combosGrid, combo);
  });
  DOM.append(combosSection, combosTitle, combosGrid);
  DOM.append(kbSection, kbd, combosSection);

  // ---- Pointer input sections (only one shown at a time based on device) ----
  const mouseSection    = DOM.create('div', 'ko-mouse-section');
  const mouseTitleEl    = DOM.create('div', 'ko-mouse-title', t('keyboard.mouse'));
  const mouseGraphic    = buildMouseGraphic();
  DOM.append(mouseSection, mouseTitleEl, mouseGraphic);

  const trackpadSection = buildTrackpadSection();
  const touchSection    = buildTouchSection();

  // ---- Assemble (initial) ----
  DOM.append(panel, titleBar, kbSection, mouseSection, trackpadSection, touchSection);
  DOM.append(overlay, panel);

  // ---- Show/hide sections based on detected input device ----
  function updateDeviceSections(device: InputDevice): void {
    const isTouch    = device === 'touchscreen' || device === 'smartphone';
    const isTrackpad = device === 'trackpad';

    // Keyboard section: hide for touch-only (smartphone)
    kbSection.style.display = device === 'smartphone' ? 'none' : '';

    mouseSection.style.display    = (!isTouch && !isTrackpad) ? '' : 'none';
    trackpadSection.style.display = isTrackpad ? '' : 'none';
    touchSection.style.display    = isTouch ? '' : 'none';
  }

  updateDeviceSections(getInputDevice());
  onInputDeviceChange(updateDeviceSections);

  // ---- Update locale ----
  onLocaleChange(() => {
    title.textContent     = t('keyboard.title');
    hint.textContent      = t('keyboard.closeHint');
    combosTitle.textContent = t('keyboard.modifierScroll');
    mouseTitleEl.textContent = t('keyboard.mouse');
    trackpadSection.querySelector('.ko-mouse-title')!.textContent = t('keyboard.touchpad');
    touchSection.querySelector('.ko-mouse-title')!.textContent    = t('keyboard.touch');
  });

  // ---- API ----
  let _open = false;

  function open(): void {
    _open = true;
    overlay.classList.remove('hidden');
    overlay.focus();
  }

  function close(): void {
    _open = false;
    overlay.classList.add('hidden');
  }

  function refresh(): void {
    panel.querySelectorAll<HTMLElement>('.ko-key').forEach((keyEl) => {
      const id = keyEl.dataset.binding ?? '';
      const descEl = keyEl.querySelector('.ko-key-desc') as HTMLElement | null;
      if (descEl) descEl.textContent = KeyboardConfigManager.getBinding(id);
      // Update unused state
      const hasDesc = !!KeyboardConfigManager.getBinding(id);
      keyEl.classList.toggle('ko-key-unused', !hasDesc);
    });
    // Also refresh mouse label rows
    panel.querySelectorAll<HTMLElement>('.ko-mouse-label-row').forEach((row) => {
      const id = row.dataset.binding ?? '';
      const descEl = row.querySelector('.ko-key-desc') as HTMLElement | null;
      if (descEl) descEl.textContent = KeyboardConfigManager.getBinding(id);
    });
  }

  return { element: overlay, open, close, isOpen: () => _open, refresh };
};

// ─── Mouse button helper (kept for potential external use) ────────────────────
function buildMouseButton(label: string, bindingId: string): HTMLElement {
  const btn = DOM.create('div', 'ko-key ko-mouse-btn');
  btn.dataset.binding = bindingId;
  const lbl  = DOM.create('span', 'ko-key-label', label);
  const desc = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(bindingId));
  DOM.append(btn, lbl, desc);
  return btn;
}
void buildMouseButton; // suppress unused warning

/** The reset-to-defaults helper, exported for use in ToolsColumn. */
export function resetOverlayDefaults(): void {
  Object.entries(DEFAULT_BINDINGS).forEach(([id, val]) => {
    KeyboardConfigManager.setBinding(id, val);
  });
  KeyboardConfigManager.setHelpKey(DEFAULT_HELP_KEY);
}
