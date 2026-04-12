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

  function pushSourceTag(entity, sourceTag) {
    if (!sourceTag) return;
    entity.sourceTags = entity.sourceTags || [];
    if (!entity.sourceTags.includes(sourceTag)) {
      entity.sourceTags.push(sourceTag);
    }
  }

  function locationHasStarbaseCombat(rawCombats) {
    return (rawCombats || []).some((combat) => {
      const battleType = String(combat?.battleType || '').toLowerCase();
      return battleType.includes('starbase') || battleType.includes('orbital starbase');
    });
  }

  function truthOwnershipBlock(ownerIdAtStart, ownerNameAtStart, ownerIdAtEnd, ownerNameAtEnd) {
    return {
      ownerIdAtStart: ownerIdAtStart ?? null,
      ownerNameAtStart: ownerNameAtStart || '',
      ownerIdAtEnd: ownerIdAtEnd ?? null,
      ownerNameAtEnd: ownerNameAtEnd || '',
      ownerChangedDuringEvent: (ownerIdAtStart ?? null) !== (ownerIdAtEnd ?? null),
    };
  }

  function ensureShipEntity(entityMap, shipLike, led, sourceTag) {
    const entityId =
      shipLike?.entityId ||
      (shipLike?.id != null ? `ship:${shipLike.id}` : null);

    if (!entityId) return;

    const ownerId = shipLike?.ownerId ?? null;
    const ownerName = shipLike?.ownerName || '';

    if (entityMap.has(entityId)) {
      const existing = entityMap.get(entityId);
      pushSourceTag(existing, sourceTag);

      if (!existing.name && shipLike?.name) existing.name = shipLike.name;
      if (existing.shipId == null) existing.shipId = shipLike?.id ?? shipLike?.shipId ?? null;
      if (existing.hullId == null) existing.hullId = shipLike?.hullId ?? null;
      if (!existing.hullName && shipLike?.hullName) existing.hullName = shipLike.hullName;
      if (existing.raceId == null) existing.raceId = shipLike?.raceId ?? null;
      if (existing.ownerId == null) existing.ownerId = ownerId;
      if (!existing.ownerName && ownerName) existing.ownerName = ownerName;

      if (existing.truthOwnership) {
        if (existing.truthOwnership.ownerIdAtStart == null) {
          existing.truthOwnership.ownerIdAtStart = ownerId;
          existing.truthOwnership.ownerNameAtStart = ownerName;
        }
        if (existing.truthOwnership.ownerIdAtEnd == null) {
          existing.truthOwnership.ownerIdAtEnd = ownerId;
          existing.truthOwnership.ownerNameAtEnd = ownerName;
        }
        existing.truthOwnership.ownerChangedDuringEvent =
          (existing.truthOwnership.ownerIdAtStart ?? null) !==
          (existing.truthOwnership.ownerIdAtEnd ?? null);
      }

      if (existing.stats?.mass == null) existing.stats.mass = shipLike?.mass ?? null;
      if (existing.stats?.beamCount == null) existing.stats.beamCount = shipLike?.beamCount ?? null;
      if (existing.stats?.torpCount == null) existing.stats.torpCount = shipLike?.torpCount ?? null;
      if (existing.stats?.fighterCount == null) existing.stats.fighterCount = shipLike?.fighterCount ?? null;
      if ((existing.stats?.xp ?? null) == null) existing.stats.xp = shipLike?.xp ?? 0;

      if (existing.priorPosition?.x == null) existing.priorPosition.x = shipLike?.x ?? null;
      if (existing.priorPosition?.y == null) existing.priorPosition.y = shipLike?.y ?? null;

      return;
    }

    entityMap.set(entityId, {
      id: entityId,
      type: 'ship',
      shipId: shipLike?.id ?? shipLike?.shipId ?? null,
      name: shipLike?.name || '',
      hullId: shipLike?.hullId ?? null,
      hullName: shipLike?.hullName || '',
      raceId: shipLike?.raceId ?? null,
      ownerId,
      ownerName,
      truthOwnership: truthOwnershipBlock(ownerId, ownerName, ownerId, ownerName),
      sourceTags: sourceTag ? [sourceTag] : [],
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

  function ensurePlanetEntity(entityMap, prevCtx, nowCtx) {
    const prevPlanet = prevCtx?.planet || null;
    const nowPlanet = nowCtx?.planet || null;
    const planet = prevPlanet || nowPlanet || null;

    if (!planet?.id) return;

    const entityId = `planet:${planet.id}`;

    const ownerIdAtStart = prevPlanet?.ownerId ?? nowPlanet?.ownerId ?? null;
    const ownerNameAtStart = prevPlanet?.ownerName || nowPlanet?.ownerName || '';
    const ownerIdAtEnd = nowPlanet?.ownerId ?? prevPlanet?.ownerId ?? null;
    const ownerNameAtEnd = nowPlanet?.ownerName || prevPlanet?.ownerName || '';

    if (entityMap.has(entityId)) {
      const existing = entityMap.get(entityId);
      if (prevPlanet) pushSourceTag(existing, 'location-prev');
      if (nowPlanet) pushSourceTag(existing, 'location-now');

      if (!existing.name && planet.name) existing.name = planet.name;
      if (existing.ownerId == null) existing.ownerId = ownerIdAtEnd;
      if (!existing.ownerName && ownerNameAtEnd) existing.ownerName = ownerNameAtEnd;

      existing.truthOwnership = truthOwnershipBlock(
        ownerIdAtStart,
        ownerNameAtStart,
        ownerIdAtEnd,
        ownerNameAtEnd
      );

      if (existing.priorPosition?.x == null) existing.priorPosition.x = planet.x ?? null;
      if (existing.priorPosition?.y == null) existing.priorPosition.y = planet.y ?? null;

      return;
    }

    const sourceTags = [];
    if (prevPlanet) sourceTags.push('location-prev');
    if (nowPlanet) sourceTags.push('location-now');

    entityMap.set(entityId, {
      id: entityId,
      type: 'planet',
      shipId: null,
      name: planet.name || '',
      hullId: 0,
      hullName: planet.hasStarbase ? 'Orbital Starbase Planet' : 'Planet',
      raceId: null,
      ownerId: ownerIdAtEnd,
      ownerName: ownerNameAtEnd,
      truthOwnership: truthOwnershipBlock(
        ownerIdAtStart,
        ownerNameAtStart,
        ownerIdAtEnd,
        ownerNameAtEnd
      ),
      sourceTags,
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

  function ensureStarbaseEntity(entityMap, prevCtx, nowCtx, starbaseImpliedByCombat) {
    const prevPlanet = prevCtx?.planet || null;
    const nowPlanet = nowCtx?.planet || null;
    const planet = prevPlanet || nowPlanet || null;

    if (!planet?.id) return;

    const existedBefore = !!prevCtx?.starbasePresent || !!starbaseImpliedByCombat;
    const existsNow = !!nowCtx?.starbasePresent;
    const shouldExist = existedBefore || existsNow || !!starbaseImpliedByCombat;

    if (!shouldExist) return;

    const entityId = `starbase:${planet.id}`;

    const ownerIdAtStart = prevPlanet?.ownerId ?? nowPlanet?.ownerId ?? null;
    const ownerNameAtStart = prevPlanet?.ownerName || nowPlanet?.ownerName || '';
    const ownerIdAtEnd = nowPlanet?.ownerId ?? prevPlanet?.ownerId ?? null;
    const ownerNameAtEnd = nowPlanet?.ownerName || prevPlanet?.ownerName || '';

    if (entityMap.has(entityId)) {
      const existing = entityMap.get(entityId);
      if (prevCtx?.starbasePresent) pushSourceTag(existing, 'location-prev');
      if (nowCtx?.starbasePresent) pushSourceTag(existing, 'location-now');
      if (starbaseImpliedByCombat) pushSourceTag(existing, 'combat-implied');

      existing.truthOwnership = truthOwnershipBlock(
        ownerIdAtStart,
        ownerNameAtStart,
        ownerIdAtEnd,
        ownerNameAtEnd
      );

      existing.ownerId = ownerIdAtEnd;
      existing.ownerName = ownerNameAtEnd;

      existing.truthState.presentAtStart =
        existing.truthState.presentAtStart || existedBefore;

      if (existsNow) {
        existing.truthState.survivedLocationEvent = true;
        existing.truthState.finalState = 'survived';
      } else if (existedBefore) {
        existing.truthState.survivedLocationEvent = false;
        existing.truthState.finalState = 'destroyed';
      }

      return;
    }

    const sourceTags = [];
    if (prevCtx?.starbasePresent) sourceTags.push('location-prev');
    if (nowCtx?.starbasePresent) sourceTags.push('location-now');
    if (starbaseImpliedByCombat) sourceTags.push('combat-implied');

    entityMap.set(entityId, {
      id: entityId,
      type: 'starbase',
      shipId: null,
      name: `${planet.name || `Planet ${planet.id}`} Starbase`,
      hullId: null,
      hullName: 'Orbital Starbase',
      raceId: null,
      ownerId: ownerIdAtEnd,
      ownerName: ownerNameAtEnd,
      truthOwnership: truthOwnershipBlock(
        ownerIdAtStart,
        ownerNameAtStart,
        ownerIdAtEnd,
        ownerNameAtEnd
      ),
      sourceTags,
      truthState: {
        presentAtStart: existedBefore,
        survivedLocationEvent: existsNow ? true : false,
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
        beamCount: prevPlanet?.starbase?.beamTech ?? nowPlanet?.starbase?.beamTech ?? null,
        torpCount: prevPlanet?.starbase?.torpTech ?? nowPlanet?.starbase?.torpTech ?? null,
        fighterCount: prevPlanet?.starbase?.fighters ?? nowPlanet?.starbase?.fighters ?? null,
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
        const ownerId = p.ownerId ?? null;
        const ownerName = p.ownerName || '';

        if (!entityMap.has(entityId)) {
          entityMap.set(entityId, {
            id: entityId,
            type: p.type || 'ship',
            shipId: p.shipId ?? null,
            name: p.name || '',
            hullId: p.hullId ?? null,
            hullName: p.hullName || '',
            raceId: p.raceId ?? null,
            ownerId,
            ownerName,
            truthOwnership: truthOwnershipBlock(ownerId, ownerName, ownerId, ownerName),
            sourceTags: ['combat-participant'],
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
        } else {
          const existing = entityMap.get(entityId);
          pushSourceTag(existing, 'combat-participant');
          if (!existing.truthOwnership) {
            existing.truthOwnership = truthOwnershipBlock(ownerId, ownerName, ownerId, ownerName);
          }
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
      ensureShipEntity(entityMap, ship, led, 'location-prev');
    });

    (led.locationContextNow?.shipsPresent || []).forEach((ship) => {
      ensureShipEntity(entityMap, ship, led, 'location-now');
    });

    ensurePlanetEntity(entityMap, led.locationContextPreviousTurn, led.locationContextNow);
    ensureStarbaseEntity(
      entityMap,
      led.locationContextPreviousTurn,
      led.locationContextNow,
      locationHasStarbaseCombat(rawCombats)
    );

    console.log('[Bundle Debug]', {
      locationKey,
      participantEntityIds: rawCombats.flatMap((combat) =>
        (combat?.participants || []).map((p) => p?.entityId).filter(Boolean)
      ),
      prevShipIds: led.locationContextPreviousTurn?.shipIdsPresent || [],
      nowShipIds: led.locationContextNow?.shipIdsPresent || [],
      finalEntityIds: Array.from(entityMap.keys()),
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