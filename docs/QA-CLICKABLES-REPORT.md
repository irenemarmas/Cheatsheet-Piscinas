# QA Clickables Report — Cheatsheet Piscinas SOP

**Fecha:** 2026-06-12  
**Versión testada:** post Phase 4 (SW cache v5)  
**Fichas:** 273 (V2: 250 · Legacy: 23)

---

## Estado general

✅ **Sin errores críticos en lógica de datos.**  
🔧 **3 bugs corregidos durante este QA.**  
⚠️ **2 advertencias menores (no errores).**

---

## Bugs encontrados y corregidos

### BUG 1 — `aria-hidden` permanecía en `true` al abrir el drawer
- **Archivo:** `src/drawer.js`
- **Síntoma:** El drawer tenía `aria-hidden="true"` en el HTML y `openDrawer()` nunca lo quitaba. Los lectores de pantalla no podían acceder al contenido del drawer.
- **Fix:** `openDrawer()` ahora establece `aria-hidden="false"`. `closeDrawer()` lo restaura a `"true"`.

### BUG 2 — IDs no ASCII en atributos `onclick` de botones Sí/No
- **Archivo:** `src/render.js`
- **Síntoma:** La ficha `agua_marrón` generaba `id="dq-agua_marrón-0"` y `onclick="window.sopToggle('dq-agua_marrón-0','si')"`. El carácter `ó` en IDs inline de JS es frágil en algunos parsers HTML.
- **Fix:** Se añadió `safeId()` que convierte cualquier ID a ASCII seguro antes de usarlo como identificador DOM. `agua_marrón` → `agua_marr-n`.

### BUG 3 — `normalizar()` usaba rango de caracteres frágil
- **Archivo:** `src/search.js`
- **Síntoma:** La eliminación de diacríticos usaba `/[̀-ͯ]/g`, un rango de caracteres Unicode frágil que podía fallar en ciertos entornos o con caracteres fuera del rango Latin Extended.
- **Fix:** Reemplazado por `/\p{Diacritic}/gu` (Unicode property escape), el método estándar moderno.

---

## Auditoría de categorías

| Comprobación | Estado |
|---|---|
| Todas las fichas tienen `categoria` válida | ✅ |
| Todas las categorías usadas existen en `categorias.json` | ✅ |
| Cada botón de categoría tiene `data-cat`, label, count | ✅ |
| Clic en categoría filtra fichas correctamente | ✅ |
| Doble clic en categoría activa limpia el filtro | ✅ |
| "Quitar filtro" funciona | ✅ |
| Búsqueda + categoría actúan juntas | ✅ |
| Limpiar búsqueda conserva categoría activa | ✅ |
| Limpiar categoría conserva búsqueda activa | ✅ |
| Categorías sin fichas no se muestran | ✅ |
| Conteos coinciden con fichas reales | ✅ |
| `categorias['seguridad']` definida pero sin fichas | ⚠️ warning conocido — mantenida por compatibilidad |

**Categorías renderizadas (18 botones activos):**

| Clave | Nombre | Fichas |
|---|---|---|
| agua | Agua y química 💧 | 13 |
| agua_quimica | Agua y química 🧪 | 40 |
| algas | Algas 🦠 | 1 |
| algas_biologia | Algas y biología 🔬 | 25 |
| automatizacion | Automatización 🖥️ | 15 |
| bomba | Bomba ⚙️ | 23 |
| cloracion_salina | Cloración salina 🔋 | 15 |
| filtro | Filtro y válvula 🛢️ | 21 |
| fugas | Fugas 🚱 | 1 |
| hidraulica | Hidráulica 💦 | 25 |
| mantenimiento | Mantenimiento 🧰 | 2 |
| riesgo_quimico | Riesgo químico ☢️ | 20 |
| robot | Limpiafondos/robot 🤖 | 1 |
| robot_limpieza | Robot y limpieza 🤖 | 10 |
| salino | Salino/dosificación ⚗️ | 1 |
| seguridad_sanitaria | Seguridad sanitaria 🚨 | 25 |
| turbidez_filtracion | Turbidez y filtración 🔍 | 20 |
| valvulas_tuberias | Válvulas y tuberías 🔩 | 15 |

---

## Auditoría de búsqueda

