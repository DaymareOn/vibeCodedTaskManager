import type { Task, Duration, TaskValue } from '../types/Task';
import { DOM } from '../utils/dom';
import { useGroupStore } from '../store/groupStore';

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

  // --- Advanced: Priority Score section ---
  const advancedSection = DOM.create('div', 'form-advanced');

  const advancedToggle = DOM.create('button', 'btn btn-secondary form-advanced-toggle', '⚡ Priority Score (optional) ▼');
  (advancedToggle as HTMLButtonElement).type = 'button';
  const advancedContent = DOM.create('div', 'form-advanced-content');

  advancedToggle.addEventListener('click', () => {
    const hidden = advancedContent.classList.toggle('hidden');
    advancedToggle.textContent = hidden
      ? '⚡ Priority Score (optional) ▼'
      : '⚡ Priority Score (optional) ▲';
  });
  advancedContent.classList.add('hidden');

  // Group selector
  const groupLabel = DOM.create('label', 'form-label', 'Group');
  const groupSelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  const refreshGroupOptions = (): void => {
    const { groups } = useGroupStore.getState();
    groupSelect.innerHTML = '<option value="">— No group —</option>';
    groups.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.name} (k = ${g.priorityCoefficient})`;
      groupSelect.appendChild(opt);
    });
  };
  useGroupStore.subscribe(refreshGroupOptions);
  refreshGroupOptions();

  // Value type
  const valueTypeLabel = DOM.create('label', 'form-label', 'Value type');
  const valueTypeSelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  valueTypeSelect.innerHTML = `
    <option value="none">— No value —</option>
    <option value="direct">Direct amount</option>
    <option value="event">Event (unit cost × probability)</option>
  `;

  // Direct value fields
  const directSection = DOM.create('div', 'form-row hidden');
  const directAmount = DOM.create('input', 'form-input') as HTMLInputElement;
  directAmount.type = 'number';
  directAmount.min = '0';
  directAmount.step = '0.01';
  directAmount.placeholder = 'Amount (e.g. 1500)';
  const directCurrency = DOM.create('input', 'form-input') as HTMLInputElement;
  directCurrency.type = 'text';
  directCurrency.placeholder = 'Currency (e.g. EUR)';
  directCurrency.value = 'EUR';
  directCurrency.maxLength = 3;
  DOM.append(directSection, directAmount, directCurrency);

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
  eventPeriodInput.placeholder = 'Period ISO 8601 (e.g. P1Y, P3M, P30D) — required';
  DOM.append(eventSection, unitCostAmount, unitCostCurrency, probabilityInput, eventPeriodInput);

  valueTypeSelect.addEventListener('change', () => {
    directSection.classList.toggle('hidden', valueTypeSelect.value !== 'direct');
    eventSection.classList.toggle('hidden', valueTypeSelect.value !== 'event');
  });

  // Target delivery
  const deliveryLabel = DOM.create('label', 'form-label', 'Target delivery');
  const deliveryTypeSelect = DOM.create('select', 'form-input') as HTMLSelectElement;
  deliveryTypeSelect.innerHTML = `
    <option value="none">— No target delivery —</option>
    <option value="date">Fixed date</option>
    <option value="duration">Relative duration from now</option>
  `;
  const deliveryDateInput = DOM.create('input', 'form-input hidden') as HTMLInputElement;
  deliveryDateInput.type = 'date';
  const deliveryDurationInput = DOM.create('input', 'form-input hidden') as HTMLInputElement;
  deliveryDurationInput.type = 'text';
  deliveryDurationInput.placeholder = 'ISO 8601 duration (e.g. P3M, P2W, P10D, PT6H)';

  deliveryTypeSelect.addEventListener('change', () => {
    deliveryDateInput.classList.toggle('hidden', deliveryTypeSelect.value !== 'date');
    deliveryDurationInput.classList.toggle('hidden', deliveryTypeSelect.value !== 'duration');
  });

  // Remaining estimate
  const estimateLabel = DOM.create('label', 'form-label', 'Remaining estimate');
  const estimateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  estimateInput.type = 'text';
  estimateInput.placeholder = 'ISO 8601 duration (e.g. P5D, PT4H, P1W)';

  DOM.append(
    advancedContent,
    groupLabel, groupSelect,
    valueTypeLabel, valueTypeSelect,
    directSection,
    eventSection,
    deliveryLabel, deliveryTypeSelect, deliveryDateInput, deliveryDurationInput,
    estimateLabel, estimateInput,
  );
  DOM.append(advancedSection, advancedToggle, advancedContent);

  const submitBtn = DOM.create('button', 'btn-primary', 'Add Task');
  (submitBtn as HTMLButtonElement).type = 'submit';

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Build taskValue
    let taskValue: TaskValue | undefined;
    if (valueTypeSelect.value === 'direct' && directAmount.value) {
      taskValue = {
        type: 'direct',
        amount: { amount: parseFloat(directAmount.value), currency: directCurrency.value.toUpperCase() || 'EUR' },
      };
    } else if (
      valueTypeSelect.value === 'event' &&
      unitCostAmount.value &&
      probabilityInput.value &&
      eventPeriodInput.value
    ) {
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
    let targetDelivery: string | Duration | undefined;
    if (deliveryTypeSelect.value === 'date' && deliveryDateInput.value) {
      targetDelivery = deliveryDateInput.value;
    } else if (deliveryTypeSelect.value === 'duration' && deliveryDurationInput.value) {
      targetDelivery = { iso: deliveryDurationInput.value };
    }

    // Build remainingEstimate
    const remainingEstimate: Duration | undefined = estimateInput.value
      ? { iso: estimateInput.value }
      : undefined;

    const groupId = groupSelect.value || undefined;

    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: titleInput.value,
      description: descriptionInput.value,
      status: 'todo',
      priority: prioritySelect.value as Task['priority'],
      dueDate: dueDateInput.value || undefined,
      tags: tagsInput.value.split(',').map((tag) => tag.trim()).filter(Boolean),
      taskValue,
      targetDelivery,
      remainingEstimate,
      groupId,
    };

    onSubmit(newTask);
    form.reset();
    // Reset dynamic field visibility
    directSection.classList.add('hidden');
    eventSection.classList.add('hidden');
    deliveryDateInput.classList.add('hidden');
    deliveryDurationInput.classList.add('hidden');
  });

  DOM.append(form, titleInput, descriptionInput, dueDateInput, prioritySelect, tagsInput, advancedSection, submitBtn);
  return form;
};