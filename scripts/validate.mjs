#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateValue } from './lib/schema.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const validationArgs = process.argv.slice(2);
const fastOnly = validationArgs.includes('--fast');
const integrationMode = validationArgs.includes('--integration');
if (fastOnly && integrationMode) {
  console.error('Choose either --fast or --integration.');
  process.exit(1);
}
const errors = [];
const runNode = (argv, cwd = root) => new Promise((resolveRun) => {
  const child = spawn(process.execPath, argv, { cwd, windowsHide: true });
  let stdout = '', stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', (error) => resolveRun({ status: 1, stdout, stderr: `${stderr}${error.message}` }));
  child.on('close', (status) => resolveRun({ status, stdout, stderr }));
});
const json = (path) => {
  try { return JSON.parse(readFileSync(join(root, path), 'utf8')); }
  catch (error) { errors.push(`${path}: ${error.message}`); return null; }
};
const requirePath = (path, owner) => {
  if (!existsSync(join(root, path))) errors.push(`${owner}: missing ${path}`);
};
const marker = json('standards.json');
const schema = json('templates/project.schema.json');
json('templates/execution.schema.json');
const presets = ['templates/project.greenfield.json', 'templates/project.legacy.json'];

function walk(dir) {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name).replaceAll('\\', '/');
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function walkExternal(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(dir, entry.name);
    return entry.isDirectory() ? walkExternal(absolute, base) : [absolute.slice(base.length + 1).replaceAll('\\', '/')];
  });
}

for (const path of ['adapters', 'manifests', 'templates'].flatMap(walk).filter((x) => x.endsWith('.json'))) json(path);

function validatePolicy(policy, path) {
  if (!policy || !schema) return;
  validateValue(policy, schema, path, errors);
  if (policy.standardsVersion !== marker?.version) errors.push(`${path}: standardsVersion must match ${marker?.version}`);
  if (policy.framework === 'react-native' && policy.platform !== 'native') errors.push(`${path}: react-native requires native`);
  if (!['react-native', 'unset'].includes(policy.framework) && policy.platform !== 'web') errors.push(`${path}: web framework requires web`);
  if (policy.framework === 'unset' && policy.platform !== 'unset') errors.push(`${path}: unset framework requires unset platform`);
}

for (const path of presets) validatePolicy(json(path), path);

const manifests = readdirSync(join(root, 'manifests')).filter((x) => x.endsWith('.json'));
for (const name of manifests) {
  const path = `manifests/${name}`;
  const manifest = json(path);
  if (!manifest) continue;
  for (const item of manifest.resident ?? []) requirePath(item, path);
  for (const item of manifest.reference?.core ?? []) requirePath(item, path);
  for (const item of manifest.commands?.core ?? []) requirePath(item, path);
  for (const item of manifest.skills ?? []) requirePath(item, path);
  if (!(manifest.runnerDefault in (manifest.runnerReferences ?? {}))) errors.push(`${path}: runnerDefault is not present in runnerReferences`);
  for (const reference of Object.values(manifest.runnerReferences ?? {}).filter(Boolean)) requirePath(reference, path);
  if ((manifest.reference?.core ?? []).some((item) => /testing-(jest|vitest|angular|rntl)/.test(item))) errors.push(`${path}: runner-specific testing reference must be selected through runnerReferences`);
  if (manifest.stack === 'react-native' && manifest.platform !== 'native') errors.push(`${path}: react-native must be native`);
  if (manifest.stack !== 'react-native' && manifest.platform !== 'web') errors.push(`${path}: non-native stack must be web`);
}
const readme = readFileSync(join(root, 'README.md'), 'utf8');
if (readme.includes('enforcement/ci/')) errors.push('README.md claims enforcement/ci/ exists');
if (/```[^`]*\bnpx\b/s.test(readme)) errors.push('README.md contains an executable npx example');
// Assert the README still DOCUMENTS these things, not that it uses particular
// heading text. Pinning headings blocks legitimate rewrites for no added safety.
for (const [what, present] of [
  ['the four rule strengths', ['Guardrail', 'Invariant', 'Configurable policy', 'Recommendation'].every((k) => readme.includes(k))],
  ['how to change project policy', readme.includes('standards/project.json') && /```json[\s\S]*?limits[\s\S]*?```/.test(readme)],
  ['that shared standards must not be edited', /not edit the shared|Never edit the shared/i.test(readme)],
  ['the install command', readme.includes('scripts/standards.mjs install')],
  ['the check command', readme.includes('scripts/standards.mjs check')],
  ['the sync command', readme.includes('scripts/standards.mjs sync')],
  ['the source-repository validator', readme.includes('scripts/validate.mjs')],
  ['that limits are review triggers, not verdicts', /review trigger/i.test(readme)],
]) {
  if (!present) errors.push(`README.md no longer documents ${what}`);
}

