/* Missões em cadeia dos NPCs (v4), Lumes colecionáveis, Corridas das Lanternas e Domínios. */
(() => {
  const U = E.U;
  const CH = {};
  const CT = () => E.CT;
  const st = () => (E.state.chains = E.state.chains || {});
  const hero = () => E.Store.hero();
  const home = (id) => (E.WD.home ? E.WD.home(id) : id);

  CH.def = (id) => CT().CHAINS[id];
  CH.get = (id) => st()[id] || null;
  CH.step = (id) => { const s = CH.get(id), d = CH.def(id); return s && !s.done && d ? d.steps[s.i] : null; };
  CH.nextStep = (id) => { const s = CH.get(id), d = CH.def(id); if (!d) return null; if (!s) return d.steps[0]; return s.done ? null : d.steps[s.i]; };
  CH.isActive = (id) => { const s = CH.get(id); return !!(s && s.active && !s.done); };
  CH.accept = (id) => {
    const d = CH.def(id); if (!d) return;
    const s = CH.get(id) || (st()[id] = { i: 0, p: 0, active: false, done: false });
    s.active = true; s.p = 0; s.at = Date.now();
    E.Store.save();
    E.UI.toast(`📜 Nova missão: ${d.steps[s.i].title}`, 'gold');
    U.emit('quests:changed');
  };

  // progresso de uma etapa: contadores (eventos depois de aceitar) ou estado atual (picareta, Pescadex, itens…)
  CH.progress = (id) => {
    const s = CH.get(id), stp = CH.step(id), h = hero();
    if (!s || !stp || !h) return { cur: 0, n: 1, ok: false };
    const g = stp.goal, L = E.Life.data(h);
    let cur = s.p, n = g.n || 1;
    if (g.ev === 'pick') { cur = Math.min(g.tier, L.pick); n = g.tier; }
    if (g.ev === 'dex') cur = L.stats.dexCount;
    if (g.ev === 'legend') cur = Object.keys(L.legends).length;
    if (g.ev === 'deliver') cur = h.inventory[g.item] || 0;
    if (g.ev === 'deliverOre') cur = L.ores[g.ore] || 0;
    if (g.ev === 'lume') cur = CH.lumesIn(g.region).length;
    if (g.ev === 'visit' || g.ev === 'boss' || g.ev === 'challenge') n = 1;
    let ok = cur >= n;
    if (g.aqua && E.Life.aquaCount(h) < g.aqua) ok = false;
    if (g.deliverOre) for (const [o, k] of Object.entries(g.deliverOre)) if ((L.ores[o] || 0) < k) ok = false;
    return { cur: Math.min(cur, n), n, ok };
  };
  CH.goalText = (id) => {
    const stp = CH.step(id); if (!stp) return '';
    const pr = CH.progress(id), g = stp.goal, h = hero();
    let t = `${pr.cur}/${pr.n}`;
    if (g.aqua) t += ` · Aquário ${Math.min(E.Life.aquaCount(h), g.aqua)}/${g.aqua}`;
    if (g.deliverOre) t += ' · ' + Object.entries(g.deliverOre).map(([o, k]) => `${E.L.ORES[o].name} ${Math.min(E.Life.data(h).ores[o] || 0, k)}/${k}`).join(', ');
    return t;
  };

  // eventos do jogo
  CH.ev = (name, n = 1, extra = {}) => {
    if (!E.state || !E.state.chains) return;
    let changed = false;
    for (const [id, s] of Object.entries(st())) {
      if (!s.active || s.done) continue;
      const stp = CH.step(id); if (!stp) continue;
      const g = stp.goal;
      if (g.ev !== name) continue;
      let add = 0;
      if (name === 'kill') { const k = (extra.keys || []).filter((x) => !g.target || x === g.target).length; add = !g.region || home(extra.region) === g.region ? k : 0; }
      else if (name === 'gather') add = extra.target === g.target ? n : 0;
      else if (name === 'fish') add = (!g.minR || (extra.fish && extra.fish.r >= g.minR)) && (!g.region || home(extra.region) === g.region) ? n : 0;
      else if (name === 'chest') add = !g.region || home(extra.region) === g.region ? n : 0;
      else if (name === 'profit') add = extra.amount || 0;
      else if (name === 'visit') add = extra.region === g.region ? 1 : 0;
      else if (name === 'boss') add = extra.key === g.key ? 1 : 0;
      else if (name === 'challenge') add = !g.region || extra.region === g.region ? 1 : 0;
      else add = n;
      if (add > 0) {
        const before = CH.progress(id).ok;
        s.p += add; changed = true;
        const pr = CH.progress(id);
        if (pr.ok && !before) E.UI.toast(`✔ ${stp.title}: volte para falar com ${CH.npcName(id)}!`, 'gold');
        else if (!pr.ok) E.UI.toast(`📜 ${stp.title}: ${CH.goalText(id)}`);
      }
    }
    if (changed) { E.Store.save(); U.emit('quests:changed'); }
  };
  CH.npcOf = (id) => Object.entries(E.WD.NPCS).find(([, n]) => n.chain === id) || [null, null];
  CH.npcName = (id) => (CH.npcOf(id)[1] || {}).name || 'quem pediu';

  CH.turnIn = (id) => {
    const s = CH.get(id), stp = CH.step(id), h = hero();
    if (!s || !stp || !CH.progress(id).ok) return null;
    const g = stp.goal, L = E.Life.data(h);
    if (g.ev === 'deliver') { h.inventory[g.item] -= g.n; if (!h.inventory[g.item]) delete h.inventory[g.item]; }
    if (g.ev === 'deliverOre') { L.ores[g.ore] -= g.n; if (!L.ores[g.ore]) delete L.ores[g.ore]; }
    if (g.deliverOre) for (const [o, k] of Object.entries(g.deliverOre)) { L.ores[o] -= k; if (!L.ores[o]) delete L.ores[o]; }
    const r = stp.reward, got = [];
    const levels = r.xp ? E.C.addXp(h, r.xp) : 0;
    if (r.xp) got.push(['✦', `${r.xp} XP`]);
    if (r.gold) { h.gold += r.gold; got.push(['🪙', `${r.gold} po`]); }
    if (r.gems) { E.state.gems += r.gems; got.push(['💎', `${r.gems} Gemas Estelares`]); }
    for (const [it, k] of Object.entries(r.items || {})) { h.inventory[it] = (h.inventory[it] || 0) + k; got.push(['🧪', `${E.R.ITEMS[it].name} ×${k}`]); }
    for (const [o, k] of Object.entries(r.ores || {})) { L.ores[o] = (L.ores[o] || 0) + k; got.push([E.L.ORES[o].icon, `${E.L.ORES[o].name} ×${k}`]); }
    for (const [f, k] of Object.entries(r.frags || {})) { E.Forge.addFrag(f, k); got.push([E.Forge.FRAGS[f].icon, `${E.Forge.FRAGS[f].name} ×${k}`]); }
    if (r.escama) { E.Life.addEscama(r.escama); got.push(['🐚', `Escama Iridescente ×${r.escama}`]); }
    if (r.cores) { E.Forge.addCores(h, r.cores); got.push(['🔶', `${E.Forge.CORE} ×${r.cores}`]); }
    if (r.bait) { L.bait += r.bait; got.push(['🪱', `Isca ×${r.bait}`]); }
    if (r.lbait) { L.lbait += r.lbait; got.push(['🌶', `Isca Lendária ×${r.lbait}`]); }
    if (r.rod) { L.rod = Math.max(L.rod, r.rod); got.push(['🎣', E.L.RODS[r.rod].name]); }
    if (r.recipe) { L.recipes = L.recipes || []; if (!L.recipes.includes(r.recipe)) L.recipes.push(r.recipe); got.push(['📜', 'Receita: ' + (E.L.RECIPES.cozinha.find((x) => x.id === r.recipe) || {}).name]); }
    if (r.weapon) { E.Store.addWeapon(r.weapon); got.push(['🔱', E.W.CATALOG[r.weapon].name]); }
    if (r.outfit) { E.state.outfits = E.state.outfits || {}; E.state.outfits[r.outfit] = true; got.push(['👘', `Roupa: ${E.CH.OUTFITS[r.outfit].name}`]); }
    if (r.title) { L.extraTitles = L.extraTitles || []; if (!L.extraTitles.includes(r.title)) L.extraTitles.push(r.title); got.push(['🏅', `Título: ${r.title}`]); }
    if (r.adv && E.Adv) E.Adv.add(r.adv, 'quest');
    s.i++; s.p = 0;
    const d = CH.def(id);
    if (s.i >= d.steps.length) { s.done = true; s.active = false; }
    else s.active = false; // a próxima etapa é aceita conversando de novo
    E.Store.save();
    U.emit('quests:changed');
    return { got, levels, done: stp.done, finished: s.done };
  };
  CH.list = () => Object.entries(st()).filter(([, s]) => s.active && !s.done).map(([id]) => ({ id, step: CH.step(id), npc: CH.npcOf(id)[1] }));

  // ---------------------------------------------------------------- Lumes
  CH.lumes = () => (E.state.lumes = E.state.lumes || {});
  CH.lumesIn = (region) => CH.lumes()[region] || [];
  CH.takeLume = (region, i) => {
    const l = CH.lumes(); l[region] = l[region] || [];
    if (l[region].includes(i)) return false;
    l[region].push(i);
    E.Audio.sfx('star');
    E.UI.toast(`✨ Lume encontrado! (${l[region].length}/${CT().LUMES_PER_REGION})`, 'gold');
    if (E.Adv) E.Adv.add(E.Adv.XP.oculus, 'lume');
    CH.ev('lume', 1, { region });
    E.Store.save();
    return true;
  };
  // oferenda na estátua: recompensas por quantidade de Lumes da região
  CH.offerState = (region) => { const o = (E.state.lumeOffer = E.state.lumeOffer || {}); return o[region] || 0; };
  CH.offer = (region) => {
    const have = CH.lumesIn(region).length, done = CH.offerState(region), h = hero();
    const got = [];
    let k = done;
    while (k < CT().LUME_OFFER.length && have >= CT().LUME_OFFER[k].n) {
      const r = CT().LUME_OFFER[k];
      if (r.gems) { E.state.gems += r.gems; got.push(['💎', `${r.gems} Gemas`]); }
      if (r.gold) { h.gold += r.gold; got.push(['🪙', `${r.gold} po`]); }
      for (const [f, n] of Object.entries(r.frags || {})) { E.Forge.addFrag(f, n); got.push([E.Forge.FRAGS[f].icon, `${E.Forge.FRAGS[f].name} ×${n}`]); }
      if (r.adv && E.Adv) E.Adv.add(r.adv, 'lume');
      k++;
    }
    E.state.lumeOffer[region] = k;
    E.Store.save();
    return got;
  };

  // ---------------------------------------------------------------- Corrida das Lanternas (uma recompensa por dia em cada região)
  const day = () => { if (E.Sim) return `1-1-${E.Sim.clock().day}`; const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  CH.challengeDoneToday = (region) => ((E.state.challenges || {})[region] || '') === day();
  CH.finishChallenge = (region, secs) => {
    E.state.challenges = E.state.challenges || {};
    const first = !CH.challengeDoneToday(region);
    E.state.challenges[region] = day();
    const h = hero(), r = CT().CHALLENGE.reward, got = [];
    if (first) {
      E.state.gems += r.gems; h.gold += r.gold; got.push(['💎', `${r.gems} Gemas`], ['🪙', `${r.gold} po`]);
      if (E.Adv) E.Adv.add(r.adv, 'challenge');
    }
    const best = (E.state.challengeBest = E.state.challengeBest || {});
    const rec = !best[region] || secs < best[region];
    if (rec) best[region] = secs;
    CH.ev('challenge', 1, { region });
    E.Store.save();
    return { got, first, rec };
  };

  // ---------------------------------------------------------------- Domínios (ondas de monstros que dão Fragmentos)
  CH.domainRuns = () => { const d = (E.state.domain = E.state.domain || {}); if (d.day !== day()) { d.day = day(); d.runs = 0; } return d; };
  CH.domainLeft = () => Math.max(0, CT().DOMAIN.perDay - CH.domainRuns().runs);
  CH.domainReward = () => {
    const h = hero(), d = CH.domainRuns(); d.runs++;
    const tier = CT().domainTier(h.level), got = [];
    const n = 3 + (U.rand() < 0.5 ? 1 : 0) + Math.floor((E.Adv ? E.Adv.worldWL() : 0) / 3);
    E.Forge.addFrag('frag' + tier, n); got.push([E.Forge.FRAGS['frag' + tier].icon, `${E.Forge.FRAGS['frag' + tier].name} ×${n}`]);
    if (tier < 4 && U.rand() < 0.35) { E.Forge.addFrag('frag' + (tier + 1), 1); got.push([E.Forge.FRAGS['frag' + (tier + 1)].icon, `${E.Forge.FRAGS['frag' + (tier + 1)].name} ×1`]); }
    const gold = Math.round(CT().DOMAIN.reward.gold * (E.Adv ? E.Adv.goldMult() : 1));
    h.gold += gold; got.push(['🪙', `${gold} po`]);
    if (E.Adv) E.Adv.add(CT().DOMAIN.reward.adv, 'domain');
    CH.ev('domain', 1);
    E.Store.save();
    return got;
  };

  // ganchos dos outros sistemas
  U.on('world:travel', (id) => CH.ev('visit', 1, { region: home(id) }));

  E.Chains = CH;
})();
