(function () {
  'use strict';

  const api = window.__3dvcr;

  function bootParallaxNuMainMenu() {
    try {
      if (window.ParallaxNu?.initParallaxNuMainMenuModule) {
        window.ParallaxNu.initParallaxNuMainMenuModule();
      }
    } catch (e) {
      api.log('Parallax Nu main menu init error', e);
    }
  }

  function register() {
    const start = Date.now();
    const MAX_WAIT = 20000;

    const poll = setInterval(() => {
      try {
        api.insertIntoDashboardMenu();
        bootParallaxNuMainMenu();

        if (
          document.getElementById('nu-3dvcr-dash-li') &&
          document.getElementById('parallax-nu-main-menu')
        ) {
          clearInterval(poll);
        }

        if (Date.now() - start > MAX_WAIT) clearInterval(poll);
      } catch (e) {
        clearInterval(poll);
        api.log('poll error', e);
      }
    }, 300);

    const mo = new MutationObserver(() => {
      try {
        api.insertIntoDashboardMenu();
        bootParallaxNuMainMenu();
      } catch (e) {
        api.log('mutation observer error', e);
      }
    });

    mo.observe(document.body, { subtree: true, childList: true });
  }

  api.log(`3D VCR Dev Loader ${api.version} loaded`);
  register();
})();