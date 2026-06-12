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

// ── Flatten any value to a plain string (no [object Object]) ─────────────────
function flat(v, sep = ' ') {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(x => flat(x, sep)).join(sep);
  if (typeof v === 'object') return Object.values(v).map(x => flat(x, sep)).join(sep);
  return '';
}

function escFlat(v) { return esc(flat(v)); }

// ── Generic-text filter ───────────────────────────────────────────────────────
const GENERIC_TEXTS = new Set([
  'no aplica',
  'no especificado',
  'no aplica en condiciones normales',
  'valorar cierre si compromete seguridad',
  'derivar si no se identifica causa',
  'corregir y hacer seguimiento',
  'riesgo medio',
  'riesgo alto',
  'riesgo medio: corregir y hacer seguimiento',
  'riesgo alto: actuar antes de uso normal',
  'sin riesgo inmediato',
  'seguimiento normal',
]);

function hasUsefulContent(value) {
  if (value == null) return false;
  if (Array.isArray(value) && !value.length) return false;
  if (typeof value === 'string' && !value.trim()) return false;
  const text = flat(value).trim().toLowerCase().replace(/\s+/g, ' ');
  if (!text) return false;
  return !GENERIC_TEXTS.has(text);
}

/** Filter array keeping only items with useful content */
function filterUseful(arr) {
  return ensureArr(arr).filter(x => hasUsefulContent(x));
}

// ── Accordion (native <details>) ──────────────────────────────────────────────
function accordion(id, label, content, { open = false, extraClass = '' } = {}) {
  if (!content) return '';
  return `<details class="d-accordion${extraClass ? ' ' + extraClass : ''}" id="${esc(id)}"${open ? ' open' : ''}>
    <summary class="d-accordion-summary">${label}</summary>
    <div class="d-accordion-body">${content}</div>
  </details>`;
}

// ── Shared section / list helpers ─────────────────────────────────────────────
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

function ensureArr(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
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
  const chipSrc = ficha.situacion_visible?.length
    ? ficha.situacion_visible.map(x => flat(x)).filter(Boolean)
    : (ficha.sintomas ?? []).map(x => flat(x));
  const chips = chipSrc.slice(0, 2)
    .map(s => `<span class="card-chip">${esc(s.substring(0, 45))}</span>`).join('');
  const resumen = esc((flat(ficha.situacion_visible) || ficha.problema_explicado || '').substring(0, 90)) + '…';

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

export function renderDrawerContent(ficha, prioridades, categorias = {}) {
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  return ficha.version_sop === 'campo_v2'
    ? renderDrawerV2(ficha, pLabel, categorias)
    : renderDrawerLegacy(ficha, pLabel, categorias);
}

// ─────────────────────────────────────────────────────────────────────────────
// V2 DRAWER  (version_sop: campo_v2)
// ─────────────────────────────────────────────────────────────────────────────

function renderFichaHeader(f, pLabel, categorias) {
  const cat = categorias?.[f.categoria] ?? { emoji: '📋', nombre: f.categoria };
  return `<div class="d-ficha-header">
    <h2 class="d-ficha-titulo">${esc(f.titulo)}</h2>
    <div class="d-ficha-meta">
      <span class="d-meta-cat">${cat.emoji} ${esc(cat.nombre)}${f.subcategoria ? ` · <em>${esc(f.subcategoria)}</em>` : ''}</span>
      <span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>
      ${f.version_sop === 'campo_v2' ? '<span class="d-v2-badge">SOP Campo V2</span>' : ''}
    </div>
  </div>`;
}

function buildQuickSummary(f) {
  const lines = [];

  // Riesgo principal
  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) {
    const txt = flat(ri[0]).replace(/^riesgo\s*(inmediato|alto|medio|bajo)?:?\s*/i, '').trim();
    if (txt) lines.push(`<div class="d-summary-item">
      <span class="d-summary-icon">⚠️</span>
      <span><strong>Riesgo:</strong> ${esc(txt.substring(0, 130))}</span>
    </div>`);
  }

  // Primera acción
  const proto = filterUseful(f.protocolo);
  const decs  = ensureArr(f.decision_sop);
  let primeraAccion = '';
  if (proto.length) {
    primeraAccion = flat(proto[0]).replace(/^\d+[\.\)]\s*/, '').trim();
  } else if (decs.length) {
    const first = decs[0];
    const hacer = ensureArr(first?.hacer ?? first?.pasos);
    if (hacer.length) primeraAccion = flat(hacer[0]);
  }
  if (primeraAccion) lines.push(`<div class="d-summary-item">
    <span class="d-summary-icon">🔎</span>
    <span><strong>Primero:</strong> ${esc(primeraAccion.substring(0, 130))}</span>
  </div>`);

  // Medición clave
  const pm = ensureArr(f.parametros).filter(p => p && typeof p === 'object' && p.parametro);
  if (pm.length) {
    const p0   = pm[0];
    const mTxt = p0.parametro + (p0.rango_objetivo ? ': ' + p0.rango_objetivo : '');
    lines.push(`<div class="d-summary-item">
      <span class="d-summary-icon">🧪</span>
      <span><strong>Medir:</strong> ${esc(mTxt.substring(0, 100))}</span>
    </div>`);
  }

  // Cierre/parada
  const cb = filterUseful(f.cuando_cerrar_bano);
  const pe = filterUseful(f.cuando_parar_equipo);
  if (cb.length || pe.length) {
    const txt = flat(cb.length ? cb[0] : pe[0]);
    if (txt) lines.push(`<div class="d-summary-item">
      <span class="d-summary-icon">🛑</span>
      <span><strong>${cb.length ? 'Cerrar baño:' : 'Parar equipo:'}</strong> ${esc(txt.substring(0, 130))}</span>
    </div>`);
  }

  if (!lines.length) return '';
  return `<div class="d-quick-summary">${lines.join('')}</div>`;
}

