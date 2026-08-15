import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { dirname, join } from 'node:path';
import { moduleEntries } from './modules.mjs';

const valueOf = (args, name) => { const at = args.indexOf(`--${name}`); return at >= 0 ? args[at + 1] : null; };
const listOf = (value) => (value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const allowed = {
  manifest: ['react', 'nextjs', 'vue', 'angular', 'react-native'],
  mode: ['greenfield', 'legacy'],
  adapter: ['claude', 'codex', 'cursor', 'copilot', 'qwen', 'kimi'],
};

function inspectTarget(target) {
  const packagePath = join(target, 'package.json');
  if (!existsSync(packagePath)) return { mode: 'greenfield', manifest: 'react', packageJson: null };
  try {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
    const manifest = deps.next ? 'nextjs' : deps.vue ? 'vue' : deps['@angular/core'] ? 'angular' : deps['react-native'] ? 'react-native' : deps.react ? 'react' : 'react';
    return { mode: 'legacy', manifest, packageJson };
  } catch (error) {
    throw new Error(`Cannot inspect ${packagePath}: ${error.message}`);
  }
}

function detectPackageManager(target, packageJson) {
  const declared = packageJson?.packageManager?.split('@')[0];
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(declared)) return declared;
  for (const [file, manager] of [['pnpm-lock.yaml', 'pnpm'], ['yarn.lock', 'yarn'], ['bun.lock', 'bun'], ['bun.lockb', 'bun'], ['package-lock.json', 'npm']]) {
    if (existsSync(join(target, file))) return manager;
  }
  return 'npm';
}

const commandFor = (manager, command) => ({ executable: manager, args: ['run', command] });
const coverageCommandFor = (manager) => ({ executable: manager, args: ['run', 'test', '--', '--coverage'] });

function inferStack(packageJson) {
  const deps = { ...(packageJson?.dependencies ?? {}), ...(packageJson?.devDependencies ?? {}) };
  return {
    styling: deps.tailwindcss ? 'tailwind' : 'none',
    stateManagement: deps.zustand ? 'zustand' : deps.redux || deps['@reduxjs/toolkit'] ? 'redux' : 'none',
    serverState: deps['@tanstack/react-query'] || deps['@tanstack/vue-query'] ? 'tanstack-query' : 'none',
    unitTestRunner: deps.vitest ? 'vitest-vtl' : 'jest-rtl',
    e2eRunner: deps['@playwright/test'] ? 'playwright' : deps.cypress ? 'cypress' : 'none',
  };
}

async function choose(rl, label, choices, fallback) {
  const answer = (await rl.question(`${label} (${choices.join('/')}) [${fallback}]: `)).trim() || fallback;
  if (!choices.includes(answer)) throw new Error(`${label}: choose ${choices.join(', ')}`);
  return answer;
}

