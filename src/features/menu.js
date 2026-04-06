(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  // Temporary compatibility bridge
  window.__3dvcr = api;

  function getPanelBody() {
    return (
      document.getElementById('nu-cinematics-body') ||
      document.getElementById('nu-3dvcr-body')
    );
  }

  function msg(body, text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'padding:10px; opacity:0.9;';
    body.appendChild(el);
  }

  api.renderVcrTable = function renderVcrTable() {
    if (typeof api.ensurePanel !== 'function') {
      console.error('[Cinematics] ensurePanel is not available.');
      return;
    }

    api.ensurePanel();

    const body = getPanelBody();
    if (!body) {
      console.error('[Cinematics] Panel body not found.');
      return;
    }

    body.innerHTML = '';

    if (typeof api.getVcrs !== 'function') {
      console.error('[Cinematics] getVcrs is not available on API.');
      msg(body, 'Cinematics data source is not ready yet: getVcrs() is unavailable.');
      return;
    }

    let vcrs = [];
    try {
      vcrs = api.getVcrs() || [];
    } catch (e) {
      console.error('[Cinematics] getVcrs failed', e);
      msg(body, `Could not read battle data: ${e.message || e}`);
      return;
    }

    console.log('[Cinematics] VCRs found:', vcrs.length, vcrs);

    const meta = document.createElement('div');
    meta.style.cssText = 'opacity:0.85; font-size:12px; margin-bottom:10px;';
    meta.textContent = `Battles found: ${vcrs.length}`;
    body.appendChild(meta);

    if (!vcrs.length) {
      msg(body, 'No battles found in the current turn data yet. Try after loadturn completes.');
      return;
    }

    const table = document.createElement('table');
    table.style.cssText = 'width:100%; border-collapse:collapse; font-size:13px;';

    table.innerHTML = `
      <thead>
        <tr>
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">Battle</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">Summary</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">Go To</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">Original</th>
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">Cinematics</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    vcrs.forEach((v) => {
      const tr = document.createElement('tr');

      const td1 = document.createElement('td');
      td1.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';
      td1.innerHTML = typeof api.battleLineHtml === 'function'
        ? api.battleLineHtml(v)
        : '(battle summary unavailable)';

      const tdSummary = document.createElement('td');
      tdSummary.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08); opacity:0.9; font-size:12px;';
      tdSummary.textContent = '(run sim)';

      const tdGo = document.createElement('td');
      tdGo.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';

      const coords = typeof api.getBattleCoords === 'function' ? api.getBattleCoords(v) : null;
      const goBtn = api.mkBtn('Go To', () => {
        if (!coords) return alert('No coordinates available for this battle (could not infer x,y).');
        const ok = typeof api.goToCoords === 'function' ? api.goToCoords(coords) : false;
        if (!ok) alert('Could not open map / center map (vgap not ready?).');
      });
      tdGo.appendChild(goBtn);

      const td2 = document.createElement('td');
      td2.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';

      const viewBtn = api.mkBtn('View Original', () => {
        const vgap = window.vgap;
        if (!vgap?.dash?.playVCR) return alert('vgap.dash.playVCR not available yet.');
        try {
          vgap.dash.playVCR(v, vcrs);
        } catch (e) {
          console.error('[Cinematics] playVCR failed', e);
          alert('Could not play original VCR.');
        }
      });
      td2.appendChild(viewBtn);

      const td3 = document.createElement('td');
      td3.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';

      const simBtn = api.mkBtn('Sim + Summary', () => {
        try {
          if (typeof api.simVcrResult !== 'function') {
            throw new Error('simVcrResult() is unavailable');
          }
          const res = api.simVcrResult(v);
          window.__nu_last_vcr3d = { vcr: v, result: res };
          if (typeof api.formatSummary === 'function' && res?.metrics) {
            tdSummary.textContent = api.formatSummary(res.metrics);
          }
          alert(`Result: ${res.results?.join(', ') || '(none)'} | cycles=${res.time ?? '?'}`);
        } catch (e) {
          console.error('[Cinematics] Sim failed', e);
          alert(`Sim failed: ${e.message || e}`);
        }
      });

      const textVcr = api.mkBtn('Text VCR', () => {
        try {
          if (typeof api.simVcrResult !== 'function' || typeof api.formatTextVcr !== 'function' || typeof api.showTextVcrModal !== 'function') {
            throw new Error('Text VCR helpers are unavailable');
          }
          const res = api.simVcrResult(v);
          window.__nu_last_vcr3d = { vcr: v, result: res };
          if (typeof api.formatSummary === 'function' && res?.metrics) {
            tdSummary.textContent = api.formatSummary(res.metrics);
          }
          const txt = api.formatTextVcr(res, v, { checkpointEvery: 25, showAll: false });
          api.showTextVcrModal('Text VCR (Condensed)', txt);
        } catch (e) {
          console.error('[Cinematics] Text VCR failed', e);
          alert(`Text VCR failed: ${e.message || e}`);
        }
      });

      const textVcrFull = api.mkBtn('Text VCR (Full)', () => {
        try {
          if (typeof api.simVcrResult !== 'function' || typeof api.formatTextVcr !== 'function' || typeof api.showTextVcrModal !== 'function') {
            throw new Error('Full Text VCR helpers are unavailable');
          }
          const res = api.simVcrResult(v);
          const txt = api.formatTextVcr(res, v, { showAll: true });
          api.showTextVcrModal('Text VCR (Full)', txt);
        } catch (e) {
          console.error('[Cinematics] Text VCR (Full) failed', e);
          alert(`Text VCR (Full) failed: ${e.message || e}`);
        }
      });

      const viewerBtn = api.mkBtn('Viewer', () => {
        try {
          if (typeof api.render3dBattle !== 'function') {
            throw new Error('render3dBattle() is unavailable');
          }
          api.render3dBattle(v);
        } catch (e) {
          console.error('[Cinematics] Viewer failed', e);
          alert(`Viewer failed: ${e.message || e}`);
        }
      });

      td3.appendChild(simBtn);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(textVcr);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(textVcrFull);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(viewerBtn);

      tr.appendChild(td1);
      tr.appendChild(tdSummary);
      tr.appendChild(tdGo);
      tr.appendChild(td2);
      tr.appendChild(td3);

      tbody.appendChild(tr);
    });

    body.appendChild(table);
  };

  api.insertIntoDashboardMenu = function insertIntoDashboardMenu() {
    if (
      document.getElementById('nu-cinematics-dash-li') ||
      document.getElementById('nu-3dvcr-dash-li')
    ) {
      return true;
    }

    const dash = document.getElementById('DashboardMenu');
    if (!dash) return false;

    const lis = Array.from(dash.querySelectorAll('li'));
    const vcrLi = lis.find((li) => (li.textContent || '').toLowerCase().includes('vcr'));
    if (!vcrLi) return false;

    const newLi = document.createElement('li');
    newLi.id = 'nu-cinematics-dash-li';
    newLi.textContent = 'Cinematics »';
    newLi.style.cssText = 'cursor:pointer;';
    newLi.onclick = (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      api.renderVcrTable();
    };

    vcrLi.parentNode.insertBefore(newLi, vcrLi.nextSibling);

    if (typeof api.log === 'function') {
      api.log('Inserted Cinematics into DashboardMenu');
    } else {
      console.log('[Cinematics] Inserted Cinematics into DashboardMenu');
    }

    return true;
  };
})();