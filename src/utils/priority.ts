import type { Duration, Task, TaskValue } from '../types/Task';

/** Millisecond constants (months and years are calendar approximations: 1 month = 30.4375 days, 1 year = 365.25 days). */
const MS = {
  second: 1_000,
  minute: 60_000,
  hour: 3_600_000,
  day: 86_400_000,
  week: 604_800_000,
  month: 30.4375 * 86_400_000,
  year: 365.25 * 86_400_000,
} as const;

/**
 * Parse an ISO 8601 duration string and return the equivalent number of milliseconds.
 *
 * Supported format: P[nY][nM][nW][nD][T[nH][nM][nS]]
 * Examples: "P3D" → 3 days, "P1Y6M" → 1.5 years (approx), "PT2H30M" → 2.5 hours.
 *
 * Approximations used: 1 month = 30.4375 days, 1 year = 365.25 days.
 *
 * @throws {Error} when the string does not match the ISO 8601 duration pattern.
 */
export function parseDuration(iso: string): number {
  const re =
    /^P(?:(\d+(?:\.\d+)?)Y)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;
  const m = iso.match(re);
  if (!m) throw new Error(`Invalid ISO 8601 duration: "${iso}"`);
  const n = (i: number) => parseFloat(m[i] ?? '0') || 0;
  return (
    n(1) * MS.year +
    n(2) * MS.month +
    n(3) * MS.week +
    n(4) * MS.day +
    n(5) * MS.hour +
    n(6) * MS.minute +
    n(7) * MS.second
  );
}

/**
 * Resolve a `targetDelivery` value to an absolute UTC timestamp (ms since epoch).
 *
 * - If `targetDelivery` is a string it is interpreted as an ISO date/datetime.
 * - If it is a `Duration` it is added to `now`.
 */
export function resolveDeadlineMs(targetDelivery: string | Duration, now = Date.now()): number {
  if (typeof targetDelivery === 'string') {
    return new Date(targetDelivery).getTime();
  }
  return now + parseDuration(targetDelivery.iso);
}

/**
 * Compute the numeric monetary value of a task's `TaskValue`.
 *
 * - Direct: returns `amount.amount`
 * - Event:  returns `unitCost.amount × probability`
 */
export function computeTaskValue(taskValue: TaskValue): number {
  if (taskValue.type === 'direct') {
    return taskValue.amount.amount;
  }
  return taskValue.unitCost.amount * taskValue.probability;
}

/**
 * Compute the priority score for a task.
 *
 * Formula:
 *   V = monetary value of the task
 *   T = max(0, deadline_ms − now_ms)   (remaining time before deadline)
 *   E = parseDuration(remainingEstimate) (estimated work remaining)
 *   R = T / E
 *
 *   Score = V              when R ≤ 1  (deadline is reachable or already past)
 *   Score = V × e^(−k×(R−1))  when R > 1  (more time available than needed)
 *
 * Returns `null` when `taskValue`, `targetDelivery`, or `remainingEstimate` is absent.
 */
export function computePriorityScore(
  task: Task,
  priorityCoefficient = 1.0,
  now = Date.now(),
): number | null {
  if (!task.taskValue || !task.targetDelivery || !task.remainingEstimate) {
    return null;
  }

  const V = computeTaskValue(task.taskValue);
  const E = parseDuration(task.remainingEstimate.iso);
  if (E <= 0) return V;

  const deadlineMs = resolveDeadlineMs(task.targetDelivery, now);
  const T = Math.max(0, deadlineMs - now);
  const R = T / E;

  if (R <= 1) return V;
  return V * Math.exp(-priorityCoefficient * (R - 1));
}

/**
 * Format a monetary amount as a localised currency string (e.g. "1 500,00 €").
 * Falls back to "<amount> <currency>" when the locale API is unavailable.
 */
export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}
