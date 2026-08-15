#!/usr/bin/env node
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateValue } from './lib/schema.mjs';
import { moduleEntries } from './lib/modules.mjs';
import { generateCopilot } from '../adapters/copilot/build.mjs';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const action = args[0];
const option = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null; };
const target = option('target') && resolve(option('target'));
const apply = args.includes('--apply');
const planJson = args.includes('--plan-json');
const fail = (message) => { console.error(message); process.exit(1); };
const usage = 'Usage: node scripts/standards.mjs <init|map|install|check|sync|uninstall|add-module|remove-module> --target <project> [options]';
if (!['init', 'map', 'check', 'install', 'sync', 'uninstall', 'add-module', 'remove-module'].includes(action) || !target) fail(usage);
if (action === 'init') {
  const { runWizard } = await import('./lib/wizard.mjs');
  await runWizard({ source, target, args });
  process.exit(0);
}
if (action === 'map') {
  const { runCodeMap } = await import('./lib/code-map.mjs');
  await runCodeMap({ target, args: args.slice(1) });
  process.exit(0);
}

const routingPath = 'standards/core/rules.md';
const required = ['standards/standards.json', 'standards/project.json', 'standards/project.schema.json', 'standards/execution.json', 'standards/execution.schema.json', 'standards/core/guardrails.md', routingPath];
const hashFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
// Strip a UTF-8 BOM before parsing. Windows PowerShell writes one with
// `Set-Content -Encoding utf8` and `>`, and JSON.parse then fails naming a
// character that renders as nothing, which is very hard to diagnose.
const stripBom = (text) => text.replace(/^﻿/, '');
const readJson = (path, label = path) => { try { return JSON.parse(stripBom(readFileSync(path, 'utf8'))); } catch (error) { fail(`${label}: ${error.message}`); } };
const writeJson = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');

function snapshotPaths(paths) {
  return new Map([...new Set(paths)].map((path) => {
    const absolute = join(target, path);
    return [path, existsSync(absolute) ? readFileSync(absolute) : null];
  }));
}

function restoreSnapshots(snapshots) {
  for (const [path, snapshot] of snapshots) {
    const absolute = join(target, path);
    if (snapshot === null) {
      if (existsSync(absolute)) rmSync(absolute);
    } else {
      mkdirSync(dirname(absolute), { recursive: true });
      writeFileSync(absolute, snapshot);
    }
  }
}

function confinedPath(root, path, label) {
  if (typeof path !== 'string' || !path || isAbsolute(path)) fail(`${label}: expected a non-empty relative path`);
  const rootPath = resolve(root), destination = resolve(rootPath, path), fromRoot = relative(rootPath, destination);
  if (!fromRoot || fromRoot === '..' || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) fail(`${label}: path escapes its root: ${path}`);
  return destination;
}

function managedPath(root, path, label) {
  const destination = confinedPath(root, path, label);
  const rootPath = resolve(root);
  let cursor = rootPath;
  for (const segment of relative(rootPath, destination).split(/[\\/]/)) {
    cursor = join(cursor, segment);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) fail(`${label}: symbolic links are not allowed in managed paths: ${path}`);
  }
  return destination;
}

function validateLock(lock) {
  if (!lock || typeof lock !== 'object' || !/^[a-z0-9-]+$/.test(lock.manifest ?? '')) fail('standards/install-lock.json: invalid manifest');
  confinedPath(source, `manifests/${lock.manifest}.json`, 'standards/install-lock.json.manifest');
  for (const [path, record] of Object.entries(lock.files ?? {})) {
    managedPath(target, path, `standards/install-lock.json.files.${path}`);
    if (!record || typeof record !== 'object' || typeof record.source !== 'string') fail(`standards/install-lock.json.files.${path}: invalid record`);
    if (!record.source.startsWith('GENERATED:')) managedPath(source, record.source, `standards/install-lock.json.files.${path}.source`);
  }
  return lock;
}

function validateCopies(copies, label) {
  for (const [sourcePath, destinationPath] of copies) {
    managedPath(target, destinationPath, `${label}.destination`);
    if (!sourcePath.startsWith('GENERATED:')) managedPath(source, sourcePath, `${label}.source`);
  }
}

