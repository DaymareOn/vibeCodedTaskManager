// Entry point for the Vibe Coded Task Manager
import './styles/main.css';
import { useTaskStore } from './store/taskStore';
import { ToolsColumn } from './components/ToolsColumn';
import { EditTaskColumn } from './components/EditTaskColumn';
import { Timeline } from './components/Timeline';
import { KeyboardOverlay } from './components/KeyboardOverlay';
import { KeyboardConfigManager } from './utils/keyboardConfig';
import { DOM } from './utils/dom';
import type { Theme } from './store/taskStore';

// Apply theme class to <html>
function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  html.className = html.className
    .split(' ')
    .filter((c) => !c.startsWith('theme-'))
    .join(' ');
  html.classList.add(`theme-${theme}`);
}

const app = DOM.getElementById('app');
app.className = 'app-layout';

const toolsColumn = ToolsColumn();
const editTaskColumn = EditTaskColumn();
const timeline = Timeline(editTaskColumn.openTask);
const keyboardOverlay = KeyboardOverlay();

DOM.append(app, toolsColumn, timeline, editTaskColumn.element);
// Overlay is mounted at body level so it sits above everything
document.body.appendChild(keyboardOverlay.element);

// Load persisted data
useTaskStore.getState().loadTasks();

// Apply initial theme and subscribe to theme changes
applyTheme(useTaskStore.getState().theme);
useTaskStore.subscribe((state) => applyTheme(state.theme));

// ---- Global keyboard shortcut for the overlay ----
document.addEventListener('keydown', (e) => {
  const helpKey = KeyboardConfigManager.get().helpKey;
  // If the overlay is open, only respond to Escape (close)
  if (keyboardOverlay.isOpen()) {
    // Esc is handled inside KeyboardOverlay itself
    return;
  }
  if (e.key === helpKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    keyboardOverlay.open();
  }
});

// ---- Custom event from ToolsColumn "Open overlay" button ----
document.addEventListener('open-keyboard-overlay', () => {
  keyboardOverlay.open();
});

