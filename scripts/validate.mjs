/**
 * validate.mjs — Data validation for Cheatsheet Piscinas SOP.
 * Supports both legacy fichas and V2 SOP Campo fichas.
 * Usage: node scripts/validate.mjs  /  npm run validate
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

function load(file) {
  const p = path.join(DATA, file);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.error(`Cannot read ${file}: ${e.message}`); process.exit(1); }
}

const fichas      = load('fichas.json');
const arboles     = load('arboles.json');
const categorias  = load('categorias.json');
const prioridades = load('prioridades.json');

let errors = 0, warnings = 0;
const fail = m => { console.error(`  ✗  ${m}`); errors++; };
const warn = m => { console.warn( `  ⚠  ${m}`); warnings++; };
const ok   = m => { console.log(  `  ✓  ${m}`); };

const VALID_PRIORIDADES = Object.keys(prioridades);
const VALID_CATEGORIAS  = Object.keys(categorias);
const ARBOL_IDS         = arboles.map(a => a.id);
const FORBIDDEN_FIELDS  = ['cat', 'problema', 'formula', 'parametros_ref'];
const TELEGRAPHIC       = /^(baja|sube|dosifica|choque|renovaci[oó]n|lava|filtra|deriva|ok|mantener)\.?$/i;

function flatten(v) {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(flatten).join(' ');
  if (typeof v === 'object') return Object.values(v).map(flatten).join(' ');
  return String(v);
}

// ── Fichas ─────────────────────────────────────────────────────────────────────
console.log('\n── Fichas ─────────────────────────────────────────────────────');

if (fichas.length >= 29) {
  ok(`Ficha count: ${fichas.length} (min 29)`);
} else {
  fail(`Ficha count: only ${fichas.length} (expected >= 29)`);
}

const seen = new Set();
fichas.forEach(f => {
  if (seen.has(f.id)) fail(`Duplicate id: "${f.id}"`);
  seen.add(f.id);
});
if (seen.size === fichas.length) ok('No duplicate ficha IDs');

fichas.forEach((f, i) => {
  const ref  = `ficha[${i}] "${f.id ?? '?'}"`;
  const isV2 = f.version_sop === 'campo_v2';

  if (!f.id)               fail(`${ref}: missing 'id'`);
  if (!f.titulo)            fail(`${ref}: missing 'titulo'`);
  if (!f.categoria)         fail(`${ref}: missing 'categoria'`);
  if (!f.prioridad)         fail(`${ref}: missing 'prioridad'`);
  if (!f.problema_explicado) fail(`${ref}: missing 'problema_explicado'`);
  if (!f.acciones?.length)  fail(`${ref}: missing or empty 'acciones'`);
  if (f.construccion === undefined || f.construccion === null)
    fail(`${ref}: missing 'construccion'`);

  if (f.categoria && !VALID_CATEGORIAS.includes(f.categoria))
    fail(`${ref}: categoria '${f.categoria}' not in categorias.json`);
  if (f.prioridad && !VALID_PRIORIDADES.includes(f.prioridad))
    fail(`${ref}: prioridad '${f.prioridad}' not in prioridades.json`);
  if (f.arbol_relacionado && !ARBOL_IDS.includes(f.arbol_relacionado))
    fail(`${ref}: arbol_relacionado '${f.arbol_relacionado}' not in arboles.json`);

  FORBIDDEN_FIELDS.forEach(fd => { if (fd in f) fail(`${ref}: forbidden field '${fd}'`); });

  if (isV2) {
    ['situacion_visible','riesgo_inmediato','descartar_urgente','comprobaciones_rapidas',
     'decision_sop','protocolo','causa_raiz_probable','solucion_paliativa',
     'solucion_definitiva','por_que_recurre','que_no_hacer','cuando_cerrar_bano',
     'cuando_parar_equipo','cuando_derivar','cliente','parte','fuentes'
    ].forEach(fd => {
      const v = f[fd];
      if (!v || (Array.isArray(v) && !v.length) || v === '')
        warn(`${ref}: V2 field '${fd}' is empty`);
    });
    if (!f.parametros?.length) warn(`${ref}: V2 'parametros' is empty`);
  }

  // Telegraphic accion_sop
  (f.parametros || []).forEach((row, ri) => {
    const accion = typeof row === 'object' && !Array.isArray(row)
      ? (row.accion_sop || '')
      : (Array.isArray(row) && ri > 0 ? (row[3] || '') : '');
    if (accion && TELEGRAPHIC.test(accion.trim()))
      warn(`${ref}: parametros[${ri}].accion_sop is telegraphic: "${accion}"`);
  });

  if (!f.fuentes?.length) warn(`${ref}: 'fuentes' is empty`);
});

ok('Per-ficha validation done');

// ── Árboles ───────────────────────────────────────────────────────────────────
console.log('\n── Árboles ─────────────────────────────────────────────────────');
ok(`Árbol count: ${arboles.length}`);
const arbolSeen = new Set();
arboles.forEach((a, i) => {
  if (!a.id)        fail(`arbol[${i}]: missing 'id'`);
  if (!a.titulo)    fail(`arbol[${i}]: missing 'titulo'`);
  if (!a.nodes?.length) fail(`arbol[${i}] "${a.id}": empty 'nodes'`);
  if (arbolSeen.has(a.id)) fail(`Duplicate árbol id: "${a.id}"`);
  arbolSeen.add(a.id);
  (a.nodes || []).forEach((node, j) => {
    if (!node.q)       fail(`arbol "${a.id}" node[${j}]: missing 'q'`);
    if (!node.ops?.length) fail(`arbol "${a.id}" node[${j}]: empty 'ops'`);
  });
});
ok('Per-árbol validation done');

// ── Categorías ────────────────────────────────────────────────────────────────
console.log('\n── Categorías ──────────────────────────────────────────────────');
ok(`Categoría count: ${VALID_CATEGORIAS.length}`);
VALID_CATEGORIAS.forEach(key => {
  const cat = categorias[key];
  if (!cat.emoji)  fail(`categoria "${key}": missing 'emoji'`);
  if (!cat.nombre) fail(`categoria "${key}": missing 'nombre'`);
});
ok('Per-categoría validation done');

const usedCats = new Set(fichas.map(f => f.categoria));
usedCats.forEach(cat => {
  if (!VALID_CATEGORIAS.includes(cat)) fail(`Fichas use category '${cat}' not in categorias.json`);
});
VALID_CATEGORIAS.forEach(cat => {
  if (!usedCats.has(cat)) warn(`Category '${cat}' defined but unused`);
});
ok('Category cross-reference done');

// ── Summary ───────────────────────────────────────────────────────────────────
const v2count = fichas.filter(f => f.version_sop === 'campo_v2').length;
console.log('\n────────────────────────────────────────────────────────────────');
console.log(`   Total fichas: ${fichas.length}  (V2: ${v2count}, legacy: ${fichas.length - v2count})`);
console.log(`   Árboles: ${arboles.length}  |  Categorías: ${VALID_CATEGORIAS.length}`);

if (errors === 0 && warnings === 0) {
  console.log(`✅ All checks passed\n`); process.exit(0);
} else if (errors === 0) {
  console.log(`✅ Passed with ${warnings} warning(s). No errors.\n`); process.exit(0);
} else {
  console.error(`\n❌ FAILED: ${errors} error(s), ${warnings} warning(s)\n`); process.exit(1);
}
