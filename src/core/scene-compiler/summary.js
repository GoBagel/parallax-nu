(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.buildSceneSummary = function buildSceneSummary(led, options = {}) {
    const destroyed = led.entities
      .filter((e) => e.truthState?.finalState === 'destroyed')
      .map((e) => e.id);

    const surviving = led.entities
      .filter((e) => e.truthState?.finalState === 'survived')
      .map((e) => e.id);

    led.summary = {
      headline: led.location?.reference?.captionLong || 'Combat Event',
      shortResult: `${led.combats.length} combats, ${destroyed.length} destroyed`,
      destroyedEntityIds: destroyed,
      survivingEntityIds: surviving,
      survivingOwners: Array.from(
        new Set(
          led.entities
            .filter((e) => surviving.includes(e.id))
            .map((e) => e.ownerId)
            .filter((v) => v != null)
        )
      ),
      exactCombatOrder: led.combats.map((c) => c.id),
    };

    return led;
  };
})();