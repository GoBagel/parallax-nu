(function () {
  'use strict';

  const api = window.__3dvcr;

  function register() {
    const start = Date.now();
    const MAX_WAIT = 20000;

    const poll = setInterval(() => {
      try {
        api.insertIntoDashboardMenu();
        if (document.getElementById('nu-3dvcr-dash-li')) clearInterval(poll);
        if (Date.now() - start > MAX_WAIT) clearInterval(poll);
      } catch (e) {
        clearInterval(poll);
        api.log('poll error', e);
      }
    }, 300);

    const mo = new MutationObserver(() => {
      try {
        api.insertIntoDashboardMenu();
      } catch {}
    });
    mo.observe(document.body, { subtree: true, childList: true });
  }

  api.log(`3D VCR Dev Loader ${api.version} loaded`);
  register();
})();