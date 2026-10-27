/* Ecos — posse, Sincronia, equipar, bônus no motor de regras e Invocação (gacha com garantia). */
(() => {
  const U = E.U, EC = E.ECO;
  const EV = {};
  const st = () => { const s = E.state; s.ecos = s.ecos || {}; s.pity.eco = s.pity.eco || { p5: 0, p4: 0, g5: false }; return s; };
  EV.owned = (id) => (st().ecos[id] || null);
  // forma em uso (0 = base); maxForm = a mais alta já desbloqueada
  EV.form = (id) => { const o = (E.state && E.state.ecos || {})[id]; return o ? Math.min(o.form || 0, o.maxForm || 0) : 0; };
  EV.def = (id) => EC.form(id, EV.form(id));
  EV.art = (id) => EC.artKey(id, EV.form(id));
  EV.list = () => Object.entries(st().ecos).map(([id, o]) => ({ id, sync: o.sync, form: EV.form(id), def: EV.def(id) })).filter((x) => x.def).sort((a, b) => b.def.rarity - a.def.rarity || b.sync - a.sync);
  EV.equipped = (h) => {
    if (!h || !h.eco || !E.state) return null;
    const o = (E.state.ecos || {})[h.eco];
    if (!o || !EC.CATALOG[h.eco]) return null;
    const form = EV.form(h.eco);
    return { id: h.eco, def: EC.form(h.eco, form), sync: o.sync, form, art: EC.artKey(h.eco, form) };
  };
  EV.equip = (h, id) => { h.eco = id && EV.owned(id) ? id : null; E.Store.save(); if (E.WG && E.WG.world && E.WG.world.refreshEco) E.WG.world.refreshEco(); if (E.Net && E.Net.connected) E.Net.hello(); };
  // bônus para C.fxList (com cache: fxList é chamado o tempo todo)
  const cache = {};
  EV.fx = (h) => {
    const e = EV.equipped(h); if (!e) return [];
    const key = e.id + ':' + e.sync + ':' + e.form;
    return cache[key] || (cache[key] = [Object.assign({ eco: e.id }, e.def.buff(e.sync - 1))]);
  };
  // Investida como poder do menu de combate (Ação Bônus, 1×/combate)
  EV.power = (h) => {
    const e = EV.equipped(h); if (!e) return null;
    return { id: 'eco_rush', tag: `Eco ${'★'.repeat(e.def.rarity)}`, lvl: 1, name: `${e.def.rush.name} (${e.def.name})`, icon: '👊', desc: EC.rushText(e.id, e.sync, e.form), cost: 'b', eco: true, effect: { ecoRush: true } };
  };
  // CD da Investida: 8 + BP + o melhor modificador entre FOR, DES e o de conjuração
  EV.dc = (h) => { const C = E.C; return 8 + C.pb(h) + Math.max(C.mod(h, 'for'), C.mod(h, 'des'), C.castAb(h) ? C.mod(h, C.castAb(h)) : -5); };

  // ------------------------------------------------ Evolução (formas do anime) e Fragmentos da Flecha
  EV.ARROW = { name: 'Fragmento da Flecha', icon: '🏹', per: 5 };
  EV.arrows = () => ((E.state.materials || {}).flecha || 0);
  EV.addArrow = (n) => { if (n > 0) { E.state.materials = E.state.materials || {}; E.state.materials.flecha = (E.state.materials.flecha || 0) + n; } };
  // chefes de covil: o primeiro de cada (desde que a Flecha apareceu em Elarion) sempre deixa um fragmento; depois, 15%
  EV.arrowDrop = (key) => {
    const s = E.state; s.arrowGot = s.arrowGot || {};
    let n = 0;
    if (!s.arrowGot[key]) { s.arrowGot[key] = Date.now(); n = 1; } else if (U.rand() < 0.15) n = 1;
    EV.addArrow(n);
    return n;
  };
  // próxima forma a desbloquear (ou null)
  EV.next = (id) => { const o = EV.owned(id), list = EC.EVO[id]; if (!o || !list) return null; const f = (o.maxForm || 0) + 1; return list[f - 1] ? { f, ev: list[f - 1] } : null; };
  // requisitos com o que o herói tem: [{ k, icon, label, need, have, ok }]
  EV.checks = (h, id) => {
    const n = EV.next(id); if (!n) return [];
    const r = n.ev.req, o = EV.owned(id), F = E.Forge, mats = E.state.materials || {}, out = [];
    const add = (k, icon, label, need, have) => out.push({ k, icon, label, need, have, ok: have >= need });
    add('sync', '🔗', 'Sincronia', r.sync, o.sync);
    add('level', '⭐', `Nível do herói`, r.level, h.level);
    if (r.gold) add('gold', '🪙', 'Ouro (po)', r.gold, h.gold || 0);
    for (const [k, v] of Object.entries(r.frags || {})) add(k, F.FRAGS[k].icon, F.FRAGS[k].name, v, mats[k] || 0);
    if (r.cores) add('cores', F.CORE_ICON, F.CORE, r.cores, F.cores(h));
    if (r.escama) add('escama', '🐚', 'Escama Iridescente', r.escama, E.Life.escamas());
    if (r.arrow) add('arrow', EV.ARROW.icon, EV.ARROW.name, r.arrow, EV.arrows());
    add('trial', '⚔', `Provação: ${n.ev.trial.name}`, 1, (o.trials || {})[n.f] ? 1 : 0);
    return out;
  };
  // a Provação só abre com a Sincronia e o nível pedidos
  EV.trialOpen = (h, id) => { const c = EV.checks(h, id); return c.length > 0 && c.filter((x) => x.k === 'sync' || x.k === 'level').every((x) => x.ok); };
  EV.trialWon = (id, f) => { const o = EV.owned(id); if (!o) return; o.trials = o.trials || {}; o.trials[f] = Date.now(); E.Store.save(); };
  EV.canEvolve = (h, id) => { const c = EV.checks(h, id); return c.length > 0 && c.every((x) => x.ok); };
  EV.evolve = (h, id) => {
    if (!EV.canEvolve(h, id)) return null;
    const { f, ev } = EV.next(id), r = ev.req, o = EV.owned(id), mats = E.state.materials;
    if (r.gold) h.gold -= r.gold;
    for (const [k, v] of Object.entries(r.frags || {})) { mats[k] -= v; if (!mats[k]) delete mats[k]; }
    if (r.cores) { h.materials[E.Forge.CORE] -= r.cores; if (!h.materials[E.Forge.CORE]) delete h.materials[E.Forge.CORE]; }
    if (r.escama) mats.escama -= r.escama;
    if (r.arrow) mats.flecha -= r.arrow;
    o.maxForm = f; o.form = f;
    E.Store.save();
    if (E.WG && E.WG.world && E.WG.world.refreshEco) E.WG.world.refreshEco();
    return EC.form(id, f);
  };
  // trocar de forma (como o Koichi alterna entre os Atos)
  EV.setForm = (id, f) => { const o = EV.owned(id); if (!o || f < 0 || f > (o.maxForm || 0)) return; o.form = f; E.Store.save(); if (E.WG && E.WG.world && E.WG.world.refreshEco) E.WG.world.refreshEco(); };

  // ------------------------------------------------ Invocação de Ecos
  EV.RATES = { base5: 0.007, soft5: 63, step5: 0.07, hard5: 80, base4: 0.06, hard4: 10, featured5: 0.5 };
  EV.MELT = { 3: 20, 4: 80, 5: 400 }; // Gemas por cópia além da Sincronia máxima
  const rate5 = (p5) => { const R = EV.RATES; if (p5 >= R.hard5) return 1; if (p5 < R.soft5) return R.base5; return Math.min(1, R.base5 + R.step5 * (p5 - R.soft5 + 1)); };
  const rate4 = (p4) => { const R = EV.RATES; if (p4 >= R.hard4) return 1; if (p4 === R.hard4 - 1) return 0.56 + R.base4; return R.base4; };
  EV.pull = (n) => {
    const s = st(), G = E.G;
    const need = G.buySealsNeeded(n);
    if (need * G.COST_GEMS > s.gems) return null;
    s.gems -= need * G.COST_GEMS; s.seals += need; s.seals -= n;
    const pity = s.pity.eco, feat = EC.featured(), out = [];
    for (let i = 0; i < n; i++) {
      pity.p5++; pity.p4++;
      const r = U.rand(), r5 = rate5(pity.p5), r4 = rate4(pity.p4);
      let rarity = 3;
      if (r < r5) rarity = 5; else if (r < r5 + r4 || pity.p4 >= EV.RATES.hard4) rarity = 4;
      let id;
      if (rarity === 5) {
        if (pity.g5 || U.rand() < EV.RATES.featured5) { id = feat.five; pity.g5 = false; }
        else { id = U.pick(EC.byRarity(5).filter((x) => x !== feat.five)); pity.g5 = true; }
        pity.p5 = 0; pity.p4 = 0;
      } else if (rarity === 4) { id = U.rand() < 0.5 ? U.pick(feat.four) : U.pick(EC.byRarity(4)); pity.p4 = 0; }
      else id = U.pick(EC.byRarity(3));
      const own = s.ecos[id];
      let isNew = false, gems = 0;
      if (!own) { s.ecos[id] = { sync: 1, got: Date.now() }; isNew = true; }
      else if (own.sync < EC.MAX_SYNC) own.sync++;
      else { gems = EV.MELT[rarity]; s.gems += gems; }
      out.push({ id, rarity, isNew, sync: s.ecos[id].sync, gems, eco: true });
      s.history.unshift({ t: Date.now(), kind: 'eco', id, rarity, eco: true });
    }
    s.history = s.history.slice(0, 300);
    s.stats.wishes += n;
    E.Store.save();
    return out;
  };
  E.Eco = EV;
})();
