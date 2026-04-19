import { DOM } from '../utils/dom';
import { ConceptsConfigManager, CONCEPT_DEFS } from '../utils/conceptsConfig';
import { t, onLocaleChange } from '../utils/i18n';

export interface ConceptsOverlayApi {
  element: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
  refresh(): void;
}

// ---- Map concept IDs to their target element in the app mockup ----
// Each entry describes where on the mockup the arrow should point to.
// Positions are expressed as percentages of the mockup's width/height.
interface ArrowTarget { x: number; y: number; }
const CONCEPT_ARROW_TARGETS: Record<string, ArrowTarget> = {
  'tools-column':      { x: 6,  y: 50  },
  'timeline':          { x: 50, y: 55  },
  'timeline-ruler':    { x: 50, y: 8   },
  'history-scrubber':  { x: 50, y: 18  },
  'task-bars':         { x: 55, y: 50  },
  'priority-score':    { x: 65, y: 38  },
  'task-value':        { x: 65, y: 48  },
  'sub-tasks':         { x: 60, y: 62  },
  'edit-column':       { x: 94, y: 50  },
  'status-colors':     { x: 42, y: 60  },
  'filter-bar':        { x: 6,  y: 28  },
  'zoom':              { x: 50, y: 82  },
};

// Arrange concept cards around the mockup: 4 on the left, 4 on the right, 4 on the bottom
const CARD_POSITIONS: Array<{ id: string; side: 'left' | 'right' | 'bottom' }> = [
  { id: 'tools-column',     side: 'left'   },
  { id: 'filter-bar',       side: 'left'   },
  { id: 'timeline-ruler',   side: 'left'   },
  { id: 'history-scrubber', side: 'left'   },
  { id: 'edit-column',      side: 'right'  },
  { id: 'task-bars',        side: 'right'  },
  { id: 'priority-score',   side: 'right'  },
  { id: 'task-value',       side: 'right'  },
  { id: 'timeline',         side: 'bottom' },
  { id: 'status-colors',    side: 'bottom' },
  { id: 'sub-tasks',        side: 'bottom' },
  { id: 'zoom',             side: 'bottom' },
];

