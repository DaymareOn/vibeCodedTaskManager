import { DOM } from '../utils/dom';
import { KeyboardConfigManager, DEFAULT_BINDINGS, DEFAULT_HELP_KEY } from '../utils/keyboardConfig';

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
    [']',   'key:]]',  1],   ['\\', 'key:\\\\', 1.5],
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
  return key;
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
  overlay.setAttribute('aria-label', 'Keyboard & Mouse reference');
  overlay.setAttribute('aria-modal', 'true');

  // ---- Close on backdrop click ----
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ---- Inner panel ----
  const panel = DOM.create('div', 'ko-panel');

  // Title bar
  const titleBar = DOM.create('div', 'ko-title-bar');
  const title    = DOM.create('h2', 'ko-title', '⌨ Keyboard & Mouse Reference');
  const hint     = DOM.create('span', 'ko-hint', 'Click a key to edit its description. Press Esc to close.');
  const closeBtn = DOM.create('button', 'ko-close-btn', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';
  closeBtn.addEventListener('click', close);
  DOM.append(titleBar, title, hint, closeBtn);

  // Keyboard grid
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
  const combosTitle   = DOM.create('div', 'ko-combos-title', '⚡ Modifier + Scroll Wheel');
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

  // Mouse diagram
  const mouseSection  = DOM.create('div', 'ko-mouse-section');
  const mouseTitle    = DOM.create('div', 'ko-mouse-title', '🖱 Mouse');
  const mouseDiagram  = DOM.create('div', 'ko-mouse-diagram');

  const mouseButtons  = DOM.create('div', 'ko-mouse-buttons');
  const leftBtn   = buildMouseButton('Left\nClick',     'mouse:left');
  const middleBtn = buildMouseButton('Middle\n/ Scroll', 'mouse:middle');
  const rightBtn  = buildMouseButton('Right\nClick',    'mouse:right');
  DOM.append(mouseButtons, leftBtn, middleBtn, rightBtn);

  const mouseScrolls = DOM.create('div', 'ko-mouse-scrolls');
  const scrollEntries: Array<[string, string]> = [
    ['↑ Scroll up',    'mouse:wheel-up'],
    ['↓ Scroll down',  'mouse:wheel-down'],
    ['← Scroll left',  'mouse:wheel-left'],
    ['→ Scroll right', 'mouse:wheel-right'],
  ];
  scrollEntries.forEach(([label, id]) => {
    const sb = DOM.create('div', 'ko-key ko-scroll-key');
    sb.dataset.binding = id;
    const sl = DOM.create('span', 'ko-key-label', label);
    const sd = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(id));
    DOM.append(sb, sl, sd);
    DOM.append(mouseScrolls, sb);
  });

  DOM.append(mouseDiagram, mouseButtons, mouseScrolls);
  DOM.append(mouseSection, mouseTitle, mouseDiagram);

  // ---- Inline edit ----
  let editingEl: HTMLElement | null = null;
  let editInput: HTMLInputElement | null = null;

  function startEdit(keyEl: HTMLElement): void {
    if (editingEl === keyEl) return;
    cancelEdit();

    editingEl = keyEl;
    keyEl.classList.add('ko-key-editing');
    const descEl = keyEl.querySelector('.ko-key-desc') as HTMLElement;
    const bindingId = keyEl.dataset.binding ?? '';

    editInput = DOM.create('input', 'ko-key-edit-input') as HTMLInputElement;
    editInput.type  = 'text';
    editInput.value = KeyboardConfigManager.getBinding(bindingId);
    editInput.placeholder = 'Describe this key…';

    editInput.addEventListener('keydown', (e) => {
      e.stopPropagation(); // prevent the keydown from triggering app shortcuts
      if (e.key === 'Enter') confirmEdit();
      if (e.key === 'Escape') cancelEdit();
    });
    editInput.addEventListener('blur', confirmEdit);

    descEl.replaceWith(editInput);
    editInput.focus();
    editInput.select();
  }

  function confirmEdit(): void {
    if (!editingEl || !editInput) return;
    const bindingId = editingEl.dataset.binding ?? '';
    const newVal    = editInput.value.trim();
    KeyboardConfigManager.setBinding(bindingId, newVal);

    const newDesc = DOM.create('span', 'ko-key-desc', newVal);
    editInput.replaceWith(newDesc);
    editingEl.classList.remove('ko-key-editing');
    editingEl = null;
    editInput = null;
  }

  function cancelEdit(): void {
    if (!editingEl || !editInput) return;
    const bindingId = editingEl.dataset.binding ?? '';
    const newDesc = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(bindingId));
    editInput.replaceWith(newDesc);
    editingEl.classList.remove('ko-key-editing');
    editingEl = null;
    editInput = null;
  }

  // Delegate click to any .ko-key
  panel.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.ko-key') as HTMLElement | null;
    if (target) startEdit(target);
  });

  // ---- Assemble ----
  DOM.append(panel, titleBar, kbd, combosSection, mouseSection);
  DOM.append(overlay, panel);

  // ---- API ----
  let _open = false;

  function open(): void {
    _open = true;
    overlay.classList.remove('hidden');
    overlay.focus();
  }

  function close(): void {
    cancelEdit();
    _open = false;
    overlay.classList.add('hidden');
  }

  function refresh(): void {
    panel.querySelectorAll<HTMLElement>('.ko-key').forEach((keyEl) => {
      if (keyEl === editingEl) return; // skip currently-edited key
      const id = keyEl.dataset.binding ?? '';
      const descEl = keyEl.querySelector('.ko-key-desc') as HTMLElement | null;
      if (descEl) descEl.textContent = KeyboardConfigManager.getBinding(id);
    });
  }

  return { element: overlay, open, close, isOpen: () => _open, refresh };
};

// ─── Mouse button helper ─────────────────────────────────────────────────────
function buildMouseButton(label: string, bindingId: string): HTMLElement {
  const btn = DOM.create('div', 'ko-key ko-mouse-btn');
  btn.dataset.binding = bindingId;
  const lbl  = DOM.create('span', 'ko-key-label', label);
  const desc = DOM.create('span', 'ko-key-desc', KeyboardConfigManager.getBinding(bindingId));
  DOM.append(btn, lbl, desc);
  return btn;
}

/** The reset-to-defaults helper, exported for use in ToolsColumn. */
export function resetOverlayDefaults(): void {
  Object.entries(DEFAULT_BINDINGS).forEach(([id, val]) => {
    KeyboardConfigManager.setBinding(id, val);
  });
  KeyboardConfigManager.setHelpKey(DEFAULT_HELP_KEY);
}
