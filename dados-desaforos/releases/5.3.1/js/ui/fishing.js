/* Pesca: lançar, esperar a fisgada, reagir a tempo e segurar o peixe dentro da zona (estilo Stardew). */
(() => {
  const U = E.U, UI = E.UI;
  const FI = {};

  // ------------------------------------------------------------ arte dos peixes (Pescadex)
  const artCache = {}, cvCache = {};
  // quadro do peixe (para o peixe que salta da água na animação 3D)
  FI.artCanvas = (f) => {
    if (cvCache[f.id]) return cvCache[f.id];
    if (f.icon && !f.shape) { const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d'); E.Icons.paint(x, f.icon, 0, 0, 64); return (cvCache[f.id] = c); }
    FI.art(f, 1);
    return cvCache[f.id];
  };
  FI.art = (f, scale = 4) => {
    const key = f.id + '|' + scale;
    if (artCache[key]) return artCache[key];
    const K = E.MS.K, sh = E.SP.shade;
    const c = document.createElement('canvas'); c.width = 48; c.height = 30;
    const g = c.getContext('2d');
    const { c1, c2 } = f;
    if (f.shape === 'eel') {
      K.limb(g, [[4, 18], [12, 12], [22, 18], [32, 12], [42, 15]], 7, c1);
      K.line(g, [[6, 17], [14, 11.5], [22, 16], [32, 11], [40, 13]], 1.5, c2);
      K.eye(g, 41, 13.5, 1.4, '#111', {}); K.dots(g, [[44, 16]], 0.8, '#2a0c10');
    } else if (f.shape === 'ray') {
      K.shape(g, [[24, 4], [44, 15], [24, 24], [4, 15]], c1, { smooth: true });
      K.dots(g, [[18, 12], [24, 9], [30, 12], [24, 16]], 1.6, c2);
      K.curve(g, 24, 22, 20, 26, 14, 28, 1.5, sh(c1, -0.3));
      K.eye(g, 20, 11, 1.2, '#111'); K.eye(g, 28, 11, 1.2, '#111');
    } else if (f.shape === 'jelly') {
      for (let i = 0; i < 5; i++) K.curve(g, 14 + i * 5, 16, 12 + i * 5 + (i % 2) * 4, 22, 15 + i * 5, 29, 1.4, c2);
      K.blob(g, 24, 12, 13, 9, c1, { light: 0.5, dark: 0.2 });
      K.blob(g, 24, 10, 6, 4, c2, { light: 0.5 });
    } else if (f.shape === 'squid') {
      for (let i = 0; i < 6; i++) K.curve(g, 10, 13 + i, 4, 10 + i * 2, 1, 6 + i * 4, 1.6, sh(c1, -0.1));
      K.shape(g, [[10, 9], [36, 6], [46, 15], [36, 24], [10, 21]], c1, { smooth: true });
      K.dots(g, [[22, 12], [28, 17], [33, 11]], 1.4, c2);
      K.eye(g, 16, 14, 2, c2, { sclera: true });
    } else if (f.shape === 'crab') {
      for (let i = 0; i < 3; i++) { K.limb(g, [[18, 20], [10 - i * 2, 24 + i], [8 - i * 3, 29]], 2, sh(c1, -0.2)); K.limb(g, [[30, 20], [38 + i * 2, 24 + i], [40 + i * 3, 29]], 2, sh(c1, -0.2)); }
      K.blob(g, 10, 8, 6, 5, c1); K.blob(g, 38, 8, 6, 5, c1);
      K.blob(g, 24, 18, 13, 8, c1); K.dots(g, [[19, 16], [24, 15], [29, 16]], 1.2, c2);
      K.eye(g, 21, 11, 1.6, '#111', { sclera: true }); K.eye(g, 27, 11, 1.6, '#111', { sclera: true });
    } else if (f.shape === 'puffer') {
      K.shape(g, [[2, 9], [10, 15], [2, 21]], sh(c1, -0.15));
      K.blob(g, 24, 15, 15, 12, c1);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; K.line(g, [[24 + Math.cos(a) * 13, 15 + Math.sin(a) * 10], [24 + Math.cos(a) * 17, 15 + Math.sin(a) * 13.5]], 1, sh(c1, -0.35)); }
      K.blob(g, 25, 20, 9, 5, c2, { light: 0.2 });
      K.eye(g, 32, 11, 2.2, '#111', { sclera: true }); K.dots(g, [[38, 16]], 1.2, '#2a0c10');
    } else if (f.shape === 'whale') {
      K.shape(g, [[2, 6], [9, 13], [3, 20], [8, 13]], sh(c1, -0.1));
      K.shape(g, [[8, 13], [24, 4], [44, 10], [46, 18], [30, 24], [10, 18]], c1, { smooth: true });
      K.shape(g, [[14, 18], [44, 17], [32, 24]], c2, { smooth: true });
      for (let i = 0; i < 4; i++) K.line(g, [[24 + i * 4, 18], [26 + i * 4, 22]], 0.8, sh(c2, -0.2));
      K.eye(g, 37, 12, 1.3, '#111');
    } else {
      // peixe comum
      K.shape(g, [[3, 6], [12, 15], [3, 24], [7, 15]], sh(c1, -0.1));
      K.shape(g, [[10, 15], [22, 5], [38, 7], [46, 15], [38, 22], [22, 24]], c1, { smooth: true });
      K.shape(g, [[18, 16], [44, 16], [36, 22], [22, 23]], c2, { smooth: true, light: 0.2, dark: 0.15 });
      K.shape(g, [[22, 6], [28, 1], [33, 7]], sh(c1, -0.2));
      K.shape(g, [[26, 18], [30, 25], [33, 19]], sh(c1, -0.25));
      K.strokes(g, 26, 11, 10, 3, sh(c1, -0.3), 10, 2, f.id.length, -2.3);
      K.eye(g, 39, 12, 1.6, '#111', { sclera: true });
      K.line(g, [[44, 16], [46, 16]], 1, sh(c1, -0.5));
    }
    const cv = E.MS.finalize(c);
    cvCache[f.id] = cv;
    const out = document.createElement('canvas'); out.width = cv.width * scale; out.height = cv.height * scale;
    const x = out.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(cv, 0, 0, out.width, out.height);
    return (artCache[key] = out.toDataURL());
  };
  FI.stars = (r) => '★'.repeat(r);

  // ------------------------------------------------------------ minijogo
  let active = null;
  FI.start = async (spot) => {
    if (active) return;
    const h = E.Store.hero(), w = E.WG.world;
    if(!h||!w||!spot||!Number.isFinite(spot.wx)||!Number.isFinite(spot.wz))return;
    if(spot.fromBoat&&(!E.Maritime||!E.Maritime.isSailing(w)))return E.UI.toast('Embarque antes de lançar no mar.');
    const d = E.Life.data(h);
    const biome = spot.biome || w.reg.biome;
    const bait=E.Life.activeBait&&E.Life.activeBait(h,biome);
    E.WG.locked = true;
    E.HUD.show(false);
    const el = U.h(`<div class="fishing"><div class="fi-panel">
      <div class="fi-top"><span>🎣 ${E.L.RODS[d.rod].name}</span><span>Pesca Nv. ${E.Life.level(h, 'pesca')}</span>${bait ? `<span>${U.esc(bait.name)} ×${d[bait.key]}</span>` : ''}${spot.fromBoat?'<span>Barco de pesca · '+(biome==='sea'?'Mar aberto':'Lago')+'</span>':''}${E.Life.buff(h, 'pescador') ? '<span>🐟 Faro de Pescador</span>' : ''}</div>
      <div class="fi-stage"></div>
      <div class="fi-help"></div>
      <div class="fi-btns"><button class="btn dark" data-a="quit"><span class="ico">✕</span>Sair</button><button class="btn primary fi-main" data-a="main"><span class="ico">🎣</span><b>Lançar</b></button></div>
    </div></div>`);
    document.body.appendChild(el);
    const stage = el.querySelector('.fi-stage'), help = el.querySelector('.fi-help'), main = el.querySelector('[data-a=main]');
    let quit = false, pressed = false, onMain = null;
    const setMain = (txt, icon, fn) => { main.innerHTML = `<span class="ico">${icon}</span><b>${txt}</b>`; onMain = fn; main.disabled = !fn; };
    el.querySelector('[data-a=quit]').onclick = () => { quit = true; close(); };
    const press = (v) => { pressed = v; };
    main.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); if (onMain) onMain(); });
    addEventListener('pointerup', () => press(false));
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); if (e.type === 'keydown') { if (!e.repeat) { press(true); if (onMain) onMain(); } } else press(false); } else if (e.code === 'Escape' && e.type === 'keydown') { e.stopPropagation(); quit = true; close(); } };
    addEventListener('keydown', key, true); addEventListener('keyup', key, true);
    const close = () => {
      quit=true;
      if (!active) return;
      removeEventListener('keydown', key, true); removeEventListener('keyup', key, true);
      el.remove(); active = null; w.fishFx && w.fishFx('end');
      E.HUD.show(true); E.HUD.update();
      setTimeout(() => { if (!E.UI.anyOpen() && !E.BattleUI.current && !(E.WorldServices&&E.WorldServices.active)) E.WG.locked = false; }, 200);
    };
    active = { close };

    const round = async () => {
      if (spot.left <= 0) { stage.innerHTML = '<div class="fi-msg">Os peixes daqui se espantaram. Volte em alguns minutos ou procure outro ponto.</div>'; setMain('Lançar', '🎣', null); return; }
      // 1. lançar
      stage.innerHTML = '<div class="fi-msg">Toque em <b>Lançar</b> (ou Espaço) para jogar a linha.</div>';
      help.textContent = '';
      await new Promise((r) => setMain('Lançar', '🎣', r));
      if (quit) return;
      E.Audio.sfx('slash');
      w.fishFx && w.fishFx('cast', spot);
      setMain('Aguarde…', '⏳', null);
      stage.innerHTML = '<div class="fi-msg fi-wait">A boia balança na água… <span class="dots"></span></div>';
      // 2. espera
      const waitMs = 1400 + U.rand() * 3600;
      await U.wait(waitMs);
      if (quit) return;
      // 3. fisgada
      w.fishFx && w.fishFx('bite', spot);
      E.Audio.sfx('aggro');
      stage.innerHTML = '<div class="fi-bite">!</div>';
      let hooked = false;
      const winMs = 1150 + E.Life.level(h, 'pesca') * 40;
      await Promise.race([new Promise((r) => setMain('Fisgar!', '❗', () => { hooked = true; r(); })), U.wait(winMs)]);
      if (quit) return;
      if (!hooked) { const lost=E.Life.activeBait&&E.Life.activeBait(h,biome);if(lost)E.Life.spendBait(h,lost.key);stage.innerHTML = '<div class="fi-msg">Ah, não! O peixe roubou a isca e fugiu. Seja mais rápido!</div>'; E.Audio.sfx('fail'); w.fishFx && w.fishFx('escape', spot); setMain('Tentar de novo', '🎣', () => round()); return; }
      // 4. puxar
      const res = E.Life.rollCatch(h, biome, w.id);
      const diff = res.junk ? 1 : res.fish.diff;
      const ok = await reel(diff);
      if (quit) return;
      spot.left--;
      if (spot.left <= 0) { E.state.world.fishDep = E.state.world.fishDep || {}; E.state.world.fishDep[`${w.id}:${spot.i}`] = Date.now(); }
      if (!ok) { if(res.baitKey)E.Life.spendBait(h,res.baitKey);stage.innerHTML = '<div class="fi-msg">A linha arrebentou… o peixe escapou.</div>'; E.Audio.sfx('fail'); w.fishFx && w.fishFx('escape', spot); setMain('Pescar de novo', '🎣', () => round()); return; }
      const caught = res.fish || res.junk;
      w.fishFx && w.fishFx('catch', spot, { art: FI.artCanvas(caught), r: res.fish ? res.fish.r : 1 });
      // 5. resultado
      const first = res.fish && !d.dex[res.fish.id];
      E.Life.landCatch(h, res);
      E.Audio.sfx(res.fish && res.fish.r >= 4 ? 'crit' : 'chest');
      if (res.junk) stage.innerHTML = `<div class="fi-result"><div class="fr-ic">${res.junk.icon}</div><div><div class="fr-n">${res.junk.name}</div><div class="fr-d">${res.junk.desc}</div></div></div>`;
      else {
        const f = res.fish;
        stage.innerHTML = `<div class="fi-result r${f.r} ${f.legend ? 'legend' : ''}"><img src="${FI.art(f, 4)}" alt=""><div><div class="fr-s">${f.legend ? '✦ LENDÁRIO DA REGIÃO ✦' : FI.stars(f.r)}</div><div class="fr-n">${f.name}${first ? '<span class="fr-new">NOVO!</span>' : ''}</div><div class="fr-d">${res.cm} cm · vale ${f.price} po · ${f.desc}</div></div></div>`;
      }
      setMain('Pescar de novo', '🎣', () => round());
    };

    // barra de captura (segure para subir)
    const reel = (diff) => new Promise((resolve) => {
      const lv = E.Life.level(h, 'pesca');
      const zoneH = 0.22 + lv * 0.006 + d.rod * 0.03;
      stage.innerHTML = `<div class="fi-reel"><div class="fr-col"><div class="fr-zone"></div><div class="fr-fish">🐟</div></div><div class="fr-prog"><i></i></div><div class="fr-tip">Segure <b>Puxar</b> (ou Espaço) para subir a zona verde e mantenha o peixe dentro dela!</div></div>`;
      const zoneEl = stage.querySelector('.fr-zone'), fishEl = stage.querySelector('.fr-fish'), progEl = stage.querySelector('.fr-prog i');
      setMain('Puxar!', '⬆', () => {});
      let zone = 0.1, vz = 0, fish = 0.5, target = 0.5, prog = 0.3, last = performance.now(), tChange = 0;
      const speed = 0.18 + diff * 0.11;
      const step = (now) => {
        if (quit) return resolve(false);
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        vz += (pressed ? 3.4 : -2.6) * dt; vz = U.clamp(vz, -1.6, 1.6);
        zone += vz * dt; if (zone < 0) { zone = 0; vz = Math.max(0, vz) * 0.3; } if (zone > 1 - zoneH) { zone = 1 - zoneH; vz = Math.min(0, vz) * 0.3; }
        tChange -= dt;
        if (tChange <= 0) { target = U.rand(); tChange = 0.4 + U.rand() * (1.6 - diff * 0.2); }
        fish += (target - fish) * Math.min(1, dt * speed * 3) + (U.rand() - 0.5) * dt * diff * 0.25;
        fish = U.clamp(fish, 0.02, 0.98);
        const inside = fish >= zone && fish <= zone + zoneH;
        prog += (inside ? 0.34 : -0.15 - diff * 0.03) * dt;
        zoneEl.style.bottom = (zone * 100) + '%'; zoneEl.style.height = (zoneH * 100) + '%';
        zoneEl.classList.toggle('on', inside);
        w.fishFx && w.fishFx('reel', spot, { prog: U.clamp(prog, 0, 1), fish, inside });
        fishEl.style.bottom = `calc(${fish * 100}% - 12px)`;
        progEl.style.height = (U.clamp(prog, 0, 1) * 100) + '%';
        if (prog >= 1) return resolve(true);
        if (prog <= 0) return resolve(false);
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    round();
  };

  FI.cancel=()=>{if(active)active.close();};
  FI.isActive=()=>!!active;
  E.Fishing = FI;
})();
