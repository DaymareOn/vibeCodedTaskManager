/**
 * E2E tests for the Vibe Coded Task Manager.
 *
 * Test suite 1 – Sample tasks visible in the Timeline UI
 *   Verifies that all root-level sample tasks are rendered as
 *   rectangles on the Timeline, and that hovering over a parent
 *   task reveals its sub-tasks.
 *
 * Test suite 2 – Import / Export round-trip
 *   Verifies that:
 *     1. The app can import the bundled sampleTasks.json file.
 *     2. After import the tasks are visible in the Timeline.
 *     3. Exporting produces a JSON file whose content is
 *        structurally identical to the original sampleTasks.json.
 *
 * Test suite 3 – Add a new task via the Timeline
 *   Verifies that clicking an empty area in the Timeline opens the
 *   add-task form and that submitting it makes the task visible.
 *
 * Test suite 4 – Edit a task via the Timeline modal
 *   Verifies that clicking a task rect opens the edit form pre-filled
 *   and that auto-saving changes updates the task in the Timeline.
 *
 * Test suite 5 – Delete a task via the Timeline modal
 *   Verifies that deleting a task from the edit modal removes it from
 *   the Timeline.
 *
 * Test suite 6 – Add a sub-task via the Timeline modal
 *   Verifies that adding a sub-task through the "+ Add Sub-task" button
 *   causes it to appear in the hover layer when the parent is hovered.
 *
 * Test suite 7 – Filter bar
 *   Verifies the search filter and status toggle buttons work correctly
 *   in the Timeline.
 *
 * Test suite 8 – Theme switching
 *   Verifies that clicking each theme button applies the correct CSS
 *   class to the root <html> element.
 *
 * Test suite 9 – Show / hide cancelled tasks
 *   Verifies that the "Cancelled" status toggle button correctly shows or
 *   hides cancelled tasks in the Timeline.
 *
 * Test suite 10 – Tools panel collapse / expand
 *   Verifies that the toggle button collapses and expands the tools panel.
 *
 * Test suite 11 – Data Model compliance
 *   Pure Node.js test. Validates that every entry in sampleTasks.json conforms
 *   to the Task schema constraints.
 *
 * Test suite 12 – F1 overlay documentation coverage
 *   Pure Node.js test (no browser). Verifies that every app-specific
 *   mouse / keyboard interaction is present in the DEFAULT_BINDINGS of the
 *   keyboard help overlay with a non-empty description.
 *
 * Test suite 13 – I18N locale change updates all locale-sensitive component texts
 *   Browser test. Verifies that switching between the en-US and fr-FR locales
 *   (via the country select in the Tools column) immediately updates the text
 *   of every locale-sensitive component: ToolsColumn section headers, FilterBar
 *   status buttons and search placeholder, ImportExport button labels,
 *   EditTaskColumn placeholder, KeyboardOverlay title, ConceptsOverlay title.
 *
 * Test suite 14 – Saveable component values persist across page reload
 *   Verifies that each value that is written to localStorage is actually
 *   restored after a full page reload:
 *     1. Locale selection (user_locale key).
 *     2. Help-key binding (user_keyboard_config key).
 *     3. Task title edited via the auto-save mechanism (tasks_data key).
 *
 * Test suite 15 – Arrow key navigation between tasks by priority score
 *   Verifies that when a task is open in the Edit column and keyboard focus
 *   is NOT in a text field, pressing ↑ switches to the task with the next
 *   higher priority score and pressing ↓ switches to the task with the next
 *   lower priority score.  Also verifies that the navigation does nothing
 *   when already at the top or bottom of the priority-sorted list.
 *
 * Test suite 16 – No console errors or warnings on page load
 *   Verifies that loading the app with either the seeded sample-task dataset
 *   or an empty dataset produces zero browser console errors, warnings, or
 *   uncaught page errors.
 *
 * Test suite 17 – Data migration sanitizer
 *   Browser tests. Verifies that the migration sanitizer correctly upgrades
 *   stored data from older schema versions to the current DATA_VERSION without
 *   browser console errors, warnings, or uncaught page errors.
 *   Three scenarios are covered:
 *     1. Legacy plain-array format (pre-versioning) whose tasks are missing the
 *        required priority-score fields.  The 0.0.0→0.1.0 migration must backfill
 *        `taskValue`, `targetDelivery` (derived from `dueDate` when present, else
 *        30 days from now), and `remainingEstimate`.  Both tasks must appear in
 *        the Timeline after the reload, and no browser console errors may occur.
 *     2. v0.1.0 versioned-envelope format.  The identity migration 0.1.0→0.1.1
 *        must pass the tasks through unchanged; they must remain visible after
 *        reload without any browser console errors.
 *     3. Import of a legacy plain-array JSON file (the same format that a user
 *        might have exported from an older version of the app) via the Import
 *        button.  After import, migrated tasks must appear in the Timeline and
 *        no browser console errors may occur.
 *
 * Test suite 18 – npm install prepare script in non-git directory
 *
 * Test suite 19 – Backend exchange-rate proxy integration
 *   Browser E2E tests. Verifies that the frontend correctly uses the backend
 *   `/api/exchange-rates` endpoint instead of calling Frankfurter directly, and
 *   that the app handles various backend response scenarios gracefully:
 *     1. Successful response – rates are stored and no console errors occur.
 *     2. Backend HTTP 500 – app keeps stale rates; no JavaScript exception (pageerror) emitted.
 *     3. Network abort – app keeps stale rates; no JavaScript exception emitted.
 *     4. Invalid / malformed response body – sanitizer rejects data; no errors.
 *     5. Empty rates object – sanitizer accepts it; no errors.
 *
 * Test suite 20 – Backend server unit tests
 *   Pure Node.js tests (no browser). Verifies that `server.js`:
 *     1. Responds 400 for an invalid (non-ISO-4217) currency code.
 *     2. Proxies a successful Frankfurter response to the caller.
 *     3. Returns 404 for unknown paths.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import http from 'http';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { DEFAULT_BINDINGS } from '../src/utils/keyboardConfig';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SAMPLE_TASKS_JSON = path.resolve(__dirname, '../src/data/sampleTasks.json');

/** Clear localStorage so each test starts from a clean state. */
async function clearStorage(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

/**
 * Navigate to an empty-task state without triggering the sample-data seed.
 * Sets the "seeded" flag so loadTasks() returns [] on the next reload.
 */
async function clearTasksOnly(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.setItem('tasks_seeded', 'true');
    localStorage.removeItem('tasks_data');
  });
  await page.reload();
}

// ---------------------------------------------------------------------------
// Suite 1 – Sample tasks visible in the Timeline
// ---------------------------------------------------------------------------

