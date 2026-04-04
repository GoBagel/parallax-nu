(function () {
  'use strict';

  const api = window.__3dvcr || {};
  const buildInfo = window.ParallaxNuBuildInfo || {};
  const version = buildInfo.version || 'dev';

  function log(...args) {
    if (typeof api.log === 'function') {
      api.log(...args);
    } else {
      console.log('[Parallax Nu]', ...args);
    }
  }

  function bootParallaxNuMainMenu() {
    try {
      if (window.ParallaxNu?.initParallaxNuMainMenuModule) {
        window.ParallaxNu.initParallaxNuMainMenuModule();
      }
    } catch (e) {
      log('main menu init error', e);
    }
  }

  function bootDashboardMenu() {
    try {
      if (typeof api.insertIntoDashboardMenu === 'function') {
        api.insertIntoDashboardMenu();
      }
    } catch (e) {
      log('dashboard menu init error', e);
    }
  }

  function register() {
    const start = Date.now();
    const MAX_WAIT = 20000;

    const poll = setInterval(() => {
      try {
        bootDashboardMenu();
        bootParallaxNuMainMenu();

        if (document.getElementById('nu-3dvcr-dash-li')) {
          clearInterval(poll);
        }

        if (Date.now() - start > MAX_WAIT) {
          clearInterval(poll);
        }
      } catch (e) {
        clearInterval(poll);
        log('poll error', e);
      }
    }, 300);

    const mo = new MutationObserver(() => {
      try {
        bootDashboardMenu();
        bootParallaxNuMainMenu();
      } catch (e) {
        log('mutation observer error', e);
      }
    });

    mo.observe(document.body, { subtree: true, childList: true });
  }

  log(`v${version} loaded`);
  register();
})();