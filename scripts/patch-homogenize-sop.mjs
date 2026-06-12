/**
 * patch-homogenize-sop.mjs — Adds v2 SOP fields to the 19 fichas not yet upgraded.
 *
 * New fields added to each ficha:
 *   situacion_visible       string
 *   riesgo_inmediato        string
 *   descartar_urgente       string[]
 *   comprobaciones_rapidas  string[]
 *   decision_sop            {condicion, pasos[]}[]
 *   protocolo               string[]
 *   calculo_rapido          string[]
 *   seguimiento             {tiempo, notas[]}[]
 *   cuando_parar_equipo     string[]
 *   fuentes                 {tipo, nombre, uso}[]
 *
 * Existing fields (id, titulo, categoria, prioridad, acciones, parametros, etc.)
 * are NOT touched unless explicitly included in the patch.
 *
 * Usage: node scripts/patch-homogenize-sop.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const FICHAS_PATH = join(__dir, '../data/fichas.json');

const PATCHES = {

  // ── 1. AGUA LECHOSA ───────────────────────────────────────────────────────
  agua_lechosa: {
    situacion_visible: "Agua opaca blanca o lechosa, visible desde el exterior. El fondo puede no distinguirse con claridad.",
    riesgo_inmediato: "Si el fondo no es visible → riesgo de seguridad; considerar cierre preventivo del baño.",
    descartar_urgente: [
      "¿Se ve el fondo? Si no → cerrar el baño antes de cualquier otra acción.",
      "¿Se acaba de añadir agua de red o de pozo sin tratar? → causa probable inmediata.",
      "¿Se ha dosificado recientemente floculante o clarificante en exceso? → segunda causa más frecuente."
    ],
    comprobaciones_rapidas: [
      "Medir pH, dureza total (TH) y alcalinidad total (TAC) antes de actuar.",
      "Comparar presión actual del filtro con su presión en limpio → si ha subido, el filtro está cargado.",
      "Revisar si el agua aportada recientemente era especialmente dura.",
      "Comprobar si hay depósitos blancos en paredes o equipos (precipitación de cal)."
    ],
    decision_sop: [
      {
        condicion: "Si pH > 7,8 y TH > 300 mg/L y TAC > 150 mg/L:",
        pasos: [
          "Corregir el pH PRIMERO → reductor de pH para piscinas, calcular dosis según volumen y etiqueta.",
          "Una vez pH en 7,2–7,4: aplicar antiincrustante/secuestrador de calcio según etiqueta.",
          "Filtrar continuamente durante al menos 24 h.",
          "Re medir TH y TAC tras 24–48 h."
        ]
      },
      {
        condicion: "Si se sospecha sobredosis de floculante/clarificante:",
        pasos: [
          "Detener la dosificación de floculante.",
          "Lavar el filtro (LAVADO → parar bomba → ENJUAGUE → parar bomba → FILTRACIÓN).",
          "Filtrar y dejar sedimentar 12 h; aspirar al desagüe.",
          "Re medir parámetros y corregir si es necesario."
        ]
      },
      {
        condicion: "Si el agua aportada es muy dura (TH > 400 mg/L):",
        pasos: [
          "Vaciar parcialmente (20–30 %) y reponer con agua de menor dureza si es posible.",
          "Aplicar antiincrustante preventivo según etiqueta.",
          "Corregir pH y TAC tras el llenado."
        ]
      }
    ],
    protocolo: [
      "1. Verificar visibilidad del fondo; si no es visible → cerrar el baño.",
      "2. Medir pH, TH y TAC.",
      "3. Corregir el pH hasta 7,2–7,4 con reductor de pH (calcular dosis según volumen y etiqueta).",
      "4. Aplicar antiincrustante/secuestrador de calcio según fabricante.",
      "5. Lavar el filtro si la presión ha subido.",
      "6. Filtrar continuamente al menos 24 h.",
      "7. Re medir pH, TH, TAC y turbidez a las 24 h.",
      "8. Repetir antiincrustante si es necesario hasta que el agua aclare.",
      "9. Registrar los parámetros y la cantidad de producto añadido."
    ],
    calculo_rapido: [
      "Dosis de reductor/elevador de pH: según etiqueta del producto y volumen total de la piscina.",
      "Volumen (m³) = largo × ancho × profundidad media.",
      "No usar dosis genéricas: cada producto tiene concentración distinta; leer siempre la etiqueta."
    ],
    seguimiento: [
      {
        tiempo: "A las 12 h",
        notas: [
          "Comprobar si el agua ha aclarado parcialmente.",
          "Medir pH → ajustar si ha vuelto a subir.",
          "Comprobar presión del filtro."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Medir pH, TH y TAC.",
          "Si sigue turbio: segunda dosis de antiincrustante y aspirar sedimentos al desagüe.",
          "Re valorar si es necesario renovar parte del agua."
        ]
      },
      {
        tiempo: "A las 48–72 h",
        notas: [
          "El agua debería estar clara y el fondo perfectamente visible.",
          "Confirmar parámetros en rango; registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Referencia para parámetros físico-químicos del agua de piscinas de uso colectivo en España."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Orientación técnica sobre precipitación de calcio y control de la dureza."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Procedimientos para la corrección de agua lechosa y uso de antiincrustantes."
      }
    ]
  },

  // ── 2. OLOR A CLORO ────────────────────────────────────────────────────────
  olor_cloro: {
    situacion_visible: "Olor fuerte a cloro en el agua o el ambiente. Los bañistas se quejan de irritación ocular o nasal. El agua puede parecer visualmente limpia.",
    riesgo_inmediato: "El olor a cloro NO indica exceso de cloro libre; indica cloraminas (cloro combinado). Si cloro combinado > 0,6 mg/L (RD 742/2013) → el baño en piscina colectiva no cumple normativa.",
    descartar_urgente: [
      "Medir AMBOS: cloro libre Y cloro total → calcular cloro combinado (combinado = total − libre).",
      "Si cloro libre < 0,5 mg/L: la desinfección es insuficiente → problema adicional urgente.",
      "¿Ha habido afluencia alta de bañistas reciente? → principal fuente de cloraminas."
    ],
    comprobaciones_rapidas: [
      "Medir cloro libre, cloro total y pH.",
      "Calcular: cloro combinado = cloro total − cloro libre.",
      "RD 742/2013 (piscinas colectivas): cloro combinado < 0,6 mg/L.",
      "Valor orientativo técnico general: < 0,5 mg/L.",
      "Comprobar si hay bañistas sin ducha previa o con mucha crema solar."
    ],
    decision_sop: [
      {
        condicion: "Si cloro combinado > 0,5 mg/L (superar umbral técnico) o > 0,6 mg/L (incumplimiento RD 742/2013 en piscinas colectivas):",
        pasos: [
          "Realizar supercloración: elevar el cloro libre hasta al menos 10 veces el valor del cloro combinado.",
          "Ejemplo orientativo: si cloro combinado = 1 mg/L → llevar cloro libre a ≥ 10 mg/L.",
          "Calcular la dosis de hipoclorito según el volumen real y la etiqueta del producto (sin estabilizante).",
          "Filtrar continuamente durante al menos 8–12 h.",
          "Medir cloro libre y combinado al final; no reabrir hasta que cloro libre haya bajado a rango seguro (≤ 5 mg/L) y combinado sea < 0,5 mg/L."
        ]
      },
      {
        condicion: "Si cloro libre < 0,5 mg/L:",
        pasos: [
          "Verificar pH (debe estar entre 7,2 y 7,6 para eficacia del cloro).",
          "Corregir pH si es necesario.",
          "Dosificar cloro según volumen y etiqueta.",
          "Re medir a las 2 h."
        ]
      },
      {
        condicion: "Si el problema es crónico (olor frecuente):",
        pasos: [
          "Revisar hábitos de los usuarios: ¿ducha obligatoria antes del baño?",
          "Aumentar la frecuencia de supercloración preventiva (semanal o tras cargas altas).",
          "Valorar aumentar la tasa de renovación de agua."
        ]
      }
    ],
    protocolo: [
      "1. Medir cloro libre, cloro total y pH.",
      "2. Calcular cloro combinado = cloro total − cloro libre.",
      "3. Si combinado > 0,5 mg/L: preparar supercloración.",
      "4. Calcular la dosis de cloro (hipoclorito sin estabilizante) según volumen y etiqueta.",
      "5. Aplicar el hipoclorito con la bomba en marcha, distribuyendo por el perímetro.",
      "6. Filtrar continuamente 8–12 h.",
      "7. Re medir: cloro libre y combinado.",
      "8. Si cloro libre > 5 mg/L: esperar antes de reabrir.",
      "9. Registrar fecha, hora, mediciones y cantidad de producto añadido."
    ],
    calculo_rapido: [
      "Cloro combinado (mg/L) = cloro total − cloro libre.",
      "Objetivo supercloración: cloro libre ≥ 10 × cloro combinado.",
      "Dosis de hipoclorito: según volumen (m³) y concentración del producto → siempre leer etiqueta."
    ],
    seguimiento: [
      {
        tiempo: "A las 2 h",
        notas: [
          "Verificar que el cloro libre ha subido al nivel de supercloración.",
          "Confirmar que el filtro está en funcionamiento."
        ]
      },
      {
        tiempo: "A las 8–12 h",
        notas: [
          "Medir cloro libre y combinado.",
          "Si cloro libre ≤ 5 mg/L y combinado < 0,5 mg/L → el baño puede reabrirse.",
          "Si combinado sigue alto → repetir supercloración."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Confirmar parámetros estables: cloro libre 1–3 mg/L, combinado < 0,5 mg/L, pH 7,2–7,6.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Establece el límite de cloro combinado < 0,6 mg/L para piscinas de uso colectivo en España."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Explica la formación de cloraminas y los valores orientativos de cloro combinado (< 0,5 mg/L)."
      },
      {
        tipo: "guia_tecnica",
        nombre: "CDC Model Aquatic Health Code (MAHC)",
        uso: "Protocolo de supercloración para eliminación de cloraminas."
      }
    ]
  },

  // ── 3. ALCALINIDAD BAJA ────────────────────────────────────────────────────
  alcalinidad_baja: {
    situacion_visible: "El técnico detecta que el pH oscila de forma errática entre mediciones, incluso sin haber añadido productos. Posible irritación de ojos reportada por usuarios.",
    riesgo_inmediato: "pH inestable dificulta mantener la eficacia del cloro. Sin riesgo inmediato grave si el cloro está en rango, pero hay que corregir para estabilizar.",
    descartar_urgente: [
      "Medir TAC antes de tocar el pH: si TAC < 60 mg/L, corregir TAC PRIMERO.",
      "Verificar que el medidor de pH está calibrado (una lectura errónea puede parecer TAC baja)."
    ],
    comprobaciones_rapidas: [
      "Medir TAC (alcalinidad total / carbonate hardness).",
      "Rango técnico operativo habitual: 80–120 mg/L.",
      "Medir pH: si oscila mucho con pequeñas dosis → TAC baja confirmada.",
      "Revisar historial: ¿se ha añadido ácido muriático recientemente en exceso?"
    ],
    decision_sop: [
      {
        condicion: "Si TAC < 60 mg/L:",
        pasos: [
          "Corregir TAC antes de ajustar el pH.",
          "Añadir bicarbonato sódico o corrector de alcalinidad específico para piscinas.",
          "Calcular la dosis según el volumen real de la piscina y la etiqueta del producto.",
          "Distribuir el producto con la bomba en marcha.",
          "Esperar 6–8 h y re medir TAC.",
          "Repetir si TAC sigue por debajo de 80 mg/L."
        ]
      },
      {
        condicion: "Si TAC entre 60–80 mg/L:",
        pasos: [
          "Añadir media dosis de corrector de alcalinidad.",
          "Re medir TAC a las 6–8 h.",
          "Ajustar el pH solo cuando TAC esté entre 80–120 mg/L."
        ]
      }
    ],
    protocolo: [
      "1. Medir TAC y pH.",
      "2. Si TAC < 80 mg/L: calcular dosis de bicarbonato sódico según volumen y etiqueta.",
      "3. Con la bomba en marcha, disolver el bicarbonato en un cubo con agua y verter en el vaso.",
      "4. Filtrar al menos 6–8 h.",
      "5. Re medir TAC.",
      "6. Si TAC entre 80–120 mg/L: ajustar pH si es necesario.",
      "7. No añadir el corrector de alcalinidad y el corrector de pH al mismo tiempo.",
      "8. Registrar mediciones antes y después y la cantidad añadida."
    ],
    calculo_rapido: [
      "Dosis de bicarbonato sódico: según etiqueta del producto y volumen de la piscina.",
      "Volumen (m³) = largo × ancho × profundidad media.",
      "Hacer el cálculo para el incremento real de TAC necesario; no usar dosis genéricas."
    ],
    seguimiento: [
      {
        tiempo: "A las 6–8 h",
        notas: [
          "Re medir TAC y pH.",
          "Si TAC < 80: añadir segunda dosis según etiqueta.",
          "No ajustar pH hasta que TAC esté en rango."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Confirmar TAC entre 80–120 mg/L y pH entre 7,2–7,6.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Parámetros físico-químicos de referencia para piscinas de uso colectivo en España."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Importancia de la alcalinidad como tampón del pH y rangos técnicos recomendados."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Procedimiento de corrección de TAC baja con bicarbonato sódico."
      }
    ]
  },

  // ── 4. ALCALINIDAD ALTA ────────────────────────────────────────────────────
  alcalinidad_alta: {
    situacion_visible: "El pH se mantiene stubbornly alto y no baja a pesar de haber añadido reductor de pH. Posible agua ligeramente turbia u opaca.",
    riesgo_inmediato: "pH persistentemente alto reduce la eficacia del cloro. Sin riesgo inmediato si el cloro está presente, pero la desinfección es subóptima.",
    descartar_urgente: [
      "Medir TAC: si TAC > 150 mg/L, es la causa del pH 'anclado'.",
      "No añadir más reductor de pH sin medir la TAC; podría causar sobredosificación ácida."
    ],
    comprobaciones_rapidas: [
      "Medir TAC y pH.",
      "Rango técnico operativo habitual: 80–120 mg/L.",
      "Si TAC > 150 y pH > 7,8: TAC alta es la causa del pH resistente.",
      "Revisar historial: ¿se ha añadido mucho bicarbonato o carbonato recientemente?"
    ],
    decision_sop: [
      {
        condicion: "Si TAC > 150 mg/L:",
        pasos: [
          "Bajar la TAC en sesiones escalonadas (nunca de golpe).",
          "Añadir ácido muriático (ácido clorhídrico diluido para piscinas) en pequeñas dosis.",
          "Calcular la dosis según el volumen real y la etiqueta del producto.",
          "Con la bomba en marcha, verter lentamente cerca de un impulsor de retorno.",
          "Esperar 8–12 h y re medir TAC y pH antes de la siguiente dosis.",
          "Objetivo: bajar TAC hasta 80–120 mg/L en 2–3 sesiones."
        ]
      },
      {
        condicion: "Si TAC entre 120–150 mg/L:",
        pasos: [
          "Aplicar media dosis de ácido muriático.",
          "Re medir TAC a las 8 h.",
          "Ajustar pH solo cuando TAC esté en rango."
        ]
      }
    ],
    protocolo: [
      "1. Medir TAC y pH.",
      "2. Calcular la dosis de ácido muriático según volumen y etiqueta (primera sesión = dosis parcial).",
      "3. Con la bomba en marcha, verter el ácido lentamente cerca de un impulsor. NUNCA verter el ácido concentrado directamente en el vaso sin diluir previamente.",
      "4. Usar EPIs: gafas y guantes resistentes a ácidos.",
      "5. Filtrar durante 8–12 h.",
      "6. Re medir TAC y pH.",
      "7. Repetir en sesiones separadas hasta alcanzar TAC 80–120 mg/L.",
      "8. Una vez TAC en rango, ajustar pH con mayor precisión.",
      "9. Registrar cada sesión: dosis, hora, medición antes y después."
    ],
    calculo_rapido: [
      "Dosis de ácido muriático: según etiqueta del producto y volumen de la piscina.",
      "Hacer el cálculo para el descenso necesario de TAC; no usar dosis genéricas.",
      "Nunca añadir toda la dosis calculada de golpe; dividir en al menos 2–3 sesiones."
    ],
    seguimiento: [
      {
        tiempo: "A las 8–12 h (tras cada sesión)",
        notas: [
          "Re medir TAC y pH.",
          "Si TAC > 120: aplicar segunda dosis parcial.",
          "No mezclar con otros productos."
        ]
      },
      {
        tiempo: "A las 24–48 h",
        notas: [
          "Confirmar TAC entre 80–120 mg/L y pH entre 7,2–7,6.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Parámetros físico-químicos de referencia para piscinas de uso colectivo en España."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Relación entre alcalinidad, pH y eficacia de la desinfección."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Procedimiento de reducción de TAC alta con ácido muriático en sesiones."
      }
    ]
  },

  // ── 5. BURBUJAS EN IMPULSORES ─────────────────────────────────────────────
  burbujas_impulsores: {
    situacion_visible: "Burbujas de aire visibles saliendo por los boquillones de retorno (impulsores). Posible borboteo o turbulencia anómala en la superficie.",
    riesgo_inmediato: "Si hay cavitación severa (ruido fuerte, vibración de la bomba) → riesgo de daño a la bomba. Parar equipo si se detecta.",
    descartar_urgente: [
      "¿El nivel del agua está por debajo del skimmer? → causa inmediata; rellenar.",
      "¿La bomba hace ruido de gravilla o vibra? → cavitación; parar bomba."
    ],
    comprobaciones_rapidas: [
      "Comprobar nivel del agua: debe cubrir el skimmer al menos 2–3 cm.",
      "Observar el patrón de burbujas: ¿constantes o intermitentes?",
      "Burbujas constantes → fuga activa de aire en la línea de aspiración.",
      "Burbujas intermitentes → nivel bajo o micro-fuga.",
      "Inspeccionar visualmente la tapa y junta del prefiltro de la bomba.",
      "Revisar que las válvulas de aspiración estén completamente abiertas."
    ],
    decision_sop: [
      {
        condicion: "Si el nivel del agua está bajo (skimmer en seco o casi):",
        pasos: [
          "Rellenar la piscina hasta el nivel correcto (mitad del skimmer).",
          "Comprobar que no hay fuga de agua (ver ficha 'pierde_agua').",
          "Re arrancar la bomba y verificar que las burbujas desaparecen."
        ]
      },
      {
        condicion: "Si el nivel es correcto y las burbujas son constantes:",
        pasos: [
          "Parar la bomba.",
          "Revisar y apretar la tapa del prefiltro → comprobar el estado del o-ring/junta.",
          "Aplicar vaselina técnica al o-ring si está seco o agrietado; sustituir si está deteriorado.",
          "Revisar todas las uniones roscadas y bridas en la línea de aspiración.",
          "Arrancar la bomba y comprobar si persisten las burbujas.",
          "Si persisten → inspeccionar tuberías de aspiración en busca de fisuras."
        ]
      },
      {
        condicion: "Si hay cavitación (ruido intenso, vibración):",
        pasos: [
          "Parar la bomba de inmediato.",
          "Identificar y resolver la causa de entrada de aire antes de volver a arrancar.",
          "No arrancar la bomba en seco."
        ]
      }
    ],
    protocolo: [
      "1. Comprobar nivel del agua → rellenar si es necesario.",
      "2. Parar la bomba.",
      "3. Revisar tapa del prefiltro: apretar y comprobar o-ring.",
      "4. Revisar válvulas de aspiración: deben estar completamente abiertas.",
      "5. Revisar uniones y bridas en la línea de aspiración.",
      "6. Arrancar la bomba y observar durante 2–3 min.",
      "7. Si las burbujas persisten: inspeccionar tuberías de aspiración (fisuras, juntas sueltas).",
      "8. Registrar la causa encontrada y la solución aplicada."
    ],
    calculo_rapido: [],
    seguimiento: [
      {
        tiempo: "Inmediatamente tras la reparación",
        notas: [
          "Arrancar la bomba y observar boquillones durante 5 min.",
          "Confirmar ausencia de burbujas y caudal normal."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Verificar que no han vuelto las burbujas.",
          "Comprobar presión del filtro (debería estar en rango normal).",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar la bomba de inmediato si se detecta cavitación: ruido fuerte (tipo gravilla), vibración excesiva o calor en el cuerpo de la bomba.",
      "No arrancar en seco (sin agua en el prefiltro).",
      "Parar si el ruido es repentino e intenso aunque la causa no sea aún clara."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Instrucciones específicas del fabricante de la bomba para diagnóstico de entrada de aire y mantenimiento del prefiltro."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico y corrección de entradas de aire en circuitos hidráulicos de piscinas."
      }
    ]
  },

  // ── 6. MANÓMETRO ALTO ─────────────────────────────────────────────────────
  manometro_alto: {
    situacion_visible: "El manómetro del filtro marca una presión notablemente superior a la presión habitual en limpio (normalmente ≥ 0,5 bar por encima del valor en limpio). El caudal en los boquillones puede estar reducido.",
    riesgo_inmediato: "Si la presión supera 1 bar por encima de la presión en limpio (o el límite indicado por el fabricante) → riesgo de rotura del filtro. Parar equipo.",
    descartar_urgente: [
      "Leer la presión actual y compararla con la presión en limpio (debe estar registrada en el parte).",
      "Si presión ≥ 1 bar sobre presión en limpio o supera el límite del fabricante → parar la bomba antes de actuar."
    ],
    comprobaciones_rapidas: [
      "Anotar la presión actual del manómetro.",
      "Comparar con la presión en limpio del filtro (valor de referencia tras el último lavado).",
      "Diferencia > 0,5 bar → filtro cargado, lavado necesario.",
      "Comprobar que la válvula selectora (multivía) no está en posición incorrecta.",
      "Comprobar si el manómetro está en buen estado (aguja que no vuelve a cero = manómetro defectuoso)."
    ],
    decision_sop: [
      {
        condicion: "Si presión ≥ 0,5 bar sobre presión en limpio y < límite del fabricante:",
        pasos: [
          "Realizar lavado del filtro siguiendo el protocolo correcto (ver pasos en protocolo).",
          "Re medir presión tras el lavado.",
          "Si la presión no baja después del lavado → revisar si el lecho de arena está apelmazado o hay cuerpos extraños."
        ]
      },
      {
        condicion: "Si presión supera el límite del fabricante o > 1 bar sobre presión en limpio:",
        pasos: [
          "Parar la bomba de inmediato.",
          "No intentar lavar con presión excesiva.",
          "Esperar a que baje la presión antes de manipular la válvula.",
          "Llamar a técnico cualificado si no se normaliza."
        ]
      }
    ],
    protocolo: [
      "1. Anotar la presión actual.",
      "2. Parar la bomba.",
      "3. Girar la válvula selectora a posición LAVADO (BACKWASH). NUNCA girar la válvula con la bomba en marcha.",
      "4. Arrancar la bomba y lavar durante 2–3 min (hasta que el agua salga clara por el visor).",
      "5. Parar la bomba.",
      "6. Girar la válvula selectora a posición ENJUAGUE (RINSE).",
      "7. Arrancar la bomba y enjuagar durante 30–60 s.",
      "8. Parar la bomba.",
      "9. Girar la válvula selectora a posición FILTRACIÓN.",
      "10. Arrancar la bomba y anotar la nueva presión.",
      "11. Registrar fecha, hora, presión antes y después del lavado."
    ],
    calculo_rapido: [],
    seguimiento: [
      {
        tiempo: "Inmediatamente tras el lavado",
        notas: [
          "Comprobar que la presión ha bajado al rango normal (presión en limpio ± 0,1 bar).",
          "Verificar caudal en boquillones."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Re leer la presión para confirmar que no sube de nuevo rápidamente.",
          "Si sube rápido de nuevo → posible contaminación severa; revisar carga orgánica o considerar cambio de arena."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar la bomba de inmediato si la presión supera el límite indicado por el fabricante o supera en > 1 bar la presión en limpio.",
      "NUNCA cambiar la posición de la válvula selectora (multivía) con la bomba en marcha → riesgo de rotura del filtro."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Presiones máximas de trabajo y procedimiento de lavado específico del filtro instalado."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Protocolo estándar de lavado de filtros de arena (LAVADO → ENJUAGUE → FILTRACIÓN)."
      }
    ]
  },

  // ── 7. MANÓMETRO BAJO ─────────────────────────────────────────────────────
  manometro_bajo: {
    situacion_visible: "El manómetro marca una presión anormalmente baja o cero con la bomba en marcha. El caudal en los boquillones puede estar reducido o ser nulo.",
    riesgo_inmediato: "Si la presión cae a 0 con la bomba arrancada → la bomba puede estar funcionando en seco → riesgo de daño al sello mecánico. Parar bomba.",
    descartar_urgente: [
      "¿La presión es exactamente 0 con la bomba en marcha? → parar la bomba; puede estar en seco.",
      "¿El nivel del agua está por debajo del skimmer? → causa inmediata."
    ],
    comprobaciones_rapidas: [
      "Comparar la presión actual con la presión habitual en limpio.",
      "Comprobar el nivel del agua: debe cubrir el skimmer.",
      "¿La bomba acaba de recibir un lavado? → la presión baja es normal justo después del lavado.",
      "Comprobar el prefiltro de la bomba: ¿está lleno de hojas u obstrucción?",
      "Revisar si hay aire en el cuerpo de la bomba (ver ficha 'burbujas_impulsores').",
      "Comprobar si el manómetro está defectuoso (aguja pegada en 0)."
    ],
    decision_sop: [
      {
        condicion: "Si el nivel del agua está bajo:",
        pasos: [
          "Rellenar la piscina hasta el nivel correcto.",
          "Re arrancar la bomba y verificar normalización de presión."
        ]
      },
      {
        condicion: "Si el prefiltro está obstruido:",
        pasos: [
          "Parar la bomba.",
          "Limpiar la cestilla del prefiltro.",
          "Cebar la bomba si es necesario (llenar el cuerpo de la bomba con agua).",
          "Arrancar la bomba y comprobar la presión."
        ]
      },
      {
        condicion: "Si hay entrada de aire:",
        pasos: [
          "Seguir el protocolo de la ficha 'burbujas_impulsores'."
        ]
      },
      {
        condicion: "Si el manómetro parece defectuoso (presión 0 aunque el caudal es normal):",
        pasos: [
          "Sustituir el manómetro.",
          "Hasta la sustitución: controlar el estado del filtro por el caudal en boquillones."
        ]
      }
    ],
    protocolo: [
      "1. Comprobar el nivel del agua y el estado del skimmer.",
      "2. Parar la bomba.",
      "3. Limpiar la cestilla del prefiltro.",
      "4. Revisar y apretar la tapa del prefiltro (o-ring en buen estado).",
      "5. Cebar la bomba si ha perdido el cebado.",
      "6. Arrancar la bomba y observar el manómetro durante 1–2 min.",
      "7. Si la presión sigue en 0 con caudal nulo → posible obstrucción en aspiración; inspeccionar línea.",
      "8. Si la presión sigue en 0 pero hay caudal → manómetro defectuoso; sustituir.",
      "9. Registrar la causa y la solución."
    ],
    calculo_rapido: [],
    seguimiento: [
      {
        tiempo: "Inmediatamente tras la corrección",
        notas: [
          "Verificar presión y caudal en boquillones.",
          "Confirmar que la bomba no hace ruidos anómalos."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Re leer la presión para confirmar estabilidad.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar la bomba inmediatamente si la presión es 0 con la bomba arrancada y no hay caudal → bomba posiblemente en seco.",
      "No arrancar una bomba en seco (sin agua en el prefiltro y cuerpo de la bomba)."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Presiones de trabajo normales, procedimiento de cebado y mantenimiento del prefiltro."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico de presión baja en filtros de arena."
      }
    ]
  },

  // ── 8. SALE ARENA DEL FILTRO ──────────────────────────────────────────────
  sale_arena: {
    situacion_visible: "Arena visible en el fondo de la piscina, especialmente cerca de los boquillones de retorno. El agua puede aparecer ligeramente turbia con partículas en suspensión.",
    riesgo_inmediato: "Continuar filtrando con arena retornando al vaso deteriora la arena del filtro y puede dañar la bomba. Parar el equipo.",
    descartar_urgente: [
      "Parar la bomba inmediatamente para no seguir introduciendo arena en la piscina.",
      "No lavar el filtro antes de inspeccionar el interior → si hay un lateral roto, el lavado empeora el problema."
    ],
    comprobaciones_rapidas: [
      "Comprobar si la arena vuelve solo por algunos boquillones (orientativo sobre qué lateral está afectado).",
      "¿La arena es fina y homogénea? → posible arena de granulometría incorrecta.",
      "¿Se hizo recientemente un lavado agresivo? → puede haber desplazado laterales."
    ],
    decision_sop: [
      {
        condicion: "Si sale arena por los boquillones de retorno:",
        pasos: [
          "Parar la bomba de inmediato.",
          "Vaciar el agua del filtro hasta poder acceder al interior.",
          "Inspeccionar los laterales (brazos colectores) y el brazo central.",
          "Sustituir las piezas dañadas (laterales rotos, juntas deterioradas).",
          "Recargar el filtro con arena de sílice calibrada (granulometría según fabricante, típicamente 0,4–0,8 mm).",
          "Realizar un lavado de inicialización antes de poner en filtración.",
          "Arrancar y verificar que no vuelve arena."
        ]
      }
    ],
    protocolo: [
      "1. Parar la bomba de inmediato.",
      "2. Cerrar las válvulas de aspiración y retorno.",
      "3. Vaciar el filtro (posición VACIADO o purga).",
      "4. Retirar la arena con una pala o aspirador de taller.",
      "5. Inspeccionar todos los laterales y el brazo central del colector.",
      "6. Sustituir los laterales rotos o el colector si está dañado.",
      "7. Recargar con arena de sílice nueva de la granulometría indicada por el fabricante.",
      "8. Llenar el filtro de agua antes de cerrarlo para no romper los laterales al arrancar.",
      "9. Realizar posición LAVADO durante 3–5 min → parar → ENJUAGUE 1 min → parar → FILTRACIÓN.",
      "10. Arrancar y observar boquillones: confirmar que no vuelve arena.",
      "11. Registrar los componentes sustituidos y la cantidad de arena añadida."
    ],
    calculo_rapido: [
      "Cantidad de arena según el diámetro del filtro: consultar manual del fabricante (ejemplo orientativo: filtro de 600 mm → aprox. 75–100 kg, variable según modelo).",
      "No usar arena de playa ni arena de obra: usar exclusivamente arena de sílice calibrada para piscinas."
    ],
    seguimiento: [
      {
        tiempo: "Inmediatamente tras la reparación",
        notas: [
          "Observar boquillones durante 5–10 min para confirmar ausencia de arena.",
          "Aspirar la arena acumulada en el fondo de la piscina."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Comprobar el fondo de la piscina: no debe haber nuevos depósitos de arena.",
          "Medir presión del filtro: debe estar en el rango de presión en limpio.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar la bomba de inmediato al detectar arena saliendo por los boquillones.",
      "No volver a arrancar hasta haber inspeccionado y reparado el interior del filtro."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Especificaciones de los laterales colectores, granulometría de arena recomendada y procedimiento de recarga del filtro."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico y reparación de fugas de arena en filtros de piscina."
      }
    ]
  },

  // ── 9. LIMPIAFONDOS NO ASPIRA ─────────────────────────────────────────────
  limpiafondos_no_aspira: {
    situacion_visible: "El limpiafondos (manual o automático hidráulico) está en el agua pero no aspira suciedad, no se mueve o el caudal de aspiración es débil.",
    riesgo_inmediato: "Sin riesgo inmediato de salud, pero el fondo sucio favorece la proliferación de algas y bacterias a medio plazo.",
    descartar_urgente: [
      "Si es un robot eléctrico: verificar que el cable no está dañado y no hay agua en el motor antes de manipular → riesgo eléctrico. No manipular el robot con electricidad conectada.",
      "Comprobar primero si el filtro está cargado (manómetro alto) → sin filtración, no hay aspiración."
    ],
    comprobaciones_rapidas: [
      "Leer el manómetro del filtro: si está alto → filtro cargado es la causa.",
      "Comprobar si la cestilla del prefiltro de la bomba está llena.",
      "Para limpiafondos manual: ¿la manguera está doblada o tiene algún tramo roto?",
      "Para limpiafondos hidráulico automático: ¿la válvula de aspiración está en posición correcta?",
      "Para robot eléctrico: ¿el filtro del robot está lleno? ¿las cepillas están bloqueadas?"
    ],
    decision_sop: [
      {
        condicion: "Si el manómetro del filtro está alto (filtro cargado):",
        pasos: [
          "Lavar el filtro antes de usar el limpiafondos.",
          "Seguir el protocolo de la ficha 'manometro_alto'."
        ]
      },
      {
        condicion: "Si la cestilla del prefiltro está llena:",
        pasos: [
          "Parar la bomba.",
          "Limpiar la cestilla del prefiltro.",
          "Arrancar la bomba y comprobar si el limpiafondos vuelve a aspirar."
        ]
      },
      {
        condicion: "Si es limpiafondos manual con manguera:",
        pasos: [
          "Revisar la manguera completa en busca de dobleces o grietas.",
          "Conectar la manguera a la toma de aspiración (skimmer o toma de fondo) asegurando un sellado correcto.",
          "Purgar el aire de la manguera sumergiéndola completamente antes de conectarla.",
          "Verificar que la válvula de aspiración del skimmer está en posición FONDO."
        ]
      },
      {
        condicion: "Si es robot eléctrico:",
        pasos: [
          "Sacar el robot del agua con el cable desconectado de la corriente.",
          "Limpiar el filtro o cartucho del robot.",
          "Revisar las cepillas y las ruedas: limpiar de cabello y debris.",
          "Volver a introducir en el agua y conectar.",
          "Si sigue sin funcionar: consultar el manual del fabricante o contactar con el servicio técnico. No manipular la electrónica sin formación específica."
        ]
      }
    ],
    protocolo: [
      "1. Leer el manómetro del filtro y lavar si es necesario.",
      "2. Limpiar la cestilla del prefiltro de la bomba.",
      "3. Para limpiafondos manual: revisar manguera, purgar aire y conectar correctamente.",
      "4. Para robot eléctrico: desconectar la corriente → limpiar filtro interno y cepillas → reconectar.",
      "5. Comprobar que la válvula selectora del skimmer está en la posición correcta.",
      "6. Verificar aspiración durante 2–3 min.",
      "7. Registrar la causa y la solución."
    ],
    calculo_rapido: [],
    seguimiento: [
      {
        tiempo: "Durante la primera sesión de limpieza",
        notas: [
          "Verificar que el limpiafondos recorre el fondo sin problemas y que hay vacío de succión."
        ]
      },
      {
        tiempo: "Al finalizar la limpieza",
        notas: [
          "Comprobar el fondo de la piscina: debe quedar sin residuos visibles.",
          "Registrar la duración y cualquier incidencia."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Para robots eléctricos: desconectar siempre la corriente antes de sacar el robot del agua o manipularlo.",
      "No manipular la electrónica del robot sin formación específica; llamar a técnico cualificado si hay dudas."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Instrucciones específicas del limpiafondos instalado (manual, hidráulico o robot eléctrico)."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico de problemas de aspiración en sistemas de limpieza de piscinas."
      }
    ]
  },

  // ── 10. PIERDE AGUA ───────────────────────────────────────────────────────
  pierde_agua: {
    situacion_visible: "El nivel del agua baja de forma perceptible en días consecutivos. El técnico o el propietario lo reportan al necesitar rellenar con mayor frecuencia de lo habitual.",
    riesgo_inmediato: "Si el nivel baja por debajo del skimmer → la bomba aspira aire y puede trabajar en seco. Vigilar el nivel.",
    descartar_urgente: [
      "¿El nivel está cerca del skimmer? → rellenar para proteger la bomba.",
      "¿Hay agua visible en el cuarto técnico o alrededor del filtro? → fuga en el circuito hidráulico, actuar urgente."
    ],
    comprobaciones_rapidas: [
      "Realizar la prueba del cubo para distinguir evaporación de fuga (ver protocolo).",
      "Comparar si la pérdida es mayor con la bomba en marcha o con la bomba parada.",
      "Mayor pérdida con bomba en marcha → fuga probable en el circuito hidráulico (impulsiones o aspiración).",
      "Mayor pérdida con bomba parada → fuga probable en el vaso (liner, gresite, skimmer).",
      "Pérdida igual → fuga en retorno por gravedad o en el vaso.",
      "Revisar visualmente skimmers, boquillones, escaleras y contraflotes."
    ],
    decision_sop: [
      {
        condicion: "Si la pérdida es > 2 cm/día (muy por encima de la evaporación orientativa de 0,3–0,5 cm/día en verano):",
        pasos: [
          "Hay fuga activa. Realizar prueba del cubo para confirmar.",
          "Localizar la fuga según el patrón (mayor pérdida con bomba en marcha vs. parada).",
          "Si la fuga es en el circuito hidráulico → inspeccionar uniones, válvulas y bombas.",
          "Si la fuga es en el vaso → buscar grietas en liner, gresite o sellado de skimmer.",
          "Para fugas importantes: contactar con instalador cualificado."
        ]
      },
      {
        condicion: "Si la pérdida está entre 0,5–2 cm/día:",
        pasos: [
          "Realizar prueba del cubo durante 24 h.",
          "Si la diferencia entre cubo y piscina es > 0,5 cm → confirmar fuga; investigar causa.",
          "Si es similar → probablemente evaporación (considerar cubrir la piscina de noche)."
        ]
      }
    ],
    protocolo: [
      "1. Prueba del cubo: llenar un cubo de 10–20 L de agua de la piscina y colocarlo en el primer escalón (sumergido 5 cm).",
      "2. Marcar el nivel de agua en el cubo y en la piscina.",
      "3. Esperar 24 h con la bomba en sus condiciones habituales.",
      "4. Comparar el descenso en el cubo (evaporación) con el descenso en la piscina.",
      "5. Si piscina pierde más que el cubo → hay fuga.",
      "6. Repetir la prueba con la bomba parada 24 h para localizar si es hidráulica o del vaso.",
      "7. Registrar los valores medidos y la diferencia.",
      "8. Si se confirma fuga: localizar, reparar o contratar especialista."
    ],
    calculo_rapido: [
      "Evaporación orientativa en verano (clima mediterráneo): 0,3–0,5 cm/día (valor variable según temperatura, viento y humedad).",
      "Si la piscina pierde más que el cubo de control: hay fuga activa.",
      "Volumen de agua perdida (L) = superficie (m²) × descenso (m) × 1000."
    ],
    seguimiento: [
      {
        tiempo: "Tras la prueba del cubo (24–48 h)",
        notas: [
          "Interpretar el resultado y decidir si hay fuga.",
          "Si hay fuga: localizar con segunda prueba (bomba parada)."
        ]
      },
      {
        tiempo: "Tras la reparación",
        notas: [
          "Repetir la prueba del cubo para confirmar que la fuga está resuelta.",
          "Registrar la causa, la reparación y el seguimiento."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Rellenar la piscina si el nivel baja hasta casi el nivel del skimmer, antes de que la bomba aspire aire."
    ],
    fuentes: [
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Procedimiento de la prueba del cubo para diagnóstico de fugas."
      },
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Inspección de juntas y componentes hidráulicos del circuito."
      }
    ]
  },

  // ── 11. ALGAS RECURRENTES ─────────────────────────────────────────────────
  algas_recurrentes: {
    situacion_visible: "Las algas vuelven a aparecer pocos días después de un tratamiento de choque. La piscina parece tratada pero las algas reaparecen sistemáticamente.",
    riesgo_inmediato: "Las algas recurrentes indican un problema crónico sin resolver. Si el fondo no es visible → cerrar el baño (mismo criterio que agua_verde).",
    descartar_urgente: [
      "¿El cianúrico (CYA) está por encima de 100 mg/L? → bloquea el cloro; sin corregir, el choque no funciona.",
      "¿La circulación del agua es correcta en todas las zonas? → zonas muertas generan recurrencia."
    ],
    comprobaciones_rapidas: [
      "Medir CYA: si > 100 mg/L → renovar agua (20–30 %) antes del choque.",
      "Medir pH: si crónicamante > 7,6 → el cloro activo es muy bajo.",
      "Comprobar zonas sin circulación: esquinas, bajo las escaleras, frente a las boquillas apagadas.",
      "Revisar si el cloro se dosifica en horario nocturno (mayor eficacia sin radiación UV).",
      "Comprobar tiempo de filtración diario: ¿es suficiente para el volumen de la piscina?"
    ],
    decision_sop: [
      {
        condicion: "Si CYA > 100 mg/L:",
        pasos: [
          "Renovar el 20–30 % del agua de la piscina.",
          "Re medir CYA tras la renovación.",
          "No aplicar más productos con estabilizante (dicloroisocianurato) mientras CYA esté alto.",
          "Después del choque, usar hipoclorito sin estabilizante."
        ]
      },
      {
        condicion: "Si pH crónico > 7,6:",
        pasos: [
          "Corregir el pH a 7,2–7,4.",
          "Revisar la causa raíz del pH alto (TAC muy alta, agua de reposición alcalina, sobredosificación de hipoclorito sódico)."
        ]
      },
      {
        condicion: "Si hay zonas sin circulación:",
        pasos: [
          "Orientar los boquillones de retorno para mejorar la circulación en las zonas muertas.",
          "Considerar aumentar el tiempo de filtración.",
          "Tratar manualmente las zonas afectadas con algicida o cepillado."
        ]
      },
      {
        condicion: "Si el tiempo de filtración es insuficiente:",
        pasos: [
          "Calcular el tiempo mínimo de filtración: volumen (m³) / caudal del filtro (m³/h).",
          "Ajustar el programador horario para asegurar al menos 1 renovación completa al día en verano."
        ]
      }
    ],
    protocolo: [
      "1. Medir CYA, pH y cloro libre.",
      "2. Si CYA > 100: renovar agua antes del choque.",
      "3. Corregir pH a 7,2–7,4.",
      "4. Aplicar choque con hipoclorito sin estabilizante (calcular según volumen y etiqueta).",
      "5. Lavar el filtro.",
      "6. Filtrar continuamente durante 24–48 h.",
      "7. Cepillar paredes, fondo y escaleras para desprender el biofilm.",
      "8. Aspirar al desagüe.",
      "9. Identificar y corregir la causa raíz (CYA, pH, circulación, filtración).",
      "10. Ajustar la dosificación mantenimiento y el programador horario.",
      "11. Registrar la causa raíz identificada y el plan de corrección."
    ],
    calculo_rapido: [
      "Tiempo de filtración mínimo orientativo (h) = Volumen (m³) / Caudal del filtro (m³/h).",
      "Dosis de choque: según volumen y etiqueta del producto (hipoclorito sin estabilizante).",
      "Si CYA > 100: renovar = vaciar 20–30 % y reponer con agua de red."
    ],
    seguimiento: [
      {
        tiempo: "A las 24 h",
        notas: [
          "Medir pH, cloro libre y CYA.",
          "Comprobar visibilidad del fondo.",
          "Aspirar restos de algas del fondo."
        ]
      },
      {
        tiempo: "A los 7 días",
        notas: [
          "Verificar que no han reaparecido las algas.",
          "Si reaparecen → buscar causa raíz no resuelta (circulación, CYA, pH)."
        ]
      },
      {
        tiempo: "A los 14 días",
        notas: [
          "Confirmar estabilidad del cloro libre y del pH.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Requisitos para piscinas de uso colectivo, incluyendo niveles de desinfección."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Influencia del CYA en la eficacia de la desinfección y medidas de control de algas."
      },
      {
        tipo: "guia_tecnica",
        nombre: "CDC Model Aquatic Health Code (MAHC)",
        uso: "Criterios de diagnóstico y tratamiento de brotes de algas recurrentes."
      }
    ]
  },

  // ── 12. AGUA MARRÓN ───────────────────────────────────────────────────────
  agua_marrón: {
    situacion_visible: "El agua tiene una coloración marrón, rojiza u oscura. Puede aparecer de forma repentina tras añadir cloro o agua nueva.",
    riesgo_inmediato: "Si el fondo no es visible → cerrar el baño. La coloración marrón debida a metales oxidados puede manchar irreversiblemente el liner o el gresite.",
    descartar_urgente: [
      "NO aplicar más cloro hasta haber tratado los metales. El cloro oxida el hierro y el manganeso y agrava la coloración.",
      "¿El agua marrón apareció justo después de añadir cloro o agua nueva? → probable causa: metales disueltos oxidados."
    ],
    comprobaciones_rapidas: [
      "Medir hierro (Fe) y manganeso (Mn) si se dispone de test: confirmar presencia de metales.",
      "Comprobar el origen del agua de reposición: el agua de pozo suele tener hierro o manganeso disueltos.",
      "Observar el tono: marrón-rojizo → hierro; marrón-negro → manganeso; azul-verdoso → cobre.",
      "Medir pH: si está bajo, la oxidación de metales es más rápida y severa."
    ],
    decision_sop: [
      {
        condicion: "Si la causa es metales (hierro, manganeso, cobre):",
        pasos: [
          "PARAR cualquier dosificación de cloro de inmediato.",
          "Aplicar un secuestrador/quelante de metales específico para piscinas (calcular según volumen y etiqueta).",
          "Filtrar continuamente durante 24–48 h para que el filtro retire los metales complejados.",
          "Lavar el filtro pasadas 24 h para eliminar los metales retenidos.",
          "Una vez el agua aclare: re medir pH, cloro libre y metales.",
          "Solo entonces: dosificar cloro con cuidado (en pequeñas dosis) y re medir antes de añadir más."
        ]
      },
      {
        condicion: "Si el agua es muy turbia y el fondo no es visible:",
        pasos: [
          "Cerrar el baño hasta que el fondo sea visible.",
          "Seguir el protocolo de metales.",
          "No reabrir hasta que el agua esté clara y el cloro esté en rango."
        ]
      }
    ],
    protocolo: [
      "1. Parar la dosificación de cloro.",
      "2. Medir pH y ajustar a 7,2–7,4 si es necesario (facilita la acción del secuestrador).",
      "3. Aplicar secuestrador/quelante de metales según volumen y etiqueta.",
      "4. Filtrar continuamente 24–48 h.",
      "5. A las 24 h: lavar el filtro para eliminar metales retenidos.",
      "6. Comprobar si el agua ha aclarado.",
      "7. Si el agua no aclara: aplicar segunda dosis de secuestrador y repetir filtración.",
      "8. Una vez el agua esté clara: medir metales, pH y cloro.",
      "9. Dosificar cloro solo cuando los metales sean indetectables o estén secuestrados.",
      "10. Registrar el origen del agua, los metales detectados y el tratamiento aplicado."
    ],
    calculo_rapido: [
      "Dosis de secuestrador de metales: según etiqueta del producto y volumen de la piscina.",
      "Volumen (m³) = largo × ancho × profundidad media."
    ],
    seguimiento: [
      {
        tiempo: "A las 24 h",
        notas: [
          "Lavar el filtro.",
          "Comprobar si el agua ha aclarado.",
          "No dosificar cloro todavía."
        ]
      },
      {
        tiempo: "A las 48 h",
        notas: [
          "Medir metales, pH y cloro libre.",
          "Si el agua está clara y los metales están bajo control: reanudar la dosificación de cloro.",
          "Añadir cloro en pequeñas dosis y re medir."
        ]
      },
      {
        tiempo: "A los 7 días",
        notas: [
          "Confirmar que el agua mantiene su color correcto.",
          "Valorar instalar un prefiltro de hierro si el agua de reposición es de pozo."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Influencia de metales en el agua de piscinas y tratamiento con secuestrantes."
      },
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Parámetros físico-químicos y requisitos del agua para piscinas de uso colectivo."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Procedimiento de tratamiento de agua marrón por metales."
      }
    ]
  },

  // ── 13. AGUA CON ESPUMA ───────────────────────────────────────────────────
  agua_espuma: {
    situacion_visible: "Espuma visible en la superficie del agua, especialmente en los alrededores de los boquillones de retorno o en el skimmer. Los bañistas o el propietario lo reportan.",
    riesgo_inmediato: "La espuma en sí no es un riesgo inmediato de seguridad, pero indica contaminación orgánica o química que puede reducir la eficacia del cloro.",
    descartar_urgente: [
      "¿La espuma aparece solo en boquillones y desaparece en 5–10 s? → turbulencia normal, no hay problema.",
      "¿La espuma persiste más de 10 s tras el movimiento del agua? → hay tensioactivos; actuar."
    ],
    comprobaciones_rapidas: [
      "Agitar el agua con la mano y observar si la espuma persiste más de 10 s.",
      "Espuma persistente → tensioactivos (jabones, cremas solares, champús).",
      "Espuma que desaparece rápido → CO2/turbulencia; puede ser normal.",
      "¿Se ha dosificado algicida recientemente? → algunos algicidas son espumantes.",
      "Medir cloro libre y pH: la materia orgánica alta también puede causar espuma."
    ],
    decision_sop: [
      {
        condicion: "Si la espuma persiste > 10 s (tensioactivos):",
        pasos: [
          "Aumentar la frecuencia de ducha obligatoria para los bañistas.",
          "Aplicar antiespumante específico para piscinas según etiqueta (tratamiento sintomático).",
          "Renovar parcialmente el agua (10–20 %) para diluir los tensioactivos.",
          "Aplicar tratamiento antiestimulante enzimático o de oxidación si está disponible.",
          "Re medir y observar tras 24 h."
        ]
      },
      {
        condicion: "Si la espuma coincide con dosificación reciente de algicida:",
        pasos: [
          "Identificar si el algicida usado es de tipo espumante (cuaternario de amonio concentrado).",
          "Reducir la dosis de algicida o cambiar a un producto antiespumante.",
          "Filtrar y dejar disipar durante 24–48 h."
        ]
      },
      {
        condicion: "Si hay alta carga de bañistas y espuma persistente:",
        pasos: [
          "Seguir también el protocolo de la ficha 'alta_carga_banyistas'.",
          "Aplicar supercloración para oxidar la materia orgánica."
        ]
      }
    ],
    protocolo: [
      "1. Comprobar si la espuma persiste > 10 s (test de agitación manual).",
      "2. Si persiste: identificar la causa (tensioactivos, algicida, materia orgánica).",
      "3. Aplicar antiespumante según etiqueta.",
      "4. Renovar el 10–20 % del agua.",
      "5. Lavar el filtro.",
      "6. Filtrar continuamente 12–24 h.",
      "7. Reforzar la norma de ducha obligatoria antes del baño.",
      "8. Re medir cloro libre y pH.",
      "9. Registrar la causa y el tratamiento."
    ],
    calculo_rapido: [
      "Dosis de antiespumante: según etiqueta del producto y volumen de la piscina.",
      "Renovación parcial: vaciar X m³ = superficie × 0,1–0,2 m (depende del nivel de contaminación)."
    ],
    seguimiento: [
      {
        tiempo: "A las 12 h",
        notas: [
          "Comprobar si la espuma ha desaparecido.",
          "Medir cloro libre y pH."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Si la espuma persiste: segunda renovación parcial y repetir antiespumante.",
          "Confirmar parámetros en rango."
        ]
      },
      {
        tiempo: "A los 7 días",
        notas: [
          "Verificar que la espuma no ha vuelto.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Contaminación de piscinas por tensioactivos y materia orgánica proveniente de los bañistas."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico y tratamiento de espuma en piscinas."
      }
    ]
  },

  // ── 14. BOMBA HACE RUIDO ──────────────────────────────────────────────────
  bomba_ruido: {
    situacion_visible: "La bomba emite un ruido anormal al funcionar. Puede ser un silbido, zumbido continuo, golpeteo o ruido similar al de gravilla al girar.",
    riesgo_inmediato: "Dependiendo del tipo de ruido, puede indicar cavitación o fallo de rodamientos. Riesgo de daño severo a la bomba o fallo eléctrico. Evaluar si parar.",
    descartar_urgente: [
      "¿Hay olor a quemado? → parar la bomba de inmediato y no volver a arrancar hasta inspeccionarla.",
      "¿El ruido es repentino e intenso? → parar la bomba de inmediato.",
      "¿Hay vibración excesiva en la tubería o carcasa? → parar la bomba."
    ],
    comprobaciones_rapidas: [
      "Tipo de ruido: 'gravilla/grava' o silbido → cavitación (entrada de aire o restricción de aspiración).",
      "Tipo de ruido: zumbido continuo y uniforme que empeora → rodamientos desgastados.",
      "Tipo de ruido: golpeteo irregular → posible cuerpo extraño en la turbina.",
      "Comprobar el nivel del agua: si el skimmer aspira aire → cavitación por nivel bajo.",
      "Comprobar temperatura del cuerpo de la bomba: caliente al tacto → posible sobrecalentamiento."
    ],
    decision_sop: [
      {
        condicion: "Si hay ruido de gravilla/silbido (cavitación):",
        pasos: [
          "Parar la bomba de inmediato.",
          "Comprobar el nivel del agua.",
          "Comprobar la presencia de aire en la línea de aspiración (ver ficha 'burbujas_impulsores').",
          "Comprobar que las válvulas de aspiración están completamente abiertas.",
          "Resolver la causa de entrada de aire antes de volver a arrancar."
        ]
      },
      {
        condicion: "Si hay zumbido continuo que empeora (rodamientos):",
        pasos: [
          "Programar la sustitución de rodamientos a la mayor brevedad.",
          "Si el zumbido es muy intenso o hay vibración → parar la bomba.",
          "No manipular la electrónica de la bomba sin formación específica; llamar a técnico cualificado."
        ]
      },
      {
        condicion: "Si hay golpeteo (cuerpo extraño):",
        pasos: [
          "Parar la bomba.",
          "Limpiar la cestilla del prefiltro.",
          "Si el golpeteo persiste → hay un objeto en la turbina; requiere desmontaje por técnico cualificado."
        ]
      }
    ],
    protocolo: [
      "1. Identificar el tipo de ruido (gravilla, zumbido, golpeteo).",
      "2. Si hay olor a quemado, vibración excesiva o ruido muy fuerte → parar la bomba de inmediato.",
      "3. Para cavitación: comprobar nivel, prefiltro, válvulas y entradas de aire.",
      "4. Para rodamientos: evaluar urgencia y llamar a técnico.",
      "5. Para cuerpos extraños: limpiar prefiltro; si persiste, llamar a técnico.",
      "6. No manipular la electrónica ni el motor de la bomba sin formación y herramientas adecuadas.",
      "7. Registrar el tipo de ruido, la hora y la acción tomada."
    ],
    calculo_rapido: [],
    seguimiento: [
      {
        tiempo: "Tras resolver la causa",
        notas: [
          "Arrancar la bomba y verificar que el ruido ha desaparecido.",
          "Comprobar que la presión y el caudal son normales."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Re verificar que no hay ruido anormal.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar la bomba de inmediato si: ruido muy fuerte o repentino, olor a quemado, vibración excesiva, cuerpo de la bomba muy caliente al tacto.",
      "No volver a arrancar hasta haber identificado y resuelto la causa.",
      "No manipular la electrónica ni el motor; llamar a técnico cualificado si es necesario."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Diagnóstico de ruidos y procedimiento de mantenimiento de la bomba."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Identificación de tipos de ruido en bombas de piscina y criterios de intervención."
      }
    ]
  },

  // ── 15. MANCHAS METÁLICAS ─────────────────────────────────────────────────
  manchas_metalicas: {
    situacion_visible: "Manchas de color marrón, negro, rojizo o azul-verde en el liner, gresite, paredes o fondo de la piscina. Pueden aparecer de forma difusa o en puntos concretos.",
    riesgo_inmediato: "Las manchas en sí no representan un riesgo sanitario inmediato, pero indican presencia de metales que pueden seguir manchando y que afectan a la eficacia del cloro.",
    descartar_urgente: [
      "NO frotar con lejía o cloro puro → fija las manchas.",
      "NO aplicar cloro de choque sin tratar antes los metales → agrava y extiende las manchas."
    ],
    comprobaciones_rapidas: [
      "Identificar el color de la mancha: marrón/rojizo → hierro; negro/marrón oscuro → manganeso; azul-verde → cobre.",
      "Medir hierro y manganeso si se dispone de test.",
      "Revisar si el agua de reposición es de pozo (fuente habitual de metales).",
      "Comprobar si las manchas aparecieron tras añadir cloro → oxidación de metales disueltos."
    ],
    decision_sop: [
      {
        condicion: "Si hay manchas de hierro (marrón/rojizo):",
        pasos: [
          "Aplicar secuestrador/quelante de hierro según etiqueta y volumen.",
          "Ajustar pH a 7,2–7,4.",
          "Filtrar continuamente 24–48 h.",
          "Lavar el filtro a las 24 h.",
          "Si las manchas no ceden: aplicar producto eliminador de manchas de hierro específico para piscinas según fabricante.",
          "No frotar con productos clorados."
        ]
      },
      {
        condicion: "Si hay manchas de manganeso (negro/marrón oscuro):",
        pasos: [
          "Aplicar secuestrador de manganeso específico para piscinas según etiqueta.",
          "Filtrar 24–48 h y lavar el filtro.",
          "Si persisten: tratar con ácido diluido específico para manchas de piscinas (según fabricante).",
          "No frotar con cloro."
        ]
      },
      {
        condicion: "Si hay manchas de cobre (azul-verde):",
        pasos: [
          "Revisar si hay algún elemento de cobre en el circuito (tuberías, ionizadores de cobre).",
          "Aplicar secuestrador de cobre según etiqueta.",
          "Ajustar pH y alcalinidad.",
          "Eliminar o aislar la fuente de cobre si es posible."
        ]
      }
    ],
    protocolo: [
      "1. Identificar el metal causante según el color de la mancha.",
      "2. Parar la dosificación de cloro.",
      "3. Ajustar pH a 7,2–7,4.",
      "4. Aplicar secuestrador/quelante de metales adecuado según etiqueta y volumen.",
      "5. Filtrar continuamente 24–48 h.",
      "6. Lavar el filtro a las 24 h.",
      "7. Comprobar si las manchas han desaparecido o se han reducido.",
      "8. Si persisten: tratar con eliminador de manchas específico para piscinas según fabricante.",
      "9. Reanudar la dosificación de cloro una vez los metales estén bajo control.",
      "10. Registrar los metales detectados y el tratamiento aplicado."
    ],
    calculo_rapido: [
      "Dosis de secuestrador: según etiqueta del producto y volumen de la piscina.",
      "Volumen (m³) = largo × ancho × profundidad media."
    ],
    seguimiento: [
      {
        tiempo: "A las 24 h",
        notas: [
          "Lavar el filtro.",
          "Comprobar evolución de las manchas.",
          "No dosificar cloro todavía."
        ]
      },
      {
        tiempo: "A las 48 h",
        notas: [
          "Medir metales y pH.",
          "Si las manchas persisten: aplicar eliminador de manchas según fabricante.",
          "Reanudar cloro si los metales están controlados."
        ]
      },
      {
        tiempo: "A los 7 días",
        notas: [
          "Confirmar que las manchas no han vuelto.",
          "Si el agua de reposición es de pozo: valorar prefiltración del agua entrante."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Influencia de metales pesados en la calidad del agua de piscinas."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico y tratamiento de manchas metálicas en piscinas."
      },
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Productos específicos eliminadores de manchas metálicas compatibles con el revestimiento de la piscina."
      }
    ]
  },

  // ── 16. INCRUSTACIONES DE CAL ─────────────────────────────────────────────
  incrustaciones: {
    situacion_visible: "Depósitos blancos o grisáceos duros en el liner, gresite, rejillas, boquillones, escaleras o equipos. El tacto es áspero o rugoso en las zonas afectadas.",
    riesgo_inmediato: "Las incrustaciones en sí no son un riesgo inmediato de salud, pero las incrustaciones severas en equipos pueden dañar la bomba, el filtro y los intercambiadores de calor.",
    descartar_urgente: [
      "¿Las incrustaciones están en el interior de la bomba o el calentador? → riesgo de daño al equipo; evaluar intervención técnica.",
      "¿El pH se mantiene crónicamente por encima de 7,8? → es la causa raíz; sin corregirlo, las incrustaciones volverán."
    ],
    comprobaciones_rapidas: [
      "Medir pH, TAC y TH (dureza total).",
      "pH crónico > 7,8 + TH > 300 mg/L + TAC > 150 mg/L = condiciones de precipitación de cal.",
      "Comprobar el historial de dosificación: ¿se ha sobredosificado bicarbonato o hipoclorito sódico?",
      "Inspeccionar la zona de filtración, los boquillones y las escaleras."
    ],
    decision_sop: [
      {
        condicion: "Si las incrustaciones son superficiales (liner, gresite, escaleras):",
        pasos: [
          "Aplicar producto desincrustante específico para piscinas según fabricante (ácido diluido compatible con el revestimiento).",
          "Frotar con cepillo de nailon (no metálico para liner de PVC).",
          "Enjuagar abundantemente.",
          "Corregir pH, TAC y TH para prevenir nuevas incrustaciones.",
          "Aplicar antiincrustante preventivo mensualmente según etiqueta."
        ]
      },
      {
        condicion: "Si las incrustaciones son en equipos (bomba, calentador, boquillones):",
        pasos: [
          "Desmontar y sumergir las piezas en solución desincrustante (ácido cítrico o clorhídrico diluido según fabricante y material).",
          "Enjuagar con agua abundante antes de reinstalar.",
          "Para el calentador: seguir las instrucciones del fabricante. No usar ácidos no recomendados.",
          "Llamar a técnico cualificado si no se tiene experiencia con el tipo de equipo."
        ]
      }
    ],
    protocolo: [
      "1. Medir pH, TAC y TH.",
      "2. Corregir el pH a 7,2–7,4 y la TAC a 80–120 mg/L.",
      "3. Aplicar desincrustante específico para piscinas según fabricante sobre las zonas afectadas.",
      "4. Frotar con cepillo adecuado para el revestimiento.",
      "5. Enjuagar bien.",
      "6. Aplicar antiincrustante preventivo según etiqueta y volumen.",
      "7. Ajustar la dosificación de mantenimiento para evitar la recurrencia.",
      "8. Registrar el estado antes y después, y los productos utilizados."
    ],
    calculo_rapido: [
      "Dosis de antiincrustante preventivo: según etiqueta del producto y volumen de la piscina.",
      "No usar ácido puro (concentrado) directamente sobre superficies; diluir siempre según fabricante.",
      "Usar EPIs (guantes, gafas) al manipular productos ácidos."
    ],
    seguimiento: [
      {
        tiempo: "Inmediatamente tras el tratamiento",
        notas: [
          "Verificar que las incrustaciones han desaparecido o se han reducido significativamente.",
          "Medir pH y TAC tras el tratamiento."
        ]
      },
      {
        tiempo: "Al mes",
        notas: [
          "Inspeccionar visualmente las zonas tratadas.",
          "Aplicar segunda dosis de antiincrustante preventivo si es necesario.",
          "Confirmar que el pH y la TAC se mantienen en rango."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Parámetros físico-químicos (pH, dureza, alcalinidad) para piscinas de uso colectivo."
      },
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Productos desincrustantes compatibles con el revestimiento y los equipos instalados."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Prevención y tratamiento de incrustaciones calcáreas en piscinas."
      }
    ]
  },

  // ── 17. MANTENIMIENTO POST-TORMENTA ───────────────────────────────────────
  mantenimiento_tormenta: {
    situacion_visible: "Tras lluvia intensa o tormenta: agua turbia, sobrenadantes en la superficie (hojas, ramas, insectos), posible coloración verdosa o marrón. El filtro puede estar saturado.",
    riesgo_inmediato: "La lluvia intensa diluye el cloro y puede aportar materia orgánica, tierra y contaminantes. Si el agua está turbia y el fondo no es visible → cerrar el baño.",
    descartar_urgente: [
      "¿Se ve el fondo? Si no → cerrar el baño de inmediato.",
      "¿Hay ramas, objetos grandes u hojas que puedan obstruir el skimmer o la bomba? → retirar antes de arrancar."
    ],
    comprobaciones_rapidas: [
      "Retirar los sobrenadantes (red de limpieza o skimmer manual).",
      "Comprobar la cestilla del skimmer y del prefiltro de la bomba → vaciarlas.",
      "Medir pH y cloro libre.",
      "Comprobar la presión del filtro: una tormenta puede cargar el filtro rápidamente.",
      "Medir turbidez si se dispone de turbidímetro o test visual."
    ],
    decision_sop: [
      {
        condicion: "Si el fondo no es visible:",
        pasos: [
          "Cerrar el baño.",
          "Retirar sobrenadantes y limpiar cestas.",
          "Lavar el filtro.",
          "Aplicar floculante y choque de cloro (con pH previo en rango).",
          "Filtrar continuamente 24–48 h.",
          "No reabrir hasta que el fondo sea visible en toda la piscina."
        ]
      },
      {
        condicion: "Si el fondo es visible (turbidez leve):",
        pasos: [
          "Retirar sobrenadantes.",
          "Limpiar cestas de skimmer y prefiltro.",
          "Medir y corregir pH si es necesario.",
          "Aplicar choque de cloro según volumen y etiqueta.",
          "Lavar el filtro.",
          "Aumentar el tiempo de filtración durante 48 h."
        ]
      }
    ],
    protocolo: [
      "1. Retirar sobrenadantes (hojas, insectos, ramas) con red.",
      "2. Vaciar las cestas del skimmer y del prefiltro de la bomba.",
      "3. Medir pH, cloro libre y turbidez.",
      "4. Corregir pH a 7,2–7,4 si es necesario.",
      "5. Lavar el filtro (LAVADO → parar → ENJUAGUE → parar → FILTRACIÓN).",
      "6. Aplicar choque de cloro según volumen y etiqueta.",
      "7. Aumentar el tiempo de filtración: al menos el doble del tiempo habitual durante 48 h.",
      "8. Si el agua sigue turbia: aplicar floculante según etiqueta y aspirar al desagüe tras sedimentación.",
      "9. Re medir pH y cloro a las 12–24 h.",
      "10. Registrar la fecha de la tormenta, los parámetros antes y después, y los productos añadidos."
    ],
    calculo_rapido: [
      "Dosis de choque post-tormenta: según el nivel de contaminación visual y el volumen de la piscina → leer siempre la etiqueta.",
      "Tiempo de filtración mínimo post-tormenta: al menos el doble del tiempo diario habitual durante 48 h."
    ],
    seguimiento: [
      {
        tiempo: "A las 12 h",
        notas: [
          "Medir pH y cloro libre.",
          "Comprobar si el agua ha aclarado.",
          "Limpiar el fondo si es necesario."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Verificar visibilidad del fondo.",
          "Lavar el filtro si la presión ha vuelto a subir.",
          "Re medir parámetros."
        ]
      },
      {
        tiempo: "A las 48 h",
        notas: [
          "Confirmar que el agua está clara, el cloro en rango y el fondo visible.",
          "Volver al programa de filtración habitual.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Parámetros de calidad del agua tras eventos que alteren la composición del agua."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Gestión de la calidad del agua tras lluvia y tormentas."
      },
      {
        tipo: "guia_tecnica",
        nombre: "CDC Model Aquatic Health Code (MAHC)",
        uso: "Protocolos de respuesta a eventos de contaminación en piscinas."
      }
    ]
  },

  // ── 18. ALTA CARGA DE BAÑISTAS ────────────────────────────────────────────
  alta_carga_banyistas: {
    situacion_visible: "La piscina ha recibido o va a recibir una cantidad de bañistas significativamente superior a la habitual (evento, celebración, verano). El técnico observa agua ligeramente turbia, olor a cloraminas o pH desviado.",
    riesgo_inmediato: "Alta carga orgánica → consumo rápido de cloro → riesgo de desinfección insuficiente. En piscinas colectivas: comprobar si se supera el aforo establecido por normativa.",
    descartar_urgente: [
      "Medir cloro libre ANTES del evento: si < 1 mg/L → no es seguro abrir con alta carga.",
      "Para piscinas colectivas: verificar que no se supera el aforo máximo según RD 742/2013."
    ],
    comprobaciones_rapidas: [
      "Medir pH, cloro libre y cloro total antes del evento.",
      "Calcular cloro combinado = total − libre: si ya hay cloraminas antes del evento → tratar primero.",
      "Comprobar la presión del filtro: debe estar en presión limpia antes del evento.",
      "Comprobar que el tiempo de filtración está al máximo durante el evento."
    ],
    decision_sop: [
      {
        condicion: "Antes del evento (preventivo):",
        pasos: [
          "Medir y corregir pH a 7,2–7,4.",
          "Elevar cloro libre a 2–3 mg/L (rango alto del objetivo).",
          "Lavar el filtro si la presión ha subido.",
          "Maximizar el tiempo de filtración."
        ]
      },
      {
        condicion: "Durante el evento (si es posible medir):",
        pasos: [
          "Medir cloro libre cada 2 h.",
          "Si cloro libre cae por debajo de 1 mg/L → dosificar cloro (hipoclorito) según etiqueta.",
          "Verificar que el pH no ha subido."
        ]
      },
      {
        condicion: "Tras el evento:",
        pasos: [
          "Medir pH, cloro libre y cloro combinado.",
          "Si cloro combinado > 0,5 mg/L → realizar supercloración (cloro libre ≥ 10 × combinado).",
          "Lavar el filtro.",
          "Filtrar continuamente durante 12–24 h post-evento.",
          "Re medir antes de declarar el agua en condiciones normales."
        ]
      }
    ],
    protocolo: [
      "1. Antes del evento: medir y ajustar pH y cloro; lavar el filtro.",
      "2. Durante: monitorizar cloro cada 2 h si es posible; dosificar si baja de 1 mg/L.",
      "3. Tras el evento: medir pH, cloro libre, cloro total y calcular combinado.",
      "4. Si combinado > 0,5 mg/L: supercloración (calcular dosis según volumen y etiqueta).",
      "5. Lavar el filtro.",
      "6. Filtrar 12–24 h adicionales.",
      "7. Re medir parámetros antes de declarar el agua en condiciones normales.",
      "8. Registrar número aproximado de bañistas, parámetros y tratamientos."
    ],
    calculo_rapido: [
      "Cloro combinado (mg/L) = cloro total − cloro libre.",
      "Objetivo supercloración: cloro libre ≥ 10 × cloro combinado.",
      "Dosis de hipoclorito: según volumen (m³) y concentración → leer etiqueta."
    ],
    seguimiento: [
      {
        tiempo: "A las 2 h del evento (si es posible)",
        notas: [
          "Medir cloro libre y dosificar si es necesario."
        ]
      },
      {
        tiempo: "Tras el evento (inmediato)",
        notas: [
          "Medir todos los parámetros.",
          "Lavar el filtro.",
          "Aplicar supercloración si hay cloraminas."
        ]
      },
      {
        tiempo: "A las 12–24 h post-evento",
        notas: [
          "Confirmar parámetros en rango.",
          "Verificar que el cloro libre ha bajado a ≤ 5 mg/L antes de reabrir.",
          "Registrar y cerrar el parte."
        ]
      }
    ],
    cuando_parar_equipo: [],
    fuentes: [
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Requisitos de aforo, desinfección y parámetros de calidad del agua para piscinas de uso colectivo en España."
      },
      {
        tipo: "guia_salud_publica",
        nombre: "WHO Guidelines for safe recreational water environments, Volume 2, 2006",
        uso: "Gestión de la carga orgánica y formación de subproductos de la desinfección en eventos de alta afluencia."
      },
      {
        tipo: "guia_tecnica",
        nombre: "CDC Model Aquatic Health Code (MAHC)",
        uso: "Protocolos de respuesta a alta carga de bañistas y formación de cloraminas."
      }
    ]
  },

  // ── 19. REGULADOR DE pH AUTOMÁTICO NO FUNCIONA ────────────────────────────
  regulador_ph: {
    situacion_visible: "El pH de la piscina está fuera del rango objetivo (típicamente < 7,0 o > 7,8) a pesar de que el regulador automático de pH (dosificador + sonda) está instalado y en marcha.",
    riesgo_inmediato: "Si el dosificador está inyectando en continuo sin efecto → riesgo de sobredosificación del ácido o la base. Parar el regulador automático y pasar a control manual.",
    descartar_urgente: [
      "¿El dosificador está inyectando en continuo sin que el pH cambie? → parar el regulador automático de inmediato.",
      "¿El pH medido manualmente difiere mucho del pH que muestra el regulador? → la sonda está descalibrada o sucia."
    ],
    comprobaciones_rapidas: [
      "Medir el pH manualmente con un kit o medidor calibrado de referencia.",
      "Comparar el pH manual con el pH que indica el display del regulador.",
      "Si difieren más de 0,2 unidades → sonda sucia o descalibrada.",
      "Comprobar el nivel del depósito de producto (ácido o base).",
      "Comprobar si la bomba dosificadora gotea al arrancar (burbujas en el tubo dosificador → pérdida de cebado)."
    ],
    decision_sop: [
      {
        condicion: "Si la sonda muestra pH diferente al medido manualmente:",
        pasos: [
          "Limpiar la sonda con agua destilada o con el limpiador indicado por el fabricante.",
          "Calibrar la sonda con tampones de pH conocido (pH 4 y pH 7, o pH 7 y pH 10, según instrucciones del fabricante).",
          "Comparar de nuevo el pH de la sonda con la medición manual.",
          "Si la sonda no calibra correctamente → sustituir la sonda."
        ]
      },
      {
        condicion: "Si el depósito de producto está vacío:",
        pasos: [
          "Reponer el producto (ácido o base para piscinas según lo que use el equipo).",
          "Purgar el aire del tubo dosificador según instrucciones del fabricante.",
          "Verificar que la bomba dosificadora arranca correctamente."
        ]
      },
      {
        condicion: "Si la bomba dosificadora no inyecta producto:",
        pasos: [
          "Verificar que el tubo dosificador no está doblado ni obstruido.",
          "Comprobar que la bomba ceba correctamente (ver manual del fabricante).",
          "Si la bomba no arranca: verificar la alimentación eléctrica. No manipular la electrónica sin formación; llamar a técnico cualificado."
        ]
      },
      {
        condicion: "Si el regulador dosifica en continuo sin efecto:",
        pasos: [
          "Parar el regulador automático.",
          "Verificar el pH manualmente.",
          "Investigar si hay una fuente que contrarresta la dosificación (agua de reposición muy alcalina, TAC muy alta).",
          "Resolver la causa raíz antes de volver a activar el regulador automático."
        ]
      }
    ],
    protocolo: [
      "1. Medir el pH manualmente con kit de referencia.",
      "2. Comparar con el pH del display del regulador.",
      "3. Si la sonda está descalibrada: limpiar y calibrar con tampones.",
      "4. Comprobar el nivel del depósito de producto.",
      "5. Verificar que la bomba dosificadora inyecta correctamente (cebado, tubo sin obstrucciones).",
      "6. Si el regulador dosifica en continuo sin efecto: parar y pasar a control manual.",
      "7. Ajustar el pH manualmente hasta que el regulador esté funcionando correctamente.",
      "8. Volver a activar el regulador y monitorizar durante 2 h.",
      "9. Registrar la causa, la calibración realizada y los valores de pH antes y después."
    ],
    calculo_rapido: [
      "Dosis manual de corrección de pH (mientras el regulador no funciona): según volumen y etiqueta del producto.",
      "Calibración de sonda: usar tampones de pH trazables (pH 4,01 y 7,01 son los más comunes)."
    ],
    seguimiento: [
      {
        tiempo: "A las 2 h tras la corrección",
        notas: [
          "Verificar que el pH se mantiene en rango.",
          "Comprobar que el regulador no está dosificando en continuo."
        ]
      },
      {
        tiempo: "A las 24 h",
        notas: [
          "Confirmar estabilidad del pH.",
          "Re medir manualmente y comparar con el display del regulador.",
          "Si la discrepancia persiste → la sonda necesita ser sustituida."
        ]
      },
      {
        tiempo: "Semanal (mantenimiento preventivo)",
        notas: [
          "Limpiar la sonda de pH.",
          "Calibrar con tampones.",
          "Verificar el nivel del depósito de producto.",
          "Registrar los valores de calibración."
        ]
      }
    ],
    cuando_parar_equipo: [
      "Parar el regulador automático de pH si dosifica en continuo sin efecto → riesgo de sobredosificación.",
      "No manipular la electrónica del regulador sin formación específica; llamar a técnico cualificado."
    ],
    fuentes: [
      {
        tipo: "fabricante",
        nombre: "Manual del fabricante del equipo/producto",
        uso: "Procedimiento de calibración de la sonda de pH, cebado de la bomba dosificadora y mantenimiento del regulador automático."
      },
      {
        tipo: "normativa",
        nombre: "Real Decreto 742/2013",
        uso: "Rango de pH obligatorio para piscinas de uso colectivo en España."
      },
      {
        tipo: "manual_tecnico",
        nombre: "Buenas prácticas de operación de piscinas",
        uso: "Diagnóstico y mantenimiento de reguladores automáticos de pH en piscinas."
      }
    ]
  }

};

// ── Apply patches ─────────────────────────────────────────────────────────────

const fichas = JSON.parse(readFileSync(FICHAS_PATH, 'utf8'));
let patched = 0;

for (const ficha of fichas) {
  const patch = PATCHES[ficha.id];
  if (!patch) continue;
  Object.assign(ficha, patch);
  patched++;
}

writeFileSync(FICHAS_PATH, JSON.stringify(fichas, null, 2), 'utf8');
console.log(`✅ Patched ${patched} fichas. Total: ${fichas.length}`);
