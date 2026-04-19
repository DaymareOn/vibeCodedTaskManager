import type { Task, Duration, TaskStatus, TaskValue } from '../types/Task';
import { DOM } from '../utils/dom';

type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;

/** Returned by TaskForm so callers can embed the element and trigger save programmatically. */
export interface TaskFormResult {
  element: HTMLElement;
  /** Validate the form and call onSubmit if valid. Returns true when saved successfully. */
  save: () => boolean;
}

/** ISO 4217 currencies available in the currency picker */
const CURRENCIES: Array<{ code: string; name: string }> = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'RON', name: 'Romanian Leu' },
  { code: 'BGN', name: 'Bulgarian Lev' },
  { code: 'ISK', name: 'Icelandic Krona' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'ARS', name: 'Argentine Peso' },
  { code: 'CLP', name: 'Chilean Peso' },
  { code: 'COP', name: 'Colombian Peso' },
  { code: 'PEN', name: 'Peruvian Sol' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'TWD', name: 'Taiwan Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'PHP', name: 'Philippine Peso' },
  { code: 'VND', name: 'Vietnamese Dong' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'MAD', name: 'Moroccan Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'ILS', name: 'Israeli Shekel' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'RUB', name: 'Russian Ruble' },
];

/** Status toggle button options used in the edit form. */
const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string; cssClass: string }> = [
  { value: 'todo',        label: '⬜ To Do',      cssClass: 'status-btn-todo' },
  { value: 'in-progress', label: '🔄 In Progress', cssClass: 'status-btn-in-progress' },
  { value: 'done',        label: '✅ Done',        cssClass: 'status-btn-done' },
  { value: 'cancelled',   label: '❌ Cancelled',   cssClass: 'status-btn-cancelled' },
];

