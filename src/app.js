/**
 * app.js — Main application entry point.
 * Wires together data loading, rendering, search, calculator, and the drawer.
 */

import { loadData }                     from './data.js';
import { filtrarFichas }                from './search.js';
import { calcularVolumen, formatResultado,
         actualizarCamposCalc }         from './calculator.js';
import { renderCategorias, renderCards,
         renderDrawerContent,
         renderCalculos,
         renderAllArboles,
         renderTreeNav }                from './render.js';
import { initDrawer, openDrawer,
         closeDrawer, openFromHash }    from './drawer.js';
import { registerSW }                   from './sw-register.js';

// ── App state ─────────────────────────────────────────────────────────────────
let DATA         = null;
let activeFilter = null;
let searchQuery  = '';
let debounceId   = null;

// ── Boot ──────────────────────────────────────────────────────────────────────
async function init() {
  registerSW();

  try {
    DATA = await loadData();
  } catch (err) {
    document.body.innerHTML = `
      <div style="padding:2rem;text-align:center;font-family:system-ui">
        <h2 style="color:#08394a">Error al cargar los datos</h2>
        <p>Los archivos JSON no se pudieron cargar.<br>
           Asegúrate de acceder por HTTP, no por <code>file://</code>.</p>
        <p style="font-size:12px;color:#999">${err.message}</p>
      </div>`;
    return;
  }

  // Init subsystems
  initDrawer({ onTreeLink: jumpToTree });
  setupTabs();
  setupSearch();
  setupCategories();
  setupCalculator();
  setupInstallHint();

  // Initial renders
  renderFichasTab();
  renderCalculosTab();
  renderArbolesTab();
  updateFooter();

  // Deep-link: open drawer if URL has #/ficha/<id>
  openFromHash(id => openFichaDrawer(id));
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
}

function activateTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('show'));
  document.getElementById(tabId)?.classList.add('show');
  document.querySelectorAll('[data-tab]').forEach(b => {
    const active = b.dataset.tab === tabId;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  window.scrollTo(0, 0);
}

// ── Search ────────────────────────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('search-input');
  const clear = document.getElementById('search-clear');
  if (!input || !clear) return;

  input.addEventListener('input', () => {
    clearTimeout(debounceId);
    debounceId = setTimeout(() => {
      searchQuery  = input.value.trim();
      clear.hidden = !searchQuery;
      renderFichasTab();
    }, 180);
  });

  clear.addEventListener('click', () => {
    input.value  = '';
    searchQuery  = '';
    clear.hidden = true;
    input.focus();
    renderFichasTab();
  });
}

// ── Categories ────────────────────────────────────────────────────────────────
function setupCategories() {
  document.getElementById('categories-grid')?.addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;
    const cat = btn.dataset.cat;
    activeFilter = activeFilter === cat ? null : cat;
    renderFichasTab();
  });
}

function clearFilter() {
  activeFilter = null;
  renderFichasTab();
}

// ── Render: Fichas tab ────────────────────────────────────────────────────────
function renderFichasTab() {
  const { fichas, categorias, prioridades } = DATA;

  // Categories grid
  const grid = document.getElementById('categories-grid');
  if (grid) grid.innerHTML = renderCategorias(categorias, fichas, activeFilter);

  // Filter chip
  const filterInfo = document.getElementById('filter-info');
  const filterText = document.getElementById('filter-text');
  if (filterInfo && filterText) {
    if (activeFilter) {
      filterText.textContent = `Mostrando fichas de: ${categorias[activeFilter]?.nombre ?? activeFilter}`;
      filterInfo.classList.add('show');
    } else {
      filterInfo.classList.remove('show');
    }
  }

  // Split fichas
  const { destacadas, noDestacadas } = filtrarFichas(fichas, {
    query: searchQuery,
    categoria: activeFilter,
  });

  // Render sections
  const comunesSection = document.getElementById('problemas-comunes-section');
  const comunesGrid    = document.getElementById('problemas-comunes');
  const otrasSection   = document.getElementById('otras-fichas-section');
  const otrasGrid      = document.getElementById('otras-fichas');
  const emptyState     = document.getElementById('empty-state');

  if (comunesSection) comunesSection.hidden = destacadas.length === 0;
  if (comunesGrid)    comunesGrid.innerHTML  = renderCards(destacadas, categorias, prioridades);
  if (otrasSection)   otrasSection.hidden    = noDestacadas.length === 0;
  if (otrasGrid)      otrasGrid.innerHTML    = renderCards(noDestacadas, categorias, prioridades);
  if (emptyState)     emptyState.classList.toggle('show', destacadas.length === 0 && noDestacadas.length === 0);
}

// ── Open a ficha ──────────────────────────────────────────────────────────────
function openFichaDrawer(id) {
  if (!DATA) return;
  const ficha = DATA.fichas.find(f => f.id === id);
  if (!ficha) return;
  openDrawer(ficha.id, ficha.titulo, renderDrawerContent(ficha, DATA.prioridades));
}

