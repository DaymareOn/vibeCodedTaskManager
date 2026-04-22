import { useTaskStore } from '../store/taskStore';
import { DOM } from '../utils/dom';
import { showModal } from '../utils/modal';
import type { Task } from '../types/Task';
import {
  computePriorityScoreConverted,
  computeTaskValue,
  parseDuration,
  formatMoney,
  formatNumber,
} from '../utils/priority';
import { TaskForm } from './TaskForm';
import { Changelog } from '../utils/changelog';

// -------- Constants --------
const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30.4375 * MS_PER_DAY;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;
const BASE_PX_PER_DAY = 3; // pixels per day at 100% horizontal zoom
const TASK_GAP = 6; // gap between task rows
const MIN_RECT_WIDTH = 4; // minimum task rectangle width in px
const SCROLL_SPEED_MULTIPLIER = 0.6; // fraction of wheel delta applied to vertical scroll
const LAYOUT_SETTLE_DELAY = 50; // ms to wait for DOM layout before initial timeline render
const TIMELINE_PADDING_DAYS = 30; // days of padding before earliest task when auto-centering
const TIMELINE_DEFAULT_PAST_DAYS = 60; // days before today used as default origin when no tasks exist

// -------- Time utilities --------
function getPxPerMs(hZoom: number): number {
  return (BASE_PX_PER_DAY / MS_PER_DAY) * (hZoom / 100);
}

function timeToX(t: number, originMs: number, hZoom: number): number {
  return (t - originMs) * getPxPerMs(hZoom);
}

function xToTime(x: number, originMs: number, hZoom: number): number {
  return originMs + x / getPxPerMs(hZoom);
}

function getTaskStartMs(task: Task): number {
  const s = task.startDate || task.createdAt;
  return new Date(s).getTime();
}

