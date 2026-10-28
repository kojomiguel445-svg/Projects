/* Dados 3D (d4, d6, d8, d10, d12, d20) com Three.js.
   O resultado vem das regras; a animação termina com a face sorteada virada para a câmera. */
(() => {
  const U = E.U;
  const D = {};
  let renderer, scene, camera, envTex, root, raf = 0, active = [], overlay, labelEl, canvasEl;
  const geoCache = {};

  const THEMES = {
    hero: { base: ['#22348a', '#0b1236'], num: '#ffe39a', edge: '#e8c46a', glow: '#8fb4ff' },
    enemy: { base: ['#7a1a2c', '#2a060f'], num: '#f6e7ff', edge: '#c9c9dc', glow: '#ff7a8a' },
    gold: { base: ['#a86a12', '#3a1f05'], num: '#fff6d8', edge: '#ffe9a0', glow: '#ffd36b' },
    heal: { base: ['#1f7a55', '#062a1c'], num: '#eafff4', edge: '#b8ffd8', glow: '#7dffc0' },
  };
  const typeTheme = (t) => {
    const c = E.R.DAMAGE[t] && E.R.DAMAGE[t].color;
    if (!c || c === '#f2f2f2') return null;
    return { base: [E.SP.shade(c, -0.45), E.SP.shade(c, -0.85)], num: '#ffffff', edge: E.SP.shade(c, 0.2), glow: c };
  };

  // ---------------- geometria ----------------
  function d10Geometry() {
    const g = new THREE.BufferGeometry();
    const h = 1.0, c = Math.cos(Math.PI / 5), b = h * (1 - c) / (1 + c);
    const T = new THREE.Vector3(0, h, 0), B = new THREE.Vector3(0, -h, 0);
    const Up = [], Lo = [];
    for (let k = 0; k < 5; k++) {
      const a1 = (k * 2 * Math.PI) / 5, a2 = a1 + Math.PI / 5;
      Up.push(new THREE.Vector3(Math.cos(a1), b, Math.sin(a1)));
      Lo.push(new THREE.Vector3(Math.cos(a2), -b, Math.sin(a2)));
    }
    const pos = [];
    const tri = (a, b2, c2) => pos.push(a.x, a.y, a.z, b2.x, b2.y, b2.z, c2.x, c2.y, c2.z);
    for (let k = 0; k < 5; k++) {
      const n = (k + 1) % 5, p = (k + 4) % 5;
      tri(T, Up[n], Lo[k]); tri(T, Lo[k], Up[k]);
      tri(B, Up[n], Lo[n]); tri(B, Lo[k], Up[n]);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.scale(1, 1.15, 1);
    return g;
  }
  function baseGeometry(sides) {
    switch (sides) {
      case 4: return new THREE.TetrahedronGeometry(1.25, 0);
      case 6: return new THREE.BoxGeometry(1.45, 1.45, 1.45).toNonIndexed();
      case 8: return new THREE.OctahedronGeometry(1.15, 0);
      case 10: return d10Geometry();
      case 12: return new THREE.DodecahedronGeometry(1.1, 0);
      default: return new THREE.IcosahedronGeometry(1.15, 0);
    }
  }

  // Agrupa triângulos coplanares em faces e gera UVs para um atlas de números
  function buildDie(sides) {
    if (geoCache[sides]) return geoCache[sides];
    let g = baseGeometry(sides);
    if (g.index) g = g.toNonIndexed();
    const P = g.attributes.position;
    const tris = [];
    for (let i = 0; i < P.count; i += 3) {
      const a = new THREE.Vector3().fromBufferAttribute(P, i), b = new THREE.Vector3().fromBufferAttribute(P, i + 1), c = new THREE.Vector3().fromBufferAttribute(P, i + 2);
      const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
      const cen = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
      if (n.dot(cen) < 0) { n.negate(); tris.push({ v: [a, c, b], n }); } else tris.push({ v: [a, b, c], n });
    }
    const faces = [];
    for (const t of tris) {
      let f = faces.find((F) => F.n.dot(t.n) > 0.995);
      if (!f) { f = { n: t.n.clone(), tris: [] }; faces.push(f); }
      f.tris.push(t);
    }
    // ordena faces para numerar de forma estável
    faces.forEach((f) => {
      const pts = [];
      f.tris.forEach((t) => t.v.forEach((v) => { if (!pts.some((p) => p.distanceTo(v) < 1e-4)) pts.push(v.clone()); }));
      f.pts = pts;
      f.c = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(pts.length);
      // "cima" do número: direção do centro até um vértice (d4: até o vértice; d10: até o ápice)
      let ref = pts[0];
      if (sides === 10) ref = pts.reduce((best, p) => (Math.abs(p.y) > Math.abs(best.y) ? p : best), pts[0]);
      if (sides === 6) { // cubo: alinhar a uma aresta
        const e = new THREE.Vector3().subVectors(pts[0], pts[1]).normalize();
        f.up = new THREE.Vector3().crossVectors(f.n, e).normalize();
      } else f.up = new THREE.Vector3().subVectors(ref, f.c).projectOnPlane(f.n).normalize();
      f.r = new THREE.Vector3().crossVectors(f.up, f.n).normalize();
      f.R = Math.max(...pts.map((p) => p.distanceTo(f.c)));
    });
    faces.sort((a, b) => (b.n.y - a.n.y) || (b.n.x - a.n.x) || (b.n.z - a.n.z));
    const cols = Math.ceil(Math.sqrt(faces.length)), rows = Math.ceil(faces.length / cols);
    const pos = [], nor = [], uv = [];
    faces.forEach((f, fi) => {
      const cx = fi % cols, cy = Math.floor(fi / cols);
      f.cell = { cx, cy };
      f.tris.forEach((t) => t.v.forEach((v) => {
        pos.push(v.x, v.y, v.z);
        nor.push(f.n.x, f.n.y, f.n.z);
        const l = new THREE.Vector3().subVectors(v, f.c);
        const u = (l.dot(f.r) / (2 * f.R)) * 0.92 + 0.5, w = (l.dot(f.up) / (2 * f.R)) * 0.92 + 0.5;
        uv.push((cx + u) / cols, 1 - (cy + 1 - w) / rows);
      }));
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    // forma da face no espaço UV (para desenhar a borda dourada)
    const f0 = faces[0];
    const shape = f0.pts.map((p) => { const l = new THREE.Vector3().subVectors(p, f0.c); return [(l.dot(f0.r) / (2 * f0.R)) * 0.92 + 0.5, (l.dot(f0.up) / (2 * f0.R)) * 0.92 + 0.5]; });
    // ordena os pontos da forma em ângulo
    shape.sort((a, b) => Math.atan2(a[1] - 0.5, a[0] - 0.5) - Math.atan2(b[1] - 0.5, b[0] - 0.5));
    // raio do maior círculo centrado que cabe na face (em unidades da célula): o número precisa caber nele
    let rin = 1;
    for (let k = 0; k < shape.length; k++) {
      const [ax, ay] = shape[k], [bx, by] = shape[(k + 1) % shape.length];
      const ex = bx - ax, ey = by - ay, L = Math.hypot(ex, ey) || 1;
      rin = Math.min(rin, Math.abs((0.5 - ax) * ey - (0.5 - ay) * ex) / L);
    }
    const res = { geo, faces, cols, rows, shape, sides, rin };
    geoCache[sides] = res;
    return res;
  }

  // atlas de números por dado e tema
  const atlasCache = {};
  function atlas(die, themeKey, theme) {
    const key = die.sides + '|' + themeKey;
    if (atlasCache[key]) return atlasCache[key];
    const cell = 160;
    const cv = document.createElement('canvas');
    cv.width = die.cols * cell; cv.height = die.rows * cell;
    const x = cv.getContext('2d');
    die.faces.forEach((f, i) => {
      const ox = f.cell.cx * cell, oy = f.cell.cy * cell;
      const g = x.createRadialGradient(ox + cell * 0.45, oy + cell * 0.35, 4, ox + cell / 2, oy + cell / 2, cell * 0.75);
      g.addColorStop(0, E.SP.shade(theme.base[0], 0.12));
      g.addColorStop(0.55, theme.base[0]);
      g.addColorStop(1, theme.base[1]);
      x.fillStyle = g;
      x.fillRect(ox, oy, cell, cell);
      // brilho interno
      x.fillStyle = 'rgba(255,255,255,0.06)';
      for (let k = 0; k < 6; k++) { x.beginPath(); x.arc(ox + U.rand() * cell, oy + U.rand() * cell, 1 + U.rand() * 2, 0, 7); x.fill(); }
      // borda dourada interna
      x.save();
      x.beginPath();
      die.shape.forEach(([u, v], k) => { const px = ox + (0.5 + (u - 0.5) * 0.86) * cell, py = oy + (1 - (0.5 + (v - 0.5) * 0.86)) * cell; k ? x.lineTo(px, py) : x.moveTo(px, py); });
      x.closePath();
      x.lineWidth = cell * 0.025;
      x.strokeStyle = theme.edge;
      x.globalAlpha = 0.85;
      x.stroke();
      x.restore();
      // número
      const label = String(die.sides === 10 && i + 1 === 10 ? 10 : i + 1);
      // tamanho ajustado para caber no círculo inscrito da face (a borda dourada fica a 86%)
      const fit = die.rin * 0.86 * cell * 0.86;
      let fs = cell * 0.5;
      x.font = `800 ${fs}px "Cinzel", "Georgia", serif`;
      const tw = x.measureText(label).width;
      const half = Math.hypot(tw / 2, fs * 0.36);
      if (half > fit) fs *= fit / half;
      fs = Math.min(fs, cell * (die.sides === 6 ? 0.46 : 0.44));
      x.font = `800 ${fs}px "Cinzel", "Georgia", serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      const cy2 = oy + cell * 0.5 + fs * 0.04;
      x.lineWidth = cell * 0.05; x.strokeStyle = 'rgba(0,0,0,0.55)';
      x.strokeText(label, ox + cell / 2, cy2);
      const tg = x.createLinearGradient(0, cy2 - fs / 2, 0, cy2 + fs / 2);
      tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.5, theme.num); tg.addColorStop(1, E.SP.shade(theme.num, -0.25));
      x.fillStyle = tg;
      x.fillText(label, ox + cell / 2, cy2);
      if (label === '6' || label === '9') { x.fillRect(ox + cell * 0.42, cy2 + fs * 0.42, cell * 0.16, cell * 0.025); }
    });
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    atlasCache[key] = tex;
    return tex;
  }

  // ---------------- cena ----------------
  function makeEnv() {
    const pm = new THREE.PMREMGenerator(renderer);
    const s = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {},
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = normalize(vP).y; vec3 top = vec3(1.0,0.93,0.8); vec3 mid = vec3(0.35,0.4,0.6); vec3 bot = vec3(0.08,0.08,0.14); vec3 c = h>0.0 ? mix(mid, top, pow(h,0.6)) : mix(mid, bot, pow(-h,0.5)); gl_FragColor = vec4(c,1.0); }',
    }));
    s.add(sky);
    const panel = (x, y, z, w, h, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
    panel(5, 7, 1, 4, 2, new THREE.Color(2.6, 2.3, 2));
    panel(-6, 2, 3, 3, 4, new THREE.Color(1.2, 1.6, 3));
    panel(0, -3, -6, 6, 2, new THREE.Color(2, 1.2, 2.4));
    envTex = pm.fromScene(s, 0.02).texture;
    // PMREM guarda sua própria textura; a cena temporária não precisa ficar na GPU.
    s.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
    });
    pm.dispose();
  }

  function applyQuality() {
    if (!renderer) return;
    const quality = E.state && E.state.settings && E.state.settings.quality;
    const limit = quality === 'baixo' ? 0.8 : quality === 'alto' && !U.isTouch() ? 1.5 : 1;
    const ratio = Math.min(devicePixelRatio || 1, limit);
    if (renderer.getPixelRatio() !== ratio) renderer.setPixelRatio(ratio);
  }

  D.init = () => {
    if (renderer) return;
    overlay = U.h(`<div class="dice-overlay" aria-live="polite"><canvas class="dice-canvas"></canvas><div class="dice-label"></div></div>`);
    document.body.appendChild(overlay);
    canvasEl = overlay.querySelector('canvas');
    labelEl = overlay.querySelector('.dice-label');
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: !U.isTouch(), powerPreference: 'high-performance' });
    } catch (e) { console.warn('WebGL indisponível para os dados', e); renderer = null; return; }
    applyQuality();
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    makeEnv();
    scene.environment = envTex;
    const key = new THREE.DirectionalLight(0xfff1dc, 1.5); key.position.set(4, 6, 3); scene.add(key);
    const fill = new THREE.DirectionalLight(0x9fb8ff, 0.8); fill.position.set(-5, -1, 4); scene.add(fill);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    root = new THREE.Group();
    scene.add(root);
    const resize = () => {
      applyQuality();
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < 640 ? 42 : 30;
      camera.updateProjectionMatrix();
    };
    addEventListener('resize', resize);
    resize();
  };

  // brilho (sprite radial)
  let glowTex;
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.3, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
    return glowTex;
  }

  // Orientação final: face escolhida virada para a câmera, número em pé, leve inclinação
  function targetQuat(face) {
    const view = new THREE.Vector3(0, 0, 1);
    const q1 = new THREE.Quaternion().setFromUnitVectors(face.n.clone().normalize(), view);
    const up2 = face.up.clone().applyQuaternion(q1);
    const ang = Math.atan2(up2.x, up2.y);
    const q2 = new THREE.Quaternion().setFromAxisAngle(view, ang);
    const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.1, 0.14, 0));
    return tilt.multiply(q2).multiply(q1);
  }

  function clearDice() {
    for (const d of active) {
      root.remove(d.group);
      // Geometria, atlas e brilho são compartilhados entre rolagens.
      // Apenas os dois materiais criados para este dado pertencem ao lote.
      d.mat.dispose();
      d.glow.material.dispose();
    }
    active = [];
  }

  function render() {
    renderer.render(scene, camera);
  }

  // anima um lote de dados; specs: [{s, v, theme, dim}]
  function animate(specs, opts) {
    return new Promise((resolve) => {
      clearDice();
      const n = specs.length;
      const maxPerRow = innerWidth < 640 ? 3 : 6;
      const rowsN = Math.ceil(n / maxPerRow);
      const scale = n > 6 ? 0.72 : n > 3 ? 0.85 : 1;
      const visW = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
      const spacing = Math.min(2.7 * scale, (visW * 0.9) / Math.min(n, maxPerRow));
      specs.forEach((sp, i) => {
        const die = buildDie(sp.s);
        const themeKey = typeof sp.theme === 'string' ? sp.theme : 'custom' + (sp.themeKey || '');
        const theme = typeof sp.theme === 'string' ? THEMES[sp.theme] : sp.theme;
        const tex = atlas(die, themeKey, theme);
        const mat = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.32, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.18, envMapIntensity: 0.75, transparent: true });
        const mesh = new THREE.Mesh(die.geo, mat);
        const group = new THREE.Group();
        group.add(mesh);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(theme.glow), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.scale.set(4.2, 4.2, 1);
        glow.position.z = -1.2;
        group.add(glow);
        const row = Math.floor(i / maxPerRow), inRow = Math.min(maxPerRow, n - row * maxPerRow), col = i % maxPerRow;
        const tx = (col - (inRow - 1) / 2) * spacing;
        const ty = 0.6 + ((rowsN - 1) / 2 - row) * spacing * 0.95;
        group.scale.setScalar(scale);
        const faceIdx = Math.max(0, Math.min(die.faces.length - 1, sp.v - 1));
        const qT = targetQuat(die.faces[faceIdx]);
        const axis = new THREE.Vector3(U.rand() - 0.5, U.rand() - 0.5, U.rand() - 0.5).normalize();
        const spin = 14 + U.rand() * 10;
        const from = new THREE.Vector3(tx * 0.3 + (U.rand() - 0.5) * 6, -7 - U.rand() * 2, 3 + U.rand() * 2);
        root.add(group);
        active.push({ group, mesh, glow, mat, from, to: new THREE.Vector3(tx, ty, 0), qT, axis, spin, delay: i * 60, dim: sp.dim, q0: new THREE.Quaternion().setFromEuler(new THREE.Euler(U.rand() * 6, U.rand() * 6, U.rand() * 6)) });
      });
      const speed = (E.state && E.state.settings.diceSpeed) || 1;
      const dur = (opts.quick ? 700 : 1150) / speed;
      const t0 = performance.now();
      cancelAnimationFrame(raf);
      const tick = (now) => {
        let done = true;
        for (const d of active) {
          const t = Math.max(0, Math.min(1, (now - t0 - d.delay) / dur));
          if (t < 1) done = false;
          // posição: arremesso com quique
          const tp = Math.min(1, t / 0.62);
          const e = U.ease.outCubic(tp);
          d.group.position.set(U.lerp(d.from.x, d.to.x, e), 0, U.lerp(d.from.z, d.to.z, e));
          let y = U.lerp(d.from.y, d.to.y, U.ease.outBack(tp));
          if (t > 0.62) { const bt = (t - 0.62) / 0.38; y = d.to.y + Math.abs(Math.sin(bt * Math.PI * 2.2)) * 0.35 * (1 - bt) * (1 - bt); }
          d.group.position.y = y;
          // rotação: gira livre e depois converge para a face sorteada
          const ang = d.spin * (1 - Math.pow(1 - t, 2.2)) ;
          const spinQ = new THREE.Quaternion().setFromAxisAngle(d.axis, ang).multiply(d.q0);
          const blend = t < 0.45 ? 0 : U.ease.inOutCubic((t - 0.45) / 0.55);
          d.mesh.quaternion.copy(spinQ).slerp(d.qT, blend);
          if (t >= 1) {
            d.glow.material.opacity = Math.min(d.dim ? 0.15 : 0.85, d.glow.material.opacity + 0.08);
            if (d.dim) { d.mat.opacity = Math.max(0.35, d.mat.opacity - 0.05); d.group.scale.multiplyScalar(0.995); }
          }
        }
        render();
        if (!done || active.some((d) => d.glow.material.opacity < (d.dim ? 0.15 : 0.85))) raf = requestAnimationFrame(tick);
        else resolve();
      };
      raf = requestAnimationFrame(tick);
    });
  }

  // ---------------- API pública ----------------
  // opts: {dice:[{s,v,theme,dim}], label, html (linha de resultado), outcome, quick, hold}
  D.roll = async (opts) => {
    D.init();
    applyQuality();
    const skip = E.state && E.state.settings.diceSpeed === 0;
    overlay.classList.add('show');
    overlay.classList.toggle('quick', !!opts.quick);
    overlay.dataset.outcome = opts.outcome || '';
    labelEl.innerHTML = `<div class="dl-title">${U.esc(opts.label || '')}</div>`;
    labelEl.classList.remove('shown');
    if (renderer && (skip || !opts.dice || !opts.dice.length)) { clearDice(); render(); }
    if (renderer && !skip && opts.dice && opts.dice.length) {
      E.Audio && E.Audio.sfx('dice', opts.dice.length);
      await animate(opts.dice.slice(0, 12), opts);
    }
    labelEl.innerHTML = `<div class="dl-title">${U.esc(opts.label || '')}</div>${opts.html || ''}`;
    requestAnimationFrame(() => labelEl.classList.add('shown'));
    if (opts.outcome && E.Audio) E.Audio.sfx(opts.outcome);
    const speed = (E.state && E.state.settings.diceSpeed) || 1;
    await U.wait((opts.hold ?? (opts.quick ? 650 : 1050)) / (skip ? 2 : speed));
  };
  D.hide = () => {
    if (!overlay) return;
    overlay.classList.remove('show');
    setTimeout(() => { if (!overlay.classList.contains('show') && renderer) { clearDice(); render(); } }, 260);
  };
  D.themeFor = (who, dmgType) => {
    if (who === 'heal') return 'heal';
    if (dmgType) { const t = typeTheme(dmgType); if (t) return Object.assign({}, t, {}); }
    return who === 'enemy' ? 'enemy' : 'hero';
  };
  D.typeTheme = typeTheme;
  D.applyQuality = applyQuality;
  D.isActive = () => !!(overlay && overlay.classList.contains('show'));

  E.Dice = D;
})();