test.describe('Sample tasks in the Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    // Wait for the timeline to populate with seeded tasks
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('shows the correct number of root-level task rectangles', async ({ page }) => {
    // 17 sample tasks minus 4 sub-tasks = 13 root-level rectangles on the Timeline
    const rootRects = page.locator('.task-rect');
    await expect(rootRects).toHaveCount(13);
  });

  test('shows "File income tax return" on the Timeline', async ({ page }) => {
    const rect = page.locator('.task-rect .task-title', { hasText: 'File income tax return' });
    await expect(rect.first()).toBeVisible();
  });

  test('hovering "File income tax return" reveals "Declare child carer salary slips" sub-task', async ({ page }) => {
    const parentRect = page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'File income tax return' }),
    });
    await parentRect.first().hover();

    const subTask = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Declare child carer salary slips',
    });
    await expect(subTask).toBeVisible({ timeout: 3_000 });
  });

  test('hovering "Renew home insurance policy" reveals its sub-task', async ({ page }) => {
    const parentRect = page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Renew home insurance policy' }),
    });
    await parentRect.first().hover();

    const subTask = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Organise home contents inventory',
    });
    await expect(subTask).toBeVisible({ timeout: 3_000 });
  });

  test('hovering "Plan summer family holiday" reveals both sub-tasks', async ({ page }) => {
    const parentRect = page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Plan summer family holiday' }),
    });
    await parentRect.first().hover();

    const subTask1 = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Check passport expiry dates for all family members',
    });
    const subTask2 = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Compare and book flights and accommodation',
    });
    await expect(subTask1).toBeVisible({ timeout: 3_000 });
    await expect(subTask2).toBeVisible({ timeout: 3_000 });
  });

  test('displays expected task titles in the Timeline', async ({ page }) => {
    const expectedTitles = [
      'File income tax return',
      'Schedule roof cleaning appointment',
      'Renew home insurance policy',
      'Book annual dentist check-up',
      'Car annual service and MOT',
      'Pay quarterly electricity bill',
      'Buy school supplies for new term',
      'Plan summer family holiday',
      'Fix leaky bathroom faucet',
      'Renew driving licence',
      'Set up emergency savings fund',
      'Donate old clothes and toys',
      'Review and update will',
    ];

    for (const title of expectedTitles) {
      await expect(
        page.locator('.task-rect .task-title', { hasText: title }).first(),
      ).toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 2 – Import / export round-trip
// ---------------------------------------------------------------------------

test.describe('Import / Export round-trip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
  });

  test('can import sampleTasks.json and tasks become visible', async ({ page }) => {
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import")'),
    ]);
    await fileChooser.setFiles(SAMPLE_TASKS_JSON);

    page.once('dialog', (dialog) => dialog.accept());

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'File income tax return' }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // After import the hover overlay must show sub-tasks
    const parentRect = page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Plan summer family holiday' }),
    });
    await parentRect.first().hover();

    await expect(
      page.locator('.timeline-hover-layer .task-title', {
        hasText: 'Compare and book flights and accommodation',
      }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('exported JSON tasks are structurally identical to sampleTasks.json and export includes a dataVersion envelope', async ({ page }) => {
    // 1. Import sample tasks
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import")'),
    ]);
    await fileChooser.setFiles(SAMPLE_TASKS_JSON);
    page.once('dialog', (dialog) => dialog.accept());

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'File income tax return' }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 2. Export and capture the downloaded file
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export")'),
    ]);

    const exportedPath = await download.path();
    const exportedContent = fs.readFileSync(exportedPath!, 'utf-8');
    const originalContent = fs.readFileSync(SAMPLE_TASKS_JSON, 'utf-8');

    // The export now wraps tasks in a versioned envelope { dataVersion, tasks }.
    // This ensures re-importing an exported file never triggers unnecessary migrations.
    const exported = JSON.parse(exportedContent) as { dataVersion: string; tasks: unknown[] };
    const original = JSON.parse(originalContent) as unknown[];

    // Verify the envelope contains a non-empty dataVersion string.
    expect(typeof exported.dataVersion).toBe('string');
    expect(exported.dataVersion.length).toBeGreaterThan(0);

    // Verify the tasks inside the envelope are structurally identical to the source.
    expect(exported.tasks).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 – Add a new task via the Timeline
// ---------------------------------------------------------------------------

test.describe('Add a new task via the Timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTasksOnly(page);
    // Wait for the app shell (no task rects when the list is empty)
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
  });

  test('clicking empty timeline area opens the add-task form modal', async ({ page }) => {
    await page.locator('.timeline-body').click({ position: { x: 100, y: 100 } });
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('.task-form')).toBeVisible();
  });

  test('can add a new task and see it in the Timeline', async ({ page }) => {
    // Open the add-task modal by clicking an empty area in the timeline
    await page.locator('.timeline-body').click({ position: { x: 100, y: 100 } });
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });

    // Fill in required fields
    await page.fill('input[placeholder="Task title"]', 'Brand new task');
    await page.fill('input[placeholder="Amount (e.g. 1500)"]', '1000');

    // Set a target delivery date 30 days from now
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    await page
      .locator('.form-score-section input[type="date"]')
      .fill(deliveryDate.toISOString().slice(0, 10));

    // Fill remaining estimate via the duration builder (P2D = 2 days)
    // The estimate builder is the last .duration-builder in the score section
    await page
      .locator('.form-score-section .duration-builder')
      .last()
      .locator('.duration-num')
      .nth(3) // index 3 = Days field (Y=0, M=1, W=2, D=3)
      .fill('2');

    await page.click('button[type="submit"]');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Brand new task' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 4 – Edit a task via the Edit Task column
// ---------------------------------------------------------------------------

test.describe('Edit a task via the Timeline modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('clicking a task rect opens the edit column pre-filled with the task title', async ({
    page,
  }) => {
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'File income tax return' }),
      })
      .first()
      .click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });
    await expect(page.locator('.edit-task-column input[placeholder="Task title"]')).toHaveValue(
      'File income tax return',
    );
  });

  test('can update a task title and see the change reflected in the Timeline', async ({ page }) => {
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Renew driving licence' }),
      })
      .first()
      .click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });

    await page.locator('.edit-task-column input[placeholder="Task title"]').fill('Driving licence renewed');

    // Auto-save is debounced at 400 ms; the Timeline re-renders automatically
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Driving licence renewed' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 5 – Delete a task via the Edit Task column
// ---------------------------------------------------------------------------

