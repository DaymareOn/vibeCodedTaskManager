import type { Task } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { computePriorityScoreConverted, computeTaskValue, formatMoney, formatNumber } from '../utils/priority';
import { TaskForm } from './TaskForm';

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'cancelled',
  cancelled: 'todo',
};

/** Show a modal overlay with the given content. Returns a function to close it.
 * If onBeforeClose is provided it is called before any close attempt;
 * returning false prevents the modal from closing.
 */
function showModal(content: HTMLElement, onBeforeClose?: () => boolean): () => void {
  const overlay = DOM.create('div', 'modal-overlay');
  const box = DOM.create('div', 'modal-box');
  const closeBtn = DOM.create('button', 'modal-close btn btn-secondary', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';

  const close = (): void => {
    if (onBeforeClose && !onBeforeClose()) return;
    overlay.remove();
    document.removeEventListener('keydown', handleKeyDown);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

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
  const taskCurrency =
    task.taskValue.type === 'direct'
      ? task.taskValue.amount.currency
      : task.taskValue.unitCost.currency;
  const { mainCurrency, exchangeRates } = useTaskStore.getState();
  const score = computePriorityScoreConverted(task, mainCurrency, exchangeRates);
  const value = computeTaskValue(task.taskValue);
  const scoreEl = DOM.create('span', 'badge badge-score', `⚡ ${formatMoney(score, mainCurrency)}`);
  scoreEl.title =
    `Priority score: ${formatNumber(score)}` +
    ` (value: ${formatMoney(value, taskCurrency)})`;
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
    const editForm = TaskForm(
      (updated) => {
        useTaskStore.getState().updateTask(task.id, updated);
      },
      task,
    );
    showModal(editForm.element, editForm.save);
  });

  const addSubBtn = DOM.create('button', 'btn btn-secondary', '+ Sub-task');
  addSubBtn.addEventListener('click', () => {
    // eslint-disable-next-line prefer-const
    let closeSub: () => void;
    const subForm = TaskForm(
      (subTaskData) => {
        useTaskStore.getState().addTask({ ...subTaskData, parentId: task.id });
        closeSub();
      },
      undefined,
      'Add Sub-task',
    );
    closeSub = showModal(subForm.element);
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
