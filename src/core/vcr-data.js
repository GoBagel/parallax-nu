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
})();