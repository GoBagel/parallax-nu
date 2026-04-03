(function () {
  'use strict';

  const api = window.__3dvcr;

  api.cycleHasEvents = function cycleHasEvents(deltaSide) {
    if (!deltaSide) return false;
    return !!(
      deltaSide.beamsFired ||
      deltaSide.torpsFired ||
      deltaSide.torpsHit ||
      deltaSide.torpsMiss ||
      deltaSide.fightersLaunched ||
      deltaSide.fighterShots ||
      deltaSide.fightersKilled ||
      Math.round(deltaSide.damageDealt || 0) ||
      Math.round(deltaSide.crewKilled || 0)
    );
  };

  api.formatSummary = function formatSummary(metrics) {
    const totals = metrics?.totals;
    if (!totals) return '';

    const L = totals.L;
    const R = totals.R;

    const torpL = `${L.torpsFired} (${L.torpsHit}H/${L.torpsMiss}M)`;
    const torpR = `${R.torpsFired} (${R.torpsHit}H/${R.torpsMiss}M)`;

    const recL = totals.endRecovered?.L ?? 0;
    const recR = totals.endRecovered?.R ?? 0;

    return [
      `L: beams ${L.beamsFired}, torps ${torpL}, ftr launch ${L.fightersLaunched}, land ${L.fightersLanded}, shots ${L.fighterShots}, kills ${L.fightersKilled}, dmg ${Math.round(L.damageDealt)}, crew ${Math.round(L.crewKilled)}, finish+${recL}`,
      `R: beams ${R.beamsFired}, torps ${torpR}, ftr launch ${R.fightersLaunched}, land ${R.fightersLanded}, shots ${R.fighterShots}, kills ${R.fightersKilled}, dmg ${Math.round(R.damageDealt)}, crew ${Math.round(R.crewKilled)}, finish+${recR}`,
    ].join(' | ');
  };

  api.simVcrResult = function simVcrResult(vcr) {
    const PlayerCtor =
      window.vcrPlayer ||
      (window.vgap && window.vgap.sim && window.vgap.sim.player && window.vgap.sim.player.constructor) ||
      null;

    if (!PlayerCtor || typeof PlayerCtor !== 'function') {
      throw new Error('vcrPlayer not found on window (not loaded yet?)');
    }
    if (typeof window.combatObject !== 'function') {
      throw new Error('combatObject not found on window (not loaded yet?)');
    }

    const p = new PlayerCtor();

    const num = (x) => (x == null ? null : Number(x));

    const countFightersOut = (obj) => {
      try {
        let c = 0;
        const a = obj?.FighterActive;
        if (!a) return 0;
        for (let i = 0; i < a.length; i++) if (a[i] > 0) c++;
        return c;
      } catch {
        return 0;
      }
    };

    const snapSide = (obj) => ({
      Shield: num(obj?.Shield),
      Damage: num(obj?.Damage),
      Crew: num(obj?.Crew),
      Fighters: num(obj?.Fighters),
      FightersOut: countFightersOut(obj),
      Torpedos: num(obj?.Torpedos),
      X: num(obj?.CurrentX),
    });

    const timeline = [];
    const totals = {
      L: mkDelta(),
      R: mkDelta(),
      endRecovered: { L: 0, R: 0 },
    };

    function mkDelta() {
      return {
        beamsFired: 0,
        torpsFired: 0,
        torpsHit: 0,
        torpsMiss: 0,
        fightersLaunched: 0,
        fightersLanded: 0,
        fighterShots: 0,
        fightersKilled: 0,
        damageDealt: 0,
        crewKilled: 0,
      };
    }

    let cur = null;
    let pendingKillerSide = null;

    const getDist = () => {
      try {
        return (p?.Objects?.[1]?.CurrentX ?? 0) - (p?.Objects?.[0]?.CurrentX ?? 0);
      } catch {
        return null;
      }
    };

    function startCycleRecord() {
      const L = p.lhs();
      const R = p.rhs();
      cur = {
        time: p.Time + 1,
        distance: getDist(),
        stateBefore: { L: snapSide(L), R: snapSide(R) },
        delta: { L: mkDelta(), R: mkDelta() },
        stateAfter: null,
      };
    }

    function endCycleRecord() {
      if (!cur) return;
      const L = p.lhs();
      const R = p.rhs();
      cur.distance = getDist();
      cur.stateAfter = { L: snapSide(L), R: snapSide(R) };
      timeline.push(cur);
      cur = null;
    }

    const add = (sideKey, field, amt = 1) => {
      const d = cur?.delta?.[sideKey];
      if (!d) return;
      d[field] = (d[field] || 0) + amt;
      totals[sideKey][field] = (totals[sideKey][field] || 0) + amt;
    };

    p.callbacks = {
      startCycle() {
        startCycleRecord();
      },
      fireBeam(from) {
        add(from === 0 ? 'L' : 'R', 'beamsFired', 1);
      },
      fireTorp(from, hit) {
        const k = from === 0 ? 'L' : 'R';
        add(k, 'torpsFired', 1);
        add(k, hit ? 'torpsHit' : 'torpsMiss', 1);
      },
      launchFighter(obj, idx, side) {
        add(side === 0 ? 'L' : 'R', 'fightersLaunched', 1);
      },
      landFighter(obj, idx, side) {
        add(side === 0 ? 'L' : 'R', 'fightersLanded', 1);
      },
      changeFighterDir() {},
      fireAtFighter(from) {
        pendingKillerSide = from;
      },
      fighterToFighter(killerSide) {
        pendingKillerSide = killerSide;
      },
      killFighter() {
        if (pendingKillerSide == null) return;
        add(pendingKillerSide === 0 ? 'L' : 'R', 'fightersKilled', 1);
        pendingKillerSide = null;
      },
      fighterBeam(side) {
        add(side === 0 ? 'L' : 'R', 'fighterShots', 1);
      },
      updateRightBeamId() {},
      planetBeamIdChanged() {},
      leftDestroyed() {},
      rightDestroyed() {},
      leftCaptured() {},
      rightCaptured() {},
    };

    p._attackerSide = null;

    const wrap = (obj, name, fn) => {
      const orig = obj[name];
      if (typeof orig !== 'function') return;
      obj[name] = fn(orig);
    };

    wrap(p, 'Hit', (orig) => function (sideHit, damage, kill) {
      const L = p.lhs();
      const R = p.rhs();
      const hitObj = sideHit === 0 ? L : R;

      const before = snapSide(hitObj);
      const ret = orig.call(p, sideHit, damage, kill);
      const after = snapSide(hitObj);

      const atk = p._attackerSide;
      if (atk === 0 || atk === 1) {
        const key = atk === 0 ? 'L' : 'R';
        add(key, 'damageDealt', Number(ret) || 0);

        const crewKilled = Math.max(0, (before.Crew ?? 0) - (after.Crew ?? 0));
        if (crewKilled) add(key, 'crewKilled', crewKilled);
      }

      return ret;
    });

    wrap(p, 'FireBeam', (orig) => function (from, which) {
      p._attackerSide = from;
      return orig.call(p, from, which);
    });

    wrap(p, 'FireTorp', (orig) => function (from, launcher) {
      p._attackerSide = from;
      return orig.call(p, from, launcher);
    });

    wrap(p, 'FighterShootLeft', (orig) => function (i) {
      p._attackerSide = 0;
      return orig.call(p, i);
    });

    wrap(p, 'FighterShootRight', (orig) => function (i) {
      p._attackerSide = 1;
      return orig.call(p, i);
    });

    wrap(p, 'FinishUp', (orig) => function () {
      const L = p.lhs();
      const R = p.rhs();
      const beforeL = { Fighters: num(L?.Fighters), Out: countFightersOut(L) };
      const beforeR = { Fighters: num(R?.Fighters), Out: countFightersOut(R) };

      const res = orig.call(p);

      const afterL = { Fighters: num(L?.Fighters), Out: countFightersOut(L) };
      const afterR = { Fighters: num(R?.Fighters), Out: countFightersOut(R) };

      const recL = Math.max(0, (afterL.Fighters ?? 0) - (beforeL.Fighters ?? 0));
      const recR = Math.max(0, (afterR.Fighters ?? 0) - (beforeR.Fighters ?? 0));
      totals.endRecovered.L = recL;
      totals.endRecovered.R = recR;

      return res;
    });

    p.create(vcr);
    p.calculateOnly = false;
    p.stopped = false;
    p.stillFighting = true;

    while (p.stillFighting) {
      p.stillFighting = p.PlayCycle();
      endCycleRecord();
    }

    p.results = p.FinishUp();

    const L = p.lhs();
    const R = p.rhs();

    return {
      seed: vcr.seed,
      battletype: vcr.battletype,
      time: p.Time ?? null,
      results: Array.isArray(p.results) ? p.results.slice() : [],
      left: {
        HullId: num(L?.HullId),
        RaceId: num(L?.RaceId),
        Mass: num(L?.Mass),
        Damage: num(L?.Damage),
        Shield: num(L?.Shield),
        Crew: num(L?.Crew),
        Fighters: num(L?.Fighters),
        FightersOut: countFightersOut(L),
        Torpedos: num(L?.Torpedos),
      },
      right: {
        HullId: num(R?.HullId),
        RaceId: num(R?.RaceId),
        Mass: num(R?.Mass),
        Damage: num(R?.Damage),
        Shield: num(R?.Shield),
        Crew: num(R?.Crew),
        Fighters: num(R?.Fighters),
        FightersOut: countFightersOut(R),
        Torpedos: num(R?.Torpedos),
        hasstarbase: !!R?.hasstarbase,
      },
      metrics: {
        totals,
        timeline: timeline.map((row) => ({
          time: row.time,
          distance: row.distance,
          delta: row.delta,
          state: {
            L: row.stateAfter?.L,
            R: row.stateAfter?.R,
          },
        })),
      },
    };
  };
})();