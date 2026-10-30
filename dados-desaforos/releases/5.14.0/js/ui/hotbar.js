/* Barra rápida (estilo Minecraft): 9 espaços abaixo das barras de vida e fome. O espaço 1 é sempre a arma equipada
   (nenhuma arma é dada de graça: sem arma, ele fica vazio); os outros apontam para comidas prontas e poções que já
   estão na mochila — a barra não guarda itens, só atalhos, salvos por personagem em h.hotbar.
   Teclas 1–9 ou clique escolhem o espaço; apertar de novo (ou clicar no escolhido) usa o item.
   Botão direito, ou tocar e segurar, troca o item do espaço. */
(() => {
  'use strict';
  const U = E.U, UI = E.UI, C = E.C;
  const HB = { SIZE: 9 };
  let box = null, markup = '', weaponSvg = { key: '', html: '' };
  const esc = (s) => U.esc(String(s == null ? '' : s));
  const Sim = () => E.Sim;

  HB.data = (h) => {
    if (!h) return null;
    if (!h.hotbar || !Array.isArray(h.hotbar.slots)) {
      h.hotbar = { slots: Array(HB.SIZE).fill(null), sel: 0 };
      HB.autofill(h);
    }
    const d = h.hotbar;
    d.slots = d.slots.slice(0, HB.SIZE); while (d.slots.length < HB.SIZE) d.slots.push(null);
    d.slots[0] = 'weapon';
    if (!Number.isInteger(d.sel) || d.sel < 0 || d.sel >= HB.SIZE) d.sel = 0;
    return d;
  };
  // Primeira vez: coloca o que o personagem já tem (poções de cura e as refeições mais numerosas).
  HB.autofill = (h) => {
    const d = h.hotbar, refs = HB.options(h).filter((o) => o.n > 0).sort((a, b) => (b.kind === 'item') - (a.kind === 'item') || b.n - a.n).map((o) => o.ref);
    for (let i = 1; i < HB.SIZE && refs.length; i++) d.slots[i] = refs.shift();
  };
  // Tudo o que pode ir para a barra: comidas prontas (não cruas) e poções de cura que estão na mochila.
  HB.options = (h) => {
    const out = [];
    if (Sim()) for (const f of Sim().foodItems(h)) if (!f.raw && f.hunger > 0 && f.n > 0) out.push({ ref: 'food:' + f.id, kind: 'food', id: f.id, name: f.name, n: f.n, hint: `+${f.hunger} de saciedade` });
    for (const [id, n] of Object.entries(h.inventory || {})) { const it = E.R.ITEMS[id]; if (it && it.heal && n > 0) out.push({ ref: 'item:' + id, kind: 'item', id, name: it.name, n, hint: `Cura ${it.heal} PV` }); }
    return out;
  };
  const parse = (ref) => { if (!ref || ref === 'weapon') return { kind: ref || null }; const i = ref.indexOf(':'); return { kind: ref.slice(0, i), id: ref.slice(i + 1) }; };
  HB.count = (h, ref) => {
    const p = parse(ref);
    if (p.kind === 'food') { if (p.id.startsWith('fish:')) { const f = h.life && h.life.fish; return (f && f[p.id.slice(5)]) || 0; } return (Sim().data(h).food[p.id]) || 0; }
    if (p.kind === 'item') return (h.inventory && h.inventory[p.id]) || 0;
    return 0;
  };
  const foodDef = (id) => (E.SIM_DATA && E.SIM_DATA.FOODS[id]) || (Sim().foodItems(E.Store.hero()).find((f) => f.id === id)) || null;
  HB.label = (ref) => { const p = parse(ref); if (p.kind === 'weapon') return 'Arma'; if (p.kind === 'food') { const f = foodDef(p.id); return f ? f.name : p.id; } if (p.kind === 'item') return (E.R.ITEMS[p.id] || {}).name || p.id; return ''; };
  const icon = (ref, size = 64) => {
    const p = parse(ref);
    if (p.kind === 'food') return E.FoodArt && E.FoodArt.has(p.id) ? `<img src="${E.FoodArt.url(p.id, size)}" alt="">` : (E.Icons ? E.Icons.html('cooking', { decorative: true }) : '');
    if (p.kind === 'item') return E.Icons ? E.Icons.html('potion', { decorative: true }) : '🧪';
    return '';
  };
  const weaponIcon = (h) => {
    const wi = E.SP.heroWeaponInfo(h);
    if (!wi.def) return { html: '', name: 'Sem arma equipada' };
    if (weaponSvg.key !== wi.identity) { weaponSvg = { key: wi.identity, html: E.WA ? E.WA.svg(wi.def, { still: true }) : '' }; }
    return { html: weaponSvg.html, name: wi.def.name || 'Arma' };
  };

  HB.mount = (node) => { box = node; markup = ''; HB.render(); };
  HB.render = () => {
    if (!box || !box.isConnected) return;
    const h = E.Store.hero(); if (!h) return;
    const d = HB.data(h), safe = !!(E.Zones && E.Zones.safe), wpn = weaponIcon(h);
    const html = d.slots.map((ref, i) => {
      if (i === 0) return `<button class="hb-slot ${d.sel === 0 ? 'sel' : ''} ${safe ? 'off' : ''} ${wpn.html ? '' : 'empty'}" data-hb="0" title="${esc(wpn.name)}${safe ? ' · guardada (área protegida)' : ''}" aria-label="1: ${esc(wpn.name)}"><span class="hb-k">1</span>${wpn.html}</button>`;
      const n = ref ? HB.count(h, ref) : 0;
      return `<button class="hb-slot ${d.sel === i ? 'sel' : ''} ${!ref || !n ? 'empty' : ''}" data-hb="${i}" title="${ref ? esc(HB.label(ref)) + ' · ' + n : 'Vazio · clique para escolher'}" aria-label="${i + 1}: ${ref ? esc(HB.label(ref)) : 'vazio'}"><span class="hb-k">${i + 1}</span>${ref ? icon(ref) : ''}${ref ? `<span class="hb-n">${n}</span>` : ''}</button>`;
    }).join('') + (safe ? `<span class="safe-badge">${esc(E.Zones.name || 'Área protegida')} · área protegida</span>` : '');
    if (html === markup) return;
    markup = html; box.innerHTML = html;
    box.querySelectorAll('[data-hb]').forEach((b) => {
      const i = +b.dataset.hb;
      b.onclick = () => HB.press(i);
      b.oncontextmenu = (e) => { e.preventDefault(); if (i) HB.pick(i); };
      let hold = 0;
      b.onpointerdown = (e) => { if (e.pointerType !== 'mouse' && i) hold = setTimeout(() => { hold = -1; HB.pick(i); }, 520); };
      b.onpointerup = b.onpointerleave = () => { if (hold > 0) clearTimeout(hold); };
      b.addEventListener('click', (e) => { if (hold === -1) { e.stopImmediatePropagation(); hold = 0; } }, true);
    });
  };

  // Escolher e usar
  HB.press = (i) => {
    const h = E.Store.hero(); if (!h) return;
    const d = HB.data(h), ref = d.slots[i];
    if (i === 0) {
      if (E.Zones && E.Zones.safe) UI.toast('Área protegida: a arma fica guardada até você sair daqui.');
      else if (!E.SP.heroWeaponInfo(h).def) UI.toast('Você não tem arma equipada. Equipe uma no arsenal (I).');
      d.sel = 0; markup = ''; HB.render(); E.Store.save(); return;
    }
    if (!ref) { d.sel = i; markup = ''; HB.render(); return HB.pick(i); }
    if (d.sel !== i) { d.sel = i; markup = ''; HB.render(); E.Store.save(); if (E.Audio) E.Audio.sfx('click'); return; }
    HB.use(i);
  };
  HB.use = (i) => {
    const h = E.Store.hero(), d = HB.data(h), ref = d.slots[i], p = parse(ref);
    if (!ref || !p.kind) return;
    if (HB.count(h, ref) <= 0) return UI.toast(`Sem ${HB.label(ref)} na mochila.`);
    if (p.kind === 'food') {
      const r = Sim().eat(h, p.id);
      UI.toast(r.ok ? `${HB.label(ref)}: ${r.message}` : r.message, r.ok ? 'gold' : '');
      if (r.ok) { HB.eatFx(p.id); if (E.Audio) E.Audio.sfx('heal'); }
    } else if (p.kind === 'item') {
      const it = E.R.ITEMS[p.id];
      if (!it || !it.heal) return;
      if (h.hp >= C.maxHp(h)) return UI.toast('Seus PV já estão cheios.');
      h.inventory[p.id]--;
      const x = E.rollDice(it.heal);
      h.hp = Math.min(C.maxHp(h), h.hp + x.total);
      UI.toast(`✚ +${x.total} PV (${it.heal})`, 'gold');
      if (E.Audio) E.Audio.sfx('heal');
      HB.eatFx(null, it);
      E.Store.save();
    }
    if (E.HUD) { E.HUD.update(); if (E.HUD.syncSim) E.HUD.syncSim(true); }
    markup = ''; HB.render();
  };

  // Trocar o item de um espaço
  HB.pick = async (i) => {
    const h = E.Store.hero(); if (!h || !i) return;
    const d = HB.data(h), opts = HB.options(h);
    const html = `<p class="muted" style="margin:0 0 10px">Escolha um atalho para o espaço ${i + 1}. O item continua na mochila; a barra só aponta para ele.</p><div class="hb-picker">${opts.map((o) => `<button class="hb-pick" data-pick="${esc(o.ref)}">${icon(o.ref, 64)}<span><b>${esc(o.name)} ×${o.n}</b><small>${esc(o.hint)}</small></span></button>`).join('') || '<p class="muted">Nada para pôr na barra: compre ou cozinhe comida, ou compre poções.</p>'}</div>`;
    const wait = UI.modal({ title: `Barra rápida · espaço ${i + 1}`, html, buttons: [...(d.slots[i] ? [{ label: 'Esvaziar espaço', value: '__clear' }] : []), { label: 'Fechar', value: null, cls: 'primary' }] });
    const body = UI._modalBody, close = UI._modalClose;
    if (body) body.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => close(b.dataset.pick)));
    const v = await wait;
    if (v === '__clear') d.slots[i] = null;
    else if (typeof v === 'string' && opts.some((o) => o.ref === v)) { for (let k = 1; k < HB.SIZE; k++) if (d.slots[k] === v) d.slots[k] = null; d.slots[i] = v; d.sel = i; }
    else return;
    E.Store.save(); markup = ''; HB.render();
  };

  // ---------- animações: comer/beber e guardar/sacar a arma ----------
  const heroScreen = (lift = 1) => {
    const w = E.WG && E.WG.world, sp = w && w.heroSprite;
    if (!sp || !w.camera || !window.THREE) return { x: innerWidth / 2, y: innerHeight * .55 };
    const v = sp.position.clone(); v.y += (sp.userData.h || 2.4) * lift; v.project(w.camera);
    return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
  };
  const popup = (cls, inner, at, ms) => {
    const n = U.h(`<div class="${cls}">${inner}</div>`); n.style.left = at.x + 'px'; n.style.top = at.y + 'px';
    document.body.appendChild(n); setTimeout(() => n.remove(), ms); return n;
  };
  HB.eatFx = (foodId, item) => {
    const at = heroScreen(.95);
    popup('eat-fx', foodId ? icon('food:' + foodId, 96) : (E.Icons ? E.Icons.html('potion', { decorative: true }) : '🧪'), at, 1050);
    for (let k = 0; k < 6; k++) popup('eat-crumb', '', { x: at.x + (Math.random() - .5) * 30, y: at.y + 18 }, 800).style.setProperty('--dx', ((Math.random() - .5) * 40).toFixed(0) + 'px');
    const w = E.WG && E.WG.world; if (w && w.heroSprite) w.heroEatT = .6;
  };
  E.EatFX = { play: (id) => HB.eatFx(id) };
  HB.sheatheFx = (sheathe) => {
    const h = E.Store.hero(); if (!h) return;
    const wpn = weaponIcon(h); if (!wpn.html) return;
    popup('sheathe-fx ' + (sheathe ? 'in' : 'out'), wpn.html, heroScreen(.6), 760);
    if (E.Audio) E.Audio.sfx(sheathe ? 'click' : 'slash');
    const w = E.WG && E.WG.world; if (w) w.heroEatT = .6;
    const s = box && box.querySelector('[data-hb="0"]'); if (s) { s.classList.remove('flip'); void s.offsetWidth; s.classList.add('flip'); }
  };

  // ---------- teclado: 1–9 ----------
  addEventListener('keydown', (e) => {
    if (e.repeat || !/^Digit[1-9]$/.test(e.code) || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (!box || !E.WG || E.WG.mode() !== 'world' || E.WG.locked || (UI.anyOpen && UI.anyOpen()) || document.querySelector('.modal-bg, .ck') || (E.WorldServices && E.WorldServices.active)) return;
    e.preventDefault(); HB.press(+e.code.slice(5) - 1);
  });
  U.on('survival:changed', () => HB.render());
  U.on('zone:changed', () => { markup = ''; HB.render(); });
  U.on('party:switched', () => { markup = ''; HB.render(); });
  E.Hotbar = HB;
})();
