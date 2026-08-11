#!/usr/bin/env node
/** Flatten resident standards and resolved policy for Copilot. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function generateCopilot({ stack, platform, root = 'standards', out = '.github/copilot-instructions.md', policyPath = `${root}/project.json`, i18n = false }) {
  if (!stack || !platform) throw new Error('stack and platform are required');
  const sources = [`${root}/core/guardrails.md`, `${root}/core/rules.md`, `${root}/platform/${platform}.md`, `${root}/framework/${stack}.md`];
  const optional = `${root}/core/optional/i18n.md`;
  if (i18n) {
    if (!existsSync(optional)) throw new Error(`Missing optional source: ${optional}`);
    sources.push(optional);
  }
  const missing = sources.filter((path) => !existsSync(path));
  if (missing.length) throw new Error(`Missing source files:\n  ${missing.join('\n  ')}`);
  if (!existsSync(policyPath)) throw new Error(`Missing project policy: ${policyPath}\nCopilot cannot read it on demand, so generation refuses unresolved policy.`);

  let policy;
  // Tolerate a UTF-8 BOM; PowerShell writes one and the parse error is opaque.
  try { policy = JSON.parse(readFileSync(policyPath, 'utf8').replace(/^﻿/, '')); }
  catch (error) { throw new Error(`Invalid project policy ${policyPath}: ${error.message}`); }
  if (policy.framework === 'unset' || policy.platform === 'unset') throw new Error(`Unresolved project policy ${policyPath}: framework/platform must be configured.`);
  if (policy.framework !== stack || policy.platform !== platform) throw new Error(`Policy mismatch: requested ${stack}/${platform}, policy is ${policy.framework}/${policy.platform}.`);

  let version = 'unknown';
  try {
    const marker = existsSync(`${root}/standards.json`) ? `${root}/standards.json` : resolve(root, '..', 'standards.json');
    version = JSON.parse(readFileSync(marker, 'utf8').replace(/^﻿/, '')).version ?? 'unknown';
  } catch { /* informational */ }

  const header = `<!--
  GENERATED - do not edit by hand.
  Source: standards/ v${version} (stack: ${stack}, platform: ${platform})
  Regenerate from the standards source repository: node scripts/standards.mjs sync --target <this-project> --apply

  This is the RESIDENT tier only. standards/reference/* is not inlined - Copilot
  cannot read files on demand, and inlining it would bury these rules.
-->

# ${stack} / ${platform} engineering standards

## Effective project policy

This resolved policy is authoritative for thresholds, strictness, stack choices,
integrations, and deviations. Executable commands remain separately protected
in standards/execution.json and are not inlined. The policy is inlined because this adapter cannot read
standards/project.json on demand.

\`\`\`json
${JSON.stringify(policy, null, 2)}
\`\`\`

`;
  const body = sources.map((path) => `<!-- ${path} -->\n\n${readFileSync(path, 'utf8').trim()}`).join('\n\n---\n\n');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${header}${body}\n`, 'utf8');
  return { out, sources: sources.length, tokens: Math.round((header.length + body.length) / 4), version };
}

function option(args, name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  try {
    const root = option(args, 'root', 'standards');
    const result = generateCopilot({ stack: option(args, 'stack'), platform: option(args, 'platform'), root, out: option(args, 'out', '.github/copilot-instructions.md'), policyPath: option(args, 'policy', `${root}/project.json`), i18n: args.includes('--i18n') });
    console.log(`Wrote ${result.out} from ${result.sources} files plus resolved policy (~${result.tokens} tokens).`);
    if (result.version === 'unknown') console.warn('Warning: no standards.json found - the output carries no version marker.');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
