/* Rank de Aventura e Nível de Mundo (no estilo Genshin).
   O Rank (1–60) sobe com EXP de Aventura: vitórias, baús, missões, comissões diárias, domínios, chefes e exploração.
   O Nível de Mundo (0–8) acompanha o Rank: monstros mais fortes (encontros montados para um grupo de nível maior,
   pelo orçamento do Livro do Mestre) e recompensas maiores. Alguns níveis exigem vencer uma Provação de Ascensão.
   Dá para baixar o Nível de Mundo em 1 (e voltar depois de 1 hora). No cooperativo vale o Nível de Mundo do anfitrião. */
(() => {
  const U = E.U;
  const AV = {};
  AV.MAX_AR = 60;
  // EXP para passar do Rank n para n+1
  AV.need = (ar) => (ar >= AV.MAX_AR ? Infinity : Math.round(375 + (ar - 1) * 110 + Math.max(0, ar - 20) * 140 + Math.max(0, ar - 40) * 260));
  // Rank mínimo de cada Nível de Mundo; os marcados exigem a Provação de Ascensão
  AV.WL_AR = [0, 15, 20, 25, 30, 35, 40, 45, 50];
  AV.TRIAL = { 3: 'provacao_1', 5: 'provacao_2', 7: 'provacao_3' };
  AV.TRIALS = {
    provacao_1: { name: 'Provação de Ascensão I', ar: 25, wl: 3, monsters: ['minotauro', 'ogro', 'ogro'], desc: 'A Guilda testa se você aguenta monstros mais fortes.' },
    provacao_2: { name: 'Provação de Ascensão II', ar: 35, wl: 5, monsters: ['troll', 'troll', 'carnical'], desc: 'Um teste de resistência contra regeneradores.' },
    provacao_3: { name: 'Provação de Ascensão III', ar: 45, wl: 7, monsters: ['dragao_branco_jovem', 'gargula', 'gargula'], desc: 'A última prova: um dragão jovem e seus guardiões.' },
  };
  // recompensas de subir de Rank (gemas sempre; a cada 5 Ranks, Núcleos e minérios)
  AV.rankReward = (ar) => ({ gems: 120 + (ar % 5 === 0 ? 300 : 0), cores: ar % 5 === 0 ? 1 : 0, ore: ar % 5 === 0 ? (ar >= 30 ? 'cristal' : 'prata') : null });

  AV.data = () => {
    const s = E.state;
    if (!s.adv) s.adv = { ar: 1, xp: 0, lowered: 0, changedAt: 0, trials: {}, log: [] };
    return s.adv;
  };
  AV.ar = () => AV.data().ar;
  AV.maxWL = () => {
    const d = AV.data();
    let wl = 0;
    for (let n = 1; n < AV.WL_AR.length; n++) {
      if (d.ar < AV.WL_AR[n]) break;
      if (AV.TRIAL[n] && !d.trials[AV.TRIAL[n]]) break;
      wl = n;
    }
    return wl;
  };
  AV.wl = () => Math.max(0, AV.maxWL() - (AV.data().lowered ? 1 : 0));
  // Nível de Mundo em vigor agora (no mundo de outra pessoa, vale o dela)
  AV.worldWL = () => (E.CoopWorld && E.CoopWorld.guest ? E.CoopWorld.guest.wl || 0 : AV.wl());
  // próxima provação disponível
  AV.pendingTrial = () => {
    const d = AV.data();
    for (const [n, id] of Object.entries(AV.TRIAL)) if (d.ar >= AV.WL_AR[n] && !d.trials[id]) return Object.assign({ id }, AV.TRIALS[id]);
    return null;
  };
  AV.canChangeWL = () => Date.now() - (AV.data().changedAt || 0) > 3600e3;
  AV.toggleLower = () => {
    const d = AV.data();
    if (!AV.canChangeWL()) return false;
    if (!d.lowered && AV.maxWL() === 0) return false;
    d.lowered = d.lowered ? 0 : 1; d.changedAt = Date.now();
    E.Store.save();
    U.emit('adv:changed');
    return true;
  };

  // efeitos do Nível de Mundo
  // encontros: montados como se o grupo tivesse alguns níveis a mais (até o limite das tabelas)
  AV.encounterLevel = (heroLevel, wl = AV.worldWL()) => Math.min(10, heroLevel + Math.floor(wl / 2));
  AV.goldMult = (wl = AV.worldWL()) => 1 + 0.12 * wl;
  AV.gemMult = (wl = AV.worldWL()) => 1 + 0.08 * wl;
  AV.dropBonus = (wl = AV.worldWL()) => 0.02 * wl;

  // EXP de Aventura por atividade
  AV.XP = { win: 20, enemy: 6, boss: 150, lair: 200, chest: { comum: 10, refinado: 20, precioso: 40, luxuoso: 80 }, quest: 120, story: 300, commission: 250, commissionBonus: 500, domain: 150, statue: 80, oculus: 20, puzzle: 40, tower: 60, cook: 5, trade: 5 };
  AV.add = (amount, why) => {
    if (!amount || !E.state) return;
    const d = AV.data();
    if (d.ar >= AV.MAX_AR) return;
    const wlBefore = AV.maxWL();
    d.xp += Math.round(amount);
    let ups = 0;
    while (d.ar < AV.MAX_AR && d.xp >= AV.need(d.ar)) {
      d.xp -= AV.need(d.ar); d.ar++; ups++;
      const r = AV.rankReward(d.ar);
      E.state.gems += r.gems;
      const h = E.Store.hero();
      if (h && r.cores && E.Forge) E.Forge.addCores(h, r.cores);
      if (h && r.ore && E.Life) { const o = E.Life.data(h).ores; o[r.ore] = (o[r.ore] || 0) + 2; }
    }
    if (ups) {
      E.UI.toast(`✦ Rank de Aventura ${d.ar}! (+${ups > 1 ? ups + ' ranks' : AV.rankReward(d.ar).gems + ' 💎'})`, 'gold');
      E.Audio.sfx('levelup');
      const wl = AV.maxWL();
      if (wl > wlBefore) setTimeout(() => E.UI.alert(`🌍 Nível de Mundo ${wl}`, `Seu Nível de Mundo subiu para <b>${wl}</b>: os monstros ficam mais fortes e as recompensas maiores (+${Math.round((AV.goldMult(wl) - 1) * 100)}% de ouro). Se ficar difícil, dá para baixar 1 nível na aba Aventura do Diário.`), 600);
      const t = AV.pendingTrial();
      if (t && d.ar === t.ar) setTimeout(() => E.UI.toast(`⚔ ${t.name} disponível na Guilda dos Aventureiros!`, 'gold'), 1400);
      if (E.Net && E.Net.connected) E.Net.hello();
    }
    U.emit('adv:changed');
  };
  AV.completeTrial = (id) => { const d = AV.data(); d.trials[id] = Date.now(); E.Store.save(); U.emit('adv:changed'); };
  AV.summary = () => ({ ar: AV.ar(), wl: AV.wl(), maxWl: AV.maxWL() });

  E.Adv = AV;
})();
