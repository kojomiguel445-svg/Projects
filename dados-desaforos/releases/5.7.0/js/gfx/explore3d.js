/* Exploração no estilo Genshin (v4.5): correntes de vento para o planador, cachoeiras nos penhascos, baús no alto dos
   picos, Lumes-Guia (espíritos que levam você até um santuário com um baú) e Santuários das Tochas (acenda as quatro
   tochas ao mesmo tempo para quebrar o selo do baú). */
(() => {
  const U = E.U;
  const surface = (w, x, z) => w.terrainAt ? w.terrainAt(x, z) : w.height(x, z);
  const X3 = {};
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: 0.85 }, o));
  const glow = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c, toneMapped: false }, o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  let rad = null;
  const radTex = () => rad || (rad = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })());
  const halo = (color, s, op = 0.6) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: radTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); sp.scale.set(s, s, 1); return sp; };
  const streakTex = (cols, n, w2, h2) => { const c = document.createElement('canvas'); c.width = w2; c.height = h2; const x = c.getContext('2d'); for (let i = 0; i < n; i++) { x.strokeStyle = cols[i % cols.length]; x.globalAlpha = 0.25 + Math.random() * 0.6; x.lineWidth = 1 + Math.random() * 3; const px = Math.random() * w2, py = Math.random() * h2, l = h2 * (0.15 + Math.random() * 0.35); x.beginPath(); x.moveTo(px, py); x.lineTo(px + (Math.random() - 0.5) * 6, py + l); x.stroke(); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const st = (k, reg) => { const w = E.state.world; w[k] = w[k] || {}; w[k][reg] = w[k][reg] || {}; return w[k][reg]; };

  // amostra o terreno numa grade (pontos com altura) — usado para achar picos, penhascos e encostas
  const grid = (w, step, minR, maxR) => { const out = []; for (let x = -maxR; x <= maxR; x += step) for (let z = -maxR; z <= maxR; z += step) { const d = Math.hypot(x, z); if (d < minR || d > maxR) continue; out.push({ x, z, h: surface(w, x, z) }); } return out; };
  const spaced = (list, n, gap, used = []) => { const out = []; for (const p of list) { if (out.length >= n) break; if ([...out, ...used].every((o) => Math.hypot(o.x - p.x, o.z - p.z) > gap)) out.push(p); } return out; };

  X3.build = (w) => {
    if (w.cave || w.K === 1) return;
    const reg = w.id, sc = w.scene, wl = w.waterLevel, rng = U.seeded(w.reg.seed * 13 + 77);
    const avoid = [w.lairPos, w.landmarkPos, ...(w.extra ? [w.extra.domain, w.extra.cave, w.extra.summon, ...(w.extra.statues || []), ...(w.extra.monuments || [])] : [])].filter(Boolean);
    const G = grid(w, 6, 34, w.bound - 22);
    const free = (p, d = 14) => avoid.every((o) => Math.hypot(o.x - p.x, o.z - p.z) > d) && Math.hypot(p.x, p.z) > w.plaza + 16;
    const onLand = (p) => p.h > wl + 0.5;

    // ---------------- baús nos picos (luxuosos, com bandeirinha)
    w.peaks = [];
    if (!w.reg.metro) {
      const tops = G.filter((p) => onLand(p) && free(p) && w.slope(p.x, p.z) < 1.4).sort((a, b) => b.h - a.h);
      const pk = spaced(tops, 3, 55);
      const opened = E.state.world.opened[reg] || [];
      pk.forEach((p, i) => {
        // sobe até o ponto mais alto ao redor
        let best = p; for (let k = 0; k < 40; k++) { const q = { x: best.x + (rng() - 0.5) * 6, z: best.z + (rng() - 0.5) * 6 }; q.h = surface(w, q.x, q.z); if (q.h > best.h) best = q; }
        const id = 100 + i;
        if (!opened.includes(id)) w.addChest(id, best, 'luxuoso', false);
        const pole = mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 6), std('#6a4a2a'), best.x + 1.6, best.h + 1.6, best.z + 1.2);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8), new THREE.MeshStandardMaterial({ color: '#d84a3a', side: THREE.DoubleSide, roughness: 0.8 }));
        flag.position.set(best.x + 2.25, best.h + 2.8, best.z + 1.2);
        sc.add(pole, flag);
        w.peaks.push({ i, x: best.x, z: best.z, h: best.h, flag, seen: !!st('peaks', reg)[i] });
      });
    }

    // ---------------- gêiseres geotérmicos: a ascensão nasce de uma fonte, nunca de um anel solto
    w.updrafts = []; w.updraftObjs = [];
    const windTex = streakTex(['#ffffff', '#d9f4f5', '#b6dce8'], 34, 64, 128);
    const cand = G.filter((p) => onLand(p) && free(p, 10) && w.slope(p.x, p.z) < 0.55).map((p) => {
      let top = p.h; for (let a = 0; a < 8; a++) { const q = surface(w, p.x + Math.cos(a * .785) * 12, p.z + Math.sin(a * .785) * 12); if (q > top) top = q; }
      return Object.assign({}, p, { rise: top - p.h });
    }).filter((p) => p.rise > 7).sort((a, b) => b.rise - a.rise);
    for (const p of spaced(cand, w.reg.metro ? 2 : 4, 48)) {
      const H = Math.min(28, p.rise + 10), g = new THREE.Group();
      const dark = std(w.reg.biome === 'abyss' ? '#393343' : '#7d8889');
      const mineral = std(w.reg.biome === 'mountain' ? '#b9bdaf' : '#b8aa8a');
      // An anchored stone basin and mineral collar explain the continuous warm air.
      g.add(mesh(new THREE.CylinderGeometry(2.4, 2.75, .42, 12), dark, 0, -.04, 0));
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.15, .22, 5, 20), mineral); rim.rotation.x = Math.PI / 2; rim.position.y = .25; g.add(rim);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1.97, 20), new THREE.MeshBasicMaterial({ color: '#72c4c4', transparent: true, opacity: .82 })); pool.rotation.x = -Math.PI / 2; pool.position.y = .28; g.add(pool);
      const jet = new THREE.Mesh(new THREE.CylinderGeometry(.23, .52, 4.8, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#c7f3f4', transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide })); jet.position.y = 2.6; g.add(jet);
      for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; const stone = mesh(new THREE.DodecahedronGeometry(.32 + (k % 3) * .10, 0), mineral, Math.cos(a) * 2.4, .22, Math.sin(a) * 2.4); stone.scale.y = .65; g.add(stone); }
      const col = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, H, 12, 1, true), new THREE.MeshBasicMaterial({ map: windTex, color: '#d5e8e7', transparent: true, opacity: .10, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); col.position.y = H / 2; g.add(col);
      const motes = [];
      for (let k = 0; k < 5; k++) { const puff = halo('#e5f3ef', .8 + k * .15, .16); g.add(puff); motes.push({ s: puff, ph: k / 5, a: k * 1.2 }); }
      g.position.set(p.x, p.h, p.z); g.name = 'geothermal-geyser'; g.userData.groundSupport = { radius: 2.7, floor: .28 };
      sc.add(g); if (E.ScenePerf) E.ScenePerf.batch(g, { exclude: [pool, jet, col, ...motes.map(m => m.s)] });
      const u = { x: p.x, z: p.z, y: p.h, h: H, r: 2.2 };
      g.userData.updraft = u; w.updrafts.push(u); w.updraftObjs.push({ group: g, col, pool, jet, motes, H, tex: windTex });
      // Collision follows the collar, with a clear centre for stepping into the jet.
      for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; w.colliders.push({ x: p.x + Math.cos(a) * 2.35, z: p.z + Math.sin(a) * 2.35, r: .22 }); }
    }

    // ---------------- cachoeiras (onde o terreno despenca até a água)
    w.falls = [];
    const fallTex = streakTex(['#ffffff', '#d8f4ff', '#9fd8ff'], 120, 128, 256);
    const fc = [];
    for (const p of G) {
      if (!onLand(p) || !free(p, 10)) continue;
      for (let a = 0; a < 8; a++) {
        const dx = Math.cos(a * 0.785), dz = Math.sin(a * 0.785), bx = p.x + dx * 5, bz = p.z + dz * 5, bh = surface(w, bx, bz);
        if (p.h - bh > 7 && bh < wl + 1.2) fc.push({ x: p.x, z: p.z, h: p.h, dx, dz, bx, bz, bh, drop: p.h - bh });
      }
    }
    fc.sort((a, b) => b.drop - a.drop);
    for (const f of spaced(fc, 3, 55)) {
      const sx = -f.dz * 2.6, sz = f.dx * 2.6, ty = f.h + 0.3, by = Math.max(wl - 0.1, f.bh);
      const tx = f.x + f.dx * 0.6, tz = f.z + f.dz * 0.6;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([tx - sx, ty, tz - sz, tx + sx, ty, tz + sz, f.bx - sx * 1.3, by, f.bz - sz * 1.3, f.bx + sx * 1.3, by, f.bz + sz * 1.3]), 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2));
      geo.setIndex([0, 2, 1, 1, 2, 3]);
      const mat = new THREE.MeshBasicMaterial({ map: fallTex, color: '#e8f8ff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
      const sheet = new THREE.Mesh(geo, mat); sc.add(sheet);
      const back = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#6ab8e0', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); sc.add(back);
      const mist = halo('#ffffff', 7, 0.55); mist.position.set(f.bx, by + 1.2, f.bz); sc.add(mist);
      const foam = new THREE.Mesh(new THREE.RingGeometry(0.8, 3.2, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false })); foam.rotation.x = -Math.PI / 2; foam.position.set(f.bx, by + 0.05, f.bz); sc.add(foam);
      w.falls.push({ mat, mist, foam, x: f.bx, z: f.bz });
    }

    // ---------------- Lumes-Guia: um espírito que leva você até o santuário dele
    w.seelies = [];
    const sdone = st('seelies', reg);
    for (let i = 0; i < (w.reg.metro ? 1 : 3); i++) {
      let a = null, b = null;
      for (let k = 0; k < 60 && !b; k++) {
        const p = w.findSpot(36, w.bound - 34);
        if (!free(p, 16) || (w.reg.metro && (Math.hypot(p.x, p.z) < 78 || p.z > 24))) continue;
        const ang = rng() * Math.PI * 2, d = 30 + rng() * 14, q = { x: p.x + Math.cos(ang) * d, z: p.z + Math.sin(ang) * d };
        if (Math.hypot(q.x, q.z) > w.bound - 20 || surface(w, q.x, q.z) < wl + 0.5 || w.slope(q.x, q.z) > 0.6 || (w.reg.metro && (Math.hypot(q.x, q.z) < 76 || q.z > 24))) continue;
        a = p; b = q;
      }
      if (!b) continue;
      const path = []; const n = 16, nx = -(b.z - a.z), nz = b.x - a.x, nl = Math.hypot(nx, nz) || 1;
      for (let k = 0; k <= n; k++) { const t = k / n, off = Math.sin(t * Math.PI * 2) * 5; const x = a.x + (b.x - a.x) * t + nx / nl * off, z = a.z + (b.z - a.z) * t + nz / nl * off; path.push({ x, z }); }
      // santuário: bacia de pedra com pétalas que se acendem
      const sh = new THREE.Group(), y = surface(w, b.x, b.z);
      sh.add(mesh(new THREE.CylinderGeometry(1.1, 1.4, 0.5, 10), std('#b8b0a0'), 0, 0.25, 0), mesh(new THREE.CylinderGeometry(0.35, 0.5, 1.1, 8), std('#a8a090'), 0, 0.9, 0));
      const bowl = mesh(new THREE.CylinderGeometry(1, 0.6, 0.5, 12, 1, true), std('#c8c0b0', { side: THREE.DoubleSide }), 0, 1.6, 0); sh.add(bowl);
      const flame = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), glow('#7fe8ff')); flame.position.y = 1.9; sh.add(flame);
      const fl = halo('#7fe8ff', 3.4, 0.7); fl.position.y = 1.9; sh.add(fl);
      sh.position.set(b.x, y, b.z); sh.userData.groundSupport = { radius: 1.45 }; sc.add(sh); if (E.ScenePerf) E.ScenePerf.batch(sh, { exclude: [flame, fl] });
      w.colliders.push({ x: b.x, z: b.z, r: 1.2 });
      const done = !!sdone[i];
      flame.visible = fl.visible = done;
      const S = { i, path, k: 0, x: a.x, z: a.z, done, shrine: { x: b.x, z: b.z, y, flame, fl } };
      if (!done) {
        const sp = new THREE.Group(); const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), glow('#ffffff')); sp.add(core, halo('#7fe8ff', 1.6, 0.85));
        sp.position.set(a.x, surface(w, a.x, a.z) + 1.4, a.z); sc.add(sp); S.sprite = sp;
        S.trail = []; for (let k = 0; k < 6; k++) { const t2 = halo('#bff7ff', 0.5 - k * 0.06, 0.6 - k * 0.08); sc.add(t2); S.trail.push(t2); }
      } else X3.shrineChest(w, S);
      w.seelies.push(S);
    }

    // ---------------- Santuários das Tochas: acenda as quatro ao mesmo tempo
    w.torchShrines = [];
    const tdone = st('torches', reg);
    for (let i = 0; i < (w.reg.metro ? 1 : 2); i++) {
      let p = null;
      for (let k = 0; k < 60 && !p; k++) { const q = w.findSpot(34, w.bound - 30); if (free(q, 16) && w.slope(q.x, q.z) < 0.35 && !(w.reg.metro && (Math.hypot(q.x, q.z) < 78 || q.z > 24)) && w.seelies.every((s) => Math.hypot(s.shrine.x - q.x, s.shrine.z - q.z) > 20)) p = q; }
      if (!p) continue;
      const y = surface(w, p.x, p.z), T = { i, x: p.x, z: p.z, y, torches: [], solved: !!tdone[i] };
      const base = mesh(new THREE.CylinderGeometry(6.2, 6.6, .4, 20), std('#a8a090'), p.x, y + .2, p.z); base.name = 'torch-shrine-floor'; base.userData.groundSupport = { radius: 6.6, floor: .2, localBase: -.2 }; sc.add(base); T.base = base;
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + 0.785, tx = p.x + Math.cos(a) * 4.8, tz = p.z + Math.sin(a) * 4.8, ty = surface(w, tx, tz);
        const g = new THREE.Group();
        g.add(mesh(new THREE.CylinderGeometry(0.22, 0.32, 1.8, 8), std('#5a4a3a'), 0, 0.9, 0), mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.35, 10), std('#3a3a44'), 0, 1.95, 0));
        const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.9, 8), glow('#ffb84d')); fire.position.y = 2.5; g.add(fire);
        const fh = halo('#ffb84d', 2.4, 0.75); fh.position.y = 2.5; g.add(fh);
        g.position.set(tx, ty, tz); g.userData.groundSupport = { radius: .46, onPlatform: true }; sc.add(g); if (E.ScenePerf) E.ScenePerf.batch(g, { exclude: [fire, fh] });
        w.colliders.push({ x: tx, z: tz, r: 0.5 });
        const tc = { k, x: tx, z: tz, fire, fh, t: T.solved ? 999 : 0 };
        tc.ia = { kind: 'torch', shrine: T, torch: tc, x: tx, z: tz, r: 2.2, label: 'Acender a tocha', icon: '🔥' };
        if (!T.solved) w.interactables.push(tc.ia);
        T.torches.push(tc);
      }
      if (!T.solved) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(2.2, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffb84d', transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false })); dome.position.set(p.x, y + 0.2, p.z); sc.add(dome); T.dome = dome;
        const ch = E.WX.chest('precioso'); ch.position.set(p.x, y + 0.15, p.z); ch.scale.setScalar(1.3); sc.add(ch); T.sealed = ch;
        w.colliders.push({ x: p.x, z: p.z, r: 1.6 });
      } else X3.torchChest(w, T);
      w.torchShrines.push(T);
    }
    w.buildColliderGrid();
  };

  X3.shrineChest = (w, S) => { const id = 300 + S.i; if ((E.state.world.opened[w.id] || []).includes(id)) return; w.addChest(id, { x: S.shrine.x + 2.2, z: S.shrine.z + 1.2 }, 'precioso', false); w.buildColliderGrid(); };
  X3.torchChest = (w, T) => { const id = 200 + T.i; if ((E.state.world.opened[w.id] || []).includes(id)) return; w.addChest(id, { x: T.x, z: T.z }, 'precioso', false); w.buildColliderGrid(); };

  // tocha acesa dura 15 s; com as quatro acesas ao mesmo tempo, o selo se quebra
  X3.lightTorch = (w, it) => {
    const T = it.shrine, tc = it.torch;
    if (T.solved) return;
    tc.t = 15; E.Audio.sfx('spell');
    if (T.torches.every((t) => t.t > 0)) {
      T.solved = true; st('torches', w.id)[T.i] = Date.now(); E.Store.save();
      for (const t of T.torches) { t.t = 999; w.interactables = w.interactables.filter((x) => x !== t.ia); }
      if (T.dome) w.scene.remove(T.dome); if (T.sealed) w.scene.remove(T.sealed);
      w.colliders = w.colliders.filter((c) => !(Math.abs(c.x - T.x) < 0.01 && Math.abs(c.z - T.z) < 0.01 && c.r === 1.6)); w.buildColliderGrid();
      X3.torchChest(w, T);
      w.nearKey = null;
      U.emit('explore:torch', T);
    } else U.emit('explore:torchlit', { lit: T.torches.filter((t) => t.t > 0).length });
  };

  X3.update = (w, dt) => {
    if (w.cave || w.K === 1) return;
    const t = w.t, hr = w.hero;
    if ((w.updraftObjs || []).length) w.updraftObjs[0].tex.offset.y -= dt * .5;
    for (const u of w.updraftObjs || []) { u.pool.material.opacity = .78 + Math.sin(t * 1.7) * .06; u.jet.scale.y = 1 + Math.sin(t * 2.4) * .13;
      for (const m of u.motes) { const ph = (m.ph + t * 0.25) % 1; m.s.position.set(Math.cos(m.a + t * .35) * (.35 + ph), .6 + ph * u.H, Math.sin(m.a + t * .35) * (.35 + ph)); m.s.scale.setScalar(.8 + ph * 3); m.s.material.opacity = .18 * Math.sin(ph * Math.PI); }
    }
    if ((w.falls || []).length) w.falls[0].mat.map.offset.y -= dt * 1.6;
    for (const f of w.falls || []) { f.mist.material.opacity = 0.45 + Math.sin(t * 2.3 + f.x) * 0.12; f.foam.rotation.z = t * 0.6; }
    // picos: chegar lá em cima conta como descoberta
    for (const p of w.peaks || []) {
      p.flag.rotation.y = Math.sin(t * 2 + p.i) * 0.35;
      if (!p.seen && Math.hypot(p.x - hr.x, p.z - hr.z) < 7 && hr.y > p.h - 3) { p.seen = true; st('peaks', w.id)[p.i] = Date.now(); E.state.gems += 30; if (E.Adv) E.Adv.add(50, 'pico'); E.Store.save(); U.emit('explore:peak', p); }
    }
    // Lumes-Guia
    for (const S of w.seelies || []) {
      S.shrine.flame.rotation.y = t; if (S.shrine.fl.visible) S.shrine.fl.material.opacity = 0.6 + Math.sin(t * 3 + S.i) * 0.15;
      if (S.done || !S.sprite) continue;
      const target = S.path[Math.min(S.k, S.path.length - 1)];
      const near = Math.hypot(S.x - hr.x, S.z - hr.z) < 8;
      if (near || S.k > 0) {
        const dx = target.x - S.x, dz = target.z - S.z, l = Math.hypot(dx, dz);
        const sp = near ? 6 : 0;
        if (l < 0.6) S.k++; else if (sp) { S.x += dx / l * Math.min(l, sp * dt); S.z += dz / l * Math.min(l, sp * dt); }
        if (!S.started && near) { S.started = true; E.Audio.sfx('star3'); U.emit('explore:seelie', { type: 'start' }); }
      }
      // Idle guides keep the same terrain position; only moving guides need a new sample.
      if (S._groundX !== S.x || S._groundZ !== S.z || S._groundY === undefined) {
        S._groundX = S.x; S._groundZ = S.z; S._groundY = surface(w, S.x, S.z);
      }
      const y = S._groundY + 1.3 + Math.sin(t * 3 + S.i) * 0.25;
      S.sprite.position.set(S.x, y, S.z);
      const back = S.path[Math.max(0, S.k - 1)] || S;
      for (let k = 0; k < S.trail.length; k++) {
        const position = S.trail[k].position, mix = Math.min(1, dt * (8 - k)), f = 0.08 * (k + 1);
        position.x += (S.x + (back.x - S.x) * f - position.x) * mix;
        position.y += (y - 0.05 * k - position.y) * mix;
        position.z += (S.z + (back.z - S.z) * f - position.z) * mix;
      }
      if (S.k >= S.path.length) {
        S.done = true; st('seelies', w.id)[S.i] = Date.now(); E.Store.save();
        w.scene.remove(S.sprite); for (const tr of S.trail) w.scene.remove(tr);
        S.shrine.flame.visible = S.shrine.fl.visible = true;
        X3.shrineChest(w, S);
        E.Audio.sfx('star5');
        U.emit('explore:seelie', { type: 'done' });
      }
    }
    // tochas: apagam sozinhas
    for (const T of w.torchShrines || []) {
      if (T.dome) T.dome.material.opacity = 0.22 + Math.sin(t * 2) * 0.06;
      for (const tc of T.torches) {
        if (tc.t < 900) tc.t = Math.max(0, tc.t - dt);
        const on = tc.t > 0;
        tc.fire.visible = on; tc.fh.material.opacity = on ? 0.6 + Math.sin(t * 11 + tc.k) * 0.15 : 0;
        if (on && tc.t < 900) tc.fire.scale.setScalar(0.5 + Math.min(1, tc.t / 15) * 0.6);
      }
    }
  };

  // Footprints, not just centre points: the original minimum-height placement buried chests on hills.
  const footprint = (w, x, z, radius) => {
    let min = surface(w, x, z), max = min;
    for (let ring = 1; ring <= 2; ring++) for (let k = 0; k < 32; k++) {
      const a = k * Math.PI / 16, h = surface(w, x + Math.cos(a) * radius * ring / 2, z + Math.sin(a) * radius * ring / 2);
      min = Math.min(min, h); max = Math.max(max, h);
    }
    return { min, max };
  };
  X3.groundWorld = (w) => {
    if (!w || !w.scene) return;
    w.groundPlatforms = w.groundPlatforms || [];
    const roots = [], chests = [];
    w.scene.traverse(o => { if (o.userData.groundSupport && !o.userData.grounded) roots.push(o); if (o.userData.lid && o.userData.loot && !o.userData.chestGrounded) chests.push(o); });
    const addFoundation = (o, bounds, radius, y) => {
      const height = y - bounds.min + .10;
      if (height < .13) return;
      const foundation = mesh(new THREE.CylinderGeometry(radius * 1.02, radius * 1.10, height, radius > 3 ? 12 : 8), std(w.B.pave || '#8f8c7d'), o.position.x, y - height / 2, o.position.z);
      foundation.name = 'connected-stone-foundation'; foundation.userData.noStaticBatch = false;
      if (o.userData.groundSupport && o.userData.groundSupport.temporary) w.scene.add(foundation);
      else {
        if (!w.foundationGroup) {w.foundationGroup=new THREE.Group();w.foundationGroup.name='terrain-foundations';w.scene.add(w.foundationGroup);}
        w.foundationGroup.add(foundation);
      }
      o.userData.foundation = foundation;
    };
    for (const o of roots) {
      const meta = o.userData.groundSupport, r = meta.radius || 1, bounds = footprint(w, o.position.x, o.position.z, r);
      let groundY = bounds.max;
      if (meta.onPlatform) for (const p of w.groundPlatforms) {
        const py = E.WG && E.WG.platformHeight ? E.WG.platformHeight(p,o.position.x,o.position.z,r) : Math.hypot(o.position.x-p.x,o.position.z-p.z)+r<=p.r ? p.y : null;
        if(py!==null)groundY=Math.max(groundY,py);
      }
      groundY += .015; const localBase = meta.localBase || 0;
      o.position.y = groundY - localBase;
      addFoundation(o, bounds, r, groundY);
      if (meta.floor != null) w.groundPlatforms.push({ x: o.position.x, z: o.position.z, r: Math.max(.4, r - .15), y: o.position.y + meta.floor });
      for (const f of meta.floors || []) w.groundPlatforms.push({ x: o.position.x, z: o.position.z, r: f.r, y: o.position.y + f.y });
      if (o.userData.updraft) o.userData.updraft.y = o.position.y;
      o.userData.grounded = true;
      o.updateMatrix(); o.updateMatrixWorld(true);
    }
    const standing = (x, z) => {
      let y = surface(w, x, z);
      for (const p of w.groundPlatforms) {
        const py = E.WG && E.WG.platformHeight ? E.WG.platformHeight(p,x,z) : Math.hypot(x-p.x,z-p.z)<=p.r ? p.y : null;
        if(py!==null)y=Math.max(y,py);
      }
      return y;
    };
    for (const g of chests) {
      const r = .95 * Math.max(Math.abs(g.scale.x), 1), b = footprint(w, g.position.x, g.position.z, r);
      let y = Math.max(b.max, standing(g.position.x, g.position.z));
      // A little plinth joins all four corners to the visible slope.
      g.position.y = y + .025; addFoundation(g, b, r, y);
      const c = (w.chests || []).find(c => c.group === g); if (c && c.glow) c.glow.position.y = g.position.y + .75;
      g.userData.chestGrounded = true; g.updateMatrix(); g.updateMatrixWorld(true);
    }
    // Instanced rocks, trees and grass follow the same rendered mesh as the player's feet.
    const matrix = new THREE.Matrix4();
    for (const o of w.scene.children) if (o.isInstancedMesh && !o.userData.groundAdjusted) {
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, matrix); const e = matrix.elements; e[13] += surface(w, e[12], e[14]) - w.height(e[12], e[14]); o.setMatrixAt(i, matrix); }
      o.instanceMatrix.needsUpdate = true; o.computeBoundingSphere(); o.userData.groundAdjusted = true;
    }
    for (const h of w.herbs || []) if (h.group) h.group.position.y = standing(h.x, h.z);
    if (w.lairBoss && w.lairBoss.sprite) { const sp = w.lairBoss.sprite, y = standing(sp.position.x, sp.position.z); sp.position.y = y + .35; if (w.lairBoss.beam) w.lairBoss.beam.position.y = y + 35; }
    for (const t of w.torchShrines || []) if (t.base) { t.y = t.base.position.y + .2; if (t.dome) t.dome.position.y = t.y + .02; }
    for (const n of w.npcs || []) { const delta = standing(n.x, n.z) - n.y; n.y += delta; n.sprite.position.y += delta; n.marker.position.y += delta; }
    // Physical props omitted by the original scatter pass: decorative grass remains walk-through.
    const solid = { crate: .68, pillar: .56, deadtree: .26, rock: .82, stalag: .46, house: 1.65, tent: 1.2, palm: .28, tree: .45, pine: .40 };
    for (const [kind, list] of Object.entries(w.propGroups || {})) if (solid[kind]) for (const p of list) {
      const r = solid[kind] * (p.s || 1);
      const existing=w.colliders.find(c=>Math.hypot(c.x-p.x,c.z-p.z)<.15);if(existing)existing.r=Math.max(existing.r,r);else w.colliders.push({x:p.x,z:p.z,r});
      if(kind==='crate'){const ca=Math.cos(p.r||0),sa=Math.sin(p.r||0),ss=p.s||1,x=p.x+(.7*ca+.2*sa)*ss,z=p.z+(-.7*sa+.2*ca)*ss;if(!w.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<.1))w.colliders.push({x,z,r:.42*ss});}
    }
    for(const p of (w.propGroups||{}).arch||[]){const ss=p.s||1;w.colliders=w.colliders.filter(c=>!(Math.hypot(c.x-p.x,c.z-p.z)<.1&&Math.abs(c.r-.6*ss)<.05));for(const sign of [-1,1]){const x=p.x+Math.cos(p.r||0)*1.6*ss*sign,z=p.z-Math.sin(p.r||0)*1.6*ss*sign;if(!w.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<.1))w.colliders.push({x,z,r:.49*ss});}}
    if(w.foundationGroup&&E.ScenePerf)E.ScenePerf.batch(w.foundationGroup);
    w.nearKey = null; if (w.buildColliderGrid) w.buildColliderGrid();
  };

  // Any reachable lake or river bank can host fishing. One cached interaction, not thousands of map objects.
  X3.shoreFishing = (w) => {
    const h = w && w.hero; if (!h || h.swim || h.jump > .15 || w.fish) return null;
    const cache = w._shoreFishing || (w._shoreFishing = { next: 0, x: Infinity, z: Infinity, spots: new Map() });
    if (w.t < cache.next && Math.hypot(h.x - cache.x, h.z - cache.z) < .8) return cache.ia || null;
    cache.next = w.t + .45; cache.x = h.x; cache.z = h.z; cache.ia = null;
    const base = surface(w, h.x, h.z), level = w.waterLevel;
    if (base < level - .18 || base > level + 2.7) return null;
    let best = null;
    for (const r of [2.7, 4.2]) for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6, x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r;
      const depth = level - surface(w, x, z);
      if (depth > .48 && (!best || depth > best.depth)) best = { x, z, depth };
    }
    if (!best) return null;
    const key = `margem:${Math.floor(best.x / 6)}:${Math.floor(best.z / 6)}`;
    let spot = cache.spots.get(key);
    if (!spot) {
      const depleted = (E.state.world.fishDep || {})[`${w.id}:${key}`];
      spot = { i: key, x: h.x, z: h.z, wx: best.x, wz: best.z, left: depleted && Date.now() - depleted < 240000 ? 0 : 6, post: [], generalShore: true };
      cache.spots.set(key, spot); if (cache.spots.size > 64) cache.spots.delete(cache.spots.keys().next().value);
    }
    spot.x = h.x; spot.z = h.z; spot.wx = best.x; spot.wz = best.z;
    if (!spot.left) return null;
    if (!cache.lastIA || cache.lastIA.id !== key) cache.lastIA = { kind: 'fish', id: key, r: 2, label: 'Pescar na margem', icon: E.Icons ? E.Icons.html('fishing') : 'Pescar' };
    cache.ia = cache.lastIA; Object.assign(cache.ia, { spot, x: h.x, z: h.z });
    return cache.ia;
  };

  E.EX3 = X3;
})();
