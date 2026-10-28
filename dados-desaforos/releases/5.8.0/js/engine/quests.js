/* Missões secundárias e progresso da história principal. */
(() => {
  const U = E.U;
  const Q = {};

  Q.accept = (q, npcId) => {
    E.state.quests[q.id] = { state: 'active', progress: 0, npc: npcId, at: Date.now() };
    E.Store.save();
    E.UI.toast(`📜 Nova missão: ${q.title}`, 'gold');
    U.emit('quests:changed');
  };
  Q.isComplete = (q) => {
    const s = E.state.quests[q.id];
    if (!s || s.state !== 'active') return false;
    if (q.type === 'hunt' || q.type === 'collect') return s.progress >= q.n;
    if (q.type === 'investigate') return !!s.found;
    return false;
  };
  Q.turnIn = (q) => {
    const s = E.state.quests[q.id], h = E.Store.hero();
    if (!s || !Q.isComplete(q) || !h) return null;
    s.state = 'done';
    if (q.type === 'collect') h.materials[q.target] = Math.max(0, (h.materials[q.target] || 0) - q.n);
    const r = q.reward;
    const lv = E.C.addXp(h, r.xp || 0);
    h.gold += r.gold || 0;
    E.state.gems += r.gems || 0;
    if (r.item) h.inventory[r.item] = (h.inventory[r.item] || 0) + 1;
    E.Store.save();
    U.emit('quests:changed');
    return { ...r, levels: lv };
  };
  // eventos de progresso
  Q.onKill = (keys, regionId) => {
    if (E.Chains) E.Chains.ev('kill', 1, { keys, region: regionId });
    for (const [id, s] of Object.entries(E.state.quests)) {
      if (s.state !== 'active') continue;
      const q = Q.find(id);
      if (q && q.type === 'hunt') {
        const n = keys.filter((k) => k === q.target).length;
        if (n) { s.progress = Math.min(q.n, s.progress + n); E.UI.toast(`📜 ${q.title}: ${s.progress}/${q.n}`); }
      }
    }
    // história: vitória na região do capítulo
    const ch = E.WD.STORY[E.state.story.chapter];
    if (ch && ch.goal.type === 'victory' && ch.region === regionId && !E.state.story.ready) Q.storyReady();
    U.emit('quests:changed');
  };
  Q.onGather = (material) => {
    if (E.Chains) E.Chains.ev('gather', 1, { target: material });
    for (const [id, s] of Object.entries(E.state.quests)) {
      if (s.state !== 'active') continue;
      const q = Q.find(id);
      if (q && q.type === 'collect' && q.target === material) { s.progress = Math.min(q.n, s.progress + 1); E.UI.toast(`📜 ${q.title}: ${s.progress}/${q.n}`); }
    }
    U.emit('quests:changed');
  };
  Q.find = (qid) => {
    for (const n of Object.values(E.WD.NPCS)) if (n.quest && n.quest.id === qid) return n.quest;
    return null;
  };
  Q.npcOf = (qid) => Object.entries(E.WD.NPCS).find(([, n]) => n.quest && n.quest.id === qid);
  Q.regionOfNpc = (nid) => Object.entries(E.WD.REGIONS).find(([, r]) => r.npcs.includes(nid))?.[0];

  // ---------- história ----------
  Q.chapter = () => E.WD.STORY[E.state.story.chapter] || null;
  Q.storyReady = () => {
    E.state.story.ready = true;
    E.Store.save();
    E.UI.toast('✧ Objetivo da história concluído! Abra as Missões para decidir.', 'gold big');
    U.emit('quests:changed');
  };
  Q.storyChoose = (idx) => {
    const st = E.state.story, ch = Q.chapter();
    if (!ch || !st.ready) return null;
    const [label, flag] = ch.choices[idx];
    st.flags.push(flag);
    const h = E.Store.hero();
    const lv = h ? E.C.addXp(h, ch.reward.xp) : 0;
    E.state.gems += ch.reward.gems;
    if (h && ch.reward.item) h.inventory[ch.reward.item] = (h.inventory[ch.reward.item] || 0) + (ch.reward.n || 1);
    st.chapter++;
    st.ready = false;
    if (st.chapter >= E.WD.STORY.length) st.complete = true;
    E.Store.save();
    U.emit('quests:changed');
    return { label, reward: ch.reward, levels: lv };
  };

  E.Quests = Q;
})();
