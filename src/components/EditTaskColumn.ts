import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import { showModal } from '../utils/modal';
import { TaskForm } from './TaskForm';
import type { Task } from '../types/Task';

export interface EditTaskColumnApi {
  element: HTMLElement;
  /** Open the column with the given task pre-loaded in the edit form. */
  openTask: (task: Task) => void;
}

export const EditTaskColumn = (): EditTaskColumnApi => {
  const col = DOM.create('div', 'edit-task-column collapsed');
  const inner = DOM.create('div', 'edit-task-column-inner');

  let collapsed = true;

  // ---- Collapse toggle ----
  const toggleBtn = DOM.create('button', 'edit-column-toggle-btn', '◀');
  toggleBtn.title = 'Expand edit panel';
  toggleBtn.addEventListener('click', () => {
    collapsed = !collapsed;
    col.classList.toggle('collapsed', collapsed);
    toggleBtn.textContent = collapsed ? '◀' : '▶';
    toggleBtn.title = collapsed ? 'Expand edit panel' : 'Collapse edit panel';
  });

  // ---- Title ----
  const titleEl = DOM.create('div', 'edit-column-title');
  titleEl.innerHTML = `
    <div class="edit-column-title-icon">✏️</div>
    <div class="edit-column-title-text"><strong>Edit Task</strong></div>
  `;

  // ---- Content area ----
  const contentArea = DOM.create('div', 'edit-column-content');
  const placeholder = DOM.create(
    'div',
    'edit-column-placeholder',
    '← Click a task to edit it',
  );
  DOM.append(contentArea, placeholder);

  DOM.append(inner, titleEl, contentArea);
  DOM.append(col, toggleBtn, inner);

  // ---- openTask ----
  const openTask = (task: Task): void => {
    // Expand the column
    collapsed = false;
    col.classList.remove('collapsed');
    toggleBtn.textContent = '▶';
    toggleBtn.title = 'Collapse edit panel';

    DOM.clear(contentArea);

    const editForm = TaskForm(
      (updated) => {
        useTaskStore.getState().updateTask(task.id, updated);
      },
      task,
      'Save Changes',
    );

    const actionsRow = DOM.create('div', 'edit-column-actions');

    // Save button (calls form's validation + submit logic)
    const saveBtn = DOM.create('button', 'btn btn-primary edit-column-save-btn', '💾 Save Changes');
    (saveBtn as HTMLButtonElement).type = 'button';
    saveBtn.addEventListener('click', () => {
      editForm.save();
    });

    // Add Sub-task: collapse this column, open a modal for the sub-task form
    const subTaskBtn = DOM.create('button', 'btn btn-secondary', '+ Add Sub-task');
    (subTaskBtn as HTMLButtonElement).type = 'button';
    subTaskBtn.addEventListener('click', () => {
      collapsed = true;
      col.classList.add('collapsed');
      toggleBtn.textContent = '◀';
      toggleBtn.title = 'Expand edit panel';

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

    // Delete task
    const deleteBtn = DOM.create('button', 'btn btn-danger', '🗑 Delete Task');
    (deleteBtn as HTMLButtonElement).type = 'button';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete "${task.title}" and all its sub-tasks?`)) {
        useTaskStore.getState().deleteTask(task.id);
        collapsed = true;
        col.classList.add('collapsed');
        toggleBtn.textContent = '◀';
        toggleBtn.title = 'Expand edit panel';
        DOM.clear(contentArea);
        DOM.append(contentArea, placeholder);
      }
    });

    DOM.append(actionsRow, subTaskBtn, deleteBtn);
    DOM.append(contentArea, saveBtn, editForm.element, actionsRow);
  };

  return { element: col, openTask };
};
