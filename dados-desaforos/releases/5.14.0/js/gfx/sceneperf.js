/* Geometria de cenário estático: um envio à GPU por material e quarteirão.
   Opt-in: chamar apenas para grupos cuja arquitetura não se move. Objetos animados
   e interativos continuam separados e devem ser passados em `exclude`. */
(() => {
  'use strict';
  const P = {};
  const TYPES = new Set(['MeshBasicMaterial', 'MeshStandardMaterial']);
  const PROPS = ['type', 'color', 'emissive', 'emissiveIntensity', 'roughness', 'metalness',
    'vertexColors', 'flatShading', 'side', 'shadowSide', 'toneMapped', 'fog', 'depthTest',
    'depthWrite', 'colorWrite', 'blending', 'blendSrc', 'blendDst', 'blendEquation',
    'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'premultipliedAlpha',
    'dithering', 'wireframe', 'wireframeLinewidth', 'alphaTest', 'alphaHash',
    'map', 'lightMap', 'lightMapIntensity', 'aoMap', 'aoMapIntensity', 'emissiveMap',
    'bumpMap', 'bumpScale', 'normalMap', 'normalMapType', 'normalScale',
    'roughnessMap', 'metalnessMap', 'alphaMap', 'envMap', 'envMapIntensity',
    'reflectivity', 'refractionRatio', 'combine', 'defines'];
  const value = (v) => v && v.isColor ? v.getHexString() : v && v.isTexture ? v.uuid :
    v && (v.isVector2 || v.isVector3) ? v.toArray() : v;
  const materialKey = (m, bakeColors) => JSON.stringify(PROPS.map((k) => bakeColors && (k === 'color' || k === 'vertexColors') ? null : value(m[k])));
  const attributesKey = (g, bakeColors) => Object.keys(g.attributes).filter((name) => !bakeColors || name !== 'color').sort().map((name) => {
    const a = g.attributes[name];
    return `${name}:${a.itemSize}:${a.normalized ? 1 : 0}:${a.array.constructor.name}`;
  }).join('|');

  // Existing position/normal/uv/color attributes are retained, with transforms baked
  // into copies. Do not weld vertices: that would smooth authored hard edges/UVs.
  function combine(items, matrix, material, bakeColors) {
    const transformed = [];
    let count = 0;
    try {
      for (const mesh of items) {
        const source = mesh.geometry;
        const g = source.index ? source.toNonIndexed() : source.clone();
        g.applyMatrix4(matrix.clone().multiply(mesh.matrixWorld));
        if (bakeColors) {
          const sourceColor = mesh.material.vertexColors && g.attributes.color;
          const color = mesh.material.color, count = g.attributes.position.count;
          const colors = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            colors[i * 3] = color.r * (sourceColor ? sourceColor.getX(i) : 1);
            colors[i * 3 + 1] = color.g * (sourceColor ? sourceColor.getY(i) : 1);
            colors[i * 3 + 2] = color.b * (sourceColor ? sourceColor.getZ(i) : 1);
          }
          g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        }
        transformed.push(g);
        count += g.attributes.position.count;
      }
      const merged = new THREE.BufferGeometry();
      for (const name of Object.keys(transformed[0].attributes)) {
        const first = transformed[0].attributes[name];
        const data = new first.array.constructor(count * first.itemSize);
        let offset = 0;
        for (const g of transformed) { data.set(g.attributes[name].array, offset); offset += g.attributes[name].array.length; }
        merged.setAttribute(name, new THREE.BufferAttribute(data, first.itemSize, first.normalized));
      }
      merged.computeBoundingBox(); merged.computeBoundingSphere();
      const batchMaterial = material.clone();
      if (bakeColors) { batchMaterial.color.setRGB(1, 1, 1); batchMaterial.vertexColors = true; }
      const out = new THREE.Mesh(merged, batchMaterial);
      out.name = 'static-batch'; out.castShadow = items[0].castShadow; out.receiveShadow = items[0].receiveShadow;
      out.layers.mask = items[0].layers.mask; out.renderOrder = items[0].renderOrder;
      out.matrixAutoUpdate = false;
      return out;
    } finally { for (const g of transformed) g.dispose(); }
  }

  P.batch = (root, { exclude = [], cellSize = 40, minMeshes = 2, maxVertices = 90000, bakeColors = true } = {}) => {
    if (!root || root.userData.scenePerfBatch) return root && root.userData.scenePerfBatch;
    const omitted = new Set(exclude.filter(Boolean));
    const groups = new Map();
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const point = new THREE.Vector3();
    const collect = (node, blocked) => {
      blocked = blocked || omitted.has(node) || node.userData.noStaticBatch || !node.visible;
      if (blocked) return;
      const m = node.material, g = node.geometry;
      if (node.isMesh && !node.isInstancedMesh && !node.isSkinnedMesh && !node.children.length &&
          g && g.attributes.position && !Array.isArray(m) && m && TYPES.has(m.type) && !m.transparent && m.opacity === 1 &&
          !m.clippingPlanes && !m.displacementMap &&
          m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile &&
          node.onBeforeRender === THREE.Object3D.prototype.onBeforeRender &&
          (!bakeColors || !g.attributes.color || g.attributes.color.itemSize === 3) &&
          Object.keys(g.morphAttributes).length === 0 &&
          g.drawRange.start === 0 && g.drawRange.count === Infinity &&
          Object.values(g.attributes).every((a) => !a.isInterleavedBufferAttribute && !a.isInstancedBufferAttribute)) {
        point.setFromMatrixPosition(node.matrixWorld).applyMatrix4(inverse);
        const chunk = `${Math.floor(point.x / cellSize)},${Math.floor(point.z / cellSize)}`;
        const key = `${chunk}|${materialKey(m, bakeColors)}|${attributesKey(g, bakeColors)}|${node.castShadow}|${node.receiveShadow}|${node.layers.mask}|${node.renderOrder}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(node);
      }
      for (const child of node.children) collect(child, false);
    };
    collect(root, false);
    const stats = { sourceMeshes: 0, batches: 0, savedCalls: 0 };
    const flush = (items) => {
      if (items.length < minMeshes) return;
      const batch = combine(items, inverse, items[0].material, bakeColors);
      root.add(batch);
      for (const mesh of items) {
        // Keep the originals for camera raycasts and existing lifecycle disposal.
        // Raycaster intersects geometry irrespective of renderer visibility.
        mesh.visible = false;
        mesh.updateMatrix(); mesh.matrixAutoUpdate = false;
        mesh.matrixWorldAutoUpdate = false;
        mesh.userData.scenePerfSource = true;
      }
      stats.sourceMeshes += items.length; stats.batches++;
      stats.savedCalls += items.length - 1;
    };
    for (const group of groups.values()) {
      let items = [], vertices = 0;
      for (const mesh of group) {
        const n = mesh.geometry.index ? mesh.geometry.index.count : mesh.geometry.attributes.position.count;
        if (items.length && vertices + n > maxVertices) { flush(items); items = []; vertices = 0; }
        items.push(mesh); vertices += n;
      }
      flush(items);
    }
    root.userData.scenePerfBatch = stats;
    return stats;
  };
  E.ScenePerf = P;
})();
