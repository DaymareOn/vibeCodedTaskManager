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
 *   and that saving changes updates the task in the Timeline.
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
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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
      page.click('button:has-text("Import tasks")'),
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

  test('exported JSON is structurally identical to sampleTasks.json', async ({ page }) => {
    // 1. Import sample tasks
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import tasks")'),
    ]);
    await fileChooser.setFiles(SAMPLE_TASKS_JSON);
    page.once('dialog', (dialog) => dialog.accept());

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'File income tax return' }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // 2. Export and capture the downloaded file
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export tasks")'),
    ]);

    const exportedPath = await download.path();
    const exportedContent = fs.readFileSync(exportedPath!, 'utf-8');
    const originalContent = fs.readFileSync(SAMPLE_TASKS_JSON, 'utf-8');

    const exported = JSON.parse(exportedContent) as unknown;
    const original = JSON.parse(originalContent) as unknown;

    expect(exported).toEqual(original);
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
// Suite 4 – Edit a task via the Timeline modal
// ---------------------------------------------------------------------------

test.describe('Edit a task via the Timeline modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('clicking a task rect opens the edit modal pre-filled with the task title', async ({
    page,
  }) => {
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'File income tax return' }),
      })
      .first()
      .click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('input[placeholder="Task title"]')).toHaveValue(
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

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });

    await page.locator('input[placeholder="Task title"]').fill('Driving licence renewed');
    await page.click('button[type="submit"]');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Driving licence renewed' }).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 5 – Delete a task via the Timeline modal
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

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });

    // Accept the confirmation dialog that appears before deletion
    page.once('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete Task")');

    await expect(
      page.locator('.task-rect .task-title', { hasText: 'Book annual dentist check-up' }),
    ).toHaveCount(0, { timeout: 5_000 });
  });
});

// ---------------------------------------------------------------------------
// Suite 6 – Add a sub-task via the Timeline modal
// ---------------------------------------------------------------------------

test.describe('Add a sub-task via the Timeline modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearStorage(page);
    await page.waitForSelector('.task-rect', { timeout: 10_000 });
  });

  test('can add a sub-task and see it in the hover layer', async ({ page }) => {
    // Open the edit modal for a task that currently has no sub-tasks
    await page
      .locator('.task-rect', {
        has: page.locator('.task-title', { hasText: 'Fix leaky bathroom faucet' }),
      })
      .first()
      .click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 5_000 });

    // The "+ Add Sub-task" button closes the current modal and opens a sub-task form
    await page.click('button:has-text("Add Sub-task")');
    await expect(page.locator('.task-form')).toBeVisible({ timeout: 5_000 });

    // Fill in the sub-task details
    await page.fill('input[placeholder="Task title"]', 'Replace the faucet washer');
    await page.fill('input[placeholder="Amount (e.g. 1500)"]', '25');

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 14);
    await page
      .locator('.form-score-section input[type="date"]')
      .fill(deliveryDate.toISOString().slice(0, 10));

    // Fill remaining estimate via the duration builder (PT2H = 2 hours)
    await page
      .locator('.form-score-section .duration-builder')
      .last()
      .locator('.duration-num')
      .nth(4) // index 4 = Hours field (Y=0, M=1, W=2, D=3, H=4)
      .fill('2');

    await page.click('button[type="submit"]');

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
    await page.fill('input[placeholder="🔍 Search tasks…"]', 'dentist');

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
    await page.fill('input[placeholder="🔍 Search tasks…"]', 'electricity');
    await expect(page.locator('.task-rect')).toHaveCount(1, { timeout: 3_000 });

    // Clear the search input
    await page.fill('input[placeholder="🔍 Search tasks…"]', '');

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

