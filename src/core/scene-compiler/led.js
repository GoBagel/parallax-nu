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
    truthState: {
      SURVIVED: 'survived',
      DESTROYED: 'destroyed',
      DAMAGED: 'damaged',
      ESCAPED: 'escaped',
      UNKNOWN: 'unknown',
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

      summary: {
        headline: '',
        shortResult: '',
        destroyedEntityIds: [],
        survivingEntityIds: [],
        survivingOwners: [],
        exactCombatOrder: [],
      },

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

  api.createSampleLED = function createSampleLED() {
    const led = api.createEmptyLED();

    led.id = 'turn-42:loc-planet-188';
    led.turnNumber = 42;
    led.sectorId = 649240;

    led.source.combatIds = ['c1', 'c2', 'c3'];
    led.source.vcrIds = [101, 102, 103];

    led.location = {
      key: 'planet:188',
      type: api.SCENE_ENUMS.locationType.PLANET,
      x: 1443,
      y: 820,

      planet: {
        id: 188,
        name: 'Eros',
        ownerId: 4,
        ownerKnownToViewer: true,
        hasStarbase: true,
        starbaseKnownToViewer: true,
      },

      reference: {
        nearestPlanetId: 188,
        nearestPlanetName: 'Eros',
        distanceLy: 0,
        direction: null,
        captionShort: 'Planet Eros',
        captionLong: 'Combat near Planet Eros',
      },
    };

    led.viewer = {
      playerId: 7,
      perspective: api.SCENE_ENUMS.perspective.PLAYER,
      knowledgeModelVersion: 1,
      fogOfWarEnabled: true,
    };

    led.truth = {
      entitiesPresentAtLocation: ['ship-41', 'ship-52', 'planet-188', 'starbase-188'],
      orderedCombats: ['combat-1', 'combat-2', 'combat-3'],
      totalShipsInvolved: 5,
      totalRacesInvolved: 3,
    };

    led.entities = [
      {
        id: 'ship-41',
        type: 'ship',
        shipId: 41,
        name: 'ISS Valiant',
        hullId: 29,
        hullName: 'Missouri Class Battleship',
        raceId: 7,
        ownerId: 7,
        ownerName: 'The Robots',

        truthState: {
          presentAtStart: true,
          survivedLocationEvent: false,
          destroyedInCombatId: 'combat-2',
          finalState: api.SCENE_ENUMS.truthState.DESTROYED,
        },

        viewerState: {
          knownLastTurnAtLocation: true,
          knownMovingToLocation: false,
          visibleAtSceneStart: true,
          identifiableAtSceneStart: true,
        },

        presentation: {
          entryMode: api.SCENE_ENUMS.entryMode.PRESENT_KNOWN,
          revealPhase: api.SCENE_ENUMS.phaseType.INTRO,
          anchorCandidate: true,
          cameraPriority: 90,
        },

        stats: {
          mass: 320,
          beamCount: 10,
          torpCount: 8,
          fighterCount: 0,
          xp: 47,
        },

        priorPosition: {
          x: 1443,
          y: 820,
          turnNumber: 41,
          knownToViewer: true,
        },
      },
    ];

    led.combats = [
      {
        id: 'combat-1',
        orderIndex: 0,
        sourceVcrId: 101,

        participants: {
          attackerEntityId: 'ship-41',
          defenderEntityId: 'ship-52',
          otherEntityIds: [],
        },

        locationKey: 'planet:188',

        dependencies: {
          dependsOnCombatIds: [],
          enablesCombatIds: ['combat-2'],
        },

        truthOutcome: {
          winnerEntityId: 'ship-41',
          loserEntityId: 'ship-52',
          destroyedEntityIds: ['ship-52'],
          survivorEntityIds: ['ship-41'],
        },

        presentation: {
          beatId: 'beat-1',
          canCrosscut: false,
          mustPreserveOrder: true,
        },
      },
    ];

    led.beats = [
      {
        id: 'beat-1',
        phase: api.SCENE_ENUMS.phaseType.COMBAT,
        orderIndex: 0,
        combatIds: ['combat-1'],
        concurrent: false,
        dependenciesResolved: true,
      },
    ];

    led.phases = [
      {
        id: 'phase-intro',
        type: api.SCENE_ENUMS.phaseType.INTRO,
        orderIndex: 0,
        actions: [
          { type: 'show-location-caption', text: 'Planet Eros' },
          { type: 'show-entity', entityId: 'ship-41' },
        ],
      },
      {
        id: 'phase-gathering',
        type: api.SCENE_ENUMS.phaseType.GATHERING,
        orderIndex: 1,
        actions: [
          { type: 'warp-in', entityId: 'ship-52', intensity: 0.8 },
        ],
      },
      {
        id: 'phase-posturing',
        type: api.SCENE_ENUMS.phaseType.POSTURING,
        orderIndex: 2,
        actions: [],
      },
      {
        id: 'phase-combat',
        type: api.SCENE_ENUMS.phaseType.COMBAT,
        orderIndex: 3,
        beatIds: ['beat-1'],
      },
      {
        id: 'phase-resolution',
        type: api.SCENE_ENUMS.phaseType.RESOLUTION,
        orderIndex: 4,
        actions: [
          { type: 'show-wreckage', entityId: 'ship-52' },
        ],
      },
      {
        id: 'phase-summary',
        type: api.SCENE_ENUMS.phaseType.SUMMARY,
        orderIndex: 5,
        actions: [
          { type: 'show-summary-overlay' },
        ],
      },
    ];

    led.summary = {
      headline: 'Robots repel attack at Planet Eros',
      shortResult: '3 combats, 2 ships destroyed, Robots hold the field',
      destroyedEntityIds: ['ship-52', 'ship-61'],
      survivingEntityIds: ['ship-41'],
      survivingOwners: [7],
      exactCombatOrder: ['combat-1', 'combat-2', 'combat-3'],
    };

    led.narration = {
      introLines: ['Combat erupts near Planet Eros.'],
      notableMoments: [
        {
          atPhaseId: 'phase-combat',
          text: 'A second hostile contact enters the engagement.',
        },
      ],
      summaryLines: [
        'After multiple engagements, the Robots remain in control of the battlespace.',
      ],
    };

    led.export = {
      title: 'Battle for Eros - Turn 42',
      shortTitle: 'Battle for Eros',
      chapterMarkers: [
        { label: 'Intro', phaseId: 'phase-intro' },
        { label: 'Combat', phaseId: 'phase-combat' },
        { label: 'Summary', phaseId: 'phase-summary' },
      ],
      tags: ['planets-nu', 'battle', 'robots', 'cinematics'],
      spoilerLevel: 'viewer-safe',
    };

    led.debug = {
      notes: [],
      assumptions: [
        'Viewer did not know ship-52 was already inbound until visual reveal.',
      ],
    };

    return led;
  };
})();