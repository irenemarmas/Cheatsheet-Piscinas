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

---

## Fichas JSONL importadas — Nota de precisión pendiente de validación

Las siguientes 244 fichas fueron importadas desde el pack de 250 fichas SOP.
Cada una incluye `nota_precision` que indica qué debe validarse antes de uso operativo en piscina pública/colectiva.

### contaminacion_fecal_solida_en_el_vaso
**Contaminación fecal sólida en el vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### contaminacion_fecal_diarreica_en_el_vaso
**Contaminación fecal diarreica en el vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### vomito_con_materia_organica_en_el_agua
**Vómito con materia orgánica en el agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### vomito_solo_de_agua_tragada
**Vómito solo de agua tragada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sangre_visible_en_el_agua
**Sangre visible en el agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### animal_muerto_en_la_piscina
**Animal muerto en la piscina**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### animal_vivo_rescatado_del_agua
**Animal vivo rescatado del agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### orina_accidental_comunicada_por_banista
**Orina accidental comunicada por bañista**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cristales_rotos_dentro_del_vaso
**Cristales rotos dentro del vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### objeto_punzante_en_fondo_o_playa
**Objeto punzante en fondo o playa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### banista_con_diarrea_reciente_quiere_entrar
**Bañista con diarrea reciente quiere entrar**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### nino_con_panal_no_apto_en_piscina
**Niño con pañal no apto en piscina**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### exceso_de_banistas_en_piscina_pequena
**Exceso de bañistas en piscina pequeña**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### evento_con_alta_carga_organica
**Evento con alta carga orgánica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### resbalon_recurrente_en_playa_mojada
**Resbalón recurrente en playa mojada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ducha_lavapies_contaminado_o_sucio
**Ducha/lavapiés contaminado o sucio**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_de_reposicion_de_origen_dudoso
**Agua de reposición de origen dudoso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### aviso_de_legionella_en_instalacion_asociada
**Aviso de legionella en instalación asociada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### aerosoles_en_spa_o_hidromasaje_sin_control
**Aerosoles en spa o hidromasaje sin control**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### piscina_publica_sin_registro_de_autocontrol
**Piscina pública sin registro de autocontrol**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### incidencia_sanitaria_sin_parte_de_trabajo
**Incidencia sanitaria sin parte de trabajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### usuario_con_irritacion_generalizada_tras_bano
**Usuario con irritación generalizada tras baño**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ojos_rojos_generalizados_en_usuarios
**Ojos rojos generalizados en usuarios**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### quejas_de_picor_de_piel_tras_bano
**Quejas de picor de piel tras baño**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### derrame_de_producto_quimico_en_sala_tecnica
**Derrame de producto químico en sala técnica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### mezcla_accidental_de_cloro_y_acido
**Mezcla accidental de cloro y ácido**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### olor_irritante_intenso_tipo_gas_de_cloro
**Olor irritante intenso tipo gas de cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bidon_sin_etiqueta_o_producto_desconocido
**Bidón sin etiqueta o producto desconocido**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### envases_incompatibles_almacenados_juntos
**Envases incompatibles almacenados juntos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### producto_caducado_o_cristalizado
**Producto caducado o cristalizado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### dosificacion_manual_sin_epis
**Dosificación manual sin EPIs**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### salpicadura_quimica_en_piel_u_ojos
**Salpicadura química en piel u ojos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### polvo_quimico_inhalado_al_abrir_envase
**Polvo químico inhalado al abrir envase**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### vertido_de_acido_al_vaso_por_error
**Vertido de ácido al vaso por error**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### vertido_de_hipoclorito_concentrado_al_vaso
**Vertido de hipoclorito concentrado al vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tabletas_de_cloro_en_skimmer_con_equipo_parado
**Tabletas de cloro en skimmer con equipo parado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cloro_granulado_no_disuelto_sobre_liner
**Cloro granulado no disuelto sobre liner**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### productos_quimicos_cerca_de_cuadros_electricos
**Productos químicos cerca de cuadros eléctricos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sala_quimica_sin_ventilacion_suficiente
**Sala química sin ventilación suficiente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cubeto_de_retencion_lleno_o_roto
**Cubeto de retención lleno o roto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### manguera_de_dosificacion_rota_con_fuga_quimica
**Manguera de dosificación rota con fuga química**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### inyector_de_acido_obstruido_con_presion
**Inyector de ácido obstruido con presión**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### retorno_de_quimico_al_deposito
**Retorno de químico al depósito**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### producto_equivocado_en_deposito_de_dosificacion
**Producto equivocado en depósito de dosificación**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ph_alto_persistente
**pH alto persistente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ph_bajo_persistente
**pH bajo persistente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ph_inestable_durante_el_dia
**pH inestable durante el día**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### dureza_calcica_alta
**Dureza cálcica alta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### dureza_calcica_baja
**Dureza cálcica baja**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cloro_libre_bajo
**Cloro libre bajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cloro_libre_demasiado_alto
**Cloro libre demasiado alto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cloro_combinado_alto
**Cloro combinado alto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cloro_total_alto_con_cloro_libre_bajo
**Cloro total alto con cloro libre bajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### el_cloro_no_aguanta_de_un_dia_para_otro
**El cloro no aguanta de un día para otro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### demanda_de_cloro_muy_alta
**Demanda de cloro muy alta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### acido_cianurico_alto
**Ácido cianúrico alto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### acido_cianurico_bajo
**Ácido cianúrico bajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### uso_excesivo_de_cloro_estabilizado
**Uso excesivo de cloro estabilizado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### orp_bajo_con_cloro_libre_correcto
**ORP bajo con cloro libre correcto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### orp_alto_con_cloro_libre_bajo
**ORP alto con cloro libre bajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### lectura_dpd_incoherente
**Lectura DPD incoherente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### reactivos_de_test_caducados
**Reactivos de test caducados**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### medicion_hecha_con_muestra_mal_tomada
**Medición hecha con muestra mal tomada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_ph_correcto_pero_irritante
**Agua con pH correcto pero irritante**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_olor_fuerte_a_cloro
**Agua con olor fuerte a cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_sabor_salado_inesperado
**Agua con sabor salado inesperado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### conductividad_alta_sin_explicacion
**Conductividad alta sin explicación**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tds_alto_en_piscina_antigua
**TDS alto en piscina antigua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### oxidante_no_clorado_mal_dosificado
**Oxidante no clorado mal dosificado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bromo_bajo_en_spa
**Bromo bajo en spa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bromo_alto_en_spa
**Bromo alto en spa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### peroxido_o_sistema_alternativo_fuera_de_control
**Peróxido o sistema alternativo fuera de control**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### floculante_sobredosificado
**Floculante sobredosificado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clarificante_sobredosificado
**Clarificante sobredosificado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### antialgas_sobredosificado
**Antialgas sobredosificado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fosfatos_altos_con_algas_recurrentes
**Fosfatos altos con algas recurrentes**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### nitratos_altos_con_consumo_de_cloro
**Nitratos altos con consumo de cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_agresiva_corrosiva
**Agua agresiva corrosiva**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_incrustante_calcarea
**Agua incrustante calcárea**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### reequilibrado_tras_renovacion_parcial
**Reequilibrado tras renovación parcial**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### reequilibrado_tras_llenado_nuevo
**Reequilibrado tras llenado nuevo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### quimica_alterada_tras_tormenta
**Química alterada tras tormenta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_verde_con_algas_en_suspension
**Agua verde con algas en suspensión**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_pegadas_en_paredes
**Algas pegadas en paredes**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_negras_en_juntas_o_gresite
**Algas negras en juntas o gresite**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_mostaza_o_amarillas
**Algas mostaza o amarillas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_recurrentes_pese_a_cloro
**Algas recurrentes pese a cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### biofilm_en_linea_de_flotacion
**Biofilm en línea de flotación**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### biofilm_en_tuberias_o_spa
**Biofilm en tuberías o spa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### paredes_resbaladizas
**Paredes resbaladizas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_verde_transparente_por_metales
**Agua verde transparente por metales**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_marron_tras_anadir_cloro
**Agua marrón tras añadir cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_rojiza_o_color_te
**Agua rojiza o color té**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_negra_o_muy_oscura
**Agua negra o muy oscura**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_particulas_verdes_tras_cepillado
**Agua con partículas verdes tras cepillado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_en_zonas_muertas
**Algas en zonas muertas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_bajo_escalera_o_accesorios
**Algas bajo escalera o accesorios**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_en_manta_termica
**Algas en manta térmica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_en_rejilla_perimetral
**Algas en rejilla perimetral**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### algas_en_deposito_de_compensacion
**Algas en depósito de compensación**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### rebrote_de_algas_tras_vacaciones
**Rebrote de algas tras vacaciones**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### piscina_abandonada_con_algas_densas
**Piscina abandonada con algas densas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### materia_organica_acumulada_en_fondo
**Materia orgánica acumulada en fondo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### polen_confundido_con_algas
**Polen confundido con algas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### polvo_sahariano_confundido_con_algas
**Polvo sahariano confundido con algas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### limo_o_barro_tras_lluvia
**Limo o barro tras lluvia**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### mosquitos_o_larvas_en_piscina_parada
**Mosquitos o larvas en piscina parada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_turbia_general
**Agua turbia general**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_blanca_o_lechosa
**Agua blanca o lechosa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_nube_despues_de_choque
**Agua con nube después de choque**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fondo_borroso_pero_visible
**Fondo borroso pero visible**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fondo_no_visible_por_turbidez
**Fondo no visible por turbidez**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### particulas_finas_en_suspension
**Partículas finas en suspensión**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_espuma_superficial
**Agua con espuma superficial**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### espuma_persistente_tras_antialgas
**Espuma persistente tras antialgas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### aceites_solares_en_superficie
**Aceites solares en superficie**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### linea_de_flotacion_grasa
**Línea de flotación grasa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_tras_uso_intensivo
**Turbidez tras uso intensivo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_tras_anadir_producto
**Turbidez tras añadir producto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_por_mala_filtracion
**Turbidez por mala filtración**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_por_ph_alto
**Turbidez por pH alto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_por_floculacion_incorrecta
**Turbidez por floculación incorrecta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### floculos_depositados_no_aspirados
**Flóculos depositados no aspirados**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_brillante_pero_con_particulas
**Agua brillante pero con partículas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_con_polvo_recurrente_en_fondo
**Agua con polvo recurrente en fondo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_opaca_en_piscina_cubierta
**Agua opaca en piscina cubierta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbidez_persistente_mas_de_48_h
**Turbidez persistente más de 48 h**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### caudal_bajo_general
**Caudal bajo general**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### caudal_alto_con_mala_filtracion
**Caudal alto con mala filtración**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### impulsores_sin_fuerza
**Impulsores sin fuerza**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### una_boquilla_impulsa_menos_que_las_demas
**Una boquilla impulsa menos que las demás**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### burbujas_por_impulsores
**Burbujas por impulsores**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### aire_visible_en_prefiltro
**Aire visible en prefiltro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ruido_de_cavitacion_en_bomba
**Ruido de cavitación en bomba**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### skimmer_no_aspira
**Skimmer no aspira**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### skimmers_aspiran_desigual
**Skimmers aspiran desigual**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sumidero_no_aspira
**Sumidero no aspira**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### toma_de_limpiafondos_no_aspira
**Toma de limpiafondos no aspira**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### limpiafondos_manual_pierde_aspiracion
**Limpiafondos manual pierde aspiración**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvulas_mal_posicionadas
**Válvulas mal posicionadas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### circuito_de_aspiracion_obstruido
**Circuito de aspiración obstruido**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### circuito_de_impulsion_obstruido
**Circuito de impulsión obstruido**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### retorno_debil_tras_lavado
**Retorno débil tras lavado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### perdida_de_cebado_al_abrir_una_linea
**Pérdida de cebado al abrir una línea**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sala_tecnica_por_encima_del_nivel_del_agua
**Sala técnica por encima del nivel del agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sala_tecnica_muy_alejada_del_vaso
**Sala técnica muy alejada del vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tuberias_antiguas_de_pequeno_diametro
**Tuberías antiguas de pequeño diámetro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### zonas_muertas_por_mala_orientacion
**Zonas muertas por mala orientación**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### recirculacion_superficial_insuficiente
**Recirculación superficial insuficiente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### mala_recirculacion_profunda
**Mala recirculación profunda**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### deposito_de_compensacion_con_nivel_incorrecto
**Depósito de compensación con nivel incorrecto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### canal_rebosadero_sin_caudal_uniforme
**Canal rebosadero sin caudal uniforme**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_se_desceba
**Bomba se desceba**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_funciona_sin_agua
**Bomba funciona sin agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_no_arranca
**Bomba no arranca**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_arranca_y_se_para
**Bomba arranca y se para**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_sobrecalentada
**Bomba sobrecalentada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_hace_ruido_metalico
**Bomba hace ruido metálico**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_vibra_demasiado
**Bomba vibra demasiado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_pierde_agua_por_sello_mecanico
**Bomba pierde agua por sello mecánico**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tapa_de_prefiltro_pierde_aire
**Tapa de prefiltro pierde aire**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### junta_de_prefiltro_seca_o_deformada
**Junta de prefiltro seca o deformada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cesto_de_prefiltro_roto
**Cesto de prefiltro roto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### turbina_obstruida
**Turbina obstruida**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sentido_de_giro_incorrecto
**Sentido de giro incorrecto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### condensador_de_bomba_defectuoso
**Condensador de bomba defectuoso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### diferencial_salta_al_encender_bomba
**Diferencial salta al encender bomba**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### programador_no_activa_bomba
**Programador no activa bomba**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_sobredimensionada
**Bomba sobredimensionada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_infradimensionada
**Bomba infradimensionada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_incompatible_con_filtro
**Bomba incompatible con filtro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### manometro_no_se_mueve
**Manómetro no se mueve**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### filtro_de_arena_saturado
**Filtro de arena saturado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### arena_apelmazada_o_canalizada
**Arena apelmazada o canalizada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### vidrio_filtrante_colmatado
**Vidrio filtrante colmatado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cartucho_saturado
**Cartucho saturado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cartucho_deformado_o_roto
**Cartucho deformado o roto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### diatomeas_insuficientes
**Diatomeas insuficientes**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### diatomeas_vuelven_al_vaso
**Diatomeas vuelven al vaso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### colectores_de_filtro_rotos
**Colectores de filtro rotos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### crepinas_danadas
**Crepinas dañadas**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### arena_vuelve_por_impulsores
**Arena vuelve por impulsores**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### suciedad_vuelve_tras_aspirar
**Suciedad vuelve tras aspirar**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### lavado_de_filtro_no_limpia
**Lavado de filtro no limpia**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### enjuague_omitido_tras_lavado
**Enjuague omitido tras lavado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_selectora_hace_bypass
**Válvula selectora hace bypass**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### filtro_pierde_agua_por_junta
**Filtro pierde agua por junta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### purga_de_aire_del_filtro_defectuosa
**Purga de aire del filtro defectuosa**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### filtro_pequeno_para_la_piscina
**Filtro pequeño para la piscina**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_selectora_dura
**Válvula selectora dura**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_selectora_rota
**Válvula selectora rota**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_selectora_pierde_por_desague
**Válvula selectora pierde por desagüe**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_sale_a_desague_en_filtracion
**Agua sale a desagüe en filtración**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_de_aspiracion_agarrotada
**Válvula de aspiración agarrotada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### llave_de_impulsion_cerrada_por_error
**Llave de impulsión cerrada por error**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tuberia_de_aspiracion_con_entrada_de_aire
**Tubería de aspiración con entrada de aire**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tuberia_de_impulsion_con_fuga_visible
**Tubería de impulsión con fuga visible**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fuga_en_union_roscada
**Fuga en unión roscada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fuga_en_encolado_pvc
**Fuga en encolado PVC**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### golpe_de_ariete_al_parar_bomba
**Golpe de ariete al parar bomba**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### valvula_antirretorno_bloqueada
**Válvula antirretorno bloqueada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### desague_no_evacua_en_lavado
**Desagüe no evacua en lavado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tuberia_enterrada_sospecha_fuga
**Tubería enterrada sospecha fuga**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### fuga_en_sala_tecnica_inundando_equipos
**Fuga en sala técnica inundando equipos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clorador_salino_no_produce_cloro
**Clorador salino no produce cloro**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### salinidad_baja
**Salinidad baja**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### salinidad_alta
**Salinidad alta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### celula_salina_incrustada
**Célula salina incrustada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### celula_salina_agotada
**Célula salina agotada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clorador_marca_flujo_bajo
**Clorador marca flujo bajo**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clorador_marca_sal_baja_pero_test_normal
**Clorador marca sal baja pero test normal**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### produccion_insuficiente_en_verano
**Producción insuficiente en verano**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### ph_sube_continuamente_en_salino
**pH sube continuamente en salino**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### inversion_de_polaridad_no_limpia_celula
**Inversión de polaridad no limpia célula**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cables_de_celula_sulfatados
**Cables de célula sulfatados**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clorador_con_alarma_de_temperatura
**Clorador con alarma de temperatura**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### piscina_salina_con_corrosion_metalica
**Piscina salina con corrosión metálica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### agua_salina_con_sabor_muy_intenso
**Agua salina con sabor muy intenso**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### clorador_salino_tras_renovacion_de_agua
**Clorador salino tras renovación de agua**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### dosificador_ph_no_dosifica
**Dosificador pH no dosifica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### dosificador_ph_sobredosifica
**Dosificador pH sobredosifica**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### bomba_peristaltica_no_aspira_producto
**Bomba peristáltica no aspira producto**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### tubo_peristaltico_desgastado
**Tubo peristáltico desgastado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### inyector_quimico_obstruido
**Inyector químico obstruido**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sonda_ph_descalibrada
**Sonda pH descalibrada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sonda_ph_sucia
**Sonda pH sucia**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sonda_ph_agotada
**Sonda pH agotada**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### sonda_orp_lectura_incoherente
**Sonda ORP lectura incoherente**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### camara_de_analisis_sin_caudal
**Cámara de análisis sin caudal**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### controlador_en_modo_manual_por_error
**Controlador en modo manual por error**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### consigna_ph_incorrecta
**Consigna pH incorrecta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### consigna_orp_incorrecta
**Consigna ORP incorrecta**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### deposito_de_acido_vacio
**Depósito de ácido vacío**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### deposito_de_cloro_vacio
**Depósito de cloro vacío**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### robot_limpiafondos_no_arranca
**Robot limpiafondos no arranca**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### robot_se_para_a_los_pocos_minutos
**Robot se para a los pocos minutos**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### robot_no_sube_paredes
**Robot no sube paredes**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### robot_deja_zonas_sin_limpiar
**Robot deja zonas sin limpiar**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### robot_flota_o_pierde_traccion
**Robot flota o pierde tracción**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cable_de_robot_enrollado
**Cable de robot enrollado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### filtro_de_robot_saturado
**Filtro de robot saturado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### limpiafondos_hidraulico_se_queda_parado
**Limpiafondos hidráulico se queda parado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### limpiafondos_hidraulico_sube_demasiado
**Limpiafondos hidráulico sube demasiado**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

### cepillo_inadecuado_para_liner
**Cepillo inadecuado para liner**
> Ficha SOP base. Validar contra normativa autonómica/local, plan de autocontrol y manuales de fabricante antes de uso operativo en piscina pública/colectiva.

