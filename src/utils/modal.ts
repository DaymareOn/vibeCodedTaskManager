import { DOM } from './dom';

/**
 * Display content in a centred modal overlay.
 * @param content      The element to show inside the modal box.
 * @param onBeforeClose  Called before the modal closes; return false to cancel closing.
 * @returns A `close` function that tears down the modal.
 */
export function showModal(content: HTMLElement, onBeforeClose?: () => boolean): () => void {
  const overlay = DOM.create('div', 'modal-overlay');
  const box = DOM.create('div', 'modal-box');
  const closeBtn = DOM.create('button', 'modal-close btn btn-secondary', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';

  const close = (): void => {
    if (onBeforeClose && !onBeforeClose()) return;
    overlay.remove();
    document.removeEventListener('keydown', handleKeyDown);
  };

  const handleKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  DOM.append(box, closeBtn, content);
  DOM.append(overlay, box);
  document.body.appendChild(overlay);
  return close;
}
