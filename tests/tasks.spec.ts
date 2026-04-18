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
    const parentTitle = page.locator('.task-rect .task-title', { hasText: 'File income tax return' });
    await parentTitle.first().hover();

    const subTask = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Declare child carer salary slips',
    });
    await expect(subTask).toBeVisible({ timeout: 3_000 });
  });

  test('hovering "Renew home insurance policy" reveals its sub-task', async ({ page }) => {
    const parentTitle = page.locator('.task-rect .task-title', { hasText: 'Renew home insurance policy' });
    await parentTitle.first().hover();

    const subTask = page.locator('.timeline-hover-layer .task-title', {
      hasText: 'Organise home contents inventory',
    });
    await expect(subTask).toBeVisible({ timeout: 3_000 });
  });

  test('hovering "Plan summer family holiday" reveals both sub-tasks', async ({ page }) => {
    const parentTitle = page.locator('.task-rect .task-title', { hasText: 'Plan summer family holiday' });
    await parentTitle.first().hover();

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
    const parentTitle = page.locator('.task-rect .task-title', { hasText: 'Plan summer family holiday' });
    await parentTitle.first().hover();

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
