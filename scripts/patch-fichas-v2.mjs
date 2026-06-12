/**
 * patch-fichas-v2.mjs — Rewrites 10 priority fichas with the new v2 SOP structure.
 *
 * New fields added (all optional — backward compatible):
 *   situacion_visible   string[]   What the tech sees on arrival
 *   riesgo_inmediato    string[]   Safety labels (✅⚠️⛔🛑🔌)
 *   descartar_urgente   string[]   Urgent checks before anything else
 *   comprobaciones_rapidas string[] Quick visual checks before measuring
 *   decision_sop        {condicion, pasos[]}[]  If X → do Y blocks
 *   protocolo           string[]   Numbered action steps (well-written)
 *   calculo_rapido      string[]   Calculation steps
 *   seguimiento         {tiempo, notas[]}[]  Follow-up timeline
 *
 * Existing fields are preserved and updated where needed for consistency.
 * IDs, categoria, prioridad, destacado — NEVER changed.
 * Safety thresholds, formulas, parameter ranges — NOT changed.
 *
 * Usage: node scripts/patch-fichas-v2.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'data', 'fichas.json');

const fichas = JSON.parse(fs.readFileSync(FILE, 'utf8'));

// ── v2 content for the 10 priority fichas ─────────────────────────────────────

const V2 = {

  // ── 1. AGUA VERDE ───────────────────────────────────────────────────────────
  agua_verde: {
    problema_explicado: "Proliferación de algas por cloro insuficiente, pH fuera de rango o CYA bloqueado. Si no se ve el fondo es riesgo crítico de seguridad.",
    situacion_visible: [
      "Agua con coloración verde, desde leve (turquesa) hasta intensa (verde oscuro).",
      "Fondo total o parcialmente no visible.",
      "Posible olor a humedad o tierra mojada.",
      "Depósitos verdes o pardos en paredes, fondo y escaleras."
    ],
    riesgo_inmediato: [
      "⛔ Cerrar baño si no se ve el fondo — imposible ver a un bañista sumergido.",
      "⚠️ Verde leve con fondo visible — tratar de inmediato y vigilar."
    ],
    descartar_urgente: [
      "Fondo no visible → cerrar baño antes de hacer cualquier otra cosa.",
      "Bomba sin caudal → resolver la hidráulica antes de añadir química."
    ],
    comprobaciones_rapidas: [
      "¿Se ve el fondo? Si no: cerrar baño.",
      "¿Funciona la bomba? ¿Hay caudal en boquillas?",
      "Presión del filtro: ¿ha subido respecto a la presión limpia?",
      "¿Hay depósitos verdes en paredes y escaleras?",
      "¿Cuándo fue el último mantenimiento?"
    ],
    parametros: [
      ["Parámetro", "Rango OK", "Si bajo", "Si alto", "Acción SOP"],
      ["pH", "7,2–7,6", "Agua ácida / corrosiva", "Cloro ineficaz", "Corregir pH antes de cualquier choque. Usar reductor o elevador según etiqueta."],
      ["Cloro libre", "1–3 mg/L", "Sin desinfección", "Irritación", "Aplicar choque solo con pH en rango. Calcular dosis según volumen y etiqueta."],
      ["CYA", "30–50 mg/L", "Cloro se degrada rápido", "Cloro bloqueado (>100)", "Si >100: renovar agua 20-30% antes del choque. No añadir más cloro estabilizado."]
    ],
    interpretacion_resultados: "Fondo no visible = cerrar baño. pH fuera de rango = corregir primero. CYA >100 = renovar agua antes del choque.",
    decision_sop: [
      {
        condicion: "Si no se ve el fondo:",
        pasos: [
          "Cerrar baño de inmediato.",
          "No reabrir hasta que el fondo sea visible desde el borde en toda la piscina."
        ]
      },
      {
        condicion: "Si pH > 7,6:",
        pasos: [
          "Ajustar pH antes de cualquier choque.",
          "Usar reductor de pH para piscinas.",
          "Calcular dosis según volumen real y etiqueta del producto.",
          "Filtrar y re medir pH antes de continuar.",
          "No aplicar choque hasta tener pH entre 7,2 y 7,6."
        ]
      },
      {
        condicion: "Si CYA > 100 mg/L:",
        pasos: [
          "No añadir más cloro estabilizado.",
          "Renovar parcialmente el agua: vaciar 20-30% y rellenar con agua fresca.",
          "Re medir CYA tras la renovación.",
          "Reajustar pH y cloro después de rellenar."
        ]
      },
      {
        condicion: "Si cloro libre < 1 mg/L con pH en rango:",
        pasos: [
          "Aplicar choque de cloro con pH entre 7,2 y 7,6.",
          "Calcular dosis según volumen real y etiqueta del producto.",
          "Mantener filtración continua 24 h.",
          "Lavar filtro cuando la presión suba."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Cerrar baño si no se ve el fondo."],
      ["2", "Retirar hojas y materia orgánica visible."],
      ["3", "Medir presión del filtro y lavar si ha subido."],
      ["4", "Medir pH, cloro libre y CYA."],
      ["5", "Ajustar pH a 7,2-7,6 si está fuera de rango."],
      ["6", "Si CYA > 100: renovar agua 20-30% antes del choque."],
      ["7", "Aplicar choque de cloro con filtración en marcha."],
      ["8", "Mantener filtración continua. Lavar filtro cuando suba la presión."],
      ["9", "Re medir a las 12-24 h."],
      ["10", "Reabrir solo cuando el fondo sea visible y los parámetros estén en rango."]
    ],
    protocolo: [
      "Cerrar baño si no se ve el fondo.",
      "Retirar hojas y materia orgánica visible.",
      "Medir presión del filtro y lavar si ha subido respecto a la presión limpia.",
      "Medir pH, cloro libre y CYA.",
      "Ajustar pH a 7,2-7,6 si está fuera de rango.",
      "Si CYA > 100 mg/L: renovar agua 20-30% antes del choque.",
      "Aplicar choque de cloro con filtración en marcha.",
      "Mantener filtración continua. Lavar filtro cuando suba la presión.",
      "Re medir a las 12-24 h.",
      "Reabrir solo cuando el fondo sea visible y los parámetros estén en rango."
    ],
    calculo_producto: "Dosis choque: (Vol ÷ 10) × dosis indicada en etiqueta. Calcular según volumen real.",
    calculo_rapido: [
      "Calcular el volumen real de la piscina.",
      "Leer la dosis de choque en la etiqueta del producto.",
      "Si la etiqueta indica X g por 10 m³: dosis = volumen ÷ 10 × X",
      "En casos graves, se puede repetir a las 12 h si no hay mejora visible.",
      "No repetir el choque sin re medir primero."
    ],
    checklist: "✓ Baño cerrado si fondo no visible | ✓ Materia orgánica retirada | ✓ Presión filtro revisada | ✓ pH, cloro y CYA medidos | ✓ pH en rango antes del choque | ✓ Choque aplicado | ✓ Filtración continua | ✓ Re medición a 12-24 h | ✓ Fondo visible antes de reabrir",
    seguimiento: [
      {
        tiempo: "A 6-12 h:",
        notas: [
          "El verde puede pasar a gris o turbio. Es señal de algas muertas: es lo esperado.",
          "Lavar filtro si la presión ha subido."
        ]
      },
      {
        tiempo: "A 24 h:",
        notas: [
          "Debe mejorar la visibilidad del fondo.",
          "Si no mejora: revisar filtro, circulación y CYA."
        ]
      },
      {
        tiempo: "A 48 h:",
        notas: [
          "El fondo debe ser visible.",
          "Si persiste: comprobar si hay zonas sin circulación (zonas muertas).",
          "Si no mejora en 72 h: escalar diagnóstico o derivar."
        ]
      }
    ],
    que_no_hacer: [
      "No aplicar choque con pH fuera de rango — el cloro pierde eficacia.",
      "No ignorar el fondo no visible — es un riesgo de seguridad real.",
      "No mezclar cloro con otros productos químicos — riesgo de gases tóxicos.",
      "No añadir más cloro estabilizado si el CYA ya está alto."
    ],
    cuando_cerrar_bano: ["SIEMPRE si no se ve el fondo."],
    cliente: "El agua tiene algas por una bajada de cloro o pH fuera de rango. Hemos cerrado el baño por seguridad y aplicado tratamiento de choque. Con filtración continua, el agua debería aclarar en 24-48 horas.",
    parte: "Problema: Agua verde. Baño: CERRADO desde __ h. pH: __. Cloro: __. CYA: __. Acciones: lavado filtro / renovación agua / choque cloro. Próxima revisión: __ h. Fondo visible: SÍ/NO a __ h."
  },

  // ── 2. AGUA TURBIA ──────────────────────────────────────────────────────────
  agua_turbia: {
    problema_explicado: "Agua sin transparencia por filtración insuficiente, pH o dureza altos, o junta araña dañada. El fondo puede verse con dificultad.",
    situacion_visible: [
      "Agua opaca, nublada o con partículas visibles en suspensión.",
      "Sin coloración verde ni marrón definida.",
      "El fondo se ve con dificultad o no se ve.",
      "Posible descenso del caudal en las boquillas."
    ],
    riesgo_inmediato: [
      "✅ Generalmente se puede mantener abierto si el fondo es claramente visible.",
      "⚠️ Si el fondo no se ve con claridad: cerrar por precaución y tratar como fondo no visible."
    ],
    descartar_urgente: [
      "Si no se ve el fondo → tratar como ficha 'Fondo no visible'.",
      "Confirmar que la bomba está en marcha y hay caudal antes de filtrar."
    ],
    comprobaciones_rapidas: [
      "Presión del filtro: ¿ha subido respecto a la presión limpia?",
      "Caudal en boquillas: ¿está reducido?",
      "¿Color del agua: blanco lechoso, gris, o con partículas visibles?",
      "¿Cuándo se lavó el filtro por última vez?",
      "¿Se añadió floculante recientemente?"
    ],
    parametros: [
      ["Parámetro", "Rango OK", "Si bajo", "Si alto", "Acción SOP"],
      ["Presión filtro", "0,2–0,4 bar", "Bypass posible", "Filtro sucio", "Lavar filtro si ha subido respecto a la presión limpia: LAVADO → ENJUAGUE → FILTRACIÓN."],
      ["pH", "7,2–7,6", "Agua ácida", "Precipitación mineral", "Ajustar con reductor o elevador según etiqueta. Re medir tras filtración."],
      ["Dureza", "200–400 mg/L", "—", "Precipitación cal", "Si >400: renovar parcialmente el agua (20-30%)."]
    ],
    interpretacion_resultados: "Presión alta + caudal bajo = filtro sucio. Lavar primero, luego medir parámetros.",
    decision_sop: [
      {
        condicion: "Si la presión del filtro ha subido:",
        pasos: [
          "Parar la bomba.",
          "Poner la válvula en LAVADO.",
          "Encender la bomba 1-2 minutos o hasta ver agua clara en el visor.",
          "Parar la bomba.",
          "Poner la válvula en ENJUAGUE.",
          "Encender 30-60 segundos.",
          "Parar la bomba.",
          "Volver la válvula a FILTRACIÓN.",
          "Confirmar que la presión baja al rango normal."
        ]
      },
      {
        condicion: "Si pH > 7,6 o dureza > 400 mg/L:",
        pasos: [
          "Ajustar pH con reductor para piscinas según volumen y etiqueta.",
          "Si dureza > 400: renovar parcialmente el agua (20-30%).",
          "Filtrar y re medir."
        ]
      },
      {
        condicion: "Si presión normal y pH en rango:",
        pasos: [
          "Filtrar 24 h continuas.",
          "A las 12 h el agua debe estar visiblemente más clara."
        ]
      },
      {
        condicion: "Si el agua no aclara en 24 h con filtro limpio y parámetros en rango:",
        pasos: [
          "Sospechar junta araña rota o bypass interno en la válvula selectora.",
          "Derivar técnico para inspección."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Medir presión del filtro."],
      ["2", "Si ha subido: lavar filtro (LAVADO → ENJUAGUE → FILTRACIÓN)."],
      ["3", "Medir pH y dureza."],
      ["4", "Corregir pH si está fuera de rango."],
      ["5", "Si dureza > 400: renovar parcialmente el agua."],
      ["6", "Mantener filtración continua 24 h."],
      ["7", "Re medir presión y parámetros a las 12 h."],
      ["8", "Si no hay mejora a las 24 h: derivar para inspección de junta araña."]
    ],
    protocolo: [
      "Medir la presión del filtro.",
      "Si ha subido: lavar siguiendo el protocolo completo (LAVADO → ENJUAGUE → FILTRACIÓN).",
      "Medir pH y dureza.",
      "Corregir pH si está fuera de rango.",
      "Si dureza > 400 mg/L: renovar parcialmente el agua.",
      "Mantener filtración continua durante 24 h.",
      "Re medir presión y parámetros a las 12 h.",
      "Si no hay mejora a las 24 h: derivar para inspección de junta araña."
    ],
    calculo_producto: "Floculante (si se usa): (Vol ÷ 100) × dosis indicada en etiqueta.",
    calculo_rapido: [
      "Floculante (si necesario): seguir etiqueta del producto.",
      "Si se aplica floculante, poner el filtro en posición de recirculación durante 1 h y luego vacuumar al desagüe."
    ],
    checklist: "✓ Presión filtro medida | ✓ Filtro lavado si necesario | ✓ pH y dureza medidos | ✓ Correcciones aplicadas | ✓ Filtración continua 24 h | ✓ Agua clara a 24 h",
    seguimiento: [
      {
        tiempo: "A 12 h:",
        notas: [
          "El agua debe ir aclarando visiblemente.",
          "Si la presión vuelve a subir: lavar el filtro de nuevo."
        ]
      },
      {
        tiempo: "A 24 h:",
        notas: [
          "El agua debe estar clara.",
          "Si persiste la turbidez sin presión alta: sospechar bypass interno en válvula."
        ]
      }
    ],
    que_no_hacer: [
      "No añadir floculante sin haber lavado el filtro primero — colmata el filtro ya sucio.",
      "No filtrar sin revisar la presión — si hay bypass, la filtración no sirve."
    ],
    cuando_cerrar_bano: ["Si el fondo no es claramente visible."],
    cliente: "El filtro estaba cargado y el agua no se depuraba bien. Hemos hecho el lavado del filtro y ajustado parámetros. Con filtración continua debería aclarar en 12-24 horas.",
    parte: "Problema: Agua turbia. Presión inicial: __. Lavado filtro: SÍ/NO. pH: __. Dureza: __. Acciones: __. Estado a 12 h: [mejorando/igual]."
  },

  // ── 3. FONDO NO VISIBLE ─────────────────────────────────────────────────────
  fondo_no_visible: {
    problema_explicado: "El fondo de la piscina no es visible desde el borde. Independientemente del color del agua, es riesgo crítico de seguridad.",
    situacion_visible: [
      "El fondo no se ve desde el borde en ningún punto de la piscina.",
      "El agua puede ser verde, marrón, gris o blanca.",
      "Puede haber olor o aspecto anormal del agua."
    ],
    riesgo_inmediato: [
      "⛔ Cerrar baño de inmediato y sin excepción.",
      "Es imposible ver a un bañista en dificultades bajo el agua.",
      "No reabrir hasta verificar visualmente el fondo completo."
    ],
    descartar_urgente: [
      "Cerrar el acceso físico a la piscina antes de iniciar el diagnóstico.",
      "Colocar señalización visible de 'Baño cerrado'.",
      "Informar al responsable de la instalación."
    ],
    comprobaciones_rapidas: [
      "¿Cuál es el color del agua? (verde, marrón, blanco, gris)",
      "¿Funciona la bomba y hay caudal?",
      "¿Cuándo fue el último tratamiento?"
    ],
    parametros: [
      ["Color del agua", "Causa probable", "Ficha a seguir"],
      ["Verde", "Proliferación de algas", "Ficha: Agua verde"],
      ["Marrón", "Metales / materia orgánica", "Ficha: Agua marrón"],
      ["Blanco / lechoso", "Precipitación mineral", "Ficha: Agua blanca o lechosa"],
      ["Gris / turbio", "Filtración insuficiente", "Ficha: Agua turbia"]
    ],
    interpretacion_resultados: "El color del agua orienta el diagnóstico. Seguir la ficha específica tras cerrar el baño.",
    decision_sop: [
      {
        condicion: "Siempre, antes de cualquier diagnóstico:",
        pasos: [
          "Cerrar el acceso a la piscina.",
          "Colocar señalización visible.",
          "Informar al responsable."
        ]
      },
      {
        condicion: "Identificar color → seguir ficha específica:",
        pasos: [
          "Verde → Ficha: Agua verde.",
          "Marrón → Ficha: Agua marrón.",
          "Blanco/lechoso → Ficha: Agua blanca o lechosa.",
          "Gris/turbio → Ficha: Agua turbia."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Cerrar el acceso a la piscina."],
      ["2", "Colocar señalización: 'Baño cerrado'."],
      ["3", "Informar al responsable de la instalación."],
      ["4", "Identificar el color del agua."],
      ["5", "Seguir la ficha de diagnóstico correspondiente al color."],
      ["6", "No reabrir hasta que el fondo sea visible desde el borde."],
      ["7", "Anotar hora de cierre y reapertura en el parte."]
    ],
    protocolo: [
      "Cerrar el acceso a la piscina.",
      "Colocar señalización visible de 'Baño cerrado'.",
      "Informar al responsable de la instalación.",
      "Identificar el color del agua.",
      "Seguir la ficha de diagnóstico correspondiente al color.",
      "No reabrir hasta que el fondo sea visible desde el borde en toda la piscina.",
      "Anotar hora de cierre y reapertura en el parte."
    ],
    calculo_producto: "Depende del color del agua. Ver ficha específica.",
    calculo_rapido: [
      "No aplica hasta identificar la causa.",
      "Seguir el cálculo de la ficha específica según color del agua."
    ],
    checklist: "✓ Baño cerrado | ✓ Señalización visible | ✓ Responsable informado | ✓ Color del agua identificado | ✓ Ficha específica seguida | ✓ Tratamiento iniciado | ✓ Fondo visible antes de reabrir",
    seguimiento: [
      {
        tiempo: "Antes de reabrir:",
        notas: [
          "Verificar visualmente el fondo completo desde el borde.",
          "Si hay duda: baño cerrado."
        ]
      }
    ],
    que_no_hacer: [
      "No reabrir mientras quede cualquier zona del fondo sin visibilidad.",
      "No iniciar el diagnóstico sin haber cerrado el acceso primero."
    ],
    cuando_cerrar_bano: ["SIEMPRE. La condición de cierre es el fondo no visible, no el color del agua."],
    cliente: "El fondo de la piscina no se ve. Por seguridad, hemos cerrado el acceso. Estamos aplicando el tratamiento correspondiente. Le avisaremos en cuanto podamos verificar la reapertura.",
    parte: "Problema: FONDO NO VISIBLE. Color agua: [verde/marrón/blanco/gris]. Baño: CERRADO desde __ h. Tratamiento iniciado: __. Fondo visible: SÍ/NO a __ h."
  },

  // ── 4. BOMBA NO ASPIRA ──────────────────────────────────────────────────────
  bomba_no_aspira: {
    problema_explicado: "Motor en marcha pero sin caudal. En el 90% de los casos es descebado: el prefiltro no tiene agua. Parar la bomba de inmediato si no hay agua en el prefiltro.",
    situacion_visible: [
      "Motor arranca y gira, pero no hay caudal en las boquillas.",
      "Prefiltro vacío o con muy poca agua.",
      "Burbujas en el prefiltro o en la línea de impulsión.",
      "Manómetro que no sube o fluctúa."
    ],
    riesgo_inmediato: [
      "🛑 Parar la bomba de inmediato si no hay agua en el prefiltro.",
      "Una bomba funcionando en seco daña el impulsor y el sello mecánico en minutos."
    ],
    descartar_urgente: [
      "¿Hay agua en el prefiltro? Si no → parar bomba antes de cualquier otra cosa.",
      "¿El nivel de la piscina cubre el skimmer? Si no → subir nivel primero."
    ],
    comprobaciones_rapidas: [
      "Nivel del agua: ¿cubre el skimmer al menos 5 cm?",
      "Prefiltro: ¿tiene agua? ¿la tapa está bien cerrada y apretada?",
      "¿Hay burbujas visibles en el prefiltro o en las boquillas?",
      "Válvulas de aspiración: ¿están abiertas? (asa paralela a la tubería).",
      "Cestillos: ¿están sucios u obstruidos?"
    ],
    parametros: [
      ["Revisión", "Normal", "Anomalía", "Acción"],
      ["Agua en prefiltro", "Lleno hasta el borde", "Vacío o casi vacío", "Parar bomba. Llenar con cubeta hasta el borde. Revisar junta tapa."],
      ["Burbujas en prefiltro", "Sin burbujas", "Con burbujas", "Entra aire. Revisar junta tapa y racores de aspiración."],
      ["Nivel piscina", "5 cm sobre skimmer", "Por debajo del skimmer", "Subir nivel antes de arrancar la bomba."],
      ["Válvulas aspiración", "Asa paralela a tubería", "Asa perpendicular", "Abrir completamente."]
    ],
    interpretacion_resultados: "Sin agua en prefiltro = descebado. Con burbujas = entrada de aire. Sin caudal tras cebado = problema mecánico, derivar.",
    decision_sop: [
      {
        condicion: "Si el prefiltro está sin agua:",
        pasos: [
          "Parar la bomba.",
          "Llenar el prefiltro manualmente con una cubeta hasta el borde.",
          "Revisar y engrasar la junta de la tapa con vaselina.",
          "Cerrar la tapa y apretar bien.",
          "Arrancar la bomba."
        ]
      },
      {
        condicion: "Si hay burbujas en el prefiltro o en las boquillas:",
        pasos: [
          "Entra aire en la línea de aspiración.",
          "Revisar y engrasar/cambiar la junta de la tapa del prefiltro.",
          "Revisar y apretar todos los racores accesibles de la aspiración.",
          "Revisar válvulas de aspiración."
        ]
      },
      {
        condicion: "Si el nivel de la piscina no cubre el skimmer:",
        pasos: [
          "Subir el nivel mínimo 5 cm por encima del skimmer.",
          "No arrancar la bomba hasta tener nivel suficiente."
        ]
      },
      {
        condicion: "Si hay caudal tras el cebado pero con burbujas:",
        pasos: [
          "Ver ficha 'Bomba se desceba': hay una entrada de aire recurrente."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Parar la bomba."],
      ["2", "Comprobar el nivel: debe cubrir el skimmer al menos 5 cm. Si no, subir nivel."],
      ["3", "Abrir la tapa del prefiltro."],
      ["4", "¿Hay agua? Si no: llenar con cubeta hasta el borde."],
      ["5", "Limpiar el cestillo del prefiltro."],
      ["6", "Revisar la junta de la tapa: limpiar y engrasar con vaselina."],
      ["7", "Cerrar la tapa y apretar bien."],
      ["8", "Comprobar que las válvulas de aspiración están abiertas."],
      ["9", "Arrancar la bomba."],
      ["10", "Verificar: caudal en boquillas, sin burbujas, presión entre 0,3 y 0,5 bar."]
    ],
    protocolo: [
      "Parar la bomba.",
      "Comprobar el nivel de la piscina: debe cubrir el skimmer al menos 5 cm.",
      "Abrir la tapa del prefiltro.",
      "Si no hay agua en el prefiltro: llenar con cubeta hasta el borde.",
      "Limpiar el cestillo del prefiltro.",
      "Revisar la junta de la tapa: limpiar y engrasar con vaselina. Cambiar si está deformada.",
      "Cerrar la tapa y apretar bien.",
      "Comprobar que las válvulas de aspiración están abiertas (asa paralela a la tubería).",
      "Arrancar la bomba.",
      "Verificar: caudal en boquillas, sin burbujas, presión entre 0,3 y 0,5 bar."
    ],
    calculo_producto: "No aplica producto. Cebado manual: llenar el prefiltro hasta el borde antes de arrancar.",
    calculo_rapido: [
      "No aplica cálculo de productos.",
      "Cebado manual: llenar el prefiltro hasta el borde antes de arrancar."
    ],
    checklist: "✓ Bomba parada | ✓ Nivel subido si necesario | ✓ Prefiltro lleno | ✓ Cestillo limpio | ✓ Junta engrasada | ✓ Tapa apretada | ✓ Válvulas abiertas | ✓ Caudal presente y sin burbujas",
    seguimiento: [
      {
        tiempo: "A los 5-10 min de arrancar:",
        notas: [
          "Confirmar caudal estable en boquillas.",
          "Sin burbujas en el prefiltro.",
          "Presión estable entre 0,3 y 0,5 bar."
        ]
      },
      {
        tiempo: "Si la bomba vuelve a descebarse:",
        notas: [
          "Hay una entrada de aire recurrente.",
          "Ver ficha 'Bomba se desceba'."
        ]
      },
      {
        tiempo: "Si no hay caudal tras el cebado:",
        notas: [
          "Problema mecánico interno de la bomba.",
          "Derivar técnico."
        ]
      }
    ],
    que_no_hacer: [
      "No dejar la bomba funcionando en seco ni un momento — daña el sello mecánico.",
      "No arrancar sin haber comprobado el nivel y el prefiltro.",
      "No forzar la tapa si no cierra bien — cambiar la junta."
    ],
    cuando_cerrar_bano: ["No es obligatorio. Pero sin caudal no hay filtración ni depuración."],
    cliente: "La bomba no tenía agua en el prefiltro y necesitaba cebado. Lo hemos solucionado. Puede volver a ocurrir si el nivel de la piscina baja demasiado.",
    parte: "Problema: Bomba sin caudal. Causa: [Descebado/Nivel bajo/Junta/Válvula]. Acciones: cebado manual / apriete / reemplazo junta. Caudal presente: SÍ/NO. Presión: __ bar."
  },

  // ── 5. BOMBA SE DESCEBA ─────────────────────────────────────────────────────
  bomba_desceba: {
    problema_explicado: "La bomba arranca bien pero pierde aspiración de forma recurrente. Causa: entrada de aire en la línea de aspiración por junta defectuosa, racor flojo o válvula con micro-fuga.",
    situacion_visible: [
      "La bomba arranca y funciona, pero pasado un tiempo pierde aspiración.",
      "El prefiltro se va vaciando progresivamente con el motor en marcha.",
      "El caudal en boquillas disminuye o desaparece.",
      "Puede haber burbujas intermitentes en el prefiltro."
    ],
    riesgo_inmediato: [
      "🛑 Parar la bomba si el prefiltro queda sin agua.",
      "⚠️ Sin caudal prolongado: riesgo de sobrecalentamiento del sello mecánico."
    ],
    descartar_urgente: [
      "Confirmar que el nivel de la piscina es suficiente (cubre el skimmer).",
      "Descartar que la válvula de aspiración esté parcialmente cerrada."
    ],
    comprobaciones_rapidas: [
      "¿El prefiltro se vacía aunque el nivel de la piscina sea correcto?",
      "¿Hay burbujas en el prefiltro mientras la bomba funciona?",
      "¿Cuánto tarda en descebarse? (minutos / horas)",
      "¿La junta de la tapa del prefiltro está en buen estado o parece deformada?",
      "¿Hay racores en la línea de aspiración que estén flojos o rezumando?"
    ],
    parametros: [
      ["Revisión", "Indica", "Acción"],
      ["Prefiltro se vacía con nivel correcto", "Entrada de aire", "Revisar junta tapa y racores aspiración."],
      ["Descebado en < 5 min", "Fuga de aire significativa", "Revisar válvula de aspiración principal."],
      ["Descebado en > 30 min", "Micro-fuga lenta", "Revisar y engrasar junta tapa; apretar racores."]
    ],
    interpretacion_resultados: "Descebado recurrente con nivel correcto = entrada de aire. Localizar el punto exacto.",
    decision_sop: [
      {
        condicion: "Si el prefiltro se vacía lentamente con nivel de agua correcto:",
        pasos: [
          "Entra aire por algún punto de la aspiración.",
          "Revisar y engrasar o cambiar la junta de la tapa del prefiltro.",
          "Revisar y apretar todos los racores accesibles de la línea de aspiración.",
          "Arrancar y observar durante 15-20 min."
        ]
      },
      {
        condicion: "Si el descebado es muy rápido (menos de 5 min):",
        pasos: [
          "La fuga de aire es significativa.",
          "Revisar la válvula de aspiración principal: puede tener el obturador desgastado.",
          "Cambiar la válvula si tiene holgura o no cierra correctamente."
        ]
      },
      {
        condicion: "Si no se localiza la fuga tras revisar junta y racores:",
        pasos: [
          "Derivar técnico para prueba de estanqueidad en la línea de aspiración."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Rellenar prefiltro y arrancar bomba."],
      ["2", "Observar 15-20 min con bomba en marcha."],
      ["3", "Si el prefiltro se vacía con nivel correcto → entra aire."],
      ["4", "Parar bomba."],
      ["5", "Revisar junta tapa prefiltro: limpiar, engrasar o reemplazar."],
      ["6", "Apretar todos los racores accesibles de la aspiración."],
      ["7", "Revisar válvulas de aspiración."],
      ["8", "Arrancar bomba y observar de nuevo."],
      ["9", "Si persiste: derivar técnico."]
    ],
    protocolo: [
      "Rellenar el prefiltro y arrancar la bomba.",
      "Observar durante 15-20 minutos con la bomba en marcha.",
      "¿El prefiltro se vacía aunque el nivel de la piscina sea correcto? → Entra aire.",
      "Parar la bomba.",
      "Revisar la junta de la tapa del prefiltro: limpiar, engrasar con vaselina o reemplazar si está deformada.",
      "Apretar todos los racores accesibles de la línea de aspiración.",
      "Revisar las válvulas de aspiración: abrir y cerrar para detectar holgura o fuga.",
      "Arrancar la bomba y observar de nuevo durante 15-20 min.",
      "Si el problema persiste: derivar técnico para prueba de estanqueidad."
    ],
    calculo_producto: "No aplica.",
    calculo_rapido: [
      "No aplica cálculo de productos."
    ],
    checklist: "✓ Nivel correcto verificado | ✓ Junta tapa revisada y engrasada | ✓ Racores apretados | ✓ Válvulas revisadas | ✓ Bomba arranca y mantiene caudal | ✓ Sin burbujas tras 20 min",
    seguimiento: [
      {
        tiempo: "Tras la revisión:",
        notas: [
          "Si tras cambiar la junta y apretar racores el problema desaparece: resuelto.",
          "Observar durante 20 minutos para confirmar."
        ]
      },
      {
        tiempo: "Si el descebado persiste:",
        notas: [
          "Probable fallo en válvula de aspiración o microfisura en tubería.",
          "Derivar técnico para diagnóstico de estanqueidad."
        ]
      }
    ],
    que_no_hacer: [
      "No dejar la bomba descebarse de forma repetida — daña el sello mecánico.",
      "No arrancar sin haber rellenado el prefiltro."
    ],
    cuando_cerrar_bano: ["No es obligatorio, pero sin caudal no hay filtración efectiva."],
    cliente: "La bomba pierde aspiración de forma recurrente porque entra aire en algún punto de las tuberías de succión. Hemos revisado las juntas y los racores. Si vuelve a ocurrir, habrá que cambiar algún componente.",
    parte: "Problema: Descebado recurrente. Causa: [Junta/Racores/Válvula]. Acciones: reemplazo / apriete. Tiempo hasta descebado antes: __ min. Después: __ min."
  },

  // ── 6. CLORO NO AGUANTA ─────────────────────────────────────────────────────
  cloro_no_aguanta: {
    problema_explicado: "El cloro libre cae a 0 en pocas horas. Causas: CYA bloqueado (>100), pH alto, alta demanda orgánica o cloro demasiado estabilizado.",
    situacion_visible: [
      "El cloro libre cae a 0 pocas horas después de cada adición.",
      "Se dosa cloro con frecuencia pero no se mantiene en rango.",
      "Posible olor a cloro combinado (acre, diferente al cloro habitual).",
      "El agua puede tener buen aspecto visual o estar ligeramente turbia."
    ],
    riesgo_inmediato: [
      "⚠️ Sin cloro libre efectivo: el agua no está desinfectada.",
      "⚠️ No cerrar por defecto, pero monitorizar el cloro activamente.",
      "⛔ Si el agua presenta turbidez o color: cerrar baño y seguir la ficha correspondiente."
    ],
    descartar_urgente: [
      "Medir CYA: si es > 100 mg/L, el cloro está bloqueado y añadir más no sirve.",
      "Medir pH: con pH > 7,6 el cloro pierde gran parte de su eficacia."
    ],
    comprobaciones_rapidas: [
      "¿Cuánto tiempo tarda en bajar el cloro a 0?",
      "¿Cuál es el CYA actual?",
      "¿El pH está en rango?",
      "¿Ha habido alta carga de bañistas recientemente?",
      "¿Se está usando cloro estabilizado (tricloro/dicloro) como fuente principal?"
    ],
    parametros: [
      ["Parámetro", "Rango OK", "Si bajo", "Si alto", "Acción SOP"],
      ["CYA", "30–50 mg/L", "Cloro se degrada por UV", "Cloro bloqueado (>100)", "Si >100: renovar agua 20-30%. No añadir más cloro estabilizado. Si <20: añadir estabilizante."],
      ["pH", "7,2–7,6", "Agua ácida", "Cloro ineficaz", "Ajustar con reductor o elevador antes de dosificar cloro."],
      ["Cloro combinado", "<0,5 mg/L", "—", "Alta demanda orgánica", "Si >0,5: aplicar choque de cloro. Calcular según volumen y etiqueta."]
    ],
    interpretacion_resultados: "CYA >100 = única solución es renovación de agua. pH alto = bájalo primero. Combinado alto = choque.",
    decision_sop: [
      {
        condicion: "Si CYA > 100 mg/L:",
        pasos: [
          "No añadir más cloro estabilizado.",
          "La única solución es renovar parcialmente el agua.",
          "Vaciar el 20-30% del volumen total y rellenar con agua fresca.",
          "Re medir CYA tras la renovación.",
          "Reajustar pH y cloro después de rellenar."
        ]
      },
      {
        condicion: "Si CYA < 20 mg/L:",
        pasos: [
          "El cloro se degrada rápidamente por la radiación UV sin estabilizante.",
          "Añadir estabilizante (ácido cianúrico) para llevar CYA a 30-50 mg/L.",
          "Re medir CYA a los 2-3 días."
        ]
      },
      {
        condicion: "Si pH > 7,6:",
        pasos: [
          "Reducir pH a 7,2-7,6 antes de dosificar cloro.",
          "Con pH alto el cloro pierde gran parte de su eficacia."
        ]
      },
      {
        condicion: "Si CYA y pH están en rango y el cloro sigue sin aguantar:",
        pasos: [
          "Medir cloro combinado.",
          "Si combinado > 0,5 mg/L: alta demanda orgánica.",
          "Aplicar choque de cloro según volumen y etiqueta.",
          "Filtrar 24 h y re medir."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Medir pH, cloro libre, cloro combinado y CYA."],
      ["2", "Si CYA > 100: renovar agua antes de cualquier adición de cloro."],
      ["3", "Si pH > 7,6: ajustar pH."],
      ["4", "Si CYA < 20: añadir estabilizante para llevar a 30-50 mg/L."],
      ["5", "Si combinado > 0,5: aplicar choque de cloro."],
      ["6", "Filtrar continuo y re medir a las 12-24 h."]
    ],
    protocolo: [
      "Medir pH, cloro libre, cloro combinado y CYA.",
      "Si CYA > 100 mg/L: renovar agua 20-30% antes de cualquier adición de cloro.",
      "Si pH > 7,6: ajustar pH antes de dosificar.",
      "Si CYA < 20 mg/L: añadir estabilizante para llevar a 30-50 mg/L.",
      "Si demanda orgánica alta (cloro combinado > 0,5): aplicar choque.",
      "Filtrar continuo y re medir a las 12-24 h.",
      "Si el cloro sigue sin aguantar: revisar carga orgánica y plan de renovación."
    ],
    calculo_producto: "Renovación: vaciar 20-30% del volumen. Choque: (Vol ÷ 10) × dosis etiqueta.",
    calculo_rapido: [
      "Renovación: vaciar el 20-30% del volumen total y rellenar.",
      "Estabilizante: seguir dosis de etiqueta; re medir CYA a los 2-3 días.",
      "Choque: calcular según volumen real y etiqueta del producto."
    ],
    checklist: "✓ CYA medido | ✓ pH en rango | ✓ Renovación si CYA > 100 | ✓ Estabilizante si CYA < 20 | ✓ Choque si combinado > 0,5 | ✓ Filtración continua | ✓ Cloro dura > 3 días a 1 semana",
    seguimiento: [
      {
        tiempo: "A 24 h:",
        notas: [
          "Con CYA en rango y pH correcto, el cloro debe aguantar 3-5 días.",
          "Si no aguanta: repetir medición de CYA y cloro combinado."
        ]
      },
      {
        tiempo: "A 1 semana:",
        notas: [
          "Si el problema persiste: revisar si se usa cloro estabilizado en exceso.",
          "Revisar fuente de demanda orgánica (bañistas, materia vegetal, contaminación)."
        ]
      }
    ],
    que_no_hacer: [
      "No seguir dosificando cloro estabilizado si el CYA ya está alto — agrava el problema.",
      "No aplicar choque con pH fuera de rango — menor eficacia.",
      "No ignorar el CYA alto: no se corrige con química, solo con renovación de agua."
    ],
    cuando_cerrar_bano: ["Si el cloro libre es 0 durante más de 24 h."],
    cliente: "El cloro se consume muy rápido porque el estabilizante está en exceso o hay mucha carga orgánica. La solución es renovar parte del agua y ajustar los parámetros. Con esto el cloro volverá a durar días.",
    parte: "Problema: Cloro no aguanta. CYA: __. pH: __. Combinado: __. Acciones: [Renovación/Estabilizante/Choque]. Cloro dura: __ h antes / __ días después."
  },

  // ── 7. pH ALTO ──────────────────────────────────────────────────────────────
  ph_alto: {
    problema_explicado: "pH por encima de 7,6. Reduce la eficacia del cloro y favorece la precipitación de cal. En piscinas salinas es habitual que el pH suba cada pocas semanas.",
    situacion_visible: [
      "Medición de pH superior a 7,6.",
      "Posible agua ligeramente lechosa o con depósitos blancos.",
      "El cloro puede estar en rango pero con poca eficacia real.",
      "En piscinas salinas: subida de pH frecuente y esperada."
    ],
    riesgo_inmediato: [
      "⚠️ pH alto reduce significativamente la eficacia del cloro.",
      "✅ Se puede mantener abierto si el cloro libre y el fondo están en orden.",
      "⚠️ pH > 8,0: desinfección muy comprometida. Priorizar corrección."
    ],
    descartar_urgente: [
      "Confirmar que el fondo es visible y que hay cloro libre presente.",
      "Medir alcalinidad antes de corregir el pH."
    ],
    comprobaciones_rapidas: [
      "¿Cuál es el pH exacto?",
      "¿Cuál es la alcalinidad total?",
      "¿Es piscina salina? (el electrodo sube el pH de forma natural).",
      "¿Se añadió bicarbonato o álcali recientemente?"
    ],
    parametros: [
      ["Parámetro", "Rango OK", "Si bajo", "Si alto", "Acción SOP"],
      ["Alcalinidad", "80–120 mg/L", "pH inestable", "pH 'pegado' arriba", "Si >120: corregir alcalinidad primero con corrector de alcalinidad. Re medir a las 4 h."],
      ["pH", "7,2–7,6", "Agua ácida / corrosiva", "Cloro ineficaz / cal", "Si >7,6 con alcalinidad en rango: reductor de pH en dos mitades separadas 4 h."]
    ],
    interpretacion_resultados: "Alcalinidad > 120 = corregir alcalinidad primero. pH alto con alcalinidad OK = reductor en dos dosis.",
    decision_sop: [
      {
        condicion: "Si alcalinidad > 120 mg/L:",
        pasos: [
          "Corregir la alcalinidad primero, no el pH directamente.",
          "Añadir corrector de alcalinidad según volumen y etiqueta.",
          "Filtrar y re medir la alcalinidad a las 4 h.",
          "Una vez la alcalinidad esté en rango, el pH tenderá a bajar."
        ]
      },
      {
        condicion: "Si alcalinidad en rango (80-120) y pH > 7,6:",
        pasos: [
          "Añadir reductor de pH para piscinas.",
          "Dosificar la mitad de la dosis calculada.",
          "Filtrar y re medir a las 4 h.",
          "Si el pH sigue > 7,6: añadir la segunda mitad.",
          "No aplicar toda la dosis de una sola vez."
        ]
      },
      {
        condicion: "Si pH > 8,0:",
        pasos: [
          "Priorizar la corrección del pH antes de añadir cloro.",
          "Con pH > 8,0 el cloro tiene eficacia muy reducida."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Medir pH y alcalinidad."],
      ["2", "Si alcalinidad > 120: corregir alcalinidad primero."],
      ["3", "Calcular dosis de reductor de pH según volumen y etiqueta."],
      ["4", "Añadir la mitad de la dosis con filtración en marcha."],
      ["5", "Filtrar y re medir a las 4 h."],
      ["6", "Si pH sigue > 7,6: añadir la segunda mitad."],
      ["7", "Re medir a las 4 h. Objetivo: 7,2-7,6."]
    ],
    protocolo: [
      "Medir pH y alcalinidad.",
      "Si alcalinidad > 120 mg/L: corregir la alcalinidad primero.",
      "Calcular la dosis de reductor de pH según volumen real y etiqueta.",
      "Añadir la primera mitad de la dosis con filtración en marcha.",
      "Filtrar y re medir a las 4 h.",
      "Si el pH sigue por encima de 7,6: añadir la segunda mitad.",
      "Re medir a las 4 h.",
      "Objetivo: pH entre 7,2 y 7,6."
    ],
    calculo_producto: "Reductor de pH en dos mitades separadas 4 h. Dosis según volumen y etiqueta del producto.",
    calculo_rapido: [
      "Dosis de reductor de pH: seguir etiqueta del producto según volumen real.",
      "Aplicar siempre en dos mitades separadas 4 horas.",
      "En piscinas salinas: prever corrección mensual como mantenimiento rutinario."
    ],
    checklist: "✓ pH y alcalinidad medidos | ✓ Alcalinidad corregida si > 120 | ✓ Primera dosis reductor pH | ✓ Re medición a 4 h | ✓ Segunda dosis si necesario | ✓ pH en rango 7,2-7,6",
    seguimiento: [
      {
        tiempo: "A 4 h:",
        notas: [
          "El pH debe haber bajado visiblemente.",
          "Si sigue alto: añadir la segunda dosis."
        ]
      },
      {
        tiempo: "A 8 h:",
        notas: [
          "El pH debe estar entre 7,2 y 7,6.",
          "Una vez en rango: verificar la eficacia del cloro."
        ]
      },
      {
        tiempo: "Si no baja después de dos dosis:",
        notas: [
          "Probable alcalinidad muy alta o dosificador mal calibrado.",
          "Revisar alcalinidad y derivar si persiste."
        ]
      }
    ],
    que_no_hacer: [
      "No añadir toda la dosis de reductor de golpe — puede bajar el pH en exceso.",
      "No corregir el pH si la alcalinidad está > 120 — el resultado no será estable.",
      "No mezclar reductor de pH con cloro directamente — riesgo de gases."
    ],
    cuando_cerrar_bano: ["No es obligatorio si el cloro libre y el fondo están en orden."],
    cliente: "El pH estaba alto, lo que reduce la eficacia del cloro. Lo hemos bajado en dos dosis para evitar oscilaciones bruscas. En piscinas salinas es normal que suba periódicamente.",
    parte: "Problema: pH alto. pH inicial: __. Alcalinidad: __. Reductor pH (1ª dosis): __. pH a 4 h: __. Reductor pH (2ª dosis si necesario): __. pH final: __."
  },

  // ── 8. pH BAJO ──────────────────────────────────────────────────────────────
  ph_bajo: {
    problema_explicado: "pH por debajo de 7,2. Agua ácida, irritante para los bañistas y agresiva para tuberías y equipos metálicos. Requiere corrección rápida.",
    situacion_visible: [
      "Medición de pH inferior a 7,2.",
      "Posibles quejas de irritación ocular o de piel de los bañistas.",
      "El agua puede tener aspecto normal visualmente.",
      "En casos graves (pH < 7,0): olor ligeramente ácido."
    ],
    riesgo_inmediato: [
      "⚠️ pH entre 7,0 y 7,2: agua irritante. Corregir en la próxima visita.",
      "⛔ pH < 7,0: desaconsejar el baño y corregir de inmediato.",
      "🛑 pH muy bajo puede dañar el sello mecánico de la bomba y las tuberías metálicas."
    ],
    descartar_urgente: [
      "pH < 7,0 → corregir antes de cualquier otra intervención.",
      "Medir alcalinidad: si es baja, corregir la alcalinidad primero."
    ],
    comprobaciones_rapidas: [
      "¿Cuál es el pH exacto?",
      "¿Cuál es la alcalinidad total?",
      "¿Se añadió reductor de pH en exceso recientemente?",
      "¿El agua de relleno es de pozo o de zona de agua blanda?"
    ],
    parametros: [
      ["Parámetro", "Rango OK", "Si bajo", "Si alto", "Acción SOP"],
      ["Alcalinidad", "80–120 mg/L", "pH inestable", "pH amortiguado", "Si < 80: corregir alcalinidad primero. Si > 120: ver ficha pH alto."],
      ["pH", "7,2–7,6", "Agua ácida / corrosiva", "Cloro ineficaz", "Si < 7,0: corregir urgente con elevador de pH. Si entre 7,0-7,2: corregir en esta visita."]
    ],
    interpretacion_resultados: "pH < 7,0 = urgente. Alcalinidad baja = corregir alcalinidad primero para que el pH se estabilice.",
    decision_sop: [
      {
        condicion: "Si alcalinidad < 80 mg/L:",
        pasos: [
          "Corregir la alcalinidad primero con elevador de alcalinidad.",
          "Calcular dosis según volumen y etiqueta.",
          "Filtrar y re medir alcalinidad a las 4 h.",
          "Una vez la alcalinidad esté en rango, re medir el pH."
        ]
      },
      {
        condicion: "Si alcalinidad en rango y pH < 7,2:",
        pasos: [
          "Añadir elevador de pH para piscinas.",
          "Calcular dosis según volumen real y etiqueta.",
          "Filtrar y re medir a las 2-4 h."
        ]
      },
      {
        condicion: "Si pH < 7,0:",
        pasos: [
          "Corregir de forma urgente.",
          "Añadir elevador de pH a dosis completa según etiqueta.",
          "Re medir a las 2 h.",
          "Desaconsejar el baño hasta tener pH ≥ 7,2."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Medir pH y alcalinidad."],
      ["2", "Si alcalinidad < 80: añadir elevador de alcalinidad y re medir a las 4 h."],
      ["3", "Una vez alcalinidad en rango: calcular dosis de elevador de pH."],
      ["4", "Añadir elevador de pH con filtración en marcha."],
      ["5", "Re medir a las 2-4 h."],
      ["6", "Objetivo: pH entre 7,2 y 7,6."],
      ["7", "Si pH < 7,0: desaconsejar el baño hasta la corrección."]
    ],
    protocolo: [
      "Medir pH y alcalinidad.",
      "Si alcalinidad < 80 mg/L: añadir elevador de alcalinidad. Re medir a las 4 h.",
      "Una vez la alcalinidad esté en rango: calcular dosis de elevador de pH.",
      "Añadir elevador de pH con filtración en marcha.",
      "Re medir a las 2-4 h.",
      "Objetivo: pH entre 7,2 y 7,6.",
      "Si pH < 7,0: comunicar al cliente que el baño no es recomendable hasta la corrección."
    ],
    calculo_producto: "Elevador de pH: dosis según volumen real y etiqueta del producto.",
    calculo_rapido: [
      "Dosis de elevador de pH: seguir etiqueta del producto según volumen real.",
      "Si la alcalinidad también está baja: corregir alcalinidad primero.",
      "Si el agua de relleno es habitualmente ácida: revisar en cada visita."
    ],
    checklist: "✓ pH y alcalinidad medidos | ✓ Alcalinidad corregida si < 80 | ✓ Elevador pH añadido | ✓ Filtración 4 h | ✓ pH en rango 7,2-7,6 | ✓ Cloro revisado tras corrección",
    seguimiento: [
      {
        tiempo: "A 2-4 h:",
        notas: [
          "El pH debe haber subido.",
          "Si no sube: comprobar que la alcalinidad está en rango."
        ]
      },
      {
        tiempo: "A 8 h:",
        notas: [
          "pH debe estar entre 7,2 y 7,6.",
          "Una vez en rango: verificar la eficacia del cloro."
        ]
      },
      {
        tiempo: "Si el pH baja de nuevo rápidamente:",
        notas: [
          "Probable alcalinidad baja o agua de relleno muy ácida.",
          "Revisar la fuente de agua y plantear corrección rutinaria."
        ]
      }
    ],
    que_no_hacer: [
      "No añadir cloro con pH < 7,0 — el agua ácida degrada el cloro y es agresiva para el equipo.",
      "No corregir el pH sin haber medido la alcalinidad primero."
    ],
    cuando_cerrar_bano: ["Desaconsejar el baño con pH < 7,0."],
    cliente: "El pH estaba demasiado bajo y el agua era irritante. Lo hemos subido con corrector. Puede que el agua de relleno sea ácida, por lo que habrá que vigilarlo en las próximas visitas.",
    parte: "Problema: pH bajo. pH inicial: __. Alcalinidad: __. Elevador alcalinidad: SÍ/NO. Elevador pH: __. pH final: __ (a __ h)."
  },

  // ── 9. CIANÚRICO ALTO ───────────────────────────────────────────────────────
  cianurico_alto: {
    problema_explicado: "CYA por encima de 100 mg/L bloquea la disponibilidad del cloro. No hay corrección química posible: la única solución es renovar parte del agua.",
    situacion_visible: [
      "El cloro libre cae rápido o está bajo aunque se dosa correctamente.",
      "CYA medido por encima de 100 mg/L.",
      "El agua puede tener buen aspecto visual.",
      "El problema es analítico: no es visible a simple vista."
    ],
    riesgo_inmediato: [
      "⚠️ Con CYA > 100 mg/L el cloro no desinfecta eficazmente, aunque la lectura de cloro libre sea positiva.",
      "✅ Se puede mantener abierto si el cloro libre es > 1 mg/L, pero resolver de inmediato.",
      "⚠️ No es visible ni urgente, pero es un riesgo real para la salud."
    ],
    descartar_urgente: [
      "Confirmar que el CYA es realmente > 100 y no un error de test.",
      "Repetir la medición con un kit diferente si hay duda."
    ],
    comprobaciones_rapidas: [
      "¿Cuánto tiempo lleva la piscina sin renovación de agua?",
      "¿Se usa cloro estabilizado (tricloro/dicloro) como fuente principal de cloro?",
      "¿Cuál es el CYA exacto?"
    ],
    parametros: [
      ["CYA", "Rango OK", "Interpretación", "Acción SOP"],
      ["< 20 mg/L", "Bajo", "Cloro se degrada por UV", "Añadir estabilizante para llevar a 30-50 mg/L."],
      ["30–50 mg/L", "OK", "Balance correcto", "Mantener. Vigilar si se usa cloro estabilizado."],
      ["50–100 mg/L", "Elevado", "Eficacia reducida", "No añadir más cloro estabilizado. Planificar renovación."],
      ["> 100 mg/L", "Crítico", "Cloro bloqueado", "Renovar agua 20-30% de inmediato. No añadir más cloro estabilizado."]
    ],
    interpretacion_resultados: "CYA > 100 = bloqueo del cloro. No hay producto que lo corrija. Solo renovación de agua.",
    decision_sop: [
      {
        condicion: "Si CYA > 100 mg/L:",
        pasos: [
          "No añadir más cloro estabilizado.",
          "Renovar parcialmente el agua: vaciar el 20-30% del volumen y rellenar con agua fresca.",
          "Re medir CYA tras la renovación.",
          "Si sigue > 100: repetir la renovación.",
          "Reajustar pH a 7,2-7,6.",
          "Ajustar cloro libre a 1-3 mg/L usando cloro no estabilizado."
        ]
      },
      {
        condicion: "Si CYA entre 50 y 100 mg/L:",
        pasos: [
          "No añadir más cloro estabilizado.",
          "Planificar renovación parcial de agua.",
          "Vigilar el cloro libre activamente."
        ]
      },
      {
        condicion: "Si CYA < 20 mg/L:",
        pasos: [
          "El cloro se degrada rápidamente por la radiación UV.",
          "Añadir estabilizante para llevar CYA a 30-50 mg/L.",
          "Re medir a los 2-3 días."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Medir CYA con kit fiable."],
      ["2", "Si CYA > 100: informar al cliente de la necesidad de renovar agua."],
      ["3", "Vaciar el 20-30% del volumen total."],
      ["4", "Rellenar con agua fresca."],
      ["5", "Re medir CYA: debe haber bajado proporcionalmente."],
      ["6", "Si CYA sigue > 100: repetir la renovación."],
      ["7", "Ajustar pH a 7,2-7,6."],
      ["8", "Ajustar cloro libre a 1-3 mg/L usando cloro no estabilizado."],
      ["9", "No usar cloro estabilizado hasta que CYA baje a < 50 mg/L."]
    ],
    protocolo: [
      "Medir CYA con kit fiable.",
      "Si CYA > 100 mg/L: informar al cliente de que hay que renovar agua.",
      "Vaciar el 20-30% del volumen total.",
      "Rellenar con agua fresca.",
      "Re medir CYA: debe haber bajado proporcionalmente.",
      "Si sigue > 100: repetir la renovación.",
      "Ajustar pH a 7,2-7,6.",
      "Ajustar cloro libre a 1-3 mg/L con cloro no estabilizado.",
      "No volver a usar cloro estabilizado hasta que el CYA sea < 50 mg/L."
    ],
    calculo_producto: "Renovación agua 20-30% del volumen. No hay producto que corrija el CYA alto.",
    calculo_rapido: [
      "Renovar el 20% del volumen reduce el CYA aproximadamente un 20%.",
      "Ejemplo: CYA = 130 mg/L, renovamos 25% → CYA resultante ≈ 97 mg/L.",
      "Si sigue alto: repetir una segunda renovación.",
      "No hay producto químico que baje el CYA: solo el agua fresca lo diluye."
    ],
    checklist: "✓ CYA medido | ✓ Sin más cloro estabilizado | ✓ Renovación realizada | ✓ CYA re medido tras renovación | ✓ pH ajustado | ✓ Cloro no estabilizado dosificado | ✓ CYA en rango 30-50",
    seguimiento: [
      {
        tiempo: "Tras la renovación:",
        notas: [
          "Re medir CYA a los 2 días (el agua de relleno necesita tiempo para mezclar bien).",
          "Objetivo: CYA entre 30 y 50 mg/L."
        ]
      },
      {
        tiempo: "A 1 semana:",
        notas: [
          "Confirmar que el cloro libre se mantiene en rango con dosis normales.",
          "Si el CYA vuelve a subir rápido: revisar si se sigue usando cloro estabilizado."
        ]
      }
    ],
    que_no_hacer: [
      "No intentar bajar el CYA con ningún producto químico — no funciona.",
      "No añadir más cloro estabilizado hasta tener CYA < 50 mg/L.",
      "No ignorar el CYA alto porque el agua tenga buen aspecto."
    ],
    cuando_cerrar_bano: ["No obligatorio, pero el agua no está bien desinfectada con CYA > 100."],
    cliente: "El estabilizante está en exceso y bloquea la acción del cloro. La única solución es cambiar parte del agua para diluirlo. No hay ningún producto que lo corrija.",
    parte: "Problema: CYA alto. CYA inicial: __ mg/L. Renovación: __% del volumen. CYA tras renovación: __ mg/L. pH ajustado: __. Cloro no estabilizado: __."
  },

  // ── 10. SALINO NO PRODUCE ───────────────────────────────────────────────────
  salino_no_produce: {
    problema_explicado: "El clorador salino está en marcha pero no genera cloro libre. Causas más frecuentes: célula calcificada, sal por debajo del mínimo o fallo de software.",
    situacion_visible: [
      "El equipo salino está encendido pero el cloro libre no sube.",
      "La pantalla puede mostrar error o producción al 0%.",
      "Posible alarma de 'sal baja' o 'flujo' en el panel.",
      "El agua tiene aspecto normal pero sin desinfección efectiva."
    ],
    riesgo_inmediato: [
      "⚠️ Sin producción de cloro: el agua no está desinfectada.",
      "⛔ Si el cloro libre es 0 y han pasado más de 24 h: cerrar baño.",
      "🔌 No abrir la célula con el equipo encendido."
    ],
    descartar_urgente: [
      "¿Hay cloro libre en el agua? Si es 0 y han pasado > 24 h: cerrar baño.",
      "¿La bomba está en marcha? Sin caudal, el clorador no funciona.",
      "¿El panel muestra algún error o alarma?"
    ],
    comprobaciones_rapidas: [
      "Salinidad en el display del clorador: ¿está en el rango indicado por el fabricante?",
      "¿La célula tiene depósitos blancos visibles (calcificación)?",
      "¿Cuándo se limpió la célula por última vez?",
      "¿El equipo muestra error de flujo, sal o temperatura?",
      "¿La temperatura del agua es inferior a 12 °C? (algunos cloradores reducen o paran la producción con agua fría)"
    ],
    parametros: [
      ["Revisión", "Normal", "Anomalía", "Acción"],
      ["Salinidad (display)", "Según fabricante", "Alarma de sal baja", "Añadir sal de piscina. Filtrar varias horas. Re medir."],
      ["Célula (visual)", "Sin depósitos", "Depósitos blancos", "Limpiar con vinagre o ácido diluido según fabricante."],
      ["Errores en panel", "Sin alarmas", "Error de flujo/sal/temp", "Revisar caudal, sal y temperatura. Reset si todo está en rango."]
    ],
    interpretacion_resultados: "Célula calcificada = causa más frecuente. Sal baja = segunda causa. Si ambas están bien y no produce: derivar.",
    decision_sop: [
      {
        condicion: "Si la salinidad está por debajo del mínimo del fabricante:",
        pasos: [
          "Añadir sal de piscina para alcanzar el rango indicado en el manual.",
          "Filtrar varias horas para disolver la sal.",
          "Re medir la salinidad y confirmar que el clorador la reconoce."
        ]
      },
      {
        condicion: "Si la célula tiene calcificación visible:",
        pasos: [
          "Apagar el clorador. No abrir la célula con el equipo encendido.",
          "Limpiar la célula con solución de ácido clorhídrico diluido o vinagre, según las instrucciones del fabricante.",
          "Tiempo de inmersión: 1 h con vinagre, o el indicado en el manual con ácido.",
          "Aclarar bien con agua limpia antes de reinstalar.",
          "No usar cepillos metálicos en los electrodos."
        ]
      },
      {
        condicion: "Si la sal está en rango y la célula está limpia pero no produce:",
        pasos: [
          "Hacer un reset del equipo según el manual del fabricante.",
          "Si tras el reset sigue sin producir: posible célula agotada o fallo electrónico.",
          "Derivar técnico especializado en el equipo."
        ]
      }
    ],
    acciones: [
      ["PASO", "ACCIÓN"],
      ["1", "Apagar el clorador (no la bomba)."],
      ["2", "Medir salinidad: ¿está en el rango del fabricante?"],
      ["3", "Si sal baja: añadir sal de piscina, filtrar y re medir a las 4 h."],
      ["4", "Inspeccionar la célula: ¿hay calcificación?"],
      ["5", "Si hay calcificación: limpiar según instrucciones del fabricante."],
      ["6", "Reinstalar la célula correctamente."],
      ["7", "Encender el clorador: sin errores en el panel."],
      ["8", "Re medir cloro libre a las 12 h."],
      ["9", "Si no hay producción: derivar técnico."]
    ],
    protocolo: [
      "Apagar el clorador (no apagar la bomba).",
      "Medir la salinidad: ¿está en el rango indicado por el fabricante?",
      "Si sal baja: añadir sal de piscina, filtrar varias horas y re medir.",
      "Inspeccionar visualmente la célula: ¿hay depósito blanco (calcificación)?",
      "Si hay calcificación: limpiar siguiendo las instrucciones del fabricante.",
      "Reinstalar la célula correctamente.",
      "Encender el clorador y comprobar que no aparecen errores.",
      "Re medir el cloro libre a las 12 h.",
      "Si no hay producción de cloro: derivar técnico especializado."
    ],
    calculo_producto: "Sal a añadir: seguir la tabla del fabricante según volumen. Orientativo: 1 kg de sal en 1 m³ ≈ +1 g/L de salinidad.",
    calculo_rapido: [
      "Sal a añadir: seguir la tabla del manual del fabricante según volumen real.",
      "Orientativo general: 1 kg de sal de piscina eleva la salinidad aprox. 1 g/L en 1 m³.",
      "Siempre consultar el manual del equipo específico.",
      "No sobredosificar sal — puede dañar el clorador y los equipos metálicos."
    ],
    checklist: "✓ Clorador apagado antes de abrir célula | ✓ Sal medida y añadida si necesario | ✓ Célula inspeccionada | ✓ Célula limpiada si necesario | ✓ Célula reinstalada | ✓ Sin errores en panel | ✓ Cloro libre sube a 12 h",
    seguimiento: [
      {
        tiempo: "A 4 h tras añadir sal:",
        notas: [
          "El clorador debe reconocer la salinidad correcta.",
          "Sin errores en el panel."
        ]
      },
      {
        tiempo: "A 12 h:",
        notas: [
          "El cloro libre debe haber subido.",
          "Si no sube con sal en rango y célula limpia: célula agotada o fallo electrónico."
        ]
      },
      {
        tiempo: "Si el cloro no sube en 24 h:",
        notas: [
          "Cerrar baño.",
          "Dosificar cloro manualmente mientras se resuelve el problema del clorador.",
          "Derivar técnico especializado."
        ]
      }
    ],
    que_no_hacer: [
      "No abrir la célula con el equipo encendido.",
      "No usar cepillos metálicos en los electrodos — los dañan.",
      "No ignorar la alarma de sal baja — sin sal suficiente el clorador no produce.",
      "No sobredosificar sal — puede dañar el equipo."
    ],
    cuando_cerrar_bano: ["Si el cloro libre es 0 durante más de 24 h."],
    cliente: "El sistema de cloro por sal no está produciendo. La célula necesitaba limpieza o había poca sal. Lo hemos revisado. Si en 24 h no produce cloro, habrá que revisar la célula con un técnico especializado.",
    parte: "Problema: Salino sin producción. Sal: __ g/L. Célula: [limpia/calcificada]. Limpieza realizada: SÍ/NO. Cloro libre a 12 h: __. Estado: [OK/derivar técnico]."
  }

}; // end V2

// ── Apply patches to fichas.json ──────────────────────────────────────────────
let patched = 0;

const updated = fichas.map(ficha => {
  const patch = V2[ficha.id];
  if (!patch) return ficha; // unchanged

  patched++;
  // Merge: spread existing ficha, override with v2 content
  // ID, categoria, prioridad, destacado are NEVER changed
  return {
    ...ficha,
    ...patch,
    // These must never change:
    id:        ficha.id,
    categoria: ficha.categoria,
    prioridad: ficha.prioridad,
    destacado: ficha.destacado,
    // Preserve fields not in patch:
    arbol_relacionado: ficha.arbol_relacionado,
    modulo_relacionado: patch.modulo_relacionado ?? ficha.modulo_relacionado,
    fuentes: patch.fuentes ?? ficha.fuentes,
    palabras_clave: patch.palabras_clave ?? ficha.palabras_clave,
    sinonimos: patch.sinonimos ?? ficha.sinonimos,
  };
});

fs.writeFileSync(FILE, JSON.stringify(updated, null, 2), 'utf8');
console.log(`✅ Patched ${patched} fichas. Total: ${updated.length}`);
