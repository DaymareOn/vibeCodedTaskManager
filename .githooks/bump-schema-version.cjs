#!/usr/bin/env node
'use strict';

/**
 * Pre-commit helper: auto-bumps the patch component of the `$id` version in
 * task.schema.json whenever the file is staged for commit.
 *
 * Skips the bump when the developer already changed `$id` manually (i.e. HEAD
 * and the staged version already differ), so intentional minor/major bumps are
 * always respected.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCHEMA_FILE = 'src/schemas/task.schema.json';

// Only act when the schema file is staged.
const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
if (!staged.split('\n').includes(SCHEMA_FILE)) {
  process.exit(0);
}

const schemaPath = path.resolve(SCHEMA_FILE);
const content = fs.readFileSync(schemaPath, 'utf8');
const currentId = JSON.parse(content).$id;

// Read the $id from the last committed version (HEAD), if one exists.
let headId = null;
try {
  const headContent = execSync(`git show HEAD:${SCHEMA_FILE}`, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  headId = JSON.parse(headContent).$id;
} catch {
  // No HEAD yet (initial commit) – proceed with auto-bump.
}

// If the developer already changed $id manually, respect their choice.
if (headId !== null && currentId !== headId) {
  process.exit(0);
}

// Parse and bump the patch component of the version in $id.
// Expected format: "task-schema-v<major>.<minor>.<patch>"
const match = currentId.match(/^(.*-v)(\d+)\.(\d+)\.(\d+)$/);
if (!match) {
  console.error(
    `[pre-commit] Cannot parse version from $id: "${currentId}". Skipping auto-bump.`,
  );
  process.exit(0);
}

const [, prefix, major, minor, patch] = match;
const newId = `${prefix}${major}.${minor}.${parseInt(patch, 10) + 1}`;

// Replace only the $id value by matching the exact current value as a literal
// string, avoiding any risk of matching nested $id fields.
const updatedContent = content.replace(`"$id": "${currentId}"`, `"$id": "${newId}"`);
fs.writeFileSync(schemaPath, updatedContent);
execSync(`git add -- "${SCHEMA_FILE}"`);

console.log(`[pre-commit] Bumped schema $id: ${currentId} → ${newId}`);
