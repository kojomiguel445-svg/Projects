/* HUD de exploração. */
(() => {
  const U = E.U, UI = E.UI, C = E.C;
  const HUD = {};
  let el, mm, mmx, near = [], lastMini = -Infinity, lastLabels = -Infinity, lastTracker = -Infinity;
  let labelsEl, onlineLabelsEl, trackerMarkup = null, lastWorld = null, refs = {}, hudVisible = true;
  let miniVignette = null, miniViewCone = null, lastCoopMarkup = null, lastLife = -Infinity;
  const npcLabels = new Map(), onlineLabels = [], promptButtons = [];
  const writeText = (node, value) => { if (node._text !== value) { node.textContent = value; node._text = value; } };
  const writeHtml = (node, value) => { if (node._html !== value) { node.innerHTML = value; node._html = value; } };
  const writeStyle = (node, prop, value) => { if (node.style[prop] !== value) node.style[prop] = value; };

  HUD.mount = () => {
    if (el) el.remove();
    refs = {}; near = []; promptButtons.length = 0; npcLabels.clear(); onlineLabels.length = 0;
    lastMini = lastLabels = lastTracker = lastLife = -Infinity; lastWorld = null; hudVisible = true;
    miniVignette = miniViewCone = null; lastCoopMarkup = null; stEl = null;
    el = U.h(`<div id="hud" class="layer noevents">
      <div class="labels"></div>
      <div class="hud-tl">
        <div class="minimap" title="Abrir mapa"><canvas width="256" height="256"></canvas><span class="compass">N</span></div>
        <div class="region-name"></div>
        <div class="survival-hud"><span class="survival-time" aria-label="Calendário"></span><button class="survival-food" data-a="food" title="Comida e saciedade">${E.Icons ? E.Icons.html('cooking', { decorative: true }) : ''}<span></span><i><b></b></i></button></div>
        <div class="tracker"></div>
      </div>
      <div class="hud-tr">
        <button class="icon-btn sprint-btn" data-a="sprint" data-key="Shift" aria-label="Correr (segure)" aria-pressed="false" title="Correr: segure este botão ou Shift">${E.Icons ? E.Icons.html('runner', { decorative: true }) : UI.ICONS.jump}</button>
        <button class="icon-btn online-btn" data-a="online" title="Jogadores online e grupo">${UI.ICONS.globe}<span class="ob-n"></span></button>
        <button class="icon-btn" data-a="wish" data-key="O" title="Oráculo das Armas">${UI.ICONS.wish}</button>
        <button class="icon-btn" data-a="quests" data-key="J" title="Missões">${UI.ICONS.quest}</button>
        <button class="icon-btn" data-a="map" data-key="M" title="Mapa">${UI.ICONS.map}</button>
        <button class="icon-btn" data-a="menu" data-key="Esc" title="Menu">${UI.ICONS.menu}</button>
      </div>
      <div class="coop-bar"></div>
      <div class="prompts"></div>
      <div class="hud-bottom"><div class="hp-name"><span class="lv"></span><span class="nm"></span><span class="hp-num"></span></div><div class="bar hpbar"><i class="hp"></i><i class="temp"></i></div><div class="bar xp"><i></i></div></div>
      <div class="ia-mark" aria-hidden="true"><i></i></div>
      <div class="joy" aria-hidden="true"><i></i></div>
      <div class="mobile-actions"><button class="icon-btn" data-a="jump" aria-label="Pular">${UI.ICONS.jump}</button><button class="icon-btn act" data-a="act" aria-label="Interagir">${UI.ICONS.hand}</button></div>
    </div>`);
    document.getElementById('ui').appendChild(el);
    mm = el.querySelector('.minimap canvas');
    mmx = mm.getContext('2d');
    labelsEl = el.querySelector('.labels');
    onlineLabelsEl = document.createElement('div');
    onlineLabelsEl.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    labelsEl.appendChild(onlineLabelsEl);
    for (const [key, selector] of Object.entries({ region: '.region-name', name: '.nm', level: '.lv', hpNum: '.hp-num', iaMark: '.ia-mark', hp: '.hp', temp: '.temp', hpbar: '.hpbar', xp: '.xp i', tracker: '.tracker', prompts: '.prompts', act: '[data-a=act]', sprint: '[data-a=sprint]', jump: '[data-a=jump]', lifeTime: '.survival-time', food: '[data-a=food]', foodLabel: '[data-a=food] > span', foodFill: '[data-a=food] b' })) refs[key] = el.querySelector(selector);
    el.querySelector('.minimap').onclick = () => E.Wonders.regionMap();
    el.querySelector('.tracker').onclick = () => E.Journal.quests();
    el.querySelector('[data-a=wish]').onclick = () => E.Wish.open();
    el.querySelector('[data-a=online]').onclick = () => E.Online.panel();
    if (E.Online) E.Online.mountChat(el);
    el.querySelector('[data-a=quests]').onclick = () => E.Journal.quests();
    el.querySelector('[data-a=map]').onclick = () => E.Wonders.regionMap();
    el.querySelector('[data-a=menu]').onclick = () => E.Menu.open();
    el.querySelector('[data-a=jump]').onclick = () => E.WG.world && E.WG.world.jump('touch');
    refs.food.onclick = () => { if(E.WorldServices&&E.WorldServices.foodBag)E.WorldServices.foodBag();else if (E.Sim && E.Sim.openFood) E.Sim.openFood({ fire: false }); };
    const run = refs.sprint;
    const runEnd = () => { E.WG.input.sprint = false; run.setAttribute('aria-pressed', 'false'); };
    run.addEventListener('pointerdown', (event) => { if (run.disabled) return; event.preventDefault(); E.WG.input.sprint = true; run.setAttribute('aria-pressed', 'true'); try { run.setPointerCapture(event.pointerId); } catch {} });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) run.addEventListener(type, runEnd);
    run.addEventListener('keydown', (event) => { if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); if (!run.disabled) { E.WG.input.sprint = true; run.setAttribute('aria-pressed', 'true'); } } });
    run.addEventListener('keyup', runEnd); run.addEventListener('blur', runEnd);
    el.querySelector('[data-a=act]').onclick = () => U.emit('world:interact');
    setupJoystick(el.querySelector('.joy'));
    trackerMarkup = null;
    HUD.update();
    if (E.Net) HUD.online(E.Net.connected, E.Net.players.size + 1);
  };
  HUD.online = (on, n) => { if (!el) return; const b = el.querySelector('.online-btn'); b.classList.toggle('on', on); b.querySelector('.ob-n').textContent = on ? n : ''; HUD.coop(); };
  // faixa do cooperativo: de quem é o mundo e quem está nele (P1…P4)
  HUD.coop = () => {
    if (!el) return;
    const bar = el.querySelector('.coop-bar'), net = E.Net, CW = E.CoopWorld;
    const members = net && net.connected ? net.party.members : [];
    if (!CW || (!CW.guest && members.length <= 1)) { if (lastCoopMarkup !== '') { bar.innerHTML = ''; lastCoopMarkup = ''; } bar.classList.remove('on'); return; }
    bar.classList.add('on');
    const html = `<div class="cb-t">${CW.guest ? `🌍 Mundo de ${U.esc(CW.hostName())}` : '🏠 Seu mundo'} · Nível de Mundo ${E.Adv ? E.Adv.worldWL() : 0}</div>${members.map((m, i) => `<span class="cb-p ${m.id === net.me ? 'me' : ''}"><img src="${E.Coop.portrait({ id: m.id, look: m.hero && m.hero.look, cls: m.hero && m.hero.cls, species: m.hero && m.hero.species })}" alt=""><b>P${i + 1}</b>${U.esc(m.name)}</span>`).join('')}`;
    if (html !== lastCoopMarkup) { bar.innerHTML = html; lastCoopMarkup = html; }
  };
  U.on('coop:changed', () => HUD.coop());
  HUD.show = (v) => { hudVisible = !!v; if (el) el.classList.toggle('hidden', !v); if (v) lastMini = lastLabels = lastTracker = -Infinity; };

  // ---------- atualizações ----------
  HUD.update = () => {
    if (!el) return;
    const h = E.Store.hero();
    if (!h) return;
    const w = E.WG.world;
    writeText(refs.region, w ? w.reg.name : '');
    const ttl = E.Life && E.Life.title(h);
    writeHtml(refs.name, `${U.esc(h.name)}${ttl ? ` <small class="ttl">· ${U.esc(ttl)}</small>` : ''}`);
    const buffs = E.Life ? E.Life.activeBuffs(h) : [];
    writeHtml(refs.level, `${buffs.map((b) => `<span class="hb" title="${E.L.BUFFS[b.id].name}: ${b.left} min">${E.L.BUFFS[b.id].icon}</span>`).join('')} Nv. ${h.level}`);
    const max = C.maxHp(h);
    const pct = Math.max(0, h.hp) / max * 100;
    writeText(refs.hpNum, `${Math.max(0, h.hp)}${h.tempHp ? ` +${h.tempHp}` : ''} / ${max}`);
    writeStyle(refs.hp, 'width', pct + '%');
    writeStyle(refs.temp, 'width', Math.min(100, (h.tempHp || 0) / max * 100) + '%');
    refs.hpbar.classList.toggle('low', pct < 30);
    const next = C.xpForNext(h), prev = E.R.XP_TABLE[h.level];
    writeStyle(refs.xp, 'width', next ? ((h.xp - prev) / (next - prev) * 100) + '%' : '100%');
    HUD.tracker();
    HUD.syncSim(true);
  };
  // The small calendar/nutrition row updates four times a second, not every animation frame.
  HUD.syncSim = (force = false) => {
    if (!el || !E.Sim) return;
    const now = performance.now(); if (!force && now - lastLife < 250) return; lastLife = now;
    const h = E.Store.hero(); if (!h) return; const d = E.Sim.data(h), c = E.Sim.clock(), hr = E.WG.world && E.WG.world.hero;
    const hunger = U.clamp(Math.ceil(d.hunger || 0), 0, 100);
    writeText(refs.lifeTime, c.text || `Dia ${c.day} · ${String(Math.floor(c.hour)).padStart(2, '0')}:${String(c.minute || 0).padStart(2, '0')}`);
    writeText(refs.foodLabel, `${hunger}%`); writeStyle(refs.foodFill, 'width', hunger + '%');
    refs.food.classList.toggle('empty', hunger <= 0); refs.food.setAttribute('aria-label', `Saciedade ${hunger}%. Abrir comida`);
    const can = E.Sim.canSprint(h) && !(hr && (hr.boat || hr.exhaust || hr.st <= 0)); refs.sprint.disabled = !can; refs.sprint.classList.toggle('running', !!(hr && hr.sprinting));
    refs.sprint.setAttribute('aria-pressed', String(!!E.WG.input.sprint));
    const glide = hr && hr.jump > .15 && E.Sim.hasGlider(h); refs.jump.setAttribute('aria-label', glide ? 'Abrir planador' : 'Pular'); refs.jump.title = glide ? 'Abrir planador (um toque)' : 'Pular';
    refs.jump.disabled=!!(hr&&hr.boat);
  };
  U.on('survival:changed', () => HUD.syncSim(true));
  U.on('calendar:phase', () => HUD.syncSim(true));
  HUD.tracker = () => {
    if (!el) return;
    const tr = refs.tracker;
    const st = E.state.story, ch = E.Quests.chapter();
    const w = E.WG.world;
    let html = '';
    if (ch && !st.complete) {
      const here = w && ch.region === w.id;
      const reg = E.WD.REGIONS[ch.region];
      html = `<div class="t1">✧ ${ch.title}</div><div class="t2">${st.ready ? 'Objetivo concluído — abra as Missões e escolha o destino.' : here ? ch.mission : `Viaje para ${reg.name}`}</div>`;
      if (here && !st.ready && w.objective) html += `<div class="dist">${Math.round(Math.hypot(w.objective.x - w.hero.x, w.objective.z - w.hero.z))} m · siga o feixe de luz${ch.goal.type === 'collect' ? ' até a erva brilhante' : ''}</div>`;
    } else {
      const act = Object.entries(E.state.quests).find(([, s]) => s.state === 'active');
      if (act) {
        const q = E.Quests.find(act[0]);
        let near = '';
        if (q && q.type === 'collect' && w && w.reg.herb === q.target && w.herbs.length && !E.Quests.isComplete(q)) {
          const d = Math.min(...w.herbs.map((hb) => Math.hypot(hb.x - w.hero.x, hb.z - w.hero.z)));
          near = ` · erva mais próxima: ${Math.round(d)} m`;
        } else if (q && q.type === 'collect' && w && w.reg.herb !== q.target && !E.Quests.isComplete(q)) {
          const reg = Object.values(E.WD.REGIONS).find((r) => r.herb === q.target);
          if (reg) near = ` · cresce em ${reg.name}`;
        }
        if (q) html = `<div class="t1">📜 ${q.title}</div><div class="t2">${E.Quests.isComplete(q) ? 'Volte para entregar a missão.' : q.text}</div>${q.n ? `<div class="dist">${act[1].progress}/${q.n}${near}</div>` : ''}`;
      } else html = `<div class="t1">✦ Elarion</div><div class="t2">Explore, abra baús e enfrente criaturas.</div>`;
    }
    if (trackerMarkup !== html) { trackerMarkup = html; tr.innerHTML = html; }
  };

  // ---------- minimapa ----------
  HUD.frame = () => {
    const w = E.WG.world;
    if (!w || !el || !hudVisible || document.hidden || (UI.anyOpen && UI.anyOpen())) return;
    const now = performance.now();
    if (lastWorld !== w) {
      for (const entry of npcLabels.values()) entry.node.remove();
      npcLabels.clear(); onlineLabelsEl.replaceChildren(); onlineLabels.length = 0;
      lastWorld = w; lastMini = lastLabels = lastTracker = -Infinity;
    }
    // Map markers and labels do not need the world's 60 updates per second.
    if (now - lastMini >= 125) { lastMini = now; drawMini(w); }
    if (now - lastTracker >= 250) { lastTracker = now; HUD.tracker(); }
    HUD.syncSim();
    if (now - lastLabels >= 1000 / 15) { lastLabels = now; drawLabels(w); drawStamina(w); drawMark(w); calm(w, now); }
  };
  // Parado e sem tocar em nada, os botões e o rastreador recuam; qualquer ação os traz de volta.
  let lastInput = performance.now();
  for (const type of ['pointerdown', 'keydown', 'wheel']) addEventListener(type, () => { lastInput = performance.now(); }, { passive: true, capture: true });
  function calm(w, now) {
    const quiet = now - lastInput > 5000 && !(w.hero && w.hero.moving) && !near.length;
    if (el._calm !== quiet) { el.classList.toggle('calm', quiet); el._calm = quiet; }
  }
  // marcador sobre o que está ao alcance de F (ou do botão de mão)
  function drawMark(w) {
    const it = near[0], mk = refs.iaMark, at = it && Number.isFinite(it.x) && Number.isFinite(it.z);
    const p = at && w.project(it.x, (Number.isFinite(it.y) ? it.y : w.groundAt(it.x, it.z)) + (it.kind === 'npc' ? 3.1 : 1.9), it.z), show = !!(p && !p.behind);
    if (mk._shown !== show) { mk.classList.toggle('on', show); mk._shown = show; }
    if (!show) return;
    writeStyle(mk, 'transform', `translate(${p.x.toFixed(0)}px, ${p.y.toFixed(0)}px)`);
    writeText(mk.firstElementChild, U.isTouch() ? '' : 'F');
  }
  // vigor (estilo Genshin): um anel ao lado do herói que aparece quando está sendo gasto
  let stEl = null;
  function drawStamina(w) {
    const hr = w.hero; if (!hr || hr.st === undefined) return;
    if (!stEl || !el.contains(stEl)) { stEl = U.h('<div class="stam"><svg viewBox="0 0 36 36"><circle class="bg" cx="18" cy="18" r="15"/><circle class="fg" cx="18" cy="18" r="15"/></svg></div>'); el.appendChild(stEl); }
    const show = hr.st < E.WG.STAMINA - .5 || hr.sprinting;
    if (stEl._shown !== !!show) { stEl.classList.toggle('on', !!show); stEl._shown = !!show; }
    if (!show) return;
    const p = w.project(hr.x, hr.y + hr.jump + 1.5, hr.z);
    writeStyle(stEl, 'transform', `translate(${(p.x + 40).toFixed(0)}px, ${(p.y - 17).toFixed(0)}px)`);
    const f = hr.st / E.WG.STAMINA;
    if (!stEl._fg) stEl._fg = stEl.querySelector('.fg');
    writeStyle(stEl._fg, 'strokeDashoffset', (94.25 * (1 - f)).toFixed(1));
    stEl.classList.toggle('low', f < 0.25 || !!hr.exhaust);
  }
  // ícones do minimapa (traço em 24×24, desenhados em branco sobre um selo colorido)
  const MI = {};
  const mpath = (d) => (typeof Path2D !== 'undefined' ? new Path2D(d) : null);
  const ICON = {
    npc: 'M12 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 20c1-4 3.8-6 7-6s6 2 7 6',
    quest: 'M12 4v10M12 18.5v.5',
    chest: 'M4 11h16v8H4zM4 11a5 5 0 015-5h6a5 5 0 015 5M11 13h2v3h-2z',
    camp: 'M5 5l14 14M19 5L5 19M4 16l4 4M20 16l-4 4',
    skull: 'M12 4c-4 0-7 2.8-7 6.6 0 2 1 3.6 2.6 4.5V19h8.8v-3.9c1.6-.9 2.6-2.5 2.6-4.5C19 6.8 16 4 12 4zM9.5 11h.01M14.5 11h.01',
    leaf: 'M6 18c0-7 4.5-12 13-13-1 8.5-6 13-13 13zM6 18l7-7',
    fish: 'M3 12c3-4 8.5-5 12.5-2l5-3v10l-5-3C11.5 17 6 16 3 12z',
    gate: 'M12 3l6 9-6 9-6-9zM12 8v8',
    star: 'M12 3l2.6 5.8 6.4.7-4.8 4.3 1.4 6.2L12 16.9 6.4 20l1.4-6.2L3 9.5l6.4-.7z',
    eye: 'M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6zM12 14.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
    door: 'M7 20V6a2 2 0 012-2h6a2 2 0 012 2v14M4 20h16M14 12h.01',
    scales: 'M12 4v15M8 19.5h8M5 7h14M5 7l-2.5 5a2.5 2.5 0 005 0zM19 7l-2.5 5a2.5 2.5 0 005 0z',
    pick: 'M4 9c4.5-4.5 11.5-4.5 16 0M13.5 7L7 20',
    search: 'M10.5 16a5.5 5.5 0 100-11 5.5 5.5 0 000 11zM15 15l5 5',
  };
  const iconPaths = () => { if (!MI.ok) { for (const k in ICON) MI[k] = mpath(ICON[k]); MI.ok = true; } return MI; };
  function drawMini(w) {
    const S = mm.width, x = mmx, R = S / 2;
    // no celular o minimapa é pequeno: ícones maiores e um pouco mais de zoom
    const css = mm.clientWidth || 168, IK = U.clamp(168 / css, 1, 1.7);
    const ups = 3.1 * (IK > 1.3 ? 1.12 : 1); // px do minimapa por unidade do mundo
    const t = performance.now() / 1000;
    x.save();
    x.clearRect(0, 0, S, S);
    x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.clip();
    x.fillStyle = '#16202e'; x.fillRect(0, 0, S, S);
    x.translate(R, R);
    const img = w.minimap, ms = w.minimapScale || img.width / w.size, k = ups / ms;
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(img, (-w.hero.x - w.size / 2) * ups, (-w.hero.z - w.size / 2) * ups, img.width * k, img.height * k);
    // vinheta + leve tom de pergaminho
    if (!miniVignette) { miniVignette = x.createRadialGradient(0, 0, R * 0.55, 0, 0, R); miniVignette.addColorStop(0, 'rgba(255,240,210,0)'); miniVignette.addColorStop(1, 'rgba(20,14,6,.55)'); }
    const vg = miniVignette;
    x.fillStyle = vg; x.fillRect(-R, -R, S, S);
    const ip = iconPaths();
    const P = (px, pz) => [(px - w.hero.x) * ups, (pz - w.hero.z) * ups];
    const lim = R - 15 * IK;
    // selo: círculo colorido com ícone branco
    const badge = (px, pz, color, icon, r = 9, opts = {}) => {
      r *= IK;
      let [a, b] = P(px, pz);
      const d = Math.hypot(a, b);
      let edge = false;
      if (d > lim) { if (!opts.clamp) return; edge = true; a = a / d * lim; b = b / d * lim; }
      if (opts.pulse) { const q = (t * 0.9) % 1; x.strokeStyle = color; x.globalAlpha = 1 - q; x.lineWidth = 2; x.beginPath(); x.arc(a, b, r + 3 + q * 10, 0, 7); x.stroke(); x.globalAlpha = 1; }
      if (edge) { // seta na borda apontando para o alvo
        const ang = Math.atan2(b, a);
        x.save(); x.translate(a, b); x.rotate(ang); x.fillStyle = color; x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(r + 7, 0); x.lineTo(r - 1, -6); x.lineTo(r - 1, 6); x.closePath(); x.fill(); x.stroke(); x.restore();
      }
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(a + 1, b + 1.5, r, 0, 7); x.fill();
      x.fillStyle = color; x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.6;
      x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); x.stroke();
      if (ip[icon]) { x.save(); x.translate(a - r * 0.62, b - r * 0.62); x.scale(r * 1.24 / 24, r * 1.24 / 24); x.strokeStyle = '#fff'; x.lineWidth = 2.6; x.lineCap = 'round'; x.lineJoin = 'round'; x.stroke(ip[icon]); x.restore(); }
    };
    const pip = (px, pz, color, r = 3) => { r *= IK; const [a, b] = P(px, pz); if (Math.hypot(a, b) > lim) return; x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.arc(a, b, r + 1.4, 0, 7); x.fill(); x.fillStyle = color; x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); };
    // detalhes pequenos primeiro, ícones importantes por cima
    const wanted = w.wantedHerb && w.wantedHerb();
    for (const hb of w.herbs) wanted ? badge(hb.x, hb.z, '#2fae6a', 'leaf', 7) : pip(hb.x, hb.z, '#9fffd0', 2.4);
    const interactables = new Set(w.interactables);
    for (const o of w.oreNodes || []) if (o.ia && interactables.has(o.ia)) badge(o.x, o.z, '#6a7284', 'pick', 6.5);
    for (const s2 of w.fishSpots || []) badge(s2.x, s2.z, '#2f8ad0', 'fish', 7);
    for (const c of w.chests) badge(c.x, c.z, c.tier === 'luxuoso' ? '#e0a020' : c.tier === 'precioso' ? '#9a5ad0' : c.tier === 'requintado' ? '#4a7ad0' : '#a87a3a', 'chest', 7);
    for (const c of w.camps) if (!c.dead) badge(c.x, c.z, c.diff === 'alta' ? '#8a3ad0' : '#d0443a', c.diff === 'alta' ? 'skull' : 'camp', c.diff === 'alta' ? 8 : 7);
    if (w.tradePos) badge(w.tradePos.x, w.tradePos.z, '#b8862a', 'scales', 7);
    for (const d2 of w.metroDoors || []) badge(d2.x, d2.z, '#c8902a', 'door', 8);
    for (const n of w.npcs) badge(n.x, n.z, n.marker.visible ? '#e0a020' : '#5a6a88', n.marker.visible ? 'quest' : 'npc', n.marker.visible ? 8.5 : 7);
    if (w.landmark) badge(w.landmark.x, w.landmark.z, (E.state.world.landmarks || {})[w.id] ? '#6a7488' : '#c8902a', 'eye', 8, { clamp: true });
    if (w.lairBoss) badge(w.lairPos.x, w.lairPos.z, '#c81e3a', 'skull', 9.5, { clamp: true, pulse: true });
    for (const l of w.lumes || []) if (!l.taken) pip(l.x, l.z, l.high ? '#ffd36b' : '#fff6c8', 2.6);
    if (w.extra && w.extra.cave && w.reg.caveId) badge(w.extra.cave.x, w.extra.cave.z, '#7a5a3a', 'pick', 8.5, { clamp: true });
    if (w.extra && w.extra.altar) badge(w.extra.altar.x, w.extra.altar.z, '#d4a020', 'star', 7.5);
    if (w.extra && w.extra.domain) badge(w.extra.domain.x, w.extra.domain.z, '#8a4ad0', 'gate', 8, { clamp: true });
    // v4.5: correntes de vento, Lumes-Guia e Santuários das Tochas
    for (const u of w.updrafts || []) pip(u.x, u.z, '#9ff0e0', 2.8);
    for (const s2 of w.seelies || []) if (!s2.done) pip(s2.x, s2.z, '#7fe8ff', 3.2);
    for (const T of w.torchShrines || []) if (!T.solved) badge(T.x, T.z, '#e0782a', 'star', 7);
    // v4.4: estátuas espalhadas, monumentos, altar de invocação e eventos
    for (const s2 of w.statueObjs || []) badge(s2.x, s2.z, s2.on ? '#2aa8c8' : '#6a7484', 'gate', 7.5);
    for (const m of w.monumentObjs || []) badge(m.x, m.z, E.WON.isRead(w.id, m.i) ? '#6a7488' : '#d4a020', 'eye', 8, { clamp: !E.WON.isRead(w.id, m.i) });
    if (w.summonObj) badge(w.summonObj.x, w.summonObj.z, E.WON.cooldown(w.id) ? '#5a4a6a' : '#9a2ad0', 'skull', 8.5);
    if (w.event && !w.event.done) badge(w.event.x, w.event.z, w.event.def.color, 'star', 10, { clamp: true, pulse: true });
    if (w.race) { const r = w.race.rings[w.race.i]; if (r) badge(r.x, r.z, '#ffb84d', 'star', 9, { clamp: true, pulse: true }); }
    if (!w.cave) badge(w.waypoint.x, w.waypoint.z, '#2aa8c8', 'gate', 8.5, { clamp: true });
    else badge(w.waypoint.x, w.waypoint.z - 1.2, '#6a8aa8', 'door', 8.5, { clamp: true });
    if (w.questSpot) badge(w.questSpot.x, w.questSpot.z, '#2aa8c8', 'search', 9, { clamp: true, pulse: true });
    if (w.objective) badge(w.objective.x, w.objective.z, '#e8a820', 'star', 10, { clamp: true, pulse: true });
    // cone de visão + herói
    x.save();
    x.rotate(-w.cam.yaw + Math.PI);
    if (!miniViewCone) { miniViewCone = x.createRadialGradient(0, 0, 0, 0, 0, 70); miniViewCone.addColorStop(0, 'rgba(255,255,255,.42)'); miniViewCone.addColorStop(1, 'rgba(255,255,255,0)'); }
    const g = miniViewCone;
    x.fillStyle = g;
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 70, Math.PI / 2 - 0.55, Math.PI / 2 + 0.55); x.closePath(); x.fill();
    x.restore();
    const hd = Math.atan2(w.hero.vx || 0, w.hero.vz || 0);
    x.save();
    x.rotate(-w.cam.yaw + Math.PI);
    x.scale(IK, IK);
    x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.arc(0, 1.5, 10, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 9.5, 0, 7); x.fill();
    x.fillStyle = '#e8a820'; x.strokeStyle = '#5a3a08'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, 9); x.lineTo(6.5, -5.5); x.lineTo(0, -1.8); x.lineTo(-6.5, -5.5); x.closePath(); x.fill(); x.stroke();
    x.restore();
    void hd;
    x.restore();
    // aro interno
    x.strokeStyle = 'rgba(255,236,190,.55)'; x.lineWidth = 2; x.beginPath(); x.arc(R, R, R - 2, 0, 7); x.stroke();
  }
  function positionLabel(entry, x, y, opacity = 1) {
    // A transform moves only the composited label; left/top layout stays fixed.
    const transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-100%)`;
    if (entry.transform !== transform) { entry.node.style.transform = transform; entry.transform = transform; }
    const alpha = Math.max(0, Math.min(1, opacity)).toFixed(2);
    if (entry.opacity !== alpha) { entry.node.style.opacity = alpha; entry.opacity = alpha; }
  }
  function labelEntry(parent, cls) {
    const node = document.createElement('div'); node.className = cls;
    node.style.left = node.style.top = '0px'; parent.appendChild(node);
    return { node, content: null, transform: null, opacity: null };
  }
  function drawLabels(w) {
    const visible = new Set();
    for (const n of w.npcs) {
      const dx = n.x - w.hero.x, dz = n.z - w.hero.z, d2 = dx * dx + dz * dz;
      if (d2 > 196) continue;
      const p = w.project(n.x, n.y + (n.nh || 2.5) + 0.3 + (n.marker.visible ? 0.9 : 0), n.z);
      if (p.behind) continue;
      let entry = npcLabels.get(n);
      if (!entry) { entry = labelEntry(labelsEl, 'nlabel'); npcLabels.set(n, entry); }
      const content = `${U.esc(n.npc.name)}<small>${U.esc(n.npc.title)}</small>`;
      if (entry.content !== content) { entry.node.innerHTML = content; entry.content = content; }
      positionLabel(entry, p.x, p.y, (14 - Math.sqrt(d2)) / 4); visible.add(n);
    }
    for (const [n, entry] of npcLabels) if (!visible.has(n)) { entry.node.remove(); npcLabels.delete(n); }
    // Keep the network module's emotes, titles and party styling, while reusing
    // connected labels even when interpolation moves a remote player each frame.
    const html = E.Online ? E.Online.labels(w) : '';
    if (!html) {
      if (onlineLabels.length) { onlineLabelsEl.replaceChildren(); onlineLabels.length = 0; }
      return;
    }
    const template = document.createElement('template'); template.innerHTML = html;
    let i = 0;
    for (const item of template.content.children) {
      let entry = onlineLabels[i];
      if (!entry) { entry = labelEntry(onlineLabelsEl, item.className); onlineLabels.push(entry); }
      if (entry.node.className !== item.className) entry.node.className = item.className;
      const content = item.innerHTML;
      if (entry.content !== content) { entry.node.innerHTML = content; entry.content = content; }
      positionLabel(entry, parseFloat(item.style.left) || 0, parseFloat(item.style.top) || 0);
      i++;
    }
    while (onlineLabels.length > i) onlineLabels.pop().node.remove();
  }

  // ---------- avisos de interação ----------
  HUD.setNear = (list) => {
    near = list;
    if (!el) return;
    const shown = Math.min(4, list.length), touch = U.isTouch();
    for (let i = 0; i < shown; i++) {
      const it = list[i];
      let entry = promptButtons[i];
      if (!entry) {
        const node = U.h('<button class="prompt"><span class="key"></span><span></span></button>');
        entry = { node, key: node.firstElementChild, text: node.lastElementChild };
        node.onclick = () => E.Interact.run(entry.it);
        refs.prompts.appendChild(node); promptButtons.push(entry);
      }
      // Update the reference even when a replacement object has the same label.
      entry.it = it;
      writeHtml(entry.key, i === 0 && !touch ? 'F' : UI.iaIcon(it));
      writeText(entry.text, String(it.label || ''));
    }
    while (promptButtons.length > shown) promptButtons.pop().node.remove();
    writeHtml(refs.act, UI.iaIcon(list[0]));
    writeStyle(refs.act, 'opacity', list[0] ? '1' : '0.45');
  };
  HUD.first = () => near[0];

  // ---------- joystick ----------
  function setupJoystick(j) {
    const knob = j.querySelector('i');
    let id = null, cx = 0, cy = 0;
    const R = 50;
    j.addEventListener('pointerdown', (e) => { id = e.pointerId; const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; j.setPointerCapture(id); move(e); });
    const move = (e) => {
      if (e.pointerId !== id) return;
      let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      E.WG.input.joy = { x: dx / R, y: -dy / R, active: true };
    };
    j.addEventListener('pointermove', move);
    const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; E.WG.input.joy = { x: 0, y: 0, active: false }; };
    j.addEventListener('pointerup', end); j.addEventListener('pointercancel', end);
  }

  E.HUD = HUD;
})();
