(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.formatLEDText = function formatLEDText(led) {
    const lines = [];

    lines.push(led?.export?.title || 'Cinematics Scene');
    lines.push('');

    if (led?.location?.reference?.captionLong) {
      lines.push(led.location.reference.captionLong);
      lines.push('');
    }

    lines.push(`Combats: ${led?.combats?.length || 0}`);
    lines.push(`Entities: ${led?.entities?.length || 0}`);
    lines.push('');

    lines.push('Participants:');
    (led?.entities || []).forEach((entity) => {
      const name = entity.name || entity.id;
      const mode = entity.presentation?.entryMode || 'unknown';
      lines.push(`- ${name} (${mode})`);
    });

    lines.push('');
    lines.push('Phases:');
    (led?.phases || []).forEach((phase) => {
      lines.push(`- ${phase.type}`);
    });

    if (led?.summary?.shortResult) {
      lines.push('');
      lines.push(`Summary: ${led.summary.shortResult}`);
    }

    return lines.join('\n');
  };

  api.compileLEDText = function compileLEDText({ turnData, locationKey, viewerPlayerId, options = {} }) {
    if (typeof api.compileLED !== 'function') {
      throw new Error('compileLED() is not available');
    }
    const led = api.compileLED({ turnData, locationKey, viewerPlayerId, options });
    return api.formatLEDText(led);
  };
})();