function run(source, argv, label) {
  const result = spawnSync(process.execPath, [join(source, 'scripts/standards.mjs'), ...argv], { cwd: source, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${label}: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout.trim();
}

export async function runWizard({ source, target, args }) {
  const detected = inspectTarget(target);
  const inferred = inferStack(detected.packageJson);
  const detectedPackageManager = detectPackageManager(target, detected.packageJson);
  const scripted = args.includes('--non-interactive');
  const rl = scripted ? null : createInterface({ input, output });
  try {
    const mode = valueOf(args, 'mode') ?? (scripted ? detected.mode : await choose(rl, 'Project mode', allowed.mode, detected.mode));
    const manifest = valueOf(args, 'manifest') ?? (scripted ? detected.manifest : await choose(rl, 'Framework', allowed.manifest, detected.manifest));
    const adapters = listOf(valueOf(args, 'adapter') ?? (scripted ? 'codex' : await rl.question('Agents, comma-separated (claude,codex,cursor,copilot,qwen,kimi) [codex]: ') || 'codex'));
    const modules = listOf(valueOf(args, 'modules') ?? (scripted ? '' : await rl.question('Optional modules, comma-separated (forms,api-types,i18n,figma,jira) [none]: ')));
    if (!allowed.mode.includes(mode)) throw new Error(`Unknown mode: ${mode}`);
    if (!allowed.manifest.includes(manifest)) throw new Error(`Unknown framework: ${manifest}`);
    for (const adapter of adapters) if (!allowed.adapter.includes(adapter)) throw new Error(`Unknown adapter: ${adapter}`);

    const manifestConfig = JSON.parse(readFileSync(join(source, 'manifests', `${manifest}.json`), 'utf8'));
    const detectedRunner = inferred.unitTestRunner;
    const runnerDefault = detectedRunner in (manifestConfig.runnerReferences ?? {}) ? detectedRunner : manifestConfig.runnerDefault;
    const unitTestRunner = valueOf(args, 'unit-test-runner') ?? (scripted ? runnerDefault : await choose(rl, 'Unit testing', Object.keys(manifestConfig.runnerReferences ?? {}), runnerDefault));
    const packageManager = valueOf(args, 'package-manager') ?? (scripted ? detectedPackageManager : await choose(rl, 'Package manager', ['npm', 'pnpm', 'yarn', 'bun'], detectedPackageManager));
    if (!['npm', 'pnpm', 'yarn', 'bun'].includes(packageManager)) throw new Error(`Unknown package manager: ${packageManager}`);
    const askStack = async (flag, label, fallback) => valueOf(args, flag) ?? (scripted ? fallback : (await rl.question(`${label} [${fallback}]: `)).trim() || fallback);
    const stack = {
      styling: await askStack('styling', 'Styling/component system (or project convention)', inferred.styling),
      stateManagement: await askStack('state-management', 'State management', inferred.stateManagement),
      serverState: await askStack('server-state', 'Server state/data fetching', inferred.serverState),
      unitTestRunner,
      e2eRunner: await askStack('e2e-runner', 'E2E testing', inferred.e2eRunner),
    };
    const availableModules = moduleEntries(manifestConfig);
    for (const name of modules) if (!availableModules.has(name)) throw new Error(`Unknown module for ${manifest}: ${name}. Choose: ${[...availableModules.keys()].join(', ')}`);
    const moduleFiles = [...new Set(modules.flatMap((name) => availableModules.get(name)))];
    const moduleConflicts = moduleFiles.filter((path) => existsSync(join(target, path)));
    const packageScripts = detected.packageJson?.scripts ?? {};
    const proposedCommands = {};
    for (const command of ['lint', 'typecheck', 'test', 'build']) {
      if (mode === 'greenfield' || packageScripts[command]) proposedCommands[command] = commandFor(packageManager, command);
    }
    if (mode === 'greenfield' || packageScripts.test) proposedCommands.coverage = coverageCommandFor(packageManager);
    const installArgs = ['install', '--target', target, '--manifest', manifest, '--mode', mode, '--adapter', adapters.join(','), '--unit-test-runner', stack.unitTestRunner, '--styling', stack.styling, '--state-management', stack.stateManagement, '--server-state', stack.serverState, '--e2e-runner', stack.e2eRunner];
    const basePlan = JSON.parse(run(source, [...installArgs, '--plan-json'], 'Installation preview failed'));
    const create = [...new Set([...basePlan.create, ...moduleFiles.filter((path) => !existsSync(join(target, path)))])].sort();
    const modify = [...new Set(basePlan.modify)].sort();
    const conflicts = [...new Set([...basePlan.conflicts, ...moduleConflicts])].sort();
    output.write(`\nPlan\n\nFramework: ${manifest}\nMode: ${mode}\nPackage manager: ${packageManager}\nModules: ${modules.length ? modules.join(', ') : 'core only'}\nAdapters: ${adapters.join(', ') || 'none'}\nStack: ${JSON.stringify(stack)}\nTrusted execution commands:\n${JSON.stringify(proposedCommands, null, 2)}\n\nFile changes: ${create.length} create, ${modify.length} modify, ${conflicts.length} conflict\n${create.map((path) => `+ ${path}`).join('\n')}${modify.length ? `\n${modify.map((path) => `~ ${path}`).join('\n')}` : ''}${conflicts.length ? `\n${conflicts.map((path) => `! ${path}`).join('\n')}` : ''}\n`);
    if (conflicts.length) throw new Error(`Refusing conflicts:\n${conflicts.map((path) => `- ${path}`).join('\n')}`);
    if (args.includes('--dry-run')) return;
    if (scripted && !args.includes('--yes')) throw new Error('Non-interactive setup requires --dry-run or --yes.');
    const confirmed = args.includes('--yes') || (await rl.question('\nApply? [y/N] ')).trim().toLowerCase() === 'y';
    if (!confirmed) { output.write('Cancelled; no files were changed.\n'); return; }
    const rollbackPaths = ['CLAUDE.md', 'AGENTS.md', 'QWEN.md', '.kimi/AGENTS.md', '.cursor/rules/standards.mdc', '.claude/settings.json', 'standards/project.json', 'standards/execution.json', 'standards/install-lock.json'];
    const targetExistedBeforeSetup = existsSync(target);
    const snapshots = new Map(rollbackPaths.map((path) => { const absolute = join(target, path); return [path, existsSync(absolute) ? readFileSync(absolute) : null]; }));
    try {
      run(source, [...installArgs, '--apply'], 'Installation failed');
      for (const moduleName of modules) run(source, ['add-module', '--target', target, '--module', moduleName, '--apply'], `Could not add ${moduleName}`);
      const policyPath = join(target, 'standards/project.json');
      const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
      for (const name of ['figma', 'jira']) if (modules.includes(name)) policy.integrations[name] = name === 'figma'
        ? { enabled: true, mode: 'read', componentMapping: false }
        : { enabled: true, projectKeys: listOf(valueOf(args, 'jira-projects')), write: 'confirm' };
      if (mode === 'legacy' && !packageScripts.test) policy.testing.coverage.mode = 'report-only';
      writeFileSync(policyPath, `${JSON.stringify(policy, null, 2)}\n`, 'utf8');
      const executionPath = join(target, 'standards/execution.json');
      const execution = JSON.parse(readFileSync(executionPath, 'utf8'));
      Object.assign(execution.commands, proposedCommands);
      writeFileSync(executionPath, `${JSON.stringify(execution, null, 2)}\n`, 'utf8');
      output.write(`${run(source, ['check', '--target', target], 'Generated configuration is invalid')}\n`);
    } catch (error) {
      const lockPath = join(target, 'standards/install-lock.json');
      const cleanupDirectories = new Set();
      if (existsSync(lockPath)) {
        try {
          const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
          for (const path of [...Object.keys(lock.files ?? {}), ...rollbackPaths]) {
            let directory = dirname(join(target, path));
            while (directory.length > target.length) { cleanupDirectories.add(directory); directory = dirname(directory); }
          }
        } catch {}
        spawnSync(process.execPath, [join(source, 'scripts/standards.mjs'), 'uninstall', '--target', target, '--apply'], { cwd: source, encoding: 'utf8' });
      }
      for (const [path, snapshot] of snapshots) {
        const absolute = join(target, path);
        if (snapshot === null) { if (existsSync(absolute)) rmSync(absolute); }
        else { mkdirSync(dirname(absolute), { recursive: true }); writeFileSync(absolute, snapshot); }
      }
      for (const directory of [...cleanupDirectories].sort((a, b) => b.length - a.length)) if (existsSync(directory)) { try { rmSync(directory, { recursive: false }); } catch {} }
      if (!targetExistedBeforeSetup && existsSync(target)) { try { rmSync(target, { recursive: false }); } catch {} }
      throw new Error(`Setup rolled back: ${error.message}`);
    }
  } finally {
    rl?.close();
  }
}
