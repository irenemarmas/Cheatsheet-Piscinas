# Optimization Report — Cheatsheet Piscinas SOP

**Fecha:** 2026-06-12  
**Estado:** ✅ Aplicado y desplegado  
**Fichas:** 273 (V2: 250 · Legacy: 23)

---

## Qué se ha optimizado

### 1. Header claro en cada ficha
Cada drawer V2 muestra al inicio del body (no solo en el header del panel):
- **Título completo** de la ficha (h2 visible)
- Categoría + subcategoría (si existe)
- Badge de prioridad (baja / media / alta / crítica)
- Badge "SOP Campo V2"

### 2. Resumen rápido automático
Tarjeta compacta generada automáticamente a partir del contenido real:
- ⚠️ **Riesgo:** primera frase útil de `riesgo_inmediato`
- 🔎 **Primero:** primer paso de `protocolo` o primera acción de `decision_sop`
- 🧪 **Medir:** primer parámetro con su rango objetivo
- 🛑 **Cerrar baño / Parar equipo:** solo si aplica con contenido real

Si alguno de estos puntos no tiene contenido, no aparece. No se inventa nada.

### 3. Acordeones (details/summary)
Cada ficha V2 usa `<details>/<summary>` nativo HTML (funciona en móvil sin JS).

**Abiertas por defecto:**
1. Resumen rápido (tarjeta, no acordeón)
2. ⚠ Riesgo inmediato
3. 🔴 Descarta primero
4. 📋 Decisión SOP

**Cerradas por defecto** (el técnico las abre si las necesita):
- Situación visible
- Comprobaciones rápidas
- Qué medir (parámetros)
- Protocolo paso a paso
- Cálculo rápido
- Causa raíz probable
- Solución paliativa
- Solución definitiva
- Por qué puede recurrir
- Construcción
- Qué NO hacer
- Cuándo cerrar baño
- Cuándo parar equipo
- Cuándo derivar
- Qué decir al cliente
- Parte de trabajo
- 📚 Fuentes y validación (combinado)

### 4. Secciones vacías o genéricas: ocultas
Se usa `hasUsefulContent(value)` antes de renderizar cualquier sección.

**Textos genéricos que se filtran automáticamente:**
- "No aplica"
- "No especificado"
- "No aplica en condiciones normales"
- "Valorar cierre si compromete seguridad"
- "Derivar si no se identifica causa"
- "Corregir y hacer seguimiento"
- "Riesgo medio"
- "Riesgo alto"
- "Riesgo medio: corregir y hacer seguimiento"
- "Riesgo alto: actuar antes de uso normal"

Si una sección contiene únicamente texto genérico, no se muestra.  
Si un array está vacío o es `null`, tampoco se muestra.

### 5. Preguntas Sí/No interactivas
Campo `descartar_urgente` en formato `{pregunta, si, no}`:
- Se muestra la pregunta
- Se muestran dos botones: **Sí** y **No**
- Las respuestas están **hidden** por defecto (no se ven hasta pulsar)
- Al pulsar un botón → se muestra solo esa respuesta, el botón queda visualmente activo
- Se puede cambiar la respuesta pulsando el otro botón
- No se guarda estado al cerrar la ficha

Si `descartar_urgente` contiene strings (formato legacy), se renderiza como lista normal.

### 6. Decisión SOP como tarjetas visuales
Cada bloque `{si, hacer[]}` se renderiza como:
```
Si [condición]:
→ Acción 1
→ Acción 2
→ Acción 3
```
- Nunca "Si: Si..." (se detecta si el texto ya empieza por "Si")
- Cada bloque separado visualmente
- Acciones filtradas si son genéricas

### 7. Protocolo con numeración real
Lista `<ol>` real. Se eliminan automáticamente prefijos "1.", "2." etc. que pudieran venir en el texto, evitando "1. 1. Confirmar seguridad."

