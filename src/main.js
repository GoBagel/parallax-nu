(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  // TEMP compatibility bridge while other modules are migrated
  window.__3dvcr = api;

  const buildInfo = window.ParallaxNuBuildInfo || {};
  const version = buildInfo.version || 'dev';

  const originalConsoleLog =
    typeof console !== 'undefined' && typeof console.log === 'function'
      ? console.log.bind(console)
      : () => {};

  function log(...args) {
    try {
      originalConsoleLog('[Parallax Nu]', ...args);
    } catch {}
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

  function isBrandingReady() {
    return !!document.getElementById('parallax-nu-topbar-logo');
  }

  function isDashboardReady() {
    return !!(
      document.getElementById('nu-cinematics-dash-li') ||
      document.getElementById('nu-3dvcr-dash-li')
    );
  }

  function bootAll() {
    bootDashboardMenu();
    bootParallaxNuMainMenu();
  }

  function register() {
    const start = Date.now();
    const MAX_WAIT = 20000;

    let settledAt = 0;

    const poll = setInterval(() => {
      try {
        bootAll();

        const brandingReady = isBrandingReady();
        const dashboardReady = isDashboardReady();

        if (brandingReady && dashboardReady) {
          clearInterval(poll);
          settledAt = Date.now();
        }

        if (Date.now() - start > MAX_WAIT) {
          clearInterval(poll);
          settledAt = Date.now();
          log('boot polling timed out');
        }
      } catch (e) {
        clearInterval(poll);
        log('poll error', e);
      }
    }, 300);

    const mo = new MutationObserver(() => {
      try {
        bootAll();

        const brandingReady = isBrandingReady();
        const dashboardReady = isDashboardReady();

        if (brandingReady && dashboardReady) {
          if (!settledAt) settledAt = Date.now();

          // Give the page a short quiet period, then stop observing.
          window.setTimeout(() => {
            if (Date.now() - settledAt >= 1000) {
              try {
                mo.disconnect();
                log('boot observer disconnected');
              } catch {}
            }
          }, 1100);
        } else {
          settledAt = 0;
        }
      } catch (e) {
        log('mutation observer error', e);
      }
    });

    mo.observe(document.body, { subtree: true, childList: true });
  }

  log(`v${version} loaded`);
  register();
})();