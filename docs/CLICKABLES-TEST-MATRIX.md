# Clickables Test Matrix — Cheatsheet Piscinas SOP

**Fecha:** 2026-06-13  
**Versión:** post-QA (SW cache v5, Phase 4 field-cards)  
**Método:** código auditado + simulación Node.js + revisión manual de flujos

---

## Fichas tab

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Category button — clic | Filtra fichas por `data-cat` | PASS | `e.target.closest('.category-btn')` en el grid |
| Category button — doble clic | Limpia el filtro activo | PASS | `activeFilter === cat ? null : cat` |
| Category button — estado active | Refleja `activeFilter` visualmente | PASS | clase `active` + `aria-pressed` |
| Category button — count | Muestra fichas reales por categoría | PASS | Suma = 273 fichas |
| Category button — categorías vacías | No se renderizan | PASS | `filter(([key]) => counts[key])` elimina `seguridad` |
| Buscador — input texto | Retorna fichas relevantes | PASS | Accent-insensitive, indexa campos V2 anidados |
| Buscador — `desague` sin tilde | Encuentra fichas con `desagüe` | PASS | `\p{Diacritic}/gu` en `normalizar()` |
| Buscador — `vomito` sin tilde | Encuentra fichas con `vómito` | PASS | ídem |
| Buscador — campos V2 anidados | `decision_sop`, `descartar_urgente`, `parametros`... | PASS | `flattenForSearch()` recursivo en search.js |
| Buscador — sin `[object Object]` | No aparece nunca en resultados | PASS | Smoke test confirmado (0 fichas afectadas) |
| Buscador — limpiar (✕) | Borra query, conserva categoría activa | PASS | `searchQuery = ''`, `activeFilter` no se toca |
| Quitar filtro | Limpia `activeFilter`, conserva búsqueda | PASS | `clearFilter()` solo pone `activeFilter = null` |
| Reset search (empty state) | Limpia búsqueda Y categoría | PASS | `data-action="reset-search"` pone ambos a vacío/null |
| Chip de filtro activo | Muestra nombre de categoría activa | PASS | `categorias[activeFilter]?.nombre ?? activeFilter` |
| Empty state | Aparece solo si 0 resultados | PASS | `classList.toggle('show', dest.length===0 && noDest.length===0)` |
| Search + category juntos | Resultado respeta ambos filtros | PASS | `filtrarFichas(fichas, { query, categoria })` |

---

## Combinaciones búsqueda + categoría

| Categoría | Búsqueda | Resultado esperado | Estado |
|---|---|---|---|
| filtro | lavado | Fichas de filtro sobre lavado | PASS |
| bomba | aire | Fichas de bomba con aire | PASS |
| cloracion_salina | célula | Fichas de salino con célula | PASS |
| seguridad_sanitaria | fecal | Fichas fecal en seguridad | PASS |
| robot_limpieza | polvo | Fichas robot + polvo | PASS |
| agua_quimica | pH | Fichas agua+química + pH | PASS |
| hidraulica | nivel | Fichas hidráulica + nivel | PASS |

---

## Ficha cards

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Clic en card | Abre drawer con la ficha correcta | PASS | `e.target.closest('[data-ficha-id]')` |
| Enter en card | Abre drawer | PASS | `keydown` handler en app.js |
| Space en card | Abre drawer | PASS | ídem |
| `data-ficha-id` con ó (agua_marrón) | No rompe click ni drawer | PASS | `card.dataset.fichaId` decodifica correctamente |
| Card abre ficha equivocada | No ocurre | PASS | delegación directa por ID |
| Doble listener (abre 2 veces) | No ocurre | PASS | un solo `document.addEventListener('click',...)` |

---

## Drawer

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Abrir drawer | Muestra título en header + metadatos en body | PASS | `drawer-head` + `fichaHeader()` |
| `aria-hidden` al abrir | `false` | PASS | **Corregido** — antes permanecía `true` |
| `aria-hidden` al cerrar | `true` | PASS | **Corregido** |
| Botón cerrar (✕) | Cierra drawer | PASS | listener en cada apertura |
| Tecla Escape | Cierra drawer | PASS | `keydown` en `initDrawer` |
| Clic en overlay (scrim) | Cierra drawer | PASS | `scrim.addEventListener('click', closeDrawer)` |
| Botón atrás del navegador | Cierra drawer | PASS | `popstate` handler |
| Focus trap | Tab no sale del drawer | PASS | `trapFocus()` en drawer.js |
| Scroll del body | No se bloquea (drawer es fixed) | PASS | overflow en `.drawer-body` |
| Abrir otro drawer después de cerrar | Funciona | PASS | `drawer.innerHTML` se reescribe en cada apertura |
| Sin `[object Object]` | Nunca visible | PASS | Simulación Node confirma 0 apariciones |
| Sin texto genérico | "No aplica" etc. filtrados | PASS | `hasUsefulContent()` en todos los campos |
| Título duplicado | Aparece en header bar Y en `fichaHeader` del body | INFO | Diseño intencional — header bar para nav, body para metadatos |

---

