#!/usr/bin/env node
/** Run the consuming project's declared typecheck command once at turn end. */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const policyPath = 'standards/execution.json';
if (!existsSync(policyPath)) process.exit(0);

let command = null;
// .replace strips a UTF-8 BOM, which PowerShell-written policy files carry.
try { command = JSON.parse(readFileSync(policyPath, 'utf8').replace(/^﻿/, ''))?.commands?.typecheck ?? null; }
catch { console.error('Cannot read trusted standards/execution.json; typecheck was not run.'); process.exit(1); }

if (!command) {
  console.error('No typecheck command is configured in standards/execution.json; typecheck was not run.');
  process.exit(0);
}

const structured = typeof command === 'object';
const result = structured
  ? spawnSync(command.executable, command.args, { encoding: 'utf8', windowsHide: true })
  : spawnSync(command, { encoding: 'utf8', shell: true, windowsHide: true });
if (result.status !== 0) {
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error?.message ?? ''}`.trim();
  console.error(`Typecheck failed:\n${out || '(no output)'}`);
  process.exit(1);
}
process.exit(0);