/** Create a currency <select> pre-filled with ISO 4217 codes */
function createCurrencySelect(initial = 'EUR'): HTMLSelectElement {
  const select = DOM.create('select', 'form-input form-currency-select') as HTMLSelectElement;
  CURRENCIES.forEach(({ code, name }) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${code} – ${name}`;
    if (code === initial) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

/** Two-option toggle button group. Returns element + getValue/setValue helpers. */
function createToggle(
  options: Array<{ value: string; label: string }>,
  initialValue: string,
  onChange: (value: string) => void,
): { element: HTMLElement; getValue: () => string; setValue: (v: string) => void } {
  const group = DOM.create('div', 'toggle-group');
  let current = initialValue;

  options.forEach(({ value, label }) => {
    const btn = DOM.create('button', `toggle-btn${value === initialValue ? ' active' : ''}`) as HTMLButtonElement;
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.value = value;
    btn.addEventListener('click', () => {
      if (current === value) return;
      current = value;
      group.querySelectorAll<HTMLElement>('.toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.value === value);
      });
      onChange(value);
    });
    DOM.append(group, btn);
  });

  return {
    element: group,
    getValue: () => current,
    setValue: (v: string) => {
      current = v;
      group.querySelectorAll<HTMLElement>('.toggle-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.value === v);
      });
    },
  };
}

/** Parse an ISO 8601 duration string into its numeric components. */
function parseDurationFields(iso: string): {
  years: number; months: number; weeks: number; days: number;
  hours: number; minutes: number; seconds: number;
} {
  const empty = { years: 0, months: 0, weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (!iso) return empty;
  const re =
    /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
  const m = iso.match(re);
  if (!m) return empty;
  const n = (i: number) => parseFloat(m[i] ?? '0') || 0;
  return { years: n(1), months: n(2), weeks: n(3), days: n(4), hours: n(5), minutes: n(6), seconds: n(7) };
}

/** Compose an ISO 8601 duration string from numeric components. Returns '' when all are zero. */
function composeDuration(
  years: number, months: number, weeks: number, days: number,
  hours: number, minutes: number, seconds: number,
): string {
  if (years === 0 && months === 0 && weeks === 0 && days === 0 &&
      hours === 0 && minutes === 0 && seconds === 0) return '';
  let iso = 'P';
  if (years)   iso += `${years}Y`;
  if (months)  iso += `${months}M`;
  if (weeks)   iso += `${weeks}W`;
  if (days)    iso += `${days}D`;
  if (hours || minutes || seconds) {
    iso += 'T';
    if (hours)   iso += `${hours}H`;
    if (minutes) iso += `${minutes}M`;
    if (seconds) iso += `${seconds}S`;
  }
  return iso;
}

/**
 * Ergonomic ISO 8601 duration builder.
 * Shows labelled number inputs (Y M W D H min s) that auto-compose to an ISO string.
 */
function createDurationBuilder(initialIso = ''): {
  element: HTMLElement;
  getValue: () => string;
  setValue: (iso: string) => void;
} {
  const container = DOM.create('div', 'duration-builder');
  const fields = DOM.create('div', 'duration-fields');

  const parsed = parseDurationFields(initialIso);

  const units = [
    { key: 'years',   label: 'Y',   init: parsed.years },
    { key: 'months',  label: 'M',   init: parsed.months },
    { key: 'weeks',   label: 'W',   init: parsed.weeks },
    { key: 'days',    label: 'D',   init: parsed.days },
    { key: 'hours',   label: 'H',   init: parsed.hours },
    { key: 'minutes', label: 'min', init: parsed.minutes },
    { key: 'seconds', label: 's',   init: parsed.seconds },
  ];

  const inputs: Record<string, HTMLInputElement> = {};

  units.forEach(({ key, label, init }) => {
    const cell = DOM.create('div', 'duration-field');
    const input = DOM.create('input', 'duration-num') as HTMLInputElement;
    input.type = 'number';
    input.min = '0';
    input.step = '1';
    if (init) input.value = String(init);
    input.placeholder = '0';
    input.title = label;
    const lbl = DOM.create('span', 'duration-unit', label);
    DOM.append(cell, input, lbl);
    DOM.append(fields, cell);
    inputs[key] = input;
  });

  const compose = (): string =>
    composeDuration(
      parseInt(inputs.years.value) || 0,
      parseInt(inputs.months.value) || 0,
      parseInt(inputs.weeks.value) || 0,
      parseInt(inputs.days.value) || 0,
      parseInt(inputs.hours.value) || 0,
      parseInt(inputs.minutes.value) || 0,
      parseInt(inputs.seconds.value) || 0,
    );

  DOM.append(container, fields);

  return {
    element: container,
    getValue: compose,
    setValue: (iso: string) => {
      const p = parseDurationFields(iso);
      inputs.years.value   = p.years   ? String(p.years)   : '';
      inputs.months.value  = p.months  ? String(p.months)  : '';
      inputs.weeks.value   = p.weeks   ? String(p.weeks)   : '';
      inputs.days.value    = p.days    ? String(p.days)    : '';
      inputs.hours.value   = p.hours   ? String(p.hours)   : '';
      inputs.minutes.value = p.minutes ? String(p.minutes) : '';
      inputs.seconds.value = p.seconds ? String(p.seconds) : '';
    },
  };
}

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
): TaskFormResult => {
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

  const dueDateLabel = DOM.create('label', 'form-label', 'Due date (optional)');
  const dueDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  dueDateInput.type = 'date';
  if (existingTask?.dueDate) dueDateInput.value = existingTask.dueDate;

  // In edit mode, display the creation date (read-only) for reference.
  const createdAtRow = DOM.create('div', `form-created-at-row${existingTask ? '' : ' hidden'}`);
  if (existingTask) {
    const createdAtLabel = DOM.create('span', 'form-label', 'Created');
    const createdAtValue = DOM.create(
      'span',
      'form-created-at-value',
      new Date(existingTask.createdAt).toLocaleString(),
    );
    DOM.append(createdAtRow, createdAtLabel, createdAtValue);
  }

  const tagsInput = DOM.create('input', 'form-input') as HTMLInputElement;
  tagsInput.type = 'text';
  tagsInput.placeholder = 'Tags (comma-separated)';
  if (existingTask) tagsInput.value = existingTask.tags.join(', ');

  // --- Priority Score section (required) ---
  const scoreSection = DOM.create('div', 'form-score-section');
  const scoreSectionTitle = DOM.create('div', 'form-score-title', '⚡ Priority Score');

  // Value type toggle
  const valueTypeLabel = DOM.create('label', 'form-label', 'Value type');
  const initialValueType = existingTask?.taskValue?.type === 'event' ? 'event' : 'direct';
  let valueType = initialValueType;

  const valueTypeToggle = createToggle(
    [
      { value: 'direct', label: '💰 Direct amount' },
      { value: 'event', label: '📊 Event (cost × probability)' },
    ],
    initialValueType,
    (v) => { valueType = v; showValueFields(); },
  );

  // Direct value fields
  const directSection = DOM.create('div', 'form-row');
  const directAmount = DOM.create('input', 'form-input') as HTMLInputElement;
  directAmount.type = 'number';
  directAmount.min = '0';
  directAmount.step = '0.01';
  directAmount.placeholder = 'Amount (e.g. 1500)';
  const directCurrencySelect = createCurrencySelect(
    existingTask?.taskValue?.type === 'direct' ? existingTask.taskValue.amount.currency : 'EUR',
  );
  DOM.append(directSection, directAmount, directCurrencySelect);

  if (existingTask?.taskValue?.type === 'direct') {
    directAmount.value = String(existingTask.taskValue.amount.amount);
  }

  // Event value fields
  const eventSection = DOM.create('div', 'form-row hidden');
  const unitCostAmount = DOM.create('input', 'form-input') as HTMLInputElement;
  unitCostAmount.type = 'number';
  unitCostAmount.min = '0';
  unitCostAmount.step = '0.01';
  unitCostAmount.placeholder = 'Unit cost (e.g. 15000)';
  const unitCostCurrencySelect = createCurrencySelect(
    existingTask?.taskValue?.type === 'event' ? existingTask.taskValue.unitCost.currency : 'EUR',
  );
  const probabilityInput = DOM.create('input', 'form-input') as HTMLInputElement;
  probabilityInput.type = 'number';
  probabilityInput.min = '0';
  probabilityInput.max = '1';
  probabilityInput.step = '0.01';
  probabilityInput.placeholder = 'Probability (0–1, e.g. 0.05)';

  // Period duration builder
  const eventPeriodLabel = DOM.create('label', 'form-label', 'Period');
  const periodBuilder = createDurationBuilder(
    existingTask?.taskValue?.type === 'event' ? existingTask.taskValue.period.iso : '',
  );

  DOM.append(eventSection, unitCostAmount, unitCostCurrencySelect, probabilityInput);

  if (existingTask?.taskValue?.type === 'event') {
    unitCostAmount.value = String(existingTask.taskValue.unitCost.amount);
    probabilityInput.value = String(existingTask.taskValue.probability);
  }

  const showValueFields = (): void => {
    directSection.classList.toggle('hidden', valueType !== 'direct');
    eventSection.classList.toggle('hidden', valueType !== 'event');
    eventPeriodLabel.classList.toggle('hidden', valueType !== 'event');
    periodBuilder.element.classList.toggle('hidden', valueType !== 'event');
    directAmount.required = valueType === 'direct';
    unitCostAmount.required = valueType === 'event';
    probabilityInput.required = valueType === 'event';
  };
  showValueFields();

  // Target delivery toggle
  const deliveryLabel = DOM.create('label', 'form-label', 'Target delivery');
  const initialDeliveryType =
    existingTask && typeof existingTask.targetDelivery !== 'string' ? 'duration' : 'date';
  let deliveryType = initialDeliveryType;

  const deliveryToggle = createToggle(
    [
      { value: 'date',     label: '📅 Fixed date' },
      { value: 'duration', label: '⏱ Duration from now' },
    ],
    initialDeliveryType,
    (v) => { deliveryType = v; showDeliveryFields(); },
  );

  const deliveryDateInput = DOM.create('input', 'form-input') as HTMLInputElement;
  deliveryDateInput.type = 'date';
  deliveryDateInput.required = initialDeliveryType === 'date';

  const deliveryDurationBuilder = createDurationBuilder(
    existingTask && typeof existingTask.targetDelivery !== 'string'
      ? existingTask.targetDelivery.iso
      : '',
  );

  if (existingTask?.targetDelivery) {
    if (typeof existingTask.targetDelivery === 'string') {
      deliveryDateInput.value = existingTask.targetDelivery;
    }
  }

  const showDeliveryFields = (): void => {
    const isDate = deliveryType === 'date';
    deliveryDateInput.classList.toggle('hidden', !isDate);
    deliveryDurationBuilder.element.classList.toggle('hidden', isDate);
    deliveryDateInput.required = isDate;
  };
  showDeliveryFields();

  // Remaining estimate duration builder
  const estimateLabel = DOM.create('label', 'form-label', 'Remaining estimate');
  const estimateBuilder = createDurationBuilder(
    existingTask?.remainingEstimate ? existingTask.remainingEstimate.iso : '',
  );

  // Status selector – toggle buttons, only shown when editing
  let currentStatus: TaskStatus = existingTask ? existingTask.status : 'todo';
  const statusLabelEl = DOM.create('label', `form-label${existingTask ? '' : ' hidden'}`, 'Status');
  const statusButtonsRow = DOM.create('div', `status-filter-buttons${existingTask ? '' : ' hidden'}`);
  STATUS_OPTIONS.forEach(({ value, label, cssClass }) => {
    const btn = DOM.create('button', `status-btn ${cssClass}${value === currentStatus ? ' active' : ''}`) as HTMLButtonElement;
    btn.type = 'button';
    btn.textContent = label;
    btn.dataset.value = value;
    btn.addEventListener('click', () => {
      currentStatus = value;
      statusButtonsRow.querySelectorAll<HTMLElement>('.status-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.value === value);
      });
    });
    DOM.append(statusButtonsRow, btn);
  });

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
    valueTypeLabel, valueTypeToggle.element,
    directSection,
    eventSection,
    eventPeriodLabel, periodBuilder.element,
    deliveryLabel, deliveryToggle.element, deliveryDateInput, deliveryDurationBuilder.element,
    estimateLabel, estimateBuilder.element,
  );

  const submitBtn = DOM.create('button', 'btn-primary', submitLabel);
  (submitBtn as HTMLButtonElement).type = 'submit';
  // In edit mode the submit button is hidden; saving happens via save()
  if (existingTask) submitBtn.classList.add('hidden');

  /** Validate form fields, call onSubmit if valid. Returns true on success. */
  const doSubmit = (): boolean => {
    // Build taskValue
    let taskValue: TaskValue;
    if (valueType === 'direct') {
      if (!directAmount.value) {
        directAmount.reportValidity();
        return false;
      }
      taskValue = {
        type: 'direct',
        amount: { amount: parseFloat(directAmount.value), currency: directCurrencySelect.value },
      };
    } else {
      const periodIso = periodBuilder.getValue();
      if (!unitCostAmount.value || !probabilityInput.value || !periodIso) {
        if (!unitCostAmount.value) unitCostAmount.setCustomValidity('Please enter a unit cost.');
        if (!probabilityInput.value) probabilityInput.setCustomValidity('Please enter a probability.');
        if (!periodIso) {
          periodBuilder.element.classList.add('duration-error');
          setTimeout(() => periodBuilder.element.classList.remove('duration-error'), 2000);
        }
        form.reportValidity();
        unitCostAmount.setCustomValidity('');
        probabilityInput.setCustomValidity('');
        return false;
      }
      taskValue = {
        type: 'event',
        unitCost: { amount: parseFloat(unitCostAmount.value), currency: unitCostCurrencySelect.value },
        probability: parseFloat(probabilityInput.value),
        period: { iso: periodIso },
      };
    }

    // Build targetDelivery
    let targetDelivery: string | Duration;
    if (deliveryType === 'date') {
      if (!deliveryDateInput.value) {
        deliveryDateInput.reportValidity();
        return false;
      }
      targetDelivery = deliveryDateInput.value;
    } else {
      const durIso = deliveryDurationBuilder.getValue();
      if (!durIso) {
        deliveryDurationBuilder.element.classList.add('duration-error');
        setTimeout(() => deliveryDurationBuilder.element.classList.remove('duration-error'), 2000);
        return false;
      }
      targetDelivery = { iso: durIso };
    }

    const estimateIso = estimateBuilder.getValue();
    if (!estimateIso) {
      estimateBuilder.element.classList.add('duration-error');
      setTimeout(() => estimateBuilder.element.classList.remove('duration-error'), 2000);
      return false;
    }
    const remainingEstimate: Duration = { iso: estimateIso };

    const taskData: TaskFormData = {
      title: titleInput.value,
      description: descriptionInput.value,
      status: currentStatus,
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
      currentStatus = 'todo';
      valueType = 'direct';
      deliveryType = 'date';
      valueTypeToggle.setValue('direct');
      deliveryToggle.setValue('date');
      estimateBuilder.setValue('');
      periodBuilder.setValue('');
      deliveryDurationBuilder.setValue('');
      showValueFields();
      showDeliveryFields();
    }
    return true;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    doSubmit();
  });

  DOM.append(
    form,
    createdAtRow,
    titleInput, descriptionInput, dueDateLabel, dueDateInput, tagsInput,
    statusLabelEl, statusButtonsRow,
    startDateLabel, startDateInput,
    scoreSection,
    submitBtn,
  );
  return { element: form, save: doSubmit };
};
