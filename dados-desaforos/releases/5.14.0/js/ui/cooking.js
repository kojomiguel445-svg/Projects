/* Cozinhar: cardápio com imagens dos pratos e uma pequena atividade em cena — no fogão você controla a chama e
   mexe na hora certa; na fogueira você vira o espeto e tira do fogo no ponto (ou queima). Quem decide o resultado
   é E.Sim (cookTick/cookFinish); esta tela só desenha e envia as ações. */
(() => {
  'use strict';
  const U = E.U, S = () => E.Sim, D = () => E.SIM_DATA;
  const esc = (s) => U.esc(String(s == null ? '' : s));
  const art = (id, size) => E.FoodArt ? E.FoodArt.url(id, size) : '';
  const sfx = (k) => { if (E.Audio && E.Audio.sfx) E.Audio.sfx(k); };
  const CK = {};
  let el = null, raf = 0, station = 'fogao', wasLocked = false, last = 0, scene = null, parts = [];

  const close = () => {
    cancelAnimationFrame(raf); raf = 0; S().cookAbort();
    if (el) { el.remove(); el = null; }
    if (E.WG) E.WG.locked = E.WG.mode && E.WG.mode() === 'interior' ? true : wasLocked;
  };
  CK.close = close;
  CK.open = (opts = {}) => {
    const h = E.Store.hero(); if (!h) return;
    if (E.WorldServices) E.WorldServices.close();
    station = opts.station === 'fogueira' ? 'fogueira' : 'fogao';
    if (el) close();
    wasLocked = !!(E.WG && E.WG.locked);
    el = U.h('<section class="ck" role="dialog" aria-label="Cozinhar"><div class="ck-card"></div></section>');
    document.getElementById('ui').appendChild(el);
    if (E.WG) E.WG.locked = true;
    menu();
  };
  const head = (title, sub) => `<header class="ck-head"><span class="ck-ico">${E.Icons.html(station === 'fogueira' ? 'flame' : 'cooking', { decorative: true })}</span><div><small>${esc(sub)}</small><b>${esc(title)}</b></div><span class="ck-sat">Saciedade ${Math.round(S().data(E.Store.hero()).hunger)}/100</span><button class="ck-x" data-x aria-label="Fechar">✕</button></header>`;

  // ------------------------------------------------------------ cardápio
  function menu() {
    const h = E.Store.hero(), card = el.querySelector('.ck-card');
    const list = S().recipes(h).sort((a, b) => (b.stations.includes(station) - a.stations.includes(station)) || (b.ok - a.ok));
    card.innerHTML = head(station === 'fogueira' ? 'Fogueira' : 'Fogão', station === 'fogueira' ? 'COZINHA AO AR LIVRE · assados e tostados' : 'COZINHA · receitas mais elaboradas') +
      `<p class="ck-tip">${station === 'fogueira' ? 'Na fogueira, vire o espeto quando um lado dourar e tire do fogo no ponto. Se descuidar, queima.' : 'No fogão, mantenha a chama na faixa verde e mexa quando a colher aparecer. O fogão tem mais receitas.'}</p>
      <div class="ck-grid">${list.map((r) => { const here = r.stations.includes(station); return `<article class="ck-rec ${r.ok && here ? 'ok' : ''} ${here ? '' : 'other'}"><img src="${art(r.result)}" alt=""><div class="ck-rinfo"><b>${esc(r.dish.name)}</b><small>⏱ ${r.time * (station === 'fogao' ? 1.4 : 1) | 0} s · +${r.dish.hunger} de saciedade · ${r.stations.map((s0) => s0 === 'fogao' ? 'Fogão' : 'Fogueira').join(' ou ')}</small>
        <ul>${r.need.map((n) => `<li class="${n.have >= n.n ? 'have' : ''}"><img src="${art(n.key === 'peixe' ? 'peixe_cru' : n.key === 'carne' ? 'carne_caca' : n.key, 64)}" alt="">${esc(n.name)} <b>${Math.min(n.have, n.n)}/${n.n}</b></li>`).join('')}</ul></div>
        <button class="btn sm ${r.ok && here ? 'primary' : 'dark'}" data-cook="${r.id}" ${r.ok && here ? '' : 'disabled'}>${here ? (r.ok ? 'Cozinhar' : 'Faltam ingredientes') : 'Só no fogão'}</button></article>`; }).join('')}</div>`;
    card.querySelector('[data-x]').onclick = close;
    card.querySelectorAll('[data-cook]').forEach((b) => (b.onclick = () => start(b.dataset.cook)));
  }

  // ------------------------------------------------------------ preparo em cena
  function start(id) {
    const h = E.Store.hero(), r = S().cookBegin(h, id, station);
    if (!r.ok) { E.UI.toast(r.message); return; }
    const c = r.session, card = el.querySelector('.ck-card'), fire = station === 'fogueira';
    const ings = Object.keys(c.recipe.need).map((k) => k === 'peixe' ? 'peixe_cru' : k === 'carne' ? 'carne_caca' : k);
    card.innerHTML = head(D().FOODS[c.recipe.result].name, fire ? 'NA FOGUEIRA' : 'NO FOGÃO') +
      `<div class="ck-ings">${ings.map((k, i) => `<img src="${art(k, 96)}" alt="" style="animation-delay:${i * .15}s">`).join('')}</div>
      <div class="ck-stage"><canvas width="760" height="300"></canvas><div class="ck-prompt" hidden>Mexa agora!</div></div>
      <div class="ck-meters">${fire ? '<div class="ck-side"><small>Lado A</small><i><em class="band"></em><b data-s="0"></b></i></div><div class="ck-side"><small>Lado B</small><i><em class="band"></em><b data-s="1"></b></i></div>' : '<div class="ck-temp"><small>Temperatura</small><i><em class="band"></em><b data-temp></b></i></div><div class="ck-prog"><small>Preparo</small><i><b data-prog></b></i></div>'}</div>
      <div class="ck-actions">${fire ? '<button class="btn" data-a="flip"><span class="ico">↻</span>Virar o espeto <kbd>Espaço</kbd></button><button class="btn primary" data-a="take"><span class="ico">✓</span>Tirar do fogo <kbd>Enter</kbd></button>' : '<button class="btn dark" data-a="down"><span class="ico">−</span>Baixar o fogo</button><button class="btn primary" data-a="stir"><span class="ico">🥄</span>Mexer <kbd>Espaço</kbd></button><button class="btn dark" data-a="up"><span class="ico">+</span>Aumentar o fogo</button>'}</div><div class="ck-note" aria-live="polite"></div>`;
    card.querySelector('[data-x]').onclick = () => { S().cookAbort(); close(); };
    card.querySelectorAll('[data-a]').forEach((b) => (b.onclick = () => act(b.dataset.a)));
    scene = { cv: card.querySelector('canvas'), fire, hero: heroSprite(h), item: new Image(), dish: ings[0] };
    scene.item.src = art(ings[0], 128);
    parts = []; last = performance.now();
    sfx(fire ? 'spell' : 'click');
    loop();
  }
  const heroSprite = (h) => { try { return E.SP.hero(h, 'sit0', null); } catch (e) { return null; } };
  const note = (t, good) => { const n = el && el.querySelector('.ck-note'); if (n) { n.textContent = t || ''; n.className = 'ck-note ' + (good ? 'good' : good === false ? 'bad' : ''); } };
  function act(a) {
    const r = S().cookInput(a); if (!r.ok) return;
    if (a === 'stir') { note(r.message, r.good); sfx(r.good ? 'chest' : 'click'); }
    else if (a === 'flip') { sfx('slash'); note('Espeto virado.', null); }
    else sfx('click');
  }
  addEventListener('keydown', (e) => {
    if (!el || !scene || e.repeat) return;
    if (e.code === 'Escape') { e.preventDefault(); S().cookAbort(); close(); return; }
    if (e.code === 'Space') { e.preventDefault(); act(scene.fire ? 'flip' : 'stir'); }
    else if (e.code === 'Enter' && scene.fire) { e.preventDefault(); act('take'); }
    else if (!scene.fire && (e.code === 'ArrowUp' || e.code === 'KeyW')) { e.preventDefault(); act('up'); }
    else if (!scene.fire && (e.code === 'ArrowDown' || e.code === 'KeyS')) { e.preventDefault(); act('down'); }
  }, true);

  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now) => {
      if (!el || !scene) return;
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      const c = S().cookTick(dt) || S().cookSession();
      if (!c) return;
      draw(c, dt);
      const q = (sel) => el.querySelector(sel);
      if (scene.fire) { for (const i of [0, 1]) { const b = q(`[data-s="${i}"]`); if (b) { b.style.width = Math.min(100, c.sides[i] / 1.08 * 100) + '%'; b.parentNode.parentNode.classList.toggle('cur', c.side === i); b.className = c.sides[i] > .86 ? 'over' : c.sides[i] >= .62 ? 'gold' : ''; } } }
      else { const t = q('[data-temp]'), p = q('[data-prog]'), pr = q('.ck-prompt'); if (t) { t.style.width = c.temp * 100 + '%'; t.className = c.temp > .9 ? 'over' : c.temp >= c.band[0] && c.temp <= c.band[1] ? 'gold' : ''; } if (p) p.style.width = Math.min(100, c.cookTime / c.need * 100) + '%'; if (pr) pr.hidden = !(c.t < c.stirUntil); if (c.msgN && c.msgN !== scene.msgN) { scene.msgN = c.msgN; note(c.msg, c.bias === 0 ? true : null); } }
      if (c.done) { scene = null; setTimeout(result, 350); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  // Cena: fogão (panela, chama do botão, vapor) ou fogueira (lenha, labaredas, fumaça e o espeto dourando).
  function draw(c, dt) {
    const cv = scene.cv, x = cv.getContext('2d'), W = cv.width, H = cv.height, t = c.t;
    x.clearRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, scene.fire ? '#1e2a44' : '#3a2e28'); g.addColorStop(1, scene.fire ? '#2a2018' : '#241c18'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    if (scene.hero) { const hh = 170, hw = hh * scene.hero.width / scene.hero.height; x.imageSmoothingEnabled = false; x.drawImage(scene.hero, 40, H - hh - 14, hw, hh); x.imageSmoothingEnabled = true; }
    const cx = W * .58, base = H - 40;
    const flame = scene.fire ? c.flame : .35 + c.heat * .22;
    if (Math.random() < dt * (scene.fire ? 18 : 6 + c.heat * 4)) parts.push({ x: cx + (Math.random() - .5) * (scene.fire ? 90 : 60), y: scene.fire ? base - 40 : base - 140, vy: -(30 + Math.random() * 40), life: 1, smoke: true });
    if (scene.fire) {
      // lenha e labaredas
      x.fillStyle = '#5a3a1e'; for (const r of [-.35, .35]) { x.save(); x.translate(cx, base); x.rotate(r); x.fillRect(-80, -10, 160, 20); x.restore(); }
      for (let i = 0; i < 9; i++) { const k = i / 8, fx = cx - 70 + k * 140, fh = (60 + Math.sin(t * 9 + i * 1.7) * 18) * flame * (1 - Math.abs(k - .5)); const fg = x.createLinearGradient(0, base - fh, 0, base); fg.addColorStop(0, 'rgba(255,240,140,.0)'); fg.addColorStop(.4, 'rgba(255,170,40,.85)'); fg.addColorStop(1, 'rgba(220,60,20,.95)'); x.fillStyle = fg; x.beginPath(); x.moveTo(fx - 16, base); x.quadraticCurveTo(fx - 10, base - fh * .6, fx, base - fh); x.quadraticCurveTo(fx + 10, base - fh * .6, fx + 16, base); x.fill(); }
      // espeto com o alimento que muda de cor conforme o lado que está no fogo
      const sy = base - 110; x.strokeStyle = '#7a5a3a'; x.lineWidth = 6; x.beginPath(); x.moveTo(cx - 170, sy); x.lineTo(cx + 170, sy); x.stroke();
      x.fillStyle = '#5a3a1e'; x.fillRect(cx - 178, sy - 4, 10, 120); x.fillRect(cx + 168, sy - 4, 10, 120);
      const d = c.sides[c.side], avg = (c.sides[0] + c.sides[1]) / 2;
      x.save(); x.translate(cx, sy); x.rotate(Math.sin(t * 2) * .04 + (c.side ? Math.PI : 0) * .02);
      x.filter = avg > .95 ? 'brightness(.35) sepia(.6)' : avg > .62 ? `sepia(${.25 + avg * .35}) saturate(1.35) brightness(${1 - (avg - .62) * .6})` : `sepia(${avg * .3})`;
      if (scene.item.complete) x.drawImage(scene.item, -70, -70, 140, 140);
      x.restore(); x.filter = 'none';
      if (d > .86) { x.fillStyle = 'rgba(40,30,30,.5)'; x.beginPath(); x.arc(cx, sy - 60, 30 + Math.sin(t * 6) * 4, 0, Math.PI * 2); x.fill(); }
    } else {
      // fogão de ferro com a panela; o brilho e a altura da chama seguem o botão
      x.fillStyle = '#2c2a2a'; x.beginPath(); x.roundRect(cx - 190, base - 30, 380, 50, 10); x.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, fx = cx + Math.cos(a) * 46, fh = (10 + c.heat * 7 + Math.sin(t * 12 + i) * 3); x.fillStyle = c.temp > .9 ? 'rgba(255,90,40,.9)' : 'rgba(90,150,255,.85)'; x.beginPath(); x.ellipse(fx, base - 34, 5, fh / 2, 0, 0, Math.PI * 2); x.fill(); }
      x.fillStyle = '#6a6a72'; x.beginPath(); x.moveTo(cx - 100, base - 40); x.lineTo(cx + 100, base - 40); x.lineTo(cx + 88, base - 140); x.lineTo(cx - 88, base - 140); x.closePath(); x.fill();
      x.fillStyle = '#8a8a94'; x.beginPath(); x.ellipse(cx, base - 140, 92, 16, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = c.temp > .9 ? '#3a2a1a' : '#a8642a'; x.beginPath(); x.ellipse(cx, base - 140, 80, 11, 0, 0, Math.PI * 2); x.fill();
      if (scene.item.complete) { x.globalAlpha = .9; x.drawImage(scene.item, cx - 34, base - 176, 68, 68); x.globalAlpha = 1; }
      if (c.t < c.stirUntil) { x.save(); x.translate(cx + 40, base - 170); x.rotate(Math.sin(t * 10) * .4); x.fillStyle = '#c89a5a'; x.fillRect(-4, -60, 8, 70); x.beginPath(); x.ellipse(0, 12, 10, 14, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
    }
    // vapor/fumaça
    for (const p of parts) { p.y += p.vy * dt; p.x += Math.sin(p.y * .05) * 10 * dt; p.life -= dt * .7; x.fillStyle = scene.fire ? `rgba(120,120,130,${Math.max(0, p.life * .35)})` : `rgba(255,255,255,${Math.max(0, p.life * .4)})`; x.beginPath(); x.arc(p.x, p.y, 10 + (1 - p.life) * 22, 0, Math.PI * 2); x.fill(); }
    parts = parts.filter((p) => p.life > 0).slice(-60);
  }

  // ------------------------------------------------------------ resultado
  function result() {
    if (!el) return;
    const h = E.Store.hero(), r = S().cookFinish(h), card = el.querySelector('.ck-card');
    if (!r.ok) { E.UI.toast(r.message); return menu(); }
    sfx(r.q >= 3 ? 'levelup' : r.q ? 'chest' : 'fail');
    const stars = r.q ? '★'.repeat(r.q) + '☆'.repeat(4 - r.q) : '';
    card.innerHTML = head('Prato pronto', 'RESULTADO') + `<div class="ck-result q${r.q}"><img src="${art(r.id, 240)}" alt=""><div><small>${esc(r.label)}${stars ? ` <span class="ck-stars" aria-label="${r.q} de 4">${stars}</span>` : ''}</small><h3>${esc(r.food.name)}</h3><p>+${r.food.hunger} de saciedade ao comer. ${r.q === 0 ? 'Passou do ponto: da próxima vez, tire do fogo antes.' : r.q === 4 ? 'Execução perfeita!' : r.q === 3 ? 'Muito bem feito.' : r.q === 1 ? 'Ficou abaixo do ponto ideal.' : 'No ponto certo.'}</p><p class="ck-small">O prato foi para a sua mochila. Coloque-o na barra rápida para comer durante a exploração.</p></div></div>
      <div class="ck-actions"><button class="btn primary" data-eat><span class="ico">${E.Icons.html('cooking', { decorative: true })}</span>Comer agora</button><button class="btn dark" data-again><span class="ico">↺</span>Cozinhar outra receita</button></div>`;
    card.querySelector('[data-x]').onclick = close;
    card.querySelector('[data-eat]').onclick = () => { const e = S().eat(h, r.id); E.UI.toast(e.message, e.ok ? 'gold' : ''); if (e.ok && E.EatFX) E.EatFX.play(r.id); menu(); };
    card.querySelector('[data-again]').onclick = menu;
  }
  E.Cooking = CK;
})();
