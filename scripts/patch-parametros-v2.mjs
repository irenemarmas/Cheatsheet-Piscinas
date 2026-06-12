/**
 * patch-parametros-v2.mjs
 * Rewrite all "parametros" tables to 4-column SOP format:
 *   Parámetro | Rango objetivo | Qué indica si está fuera de rango | Acción SOP
 *
 * Run: node scripts/patch-parametros-v2.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const FICHAS_PATH = join(__dir, '../data/fichas.json');

// ── New parametros tables ──────────────────────────────────────────────────────
// Header row always: [col1, col2, col3, col4]
// Each data row: [valor, rango, que_indica, accion_sop]

const PARAMETROS_V2 = {

  // ── Agua química ──────────────────────────────────────────────────────────────

  agua_verde: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "pH",
        "7,2–7,6",
        "Alto (>7,8): el cloro activo (HClO) se reduce drásticamente, las algas prosperan. Bajo (<7,0): agua corrosiva e irritante.",
        "Corregir el pH ANTES de cualquier choque. Usar reductor o elevador de pH para piscinas; calcular dosis según volumen y etiqueta. Re medir tras recirculación completa."
      ],
      [
        "Cloro libre",
        "1–3 mg/L orientativo",
        "Bajo (<0,5): desinfección insuficiente, las algas se multiplican sin freno. Alto (>5): puede impedir el baño.",
        "Confirmar que el pH está en rango antes de dosificar. Aplicar cloro de choque (hipoclorito cálcico o sódico sin CYA) según volumen y etiqueta. Filtrar continuamente. Re medir a las 12–24 h."
      ],
      [
        "Cianúrico (CYA)",
        "30–50 mg/L orientativo",
        "Bajo (<20): el sol degrada el cloro libre en pocas horas. Alto (>100): el cloro queda bloqueado; el choque no tendrá efecto aunque el nivel parezca alto.",
        "Si CYA > 100: renovar agua 20–30 % ANTES del choque; no añadir más cloro estabilizado. Si CYA < 20: valorar estabilizante tras resolver el episodio verde. Re medir CYA tras el relleno antes de continuar."
      ],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo (anotarla como referencia)",
        "Alta (+0,3 bar sobre presión limpia): el filtro está cargado de algas muertas y no filtra bien. Muy baja: posible entrada de aire o falta de caudal.",
        "Si ha subido ~0,3 bar: hacer lavado y enjuague → LAVADO (2 min) → apagar bomba → ENJUAGUE (30 s) → apagar bomba → FILTRACIÓN. Apagar siempre la bomba antes de mover la válvula. Confirmar que la presión baja al valor limpio de referencia."
      ]
    ],
    interpretacion_resultados: "Prioridad: corregir pH → verificar CYA → aplicar choque → filtrar sin parar → re medir a las 12–24 h. Si el agua no aclara en 48 h con cloro y pH correctos, revisar CYA (puede estar bloqueando la desinfección)."
  },

  agua_turbia: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo (anotarla como referencia)",
        "Alta (+0,3 bar sobre presión limpia): filtro cargado, el agua no se filtra correctamente. Muy baja: posible bypass o entrada de aire.",
        "Si ha subido ~0,3 bar: lavar y enjuagar el filtro → LAVADO (2 min) → apagar bomba → ENJUAGUE (30 s) → apagar bomba → FILTRACIÓN. Apagar siempre la bomba antes de cada cambio de válvula. Confirmar que la presión baja al valor limpio."
      ],
      [
        "pH",
        "7,2–7,6",
        "Alto (>7,8): puede precipitar minerales y favorecer la turbidez. Bajo (<7,0): agua corrosiva; el flóculo no trabaja bien.",
        "Ajustar con reductor o elevador de pH para piscinas según lectura, volumen y etiqueta. Re medir tras recirculación completa antes de añadir floculante."
      ],
      [
        "Cloro libre",
        "1–3 mg/L orientativo",
        "Bajo (<0,5): desinfección insuficiente; puede ser causa de la turbidez orgánica. Alto (>5): puede interferir con algunos floculantes.",
        "Confirmar que el pH está en rango. Si el cloro está bajo, corregirlo antes de aplicar floculante. Calcular dosis según volumen y etiqueta."
      ],
      [
        "Dureza total (TH)",
        "200–400 mg/L",
        "Alta (>400 mg/L): precipitación de carbonato cálcico que puede causar turbidez blanquecina.",
        "Si dureza >400 mg/L: renovar parcialmente el agua (20–30 %) para diluir. Re medir dureza y pH tras el relleno antes de tratar."
      ]
    ],
    interpretacion_resultados: "Prioridad: comprobar el filtro → corregir pH → si turbidez persiste con filtración correcta y química en rango, aplicar floculante según etiqueta y filtrar en continuo 24–48 h. Re medir presión del filtro durante ese período."
  },

  agua_lechosa: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "pH",
        "7,2–7,6",
        "Alto (>7,8): favorece la precipitación de carbonatos que dan aspecto lechoso o blanquecino. Bajo (<7,0): agua corrosiva.",
        "Ajustar con reductor de pH para piscinas si está alto. Calcular dosis según volumen y etiqueta. Re medir tras recirculación antes de añadir antiincrustante."
      ],
      [
        "Dureza total (TH)",
        "200–400 mg/L",
        "Alta (>500 mg/L): precipitación masiva de carbonato cálcico → agua lechosa o completamente blanca.",
        "Si dureza >500 mg/L: renovar parcialmente el agua (20–30 %). Re medir dureza y pH tras el relleno. Añadir antiincrustante específico para piscinas según etiqueta."
      ],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Alta (>150 mg/L): junto con pH alto y dureza alta, accelera la precipitación de cal y el aspecto lechoso.",
        "Si alcalinidad alta junto con pH alto y dureza alta: corregir el pH primero. Valorar reducción de alcalinidad con ácido muriático en dosis escalonadas según etiqueta. Re medir a las 4 h antes de la siguiente dosis."
      ]
    ],
    interpretacion_resultados: "La causa principal suele ser la combinación de pH alto + dureza alta. Corregir el pH es el primer paso; si el agua no aclara, medir la dureza. Si la dureza supera 500 mg/L, la renovación parcial es necesaria antes de cualquier otro tratamiento."
  },

  olor_cloro: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Cloro libre",
        "1–3 mg/L",
        "Bajo (<0,5): el cloro libre no es el causante del olor si hay cloraminas presentes. Alto (>5): puede irritar; re medir tras 30 min de filtración.",
        "Si está bajo y hay olor fuerte: el culpable son las cloraminas, no la falta de cloro. Si está alto: comprobar cloro combinado antes de actuar."
      ],
      [
        "Cloro combinado (cloraminas)",
        "< 0,5 mg/L",
        "Alto (>0,5 mg/L): causa real del olor a cloro en piscinas. Indica materia orgánica (sudor, orina, cremas) sin oxidar.",
        "Si combinado >0,5 mg/L: aplicar choque de cloro (el cloro libre debe superar 10 × el valor de cloro combinado). Asegurar pH en 7,2–7,4 antes del choque. Filtrar y re medir a las 12–24 h."
      ],
      [
        "pH",
        "7,2–7,6",
        "Fuera de rango: altera la eficacia del cloro y puede aumentar la formación de cloraminas.",
        "Ajustar el pH a 7,2–7,4 antes del choque para maximizar la oxidación. Usar reductor o elevador de pH según lectura y etiqueta."
      ]
    ],
    interpretacion_resultados: "El olor a cloro en una piscina casi siempre indica exceso de cloraminas, no exceso de cloro libre. Si el cloro libre está en rango y el olor persiste, medir el cloro combinado; si supera 0,5 mg/L, aplicar choque."
  },

  cloro_no_aguanta: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Cianúrico (CYA)",
        "30–50 mg/L orientativo",
        "Bajo (<20 mg/L): el sol destruye el cloro libre en pocas horas. Alto (>100 mg/L): el cloro queda bloqueado y no hace efecto aunque el nivel parezca correcto.",
        "Si CYA < 20: añadir estabilizante (ácido isocianúrico) para llevar a 30–50 mg/L; calcular según volumen y etiqueta. Si CYA > 100: renovar agua 20–30 %; no añadir más cloro estabilizado. Re medir CYA tras el relleno antes de continuar."
      ],
      [
        "pH",
        "7,2–7,6",
        "Fuera de rango: el cloro libre trabaja con menos eficacia, lo que aumenta el consumo aparente. Por encima de 7,8, la eficacia cae a menos del 20 %.",
        "Ajustar con reductor o elevador de pH para piscinas antes de dosificar cloro. Calcular dosis según lectura, volumen y etiqueta. Re medir tras recirculación."
      ],
      [
        "Cloro combinado (cloraminas)",
        "< 0,5 mg/L",
        "Alto (>0,5 mg/L): alta demanda orgánica que consume el cloro libre de forma continua.",
        "Si combinado >0,5 mg/L: aplicar choque de cloro con pH en rango (dosis para superar 10 × el valor de combinado). Calcular según volumen y etiqueta. Filtrar y re medir a las 12–24 h."
      ],
      [
        "Cloro libre al atardecer",
        "≥ 1 mg/L tras un día completo de sol",
        "Bajo al final del día: el cloro no llega a la noche; confirma pérdida activa por UV (CYA bajo) o alta demanda orgánica.",
        "Revisar CYA: si está bajo, añadir estabilizante. Si el CYA está en rango, revisar el sistema de dosificación y aumentar la dosis diaria hasta estabilizar el nivel nocturno."
      ]
    ],
    interpretacion_resultados: "La causa más frecuente de pérdida rápida de cloro es CYA bajo (sol destruye el cloro) o CYA muy alto (cloro bloqueado). Medir el CYA es el primer paso antes de añadir más cloro."
  },

  ph_alto: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Baja (<80 mg/L): el pH sube y baja de forma errática. Alta (>120 mg/L): el pH queda 'anclado' hacia arriba y resiste la corrección con ácido.",
        "Si alcalinidad > 120 mg/L: corregir la alcalinidad PRIMERO con ácido muriático o corrector de alcalinidad en dosis pequeñas y escalonadas. Re medir a las 4 h. No tratar el pH hasta que la alcalinidad esté en rango."
      ],
      [
        "pH",
        "7,2–7,6",
        "Alto (>7,6): el cloro activo (HClO) se reduce drásticamente. Alto (>8,0): el cloro es prácticamente ineficaz; riesgo de formación de cal.",
        "Con la alcalinidad en rango: dosificar reductor de pH en dos mitades separadas 4 h para evitar sobredosis. Calcular cada dosis según volumen y etiqueta. Re medir antes de la segunda dosis y confirmar que no baja por debajo de 7,2."
      ]
    ],
    interpretacion_resultados: "Si el pH no baja tras añadir reductor, la causa casi siempre es alcalinidad alta. Corregir primero la alcalinidad y después el pH; hacerlo al revés requiere el doble de producto y puede desestabilizar el agua."
  },

  ph_bajo: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Baja (<80 mg/L): el pH baja de forma rápida e impredecible ante cualquier aporte ácido. Alta (>120 mg/L): el pH es difícil de subir con elevador estándar.",
        "Si alcalinidad < 80 mg/L: corregir PRIMERO con bicarbonato sódico o corrector de alcalinidad. Calcular dosis según volumen y etiqueta. Re medir a las 4–6 h antes de tratar el pH."
      ],
      [
        "pH",
        "7,2–7,6",
        "Muy bajo (<7,0): agua corrosiva; daña revestimiento, equipos metálicos y es irritante. Entre 7,0–7,2: fuera de rango, corregir en esta visita.",
        "Si pH < 7,0: corregir con urgencia usando elevador de pH para piscinas. Si entre 7,0–7,2: corregir igualmente. Calcular dosis según volumen y etiqueta; añadir con filtración activa. Re medir a las 4 h. No añadir cloro hasta que el pH esté en rango."
      ]
    ],
    interpretacion_resultados: "Si el pH sube al corregirlo pero vuelve a bajar en pocas horas, la causa es alcalinidad baja. Corregir primero la alcalinidad estabiliza el pH a largo plazo y reduce el consumo de elevador."
  },

  alcalinidad_baja: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Baja (<80 mg/L): el pH se vuelve inestable; pequeñas cantidades de ácido o CO₂ provocan caídas bruscas. Muy baja (<50 mg/L): el pH puede bajar a niveles corrosivos de forma inesperada.",
        "Añadir bicarbonato sódico o corrector de alcalinidad para piscinas. Calcular la dosis para llevar la TAC a 90–100 mg/L según volumen y etiqueta. Añadir con bomba en marcha y filtración activa (no verter en un solo punto). Re medir a las 4–6 h y ajustar si es necesario."
      ],
      [
        "pH (tras corregir alcalinidad)",
        "7,2–7,6",
        "Con alcalinidad baja, el pH puede haber caído por debajo de 7,0 y volverse corrosivo.",
        "Verificar el pH después de estabilizar la alcalinidad. Si el pH también está bajo, corregirlo con elevador de pH una vez la alcalinidad esté en rango (nunca al revés: el pH no se estabilizará si la alcalinidad está baja)."
      ]
    ],
    interpretacion_resultados: "La alcalinidad baja es la causa más frecuente de pH inestable. Corregir la alcalinidad primero y después comprobar el pH; el pH se estabilizará solo si la alcalinidad está en rango."
  },

  alcalinidad_alta: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Alta (>120 mg/L): el pH se queda 'anclado' hacia arriba y resiste la corrección. Muy alta (>180 mg/L): puede favorecer incrustaciones de cal en el vaso y los equipos.",
        "Añadir ácido muriático o corrector de alcalinidad en dosis pequeñas y escalonadas, con filtración activa. Calcular según volumen y etiqueta. No verter toda la dosis de una vez. Re medir a las 4 h antes de la siguiente dosis para evitar sobredosis y caída brusca del pH."
      ],
      [
        "pH (tras corregir alcalinidad)",
        "7,2–7,6",
        "Con alcalinidad alta, el pH tiende a subir aunque se corrija; puede volver a valores altos en pocas horas si la alcalinidad sigue alta.",
        "Verificar el pH 4–6 h después de corregir la alcalinidad. Si el pH sigue alto, tratar con reductor de pH una vez la alcalinidad esté en rango; de lo contrario, el pH volverá a subir."
      ]
    ],
    interpretacion_resultados: "La alcalinidad alta es la causa principal de pH 'rebelde' que no baja aunque se añada ácido. Reducir la alcalinidad en varias sesiones (no de golpe) y verificar el pH en cada re medición."
  },

  cianurico_alto: {
    parametros: [
      ["Nivel de CYA", "Estado", "Qué indica", "Acción SOP"],
      [
        "< 20 mg/L",
        "Bajo",
        "El sol destruye el cloro libre en pocas horas; la piscina queda sin desinfección efectiva durante el día.",
        "Añadir estabilizante (ácido isocianúrico) para llevar el CYA a 30–50 mg/L. Calcular dosis según volumen y etiqueta. No sobredosificar. Re medir a las 24 h antes de añadir más."
      ],
      [
        "30–50 mg/L",
        "Óptimo",
        "Balance correcto entre protección UV y eficacia del cloro.",
        "Mantener. Vigilar si se usa habitualmente cloro estabilizado (pastillas o granular con CYA); puede ir acumulando CYA con el tiempo."
      ],
      [
        "50–100 mg/L",
        "Elevado",
        "La eficacia del cloro empieza a reducirse; se necesita más cloro libre para obtener el mismo nivel de desinfección.",
        "No añadir más cloro estabilizado (pastillas con CYA). Usar exclusivamente cloro sin estabilizante para los tratamientos. Planificar renovación parcial de agua si el CYA sigue subiendo en las siguientes visitas."
      ],
      [
        "> 100 mg/L",
        "Crítico",
        "El cloro queda prácticamente bloqueado; los choques no tendrán efecto aunque el cloro libre parezca alto en el test.",
        "Renovar agua 20–30 % de inmediato. No añadir más cloro estabilizado bajo ningún concepto. Re medir el CYA tras el relleno completo antes de reanudar la dosificación normal."
      ]
    ],
    interpretacion_resultados: "El CYA no se puede reducir con productos químicos; la única solución es renovar agua. Si el CYA supera 100 mg/L, cualquier choque de cloro estabilizado será ineficaz. Usar siempre cloro sin CYA para los choques."
  },

  // ── Equipos ───────────────────────────────────────────────────────────────────

  bomba_no_aspira: {
    parametros: [
      ["Revisión", "Estado correcto", "Qué indica si está mal", "Acción SOP"],
      [
        "Nivel de agua en el prefiltro",
        "Lleno hasta el borde superior antes de arrancar",
        "Vacío o con poco agua: la bomba no puede cebar correctamente y aspira aire.",
        "Parar la bomba. Llenar el cuerpo del prefiltro con agua limpia hasta el borde usando una cubeta. Verificar la junta de la tapa y apretarla bien. Arrancar y observar si el prefiltro se mantiene lleno."
      ],
      [
        "Burbujas visibles en el prefiltro",
        "Sin burbujas durante el funcionamiento",
        "Burbujas continuas: entra aire por alguna unión de la línea de aspiración (junta, racor o tapa con fuga).",
        "Revisar y apretar la junta de la tapa del prefiltro. Inspeccionar todos los racores de la tubería de aspiración uno a uno. Engrasar juntas si están secas o aplastadas. Re arrancar y confirmar que desaparecen las burbujas."
      ],
      [
        "Nivel del agua en la piscina",
        "Al menos 5 cm por encima del borde del skimmer",
        "Por debajo del borde del skimmer: la bomba aspira aire en lugar de agua.",
        "Subir el nivel de la piscina añadiendo agua antes de arrancar la bomba. No arrancar con el skimmer al aire bajo ninguna circunstancia."
      ],
      [
        "Válvulas de aspiración",
        "Asas paralelas a la tubería (válvulas abiertas)",
        "Asas perpendiculares a la tubería (cerradas o parcialmente cerradas): reducen o cortan el caudal.",
        "Abrir completamente todas las válvulas de aspiración. Verificar que no haya válvulas intermedias cerradas por error tras un mantenimiento previo."
      ]
    ],
    interpretacion_resultados: "La mayoría de los casos de 'bomba no aspira' tienen causa simple: nivel bajo de agua en el prefiltro, nivel bajo en la piscina o válvula cerrada. Revisar estas tres cosas antes de buscar causas más complejas."
  },

  bomba_desceba: {
    parametros: [
      ["Revisión", "Estado correcto", "Qué indica si está mal", "Acción SOP"],
      [
        "Prefiltro se vacía con nivel correcto en la piscina",
        "Se mantiene lleno durante todo el funcionamiento",
        "Se vacía progresivamente: hay una entrada de aire activa en la línea de aspiración.",
        "Revisar y apretar la junta de la tapa del prefiltro. Inspeccionar todos los racores y uniones de la tubería de aspiración; apretar o cambiar los que presenten fuga o estén aflojados."
      ],
      [
        "Tiempo hasta descebado (rápido < 5 min)",
        "No debería descebarse durante el funcionamiento normal",
        "Descebado en menos de 5 min: fuga de aire significativa, normalmente en la tapa del prefiltro o en los racores principales.",
        "Revisar la tapa del prefiltro con especial atención: cambiar la junta si está aplastada o rota. Revisar la válvula de aspiración principal. Cambiar la pieza defectuosa antes de continuar."
      ],
      [
        "Tiempo hasta descebado (lento > 30 min)",
        "No debería descebarse durante el funcionamiento normal",
        "Descebado en más de 30 min: micro-fuga pequeña, posiblemente en un racor ligeramente aflojado o una junta desgastada.",
        "Engrasar o cambiar la junta de la tapa. Revisar y apretar uno a uno todos los racores de la línea de aspiración. Re arrancar y cronometrar: si tarda más de 2 h, la micro-fuga está controlada; vigilar en la siguiente visita."
      ]
    ],
    interpretacion_resultados: "Si la bomba ceba bien pero se desceba con el tiempo, siempre hay una entrada de aire. La velocidad del descebado orienta la magnitud de la fuga: rápido = fuga grande (tapa o racor principal), lento = micro-fuga (junta desgastada)."
  },

  burbujas_impulsores: {
    parametros: [
      ["Tipo de burbuja", "Estado correcto", "Qué indica si aparece", "Acción SOP"],
      [
        "Burbujas constantes y continuas durante todo el funcionamiento",
        "Sin burbujas en el impulsor ni en el agua impulsada",
        "Entrada de aire activa y continua en la línea de aspiración (junta, racor o tapa con fuga permanente).",
        "Revisar la junta de la tapa del prefiltro. Inspeccionar racores de aspiración uno a uno con la bomba en marcha para localizar la fuga. Engrasar juntas secas. Re arrancar y confirmar que desaparecen las burbujas."
      ],
      [
        "Burbujas intermitentes (aparecen y desaparecen)",
        "Sin burbujas en el impulsor ni en el agua impulsada",
        "El nivel de agua en la piscina fluctúa (el skimmer atrapa aire de forma puntual) o hay una micro-fuga que aparece en ciertas condiciones.",
        "Verificar que el nivel de la piscina está al menos 5 cm por encima del skimmer. Si el nivel es correcto, revisar juntas de la línea de aspiración en busca de micro-fugas que solo se manifiestan con el agua fría o caliente."
      ]
    ],
    interpretacion_resultados: "Las burbujas en el impulsor son siempre síntoma de entrada de aire. Burbujas constantes → fuga activa (resolver de inmediato). Burbujas intermitentes → nivel bajo de agua o micro-fuga (verificar nivel primero)."
  },

  manometro_alto: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo (anotarla como referencia; habitualmente 0,2–0,4 bar)",
        "Alta (+0,3 bar sobre la presión limpia de referencia): el filtro está cargado y el caudal se reduce significativamente.",
        "Hacer lavado y enjuague del filtro: → LAVADO (2 min con bomba en marcha) → apagar bomba → ENJUAGUE (30 s con bomba en marcha) → apagar bomba → FILTRACIÓN. Apagar SIEMPRE la bomba antes de cambiar la posición de la válvula selectora. Verificar que la presión baja al valor limpio de referencia."
      ],
      [
        "Caudal en los impulsores de retorno",
        "Caudal fuerte y sin burbujas",
        "Caudal débil aunque la presión sea alta: posible obstrucción adicional en la cestilla del skimmer, en el prefiltro o en las válvulas de retorno.",
        "Limpiar la cestilla del prefiltro y la del skimmer. Verificar que todas las válvulas de retorno están completamente abiertas. Arrancar y comprobar que la presión y el caudal son correctos."
      ]
    ],
    interpretacion_resultados: "Un manómetro alto casi siempre indica filtro cargado. La regla práctica: si ha subido ~0,3 bar respecto a la presión cuando estaba limpio, es hora de lavar. Anotar la presión limpia como referencia en cada visita."
  },

  manometro_bajo: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo (anotarla como referencia; habitualmente 0,2–0,4 bar)",
        "Baja (más de 0,1 bar por debajo de la presión limpia de referencia): posible entrada de aire, obstrucción en la aspiración, filtro recién lavado (normal) o manómetro defectuoso.",
        "1) Verificar que el nivel de la piscina está por encima del skimmer. 2) Comprobar que todas las válvulas de aspiración están abiertas. 3) Si la baja presión ocurre justo tras un lavado, es normal: esperar a que el filtro se cargue. 4) Si persiste sin causa aparente, revisar el manómetro: puede estar obstruido (limpiar la entrada) o roto (sustituir)."
      ],
      [
        "Caudal en los impulsores de retorno",
        "Caudal fuerte y sin burbujas",
        "Caudal débil con presión baja: la bomba no aspira correctamente (nivel bajo, válvula cerrada, prefiltro obstruido o entrada de aire).",
        "Limpiar la cestilla del prefiltro. Verificar el nivel de la piscina. Comprobar que todas las válvulas de aspiración están abiertas. Revisar la junta de la tapa del prefiltro si hay burbujas visibles."
      ]
    ],
    interpretacion_resultados: "La presión baja es menos urgente que la alta, pero indica que algo impide el caudal normal. Si aparece inmediatamente después de un lavado, no es un problema. Si aparece de forma continua o repentina, buscar la causa antes de seguir filtrando."
  },

  salino_no_produce: {
    parametros: [
      ["Revisión", "Estado correcto", "Qué indica si está fuera de rango o hay anomalía", "Acción SOP"],
      [
        "Salinidad (lectura del equipo)",
        "Rango del fabricante (habitualmente 3.000–5.000 ppm)",
        "Alarma de sal baja: la célula no puede electrolizar si la salinidad está por debajo del umbral del fabricante.",
        "Añadir sal de piscina de calidad sin anti-apelmazante. Calcular cantidad según volumen de agua y diferencia de salinidad (consultar tabla del fabricante). Filtrar varias horas para disolver completamente. Re medir salinidad antes de rearrancar la producción."
      ],
      [
        "Célula electrolítica (inspección visual)",
        "Placas sin depósitos ni coloración anormal",
        "Depósitos blancos (incrustación de cal) o coloración marrón: la célula está sucia y no produce con eficiencia.",
        "Limpiar la célula con vinagre diluido o el producto ácido recomendado por el fabricante. Dejar actuar según las instrucciones del fabricante; no sobrepasar el tiempo indicado. Aclarar bien con agua limpia. Reinstalar y verificar que la alarma desaparece."
      ],
      [
        "Temperatura del agua",
        "Por encima del umbral del fabricante (habitualmente > 15 °C)",
        "Temperatura baja (< 15 °C): los equipos salinos reducen o cortan la producción automáticamente. No es un fallo.",
        "Si la temperatura está por debajo del umbral, no es un fallo del equipo. Aumentar la dosificación manual con cloro líquido o granular sin CYA mientras dure el período frío. Reactivar el equipo cuando el agua supere el umbral."
      ],
      [
        "Caudal / alarma de flujo",
        "Caudal normal de filtración activa",
        "Alarma de flujo: el caudal es insuficiente para que la célula trabaje correctamente.",
        "Verificar que la bomba está en marcha y el prefiltro limpio. Comprobar que todas las válvulas están en posición correcta. Limpiar la cestilla del prefiltro si está obstruida. Rearrancar y confirmar que la alarma de flujo desaparece."
      ],
      [
        "Errores en el panel de control",
        "Sin alarmas activas",
        "Errores de sal / flujo / temperatura / célula: el equipo ha detectado una condición fuera de rango.",
        "Identificar el tipo de alarma antes de actuar: sal (añadir sal), flujo (revisar filtración), temperatura (esperar o complementar con cloro manual), célula (limpiar). Resolver la causa raíz. Hacer reset SOLO después de resolver la causa; un reset sin corregir el problema no resuelve nada."
      ]
    ],
    interpretacion_resultados: "Las causas más frecuentes son: salinidad baja (la más común), célula sucia y temperatura baja en invierno. Leer el código de error del panel antes de actuar; cada alarma tiene solución específica."
  },

  pierde_agua: {
    parametros: [
      ["Indicador", "Referencia normal", "Qué indica si está fuera de lo normal", "Acción SOP"],
      [
        "Velocidad de bajada del nivel",
        "Hasta 0,3–0,5 cm/día por evaporación en verano (variable según clima y exposición)",
        "Más de 1 cm/día: la pérdida supera la evaporación normal; hay fuga probable en el vaso o en el circuito.",
        "Hacer la prueba del cubo: poner un cubo lleno de agua sobre un escalón y marcar el nivel en cubo y piscina al mismo tiempo. Revisar ambos 24 h después. Si la piscina pierde más que el cubo, hay fuga estructural. Si pierden igual, es evaporación."
      ],
      [
        "Patrón de la pérdida (bomba en marcha vs. parada)",
        "Pérdida igual con bomba en marcha y parada (solo evaporación)",
        "Mayor pérdida con filtración en marcha: fuga en el circuito hidráulico (bajo presión). Mayor pérdida con bomba parada: fuga en el vaso o la lámina.",
        "Si la pérdida es mayor con filtración: revisar visualmente juntas de la bomba, válvulas, racores, calentador y colector. Buscar manchas de humedad o depósitos de cal en el suelo. Si la pérdida es mayor con bomba parada: inspeccionar el vaso, la lámina y las entradas de agua."
      ],
      [
        "Localización de la pérdida (nivel al que se estabiliza)",
        "El nivel no debería estabilizarse espontáneamente",
        "El nivel se estabiliza a la altura de un skimmer, boquillón o foco: la fuga está en ese elemento.",
        "Si el nivel se estabiliza a la altura de un elemento: desconectar o taponar ese elemento temporalmente y observar si la pérdida se detiene. Si se detiene, la fuga está en ese punto; reparar o derivar a especialista."
      ]
    ],
    interpretacion_resultados: "La prueba del cubo es el primer paso obligatorio para distinguir evaporación de fuga real. El patrón bomba en marcha / parada orienta si la fuga es en el circuito (presión) o en el vaso. La estabilización del nivel a una altura concreta localiza el punto exacto."
  },

  fondo_no_visible: {
    parametros: [
      ["Color del agua", "Referencia visual", "Causa probable", "Acción SOP"],
      [
        "Verde (cualquier tono, desde aguamarina a verde oscuro)",
        "Agua clara y transparente",
        "Proliferación de algas activa.",
        "Seguir el protocolo de la ficha Agua verde. No añadir más cloro sin antes corregir el pH y verificar el CYA; si el CYA > 100, el choque no tendrá efecto."
      ],
      [
        "Marrón (oscuro, rojizo o anaranjado)",
        "Agua clara y transparente",
        "Metales en suspensión (hierro o manganeso) u oxidación de materia orgánica.",
        "Seguir el protocolo de la ficha Agua marrón. No aplicar cloro de choque sin antes tratar los metales; el cloro puede precipitarlos y manchar permanentemente el vaso."
      ],
      [
        "Blanco o lechoso (opaco, no verdoso)",
        "Agua clara y transparente",
        "Precipitación de carbonato cálcico (dureza alta + pH alto) o sobredosis de algicida.",
        "Seguir el protocolo de la ficha Agua blanca o lechosa. Medir pH, dureza y alcalinidad antes de añadir cualquier producto."
      ],
      [
        "Gris o turbio sin color dominante",
        "Agua clara y transparente",
        "Filtración insuficiente, floculación deficiente o alta carga de partículas en suspensión (tierra, polvo, alta carga de bañistas).",
        "Seguir el protocolo de la ficha Agua turbia. Comprobar el estado del filtro y el tiempo de filtración diaria antes de añadir floculante."
      ]
    ],
    interpretacion_resultados: "El color del agua orienta directamente la causa y la ficha a seguir. No tratar sin diagnosticar: un choque de cloro puede empeorar el agua marrón (precipita metales) o ser ineficaz en agua verde con CYA alto."
  },

  // ── Fichas adicionales con tablas telegráficas ────────────────────────────────

  algas_recurrentes: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Cianúrico (CYA)",
        "30–50 mg/L orientativo",
        "Alto (>75 mg/L): el cloro queda progresivamente bloqueado; las algas aprovechan la desinfección deficiente para reaparecer visita tras visita.",
        "Si CYA entre 50–100 mg/L: no añadir más cloro estabilizado; usar cloro sin CYA para los choques. Si CYA > 100 mg/L: renovar agua 20–30 % y re medir antes de reanudar la dosificación habitual."
      ],
      [
        "Cloro libre (final del día)",
        "≥ 1 mg/L al atardecer",
        "Bajo de forma recurrente al final del día: la desinfección no llega a la noche, lo que permite que las algas se instalen.",
        "Revisar el sistema de dosificación. Corregir el pH a 7,2–7,4 para maximizar la eficacia del cloro. Aumentar la dosis o frecuencia de dosificación si el consumo es sistemáticamente alto."
      ],
      [
        "Circulación del agua",
        "Circulación uniforme en todo el vaso sin zonas muertas visibles",
        "Zonas sin movimiento de agua: el cloro no llega a esos rincones y el alga se instala allí primero.",
        "Revisar la orientación de los boquillones de retorno: deben apuntar hacia el fondo y crear una circulación en espiral que alcance todos los rincones. Si hay esquinas muertas persistentes, ajustar los ángulos."
      ]
    ],
    interpretacion_resultados: "Las algas recurrentes casi siempre tienen tres causas: CYA alto (cloro bloqueado), desinfección insuficiente de noche o zonas muertas en la circulación. Verificar los tres antes de decidir el tratamiento."
  },

  incrustaciones: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "pH",
        "7,2–7,6",
        "Alto (>7,8): el carbonato cálcico precipita con facilidad → incrustaciones en superficie, equipos y rejillas.",
        "Mantener el pH en rango con reductor de pH para piscinas. Calcular dosis según lectura, volumen y etiqueta. Re medir a las 4 h tras el tratamiento. No esperar a que el pH llegue a 8,0 para actuar."
      ],
      [
        "Dureza total (TH)",
        "200–400 mg/L",
        "Alta (>400 mg/L): junto con pH alto y alcalinidad alta, accelera la incrustación de cal en superficies y equipos.",
        "Si dureza > 400 mg/L: renovar parcialmente el agua (20–30 %) para diluir. Añadir antiincrustante específico para piscinas según etiqueta como tratamiento preventivo. Re medir dureza tras el relleno."
      ],
      [
        "Alcalinidad total (TAC)",
        "80–120 mg/L",
        "Alta (>150 mg/L): junto con pH y dureza altos, aumenta el índice de saturación y el riesgo de incrustación.",
        "Si alcalinidad alta junto con pH alto: reducir primero la alcalinidad con ácido muriático en dosis escalonadas con filtración activa. Re medir a las 4 h antes de tratar el pH."
      ]
    ],
    interpretacion_resultados: "Las incrustaciones son consecuencia de mantener el pH por encima de 7,8 durante períodos prolongados, especialmente con agua dura. Controlar el pH de forma regular es la mejor prevención."
  },

  alta_carga_banyistas: {
    parametros: [
      ["Parámetro", "Rango objetivo", "Qué indica si está fuera de rango", "Acción SOP"],
      [
        "Cloro libre",
        "1–3 mg/L orientativo",
        "Bajo (<0,5 mg/L tras alta carga de bañistas): el cloro se ha consumido rápidamente; riesgo real de desinfección insuficiente.",
        "Aplicar tratamiento de choque con cloro sin estabilizante. Asegurarse de que el pH está en 7,2–7,4 antes. Calcular dosis según volumen y etiqueta. Filtrar y re medir a las 12–24 h."
      ],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo",
        "Alta (+0,3 bar sobre presión limpia): el filtro se ha cargado con materia orgánica aportada por los bañistas.",
        "Lavar y enjuagar el filtro: → LAVADO (2 min) → apagar bomba → ENJUAGUE (30 s) → apagar bomba → FILTRACIÓN. Apagar siempre la bomba antes de cambiar la posición de la válvula selectora."
      ],
      [
        "Cloro combinado (cloraminas)",
        "< 0,5 mg/L",
        "Alto (>0,5 mg/L): la alta carga orgánica de los bañistas ha generado cloraminas; causa olor a cloro e irritación de ojos.",
        "Si combinado > 0,5 mg/L: aplicar choque de cloro con pH en rango (dosis para superar 10 × el valor de cloro combinado). Calcular según volumen y etiqueta. Re medir a las 12–24 h."
      ]
    ],
    interpretacion_resultados: "Después de un evento de alta carga (fiesta, apertura de temporada), verificar siempre: cloro libre, cloro combinado y presión del filtro. Los tres suelen estar fuera de rango al mismo tiempo."
  },

  limpiafondos_no_aspira: {
    parametros: [
      ["Revisión", "Estado correcto", "Qué indica si está mal", "Acción SOP"],
      [
        "Presión del filtro",
        "Presión limpia habitual del equipo",
        "Alta (+0,3 bar sobre presión limpia): el filtro está cargado y el caudal de aspiración del limpiafondos se reduce.",
        "Lavar y enjuagar el filtro: → LAVADO (2 min) → apagar bomba → ENJUAGUE (30 s) → apagar bomba → FILTRACIÓN. Apagar siempre la bomba antes de cambiar la válvula. Verificar que la presión baja al valor limpio de referencia."
      ],
      [
        "Posición de la válvula selectora",
        "En posición FILTRACIÓN o ASPIRACIÓN según el sistema instalado",
        "En posición incorrecta: el caudal no llega al limpiafondos o se dirige a otro circuito.",
        "Apagar la bomba. Cambiar la válvula a la posición correcta (ASPIRACIÓN si se usa limpiafondos manual, FILTRACIÓN si es automático o robot hidráulico). Arrancar y comprobar que el limpiafondos recupera la succión."
      ],
      [
        "Manguera del limpiafondos",
        "Sin pliegues, aplastamientos ni obstrucciones",
        "Manguera doblada, aplastada u obstruida: bloquea el caudal aunque la bomba y el filtro funcionen correctamente.",
        "Revisar toda la manguera de extremo a extremo y eliminar pliegues. Si hay suciedad acumulada en el interior, purgar la manguera. Reconectar al skimmer y comprobar la succión."
      ],
      [
        "Cestilla/bolsa interior del limpiafondos (robots hidráulicos)",
        "Cestilla o bolsa limpia y sin obstrucciones",
        "Cestilla llena de suciedad o bolsa obstruida: el robot no puede absorber agua y deja de moverse.",
        "Vaciar y limpiar la cestilla o bolsa interior del robot. Volver a introducirlo en el agua y comprobar que se mueve y aspira con normalidad."
      ]
    ],
    interpretacion_resultados: "En el 80 % de los casos, un limpiafondos que no aspira tiene el filtro sucio o la manguera con un pliegue. Revisar estos dos puntos primero antes de buscar causas más complejas."
  }
};

// ── Apply patches ──────────────────────────────────────────────────────────────

const fichas = JSON.parse(readFileSync(FICHAS_PATH, 'utf8'));
let patched = 0;

for (const ficha of fichas) {
  const patch = PARAMETROS_V2[ficha.id];
  if (!patch) continue;

  if (patch.parametros) ficha.parametros = patch.parametros;
  if (patch.interpretacion_resultados) ficha.interpretacion_resultados = patch.interpretacion_resultados;
  patched++;
}

writeFileSync(FICHAS_PATH, JSON.stringify(fichas, null, 2), 'utf8');
console.log(`✅ Patched parametros in ${patched} fichas. Total: ${fichas.length}`);
