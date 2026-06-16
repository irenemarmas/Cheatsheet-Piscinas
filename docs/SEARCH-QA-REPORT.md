# Search QA Report

**Fecha:** 2026-06-16

## Automatizado — `npm run test:search`

55/55 PASS (46 búsquedas de cobertura + 9 aserciones de top-3 curado). Ver salida completa ejecutando `npm run test:search`.

## Manual — comportamiento de UI

| Query | Resultado | Esperado | PASS/FAIL | Notas |
|---|---|---|---|---|
| "agua verde" | `agua_verde_con_algas_en_suspension` arriba | ficha de algas en suspensión arriba | PASS | |
| "ph alto" (sin tilde) | `ph_alto_persistente` arriba | igual que "pH alto" | PASS | normalización funciona |
| "célula" / "celula" | mismos resultados | `celula_salina_incrustada` entre los primeros | PASS | accent-insensitive |
| "no chupa agua" | `bomba_no_aspira` #1 | `bomba_no_aspira` arriba | PASS | intención curada |
| "no xucla aigua" (CA) | `bomba_no_aspira` #1 | igual que ES | PASS | catalán coloquial |
| "polvillo en el fondo" | `agua_con_polvo_recurrente_en_fondo` #1 | igual | PASS | desambiguación vs turbidez genérica |
| "arena impulsores" | `arena_vuelve_por_impulsores` #1 | igual | PASS | desambiguación vs polvo en fondo |
| "caca piscina" | `contaminacion_fecal_solida_en_el_vaso` #1 | igual | PASS | distinto de diarrea |
| "diarrea piscina" | `contaminacion_fecal_diarreica_en_el_vaso` #1 | igual | PASS | distinto de caca sólida |
| búsqueda sin resultados (p. ej. "xyz123") | estado vacío con chips de sugerencia | mensaje + chips + botón | PASS | `index.html` `#empty-state` |
| clic en chip "agua verde" | rellena input, ejecuta búsqueda, muestra resultados | igual | PASS | handler delegado en `app.js` |
| "Ver todas las fichas" | limpia búsqueda y filtro de categoría, muestra todas | igual | PASS | `data-action="reset-search"` |
| búsqueda + categoría activa | filtra dentro de la categoría | igual | PASS | `filtrarFichas` recibe `categoria` |
| limpiar búsqueda (botón ✕) | mantiene categoría activa | igual | PASS | `searchQuery` se resetea, `activeFilter` no |
| limpiar filtro de categoría | mantiene búsqueda activa | igual | PASS | `clearFilter()` no toca `searchQuery` |
| contador de resultados | "N fichas encontradas para 'query'" | igual | PASS | `#result-count` |

## Notas

- Verificación de carga estática de `data/search-vocabulary.json` y `src/searchEngine.js` vía servidor local (`npx serve`): ambos responden 200.
- No se detectaron errores de sintaxis (`node --check`) en los módulos modificados.
- `npm run validate` sigue pasando (273 fichas, 5 árboles, sin IDs duplicados).
