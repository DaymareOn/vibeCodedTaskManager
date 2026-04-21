/**
 * setup-git-hooks.js
 *
 * Called by the `prepare` npm lifecycle script.
 * Configures Git to use the repository's bundled hooks (.githooks/) when the
 * script is run inside a Git working tree.  When run outside a Git repository
 * (e.g. after a user extracts the release zip and runs `npm install` /
 * `start.bat`) the script exits cleanly with code 0 instead of crashing.
 */

import { execSync } from 'child_process';

try {
  // Verify we are inside a Git working tree before touching Git config.
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  execSync('git config core.hooksPath .githooks');
} catch (_) {
  // Not a Git repository – skip hook setup silently.
}
