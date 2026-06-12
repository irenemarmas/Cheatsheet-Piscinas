/**
 * search.js — Accent- and case-insensitive search across ficha fields.
 * Behavior is identical to the original normalizarTexto implementation.
 */

export function normalizar(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, '');
}

/**
 * Returns true if the ficha matches the query string.
 * Searches across the same fields as the original app.
 */
export function fichaMatchesQuery(ficha, query) {
  if (!query) return true;
  const q = normalizar(query);
  const haystack = [
    ficha.titulo,
    ficha.categoria,
    ...(ficha.sintomas ?? []),
    ...(ficha.palabras_clave ?? []),
    ...(ficha.sinonimos ?? []),
    ficha.problema_explicado,
    ...(ficha.causas ?? []),
    ficha.interpretacion_resultados,
    ...(ficha.acciones ?? []).map(row => row.join(' ')),
    ficha.checklist,
    ficha.construccion,
    ficha.cliente,
  ].join(' ');
  return normalizar(haystack).includes(q);
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