function buildMiniNav(f) {
  const fid = esc(f.id);
  const items = [];

  if (filterUseful(f.decision_sop).length || ensureArr(f.decision_sop).length)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-decision')">Decisión</button>`);
  if (ensureArr(f.parametros).length)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-mediciones')">Mediciones</button>`);
  if (filterUseful(f.protocolo).length)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-protocolo')">Protocolo</button>`);
  if (filterUseful(f.causa_raiz_probable).length)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-causa')">Causa raíz</button>`);
  if (filterUseful(f.cliente).length)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-cliente')">Cliente</button>`);
  const hasFuentes = filterUseful(f.fuentes).length || filterUseful(f.requiere_validacion_fuente).length || hasUsefulContent(f.nota_precision);
  if (hasFuentes)
    items.push(`<button class="d-nav-btn" onclick="openAccordion('${fid}-fuentes')">Fuentes</button>`);

  if (items.length < 2) return '';
  return `<nav class="d-ficha-nav" aria-label="Ir a sección">
    <span class="d-ficha-nav-label">Ir a:</span>
    ${items.join('')}
  </nav>`;
}

function renderDrawerV2(f, pLabel, categorias) {
  const fid   = f.id;
  const parts = [];

  // ── Header (always visible) ───────────────────────────────────────────────
  parts.push(renderFichaHeader(f, pLabel, categorias));

  // ── Quick summary ─────────────────────────────────────────────────────────
  const summary = buildQuickSummary(f);
  if (summary) {
    parts.push(`<div class="d-summary-wrap">
      <div class="d-section-label">⚡ Resumen rápido</div>
      ${summary}
    </div>`);
  }

  // ── Mini nav ─────────────────────────────────────────────────────────────
  parts.push(buildMiniNav(f));

  // ── Riesgo inmediato (open accordion) ─────────────────────────────────────
  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) {
    const isCrit = f.prioridad === 'critica' || f.prioridad === 'alta';
    const riHtml = `<div class="d-alert-block${isCrit ? ' d-alert-critica' : ''}">
      <ul>${ri.map(r => `<li>${esc(flat(r))}</li>`).join('')}</ul>
    </div>`;
    parts.push(accordion(`${fid}-riesgo`, '⚠ Riesgo inmediato', riHtml, { open: true }));
  }

  // ── Descarta primero — interactive Sí/No (open) ───────────────────────────
  const du = ensureArr(f.descartar_urgente);
  if (du.length) {
    const hasObjs = du.some(x => x && typeof x === 'object' && x.pregunta);
    let duHtml;
    if (hasObjs) {
      duHtml = `<div class="d-desc-list">${du.map((item, idx) => {
        const qid = `dq-${esc(fid)}-${idx}`;
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
        return `<li>${esc(flat(item))}</li>`;
      }).join('')}</div>`;
    } else {
      const useful = filterUseful(du);
      duHtml = useful.length ? `<ul>${useful.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>` : '';
    }
    if (duHtml) parts.push(accordion(`${fid}-descarta`, '🔴 Descarta primero', duHtml, { open: true }));
  }

  // ── Decisión SOP (open) ───────────────────────────────────────────────────
  const ds = ensureArr(f.decision_sop);
  if (ds.length) {
    const dsHtml = renderDecisionSop(ds);
    if (dsHtml) parts.push(accordion(`${fid}-decision`, '📋 Decisión SOP', dsHtml, { open: true }));
  }

  // ── Situación visible (closed) ────────────────────────────────────────────
  const sv = filterUseful(ensureArr(f.situacion_visible));
  if (sv.length) {
    parts.push(accordion(`${fid}-sv`, '👁 Situación visible',
      `<ul class="d-sv-list">${sv.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>`));
  }

  // ── Comprobaciones rápidas (closed) ───────────────────────────────────────
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
      if (!hasUsefulContent(item)) return '';
      return `<li>${esc(flat(item))}</li>`;
    }).filter(Boolean).join('');
    if (crHtml) {
      parts.push(accordion(`${fid}-compr`, '🔎 Comprobaciones rápidas',
        hasObjs ? `<div class="d-compr-list">${crHtml}</div>` : `<ul>${crHtml}</ul>`));
    }
  }

  // ── Parámetros (closed) ───────────────────────────────────────────────────
  const pm = ensureArr(f.parametros);
  if (pm.length) {
    const pmHtml = renderParametros(pm);
    if (pmHtml) parts.push(accordion(`${fid}-mediciones`, '📊 Qué medir', pmHtml));
  }

  // ── Protocolo (closed) ────────────────────────────────────────────────────
  const proto = filterUseful(f.protocolo);
  if (proto.length) {
    parts.push(accordion(`${fid}-protocolo`, '🔧 Protocolo paso a paso',
      `<ol class="d-protocolo">${proto.map(p => {
        const txt = flat(p).replace(/^\d+[\.\)]\s*/, '').trim();
        return `<li>${esc(txt)}</li>`;
      }).join('')}</ol>`));
  }

  // ── Cálculo rápido (closed) ───────────────────────────────────────────────
  const calc = filterUseful(f.calculo_rapido);
  if (calc.length) {
    parts.push(accordion(`${fid}-calculo`, '🧮 Cálculo rápido',
      `<div class="d-formula-list">${calc.map(c => `<code>${esc(flat(c))}</code>`).join('')}</div>`));
  }

  // ── Causa raíz probable (closed) ──────────────────────────────────────────
  const crp = filterUseful(f.causa_raiz_probable);
  if (crp.length) {
    parts.push(accordion(`${fid}-causa`, '🔍 Causa raíz probable',
      `<ul>${crp.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`));
  }

  // ── Solución paliativa (closed) ───────────────────────────────────────────
  const sp = filterUseful(f.solucion_paliativa);
  if (sp.length) {
    parts.push(accordion(`${fid}-pal`, '🩹 Solución paliativa',
      `<div class="d-solucion-pal"><ul>${sp.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul></div>`));
  }

  // ── Solución definitiva (closed) ──────────────────────────────────────────
  const sd = filterUseful(f.solucion_definitiva);
  if (sd.length) {
    parts.push(accordion(`${fid}-def`, '✅ Solución definitiva',
      `<div class="d-solucion-def"><ul>${sd.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul></div>`));
  }

  // ── Por qué puede recurrir (closed) ───────────────────────────────────────
  const pqr = filterUseful(f.por_que_recurre);
  if (pqr.length) {
    parts.push(accordion(`${fid}-recurre`, '🔁 Por qué puede recurrir',
      `<ul>${pqr.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ul>`));
  }

  // ── Construcción (closed) ─────────────────────────────────────────────────
  const con = filterUseful(f.construccion);
  if (con.length) {
    parts.push(accordion(`${fid}-const`, '🏗 Construcción: qué cambia el diagnóstico',
      `<ul>${con.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`));
  }

  // ── Qué NO hacer (closed) ─────────────────────────────────────────────────
  const qnh = filterUseful(f.que_no_hacer);
  if (qnh.length) {
    parts.push(accordion(`${fid}-nohacer`, '🚫 Qué NO hacer',
      `<ul class="d-no-hacer">${qnh.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  // ── Seguimiento (closed) ──────────────────────────────────────────────────
  const seg = filterUseful(f.seguimiento);
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
    parts.push(accordion(`${fid}-seg`, '📅 Seguimiento',
      hasObjs ? `<div>${segHtml}</div>` : `<ul>${segHtml}</ul>`));
  }

  // ── Cuándo cerrar baño (closed) ───────────────────────────────────────────
  const cb = filterUseful(f.cuando_cerrar_bano);
  if (cb.length) {
    parts.push(accordion(`${fid}-bano`, '🚿 Cuándo cerrar baño',
      `<ul>${cb.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`, { extraClass: 'd-acc-cerrar' }));
  }

  // ── Cuándo parar equipo (closed) ──────────────────────────────────────────
  const pe = filterUseful(f.cuando_parar_equipo);
  if (pe.length) {
    parts.push(accordion(`${fid}-equipo`, '⛔ Cuándo parar equipo',
      `<ul>${pe.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`, { extraClass: 'd-acc-parar' }));
  }

  // ── Cuándo derivar (closed) ───────────────────────────────────────────────
  const wd = filterUseful(f.cuando_derivar);
  if (wd.length) {
    parts.push(accordion(`${fid}-derivar`, '📞 Cuándo derivar',
      `<ul>${wd.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  }

  // ── Árbol de decisión link ────────────────────────────────────────────────
  if (f.arbol_relacionado) {
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">
      🌳 Ver árbol de decisión relacionado
    </button>`);
  }

  // ── Qué decir al cliente (closed) ─────────────────────────────────────────
  const cli = filterUseful(f.cliente);
  if (cli.length) {
    parts.push(accordion(`${fid}-cliente`, '💬 Qué decir al cliente',
      `<div class="d-note-inner">${cli.map(c => `<p>"${esc(flat(c))}"</p>`).join('')}</div>`));
  }

  // ── Parte de trabajo (closed) ─────────────────────────────────────────────
  const pt = filterUseful(f.parte);
  if (pt.length) {
    parts.push(accordion(`${fid}-parte`, '📋 Parte de trabajo',
      `<ul class="d-parte">${pt.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ul>`));
  }

  // ── Fuentes + validación (closed, combined) ───────────────────────────────
  const fue = filterUseful(f.fuentes);
  const rv  = filterUseful(f.requiere_validacion_fuente);
  const hayValidacion = rv.length || hasUsefulContent(f.nota_precision) || hasUsefulContent(f.nivel_confianza);

  if (fue.length || hayValidacion) {
    let fuentesHtml = '';

    if (fue.length) {
      fuentesHtml += `<div class="d-fuentes-inner">${fue.map(fu => {
        if (typeof fu === 'object' && fu.nombre) {
          return `<div class="d-fuente-item">
            <span class="d-fuente-tipo d-fuente-${esc(fu.tipo || 'general')}">${esc(fu.tipo || 'fuente')}</span>
            <strong>${esc(fu.nombre)}</strong>
            ${fu.uso ? `<span class="d-fuente-uso"> — ${esc(fu.uso)}</span>` : ''}
          </div>`;
        }
        return `<div class="d-fuente-item">${esc(flat(fu))}</div>`;
      }).join('')}</div>`;
    }

    if (hayValidacion) {
      fuentesHtml += `<div class="d-validacion">`;
      if (f.nivel_confianza && hasUsefulContent(f.nivel_confianza))
        fuentesHtml += `<p><strong>Nivel de confianza:</strong> ${esc(flat(f.nivel_confianza))}</p>`;
      if (hasUsefulContent(f.nota_precision))
        fuentesHtml += `<p class="d-nota-precision">${esc(flat(f.nota_precision))}</p>`;
      if (rv.length)
        fuentesHtml += `<ul class="d-rv-list">${rv.map(v => `<li>${esc(flat(v))}</li>`).join('')}</ul>`;
      fuentesHtml += `</div>`;
    }

    parts.push(accordion(`${fid}-fuentes`, '📚 Fuentes y validación', fuentesHtml));
  }

  return parts.filter(Boolean).join('\n');
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-renderers
// ─────────────────────────────────────────────────────────────────────────────

/** Renders parametros — objects or array-of-arrays; responsive via CSS */
function renderParametros(pm) {
  if (!pm?.length) return '';
  const first = pm[0];

  // Object format: [{parametro, rango_objetivo, que_indica_fuera_de_rango, accion_sop}]
  if (typeof first === 'object' && !Array.isArray(first) && first.parametro !== undefined) {
    const rows = pm.map(p => `<tr>
      <td data-label="Parámetro"><strong>${esc(p.parametro || '')}</strong></td>
      <td data-label="Rango objetivo">${esc(p.rango_objetivo || '')}</td>
      <td data-label="Qué indica fuera de rango">${esc(p.que_indica_fuera_de_rango || p.fuera_de_rango || '')}</td>
      <td data-label="Acción SOP">${esc(p.accion_sop || '')}</td>
    </tr>`).join('');
    return `<table class="d-table d-table-params">
      <thead><tr>
        <th>Parámetro</th><th>Rango objetivo</th>
        <th>Qué indica si está fuera</th><th>Acción SOP</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  // Array-of-arrays: [[header], [row], ...]
  if (Array.isArray(first)) {
    if (pm.length < 2) return '';
    const [headers, ...body] = pm;
    const ths = headers.map(h => `<th>${esc(h)}</th>`).join('');
    const trs = body.map(row =>
      `<tr>${row.map((c, i) => `<td data-label="${esc(headers[i] || '')}">${esc(c)}</td>`).join('')}</tr>`
    ).join('');
    return `<table class="d-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
  }

  return '';
}

/** Renders decision_sop blocks */
function renderDecisionSop(ds) {
  if (!ds?.length) return '';
  const first = ds[0];

  // V2 format: [{si, hacer[]}]
  if (typeof first === 'object' && !Array.isArray(first) && ('hacer' in first || 'si' in first)) {
    return ds.map(block => {
      const hacer = ensureArr(block.hacer ?? block.pasos).filter(h => hasUsefulContent(h));
      if (!block.si && !hacer.length) return '';
      // Avoid "Si: Si ..." duplication
      const condText = block.si || '';
      const prefix = /^si\b/i.test(condText.trim()) ? '' : 'Si ';
      return `<div class="d-sop-block">
        ${condText ? `<div class="d-sop-condicion">${prefix}${esc(condText)}</div>` : ''}
        ${hacer.length
          ? `<ul class="d-sop-hacer">${hacer.map(h => `<li>→ ${esc(flat(h))}</li>`).join('')}</ul>`
          : ''}
      </div>`;
    }).filter(Boolean).join('');
  }

  // Old format: [{condicion, pasos[]}]
  if (typeof first === 'object' && !Array.isArray(first) && first.condicion) {
    return ds.map(block => {
      const pasos = ensureArr(block.pasos).filter(p => hasUsefulContent(p));
      return `<div class="d-sop-block">
        <div class="d-sop-condicion">${esc(block.condicion)}</div>
        <ol class="d-sop-pasos">${pasos.map(p => `<li>${esc(flat(p))}</li>`).join('')}</ol>
      </div>`;
    }).join('');
  }

  // String array
  const useful = ds.filter(s => hasUsefulContent(s));
  return useful.length ? `<ul>${useful.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>` : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY DRAWER  (fichas without version_sop = 'campo_v2')
// ─────────────────────────────────────────────────────────────────────────────

function renderTable(rows) {
  if (!rows || rows.length < 2) return '';
  const [headers, ...body] = rows;
  const ths = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = body.map(row =>
    `<tr>${row.map((c, i) => `<td data-label="${esc(headers[i] || '')}">${esc(c)}</td>`).join('')}</tr>`
  ).join('');
  return `<table class="d-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function renderDrawerLegacy(ficha, pLabel, categorias) {
  // Route semi-V2 fichas (have V2 fields but no version_sop marker)
  const isV2Like = !!(ficha.situacion_visible || ficha.protocolo?.length || ficha.decision_sop?.length);
  if (isV2Like) return renderDrawerSemiV2(ficha, pLabel, categorias);

  const cat = categorias?.[ficha.categoria] ?? { emoji: '📋', nombre: ficha.categoria };
  const parts = [];

  // Header
  parts.push(`<div class="d-ficha-header">
    <h2 class="d-ficha-titulo">${esc(ficha.titulo)}</h2>
    <div class="d-ficha-meta">
      <span class="d-meta-cat">${cat.emoji} ${esc(cat.nombre)}</span>
      <span class="priority-badge ${esc(ficha.prioridad)}">${esc(pLabel)}</span>
    </div>
  </div>`);

  if (hasUsefulContent(ficha.problema_explicado))
    parts.push(dsec('1. Qué está pasando', `<p>${esc(ficha.problema_explicado)}</p>`));

  const sint = filterUseful(ficha.sintomas);
  if (sint.length) parts.push(dsec('2. Síntomas', `<ul>${sint.map(s => `<li>${esc(flat(s))}</li>`).join('')}</ul>`));

  const caus = filterUseful(ficha.causas);
  if (caus.length) parts.push(dsec('3. Causas', `<ul>${caus.map(c => `<li>${esc(flat(c))}</li>`).join('')}</ul>`));

  const pmHtml = renderParametros(ficha.parametros);
  if (pmHtml) {
    let extra = '';
    if (hasUsefulContent(ficha.interpretacion_resultados))
      extra = `<p><strong>Interpretación:</strong> ${esc(ficha.interpretacion_resultados)}</p>`;
    parts.push(dsec('4. Qué medir', pmHtml + extra));
  }

  const tbl = renderTable(ficha.acciones);
  if (tbl) parts.push(dsec('5. Acciones paso a paso', tbl));

  if (hasUsefulContent(ficha.calculo_producto)) {
    parts.push(`<div class="d-formula">
      <div class="d-section-label">6. Cálculo</div>
      <code>${esc(ficha.calculo_producto)}</code>
    </div>`);
  }

  if (hasUsefulContent(ficha.checklist)) {
    parts.push(`<div class="d-checklist">
      <div class="d-section-label">7. Checklist</div>
      <p>${esc(ficha.checklist)}</p>
    </div>`);
  }

  const qnh = filterUseful(ficha.que_no_hacer);
  if (qnh.length) parts.push(dsec('8. Qué NO hacer',
    `<ul class="d-no-hacer">${qnh.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  if (hasUsefulContent(ficha.construccion))
    parts.push(dsec('9. Construcción / contexto', `<p>${esc(flat(ficha.construccion))}</p>`));

  const cbL = filterUseful(ficha.cuando_cerrar_bano);
  if (cbL.length) parts.push(dsec('10. Cerrar baño',
    `<ul>${cbL.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`, ' d-cerrar-bano'));

  const wdL = filterUseful(ficha.cuando_derivar);
  if (wdL.length) parts.push(dsec('11. Cuándo derivar',
    `<ul>${wdL.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  if (ficha.arbol_relacionado)
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(ficha.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);

  const cliL = flat(ficha.cliente);
  if (hasUsefulContent(cliL))
    parts.push(`<div class="d-note"><div class="d-note-label">💬 Cliente</div><p>"${esc(cliL)}"</p></div>`);

  const parteL = flat(ficha.parte);
  if (hasUsefulContent(parteL))
    parts.push(`<div class="d-note"><div class="d-note-label">📋 Parte de trabajo</div><p><code>${esc(parteL)}</code></p></div>`);

  return parts.filter(Boolean).join('\n');
}

// Semi-V2 fichas: have V2 fields but no version_sop marker
function renderDrawerSemiV2(f, pLabel, categorias) {
  const cat = categorias?.[f.categoria] ?? { emoji: '📋', nombre: f.categoria };
  const parts = [];

  parts.push(`<div class="d-ficha-header">
    <h2 class="d-ficha-titulo">${esc(f.titulo)}</h2>
    <div class="d-ficha-meta">
      <span class="d-meta-cat">${cat.emoji} ${esc(cat.nombre)}</span>
      <span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>
    </div>
  </div>`);

  // Quick summary
  const sum = buildQuickSummary(f);
  if (sum) parts.push(`<div class="d-summary-wrap"><div class="d-section-label">⚡ Resumen rápido</div>${sum}</div>`);

  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) parts.push(`<div class="d-alert-block">
    <strong>⚠ Riesgo inmediato</strong>
    <ul>${ri.map(r => `<li>${esc(flat(r))}</li>`).join('')}</ul>
  </div>`);

  const du = filterUseful(f.descartar_urgente);
  if (du.length) parts.push(dsec('🔴 Descarta primero',
    `<ul class="d-checklist-list">${du.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  const cr = filterUseful(f.comprobaciones_rapidas);
  if (cr.length) parts.push(dsec('🔎 Comprobaciones rápidas',
    `<ul>${cr.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  const pm = ensureArr(f.parametros);
  if (pm.length > 1) parts.push(dsec('📊 Qué medir', renderParametros(pm)));

  const ds = ensureArr(f.decision_sop);
  if (ds.length) parts.push(dsec('📋 Decisión SOP', renderDecisionSop(ds)));

  const proto = filterUseful(f.protocolo);
  if (proto.length) parts.push(`<div class="d-section">
    <div class="d-section-label">🔧 Protocolo paso a paso</div>
    <ol class="d-protocolo">${proto.map(p => `<li>${esc(flat(p).replace(/^\d+[\.\)]\s*/, '').trim())}</li>`).join('')}</ol>
  </div>`);

  const calc = filterUseful(f.calculo_rapido);
  if (calc.length) parts.push(`<div class="d-formula">
    <div class="d-section-label">🧮 Cálculo</div>
    ${calc.map(c => `<code>${esc(flat(c))}</code>`).join('')}
  </div>`);

  const qnh = filterUseful(f.que_no_hacer);
  if (qnh.length) parts.push(dsec('🚫 Qué NO hacer',
    `<ul class="d-no-hacer">${qnh.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  const seg = filterUseful(f.seguimiento);
  if (seg.length) {
    const segHtml = seg.map(s => {
      if (typeof s === 'object' && s.tiempo)
        return `<div class="d-seguimiento-item"><strong>${esc(s.tiempo)}</strong>${s.notas?.length ? `<ul>${s.notas.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>`;
      return `<li>${esc(flat(s))}</li>`;
    }).join('');
    const hasObjs = seg.some(s => typeof s === 'object' && s.tiempo);
    parts.push(dsec('📅 Seguimiento', hasObjs ? `<div>${segHtml}</div>` : `<ul>${segHtml}</ul>`));
  }

  const cb = filterUseful(f.cuando_cerrar_bano);
  if (cb.length) parts.push(dsec('🚿 Cerrar baño',
    `<ul>${cb.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`, ' d-cerrar-bano'));

  const pe = filterUseful(f.cuando_parar_equipo);
  if (pe.length) parts.push(dsec('⛔ Parar equipo',
    `<ul>${pe.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`, ' d-parar-equipo'));

  const wd = filterUseful(f.cuando_derivar);
  if (wd.length) parts.push(dsec('📞 Cuándo derivar',
    `<ul>${wd.map(x => `<li>${esc(flat(x))}</li>`).join('')}</ul>`));

  if (f.arbol_relacionado)
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);

  const cli = flat(f.cliente);
  if (hasUsefulContent(cli))
    parts.push(`<div class="d-note"><div class="d-note-label">💬 Cliente</div><p>"${esc(cli)}"</p></div>`);

  const parte = flat(f.parte);
  if (hasUsefulContent(parte))
    parts.push(`<div class="d-note"><div class="d-note-label">📋 Parte de trabajo</div><p><code>${esc(parte)}</code></p></div>`);

  return parts.filter(Boolean).join('\n');
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
