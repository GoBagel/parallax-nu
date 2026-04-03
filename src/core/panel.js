(function () {
  'use strict';

  const api = window.__3dvcr;

  const POS_KEY = 'nu_3dvcr_pos_v1';

  function loadPanelPos() {
    try {
      return JSON.parse(localStorage.getItem(POS_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function savePanelPos(pos) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {}
  }

  api.ensurePanel = function ensurePanel() {
    let panel = document.getElementById('nu-3dvcr-panel');
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = 'nu-3dvcr-panel';

    const saved = loadPanelPos();
    panel.style.cssText = `
      position: fixed;
      left: ${saved?.left ?? 60}px;
      top: ${saved?.top ?? 60}px;
      width: min(1080px, 96vw);
      max-height: calc(100vh - 120px);
      overflow: auto;
      z-index: 90;
      background: rgba(15,15,15,0.97);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 12px;
      box-shadow: 0 20px 80px rgba(0,0,0,0.6);
      font-family: sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      padding:10px 12px;
      border-bottom:1px solid rgba(255,255,255,0.12);
      position:sticky;
      top:0;
      background:rgba(15,15,15,0.97);
      cursor:move;
      z-index:1;
    `;

    let drag = null;

    header.addEventListener('mousedown', (e) => {
      if (e.target && e.target.tagName === 'BUTTON') return;

      drag = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: panel.offsetLeft,
        startTop: panel.offsetTop,
      };
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!drag) return;
      const left = Math.max(0, drag.startLeft + (e.clientX - drag.startX));
      const top = Math.max(0, drag.startTop + (e.clientY - drag.startY));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      savePanelPos({ left, top });
    });

    window.addEventListener('mouseup', () => {
      drag = null;
    });

    const title = document.createElement('div');
    title.textContent = '3D VCR – Current Turn';
    title.style.cssText = 'font-weight:700;';

    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.cssText = `
      background: rgba(255,255,255,0.12);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.22);
      padding: 6px 10px;
      border-radius: 10px;
      cursor: pointer;
    `;
    close.onclick = () => panel.remove();

    header.appendChild(title);
    header.appendChild(close);

    const body = document.createElement('div');
    body.id = 'nu-3dvcr-body';
    body.style.cssText = 'padding:10px 12px;';

    panel.appendChild(header);
    panel.appendChild(body);

    document.body.appendChild(panel);
    return panel;
  };

  api.mkBtn = function mkBtn(label, onClick) {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `
      background: rgba(255,255,255,0.12);
      color:#fff;
      border: 1px solid rgba(255,255,255,0.22);
      padding: 6px 10px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    `;
    b.onclick = onClick;
    return b;
  };
})();