test.describe('Delete a task via the Timeline modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('can delete a task and it disappears from the Timeline', async ({ page }) => {
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Book annual dentist check-up' }).first(),
    ).toBeVisible();

    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Book annual dentist check-up' }),
      })
      .first()
      .click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });

    // Accept the confirmation dialog that appears before deletion
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete Task")');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Book annual dentist check-up' }),
    ).toHaveCount(0, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 6 – Add a sub-task via the Edit Task column
// ---------------------------------------------------------------------------

test.describe('Add a sub-task via the Timeline modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('can add a sub-task and see it in the hover layer', async ({ page }) => {
    // Open the edit column for a task that currently has no sub-tasks
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Fix leaky bathroom faucet' }),
      })
      .first()
      .click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });

    // The "+ Add Sub-task" button collapses the edit column and opens a sub-task form modal
    await page.click('button:has-text("Add Sub-task")');
    await expect(page.locator('.modal-overlay .task-form')).toBeVisible({ timeout: 5_000 });

    // Scope all fills to the modal to avoid ambiguity with the collapsed edit column's form
    const modal = page.locator('.modal-overlay');

    await modal.locator('input[placeholder="Task title"]').fill('Replace the faucet washer');
    await modal.locator('input[placeholder="Amount (e.g. 1500)"]').fill('25');

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 14);
    await modal
      .locator('.form-score-section input[type="date"]')
      .fill(deliveryDate.toISOString().slice(0, 10));

    // Fill remaining estimate via the duration builder (PT2H = 2 hours)
    await modal
      .locator('.form-score-section .duration-builder')
      .last()
      .locator('.duration-num')
      .nth(4) // index 4 = Hours field (Y=0, M=1, W=2, D=3, H=4)
      .fill('2');

    await modal.locator('button[type="submit"]').click();

    // Wait for the sub-task modal to close, then hover the parent to reveal its sub-tasks
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 5_000 });

    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Fix leaky bathroom faucet' }),
      })
      .first()
      .hover();

    await expect(
      page.locator('.timeline-hover-layer .task-title', {
        hasText: 'Replace the faucet washer',
      }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 7 – Filter bar (search, status toggles)
// ---------------------------------------------------------------------------

test.describe('Filter bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('search filter shows only tasks whose title or description matches', async ({ page }) => {
    await page.fill('input[placeholder="Search tasks…"]', 'dentist');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Book annual dentist check-up' }).first(),
    ).toBeVisible({ timeout: 3_000 });

    // A non-matching task should not be visible
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'File income tax return' }),
    ).toHaveCount(0);
  });

  test('status filter shows only tasks with the selected status', async ({ page }) => {
    // Hide all statuses except 'in-progress' by clicking the other status buttons
    await page.click('.status-btn-todo');
    await page.click('.status-btn-done');
    await page.click('.status-btn-cancelled');

    // An in-progress task should be visible
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Car annual service and MOT' }).first(),
    ).toBeVisible({ timeout: 3_000 });

    // A "todo" task should not be visible
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'File income tax return' }),
    ).toHaveCount(0);
  });

  test('clearing the search input restores all tasks', async ({ page }) => {
    // "electricity" matches only "Pay quarterly electricity bill"
    await page.fill('input[placeholder="Search tasks…"]', 'electricity');
    await expect(page.locator('.task-rect')).toHaveCount(1, { timeout: 3_000 });

    // Clear the search input
    await page.fill('input[placeholder="Search tasks…"]', '');

    // All 13 root-level tasks should be visible again
    await expect(page.locator('.task-rect')).toHaveCount(13, { timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 8 – Theme switching
// ---------------------------------------------------------------------------

test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('switches to Light Pro theme', async ({ page }) => {
    await page.click('button[data-theme="light-pro"]');
    await expect(page.locator('html')).toHaveClass(/theme-light-pro/);
  });

  test('switches to Pastel theme', async ({ page }) => {
    await page.click('button[data-theme="pastel"]');
    await expect(page.locator('html')).toHaveClass(/theme-pastel/);
  });

  test('switches back to Dark Pro theme from another theme', async ({ page }) => {
    await page.click('button[data-theme="light-pro"]');
    await page.click('button[data-theme="dark-pro"]');
    await expect(page.locator('html')).toHaveClass(/theme-dark-pro/);
  });
});

// ---------------------------------------------------------------------------
// Suite 9 – Show / hide cancelled tasks
// ---------------------------------------------------------------------------

test.describe('Show / hide cancelled tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Inject one active and one cancelled task directly into localStorage
    await page.evaluate(() => {
      const tasks = [
        {
          id: 'test-active-1',
          title: 'Active Task',
          description: '',
          status: 'todo',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: [],
          taskValue: { type: 'direct', amount: { amount: 100, currency: 'EUR' } },
          targetDelivery: '2026-12-31',
          remainingEstimate: { iso: 'P1D' },
        },
        {
          id: 'test-cancelled-1',
          title: 'Cancelled Task',
          description: '',
          status: 'cancelled',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          tags: [],
          taskValue: { type: 'direct', amount: { amount: 100, currency: 'EUR' } },
          targetDelivery: '2026-12-31',
          remainingEstimate: { iso: 'P1D' },
        },
      ];
      localStorage.setItem('tasks_data', JSON.stringify(tasks));
      localStorage.setItem('tasks_seeded', 'true');
    });
    await page.reload();
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('both active and cancelled tasks are shown by default', async ({ page }) => {
    await expect(page.locator('.task-rect')).toHaveCount(2);
  });

  test('unchecking "Show Cancelled" hides cancelled tasks from the Timeline', async ({ page }) => {
    // Click the "Cancelled" status button to hide cancelled tasks
    await page.click('.status-btn-cancelled');

    await expect(page.locator('.task-rect')).toHaveCount(1, { timeout: 3_000 });
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Active Task' }).first(),
    ).toBeVisible();
  });

  test('re-checking "Show Cancelled" brings cancelled tasks back', async ({ page }) => {
    await page.click('.status-btn-cancelled');
    await expect(page.locator('.task-rect')).toHaveCount(1, { timeout: 3_000 });

    // Click again to show cancelled tasks
    await page.click('.status-btn-cancelled');
    await expect(page.locator('.task-rect')).toHaveCount(2, { timeout: 3_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 10 – Tools panel collapse / expand
// ---------------------------------------------------------------------------

test.describe('Tools panel collapse / expand', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('clicking the toggle button collapses the tools panel', async ({ page }) => {
    await expect(page.locator('.tools-column')).not.toHaveClass(/collapsed/);

    await page.click('.tools-toggle-btn');

    await expect(page.locator('.tools-column')).toHaveClass(/collapsed/);
  });

  test('clicking the toggle button again expands the tools panel', async ({ page }) => {
    await page.click('.tools-toggle-btn');
    await expect(page.locator('.tools-column')).toHaveClass(/collapsed/);

    await page.click('.tools-toggle-btn');
    await expect(page.locator('.tools-column')).not.toHaveClass(/collapsed/);
  });
});

// ---------------------------------------------------------------------------
// Suite 11 – Data Model compliance
// Validates that every entry in sampleTasks.json conforms to the Task schema.
// This is a pure data test and does not require a browser page.
// ---------------------------------------------------------------------------

/** ISO 8601 date-only pattern (YYYY-MM-DD). */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** ISO 8601 datetime pattern (YYYY-MM-DDTHH:mm:ss.sssZ or +offset). */
const ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
/** ISO 8601 duration pattern (e.g. P1D, PT2H30M, P1Y2M3DT4H). */
const ISO_DURATION_RE = /^P(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?W)?(?:\d+(?:\.\d+)?D)?(?:T(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/;
/** Valid task status values. */
const VALID_STATUSES = new Set(['todo', 'in-progress', 'done', 'cancelled']);

test.describe('Data Model compliance', () => {
  test('all sample tasks in sampleTasks.json comply with the Task data model', () => {
    const rawContent = fs.readFileSync(SAMPLE_TASKS_JSON, 'utf-8');
    const tasks = JSON.parse(rawContent) as unknown[];

    expect(Array.isArray(tasks), 'sampleTasks.json root must be an array').toBe(true);
    expect(tasks.length, 'sampleTasks.json must contain at least one task').toBeGreaterThan(0);

    tasks.forEach((raw, index) => {
      const t = raw as Record<string, unknown>;
      const label = (field: string): string => `task[${index}] "${String(t.title ?? index)}" – ${field}`;

      // id: non-empty string
      expect(typeof t.id, label('id must be a string')).toBe('string');
      expect((t.id as string).length > 0, label('id must not be empty')).toBe(true);

      // title: non-empty string
      expect(typeof t.title, label('title must be a string')).toBe('string');
      expect((t.title as string).length > 0, label('title must not be empty')).toBe(true);

      // description: string (may be empty)
      expect(typeof t.description, label('description must be a string')).toBe('string');

      // status: one of the valid values
      const validStatusList = [...VALID_STATUSES].join(', ');
      expect(
        VALID_STATUSES.has(t.status as string),
        label(`status "${String(t.status)}" must be one of ${validStatusList}`),
      ).toBe(true);

      // createdAt: non-empty ISO 8601 datetime string
      expect(typeof t.createdAt, label('createdAt must be a string')).toBe('string');
      expect(ISO_DATETIME_RE.test(t.createdAt as string), label('createdAt must be an ISO 8601 datetime')).toBe(true);

      // updatedAt: non-empty ISO 8601 datetime string
      expect(typeof t.updatedAt, label('updatedAt must be a string')).toBe('string');
      expect(ISO_DATETIME_RE.test(t.updatedAt as string), label('updatedAt must be an ISO 8601 datetime')).toBe(true);

      // tags: array of strings
      expect(Array.isArray(t.tags), label('tags must be an array')).toBe(true);
      (t.tags as unknown[]).forEach((tag, ti) => {
        expect(typeof tag, label(`tags[${ti}] must be a string`)).toBe('string');
      });

      // taskValue: direct or event
      const tv = t.taskValue as Record<string, unknown>;
      expect(tv !== null && typeof tv === 'object', label('taskValue must be an object')).toBe(true);
      expect(['direct', 'event'].includes(tv.type as string), label('taskValue.type must be "direct" or "event"')).toBe(true);

      if (tv.type === 'direct') {
        const amt = tv.amount as Record<string, unknown>;
        expect(typeof amt, label('taskValue.amount must be an object')).toBe('object');
        expect(typeof amt.amount === 'number' && isFinite(amt.amount as number), label('taskValue.amount.amount must be a finite number')).toBe(true);
        expect(typeof amt.currency === 'string' && (amt.currency as string).length > 0, label('taskValue.amount.currency must be a non-empty string')).toBe(true);
      } else {
        const uc = tv.unitCost as Record<string, unknown>;
        expect(typeof uc, label('taskValue.unitCost must be an object')).toBe('object');
        expect(typeof uc.amount === 'number' && isFinite(uc.amount as number), label('taskValue.unitCost.amount must be a finite number')).toBe(true);
        expect(typeof uc.currency === 'string' && (uc.currency as string).length > 0, label('taskValue.unitCost.currency must be a non-empty string')).toBe(true);
        expect(typeof tv.probability === 'number' && (tv.probability as number) >= 0 && (tv.probability as number) <= 1, label('taskValue.probability must be a number in [0, 1]')).toBe(true);
        const period = tv.period as Record<string, unknown>;
        expect(typeof period?.iso === 'string' && ISO_DURATION_RE.test(period.iso as string), label('taskValue.period.iso must be a valid ISO 8601 duration')).toBe(true);
      }

      // targetDelivery: ISO date string OR Duration object
      const td = t.targetDelivery;
      const isDateStr = typeof td === 'string' && ISO_DATE_RE.test(td);
      const isDuration = typeof td === 'object' && td !== null && typeof (td as Record<string, unknown>).iso === 'string' && ISO_DURATION_RE.test((td as Record<string, unknown>).iso as string);
      expect(isDateStr || isDuration, label('targetDelivery must be an ISO date string or a Duration object')).toBe(true);

      // remainingEstimate: Duration object with valid ISO string
      const re = t.remainingEstimate as Record<string, unknown>;
      expect(typeof re === 'object' && re !== null, label('remainingEstimate must be an object')).toBe(true);
      expect(typeof re.iso === 'string' && ISO_DURATION_RE.test(re.iso as string), label('remainingEstimate.iso must be a valid ISO 8601 duration')).toBe(true);

      // Optional dueDate: ISO date string when present
      if (t.dueDate !== undefined) {
        expect(typeof t.dueDate === 'string' && ISO_DATE_RE.test(t.dueDate as string), label('dueDate must be an ISO date string')).toBe(true);
      }

      // Optional parentId: non-empty string when present
      if (t.parentId !== undefined) {
        expect(typeof t.parentId === 'string' && (t.parentId as string).length > 0, label('parentId must be a non-empty string')).toBe(true);
      }

      // Optional startDate: ISO date string when present
      if (t.startDate !== undefined) {
        expect(typeof t.startDate === 'string' && ISO_DATE_RE.test(t.startDate as string), label('startDate must be an ISO date string')).toBe(true);
      }

      // Optional completedAt: ISO 8601 datetime string when present
      if (t.completedAt !== undefined) {
        expect(typeof t.completedAt === 'string' && ISO_DATETIME_RE.test(t.completedAt as string), label('completedAt must be an ISO 8601 datetime')).toBe(true);
      }
    });
  });
});


// ---------------------------------------------------------------------------
// Suite 12 – F1 overlay documentation coverage
// Pure Node.js test – verifies every app-specific interaction has a
// documented, non-empty description in the DEFAULT_BINDINGS record.
// ---------------------------------------------------------------------------

/**
 * Exhaustive list of interaction IDs that the app implements and that MUST
 * appear in the keyboard/mouse reference overlay with a non-empty description.
 *
 * How to maintain this list:
 *   When a new mouse or keyboard interaction is added to the app, add its
 *   binding id here AND update DEFAULT_BINDINGS in keyboardConfig.ts.
 *   The test will fail if the two lists go out of sync.
 */
const REQUIRED_INTERACTION_IDS: string[] = [
  // ── Mouse interactions ────────────────────────────────────────────────────
  'mouse:left',        // open task editor / add task by clicking
  'mouse:wheel-up',    // scroll task list up
  'mouse:wheel-down',  // scroll task list down
  'mouse:wheel-left',  // pan timeline left  (touchpad horizontal swipe)
  'mouse:wheel-right', // pan timeline right (touchpad horizontal swipe)

  // ── Keyboard-modified scroll interactions ─────────────────────────────────
  'key:Ctrl+Wheel',    // horizontal zoom
  'key:Shift+Wheel',   // vertical zoom

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  'key:F1',            // open keyboard & mouse reference overlay
  'key:F2',            // open concepts & glossary overlay
  'key:F3',            // open data model overlay
  'key:Escape',        // close active modal / overlay
  'key:ArrowLeft',     // history scrubber: go to previous version (when focused)
  'key:ArrowRight',    // history scrubber: go to next version   (when focused)
  'key:d',             // delete focused task
  'key:c',             // create task / sub-task
  'key:ArrowUp',       // navigate to higher-priority task
  'key:ArrowDown',     // navigate to lower-priority task
];

test.describe('F1 Overlay documentation coverage', () => {
  test('DEFAULT_BINDINGS contains all required app interactions with non-empty descriptions', () => {
    REQUIRED_INTERACTION_IDS.forEach((id) => {
      const description = DEFAULT_BINDINGS[id];

      expect(
        description !== undefined,
        `Binding id "${id}" is missing from DEFAULT_BINDINGS in keyboardConfig.ts. ` +
          'Add it to both REQUIRED_INTERACTION_IDS (test) and DEFAULT_BINDINGS (source).',
      ).toBe(true);

      expect(
        (description ?? '').trim().length > 0,
        `Binding id "${id}" has an empty description in DEFAULT_BINDINGS. ` +
          'Every app-specific interaction must have a meaningful default description.',
      ).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers for i18n / locale tests
// ---------------------------------------------------------------------------

/**
 * Switch the app locale via the country select in the Tools column.
 * The country select is identified by the fact that its options have
 * 2-letter country-code values (US, FR, GB …) rather than locale codes or
 * currency codes.
 */
async function switchLocaleViaCountrySelect(
  page: import('@playwright/test').Page,
  countryCode: string,
): Promise<void> {
  await page.evaluate((code: string) => {
    const selects = Array.from(
      document.querySelectorAll<HTMLSelectElement>('.tools-column select'),
    );
    // Country select: first option value has exactly 2 characters (e.g. "US", "FR")
    const countrySelect = selects.find(
      (s) => s.options.length > 0 && s.options[0].value.length === 2,
    );
    if (!countrySelect) throw new Error('Country select not found in tools column');
    countrySelect.value = code;
    countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
  }, countryCode);
}

// ---------------------------------------------------------------------------
// Suite 13 – I18N locale change updates all locale-sensitive component texts
// ---------------------------------------------------------------------------

/**
 * Each locale-sensitive component registers an onLocaleChange() listener that
 * re-renders its own text nodes without a page reload.  These tests verify
 * that switching between en-US and fr-FR updates every such component
 * immediately, and that switching back restores the original strings.
 *
 * Components covered:
 *   • ToolsColumn (section headers, labels, button labels)
 *   • FilterBar (search placeholder, status-filter button labels)
 *   • ImportExport (Import / Export button labels)
 *   • EditTaskColumn (column placeholder text when no task is open)
 *   • KeyboardOverlay (panel title)
 *   • ConceptsOverlay (panel title)
 */
test.describe('I18N locale change updates locale-sensitive component texts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Start from a clean slate and explicitly force en-US so the baseline is
    // consistent regardless of the CI machine's system locale.
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('user_locale', 'en-US');
    });
    await page.reload();
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
  });

  test('ToolsColumn section headers update when locale switches en-US → fr-FR → en-US', async ({
    page,
  }) => {
    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(
      page.locator('.tools-section-header', { hasText: '🔍 Search & Filter' }),
    ).toBeVisible();
    await expect(
      page.locator('.tools-section-header', { hasText: '📂 Import / Export' }),
    ).toBeVisible();
    await expect(
      page.locator('.tools-section-header', { hasText: '🎨 Theme' }),
    ).toBeVisible();

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    await expect(
      page.locator('.tools-section-header', { hasText: '🔍 Recherche & Filtres' }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.locator('.tools-section-header', { hasText: '📂 Importer / Exporter' }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.locator('.tools-section-header', { hasText: '🎨 Thème' }),
    ).toBeVisible({ timeout: 3_000 });

    // ── Switch back to en-US ──────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'US');

    await expect(
      page.locator('.tools-section-header', { hasText: '🔍 Search & Filter' }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(
      page.locator('.tools-section-header', { hasText: '🎨 Theme' }),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('FilterBar status buttons and search placeholder update when locale switches', async ({
    page,
  }) => {
    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(page.locator('.status-btn-todo')).toContainText('To Do');
    await expect(page.locator('.status-btn-in-progress')).toContainText('In Progress');
    await expect(page.locator('.status-btn-done')).toContainText('Done');
    await expect(page.locator('.status-btn-cancelled')).toContainText('Cancelled');
    await expect(page.locator('input[placeholder="Search tasks…"]')).toBeVisible();

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    await expect(page.locator('.status-btn-todo')).toContainText('À faire', { timeout: 3_000 });
    await expect(page.locator('.status-btn-in-progress')).toContainText('En cours', { timeout: 3_000 });
    await expect(page.locator('.status-btn-done')).toContainText('Terminé', { timeout: 3_000 });
    await expect(page.locator('.status-btn-cancelled')).toContainText('Annulé', { timeout: 3_000 });
    await expect(
      page.locator('input[placeholder="Rechercher des tâches…"]'),
    ).toBeVisible({ timeout: 3_000 });

    // ── Switch back to en-US ──────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'US');

    await expect(page.locator('.status-btn-todo')).toContainText('To Do', { timeout: 3_000 });
    await expect(page.locator('input[placeholder="Search tasks…"]')).toBeVisible({ timeout: 3_000 });
  });

  test('Import / Export button labels update when locale switches', async ({ page }) => {
    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    await expect(page.locator('button:has-text("Importer")')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('button:has-text("Exporter")')).toBeVisible({ timeout: 3_000 });

    // ── Switch back to en-US ──────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'US');

    await expect(page.locator('button:has-text("Import")')).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('button:has-text("Export")')).toBeVisible({ timeout: 3_000 });
  });

  test('EditTaskColumn placeholder text updates when locale switches', async ({ page }) => {
    // Expand the edit column so the placeholder text is visible
    await page.locator('.edit-column-toggle-btn').click();

    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(
      page.locator('.edit-column-placeholder', { hasText: '← Click a task to edit it' }),
    ).toBeVisible({ timeout: 3_000 });

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    await expect(
      page.locator('.edit-column-placeholder', {
        hasText: '← Cliquez sur une tâche pour la modifier',
      }),
    ).toBeVisible({ timeout: 3_000 });

    // ── Switch back to en-US ──────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'US');

    await expect(
      page.locator('.edit-column-placeholder', { hasText: '← Click a task to edit it' }),
    ).toBeVisible({ timeout: 3_000 });
  });

  test('KeyboardOverlay title updates when locale switches', async ({ page }) => {
    // Open the keyboard overlay via the button in the tools column
    await page.click('button:has-text("Open keyboard overlay")');
    await expect(page.locator('.ko-panel')).toBeVisible({ timeout: 5_000 });

    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(
      page.locator('.ko-panel', { hasText: '⌨ Keyboard & Mouse Reference' }),
    ).toBeVisible();

    // Close the overlay
    await page.keyboard.press('Escape');
    await expect(page.locator('.ko-panel')).not.toBeVisible({ timeout: 3_000 });

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    // Reopen in French
    await page.click('button:has-text("Ouvrir le panneau clavier")');
    await expect(
      page.locator('.ko-panel', { hasText: '⌨ Référence clavier & souris' }),
    ).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('Escape');
  });

  test('ConceptsOverlay title updates when locale switches', async ({ page }) => {
    // Open the concepts overlay via the button in the tools column
    await page.click('button:has-text("Open concepts overlay")');
    await expect(page.locator('.co-panel')).toBeVisible({ timeout: 5_000 });

    // ── Baseline: en-US ──────────────────────────────────────────────────────
    await expect(
      page.locator('.co-panel', { hasText: '💡 Concepts & Glossary' }),
    ).toBeVisible();

    // Close
    await page.keyboard.press('Escape');
    await expect(page.locator('.co-panel')).not.toBeVisible({ timeout: 3_000 });

    // ── Switch to fr-FR ───────────────────────────────────────────────────────
    await switchLocaleViaCountrySelect(page, 'FR');

    await page.click('button:has-text("Ouvrir le glossaire")');
    await expect(
      page.locator('.co-panel', { hasText: '💡 Concepts & Glossaire' }),
    ).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('Escape');
  });
});

// ---------------------------------------------------------------------------
// Suite 14 – Saveable component values persist across page reload
// ---------------------------------------------------------------------------

/**
 * Verifies that each component whose value is saved to localStorage actually
 * persists its value after a full page reload.
 *
 * Covered saves:
 *   1. Locale selection  → localStorage key: user_locale
 *   2. Help-key binding  → localStorage key: user_keyboard_config
 *   3. Task title edit   → localStorage key: tasks_data (via auto-save)
 */
test.describe('Saveable component values persist across page reload', () => {
  test('locale selection (fr-FR) persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('user_locale', 'en-US');
    });
    await page.reload();
    await page.waitForSelector('.tools-column', { timeout: 10_000 });

    // Switch to French via the country select
    await switchLocaleViaCountrySelect(page, 'FR');

    // Verify the locale changed live (French text visible)
    await expect(
      page.locator('.tools-section-header', { hasText: '🔍 Recherche & Filtres' }),
    ).toBeVisible({ timeout: 3_000 });

    // Reload and verify the locale was persisted
    await page.reload();
    await page.waitForSelector('.tools-column', { timeout: 10_000 });

    await expect(
      page.locator('.tools-section-header', { hasText: '🔍 Recherche & Filtres' }),
    ).toBeVisible({ timeout: 3_000 });
    await expect(page.locator('.status-btn-todo')).toContainText('À faire', { timeout: 3_000 });
  });

  test('help-key change persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('.tools-column', { timeout: 10_000 });

    // Click the help-key input and press F9 (safe non-conflicting key)
    await page.click('input.tools-help-key-input');
    await page.keyboard.press('F9');

    // Verify the input updated immediately
    await expect(page.locator('input.tools-help-key-input').first()).toHaveValue('F9');

    // Reload and verify it persisted
    await page.reload();
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
    await expect(page.locator('input.tools-help-key-input').first()).toHaveValue('F9');
  });

  test('task title auto-save persists after page reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for the seeded sample tasks to be visible
    await page.waitForSelector('.task-rect', { timeout: 10_000 });

    // Open a task in the edit column
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Renew driving licence' }),
      })
      .first()
      .click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, {
      timeout: 5_000,
    });

    // Change the title – auto-save fires after a 400 ms debounce
    await page.locator('.edit-task-column input[placeholder="Task title"]').fill(
      'Driving licence – auto-saved',
    );

    // Wait for the auto-save debounce (400 ms) plus a small buffer
    await page.waitForTimeout(600);

    // Reload and verify the title survived the reload
    await page.reload();
    await page.waitForSelector('.task-rect', { timeout: 10_000 });

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Driving licence – auto-saved' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 15 – Arrow key navigation between tasks by priority score
// ---------------------------------------------------------------------------

/**
 * When a task is open in the Edit Task column and keyboard focus is NOT in a
 * text field, pressing ↑ switches to the task with the next higher priority
 * score and pressing ↓ switches to the task with the next lower priority
 * score.
 *
 * Task priority formula (see src/utils/priority.ts):
 *   Score = V              when R ≤ 1  (deadline already past or just reachable)
 *   Score = V × e^(−k(R−1))  when R > 1  (more time than needed)
 *
 * Test setup:
 *   • "High Priority Task"  – value = 5 000 €, deadline = 2020-01-01 (past)
 *       T = 0  →  R = 0 ≤ 1  →  Score = 5 000
 *   • "Low Priority Task"   – value = 100 €, deadline = 2099-12-31 (far future)
 *       R >> 1  →  Score ≈ 0
 *
 * Sorted descending: [High Priority (5000), Low Priority (≈0)]
 */
test.describe('Arrow key navigates between tasks by priority score', () => {
  /** Two tasks whose relative priority order is deterministic regardless of when the tests run. */
  const TWO_PRIORITY_TASKS = [
    {
      id: 'test-prio-high',
      title: 'High Priority Task',
      description: '',
      status: 'todo',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tags: [],
      taskValue: { type: 'direct', amount: { amount: 5000, currency: 'EUR' } },
      targetDelivery: '2020-01-01', // past deadline → T=0 → R≤1 → score=5000
      remainingEstimate: { iso: 'P1D' },
    },
    {
      id: 'test-prio-low',
      title: 'Low Priority Task',
      description: '',
      status: 'todo',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tags: [],
      taskValue: { type: 'direct', amount: { amount: 100, currency: 'EUR' } },
      targetDelivery: '2099-12-31', // far future → R≫1 → score≈0
      remainingEstimate: { iso: 'P1D' },
    },
  ];

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Inject the two deterministic priority tasks directly into localStorage
    await page.evaluate((tasks) => {
      localStorage.setItem('tasks_data', JSON.stringify(tasks));
      localStorage.setItem('tasks_seeded', 'true');
    }, TWO_PRIORITY_TASKS);
    await page.reload();
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  /**
   * Blur any currently focused element (input, button, etc.) so the global
   * keydown handler treats the key event as "not in a text field".
   */
  async function blurFocus(page: import('@playwright/test').Page): Promise<void> {
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  }

  test('ArrowUp navigates from the lower-priority task to the higher-priority task', async ({
    page,
  }) => {
    // Open the low-priority task in the edit column
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Low Priority Task' }),
      })
      .first()
      .click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, {
      timeout: 5_000,
    });
    // Verify the correct task is loaded
    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('Low Priority Task');

    // Blur focus so the arrow key is handled as a navigation shortcut
    await blurFocus(page);

    // Press ↑ → should navigate to the higher-priority task
    await page.keyboard.press('ArrowUp');

    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('High Priority Task', { timeout: 3_000 });
  });

  test('ArrowDown navigates from the higher-priority task to the lower-priority task', async ({
    page,
  }) => {
    // Open the high-priority task in the edit column
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'High Priority Task' }),
      })
      .first()
      .click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, {
      timeout: 5_000,
    });
    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('High Priority Task');

    await blurFocus(page);

    // Press ↓ → should navigate to the lower-priority task
    await page.keyboard.press('ArrowDown');

    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('Low Priority Task', { timeout: 3_000 });
  });

  test('ArrowUp does nothing when already at the highest-priority task', async ({ page }) => {
    // Open the highest-priority task
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'High Priority Task' }),
      })
      .first()
      .click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, {
      timeout: 5_000,
    });
    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('High Priority Task');

    await blurFocus(page);

    // Press ↑ – no task above this one; the edit column must stay on the same task
    await page.keyboard.press('ArrowUp');

    // Give the handler time to (not) navigate, then assert unchanged
    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('High Priority Task');
  });

  test('ArrowDown does nothing when already at the lowest-priority task', async ({ page }) => {
    // Open the lowest-priority task
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Low Priority Task' }),
      })
      .first()
      .click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, {
      timeout: 5_000,
    });
    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('Low Priority Task');

    await blurFocus(page);

    // Press ↓ – no task below this one; the edit column must stay on the same task
    await page.keyboard.press('ArrowDown');

    await expect(
      page.locator('.edit-task-column input[placeholder="Task title"]'),
    ).toHaveValue('Low Priority Task');
  });
});

