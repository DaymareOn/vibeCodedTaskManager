/**
 * Concepts & Glossary overlay configuration.
 * Stored in localStorage under a per-user key, independent of task data.
 */

const STORAGE_KEY = 'user_concepts_config';

export const DEFAULT_CONCEPTS_KEY = 'F2';

/** Per-concept descriptor (stable id, display metadata, default text). */
export interface ConceptDef {
  id: string;
  title: string;
  emoji: string;
  defaultDescription: string;
}

/** Ordered list of concept cards shown in the overlay. */
export const CONCEPT_DEFS: ConceptDef[] = [
  {
    id: 'tools-column',
    title: 'Tools Column',
    emoji: '🔧',
    defaultDescription:
      'The collapsible left panel. Contains the search/filter bar, import/export controls, display settings (task height), currency selector, theme switcher, and overlay shortcut configuration.',
  },
  {
    id: 'timeline',
    title: 'Timeline',
    emoji: '📅',
    defaultDescription:
      'The central view. Tasks are shown as horizontal colored bars sorted top-to-bottom by priority score (highest first). Click an empty area to add a new task at that date.',
  },
  {
    id: 'timeline-ruler',
    title: 'Timeline Ruler',
    emoji: '📏',
    defaultDescription:
      'The date strip at the top of the Timeline. Major and minor tick marks adapt to the current zoom level. Today is highlighted in amber. Use Ctrl + scroll wheel to zoom horizontally.',
  },
  {
    id: 'history-scrubber',
    title: 'History Scrubber',
    emoji: '📜',
    defaultDescription:
      'The slider between the date ruler and the task area. Drag it left to replay the recorded task history. The task display updates to show what the timeline looked like after each saved change. Drag fully right (or press the right arrow key when the scrubber is focused) to return to the live view.',
  },
  {
    id: 'task-bars',
    title: 'Task Bars',
    emoji: '🟦',
    defaultDescription:
      'Colored horizontal bars representing root-level tasks. Bar width = task duration (start → target delivery). Bar color = status. Click a bar to open the task editor. Hover a bar to reveal its sub-tasks and a tooltip with priority details.',
  },
  {
    id: 'priority-score',
    title: 'Priority Score ⚡',
    emoji: '⚡',
    defaultDescription:
      'A computed importance metric. It combines the task monetary value (converted to your main currency), urgency (time remaining to target delivery), and remaining estimated effort. Higher = more important. If task A depends on task B and A has a higher score, B\'s score is automatically boosted to A + 1 so that blockers always rank above their dependants.',
  },
  {
    id: 'task-value',
    title: 'Task Value 💰',
    emoji: '💰',
    defaultDescription:
      'The monetary worth of completing the task. Can be a direct amount (e.g. EUR 500) or an expected-value estimate: probability × unit cost over a reference period. Displayed in your chosen main currency.',
  },
  {
    id: 'sub-tasks',
    title: 'Sub-tasks',
    emoji: '🔽',
    defaultDescription:
      'Child items of a parent task. They appear as smaller colored bars below the parent when you hover over it. Sub-tasks can be added from the task editor and share the parent context.',
  },
  {
    id: 'edit-column',
    title: 'Edit Column',
    emoji: '✏️',
    defaultDescription:
      'The collapsible right panel. Opens when you click a task bar. Lets you edit the title, description, status, dates, value, remaining estimate, and tags. Also provides buttons to delete the task or add a sub-task.',
  },
  {
    id: 'status-colors',
    title: 'Status Colors',
    emoji: '🎨',
    defaultDescription:
      'Task bars are color-coded by status: Blue = To Do, Amber = In Progress, Green = Done, Grey = Cancelled. Use the filter bar to show or hide tasks by status.',
  },
  {
    id: 'filter-bar',
    title: 'Filter Bar',
    emoji: '🔍',
    defaultDescription:
      'Located inside the Tools Column. Type to search tasks by title or description. Toggle the status buttons (To Do, In Progress, Done, Cancelled) to show or hide tasks with that status.',
  },
  {
    id: 'zoom',
    title: 'Zoom Controls',
    emoji: '🔎',
    defaultDescription:
      'Ctrl + scroll wheel zooms the timeline horizontally while keeping the time under the cursor fixed. Shift + scroll wheel adjusts the task bar height (vertical zoom). Plain scroll wheel scrolls vertically.',
  },
];

/** Build the default descriptions map from CONCEPT_DEFS. */
export const DEFAULT_CONCEPT_DESCS: Record<string, string> = CONCEPT_DEFS.reduce(
  (acc, c) => { acc[c.id] = c.defaultDescription; return acc; },
  {} as Record<string, string>,
);

/** Config envelope saved per user. */
export interface ConceptsConfig {
  /** Keyboard key that opens the overlay (e.g. "F2"). */
  conceptsKey: string;
  /** User-edited descriptions, keyed by concept id. */
  descriptions: Record<string, string>;
}

function load(): ConceptsConfig {
  if (typeof localStorage === 'undefined') {
    return { conceptsKey: DEFAULT_CONCEPTS_KEY, descriptions: { ...DEFAULT_CONCEPT_DESCS } };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConceptsConfig>;
      return {
        conceptsKey: parsed.conceptsKey ?? DEFAULT_CONCEPTS_KEY,
        descriptions: { ...DEFAULT_CONCEPT_DESCS, ...(parsed.descriptions ?? {}) },
      };
    }
  } catch {
    // ignore parse errors
  }
  return { conceptsKey: DEFAULT_CONCEPTS_KEY, descriptions: { ...DEFAULT_CONCEPT_DESCS } };
}

function save(config: ConceptsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota errors
  }
}

let _config: ConceptsConfig = load();

export const ConceptsConfigManager = {
  get(): ConceptsConfig {
    return _config;
  },

  setConceptsKey(key: string): void {
    _config = { ..._config, conceptsKey: key };
    save(_config);
  },

  setDescription(id: string, desc: string): void {
    _config = { ..._config, descriptions: { ..._config.descriptions, [id]: desc } };
    save(_config);
  },

  getDescription(id: string): string {
    return _config.descriptions[id] ?? DEFAULT_CONCEPT_DESCS[id] ?? '';
  },

  reload(): void {
    _config = load();
  },
};
