import type { Task } from '../types/Task';
import taskSchema from '../schemas/task.schema.json';

/**
 * Current data model version – derived automatically from the `$id` field of
 * `task.schema.json` (e.g. "task-schema-v0.1.0" → "0.1.0").
 * The pre-commit hook (.githooks/pre-commit) bumps the patch component of
 * `$id` automatically on every commit that touches the schema file.
 * Add a new Migration entry below for any breaking schema change.
 */
// Extracts "0.1.0" from a $id like "task-schema-v0.1.0".
const versionMatch = taskSchema.$id.match(/^task-schema-v(\d+\.\d+\.\d+)$/);
if (!versionMatch) {
  throw new Error(
    `task.schema.json $id has unexpected format: "${taskSchema.$id}". ` +
    'Expected "task-schema-v<semver>", e.g. "task-schema-v0.1.0".',
  );
}
export const DATA_VERSION: string = versionMatch[1];

/** Signature for a single version-step migration. */
interface Migration {
  fromVersion: string;
  toVersion: string;
  /** Receives the raw task array and returns a transformed copy. */
  up: (tasks: unknown[]) => unknown[];
}

/**
 * Migrations list – one entry per DATA_VERSION bump.
 * The first entry brings unversioned (pre-0.1.0) data up to v0.1.0 by
 * backfilling the priority-score fields (`taskValue`, `targetDelivery`,
 * `remainingEstimate`) that were absent in the original schema.
 */

/** Default deadline offset (ms) applied when a legacy task has no dueDate. */
const DEFAULT_DEADLINE_OFFSET_MS = 30 * 86_400_000; // 30 days

const MIGRATIONS: Migration[] = [
  {
    fromVersion: '0.0.0',
    toVersion: '0.1.0',
    up: (tasks) =>
      tasks.map((t) => {
        const task = t as Record<string, unknown>;
        // Derive a best-effort targetDelivery from the legacy dueDate field.
        const fallbackDelivery =
          typeof task.dueDate === 'string' && task.dueDate
            ? task.dueDate
            : new Date(Date.now() + DEFAULT_DEADLINE_OFFSET_MS).toISOString().slice(0, 10);
        return {
          taskValue: { type: 'direct', amount: { amount: 0, currency: 'EUR' } },
          targetDelivery: fallbackDelivery,
          remainingEstimate: { iso: 'PT1H' },
          ...task,
        };
      }),
  },
  {
    fromVersion: '0.1.0',
    toVersion: '0.1.1',
    // No structural data changes – $id was bumped automatically by the
    // pre-commit hook when the schema file was touched.  This entry exists
    // solely to keep the migration chain contiguous up to DATA_VERSION.
    up: (tasks) => tasks,
  },
  // Future migrations go here, e.g.:
  //   {
  //     fromVersion: '0.1.0',
  //     toVersion:   '0.2.0',
  //     up: (tasks) => tasks.map((t) => ({ newField: 'default', ...(t as object) })),
  //   },
];

/** Numeric semver comparison (returns negative / 0 / positive). */
function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [aMaj = 0, aMin = 0, aPat = 0] = parse(a);
  const [bMaj = 0, bMin = 0, bPat = 0] = parse(b);
  if (aMaj !== bMaj) return aMaj - bMaj;
  if (aMin !== bMin) return aMin - bMin;
  return aPat - bPat;
}

/**
 * Run all migrations needed to bring `tasks` from `fromVersion` up to
 * `DATA_VERSION`.  Migrations are applied in order; if a gap exists (no
 * migration registered for a step) processing stops early and the
 * partially-migrated array is returned.
 *
 * Returns the array cast to `Task[]`; callers should treat these as
 * potentially partially-typed until a full schema validation is run.
 */
export function migrate(tasks: unknown[], fromVersion: string): Task[] {
  if (fromVersion === DATA_VERSION) return tasks as Task[];

  let current = [...tasks];
  let version = fromVersion;

  // Collect only the migrations that bridge the gap from `fromVersion` to DATA_VERSION.
  const applicable = MIGRATIONS.filter(
    (m) =>
      compareVersions(m.fromVersion, fromVersion) >= 0 &&
      compareVersions(m.fromVersion, DATA_VERSION) < 0,
  ).sort((a, b) => compareVersions(a.fromVersion, b.fromVersion));

  for (const m of applicable) {
    if (version === m.fromVersion) {
      current = m.up(current);
      version = m.toVersion;
    }
  }

  return current as Task[];
}