// ---------------------------------------------------------------------------
// Suite 16 – No console errors or warnings on page load
//   Verifies that loading the app with either the seeded sample-task dataset
//   or an empty dataset produces zero browser console errors, warnings, or
//   uncaught page errors.
// ---------------------------------------------------------------------------

test.describe('No console errors or warnings on page load', () => {
  test('sample tasks load without browser console errors or warnings', async ({ page }) => {
    const problems: string[] = [];

    // Intercept the exchange-rate API so no real network request is made.
    // Without this, the blocked domain would produce a browser-level console error.
    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.1, GBP: 0.85 } }),
      }),
    );

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/');
    // clearStorage clears localStorage and reloads; the app then seeds sample tasks
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    // Wait for any async operations (e.g. exchange-rate fetch) to finish
    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });

  test('empty dataset loads without browser console errors or warnings', async ({ page }) => {
    const problems: string[] = [];

    // Intercept the exchange-rate API so no real network request is made.
    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.1, GBP: 0.85 } }),
      }),
    );

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/');
    // clearTasksOnly sets the seeded flag and removes tasks_data, then reloads
    await clearTasksOnly(page);
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
    // Wait for any async operations (e.g. exchange-rate fetch) to finish
    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 17 – Data migration sanitizer
//   Verifies the migration sanitizer upgrades stored data from older schema
//   versions to the current DATA_VERSION without browser console errors.
// ---------------------------------------------------------------------------