function policyErrors(targetRoot) {
  const errors = [];
  const policy = readJson(join(targetRoot, 'standards/project.json'), 'standards/project.json');
  const schema = readJson(join(targetRoot, 'standards/project.schema.json'), 'standards/project.schema.json');
  const marker = readJson(join(targetRoot, 'standards/standards.json'), 'standards/standards.json');
  const execution = readJson(join(targetRoot, 'standards/execution.json'), 'standards/execution.json');
  const executionSchema = readJson(join(targetRoot, 'standards/execution.schema.json'), 'standards/execution.schema.json');
  validateValue(policy, schema, 'standards/project.json', errors);
  validateValue(execution, executionSchema, 'standards/execution.json', errors);
  for (const [name, command] of Object.entries(execution.commands ?? {})) {
    const structured = command && typeof command === 'object' && !Array.isArray(command);
    if (command !== null && typeof command !== 'string' && !structured) errors.push(`standards/execution.json.commands.${name}: expected string, structured command, or null`);
    if (typeof command === 'string' && !command.trim()) errors.push(`standards/execution.json.commands.${name}: command must not be empty`);
    if (structured && (typeof command.executable !== 'string' || !command.executable || !Array.isArray(command.args) || command.args.some((arg) => typeof arg !== 'string') || Object.keys(command).some((key) => !['executable', 'args'].includes(key)))) errors.push(`standards/execution.json.commands.${name}: structured command requires only executable and string args`);
  }
  if (policy.standardsVersion !== marker.version) errors.push(`standardsVersion ${policy.standardsVersion} does not match ${marker.version}`);
  if (policy.framework === 'react-native' && policy.platform !== 'native') errors.push('react-native requires native');
  if (!['react-native', 'unset'].includes(policy.framework) && policy.platform !== 'web') errors.push('web framework requires web');
  if (policy.framework === 'unset' || policy.platform === 'unset') errors.push('framework/platform is unset');
  if (!policy.stack?.unitTestRunner || policy.stack.unitTestRunner === 'project-existing') errors.push('stack.unitTestRunner must name the real runner');
  if (policy.mode === 'greenfield') for (const command of ['lint', 'typecheck', 'test', 'build']) if (!execution.commands?.[command]) errors.push(`greenfield execution commands.${command} must be configured`);
  if (!['disabled', 'report-only'].includes(policy.testing?.coverage?.mode) && !execution.commands?.coverage) errors.push(`coverage mode ${policy.testing?.coverage?.mode} requires execution commands.coverage`);
  if (policy.mode === 'greenfield') for (const choice of ['styling', 'stateManagement', 'serverState', 'e2eRunner']) if (!policy.stack?.[choice] || policy.stack[choice] === 'unset') errors.push(`greenfield stack.${choice} must be configured; use "none" when deliberately unused`);
  return errors;
}

function tableRange(lines) {
  const header = lines.findIndex((line) => /^\| Doing \| Read \|$/.test(line.trim()));
  if (header < 0) throw new Error(`${routingPath}: routing table header not found`);
  let end = header + 2;
  while (end < lines.length && lines[end].trim().startsWith('|')) end += 1;
  return { header, end };
}

