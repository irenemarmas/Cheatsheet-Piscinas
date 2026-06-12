/**
 * sw-register.js — Service worker registration + update toast.
 */

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.register('./sw.js').then(reg => {
    // Detect update: new SW waiting
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(newWorker);
        }
      });
    });
  }).catch(err => {
    // SW registration failed — app still works, just not cached offline
    console.warn('SW registration failed:', err);
  });
}

function showUpdateToast(worker) {
  const toast = document.getElementById('update-toast');
  if (!toast) return;
  toast.classList.add('show');
  toast.querySelector('[data-update]').addEventListener('click', () => {
    worker.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });
}