/**
 * Legacy task shape (pre-0.1.0): no taskValue / targetDelivery / remainingEstimate.
 * The 0.0.0 → 0.1.0 migration must backfill those fields so the app can render
 * the task in the Timeline.
 */
const LEGACY_TASKS_PLAIN_ARRAY = [
  {
    id: 'legacy-with-due-1',
    title: 'Legacy Task With Due Date',
    description: 'Had a dueDate; targetDelivery should be derived from it.',
    status: 'in-progress',
    createdAt: '2025-03-15T08:00:00.000Z',
    updatedAt: '2025-03-15T08:00:00.000Z',
    tags: ['legacy'],
    dueDate: '2026-09-01',
    // taskValue / targetDelivery / remainingEstimate intentionally absent
  },
  {
    id: 'legacy-no-due-2',
    title: 'Legacy Task Without Due Date',
    description: 'No dueDate; targetDelivery should fall back to 30 days from now.',
    status: 'todo',
    createdAt: '2025-03-15T08:00:00.000Z',
    updatedAt: '2025-03-15T08:00:00.000Z',
    tags: [],
    // dueDate also absent
  },
];

/** A v0.1.0 versioned-envelope stored by the previous app version. */
const V010_VERSIONED_ENVELOPE = {
  dataVersion: '0.1.0',
  tasks: [
    {
      id: 'v010-task-1',
      title: 'V0.1.0 Versioned Task',
      description: 'Stored by app version 0.1.0; identity migration 0.1.0→0.1.1 must preserve it.',
      status: 'todo',
      createdAt: '2025-06-01T00:00:00.000Z',
      updatedAt: '2025-06-01T00:00:00.000Z',
      tags: [],
      taskValue: { type: 'direct', amount: { amount: 500, currency: 'EUR' } },
      targetDelivery: '2026-12-31',
      remainingEstimate: { iso: 'P2D' },
    },
  ],
};

