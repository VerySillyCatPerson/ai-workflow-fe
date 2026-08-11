#!/usr/bin/env node
/**
 * PreToolUse hook — blocks writes to paths that must never be edited directly.
 *
 * Enforces rules that are otherwise only prose:
 *   - core/guardrails.md      never open or write a credential file
 *   - api-contracts.md        never hand-edit generated output
 *   - adoption/governance.md  never edit shared standards locally; deviations go in project.json
 *
 * Exit 0 = allow. Exit 2 = block, and stderr is fed back to the model so it
 * learns why rather than retrying.
 */

const PROTECTED = [
  {
    test: /(^|[\\/])\.env(\.|$)/,
    reason:
      'Credential file. core/guardrails.md forbids reading or writing these. ' +
      'Add the variable to .env.example instead, and ask the user for the value.',
  },
  {
    test: /\.(generated|gen)\.[a-z]+$/i,
    reason:
      'Generated file. reference/api-contracts.md: regenerate from the spec ' +
      'using the project command declared for API generation — never hand-edit the output.',
  },
  {
    test: /(^|[\\/])standards[\\/]/,
    allow: /(^|[\\/])standards[\\/](?:project|execution)\.json$/,
    reason:
      'Shared standards are read-only in a consuming project. A local edit is ' +
      'destroyed by the next /standards-sync and is invisible to other teams. ' +
      'Record the deviation in standards/project.json ' +
      '(see adoption/governance.md), or raise a change against the standards repo.',
  },
  {
    test: /(^|[\\/])standards[\\/]execution\.json$/,
    reason: 'Trusted executable configuration. Changes require explicit human approval; do not edit it as project policy.',
  },
  {
    test: /\.(pem|key|p12|keystore|jks)$/i,
    reason: 'Credential material. core/guardrails.md forbids access.',
  },
];

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let path = '';
  try {
    path = JSON.parse(raw)?.tool_input?.file_path ?? '';
  } catch {
    process.exit(0); // Unparseable input is not a reason to block the user's work.
  }

  const hit = PROTECTED.find((p) => p.test.test(path) && !(p.allow && p.allow.test(path)));
  if (hit) {
    console.error(`Blocked write to ${path}\n\n${hit.reason}`);
    process.exit(2);
  }
  process.exit(0);
});
