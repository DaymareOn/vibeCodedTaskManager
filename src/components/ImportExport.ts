import { DOM } from '../utils/dom';
import { useTaskStore } from '../store/taskStore';
import type { Task } from '../types/Task';

/** Trigger a file download in the browser. */
function downloadFile(filename: string, content: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Validate that a parsed value looks like a Task array (minimal check). */
function isTaskArray(value: unknown): value is Task[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item !== null &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).title === 'string',
    )
  );
}

export const ImportExport = (): HTMLElement => {
  const bar = DOM.create('div', 'import-export-bar');

  // --- Export button ---
  const exportBtn = DOM.create('button', 'btn btn-secondary', '⬇ Export tasks');
  exportBtn.title = 'Download all tasks as a JSON file';
  exportBtn.addEventListener('click', () => {
    const json = useTaskStore.getState().exportTasks();
    downloadFile('tasks.json', json);
  });

  // --- Import button + hidden file input ---
  const importBtn = DOM.create('button', 'btn btn-secondary', '⬆ Import tasks');
  importBtn.title = 'Load tasks from a JSON file (replaces current tasks)';

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(e.target?.result as string);
        if (!isTaskArray(parsed)) {
          alert('Invalid tasks file: expected an array of task objects.');
          return;
        }
        if (!confirm(`Replace all current tasks with ${parsed.length} imported task(s)?`)) return;
        useTaskStore.getState().importTasks(parsed);
      } catch {
        alert('Failed to parse the JSON file. Please check the file format.');
      } finally {
        // Reset so the same file can be re-imported if needed
        fileInput.value = '';
      }
    };
    reader.readAsText(file);
  });

  importBtn.addEventListener('click', () => fileInput.click());

  DOM.append(bar, exportBtn, importBtn, fileInput as unknown as HTMLElement);
  return bar;
};
