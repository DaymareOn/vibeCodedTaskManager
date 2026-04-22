import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { showModal } from '../utils/modal';
import { TaskForm } from './TaskForm';
import { t, onLocaleChange } from '../utils/i18n';
import type { Task } from '../types/Task';

export interface EditTaskColumnApi {
  element: HTMLElement;
  /** Open the column with the given task pre-loaded in the edit form. */
  openTask: (task: Task) => void;
  /** The currently open task id, or null if none. */
  getCurrentTaskId: () => string | null;
}

export const EditTaskColumn = (): EditTaskColumnApi => {
  const col = DOM.create('div', 'edit-task-column collapsed');
  const inner = DOM.create('div', 'edit-task-column-inner');

  let collapsed = true;
  let currentTaskId: string | null = null;
  let keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // ---- Collapse toggle ----
  const toggleBtn = DOM.create('button', 'edit-column-toggle-btn', '◀');
  toggleBtn.title = t('edit.expand');
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    col.classList.toggle('collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '◀' : '▶';
    toggleBtn.title = collapsed ? t('edit.expand') : t('edit.collapse');
  });

  // ---- Title ----
  const titleEl = DOM.create('div', 'edit-column-title');
  const titleIconEl = DOM.create('div', 'edit-column-title-icon', '✏️');
  const titleTextEl = DOM.create('div', 'edit-column-title-text');
  titleTextEl.innerHTML = `<strong>${t('edit.title')}</strong>`;
  DOM.append(titleEl, titleIconEl, titleTextEl);

  // ---- Content area ----
  const contentArea = DOM.create('div', 'edit-column-content');
  const placeholder = DOM.create('div', 'edit-column-placeholder');
  placeholder.textContent = t('edit.placeholder');
  DOM.append(contentArea, placeholder);

  DOM.append(inner, titleEl, contentArea);
  DOM.append(col, toggleBtn, inner);

  // Update strings when locale changes
  onLocaleChange(() => {
    titleTextEl.innerHTML = `<strong>${t('edit.title')}</strong>`;
    if (contentArea.contains(placeholder)) {
      placeholder.textContent = t('edit.placeholder');
    }
    toggleBtn.title = collapsed ? t('edit.expand') : t('edit.collapse');
  });

  // ---- openTask ----
  const openTask = (task: Task): void => {
    currentTaskId = task.id;

    // Expand the column
    collapsed = false;
    col.classList.remove('collapsed');
    toggleBtn.textContent = '▶';
    toggleBtn.title = t('edit.collapse');

    DOM.clear(contentArea);

    // Auto-save: every field change triggers onSubmit immediately
    const editForm = TaskForm(
      (updated) => {
        useTaskStore.getState().updateTask(task.id, updated);
      },
      task,
      undefined,
      undefined,
      /* autoSave */ true,
    );

    const actionsRow = DOM.create('div', 'edit-column-actions');

    // Add Sub-task: collapse this column, open a modal for the sub-task form
    const subTaskBtn = DOM.create('button', 'btn btn-secondary', t('edit.addSubTask'));
    (subTaskBtn as HTMLButtonElement).type = 'button';
    subTaskBtn.addEventListener('click', () => {
      collapsed = true;
      col.classList.add('collapsed');
      toggleBtn.textContent = '◀';
      toggleBtn.title = t('edit.expand');

      let closeSub: () => void;
      const subForm = TaskForm(
        (subData) => {
          useTaskStore.getState().addTask({ ...subData, parentId: task.id });
          closeSub();
        },
        undefined,
        t('form.addSubTask'),
      );
      closeSub = showModal(subForm.element);
    });

    // Delete task
    const deleteBtn = DOM.create('button', 'btn btn-danger', t('edit.delete'));
    (deleteBtn as HTMLButtonElement).type = 'button';
    deleteBtn.addEventListener('click', () => {
      if (confirm(t('edit.deleteConfirm', { title: task.title }))) {
        useTaskStore.getState().deleteTask(task.id);
        currentTaskId = null;
        collapsed = true;
        col.classList.add('collapsed');
        toggleBtn.textContent = '◀';
        toggleBtn.title = t('edit.expand');
        DOM.clear(contentArea);
        DOM.append(contentArea, placeholder);
      }
    });

    DOM.append(actionsRow, subTaskBtn, deleteBtn);

    // 'd' key shortcut to delete the currently open task
    if (keydownHandler) {
      document.removeEventListener('keydown', keydownHandler);
    }
    keydownHandler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isTextFocused = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (!isTextFocused && e.key === 'd' && currentTaskId !== null) {
        if (confirm(t('edit.deleteConfirm', { title: task.title }))) {
          useTaskStore.getState().deleteTask(task.id);
          currentTaskId = null;
          collapsed = true;
          col.classList.add('collapsed');
          toggleBtn.textContent = '◀';
          toggleBtn.title = t('edit.expand');
          DOM.clear(contentArea);
          DOM.append(contentArea, placeholder);
          if (keydownHandler) {
            document.removeEventListener('keydown', keydownHandler);
            keydownHandler = null;
          }
        }
      }
    };
    document.addEventListener('keydown', keydownHandler);

    DOM.append(contentArea, editForm.element, actionsRow);
  };

  return { element: col, openTask, getCurrentTaskId: () => currentTaskId };
};
