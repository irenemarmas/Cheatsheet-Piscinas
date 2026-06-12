/**
 * render.js — All HTML rendering helpers.
 * Handles both legacy fichas and V2 SOP Campo fichas (version_sop: 'campo_v2').
 */

// ── XSS escape ────────────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Flatten any value to a safe HTML string (no [object Object]) ───────────────
function flat(v, sep = ' ') {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(x => flat(x, sep)).join(sep);
  if (typeof v === 'object') return Object.values(v).map(x => flat(x, sep)).join(sep);
  return '';
}

function escFlat(v) { return esc(flat(v)); }

// ── Shared section helpers ─────────────────────────────────────────────────────
function dsec(label, content, extraClass = '') {
  if (!content) return '';
  return `<div class="d-section${extraClass ? ' ' + extraClass : ''}">
    <div class="d-section-label">${label}</div>
    ${content}
  </div>`;
}

function dlist(arr, emptyMsg = '') {
  if (!arr?.length) return emptyMsg ? `<p class="d-empty">${emptyMsg}</p>` : '';
  return `<ul>${arr.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`;
}

// ── Categories ────────────────────────────────────────────────────────────────
export function renderCategorias(categorias, fichas, activeKey) {
  const counts = {};
  fichas.forEach(f => { counts[f.categoria] = (counts[f.categoria] || 0) + 1; });
  return Object.entries(categorias)
    .filter(([key]) => counts[key])
    .map(([key, cat]) => `
      <button
        class="category-btn${activeKey === key ? ' active' : ''}"
        data-cat="${esc(key)}"
        aria-pressed="${activeKey === key}"
        aria-label="${esc(cat.nombre)}: ${counts[key]} fichas"
      >
        <span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>
        <span>${esc(cat.nombre)}</span>
        <span class="cat-count">${counts[key]}</span>
      </button>`)
    .join('');
}

// ── Ficha cards ───────────────────────────────────────────────────────────────
export function renderCard(ficha, categorias, prioridades) {
  const cat    = categorias[ficha.categoria] ?? { emoji: '📋', nombre: ficha.categoria };
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  // For chips: use situacion_visible items or sintomas
  const chipSrc = ficha.situacion_visible?.length
    ? ficha.situacion_visible.map(x => flat(x)).filter(Boolean)
    : (ficha.sintomas ?? []).map(x => flat(x));
  const chips = chipSrc.slice(0, 2)
    .map(s => `<span class="card-chip">${esc(s.substring(0, 45))}</span>`).join('');
  const resumen = esc((ficha.problema_explicado ?? flat(ficha.situacion_visible) ?? '').substring(0, 90)) + '…';

  return `
    <article
      class="card${ficha.version_sop === 'campo_v2' ? ' card-v2' : ''}"
      role="button" tabindex="0"
      aria-label="Abrir ficha: ${esc(ficha.titulo)}"
      data-ficha-id="${esc(ficha.id)}"
    >
      <div class="card-priority priority-${esc(ficha.prioridad)}" aria-label="Prioridad: ${esc(pLabel)}">${esc(pLabel)}</div>
      <p class="card-title">${esc(ficha.titulo)}</p>
      <p class="card-cat">${cat.emoji} ${esc(cat.nombre)}</p>
      <p class="card-resumen">${resumen}</p>
      <div class="card-chips" aria-hidden="true">${chips}</div>
    </article>`;
}

