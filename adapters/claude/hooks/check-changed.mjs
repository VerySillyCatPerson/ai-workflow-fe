#!/usr/bin/env node
/** Run the consuming project's declared lint command once at turn end. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const policyPath = 'standards/execution.json';
if (!existsSync(policyPath)) process.exit(0);

let commands = null;
// .replace strips a UTF-8 BOM, which PowerShell-written policy files carry.
try { commands = JSON.parse(readFileSync(policyPath, 'utf8').replace(/^﻿/, ''))?.commands ?? null; }
catch { console.error('Cannot read trusted standards/execution.json; lint was not run.'); process.exit(1); }

if (!commands?.lint) {
  console.error('No lint command is configured in standards/execution.json; lint was not run.');
  process.exit(0);
}

const git = (args) => spawnSync('git', args, { encoding: 'utf8', windowsHide: true });
const changed = new Set();
for (const result of [git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']), git(['ls-files', '--others', '--exclude-standard'])]) {
  if (result.status === 0) for (const path of result.stdout.split(/\r?\n/).filter(Boolean)) if (/\.(?:[cm]?[jt]sx?|vue)$/.test(path)) changed.add(path);
}
const useChanged = Boolean(commands.lintChanged) && changed.size > 0;
if (commands.lintChanged && !changed.size) process.exit(0);
const command = useChanged ? commands.lintChanged : commands.lint;
const options = { encoding: 'utf8', windowsHide: true, env: { ...process.env, AI_WORKFLOW_CHANGED_FILES: JSON.stringify([...changed]) } };
const result = typeof command === 'object'
  ? spawnSync(command.executable, command.args, options)
  : spawnSync(command, { ...options, shell: true });
if (result.status !== 0) {
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  console.error(`${useChanged ? 'Changed-file lint' : 'Lint'} failed:\n${output || '(no output)'}`);
  process.exit(result.status ?? 1);
}
process.exit(0);
