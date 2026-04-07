(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.buildScenePhases = function buildScenePhases(led, options = {}) {
    const P = api.SCENE_ENUMS.phaseType;

    const introActions = [];
    const gatheringActions = [];
    const resolutionActions = [];

    if (led.location?.reference?.captionShort) {
      introActions.push({
        type: 'show-location-caption',
        text: led.location.reference.captionShort,
      });
    }

    led.entities.forEach((entity) => {
      switch (entity.presentation.entryMode) {
        case api.SCENE_ENUMS.entryMode.PRESENT_KNOWN:
          introActions.push({ type: 'show-entity', entityId: entity.id });
          break;
        case api.SCENE_ENUMS.entryMode.ARRIVAL_KNOWN:
          gatheringActions.push({ type: 'warp-in', entityId: entity.id, intensity: 0.8 });
          break;
        case api.SCENE_ENUMS.entryMode.ARRIVAL_UNKNOWN_SEEN_NOW:
          gatheringActions.push({ type: 'reveal-contact', entityId: entity.id });
          break;
        default:
          break;
      }

      if (entity.truthState?.finalState === 'destroyed') {
        resolutionActions.push({ type: 'show-wreckage', entityId: entity.id });
      }
    });

    led.phases = [
      {
        id: 'phase-intro',
        type: P.INTRO,
        orderIndex: 0,
        actions: introActions,
      },
      {
        id: 'phase-gathering',
        type: P.GATHERING,
        orderIndex: 1,
        actions: gatheringActions,
      },
      {
        id: 'phase-posturing',
        type: P.POSTURING,
        orderIndex: 2,
        actions: [],
      },
      {
        id: 'phase-combat',
        type: P.COMBAT,
        orderIndex: 3,
        beatIds: led.beats.map((b) => b.id),
      },
      {
        id: 'phase-resolution',
        type: P.RESOLUTION,
        orderIndex: 4,
        actions: resolutionActions,
      },
      {
        id: 'phase-summary',
        type: P.SUMMARY,
        orderIndex: 5,
        actions: [{ type: 'show-summary-overlay' }],
      },
    ];

    return led;
  };
})();