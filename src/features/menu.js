(function () {
  'use strict';

  const api = window.__3dvcr;

  api.renderVcrTable = function renderVcrTable() {
    api.ensurePanel();
    const body = document.getElementById('nu-3dvcr-body');
    if (!body) return;

    const vcrs = api.getVcrs();
    console.log(vcrs); // @todo remove
    body.innerHTML = '';

    const meta = document.createElement('div');
    meta.style.cssText = 'opacity:0.85; font-size:12px; margin-bottom:10px;';
    meta.textContent = `Battles found: ${vcrs.length}`;
    body.appendChild(meta);

    if (!vcrs.length) {
      const empty = document.createElement('div');
      empty.textContent = 'No battles found in the current turn data (yet). Try after loadturn completes.';
      empty.style.cssText = 'padding:10px; opacity:0.9;';
      body.appendChild(empty);
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
          <th style="text-align:left; padding:8px; border-bottom:1px solid rgba(255,255,255,0.12);">3D</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    vcrs.forEach((v) => {
      const tr = document.createElement('tr');

      const td1 = document.createElement('td');
      td1.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';
      td1.innerHTML = api.battleLineHtml(v);

      const tdSummary = document.createElement('td');
      tdSummary.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08); opacity:0.9; font-size:12px;';
      tdSummary.textContent = '(run sim)';

      const tdGo = document.createElement('td');
      tdGo.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';

      const coords = api.getBattleCoords(v);
      const goBtn = api.mkBtn('Go To', () => {
        if (!coords) return alert('No coordinates available for this battle (could not infer x,y).');
        const ok = api.goToCoords(coords);
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
          console.error('playVCR failed', e);
          alert('Could not play original VCR (playVCR threw).');
        }
      });
      td2.appendChild(viewBtn);

      const td3 = document.createElement('td');
      td3.style.cssText = 'padding:8px; vertical-align:top; border-bottom:1px solid rgba(255,255,255,0.08);';

      const open3d = api.mkBtn('Sim + Summary', () => {
        try {
          const res = api.simVcrResult(v);
          window.__nu_last_vcr3d = { vcr: v, result: res };
          tdSummary.textContent = api.formatSummary(res.metrics);
          console.log('[3DVCR] sim result', res);
          alert(`Result: ${res.results.join(', ') || '(none)'} | cycles=${res.time ?? '?'}`);
        } catch (e) {
          console.error('[3DVCR] Sim failed', e);
          alert(`Sim failed: ${e.message || e}`);
        }
      });

      const textVcr = api.mkBtn('Text VCR', () => {
        try {
          const res = api.simVcrResult(v);
          window.__nu_last_vcr3d = { vcr: v, result: res };
          tdSummary.textContent = api.formatSummary(res.metrics);
          const txt = api.formatTextVcr(res, v, { checkpointEvery: 25, showAll: false });
          api.showTextVcrModal('Text VCR (Condensed)', txt);
        } catch (e) {
          console.error('[3DVCR] Text VCR failed', e);
          alert(`Text VCR failed: ${e.message || e}`);
        }
      });

      const textVcrFull = api.mkBtn('Text VCR (Full)', () => {
        try {
          const res = api.simVcrResult(v);
          const txt = api.formatTextVcr(res, v, { showAll: true });
          api.showTextVcrModal('Text VCR (Full)', txt);
        } catch (e) {
          console.error('[3DVCR] Text VCR (Full) failed', e);
          alert(`Text VCR (Full) failed: ${e.message || e}`);
        }
      });

        const render3d = api.mkBtn('3D Viewer', () => {
        try {
            api.render3dBattle(v);
        } catch (e) {
            console.error('[3DVCR] Render 3D failed', e);
            alert(`Render 3D failed: ${e.message || e}`);
        }
        });

      td3.appendChild(open3d);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(textVcr);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(textVcrFull);
      td3.appendChild(document.createTextNode(' '));
      td3.appendChild(render3d);

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
    if (document.getElementById('nu-3dvcr-dash-li')) return true;

    const dash = document.getElementById('DashboardMenu');
    if (!dash) return false;

    const lis = Array.from(dash.querySelectorAll('li'));
    const vcrLi = lis.find((li) => (li.textContent || '').toLowerCase().includes('vcr'));
    if (!vcrLi) return false;

    const newLi = document.createElement('li');
    newLi.id = 'nu-3dvcr-dash-li';
    newLi.textContent = '3D VCR »';
    newLi.style.cssText = 'cursor:pointer;';
    newLi.onclick = (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      api.renderVcrTable();
    };

    vcrLi.parentNode.insertBefore(newLi, vcrLi.nextSibling);
    api.log('Inserted 3D VCR into DashboardMenu');
    return true;
  };
})();