/* Painel "Minha loja": tudo numa tela só. Abasteça com a mochila, ajuste o preço, abra as portas e
   acompanhe o movimento; os clientes compram sozinhos quando o preço está justo (regras locais, sem IA). */
(() => {
  'use strict';
  const V = E.Vendor, U = E.U, UI = E.UI;
  const icon = (key) => E.Icons.html(key || 'package', { decorative: true });
  const esc = U.esc;
  const KIND = { food: 'Comida', fish: 'Peixes', inventory: 'Poções e itens', ore: 'Minérios', cargo: 'Mercadorias', material: 'Coleta', weapon: 'Armas' };
  const NEED = { comida: 'comida', ingredientes: 'ingredientes', peixes: 'peixes', cura: 'poções de cura', alquimia: 'alquimia', materiais: 'materiais', mercadorias: 'mercadorias', armas: 'armas' };
  // Região da loja: a atual, se houver ponto aqui; senão, a primeira em que o herói tem ponto.
  const shopRegion = (h, region) => {
    if (E.Settlements.property(h, region, 'shop')) return E.Settlements.region(region);
    const k = Object.keys(E.Settlements.data(h).properties).find((key) => key.endsWith(':shop'));
    return k ? k.split(':')[0] : null;
  };
  V.open = (region = E.Settlements.region()) => {
    const h = E.Store.hero(); if (!h) return;
    const r0 = shopRegion(h, region);
    if (!r0) {
      const price = E.Settlements.prices(E.Settlements.region(region), 'shop');
      UI.modal({ title: 'Sua loja', html: `<p>Para vender, alugue um ponto comercial na vila (${price.rent} po por dia) ou compre o ponto (${price.buy} po). Depois é só colocar produtos na prateleira, escolher o preço e abrir as portas: de dia os clientes compram sozinhos.</p>`, buttons: [{ label: 'Depois', cls: 'dark', value: false }, { label: 'Mostrar o ponto na vila', cls: 'primary', value: true }] }).then((go) => { if (go && E.WorldServices) E.WorldServices.guide('player-shop', region); });
      return;
    }
    const region0 = r0;
    UI.closeAll && UI.closeAll();
    const el = UI.screen('Minha loja', { cls: 'shop-screen' }), body = el.querySelector('.screen-body');
    let note = '';
    const draw = () => {
      const p = V.property(h, region0) || {}, s = V.shop(h, region0), sum = V.summary(h, region0), access = V.access(h, region0), cl = E.Sim.clock();
      const regionName = E.Settlements.regionName(region0), inv = V.inventory(h);
      const rep = Math.round(s.reputation), starsN = Math.min(5, Math.floor(rep / 20) + 1);
      const shelf = s.stocks.map((e) => { const dm = V.demand(e); return `<div class="sh-row"><span class="sh-ic">${icon(e.item.iconKey)}</span><div class="sh-name"><b>${esc(e.item.name)}</b><small>${e.quantity} na prateleira · justo ${V.fair(e)} po</small></div>
        <div class="sh-price"><button data-dp="${e.id}" data-d="-1" aria-label="Baixar preço">−</button><b>${e.price} po</b><button data-dp="${e.id}" data-d="1" aria-label="Subir preço">+</button></div><span class="sh-dem ${dm.id}">${dm.label}</span><button class="sh-link" data-take="${e.id}">Retirar</button></div>`; }).join('');
      const rows = inv.slice(0, 30).map((x) => { const fair = E.Settlements.price(region0, x.baseValue); return `<div class="sh-row inv"><span class="sh-ic">${icon(x.iconKey)}</span><div class="sh-name"><b>${esc(x.name)}</b><small>${esc(KIND[x.kind] || '')} · ${x.quantity} na mochila · preço justo ${fair} po</small></div><button class="btn sm dark" data-add="${esc(x.key)}" data-n="1" data-p="${fair}">Expor 1</button>${x.quantity > 1 ? `<button class="btn sm" data-add="${esc(x.key)}" data-n="${Math.min(x.quantity, 50)}" data-p="${fair}">Expor ${Math.min(x.quantity, 50)}</button>` : ''}</div>`; }).join('');
      const events = (s.events || []).slice(0, 8).map((ev) => `<p class="${ev.bought ? 'good' : ''}">${ev.bought ? '🪙' : '·'} ${esc(ev.text || '')}</p>`).join('');
      const missed = Object.entries(sum.today.missed || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => NEED[k] || k).join(' e ');
      const setup = !s.stocks.length || !s.open;
      body.innerHTML = `<div class="sh">
        <section class="sh-top"><div><small>${esc(regionName.toUpperCase())}</small><h3>${esc(p.name || 'Minha banca')}</h3><span>${p.mode === 'owned' ? 'Ponto próprio · sem aluguel' : `Aluguel: ${sum.rent} po por dia (cobrado sozinho)`}${access ? '' : ' · <b class="bad">aluguel atrasado</b>'}</span></div>
          <button class="sh-toggle ${s.open ? 'on' : ''}" data-toggle ${access ? '' : 'disabled'}><i></i><b>${s.open ? 'ABERTA' : 'FECHADA'}</b><small>${s.open ? (cl.night ? 'Noite: clientes voltam de manhã' : 'Clientes chegando') : 'Toque para abrir'}</small></button></section>
        ${setup ? `<ol class="sh-steps"><li class="${s.stocks.length ? 'done' : ''}">Coloque produtos da mochila na prateleira</li><li class="${s.stocks.length ? 'done' : ''}">Confira o preço (até o justo vende rápido)</li><li class="${s.open ? 'done' : ''}">Abra a loja</li><li>De dia, os clientes compram sozinhos — mesmo com você longe</li></ol>` : ''}
        <section class="sh-stats"><div><small>Visitantes hoje</small><b>${sum.today.visitors}</b></div><div><small>Vendas hoje</small><b>${sum.today.sales}</b></div><div><small>Receita hoje</small><b>${sum.today.revenue} po</b></div><div class="${sum.profit >= 0 ? 'pos' : 'neg'}"><small>Saldo do dia</small><b>${sum.profit >= 0 ? '+' : ''}${sum.profit} po</b><em>receita − aluguel${sum.wages ? ' − salários' : ''}</em></div><div><small>Reputação</small><b class="sh-stars">${'★'.repeat(starsN)}${'☆'.repeat(5 - starsN)}</b><em>${rep}/100</em></div></section>
        ${sum.yesterday ? `<p class="sh-yday">Ontem: ${sum.yesterday.visitors} visitantes, ${sum.yesterday.sales} vendas, +${sum.yesterday.revenue} po.</p>` : ''}
        ${missed || sum.today.expensive ? `<p class="sh-hint">${missed ? `Clientes procuraram <b>${esc(missed)}</b> e não acharam. ` : ''}${sum.today.expensive ? `${sum.today.expensive} visitante(s) acharam algo caro — baixe um pouco o preço.` : ''}</p>` : ''}
        <div class="sh-cols"><section class="sh-box"><h4>Prateleiras <small>${s.stocks.reduce((n, e) => n + e.quantity, 0)} itens</small></h4>${shelf || '<p class="sh-empty">Prateleiras vazias. Exponha produtos da sua mochila ao lado.</p>'}</section>
          <section class="sh-box"><h4>Abastecer com a mochila <small>sai da mochila e fica guardado na loja</small></h4>${rows || '<p class="sh-empty">Sua mochila não tem produtos para vender. Compre lotes baratos do fornecedor no empório (poções dão mais lucro), pesque, cozinhe ou colete.</p>'}</section></div>
        <section class="sh-box sh-log"><h4>Movimento da loja</h4>${events || '<p class="sh-empty">Assim que a loja abrir, cada visita aparece aqui.</p>'}</section>
        <div class="sh-actions"><button class="btn sm dark" data-go="wholesale"><span class="ico">📦</span>Comprar mercadoria no atacado</button><button class="btn sm dark" data-go="staff"><span class="ico">👥</span>Funcionários</button><button class="btn sm dark" data-go="custom"><span class="ico">🎨</span>Nome e toldo</button><button class="btn sm dark" data-go="where"><span class="ico">📍</span>Ir até a loja</button></div>
        <p class="sh-tip">Dica: até o preço justo vende rápido; até 20% acima vende bem; acima de 45% quase ninguém compra. Um atendente traz mais clientes. A loja só vende de dia.</p>
        ${note ? `<div class="sh-note">${esc(note)}</div>` : ''}</div>`;
      const act = (r) => { note = r && r.message || ''; if (r && r.ok) E.Audio.sfx('click'); draw(); };
      body.querySelector('[data-toggle]') && (body.querySelector('[data-toggle]').onclick = () => act(V.shop(h, region0).open ? V.closeShop(h, region0) : V.openShop(h, region0)));
      body.querySelectorAll('[data-dp]').forEach((b) => (b.onclick = () => { const e = V.shop(h, region0).stocks.find((x) => x.id === b.dataset.dp); if (!e) return; const step = Math.max(1, Math.round(V.fair(e) * .05)); const r = V.setPrice(h, region0, e.id, Math.max(1, e.price + step * Number(b.dataset.d))); note = r.ok ? '' : r.message; draw(); }));
      body.querySelectorAll('[data-take]').forEach((b) => (b.onclick = () => act(V.withdrawStock(h, region0, b.dataset.take))));
      body.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => act(V.addStock(h, region0, b.dataset.add, Number(b.dataset.n), Number(b.dataset.p)))));
      body.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => {
        const g = b.dataset.go; UI.close(el);
        if (g === 'wholesale') return E.WorldServices.guide(E.Settlements.isMetro && E.Settlements.isMetro(region0) ? 'market' : 'general', region0);
        if (g === 'where') return E.WorldServices.guide('player-shop', region0);
        if (E.StallLife) E.StallLife.counter(region0, g);
      }));
    };
    draw();
    const off = U.on('vendor:changed', (ev) => { if (ev && ev.heroId === h.id && el.isConnected) draw(); });
    E.WG.locked = true;
    UI.open(el, () => { off(); E.WG.locked = false; });
    return el;
  };
})();
