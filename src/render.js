/**
 * render.js — HTML rendering helpers.
 * Legacy and V2 SOP Campo support.
 */

// ── Escape / flatten ──────────────────────────────────────────────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function flat(v, sep = ' ') {
  if (v == null)             return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v))      return v.map(x => flat(x, sep)).join(sep);
  if (typeof v === 'object') return Object.values(v).map(x => flat(x, sep)).join(sep);
  return '';
}
function ensureArr(v) { if (!v) return []; return Array.isArray(v) ? v : [v]; }

// ── Generic-text filter ───────────────────────────────────────────────────────
const GENERIC = new Set([
  'no aplica','no especificado','no aplica en condiciones normales',
  'valorar cierre si compromete seguridad','derivar si no se identifica causa',
  'corregir y hacer seguimiento','riesgo medio','riesgo alto','riesgo bajo',
  'riesgo medio: corregir y hacer seguimiento','riesgo alto: actuar antes de uso normal',
  'sin riesgo inmediato','seguimiento normal',
]);
function hasUsefulContent(v) {
  if (v == null) return false;
  if (Array.isArray(v) && !v.length) return false;
  if (typeof v === 'string' && !v.trim()) return false;
  const t = flat(v).trim().toLowerCase().replace(/\s+/g,' ');
  return t.length > 0 && !GENERIC.has(t);
}
function filterUseful(arr) { return ensureArr(arr).filter(x => hasUsefulContent(x)); }

// ── Accordion (native details/summary) ───────────────────────────────────────
function accordionSection(title, content, opts = {}) {
  if (!content) return '';
  const openAttr = opts.open ? ' open' : '';
  const idAttr   = opts.id   ? ` id="${esc(opts.id)}"` : '';
  const cls = 'sop-accordion' + (opts.extraClass ? ' ' + opts.extraClass : '');
  return `<details class="${cls}"${openAttr}${idAttr}>
  <summary>${title}</summary>
  <div class="sop-accordion-body">${content}</div>
</details>`;
}

// ── Legacy section helper ─────────────────────────────────────────────────────
function dsec(label, content, extraClass = '') {
  if (!content) return '';
  return `<div class="d-section${extraClass ? ' '+extraClass : ''}">
  <div class="d-section-label">${label}</div>
  ${content}
</div>`;
}

// ── Categories ────────────────────────────────────────────────────────────────
export function renderCategorias(categorias, fichas, activeKey) {
  const counts = {};
  fichas.forEach(f => { counts[f.categoria] = (counts[f.categoria] || 0) + 1; });
  return Object.entries(categorias)
    .filter(([key]) => counts[key])
    .map(([key, cat]) => `
      <button class="category-btn${activeKey===key?' active':''}" data-cat="${esc(key)}"
        aria-pressed="${activeKey===key}"
        aria-label="${esc(cat.nombre)}: ${counts[key]} fichas">
        <span class="cat-emoji" aria-hidden="true">${cat.emoji}</span>
        <span>${esc(cat.nombre)}</span>
        <span class="cat-count">${counts[key]}</span>
      </button>`).join('');
}

