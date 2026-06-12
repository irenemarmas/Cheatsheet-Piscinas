/**
 * search.js — Accent- and case-insensitive search across ficha fields.
 * Handles both legacy string/array fields and V2 nested object fields.
 */

export function normalizar(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, '');
}

/**
 * Flatten any value (string, array, or nested object) to a plain string.
 * Prevents [object Object] and safely indexes all V2 field formats.
 */
export function flattenForSearch(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenForSearch).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenForSearch).join(' ');
  return '';
}

/**
 * Returns true if the ficha matches the query string.
 * Searches all useful fields including V2 nested object fields.
 */
export function fichaMatchesQuery(ficha, query) {
  if (!query) return true;
  const q = normalizar(query);
  const haystack = normalizar([
    ficha.titulo,
    ficha.categoria,
    ficha.subcategoria,
    ficha.problema_explicado,
    ficha.interpretacion_resultados,
    ficha.checklist,
    flattenForSearch(ficha.sintomas),
    flattenForSearch(ficha.palabras_clave),
    flattenForSearch(ficha.sinonimos),
    flattenForSearch(ficha.sinonimos_busqueda),
    flattenForSearch(ficha.causas),
    flattenForSearch(ficha.acciones),
    flattenForSearch(ficha.construccion),
    flattenForSearch(ficha.cliente),
    // V2 fields — nested objects handled by flattenForSearch
    flattenForSearch(ficha.situacion_visible),
    flattenForSearch(ficha.riesgo_inmediato),
    flattenForSearch(ficha.descartar_urgente),
    flattenForSearch(ficha.comprobaciones_rapidas),
    flattenForSearch(ficha.protocolo),
    flattenForSearch(ficha.decision_sop),
    flattenForSearch(ficha.calculo_rapido),
    flattenForSearch(ficha.seguimiento),
    flattenForSearch(ficha.causa_raiz_probable),
    flattenForSearch(ficha.solucion_paliativa),
    flattenForSearch(ficha.solucion_definitiva),
    flattenForSearch(ficha.por_que_recurre),
    flattenForSearch(ficha.que_no_hacer),
    flattenForSearch(ficha.cuando_cerrar_bano),
    flattenForSearch(ficha.cuando_parar_equipo),
    flattenForSearch(ficha.cuando_derivar),
    flattenForSearch(ficha.parametros),
    flattenForSearch(ficha.parte),
  ].join(' '));
  return haystack.includes(q);
}

/**
 * Filter and split fichas into destacadas / otras, applying category + query.
 */
export function filtrarFichas(fichas, { query = '', categoria = null } = {}) {
  let list = fichas;
  if (categoria) list = list.filter(f => f.categoria === categoria);
  if (query)     list = list.filter(f => fichaMatchesQuery(f, query));

  return {
    destacadas:   list.filter(f => f.destacado),
    noDestacadas: list.filter(f => !f.destacado),
  };
}
