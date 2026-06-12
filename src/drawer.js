/**
 * drawer.js — Slide-in drawer / bottom-sheet for ficha detail.
 *
 * Features:
 *  - Opens with URL hash  #/ficha/<id>  (deep-linkable, bookmarkable)
 *  - Back button / popstate closes the drawer
 *  - Esc key closes
 *  - Focus trapped inside while open
 *  - Restores focus to triggering element on close
 *  - prefers-reduced-motion: CSS handles animation removal
 */

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

let _lastFocus  = null;
let _onTreeLink = null;

export function initDrawer({ onTreeLink } = {}) {
  _onTreeLink = onTreeLink ?? null;

  const scrim  = document.getElementById('scrim');
  const drawer = document.getElementById('drawer');
  if (!scrim || !drawer) return;

  scrim.addEventListener('click', () => closeDrawer());

  document.addEventListener('keydown', e => {
    if (!drawer.classList.contains('show')) return;
    if (e.key === 'Escape') { closeDrawer(); return; }
    if (e.key === 'Tab')    { trapFocus(e, drawer); }
  });

  window.addEventListener('popstate', () => {
    if (!location.hash.startsWith('#/ficha/')) closeDrawer(false);
  });

  // Tree-link clicks delegated on drawer
  drawer.addEventListener('click', e => {
    const btn = e.target.closest('[data-tree-id]');
    if (btn && _onTreeLink) {
      closeDrawer();
      _onTreeLink(btn.dataset.treeId);
    }
  });
}

/**
 * Open the drawer.
 * @param {string} fichaId  — used for URL hash
 * @param {string} titulo   — shown in drawer header
 * @param {string} bodyHtml — rendered content for drawer-body
 */
export function openDrawer(fichaId, titulo, bodyHtml) {
  const drawer = document.getElementById('drawer');
  const scrim  = document.getElementById('scrim');
  if (!drawer || !scrim) return;

  _lastFocus = document.activeElement;

  const titleId = 'drawer-title';
  drawer.innerHTML = `
    <div class="drawer-head">
      <h2 id="${titleId}">${escTitle(titulo)}</h2>
      <button class="drawer-close" aria-label="Cerrar ficha">✕</button>
    </div>
    <div class="drawer-body" tabindex="-1">
      ${bodyHtml}
    </div>`;

  drawer.querySelector('.drawer-close').addEventListener('click', () => closeDrawer());

  scrim.classList.add('show');
  drawer.classList.add('show');
  drawer.setAttribute('role', 'dialog');
  drawer.setAttribute('aria-modal', 'true');
  drawer.setAttribute('aria-labelledby', titleId);

  // Reset scroll
  drawer.querySelector('.drawer-body').scrollTop = 0;

  // Push hash for deep-linking
  const hash = `#/ficha/${fichaId}`;
  if (location.hash !== hash) history.pushState({ fichaId }, '', hash);

  // Move focus inside
  requestAnimationFrame(() => {
    const first = drawer.querySelector(FOCUSABLE);
    (first ?? drawer.querySelector('.drawer-body')).focus();
  });
}

export function closeDrawer(pushState = true) {
  const drawer = document.getElementById('drawer');
  const scrim  = document.getElementById('scrim');
  if (!drawer || !scrim) return;

  drawer.classList.remove('show');
  scrim.classList.remove('show');

  if (pushState && location.hash.startsWith('#/ficha/')) {
    history.pushState(null, '', location.pathname + location.search);
  }

  if (_lastFocus?.focus) _lastFocus.focus();
  _lastFocus = null;
}

/** On page load, open the drawer if the URL already has #/ficha/<id>. */
export function openFromHash(openFn) {
  const match = location.hash.match(/^#\/ficha\/(.+)$/);
  if (match) openFn(match[1]);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function trapFocus(e, container) {
  const nodes = [...container.querySelectorAll(FOCUSABLE)];
  if (!nodes.length) return;
  const first = nodes[0];
  const last  = nodes[nodes.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}

function escTitle(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