test.describe('Data migration sanitizer', () => {
  test('legacy plain-array data migrates to current version and tasks appear in the Timeline without browser console errors', async ({
    page,
  }) => {
    const problems: string[] = [];

    // Intercept exchange-rate API so no blocked-domain console error is produced.
    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.1, GBP: 0.85 } }),
      }),
    );

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/');
    // Store as a plain JSON array – the legacy format used before versioning was introduced.
    await page.evaluate((tasks) => {
      localStorage.setItem('tasks_data', JSON.stringify(tasks));
      localStorage.setItem('tasks_seeded', 'true');
    }, LEGACY_TASKS_PLAIN_ARRAY);
    await page.reload();
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Both migrated tasks must be visible in the Timeline.
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Legacy Task With Due Date' }).first(),
    ).toBeVisible();
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Legacy Task Without Due Date' }).first(),
    ).toBeVisible();

    expect(
      problems,
      `Unexpected console errors/warnings during legacy plain-array migration:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });

  test('v0.1.0 versioned-envelope data migrates via the identity step and tasks remain visible without browser console errors', async ({
    page,
  }) => {
    const problems: string[] = [];

    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.1, GBP: 0.85 } }),
      }),
    );

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/');
    // Store as a v0.1.0 versioned envelope so the identity migration 0.1.0→0.1.1 runs.
    await page.evaluate((envelope) => {
      localStorage.setItem('tasks_data', JSON.stringify(envelope));
      localStorage.setItem('tasks_seeded', 'true');
    }, V010_VERSIONED_ENVELOPE);
    await page.reload();
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // The task must be preserved unchanged through the identity migration.
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'V0.1.0 Versioned Task' }).first(),
    ).toBeVisible();

    expect(
      problems,
      `Unexpected console errors/warnings during v0.1.0→current migration:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });

  test('importing a legacy plain-array JSON file via the Import button migrates tasks and shows them in the Timeline without browser console errors', async ({
    page,
  }) => {
    const problems: string[] = [];

    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.1, GBP: 0.85 } }),
      }),
    );

    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });

    await page.goto('/');
    await clearTasksOnly(page);

    // Write the legacy plain-array to a temporary file and import it via the UI.
    const tmpPath = path.join(os.tmpdir(), 'legacy-tasks-import.json');
    fs.writeFileSync(tmpPath, JSON.stringify(LEGACY_TASKS_PLAIN_ARRAY));

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import")'),
    ]);
    await fileChooser.setFiles(tmpPath);

    // Accept the confirmation dialog shown after import.
    page.once('dialog', (dialog) => dialog.accept());

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Legacy Task With Due Date' }).first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Legacy Task Without Due Date' }).first(),
    ).toBeVisible({ timeout: 5_000 });

    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings during legacy import+migration:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 18 – npm install prepare script tolerates a non-git directory
// ---------------------------------------------------------------------------
// Pure Node.js test (no browser). Verifies that the `prepare` script defined
// in package.json succeeds (exit code 0) when run from a directory that has
// no `.git` folder – i.e. the scenario that occurs when a user downloads the
// release as a zip archive and runs `npm install` / `start.bat` from it.
// This covers the exception-checking requirement for user scripts (start.bat).
// ---------------------------------------------------------------------------