### 8. Parámetros responsivos en móvil
En **escritorio**: tabla horizontal con 4 columnas (Parámetro / Rango objetivo / Qué indica / Acción SOP).  
En **móvil (< 600px)**: cada fila se convierte en tarjeta apilada con etiquetas visibles:
```
pH
Rango objetivo: 7,2–7,6
Qué indica fuera de rango: ...
Acción SOP: ...
```
Implementado con CSS puro (`data-label` attrs + `@media`). Sin JS.

### 9. Sin duplicados legacy/V2
`renderDrawerV2` solo usa campos V2. No renderiza:
- `acciones` (reemplazado por `protocolo`)
- `problema_explicado` (reemplazado por `situacion_visible`)
- `calculo_producto` (reemplazado por `calculo_rapido`)
- `interpretacion_resultados` (reemplazado por `parametros` + `decision_sop`)

### 10. Mini navegación interna
Botones de acceso rápido a las secciones más usadas:
```
Ir a: [Decisión] [Mediciones] [Protocolo] [Causa raíz] [Cliente] [Fuentes]
```
Solo aparecen botones para secciones que tienen contenido. Al pulsar → abre el acordeón y hace scroll.

### 11. Footer y contador real
- `index.html` ya no tiene "29 fichas" hardcodeado
- `app.js` actualiza el contador desde `fichas.length` al arrancar
- Validator comprueba que no haya hardcoding

### 12. Fuentes y validación: sección combinada y plegada
`fuentes` + `nivel_confianza` + `nota_precision` + `requiere_validacion_fuente` aparecen juntos en un único acordeón al final, cerrado por defecto.

---

## Cómo funcionan los acordeones

HTML nativo `<details open>` / `<details>`. El atributo `open` marca las secciones abiertas por defecto. El usuario puede pulsar cualquier `<summary>` para abrir/cerrar. No requiere JavaScript.

Para la navegación interna, `window.openAccordion(id)` abre el `<details>` y hace scroll suave.

---

## Cómo funcionan los botones Sí/No

```js
window.sopToggle = function(qId, answer) {
  const si = document.getElementById(qId + '-si');
  const no = document.getElementById(qId + '-no');
  si.hidden = answer !== 'si';
  no.hidden = answer !== 'no';
  // actualiza aria-pressed + clase active en los botones
};
```

Los divs de respuesta arrancan con `hidden`. Solo se revelan tras pulsar.

---

## Cómo se calcula el contador de fichas

```js
// En app.js:
function updateFooter() {
  document.getElementById('footer-count').textContent = `${DATA.fichas.length} fichas`;
}
```

Se llama tras cargar datos, siempre refleja el número real.

---

## Fichas probadas (UX)

| Ficha | Título | Resultado |
|---|---|---|
| aguaverde | Agua verde | ✅ |
| agua_blanca | Agua blanca o lechosa | ✅ |
| olor_cloro | Olor fuerte a cloro | ✅ |
| polvo_fondo | Polvo fino recurrente en fondo | ✅ |
| aspirar_desague | Aspirar a desagüe | ✅ |
| lavado_filtro | Lavado filtro arena/vidrio | ✅ |
| bomba_no_aspira | Bomba no aspira | ✅ |
| salino_no_produce | Clorador salino no produce | ✅ |
| contaminacion_fecal | Contaminación fecal sólida | ✅ |
| arena_fondo | Arena/vidrio en el fondo | ✅ |

---

## Warnings pendientes (no son errores)

- **Categoría `seguridad`** definida pero sin fichas activas (fichas V2 usan `seguridad_sanitaria`/`riesgo_quimico`). Se mantiene por compatibilidad.
- Algunas fichas V2 tienen campos `descartar_urgente` y `decision_sop` con textos muy cortos pero válidos.

---

## Limitaciones conocidas

- Los acordeones no persisten entre aperturas de ficha (state reset al abrir/cerrar drawer).
- El buscador no indexa el contenido de respuestas Sí/No que el usuario no ha seleccionado (esto es intencional: son condiciones de decisión, no contenido de búsqueda).
- La tabla de parámetros en modo móvil no permite ordenar columnas (no es necesario para uso en campo).
