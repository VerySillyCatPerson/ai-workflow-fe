export function moduleEntries(manifest) {
  const entries = new Map();
  for (const path of [...Object.keys(manifest.resident_optional ?? {}), ...Object.keys(manifest.reference?.optional ?? {}), ...Object.keys(manifest.commands?.optional ?? {})]) {
    const name = path.split('/').pop().replace(/\.md$/, '');
    entries.set(name, [...(entries.get(name) ?? []), path]);
  }
  if (entries.has('perf')) {
    const performance = manifest.platform === 'native' ? 'standards/reference/performance-native.md' : 'standards/reference/performance-web.md';
    entries.set('perf', [...entries.get('perf'), performance]);
  }
  if (entries.has('api-types')) entries.set('api-types', [...entries.get('api-types'), 'standards/reference/api-contracts.md']);
  entries.set('figma', ['integrations/figma/rules.md', 'integrations/figma/workflows.md', 'workflows/design-to-code.md', 'workflows/ticket-design-to-code.md']);
  entries.set('jira', ['integrations/jira/rules.md', 'integrations/jira/workflows.md', 'workflows/ticket-to-code.md', 'workflows/ticket-design-to-code.md']);
  return entries;
}
