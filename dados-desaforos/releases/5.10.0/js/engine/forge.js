/* Armaria: loja de armas (comuns e encantadas), nível de arma 1–90 com minérios (estilo Genshin),
   ascensões com Fragmentos de Domínio e Núcleos de Covil, e venda de armas. */
(() => {
  const U = E.U, R = E.R, W = E.W;
  const F = {};
  F.CORE = 'Núcleo de Covil';
  F.CORE_ICON = '🔶';

  // armas comuns (★1) — preços do Livro do Jogador 2024, em po
  F.MUNDANE = [
    ['adaga', 2], ['espada_curta', 10], ['cimitarra', 25], ['rapieira', 25], ['espada_longa', 15], ['maca_estrela', 15],
    ['machado_batalha', 10], ['martelo_guerra', 15], ['espada_grande', 50], ['machado_grande', 30], ['malho', 10],
    ['lanca', 1], ['bordao', 1], ['tridente', 5], ['glaive', 20], ['alabarda', 20], ['pique', 5],
    ['arco_curto', 25], ['arco_longo', 50], ['besta_leve', 25], ['besta_mao', 75], ['besta_pesada', 50],
  ];
  F.FOCI = [['cajado', 5], ['simbolo', 5], ['cristal', 10], ['orbe', 20], ['grimorio', 25], ['instrumento', 30]];
  // minérios à venda (para quem não minera)
  F.ORE_PRICE = { ferro: 25, prata: 60, cristal: 140, obsidiana: 180 };

  F.makeMundane = (base) => Object.assign(E.C.makeStarter(base), { lore: 'Forjada pelos artesãos de Elarion. Aprimore na forja para deixá-la mais letal.' });
  F.makeFocus = (kind) => Object.assign(E.C.makeFocus(kind), { lore: 'Um foco de conjuração bem acabado. Pode ser aprimorado na forja.' });

  // estoque da loja: comuns, focos e as encantadas da Armaria
  F.stock = () => {
    const list = [];
    for (const [id, d] of Object.entries(W.CATALOG)) if (d.shop) list.push({ key: id, kind: 'catalog', id, def: d, price: d.shop.price, lvl: d.shop.lvl });
    for (const [base, price] of F.MUNDANE) list.push({ key: 'm_' + base, kind: 'mundane', base, def: F.makeMundane(base), price, lvl: 1 });
    for (const [k, price] of F.FOCI) list.push({ key: 'f_' + k, kind: 'focus', focus: k, def: F.makeFocus(k), price, lvl: 1 });
    return list.sort((a, b) => b.def.rarity - a.def.rarity || W.TYPE_ORDER.indexOf(a.def.type) - W.TYPE_ORDER.indexOf(b.def.type) || a.price - b.price);
  };
  F.priceFor = (h, item) => {const base=Math.round(item.price * (E.C.hasFeat(h, 'artesao') ? 0.8 : 1));return E.Settlements&&E.Settlements.price?E.Settlements.price(E.Settlements.region(),base):base;};
  F.buy = (h, item) => {
    const price = F.priceFor(h, item);
    if (h.gold < price) return { error: 'Ouro insuficiente.' };
    if (h.level < item.lvl) return { error: `Disponível a partir do nível ${item.lvl}.` };
    h.gold -= price;
    const w = item.kind === 'catalog' ? E.Store.addWeapon(item.id) : E.Store.addWeapon(item.key, { custom: item.def });
    w.spent = price;
    E.Store.save();
    return { weapon: w };
  };

  // ---------------- nível da arma (estilo Genshin) ----------------
  // Nível 1–90 (★1 até 70). EXP vem de minérios (ferro 400, prata 2.000, cristal 10.000) ou de outras armas.
  // Nos níveis 20, 40, 50, 60, 70 e 80 a arma precisa ASCENDER: ouro, Fragmentos de Domínio e Núcleos de Covil.
  // Em D&D: a ascensão dá até +3 nas jogadas de ataque (como uma arma +3) e o nível, até +6 no dano (★5).
  F.CAPS = [20, 40, 50, 60, 70, 80, 90];
  F.maxAsc = (def) => (def.rarity <= 2 ? 4 : 6);
  F.maxLv = (def) => F.CAPS[F.maxAsc(def)];
  F.cap = (entry, def) => F.CAPS[Math.min(entry.asc || 0, F.maxAsc(def))];
  F.EXP_BASE = { 1: 2.5, 3: 3, 4: 3.5, 5: 4 };
  F.expNext = (lv, rarity) => Math.max(1, Math.round((F.EXP_BASE[rarity] || 3) * Math.pow(lv, 1.5)));
  F.ORE_EXP = { ferro: 400, prata: 2000, cristal: 10000 };
  F.GOLD_PER_EXP = 0.1; // 1 po a cada 10 EXP
  F.FODDER_EXP = { 1: 100, 3: 400, 4: 800, 5: 1600 };
  F.fodderExp = (entry) => { const def = E.C.weaponDef(entry); return (F.FODDER_EXP[def.rarity] || 100) + Math.floor((entry.totalExp || 0) * 0.8); };
  // bônus em D&D
  F.HIT_BY_ASC = [0, 0, 1, 1, 2, 2, 3];
  F.DMG_AT_MAX = { 1: 3, 3: 4, 4: 5, 5: 6 };
  F.hitUp = (entry) => F.HIT_BY_ASC[entry.asc || 0] || 0;
  F.dmgUp = (entry, def) => Math.floor((entry.lv || 1) / F.maxLv(def) * (F.DMG_AT_MAX[def.rarity] || 3) + 1e-9);
  // materiais de ascensão
  F.FRAGS = {
    frag1: { name: 'Lasca de Lanterna', tier: 1, icon: '🟩', color: '#7fd36b' },
    frag2: { name: 'Prisma de Lanterna', tier: 2, icon: '🟦', color: '#5aa0ff' },
    frag3: { name: 'Coração de Lanterna', tier: 3, icon: '🟪', color: '#b77dff' },
    frag4: { name: 'Sol de Lanterna', tier: 4, icon: '🟨', color: '#ffb84d' },
  };
  F.frags = () => { E.state.materials = E.state.materials || {}; return E.state.materials; };
  F.addFrag = (id, n) => { if (n > 0) { const m = F.frags(); m[id] = (m[id] || 0) + n; } };
  const RF = { 1: 0.5, 3: 1, 4: 1.3, 5: 1.6 };
  F.ascCost = (def, phase) => {
    const f = RF[def.rarity] || 1;
    const tier = [0, 1, 2, 2, 3, 3, 4][phase], n = [0, 2, 3, 5, 3, 5, 4][phase];
    // Escamas Iridescentes (do Mestre Dendê, o pescador da Baía) são necessárias da Ascensão 3 em diante
    const esc = [0, 0, 0, 1, 2, 3, 5][phase] * (def.rarity >= 5 ? 2 : def.rarity >= 3 ? 1.5 : 1);
    return { phase, gold: Math.round([0, 300, 700, 1300, 2200, 3400, 5000][phase] * f / 10) * 10, frag: 'frag' + tier, fragN: Math.max(1, Math.round(n * f)), cores: def.rarity >= 3 ? [0, 0, 0, 1, 1, 2, 3][phase] : 0, escama: Math.round(esc) };
  };
  F.ores = (h) => E.Life.data(h).ores;
  F.cores = (h) => (h.materials || {})[F.CORE] || 0;
  F.addCores = (h, n) => { if (n > 0) { h.materials = h.materials || {}; h.materials[F.CORE] = (h.materials[F.CORE] || 0) + n; } };
  F.norm = (entry) => {
    // armas da versão 3 (+1…+15) viram nível/ascensão equivalentes
    if (entry.lv) return entry;
    const def = E.C.weaponDef(entry);
    if (!def) return entry;
    const UP_OLD = { 1: 6, 3: 9, 4: 12, 5: 15 }[def.rarity] || 6;
    const lv = Math.max(1, Math.round((entry.up || 0) / UP_OLD * F.maxLv(def)));
    entry.lv = lv; entry.exp = 0; entry.asc = Math.max(0, F.CAPS.findIndex((c) => lv <= c)); entry.totalExp = 0;
    delete entry.up;
    return entry;
  };
  // simula ganhar EXP: devolve nível final, EXP sobrando e quanto foi usado (para no limite da ascensão)
  F.simulate = (entry, def, exp) => {
    let lv = entry.lv || 1, cur = entry.exp || 0, left = exp, used = 0;
    const cap = F.cap(entry, def);
    while (left > 0 && lv < cap) {
      const need = F.expNext(lv, def.rarity) - cur;
      if (left >= need) { left -= need; used += need; lv++; cur = 0; } else { cur += left; used += left; left = 0; }
    }
    return { lv, exp: lv >= cap ? 0 : cur, used, wasted: left };
  };
  F.expToCap = (entry, def) => { let s = -(entry.exp || 0); for (let l = entry.lv || 1; l < F.cap(entry, def); l++) s += F.expNext(l, def.rarity); return Math.max(0, s); };
  // sobe de nível com minérios {ferro, prata, cristal} e armas consumidas [uids]
  F.levelUp = (h, entry, ores = {}, fodder = []) => {
    const def = E.C.weaponDef(entry);
    F.norm(entry);
    let exp = 0;
    const have = F.ores(h);
    for (const [k, n] of Object.entries(ores)) { if (!F.ORE_EXP[k] || n <= 0) continue; if ((have[k] || 0) < n) return { error: 'Minérios insuficientes.' }; exp += F.ORE_EXP[k] * n; }
    const eat = fodder.map((uid) => E.Store.weapon(uid)).filter((w) => w && w.uid !== entry.uid && !E.G.isEquipped(w.uid) && !w.lock);
    for (const w of eat) exp += F.fodderExp(F.norm(w));
    if (!exp) return { error: 'Escolha minérios ou armas para usar.' };
    const sim = F.simulate(entry, def, exp);
    const gold = Math.ceil(sim.used * F.GOLD_PER_EXP);
    if (h.gold < gold) return { error: `Ouro insuficiente (${gold} po).` };
    h.gold -= gold;
    for (const [k, n] of Object.entries(ores)) if (F.ORE_EXP[k] && n > 0) { have[k] -= n; if (!have[k]) delete have[k]; }
    if (eat.length) E.state.weapons = E.state.weapons.filter((w) => !eat.includes(w));
    const from = entry.lv;
    entry.lv = sim.lv; entry.exp = sim.exp; entry.totalExp = (entry.totalExp || 0) + sim.used;
    entry.spent = (entry.spent || 0) + gold;
    if (E.Life) { E.Life.addXp(h, 'forja', 6 + Math.round(sim.used / 800)); E.Life.ev('craft'); }
    E.Store.save();
    return { from, lv: entry.lv, gold, wasted: sim.wasted };
  };
  F.ascCheck = (h, entry) => {
    const def = E.C.weaponDef(entry);
    F.norm(entry);
    const asc = entry.asc || 0;
    if (asc >= F.maxAsc(def)) return { max: true };
    if ((entry.lv || 1) < F.cap(entry, def)) return { notYet: true };
    const c = F.ascCost(def, asc + 1), fr = F.frags();
    const miss = [];
    if (h.gold < c.gold) miss.push(`${c.gold - h.gold} po`);
    if ((fr[c.frag] || 0) < c.fragN) miss.push(`${c.fragN - (fr[c.frag] || 0)}× ${F.FRAGS[c.frag].name}`);
    if (F.cores(h) < c.cores) miss.push(`${c.cores - F.cores(h)}× ${F.CORE}`);
    if (c.escama && E.Life.escamas() < c.escama) miss.push(`${c.escama - E.Life.escamas()}× Escama Iridescente`);
    return { cost: c, ok: !miss.length, miss };
  };
  F.ascend = (h, entry) => {
    const ck = F.ascCheck(h, entry);
    if (!ck.cost || !ck.ok) return null;
    const c = ck.cost, fr = F.frags();
    h.gold -= c.gold; fr[c.frag] -= c.fragN; if (!fr[c.frag]) delete fr[c.frag];
    if (c.cores) { h.materials[F.CORE] -= c.cores; if (!h.materials[F.CORE]) delete h.materials[F.CORE]; }
    if (c.escama) { fr.escama -= c.escama; if (!fr.escama) delete fr.escama; }
    entry.asc = (entry.asc || 0) + 1;
    entry.spent = (entry.spent || 0) + c.gold;
    if (E.Life) E.Life.addXp(h, 'forja', 25 + entry.asc * 10);
    E.Store.save();
    return { asc: entry.asc };
  };

  // ---------------- venda ----------------
  F.sellPrice = (entry) => {
    const def = E.C.weaponDef(entry);
    if (!def || def.rarity >= 5) return 0;
    const base = def.rarity === 4 ? 900 : def.rarity === 3 ? 250 : 0;
    return Math.max(1, base + Math.floor((entry.spent || 0) * (def.rarity === 1 ? 0.5 : 0.4)));
  };
  F.canSell = (entry) => {
    const def = E.C.weaponDef(entry);
    if (!def) return 'Arma desconhecida.';
    if (def.rarity >= 5) return 'Armas ★5 não são vendidas (use “Fundir excedentes” no Arsenal).';
    if (E.G.isEquipped(entry.uid)) return 'Desequipe a arma antes de vender.';
    if (entry.lock) return 'Esta arma está travada.';
    return null;
  };
  F.sell = (h, entry) => {
    if (F.canSell(entry)) return 0;
    const v = F.sellPrice(entry);
    E.state.weapons = E.state.weapons.filter((w) => w.uid !== entry.uid);
    h.gold += v;
    E.Store.save();
    return v;
  };

  // minérios na loja
  F.buyOre = (h, ore, n = 1) => {
    const p = F.ORE_PRICE[ore] * n;
    if (h.gold < p) return false;
    h.gold -= p;
    const o = F.ores(h); o[ore] = (o[ore] || 0) + n;
    E.Store.save();
    return true;
  };

  E.Forge = F;
})();
