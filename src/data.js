/**
 * data.js — Loads all JSON data files and exposes them as a single object.
 * All paths are relative so the app works in any subfolder.
 */

let _cache = null;

export async function loadData() {
  if (_cache) return _cache;

  const [fichas, arboles, categorias, prioridades, calculos] = await Promise.all([
    fetch('./data/fichas.json').then(r => r.json()),
    fetch('./data/arboles.json').then(r => r.json()),
    fetch('./data/categorias.json').then(r => r.json()),
    fetch('./data/prioridades.json').then(r => r.json()),
    fetch('./data/calculos.json').then(r => r.json()),
  ]);

  _cache = { fichas, arboles, categorias, prioridades, calculos };
  return _cache;
}
