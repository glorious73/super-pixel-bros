// i18n linter — run with: node tools/check-i18n.mjs
// Rules:
//  I1  en and ar tables have identical key sets
//  I2  no empty translations
//  I3  every t('key') / drawX-referenced key in js/ exists in en (and thus ar)
//  I4  hero.<id>.* keys exist for every character id
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const jsDir = join(here, '..', 'js');

const src = readFileSync(join(jsDir, 'i18n.js'), 'utf8');
function grab(varName) {
  const start = src.indexOf(`const ${varName} = {`);
  const end = src.indexOf('\n};', start);
  return src.slice(start, end);
}
const keysIn = (block) => {
  const out = new Set();
  for (const m of block.matchAll(/'([a-z0-9_.]+)'\s*:/gi)) out.add(m[1]);
  return out;
};
const en = keysIn(grab('EN'));
const ar = keysIn(grab('AR'));

let fails = 0;
const fail = (m) => { fails++; console.log('  FAIL ' + m); };

// I1
for (const k of en) if (!ar.has(k)) fail(`I1 ar table missing key "${k}"`);
for (const k of ar) if (!en.has(k)) fail(`I1 en table missing key "${k}"`);

// I2: empty values
for (const m of src.matchAll(/'([a-z0-9_.]+)'\s*:\s*('')/gi)) {
  fail(`I2 empty translation for "${m[1]}"`);
}

// I3: t('key') usages resolve
const usedKeys = new Set();
for (const file of readdirSync(jsDir)) {
  if (!file.endsWith('.js') || file === 'i18n.js') continue;
  const code = readFileSync(join(jsDir, file), 'utf8');
  for (const m of code.matchAll(/\bt\(\s*'([a-z0-9_.]+)'/gi)) usedKeys.add(m[1]);
  // template-literal keys like t(`hero.${ch.id}.blurb`) -> check the pattern
  for (const m of code.matchAll(/t\(`hero\.\$\{[^}]+\}\.(\w+)`\)/gi)) {
    usedKeys.add('__hero_pattern__' + m[1]);
  }
}
for (const k of usedKeys) {
  if (!k.startsWith('__hero_pattern__') && !en.has(k)) {
    fail(`I3 t('${k}') has no entry in en table`);
  }
}

// I4: every character has name + blurb in en
const ent = readFileSync(join(jsDir, 'entities.js'), 'utf8');
const ids = [...ent.matchAll(/id:\s*'([a-z]+)'/gi)].map((m) => m[1]);
for (const id of ids) {
  for (const suf of ['name', 'blurb']) {
    if (!en.has(`hero.${id}.${suf}`)) fail(`I4 en table missing hero.${id}.${suf} (character "${id}")`);
  }
}

console.log(`en keys: ${en.size}, ar keys: ${ar.size}, characters: ${ids.join(', ')}`);
console.log(fails ? `\n${fails} i18n problem(s) found` : '\ni18n tables consistent');
process.exit(fails ? 1 : 0);
