/* Tela dos Ecos: coleção, Sincronia, bônus, Investida, equipar no herói ativo e Evolução (as formas do anime). */
(() => {
  const U = E.U, UI = E.UI, EC = E.ECO;
  const EU = {};
  const reference=(id,d)=>/JoJo/.test(d.insp||'')?d.insp:((E.ECOART.references&&E.ECOART.references[String(id).split('~')[0]])||d.insp)+' · releitura visual de JoJo';
  const stars = (r) => '★'.repeat(r);
  const baseShort = (id) => EC.CATALOG[id].short || 'Forma base';
  const monName = (k) => { const m = E.M.MONSTERS[k] || {}; return (m.boss && m.title) || m.name || k; };
  const waveText = (w) => { const c = {}; w.forEach((k) => { c[k] = (c[k] || 0) + 1; }); return Object.entries(c).map(([k, n]) => `${n > 1 ? n + '× ' : ''}${monName(k)}`).join(', '); };
  const fight = (keys, opts) => new Promise((resolve) => { const off = U.on('battle:end', (res) => { off(); resolve(res); }); E.Game.startBattle(keys, opts); });

  EU.open = () => {
    const h = E.Store.hero();
    if (!h) return;
    const el = U.h(`<section class="screen paper ecos-screen"><header class="screen-head"><h2>👻 Ecos — Espíritos Guardiões</h2><div class="grow"></div><button class="btn sm" data-a="wish"><span class="ico">✦</span>Invocar</button><button class="close" aria-label="Fechar">✕</button></header><div class="screen-body eco-body"></div></section>`);
    const body = el.querySelector('.eco-body');
    const draw = () => {
      const cur = E.Eco.equipped(h);
      const own = (id) => E.Eco.owned(id);
      const ids = Object.keys(EC.CATALOG).sort((a, b) => EC.CATALOG[b].rarity - EC.CATALOG[a].rarity || (own(b) ? 1 : 0) - (own(a) ? 1 : 0));
      body.innerHTML = `<p class="muted tr-tip">Um Eco flutua atrás de <b>${U.esc(h.name)}</b> no mundo e no combate. Ele dá um bônus permanente e, uma vez por combate, faz uma <b>Investida</b> (Ação Bônus, no menu de poderes). Cópias repetidas aumentam a <b>Sincronia</b> (1 a 5). Os Ecos cujo Stand evolui no anime também <b>evoluem</b> aqui (botão ✦ Evolução).</p>
        <div class="eco-res"><span>🏹 Fragmentos da Flecha: <b>${E.Eco.arrows()}</b></span><small>Caem dos chefes de covil (o primeiro de cada sempre deixa um) e do Coliseu da Guilda. Cinco fazem uma Flecha, que leva certos Ecos ao Réquiem.</small></div>
        <div class="eco-cur">${cur ? `<img src="${E.ECOART.portrait(cur.art)}" alt=""><div><b>${U.esc(cur.def.name)}</b> ${stars(cur.def.rarity)} · Sincronia ${cur.sync}<small>${U.esc(EC.buffText(cur.id, cur.sync, cur.form))}</small><small>Investida — ${U.esc(cur.def.rush.name)}: ${U.esc(EC.rushText(cur.id, cur.sync, cur.form))}</small></div>` : '<div><b>Nenhum Eco equipado.</b><small>Invoque Ecos no Oráculo (aba 👻 Invocação de Ecos).</small></div>'}</div>
        <div class="eco-grid"></div>`;
      const grid = body.querySelector('.eco-grid');
      for (const id of ids) {
        const o = own(id), f = o ? E.Eco.form(id) : 0, d = EC.form(id, f), on = cur && cur.id === id, evo = EC.EVO[id];
        const ready = o && evo && E.Eco.next(id) && E.Eco.canEvolve(h, id);
        const path = evo ? [baseShort(id), ...evo.map((e) => e.short)] : null;
        const card = U.h(`<div class="eco-card r${d.rarity} ${o ? '' : 'locked'} ${on ? 'on' : ''}"><div class="ec-art"><img src="${E.ECOART.portrait(EC.artKey(id, f))}" alt="">${f ? `<span class="ec-form">${U.esc(d.short)}</span>` : ''}</div><div class="ec-info"><div class="ec-n">${U.esc(d.name)} <span class="stars r${d.rarity}">${stars(d.rarity)}</span></div><div class="ec-t">${U.esc(d.title)}${o ? ` · Sincronia <b>${o.sync}</b>/5` : ''}</div>
          <p>${U.esc(EC.buffText(id, o ? o.sync : 1, f))}</p><p class="ec-r">👊 ${U.esc(d.rush.name)}: ${U.esc(EC.rushText(id, o ? o.sync : 1, f))}</p><small>Inspirado em ${U.esc(reference(id,d))}</small>
          ${path ? `<div class="ec-evo">✦ Evolui: ${path.map((p, i) => `<span class="${o && i <= (o.maxForm || 0) ? 'got' : ''}">${U.esc(p)}</span>`).join(' → ')}</div>` : ''}
          <div class="ec-btns">${o ? `<button class="btn sm ${on ? 'dark' : 'primary'}" data-a="eq">${on ? 'Remover' : 'Equipar'}</button>` : '<small class="ec-lock">Ainda não invocado</small>'}${o && evo ? `<button class="btn sm ${ready ? 'primary glow' : ''}" data-a="evo"><span class="ico">✦</span>${ready ? 'Evoluir!' : 'Evolução'}</button>` : ''}</div></div></div>`);
        const eq = card.querySelector('[data-a=eq]');
        if (eq) eq.onclick = () => { E.Eco.equip(h, on ? null : id); E.Audio.sfx(on ? 'click' : 'star4'); UI.toast(on ? 'Eco guardado.' : `👻 ${d.name} agora segue ${h.name}!`, on ? '' : 'gold'); draw(); };
        const ev = card.querySelector('[data-a=evo]');
        if (ev) ev.onclick = () => EU.evo(id, draw);
        grid.appendChild(card);
      }
    };
    el.querySelector('.close').onclick = () => UI.close(el);
    el.querySelector('[data-a=wish]').onclick = () => { UI.close(el); E.Wish.open('eco'); };
    draw();
    UI.open(el);
  };

  // ------------------------------------------------ Evolução: formas, requisitos, Provação e evoluir
  EU.evo = (id, onChange) => {
    const h = E.Store.hero(), base = EC.CATALOG[id], list = EC.EVO[id];
    if (!h || !list || !E.Eco.owned(id)) return;
    const el = U.h(`<section class="screen paper evo-screen"><header class="screen-head"><h2>✦ Evolução — ${U.esc(base.name)}</h2><div class="grow"></div><button class="close" aria-label="Fechar">✕</button></header><div class="screen-body evo-body"></div></section>`);
    const body = el.querySelector('.evo-body');
    const draw = () => {
      const o = E.Eco.owned(id), maxF = o.maxForm || 0, curF = E.Eco.form(id), nx = E.Eco.next(id);
      const stages = [0, ...list.map((_, i) => i + 1)].map((f) => {
        const d = EC.form(id, f), got = f <= maxF, isNext = nx && nx.f === f;
        return `<button class="evo-st ${got ? 'got' : 'lock'} ${f === curF ? 'cur' : ''} ${isNext ? 'next' : ''}" data-f="${f}" ${got ? '' : 'disabled'}><img src="${E.ECOART.portrait(EC.artKey(id, f))}" alt=""><b>${U.esc(f ? d.short : baseShort(id))}</b><small>${got ? (f === curF ? 'Em uso' : 'Toque para usar') : isNext ? 'Próxima forma' : 'Bloqueada'}</small></button>`;
      }).join('<div class="evo-arrow">➜</div>');
      let next = '';
      if (nx) {
        const ev = nx.ev, d = EC.form(id, nx.f), checks = E.Eco.checks(h, id), open = E.Eco.trialOpen(h, id), won = !!(o.trials || {})[nx.f], can = E.Eco.canEvolve(h, id);
        const req = checks.filter((c) => c.k !== 'trial').map((c) => `<div class="req ${c.ok ? 'ok' : 'no'}"><span class="ri">${c.icon}</span><span class="rl">${U.esc(c.label)}</span><span class="rv">${c.k === 'gold' ? `${c.have.toLocaleString('pt-BR')} / ${c.need.toLocaleString('pt-BR')}` : `${c.have} / ${c.need}`}</span><span class="rc">${c.ok ? '✓' : '✗'}</span></div>`).join('');
        next = `<div class="evo-next">
          <div class="kicker">Próxima forma</div><h3>${U.esc(d.name)} <small>${U.esc(d.title)}</small></h3>
          <p class="evo-lore">${U.esc(ev.lore)}</p>
          <div class="evo-cols"><div><b>Bônus</b><p>${U.esc(EC.buffText(id, o.sync, nx.f))}</p></div><div><b>👊 ${U.esc(d.rush.name)}</b><p>${U.esc(EC.rushText(id, o.sync, nx.f))}</p></div></div>
          <small class="evo-insp">Inspirado em ${U.esc(reference(id,d))}</small>
          <div class="kicker">Requisitos</div><div class="req-grid">${req}</div>
          <div class="evo-trial ${won ? 'won' : ''}"><div class="kicker">⚔ Provação — ${U.esc(ev.trial.name)}</div><p>${U.esc(ev.trial.lore)}</p>
            <ol>${ev.trial.waves.map((w) => `<li>${U.esc(waveText(w))}</li>`).join('')}</ol>
            <small>Você luta sozinho (sem o grupo online), com ${U.esc(base.name)} equipado. As ondas vêm em seguida, sem descanso: entre uma e outra você só recupera 25% dos PV. Cair conta como uma derrota normal.</small>
            <div class="row">${won ? '<span class="won-tag">✓ Provação vencida</span>' : `<button class="btn ${open ? 'dark' : ''}" data-a="trial" ${open ? '' : 'disabled'}><span class="ico">⚔</span>${open ? 'Enfrentar a Provação' : `Pede Sincronia ${ev.req.sync} e nível ${ev.req.level}`}</button>`}</div></div>
          <div class="row evo-go"><button class="btn primary ${can ? 'glow' : ''}" data-a="evolve" ${can ? '' : 'disabled'}><span class="ico">✦</span>Evoluir para ${U.esc(d.short)}</button></div></div>`;
      } else next = `<div class="evo-next done"><h3>Todas as formas desbloqueadas!</h3><p>Toque numa forma acima para usá-la — como no anime, dá para alternar entre elas.</p></div>`;
      body.innerHTML = `<div class="evo-strip">${stages}</div>${next}`;
      body.querySelectorAll('.evo-st.got').forEach((b) => { b.onclick = () => { const f = +b.dataset.f; if (f === E.Eco.form(id)) return; E.Eco.setForm(id, f); E.Audio.sfx('star4'); UI.toast(`👻 Agora em uso: ${EC.form(id, f).name}`, 'gold'); draw(); if (onChange) onChange(); }; });
      const tb = body.querySelector('[data-a=trial]');
      if (tb) tb.onclick = () => EU.runTrial(id, nx.f);
      const eb = body.querySelector('[data-a=evolve]');
      if (eb) eb.onclick = async () => {
        const d = E.Eco.evolve(h, id);
        if (!d) return;
        await EU.evolveAnim(id, d.form);
        draw(); if (onChange) onChange(); E.HUD.update();
      };
    };
    el.querySelector('.close').onclick = () => UI.close(el);
    draw();
    UI.open(el);
  };

  // Provação: ondas seguidas, sozinho, com o Eco equipado
  EU.runTrial = async (id, f) => {
    const h = E.Store.hero(), ev = EC.EVO[id][f - 1], waves = ev.trial.waves;
    if (!h || !E.Eco.trialOpen(h, id)) return;
    const ok = await UI.confirm(`⚔ Provação: ${ev.trial.name}`, `${waves.length} ondas seguidas: ${waves.map((w, i) => `<b>${i + 1}.</b> ${U.esc(waveText(w))}`).join(' · ')}. Você luta sozinho, com ${U.esc(EC.CATALOG[id].name)} equipado, e entre as ondas recupera só 25% dos PV. Está pronto?`, 'Enfrentar!', 'Agora não');
    if (!ok) return;
    if (h.eco !== id) E.Eco.equip(h, id);
    for (let i = 0; i < waves.length; i++) {
      const res = await fight(waves[i], { ecoTrial: id, noCoop: true, banner: `✦ Provação do Eco · Onda ${i + 1}/${waves.length}` });
      if (res.outcome !== 'win') { UI.toast(`A Provação falhou na onda ${i + 1}. O Eco ainda não está pronto…`, 'big'); return; }
      if (i < waves.length - 1) {
        const heal = Math.ceil(E.C.maxHp(h) * 0.25); h.hp = Math.min(E.C.maxHp(h), h.hp + heal);
        await UI.alert(`Onda ${i + 1} vencida!`, `O Eco treme de vontade. Você recupera ${heal} PV. Próxima onda: <b>${U.esc(waveText(waves[i + 1]))}</b>.`, 'Próxima onda!');
      }
    }
    E.Eco.trialWon(id, f);
    E.Audio.sfx('levelup');
    const can = E.Eco.canEvolve(h, id);
    await UI.alert('⚔ Provação vencida!', `<b>${U.esc(ev.trial.name)}</b>: o Eco sentiu a sua vontade. ${can ? 'Tudo pronto — ele já pode evoluir!' : 'Agora junte os recursos que faltam para evoluir.'}`, 'Ver a Evolução');
    EU.evo(id);
  };

  // animação de evolução: a forma antiga brilha, racha num clarão e a nova surge
  EU.evolveAnim = (id, f) => new Promise((resolve) => {
    const d = EC.form(id, f);
    const box = U.h(`<div class="evo-anim" style="--au:${d.look.aura}"><div class="ea-rays"></div><img class="ea-old" src="${E.ECOART.portrait(EC.artKey(id, f - 1))}" alt=""><img class="ea-new" src="${E.ECOART.portrait(EC.artKey(id, f))}" alt=""><div class="ea-flash"></div>
      <div class="ea-txt"><div class="ea-k">✦ O ECO EVOLUIU ✦</div><div class="ea-n">${U.esc(d.name)}</div><div class="ea-c">「${U.esc(d.cry)}」</div><small>Inspirado em ${U.esc(reference(id,d))}</small><button class="btn primary"><span class="ico">✓</span>Incrível!</button></div></div>`);
    document.body.appendChild(box);
    E.Audio.sfx('wish');
    setTimeout(() => E.Audio.sfx('star5'), 1300);
    box.querySelector('button').onclick = () => { E.Audio.sfx('click'); box.remove(); resolve(); };
  });

  E.EcoUI = EU;
})();