export function renderCards(fichas, categorias, prioridades) {
  return fichas.map(f => renderCard(f, categorias, prioridades)).join('');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── DRAWER CONTENT ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function renderDrawerContent(ficha, prioridades) {
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  return ficha.version_sop === 'campo_v2'
    ? renderDrawerV2(ficha, pLabel)
    : renderDrawerLegacy(ficha, pLabel);
}

// ─────────────────────────────────────────────────────────────────────────────
// V2 DRAWER (version_sop: campo_v2)
// ─────────────────────────────────────────────────────────────────────────────

function renderDrawerV2(f, pLabel) {
  const parts = [];

  // ── Header badges ────────────────────────────────────────────────────────
  parts.push(`
    <div class="d-header-row">
      <span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>
      <span class="d-v2-badge">SOP Campo V2</span>
    </div>`);

  // ── 1. Situación visible ─────────────────────────────────────────────────
  const sv = ensureArr(f.situacion_visible).map(x => flat(x)).filter(Boolean);
  if (sv.length) {
    parts.push(dsec('👁 Situación visible',
      `<ul class="d-sv-list">${sv.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`));
  }

  // ── 2. Riesgo inmediato ──────────────────────────────────────────────────
  const ri = ensureArr(f.riesgo_inmediato).map(x => flat(x)).filter(Boolean);
  if (ri.length) {
    const isCrit = f.prioridad === 'critica' || f.prioridad === 'alta';
    parts.push(`<div class="d-alert-block${isCrit ? ' d-alert-critica' : ''}">
      <strong>⚠ Riesgo inmediato</strong>
      <ul>${ri.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    </div>`);
  }

  // ── 3. Descarta primero (interactive Sí/No) ──────────────────────────────
  const du = ensureArr(f.descartar_urgente);
  if (du.length) {
    const duHtml = du.map((item, idx) => {
      const qid = `dq-${esc(f.id)}-${idx}`;
      if (item && typeof item === 'object' && item.pregunta) {
        return `<div class="d-desc-block" id="${qid}">
          <div class="d-desc-pregunta">${esc(item.pregunta)}</div>
          <div class="d-desc-btns">
            <button class="btn-si" onclick="sopToggle('${qid}','si')" aria-pressed="false">✓ Sí</button>
            <button class="btn-no" onclick="sopToggle('${qid}','no')" aria-pressed="false">✗ No</button>
          </div>
          <div class="d-desc-resp d-resp-si" id="${qid}-si" hidden>
            <span class="d-resp-icon">✅</span> ${esc(item.si || '')}
          </div>
          <div class="d-desc-resp d-resp-no" id="${qid}-no" hidden>
            <span class="d-resp-icon">⛔</span> ${esc(item.no || '')}
          </div>
        </div>`;
      }
      // Legacy string format
      return `<li>${esc(flat(item))}</li>`;
    });
    const hasObjs = du.some(x => x && typeof x === 'object' && x.pregunta);
    if (hasObjs) {
      parts.push(dsec('🔴 Descarta primero', `<div class="d-desc-list">${duHtml.join('')}</div>`));
    } else {
      parts.push(dsec('🔴 Descarta primero', `<ul>${duHtml.join('')}</ul>`));
    }
  }

  // ── 4. Comprobaciones rápidas ────────────────────────────────────────────
  const cr = ensureArr(f.comprobaciones_rapidas);
  if (cr.length) {
    const hasObjs = cr.some(x => x && typeof x === 'object' && x.accion);
    const crHtml = cr.map(item => {
      if (item && typeof item === 'object' && item.accion) {
        return `<div class="d-compr-block">
          <span class="d-compr-num">${esc(String(item.orden ?? ''))}</span>
          <div class="d-compr-body">
            ${item.bloque ? `<div class="d-compr-bloque">${esc(item.bloque)}</div>` : ''}
            <div class="d-compr-accion">${esc(item.accion)}</div>
          </div>
        </div>`;
      }
      return `<li>${esc(flat(item))}</li>`;
    }).join('');
    parts.push(dsec('🔎 Comprobaciones rápidas',
      hasObjs ? `<div class="d-compr-list">${crHtml}</div>` : `<ul>${crHtml}</ul>`));
  }

  // ── 5. Parámetros / mediciones ───────────────────────────────────────────
  const pm = ensureArr(f.parametros);
  if (pm.length) parts.push(dsec('📊 Qué medir', renderParametros(pm)));

  // ── 6. Decisión SOP ──────────────────────────────────────────────────────
  const ds = ensureArr(f.decision_sop);
  if (ds.length) parts.push(dsec('📋 Decisión SOP', renderDecisionSop(ds)));

  // ── 7. Protocolo paso a paso ─────────────────────────────────────────────
  const proto = ensureArr(f.protocolo).filter(Boolean);
  if (proto.length) {
    parts.push(`<div class="d-section">
      <div class="d-section-label">🔧 Protocolo paso a paso</div>
      <ol class="d-protocolo">${proto.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ol>
    </div>`);
  }

  // ── 8. Cálculo rápido ────────────────────────────────────────────────────
  const calc = ensureArr(f.calculo_rapido).filter(Boolean);
  if (calc.length) {
    parts.push(`<div class="d-formula">
      <div class="d-section-label">🧮 Cálculo</div>
      ${calc.map(c => `<code>${esc(flat(c))}</code>`).join('')}
    </div>`);
  }

  // ── 9. Causa raíz probable ───────────────────────────────────────────────
  const crp = ensureArr(f.causa_raiz_probable).filter(Boolean);
  if (crp.length) {
    parts.push(dsec('🔍 Causa raíz probable',
      `<ul>${crp.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`));
  }

  // ── 10. Solución paliativa ───────────────────────────────────────────────
  const sp = ensureArr(f.solucion_paliativa).filter(Boolean);
  if (sp.length) {
    parts.push(`<div class="d-section d-solucion-pal">
      <div class="d-section-label">🩹 Solución paliativa <span class="d-sol-badge d-sol-pal">Temporal</span></div>
      <ul>${sp.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>
    </div>`);
  }

  // ── 11. Solución definitiva ──────────────────────────────────────────────
  const sd = ensureArr(f.solucion_definitiva).filter(Boolean);
  if (sd.length) {
    parts.push(`<div class="d-section d-solucion-def">
      <div class="d-section-label">✅ Solución definitiva <span class="d-sol-badge d-sol-def">Definitiva</span></div>
      <ul>${sd.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>
    </div>`);
  }

  // ── 12. Por qué puede recurrir ───────────────────────────────────────────
  const pqr = ensureArr(f.por_que_recurre).filter(Boolean);
  if (pqr.length) {
    parts.push(dsec('🔁 Por qué puede recurrir',
      `<ul>${pqr.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ul>`));
  }

  // ── 13. Construcción ─────────────────────────────────────────────────────
  const con = ensureArr(f.construccion).filter(Boolean);
  if (con.length) {
    parts.push(dsec('🏗 Construcción: qué cambia el diagnóstico',
      `<ul>${con.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`));
  }

  // ── 14. Qué NO hacer ─────────────────────────────────────────────────────
  const qnh = ensureArr(f.que_no_hacer).filter(Boolean);
  if (qnh.length) {
    parts.push(dsec('🚫 Qué NO hacer',
      `<ul class="d-no-hacer">${qnh.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  // ── 15. Seguimiento ──────────────────────────────────────────────────────
  const seg = ensureArr(f.seguimiento).filter(Boolean);
  if (seg.length) {
    const segHtml = seg.map(s => {
      if (typeof s === 'object' && s.tiempo) {
        return `<div class="d-seguimiento-item">
          <strong>${esc(s.tiempo)}</strong>
          ${s.notas?.length ? `<ul>${s.notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
        </div>`;
      }
      return `<li>${esc(flat(s))}</li>`;
    }).join('');
    const hasObjs = seg.some(s => typeof s === 'object' && s.tiempo);
    parts.push(dsec('📅 Seguimiento',
      hasObjs ? `<div>${segHtml}</div>` : `<ul>${segHtml}</ul>`));
  }

  // ── 16. Cerrar baño ──────────────────────────────────────────────────────
  const cb = ensureArr(f.cuando_cerrar_bano).filter(Boolean);
  const cerrarClass = cb.length ? ' d-cerrar-bano' : '';
  parts.push(dsec('🚿 Cuándo cerrar baño',
    cb.length
      ? `<ul>${cb.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No aplica en condiciones normales.</p>',
    cerrarClass));

  // ── 17. Parar equipo ─────────────────────────────────────────────────────
  const pe = ensureArr(f.cuando_parar_equipo).filter(Boolean);
  if (pe.length) {
    parts.push(dsec('⛔ Cuándo parar equipo',
      `<ul>${pe.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`,
      ' d-parar-equipo'));
  }

  // ── 18. Cuándo derivar ───────────────────────────────────────────────────
  const wd = ensureArr(f.cuando_derivar).filter(Boolean);
  if (wd.length) {
    parts.push(dsec('📞 Cuándo derivar',
      `<ul>${wd.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  // ── Tree link ────────────────────────────────────────────────────────────
  if (f.arbol_relacionado) {
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">
      🌳 Ver árbol de decisión relacionado
    </button>`);
  }

  // ── 19. Cliente ──────────────────────────────────────────────────────────
  const cli = ensureArr(f.cliente).filter(Boolean);
  if (cli.length) {
    parts.push(`<div class="d-note">
      <div class="d-note-label">💬 Qué decir al cliente</div>
      ${cli.map(c => `<p>"${esc(flat(c))}"</p>`).join('')}
    </div>`);
  }

  // ── 20. Parte de trabajo ─────────────────────────────────────────────────
  const pt = ensureArr(f.parte).filter(Boolean);
  if (pt.length) {
    parts.push(`<div class="d-note">
      <div class="d-note-label">📋 Parte de trabajo</div>
      <ul class="d-parte">${pt.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ul>
    </div>`);
  }

  // ── 21. Fuentes ──────────────────────────────────────────────────────────
  const fue = ensureArr(f.fuentes).filter(Boolean);
  if (fue.length) {
    parts.push(`<div class="d-fuentes">
      <div class="d-section-label">📚 Fuentes</div>
      ${fue.map(fu => {
        if (typeof fu === 'object' && fu.nombre) {
          return `<div class="d-fuente-item">
            <span class="d-fuente-tipo d-fuente-${esc(fu.tipo || 'general')}">${esc(fu.tipo || '')}</span>
            <strong>${esc(fu.nombre)}</strong>
            ${fu.uso ? `<span class="d-fuente-uso">— ${esc(fu.uso)}</span>` : ''}
          </div>`;
        }
        return `<div class="d-fuente-item">${esc(flat(fu))}</div>`;
      }).join('')}
    </div>`);
  }

  // ── 22. Nivel de confianza / validación pendiente ────────────────────────
  const rv = ensureArr(f.requiere_validacion_fuente).filter(Boolean);
  if (rv.length || f.nota_precision) {
    parts.push(`<div class="d-validacion">
      <div class="d-section-label">⚡ Validación pendiente</div>
      ${f.nota_precision ? `<p class="d-nota-precision">${esc(flat(f.nota_precision))}</p>` : ''}
      ${rv.length ? `<ul>${rv.map(v => `<li>${esc(flat(v))}</li>`).join('')}</ul>` : ''}
    </div>`);
  }

  return parts.join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-renderers (used by V2; also callable from legacy V2-upgraded fichas)
// ─────────────────────────────────────────────────────────────────────────────

/** Renders parametros regardless of format (objects or array-of-arrays) */
function renderParametros(pm) {
  if (!pm?.length) return '';
  const first = pm[0];

  // Object format: [{parametro, rango_objetivo, que_indica_fuera_de_rango|fuera_de_rango, accion_sop}]
  if (typeof first === 'object' && !Array.isArray(first) && first.parametro !== undefined) {
    const rows = pm.map(p => `<tr>
      <td><strong>${esc(p.parametro || '')}</strong></td>
      <td>${esc(p.rango_objetivo || '')}</td>
      <td>${esc(p.que_indica_fuera_de_rango || p.fuera_de_rango || '')}</td>
      <td>${esc(p.accion_sop || '')}</td>
    </tr>`).join('');
    return `<table class="d-table d-table-params">
      <thead><tr>
        <th>Parámetro</th><th>Rango objetivo</th>
        <th>Qué indica si está fuera</th><th>Acción SOP</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  // Array-of-arrays format: [[header], [row], ...]
  if (Array.isArray(first)) {
    if (pm.length < 2) return '';
    const [headers, ...body] = pm;
    const ths = headers.map(h => `<th>${esc(h)}</th>`).join('');
    const trs = body.map(row =>
      `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`
    ).join('');
    return `<table class="d-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  }

  return '';
}

/** Renders decision_sop regardless of format */
function renderDecisionSop(ds) {
  if (!ds?.length) return '';
  const first = ds[0];

  // V2 format: [{si, hacer[]}]
  if (typeof first === 'object' && !Array.isArray(first) && ('hacer' in first || 'si' in first)) {
    return ds.map(block => `
      <div class="d-sop-block">
        ${block.si ? `<div class="d-sop-condicion">Si: ${esc(block.si)}</div>` : ''}
        ${block.hacer?.length
          ? `<ul class="d-sop-hacer">${ensureArr(block.hacer).map(h => `<li>→ ${esc(flat(h))}</li>`).join('')}</ul>`
          : ''}
      </div>`).join('');
  }

  // Old V2 format: [{condicion, pasos[]}]
  if (typeof first === 'object' && !Array.isArray(first) && first.condicion) {
    return ds.map(block => `
      <div class="d-sop-block">
        <div class="d-sop-condicion">${esc(block.condicion)}</div>
        <ol class="d-sop-pasos">${ensureArr(block.pasos).map(p => `<li>${esc(flat(p))}</li>`).join('')}</ol>
      </div>`).join('');
  }

  // String array (legacy)
  return `<ul>${ds.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>`;
}

function ensureArr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY DRAWER (fichas without version_sop = 'campo_v2')
// ─────────────────────────────────────────────────────────────────────────────

function renderTable(rows) {
  if (!rows || rows.length < 2) return '<p class="d-empty">No especificado</p>';
  const [headers, ...body] = rows;
  const ths = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = body.map(row =>
    `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`
  ).join('');
  return `<table class="d-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function renderDrawerLegacy(ficha, pLabel) {
  const isV2Like = !!(ficha.situacion_visible || ficha.protocolo?.length || ficha.decision_sop?.length);
  if (isV2Like) return renderDrawerSemiV2(ficha, pLabel);

  const cerrarClass = ficha.cuando_cerrar_bano?.length ? ' d-cerrar-bano' : '';

  return `
    <span class="priority-badge ${esc(ficha.prioridad)}">${esc(pLabel)}</span>

    ${dsec('1. Qué está pasando', `<p>${esc(ficha.problema_explicado || 'No especificado')}</p>`)}

    ${dsec('2. Síntomas', ficha.sintomas?.length
      ? `<ul>${ficha.sintomas.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No especificado</p>')}

    ${dsec('3. Causas', ficha.causas?.length
      ? `<ul>${ficha.causas.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No especificado</p>')}

    ${dsec('4. Qué medir',
      renderParametros(ficha.parametros) +
      (ficha.interpretacion_resultados
        ? `<p><strong>Interpretación:</strong> ${esc(ficha.interpretacion_resultados)}</p>` : ''))}

    ${dsec('5. Acciones paso a paso', renderTable(ficha.acciones))}

    <div class="d-formula">
      <div class="d-section-label">6. Cálculo</div>
      <code>${esc(ficha.calculo_producto || 'No especificado')}</code>
    </div>

    ${ficha.checklist ? `<div class="d-checklist">
      <div class="d-section-label">7. Checklist</div>
      <p>${esc(ficha.checklist)}</p>
    </div>` : ''}

    ${dsec('8. Qué NO hacer', ficha.que_no_hacer?.length
      ? `<ul class="d-no-hacer">${ficha.que_no_hacer.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No especificado</p>')}

    ${dsec('9. Construcción / contexto',
      `<p>${esc(flat(ficha.construccion) || 'No especificado')}</p>`)}

    ${dsec('10. Cerrar baño', ficha.cuando_cerrar_bano?.length
      ? `<ul>${ficha.cuando_cerrar_bano.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No aplica</p>', cerrarClass)}

    ${dsec('11. Cuándo derivar', ficha.cuando_derivar?.length
      ? `<ul>${ficha.cuando_derivar.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`
      : '<p class="d-empty">No especificado</p>')}

    ${ficha.arbol_relacionado
      ? `<button class="d-tree-link" data-tree-id="${esc(ficha.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`
      : ''}

    <div class="d-note">
      <div class="d-note-label">💬 Cliente</div>
      <p>"${esc(flat(ficha.cliente) || 'No especificado')}"</p>
    </div>

    <div class="d-note">
      <div class="d-note-label">📋 Parte de trabajo</div>
      <p><code>${esc(flat(ficha.parte) || 'No especificado')}</code></p>
    </div>

    ${dsec('Módulo y fuentes',
      `<p><strong>Módulo:</strong> ${esc(ficha.modulo_relacionado || 'N/A')}</p>` +
      (ficha.fuentes?.length
        ? `<p><strong>Fuentes:</strong> ${ficha.fuentes.map(f => esc(flat(f))).join(', ')}</p>`
        : ''))}
  `;
}

// Semi-V2 legacy fichas (have V2 fields but no version_sop = campo_v2)
function renderDrawerSemiV2(f, pLabel) {
  const cerrarClass = f.cuando_cerrar_bano?.length ? ' d-cerrar-bano' : '';
  const parts = [];

  parts.push(`<span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>`);

  if (f.situacion_visible) {
    parts.push(dsec('👁 Situación visible',
      `<p class="d-highlight">${esc(flat(f.situacion_visible))}</p>`));
  }

  if (f.riesgo_inmediato) {
    parts.push(`<div class="d-alert-block"><strong>⚠ Riesgo inmediato:</strong> ${esc(flat(f.riesgo_inmediato))}</div>`);
  }

  if (f.descartar_urgente?.length) {
    parts.push(dsec('🔴 Descarta primero',
      `<ul class="d-checklist-list">${ensureArr(f.descartar_urgente).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  if (f.comprobaciones_rapidas?.length) {
    parts.push(dsec('🔎 Comprobaciones rápidas',
      `<ul>${ensureArr(f.comprobaciones_rapidas).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  if (f.parametros?.length > 1) {
    parts.push(dsec('📊 Qué medir', renderParametros(f.parametros)));
  }

  if (f.decision_sop?.length) {
    parts.push(dsec('📋 Protocolo por situación', renderDecisionSop(f.decision_sop)));
  }

  if (f.protocolo?.length) {
    parts.push(`<div class="d-section"><div class="d-section-label">🔧 Protocolo paso a paso</div>
      <ol>${ensureArr(f.protocolo).map(p => `<li>${esc(flat(p))}</li>`).join('')}</ol></div>`);
  }

  if (f.calculo_rapido?.length) {
    parts.push(`<div class="d-formula"><div class="d-section-label">🧮 Cálculo</div>
      ${ensureArr(f.calculo_rapido).map(c => `<code>${esc(flat(c))}</code>`).join('')}</div>`);
  }

  if (f.que_no_hacer?.length) {
    parts.push(dsec('🚫 Qué NO hacer',
      `<ul>${ensureArr(f.que_no_hacer).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  if (f.seguimiento?.length) {
    const seg = ensureArr(f.seguimiento);
    const segHtml = seg.map(s => {
      if (typeof s === 'object' && s.tiempo)
        return `<div class="d-seguimiento-item"><strong>${esc(s.tiempo)}</strong>${s.notas?.length ? `<ul>${s.notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>`;
      return `<li>${esc(flat(s))}</li>`;
    }).join('');
    const hasObjs = seg.some(s => typeof s === 'object' && s.tiempo);
    parts.push(dsec('📅 Seguimiento', hasObjs ? `<div>${segHtml}</div>` : `<ul>${segHtml}</ul>`));
  }

  parts.push(dsec('🚿 Cerrar baño', f.cuando_cerrar_bano?.length
    ? `<ul>${ensureArr(f.cuando_cerrar_bano).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`
    : '<p class="d-empty">No aplica</p>', cerrarClass));

  if (f.cuando_parar_equipo?.length) {
    parts.push(dsec('⛔ Parar equipo',
      `<ul>${ensureArr(f.cuando_parar_equipo).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`,
      ' d-parar-equipo'));
  }

  if (f.cuando_derivar?.length) {
    parts.push(dsec('📞 Cuándo derivar',
      `<ul>${ensureArr(f.cuando_derivar).map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  if (f.arbol_relacionado) {
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);
  }

  parts.push(`<div class="d-note"><div class="d-note-label">💬 Cliente</div>
    <p>"${esc(flat(f.cliente) || 'No especificado')}"</p></div>`);
  parts.push(`<div class="d-note"><div class="d-note-label">📋 Parte de trabajo</div>
    <p><code>${esc(flat(f.parte) || 'No especificado')}</code></p></div>`);

  return parts.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Cálculos cheat-sheet ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function renderCalculos(calculos) {
  const { volumenes, profundidad_media, conversion, dosificacion,
          parametros_referencia, advertencias } = calculos;

  const volRows = volumenes.map(v =>
    `<p><strong>${esc(v.tipo)}:</strong>${v.nota ? ` <em>(${esc(v.nota)})</em>` : ''}</p>
     <div class="chuleta-code">${esc(v.formula)}</div>`
  ).join('');

  const paramRows = parametros_referencia.map(p =>
    `<tr><td>${esc(p.param)}</td><td>${esc(p.rango)}</td></tr>`
  ).join('');

  return `
    <div class="chuleta-subsection">
      <h3>Cálculo de volumen por forma de piscina</h3>
      ${volRows}
      <p><strong>Profundidad media:</strong> ${esc(profundidad_media)}</p>
    </div>
    <div class="chuleta-subsection">
      <h3>Conversión volumen ↔ litros</h3>
      <div class="chuleta-code">${esc(conversion)}</div>
    </div>
    <div class="chuleta-subsection">
      <h3>Regla de tres para dosificación química</h3>
      <p>${esc(dosificacion.regla)}</p>
      <div class="chuleta-code">${esc(dosificacion.formula)}</div>
      <p><strong>Ejemplo:</strong> ${esc(dosificacion.ejemplo)}</p>
    </div>
    <div class="chuleta-subsection">
      <h3>Parámetros de referencia (piscina privada)</h3>
      <table class="chuleta-params">
        <thead><tr><th>Parámetro</th><th>Rango OK</th></tr></thead>
        <tbody>${paramRows}</tbody>
      </table>
    </div>
    <div class="chuleta-warning">
      ⚠️ <strong>ADVERTENCIAS CRÍTICAS:</strong><br>
      ${advertencias.map(a => `• ${esc(a)}`).join('<br>')}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── Decision trees ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export function renderArbol(arbol) {
  const nodes = arbol.nodes.map(node => {
    const opciones = node.ops.map(op => {
      const cls = op.res === 'Sí' ? 'tree-option-yes' : op.res === 'No' ? 'tree-option-no' : '';
      return `<div class="tree-option ${cls}" role="listitem">
        <div class="tree-option-label">${esc(op.res)}</div>
        <div class="tree-option-action">→ ${esc(op.act)}</div>
      </div>`;
    }).join('');
    return `<div class="tree-node">
      <div class="tree-question">${esc(node.q)}</div>
      <div role="list">${opciones}</div>
    </div>`;
  }).join('');
  return `<div class="tree-block" id="tree-${esc(arbol.id)}">
    <div class="tree-block-title">${esc(arbol.titulo)}</div>
    ${nodes}
  </div>`;
}

export function renderAllArboles(arboles) {
  return arboles.map(renderArbol).join('');
}

export function renderTreeNav(arboles, activeId) {
  return arboles.map(a => `
    <button
      class="tree-nav-btn${activeId === a.id ? ' active' : ''}"
      data-tree-id="${esc(a.id)}"
      aria-pressed="${activeId === a.id}"
    >${esc(a.titulo)}</button>`
  ).join('');
}
