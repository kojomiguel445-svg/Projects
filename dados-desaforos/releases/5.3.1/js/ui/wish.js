/* Oráculo das Armas — tela de desejos e animação de estrela cadente. */
(() => {
  const U = E.U, UI = E.UI, W = E.W, G = E.G, C = E.C;
  const WS = {};
  let kind = 'evento', el, raf = 0, tick = 0, lastK = -1;
  // etiqueta de linhagem (e se combina com o herói ativo)
  const linTag = (id) => { const d = W.CATALOG[id]; if (!d || !d.lineage) return ''; const h = E.Store.hero(); const r = h ? W.resonance(h, d) : 0; return `<small class="lin-tag">${U.esc(W.lineageName(d))}${r ? ` · <b>${r === 2 ? 'SUA LINHAGEM!' : 'SUA CLASSE'}</b>` : ''}</small>`; };

  // céu estrelado animado (2D)
  function sky(canvas, tint = ['#7fc0ff', '#b77dff']) {
    const x = canvas.getContext('2d');
    const stars = Array.from({ length: 180 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.2, t: Math.random() * 6 }));
    let t = 0;
    const draw = () => {
      const w = (canvas.width = canvas.clientWidth * Math.min(2, devicePixelRatio)), h = (canvas.height = canvas.clientHeight * Math.min(2, devicePixelRatio));
      t += 0.016;
      const g = x.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#060814'); g.addColorStop(0.6, '#121a3a'); g.addColorStop(1, '#2a1f4a');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const n = x.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.7, h * 0.3, w * 0.6);
      n.addColorStop(0, tint[0] + '33'); n.addColorStop(0.5, tint[1] + '18'); n.addColorStop(1, 'transparent');
      x.fillStyle = n; x.fillRect(0, 0, w, h);
      for (const s of stars) { x.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.t)); x.fillStyle = '#fff'; x.beginPath(); x.arc(s.x * w, s.y * h, s.r * devicePixelRatio, 0, 7); x.fill(); }
      x.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    cancelAnimationFrame(raf);
    draw();
  }

  WS.open = (k) => {
    if (el) return;
    if (k) kind = k;
    el = U.h(`<section id="wish" class="screen">
      <div class="wish-bg"><canvas></canvas></div>
      <header class="wish-top"><h2>✦ Oráculo das Armas</h2><div style="flex:1"></div><div class="wallet"></div><button class="close icon-btn" aria-label="Fechar" style="width:42px;height:42px">✕</button></header>
      <div class="banner-tabs"></div>
      <div class="banner"></div>
      <footer class="wish-foot"><div class="lnk"><button class="btn sm dark" data-a="shop"><span class="ico">🛒</span>Loja</button><button class="btn sm dark" data-a="details"><span class="ico">ℹ</span>Detalhes</button><button class="btn sm dark" data-a="history"><span class="ico">⏱</span>Histórico</button></div><div class="pity"></div><div class="wish-btns"><button class="wbtn" data-n="1"><div class="w1">Desejar ×1</div><div class="w2"><span class="ci seal">🌟</span>× 1</div></button><button class="wbtn" data-n="10"><div class="w1">Desejar ×10</div><div class="w2"><span class="ci seal">🌟</span>× 10</div></button></div></footer>
    </section>`);
    el.querySelector('.close').onclick = () => UI.close(el);
    el.querySelector('[data-a=shop]').onclick = shop;
    el.querySelector('[data-a=details]').onclick = details;
    el.querySelector('[data-a=history]').onclick = history;
    el.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => pull(Number(b.dataset.n))));
    E.WG.locked = true;
    clearInterval(tick);
    tick = setInterval(() => { if (!el) return; const t = el.querySelector('[data-timer]'); if (t) t.textContent = W.fmtDur(W.bannerEndsInMs()); if (W.windowIndex() !== lastK) draw(); }, 15000);
    UI.open(el, () => { cancelAnimationFrame(raf); clearInterval(tick); el = null; E.WG.locked = !!E.BattleUI.current; E.HUD.update(); });
    draw();
  };

  function draw() {
    const ev = W.currentEventBanner();
    lastK = W.windowIndex();
    const EC = E.ECO, ef = EC.featured(), ecoTint = [EC.CATALOG[ef.five].look.aura, EC.CATALOG[ef.five].look.c1];
    const tint = kind === 'evento' ? ev.tint : kind === 'eco' ? ecoTint : W.BANNERS.padrao.tint;
    sky(el.querySelector('.wish-bg canvas'), tint);
    el.querySelector('.wallet').innerHTML = `<span class="cur"><span class="ci gem">💎</span>${E.state.gems}</span><span class="cur"><span class="ci seal">🌟</span>${E.state.seals}</span>`;
    const tabs = el.querySelector('.banner-tabs');
    tabs.innerHTML = '';
    for (const [k, name, tt] of [['evento', ev.name, ev.tint], ['padrao', W.BANNERS.padrao.name, W.BANNERS.padrao.tint], ['eco', '👻 Invocação de Ecos', ecoTint]]) {
      const b = U.h(`<button class="${kind === k ? 'on' : ''}" style="background:linear-gradient(135deg, ${tt[0]}, ${tt[1]})">${U.esc(name)}</button>`);
      b.onclick = () => { kind = k; draw(); E.Audio.sfx('click'); };
      tabs.appendChild(b);
    }
    const b = el.querySelector('.banner');
    if (kind === 'eco') E.state.pity.eco = E.state.pity.eco || { p5: 0, p4: 0, g5: false };
    const pity = E.state.pity[kind];
    if (kind === 'eco') {
      const F5 = EC.CATALOG[ef.five];
      b.style.background = `radial-gradient(circle at 75% 40%, ${F5.look.aura}cc, transparent 55%), linear-gradient(120deg, ${E.SP.shade(F5.look.c1, -0.6)}, ${E.SP.shade(F5.look.aura, -0.45)})`;
      b.innerHTML = `<div class="bl"><span class="btype">INVOCAÇÃO DE ECOS · ESPÍRITOS GUARDIÕES</span><div class="bname">${U.esc(F5.name)}</div>
        <div class="bdesc">Um Eco flutua atrás do seu herói, dá um bônus permanente e, uma vez por combate, faz uma <b>Investida</b> (Ação Bônus). Destaque ★5: <b>${U.esc(F5.name)}</b> — ${U.esc(F5.title)}. ${(E.Eco.RATES.base5 * 100).toFixed(1)}% de ★5 por desejo, garantida na ${E.Eco.RATES.hard5}ª. Cópias aumentam a Sincronia (até 5).</div>
        <div class="bfeat">${[ef.five, ...ef.four].map((id) => { const d = EC.CATALOG[id]; return `<span class="bf r${d.rarity}"><span class="bfi"><img class="eco-mini" src="${E.ECOART.portrait(id, 1)}" alt=""></span><span>${U.esc(d.name)}<small class="lin-tag">${U.esc(EC.buffText(id, 1))}</small></span></span>`; }).join('')}</div>
        <div class="timer">⏳ Novo destaque em <b data-timer>${W.fmtDur(W.bannerEndsInMs())}</b> <button class="btn sm dark" data-a="ecos" style="margin-left:8px"><span class="ico">👻</span>Meus Ecos</button></div></div>
        <div class="br eco-br"><img class="eco-big" src="${E.ECOART.portrait(ef.five, 4)}" alt=""></div>`;
      b.querySelector('[data-a=ecos]').onclick = () => E.EcoUI.open();
    } else if (kind === 'evento') {
      const f5 = ev.featured5.map((id) => W.CATALOG[id]);
      b.style.background = `radial-gradient(circle at 75% 40%, ${ev.tint[0]}cc, transparent 55%), linear-gradient(120deg, ${E.SP.shade(ev.tint[1], -0.55)}, ${E.SP.shade(ev.tint[0], -0.35)})`;
      const h = E.Store.hero(), mine = h ? W.lineageOf(h.species, h.cls) : null, mk = mine ? W.nextFeatured(mine) : -1;
      const mineTxt = !mine ? '' : mk === lastK ? `<div class="mine now">⭐ Sua arma de linhagem, <b>${U.esc(W.CATALOG[mine].name)}</b>, está em destaque AGORA!</div>` : mk > 0 ? `<div class="mine">⭐ Sua arma de linhagem, <b>${U.esc(W.CATALOG[mine].name)}</b>, fica em destaque daqui a ${W.fmtDur(W.bannerAt(mk).start - Date.now())}.</div>` : '';
      b.innerHTML = `<div class="bl"><span class="btype">ESTANDARTE DE ARMAS · MUDA A CADA 1H30${ev.isNew ? ' <em class="bnew">LINHAGEM ★5</em>' : ''}</span><div class="bname">${U.esc(ev.name)}</div>
        <div class="bdesc">Chance aumentada para as armas ★5 <b>${f5.map((d) => d.name).join('</b> e <b>')}</b>! Cada desejo tem ${(G.RATES.evento.base5 * 100).toFixed(1)}% de chance de ★5; a ${G.RATES.evento.hard5}ª tentativa garante uma. ★4 garantida a cada 10. Todas as ${W.rotationPool().length} armas ★5 passam por aqui.</div>
        <div class="bfeat">${ev.featured5.map((id) => `<span class="bf r5"><span class="bfi">${E.WA.svg(W.CATALOG[id], { still: true })}</span><span>${U.esc(W.CATALOG[id].name)}${linTag(id)}</span></span>`).join('')}${ev.featured4.slice(0, 3).map((id) => `<span class="bf r4"><span class="bfi">${E.WA.svg(W.CATALOG[id], { still: true })}</span>${U.esc(W.CATALOG[id].name)}</span>`).join('')}</div>
        ${mineTxt}<div class="timer">⏳ Próximo estandarte em <b data-timer>${W.fmtDur(W.bannerEndsInMs())}</b> <button class="btn sm dark" data-a="next" style="margin-left:8px"><span class="ico">📅</span>Próximos</button></div></div>
        <div class="br">${E.WA.svg(f5[0], { cls: 'a' })}${E.WA.svg(f5[1], { cls: 'b' })}</div>`;
    } else {
      b.style.background = 'radial-gradient(circle at 75% 40%, #7fc0ffaa, transparent 55%), linear-gradient(120deg, #1a2448, #3a2a6a)';
      const five = Object.values(W.CATALOG).filter((d) => d.rarity === 5);
      b.innerHTML = `<div class="bl"><span class="btype">ESTANDARTE PERMANENTE</span><div class="bname">${W.BANNERS.padrao.name}</div>
        <div class="bdesc">Todas as armas do Oráculo podem aparecer. ${(G.RATES.padrao.base5 * 100).toFixed(1)}% de chance de ★5 por desejo, garantida na ${G.RATES.padrao.hard5}ª tentativa. ★4 garantida a cada 10.</div>
        <div class="bfeat">${five.slice(0, 4).map((d) => `<span class="bf r5"><span class="bfi">${E.WA.svg(d)}</span>${U.esc(d.name)}</span>`).join('')}</div></div>
        <div class="br">${E.WA.svg(five[2], { cls: 'a' })}${E.WA.svg(five[7], { cls: 'b' })}</div>`;
    }
    const nx = b.querySelector('[data-a=next]'); if (nx) nx.onclick = upcoming;
    el.querySelector('.pity').innerHTML = `Garantia ★5: ${pity.p5}/${kind === 'eco' ? E.Eco.RATES.hard5 : G.RATES[kind].hard5}${(kind === 'evento' || kind === 'eco') && pity.g5 ? ' · <b style="color:#ffd36b">próxima ★5 é destaque!</b>' : ''}`;
  }

  async function pull(n) {
    const need = G.buySealsNeeded(n);
    if (need > 0) {
      const cost = need * G.COST_GEMS;
      if (E.state.gems < cost) {
        UI.alert('Selos insuficientes', `Você precisa de ${need} Selo(s) Estelar(es) (${cost} Gemas). Gemas vêm de baús, missões, combates, subir de nível e da história.`);
        return;
      }
      const ok = await UI.confirm('Comprar Selos Estelares', `Usar ${cost} 💎 Gemas Estelares para obter ${need} 🌟 Selo(s)?`, 'Comprar e desejar');
      if (!ok) return;
    }
    const res = kind === 'eco' ? E.Eco.pull(n) : G.pull(kind, n);
    if (!res) return;
    await animate(res);
    draw();
  }

  // ---------------- animação ----------------
  async function animate(res) {
    const best = Math.max(...res.map((r) => r.rarity));
    const color = best === 5 ? '#ffcf6a' : best === 4 ? '#c99bff' : '#8ec5ff';
    const ov = U.h(`<div class="wish-anim"><canvas></canvas><button class="btn sm dark skip"><span class="ico">⏭</span>Pular</button></div>`);
    document.body.appendChild(ov);
    let skip = false;
    ov.querySelector('.skip').onclick = () => { skip = true; };
    const cv = ov.querySelector('canvas'), x = cv.getContext('2d');
    const w = (cv.width = innerWidth * Math.min(2, devicePixelRatio)), h = (cv.height = innerHeight * Math.min(2, devicePixelRatio));
    E.Audio.sfx('wish');
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.2 }));
    const meteors = [{ big: true, c: color, d: 0 }];
    for (let i = 1; i < Math.min(res.length, 6); i++) meteors.push({ big: false, c: ['#8ec5ff', '#c99bff', '#8ec5ff'][i % 3], d: 0.08 * i });
    const trail = [];
    const t0 = performance.now(), dur = 2800;
    await new Promise((resolve) => {
      const frame = (now) => {
        const t = (now - t0) / dur;
        x.fillStyle = '#04050c'; x.fillRect(0, 0, w, h);
        for (const s of stars) { x.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.5})`; x.fillRect(s.x, s.y, s.r, s.r); }
        for (const m of meteors) {
          const k = U.clamp((t - m.d) / 0.75, 0, 1);
          if (k <= 0) continue;
          const e = U.ease.inOutCubic(k);
          const sx = w * (1.05 - (m.big ? 0 : m.d)), sy = -h * 0.05, ex = w * (m.big ? 0.45 : 0.1 + m.d), ey = h * (m.big ? 0.62 : 0.8);
          const px = U.lerp(sx, ex, e), py = U.lerp(sy, ey, e) + Math.sin(e * Math.PI) * h * 0.08;
          trail.push({ x: px, y: py, c: m.c, a: 1, r: m.big ? 7 : 3 });
          const g = x.createRadialGradient(px, py, 0, px, py, m.big ? 60 : 24);
          g.addColorStop(0, '#fff'); g.addColorStop(0.2, m.c); g.addColorStop(1, 'transparent');
          x.fillStyle = g; x.beginPath(); x.arc(px, py, m.big ? 60 : 24, 0, 7); x.fill();
        }
        for (const p of trail) { p.a *= 0.94; p.r *= 0.985; x.globalAlpha = p.a; x.fillStyle = p.c; x.beginPath(); x.arc(p.x + (Math.random() - 0.5) * 3, p.y + (Math.random() - 0.5) * 3, p.r, 0, 7); x.fill(); }
        x.globalAlpha = 1;
        if (t > 0.78) { x.fillStyle = `rgba(255,255,255,${U.clamp((t - 0.78) / 0.22, 0, 1)})`; x.fillRect(0, 0, w, h); }
        if (t < 1 && !skip) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
    ov.remove();
    // revelações
    if (!skip) {
      for (const r of res) {
        if (res.length > 1 && r.rarity === 3) continue; // ★3 aparecem só no resumo do ×10
        await reveal(r);
      }
    }
    if (res.length > 1 || skip) await summary(res);
  }

  function reveal(r) {
    return new Promise((resolve) => {
      E.Audio.sfx('star' + r.rarity);
      if (r.eco) { // Eco revelado
        const d = E.ECO.CATALOG[r.id];
        const box = U.h(`<div class="reveal r${r.rarity}"><div class="rays"></div><div class="rv-art eco"><img src="${E.ECOART.portrait(r.id, 5)}" alt=""></div>
          <div class="rv-info"><div class="rv-name">${U.esc(d.name)}${r.isNew ? '<span class="rv-new">NOVO</span>' : ''}</div><div class="rv-stars">${'★'.repeat(r.rarity).split('').map((s, i) => `<span style="animation-delay:${0.5 + i * 0.12}s">${s}</span>`).join('')}</div><div class="rv-type">👻 ${U.esc(d.title)} · Sincronia ${r.sync}${r.gems ? ` (máxima: +${r.gems} 💎)` : ''}</div><div class="rv-lin">「${U.esc(d.cry)}」</div><div class="rv-insp">Inspirado em ${U.esc(d.insp)}</div></div>
          <div class="rv-tap">TOQUE PARA CONTINUAR</div></div>`);
        document.body.appendChild(box);
        setTimeout(() => { box.onclick = () => { box.remove(); resolve(); }; }, 450);
        return;
      }
      const def = W.CATALOG[r.id];
      const box = U.h(`<div class="reveal r${r.rarity}"><div class="rays"></div><div class="rv-art">${E.WA.svg(def)}</div>
        <div class="rv-info"><div class="rv-name">${U.esc(def.name)}${r.isNew ? '<span class="rv-new">NOVO</span>' : ''}</div><div class="rv-stars">${'★'.repeat(r.rarity).split('').map((s, i) => `<span style="animation-delay:${0.5 + i * 0.12}s">${s}</span>`).join('')}</div><div class="rv-type">${E.WA.typeIcon(def.type)} ${W.TYPES[def.type].name} · ${W.RARITY[r.rarity].name} (+${W.RARITY[r.rarity].bonus})</div>${def.lineage ? `<div class="rv-lin">Arma de Linhagem · ${U.esc(W.lineageName(def))}${linTag(r.id).includes('<b>') ? ' · <b>combina com você!</b>' : ''}</div><div class="rv-insp">Inspirada em ${U.esc(def.insp)}</div>` : ''}</div>
        <div class="rv-tap">TOQUE PARA CONTINUAR</div></div>`);
      document.body.appendChild(box);
      setTimeout(() => { box.onclick = () => { box.remove(); resolve(); }; }, 450);
    });
  }

  function summary(res) {
    return new Promise((resolve) => {
      const sorted = res.slice().sort((a, b) => b.rarity - a.rarity);
      const box = U.h(`<div class="summary"><div class="sum-row">${sorted.map((r, i) => `<div class="sum-card r${r.rarity}" style="animation-delay:${i * 0.06}s">${r.eco ? `<img class="eco-sum" src="${E.ECOART.portrait(r.id, 2)}" alt="">` : E.WA.svg(W.CATALOG[r.id])}<span class="ss">${'★'.repeat(r.rarity)}</span></div>`).join('')}</div><button class="btn primary"><span class="ico">✓</span>Confirmar</button></div>`);
      box.querySelector('button').onclick = () => { box.remove(); resolve(); };
      document.body.appendChild(box);
    });
  }

  function shop() {
    const html = `<div class="shop-item"><div class="si">🌟</div><div class="sx"><b>Selo Estelar ×1</b><small>160 Gemas Estelares</small></div><button class="btn sm primary" data-n="1"><span class="ico">💎</span>160</button></div>
      <div class="shop-item"><div class="si">🌟</div><div class="sx"><b>Selo Estelar ×10</b><small>1600 Gemas Estelares</small></div><button class="btn sm primary" data-n="10"><span class="ico">💎</span>1600</button></div>
      <p style="font-size:12px;color:#5a6378;text-align:center">Gemas Estelares só existem dentro do jogo — não há compras com dinheiro real.</p>`;
    UI.modal({ title: 'Loja de Selos', html, buttons: [{ label: 'Fechar', value: true }] });
    UI._modalBody.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => {
      const n = Number(b.dataset.n);
      if (E.state.gems < n * 160) return UI.toast('Gemas insuficientes.');
      E.state.gems -= n * 160; E.state.seals += n; E.Store.save(); UI.toast(`🌟 +${n} Selo(s) Estelar(es)`); draw();
    }));
  }
  // próximos estandartes (as próximas 12 janelas de 1h30)
  function upcoming() {
    const h = E.Store.hero(), mine = h ? W.lineageOf(h.species, h.cls) : null;
    const k0 = W.windowIndex();
    const rows = Array.from({ length: 12 }, (_, i) => W.bannerAt(k0 + i)).map((bn, i) => {
      const when = i === 0 ? 'Agora' : new Date(bn.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `<div class="up-row ${bn.featured5.includes(mine) ? 'mine' : ''}"><b>${when}</b><span>${bn.featured5.map((id) => `<span class="up-w"><span class="up-i">${E.WA.svg(W.CATALOG[id], { aura: false, still: true })}</span>${U.esc(W.CATALOG[id].name)}${linTag(id)}</span>`).join('')}</span></div>`;
    }).join('');
    const mk = mine ? W.nextFeatured(mine) : -1;
    UI.modal({ title: '📅 Próximos estandartes', html: `${mine ? `<p class="muted tr-tip">Sua arma de linhagem (${U.esc(W.lineageName(W.CATALOG[mine]))}): <b>${U.esc(W.CATALOG[mine].name)}</b> — ${mk === k0 ? 'em destaque agora!' : mk > 0 ? `em destaque às ${new Date(W.bannerAt(mk).start).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}.` : 'fora das próximas voltas.'}</p>` : ''}<div class="up-list">${rows}</div>`, buttons: [{ label: 'Fechar', value: true, cls: 'primary' }] });
  }
  function details() {
    const ev = W.currentEventBanner();
    const R5 = kind === 'eco' ? E.Eco.RATES : G.RATES[kind];
    UI.modal({
      title: 'Detalhes do Estandarte',
      html: `<div style="font-size:13px;line-height:1.6;color:#4a5366">
        <p><b>Probabilidade base:</b> ★5 ${(R5.base5 * 100).toFixed(1)}% · ★4 ${(R5.base4 * 100).toFixed(1)}% · ★3 restante.</p>
        <p><b>Garantia:</b> a chance de ★5 aumenta a partir do ${R5.soft5}º desejo e é garantida no ${R5.hard5}º. Pelo menos uma ★4 ou superior a cada 10 desejos.</p>
        ${kind === 'eco' ? `<p><b>Ecos:</b> espíritos guardiões que seguem o herói. Cada um dá um bônus permanente (CA, Iniciativa, dano extra, cura…) e uma Investida 1× por combate como Ação Bônus. O ★5 em destaque muda junto com o estandarte de armas (a cada 1h30); 50% das ★5 são o destaque, e se não for, a próxima é. Cópias aumentam a Sincronia até 5; depois disso viram Gemas.</p>` : ''}${kind === 'evento' ? `<p><b>Rotação:</b> o estandarte de evento muda a cada 1h30 e passa por todas as ${W.rotationPool().length} armas ★5 (duas em destaque por vez). A garantia de ★5 e a de destaque continuam valendo de um estandarte para o outro.</p><p><b>Destaque:</b> ao obter uma ★5, há 75% de chance de ser <b>${ev.featured5.map((i) => W.CATALOG[i].name).join(' ou ')}</b>. Se não for, a próxima ★5 é garantidamente uma destaque. O mesmo vale para as ★4 em destaque: ${ev.featured4.map((i) => W.CATALOG[i].name).join(', ')}.</p>` : '<p>Todas as armas do Oráculo podem aparecer neste estandarte.</p>'}
        <p><b>Raridades (regras D&amp;D 2024):</b> ★3 Incomum = arma +1 · ★4 Rara = +2 com efeito · ★5 Muito Rara = +3 com efeito único.</p>
        <p><b>Refinamento:</b> cópias repetidas refinam a arma até R5, fortalecendo o efeito passivo. Cópias além disso podem ser fundidas em Gemas no Arsenal.</p>
        <p><b>Tipos:</b> Espada, Espadão, Haste, Arco e Catalisador. Cada classe tem proficiência com certos tipos (ex.: Magos usam Catalisadores e armas simples).</p></div>`,
      buttons: [{ label: 'Fechar', value: true, cls: 'primary' }],
    });
  }
  function history() {
    const rows = E.state.history.slice(0, 60).map((r) => `<div style="display:flex;justify-content:space-between;padding:6px 4px;border-bottom:1px dashed #d6ccb6;font-size:13px"><span style="color:${r.rarity === 5 ? '#c9861a' : r.rarity === 4 ? '#8a4ad0' : '#3a6ab0'};font-weight:800">${'★'.repeat(r.rarity)} ${U.esc((r.eco ? E.ECO.CATALOG[r.id] : W.CATALOG[r.id] || {}).name || r.id)}</span><span style="color:#7a7f8c">${r.kind === 'evento' ? 'Evento' : r.kind === 'eco' ? 'Ecos' : 'Permanente'} · ${new Date(r.t).toLocaleDateString('pt-BR')}</span></div>`).join('') || '<p style="text-align:center;color:#5a6378">Nenhum desejo ainda.</p>';
    UI.modal({ title: 'Histórico de Desejos', html: rows, buttons: [{ label: 'Fechar', value: true, cls: 'primary' }] });
  }

  E.Wish = WS;
})();
