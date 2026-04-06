(function () {
  'use strict';

  const root = window.ParallaxNu = window.ParallaxNu || {};
  const api = root.Cinematics = root.Cinematics || {};

  api.assetState = {
    THREE: null,
    GLTFLoader: null,
    gltfLoader: null,
    loadersReady: false,
    modelCache: new Map(),
    failedModels: new Set(),
  };

  api.assetConfig = {
    baseUrl: 'http://127.0.0.1:8001/assets',
    hullPath: 'models/hulls',
    starbasePath: 'models/starbases',
  };

  api.ensureAssetLoaders = async function ensureAssetLoaders(THREE) {
    if (api.assetState.loadersReady) return api.assetState;

    const loaderMod = await import('https://esm.sh/three@0.183.0/examples/jsm/loaders/GLTFLoader.js');

    api.assetState.THREE = THREE;
    api.assetState.GLTFLoader = loaderMod.GLTFLoader;
    api.assetState.gltfLoader = new loaderMod.GLTFLoader();
    api.assetState.loadersReady = true;

    return api.assetState;
  };

  api.resolveHullModelUrl = function resolveHullModelUrl(hullId) {
    const n = Number(hullId);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `${api.assetConfig.baseUrl}/${api.assetConfig.hullPath}/${n}.glb`;
  };

  api.resolveStarbaseModelUrl = function resolveStarbaseModelUrl(raceId) {
    const n = Number(raceId);
    if (!Number.isFinite(n) || n <= 0) return null;
    return `${api.assetConfig.baseUrl}/${api.assetConfig.starbasePath}/${n}.glb`;
  };

  api.loadModelCached = async function loadModelCached(url) {
    if (!url) throw new Error('No model URL provided');

    if (api.assetState.modelCache.has(url)) {
      return api.assetState.modelCache.get(url);
    }

    if (api.assetState.failedModels.has(url)) {
      throw new Error(`Previously failed model: ${url}`);
    }

    const scene = await new Promise((resolve, reject) => {
      api.assetState.gltfLoader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => reject(err)
      );
    });

    api.assetState.modelCache.set(url, scene);
    return scene;
  };

  api.cloneModelScene = function cloneModelScene(scene) {
    return scene.clone(true);
  };

  api.normalizeModelInstance = function normalizeModelInstance(THREE, object3d) {
    const root = new THREE.Group();
    root.add(object3d);

    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Move model so its center is at origin
    object3d.position.sub(center);

    // Uniform scale to a reasonable scene size
    const maxDim = Math.max(size.x || 1, size.y || 1, size.z || 1);
    const target = 12;
    const scale = target / maxDim;
    root.scale.setScalar(scale);

    return root;
  };

  api.buildPlaceholderVisual = function buildPlaceholderVisual(THREE, kind, isLeft) {
    const color =
      kind === 'starbase'
        ? 0xb48ead
        : kind === 'ship'
          ? (isLeft ? 0x46d36f : 0xe06c75)
          : 0x888888;

    let mesh;

    if (kind === 'starbase') {
      const geom = new THREE.CylinderGeometry(4.5, 4.5, 3.2, 24);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.65,
      });
      mesh = new THREE.Mesh(geom, mat);

      const ringGeom = new THREE.TorusGeometry(6.5, 0.45, 16, 48);
      const ringMat = new THREE.MeshStandardMaterial({
        color: 0xd8dee9,
        roughness: 0.35,
        metalness: 0.75,
      });
      const ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 2;
      mesh.add(ring);
    } else {
      const geom = new THREE.CapsuleGeometry(1.3, 7.5, 8, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.55,
      });
      mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.z = Math.PI / 2;

      const noseGeom = new THREE.ConeGeometry(1.7, 3.2, 20);
      const noseMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.35,
        metalness: 0.65,
      });
      const nose = new THREE.Mesh(noseGeom, noseMat);
      nose.rotation.z = -Math.PI / 2;
      nose.position.x = isLeft ? 5.5 : -5.5;
      mesh.add(nose);
    }

    return mesh;
  };

  api.getVisualForSide = async function getVisualForSide(THREE, side, opts = {}) {
    const isLeft = !!opts.isLeft;
    const info = api.classifySideFromVcr(side);

    await api.ensureAssetLoaders(THREE);

    if (info.kind === 'ship') {
      const url = api.resolveHullModelUrl(side?.hullid);

      try {
        const cached = await api.loadModelCached(url);
        const clone = api.cloneModelScene(cached);
        return {
          object3d: api.normalizeModelInstance(THREE, clone),
          source: 'model',
          kind: 'ship',
          url,
          hullId: Number(side?.hullid),
        };
      } catch (err) {
        console.warn('[3DVCR] Ship model load failed', side?.hullid, url, err);
        if (url) api.assetState.failedModels.add(url);

        return {
          object3d: api.buildPlaceholderVisual(THREE, 'ship', isLeft),
          source: 'placeholder',
          kind: 'ship',
          url,
          hullId: Number(side?.hullid),
        };
      }
    }

    if (info.kind === 'planet' && info.hasStarbase) {
      const raceId = Number(side?.raceid);
      const url = api.resolveStarbaseModelUrl(raceId);

      try {
        const cached = await api.loadModelCached(url);
        const clone = api.cloneModelScene(cached);
        return {
          object3d: api.normalizeModelInstance(THREE, clone),
          source: 'model',
          kind: 'starbase',
          url,
          raceId,
        };
      } catch (err) {
        console.warn('[3DVCR] Starbase model load failed', raceId, url, err);
        if (url) api.assetState.failedModels.add(url);

        return {
          object3d: api.buildPlaceholderVisual(THREE, 'starbase', isLeft),
          source: 'placeholder',
          kind: 'starbase',
          url,
          raceId,
        };
      }
    }

    return {
      object3d: api.buildPlaceholderVisual(THREE, 'unknown', isLeft),
      source: 'placeholder',
      kind: info.kind || 'unknown',
      url: null,
    };
  };
})();