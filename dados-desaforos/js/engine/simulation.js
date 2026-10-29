/* Relógio, comida e equipamento de viagem. Nenhuma chamada de rede ou avanço offline. */
(() => {
  'use strict';
  const U = E.U, D = E.SIM_DATA;
  if (!D) throw new Error('Carregue data/simulation.js antes de engine/simulation.js.');
  const S = { FOODS: D.FOODS, DAY_SECONDS: D.DAY_SECONDS, GLIDER_PRICE: D.GLIDER_PRICE };
  // Active-play seconds: a full stomach lasts about five minutes of walking.
  // Body effects apply to travel/survival only, never to official character attributes.
  S.BALANCE = {
    hungerPerSecond: { idle: .28, walking: .34, running: .46, battle: .38 },
    fat: { hunger: 1.30, run: .85, jump: .84, glideDescent: 1.22 },
    swim: { normalSpeed: 3.1, fastSpeed: 5.2, staminaPerSecond: 14 },
  };
  const hero = () => E.Store && E.Store.hero ? E.Store.hero() : null;
  const save = () => { if (E.Store && E.Store.save) E.Store.save(); };
  const emit = (name, data) => { if (U && U.emit) U.emit(name, data); };
  const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const validCount = (n) => Number.isSafeInteger(n) && n > 0 && n <= 999999;
  const result = (ok, message, extra) => Object.assign({ ok, message }, extra || {});
  const changed = (h, persist = true) => { if (persist) save(); emit('survival:changed', { hero: h, hunger: S.data(h).hunger, clock: S.clock() }); };
  let statusTime = 0;
  let lastFrameToken;
  const seenBattles = new WeakSet();

  S.bodyModifiers = (h = hero()) => h && h.look && h.look.build === 'gordo'
    ? Object.assign({}, S.BALANCE.fat) : { hunger: 1, run: 1, jump: 1, glideDescent: 1 };

  S.data = (h = hero()) => {
    if (!h) return null;
    const d = h.survival && typeof h.survival === 'object' && !Array.isArray(h.survival) ? h.survival : (h.survival = {});
    d.hunger = U.clamp(finite(d.hunger, D.HUNGER_MAX), 0, D.HUNGER_MAX);
    d.gliderOwned = d.gliderOwned === true;
    d.gliderEquipped = d.gliderOwned && d.gliderEquipped === true;
    if (!d.food || typeof d.food !== 'object' || Array.isArray(d.food)) d.food = { pao: 2, fruta: 2 };
    for (const [key, n] of Object.entries(d.food)) {
      if (!D.FOODS[key] || !Number.isSafeInteger(n) || n <= 0) delete d.food[key];
      else if (n > 999999) d.food[key] = 999999;
    }
    return d;
  };
  const calendar = () => {
    const state = E.state || (E.state = {});
    if (!state.calendar || typeof state.calendar !== 'object' || Array.isArray(state.calendar)) state.calendar = { elapsed: 0 };
    state.calendar.elapsed = Math.max(0, finite(state.calendar.elapsed));
    return state.calendar;
  };
  S.clock = () => {
    const elapsed = calendar().elapsed, absolute = elapsed + D.START_HOUR / 24 * D.DAY_SECONDS;
    const day = Math.floor(absolute / D.DAY_SECONDS) + 1;
    const within = ((absolute % D.DAY_SECONDS) + D.DAY_SECONDS) % D.DAY_SECONDS;
    const decimalHour = within / D.DAY_SECONDS * 24;
    const hour = Math.floor(decimalHour), minute = Math.min(59, Math.floor((decimalHour - hour) * 60 + 1e-7));
    const month = Math.floor((day - 1) / D.DAYS_IN_MONTH) % D.SEASONS.length;
    const season = D.SEASONS[month], dayOfMonth = (day - 1) % D.DAYS_IN_MONTH + 1;
    const weekday = D.WEEKDAYS[(day - 1) % D.WEEKDAYS.length];
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    return { elapsed, day, hour, minute, decimalHour, night: hour >= 19 || hour < 6, season, weekday, month: month + 1, dayOfMonth,
      year: Math.floor((day - 1) / (D.DAYS_IN_MONTH * D.SEASONS.length)) + 1, time, text: `${weekday}, ${dayOfMonth} de ${season} · ${time}` };
  };
  S.advance = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > D.DAY_SECONDS * 366) return result(false, 'Intervalo de calendário inválido.');
    const c = calendar();
    if (!seconds) return result(true, '', { clock: S.clock() });
    const offset = D.START_HOUR / 24 * D.DAY_SECONDS;
    let current = c.elapsed + offset;
    const end = current + seconds;
    while (current < end) {
      const dayBase = Math.floor(current / D.DAY_SECONDS) * D.DAY_SECONDS;
      let boundary = dayBase + D.DAY_SECONDS, type = 'day';
      for (const [hour, candidateType] of [[6, 'phase'], [19, 'phase']]) {
        const candidate = dayBase + hour / 24 * D.DAY_SECONDS;
        if (candidate > current + 1e-8 && candidate < boundary) { boundary = candidate; type = candidateType; }
      }
      if (boundary > end + 1e-8) break;
      current = boundary;
      c.elapsed = Math.max(0, current - offset);
      const clock = S.clock();
      if (type === 'day') emit('calendar:day', { day: clock.day, clock });
      else emit('calendar:phase', { night: clock.night, clock });
    }
    c.elapsed = Math.max(0, end - offset);
    return result(true, '', { clock: S.clock() });
  };
  S.tick = (dt, ctx = {}) => {
    if (!Number.isFinite(dt) || dt <= 0 || !['world', 'arena', 'interior'].includes(ctx.mode) || (typeof document !== 'undefined' && document.hidden)) return false;
    const h = hero();
    if (!h || h.dead) return false;
    // The render loop supplies one token for the shared clock/food update, even across scene changes.
    if (Number.isFinite(ctx.frameToken)) {
      if (ctx.frameToken === lastFrameToken) return false;
      lastFrameToken = ctx.frameToken;
    }
    // A resumed/background tab cannot silently charge days or food for missed frames.
    dt = Math.min(dt, 1);
    S.advance(dt);
    const rates = S.BALANCE.hungerPerSecond;
    const rate = ctx.mode === 'arena' ? rates.battle : ctx.sprinting && ctx.moving ? rates.running : ctx.moving ? rates.walking : rates.idle;
    const d = S.data(h), before = d.hunger;
    d.hunger = Math.max(0, d.hunger - rate * S.bodyModifiers(h).hunger * dt);
    statusTime += dt;
    if (statusTime >= .5 || before > 0 && d.hunger === 0) { statusTime = 0; changed(h, false); }
    return true;
  };
  S.canSprint = (h = hero()) => !!h && S.data(h).hunger > 0;
  S.penalty = (h = hero()) => h && S.data(h).hunger <= 0 ? 2 : 0;
  S.hasGlider = (h = hero()) => !!h && S.data(h).gliderOwned && S.data(h).gliderEquipped;
  S.buyGlider = (h = hero(), price = D.GLIDER_PRICE) => {
    if (!h) return result(false, 'Crie um personagem primeiro.');
    const d = S.data(h);
    if (d.gliderOwned) return result(false, 'Você já tem um planador. Equipe-o no equipamento de viagem.');
    if (!Number.isSafeInteger(price) || price < 1 || price > 1000000) return result(false, 'Preço inválido.');
    if (!Number.isFinite(h.gold) || h.gold < price) return result(false, 'Ouro insuficiente para comprar o planador.');
    h.gold -= price; d.gliderOwned = true; d.gliderEquipped = false; changed(h);
    return result(true, 'Planador comprado. Equipe-o antes de usar.', { price });
  };
  S.equipGlider = (h = hero(), equipped = true) => {
    if (!h) return result(false, 'Nenhum personagem.');
    const d = S.data(h);
    if (equipped && !d.gliderOwned) return result(false, 'Compre um planador numa loja de equipamentos da vila.');
    d.gliderEquipped = equipped === true;
    if (!d.gliderEquipped && E.WG && E.WG.world && E.WG.world.hero) E.WG.world.hero.glide = false;
    changed(h);
    return result(true, d.gliderEquipped ? 'Planador equipado.' : 'Planador guardado.');
  };
  S.addFood = (h, id, n = 1) => {
    if (!h || !D.FOODS[id] || !validCount(n)) return result(false, 'Alimento ou quantidade inválidos.');
    const d = S.data(h), current = d.food[id] || 0;
    if (current + n > 999999) return result(false, 'Sua despensa está cheia para este alimento.');
    d.food[id] = current + n; changed(h);
    return result(true, `${D.FOODS[id].name} ×${n}`, { id, n });
  };
  S.feed = (h, amount) => {
    if (!h || !Number.isFinite(amount) || amount <= 0) return result(false, 'Porção inválida.');
    const d = S.data(h), before = d.hunger;
    d.hunger = Math.min(D.HUNGER_MAX, d.hunger + amount);
    changed(h);
    return result(true, `Saciedade +${Math.round(d.hunger - before)}.`, { restored: d.hunger - before });
  };
  const fishEntry = (h, id) => {
    if (typeof id !== 'string' || !id.startsWith('fish:')) return null;
    const key = id.slice(5), def = E.L && E.L.FISH && E.L.FISH[key], n = h && h.life && h.life.fish && h.life.fish[key];
    if (!def) return null;
    return { id, name: def.name, iconKey: 'fish', raw: true, hunger: 0, cookTo: 'peixe_assado', price: def.price || 5, n: Number.isSafeInteger(n) && n > 0 ? n : 0, rarity: def.r, source: 'fish', fishId: key };
  };
  S.foodItems = (h = hero()) => {
    if (!h) return [];
    const d = S.data(h), list = Object.entries(d.food).map(([id, n]) => Object.assign({ n, source: 'food' }, D.FOODS[id]));
    for (const id of Object.keys(h.life && h.life.fish || {})) { const f = fishEntry(h, 'fish:' + id); if (f && f.n) list.push(f); }
    return list;
  };
  const foodEntry = (h, id) => D.FOODS[id] ? Object.assign({ n: S.data(h).food[id] || 0, source: 'food' }, D.FOODS[id]) : fishEntry(h, id);
  const consume = (h, entry) => {
    const bag = entry.source === 'fish' ? h.life.fish : S.data(h).food, key = entry.fishId || entry.id;
    if (!Number.isSafeInteger(bag[key]) || bag[key] <= 0) return false;
    bag[key]--; if (!bag[key]) delete bag[key]; return true;
  };
  S.eat = (h = hero(), id) => {
    if (!h) return result(false, 'Nenhum personagem.');
    const entry = foodEntry(h, id);
    if (!entry || !entry.n) return result(false, 'Você não tem esse alimento.');
    if (entry.raw || !entry.hunger) return result(false, 'Prepare esse ingrediente numa fogueira ou cozinha antes de comer.');
    if (S.data(h).hunger >= D.HUNGER_MAX - .001) return result(false, 'Você já está satisfeito.');
    if (!consume(h, entry)) return result(false, 'O alimento já foi usado.');
    const out = S.feed(h, entry.hunger);
    return Object.assign(out, { message: `${entry.name}: ${out.message}`, id });
  };
  S.canCook = (h = hero(), opts = {}) => {
    if (opts.fire === true) return true;
    const inside = E.Interior && E.Interior.current;
    if (inside) {
      if (['food', 'inn', 'taverna', 'kitchen'].includes(inside.kind)) return true;
      // A private kitchen becomes usable after its stove is bought and placed.
      // Do not fall through to the outdoor fire while the player is indoors.
      return inside.kind === 'home' && (inside.fixtures || []).some((f) => f.id === 'hearth');
    }
    const w = E.WG && E.WG.world, hr = w && w.hero;
    if (!hr) return false;
    if (w.fire && w.fire.x != null && Math.hypot(w.fire.x - hr.x, w.fire.z - hr.z) < 4) return true;
    return (w.interactables || []).some((it) => ['campfire', 'fire', 'cooking'].includes(it.kind) && Math.hypot(it.x - hr.x, it.z - hr.z) <= (it.r || 3));
  };
  S.cook = (h = hero(), id, opts = {}) => {
    if (!h) return result(false, 'Nenhum personagem.');
    const entry = foodEntry(h, id);
    if (!entry || !entry.n || !entry.cookTo || !D.FOODS[entry.cookTo]) return result(false, 'Não há ingrediente disponível para essa receita.');
    if (!S.canCook(h, opts)) return result(false, 'Use uma fogueira ou entre numa cozinha para preparar comida.');
    const d = S.data(h);
    if ((d.food[entry.cookTo] || 0) >= 999999) return result(false, 'Sua despensa está cheia.');
    if (!consume(h, entry)) return result(false, 'O ingrediente já foi usado.');
    d.food[entry.cookTo] = (d.food[entry.cookTo] || 0) + 1;
    if (E.Life && E.Life.addXp) E.Life.addXp(h, 'culinaria', 5);
    changed(h);
    return result(true, `${D.FOODS[entry.cookTo].name} preparado. Agora você pode comer ou guardar para vender.`, { id: entry.cookTo, n: 1 });
  };
  S.onBattle = (h = hero(), battle = {}) => {
    if (!h || !battle || typeof battle !== 'object') return result(false, 'Combate inválido.');
    if (seenBattles.has(battle) || battle.id && S.data(h).lastBattle === battle.id) return result(false, 'Combate já contabilizado.');
    seenBattles.add(battle);
    const d = S.data(h); if (battle.id) d.lastBattle = battle.id;
    d.hunger = Math.max(0, d.hunger - 3 * S.bodyModifiers(h).hunger);
    const loot = {};
    if (battle.outcome === 'win') for (const key of (Array.isArray(battle.keys) ? battle.keys : Array.isArray(battle.kills) ? battle.kills : [])) {
      const def = E.M && E.M.MONSTERS && E.M.MONSTERS[key];
      if (def && def.type !== 'besta') continue;
      const name = String((def && def.name) || key).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      let food = /lobo|wolf/.test(name) ? 'carne_lobo' : /aguia|falcao|corvo|ave\b|eagle|hawk/.test(name) ? 'carne_ave' :
        /urso|javali|cervo|veado|cabra|tigre|leao|pantera|porco|boi|bode|bear|boar|deer/.test(name) ? 'carne_caca' : null;
      if (!food) continue;
      const n = def && ['Grande', 'Enorme', 'Imenso'].includes(def.size) ? 2 : 1;
      loot[food] = (loot[food] || 0) + n;
    }
    for (const [id, n] of Object.entries(loot)) { d.food[id] = Math.min(999999, (d.food[id] || 0) + n); if (E.UI && E.UI.loot) E.UI.loot(E.Icons ? E.Icons.html(D.FOODS[id].iconKey) : '', `${D.FOODS[id].name} ×${n}`); }
    changed(h);
    return result(true, '', { loot, hunger: d.hunger });
  };

  S.openFood = ({ fire = false } = {}) => {
    if (!E.UI || !E.UI.screen || !hero()) return null;
    const h = hero(), UI = E.UI, esc = U.esc;
    const icon = (key) => E.Icons ? E.Icons.html(key, { decorative: true }) : '';
    const el = UI.screen(fire ? 'Fogueira e provisões' : 'Comida e equipamento de viagem');
    const body = el.querySelector('.screen-body');
    const draw = () => {
      const d = S.data(h);
      body.innerHTML = `<div style="max-width:800px;margin:auto"><div class="card"><b data-satiety>Saciedade ${Math.ceil(d.hunger)}/100</b><div class="bar" style="margin:10px 0"><i data-food-bar style="width:${d.hunger}%;background:#a8bb79"></i></div><p class="muted">Andar, correr e batalhar consomem comida. Sem saciedade, você não pode correr e sofre −2 no ataque e dano.</p>${fire ? '<p>Você está junto ao fogo. Prepare os ingredientes antes de comer.</p>' : '<p class="muted">Cozinhe nas fogueiras do mapa ou nas cozinhas das vilas.</p>'}</div><div data-foods></div><div class="card" style="margin-top:16px"><h3>Equipamento de viagem</h3>${icon('glider')} <b>Planador</b><p>${d.gliderOwned ? (d.gliderEquipped ? 'Equipado. No computador, segure Espaço durante o salto. No celular, toque uma vez em Pular enquanto está no ar.' : 'Você possui um planador. Equipe-o para poder planar.') : 'Compre um planador na loja de equipamentos de uma vila. Ele não vem com o personagem.'}</p>${d.gliderOwned ? `<button class="btn primary" data-glider>${d.gliderEquipped ? 'Guardar' : 'Equipar'} planador</button>` : ''}</div><button class="btn dark" data-calendar style="margin-top:14px">${icon('calendar')} Abrir calendário</button></div>`;
      const list = body.querySelector('[data-foods]'), items = S.foodItems(h);
      if (!items.length) list.appendChild(U.h('<p class="muted" style="padding:18px">Sem provisões. Compre alimentos na vila, pesque ou obtenha carne de animais de caça.</p>'));
      for (const entry of items) {
        const row = U.h(`<div class="shop-item"><div class="si">${icon(entry.iconKey)}</div><div class="sx"><b>${esc(entry.name)} ×${entry.n}</b><small>${entry.raw ? 'Ingrediente cru: prepare no fogo.' : `Recupera ${entry.hunger} de saciedade.`}${entry.rarity >= 4 ? ' Peixe valioso: cozinhar consome essa unidade.' : ''}</small></div><div style="display:flex;gap:6px;flex-wrap:wrap">${entry.hunger > 0 && !entry.raw ? '<button class="btn primary sm" data-eat>Comer</button>' : ''}${entry.cookTo ? `<button class="btn dark sm" data-cook ${fire || S.canCook(h) ? '' : 'disabled'}>Preparar</button>` : ''}</div></div>`);
        const eat = row.querySelector('[data-eat]'), cook = row.querySelector('[data-cook]');
        if (eat) eat.onclick = () => { const r = S.eat(h, entry.id); UI.toast(r.message); draw(); };
        if (cook) cook.onclick = () => { const r = S.cook(h, entry.id, { fire }); UI.toast(r.message); draw(); };
        list.appendChild(row);
      }
      const gear = body.querySelector('[data-glider]');
      if (gear) gear.onclick = () => { UI.toast(S.equipGlider(h, !S.data(h).gliderEquipped).message); draw(); };
      body.querySelector('[data-calendar]').onclick = () => S.openCalendar();
    };
    draw();
    const off = U.on('survival:changed', () => {
      const d = S.data(h), text = body.querySelector('[data-satiety]'), bar = body.querySelector('[data-food-bar]');
      if (text) text.textContent = `Saciedade ${Math.ceil(d.hunger)}/100`;
      if (bar) bar.style.width = d.hunger + '%';
    });
    UI.open(el, off);
    return el;
  };
  S.openCalendar = () => {
    if (!E.UI || !E.UI.screen) return null;
    const UI = E.UI, el = UI.screen('Calendário de Elarion');
    const cells = Array.from({ length: D.DAYS_IN_MONTH }, (_, i) => `<div class="card" data-calendar-day="${i + 1}" style="padding:12px;text-align:center"><b>${i + 1}</b></div>`).join('');
    el.querySelector('.screen-body').innerHTML = `<div style="max-width:760px;margin:auto"><h3 data-calendar-season></h3><p><b data-calendar-now></b></p><p class="muted">Um dia completo dura quatro minutos de jogo ativo. O calendário pausa quando você sai do jogo. À noite há mais monstros, menos fregueses e peixes próprios desse horário.</p><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">${D.WEEKDAYS.map(x => `<small style="text-align:center">${x.slice(0, 3)}</small>`).join('')}${cells}</div><p class="muted" style="margin-top:18px">Durma numa pousada com quarto alugado ou em sua própria casa para avançar até a manhã. Aluguéis de casas e lojas seguem este calendário.</p></div>`;
    let shownDay = 0;
    const update = () => {
      const c = S.clock();
      el.querySelector('[data-calendar-now]').textContent = c.text;
      if (shownDay === c.day) return;
      shownDay = c.day;
      el.querySelector('[data-calendar-season]').textContent = `${c.season} · Ano ${c.year}`;
      for (const cell of el.querySelectorAll('[data-calendar-day]')) {
        const selected = Number(cell.dataset.calendarDay) === c.dayOfMonth;
        cell.style.border = selected ? '2px solid #ba9358' : '';
        cell.style.background = selected ? '#f4e4bf' : '';
        if (selected) cell.setAttribute('aria-current', 'date'); else cell.removeAttribute('aria-current');
      }
    };
    update();
    UI.open(el, U.on('survival:changed', update)); return el;
  };
  E.Sim = S;
})();
