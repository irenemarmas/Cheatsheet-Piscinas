# MIGRATION-REPORT.md

Generado automáticamente por `scripts/extract.mjs`
Fuente: `/Users/irenemm/Downloads/cheatsheet-piscinas.html`
Fecha: 2026-06-11T18:51:10.856Z

---

## Conteos

| Elemento     | Encontrado | Esperado |
|--------------|-----------|---------|
| Fichas       | 29         | 30       |
| Árboles      | 5          | 5        |
| Categorías   | 9          | 9        |
| Prioridades  | 4          | 4        |

> ⚠️  **ATENCIÓN**: Se encontraron 29 fichas, no 30. Ver advertencias abajo.

---

## IDs de fichas (29)

01. `agua_verde`
02. `agua_turbia`
03. `agua_lechosa`
04. `olor_cloro`
05. `cloro_no_aguanta`
06. `ph_alto`
07. `ph_bajo`
08. `alcalinidad_baja`
09. `alcalinidad_alta`
10. `cianurico_alto`
11. `bomba_no_aspira`
12. `bomba_desceba`
13. `burbujas_impulsores`
14. `manometro_alto`
15. `manometro_bajo`
16. `sale_arena`
17. `limpiafondos_no_aspira`
18. `salino_no_produce`
19. `pierde_agua`
20. `fondo_no_visible`
21. `algas_recurrentes`
22. `agua_marrón`
23. `agua_espuma`
24. `bomba_ruido`
25. `manchas_metalicas`
26. `incrustaciones`
27. `mantenimiento_tormenta`
28. `alta_carga_banyistas`
29. `regulador_ph`

---

## IDs de árboles (5)

1. `agua_verde`
2. `agua_turbia`
3. `bomba_no_aspira`
4. `cloro_no_aguanta`
5. `pierde_agua`

---

## Categorías detectadas (9)

- `agua`: 💧 Agua y química — **15 fichas**
- `algas`: 🦠 Algas — **1 fichas**
- `bomba`: ⚙️ Bomba — **4 fichas**
- `filtro`: 🛢️ Filtro y válvula — **3 fichas**
- `fugas`: 🚱 Fugas — **1 fichas**
- `robot`: 🤖 Limpiafondos/robot — **1 fichas**
- `salino`: ⚗️ Salino/dosificación — **1 fichas**
- `seguridad`: ⚡ Seguridad — **1 fichas**
- `mantenimiento`: 🧰 Mantenimiento — **2 fichas**

---

## Fichas destacadas (destacado: true) — 20

- `agua_verde` — Agua verde
- `agua_turbia` — Agua turbia
- `agua_lechosa` — Agua blanca o lechosa
- `olor_cloro` — Olor fuerte a cloro
- `cloro_no_aguanta` — Cloro no aguanta (desaparece rápido)
- `ph_alto` — pH alto (>7,6)
- `ph_bajo` — pH bajo (<7,2)
- `alcalinidad_baja` — Alcalinidad baja (<80)
- `alcalinidad_alta` — Alcalinidad alta (>120)
- `cianurico_alto` — Cianúrico alto (>100)
- `bomba_no_aspira` — Bomba no aspira
- `bomba_desceba` — Bomba se desceba
- `burbujas_impulsores` — Burbujas en impulsores
- `manometro_alto` — Manómetro alto (>0,5 bar)
- `manometro_bajo` — Manómetro bajo (<0,2 bar)
- `sale_arena` — Sale arena por boquillas
- `limpiafondos_no_aspira` — Limpiafondos no aspira
- `salino_no_produce` — Salino no produce cloro
- `pierde_agua` — Piscina pierde agua
- `fondo_no_visible` — Fondo no visible / Cerrar baño

## Fichas no destacadas — 9

- `algas_recurrentes` — Algas recurrentes
- `agua_marrón` — Agua marrón
- `agua_espuma` — Agua con espuma
- `bomba_ruido` — Bomba hace ruido
- `manchas_metalicas` — Manchas metálicas
- `incrustaciones` — Incrustaciones calcáreas
- `mantenimiento_tormenta` — Mantenimiento tras tormenta
- `alta_carga_banyistas` — Piscina con alta carga de bañistas
- `regulador_ph` — Regulador de pH no mide bien

---

## Campos vacíos por ficha

- `que_no_hacer`: agua_turbia, agua_lechosa, ph_bajo, alcalinidad_baja, bomba_desceba, burbujas_impulsores, manometro_alto, manometro_bajo, sale_arena, limpiafondos_no_aspira, salino_no_produce, pierde_agua, fondo_no_visible, algas_recurrentes, agua_marrón, agua_espuma, bomba_ruido, manchas_metalicas, incrustaciones, mantenimiento_tormenta, alta_carga_banyistas, regulador_ph
- `construccion`: alcalinidad_baja, burbujas_impulsores, manometro_bajo, limpiafondos_no_aspira, agua_espuma, regulador_ph
- `cuando_derivar`: agua_lechosa, olor_cloro, alcalinidad_baja, alcalinidad_alta, cianurico_alto, fondo_no_visible, agua_espuma, mantenimiento_tormenta, alta_carga_banyistas
- `cuando_cerrar_bano`: alcalinidad_baja, alcalinidad_alta, cianurico_alto
- `modulo_relacionado`: limpiafondos_no_aspira, algas_recurrentes, agua_marrón, agua_espuma, manchas_metalicas, incrustaciones
- `fuentes`: agua_turbia, agua_lechosa, olor_cloro, cloro_no_aguanta, ph_alto, ph_bajo, alcalinidad_baja, alcalinidad_alta, cianurico_alto, bomba_no_aspira, bomba_desceba, burbujas_impulsores, manometro_alto, manometro_bajo, sale_arena, limpiafondos_no_aspira, salino_no_produce, pierde_agua, fondo_no_visible, algas_recurrentes, agua_marrón, agua_espuma, bomba_ruido, manchas_metalicas, incrustaciones, mantenimiento_tormenta, alta_carga_banyistas, regulador_ph

---

## Advertencias técnicas

> ✅  Sin advertencias.

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

Ver `docs/REVIEW.md` — la etiqueta "Largo (m)" para piscinas redondas se ha
cambiado a "Diámetro (m)" en la nueva app (aprobado por el usuario).
La fórmula es idéntica: `(diámetro/2)² × 3.14159 × profMedia`.
