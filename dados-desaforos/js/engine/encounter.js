/* Montagem de encontros pelo orçamento de XP do Livro do Mestre 2024. */
(() => {
  const U = E.U, R = E.R, M = E.M;
  const EN = {};
  const DIFF = { baixa: 0, moderada: 1, alta: 2 };

  // rng opcional para composições determinísticas por acampamento
  EN.build = (regionId, level, diff = 'baixa', rng = U.rand) => {
    const budget = R.ENCOUNTER_BUDGET[Math.max(1, Math.min(10, level))][DIFF[diff]];
    const pool = (M.BY_REGION[regionId] || M.BY_REGION.bosque).map((k) => ({ k, xp: R.CR_XP[M.MONSTERS[k].cr] }));
    const fits = pool.filter((p) => p.xp <= budget);
    const out = [];
    let spent = 0;
    if (!fits.length) {
      const weakest = pool.slice().sort((a, b) => a.xp - b.xp)[0];
      return { monsters: [weakest.k], xp: weakest.xp, budget, danger: true };
    }
    // escolhe o "líder" do encontro, favorecendo criaturas mais fortes que caibam
    const sorted = fits.slice().sort((a, b) => b.xp - a.xp);
    const lead = sorted[Math.floor(Math.pow(rng(), 1.6) * sorted.length)];
    out.push(lead.k); spent += lead.xp;
    const maxN = lead.xp <= 50 ? 4 : 3;
    let guard = 0;
    while (out.length < maxN && guard++ < 20) {
      const opts = fits.filter((p) => spent + p.xp <= budget && p.xp <= lead.xp);
      if (!opts.length) break;
      // prefere repetir a mesma criatura (matilhas, bandos)
      const pick = rng() < 0.6 && opts.find((p) => p.k === lead.k) ? opts.find((p) => p.k === lead.k) : opts[Math.floor(rng() * opts.length)];
      out.push(pick.k); spent += pick.xp;
      if (rng() < 0.25) break;
    }
    return { monsters: out, xp: spent, budget, danger: false };
  };

  EN.difficultyLabel = (xp, level) => {
    const b = R.ENCOUNTER_BUDGET[Math.max(1, Math.min(10, level))];
    if (xp <= b[0]) return { name: 'Baixa', cls: 'easy' };
    if (xp <= b[1]) return { name: 'Moderada', cls: 'mid' };
    if (xp <= b[2]) return { name: 'Alta', cls: 'hard' };
    return { name: 'Mortal', cls: 'deadly' };
  };

  E.EN = EN;
})();
