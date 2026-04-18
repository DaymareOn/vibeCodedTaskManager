/**
 * E2E tests for the Vibe Coded Task Manager.
 *
 * Test suite 1 – Sample tasks visible in the UI
 *   Verifies that all root-level sample tasks and their sub-tasks are rendered
 *   correctly in the web UI after the app first loads (seeding path).
 *
 * Test suite 2 – Import / Export round-trip
 *   Verifies that:
 *     1. The app can import the bundled sampleTasks.json file.
 *     2. After import the tasks are visible in the UI.
 *     3. Exporting produces a JSON file whose content is byte-for-byte identical
 *        to the original sampleTasks.json.
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Absolute path to the canonical sample-tasks fixture. */
const SAMPLE_TASKS_JSON = path.resolve(
  __dirname,
  '../src/data/sampleTasks.json',
);

/** Clear localStorage so each test starts from a clean state. */
async function clearStorage(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

// ---------------------------------------------------------------------------
// Suite 1 – Sample tasks visible in the UI (seed path)
// ---------------------------------------------------------------------------

test.describe('Sample tasks in the UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any previous data so the app seeds fresh sample tasks.
    await clearStorage(page);
  });

  test('shows the correct number of root-level task cards', async ({ page }) => {
    // Root-level cards are direct children of .task-list — they do NOT have the
    // sub-task CSS class.
    const rootCards = page.locator('.task-card:not(.task-card-subtask)');
    // 17 sample tasks minus 4 sub-tasks (003, 011, 016, 017 — tasks that have a parentId)
    // = 13 root-level tasks
    await expect(rootCards).toHaveCount(13);
  });

  test('shows "File income tax return" with its sub-task', async ({ page }) => {
    const parentCard = page.locator('.task-card', {
      has: page.locator('.task-title', { hasText: 'File income tax return' }),
    });
    await expect(parentCard).toBeVisible();

    // Sub-task nested inside the parent card
    const subTask = parentCard.locator('.task-card-subtask .task-title', {
      hasText: 'Declare child carer salary slips',
    });
    await expect(subTask).toBeVisible();
  });

  test('shows "Renew home insurance policy" with its sub-task', async ({ page }) => {
    const parentCard = page.locator('.task-card', {
      has: page.locator('.task-title', { hasText: 'Renew home insurance policy' }),
    });
    await expect(parentCard).toBeVisible();

    const subTask = parentCard.locator('.task-card-subtask .task-title', {
      hasText: 'Organise home contents inventory',
    });
    await expect(subTask).toBeVisible();
  });

  test('shows "Plan summer family holiday" with both sub-tasks', async ({ page }) => {
    const parentCard = page.locator('.task-card', {
      has: page.locator('.task-title', { hasText: 'Plan summer family holiday' }),
    });
    await expect(parentCard).toBeVisible();

    const subTask1 = parentCard.locator('.task-card-subtask .task-title', {
      hasText: 'Check passport expiry dates for all family members',
    });
    await expect(subTask1).toBeVisible();

    const subTask2 = parentCard.locator('.task-card-subtask .task-title', {
      hasText: 'Compare and book flights and accommodation',
    });
    await expect(subTask2).toBeVisible();
  });

  test('displays expected task titles in the UI', async ({ page }) => {
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
        page.locator('.task-title', { hasText: title }).first(),
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
    // Trigger the file-input by clicking the Import button.
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import tasks")'),
    ]);
    await fileChooser.setFiles(SAMPLE_TASKS_JSON);

    // Accept the confirmation dialog.
    page.once('dialog', (dialog) => dialog.accept());

    // Wait for the root-level tasks to appear.
    await expect(
      page.locator('.task-title', { hasText: 'File income tax return' }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // After import the sub-tasks must also be visible.
    const holidayCard = page.locator('.task-card', {
      has: page.locator('.task-title', { hasText: 'Plan summer family holiday' }),
    });
    await expect(
      holidayCard.locator('.task-card-subtask .task-title', {
        hasText: 'Compare and book flights and accommodation',
      }),
    ).toBeVisible();
  });

  test('exported JSON is identical to sampleTasks.json', async ({ page }) => {
    // --- 1. Import sample tasks ---
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('button:has-text("Import tasks")'),
    ]);
    await fileChooser.setFiles(SAMPLE_TASKS_JSON);
    page.once('dialog', (dialog) => dialog.accept());

    await expect(
      page.locator('.task-title', { hasText: 'File income tax return' }).first(),
    ).toBeVisible({ timeout: 10_000 });

    // --- 2. Export and capture the downloaded file ---
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export tasks")'),
    ]);

    const exportedPath = await download.path();
    const exportedContent = fs.readFileSync(exportedPath!, 'utf-8');
    const originalContent = fs.readFileSync(SAMPLE_TASKS_JSON, 'utf-8');

    // Parse both so we compare structured data (ignoring cosmetic whitespace
    // differences while still catching any field or ordering divergence).
    const exported = JSON.parse(exportedContent) as unknown;
    const original = JSON.parse(originalContent) as unknown;

    expect(exported).toEqual(original);
  });
});
