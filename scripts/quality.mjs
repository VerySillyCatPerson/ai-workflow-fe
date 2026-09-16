#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name) => { const index = args.indexOf(`--${name}`); return index < 0 ? null : args[index + 1]; };
const target = option('target') && resolve(option('target'));
const baseRef = option('base-ref') || process.env.AI_WORKFLOW_BASE_REF || null;
if (!target) {
  console.error('Usage: node scripts/quality.mjs --target <project> [--base-ref <PR base SHA>]');
  process.exit(2);
}

function run(executable, commandArgs, options = {}) {
  const result = spawnSync(executable, commandArgs, { cwd: target, stdio: 'inherit', windowsHide: true, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${executable} failed with exit code ${result.status}`);
}

function changedFiles() {
  if (!baseRef) return null;
  const mergeBase = spawnSync('git', ['merge-base', baseRef, 'HEAD'], { cwd: target, encoding: 'utf8', windowsHide: true });
  if (mergeBase.status !== 0) throw new Error(`Cannot find PR merge base for ${baseRef}: ${mergeBase.stderr.trim()}`);
  const diff = spawnSync('git', ['diff', '--name-only', '-z', `${mergeBase.stdout.trim()}..HEAD`], { cwd: target, encoding: 'utf8', windowsHide: true });
  if (diff.status !== 0) throw new Error(`Cannot read PR changed files: ${diff.stderr.trim()}`);
  return diff.stdout.split('\0').filter(Boolean);
}

function runCommand(name, command, env = {}) {
  if (!command) throw new Error(`Required execution command ${name} is not configured`);
  console.log(`Running ${name}`);
  if (typeof command === 'string') run(command, [], { shell: true, env: { ...process.env, ...env } });
  else run(command.executable, command.args, { env: { ...process.env, ...env } });
}

try {
  const sourceVersion = JSON.parse(readFileSync(join(source, 'standards.json'), 'utf8')).version;
  const installedVersion = JSON.parse(readFileSync(join(target, 'standards/standards.json'), 'utf8')).version;
  if (sourceVersion !== installedVersion) throw new Error(`Installed standards ${installedVersion} differ from selected source ${sourceVersion}; preview a sync.`);
  run(process.execPath, [join(source, 'scripts/standards.mjs'), 'check', '--target', target]);
  const execution = JSON.parse(readFileSync(join(target, 'standards/execution.json'), 'utf8'));
  const commands = execution.commands;
  const files = changedFiles();
  if (files && commands.lintChanged) {
    if (files.length) runCommand('lintChanged', commands.lintChanged, { AI_WORKFLOW_CHANGED_FILES: JSON.stringify(files) });
    else console.log('No PR changed files; lintChanged skipped.');
  } else runCommand('lint', commands.lint);
  for (const name of ['typecheck', 'test']) runCommand(name, commands[name]);
  const policy = JSON.parse(readFileSync(join(target, 'standards/project.json'), 'utf8'));
  if (!['disabled', 'report-only'].includes(policy.testing?.coverage?.mode)) runCommand('coverage', commands.coverage);
  else console.log(`Coverage is ${policy.testing?.coverage?.mode}; enforcement skipped.`);
  runCommand('build', commands.build);
  console.log('Installed standards and declared quality gates passed.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