// Card clicks delegated on the container
document.addEventListener('click', e => {
  const card = e.target.closest('[data-ficha-id]');
  if (card) openFichaDrawer(card.dataset.fichaId);

  if (e.target.matches('[data-action="reset-search"]')) {
    document.getElementById('search-input').value = '';
    searchQuery = '';
    document.getElementById('search-clear').hidden = true;
    activeFilter = null;
    renderFichasTab();
  }

  if (e.target.matches('[data-action="clear-filter"]')) clearFilter();
});

document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-ficha-id]')) {
    e.preventDefault();
    openFichaDrawer(e.target.dataset.fichaId);
  }
});

// ── Render: Cálculos tab ──────────────────────────────────────────────────────
function renderCalculosTab() {
  const el = document.getElementById('calculos-content');
  if (el) el.innerHTML = renderCalculos(DATA.calculos);
}

// ── Calculator ────────────────────────────────────────────────────────────────
function setupCalculator() {
  const form = document.getElementById('calc-form');
  if (!form) return;

  function update() {
    const tipo    = document.getElementById('calc-tipo')?.value;
    const largo   = parseFloat(document.getElementById('calc-largo')?.value);
    const ancho   = parseFloat(document.getElementById('calc-ancho')?.value);
    const profMin = parseFloat(document.getElementById('calc-prof-min')?.value);
    const profMax = parseFloat(document.getElementById('calc-prof-max')?.value);

    actualizarCamposCalc(tipo);

    const result = calcularVolumen(tipo, largo, ancho, profMin, profMax);
    const output = document.getElementById('calc-output');
    if (!output) return;

    if (result) {
      document.getElementById('calc-prof-media').textContent = result.profMedia;
      document.getElementById('calc-m3').textContent        = result.m3;
      document.getElementById('calc-litros').textContent    = result.litros.toLocaleString('es-ES');
      output.classList.add('show');
      output.dataset.resultado = formatResultado(result);
    } else {
      output.classList.remove('show');
    }
  }

  form.addEventListener('input',  update);
  form.addEventListener('change', update);

  document.getElementById('calc-copy')?.addEventListener('click', () => {
    const text = document.getElementById('calc-output')?.dataset.resultado;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      const btn = document.getElementById('calc-copy');
      const orig = btn.textContent;
      btn.textContent = '✓ Copiado';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = orig; btn.classList.remove('copied'); }, 2000);
    });
  });
}

// ── Render: Árboles tab ───────────────────────────────────────────────────────
function renderArbolesTab() {
  const container = document.getElementById('trees-container');
  const navEl     = document.getElementById('trees-nav');
  if (!container) return;

  container.innerHTML = renderAllArboles(DATA.arboles);
  if (navEl) navEl.innerHTML = renderTreeNav(DATA.arboles, null);

  navEl?.addEventListener('click', e => {
    const btn = e.target.closest('[data-tree-id]');
    if (!btn) return;
    navEl.querySelectorAll('.tree-nav-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', String(b === btn));
    });
    document.getElementById(`tree-${btn.dataset.treeId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// ── Jump to tree (from ficha link) ────────────────────────────────────────────
function jumpToTree(treeId) {
  activateTab('arboles-tab');
  requestAnimationFrame(() => {
    document.getElementById(`tree-${treeId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.querySelectorAll('.tree-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.treeId === treeId);
      b.setAttribute('aria-pressed', String(b.dataset.treeId === treeId));
    });
  });
}

// ── Footer count ──────────────────────────────────────────────────────────────
function updateFooter() {
  const el = document.getElementById('footer-count');
  if (el && DATA) el.textContent = `${DATA.fichas.length} fichas`;
}

// ── Install hint ──────────────────────────────────────────────────────────────
function setupInstallHint() {
  const banner = document.getElementById('install-hint');
  if (!banner) return;

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone;
  const dismissed = localStorage.getItem('installHintDismissed');

  if (isStandalone || dismissed) { banner.hidden = true; return; }

  banner.hidden = false;
  banner.querySelector('.install-hint-close')?.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('installHintDismissed', '1');
  });
}

// ── SOP Toggle (interactive Sí/No for descartar_urgente in V2 drawers) ───────
window.sopToggle = function(qId, answer) {
  const si    = document.getElementById(qId + '-si');
  const no    = document.getElementById(qId + '-no');
  const block = document.getElementById(qId);
  if (!si || !no || !block) return;
  si.hidden = answer !== 'si';
  no.hidden = answer !== 'no';
  block.querySelectorAll('.btn-si, .btn-no').forEach(b => {
    const isActive = b.classList.contains('btn-' + answer);
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', String(isActive));
  });
};

// ── Start ─────────────────────────────────────────────────────────────────────
init();
