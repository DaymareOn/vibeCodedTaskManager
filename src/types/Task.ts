// Task interface definition
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

/** ISO 4217 monetary amount (e.g. { amount: 1500, currency: "EUR" }) */
export interface Money {
  amount: number;
  /** ISO 4217 currency code, e.g. "EUR", "USD" */
  currency: string;
}

/** ISO 8601 duration wrapper (e.g. { iso: "P3D" } = 3 days, { iso: "PT2H" } = 2 hours) */
export interface Duration {
  iso: string;
}

/** Value of a task expressed either as a direct monetary amount or as an expected-value calculation. */
export type TaskValue =
  | { type: 'direct'; amount: Money }
  | {
      type: 'event';
      /** Unit cost of the event occurring */
      unitCost: Money;
      /** Probability that the event occurs over the given period, in [0, 1] */
      probability: number;
      /** Reference period for the probability (informational) */
      period: Duration;
    };

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  // --- Priority score inputs ---
  /** Monetary value of the task (direct amount or event expected value) */
  taskValue?: TaskValue;
  /** Target delivery date as an ISO date string, or as a Duration relative to "now" */
  targetDelivery?: string | Duration;
  /** Estimated remaining work duration */
  remainingEstimate?: Duration;
  /** ID of the TaskGroup this task belongs to */
  groupId?: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  groupId?: string;
  sortByScore?: boolean;
}