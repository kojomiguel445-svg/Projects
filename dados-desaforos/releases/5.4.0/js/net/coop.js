/* Batalhas em grupo (online). Quem começa a luta é o "anfitrião": o motor roda no aparelho dele e
   os amigos do grupo que estão na mesma região entram como aliados, escolhendo as ações pela rede. */
(() => {
  const U = E.U, UI = E.UI, C = E.C;
  const CO = {};
  const NET = () => E.Net;
  let host = null;   // { bid, allies:[ids], pending: Map(uid → resolver), logs:[], lastPush }
  let guest = null;  // { bid, hostId, el, state, myTurn }

  const portraitCache = {};
  CO.portrait = (a) => {
    const k = a.id + JSON.stringify(a.look || {});
    if (!portraitCache[k]) portraitCache[k] = E.SP.portrait(E.CH.draw({ look: E.CH.normalize(a.look, a.cls, a.species), species: a.species, frame: 'idle0' }), 2);
    return portraitCache[k];
  };

  // instantâneo do meu herói para lutar como aliado
  CO.snapshot = () => {
    const h = E.Store.hero(); if (!h) return null;
    const prof = C.attackProfile(h);
    let atk = { name: prof.name, toHit: prof.toHit, dmg: `${prof.dice}${prof.dmgMod ? (prof.dmgMod > 0 ? '+' : '') + prof.dmgMod : ''}`, type: prof.type, ranged: !!prof.ranged };
    // conjuradores usam o melhor truque de ataque, se for melhor que a arma
    const known = C.knownSpells(h).map((id) => [id, E.S.SPELLS[id]]).filter(([, sp]) => sp && sp.level === 0 && sp.attack && sp.dmg);
    if (known.length) {
      const [id, sp] = known.sort((a, b) => U.avgDice(b[1].dmg) - U.avgDice(a[1].dmg))[0];
      const n = h.level >= 17 ? 4 : h.level >= 11 ? 3 : h.level >= 5 ? 2 : 1;
      const d = U.parseDice(sp.dmg); const expr = `${n * d.n}d${d.s}`;
      if (U.avgDice(expr) > U.avgDice(atk.dmg) - 0.5) atk = { name: sp.name, toHit: C.spellAttack(h), dmg: expr, type: sp.type, ranged: true };
      void id;
    }
    const wi = E.SP.heroWeaponInfo(h);
    return { id: NET().me, name: h.name, cls: h.cls, species: h.species, level: h.level, look: E.CH.normalize(h.look, h.cls, h.species), weapon: Object.assign({}, wi, { type: E.SP.heroWeaponType(h) }), maxHp: C.maxHp(h), hp: Math.max(1, h.hp), ac: C.ac(h), init: C.initiative(h), toHit: atk.toHit, dmg: atk.dmg, dtype: atk.type, atkName: atk.name, ranged: atk.ranged, potions: (h.inventory || {}).pocao_cura || 0 };
  };

  const send = (to, data) => NET().send({ t: 'coop', to, data });

  // ------------------------------------------------------------ anfitrião
  CO.gather = async (keys, opts = {}) => {
    const net = NET();
    if (!net || !net.connected) return [];
    const near = net.partyHere();
    if (!near.length) return [];
    const bid = `${net.me}-${Date.now()}`;
    host = { bid, allies: [], pending: new Map(), logs: [], lastPush: 0, answers: new Set() };
    const names = [...new Set(keys.map((k) => E.M.MONSTERS[k].name))].join(', ');
    send(near.map((p) => p.id), { k: 'invite', bid, enemies: keys, names, host: E.Store.hero().name, region: E.WG.world.id });
    const box = U.h(`<div class="coop-wait"><div class="cw-t">⚔ Chamando o grupo…</div><div class="cw-s">${near.map((p) => U.esc(p.name)).join(', ')}</div><div class="cw-list"></div><button class="btn sm primary">Começar agora</button></div>`);
    document.body.appendChild(box);
    const allies = [];
    await new Promise((resolve) => {
      const t = setTimeout(resolve, 16000);
      box.querySelector('button').onclick = () => { clearTimeout(t); resolve(); };
      host.onJoin = (a) => { allies.push(a); box.querySelector('.cw-list').insertAdjacentHTML('beforeend', `<span class="chip gold">✔ ${U.esc(a.name)}</span>`); };
      host.onAnswer = () => { if (host.answers.size >= near.length) { clearTimeout(t); setTimeout(resolve, 300); } };
    });
    box.remove();
    host.allies = allies.map((a) => a.id);
    if (!allies.length) { host = null; return []; }
    E.UI.toast(`⚔ Batalha em grupo com ${allies.map((a) => a.name).join(', ')}!`, 'gold');
    return allies;
  };
  CO.requestAction = (a, battle) => new Promise((resolve) => {
    if (!host) return resolve(null);
    const t = setTimeout(() => { host && host.pending.delete(a.uid); resolve(null); }, 45000);
    host.pending.set(a.uid, (act) => { clearTimeout(t); resolve(act); });
    CO.pushState(battle, true);
    send(a.id, { k: 'turn', bid: host.bid, uid: a.uid });
  });
  CO.pushLog = (text, kind) => { if (host) { host.logs.push({ text, kind }); host.logs = host.logs.slice(-14); } };
  CO.pushState = (battle, now) => {
    if (!host || !host.allies.length || !battle) return;
    const t = Date.now();
    if (!now && t - host.lastPush < 180) { clearTimeout(host.timer); host.timer = setTimeout(() => CO.pushState(battle, true), 200); return; }
    host.lastPush = t;
    const h = battle.h;
    const cur = battle.order ? battle.order[battle.turnIdx] : null;
    const state = {
      round: battle.round, turn: cur ? battle.nameOf(cur) : '',
      hero: { name: h.name, hp: Math.max(0, h.hp), maxHp: C.maxHp(h), ac: C.ac(h), level: h.level, look: E.CH.normalize(h.look, h.cls, h.species), cls: h.cls, species: h.species, id: NET().me },
      allies: battle.allies.map((a) => ({ uid: a.uid, id: a.id, name: a.name, hp: a.hp, maxHp: a.maxHp, ac: a.ac, down: a.down, potions: a.potions, level: a.level, look: a.look, cls: a.cls, species: a.species })),
      enemies: battle.enemies.map((e) => ({ uid: e.uid, key: e.key, name: e.name, hp: Math.max(0, e.hp), maxHp: e.maxHp, ac: e.ac, dead: e.dead || !!e.cond.banido, boss: !!e.def.boss })),
      logs: host.logs.slice(-8),
    };
    send(host.allies, { k: 'state', bid: host.bid, s: state });
  };
  CO.end = (res) => {
    if (!host) return;
    send(host.allies, { k: 'end', bid: host.bid, outcome: res.outcome, xp: res.xp, gold: Math.round(res.gold * 0.75), gems: Math.round(res.gems * 0.75), allies: res.allies });
    host = null;
  };

  // ------------------------------------------------------------ convidado
  const onInvite = async (from, d) => {
    if (guest || E.BattleUI.current || document.querySelector('.modal-bg')) { send(from, { k: 'decline', bid: d.bid }); return; }
    const h = E.Store.hero();
    if (!h || h.hp <= 0) { send(from, { k: 'decline', bid: d.bid }); return; }
    const pr = UI.modal({ title: '⚔ Pedido de ajuda!', html: `<p style="text-align:center"><b>${U.esc(d.host)}</b> entrou em combate contra <b>${U.esc(d.names)}</b>. Entrar na luta como aliado?</p>`, buttons: [{ label: 'Agora não', value: false }, { label: 'Ajudar!', value: true, cls: 'primary' }] });
    const auto = setTimeout(() => { if (UI._modalClose) UI._modalClose(false); }, 15000);
    const ok = await pr; clearTimeout(auto);
    if (!ok) { send(from, { k: 'decline', bid: d.bid }); return; }
    const snap = CO.snapshot();
    send(from, { k: 'join', bid: d.bid, a: snap });
    openGuest(from, d, snap);
  };
  const openGuest = (hostId, d, snap) => {
    E.WG.locked = true; E.HUD.show(false);
    const el = U.h(`<section class="coop-view"><header><b>⚔ Batalha em grupo</b><span class="cv-turn"></span></header><div class="cv-main"><div class="cv-side"><h4>Inimigos</h4><div class="cv-enemies"></div></div><div class="cv-side"><h4>Grupo</h4><div class="cv-allies"></div></div><div class="cv-log"></div></div><div class="cv-acts"><div class="cv-wait">Aguardando o seu turno<span class="dots"></span></div></div></section>`);
    document.body.appendChild(el);
    guest = { bid: d.bid, hostId, el, state: null, myUid: 'ally_' + snap.id, target: null, snap };
    E.Audio.music('batalha');
  };
  const renderGuest = () => {
    const g = guest; if (!g || !g.state) return;
    const s = g.state, el = g.el;
    el.querySelector('.cv-turn').textContent = `Rodada ${s.round} · Turno de ${s.turn}`;
    const alive = s.enemies.filter((e) => !e.dead);
    if (!g.target || !alive.some((e) => e.uid === g.target)) g.target = alive[0] ? alive[0].uid : null;
    el.querySelector('.cv-enemies').innerHTML = s.enemies.map((e) => `<button class="cv-e ${e.dead ? 'dead' : ''} ${e.uid === g.target ? 'sel' : ''} ${e.boss ? 'boss' : ''}" data-uid="${e.uid}"><img src="${E.SP.portrait(E.SP.monster(e.key), 2)}" alt=""><div><b>${U.esc(e.name)}</b><small>CA ${e.ac}</small><div class="bar"><i style="width:${e.hp / e.maxHp * 100}%"></i></div></div></button>`).join('');
    el.querySelectorAll('.cv-e:not(.dead)').forEach((b) => (b.onclick = () => { g.target = b.dataset.uid; renderGuest(); }));
    const party = [Object.assign({ uid: 'hero', hostHero: true }, s.hero), ...s.allies];
    el.querySelector('.cv-allies').innerHTML = party.map((a) => `<div class="cv-a ${a.uid === g.myUid ? 'me' : ''} ${a.down || a.hp <= 0 ? 'down' : ''}"><img src="${CO.portrait(a)}" alt=""><div><b>${U.esc(a.name)}${a.uid === g.myUid ? ' (você)' : ''}</b><small>Nv. ${a.level} · CA ${a.ac}</small><div class="bar"><i style="width:${Math.max(0, a.hp) / a.maxHp * 100}%"></i></div><small>${a.down || a.hp <= 0 ? 'Inconsciente' : `${a.hp}/${a.maxHp} PV`}</small></div></div>`).join('');
    el.querySelector('.cv-log').innerHTML = s.logs.map((l) => `<p class="${l.kind}">${U.esc(l.text)}</p>`).reverse().join('');
  };
  const guestTurn = () => {
    const g = guest; if (!g) return;
    const me = g.state && g.state.allies.find((a) => a.uid === g.myUid);
    const box = g.el.querySelector('.cv-acts');
    box.innerHTML = '<div class="cv-your">✦ Seu turno!</div>';
    const act = (kind) => { send(g.hostId, { k: 'act', bid: g.bid, uid: g.myUid, act: { kind, target: g.target } }); box.innerHTML = '<div class="cv-wait">Aguardando<span class="dots"></span></div>'; E.Audio.sfx('click'); };
    const mk = (label, kind, dis) => { const b = U.h(`<button class="btn ${kind === 'attack' ? 'primary' : 'dark'}" ${dis ? 'disabled' : ''}>${label}</button>`); b.onclick = () => act(kind); box.appendChild(b); };
    mk(`⚔ Atacar com ${U.esc(g.snap.atkName)}`, 'attack');
    mk(`🧪 Poção de Cura (${me ? me.potions : 0})`, 'potion', !me || me.potions <= 0);
    mk('🛡 Esquivar', 'dodge');
    E.Audio.sfx('aggro');
  };
  const guestEnd = async (d) => {
    const g = guest; if (!g) return;
    guest = null;
    const h = E.Store.hero();
    const mine = (d.allies || []).find((a) => a.id === g.snap.id);
    if (mine) { h.hp = Math.max(1, mine.hp); if (h.inventory && mine.potions !== undefined) h.inventory.pocao_cura = mine.potions; }
    let levels = 0;
    if (d.outcome === 'win') { levels = C.addXp(h, d.xp); h.gold += d.gold; E.state.gems += d.gems; E.state.stats.wins++; if (E.Life) E.Life.ev('win'); }
    E.Store.save();
    g.el.remove();
    await UI.modal({ title: d.outcome === 'win' ? '🏆 Vitória do grupo!' : 'O grupo recuou…', html: d.outcome === 'win' ? `<p style="text-align:center">+${d.xp} XP · +${d.gold} po · +${d.gems} 💎</p>` : '<p style="text-align:center">Vocês sobreviveram para lutar outro dia.</p>', buttons: [{ label: 'Continuar', value: true, cls: 'primary' }] });
    E.HUD.show(true); E.HUD.update();
    E.Audio.music(E.WG.world && E.WG.world.B.night ? 'noite' : 'calma');
    setTimeout(() => { if (!UI.anyOpen()) E.WG.locked = false; }, 300);
    if (levels) await E.Game.levelUp(h, levels);
  };

  // ------------------------------------------------------------ mensagens
  U.on('net:msg', (m) => {
    if (m.t !== 'coop') return;
    const d = m.data || {};
    if (d.k === 'invite') onInvite(m.from, d);
    else if (host && d.bid === host.bid) {
      if (d.k === 'join' && d.a) { host.answers.add(m.from); d.a.id = m.from; if (host.onJoin) host.onJoin(d.a); if (host.onAnswer) host.onAnswer(); }
      else if (d.k === 'decline') { host.answers.add(m.from); if (host.onAnswer) host.onAnswer(); }
      else if (d.k === 'act') { const r = host.pending.get(d.uid); if (r) { host.pending.delete(d.uid); r(d.act); } }
    } else if (guest && d.bid === guest.bid) {
      if (d.k === 'state') { guest.state = d.s; renderGuest(); }
      else if (d.k === 'turn' && d.uid === guest.myUid) guestTurn();
      else if (d.k === 'end') guestEnd(d);
    }
  });
  // se a conexão cair no meio da luta do convidado, encerra a tela
  U.on('net:status', (on) => { if (!on && guest) guestEnd({ outcome: 'flee', allies: [] }); });

  E.Coop = CO;
})();
