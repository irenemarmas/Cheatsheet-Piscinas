/**
 * render.js — All HTML rendering helpers.
 * Pure functions: take data, return HTML strings or DOM mutations.
 */

/** Escape a string for safe insertion as HTML text. */
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
        <span class="cat-count">${counts[key]} fichas</span>
      </button>`)
    .join('');
}

// ── Ficha cards ───────────────────────────────────────────────────────────────

export function renderCard(ficha, categorias, prioridades) {
  const cat   = categorias[ficha.categoria] ?? { emoji: '', nombre: ficha.categoria };
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;
  const chips  = (ficha.sintomas ?? []).slice(0, 3)
    .map(s => `<span class="card-chip">${esc(s)}</span>`).join('');
  const resumen = esc((ficha.problema_explicado ?? '').substring(0, 80)) + '…';

  return `
    <article
      class="card"
      role="button"
      tabindex="0"
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

// ── Drawer content ────────────────────────────────────────────────────────────

function renderTable(rows) {
  if (!rows || rows.length < 2) return '<p>No especificado</p>';
  const [headers, ...body] = rows;
  const ths = headers.map(h => `<th>${esc(h)}</th>`).join('');
  const trs = body.map(row =>
    `<tr>${row.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`
  ).join('');
  return `<table class="d-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function section(label, content, extraClass = '') {
  return `<div class="d-section${extraClass ? ' ' + extraClass : ''}">
    <div class="d-section-label">${label}</div>
    ${content}
  </div>`;
}

export function renderDrawerContent(ficha, prioridades) {
  const pLabel = prioridades[ficha.prioridad] ?? ficha.prioridad;

  const cerrarClass = ficha.cuando_cerrar_bano?.length ? ' d-cerrar-bano' : '';

  return `
    <span class="priority-badge ${esc(ficha.prioridad)}">${esc(pLabel)}</span>

    ${section('1. Qué está pasando',
      `<p>${esc(ficha.problema_explicado || 'No especificado')}</p>`)}

    ${section('2. Síntomas',
      (ficha.sintomas?.length
        ? `<ul>${ficha.sintomas.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`
        : '<p>No especificado</p>'))}

    ${section('3. Causas',
      (ficha.causas?.length
        ? `<ul>${ficha.causas.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
        : '<p>No especificado</p>'))}

    ${section('4. Qué medir',
      renderTable(ficha.parametros) +
      `<p><strong>Interpretación:</strong> ${esc(ficha.interpretacion_resultados || 'No especificada')}</p>`)}

    ${section('5. Acciones paso a paso', renderTable(ficha.acciones))}

    <div class="d-formula">
      <div class="d-section-label">6. Cálculo</div>
      <code>${esc(ficha.calculo_producto || 'No especificado')}</code>
    </div>

    <div class="d-checklist">
      <div class="d-section-label">7. Checklist</div>
      <p>${esc(ficha.checklist || 'No especificado')}</p>
    </div>

    ${section('8. Qué NO hacer',
      (ficha.que_no_hacer?.length
        ? `<ul>${ficha.que_no_hacer.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
        : '<p>No especificado</p>'))}

    ${section('9. Construcción / contexto',
      `<p>${esc(ficha.construccion || 'No especificado')}</p>`)}

    ${section('10. Cerrar baño',
      (ficha.cuando_cerrar_bano?.length
        ? `<ul>${ficha.cuando_cerrar_bano.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
        : '<p>No aplica</p>'),
      cerrarClass)}

    ${section('11. Cuándo derivar',
      (ficha.cuando_derivar?.length
        ? `<ul>${ficha.cuando_derivar.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`
        : '<p>No especificado</p>'))}

    ${ficha.arbol_relacionado ? `
      <button class="d-tree-link" data-tree-id="${esc(ficha.arbol_relacionado)}">
        🌳 Ver árbol de decisión relacionado
      </button>` : ''}

    <div class="d-note">
      <div class="d-note-label">💬 Cliente</div>
      <p>"${esc(ficha.cliente || 'No especificado')}"</p>
    </div>

    <div class="d-note">
      <div class="d-note-label">📋 Parte de trabajo</div>
      <p><code>${esc(ficha.parte || 'No especificado')}</code></p>
    </div>

    ${section('Adicional',
      `<p><strong>Módulo:</strong> ${esc(ficha.modulo_relacionado || 'N/A')}</p>` +
      (ficha.fuentes?.length
        ? `<p><strong>Fuentes:</strong> ${ficha.fuentes.map(f => esc(f)).join(', ')}</p>`
        : ''))}
  `;
}

// ── Cálculos cheat-sheet ──────────────────────────────────────────────────────

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

  const advertList = advertencias.map(a => `• ${esc(a)}`).join('<br>');

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
      ${advertList}
    </div>
  `;
}

// ── Decision trees ────────────────────────────────────────────────────────────

export function renderArbol(arbol) {
  const nodes = arbol.nodes.map(node => {
    const opciones = node.ops.map(op => {
      const isYes = op.res === 'Sí';
      const isNo  = op.res === 'No';
      const cls   = isYes ? 'tree-option-yes' : isNo ? 'tree-option-no' : '';
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