export const ConceptsOverlay = (): ConceptsOverlayApi => {
  const overlay = DOM.create('div', 'co-overlay hidden');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  // Close on backdrop click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  // ---- Panel ----
  const panel = DOM.create('div', 'co-panel co-panel-visual');

  // Title bar
  const titleBar = DOM.create('div', 'co-title-bar');
  const title    = DOM.create('h2', 'co-title', t('concepts.title'));
  const hint     = DOM.create('span', 'co-hint', t('concepts.closeHint'));
  const closeBtn = DOM.create('button', 'co-close-btn', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';
  closeBtn.setAttribute('aria-label', t('concepts.close'));
  closeBtn.addEventListener('click', close);
  DOM.append(titleBar, title, hint, closeBtn);

  // ---- Visual layout: [left cards] [app mockup] [right cards] ----
  const visualLayout = DOM.create('div', 'co-visual-layout');

  const leftCards  = DOM.create('div', 'co-side-cards co-side-left');
  const rightCards = DOM.create('div', 'co-side-cards co-side-right');
  const bottomCards = DOM.create('div', 'co-bottom-cards');

  // ---- App mockup at 50% scale ----
  const mockupWrapper = DOM.create('div', 'co-mockup-wrapper');
  const mockup        = DOM.create('div', 'co-app-mockup');

  // Left panel (tools)
  const mockupTools = DOM.create('div', 'co-mock-tools');
  const mockupToolsTitle = DOM.create('div', 'co-mock-tools-title', '');
  const mockupFilter     = DOM.create('div', 'co-mock-filter');
  const mockupFilter2    = DOM.create('div', 'co-mock-filter');
  const mockupSection1   = DOM.create('div', 'co-mock-section');
  const mockupSection2   = DOM.create('div', 'co-mock-section');
  DOM.append(mockupTools, mockupToolsTitle, mockupFilter, mockupFilter2, mockupSection1, mockupSection2);

  // Center (timeline)
  const mockupTimeline = DOM.create('div', 'co-mock-timeline');
  const mockupRuler    = DOM.create('div', 'co-mock-ruler');
  const mockupScrubber = DOM.create('div', 'co-mock-scrubber');
  const mockupBody     = DOM.create('div', 'co-mock-body');
  // Task bars
  for (let i = 0; i < 5; i++) {
    const bar = DOM.create('div', `co-mock-bar co-mock-bar-${i % 4}`);
    bar.style.width = `${30 + (i * 13) % 40}%`;
    bar.style.marginLeft = `${(i * 7) % 20}%`;
    DOM.append(mockupBody, bar);
  }
  DOM.append(mockupTimeline, mockupRuler, mockupScrubber, mockupBody);

  // Right panel (edit column)
  const mockupEdit = DOM.create('div', 'co-mock-edit');
  const mockupEditTitle = DOM.create('div', 'co-mock-edit-title', '');
  const mockupField1 = DOM.create('div', 'co-mock-field');
  const mockupField2 = DOM.create('div', 'co-mock-field');
  const mockupField3 = DOM.create('div', 'co-mock-field co-mock-field-short');
  DOM.append(mockupEdit, mockupEditTitle, mockupField1, mockupField2, mockupField3);

  DOM.append(mockup, mockupTools, mockupTimeline, mockupEdit);
  DOM.append(mockupWrapper, mockup);

  // ---- SVG for arrows ----
  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowSvg.setAttribute('class', 'co-arrows-svg');
  arrowSvg.setAttribute('aria-hidden', 'true');
  DOM.append(mockupWrapper, arrowSvg);

  // ---- Build concept cards ----
  const conceptCardEls: Record<string, HTMLElement> = {};

  CONCEPT_DEFS.forEach((def) => {
    const placement = CARD_POSITIONS.find((p) => p.id === def.id);
    if (!placement) return;

    const card = DOM.create('div', 'co-card co-card-visual');
    card.dataset.conceptId = def.id;

    const cardHeader = DOM.create('div', 'co-card-header');
    const cardIcon   = DOM.create('span', 'co-card-icon', def.emoji);
    const cardTitle  = DOM.create('span', 'co-card-title', def.title);
    DOM.append(cardHeader, cardIcon, cardTitle);

    const cardDesc = DOM.create('p', 'co-card-desc', ConceptsConfigManager.getDescription(def.id));
    DOM.append(card, cardHeader, cardDesc);

    conceptCardEls[def.id] = card;

    if (placement.side === 'left')        DOM.append(leftCards, card);
    else if (placement.side === 'right')  DOM.append(rightCards, card);
    else                                  DOM.append(bottomCards, card);
  });

  DOM.append(visualLayout, leftCards, mockupWrapper, rightCards);

  // ---- Assemble ----
  DOM.append(panel, titleBar, visualLayout, bottomCards);
  DOM.append(overlay, panel);

  // ---- Draw arrows after open (needs layout) ----
  function drawArrows(): void {
    // Clear previous arrows
    while (arrowSvg.firstChild) arrowSvg.removeChild(arrowSvg.firstChild);

    // Add defs for arrowhead marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'co-arrowhead');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '6');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 8 3, 0 6');
    polygon.setAttribute('fill', 'var(--primary)');
    DOM.append(marker, polygon);
    DOM.append(defs, marker);
    DOM.append(arrowSvg, defs);

    const svgRect    = arrowSvg.getBoundingClientRect();
    const mockupRect = mockup.getBoundingClientRect();

    // Size the SVG to fill the wrapper
    arrowSvg.setAttribute('width',  String(svgRect.width));
    arrowSvg.setAttribute('height', String(svgRect.height));
    arrowSvg.setAttribute('viewBox', `0 0 ${svgRect.width} ${svgRect.height}`);

    CONCEPT_DEFS.forEach((def) => {
      const target = CONCEPT_ARROW_TARGETS[def.id];
      const card   = conceptCardEls[def.id];
      if (!target || !card) return;

      const cardRect = card.getBoundingClientRect();
      if (cardRect.width === 0) return; // not visible

      // Arrow end: the target point on the mockup
      const endX = mockupRect.left - svgRect.left + (target.x / 100) * mockupRect.width;
      const endY = mockupRect.top  - svgRect.top  + (target.y / 100) * mockupRect.height;

      // Arrow start: the center of the nearest edge of the card
      const placement = CARD_POSITIONS.find((p) => p.id === def.id);
      let startX: number;
      let startY: number;
      if (placement?.side === 'left') {
        startX = cardRect.right  - svgRect.left;
        startY = cardRect.top    - svgRect.top + cardRect.height / 2;
      } else if (placement?.side === 'right') {
        startX = cardRect.left   - svgRect.left;
        startY = cardRect.top    - svgRect.top + cardRect.height / 2;
      } else {
        // bottom
        startX = cardRect.left   - svgRect.left + cardRect.width  / 2;
        startY = cardRect.top    - svgRect.top;
      }

      // Bezier control point: use midX horizontally, keep startY as control Y
      const mx = (startX + endX) / 2;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${startX} ${startY} Q ${mx} ${startY} ${endX} ${endY}`);
      path.setAttribute('stroke', 'var(--primary)');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '4 3');
      path.setAttribute('fill', 'none');
      path.setAttribute('opacity', '0.7');
      path.setAttribute('marker-end', 'url(#co-arrowhead)');
      DOM.append(arrowSvg, path);
    });
  }

  // ---- Update locale ----
  onLocaleChange(() => {
    title.textContent = t('concepts.title');
    hint.textContent  = t('concepts.closeHint');
    closeBtn.setAttribute('aria-label', t('concepts.close'));
  });

  // ---- API ----
  let _open = false;

  function open(): void {
    _open = true;
    overlay.classList.remove('hidden');
    // Draw arrows on next frame after layout
    requestAnimationFrame(() => requestAnimationFrame(drawArrows));
  }

  function close(): void {
    _open = false;
    overlay.classList.add('hidden');
  }

  function refresh(): void {
    panel.querySelectorAll<HTMLElement>('.co-card').forEach((card) => {
      const conceptId = card.dataset.conceptId ?? '';
      const descEl = card.querySelector('.co-card-desc') as HTMLElement | null;
      if (descEl) descEl.textContent = ConceptsConfigManager.getDescription(conceptId);
    });
    if (_open) requestAnimationFrame(drawArrows);
  }

  return { element: overlay, open, close, isOpen: () => _open, refresh };
};
