// Entry point for the Vibe Coded Task Manager
import './styles/main.css';
import { useTaskStore } from './store/taskStore';
import { ToolsColumn } from './components/ToolsColumn';
import { Timeline } from './components/Timeline';
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
const timeline = Timeline();

DOM.append(app, toolsColumn, timeline);

// Load persisted data
useTaskStore.getState().loadTasks();

// Apply initial theme and subscribe to theme changes
applyTheme(useTaskStore.getState().theme);
useTaskStore.subscribe((state) => applyTheme(state.theme));

