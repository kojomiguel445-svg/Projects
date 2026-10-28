/* Locais de trabalho com cena própria: a sala dos fundos onde o responsável entrevista o candidato.
   Usa o interior compartilhado (E.Interior) pelos ganchos decorators/onUpdate/lockMove. */
(() => {
  'use strict';
  const U = E.U, I = E.Interior, P = {};
  const SS = () => E.Settlements, W = () => E.WorldServices;
  // Eixos da câmera isométrica: "a" aponta para a direita da tela, "b" para o observador.
  const A = { x: .82, z: -.57 }, B = { x: .57, z: .82 }, YAW = Math.atan2(-A.z, A.x);
  const at = (o, da, db = 0) => ({ x: o.x + A.x * da + B.x * db, z: o.z + A.z * da + B.z * db });
  const TABLE = { x: 0, z: -1.0 }, BOSS = at(TABLE, -1.55), SELF = at(TABLE, 1.55), SEAT = .64;
  const FLOORS = { costa: '#b38a5e', montanhas: '#8a786b', astrolabio: '#81718e', abismo: '#76657f', vazios: '#a27e58', jardins: '#9a7e5d' };
  const ACCENT = { costa: '#699caa', montanhas: '#8195a9', astrolabio: '#a08cbb', abismo: '#9485b0', vazios: '#aa6e78', jardins: '#8eaa85' };
  const icon = (k) => E.Icons ? E.Icons.html(k, { decorative: true }) : '';

  function chair(c, kit, x, z, facing) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = facing; c.room.add(g);
    kit.box(c, g, 0, .57, 0, .72, .14, .72, '#83603e'); kit.box(c, g, 0, 1.02, -.3, .72, .86, .13, '#a27b4f');
    for (const px of [-.25, .25]) for (const pz of [-.25, .25]) kit.box(c, g, px, .25, pz, .1, .54, .1, '#674b35');
    c.colliders.push({ x, z, r: .36 });
  }
  I.decorators.office = (c, kit) => {
    const floor = FLOORS[c.region] || '#997651', accent = ACCENT[c.region] || '#6f9391', wall = '#d8ccb0';
    kit.box(c, c.room, 0, -.15, 0, 10, .3, 9, floor); for (let z = -4.2; z < 4.5; z += .58) kit.box(c, c.room, 0, .008, z, 10, .018, .022, '#6c503b');
    kit.box(c, c.room, 0, 1.6, -4.5, 10, 3.2, .25, wall); kit.box(c, c.room, -5, 1.35, 0, .25, 2.7, 9, wall); kit.box(c, c.room, 5, .47, 0, .25, .94, 9, wall);
    for (const x of [-4.8, -1.15, 4.8]) kit.box(c, c.room, x, 1.6, -4.32, .18, 3.2, .17, '#73553e');
    kit.box(c, c.room, 0, 3.08, -4.26, 10, .19, .2, '#73553e'); kit.box(c, c.room, 0, .13, -4.32, 10, .24, .16, '#7d5d3b'); kit.box(c, c.room, -4.82, .13, 0, .16, .24, 9, '#7d5d3b');
    // Estante de registros e caixas de estoque: a sala é o escritório do estabelecimento.
    kit.box(c, c.room, -3.3, 1.1, -4.12, 1.9, 2.1, .4, '#674d38');
    for (const y of [.42, 1.0, 1.58]) { kit.box(c, c.room, -3.3, y, -3.95, 1.86, .08, .5, '#997548'); for (let k = 0; k < 6; k++) kit.box(c, c.room, -3.95 + k * .26, y + .22, -3.95, .16, .34 + (k % 2) * .06, .3, ['#7c9c99', '#b08476', '#b5a076'][k % 3]); }
    c.colliders.push({ x: -3.3, z: -4.0, hw: .98, hd: .3 });
    for (const [x, z, s] of [[3.7, -3.6, .8], [4.0, -2.75, .6], [3.65, -2.85, .5]]) { kit.box(c, c.room, x, s / 2 + .02, z, s, s, s, '#9a7a4f'); kit.box(c, c.room, x, s + .03, z, s * .9, .03, s * .9, '#c1a06a'); }
    c.colliders.push({ x: 3.8, z: -3.2, hw: .55, hd: .7 });
    kit.box(c, c.room, 1.4, 2.05, -4.3, 1.5, 1.1, .05, '#7c6245'); kit.box(c, c.room, 1.4, 2.05, -4.26, 1.3, .9, .04, '#efe3c6');
    for (let k = 0; k < 4; k++) kit.box(c, c.room, 1.4, 2.32 - k * .18, -4.23, .95 - (k % 2) * .25, .045, .02, '#8a7a62');
    kit.plaque(c, 'Somente funcionários', 1.4, 2.86, -4.21, 1.6);
    kit.rug(c, TABLE.x, TABLE.z + .1, 4.6, 2.6, accent);
    kit.rug(c, 0, 3.45, 2.0, 1.45, accent);
    c.fixtures.push({ id: 'exit', x: 0, z: 3.75, r: 1.25, label: 'Voltar ao salão', icon: 'door' });
    // Mesa alinhada ao eixo da tela: entrevistador e candidato ficam frente a frente.
    const t = new THREE.Group(); t.position.set(TABLE.x, 0, TABLE.z); t.rotation.y = YAW; c.room.add(t);
    kit.box(c, t, 0, 1.0, 0, 2.1, .14, 1.1, '#a77c4b'); for (const x of [-.9, .9]) for (const z of [-.42, .42]) kit.box(c, t, x, .48, z, .12, .93, .12, '#674b35');
    kit.box(c, t, -.35, 1.1, .05, .62, .05, .46, '#efe3c6'); kit.box(c, t, -.35, 1.13, .05, .5, .02, .36, '#d8c9a5');
    kit.cylinder(c, t, .45, 1.13, -.2, .07, .14, '#3f4b5c'); kit.box(c, t, .5, 1.09, .2, .3, .04, .2, '#6d4c34');
    for (const d of [-.6, 0, .6]) { const p = at(TABLE, d); c.colliders.push({ x: p.x, z: p.z, r: .58 }); }
    chair(c, kit, BOSS.x, BOSS.z, Math.atan2(A.x, A.z));
    chair(c, kit, SELF.x, SELF.z, Math.atan2(-A.x, -A.z));
    kit.addFurniture(c, { id: 'lamp', uid: 'office-lamp', x: 4.0, z: -1.2, r: 0 });
    stage(c, kit);
  };

  // ------------------------------------------------------------ atores e caminhada
  function actorFrames(c, make) {
    return { idle: [make('idle0'), make('idle1')], walk: Array.from({ length: 12 }, (_, i) => make('w' + i)), sit: [make('sit0'), make('sit1')] };
  }
  function stage(c, kit) {
    const owner = c.owner || 'Responsável';
    const npc = { name: owner, title: SS().placeName(c.place), cls: 'bardo', look: { skin: '#e3b892', hair: '#5c422a', outfit: '#779995' } };
    const boss = c.boss = { x: -.55, z: 3.55, dir: 1, stride: 0, frames: actorFrames(c, f => E.SP.npc(npc, f)), path: [at(BOSS, 0, .78), BOSS], seated: false, h: 2.15 };
    boss.sprite = kit.sprite(c, boss.frames.idle[0], boss.h); c.scene.add(boss.sprite); boss.shadow = kit.contact(c, c.scene, .36);
    c.lockMove = true; c.hero = { x: .55, z: 3.95, dir: 1, stride: 0 }; c.phase = 'walk'; c.walkT = 0;
    c.self = { path: [{ x: 1.95, z: .55 }, at(SELF, 0, .8), SELF], delay: .55, seated: false };
    c.onUpdate = update; c.onClose = closed;
  }
  function step(o, path, dt, speed = 2.1) {
    const p = path[0]; if (!p) return true;
    const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), s = Math.min(d, speed * dt);
    if (d > 1e-4) { o.x += dx / d * s; o.z += dz / d * s; o.stride = (o.stride + s) % 3.3; const sx = dx * A.x + dz * A.z; if (Math.abs(sx) > .02) o.dir = sx > 0 ? 1 : -1; }
    if (d - s < .02) path.shift();
    return !path.length;
  }
  function pose(c, sprite, shadow, o, height, seated, frames) {
    const cv = seated ? frames.sit[Math.floor(c.t * (o.talk > 0 ? 4 : 1.4)) % 2] : o.walking ? frames.walk[Math.floor(o.stride / 3.3 * 12) % 12] : frames.idle[Math.floor(c.t * 1.6) % 2];
    sprite.material.map = I.kit.texture(c, cv);
    sprite.scale.set(height * cv.width / cv.height * o.dir, height, 1);
    // Sentado, o quadril do desenho apoia no assento; o sprite fica à frente do encosto.
    sprite.position.set(o.x, seated ? SEAT - height * .2 : .085, o.z);
    sprite.material.depthTest = !seated; sprite.renderOrder = seated ? 4 : 0;
    if (shadow) { shadow.visible = !seated; shadow.position.set(o.x, .078, o.z); }
  }
  function update(dt, c) {
    const h = c.hero, boss = c.boss, frames = c.heroFrames || (c.heroFrames = (() => { const hh = E.Store.hero(), F = f => E.SP.hero(hh, f, E.SP.heroWeaponType(hh)); return { idle: c.frames.idle, walk: c.frames.walk, sit: [F('sit0'), F('sit1')] }; })());
    if (c.phase === 'walk') {
      if (!c.walkT) c.overlay.classList.add('interviewing');
      c.walkT += dt;
      boss.walking = !boss.seated && !step(boss, boss.path, dt, 1.9);
      if (!boss.path.length && !boss.seated) { boss.seated = true; boss.dir = 1; boss.walking = false; }
      if (c.walkT > c.self.delay && !c.self.seated) {
        h.walking = !step(h, c.self.path, dt, 2.2);
        if (!c.self.path.length) { c.self.seated = true; h.walking = false; h.dir = -1; }
      }
      if (boss.seated && c.self.seated) { c.phase = 'talk'; openPanel(c); }
    }
    boss.talk = Math.max(0, (boss.talk || 0) - dt);
    frame(c, dt);
    pose(c, boss.sprite, boss.shadow, boss, boss.h, boss.seated, boss.frames);
    const hh = E.WG.heroHeight(E.Store.hero()) || 2.3, seated = c.self.seated && c.phase !== 'free';
    if (c.phase !== 'free') { pose(c, c.sprite, c.heroShadow, h, hh, seated, frames); }
    else if (!c.sprite.material.depthTest) { c.sprite.material.depthTest = true; c.sprite.renderOrder = 0; }
  }
  // Com o painel aberto, a câmera desliza para a sala ficar na parte livre da tela.
  function frame(c, dt) {
    const cam = c.camera, aspect = innerWidth / innerHeight, halfW = Math.max(6.8, 8.2 / aspect) * aspect;
    const panel = c.panel && c.phase !== 'free' ? c.panel.getBoundingClientRect() : null;
    const covered = panel && panel.width < innerWidth * .7 ? (innerWidth - panel.left) / innerWidth : 0;
    c.shift = (c.shift || 0) + (covered * halfW - (c.shift || 0)) * Math.min(1, dt * 4);
    if (Math.abs(cam.left + halfW - c.shift) > 1e-3) { cam.left = -halfW + c.shift; cam.right = halfW + c.shift; cam.updateProjectionMatrix(); }
  }
  function closed(c) {
    if (E.Work.session() && c.phase !== 'free') { E.Work.cancel(); E.UI.toast('A entrevista foi interrompida. Você poderá tentar outra vaga amanhã.'); }
  }

  // ------------------------------------------------------------ painel da conversa
  function say(c, who, text, cls = '') {
    const log = c.panel.querySelector('.iv-log'), el = U.h(`<div class="iv-line ${who} ${cls}"><b>${U.esc(who === 'boss' ? c.owner : 'Você')}</b><p></p></div>`);
    el.querySelector('p').textContent = text; log.appendChild(el);
    while (log.children.length > 7) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
    if (who === 'boss') c.boss.talk = Math.min(2.6, .6 + text.length * .025);
  }
  function openPanel(c) {
    const def = SS().JOBS[c.jobId];
    c.overlay.classList.add('interviewing');
    c.panel = U.h(`<section class="iv-panel" aria-label="Entrevista de emprego"><header><span class="iv-avatar" aria-hidden="true">${icon('chat')}</span><div><strong>${U.esc(c.owner)}</strong><small>Entrevista · ${U.esc(def.name)}</small></div><span class="iv-step"></span></header><div class="iv-log" aria-live="polite"></div><form class="iv-form"><textarea maxlength="${E.Work.MAX_CHARS}" rows="2" placeholder="Responda com suas palavras…" aria-label="Sua resposta"></textarea><div class="iv-row"><small class="iv-count">0/${E.Work.MAX_CHARS}</small><button class="btn primary sm" type="submit">Responder</button></div></form><p class="iv-method">${U.esc(E.Work.method)}</p></section>`);
    c.overlay.appendChild(c.panel);
    const form = c.panel.querySelector('form'), ta = form.querySelector('textarea'), count = form.querySelector('.iv-count');
    ta.addEventListener('input', () => { count.textContent = `${ta.value.length}/${E.Work.MAX_CHARS}`; });
    ta.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
    form.onsubmit = (e) => { e.preventDefault(); submit(c, ta); };
    const s = E.Work.session();
    say(c, 'boss', `Pode sentar. Sou ${c.owner} e cuido deste lugar. Vou fazer algumas perguntas, responda do seu jeito.`);
    setTimeout(() => { if (I.current === c) ask(c, s.question); }, 900);
  }
  function ask(c, q) {
    c.panel.querySelector('.iv-step').textContent = `${Math.min(5, E.Work.session() ? E.Work.session().step : 5)}/5`;
    say(c, 'boss', q.text);
    const ta = c.panel.querySelector('textarea'); ta.disabled = false; c.panel.querySelector('button[type=submit]').disabled = false; ta.focus({ preventScroll: true });
  }
  function submit(c, ta) {
    const s = E.Work.session(), text = ta.value.trim(); if (!s || ta.disabled) return;
    const r = E.Work.answer(s.token, text); if (!r.ok) return E.UI.toast(r.message);
    say(c, 'self', text); ta.value = ''; ta.disabled = true; c.panel.querySelector('button[type=submit]').disabled = true; c.panel.querySelector('.iv-count').textContent = `0/${E.Work.MAX_CHARS}`;
    const thinking = U.h('<div class="iv-line boss iv-thinking"><b></b><p>…</p></div>'); c.panel.querySelector('.iv-log').appendChild(thinking);
    setTimeout(() => {
      if (I.current !== c) return; thinking.remove(); say(c, 'boss', r.reaction);
      if (r.done) setTimeout(() => { if (I.current === c) verdict(c, s.token); }, 1100);
      else setTimeout(() => { if (I.current === c) ask(c, r.question); }, 900);
    }, 650);
  }
  function verdict(c, token) {
    const r = E.Work.finish(E.Store.hero(), token);
    if (r.score == null) return E.UI.toast(r.message);
    c.phase = 'result'; c.boss.talk = 2.4;
    const bars = r.criteria.map(k => `<div class="iv-bar"><span>${U.esc(k.name)}</span><i style="--v:${k.value}%"></i><b>${k.value}</b></div>`).join('');
    const box = U.h(`<div class="iv-result ${r.ok ? 'ok' : 'no'}"><strong>${r.ok ? 'Contratado' : 'Não contratado'}</strong><p class="iv-verdict"></p><div class="iv-actions"><button class="btn primary sm" data-up>Levantar</button>${r.ok ? '<button class="btn dark sm" data-card>Ver carteira</button>' : ''}</div><small>Pontuação ${r.score} · mínimo ${r.pass}${r.flags.length ? ' · alerta: ' + U.esc(r.flags.join(', ')) : ''}</small>${bars}</div>`);
    box.querySelector('.iv-verdict').textContent = r.message;
    c.panel.querySelector('.iv-form').replaceWith(box);
    const log = c.panel.querySelector('.iv-log'); log.scrollTop = log.scrollHeight; c.panel.scrollTop = box.offsetTop - 60;
    box.querySelector('[data-up]').onclick = () => standUp(c);
    const card = box.querySelector('[data-card]'); if (card) card.onclick = () => E.Work.openCard();
    if (E.Audio && E.Audio.sfx) E.Audio.sfx(r.ok ? 'success' : 'fail');
    E.Store.save();
  }
  function standUp(c) {
    c.phase = 'free'; c.lockMove = false; c.overlay.classList.remove('interviewing'); if (c.panel) c.panel.remove(); c.panel = null;
    Object.assign(c.hero, at(SELF, 0, .85)); c.hero.dir = -1; c.hudAt = 0;
    E.UI.toast('Use a porta do salão para voltar à loja.', 'gold');
  }

  // ------------------------------------------------------------ convite no estabelecimento
  P.invite = (it, id) => {
    const h = E.Store.hero(), def = SS().JOBS[id], w = W(); if (!h || !def || !w) return;
    const owner = I.kit.merchantNames[it.service] || 'O responsável', pay = SS().jobPay(id, it.region);
    const gate = E.Work.canApply(h, it.region, id);
    if (!gate.ok) return w.open({ title: owner, icon: 'chat', text: `— ${gate.message}`, actions: [{ label: 'Ver minha carteira', run: () => E.Work.openCard() }] });
    if (SS().jobData(h, it.region).interviewDay === E.Sim.clock().day) return w.open({ title: owner, icon: 'chat', text: '— Já conversamos hoje. Volte amanhã e tentamos de novo.', actions: [] });
    w.open({ title: `${owner} · ${SS().placeName(it.service)}`, icon: 'chat', text: `— Procurando trabalho? Preciso de alguém para a vaga de ${def.name.toLowerCase()}: ${pay} po por turno. A entrevista é na sala dos fundos, com calma. Vem comigo?`, actions: [{ label: `Acompanhar ${owner} até a sala dos fundos`, run: () => P.start(it, id) }, { label: 'Agora não', primary: false, run: () => w.close() }] });
  };
  P.start = (it, id) => {
    const h = E.Store.hero(), r = E.Work.begin(h, it.region, id, it.service);
    if (!r.ok) return E.UI.toast(r.message);
    W().close(); E.UI.closeAll();
    I.open({ kind: 'office', region: it.region, title: 'Sala dos fundos · ' + SS().placeName(it.service), place: it.service, jobId: id, owner: r.session.owner });
  };
  P.slide = frame;
  E.Workplace = P;
})();
