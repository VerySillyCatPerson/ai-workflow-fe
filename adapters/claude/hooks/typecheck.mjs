#!/usr/bin/env node
/** Run the consuming project's declared typecheck command once at turn end. */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const policyPath = 'standards/project.json';
if (!existsSync(policyPath)) process.exit(0);

let command = null;
// .replace strips a UTF-8 BOM, which PowerShell-written policy files carry.
try { command = JSON.parse(readFileSync(policyPath, 'utf8').replace(/^﻿/, ''))?.commands?.typecheck ?? null; }
catch { console.error('Cannot read standards/project.json; typecheck was not run.'); process.exit(1); }

if (!command) {
  console.error('No typecheck command is configured in standards/project.json; typecheck was not run.');
  process.exit(0);
}

try { execSync(command, { encoding: 'utf8', stdio: 'pipe', shell: true }); }
catch (error) {
  const out = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
  console.error(`Typecheck failed:\n${out || '(no output)'}`);
  process.exit(1);
}
process.exit(0);
