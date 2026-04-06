(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  // Temporary compatibility bridge for older modules still using __3dvcr
  window.__3dvcr = api;

  const originalConsoleLog =
    typeof console !== 'undefined' && typeof console.log === 'function'
      ? console.log.bind(console)
      : () => {};

  const originalConsoleWarn =
    typeof console !== 'undefined' && typeof console.warn === 'function'
      ? console.warn.bind(console)
      : originalConsoleLog;

  const originalConsoleError =
    typeof console !== 'undefined' && typeof console.error === 'function'
      ? console.error.bind(console)
      : originalConsoleLog;

  api.log = (...a) => {
    try {
      originalConsoleLog('[Cinematics]', ...a);
    } catch {}
  };

  api.warn = (...a) => {
    try {
      originalConsoleWarn('[Cinematics]', ...a);
    } catch {}
  };

  api.error = (...a) => {
    try {
      originalConsoleError('[Cinematics]', ...a);
    } catch {}
  };

  api.safe = (fn, d = null) => {
    try {
      return fn();
    } catch {
      return d;
    }
  };

  api.escapeHtml = (s) =>
    String(s || '').replace(/[&<>"']/g, (m) => {
      return (
        {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[m] || m
      );
    });

  api.caps = (s) => String(s || '').toUpperCase();

  api.pad = (n, w) => {
    const s = String(n);
    return s.length >= w ? s : ' '.repeat(w - s.length) + s;
  };
})();