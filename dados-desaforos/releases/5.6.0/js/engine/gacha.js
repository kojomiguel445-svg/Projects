/* Oráculo das Armas — sistema de desejos com garantia (pity) no estilo Genshin. */
(() => {
  const U = E.U, W = E.W;
  const G = {};

  G.COST_GEMS = 160;
  G.RATES = {
    evento: { base5: 0.007, soft5: 63, step5: 0.07, hard5: 80, base4: 0.06, hard4: 10, featured5: 0.75, featured4: 0.75 },
    padrao: { base5: 0.006, soft5: 74, step5: 0.06, hard5: 90, base4: 0.051, hard4: 10 },
  };

  const byRarity = (r) => Object.entries(W.CATALOG).filter(([, d]) => d.rarity === r && !d.shop && !d.exclusive).map(([id]) => id); // armas da Armaria não saem no Oráculo

  G.rate5 = (kind, p5) => {
    const R = G.RATES[kind];
    if (p5 >= R.hard5) return 1;
    if (p5 < R.soft5) return R.base5;
    return Math.min(1, R.base5 + R.step5 * (p5 - R.soft5 + 1));
  };
  G.rate4 = (kind, p4) => {
    const R = G.RATES[kind];
    if (p4 >= R.hard4) return 1;
    if (p4 === R.hard4 - 1) return 0.56 + R.base4;
    return R.base4;
  };

  G.canAfford = (n) => E.state.seals + Math.floor(E.state.gems / G.COST_GEMS) >= n;
  G.buySealsNeeded = (n) => Math.max(0, n - E.state.seals);

  G.pull = (kind, n) => {
    const st = E.state;
    const need = G.buySealsNeeded(n);
    if (need * G.COST_GEMS > st.gems) return null;
    st.gems -= need * G.COST_GEMS;
    st.seals += need;
    st.seals -= n;
    const pity = st.pity[kind];
    const banner = kind === 'evento' ? W.currentEventBanner() : W.BANNERS.padrao;
    const results = [];
    for (let i = 0; i < n; i++) {
      pity.p5++; pity.p4++;
      const r = U.rand();
      const r5 = G.rate5(kind, pity.p5), r4 = G.rate4(kind, pity.p4);
      let rarity = 3;
      if (r < r5) rarity = 5;
      else if (r < r5 + r4 || pity.p4 >= G.RATES[kind].hard4) rarity = 4;
      let id;
      if (rarity === 5) {
        if (kind === 'evento') {
          const feat = pity.g5 || U.rand() < G.RATES.evento.featured5;
          if (feat) { id = U.pick(banner.featured5); pity.g5 = false; }
          else {
            const pool = byRarity(5).filter((x) => !banner.featured5.includes(x));
            id = U.pick(pool); pity.g5 = true;
          }
        } else id = U.pick(byRarity(5));
        pity.p5 = 0; pity.p4 = 0;
      } else if (rarity === 4) {
        if (kind === 'evento') {
          const feat = pity.g4 || U.rand() < G.RATES.evento.featured4;
          if (feat) { id = U.pick(banner.featured4); pity.g4 = false; }
          else { id = U.pick(byRarity(4).filter((x) => !banner.featured4.includes(x))); pity.g4 = true; }
        } else id = U.pick(byRarity(4));
        pity.p4 = 0;
      } else id = U.pick(byRarity(3));
      const isNew = !st.weapons.some((w) => w.id === id);
      E.Store.addWeapon(id);
      results.push({ id, rarity, isNew });
      st.history.unshift({ t: Date.now(), kind, id, rarity });
    }
    st.history = st.history.slice(0, 300);
    st.stats.wishes += n;
    E.Store.save();
    return results;
  };

  // Refinar: consome uma cópia da mesma arma
  G.copies = (id) => E.state.weapons.filter((w) => w.id === id);
  G.refine = (uid) => {
    const target = E.Store.weapon(uid);
    if (!target || target.refine >= 5) return false;
    const fodder = E.state.weapons.find((w) => w.id === target.id && w.uid !== uid && !w.lock && !G.isEquipped(w.uid) && w.refine === 1);
    if (!fodder) return false;
    E.state.weapons = E.state.weapons.filter((w) => w.uid !== fodder.uid);
    target.refine++;
    E.Store.save();
    return true;
  };
  G.isEquipped = (uid) => E.state.heroes.some((h) => !h.deleted && (h.equip.weapon === uid || h.equip.focus === uid));
  // Converte cópias excedentes (além de R5) em Gemas
  G.meltValue = { 3: 15, 4: 60, 5: 300 };
  G.meltExtras = () => {
    let gems = 0;
    const groups = {};
    for (const w of E.state.weapons) if (W.CATALOG[w.id]) (groups[w.id] = groups[w.id] || []).push(w);
    const keep = new Set();
    for (const [id, list] of Object.entries(groups)) {
      list.sort((a, b) => (G.isEquipped(b.uid) ? 1 : 0) - (G.isEquipped(a.uid) ? 1 : 0) || b.refine - a.refine || (b.lock ? 1 : 0) - (a.lock ? 1 : 0));
      // cópias necessárias para levar a melhor até R5
      const best = list[0];
      let need = 5 - best.refine;
      list.forEach((w, i) => {
        if (i === 0 || w.lock || G.isEquipped(w.uid)) { keep.add(w.uid); return; }
        if (need > 0) { keep.add(w.uid); need--; return; }
        gems += G.meltValue[W.CATALOG[id].rarity] || 0;
      });
    }
    E.state.weapons = E.state.weapons.filter((w) => !W.CATALOG[w.id] || keep.has(w.uid));
    E.state.gems += gems;
    E.Store.save();
    return gems;
  };

  E.G = G;
})();
