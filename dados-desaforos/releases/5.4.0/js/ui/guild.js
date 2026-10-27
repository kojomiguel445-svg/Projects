/* Guilda dos Aventureiros (contratos de caça e diárias) e Arena dos Gladiadores (ondas seguidas de combate). */
(() => {
  const U = E.U, UI = E.UI;
  const GU = {};

  GU.open = (tab = 'contratos') => {
    const h = E.Store.hero(); if (!h) return;
    const el = UI.screen('🛡 Guilda dos Aventureiros', { right: '<span class="chip gold" data-rank></span>' });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      const g = E.Life.ensureGuild(), dl = E.Life.ensureDaily(), rk = E.Life.guildRank(g.rep);
      el.querySelector('[data-rank]').textContent = `Rank ${rk.rank} · ${g.rep}${rk.next ? '/' + rk.next : ''} reputação`;
      body.innerHTML = `<div class="sheet-tabs" style="padding:0 0 10px">${[['contratos', '🎯 Contratos'], ['diarias', '📅 Diárias'], ['arena', '🏟 Arena']].map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="gu-body"></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const box = body.querySelector('.gu-body');
      if (tab === 'contratos') {
        box.innerHTML = '<p class="muted tr-tip">O quadro muda todo dia. Aceite até 3 contratos, derrote os alvos na região indicada e volte aqui para receber. A caçada ☠ pede o chefe de um covil.</p>';
        for (const c of g.board) {
          const m = E.M.MONSTERS[c.mon], reg = E.WD.REGIONS[c.region];
          const row = U.h(`<div class="shop-item gu-c ${c.state}"><div class="si mon"><img src="${E.SP.portrait(E.SP.monster(c.mon), 2)}" alt=""></div><div class="sx"><b>${c.boss ? '☠ Caçada: ' : ''}${m.name} ×${c.n}</b><small>${reg.name} · ND ${E.R.crLabel(m.cr)} · Recompensa ${c.gold} po, +${c.rep} reputação${c.state === 'active' ? ` · <b>${c.p}/${c.n}</b>` : ''}</small></div></div>`);
          let b = null;
          if (c.state === 'open') { b = U.h('<button class="btn sm primary">Aceitar</button>'); b.onclick = () => { if (E.Life.acceptContract(c.id)) { E.Audio.sfx('click'); draw(); } }; }
          else if (c.state === 'active' && c.p >= c.n) { b = U.h('<button class="btn sm primary">Receber</button>'); b.onclick = () => { const r = E.Life.turnInContract(c.id); if (r) { UI.loot('🪙', `${r.gold} po`); UI.loot('🛡', `+${r.rep} reputação`); E.Audio.sfx('chest'); } draw(); }; }
          else if (c.state === 'active') b = U.h('<span class="chip">Em andamento</span>');
          else b = U.h('<span class="chip">✔ Concluído</span>');
          row.appendChild(b);
          box.appendChild(row);
        }
      } else if (tab === 'diarias') {
        box.innerHTML = `<p class="muted tr-tip">Quatro tarefas por dia, renovadas à meia-noite. Cada uma vale ${E.L.DAILY_GEMS} 💎; completando todas, ganhe mais ${E.L.DAILY_BONUS} 💎 e 1 Selo 🌟.</p>`;
        dl.tasks.forEach((t, i) => {
          const def = E.L.DAILY_POOL.find((x) => x.id === t.id);
          const done = t.p >= def.n;
          const row = U.h(`<div class="shop-item"><div class="si">${t.claimed ? '✅' : done ? '🎁' : '📅'}</div><div class="sx"><b>${def.text}</b><small>${t.p}/${def.n}</small><div class="bar xp" style="height:5px"><i style="width:${t.p / def.n * 100}%"></i></div></div></div>`);
          if (done && !t.claimed) { const b = U.h(`<button class="btn sm primary">Receber ${E.L.DAILY_GEMS} 💎</button>`); b.onclick = () => { E.Life.claimDaily(i); E.Audio.sfx('chest'); draw(); }; row.appendChild(b); }
          box.appendChild(row);
        });
        if (dl.bonus) box.appendChild(U.h('<p class="muted tr-tip">✦ Bônus diário recebido. Volte amanhã!</p>'));
      } else arena(box);
    };
    const arena = (box) => {
      const d = E.Life.data(h);
      box.innerHTML = `<p class="muted tr-tip">Três ondas seguidas, sem descanso longo entre elas (você recupera 25% dos PV entre as ondas). Vença todas para levar o prêmio. Gladiador Nv. ${E.Life.level(h, 'gladiador')}.</p>`;
      for (const t of E.L.ARENA) {
        const won = d.stats.arenaWins.includes(t.id);
        const mult = 1 + E.Life.level(h, 'gladiador') * 0.06;
        const row = U.h(`<div class="shop-item"><div class="si">${won ? '🏆' : '🏟'}</div><div class="sx"><b>${t.name} <small>(Nv. ${t.lvl}+)</small></b><small>${t.waves.map((w, i) => `Onda ${i + 1}: ${w.map((k) => E.M.MONSTERS[k].name).join(', ')}`).join(' · ')}</small><small>Prêmio: ${Math.round(t.gold * mult)} po, ${t.gems} 💎${t.seals ? `, ${t.seals} 🌟` : ''}${won ? ' · já vencida (prêmio menor)' : ''}</small></div><button class="btn sm primary">Lutar</button></div>`);
        row.querySelector('button').onclick = async () => {
          if (h.level < t.lvl && !(await UI.confirm('Liga perigosa', `Recomendado nível ${t.lvl}. Entrar mesmo assim?`, 'Entrar'))) return;
          UI.close(el);
          GU.runArena(t);
        };
        box.appendChild(row);
      }
    };
    draw();
    UI.open(el);
  };

  const fight = (keys, opts) => new Promise((resolve) => { const off = U.on('battle:end', (res) => { off(); resolve(res); }); E.Game.startBattle(keys, opts); });
  GU.runArena = async (t) => {
    const h = E.Store.hero(), d = E.Life.data(h);
    for (let i = 0; i < t.waves.length; i++) {
      const res = await fight(t.waves[i], { arena: true });
      if (res.outcome !== 'win') { UI.toast(`A torcida vaia… você caiu na onda ${i + 1}.`, 'big'); E.Life.addXp(h, 'gladiador', 10 * (i + 1)); return; }
      E.Life.addXp(h, 'gladiador', 25 + i * 15);
      if (i < t.waves.length - 1) {
        const heal = Math.ceil(E.C.maxHp(h) * 0.25); h.hp = Math.min(E.C.maxHp(h), h.hp + heal);
        await UI.alert(`Onda ${i + 1} vencida!`, `A multidão grita seu nome. Você recupera ${heal} PV. Próxima onda: ${t.waves[i + 1].map((k) => E.M.MONSTERS[k].name).join(', ')}.`, 'Próxima onda!');
      }
    }
    const first = !d.stats.arenaWins.includes(t.id);
    const mult = (1 + E.Life.level(h, 'gladiador') * 0.06) * (first ? 1 : 0.5);
    const gold = Math.round(t.gold * mult), gems = Math.round(t.gems * (first ? 1 : 0.4));
    h.gold += gold; E.state.gems += gems; if (first && t.seals) E.state.seals += t.seals;
    const cores = t.id === 'lenda' ? 2 : t.id === 'platina' ? 1 : t.id === 'ouro' && first ? 1 : 0;
    E.Forge.addCores(h, cores);
    // Fragmento da Flecha: a Flecha costuma aparecer no Coliseu (primeira vitória na Platina e no Desafio das Lendas)
    const arrow = first && (t.id === 'platina' || t.id === 'lenda') && E.Eco ? 1 : 0;
    if (arrow) E.Eco.addArrow(arrow);
    if (first) d.stats.arenaWins.push(t.id);
    const outfit = first && t.id === 'prata' && !(E.state.outfits || {}).gladiador;
    if (outfit) { E.state.outfits = E.state.outfits || {}; E.state.outfits.gladiador = true; }
    E.Life.addXp(h, 'gladiador', 80);
    E.Life.checkAch(h);
    E.Store.save();
    E.Audio.sfx('levelup');
    await UI.modal({ title: `🏆 ${t.name}: VITÓRIA!`, html: `<div style="text-align:center;font-size:15px"><p>A arena inteira se levanta para aplaudir.</p><p><b>+${gold} po · +${gems} 💎${first && t.seals ? ` · +${t.seals} 🌟` : ''}${cores ? ` · +${cores} ${E.Forge.CORE_ICON}` : ''}${arrow ? ` · +${arrow} 🏹` : ''}</b></p>${arrow ? '<p>🏹 Um <b>Fragmento da Flecha</b> estava cravado no chão da arena. Cinco deles fazem uma Flecha inteira — a que evolui certos Ecos.</p>' : ''}${outfit ? '<p>👘 Nova roupa no Guarda-roupa: <b>Gladiador ⚔</b></p>' : ''}</div>`, buttons: [{ label: 'Glória!', value: true, cls: 'primary' }] });
  };

  E.Guild = GU;
})();
