/**
 * validate.mjs — Data validation script for Cheatsheet Piscinas SOP.
 * No external dependencies.
 *
 * Usage: node scripts/validate.mjs
 * Exit code: 0 = pass, 1 = failure
 *
 * Run automatically via: npm run validate
 * Add to pre-commit hook: see docs/README.md
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

// ── Load JSON ─────────────────────────────────────────────────────────────────
function load(file) {
  const p = path.join(DATA, file);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    fail(`Cannot read ${file}: ${e.message}`);
    process.exit(1);
  }
}

const fichas     = load('fichas.json');
const arboles    = load('arboles.json');
const categorias = load('categorias.json');
const prioridades = load('prioridades.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
let errors   = 0;
let warnings = 0;

function fail(msg)  { console.error(`  ✗ ${msg}`); errors++; }
function warn(msg)  { console.warn( `  ⚠  ${msg}`); warnings++; }
function ok(msg)    { console.log(  `  ✓ ${msg}`); }

// ── Expected counts ───────────────────────────────────────────────────────────
// Note: source HTML footer said "30 fichas" but 29 were found.
// This validator uses the ACTUAL count from the extraction.
// Change EXPECTED_FICHAS back to 30 if a 30th ficha is ever added.
const EXPECTED_FICHAS     = 29;
const EXPECTED_ARBOLES    = 5;
const EXPECTED_CATEGORIAS = 9;

const VALID_PRIORIDADES = Object.keys(prioridades);
const VALID_CATEGORIAS  = Object.keys(categorias);
const ARBOL_IDS         = arboles.map(a => a.id);

// ── Forbidden legacy field names ──────────────────────────────────────────────
const FORBIDDEN_FIELDS = ['cat', 'problema', 'formula', 'parametros_ref'];

// ── Validate fichas ───────────────────────────────────────────────────────────
console.log('\n── Validating fichas ──────────────────────────────────────────');

// Count
if (fichas.length === EXPECTED_FICHAS) {
  ok(`Ficha count: ${fichas.length}`);
} else {
  fail(`Ficha count: expected ${EXPECTED_FICHAS}, found ${fichas.length}`);
}

// Unique IDs
const ids = fichas.map(f => f.id);
const seen = new Set();
ids.forEach(id => {
  if (seen.has(id)) fail(`Duplicate ficha id: "${id}"`);
  seen.add(id);
});
if (seen.size === fichas.length) ok('No duplicate ficha IDs');

// Per-ficha validation
fichas.forEach((f, i) => {
  const ref = `ficha[${i}] "${f.id ?? '(no id)'}"`;

  if (!f.id)                 fail(`${ref}: missing 'id'`);
  if (!f.titulo)             fail(`${ref}: missing 'titulo'`);
  if (!f.categoria)          fail(`${ref}: missing 'categoria'`);
  if (!f.prioridad)          fail(`${ref}: missing 'prioridad'`);
  if (!f.problema_explicado) fail(`${ref}: missing 'problema_explicado'`);
  if (!f.acciones || !Array.isArray(f.acciones) || f.acciones.length === 0)
                             fail(`${ref}: missing or empty 'acciones'`);
  if (f.construccion === undefined || f.construccion === null)
                             fail(`${ref}: missing 'construccion' (may be empty string)`);

  if (f.categoria && !VALID_CATEGORIAS.includes(f.categoria))
    fail(`${ref}: categoría '${f.categoria}' not in categorias.json`);

  if (f.prioridad && !VALID_PRIORIDADES.includes(f.prioridad))
    fail(`${ref}: prioridad '${f.prioridad}' not in prioridades.json`);

  if (f.arbol_relacionado && !ARBOL_IDS.includes(f.arbol_relacionado))
    fail(`${ref}: arbol_relacionado '${f.arbol_relacionado}' not in arboles.json`);

  FORBIDDEN_FIELDS.forEach(field => {
    if (field in f) fail(`${ref}: contains forbidden legacy field '${field}'`);
  });

  // Warn on commonly empty fields
  if (!f.checklist)                           warn(`${ref}: 'checklist' is empty`);
  if (!f.cuando_cerrar_bano?.length && !f.cuando_derivar?.length)
    warn(`${ref}: both 'cuando_cerrar_bano' and 'cuando_derivar' are empty`);
});

ok('Per-ficha validation done');

// ── Validate árboles ──────────────────────────────────────────────────────────
console.log('\n── Validating árboles ─────────────────────────────────────────');

if (arboles.length === EXPECTED_ARBOLES) {
  ok(`Árbol count: ${arboles.length}`);
} else {
  fail(`Árbol count: expected ${EXPECTED_ARBOLES}, found ${arboles.length}`);
}

const arbolSeen = new Set();
arboles.forEach((a, i) => {
  if (!a.id)    fail(`arbol[${i}]: missing 'id'`);
  if (!a.titulo) fail(`arbol[${i}]: missing 'titulo'`);
  if (!a.nodes || !Array.isArray(a.nodes) || a.nodes.length === 0)
    fail(`arbol[${i}] "${a.id}": missing or empty 'nodes'`);
  if (arbolSeen.has(a.id)) fail(`Duplicate árbol id: "${a.id}"`);
  arbolSeen.add(a.id);

  (a.nodes ?? []).forEach((node, j) => {
    if (!node.q)  fail(`arbol "${a.id}" node[${j}]: missing 'q'`);
    if (!node.ops || node.ops.length === 0)
      fail(`arbol "${a.id}" node[${j}]: missing or empty 'ops'`);
  });
});
ok('Per-árbol validation done');

// ── Validate categorías ───────────────────────────────────────────────────────
console.log('\n── Validating categorías ──────────────────────────────────────');

if (VALID_CATEGORIAS.length === EXPECTED_CATEGORIAS) {
  ok(`Categoría count: ${VALID_CATEGORIAS.length}`);
} else {
  fail(`Categoría count: expected ${EXPECTED_CATEGORIAS}, found ${VALID_CATEGORIAS.length}`);
}
VALID_CATEGORIAS.forEach(key => {
  const cat = categorias[key];
  if (!cat.emoji)  fail(`categoría "${key}": missing 'emoji'`);
  if (!cat.nombre) fail(`categoría "${key}": missing 'nombre'`);
});
ok('Per-categoría validation done');

// ── Check every category in fichas exists ────────────────────────────────────
const usedCats = new Set(fichas.map(f => f.categoria));
usedCats.forEach(cat => {
  if (!VALID_CATEGORIAS.includes(cat))
    fail(`Fichas use category '${cat}' which is not in categorias.json`);
});
// Warn about categories defined but unused
VALID_CATEGORIAS.forEach(cat => {
  if (!usedCats.has(cat)) warn(`Category '${cat}' is defined but has no fichas`);
});
ok('Category cross-reference done');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────');
if (errors === 0 && warnings === 0) {
  console.log(`✅ All checks passed (${fichas.length} fichas, ${arboles.length} árboles, ${VALID_CATEGORIAS.length} categorías)\n`);
  process.exit(0);
} else if (errors === 0) {
  console.log(`✅ Validation passed with ${warnings} warning(s). No errors.\n`);
  process.exit(0);
} else {
  console.error(`\n❌ Validation FAILED: ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
}
