import type { Task } from '../types/Task';
import { DOM } from '../utils/dom';

export const TaskForm = (onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void): HTMLElement => {
  const form = DOM.create('form', 'task-form') as HTMLFormElement;

  const titleInput = DOM.create('input', 'form-input') as HTMLInputElement;
  titleInput.type = 'text';
  titleInput.placeholder = 'Task title';
  titleInput.required = true;

  const descriptionInput = DOM.create('textarea', 'form-input') as HTMLTextAreaElement;
  descriptionInput.placeholder = 'Task description';
  descriptionInput.rows = 3;

  const dueDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  dueDateInput.type = 'date';

  const prioritySelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  prioritySelect.innerHTML = `
    <option value="medium" selected>Priority: Medium</option>
    <option value="low">Priority: Low</option>
    <option value="high">Priority: High</option>
  `;

  const tagsInput = DOM.create('input', 'form-input') as HTMLInputElement;
  tagsInput.type = 'text';
  tagsInput.placeholder = 'Tags (comma-separated)';

  const submitBtn = DOM.create('button', 'btn-primary', 'Add Task');
  (submitBtn as HTMLButtonElement).type = 'submit';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: titleInput.value,
      description: descriptionInput.value,
      status: 'todo',
      priority: prioritySelect.value as Task['priority'],
      dueDate: dueDateInput.value || undefined,
      tags: tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    };

    onSubmit(newTask);
    form.reset();
  });

  DOM.append(form, titleInput, descriptionInput, dueDateInput, prioritySelect, tagsInput, submitBtn);
  return form;
};