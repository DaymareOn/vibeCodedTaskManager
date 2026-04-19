import type { Task } from '../types/Task';

/**
 * Current data model version. Bump this whenever the Task schema changes
 * in a way that requires migration (add a new Migration entry too).
 */
export const DATA_VERSION = '0.1.0';

/** Signature for a single version-step migration. */
interface Migration {
  fromVersion: string;
  toVersion: string;
  /** Receives the raw task array and returns a transformed copy. */
  up: (tasks: unknown[]) => unknown[];
}

/**
 * No migrations defined yet – this is the first versioned release (v0.1.0).
 * Add a new entry here whenever DATA_VERSION is bumped.
 *
 * Example (uncomment when needed):
 *   {
 *     fromVersion: '0.1.0',
 *     toVersion:   '0.2.0',
 *     up: (tasks) => tasks.map((t) => ({ newField: 'default', ...(t as object) })),
 *   },
 */
const MIGRATIONS: Migration[] = [
  // First versioned release (v0.1.0). Future migrations go here, e.g.:
  //   {
  //     fromVersion: '0.1.0',
  //     toVersion:   '0.2.0',
  //     up: (tasks) => tasks.map((t) => ({ newField: 'default', ...(t as object) })),
  //   },
];

/** Numeric semver comparison (returns negative / 0 / positive). */
function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] => v.split('.').map(Number);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);
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
