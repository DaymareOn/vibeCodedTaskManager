import type { Task } from '../types/Task';
import { DOM } from '../utils/dom';
import { TaskCard } from './TaskCard';
import { useTaskStore } from '../store/taskStore';

export const TaskList = (container: HTMLElement): void => {
  const render = (tasks: Task[]): void => {
    DOM.clear(container);

    if (tasks.length === 0) {
      const empty = DOM.create('div', 'empty-state');
      const emptyIcon = DOM.create('div', 'empty-icon', '📋');
      const emptyText = DOM.create('p', 'empty-text', 'No tasks found. Add your first task above!');
      DOM.append(empty, emptyIcon, emptyText);
      DOM.append(container, empty);
      return;
    }

    const onDelete = (id: string): void => {
      useTaskStore.getState().deleteTask(id);
    };

    tasks.forEach((task) => {
      const card = TaskCard(task, onDelete);
      DOM.append(container, card);
    });
  };

  // Subscribe to store changes
  useTaskStore.subscribe((state) => {
    render(state.getFilteredTasks());
  });

  // Initial render
  render(useTaskStore.getState().getFilteredTasks());
};
