(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.buildViewerModel = function buildViewerModel(led, viewerPlayerId, turnData, options = {}) {
    led.viewer.playerId = viewerPlayerId ?? null;

    led.entities.forEach((entity) => {
      const isOwned = entity.ownerId != null && entity.ownerId === viewerPlayerId;

      entity.viewerState.knownLastTurnAtLocation = isOwned;
      entity.viewerState.knownMovingToLocation = false;
      entity.viewerState.visibleAtSceneStart = isOwned;
      entity.viewerState.identifiableAtSceneStart = isOwned;

      entity.presentation.anchorCandidate = !!entity.stats && (entity.stats.mass || 0) > 0;
      entity.presentation.cameraPriority = entity.stats?.mass || 0;
    });

    return led;
  };
})();