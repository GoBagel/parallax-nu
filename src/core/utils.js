(function () {
  'use strict';

  const api = window.__3dvcr;

  api.log = (...a) => {
    try {
      console.log('[3DVCR]', ...a);
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