/* Relógio, comida e equipamento de viagem. Nenhuma chamada de rede ou avanço offline. */
(() => {
  'use strict';
  const U = E.U, D = E.SIM_DATA;
  if (!D) throw new Error('Carregue data/simulation.js antes de engine/simulation.js.');
  const S = { FOODS: D.FOODS, DAY_SECONDS: D.DAY_SECONDS, GLIDER_PRICE: D.GLIDER_PRICE };
  const hero = () => E.Store && E.Store.hero ? E.Store.hero() : null;
  const save = () => { if (E.Store && E.Store.save) E.Store.save(); };
  const emit = (name, data) => { if (U && U.emit) U.emit(name, data); };
  const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const validCount = (n) => Number.isSafeInteger(n) && n > 0 && n <= 999999;
  const result = (ok, message, extra) => Object.assign({ ok, message }, extra || {});
  const changed = (h, persist = true) => { if (persist) save(); emit('survival:changed', { hero: h, hunger: S.data(h).hunger, clock: S.clock() }); };
  let statusTime = 0;
  const seenBattles = new WeakSet();

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
    // A resumed/background tab cannot silently charge days or food for missed frames.
    dt = Math.min(dt, 1);
    S.advance(dt);
    const rate = (ctx.mode === 'arena' ? D.HUNGER_RATE.battle : ctx.sprinting && ctx.moving ? D.HUNGER_RATE.running : ctx.moving ? D.HUNGER_RATE.walking : D.HUNGER_RATE.idle) * S.hungerMult(h);
    const d = S.data(h), before = d.hunger;
    d.hunger = Math.max(0, d.hunger - rate * dt);
    statusTime += dt;
    if (statusTime >= .5 || before > 0 && d.hunger === 0) { statusTime = 0; changed(h, false); }
    return true;
  };
  // Ritmo da fome: ajuste do jogador (Lento 0,6 · Normal 1 · Rápido 1,4) × tipo físico (Gordo 1,25).
  S.hungerMult = (h = hero()) => { const set = Number(E.state && E.state.settings && E.state.settings.hungerRate); return (Number.isFinite(set) && set > 0 ? set : 1) * ((D.HUNGER_BUILD || {})[h && h.look && h.look.build] || 1); };
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
  // ------------------------------------------------------------ receitas e preparo (fogão e fogueira)
  // "peixe" aceita filé ou qualquer peixe pescado; "carne" aceita qualquer carne crua.
  const GROUPS = { carne: ['carne_caca', 'carne_lobo', 'carne_ave'] };
  const fishBag = (h) => (h.life && h.life.fish) || {};
  const cheapFish = (h) => Object.keys(fishBag(h)).filter((k) => fishBag(h)[k] > 0 && E.L && E.L.FISH[k]).sort((a, b) => E.L.FISH[a].price - E.L.FISH[b].price);
  S.ingredientCount = (h, key) => {
    const food = S.data(h).food;
    if (key === 'peixe') return (food.peixe_cru || 0) + cheapFish(h).reduce((a, k) => a + fishBag(h)[k], 0);
    if (GROUPS[key]) return GROUPS[key].reduce((a, k) => a + (food[k] || 0), 0);
    return food[key] || 0;
  };
  S.INGREDIENT_NAMES = { peixe: 'Peixe (qualquer)', carne: 'Carne crua (qualquer)' };
  S.ingredientName = (key) => S.INGREDIENT_NAMES[key] || (D.FOODS[key] ? D.FOODS[key].name : key);
  S.recipes = (h = hero(), station) => D.RECIPES.filter((r) => !station || r.stations.includes(station)).map((r) => {
    const need = Object.entries(r.need).map(([k, n]) => ({ key: k, n, have: S.ingredientCount(h, k), name: S.ingredientName(k) }));
    return Object.assign({}, r, { dish: D.FOODS[r.result], need, ok: need.every((x) => x.have >= x.n) });
  });
  const takeIngredients = (h, need) => {
    const food = S.data(h).food;
    for (const [k, n0] of Object.entries(need)) {
      let n = n0;
      const take = (bag, id) => { while (n > 0 && bag[id] > 0) { bag[id]--; n--; } if (!bag[id]) delete bag[id]; };
      if (k === 'peixe') { take(food, 'peixe_cru'); for (const f of cheapFish(h)) take(fishBag(h), f); }
      else if (GROUPS[k]) for (const id of GROUPS[k]) take(food, id);
      else take(food, k);
      if (n > 0) return false;
    }
    return true;
  };
  // A sessão de preparo vive no motor: a tela só envia ações; a qualidade sai do que aconteceu na panela.
  let cookS = null;
  S.cookSession = () => (cookS && cookS.hero === (hero() && hero().id) ? cookS : null);
  S.cookBegin = (h = hero(), recipeId, station) => {
    const r = D.RECIPES.find((x) => x.id === recipeId);
    if (!h || !r) return result(false, 'Receita desconhecida.');
    if (!r.stations.includes(station)) return result(false, station === 'fogueira' ? 'Essa receita precisa de um fogão.' : 'Essa receita não é feita aqui.');
    if (!Object.entries(r.need).every(([k, n]) => S.ingredientCount(h, k) >= n)) return result(false, 'Faltam ingredientes para essa receita.');
    const fire = station === 'fogueira';
    cookS = { hero: h.id, recipe: r, station, t: 0, done: false, burnt: false,
      // fogão: temperatura, chama (0 a 4), tempo de preparo útil, mexidas
      temp: .25, heat: 2, band: [.44, .68], cookTime: 0, need: r.time * 1.4, good: 0, burn: 0, stirAt: 2.6, stirUntil: 0, stirs: 0, stirHits: 0, drift: 0, nextDrift: 2.4, bias: 0,
      // fogueira: ponto de cada lado do espeto e intensidade do fogo
      side: 0, sides: [0, 0], flame: 1, flips: 0, rate: 1 / (r.time * .9), fire };
    return result(true, '', { session: cookS });
  };
  S.cookInput = (action) => {
    const c = S.cookSession(); if (!c || c.done) return result(false, '');
    if (!c.fire) {
      if (action === 'up') c.heat = Math.min(4, c.heat + 1);
      else if (action === 'down') c.heat = Math.max(0, c.heat - 1);
      else if (action === 'stir') { if (c.t < c.stirUntil) { c.stirHits++; c.stirUntil = 0; return result(true, 'Mexeu na hora certa!', { good: true }); } return result(true, 'Ainda não precisa mexer.', { good: false }); }
      return result(true, '');
    }
    if (action === 'flip') { c.side = 1 - c.side; c.flips++; return result(true, ''); }
    if (action === 'take') { c.done = true; return result(true, ''); }
    return result(false, '');
  };
  S.cookTick = (dt) => {
    const c = S.cookSession(); if (!c || c.done || !(dt > 0)) return null;
    dt = Math.min(dt, .1); c.t += dt;
    if (!c.fire) {
      // o fogão nunca fica parado: de tempos em tempos a chama aumenta ou baixa sozinha
      c.drift += dt;
      if (c.drift > c.nextDrift) {
        c.drift = 0; c.nextDrift = 2.4 + Math.random() * 1.6;
        const was = c.bias; c.bias = [-.17, 0, .17].filter((v) => v !== was)[Math.random() < .5 ? 0 : 1];
        c.msg = c.bias > 0 ? 'A chama subiu sozinha: baixe o fogo.' : c.bias < 0 ? 'A chama enfraqueceu: aumente o fogo.' : 'A chama estabilizou.'; c.msgN = (c.msgN || 0) + 1;
      }
      const target = .12 + c.heat * .2 + c.bias; c.temp += (target - c.temp) * Math.min(1, dt * 1.6);
      if (c.temp >= .35) c.cookTime += dt;
      if (c.temp >= c.band[0] && c.temp <= c.band[1]) c.good += dt;
      if (c.temp > .9) { c.burn += dt; if (c.burn > 1.6) { c.burnt = true; c.done = true; } } else c.burn = Math.max(0, c.burn - dt * .5);
      if (c.t >= c.stirAt) { c.stirs++; c.stirUntil = c.t + 1.6; c.stirAt = c.t + 2.8 + Math.random() * 1.4; }
      if (c.cookTime >= c.need) c.done = true;
    } else {
      // a chama da fogueira oscila; o lado que está sobre o fogo vai ganhando cor
      c.flame = Math.min(1.3, Math.max(.75, c.flame + (Math.random() - .5) * dt * 1.2));
      c.sides[c.side] += c.rate * c.flame * dt;
      if (c.sides[c.side] > 1.08) { c.burnt = true; c.done = true; }
    }
    return c;
  };
  S.cookScore = (c) => {
    if (!c) return 0;
    if (!c.fire) return Math.max(0, Math.min(1, (c.good / Math.max(1, c.need)) * .75 + (c.stirs ? c.stirHits / c.stirs : 1) * .25));
    const side = (x) => Math.max(0, 1 - Math.abs(x - .74) / .32);
    return (side(c.sides[0]) + side(c.sides[1])) / 2;
  };
  S.cookFinish = (h = hero()) => {
    const c = S.cookSession(); if (!h || !c || !c.done) return result(false, 'O preparo ainda não terminou.');
    cookS = null;
    if (!takeIngredients(h, c.recipe.need)) return result(false, 'Os ingredientes não estão mais na mochila.');
    const d = S.data(h), score = S.cookScore(c);
    let q = c.burnt ? 0 : score >= .9 ? 4 : score >= .7 ? 3 : score >= .45 ? 2 : 1;
    if (c.fire && !c.burnt && Math.min(c.sides[0], c.sides[1]) < .45) q = 1;
    const id = q === 0 ? 'comida_queimada' : q === 2 ? c.recipe.result : `${c.recipe.result}_${D.QUALITY[q].tag}`;
    d.food[id] = Math.min(999999, (d.food[id] || 0) + 1);
    if (E.Life && E.Life.addXp) E.Life.addXp(h, 'culinaria', q ? 4 + q * 2 : 2);
    changed(h);
    const label = q === 0 ? 'Queimada' : D.QUALITY[q].label;
    return result(true, `${D.FOODS[id].name} pronto: ${label}.`, { id, q, label, score: Math.round(score * 100), food: D.FOODS[id] });
  };
  S.cookAbort = () => { cookS = null; };

  S.onBattle = (h = hero(), battle = {}) => {
    if (!h || !battle || typeof battle !== 'object') return result(false, 'Combate inválido.');
    if (seenBattles.has(battle) || battle.id && S.data(h).lastBattle === battle.id) return result(false, 'Combate já contabilizado.');
    seenBattles.add(battle);
    const d = S.data(h); if (battle.id) d.lastBattle = battle.id;
    d.hunger = Math.max(0, d.hunger - 3);
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
        const row = U.h(`<div class="shop-item"><div class="si">${E.FoodArt && E.FoodArt.has(entry.id) ? `<img src="${E.FoodArt.url(entry.id, 96)}" alt="" style="width:100%;height:100%;object-fit:contain">` : icon(entry.iconKey)}</div><div class="sx"><b>${esc(entry.name)} ×${entry.n}</b><small>${entry.raw ? 'Ingrediente cru: prepare no fogo.' : `Recupera ${entry.hunger} de saciedade.`}${entry.rarity >= 4 ? ' Peixe valioso: cozinhar consome essa unidade.' : ''}</small></div><div style="display:flex;gap:6px;flex-wrap:wrap">${entry.hunger > 0 && !entry.raw ? '<button class="btn primary sm" data-eat>Comer</button>' : ''}${entry.cookTo ? `<button class="btn dark sm" data-cook ${fire || S.canCook(h) ? '' : 'disabled'}>Preparar</button>` : ''}</div></div>`);
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
