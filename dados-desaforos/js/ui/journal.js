/* Missões, inventário, bestiário, heróis, regras e ajustes. */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R, M = E.M;
  const J = {};

  // ---------------- Missões ----------------
  J.quests = () => {
    const el = UI.screen('Missões');
    const body = el.querySelector('.screen-body');
    let sel = 'story';
    const draw = () => {
      const st = E.state.story, ch = E.Quests.chapter();
      const items = [{ id: 'story', t: st.complete ? '✧ Epílogo de Elarion' : `✧ Cap. ${st.chapter + 1}: ${ch.title}`, s: st.complete ? 'História concluída' : st.ready ? 'Pronto para decidir!' : ch.mission }];
      if (E.Chains) for (const c of E.Chains.list()) items.push({ id: 'chain:' + c.id, t: `📜 ${c.step.title}`, s: E.Chains.progress(c.id).ok ? 'Pronta para entregar' : E.Chains.goalText(c.id) });
      for (const [qid, s] of Object.entries(E.state.quests)) { const q = E.Quests.find(qid); if (q) items.push({ id: qid, t: `📜 ${q.title}`, s: s.state === 'done' ? 'Concluída' : E.Quests.isComplete(q) ? 'Pronta para entregar' : q.n ? `${s.progress}/${q.n}` : 'Em andamento', done: s.state === 'done' }); }
      body.innerHTML = '<div class="two"><div class="list"></div><div class="qd" style="overflow:auto"></div></div>';
      const list = body.querySelector('.list');
      for (const it of items) {
        const b = U.h(`<button class="li-item ${sel === it.id ? 'on' : ''} ${it.done ? 'done' : ''}"><div class="lt">${U.esc(it.t)}</div><div class="ls">${U.esc(it.s)}</div></button>`);
        b.onclick = () => { sel = it.id; draw(); };
        list.appendChild(b);
      }
      if (items.length === 1) list.appendChild(U.h('<p style="font-size:13px;color:#5a6378">Converse com os habitantes marcados com <b style="color:#c99a4a">!</b> para receber missões secundárias.</p>'));
      const qd = body.querySelector('.qd');
      if (sel === 'story') {
        if (st.complete) {
          const f = st.flags[st.flags.length - 1];
          qd.innerHTML = `<div class="card"><div class="kicker" style="color:#b8862a">EPÍLOGO</div><h3 style="font-family:var(--display);margin:6px 0">Crônicas de Elarion</h3><p style="line-height:1.6">${E.WD.EPILOGUE[f] || ''}</p><p style="font-size:13px;color:#5a6378">Escolhas: ${st.flags.map((x) => x.replaceAll('_', ' ')).join(' · ')}</p><p style="font-size:13px">A história principal terminou, mas Elarion continua viva: explore, complete missões e colecione armas lendárias.</p></div>`;
        } else {
          const reg = E.WD.REGIONS[ch.region];
          qd.innerHTML = `<div class="card"><div class="kicker" style="color:#b8862a">CAPÍTULO ${st.chapter + 1} DE ${E.WD.STORY.length}</div><h3 style="font-family:var(--display);margin:6px 0">${ch.title}</h3><p style="line-height:1.6">${ch.text}</p><p><b>Objetivo:</b> ${ch.mission}</p><p style="font-size:13px;color:#5a6378">Local: ${reg.name} · Recompensa: ${ch.reward.xp} XP e ${ch.reward.gems} Gemas Estelares</p><div class="choices" style="display:flex;flex-direction:column;gap:8px;margin-top:12px"></div></div>`;
          const box = qd.querySelector('.choices');
          if (st.ready) {
            box.appendChild(U.h('<div class="kicker" style="color:#b8862a">ESCOLHA QUE MUDA SUA HISTÓRIA</div>'));
            ch.choices.forEach(([label], i) => {
              const b = U.h(`<button class="btn primary block" style="justify-content:flex-start"><span class="ico">0${i + 1}</span>${U.esc(label)}</button>`);
              b.onclick = async () => {
                const res = E.Quests.storyChoose(i);
                if (!res) return;
                E.Audio.sfx('levelup');
                UI.toast(`✧ ${res.label}`, 'gold big');
                UI.loot('✦', `${res.reward.xp} XP`); UI.loot('💎', `${res.reward.gems} Gemas Estelares`);
                if (E.WG.world) E.WG.world.refreshObjectives();
                if (res.levels) E.Game.levelUp(E.Store.hero(), res.levels);
                draw();
              };
              box.appendChild(b);
            });
          } else if (E.WG.world && E.WG.world.id !== ch.region) {
            const b = U.h(`<button class="btn dark"><span class="ico">✦</span>Viajar para ${reg.name}</button>`);
            b.onclick = () => { if (E.Map.canTravel(ch.region)) { UI.close(el); E.Game.travel(ch.region); } else UI.toast('Visite uma região vizinha primeiro (abra o Mapa).'); };
            box.appendChild(b);
          }
        }
      } else if (sel.startsWith('chain:')) {
        const cid = sel.slice(6), stp = E.Chains.step(cid), [, npc] = E.Chains.npcOf(cid);
        const reg = npc ? E.WD.REGIONS[npc.region] : null;
        qd.innerHTML = stp ? `<div class="card"><div class="kicker" style="color:#b8862a">${U.esc(E.CT.CHAINS[cid].title.toUpperCase())}</div><h3 style="font-family:var(--display);margin:6px 0">${U.esc(stp.title)}</h3><p style="line-height:1.6">${U.esc(stp.text)}</p><p><b>Quem pediu:</b> ${U.esc(npc.name)}${reg ? ` (${U.esc(reg.name)})` : ''}</p><p><b>Progresso:</b> ${E.Chains.goalText(cid)}${E.Chains.progress(cid).ok ? ' — volte para entregar!' : ''}</p></div>` : '';
      } else {
        const q = E.Quests.find(sel), s = E.state.quests[sel];
        const [nid, npc] = E.Quests.npcOf(sel);
        const reg = E.WD.REGIONS[E.Quests.regionOfNpc(nid)];
        qd.innerHTML = `<div class="card"><div class="kicker" style="color:#b8862a">MISSÃO SECUNDÁRIA</div><h3 style="font-family:var(--display);margin:6px 0">${q.title}</h3><p style="line-height:1.6">${q.text}</p><p><b>Quem pediu:</b> ${npc.name} (${reg.name})</p>${q.n ? `<p><b>Progresso:</b> ${s.progress}/${q.n}</p>` : ''}<p style="font-size:13px;color:#5a6378">Recompensa: ${q.reward.xp} XP · ${q.reward.gold || 0} po · ${q.reward.gems || 0} Gemas${q.reward.item ? ' · ' + R.ITEMS[q.reward.item].name : ''}</p><p><b>${s.state === 'done' ? '✓ Concluída' : E.Quests.isComplete(q) ? 'Volte e fale com quem lhe deu a missão.' : 'Em andamento.'}</b></p></div>`;
      }
    };
    draw();
    UI.open(el);
  };

  // ---------------- Inventário ----------------
  J.inventory = () => {
    const h = E.Store.hero();
    const el = UI.screen('Inventário', { right: `<span class="chip gold">🪙 ${h.gold} po</span>` });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      body.innerHTML = '<h3 style="font-family:var(--display)">Consumíveis</h3>';
      let any = false;
      for (const [id, n] of Object.entries(h.inventory)) {
        if (!n || !R.ITEMS[id]) continue;
        any = true;
        const it = R.ITEMS[id];
        const row = U.h(`<div class="shop-item"><div class="si">🧪</div><div class="sx"><b>${it.name} ×${n}</b><small>${it.desc}</small></div>${it.heal ? '<button class="btn sm primary"><span class="ico">✚</span>Usar</button>' : ''}</div>`);
        const b = row.querySelector('button');
        if (b) b.onclick = () => {
          if (h.hp >= C.maxHp(h)) return UI.toast('Seus PV já estão cheios.');
          h.inventory[id]--;
          const x = E.rollDice(it.heal);
          h.hp = Math.min(C.maxHp(h), h.hp + x.total);
          UI.toast(`✚ +${x.total} PV`);
          E.Audio.sfx('heal'); E.Store.save(); E.HUD.update(); draw();
        };
        body.appendChild(row);
      }
      if (!any) body.appendChild(U.h('<p style="color:#5a6378">Nenhum consumível. Compre poções com os mercadores.</p>'));
      body.appendChild(U.h('<h3 style="font-family:var(--display)">Materiais</h3>'));
      const mats = Object.entries(h.materials || {}).filter(([, n]) => n > 0);
      if (!mats.length) body.appendChild(U.h('<p style="color:#5a6378">Colha ervas brilhantes pelo mundo.</p>'));
      for (const [m, n] of mats) body.appendChild(U.h(`<div class="shop-item"><div class="si">🌿</div><div class="sx"><b>${U.esc(m)} ×${n}</b><small>Material de região — usado em missões.</small></div></div>`));
      body.appendChild(U.h(`<h3 style="font-family:var(--display)">Equipamento</h3><div class="shop-item"><div class="si">🛡</div><div class="sx"><b>${R.ARMOR[h.equip.armor].name}${h.equip.shield ? ' + Escudo' : ''}</b><small>CA ${C.ac(h)}</small></div></div>`));
    };
    draw();
    UI.open(el);
  };

  // ---------------- Bestiário ----------------
  J.bestiary = () => {
    const el = UI.screen('Bestiário · Manual dos Monstros');
    const body = el.querySelector('.screen-body');
    const seen = E.state.bestiary || {};
    let sel = Object.keys(seen)[0] || null;
    const all = Object.keys(M.MONSTERS);
    const draw = () => {
      body.innerHTML = `<p style="font-size:13px;color:#5a6378;margin-top:0">${Object.keys(seen).length}/${all.length} criaturas registradas. Derrote uma criatura para ver o bloco de estatísticas completo.</p><div class="two"><div class="list"></div><div class="sb" style="overflow:auto"></div></div>`;
      const list = body.querySelector('.list');
      for (const k of all.sort((a, b) => M.MONSTERS[a].cr - M.MONSTERS[b].cr)) {
        const m = M.MONSTERS[k], known = !!seen[k];
        const b = U.h(`<button class="li-item ${sel === k ? 'on' : ''}" style="${known ? '' : 'opacity:.55'}"><div class="lt">${known ? m.name : '???'}</div><div class="ls">ND ${R.crLabel(m.cr)} · ${M.TYPES[m.type]}${known ? ` · derrotados: ${seen[k]}` : ''}</div></button>`);
        b.onclick = () => { sel = k; draw(); };
        list.appendChild(b);
      }
      const sb = body.querySelector('.sb');
      if (!sel) { sb.innerHTML = '<p style="color:#5a6378">Nenhuma criatura registrada ainda.</p>'; return; }
      const m = M.MONSTERS[sel], known = !!seen[sel];
      const hpAvg = U.avgDice(m.hp);
      const ab = (v) => `${v} (${U.sign(U.mod(v))})`;
      sb.innerHTML = `<div class="statblock"><img class="mon-sprite" src="${E.SP.portrait(E.SP.monster(sel), 3)}" alt="" style="${known ? '' : 'filter:brightness(0)'}"><h3>${known ? m.name : '???'}</h3><div class="it">${M.TYPES[m.type]} ${m.size}</div><p style="font-style:italic">${m.desc}</p><hr>
        <p><b>CA</b> ${m.ac} · <b>PV</b> ${hpAvg} (${m.hp}) · <b>ND</b> ${R.crLabel(m.cr)} (${R.CR_XP[m.cr]} XP)</p><hr>
        ${known ? `<div class="ab6">${R.ABILITIES.map((a) => `<div><b>${a.short}</b>${ab(m.ab[a.id])}</div>`).join('')}</div><hr>
        ${m.resist ? `<p><b>Resistências</b> ${m.resist.map((t) => R.DAMAGE[t].name).join(', ')}</p>` : ''}${m.immune ? `<p><b>Imunidades</b> ${m.immune.map((t) => R.DAMAGE[t].name).join(', ')}</p>` : ''}${m.vuln ? `<p><b>Vulnerabilidades</b> ${m.vuln.map((t) => R.DAMAGE[t].name).join(', ')}</p>` : ''}
        ${m.traits ? `<div class="sec">Traços</div>${m.traits.map(([, n, d]) => `<p><b><i>${n}.</i></b> ${d}</p>`).join('')}` : ''}
        <div class="sec">Ações</div>${m.multi ? `<p><b><i>Ataques Múltiplos.</i></b> Faz ${m.multi} ataques.</p>` : ''}${m.attacks.map((a) => `<p><b><i>${a.n}.</i></b> <i>Jogada de Ataque ${a.r === 'dist' ? 'à Distância' : 'Corpo a Corpo'}:</i> ${U.sign(a.b)}. <i>Acerto:</i> ${U.avgDice(a.d)} (${a.d}) de dano ${R.DAMAGE[a.t].name}${a.x ? ` mais ${U.avgDice(a.x[0])} (${a.x[0]}) ${R.DAMAGE[a.x[1]].name}` : ''}${a.fx && a.fx.cond ? `; o alvo fica ${R.CONDITIONS[a.fx.cond].name}${a.fx.save ? ` (TR de ${R.AB[a.fx.save].name} CD ${a.fx.dc} evita)` : ''}` : ''}.</p>`).join('')}
        ${m.special ? `<p><b><i>${m.special.n} (Recarga ${m.special.recharge}–6).</i></b> ${m.special.desc}</p>` : ''}
        ${m.legendaryActions ? `<div class="sec">Ações Lendárias</div><p>Após o seu turno, a criatura usa: <b>${m.legendaryActions[0].n}</b> (${U.sign(m.legendaryActions[0].b)}, ${m.legendaryActions[0].d} ${R.DAMAGE[m.legendaryActions[0].t].name}).</p>` : ''}` : '<p style="color:#8a6a5a">Derrote esta criatura para registrar suas estatísticas.</p>'}
        <p style="font-size:11px;color:#8a7a6a;margin-top:12px">Habitat: ${[...Object.entries(M.BY_REGION).filter(([, l]) => l.includes(sel)).map(([r]) => (E.WD.reg(r) || {}).name), ...Object.entries(M.DRAGON_NESTS || {}).filter(([, l]) => l.includes(sel)).map(([r]) => `ninho na ${(E.WD.CAVES[(E.WD.REGIONS[r] || {}).caveId] || { name: 'gruta' }).name}`)].filter(Boolean).join(', ') || 'Abismo de Véspera'}</p></div>`;
    };
    draw();
    UI.open(el);
  };

  // ---------------- Heróis ----------------
  J.heroes = () => {
    const el = UI.screen('Heróis');
    const body = el.querySelector('.screen-body');
    const draw = () => {
      body.innerHTML = '<div class="heroes-top"><button class="btn sm" data-party><span class="ico">✦</span>Configurar grupo (até 3)</button></div><div class="pick-grid"></div>';
      body.querySelector('[data-party]').onclick = () => E.PartyUI.open();
      const g = body.querySelector('.pick-grid');
      for (const h of E.state.heroes.filter((x) => !x.deleted)) {
        const b = U.h(`<button class="pick ${h.id === E.state.activeHero ? 'on' : ''}" ${h.dead ? 'style="opacity:.5"' : ''}><img src="${E.Portrait ? E.Portrait.url(h) : UI.heroPortrait(h)}" class="pick-face" alt=""><div class="pn" style="text-align:center">${U.esc(h.name)}</div><div class="pd" style="text-align:center">Nv. ${h.level} ${C.cls(h).name} ${C.species(h).name}${h.dead ? ' · ☠ morto' : ''}${E.Party && E.Party.has(h.id) ? ' · no grupo' : ''}</div></button>`);
        b.onclick = async () => {
          if (h.dead || h.id === E.state.activeHero) return;
          if (await UI.confirm('Trocar de herói', `Jogar com ${h.name}?`)) { E.state.activeHero = h.id; E.Store.save(); UI.closeAll(); E.Game.enterWorld(); }
        };
        g.appendChild(b);
      }
      const add = U.h('<button class="pick"><div class="pi" style="text-align:center;font-size:40px">＋</div><div class="pn" style="text-align:center">Novo herói</div><div class="pd" style="text-align:center">As armas do Arsenal são compartilhadas.</div></button>');
      add.onclick = () => { UI.closeAll(); E.Creator.open(); };
      g.appendChild(add);
    };
    draw();
    UI.open(el);
  };

  // ---------------- Regras ----------------
  J.rules = () => {
    const el = UI.screen('Regras · D&D 5.5');
    el.querySelector('.screen-body').innerHTML = `<div class="rules" style="max-width:820px">
      <h4>O Teste de d20</h4><p>Ataques, testes de resistência e testes de atributo usam <b>d20 + modificador + Bônus de Proficiência</b> (quando proficiente). Igualar ou superar a CA/CD é sucesso. Em ataques, <b>20 natural</b> é sempre acerto crítico (dados de dano dobrados) e <b>1 natural</b> sempre erra.</p>
      <h4>Vantagem e Desvantagem</h4><p>Com Vantagem você rola dois d20 e fica com o maior; com Desvantagem, com o menor. Elas não se acumulam e se anulam. Os dois dados aparecem na tela — o descartado fica apagado.</p>
      <h4>Seu turno</h4><p>A cada turno você tem <b>uma Ação</b> (●), <b>uma Ação Bônus</b> (◆) e movimento. Ações comuns: Atacar, Conjurar Magia, Esquivar, Esconder e Desengajar (fugir). Beber poção é Ação Bônus (regra de 2024). Só é possível gastar <b>um espaço de magia por turno</b>.</p>
      <h4>Maestria em Armas (2024)</h4><ul>${Object.values(R.MASTERY).map((m) => `<li><b>${m.name} (${m.en}):</b> ${m.desc}</li>`).join('')}</ul><p>Bárbaros, Guerreiros, Paladinos, Patrulheiros e Ladinos dominam a maestria das armas que treinam (atualizadas em cada Descanso Longo).</p>
      <h4>Concentração</h4><p>Algumas magias exigem Concentração. Ao sofrer dano, faça um TR de Constituição (CD 10 ou metade do dano, o que for maior) para mantê-la. Conjurar outra magia de concentração encerra a anterior.</p>
      <h4>Cair a 0 PV</h4><p>Você fica inconsciente e faz <b>testes contra a morte</b> no início do turno: 10+ é sucesso, abaixo é falha. 3 sucessos = estabilizado; 3 falhas = morte. 20 natural = volta com 1 PV; 1 natural = duas falhas. Dano igual ou maior que seu PV máximo de uma vez = morte instantânea. Fora do modo Hardcore, Morgana conjura <i>Revivificar</i> (300 po).</p>
      <h4>Descansos</h4><p><b>Curto:</b> gaste Dados de Vida para recuperar PV (d da classe + CON) e recupere recursos de descanso curto. <b>Longo:</b> recupera todos os PV, Dados de Vida, espaços de magia e recursos.</p>
      <h4>Encontros</h4><p>Os grupos de criaturas são montados com o orçamento de XP do Livro do Mestre 2024 (dificuldade Baixa, Moderada ou Alta para o seu nível). Inimigos vagam pelo mapa — chegar perto demais inicia o combate.</p>
      <h4>Níveis</h4><p>XP por nível: 300 (2), 900 (3), 2.700 (4), 6.500 (5), 14.000 (6), 23.000 (7), 34.000 (8), 48.000 (9), 64.000 (10). Nos níveis 4 e 8 você recebe um Aumento de Valor de Atributo.</p>
      <h4>Armas do Oráculo</h4><p>★3 Incomum (+1), ★4 Rara (+2), ★5 Muito Rara (+3) — o bônus soma no ataque e no dano (ou no ataque mágico e na CD, para Catalisadores). Proficiência importa: sem ela, o Bônus de Proficiência não entra no ataque.</p>
      <h4>Vida e viagem</h4><p>Um dia dura quatro minutos de jogo. Só correr consome vigor. Caminhar, correr e lutar dão fome; com a saciedade vazia você não pode correr e sofre −2 nos ataques e no dano físico. Cozinhe nas fogueiras e durma na cama de um quarto alugado ou de sua casa.</p>
      <h4>Atalhos</h4><p><b>WASD</b> andar · <b>Shift ou botão de corrida</b> correr (na água: nado rápido) · <b>Clique no chão</b> andar até o ponto · <b>Botão direito do mouse</b> (segure e arraste) girar a câmera · <b>Espaço</b> pular; segure no ar para usar seu planador comprado e equipado · <b>F</b> interagir · <b>M</b> mapa · <b>J</b> missões · <b>C</b> personagem · <b>I</b> arsenal · <b>O</b> Oráculo · <b>F1–F3</b> trocar de personagem · <b>1–9</b> barra rápida (aperte de novo para usar o item; clique com o botão direito para trocar o item) · <b>L</b> grupo · <b>Esc</b> menu. No celular, toque pular uma vez enquanto estiver no ar para abrir o planador.</p>
      <h4>Fonte</h4><p>Regras do System Reference Document 5.2 (CC-BY-4.0) e do Livro do Jogador 2024, resumidas para combate solo por turnos.</p></div>`;
    UI.open(el);
  };

  // ---------------- Ajustes ----------------
  // Rank de Aventura e Nível de Mundo
  J.adventure = () => {
    const AV = E.Adv;
    const el = UI.screen('🌍 Aventura');
    const body = el.querySelector('.screen-body');
    const draw = () => {
      const d = AV.data(), need = AV.need(d.ar), wl = AV.wl(), max = AV.maxWL(), t = AV.pendingTrial();
      const nextWl = AV.WL_AR.findIndex((a, i) => i > max && true);
      body.innerHTML = `<div class="adv-card"><div class="ac-r"><span>Rank de Aventura</span><b>${d.ar}</b></div><div class="bar"><i style="width:${Math.min(100, d.xp / need * 100)}%"></i></div><small>${d.ar >= AV.MAX_AR ? 'Rank máximo!' : `${d.xp} / ${need} EXP de Aventura`}</small></div>
        <div class="adv-card"><div class="ac-r"><span>Nível de Mundo</span><b>${wl}${d.lowered ? ` <small>(máximo ${max})</small>` : ''}</b></div>
          <p class="muted tr-tip">Monstros montados para um grupo ${Math.floor(wl / 2)} nível(is) acima do seu · +${Math.round((AV.goldMult(wl) - 1) * 100)}% de ouro · +${Math.round((AV.gemMult(wl) - 1) * 100)}% de gemas.${nextWl > 0 && nextWl < AV.WL_AR.length ? ` Próximo Nível de Mundo no Rank ${AV.WL_AR[nextWl]}${AV.TRIAL[nextWl] ? ' (com Provação)' : ''}.` : ''}</p>
          <div class="cs-row" style="justify-content:flex-start"><button class="btn sm dark" data-a="lower" ${AV.canChangeWL() && (d.lowered || max > 0) ? '' : 'disabled'}>${d.lowered ? '⬆ Voltar ao Nível de Mundo máximo' : '⬇ Baixar 1 Nível de Mundo'}</button></div>
          ${AV.canChangeWL() ? '' : '<p class="muted tr-tip">Dá para mudar de novo 1 hora depois da última troca.</p>'}</div>
        ${t ? `<div class="adv-card trial"><div class="ac-r"><span>⚔ ${U.esc(t.name)}</span><b>Nível de Mundo ${t.wl}</b></div><p class="muted tr-tip">${U.esc(t.desc)} Oponentes: ${t.monsters.map((k) => U.esc(E.M.MONSTERS[k].name)).join(', ')}.</p><button class="btn primary" data-a="trial"><span class="ico">⚔</span>Começar a Provação</button></div>` : ''}
        <div class="adv-card"><div class="ac-r"><span>Como ganhar EXP de Aventura</span></div><p class="muted tr-tip">Vitórias (+${AV.XP.win} e +${AV.XP.enemy} por inimigo), baús (+${AV.XP.chest.comum} a +${AV.XP.chest.luxuoso}), missões (+${AV.XP.quest}), capítulos da história (+${AV.XP.story}), comissões diárias (+${AV.XP.commission} cada, +${AV.XP.commissionBonus} pelas quatro), domínios (+${AV.XP.domain}), chefes de covil (+${AV.XP.lair}) e exploração. A cada Rank: gemas; a cada 5 Ranks: Núcleos de Covil e minérios.</p></div>`;
      const lb = body.querySelector('[data-a=lower]');
      if (lb) lb.onclick = () => { if (AV.toggleLower()) { UI.toast(`🌍 Nível de Mundo agora: ${AV.wl()}`, 'gold'); if (E.WG.world) E.Game.travel(E.WG.world.id, { quiet: true }); } draw(); };
      const tb = body.querySelector('[data-a=trial]');
      if (tb) tb.onclick = () => { UI.close(el); E.Game.startBattle(t.monsters, { trial: t.id }); };
    };
    draw();
    UI.open(el);
  };

  J.settings = () => {
    const s = E.state.settings;
    const el = UI.screen('Ajustes');
    const body = el.querySelector('.screen-body');
    const draw = () => {
      body.innerHTML = `<div style="max-width:720px">
        <div class="settings-row"><div class="sl">Volume geral</div><input type="range" min="0" max="1" step="0.05" value="${s.master}" data-k="master"></div>
        <div class="settings-row"><div class="sl">Música</div><input type="range" min="0" max="1" step="0.05" value="${s.music}" data-k="music"></div>
        <div class="settings-row"><div class="sl">Efeitos</div><input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-k="sfx"></div>
        <div class="settings-row"><div class="sl">Velocidade dos dados<small>0 = pular animação 3D</small></div><input type="range" min="0" max="2" step="0.25" value="${s.diceSpeed}" data-k="diceSpeed"></div>
        <div class="settings-row"><div class="sl">Qualidade gráfica<small>Baixa em celulares mais simples</small></div><div class="seg">${['baixo', 'medio', 'alto'].map((q) => `<button data-q="${q}" class="${s.quality === q ? 'on' : ''}">${{ baixo: 'Baixa', medio: 'Média', alto: 'Alta' }[q]}</button>`).join('')}</div></div>
        <div class="settings-row"><div class="sl">Resolução adaptativa<small>Ajusta a nitidez do cenário para reduzir travamentos. Menus e textos continuam nítidos.</small></div><button class="switch ${s.adaptiveResolution ? 'on' : ''}" data-t="adaptiveResolution" aria-label="Resolução adaptativa"></button></div>
        <div class="settings-row"><div class="sl">Ritmo da fome<small>Mecânica do jogo, não regra de D&amp;D. No ritmo normal a barra cheia dura cerca de 50 minutos explorando.</small></div><div class="seg">${[[0.6, 'Lento'], [1, 'Normal'], [1.4, 'Rápido']].map(([v, l]) => `<button data-hr="${v}" class="${(Number(s.hungerRate) || 1) === v ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <div class="settings-row"><div class="sl">Reduzir animações</div><button class="switch ${s.reducedMotion ? 'on' : ''}" data-t="reducedMotion" aria-label="Reduzir animações"></button></div>
        <div class="settings-row"><div class="sl">Vibração<small>Treme o celular em acertos críticos, dano e no teste contra a morte.</small></div><button class="switch ${s.vibrate !== false ? 'on' : ''}" data-t="vibrate" aria-label="Vibração"></button></div>
        <div class="settings-row"><div class="sl">Modo Hardcore<small>Morte permanente. Sem ele, morrer custa 1 nível, 30% do ouro e parte dos itens.</small></div><button class="switch ${s.hardcore ? 'on' : ''}" data-t="hardcore" aria-label="Modo Hardcore"></button></div>
        <div class="settings-row"><div class="sl">Salvamento<small>Seu progresso fica neste navegador. Exporte para não perder.</small></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm dark" data-a="export"><span class="ico">⇩</span>Exportar</button><button class="btn sm dark" data-a="import"><span class="ico">⇧</span>Importar</button></div></div>
        <div class="settings-row"><div class="sl">Apagar tudo<small>Começa do zero (heróis, armas e progresso)</small></div><button class="btn sm danger" data-a="reset"><span class="ico">!</span>Apagar</button></div>
        <p style="font-size:12px;color:#5a6378;margin-top:16px">UID ${E.state.uid} · Versão ${E.Title.VERSION}</p></div>`;
      body.querySelectorAll('input[type=range]').forEach((r) => (r.oninput = () => { s[r.dataset.k] = Number(r.value); E.Audio.apply(); E.Store.save(); }));
      body.querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => { s.quality = b.dataset.q; E.Store.save(); E.WG.applyQuality(); UI.toast('Resolução e efeitos atualizados. Detalhes do cenário mudam ao trocar de região.'); draw(); }));
      body.querySelectorAll('[data-hr]').forEach((b) => (b.onclick = () => { s.hungerRate = Number(b.dataset.hr); E.Store.save(); draw(); }));
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { s[b.dataset.t] = b.dataset.t === 'vibrate' ? s.vibrate === false : !s[b.dataset.t]; E.Store.save(); document.body.classList.toggle('reduced', s.reducedMotion); if (b.dataset.t === 'adaptiveResolution') E.WG.applyQuality(); draw(); }));
      body.querySelector('[data-a=export]').onclick = async () => {
        const code = E.Store.exportSave();
        if (E.App && E.App.share('Salvamento de Elarion', code)) return;
        try { await navigator.clipboard.writeText(code); UI.toast('Código de salvamento copiado!'); } catch { UI.alert('Seu código de salvamento', `<textarea style="width:100%;height:120px">${code}</textarea>`); }
      };
      body.querySelector('[data-a=import]').onclick = async () => {
        const html = '<textarea id="impSave" style="width:100%;height:120px;border-radius:10px;border:1px solid #d6ccb6;padding:8px" placeholder="Cole aqui o código exportado"></textarea>';
        const p = UI.modal({ title: 'Importar salvamento', html, buttons: [{ label: 'Cancelar', value: false }, { label: 'Importar', value: true, cls: 'primary' }] });
        const ta = document.getElementById('impSave');
        let val = '';
        ta.oninput = () => { val = ta.value; };
        if (await p) { try { E.Store.importSave(val); location.reload(); } catch (e) { UI.alert('Erro', e.message); } }
      };
      body.querySelector('[data-a=reset]').onclick = async () => { if (await UI.confirm('Apagar tudo?', 'Isso não pode ser desfeito.', 'Apagar', 'Cancelar')) { E.Store.reset(); location.reload(); } };
    };
    draw();
    UI.open(el);
  };

  E.Journal = J;
})();