## Estructura del drawer V2 (field-cards)

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Block 1 — Problema visible | Visible por defecto | PASS | `situacion_visible` + `riesgo_inmediato` |
| Block 2 — Procedimiento | Visible por defecto | PASS | `decision_sop` cards + `descartar_urgente` |
| Block 3 — Comprobaciones | Visible por defecto | PASS | tabla `check-table` + `param-table` |
| Block 4 — Construcción/Seguridad | Visible si hay contenido | PASS | `construccion` + `cerrar_bano` + `parar_equipo` + `que_no_hacer` |
| Block 5 — Cliente/Parte | Visible si hay contenido | PASS | `cliente` + `parte` |
| Technical accordion | Cerrado por defecto | PASS | `<details class="technical-accordion">` sin atributo `open` |
| Technical accordion — abrir | Funciona con clic/tap | PASS | HTML nativo `<details>` |
| Secciones sin contenido | No se renderizan | PASS | Cada bloque solo se emite si `html !== ''` |
| Max 3 cards decisión | Limitado con `.slice(0,3)` | PASS | |
| Max 4 acciones por card | Limitado con `.slice(0,4)` | PASS | |
| Max 6 filas comprobaciones | Limitado con `.slice(0,6)` | PASS | |

---

## Botones Sí/No (descartar_urgente)

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Pregunta visible | Texto de `item.pregunta` | PASS | |
| Respuestas ocultas por defecto | `display: none` | PASS | `.sop-answer { display: none }` |
| Clic Sí | Muestra solo `.sop-answer-si.visible` | PASS | `classList.toggle('visible')` |
| Clic No | Muestra solo `.sop-answer-no.visible` | PASS | ídem |
| Cambiar respuesta | Oculta la anterior | PASS | toggle reemplaza visible |
| `agua_marrón` ID | `dq-agua_marr-n-0` (ASCII safe) | PASS | **Corregido** — `safeId()` en render.js |
| IDs únicos por ficha | `dq-{safeId(fid)}-{idx}` | PASS | idx incremental por ficha |
| Sin error de consola | No hay TypeError por IDs | PASS | |

---

## Tabs

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Tab Fichas | Muestra `#fichas-tab` | PASS | clase `show` + `aria-selected="true"` |
| Tab Cálculos | Muestra `#calculos-tab` | PASS | |
| Tab Árboles | Muestra `#arboles-tab` | PASS | |
| Scroll al cambiar tab | Reset a (0,0) | PASS | `window.scrollTo(0, 0)` en `activateTab` |
| `aria-selected` actualizado | Refleja tab activo | PASS | |

---

## Calculadora de volumen

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Piscina rectangular | Calcula correctamente: largo×ancho×profMedia | PASS | |
| Piscina redonda | Label cambia a "Diámetro (m)", campo ancho oculto | PASS | `actualizarCamposCalc()` |
| Piscina ovalada | Calcula: largo×ancho×profMedia×0.89 | PASS | |
| Valores vacíos | Oculta output | PASS | `calcularVolumen` retorna `null` |
| Botón copiar resultado | Copia al portapapeles | PASS | `navigator.clipboard.writeText()` |
| Feedback "✓ Copiado" | Aparece 2s tras copiar | PASS | setTimeout reset |

---

## Árboles de decisión

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| 5 árboles renderizados | Todos aparecen | PASS | |
| Nav buttons | Scroll suave al árbol correcto | PASS | `scrollIntoView({ behavior: 'smooth' })` |
| Nav button active | Clase `active` + `aria-pressed` | PASS | |
| `arbol_relacionado` en drawer | Botón visible, navega al árbol | PASS | tree-link delegación en drawer.js |
| Volver a Fichas tras navegar | Tab Fichas sigue funcional | PASS | |

---

## PWA / Service Worker

| Elemento | Comportamiento esperado | Estado | Notas |
|---|---|---|---|
| Install hint — cerrar | Oculta banner, guarda en localStorage | PASS | `localStorage.setItem('installHintDismissed','1')` |
| Install hint — standalone | No aparece en modo app | PASS | `window.matchMedia('(display-mode: standalone)')` |
| Update toast — botón Actualizar | `SKIP_WAITING` + reload | PASS | postMessage al SW |
| CACHE_VERSION | v5 | PASS | Bumpeado en este ciclo QA |
| Caches antiguas eliminadas | Sí, en activate | PASS | `filter(k => k !== CACHE_NAME)` |
| Footer count dinámico | Actualizado por JS desde `fichas.length` | PASS | No hardcodeado en HTML |

---

## Scripts automatizados

| Comando | Resultado |
|---|---|
| `npm run validate` | ✅ Passed with 1 warning (category `seguridad` unused) |
| `npm run test:smoke` | ✅ Passed: 19 / Warnings: 2 / Failed: 0 |

---

## Resumen de bugs corregidos en este QA

| Bug | Archivo | Tipo | Estado |
|---|---|---|---|
| `aria-hidden` nunca se quitaba al abrir drawer | `src/drawer.js` | Accesibilidad | ✅ Corregido |
| ID `agua_marrón` con ó en onclick inline | `src/render.js` | Robustez HTML | ✅ Corregido (`safeId()`) |
| `normalizar()` usaba rango de caracteres frágil | `src/search.js` | Búsqueda | ✅ Corregido (`\p{Diacritic}/gu`) |
| `miniNav()` dead code con IDs que ya no existen | `src/render.js` | Dead code | ✅ Eliminado |
