/* Troca de personagem no estilo Genshin: quem sai se desfaz em fagulhas da cor da sua "visão" e quem entra
   surge num redemoinho de luz, com um anel no chão e um clarão sobre o sprite. Só efeitos visuais. */
(() => {
  'use strict';
  const FX = {};
  let glowTex = null, ringTex = null;
  const radial = () => {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); return glowTex;
  };
  const ring = () => {
    if (ringTex) return ringTex;
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 34, 64, 64, 62); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.62, 'rgba(255,255,255,.95)'); g.addColorStop(.75, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30); x.lineTo(64 + Math.cos(a) * 40, 64 + Math.sin(a) * 40); x.stroke(); }
    ringTex = new THREE.CanvasTexture(c); return ringTex;
  };
  const add = (m) => new THREE.SpriteMaterial({ map: radial(), color: m, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 });

  // w: mundo atual · oldCv: quadro do personagem que sai · color: cor da visão de quem entra
  FX.swap = (w, oldCv, color, colorOut) => {
    if (!w || !w.scene || !w.hero || !w.heroSprite || typeof THREE === 'undefined') return;
    if (matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hr = w.hero, hs = w.heroSprite, hh = hs.userData.h || 2.5, scene = w.scene, items = [];
    const col = new THREE.Color(color || '#ffe9a8'), colOut = new THREE.Color(colorOut || '#ffffff');
    // fantasma de quem sai: mesma figura, clareando e subindo enquanto some
    let ghost = null;
    if (oldCv) {
      const t = new THREE.CanvasTexture(oldCv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
      ghost = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 1 }));
      ghost.center.set(.5, oldCv._cy ?? .02); ghost.scale.copy(hs.scale); ghost.position.copy(hs.position); scene.add(ghost); items.push(ghost);
    }
    const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: hs.material.map, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 1 }));
    flash.center.copy(hs.center); scene.add(flash); items.push(flash);
    // anel no chão e coluna de luz
    const disc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ring(), color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    disc.rotation.x = -Math.PI / 2; scene.add(disc); items.push(disc);
    const pillar = new THREE.Sprite(add(col)); pillar.center.set(.5, .05); scene.add(pillar); items.push(pillar);
    // fagulhas: as de quem sai sobem dispersas; as de quem entra giram em espiral para dentro
    const sparks = [];
    for (let i = 0; i < 26; i++) {
      const out = i < 10, s = new THREE.Sprite(add(out ? colOut : (i % 3 ? col : new THREE.Color('#ffffff'))));
      s.userData = { out, a: Math.random() * Math.PI * 2, r: out ? .3 + Math.random() * .5 : 1.3 + Math.random() * .8, y: Math.random(), sp: (Math.random() < .5 ? -1 : 1) * (3 + Math.random() * 3), size: .12 + Math.random() * .16 };
      scene.add(s); items.push(s); sparks.push(s);
    }
    const t0 = performance.now(), dur = 900;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur), base = new THREE.Vector3(hr.x, hr.y + hr.jump, hr.z);
      if (ghost) { const g = Math.min(1, k / .45); ghost.position.set(base.x, base.y + g * .35, base.z); ghost.material.opacity = 1 - g; ghost.material.color.setRGB(1 + g * 2, 1 + g * 2, 1 + g * 2); ghost.scale.set(hs.scale.x * (1 + g * .12), hs.scale.y * (1 - g * .25), 1); }
      // quem entra: escala suave de 0,85 a 1 com clarão que apaga
      const inK = Math.max(0, (k - .18) / .82), e = 1 - Math.pow(1 - Math.min(1, inK * 1.6), 3);
      hs.material.opacity = Math.min(1, inK * 2.2);
      flash.material.map = hs.material.map; flash.position.copy(hs.position); flash.scale.set(hs.scale.x * (.85 + .15 * e), hs.scale.y * (.85 + .15 * e), 1); flash.material.opacity = Math.max(0, 1 - inK * 1.4);
      disc.position.set(base.x, hr.y + .06, base.z); const r = .4 + k * 3.2; disc.scale.set(r, r, 1); disc.material.opacity = Math.max(0, 1 - k) * .9; disc.rotation.z = k * 2;
      pillar.position.set(base.x, hr.y, base.z); pillar.scale.set(1.2 * (1 - k * .6), hh * 1.7 * (1 - Math.max(0, k - .5)), 1); pillar.material.opacity = Math.sin(Math.min(1, k * 1.4) * Math.PI) * .55;
      for (const s of sparks) {
        const u = s.userData; let x, y, z, o;
        if (u.out) { const q = Math.min(1, k / .6); x = base.x + Math.cos(u.a) * u.r * (1 + q); z = base.z + Math.sin(u.a) * u.r * (1 + q) * .7; y = base.y + hh * (u.y * .8 + q * .9); o = 1 - q; }
        else { const q = Math.max(0, (k - .1) / .9), rr = u.r * (1 - q), a = u.a + q * u.sp; x = base.x + Math.cos(a) * rr; z = base.z + Math.sin(a) * rr * .7; y = base.y + hh * (u.y * (1 - q) * 1.1 + q * .5); o = Math.sin(Math.min(1, q * 1.2) * Math.PI); }
        s.position.set(x, y, z); s.scale.setScalar(u.size * (1.4 - k * .6)); s.material.opacity = Math.max(0, o);
      }
      if (k < 1 && w === E.WG.world) requestAnimationFrame(step);
      else { hs.material.opacity = 1; for (const it of items) { scene.remove(it); if (it.geometry) it.geometry.dispose(); if (it.material) { if (it.material.map && it === ghost) it.material.map.dispose(); it.material.dispose(); } } }
    };
    hs.material.transparent = true; hs.material.opacity = 0;
    requestAnimationFrame(step);
  };
  E.PartyFX = FX;
})();
