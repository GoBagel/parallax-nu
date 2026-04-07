(function () {
  'use strict';

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
    '/src/core/scene-compiler/led.js',
    '/src/core/scene-compiler/bundle.js',
    '/src/core/scene-compiler/viewer-model.js',
    '/src/core/scene-compiler/entry-modes.js',
    '/src/core/scene-compiler/beats.js',
    '/src/core/scene-compiler/phases.js',
    '/src/core/scene-compiler/summary.js',
    '/src/core/scene-compiler/export.js',
    '/src/core/scene-compiler/debug.js',
    '/src/core/scene-compiler/index.js',
    '/src/features/text-vcr.js',
    '/src/features/cinematics-text.js',
    '/src/features/render-3d.js',
    '/src/features/menu.js',
    '/src/generated/build-info.js',
    '/src/main.js'
  ];

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = ROOT + src + '?t=' + Date.now();
      el.onload = () => resolve(src);
      el.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(el);
    });
  }

  async function boot() {
    console.log('[Parallax Nu] dev-loader active');
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
