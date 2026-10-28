/* Cooperativo no estilo Genshin: cada jogador tem o próprio mundo.
   • Anfitrião: recebe pedidos de entrada (automático, com aprovação ou fechado) e compartilha o estado do mundo
     (acampamentos derrotados, baús abertos) com os visitantes. Vale o Nível de Mundo dele.
   • Visitante: entra no mundo do anfitrião, luta junto (batalhas em grupo), colhe e minera, mas não abre baús
     nem avança missões do anfitrião. Ao sair, volta exatamente para onde estava no próprio mundo. */
(() => {
  const U = E.U, UI = E.UI;
  const CW = { guest: null };
  const NET = () => E.Net;

  CW.isGuest = () => !!CW.guest;
  CW.isHost = () => !CW.guest && NET() && NET().connected && NET().party.members.length > 1;
  CW.members = () => (NET() ? NET().party.members : []);
  CW.hostName = () => (CW.guest ? CW.guest.host.name : null);

  // mostra a região e o lugar certo depois de viajar
  const travelTo = async (region, x, z) => {
    E.UI.closeAll && E.UI.closeAll();
    await E.Game.travel(region, { quiet: true, keepVisited: !!CW.guest });
    const w = E.WG.world;
    if (w && x !== undefined) { w.hero.x = x; w.hero.z = z; w.hero.y = w.height(x, z); }
    E.HUD.update();
  };

  // ---------- visitante ----------
  CW.enter = async (m) => {
    const st = E.state, w = E.WG.world;
    if (E.BattleUI.current) return; // (o servidor só aceita fora de batalha)
    CW.guest = { host: m.host, wl: m.wl || 0, state: m.state || {}, ownRegion: st.world.region, ownPos: w ? { x: w.hero.x, z: w.hero.z } : null, hostLevel: (m.host.hero && m.host.hero.level) || 1 };
    E.Store.save();
    E.Audio.sfx('wish');
    UI.toast(`🌍 Você entrou no mundo de ${U.esc(m.host.name)} (Nível de Mundo ${CW.guest.wl})!`, 'gold');
    await travelTo(m.region, (m.x || 0) + 1.5, (m.z || 0) + 1.5);
    U.emit('coop:changed');
  };
  CW.exit = async (reason) => {
    if (!CW.guest) return;
    const g = CW.guest; CW.guest = null;
    if (E.BattleUI.current) { CW.pendingExit = g; } // termina a batalha antes de voltar
    UI.toast(`🏠 ${U.esc(reason || 'De volta ao seu mundo.')}`);
    if (!E.BattleUI.current) await travelTo(g.ownRegion, g.ownPos ? g.ownPos.x : undefined, g.ownPos ? g.ownPos.z : undefined);
    U.emit('coop:changed');
  };
  U.on('battle:end', () => { if (CW.pendingExit) { const g = CW.pendingExit; CW.pendingExit = null; travelTo(g.ownRegion, g.ownPos ? g.ownPos.x : undefined, g.ownPos ? g.ownPos.z : undefined); } });
  CW.leave = () => { if (CW.guest) NET().send({ t: 'wleave' }); };

  // pedido de entrada no mundo de alguém
  CW.request = (uid) => {
    if (E.Adv && E.Adv.ar() < 5) return UI.toast('O cooperativo libera no Rank de Aventura 5.');
    if (CW.isHost()) return UI.toast('Há visitantes no seu mundo — encerre o cooperativo antes.');
    if (E.BattleUI.current) return UI.toast('Termine a batalha primeiro.');
    NET().send({ t: 'wreq', uid: Number(uid) });
  };

  // ---------- anfitrião ----------
  CW.onRequest = async (from) => {
    const ar = from.profile ? from.profile.ar : '?';
    const h = from.hero || {};
    const ok = await UI.confirm('🤝 Pedido para entrar no seu mundo', `<b>${U.esc(from.name)}</b> (UID ${from.uid} · Rank ${ar})<br>${U.esc(h.name || '')} — ${U.esc((E.H.CLASSES[h.cls] || {}).name || '')} nível ${h.level || 1}<br><br>Deixar entrar?`, 'Aceitar', 'Recusar');
    NET().send({ t: 'wres', to: from.id, ok: !!ok });
  };
  CW.kick = (id) => NET().send({ t: 'wkick', id });
  CW.close = () => NET().send({ t: 'wclose' });
  CW.setPolicy = (policy) => { NET().policy = policy; NET().send({ t: 'policy', policy }); if (NET().user) NET().setProfile({ policy }).catch(() => {}); };

  // estado do mundo do anfitrião (só o que importa para os visitantes)
  CW.stateNow = () => ({ cleared: E.state.world.cleared, opened: E.state.world.opened, visited: Object.keys(E.state.world.visited || {}) });
  CW.broadcastState = () => { if (CW.guest || !NET() || !NET().connected) return; clearTimeout(CW._t); CW._t = setTimeout(() => NET().send({ t: 'wstate', state: CW.stateNow() }), 150); };
  // o visitante derrotou algo no meu mundo
  CW.onAct = (m) => {
    const a = m.act || {};
    if (a.k === 'clear' && typeof a.region === 'string') {
      const cl = E.state.world.cleared; cl[a.region] = cl[a.region] || {}; cl[a.region][a.i] = Date.now();
      const w = E.WG.world;
      if (w && w.id === a.region) { const camp = (w.camps || []).find((c) => c.i === a.i); if (camp && !camp.dead) w.clearCamp(camp, { remote: true }); }
      CW.broadcastState();
    }
  };
  // visitante: aplica o estado recebido do anfitrião
  CW.applyState = (state) => {
    if (!CW.guest) return;
    CW.guest.state = state || {};
    const w = E.WG.world; if (!w) return;
    const cl = (CW.guest.state.cleared || {})[w.id] || {};
    for (const camp of w.camps || []) if (!camp.dead && cl[camp.i] && Date.now() - cl[camp.i] < 8 * 60e3) w.clearCamp(camp, { remote: true });
  };
  // consultas usadas pelo mundo 3D
  CW.campCleared = (region, i) => {
    const src = CW.guest ? (CW.guest.state.cleared || {}) : E.state.world.cleared;
    const t = (src[region] || {})[i];
    return t && Date.now() - t < 8 * 60e3;
  };
  CW.campLevel = () => (CW.guest ? CW.guest.hostLevel : (E.Store.hero() || { level: 1 }).level);
  CW.onCampCleared = (region, i) => {
    if (CW.guest) { const cl = CW.guest.state.cleared = CW.guest.state.cleared || {}; cl[region] = cl[region] || {}; cl[region][i] = Date.now(); NET().send({ t: 'wact', act: { k: 'clear', region, i } }); }
    else CW.broadcastState();
  };
  // o que o visitante não pode fazer no mundo dos outros
  CW.blocked = (what) => {
    if (!CW.guest) return false;
    const msg = { chest: 'Só o dono do mundo pode abrir baús aqui.', quest: 'As missões do anfitrião não avançam para visitantes.', story: 'A história continua no seu próprio mundo.', collect: 'Coletáveis só podem ser pegos no seu mundo.', travel: 'No mundo de outra pessoa, você só pode viajar para regiões que o anfitrião já visitou.' }[what];
    UI.toast('🚫 ' + (msg || 'Indisponível no mundo de outra pessoa.'));
    return true;
  };
  CW.canTravel = (region) => !CW.guest || (CW.guest.state.visited || []).includes(region);

  E.CoopWorld = CW;
})();
