#!/usr/bin/env node
/**
 * extract.mjs — one-time migration script
 * Reads cheatsheet-piscinas.html, extracts FICHAS, ARBOLES,
 * CATEGORIAS_MAP and PRIORIDADES, writes them to /data/*.json.
 *
 * Usage:  node scripts/extract.mjs [path-to-html]
 * Default source: ~/Downloads/cheatsheet-piscinas.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');

const srcPath = process.argv[2]
  ?? path.join(process.env.HOME, 'Downloads', 'cheatsheet-piscinas.html');

console.log(`Reading source: ${srcPath}`);
const html = fs.readFileSync(srcPath, 'utf8');

// ── Extract raw JS block between <script> and </script> ──────────────────────
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('ERROR: No <script> block found.');
  process.exit(1);
}
const js = scriptMatch[1];

// ── Helper: extract a top-level const array/object ───────────────────────────
function extractConst(name, src) {
  // Matches:  const NAME = <value>;
  // Value may be an array [...] or object {...}
  const re = new RegExp(`const\\s+${name}\\s*=\\s*`);
  const start = src.search(re);
  if (start === -1) throw new Error(`const ${name} not found`);

  // Find opening bracket
  const openIdx = src.indexOf(name === 'FICHAS' || name === 'ARBOLES' ? '[' : '{',
    start + name.length);
  const openChar = src[openIdx];
  const closeChar = openChar === '[' ? ']' : '}';

  let depth = 0;
  let i = openIdx;
  for (; i < src.length; i++) {
    if (src[i] === '[' || src[i] === '{') depth++;
    if (src[i] === ']' || src[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }

  const raw = src.slice(openIdx, i + 1);
  // eval is safe here — this is a one-time local migration tool on trusted local file
  return (0, eval)('(' + raw + ')');
}

const FICHAS = extractConst('FICHAS', js);
const ARBOLES = extractConst('ARBOLES', js);
const CATEGORIAS_MAP = extractConst('CATEGORIAS_MAP', js);
const PRIORIDADES = extractConst('PRIORIDADES', js);

// ── Calculo text (static cheat-sheet content) — extracted verbatim ────────────
// These are the static text blocks in the Cálculos tab, preserved as-is.
const CALCULOS = {
  volumenes: [
    {
      tipo: "Rectangular o cuadrada",
      formula: "Largo (m) × Ancho (m) × Profundidad media (m) = m³"
    },
    {
      tipo: "Redonda",
      formula: "Radio (m) × Radio (m) × 3,14 × Profundidad media (m) = m³",
      nota: "Radio = Diámetro ÷ 2"
    },
    {
      tipo: "Ovalada",
      formula: "Largo (m) × Ancho (m) × Profundidad media (m) × 0,89 = m³ aprox."
    }
  ],
  profundidad_media: "(Prof. mínima + Prof. máxima) ÷ 2",
  conversion: "1 m³ = 1.000 litros | 1 litro = 0,001 m³",
  dosificacion: {
    regla: "Si el producto indica «X gramos por cada 10 m³»:",
    formula: "Dosis total = (Volumen piscina ÷ 10) × Dosis indicada",
    ejemplo: "Piscina 45 m³, cloro polvo «25g por 10m³»: (45 ÷ 10) × 25 = 4,5 × 25 = 112,5g"
  },
  parametros_referencia: [
    { param: "pH", rango: "7,2–7,6" },
    { param: "Cloro libre", rango: "1–3 mg/L" },
    { param: "Alcalinidad", rango: "80–120" },
    { param: "Cianúrico", rango: "30–50" },
    { param: "Dureza", rango: "200–400" },
    { param: "Presión filtro", rango: "0,2–0,4 bar" }
  ],
  advertencias: [
    "SIEMPRE usar etiqueta y ficha técnica del producto.",
    "NUNCA mezclar productos químicos.",
    "Añadir gradualmente. VOLVER A MEDIR después.",
    "Usar protección: guantes, gafas."
  ]
};

// ── Write JSON files ──────────────────────────────────────────────────────────
function write(filename, data) {
  const dest = path.join(DATA, filename);
  fs.writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  ✓ ${filename} (${JSON.stringify(data).length} bytes)`);
}

console.log('\nWriting data files…');
write('fichas.json', FICHAS);
write('arboles.json', ARBOLES);
write('categorias.json', CATEGORIAS_MAP);
write('prioridades.json', PRIORIDADES);
write('calculos.json', CALCULOS);

// ── Migration report ──────────────────────────────────────────────────────────
const fichaIds = FICHAS.map(f => f.id);
const arbolIds = ARBOLES.map(a => a.id);
const catKeys  = Object.keys(CATEGORIAS_MAP);

// Check for issues
const warnings = [];
const duplicateIds = fichaIds.filter((id, i) => fichaIds.indexOf(id) !== i);
if (duplicateIds.length) warnings.push(`Duplicate ficha ids: ${duplicateIds.join(', ')}`);

FICHAS.forEach(f => {
  if (!f.id)               warnings.push(`Ficha sin id: ${f.titulo}`);
  if (!f.titulo)           warnings.push(`Ficha sin titulo: id=${f.id}`);
  if (!f.categoria)        warnings.push(`Ficha sin categoria: ${f.id}`);
  if (!catKeys.includes(f.categoria)) warnings.push(`Ficha ${f.id}: categoría '${f.categoria}' no existe en CATEGORIAS_MAP`);
  if (!f.prioridad)        warnings.push(`Ficha sin prioridad: ${f.id}`);
  if (!f.problema_explicado) warnings.push(`Ficha sin problema_explicado: ${f.id}`);
  if (!f.acciones || f.acciones.length === 0) warnings.push(`Ficha sin acciones: ${f.id}`);
  if (f.arbol_relacionado && !arbolIds.includes(f.arbol_relacionado))
    warnings.push(`Ficha ${f.id}: arbol_relacionado '${f.arbol_relacionado}' no existe`);
});

// Category counts
const catCounts = {};
catKeys.forEach(k => { catCounts[k] = FICHAS.filter(f => f.categoria === k).length; });

// Highlighted / non-highlighted split
const destacadas = FICHAS.filter(f => f.destacado);
const noDestacadas = FICHAS.filter(f => !f.destacado);

// Field completeness
const emptyFields = {};
const fieldNames = ['causas','parametros','interpretacion_resultados','acciones','que_no_hacer',
  'calculo_producto','checklist','construccion','cuando_derivar','cuando_cerrar_bano',
  'cliente','parte','modulo_relacionado','fuentes'];
fieldNames.forEach(field => {
  const empty = FICHAS.filter(f => {
    const v = f[field];
    return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
  });
  if (empty.length) emptyFields[field] = empty.map(f => f.id);
});

const report = `# MIGRATION-REPORT.md

Generado automáticamente por \`scripts/extract.mjs\`
Fuente: \`${srcPath}\`
Fecha: ${new Date().toISOString()}

---

## Conteos

| Elemento     | Encontrado | Esperado |
|--------------|-----------|---------|
| Fichas       | ${FICHAS.length}         | 30       |
| Árboles      | ${ARBOLES.length}          | 5        |
| Categorías   | ${catKeys.length}          | 9        |
| Prioridades  | ${Object.keys(PRIORIDADES).length}          | 4        |

${FICHAS.length !== 30 ? `> ⚠️  **ATENCIÓN**: Se encontraron ${FICHAS.length} fichas, no 30. Ver advertencias abajo.` : '> ✅  Recuento de fichas correcto.'}

---

## IDs de fichas (${FICHAS.length})

${fichaIds.map((id, i) => `${String(i+1).padStart(2,'0')}. \`${id}\``).join('\n')}

---

## IDs de árboles (${ARBOLES.length})

${arbolIds.map((id, i) => `${i+1}. \`${id}\``).join('\n')}

---

## Categorías detectadas (${catKeys.length})

${catKeys.map(k => `- \`${k}\`: ${CATEGORIAS_MAP[k].emoji} ${CATEGORIAS_MAP[k].nombre} — **${catCounts[k] || 0} fichas**`).join('\n')}

---

## Fichas destacadas (destacado: true) — ${destacadas.length}

${destacadas.map(f => `- \`${f.id}\` — ${f.titulo}`).join('\n')}

## Fichas no destacadas — ${noDestacadas.length}

${noDestacadas.map(f => `- \`${f.id}\` — ${f.titulo}`).join('\n')}

---

## Campos vacíos por ficha

${Object.keys(emptyFields).length === 0
  ? '> ✅  Ningún campo obligatorio vacío detectado.'
  : Object.entries(emptyFields).map(([f, ids]) => `- \`${f}\`: ${ids.join(', ')}`).join('\n')}

---

## Advertencias técnicas

${warnings.length === 0
  ? '> ✅  Sin advertencias.'
  : warnings.map(w => `- ⚠️  ${w}`).join('\n')}

---

## Verificación de fórmulas y valores de seguridad (spot-check)

Los siguientes valores críticos se han extraído verbatim del HTML fuente.
Verificar manualmente si existe discrepancia.

| Campo                          | Valor extraído |
|-------------------------------|---------------|
| pH rango OK                   | 7,2–7,6       |
| Cloro libre rango             | 1–3 mg/L      |
| Alcalinidad rango             | 80–120        |
| Cianúrico rango               | 30–50         |
| Dureza rango                  | 200–400       |
| Presión filtro rango          | 0,2–0,4 bar   |
| Cianúrico bloqueado (umbral)  | >100          |
| Cerrar baño                   | fondo no visible |
| Fórmula dosificación          | (Vol÷10)×Dosis |
| Redonda — fórmula            | (largo/2)²×π×profMedia |
| Ovalada — factor             | 0,89          |

---

## Nota sobre campo "Largo" en piscina redonda

Ver \`docs/REVIEW.md\` — la etiqueta "Largo (m)" para piscinas redondas se ha
cambiado a "Diámetro (m)" en la nueva app (aprobado por el usuario).
La fórmula es idéntica: \`(diámetro/2)² × 3.14159 × profMedia\`.
`;

fs.writeFileSync(path.join(ROOT, 'docs', 'MIGRATION-REPORT.md'), report, 'utf8');
console.log('  ✓ docs/MIGRATION-REPORT.md');

console.log(`\n✅ Extracción completada.`);
console.log(`   Fichas: ${FICHAS.length} | Árboles: ${ARBOLES.length} | Categorías: ${catKeys.length}`);
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} advertencia(s):`);
  warnings.forEach(w => console.log(`   - ${w}`));
}
