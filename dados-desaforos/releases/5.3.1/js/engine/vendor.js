/* Mercado do jogador: estoque real em custódia e clientes autônomos offline.
   Nenhuma chamada de rede: preferências, orçamento e negociação pertencem ao jogo. */
(() => {
  'use strict';
  const V = {}, U = E.U;
  const copy = (v) => JSON.parse(JSON.stringify(v));
  const hero = () => E.Store.hero();
  const clock = () => E.Sim && E.Sim.clock ? E.Sim.clock() : { day: 1, hour: 8, elapsed: 0, night: false };
  const whole = (n, max = 999999) => Number.isSafeInteger(Number(n)) && Number(n) > 0 && Number(n) <= max;
  const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  // Detect affirmative product claims, respecting common Portuguese negations.
  // Word boundaries prevent "procura" from becoming a promise of "cura".
  const claimsFeature = (text, pattern) => {
    for (const match of text.matchAll(new RegExp(pattern.source, 'g'))) {
      const prefix = text.slice(Math.max(0, match.index - 65), match.index);
      const negated = /\b(?:(?:nao|nem|nunca)(?:\s+(?:e|sao|era|foi|sera|promete|pode|vou|vamos|digo|diz|oferece|garante|ser|propriedades|uma?|os?|as?|de)){0,3}|sem(?:\s+(?:promessas?|efeitos?|propriedades|alegar|prometer|de)){0,3})\s*$/.test(prefix);
      if (!negated) return true;
    }
    return false;
  };
  const hash = (s) => [...String(s)].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const result = (ok, message, extra = {}) => Object.assign({ ok, message }, extra);
  const save = (h, region) => { E.Store.save(); U.emit('vendor:changed', { heroId: h.id, region }); };
  const access = (h, region) => !!(E.Settlements && E.Settlements.hasAccess(h, region, 'shop'));
  const prop = (h, region) => E.Settlements && E.Settlements.property(h, region, 'shop');
  V.data = (h = hero()) => {
    if (!h) return null;
    const d = h.vendor = h.vendor || {};
    d.version = 1; d.serial = Number.isSafeInteger(d.serial) ? d.serial : 0; d.shops = d.shops || {};
    return d;
  };
  V.shop = (h = hero(), region = E.state.world.region) => {
    const d = V.data(h); if (!d) return null;
    const s = d.shops[region] = d.shops[region] || {};
    s.stocks = Array.isArray(s.stocks) ? s.stocks : []; s.clients = Array.isArray(s.clients) ? s.clients : [];
    s.history = Array.isArray(s.history) ? s.history : []; s.revenue = Number(s.revenue) || 0;
    s.sales = Number(s.sales) || 0; s.reputation = Number(s.reputation) || 0; s.arrival = Number(s.arrival) || 0;
    s.open = !!s.open;
    return s;
  };
  const life = (h) => E.Life && E.Life.data ? E.Life.data(h) : (h.life = h.life || {});
  const bag = (h, kind) => {
    if (kind === 'inventory') return h.inventory = h.inventory || {};
    if (kind === 'material') return h.materials = h.materials || {};
    if (kind === 'food') return E.Sim ? E.Sim.data(h).food : (h.survival = h.survival || { food: {} }).food;
    const d = life(h); const k = { fish: 'fish', ore: 'ores', cargo: 'cargo' }[kind];
    return k ? (d[k] = d[k] || {}) : null;
  };
  const weaponEquipped = (uid) => (E.state.heroes || []).some((h) => h.equip && Object.values(h.equip).includes(uid));
  const rarity = (r) => Number(r) || ({ Comum: 1, Incomum: 2, Rara: 3, 'Muito rara': 4, Lendária: 5 }[r] || 1);
  function metadata(kind, id, weapon) {
    const L = E.L || {}, R = E.R || {};
    let d, category, iconKey;
    if (kind === 'weapon') {
      d = E.C.weaponDef(weapon) || {}; category = 'armas'; iconKey = d.base && /machado/.test(d.base) ? 'axe' : d.type === 'arco' ? 'bow' : d.type === 'haste' ? 'polearm' : d.type === 'catalisador' ? 'book' : 'sword';
      const r = rarity(d.rarity); const baseValue = ({ 1: 18, 2: 40, 3: 90, 4: 260, 5: 700 }[r] || 18) + Math.max(0, (weapon.lv || 1) - 1) * r;
      return { name: d.name || 'Arma', description: d.lore || 'Equipamento de aventura.', iconKey, category, rarity: r, baseValue, traits: ['equipamento', 'combate', ...(r >= 3 ? ['raridade', 'colecao'] : [])], weaponDef: copy(d) };
    }
    if (kind === 'food') { d = E.Sim && E.Sim.FOODS[id]; category = d && d.raw ? 'ingredientes' : 'comida'; iconKey = d && d.iconKey || 'cooking'; }
    if (kind === 'fish') { d = L.FISH && L.FISH[id]; category = 'peixes'; iconKey = 'fish'; }
    if (kind === 'ore') { d = L.ORES && L.ORES[id]; category = 'materiais'; iconKey = 'rock'; }
    if (kind === 'cargo') { d = L.GOODS && L.GOODS[id]; category = 'mercadorias'; iconKey = 'package'; }
    if (kind === 'inventory') { d = R.ITEMS && R.ITEMS[id]; category = d && d.heal ? 'cura' : 'alquimia'; iconKey = 'potion'; }
    if (kind === 'material') { d = null; category = 'materiais'; iconKey = 'herb'; }
    d = d || {};
    return { name: d.name || id.replace(/_/g, ' '), description: d.desc || d.description || (kind === 'material' ? 'Material recolhido durante a exploração.' : ''), iconKey, category, rarity: rarity(d.rarity || d.r), baseValue: Math.max(1, Math.round(Number(d.price || d.base) || (kind === 'material' ? 5 : 8))), raw: !!d.raw, hunger: Number(d.hunger) || 0, traits: [category, ...(d.heal ? ['cura', 'recuperacao'] : []), ...(d.hunger > 0 && !d.raw ? ['refeicao', 'alimentacao'] : [])] };
  }
  V.inventory = (h = hero()) => {
    if (!h) return [];
    const list = [];
    for (const kind of ['food', 'fish', 'inventory', 'ore', 'cargo', 'material']) {
      for (const [id, n] of Object.entries(bag(h, kind) || {})) {
        if (!(n > 0)) continue;
        const def = kind === 'inventory' && E.R.ITEMS[id];
        if (def && (def.quest || def.unsellable)) continue;
        list.push(Object.assign({ key: `${kind}:${id}`, kind, itemId: id, quantity: Math.floor(n) }, metadata(kind, id)));
      }
    }
    for (const w of E.state.weapons || []) {
      if (w.lock || weaponEquipped(w.uid)) continue;
      list.push(Object.assign({ key: `weapon:${w.uid}`, kind: 'weapon', itemId: w.uid, quantity: 1 }, metadata('weapon', w.uid, w)));
    }
    return list;
  };
  V.addStock = (h, region, key, quantity, price) => {
    if (!access(h, region)) return result(false, 'Alugue ou compre um ponto e quite o aluguel antes de abastecer.');
    if (!whole(quantity, 9999) || !whole(price)) return result(false, 'Informe quantidade e preço inteiros maiores que zero.');
    const item = V.inventory(h).find((x) => x.key === key);
    quantity = Number(quantity); price = Number(price);
    if (!item || item.quantity < quantity || item.kind === 'weapon' && quantity !== 1) return result(false, 'Esse item não está disponível nessa quantidade. Armas equipadas ou travadas ficam protegidas.');
    const s = V.shop(h, region), d = V.data(h);
    // Validate and construct the escrow snapshot before mutating the real inventory.
    const entry = { id: 'stock-' + (d.serial + 1), key, kind: item.kind, itemId: item.itemId, item: {...copy(item),baseValue:E.Settlements&&E.Settlements.price?E.Settlements.price(region,item.baseValue):item.baseValue}, quantity, price };
    if (item.kind === 'weapon') {
      const index = E.state.weapons.findIndex((w) => w.uid === item.itemId && !w.lock && !weaponEquipped(w.uid));
      if (index < 0) return result(false, 'A arma mudou de estado. Selecione outro item.');
      entry.weapon = copy(E.state.weapons[index]); E.state.weapons.splice(index, 1);
    } else {
      const container = bag(h, item.kind); if (!container || !(container[item.itemId] >= quantity)) return result(false, 'O inventário mudou. Tente novamente.');
      container[item.itemId] -= quantity; if (!container[item.itemId]) delete container[item.itemId];
    }
    d.serial++; s.stocks.push(entry); save(h, region);
    return result(true, `${quantity} × ${item.name} colocado(s) no mostruário.`, { stock: entry });
  };
  V.withdrawStock = (h, region, stockId) => {
    const s = V.shop(h, region), i = s.stocks.findIndex((x) => x.id === stockId); if (i < 0) return result(false, 'Esse item não está mais no mostruário.');
    const e = s.stocks[i];
    if (!whole(e.quantity, 9999)) return result(false, 'Quantidade de estoque inválida.');
    if (e.kind === 'weapon') {
      if (!e.weapon || (E.state.weapons || []).some((w) => w.uid === e.weapon.uid)) return result(false, 'A arma já está no inventário; retirada cancelada para evitar duplicação.');
      E.state.weapons.push(copy(e.weapon));
    } else {
      const container = bag(h, e.kind); if (!container) return result(false, 'Categoria de item inválida.');
      container[e.itemId] = (container[e.itemId] || 0) + e.quantity;
    }
    s.stocks.splice(i, 1); save(h, region); return result(true, 'Item devolvido ao inventário.');
  };
  V.setPrice = (h, region, stockId, price) => {
    if (!whole(price)) return result(false, 'O preço deve ser inteiro e maior que zero.');
    const e = V.shop(h, region).stocks.find((x) => x.id === stockId); if (!e) return result(false, 'Esse item não está mais disponível.');
    e.price = Number(price); save(h, region); return result(true, 'Preço atualizado.');
  };
  V.openShop = (h, region) => {
    if (!access(h, region)) return result(false, 'Seu ponto precisa de um contrato válido e do aluguel em dia.');
    const s = V.shop(h, region);
    if (!s.stocks.some((x) => x.quantity > 0)) return result(false, 'Coloque ao menos um item no mostruário antes de abrir.');
    s.open = true; if (!s.initialized) { s.initialized = true; s.arrival = 23; }
    save(h, region); return result(true, 'Portas abertas. Os clientes chegarão enquanto você joga.');
  };
  V.closeShop = (h, region) => { const s = V.shop(h, region); s.open = false; save(h, region); return result(true, 'Ponto fechado. Seu estoque continua guardado.'); };
  V.PERSONALITIES = [
    { id: 'poupador', name: 'Econômico', role: 'Aprendiz', clue: 'Compara preços e procura utilidade.', needs: ['comida', 'cura', 'materiais'], budget: [14, 65], patience: 4, margin: .95, topics: /econom|justo|desconto|duravel|util/ },
    { id: 'viajante', name: 'Viajante', role: 'Explorador', clue: 'Precisa de suprimentos para uma viagem.', needs: ['comida', 'cura', 'armas'], budget: [35, 140], patience: 4, margin: 1.22, topics: /viagem|estrada|aventura|leve|pratic|energia|recuper/ },
    { id: 'colecionador', name: 'Colecionador', role: 'Arquivista', clue: 'Observa peças raras e histórias verdadeiras.', needs: ['armas', 'peixes', 'mercadorias'], budget: [90, 850], patience: 5, margin: 1.4, topics: /rar|colec|origem|historia|acabamento/ },
    { id: 'cozinheira', name: 'Cozinheira', role: 'Cozinheira', clue: 'Procura ingredientes e comida para a cozinha.', needs: ['peixes', 'ingredientes', 'comida', 'mercadorias'], budget: [25, 160], patience: 4, margin: 1.15, topics: /cozinh|receita|assad|refeic|ingrediente|prepar/ },
    { id: 'ferreiro', name: 'Artesão', role: 'Ferreiro', clue: 'Valoriza materiais e equipamento de verdade.', needs: ['materiais', 'armas', 'mercadorias'], budget: [45, 280], patience: 4, margin: 1.2, topics: /forja|metal|resisten|oficio|material|combate/ },
    { id: 'curandeira', name: 'Cuidadosa', role: 'Curandeira', clue: 'Quer ajudar pessoas, mas não aceita promessas milagrosas.', needs: ['cura', 'alquimia', 'comida'], budget: [35, 240], patience: 5, margin: 1.2, topics: /cura|recuper|cuidar|pessoas|saude|refeic/ },
    { id: 'apressado', name: 'Apressado', role: 'Mensageiro', clue: 'Prefere uma oferta curta e direta.', needs: ['comida', 'cura', 'alquimia'], budget: [18, 110], patience: 3, margin: 1.25, topics: /pronto|agora|rapido|viagem|pratic/ },
    { id: 'desconfiado', name: 'Desconfiado', role: 'Sentinela', clue: 'Exige explicações coerentes; exageros prejudicam a venda.', needs: ['armas', 'cura', 'materiais'], budget: [30, 300], patience: 5, margin: 1.05, topics: /real|simples|uso|prote|resisten|combate|recuper/ },
    { id: 'generoso', name: 'Generoso', role: 'Peregrino', clue: 'Gosta de atendimento respeitoso e utilidade para o grupo.', needs: ['comida', 'cura', 'mercadorias'], budget: [40, 220], patience: 5, margin: 1.3, topics: /obrigad|por favor|grupo|companheir|ajud|cuidar/ },
    { id: 'nobre', name: 'Exigente', role: 'Nobre mercador', clue: 'Valoriza peças especiais e uma apresentação cuidadosa.', needs: ['mercadorias', 'armas', 'peixes'], budget: [150, 1100], patience: 4, margin: 1.5, topics: /qualidade|acabamento|rar|colec|cuidado|especial/ },
  ];
  const NAMES = ['Lia', 'Taren', 'Mira', 'Breno', 'Cora', 'Dália', 'Nilo', 'Iara', 'Otto', 'Suri', 'Ravi', 'Ayla', 'Eron', 'Yuna', 'Lúcio', 'Nara'];
  const categories = { comida: 'uma refeição', ingredientes: 'ingredientes', peixes: 'peixe', cura: 'algo para recuperar ferimentos', armas: 'equipamento', materiais: 'materiais de trabalho', mercadorias: 'mercadorias', alquimia: 'suprimentos de alquimia' };
  V.makeClient = (h, region) => {
    const d = V.data(h), serial = ++d.serial, c = clock();
    const random = U.seeded(hash(`${h.id}|${region}|${c.day}|${serial}`));
    const personality = V.PERSONALITIES[Math.floor(random() * V.PERSONALITIES.length)];
    const need = personality.needs[Math.floor(random() * personality.needs.length)], budget = Math.ceil((personality.budget[0] + random() * (personality.budget[1] - personality.budget[0] + 1))*(E.Settlements&&E.Settlements.marketScale?E.Settlements.marketScale(region):1));
    return { id: 'client-' + serial, name: NAMES[Math.floor(random() * NAMES.length)], trait: personality.id, need, budget, patience: personality.patience, turns: 0, rapport: 0, seen: [], state: 'waiting', counter: null, createdAt: c.elapsed, expires: c.elapsed + 100, portrait: Math.floor(random() * 5), messages: [{ who: 'client', text: `Olá! Estou procurando ${categories[need] || 'algo útil'}. O que você recomenda?` }] };
  };
  V.describeClient = (c) => {
    const p = V.PERSONALITIES.find((x) => x.id === c.trait) || V.PERSONALITIES[0];
    return { name: c.name, personality: p.name, role: p.role, clue: p.clue, request: categories[c.need], turnsLeft: Math.max(0, c.patience - c.turns) };
  };
  V.arrivalInterval = (region) => E.Business && E.Business.arrivalInterval ? E.Business.arrivalInterval(hero(), region) : clock().night ? 65 : 25;
  V.tick = (dt) => {
    const h = hero(); if (!h || !Number.isFinite(dt) || dt <= 0) return;
    const d = V.data(h), c = clock();
    for (const [region, s] of Object.entries(d.shops)) {
      let changed = false;
      const before = s.clients.length;
      s.clients = s.clients.filter((x) => x.state === 'waiting' && x.expires > c.elapsed);
      changed = s.clients.length !== before;
      if (s.open && !access(h, region)) { s.open = false; changed = true; }
      if (s.open && s.stocks.some((x) => x.quantity > 0)) {
        s.arrival = Math.min(130, s.arrival + Math.min(dt, 5));
        if (s.arrival >= V.arrivalInterval(region) && s.clients.length < 3) { s.arrival -= V.arrivalInterval(region); s.clients.push(V.makeClient(h, region)); changed = true; }
      }
      if (changed) save(h, region);
    }
  };
  V.dismiss = (h, region, clientId) => {
    const s = V.shop(h, region), c = s.clients.find((x) => x.id === clientId && x.state === 'waiting');
    if (!c) return result(false, 'Esse cliente já foi embora.');
    c.state = 'left'; s.clients = s.clients.filter((x) => x !== c); save(h, region); return result(true, 'Cliente dispensado.');
  };
  V.negotiate = (h, region, stockId, pitch, offeredPrice, clientId) => {
    const s = V.shop(h, region), c = s.clients.find((x) => x.id === clientId && x.state === 'waiting');
    if (!access(h, region) || !s.open) return result(false, 'Seu ponto está fechado ou com aluguel pendente.');
    if (!c || c.expires <= clock().elapsed) return result(false, 'Esse cliente já foi embora.');
    const e = s.stocks.find((x) => x.id === stockId && x.quantity > 0);
    if (!e || !whole(offeredPrice)) return result(false, 'Selecione um produto e um preço válido.');
    pitch = String(pitch || '').trim().slice(0, 600); const text = norm(pitch), price = Number(offeredPrice);
    if (pitch.length < 8) return result(false, 'Explique em uma frase por que o produto é útil para esse cliente.');
    const p = V.PERSONALITIES.find((x) => x.id === c.trait) || V.PERSONALITIES[0], i = e.item;
    const duplicate = c.seen.includes(`${text}|${price}`); c.seen.push(`${text}|${price}`); c.seen = c.seen.slice(-6); c.turns++;
    c.messages.push({ who: 'player', text: `${i.name} por ${price} po. ${pitch}` });
    let truthful = 0, falseClaim = false;
    const claims = [
      [/\b(?:cura(?:r)?(?:\s+(?:de\s+)?ferimentos?)?|ferimentos?|recuperar pv|medicinal)\b/, i.category === 'cura'],
      [/\blendari[oa]s?\b/, i.rarity >= 5],
      [/\b(?:rar[oa]s?|colecionave(?:l|is))\b/, i.rarity >= 3],
      [/\b(?:pront[oa] para comer|refeicao pronta|ja esta assad[oa]|ja esta cozid[oa])\b/, i.category === 'comida' && !i.raw],
      [/\b(?:armas?|combate|lutar|defesa)\b/, i.category === 'armas'],
      [/\b(?:peixes?|pescad[oa]s?|pesca)\b/, i.category === 'peixes'],
    ];
    for (const [pattern, supported] of claims) if (claimsFeature(text, pattern)) { if (supported) truthful++; else falseClaim = true; }
    const fair = Math.max(1, i.baseValue), useful = i.category === c.need, affordability = price <= c.budget;
    const respect = /obrigad|por favor|bom dia|boa noite|posso ajudar/.test(text);
    const relevant = p.topics.test(text);
    if (!duplicate && !falseClaim && (truthful || relevant || respect)) c.rapport = Math.min(3, c.rapport + 1);
    const score = 1 + (useful ? 2 : 0) + Math.min(2, truthful) + (relevant ? 1 : 0) + (respect ? .3 : 0) + c.rapport * .35 + Math.min(.5, s.reputation / 100) - (duplicate ? 2 : 0) - (falseClaim ? p.id === 'desconfiado' ? 5 : 3 : 0) - (p.id === 'apressado' && pitch.length > 260 ? 1 : 0);
    const willingness = Math.max(1, Math.floor(fair * (p.margin + (useful ? .13 : -.18) + c.rapport * .04)));
    const agreedCounter = c.counter && c.counter.stockId === e.id && price <= c.counter.price;
    let outcome, reply, reasons = [];
    if (falseClaim) reasons.push('A promessa não corresponde às características do produto.');
    if (duplicate) reasons.push('Repetir a mesma oferta não cria confiança.');
    if (!useful) reasons.push('O produto não é a prioridade deste cliente.');
    if (price > willingness) reasons.push('O preço supera o valor que ele atribui ao produto.');
    if (!affordability) reasons.push('A oferta não cabe no orçamento dele.');
    if (!falseClaim && !duplicate && affordability && price <= willingness && (score >= 4 || agreedCounter)) {
      // A client buys exactly one escrowed unit; removing its state prevents repeated payouts.
      e.quantity--; h.gold += price; c.budget -= price; c.state = 'bought';
      s.revenue += price; s.sales++; s.reputation = Math.min(100, s.reputation + 1);
      if (!e.quantity) s.stocks = s.stocks.filter((x) => x !== e);
      s.clients = s.clients.filter((x) => x !== c);
      reply = `Fechado! Vou levar ${i.name} por ${price} po. Obrigado pelo atendimento.`; outcome = 'sold';
      reasons = useful ? ['A oferta atende à necessidade do cliente.', 'Preço e apresentação foram convincentes.'] : ['Sua explicação mostrou uma utilidade convincente.'];
      s.history.unshift({ day: clock().day, client: c.name, item: i.name, gold: price }); s.history.length = Math.min(s.history.length, 20);
      if (E.Life && E.Life.ev) E.Life.ev('profit', 1, { amount: price });
    } else if (c.turns >= c.patience || duplicate && c.turns >= c.patience - 1) {
      c.state = 'left'; s.clients = s.clients.filter((x) => x !== c); outcome = 'left';
      reply = falseClaim ? 'Não consigo confiar nessas promessas. Vou procurar outro lugar.' : 'Hoje não vamos chegar a um acordo. Obrigado, preciso seguir meu caminho.';
    } else if (!falseClaim && score >= 2.5) {
      const counterPrice = Math.min(c.budget, willingness, price - 1);
      if (counterPrice >= 1) { c.counter = { stockId: e.id, price: counterPrice }; outcome = 'counter'; reply = `Entendi a utilidade. Por ${counterPrice} po eu consigo levar. Você aceita?`; }
      else { outcome = 'declined'; reply = 'Não consigo pagar essa oferta. Tem uma alternativa mais simples?'; }
    } else {
      outcome = 'declined'; reply = falseClaim ? 'Esse produto realmente faz o que você prometeu? Prefiro uma explicação honesta do que ele oferece.' : duplicate ? 'Já ouvi essa oferta. Que vantagem concreta isso tem para mim?' : `Ainda não vejo como isso me ajuda a encontrar ${categories[c.need]}. Pode explicar melhor ou mostrar outro produto?`;
    }
    c.messages.push({ who: 'client', text: reply }); c.messages = c.messages.slice(-12);
    save(h, region);
    return result(true, reply, { outcome, reasons, counterOffer: outcome === 'counter' ? c.counter.price : null, client: c, itemName: i.name, price: outcome === 'sold' ? price : null });
  };
  V.access = access; V.property = prop;
  E.Vendor = V;
})();
