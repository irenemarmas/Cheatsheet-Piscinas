#!/usr/bin/env node
/**
 * smoke-test.js — Automated smoke test for Cheatsheet Piscinas data + rendering.
 * Run with: node scripts/smoke-test.js   (or: npm run test:smoke)
 *
 * Tests:
 *  1. JSON files load and have expected structure
 *  2. Every ficha has id, titulo, categoria, destacado
 *  3. Every ficha categoria is valid (exists in categorias.json)
 *  4. Category counts add up
 *  5. Search can flatten every ficha without [object Object]
 *  6. Accent-insensitive search works
 *  7. Every V2 ficha has enough content for at least one fast-card block
 *  8. No ficha produces [object Object] in key rendered output
 *  9. SOP Sí/No button IDs are safe (ASCII-only after safeId())
 * 10. No duplicate ficha IDs
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

let passed = 0;
let failed = 0;
let warnings = 0;

function ok(label)   { console.log(`  ✓  ${label}`); passed++; }
function fail(label) { console.error(`  ✗  ${label}`); failed++; }
function warn(label) { console.warn(`  ⚠  ${label}`); warnings++; }

// ── Load JSON ─────────────────────────────────────────────────────────────────
console.log('\n── JSON files ─────────────────────────────────────────────────────');

let fichas, categorias, arboles, calculos;
try {
  fichas     = JSON.parse(readFileSync(join(ROOT, 'data/fichas.json'), 'utf8'));
  ok(`fichas.json loads (${fichas.length} fichas)`);
} catch (e) { fail(`fichas.json failed to load: ${e.message}`); process.exit(1); }

try {
  categorias = JSON.parse(readFileSync(join(ROOT, 'data/categorias.json'), 'utf8'));
  ok(`categorias.json loads (${Object.keys(categorias).length} categories)`);
} catch (e) { fail(`categorias.json failed to load: ${e.message}`); process.exit(1); }

try {
  arboles    = JSON.parse(readFileSync(join(ROOT, 'data/arboles.json'), 'utf8'));
  ok(`arboles.json loads (${arboles.length} trees)`);
} catch (e) { fail(`arboles.json failed to load: ${e.message}`); process.exit(1); }

try {
  calculos   = JSON.parse(readFileSync(join(ROOT, 'data/calculos.json'), 'utf8'));
  ok(`calculos.json loads`);
} catch (e) { fail(`calculos.json failed to load: ${e.message}`); process.exit(1); }

// ── Ficha structure ───────────────────────────────────────────────────────────
console.log('\n── Ficha structure ────────────────────────────────────────────────');

const missingId    = fichas.filter(f => !f.id);
const missingTitle = fichas.filter(f => !f.titulo);
const missingCat   = fichas.filter(f => !f.categoria);
const noDest       = fichas.filter(f => f.destacado === undefined);

if (missingId.length)    fail(`${missingId.length} fichas with missing id`);
else                     ok('All fichas have an id');
if (missingTitle.length) fail(`${missingTitle.length} fichas with missing titulo`);
else                     ok('All fichas have titulo');
if (missingCat.length)   fail(`${missingCat.length} fichas with missing categoria`);
else                     ok('All fichas have categoria');
if (noDest.length)       fail(`${noDest.length} fichas missing destacado field`);
else                     ok('All fichas have destacado field');

// Duplicate IDs
const idSet = new Set();
const dupIds = [];
fichas.forEach(f => { if (idSet.has(f.id)) dupIds.push(f.id); else idSet.add(f.id); });
if (dupIds.length) fail(`Duplicate ficha IDs: ${dupIds.join(', ')}`);
else               ok('No duplicate ficha IDs');

// ── Category cross-reference ──────────────────────────────────────────────────
console.log('\n── Category cross-reference ───────────────────────────────────────');

const unknownCats = [...new Set(fichas.filter(f => !categorias[f.categoria]).map(f => f.categoria))];
if (unknownCats.length) fail(`Fichas reference unknown categories: ${unknownCats.join(', ')}`);
else                    ok('All ficha categories exist in categorias.json');

// Count check
const catCounts = {};
fichas.forEach(f => { catCounts[f.categoria] = (catCounts[f.categoria]||0)+1; });
const sum = Object.values(catCounts).reduce((a,b)=>a+b,0);
if (sum !== fichas.length) fail(`Category count sum ${sum} !== ficha count ${fichas.length}`);
else                       ok(`Category counts sum matches (${sum})`);

const unusedCats = Object.keys(categorias).filter(k => !catCounts[k]);
if (unusedCats.length) warn(`Defined but unused categories: ${unusedCats.join(', ')}`);

const emptyButtons = Object.entries(catCounts).filter(([,n])=>n===0).map(([k])=>k);
if (emptyButtons.length) fail(`Category buttons with 0 fichas: ${emptyButtons.join(', ')}`);
else                     ok('No category button points to 0 fichas');

// ── Search flatten ────────────────────────────────────────────────────────────
console.log('\n── Search flatten ─────────────────────────────────────────────────');

function flattenForSearch(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenForSearch).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenForSearch).join(' ');
  return '';
}
function normalizar(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s]/g, '');
}

const badFlattens = fichas.filter(f => flattenForSearch(f).includes('[object Object]'));
if (badFlattens.length) fail(`${badFlattens.length} fichas produce [object Object] in flatten`);
else                    ok('No fichas produce [object Object] when flattened');

// Accent-insensitive search
const queries = [
  { q: 'desague',  expect: 'aspirar' },
  { q: 'vomito',   expect: 'contaminacion' },
  { q: 'salino',   expect: 'clorador' },
  { q: 'ph',       expect: null },
  { q: 'bomba',    expect: null },
  { q: 'filtro',   expect: null },
  { q: 'fuga',     expect: null },
];
let searchPassed = 0;
queries.forEach(({ q, expect }) => {
  const results = fichas.filter(f => {
    const h = normalizar(flattenForSearch(f));
    return h.includes(normalizar(q));
  });
  if (results.length === 0) {
    fail(`Search "${q}" returns 0 results`);
  } else {
    if (expect) {
      const found = results.some(f => f.id.includes(expect) || normalizar(f.titulo).includes(normalizar(expect)));
      if (!found) warn(`Search "${q}" has ${results.length} results but none match expected "${expect}"`);
      else searchPassed++;
    } else {
      searchPassed++;
    }
  }
});
ok(`Accent-insensitive search: ${searchPassed}/${queries.length} queries pass`);

// ── V2 ficha fast-card content ────────────────────────────────────────────────
console.log('\n── V2 fast-card content ───────────────────────────────────────────');

const v2fichas = fichas.filter(f => f.version_sop === 'campo_v2');
ok(`V2 fichas: ${v2fichas.length}`);

const v2noBlock = v2fichas.filter(f => {
  const hasSV  = Array.isArray(f.situacion_visible)  && f.situacion_visible.length  > 0;
  const hasDS  = Array.isArray(f.decision_sop)        && f.decision_sop.length        > 0;
  const hasCR  = Array.isArray(f.comprobaciones_rapidas) && f.comprobaciones_rapidas.length > 0;
  const hasPM  = Array.isArray(f.parametros)          && f.parametros.length          > 0;
  return !hasSV && !hasDS && !hasCR && !hasPM;
});
if (v2noBlock.length) warn(`${v2noBlock.length} V2 fichas have no visible/procedure/checks/params content`);
else                  ok('All V2 fichas have at least one fast-card block populated');

// ── Safe IDs for Sí/No buttons ────────────────────────────────────────────────
console.log('\n── Sí/No button ID safety ─────────────────────────────────────────');

function safeId(str) {
  return String(str||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-zA-Z0-9_-]/g,'-');
}

const unsafeIds = fichas.filter(f => /[^a-zA-Z0-9_-]/.test(f.id));
if (unsafeIds.length) {
  warn(`${unsafeIds.length} fichas with non-ASCII IDs (handled by safeId): ${unsafeIds.map(f=>f.id).join(', ')}`);
  // Verify safeId produces valid result for each
  const safened = unsafeIds.map(f => safeId(f.id));
  const hasCollision = new Set(safened).size !== safened.length;
  if (hasCollision) fail('safeId() produces ID collisions for non-ASCII ficha IDs');
  else              ok('safeId() handles non-ASCII IDs without collisions');
} else {
  ok('All ficha IDs are ASCII-safe');
}

// ── Árbol structure ───────────────────────────────────────────────────────────
console.log('\n── Árbol structure ────────────────────────────────────────────────');

const badArboles = arboles.filter(a => !a.id || !a.titulo || !a.nodes?.length);
if (badArboles.length) fail(`${badArboles.length} arboles missing id/titulo/nodes`);
else                   ok(`All ${arboles.length} arboles have id, titulo, nodes`);

// Check arbol_relacionado references
const arbolIds = new Set(arboles.map(a => a.id));
const badArbolRefs = fichas.filter(f => f.arbol_relacionado && !arbolIds.has(f.arbol_relacionado));
if (badArbolRefs.length) warn(`${badArbolRefs.length} fichas reference unknown arbol_relacionado`);
else                     ok('All arbol_relacionado references are valid');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(66));
console.log(`   Passed: ${passed}  |  Warnings: ${warnings}  |  Failed: ${failed}`);
if (failed > 0) {
  console.error(`\n❌ Smoke test FAILED with ${failed} error(s).\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠  Smoke test passed with ${warnings} warning(s).\n`);
} else {
  console.log(`\n✅ Smoke test passed.\n`);
}
