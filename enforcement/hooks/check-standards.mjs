#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const source = process.env.AI_WORKFLOW_SOURCE && resolve(process.env.AI_WORKFLOW_SOURCE);
if (!source || !existsSync(join(source, 'scripts/standards.mjs'))) {
  console.error('Set AI_WORKFLOW_SOURCE to a reviewed standards source checkout before enabling the standards-check hook.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [join(source, 'scripts/standards.mjs'), 'check', '--target', process.cwd()], {
  stdio: 'inherit', windowsHide: true,
});
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
