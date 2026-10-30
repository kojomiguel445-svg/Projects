/* Grupo de viagem: até 3 personagens, como no Genshin. Quem está no grupo aparece no HUD, troca com F1–F3 e entra
   junto nas lutas como companheiro. Cada personagem guarda os próprios PV, poções, XP, ouro e empregos. */
(() => {
  'use strict';
  const C = E.C, PT = {};
  PT.MAX = 3;
  const usable = (h) => !!(h && !h.dead && !h.deleted);
  const byId = (id) => E.state.heroes.find((h) => h.id === id);
  const same = (a, b) => Array.isArray(b) && a.length === b.length && a.every((x, i) => x === b[i]);

  // Lista normalizada: sem repetidos, sem mortos ou apagados, no máximo 3 e sempre com o personagem em campo.
  PT.ids = () => {
    const st = E.state, act = E.Store.hero();
    let ids = (Array.isArray(st.party) ? st.party : []).filter((id, i, a) => a.indexOf(id) === i && usable(byId(id)));
    // Enquanto o jogador não montar o grupo, ele se completa com os personagens criados (na ordem do elenco).
    if (!st.partyEdited) for (const h of st.heroes) if (ids.length < PT.MAX && usable(h) && !ids.includes(h.id)) ids.push(h.id);
    if (usable(act) && !ids.includes(act.id)) { if (ids.length >= PT.MAX) ids[PT.MAX - 1] = act.id; else ids.push(act.id); }
    ids = ids.slice(0, PT.MAX);
    if (!same(ids, st.party)) st.party = ids;
    return ids;
  };
  PT.list = () => PT.ids().map(byId).filter(Boolean);
  PT.has = (id) => PT.ids().includes(id);
  PT.set = (ids) => {
    const st = E.state, act = E.Store.hero();
    let next = (ids || []).filter((id, i, a) => id && a.indexOf(id) === i && usable(byId(id))).slice(0, PT.MAX);
    if (act && !next.includes(act.id)) return { ok: false, message: `${act.name} está em campo e precisa ficar no grupo.` };
    if (!next.length) return { ok: false, message: 'O grupo precisa de pelo menos um personagem.' };
    st.party = next; st.partyEdited = true; E.Store.save(); E.U.emit('party:changed');
    return { ok: true, message: '' };
  };
  // Companheiros que podem lutar: os outros membros do grupo, conscientes.
  PT.companions = (limit = PT.MAX - 1) => {
    const act = E.Store.hero();
    return PT.list().filter((h) => act && h.id !== act.id && h.hp > 0).slice(0, Math.max(0, limit));
  };
  // Instantâneo de combate no mesmo formato dos aliados do cooperativo (o motor de batalha já sabe usá-lo).
  PT.snapshot = (h) => {
    const base = E.Coop && E.Coop.snapshotOf ? E.Coop.snapshotOf(h, 'pt_' + h.id) : null;
    if (!base) return null;
    return Object.assign(base, { local: true, heroId: h.id, hp: Math.max(1, Math.min(h.hp, C.maxHp(h))), startPotions: base.potions });
  };
  // Escolha automática para companheiros: poção quando estão mal, senão atacam o alvo marcado (ou o mais ferido).
  PT.auto = () => !!(E.state.settings && E.state.settings.partyAuto);
  PT.setAuto = (v) => { E.state.settings = E.state.settings || {}; E.state.settings.partyAuto = !!v; E.Store.save(); };
  PT.autoAction = (a, battle, target) => {
    if (a.potions > 0 && a.hp <= a.maxHp * 0.35) return { kind: 'potion' };
    const alive = battle.alive();
    const t = alive.find((e) => e.uid === target) || alive.slice().sort((x, y) => x.hp - y.hp)[0];
    return { kind: 'attack', target: t && t.uid };
  };
  // D&D 2024: o XP do encontro é dividido igualmente entre os personagens do grupo que lutaram.
  PT.share = (xp, battle) => {
    const n = 1 + (battle ? battle.allies.filter((a) => a.local).length : 0);
    return { n, each: n > 1 ? Math.ceil(xp / n) : xp };
  };
  // Depois da luta, cada companheiro recebe de volta os próprios PV, gasta as poções que bebeu e ganha a parte do XP.
  PT.apply = (res, battle, xpEach) => {
    const out = [];
    for (const a of battle ? battle.allies.filter((x) => x.local) : []) {
      const h = byId(a.heroId); if (!h) continue;
      h.hp = Math.max(1, Math.min(C.maxHp(h), Math.round(a.hp)));
      const used = Math.max(0, (a.startPotions || 0) - (a.potions || 0));
      if (used && h.inventory) h.inventory.pocao_cura = Math.max(0, (h.inventory.pocao_cura || 0) - used);
      let levels = 0;
      if (res.outcome === 'win' && xpEach > 0) levels = C.addXp(h, xpEach);
      out.push({ name: h.name, hp: h.hp, max: C.maxHp(h), down: !!a.down, levels, level: h.level });
    }
    return out;
  };
  E.Party = PT;
})();
