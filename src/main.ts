// Entry point for the Vibe Coded Task Manager
import './styles/main.css';
import { useTaskStore } from './store/taskStore';
import { ToolsColumn } from './components/ToolsColumn';
import { EditTaskColumn } from './components/EditTaskColumn';
import { Timeline } from './components/Timeline';
import { KeyboardOverlay } from './components/KeyboardOverlay';
import { ConceptsOverlay } from './components/ConceptsOverlay';
import { TaskForm } from './components/TaskForm';
import { KeyboardConfigManager } from './utils/keyboardConfig';
import { ConceptsConfigManager } from './utils/conceptsConfig';
import { DataModelOverlay } from './components/DataModelOverlay';
import { DOM } from './utils/dom';
import { showModal } from './utils/modal';
import { t } from './utils/i18n';
import type { Theme } from './store/taskStore';
import { computeBoostedScores } from './utils/priority';

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

const toolsColumn     = ToolsColumn();
const editTaskColumn  = EditTaskColumn();
const { element: timelineEl, getHoveredTaskId } = Timeline(editTaskColumn.openTask);
const keyboardOverlay = KeyboardOverlay();
const conceptsOverlay = ConceptsOverlay();
const dataModelOverlay = DataModelOverlay();

DOM.append(app, toolsColumn, timelineEl, editTaskColumn.element);
// Overlays are mounted at body level so they sit above everything
document.body.appendChild(keyboardOverlay.element);
document.body.appendChild(conceptsOverlay.element);
document.body.appendChild(dataModelOverlay.element);

// Load persisted data
useTaskStore.getState().loadTasks();

// Apply initial theme and subscribe to theme changes
applyTheme(useTaskStore.getState().theme);
useTaskStore.subscribe((state: { theme: Theme }) => applyTheme(state.theme));

// ---- Global keyboard shortcuts ----
document.addEventListener('keydown', (e) => {
  // Escape closes whichever overlay is currently open
  if (e.key === 'Escape') {
    if (keyboardOverlay.isOpen()) { keyboardOverlay.close(); return; }
    if (conceptsOverlay.isOpen()) { conceptsOverlay.close(); return; }
    if (dataModelOverlay.isOpen()) { dataModelOverlay.close(); return; }
    return;
  }

  // Don't trigger shortcuts while typing in an input / textarea / select
  const tag = (e.target as HTMLElement).tagName;
  const isTextFocused = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

  // ---- Up/Down arrow navigation between tasks by priority (when edit column is open) ----
  if (!isTextFocused && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
    const currentId = editTaskColumn.getCurrentTaskId();
    if (currentId) {
      const tasks = useTaskStore.getState().getFilteredTasks();
      const allTasks = useTaskStore.getState().tasks;
      const { mainCurrency, exchangeRates } = useTaskStore.getState();
      const boostedScores = computeBoostedScores(allTasks, mainCurrency, exchangeRates);
      // Sort by boosted priority score descending (highest priority first)
      const scored = tasks
        .map((task: import('./types/Task').Task) => ({ task, score: boostedScores.get(task.id) ?? 0 }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score);

      const currentIdx = scored.findIndex((s: { task: import('./types/Task').Task }) => s.task.id === currentId);
      if (currentIdx !== -1) {
        let nextIdx: number;
        if (e.key === 'ArrowUp') {
          // Up = higher priority = lower index
          nextIdx = currentIdx - 1;
        } else {
          // Down = lower priority = higher index
          nextIdx = currentIdx + 1;
        }
        if (nextIdx >= 0 && nextIdx < scored.length) {
          e.preventDefault();
          editTaskColumn.openTask(scored[nextIdx].task);
          return;
        }
      }
    }
  }

  if (isTextFocused) return;

  if (!isTextFocused && e.key === 'c') {
    e.preventDefault();
    const hoveredTaskId = getHoveredTaskId();
    const tasks = useTaskStore.getState().tasks;
    const hoveredTask = hoveredTaskId ? tasks.find((task) => task.id === hoveredTaskId) : null;

    if (hoveredTask) {
      // eslint-disable-next-line prefer-const
      let closeSub: () => void;
      const subForm = TaskForm(
        (subData) => {
          useTaskStore.getState().addTask({ ...subData, parentId: hoveredTask.id });
          closeSub();
        },
        undefined,
        t('form.addSubTask'),
      );
      closeSub = showModal(subForm.element);
    } else {
      // eslint-disable-next-line prefer-const
      let closeAdd: () => void;
      const addForm = TaskForm(
        (taskData) => {
          useTaskStore.getState().addTask(taskData);
          closeAdd();
        },
        undefined,
        t('form.addTask'),
      );
      closeAdd = showModal(addForm.element);
    }
    return;
  }

  const helpKey     = KeyboardConfigManager.get().helpKey;
  const conceptsKey = ConceptsConfigManager.get().conceptsKey;

  if (e.key === helpKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    if (!conceptsOverlay.isOpen()) keyboardOverlay.open();
    return;
  }

  if (e.key === conceptsKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    if (!keyboardOverlay.isOpen()) conceptsOverlay.open();
    return;
  }

  if (e.key === 'F3' && !e.ctrlKey && !e.altKey && !e.metaKey) {
    e.preventDefault();
    if (!conceptsOverlay.isOpen() && !keyboardOverlay.isOpen()) dataModelOverlay.open();
    return;
  }
});

// ---- Custom events from ToolsColumn buttons ----
document.addEventListener('open-keyboard-overlay', () => { keyboardOverlay.open(); });
document.addEventListener('open-concepts-overlay', () => { conceptsOverlay.open(); });
document.addEventListener('open-datamodel-overlay', () => { dataModelOverlay.open(); });

