/* Interface de batalha + "presenter" do motor de combate. */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R, S = E.S;
  const BU = {};
  let el, battle, arena, tab = 'acao', target = null, locked = true, waitingName = '';
  // turno de um companheiro do grupo local: o jogador escolhe a ação (ou deixa no automático)
  let allyTurn = null, allyResolve = null;

  const typeColor = (t) => (R.DAMAGE[t] ? R.DAMAGE[t].color : '#ffffff');
  const condChips = (cond, hero) => Object.keys(cond).filter((k) => R.CONDITIONS[k] || k === 'banido' || k === 'atormentado' || k === 'empurrado').map((k) => {
    const good = hero ? ['abencoado'].includes(k) : true;
    const name = R.CONDITIONS[k] ? R.CONDITIONS[k].name : k === 'banido' ? 'Banido' : k === 'atormentado' ? 'Atormentado' : 'Empurrado';
    return `<span class="cond ${hero ? (good ? 'good' : 'bad') : 'good'}" title="${U.esc(R.CONDITIONS[k] ? R.CONDITIONS[k].desc : '')}">${name}</span>`;
  }).join('');

  // ------------------------------------------------ presenter
  const P = {
    async rollD20(o) {
      const theme = o.who === 'enemy' ? 'enemy' : o.who === 'ally' ? 'heal' : 'hero';
      const kept = o.nat;
      let keptMarked = false;
      const dice = o.rolls.map((v) => { const dim = o.rolls.length > 1 && (v !== kept || keptMarked); if (v === kept && !keptMarked) keptMarked = true; return { s: 20, v, theme, dim }; });
      const target = o.ac !== undefined ? `<span class="vs">vs CA ${o.ac}</span>` : o.dc !== undefined ? `<span class="vs">vs CD ${o.dc}</span>` : '';
      const why = [o.adv ? `Vantagem${o.advWhy && o.advWhy.length ? ': ' + o.advWhy.join(', ') : ''}` : '', o.dis ? `Desvantagem${o.disWhy && o.disWhy.length ? ': ' + o.disWhy.join(', ') : ''}` : ''].filter(Boolean).join(' · ');
      const outTxt = { hit: 'ACERTO', miss: 'ERROU', crit: 'CRÍTICO!', success: 'SUCESSO', fail: 'FALHA' }[o.outcome] || '';
      const html = `<div class="dl-line"><span class="nat ${o.nat === 20 ? 'n20' : o.nat === 1 ? 'n1' : ''}">${o.nat}</span>${o.bonus ? ' ' + UI.signed(o.bonus) : ''} = ${o.total} ${target}</div>${why ? `<div class="dl-why">${U.esc(why)}</div>` : ''}${outTxt ? `<div class="dl-out ${o.outcome}">${outTxt}</div>` : ''}`;
      await E.Dice.roll({ dice, label: o.label, html, outcome: o.outcome, quick: !!o.quick || o.kind === 'init' });
      E.Dice.hide();
    },
    async rollDamage(o) {
      const dice = [];
      for (const p of o.parts) {
        if (!p.dice) continue;
        const th = o.heal ? 'heal' : E.Dice.typeTheme(p.type) ? E.Dice.typeTheme(p.type) : o.who === 'enemy' ? 'enemy' : 'gold';
        p.dice.vals.forEach((v) => dice.push({ s: p.dice.s, v, theme: th, themeKey: o.heal ? 'heal' : p.type }));
      }
      const chips = o.parts.map((p) => `<span style="color:${o.heal ? '#8fff9a' : typeColor(p.type)}">${p.label ? U.esc(p.label) + ': ' : ''}${p.amount} ${o.heal ? 'PV' : (R.DAMAGE[p.type] ? R.DAMAGE[p.type].name : '')}</span>`).join('');
      const html = `<div class="dl-line" style="font-size:30px">${o.heal ? '+' : ''}${o.total} <span class="vs">${o.heal ? 'PV recuperados' : 'de dano'}</span></div><div class="dl-parts">${chips}</div>`;
      await E.Dice.roll({ dice: dice.slice(0, 12), label: o.label, html, outcome: o.heal ? 'heal' : o.crit ? 'crit' : null, quick: !!o.quick, hold: o.quick ? 600 : 850 });
      E.Dice.hide();
    },
    async anim(o) {
      if (!arena) return;
      const k = o.kind;
      const legend = ['melee', 'ranged', 'spell'].includes(k) && o.actor === 'hero' && o.target && o.target !== 'hero' ? E.SP.heroWeaponInfo(battle.h) : null;
      if (o.ally) {
        if (k === 'melee') { E.Audio.sfx('slash'); await arena.melee(o.actor, o.target); }
        else if (k === 'ranged') { E.Audio.sfx('slash'); await arena.projectile(o.actor, o.target, typeColor(o.type)); }
        else if (k === 'heal') { E.Audio.sfx('heal'); await arena.aura(o.actor, '#8fff9a'); }
        else if (k === 'emelee') { E.Audio.sfx('slash'); await arena.melee(o.actor, o.target); }
        else if (k === 'eranged') await arena.projectile(o.actor, o.target, '#ff9a9a');
        return;
      }
      if (legend && legend.rar >= 5) {
        const fl = U.h(`<div class="legend-flash" style="--c:${legend.c1}"></div>`);
        document.body.appendChild(fl); setTimeout(() => fl.remove(), 700);
      }
      if (k === 'melee') { E.Audio.sfx('slash'); await arena.melee('hero', o.target); }
      else if (k === 'ranged') { E.Audio.sfx('slash'); await arena.projectile('hero', o.target, '#f2f2f2'); }
      else if (k === 'spell') { E.Audio.sfx('spell'); if (o.aoe) await arena.aoe(typeColor(o.type)); else await arena.projectile('hero', o.target, typeColor(o.type), true); }
      else if (k === 'breath') { E.Audio.sfx('spell'); await arena.aoe(typeColor(o.type)); }
      else if (k === 'heal') { E.Audio.sfx('heal'); await arena.aura('hero', '#8fff9a'); }
      else if (k === 'buff') { E.Audio.sfx('spell'); await arena.aura('hero', typeColor(o.type)); }
      else if (k === 'emelee') { E.Audio.sfx('slash'); await arena.melee(o.actor, 'hero'); }
      else if (k === 'eranged') { await arena.projectile(o.actor, 'hero', '#ff9a9a'); }
      else if (k === 'eco') {
        E.Audio.sfx('crit');
        const cry = U.h(`<div class="eco-cry">${U.esc(o.cry || '')}</div>`); document.body.appendChild(cry); setTimeout(() => cry.remove(), 1600);
        await arena.ecoRush(o.target, typeColor(o.type));
        if (o.aoe) await arena.aoe(typeColor(o.type));
      }
      else if (k === 'especial') { E.Audio.sfx('spell'); UI.toast(`⚠ ${o.name}`, 'big'); await arena.projectile(o.actor, 'hero', typeColor(o.type), true); }
      if (legend && legend.rar >= 5) { E.Audio.sfx('crit'); await arena.legendStrike(o.target, legend.c1, legend.c2); }
    },
    float(tgt, amount, type, opts = {}) {
      const pos = arena ? arena.project(tgt === 'hero' ? 'hero' : tgt, 0.85) : { x: innerWidth / 2, y: innerHeight / 2 };
      const cls = type === 'miss' ? 'miss' : type === 'heal' ? 'heal' : type === 'temp' ? 'temp' : '';
      const d = U.h(`<div class="dmg ${cls} ${opts.crit ? 'crit' : ''}" style="left:${pos.x + (Math.random() - 0.5) * 50}px;top:${pos.y + (Math.random() - 0.5) * 30}px;color:${typeColor(type)}">${amount}</div>`);
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 1200);
    },
    async hit(uid, crit) { E.Audio.sfx('impact'); if (uid === 'hero') E.App.buzz(crit ? 160 : 50); else if (crit) E.App.buzz(70); if (arena) await arena.hit(uid, crit); },
    async death(uid) { if (arena) await arena.death(uid); render(); },
    async down() { if (arena) await arena.down(); },
    activeAlly(a) { locked = true; waitingName = a.name; allyTurn = a.local ? a : null; render(); },
    allyAction(a) {
      if (!a.local) return E.Coop.requestAction(a, battle);
      const done = (act) => { allyTurn = null; allyResolve = null; return act; };
      if (E.Party.auto()) return U.wait(380).then(() => done(E.Party.autoAction(a, battle, target)));
      return new Promise((res) => { allyResolve = (act) => res(done(act)); renderCmd(); });
    },
    async allyDown(a) { if (arena) await arena.downUnit(a.uid); },
    // tela de "entre a vida e a morte": o jogador precisa rolar o d20 com o botão (ou Espaço/Enter/R)
    awaitDeathRoll(o) {
      return new Promise((res) => {
        const pips = (n, cls) => [0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
        const ov = U.h(`<div class="death-roll"><div class="dr-vig"></div><div class="dr-box">
          <div class="dr-t">ENTRE A VIDA E A MORTE</div>
          <div class="dr-s">Role 10 ou mais no d20. Três sucessos e você se estabiliza; três falhas e você morre. 20 natural: você levanta com 1 PV!</div>
          <div class="dr-pips"><div class="ds s"><b>Sucessos</b>${pips(o.s)}</div><div class="ds f"><b>Falhas</b>${pips(o.f)}</div></div>
          <button class="dr-btn"><span class="dr-d20">d20</span><span>ROLAR O DADO</span></button>
          <div class="dr-k">Toque no botão ou aperte <kbd>Espaço</kbd></div></div></div>`);
        document.body.appendChild(ov);
        E.Audio.sfx('aggro');
        const hb = setInterval(() => { E.Audio.sfx('impact'); E.App.buzz(25); }, 1100);
        let done = false;
        const go = () => { if (done) return; done = true; clearInterval(hb); E.App.buzz(90); removeEventListener('keydown', key, true); ov.classList.add('go'); setTimeout(() => ov.remove(), 250); res(); };
        const key = (e) => { if (['Space', 'Enter', 'KeyR', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); go(); } };
        addEventListener('keydown', key, true);
        ov.querySelector('.dr-btn').onclick = go;
      });
    },
    async summon(e) { if (arena) arena.addEnemy(e, battle.enemies.length - 1, battle.enemies.length); render(); await U.wait(500); },
    log(text, kind) {
      if (E.Coop) E.Coop.pushLog(text, kind);
      const box = el && el.querySelector('.blog');
      if (!box) return;
      box.prepend(U.h(`<p class="${kind}">${U.esc(text)}</p>`));
      while (box.children.length > 8) box.lastChild.remove();
    },
    update() { render(); if (E.Coop) E.Coop.pushState(battle); },
    heroTurn() { if (locked && battle.turn && battle.turn.action > 0 && !battle.turn.attacked && battle.turn.bonus > 0) tab = 'acao'; locked = false; if (arena && battle.h.hp > 0) arena.revive(); render(); },
    lock() { locked = true; waitingName = ''; render(); },
    activeEnemy(uid) { locked = true; waitingName = battle.enemy(uid)?.name || ''; render(); },
    ask(o) { return UI.choose(o); },
    async end(res) { if (E.Coop) E.Coop.end(res); await finish(res); },
  };

  // ------------------------------------------------ montagem
  BU.start = async (keys, opts = {}) => {
    const h = E.Store.hero();
    E.HUD.show(false);
    E.Audio.music('batalha');
    locked = true; waitingName = ''; tab = 'acao';
    let allies = opts.allies || (E.Coop && !opts.noCoop ? await E.Coop.gather(keys, opts) : []);
    // o grupo (até 3 contando quem está em campo) entra junto; amigos online ocupam as vagas primeiro
    if (E.Party && !opts.noParty) allies = allies.concat(E.Party.companions(E.Party.MAX - 1 - allies.length).map(E.Party.snapshot).filter(Boolean));
    allyTurn = null; allyResolve = null;
    battle = new E.Battle({ hero: h, enemies: keys, region: E.WG.world.id, boss: opts.boss, noLair: !!(opts.ecoTrial || opts.summon), presenter: P, allies });
    BU.current = battle;
    BU.opts = opts;
    arena = E.WG.openArena(E.WG.world.id, battle);
    arena.addHero(h);
    battle.allies.forEach((a, i) => arena.addAlly(a, i));
    battle.enemies.forEach((e, i) => arena.addEnemy(e, i, battle.enemies.length));
    target = battle.enemies[0].uid;
    arena.select(target);
    el = U.h(`<div id="battle" class="layer noevents">
      <div class="b-top"><div class="order"></div></div>
      <div class="ecards"></div>
      <div class="blog"></div>
      <div class="acards"></div>
      <div class="hcard"></div>
      <div class="cmd"></div>
    </div>`);
    document.getElementById('ui').appendChild(el);
    // toque no inimigo para escolher alvo
    BU._click = (e) => {
      if (!arena || !battle) return;
      let best = null, bd = 90;
      for (const en of battle.alive()) { const p = arena.project(en.uid, 0.5); const d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = en; } }
      if (best) { target = best.uid; arena.select(target); render(); }
    };
    document.getElementById('game').addEventListener('click', BU._click);
    render();
    const bossE = battle.enemies.find((e) => e.def.boss);
    if (bossE) await BU.bossIntro(bossE);
    const diff = E.EN.difficultyLabel(keys.reduce((a, k) => a + R.CR_XP[E.M.MONSTERS[k].cr], 0), h.level);
    const ban = bossE ? U.h('<div></div>') : U.h(`<div class="battle-banner"><div class="bb1">${opts.banner ? U.esc(opts.banner) : opts.boss ? '☠ Batalha Final' : 'Encontro'}</div><div class="bb2">${opts.boss ? 'A Soberana das Nove Sombras' : U.esc([...new Set(battle.enemies.map((e) => e.def.name))].join(' · '))}</div><div class="bb3 ${diff.cls}">Dificuldade ${diff.name}</div></div>`);
    document.body.appendChild(ban);
    setTimeout(() => ban.remove(), 2600);
    await U.wait(700);
    await battle.start();
  };

  // apresentação cinematográfica do chefe (barras pretas + cartão com o nome)
  BU.bossIntro = async (e) => {
    const card = U.h(`<div class="boss-intro"><i class="lb t"></i><i class="lb b"></i><div class="bi-card"><div class="bi-k">${E.state.story.chapter >= E.WD.STORY.length - 1 && e.key === 'soberana' ? '☠ BATALHA FINAL' : '☠ CHEFE'}</div><div class="bi-n">${U.esc(e.def.name)}</div><div class="bi-t">${U.esc(e.def.title || '')}</div></div></div>`);
    document.body.appendChild(card);
    E.Audio.sfx('aggro');
    await arena.bossIntro(e.uid, 2600);
    card.classList.add('out');
    setTimeout(() => card.remove(), 600);
  };

  // ------------------------------------------------ renderização
  function render() {
    if (!el || !battle) return;
    const h = battle.h, hc = battle.hc;
    // alvo válido
    if (!battle.enemy(target) || battle.enemy(target).dead || battle.enemy(target).cond.banido) { const a = battle.alive()[0]; target = a ? a.uid : null; if (arena && target) arena.select(target); }
    // ordem de iniciativa
    const cur = battle.order ? battle.order[battle.turnIdx] : null;
    el.querySelector('.order').innerHTML = `<span class="rnd">RODADA ${battle.round}</span>` + (battle.order || []).map((o) => {
      if (o.side === 'hero') return `<span class="o hero ${cur === o ? 'cur' : ''}" title="${U.esc(h.name)} · ${o.init}"><img src="${E.Portrait ? E.Portrait.url(h) : UI.heroPortrait(h)}" alt=""></span>`;
      if (o.side === 'ally') { const a = battle.ally(o.uid); return `<span class="o hero ally ${cur === o ? 'cur' : ''} ${a.down ? 'dead' : ''}" title="${U.esc(a.name)} · ${o.init}"><img src="${E.Coop.portrait(a)}" alt=""></span>`; }
      const e = battle.enemy(o.uid);
      return `<span class="o enemy ${cur === o ? 'cur' : ''} ${e.dead ? 'dead' : ''}" title="${U.esc(e.name)} · ${o.init}"><img src="${E.SP.portrait(E.SP.monster(e.key), 2)}" alt=""></span>`;
    }).join('');
    // inimigos
    const ec = el.querySelector('.ecards');
    ec.innerHTML = '';
    const boss = battle.enemies.find((e) => e.def.boss);
    let bb = el.querySelector('.boss-bar');
    if (boss) {
      if (!bb) { bb = U.h('<div class="boss-bar"></div>'); el.appendChild(bb); }
      const pct = Math.max(0, boss.hp) / boss.maxHp * 100;
      bb.innerHTML = `<div class="bb-n"><span>${U.esc(boss.name)}</span><small>${U.esc(boss.def.title || '')}</small></div><div class="bb-bar"><i class="lag" style="width:${pct}%"></i><i style="width:${pct}%"></i>${[25, 50, 75].map((x) => `<b style="left:${x}%"></b>`).join('')}</div><div class="bb-s"><span>${Math.max(0, boss.hp)} / ${boss.maxHp} PV · CA ${boss.ac}</span><span>${boss.def.legendary ? `Resistência Lendária ${'◆'.repeat(boss.lr)}${'◇'.repeat(Math.max(0, 2 - boss.lr))}` : ''}</span></div><div class="conds">${condChips(boss.cond, false)}</div>`;
      bb.classList.toggle('dead', boss.dead);
      el.classList.add('has-boss');
    }
    for (const e of battle.enemies) {
      if (e.def.boss) continue;
      const card = U.h(`<div class="ecard ${e.uid === target ? 'sel' : ''} ${e.dead || e.cond.banido ? 'dead' : ''}"><div class="en"><span>${U.esc(e.name)}</span><small>CA ${e.ac} · ND ${R.crLabel(e.def.cr)}</small></div><div class="bar"><i style="width:${Math.max(0, e.hp) / e.maxHp * 100}%"></i></div><div class="en" style="margin-top:3px"><small>${Math.max(0, e.hp)}/${e.maxHp} PV</small><small>${E.M.TYPES[e.def.type] || ''}</small></div><div class="conds">${condChips(e.cond, false)}</div></div>`);
      card.onclick = () => { target = e.uid; arena.select(target); render(); };
      ec.appendChild(card);
    }
    // aliados
    const ac = el.querySelector('.acards');
    const autoBtn = battle.allies.some((a) => a.local) ? `<button class="ac-auto ${E.Party.auto() ? 'on' : ''}" data-auto>Companheiros: ${E.Party.auto() ? 'Automático' : 'Você escolhe'}</button>` : '';
    ac.innerHTML = autoBtn + battle.allies.map((a) => `<div class="acard ${a.down ? 'down' : ''} ${allyTurn === a ? 'cur' : ''}"><img src="${E.Coop.portrait(a)}" alt=""><div><b>${U.esc(a.name)}</b><small>Nv. ${a.level} · CA ${a.ac}${a.dodge ? ' · Esquiva' : ''}</small><div class="bar"><i style="width:${Math.max(0, a.hp) / a.maxHp * 100}%"></i></div><small>${a.down ? 'Inconsciente' : `${a.hp}/${a.maxHp} PV`}</small></div></div>`).join('');
    const ab = ac.querySelector('[data-auto]'); if (ab) ab.onclick = () => { E.Party.setAuto(!E.Party.auto()); E.Audio.sfx('click'); if (E.Party.auto() && allyResolve && allyTurn) { const r = allyResolve; r(E.Party.autoAction(allyTurn, battle, target)); } render(); };
    // herói
    const max = C.maxHp(h), t = battle.turn || {};
    const slots = C.slotsLeft(h), smax = C.slotsMax(h);
    const res = C.resourcesMax(h);
    const resNames = { furia: 'Fúria', folego: 'Fôlego', surto: 'Surto', foco: 'Foco', impor: 'Impor Mãos', canalizar: 'Canalizar', sopro: 'Sopro', inspiracao: 'Inspiração', inata: 'F. Inata', feiticaria: 'P. Feitiçaria', sorte: 'Sorte',
      zelo: 'Reserva Divina', zelosa: 'Presença Zelosa', majestade: 'Majestade', passo_feerico: 'Passo Feérico', luz: 'Luz Curativa', labareda: 'Labareda', sacerdote: 'Sacerdote', lunar: 'Passo Lunar',
      equilibrio: 'Equilíbrio', caos: 'Maré do Caos', superioridade: 'Superioridade', psionico: 'Psiônicos', fantasma: 'Fantasma', integridade: 'Integridade' };
    const SB = { zeal: '📯 Zelo', blur: '🌫 Difuso', dup: '👥 Duplo', advNext: '🎯 Vantagem', advD20: '🎲 Vantagem', seaAura: '🌊 Ira do Mar', starry: '🌠 Forma Estrelada', elem: '🌪 Elemental', surgeAc: '🛡 +2 CA',
      shillelagh: '🌿 Bordão Místico', heroism: '🦁 Heroísmo', divineFavor: '✨ Favor Divino', invis: '👻 Invisível', ginvis: '👻 Invisível+', magicWeapon: '🗡 Arma Mágica', barkskin: '🌳 Pele de Árvore', enlarge: '⬆ Aumentado', haste: '⚡ Velocidade', mantle: '☀ Manto', elemWeapon: '🔥 Arma Elemental', shroud: '👤 Mortalha', stoneskin: '🪨 Pele de Pedra', fireShield: '🔥 Escudo de Fogo', deathWard: '💀 Proteção' };
    const subChips = `${hc.ward !== undefined ? `<span class="chip" style="color:#9fd4ff" title="Proteção Arcana">🛡 Proteção ${hc.ward}/${hc.wardMax}</span>` : ''}${hc.portent && hc.portent.length ? `<span class="chip gold" title="Presságio: números guardados">🔭 ${hc.portent.join(' · ')}</span>` : ''}${hc.wild ? '<span class="chip" style="color:#a8e88a">🐻 Forma Selvagem</span>' : ''}${hc.phantom > 0 ? `<span class="chip" style="color:#c9b4ff">👻 Fantasma ${hc.phantom}</span>` : ''}${hc.mirror > 0 ? `<span class="chip" style="color:#c9b4ff">🪞 Imagens ${hc.mirror}</span>` : ''}${hc.agathys && h.tempHp > 0 ? '<span class="chip" style="color:#bfe6ff">❄ Agathys</span>' : ''}${Object.keys(hc.sb || {}).filter((k) => SB[k]).map((k) => `<span class="chip" style="color:#bfe6ff">${SB[k]}</span>`).join('')}`;
    el.querySelector('.hcard').innerHTML = `<div class="hn"><span>${U.esc(h.name)}</span><small>Nv. ${h.level} ${C.cls(h).name}</small></div>
      <div class="bar ${h.hp / max < 0.3 ? 'low' : ''}" style="margin-top:6px;height:12px"><i style="width:${Math.max(0, h.hp) / max * 100}%"></i><i class="temp" style="width:${Math.min(100, (h.tempHp || 0) / max * 100)}%"></i></div>
      <div class="hn" style="margin-top:3px;font-size:12px"><span>${Math.max(0, h.hp)}/${max} PV${h.tempHp ? ` <span style="color:#bfe6ff">+${h.tempHp}</span>` : ''}</span><span>CA ${battle.heroAC()}</span></div>
      ${h.hp <= 0 ? `<div class="death-saves">Testes contra a morte: <span class="ds s">${[0, 1, 2].map((i) => `<i class="${(h.deathSaves || {}).s > i ? 'on' : ''}"></i>`).join('')}</span><span class="ds f">${[0, 1, 2].map((i) => `<i class="${(h.deathSaves || {}).f > i ? 'on' : ''}"></i>`).join('')}</span></div>` : ''}
      <div class="econ"><span class="pip ${t.action > 0 ? '' : 'off'}"><i></i>Ação${t.attacksLeft > 0 ? ` (${t.attacksLeft} atq.)` : ''}</span><span class="pip ${t.bonus > 0 ? '' : 'off'}"><i class="b"></i>Bônus</span></div>
      ${smax.length ? `<div class="slots"><b>Espaços</b>${smax.map((n, i) => n ? `<span title="${i + 1}º círculo">${i + 1}º</span>${Array.from({ length: n }, (_, k) => `<span class="slot ${k < slots[i] ? 'on' : ''}"></span>`).join('')}` : '').join(' ')}</div>` : ''}
      <div class="stats">${Object.keys(res).filter((k) => resNames[k]).map((k) => `<span class="chip">${resNames[k]} ${C.res(h, k)}/${res[k]}</span>`).join('')}${hc.conc ? `<span class="chip gold">◎ ${S.SPELLS[hc.conc].name}</span>` : ''}${hc.raging ? '<span class="chip" style="color:#ff9a7a">🔥 Fúria</span>' : ''}${subChips}${condChips(hc.cond, true)}${h.heroic ? '<span class="chip gold" title="Inspiração Heroica: role de novo um dado">✦ Inspiração</span>' : ''}</div>`;
    // os cartões dos aliados ficam sempre logo acima do cartão do herói, qualquer que seja a altura dele
    const hcEl = el.querySelector('.hcard');
    if (hcEl && hcEl.offsetHeight) {
      if (hcEl.offsetTop > innerHeight / 2) Object.assign(ac.style, { bottom: `calc(${hcEl.offsetHeight + 24}px + var(--safe-b))`, top: '', left: '', right: '', width: '' });
      else Object.assign(ac.style, { top: `${hcEl.offsetTop + hcEl.offsetHeight + 8}px`, bottom: 'auto', left: 'auto', right: getComputedStyle(hcEl).right, width: `${hcEl.offsetWidth}px` }); // celular em pé: o cartão do herói fica no alto
    }
    renderCmd();
  }

  // comandos do companheiro: atacar o alvo marcado, esquivar, beber poção ou deixar no automático
  function renderAllyCmd(cmd, a) {
    const tgt = battle.enemy(target) && !battle.enemy(target).dead ? battle.enemy(target) : battle.alive()[0];
    const pick = (act) => { if (!allyResolve) return; E.Audio.sfx('click'); const r = allyResolve; r(act); render(); };
    cmd.innerHTML = `<div class="ally-cmd"><div class="ac-head"><img src="${E.Coop.portrait(a)}" alt=""><div><small>Companheiro</small><b>Turno de ${U.esc(a.name)}</b></div><span class="ac-hp">${Math.max(0, a.hp)}/${a.maxHp} PV</span></div><div class="cmd-list"></div></div>`;
    const list = cmd.querySelector('.cmd-list');
    const add = (o) => { const b = U.h(`<button class="act ${o.cls || ''}" ${o.disabled ? 'disabled' : ''}><span class="cost">${o.cost || ''}</span><div class="an">${o.icon} ${o.name}</div><div class="ad">${o.desc}</div></button>`); b.onclick = o.run; list.appendChild(b); };
    add({ cls: 'main', icon: '⚔', name: `${U.esc(a.atkName)}${tgt ? ' → ' + U.esc(tgt.name) : ''}`, desc: `${UI.signed(a.toHit)} para acertar · ${a.dmg} ${R.DAMAGE[a.dtype] ? R.DAMAGE[a.dtype].name : ''}`, cost: '<i></i>', disabled: !tgt, run: () => pick({ kind: 'attack', target: tgt && tgt.uid }) });
    add({ icon: '🛡', name: 'Esquivar', desc: 'Ataques contra este companheiro com Desvantagem', cost: '<i></i>', run: () => pick({ kind: 'dodge' }) });
    add({ icon: '🧪', name: 'Poção de Cura', desc: a.potions > 0 ? `Cura 2d4+2 · restam ${a.potions}` : 'Sem poções na bolsa deste personagem', cost: '<i></i>', disabled: !(a.potions > 0) || a.hp >= a.maxHp, run: () => pick({ kind: 'potion' }) });
    add({ cls: 'toggle', icon: '✦', name: 'Automático', desc: 'Os companheiros escolhem sozinhos nos próximos turnos', cost: 'grátis', run: () => { E.Party.setAuto(true); pick(E.Party.autoAction(a, battle, target)); } });
  }

  const resLabel = { canalizar: 'Canalizar', forma: 'Forma Selvagem', foco: 'Foco', feiticaria: 'P. Feitiçaria', inspiracao: 'Inspiração', zelo: 'dados', luz: 'dados', passo_feerico: 'usos', mapa: 'usos', golpe_terrivel: 'usos', incansavel: 'usos', intervencao: 'uso' };
  function renderCmd() {
    const cmd = el.querySelector('.cmd');
    const h = battle.h, hc = battle.hc, t = battle.turn || {};
    if (allyTurn && allyResolve && !battle.over) return renderAllyCmd(cmd, allyTurn);
    if (locked || battle.over || battle.busy || h.hp <= 0) {
      cmd.innerHTML = `<div class="waiting">${battle.over ? 'Fim da batalha' : h.hp <= 0 ? 'Você está inconsciente' : waitingName ? `Turno de ${U.esc(waitingName)}` : 'Aguarde'}<span class="dots"></span></div>`;
      return;
    }
    const caster = C.knownSpells(h).length > 0;
    const tabs = [['acao', 'Ação'], ['bonus', 'Bônus'], ...(caster ? [['magia', 'Magias']] : []), ['itens', 'Itens']];
    if (tab === 'magia' && !caster) tab = 'acao';
    cmd.innerHTML = `<div class="cmd-tabs">${tabs.map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="cmd-list"></div>`;
    cmd.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; renderCmd(); E.Audio.sfx('click'); }));
    const list = cmd.querySelector('.cmd-list');
    const add = (o) => {
      const b = U.h(`<button class="act ${o.cls || ''}" ${o.disabled ? 'disabled' : ''}><span class="cost">${o.cost === 'a' ? '<i></i>' : o.cost === 'b' ? '<i class="b"></i>' : o.cost || ''}</span><div class="an">${o.icon || ''} ${o.name}</div>${o.desc ? `<div class="ad">${o.desc}</div>` : ''}</button>`);
      b.onclick = () => { if (battle.busy || locked) return; E.Audio.sfx('click'); o.run(); };
      list.appendChild(b);
    };
    const tgt = battle.enemy(target);
    const canAction = t.action > 0 || t.attacksLeft > 0;
    // poderes da subclasse: os de Ação (e grátis) na aba Ação, os de Ação Bônus na aba Bônus
    const subPowerButtons = (kind) => {
      for (const p of C.subPowers(h)) {
        const cost = battle.powerCost(p);
        if (kind === 'a' ? cost === 'b' : cost !== 'b') continue;
        const why = battle.powerBlock(p);
        const left = p.res ? ` · ${C.res(h, p.res)}/${C.resourcesMax(h)[p.res] || 0}${resLabel[p.res] ? ' ' + resLabel[p.res] : ''}` : '';
        add({ cls: 'sub', icon: p.icon, name: p.name, desc: `${U.esc(p.desc)}${left}${why ? ` · <i>${why}</i>` : ''}${p.tag ? ` · <span class="sub-tag">${U.esc(p.tag)}</span>` : ''}`, cost: cost === 'free' ? 'grátis' : cost, disabled: !!why, run: () => battle.subPower(p.id, target) });
      }
    };
    if (tab === 'acao') {
      const prof = C.attackProfile(h);
      const wname = prof.name;
      add({ cls: 'main', icon: '⚔', name: t.attacksLeft > 0 ? `Atacar de novo (${t.attacksLeft} restante${t.attacksLeft > 1 ? 's' : ''})` : `Atacar com ${wname}`, desc: `${UI.signed(prof.toHit)} para acertar · ${prof.dice}${prof.dmgMod ? UI.signed(prof.dmgMod) : ''} ${R.DAMAGE[prof.type].name}${prof.mastery ? ` · Maestria: ${R.MASTERY[prof.mastery].name}` : ''}${!prof.proficient ? ' · sem proficiência!' : ''}${tgt ? ` → ${tgt.name}` : ''}`, cost: 'a', disabled: !canAction || !tgt, run: () => battle.heroAttack(target) });
      if (C.species(h).hooks.breath && C.res(h, 'sopro') > 0) add({ icon: '🐉', name: 'Arma de Sopro', desc: `Substitui um ataque · ${h.level >= 5 ? 2 : 1}d10 em área`, cost: 'a', disabled: !canAction, run: () => battle.heroAttack(target, { breath: true }) });
      if (C.has(h, 'ataque_descuidado')) add({ cls: 'toggle ' + (hc.reckless ? 'on' : ''), icon: '💢', name: 'Ataque Descuidado', desc: 'Vantagem nos ataques de Força; inimigos com Vantagem contra você', cost: 'grátis', disabled: t.attacked, run: () => battle.classAbility('descuidado') });
      if (C.res(h, 'surto') > 0 && !t.surge) add({ icon: '⚡', name: 'Surto de Ação', desc: 'Ganha uma ação extra neste turno', cost: 'grátis', run: () => battle.classAbility('surto') });
      if (h.cls === 'paladino' && C.has(h, 'arma_sagrada') && C.res(h, 'canalizar') > 0 && !hc.sacred) add({ icon: '✨', name: 'Arma Sagrada', desc: `+${Math.max(1, C.mod(h, 'car'))} nos ataques (Canalizar Divindade)`, cost: 'grátis', run: () => battle.classAbility('arma_sagrada') });
      if (h.cls === 'clerigo' && C.res(h, 'canalizar') > 0) {
        add({ icon: '✚', name: 'Centelha Divina (cura)', desc: `${h.level >= 7 ? '2d8' : '1d8'} + SAB PV`, cost: 'a', disabled: t.action <= 0, run: () => battle.classAbility('centelha') });
        add({ icon: '☀', name: 'Centelha Divina (dano)', desc: `${h.level >= 7 ? '2d8' : '1d8'} + SAB Radiante · TR Con`, cost: 'a', disabled: t.action <= 0 || !tgt, run: () => battle.classAbility('centelha_dano', target) });
      }
      if (C.species(h).hooks.healingHands && C.res(h, 'maos_curativas') > 0) add({ icon: '🤲', name: 'Mãos Curativas', desc: `Cura ${C.pb(h)}d4 PV (1×/descanso longo)`, cost: 'a', disabled: t.action <= 0, run: () => battle.classAbility('maos_curativas') });
      subPowerButtons('a');
      const nick = C.attackProfile(h).mastery === 'agil';
      if (battle.canOffhand() && nick) add({ icon: '🗡', name: 'Ataque extra (Ágil)', desc: 'Arma Leve: ataque extra sem gastar a Ação Bônus', cost: 'grátis', run: () => battle.offhandAttack(target) });
      add({ icon: '🛡', name: 'Esquivar', desc: 'Ataques contra você com Desvantagem até seu próximo turno', cost: 'a', disabled: t.action <= 0, run: () => battle.dodge() });
      add({ icon: '👁', name: 'Esconder', desc: 'Furtividade CD 15: próximo ataque com Vantagem', cost: 'a', disabled: t.action <= 0, run: () => battle.hide(false) });
      add({ icon: '🏃', name: 'Fugir', desc: `Desengajar e correr · Acrobacia/Atletismo CD ${10 + battle.alive().length + (battle.isBoss ? 5 : 0)}`, cost: 'a', disabled: t.action <= 0, run: () => battle.flee() });
      if (C.res(h, 'sorte') > 0) add({ cls: 'toggle ' + (battle.useLuck ? 'on' : ''), icon: '🍀', name: 'Sorte', desc: `Vantagem no próximo Teste de d20 (${C.res(h, 'sorte')})`, cost: 'grátis', run: () => battle.classAbility('sorte') });
    }
    if (tab === 'bonus') {
      const B = (o) => add(Object.assign({ cost: 'b', disabled: t.bonus <= 0 }, o));
      if (h.cls === 'barbaro') B({ icon: '🔥', name: hc.raging ? 'Em Fúria' : 'Fúria', desc: `+${C.rageDamage(h)} dano, Resistência física (${C.res(h, 'furia')} usos)`, disabled: t.bonus <= 0 || hc.raging || C.res(h, 'furia') <= 0, run: () => battle.classAbility('furia') });
      if (h.cls === 'guerreiro') B({ icon: '💚', name: 'Retomar o Fôlego', desc: `1d10 + ${h.level} PV (${C.res(h, 'folego')} usos)`, disabled: t.bonus <= 0 || C.res(h, 'folego') <= 0, run: () => battle.classAbility('folego') });
      if (h.cls === 'monge') {
        B({ icon: '👊', name: 'Golpe Desarmado', desc: `Artes Marciais: 1d${h.level >= 5 ? 8 : 6} + DES`, disabled: t.bonus <= 0 || !tgt, run: () => battle.classAbility('artes', target) });
        if (h.level >= 2) B({ icon: '🌀', name: 'Rajada de Golpes', desc: `2 golpes desarmados · 1 Foco (${C.res(h, 'foco')})`, disabled: t.bonus <= 0 || C.res(h, 'foco') <= 0 || !tgt, run: () => battle.classAbility('rajada', target) });
        if (h.level >= 2) B({ icon: '🧘', name: 'Defesa Paciente', desc: 'Desengajar + Esquivar · 1 Foco', disabled: t.bonus <= 0 || C.res(h, 'foco') <= 0, run: () => battle.classAbility('paciente') });
      }
      if (h.cls === 'paladino') B({ icon: '🤲', name: 'Impor as Mãos', desc: `Reserva de cura: ${C.res(h, 'impor')} PV`, disabled: t.bonus <= 0 || C.res(h, 'impor') <= 0 || h.hp >= C.maxHp(h), run: () => battle.classAbility('impor') });
      if (h.cls === 'ladino' && h.level >= 2) B({ icon: '👁', name: 'Ação Ardilosa: Esconder', desc: 'Furtividade CD 15 → Vantagem (Ataque Furtivo!)', run: () => battle.classAbility('esconder_b') });
      if (h.cls === 'ladino' && h.level >= 3) B({ icon: '🎯', name: 'Mira Firme', desc: 'Vantagem no próximo ataque', disabled: t.bonus <= 0 || hc.steady, run: () => battle.classAbility('mira') });
      if (h.cls === 'feiticeiro') B({ icon: '✷', name: 'Feitiçaria Inata', desc: `+1 CD e Vantagem em ataques mágicos (${C.res(h, 'inata')})`, disabled: t.bonus <= 0 || C.res(h, 'inata') <= 0 || hc.innate > 0, run: () => battle.classAbility('inata') });
      if (h.cls === 'feiticeiro' && h.level >= 2) B({ icon: '💠', name: 'Fonte de Magia', desc: `2 Pontos de Feitiçaria → espaço de 1º (${C.res(h, 'feiticaria')})`, disabled: t.bonus <= 0 || C.res(h, 'feiticaria') < 2 || !(h.slotsUsed || [])[0], run: () => battle.classAbility('criar_espaco') });
      if (h.cls === 'druida' && h.level >= 2) { const wf = C.fxVals(h, 'wildForm')[0]; B({ icon: '🐺', name: 'Forma Selvagem', desc: wf ? `PV temp. = ${wf.tempMult * h.level} · CA ${wf.acBase + C.mod(h, 'sab')} (${C.res(h, 'forma')})` : `PV temporários = ${h.level} (${C.res(h, 'forma')})`, disabled: t.bonus <= 0 || C.res(h, 'forma') <= 0 || (wf && hc.wild), run: () => battle.classAbility('forma') }); }
      if (hc.weaponSpirit) B({ icon: '🗡', name: 'Arma Espiritual', desc: 'Ataque mágico da arma flutuante', disabled: t.bonus <= 0 || !tgt, run: () => battle.spiritAttack(tgt, false) });
      if (C.species(h).hooks.adrenaline) B({ icon: '💨', name: 'Surto de Adrenalina', desc: `Disparada + ${C.pb(h)} PV temporários (${C.res(h, 'adrenalina')})`, disabled: t.bonus <= 0 || C.res(h, 'adrenalina') <= 0, run: () => battle.classAbility('adrenalina') });
      if (h.species === 'aasimar' && h.level >= 3) B({ icon: '😇', name: 'Revelação Celestial', desc: `+${C.pb(h)} Radiante 1×/turno`, disabled: t.bonus <= 0 || hc.revelation || (h.used || {}).revelacao, run: () => battle.classAbility('revelacao') });
      subPowerButtons('b');
      if (C.attackProfile(h).light && C.attackProfile(h).base !== 'desarmado' && C.attackProfile(h).mastery !== 'agil') B({ icon: '🗡', name: 'Ataque com a outra mão', desc: `Arma Leve, depois de Atacar${C.hasFx(h, 'twf') ? ' · soma o atributo ao dano' : ' · sem somar o atributo ao dano'}`, disabled: !battle.canOffhand(), run: () => battle.offhandAttack(target) });
      for (const [id, n] of Object.entries(h.inventory)) if (n > 0 && R.ITEMS[id] && R.ITEMS[id].heal) B({ icon: '🧪', name: R.ITEMS[id].name, desc: `Cura ${R.ITEMS[id].heal} · você tem ${n}`, run: () => battle.usePotion(id) });
      if (!list.children.length) list.appendChild(U.h('<div class="waiting" style="grid-column:1/-1">Nenhuma ação bônus disponível.</div>'));
    }
    if (tab === 'magia') {
      if (hc.raging) list.appendChild(U.h('<div class="waiting" style="grid-column:1/-1">Não é possível conjurar em Fúria.</div>'));
      const known = C.knownSpells(h).filter((id) => S.SPELLS[id] && S.SPELLS[id].time !== 'smite' && S.SPELLS[id].time !== 'reacao');
      known.sort((a, b) => S.SPELLS[a].level - S.SPELLS[b].level);
      for (const id of known) {
        const sp = S.SPELLS[id];
        const slots = battle.spellSlotsFor(id);
        const bonus = sp.time === 'bonus';
        const can = !hc.raging && slots.length && (bonus ? t.bonus > 0 : t.action > 0 || (sp.level === 0 && battle.warMagicReady())) && !(sp.level > 0 && t.once && t.once.slotSpell && !slots.includes('free'));
        const dmg = sp.dmg ? (sp.level === 0 ? C.cantripDice(h, sp) : sp.dmg) : sp.heal || '';
        add({ icon: sp.level ? `<b style="color:#c9b4ff">${sp.level}º</b>` : '<b style="color:#9fd4ff">T</b>', name: sp.name, desc: `${sp.attack ? `${UI.signed(C.spellAttack(h, id))} ataque` : sp.save ? `TR ${R.AB[sp.save].short} CD ${C.spellDC(h, id)}` : sp.heal ? 'Cura' : 'Efeito'}${dmg ? ' · ' + dmg : ''}${sp.conc ? ' · Conc.' : ''}${sp.aoe ? ' · Área' : ''}`, cost: bonus ? 'b' : 'a', disabled: !can, run: async () => {
          let slot = slots[0];
          if (slots.length > 1) {
            const ch = await UI.choose({ title: sp.name, text: 'Escolha o espaço de magia (círculos maiores aumentam o efeito).', options: slots.map((s) => ({ id: String(s), label: s === 0 ? 'Truque' : s === 'free' ? `Uso gratuito${h.mi && h.mi.spell === id && R.AB[h.mi.ab] ? ` · ${R.AB[h.mi.ab].short} · Ataque ${UI.signed(C.spellAttack(h, id, 'mi'))} / CD ${C.spellDC(h, id, 'mi')}` : ''}` : `${s}º círculo (${C.slotsLeft(h)[s - 1]} restante${C.slotsLeft(h)[s - 1] > 1 ? 's' : ''})` })).concat([{ id: 'no', label: 'Cancelar' }]) });
            if (!ch || ch === 'no') return;
            slot = ch === 'free' ? 'free' : Number(ch);
          }
          if (sp.conc && hc.conc && hc.conc !== id) {
            const ok = await UI.confirm('Concentração', `Conjurar ${sp.name} encerra ${S.SPELLS[hc.conc].name}. Continuar?`);
            if (!ok) return;
          }
          // Metamagia (Feiticeiro 2)
          let meta = null;
          const mms = battle.metamagicOptions(id);
          if (mms.length) {
            const mc = await UI.choose({ title: 'Metamagia', text: `Modificar ${sp.name}? Você tem ${C.res(h, 'feiticaria')} Pontos de Feitiçaria.`, options: [{ id: 'none', label: 'Sem Metamagia' }].concat(mms.map((m) => ({ id: m.id, label: m.label }))) });
            if (!mc) return;
            if (mc !== 'none') meta = mc;
          }
          battle.castSpell(id, slot, target, meta);
        } });
      }
    }
    if (tab === 'itens') {
      for (const [id, n] of Object.entries(h.inventory)) if (n > 0 && R.ITEMS[id] && R.ITEMS[id].heal) add({ icon: '🧪', name: R.ITEMS[id].name, desc: `${R.ITEMS[id].heal} PV · você tem ${n}`, cost: 'b', disabled: t.bonus <= 0, run: () => battle.usePotion(id) });
      if (!list.children.length) list.appendChild(U.h('<div class="waiting" style="grid-column:1/-1">Sem itens utilizáveis. Compre poções nas lojas.</div>'));
    }
    add({ cls: 'end', icon: '⏭', name: 'Encerrar turno', run: () => { locked = true; render(); battle.endHeroTurn(); } });
  }

  // ------------------------------------------------ fim da batalha
  async function finish(res) {
    const h = battle.h;
    await U.wait(400);
    E.Dice.hide();
    const camp = BU.opts.camp;
    let levels = 0;
    if (res.outcome === 'win') {
      // Nível de Mundo: mais ouro e gemas; EXP de Aventura pela vitória
      if (E.Adv) {
        res.gold = Math.round(res.gold * E.Adv.goldMult()); res.gems = Math.round(res.gems * E.Adv.gemMult());
        res.adv = E.Adv.XP.win + res.kills.length * E.Adv.XP.enemy + (res.lair ? E.Adv.XP.lair : 0) + (res.boss ? E.Adv.XP.boss : 0);
      }
      // XP dividido entre quem lutou no grupo (regra do D&D 2024); cada companheiro recebe a mesma parte
      if (E.Party) { const sh = E.Party.share(res.xp, battle); res.party = sh.n; res.xpTotal = res.xp; res.xp = sh.each; }
      if (E.Life && E.Life.buff(h, 'sabedoria')) res.xp = Math.round(res.xp * 1.2);
      if (E.Life && E.Life.buff(h, 'fortuna')) res.gold = Math.round(res.gold * 1.25);
      levels = C.addXp(h, res.xp);
      h.gold += res.gold;
      E.state.gems += res.gems;
      if (res.seals) E.state.seals += res.seals;
      if (res.cores) E.Forge.addCores(h, res.cores);
      for (const [k, n] of Object.entries(res.frags || {})) E.Forge.addFrag(k, n);
      if (res.lair && E.Eco) res.arrow = E.Eco.arrowDrop(res.lair);
      if (res.lair) { E.state.world.bossKilled = E.state.world.bossKilled || {}; E.state.world.bossKilled[E.WG.world.id] = Date.now(); E.state.stats.bosses = (E.state.stats.bosses || 0) + 1; }
      E.state.stats.wins++;
      for (const k of res.kills) h.kills[k] = (h.kills[k] || 0) + 1;
      E.state.bestiary = E.state.bestiary || {};
      for (const k of res.kills) E.state.bestiary[k] = (E.state.bestiary[k] || 0) + 1;
      E.Quests.onKill(res.kills, E.WD.home(E.WG.world.id));
      if (res.lair && E.Chains) E.Chains.ev('boss', 1, { key: res.lair });
      if (E.Life) { E.Life.onKill(res.kills, E.WD.home(E.WG.world.id)); E.Life.ev('win'); E.Life.checkAch(h); }
      if (res.boss) E.Quests.storyReady();
    }
    // o grupo venceu com quem estava em campo caído: ele acorda com 1 PV
    let revived = false;
    if (res.outcome === 'win' && h.hp <= 0) { h.hp = 1; revived = true; }
    if (h.hp > 0) h.deathSaves = { s: 0, f: 0 };
    const mates = E.Party ? E.Party.apply(res, battle, res.outcome === 'win' ? (res.xpTotal ? Math.ceil(res.xpTotal / (res.party || 1)) : 0) : 0) : [];
    const title = { win: 'VITÓRIA', flee: 'FUGA', down: 'DERROTA', dead: 'MORTE' }[res.outcome];
    let sub = '';
    if (res.outcome === 'flee') sub = 'Você escapou do combate.';
    if (revived) sub = `O grupo venceu e reanimou ${h.name} com 1 PV.`;
    if (res.outcome === 'down') { const lost = Math.floor(h.gold * 0.1); h.gold -= lost; h.hp = 1; sub = `Você acorda junto à Estátua de Teleporte com 1 PV. Perdeu ${lost} po.`; }
    let losses = null;
    if (res.outcome === 'dead') {
      E.state.stats.deaths++;
      if (E.state.settings.hardcore) { h.dead = true; sub = `${h.name} morreu. No modo Hardcore a morte é permanente.`; }
      else { losses = C.deathPenalty(h); sub = `Morgana arrasta sua alma de volta das margens do Abismo… mas a morte cobra o seu preço.`; }
    }
    if (E.Sim) E.Sim.onBattle(h, res);
    E.Store.save();
    const box = U.h(`<div class="result ${res.outcome === 'win' ? '' : 'lose'}"><div class="rbox"><div class="rt">${title}</div>${sub ? `<p class="muted">${sub}</p>` : ''}<div class="rewards"></div>${levels ? `<div class="levelup">✦ NÍVEL ${h.level}! ✦</div>` : ''}${mates.length ? `<div class="party-result">${res.party > 1 && res.outcome === 'win' ? `<small>XP do encontro (${res.xpTotal}) dividido entre ${res.party} personagens</small>` : ''}${mates.map((m) => `<span class="pr-m ${m.down ? 'down' : ''}"><b>${U.esc(m.name)}</b>${m.levels ? ` · Nível ${m.level}!` : ''} · ${m.down ? 'acordou com ' : ''}${m.hp}/${m.max} PV</span>`).join('')}</div>` : ''}<div style="margin-top:22px"><button class="btn primary"><span class="ico">✓</span>Continuar</button></div></div></div>`);
    const rw = box.querySelector('.rewards');
    if (losses) {
      const it = [['💀', losses.levelLost ? `Nível ${losses.from} → ${losses.to}` : `${losses.xp} XP`, losses.levelLost ? 'Nível perdido' : 'Experiência perdida'], ['🪙', `−${losses.gold}`, 'Ouro'], ...losses.items.slice(0, 4).map((x) => ['🎒', `−${x.n}`, x.name])];
      it.forEach(([i, v, n], k) => rw.appendChild(U.h(`<div class="reward loss" style="animation-delay:${k * 0.12}s"><div class="ri">${i}</div><div class="rv">${U.esc(v)}</div><div class="rn">${U.esc(n)}</div></div>`)));
      E.Audio.sfx('fail');
    }
    if (res.outcome === 'win') {
      [['xp', '✦', res.xp, 'XP'], ['gold', '🪙', res.gold, 'Ouro'], ['gem', '💎', res.gems, 'Gemas Estelares'], ...(res.seals ? [['gem', '🌟', res.seals, 'Selos Estelares']] : []), ...(res.cores ? [['gem', E.Forge.CORE_ICON, res.cores, 'Núcleos de Covil']] : []), ...(res.arrow ? [['gem', '🏹', res.arrow, 'Fragmento da Flecha']] : []), ...(res.adv ? [['xp', '🌍', res.adv, 'EXP de Aventura']] : []), ...Object.entries(res.frags || {}).map(([k, n]) => ['gem', E.Forge.FRAGS[k].icon, n, E.Forge.FRAGS[k].name])].forEach(([c, i, v, n], k) => rw.appendChild(U.h(`<div class="reward ${c}" style="animation-delay:${k * 0.1}s"><div class="ri">${i}</div><div class="rv">${v}</div><div class="rn">${n}</div></div>`)));
      E.Audio.sfx(levels ? 'levelup' : 'chest');
    }
    document.body.appendChild(box);
    await new Promise((r) => { box.querySelector('button').onclick = r; });
    box.remove();
    // limpeza
    document.getElementById('game').removeEventListener('click', BU._click);
    el.remove(); el = null;
    const w = E.WG.world;
    E.WG.closeArena();
    arena = null;
    battle = null;
    BU.current = null;
    E.HUD.show(true);
    E.Audio.music(w.B.night ? 'noite' : 'calma');
    if (camp) {
      if (res.outcome === 'win') w.clearCamp(camp);
      else w.pushBack(camp);
    }
    if (res.outcome === 'down' || (res.outcome === 'dead' && !h.dead)) { w.hero.x = w.waypoint.x + 2; w.hero.z = w.waypoint.z + 2; }
    if (res.boss && res.outcome === 'win') w.refreshObjectives();
    if (res.lair && w.refreshLair) w.refreshLair();
    setTimeout(() => { E.WG.locked = false; }, 600);
    E.HUD.update();
    if (h.dead) { await UI.alert('Fim da jornada', `${h.name} descansa agora entre as lanternas de Elarion. Suas armas continuam no Arsenal para o próximo herói.`); E.Game.afterDeath(); return; }
    if (res.adv && E.Adv) E.Adv.add(res.adv, 'batalha');
    if (res.outcome === 'win' && BU.opts.trial && E.Adv) { E.Adv.completeTrial(BU.opts.trial); await UI.alert('⚔ Provação concluída!', `Você venceu a ${U.esc(E.Adv.TRIALS[BU.opts.trial].name)}. Seu Nível de Mundo agora é <b>${E.Adv.wl()}</b>.`); }
    if (levels) await E.Game.levelUp(h, levels);
    U.emit('battle:end', res);
    if (res.outcome === 'win' && res.boss) E.Journal.quests();
  }

  E.BattleUI = BU;
})();
