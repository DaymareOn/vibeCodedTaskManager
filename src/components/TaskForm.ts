import type { Task, Duration, TaskStatus, TaskValue } from '../types/Task';
import { DOM } from '../utils/dom';

type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Build a task form element.
 * @param onSubmit  Called with the form data when the user submits.
 * @param existingTask  When provided, the form is pre-filled for editing.
 * @param submitLabel  Label for the submit button.
 * @param prefillStartDate  Optional ISO date to pre-fill the start date when creating.
 */
export const TaskForm = (
  onSubmit: (task: TaskFormData) => void,
  existingTask?: Task,
  submitLabel = 'Add Task',
  prefillStartDate?: string,
): HTMLElement => {
  const form = DOM.create('form', 'task-form') as HTMLFormElement;

  const titleInput = DOM.create('input', 'form-input') as HTMLInputElement;
  titleInput.type = 'text';
  titleInput.placeholder = 'Task title';
  titleInput.required = true;
  if (existingTask) titleInput.value = existingTask.title;

  const descriptionInput = DOM.create('textarea', 'form-input') as HTMLTextAreaElement;
  descriptionInput.placeholder = 'Task description';
  descriptionInput.rows = 3;
  if (existingTask) descriptionInput.value = existingTask.description;

  const dueDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  dueDateInput.type = 'date';
  if (existingTask?.dueDate) dueDateInput.value = existingTask.dueDate;

  const tagsInput = DOM.create('input', 'form-input') as HTMLInputElement;
  tagsInput.type = 'text';
  tagsInput.placeholder = 'Tags (comma-separated)';
  if (existingTask) tagsInput.value = existingTask.tags.join(', ');

  // --- Priority Score section (required) ---
  const scoreSection = DOM.create('div', 'form-score-section');
  const scoreSectionTitle = DOM.create('div', 'form-score-title', '⚡ Priority Score');

  // Value type
  const valueTypeLabel = DOM.create('label', 'form-label', 'Value type');
  const valueTypeSelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  valueTypeSelect.innerHTML = `
    <option value="direct">Direct amount</option>
    <option value="event">Event (unit cost × probability)</option>
  `;
  if (existingTask?.taskValue?.type === 'event') valueTypeSelect.value = 'event';

  // Direct value fields
  const directSection = DOM.create('div', 'form-row');
  const directAmount = DOM.create('input', 'form-input') as HTMLInputElement;
  directAmount.type = 'number';
  directAmount.min = '0';
  directAmount.step = '0.01';
  directAmount.placeholder = 'Amount (e.g. 1500)';
  directAmount.required = true;
  const directCurrency = DOM.create('input', 'form-input') as HTMLInputElement;
  directCurrency.type = 'text';
  directCurrency.placeholder = 'Currency (e.g. EUR)';
  directCurrency.value = 'EUR';
  directCurrency.maxLength = 3;
  DOM.append(directSection, directAmount, directCurrency);

  if (existingTask?.taskValue?.type === 'direct') {
    directAmount.value = String(existingTask.taskValue.amount.amount);
    directCurrency.value = existingTask.taskValue.amount.currency;
  }

  // Event value fields
  const eventSection = DOM.create('div', 'form-row hidden');
  const unitCostAmount = DOM.create('input', 'form-input') as HTMLInputElement;
  unitCostAmount.type = 'number';
  unitCostAmount.min = '0';
  unitCostAmount.step = '0.01';
  unitCostAmount.placeholder = 'Unit cost (e.g. 15000)';
  const unitCostCurrency = DOM.create('input', 'form-input') as HTMLInputElement;
  unitCostCurrency.type = 'text';
  unitCostCurrency.placeholder = 'Currency (e.g. EUR)';
  unitCostCurrency.value = 'EUR';
  unitCostCurrency.maxLength = 3;
  const probabilityInput = DOM.create('input', 'form-input') as HTMLInputElement;
  probabilityInput.type = 'number';
  probabilityInput.min = '0';
  probabilityInput.max = '1';
  probabilityInput.step = '0.01';
  probabilityInput.placeholder = 'Probability (0 to 1, e.g. 0.05)';
  const eventPeriodInput = DOM.create('input', 'form-input') as HTMLInputElement;
  eventPeriodInput.type = 'text';
  eventPeriodInput.placeholder = 'Period ISO 8601 (e.g. P1Y, P3M, P30D)';
  DOM.append(eventSection, unitCostAmount, unitCostCurrency, probabilityInput, eventPeriodInput);

  if (existingTask?.taskValue?.type === 'event') {
    unitCostAmount.value = String(existingTask.taskValue.unitCost.amount);
    unitCostCurrency.value = existingTask.taskValue.unitCost.currency;
    probabilityInput.value = String(existingTask.taskValue.probability);
    eventPeriodInput.value = existingTask.taskValue.period.iso;
  }

  const showValueFields = (): void => {
    directSection.classList.toggle('hidden', valueTypeSelect.value !== 'direct');
    eventSection.classList.toggle('hidden', valueTypeSelect.value !== 'event');
    directAmount.required = valueTypeSelect.value === 'direct';
    unitCostAmount.required = valueTypeSelect.value === 'event';
    probabilityInput.required = valueTypeSelect.value === 'event';
    eventPeriodInput.required = valueTypeSelect.value === 'event';
  };
  valueTypeSelect.addEventListener('change', showValueFields);
  showValueFields();

  // Target delivery
  const deliveryLabel = DOM.create('label', 'form-label', 'Target delivery');
  const deliveryTypeSelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  deliveryTypeSelect.innerHTML = `
    <option value="date">Fixed date</option>
    <option value="duration">Relative duration from now</option>
  `;
  const deliveryDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  deliveryDateInput.type = 'date';
  deliveryDateInput.required = true;
  const deliveryDurationInput = DOM.create('input', 'form-input hidden') as HTMLInputElement;
  deliveryDurationInput.type = 'text';
  deliveryDurationInput.placeholder = 'ISO 8601 duration (e.g. P3M, P2W, P10D, PT6H)';

  if (existingTask?.targetDelivery) {
    if (typeof existingTask.targetDelivery === 'string') {
      deliveryTypeSelect.value = 'date';
      deliveryDateInput.value = existingTask.targetDelivery;
    } else {
      deliveryTypeSelect.value = 'duration';
      deliveryDurationInput.value = existingTask.targetDelivery.iso;
    }
  }

  const showDeliveryFields = (): void => {
    const isDate = deliveryTypeSelect.value === 'date';
    deliveryDateInput.classList.toggle('hidden', !isDate);
    deliveryDurationInput.classList.toggle('hidden', isDate);
    deliveryDateInput.required = isDate;
    deliveryDurationInput.required = !isDate;
  };
  deliveryTypeSelect.addEventListener('change', showDeliveryFields);
  showDeliveryFields();

  // Remaining estimate
  const estimateLabel = DOM.create('label', 'form-label', 'Remaining estimate');
  const estimateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  estimateInput.type = 'text';
  estimateInput.placeholder = 'ISO 8601 duration (e.g. P5D, PT4H, P1W)';
  estimateInput.required = true;
  if (existingTask?.remainingEstimate) estimateInput.value = existingTask.remainingEstimate.iso;

  // Status selector (only shown when editing)
  const statusSelect = DOM.create('select', `form-input${existingTask ? '' : ' hidden'}`) as HTMLSelectElement;
  statusSelect.innerHTML = `
    <option value="todo">To Do</option>
    <option value="in-progress">In Progress</option>
    <option value="done">Done</option>
    <option value="cancelled">Cancelled</option>
  `;
  if (existingTask) statusSelect.value = existingTask.status;
  const statusLabelEl = DOM.create('label', `form-label${existingTask ? '' : ' hidden'}`, 'Status');

  // Start date field
  const startDateLabel = DOM.create('label', 'form-label', 'Start date (optional)');
  const startDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  startDateInput.type = 'date';
  if (existingTask?.startDate) {
    startDateInput.value = existingTask.startDate;
  } else if (prefillStartDate) {
    startDateInput.value = prefillStartDate;
  }

  DOM.append(
    scoreSection,
    scoreSectionTitle,
    valueTypeLabel, valueTypeSelect,
    directSection,
    eventSection,
    deliveryLabel, deliveryTypeSelect, deliveryDateInput, deliveryDurationInput,
    estimateLabel, estimateInput,
  );

  const submitBtn = DOM.create('button', 'btn-primary', submitLabel);
  (submitBtn as HTMLButtonElement).type = 'submit';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Build taskValue
    let taskValue: TaskValue;
    if (valueTypeSelect.value === 'direct') {
      taskValue = {
        type: 'direct',
        amount: { amount: parseFloat(directAmount.value), currency: directCurrency.value.toUpperCase() || 'EUR' },
      };
    } else {
      taskValue = {
        type: 'event',
        unitCost: {
          amount: parseFloat(unitCostAmount.value),
          currency: unitCostCurrency.value.toUpperCase() || 'EUR',
        },
        probability: parseFloat(probabilityInput.value),
        period: { iso: eventPeriodInput.value },
      };
    }

    // Build targetDelivery
    let targetDelivery: string | Duration;
    if (deliveryTypeSelect.value === 'date') {
      targetDelivery = deliveryDateInput.value;
    } else {
      targetDelivery = { iso: deliveryDurationInput.value };
    }

    const remainingEstimate: Duration = { iso: estimateInput.value };

    const taskData: TaskFormData = {
      title: titleInput.value,
      description: descriptionInput.value,
      status: existingTask ? (statusSelect.value as TaskStatus) : 'todo',
      dueDate: dueDateInput.value || undefined,
      tags: tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean),
      taskValue,
      targetDelivery,
      remainingEstimate,
      parentId: existingTask?.parentId,
      startDate: startDateInput.value || undefined,
      completedAt: existingTask?.completedAt,
    };

    onSubmit(taskData);
    if (!existingTask) {
      form.reset();
      // Restore defaults after reset
      directCurrency.value = 'EUR';
      unitCostCurrency.value = 'EUR';
      valueTypeSelect.value = 'direct';
      deliveryTypeSelect.value = 'date';
      showValueFields();
      showDeliveryFields();
    }
  });

  DOM.append(
    form,
    titleInput, descriptionInput, dueDateInput, tagsInput,
    statusLabelEl, statusSelect,
    startDateLabel, startDateInput,
    scoreSection,
    submitBtn,
  );
  return form;
};