function getTaskEndMs(task: Task, now: number): number {
  if ((task.status === 'done' || task.status === 'cancelled') && task.completedAt) {
    return new Date(task.completedAt).getTime();
  }
  const target = task.targetDelivery;
  if (typeof target === 'string') {
    return new Date(target).getTime();
  }
  if (target?.iso) {
    return now + parseDuration(target.iso);
  }
  return now;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// -------- Timeline component --------
export interface TimelineApi {
  element: HTMLElement;
  getHoveredTaskId: () => string | null;
}

export const Timeline = (onEditTask?: (task: Task) => void): TimelineApi => {
  const outer = DOM.create('div', 'timeline');
  const ruler = DOM.create('div', 'timeline-ruler');

  // -------- History Scrubber --------
  const scrubberContainer = DOM.create('div', 'timeline-scrubber');
  const scrubberLabel = DOM.create('span', 'scrubber-label', '📜');
  scrubberLabel.title = 'Task history scrubber – drag to replay past versions';
  const scrubberInput = document.createElement('input');
  scrubberInput.type = 'range';
  scrubberInput.className = 'scrubber-range';
  scrubberInput.min = '0';
  scrubberInput.max = '0';
  scrubberInput.value = '0';
  const scrubberTimestamp = DOM.create('span', 'scrubber-timestamp', '● Live');
  DOM.append(scrubberContainer, scrubberLabel, scrubberInput, scrubberTimestamp);

  // Banner shown when viewing a historical snapshot
  const historyBanner = DOM.create('div', 'timeline-history-banner hidden');

  const body = DOM.create('div', 'timeline-body');
  const canvas = DOM.create('div', 'timeline-canvas');
  const hoverLayer = DOM.create('div', 'timeline-hover-layer');

  DOM.append(body, canvas, hoverLayer);
  DOM.append(outer, ruler, scrubberContainer, historyBanner, body);

  // Local history view state – null = live, N = show state after N-th changelog entry
  let viewHistorySeq: number | null = null;

  let hoverTaskId: string | null = null;
  let hoverLeaveTimer: ReturnType<typeof setTimeout> | null = null;

  // -------- Root tasks for display --------
  /** Returns all tasks (including sub-tasks) from live store or history. */
  function getAllTasksForDisplay(): Task[] {
    const store = useTaskStore.getState();
    return viewHistorySeq !== null
      ? Changelog.getTasksAtSeq(viewHistorySeq)
      : store.tasks;
  }

  function getSortedRootTasks(): Task[] {
    const store = useTaskStore.getState();
    const { filter, mainCurrency, exchangeRates } = store;
    const tasks = getAllTasksForDisplay().filter((t) => {
      if (t.parentId) return false;
      if (filter.hiddenStatuses?.includes(t.status)) return false;
      if (
        filter.search &&
        !t.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !t.description.toLowerCase().includes(filter.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
    // Sort by priority score descending (highest score first), using main currency for comparison
    const now = Date.now();
    return [...tasks].sort((a, b) =>
      computePriorityScoreConverted(b, mainCurrency, exchangeRates, 1.0, now) -
      computePriorityScoreConverted(a, mainCurrency, exchangeRates, 1.0, now),
    );
  }

  // -------- Render ruler --------
  function renderRuler(): void {
    const store = useTaskStore.getState();
    const { horizontalZoom, timelineOriginMs } = store;
    const width = ruler.clientWidth || outer.clientWidth;
    const pxPerMs = getPxPerMs(horizontalZoom);
    const pxPerDay = pxPerMs * MS_PER_DAY;

    DOM.clear(ruler);

    // Choose tick intervals based on zoom level
    let majorInterval: number;
    let minorInterval: number;
    let majorFormat: (d: Date) => string;

    if (pxPerDay >= 20) {
      majorInterval = MS_PER_DAY;
      minorInterval = MS_PER_DAY;
      majorFormat = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } else if (pxPerDay >= 3) {
      majorInterval = MS_PER_WEEK;
      minorInterval = MS_PER_DAY;
      majorFormat = (d) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } else if (pxPerDay >= 0.3) {
      majorInterval = MS_PER_MONTH;
      minorInterval = MS_PER_WEEK;
      majorFormat = (d) => d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    } else {
      majorInterval = MS_PER_YEAR;
      minorInterval = MS_PER_MONTH;
      majorFormat = (d) => String(d.getFullYear());
    }

    const endMs = timelineOriginMs + width / pxPerMs;

    // Minor ticks
    const firstMinor = Math.ceil(timelineOriginMs / minorInterval) * minorInterval;
    for (let t = firstMinor; t <= endMs; t += minorInterval) {
      const x = timeToX(t, timelineOriginMs, horizontalZoom);
      if (x < 0 || x > width) continue;
      const tick = DOM.create('div', 'ruler-tick-minor');
      tick.style.left = `${x}px`;
      DOM.append(ruler, tick);
    }

    // Major ticks + labels
    const firstMajor = Math.ceil(timelineOriginMs / majorInterval) * majorInterval;
    for (let t = firstMajor; t <= endMs; t += majorInterval) {
      const x = timeToX(t, timelineOriginMs, horizontalZoom);
      if (x < 0 || x > width) continue;
      const tick = DOM.create('div', 'ruler-tick-major');
      tick.style.left = `${x}px`;
      DOM.append(ruler, tick);
      const label = DOM.create('div', 'ruler-label');
      label.style.left = `${x + 4}px`;
      label.textContent = majorFormat(new Date(t));
      DOM.append(ruler, label);
    }

    // Today marker
    const todayX = timeToX(Date.now(), timelineOriginMs, horizontalZoom);
    if (todayX >= 0 && todayX <= width) {
      const todayLine = DOM.create('div', 'ruler-today');
      todayLine.style.left = `${todayX}px`;
      const todayLabel = DOM.create('div', 'ruler-today-label', 'Today');
      todayLabel.style.left = `${todayX + 4}px`;
      DOM.append(ruler, todayLine, todayLabel);
    }
  }

  // -------- Render canvas --------
  function renderCanvas(): void {
    const store = useTaskStore.getState();
    const {
      horizontalZoom,
      verticalZoom,
      taskHeight,
      timelineOriginMs,
      verticalOffset,
    } = store;
    const now = Date.now();
    const effectiveHeight = taskHeight * (verticalZoom / 100);
    const pxPerMs = getPxPerMs(horizontalZoom);
    const bodyHeight = body.clientHeight || 400;

    const tasks = getSortedRootTasks();
    const totalHeight = tasks.length * (effectiveHeight + TASK_GAP);

    // Vertical offset logic: center if tasks fit, else allow scrolling
    let topOffset: number;
    if (totalHeight <= bodyHeight) {
      topOffset = (bodyHeight - totalHeight) / 2 - verticalOffset;
    } else {
      topOffset = -verticalOffset;
    }

    canvas.style.top = `${topOffset}px`;
    canvas.style.height = `${Math.max(totalHeight, bodyHeight)}px`;

    DOM.clear(canvas);

    tasks.forEach((task, i) => {
      const startMs = getTaskStartMs(task);
      const endMs = getTaskEndMs(task, now);
      const x = timeToX(startMs, timelineOriginMs, horizontalZoom);
      const w = Math.max(MIN_RECT_WIDTH, (endMs - startMs) * pxPerMs);
      const y = i * (effectiveHeight + TASK_GAP);

      const rect = DOM.create('div', `task-rect task-rect-${task.status}`);
      rect.style.left = `${x}px`;
      rect.style.top = `${y}px`;
      rect.style.width = `${w}px`;
      rect.style.height = `${effectiveHeight}px`;
      rect.dataset.id = task.id;
      rect.dataset.taskY = String(y);
      rect.dataset.taskHeight = String(effectiveHeight);

      // Scrolling title
      const titleWrapper = DOM.create('div', 'task-rect-title-wrapper');
      const titleSpan = DOM.create('span', 'task-rect-title task-title');
      titleSpan.textContent = task.title;
      DOM.append(titleWrapper, titleSpan);
      DOM.append(rect, titleWrapper);

      // Check if title overflows after insertion
      requestAnimationFrame(() => {
        if (titleSpan.scrollWidth > titleWrapper.clientWidth) {
          titleSpan.classList.add('scrolling');
          titleSpan.style.setProperty('--scroll-distance', `${titleSpan.scrollWidth - titleWrapper.clientWidth + 16}px`);
        }
      });

      rect.addEventListener('mouseenter', () => {
        if (hoverLeaveTimer !== null) {
          clearTimeout(hoverLeaveTimer);
          hoverLeaveTimer = null;
        }
        handleTaskHover(task, rect, effectiveHeight);
      });
      rect.addEventListener('mouseleave', () => {
        hoverLeaveTimer = setTimeout(() => {
          if (hoverTaskId === task.id) {
            hoverTaskId = null;
            DOM.clear(hoverLayer);
          }
        }, 150);
      });
      rect.addEventListener('click', (e) => {
        e.stopPropagation();
        showTaskEditModal(task);
      });

      DOM.append(canvas, rect);
    });
  }

  // -------- Hover: tooltip + subtasks --------
  function handleTaskHover(task: Task, rectEl: HTMLElement, effectiveHeight: number): void {
    if (hoverTaskId === task.id) return;
    hoverTaskId = task.id;
    DOM.clear(hoverLayer);

    const store = useTaskStore.getState();
    const { horizontalZoom, timelineOriginMs, filter, mainCurrency, exchangeRates } = store;
    const now = Date.now();
    const pxPerMs = getPxPerMs(horizontalZoom);
    const rectTop = parseFloat(rectEl.style.top);
    const rectLeft = parseFloat(rectEl.style.left);

    // ---- Tooltip ----
    const tooltip = DOM.create('div', 'task-tooltip');

    const taskCurrency =
      task.taskValue.type === 'direct'
        ? task.taskValue.amount.currency
        : task.taskValue.unitCost.currency;
    // Priority score in main currency (no currency sign in tooltip)
    const priorityScore = computePriorityScoreConverted(task, mainCurrency, exchangeRates, 1.0, now);
    // Raw value in the task's own currency
    const rawValue = computeTaskValue(task.taskValue);
    const startStr = new Date(getTaskStartMs(task)).toLocaleDateString();
    const endStr = new Date(getTaskEndMs(task, now)).toLocaleDateString();
    const statusLabels: Record<string, string> = {
      todo: 'To Do',
      'in-progress': 'In Progress',
      done: 'Done',
      cancelled: 'Cancelled',
    };

    tooltip.innerHTML = `
      <div class="tooltip-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="tooltip-desc">${escapeHtml(task.description)}</div>` : ''}
      <div class="tooltip-meta">
        <span class="tooltip-badge tooltip-badge-${task.status}">${statusLabels[task.status] || task.status}</span>
        <span class="tooltip-score">⚡ ${formatNumber(priorityScore)}</span>
        <span class="tooltip-value">💰 ${formatMoney(rawValue, taskCurrency)}</span>
      </div>
      <div class="tooltip-dates">📅 ${startStr} → ${endStr}</div>
      ${task.tags.length ? `<div class="tooltip-tags">${task.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    `;

    // Position tooltip above the task rect, clamped to viewport
    const bodyWidth = body.clientWidth;
    const tooltipMaxWidth = 300;
    const tooltipLeftClamped = Math.max(4, Math.min(rectLeft, bodyWidth - tooltipMaxWidth - 4));
    // Position above the rect
    const approxTooltipHeight = 120;
    const tooltipTop = Math.max(4, rectTop - approxTooltipHeight - 8);
    tooltip.style.left = `${tooltipLeftClamped}px`;
    tooltip.style.top = `${tooltipTop}px`;
    tooltip.style.maxWidth = `${tooltipMaxWidth}px`;
    DOM.append(hoverLayer, tooltip);

    // ---- Subtasks below parent ----
    const allDisplayTasks = getAllTasksForDisplay();
    const subTasks = allDisplayTasks.filter(
      (s) => s.parentId === task.id && !filter.hiddenStatuses?.includes(s.status),
    );

    const subHeight = effectiveHeight * 0.75;
    const subY = rectTop + effectiveHeight + TASK_GAP;

    subTasks.forEach((sub) => {
      const subStartMs = getTaskStartMs(sub);
      const subEndMs = getTaskEndMs(sub, now);
      const subX = timeToX(subStartMs, timelineOriginMs, horizontalZoom);
      const subW = Math.max(MIN_RECT_WIDTH, (subEndMs - subStartMs) * pxPerMs);

      const subRect = DOM.create('div', `task-rect task-rect-${sub.status} task-rect-subtask`);
      subRect.style.left = `${subX}px`;
      subRect.style.top = `${subY}px`;
      subRect.style.width = `${subW}px`;
      subRect.style.height = `${subHeight}px`;

      const subTitleWrapper = DOM.create('div', 'task-rect-title-wrapper');
      const subTitle = DOM.create('span', 'task-rect-title task-title');
      subTitle.textContent = sub.title;
      DOM.append(subTitleWrapper, subTitle);
      DOM.append(subRect, subTitleWrapper);

      DOM.append(hoverLayer, subRect);
    });
  }

  // -------- Task action modal (fallback when no onEditTask callback) --------
  function showTaskEditModal(task: Task): void {
    if (onEditTask) {
      onEditTask(task);
      return;
    }

    const container = DOM.create('div', 'task-action-modal');
    let closeModal: () => void;

    const editForm = TaskForm(
      (updated) => {
        useTaskStore.getState().updateTask(task.id, updated);
      },
      task,
    );

    const actionsRow = DOM.create('div', 'modal-actions');

    const subTaskBtn = DOM.create('button', 'btn btn-secondary', '+ Add Sub-task');
    subTaskBtn.addEventListener('click', () => {
      closeModal();
      let closeSub: () => void;
      const subForm = TaskForm(
        (subData) => {
          useTaskStore.getState().addTask({ ...subData, parentId: task.id });
          closeSub();
        },
        undefined,
        'Add Sub-task',
      );
      closeSub = showModal(subForm.element);
    });

    const deleteBtn = DOM.create('button', 'btn btn-danger', '🗑 Delete Task');
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete "${task.title}" and all its sub-tasks?`)) {
        useTaskStore.getState().deleteTask(task.id);
        closeModal();
      }
    });

    DOM.append(actionsRow, subTaskBtn, deleteBtn);
    DOM.append(container, editForm.element, actionsRow);
    closeModal = showModal(container, editForm.save);
  }

  // -------- Click on empty area → add task --------
  body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.task-rect')) return;
    const store = useTaskStore.getState();
    const bodyRect = body.getBoundingClientRect();
    const clickX = e.clientX - bodyRect.left;
    const clickTimeMs = xToTime(clickX, store.timelineOriginMs, store.horizontalZoom);
    const clickDate = new Date(clickTimeMs).toISOString().split('T')[0];

    let closeAdd: () => void;
    const addForm = TaskForm(
      (taskData) => {
        useTaskStore.getState().addTask({ ...taskData, startDate: taskData.startDate || clickDate });
        closeAdd();
      },
      undefined,
      'Add Task',
      clickDate,
    );
    closeAdd = showModal(addForm.element);
  });

  // -------- Wheel events --------
  // Scroll mapping:
  //   Ctrl + deltaY          → horizontal zoom (keep cursor-time fixed)
  //   deltaX (touchpad)      → horizontal pan (timeline scroll left/right)
  //   Shift + deltaY         → vertical zoom
  //   plain deltaY           → vertical scroll
  // deltaX and deltaY are handled independently so diagonal touchpad swipes
  // pan and scroll simultaneously.
  outer.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const store = useTaskStore.getState();

      if (e.ctrlKey) {
        // Ctrl + vertical wheel → horizontal zoom (keep time under cursor fixed)
        const zoomDelta = e.deltaY > 0 ? -10 : 10;
        const newZoom = Math.max(10, Math.min(2000, store.horizontalZoom + zoomDelta));
        const bodyRect = body.getBoundingClientRect();
        const mouseX = e.clientX - bodyRect.left;
        const timeAtMouse = xToTime(mouseX, store.timelineOriginMs, store.horizontalZoom);
        const newOriginMs = timeAtMouse - mouseX / getPxPerMs(newZoom);
        store.setHorizontalZoom(newZoom);
        store.setTimelineOriginMs(newOriginMs);
        return; // don't process deltaX when zooming
      }

      // Horizontal pan via deltaX (touchpad two-finger horizontal swipe)
      if (e.deltaX !== 0) {
        const MS_PER_DAY_LOCAL = 86_400_000;
        const PAN_LIMIT_MS = 100 * 365 * MS_PER_DAY_LOCAL; // ±100 years from today
        const panMs = e.deltaX / getPxPerMs(store.horizontalZoom);
        const newOrigin = Math.max(
          Date.now() - PAN_LIMIT_MS,
          Math.min(Date.now() + PAN_LIMIT_MS, store.timelineOriginMs + panMs),
        );
        store.setTimelineOriginMs(newOrigin);
      }

      // Vertical scroll or zoom via deltaY
      if (e.deltaY !== 0) {
        if (e.shiftKey) {
          // Shift + vertical wheel → vertical zoom
          const zoomDelta = e.deltaY > 0 ? -10 : 10;
          const newZoom = Math.max(10, Math.min(500, store.verticalZoom + zoomDelta));
          store.setVerticalZoom(newZoom);
        } else {
          // Plain vertical wheel → vertical scroll
          const tasks = getSortedRootTasks();
          const effectiveHeight = store.taskHeight * (store.verticalZoom / 100);
          const totalHeight = tasks.length * (effectiveHeight + TASK_GAP);
          const bodyH = body.clientHeight || 400;
          const maxOffset = Math.max(0, totalHeight - bodyH);
          const newOffset = Math.max(0, Math.min(maxOffset, store.verticalOffset + e.deltaY * SCROLL_SPEED_MULTIPLIER));
          store.setVerticalOffset(newOffset);
        }
      }
    },
    { passive: false },
  );

  // -------- History scrubber --------
  function updateScrubber(): void {
    const count = Changelog.getEntryCount();
    const wasAtMax = parseInt(scrubberInput.value, 10) >= parseInt(scrubberInput.max, 10);
    scrubberInput.max = String(count);
    if (wasAtMax || count === 0) {
      // Stay at live (rightmost) position
      scrubberInput.value = String(count);
    }
    // Refresh the timestamp label if needed
    refreshScrubberLabel();
  }

  function refreshScrubberLabel(): void {
    const count = Changelog.getEntryCount();
    const val = parseInt(scrubberInput.value, 10);
    const isLive = val >= count || count === 0;
    if (isLive) {
      scrubberTimestamp.textContent = '● Live';
      scrubberContainer.classList.remove('in-history');
      historyBanner.classList.add('hidden');
      viewHistorySeq = null;
    } else {
      // `val` is a 1-based count of how many entries to apply (slider range: 0 = empty … N = live).
      // getEntryAt() uses a 0-based array index, so the last applied entry is at index val - 1.
      const entry = Changelog.getEntryAt(val - 1);
      const ts = entry ? new Date(entry.timestamp).toLocaleString() : '';
      const taskTitle = entry
        ? `${entry.type === 'delete' ? '🗑' : entry.type === 'create' ? '✚' : '✎'} "${entry.newState?.title ?? entry.previousState?.title ?? entry.taskId}"`
        : '';
      scrubberTimestamp.textContent = ts;
      historyBanner.textContent = `📜 History snapshot – ${ts}${taskTitle ? ': ' + taskTitle : ''} (${val}/${count})`;
      scrubberContainer.classList.add('in-history');
      historyBanner.classList.remove('hidden');
      // viewHistorySeq is the seq cutoff passed to getTasksAtSeq(); val serves as both
      // the 1-based slider position and the max seq to include (seq numbers are sequential).
      viewHistorySeq = val;
    }
  }

  scrubberInput.addEventListener('input', () => {
    refreshScrubberLabel();
    renderCanvas();
  });

  // -------- Store subscription --------
  useTaskStore.subscribe(() => {
    updateScrubber();
    renderRuler();
    renderCanvas();
  });

  // -------- Resize observer --------
  const resizeObs = new ResizeObserver(() => {
    renderRuler();
    renderCanvas();
  });
  resizeObs.observe(outer);

  // -------- Initial render --------
  // Use a short timeout so the DOM has laid out and clientWidth is available
  setTimeout(() => {
    // Auto-set timeline origin to show earliest task
    const state = useTaskStore.getState();
    const rootTasks = state.tasks.filter((t) => !t.parentId);
    if (rootTasks.length > 0) {
      const now = Date.now();
      const minStart = Math.min(...rootTasks.map((t) => getTaskStartMs(t)));
      const newOrigin = Math.min(
        minStart - TIMELINE_PADDING_DAYS * MS_PER_DAY,
        now - TIMELINE_DEFAULT_PAST_DAYS * MS_PER_DAY,
      );
      state.setTimelineOriginMs(newOrigin);
    }
    updateScrubber();
    renderRuler();
    renderCanvas();
  }, LAYOUT_SETTLE_DELAY);

  return { element: outer, getHoveredTaskId: () => hoverTaskId };
};
