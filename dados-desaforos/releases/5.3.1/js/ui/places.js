/* Lugares e atividades da v4: grutas, Corrida das Lanternas, Domínios, Lumes, o Mestre Dendê (trocas e Aquário)
   e a loja de picaretas dos ferreiros e mineiros. */
(() => {
  const U = E.U, UI = E.UI;
  const PL = {};
  const hero = () => E.Store.hero();
  const fight = (keys, opts) => new Promise((resolve) => { const off = U.on('battle:end', (res) => { off(); resolve(res); }); E.Game.startBattle(keys, opts); });
  const lootAll = (got) => { for (const [ic, t] of got || []) UI.loot(ic, t); };
  const say = (npc, lines, options) => E.Interact.dialog({ name: npc.name, title: npc.title, lines, options });

  PL.run = async (it) => {
    if (it.kind === 'cave') return PL.enterCave(it);
    if (it.kind === 'caveExit') return PL.leaveCave();
    if (it.kind === 'challenge') return PL.challenge();
    if (it.kind === 'domain') return PL.domain();
  };

  // ---------------------------------------------------------------- grutas
  PL.enterCave = async (it) => {
    const h = hero(), w = E.WG.world, cave = E.WD.CAVES[it.cave], d = E.Life.data(h);
    const pk = E.L.PICKAXES[d.pick];
    const ores = [...new Set(cave.ores)].map((o) => `${E.L.ORES[o].icon} ${E.L.ORES[o].name}`).join(', ');
    const ok = await UI.confirm(`⛏ ${cave.name}`, `<p>Minérios desta gruta: <b>${ores}</b>.</p><p>Sua ferramenta: <b>${d.pick ? pk.name : 'nenhuma picareta'}</b>${d.pick ? '' : ' — compre uma com um ferreiro ou mineiro antes de minerar!'}.</p><p class="muted">Lá dentro há monstros (recomendado nível ${cave.level}+), baús e um lago com peixes cegos.</p>`, 'Entrar', 'Agora não');
    if (!ok) return;
    if (E.CoopWorld && E.CoopWorld.guest && !E.CoopWorld.canTravel(w.id)) return;
    E.state.world.caveReturn = { region: w.id, x: w.hero.x, z: w.hero.z };
    await E.Game.travel(it.cave, { quiet: true });
  };
  PL.leaveCave = async () => {
    const w = E.WG.world; if (!w || !w.cave) return;
    const parent = w.reg.parent, ret = E.state.world.caveReturn;
    await E.Game.travel(parent, { quiet: true });
    const w2 = E.WG.world;
    const p = ret && ret.region === parent ? ret : w2.extra && w2.extra.cave ? { x: w2.extra.cave.x + 3, z: w2.extra.cave.z + 3 } : null;
    if (p) { w2.hero.x = p.x; w2.hero.z = p.z; w2.hero.y = w2.height(p.x, p.z); }
    E.HUD.update();
  };

  // ---------------------------------------------------------------- Corrida das Lanternas
  let raceEl = null;
  PL.challenge = async () => {
    const w = E.WG.world; if (w.race) return;
    const done = E.Chains.challengeDoneToday(w.id), best = (E.state.challengeBest || {})[w.id];
    const C = E.CT.CHALLENGE;
    const ch = await E.Interact.dialog({ name: 'Sino das Lanternas', title: w.reg.name, lines: [`Toque o sino e passe pelas ${C.rings} lanternas, uma de cada vez, em ${C.time} segundos. Corra (botão de corrida) e pule obstáculos!${best ? ` Seu recorde aqui: ${best}s.` : ''}`, done ? 'Você já ganhou o prêmio de hoje aqui — mas pode correr de novo pelo recorde.' : `Prêmio de hoje: ${C.reward.gems} 💎, ${C.reward.gold} po e EXP de Aventura.`], options: [{ id: 'go', label: 'Tocar o sino!', icon: '🔔' }, { id: 'bye', label: 'Agora não', icon: '👋' }] });
    if (ch !== 'go') return;
    E.Audio.sfx('wish');
    if (w.altarBell) { const b = w.altarBell; let k = 0; const iv = setInterval(() => { b.rotation.z = Math.sin(k++ * 0.9) * 0.4 * Math.max(0, 1 - k / 14); if (k > 14) clearInterval(iv); }, 40); }
    E.WX.startChallenge(w);
    raceEl = U.h('<div class="race-hud"><div class="rh-t">🔔 Corrida das Lanternas</div><div class="rh-n"></div><div class="rh-bar"><i></i></div></div>');
    document.body.appendChild(raceEl);
  };
  U.on('challenge:tick', (s) => {
    if (!raceEl) return;
    raceEl.querySelector('.rh-n').textContent = `Lanterna ${Math.min(s.i + 1, s.n)}/${s.n} · ${s.left.toFixed(1)}s`;
    raceEl.querySelector('.rh-bar i').style.width = `${(s.left / E.CT.CHALLENGE.time) * 100}%`;
    raceEl.classList.toggle('low', s.left < 10);
  });
  const endRaceHud = () => { if (raceEl) { raceEl.remove(); raceEl = null; } };
  U.on('challenge:done', async (secs) => {
    endRaceHud();
    const w = E.WG.world;
    const r = E.Chains.finishChallenge(w.id, secs);
    E.Audio.sfx('levelup');
    UI.toast(`🏁 Corrida concluída em ${secs}s!${r.rec ? ' Novo recorde!' : ''}`, 'gold big');
    lootAll(r.got);
    E.HUD.update();
  });
  U.on('challenge:fail', () => { endRaceHud(); E.Audio.sfx('fail'); UI.toast('⏳ O tempo acabou! As lanternas se apagaram. Tente de novo no sino.'); });
  U.on('world:travel', () => { const w = E.WG.world; if (w && w.race) E.WX.endChallenge(w); endRaceHud(); });

  // ---------------------------------------------------------------- Domínios
  PL.domain = async () => {
    const h = hero(), w = E.WG.world, left = E.Chains.domainLeft();
    const tier = E.CT.domainTier(h.level), fr = E.Forge.FRAGS['frag' + tier];
    const ch = await E.Interact.dialog({ name: 'Domínio dos Fragmentos', title: w.reg.name, lines: [`Um portal para um bolsão do Plano Astral. Lá dentro, ${E.CT.DOMAIN.waves} ondas de criaturas guardam Fragmentos de Lanterna — o material para ascender armas.`, `Recompensa: ${fr.icon} ${fr.name} ×3–4 (pelo seu nível), ouro e EXP de Aventura. Restam ${left}/${E.CT.DOMAIN.perDay} entradas hoje.`], options: left > 0 ? [{ id: 'go', label: 'Entrar no Domínio', icon: '🌀' }, { id: 'bye', label: 'Agora não', icon: '👋' }] : [{ id: 'bye', label: 'Volte amanhã', icon: '👋' }] });
    if (ch !== 'go') return;
    const lvl = E.Adv ? E.Adv.encounterLevel(h.level) : h.level;
    for (let i = 0; i < E.CT.DOMAIN.waves; i++) {
      const enc = E.EN.build(E.WD.home(w.id), lvl, i === 0 ? 'moderada' : 'alta');
      const res = await fight(enc.monsters, { domain: true });
      if (res.outcome !== 'win') { UI.toast(`O Domínio expulsa você na onda ${i + 1}. Recupere-se e tente de novo.`, 'big'); return; }
      if (i < E.CT.DOMAIN.waves - 1) {
        const heal = Math.ceil(E.C.maxHp(h) * 0.3); h.hp = Math.min(E.C.maxHp(h), h.hp + heal);
        await UI.alert(`Onda ${i + 1} vencida!`, `A névoa astral te revigora: +${heal} PV. Vem aí a última onda!`, 'Lutar!');
      }
    }
    const got = E.Chains.domainReward();
    E.Audio.sfx('levelup');
    await UI.modal({ title: '🌀 Domínio concluído!', html: `<div style="text-align:center"><p>Os guardiões se dissolvem em luz e deixam:</p>${got.map(([ic, t]) => `<p><b>${ic} ${U.esc(t)}</b></p>`).join('')}<p class="muted">Entradas restantes hoje: ${E.Chains.domainLeft()}</p></div>`, buttons: [{ label: 'Ótimo!', value: true, cls: 'primary' }] });
    E.HUD.update();
  };

  // ---------------------------------------------------------------- Lumes
  PL.offerLumes = async () => {
    const w = E.WG.world, have = E.Chains.lumesIn(w.id).length, done = E.Chains.offerState(w.id);
    const tiers = E.CT.LUME_OFFER;
    const got = E.Chains.offer(w.id);
    if (got.length) { E.Audio.sfx('chest'); UI.toast('✨ A estátua aceita os Lumes e brilha mais forte!', 'gold big'); lootAll(got); }
    else {
      const nx = tiers[done];
      UI.alert('✨ Lumes', nx ? `Você encontrou <b>${have}</b> Lumes nesta região. A estátua dá a próxima recompensa com <b>${nx.n}</b>. Procure as luzinhas flutuantes — algumas estão no alto e só pulando dá para pegar!` : 'A estátua já recebeu todos os Lumes desta região. Obrigada!');
    }
  };

  // ---------------------------------------------------------------- NPCs: missões em cadeia, trocas, Aquário, picaretas
  PL.npcAction = async (ch, nid, npc) => {
    const h = hero(), cid = npc.chain;
    if (ch === 'chain_new') {
      const stp = E.Chains.nextStep(cid); if (!stp) return;
      const r = stp.reward;
      const rw = [r.xp && `${r.xp} XP`, r.gold && `${r.gold} po`, r.gems && `${r.gems} 💎`, r.escama && `${r.escama} Escamas Iridescentes`, r.weapon && E.W.CATALOG[r.weapon].name, r.rod && E.L.RODS[r.rod].name, r.recipe && 'uma receita exclusiva', r.lbait && `${r.lbait} Iscas Lendárias`, r.bait && `${r.bait} iscas`, r.frags && 'Fragmentos de Lanterna', r.ores && 'minérios', r.items && 'itens'].filter(Boolean).join(', ');
      const acc = await say(npc, [stp.text, `Recompensa: ${rw}.`], [{ id: 'yes', label: 'Pode deixar!', icon: '✓', quest: true }, { id: 'no', label: 'Depois', icon: '👋' }]);
      if (acc === 'yes') { E.Chains.accept(cid); E.HUD.update(); }
    }
    if (ch === 'chain_turn') {
      const res = E.Chains.turnIn(cid);
      if (!res) return;
      E.Audio.sfx('chest');
      UI.toast('✓ Missão concluída!', 'gold big');
      lootAll(res.got);
      if (res.done) await say(npc, [res.done], [{ id: 'ok', label: res.finished ? 'Até a próxima!' : 'O que mais?', icon: '💬' }]);
      if (res.levels) E.Game.levelUp(h, res.levels);
      if (E.WG.world) E.WG.world.refreshNpcMarkers();
    }
    if (ch === 'fish_shop') PL.fishShop(npc);
    if (ch === 'aquarium') PL.aquarium();
    if (ch === 'miner') PL.minerShop(npc);
  };

  // troca de peixes com o Mestre Dendê
  PL.FISH_SHOP = [
    { id: 'bait', name: 'Iscas de Minhoca ×5', icon: '🪱', pts: 8, give: (d) => { d.bait += 5; } },
    { id: 'lbait', name: 'Isca Lendária de Dendê', icon: '🌶', pts: 60, give: (d) => { d.lbait += 1; } },
    { id: 'escama', name: 'Escama Iridescente', icon: '🐚', pts: 40, give: () => E.Life.addEscama(1), desc: 'Material de ascensão de armas (fases 3 a 6).' },
    { id: 'fisgada', name: 'A Fisgada (cópia para refinar)', icon: '🔱', pts: 220, need: () => E.state.weapons.some((w) => w.id === 'fisgada'), give: () => E.Store.addWeapon('fisgada'), desc: 'Só depois de ganhar A Fisgada na missão do Mestre Dendê.' },
    { id: 'ore', name: 'Caixa de Minérios (3 Ferro + 1 Prata)', icon: '🪨', pts: 30, give: (d) => { d.ores.ferro = (d.ores.ferro || 0) + 3; d.ores.prata = (d.ores.prata || 0) + 1; } },
  ];
  PL.fishShop = (npc) => {
    const h = hero(), d = E.Life.data(h);
    const el = UI.screen(`🐟 Trocas de ${npc.name}`, { right: '<span class="chip gold" data-pts></span>' });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      el.querySelector('[data-pts]').textContent = `🎫 ${d.fishPts} vales`;
      body.innerHTML = '<p class="muted tr-tip">“Me dê seus peixes, meu rei, que eu te dou vale. Com vale você leva o que quiser da minha banca!” — peixes raros valem bem mais.</p><h3 class="pl-h">Banca do Dendê</h3>';
      for (const it of PL.FISH_SHOP) {
        const locked = it.need && !it.need();
        const row = U.h(`<div class="shop-item"><div class="si">${it.icon}</div><div class="sx"><b>${U.esc(it.name)}</b><small>${U.esc(it.desc || '')}${locked ? ' (bloqueado)' : ''}</small></div><button class="btn sm primary" ${d.fishPts >= it.pts && !locked ? '' : 'disabled'}>🎫 ${it.pts}</button></div>`);
        row.querySelector('button').onclick = () => { if (d.fishPts < it.pts) return; d.fishPts -= it.pts; it.give(d); E.Store.save(); E.Audio.sfx('chest'); UI.loot(it.icon, it.name); draw(); };
        body.appendChild(row);
      }
      body.appendChild(U.h('<h3 class="pl-h">Trocar peixes por vales</h3>'));
      const fish = Object.entries(d.fish).filter(([, n]) => n > 0).sort((a, b) => (E.L.FISH[b[0]] || {}).r - (E.L.FISH[a[0]] || {}).r);
      if (!fish.length) body.appendChild(U.h('<p class="muted tr-tip">Você não tem peixes agora. Vá pescar!</p>'));
      for (const [id, n] of fish) {
        const f = E.L.FISH[id]; if (!f) continue;
        const pts = E.Life.fishPoints(f);
        const row = U.h(`<div class="shop-item"><img class="fish-ic" src="${E.Fishing.art(f, 2)}" alt=""><div class="sx"><b>${U.esc(f.name)} ×${n}</b><small>${f.legend ? '✦ Lendário' : '★'.repeat(f.r)} · ${pts} vales cada${E.Life.data(h).aqua[id] ? '' : ' · ainda não está no Aquário'}</small></div><button class="btn sm dark">Trocar 1</button></div>`);
        row.querySelector('button').onclick = async () => {
          if (f.r >= 4 && !E.Life.data(h).aqua[id] && !(await UI.confirm('Peixe raro', `${f.name} ainda não está no Aquário. Trocar mesmo assim?`, 'Trocar', 'Cancelar'))) return;
          const p = E.Life.tradeFish(h, id, 1); if (p) { UI.toast(`🎫 +${p} vales`); draw(); }
        };
        body.appendChild(row);
      }
    };
    draw();
    UI.open(el);
  };

  // Aquário de Elarion: um tanque por lugar do mapa
  const AQ_NAMES = () => Object.assign(Object.fromEntries(Object.entries(E.WD.REGIONS).map(([id, r]) => [id, r.name])), { grutas: 'Lagos das Grutas' });
  PL.aquarium = () => {
    const h = hero(), d = E.Life.data(h);
    let tab = Object.keys(E.L.AQUARIUM)[0];
    const el = UI.screen('🐠 Aquário de Elarion', { right: '<span class="chip gold" data-aq></span>' });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      const all = new Set(Object.values(E.L.AQUARIUM).flat());
      el.querySelector('[data-aq]').textContent = `${[...all].filter((id) => d.aqua[id]).length}/${all.size} peixes`;
      const names = AQ_NAMES();
      body.innerHTML = '<p class="muted tr-tip">Cada lugar do mapa tem um tanque com os peixes mais raros de lá — inclusive o LENDÁRIO da região. Doe um exemplar de cada para completar o tanque e ganhar Gemas, ouro e Escamas Iridescentes. Lendários pedem Vara de Carvalho ou Isca Lendária, e alguns só aparecem de dia ou à noite.</p>';
      const tabs = U.h('<div class="aq-tabs"></div>');
      for (const rid of Object.keys(E.L.AQUARIUM)) {
        const list = E.L.AQUARIUM[rid], n = list.filter((id) => d.aqua[id]).length;
        const b = U.h(`<button class="${rid === tab ? 'on' : ''} ${d.aquaDone[rid] ? 'done' : ''}">${U.esc(names[rid] || rid)} <small>${n}/${list.length}</small></button>`);
        b.onclick = () => { tab = rid; draw(); };
        tabs.appendChild(b);
      }
      body.appendChild(tabs);
      const tank = U.h(`<div class="aq-tank ${d.aquaDone[tab] ? 'done' : ''}"><div class="aq-water"></div><div class="aq-grid"></div></div>`);
      const grid = tank.querySelector('.aq-grid');
      for (const id of E.L.AQUARIUM[tab]) {
        const f = E.L.FISH[id]; if (!f) continue;
        const inTank = !!d.aqua[id], have = (d.fish[id] || 0) > 0, seen = !!d.dex[id];
        const when = f.when ? (f.when === 'noite' ? '🌙 só à noite' : '☀ só de dia') : '';
        const card = U.h(`<div class="aq-fish ${inTank ? 'in' : ''} ${f.legend ? 'legend' : ''}"><div class="af-img">${seen ? `<img src="${E.Fishing.art(f, 3)}" alt="">` : '<span class="af-q">?</span>'}</div><b>${seen ? U.esc(f.name) : '???'}</b><small>${f.legend ? '✦ LENDÁRIO' : '★'.repeat(f.r)}${when ? ' · ' + when : ''}</small>${inTank ? `<small class="af-rec">No tanque · ${d.aqua[id]} cm</small>` : have ? '<button class="btn sm primary">Doar</button>' : `<small class="af-hint">${seen ? 'Pesque outro para doar' : f.region ? `Pesque em ${U.esc(names[f.region] || f.region)}` : 'Ainda não pescado'}</small>`}</div>`);
        const b = card.querySelector('button');
        if (b) b.onclick = () => {
          const r = E.Life.donate(h, id);
          if (typeof r === 'string') return UI.toast(r);
          E.Audio.sfx('chest'); UI.toast(`🐠 ${f.name} agora nada no Aquário!`, 'gold');
          for (const rid of r.done) { const rw = E.L.AQUA_REWARD; UI.toast(`🏆 Tanque completo: ${names[rid] || rid}!`, 'gold big'); UI.loot('💎', `${rw.gems} Gemas`); UI.loot('🪙', `${rw.gold} po`); UI.loot('🐚', `Escama Iridescente ×${rw.escama}`); }
          draw();
        };
        grid.appendChild(card);
      }
      body.appendChild(tank);
      if (d.aquaDone[tab]) body.appendChild(U.h('<p class="aq-done">🏆 Tanque completo! Os peixes daqui nadam felizes.</p>'));
    };
    draw();
    UI.open(el);
  };

  // picaretas e venda de minérios (ferreiros e mineiros)
  PL.minerShop = (npc) => {
    const h = hero(), d = E.Life.data(h);
    const el = UI.screen(`⛏ ${npc.name}`, { right: '<span class="chip gold" data-gold></span>' });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po`;
      body.innerHTML = `<p class="muted tr-tip">Para minerar, compre uma picareta e entre numa gruta (cada região tem a sua, marcada no mapa com ⛏). Cada picareta abre um tipo de veio. Depois venda o que sobrar aqui — ou use os minérios para subir o nível das armas na forja.</p><h3 class="pl-h">Picaretas</h3>`;
      E.L.PICKAXES.forEach((pk, i) => {
        if (!i) return;
        const owned = d.pick >= i;
        const cost = `${pk.gold} po${pk.ore ? ' + ' + Object.entries(pk.ore).map(([o, n]) => `${n} ${E.L.ORES[o].name}`).join(', ') : ''}`;
        const row = U.h(`<div class="shop-item"><div class="si">${pk.icon}</div><div class="sx"><b>${pk.name}</b><small>${pk.desc}${owned ? '' : ' · ' + cost}</small></div>${owned ? '<span class="chip">✔ Sua</span>' : `<button class="btn sm primary" ${i === d.pick + 1 ? '' : 'disabled'}>Comprar</button>`}</div>`);
        const b = row.querySelector('button');
        if (b) b.onclick = () => { const err = E.Life.buyPick(h, i); if (err) return UI.toast(err); E.Audio.sfx('levelup'); UI.toast(`⛏ ${pk.name}!`, 'gold'); draw(); };
        body.appendChild(row);
      });
      body.appendChild(U.h('<h3 class="pl-h">Vender minérios</h3>'));
      let any = false;
      for (const [o, def] of Object.entries(E.L.ORES)) {
        const n = d.ores[o] || 0; if (!n) continue; any = true;
        const p = E.Life.orePrice(h, o);
        const row = U.h(`<div class="shop-item"><div class="si">${def.icon}</div><div class="sx"><b>${def.name} ×${n}</b><small>${p} po cada · também serve para subir o nível das armas</small></div><button class="btn sm dark" data-n="1">Vender 1</button><button class="btn sm dark" data-n="all">Todos</button></div>`);
        row.querySelectorAll('button').forEach((b) => { b.onclick = () => { const k = b.dataset.n === 'all' ? n : 1; const g = E.Life.sellOre(h, o, k); if (g) { E.Audio.sfx('chest'); UI.toast(`🪙 +${g} po`); } draw(); }; });
        body.appendChild(row);
      }
      if (!any) body.appendChild(U.h('<p class="muted tr-tip">Você não tem minérios. A gruta mais perto espera por você!</p>'));
    };
    draw();
    UI.open(el);
  };

  E.Places = PL;
})();