| Query | Resultados | Estado |
|---|---|---|
| `desague` | Encuentra fichas con `desagüe` | ✅ (accent-insensitive) |
| `vomito` | Encuentra fichas con `vómito` | ✅ |
| `pH` | 144+ fichas | ✅ |
| `ph alto` | Fichas de pH alto | ✅ |
| `cloro` | 97 fichas | ✅ |
| `olor` | 76 fichas | ✅ |
| `bomba` | 94 fichas | ✅ |
| `fecal` | 2 fichas | ✅ |
| `salino` | 16 fichas | ✅ |
| `fuga` | 84 fichas | ✅ |
| `polvo` | 11 fichas | ✅ |
| `arena` | 29 fichas | ✅ |
| `vidrio` | 28 fichas | ✅ |
| `[object Object]` en output | 0 fichas | ✅ |
| Nested V2 objects indexados | Sí — `flattenForSearch()` | ✅ |

---

## Auditoría del drawer

| Comprobación | Estado |
|---|---|
| Clic en card abre el drawer correcto | ✅ |
| Enter/Space en card enfocada abre drawer | ✅ (via keydown handler) |
| Botón cerrar (✕) cierra drawer | ✅ |
| Tecla Escape cierra drawer | ✅ |
| Clic en overlay cierra drawer | ✅ (scrim click) |
| Focus trap funcionando | ✅ |
| `aria-hidden` correcto al abrir/cerrar | ✅ (corregido) |
| Hash de URL actualizado | ✅ |
| Popstate cierra drawer al navegar atrás | ✅ |
| Scroll del body manejado | ✅ (overflow en drawer-body) |
| Sin `[object Object]` en contenido | ✅ |
| Sin texto genérico visible | ✅ (filtrado por `hasUsefulContent()`) |

---

## Auditoría de botones Sí/No

| Comprobación | Estado |
|---|---|
| Pregunta visible | ✅ |
| Botones Sí/No visibles | ✅ |
| Sin respuesta visible por defecto | ✅ (`.sop-answer { display: none }`) |
| Clic Sí muestra solo respuesta Sí | ✅ (`classList.toggle('visible')`) |
| Clic No muestra solo respuesta No | ✅ |
| Botón activo recibe clase `active` | ✅ |
| Cambiar respuesta oculta la anterior | ✅ |
| IDs únicos por pregunta | ✅ (`dq-{safeId(fid)}-{idx}`) |
| IDs ASCII-safe (`agua_marrón` → `agua_marr-n`) | ✅ (corregido) |

---

## Auditoría de tabs y calculadora

| Comprobación | Estado |
|---|---|
| Tab Fichas activo por defecto | ✅ |
| Tab Cálculos muestra panel correcto | ✅ |
| Tab Árboles muestra panel correcto | ✅ |
| Scroll resetea al cambiar tab | ✅ (`window.scrollTo(0,0)`) |
| `aria-selected` actualizado | ✅ |
| Calculadora rectangular funciona | ✅ |
| Calculadora redonda usa "Diámetro" | ✅ |
| Calculadora ovalada funciona | ✅ |
| Valores vacíos ocultan output | ✅ |
| Botón copiar resultado | ✅ |

---

## Auditoría de árboles de decisión

| Comprobación | Estado |
|---|---|
| 5 árboles renderizados | ✅ |
| Nav buttons activan árbol correcto | ✅ |
| `arbol_relacionado` en fichas apunta a árbol válido | ✅ |
| Botón tree-link en drawer navega a árbol | ✅ |

---

## Service worker / cache

| Comprobación | Estado |
|---|---|
| CACHE_VERSION bumped a v5 | ✅ |
| Caches antiguas eliminadas en activate | ✅ |
| Update toast funciona | ✅ |
| Install banner close funciona | ✅ |
| Footer count dinámico (no hardcodeado) | ✅ |

---

## Script automatizado

`npm run test:smoke` ejecuta `scripts/smoke-test.js`:
- 19 checks pasados, 2 warnings conocidos, 0 errores.

---

## Warnings pendientes (no son errores)

1. Categoría `seguridad` definida en `categorias.json` pero sin fichas activas. Mantenida por compatibilidad con fichas legacy.
2. Ficha `agua_marrón` tiene ID no-ASCII. Manejado por `safeId()` en render.js. Sin impacto funcional.
