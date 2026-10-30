/* Tela do dia de trabalho: atividades práticas (cozinha, bancada do pescado, ofício, triagem e troco) e o
   balcão de fornecedor da peixaria. A tela só desenha e envia ações; quem confere e paga é E.Workday. */
(() => {
  'use strict';
  const U = E.U, WD = () => E.Workday, SS = () => E.Settlements;
  const icon = (k) => E.Icons ? E.Icons.html(E.IconCatalog && !E.IconCatalog[k] ? ({ anchor: 'boat', roulette: 'dice' })[k] || 'package' : k || 'package', { decorative: true }) : '';
  const esc = (s) => U.esc(String(s == null ? '' : s));
  const stars = (n) => '★'.repeat(n) + '☆'.repeat(Math.max(0, 4 - n));
  const fishArt = (id) => { try { return E.Fishing && E.Fishing.art ? E.Fishing.art(E.L.FISH[id], 4) : ''; } catch (e) { return ''; } };
  const sfx = (k) => { if (E.Audio && E.Audio.sfx) E.Audio.sfx(k); };
  const WK = {};
  let el = null, raf = 0, busy = false, wasLocked = false, pending = null;

  const INTRO = {
    kitchen: (t) => `Hoje você prepara 5 pedidos na ${t.title.toLowerCase()}: coloque os ingredientes certos e acerte o ${t.zone}.`,
    fish: () => 'Hoje chegam 8 peixes à bancada: separe cada um na caixa certa e limpe os que ficam.',
    forge: (t) => `Hoje você trabalha em 3 peças: ${t.verb.toLowerCase()} quando a agulha passar pelo ${t.zone}.`,
    sort: () => 'Hoje chegam 10 itens: leia a etiqueta e mande cada um para o lugar certo antes que o tempo acabe.',
    payout: (t) => `Hoje você atende 6 pessoas no(a) ${t.title.toLowerCase()}: faça a conta e entregue o valor exato.`,
  };
  WK.intro = (job) => { const f = WD().family(job), t = WD().theme(job); return INTRO[f] ? INTRO[f](t) : ''; };

  function close() {
    cancelAnimationFrame(raf); raf = 0;
    if (el) { el.remove(); el = null; }
    if (E.WG) { E.WG.locked = E.WG.mode && E.WG.mode() === 'interior' ? true : wasLocked; E.WG.input.keys = {}; }
    document.body.classList.remove('working');
  }
  WK.close = close;
  WK.start = (it) => {
    const h = E.Store.hero(); if (!h) return;
    const r = WD().begin(h, it.region);
    if (!r.ok) { E.UI.toast(r.message); return; }
    if (E.WorldServices) E.WorldServices.close();
    wasLocked = !!(E.WG && E.WG.locked);
    el = U.h('<section class="wk" role="dialog" aria-label="Dia de trabalho"><div class="wk-card"></div></section>');
    document.getElementById('ui').appendChild(el); document.body.classList.add('working');
    if (E.WG) E.WG.locked = true;
    render(); loop();
  };

  function head(s) {
    const def = SS().JOBS[s.job], t = WD().theme(s.job), sp = WD().specialty(E.Store.hero(), s.job);
    const dots = s.tasks.map((_, i) => `<i class="${i < s.i ? (s.scores[i] >= .75 ? 'ok' : s.scores[i] >= .4 ? 'mid' : 'bad') : i === s.i ? 'cur' : ''}"></i>`).join('');
    return `<header class="wk-head"><span class="wk-ico">${icon(def.icon)}</span><div><small>${esc(t.title)} · ${esc(SS().placeName(def.place))}</small><b>${esc(def.name)}</b></div><span class="wk-spec" title="Especialidade">${esc(sp.name)} Nv. ${sp.lv} · ${esc(sp.rank)}</span><button class="wk-x" data-x aria-label="Sair">✕</button></header><div class="wk-dots">${dots}</div>`;
  }
  function render() {
    if (!el) return;
    const s = WD().session(), card = el.querySelector('.wk-card');
    if (!s) return close();
    if (s.i >= s.tasks.length) return finish();
    const t = s.tasks[s.i], body = ({ kitchen, fish, forge, sort, payout })[s.family](s, t);
    card.innerHTML = head(s) + `<div class="wk-body wk-${s.family}">${body}</div><div class="wk-note" aria-live="polite"></div>`;
    card.querySelector('[data-x]').onclick = async () => { if (await E.UI.confirm('Sair do trabalho?', 'O dia só é pago quando todas as tarefas terminam. Você pode voltar e recomeçar hoje mesmo.')) { WD().abort(); close(); } };
    bind(s, t, card);
    if (pending) { note(pending[0], pending[1]); pending = null; }
  }
  const note = (text, good) => { const n = el && el.querySelector('.wk-note'); if (!n) return; n.textContent = text || ''; n.className = 'wk-note ' + (good ? 'good' : good === false ? 'bad' : ''); };
  // Mostra o retorno da ação; quando a tarefa terminou, passa para a próxima depois de um instante.
  const after = (r, redraw = true) => {
    if (!r || (!r.ok && !r.message)) return;
    if (!r.ok) { note(r.message, false); sfx('error'); return; }
    if (r.score !== undefined) {
      busy = true; note(r.message, r.score >= .75 ? true : r.score >= .4 ? null : false); sfx(r.score >= .75 ? 'chest' : 'error');
      el.querySelector('.wk-body').classList.add(r.score >= .75 ? 'flash-ok' : 'flash-bad');
      setTimeout(() => { busy = false; render(); }, 850);
      return;
    }
    if (r.message) pending = [r.message, r.retry ? false : r.q === undefined || r.q >= .75 ? true : r.q > 0 ? null : false];
    if (redraw) render();
  };

  // ------------------------------------------------------------ cozinha
  function kitchen(s, t) {
    const th = WD().theme(s.job), I = WD().ING;
    const need = Object.entries(t.need).map(([k, n]) => `<li>${icon(I[k][1])}<span>${esc(I[k][0])}</span><b>×${n}</b></li>`).join('');
    const bowl = Object.entries(t.bowl).map(([k, n]) => `<button class="wk-chip" data-rm="${k}" title="Tirar">${icon(I[k][1])}${esc(I[k][0])} ×${n}</button>`).join('') || `<em>Toque nos ingredientes para colocar na ${esc(th.bowl.toLowerCase())}.</em>`;
    const pantry = th.pantry.map((k) => `<button class="wk-ing" data-add="${k}" ${t.phase !== 'prep' ? 'disabled' : ''}>${icon(I[k][1])}<span>${esc(I[k][0])}</span></button>`).join('');
    const cooking = t.phase === 'cook';
    return `<div class="wk-ticket"><small>Pedido ${s.i + 1} de ${s.tasks.length}</small><b>${esc(t.dish)}</b><ul>${need}</ul><i class="wk-time"><b data-time></b></i></div>
      <div class="wk-station"><div class="wk-bowl ${cooking ? 'hot' : ''}"><small>${esc(th.bowl)}</small><div>${bowl}</div></div>
      ${cooking ? `<div class="wk-meter"><small>Pare a agulha no ${esc(th.zone)}</small><div class="wk-bar"><i class="zone" style="left:${t.zone[0] * 100}%;width:${(t.zone[1] - t.zone[0]) * 100}%"></i><i class="needle" data-needle></i></div></div>` : `<div class="wk-pantry">${pantry}</div>`}</div>
      <div class="wk-actions">${cooking ? `<button class="btn primary" data-stop><span class="ico">✓</span>${esc(th.stop)} <kbd>Espaço</kbd></button>` : `<button class="btn primary" data-cook ${Object.keys(t.bowl).length ? '' : 'disabled'}><span class="ico">🔥</span>${esc(th.cook)}</button>`}</div>`;
  }
  // ------------------------------------------------------------ pescado
  function fish(s, t) {
    const f = t.fish, art = fishArt(f.id), R = (E.L.RARITY || [])[f.r] || { color: '#ccc', name: '' };
    if (t.phase === 'clean') return `<div class="wk-fishcard clean"><div class="wk-fishart">${art ? `<img src="${art}" alt="">` : icon('fish')}</div><b>${esc(f.name)}</b><small>Retire as escamas e as vísceras</small><div class="wk-taps">${[0, 1, 2, 3].map((i) => `<i class="${i < t.taps ? 'on' : ''}"></i>`).join('')}</div></div><div class="wk-actions"><button class="btn primary" data-clean><span class="ico">🔪</span>Limpar <kbd>Espaço</kbd></button></div>`;
    return `<div class="wk-fishcard"><div class="wk-fishart">${art ? `<img src="${art}" alt="">` : icon('fish')}</div><b>${esc(f.name)}</b><span class="wk-stars" style="color:${R.color}">${stars(f.r)} <small>${esc(R.name)}</small></span><span class="wk-cm">${f.cm} cm <small>mínimo ${f.minKeep} cm</small></span></div>
      <div class="wk-bins">${WD().FISH_BINS.map(([id, name, rule], i) => `<button class="wk-bin" data-fbin="${id}"><kbd>${i + 1}</kbd><b>${esc(name)}</b><small>${esc(rule)}</small></button>`).join('')}</div>`;
  }
  // ------------------------------------------------------------ ofício (bigorna, serra, lapidação)
  function forge(s, t) {
    const th = WD().theme(s.job); WD().aim();
    const marks = t.hits.map((h) => `<i class="${h.q >= 1 ? 'p' : h.q >= .75 ? 'g' : h.q > 0 ? 'm' : 'x'}"></i>`).join('') + '<i></i>'.repeat(t.strikes - t.hits.length);
    return `<div class="wk-piece"><span class="wk-big">${icon(th.icon)}</span><div><small>Peça ${s.i + 1} de ${s.tasks.length}</small><b>${esc(t.piece)}</b><div class="wk-marks">${marks}</div></div></div>
      <div class="wk-meter"><small>${esc(th.verb)} quando a agulha estiver no ${esc(th.zone)} (centro = perfeito)</small><div class="wk-bar"><i class="zone" style="left:${t.zone[0] * 100}%;width:${(t.zone[1] - t.zone[0]) * 100}%"></i><i class="needle" data-needle></i></div></div>
      <div class="wk-actions"><button class="btn primary" data-strike><span class="ico">${icon(th.icon)}</span>${esc(th.verb)} <kbd>Espaço</kbd></button></div>`;
  }
  // ------------------------------------------------------------ triagem
  function sort(s, t) {
    const th = WD().theme(s.job);
    return `<div class="wk-item"><span class="wk-big">${icon(t.icon || th.icon)}</span><div><small>Item ${s.i + 1} de ${s.tasks.length}</small><b>${esc(t.label)}</b><span>${esc(t.detail)}</span></div><i class="wk-time"><b data-time></b></i></div>
      <div class="wk-bins">${th.bins.map(([id, name], i) => `<button class="wk-bin" data-sbin="${id}"><kbd>${i + 1}</kbd><b>${esc(name)}</b></button>`).join('')}</div>`;
  }
  // ------------------------------------------------------------ troco / fichas
  function payout(s, t) {
    const th = WD().theme(s.job), sum = t.given.reduce((a, b) => a + b, 0);
    return `<div class="wk-customer"><span class="wk-big">${icon(s.job === 'receptionist' ? 'bed' : s.job === 'dealer' ? 'roulette' : 'coin')}</span><div><small>Atendimento ${s.i + 1} de ${s.tasks.length}</small><p>${esc(t.text)}</p></div></div>
      <div class="wk-tray"><small>No balcão: <b>${sum} ${esc(th.unit)}</b></small><div>${t.given.map((v, i) => `<button class="wk-coin c${v}" data-take="${i}" title="Tirar">${v}</button>`).join('') || '<em>Toque nas moedas abaixo para montar o valor.</em>'}</div></div>
      <div class="wk-coins">${th.coins.map((v) => `<button class="wk-coin c${v}" data-give="${v}">${v}<small>${esc(th.unit)}</small></button>`).join('')}</div>
      <div class="wk-actions"><button class="btn primary" data-confirm ${t.given.length ? '' : 'disabled'}><span class="ico">✓</span>Entregar</button></div>`;
  }

  function bind(s, t, card) {
    const on = (sel, fn) => card.querySelectorAll(sel).forEach((b) => (b.onclick = () => { if (!busy) fn(b); }));
    on('[data-add]', (b) => { const r = WD().add(b.dataset.add); sfx('click'); after(r); });
    on('[data-rm]', (b) => after(WD().remove(b.dataset.rm)));
    on('[data-cook]', () => { sfx('click'); after(WD().cook()); });
    on('[data-stop]', () => after(WD().stop()));
    on('[data-fbin]', (b) => after(WD().sortFish(b.dataset.fbin)));
    on('[data-clean]', () => { sfx('slash'); after(WD().clean()); });
    on('[data-strike]', () => { const r = WD().strike(); sfx(r.q >= .75 ? 'impact' : 'click'); after(r); });
    on('[data-sbin]', (b) => after(WD().sortItem(b.dataset.sbin)));
    on('[data-give]', (b) => { sfx('click'); after(WD().give(+b.dataset.give)); });
    on('[data-take]', (b) => after(WD().take(+b.dataset.take)));
    on('[data-confirm]', () => after(WD().confirm()));
  }
  // agulhas e cronômetros
  function loop() {
    cancelAnimationFrame(raf);
    const tick = () => {
      if (!el) return;
      const s = WD().session(), t = s && s.tasks[s.i];
      if (t) {
        const n = el.querySelector('[data-needle]');
        if (n) { const pos = s.family === 'kitchen' ? (t.phase === 'cook' ? WD().needle(t.cookAt) : 0) : t.zone && t.at ? WD().needle(t.at, t.speed) : 0; n.style.left = (pos * 100).toFixed(2) + '%'; }
        const tm = el.querySelector('[data-time]');
        if (tm && t.limit) { const left = Math.max(0, 1 - (performance.now() - s.taskAt) / 1000 / t.limit); tm.style.width = (left * 100).toFixed(1) + '%'; tm.parentNode.classList.toggle('low', left < .3); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  addEventListener('keydown', (e) => {
    if (!el || busy || e.repeat) return;
    const s = WD().session(); if (!s) return;
    if (e.code === 'Escape') { e.preventDefault(); el.querySelector('[data-x]') && el.querySelector('[data-x]').click(); return; }
    if (e.code === 'Space' || e.code === 'Enter') { const b = el.querySelector('[data-stop],[data-strike],[data-clean],[data-cook]:not([disabled]),[data-confirm]:not([disabled]),[data-done]'); if (b) { e.preventDefault(); b.click(); } return; }
    const m = /^Digit([1-9])$/.exec(e.code); if (m) { const b = el.querySelectorAll('[data-fbin],[data-sbin]')[+m[1] - 1]; if (b) { e.preventDefault(); b.click(); } }
  }, true);

  // ------------------------------------------------------------ fim do dia
  function finish() {
    const r = WD().finish(); if (!el) return;
    const card = el.querySelector('.wk-card');
    if (!r.ok) { card.innerHTML = `<div class="wk-done"><h3>Não foi possível fechar o dia</h3><p>${esc(r.message)}</p><button class="btn primary" data-done>Voltar</button></div>`; card.querySelector('[data-done]').onclick = close; return; }
    sfx(r.levels ? 'levelup' : 'chest');
    card.innerHTML = WK.summary(r) + '<div class="wk-actions"><button class="btn primary" data-done><span class="ico">✓</span>Voltar ao jogo</button></div>';
    card.querySelector('[data-done]').onclick = close;
  }
  // Resumo usado por todas as atividades (inclusive o caixa da loja).
  WK.summary = (r) => {
    const h = E.Store.hero(), sp = r.specialty, before = r.before, T = E.R.XP_TABLE, lvPct = T[h.level + 1] ? Math.round((h.xp - T[h.level]) / (T[h.level + 1] - T[h.level]) * 100) : 100;
    return `<div class="wk-done"><small>DIA DE TRABALHO CONCLUÍDO</small><h3>${r.acc >= 85 ? 'Excelente trabalho!' : r.acc >= 60 ? 'Bom trabalho!' : 'Dia difícil, mas pago.'}</h3>
      <div class="wk-ring" style="--p:${r.acc}"><b>${r.acc}%</b><small>desempenho</small></div>
      <div class="wk-rewards">
        <div><span>${icon('coin')}</span><b>+${r.pay} po</b><small>Salário${before && before.bonus ? ` (+${before.bonus}% de especialidade)` : ''}</small></div>
        <div><span>${icon('star')}</span><b>+${r.xp} XP</b><small>Nível ${h.level}${r.levels ? ' · subiu de nível!' : ''}</small><i class="wk-prog"><b style="width:${lvPct}%"></b></i></div>
        <div><span>${icon('hammer')}</span><b>+${r.sxp} XP</b><small>${esc(sp.name)} Nv. ${sp.lv} · ${esc(sp.rank)}${before && sp.lv > before.lv ? ' · subiu!' : ''}</small><i class="wk-prog"><b style="width:${sp.pct}%"></b></i></div>
      </div><p class="wk-tip">Cada nível de especialidade aumenta o salário em 5%. Volte amanhã para outro dia de trabalho.</p></div>`;
  };

  // ------------------------------------------------------------ fornecedor da peixaria
  WK.supplier = (it, page = 0) => {
    const h = E.Store.hero(), W = E.WorldServices; if (!h || !W) return;
    const t = WD().tier(h), orders = WD().orders(h, it.region), bag = E.Life.data(h).fish;
    const fishList = Object.entries(bag).filter(([id, n]) => E.L.FISH[id] && n > 0).sort((a, b) => (E.L.FISH[b[0]].r - E.L.FISH[a[0]].r));
    const rows = orders.map((o) => { const f = E.L.FISH[o.fish], have = bag[o.fish] || 0; return `<div class="sp-order ${o.done ? 'done' : have >= o.qty ? 'ready' : ''}"><img src="${fishArt(o.fish)}" alt=""><div><b>${o.qty} × ${esc(f.name)}</b><small>${o.unit} po cada · total ${o.unit * o.qty} po · ${o.done ? 'entregue' : `você tem ${have}`}</small></div>${o.done ? '<span class="sp-ok">✓</span>' : `<button class="btn sm ${have >= o.qty ? 'primary' : 'dark'}" data-deliver="${o.id}" ${have >= o.qty ? '' : 'disabled'}>Entregar</button>`}</div>`; }).join('');
    const sell = fishList.slice(0, 8).map(([id, n]) => `<div class="sp-fish"><img src="${fishArt(id)}" alt=""><span>${esc(E.L.FISH[id].name)} ×${n}</span><b>${WD().fishPrice(h, id)} po</b><button class="btn sm dark" data-sell="${id}" data-n="1">Vender 1</button>${n > 1 ? `<button class="btn sm dark" data-sell="${id}" data-n="${n}">Todos</button>` : ''}</div>`).join('');
    const total = fishList.reduce((a, [id, n]) => a + WD().fishPrice(h, id) * n, 0);
    const html = `<div class="sp"><div class="sp-tier"><b>${esc(t.name)}</b><small>Reputação ${t.rep}${t.next ? ` / ${t.next.min} para ${esc(t.next.name)}` : ''} · bônus de venda +${t.bonus}%</small><i class="wk-prog"><b style="width:${t.next ? Math.min(100, Math.round((t.rep - t.min) / (t.next.min - t.min) * 100)) : 100}%"></b></i></div>
      <h4>Encomendas de hoje <small>pagam 50% a mais${t.bonus ? ` (+${t.bonus * 2}% pelo seu nível)` : ''}</small></h4>${rows || '<p>Sem encomendas hoje.</p>'}
      <h4>Vender o seu pescado <small>${fishList.length ? `tudo vale ${total} po` : 'sua mochila está sem peixes'}</small></h4>${sell || '<p>Pesque nos lagos e rios e traga o pescado. Encomendas pagam mais que a venda avulsa.</p>'}</div>`;
    W.open({ title: 'Fornecedor da peixaria', icon: 'fish', eyebrow: 'PEIXARIA', text: 'O peixeiro compra o que você pesca. Cumpra as encomendas do dia para ganhar mais ouro, XP e reputação de fornecedor.', html, actions: fishList.length > 1 ? [{ label: `Vender todo o pescado · ${total} po`, primary: false, run: async () => { if (!(await E.UI.confirm('Vender todo o pescado?', 'Peixes raros também serão vendidos. Guarde os que quiser cozinhar ou entregar nas encomendas.'))) return WK.supplier(it); let g = 0; for (const [id, n] of fishList) { const r = WD().sellFish(h, id, n); if (r.ok) g += r.gold; } E.UI.toast(`Pescado vendido: +${g} po`, 'gold'); sfx('chest'); WK.supplier(it); } }] : [],
      mount: (box) => {
        box.querySelectorAll('[data-deliver]').forEach((b) => (b.onclick = () => { const r = WD().deliver(h, it.region, b.dataset.deliver); E.UI.toast(r.message, r.ok ? 'gold' : ''); if (r.ok) sfx(r.tierUp ? 'levelup' : 'chest'); WK.supplier(it); }));
        box.querySelectorAll('[data-sell]').forEach((b) => (b.onclick = () => { const r = WD().sellFish(h, b.dataset.sell, +b.dataset.n); E.UI.toast(r.message, r.ok ? 'gold' : ''); if (r.ok) sfx('chest'); WK.supplier(it); }));
      } });
  };
  E.Workshift = WK;
})();
