/**
 * calculator.js — Volume calculator for the Cálculos tab.
 *
 * Formulas (authoritative — do not modify without domain review):
 *   Rectangular:  largo × ancho × profMedia
 *   Redonda:      (diámetro/2)² × π × profMedia
 *   Ovalada:      largo × ancho × profMedia × 0.89
 *   profMedia:    (profMin + profMax) / 2
 *   litros:       m³ × 1000
 *
 * NOTE: "Redonda" field was labelled "Largo" in the original app.
 * The field is now labelled "Diámetro (m)" as approved by the user.
 * The formula is unchanged: uses value as diameter, derives radius internally.
 */

const PI = Math.PI; // 3.14159…  (original used 3.14159, keeping full precision)

/**
 * Calculate pool volume.
 * @param {'rectangular'|'redonda'|'ovalada'} tipo
 * @param {number} largo  — for redonda: this is the DIAMETER
 * @param {number} ancho  — unused for redonda
 * @param {number} profMin
 * @param {number} profMax
 * @returns {{ profMedia: number, m3: number, litros: number } | null}
 */
export function calcularVolumen(tipo, largo, ancho, profMin, profMax) {
  const vals = [largo, profMin, profMax];
  if (tipo !== 'redonda') vals.push(ancho);
  if (vals.some(v => !isFinite(v) || v <= 0)) return null;

  const profMedia = (profMin + profMax) / 2;
  let m3;

  if (tipo === 'rectangular') {
    m3 = largo * ancho * profMedia;
  } else if (tipo === 'redonda') {
    const radio = largo / 2;
    m3 = radio * radio * PI * profMedia;
  } else if (tipo === 'ovalada') {
    m3 = largo * ancho * profMedia * 0.89;
  } else {
    return null;
  }

  return {
    profMedia: Math.round(profMedia * 100) / 100,
    m3:        Math.round(m3 * 100) / 100,
    litros:    Math.round(m3 * 1000),
  };
}

/** Returns a human-readable summary string for clipboard copy. */
export function formatResultado({ profMedia, m3, litros }) {
  return `Profundidad media: ${profMedia} m | Volumen: ${m3} m³ | Litros: ${litros.toLocaleString('es-ES')} L`;
}

/**
 * Update the "Largo/Diámetro" label and visibility of the Ancho field
 * depending on pool type. Called whenever the type selector changes.
 */
export function actualizarCamposCalc(tipo) {
  const largoLabel = document.getElementById('calc-largo-label');
  const anchoGroup = document.getElementById('calc-ancho-group');
  if (!largoLabel || !anchoGroup) return;

  if (tipo === 'redonda') {
    largoLabel.textContent = 'Diámetro (m)';
    anchoGroup.hidden = true;
    const anchoInput = document.getElementById('calc-ancho');
    if (anchoInput) anchoInput.value = '';
  } else {
    largoLabel.textContent = 'Largo (m)';
    anchoGroup.hidden = false;
  }
}
