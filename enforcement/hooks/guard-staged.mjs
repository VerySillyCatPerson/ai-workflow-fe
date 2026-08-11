#!/usr/bin/env node
/**
 * Pre-commit guard — blocks staged files that must never be committed by hand.
 *
 * The tool-agnostic twin of the guard script each tool adapter ships. Those stop
 * one agent at edit time; this stops every agent AND every human at the commit
 * boundary when the consuming project has installed it. It is a local check,
 * not a universal CI backstop.
 *
 * Usage (lefthook passes staged paths): node guard-staged.mjs <paths...>
 * Exit 1 blocks the commit.
 */

const PROTECTED = [
  {
    test: /(^|[/\\])\.env(\.|$)/,
    // .env.example is the documented place for variable names.
    allow: /\.env\.example$/,
    reason: 'Credential file — standards/core/guardrails.md. Use .env.example instead.',
  },
  {
    test: /\.(pem|key|p12|keystore|jks)$/i,
    reason: 'Credential material — standards/core/guardrails.md.',
  },
  {
    test: /(^|[/\\])standards[/\\]/,
    allow: /(^|[/\\])standards[/\\](?:project|execution)\.json$/,
    reason:
      'Shared standards are read-only in a consuming project. A local edit is lost on ' +
      'the next sync and invisible to other teams. Record the deviation under Project ' +
      'specifics in your agent instruction file (adoption/governance.md), or raise a ' +
      'change against the standards repo.',
  },
  {
    test: /(^|[/\\])standards[/\\]execution\.json$/,
    reason: 'Trusted executable configuration. Review and stage it only with explicit human approval.',
  },
];

const files = process.argv.slice(2).filter(Boolean);
const violations = [];

for (const file of files) {
  const hit = PROTECTED.find((p) => p.test.test(file) && !(p.allow && p.allow.test(file)));
  if (hit) violations.push(`  ${file}\n    ${hit.reason}`);
}

if (violations.length) {
  console.error(`\nBlocked ${violations.length} staged file(s):\n\n${violations.join('\n\n')}\n`);
  console.error('Unstage them and resolve the policy violation; do not bypass the hook.\n');
  process.exit(1);
}