// ── Cards ─────────────────────────────────────────────────────────────────────
export function renderCard(ficha, categorias, prioridades) {
  const cat    = categorias[ficha.categoria] ?? { emoji:'📋', nombre: ficha.categoria };
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  const chipSrc = ficha.situacion_visible?.length
    ? ficha.situacion_visible.map(x => flat(x)).filter(Boolean)
    : (ficha.sintomas ?? []).map(x => flat(x));
  const chips = chipSrc.slice(0,2)
    .map(s => `<span class="card-chip">${esc(s.substring(0,45))}</span>`).join('');
  const resumen = esc((flat(ficha.situacion_visible)||ficha.problema_explicado||'').substring(0,90))+'…';
  return `<article class="card${ficha.version_sop==='campo_v2'?' card-v2':''}"
    role="button" tabindex="0"
    aria-label="Abrir ficha: ${esc(ficha.titulo)}"
    data-ficha-id="${esc(ficha.id)}">
    <div class="card-priority priority-${esc(ficha.prioridad)}">${esc(pLabel)}</div>
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
// DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
export function renderDrawerContent(ficha, prioridades, categorias = {}) {
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  return ficha.version_sop === 'campo_v2'
    ? renderDrawerV2(ficha, pLabel, categorias)
    : renderDrawerLegacy(ficha, pLabel, categorias);
}

// ── V2 sub-helpers ────────────────────────────────────────────────────────────
function fichaHeader(f, pLabel, categorias) {
  const cat = categorias?.[f.categoria] ?? { emoji:'📋', nombre: f.categoria };
  return `<header class="drawer-ficha-header">
  <h2>${esc(f.titulo)}</h2>
  <div class="drawer-ficha-meta">
    <span class="dh-cat">${cat.emoji} ${esc(cat.nombre)}</span>
    ${f.subcategoria ? `<span class="dh-subcat">${esc(f.subcategoria)}</span>` : ''}
    <span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>
    <span class="d-v2-badge">SOP Campo V2</span>
  </div>
</header>`;
}

function quickSummary(f) {
  const lines = [];
  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) {
    const t = flat(ri[0]).replace(/^riesgo\s*(inmediato|alto|medio|bajo)?:?\s*/i,'').trim();
    if (t) lines.push(`<div class="qs-item"><span>⚠️</span><span><strong>Riesgo:</strong> ${esc(t.substring(0,140))}</span></div>`);
  }
  const du = ensureArr(f.descartar_urgente);
  const fq = du.find(x => x && typeof x === 'object' && x.pregunta);
  if (fq) lines.push(`<div class="qs-item"><span>🔎</span><span><strong>Verificar:</strong> ${esc(fq.pregunta.substring(0,120))}</span></div>`);
  const ds = ensureArr(f.decision_sop);
  const fd = ds.find(x => x && (x.si || x.condicion));
  if (fd) {
    const hacer = ensureArr(fd.hacer ?? fd.pasos).filter(h => hasUsefulContent(h));
    const acc = hacer.length ? flat(hacer[0]) : '';
    if (acc) lines.push(`<div class="qs-item"><span>🧭</span><span><strong>Acción:</strong> ${esc(acc.substring(0,140))}</span></div>`);
  }
  const pm = ensureArr(f.parametros).filter(p => p && typeof p === 'object' && p.parametro);
  if (pm.length) {
    const p0 = pm[0];
    lines.push(`<div class="qs-item"><span>🧪</span><span><strong>Medir:</strong> ${esc((p0.parametro+(p0.rango_objetivo?': '+p0.rango_objetivo:'')).substring(0,100))}</span></div>`);
  }
  const cb = filterUseful(f.cuando_cerrar_bano);
  const pe = filterUseful(f.cuando_parar_equipo);
  if (cb.length||pe.length) {
    const t = flat(cb.length?cb[0]:pe[0]);
    if (t) lines.push(`<div class="qs-item"><span>🛑</span><span><strong>${cb.length?'Cerrar baño:':'Parar equipo:'}</strong> ${esc(t.substring(0,140))}</span></div>`);
  }
  if (!lines.length) return '';
  return `<section class="quick-summary"><h3>Resumen rápido</h3>${lines.join('')}</section>`;
}

function miniNav(fid, f) {
  const items = [];
  if (ensureArr(f.decision_sop).length)          items.push(`<button class="qnav-btn" onclick="openAccordion('${fid}-decision')">Decisión</button>`);
  if (ensureArr(f.parametros).length)             items.push(`<button class="qnav-btn" onclick="openAccordion('${fid}-mediciones')">Mediciones</button>`);
  if (filterUseful(f.protocolo).length)           items.push(`<button class="qnav-btn" onclick="openAccordion('${fid}-protocolo')">Protocolo</button>`);
  if (filterUseful(f.causa_raiz_probable).length) items.push(`<button class="qnav-btn" onclick="openAccordion('${fid}-causa')">Causa raíz</button>`);
  if (filterUseful(f.cliente).length)             items.push(`<button class="qnav-btn" onclick="openAccordion('${fid}-cliente')">Cliente</button>`);
  if (!items.length) return '';
  return `<nav class="quick-nav"><span class="qnav-label">Ir a:</span>${items.join('')}</nav>`;
}

function renderParametros(pm) {
  if (!pm?.length) return '';
  const first = pm[0];
  if (typeof first === 'object' && !Array.isArray(first) && first.parametro !== undefined) {
    const rows = pm.map(p => `<tr>
      <td data-label="Parámetro"><strong>${esc(p.parametro||'')}</strong></td>
      <td data-label="Rango objetivo">${esc(p.rango_objetivo||'')}</td>
      <td data-label="Qué indica fuera de rango">${esc(p.que_indica_fuera_de_rango||p.fuera_de_rango||'')}</td>
      <td data-label="Acción SOP">${esc(p.accion_sop||'')}</td>
    </tr>`).join('');
    return `<table class="param-table">
      <thead><tr><th>Parámetro</th><th>Rango objetivo</th><th>Qué indica fuera</th><th>Acción SOP</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }
  if (Array.isArray(first) && pm.length >= 2) {
    const [headers,...body] = pm;
    return `<table class="param-table">
      <thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
      <tbody>${body.map(row=>`<tr>${row.map((c,i)=>`<td data-label="${esc(headers[i]||'')}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
  }
  return '';
}

function renderDecisionSop(ds) {
  if (!ds?.length) return '';
  const first = ds[0];
  if (typeof first === 'object' && !Array.isArray(first) && ('hacer' in first || 'si' in first || 'condicion' in first)) {
    return ds.map(block => {
      const cond  = (block.si || block.condicion || '').trim();
      const hacer = ensureArr(block.hacer ?? block.pasos).filter(h => hasUsefulContent(h));
      if (!cond && !hacer.length) return '';
      // Avoid "Si: Si poca cantidad..." – don't prepend "Si" if text already starts with it
      const label = cond ? (/^si\b/i.test(cond) ? cond : `Si ${cond}`) : '';
      return `<div class="sop-decision-card">
        ${label ? `<div class="sop-decision-cond">${esc(label)}:</div>` : ''}
        ${hacer.length ? `<ul class="sop-decision-hacer">${hacer.map(h=>`<li>→ ${esc(flat(h))}</li>`).join('')}</ul>` : ''}
      </div>`;
    }).filter(Boolean).join('');
  }
  const useful = ds.filter(s => hasUsefulContent(s));
  return useful.length ? `<ul>${useful.map(s=>`<li>${esc(flat(s))}</li>`).join('')}</ul>` : '';
}

// ── V2 DRAWER ─────────────────────────────────────────────────────────────────
function renderDrawerV2(f, pLabel, categorias) {
  const fid   = f.id;
  const parts = [];

  parts.push(fichaHeader(f, pLabel, categorias));
  const qs = quickSummary(f); if (qs) parts.push(qs);
  const mn = miniNav(fid, f); if (mn) parts.push(mn);

  // RIESGO INMEDIATO (open)
  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) {
    const isCrit = f.prioridad==='critica'||f.prioridad==='alta';
    parts.push(accordionSection('⚠ Riesgo inmediato',
      `<ul>${ri.map(r=>`<li>${esc(flat(r))}</li>`).join('')}</ul>`,
      { open:true, id:`${fid}-riesgo`, extraClass: isCrit?'sop-acc-critica':'' }));
  }

  // DESCARTA PRIMERO (open) — interactive Sí/No
  const du = ensureArr(f.descartar_urgente);
  if (du.length) {
    const hasObjs = du.some(x => x && typeof x === 'object' && x.pregunta);
    let duHtml = '';
    if (hasObjs) {
      const items = du.map((item, idx) => {
        if (item && typeof item === 'object' && item.pregunta) {
          const qid = `dq-${esc(fid)}-${idx}`;
          return `<div class="sop-question" id="${qid}">
  <p class="sop-question-title">${esc(item.pregunta)}</p>
  <div class="sop-question-actions">
    <button type="button" class="btn-si" onclick="window.sopToggle('${qid}','si')" aria-pressed="false">✓ Sí</button>
    <button type="button" class="btn-no" onclick="window.sopToggle('${qid}','no')" aria-pressed="false">✗ No</button>
  </div>
  <div id="${qid}-si" class="sop-answer sop-answer-si">${esc(item.si||'')}</div>
  <div id="${qid}-no" class="sop-answer sop-answer-no">${esc(item.no||'')}</div>
</div>`;
        }
        return hasUsefulContent(item) ? `<li>${esc(flat(item))}</li>` : '';
      }).filter(Boolean);
      duHtml = `<div class="sop-questions-list">${items.join('')}</div>`;
    } else {
      const useful = filterUseful(du);
      if (useful.length) duHtml = `<ul>${useful.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`;
    }
    if (duHtml) parts.push(accordionSection('🔴 Descarta primero', duHtml, { open:true, id:`${fid}-descarta` }));
  }

  // DECISIÓN SOP (open)
  const ds = ensureArr(f.decision_sop);
  if (ds.length) {
    const dsHtml = renderDecisionSop(ds);
    if (dsHtml) parts.push(accordionSection('📋 Decisión SOP', dsHtml, { open:true, id:`${fid}-decision` }));
  }

  // SITUACIÓN VISIBLE (closed)
  const sv = filterUseful(ensureArr(f.situacion_visible));
  if (sv.length) parts.push(accordionSection('👁 Situación visible',
    `<ul>${sv.map(s=>`<li>${esc(flat(s))}</li>`).join('')}</ul>`, { id:`${fid}-sv` }));

  // COMPROBACIONES RÁPIDAS (closed)
  const cr = ensureArr(f.comprobaciones_rapidas);
  if (cr.length) {
    const hasObjsCR = cr.some(x => x && typeof x === 'object' && x.accion);
    const crItems = cr.map(item => {
      if (item && typeof item === 'object' && item.accion) {
        return `<div class="sop-compr-block">
  <span class="sop-compr-num">${esc(String(item.orden??''))}</span>
  <div class="sop-compr-body">
    ${item.bloque?`<div class="sop-compr-bloque">${esc(item.bloque)}</div>`:''}
    <div class="sop-compr-accion">${esc(item.accion)}</div>
  </div>
</div>`;
      }
      return hasUsefulContent(item)?`<li>${esc(flat(item))}</li>`:'';
    }).filter(Boolean);
    if (crItems.length) parts.push(accordionSection('🔎 Comprobaciones rápidas',
      hasObjsCR?`<div class="sop-compr-list">${crItems.join('')}</div>`:`<ul>${crItems.join('')}</ul>`,
      { id:`${fid}-compr` }));
  }

  // PARÁMETROS (closed)
  const pm = ensureArr(f.parametros);
  if (pm.length) { const pmH = renderParametros(pm); if (pmH) parts.push(accordionSection('📊 Qué medir', pmH, { id:`${fid}-mediciones` })); }

  // PROTOCOLO (closed) — strip any leading "1." from data
  const proto = filterUseful(f.protocolo);
  if (proto.length) {
    const stepsHtml = proto.map(p => {
      const t = flat(p).replace(/^\d+[\.\)]\s*/,'').trim();
      return t?`<li>${esc(t)}</li>`:'';
    }).filter(Boolean).join('');
    if (stepsHtml) parts.push(accordionSection('🔧 Protocolo paso a paso',
      `<ol class="sop-steps">${stepsHtml}</ol>`, { id:`${fid}-protocolo` }));
  }

  // CÁLCULO RÁPIDO (closed)
  const calc = filterUseful(f.calculo_rapido);
  if (calc.length) parts.push(accordionSection('🧮 Cálculo rápido',
    `<div class="sop-calc-list">${calc.map(c=>`<code>${esc(flat(c))}</code>`).join('')}</div>`,
    { id:`${fid}-calculo` }));

  // CAUSA RAÍZ (closed)
  const crp = filterUseful(f.causa_raiz_probable);
  if (crp.length) parts.push(accordionSection('🔍 Causa raíz probable',
    `<ul>${crp.map(c=>`<li>${esc(flat(c))}</li>`).join('')}</ul>`, { id:`${fid}-causa` }));

  // SOLUCIÓN PALIATIVA (closed)
  const sp = filterUseful(f.solucion_paliativa);
  if (sp.length) parts.push(accordionSection('🩹 Solución paliativa',
    `<ul>${sp.map(s=>`<li>${esc(flat(s))}</li>`).join('')}</ul>`, { id:`${fid}-pal` }));

  // SOLUCIÓN DEFINITIVA (closed)
  const sd = filterUseful(f.solucion_definitiva);
  if (sd.length) parts.push(accordionSection('✅ Solución definitiva',
    `<ul>${sd.map(s=>`<li>${esc(flat(s))}</li>`).join('')}</ul>`, { id:`${fid}-def` }));

  // POR QUÉ PUEDE RECURRIR (closed)
  const pqr = filterUseful(f.por_que_recurre);
  if (pqr.length) parts.push(accordionSection('🔁 Por qué puede recurrir',
    `<ul>${pqr.map(p=>`<li>${esc(flat(p))}</li>`).join('')}</ul>`, { id:`${fid}-recurre` }));

  // CONSTRUCCIÓN (closed)
  const con = filterUseful(f.construccion);
  if (con.length) parts.push(accordionSection('🏗 Construcción: qué cambia el diagnóstico',
    `<ul>${con.map(c=>`<li>${esc(flat(c))}</li>`).join('')}</ul>`, { id:`${fid}-const` }));

  // QUÉ NO HACER (closed)
  const qnh = filterUseful(f.que_no_hacer);
  if (qnh.length) parts.push(accordionSection('🚫 Qué NO hacer',
    `<ul class="sop-no-hacer">${qnh.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`,
    { id:`${fid}-nohacer` }));

  // SEGUIMIENTO (closed)
  const seg = filterUseful(f.seguimiento);
  if (seg.length) {
    const hasObjsSeg = seg.some(s => typeof s==='object'&&s.tiempo);
    const segH = seg.map(s => {
      if (typeof s==='object'&&s.tiempo)
        return `<div class="sop-seg-item"><strong>${esc(s.tiempo)}</strong>${s.notas?.length?`<ul>${s.notas.map(n=>`<li>${esc(n)}</li>`).join('')}</ul>`:''}</div>`;
      return `<li>${esc(flat(s))}</li>`;
    }).join('');
    parts.push(accordionSection('📅 Seguimiento', hasObjsSeg?`<div>${segH}</div>`:`<ul>${segH}</ul>`, { id:`${fid}-seg` }));
  }

  // CERRAR BAÑO (closed)
  const cb = filterUseful(f.cuando_cerrar_bano);
  if (cb.length) parts.push(accordionSection('🚿 Cuándo cerrar baño',
    `<ul>${cb.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`,
    { id:`${fid}-bano`, extraClass:'sop-acc-cerrar' }));

  // PARAR EQUIPO (closed)
  const pe = filterUseful(f.cuando_parar_equipo);
  if (pe.length) parts.push(accordionSection('⛔ Cuándo parar equipo',
    `<ul>${pe.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`,
    { id:`${fid}-equipo`, extraClass:'sop-acc-parar' }));

  // CUÁNDO DERIVAR (closed)
  const wd = filterUseful(f.cuando_derivar);
  if (wd.length) parts.push(accordionSection('📞 Cuándo derivar',
    `<ul>${wd.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`, { id:`${fid}-derivar` }));

  // ÁRBOL link
  if (f.arbol_relacionado) parts.push(
    `<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);

  // CLIENTE (closed)
  const cli = filterUseful(f.cliente);
  if (cli.length) parts.push(accordionSection('💬 Qué decir al cliente',
    `<div class="sop-cliente">${cli.map(c=>`<p>"${esc(flat(c))}"</p>`).join('')}</div>`,
    { id:`${fid}-cliente` }));

  // PARTE DE TRABAJO (closed)
  const pt = filterUseful(f.parte);
  if (pt.length) parts.push(accordionSection('📋 Parte de trabajo',
    `<ul class="sop-parte">${pt.map(p=>`<li>${esc(flat(p))}</li>`).join('')}</ul>`,
    { id:`${fid}-parte` }));

  // FUENTES + VALIDACIÓN (closed, combined)
  const fue = filterUseful(f.fuentes);
  const rv  = filterUseful(f.requiere_validacion_fuente);
  const hayVal = rv.length||hasUsefulContent(f.nota_precision)||hasUsefulContent(f.nivel_confianza);
  if (fue.length||hayVal) {
    let fHtml = '';
    if (fue.length) fHtml += `<div class="sop-fuentes">${fue.map(fu => {
      if (typeof fu==='object'&&fu.nombre)
        return `<div class="sop-fuente-item"><span class="sop-fuente-tipo">${esc(fu.tipo||'fuente')}</span><strong>${esc(fu.nombre)}</strong>${fu.uso?`<span class="sop-fuente-uso"> — ${esc(fu.uso)}</span>`:''}</div>`;
      return `<div class="sop-fuente-item">${esc(flat(fu))}</div>`;
    }).join('')}</div>`;
    if (hayVal) {
      fHtml += '<div class="sop-validacion">';
      if (hasUsefulContent(f.nivel_confianza)) fHtml += `<p><strong>Confianza:</strong> ${esc(flat(f.nivel_confianza))}</p>`;
      if (hasUsefulContent(f.nota_precision))  fHtml += `<p class="sop-nota-prec">${esc(flat(f.nota_precision))}</p>`;
      if (rv.length) fHtml += `<ul>${rv.map(v=>`<li>${esc(flat(v))}</li>`).join('')}</ul>`;
      fHtml += '</div>';
    }
    parts.push(accordionSection('📚 Fuentes y validación', fHtml, { id:`${fid}-fuentes` }));
  }

  return parts.filter(Boolean).join('\n');
}

// ── LEGACY DRAWER ─────────────────────────────────────────────────────────────
function renderTable(rows) {
  if (!rows||rows.length<2) return '';
  const [headers,...body] = rows;
  return `<table class="d-table">
    <thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${body.map(row=>`<tr>${row.map((c,i)=>`<td data-label="${esc(headers[i]||'')}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>`;
}

function renderDrawerLegacy(ficha, pLabel, categorias) {
  const isV2Like = !!(ficha.situacion_visible||ficha.protocolo?.length||ficha.decision_sop?.length);
  if (isV2Like) return renderDrawerSemiV2(ficha, pLabel, categorias);

  const cat = categorias?.[ficha.categoria]??{emoji:'📋',nombre:ficha.categoria};
  const parts = [];
  parts.push(`<header class="drawer-ficha-header">
  <h2>${esc(ficha.titulo)}</h2>
  <div class="drawer-ficha-meta">
    <span class="dh-cat">${cat.emoji} ${esc(cat.nombre)}</span>
    <span class="priority-badge ${esc(ficha.prioridad)}">${esc(pLabel)}</span>
  </div>
</header>`);

  if (hasUsefulContent(ficha.problema_explicado))
    parts.push(dsec('Qué está pasando', `<p>${esc(ficha.problema_explicado)}</p>`));
  const sint = filterUseful(ficha.sintomas);
  if (sint.length) parts.push(dsec('Síntomas', `<ul>${sint.map(s=>`<li>${esc(flat(s))}</li>`).join('')}</ul>`));
  const caus = filterUseful(ficha.causas);
  if (caus.length) parts.push(dsec('Causas', `<ul>${caus.map(c=>`<li>${esc(flat(c))}</li>`).join('')}</ul>`));
  const pmH = renderParametros(ficha.parametros);
  if (pmH) parts.push(dsec('Qué medir', pmH));
  const tbl = renderTable(ficha.acciones);
  if (tbl) parts.push(dsec('Acciones', tbl));
  if (hasUsefulContent(ficha.calculo_producto))
    parts.push(`<div class="d-formula"><div class="d-section-label">Cálculo</div><code>${esc(ficha.calculo_producto)}</code></div>`);
  const qnh = filterUseful(ficha.que_no_hacer);
  if (qnh.length) parts.push(dsec('Qué NO hacer', `<ul class="sop-no-hacer">${qnh.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  if (hasUsefulContent(ficha.construccion))
    parts.push(dsec('Construcción', `<p>${esc(flat(ficha.construccion))}</p>`));
  const cbL = filterUseful(ficha.cuando_cerrar_bano);
  if (cbL.length) parts.push(dsec('Cerrar baño', `<ul>${cbL.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`, ' d-cerrar-bano'));
  const wdL = filterUseful(ficha.cuando_derivar);
  if (wdL.length) parts.push(dsec('Cuándo derivar', `<ul>${wdL.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  if (ficha.arbol_relacionado)
    parts.push(`<button class="d-tree-link" data-tree-id="${esc(ficha.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);
  const cliL = flat(ficha.cliente);
  if (hasUsefulContent(cliL)) parts.push(`<div class="d-note"><div class="d-note-label">💬 Cliente</div><p>"${esc(cliL)}"</p></div>`);
  return parts.filter(Boolean).join('\n');
}

function renderDrawerSemiV2(f, pLabel, categorias) {
  const cat = categorias?.[f.categoria]??{emoji:'📋',nombre:f.categoria};
  const parts = [];
  parts.push(`<header class="drawer-ficha-header">
  <h2>${esc(f.titulo)}</h2>
  <div class="drawer-ficha-meta">
    <span class="dh-cat">${cat.emoji} ${esc(cat.nombre)}</span>
    <span class="priority-badge ${esc(f.prioridad)}">${esc(pLabel)}</span>
  </div>
</header>`);
  const qs = quickSummary(f); if (qs) parts.push(qs);
  const ri = filterUseful(f.riesgo_inmediato);
  if (ri.length) parts.push(`<div class="d-alert-block"><strong>⚠ Riesgo inmediato</strong><ul>${ri.map(r=>`<li>${esc(flat(r))}</li>`).join('')}</ul></div>`);
  const du = filterUseful(f.descartar_urgente);
  if (du.length) parts.push(dsec('🔴 Descarta primero', `<ul>${du.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  const pm = ensureArr(f.parametros);
  if (pm.length>1) parts.push(dsec('📊 Qué medir', renderParametros(pm)));
  const ds = ensureArr(f.decision_sop);
  if (ds.length) { const h = renderDecisionSop(ds); if (h) parts.push(dsec('📋 Decisión SOP', h)); }
  const proto = filterUseful(f.protocolo);
  if (proto.length) parts.push(`<div class="d-section"><div class="d-section-label">🔧 Protocolo</div>
    <ol class="sop-steps">${proto.map(p=>`<li>${esc(flat(p).replace(/^\d+[\.\)]\s*/,'').trim())}</li>`).join('')}</ol></div>`);
  const qnh = filterUseful(f.que_no_hacer);
  if (qnh.length) parts.push(dsec('🚫 Qué NO hacer', `<ul class="sop-no-hacer">${qnh.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  const cb = filterUseful(f.cuando_cerrar_bano);
  if (cb.length) parts.push(dsec('🚿 Cerrar baño', `<ul>${cb.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`, ' d-cerrar-bano'));
  const wd = filterUseful(f.cuando_derivar);
  if (wd.length) parts.push(dsec('📞 Cuándo derivar', `<ul>${wd.map(x=>`<li>${esc(flat(x))}</li>`).join('')}</ul>`));
  if (f.arbol_relacionado) parts.push(`<button class="d-tree-link" data-tree-id="${esc(f.arbol_relacionado)}">🌳 Ver árbol de decisión relacionado</button>`);
  const cli = flat(f.cliente);
  if (hasUsefulContent(cli)) parts.push(`<div class="d-note"><div class="d-note-label">💬 Cliente</div><p>"${esc(cli)}"</p></div>`);
  return parts.filter(Boolean).join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULOS
// ═══════════════════════════════════════════════════════════════════════════════
export function renderCalculos(calculos) {
  const { volumenes, profundidad_media, conversion, dosificacion, parametros_referencia, advertencias } = calculos;
  const volRows    = volumenes.map(v=>`<p><strong>${esc(v.tipo)}:</strong>${v.nota?` <em>(${esc(v.nota)})</em>`:''}</p><div class="chuleta-code">${esc(v.formula)}</div>`).join('');
  const paramRows  = parametros_referencia.map(p=>`<tr><td>${esc(p.param)}</td><td>${esc(p.rango)}</td></tr>`).join('');
  return `<div class="chuleta-subsection"><h3>Cálculo de volumen</h3>${volRows}<p><strong>Profundidad media:</strong> ${esc(profundidad_media)}</p></div>
  <div class="chuleta-subsection"><h3>Conversión</h3><div class="chuleta-code">${esc(conversion)}</div></div>
  <div class="chuleta-subsection"><h3>Dosificación</h3><p>${esc(dosificacion.regla)}</p><div class="chuleta-code">${esc(dosificacion.formula)}</div><p><strong>Ejemplo:</strong> ${esc(dosificacion.ejemplo)}</p></div>
  <div class="chuleta-subsection"><h3>Parámetros de referencia</h3><table class="chuleta-params"><thead><tr><th>Parámetro</th><th>Rango OK</th></tr></thead><tbody>${paramRows}</tbody></table></div>
  <div class="chuleta-warning">⚠️ <strong>ADVERTENCIAS CRÍTICAS:</strong><br>${advertencias.map(a=>`• ${esc(a)}`).join('<br>')}</div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ÁRBOLES
// ═══════════════════════════════════════════════════════════════════════════════
export function renderArbol(arbol) {
  const nodes = arbol.nodes.map(node => {
    const ops = node.ops.map(op => {
      const cls = op.res==='Sí'?'tree-option-yes':op.res==='No'?'tree-option-no':'';
      return `<div class="tree-option ${cls}" role="listitem">
        <div class="tree-option-label">${esc(op.res)}</div>
        <div class="tree-option-action">→ ${esc(op.act)}</div>
      </div>`;
    }).join('');
    return `<div class="tree-node"><div class="tree-question">${esc(node.q)}</div><div role="list">${ops}</div></div>`;
  }).join('');
  return `<div class="tree-block" id="tree-${esc(arbol.id)}"><div class="tree-block-title">${esc(arbol.titulo)}</div>${nodes}</div>`;
}
export function renderAllArboles(arboles) { return arboles.map(renderArbol).join(''); }
export function renderTreeNav(arboles, activeId) {
  return arboles.map(a=>`<button class="tree-nav-btn${activeId===a.id?' active':''}" data-tree-id="${esc(a.id)}" aria-pressed="${activeId===a.id}">${esc(a.titulo)}</button>`).join('');
}