function renderRoutingTable(targetRoot, stack, runnerReference) {
  const installedPath = join(targetRoot, routingPath);
  const installed = readFileSync(installedPath, 'utf8').split(/\r?\n/);
  let canonical = readFileSync(join(source, routingPath), 'utf8');
  const runnerName = runnerReference ? runnerReference.split('/').pop().replace(/\.md$/, '') : null;
  canonical = canonical.replaceAll('scaffold-{stack}', `scaffold-${stack}`);
  canonical = runnerName ? canonical.replaceAll('testing-{stack}', runnerName) : canonical.replace(/\s*\+\s*`testing-\{stack\}`/g, '');
  canonical = canonical.replaceAll('performance-{web|native}', stack === 'react-native' ? 'performance-native' : 'performance-web').replaceAll('performance-{web\\|native}', stack === 'react-native' ? 'performance-native' : 'performance-web');
  const sourceLines = canonical.split(/\r?\n/);
  const sourceRange = tableRange(sourceLines);
  const rows = sourceLines.slice(sourceRange.header + 2, sourceRange.end).filter((line) => {
    if (/ workflows? \|$/.test(line.trim())) return true;
    const names = [...((line.split('|')[2] ?? '').matchAll(/`([^`]+)`/g))].map((match) => match[1]);
    return names.every((name) => existsSync(join(targetRoot, 'standards/reference', `${name}.md`)));
  });
  const installedRange = tableRange(installed);
  installed.splice(installedRange.header + 2, installedRange.end - installedRange.header - 2, ...rows);
  writeFileSync(installedPath, `${installed.join('\n').replace(/\n+$/, '')}\n`, 'utf8');
}

function danglingRoutes(targetRoot) {
  const lines = readFileSync(join(targetRoot, routingPath), 'utf8').split(/\r?\n/);
  const { header, end } = tableRange(lines);
  const dangling = [];
  for (const line of lines.slice(header + 2, end)) {
    if (/ workflows? \|$/.test(line.trim())) continue;
    const cells = line.split('|');
    const doing = (cells[1] ?? '').trim();
    const names = [...((cells[2] ?? '').matchAll(/`([^`]+)`/g))].map((match) => match[1]);
    if (!names.length) dangling.push(`${doing}: no routed reference`);
    for (const name of names) if (/[{}]/.test(name) || !existsSync(join(targetRoot, 'standards/reference', `${name}.md`))) dangling.push(`${doing}: ${name}`);
  }
  return dangling;
}

function baseCopies(manifest, mode, runner) {
  const copies = new Map([['standards.json', 'standards/standards.json'], ['templates/project.schema.json', 'standards/project.schema.json'], ['templates/execution.schema.json', 'standards/execution.schema.json'], ['templates/execution.json', 'standards/execution.json'], [`templates/project.${mode}.json`, 'standards/project.json']]);
  for (const path of [...manifest.resident.filter((x) => x !== 'standards.json'), ...manifest.reference.core, ...manifest.commands.core, ...manifest.skills]) copies.set(path, path);
  const runnerReference = manifest.runnerReferences[runner];
  if (runnerReference) copies.set(runnerReference, runnerReference);
  return copies;
}

function adapterCopies(names, manifest) {
  const copies = new Map();
  for (const raw of names) {
    const name = raw === 'agents' ? 'codex' : raw;
    if (name === 'claude') {
      copies.set(`adapters/claude/CLAUDE.${manifest.stack}.md`, 'CLAUDE.md');
      copies.set('adapters/claude/settings.json', '.claude/settings.json');
      for (const hook of ['guard-paths.mjs', 'check-changed.mjs', 'typecheck.mjs']) copies.set(`adapters/claude/hooks/${hook}`, `.claude/hooks/${hook}`);
      for (const workflow of manifest.commands.core) copies.set(workflow, `.claude/commands/${workflow.split('/').pop()}`);
      for (const skill of manifest.skills) copies.set(skill, `.claude/skills/${skill.split('/').pop().replace(/\.md$/, '')}/SKILL.md`);
    } else if (name === 'codex') copies.set('adapters/agents/AGENTS.md', 'AGENTS.md');
    else if (name === 'qwen') copies.set('adapters/qwen/QWEN.md', 'QWEN.md');
    else if (name === 'kimi') copies.set('adapters/kimi/AGENTS.md', '.kimi/AGENTS.md');
    else if (name === 'cursor') copies.set('adapters/cursor/standards.mdc', '.cursor/rules/standards.mdc');
    else if (name !== 'copilot') fail(`Unknown adapter: ${raw}. Choose claude, codex, cursor, copilot, qwen, kimi.`);
  }
  return copies;
}

const editableAdapterPaths = new Set(['CLAUDE.md', 'AGENTS.md', 'QWEN.md', '.kimi/AGENTS.md', '.cursor/rules/standards.mdc']);
const isAdapterPath = (path) => editableAdapterPaths.has(path) || path.startsWith('.claude/') || path === '.github/copilot-instructions.md';

function resolveAdapterText(path, manifest, mode) {
  let text = readFileSync(path, 'utf8');
  return text
    .replaceAll('{Project Name}', basename(target))
    .replaceAll('{web|native}', manifest.platform)
    .replaceAll('{stack}', manifest.stack)
    .replaceAll('{greenfield | legacy}', mode);
}

const managedStart = '<!-- ai-workflow-fe:start -->';
const managedEnd = '<!-- ai-workflow-fe:end -->';

function adapterParts(path, manifest, mode) {
  const resolved = resolveAdapterText(path, manifest, mode);
  const localAt = resolved.indexOf('\n## Project specifics');
  return localAt < 0 ? { shared: resolved.trim(), local: '' } : { shared: resolved.slice(0, localAt).trim(), local: resolved.slice(localAt + 1).trim() };
}

function managedAdapterText(path, manifest, mode, includeLocal) {
  const { shared, local } = adapterParts(path, manifest, mode);
  return `${managedStart}\n${shared}\n${managedEnd}${includeLocal && local ? `\n\n${local}` : ''}\n`;
}

function updateManagedAdapter(destination, sourcePath, manifest, mode) {
  const current = readFileSync(destination, 'utf8');
  const managed = managedAdapterText(sourcePath, manifest, mode, false).trim();
  const start = current.indexOf(managedStart), end = current.indexOf(managedEnd);
  if (start >= 0 && end > start) writeFileSync(destination, `${current.slice(0, start)}${managed}${current.slice(end + managedEnd.length)}`.replace(/\s+$/, '') + '\n', 'utf8');
  else {
    writeFileSync(destination, `${managed}\n\n${current.trim()}\n`, 'utf8');
  }
}

function managedBlock(text) {
  const start = text.indexOf(managedStart), end = text.indexOf(managedEnd);
  return start >= 0 && end > start ? text.slice(start, end + managedEnd.length).trim() : null;
}

function claudeSettingsMissing(destination, sourcePath) {
  const actual = readJson(destination, destination), requiredSettings = readJson(sourcePath, sourcePath), missing = [];
  for (const key of ['deny', 'ask', 'allow']) for (const item of requiredSettings.permissions?.[key] ?? []) if (!(actual.permissions?.[key] ?? []).includes(item)) missing.push(`permissions.${key}: ${item}`);
  for (const [key, items] of Object.entries(requiredSettings.hooks ?? {})) {
    const actualItems = new Set((actual.hooks?.[key] ?? []).map((item) => JSON.stringify(item)));
    for (const item of items) if (!actualItems.has(JSON.stringify(item))) missing.push(`hooks.${key}`);
  }
  return missing;
}

function mergeClaudeSettings(destination, sourcePath) {
  const existing = JSON.parse(stripBom(readFileSync(destination, 'utf8'))), incoming = JSON.parse(stripBom(readFileSync(sourcePath, 'utf8')));
  const added = claudeSettingsAdditions(existing, incoming);
  const merged = { ...incoming, ...existing, permissions: {}, hooks: {} };
  for (const key of ['deny', 'ask', 'allow']) merged.permissions[key] = [...new Set([...(existing.permissions?.[key] ?? []), ...(incoming.permissions?.[key] ?? [])])];
  for (const key of new Set([...Object.keys(existing.hooks ?? {}), ...Object.keys(incoming.hooks ?? {})])) {
    const seen = new Set();
    merged.hooks[key] = [...(existing.hooks?.[key] ?? []), ...(incoming.hooks?.[key] ?? [])].filter((item) => { const id = JSON.stringify(item); if (seen.has(id)) return false; seen.add(id); return true; });
  }
  writeJson(destination, merged);
  return added;
}

function claudeSettingsAdditions(existing, incoming) {
  const added = { topLevel: [], permissions: {}, hooks: {} };
  for (const key of Object.keys(incoming)) if (!['permissions', 'hooks'].includes(key) && !(key in existing)) added.topLevel.push(key);
  for (const key of ['deny', 'ask', 'allow']) {
    const existingItems = new Set(existing.permissions?.[key] ?? []);
    added.permissions[key] = (incoming.permissions?.[key] ?? []).filter((item) => !existingItems.has(item));
  }
  for (const [key, items] of Object.entries(incoming.hooks ?? {})) {
    const existingItems = new Set((existing.hooks?.[key] ?? []).map((item) => JSON.stringify(item)));
    added.hooks[key] = items.filter((item) => !existingItems.has(JSON.stringify(item)));
  }
  return added;
}

function unmergeClaudeSettings(destination, sourcePath, added) {
  const current = readJson(destination, destination), incoming = readJson(sourcePath, sourcePath);
  for (const key of added.topLevel ?? []) if (JSON.stringify(current[key]) === JSON.stringify(incoming[key])) delete current[key];
  for (const key of ['deny', 'ask', 'allow']) {
    const remove = new Set(added.permissions?.[key] ?? []);
    if (current.permissions?.[key]) current.permissions[key] = current.permissions[key].filter((item) => !remove.has(item));
  }
  for (const [key, items] of Object.entries(added.hooks ?? {})) {
    const remove = new Set(items.map((item) => JSON.stringify(item)));
    if (current.hooks?.[key]) current.hooks[key] = current.hooks[key].filter((item) => !remove.has(JSON.stringify(item)));
  }
  writeJson(destination, current);
}

function combineClaudeSettingsAdditions(left = {}, right = {}) {
  const combined = { topLevel: [...new Set([...(left.topLevel ?? []), ...(right.topLevel ?? [])])], permissions: {}, hooks: {} };
  for (const key of ['deny', 'ask', 'allow']) combined.permissions[key] = [...new Set([...(left.permissions?.[key] ?? []), ...(right.permissions?.[key] ?? [])])];
  for (const key of new Set([...Object.keys(left.hooks ?? {}), ...Object.keys(right.hooks ?? {})])) {
    const seen = new Set();
    combined.hooks[key] = [...(left.hooks?.[key] ?? []), ...(right.hooks?.[key] ?? [])].filter((item) => { const id = JSON.stringify(item); if (seen.has(id)) return false; seen.add(id); return true; });
  }
  return combined;
}

function readLock() {
  const path = join(target, 'standards/install-lock.json');
  if (!existsSync(path)) fail('No standards/install-lock.json; reinstall into a clean target first.');
  return { path, value: validateLock(readJson(path, 'standards/install-lock.json')) };
}

if (action === 'check') {
  const missing = required.filter((path) => !existsSync(join(target, path)));
  if (missing.length) fail(`Installation incomplete:\n${missing.map((x) => `- ${x}`).join('\n')}`);
  const errors = policyErrors(target);
  const dangling = danglingRoutes(target);
  if (dangling.length) errors.push(...dangling.map((x) => `dangling route: ${x}`));
  const lockPath = join(target, 'standards/install-lock.json');
  if (!existsSync(lockPath)) errors.push('standards/install-lock.json is missing');
  else {
    const lock = validateLock(readJson(lockPath));
    const manifest = readJson(join(source, 'manifests', `${lock.manifest}.json`));
    const policy = readJson(join(target, 'standards/project.json'));
    const installedModules = new Set(lock.modules ?? []);
    for (const [name, config] of Object.entries(policy.integrations ?? {})) {
      if (config?.enabled === true && !installedModules.has(name)) errors.push(`integration ${name} is enabled but its module is not installed; run add-module --module ${name} --apply`);
    }
    for (const warning of lock.partialAdapters ?? []) {
      const path = warning.replace(/ existed and was not replaced$/, '');
      const record = lock.files?.[path], installed = join(target, path);
      if (!record || !existsSync(installed) || hashFile(installed) !== hashFile(join(source, record.source))) errors.push(`partial adapter installation: ${path}`);
    }
    for (const [path, record] of Object.entries(lock.files ?? {})) {
      const installed = join(target, path);
      if (!existsSync(installed)) errors.push(`tracked file missing: ${path}`);
      else if (!record.editable && !record.merge && !record.preserved && hashFile(installed) !== (record.installedHash ?? record.hash)) errors.push(`tracked shared file modified: ${path}`);
      else if (record.editable && editableAdapterPaths.has(path)) {
        const expected = managedBlock(managedAdapterText(join(source, record.source), manifest, lock.mode, false));
        if (managedBlock(readFileSync(installed, 'utf8')) !== expected) errors.push(`managed adapter block missing or stale: ${path}`);
      } else if (record.merge === 'claude-settings') {
        const missing = claudeSettingsMissing(installed, join(source, record.source));
        if (missing.length) errors.push(`Claude settings missing required protections: ${missing.join(', ')}`);
      }
    }
    if ((lock.adapters ?? []).includes('copilot') && existsSync(join(target, '.github/copilot-instructions.md'))) {
      const temp = mkdtempSync(join(tmpdir(), 'ai-workflow-fe-copilot-'));
      try {
        const generated = join(temp, 'copilot.md');
        try { generateCopilot({ stack: lock.manifest, platform: manifest.platform, root: join(source, 'standards'), policyPath: join(target, 'standards/project.json'), out: generated }); }
        catch (error) { errors.push(`Copilot freshness check failed: ${error.message}`); }
        if (existsSync(generated) && hashFile(generated) !== hashFile(join(target, '.github/copilot-instructions.md'))) errors.push('Copilot instructions are stale; run sync --apply');
      } finally { rmSync(temp, { recursive: true, force: true }); }
    }
  }
  if (errors.length) fail(`Installation invalid:\n${errors.map((x) => `- ${x}`).join('\n')}`);
  const policy = readJson(join(target, 'standards/project.json'));
  console.log(`Standards ${policy.standardsVersion}: ${policy.mode} ${policy.framework}/${policy.platform}; policy and routes valid.`);
  process.exit(0);
}

if (action === 'add-module' || action === 'remove-module') {
  const moduleName = option('module');
  if (!moduleName) fail(`${action} requires --module <name>`);
  const { path: lockPath, value: lock } = readLock();
  const manifest = readJson(join(source, 'manifests', `${lock.manifest}.json`));
  const modulePaths = moduleEntries(manifest).get(moduleName);
  if (!modulePaths) fail(`Unknown module for ${lock.manifest}: ${moduleName}. Choose: ${[...moduleEntries(manifest).keys()].join(', ')}`);
  for (const modulePath of modulePaths) {
    managedPath(source, modulePath, `${action}.source`);
    managedPath(target, modulePath, `${action}.destination`);
  }
  if (action === 'add-module') {
    const conflicts = modulePaths.filter((path) => existsSync(join(target, path)) && !lock.files[path]);
    if (conflicts.length) fail(`Module files exist outside the install lock:\n${conflicts.map((x) => `- ${x}`).join('\n')}`);
    if ((lock.modules ?? []).includes(moduleName)) fail(`Module already installed: ${moduleName}`);
    console.log(`${apply ? 'Adding' : 'Would add'} ${moduleName}:\n${modulePaths.map((x) => `  ${x}`).join('\n')}`);
    if (!apply) process.exit(0);
    const snapshots = snapshotPaths([...modulePaths, routingPath, 'standards/install-lock.json']);
    try {
      for (const modulePath of modulePaths) {
        const destination = join(target, modulePath);
        if (!existsSync(destination)) { mkdirSync(dirname(destination), { recursive: true }); cpSync(join(source, modulePath), destination); }
        lock.files[modulePath] = { source: modulePath, sourceHash: hashFile(join(source, modulePath)), installedHash: hashFile(destination) };
      }
      lock.modules = [...new Set([...(lock.modules ?? []), moduleName])].sort();
      renderRoutingTable(target, lock.manifest, manifest.runnerReferences[lock.unitTestRunner]);
      if (lock.files[routingPath]) lock.files[routingPath].installedHash = hashFile(join(target, routingPath));
      writeJson(lockPath, lock);
    } catch (error) {
      restoreSnapshots(snapshots);
      fail(`Module change rolled back: ${error.message}`);
    }
  } else {
    if (!(lock.modules ?? []).includes(moduleName)) fail(`Module is not installed: ${moduleName}`);
    const remainingModules = (lock.modules ?? []).filter((x) => x !== moduleName);
    const stillNeeded = new Set(remainingModules.flatMap((name) => moduleEntries(manifest).get(name) ?? []));
    const coreRequired = new Set(baseCopies(manifest, lock.mode, lock.unitTestRunner).values());
    const removable = modulePaths.filter((path) => !stillNeeded.has(path) && !coreRequired.has(path));
    for (const modulePath of removable) {
      const destination = join(target, modulePath), record = lock.files[modulePath];
      if (!record || !existsSync(destination) || hashFile(destination) !== (record.installedHash ?? record.hash)) fail(`Refusing to remove missing or locally modified module file: ${modulePath}`);
    }
    console.log(`${apply ? 'Removing' : 'Would remove'} ${moduleName}:\n${removable.map((x) => `  ${x}`).join('\n')}`);
    if (!apply) process.exit(0);
    const snapshots = snapshotPaths([...removable, routingPath, 'standards/install-lock.json']);
    try {
      for (const modulePath of removable) { rmSync(join(target, modulePath)); delete lock.files[modulePath]; }
      lock.modules = remainingModules;
      renderRoutingTable(target, lock.manifest, manifest.runnerReferences[lock.unitTestRunner]);
      if (lock.files[routingPath]) lock.files[routingPath].installedHash = hashFile(join(target, routingPath));
      writeJson(lockPath, lock);
    } catch (error) {
      restoreSnapshots(snapshots);
      fail(`Module change rolled back: ${error.message}`);
    }
  }
  console.log(`${moduleName} ${action === 'add-module' ? 'added' : 'removed'}; routing and lock updated.`);
  process.exit(0);
}

if (action === 'uninstall') {
  const { path: lockPath, value: lock } = readLock();
  const removable = [];
  const editableCleanup = [];
  const mergeCleanup = [];
  const unsafe = [];
  for (const [path, record] of Object.entries(lock.files ?? {})) {
    const installed = join(target, path);
    if (!existsSync(installed)) continue;
    if (record.editable) {
      if (hashFile(installed) === (record.installedHash ?? record.hash)) removable.push(path);
      else if (managedBlock(readFileSync(installed, 'utf8'))) editableCleanup.push(path);
      else unsafe.push(path);
    }
    else if (record.merge === 'claude-settings') {
      if (!record.mergeAdded) unsafe.push(path);
      else if (record.mergeOwned && hashFile(installed) === (record.installedHash ?? record.hash)) removable.push(path);
      else mergeCleanup.push(path);
    }
    else if (record.merge || record.preserved || hashFile(installed) !== (record.installedHash ?? record.hash)) unsafe.push(path);
    else removable.push(path);
  }
  console.log(`${apply ? 'Uninstalling' : 'Would uninstall'} ${removable.length} managed files, clean ${editableCleanup.length} modified adapter files, and unmerge ${mergeCleanup.length} settings files.`);
  if (unsafe.length) console.log(`Preserving locally controlled or modified files:\n${unsafe.map((x) => `  ${x}`).join('\n')}`);
  if (!apply) { console.log('Preview only. Re-run with --apply after review.'); process.exit(0); }
  // Parse merged settings before the first mutation so malformed local JSON
  // fails without requiring rollback.
  for (const path of mergeCleanup) JSON.parse(stripBom(readFileSync(join(target, path), 'utf8')));
  const uninstallSnapshots = snapshotPaths([...removable, ...editableCleanup, ...mergeCleanup, 'standards/install-lock.json']);
  try {
    for (const path of removable) rmSync(join(target, path));
    for (const path of editableCleanup) {
      const installed = join(target, path), current = readFileSync(installed, 'utf8');
      const start = current.indexOf(managedStart), end = current.indexOf(managedEnd);
      const remaining = `${current.slice(0, start)}${current.slice(end + managedEnd.length)}`.trim();
      if (remaining) writeFileSync(installed, `${remaining}\n`, 'utf8');
      else rmSync(installed);
    }
    for (const path of mergeCleanup) unmergeClaudeSettings(join(target, path), join(source, lock.files[path].source), lock.files[path].mergeAdded);
    rmSync(lockPath);
  } catch (error) {
    restoreSnapshots(uninstallSnapshots);
    fail(`Uninstall rolled back: ${error.message}`);
  }
  console.log('Uninstall complete; project policy, trusted execution configuration, modified files, and unrelated files were preserved.');
  process.exit(0);
}

if (action === 'sync') {
  const { path: lockPath, value: lock } = readLock();
  const manifest = readJson(join(source, 'manifests', `${lock.manifest}.json`));
  const desired = baseCopies(manifest, lock.mode, lock.unitTestRunner);
  desired.delete('templates/project.' + lock.mode + '.json');
  desired.delete('templates/execution.json');
  const needsExecutionMigration = !existsSync(join(target, 'standards/execution.json'));
  for (const moduleName of lock.modules ?? []) for (const path of moduleEntries(manifest).get(moduleName) ?? []) desired.set(path, path);
  for (const [from, to] of adapterCopies(lock.adapters ?? [], manifest)) desired.set(from, to);
  if ((lock.adapters ?? []).includes('copilot')) desired.set('GENERATED:copilot', '.github/copilot-instructions.md');
  validateCopies(desired, 'sync');
  const updates = [], additions = [], localChanges = [];
  for (const [from, installed] of desired) {
    const destination = join(target, installed), upstream = join(source, from), record = lock.files[installed];
    if (!record || !existsSync(destination)) { additions.push({ installed, source: from, ...(installed === '.claude/settings.json' ? { merge: 'claude-settings' } : {}) }); continue; }
    if (record.editable) {
      const expected = managedBlock(managedAdapterText(upstream, manifest, lock.mode, false));
      if (managedBlock(readFileSync(destination, 'utf8')) !== expected) updates.push({ installed, source: from, editable: true });
      continue;
    }
    if (record.merge) {
      if (record.merge === 'claude-settings' && claudeSettingsMissing(destination, upstream).length) updates.push({ installed, source: from, merge: record.merge });
      continue;
    }
    if (record.preserved) {
      if (hashFile(destination) === hashFile(upstream)) updates.push({ installed, source: from });
      continue;
    }
    if (hashFile(destination) !== (record.installedHash ?? record.hash)) localChanges.push(`${installed} (modified locally)`);
    else if (from === 'GENERATED:copilot' || hashFile(upstream) !== (record.sourceHash ?? record.hash)) updates.push({ installed, source: from });
  }
  const obsolete = Object.keys(lock.files).filter((path) => !desired.has(lock.files[path].source) && ![...desired.values()].includes(path));
  if (localChanges.length) fail(`Sync stopped:\n${localChanges.map((x) => `- ${x}`).join('\n')}`);
  if (args.includes('--remove-obsolete')) {
    const unsafe = obsolete.filter((path) => !existsSync(join(target, path)) || hashFile(join(target, path)) !== (lock.files[path].installedHash ?? lock.files[path].hash));
    if (unsafe.length) fail(`Refusing to remove missing or locally modified obsolete files:\n${unsafe.map((x) => `- ${x}`).join('\n')}`);
  }
  console.log(`${apply ? 'Syncing' : 'Would sync'} ${updates.length} updates and ${additions.length} additions.`);
  if (needsExecutionMigration) console.log(`${apply ? 'Migrating' : 'Would migrate'} executable commands from project.json to trusted standards/execution.json.`);
  if (obsolete.length) console.log(`${args.includes('--remove-obsolete') ? (apply ? 'Removing' : 'Would remove') : 'Obsolete files (use --remove-obsolete to remove safely)'}:\n${obsolete.map((x) => `  ${x}`).join('\n')}`);
  if (!apply) { console.log('Preview only. Re-run with --apply after review.'); process.exit(0); }
  const syncSnapshots = snapshotPaths([
    ...updates.map((item) => item.installed),
    ...additions.map((item) => item.installed),
    ...(args.includes('--remove-obsolete') ? obsolete : []),
    routingPath, 'standards/project.json', 'standards/execution.json', 'standards/install-lock.json',
  ]);
  try {
  const targetVersion = readJson(join(source, 'standards.json')).version;
  const policyPath = join(target, 'standards/project.json'), policy = readJson(policyPath);
  if (needsExecutionMigration) {
    const execution = readJson(join(source, 'templates/execution.json'));
    if (policy.commands) execution.commands = { ...execution.commands, ...policy.commands };
    writeJson(join(target, 'standards/execution.json'), execution);
  }
  delete policy.commands;
  policy.integrations ??= {};
  policy.standardsVersion = targetVersion;
  writeJson(policyPath, policy);
  const syncMergeRecords = new Map();
  for (const item of [...updates, ...additions]) {
    const destination = join(target, item.installed); mkdirSync(dirname(destination), { recursive: true });
    if (item.editable) updateManagedAdapter(destination, join(source, item.source), manifest, lock.mode);
    else if (item.merge === 'claude-settings') {
      if (existsSync(destination)) syncMergeRecords.set(item.installed, { added: mergeClaudeSettings(destination, join(source, item.source)), owned: false });
      else {
        cpSync(join(source, item.source), destination);
        syncMergeRecords.set(item.installed, { added: claudeSettingsAdditions({}, readJson(join(source, item.source))), owned: true });
      }
    }
    else if (item.source === 'GENERATED:copilot') {
      try { generateCopilot({ stack: lock.manifest, platform: manifest.platform, root: join(source, 'standards'), policyPath: join(target, 'standards/project.json'), out: destination }); }
      catch (error) { throw new Error(`Copilot adapter failed: ${error.message}`); }
    } else cpSync(join(source, item.source), destination);
  }
  renderRoutingTable(target, lock.manifest, manifest.runnerReferences[lock.unitTestRunner]);
  for (const item of [...updates, ...additions]) {
    const previous = lock.files[item.installed] ?? {};
    const syncMerge = syncMergeRecords.get(item.installed);
    lock.files[item.installed] = { source: item.source, sourceHash: item.source.startsWith('GENERATED:') ? hashFile(join(target, item.installed)) : hashFile(join(source, item.source)), installedHash: hashFile(join(target, item.installed)), ...(item.editable ? { editable: true } : {}), ...(item.merge ? { merge: item.merge, mergeAdded: combineClaudeSettingsAdditions(previous.mergeAdded, syncMerge?.added), ...((previous.mergeOwned || syncMerge?.owned) ? { mergeOwned: true } : {}) } : {}) };
  }
  if (args.includes('--remove-obsolete')) for (const path of obsolete) { rmSync(join(target, path)); delete lock.files[path]; }
  lock.partialAdapters = (lock.partialAdapters ?? []).filter((warning) => {
    const path = warning.replace(/ existed and was not replaced$/, ''), record = lock.files[path];
    return !record || !existsSync(join(target, path)) || hashFile(join(target, path)) !== hashFile(join(source, record.source));
  });
  if (lock.files[routingPath]) lock.files[routingPath].installedHash = hashFile(join(target, routingPath));
  lock.standardsVersion = targetVersion;
  writeJson(lockPath, lock);
  } catch (error) {
    restoreSnapshots(syncSnapshots);
    fail(`Sync rolled back: ${error.message}`);
  }
  console.log('Sync complete; project policy and local changes were preserved.');
  process.exit(0);
}

const stack = option('manifest'), mode = option('mode');
if (!stack || !['greenfield', 'legacy'].includes(mode)) fail('install requires --manifest and --mode greenfield|legacy');
const manifestPath = join(source, 'manifests', `${stack}.json`);
if (!existsSync(manifestPath)) fail(`Unknown manifest: ${stack}`);
const manifest = readJson(manifestPath), unitTestRunner = option('unit-test-runner') ?? manifest.runnerDefault;
if (!(unitTestRunner in (manifest.runnerReferences ?? {}))) fail(`Unsupported runner for ${stack}: ${unitTestRunner}`);
const adapters = (option('adapter') ?? '').split(',').filter(Boolean).map((x) => x === 'agents' ? 'codex' : x);
const copies = baseCopies(manifest, mode, unitTestRunner);
for (const [from, to] of adapterCopies(adapters, manifest)) copies.set(from, to);
if (adapters.includes('copilot')) copies.delete('copilot-generated');
validateCopies(copies, 'install');
if (adapters.includes('copilot')) managedPath(target, '.github/copilot-instructions.md', 'install.destination');
const conflicts = [...copies.values()].filter((path) => existsSync(join(target, path)) && !isAdapterPath(path));
if (planJson) {
  const create = [...copies.values(), ...(adapters.includes('copilot') ? ['.github/copilot-instructions.md'] : [])].filter((path) => !existsSync(join(target, path)));
  const modify = [...copies.values(), ...(adapters.includes('copilot') ? ['.github/copilot-instructions.md'] : [])].filter((path) => existsSync(join(target, path)) && (editableAdapterPaths.has(path) || path === '.claude/settings.json' || path === '.github/copilot-instructions.md'));
  console.log(JSON.stringify({ create: [...new Set(create)].sort(), modify: [...new Set(modify)].sort(), conflicts: [...new Set(conflicts)].sort() }));
  process.exit(0);
}
console.log(`${apply ? 'Installing' : 'Would install'} ${copies.size} files for ${stack}/${mode} with ${unitTestRunner}${adapters.length ? `; adapters: ${adapters.join(', ')}` : ''}.`);
if (conflicts.length) fail(`Refusing to overwrite existing files:\n${conflicts.map((x) => `- ${x}`).join('\n')}`);
if (!apply) { console.log('Preview only. Re-run with --apply after review.'); process.exit(0); }
const writtenCopies = new Map();
const preservedAdapterPaths = new Set();
const mergeRecords = new Map();
const partialAdapters = [];
const installPaths = new Set([...copies.values(), ...(adapters.includes('copilot') ? ['.github/copilot-instructions.md'] : []), 'standards/install-lock.json']);
const installSnapshots = new Map([...installPaths].map((path) => { const destination = join(target, path); return [path, existsSync(destination) ? readFileSync(destination) : null]; }));
const targetExistedBeforeInstall = existsSync(target);
const createdDirectories = [];
const ensureInstallDirectory = (directory) => {
  const missing = [];
  let cursor = directory;
  while (relative(resolve(target), resolve(cursor)) && !existsSync(cursor)) { missing.push(cursor); cursor = dirname(cursor); }
  mkdirSync(directory, { recursive: true });
  createdDirectories.push(...missing);
};
let installedPolicy;
try {
  for (const [from, to] of copies) {
    const destination = join(target, to); ensureInstallDirectory(dirname(destination));
    if (existsSync(destination)) {
      if (editableAdapterPaths.has(to)) {
        updateManagedAdapter(destination, join(source, from), manifest, mode);
        writtenCopies.set(from, to);
      } else if (to === '.claude/settings.json') {
        mergeRecords.set(to, { mergeOwned: false, mergeAdded: mergeClaudeSettings(destination, join(source, from)) });
        writtenCopies.set(from, to);
      } else {
        console.log(`Preserved existing adapter file: ${to}`);
        writtenCopies.set(from, to);
        preservedAdapterPaths.add(to);
        if (hashFile(destination) !== hashFile(join(source, from))) partialAdapters.push(to);
      }
      continue;
    }
    if (editableAdapterPaths.has(to)) writeFileSync(destination, managedAdapterText(join(source, from), manifest, mode, true), 'utf8');
    else {
      cpSync(join(source, from), destination);
      if (to === '.claude/settings.json') {
        const incoming = readJson(join(source, from));
        mergeRecords.set(to, { mergeOwned: true, mergeAdded: claudeSettingsAdditions({}, incoming) });
      }
    }
    writtenCopies.set(from, to);
  }
  const installedPolicyPath = join(target, 'standards/project.json');
  installedPolicy = readJson(installedPolicyPath);
  installedPolicy.framework = manifest.stack; installedPolicy.platform = manifest.platform; installedPolicy.stack.unitTestRunner = unitTestRunner;
  for (const [flag, key] of [['e2e-runner', 'e2eRunner'], ['styling', 'styling'], ['state-management', 'stateManagement'], ['server-state', 'serverState']]) if (option(flag)) installedPolicy.stack[key] = option(flag);
  writeJson(installedPolicyPath, installedPolicy);
  renderRoutingTable(target, manifest.stack, manifest.runnerReferences[unitTestRunner]);
  if (adapters.includes('copilot')) {
    const destination = join(target, '.github/copilot-instructions.md'); ensureInstallDirectory(dirname(destination));
    try { generateCopilot({ stack, platform: manifest.platform, root: join(source, 'standards'), policyPath: installedPolicyPath, out: destination }); }
    catch (error) { throw new Error(`Copilot adapter failed: ${error.message}`); }
    writtenCopies.set('GENERATED:copilot', '.github/copilot-instructions.md');
  }
  const lock = { schemaVersion: 2, standardsVersion: installedPolicy.standardsVersion, manifest: stack, mode, unitTestRunner, adapters, modules: [], partialAdapters, files: {} };
  for (const [from, to] of writtenCopies) if (!['standards/project.json', 'standards/execution.json'].includes(to)) lock.files[to] = { source: from, sourceHash: from.startsWith('GENERATED:') ? hashFile(join(target, to)) : hashFile(join(source, from)), installedHash: hashFile(join(target, to)), ...(editableAdapterPaths.has(to) ? { editable: true } : {}), ...(preservedAdapterPaths.has(to) ? { preserved: true } : {}), ...(to === '.claude/settings.json' ? { merge: 'claude-settings', ...mergeRecords.get(to) } : {}) };
  writeJson(join(target, 'standards/install-lock.json'), lock);
} catch (error) {
  for (const [path, snapshot] of installSnapshots) {
    const destination = join(target, path);
    if (snapshot === null) { if (existsSync(destination)) rmSync(destination); }
    else { mkdirSync(dirname(destination), { recursive: true }); writeFileSync(destination, snapshot); }
  }
  for (const directory of [...new Set(createdDirectories)].sort((a, b) => b.length - a.length)) if (existsSync(directory)) { try { rmdirSync(directory); } catch {} }
  if (!targetExistedBeforeInstall && existsSync(target)) { try { rmdirSync(target); } catch {} }
  fail(`Install rolled back: ${error.message}`);
}
if (partialAdapters.length) console.log(`Installed with partial adapter integration:\n${partialAdapters.map((x) => `- ${x}`).join('\n')}`);
else console.log('Installed. Fill project policy and trusted standards/execution.json commands, then run check.');
