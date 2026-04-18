/** A named group of tasks that shares a priority-score decay coefficient. */
export interface TaskGroup {
  id: string;
  name: string;
  /**
   * Exponential decay coefficient k used in the priority-score formula.
   * Higher values make the score drop faster as the deadline moves further away.
   * Default: 1.0
   */
  priorityCoefficient: number;
}
