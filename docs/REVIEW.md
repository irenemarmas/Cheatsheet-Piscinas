# REVIEW.md — Ítems pendientes de revisión

Este archivo recoge únicamente cosas que el desarrollador ha notado durante la
migración y que **no ha cambiado** por tratarse de contenido de seguridad o
decisiones que corresponde tomar al propietario del producto.

---

## 1. Campo "Largo" para piscinas redondas — ✅ RESUELTO

**Problema original:** En el HTML fuente, el campo de la calculadora para
piscinas redondas se etiquetaba como "Largo (m)", lo que podía confundir al
usuario (un círculo no tiene largo).

**Acción tomada:** Aprobado por el usuario durante la reunión de planificación.
El campo ahora se llama **"Diámetro (m)"** cuando se selecciona tipo
"Redonda". La fórmula es idéntica:

```
Volumen = (diámetro / 2)² × π × profundidad media
```

No hay cambio en el resultado matemático.

---

## 2. Discrepancia en el conteo de fichas

**Observado:** El footer del HTML fuente decía `"30 fichas"`, pero la
extracción programática encontró **29 fichas**. No se ha inventado ni
modificado ninguna ficha para cuadrar el número.

**Fichas extraídas (29):**

01. agua_verde
02. agua_turbia
03. agua_lechosa
04. olor_cloro
05. cloro_no_aguanta
06. ph_alto
07. ph_bajo
08. alcalinidad_baja
09. alcalinidad_alta
10. cianurico_alto
11. bomba_no_aspira
12. bomba_desceba
13. burbujas_impulsores
14. manometro_alto
15. manometro_bajo
16. sale_arena
17. limpiafondos_no_aspira
18. salino_no_produce
19. pierde_agua
20. fondo_no_visible
21. algas_recurrentes
22. agua_marrón
23. agua_espuma
24. bomba_ruido
25. manchas_metalicas
26. incrustaciones
27. mantenimiento_tormenta
28. alta_carga_banyistas
29. regulador_ph

**Acción recomendada:** Si existe una 30ª ficha que no estaba en el HTML
fuente que se proporcionó, añadirla al archivo `data/fichas.json` siguiendo
el esquema de `data/ficha.schema.json`. Ejecutar `npm run validate` después.

---

## 3. Fichas sin "cuándo derivar" ni "cuándo cerrar baño"

El validador emite advertencia (no error) para estas tres fichas, que no
tienen ninguna regla en los campos `cuando_derivar` ni `cuando_cerrar_bano`:

- `alcalinidad_baja` — pH inestable; no requiere cierre pero podría especificarse
- `alcalinidad_alta` — ídem
- `cianurico_alto`   — única solución es renovación de agua; podría aclararse en qué situación derivar

**Acción recomendada:** Revisar si se quiere añadir texto a esos campos.
Hasta que se decida, el validador lanza `warning` pero no falla el build.

---

## 4. Salino no produce — arbol_relacionado: null

La ficha `salino_no_produce` tiene `arbol_relacionado: null`. No existe árbol
de diagnóstico para el sistema salino.

**Acción recomendada (opcional):** Si se quiere, crear un árbol `salino_no_produce`
en `data/arboles.json` y actualizar el campo en la ficha.

---

*Ningún parámetro, fórmula, umbral de seguridad ni regla "cerrar baño" ha sido
modificado. Cualquier cambio en esos valores debe ser revisado por el
responsable técnico del producto antes de publicar.*
