(function () {
  'use strict';

  const api = window.__3dvcr;
  const pad = api.pad;

  api.showTextVcrModal = function showTextVcrModal(title, text) {
    const existing = document.getElementById('nu-3dvcr-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'nu-3dvcr-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 999999;
      background: rgba(0,0,0,0.72);
      display:flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: min(1320px, 98vw);
      height: min(820px, 94vh);
      background: #0b0f14;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      box-shadow: 0 24px 110px rgba(0,0,0,0.75);
      display:flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      color: #e7edf5;
    `;

    const head = document.createElement('div');
    head.style.cssText = `
      display:flex;
      align-items:center;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.12);
      background: #0e141b;
      gap: 10px;
    `;

    const hTitle = document.createElement('div');
    hTitle.textContent = title || 'Text VCR';
    hTitle.style.cssText = 'font-weight:700; letter-spacing:0.02em;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:8px; align-items:center;';

    const mkSmallBtn = (label, onClick) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = `
        background: rgba(255,255,255,0.10);
        color: #e7edf5;
        border: 1px solid rgba(255,255,255,0.18);
        padding: 7px 10px;
        border-radius: 10px;
        cursor: pointer;
        font-size: 12px;
      `;
      b.onclick = onClick;
      return b;
    };

    const copyBtn = mkSmallBtn('Copy', async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied';
        setTimeout(() => (copyBtn.textContent = 'Copy'), 900);
      } catch {
        alert('Clipboard failed (browser blocked).');
      }
    });

    const closeBtn = mkSmallBtn('Close', () => modal.remove());

    btnRow.appendChild(copyBtn);
    btnRow.appendChild(closeBtn);

    head.appendChild(hTitle);
    head.appendChild(btnRow);

    const pre = document.createElement('pre');
    pre.textContent = text;
    pre.style.cssText = `
      margin: 0;
      padding: 14px 14px 18px;
      overflow: auto;
      background: #070a0f;
      color: #e7edf5;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 13px;
      line-height: 1.55;
      white-space: pre;
      tab-size: 2;
    `;

    card.appendChild(head);
    card.appendChild(pre);
    modal.appendChild(card);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
  };

  api.formatTextVcr = function formatTextVcr(sim, vcr, opts = {}) {
    const m = sim.metrics;
    const t = m.timeline || [];

    const checkpointEvery = opts.checkpointEvery ?? 25;
    const showAll = !!opts.showAll;

    const header = [];
    header.push(`TEXT VCR`);
    header.push(
      `seed=${sim.seed} battletype=${sim.battletype} cycles=${sim.time ?? '?'} result=${(sim.results || []).join(', ') || '(none)'}`
    );
    header.push(`SUMMARY: ${api.formatSummary(m)}`);
    header.push(
      `FinishUp fighter recovery: L +${m.totals?.endRecovered?.L ?? 0}, R +${m.totals?.endRecovered?.R ?? 0}`
    );
    header.push('');
    header.push(`Legend (per cycle deltas):`);
    header.push(`  dBeams = beams fired this cycle`);
    header.push(`  dTorps = torpedoes launched this cycle`);
    header.push(`  dTH/dTM = torp hits / torp misses this cycle`);
    header.push(`  dFL = fighters launched this cycle`);
    header.push(`  dFS = fighter shots that HIT a ship/planet this cycle (from fighterBeam callback)`);
    header.push(`  dFK = fighters killed this cycle (beam vs fighter or fighter intercept)`);
    header.push(`  dDmg = total damage dealt this cycle (shield loss + hull damage, from Hit() return)`);
    header.push(`  dCrew = crew killed this cycle (computed from Hit() crew delta)`);
    header.push(`State: sh=shield, dmg=hull damage, crew=crew, f=onboard fighters, out=fighters in space, torp=torpedoes`);
    header.push('');

    const lines = [];
    let skipped = 0;

    for (let i = 0; i < t.length; i++) {
      const row = t[i];
      const Ld = row.delta?.L || {};
      const Rd = row.delta?.R || {};

      const isEvent = api.cycleHasEvents(Ld) || api.cycleHasEvents(Rd);
      const isCheckpoint = checkpointEvery > 0 && (row.time % checkpointEvery === 0);

      if (!showAll && !isEvent && !isCheckpoint) {
        skipped++;
        continue;
      }

      if (skipped) {
        lines.push(`... (skipped ${skipped} idle cycles) ...`);
        skipped = 0;
      }

      const distStr = row.distance != null ? ` dist=${pad(row.distance, 3)}` : '';

      const Lparts = [
        Ld.beamsFired ? `dBeams=${Ld.beamsFired}` : '',
        Ld.torpsFired ? `dTorps=${Ld.torpsFired}` : '',
        (Ld.torpsHit || Ld.torpsMiss) ? `dTH/dTM=${Ld.torpsHit || 0}/${Ld.torpsMiss || 0}` : '',
        Ld.fightersLaunched ? `dFL=${Ld.fightersLaunched}` : '',
        Ld.fighterShots ? `dFS=${Ld.fighterShots}` : '',
        Ld.fightersKilled ? `dFK=${Ld.fightersKilled}` : '',
        Math.round(Ld.damageDealt || 0) ? `dDmg=${Math.round(Ld.damageDealt || 0)}` : '',
        Math.round(Ld.crewKilled || 0) ? `dCrew=${Math.round(Ld.crewKilled || 0)}` : '',
      ].filter(Boolean).join(' ');

      const Rparts = [
        Rd.beamsFired ? `dBeams=${Rd.beamsFired}` : '',
        Rd.torpsFired ? `dTorps=${Rd.torpsFired}` : '',
        (Rd.torpsHit || Rd.torpsMiss) ? `dTH/dTM=${Rd.torpsHit || 0}/${Rd.torpsMiss || 0}` : '',
        Rd.fightersLaunched ? `dFL=${Rd.fightersLaunched}` : '',
        Rd.fighterShots ? `dFS=${Rd.fighterShots}` : '',
        Rd.fightersKilled ? `dFK=${Rd.fightersKilled}` : '',
        Math.round(Rd.damageDealt || 0) ? `dDmg=${Math.round(Rd.damageDealt || 0)}` : '',
        Math.round(Rd.crewKilled || 0) ? `dCrew=${Math.round(Rd.crewKilled || 0)}` : '',
      ].filter(Boolean).join(' ');

      const stateL = row.state?.L || {};
      const stateR = row.state?.R || {};

      const tag = isEvent ? 'EVT' : 'CHK';
      lines.push(
        `T=${pad(row.time, 4)}${distStr} [${tag}] | ` +
        `L(${Lparts || '-'}) [sh=${pad(stateL.Shield ?? '?', 3)} dmg=${pad(stateL.Damage ?? '?', 3)} crew=${pad(stateL.Crew ?? '?', 5)} f=${pad(stateL.Fighters ?? '?', 3)} out=${pad(stateL.FightersOut ?? '?', 3)} torp=${pad(stateL.Torpedos ?? '?', 4)}] | ` +
        `R(${Rparts || '-'}) [sh=${pad(stateR.Shield ?? '?', 3)} dmg=${pad(stateR.Damage ?? '?', 3)} crew=${pad(stateR.Crew ?? '?', 5)} f=${pad(stateR.Fighters ?? '?', 3)} out=${pad(stateR.FightersOut ?? '?', 3)} torp=${pad(stateR.Torpedos ?? '?', 4)}]`
      );
    }

    if (skipped) lines.push(`... (skipped ${skipped} idle cycles) ...`);

    return header.join('\n') + lines.join('\n');
  };
})();