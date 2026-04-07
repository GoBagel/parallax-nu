(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  function defaultLocationFromKey(locationKey) {
    if (String(locationKey || '').startsWith('planet:')) {
      return {
        key: locationKey,
        type: api.SCENE_ENUMS.locationType.PLANET,
        x: null,
        y: null,
        planet: {
          id: Number(String(locationKey).split(':')[1]) || null,
          name: '',
          ownerId: null,
          ownerKnownToViewer: false,
          hasStarbase: false,
          starbaseKnownToViewer: false,
        },
        reference: {
          nearestPlanetId: null,
          nearestPlanetName: '',
          distanceLy: 0,
          direction: null,
          captionShort: 'Planet Battle',
          captionLong: 'Combat at a planet',
        },
      };
    }

    return {
      key: locationKey,
      type: api.SCENE_ENUMS.locationType.DEEP_SPACE,
      x: null,
      y: null,
      planet: null,
      reference: {
        nearestPlanetId: null,
        nearestPlanetName: '',
        distanceLy: null,
        direction: null,
        captionShort: 'Deep Space Engagement',
        captionLong: 'Combat in deep space',
      },
    };
  }

  api.buildLocationBundle = function buildLocationBundle(turnData, locationKey, options = {}) {
    const led = api.createEmptyLED();

    led.id = `led:${locationKey || 'unknown'}:${Date.now()}`;
    led.turnNumber = turnData?.turnNumber ?? null;
    led.sectorId = turnData?.sectorId ?? null;
    led.location = defaultLocationFromKey(locationKey || 'unknown');

    const rawCombats = Array.isArray(turnData?.combats)
      ? turnData.combats.filter((c) => (c.locationKey || '') === locationKey)
      : [];

    led.source.combatIds = rawCombats.map((c) => c.id).filter(Boolean);
    led.source.vcrIds = rawCombats.map((c) => c.vcrId).filter((v) => v != null);

    led.combats = rawCombats.map((c, index) => ({
      id: c.id || `combat-${index + 1}`,
      orderIndex: index,
      sourceVcrId: c.vcrId ?? null,
      participants: c.participants || [],
      locationKey,
      dependencies: {
        dependsOnCombatIds: [],
        enablesCombatIds: [],
      },
      truthOutcome: c.truthOutcome || {},
      presentation: {
        beatId: null,
        canCrosscut: false,
        mustPreserveOrder: true,
      },
    }));

    led.truth.orderedCombats = led.combats.map((c) => c.id);

    const entityMap = new Map();

    rawCombats.forEach((combat) => {
      const participants = Array.isArray(combat.participants) ? combat.participants : [];
      participants.forEach((p) => {
        const entityId = p.entityId || `ship-${p.shipId || 'unknown'}`;
        if (!entityMap.has(entityId)) {
          entityMap.set(entityId, {
            id: entityId,
            type: p.type || 'ship',
            shipId: p.shipId ?? null,
            name: p.name || '',
            hullId: p.hullId ?? null,
            hullName: p.hullName || '',
            raceId: p.raceId ?? null,
            ownerId: p.ownerId ?? null,
            ownerName: p.ownerName || '',
            truthState: {
              presentAtStart: true,
              survivedLocationEvent: null,
              destroyedInCombatId: null,
              finalState: 'unknown',
            },
            viewerState: {
              knownLastTurnAtLocation: false,
              knownMovingToLocation: false,
              visibleAtSceneStart: false,
              identifiableAtSceneStart: false,
            },
            presentation: {
              entryMode: null,
              revealPhase: null,
              anchorCandidate: false,
              cameraPriority: 0,
            },
            stats: {
              mass: p.mass ?? null,
              beamCount: p.beamCount ?? null,
              torpCount: p.torpCount ?? null,
              fighterCount: p.fighterCount ?? null,
              xp: p.xp ?? 0,
            },
            priorPosition: {
              x: null,
              y: null,
              turnNumber: led.turnNumber != null ? led.turnNumber - 1 : null,
              knownToViewer: false,
            },
          });
        }
      });
    });

    led.entities = Array.from(entityMap.values());
    led.truth.entitiesPresentAtLocation = led.entities.map((e) => e.id);
    led.truth.totalShipsInvolved = led.entities.filter((e) => e.type === 'ship').length;
    led.truth.totalRacesInvolved = new Set(
      led.entities.map((e) => e.raceId).filter((v) => v != null)
    ).size;

    return led;
  };
})();