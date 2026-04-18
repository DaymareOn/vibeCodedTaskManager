import type { Task } from '../types/Task';
import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { useGroupStore } from '../store/groupStore';
import { computePriorityScore, computeTaskValue, formatMoney } from '../utils/priority';

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_NEXT: Record<Task['status'], Task['status']> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
};

export const TaskCard = (task: Task, onDelete: (id: string) => void): HTMLElement => {
  const card = DOM.create('div', `task-card priority-${task.priority} status-${task.status}`);
  card.dataset.id = task.id;

  const header = DOM.create('div', 'task-card-header');
  const title = DOM.create('h3', 'task-title', task.title);

  const priorityBadge = DOM.create('span', `badge badge-priority badge-${task.priority}`, PRIORITY_LABELS[task.priority]);

  DOM.append(header, title, priorityBadge);

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

  // Priority score badge
  if (task.taskValue && task.targetDelivery && task.remainingEstimate) {
    const groups = useGroupStore.getState().groups;
    const group = groups.find((g) => g.id === task.groupId);
    const k = group?.priorityCoefficient ?? 1.0;
    const score = computePriorityScore(task, k);
    if (score !== null) {
      const currency =
        task.taskValue.type === 'direct'
          ? task.taskValue.amount.currency
          : task.taskValue.unitCost.currency;
      const value = computeTaskValue(task.taskValue);
      const scoreEl = DOM.create('span', 'badge badge-score', `⚡ ${formatMoney(score, currency)}`);
      scoreEl.title =
        `Priority score: ${formatMoney(score, currency)}` +
        ` (value: ${formatMoney(value, currency)}` +
        (group ? `, k=${k}` : '') +
        ')';
      DOM.append(meta, scoreEl);
    }
  }

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

  const deleteBtn = DOM.create('button', 'btn btn-danger', 'Delete');
  deleteBtn.addEventListener('click', () => {
    onDelete(task.id);
  });

  DOM.append(footer, progressBtn, deleteBtn);
  DOM.append(card, header, body, footer);

  return card;
};