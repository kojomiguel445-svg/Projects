/* Maravilhas: estado dos monumentos lidos e segredos, Pedras de Invocação, chefes invocados, estátuas despertadas e
   recompensas dos eventos do mundo. A parte 3D fica em gfx/wonders3d.js e as telas em ui/wonders.js. */
(() => {
  const U = E.U, LO = E.LORE;
  const W = {};
  W.STONE = { name: 'Pedra de Invocação', icon: '🔮' };
  W.data = () => {
    const s = E.state;
    if (!s.wonders) s.wonders = { read: {}, secrets: {}, chron: {}, stones: 2, summons: {}, beaten: {}, statues: {}, events: 0, eventLog: [] };
    return s.wonders;
  };
  W.stones = () => W.data().stones;
  W.addStones = (n) => { W.data().stones = Math.max(0, W.data().stones + n); };

  // ------------------------------------------------ chefes invocáveis: variantes com título próprio (mesmas estatísticas)
  for (const [reg, s] of Object.entries(LO.SUMMONS)) {
    const base = E.M.MONSTERS[s.base];
    if (!base) continue;
    const key = 'inv_' + reg;
    E.M.MONSTERS[key] = Object.assign({}, base, { title: s.title, boss: true, summon: true, lvl: s.rec, bossColor: s.color, region: reg, escort: s.escort,
      scale: (base.scale || 1) * 1.15, pal: s.pal || base.pal, desc: s.lore });
    s.key = key;
  }

  // ------------------------------------------------ monumentos
  const mk = (reg, i) => `${reg}:${i}`;
  W.monuments = (reg) => LO.MONUMENTS[reg] || [];
  W.isRead = (reg, i) => !!W.data().read[mk(reg, i)];
  W.hasSecret = (reg, i) => !!W.data().secrets[mk(reg, i)];
  W.readCount = (reg) => W.monuments(reg).filter((_, i) => W.isRead(reg, i)).length;
  // primeira leitura: gemas, uma Pedra de Invocação e EXP de Aventura; os três da região completam a Crônica
  W.read = (reg, i) => {
    const d = W.data();
    if (d.read[mk(reg, i)]) return null;
    d.read[mk(reg, i)] = Date.now();
    const out = { gems: 40, stones: 1, adv: 60 };
    E.state.gems += out.gems; W.addStones(1);
    if (W.readCount(reg) === W.monuments(reg).length && !d.chron[reg]) { d.chron[reg] = Date.now(); out.chronicle = true; out.gems += 150; E.state.gems += 150; W.addStones(1); out.stones++; }
    E.Store.save();
    return out;
  };
  W.foundSecret = (reg, i) => { const d = W.data(); if (d.secrets[mk(reg, i)]) return null; d.secrets[mk(reg, i)] = Date.now(); E.state.gems += 60; E.Store.save(); return { gems: 60 }; };
  W.totals = () => { let read = 0, all = 0, sec = 0; for (const reg of Object.keys(LO.MONUMENTS)) LO.MONUMENTS[reg].forEach((_, i) => { all++; if (W.isRead(reg, i)) read++; if (W.hasSecret(reg, i)) sec++; }); return { read, all, sec }; };

  // ------------------------------------------------ altar de invocação
  W.summon = (reg) => LO.SUMMONS[reg] || null;
  W.cooldown = (reg) => Math.max(0, (W.data().summons[reg] || 0) + LO.COOLDOWN - Date.now());
  W.canSummon = (reg) => !!W.summon(reg) && W.stones() > 0 && W.cooldown(reg) === 0;
  W.useStone = (reg) => { if (!W.canSummon(reg)) return false; W.addStones(-1); E.Store.save(); return true; };
  // recompensa extra pela vitória (além do ouro e das gemas normais do combate)
  W.summonReward = (reg) => {
    const s = W.summon(reg), def = E.M.MONSTERS[s.key], d = W.data(), h = E.Store.hero();
    const first = !d.beaten[reg];
    d.beaten[reg] = (d.beaten[reg] || 0) + 1;
    d.summons[reg] = Date.now();
    const cr = def.cr, tier = cr < 2 ? 1 : cr < 5 ? 2 : cr < 8 ? 3 : 4;
    const r = { gems: Math.round(80 + cr * 30), frags: { ['frag' + tier]: 3 }, cores: cr >= 6 ? 2 : 1, arrow: U.rand() < 0.12 ? 1 : 0, first };
    if (tier < 4) r.frags['frag' + (tier + 1)] = 1;
    if (first) { r.gems += 300; r.stones = 1; }
    E.state.gems += r.gems;
    for (const [k, n] of Object.entries(r.frags)) E.Forge.addFrag(k, n);
    E.Forge.addCores(h, r.cores);
    if (r.arrow && E.Eco) E.Eco.addArrow(r.arrow);
    if (r.stones) W.addStones(r.stones);
    E.Store.save();
    return r;
  };

  // ------------------------------------------------ estátuas de teleporte espalhadas pela região
  W.statueOn = (reg, i) => !!(W.data().statues[reg] || {})[i];
  W.wakeStatue = (reg, i) => { const d = W.data(); d.statues[reg] = d.statues[reg] || {}; if (d.statues[reg][i]) return false; d.statues[reg][i] = Date.now(); E.state.gems += 20; E.Store.save(); return true; };

  // ------------------------------------------------ eventos: recompensas
  W.eventReward = (id, lvl) => {
    const ev = LO.EVENTS[id], d = W.data(), h = E.Store.hero();
    d.events++;
    d.eventLog.unshift({ id, t: Date.now() }); d.eventLog = d.eventLog.slice(0, 20);
    const r = { gems: 50, stones: 1, gold: 0, frags: {} };
    if (id === 'tesouro' || id === 'caravana') r.gold = 80 + lvl * 45;
    if (id === 'fenda' || id === 'meteoros') r.frags[lvl >= 8 ? 'frag3' : lvl >= 5 ? 'frag2' : 'frag1'] = 2;
    if (id === 'vigilia') r.gems += 30;
    E.state.gems += r.gems; W.addStones(r.stones);
    if (r.gold && h) h.gold += r.gold;
    for (const [k, n] of Object.entries(r.frags)) E.Forge.addFrag(k, n);
    if (E.Adv) E.Adv.add(80, 'evento');
    E.Store.save();
    void ev;
    return r;
  };
  E.WON = W;
})();
