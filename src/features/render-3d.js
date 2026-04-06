(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  const THREE_VERSION = '0.183.0';

  let threeLoadPromise = null;

  async function loadThree() {
    if (threeLoadPromise) return threeLoadPromise;

    threeLoadPromise = (async () => {
      const THREE = await import(`https://esm.sh/three@${THREE_VERSION}`);
      const controlsMod = await import(
        `https://esm.sh/three@${THREE_VERSION}/examples/jsm/controls/OrbitControls.js`
      );

      return {
        THREE,
        OrbitControls: controlsMod.OrbitControls,
      };
    })();

    return threeLoadPromise;
  }

  function removeExistingViewer() {
    const existing = document.getElementById('nu-3dvcr-3d-modal');
    if (existing) existing.remove();
  }

  function createViewerShell() {
    removeExistingViewer();

    const modal = document.createElement('div');
    modal.id = 'nu-3dvcr-3d-modal';
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 1000000;
      background: rgba(0,0,0,0.78);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: min(1400px, 98vw);
      height: min(900px, 95vh);
      display: grid;
      grid-template-rows: auto 1fr auto;
      background: #0b0f14;
      color: #e7edf5;
      border: 1px solid rgba(255,255,255,0.16);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 24px 110px rgba(0,0,0,0.75);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:10px 14px;
      border-bottom:1px solid rgba(255,255,255,0.10);
      background:#0e141b;
    `;

    const title = document.createElement('div');
    title.textContent = '3D Battle Viewer';
    title.style.cssText = 'font-weight:700; letter-spacing:0.02em;';

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:8px; align-items:center;';

    const mkBtn = (label, onClick) => {
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

    const closeBtn = mkBtn('Close', () => modal.remove());
    btnRow.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(btnRow);

    const body = document.createElement('div');
    body.style.cssText = `
      position: relative;
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 50%, rgba(25,40,60,0.35), rgba(4,6,10,1) 70%);
    `;

    const canvasHost = document.createElement('div');
    canvasHost.style.cssText = `
      position:absolute;
      inset:0;
    `;

    const hud = document.createElement('div');
    hud.style.cssText = `
      position:absolute;
      left:12px;
      top:12px;
      padding:10px 12px;
      background:rgba(0,0,0,0.45);
      border:1px solid rgba(255,255,255,0.12);
      border-radius:12px;
      font-size:12px;
      line-height:1.45;
      backdrop-filter: blur(3px);
      max-width: 480px;
      pointer-events:none;
    `;
    hud.textContent = 'Loading 3D battle...';

    const footer = document.createElement('div');
    footer.style.cssText = `
      display:flex;
      align-items:center;
      gap:12px;
      padding:10px 14px;
      border-top:1px solid rgba(255,255,255,0.10);
      background:#0e141b;
      font-size:12px;
      color:rgba(231,237,245,0.86);
    `;

    const status = document.createElement('div');
    status.textContent = 'Mouse: orbit / zoom / pan';
    footer.appendChild(status);

    body.appendChild(canvasHost);
    body.appendChild(hud);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);

    modal.appendChild(card);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);

    return { modal, card, body, canvasHost, hud, status };
  }

  function getShipLabel(side, fallback) {
    return String(
      side?.name ||
      side?.shipname ||
      side?.label ||
      fallback ||
      'Ship'
    ).trim();
  }

  function getPlanetLabel(side, fallback) {
    return String(side?.name || fallback || 'Planet').trim();
  }

  function getSideKind(side) {
    return api.classifySideFromVcr(side).kind;
  }

  function getSideHullName(side) {
    const hullid = side?.hullid != null ? Number(side.hullid) : null;
    return api.hullNameFromVcrHullId(hullid);
  }

  function createLabelSprite(THREE, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(material);
    sprite.scale.set(16, 2.7, 1);
    return sprite;
  }

  function attachSideLabel(THREE, object3d, side, visual, isLeft) {
    const kind = visual?.kind || getSideKind(side);

    let labelText = '';
    if (kind === 'ship') {
      const shipName = getShipLabel(side, isLeft ? 'Left Ship' : 'Right Ship');
      const hullName = getSideHullName(side);
      labelText =
        hullName && hullName.toLowerCase() !== shipName.toLowerCase()
          ? `${shipName} — ${hullName}`
          : shipName;
    } else if (kind === 'starbase') {
      labelText = `${getPlanetLabel(side, isLeft ? 'Left Planet' : 'Right Planet')} — Starbase`;
    } else if (kind === 'planet') {
      labelText = getPlanetLabel(side, isLeft ? 'Left Planet' : 'Right Planet');
    } else {
      labelText = isLeft ? 'Left Object' : 'Right Object';
    }

    const label = createLabelSprite(THREE, labelText);
    label.position.set(0, 10, 0);
    object3d.add(label);
  }

  function buildTimelineObjects(THREE, sim) {
    const group = new THREE.Group();
    const timeline = sim?.metrics?.timeline || [];
    if (!timeline.length) return group;

    const maxCycles = Math.max(1, timeline.length);
    const axisLen = 80;
    const startX = -axisLen / 2;

    const axisMat = new THREE.LineBasicMaterial({ color: 0x7f8ea3 });
    const axisPts = [
      new THREE.Vector3(startX, -12, 0),
      new THREE.Vector3(startX + axisLen, -12, 0),
    ];
    const axisGeom = new THREE.BufferGeometry().setFromPoints(axisPts);
    group.add(new THREE.Line(axisGeom, axisMat));

    const totalL = sim?.metrics?.totals?.L || {};
    const totalR = sim?.metrics?.totals?.R || {};

    for (let i = 0; i < timeline.length; i++) {
      const row = timeline[i];
      const x = startX + (i / Math.max(1, maxCycles - 1)) * axisLen;

      const evtL =
        (row.delta?.L?.beamsFired || 0) +
        (row.delta?.L?.torpsFired || 0) +
        (row.delta?.L?.fightersLaunched || 0);

      const evtR =
        (row.delta?.R?.beamsFired || 0) +
        (row.delta?.R?.torpsFired || 0) +
        (row.delta?.R?.fightersLaunched || 0);

      const h = Math.max(0.2, Math.min(7, (evtL + evtR) * 0.55));
      const geom = new THREE.BoxGeometry(0.65, h, 0.65);
      const mat = new THREE.MeshStandardMaterial({
        color: evtL || evtR ? 0xf4c95d : 0x4b5563,
        roughness: 0.55,
        metalness: 0.15,
      });

      const bar = new THREE.Mesh(geom, mat);
      bar.position.set(x, -12 + h / 2, 0);
      group.add(bar);
    }

    const label = createLabelSprite(
      THREE,
      `cycles=${sim.time ?? '?'} | L dmg=${Math.round(totalL.damageDealt || 0)} | R dmg=${Math.round(totalR.damageDealt || 0)}`
    );
    label.position.set(0, -5.5, 0);
    group.add(label);

    return group;
  }

  function buildAttackLine(THREE, leftObj, rightObj) {
    const pts = [
      new THREE.Vector3(leftObj.position.x + 8, 0, 0),
      new THREE.Vector3(rightObj.position.x - 8, 0, 0),
    ];

    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({
      color: 0xffffff,
      dashSize: 1.8,
      gapSize: 1.2,
      transparent: true,
      opacity: 0.55,
    });

    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
  }

  api.render3dBattle = async function render3dBattle(vcr) {
    const shell = createViewerShell();

    try {
      shell.hud.textContent = 'Loading Three.js and battle data...';

      const [{ THREE, OrbitControls }, sim] = await Promise.all([
        loadThree(),
        Promise.resolve(api.simVcrResult(vcr)),
      ]);

      window.__nu_last_vcr3d = { vcr, result: sim };

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x05080d);
      scene.fog = new THREE.Fog(0x05080d, 70, 180);

      const camera = new THREE.PerspectiveCamera(
        50,
        shell.canvasHost.clientWidth / shell.canvasHost.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 28, 58);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(shell.canvasHost.clientWidth, shell.canvasHost.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      shell.canvasHost.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 0, 0);
      controls.update();

      const ambient = new THREE.AmbientLight(0xffffff, 0.65);
      scene.add(ambient);

      const key = new THREE.DirectionalLight(0xffffff, 1.8);
      key.position.set(18, 24, 12);
      scene.add(key);

      const rim = new THREE.DirectionalLight(0x7aa2ff, 0.7);
      rim.position.set(-20, 10, -18);
      scene.add(rim);

      const starGeom = new THREE.BufferGeometry();
      const starCount = 1400;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPositions[i * 3 + 0] = (Math.random() - 0.5) * 360;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 220;
        starPositions[i * 3 + 2] = (Math.random() - 0.5) * 360;
      }
      starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(
        starGeom,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 0.65,
          transparent: true,
          opacity: 0.85,
          sizeAttenuation: true,
        })
      );
      scene.add(stars);

      const grid = new THREE.GridHelper(100, 20, 0x3b4252, 0x1f2937);
      grid.position.y = -8;
      scene.add(grid);

      const { L, R } = api.getSides(vcr);

      shell.hud.textContent = 'Loading hull/starbase models...';

      const [leftVisual, rightVisual] = await Promise.all([
        api.getVisualForSide(THREE, L, { isLeft: true }),
        api.getVisualForSide(THREE, R, { isLeft: false }),
      ]);

      const leftObj = leftVisual.object3d;
      const rightObj = rightVisual.object3d;

      leftObj.position.set(-20, 0, 0);
      rightObj.position.set(20, 0, 0);

      if (leftVisual.kind === 'ship') {
        leftObj.rotation.y = Math.PI / 2;
      } else if (leftVisual.kind === 'starbase') {
        leftObj.rotation.y = 0;
      }

      if (rightVisual.kind === 'ship') {
        rightObj.rotation.y = -Math.PI / 2;
      } else if (rightVisual.kind === 'starbase') {
        rightObj.rotation.y = Math.PI;
      }

      attachSideLabel(THREE, leftObj, L, leftVisual, true);
      attachSideLabel(THREE, rightObj, R, rightVisual, false);

      scene.add(leftObj);
      scene.add(rightObj);
      scene.add(buildAttackLine(THREE, leftObj, rightObj));
      scene.add(buildTimelineObjects(THREE, sim));

      const totalsL = sim?.metrics?.totals?.L || {};
      const totalsR = sim?.metrics?.totals?.R || {};

      const leftName =
        leftVisual.kind === 'ship'
          ? getShipLabel(L, 'Left')
          : getPlanetLabel(L, 'Left');
      const rightName =
        rightVisual.kind === 'ship'
          ? getShipLabel(R, 'Right')
          : getPlanetLabel(R, 'Right');

      shell.hud.innerHTML = [
        `<div><strong>${api.escapeHtml(leftName)}</strong> vs <strong>${api.escapeHtml(rightName)}</strong></div>`,
        `<div style="opacity:.85; margin-top:4px;">${api.escapeHtml(api.inferBattleType(vcr))}</div>`,
        `<div style="opacity:.85; margin-top:8px;">result=${api.escapeHtml((sim.results || []).join(', ') || '(none)')}</div>`,
        `<div style="opacity:.85;">cycles=${api.escapeHtml(String(sim.time ?? '?'))}</div>`,
        `<div style="opacity:.85; margin-top:8px;">Left visual: ${api.escapeHtml(leftVisual.source)}${leftVisual.url ? ` (${leftVisual.url})` : ''}</div>`,
        `<div style="opacity:.85;">Right visual: ${api.escapeHtml(rightVisual.source)}${rightVisual.url ? ` (${rightVisual.url})` : ''}</div>`,
        `<div style="opacity:.85; margin-top:8px;">L dmg=${Math.round(totalsL.damageDealt || 0)}, beams=${totalsL.beamsFired || 0}, torps=${totalsL.torpsFired || 0}</div>`,
        `<div style="opacity:.85;">R dmg=${Math.round(totalsR.damageDealt || 0)}, beams=${totalsR.beamsFired || 0}, torps=${totalsR.torpsFired || 0}</div>`,
      ].join('');

      let destroyed = false;
      const cleanupFns = [];

      const onResize = () => {
        if (destroyed || !shell.canvasHost.isConnected) return;
        const w = Math.max(1, shell.canvasHost.clientWidth);
        const h = Math.max(1, shell.canvasHost.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', onResize);
      cleanupFns.push(() => window.removeEventListener('resize', onResize));

      const observer = new MutationObserver(() => {
        if (!document.body.contains(shell.modal)) {
          dispose();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      cleanupFns.push(() => observer.disconnect());

      const clock = new THREE.Clock();

      function animate() {
        if (destroyed) return;

        const t = clock.getElapsedTime();

        if (leftVisual.kind === 'ship') {
          leftObj.rotation.z = 0.03 * Math.sin(t * 0.9);
          leftObj.position.y = 0.8 * Math.sin(t * 1.2);
        } else {
          leftObj.rotation.y += 0.0025;
        }

        if (rightVisual.kind === 'ship') {
          rightObj.rotation.z = 0.03 * Math.sin(t * 0.85 + 0.4);
          rightObj.position.y = 0.8 * Math.sin(t * 1.1 + 0.9);
        } else {
          rightObj.rotation.y += 0.0025;
        }

        stars.rotation.y += 0.00035;

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }

      function dispose() {
        if (destroyed) return;
        destroyed = true;

        cleanupFns.forEach((fn) => {
          try { fn(); } catch {}
        });

        controls.dispose();

        scene.traverse((obj) => {
          if (obj.geometry?.dispose) {
            try { obj.geometry.dispose(); } catch {}
          }

          if (obj.material) {
            const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
            materials.forEach((m) => {
              if (m.map?.dispose) {
                try { m.map.dispose(); } catch {}
              }
              if (m.dispose) {
                try { m.dispose(); } catch {}
              }
            });
          }
        });

        renderer.dispose();
      }

      animate();

      shell.status.textContent = 'Drag: orbit · Wheel: zoom · Right-drag: pan';
    } catch (err) {
      console.error('[3DVCR] Render 3D failed', err);
      shell.hud.textContent = `3D render failed: ${err?.message || err}`;
      shell.status.textContent = 'See browser console for details.';
    }
  };
})();