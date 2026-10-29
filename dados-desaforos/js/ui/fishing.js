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
  const rarity = (r) => (E.L.RARITY && E.L.RARITY[r]) || { name: '', color: '#ffffff' };
  const rodOf = (d) => E.L.RODS[d.rod] || E.L.RODS[0];
  const statsOf = (d) => rodOf(d).stats || { res: 3, ctl: 3, reach: 3, hook: 3 };
  const ARC = Math.PI * 85; // comprimento do semicírculo do medidor de tensão

  // ------------------------------------------------------------ minijogo
  let active = null;
  FI.start = async (spot) => {
    if (active) return;
    const h = E.Store.hero(), w = E.WG.world;
    if(!h||!w||!spot||!Number.isFinite(spot.wx)||!Number.isFinite(spot.wz))return;
    if(spot.fromBoat&&(!E.Maritime||!E.Maritime.isSailing(w)))return E.UI.toast('Embarque antes de lançar no mar.');
    const d = E.Life.data(h), rod = rodOf(d), st = statsOf(d);
    const biome = spot.biome || w.reg.biome;
    const bait=E.Life.activeBait&&E.Life.activeBait(h,biome);
    const seat = !spot.fromBoat && spot.bench;
    E.WG.locked = true;
    E.HUD.show(false);
    const bars = Object.entries(E.L.ROD_STATS || {}).map(([k, n]) => `<span class="fi-stat" title="${n}: ${st[k]}/10"><i>${n}</i><b style="--v:${st[k] * 10}%"></b></span>`).join('');
    const el = U.h(`<div class="fishing"><div class="fi-panel">
      <div class="fi-top"><span class="fi-rod">${U.esc(rod.name)}</span><span class="fi-stats">${bars}</span></div>
      <div class="fi-chips"><span>Pesca Nv. ${E.Life.level(h, 'pesca')}</span><span data-fi-bait>${bait ? `${U.esc(bait.name)} ×${d[bait.key]}` : 'Sem isca equipada'}</span>${spot.fromBoat?'<span>Barco de pesca · '+(biome==='sea'?'Mar aberto':'Lago')+'</span>':''}${seat ? '<span>Sentado no banco</span>' : ''}${E.Life.buff(h, 'pescador') ? '<span class="gold">Faro de Pescador</span>' : ''}</div>
      <div class="fi-stage"></div>
      <div class="fi-help"></div>
      <div class="fi-btns"><button class="btn dark" data-a="quit"><span class="ico">✕</span>${seat ? 'Levantar' : 'Sair'}</button><button class="btn primary fi-main" data-a="main"><span class="ico">🎣</span><b>Lançar</b></button></div>
    </div></div>`);
    document.body.appendChild(el);
    const stage = el.querySelector('.fi-stage'), help = el.querySelector('.fi-help'), main = el.querySelector('[data-a=main]');
    let quit = false, pressed = false, onMain = null;
    const setMain = (txt, icon, fn) => { main.innerHTML = `<span class="ico">${icon}</span><b>${txt}</b>`; onMain = fn; main.disabled = !fn; };
    el.querySelector('[data-a=quit]').onclick = () => { quit = true; close(); };
    const press = (v) => { pressed = v; main.classList.toggle('held', v); };
    main.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); if (onMain) onMain(); });
    const up = () => press(false);
    addEventListener('pointerup', up); addEventListener('pointercancel', up);
    const key = (e) => { if (e.code === 'Space' || e.code === 'KeyF' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); if (e.type === 'keydown') { if (!e.repeat) { press(true); if (onMain) onMain(); } } else press(false); } else if (e.code === 'Escape' && e.type === 'keydown') { e.stopPropagation(); quit = true; close(); } };
    addEventListener('keydown', key, true); addEventListener('keyup', key, true);
    const close = () => {
      quit=true;
      if (!active) return;
      removeEventListener('keydown', key, true); removeEventListener('keyup', key, true); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      el.classList.add('out'); setTimeout(() => el.remove(), 220);
      active = null; w.fishFx && w.fishFx('end');
      E.HUD.show(true); E.HUD.update();
      setTimeout(() => { if (!E.UI.anyOpen() && !E.BattleUI.current && !(E.WorldServices&&E.WorldServices.active)) E.WG.locked = false; }, 480);
    };
    active = { close };
    const buzz = (ms) => { if (navigator.vibrate && E.state.settings.vibrate) try { navigator.vibrate(ms); } catch { /* sem vibração */ } };

    // apresentação especial dos peixes épicos e lendários
    const reveal = (f, R) => {
      const fx = U.h(`<div class="fi-reveal r${f.r}" style="--rc:${R.color}"><div class="fv-rays"></div><img src="${FI.art(f, 6)}" alt=""><b>${f.r >= 5 ? 'LENDÁRIO!' : 'ÉPICO!'}</b><span>${U.esc(f.name)}</span></div>`);
      document.body.appendChild(fx); setTimeout(() => fx.classList.add('out'), 2100); setTimeout(() => fx.remove(), 2600);
    };

    const round = async () => {
      if (spot.left <= 0) { stage.innerHTML = '<div class="fi-msg">Os peixes daqui se espantaram. Volte em alguns minutos ou procure outro ponto.</div>'; setMain('Lançar', '🎣', null); return; }
      const baitStatus=el.querySelector('[data-fi-bait]');
      const updateBait=(used)=>{const b=E.Life.rodBait(h);baitStatus.textContent=b?`${b.name} ×${d[b.key]||0}${used?' · nesta linha':b.key==='sbait'&&biome!=='sea'?' · somente no mar':!(d[b.key]>0)?' · esgotada':''}`:'Sem isca equipada';};
      updateBait(false);
      // 1. lançar
      stage.innerHTML = '<div class="fi-msg">Toque em <b>Lançar</b> (ou Espaço) para jogar a linha.</div>';
      help.textContent = '';
      await new Promise((r) => setMain('Lançar', '🎣', r));
      if (quit) return;
      const castBait=E.Life.activeBait(h,biome),receipt=E.Life.beginFishingCast(h,biome);
      if(!receipt){UI.toast('A isca não está mais disponível.');return round();}
      updateBait(!!castBait);
      E.Audio.sfx('slash');
      w.fishFx && w.fishFx('cast', spot, { reach: st.reach });
      setMain('Aguarde…', '⏳', null);
      stage.innerHTML = '<div class="fi-wait"><div class="fi-float"><i></i><u></u><u></u></div><div class="fi-msg">A boia balança na água…</div></div>';
      // 2. espera (a fisgada vem antes com varas mais sensíveis)
      await U.wait((1400 + U.rand() * 3600) * (1 - (st.hook - 3) * 0.06) * (castBait?castBait.waitMult:1));
      if (quit) return;
      // 3. fisgada
      w.fishFx && w.fishFx('bite', spot);
      E.Audio.sfx('aggro'); buzz(70);
      const winMs = 1150 + E.Life.level(h, 'pesca') * 40 + (st.hook - 3) * 90;
      stage.innerHTML = `<div class="fi-bite"><div class="fb-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" style="animation-duration:${winMs}ms"/></svg><b>!</b></div><span>Fisgou! Puxe agora</span></div>`;
      let hooked = false;
      await Promise.race([new Promise((r) => setMain('Fisgar!', '❗', () => { hooked = true; r(); })), U.wait(winMs)]);
      if (quit) return;
      if (!hooked) { updateBait(false);stage.innerHTML = '<div class="fi-msg">Ah, não! O peixe roubou a isca e fugiu. Seja mais rápido!</div>'; E.Audio.sfx('fail'); w.fishFx && w.fishFx('escape', spot); setMain('Tentar de novo', '🎣', () => round()); return; }
      // 4. luta com tensão na linha
      const res = E.Life.rollCatch(h, biome, w.id, receipt);
      const ok = await reel(res.junk ? null : res.fish);
      if (quit) return;
      spot.left--;
      if (spot.left <= 0) { E.state.world.fishDep = E.state.world.fishDep || {}; E.state.world.fishDep[`${w.id}:${spot.i}`] = Date.now(); }
      if (ok !== true) {
        updateBait(false);
        stage.innerHTML = `<div class="fi-msg">${ok === 'break' ? 'A linha arrebentou com a tensão… solte quando o peixe correr.' : ok === 'slack' ? 'A linha ficou frouxa e o peixe se soltou do anzol.' : 'O peixe levou a linha e escapou.'}</div>`;
        E.Audio.sfx('fail'); buzz(140); w.fishFx && w.fishFx('escape', spot); setMain('Pescar de novo', '🎣', () => round()); return;
      }
      const caught = res.fish || res.junk;
      w.fishFx && w.fishFx('catch', spot, { art: FI.artCanvas(caught), r: res.fish ? res.fish.r : 1 });
      // 5. resultado
      const first = res.fish && !d.dex[res.fish.id];
      E.Life.landCatch(h, res);updateBait(false);
      E.Audio.sfx(res.fish && res.fish.r >= 4 ? 'crit' : 'chest');
      if (res.junk) stage.innerHTML = `<div class="fi-result"><div class="fr-ic">${res.junk.icon}</div><div><div class="fr-n">${res.junk.name}</div><div class="fr-d">${res.junk.desc}</div></div></div>`;
      else {
        const f = res.fish, R = rarity(f.r);
        if (f.r >= 4) { reveal(f, R); buzz([40, 60, 90]); if (f.r >= 5 && E.Audio.sfx) setTimeout(() => E.Audio.sfx('levelup'), 350); }
        stage.innerHTML = `<div class="fi-result r${f.r} ${f.legend ? 'legend' : ''}" style="--rc:${R.color}"><img src="${FI.art(f, 4)}" alt=""><div><div class="fr-s">${R.name} <em>${FI.stars(f.r)}</em>${f.legend ? ' · Lendário da região' : ''}</div><div class="fr-n">${f.name}${first ? '<span class="fr-new">NOVO!</span>' : ''}</div><div class="fr-d">${res.cm} cm · vale ${f.price} po · ${f.desc}</div>${res.blessing ? '<div class="fr-bless">Bênção das Águas: Faro de Pescador por 20 minutos.</div>' : ''}</div></div>`;
      }
      setMain('Pescar de novo', '🎣', () => round());
    };

    // tensão da linha: segure para recolher; quando o peixe corre, solte para a linha não arrebentar
    const reel = (fish) => new Promise((resolve) => {
      const lv = E.Life.level(h, 'pesca'), diff = fish ? fish.diff : 1, legend = !!(fish && fish.r >= 5);
      const lo = 0.26, hi = Math.min(0.86, 0.7 + (st.ctl - 3) * 0.025), breakAt = 0.35 + st.res * 0.06, slackAt = 1.3 + st.ctl * 0.08;
      const arc = (from, to, cls) => `<path class="${cls}" d="M15 100 A85 85 0 0 1 185 100" style="stroke-dasharray:${((to - from) * ARC).toFixed(1)} ${ARC.toFixed(1)};stroke-dashoffset:${(-from * ARC).toFixed(1)}"/>`;
      stage.innerHTML = `<div class="fi-reel${legend ? ' legend' : ''}"><div class="ft-gauge"><svg viewBox="0 0 200 108">${arc(0, 1, 'ft-track')}${arc(lo, hi, 'ft-safe')}${arc(0.9, 1, 'ft-danger')}</svg><i class="ft-needle"></i><span class="ft-label">Tensão</span></div>
        <div class="ft-side"><div class="ft-prog"><i></i><b></b></div><div class="ft-state"></div><div class="ft-tip">Segure <b>Puxar</b> (ou Espaço) para recolher e solte quando o peixe correr.</div></div></div>`;
      const box = stage.querySelector('.fi-reel'), needle = stage.querySelector('.ft-needle'), bar = stage.querySelector('.ft-prog i'), fishMark = stage.querySelector('.ft-prog b'), state = stage.querySelector('.ft-state');
      setMain('Puxar!', '⬆', () => {});
      let T = 0.36, P = 0.18, last = performance.now(), surge = 0, next = 1 + U.rand() * 1.5, strain = 0, slack = 0, said = '';
      const say = (txt, cls) => { if (said !== txt) { said = txt; state.textContent = txt; state.className = 'ft-state ' + (cls || ''); } };
      const step = (now) => {
        if (quit) return resolve(false);
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (surge > 0) surge -= dt;
        else if ((next -= dt) <= 0) { surge = (0.55 + U.rand() * (0.4 + diff * 0.18)) * (legend ? 1.35 : 1); next = Math.max(0.6, 2.8 - diff * 0.35 + U.rand() * 1.4); buzz(30); }
        // soltar a linha sempre compensa uma corrida; segurar durante ela leva a tensão ao limite
        const pull = surge > 0 ? (0.2 + diff * 0.07) * (legend ? 1.15 : 1) : 0.05 + diff * 0.015;
        T = U.clamp(T + ((pressed ? 0.95 - st.ctl * 0.035 : -(0.55 + st.ctl * 0.02)) + pull) * dt + (U.rand() - 0.5) * dt * 0.12 * diff, 0, 1.08);
        const safe = T >= lo && T <= hi;
        if (pressed && safe) P += (0.24 + lv * 0.004 + st.ctl * 0.01 - diff * 0.012) * (surge > 0 ? 0.35 : 1) * dt;
        if (!pressed && surge > 0) P -= (0.02 + diff * 0.006) * dt;
        P = U.clamp(P, 0, 1);
        strain = T > 1 ? strain + dt : Math.max(0, strain - dt * 0.8);
        slack = T < lo ? slack + dt : Math.max(0, slack - dt * 1.5);
        needle.style.transform = `rotate(${(-90 + Math.min(1, T) * 180).toFixed(1)}deg)`;
        bar.style.width = (P * 100).toFixed(1) + '%'; fishMark.style.left = (P * 100).toFixed(1) + '%';
        const tell = surge <= 0 && next < 0.4;
        box.classList.toggle('strain', strain > 0); box.classList.toggle('surge', surge > 0); box.classList.toggle('tell', tell); box.classList.toggle('safe', safe && pressed);
        if (strain > 0) say('A linha vai arrebentar! Solte!', 'bad');
        else if (surge > 0) say('O peixe está correndo — solte a linha!', 'warn');
        else if (tell) say('Ele vai puxar…', 'warn');
        else if (T < lo) say('Linha frouxa — recolha!', 'warn');
        else if (safe && pressed) say('Recolhendo…', 'good');
        else say(T > hi ? 'Tensão alta' : 'Segure para recolher', '');
        w.fishFx && w.fishFx('reel', spot, { prog: P, fish: T, inside: safe });
        if (P >= 1) return resolve(true);
        if (strain > breakAt) return resolve('break');
        if (slack > slackAt) return resolve('slack');
        if (P <= 0) return resolve('run');
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (seat && w.fishFx) { w.fishFx('sit', spot); stage.innerHTML = '<div class="fi-msg">Você se senta no banco…</div>'; setMain('Lançar', '🎣', null); await U.wait(850); if (quit) return; }
    round();
  };

  FI.cancel=()=>{if(active)active.close();};
  FI.isActive=()=>!!active;
  E.Fishing = FI;
})();
