/**
 * search-regression-test.js — Regression test for the scored search engine.
 *
 * Usage: node scripts/search-regression-test.js
 * Exit code: 0 = pass, 1 = failure
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchFichas, buildSearchContext } from '../src/searchEngine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');

function load(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));
}

const fichas     = load('fichas.json');
const vocabulary = load('search-vocabulary.json');
const context     = buildSearchContext(vocabulary);

const REQUIRED_SEARCHES = [
  ['polvo', 1], ['polvo fondo', 1], ['polvillo en el fondo', 1],
  ['fons brut amb pols', 1], ['desague', 1], ['desagüe', 1], ['waste', 1],
  ['lavado filtro', 1], ['enjuague', 1], ['bomba no aspira', 1],
  ['no chupa agua', 1], ['no xucla aigua', 1], ['aire prefiltro', 1],
  ['agua verde', 1], ['aigua verda', 1], ['algas', 1], ['agua turbia', 1],
  ['agua blanca', 1], ['lechosa', 1], ['pH alto', 1], ['ph alto', 1],
  ['cloro bajo', 1], ['olor cloro', 1], ['ulls vermells', 1],
  ['irritacion ojos', 1], ['arena', 1], ['vidrio', 1], ['arena impulsores', 1],
  ['sorra pels impulsors', 1], ['salino', 1], ['celula', 1], ['célula', 1],
  ['orp', 1], ['redox', 1], ['fecal', 1], ['caca piscina', 1],
  ['vomito', 1], ['vómito', 1], ['sangre', 1], ['cristales', 1],
  ['vidres piscina', 1], ['liner', 1], ['gresite', 1], ['fuga', 1],
  ['pierde agua', 1], ['baixa el nivell', 1], ['nivel baja', 1],
];

const CURATED_TOP_RESULTS = [
  ['no chupa agua', 'bomba_no_aspira'],
  ['no xucla aigua', 'bomba_no_aspira'],
  ['polvillo en el fondo', 'agua_con_polvo_recurrente_en_fondo'],
  ['fons brut amb pols', 'agua_con_polvo_recurrente_en_fondo'],
  ['arena impulsores', 'arena_vuelve_por_impulsores'],
  ['sorra pels impulsors', 'arena_vuelve_por_impulsores'],
  ['diarrea piscina', 'contaminacion_fecal_diarreica_en_el_vaso'],
  ['caca piscina', 'contaminacion_fecal_solida_en_el_vaso'],
  ['salta diferencial', 'diferencial_salta_al_encender_bomba'],
];

let failures = 0;

console.log('query | count | top5 IDs | PASS/FAIL');
console.log('-'.repeat(80));

for (const [query, minCount] of REQUIRED_SEARCHES) {
  const results = searchFichas(fichas, query, context);
  const count = results.length;
  const top5  = results.slice(0, 5).map(r => r.ficha.id);
  const pass  = count >= minCount && (count === 0 || results[0].score > 0);
  if (!pass) failures++;
  console.log(`${query.padEnd(28)} | ${String(count).padEnd(5)} | ${top5.join(', ').slice(0, 60).padEnd(60)} | ${pass ? 'PASS' : 'FAIL'}`);
}

console.log('-'.repeat(80));
console.log('Curated top-result assertions:');
console.log('-'.repeat(80));

for (const [query, expectedId] of CURATED_TOP_RESULTS) {
  const results = searchFichas(fichas, query, context);
  const top3 = results.slice(0, 3).map(r => r.ficha.id);
  const pass = top3.includes(expectedId);
  if (!pass) failures++;
  console.log(`${query.padEnd(28)} | expect=${expectedId.padEnd(45)} | top3=${top3.join(', ').slice(0, 60).padEnd(60)} | ${pass ? 'PASS' : 'FAIL'}`);
}

console.log('-'.repeat(80));
if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED.`);
  process.exit(1);
} else {
  console.log('\nAll search regression tests PASSED.');
}
