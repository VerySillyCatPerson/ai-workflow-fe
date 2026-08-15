import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';

const extensions = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx', '.vue']);
const ignored = new Set(['.git', '.ai', 'node_modules', 'dist', 'build', 'coverage', 'vendor', 'generated', '.next', '.nuxt', 'out']);
const option = (args, name) => { const at = args.indexOf(`--${name}`); return at >= 0 ? args[at + 1] : null; };

function files(root, dir = root) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isSymbolicLink() || ignored.has(entry.name) || entry.name.startsWith('.env') || /credential|secret/i.test(entry.name)) return [];
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) return files(root, absolute);
    return extensions.has(extname(entry.name)) ? [absolute] : [];
  });
}

const kindOf = (name, declaration, file) => {
  if (/^use[A-Z0-9]/.test(name)) return 'hook';
  if (/store/i.test(name)) return 'store';
  if (/service|api$/i.test(name)) return 'service';
  if (/schema/i.test(name)) return 'schema';
  if (/route|page\.(t|j)sx?$/.test(file)) return 'route';
  if (declaration === 'class') return 'class';
  if (declaration === 'type' || declaration === 'interface' || declaration === 'enum') return 'type';
  if (/^[A-Z]/.test(name) && /\.(jsx|tsx|vue)$/.test(file)) return 'component';
  return declaration === 'function' ? 'function' : 'utility';
};

function parseFile(root, absolute) {
  const file = relative(root, absolute).replaceAll('\\', '/');
  const text = readFileSync(absolute, 'utf8');
  const imports = [];
  for (const match of text.matchAll(/(?:import\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?|export\s+[^'";]+?\s+from\s+|require\s*\()(['"])([^'"]+)\1/g)) imports.push(match[2]);
  for (const match of text.matchAll(/import\s*\(\s*(['"])([^'"]+)\1\s*\)/g)) imports.push(match[2]);
  const reexports = [...text.matchAll(/export\s+(?:\*|\{[^}]+\})\s+from\s+(['"])([^'"]+)\1/g)].map((match) => match[2]);
  const symbols = [];
  const seen = new Set();
  const add = (name, declaration, exported = true) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    symbols.push({ symbol: name, kind: kindOf(name, declaration, file), file, exports: exported, imports: [...new Set(imports)].sort(), usedBy: [] });
  };
  for (const match of text.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g)) add(match[2], match[1]);
  for (const match of text.matchAll(/export\s*\{([^}]+)\}/g)) for (const item of match[1].split(',')) add((item.trim().split(/\s+as\s+/).pop() ?? '').trim(), 'const');
  if (/export\s+default\s+(?!async\s+(?:function|class)|(?:function|class)\s+[A-Za-z_$])/.test(text)) add(basename(file, extname(file)), 'const');
  return { file, hash: createHash('sha256').update(text).digest('hex'), imports: [...new Set(imports)].sort(), reexports: [...new Set(reexports)].sort(), symbols };
}

export function buildCodeMap(target) {
  const records = files(target).sort().map((file) => parseFile(target, file));
  const symbols = records.flatMap((record) => record.symbols);
  const byFile = new Map(records.map((record) => [record.file.replace(/\.(?:[cm]?[jt]sx?|vue)$/, '').replace(/\/index$/, ''), record]));
  for (const consumer of records) for (const imported of consumer.imports) {
    if (!imported.startsWith('.')) continue;
    const resolved = join(dirname(consumer.file), imported).replaceAll('\\', '/').replace(/\.(?:[cm]?[jt]sx?|vue)$/, '').replace(/\/index$/, '');
    const provider = byFile.get(resolved);
    for (const symbol of provider?.symbols ?? []) symbol.usedBy.push(consumer.file);
  }
  for (const symbol of symbols) symbol.usedBy = [...new Set(symbol.usedBy)].sort();
  return { schemaVersion: 1, generatedBy: 'ai-workflow-fe', files: records.map(({ file, hash, imports, reexports }) => ({ file, hash, imports, reexports })), symbols };
}

export async function runCodeMap({ target, args }) {
  const command = args[0];
  const path = join(target, '.ai', 'code-map.json');
  if (command === 'build') {
    const map = buildCodeMap(target);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${JSON.stringify(map, null, 2)}\n`, 'utf8');
    console.log(`Built Code Map: ${map.files.length} files, ${map.symbols.length} symbols.`);
    return;
  }
  if (!existsSync(path)) throw new Error('Code Map is missing; run map build first.');
  const stored = JSON.parse(readFileSync(path, 'utf8'));
  if (command === 'check') {
    const current = buildCodeMap(target);
    if (JSON.stringify(current.files) !== JSON.stringify(stored.files)) throw new Error('Code Map is stale; run map build.');
    console.log('Code Map is current.');
    return;
  }
  if (command === 'find') {
    const positional = [];
    for (let index = 1; index < args.length; index += 1) {
      if (args[index].startsWith('--')) { index += 1; continue; }
      positional.push(args[index]);
    }
    const query = (option(args, 'query') ?? positional.join(' ')).trim().toLowerCase();
    if (!query) throw new Error('map find requires a search query.');
    const terms = query.split(/\s+/);
    const matches = stored.symbols.filter((item) => {
      const words = item.symbol.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
      const searchable = `${item.symbol} ${words} ${item.kind} ${item.file}`.toLowerCase();
      return terms.every((term) => searchable.includes(term));
    }).slice(0, 20);
    for (const item of matches) console.log(`${item.symbol}\n  ${item.kind}\n  ${item.file}${item.usedBy.length ? `\n  used by: ${item.usedBy.join(', ')}` : ''}${item.imports.length ? `\n  imports: ${item.imports.join(', ')}` : ''}`);
    if (!matches.length) console.log('No matching symbols.');
    return;
  }
  throw new Error('Usage: map <build|find|check> --target <project> [query]');
}
