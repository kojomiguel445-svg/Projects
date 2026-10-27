/* Interações no mundo: NPCs (diálogo estilo Genshin), lojas, baús, ervas, estátuas e objetivos. */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R;
  const IN = {};
  let busy = false;

  IN.run = async (it) => {
    if (busy || !it || E.WG.locked || UI.anyOpen() || document.querySelector('.modal-bg, #dialog')) return;
    // visitante no mundo de outra pessoa: sem baús, objetos de missão nem história do anfitrião
    const CW = E.CoopWorld;
    if (CW && CW.guest && ((it.kind === 'chest' && CW.blocked('chest')) || (it.kind === 'story' && CW.blocked('story')) || (it.kind === 'qinvestigate' && CW.blocked('quest')))) return;
    busy = true;
    try {
      if (it.kind === 'venue' && E.WorldServices) return E.WorldServices.use(it);
      if (it.kind === 'citizen' && E.Crowds) return E.Crowds.talk(it);
      if (it.kind === 'customer' && E.StallLife) return E.StallLife.use(it);
      if (it.kind === 'settlement') return E.Settlements.enter(it.service, it.region || E.WG.world.id);
      if (it.kind === 'campfire') return E.WorldServices ? E.WorldServices.use({...it, action:'cook', service:'food', region:E.WG.world.id}) : E.Sim.openFood({ fire: true });
      if (it.kind === 'npc') await IN.talk(it.id);
      else if (it.kind === 'chest') await IN.chest(it);
      else if (it.kind === 'herb') await IN.herb(it);
      else if (it.kind === 'waypoint') await IN.waypoint();
      else if (it.kind === 'story') await IN.story(it);
      else if (it.kind === 'qinvestigate') await IN.qInvestigate(it);
      else if (it.kind === 'landmark') await IN.landmark(it);
      else if (it.kind === 'lair') await IN.lair(it);
      else if (it.kind === 'fish') E.Fishing.start(it.spot);
      else if (it.kind === 'ore') await IN.ore(it);
      else if (it.kind === 'trade') E.WorldServices ? E.WorldServices.service('market', E.WG.world.id) : E.Trade.open(E.WG.world.id);
      else if (it.kind === 'building') await E.Metro.enter(it.b);
      else if (['cave', 'caveExit', 'challenge', 'domain'].includes(it.kind)) await E.Places.run(it);
      else if (['monument', 'summon', 'statue', 'evlantern'].includes(it.kind)) await E.Wonders.run(it);
      else if (it.kind === 'torch') E.EX3.lightTorch(E.WG.world, it);
    } finally { busy = false; E.HUD.update(); }
  };
  U.on('world:interact', () => { const f = E.HUD.first(); if (f) IN.run(f); });

  // ---------- teste de perícia fora de combate (com dados 3D) ----------
  IN.check = async (sk, dc, label) => {
    const h = E.Store.hero();
    const bonus = C.skillBonus(h, sk);
    let a = U.die(20);
    if (C.species(h).hooks.luck && a === 1) a = U.die(20);
    const total = a + bonus, ok = total >= dc;
    await E.Dice.roll({ dice: [{ s: 20, v: a, theme: 'hero' }], label: `${R.SKILLS[sk].name} · ${label}`, outcome: ok ? 'success' : 'fail',
      html: `<div class="dl-line"><span class="nat ${a === 20 ? 'n20' : a === 1 ? 'n1' : ''}">${a}</span> ${UI.signed(bonus)} = ${total} <span class="vs">vs CD ${dc}</span></div><div class="dl-out ${ok ? 'success' : 'fail'}">${ok ? 'SUCESSO' : 'FALHA'}</div>` });
    E.Dice.hide();
    return ok;
  };

  // ---------- diálogo ----------
  IN.dialog = ({ name, title, lines, options, portrait }) => new Promise((resolve) => {
    E.WG.locked = true;
    E.HUD.show(false);
    let i = 0;
    const el = U.h(`<div id="dialog"><div class="dlg-wrap"><div class="dlg-text"><div class="dlg-name"></div><div class="dlg-title"></div><div class="dlg-line"></div></div><div class="dlg-opts"></div></div></div>`);
    el.querySelector('.dlg-name').textContent = name;
    el.querySelector('.dlg-title').textContent = title || '';
    const line = el.querySelector('.dlg-line'), opts = el.querySelector('.dlg-opts');
    let typing = 0, typedLength = 0;
    const type = (txt) => {
      clearInterval(typing);
      line.textContent = ''; typedLength = 0;
      let k = 0;
      typing = setInterval(() => { typedLength = ++k; line.textContent = txt.slice(0, k); if (k >= txt.length) clearInterval(typing); }, 16);
    };
    const close = (v) => { clearInterval(typing); el.remove(); E.WG.locked = false; E.HUD.show(true); resolve(v); };
    const showOpts = () => {
      opts.innerHTML = '';
      options.forEach((o) => {
        const b = U.h(`<button class="dlg-opt ${o.quest ? 'quest' : ''}"><span class="oi">${o.icon || '💬'}</span>${o.label}</button>`);
        b.onclick = (e) => { e.stopPropagation(); E.Audio.sfx('click'); close(o.id); };
        opts.appendChild(b);
      });
    };
    type(lines[0]);
    if (lines.length === 1) showOpts();
    el.addEventListener('click', () => {
      if (typedLength < lines[i].length) { clearInterval(typing); typedLength = lines[i].length; line.textContent = lines[i]; return; }
      if (i < lines.length - 1) { i++; type(lines[i]); if (i === lines.length - 1) showOpts(); }
    });
    document.getElementById('ui').appendChild(el);
    void portrait;
  });

  IN.talk = async (nid) => {
    const npc = E.WD.NPCS[nid], h = E.Store.hero();
    const q = npc.quest;
    const qs = q ? E.state.quests[q.id] : null;
    const options = [];
    let lines = [U.pick(npc.lines)];
    if (q && !qs) { options.push({ id: 'quest', label: `Missão: ${q.title}`, icon: '!', quest: true }); }
    if (q && qs && qs.state === 'active') {
      if (E.Quests.isComplete(q)) options.push({ id: 'turnin', label: `Entregar: ${q.title}`, icon: '✓', quest: true });
      else lines.push(`Ainda preciso da sua ajuda: ${q.text}`);
    }
    if (npc.chain && E.Chains) {
      const cid = npc.chain, st = E.Chains.get(cid), nx = E.Chains.nextStep(cid);
      if (nx && (!st || !st.active)) options.push({ id: 'chain_new', label: `Missão: ${nx.title}`, icon: '!', quest: true });
      if (st && st.active && !st.done) {
        if (E.Chains.progress(cid).ok) options.push({ id: 'chain_turn', label: `Entregar: ${E.Chains.step(cid).title}`, icon: '✓', quest: true });
        else lines.push(`${E.Chains.step(cid).text} (${E.Chains.goalText(cid)})`);
      }
    }
    if (npc.fisher) options.push({ id: 'fish_shop', label: 'Trocar peixes por prêmios', icon: '🐟' }, { id: 'aquarium', label: 'Visitar o Aquário de Elarion', icon: '🐠' });
    if (npc.miner || npc.smith) options.push({ id: 'miner', label: 'Picaretas e venda de minérios', icon: '⛏' });
    if (npc.shop) options.push({ id: 'shop', label: 'Ver mercadorias', icon: '🛒' }, { id: 'arms', label: 'Comprar armas', icon: '🗡' });
    if (npc.smith) options.push({ id: 'upgrade', label: 'Aprimorar armas', icon: '⬆' }, { id: 'smith', label: 'Refinar armas', icon: '⚒' });
    if (npc.oracle) options.push({ id: 'oracle', label: 'Consultar o Oráculo', icon: '✦' });
    if (E.WG.world.reg.inn && nid === 'aram') options.push({ id: 'inn', label: 'Entrar na estalagem e alugar quarto', icon: '🛏' });
    options.push({ id: 'bye', label: 'Até logo', icon: '👋' });
    const ch = await IN.dialog({ name: npc.name, title: npc.title, lines, options });
    if (ch === 'quest') {
      const acc = await IN.dialog({ name: npc.name, title: npc.title, lines: [q.text, `Recompensa: ${q.reward.xp} XP, ${q.reward.gold || 0} po e ${q.reward.gems || 0} Gemas Estelares${q.reward.item ? ' + ' + R.ITEMS[q.reward.item].name : ''}.`], options: [{ id: 'yes', label: 'Aceito!', icon: '✓', quest: true }, { id: 'no', label: 'Agora não', icon: '✕' }] });
      if (acc === 'yes') { E.Quests.accept(q, nid); E.WG.world.refreshObjectives(); }
    }
    if (ch === 'turnin') {
      const res = E.Quests.turnIn(q);
      if (res) {
        E.Audio.sfx('chest');
        UI.toast(`✓ Missão concluída: ${q.title}`, 'gold big');
        UI.loot('✦', `${res.xp} XP`); if (res.gold) UI.loot('🪙', `${res.gold} po`); if (res.gems) UI.loot('💎', `${res.gems} Gemas Estelares`); if (res.item) UI.loot('🧪', R.ITEMS[res.item].name);
        if (res.levels) E.Game.levelUp(h, res.levels);
        E.WG.world.refreshNpcMarkers();
      }
    }
    if (ch === 'chain_new' || ch === 'chain_turn' || ch === 'fish_shop' || ch === 'aquarium' || ch === 'miner') await E.Places.npcAction(ch, nid, npc);
    if (E.WorldServices && ['shop','arms','smith','upgrade'].includes(ch)) return E.WorldServices.service(ch==='shop'?'general':'smith',E.WG.world.id);
    if (ch === 'shop') IN.shop(npc);
    if (ch === 'smith') E.Arsenal.open({ refineMode: true });
    if (ch === 'arms') E.Armory.open({ title: `Armas de ${npc.name}` });
    if (ch === 'upgrade') E.Armory.open({ tab: 'aprimorar', title: `Forja de ${npc.name}` });
    if (ch === 'oracle') E.Wish.open();
    if (ch === 'inn') await E.Settlements.enter('inn', E.WG.world.id);
  };

  // ---------- loja ----------
  IN.shop = (npc) => {
    if(E.WorldServices)return E.WorldServices.service('general',E.WG.world.id);
    const h = E.Store.hero();
    const el = UI.screen(`🛒 ${npc.name}`, { right: `<span class="chip gold" data-gold>🪙 ${h.gold} po</span>` });
    const body = el.querySelector('.screen-body');
    const stock = ['pocao_cura', 'pocao_maior', 'pocao_superior', 'antitoxina'];
    const draw = () => {
      el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po`;
      body.innerHTML = `<p class="muted" style="color:#5a6378">Preços do Livro do Jogador 2024. Beber uma poção é uma <b>Ação Bônus</b>.</p>`;
      const disc = C.hasFeat(h, 'artesao') ? 0.8 : 1;
      for (const id of stock) {
        const it = R.ITEMS[id], price = Math.round(it.price * disc);
        const row = U.h(`<div class="shop-item"><div class="si">🧪</div><div class="sx"><b>${it.name}</b><small>${it.desc} · Você tem: ${h.inventory[id] || 0}</small></div><button class="btn sm primary"><span class="ico">🪙</span>${price} po</button></div>`);
        row.querySelector('button').onclick = () => {
          if (h.gold < price) return UI.toast('Ouro insuficiente.');
          h.gold -= price; h.inventory[id] = (h.inventory[id] || 0) + 1; E.Audio.sfx('chest'); E.Store.save(); draw();
        };
        body.appendChild(row);
      }
      const gemRow = U.h(`<div class="shop-item"><div class="si">💎</div><div class="sx"><b>Trocar ouro por Gemas Estelares</b><small>100 po → 20 Gemas (o Vendedor sem Sombra adora brilho)</small></div><button class="btn sm dark"><span class="ico">🪙</span>100 po</button></div>`);
      gemRow.querySelector('button').onclick = () => { if (h.gold < 100) return UI.toast('Ouro insuficiente.'); h.gold -= 100; E.state.gems += 20; E.Store.save(); draw(); UI.loot('💎', '20 Gemas Estelares'); };
      body.appendChild(gemRow);
      const armsRow = U.h(`<div class="shop-item"><div class="si">🗡</div><div class="sx"><b>Armas</b><small>Mais de 30 armas: comuns, encantadas da Armaria e focos de conjuração.</small></div><button class="btn sm primary"><span class="ico">→</span>Ver armas</button></div>`);
      armsRow.querySelector('button').onclick = () => E.Armory.open({ title: `Armas · ${npc.name}` });
      body.appendChild(armsRow);
    };
    draw();
    UI.open(el);
  };

  // ---------- baú ----------
  IN.chest = async (it) => {
    const h = E.Store.hero(), w = E.WG.world;
    const tier = it.tier;
    const table = { comum: { gems: [8, 15], gold: [5, 15], potion: 0.15 }, requintado: { gems: [20, 30], gold: [15, 35], potion: 0.35 }, precioso: { gems: [40, 60], gold: [40, 80], potion: 0.6 }, luxuoso: { gems: [80, 120], gold: [80, 150], potion: 1 } }[tier];
    const gems = table.gems[0] + Math.floor(U.rand() * (table.gems[1] - table.gems[0]));
    const gold = table.gold[0] + Math.floor(U.rand() * (table.gold[1] - table.gold[0]));
    // remove o aviso na hora (evita abrir duas vezes) e anima a tampa
    w.removeInteractable(it, true);
    E.Audio.sfx('chest');
    await E.WX.openChest(w, it.obj);
    E.state.gems += gems;
    h.gold += gold;
    UI.loot('💎', `${gems} Gemas Estelares`);
    UI.loot('🪙', `${gold} po`);
    if (U.rand() < table.potion) { const p = tier === 'luxuoso' ? 'pocao_maior' : 'pocao_cura'; h.inventory[p] = (h.inventory[p] || 0) + 1; UI.loot('🧪', R.ITEMS[p].name); }
    if (tier === 'luxuoso' || (tier === 'precioso' && U.rand() < 0.5)) { E.state.seals += 1; UI.loot('🌟', '1 Selo Estelar'); }
    if (tier === 'luxuoso' || (tier === 'precioso' && U.rand() < 0.3)) { E.Forge.addCores(h, 1); UI.loot(E.Forge.CORE_ICON, `1 ${E.Forge.CORE}`); }
    if (tier !== 'comum' && U.rand() < 0.6) { const ore = U.pick(tier === 'requintado' ? ['ferro', 'prata'] : ['prata', 'cristal']); const n = 1 + Math.floor(U.rand() * 2); const o = E.Life.data(h).ores; o[ore] = (o[ore] || 0) + n; UI.loot(E.L.ORES[ore].icon, `${E.L.ORES[ore].name} ×${n}`); }
    E.state.world.opened[w.id] = E.state.world.opened[w.id] || [];
    E.state.world.opened[w.id].push(it.id);
    if (E.Life) E.Life.ev('chest', 1, { region: E.WG.world.id });
    if (E.Adv) E.Adv.add(E.Adv.XP.chest[tier] || 10, 'baú');
    // fragmentos de domínio nos baús melhores
    if (tier !== 'comum') { const fk = tier === 'luxuoso' ? 'frag3' : tier === 'precioso' ? 'frag2' : 'frag1'; const n = tier === 'luxuoso' ? 2 : 1; E.Forge.addFrag(fk, n); UI.loot(E.Forge.FRAGS[fk].icon, `${E.Forge.FRAGS[fk].name} ×${n}`); }
    if (E.CoopWorld) E.CoopWorld.broadcastState();
    E.Store.save();
  };

  // ---------- mineração ----------
  IN.ore = async (it) => {
    const h = E.Store.hero(), w = E.WG.world, o = it.node;
    const why = E.Life.canMine(h, o.ore);
    if (why) { UI.toast('⛏ ' + why); E.Audio.sfx('fail'); return; }
    w.removeInteractable(it, true);
    const g = o.obj.group;
    E.Audio.sfx('impact');
    for (let k = 0; k < 3; k++) { g.position.x = o.x + 0.12; await U.wait(90); g.position.x = o.x - 0.12; await U.wait(90); E.Audio.sfx('hit'); }
    g.position.x = o.x;
    const res = E.Life.mine(h, w.reg.biome, o);
    for (const [id, n] of Object.entries(res.got)) UI.loot(E.L.ORES[id].icon, `${E.L.ORES[id].name} ×${n}`);
    if (res.gem) UI.loot('💎', `Gema Bruta! +${res.gem} Gemas Estelares`);
    w.scene.remove(g);
    E.state.world.mined = E.state.world.mined || {};
    E.state.world.mined[`${w.id}:${o.i}`] = Date.now();
    w.colliders = w.colliders.filter((c) => !(c.x === o.x && c.z === o.z));
    w.buildColliderGrid();
    E.Store.save();
  };

  // ---------- covil do chefe ----------
  IN.lair = async (it) => {
    const h = E.Store.hero(), def = E.M.MONSTERS[it.key];
    const danger = h.level < it.lvl;
    const esc = (def.escort || []).reduce((m, k) => { m[k] = (m[k] || 0) + 1; return m; }, {});
    const escTxt = Object.entries(esc).map(([k, n]) => `${n > 1 ? n + ' × ' : ''}${E.M.MONSTERS[k].name}`).join(', ');
    const go = await UI.modal({
      title: def.title || def.name,
      html: `<div style="text-align:center"><img src="${E.SP.portrait(E.SP.monster(it.key), 3)}" style="max-width:180px;max-height:160px;image-rendering:pixelated" alt=""><p style="font-style:italic;color:#6a4a8a;margin:4px 0">${U.esc(def.name)} (Manual dos Monstros)${escTxt ? ` · com ${U.esc(escTxt)}` : ''}</p><p style="font-size:13px;color:#4a5366">${U.esc(def.desc)}</p><p style="font-size:13px"><b>ND ${E.R.crLabel(def.cr)}</b> · CA ${def.ac} · ${def.group ? `<b>Feito para grupos</b>: chame amigos no Cooperativo (sozinho, só no Nv. ${it.lvl} com armas fortes)` : `Recomendado sozinho: <b>Nv. ${it.lvl}+</b> (em grupo online, bem mais fácil)`}${danger ? '<br><span style="color:#c0392b;font-weight:800">Muito perigoso para o seu nível!</span>' : ''}</p><p style="font-size:12px;color:#5a6378">Recompensas: muito XP, +150 💎, ouro e <b>2 Selos Estelares 🌟</b>. Volta a aparecer 20 minutos depois de derrotado.</p></div>`,
      buttons: [{ label: 'Agora não', value: false }, { label: 'Desafiar!', value: true, cls: 'primary' }],
    });
    if (!go) return;
    E.Game.startBattle([it.key, ...(def.escort || [])], { lair: true });
  };

  // ---------- ervas ----------
  IN.herb = async (it) => {
    const h = E.Store.hero(), w = E.WG.world;
    const mat = w.reg.herb;
    const extra = E.Life ? E.Life.onHerb(h) : 0;
    h.materials[mat] = (h.materials[mat] || 0) + 1 + extra;
    if (extra) UI.loot('🌿', `Colheita dupla! +1 ${mat}`);
    E.state.world.gathered[w.id] = E.state.world.gathered[w.id] || {};
    E.state.world.gathered[w.id][it.id] = Date.now();
    E.Audio.sfx('heal');
    UI.loot('🌿', `${mat} ×1`);
    w.removeInteractable(it);
    E.Quests.onGather(mat);
    // a primeira erva também serve à história (capítulo 1), se estiver no lugar certo
    E.Store.save();
    w.refreshNpcMarkers();
  };

  // ---------- estátua de teleporte (descanso) ----------
  IN.waypoint = async () => {
    const h = E.Store.hero();
    const lastLong = h.lastLongRest || 0;
    const cd = 6 * 60 * 1000 - (Date.now() - lastLong);
    const opts = [
      { id: 'short', label: `Descanso Curto · gastar Dado de Vida (${h.level - (h.hdUsed || 0)}/${h.level} d${C.cls(h).hd})`, icon: '☕' },
      { id: 'long', label: 'Dormir: procurar pousada ou casa', icon: '🌙' },
      ...((E.WG.world.statueObjs || []).some((s) => s.on) ? [{ id: 'tp', label: 'Viajar para outra estátua desta região', icon: '✦' }] : []),
      { id: 'map', label: 'Teletransportar (abrir mapa)', icon: '🗺' },
      ...(E.Chains && E.WG.world.extra && E.WG.world.extra.lumes ? [{ id: 'lumes', label: `Oferecer Lumes (${E.Chains.lumesIn(E.WG.world.id).length}/${E.CT.LUMES_PER_REGION} encontrados)`, icon: '✨' }] : []),
      { id: 'bye', label: 'Sair', icon: '👋' },
    ];
    const ch = await IN.dialog({ name: 'Estátua de Teleporte', title: E.WG.world.reg.name, lines: ['A estátua pulsa com luz azul. Aqui você pode descansar ou viajar para outras estátuas que já despertou.'], options: opts });
    if (ch === 'short') await IN.shortRest();
    if (ch === 'long') E.Settlements.open(E.WG.world.id, 'pousada');
    if (ch === 'tp') await E.Wonders.teleportMenu('c');
    if (ch === 'map') E.Wonders.regionMap();
    if (ch === 'lumes') await E.Places.offerLumes();
  };
  IN.shortRest = async () => {
    const h = E.Store.hero();
    C.shortRest(h);
    let healed = 0;
    while (h.hp < C.maxHp(h)) {
      const r = C.shortRestHeal(h);
      if (!r) break;
      healed += r.heal;
      await E.Dice.roll({ dice: [{ s: C.cls(h).hd, v: r.roll, theme: 'heal' }], label: 'Dado de Vida', quick: true, outcome: 'heal', html: `<div class="dl-line">${r.roll} ${UI.signed(C.mod(h, 'con'))} = <b>${r.heal}</b> PV</div>` });
      if (h.hp >= C.maxHp(h) || (h.hdUsed || 0) >= h.level) break;
    }
    E.Dice.hide();
    UI.toast(`☕ Descanso Curto: +${healed} PV. Recursos de descanso curto recuperados.`);
    E.Store.save();
    E.HUD.update();
  };
  IN.longRest = async (inn) => {
    const h = E.Store.hero();
    if (E.Settlements) { if (!E.Settlements.canSleep(h)) { UI.toast('Para dormir, entre em um quarto alugado ou na sua casa e use a cama.'); return E.Settlements.open(E.WG.world.id, 'pousada'); } return E.Settlements.sleep(h); }
    const fade = U.h('<div class="flash" style="background:#0b0f1e;opacity:0;transition:opacity .6s"></div>');
    document.body.appendChild(fade);
    requestAnimationFrame(() => (fade.style.opacity = 1));
    await U.wait(700);
    C.longRest(h);
    h.lastLongRest = Date.now();
    E.Store.save();
    E.HUD.update();
    E.WG.world.heroShadow && E.WG.world.refreshHeroFrames();
    fade.style.opacity = 0;
    setTimeout(() => fade.remove(), 700);
    UI.toast(inn ? '🛏 Uma noite tranquila na estalagem. PV, espaços de magia e recursos restaurados.' : '🌙 Descanso Longo concluído. PV, espaços de magia e recursos restaurados.', 'gold');
  };

  // ---------- objetivo da história ----------
  IN.story = async (it) => {
    const ch = E.Quests.chapter(), h = E.Store.hero(), w = E.WG.world;
    if (!ch) return;
    if (ch.goal.type === 'collect') {
      h.materials[ch.goal.target] = (h.materials[ch.goal.target] || 0) + 1;
      UI.loot('🌿', `${ch.goal.target} luminosa`);
      E.Audio.sfx('heal');
      await IN.dialog({ name: 'Morgana', title: 'Sua guia', lines: ['Olha só! Essa erva brilha igual à última lanterna. Acho que encontramos o que o bosque queria nos mostrar…'], options: [{ id: 'ok', label: 'Continuar', icon: '✦' }] });
      E.Quests.storyReady();
      w.refreshObjectives();
    } else if (ch.goal.type === 'investigate') {
      const ok = await IN.check(ch.goal.skill, ch.goal.dc, 'Selo marcado');
      if (ok) {
        await IN.dialog({ name: 'Morgana', title: 'Sua guia', lines: ['A inscrição fala da Coroa das Nove Vozes… e de alguém que a usa no Abismo. Precisamos decidir em quem confiar.'], options: [{ id: 'ok', label: 'Continuar', icon: '✦' }] });
        E.Quests.storyReady();
        w.refreshObjectives();
      } else {
        UI.toast('Algo se mexe entre as ruínas… você chamou atenção!');
        const near = w.camps.filter((c) => !c.dead).sort((a, b) => Math.hypot(a.x - it.x, a.z - it.z) - Math.hypot(b.x - it.x, b.z - it.z))[0];
        if (near) { E.WG.locked = true; U.emit('world:encounter', near); }
      }
    } else if (ch.goal.type === 'boss') {
      const hurt = h.hp < C.maxHp(h) * 0.6 ? ` <b style="color:#c0392b">Você está ferido (${h.hp}/${C.maxHp(h)} PV) — descanse numa Estátua de Teleporte antes!</b>` : '';
      const go = await UI.confirm('A Soberana das Nove Sombras', `O trono vazio aguarda. Recomendado: nível 6 (você é nível ${h.level}). A última lanterna concederá uma bênção de PV temporários.${hurt} Deseja enfrentá-la?`, 'Enfrentar', 'Ainda não');
      if (go) E.Game.startBattle(['soberana', ...(E.M.MONSTERS.soberana.escort || [])], { boss: true });
    }
  };

  // marco da região: recompensa única ao contemplar (como os panoramas do Genshin)
  IN.landmark = async (it) => {
    const w = E.WG.world;
    await IN.dialog({ name: it.name, title: w.reg.name, lines: [it.lore, 'Morgana: “Que vista! Vou anotar isso no diário de viagem.”'], options: [{ id: 'ok', label: 'Continuar', icon: '✦' }] });
    E.state.world.landmarks = E.state.world.landmarks || {};
    E.state.world.landmarks[w.id] = true;
    E.state.gems += 40;
    E.Audio.sfx('chest');
    UI.loot('💎', '40 Gemas Estelares');
    UI.toast(`✦ Ponto de referência descoberto: ${it.name}`, 'gold');
    w.interactables = w.interactables.filter((x) => x !== it);
    w.nearKey = null;
    E.Store.save();
  };

  IN.qInvestigate = async (it) => {
    const q = it.quest;
    const ok = await IN.check(q.skill, q.dc, q.title);
    if (ok) {
      E.state.quests[q.id].found = true;
      E.Store.save();
      UI.toast(`📜 ${q.title}: pista encontrada! Volte a quem lhe deu a missão.`, 'gold');
      E.WG.world.refreshObjectives();
    } else UI.toast('Você não encontra nada desta vez. Tente de novo.');
  };

  E.Interact = IN;
})();