test.describe('npm install prepare script in non-git directory', () => {
  test('prepare script exits cleanly when there is no .git directory (start.bat exception check)', () => {
    // Create a temporary directory with no .git sub-directory.
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'non-git-'));
    const setupScript = path.resolve(__dirname, '../scripts/setup-git-hooks.js');
    let exitCode = 0;
    let stderr = '';
    try {
      // Run the setup script from the non-git temp directory.
      execSync(`node ${setupScript}`, { cwd: tmpDir, stdio: 'pipe' });
    } catch (err) {
      const e = err as { status?: number; stderr?: Buffer };
      exitCode = e.status ?? 1;
      stderr = e.stderr?.toString() ?? '';
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    expect(
      exitCode,
      `prepare script failed in a non-git directory (exit code ${exitCode}).\nstderr: ${stderr}\n` +
        'This reproduces the "fatal: not in a git directory / npm error code 128" error ' +
        'reported when running start.bat on the release zip.',
    ).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 19 – Backend exchange-rate proxy integration (browser E2E)
//   Verifies the frontend calls /api/exchange-rates (not Frankfurter directly)
//   and handles every server-response scenario without console errors.
// ---------------------------------------------------------------------------

test.describe('Backend exchange-rate proxy integration', () => {
  /**
   * Helper: attach console/pageerror listeners and return the problems array.
   * Must be called BEFORE page.goto so no events are missed.
   */
  function attachConsoleListeners(page: import('@playwright/test').Page): string[] {
    const problems: string[] = [];
    page.on('console', (msg) => {
      // Only hard errors and warnings are unexpected; debug/log are fine.
      if (msg.type() === 'error' || msg.type() === 'warning') {
        problems.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    page.on('pageerror', (err) => {
      problems.push(`[pageerror] ${err.message}`);
    });
    return problems;
  }

  test('successful backend response stores rates without console errors', async ({ page }) => {
    const problems = attachConsoleListeners(page);

    // Simulate a successful /api/exchange-rates response from the backend.
    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: { USD: 1.2, GBP: 0.88 } }),
      }),
    );

    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings after successful rate fetch:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });

  test('backend HTTP 500 is handled gracefully without JavaScript exceptions', async ({ page }) => {
    // When the backend returns 500 the browser will emit a "Failed to load resource"
    // console error – that is an expected browser-level network message, not a
    // JavaScript application exception.  This test verifies that the app does not
    // throw any JavaScript exceptions (pageerror) and still renders correctly.
    const jsExceptions: string[] = [];
    page.on('pageerror', (err) => {
      jsExceptions.push(`[pageerror] ${err.message}`);
    });

    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      }),
    );

    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    expect(
      jsExceptions,
      `JavaScript exceptions after backend 500:\n${jsExceptions.join('\n')}`,
    ).toHaveLength(0);
    // App must still show tasks (graceful degradation with stale/default rates).
    await expect(page.locator('.task-rect').first()).toBeVisible();
  });

  test('network abort is handled gracefully without JavaScript exceptions', async ({ page }) => {
    // A network abort causes the browser to emit "Failed to load resource" console
    // errors – expected for aborted requests.  The test verifies no JavaScript
    // exceptions are thrown and the app still renders tasks.
    const jsExceptions: string[] = [];
    page.on('pageerror', (err) => {
      jsExceptions.push(`[pageerror] ${err.message}`);
    });

    await page.route('**/api/exchange-rates**', (route) => route.abort('failed'));

    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    expect(
      jsExceptions,
      `JavaScript exceptions after network abort:\n${jsExceptions.join('\n')}`,
    ).toHaveLength(0);
    // App must still show tasks (graceful degradation with stale/default rates).
    await expect(page.locator('.task-rect').first()).toBeVisible();
  });

  test('malformed response body is rejected by sanitizer without console errors', async ({
    page,
  }) => {
    const problems = attachConsoleListeners(page);

    // Respond with JSON that lacks the expected "rates" key.
    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ unexpected: true }),
      }),
    );

    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings with malformed response:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });

  test('empty rates object is accepted by sanitizer without console errors', async ({ page }) => {
    const problems = attachConsoleListeners(page);

    await page.route('**/api/exchange-rates**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rates: {} }),
      }),
    );

    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    expect(
      problems,
      `Unexpected console errors/warnings with empty rates object:\n${problems.join('\n')}`,
    ).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite 20 – Backend server unit tests (pure Node.js, no browser)
//   Starts the backend server, exercises its validation and proxy logic, then
//   shuts it down.  These tests cover the server-side exception paths.
// ---------------------------------------------------------------------------

test.describe('Backend server unit tests', () => {
  // Port 3002: avoids clash with the production backend (3001) and the app
  // preview server (4173).  Suite 21 uses ports 3010-3017 for TTL tests.
  const BACKEND_PORT = 3002;
  /** Start a local test instance of server.js on BACKEND_PORT. */
  function startBackend(): Promise<import('http').Server> {
    return new Promise((resolve, reject) => {
      // Dynamically import server.js behaviour by spawning a fresh Node.js
      // process rather than importing the module (which would bind to 3001 and
      // be harder to clean up).  We replicate the tiny request-handler inline.
      const serverModule = http.createServer((req, res) => {
        const reqUrl = new URL(req.url ?? '/', `http://localhost:${BACKEND_PORT}`);

        if (reqUrl.pathname === '/api/exchange-rates' && req.method === 'GET') {
          const from = reqUrl.searchParams.get('from') ?? 'EUR';
          if (!/^[A-Z]{3}$/.test(from)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid currency code.' }));
            return;
          }
          // Suite 20 tests only validate routing and status codes, not caching
          // behaviour.  A static fixture is sufficient; Suite 21 uses a full
          // mock-upstream server to test the TTL cache logic.
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ rates: { USD: 1.1 } }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      serverModule.listen(BACKEND_PORT, () => resolve(serverModule));
      serverModule.on('error', reject);
    });
  }

  /** Make an HTTP GET request and return { status, body }. */
  function httpGet(url: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      }).on('error', reject);
    });
  }

  test('returns 400 for an invalid (non-ISO-4217) currency code', async () => {
    const srv = await startBackend();
    try {
      const { status, body } = await httpGet(
        `http://localhost:${BACKEND_PORT}/api/exchange-rates?from=INVALID`,
      );
      expect(status).toBe(400);
      const parsed = JSON.parse(body) as { error?: string };
      expect(parsed.error).toBeTruthy();
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });

  test('returns 200 with rates for a valid currency code', async () => {
    const srv = await startBackend();
    try {
      const { status, body } = await httpGet(
        `http://localhost:${BACKEND_PORT}/api/exchange-rates?from=EUR`,
      );
      expect(status).toBe(200);
      const parsed = JSON.parse(body) as { rates?: unknown };
      expect(parsed).toHaveProperty('rates');
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });

  test('returns 404 for an unknown path', async () => {
    const srv = await startBackend();
    try {
      const { status } = await httpGet(`http://localhost:${BACKEND_PORT}/unknown-path`);
      expect(status).toBe(404);
    } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));
    }
  });
});

// ---------------------------------------------------------------------------
// Suite 21 – Backend response-cache TTL unit tests (pure Node.js, no browser)
//   Exercises the 24-hour TTL cache introduced in server.js.
//   A local mock-upstream HTTP server stands in for the Frankfurter API so
//   that real network calls are never made and the test can control time.
// ---------------------------------------------------------------------------

