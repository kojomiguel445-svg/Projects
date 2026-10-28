/* Salão do empório com expediente jogável no caixa: clientes entram, escolhem nas gôndolas,
   fazem fila e pagam no balcão; o jogador registra, cobra, guarda o dinheiro e devolve o troco.
   As regras (itens, valores, troco e salário) ficam em E.Work; aqui ficam a cena e o painel do caixa. */
(() => {
  'use strict';
  const U = E.U, I = E.Interior, F = {};
  const K = () => E.Work, SS = () => E.Settlements;
  const COUNTER = { x: 2.4, z: -.45 }, REG = { x: 3.1, z: -.5 }, POST = { x: 3.0, z: -1.35 }, BAG = { x: 3.62, z: -.42 };
  const QUEUE = [{ x: 2.55, z: .5 }, { x: 2.9, z: 1.45 }, { x: 3.25, z: 2.4 }];
  const DOOR = { x: -.2, z: 4.7 }, INSIDE = { x: -.2, z: 3.0 };
  const SPOTS = [{ x: -2.35, z: -2.4 }, { x: -2.35, z: -.8 }, { x: -.3, z: -2.2 }, { x: -.3, z: -.5 }, { x: -4.2, z: -1.4 }, { x: -1.5, z: -3.45 }];
  const PEOPLE = [['Freguesa Lina', 'Abelheira', '#f0c9a4', '#6b4a2e', '#c48a5e'], ['Seu Tomé', 'Lenhador', '#c98f68', '#2f2a26', '#6f8a5a'], ['Dona Cida', 'Curandeira', '#e7b995', '#d9d4cc', '#8a6fa8'], ['Marujo Davi', 'Marujo', '#a8714f', '#1f1b18', '#3f6c8f'], ['Caçadora Ivi', 'Caçadora', '#f2d1b3', '#a4512c', '#5d6b3a'], ['Carteiro Rui', 'Carteiro', '#d9a47e', '#4a3526', '#a8483f']];
  const SAY = { hi: ['Bom dia! É só isso.', 'Boa tarde. Vou levar estes.', 'Olá! Pode registrar, por favor?'], pay: (v) => `Aqui está: ${v}.`, short: 'Hum... está faltando troco. Pode recontar?', over: 'Você me deu troco a mais. Tome de volta e confira.', hint: (v) => `Não seriam ${v} de troco?`, bye: ['Obrigado, até a próxima!', 'Valeu! Bom trabalho.', 'Obrigada, tenha um bom dia!'] };
  const sfx = (n) => { if (E.Audio && E.Audio.sfx) E.Audio.sfx(n); };

  // ------------------------------------------------------------ salão
  function gondola(c, kit, cat, x, z, len) {
    kit.box(c, c.room, x, .06, z, .9, .12, len + .1, '#5d4330'); kit.box(c, c.room, x, .85, z, .16, 1.6, len, '#7a5a3d');
    for (const [n, y] of [.35, .8, 1.25].entries()) {
      kit.box(c, c.room, x, y, z, .86, .05, len, '#a07c52');
      for (let k = 0; k < 7; k++) for (const side of [-1, 1]) { const it = cat[(k * 3 + n * 4 + (side > 0 ? 2 : 0)) % cat.length]; kit.box(c, c.room, x + side * .26, y + .14, z - len / 2 + .28 + k * (len - .56) / 6, .26, .22 + (k % 3) * .04, .3, it.color); }
    }
    c.colliders.push({ x, z, hw: .47, hd: len / 2 + .06 });
  }
  I.decorators.store = (c, kit) => {
    const cat = K().CATALOG[c.place] || K().CATALOG.general, wall = '#d8ccb0', accent = '#6f9391';
    kit.box(c, c.room, 0, -.15, 0, 10, .3, 9, '#9c7b55'); for (let z = -4.2; z < 4.5; z += .58) kit.box(c, c.room, 0, .008, z, 10, .018, .022, '#6c503b');
    kit.box(c, c.room, 0, 1.6, -4.5, 10, 3.2, .25, wall); kit.box(c, c.room, -5, 1.35, 0, .25, 2.7, 9, wall); kit.box(c, c.room, 5, .47, 0, .25, .94, 9, wall);
    for (const x of [-4.8, .3, 4.8]) kit.box(c, c.room, x, 1.6, -4.32, .18, 3.2, .17, '#73553e');
    kit.box(c, c.room, 0, 3.08, -4.26, 10, .19, .2, '#73553e'); kit.box(c, c.room, 0, .13, -4.32, 10, .24, .16, '#7d5d3b'); kit.box(c, c.room, -4.82, .13, 0, .16, .24, 9, '#7d5d3b');
    // Vitrine do fundo e duas gôndolas formam os corredores por onde os clientes passam.
    kit.box(c, c.room, -2.4, 1.0, -4.12, 4.2, 2.0, .42, '#674d38');
    for (const y of [.5, 1.05, 1.6]) { kit.box(c, c.room, -2.4, y, -3.95, 4.16, .06, .5, '#997548'); for (let k = 0; k < 12; k++) kit.box(c, c.room, -4.22 + k * .33, y + .17, -3.95, .22, .26 + (k % 2) * .06, .28, cat[(k + y * 10) % cat.length | 0].color); }
    c.colliders.push({ x: -2.4, z: -4.0, hw: 2.12, hd: .3 });
    gondola(c, kit, cat, -3.4, -1.3, 3.2); gondola(c, kit, cat, -1.3, -1.3, 3.2);
    kit.plaque(c, 'Empório', -2.4, 2.75, -4.21, 1.6);
    // Balcão com caixa registradora e área de embalagem.
    kit.box(c, c.room, COUNTER.x, .53, COUNTER.z, 2.9, 1.05, .8, '#77543a'); kit.box(c, c.room, COUNTER.x, 1.1, COUNTER.z, 3.05, .1, .92, '#b18b58'); kit.box(c, c.room, COUNTER.x, .6, COUNTER.z + .41, 2.7, .55, .03, accent);
    c.colliders.push({ x: COUNTER.x, z: COUNTER.z, hw: 1.5, hd: .46 });
    kit.box(c, c.room, REG.x, 1.3, REG.z, .62, .32, .46, '#3f4b5c'); kit.box(c, c.room, REG.x, 1.56, REG.z - .12, .42, .2, .05, '#9fd1b5', { emissive: '#4f9b78', emissiveIntensity: .6 }); kit.box(c, c.room, REG.x, 1.18, REG.z + .2, .5, .08, .06, '#2c3440');
    kit.box(c, c.room, BAG.x, 1.16, BAG.z, .55, .02, .55, '#cbb48a');
    // Área dos funcionários: piso próprio, grade com passagem e portinhola ao lado do balcão.
    kit.box(c, c.room, 2.75, .004, -2.55, 3.7, .006, 3.3, '#8a6c49');
    for (let z = -4.1; z <= -2.3; z += .45) kit.box(c, c.room, .85, .5, z, .07, 1.0, .07, '#674b35');
    kit.box(c, c.room, .85, .98, -3.2, .09, .07, 1.85, '#a27b4f'); c.colliders.push({ x: .85, z: -3.2, hw: .07, hd: .95 });
    kit.box(c, c.room, 4.25, .5, COUNTER.z, .7, 1.0, .1, '#77543a'); c.colliders.push({ x: 4.25, z: COUNTER.z, hw: .38, hd: .07 });
    kit.plaque(c, 'Somente funcionários', .85, 1.35, -2.25, 1.3);
    kit.box(c, c.room, 2.4, 1.25, -4.33, 1.1, 2.4, .1, '#6d4c34'); kit.plaque(c, 'Estoque', 2.4, 2.65, -4.25, 1.0);
    kit.box(c, c.room, 4.0, 1.55, -4.3, .5, .7, .12, '#4c4e54'); kit.box(c, c.room, 4.0, 1.62, -4.23, .34, .34, .02, '#efe3c6');
    kit.rug(c, 0, 3.45, 2.0, 1.45, accent);
    c.fixtures.push({ id: 'exit', x: 0, z: 3.75, r: 1.25, label: 'Sair para a vila', icon: 'door' });
    c.fixtures.push({ id: 'clock', x: 4.0, z: -3.65, r: .8, label: 'Bater o ponto', icon: 'calendar', run: () => clockIn(c) });
    c.fixtures.push({ id: 'post', x: POST.x, z: POST.z, r: .85, label: 'Assumir o caixa', icon: 'coin', run: () => takePost(c) });
    c.hero = { x: .6, z: 2.7, dir: 1, stride: 0 }; c.people = []; c.line = []; c.items = []; c.phase = 'enter'; c.spawned = 0;
    c.onUpdate = update; c.onClose = closed;
  };

  // ------------------------------------------------------------ ponto e posto
  function clockIn(c) {
    if (c.phase !== 'enter') return E.UI.toast('Seu ponto já foi registrado.');
    const r = K().shiftStart(E.Store.hero(), c.region); E.UI.toast(r.message, r.ok ? 'gold' : '');
    if (!r.ok) return;
    c.token = r.shift.token; c.phase = 'ready'; sfx('open');
    const f = c.fixtures.find(x => x.id === 'clock'); if (f) f.label = 'Ponto registrado'; c.hudAt = 0;
  }
  function takePost(c) {
    if (c.phase === 'enter') return E.UI.toast('Bata o ponto no relógio, no fundo da área dos funcionários.');
    if (c.phase !== 'ready') return;
    c.phase = 'work'; c.lockMove = true; Object.assign(c.hero, POST, { dir: 1 }); c.overlay.classList.add('interviewing');
    c.spawnAt = c.t + .8; openRegister(c);
  }

  // ------------------------------------------------------------ clientes
  function spawn(c) {
    const i = c.spawned++, [name, title, skin, hair, outfit] = PEOPLE[i % PEOPLE.length], npc = { name, title, cls: 'bardo', look: { skin, hair, outfit } };
    const frames = { idle: [E.SP.npc(npc, 'idle0'), E.SP.npc(npc, 'idle1')], walk: Array.from({ length: 12 }, (_, k) => E.SP.npc(npc, 'w' + k)) };
    const spots = SPOTS.slice().sort(() => U.rand() - .5).slice(0, 1 + (i % 2)).map(s => ({ ...s, pause: 1.1 + U.rand() * .8 }));
    const p = { i, name, x: DOOR.x, z: DOOR.z, dir: 1, stride: 0, frames, h: 2.0 + (i % 3) * .07, state: 'in', path: [INSIDE, ...spots], wait: 0 };
    p.sprite = I.kit.sprite(c, frames.idle[0], p.h); c.scene.add(p.sprite); p.shadow = I.kit.contact(c, c.scene, .34);
    c.people.push(p);
  }
  function walk(p, dt, speed = 1.9) {
    if (p.wait > 0) { p.wait -= dt; p.walking = false; return false; }
    const t = p.path[0]; if (!t) { p.walking = false; return true; }
    const dx = t.x - p.x, dz = t.z - p.z, d = Math.hypot(dx, dz), s = Math.min(d, speed * dt);
    if (d > 1e-4) { p.x += dx / d * s; p.z += dz / d * s; p.stride = (p.stride + s) % 3.3; const sx = dx * .82 - dz * .57; if (Math.abs(sx) > .02) p.dir = sx > 0 ? 1 : -1; }
    p.walking = true;
    if (d - s < .02) { p.path.shift(); if (t.pause) p.wait = t.pause; }
    return !p.path.length;
  }
  function pose(c, p) {
    const cv = p.walking ? p.frames.walk[Math.floor(p.stride / 3.3 * 12) % 12] : p.frames.idle[Math.floor(c.t * 1.5 + p.i) % 2];
    p.sprite.material.map = I.kit.texture(c, cv); p.sprite.scale.set(p.h * cv.width / cv.height * p.dir, p.h, 1);
    p.sprite.position.set(p.x, .085, p.z); p.shadow.position.set(p.x, .078, p.z);
    if (p.bag) p.bag.position.set(p.x + .3 * p.dir, .78, p.z + .08);
  }
  function people(c, dt) {
    for (const p of c.people.slice()) {
      if (p.state === 'in') { if (walk(p, dt)) { p.state = 'queue'; c.line.push(p); } }
      else if (p.state === 'queue' || p.state === 'counter') {
        const k = c.line.indexOf(p), spot = QUEUE[Math.min(k, QUEUE.length - 1)], far = Math.hypot(p.x - spot.x, p.z - spot.z) > .03;
        if (far) { p.path = [spot]; walk(p, dt); } else { p.walking = false; p.dir = 1; }
        if (k === 0 && p.state === 'queue' && !far) { const cust = K().arrive(c.token, p.i); if (cust) { p.state = 'counter'; p.cust = cust; arrive(c, p); } }
      } else if (p.state === 'out' && walk(p, dt)) {
        for (const o of [p.sprite, p.shadow, p.bag]) if (o) c.scene.remove(o);
        if (p.bubble) p.bubble.el.remove();
        c.people.splice(c.people.indexOf(p), 1);
        continue;
      }
      pose(c, p);
    }
  }
  function arrive(c, p) {
    c.items = []; let n = 0;
    p.cust.lines.forEach((l, li) => { for (let u = 0; u < l.qty; u++) { const m = new THREE.Mesh(new THREE.BoxGeometry(.22, .18 + (li % 2) * .06, .2), new THREE.MeshStandardMaterial({ color: l.color, roughness: .8 })); m.position.set(1.15 + n * .26, 1.25, COUNTER.z + .14); c.scene.add(m); c.items.push({ li, mesh: m, to: null }); n++; } });
    say(c, p, U.pick(SAY.hi)); render(c);
  }
  function leave(c, p) {
    for (const it of c.items) c.scene.remove(it.mesh); c.items = [];
    p.bag = new THREE.Mesh(new THREE.BoxGeometry(.3, .34, .2), new THREE.MeshStandardMaterial({ color: '#cbb48a', roughness: .9 })); c.scene.add(p.bag);
    say(c, p, U.pick(SAY.bye)); p.state = 'out'; p.path = [{ x: 1.4, z: 1.7 }, INSIDE, DOOR]; c.line.splice(c.line.indexOf(p), 1);
  }
  function say(c, p, text) {
    if (p.bubble) p.bubble.el.remove();
    const el = U.h('<div class="cx-bubble"></div>'); el.textContent = text; c.overlay.appendChild(el);
    p.bubble = { el, until: c.t + 3.4 };
  }
  function bubbles(c) {
    const v = new THREE.Vector3();
    for (const p of c.people) if (p.bubble) {
      if (c.t > p.bubble.until) { p.bubble.el.remove(); p.bubble = null; continue; }
      v.set(p.x, p.h + .25, p.z).project(c.camera);
      p.bubble.el.style.left = `${(v.x + 1) / 2 * innerWidth}px`; p.bubble.el.style.top = `${(1 - v.y) / 2 * innerHeight}px`;
    }
  }
  function update(dt, c) {
    const s = K().shift();
    if (c.phase === 'work' && s && c.spawned < s.customers.length && c.t >= c.spawnAt && c.people.filter(p => p.state !== 'out').length < 3) { spawn(c); c.spawnAt = c.t + 4 + U.rand() * 3; }
    people(c, dt);
    for (const it of c.items) if (it.to) { const m = it.mesh.position, k = Math.min(1, dt * 8); m.x += (it.to.x - m.x) * k; m.z += (it.to.z - m.z) * k; m.y += (it.to.y - m.y) * k; }
    bubbles(c);
    if (E.Workplace && E.Workplace.slide) E.Workplace.slide(c, dt);
  }
  function closed(c) {
    if (K().shift()) { K().shiftAbort(); E.UI.toast('Você saiu antes de fechar o caixa: o turno de hoje não foi pago.'); }
  }

  // ------------------------------------------------------------ painel do caixa
  const money = (v) => K().money(v);
  const coinRow = (coins, attr) => K().COINS.filter(x => coins[x.id] > 0).map(x => `<button class="cx-coin ${x.id}" data-${attr}="${x.id}"><span>${x.label}</span><small>×${coins[x.id]}</small></button>`).join('');
  function openRegister(c) {
    c.panel = U.h(`<section class="cx-panel" aria-label="Caixa registradora"><header><span class="cx-led" data-led>0 pp</span><div><strong>Caixa registradora</strong><small data-count></small></div></header><div class="cx-items" data-items></div><ol class="cx-receipt" data-receipt></ol><div class="cx-pay" data-pay></div><div class="cx-drawer" data-drawerbox></div><p class="cx-status" data-status></p><div class="cx-actions"><button class="btn sm dark" data-act="bill">Fechar a conta</button><button class="btn sm dark" data-act="receive">Guardar o pagamento na gaveta</button><button class="btn sm primary" data-act="give">Entregar o troco</button><button class="btn sm primary" data-act="finish">Fechar o caixa</button></div></section>`);
    c.overlay.appendChild(c.panel);
    c.panel.onclick = (e) => {
      const b = e.target.closest('button'); if (!b || b.disabled || c.phase !== 'work') return;
      if (b.dataset.scan != null) scan(c, +b.dataset.scan);
      else if (b.dataset.coin) { K().tray(c.token, b.dataset.coin, 1); sfx('click'); render(c); }
      else if (b.dataset.back) { K().tray(c.token, b.dataset.back, -1); render(c); }
      else if (b.dataset.act) act(c, b.dataset.act);
    };
    render(c);
  }
  const counterPerson = (c) => c.people.find(p => p.state === 'counter');
  function scan(c, li) {
    const r = K().scan(c.token, li); if (!r) return;
    const it = c.items.find(x => x.li === li && !x.to), n = c.items.filter(x => x.to).length;
    if (it) it.to = { x: BAG.x - .15 + (n % 3) * .15, z: BAG.z - .1 + Math.floor(n / 3) * .18, y: 1.27 };
    sfx('click'); render(c);
  }
  function act(c, what) {
    const p = counterPerson(c);
    if (what === 'bill') { const r = K().bill(c.token); if (r && p) say(c, p, SAY.pay(money(r.paid))); }
    else if (what === 'receive') { if (K().receive(c.token)) sfx('open'); }
    else if (what === 'give') {
      const r = K().giveChange(c.token); if (!r) return;
      if (!r.ok) { sfx('fail'); if (p) say(c, p, r.hint ? SAY.hint(r.hint) : r.short ? SAY.short : SAY.over); c.note = (r.short ? 'O troco ficou menor do que o devido.' : 'O troco ficou maior do que o devido.') + ' O cliente devolveu as moedas para você recontar.'; }
      else { sfx('success'); c.note = ''; if (p) leave(c, p); }
    } else if (what === 'finish') return finish(c);
    render(c);
  }
  function render(c) {
    const el = c.panel; if (!el) return;
    const s = K().shift(), cust = s && s.at >= 0 ? s.customers[s.at] : null, active = cust && cust.state !== 'done' ? cust : null, q = (k) => el.querySelector(k);
    const st = active ? active.state : 'idle', registered = active ? active.lines.reduce((t, l) => t + l.price * l.scanned, 0) : 0;
    q('[data-count]').textContent = s ? `Cliente ${Math.min(s.customers.length, s.served + (active ? 1 : 0))} de ${s.customers.length} · Gaveta ${money(K().coinSum(s.drawer))}` : '';
    q('[data-led]').textContent = active ? (st === 'scan' ? money(registered) : `TOTAL ${money(active.total)}`) : '—';
    q('[data-items]').innerHTML = active ? active.lines.map((l, li) => `<button class="cx-item ${l.scanned === l.qty ? 'done' : ''}" data-scan="${li}" ${st !== 'scan' || l.scanned === l.qty ? 'disabled' : ''}><i style="--c:${l.color}"></i><span>${l.scanned ? U.esc(l.name) : 'Produto a registrar'}</span><b>${l.scanned ? money(l.price) : '?'}</b><small>${l.scanned}/${l.qty}</small></button>`).join('') : '<p class="cx-wait">Aguardando cliente no balcão…</p>';
    q('[data-receipt]').innerHTML = active ? active.lines.filter(l => l.scanned).map(l => `<li><span>${l.scanned}× ${U.esc(l.name)}</span><b>${money(l.price * l.scanned)}</b></li>`).join('') : '';
    q('[data-pay]').innerHTML = active && st !== 'scan' ? `<span>Total <b>${money(active.total)}</b></span><span>Recebido <b>${money(active.paid)}</b></span><div class="cx-coins">${coinRow(active.pay, 'paid')}</div>` : '';
    q('[data-drawerbox]').innerHTML = active && st === 'change' ? `<small>Gaveta: toque para separar moedas</small><div class="cx-coins">${coinRow(s.drawer, 'coin')}</div><small>Troco montado: <b>${money(K().coinSum(s.tray))}</b> · toque para devolver à gaveta</small><div class="cx-coins tray">${coinRow(s.tray, 'back') || '<em>nenhuma moeda</em>'}</div>` : '';
    const done = s && !active && s.served === s.customers.length;
    q('[data-status]').textContent = c.note || (done ? 'Todos os clientes foram atendidos. Confira e feche o caixa.' : !active ? 'Aguardando o próximo cliente.' : st === 'scan' ? (registered === active.total ? 'Tudo registrado. Feche a conta.' : 'Toque em cada produto do balcão para registrar.') : st === 'pay' ? 'O cliente entregou o pagamento. Guarde-o na gaveta.' : 'Calcule o troco (recebido menos total), separe as moedas e entregue.');
    for (const b of el.querySelectorAll('[data-act]')) {
      const a = b.dataset.act, show = a === 'bill' ? st === 'scan' : a === 'receive' ? st === 'pay' : a === 'give' ? st === 'change' : done;
      b.hidden = !show; b.disabled = a === 'bill' && registered !== (active && active.total);
    }
    for (const b of el.querySelectorAll('[data-paid]')) b.disabled = true;
    if (c.note && st !== 'change') c.note = '';
  }
  function finish(c) {
    const r = K().shiftFinish(E.Store.hero(), c.token); E.UI.toast(r.message, r.ok ? 'gold' : '');
    sfx(r.ok ? 'success' : 'fail'); c.phase = 'done';
    c.panel.innerHTML = `<header><span class="cx-led">${r.ok ? r.pay + ' po' : '—'}</span><div><strong>Turno encerrado</strong><small>${U.esc(r.message)}</small></div></header>${r.ok ? `<p class="cx-status">Erros de troco: ${r.errors}. Seu emprego continua registrado na carteira; volte amanhã para outro turno.</p>` : ''}<div class="cx-actions"><button class="btn sm primary" data-leave>Sair do caixa</button></div>`;
    c.panel.querySelector('[data-leave]').onclick = () => { c.panel.remove(); c.panel = null; c.lockMove = false; c.overlay.classList.remove('interviewing'); c.hudAt = 0; };
  }

  // ------------------------------------------------------------ entrada pelo estabelecimento
  F.enter = (it) => {
    const h = E.Store.hero(), cur = K().current(h);
    if (!cur || K().activity(cur.id) !== 'cashier' || cur.region !== SS().region(it.region) || cur.def.place !== it.service) return E.UI.toast('Você não trabalha no caixa deste estabelecimento.');
    if (E.WorldServices) E.WorldServices.close(); E.UI.closeAll();
    I.open({ kind: 'store', region: it.region, title: SS().placeName(it.service) + ' · salão', place: it.service });
    E.UI.toast(cur.data.lastShiftDay === E.Sim.clock().day ? 'O turno de hoje já foi pago. Volte amanhã para trabalhar.' : 'Vá até a área dos funcionários, atrás do balcão, e bata o ponto.', 'gold');
  };
  E.Shopfloor = F;
})();
