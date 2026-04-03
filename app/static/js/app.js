/* ============================================================
   app.js — Global application logic
   Theme toggle, navbar, toast notifications
   ============================================================ */

'use strict';

// ── Theme ──────────────────────────────────────────────────
(function () {
  const STORAGE_KEY = 'pdfmerger-theme';
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    const sunIcon  = document.querySelector('.icon-sun');
    const moonIcon = document.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      } else {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      }
    }
  }

  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Apply immediately (before DOMContentLoaded) to avoid flash
  applyTheme(getInitialTheme());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    // Re-sync icons after DOM ready
    applyTheme(getInitialTheme());

    btn.addEventListener('click', function () {
      const current = html.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  });
})();


// ── Mobile nav ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');
  const navOverlay = document.getElementById('navOverlay');
  const closeNav   = document.getElementById('closeNav');

  if (!hamburger || !mobileNav) return;

  function openNav() {
    mobileNav.classList.add('open');
    mobileNav.setAttribute('aria-hidden', 'false');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeNavMenu() {
    mobileNav.classList.remove('open');
    mobileNav.setAttribute('aria-hidden', 'true');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openNav);
  navOverlay && navOverlay.addEventListener('click', closeNavMenu);
  closeNav && closeNav.addEventListener('click', closeNavMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNavMenu();
  });
});


// ── Toast Notification System ───────────────────────────────
window.Toast = (function () {
  const ICONS = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  function show(type, title, message, duration) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    duration = duration || 4000;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
      <div class="toast-body">
        <p class="toast-title">${_escape(title)}</p>
        ${message ? `<p class="toast-message">${_escape(message)}</p>` : ''}
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
      </button>`;

    container.appendChild(toast);

    const close = toast.querySelector('.toast-close');
    close.addEventListener('click', () => dismiss(toast));

    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;

    return toast;
  }

  function dismiss(toast) {
    if (!toast || toast._removing) return;
    toast._removing = true;
    clearTimeout(toast._timer);
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  function _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    success: (title, msg, duration) => show('success', title, msg, duration),
    error:   (title, msg, duration) => show('error',   title, msg, duration),
    warning: (title, msg, duration) => show('warning', title, msg, duration),
    info:    (title, msg, duration) => show('info',    title, msg, duration),
  };
})();


// ── Utility helpers (shared across pages) ──────────────────
window.Utils = {
  formatBytes: function (bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  },

  setProgress: function (barEl, labelEl, pct, label) {
    if (barEl) {
      barEl.style.width = pct + '%';
      barEl.setAttribute('aria-valuenow', pct);
    }
    if (labelEl) labelEl.textContent = label || '';
  },

  triggerDownload: function (resultId, filename) {
    const a = document.createElement('a');
    a.href = `/api/download/${resultId}`;
    a.download = filename || 'download.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },
};
