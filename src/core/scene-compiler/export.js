(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.buildExportMetadata = function buildExportMetadata(led, options = {}) {
    const locationName =
      led.location?.planet?.name ||
      led.location?.reference?.nearestPlanetName ||
      'Unknown Location';

    const turnLabel = led.turnNumber != null ? `Turn ${led.turnNumber}` : 'Unknown Turn';

    led.export = {
      title: `${locationName} - ${turnLabel}`,
      shortTitle: locationName,
      chapterMarkers: led.phases.map((phase) => ({
        label: phase.type,
        phaseId: phase.id,
      })),
      tags: ['planets-nu', 'cinematics', 'battle'],
      spoilerLevel: 'viewer-safe',
    };

    return led;
  };
})();