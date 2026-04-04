(function () {
  'use strict';

  console.log('[Parallax Nu] dev-loader active');

  const ROOT = 'http://127.0.0.1:8001';

  const modules = [
    '/src/core/globals.js',
    '/src/core/utils.js',
    '/src/core/vcr-data.js',
    '/src/core/panel.js',
    '/src/core/sim.js',
    '/src/core/assets.js',
    '/src/config/plugin-config-store.js',
    '/src/ui/main-menu-branding.js',
    '/src/features/text-vcr.js',
    '/src/features/render-3d.js',
    '/src/features/menu.js',
    '/src/main.js'
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = `${ROOT}${src}?t=${Date.now()}`;
      el.onload = () => resolve(src);
      el.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(el);
    });
  }

  async function boot() {
    for (const mod of modules) {
      console.log('[Parallax Nu] loading', mod);
      await loadScript(mod);
    }
    console.log('[Parallax Nu] all modules loaded');
  }

  boot().catch((err) => {
    console.error('[Parallax Nu] dev-loader failed', err);
  });
})();