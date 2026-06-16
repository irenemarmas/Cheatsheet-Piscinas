/**
 * search.js — Accent- and case-insensitive scored search across ficha fields.
 * Uses searchEngine.js (curated intents, disambiguation rules, aliases,
 * category vocabulary) when a vocabulary is supplied, falling back to plain
 * substring matching otherwise.
 */

import { normalizeSearchText, searchFichas, buildSearchContext } from './searchEngine.js';

export const normalizar = normalizeSearchText;

let _context = null;

export function setVocabulary(vocabulary) {
  _context = vocabulary && vocabulary.curated_intents ? buildSearchContext(vocabulary) : null;
}

export function fichaMatchesQuery(ficha, query) {
  if (!query) return true;
  if (!_context) {
    const q = normalizeSearchText(query);
    const haystack = normalizeSearchText([
      ficha.titulo, ficha.categoria,
      ...(ficha.sintomas ?? []), ...(ficha.palabras_clave ?? []), ...(ficha.sinonimos ?? []),
      ficha.problema_explicado, ...(ficha.causas ?? []), ficha.interpretacion_resultados,
      ...(ficha.acciones ?? []).map(row => row.join(' ')),
      ficha.checklist, ficha.construccion, ficha.cliente,
      ficha.situacion_visible, ficha.riesgo_inmediato,
      ...(ficha.descartar_urgente ?? []), ...(ficha.comprobaciones_rapidas ?? []),
      ...(ficha.protocolo ?? []),
      ...(ficha.decision_sop ?? []).flatMap(b => [b.condicion, ...(b.pasos ?? [])]),
      ...(ficha.calculo_rapido ?? []),
      ...(ficha.seguimiento ?? []).flatMap(s => s.notas ?? []),
    ].join(' '));
    return haystack.includes(q);
  }
  return searchFichas([ficha], query, _context).length > 0;
}

/**
 * Filter and split fichas into destacadas / otras, applying category + query.
 * Results within each group are ordered by relevance score when a vocabulary
 * is loaded.
 */
export function filtrarFichas(fichas, { query = '', categoria = null } = {}) {
  let list = fichas;

  if (query && _context) {
    const scored = searchFichas(fichas, query, _context, { categoria });
    list = scored.map(r => r.ficha);
  } else {
    if (categoria) list = list.filter(f => f.categoria === categoria);
    if (query)     list = list.filter(f => fichaMatchesQuery(f, query));
  }

  return {
    destacadas:   list.filter(f => f.destacado),
    noDestacadas: list.filter(f => !f.destacado),
  };
}
