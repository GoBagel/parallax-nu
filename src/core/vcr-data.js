(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};
  const safe = api.safe;
  const escapeHtml = api.escapeHtml;
  const caps = api.caps;

  api.getVcrs = function getVcrs() {
    const vcrs =
      safe(() => window.vgap?.rst?.vcrs, null) ||
      safe(() => window.vgap?.vcrs, null) ||
      safe(() => window.nu?.rst?.vcrs, null) ||
      null;

    return Array.isArray(vcrs) ? vcrs : [];
  };

  api.getSides = function getSides(v) {
    return { L: v?.left ?? null, R: v?.right ?? null };
  };

  api.getSideObjectId = function getSideObjectId(side) {
    return side?.objectid ?? side?.id ?? side?.shipid ?? side?.planetid ?? side?.baseid ?? null;
  };

  api.classifySideFromVcr = function classifySideFromVcr(side) {
    const hullid = side?.hullid != null ? Number(side.hullid) : null;
    const hintedType = String(side?.type || side?.objecttype || '').toLowerCase();

    const isPlanetByHull = hullid === 0;
    const isShipByHull = hullid != null && hullid > 0;

    const isPlanetByHint =
      hintedType.includes('planet') ||
      side?.planetid != null ||
      side?.isPlanet === true;

    const isShipByHint =
      hintedType.includes('ship') ||
      side?.shipid != null ||
      side?.isShip === true;

    let kind = 'unknown';
    if (isPlanetByHull || isPlanetByHint) kind = 'planet';
    else if (isShipByHull || isShipByHint) kind = 'ship';

    const hasStarbase =
      kind === 'planet' &&
      !!(
        side?.hasstarbase ||
        side?.baseid != null ||
        hintedType.includes('base') ||
        side?.isStarbase === true ||
        side?.isBase === true
      );

    return { kind, hasStarbase, hullid, hintedType };
  };

  // IMPORTANT:
  // VCR side data is authoritative.
  // Live ship lookup may be wrong after destruction or ID reuse.
  api.resolveEntity = function resolveEntity(side) {
    const vgap = window.vgap;
    const oid = api.getSideObjectId(side);
    const vcrInfo = api.classifySideFromVcr(side);

    let ship = null;
    let planet = null;

    if (vgap && oid != null) {
      try {
        if (vcrInfo.kind === 'ship') ship = vgap.getShip?.(oid) || null;
        else if (vcrInfo.kind === 'planet') planet = vgap.getPlanet?.(oid) || null;
        else {
          ship = vgap.getShip?.(oid) || null;
          planet = vgap.getPlanet?.(oid) || null;
        }
      } catch {}
    }

    let kind = vcrInfo.kind;
    if (kind === 'unknown') {
      if (ship && !planet) kind = 'ship';
      else if (planet && !ship) kind = 'planet';
    }

    const planetHasStarbase =
      kind === 'planet' &&
      !!(
        vcrInfo.hasStarbase ||
        planet?.hasstarbase ||
        planet?.starbaseid ||
        planet?.baseid
      );

    const baseHint = kind === 'planet' && vcrInfo.hasStarbase;

    return {
      kind,
      oid,
      side,
      ship,
      planet,
      planetHasStarbase,
      baseHint,
      vcrHullId: vcrInfo.hullid,
      hintedType: vcrInfo.hintedType,
    };
  };

  api.hullNameFromVcrHullId = function hullNameFromVcrHullId(hullId) {
    const vgap = window.vgap;
    const n = hullId != null ? Number(hullId) : null;
    if (n == null || n <= 0) return '';
    const hull = safe(() => vgap?.getHull?.(n), null);
    return hull?.name ? String(hull.name) : '';
  };

  api.entityHtml = function entityHtml(resolved) {
    if (resolved.kind === 'ship') {
      const name = String(
        resolved.side?.name ||
        resolved.side?.shipname ||
        resolved.side?.label ||
        ''
      ).trim();

      const hull = (api.hullNameFromVcrHullId(resolved.vcrHullId) || '').trim();

      if (name && hull && name.toLowerCase() !== hull.toLowerCase()) {
        return `
          <div>${escapeHtml(name)}</div>
          <div style="font-size:11px; opacity:0.75; letter-spacing:0.04em;">${escapeHtml(caps(hull))}</div>
        `;
      }

      const primary = name || hull || (resolved.oid != null ? `Ship ${resolved.oid}` : 'Ship');
      return `<div>${escapeHtml(primary)}</div>`;
    }

    if (resolved.kind === 'planet') {
      const pname =
        resolved.side?.name ||
        (resolved.oid != null ? `Planet ${resolved.oid}` : 'Planet');

      const hasBase = !!resolved.planetHasStarbase;

      return `
        <div>${escapeHtml(String(pname))}</div>
        <div style="font-size:11px; opacity:0.75; letter-spacing:0.04em;">
          ${hasBase ? 'ORBITAL STARBASE' : 'PLANET'}
        </div>
      `;
    }

    const raw =
      resolved.side?.name ||
      resolved.side?.shipname ||
      resolved.side?.label ||
      (resolved.oid != null ? `Obj ${resolved.oid}` : 'Unknown');

    return `<div>${escapeHtml(raw)}</div>`;
  };

  api.inferBattleType = function inferBattleType(v) {
    const bt = v?.battletype != null ? Number(v.battletype) : null;

    const { L, R } = api.getSides(v);
    const a = api.resolveEntity(L);
    const b = api.resolveEntity(R);

    const aPlanetBase = a.kind === 'planet' && (a.planetHasStarbase || a.baseHint);
    const bPlanetBase = b.kind === 'planet' && (b.planetHasStarbase || b.baseHint);

    const shipVsPlanet =
      (a.kind === 'ship' && b.kind === 'planet') ||
      (a.kind === 'planet' && b.kind === 'ship');

    if (shipVsPlanet) {
      if (aPlanetBase || bPlanetBase) return 'Ship vs Orbital Starbase';
      return 'Ship vs Planet';
    }

    if (a.kind === 'ship' && b.kind === 'ship') return 'Ship vs Ship';

    if (bt === 1) {
      if (aPlanetBase || bPlanetBase) return 'Ship vs Starbase';
      return 'Ship vs Planet';
    }
    if (bt === 0) return 'Ship vs Ship';

    if (aPlanetBase || bPlanetBase) return 'Battle vs Starbase';
    if (a.kind === 'planet' || b.kind === 'planet') return 'Battle vs Planet';
    return 'Battle';
  };

  api.battleLineHtml = function battleLineHtml(v) {
    const { L, R } = api.getSides(v);
    const a = api.resolveEntity(L);
    const b = api.resolveEntity(R);
    const type = api.inferBattleType(v);

    return `
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div style="opacity:0.85; font-size:12px;">${type}</div>
        <div style="display:grid; grid-template-columns: 1fr auto 1fr; gap:10px; align-items:start;">
          <div>${api.entityHtml(a)}</div>
          <div style="opacity:0.8; padding-top:2px;">vs</div>
          <div>${api.entityHtml(b)}</div>
        </div>
      </div>
    `;
  };

  api.getBattleCoords = function getBattleCoords(v) {
    const candidates = [
      [v?.x, v?.y],
      [v?.locx, v?.locy],
      [v?.X, v?.Y],
      [v?.position?.x, v?.position?.y],
      [v?.location?.x, v?.location?.y],
    ];

    for (const [x, y] of candidates) {
      if (Number.isFinite(Number(x)) && Number.isFinite(Number(y))) {
        return { x: Number(x), y: Number(y) };
      }
    }

    const { L, R } = api.getSides(v);
    const a = api.resolveEntity(L);
    const b = api.resolveEntity(R);

    const obj = a.planet || a.ship || b.planet || b.ship || null;
    if (obj && Number.isFinite(Number(obj.x)) && Number.isFinite(Number(obj.y))) {
      return { x: Number(obj.x), y: Number(obj.y) };
    }

    return null;
  };

  api.goToCoords = function goToCoords(coords) {
    const vgap = window.vgap;
    if (!vgap || !coords) return false;
    try {
      vgap.showMap?.();
      vgap.map?.centerMap?.(coords.x, coords.y);
      return true;
    } catch {
      return false;
    }
  };
  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function firstFiniteNumber(...values) {
    for (const value of values) {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function entityIdForResolved(resolved) {
    if (!resolved) return null;
    if (resolved.kind === 'ship' && resolved.oid != null) return `ship:${resolved.oid}`;
    if (resolved.kind === 'planet' && resolved.oid != null) return `planet:${resolved.oid}`;
    return resolved.oid != null ? `object:${resolved.oid}` : null;
  }

  function locationKeyFromNormalizedLocation(location) {
    if (!location) return 'unknown';

    if (location.type === 'planet' && location.planetId != null) {
      return `planet:${location.planetId}`;
    }

    const x = firstFiniteNumber(location.x);
    const y = firstFiniteNumber(location.y);

    if (x != null && y != null) {
      return `deep:${x},${y}`;
    }

    return 'unknown';
  }

  function inferPlanetAtCoords(coords) {
    const nearestExact = api.findNearestPlanetToCoords(coords);
    if (!nearestExact) return null;

    if (
      Number(nearestExact.x) === Number(coords?.x) &&
      Number(nearestExact.y) === Number(coords?.y)
    ) {
      return api.getPlanetSnapshotById(nearestExact.id);
    }

    return null;
  }

  function normalizeLocationFromVcr(v) {
    const coords = api.getBattleCoords(v);
    const { L, R } = api.getSides(v);
    const a = api.resolveEntity(L);
    const b = api.resolveEntity(R);

    const directPlanetId = firstFiniteNumber(
      a.kind === 'planet' ? a.oid : null,
      b.kind === 'planet' ? b.oid : null
    );

    const directPlanetSnapshot = directPlanetId != null
      ? api.getPlanetSnapshotById(directPlanetId)
      : null;

    const planetAtCoords = !directPlanetSnapshot ? inferPlanetAtCoords(coords) : null;
    const planet = directPlanetSnapshot || planetAtCoords || null;

    const referencePlanet = coords ? api.findNearestPlanetToCoords(coords) : null;

    if (planet) {
      return {
        type: 'planet',
        x: coords?.x ?? firstFiniteNumber(planet.x),
        y: coords?.y ?? firstFiniteNumber(planet.y),
        planetId: firstFiniteNumber(planet.id),
        planetName: String(planet.name || '').trim(),
        hasStarbase: !!(
          planet.hasStarbase ||
          a.planetHasStarbase ||
          b.planetHasStarbase
        ),
        planet,
        referencePlanet: referencePlanet || {
          id: firstFiniteNumber(planet.id),
          name: String(planet.name || '').trim(),
          x: firstFiniteNumber(planet.x),
          y: firstFiniteNumber(planet.y),
          distanceLy: 0,
        },
      };
    }

    return {
      type: 'deep-space',
      x: coords?.x ?? null,
      y: coords?.y ?? null,
      planetId: null,
      planetName: '',
      hasStarbase: false,
      planet: null,
      referencePlanet,
    };
  }

  function normalizeParticipantFromResolved(resolved, role) {
    if (!resolved) return null;

    if (resolved.kind === 'ship') {
      const side = resolved.side || {};
      const ship = resolved.ship || {};
      const ownerId = firstFiniteNumber(
        side.ownerid,
        side.owner,
        ship.ownerid,
        ship.owner
      );

      return {
        entityId: entityIdForResolved(resolved),
        role,
        type: 'ship',
        shipId: firstFiniteNumber(side.shipid, side.id, ship.id, resolved.oid),
        objectId: resolved.oid,
        name: String(
          side.name ||
          side.shipname ||
          ship.name ||
          ''
        ).trim(),
        ownerId,
        ownerName: api.getPlayerNameById(ownerId),
        raceId: firstFiniteNumber(side.raceid, ship.raceid, ownerId),
        hullId: firstFiniteNumber(side.hullid, ship.hullid, resolved.vcrHullId),
        hullName: api.hullNameFromVcrHullId(
          firstFiniteNumber(side.hullid, ship.hullid, resolved.vcrHullId)
        ),
        mass: firstFiniteNumber(side.mass, ship.mass),
        beamCount: firstFiniteNumber(side.beams, side.beamcount, ship.beams, ship.beamcount),
        torpCount: firstFiniteNumber(side.torps, side.launchers, ship.torps, ship.launchers),
        fighterCount: firstFiniteNumber(side.fighters, ship.fighters, side.bays, ship.bays),
        xp: firstFiniteNumber(side.xp, side.experience, ship.xp, ship.experience) ?? 0,
      };
    }

    if (resolved.kind === 'planet') {
      const side = resolved.side || {};
      const planet = resolved.planet || {};

      return {
        entityId: entityIdForResolved(resolved),
        role,
        type: 'planet',
        planetId: firstFiniteNumber(side.planetid, planet.id, resolved.oid),
        objectId: resolved.oid,
        name: String(side.name || planet.name || '').trim(),
        ownerId: firstFiniteNumber(side.ownerid, planet.ownerid, planet.owner),
        ownerName: api.getPlayerNameById(firstFiniteNumber(side.ownerid, planet.ownerid, planet.owner)),
        raceId: null,
        hullId: 0,
        hullName: resolved.planetHasStarbase ? 'Orbital Starbase' : 'Planet',
        mass: null,
        beamCount: null,
        torpCount: null,
        fighterCount: null,
        xp: 0,
        hasStarbase: !!resolved.planetHasStarbase,
      };
    }

    return {
      entityId: entityIdForResolved(resolved),
      role,
      type: 'unknown',
      objectId: resolved.oid,
      name: String(
        resolved.side?.name ||
        resolved.side?.shipname ||
        resolved.side?.label ||
        ''
      ).trim(),
      ownerId: null,
      ownerName: '',
      raceId: null,
      hullId: resolved.vcrHullId ?? null,
      hullName: '',
      mass: null,
      beamCount: null,
      torpCount: null,
      fighterCount: null,
      xp: 0,
    };
  }

  function dedupeParticipants(participants) {
    const seen = new Set();
    const out = [];

    for (const p of participants) {
      if (!p || !p.entityId) continue;
      if (seen.has(p.entityId)) continue;
      seen.add(p.entityId);
      out.push(p);
    }

    return out;
  }

  api.normalizeCombatRecord = function normalizeCombatRecord(v, orderIndex = 0) {
    const { L, R } = api.getSides(v);
    const leftResolved = api.resolveEntity(L);
    const rightResolved = api.resolveEntity(R);

    const location = normalizeLocationFromVcr(v);
    const locationKey = locationKeyFromNormalizedLocation(location);

    const participants = dedupeParticipants([
      normalizeParticipantFromResolved(leftResolved, 'left'),
      normalizeParticipantFromResolved(rightResolved, 'right'),
    ]);
    const locationContextNow = api.getLocationContextNow(location);

    return {
      id: `combat:${firstFiniteNumber(v?.id, v?.vcrid, orderIndex) ?? orderIndex}`,
      vcrId: firstFiniteNumber(v?.id, v?.vcrid, orderIndex),
      orderIndex,
      locationKey,
      location,
      locationContextNow,
      coords: {
        x: location.x,
        y: location.y,
      },
      battleType: api.inferBattleType(v),
      participants,
      truthOutcome: {
        winnerEntityId: null,
        loserEntityId: null,
        destroyedEntityIds: [],
        survivorEntityIds: [],
      },
      raw: v,
    };
  };

  function getCurrentTurnNumber() {
    const vgap = window.vgap;
    const nu = window.nu;

    return firstFiniteNumber(
      vgap?.turn,
      vgap?.currentTurn,
      vgap?.rst?.turn,
      vgap?.game?.turn,
      nu?.turn,
      nu?.rst?.turn
    );
  }

  api.getNormalizedCombatData = function getNormalizedCombatData() {
    const vgap = window.vgap;
    const vcrs = api.getVcrs();

    return {
      turnNumber: getCurrentTurnNumber(),
      sectorId: firstFiniteNumber(vgap?.gameid, vgap?.game?.id, vgap?.sectorid) ?? null,
      combats: vcrs.map((v, index) => api.normalizeCombatRecord(v, index)),
    };
  };

  api.getCombatLocationKeys = function getCombatLocationKeys(turnData) {
    const combats = asArray(turnData?.combats);
    return Array.from(new Set(
      combats
        .map((c) => c.locationKey)
        .filter((k) => typeof k === 'string' && k.length)
    ));
  };

  api.getCombatsForLocation = function getCombatsForLocation(turnData, locationKey) {
    const combats = asArray(turnData?.combats);
    return combats.filter((c) => c.locationKey === locationKey);
  };

  api.debugNormalizedCombatSummary = function debugNormalizedCombatSummary(turnData) {
    const data = turnData || api.getNormalizedCombatData();

    return {
      turnNumber: data?.turnNumber ?? null,
      sectorId: data?.sectorId ?? null,
      combatCount: Array.isArray(data?.combats) ? data.combats.length : 0,
      locationKeys: api.getCombatLocationKeys(data),
      sample: Array.isArray(data?.combats) ? data.combats.slice(0, 3) : [],
    };
  };

  api.getPlanetSnapshotById = function getPlanetSnapshotById(planetId) {
    const vgap = window.vgap;
    const pid = firstFiniteNumber(planetId);

    if (pid == null) return null;

    let planet = null;
    try {
      planet = vgap?.getPlanet?.(pid) || null;
    } catch {}

    if (!planet) {
      planet = asArray(vgap?.planets).find((p) => firstFiniteNumber(p?.id, p?.planetid) === pid) || null;
    }

    if (!planet) return null;

    const hasStarbase = !!(
      planet.hasstarbase ||
      planet.starbaseid != null ||
      planet.baseid != null
    );

    return {
      id: pid,
      name: String(planet.name || '').trim(),
      x: firstFiniteNumber(planet.x),
      y: firstFiniteNumber(planet.y),
      ownerId: firstFiniteNumber(planet.ownerid, planet.owner),
      ownerName: api.getPlayerNameById(firstFiniteNumber(planet.ownerid, planet.owner)),
      temp: firstFiniteNumber(
        planet.temp,
        planet.temperature,
        planet.climate
      ),
      clans: firstFiniteNumber(
        planet.clans,
        planet.colonistclans,
        planet.colonists
      ),
      nativeClans: firstFiniteNumber(
        planet.nativeclans,
        planet.natives,
        planet.nativepopulation
      ),
      nativeType: firstFiniteNumber(
        planet.nativetype,
        planet.nativeType
      ),
      hasStarbase,
      starbase: {
        exists: hasStarbase,
        fighters: firstFiniteNumber(
          planet.fighters,
          planet.basefighters,
          planet.starbasefighters
        ),
        defensePosts: firstFiniteNumber(
          planet.defense,
          planet.defenseposts,
          planet.defenses
        ),
        beamTech: firstFiniteNumber(
          planet.hulltech,
          planet.beamtech,
          planet.starbasebeamtech,
          planet.basebeamtech
        ),
        torpTech: firstFiniteNumber(
          planet.torptech,
          planet.torpedotech,
          planet.starbasetorptech,
          planet.basetorptech
        ),
        fighterTech: firstFiniteNumber(
          planet.enginetech,
          planet.fightertech,
          planet.starbasefightertech,
          planet.basefightertech
        ),
      },
      raw: planet,
    };
  };

  api.findNearestPlanetToCoords = function findNearestPlanetToCoords(coords) {
    const vgap = window.vgap;
    const x = firstFiniteNumber(coords?.x);
    const y = firstFiniteNumber(coords?.y);

    if (x == null || y == null) return null;

    const planets = asArray(vgap?.planets);

    let best = null;
    let bestDist = Infinity;

    for (const planet of planets) {
      const px = firstFiniteNumber(planet?.x);
      const py = firstFiniteNumber(planet?.y);
      const pid = firstFiniteNumber(planet?.id, planet?.planetid);

      if (px == null || py == null || pid == null) continue;

      const dx = px - x;
      const dy = py - y;
      const dist = Math.sqrt((dx * dx) + (dy * dy));

      if (dist < bestDist) {
        bestDist = dist;
        best = planet;
      }
    }

    if (!best) return null;

    return {
      id: firstFiniteNumber(best.id, best.planetid),
      name: String(best.name || '').trim(),
      x: firstFiniteNumber(best.x),
      y: firstFiniteNumber(best.y),
      distanceLy: bestDist,
    };
  };

  api.getPlayerNameById = function getPlayerNameById(playerId) {
    const vgap = window.vgap;
    const pid = firstFiniteNumber(playerId);
    if (pid == null) return '';

    const player = asArray(vgap?.players).find((p) => {
      return firstFiniteNumber(p?.id, p?.playerid) === pid;
    });

    return String(player?.name || player?.username || '').trim();
  };

  api.getShipSnapshotById = function getShipSnapshotById(shipId) {
    const vgap = window.vgap;
    const sid = firstFiniteNumber(shipId);
    if (sid == null) return null;

    let ship = null;
    try {
      ship = vgap?.getShip?.(sid) || null;
    } catch {}

    if (!ship) {
      ship = asArray(vgap?.ships).find((s) => firstFiniteNumber(s?.id, s?.shipid) === sid) || null;
    }

    if (!ship) return null;

    const ownerId = firstFiniteNumber(ship.ownerid, ship.owner);

    return {
      id: sid,
      name: String(ship.name || ship.shipname || '').trim(),
      x: firstFiniteNumber(ship.x),
      y: firstFiniteNumber(ship.y),
      ownerId,
      ownerName: api.getPlayerNameById(ownerId),
      raceId: firstFiniteNumber(ship.raceid, ownerId),
      hullId: firstFiniteNumber(ship.hullid),
      hullName: api.hullNameFromVcrHullId(firstFiniteNumber(ship.hullid)),
      mass: firstFiniteNumber(ship.mass),
      beamCount: firstFiniteNumber(ship.beams, ship.beamcount),
      torpCount: firstFiniteNumber(ship.torps, ship.launchers),
      fighterCount: firstFiniteNumber(ship.fighters, ship.bays),
      xp: firstFiniteNumber(ship.xp, ship.experience) ?? 0,
      raw: ship,
    };
  };

  api.getLocationContextNow = function getLocationContextNow(location) {
    const vgap = window.vgap;
    const x = firstFiniteNumber(location?.x);
    const y = firstFiniteNumber(location?.y);

    const result = {
      x,
      y,
      planet: null,
      starbasePresentNow: false,
      shipsPresentNow: [],
    };

    if (x == null || y == null) return result;

    if (location?.planetId != null) {
      result.planet = api.getPlanetSnapshotById(location.planetId);
      result.starbasePresentNow = !!result.planet?.hasStarbase;
    }

    const ships = asArray(vgap?.ships)
      .filter((s) => firstFiniteNumber(s?.x) === x && firstFiniteNumber(s?.y) === y)
      .map((s) => api.getShipSnapshotById(firstFiniteNumber(s?.id, s?.shipid)))
      .filter(Boolean);

    result.shipsPresentNow = ships;

    return result;
  };
  function getCachedTurnRst(turnNumber) {
    const vgap = window.vgap;
    const turn = firstFiniteNumber(turnNumber);
    if (turn == null) return null;

    const rstStore = vgap?.rst;
    if (!rstStore) return null;

    const directGameId = firstFiniteNumber(vgap?.gameId, vgap?.gameid, vgap?.game?.id, vgap?.settings?.id);
    const directPlayerId = firstFiniteNumber(vgap?.loadPlayerId, vgap?.player?.id);

    // First try the exact key we expect.
    if (directGameId != null && directPlayerId != null) {
      const exactKey = `${directGameId}-${directPlayerId}-${turn}`;
      const exactEntry = rstStore?.[exactKey] || null;
      if (exactEntry?.rst) return exactEntry.rst;
    }

    // Then scan all keys for anything ending in the requested turn.
    const keys = Object.keys(rstStore);
    for (const key of keys) {
      const entry = rstStore[key];
      if (!entry?.rst) continue;

      const m = /^(\d+)-(\d+)-(\d+)$/.exec(key);
      if (!m) continue;

      const keyTurn = Number(m[3]);
      if (keyTurn === turn) {
        return entry.rst;
      }
    }

    return null;
  }
  api.buildLocationContextFromSources = function buildLocationContextFromSources(location, sources = {}) {
    const x = firstFiniteNumber(location?.x);
    const y = firstFiniteNumber(location?.y);

    const planets = asArray(sources.planets);
    const ships = asArray(sources.ships);
    const starbases = asArray(sources.starbases);

    const context = {
      x,
      y,
      planet: null,
      starbasePresent: false,
      shipsPresent: [],
      shipIdsPresent: [],
      dataCompleteness: sources.dataCompleteness || 'full',
    };

    if (x == null || y == null) {
      context.dataCompleteness = sources.dataCompleteness || 'none';
      return context;
    }

    let matchedPlanet = null;

    if (location?.planetId != null) {
      const pid = firstFiniteNumber(location.planetId);
      matchedPlanet =
        planets.find((p) => firstFiniteNumber(p?.id, p?.planetid) === pid) ||
        null;
    }

    if (!matchedPlanet) {
      matchedPlanet =
        planets.find((p) => firstFiniteNumber(p?.x) === x && firstFiniteNumber(p?.y) === y) ||
        null;
    }

    if (matchedPlanet) {
      const ownerId = firstFiniteNumber(matchedPlanet.ownerid, matchedPlanet.owner);
      const planetId = firstFiniteNumber(matchedPlanet.id, matchedPlanet.planetid);

      const matchedStarbase =
        starbases.find((sb) => {
          return firstFiniteNumber(sb?.planetid, sb?.planetId) === planetId;
        }) || null;

      const hasStarbase = !!(
        matchedStarbase ||
        matchedPlanet.hasstarbase ||
        matchedPlanet.starbaseid != null ||
        matchedPlanet.baseid != null
      );

      context.planet = {
        id: planetId,
        name: String(matchedPlanet.name || '').trim(),
        x: firstFiniteNumber(matchedPlanet.x),
        y: firstFiniteNumber(matchedPlanet.y),
        ownerId,
        ownerName: api.getPlayerNameById ? api.getPlayerNameById(ownerId) : '',
        temp: firstFiniteNumber(
          matchedPlanet.temp,
          matchedPlanet.temperature,
          matchedPlanet.climate
        ),
        clans: firstFiniteNumber(
          matchedPlanet.clans,
          matchedPlanet.colonistclans,
          matchedPlanet.colonists
        ),
        nativeClans: firstFiniteNumber(
          matchedPlanet.nativeclans,
          matchedPlanet.natives,
          matchedPlanet.nativepopulation
        ),
        nativeType: firstFiniteNumber(
          matchedPlanet.nativetype,
          matchedPlanet.nativeType
        ),
        hasStarbase,
        starbase: {
          exists: hasStarbase,
          fighters: firstFiniteNumber(
            matchedStarbase?.fighters,
            matchedPlanet.fighters,
            matchedPlanet.basefighters,
            matchedPlanet.starbasefighters
          ),
          defensePosts: firstFiniteNumber(
            matchedStarbase?.defense,
            matchedPlanet.defense,
            matchedPlanet.defenseposts,
            matchedPlanet.defenses
          ),
          beamTech: firstFiniteNumber(
            matchedStarbase?.beamtech,
            matchedPlanet.beamtech,
            matchedPlanet.starbasebeamtech,
            matchedPlanet.basebeamtech
          ),
          torpTech: firstFiniteNumber(
            matchedStarbase?.torptech,
            matchedPlanet.torptech,
            matchedPlanet.starbasetorptech,
            matchedPlanet.basetorptech
          ),
          fighterTech: firstFiniteNumber(
            matchedStarbase?.fightertech,
            matchedPlanet.fightertech,
            matchedPlanet.starbasefightertech,
            matchedPlanet.basefightertech
          ),
        },
        raw: matchedPlanet,
      };

      context.starbasePresent = hasStarbase;
    }

    context.shipsPresent = ships
      .filter((s) => firstFiniteNumber(s?.x) === x && firstFiniteNumber(s?.y) === y)
      .map((ship) => {
        const ownerId = firstFiniteNumber(ship.ownerid, ship.owner);
        const hullId = firstFiniteNumber(ship.hullid);

        return {
          id: firstFiniteNumber(ship.id, ship.shipid),
          entityId: `ship:${firstFiniteNumber(ship.id, ship.shipid)}`,
          name: String(ship.name || ship.shipname || '').trim(),
          x: firstFiniteNumber(ship.x),
          y: firstFiniteNumber(ship.y),
          ownerId,
          ownerName: api.getPlayerNameById ? api.getPlayerNameById(ownerId) : '',
          raceId: firstFiniteNumber(ship.raceid, ownerId),
          hullId,
          hullName: api.hullNameFromVcrHullId ? api.hullNameFromVcrHullId(hullId) : '',
          mass: firstFiniteNumber(ship.mass),
          beamCount: firstFiniteNumber(ship.beams, ship.beamcount),
          torpCount: firstFiniteNumber(ship.torps, ship.launchers),
          fighterCount: firstFiniteNumber(ship.fighters, ship.bays),
          xp: firstFiniteNumber(ship.xp, ship.experience) ?? 0,
          raw: ship,
        };
      });

    context.shipIdsPresent = context.shipsPresent.map((s) => s.entityId);

    return context;
  };
  api.getLocationContextNow = function getLocationContextNow(location) {
    const vgap = window.vgap;

    return api.buildLocationContextFromSources(location, {
      planets: vgap?.planets,
      ships: vgap?.ships,
      starbases: vgap?.starbases,
      dataCompleteness: 'full',
    });
  };
  api.getLocationContextPreviousTurn = function getLocationContextPreviousTurn(location, options = {}) {
    const vgap = window.vgap;

    const currentTurn = firstFiniteNumber(
      options.turnNumber,
      vgap?.nowTurn,
      vgap?.settings?.turn,
      vgap?.game?.turn
    );

    const previousTurn = currentTurn != null ? currentTurn - 1 : null;
    if (previousTurn == null || previousTurn < 1) {
      return {
        x: firstFiniteNumber(location?.x),
        y: firstFiniteNumber(location?.y),
        planet: null,
        starbasePresent: false,
        shipsPresent: [],
        shipIdsPresent: [],
        dataCompleteness: 'none',
      };
    }

    const rst = getCachedTurnRst(previousTurn);
    if (!rst) {
      return {
        x: firstFiniteNumber(location?.x),
        y: firstFiniteNumber(location?.y),
        planet: null,
        starbasePresent: false,
        shipsPresent: [],
        shipIdsPresent: [],
        dataCompleteness: 'none',
      };
    }

    return api.buildLocationContextFromSources(location, {
      planets: rst?.planets,
      ships: rst?.ships,
      starbases: rst?.starbases,
      dataCompleteness: 'partial',
    });
  };
  api.getLocationContextDelta = function getLocationContextDelta(previousCtx, currentCtx) {
    const prevShipIds = new Set(asArray(previousCtx?.shipIdsPresent));
    const currShipIds = new Set(asArray(currentCtx?.shipIdsPresent));

    const shipsStayed = [];
    const shipsDeparted = [];
    const shipsArrived = [];

    for (const id of prevShipIds) {
      if (currShipIds.has(id)) shipsStayed.push(id);
      else shipsDeparted.push(id);
    }

    for (const id of currShipIds) {
      if (!prevShipIds.has(id)) shipsArrived.push(id);
    }

    const previousStarbasePresent = !!previousCtx?.starbasePresent;
    const currentStarbasePresent = !!currentCtx?.starbasePresent;

    return {
      x: firstFiniteNumber(previousCtx?.x, currentCtx?.x),
      y: firstFiniteNumber(previousCtx?.y, currentCtx?.y),

      shipsStayed,
      shipsDeparted,
      shipsArrived,

      previousShipIds: Array.from(prevShipIds),
      currentShipIds: Array.from(currShipIds),

      previousStarbasePresent,
      currentStarbasePresent,
      starbaseRemoved: previousStarbasePresent && !currentStarbasePresent,
      starbaseAppeared: !previousStarbasePresent && currentStarbasePresent,

      previousPlanetOwnerId: previousCtx?.planet?.ownerId ?? null,
      currentPlanetOwnerId: currentCtx?.planet?.ownerId ?? null,
      planetOwnerChanged:
        (previousCtx?.planet?.ownerId ?? null) !== (currentCtx?.planet?.ownerId ?? null),

      previousDataCompleteness: previousCtx?.dataCompleteness || 'none',
      currentDataCompleteness: currentCtx?.dataCompleteness || 'none',
    };
  };
  api.getCachedTurnSummaries = function getCachedTurnSummaries() {
    const vgap = window.vgap;
    const rstStore = vgap?.rst;
    if (!rstStore) return [];

    return Object.keys(rstStore)
      .map((key) => {
        const entry = rstStore[key];
        const m = /^(\d+)-(\d+)-(\d+)$/.exec(key);

        return {
          key,
          gameId: m ? Number(m[1]) : null,
          playerId: m ? Number(m[2]) : null,
          turn: m ? Number(m[3]) : null,
          hasRst: !!entry?.rst,
          shipCount: Array.isArray(entry?.rst?.ships) ? entry.rst.ships.length : 0,
          planetCount: Array.isArray(entry?.rst?.planets) ? entry.rst.planets.length : 0,
          starbaseCount: Array.isArray(entry?.rst?.starbases) ? entry.rst.starbases.length : 0,
        };
      })
      .sort((a, b) => (a.turn ?? 0) - (b.turn ?? 0));
  };
  api.debugPreviousTurnContextLookup = function debugPreviousTurnContextLookup(location, options = {}) {
    const vgap = window.vgap;

    const currentTurn = firstFiniteNumber(
      options.turnNumber,
      vgap?.nowTurn,
      vgap?.settings?.turn,
      vgap?.game?.turn
    );

    const previousTurn = currentTurn != null ? currentTurn - 1 : null;
    const cached = previousTurn != null ? getCachedTurnRst(previousTurn) : null;

    return {
      currentTurn,
      previousTurn,
      cachedTurnSummaries: api.getCachedTurnSummaries(),
      foundPreviousTurnRst: !!cached,
      previousTurnShipCount: Array.isArray(cached?.ships) ? cached.ships.length : 0,
      previousTurnPlanetCount: Array.isArray(cached?.planets) ? cached.planets.length : 0,
      previousTurnStarbaseCount: Array.isArray(cached?.starbases) ? cached.starbases.length : 0,
      location,
    };
  };
})();