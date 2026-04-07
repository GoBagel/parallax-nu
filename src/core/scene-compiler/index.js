(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.SCENE_ENUMS = api.SCENE_ENUMS || {
    locationType: {
      PLANET: 'planet',
      DEEP_SPACE: 'deep-space',
    },
    entryMode: {
      PRESENT_KNOWN: 'present_known',
      ARRIVAL_KNOWN: 'arrival_known',
      ARRIVAL_POSSIBLE: 'arrival_possible',
      ARRIVAL_UNKNOWN_SEEN_NOW: 'arrival_unknown_seen_now',
      HIDDEN_UNTIL_COMBAT: 'hidden_until_combat',
    },
    phaseType: {
      INTRO: 'intro',
      GATHERING: 'gathering',
      POSTURING: 'posturing',
      COMBAT: 'combat',
      RESOLUTION: 'resolution',
      SUMMARY: 'summary',
    },
    perspective: {
      PLAYER: 'player',
      OMNISCIENT: 'omniscient',
      ALLY_SHARED: 'ally-shared',
    },
  };

  api.createEmptyLED = function createEmptyLED() {
    return {
      ledVersion: 1,
      id: '',
      turnNumber: null,
      sectorId: null,
      source: {
        type: 'combat-location',
        combatIds: [],
        vcrIds: [],
        generatedAt: new Date().toISOString(),
      },
      location: {
        key: '',
        type: '',
        x: null,
        y: null,
        planet: null,
        reference: {
          nearestPlanetId: null,
          nearestPlanetName: '',
          distanceLy: null,
          direction: null,
          captionShort: '',
          captionLong: '',
        },
      },
      viewer: {
        playerId: null,
        perspective: api.SCENE_ENUMS.perspective.PLAYER,
        knowledgeModelVersion: 1,
        fogOfWarEnabled: true,
      },
      truth: {
        entitiesPresentAtLocation: [],
        orderedCombats: [],
        totalShipsInvolved: 0,
        totalRacesInvolved: 0,
      },
      entities: [],
      combats: [],
      beats: [],
      phases: [],
      summary: {},
      narration: {
        introLines: [],
        notableMoments: [],
        summaryLines: [],
      },
      export: {
        title: '',
        shortTitle: '',
        chapterMarkers: [],
        tags: [],
        spoilerLevel: 'viewer-safe',
      },
      debug: {
        notes: [],
        assumptions: [],
      },
    };
  };

  api.compileLED = function compileLED({ turnData, locationKey, viewerPlayerId, options = {} }) {
    let led = api.buildLocationBundle(turnData, locationKey, options);
    led = api.buildViewerModel(led, viewerPlayerId, turnData, options);
    led = api.applyEntryModes(led, options);
    led = api.buildCombatBeats(led, options);
    led = api.buildScenePhases(led, options);
    led = api.buildSceneSummary(led, options);
    led = api.buildExportMetadata(led, options);
    return led;
  };
})();