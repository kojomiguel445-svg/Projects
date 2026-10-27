/* Motor da "vida" em Elarion: ofícios, comércio, pesca, mineração, receitas, buffs, diárias, contratos e conquistas. */
(() => {
  const U = E.U;
  const LF = {};
  const L = () => E.L;

  // ------------------------------------------------------------ estado
  LF.data = (h) => {
    if (!h) return null;
    const d = h.life = h.life || {};
    d.xp = d.xp || {}; d.cargo = d.cargo || {}; d.cost = d.cost || {}; d.dex = d.dex || {}; d.fish = d.fish || {};
    d.ores = d.ores || {}; d.buffs = d.buffs || {}; d.ach = d.ach || {};
    d.rod = d.rod || 0; d.cart = d.cart || 0; d.chips = d.chips || 0; d.bait = d.bait || 0; d.lbait = d.lbait || 0; d.pick = d.pick || 0; d.fishPts = d.fishPts || 0;
    d.pbait = Number.isSafeInteger(d.pbait)&&d.pbait>0?d.pbait:0; d.sbait = Number.isSafeInteger(d.sbait)&&d.sbait>0?d.sbait:0;
    d.aqua = d.aqua || {}; d.aquaDone = d.aquaDone || {}; d.legends = d.legends || {};
    d.stats = Object.assign({ fishCaught: 0, fish5: 0, dexCount: 0, profit: 0, broke: 0, jackpots: 0, blackjacks: 0, bounties: 0, cooked: 0, mined: 0, arenaWins: [], legend: 0, oreSold: 0 }, d.stats || {});
    return d;
  };
  const hero = () => E.Store.hero();

  // ------------------------------------------------------------ ofícios
  LF.level = (h, p) => {
    const x = (LF.data(h).xp[p] || 0);
    let lv = 1;
    while (lv < L().MAX_PROF && x >= L().profXpFor(lv)) lv++;
    return lv;
  };
  LF.progress = (h, p) => {
    const lv = LF.level(h, p), x = LF.data(h).xp[p] || 0;
    if (lv >= L().MAX_PROF) return { lv, pct: 100, cur: x, next: x };
    const a = lv > 1 ? L().profXpFor(lv - 1) : 0, b = L().profXpFor(lv);
    return { lv, pct: Math.round((x - a) / (b - a) * 100), cur: x - a, next: b - a };
  };
  LF.addXp = (h, p, n) => {
    const d = LF.data(h), before = LF.level(h, p);
    d.xp[p] = (d.xp[p] || 0) + n;
    const after = LF.level(h, p);
    if (after > before) {
      const pr = L().PROFS[p];
      const gems = 40 * after;
      E.state.gems += gems;
      E.UI.toast(`${pr.icon} ${pr.name} nível ${after}! +${gems} 💎`, 'gold big');
      E.Audio.sfx('levelup');
      const t = LF.titleFor(p, after);
      if (t && [3, 6, 10].includes(after)) E.UI.toast(`Novo título: “${t}”`, 'gold');
      LF.checkAch(h);
    }
    E.Store.save();
  };
  LF.titleFor = (p, lv) => { const t = L().PROFS[p].titles; return lv >= 10 ? t[3] : lv >= 6 ? t[2] : lv >= 3 ? t[1] : t[0]; };
  LF.titles = (h) => Object.keys(L().PROFS).filter((p) => (LF.data(h).xp[p] || 0) > 0).map((p) => ({ p, t: LF.titleFor(p, LF.level(h, p)), lv: LF.level(h, p) }));
  LF.title = (h) => { const d = LF.data(h); return d.title || null; };

  // ------------------------------------------------------------ eventos (diárias, contratos, conquistas)
  LF.ev = (name, n = 1, extra) => {
    if (E.Chains) E.Chains.ev(name, n, extra);
    LF.ensureDaily();
    const dl = E.state.daily;
    for (const t of dl.tasks) { const def = L().DAILY_POOL.find((x) => x.id === t.id); if (def && def.ev === name && t.p < def.n) { t.p = Math.min(def.n, t.p + n); if (t.p >= def.n) E.UI.toast(`✔ Diária concluída: ${def.text}`, 'gold'); } }
    U.emit('life:changed');
  };
  const dayKey = () => { if (E.Sim) return `1-1-${E.Sim.clock().day}`; const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  LF.ensureDaily = () => {
    const k = dayKey();
    if (E.state.daily && E.state.daily.day === k) return E.state.daily;
    const rng = U.seeded(k.split('-').reduce((a, b) => a * 31 + Number(b), 7) + Number(E.state.uid.slice(-4)));
    const pool = L().DAILY_POOL.slice();
    const tasks = [];
    while (tasks.length < 4) { const i = Math.floor(rng() * pool.length); tasks.push({ id: pool.splice(i, 1)[0].id, p: 0, claimed: false }); }
    E.state.daily = { day: k, tasks, bonus: false };
    return E.state.daily;
  };
  LF.claimDaily = (i) => {
    const dl = LF.ensureDaily(), t = dl.tasks[i], def = L().DAILY_POOL.find((x) => x.id === t.id);
    if (!def || t.claimed || t.p < def.n) return false;
    t.claimed = true; E.state.gems += L().DAILY_GEMS;
    E.UI.loot('💎', `${L().DAILY_GEMS} Gemas Estelares`);
    if (E.Adv) E.Adv.add(E.Adv.XP.commission, 'commission');
    if (!dl.bonus && dl.tasks.every((x) => x.claimed)) { dl.bonus = true; E.state.gems += L().DAILY_BONUS; E.state.seals += 1; if (E.Adv) E.Adv.add(E.Adv.XP.commissionBonus, 'commission'); E.UI.toast(`✦ Todas as diárias! +${L().DAILY_BONUS} 💎 e 1 Selo 🌟`, 'gold big'); }
    E.Store.save();
    return true;
  };

  // ------------------------------------------------------------ Guilda: contratos de caça
  LF.ensureGuild = () => {
    const k = dayKey();
    const g = E.state.guild = E.state.guild || { rep: 0, done: 0, active: [] };
    if (g.day === k) return g;
    g.day = k;
    const rng = U.seeded(k.split('-').reduce((a, b) => a * 37 + Number(b), 11));
    const h = hero(); const lvl = h ? h.level : 1;
    const regs = Object.entries(E.WD.REGIONS).filter(([id, r]) => E.M.BY_REGION[id] && !r.metro && r.level <= lvl + 2);
    const board = [];
    for (let i = 0, tries = 0; board.length < 5 && regs.length && tries < 40; tries++) {
      const [rid] = regs[Math.floor(rng() * regs.length)];
      const pool = E.M.BY_REGION[rid].filter((m) => E.M.MONSTERS[m].cr <= Math.max(0.5, lvl * 0.75));
      const mon = pool.length ? pool[Math.floor(rng() * pool.length)] : E.M.BY_REGION[rid][0];
      const cr = E.M.MONSTERS[mon].cr, n = cr >= 2 ? 1 : cr >= 1 ? 2 : 3;
      if (board.some((b) => b.mon === mon && b.region === rid)) continue;
      board.push({ id: `${k}-${i++}`, mon, region: rid, n, p: 0, gold: Math.round(40 + 60 * n * Math.max(0.25, cr)), rep: 10 + Math.round(cr * 8), state: 'open' });
    }
    // caçada especial: chefe de covil
    const lairs = Object.entries(E.M.LAIR).filter(([, key]) => (E.M.MONSTERS[key].lvl || 1) <= lvl + 1);
    if (lairs.length) { const [rid, key] = lairs[Math.floor(rng() * lairs.length)]; board.push({ id: `${k}-boss`, mon: key, region: rid, n: 1, p: 0, gold: Math.round(200 + 120 * E.M.MONSTERS[key].cr), rep: 60, state: 'open', boss: true }); }
    g.board = board; g.active = [];
    return g;
  };
  LF.acceptContract = (id) => { const g = LF.ensureGuild(); const c = g.board.find((x) => x.id === id); if (!c || c.state !== 'open') return false; if (g.board.filter((x) => x.state === 'active').length >= 3) { E.UI.toast('Máximo de 3 contratos ativos.'); return false; } c.state = 'active'; E.Store.save(); return true; };
  LF.turnInContract = (id) => {
    const g = LF.ensureGuild(), h = hero(); const c = g.board.find((x) => x.id === id);
    if (!c || c.state !== 'active' || c.p < c.n) return null;
    c.state = 'done';
    const mult = 1 + LF.level(h, 'cacador') * 0.06;
    const gold = Math.round(c.gold * mult);
    h.gold += gold; g.rep += c.rep; g.done++;
    LF.data(h).stats.bounties++;
    LF.addXp(h, 'cacador', 25 + c.rep);
    LF.ev('bounty');
    LF.checkAch(h);
    E.Store.save();
    return { gold, rep: c.rep };
  };
  LF.guildRank = (rep) => { const ranks = [['F', 0], ['E', 50], ['D', 150], ['C', 350], ['B', 700], ['A', 1200], ['S', 2000]]; let r = ranks[0]; for (const x of ranks) if (rep >= x[1]) r = x; const nx = ranks[ranks.indexOf(r) + 1]; return { rank: r[0], next: nx ? nx[1] : null, cur: r[1] }; };
  LF.onKill = (keys, region) => {
    const g = E.state.guild; if (!g || !g.board) return;
    for (const c of g.board) {
      if (c.state !== 'active' || c.region !== region) continue;
      const n = keys.filter((k) => k === c.mon).length;
      if (n) { c.p = Math.min(c.n, c.p + n); E.UI.toast(`🎯 Contrato: ${E.M.MONSTERS[c.mon].name} ${c.p}/${c.n}`); }
    }
  };

  // ------------------------------------------------------------ comércio
  const period = () => Math.floor(Date.now() / (30 * 60 * 1000)); // preços mudam a cada 30 minutos
  LF.regionMult = (g, rid) => { const G = L().GOODS[g]; if (G.prod === rid) return 0.6; if (G.want.includes(rid)) return 1.55; return rid === 'aurenna' ? 1.12 : 1.0; };
  LF.price = (g, rid, per = period()) => {
    const G = L().GOODS[g];
    const seed = [...(g + rid)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) + per * 977;
    const r = U.seeded(seed)(); const r2 = U.seeded(seed + 13)();
    const drift = 0.82 + r * 0.4 + (r2 > 0.93 ? 0.35 : 0) - (r2 < 0.05 ? 0.25 : 0); // às vezes um "evento" de preço
    return Math.max(1, Math.round(G.base * LF.regionMult(g, rid) * drift));
  };
  LF.trend = (g, rid) => Math.sign(LF.price(g, rid) - LF.price(g, rid, period() - 1));
  LF.buyPrice = (h, g, rid) => Math.max(1, Math.round(LF.price(g, rid) * 1.06 * (1 - LF.level(h, 'comercio') * 0.015)));
  LF.sellPrice = (h, g, rid) => Math.max(1, Math.round(LF.price(g, rid) * 0.94 * (1 + LF.level(h, 'comercio') * 0.015)));
  LF.cargoCount = (h) => Object.values(LF.data(h).cargo).reduce((a, b) => a + b, 0);
  LF.cap = (h) => L().CARTS[LF.data(h).cart].cap + (LF.level(h, 'comercio') - 1) * 2;
  LF.buy = (h, g, n, rid) => {
    const d = LF.data(h), p = LF.buyPrice(h, g, rid), cost = p * n;
    if (h.gold < cost) return 'Ouro insuficiente.';
    if (LF.cargoCount(h) + n > LF.cap(h)) return 'Sua carga está cheia. Compre uma carroça maior na Bolsa de Aurenna.';
    const have = d.cargo[g] || 0;
    d.cost[g] = Math.round(((d.cost[g] || 0) * have + cost) / (have + n));
    d.cargo[g] = have + n; h.gold -= cost;
    LF.addXp(h, 'comercio', Math.ceil(n * 1.5));
    E.Store.save();
    return null;
  };
  LF.sell = (h, g, n, rid) => {
    const d = LF.data(h); if ((d.cargo[g] || 0) < n) return 'Você não tem isso.';
    const p = LF.sellPrice(h, g, rid), gain = p * n, basis = (d.cost[g] || 0) * n;
    d.cargo[g] -= n; if (!d.cargo[g]) { delete d.cargo[g]; delete d.cost[g]; }
    h.gold += gain;
    const profit = gain - basis;
    if (profit > 0) { d.stats.profit += profit; LF.addXp(h, 'comercio', Math.ceil(profit / 12) + n); LF.ev('profit', 1, { amount: profit }); }
    LF.checkAch(h);
    E.Store.save();
    return { gain, profit };
  };
  // banca em Aurenna: vende sozinha com o tempo (1 unidade a cada 3 minutos, até 8 horas acumuladas)
  LF.stallTick = (h) => {
    const d = LF.data(h), st = d.stall; if (!st) return 0;
    const now = Date.now(); const steps = Math.floor(Math.min(8 * 3600e3, now - st.t) / (3 * 60e3));
    if (steps <= 0) return 0;
    st.t += steps * 3 * 60e3;
    let sold = 0;
    for (let i = 0; i < steps; i++) {
      const g = Object.keys(st.goods).find((k) => st.goods[k] > 0); if (!g) break;
      st.goods[g]--; if (!st.goods[g]) delete st.goods[g];
      const v = Math.round(LF.price(g, 'aurenna') * 1.1); st.earned += v; sold += v;
      const basis = (st.cost && st.cost[g]) || 0; if (v > basis) d.stats.profit += v - basis;
    }
    if (!Object.keys(st.goods).length) st.t = now;
    return sold;
  };

  // ------------------------------------------------------------ pesca
  LF.isNight = () => { if (E.Sim) return E.Sim.clock().night; const hr = new Date().getHours(); return hr >= 19 || hr < 6; };
  LF.timeOk = (f) => !f.when || (f.when === 'noite' ? LF.isNight() : !LF.isNight());
  LF.activeBait=(h,biome)=>{const d=LF.data(h);return biome==='sea'&&d.sbait>0?{key:'sbait',bonus:.65,name:'Isca de Corrente Profunda'}:d.pbait>0?{key:'pbait',bonus:.35,name:'Isca Luminescente'}:d.bait>0?{key:'bait',bonus:.20,name:'Isca de Minhoca'}:null;};
  LF.spendBait=(h,key)=>{const d=LF.data(h);if(!['bait','pbait','sbait'].includes(key)||!(d[key]>0))return false;d[key]--;E.Store.save();return true;};
  const fishingPrice=(r,n)=>E.Settlements&&E.Settlements.price?E.Settlements.price(r,n):Math.ceil(n*((E.WD&&E.WD.REGIONS[r]||{}).metro?1.65:1));
  LF.rodPrice=(tier,r)=>{const def=L().RODS[tier];return def&&def.retail?fishingPrice(r,def.retail):0;};
  LF.buyRod=(h,tier,r)=>{const d=LF.data(h),def=L().RODS[tier],price=LF.rodPrice(tier,r);if(!Number.isSafeInteger(tier)||tier!==d.rod+1||!def||!price)return {ok:false,message:'Compre a próxima vara; a vara de Dendê continua exclusiva da missão.'};if(!Number.isFinite(h.gold)||h.gold<price)return {ok:false,message:`A vara custa ${price} po.`};h.gold-=price;d.rod=tier;E.Store.save();return {ok:true,message:`${def.name} comprada e equipada.`,cost:price};};
  LF.buyBait=(h,id,packs=1,r)=>{const def=L().BAITS[id],d=LF.data(h);if(!def||!def.price||!Number.isSafeInteger(packs)||packs<1||packs>100)return {ok:false,message:'Escolha lotes inteiros de iscas disponíveis.'};const cost=fishingPrice(r,def.price)*packs,n=(def.pack||5)*packs;if(!Number.isFinite(h.gold)||h.gold<cost)return {ok:false,message:`As iscas custam ${cost} po.`};h.gold-=cost;d[def.key]=(d[def.key]||0)+n;E.Store.save();return {ok:true,message:`${def.name} ×${n} guardada(s).`,cost,quantity:n};};
  LF.baitPrice=(id,r)=>{const def=L().BAITS[id];return def&&def.price?fishingPrice(r,def.price):0;};
  LF.rollCatch = (h, biome, region) => {
    const d = LF.data(h), bait=LF.activeBait(h,biome), finish=res=>Object.assign(res,{baitKey:bait&&bait.key});
    const list = (L().FISH_BY_BIOME[biome] || L().FISH_BY_BIOME.forest).filter((f) => LF.timeOk(f)&&(!f.minRod||d.rod>=f.minRod));
    // peixes que só existem nesta região: o raro (★4) e o lendário (precisa da hora certa e de vara melhor ou Isca Lendária)
    const reg = region && L().FISH_REGION[region];
    if (reg) {
      const legend = reg.find((f) => f.legend), rare = reg.find((f) => !f.legend);
      const cm = (f) => Math.round(f.min + Math.pow(U.rand(), 1.4) * (f.max - f.min));
      if (legend && LF.timeOk(legend) && (d.rod >= 1 || d.lbait > 0)) {
        let ch = 0.012 * (1 + d.rod * 0.6 + LF.level(h, 'pesca') * 0.08) + (LF.buff(h, 'pescador') ? 0.01 : 0);
        if (d.lbait > 0) ch = Math.max(ch, 0.3);
        if (U.rand() < ch) return finish({ fish: legend, cm: cm(legend), usedLB: d.lbait > 0 });
      }
      if (rare && LF.timeOk(rare) && U.rand() < 0.05 * (1 + d.rod * 0.25 + (d.bait > 0 ? 0.3 : 0))) return finish({ fish: rare, cm: cm(rare) });
    }
    if (U.rand() < 0.07) { // lixo / tesouro
      const tot = L().JUNK.reduce((a, j) => a + j.w, 0); let r = U.rand() * tot;
      for (const j of L().JUNK) { r -= j.w; if (r <= 0) return finish({ junk: j }); }
    }
    const rare = LF.level(h, 'pesca') * 0.04 + d.rod * 0.08 + (LF.buff(h, 'pescador') ? 0.35 : 0) + (bait ? bait.bonus : 0);
    const w = { 1: 58, 2: 26, 3: 11 * (1 + rare), 4: 4 * (1 + rare * 1.5), 5: 1 * (1 + rare * 2) };
    const tot = list.reduce((a, f) => a + w[f.r], 0); let r = U.rand() * tot;
    let fish = list[0];
    for (const f of list) { r -= w[f.r]; if (r <= 0) { fish = f; break; } }
    const cm = Math.round(fish.min + Math.pow(U.rand(), 1.6) * (fish.max - fish.min));
    return finish({ fish, cm });
  };
  LF.landCatch = (h, res) => {
    const d = LF.data(h);
    if(!res||res.landed)return false;res.landed=true;
    if(Object.prototype.hasOwnProperty.call(res,'baitKey')){if(res.baitKey&&d[res.baitKey]>0)d[res.baitKey]--;}else if(d.bait>0)d.bait--;
    if (res.junk) {
      const j = res.junk;
      if (j.gems) { E.state.gems += j.gems; E.UI.loot('💎', `${j.gems} Gemas (da garrafa)`); }
      if (j.gold) { const g = j.gold[0] + Math.floor(U.rand() * (j.gold[1] - j.gold[0])); h.gold += g; E.UI.loot('🪙', `${g} po`); }
      LF.addXp(h, 'pesca', 4);
      E.Store.save();
      return;
    }
    const f = res.fish;
    if (res.usedLB && d.lbait > 0) d.lbait--;
    if (f.legend && !d.legends[f.id]) { d.legends[f.id] = Date.now(); d.stats.legend++; E.UI.toast(`✦ PEIXE LENDÁRIO: ${f.name}!`, 'gold big'); }
    d.fish[f.id] = (d.fish[f.id] || 0) + 1;
    const first = !d.dex[f.id];
    d.dex[f.id] = Math.max(d.dex[f.id] || 0, res.cm);
    d.stats.fishCaught++; if (f.r >= 5) d.stats.fish5++;
    d.stats.dexCount = Object.keys(d.dex).length;
    LF.addXp(h, 'pesca', 6 + f.r * f.r * 3 + (first ? 10 : 0));
    if (first) E.UI.toast(`📖 Novo registro no Pescadex: ${f.name}!`, 'gold');
    LF.ev('fish', 1, { fish: f, region: E.WG.world && E.WG.world.id });
    LF.checkAch(h);
    E.Store.save();
  };

  // ------------------------------------------------------------ Aquário de Elarion
  LF.aquaTank = (rid) => L().AQUARIUM[rid] || [];
  LF.donate = (h, id) => {
    const d = LF.data(h);
    if (d.aqua[id]) return 'Esse peixe já está no Aquário.';
    if (!(d.fish[id] > 0)) return 'Você não tem esse peixe.';
    d.fish[id]--; if (!d.fish[id]) delete d.fish[id];
    d.aqua[id] = d.dex[id] || 1;
    const done = [];
    for (const [rid, list] of Object.entries(L().AQUARIUM)) {
      if (d.aquaDone[rid] || !list.every((x) => d.aqua[x])) continue;
      d.aquaDone[rid] = Date.now(); done.push(rid);
      const r = L().AQUA_REWARD;
      E.state.gems += r.gems; h.gold += r.gold; LF.addEscama(r.escama);
    }
    LF.addXp(h, 'pesca', 15);
    LF.checkAch(h);
    E.Store.save();
    return { done };
  };
  LF.aquaCount = (h) => Object.keys(LF.data(h).aqua).length;
  // Escama Iridescente: material de ascensão (fases 3 a 6) dado pelo Mestre Dendê
  LF.escamas = () => ((E.state.materials || {}).escama || 0);
  LF.addEscama = (n) => { if (n > 0) { E.state.materials = E.state.materials || {}; E.state.materials.escama = (E.state.materials.escama || 0) + n; } };
  // vale de pesca: trocar peixes com o Mestre Dendê
  LF.fishPoints = (f) => Math.max(1, Math.round(f.price / 8) + (f.r >= 4 ? f.r * 4 : 0));
  LF.tradeFish = (h, id, n = 1) => {
    const d = LF.data(h), f = L().FISH[id];
    if (!f || (d.fish[id] || 0) < n) return 0;
    d.fish[id] -= n; if (!d.fish[id]) delete d.fish[id];
    const pts = LF.fishPoints(f) * n;
    d.fishPts += pts;
    E.Store.save();
    return pts;
  };
  LF.fishValue = (id) => { const f = L().FISH[id]; return f ? f.price : 0; };
  LF.sellFish = (h, id, n) => { const d = LF.data(h); if (!Object.prototype.hasOwnProperty.call(L().FISH,id)||!Number.isSafeInteger(n)||n<1||!Number.isFinite(h.gold)||(d.fish[id] || 0) < n) return 0; d.fish[id] -= n; if (!d.fish[id]) delete d.fish[id]; const g = LF.fishValue(id) * n; h.gold += g; E.Store.save(); return g; };

  // ------------------------------------------------------------ mineração e coleta
  LF.pickFor = (ore) => (L().ORES[ore] || {}).pick || 1;
  LF.canMine = (h, ore) => { const d = LF.data(h), need = LF.pickFor(ore); if (!d.pick) return 'Você precisa de uma picareta. Compre uma com um ferreiro.'; if (d.pick < need) return `Precisa da ${L().PICKAXES[need].name} para minerar ${L().ORES[ore].name}.`; return null; };
  LF.mine = (h, biome, node) => {
    const d = LF.data(h), lv = LF.level(h, 'mineracao');
    if (node) { const why = LF.canMine(h, node.ore); if (why) return { error: why }; }
    const pool = node ? [node.ore, ...(L().ORE_BY_BIOME[biome] || []).filter((o) => o !== node.ore && LF.pickFor(o) <= d.pick)] : L().ORE_BY_BIOME[biome] || ['ferro'];
    const got = {};
    const pick = () => { const r = U.rand(); return pool[Math.min(pool.length - 1, Math.floor(Math.pow(r, 1.6) * pool.length))]; };
    const n = 1 + (U.rand() < lv * 0.08 ? 1 : 0) + (U.rand() < 0.25 ? 1 : 0);
    for (let i = 0; i < n; i++) { const o = pick(); got[o] = (got[o] || 0) + 1; d.ores[o] = (d.ores[o] || 0) + 1; }
    let gem = 0; if (U.rand() < 0.04 + lv * 0.03) { gem = 15 + Math.floor(U.rand() * 25); E.state.gems += gem; }
    d.stats.mined++;
    LF.addXp(h, 'mineracao', 10 + n * 4);
    LF.ev('ore');
    LF.checkAch(h);
    E.Store.save();
    return { got, gem };
  };
  // o ferreiro compra minérios
  LF.orePrice = (h, ore) => Math.max(1, Math.round(L().ORES[ore].price * (1 + LF.level(h, 'comercio') * 0.015)));
  LF.sellOre = (h, ore, n = 1) => {
    const d = LF.data(h);
    if ((d.ores[ore] || 0) < n) return 0;
    d.ores[ore] -= n; if (!d.ores[ore]) delete d.ores[ore];
    const g = LF.orePrice(h, ore) * n;
    h.gold += g; d.stats.oreSold += n;
    LF.addXp(h, 'comercio', Math.ceil(n / 2));
    LF.ev('oreSold', n);
    E.Store.save();
    return g;
  };
  LF.buyPick = (h, tier) => {
    const d = LF.data(h), pk = L().PICKAXES[tier];
    if (!pk || d.pick >= tier) return 'Você já tem essa picareta (ou uma melhor).';
    if (tier !== d.pick + 1) return 'Compre as picaretas em ordem.';
    if (h.gold < pk.gold) return 'Ouro insuficiente.';
    for (const [o, n] of Object.entries(pk.ore || {})) if ((d.ores[o] || 0) < n) return `Faltam ${n - (d.ores[o] || 0)} ${L().ORES[o].name}.`;
    h.gold -= pk.gold; for (const [o, n] of Object.entries(pk.ore || {})) { d.ores[o] -= n; if (!d.ores[o]) delete d.ores[o]; }
    d.pick = tier;
    LF.ev('pick', 1);
    E.Store.save();
    return null;
  };
  LF.onHerb = (h) => {
    LF.addXp(h, 'coleta', 8);
    LF.ev('herb');
    if (U.rand() < LF.level(h, 'coleta') * 0.08) return 1; // colheita dupla
    return 0;
  };

  // ------------------------------------------------------------ receitas
  const isHerb = (k) => Object.values(E.WD.REGIONS).some((r) => r.herb === k);
  LF.have = (h, key) => {
    const d = LF.data(h);
    if (key === 'fish') return Object.values(d.fish).reduce((a, b) => a + b, 0);
    if (key === 'fishR') return Object.entries(d.fish).filter(([id]) => (L().FISH[id] || {}).r >= 3).reduce((a, [, b]) => a + b, 0);
    if (key === 'herb') return Object.entries(h.materials || {}).filter(([k]) => isHerb(k)).reduce((a, [, b]) => a + b, 0);
    if (key.startsWith('ore:')) return d.ores[key.slice(4)] || 0;
    return (h.materials || {})[key] || 0;
  };
  LF.keyName = (key) => key === 'fish' ? 'Peixe (qualquer)' : key === 'fishR' ? 'Peixe ★3 ou mais' : key === 'herb' ? 'Erva (qualquer)' : key.startsWith('ore:') ? L().ORES[key.slice(4)].name : key;
  LF.canCraft = (h, r) => h.gold >= (r.gold || 0) && Object.entries(r.need).every(([k, n]) => LF.have(h, k) >= n);
  const consume = (h, key, n) => {
    const d = LF.data(h);
    const take = (obj, ids) => { for (const id of ids) { while (n > 0 && obj[id] > 0) { obj[id]--; n--; if (!obj[id]) delete obj[id]; } } };
    if (key === 'fish' || key === 'fishR') { const ids = Object.keys(d.fish).filter((id) => key === 'fish' || (L().FISH[id] || {}).r >= 3).sort((a, b) => LF.fishValue(a) - LF.fishValue(b)); take(d.fish, ids); }
    else if (key === 'herb') take(h.materials, Object.keys(h.materials).filter(isHerb));
    else if (key.startsWith('ore:')) take(d.ores, [key.slice(4)]);
    else take(h.materials, [key]);
  };
  LF.craft = (h, kind, r) => {
    if (!LF.canCraft(h, r)) return null;
    const prof = kind === 'cozinha' ? 'culinaria' : kind;
    const save = kind === 'forja' && U.rand() < LF.level(h, 'forja') * 0.05;
    if (!save) for (const [k, n] of Object.entries(r.need)) consume(h, k, n);
    h.gold -= r.gold || 0;
    const d = LF.data(h), out = { name: r.name, icon: r.icon };
    if (kind === 'cozinha' && E.Sim) { E.Sim.feed(h, 25); out.hunger = 25; }
    if (r.buff) {
      const mins = r.mins * (1 + LF.level(h, 'culinaria') * 0.1);
      d.buffs[r.buff] = Math.max(Date.now(), d.buffs[r.buff] || 0) + mins * 60e3;
      d.stats.cooked++; LF.ev('cook'); out.buff = r.buff; out.mins = Math.round(mins);
    }
    if (r.item) { const extra = U.rand() < LF.level(h, 'alquimia') * 0.06 ? 1 : 0; h.inventory[r.item] = (h.inventory[r.item] || 0) + r.n + extra; out.n = r.n + extra; LF.ev('craft'); }
    if (r.good) { d.cargo[r.good] = (d.cargo[r.good] || 0) + r.n; out.n = r.n; LF.ev('craft'); }
    if (r.special === 'refine') {
      const eq = E.C.equipped(h, E.SP.heroWeaponType(h) === 'catalisador' ? 'focus' : 'weapon');
      if (eq && eq.def.rarity >= 3 && eq.def.rarity <= 4 && eq.entry.refine < 5) { eq.entry.refine++; out.refined = `${eq.def.name} agora é R${eq.entry.refine}!`; }
      else { d.refineStones = (d.refineStones || 0) + 1; out.refined = 'Nenhuma arma ★3/★4 equipada (ou já em R5): a essência foi guardada.'; }
      LF.ev('craft');
    }
    if (save) out.saved = true;
    LF.addXp(h, prof, 18 + Object.values(r.need).reduce((a, b) => a + b, 0) * 4);
    LF.checkAch(h);
    E.Store.save();
    return out;
  };
  LF.buff = (h, id) => { const d = LF.data(h); return (d.buffs[id] || 0) > Date.now(); };
  LF.activeBuffs = (h) => Object.entries(LF.data(h).buffs).filter(([, t]) => t > Date.now()).map(([id, t]) => ({ id, left: Math.ceil((t - Date.now()) / 60e3) }));

  // ------------------------------------------------------------ morte: perde parte da carga
  LF.onDeath = (h, out) => {
    const d = LF.data(h);
    for (const [g, n] of Object.entries(d.cargo)) { const lost = Math.ceil(n / 3); d.cargo[g] = n - lost; if (!d.cargo[g]) delete d.cargo[g]; out.items.push({ name: L().GOODS[g].name, n: lost }); }
    for (const [id, n] of Object.entries(d.fish)) { const lost = Math.ceil(n / 3); d.fish[id] = n - lost; if (!d.fish[id]) delete d.fish[id]; if (lost) out.items.push({ name: (L().FISH[id] || {}).name || id, n: lost }); }
  };

  // ------------------------------------------------------------ conquistas
  LF.checkAch = (h) => {
    const d = LF.data(h);
    for (const a of L().ACHIEVEMENTS) {
      if (d.ach[a.id]) continue;
      let ok = false;
      try { ok = a.test(d.stats, L(), E.state.stats || {}, h); } catch (e) { ok = false; }
      if (ok) { d.ach[a.id] = Date.now(); E.state.gems += a.gems; E.UI.toast(`🏆 Conquista: ${a.name}! +${a.gems} 💎`, 'gold big'); }
    }
  };

  E.Life = LF;
})();
