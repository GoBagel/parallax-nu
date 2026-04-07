(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.applyEntryModes = function applyEntryModes(led, options = {}) {
    const E = api.SCENE_ENUMS.entryMode;
    const P = api.SCENE_ENUMS.phaseType;

    led.entities.forEach((entity) => {
      if (entity.viewerState.knownLastTurnAtLocation) {
        entity.presentation.entryMode = E.PRESENT_KNOWN;
        entity.presentation.revealPhase = P.INTRO;
      } else if (entity.viewerState.knownMovingToLocation) {
        entity.presentation.entryMode = E.ARRIVAL_KNOWN;
        entity.presentation.revealPhase = P.GATHERING;
      } else if (entity.viewerState.visibleAtSceneStart) {
        entity.presentation.entryMode = E.ARRIVAL_UNKNOWN_SEEN_NOW;
        entity.presentation.revealPhase = P.GATHERING;
      } else {
        entity.presentation.entryMode = E.HIDDEN_UNTIL_COMBAT;
        entity.presentation.revealPhase = P.COMBAT;
      }
    });

    return led;
  };
})();