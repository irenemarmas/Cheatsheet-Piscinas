/**
 * import-jsonl.mjs
 * Converts pack_250_fichas_sop_piscinas.jsonl → fichas.json entries.
 *
 * - Maps JSONL categories to existing app categories
 * - Converts parametros objects → array-of-arrays (app format)
 * - Converts decision_sop string[] → [{condicion, pasos[]}]
 * - Converts seguimiento string[] → [{tiempo, notas[]}]
 * - Builds acciones from protocolo (required field)
 * - Skips IDs that already exist in fichas.json
 * - Writes REVIEW.md entries for nota_precision items
 *
 * Run: node scripts/import-jsonl.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir  = dirname(fileURLToPath(import.meta.url));
const ROOT   = join(__dir, '..');
const FICHAS = join(ROOT, 'data/fichas.json');
const JSONL  = '/Users/irenemm/Documents/Claude/pack_250_fichas_sop_piscinas.jsonl';
const REVIEW = join(ROOT, 'docs/REVIEW.md');

// ── Category mapping (JSONL keys → app category keys) ─────────────────────────
const CAT_MAP = {
  agua_quimica:        'agua',
  algas_biologia:      'algas',
  automatizacion:      'salino',
  bomba:               'bomba',
  cloracion_salina:    'salino',
  filtro:              'filtro',
  hidraulica:          'fugas',
  riesgo_quimico:      'seguridad',
  robot_limpieza:      'robot',
  seguridad_sanitaria: 'seguridad',
  turbidez_filtracion: 'filtro',
  valvulas_tuberias:   'filtro',
  // pass-through existing keys
  agua: 'agua', algas: 'algas', fugas: 'fugas', robot: 'robot',
  salino: 'salino', seguridad: 'seguridad', mantenimiento: 'mantenimiento',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function arrToStr(val, sep = ' ') {
  if (!val) return '';
  return Array.isArray(val) ? val.join(sep) : String(val);
}

function ensureArr(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

/** parametros: [{parametro, rango_objetivo, fuera_de_rango, accion_sop}] → [[header], [row], ...] */
function convertParametros(raw) {
  if (!raw || !raw.length) return [];
  const first = raw[0];
  // already array-of-arrays
  if (Array.isArray(first)) return raw;
  // object format → convert
  const header = ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"];
  const rows = raw.map(p => [
    p.parametro     || '',
    p.rango_objetivo || '',
    p.fuera_de_rango || '',
    p.accion_sop    || ''
  ]);
  return [header, ...rows];
}

/** decision_sop: string[] → [{condicion, pasos[]}] */
function convertDecisionSop(raw) {
  if (!raw || !raw.length) return [];
  const first = raw[0];
  // already [{condicion, pasos}]
  if (typeof first === 'object' && first.condicion) return raw;
  // string[] → single block
  return [{ condicion: "Protocolo de actuación", pasos: raw }];
}

/** seguimiento: string[] → [{tiempo, notas[]}] */
function convertSeguimiento(raw) {
  if (!raw || !raw.length) return [];
  const first = raw[0];
  if (typeof first === 'object' && first.tiempo) return raw;
  return [{ tiempo: "Tras la intervención", notas: raw }];
}

/** Build acciones table from protocolo (app requires non-empty acciones) */
function buildAcciones(protocolo) {
  if (!protocolo || !protocolo.length) {
    return [["PASO", "ACCIÓN"], ["1", "Ver protocolo detallado en esta ficha."]];
  }
  return [
    ["PASO", "ACCIÓN"],
    ...protocolo.map((step, i) => [String(i + 1), step])
  ];
}

// ── Load existing fichas ───────────────────────────────────────────────────────
const fichas = JSON.parse(readFileSync(FICHAS, 'utf8'));
const existingIds = new Set(fichas.map(f => f.id));

// ── Read JSONL ─────────────────────────────────────────────────────────────────
const lines = readFileSync(JSONL, 'utf8').trim().split('\n');
console.log(`\nReading ${lines.length} entries from JSONL…`);