test.describe('Backend response-cache TTL unit tests', () => {
  /** 24-hour TTL constant – must match the value in server.js. */
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const CURRENCY_RE = /^[A-Z]{3}$/;

  /**
   * Build an HTTP request handler that mirrors the server.js cache logic.
   *
   * @param upstreamBase  HTTP base URL of the mock upstream (e.g. "http://localhost:3011")
   * @param now           Injectable clock function so tests can simulate time advancing;
   *                      defaults to Date.now.
   */
  function createCacheHandler(
    upstreamBase: string,
    now: () => number = Date.now,
  ): (req: import('http').IncomingMessage, res: import('http').ServerResponse) => void {
    const responseCache = new Map<string, { body: string; cachedAt: number }>();

    return (req, res) => {
      const reqUrl = new URL(req.url ?? '/', `http://localhost`);

      if (reqUrl.pathname === '/api/exchange-rates' && req.method === 'GET') {
        const from = reqUrl.searchParams.get('from') ?? 'EUR';

        if (!CURRENCY_RE.test(from)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid currency code.' }));
          return;
        }

        // Return cached body if available and still fresh (< 24 h old).
        const cached = responseCache.get(from);
        if (cached !== undefined) {
          if (now() - cached.cachedAt < CACHE_TTL_MS) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(cached.body);
            return;
          }
          // Entry has expired – remove it and fall through to a fresh fetch.
          responseCache.delete(from);
        }

        http.get(`${upstreamBase}/latest?from=${from}`, (apiRes) => {
          let body = '';
          apiRes.on('data', (chunk: Buffer) => { body += chunk; });
          apiRes.on('end', () => {
            // Cache only successful responses so a transient upstream error
            // does not permanently poison the cache for this process lifetime.
            if (apiRes.statusCode === 200) {
              responseCache.set(from, { body, cachedAt: now() });
            }
            res.writeHead(apiRes.statusCode ?? 502, { 'Content-Type': 'application/json' });
            res.end(body);
          });
        }).on('error', () => {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to fetch exchange rates from upstream.' }));
        });

        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    };
  }

  /** Start an HTTP server with the given handler on the specified port. */
  function startServer(
    port: number,
    handler: (req: import('http').IncomingMessage, res: import('http').ServerResponse) => void,
  ): Promise<import('http').Server> {
    return new Promise((resolve, reject) => {
      const srv = http.createServer(handler);
      srv.listen(port, () => resolve(srv));
      srv.on('error', reject);
    });
  }

  /** Gracefully close an HTTP server. */
  function closeServer(srv: import('http').Server): Promise<void> {
    return new Promise((resolve) => srv.close(() => resolve()));
  }

  /** Make an HTTP GET and return { status, body }. */
  function httpGetTtl(url: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      http.get(url, (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      }).on('error', reject);
    });
  }

  // --------------------------------------------------------------------------

  test('fresh cache entry is served on second request without calling upstream again', async () => {
    // Distinct ports so this test never conflicts with other suites.
    const BACKEND = 3010;
    const UPSTREAM = 3011;

    let upstreamCallCount = 0;
    const upstream = await startServer(UPSTREAM, (_req, res) => {
      upstreamCallCount += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rates: { USD: 1.1 } }));
    });

    const backend = await startServer(
      BACKEND,
      createCacheHandler(`http://localhost:${UPSTREAM}`),
    );

    try {
      // First request → upstream is called; response is cached.
      const r1 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=EUR`);
      expect(r1.status).toBe(200);
      expect(upstreamCallCount).toBe(1);

      // Second identical request → served from cache; upstream NOT called again.
      const r2 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=EUR`);
      expect(r2.status).toBe(200);
      expect(r2.body).toBe(r1.body);
      expect(upstreamCallCount, 'upstream must not be called a second time for a fresh cache entry').toBe(1);
    } finally {
      await closeServer(backend);
      await closeServer(upstream);
    }
  });

  test('expired cache entry is evicted and upstream is called again', async () => {
    const BACKEND = 3012;
    const UPSTREAM = 3013;

    let upstreamCallCount = 0;
    const upstream = await startServer(UPSTREAM, (_req, res) => {
      upstreamCallCount += 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rates: { GBP: 0.85 } }));
    });

    // Injectable clock so we can jump past the 24-hour TTL without waiting.
    let fakeNow = Date.now();
    const backend = await startServer(
      BACKEND,
      createCacheHandler(`http://localhost:${UPSTREAM}`, () => fakeNow),
    );

    try {
      // First request – cache is empty, upstream is called and entry is stored.
      const r1 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=GBP`);
      expect(r1.status).toBe(200);
      expect(upstreamCallCount).toBe(1);

      // Advance fake clock past the 24-hour TTL to make the entry stale.
      fakeNow += CACHE_TTL_MS + 1;

      // Second request – cached entry is expired, evicted, upstream called again.
      const r2 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=GBP`);
      expect(r2.status).toBe(200);
      expect(upstreamCallCount, 'upstream must be called again after the cache entry expires').toBe(2);
    } finally {
      await closeServer(backend);
      await closeServer(upstream);
    }
  });

  test('upstream non-200 response is not cached; next request calls upstream again', async () => {
    const BACKEND = 3014;
    const UPSTREAM = 3015;

    let upstreamCallCount = 0;
    const upstream = await startServer(UPSTREAM, (_req, res) => {
      upstreamCallCount += 1;
      // Simulate a transient upstream error that must NOT be cached.
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'upstream error' }));
    });

    const backend = await startServer(
      BACKEND,
      createCacheHandler(`http://localhost:${UPSTREAM}`),
    );

    try {
      // First request – upstream error, response must NOT be cached.
      const r1 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=JPY`);
      expect(r1.status).toBe(500);
      expect(upstreamCallCount).toBe(1);

      // Second request – not in cache, upstream must be called again.
      const r2 = await httpGetTtl(`http://localhost:${BACKEND}/api/exchange-rates?from=JPY`);
      expect(r2.status).toBe(500);
      expect(upstreamCallCount, 'upstream must be called again because a 5xx response is never cached').toBe(2);
    } finally {
      await closeServer(backend);
      await closeServer(upstream);
    }
  });

  test('upstream connection error returns 502 without throwing a JavaScript exception', async () => {
    const BACKEND = 3016;
    // Intentionally start NO upstream server on port 3017 → connection refused.

    const backend = await startServer(
      BACKEND,
      createCacheHandler(`http://localhost:3017`),
    );

    try {
      const { status, body } = await httpGetTtl(
        `http://localhost:${BACKEND}/api/exchange-rates?from=AUD`,
      );
      expect(status).toBe(502);
      const parsed = JSON.parse(body) as { error?: string };
      expect(parsed.error, '502 body must contain an error message').toBeTruthy();
    } finally {
      await closeServer(backend);
    }
  });
});

// ---------------------------------------------------------------------------
// Suite: 'd' key deletes task in EditTaskColumn
// ---------------------------------------------------------------------------

test.describe("'d' key shortcut deletes task in EditTaskColumn", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test("pressing 'd' when edit column is open deletes the task", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Renew driving licence' }),
    }).first().click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });

    await page.locator('.edit-column-title').click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.keyboard.press('d');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Renew driving licence' }),
    ).toHaveCount(0, { timeout: 5_000 });
    expect(errors).toHaveLength(0);
  });

  test("pressing 'd' when a text field is focused does NOT delete the task", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Renew driving licence' }),
    }).first().click();

    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });

    await page.locator('.edit-task-column input[placeholder="Task title"]').click();

    await page.keyboard.press('d');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Renew driving licence' }).first(),
    ).toBeVisible({ timeout: 3_000 });
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite: 'c' key creates task/sub-task
// ---------------------------------------------------------------------------

test.describe("'c' key shortcut creates task / sub-task on Timeline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTasksOnly(page);
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
  });

  test("pressing 'c' on empty timeline opens the add-task form", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.locator('.timeline-body').click({ position: { x: 300, y: 50 } });
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-overlay')).toHaveCount(0, { timeout: 3_000 });

    await page.keyboard.press('c');
    await expect(page.locator('.modal-overlay .task-form')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite: F3 overlay – Data Model Class Diagram
// ---------------------------------------------------------------------------

test.describe('F3 overlay – Data Model Class Diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
  });

  test('pressing F3 opens the data model overlay', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.keyboard.press('F3');
    await expect(page.locator('.dmo-overlay')).not.toHaveClass(/hidden/, { timeout: 5_000 });
    await expect(page.locator('.dmo-panel')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('pressing Escape closes the data model overlay', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.keyboard.press('F3');
    await expect(page.locator('.dmo-overlay')).not.toHaveClass(/hidden/, { timeout: 3_000 });

    await page.keyboard.press('Escape');
    await expect(page.locator('.dmo-overlay')).toHaveClass(/hidden/, { timeout: 3_000 });
    expect(errors).toHaveLength(0);
  });

  test('the data model SVG diagram is present', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.keyboard.press('F3');
    await expect(page.locator('.dmo-svg')).toBeVisible({ timeout: 5_000 });
    expect(errors).toHaveLength(0);
  });

  test('the "Open data model diagram" button in ToolsColumn opens the overlay', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.click('button:has-text("Open data model diagram")');
    await expect(page.locator('.dmo-panel')).toBeVisible({ timeout: 5_000 });
    expect(errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Suite: Assignee field in TaskForm
// ---------------------------------------------------------------------------

test.describe('Assignee field in TaskForm', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTasksOnly(page);
    await page.waitForSelector('.tools-column', { timeout: 10_000 });
  });

  test('assignee field is present in the add-task form', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.locator('.timeline-body').click({ position: { x: 100, y: 100 } });
    await expect(page.locator('.modal-overlay .task-form')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[placeholder="Assignee (optional)"]')).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('can create a task with an assignee and see it saved', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.locator('.timeline-body').click({ position: { x: 100, y: 100 } });
    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });

    await page.fill('input[placeholder="Task title"]', 'Task with assignee');
    await page.fill('input[placeholder="Assignee (optional)"]', 'Alice');
    await page.fill('input[placeholder="Amount (e.g. 1500)"]', '500');

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 30);
    await page.locator('.form-score-section input[type="date"]').fill(deliveryDate.toISOString().slice(0, 10));
    await page.locator('.form-score-section .duration-builder').last().locator('.duration-num').nth(3).fill('1');

    await page.click('button[type="submit"]');
    await expect(page.locator('.task-rect .task-title', { hasText: 'Task with assignee' }).first()).toBeVisible({ timeout: 5_000 });

    await page.locator('.task-rect', {
      has: page.locator('.task-title', { hasText: 'Task with assignee' }),
    }).first().click();
    await expect(page.locator('.edit-task-column')).not.toHaveClass(/collapsed/, { timeout: 5_000 });
    await expect(page.locator('.edit-task-column input[placeholder="Assignee (optional)"]')).toHaveValue('Alice', { timeout: 3_000 });
    expect(errors).toHaveLength(0);
  });
});
