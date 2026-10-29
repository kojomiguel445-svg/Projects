/* Mundo 3D de Elarion (estilo HD-2D): terreno low-poly, água, céu, objetos instanciados,
   personagens em pixel art, inimigos visíveis, baús, estátuas de teleporte e a arena de combate. */
(() => {
  const U = E.U;
  const WG = {};
  let renderer, canvas, clock, raf = 0, mode = 'idle';
  const tmpV = new THREE.Vector3(), cameraPos = new THREE.Vector3(), cameraDir = new THREE.Vector3();
  let maxPixelRatio = 1, scaleFloor = .6, lastFrame = 0, sampleMs = 0, sampleFrames = 0, goodWindows = 0, frameBudget = 0, lastTick = 0;
  // Cached canvases remain reusable: texture.dispose releases only their GPU copy.
  function disposeScene(scene) {
    const geometry = new Set(), materials = new Set(), textures = new Set();
    for (const root of (Array.isArray(scene) ? scene : [scene])) root.traverse((o) => {
      if (o.geometry) geometry.add(o.geometry);
      if (o.shadow && o.shadow.dispose) o.shadow.dispose();
      for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) {
        materials.add(m);
        for (const v of Object.values(m)) if (v && v.isTexture) textures.add(v);
        if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value && u.value.isTexture) textures.add(u.value);
      }
    });
    for (const t of textures) t.dispose();
    for (const m of materials) m.dispose();
    for (const g of geometry) g.dispose();
  }
  function adaptResolution(ms) {
    if (!E.state.settings.adaptiveResolution || ms > 2000 || mode === 'idle') return;
    sampleMs += ms; sampleFrames++;
    if (sampleMs < 1600) return;
    const avg = sampleMs / sampleFrames, current = renderer.getPixelRatio();
    sampleMs = sampleFrames = 0;
    if (avg > (mode === 'title' ? 45 : 25) && current > scaleFloor + .02) {
      renderer.setPixelRatio(Math.max(scaleFloor, Math.round((current - .12) * 100) / 100));
      WG.resize(); goodWindows = 0;
    } else if (avg < (mode === 'title' ? 35 : 18) && current < maxPixelRatio - .02) {
      if (++goodWindows >= 5) { renderer.setPixelRatio(Math.min(maxPixelRatio, current + .08)); WG.resize(); goodWindows = 0; }
    } else goodWindows = 0;
  }

  // ============================================================ ruído
  function makeNoise(seed) {
    const rnd = U.seeded(seed);
    const perm = new Uint8Array(512), grad = [];
    const p = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    for (let i = 0; i < 256; i++) { const a = rnd() * Math.PI * 2; grad.push([Math.cos(a), Math.sin(a)]); }
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const n2 = (x, y) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, xf = x - Math.floor(x), yf = y - Math.floor(y);
      const g = (ix, iy, dx, dy) => { const gg = grad[perm[ix + perm[iy]]]; return gg[0] * dx + gg[1] * dy; };
      const u = fade(xf), v = fade(yf);
      const a = g(X, Y, xf, yf), b = g(X + 1, Y, xf - 1, yf), c = g(X, Y + 1, xf, yf - 1), d = g(X + 1, Y + 1, xf - 1, yf - 1);
      return U.lerp(U.lerp(a, b, u), U.lerp(c, d, u), v);
    };
    const fbm = (x, y, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * n2(x * f, y * f); f *= 2; a *= 0.5; } return s; };
    return { n2, fbm };
  }

  // ============================================================ utilidades de geometria
  const col = (h) => new THREE.Color(h);
  // sprites com escala x negativa ficam espelhados (o shader padrão do three usa só o comprimento da escala e perde o sinal)
  if (THREE.ShaderLib.sprite && !THREE.ShaderLib.sprite.vertexShader.includes('FLIPX')) {
    THREE.ShaderLib.sprite.vertexShader = THREE.ShaderLib.sprite.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n\t#ifdef USE_MAP\n\tif ( modelMatrix[ 0 ].x < 0.0 ) vMapUv.x = 1.0 - vMapUv.x; // FLIPX\n\t#endif');
  }
  function colorize(geo, color) {
    geo = geo.index ? geo.toNonIndexed() : geo;
    const n = geo.attributes.position.count, c = new Float32Array(n * 3), cc = col(color);
    for (let i = 0; i < n; i++) { c[i * 3] = cc.r; c[i * 3 + 1] = cc.g; c[i * 3 + 2] = cc.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    geo.deleteAttribute('uv');
    return geo;
  }
  function merge(geos) {
    let total = 0;
    geos.forEach((g) => { total += g.attributes.position.count; });
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), colr = new Float32Array(total * 3);
    let o = 0;
    for (const g of geos) {
      g.computeVertexNormals();
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      colr.set(g.attributes.color.array, o * 3);
      o += g.attributes.position.count;
    }
    const m = new THREE.BufferGeometry();
    m.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    m.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    m.setAttribute('color', new THREE.BufferAttribute(colr, 3));
    return m;
  }
  const part = (geo, color, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
    const g = colorize(geo, color);
    g.scale(sx, sy, sz); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z);
    return g;
  };

  // ============================================================ objetos (props)
  // retorna {solid: geometry|null, glow: geometry|null, r: raio de colisão}
  function propDef(type, B) {
    const leaf = B.ground[1], leaf2 = B.ground[2], trunk = '#6b4a2e';
    switch (type) {
      case 'tree': return { solid: merge([part(new THREE.CylinderGeometry(0.18, 0.28, 1.6, 6), trunk, 0, 0.8), part(new THREE.IcosahedronGeometry(1.25, 0), U.pick([leaf, leaf2, E.SP.shade(leaf, -0.15)]), 0, 2.2), part(new THREE.IcosahedronGeometry(0.9, 0), leaf2, 0.35, 3.0, 0.1)]), r: 0.5 };
      case 'pine': return { solid: merge([part(new THREE.CylinderGeometry(0.15, 0.22, 1.2, 6), trunk, 0, 0.6), part(new THREE.ConeGeometry(1.2, 1.6, 7), E.SP.shade(leaf, -0.2), 0, 1.7), part(new THREE.ConeGeometry(0.95, 1.4, 7), E.SP.shade(leaf, -0.1), 0, 2.5), part(new THREE.ConeGeometry(0.65, 1.2, 7), B.snow ? '#eef4fa' : leaf, 0, 3.2)]), r: 0.45 };
      case 'bush': return { solid: merge([part(new THREE.IcosahedronGeometry(0.6, 0), E.SP.shade(leaf, -0.1), 0, 0.35, 0, 0, 0, 0, 1.3, 0.8, 1.2), part(new THREE.IcosahedronGeometry(0.4, 0), leaf2, 0.4, 0.45, 0.2)]), r: 0 };
      case 'rock': return { solid: merge([part(new THREE.DodecahedronGeometry(0.7, 0), '#a39c90', 0, 0.3, 0, 0, 0, 0, 1.3, 0.75, 1.0), part(new THREE.DodecahedronGeometry(0.35, 0), '#b5ada0', 0.6, 0.15, 0.3)]), r: 0.7 };
      case 'flower': {
        const c = U.pick(['#ff9ad5', '#ffd36b', '#ffffff', '#b8a6ff', '#ff7a7a']);
        return { solid: merge([part(new THREE.IcosahedronGeometry(0.16, 0), c, 0, 0.25), part(new THREE.IcosahedronGeometry(0.13, 0), c, 0.3, 0.2, 0.15), part(new THREE.IcosahedronGeometry(0.12, 0), '#ffffff', -0.25, 0.18, 0.2), part(new THREE.ConeGeometry(0.25, 0.3, 5), leaf2, 0, 0.1)]), r: 0 };
      }
      case 'lantern': return { solid: merge([part(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5), '#3a3040', 0, 0.8), part(new THREE.BoxGeometry(0.5, 0.06, 0.06), '#3a3040', 0.2, 1.55)]), glow: merge([part(new THREE.OctahedronGeometry(0.16, 0), '#9fe3ff', 0.42, 1.35)]), r: 0.15 };
      case 'house': {
        const wall = U.pick(['#e8dcc0', '#d8c8a8', '#c8b8a0']), roof = U.pick(['#b34a3a', '#3a62a8', '#5a7a4a']);
        // telhado de quatro águas no retângulo da casa (beiral uniforme) e embasamento de pedra para o declive
        const hip = part(new THREE.ConeGeometry(2.4, 1.6, 4), roof, 0, 0, 0, 0, Math.PI / 4); hip.scale(1.05, 1, 0.92); hip.translate(0, 3.0, 0);
        return { solid: merge([part(new THREE.BoxGeometry(3.24, 1.0, 2.84), '#9c9484', 0, -0.42), part(new THREE.BoxGeometry(3, 2.2, 2.6), wall, 0, 1.1), hip, part(new THREE.BoxGeometry(0.42, 1.1, 0.42), '#8a7e72', 0.85, 3.35, -0.45), part(new THREE.BoxGeometry(0.8, 1.3, 0.12), '#6b4a2e', 0, 0.65, 1.32), part(new THREE.BoxGeometry(1.0, 0.1, 0.5), '#9c9484', 0, 0.05, 1.5), part(new THREE.BoxGeometry(0.55, 0.55, 0.1), '#ffe9a8', 0.95, 1.45, 1.31), part(new THREE.BoxGeometry(0.55, 0.55, 0.1), '#ffe9a8', -0.95, 1.45, 1.31)]), r: 1.8 };
      }
      case 'lamp': return { solid: merge([part(new THREE.CylinderGeometry(0.07, 0.1, 2.2, 6), '#2a2a34', 0, 1.1)]), glow: merge([part(new THREE.BoxGeometry(0.3, 0.35, 0.3), '#ffe0a0', 0, 2.3)]), r: 0.15 };
      case 'crate': return { solid: merge([part(new THREE.BoxGeometry(0.8, 0.8, 0.8), '#9a6a3a', 0, 0.4), part(new THREE.BoxGeometry(0.6, 0.6, 0.6), '#8a5a2a', 0.7, 0.3, 0.2, 0, 0.5)]), r: 0.6 };
      case 'pillar': return { solid: merge([part(new THREE.CylinderGeometry(0.4, 0.45, 3 + U.rand() * 2, 8), '#c8c0b0', 0, 1.8), part(new THREE.BoxGeometry(1.1, 0.3, 1.1), '#b8b0a0', 0, 0.15)]), r: 0.55 };
      case 'arch': return { solid: merge([part(new THREE.BoxGeometry(0.7, 4, 0.7), '#b8b0a0', -1.6, 2), part(new THREE.BoxGeometry(0.7, 4, 0.7), '#b8b0a0', 1.6, 2), part(new THREE.BoxGeometry(4, 0.7, 0.8), '#c8c0b0', 0, 4.2)]), r: 0.6 };
      case 'deadtree': return { solid: merge([part(new THREE.CylinderGeometry(0.12, 0.25, 2.4, 5), '#4a3a34', 0, 1.2), part(new THREE.CylinderGeometry(0.05, 0.1, 1.2, 4), '#4a3a34', 0.4, 2.1, 0, 0, 0, -0.8), part(new THREE.CylinderGeometry(0.05, 0.1, 1, 4), '#4a3a34', -0.35, 1.8, 0, 0, 0, 0.9)]), r: 0.3 };
      case 'crystal': { const c = B.light || '#c8a8ff'; return { solid: merge([part(new THREE.DodecahedronGeometry(0.4, 0), '#4a4a5a', 0, 0.1)]), glow: merge([part(new THREE.OctahedronGeometry(0.45, 0), c, 0, 0.9, 0, 0, 0, 0.2, 0.7, 2, 0.7), part(new THREE.OctahedronGeometry(0.3, 0), c, 0.4, 0.55, 0.1, 0, 0, -0.5, 0.6, 1.6, 0.6)]), r: 0.4 }; }
      case 'palm': return { solid: merge([part(new THREE.CylinderGeometry(0.12, 0.2, 3.2, 6), '#9a7a52', 0, 1.6, 0, 0, 0, 0.15), ...[0, 1, 2, 3, 4].map((i) => part(new THREE.ConeGeometry(0.35, 1.8, 4), '#5aa04a', Math.cos(i * 1.25) * 0.8 + 0.25, 3.1, Math.sin(i * 1.25) * 0.8, Math.sin(i * 1.25) * 1.2, 0, -Math.cos(i * 1.25) * 1.2))]), r: 0.3 };
      case 'shell': return { solid: merge([part(new THREE.ConeGeometry(0.3, 0.4, 6), '#ffd1e8', 0, 0.15, 0, Math.PI / 2)]), r: 0 };
      case 'tent': { const c = U.pick(['#8a3a6a', '#3a6a8a', '#c88a3a', '#6a3a8a']); return { solid: merge([part(new THREE.ConeGeometry(1.6, 2.2, 4), c, 0, 1.1, 0, 0, Math.PI / 4)]), glow: merge([part(new THREE.BoxGeometry(0.2, 0.2, 0.2), '#ffd08a', 0, 2.3)]), r: 1.2 }; }
      case 'orb': return { solid: null, glow: merge([part(new THREE.IcosahedronGeometry(0.35, 1), B.light, 0, 2.2)]), r: 0 };
      case 'stalag': { const c = U.pick(['#5a5462', '#6a6474', '#4a4450']); return { solid: merge([part(new THREE.ConeGeometry(0.45, 2.2 + U.rand() * 1.6, 6), c, 0, 1.1), part(new THREE.ConeGeometry(0.28, 1.2, 5), E.SP.shade(c, 0.1), 0.5, 0.6, 0.2)]), r: 0.5 }; }
      case 'mush': { const c = U.pick(['#9fe3ff', '#c6b4ff', '#ffd36b', '#7fffc0']); return { solid: merge([part(new THREE.CylinderGeometry(0.06, 0.09, 0.5, 5), '#e8e2d0', 0, 0.25), part(new THREE.CylinderGeometry(0.05, 0.07, 0.35, 5), '#e8e2d0', 0.3, 0.17, 0.15)]), glow: merge([part(new THREE.SphereGeometry(0.26, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), c, 0, 0.48), part(new THREE.SphereGeometry(0.18, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), c, 0.3, 0.33, 0.15)]), r: 0 }; }
      case 'rubble': return { solid: merge([part(new THREE.BoxGeometry(0.6, 0.4, 0.5), '#a8a090', 0, 0.2, 0, 0, 0.4), part(new THREE.BoxGeometry(0.4, 0.3, 0.4), '#989080', 0.5, 0.15, 0.3, 0, 1)]), r: 0.3 };
      default: return { solid: null, r: 0 };
    }
  }

  // ============================================================ texturas utilitárias
  const texCache = {};
  function radialTex(color = '#ffffff') {
    if (texCache['r' + color]) return texCache['r' + color];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, color); g.addColorStop(0.4, color + '88'); g.addColorStop(1, color + '00');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return (texCache['r' + color] = new THREE.CanvasTexture(c));
  }
  E.WX.radial = radialTex;

  function runeCircleTex(color) {
    const k = 'rc' + color;
    if (texCache[k]) return texCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.translate(128, 128); x.strokeStyle = color; x.fillStyle = color; x.shadowColor = color; x.shadowBlur = 10;
    x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 118, 0, 7); x.stroke();
    x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 104, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, 60, 0, 7); x.stroke();
    // estrela de nove pontas
    x.lineWidth = 2.5; x.beginPath();
    for (let i = 0; i <= 9; i++) { const a = (i * 4 / 9) * Math.PI * 2 - Math.PI / 2; const px = Math.cos(a) * 100, py = Math.sin(a) * 100; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    x.font = 'bold 15px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const runes = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒ';
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; x.save(); x.rotate(a); x.fillText(runes[i], 0, -111); x.restore(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return (texCache[k] = t);
  }
  function spriteTex(cv) {
    const t = new THREE.CanvasTexture(cv);
    if (E.SP.onReady) E.SP.onReady(cv, () => { t.needsUpdate = true; });
    // bichos em alta resolução: filtragem suave com mipmaps (sem serrilhado); pixel art dos heróis: nítida
    if (cv._res >= 2) { t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = 4; }
    else { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; }
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const texFromCanvas = new WeakMap();
  const tex = (cv) => { if (!texFromCanvas.has(cv)) texFromCanvas.set(cv, spriteTex(cv)); return texFromCanvas.get(cv); };
  function markerTex(kind) {
    if (texCache['m' + kind]) return texCache['m' + kind];
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    const colors = { quest: ['#ffd36b', '#a86a12'], done: ['#9fe3ff', '#2a6a9a'], danger: ['#ff6b6b', '#7a1a1a'], story: ['#ffe9a8', '#c58a2a'] };
    const [a, b] = colors[kind] || colors.quest;
    x.translate(32, 32); x.rotate(Math.PI / 4);
    x.fillStyle = b; x.fillRect(-17, -17, 34, 34);
    x.fillStyle = a; x.fillRect(-14, -14, 28, 28);
    x.rotate(-Math.PI / 4);
    x.fillStyle = b; x.font = 'bold 30px Georgia'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(kind === 'done' ? '?' : '!', 0, 2);
    return (texCache['m' + kind] = new THREE.CanvasTexture(c));
  }

  // escala visual por tipo de sprite (quadrúpedes são mais baixos que humanoides)
  const SPRITE_VIS = { human: 1.25, robed: 1.25, wolf: 0.62, spider: 0.62, bear: 0.85, owlbear: 0.9, rat: 0.55, crab: 0.55, shark: 0.6, griffon: 0.85, wyvern: 0.95, wisp: 0.55, imp: 0.85, mimic: 0.6, horse: 0.85, harpy: 0.95, gargoyle: 0.95 };
  WG.spriteVis = (def) => SPRITE_VIS[def.sprite] || 1;
  // altura de verdade por espécie (pequeninos e gnomos ~2/3 de um humano, golias bem mais altos)
  WG.speciesScale = (sp) => ((E.H.SPECIES[sp] || {}).look || {}).scale || 1;
  WG.heroHeight = (h) => 2.5 * WG.speciesScale(h.species) * ((h.look && h.look.height) || 1);

  // tufos de grama (3 lâminas)
  function grassGeo(color) {
    const blades = [];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BufferGeometry();
      const a = (i / 3) * Math.PI, w = 0.11, h = 0.3 + i * 0.07, lean = 0.1;
      const pos = [-w * Math.cos(a), 0, -w * Math.sin(a), w * Math.cos(a), 0, w * Math.sin(a), lean * Math.cos(a + 1.5), h, lean * Math.sin(a + 1.5)];
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const c = col(E.SP.shade(color, -0.08)), top = col(E.SP.shade(color, 0.22));
      g.setAttribute('color', new THREE.Float32BufferAttribute([c.r, c.g, c.b, c.r, c.g, c.b, top.r, top.g, top.b], 3));
      blades.push(g);
      // verso da lâmina (mesma luz dos dois lados)
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute([pos[3], pos[4], pos[5], pos[0], pos[1], pos[2], pos[6], pos[7], pos[8]], 3));
      g2.setAttribute('color', new THREE.Float32BufferAttribute([c.r, c.g, c.b, c.r, c.g, c.b, top.r, top.g, top.b], 3));
      blades.push(g2);
    }
    const m = merge(blades);
    // normais para cima: a grama recebe a mesma luz do chão (sem lâminas escuras)
    const n = m.attributes.normal;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    return m;
  }

  // ============================================================ céu e água
  function makeSky(B) {
    const night = !!B.night;
    const m = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: col(B.sky[0]) }, bot: { value: col(B.sky[1]) }, sun: { value: new THREE.Vector3(0.4, 0.5, -0.75).normalize() }, night: { value: night ? 1 : 0 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sun; uniform float night; varying vec3 vD;
        float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164)))*43758.5453); }
        void main(){ float y = clamp(vD.y*0.5+0.5,0.0,1.0); vec3 c = mix(bot, top, smoothstep(0.35,0.95,y));
          float s = max(dot(vD, sun),0.0); c += (1.0-night)*vec3(1.0,0.9,0.7)*pow(s,64.0)*0.9 + (1.0-night)*vec3(1.0,0.8,0.6)*pow(s,6.0)*0.18;
          if(night>0.5){ vec3 q = floor(vD*180.0); float st = step(0.996, h(q)); c += st*vec3(1.0)*smoothstep(0.45,0.8,y); c += vec3(0.6,0.5,1.0)*pow(s,10.0)*0.35; }
          gl_FragColor = vec4(c,1.0); }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(400, 20, 10), m);
    mesh.renderOrder = -10;
    return mesh;
  }
  function makeWater(B, size, level, world) {
    if (E.Water && E.Water.make) return E.Water.make(B, size, level, world);
    const m = new THREE.ShaderMaterial({
      transparent: true, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, c1: { value: col(B.water) }, c2: { value: col(E.SP.shade(B.water, 0.45)) } }]),
      vertexShader: `uniform float t; varying vec2 vW; varying float vY; #include <fog_pars_vertex>
        void main(){ vec3 p = position; vec4 w = modelMatrix*vec4(p,1.0); p.z += sin(w.x*0.35+t*1.3)*0.06 + cos(w.z*0.4+t)*0.06; vW = w.xz; vY = p.z;
          vec4 mvPosition = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mvPosition; #include <fog_vertex> }`.replace(/#include <fog_pars_vertex>/, '\n#include <fog_pars_vertex>\n').replace(/#include <fog_vertex>/, '\n#include <fog_vertex>\n'),
      fragmentShader: `uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec2 vW; varying float vY; \n#include <fog_pars_fragment>\n
        void main(){ float s = sin(vW.x*0.9+t*1.7)*sin(vW.y*0.8-t*1.3); float sp = smoothstep(0.86,1.0,s);
          vec3 c = mix(c1, c2, 0.25+0.25*sin(vW.x*0.15+vW.y*0.12+t*0.5)) + sp*0.35;
          gl_FragColor = vec4(c, 0.86); \n#include <fog_fragment>\n }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size, E.state.settings.quality === 'alto' ? 32 : 16, E.state.settings.quality === 'alto' ? 32 : 16), m);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = level;
    return mesh;
  }

  // ============================================================ renderizador
  WG.init = (cv) => {
    canvas = cv;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !U.isTouch(), powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    WG.applyQuality();
    clock = new THREE.Clock();
    addEventListener('resize', WG.resize);
    WG.resize();
    WG.input.init();
  };
  WG.applyQuality = () => {
    const q = (E.state && E.state.settings.quality) || 'alto';
    const dpr = devicePixelRatio || 1;
    maxPixelRatio = q === 'alto' ? Math.min(U.isTouch() ? 1.25 : 1.5, dpr) : q === 'medio' ? Math.min(1, dpr) : .75;
    // Keep the pixel count bounded even on large 4K/Retina browser windows.
    maxPixelRatio = Math.min(maxPixelRatio, Math.sqrt((q === 'alto' ? 2200000 : 1300000) / Math.max(1, innerWidth * innerHeight)));
    scaleFloor = Math.min(maxPixelRatio, q === 'baixo' ? .5 : .6);
    sampleMs = sampleFrames = goodWindows = 0;
    renderer.setPixelRatio(maxPixelRatio);
    renderer.shadowMap.enabled = q === 'alto';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    document.body.classList.toggle('performance-lite', q !== 'alto' || U.isTouch());
    for (const w of [WG.world, WG.title && WG.title.w]) if (w && E.WX.setTerrainQuality) E.WX.setTerrainQuality(w.terrain.material, q);
    if (E.Dice && E.Dice.applyQuality) E.Dice.applyQuality();
    WG.resize();
  };
  WG.resize = () => {
    if (!renderer) return;
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    for (const cam of [WG.world && WG.world.camera, WG.arena && WG.arena.camera, WG.title && WG.title.camera]) if (cam) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
    if (E.Interior && E.Interior.resize) E.Interior.resize();
  };

  // ============================================================ entrada (teclado, joystick, câmera)
  WG.input = {
    keys: {}, joy: { x: 0, y: 0, active: false }, yawDelta: 0, pitchDelta: 0, zoomDelta: 0, sprint: false,
    init() {
      addEventListener('keydown', (e) => {
        if (e.defaultPrevented) return;
        if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        this.keys[e.code] = true;
        if (mode === 'world' && !e.repeat && (e.code === 'KeyF' || e.code === 'KeyE')) U.emit('world:interact');
        if (e.code === 'Space' && mode === 'world') { if (!e.repeat && WG.world) WG.world.jump('keyboard'); e.preventDefault(); }
      });
      addEventListener('keyup', (e) => { this.keys[e.code] = false; if (e.code === 'Space' && WG.world && WG.world.hero.glideControl === 'keyboard') WG.world.closeGlider(); });
      addEventListener('blur', () => { this.keys = {}; this.sprint = false; if (WG.world) WG.world.closeGlider(); });
      // arrastar para girar a câmera
      let drag = null;
      // segurar o botão direito (ou arrastar com o esquerdo/dedo) gira a câmera; o menu do navegador não abre
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
      canvas.addEventListener('pointerdown', (e) => { if (mode === 'idle') return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx:e.clientX, sy:e.clientY, button: e.button }; });
      addEventListener('pointermove', (e) => { if (!drag || drag.id !== e.pointerId) return; this.yawDelta += (e.clientX - drag.x) * 0.006; this.pitchDelta += (e.clientY - drag.y) * 0.004; drag.x = e.clientX; drag.y = e.clientY; });
      addEventListener('pointerup', (e) => {
        if (!drag || drag.id !== e.pointerId) return;
        const click=Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<6&&drag.button!==2;drag=null;
        if(!click||e.target!==canvas||mode!=='world'||WG.locked||!WG.world||!E.Interact||E.UI.anyOpen())return;
        const w=WG.world,p=w.hero,targets=(w.interactables||[]).filter(it=>['venue','citizen','customer'].includes(it.kind)&&Math.hypot(p.x-it.x,p.z-it.z)<(it.r||2)+.7).map(it=>({it,obj:it.group||(it.citizen&&it.citizen.sp)||it.sprite||(it.customer&&it.customer.sprite)})).filter(x=>x.obj&&x.obj.isObject3D);
        const bounds=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1),w.camera);
        const hits=targets.length?ray.intersectObjects(targets.map(t=>t.obj),true):[];
        for(const hit of hits){let o=hit.object;while(o){const target=targets.find(t=>t.obj===o);if(target){E.Interact.run(target.it);return;}o=o.parent;}}
        // clique no chão: o herói caminha até o ponto (as teclas de movimento cancelam)
        const spot=w.groundRay(ray.ray);if(spot)w.walkTo(spot.x,spot.z);
      });
      canvas.addEventListener('wheel', (e) => { this.zoomDelta += Math.sign(e.deltaY) * 1.2; e.preventDefault(); }, { passive: false });
      // pinça
      const touches = new Map();
      let pinch = 0;
      canvas.addEventListener('touchstart', (e) => { for (const t of e.changedTouches) touches.set(t.identifier, t); if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); } }, { passive: true });
      canvas.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) touches.set(t.identifier, t); if (touches.size === 2) { const [a, b] = [...touches.values()]; const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); this.zoomDelta += (pinch - d) * 0.03; pinch = d; } }, { passive: true });
      canvas.addEventListener('touchend', (e) => { for (const t of e.changedTouches) touches.delete(t.identifier); }, { passive: true });
    },
    move() {
      const k = this.keys;
      let x = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
      let y = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      if (this.joy.active) { x = this.joy.x; y = this.joy.y; }
      const l = Math.hypot(x, y);
      if (l > 1) { x /= l; y /= l; }
      return { x, y, sprint: !!(k.ShiftLeft || k.ShiftRight || this.sprint) };
    },
  };

  WG.STAMINA = 100; // Apenas correr gasta vigor; caminhar, nadar, escalar e planar não gastam.
  // Shared by physics, shop floors, quays and grounding. Rectangles use the
  // same local axes as THREE.Group.rotation.y; ramps rise towards local -z.
  WG.platformHeight = (floor, x, z, inset = 0) => {
    const dx = x - floor.x, dz = z - floor.z;
    if (Number.isFinite(floor.w) && Number.isFinite(floor.d)) {
      const a = floor.rotation || 0, c = Math.cos(a), s = Math.sin(a);
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) > floor.w / 2 - inset || Math.abs(lz) > floor.d / 2 - inset) return null;
      return floor.ramp ? U.lerp(floor.toY, floor.fromY, U.clamp(lz / floor.d + .5, 0, 1)) : floor.y;
    }
    return Math.hypot(dx, dz) <= (floor.r || 0) - inset ? floor.y : null;
  };
  // asa do planador (desenhada uma vez)
  let gliderT = null;
  const gliderTex = () => gliderT || (gliderT = (() => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 112; const x = c.getContext('2d');
    x.strokeStyle = 'rgba(60,50,40,.8)'; x.lineWidth = 1.5;
    for (const px of [30, 80, 128, 176, 226]) { x.beginPath(); x.moveTo(px, 50 - (px === 128 ? 22 : px === 80 || px === 176 ? 14 : 0)); x.lineTo(128, 110); x.stroke(); }
    const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, '#3fb8a8'); g.addColorStop(0.5, '#f4f0e0'); g.addColorStop(1, '#3fb8a8');
    x.fillStyle = g; x.strokeStyle = '#2a2430'; x.lineWidth = 3;
    x.beginPath(); x.moveTo(6, 58); x.quadraticCurveTo(128, -18, 250, 58); x.quadraticCurveTo(128, 26, 6, 58); x.closePath(); x.fill(); x.stroke();
    x.strokeStyle = 'rgba(212,160,32,.9)'; x.lineWidth = 2.5;
    for (const px of [64, 128, 192]) { x.beginPath(); x.moveTo(px, px === 128 ? 22 : 34); x.lineTo(px, px === 128 ? 40 : 46); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })());
  // relevo por bioma: altura das cordilheiras (mtn), dos platôs (mesa), onde começam os platôs (at) e se há rios
  WG.RELIEF = {
    forest: { mtn: 24, mesa: 9, at: 0.2, river: true }, city: { mtn: 12, mesa: 7, at: 0.24, river: true }, ruins: { mtn: 18, mesa: 11, at: 0.18, river: true },
    coast: { mtn: 14, mesa: 9, at: 0.22, river: true }, market: { mtn: 11, mesa: 8, at: 0.2, river: false }, mountain: { mtn: 40, mesa: 13, at: 0.18, river: true },
    astral: { mtn: 26, mesa: 14, at: 0.16, river: false }, garden: { mtn: 16, mesa: 9, at: 0.2, river: true }, abyss: { mtn: 24, mesa: 13, at: 0.17, river: false },
  };

  // ============================================================ MUNDO / REGIÃO
  class World {
    constructor(regionId) {
      const reg = E.WD.reg ? E.WD.reg(regionId) : E.WD.REGIONS[regionId];
      this.id = regionId; this.reg = reg; this.B = E.WD.BIOMES[reg.biome];
      this.cave = !!reg.cave;
      this.noise = makeNoise(reg.seed);
      this.rng = U.seeded(reg.seed * 7 + 3);
      // v4.4: as regiões ao ar livre têm o dobro do raio (4× a área); as grutas continuam do mesmo tamanho
      this.K = this.cave ? 1 : 2;
      this.size = this.cave ? 110 : 180 * this.K; this.bound = this.cave ? 30 : 80 * this.K;
      if (this.cave) { const a = this.rng() * Math.PI * 2; this.pond = { x: Math.cos(a) * 15, z: Math.sin(a) * 15 }; }
      this.scene = new THREE.Scene();
      // a neblina esconde tudo além de ~150 m: o plano distante corta o resto (o céu é desenhado no fundo)
      this.camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, this.cave ? 75 : 165);
      this.cam = { yaw: 0.6, pitch: 0.5, dist: 11 };
      this.colliders = [];
      this.interactables = [];
      this.npcs = []; this.camps = []; this.chests = []; this.herbs = []; this.spots = [];
      this.t = 0;
      this.waterLevel = this.cave ? -1.3 : this.B.waterLevel ? -0.6 : -1.6;
      this.build();
    }
    height(x, z) {
      if (this.reg.metro) return E.Metro.height(this, x, z);
      if (this.cave) return this.caveHeight(x, z);
      const n = this.noise, B = this.B, dc = Math.hypot(x, z);
      // The central plateau is exactly flat; all later lake/edge/river terms are zero here.
      if (dc <= 10) return .4;
      let amp = { mountain: 9, coast: 4, city: 2.5, market: 2.5, garden: 4, astral: 6, abyss: 6, ruins: 4.5, forest: 5 }[this.reg.biome] || 5;
      let h = n.fbm(x * 0.018, z * 0.018, 5) * amp * 2 + n.fbm(x * 0.06 + 10, z * 0.06, 2) * 0.8;
      // v4.5: relevo de verdade nos mapas grandes — cordilheiras, platôs com penhascos e cânions de rio
      const RL = this.K > 1 ? WG.RELIEF[this.reg.biome] || WG.RELIEF.forest : null;
      if (RL) {
        const out = U.clamp((dc - 26) / 34, 0, 1);
        if (out > 0) {
          const mask = U.clamp((n.fbm(x * 0.0045 + 20, z * 0.0045 - 11, 2) + 0.08) * 3.2, 0, 1);
          let r = 1 - Math.abs(n.fbm(x * 0.0085 + 3, z * 0.0085 - 8, 4)); r = r * r * r;
          const p = n.fbm(x * 0.0105 - 40, z * 0.0105 + 17, 3), t = U.clamp((p - RL.at) / 0.035, 0, 1);
          h += (r * mask * RL.mtn + t * t * (3 - 2 * t) * RL.mesa) * out;
        }
      }
      // planalto central (vila/início)
      const flat = U.clamp((dc - 10) / 14, 0, 1);
      h = U.lerp(0.4, h, flat);
      // vales de água (lagos)
      const lake = n.fbm(x * 0.012 + 50, z * 0.012 - 30, 3);
      if (lake < -0.18 && dc > 22) h -= (-0.18 - lake) * 26;
      // rios serpenteando pelo mapa (abrem cânions quando cruzam montanhas)
      if (RL && RL.river && dc > 34) {
        const rv = Math.abs(n.fbm(x * 0.0062 + 70, z * 0.0062 - 12, 3));
        if (rv < 0.042) { const k = 1 - rv / 0.042, s = U.clamp(k * k * (3 - 2 * k) * 1.8, 0, 1) * U.clamp((dc - 34) / 18, 0, 1); h = U.lerp(h, Math.min(h, this.waterLevel - 1.7), s); }
      }
      if (this.reg.biome === 'coast') { const sea = (x + z * 0.3 - 30 * this.K) / 30; if (sea > 0) h -= sea * 7; }
      // bordas montanhosas (nos mapas grandes, uma cordilheira irregular em vez de um paredão)
      if (this.K > 1 && dc > 58 * this.K) {
        // Conservative lower bound: 70*K - 9*K*(.5+.25+.125)*sqrt(2) > 58*K.
        const a = Math.atan2(z, x), er = 70 * this.K + n.fbm(Math.cos(a) * 1.6 + 20, Math.sin(a) * 1.6 - 7, 3) * 9 * this.K;
        const edge = U.clamp((dc - er) / 22, 0, 1);
        h += edge * edge * (20 + n.fbm(x * 0.035 + 40, z * 0.035, 3) * 12) + edge * Math.abs(n.fbm(x * 0.08, z * 0.08 + 9, 2)) * 6;
      } else if (this.K === 1) { const edge = U.clamp((dc - 70) / 12, 0, 1); h += edge * edge * 16; }
      return h;
    }
    // gruta: chão irregular, um lago escuro e paredes que fecham a câmara
    caveHeight(x, z) {
      const n = this.noise, d = Math.hypot(x, z);
      let h = n.fbm(x * 0.06, z * 0.06, 3) * 0.9 + n.fbm(x * 0.15 + 3, z * 0.15, 2) * 0.25;
      h = U.lerp(0.25, h, U.clamp((d - 4) / 7, 0, 1));
      const pd = Math.hypot(x - this.pond.x, z - this.pond.z);
      if (pd < 7.5) h -= Math.pow(1 - pd / 7.5, 1.6) * 3.4;
      const a = Math.atan2(z, x), R = 29 + n.fbm(Math.cos(a) * 2 + 5, Math.sin(a) * 2 - 3, 2) * 7;
      const e = U.clamp((d - R) / 2.6, 0, 1);
      return h + e * e * 22 + e * n.fbm(x * 0.2, z * 0.2, 2) * 3;
    }
    slope(x, z) { const e = 0.6; return Math.hypot(this.height(x + e, z) - this.height(x - e, z), this.height(x, z + e) - this.height(x, z - e)) / (2 * e); }

    build() {
      const B = this.B, S = this.size, rng = this.rng, sc = this.scene;
      const q = E.state.settings.quality;
      sc.fog = this.cave ? new THREE.Fog(B.fog, 7, 46) : new THREE.Fog(B.fog, 35, 150);
      sc.background = col(this.cave ? B.fog : B.sky[1]);
      if (!this.cave) sc.add(makeSky(B));
      // luzes
      const hemi = this.cave ? new THREE.HemisphereLight(col(E.SP.mix('#a898c0', this.reg.tint, 0.4)), col('#1a1620'), 0.85) : new THREE.HemisphereLight(col(B.night ? E.SP.shade(B.light, -0.2) : B.sky[0]), col(E.SP.shade(B.ground[0], -0.4)), B.night ? 1.15 : 1.0);
      sc.add(hemi);
      const sun = new THREE.DirectionalLight(col(B.light), this.cave ? 0.5 : B.night ? 1.25 : 2.0);
      sun.position.set(30, 50, -40);
      sun.castShadow = q === 'alto' && !this.cave;
      sun.shadow.mapSize.set(U.isTouch() ? 768 : 1024, U.isTouch() ? 768 : 1024);
      const sh = sun.shadow.camera; sh.left = -28; sh.right = 28; sh.top = 28; sh.bottom = -28; sh.near = 1; sh.far = 140;
      sun.shadow.bias = -0.0008;
      sc.add(sun); sc.add(sun.target);
      this.sun = sun;
      // pontos de interesse (antes do terreno para pintar estradas)
      this.layout();
      this.buildBridges();
      // terreno
      const seg = Math.round((q === 'baixo' ? 64 : q === 'medio' ? 90 : 140) * (this.K > 1 ? 1.3 : 1));
      const geo = new THREE.PlaneGeometry(S, S, seg, seg);
      geo.rotateX(-Math.PI / 2);
      const P = geo.attributes.position;
      for (let i = 0; i < P.count; i++) P.setY(i, this.height(P.getX(i), P.getZ(i)));
      geo.computeVertexNormals();
      const N = geo.attributes.normal;
      const cols = new Float32Array(P.count * 3);
      const c0 = col(B.ground[0]), c1 = col(B.ground[1]), c2 = col(B.ground[2]), ch = col(B.high), sand = col(this.reg.biome === 'abyss' ? '#3a3048' : '#e2d2a4'), road = col(this.reg.biome === 'city' ? '#c8c0b0' : this.reg.biome === 'abyss' ? '#5a4a68' : '#d2b688'), snow = col('#f4f8fc');
      const tmp = new THREE.Color();
      for (let i = 0; i < P.count; i++) {
        const cx = P.getX(i), cz = P.getZ(i), cy = P.getY(i), ny = N.getY(i);
        const v = this.noise.fbm(cx * 0.045, cz * 0.045, 3) * 0.5 + 0.5;
        tmp.copy(c0).lerp(c1, U.clamp(v * 1.5 - 0.1, 0, 1)).lerp(c2, U.clamp((v - 0.58) * 2.6, 0, 1));
        if (cy > 7) tmp.lerp(ch, U.clamp((cy - 7) / 5, 0, 1));
        if (ny < 0.8) tmp.lerp(ch, U.clamp((0.8 - ny) * 3, 0, 0.7));
        if (B.snow && cy > 9) tmp.lerp(snow, U.clamp((cy - 9) / 3, 0, 1));
        else if (this.K > 1 && !B.night && this.reg.biome !== 'market' && cy > 23) tmp.lerp(snow, U.clamp((cy - 23) / 4, 0, 0.9)); // neve nos picos mais altos
        if (cy < this.waterLevel + 0.6) tmp.lerp(sand, U.clamp((this.waterLevel + 0.6 - cy) * 1.6, 0, 0.9));
        if (this.cave) tmp.lerp(col(this.reg.tint), 0.22 + U.clamp(cy / 14, 0, 0.3));
        const rd = this.roadDist(cx, cz);
        if (rd < 2.2) tmp.lerp(road, U.clamp((2.2 - rd) / 1.1, 0, 0.9));
        cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const terrain = new THREE.Mesh(geo, E.WX.terrainMaterial(this.reg.biome, B, this.plaza, this.waterLevel));
      terrain.receiveShadow = true;
      sc.add(terrain);
      this.terrain = terrain;
      this.terrainGrid = { size: S, segments: seg, stride: seg + 1, positions: P.array };
      this.water = makeWater(B, S * 2.2, this.waterLevel, this);
      sc.add(this.water);
      this.scatterProps();
      if (!this.cave) this.scatterGrass();
      this.buildPOIs();
      if (this.cave) E.WX.caveInterior(this);
      else if (this.reg.metro) E.Metro.build(this);
      else { E.WX.plaza(this); E.WX.landmark(this, this.landmarkPos); E.WX.outposts(this, this.outpostPos); }
      if (!this.cave && E.M.LAIR[this.id]) { E.WX.lairBase(this, this.lairPos); this.refreshLair(); }
      if (!this.reg.metro && !this.cave) E.WX.tradePost(this);
      E.WX.fishSpots(this, this.cave ? 2 : this.reg.metro ? 3 : 7);
      // minério só nas grutas (com picareta)
      if (this.cave) E.WX.oreNodes(this, 13, this.reg.ores);
      if (!this.cave) E.WX.wildlife(this);
      // novidades de cada região: entrada da gruta, Lumes, Corrida das Lanternas e Domínio
      if (!this.cave && !this.reg.metro) E.WX.regionExtras(this);
      // v4.4: monumentos antigos, altar de invocação, estátuas espalhadas e eventos
      if (!this.cave && E.WN3) E.WN3.build(this);
      // v4.5: picos, correntes de vento, cachoeiras, Lumes-Guia e Santuários das Tochas
      if (!this.cave && E.EX3) E.EX3.build(this);
      if (!this.cave && E.Villages && E.Villages.build) E.Villages.build(this);
      if (!this.cave && E.Shopfronts && E.Shopfronts.batchTown) E.Shopfronts.batchTown(this);
      this.buildColliderGrid();
      this.buildHero();
      this.buildParticles();
      this.makeMinimap();
      if (E.EX3 && E.EX3.groundWorld) E.EX3.groundWorld(this);
      if (!this.cave && E.Maritime) E.Maritime.build(this);
      if (!this.cave && E.Crowds) E.Crowds.build(this);
      if (!this.cave && E.StallLife) E.StallLife.build(this);
      if (!this.cave && E.CasinoLife) E.CasinoLife.build(this);
      this.buildColliderGrid();
      this.hero.y = this.groundAt(this.hero.x, this.hero.z);
    }

    // posições das coisas importantes
    layout() {
      const rng = this.rng;
      const findSpot = (minR, maxR, tries = 80) => {
        for (let i = 0; i < tries; i++) {
          const a = rng() * Math.PI * 2, r = minR + rng() * (maxR - minR);
          const x = Math.cos(a) * r, z = Math.sin(a) * r;
          if (this.height(x, z) > this.waterLevel + 0.4 && this.slope(x, z) < 0.7) return { x, z };
        }
        return { x: minR, z: 0 };
      };
      this.findSpot = findSpot;
      if (this.cave) {
        this.spawn = { x: 0, z: 3 }; this.waypoint = { x: 0, z: -1.5 }; this.npcPos = [];
        this.campPos = [findSpot(11, 24), findSpot(11, 24), findSpot(14, 25)];
        this.chestPos = [findSpot(16, 26), findSpot(16, 26)];
        this.herbPos = [];
        this.storyPos = findSpot(10, 20); this.questPos = findSpot(10, 20);
        this.plaza = 3; this.landmarkPos = { x: 999, z: 999 }; this.outpostPos = []; this.lairPos = { x: 999, z: 999 };
        this.roads = [];
        return;
      }
      this.spawn = { x: 0, z: 6 };
      this.waypoint = { x: -4, z: -2 };
      this.npcPos = [{ x: 6, z: -4 }, { x: -8, z: 7 }, { x: 9, z: 8 }];
      const metro = !!this.reg.metro, K = this.K;
      const far = (q, list, d) => list.every((o) => o && Math.hypot(o.x - q.x, o.z - q.z) > d);
      // na metrópole, o campo fica fora da muralha e ao norte (o sul é mar)
      const outside = (minR, maxR) => { for (let i = 0; i < 120; i++) { const q = findSpot(minR, maxR); if (!metro || (q.z < 26 && Math.hypot(q.x, q.z) > 72)) return q; } return { x: 0, z: -(minR + maxR) / 2 }; };
      this.campPos = [];
      if (!metro) for (let i = 0; i < 7 * K; i++) { let q = null; for (let k = 0; k < 30 && !q; k++) { const c = findSpot(24, 66 * K); if (far(c, this.campPos, 16)) q = c; } this.campPos.push(q || findSpot(24, 66 * K)); }
      // baús: os mais valiosos ficam mais longe do centro
      this.chestPos = [];
      if (metro) this.chestPos.push({ x: -46, z: 30 }, { x: 50, z: -30 }, { x: -6, z: -54 });
      for (let i = 0; i < (metro ? 5 : 7 * K); i++) this.chestPos.push(metro ? outside(80, 140) : findSpot(14, 72 * K));
      if (!metro) this.chestPos.sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z));
      this.herbPos = [];
      for (let i = 0; i < (metro ? 4 : 12 * K); i++) this.herbPos.push(metro ? [{ x: 12, z: 9 }, { x: -11, z: -11 }, { x: 46, z: -10 }, { x: -48, z: 12 }][i] : findSpot(i < 3 ? 14 : 12, i < 3 ? 30 : 62 * K));
      this.storyPos = findSpot(30, 70);
      this.questPos = findSpot(20, 60);
      this.plaza = this.reg.metro ? 60 : 11;
      this.landmarkPos = null;
      for (let i = 0; i < 60 && !this.landmarkPos; i++) { const q = findSpot(26, 60); if (far(q, [this.storyPos, this.questPos, ...this.campPos, ...this.chestPos], 13)) this.landmarkPos = q; }
      if (!this.landmarkPos) this.landmarkPos = findSpot(30, 40);
      this.outpostPos = [];
      for (let i = 0; i < 80 && this.outpostPos.length < 4 * K; i++) { const q = findSpot(20, 68 * K); if (far(q, [this.storyPos, this.questPos, this.landmarkPos, ...this.campPos, ...this.chestPos, ...this.outpostPos], 10)) this.outpostPos.push(q); }
      // covil do chefe regional: longe do centro e dos outros pontos
      this.lairPos = null;
      for (let i = 0; i < 120 && !this.lairPos; i++) { const q = findSpot(48 * K, 70 * K); if (far(q, [this.storyPos, this.questPos, this.landmarkPos, ...this.campPos, ...this.chestPos, ...this.outpostPos], 12) && this.slope(q.x, q.z) < 0.4) this.lairPos = q; }
      if (!this.lairPos) this.lairPos = findSpot(50 * K, 64 * K);
      // v4.4: estátuas de teleporte espalhadas, monumentos antigos e o altar de invocação
      const used = () => [this.storyPos, this.questPos, this.landmarkPos, this.lairPos, ...this.campPos, ...this.chestPos, ...this.outpostPos, ...(this.extra ? [this.extra.cave, this.extra.altar, this.extra.domain, this.extra.summon, ...(this.extra.statues || []), ...(this.extra.monuments || [])].filter(Boolean) : [])];
      const pick = (a, b, d, ok = () => true) => { for (let i = 0; i < 120; i++) { const q = metro ? outside(Math.max(a, 76), b) : findSpot(a, b); if (far(q, used(), d) && this.slope(q.x, q.z) < 0.5 && ok(q)) return q; } return metro ? outside(Math.max(a, 76), b) : findSpot(a, b); };
      this.extra = {};
      // uma estátua em cada quadrante (ângulos espalhados), longe do centro
      this.extra.statues = [];
      for (let k = 0; k < (metro ? 2 : 4); k++) {
        const a0 = metro ? Math.PI * (1.15 + k * 0.7) : k * Math.PI / 2 + 0.4;
        this.extra.statues.push(pick(70, 128, 22, (q) => { const da = Math.abs(((Math.atan2(q.z, q.x) - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI); return da < 0.65; }));
      }
      this.extra.monuments = [];
      for (let k = 0; k < 3; k++) this.extra.monuments.push(pick(metro ? 80 : 34, 140, 26));
      this.extra.summon = pick(metro ? 90 : 80, 136, 24);
      if (metro) { this.roads = [[{ x: 0, z: -63 }, this.extra.statues[0]], [{ x: 0, z: -63 }, this.extra.statues[1]], [{ x: -63, z: 0 }, this.extra.summon]]; this.extraNpcPos = []; return; }
      // v4: gruta, altar da corrida, portal do domínio, Lumes e mais NPCs
      this.extra.cave = this.reg.caveId ? pick(26, 46 * K, 12) : null;
      this.extra.altar = pick(22, 40 * 1.5, 11);
      this.extra.domain = pick(30, 60 * K, 12);
      this.extra.lumes = [];
      for (let i = 0; i < 10; i++) { const q = findSpot(14, 70 * K); q.high = i % 3 === 2; this.extra.lumes.push(q); }
      this.extra.rings = [];
      for (let i = 0; i < 6; i++) { const a = rng() * Math.PI * 2, r = 6 + i * 3.2; const base = this.extra.altar; let q = { x: base.x + Math.cos(a) * r, z: base.z + Math.sin(a) * r }; if (this.height(q.x, q.z) < this.waterLevel + 0.4 || Math.hypot(q.x, q.z) > this.bound - 4) q = findSpot(14, 30); this.extra.rings.push(q); }
      this.extraNpcPos = [];
      for (let i = 0; i < 8; i++) { const a = 0.7 + i * 0.8 + rng() * 0.3, r = 13 + (i % 3) * 3.5; const q = { x: Math.cos(a) * r, z: Math.sin(a) * r }; this.extraNpcPos.push(this.height(q.x, q.z) > this.waterLevel + 0.4 ? q : findSpot(13, 22)); }
      // estradas: do centro para as estátuas (e delas para os pontos mais distantes), a história e o covil
      const O = { x: 0, z: 0 }, S4 = this.extra.statues;
      const nearest = (p) => S4.reduce((b, s) => (Math.hypot(s.x - p.x, s.z - p.z) < Math.hypot(b.x - p.x, b.z - p.z) ? s : b), O);
      this.roads = [[O, this.storyPos], [O, this.campPos[0]], [O, this.questPos], ...S4.map((s) => [O, s]), [nearest(this.lairPos), this.lairPos], [nearest(this.extra.summon), this.extra.summon], ...this.extra.monuments.map((m) => [nearest(m), m])];
    }
    roadDist(x, z) {
      let best = 99;
      for (const [a, b] of this.roads) {
        const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz;
        let t = ((x - a.x) * dx + (z - a.z) * dz) / l2; t = U.clamp(t, 0, 1);
        // curva suave
        const wob = Math.sin(t * Math.PI * 2) * 3;
        const px = a.x + dx * t + (-dz / Math.sqrt(l2)) * wob, pz = a.z + dz * t + (dx / Math.sqrt(l2)) * wob;
        best = Math.min(best, Math.hypot(x - px, z - pz));
      }
      return best;
    }

    scatterProps() {
      const B = this.B, rng = this.rng, q = E.state.settings.quality;
      const K = this.K, total = Math.round((q === 'baixo' ? 380 : q === 'medio' ? 650 : 950) * B.density * (K > 1 ? 3 : 1));
      const groups = {};
      const avoid = [this.spawn, this.waypoint, ...this.npcPos, ...this.campPos, ...this.chestPos, this.storyPos, this.questPos, ...this.outpostPos];
      const ex = this.extra || {}, bigAvoid = [...(ex.statues || []), ...(ex.monuments || []), ex.summon].filter(Boolean);
      // construções assentam no relevo: meia-largura, meia-profundidade e desnível máximo sob a base
      // (medido na malha visível do terreno; o assentamento final soma terrainAt − height no centro)
      const FOOT = { house: [1.6, 1.4, 0.7], tent: [1.1, 1.1, 0.45], crate: [0.9, 0.5, 0.4], pillar: [0.55, 0.55, 0.6], arch: [2, 0.4, 0.6] }, built = [];
      const settle = (type, it) => {
        const f = FOOT[type]; if (!f) return true;
        const ca = Math.cos(it.r), sa = Math.sin(it.r), hs = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 0]].map(([a, b]) => this.terrainAt(it.x + (a * f[0] * ca + b * f[1] * sa) * it.s, it.z + (-a * f[0] * sa + b * f[1] * ca) * it.s));
        const lo = Math.min(...hs), hi = Math.max(...hs), home = type === 'house' || type === 'tent';
        if (hi - lo > f[2]) return false;
        if (home && (built.some((p) => Math.hypot(p.x - it.x, p.z - it.z) < 6.5) || this.roadDist(it.x, it.z) < 3.6)) return false;
        // a casa fica no ponto mais alto, sobre o embasamento; tendas, caixotes e ruínas, no mais baixo (nunca no ar)
        it.y = type === 'house' ? hi : lo; it.h += it.y - hs[4]; if (type === 'house') it.plinth = 0.92;
        if (home) built.push(it);
        return true;
      };
      for (let i = 0; i < total; i++) {
        const x = (rng() - 0.5) * 168 * K, z = (rng() - 0.5) * 168 * K;
        if (bigAvoid.some((p) => Math.hypot(p.x - x, p.z - z) < 9)) continue;
        const h = this.height(x, z);
        if (h < this.waterLevel + 0.3) continue;
        if (this.slope(x, z) > 0.9) continue;
        if (this.reg.metro && Math.hypot(x, z) < 66) continue;
        if (this.cave && (Math.hypot(x, z) > this.bound - 1 || Math.hypot(x, z) < 6)) continue;
        if (Math.hypot(x, z) < 9 && !['house', 'lamp', 'tent', 'crate', 'lantern'].includes(B.props[0])) continue;
        if (this.roadDist(x, z) < 2.4) continue;
        if (avoid.some((p) => Math.hypot(p.x - x, p.z - z) < 4.5)) continue;
        if (Math.hypot(x, z) < this.plaza + 2 || Math.hypot(x - this.landmarkPos.x, z - this.landmarkPos.z) < 11) continue;
        // agrupamentos naturais
        const cluster = this.noise.fbm(x * 0.03 + 7, z * 0.03 - 4, 2);
        if (cluster < -0.12 && rng() < 0.7) continue;
        let type = B.props[Math.floor(rng() * B.props.length)];
        if (['house', 'tent'].includes(type) && Math.hypot(x, z) > 45 && rng() < 0.8) type = B.props.find((p) => !['house', 'tent', 'lamp', 'crate'].includes(p)) || 'bush';
        // casas e tendas variam pouco de tamanho (portas e janelas mantêm a escala dos personagens)
        const it = { x, z, h, s: type === 'house' ? 0.95 + rng() * 0.12 : type === 'tent' ? 0.9 + rng() * 0.2 : 0.75 + rng() * 0.6, r: rng() * Math.PI * 2 };
        if (!settle(type, it)) continue;
        (groups[type] = groups[type] || []).push(it);
      }
      // vila: casas/lanternas ao redor do centro
      const deco = this.cave ? [] : this.reg.biome === 'city' || this.reg.biome === 'market' ? ['house', 'house', 'lamp', 'house', 'tent', 'lamp'] : ['lantern', 'lantern', 'lantern', 'crate'];
      deco.forEach((type, i) => {
        const a = (i / deco.length) * Math.PI * 2 + 0.4, r = this.plaza + 4 + (i % 2) * 3;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (this.roadDist(x, z) < 2) return;
        const it = { x, z, h: this.height(x, z), s: 1, r: -a + Math.PI / 2 };
        if (settle(type, it)) (groups[type] = groups[type] || []).push(it);
      });
      this.propGroups = groups; // usado pelo minimapa
      const dummy = new THREE.Object3D();
      for (const [type, list] of Object.entries(groups)) {
        // várias variantes de cor por tipo
        const variants = ['tree', 'house', 'tent', 'flower'].includes(type) ? 3 : 1;
        for (let v = 0; v < variants; v++) {
          const items = list.filter((_, i) => i % variants === v);
          if (!items.length) continue;
          const def = propDef(type, B);
          const make = (geo, glow) => {
            if (!geo) return;
            const mat = glow ? new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }) : new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 });
            // em blocos: a câmera descarta os blocos que não vê (o mapa ficou grande)
            for (const part of this.chunks(items)) {
              const im = new THREE.InstancedMesh(geo, mat, part.length);
              part.forEach((it, i) => { dummy.position.set(it.x, it.h - 0.05, it.z); dummy.rotation.set(0, it.r, 0); dummy.scale.setScalar(it.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
              im.computeBoundingSphere();
              im.castShadow = !glow && E.state.settings.quality === 'alto';
              im.receiveShadow = !glow;
              this.scene.add(im);
            }
          };
          make(def.solid, false);
          make(def.glow, true);
          if (def.r) items.forEach((it) => this.colliders.push({ x: it.x, z: it.z, r: def.r * it.s }));
        }
      }
      this.glowSprites = [];
      for (const it of groups.lantern || []) this.addGlow(it.x + 0.42 * Math.cos(it.r), it.h + 1.35, it.z - 0.42 * Math.sin(it.r), '#9fe3ff', 1.6);
      for (const it of groups.lamp || []) this.addGlow(it.x, it.h + 2.3, it.z, '#ffd08a', 2);
      for (const it of (groups.crystal || []).slice(0, 40)) this.addGlow(it.x, it.h + 0.9, it.z, this.B.light, 2.2);
      this.buildColliderGrid();
    }
    scatterGrass() {
      const B = this.B, q = E.state.settings.quality;
      if (['astral', 'abyss', 'market'].includes(this.reg.biome)) return;
      const n = Math.round((q === 'baixo' ? 900 : q === 'medio' ? 2200 : 4200) * (this.reg.biome === 'mountain' || this.reg.biome === 'coast' ? 0.5 : 1) * (this.K > 1 ? 2.4 : 1));
      const geo = grassGeo(E.SP.mix(B.ground[1], B.ground[2], 0.5)), mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
      const dummy = new THREE.Object3D(), rng = U.seeded(this.reg.seed * 3 + 1), items = [];
      for (let i = 0; i < n * 3 && items.length < n; i++) {
        const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 76 * this.K;
        const x = Math.cos(a) * r, z = Math.sin(a) * r, h = this.height(x, z);
        if (h < this.waterLevel + 0.4 || h > 9 || this.slope(x, z) > 0.6 || this.roadDist(x, z) < 1.5 || r < this.plaza + 1) continue;
        items.push({ x, z, h, r: rng() * 6.28, s: 0.7 + rng() * 0.8 });
      }
      for (const part of this.chunks(items, 72)) {
        const im = new THREE.InstancedMesh(geo, mat, part.length);
        part.forEach((it, i) => { dummy.position.set(it.x, it.h - 0.02, it.z); dummy.rotation.set(0, it.r, 0); dummy.scale.setScalar(it.s); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
        im.computeBoundingSphere();
        im.receiveShadow = true;
        this.scene.add(im);
      }
    }
    // divide objetos espalhados em blocos quadrados (para o descarte por câmera funcionar)
    chunks(items, C = 120) {
      if (this.K === 1 || items.length < 40) return [items];
      const m = new Map();
      for (const it of items) { const k = Math.floor(it.x / C) + ',' + Math.floor(it.z / C); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }
      return [...m.values()];
    }
    addGlow(x, y, z, color, s) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
      sp.position.set(x, y, z); sp.scale.set(s, s, 1);
      this.scene.add(sp);
      return sp;
    }
    buildColliderGrid() {
      this.grid = new Map();
      for (const c of this.colliders) {
        const k = Math.floor(c.x / 6) + ',' + Math.floor(c.z / 6);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k).push(c);
      }
    }
    nearColliders(x, z) {
      const out = [], gx = Math.floor(x / 6), gz = Math.floor(z / 6);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = this.grid.get(gx + i + ',' + (gz + j)); if (l) out.push(...l); }
      return out;
    }

    // ------------------------------------------------------------ pontos de interesse
    buildPOIs() {
      const st = E.state, reg = this.reg, sc = this.scene;
      // estátua de teleporte
      const wp = this.waypoint, wh = this.height(wp.x, wp.z);
      if (this.cave) { E.WX.caveExit(this, wp); }
      const stat = new THREE.Group();
      if (this.cave) stat.visible = false;
      const stone = new THREE.MeshStandardMaterial({ color: '#c8c0b0', flatShading: true, roughness: 0.7 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 0.5, 8), stone); base.position.y = 0.25;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 3.4, 6), stone); pil.position.y = 2.2;
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), new THREE.MeshBasicMaterial({ color: '#7fe8ff', toneMapped: false }));
      crystal.position.y = 4.6; crystal.scale.y = 1.6;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: '#ffe9a8', toneMapped: false }));
      ring.position.y = 4.6; ring.rotation.x = Math.PI / 2;
      [base, pil].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
      stat.add(base, pil, crystal, ring);
      stat.position.set(wp.x, wh, wp.z);
      sc.add(stat);
      this.addGlow(wp.x, wh + 4.6, wp.z, '#7fe8ff', 4);
      this.waypointObj = { crystal, ring };
      this.colliders.push({ x: wp.x, z: wp.z, r: 1.5 });
      if (!this.cave) this.interactables.push({ kind: 'waypoint', x: wp.x, z: wp.z, r: 3, label: 'Estátua de Teleporte', icon: '✦' });
      else this.waypointObj = null;
      // NPCs
      reg.npcs.forEach((nid, i) => {
        const npc = E.WD.NPCS[nid]; if (!npc) return;
        let p = this.npcPos[i] || (npc.pos ? npc.pos : (npc.nearCave && this.extra && this.extra.cave ? { x: this.extra.cave.x + 3.2, z: this.extra.cave.z + 2.4 } : (this.extraNpcPos || [])[i - 3])) || this.findSpot(12, 20);
        if (npc.pos) p = npc.pos;
        const h = this.height(p.x, p.z);
        const cv = E.SP.npc(npc);
        const nh = npc.dragon ? 6.4 : npc.beast ? 2.6 : 2.5; // o dragão ancião é enorme
        const sp = this.makeSprite(cv, nh);
        sp.position.set(p.x, h, p.z);
        sc.add(sp);
        const mk = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex('quest'), transparent: true, depthWrite: false }));
        mk.scale.set(0.7, 0.7, 1); mk.position.set(p.x, h + nh + 0.6, p.z);
        sc.add(mk);
        this.addShadow(p.x, h, p.z, npc.dragon ? 2.6 : 0.6);
        const obj = { id: nid, npc, sprite: sp, marker: mk, x: p.x, z: p.z, y: h, nh };
        this.npcs.push(obj);
        this.colliders.push({ x: p.x, z: p.z, r: npc.dragon ? 2.4 : 0.6 });
        this.interactables.push({ kind: 'npc', id: nid, x: p.x, z: p.z, r: npc.dragon ? 5 : 2.6, label: `Conversar com ${npc.name}`, icon: '💬' });
      });
      this.refreshNpcMarkers();
      // baús
      // os baús vêm ordenados do centro para fora: quanto mais longe, mais valioso
      const opened = (st.world.opened[this.id] || []), nC = this.chestPos.length;
      const tierOf = (i) => { const f = nC > 1 ? i / (nC - 1) : 0; return f < 0.38 ? 'comum' : f < 0.66 ? 'requintado' : f < 0.88 ? 'precioso' : 'luxuoso'; };
      this.chestPos.forEach((p, i) => this.addChest(i, p, tierOf(i), opened.includes(i)));
      // ervas
      this.herbPos.forEach((p, i) => this.addHerb(i, p));
      // acampamentos inimigos
      this.campPos.forEach((p, i) => this.addCamp(i, p));
      if (this.cave) this.addDragonNest();
      // objetivo da história / missões de investigação
      this.refreshObjectives();
    }
    addShadow(x, y, z, r) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.04, z);
      this.scene.add(m);
      return m;
    }
    tex(cv) { return tex(cv); }
    makeSprite(cv, height) {
      const mat = new THREE.SpriteMaterial({ map: tex(cv), transparent: true, alphaTest: 0.5 });
      const sp = new THREE.Sprite(mat);
      sp.center.set(0.5, 0.02);
      sp.scale.set(height * cv.width / cv.height, height, 1);
      sp.userData.h = height;
      return sp;
    }
    addChest(i, p, tier, opened) {
      const g = E.WX.chest(tier);
      // O topo do terreno sob toda a base evita que um canto entre na encosta.
      const h = Math.max(...[[0, 0], [.95, .75], [-.95, .75], [.95, -.75], [-.95, -.75]].map(([dx, dz]) => this.groundAt(p.x + dx, p.z + dz)));
      g.position.set(p.x, h - 0.03, p.z); g.scale.setScalar(1.35); g.rotation.y = Math.atan2(-p.x, -p.z) + (this.rng() - 0.5);
      this.scene.add(g);
      this.addShadow(p.x, h, p.z, 1.05);
      this.colliders.push({ x: p.x, z: p.z, r: 0.85 });
      if (opened) { g.userData.lid.rotation.x = -1.9; g.userData.loot.visible = false; return; }
      const glow = this.addGlow(p.x, h + 0.7, p.z, g.userData.glowColor, tier === 'luxuoso' ? 3.2 : 2.2);
      const obj = { i, tier, group: g, glow, x: p.x, z: p.z };
      this.chests.push(obj);
      this.interactables.push({ kind: 'chest', id: i, tier, x: p.x, z: p.z, r: 2.4, label: `Abrir baú ${tier}`, icon: '🎁', obj });
      // Late event rewards also get a connected base, not just the original region chests.
      if (this.heightField && E.EX3 && E.EX3.groundWorld) E.EX3.groundWorld(this);
    }
    addHerb(i, p) {
      const gathered = (E.state.world.gathered[this.id] || {})[i];
      if (gathered && Date.now() - gathered < 10 * 60 * 1000) return;
      const h = this.groundAt(p.x, p.z);
      const g = E.WX.herb(this.reg.herb, false);
      g.position.set(p.x, h, p.z);
      g.rotation.y = this.rng() * 6;
      this.scene.add(g);
      const glow = null;
      const obj = { i, group: g, glow, x: p.x, z: p.z };
      this.herbs.push(obj);
      this.interactables.push({ kind: 'herb', id: i, x: p.x, z: p.z, r: 2, label: `Colher ${this.reg.herb}`, icon: '🌿', obj });
    }
    // Ninho de dragão no fundo da gruta: um dragão da região (filhote; jovem a partir do nível 7, onde houver).
    addDragonNest() {
      const nests = E.M.DRAGON_NESTS && E.M.DRAGON_NESTS[E.WD.home(this.id)];
      if (!nests || !nests.length) return null;
      const lvl = (E.Store.hero() || { level: 1 }).level, young = nests.filter((k) => /_jovem$/.test(k)), cubs = nests.filter((k) => !/_jovem$/.test(k));
      const pool = lvl >= 7 && young.length ? young : cubs.length ? cubs : nests, key = pool[Math.floor(this.rng() * pool.length)];
      const camp = this.addCamp('nest', this.findSpot(18, 27), { enc: { monsters: [key], xp: E.R.CR_XP[E.M.MONSTERS[key].cr], budget: 0, danger: true }, diff: 'alta' });
      if (camp) camp.nest = true;
      return camp;
    }
    addCamp(i, p, forced) {
      // no cooperativo, o visitante vê os acampamentos do mundo do anfitrião (nível e Nível de Mundo dele)
      if (!forced && (E.CoopWorld ? E.CoopWorld.campCleared(this.id, i) : false)) return;
      const baseLvl = E.CoopWorld ? E.CoopWorld.campLevel() : (E.Store.hero() || { level: 1 }).level;
      const lvl = E.Adv ? E.Adv.encounterLevel(baseLvl) : baseLvl;
      const diff = forced ? forced.diff : i === 0 ? 'baixa' : i % 3 === 2 ? 'alta' : i % 2 ? 'moderada' : 'baixa';
      const rng = U.seeded(this.reg.seed * 31 + (typeof i === 'number' ? i : 999) * 101 + lvl * 7);
      const enc = forced ? forced.enc : E.EN.build(this.id, lvl, diff, rng);
      const h = this.groundAt(p.x, p.z);
      const mobs = enc.monsters.map((k, j) => {
        const def = E.M.MONSTERS[k];
        const size = { Miúdo: 1.0, Pequeno: 1.4, Médio: 2.0, Grande: 3.4, Enorme: 4.8 }[def.size] || 2;
        const cv = E.SP.monster(k);
        const sp = this.makeSprite(cv, size * (def.scale || 1) * 0.95 * WG.spriteVis(def));
        const a = (j / enc.monsters.length) * Math.PI * 2;
        const mx = p.x + Math.cos(a) * 1.6, mz = p.z + Math.sin(a) * 1.6;
        sp.position.set(mx, this.groundAt(mx, mz), mz);
        this.scene.add(sp);
        const shadow = this.addShadow(mx, this.groundAt(mx, mz), mz, 0.5 * size / 2);
        return { key: k, sprite: sp, shadow, x: mx, z: mz, hx: mx, hz: mz, phase: this.rng() * 10, frames: [cv, E.SP.monster(k, 'idle1')] };
      });
      const alert = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex('danger'), transparent: true, depthWrite: false }));
      alert.scale.set(0.8, 0.8, 1); alert.visible = false;
      this.scene.add(alert);
      const camp = { i, x: p.x, z: p.z, enc, diff, mobs, alert, aggro: false, temp: !!forced };
      this.camps.push(camp);
      return camp;
    }
    refreshObjectives() {
      const st = E.state, sc = this.scene;
      if (this.beam) { sc.remove(this.beam); this.beam = null; }
      if (this.storyObj) { sc.remove(this.storyObj); this.storyObj = null; }
      if (this.objective) { this.interactables = this.interactables.filter((x) => x !== this.objective); this.objective = null; }
      if (this.questSpot) { this.interactables = this.interactables.filter((x) => x !== this.questSpot); sc.remove(this.questSpotObj); this.questSpot = null; }
      const ch = E.WD.STORY[st.story.chapter];
      if (ch && !st.story.complete && !st.story.ready && ch.region === this.id && ch.goal.type !== 'victory') {
        const p = this.storyPos, h = this.groundAt(p.x, p.z);
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: ch.goal.type === 'boss' ? '#b07aff' : '#ffd36b', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
        beam.position.set(p.x, h + 30, p.z);
        sc.add(beam);
        this.beam = beam;
        const label = ch.goal.type === 'collect' ? `Colher ${ch.goal.target}` : ch.goal.type === 'investigate' ? 'Investigar o selo marcado' : 'Desafiar a Soberana das Nove Sombras';
        this.objective = { kind: 'story', x: p.x, z: p.z, r: 3, label, icon: '✧' };
        // o objetivo existe de verdade no mundo: a erva luminosa ou o selo rúnico
        if (ch.goal.type === 'collect') { this.storyObj = E.WX.herb(ch.goal.target, true); this.storyObj.position.set(p.x, h, p.z); sc.add(this.storyObj); }
        else if (ch.goal.type === 'investigate') { this.storyObj = E.WX.sealStone(); this.storyObj.position.set(p.x, h, p.z); this.storyObj.rotation.y = Math.atan2(-p.x, -p.z); sc.add(this.storyObj); }
        this.interactables.push(this.objective);
        if (ch.goal.type === 'boss' && !this.throne) {
          const t = new THREE.Group();
          const m = new THREE.MeshStandardMaterial({ color: '#2a2238', flatShading: true });
          const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 1.6), m); seat.position.y = 0.5;
          const back = new THREE.Mesh(new THREE.BoxGeometry(2, 3.6, 0.4), m); back.position.set(0, 1.8, -0.7);
          t.add(seat, back); t.position.set(p.x, h, p.z);
          sc.add(t); this.throne = t;
        }
      }
      // investigação de missão secundária
      const hero = E.Store.hero();
      for (const nid of this.reg.npcs) {
        const npc = E.WD.NPCS[nid];
        if (!npc || !npc.quest || npc.quest.type !== 'investigate') continue;
        const qs = st.quests[npc.quest.id];
        if (!qs || qs.state !== 'active') continue;
        const p = this.questPos, h = this.groundAt(p.x, p.z);
        const g = E.WX.sealStone();
        g.scale.setScalar(0.7);
        g.position.set(p.x, h, p.z);
        sc.add(g); this.questSpotObj = g;
        this.questSpot = { kind: 'qinvestigate', quest: npc.quest, npc: nid, x: p.x, z: p.z, r: 2.5, label: npc.quest.title + ': investigar', icon: '🔍' };
        this.interactables.push(this.questSpot);
      }
      void hero;
      this.refreshNpcMarkers();
    }
    // ------------------------------------------------------------ pesca animada
    // a vara é desenhada no próprio sprite do herói (presa no punho); a linha 3D sai da ponta dela;
    // a boia voa em arco; o peixe salta para as mãos do herói.
    // estágios: cast (lançar) → wait (esperar) → bite (fisgada) → reel (puxar) → catch/escape → wait … end
    fishFx(stage, spot, data = {}) {
      const sc = this.scene, hr = this.hero;
      if (stage === 'end') {
        if (this.fish) { for (const o of this.fish.objs) sc.remove(o); for (const o of this.fish.spot.post || []) o.visible = true; }
        // levanta do banco e dá um passo até a estaca
        if (this.fish && this.fish.seat) this.rise = { t: 0, x0: hr.x, z0: hr.z, x1: this.fish.spot.x, z1: this.fish.spot.z };
        this.heroSprite.material.depthTest = true; this.heroSprite.renderOrder = 0;
        this.fish = null;
        return;
      }
      if (!this.fish || stage === 'cast' || stage === 'sit') {
        // sentado, cada novo lançamento continua no banco
        const seat = (this.fish && this.fish.seat) || (stage === 'sit' && spot.bench) || null, seated = !!(this.fish && this.fish.seated);
        if (this.fish) for (const o of this.fish.objs) sc.remove(o);
        this.fishFrames();
        const N = 22, lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f4efe6', transparent: true, opacity: 0.85 }));
        line.frustumCulled = false;
        const bob = new THREE.Group();
        bob.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ff4d4d' })));
        bob.add(new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff' })));
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), new THREE.MeshBasicMaterial({ color: '#ffd36b' })); stick.position.y = 0.16; bob.add(stick);
        for (const o of [line, bob]) sc.add(o);
        // a estaca com lanterna do ponto de pesca some enquanto se pesca (senão parece um cajado na mão do herói)
        for (const o of spot.post || []) o.visible = false;
        this.fish = { spot, stage: 'cast', t: 0, line, bob, lineN: N, objs: [line, bob], ripples: [], frame: 'fcast0', prog: 0, catchSpr: null, seat, seated };
        if (stage === 'sit') { this.fish.stage = 'sit'; this.fish.frame = 'fhold'; bob.visible = false; if (!seated) this.fish.approach = { t: 0, x0: hr.x, z0: hr.z }; }
        // câmera de lado para ver herói, linha e boia (sentado, um pouco mais de frente para mostrar o banco)
        this.cam.yaw = Math.atan2(spot.wx - (seat ? seat.x : hr.x), spot.wz - (seat ? seat.z : hr.z)) + Math.PI * (seat ? 0.74 : 0.62);
        this.cam.dist = Math.min(Math.max(this.cam.dist, 9), 12);
        hr.dir = (spot.wx - hr.x) * Math.cos(this.cam.yaw) - (spot.wz - hr.z) * Math.sin(this.cam.yaw) > 0 ? 1 : -1;
        hr.moving = false;
      }
      const F = this.fish;
      if (stage === 'cast') { F.stage = 'cast'; F.t = 0; F.bob.visible = false; F.reach = Math.max(0, ((data.reach || 3) - 3) * 0.35); if (E.Audio.sfx) E.Audio.sfx('slash'); }
      else if (stage === 'bite') { F.stage = 'bite'; F.t = 0; this.fishRipple(F.bob.position, 3, 0.9); }
      else if (stage === 'reset') { F.stage = 'wait'; F.t = 0; F.prog = 0; }
      else if (stage === 'reel') { if (F.stage !== 'reel') { F.stage = 'reel'; F.t = 0; } F.prog = data.prog ?? F.prog; F.fishY = data.fish ?? F.fishY; F.inside = !!data.inside; }
      else if (stage === 'escape') { F.stage = 'escape'; F.t = 0; this.fishRipple(F.bob.position, 2, 0.7); }
      else if (stage === 'catch') {
        F.stage = 'catch'; F.t = 0; F.bob.visible = false;
        if (F.catchSpr) { sc.remove(F.catchSpr); F.objs = F.objs.filter((o) => o !== F.catchSpr); }
        const cv = data.art || null;
        if (cv) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex(cv), transparent: true, alphaTest: 0.4 }));
          const big = 0.9 + (data.r || 1) * 0.18;
          sp.scale.set(big * cv.width / cv.height, big, 1);
          sp.position.copy(F.bob.position); sc.add(sp); F.catchSpr = sp; F.objs.push(sp);
          F.catchFrom = F.bob.position.clone();
        }
        F.rare = (data.r || 1) >= 4;
        this.fishRipple(F.bob.position, 4, 1.2);
      }
    }
    fishRipple(pos, n = 3, size = 1) {
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
        m.rotation.x = -Math.PI / 2; m.position.set(pos.x, this.waterLevel + 0.07, pos.z);
        this.scene.add(m);
        (this.fish ? this.fish.ripples : (this._ripples = this._ripples || [])).push({ m, t: -i * 0.18, size });
      }
    }
    // ponto do quadro do herói (fração da imagem) no mundo: o sprite é um painel virado para a câmera,
    // então o deslocamento segue os eixos da câmera (direita e cima da tela)
    spriteWorld(cv, fr) {
      const hr = this.hero, hh = this.heroSprite.userData.h * (cv._k || 1);
      const wdt = hh * cv.width / cv.height, cy = cv._cy ?? 0.02;
      const m = this.camera.matrixWorld.elements;
      const ox = (fr[0] - 0.5) * wdt * hr.dir, oy = (1 - fr[1] - cy) * hh;
      return new THREE.Vector3(hr.x + m[0] * ox + m[4] * oy, hr.y + hr.jump + m[1] * ox + m[5] * oy, hr.z + m[2] * ox + m[6] * oy);
    }
    handWorld(cv) { return this.spriteWorld(cv, cv._handF || [0.78, 0.5]); }
    updateFishing(dt) {
      const F = this.fish; if (!F) return;
      const hr = this.hero, sp = F.spot, wl = this.waterLevel;
      F.t += dt;
      // caminha até o banco e senta; o herói fica por cima do assento
      if (F.approach) {
        const A = F.approach, b = F.seat, u = Math.min(1, (A.t += dt) / 0.7);
        hr.x = A.x0 + (b.x - A.x0) * u; hr.z = A.z0 + (b.z - A.z0) * u;
        const sx = (b.x - A.x0) * Math.cos(this.cam.yaw) - (b.z - A.z0) * Math.sin(this.cam.yaw);
        if (Math.abs(sx) > .01) hr.dir = sx > 0 ? 1 : -1;
        F.cv = u < 1 ? this.heroFrames.walk[Math.floor(A.t * 14) % 12] : null;
        if (u < 1) return;
        F.approach = null; F.seated = true; if (E.Audio.sfx) E.Audio.sfx('step');
        hr.dir = (sp.wx - b.x) * Math.cos(this.cam.yaw) - (sp.wz - b.z) * Math.sin(this.cam.yaw) > 0 ? 1 : -1;
      }
      if (F.seated) { this.heroSprite.material.depthTest = false; this.heroSprite.renderOrder = 4; hr.x = F.seat.x; hr.z = F.seat.z; }
      // quadro do herói (cada um com a vara numa posição) e quanto a linha cede
      let sag = 0.9;
      if (F.stage === 'cast') {
        if (F.t < 0.28) F.frame = 'fcast0';
        else if (F.t < 0.5) F.frame = 'fcast1';
        else F.frame = 'fhold';
        if (F.t > 0.32 && !F.flying && !F.bob.visible) { F.flying = true; F.flyT = 0; F.flyFrom = F.tip ? F.tip.clone() : new THREE.Vector3(hr.x, hr.y + 2, hr.z); }
        sag = 0.2;
        if (F.t > 1.0 && !F.flying) F.stage = 'wait';
      } else if (F.stage === 'wait' || F.stage === 'sit') F.frame = 'fhold';
      else if (F.stage === 'bite') { F.frame = Math.floor(this.t * 12) % 2 ? 'fbite' : 'fhold'; sag = 0.25; }
      else if (F.stage === 'reel') { F.frame = Math.floor(this.t * 7) % 2 ? 'freel0' : 'freel1'; sag = 0.05; }
      else if (F.stage === 'escape') { F.frame = 'fhold'; sag = 1.6; if (F.t > 0.9) F.stage = 'wait'; }
      else if (F.stage === 'catch') { F.frame = F.t < 0.55 ? 'freel0' : 'fcatch'; sag = 1.2; }
      // a linha sai da ponta da vara desenhada no sprite
      F.key = (F.seated ? 's' : '') + F.frame;
      const cv = this.heroFrames.fish[F.key];
      const wdir = new THREE.Vector3(sp.wx - hr.x, 0, sp.wz - hr.z).normalize();
      F.tip = this.spriteWorld(cv, cv._tipF || cv._handF || [0.78, 0.5]);
      // boia: voo em arco depois do lançamento, depois flutua; puxada para a margem durante a luta
      // varas de maior alcance lançam um pouco mais longe (se ainda houver água ali)
      const far = F.reach && this.groundAt(sp.wx + wdir.x * F.reach, sp.wz + wdir.z * F.reach) < wl - 0.2 ? F.reach : 0;
      const target = new THREE.Vector3(sp.wx + wdir.x * far, wl + 0.08, sp.wz + wdir.z * far);
      if (F.flying) {
        F.flyT += dt / 0.55;
        const u = Math.min(1, F.flyT);
        F.bob.visible = true;
        F.bob.position.lerpVectors(F.flyFrom, target, u); F.bob.position.y += Math.sin(u * Math.PI) * 2.4;
        if (u >= 1) { F.flying = false; this.fishRipple(target, 3, 1); if (E.Audio.sfx) E.Audio.sfx('step'); if (F.stage === 'cast') F.stage = 'wait'; }
      } else if (F.stage !== 'catch') {
        const shore = new THREE.Vector3(hr.x, wl + 0.08, hr.z);
        const pull = F.stage === 'reel' ? Math.min(0.65, F.prog * 0.6) : 0;
        const side = new THREE.Vector3(-wdir.z, 0, wdir.x);
        F.bob.position.lerpVectors(target, shore, pull);
        if (F.stage === 'reel') F.bob.position.add(side.multiplyScalar(Math.sin(this.t * 5.3) * 0.7 * (1 - pull)));
        const dip = F.stage === 'bite' ? -0.16 + Math.sin(this.t * 30) * 0.06 : F.stage === 'reel' ? -0.08 + Math.sin(this.t * 17) * 0.05 : Math.sin(this.t * 3) * 0.04;
        F.bob.position.y = wl + 0.08 + dip;
        if (F.stage === 'reel' && Math.random() < dt * 6) this.fishRipple(F.bob.position, 1, 0.6);
      }
      // peixe fisgado: salta da água para as mãos e fica erguido sobre a cabeça
      if (F.stage === 'catch' && F.catchSpr) {
        const head = new THREE.Vector3(hr.x, hr.y + this.heroSprite.userData.h * 1.08, hr.z);
        const u = Math.min(1, F.t / 0.55);
        if (u < 1) { F.catchSpr.position.lerpVectors(F.catchFrom, head, u); F.catchSpr.position.y += Math.sin(u * Math.PI) * 2.2; F.catchSpr.material.rotation = (1 - u) * 6; }
        else { F.catchSpr.position.copy(head); F.catchSpr.position.y += Math.sin(this.t * 6) * 0.06; F.catchSpr.material.rotation = Math.sin(this.t * 9) * 0.12; }
        if (F.rare && Math.random() < dt * 14) this.fishRipple(F.catchSpr.position, 1, 0.4);
      }
      // linha: da ponta da vara até a boia, com barriga (mais esticada quando puxando)
      const end = F.stage === 'catch' && F.catchSpr ? F.catchSpr.position : F.bob.visible ? F.bob.position : F.tip;
      const pa = F.line.geometry.attributes.position, a0 = F.tip, n = F.lineN;
      const dist = a0.distanceTo(end);
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        const x = a0.x + (end.x - a0.x) * u, z = a0.z + (end.z - a0.z) * u;
        let y = a0.y + (end.y - a0.y) * u - Math.sin(u * Math.PI) * sag * Math.min(1.5, dist * 0.18);
        y = Math.max(y, wl + 0.02);
        pa.setXYZ(i, x, y, z);
      }
      pa.needsUpdate = true;
      // ondinhas
      for (const r of F.ripples) { r.t += dt; const ph = Math.max(0, r.t) / 1.1; r.m.scale.setScalar(0.4 + ph * 3 * r.size); r.m.material.opacity = 0.8 * Math.max(0, 1 - ph); }
      F.ripples = F.ripples.filter((r) => { if (r.t > 1.1) { this.scene.remove(r.m); return false; } return true; });
    }
    // chefe do covil: aparece se não foi derrotado nos últimos 20 minutos
    refreshLair() {
      const key = E.M.LAIR[this.id]; if (!key) return;
      const killed = ((E.state.world.bossKilled || {})[this.id]) || 0;
      const alive = Date.now() - killed > 20 * 60 * 1000;
      if (this.lairBoss) { this.scene.remove(this.lairBoss.sprite); this.scene.remove(this.lairBoss.beam); this.interactables = this.interactables.filter((x) => x !== this.lairBoss.ia); this.lairBoss = null; }
      if (!alive) return;
      const def = E.M.MONSTERS[key], p = this.lairPos, h = this.groundAt(p.x, p.z);
      const size = ({ Médio: 2.0, Grande: 3.4, Enorme: 4.8 }[def.size] || 3.4) * (def.scale || 1) * WG.spriteVis(def) * 1.5;
      const cv = E.SP.monster(key);
      const sp = this.makeSprite(cv, size);
      sp.position.set(p.x, h + 0.35, p.z);
      this.scene.add(sp);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: def.bossColor || '#ff5d79', transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
      beam.position.set(p.x, h + 35, p.z);
      this.scene.add(beam);
      const lvl = def.lvl || Math.max(this.reg.level, Math.ceil(def.cr * 1.25) + 2);
      const ia = { kind: 'lair', key, x: p.x, z: p.z, r: 5.5, label: `Desafiar ${def.name} (Nv. ${lvl}+)`, icon: '☠', lvl };
      this.interactables.push(ia);
      this.lairBoss = { sprite: sp, beam, ia, frames: [cv, E.SP.monster(key, 'idle1')], key };
    }
    // ervas procuradas por uma missão ativa ganham um feixe de luz fino (e aparecem no minimapa)
    wantedHerb() {
      const st = E.state, herb = this.reg.herb;
      for (const [id, q] of Object.entries(st.quests)) {
        if (q.state !== 'active') continue;
        const def = E.Quests.find(id);
        if (def && def.type === 'collect' && def.target === herb && !E.Quests.isComplete(def)) return def;
      }
      return null;
    }
    refreshHerbBeacons() {
      const want = !!this.wantedHerb();
      for (const hb of this.herbs) {
        if (want && !hb.beacon) {
          const b = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 22, 10, 1, true), new THREE.MeshBasicMaterial({ color: E.WX.HERB_COLOR[this.reg.herb] || '#9fffd0', transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
          b.position.set(hb.x, this.height(hb.x, hb.z) + 11, hb.z);
          this.scene.add(b); hb.beacon = b;
        } else if (!want && hb.beacon) { this.scene.remove(hb.beacon); hb.beacon = null; }
      }
    }
    refreshNpcMarkers() {
      this.refreshHerbBeacons();
      const st = E.state;
      for (const n of this.npcs) {
        const q = n.npc.quest;
        let kind = null;
        if (q) {
          const qs = st.quests[q.id];
          if (!qs) kind = 'quest';
          else if (qs.state === 'active' && E.Quests && E.Quests.isComplete(q)) kind = 'done';
        }
        const cid = n.npc.chain;
        if (!kind && cid && E.Chains) {
          const cs = E.Chains.get(cid);
          if (cs && cs.active && !cs.done && E.Chains.progress(cid).ok) kind = 'done';
          else if (E.Chains.nextStep(cid) && (!cs || !cs.active)) kind = 'quest';
        }
        n.marker.visible = !!kind;
        if (kind) n.marker.material.map = markerTex(kind);
      }
    }

    // ------------------------------------------------------------ herói
    buildHero() {
      const h = E.Store.hero() || { cls: 'guerreiro', species: 'humano', look: { skin: '#e3b892', hair: '#3a2a20', hairStyle: 0, outfit: '#e08a3c' }, equip: {} };
      const pos = E.state.world.pos && E.state.world.region === this.id ? E.state.world.pos : this.spawn;
      this.hero = { x: pos.x, z: pos.z, y: this.groundAt(pos.x, pos.z), vy: 0, jump: 0, dir: 1, moving: false, frameT: 0, frame: 0 };
      this.heroSprite = this.makeSprite(E.SP.hero(h, 'idle0', E.Zones ? E.Zones.weaponType(h, this) : E.SP.heroWeaponType(h)), WG.heroHeight(h));
      this.scene.add(this.heroSprite);
      this.heroShadow = this.addShadow(0, 0, 0, 0.55);
      this.glider = new THREE.Sprite(new THREE.SpriteMaterial({ map: gliderTex(), transparent: true, depthWrite: false }));
      this.glider.scale.set(3.3, 1.45, 1); this.glider.center.set(0.5, 0.12); this.glider.visible = false;
      this.scene.add(this.glider);
      this.swimRipple = new THREE.Mesh(new THREE.RingGeometry(.4, .46, 28), new THREE.MeshBasicMaterial({ color: '#d9f7ff', transparent: true, opacity: .32, depthWrite: false, side: THREE.DoubleSide }));
      this.swimRipple.rotation.x = -Math.PI / 2; this.swimRipple.visible = false; this.scene.add(this.swimRipple);
      this.refreshHeroFrames();
    }
    // quadros de pesca com a vara que o herói tem agora (a vara é desenhada no sprite, presa no punho)
    fishFrames(h = E.Store.hero()) {
      if (!h || !this.heroFrames) return;
      const rod = (h.life && h.life.rod) || 0, wt = E.Zones ? E.Zones.weaponType(h, this) : E.SP.heroWeaponType(h);
      this.heroFrames.fish = Object.fromEntries(['fcast0', 'fcast1', 'fhold', 'fbite', 'freel0', 'freel1', 'fcatch'].flatMap((k) => [[k, E.SP.hero(h, k + ':' + rod, wt)], ['s' + k, E.SP.hero(h, 's' + k + ':' + rod, wt)]]));
    }
    // Eco (espírito guardião) flutuando atrás do herói
    refreshEco() {
      if (this.ecoFx) { this.scene.remove(this.ecoFx.sprite, this.ecoFx.glow); this.ecoFx = null; }
      const h = E.Store.hero(), e = E.Eco && E.Eco.equipped(h);
      if (!e || !E.ECOART) return;
      const cv = E.ECOART.draw(e.art || e.id), hh = (this.heroSprite ? this.heroSprite.userData.h : 2.5) * 0.95;
      const sp = this.makeSprite(cv, hh);
      sp.material.opacity = 0.84; sp.material.depthWrite = false;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(e.def.look.aura), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
      glow.scale.setScalar(hh * 1.25);
      this.scene.add(glow, sp);
      this.ecoFx = { sprite: sp, glow, frames: [cv, E.ECOART.draw(e.art || e.id, 'idle1')], t: 0, pos: null, h: hh };
      for (const c of this.ecoFx.frames) E.ECOART.onReady(c, (r) => { tex(r).needsUpdate = true; });
    }
    refreshHeroFrames() {
      const h = E.Store.hero() || { cls: 'guerreiro', species: 'humano', look: { skin: '#e3b892', hair: '#3a2a20', hairStyle: 0, outfit: '#e08a3c' }, equip: {} };
      const wt = E.Zones ? E.Zones.weaponType(h, this) : E.SP.heroWeaponType(h);
      const F = (f) => E.SP.hero(h, f, wt);
      this.heroFrames = { idle: [F('idle0'), F('idle1')], walk: Array.from({ length: 12 }, (_, i) => F('w' + i)), crouch: F('jump0'), up: F('jump1'), fall: F('jump2'), land: F('land'), swim: Array.from({ length: 8 }, (_, i) => F('swim' + i)), fish: null };
      this.fishFrames(h);
      if (this.heroSprite) this.heroSprite.userData.h = WG.heroHeight(h);
      if (E.Net && E.Net.connected) E.Net.hello();
      this.refreshEco();
      // arma ★5 equipada: aura de faíscas orbitando + brilho no chão
      const wi = E.SP.heroWeaponInfo(h);
      if (this.legendFx) { this.legendFx.parts.forEach((p) => this.scene.remove(p)); this.scene.remove(this.legendFx.ring); this.legendFx = null; }
      if (wi.rar >= 5 && this.scene) {
        const parts = [];
        for (let i = 0; i < 14; i++) {
          const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(i % 3 ? wi.c1 : '#fff6d0'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
          sp.scale.setScalar(0.16 + (i % 4) * 0.05); sp.userData = { a: i / 14 * Math.PI * 2, r: 0.55 + (i % 3) * 0.18, y: (i % 5) / 5, s: 0.8 + (i % 4) * 0.25 };
          this.scene.add(sp); parts.push(sp);
        }
        const ring = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), new THREE.MeshBasicMaterial({ map: runeCircleTex(wi.c1), color: '#ffffff', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        ring.rotation.x = -Math.PI / 2; this.scene.add(ring);
        this.legendFx = { parts, ring };
      }
    }
    // pulo com antecipação (agacha um instante), subida, queda e pouso com amortecimento
    // No teclado, Espaço segurado mantém a asa aberta; no toque, um toque no ar abre.
    closeGlider() { this.hero.glide = false; this.hero.glideControl = null; if (this.glider) this.glider.visible = false; }
    openGlider(source = 'touch') {
      const hr = this.hero, h = E.Store.hero();
      if (WG.locked || hr.boat || hr.swim || hr.jump <= .15 || this.cave || !E.Sim || !E.Sim.hasGlider(h)) return false;
      if (!hr.glide && E.Audio.sfx) E.Audio.sfx('open');
      hr.glide = true; hr.glideControl = source; return true;
    }
    jump(source = 'touch') {
      const hr = this.hero; if (WG.locked || hr.boat || hr.swim) return;
      if (hr.jump > .15) { this.openGlider(source); return; }
      if (hr.jump <= .001 && !(hr.preJump > 0)) hr.preJump = .07;
    }
    // Exact interpolation of the rendered mesh's triangles, including the authored diagonal.
    terrainAt(x, z) {
      const g = this.terrainGrid;
      if (!g || Math.abs(x) > g.size / 2 || Math.abs(z) > g.size / 2) return this.height(x, z);
      const fx = U.clamp((x / g.size + .5) * g.segments, 0, g.segments), fz = U.clamp((z / g.size + .5) * g.segments, 0, g.segments);
      const ix = Math.min(g.segments - 1, Math.floor(fx)), iz = Math.min(g.segments - 1, Math.floor(fz));
      const tx = fx - ix, tz = fz - iz, i = iz * g.stride + ix, p = g.positions;
      const a = p[i * 3 + 1], b = p[(i + g.stride) * 3 + 1], d = p[(i + 1) * 3 + 1];
      if (tx + tz <= 1) return a + (d - a) * tx + (b - a) * tz;
      const c = p[(i + g.stride + 1) * 3 + 1];
      return c + (b - c) * (1 - tx) + (d - c) * (1 - tz);
    }
    terrainHeight(x, z) { return this.terrainAt(x, z); }
    // chão para o herói: a mesma malha que ele vê, ou o piso da ponte.
    groundAt(x, z) {
      let h = this.terrainAt(x, z);
      for (const b of this.bridges || []) {
        if (Math.abs(x - b.cx) > b.ext || Math.abs(z - b.cz) > b.ext) continue;
        const dx = b.bx - b.ax, dz = b.bz - b.az, l2 = dx * dx + dz * dz;
        const t = ((x - b.ax) * dx + (z - b.az) * dz) / l2;
        if (t < -0.02 || t > 1.02) continue;
        const tc = U.clamp(t, 0, 1), px = b.ax + dx * tc, pz = b.az + dz * tc;
        if (Math.hypot(x - px, z - pz) < b.w / 2) h = Math.max(h, U.lerp(b.ya, b.yb, tc));
      }
      for (const floor of this.groundPlatforms || []) { const y = WG.platformHeight(floor, x, z); if (y !== null) h = Math.max(h, y); }
      return h;
    }
    // pontes de madeira onde as estradas cruzam rios e lagos
    buildBridges() {
      this.bridges = [];
      if (this.K === 1 || !this.roads || this.reg.metro) return;
      const wl = this.waterLevel;
      for (const [a, b] of this.roads) {
        const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); if (L < 2) continue;
        const pt = (t) => { const wob = Math.sin(t * Math.PI * 2) * 3; return { x: a.x + dx * t + (-dz / L) * wob, z: a.z + dz * t + (dx / L) * wob }; };
        const N = Math.ceil(L / 0.8); let inW = false, s0 = 0;
        for (let i = 0; i <= N; i++) {
          const t = i / N, p = pt(t), wet = this.height(p.x, p.z) < wl + 0.2;
          if (wet && !inW) { inW = true; s0 = Math.max(0, t - 2.4 / L); }
          if ((!wet || i === N) && inW) {
            inW = false;
            const t1 = Math.min(1, t + 2.4 / L), A = pt(s0), Bq = pt(t1), len = Math.hypot(Bq.x - A.x, Bq.z - A.z);
            if (len < 3 || this.bridges.some((o) => Math.hypot(o.cx - (A.x + Bq.x) / 2, o.cz - (A.z + Bq.z) / 2) < 4)) continue;
            const ya = Math.max(this.height(A.x, A.z), wl + 0.35) + 0.12, yb = Math.max(this.height(Bq.x, Bq.z), wl + 0.35) + 0.12;
            this.bridges.push({ ax: A.x, az: A.z, bx: Bq.x, bz: Bq.z, ya, yb, w: 3.2, cx: (A.x + Bq.x) / 2, cz: (A.z + Bq.z) / 2, ext: len / 2 + 3, len });
          }
        }
      }
      const wood = new THREE.MeshStandardMaterial({ color: '#8a5a32', flatShading: true, roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: '#5a3a1e', flatShading: true });
      for (const b of this.bridges) {
        const g = new THREE.Group(), ang = Math.atan2(b.bz - b.az, b.bx - b.ax), tilt = Math.atan2(b.yb - b.ya, b.len);
        const deck = new THREE.Mesh(new THREE.BoxGeometry(b.len, 0.28, b.w), wood); deck.rotation.z = tilt; deck.castShadow = deck.receiveShadow = true; g.add(deck);
        for (const s of [1, -1]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(b.len, 0.12, 0.12), dark); rail.position.set(0, 1.0, s * (b.w / 2 - 0.1)); rail.rotation.z = tilt; g.add(rail); }
        for (let k = 0; k <= Math.floor(b.len / 2.6); k++) {
          const u = -b.len / 2 + k * 2.6, yy = Math.tan(tilt) * u;
          for (const s of [1, -1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.1, 0.16), dark); post.position.set(u, yy + 0.5, s * (b.w / 2 - 0.1)); g.add(post); }
          const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 4, 6), dark); pile.position.set(u, yy - 2, 0); g.add(pile);
        }
        g.position.set(b.cx, (b.ya + b.yb) / 2 - 0.14, b.cz); g.rotation.y = -ang;
        this.scene.add(g);
        if (E.ScenePerf) E.ScenePerf.batch(g);
      }
    }

    buildParticles() {
      // vaga-lumes / poeira mágica
      const n = 180, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (this.rng() - 0.5) * 120; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = (this.rng() - 0.5) * 120; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const m = new THREE.PointsMaterial({ size: 0.35, map: radialTex(this.B.night ? '#c8a8ff' : '#fff6c8'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 });
      this.motes = new THREE.Points(g, m);
      this.motesBase = pos.slice();
      this.scene.add(this.motes);
    }

    // ------------------------------------------------------------ minimapa
    makeMinimap() {
      // mapa "pintado": relevo sombreado, água com profundidade e espuma, estradas, árvores e prédios
      const R = this.K > 1 ? 320 : 256, N = 512 * this.K, size = this.size, B = this.B, wl = this.waterLevel;
      const hs = new Float32Array(R * R);
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) hs[j * R + i] = this.height(((i + 0.5) / R - 0.5) * size, ((j + 0.5) / R - 0.5) * size);
      this.heightField = { data: hs, n: R, size };
      const base = document.createElement('canvas'); base.width = base.height = R;
      const bx = base.getContext('2d'), img = bx.createImageData(R, R);
      const g0 = col(B.ground[0]), g1 = col(B.ground[1]), g2 = col(B.ground[2] || B.ground[1]), hi = col(B.high), wat = col(B.water);
      const deep = wat.clone().offsetHSL(0, 0.05, -0.16), shallow = wat.clone().offsetHSL(0, -0.05, 0.12), foam = col('#f4f8ff'), sand = col(B.sand || '#e6d6a8');
      const cell = size / R, tmp = new THREE.Color();
      for (let j = 0; j < R; j++) for (let i = 0; i < R; i++) {
        const k = j * R + i, h = hs[k];
        const hx = hs[j * R + Math.min(R - 1, i + 1)] - hs[j * R + Math.max(0, i - 1)], hz = hs[Math.min(R - 1, j + 1) * R + i] - hs[Math.max(0, j - 1) * R + i];
        const shade = U.clamp(-(hx * 0.7 + hz * 0.7) / (cell * 2) * 0.55, -0.32, 0.32); // luz vindo do noroeste
        if (h < wl) {
          const dep = U.clamp((wl - h) / 4, 0, 1);
          tmp.copy(shallow).lerp(deep, dep);
          if (h > wl - 0.35) tmp.lerp(foam, 0.55);
        } else {
          const n = this.noise.fbm(((i / R) - 0.5) * size * 0.05, ((j / R) - 0.5) * size * 0.05, 2);
          tmp.copy(g1).lerp(n > 0 ? g2 : g0, Math.min(1, Math.abs(n) * 1.6));
          if (h < wl + 0.7) tmp.lerp(sand, 0.6 * (1 - (h - wl) / 0.7));
          if (h > 7) tmp.lerp(hi, U.clamp((h - 7) / 5, 0, 0.75));
          tmp.offsetHSL(0, 0, shade + U.clamp(h * 0.008, -0.05, 0.08));
        }
        const o = k * 4;
        img.data[o] = tmp.r * 255; img.data[o + 1] = tmp.g * 255; img.data[o + 2] = tmp.b * 255; img.data[o + 3] = 255;
      }
      bx.putImageData(img, 0, 0);
      const cv = document.createElement('canvas'); cv.width = cv.height = N;
      const x = cv.getContext('2d');
      x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(base, 0, 0, N, N);
      const S = N / size, P = (wx) => (wx + size / 2) * S;
      // estradas (mesmo traçado ondulado do mundo)
      const roadC = E.SP.mix(B.pave || '#e8d8b0', '#f2e6c4', 0.4);
      const strokeRoads = (w, c) => {
        x.strokeStyle = c; x.lineWidth = w * S; x.lineCap = 'round'; x.lineJoin = 'round';
        for (const [a, b] of this.roads || []) {
          const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
          x.beginPath();
          for (let s = 0; s <= 24; s++) { const t = s / 24, wob = Math.sin(t * Math.PI * 2) * 3; const px = a.x + dx * t + (-dz / l) * wob, pz = a.z + dz * t + (dx / l) * wob; if (s) x.lineTo(P(px), P(pz)); else x.moveTo(P(px), P(pz)); }
          x.stroke();
        }
      };
      strokeRoads(3.6, 'rgba(60,40,20,.35)'); strokeRoads(2.6, roadC);
      if (!this.reg.metro) { // praça
        x.fillStyle = 'rgba(60,40,20,.3)'; x.beginPath(); x.arc(P(0), P(0), (this.plaza + 0.6) * S, 0, 7); x.fill();
        x.fillStyle = E.SP.mix(B.pave || '#d8ccb0', '#efe6d0', 0.3); x.beginPath(); x.arc(P(0), P(0), this.plaza * S, 0, 7); x.fill();
      }
      // enfeites: copas de árvores, pedras, casas
      const G = this.propGroups || {};
      const canopy = (list, c, r) => { for (const it of list || []) { const rr = r * it.s * S; x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(P(it.x) + rr * 0.3, P(it.z) + rr * 0.35, rr, 0, 7); x.fill(); x.fillStyle = c; x.beginPath(); x.arc(P(it.x), P(it.z), rr, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(P(it.x) - rr * 0.3, P(it.z) - rr * 0.3, rr * 0.45, 0, 7); x.fill(); } };
      const treeC = E.SP.shade(B.tree ? B.tree[0] || B.ground[2] : B.ground[2] || B.ground[1], -0.25);
      canopy(G.tree, treeC, 1.5); canopy(G.pine, E.SP.shade(treeC, -0.1), 1.2); canopy(G.palm, E.SP.shade(treeC, 0.05), 1.3); canopy(G.bush, E.SP.shade(treeC, 0.1), 0.8);
      canopy(G.rock, '#9a9488', 0.9); canopy(G.crystal, B.light || '#9fe3ff', 0.6);
      for (const it of [...(G.house || []), ...(G.tent || [])]) { x.save(); x.translate(P(it.x), P(it.z)); x.rotate(-it.r); x.fillStyle = 'rgba(0,0,0,.3)'; x.fillRect(-1.6 * S + 2, -1.4 * S + 2, 3.2 * S, 2.8 * S); x.fillStyle = '#b8452a'; x.fillRect(-1.6 * S, -1.4 * S, 3.2 * S, 2.8 * S); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(-1.6 * S, -1.4 * S, 3.2 * S, 1.2 * S); x.restore(); }
      // metrópole: avenidas, quarteirões e prédios especiais
      const M = this.mapShapes;
      if (M) {
        x.fillStyle = '#d8d0c0';
        for (const [cx, cz, w, d] of M.roads) x.fillRect(P(cx - w / 2), P(cz - d / 2), w * S, d * S);
        for (const b of M.blocks) {
          x.fillStyle = 'rgba(0,0,0,.35)';
          if (b.round) { x.beginPath(); x.arc(P(b.x) + 2, P(b.z) + 2, b.w / 2 * S, 0, 7); x.fill(); } else x.fillRect(P(b.x - b.w / 2) + 2, P(b.z - b.d / 2) + 2, b.w * S, b.d * S);
          x.fillStyle = b.c;
          if (b.round) { x.beginPath(); x.arc(P(b.x), P(b.z), b.w / 2 * S, 0, 7); x.fill(); } else x.fillRect(P(b.x - b.w / 2), P(b.z - b.d / 2), b.w * S, b.d * S);
          x.strokeStyle = b.special ? '#ffd36b' : 'rgba(0,0,0,.35)'; x.lineWidth = b.special ? 2 : 1;
          if (b.round) { x.beginPath(); x.arc(P(b.x), P(b.z), b.w / 2 * S, 0, 7); x.stroke(); } else x.strokeRect(P(b.x - b.w / 2), P(b.z - b.d / 2), b.w * S, b.d * S);
        }
        if (M.fountain) { x.fillStyle = '#5ac0e8'; x.strokeStyle = '#f2ead8'; x.lineWidth = 3; x.beginPath(); x.arc(P(M.fountain.x), P(M.fountain.z), M.fountain.r * S, 0, 7); x.fill(); x.stroke(); }
      }
      this.minimap = cv;
      this.minimapScale = S;
    }

    // Bilinear lookup is only for tiny decorative particles, never collision/physics.
    sampleHeight(x, z) {
      const f = this.heightField;
      if (!f) return this.height(x, z);
      const gx = U.clamp((x / f.size + .5) * f.n - .5, 0, f.n - 1), gz = U.clamp((z / f.size + .5) * f.n - .5, 0, f.n - 1);
      const ix = Math.min(f.n - 2, Math.floor(gx)), iz = Math.min(f.n - 2, Math.floor(gz)), tx = gx - ix, tz = gz - iz, k = iz * f.n + ix;
      return U.lerp(U.lerp(f.data[k], f.data[k + 1], tx), U.lerp(f.data[k + f.n], f.data[k + f.n + 1], tx), tz);
    }
    // ------------------------------------------------------------ clique para andar
    // Marcha ao longo do raio da câmera até cruzar o terreno (ou a água) e refina por bisseção.
    groundRay(r) {
      const surf = (x, z) => Math.max(this.groundAt(x, z), this.waterLevel - .2);
      let prev = 0, p = r.origin;
      if (p.y <= surf(p.x, p.z)) return null;
      for (let t = .5; t < 140; t += .5) {
        const x = p.x + r.direction.x * t, y = p.y + r.direction.y * t, z = p.z + r.direction.z * t;
        if (y <= surf(x, z)) {
          let a = prev, b = t;
          for (let k = 0; k < 10; k++) { const m = (a + b) / 2, mx = p.x + r.direction.x * m, mz = p.z + r.direction.z * m; if (p.y + r.direction.y * m <= surf(mx, mz)) b = m; else a = m; }
          const hx = p.x + r.direction.x * b, hz = p.z + r.direction.z * b;
          return Math.abs(hx) < this.bound + 10 && Math.abs(hz) < this.bound + 10 ? { x: hx, z: hz } : null;
        }
        prev = t;
      }
      return null;
    }
    walkTo(x, z) {
      this.moveTarget = { x, z, best: Infinity, stuck: 0 };
      if (!this.moveMark) {
        this.moveMark = new THREE.Mesh(new THREE.RingGeometry(.32, .5, 24), new THREE.MeshBasicMaterial({ color: '#ffe7a8', transparent: true, opacity: .9, depthWrite: false }));
        this.moveMark.rotation.x = -Math.PI / 2; this.moveMark.renderOrder = 5; this.scene.add(this.moveMark);
      }
      this.moveMark.visible = true; this.moveMark.position.set(x, this.groundAt(x, z) + .06, z); this.moveMark.userData.t = 0;
    }
    stopWalk() { this.moveTarget = null; if (this.moveMark) this.moveMark.visible = false; }
    // Converte o destino em entrada de movimento relativa à câmera, como se fosse o teclado.
    followTarget(mv, dt) {
      const tg = this.moveTarget, hr = this.hero;
      if (this.moveMark && this.moveMark.visible) { const m = this.moveMark, k = (m.userData.t = (m.userData.t || 0) + dt); m.scale.setScalar(1 + Math.sin(k * 6) * .12); }
      if (!tg) return mv;
      if (WG.locked || Math.abs(mv.x) + Math.abs(mv.y) > .05 || hr.boat) { this.stopWalk(); return mv; }
      const dx = tg.x - hr.x, dz = tg.z - hr.z, d = Math.hypot(dx, dz);
      if (d < .45) { this.stopWalk(); return mv; }
      // sem progresso por 1,5 s (parede, penhasco): desiste
      if (d < tg.best - .05) { tg.best = d; tg.stuck = 0; } else if ((tg.stuck += dt) > 1.5) { this.stopWalk(); return mv; }
      const yaw = this.cam.yaw, ux = dx / d, uz = dz / d, slow = Math.min(1, d / 1.2);
      return { x: (ux * Math.cos(yaw) - uz * Math.sin(yaw)) * slow, y: (-ux * Math.sin(yaw) - uz * Math.cos(yaw)) * slow, sprint: mv.sprint };
    }
    // ------------------------------------------------------------ atualização
    update(dt) {
      this.t += dt;
      const inp = WG.input, hr = this.hero, cam = this.cam;
      cam.yaw -= inp.yawDelta; inp.yawDelta = 0;
      cam.pitch = U.clamp(cam.pitch + inp.pitchDelta, 0.18, 1.2); inp.pitchDelta = 0;
      cam.dist = U.clamp(cam.dist + inp.zoomDelta, 5, 22); inp.zoomDelta = 0;
      let mv = WG.locked ? { x: 0, y: 0 } : inp.move();
      mv = this.followTarget(mv, dt);
      // v4.5: movimento estilo Genshin — vigor, corrida, escalada, nado, queda livre e planador
      if (hr.st === undefined) hr.st = WG.STAMINA;
      const wasAir = hr.jump > 0.02, gNow = this.groundAt(hr.x, hr.z);
      if (hr.glide && (!E.Sim || !E.Sim.hasGlider(E.Store.hero()))) this.closeGlider();
      if (hr.glideControl === 'keyboard' && !inp.keys.Space) this.closeGlider();
      if (inp.keys.Space && wasAir && !WG.locked) this.openGlider('keyboard');
      hr.moving = Math.abs(mv.x) + Math.abs(mv.y) > .05;
      const canSprint = !hr.boat && !!mv.sprint && !hr.exhaust && hr.st > 0 && (!E.Sim || E.Sim.canSprint(E.Store.hero())) && !hr.swim && !wasAir;
      // nado normal não gasta vigor; segurando Shift o herói nada rápido e gasta vigor (menos que correndo)
      const fastSwim = hr.swim && !hr.boat && !!mv.sprint && !hr.exhaust && hr.st > 0;
      let speed = hr.boat ? 6.2 : hr.glide ? 7.4 : hr.swim ? (fastSwim ? 5.8 : 3.1) : canSprint ? 8.5 : 5.2;
      let drain = 0;
      hr.climb = false;
      let moved = 0;
      if (hr.moving) {
        const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
        let dx = (fx * mv.y + rx * mv.x) * speed * dt, dz = (fz * mv.y + rz * mv.x) * speed * dt;
        let nx = hr.x + dx, nz = hr.z + dz, nh = this.groundAt(nx, nz);
        // A escalada é lenta, mas não usa a reserva de corrida.
        const grade = (nh - gNow) / (Math.hypot(dx, dz) || 1e-6);
        if (!hr.boat && !wasAir && !hr.swim && grade > 1.15 && !this.cave) {
          hr.climb = true; const climbScale = .42 * 5.2 / speed; dx *= climbScale; dz *= climbScale; nx = hr.x + dx; nz = hr.z + dz;
        }
        const blocked = Math.hypot(nx, nz) > this.bound || (hr.boat && E.Maritime && E.Maritime.blocked(this,nx,nz)) || (this.cave && this.groundAt(nx, nz) < this.waterLevel - .35) || (this.cave && this.groundAt(nx, nz) - hr.y > 1.6);
        if (!blocked) {
          for (const c of this.nearColliders(nx, nz)) {
            const d = Math.hypot(nx - c.x, nz - c.z), min = c.r + 0.35;
            if (d < min) { const ux = d > .0001 ? (nx - c.x) / d : 1, uz = d > .0001 ? (nz - c.z) / d : 0; nx = c.x + ux * min; nz = c.z + uz * min; }
          }
          moved = Math.hypot(nx - hr.x, nz - hr.z);
          if (hr.boat && moved>.001) hr.boatYaw=Math.atan2(nx-hr.x,nz-hr.z);
          hr.x = nx; hr.z = nz;
        }
        // direção na tela (para espelhar o sprite)
        const sx = dx * Math.cos(cam.yaw) - dz * Math.sin(cam.yaw);
        if (Math.abs(sx) > 0.001) hr.dir = sx > 0 ? 1 : -1;
      }
      // pulo, correntes de vento, planador e queda
      if (hr.preJump > 0) { hr.preJump -= dt; if (hr.preJump <= 0) { hr.preJump = 0; if (!hr.swim) { hr.vy = 7.2; hr.jump = 0.01; } } }
      const up = (this.updrafts || []).find((u) => Math.hypot(u.x - hr.x, u.z - hr.z) < u.r && hr.y + hr.jump < u.y + u.h);
      if (up && hr.jump > 0.005) { hr.vy = Math.max(4, Math.min(11, hr.vy + 40 * dt)); }
      hr.vy -= 18 * dt;
      if (hr.glide && !up) hr.vy = Math.max(hr.vy, -2.1);
      if (hr.jump > 0 || hr.vy > 0) hr.jump += hr.vy * dt;
      const heroH = this.heroSprite.userData.h || 2.5, swimFrame = this.heroFrames.swim && this.heroFrames.swim[0];
      const g0 = this.groundAt(hr.x, hr.z), deep = !hr.boat && !this.cave && this.waterLevel - g0 > Math.min(.75, heroH * .35);
      const swimDepth = heroH * (1 - (swimFrame && swimFrame._waterlineF || .625) - .02);
      const base = hr.boat ? this.waterLevel+.32 : deep ? this.waterLevel - swimDepth : Math.max(g0, this.waterLevel - .25);
      if (hr.jump > 0.0001) {
        // no ar: a altitude continua a mesma enquanto o chão muda embaixo
        const abs = hr.y + hr.jump; hr.y = base; hr.jump = abs - base;
        if (hr.jump <= 0) { hr.jump = 0; hr.vy = 0; this.closeGlider(); }
      } else {
        hr.jump = 0; if (hr.vy < 0) hr.vy = 0;
        if (hr.y - base > 0.9) { hr.jump = hr.y - base; hr.y = base; hr.vy = 0; } // saiu de um penhasco: cai
        else hr.y = U.lerp(hr.y, base, Math.min(1, dt * 14));
      }
      const air = hr.jump > 0.02;
      hr.swim = deep && !air;
      if (hr.swim || !air) this.closeGlider();
      hr.sprinting = canSprint && hr.moving && !hr.climb && !hr.swim && !air && moved > .001;
      hr.fastSwim = fastSwim && hr.swim && hr.moving && moved > .001;
      drain = hr.sprinting ? 14 : hr.fastSwim ? 9 : 0;
      if (!air && hr.wasAir && !hr.swim) { hr.landT = 0.13; if (E.Audio.sfx) E.Audio.sfx('step'); }
      hr.wasAir = air;
      // Só a corrida e o nado rápido gastam vigor.
      const draining = drain > 0;
      if (draining) { hr.st = Math.max(0, hr.st - drain * dt); hr.stT = 0.7; if (hr.st === 0) hr.exhaust = true; }
      else { hr.stT = (hr.stT || 0) - dt; if (hr.stT <= 0) hr.st = Math.min(WG.STAMINA, hr.st + 26 * dt); }
      if (hr.exhaust && hr.st > 25) hr.exhaust = false;
      if (!hr.boat && !air && !deep && !hr.climb) hr.safe = { x: hr.x, z: hr.z };
      if (this.swimRipple) {
        const ripple = this.swimRipple, pulse = (this.t * (hr.moving ? 1.35 : .65)) % 1;
        ripple.visible = hr.swim;
        if (hr.swim) { ripple.position.set(hr.x, this.waterLevel + .035, hr.z); ripple.scale.setScalar(.9 + pulse * 1.4); ripple.material.opacity = (1 - pulse) * .28; }
      }
      if (this.glider) { this.glider.visible = !!hr.glide; if (hr.glide) { const gh = this.heroSprite.userData.h || 2.5; this.glider.position.set(hr.x, hr.y + hr.jump + gh * 1.02, hr.z); } }
      // animação do sprite: caminhada de 12 quadros sincronizada com a passada, pulo com esticar/amassar
      hr.frameT += dt;
      const HF = this.heroFrames;
      let cv, sx = 1, sy = 1;
      const step = hr.moving && !WG.locked ? (moved || speed * Math.min(1, Math.hypot(mv.x, mv.y)) * dt) * (hr.climb ? 1.8 : 1) : 0;
      hr.stride = ((hr.stride || 0) + step) % 3.3;
      if (this.rise) { const R = this.rise, u = Math.min(1, (R.t += dt) / 0.45); hr.x = R.x0 + (R.x1 - R.x0) * u; hr.z = R.z0 + (R.z1 - R.z0) * u; cv = R.t < .18 ? HF.crouch : HF.walk[Math.floor(R.t * 14) % 12]; if (u >= 1) this.rise = null; }
      else if (this.fish && (this.fish.cv || this.fish.frame)) cv = this.fish.cv || HF.fish[this.fish.key || this.fish.frame];
      else if (hr.boat) cv = HF.idle[Math.floor(this.t*1.7)%2];
      else if (hr.preJump > 0) { cv = HF.crouch; sx = 1.05; sy = 0.93; }
      else if (air) { if (hr.glide) cv = HF.up; else if (hr.vy > 1.2) { cv = HF.up; sx = 0.94; sy = 1.07; } else if (hr.vy > -1.5) cv = HF.up; else { cv = HF.fall; sx = 0.97; sy = 1.03; } }
      else if (hr.swim && HF.swim && HF.swim.length) { hr.swimPhase = (hr.swimPhase || 0) + dt * (hr.fastSwim ? 16 : hr.moving ? 10 : 4); cv = HF.swim[Math.floor(hr.swimPhase) % HF.swim.length]; }
      else if (hr.landT > 0) { hr.landT -= dt; cv = HF.land; const k = hr.landT / 0.13; sx = 1 + 0.08 * k; sy = 1 - 0.09 * k; }
      else {
        if (hr.moving) cv = HF.walk[Math.floor(hr.stride / 3.3 * 12) % 12];
        else { if (hr.frameT > 0.5) { hr.frameT = 0; hr.frame = (hr.frame + 1) % 2; } cv = HF.idle[hr.frame % 2]; }
      }
      // leve inclinação na direção do movimento e meia-passada suave entre quadros
      const lean = hr.swim ? Math.sin(this.t * 3) * .025 : hr.moving && !this.fish ? -.035 * hr.dir * (hr.sprinting ? 1.6 : 1) : 0;
      this.heroSprite.material.rotation += (lean - this.heroSprite.material.rotation) * Math.min(1, dt * 10);
      const softBob = hr.swim ? Math.sin(this.t * 3.4) * .035 : hr.moving && !air ? Math.abs(Math.sin(hr.stride / 3.3 * Math.PI * 4)) * 0.035 : 0;
      this.heroSprite.material.map = tex(cv);
      const hh = this.heroSprite.userData.h * (cv._k || 1); // quadros de pesca são maiores (cabe a vara)
      this.heroSprite.center.y = cv._cy ?? 0.02;
      // comer, beber ou guardar a arma: três pequenos 'mastigados' (barra rápida e zonas seguras)
      if (this.heroEatT > 0) { this.heroEatT -= dt; const k = Math.abs(Math.sin((.6 - this.heroEatT) / .6 * Math.PI * 3)); sx *= 1 + .04 * k; sy *= 1 - .06 * k; }
      this.heroSprite.scale.set(hh * cv.width / cv.height * hr.dir * sx, hh * sy, 1);
      this.heroSprite.position.set(hr.x, hr.y + hr.jump + softBob, hr.z);
      this.heroShadow.position.set(hr.x, hr.y + 0.05, hr.z);
      if (this.legendFx) {
        const hh = this.heroSprite.userData.h || 2.5;
        for (const p of this.legendFx.parts) { const u = p.userData; const a = u.a + this.t * u.s; const yy = ((u.y + this.t * 0.25 * u.s) % 1); p.position.set(hr.x + Math.cos(a) * u.r, hr.y + hr.jump + yy * hh * 0.95, hr.z + Math.sin(a) * u.r * 0.7); p.material.opacity = Math.sin(yy * Math.PI); }
        this.legendFx.ring.position.set(hr.x, hr.y + 0.07, hr.z); this.legendFx.ring.rotation.z = this.t * 0.8; this.legendFx.ring.material.opacity = 0.4 + Math.sin(this.t * 3) * 0.15;
      }
      this.heroShadow.scale.setScalar(1 - Math.min(0.5, hr.jump * 0.2));
      // o Eco segue atrás do herói (do lado oposto ao que ele olha, um pouco mais longe da câmera), flutuando
      if (this.ecoFx) {
        const F = this.ecoFx, yaw = this.cam.yaw;
        F.t += dt;
        const rx = Math.cos(yaw), rz = -Math.sin(yaw), ax = -Math.sin(yaw), az = -Math.cos(yaw);
        const tx = hr.x - rx * hr.dir * 1.05 + ax * 0.45, tz = hr.z - rz * hr.dir * 1.05 + az * 0.45;
        const ty = hr.y + hr.jump * 0.6 + 0.5 + Math.sin(F.t * 2.1) * 0.12;
        if (!F.pos) F.pos = new THREE.Vector3(tx, ty, tz);
        const k = Math.min(1, dt * 4.5);
        F.pos.x += (tx - F.pos.x) * k; F.pos.z += (tz - F.pos.z) * k; F.pos.y += (ty - F.pos.y) * Math.min(1, dt * 8);
        F.sprite.position.copy(F.pos);
        F.sprite.material.map = tex(F.frames[Math.floor(F.t * 1.6) % 2]);
        F.sprite.material.opacity = 0.78 + Math.sin(F.t * 3) * 0.06;
        F.glow.position.set(F.pos.x, F.pos.y + F.h * 0.5, F.pos.z);
        F.glow.material.opacity = 0.42 + Math.sin(F.t * 2.6) * 0.1;
      }
      // câmera
      // no ar alto (queda, planador), a câmera acompanha a altitude do herói
      hr.camY = U.lerp(hr.camY ?? 0, Math.max(0, hr.jump - 1.2), Math.min(1, dt * 6));
      const target = tmpV.set(hr.x, hr.y + 1.2 + hr.camY, hr.z);
      // na cidade, a câmera se aproxima quando um prédio fica entre ela e o herói
      let dist = this.cave ? Math.min(cam.dist, 11) : cam.dist;
      if (this.camBlockers && this.camBlockers.length) {
        const dir = cameraDir.set(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch));
        this._ray = this._ray || new THREE.Raycaster();
        this._ray.set(target, dir); this._ray.far = cam.dist;
        const hit = this._ray.intersectObjects(this.camBlockers, false)[0];
        if (hit) dist = Math.max(.65, hit.distance - .35);
        this._camDist = this._camDist === undefined ? dist : this._camDist + (dist - this._camDist) * Math.min(1, dt * (dist < this._camDist ? 14 : 3));
        dist = this._camDist;
      }
      // relevo entre a câmera e o herói (penhascos, cânions): a câmera chega mais perto, como no Genshin
      if (!this.cave) {
        const ux = Math.sin(cam.yaw) * Math.cos(cam.pitch), uz = Math.cos(cam.yaw) * Math.cos(cam.pitch), uy = Math.sin(cam.pitch);
        let lim = dist;
        for (let i = 1; i <= 14; i++) { const s = dist * i / 14; if (this.terrainAt(target.x + ux * s, target.z + uz * s) + 0.55 > target.y + uy * s) { lim = Math.max(1.6, s - 0.9); break; } }
        this._terrDist = this._terrDist === undefined ? lim : this._terrDist + (lim - this._terrDist) * Math.min(1, dt * (lim < this._terrDist ? 14 : 2.5));
        dist = Math.min(dist, this._terrDist);
      }
      const cx = target.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist;
      const cz = target.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist;
      let cy = target.y + Math.sin(cam.pitch) * dist;
      cy = Math.max(cy, this.terrainAt(cx, cz) + .8);
      if (this.cave) cy = Math.min(cy, target.y + 9);
      this.camera.position.lerp(cameraPos.set(cx, cy, cz), Math.min(1, dt * 8));
      this.camera.lookAt(target);
      // sol segue o herói (sombras)
      this.sun.position.set(hr.x + 30, hr.y + 50, hr.z - 40);
      this.sun.target.position.set(hr.x, hr.y, hr.z);
      // água e partículas
      this.water.material.uniforms.t.value = this.t;
      const mp = this.motes.geometry.attributes.position;
      for (let i = 0; i < mp.count; i++) {
        const bx = this.motesBase[i * 3], bz = this.motesBase[i * 3 + 2];
        // as luzinhas ficam numa janela de 120 m em volta do herói (o mapa é grande demais para enchê-lo todo)
        let x = bx + Math.sin(this.t * 0.3 + i) * 1.5, z = bz + Math.cos(this.t * 0.25 + i * 1.3) * 1.5;
        x = hr.x + ((((x - hr.x) % 120) + 180) % 120) - 60; z = hr.z + ((((z - hr.z) % 120) + 180) % 120) - 60;
        mp.setXYZ(i, x, this.sampleHeight(x, z) + 1.2 + Math.sin(this.t + i) * 0.8, z);
      }
      mp.needsUpdate = true;
      if (this.waypointObj) { this.waypointObj.crystal.rotation.y += dt * 1.2; this.waypointObj.ring.rotation.z += dt * 0.6; this.waypointObj.crystal.position.y = 4.6 + Math.sin(this.t * 2) * 0.15; }
      for (const n of this.npcs) { n.marker.position.y = n.y + 2.9 + Math.sin(this.t * 3) * 0.12; }
      for (const c of this.chests) if (c.glow) c.glow.material.opacity = 0.4 + Math.sin(this.t * 3 + c.i) * 0.2;
      this.terrain.material.userData.uniforms.uTime.value = this.t;
      if (this.fire) { const f = 0.8 + Math.sin(this.t * 17) * 0.1 + Math.sin(this.t * 7.3) * 0.1; this.fire.light.intensity = 2.2 * f; this.fire.flame.scale.set(1, f, 1); this.fire.flame2.scale.set(1, 2 - f, 1); }
      if (this.landmark) for (const fn of this.landmark.anim) fn(this.t);
      E.WX.updateLife(this, this.t, dt);
      if (this.reg.metro) E.Metro.update(this, this.t, dt);
      if (E.Shopfronts && E.Shopfronts.update) E.Shopfronts.update(this);
      if (E.Crowds) E.Crowds.update(this, dt);
      if (E.StallLife) E.StallLife.update(this, dt);
      if (E.Maritime) E.Maritime.update(this, dt);
      if (E.CasinoLife) E.CasinoLife.update(this, dt);
      if (E.Online) E.Online.tick(this, dt);
      for (const hb of this.herbs) { E.WX.animHerb(hb.group, this.t + hb.i); if (hb.beacon) hb.beacon.material.opacity = 0.16 + Math.sin(this.t * 2 + hb.i) * 0.06; }
      E.WX.animFishSpots(this, this.t);
      this.updateFishing(dt);
      E.WX.updateExtras(this, dt);
      if (E.WN3) E.WN3.update(this, dt);
      if (E.EX3) E.EX3.update(this, dt);
      if (this.lairBoss) { this.lairBoss.beam.material.opacity = 0.12 + Math.sin(this.t * 1.7) * 0.05; this.lairBoss.sprite.material.map = tex(this.lairBoss.frames[Math.floor(this.t * 1.3) % 2]); }
      if (this.storyObj) { if (this.storyObj.userData.bulbs) E.WX.animHerb(this.storyObj, this.t); else E.WX.animSeal(this.storyObj, this.t); }
      if (this.questSpotObj && this.questSpotObj.userData.rune) E.WX.animSeal(this.questSpotObj, this.t);
      if (this.beam) this.beam.material.opacity = 0.18 + Math.sin(this.t * 2) * 0.06;
      this.updateCamps(dt);
      this.updateInteract();
      // salva posição de vez em quando
      if (this.t >= (this.nextPositionSave || 0)) { this.nextPositionSave = this.t + 2; E.state.world.pos = { x: hr.x, z: hr.z }; E.state.world.region = this.id; }
    }

    updateCamps(dt) {
      const hr = this.hero;
      for (const c of this.camps) {
        if (c.dead) continue;
        const d = Math.hypot(hr.x - c.x, hr.z - c.z);
        const wasAggro = c.aggro;
        c.aggro = !WG.locked && d < 9 && !E.state.settings.peaceful && !(E.Zones && E.Zones.safe);
        if (c.aggro && !wasAggro) U.emit('world:aggro', c);
        c.alert.visible = c.aggro;
        let cx = 0, cz = 0;
        for (const m of c.mobs) {
          m.phase += dt;
          let tx, tz;
          if (c.aggro) { tx = hr.x; tz = hr.z; }
          else { tx = m.hx + Math.sin(m.phase * 0.4) * 1.5; tz = m.hz + Math.cos(m.phase * 0.33) * 1.5; }
          const dx = tx - m.x, dz = tz - m.z, l = Math.hypot(dx, dz);
          const sp = c.aggro ? 4.4 : 0.9;
          if (l > 0.05) { m.x += dx / l * Math.min(l, sp * dt); m.z += dz / l * Math.min(l, sp * dt); }
          const y = this.terrainAt(m.x, m.z);
          const bob = Math.abs(Math.sin(m.phase * (c.aggro ? 10 : 3))) * (c.aggro ? 0.15 : 0.05);
          m.sprite.position.set(m.x, Math.max(y, this.waterLevel - 0.2) + bob, m.z);
          m.shadow.position.set(m.x, Math.max(y, this.waterLevel - 0.2) + 0.05, m.z);
          const fi = Math.floor(m.phase * 2) % 2;
          m.sprite.material.map = tex(m.frames[fi]);
          // vira para o herói
          const sx = (hr.x - m.x) * Math.cos(this.cam.yaw) - (hr.z - m.z) * Math.sin(this.cam.yaw);
          const sw = Math.abs(m.sprite.scale.x);
          m.sprite.scale.x = (sx > 0 ? 1 : -1) * sw; // os sprites de monstro olham para a direita
          cx += m.x; cz += m.z;
          if (Math.hypot(hr.x - m.x, hr.z - m.z) < 1.25 && c.aggro && !WG.locked) { WG.locked = true; U.emit('world:encounter', c); return; }
        }
        c.alert.position.set(cx / c.mobs.length, this.terrainAt(cx / c.mobs.length, cz / c.mobs.length) + 3.4 + Math.sin(this.t * 6) * 0.1, cz / c.mobs.length);
      }
    }
    clearCamp(c, opts = {}) {
      c.dead = true;
      for (const m of c.mobs) { this.scene.remove(m.sprite); this.scene.remove(m.shadow); this.retire(m.sprite); this.retire(m.shadow); }
      this.scene.remove(c.alert); this.retire(c.alert);
      if (opts.remote || c.temp) return; // acampamentos de eventos não ficam salvos
      if (!(E.CoopWorld && E.CoopWorld.guest)) { const st = E.state.world; st.cleared[this.id] = st.cleared[this.id] || {}; st.cleared[this.id][c.i] = Date.now(); }
      if (E.CoopWorld) E.CoopWorld.onCampCleared(this.id, c.i);
    }
    // inimigos recuam depois de uma fuga
    pushBack(c) {
      for (const m of c.mobs) { m.x = m.hx; m.z = m.hz; }
      const hr = this.hero, dx = hr.x - c.x, dz = hr.z - c.z, l = Math.hypot(dx, dz) || 1;
      hr.x = c.x + dx / l * 12; hr.z = c.z + dz / l * 12;
    }

    updateInteract() {
      const hr = this.hero;
      const near = this.interactables.filter((it) => Math.hypot(it.x - hr.x, it.z - hr.z) < it.r).sort((a, b) => Math.hypot(a.x - hr.x, a.z - hr.z) - Math.hypot(b.x - hr.x, b.z - hr.z));
      if (!near.some((it) => it.kind === 'fish') && E.EX3 && E.EX3.shoreFishing) { const shore = E.EX3.shoreFishing(this); if (shore) near.push(shore); }
      const key = near.map((n) => n.kind + n.id + n.label).join('|');
      if (key !== this.nearKey) { this.nearKey = key; this.near = near; U.emit('world:near', near); }
    }
    retire(object) {
      if (!object) return;
      (this.retiredObjects || (this.retiredObjects = [])).push(object);
      object.traverse((o) => { for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) m.dispose(); });
    }
    removeInteractable(it, keepGroup) {
      this.interactables = this.interactables.filter((x) => x !== it);
      if (it.obj) { if (!keepGroup) { this.scene.remove(it.obj.group); this.retire(it.obj.group); } if (it.obj.glow) { this.scene.remove(it.obj.glow); this.retire(it.obj.glow); } it.obj.glow = null; }
      this.chests = this.chests.filter((c) => c !== it.obj);
      if (it.obj && it.obj.beacon) { this.scene.remove(it.obj.beacon); this.retire(it.obj.beacon); it.obj.beacon = null; }
      this.herbs = this.herbs.filter((c) => c !== it.obj);
      this.nearKey = null;
    }
    // posição na tela de um ponto do mundo
    project(x, y, z) {
      const v = new THREE.Vector3(x, y, z).project(this.camera);
      return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight, behind: v.z > 1 };
    }
    dispose() {
      if (E.WorldServices) E.WorldServices.close();
      if (E.Crowds && E.Crowds.dispose) E.Crowds.dispose(this);
      if (E.StallLife && E.StallLife.dispose) E.StallLife.dispose(this);
      if (E.Maritime && E.Maritime.dispose) E.Maritime.dispose(this);
      if (E.CasinoLife && E.CasinoLife.dispose) E.CasinoLife.dispose(this);
      disposeScene([this.scene, ...(this.retiredObjects || [])]);
      this.retiredObjects = [];
    }
  }

  // ============================================================ ARENA DE COMBATE
  class Arena {
    constructor(regionId, battle) {
      const reg = E.WD.reg ? E.WD.reg(regionId) : E.WD.REGIONS[regionId];
      this.B = E.WD.BIOMES[reg.biome];
      this.battle = battle;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 500);
      this.t = 0;
      this.fx = [];
      this.shake = 0;
      this.units = {};
      this.build(reg);
    }
    build(reg) {
      const B = this.B, sc = this.scene, rng = U.seeded(reg.seed + 5);
      sc.fog = B.cave ? new THREE.Fog(B.fog, 10, 48) : new THREE.Fog(B.fog, 18, 70);
      sc.background = col(B.cave ? B.fog : B.sky[1]);
      if (!B.cave) sc.add(makeSky(B));
      sc.add(new THREE.HemisphereLight(col(B.sky[0]), col(E.SP.shade(B.ground[0], -0.4)), 1.0));
      const sun = new THREE.DirectionalLight(col(B.light), B.night ? 1 : 2.1);
      sun.position.set(8, 16, 6); sun.castShadow = E.state.settings.quality === 'alto';
      sun.shadow.mapSize.set(1024, 1024);
      const s = sun.shadow.camera; s.left = -14; s.right = 14; s.top = 14; s.bottom = -14;
      sc.add(sun);
      // chão (grade suave com colinas ao fundo)
      const noise = makeNoise(reg.seed + 9);
      const gp = new THREE.PlaneGeometry(90, 90, 90, 90);
      gp.rotateX(-Math.PI / 2);
      const P = gp.attributes.position;
      for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i), d = Math.hypot(x, z * 1.2); P.setY(i, d < 10 ? 0 : noise.fbm(x * 0.07, z * 0.07, 3) * 2.2 * U.clamp((d - 10) / 8, 0, 1) + U.clamp((d - 22) / 10, 0, 1) * 5); }
      gp.computeVertexNormals();
      const cols = new Float32Array(P.count * 3);
      const c0 = col(B.ground[0]), c1 = col(B.ground[1]), c2 = col(B.ground[2]), tmp = new THREE.Color();
      for (let i = 0; i < P.count; i++) { const v = noise.fbm(P.getX(i) * 0.09, P.getZ(i) * 0.09, 3) * 0.5 + 0.5; tmp.copy(c0).lerp(c1, U.clamp(v * 1.4, 0, 1)).lerp(c2, U.clamp((v - 0.6) * 2.5, 0, 1)); cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b; }
      gp.setAttribute('color', new THREE.BufferAttribute(cols, 3));
      const ground = new THREE.Mesh(gp, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
      ground.receiveShadow = true;
      sc.add(ground);
      // grama
      if (!['astral', 'abyss', 'market', 'cave'].includes(reg.biome)) {
        const n = E.state.settings.quality === 'baixo' ? 500 : 1400;
        const im = new THREE.InstancedMesh(grassGeo(E.SP.mix(B.ground[1], B.ground[2], 0.5)), new THREE.MeshStandardMaterial({ vertexColors: true }), n);
        const d2 = new THREE.Object3D();
        for (let i = 0; i < n; i++) { const a = rng() * 6.28, r = 2 + Math.sqrt(rng()) * 26; d2.position.set(Math.cos(a) * r, 0, Math.sin(a) * r - 4); d2.rotation.y = rng() * 6; d2.scale.setScalar(0.8 + rng() * 0.9); d2.updateMatrix(); im.setMatrixAt(i, d2.matrix); }
        sc.add(im);
      }
      // anel mágico no chão
      const ring = new THREE.Mesh(new THREE.RingGeometry(7.6, 7.8, 64), new THREE.MeshBasicMaterial({ color: '#ffe9a8', transparent: true, opacity: 0.35, toneMapped: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03;
      sc.add(ring);
      // objetos em volta
      const dummy = new THREE.Object3D();
      const types = B.props.filter((t) => !['house', 'tent', 'lamp', 'crate'].includes(t));
      for (const type of types) {
        const def = propDef(type, B);
        const n = 10;
        for (const [geo, glow] of [[def.solid, false], [def.glow, true]]) {
          if (!geo) continue;
          const im = new THREE.InstancedMesh(geo, glow ? new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }) : new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true }), n);
          const r2 = U.seeded(type.length * 13 + reg.seed);
          for (let i = 0; i < n; i++) { const a = Math.PI + r2() * Math.PI, r = 12 + r2() * 14; const x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 2; dummy.position.set(x, 0, z); dummy.rotation.y = r2() * 6; dummy.scale.setScalar(0.9 + r2() * 0.8); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }
          im.castShadow = !glow;
          sc.add(im);
        }
      }
      // vaga-lumes
      const n = 60, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { pos[i * 3] = (rng() - 0.5) * 24; pos[i * 3 + 1] = rng() * 5; pos[i * 3 + 2] = (rng() - 0.5) * 16; }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.motes = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.25, map: radialTex('#fff6c8'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      sc.add(this.motes);
      this.portrait = innerWidth / innerHeight < 0.9;
      this.camBase = this.portrait ? new THREE.Vector3(0.2, 6.0, 13.0) : new THREE.Vector3(1.2, 5.0, 13.5);
      this.camLook = this.portrait ? new THREE.Vector3(0, 0.2, 0) : new THREE.Vector3(1.0, 0.9, -0.6);
      this.camera.fov = this.portrait ? 52 : 38;
      this.camera.updateProjectionMatrix();
      this.camera.position.copy(this.camBase);
      this.camera.lookAt(this.camLook);
    }
    unitSize(def) { return ({ Miúdo: 1.2, Pequeno: 1.6, Médio: 2.3, Grande: 3.7, Enorme: 5.0 }[def.size] || 2.3) * (def.scale || 1) * WG.spriteVis(def); }
    addHero(h) {
      const wt = E.SP.heroWeaponType(h);
      const frames = { idle: [E.SP.hero(h, 'idle0', wt), E.SP.hero(h, 'idle1', wt)], atk: E.SP.hero(h, 'atk', wt), walk: E.SP.hero(h, 'walk0', wt) };
      const hh = WG.heroHeight(h) * 1.12;
      const sp = this.makeSprite(frames.idle[0], hh);
      sp.scale.x *= -1; // olha para a esquerda
      const home = this.portrait ? new THREE.Vector3(1.5, 0, 2.0) : new THREE.Vector3(3.0, 0, 0.4);
      sp.position.copy(home);
      this.scene.add(sp);
      this.units.hero = { sprite: sp, frames, home, h: hh, flip: -1, shadow: this.shadow(home, 0.7) };
      // Eco: atrás do herói, flutuando
      const e = E.Eco && E.Eco.equipped(h);
      if (e && E.ECOART) {
        const idle = E.ECOART.draw(e.art || e.id), eh = hh * 0.95;
        const es = this.makeSprite(idle, eh); es.material.opacity = 0.85; es.material.depthWrite = false;
        const ehome = home.clone().add(new THREE.Vector3(1.1, 0.55, -0.9));
        es.position.copy(ehome);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(e.def.look.aura), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }));
        glow.scale.setScalar(eh * 1.3);
        this.scene.add(glow, es);
        this.eco = { sprite: es, glow, home: ehome, h: eh, idle: [idle, E.ECOART.draw(e.art || e.id, 'idle1')], punch: E.ECOART.draw(e.art || e.id, 'punch'), color: e.def.look.aura, busy: false };
        for (const c of [...this.eco.idle, this.eco.punch]) E.ECOART.onReady(c, (r) => { tex(r).needsUpdate = true; });
      }
    }
    // Investida do Eco: voa até o alvo, chuva de socos e volta
    async ecoRush(target, color) {
      const ec = this.eco, t = this.units[target];
      if (!ec || !t) return;
      ec.busy = true;
      const from = ec.sprite.position.clone(), to = t.sprite.position.clone().lerp(this.units.hero.home, 0.28);
      to.y = t.h * 0.15;
      ec.sprite.material.map = tex(ec.punch);
      await this.tween(240, (k) => { ec.sprite.position.lerpVectors(from, to, U.ease.outCubic(k)); ec.glow.position.copy(ec.sprite.position).add(new THREE.Vector3(0, ec.h * 0.5, 0)); });
      const c = t.sprite.position.clone();
      await this.tween(900, (k) => {
        ec.sprite.position.x = to.x + Math.sin(k * 70) * 0.14; ec.sprite.position.y = to.y + Math.cos(k * 55) * 0.06;
        if (Math.random() < 0.55) this.burst(c.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.3, t.h * (0.25 + Math.random() * 0.55), (Math.random() - 0.5) * 0.7)), Math.random() < 0.4 ? '#ffffff' : (color || ec.color), 5);
        t.sprite.position.x = t.home.x + Math.sin(k * 90) * 0.08;
      });
      t.sprite.position.x = t.home.x;
      this.burst(c.clone().add(new THREE.Vector3(0, t.h * 0.5, 0)), color || ec.color, 40);
      ec.sprite.material.map = tex(ec.idle[0]);
      await this.tween(320, (k) => { ec.sprite.position.lerpVectors(to, ec.home, U.ease.inOutCubic(k)); ec.glow.position.copy(ec.sprite.position).add(new THREE.Vector3(0, ec.h * 0.5, 0)); });
      ec.busy = false;
    }
    // aliado do modo online, ao lado do herói
    addAlly(a, idx) {
      const look = E.CH.normalize(a.look, a.cls, a.species);
      const wi = a.weapon || {};
      const draw = (f) => E.CH.draw({ look, species: a.species, frame: f, weaponType: wi.type, weaponColor: { c1: wi.c1 || '#dfe6ee', c2: wi.c2 || '#d4af37', shape: wi.shape || null }, weaponRarity: wi.rar || 1 });
      // companheiro do grupo local: usa o sprite completo do próprio herói (com a arte da arma)
      const own = a.local && E.state.heroes.find((x) => x.id === a.heroId);
      const frames = own ? [E.SP.hero(own, 'idle0', E.SP.heroWeaponType(own)), E.SP.hero(own, 'idle1', E.SP.heroWeaponType(own))] : [draw('idle0'), draw('idle1')];
      const hh = own ? WG.heroHeight(own) * 1.12 : 2.5 * 1.12 * WG.speciesScale(a.species) * ((look && look.height) || 1);
      const sp = this.makeSprite(frames[0], hh);
      sp.scale.x *= -1;
      const spots = this.portrait ? [[3.4, 0.2], [-0.6, 3.6], [3.8, 3.4]] : [[5.0, -2.6], [5.2, 2.9], [6.6, 0.0]];
      const [x, z] = spots[idx % spots.length];
      const home = new THREE.Vector3(x, 0, z);
      sp.position.copy(home);
      this.scene.add(sp);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: a.local && E.Portrait ? E.Portrait.element(a) : '#7fd8ff', transparent: true, opacity: 0.6, toneMapped: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.05, z); this.scene.add(ring);
      this.units[a.uid] = { sprite: sp, frames, home, h: hh, flip: -1, shadow: this.shadow(home, 0.6), allyRing: ring };
    }
    downUnit(uid) { const u = this.units[uid]; if (!u) return; return this.tween(500, (k) => { u.sprite.material.rotation = k * Math.PI / 2 * 0.95; u.sprite.position.y = -k * 0.2; }); }
    addEnemy(e, idx, total) {
      const def = e.def;
      const size = this.unitSize(def) * (def.boss ? 1.3 : 1);
      const cv = E.SP.monster(e.key), cv2 = E.SP.monster(e.key, 'idle1');
      const sp = this.makeSprite(cv, size);
      const flip = 1; // os inimigos ficam à esquerda e os sprites já olham para a direita
      const cols = Math.min(total, 4);
      // espaçamento cresce com a maior criatura da luta (ogros e trolls não se sobrepõem)
      const cur = E.BattleUI && E.BattleUI.current, all = cur && cur.enemies ? cur.enemies.filter((x) => !x.def.boss) : [];
      const maxS = Math.max(2.3, ...all.filter((x) => this.unitSize(x.def) <= 4.3).map((x) => this.unitSize(x.def)));
      const f = U.clamp(maxS / 2.6, 1, 1.45);
      let x, z;
      if (this.portrait) { const n = Math.min(total, 4); x = (idx - (n - 1) / 2) * 2.0 * f - 0.6; z = -1.2 - (idx % 2) * 1.0 * f - Math.floor(idx / 4) * 1.4; }
      else {
        // vagas em profundidade (frente, fundo-esquerda, fundo-direita…) para ninguém esconder ninguém
        const SL = [[-2.0, 0.6], [-4.6, -1.7], [-1.0, -2.6], [-6.0, 0.5], [-3.4, -4.0], [-6.6, -3.4]];
        const [sx, sz] = SL[idx % SL.length];
        x = -1.5 + (sx + 1.5) * f - Math.floor(idx / SL.length) * 0.8; z = sz * f - (f - 1) * 1.0 + (cols === 1 ? 0.2 : 0);
      }
      // criaturas enormes (dragões, gigantes) ficam no fundo da arena para caberem na tela
      const big = !def.boss && size > 4.3;
      if (big) { this._bigN = (this._bigN || 0) + 1; const k = this._bigN - 1; x = this.portrait ? -0.6 + k * 2.6 : -2.8 - k * 3.4; z = -5.4 - (size - 5) * 0.7 - k * 0.6; }
      const home = new THREE.Vector3(def.boss ? (this.portrait ? -0.6 : -3.6) : x, 0, def.boss ? -5.5 - Math.max(0, size - 6.5) * 0.6 : z);
      sp.position.copy(home);
      this.scene.add(sp);
      const ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.32, size * 0.38, 40), new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(home.x, 0.05, home.z);
      this.scene.add(ring);
      let aura = null;
      let bossFx = null;
      if (def.boss) {
        const bc = def.bossColor || def.pal[2] || '#9b4dff';
        aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(bc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 }));
        aura.scale.set(size * 1.7, size * 1.7, 1); aura.position.set(home.x, size * 0.5, home.z - 0.3); this.scene.add(aura);
        // círculo rúnico girando no chão + luz pulsante + brasas que sobem
        const rune = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.9, size * 1.9), new THREE.MeshBasicMaterial({ map: runeCircleTex(bc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
        rune.rotation.x = -Math.PI / 2; rune.position.set(home.x, 0.06, home.z);
        this.scene.add(rune);
        const light = new THREE.PointLight(bc, 6, size * 4, 2); light.position.set(home.x, size * 0.6, home.z + 1);
        this.scene.add(light);
        bossFx = { rune, light, color: bc, acc: 0 };
        this.embers = this.embers || [];
      }
      this.units[e.uid] = { sprite: sp, frames: [cv, cv2], home, h: size, flip, ring, aura, bossFx, shadow: this.shadow(home, size * 0.28) };
      // entrada: surge do chão
      sp.position.y = -size;
      this.tween(500, (t) => { sp.position.y = -size * (1 - U.ease.outBack(t)); });
    }
    shadow(p, r) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.3, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.set(p.x, 0.04, p.z);
      this.scene.add(m);
      return m;
    }
    makeSprite(cv, height) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(cv), transparent: true, alphaTest: 0.5 }));
      sp.center.set(0.5, 0.02);
      sp.scale.set(height * cv.width / cv.height, height, 1);
      sp.castShadow = true;
      return sp;
    }
    select(uid) {
      for (const [id, u] of Object.entries(this.units)) if (u.ring) u.ring.material.opacity = id === uid ? 0.9 : 0;
      this.selected = uid;
    }
    tween(ms, fn) { return new Promise((res) => { this.fx.push({ t0: performance.now(), ms, fn, res }); }); }
    project(uid, yOff = 1) {
      const u = this.units[uid];
      if (!u) return { x: innerWidth / 2, y: innerHeight / 2 };
      const v = new THREE.Vector3(u.sprite.position.x, u.sprite.position.y + u.h * yOff, u.sprite.position.z).project(this.camera);
      return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
    }
    // ------------------------------------------------ efeitos
    async melee(actor, target) {
      const a = this.units[actor], t = this.units[target];
      if (!a || !t) return;
      if (actor === 'hero') a.sprite.material.map = tex(a.frames.walk);
      const from = a.home.clone(), to = t.sprite.position.clone().lerp(from, 0.35);
      to.y = 0;
      await this.tween(220, (k) => { a.sprite.position.lerpVectors(from, to, U.ease.outCubic(k)); a.sprite.position.y = Math.sin(k * Math.PI) * 0.6; });
      if (actor === 'hero') a.sprite.material.map = tex(a.frames.atk);
      this.slash(t.sprite.position, actor === 'hero' ? '#ffffff' : '#ff8a8a');
      await U.wait(110);
      this.tween(260, (k) => { a.sprite.position.lerpVectors(to, from, U.ease.inOutCubic(k)); }).then(() => { if (actor === 'hero') a.sprite.material.map = tex(a.frames.idle[0]); });
    }
    async projectile(actor, target, color = '#ffd36b', big = false) {
      const a = this.units[actor], t = this.units[target];
      if (!a || !t) return;
      if (actor === 'hero') a.sprite.material.map = tex(a.frames.atk);
      const from = a.sprite.position.clone().add(new THREE.Vector3(0, a.h * 0.55, 0));
      const to = t.sprite.position.clone().add(new THREE.Vector3(0, t.h * 0.5, 0));
      const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      orb.scale.setScalar(big ? 1.6 : 0.9);
      this.scene.add(orb);
      const trail = [];
      await this.tween(big ? 420 : 320, (k) => {
        orb.position.lerpVectors(from, to, k); orb.position.y += Math.sin(k * Math.PI) * 0.8;
        if (Math.random() < 0.7) { const p = this.spark(orb.position, color, 0.5); trail.push(p); }
      });
      this.scene.remove(orb);
      this.burst(to, color, big ? 40 : 22);
      if (actor === 'hero') setTimeout(() => { a.sprite.material.map = tex(a.frames.idle[0]); }, 200);
    }
    aoe(color) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.6, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(-3, 0.1, 0);
      this.scene.add(ring);
      for (const [id, u] of Object.entries(this.units)) if (id !== 'hero') this.burst(u.sprite.position.clone().add(new THREE.Vector3(0, u.h * 0.5, 0)), color, 26);
      return this.tween(600, (k) => { ring.scale.setScalar(1 + k * 14); ring.material.opacity = 0.9 * (1 - k); }).then(() => this.scene.remove(ring));
    }
    aura(uid, color) {
      const u = this.units[uid]; if (!u) return;
      const c = u.sprite.position.clone();
      for (let i = 0; i < 26; i++) {
        const p = this.spark(c.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.4, Math.random() * 0.5, (Math.random() - 0.5) * 1.4)), color, 0.45);
        p.v.set((Math.random() - 0.5) * 0.4, 2 + Math.random() * 2, (Math.random() - 0.5) * 0.4);
      }
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(c.x, 0.08, c.z);
      this.scene.add(ring);
      return this.tween(700, (k) => { ring.scale.setScalar(1 + k * 2); ring.material.opacity = 0.9 * (1 - k); }).then(() => this.scene.remove(ring));
    }
    spark(pos, color, size = 0.4) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      s.position.copy(pos); s.scale.setScalar(size);
      s.v = new THREE.Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3);
      s.life = 0.6 + Math.random() * 0.4; s.age = 0;
      this.scene.add(s);
      (this.sparks = this.sparks || []).push(s);
      return s;
    }
    burst(pos, color, n = 20) { for (let i = 0; i < n; i++) { const s = this.spark(pos, color, 0.3 + Math.random() * 0.4); s.v.multiplyScalar(1.6); } }
    slash(pos, color) {
      const c = pos.clone(); c.y += 1.2;
      const m = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.07, 4, 24, Math.PI), new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false, depthWrite: false }));
      m.position.copy(c); m.rotation.set(0.2, 0.3, -0.8);
      this.scene.add(m);
      this.burst(c, color, 14);
      this.tween(260, (k) => { m.rotation.z = -0.8 + k * 2.2; m.material.opacity = 1 - k; m.scale.setScalar(1 + k * 0.4); }).then(() => this.scene.remove(m));
    }
    // golpe de arma ★5: cruz de luz, raios, onda no chão e clarão na cor da arma
    async legendStrike(target, c1, c2) {
      const t = this.units[target]; if (!t) return;
      const c = t.sprite.position.clone(); c.y += t.h * 0.5;
      const mats = [];
      const arc = (rz, color) => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.11, 4, 32, Math.PI * 1.2), new THREE.MeshBasicMaterial({ color, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); m.position.copy(c); m.rotation.set(0.15, 0.25, rz); this.scene.add(m); mats.push(m); return m; };
      const a1 = arc(-0.9, c1), a2 = arc(2.3, c2 || '#fff6d0');
      const rays = [];
      for (let i = 0; i < 10; i++) {
        const r = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 3.2), new THREE.MeshBasicMaterial({ color: i % 2 ? c1 : '#ffffff', transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
        r.position.copy(c); r.rotation.z = i / 10 * Math.PI * 2; r.lookAt(this.camera.position); r.rotateZ(i / 10 * Math.PI * 2);
        this.scene.add(r); rays.push(r);
      }
      const wave = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.55, 48), new THREE.MeshBasicMaterial({ color: c1, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      wave.rotation.x = -Math.PI / 2; wave.position.set(c.x, 0.1, c.z); this.scene.add(wave);
      for (let i = 0; i < 46; i++) { const s = this.spark(c, i % 3 ? c1 : '#ffffff', 0.35 + Math.random() * 0.4); s.v.multiplyScalar(2.2); }
      this.shake = 0.45;
      await this.tween(520, (k) => {
        a1.rotation.z = -0.9 + k * 1.6; a2.rotation.z = 2.3 - k * 1.6;
        a1.material.opacity = a2.material.opacity = 1 - k; a1.scale.setScalar(1 + k * 0.5); a2.scale.setScalar(1 + k * 0.5);
        rays.forEach((r) => { r.scale.y = 0.3 + k * 1.6; r.material.opacity = (1 - k) * 0.9; });
        wave.scale.setScalar(1 + k * 9); wave.material.opacity = 1 - k;
      });
      [a1, a2, wave, ...rays].forEach((m) => this.scene.remove(m));
    }
    async hit(uid, crit) {
      const u = this.units[uid]; if (!u) return;
      this.shake = crit ? 0.5 : 0.18;
      const base = u.sprite.position.x;
      u.sprite.material.color.setRGB(3, 3, 3);
      await this.tween(240, (k) => { u.sprite.position.x = base + Math.sin(k * 30) * 0.12 * (1 - k); if (k > 0.35) u.sprite.material.color.setRGB(1, 1 - (1 - k) * 0.5, 1 - (1 - k) * 0.5); });
      u.sprite.material.color.setRGB(1, 1, 1);
      u.sprite.position.x = u.home.x;
    }
    async death(uid) {
      const u = this.units[uid]; if (!u) return;
      this.burst(u.sprite.position.clone().add(new THREE.Vector3(0, u.h * 0.5, 0)), '#ffffff', 34);
      if (u.ring) u.ring.material.opacity = 0;
      await this.tween(700, (k) => { u.sprite.material.opacity = 1 - k; u.sprite.position.y = -k * 0.4; u.sprite.material.color.setRGB(1 + k * 2, 1 + k * 2, 1 + k * 2); if (u.shadow) u.shadow.material.opacity = 0.3 * (1 - k); if (u.aura) u.aura.material.opacity = 0.6 * (1 - k); });
      u.sprite.visible = false;
    }
    async down() {
      const u = this.units.hero; if (!u) return;
      await this.tween(500, (k) => { u.sprite.material.rotation = -k * Math.PI / 2 * 0.95; u.sprite.position.y = -k * 0.2; });
    }
    revive() { const u = this.units.hero; if (u) { u.sprite.material.rotation = 0; u.sprite.position.y = 0; } }
    update(dt) {
      this.t += dt;
      const now = performance.now();
      this.fx = this.fx.filter((f) => { const k = Math.min(1, (now - f.t0) / f.ms); f.fn(k); if (k >= 1) { f.res(); return false; } return true; });
      if (this.sparks) this.sparks = this.sparks.filter((s) => { s.age += dt; s.v.y -= 2.5 * dt; s.position.addScaledVector(s.v, dt); s.material.opacity = 1 - s.age / s.life; if (s.age >= s.life) { this.scene.remove(s); s.material.dispose(); return false; } return true; });
      if (this.eco && !this.eco.busy) { const ec = this.eco; ec.sprite.position.y = ec.home.y + Math.sin(this.t * 2.2) * 0.12; ec.sprite.material.map = tex(ec.idle[Math.floor(this.t * 1.6) % 2]); ec.glow.position.copy(ec.sprite.position).add(new THREE.Vector3(0, ec.h * 0.5, 0)); ec.glow.material.opacity = 0.4 + Math.sin(this.t * 2.8) * 0.12; }
      // respiração
      for (const [id, u] of Object.entries(this.units)) {
        if (id !== 'hero' && u.frames && u.sprite.visible && !this.fx.length) u.sprite.material.map = tex(u.frames[Math.abs(Math.floor(this.t * 1.6 + u.home.x * 3)) % 2]);
        if (id === 'hero' && !this.fx.length && u.sprite.material.rotation === 0) u.sprite.material.map = tex(u.frames.idle[Math.floor(this.t * 1.8) % 2]);
        if (u.ring && u.ring.material.opacity > 0) u.ring.material.opacity = 0.6 + Math.sin(this.t * 5) * 0.3;
        if (u.aura) u.aura.material.rotation += dt * 0.3;
        if (u.bossFx && u.sprite.visible) {
          const f = u.bossFx;
          f.rune.rotation.z += dt * 0.35;
          f.rune.material.opacity = 0.65 + Math.sin(this.t * 2.2) * 0.25;
          f.light.intensity = 5 + Math.sin(this.t * 3.1) * 2;
          f.acc += dt;
          while (f.acc > 0.05) {
            f.acc -= 0.05;
            const a = Math.random() * Math.PI * 2, r = u.h * (0.2 + Math.random() * 0.45);
            const em = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex(Math.random() < 0.35 ? '#ffffff' : f.color), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
            em.position.set(u.home.x + Math.cos(a) * r, 0.1, u.home.z + Math.sin(a) * r * 0.6);
            em.scale.setScalar(0.15 + Math.random() * 0.25);
            em.v = 1.2 + Math.random() * 1.8; em.age = 0; em.life = 1.4 + Math.random(); em.ph = Math.random() * 6;
            this.scene.add(em); this.embers.push(em);
          }
        } else if (u.bossFx && !u.sprite.visible && u.bossFx.rune.visible) { u.bossFx.rune.visible = false; u.bossFx.light.intensity = 0; }
      }
      if (this.embers) this.embers = this.embers.filter((m) => { m.age += dt; m.position.y += m.v * dt; m.position.x += Math.sin(this.t * 2 + m.ph) * dt * 0.3; m.material.opacity = Math.min(1, m.age * 3) * (1 - m.age / m.life); if (m.age >= m.life) { this.scene.remove(m); m.material.dispose(); return false; } return true; });
      // câmera com balanço suave + tremor
      const sway = new THREE.Vector3(Math.sin(this.t * 0.25) * 0.6, Math.sin(this.t * 0.4) * 0.15, 0);
      if (this.camOverride) { this.camera.position.copy(this.camOverride.pos); this.camera.lookAt(this.camOverride.look); return this.tickMotes(dt); }
      this.camera.position.copy(this.camBase).add(sway);
      if (this.shake > 0) { this.camera.position.x += (Math.random() - 0.5) * this.shake; this.camera.position.y += (Math.random() - 0.5) * this.shake; this.shake = Math.max(0, this.shake - dt * 1.6); }
      this.camera.lookAt(this.camLook);
      this.tickMotes(dt);
    }
    tickMotes(dt) {
      const mp = this.motes.geometry.attributes.position;
      for (let i = 0; i < mp.count; i++) mp.setY(i, (mp.getY(i) + dt * 0.3) % 5);
      mp.needsUpdate = true;
    }
    // apresentação do chefe: câmera começa colada nele e recua até a posição de combate
    async bossIntro(uid, ms = 2600) {
      const u = this.units[uid]; if (!u) return;
      const look0 = new THREE.Vector3(u.home.x, u.h * 0.62, u.home.z);
      const pos0 = new THREE.Vector3(u.home.x + 2.2, u.h * 0.45, u.home.z + u.h * 1.15);
      const pos1 = new THREE.Vector3(u.home.x + 1.0, u.h * 0.75, u.home.z + u.h * 1.5);
      this.camOverride = { pos: pos0.clone(), look: look0.clone() };
      await this.tween(ms * 0.62, (k) => { const e = U.ease.inOutCubic(k); this.camOverride.pos.lerpVectors(pos0, pos1, e); });
      this.shake = 0.6;
      E.Audio && E.Audio.sfx('aggro');
      const end = this.camBase.clone();
      const from = this.camOverride.pos.clone(), lfrom = this.camOverride.look.clone();
      await this.tween(ms * 0.38, (k) => { const e = U.ease.inOutCubic(k); this.camOverride.pos.lerpVectors(from, end, e); this.camOverride.look.lerpVectors(lfrom, this.camLook, e); });
      this.camOverride = null;
    }
    dispose() { disposeScene(this.scene); }
  }

  // ============================================================ TELA TÍTULO (cenário animado)
  class TitleScene {
    constructor() {
      this.w = new World('bosque');
      this.camera = this.w.camera;
      this.t = 0;
      this.w.heroSprite.visible = false;
      this.w.heroShadow.visible = false;
    }
    update(dt) {
      this.t += dt;
      const w = this.w, a = this.t * 0.04;
      w.t += dt;
      w.water.material.uniforms.t.value = w.t;
      const r = 26, x = Math.cos(a) * r, z = Math.sin(a) * r;
      this.camera.position.set(x, w.height(x, z) + 7, z);
      this.camera.lookAt(0, 3, 0);
      const mp = w.motes.geometry.attributes.position;
      for (let i = 0; i < mp.count; i++) { const bx = w.motesBase[i * 3], bz = w.motesBase[i * 3 + 2]; const xx = bx + Math.sin(w.t * 0.3 + i) * 1.5, zz = bz + Math.cos(w.t * 0.25 + i * 1.3) * 1.5; mp.setXYZ(i, xx, w.sampleHeight(xx, zz) + 1.2 + Math.sin(w.t + i) * 0.8, zz); }
      mp.needsUpdate = true;
      if (w.waypointObj) { w.waypointObj.crystal.rotation.y += dt; w.waypointObj.ring.rotation.z += dt * 0.6; }
    }
  }

  // ============================================================ loop
  function loop(now = performance.now()) {
    raf = requestAnimationFrame(loop);
    if (document.hidden || mode === 'idle') { lastTick = lastFrame = now; frameBudget = 0; clock.getDelta(); return; }
    const diceActive = E.Dice && E.Dice.isActive && E.Dice.isActive();
    const covered = (mode === 'world' || mode === 'interior') && E.UI && E.UI.anyOpen();
    // Background scenery remains gently animated behind menus, without running at full refresh.
    const interval = covered || diceActive ? 50 : mode === 'title' ? 1000 / 30 : 1000 / 60;
    frameBudget += now - (lastTick || now); lastTick = now;
    if (frameBudget < interval - .5) return;
    frameBudget = Math.max(0, frameBudget - interval) % interval;
    const elapsed = now - lastFrame; lastFrame = now;
    if (!covered && !diceActive) adaptResolution(elapsed);
    const dt = Math.min(0.05, clock.getDelta());
    if (mode === 'world' && WG.world) { WG.world.update(dt); if (!diceActive) { renderer.render(WG.world.scene, WG.world.camera); U.emit('world:frame', dt); } }
    else if (mode === 'arena' && WG.arena) { WG.arena.update(dt); if (!diceActive) renderer.render(WG.arena.scene, WG.arena.camera); U.emit('arena:frame', dt); }
    else if (mode === 'interior' && E.Interior && E.Interior.current) { E.Interior.update(dt); if (E.Interior.current && !diceActive) renderer.render(E.Interior.current.scene, E.Interior.current.camera); }
    if (['world', 'arena', 'interior'].includes(mode)) {
      const actor = mode === 'interior' && E.Interior && E.Interior.current ? E.Interior.current : WG.world && WG.world.hero;
      if (E.Sim && E.Sim.tick) E.Sim.tick(Math.min(1, Math.max(0, elapsed / 1000)), { mode, moving: !!(actor && actor.moving), sprinting: !!(actor && actor.sprinting), world: WG.world });
      if (E.Zones) E.Zones.tick(mode, WG.world);
      if (mode !== 'arena' && E.Vendor && E.Vendor.tick) E.Vendor.tick(Math.min(1, Math.max(0, elapsed / 1000)));
      if (mode !== 'arena' && E.Business && E.Business.tick) E.Business.tick(Math.min(1, Math.max(0, elapsed / 1000)));
      if (mode !== 'arena' && E.CasinoBusiness && E.CasinoBusiness.tick) E.CasinoBusiness.tick(Math.min(1, Math.max(0, elapsed / 1000)));
      if (E.WorldServices && E.WorldServices.update) E.WorldServices.update(dt);
      if (mode === 'world' && E.Settlements && E.WorldServices) E.Settlements.workTick(Math.min(.25, elapsed / 1000), E.WorldServices.currentPlace());
      if (E.Cycle && E.Cycle.update && WG.world) E.Cycle.update(WG.world, dt);
    }
    else if (mode === 'title' && WG.title) { WG.title.update(dt); renderer.render(WG.title.w.scene, WG.title.camera); }
  }
  WG.start = () => { if (!raf) { lastTick = lastFrame = performance.now(); frameBudget = 0; clock.getDelta(); loop(); } };
  WG.setMode = (m) => { mode = m; lastTick = lastFrame = performance.now(); frameBudget = 0; clock.getDelta(); WG.start(); };
  WG.renderer = () => renderer;
  WG.mode = () => mode;
  WG.performanceInfo = () => ({ pixelRatio: renderer.getPixelRatio(), maxPixelRatio, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures });

  WG.loadRegion = (id) => {
    if (WG.world) { WG.world.dispose(); WG.world = null; }
    WG.world = new World(id);
    WG.world.camera.aspect = innerWidth / innerHeight; WG.world.camera.updateProjectionMatrix();
    E.state.world.region = id;
    if (!(E.CoopWorld && E.CoopWorld.guest) && !WG.world.cave) E.state.world.visited[id] = true;
    return WG.world;
  };
  WG.showTitle = () => {
    if (!WG.title) WG.title = new TitleScene();
    WG.setMode('title');
  };
  WG.disposeTitle = () => { if (WG.title) { WG.title.w.dispose(); WG.title = null; } };
  WG.openArena = (regionId, battle) => {
    if (WG.arena) WG.arena.dispose();
    WG.arena = new Arena(regionId, battle);
    WG.arena.camera.aspect = innerWidth / innerHeight; WG.arena.camera.updateProjectionMatrix();
    WG.setMode('arena');
    return WG.arena;
  };
  WG.closeArena = () => { if (WG.arena) { WG.arena.dispose(); WG.arena = null; } WG.setMode('world'); };

  E.WG = WG;
})();