const conformance = readFileSync(join(root, 'adoption/conformance.md'), 'utf8');
for (const heading of ['### Guardrails', '### Invariants', '### Configurable policy', '### Recommendations']) {
  if (!conformance.includes(heading)) errors.push(`adoption/conformance.md missing taxonomy heading ${heading}`);
}
for (const pattern of [/200-line/i, /400-line/i, /never `?any`?/i, /no `any`/i]) {
  if (pattern.test(conformance)) errors.push(`adoption/conformance.md contains stale universal policy: ${pattern}`);
}
for (const file of walk('adoption').filter((x) => x.endsWith('.md'))) {
  const content = readFileSync(join(root, file), 'utf8');
  if (/`\/[a-z][a-z-]+`/.test(content)) errors.push(`${file} contains tool-specific slash-command syntax`);
}

const policyAwareFiles = [...walk('standards'), ...walk('workflows'), ...walk('adoption')].filter((x) => x.endsWith('.md'));
const policyAwareText = policyAwareFiles.map((file) => `${file}\n${readFileSync(join(root, file), 'utf8')}`).join('\n');
for (const pattern of [/200-line component/i, /400-line PR/i, /## Never `any`/i, /Non-negotiable in `tsconfig\.json`/i, /testIdPolicy/]) {
  if (pattern.test(policyAwareText)) errors.push(`standards tree contains stale policy-class contradiction: ${pattern}`);
}
for (const file of ['testing-jest-rtl.md', 'testing-vitest-vtl.md', 'testing-angular.md', 'testing-rntl.md']) {
  const content = readFileSync(join(root, 'standards/reference', file), 'utf8');
  if (!content.includes('Never `getByTestId`')) errors.push(`standards/reference/${file} must enforce the no-test-only-selector invariant`);
}
const typescriptReference = readFileSync(join(root, 'standards/reference/typescript.md'), 'utf8');
for (const key of ['typescript.strictness', 'typescript.anyPolicy', 'typeAssertionPolicy']) {
  if (!typescriptReference.includes(key)) errors.push(`standards/reference/typescript.md does not defer to ${key}`);
}
if (schema?.properties?.testing?.properties?.testIdPolicy) errors.push('project schema exposes testIdPolicy even though test-only selectors are invariant');

const frameworkFiles = walk('standards/framework').filter((x) => x.endsWith('.md'));
for (const file of frameworkFiles) {
  const content = readFileSync(join(root, file), 'utf8');
  if (/^Scripts:/m.test(content)) errors.push(`${file} hardcodes resident script names`);
  if (/reference\/testing-(jest|vitest|angular|rntl)/.test(content)) errors.push(`${file} hardcodes a unit-test runner reference`);
  if (!content.includes('standards/execution.json')) errors.push(`${file} does not defer validation commands to trusted execution policy`);
}
const standardsAndWorkflows = [...walk('standards'), ...walk('workflows')].filter((x) => x.endsWith('.md')).map((file) => readFileSync(join(root, file), 'utf8')).join('\n');
for (const key of ['stack.styling', 'stack.stateManagement', 'stack.serverState', 'stack.unitTestRunner', 'stack.e2eRunner']) {
  if (!standardsAndWorkflows.includes(key)) errors.push(`project policy key ${key} has no standards/workflow consumer`);
}
const maintaining = readFileSync(join(root, 'MAINTAINING.md'), 'utf8');
if (!maintaining.includes('`scripts/` when validating a named')) errors.push('MAINTAINING.md does not allow adapter names in validator scripts');
if (!maintaining.includes('`a11y.md` and') || !maintaining.includes('`security-scan.md`')) errors.push('MAINTAINING.md does not document skill name frontmatter');

if (fastOnly) {
  if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n${errors.map((x) => `- ${x}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`Fast validation passed: ${presets.length} presets, ${manifests.length} manifests, and static invariants.`);
  process.exit(0);
}

const copilotCases = [['nextjs', 'web'], ['react', 'web'], ['vue', 'web'], ['angular', 'web'], ['react-native', 'native']];
const generatedDir = mkdtempSync(join(tmpdir(), 'ai-workflow-fe-'));
const configureProjectPolicy = (target) => {
  const path = join(target, 'standards/project.json');
  const policy = JSON.parse(readFileSync(path, 'utf8'));
  if (policy.mode === 'greenfield') for (const key of ['styling', 'stateManagement', 'serverState', 'e2eRunner']) policy.stack[key] = 'none';
  writeFileSync(path, JSON.stringify(policy), 'utf8');
  const executionPath = join(target, 'standards/execution.json');
  const execution = JSON.parse(readFileSync(executionPath, 'utf8'));
  for (const key of ['lint', 'typecheck', 'test', 'coverage', 'build']) execution.commands[key] = { executable: process.execPath, args: ['--version'] };
  writeFileSync(executionPath, JSON.stringify(execution), 'utf8');
};
try {
  for (const [stack, platform] of copilotCases) {
    const policy = JSON.parse(readFileSync(join(root, 'templates/project.greenfield.json'), 'utf8'));
    policy.framework = stack;
    policy.platform = platform;
    const policyPath = join(generatedDir, `${stack}.policy.json`);
    writeFileSync(policyPath, JSON.stringify(policy), 'utf8');
    const generatedPath = join(generatedDir, `${stack}.md`);
    const result = spawnSync(process.execPath, ['adapters/copilot/build.mjs', '--stack', stack, '--platform', platform, '--policy', policyPath, '--out', generatedPath], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) errors.push(`Copilot ${stack}/${platform}: ${(result.stderr || result.stdout).trim()}`);
    else {
      const generated = readFileSync(generatedPath, 'utf8');
      if (!generated.includes('## Effective project policy') || !generated.includes(`"framework": "${stack}"`)) errors.push(`Copilot ${stack}/${platform}: resolved policy was not inlined`);
    }
  }
  const unresolved = spawnSync(process.execPath, ['adapters/copilot/build.mjs', '--stack', 'vue', '--platform', 'web', '--policy', join(root, 'templates/project.greenfield.json'), '--out', join(generatedDir, 'unresolved.md')], { cwd: root, encoding: 'utf8' });
  if (unresolved.status === 0) errors.push('Copilot generator accepts unresolved project policy');

  await Promise.all(manifests.map((name) => name.replace(/\.json$/, '')).flatMap((manifestName) => ['greenfield', 'legacy'].map(async (mode) => {
      const target = join(generatedDir, `install-${manifestName}-${mode}`);
      const install = await runNode(['scripts/standards.mjs', 'install', '--target', target, '--manifest', manifestName, '--mode', mode, '--apply']);
      if (install.status !== 0) { errors.push(`Installer ${manifestName}/${mode}: ${(install.stderr || install.stdout).trim()}`); return; }
      configureProjectPolicy(target);
      const check = await runNode(['scripts/standards.mjs', 'check', '--target', target]);
      if (check.status !== 0) errors.push(`Installed check ${manifestName}/${mode}: ${(check.stderr || check.stdout).trim()}`);
      const sync = await runNode(['scripts/standards.mjs', 'sync', '--target', target]);
      if (sync.status !== 0) errors.push(`Installed sync ${manifestName}/${mode}: ${(sync.stderr || sync.stdout).trim()}`);

      const lock = JSON.parse(readFileSync(join(target, 'standards/install-lock.json'), 'utf8'));
      const actual = new Set(walkExternal(target));
      const expected = new Set([...Object.keys(lock.files), 'standards/project.json', 'standards/execution.json', 'standards/install-lock.json']);
      for (const file of expected) if (!actual.has(file)) errors.push(`Installer ${manifestName}/${mode}: missing output ${file}`);
      for (const file of actual) if (!expected.has(file)) errors.push(`Installer ${manifestName}/${mode}: unexpected output ${file}`);

      const manifest = JSON.parse(readFileSync(join(root, 'manifests', `${manifestName}.json`), 'utf8'));
      for (const optional of Object.keys(manifest.reference?.optional ?? {})) {
        if (existsSync(join(target, optional))) errors.push(`Installer ${manifestName}/${mode}: installed optional reference ${optional}`);
      }
      const rules = readFileSync(join(target, 'standards/core/rules.md'), 'utf8');
      if (/\{stack\}|\{web\\?\|native\}/.test(rules)) errors.push(`Installer ${manifestName}/${mode}: unresolved routing placeholder`);
  })));

  const dryTarget = join(generatedDir, 'dry-run-must-not-exist');
  const dryRun = spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', dryTarget, '--manifest', 'vue', '--mode', 'greenfield'], { cwd: root, encoding: 'utf8' });
  if (dryRun.status !== 0 || existsSync(dryTarget)) errors.push('Installer dry run writes files or fails');

  const danglingTarget = join(generatedDir, 'install-vue-greenfield');
  const danglingRules = join(danglingTarget, 'standards/core/rules.md');
  let tampered = readFileSync(danglingRules, 'utf8');
  tampered = tampered.replace('| --- | --- |', '| --- | --- |\n| Deliberate dangling test | `does-not-exist` |');
  writeFileSync(danglingRules, tampered, 'utf8');
  const danglingCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', danglingTarget], { cwd: root, encoding: 'utf8' });
  if (danglingCheck.status === 0) errors.push('Installer check accepts a dangling routing reference');

  for (const adapter of ['claude', 'codex', 'cursor', 'copilot']) {
    const target = join(generatedDir, `adapter-${adapter}`);
    const install = spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', target, '--manifest', 'vue', '--mode', 'greenfield', '--adapter', adapter, '--apply'], { cwd: root, encoding: 'utf8' });
    if (install.status !== 0) { errors.push(`Adapter install ${adapter}: ${(install.stderr || install.stdout).trim()}`); continue; }
    configureProjectPolicy(target);
    const expected = { claude: 'CLAUDE.md', codex: 'AGENTS.md', cursor: '.cursor/rules/standards.mdc', copilot: '.github/copilot-instructions.md' }[adapter];
    if (!existsSync(join(target, expected))) errors.push(`Adapter install ${adapter}: missing ${expected}`);
    if (adapter !== 'copilot') {
      const adapterText = readFileSync(join(target, expected), 'utf8');
      if (/\{stack\}|\{web\|native\}|\{greenfield \| legacy\}|\{Project Name\}/.test(adapterText)) errors.push(`Adapter install ${adapter}: unresolved known placeholder`);
      writeFileSync(join(target, expected), `${adapterText}\nLocal project context.\n`, 'utf8');
    }
    const sync = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', target, '--apply'], { cwd: root, encoding: 'utf8' });
    if (sync.status !== 0) errors.push(`Adapter sync ${adapter}: ${(sync.stderr || sync.stdout).trim()}`);
    else if (adapter !== 'copilot' && !readFileSync(join(target, expected), 'utf8').includes('Local project context.')) errors.push(`Adapter sync ${adapter}: local content was lost`);
  }

  const lifecycleTarget = join(generatedDir, 'module-lifecycle');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', lifecycleTarget, '--manifest', 'vue', '--mode', 'greenfield', '--apply'], { cwd: root, encoding: 'utf8' });
  configureProjectPolicy(lifecycleTarget);
  const addModule = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'forms', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addModule.status !== 0 || !existsSync(join(lifecycleTarget, 'standards/reference/forms.md'))) errors.push(`Module add failed: ${(addModule.stderr || addModule.stdout).trim()}`);
  else if (!readFileSync(join(lifecycleTarget, 'standards/core/rules.md'), 'utf8').includes('| Forms, inputs, validation | `forms` |')) errors.push('Module add did not restore its routing row');
  const removeModule = spawnSync(process.execPath, ['scripts/standards.mjs', 'remove-module', '--target', lifecycleTarget, '--module', 'forms', '--apply'], { cwd: root, encoding: 'utf8' });
  if (removeModule.status !== 0 || existsSync(join(lifecycleTarget, 'standards/reference/forms.md'))) errors.push(`Module remove failed: ${(removeModule.stderr || removeModule.stdout).trim()}`);
  const addI18n = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'i18n', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addI18n.status !== 0 || !existsSync(join(lifecycleTarget, 'standards/reference/i18n.md')) || !existsSync(join(lifecycleTarget, 'standards/core/optional/i18n.md'))) errors.push('i18n module did not install its complete bundle');
  const addPerf = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'perf', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addPerf.status !== 0 || !existsSync(join(lifecycleTarget, 'workflows/perf.md')) || !existsSync(join(lifecycleTarget, 'standards/reference/performance-web.md'))) errors.push('perf module did not install its complete bundle');
  const addPerformance = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'performance-web', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addPerformance.status !== 0) errors.push('Shared module dependency could not be independently tracked');
  const removePerf = spawnSync(process.execPath, ['scripts/standards.mjs', 'remove-module', '--target', lifecycleTarget, '--module', 'perf', '--apply'], { cwd: root, encoding: 'utf8' });
  if (removePerf.status !== 0 || existsSync(join(lifecycleTarget, 'workflows/perf.md')) || !existsSync(join(lifecycleTarget, 'standards/reference/performance-web.md'))) errors.push('Bundle removal did not preserve a shared dependency');
  const removeI18n = spawnSync(process.execPath, ['scripts/standards.mjs', 'remove-module', '--target', lifecycleTarget, '--module', 'i18n', '--apply'], { cwd: root, encoding: 'utf8' });
  if (removeI18n.status !== 0 || existsSync(join(lifecycleTarget, 'standards/reference/i18n.md')) || existsSync(join(lifecycleTarget, 'standards/core/optional/i18n.md'))) errors.push('Bundled module removal failed');

  const addFigma = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'figma', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addFigma.status !== 0 || !existsSync(join(lifecycleTarget, 'integrations/figma/rules.md')) || !existsSync(join(lifecycleTarget, 'workflows/design-to-code.md'))) errors.push('Figma capability module installation failed');
  const addJira = spawnSync(process.execPath, ['scripts/standards.mjs', 'add-module', '--target', lifecycleTarget, '--module', 'jira', '--apply'], { cwd: root, encoding: 'utf8' });
  if (addJira.status !== 0 || !existsSync(join(lifecycleTarget, 'integrations/jira/rules.md')) || !existsSync(join(lifecycleTarget, 'workflows/ticket-to-code.md'))) errors.push('Jira capability module installation failed');

  const failedSyncTarget = join(generatedDir, 'failed-sync-state');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', failedSyncTarget, '--manifest', 'vue', '--mode', 'legacy', '--apply'], { cwd: root, encoding: 'utf8' });
  const failedSyncShared = join(failedSyncTarget, 'standards/reference/typescript.md');
  writeFileSync(failedSyncShared, `${readFileSync(failedSyncShared, 'utf8')}\nlocal edit\n`, 'utf8');
  const failedSyncPolicy = readFileSync(join(failedSyncTarget, 'standards/project.json'), 'utf8');
  const failedSyncLock = readFileSync(join(failedSyncTarget, 'standards/install-lock.json'), 'utf8');
  const refusedSync = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', failedSyncTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  if (refusedSync.status === 0 || readFileSync(join(failedSyncTarget, 'standards/project.json'), 'utf8') !== failedSyncPolicy || readFileSync(join(failedSyncTarget, 'standards/install-lock.json'), 'utf8') !== failedSyncLock) errors.push('Refused sync changed policy or lock state');

  const uninstallTarget = join(generatedDir, 'uninstall-safety');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', uninstallTarget, '--manifest', 'vue', '--mode', 'legacy', '--apply'], { cwd: root, encoding: 'utf8' });
  writeFileSync(join(uninstallTarget, 'unrelated.txt'), 'keep', 'utf8');
  const modifiedManaged = join(uninstallTarget, 'standards/reference/typescript.md');
  writeFileSync(modifiedManaged, `${readFileSync(modifiedManaged, 'utf8')}\nkeep local\n`, 'utf8');
  const uninstall = spawnSync(process.execPath, ['scripts/standards.mjs', 'uninstall', '--target', uninstallTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  if (uninstall.status !== 0 || !existsSync(join(uninstallTarget, 'unrelated.txt')) || !existsSync(modifiedManaged) || !existsSync(join(uninstallTarget, 'standards/project.json')) || !existsSync(join(uninstallTarget, 'standards/execution.json')) || existsSync(join(uninstallTarget, 'standards/core/guardrails.md'))) errors.push('Uninstall did not preserve local/project files or remove only unmodified managed files');

  // A UTF-8 BOM must not break the policy read. Windows PowerShell writes one
  // with `Set-Content -Encoding utf8`, and the resulting parse error names an
  // invisible character, which is close to undiagnosable.
  const bomPolicyPath = join(lifecycleTarget, 'standards/project.json');
  const bomOriginal = readFileSync(bomPolicyPath, 'utf8');
  writeFileSync(bomPolicyPath, `﻿${bomOriginal}`, 'utf8');
  const bomCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', lifecycleTarget], { cwd: root, encoding: 'utf8' });
  if (bomCheck.status !== 0) errors.push(`Installer check rejects a policy file with a UTF-8 BOM: ${(bomCheck.stderr || bomCheck.stdout).trim().split('\n')[0]}`);
  writeFileSync(bomPolicyPath, bomOriginal, 'utf8');

  const invalidPolicyPath = join(lifecycleTarget, 'standards/project.json');
  const invalidPolicy = JSON.parse(readFileSync(invalidPolicyPath, 'utf8'));
  invalidPolicy.limits.componentReviewLines = 0;
  writeFileSync(invalidPolicyPath, JSON.stringify(invalidPolicy), 'utf8');
  const invalidCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', lifecycleTarget], { cwd: root, encoding: 'utf8' });
  if (invalidCheck.status === 0) errors.push('Installer check accepts a schema-invalid project policy');
  writeFileSync(invalidPolicyPath, bomOriginal, 'utf8');
  const invalidExecutionPath = join(lifecycleTarget, 'standards/execution.json');
  const validExecution = readFileSync(invalidExecutionPath, 'utf8');
  const invalidExecution = JSON.parse(validExecution);
  invalidExecution.commands.lint = { executable: process.execPath, args: [42] };
  writeFileSync(invalidExecutionPath, JSON.stringify(invalidExecution), 'utf8');
  const invalidExecutionCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', lifecycleTarget], { cwd: root, encoding: 'utf8' });
  if (invalidExecutionCheck.status === 0) errors.push('Installer check accepts an unsafe structured execution command');
  writeFileSync(invalidExecutionPath, validExecution, 'utf8');

  const existingTarget = join(generatedDir, 'existing-adapter');
  mkdirSync(join(existingTarget, '.claude'), { recursive: true });
  writeFileSync(join(existingTarget, 'CLAUDE.md'), '# Existing instructions\nKeep this.\n\n## Project specifics\nLocal details.\n', 'utf8');
  writeFileSync(join(existingTarget, '.claude/settings.json'), '{"existing":true}\n', 'utf8');
  const existingInstall = spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', existingTarget, '--manifest', 'vue', '--mode', 'legacy', '--adapter', 'claude', '--apply'], { cwd: root, encoding: 'utf8' });
  if (existingInstall.status === 0) configureProjectPolicy(existingTarget);
  if (existingInstall.status !== 0) errors.push(`Existing adapter adoption failed: ${(existingInstall.stderr || existingInstall.stdout).trim()}`);
  else {
    if (!readFileSync(join(existingTarget, 'CLAUDE.md'), 'utf8').includes('Keep this.')) errors.push('Existing adapter content before Project specifics was deleted');
    const mergedSettings = JSON.parse(readFileSync(join(existingTarget, '.claude/settings.json'), 'utf8'));
    if (mergedSettings.existing !== true || !mergedSettings.permissions?.deny?.length || !mergedSettings.hooks?.PreToolUse?.length) errors.push('Existing tool settings were not safely merged');
  }
  const managedPath = join(existingTarget, 'CLAUDE.md');
  writeFileSync(managedPath, readFileSync(managedPath, 'utf8').replace('<!-- ai-workflow-fe:start -->', '<!-- removed -->'), 'utf8');
  const missingManagedCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', existingTarget], { cwd: root, encoding: 'utf8' });
  if (missingManagedCheck.status === 0) errors.push('Installer check accepts a missing managed adapter block');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', existingTarget, '--apply'], { cwd: root, encoding: 'utf8' });

  const settingsPath = join(existingTarget, '.claude/settings.json');
  const weakenedSettings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  weakenedSettings.permissions.deny = [];
  writeFileSync(settingsPath, JSON.stringify(weakenedSettings), 'utf8');
  const weakenedSettingsCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', existingTarget], { cwd: root, encoding: 'utf8' });
  if (weakenedSettingsCheck.status === 0) errors.push('Installer check accepts missing Claude protections');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', existingTarget, '--apply'], { cwd: root, encoding: 'utf8' });

  const partialTarget = join(generatedDir, 'partial-adapter');
  mkdirSync(join(partialTarget, '.claude/hooks'), { recursive: true });
  writeFileSync(join(partialTarget, '.claude/hooks/typecheck.mjs'), '// existing incompatible hook\n', 'utf8');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', partialTarget, '--manifest', 'vue', '--mode', 'legacy', '--adapter', 'claude', '--apply'], { cwd: root, encoding: 'utf8' });
  configureProjectPolicy(partialTarget);
  const partialCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', partialTarget], { cwd: root, encoding: 'utf8' });
  if (partialCheck.status === 0) errors.push('Partial adapter installation is not reported');
  cpSync(join(root, 'adapters/claude/hooks/typecheck.mjs'), join(partialTarget, '.claude/hooks/typecheck.mjs'));
  spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', partialTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  const recoveredPartialCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', partialTarget], { cwd: root, encoding: 'utf8' });
  if (recoveredPartialCheck.status !== 0) errors.push('Resolved partial adapter state did not self-heal');

  const staleCopilotTarget = join(generatedDir, 'adapter-copilot');
  const stalePolicyPath = join(staleCopilotTarget, 'standards/project.json');
  const stalePolicy = JSON.parse(readFileSync(stalePolicyPath, 'utf8'));
  stalePolicy.limits.componentReviewLines += 1;
  writeFileSync(stalePolicyPath, JSON.stringify(stalePolicy), 'utf8');
  const staleCopilotCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', staleCopilotTarget], { cwd: root, encoding: 'utf8' });
  if (staleCopilotCheck.status === 0) errors.push('Installer check accepts stale generated Copilot policy');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', staleCopilotTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  const upgradePolicy = JSON.parse(readFileSync(stalePolicyPath, 'utf8'));
  upgradePolicy.standardsVersion = '0.0.1';
  writeFileSync(stalePolicyPath, JSON.stringify(upgradePolicy), 'utf8');
  const upgradeMarkerPath = join(staleCopilotTarget, 'standards/standards.json');
  const upgradeMarker = JSON.parse(readFileSync(upgradeMarkerPath, 'utf8'));
  upgradeMarker.version = '0.0.1';
  writeFileSync(upgradeMarkerPath, JSON.stringify(upgradeMarker), 'utf8');
  const upgradeLockPath = join(staleCopilotTarget, 'standards/install-lock.json');
  const upgradeLock = JSON.parse(readFileSync(upgradeLockPath, 'utf8'));
  upgradeLock.standardsVersion = '0.0.1';
  upgradeLock.files['standards/standards.json'].installedHash = createHash('sha256').update(readFileSync(upgradeMarkerPath)).digest('hex');
  upgradeLock.files['standards/standards.json'].sourceHash = 'simulated-old-source';
  writeFileSync(upgradeLockPath, JSON.stringify(upgradeLock), 'utf8');
  const upgradeSync = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', staleCopilotTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  const upgradedCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', staleCopilotTarget], { cwd: root, encoding: 'utf8' });
  if (upgradeSync.status !== 0 || upgradedCheck.status !== 0) errors.push('Copilot is stale after a standards-version upgrade sync');

  const legacyExecutionTarget = join(generatedDir, 'legacy-execution-migration');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', legacyExecutionTarget, '--manifest', 'vue', '--mode', 'legacy', '--apply'], { cwd: root, encoding: 'utf8' });
  rmSync(join(legacyExecutionTarget, 'standards/execution.json'));
  const legacyExecutionPolicyPath = join(legacyExecutionTarget, 'standards/project.json');
  const legacyExecutionPolicy = JSON.parse(readFileSync(legacyExecutionPolicyPath, 'utf8'));
  delete legacyExecutionPolicy.integrations;
  legacyExecutionPolicy.commands = { lint: 'npm run lint', typecheck: null, test: null, coverage: null, build: null, format: null };
  writeFileSync(legacyExecutionPolicyPath, JSON.stringify(legacyExecutionPolicy), 'utf8');
  const executionMigration = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', legacyExecutionTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  const migratedExecution = JSON.parse(readFileSync(join(legacyExecutionTarget, 'standards/execution.json'), 'utf8'));
  const migratedPolicy = JSON.parse(readFileSync(legacyExecutionPolicyPath, 'utf8'));
  if (executionMigration.status !== 0 || migratedExecution.commands.lint !== 'npm run lint' || 'commands' in migratedPolicy || !migratedPolicy.integrations) errors.push('Sync did not safely migrate legacy project commands into trusted execution configuration');

  const migrationTarget = join(generatedDir, 'adapter-cursor');
  const migrationLockPath = join(migrationTarget, 'standards/install-lock.json');
  const migrationLock = JSON.parse(readFileSync(migrationLockPath, 'utf8'));
  const migrationFile = 'standards/reference/definition-of-done.md';
  delete migrationLock.files[migrationFile];
  writeFileSync(migrationLockPath, JSON.stringify(migrationLock), 'utf8');
  rmSync(join(migrationTarget, migrationFile));
  const migrationSync = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', migrationTarget, '--apply'], { cwd: root, encoding: 'utf8' });
  if (migrationSync.status !== 0 || !existsSync(join(migrationTarget, migrationFile))) errors.push('Sync did not reconcile a newly required manifest file');
  const obsoletePath = 'standards/reference/forms.md';
  cpSync(join(root, obsoletePath), join(migrationTarget, obsoletePath));
  migrationLock.files[obsoletePath] = { source: obsoletePath, sourceHash: 'test', installedHash: createHash('sha256').update(readFileSync(join(migrationTarget, obsoletePath))).digest('hex') };
  writeFileSync(migrationLockPath, JSON.stringify(migrationLock), 'utf8');
  const removeObsolete = spawnSync(process.execPath, ['scripts/standards.mjs', 'sync', '--target', migrationTarget, '--remove-obsolete', '--apply'], { cwd: root, encoding: 'utf8' });
  if (removeObsolete.status !== 0 || existsSync(join(migrationTarget, obsoletePath))) errors.push('Safe obsolete-file removal failed');

  const incompleteTarget = join(generatedDir, 'incomplete-greenfield');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', incompleteTarget, '--manifest', 'vue', '--mode', 'greenfield', '--apply'], { cwd: root, encoding: 'utf8' });
  const incompleteCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', incompleteTarget], { cwd: root, encoding: 'utf8' });
  if (incompleteCheck.status === 0 || !incompleteCheck.stderr.includes('greenfield execution commands.lint') || !incompleteCheck.stderr.includes('greenfield stack.styling')) errors.push('Greenfield check accepts incomplete commands or stack choices');

  const incompleteLegacyTarget = join(generatedDir, 'incomplete-legacy-coverage');
  spawnSync(process.execPath, ['scripts/standards.mjs', 'install', '--target', incompleteLegacyTarget, '--manifest', 'vue', '--mode', 'legacy', '--apply'], { cwd: root, encoding: 'utf8' });
  const incompleteLegacyCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', incompleteLegacyTarget], { cwd: root, encoding: 'utf8' });
  if (incompleteLegacyCheck.status === 0 || !incompleteLegacyCheck.stderr.includes('requires execution commands.coverage')) errors.push('Check accepts active coverage policy without a coverage command');

  const hookTarget = join(generatedDir, 'hook-failures');
  mkdirSync(join(hookTarget, 'standards'), { recursive: true });
  writeFileSync(join(hookTarget, 'standards/execution.json'), JSON.stringify({ commands: { lint: { executable: process.execPath, args: ['-e', 'process.exit(7)'] }, typecheck: { executable: process.execPath, args: ['-e', 'process.exit(8)'] } } }), 'utf8');
  const lintHook = spawnSync(process.execPath, [join(root, 'adapters/claude/hooks/check-changed.mjs')], { cwd: hookTarget, encoding: 'utf8' });
  if (lintHook.status === 0) errors.push('Claude post-edit lint hook does not propagate failure');
  const typecheckHook = spawnSync(process.execPath, [join(root, 'adapters/claude/hooks/typecheck.mjs')], { cwd: hookTarget, encoding: 'utf8' });
  if (typecheckHook.status === 0) errors.push('Claude typecheck hook does not propagate failure');
  writeFileSync(join(hookTarget, 'standards/execution.json'), '{ malformed', 'utf8');
  const malformedTypecheck = spawnSync(process.execPath, [join(root, 'adapters/claude/hooks/typecheck.mjs')], { cwd: hookTarget, encoding: 'utf8' });
  if (malformedTypecheck.status === 0) errors.push('Claude typecheck hook accepts malformed execution policy');

  const integrityTarget = join(generatedDir, 'adapter-codex');
  const sharedPath = join(integrityTarget, 'standards/reference/typescript.md');
  writeFileSync(sharedPath, `${readFileSync(sharedPath, 'utf8')}\nmodified\n`, 'utf8');
  const integrityCheck = spawnSync(process.execPath, ['scripts/standards.mjs', 'check', '--target', integrityTarget], { cwd: root, encoding: 'utf8' });
  if (integrityCheck.status === 0) errors.push('Installer check accepts a modified tracked shared file');
} finally {
  rmSync(generatedDir, { recursive: true, force: true });
}

const stagedPolicy = spawnSync(process.execPath, ['enforcement/hooks/guard-staged.mjs', 'standards/project.json'], { cwd: root, encoding: 'utf8' });
if (stagedPolicy.status !== 0) errors.push('guard-staged blocks editable standards/project.json');
const stagedExecution = spawnSync(process.execPath, ['enforcement/hooks/guard-staged.mjs', 'standards/execution.json'], { cwd: root, encoding: 'utf8' });
if (stagedExecution.status === 0) errors.push('guard-staged allows trusted standards/execution.json edits');
const stagedShared = spawnSync(process.execPath, ['enforcement/hooks/guard-staged.mjs', 'standards/core/rules.md'], { cwd: root, encoding: 'utf8' });
if (stagedShared.status === 0) errors.push('guard-staged allows shared standards edits');

const claudePolicy = spawnSync(process.execPath, ['adapters/claude/hooks/guard-paths.mjs'], { cwd: root, encoding: 'utf8', input: JSON.stringify({ tool_input: { file_path: 'standards/project.json' } }) });
if (claudePolicy.status !== 0) errors.push('Claude guard blocks editable standards/project.json');
const claudeExecution = spawnSync(process.execPath, ['adapters/claude/hooks/guard-paths.mjs'], { cwd: root, encoding: 'utf8', input: JSON.stringify({ tool_input: { file_path: 'standards/execution.json' } }) });
if (claudeExecution.status === 0) errors.push('Claude guard allows trusted standards/execution.json edits');
const claudeShared = spawnSync(process.execPath, ['adapters/claude/hooks/guard-paths.mjs'], { cwd: root, encoding: 'utf8', input: JSON.stringify({ tool_input: { file_path: 'standards/core/rules.md' } }) });
if (claudeShared.status === 0) errors.push('Claude guard allows shared standards edits');

if (errors.length) {
  console.error(`Validation failed (${errors.length}):\n${errors.map((x) => `- ${x}`).join('\n')}`);
  process.exit(1);
}
console.log(`${integrationMode ? 'Integration validation' : 'Validated'} ${presets.length} presets, ${manifests.length} manifests, and repository invariants.`);
