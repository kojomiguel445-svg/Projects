/* Maravilhas no mundo 3D: monumentos antigos, altar de invocação, estátuas de teleporte espalhadas e eventos
   (chuva de estrelas, caravana em perigo, fenda elemental, baú fujão e vigília das lanternas). */
(() => {
  const U = E.U, LO = E.LORE;
  const surface = (w, x, z) => w.terrainAt ? w.terrainAt(x, z) : w.height(x, z);
  const N3 = {};
  const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, flatShading: true, roughness: 0.85 }, o));
  const glow = (c, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: c, toneMapped: false }, o));
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  const STONE = { abyss: '#5a4e70', astral: '#8480b8', garden: '#d8ccb0', ruins: '#a8a088', coast: '#c8b898', mountain: '#9aa0a8', market: '#b89a7a', metro: '#c8b890', city: '#c0b8a8', forest: '#a09a8c' };
  let radial = null;
  const glowTex = () => radial || (radial = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })());
  const halo = (color, s, op = 0.6) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); sp.scale.set(s, s, 1); return sp; };

  // ------------------------------------------------------------ modelos dos monumentos
  const M = {};
  M.obelisco = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    g.add(mesh(new THREE.BoxGeometry(5, 0.7, 5), st, 0, 0.35, 0), mesh(new THREE.BoxGeometry(3.6, 0.7, 3.6), st, 0, 1.05, 0));
    const ob = mesh(new THREE.CylinderGeometry(0.75, 1.25, 11, 4, 1), st, 0, 6.9, 0); ob.rotation.y = Math.PI / 4; g.add(ob);
    const top = mesh(new THREE.ConeGeometry(0.75, 1.4, 4), std('#d4af37', { metalness: 0.5, roughness: 0.4 }), 0, 13.1, 0); top.rotation.y = Math.PI / 4; g.add(top);
    const rm = glow(ac);
    for (let k = 0; k < 4; k++) for (let j = 0; j < 4; j++) { const a = k * Math.PI / 2, r = 1.08 - j * 0.09, y = 3.4 + j * 2.1; const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.06), rm); b.position.set(Math.sin(a) * r, y, Math.cos(a) * r); b.rotation.y = a; g.add(b); }
    const h = halo(ac, 4, 0.5); h.position.y = 13.4; g.add(h);
    anim.push((t) => { rm.color.set(ac).multiplyScalar(0.7 + Math.sin(t * 1.6) * 0.3); });
    return { g, anim, r: 2.6 };
  };
  M.colosso = (st, ac) => {
    const g = new THREE.Group();
    const head = mesh(new THREE.IcosahedronGeometry(3.2, 1), st, 0, 2.2, 0); head.scale.set(1, 1.25, 0.95); head.rotation.z = 1.2; g.add(head);
    const dark = std('#2a2430');
    g.add(mesh(new THREE.SphereGeometry(0.55, 8, 6), dark, -0.9, 3.4, 2.6), mesh(new THREE.SphereGeometry(0.55, 8, 6), dark, 0.9, 2.9, 2.75));
    const nose = mesh(new THREE.ConeGeometry(0.6, 1.6, 4), st, 0.1, 2.2, 3.2); nose.rotation.x = Math.PI / 2; g.add(nose);
    const crown = mesh(new THREE.TorusGeometry(2.6, 0.35, 6, 16), std('#d4af37', { metalness: 0.5, roughness: 0.45 }), -2.4, 3.6, 0); crown.rotation.set(0.2, 0, 1.2); g.add(crown);
    const torso = mesh(new THREE.BoxGeometry(5, 3.4, 3), st, 7, 1.3, -2); torso.rotation.set(0.15, 0.6, 0.25); g.add(torso);
    const hand = new THREE.Group();
    hand.add(mesh(new THREE.BoxGeometry(2.6, 0.9, 2.2), st, 0, 0.45, 0));
    for (let k = 0; k < 4; k++) { const f = mesh(new THREE.CylinderGeometry(0.28, 0.32, 2.2, 6), st, -0.95 + k * 0.63, 1.4, 0.9); f.rotation.x = -0.35 - k * 0.08; hand.add(f); }
    const coin = mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 14), std('#d4af37', { metalness: 0.7, roughness: 0.3 }), 0, 1.0, 0.1); hand.add(coin);
    hand.position.set(-5.5, 0, 3); hand.rotation.y = -0.5; g.add(hand);
    for (let k = 0; k < 6; k++) g.add(mesh(new THREE.DodecahedronGeometry(0.5 + (k % 3) * 0.3, 0), st, -3 + k * 2.2, 0.3, -4 + (k % 2) * 7));
    const h = halo(ac, 6, 0.25); h.position.set(0, 3, 0); g.add(h);
    return { g, anim: [], r: 3.6, extra: [{ x: 7, z: -2, r: 2.6 }, { x: -5.5, z: 3, r: 1.5 }] };
  };
  M.circulo = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2, s = mesh(new THREE.BoxGeometry(1.2, 4.6 + (k % 3) * 0.8, 0.9), st, Math.cos(a) * 6, 2.3, Math.sin(a) * 6); s.rotation.set((k % 2 ? 0.06 : -0.05), -a, (k % 3 - 1) * 0.05); g.add(s); }
    const lin = mesh(new THREE.BoxGeometry(5.2, 0.8, 1), st, Math.cos(0.45) * 6, 5.4, Math.sin(0.45) * 6); lin.rotation.y = -0.45 + Math.PI / 2; g.add(lin);
    g.add(mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.8, 8), st, 0, 0.4, 0));
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.4, 3.7, 48), glow(ac, { transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.35, 7), glow(ac, { transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false })); ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.13; g.add(ring2);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), glow(ac)); orb.position.y = 1.6; g.add(orb);
    const h = halo(ac, 3.4, 0.6); h.position.y = 1.6; g.add(h);
    anim.push((t) => { ring2.rotation.z = t * 0.3; orb.rotation.y = t; orb.position.y = 1.6 + Math.sin(t * 1.8) * 0.2; ring.material.opacity = 0.5 + Math.sin(t * 1.4) * 0.2; });
    return { g, anim, r: 1.8, extra: Array.from({ length: 7 }, (_, k) => ({ x: Math.cos(k / 7 * Math.PI * 2) * 6, z: Math.sin(k / 7 * Math.PI * 2) * 6, r: 0.9 })) };
  };
  M.arco = (st, ac) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(1.8, 8, 1.8), st, -4, 4, 0), mesh(new THREE.BoxGeometry(1.8, 6.2, 1.8), st, 4, 3.1, 0));
    const arch = mesh(new THREE.TorusGeometry(4, 0.85, 6, 16, Math.PI * 0.82), st, 0, 8, 0); arch.rotation.z = Math.PI * 0.09; g.add(arch);
    const key = new THREE.Mesh(new THREE.BoxGeometry(1, 1.3, 1.9), glow(ac)); key.position.set(0, 12, 0); g.add(key);
    for (let k = 0; k < 5; k++) g.add(mesh(new THREE.DodecahedronGeometry(0.6 + (k % 2) * 0.3, 0), st, 4.5 + k * 0.6, 0.4, 1.4 - k * 0.7));
    const vine = std('#4a8a3a');
    for (let k = 0; k < 6; k++) { const v = mesh(new THREE.TorusGeometry(0.95, 0.12, 4, 10), vine, -4, 1.2 + k * 1.1, 0); v.rotation.x = Math.PI / 2; g.add(v); }
    const h = halo(ac, 3, 0.6); h.position.y = 12; g.add(h);
    return { g, anim: [], r: 1.2, extra: [{ x: -4, z: 0, r: 1.3 }, { x: 4, z: 0, r: 1.3 }] };
  };
  M.farol = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    g.add(mesh(new THREE.CylinderGeometry(3.4, 3.8, 1, 10), st, 0, 0.5, 0));
    g.add(mesh(new THREE.CylinderGeometry(1.7, 2.6, 11, 10), st, 0, 6.5, 0));
    const band = std('#b8452a');
    for (const y of [4, 8]) g.add(mesh(new THREE.CylinderGeometry(2.38 - y * 0.075, 2.45 - y * 0.075, 0.8, 10), band, 0, y, 0));
    g.add(mesh(new THREE.CylinderGeometry(2.1, 1.8, 0.6, 10), st, 0, 12.2, 0));
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(mesh(new THREE.BoxGeometry(0.2, 1.6, 0.2), st, Math.cos(a) * 1.8, 13.2, Math.sin(a) * 1.8)); }
    const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), glow(ac)); lamp.position.y = 13.3; g.add(lamp);
    const h = halo(ac, 7, 0.75); h.position.y = 13.3; g.add(h);
    for (let k = 0; k < 10; k++) { const a = k * 0.62, s = mesh(new THREE.BoxGeometry(1.2, 0.25, 0.7), st, Math.cos(a) * 2.9, 1 + k * 0.45, Math.sin(a) * 2.9); s.rotation.y = -a; g.add(s); }
    anim.push((t) => { lamp.rotation.y = t * 1.5; h.material.opacity = 0.55 + Math.sin(t * 2.2) * 0.2; });
    return { g, anim, r: 2.8 };
  };
  M.espada = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    g.add(mesh(new THREE.DodecahedronGeometry(3, 0), st, 0, 0.6, 0));
    const steel = std('#c8d0dc', { metalness: 0.75, roughness: 0.25 }), gold = std('#d4af37', { metalness: 0.6, roughness: 0.35 });
    const blade = mesh(new THREE.BoxGeometry(1.5, 9, 0.35), steel, 0, 6.6, 0); g.add(blade);
    g.add(mesh(new THREE.BoxGeometry(0.25, 9, 0.4), std('#e8eef8', { metalness: 0.8, roughness: 0.2 }), 0, 6.6, 0));
    g.add(mesh(new THREE.BoxGeometry(5, 0.6, 0.8), gold, 0, 11.3, 0), mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.6, 8), std('#5a3a2a'), 0, 12.9, 0));
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), glow(ac)); gem.position.y = 14.5; g.add(gem);
    const h = halo(ac, 4, 0.7); h.position.y = 14.5; g.add(h);
    const crack = new THREE.Mesh(new THREE.RingGeometry(2.4, 3.4, 10), glow(ac, { transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })); crack.rotation.x = -Math.PI / 2; crack.position.y = 0.1; g.add(crack);
    anim.push((t) => { gem.rotation.y = t * 1.2; crack.material.opacity = 0.3 + Math.sin(t * 2) * 0.15; });
    return { g, anim, r: 3 };
  };
  M.trono = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    for (let k = 0; k < 3; k++) g.add(mesh(new THREE.BoxGeometry(7 - k * 1.4, 0.6, 6 - k * 1.2), st, 0, 0.3 + k * 0.6, k * 0.3));
    g.add(mesh(new THREE.BoxGeometry(3.6, 1.6, 3), st, 0, 2.6, 0.4));
    g.add(mesh(new THREE.BoxGeometry(3.8, 8, 0.8), st, 0, 6.2, -1.1));
    const tip = mesh(new THREE.ConeGeometry(1.4, 2.2, 4), st, 0, 11.3, -1.1); tip.rotation.y = Math.PI / 4; g.add(tip);
    g.add(mesh(new THREE.BoxGeometry(0.8, 2.2, 3), st, -2.2, 3.2, 0.4), mesh(new THREE.BoxGeometry(0.8, 2.2, 3), st, 2.2, 3.2, 0.4));
    const crownM = glow(ac);
    const crown = new THREE.Group();
    crown.add(new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 6, 18), crownM));
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2, s = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5, 4), crownM); s.position.set(Math.cos(a) * 0.7, 0.25, Math.sin(a) * 0.7); crown.add(s); }
    crown.rotation.x = Math.PI / 2; crown.position.set(0, 5.4, 0.4); g.add(crown);
    const h = halo(ac, 3.6, 0.55); h.position.set(0, 5.4, 0.4); g.add(h);
    anim.push((t) => { crown.position.y = 5.4 + Math.sin(t * 1.3) * 0.25; crown.rotation.z = t * 0.6; });
    return { g, anim, r: 3.2 };
  };
  M.sino = (st, ac) => {
    const g = new THREE.Group();
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12; pts.push(new THREE.Vector2(1.6 + Math.pow(t, 2.2) * 2.6 + (k === 12 ? 0.4 : 0), t * 6)); }
    const bell = mesh(new THREE.LatheGeometry(pts.reverse(), 16), std('#b8862a', { metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide }), 0, 2.6, 0);
    bell.rotation.z = 1.25; g.add(bell);
    const top = mesh(new THREE.SphereGeometry(1.4, 10, 8), std('#a8762a', { metalness: 0.6, roughness: 0.4 }), -5.4, 1.4, 0); g.add(top);
    const clap = new THREE.Mesh(new THREE.SphereGeometry(0.8, 10, 8), glow(ac)); clap.position.set(1.6, 1.3, 0); g.add(clap);
    const wood = std('#6a4a2a');
    const b1 = mesh(new THREE.BoxGeometry(0.6, 9, 0.6), wood, -3, 3, -3.4); b1.rotation.z = 0.5; g.add(b1);
    const b2 = mesh(new THREE.BoxGeometry(0.6, 6, 0.6), wood, 3.6, 1.6, -3); b2.rotation.z = -1.1; g.add(b2);
    g.add(mesh(new THREE.BoxGeometry(8, 0.5, 0.5), wood, 0.4, 0.4, 3.4));
    const h = halo(ac, 3, 0.5); h.position.set(1.6, 1.3, 0); g.add(h);
    return { g, anim: [], r: 3.6, extra: [{ x: -4.8, z: 0, r: 1.6 }] };
  };
  M.arvore = (st, ac, B) => {
    const g = new THREE.Group(), anim = [];
    const garden = B && B === E.WD.BIOMES.garden;
    g.add(mesh(new THREE.CylinderGeometry(1.1, 2, 8, 9), st, 0, 4, 0));
    for (let k = 0; k < 5; k++) { const a = k * 1.26, br = mesh(new THREE.CylinderGeometry(0.35, 0.6, 4.4, 6), st, Math.cos(a) * 1.6, 8.6, Math.sin(a) * 1.6); br.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8); g.add(br); }
    for (let k = 0; k < 5; k++) { const a = k * 1.26 + 0.6, r2 = mesh(new THREE.CylinderGeometry(0.25, 0.55, 3, 6), st, Math.cos(a) * 2, 0.5, Math.sin(a) * 2); r2.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); g.add(r2); }
    const leafM = std(garden ? '#e8c8d8' : '#8a9488');
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; g.add(mesh(new THREE.IcosahedronGeometry(2.2 + (k % 3) * 0.4, 0), leafM, Math.cos(a) * 2.8, 10.6 + (k % 2), Math.sin(a) * 2.8)); }
    const lights = [];
    const cols = garden ? ['#ff9ad5', '#ffd36b', '#ffffff', '#9fd4ff'] : [ac];
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, r = 3.6 + (k % 3) * 0.6, y = 8.6 + (k % 4) * 0.7; const l = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), glow(cols[k % cols.length])); l.position.set(Math.cos(a) * r, y, Math.sin(a) * r); g.add(l); lights.push([l, y, k]); }
    const h = halo(ac, 9, 0.25); h.position.y = 9; g.add(h);
    anim.push((t) => { for (const [l, y, k] of lights) l.position.y = y + Math.sin(t * 1.5 + k) * 0.15; });
    return { g, anim, r: 2.2 };
  };
  M.costela = (st, ac) => {
    const g = new THREE.Group();
    const glass = new THREE.MeshStandardMaterial({ color: '#bfe8ff', transparent: true, opacity: 0.6, roughness: 0.15, metalness: 0.2, emissive: '#3a7aa8', emissiveIntensity: 0.35 });
    const sp = mesh(new THREE.CylinderGeometry(0.6, 0.9, 20, 8), glass, 0, 0.3, 0); sp.rotation.z = Math.PI / 2; g.add(sp);
    for (let k = 0; k < 7; k++) {
      const s = 5.6 - Math.abs(k - 3) * 0.7, x = -7.5 + k * 2.5;
      for (const side of [1, -1]) { const rib = new THREE.Mesh(new THREE.TorusGeometry(s, 0.32, 6, 14, Math.PI * 0.55), glass); rib.position.set(x, 0, 0); rib.rotation.set(0, side > 0 ? 0 : Math.PI, Math.PI * 0.02); rib.rotation.y += Math.PI / 2; g.add(rib); }
    }
    const skull = mesh(new THREE.IcosahedronGeometry(2.4, 1), glass, 11.5, 1.2, 0); skull.scale.set(1.6, 0.9, 1); g.add(skull);
    const h = halo(ac, 10, 0.18); h.position.y = 3; g.add(h);
    return { g, anim: [], r: 1.2, extra: [{ x: 11.5, z: 0, r: 2.6 }] };
  };
  M.navio = (st, ac) => {
    const g = new THREE.Group();
    const wood = std('#6a4a2e'), dark = std('#3a2a1a');
    const hull = new THREE.Group();
    hull.add(mesh(new THREE.BoxGeometry(12, 3, 4.4), wood, 0, 1.5, 0));
    const prow = mesh(new THREE.ConeGeometry(2.2, 4.4, 4), wood, 7.9, 1.6, 0); prow.rotation.set(0, 0, -Math.PI / 2); prow.rotation.x = Math.PI / 4; hull.add(prow);
    hull.add(mesh(new THREE.BoxGeometry(12.2, 0.3, 4.6), dark, 0, 3, 0), mesh(new THREE.BoxGeometry(3, 2, 4.4), wood, -4.5, 4, 0));
    hull.rotation.set(0.32, 0.4, 0.12); hull.position.y = -0.4; g.add(hull);
    const mast = mesh(new THREE.CylinderGeometry(0.25, 0.32, 9, 6), wood, 0, 6.2, 0.6); mast.rotation.z = 0.35; g.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4, 3, 3), new THREE.MeshStandardMaterial({ color: '#e8dcc0', side: THREE.DoubleSide, roughness: 0.9 }));
    const sp = sail.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setZ(i, Math.sin(sp.getX(i) * 0.8) * 0.4 + (sp.getY(i) < 0 ? 0.6 : 0)); sail.geometry.computeVertexNormals();
    sail.position.set(-1.3, 7, 0.9); sail.rotation.set(0, 0.25, 0.35); g.add(sail);
    for (let k = 0; k < 4; k++) g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.1, 8), dark, -3 + k * 2.4, 0.5, 3.4 + (k % 2)));
    const lan = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), glow(ac)); lan.position.set(-4.4, 5.6, 1.4); g.add(lan);
    const h = halo(ac, 3, 0.7); h.position.copy(lan.position); g.add(h);
    return { g, anim: [], r: 3.4, extra: [{ x: 5, z: 1.5, r: 2.6 }, { x: -4, z: -1.5, r: 2.6 }] };
  };
  M.bigorna = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    const iron = std('#4a4e58', { metalness: 0.6, roughness: 0.45 });
    g.add(mesh(new THREE.BoxGeometry(5, 1.6, 3.6), st, 0, 0.8, 0), mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), iron, 0, 2.7, 0), mesh(new THREE.BoxGeometry(6.4, 1.6, 2.6), iron, 0, 4.6, 0));
    const horn = mesh(new THREE.ConeGeometry(1.1, 3.6, 8), iron, 4.9, 4.7, 0); horn.rotation.z = -Math.PI / 2; g.add(horn);
    const star = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), glow(ac)); star.position.set(-1, 5.9, 0); g.add(star);
    const h = halo(ac, 4.5, 0.75); h.position.copy(star.position); g.add(h);
    const ham = new THREE.Group(); ham.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 8), std('#6a4a2a'), 0, 0, 0), mesh(new THREE.BoxGeometry(2.2, 1.4, 1.4), iron, 0, 3, 0));
    ham.rotation.set(0, 0.4, 1.35); ham.position.set(-2, 0.7, 3.4); g.add(ham);
    anim.push((t) => { const k = 0.7 + Math.sin(t * 2.4) * 0.3; star.scale.setScalar(k); h.material.opacity = 0.5 + k * 0.3; });
    return { g, anim, r: 3.4 };
  };
  M.relogio = (st, ac) => {
    const g = new THREE.Group(), anim = [];
    g.add(mesh(new THREE.CylinderGeometry(2.4, 3, 1.4, 8), st, 0, 0.7, 0), mesh(new THREE.CylinderGeometry(0.5, 0.7, 3, 8), st, 0, 2.8, 0));
    const gold = std('#d4af37', { metalness: 0.7, roughness: 0.3 });
    const rings = [4.2, 3.4, 2.6].map((r, k) => { const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.14, 6, 48), gold); m.position.y = 7; m.castShadow = true; g.add(m); return m; });
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), glow(ac)); core.position.y = 7; g.add(core);
    const h = halo(ac, 6, 0.6); h.position.y = 7; g.add(h);
    const stars = [];
    for (let k = 0; k < 10; k++) { const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glow('#fff6c8')); g.add(s); stars.push(s); }
    anim.push((t) => { rings[0].rotation.set(t * 0.3, t * 0.2, 0); rings[1].rotation.set(0, t * 0.45, t * 0.25); rings[2].rotation.set(t * 0.6, 0, t * 0.35); stars.forEach((s, k) => { const a = t * 0.4 + k * 0.63; s.position.set(Math.cos(a) * (4.4 + (k % 3) * 0.4), 7 + Math.sin(a * 1.7) * 2, Math.sin(a) * (4.4 + (k % 3) * 0.4)); }); });
    return { g, anim, r: 2.6 };
  };

  // atril de pedra diante do monumento, onde se lê a inscrição
  const lectern = (st, ac) => {
    const g = new THREE.Group();
    g.add(mesh(new THREE.BoxGeometry(0.9, 1.1, 0.7), st, 0, 0.55, 0));
    const top = mesh(new THREE.BoxGeometry(1.5, 0.18, 1.1), st, 0, 1.2, 0); top.rotation.x = -0.45; g.add(top);
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), glow(ac, { transparent: true, opacity: 0.8 })); rune.position.set(0, 1.31, 0.06); rune.rotation.x = -0.45 - Math.PI / 2; g.add(rune);
    return { g, rune };
  };

  // ------------------------------------------------------------ montagem na região
  N3.build = (w) => {
    const ex = w.extra; if (!ex || w.cave) return;
    const reg = w.id, B = w.B, sc = w.scene;
    const stoneM = std(STONE[w.reg.biome] || '#a8a296');
    const ac = B.accent || '#ffd36b';
    w.monumentObjs = [];
    const list = LO.MONUMENTS[reg] || [];
    (ex.monuments || []).forEach((p, i) => {
      const def = list[i]; if (!def) return;
      const y = Math.max(...[[0, 0], [2, 2], [-2, 2], [2, -2], [-2, -2]].map(([dx, dz]) => surface(w, p.x + dx, p.z + dz)));
      const mod = (M[def.kind] || M.obelisco)(stoneM, ac, B);
      const rot = Math.atan2(-p.x, -p.z);
      mod.g.position.set(p.x, y - .1, p.z); mod.g.rotation.y = rot; mod.g.userData.groundSupport = { radius: Math.max(mod.r, def.kind === 'colosso' ? 8 : 4) };
      sc.add(mod.g);
      w.colliders.push({ x: p.x, z: p.z, r: mod.r });
      for (const c of mod.extra || []) { const cx = p.x + c.x * Math.cos(rot) + c.z * Math.sin(rot), cz = p.z - c.x * Math.sin(rot) + c.z * Math.cos(rot); w.colliders.push({ x: cx, z: cz, r: c.r }); }
      // atril entre o monumento e o centro do mapa
      const d = Math.hypot(p.x, p.z) || 1, lx = p.x - p.x / d * 7.5, lz = p.z - p.z / d * 7.5;
      const lec = lectern(stoneM, ac); lec.g.position.set(lx, surface(w, lx, lz), lz); lec.g.userData.groundSupport = {radius:.8}; lec.g.rotation.y = rot + Math.PI; sc.add(lec.g);
      w.colliders.push({ x: lx, z: lz, r: 0.6 });
      const read = E.WON.isRead(reg, i);
      const mark = halo(read ? '#9aa4b8' : '#ffd36b', 1.6, read ? 0.3 : 0.9); mark.position.set(lx, surface(w, lx, lz) + 2.2, lz); sc.add(mark);
      const ia = { kind: 'monument', reg, i, x: lx, z: lz, r: 3, label: `Ler: ${def.name}`, icon: '🏛' };
      w.interactables.push(ia);
      w.monumentObjs.push({ i, def, x: p.x, z: p.z, lx, lz, anim: mod.anim, mark, lec, ia });
    });
    // altar de invocação
    const S = LO.SUMMONS[reg];
    if (S && ex.summon) {
      const p = ex.summon, y = surface(w, p.x, p.z), g = new THREE.Group(), dark = std(w.reg.biome === 'abyss' ? '#2a2238' : '#4a4458');
      g.add(mesh(new THREE.CylinderGeometry(5.2, 5.8, 0.7, 8), dark, 0, 0.35, 0), mesh(new THREE.CylinderGeometry(3.6, 4, 0.5, 8), stoneM, 0, 0.95, 0));
      const fires = [];
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2 + Math.PI / 4, x = Math.cos(a) * 4.4, z = Math.sin(a) * 4.4;
        g.add(mesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 6), dark, x, 2.4, z), mesh(new THREE.CylinderGeometry(0.75, 0.5, 0.5, 8), stoneM, x, 4.6, z));
        const f = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.2, 6), glow(S.color)); f.position.set(x, 5.4, z); g.add(f);
        const fh = halo(S.color, 2.2, 0.7); fh.position.set(x, 5.4, z); g.add(fh); fires.push([f, fh]);
      }
      const ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3, 48), glow(S.color, { transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.y = 1.22; g.add(ring);
      const runes = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.8, 6), glow(S.color, { transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })); runes.rotation.x = -Math.PI / 2; runes.position.y = 1.23; g.add(runes);
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), glow(S.color)); crystal.scale.y = 1.6; crystal.position.y = 3.6; g.add(crystal);
      const ch = halo(S.color, 6, 0.7); ch.position.y = 3.6; g.add(ch);
      g.position.set(p.x, y - .05, p.z); g.userData.groundSupport = {radius:5.8,floors:[{r:5.1,y:.7},{r:3.5,y:1.2}]}; sc.add(g);
      w.colliders.push({ x: p.x, z: p.z, r: 1.2 });
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; w.colliders.push({ x: p.x + Math.cos(a) * 4.4, z: p.z + Math.sin(a) * 4.4, r: 0.7 }); }
      const ia = { kind: 'summon', reg, x: p.x, z: p.z, r: 5.5, label: `Altar de Invocação: ${S.title}`, icon: '🔮' };
      w.interactables.push(ia);
      w.summonObj = { group:g, x: p.x, z: p.z, fires, ring, runes, crystal, ch, ia };
      if (E.ScenePerf) E.ScenePerf.batch(g,{exclude:[...fires.flat(),ring,runes,crystal,ch]});
    }
    // estátuas de teleporte espalhadas (despertam quando você chega perto)
    w.statueObjs = [];
    (ex.statues || []).forEach((p, i) => {
      const y = surface(w, p.x, p.z), g = new THREE.Group(), stoneW = std('#c8c0b0');
      g.add(mesh(new THREE.CylinderGeometry(1.4, 1.7, 0.5, 8), stoneW, 0, 0.25, 0), mesh(new THREE.CylinderGeometry(0.35, 0.6, 3.4, 6), stoneW, 0, 2.2, 0));
      const on = E.WON.statueOn(reg, i);
      const cm = new THREE.MeshBasicMaterial({ color: on ? '#7fe8ff' : '#6a7484', toneMapped: false });
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), cm); crystal.position.y = 4.6; crystal.scale.y = 1.6; g.add(crystal);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 6, 32), new THREE.MeshBasicMaterial({ color: on ? '#ffe9a8' : '#8a8a8a', toneMapped: false })); ring.position.y = 4.6; ring.rotation.x = Math.PI / 2; g.add(ring);
      const h = halo('#7fe8ff', 4, on ? 0.6 : 0); h.position.y = 4.6; g.add(h);
      g.position.set(p.x, y, p.z); g.userData.groundSupport={radius:1.7}; sc.add(g);
      w.colliders.push({ x: p.x, z: p.z, r: 1.5 });
      const ia = { kind: 'statue', reg, i, x: p.x, z: p.z, r: 3, label: 'Estátua de Teleporte', icon: '✦' };
      w.interactables.push(ia);
      w.statueObjs.push({ i, x: p.x, z: p.z, on, crystal, ring, h, ia });
    });
    // eventos: o primeiro aparece pouco depois de chegar
    w.evTimer = 35 + w.rng() * 35;
    w.evCycle = Math.floor(Math.random() * LO.EVENT_ORDER.length);
  };

  N3.lightStatue = (w, s) => { s.on = true; s.crystal.material.color.set('#7fe8ff'); s.ring.material.color.set('#ffe9a8'); s.h.material.opacity = 0.6; };
  N3.markRead = (w, i) => { const m = (w.monumentObjs || []).find((o) => o.i === i); if (m) { m.mark.material.color.set('#9aa4b8'); m.mark.material.opacity = 0.3; } };

  // ------------------------------------------------------------ eventos
  N3.spot = (w, minR, maxR) => {
    const hr = w.hero;
    for (let k = 0; k < 160; k++) {
      const a = Math.random() * Math.PI * 2, r = minR + Math.random() * (maxR - minR), x = hr.x + Math.cos(a) * r, z = hr.z + Math.sin(a) * r;
      if (Math.hypot(x, z) > w.bound - 18 || surface(w, x, z) < w.waterLevel + 0.5 || w.slope(x, z) > 0.45) continue;
      if (w.reg.metro && (Math.hypot(x, z) < 74 || z > 24)) continue;
      if (Math.hypot(x, z) < w.plaza + 8) continue;
      if (w.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 5.5)) continue;
      return { x, z };
    }
    return null;
  };
  N3.start = (w, id) => {
    const def = LO.EVENTS[id], sc = w.scene;
    const p = N3.spot(w, 35, 85) || N3.spot(w, 20, 120);
    if (!p) return false;
    const ev = { id, def, x: p.x, z: p.z, t: def.time, objs: [], items: [], done: false, prog: 0, need: 1 };
    const y = surface(w, p.x, p.z);
    // feixe de luz visível de longe
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .7, 38, 10, 1, true), new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(p.x, y + 19, p.z); sc.add(beam); ev.objs.push(beam); ev.beam = beam;
    const lvl = (E.Store.hero() || { level: 1 }).level;
    const marker = new THREE.Group();
    const boundary = new THREE.Mesh(new THREE.RingGeometry(4.8,4.88,40),glow(def.color,{transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));
    boundary.geometry.rotateX(-Math.PI/2); const bp=boundary.geometry.attributes.position;for(let j=0;j<bp.count;j++)bp.setY(j,surface(w,p.x+bp.getX(j),p.z+bp.getZ(j))-y+.035);boundary.geometry.computeVertexNormals();marker.add(boundary);
    for (let k=0;k<4;k++){const a=k*Math.PI/2+.4,x=Math.cos(a)*5,z=Math.sin(a)*5;const post=mesh(new THREE.CylinderGeometry(.045,.065,1.3,5),std('#665542'),x,.65,z);post.position.y+=surface(w,p.x+x,p.z+z)-y;marker.add(post);const lamp=new THREE.Mesh(new THREE.OctahedronGeometry(.12,0),glow(def.color));lamp.position.set(x,post.position.y+.6,z);marker.add(lamp);}
    marker.position.set(p.x,y,p.z); sc.add(marker); ev.objs.push(marker);
    if (E.ScenePerf) E.ScenePerf.batch(marker,{exclude:[boundary]});
    if (id === 'meteoros' || id === 'vigilia') {
      ev.need = def.n;
      for (let k = 0; k < def.n; k++) {
        let q = null;
        for (let j = 0; j < 40 && !q; j++) { const a = Math.random() * Math.PI * 2, r = 5 + Math.random() * 13, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r; if (surface(w, x, z) > w.waterLevel + .4 && Math.hypot(x,z)<w.bound-6 && w.slope(x,z)<.75 && !w.colliders.some(c=>Math.hypot(c.x-x,c.z-z)<c.r+1.2)) q = { x, z }; }
        q = q || { x: p.x + k, z: p.z };
        const qy = surface(w, q.x, q.z), g = new THREE.Group();
        if (id === 'meteoros') {
          const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.65,0),std('#5c5750',{emissive:'#be8040',emissiveIntensity:.18})); core.position.y=.52; g.add(core);
          for(let j=0;j<3;j++){const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.17,0),glow('#ffd890'));shard.position.set(Math.cos(j*2.1)*.45,.6+(j%2)*.25,Math.sin(j*2.1)*.45);core.add(shard);}
          const tail=new THREE.Mesh(new THREE.ConeGeometry(.27,3.8,6),glow('#ffcf8a',{transparent:true,opacity:.35,depthWrite:false}));tail.position.y=2.3;g.add(tail);
          const hh = halo('#ffd36b', 2.4, 0.85); hh.position.y = 0.6; g.add(hh);
          const crater = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.3, 16), new THREE.MeshBasicMaterial({ color: '#3a2a20', transparent: true, opacity: 0.55, depthWrite: false })); crater.rotation.x = -Math.PI / 2; crater.position.y=.025;crater.visible=false;g.add(crater);
          g.position.set(q.x, qy + 45 + k * 6, q.z);
          ev.items.push({ g, x: q.x, z: q.z, y: qy, fall: true, vy: 0, core, crater, tail, k });
        } else {
          g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.4, 6), std('#5a4a3a'), 0, 1.2, 0), mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), std('#5a4a3a'), 0.3, 2.35, 0));
          const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), new THREE.MeshBasicMaterial({ color: '#4a4a58', toneMapped: false })); lamp.position.set(0.6, 2.0, 0); g.add(lamp);
          const hh = halo(def.color, 2.6, 0); hh.position.copy(lamp.position); g.add(hh);
          g.position.set(q.x, qy, q.z);
          g.add(mesh(new THREE.CylinderGeometry(.38,.48,.16,8),std('#a19883'),0,.08,0));
          const housing=new THREE.Mesh(new THREE.BoxGeometry(.44,.55,.44),new THREE.MeshBasicMaterial({color:'#b4d7e4',transparent:true,opacity:.13,depthWrite:false}));housing.position.set(.6,2,0);g.add(housing);
          const it = { g, x: q.x, z: q.z, lamp, hh, lit: false };
          it.ia = { kind: 'evlantern', item: it, x: q.x, z: q.z, r: 2.4, label: 'Reacender a lanterna', icon: '🏮' };
          w.interactables.push(it.ia);
          ev.items.push(it);
        }
        sc.add(g); ev.objs.push(g);
      }
    } else if (id === 'caravana' || id === 'fenda') {
      const g = new THREE.Group();
      if (id === 'caravana') {
        const wood = std('#8a5a32');
        g.add(mesh(new THREE.BoxGeometry(3.6, 1.2, 1.9), wood, 0, 1.1, 0));
        const cover = mesh(new THREE.CylinderGeometry(1.05, 1.05, 3.4, 10, 1, true, 0, Math.PI), std('#e8dcc0', { side: THREE.DoubleSide }), 0, 1.7, 0); cover.rotation.set(0, 0, Math.PI / 2); cover.rotation.x = Math.PI / 2; cover.rotation.z = 0; cover.rotation.set(Math.PI / 2, 0, Math.PI / 2); g.add(cover);
        for (const [x, z] of [[-1.2, 1], [1.2, 1], [-1.2, -1], [1.2, -1]]) { const wh = mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.2, 12), std('#5a3a1a'), x, 0.55, z); wh.rotation.x = Math.PI / 2; g.add(wh); }
        for (let k = 0; k < 3; k++) { const c = mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), std('#b8864a'), 2.4 + k * 0.4, 0.4, -1.4 + k * 0.9); c.rotation.y = k; g.add(c); }
        g.rotation.z = .045;
        g.add(mesh(new THREE.BoxGeometry(1.1,.65,.8),std('#9e794b'),-2.5,.325,.4),mesh(new THREE.BoxGeometry(.65,.45,.65),std('#87613e'),-2.4,.88,.3));
        const cloth=mesh(new THREE.BoxGeometry(2.8,.07,1.6),std('#4d948a'),.1,2.9,0);cloth.rotation.z=.05;g.add(cloth);
        for(const sx of [-1,1])g.add(mesh(new THREE.CylinderGeometry(.04,.05,2.1,5),std('#705438'),sx*1.6,2,0));
      } else {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.16, 8, 40), glow(def.color)); ring.position.y = 3; g.add(ring);
        const disc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40), E.WX.vortexMat('#6a2ad0', '#d8a0ff')); disc.position.y = 3; g.add(disc);
        const hh = halo(def.color, 8, 0.6); hh.position.y = 3; g.add(hh);
        g.add(mesh(new THREE.CylinderGeometry(3.5,3.8,.34,12),std('#6b6278'),0,.17,0));
        for(let k=0;k<4;k++){const a=k*Math.PI/2+.785,x=Math.cos(a)*2.8,z=Math.sin(a)*2.8;g.add(mesh(new THREE.CylinderGeometry(.38,.5,1.4,6),std('#8b8198'),x,.9,z),mesh(new THREE.OctahedronGeometry(.3,0),glow('#cbb3ef'),x,1.8,z));}
        ev.rift = { ring, disc };
      }
      g.position.set(p.x, y, p.z); g.rotation.y = Math.atan2(w.hero.x - p.x, w.hero.z - p.z);
      g.userData.groundSupport = { temporary: true, radius: id === 'caravana' ? 4.2 : 3.8, ...(id === 'fenda' ? { floor: .34 } : {}) };
      sc.add(g); ev.objs.push(g);
      w.colliders.push({ x: p.x, z: p.z, r: 1.6 }); ev.col = w.colliders[w.colliders.length - 1]; w.buildColliderGrid();
      // atacantes: um acampamento temporário com um encontro difícil para o nível do herói
      const base = E.Adv ? E.Adv.encounterLevel(lvl) : lvl;
      const enc = E.EN.build(w.id, base, id === 'fenda' ? 'alta' : 'moderada');
      let cp = null;
      for (let k = 0; k < 24 && !cp; k++) {
        const a = k * Math.PI / 6, d = k < 12 ? 6 : 9, x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
        if (Math.hypot(x, z) < w.bound - 5 && surface(w, x, z) > w.waterLevel + .5 && w.slope(x, z) < .8 && !w.colliders.some(c => Math.hypot(c.x - x, c.z - z) < c.r + 2.1)) cp = { x, z };
      }
      cp = cp || { x: p.x + 4, z: p.z + 3 };
      ev.camp = w.addCamp('ev' + Date.now(), cp, { enc, diff: id === 'fenda' ? 'alta' : 'moderada' });
    } else if (id === 'tesouro') {
      const g = E.WX.chest('luxuoso'); g.scale.setScalar(1.25);
      const hh = halo('#ffd36b', 3, 0.8); hh.position.y = 0.9; g.add(hh);
      g.position.set(p.x, y, p.z); sc.add(g); ev.objs.push(g);
      ev.chest = { g, x: p.x, z: p.z, vx: 0, vz: 0, hop: 0, dir: Math.random() * 6.28 };
    }
    w.event = ev;
    if (E.EX3 && E.EX3.groundWorld) {
      E.EX3.groundWorld(w);
      // Temporary event foundations leave with the event, including their walking floor.
      for (const o of [...ev.objs]) if (o.userData.foundation) ev.objs.push(o.userData.foundation);
      if (id === 'fenda') { const f = ev.objs.find(o => o.userData.groundSupport); ev.platform = f && w.groundPlatforms.find(q => q.x === f.position.x && q.z === f.position.z); }
    }
    E.Audio.sfx('aggro');
    U.emit('wonder:event', { type: 'start', ev });
    return true;
  };
  N3.finish = (w, ok) => {
    const ev = w.event; if (!ev || ev.done) return;
    ev.done = true;
    if (ev.camp && !ev.camp.dead) w.clearCamp(ev.camp, { remote: true });
    for (const it of ev.items) if (it.ia) w.interactables = w.interactables.filter((x) => x !== it.ia);
    if (ev.col) { w.colliders = w.colliders.filter((c) => c !== ev.col); w.buildColliderGrid(); }
    if (ev.platform) w.groundPlatforms = w.groundPlatforms.filter(p => p !== ev.platform);
    w.nearKey = null;
    const lvl = (E.Store.hero() || { level: 1 }).level;
    const reward = ok ? E.WON.eventReward(ev.id, lvl) : null;
    U.emit('wonder:event', { type: ok ? 'done' : 'fail', ev, reward });
    setTimeout(() => { for (const o of ev.objs) {if(o.parent)o.parent.remove(o);if(w.retire)w.retire(o);} if (w.event === ev) w.event = null; }, ok ? 2500 : 300);
    w.evTimer = ok ? 200 + Math.random() * 140 : 140 + Math.random() * 120;
  };

  N3.update = (w, dt) => {
    if (w.cave) return;
    const t = w.t, hr = w.hero;
    for (const m of w.monumentObjs || []) { if (Math.abs(m.x - hr.x) < 80 && Math.abs(m.z - hr.z) < 80) for (const fn of m.anim) fn(t); m.mark.position.y = surface(w, m.lx, m.lz) + 2.2 + Math.sin(t * 2 + m.i) * 0.15; }
    const S = w.summonObj;
    if (S) {
      const ready = E.WON.cooldown(w.id) === 0;
      S.crystal.rotation.y = t * 0.9; S.crystal.position.y = 3.6 + Math.sin(t * 1.4) * 0.25; S.runes.rotation.z = t * 0.4;
      S.crystal.visible = ready; S.ch.material.opacity = ready ? 0.6 + Math.sin(t * 2) * 0.15 : 0.05;
      for (const [f, fh] of S.fires) { f.visible = ready; fh.material.opacity = ready ? 0.55 + Math.sin(t * 9 + f.position.x) * 0.15 : 0; f.scale.y = 0.9 + Math.sin(t * 11 + f.position.z) * 0.15; }
      S.ring.material.opacity = ready ? 0.7 : 0.15;
    }
    for (const s of w.statueObjs || []) {
      s.crystal.rotation.y += dt * (s.on ? 1.2 : 0.3);
      if (!s.on && !E.WG.locked && Math.hypot(s.x - hr.x, s.z - hr.z) < 7) { if (E.WON.wakeStatue(w.id, s.i)) { N3.lightStatue(w, s); U.emit('wonder:statue', s); } }
    }
    // eventos
    if (E.CoopWorld && E.CoopWorld.guest) return;
    const ev = w.event;
    if (!ev) {
      if (!E.WG.locked) w.evTimer -= dt;
      if (w.evTimer <= 0) { const ids = LO.EVENT_ORDER; w.evCycle = (w.evCycle + 1) % ids.length; if (!N3.start(w, ids[w.evCycle])) w.evTimer = 30; }
      return;
    }
    if (ev.done) return;
    if (!E.WG.locked) ev.t -= dt;
    if (ev.beam) ev.beam.material.opacity = .065 + Math.sin(t * 1.4) * .018;
    if (ev.id === 'meteoros') {
      for (const it of ev.items) {
        if (it.taken) continue;
        if (it.fall) { it.vy -= 30 * dt; it.g.position.y += it.vy * dt; if (it.g.position.y <= it.y) { it.g.position.y = it.y; it.fall=false; if(it.crater)it.crater.visible=true; if(it.tail)it.tail.visible=false; if (Math.hypot(it.x - hr.x, it.z - hr.z) < 60) E.Audio.sfx('impact'); } }
        else { it.core.rotation.y = t * 2; it.core.position.y = .52 + Math.sin(t*2+it.k)*.025; if (Math.hypot(it.x - hr.x, it.z - hr.z) < 1.5) { it.taken = true; w.scene.remove(it.g); ev.prog++; E.Audio.sfx('star4'); } }
      }
      if (ev.prog >= ev.need) N3.finish(w, true);
    } else if (ev.id === 'vigilia') {
      ev.prog = ev.items.filter((i) => i.lit).length;
      for (const it of ev.items) if (it.lit) { it.hh.material.opacity = 0.6 + Math.sin(t * 4 + it.x) * 0.15; }
      if (ev.prog >= ev.need) N3.finish(w, true);
    } else if (ev.id === 'caravana' || ev.id === 'fenda') {
      if (ev.rift) { ev.rift.ring.rotation.z = t * 1.2; ev.rift.disc.material.uniforms.t.value = t; }
      if (ev.camp && ev.camp.dead) { ev.prog = 1; N3.finish(w, true); }
    } else if (ev.id === 'tesouro') {
      const c = ev.chest, d = Math.hypot(c.x - hr.x, c.z - hr.z);
      let sp = 1.5;
      if (d < 16) { c.dir = Math.atan2(c.z - hr.z, c.x - hr.x) + Math.sin(t * 1.7) * 0.5; sp = 6.6; } else c.dir += Math.sin(t * 0.7) * dt;
      let nx = c.x + Math.cos(c.dir) * sp * dt, nz = c.z + Math.sin(c.dir) * sp * dt;
      if (surface(w, nx, nz) < w.waterLevel + 0.3 || Math.hypot(nx, nz) > w.bound - 8) { c.dir += Math.PI * 0.6; nx = c.x; nz = c.z; }
      c.x = nx; c.z = nz; c.hop += dt * (sp > 2 ? 12 : 5);
      c.g.position.set(c.x, surface(w, c.x, c.z) + Math.abs(Math.sin(c.hop)) * 0.5, c.z); c.g.rotation.y = -c.dir + Math.PI / 2;
      ev.x = c.x; ev.z = c.z; ev.beam.position.set(c.x, ev.beam.position.y, c.z);
      if (d < 1.8) { ev.prog = 1; N3.finish(w, true); }
    }
    if (!ev.done && ev.t <= 0) N3.finish(w, false);
  };
  N3.lightLantern = (w, it) => {
    if (it.lit) return;
    it.lit = true; it.lamp.material.color.set(w.event ? w.event.def.color : '#9fe3ff'); it.hh.material.opacity = 0.7;
    w.interactables = w.interactables.filter((x) => x !== it.ia); w.nearKey = null;
    E.Audio.sfx('star3');
  };

  E.WN3 = N3;
})();
