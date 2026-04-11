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

  function sortByOrderIndex(a, b) {
    return (a?.orderIndex ?? 0) - (b?.orderIndex ?? 0);
  }

  function cloneNormalizedLocation(location, fallbackKey) {
    if (!location) return defaultLocationFromKey(fallbackKey);

    return {
      key: fallbackKey || '',
      type: location.type || '',
      x: location.x ?? null,
      y: location.y ?? null,
      planet: location.planet
        ? {
            id: location.planet.id ?? null,
            name: location.planet.name || '',
            ownerId: location.planet.ownerId ?? null,
            ownerKnownToViewer: false,
            hasStarbase: !!location.planet.hasStarbase,
            starbaseKnownToViewer: false,
          }
        : (
            location.planetId != null
              ? {
                  id: location.planetId ?? null,
                  name: location.planetName || '',
                  ownerId: null,
                  ownerKnownToViewer: false,
                  hasStarbase: !!location.hasStarbase,
                  starbaseKnownToViewer: false,
                }
              : null
          ),
      reference: {
        nearestPlanetId:
          location.referencePlanet?.id ??
          location.planetId ??
          null,
        nearestPlanetName:
          location.referencePlanet?.name ||
          location.planetName ||
          '',
        distanceLy:
          location.referencePlanet?.distanceLy ??
          (location.type === api.SCENE_ENUMS.locationType.PLANET ? 0 : null),
        direction: null,
        captionShort:
          location.type === api.SCENE_ENUMS.locationType.PLANET
            ? (location.planetName || 'Planet Battle')
            : (
                location.referencePlanet?.name
                  ? `Deep space near ${location.referencePlanet.name}`
                  : 'Deep Space Engagement'
              ),
        captionLong:
          location.type === api.SCENE_ENUMS.locationType.PLANET
            ? `Combat near ${location.planetName || 'a planet'}`
            : (
                location.referencePlanet?.name
                  ? `Combat in deep space near ${location.referencePlanet.name}`
                  : 'Combat in deep space'
              ),
      },
    };
  }

  api.buildLocationBundle = async function buildLocationBundle(turnData, locationKey, options = {}) {
    const led = api.createEmptyLED();

    const rawCombats = Array.isArray(turnData?.combats)
      ? turnData.combats
          .filter((c) => (c.locationKey || '') === locationKey)
          .slice()
          .sort(sortByOrderIndex)
      : [];

    led.id = `led:${locationKey || 'unknown'}:${turnData?.turnNumber ?? Date.now()}`;
    led.turnNumber = turnData?.turnNumber ?? null;
    led.sectorId = turnData?.sectorId ?? null;

    const canonicalLocation = rawCombats[0]?.location || null;
    led.location = cloneNormalizedLocation(canonicalLocation, locationKey || 'unknown');

    led.source.combatIds = rawCombats.map((c) => c.id).filter(Boolean);
    led.source.vcrIds = rawCombats.map((c) => c.vcrId).filter((v) => v != null);

    led.combats = rawCombats.map((c, index) => ({
      id: c.id || `combat-${index + 1}`,
      orderIndex: c.orderIndex ?? index,
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
        const entityId = p.entityId || `ship:${p.shipId || 'unknown'}`;
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

    const locationContextPreviousTurn = await api.getLocationContextPreviousTurn(led.location, options);
    const locationContextNow = api.getLocationContextNow(led.location);
    const locationContextDelta = api.getLocationContextDelta(locationContextPreviousTurn, locationContextNow);

    led.locationContextPreviousTurn = locationContextPreviousTurn;
    led.locationContextNow = locationContextNow;
    led.locationContextDelta = locationContextDelta;

    (led.locationContextPreviousTurn?.shipsPresent || []).forEach((ship) => {
      ensureShipEntity(entityMap, ship, led);
    });

    (led.locationContextNow?.shipsPresent || []).forEach((ship) => {
      ensureShipEntity(entityMap, ship, led);
    });

    ensurePlanetEntity(entityMap, led.locationContextPreviousTurn);
    ensurePlanetEntity(entityMap, led.locationContextNow);
    ensureStarbaseEntity(
      entityMap,
      led.locationContextPreviousTurn,
      led.locationContextNow
    );

    led.entities = Array.from(entityMap.values());
    led.truth.entitiesPresentAtLocation = led.entities.map((e) => e.id);
    led.truth.totalShipsInvolved = led.entities.filter((e) => e.type === 'ship').length;
    led.truth.totalRacesInvolved = new Set(
      led.entities.map((e) => e.raceId).filter((v) => v != null)
    ).size;

    return led;
  };
  function ensureShipEntity(entityMap, shipLike, led) {
    const entityId =
      shipLike?.entityId ||
      (shipLike?.id != null ? `ship:${shipLike.id}` : null);

    if (!entityId || entityMap.has(entityId)) return;

    entityMap.set(entityId, {
      id: entityId,
      type: 'ship',
      shipId: shipLike?.id ?? shipLike?.shipId ?? null,
      name: shipLike?.name || '',
      hullId: shipLike?.hullId ?? null,
      hullName: shipLike?.hullName || '',
      raceId: shipLike?.raceId ?? null,
      ownerId: shipLike?.ownerId ?? null,
      ownerName: shipLike?.ownerName || '',
      truthState: {
        presentAtStart: false,
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
        cameraPriority: shipLike?.mass ?? 0,
      },
      stats: {
        mass: shipLike?.mass ?? null,
        beamCount: shipLike?.beamCount ?? null,
        torpCount: shipLike?.torpCount ?? null,
        fighterCount: shipLike?.fighterCount ?? null,
        xp: shipLike?.xp ?? 0,
      },
      priorPosition: {
        x: shipLike?.x ?? null,
        y: shipLike?.y ?? null,
        turnNumber: led.turnNumber != null ? led.turnNumber - 1 : null,
        knownToViewer: false,
      },
    });
  }
  function ensurePlanetEntity(entityMap, ctx) {
    const planet = ctx?.planet;
    if (!planet?.id) return;

    const entityId = `planet:${planet.id}`;
    if (entityMap.has(entityId)) return;

    entityMap.set(entityId, {
      id: entityId,
      type: 'planet',
      shipId: null,
      name: planet.name || '',
      hullId: 0,
      hullName: planet.hasStarbase ? 'Orbital Starbase Planet' : 'Planet',
      raceId: null,
      ownerId: planet.ownerId ?? null,
      ownerName: planet.ownerName || '',
      truthState: {
        presentAtStart: true,
        survivedLocationEvent: true,
        destroyedInCombatId: null,
        finalState: 'survived',
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
        mass: null,
        beamCount: null,
        torpCount: null,
        fighterCount: null,
        xp: 0,
      },
      priorPosition: {
        x: planet.x ?? null,
        y: planet.y ?? null,
        turnNumber: null,
        knownToViewer: false,
      },
    });
  }
  function ensureStarbaseEntity(entityMap, prevCtx, nowCtx) {
    const planet =
      prevCtx?.planet ||
      nowCtx?.planet ||
      null;

    if (!planet?.id) return;

    const existedBefore = !!prevCtx?.starbasePresent;
    const existsNow = !!nowCtx?.starbasePresent;

    if (!existedBefore && !existsNow) return;

    const entityId = `starbase:${planet.id}`;
    if (entityMap.has(entityId)) return;

    entityMap.set(entityId, {
      id: entityId,
      type: 'starbase',
      shipId: null,
      name: `${planet.name || `Planet ${planet.id}`} Starbase`,
      hullId: null,
      hullName: 'Orbital Starbase',
      raceId: null,
      ownerId: planet.ownerId ?? null,
      ownerName: planet.ownerName || '',
      truthState: {
        presentAtStart: existedBefore,
        survivedLocationEvent: existsNow,
        destroyedInCombatId: null,
        finalState: existsNow ? 'survived' : 'destroyed',
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
        mass: null,
        beamCount: prevCtx?.planet?.starbase?.beamTech ?? nowCtx?.planet?.starbase?.beamTech ?? null,
        torpCount: prevCtx?.planet?.starbase?.torpTech ?? nowCtx?.planet?.starbase?.torpTech ?? null,
        fighterCount: prevCtx?.planet?.starbase?.fighters ?? nowCtx?.planet?.starbase?.fighters ?? null,
        xp: 0,
      },
      priorPosition: {
        x: planet.x ?? null,
        y: planet.y ?? null,
        turnNumber: null,
        knownToViewer: false,
      },
    });
  }
})();