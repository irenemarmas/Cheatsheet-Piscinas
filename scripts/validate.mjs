/**
 * validate.mjs — Data validation for Cheatsheet Piscinas SOP.
 * No external dependencies.
 *
 * Usage: node scripts/validate.mjs
 * Exit code: 0 = pass (even with warnings), 1 = failure (errors present)
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

// ── Load JSON ─────────────────────────────────────────────────────────────────
function load(file) {
  const p = path.join(DATA, file);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(1); }
}

const fichas      = load('fichas.json');
const arboles     = load('arboles.json');
const categorias  = load('categorias.json');
const prioridades = load('prioridades.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
let errors = 0, warnings = 0;
function fail(msg) { console.error(`  ✗  ${msg}`); errors++; }
function warn(msg) { console.warn( `  ⚠  ${msg}`); warnings++; }
function ok(msg)   { console.log(  `  ✓  ${msg}`); }

// ── Constants ─────────────────────────────────────────────────────────────────
// EXPECTED_FICHAS is the minimum required; set to exact count once stable.
const MIN_FICHAS       = 29;
const EXPECTED_ARBOLES = 5;
const EXPECTED_CATS    = 9;

const VALID_PRIORIDADES = Object.keys(prioridades);
const VALID_CATS        = Object.keys(categorias);
const ARBOL_IDS         = arboles.map(a => a.id);

// Forbidden legacy field names
const FORBIDDEN_FIELDS = ['cat', 'problema', 'formula', 'parametros_ref'];

// SOP V2 optional fields (warn if ALL are missing on a ficha)
const V2_FIELDS = ['situacion_visible', 'protocolo', 'decision_sop', 'seguimiento'];

// Telegraphic single-word actions to warn about (as isolated action, not embedded in prose)
const TELEGRAPHIC = /^(baja|sube|dosifica|choque|renovación|lava|deriva|filtra|abre|cierra|parar)\.?$/i;

// ── Validate fichas ───────────────────────────────────────────────────────────
console.log('\n── Validating fichas ──────────────────────────────────────────');

if (fichas.length >= MIN_FICHAS) {
  ok(`Ficha count: ${fichas.length} (min ${MIN_FICHAS})`);
} else {
  fail(`Ficha count: expected ≥${MIN_FICHAS}, found ${fichas.length}`);
}

// Unique IDs
const ids = fichas.map(f => f.id);
const seenIds = new Set();
ids.forEach(id => { if (seenIds.has(id)) fail(`Duplicate ficha id: "${id}"`); seenIds.add(id); });
if (seenIds.size === fichas.length) ok('No duplicate ficha IDs');

// Per-ficha validation
fichas.forEach((f, i) => {
  const ref = `ficha[${i}] "${f.id ?? '(no id)'}"`;

  // Required fields
  if (!f.id)                 fail(`${ref}: missing 'id'`);
  if (!f.titulo)             fail(`${ref}: missing 'titulo'`);
  if (!f.categoria)          fail(`${ref}: missing 'categoria'`);
  if (!f.prioridad)          fail(`${ref}: missing 'prioridad'`);
  if (!f.problema_explicado) fail(`${ref}: missing 'problema_explicado'`);
  if (!f.acciones || !Array.isArray(f.acciones) || f.acciones.length === 0)
    fail(`${ref}: missing or empty 'acciones'`);

  // Cross-references
  if (f.categoria && !VALID_CATS.includes(f.categoria))
    fail(`${ref}: categoría '${f.categoria}' not in categorias.json`);
  if (f.prioridad && !VALID_PRIORIDADES.includes(f.prioridad))
    fail(`${ref}: prioridad '${f.prioridad}' not in prioridades.json`);
  if (f.arbol_relacionado && !ARBOL_IDS.includes(f.arbol_relacionado))
    fail(`${ref}: arbol_relacionado '${f.arbol_relacionado}' not in arboles.json`);

  // Forbidden legacy fields
  FORBIDDEN_FIELDS.forEach(field => {
    if (field in f) fail(`${ref}: contains forbidden legacy field '${field}'`);
  });

  // V2 upgrade check: warn if none of the V2 fields are present
  const hasV2 = V2_FIELDS.some(field =>
    Array.isArray(f[field]) ? f[field].length > 0 : !!f[field]
  );
  if (!hasV2) warn(`${ref}: not yet upgraded to SOP V2 (missing ${V2_FIELDS.join(', ')})`);

  // Fuentes check
  if (!f.fuentes || f.fuentes.length === 0) {
    warn(`${ref}: 'fuentes' is empty — add at least one source`);
  } else if (Array.isArray(f.fuentes) && typeof f.fuentes[0] === 'object') {
    // Validate object format
    f.fuentes.forEach((src, si) => {
      if (!src.nombre) fail(`${ref}: fuentes[${si}] missing 'nombre'`);
      if (!src.tipo)   warn(`${ref}: fuentes[${si}] missing 'tipo'`);
    });
  }

  // Safety fields check (warn if empty for high/critical priority)
  if (['alta', 'critica'].includes(f.prioridad)) {
    if (!f.cuando_cerrar_bano?.length && !f.cuando_parar_equipo?.length)
      warn(`${ref}: alta/crítica prioridad but 'cuando_cerrar_bano' and 'cuando_parar_equipo' are both empty`);
  }

  // Telegraphic action check — scan acciones, protocolo, decision_sop
  const scanForTelegraphic = (label, texts) => {
    (texts ?? []).forEach((item, idx) => {
      const str = Array.isArray(item) ? item.join(' ') : String(item ?? '');
      str.split(/[.;,\n]/).forEach(fragment => {
        const trimmed = fragment.trim();
        if (TELEGRAPHIC.test(trimmed))
          warn(`${ref}: ${label}[${idx}] contains telegraphic action: "${trimmed}"`);
      });
    });
  };
  scanForTelegraphic('acciones', f.acciones);
  scanForTelegraphic('protocolo', f.protocolo);
  if (f.decision_sop) {
    f.decision_sop.forEach((block, bi) => {
      scanForTelegraphic(`decision_sop[${bi}].pasos`, block.pasos);
    });
  }
});
ok('Per-ficha validation done');

// ── Validate árboles ──────────────────────────────────────────────────────────
console.log('\n── Validating árboles ─────────────────────────────────────────');

if (arboles.length >= EXPECTED_ARBOLES) {
  ok(`Árbol count: ${arboles.length}`);
} else {
  fail(`Árbol count: expected ≥${EXPECTED_ARBOLES}, found ${arboles.length}`);
}

const arbolSeen = new Set();
arboles.forEach((a, i) => {
  if (!a.id)    fail(`arbol[${i}]: missing 'id'`);
  if (!a.titulo) fail(`arbol[${i}]: missing 'titulo'`);
  if (!a.nodes?.length) fail(`arbol[${i}] "${a.id}": missing or empty 'nodes'`);
  if (arbolSeen.has(a.id)) fail(`Duplicate árbol id: "${a.id}"`);
  arbolSeen.add(a.id);
  (a.nodes ?? []).forEach((node, j) => {
    if (!node.q) fail(`arbol "${a.id}" node[${j}]: missing 'q'`);
    if (!node.ops?.length) fail(`arbol "${a.id}" node[${j}]: missing or empty 'ops'`);
  });
});
ok('Per-árbol validation done');

// ── Validate categorías ───────────────────────────────────────────────────────
console.log('\n── Validating categorías ──────────────────────────────────────');

if (VALID_CATS.length >= EXPECTED_CATS) {
  ok(`Categoría count: ${VALID_CATS.length}`);
} else {
  fail(`Categoría count: expected ≥${EXPECTED_CATS}, found ${VALID_CATS.length}`);
}
VALID_CATS.forEach(key => {
  const cat = categorias[key];
  if (!cat.emoji)  fail(`categoría "${key}": missing 'emoji'`);
  if (!cat.nombre) fail(`categoría "${key}": missing 'nombre'`);
});
ok('Per-categoría validation done');

const usedCats = new Set(fichas.map(f => f.categoria));
usedCats.forEach(cat => {
  if (!VALID_CATS.includes(cat)) fail(`Fichas use category '${cat}' not in categorias.json`);
});
ok('Category cross-reference done');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n──────────────────────────────────────────────────────────────');
if (errors === 0 && warnings === 0) {
  console.log(`✅ All checks passed (${fichas.length} fichas, ${arboles.length} árboles)\n`);
  process.exit(0);
} else if (errors === 0) {
  console.log(`✅ Validation passed with ${warnings} warning(s). No errors.\n`);
  process.exit(0);
} else {
  console.error(`\n❌ Validation FAILED: ${errors} error(s), ${warnings} warning(s)\n`);
  process.exit(1);
}