const reviewItems = [];
let imported = 0, skipped = 0, catMissing = 0;

for (const line of lines) {
  const e = JSON.parse(line);

  // Skip duplicates
  if (existingIds.has(e.id)) {
    console.log(`  ⤵  SKIP (duplicate): ${e.id}`);
    skipped++;
    continue;
  }

  // Map category
  const mappedCat = CAT_MAP[e.categoria];
  if (!mappedCat) {
    console.warn(`  ⚠  Unknown category "${e.categoria}" for ${e.id} — using 'mantenimiento'`);
    catMissing++;
  }

  const situacion   = arrToStr(e.situacion_visible, ' ');
  const riesgo      = arrToStr(e.riesgo_inmediato, ' ');
  const construccion = arrToStr(e.construccion, ' ');
  const clienteStr  = arrToStr(e.cliente, ' ');
  const parteStr    = arrToStr(e.parte, ' | ');
  const protocolo   = ensureArr(e.protocolo);

  const ficha = {
    id:           e.id,
    titulo:       e.titulo,
    categoria:    mappedCat || 'mantenimiento',
    prioridad:    e.prioridad,
    destacado:    false,
    // search fields
    sintomas:           ensureArr(e.comprobaciones_rapidas).slice(0, 5),
    palabras_clave:     ensureArr(e.palabras_clave),
    sinonimos:          ensureArr(e.sinonimos_busqueda),
    // core content
    problema_explicado: situacion || e.titulo,
    causas:             ensureArr(e.descartar_urgente),
    parametros:         convertParametros(e.parametros),
    interpretacion_resultados: '',
    acciones:           buildAcciones(protocolo),
    que_no_hacer:       ensureArr(e.que_no_hacer),
    calculo_producto:   '',
    checklist:          '',
    construccion:       construccion,
    cuando_derivar:     ensureArr(e.cuando_derivar),
    cuando_cerrar_bano: ensureArr(e.cuando_cerrar_bano),
    cliente:            clienteStr,
    parte:              parteStr,
    modulo_relacionado: '',
    fuentes:            ensureArr(e.fuentes),
    arbol_relacionado:  null,
    // V2 fields
    situacion_visible:      situacion,
    riesgo_inmediato:       riesgo,
    descartar_urgente:      ensureArr(e.descartar_urgente),
    comprobaciones_rapidas: ensureArr(e.comprobaciones_rapidas),
    decision_sop:           convertDecisionSop(e.decision_sop),
    protocolo:              protocolo,
    calculo_rapido:         ensureArr(e.calculo_rapido),
    seguimiento:            convertSeguimiento(e.seguimiento),
    cuando_parar_equipo:    ensureArr(e.cuando_parar_equipo),
  };

  fichas.push(ficha);
  existingIds.add(e.id);
  imported++;

  // Collect review items
  if (e.nota_precision) {
    reviewItems.push({ id: e.id, titulo: e.titulo, nota: e.nota_precision });
  }
}

// ── Write fichas.json ──────────────────────────────────────────────────────────
writeFileSync(FICHAS, JSON.stringify(fichas, null, 2), 'utf8');
console.log(`\n✅ Imported: ${imported}  |  Skipped (duplicates): ${skipped}  |  Total fichas: ${fichas.length}`);

// ── Update REVIEW.md ───────────────────────────────────────────────────────────
if (reviewItems.length > 0) {
  let reviewContent = existsSync(REVIEW) ? readFileSync(REVIEW, 'utf8') : '';

  const section = `
---

## Fichas JSONL importadas — Nota de precisión pendiente de validación

Las siguientes ${reviewItems.length} fichas fueron importadas desde el pack de 250 fichas SOP.
Cada una incluye \`nota_precision\` que indica qué debe validarse antes de uso operativo en piscina pública/colectiva.

${reviewItems.map(r =>
  `### ${r.id}\n**${r.titulo}**\n> ${r.nota}\n`
).join('\n')}
`;

  writeFileSync(REVIEW, reviewContent + section, 'utf8');
  console.log(`📋 ${reviewItems.length} review items written to docs/REVIEW.md`);
}
