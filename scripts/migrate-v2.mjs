/**
 * migrate-v2.mjs  —  Replace 250 fichas with V2 SOP Campo content.
 *
 * Strategy:
 *  - V2 JSONL has 250 entries; all already exist in fichas.json (from V1 import).
 *  - We replace each matching entry with the V2 version (richer fields + 7 new fields).
 *  - The 23 original hand-written fichas NOT in V2 are kept unchanged.
 *  - New V2 object-format fields are stored as-is (render handles them).
 *  - Legacy compatibility fields (acciones, problema_explicado, …) are synthesised.
 *
 * Run: node scripts/migrate-v2.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir  = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');
const SRC    = '/Users/irenemm/Documents/Claude/pack_250_fichas_sop_campo_v2_criterio_experto.jsonl';
const FICHAS = join(ROOT, 'data/fichas.json');

// ── Helpers ────────────────────────────────────────────────────────────────────

function ensureArr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function arrToStr(v, sep = ' ') {
  if (!v) return '';
  if (Array.isArray(v)) return v.join(sep);
  return String(v);
}

/** Flatten situacion_visible (string | string[]) → string */
function flatStr(v) {
  if (!v) return '';
  if (Array.isArray(v)) return v.join(' ');
  return String(v);
}

/** Build legacy `acciones` table from protocolo (validator requires non-empty) */
function buildAcciones(protocolo) {
  const rows = ensureArr(protocolo).filter(Boolean);
  if (!rows.length) return [['PASO', 'ACCIÓN'], ['1', 'Ver protocolo detallado en esta ficha.']];
  return [['PASO', 'ACCIÓN'], ...rows.map((s, i) => [String(i + 1), s])];
}

/** Convert V2 entry to fichas.json schema, preserving arbol_relacionado from original */
function toFicha(e, original) {
  const sv = ensureArr(e.situacion_visible);
  const protocolo = ensureArr(e.protocolo);

  return {
    // ── Identity ────────────────────────────────────────────────────────────
    id:           e.id,
    titulo:       e.titulo,
    categoria:    e.categoria,          // kept as V2 key; categorias.json updated separately
    subcategoria: e.subcategoria || '',
    prioridad:    e.prioridad,
    version_sop:  e.version_sop || 'campo_v2',
    destacado:    original?.destacado ?? false,

    // ── Search / index ───────────────────────────────────────────────────────
    sintomas:          sv.slice(0, 5),
    palabras_clave:    ensureArr(e.palabras_clave),
    sinonimos:         ensureArr(e.sinonimos_busqueda),
    sinonimos_busqueda: ensureArr(e.sinonimos_busqueda),

    // ── Core content (legacy fields kept for compatibility) ───────────────────
    problema_explicado: flatStr(e.situacion_visible) || e.titulo,
    causas:            ensureArr(e.causa_raiz_probable),
    acciones:          buildAcciones(protocolo),      // required by validator
    calculo_producto:  '',
    checklist:         '',
    modulo_relacionado: original?.modulo_relacionado || '',
    arbol_relacionado:  original?.arbol_relacionado  ?? null,
    interpretacion_resultados: '',

    // ── V2 SOP fields (stored as-is, render handles object/array formats) ───
    situacion_visible:      ensureArr(e.situacion_visible),
    riesgo_inmediato:       ensureArr(e.riesgo_inmediato),
    descartar_urgente:      ensureArr(e.descartar_urgente),     // [{pregunta,si,no}]
    comprobaciones_rapidas: ensureArr(e.comprobaciones_rapidas),// [{orden,bloque,accion}]
    parametros:             ensureArr(e.parametros),            // [{parametro,rango_objetivo,…}]
    decision_sop:           ensureArr(e.decision_sop),          // [{si,hacer[]}]
    protocolo,
    calculo_rapido:         ensureArr(e.calculo_rapido),
    seguimiento:            ensureArr(e.seguimiento),           // string[]
    construccion:           ensureArr(e.construccion),          // string[]

    // ── New V2 diagnostic fields ─────────────────────────────────────────────
    causa_raiz_probable:    ensureArr(e.causa_raiz_probable),
    solucion_paliativa:     ensureArr(e.solucion_paliativa),
    solucion_definitiva:    ensureArr(e.solucion_definitiva),
    por_que_recurre:        ensureArr(e.por_que_recurre),

    // ── Safety / closure ─────────────────────────────────────────────────────
    que_no_hacer:       ensureArr(e.que_no_hacer),
    cuando_cerrar_bano: ensureArr(e.cuando_cerrar_bano),
    cuando_parar_equipo: ensureArr(e.cuando_parar_equipo),
    cuando_derivar:     ensureArr(e.cuando_derivar),

    // ── Client / reporting ───────────────────────────────────────────────────
    cliente: ensureArr(e.cliente),
    parte:   ensureArr(e.parte),

    // ── Sources / confidence ─────────────────────────────────────────────────
    fuentes:                   ensureArr(e.fuentes),
    nivel_confianza:           e.nivel_confianza || '',
    requiere_validacion_fuente: ensureArr(e.requiere_validacion_fuente),
    nota_precision:            e.nota_precision || '',
  };
}

// ── Load data ─────────────────────────────────────────────────────────────────

const v2Entries = readFileSync(SRC, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const v2Map = new Map(v2Entries.map(e => [e.id, e]));

const fichas = JSON.parse(readFileSync(FICHAS, 'utf8'));
const originalMap = new Map(fichas.map(f => [f.id, f]));

// ── Migrate ───────────────────────────────────────────────────────────────────

let replaced = 0, kept = 0;
const result = fichas.map(f => {
  if (v2Map.has(f.id)) {
    replaced++;
    return toFicha(v2Map.get(f.id), f);
  }
  kept++;
  return f;
});

writeFileSync(FICHAS, JSON.stringify(result, null, 2), 'utf8');

console.log(`\n✅  Replaced: ${replaced}  |  Kept unchanged: ${kept}  |  Total: ${result.length}`);
console.log(`    V2 source entries: ${v2Entries.length}`);
console.log(`    (${v2Entries.length - replaced} V2 entries had no match in current fichas.json — expected 0)\n`);
