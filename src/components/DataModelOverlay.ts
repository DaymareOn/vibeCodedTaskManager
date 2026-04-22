import { DOM } from '../utils/dom';
import { t, onLocaleChange } from '../utils/i18n';

export interface DataModelOverlayApi {
  element: HTMLElement;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export const DataModelOverlay = (): DataModelOverlayApi => {
  const overlay = DOM.create('div', 'dmo-overlay hidden');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  const panel = DOM.create('div', 'dmo-panel');

  const titleBar = DOM.create('div', 'dmo-title-bar');
  const title = DOM.create('h2', 'dmo-title', t('dataModel.title'));
  const hint = DOM.create('span', 'dmo-hint', t('dataModel.closeHint'));
  const closeBtn = DOM.create('button', 'dmo-close-btn', '✕');
  (closeBtn as HTMLButtonElement).type = 'button';
  closeBtn.setAttribute('aria-label', t('dataModel.close'));
  closeBtn.addEventListener('click', close);
  DOM.append(titleBar, title, hint, closeBtn);

  // SVG class diagram
  const svgContainer = DOM.create('div', 'dmo-svg-container');
  svgContainer.innerHTML = buildClassDiagramSVG();

  DOM.append(panel, titleBar, svgContainer);
  DOM.append(overlay, panel);

  onLocaleChange(() => {
    title.textContent = t('dataModel.title');
    hint.textContent = t('dataModel.closeHint');
    closeBtn.setAttribute('aria-label', t('dataModel.close'));
  });

  let _open = false;

  function open(): void {
    _open = true;
    overlay.classList.remove('hidden');
  }

  function close(): void {
    _open = false;
    overlay.classList.add('hidden');
  }

  return { element: overlay, open, close, isOpen: () => _open };
};

function buildClassDiagramSVG(): string {
  // SVG dimensions and layout
  const W = 900;
  const H = 620;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="dmo-svg" aria-label="Task data model class diagram">
  <defs>
    <marker id="dmo-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="var(--primary, #6c8ebf)" />
    </marker>
    <marker id="dmo-diamond" markerWidth="12" markerHeight="8" refX="1" refY="4" orient="auto">
      <polygon points="0 4, 6 0, 12 4, 6 8" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--primary, #6c8ebf)" stroke-width="1.5" />
    </marker>
  </defs>

  <!-- Task class (center-top) -->
  <g transform="translate(300, 20)">
    <rect x="0" y="0" width="280" height="300" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--primary, #6c8ebf)" stroke-width="2"/>
    <rect x="0" y="0" width="280" height="32" rx="6" fill="var(--primary, #6c8ebf)" opacity="0.85"/>
    <rect x="0" y="22" width="280" height="10" fill="var(--primary, #6c8ebf)" opacity="0.85"/>
    <text x="140" y="22" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="monospace">Task</text>
    <!-- Fields -->
    <text x="10" y="52" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">id: string</text>
    <text x="10" y="68" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">title: string</text>
    <text x="10" y="84" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">description: string</text>
    <text x="10" y="100" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">status: TaskStatus</text>
    <text x="10" y="116" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">createdAt: string (ISO 8601)</text>
    <text x="10" y="132" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">updatedAt: string (ISO 8601)</text>
    <text x="10" y="148" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">tags: string[]</text>
    <text x="10" y="164" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">taskValue: TaskValue</text>
    <text x="10" y="180" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">targetDelivery: string | Duration</text>
    <text x="10" y="196" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">remainingEstimate: Duration</text>
    <text x="10" y="212" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">dueDate?: string (ISO date)</text>
    <text x="10" y="228" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">startDate?: string (ISO date)</text>
    <text x="10" y="244" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">completedAt?: string (ISO 8601)</text>
    <text x="10" y="260" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">parentId?: string</text>
    <text x="10" y="276" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">assignee?: string</text>
    <line x1="0" y1="286" x2="280" y2="286" stroke="var(--primary, #6c8ebf)" stroke-width="0.5" opacity="0.4"/>
    <text x="140" y="298" text-anchor="middle" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">italic = optional fields</text>
  </g>

  <!-- TaskStatus enum (top-right) -->
  <g transform="translate(630, 20)">
    <rect x="0" y="0" width="220" height="110" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--accent, #d97706)" stroke-width="1.5"/>
    <rect x="0" y="0" width="220" height="32" rx="6" fill="var(--accent, #d97706)" opacity="0.85"/>
    <rect x="0" y="22" width="220" height="10" fill="var(--accent, #d97706)" opacity="0.85"/>
    <text x="110" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="monospace">«enum» TaskStatus</text>
    <text x="12" y="52" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">todo</text>
    <text x="12" y="68" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">in-progress</text>
    <text x="12" y="84" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">done</text>
    <text x="12" y="100" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">cancelled</text>
  </g>

  <!-- Duration class (top-left) -->
  <g transform="translate(30, 20)">
    <rect x="0" y="0" width="210" height="80" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--success, #22c55e)" stroke-width="1.5"/>
    <rect x="0" y="0" width="210" height="32" rx="6" fill="var(--success, #22c55e)" opacity="0.75"/>
    <rect x="0" y="22" width="210" height="10" fill="var(--success, #22c55e)" opacity="0.75"/>
    <text x="105" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="monospace">Duration</text>
    <text x="10" y="52" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">iso: string</text>
    <text x="10" y="68" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">e.g. "P2D", "PT3H30M"</text>
  </g>

  <!-- Money class (bottom-left) -->
  <g transform="translate(30, 420)">
    <rect x="0" y="0" width="210" height="96" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--success, #22c55e)" stroke-width="1.5"/>
    <rect x="0" y="0" width="210" height="32" rx="6" fill="var(--success, #22c55e)" opacity="0.75"/>
    <rect x="0" y="22" width="210" height="10" fill="var(--success, #22c55e)" opacity="0.75"/>
    <text x="105" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="monospace">Money</text>
    <text x="10" y="52" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">amount: number</text>
    <text x="10" y="68" fill="var(--text, #e0e0e0)" font-size="12" font-family="monospace">currency: string</text>
    <text x="10" y="84" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">e.g. {amount:1500, currency:"EUR"}</text>
  </g>

  <!-- TaskValue (discriminated union) -->
  <!-- Direct variant -->
  <g transform="translate(30, 170)">
    <rect x="0" y="0" width="220" height="96" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--warning, #f59e0b)" stroke-width="1.5"/>
    <rect x="0" y="0" width="220" height="32" rx="6" fill="var(--warning, #f59e0b)" opacity="0.75"/>
    <rect x="0" y="22" width="220" height="10" fill="var(--warning, #f59e0b)" opacity="0.75"/>
    <text x="110" y="22" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="monospace">TaskValue (direct)</text>
    <text x="10" y="52" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">type: "direct"</text>
    <text x="10" y="68" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">amount: Money</text>
    <text x="10" y="84" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">Direct monetary value</text>
  </g>

  <!-- Event variant -->
  <g transform="translate(30, 300)">
    <rect x="0" y="0" width="220" height="112" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--warning, #f59e0b)" stroke-width="1.5"/>
    <rect x="0" y="0" width="220" height="32" rx="6" fill="var(--warning, #f59e0b)" opacity="0.75"/>
    <rect x="0" y="22" width="220" height="10" fill="var(--warning, #f59e0b)" opacity="0.75"/>
    <text x="110" y="22" text-anchor="middle" fill="white" font-size="12" font-weight="bold" font-family="monospace">TaskValue (event)</text>
    <text x="10" y="52" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">type: "event"</text>
    <text x="10" y="68" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">unitCost: Money</text>
    <text x="10" y="84" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">probability: number [0,1]</text>
    <text x="10" y="100" fill="var(--text, #e0e0e0)" font-size="11" font-family="monospace">period: Duration</text>
  </g>

  <!-- TaskFilter class (bottom-right) -->
  <g transform="translate(630, 420)">
    <rect x="0" y="0" width="220" height="112" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--primary, #6c8ebf)" stroke-width="1.5" stroke-dasharray="6 3"/>
    <rect x="0" y="0" width="220" height="32" rx="6" fill="var(--primary, #6c8ebf)" opacity="0.5"/>
    <rect x="0" y="22" width="220" height="10" fill="var(--primary, #6c8ebf)" opacity="0.5"/>
    <text x="110" y="22" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="monospace">TaskFilter</text>
    <text x="10" y="52" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">hiddenStatuses?: TaskStatus[]</text>
    <text x="10" y="68" fill="var(--text-muted, #888)" font-size="11" font-family="monospace" font-style="italic">search?: string</text>
    <text x="10" y="88" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">dashed = UI-only, not</text>
    <text x="10" y="102" fill="var(--text-muted, #888)" font-size="10" font-family="monospace" font-style="italic">persisted to storage</text>
  </g>

  <!-- Relationship arrows -->
  <!-- Task.status → TaskStatus (use/dependency) -->
  <line x1="580" y1="100" x2="630" y2="75" stroke="var(--accent, #d97706)" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#dmo-arrow)"/>
  <text x="600" y="85" fill="var(--text-muted, #888)" font-size="10" font-family="monospace">uses</text>

  <!-- Task.taskValue → TaskValue direct (composition) -->
  <line x1="300" y1="164" x2="250" y2="220" stroke="var(--warning, #f59e0b)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>

  <!-- Task.taskValue → TaskValue event (composition) -->
  <line x1="300" y1="164" x2="250" y2="360" stroke="var(--warning, #f59e0b)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>
  <text x="255" y="160" fill="var(--warning, #f59e0b)" font-size="10" font-family="monospace">taskValue</text>
  <text x="255" y="172" fill="var(--warning, #f59e0b)" font-size="10" font-family="monospace">(union)</text>

  <!-- TaskValue.direct.amount → Money -->
  <line x1="135" y1="266" x2="135" y2="420" stroke="var(--success, #22c55e)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>
  <text x="138" y="350" fill="var(--success, #22c55e)" font-size="10" font-family="monospace">amount</text>

  <!-- TaskValue.event.unitCost → Money -->
  <line x1="160" y1="412" x2="160" y2="420" stroke="var(--success, #22c55e)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>

  <!-- Task.remainingEstimate → Duration -->
  <line x1="300" y1="196" x2="240" y2="60" stroke="var(--success, #22c55e)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>
  <text x="242" y="140" fill="var(--success, #22c55e)" font-size="10" font-family="monospace">remainingEstimate</text>

  <!-- Task.targetDelivery → Duration -->
  <line x1="300" y1="180" x2="245" y2="75" stroke="var(--success, #22c55e)" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#dmo-arrow)"/>
  <text x="248" y="115" fill="var(--success, #22c55e)" font-size="10" font-family="monospace" font-style="italic">targetDelivery</text>
  <text x="248" y="127" fill="var(--success, #22c55e)" font-size="10" font-family="monospace" font-style="italic">(or ISO date string)</text>

  <!-- Task.parentId self-reference -->
  <path d="M 580 260 Q 870 260 870 200 Q 870 140 580 160" stroke="var(--primary, #6c8ebf)" stroke-width="1.5" fill="none" stroke-dasharray="5 3" marker-end="url(#dmo-arrow)"/>
  <text x="760" y="195" fill="var(--primary, #6c8ebf)" font-size="10" font-family="monospace">parentId?</text>
  <text x="760" y="207" fill="var(--primary, #6c8ebf)" font-size="10" font-family="monospace">(sub-task)</text>

  <!-- Legend -->
  <g transform="translate(630, 180)">
    <rect x="0" y="0" width="220" height="200" rx="6" fill="var(--bg-secondary, #2d2d2d)" stroke="var(--border, #444)" stroke-width="1"/>
    <text x="110" y="20" text-anchor="middle" fill="var(--text, #e0e0e0)" font-size="12" font-weight="bold" font-family="monospace">Legend</text>
    <!-- Primary class -->
    <rect x="10" y="32" width="18" height="12" rx="2" fill="var(--primary, #6c8ebf)" opacity="0.85"/>
    <text x="34" y="42" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Main entity</text>
    <!-- Enum -->
    <rect x="10" y="52" width="18" height="12" rx="2" fill="var(--accent, #d97706)" opacity="0.85"/>
    <text x="34" y="62" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Enum / type</text>
    <!-- Value object -->
    <rect x="10" y="72" width="18" height="12" rx="2" fill="var(--warning, #f59e0b)" opacity="0.75"/>
    <text x="34" y="82" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Discriminated union</text>
    <!-- Value type -->
    <rect x="10" y="92" width="18" height="12" rx="2" fill="var(--success, #22c55e)" opacity="0.75"/>
    <text x="34" y="102" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Value object</text>
    <!-- UI-only -->
    <rect x="10" y="112" width="18" height="12" rx="2" fill="var(--primary, #6c8ebf)" opacity="0.5" stroke-dasharray="3 2"/>
    <text x="34" y="122" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">UI-only (not stored)</text>
    <!-- Arrows -->
    <line x1="10" y1="138" x2="28" y2="138" stroke="var(--primary, #6c8ebf)" stroke-width="1.5" marker-end="url(#dmo-arrow)"/>
    <text x="34" y="142" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Composition / uses</text>
    <line x1="10" y1="158" x2="28" y2="158" stroke="var(--text-muted, #888)" stroke-width="1.5" stroke-dasharray="5 3" marker-end="url(#dmo-arrow)"/>
    <text x="34" y="162" fill="var(--text, #e0e0e0)" font-size="10" font-family="monospace">Optional reference</text>
    <!-- Schema version -->
    <text x="10" y="182" fill="var(--text-muted, #888)" font-size="10" font-family="monospace">Schema: v0.1.2</text>
    <text x="10" y="194" fill="var(--text-muted, #888)" font-size="10" font-family="monospace">italic = optional fields</text>
  </g>
</svg>`;
}
