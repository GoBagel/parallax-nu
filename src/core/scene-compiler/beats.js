(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.buildCombatBeats = function buildCombatBeats(led, options = {}) {
    led.beats = led.combats.map((combat, index) => {
      const beatId = `beat-${index + 1}`;
      combat.presentation.beatId = beatId;

      return {
        id: beatId,
        phase: api.SCENE_ENUMS.phaseType.COMBAT,
        orderIndex: index,
        combatIds: [combat.id],
        concurrent: false,
        dependenciesResolved: true,
      };
    });

    return led;
  };
})();