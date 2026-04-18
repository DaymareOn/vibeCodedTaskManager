import type { Task } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { computePriorityScore, computeTaskValue, formatMoney } from '../utils/priority';
import { TaskForm } from './TaskForm';

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
};

/** Show a modal overlay with the given content. Returns a function to close it. */
function showModal(content: HTMLElement): () => void {
  const overlay = DOM.create('div', 'modal-overlay');
  const box = DOM.create('div', 'modal-box');
  const closeBtn = DOM.create('button', 'modal-close btn btn-secondary', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';
  const close = (): void => overlay.remove();
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  DOM.append(box, closeBtn, content);
  DOM.append(overlay, box);
  document.body.appendChild(overlay);
  return close;
}

export const TaskCard = (task: Task, depth = 0): HTMLElement => {
  const card = DOM.create('div', `task-card status-${task.status}${depth > 0 ? ' task-card-subtask' : ''}`);
  card.dataset.id = task.id;

  const header = DOM.create('div', 'task-card-header');
  const title = DOM.create('h3', 'task-title', task.title);
  DOM.append(header, title);

  const body = DOM.create('div', 'task-card-body');

  if (task.description) {
    const desc = DOM.create('p', 'task-description', task.description);
    DOM.append(body, desc);
  }

  const meta = DOM.create('div', 'task-meta');

  const statusBadge = DOM.create('span', `badge badge-status badge-${task.status}`, STATUS_LABELS[task.status]);
  DOM.append(meta, statusBadge);

  if (task.dueDate) {
    const due = DOM.create('span', 'task-due', `Due: ${task.dueDate}`);
    DOM.append(meta, due);
  }

  // Priority score badge (always shown since score fields are required)
  const currency =
    task.taskValue.type === 'direct'
      ? task.taskValue.amount.currency
      : task.taskValue.unitCost.currency;
  const score = computePriorityScore(task);
  const value = computeTaskValue(task.taskValue);
  const scoreEl = DOM.create('span', 'badge badge-score', `⚡ ${formatMoney(score, currency)}`);
  scoreEl.title =
    `Priority score: ${formatMoney(score, currency)}` +
    ` (value: ${formatMoney(value, currency)})`;
  DOM.append(meta, scoreEl);

  if (task.tags && task.tags.length > 0) {
    const tagsContainer = DOM.create('div', 'task-tags');
    task.tags.forEach((tag) => {
      const tagEl = DOM.create('span', 'tag', tag);
      DOM.append(tagsContainer, tagEl);
    });
    DOM.append(body, tagsContainer);
  }

  DOM.append(body, meta);

  const footer = DOM.create('div', 'task-card-footer');

  const progressBtn = DOM.create('button', 'btn btn-secondary', `→ ${STATUS_LABELS[STATUS_NEXT[task.status]]}`);
  progressBtn.addEventListener('click', () => {
    useTaskStore.getState().updateTask(task.id, { status: STATUS_NEXT[task.status] });
  });

  const editBtn = DOM.create('button', 'btn btn-secondary', '✏ Edit');
  editBtn.addEventListener('click', () => {
    let closeEdit: () => void;
    const editForm = TaskForm(
      (updated) => {
        useTaskStore.getState().updateTask(task.id, updated);
        closeEdit();
      },
      task,
      'Save Changes',
    );
    closeEdit = showModal(editForm);
  });

  const addSubBtn = DOM.create('button', 'btn btn-secondary', '+ Sub-task');
  addSubBtn.addEventListener('click', () => {
    let closeSub: () => void;
    const subForm = TaskForm(
      (subTaskData) => {
        useTaskStore.getState().addTask({ ...subTaskData, parentId: task.id });
        closeSub();
      },
      undefined,
      'Add Sub-task',
    );
    closeSub = showModal(subForm);
  });

  const deleteBtn = DOM.create('button', 'btn btn-danger', 'Delete');
  deleteBtn.addEventListener('click', () => {
    useTaskStore.getState().deleteTask(task.id);
  });

  DOM.append(footer, progressBtn, editBtn, addSubBtn, deleteBtn);
  DOM.append(card, header, body, footer);

  // Render sub-tasks recursively
  const subTasks = useTaskStore.getState().getSubTasks(task.id);
  if (subTasks.length > 0) {
    const subList = DOM.create('div', 'task-subtask-list');
    subTasks.forEach((sub) => {
      DOM.append(subList, TaskCard(sub, depth + 1));
    });
    DOM.append(card, subList);
  }

  return card;
};
