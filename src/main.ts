// Entry point for the Vibe Coded Task Manager
import './styles/main.css';
import { useTaskStore } from './store/taskStore';
import { useGroupStore } from './store/groupStore';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { FilterBar } from './components/FilterBar';
import { GroupPanel } from './components/GroupPanel';
import { DOM } from './utils/dom';

const app = DOM.getElementById('app');

// Header
const header = DOM.create('header', 'app-header');
header.innerHTML = `<h1>📋 Vibe Coded Task Manager</h1><p>Manage your tasks simply and efficiently</p>`;
DOM.append(app, header);

// Group panel
const groupPanel = GroupPanel();
DOM.append(app, groupPanel);

// Task form
const store = useTaskStore.getState();
const form = TaskForm((task) => store.addTask(task));
DOM.append(app, form);

// Filter bar
const filterBar = FilterBar();
DOM.append(app, filterBar);

// Stats bar
const statsBar = DOM.create('div', 'stats-bar');
DOM.append(app, statsBar);

const updateStats = (): void => {
  const tasks = useTaskStore.getState().tasks;
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  statsBar.innerHTML = `
    <div class="stat">Total: <strong>${total}</strong></div>
    <div class="stat">In Progress: <strong>${inProgress}</strong></div>
    <div class="stat">Done: <strong>${done}</strong></div>
  `;
};

useTaskStore.subscribe(updateStats);

// Task list
const taskListContainer = DOM.create('div', 'task-list');
DOM.append(app, taskListContainer);
TaskList(taskListContainer);

// Load persisted data
useGroupStore.getState().loadGroups();
useTaskStore.getState().loadTasks();
updateStats();
