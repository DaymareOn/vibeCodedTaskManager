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
 */
export function computePriorityScore(
  task: Task,
  priorityCoefficient = 1.0,
  now = Date.now(),
): number {
  if (!task.taskValue || !task.remainingEstimate || !task.targetDelivery) return 0;
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
 * Convert an amount from one currency to the main/base currency.
 *
 * @param amount  The value to convert.
 * @param from    The source ISO 4217 currency code.
 * @param mainCurrency  The target ISO 4217 currency code.
 * @param rates   Exchange-rate map returned by the store: rates[X] = "how many X per 1 mainCurrency".
 *                If `from` is missing from the map the original amount is returned unchanged.
 */
export function convertToMainCurrency(
  amount: number,
  from: string,
  mainCurrency: string,
  rates: Record<string, number>,
): number {
  if (from === mainCurrency) return amount;
  const rate = rates[from];
  if (!rate) return amount; // unknown currency — no conversion
  return amount / rate;
}

/**
 * Compute the monetary value of a task's `TaskValue`, optionally converting to a main currency.
 *
 * - Direct: returns `amount.amount` (converted if rates provided)
 * - Event:  returns `unitCost.amount × probability` (unit cost converted if rates provided)
 */
export function computeTaskValueConverted(
  taskValue: TaskValue,
  mainCurrency: string,
  rates: Record<string, number>,
): number {
  if (!taskValue) return 0;
  if (taskValue.type === 'direct') {
    return convertToMainCurrency(taskValue.amount.amount, taskValue.amount.currency, mainCurrency, rates);
  }
  const convertedUnitCost = convertToMainCurrency(
    taskValue.unitCost.amount,
    taskValue.unitCost.currency,
    mainCurrency,
    rates,
  );
  return convertedUnitCost * taskValue.probability;
}


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

/** Format a number without any currency sign (plain decimal notation). */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Compute dependency-boosted priority scores for a collection of tasks.
 *
 * Rule: if task A has `dependsOn = B.id` AND score(A) > score(B), then
 * score(B) is raised to score(A) + 1.  Applied iteratively until stable
 * so that chains (A→B→C) are fully propagated.
 *
 * @param tasks         All tasks (root-level and sub-tasks).
 * @param mainCurrency  ISO 4217 code for the display currency.
 * @param rates         Exchange-rate map from the store.
 * @param priorityCoefficient  Passed through to `computePriorityScoreConverted`.
 * @param now           Current timestamp in ms (injectable for testing).
 * @returns A Map from task ID to its final (possibly boosted) priority score.
 */
export function computeBoostedScores(
  tasks: Task[],
  mainCurrency: string,
  rates: Record<string, number>,
  priorityCoefficient = 1.0,
  now = Date.now(),
): Map<string, number> {
  const scores = new Map<string, number>();
  for (const task of tasks) {
    scores.set(task.id, computePriorityScoreConverted(task, mainCurrency, rates, priorityCoefficient, now));
  }

  // Iteratively apply the boost until no more changes occur (handles chains).
  // The maximum number of iterations is bounded by tasks.length to guard against
  // circular dependencies (A→B→A) that would otherwise cause an infinite loop.
  const maxIterations = tasks.length;
  let iterations = 0;
  let changed = true;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    for (const task of tasks) {
      if (!task.dependsOn) continue;
      const scoreA = scores.get(task.id) ?? 0;
      const scoreB = scores.get(task.dependsOn);
      if (scoreB === undefined) continue; // dependency not found in this task set
      if (scoreA > scoreB) {
        scores.set(task.dependsOn, scoreA + 1);
        changed = true;
      }
    }
  }

  return scores;
}

/**
 * Compute the priority score for a task, with the monetary value converted to the main currency.
 *
 * This is identical to `computePriorityScore` but uses `computeTaskValueConverted` so that the
 * result is expressed in the user's main currency rather than the task's native currency.
 */
export function computePriorityScoreConverted(
  task: Task,
  mainCurrency: string,
  rates: Record<string, number>,
  priorityCoefficient = 1.0,
  now = Date.now(),
): number {
  if (!task.taskValue || !task.remainingEstimate || !task.targetDelivery) return 0;
  const V = computeTaskValueConverted(task.taskValue, mainCurrency, rates);
  const E = parseDuration(task.remainingEstimate.iso);
  if (E <= 0) return V;

  const deadlineMs = resolveDeadlineMs(task.targetDelivery, now);
  const T = Math.max(0, deadlineMs - now);
  const R = T / E;

  if (R <= 1) return V;
  return V * Math.exp(-priorityCoefficient * (R - 1));
}
