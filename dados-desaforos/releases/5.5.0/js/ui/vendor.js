/* Interface do ponto comercial: inventário, mostruário e negociação offline. */
(() => {
  'use strict';
  const V = E.Vendor, U = E.U, UI = E.UI;
  const icon = (key) => E.Icons.html(key || 'package', { decorative: true });
  const esc = U.esc;
  const categories = { food: 'Comida', fish: 'Peixes', inventory: 'Poções e itens', ore: 'Minérios', cargo: 'Mercadorias', material: 'Coleta', weapon: 'Armas' };
  const names = { comida: 'Comida', ingredientes: 'Ingredientes', peixes: 'Peixes', cura: 'Cura', alquimia: 'Alquimia', materiais: 'Materiais', mercadorias: 'Mercadorias', armas: 'Armas' };
  // A client keeps the same portrait throughout a conversation. Encoding its canvas
  // on every stock update is expensive on phones and adds no visual information.
  const portraits = new Map();
  const portrait = (c) => {
    if (!E.SP || !E.SP.npc || !E.SP.portrait) return '';
    const key = `${c.id}|${c.name}|${c.trait}|${c.portrait}`;
    if (portraits.has(key)) return portraits.get(key);
    const d = V.describeClient(c), colors = ['#8ea4c6', '#b89076', '#8baf94', '#a28bb9', '#c4a266'];
    const url = E.SP.portrait(E.SP.npc({ name: `${c.name} ${c.id}`, title: d.role, look: { skin: '#d6aa83', hair: '#463529', outfit: colors[c.portrait || 0] || colors[0] } }), 2);
    if (portraits.size >= 32) portraits.delete(portraits.keys().next().value);
    portraits.set(key, url); return url;
  };
  V.open = (region = E.state.world.region) => {
    if (E.StallLife && E.StallLife.visit) return E.StallLife.visit(region);
    const h = E.Store.hero(); if (!h) return;
    if (!V.access(h, region)) {
      UI.modal({ title: 'Seu ponto comercial', text: 'Para abrir um negócio, alugue ou compre um ponto na vila. O estoque já guardado permanece protegido mesmo com o aluguel atrasado.', buttons: [{ label: 'Depois', cls: 'dark', value: false }, { label: 'Ver imóveis e aluguéis', cls: 'primary', value: true }] }).then((go) => { if (go && E.Settlements) E.Settlements.open(region, 'loja'); });
      return;
    }
    const el = UI.screen('Seu ponto comercial', { cls: 'vendor-screen', paper: true });
    const body = el.querySelector('.screen-body'), property = V.property(h, region) || {}, shop = V.shop(h, region);
    const regionName = E.WD && E.WD.REGIONS[region] ? E.WD.REGIONS[region].name : region;
    let selectedClient = null, selectedStock = null, filter = 'all', lastSelectedStock = null, displayedClient = null;
    const propertyName = property.name || `Banca de ${h.name}`;
    body.innerHTML = `<div class="vm-root" data-skin="${esc(property.skin || 'linen')}">
      <section class="vm-canopy"><div><span class="vm-kicker">MERCADO DE ${esc(regionName)}</span><h3>${esc(propertyName)}</h3><p>Uma boa conversa começa por entender quem está do outro lado do balcão.</p></div><div class="vm-shop-actions"><button class="btn sm primary" data-a="toggle"></button><button class="btn sm dark" data-a="custom">${icon('settings')} Personalizar ponto</button></div></section>
      <div class="vm-stats"><span data-stat="status"></span><span>${icon('coin')} <b data-stat="gold"></b> po</span><span>${icon('scales')} <b data-stat="sales"></b> vendas</span><span>${icon('star')} Reputação <b data-stat="reputation"></b>/100</span><span class="vm-time" data-stat="time"></span></div>
      <div class="vm-layout"><section class="vm-panel vm-stock"><header><div><small>SEU MOSTRUÁRIO</small><h4>Produtos à venda</h4></div><span data-stat="stock-count"></span></header><div class="vm-stock-list" aria-live="polite"></div><details class="vm-restock" open><summary>Abastecer com itens do inventário</summary><p>O produto sai da mochila e fica guardado no ponto. Retirar devolve o item. Armas equipadas ou travadas não aparecem aqui.</p><label>Categoria<select data-field="filter"><option value="all">Todas</option>${Object.entries(categories).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>Produto<select data-field="inventory"></select></label><div class="vm-form-row"><label>Quantidade<input data-field="quantity" type="number" min="1" max="9999" value="1" inputmode="numeric"></label><label>Preço por unidade (po)<input data-field="stock-price" type="number" min="1" max="999999" value="1" inputmode="numeric"></label></div><small class="vm-reference" data-stat="reference"></small><button class="btn primary block" data-a="stock">${icon('package')} Colocar à venda</button></details></section>
      <section class="vm-panel vm-trade"><header><div><small>ATENDIMENTO</small><h4>Conheça seus clientes</h4></div><span class="vm-offline">${icon('brain')} IA de jogo offline</span></header><div class="vm-client-list"></div><div class="vm-empty-client"></div><div class="vm-conversation" hidden><div class="vm-customer"></div><div class="vm-chat" role="log" aria-live="polite"></div><form class="vm-offer-form"><label>Produto para apresentar<select data-field="offer-item"></select></label><label>Seu argumento<textarea data-field="pitch" maxlength="600" rows="3" placeholder="Explique uma utilidade real para o pedido deste cliente. Seja honesto sobre o produto."></textarea></label><div class="vm-form-row"><label>Oferta por unidade (po)<input data-field="offer-price" type="number" min="1" max="999999" inputmode="numeric" value="1"></label><div class="vm-form-buttons"><button class="btn primary" type="submit">${icon('chat')} Fazer oferta</button><button class="btn sm dark" data-a="dismiss" type="button">Dispensar</button></div></div><button class="vm-counter btn sm" data-a="counter" type="button" hidden></button><p class="vm-feedback" role="status"></p></form></div><details class="vm-ledger"><summary>Últimas vendas</summary><div class="vm-history"></div></details></section></div>
      <p class="vm-footnote">Clientes possuem preferências, paciência e um orçamento próprio. À noite o movimento diminui. Abrir a loja atrai visitantes; as vendas só acontecem quando você negocia.</p><div class="vm-notice" role="status"></div></div>`;
    const root = body.querySelector('.vm-root');
    const $ = (selector) => root.querySelector(selector);
    const stat = (key, value) => { const node = $(`[data-stat="${key}"]`); if (node && node.textContent !== String(value)) node.textContent = value; };
    const notify = (r) => { $('.vm-notice').textContent = r.message; $('.vm-notice').classList.toggle('bad', !r.ok); };
    const renderInventory = () => {
      const select = $('[data-field=inventory]'), previous = select.value;
      const items = V.inventory(h).filter((x) => filter === 'all' || x.kind === filter);
      select.innerHTML = items.map((item) => `<option value="${esc(item.key)}">${esc(item.name)} ×${item.quantity}</option>`).join('') || '<option value="">Nenhum item disponível</option>';
      if (items.some((x) => x.key === previous)) select.value = previous;
      $('[data-a=stock]').disabled = !items.length;
      const update = () => {
        const item = V.inventory(h).find((x) => x.key === select.value);
        $('[data-field=quantity]').max = item ? item.quantity : 1;
        $('[data-field=quantity]').value = '1';
        $('[data-field=stock-price]').value = item ? item.baseValue : 1;
        stat('reference', item ? `Valor de referência: ${item.baseValue} po. A aceitação depende do cliente e da sua oferta.` : 'Explore, pesque, cozinhe ou reúna mercadorias para abastecer.');
      };
      select.onchange = update; update();
    };
    const renderStocks = () => {
      const s = V.shop(h, region), list = $('.vm-stock-list');
      list.innerHTML = s.stocks.map((entry) => `<article class="vm-product"><div class="vm-product-icon">${entry.kind === 'weapon' && E.WA ? E.WA.svg(entry.item.weaponDef, { still: true }) : icon(entry.item.iconKey)}</div><div class="vm-product-copy"><b>${esc(entry.item.name)}</b><small>${esc(names[entry.item.category] || entry.item.category)} · ${entry.quantity} unidade(s)</small><span>${entry.price} po <small>/ unidade</small></span></div><div class="vm-product-actions"><button class="btn sm" data-present="${esc(entry.id)}">Apresentar</button><button class="vm-text-btn" data-withdraw="${esc(entry.id)}">Retirar</button><button class="vm-text-btn" data-price="${esc(entry.id)}">Preço</button></div></article>`).join('') || '<div class="vm-empty">Seu mostruário está vazio. Coloque produtos reais do inventário para começar.</div>';
      list.querySelectorAll('[data-withdraw]').forEach((b) => b.onclick = () => { notify(V.withdrawStock(h, region, b.dataset.withdraw)); renderInventory(); renderStocks(); renderClients(); });
      list.querySelectorAll('[data-present]').forEach((b) => b.onclick = () => { selectedStock = b.dataset.present; lastSelectedStock = null; renderOfferItems(); if (!$('.vm-conversation').hidden) $('[data-field=pitch]').focus(); else notify({ ok: true, message: 'Produto selecionado. Abra o ponto e aguarde um cliente.' }); });
      list.querySelectorAll('[data-price]').forEach((b) => b.onclick = async () => {
        const entry = V.shop(h, region).stocks.find((x) => x.id === b.dataset.price); if (!entry) return;
        const html = `<label class="vm-price-modal">Preço por unidade (po)<input class="field" type="number" data-vendor-price min="1" max="999999" value="${entry.price}" inputmode="numeric"></label>`;
        const modal = UI.modal({ title: `Preço · ${esc(entry.item.name)}`, html, buttons: [{ label: 'Cancelar', value: false, cls: 'dark' }, { label: 'Salvar', value: true, cls: 'primary' }] });
        const input = document.querySelector('[data-vendor-price]'); let value = entry.price; input.oninput = () => { value = Number(input.value); };
        if (await modal) notify(V.setPrice(h, region, entry.id, value));
        renderStocks(); renderOfferItems();
      });
      stat('stock-count', `${s.stocks.reduce((n, x) => n + x.quantity, 0)} item(ns)`);
      renderOfferItems();
    };
    const renderOfferItems = () => {
      const s = V.shop(h, region), select = $('[data-field=offer-item]'), old = select.value;
      if (!selectedStock || !s.stocks.some((x) => x.id === selectedStock)) selectedStock = s.stocks[0] && s.stocks[0].id;
      const markup = s.stocks.map((e) => `<option value="${esc(e.id)}">${esc(e.item.name)} · ${e.price} po</option>`).join('') || '<option value="">Sem produtos</option>';
      if (select.dataset.markup !== markup) { select.innerHTML = markup; select.dataset.markup = markup; }
      select.value = selectedStock || old || '';
      const e = s.stocks.find((x) => x.id === selectedStock);
      if (e && lastSelectedStock !== e.id) { $('[data-field=offer-price]').value = e.price; lastSelectedStock = e.id; }
      $('.vm-offer-form button[type=submit]').disabled = !e;
    };
    const renderClients = () => {
      const s = V.shop(h, region);
      if (!s.clients.some((c) => c.id === selectedClient)) selectedClient = s.clients[0] && s.clients[0].id;
      const queue = $('.vm-client-list');
      queue.innerHTML = s.clients.map((c) => `<button class="vm-client-chip ${c.id === selectedClient ? 'selected' : ''}" data-client="${esc(c.id)}">${icon('account')} ${esc(c.name)}<small>${esc(V.describeClient(c).personality)}</small></button>`).join('');
      queue.querySelectorAll('[data-client]').forEach((b) => b.onclick = () => { selectedClient = b.dataset.client; renderClients(); });
      const c = s.clients.find((x) => x.id === selectedClient), empty = $('.vm-empty-client');
      empty.hidden = !!c; $('.vm-conversation').hidden = !c;
      if (!c) { empty.innerHTML = `<div class="vm-waiting-icon">${icon(s.open ? 'hourglass' : 'shop')}</div><h4>${s.open ? 'Aguardando o próximo visitante' : 'O ponto está fechado'}</h4><p>${s.open ? `O movimento é ${E.Sim && E.Sim.clock().night ? 'mais tranquilo à noite' : 'maior durante o dia'}. Aproveite para organizar o mostruário.` : 'Abasteça o mostruário e abra as portas para receber clientes.'}</p>`; return; }
      const description = V.describeClient(c);
      if (displayedClient !== c.id) { $('[data-field=pitch]').value = ''; $('.vm-feedback').textContent = ''; displayedClient = c.id; }
      const image = portrait(c);
      $('.vm-customer').innerHTML = `<div class="vm-portrait">${image ? `<img src="${image}" alt="Retrato de ${esc(c.name)}">` : icon('account')}</div><div><span class="vm-customer-role">${esc(description.role)} · ${esc(description.personality)}</span><h4>${esc(c.name)}</h4><p>${esc(description.clue)}</p><small>Procura ${esc(description.request)} · ${description.turnsLeft} tentativa(s) restantes</small></div>`;
      const chat = $('.vm-chat'); chat.innerHTML = c.messages.map((m) => `<div class="vm-bubble ${m.who === 'player' ? 'player' : 'client'}"><small>${m.who === 'player' ? 'Você' : esc(c.name)}</small><p>${esc(m.text)}</p></div>`).join(''); chat.scrollTop = chat.scrollHeight;
      const counter = $('[data-a=counter]'); counter.hidden = !(c.counter && s.stocks.some((x) => x.id === c.counter.stockId));
      if (!counter.hidden) counter.textContent = `Aceitar a contraproposta de ${c.counter.price} po`;
      renderOfferItems();
    };
    const renderHeader = () => {
      const s = V.shop(h, region), c = E.Sim && E.Sim.clock();
      stat('gold', h.gold); stat('sales', s.sales); stat('reputation', s.reputation);
      stat('status', s.open ? 'Portas abertas' : 'Ponto fechado'); stat('time', c ? `${c.text} · ${c.night ? 'Movimento noturno' : 'Movimento diurno'}` : '');
      const b = $('[data-a=toggle]'); b.innerHTML = `${icon(s.open ? 'lock' : 'unlock')} ${s.open ? 'Fechar portas' : 'Abrir portas'}`;
      root.classList.toggle('vm-open', s.open);
      $('.vm-history').innerHTML = s.history.map((v) => `<p><span>Dia ${v.day} · ${esc(v.client)} · ${esc(v.item)}</span><b>+${v.gold} po</b></p>`).join('') || '<p class="vm-muted">As vendas concluídas aparecerão aqui.</p>';
    };
    $('[data-a=stock]').onclick = () => { notify(V.addStock(h, region, $('[data-field=inventory]').value, Number($('[data-field=quantity]').value), Number($('[data-field=stock-price]').value))); renderInventory(); renderStocks(); renderHeader(); };
    $('[data-field=filter]').onchange = (event) => { filter = event.target.value; renderInventory(); };
    $('[data-field=offer-item]').onchange = (event) => { selectedStock = event.target.value; lastSelectedStock = null; renderOfferItems(); };
    $('[data-a=toggle]').onclick = () => { const s = V.shop(h, region); notify(s.open ? V.closeShop(h, region) : V.openShop(h, region)); renderHeader(); renderClients(); };
    $('[data-a=custom]').onclick = () => E.Settlements.open(region, 'loja');
    const offer = (value, pitch) => {
      const r = V.negotiate(h, region, selectedStock, pitch === undefined ? $('[data-field=pitch]').value : pitch, value, selectedClient);
      $('.vm-feedback').textContent = r.message + (r.reasons && r.reasons.length ? ' ' + r.reasons.join(' ') : '');
      $('.vm-feedback').classList.toggle('bad', !r.ok || r.outcome === 'left');
      if (r.outcome === 'sold' || r.outcome === 'left') { notify(r); selectedClient = null; }
      renderStocks(); renderClients(); renderHeader();
    };
    $('.vm-offer-form').onsubmit = (event) => { event.preventDefault(); offer(Number($('[data-field=offer-price]').value)); };
    $('[data-a=counter]').onclick = () => { const c = V.shop(h, region).clients.find((x) => x.id === selectedClient); if (c && c.counter) { selectedStock = c.counter.stockId; offer(c.counter.price, 'Aceito sua contraproposta. O produto tem as características apresentadas. Obrigado pela visita.'); } };
    $('[data-a=dismiss]').onclick = () => { notify(V.dismiss(h, region, selectedClient)); selectedClient = null; renderClients(); };
    const off = U.on('vendor:changed', (event) => { if (event.heroId !== h.id || event.region !== region || !el.isConnected) return; renderHeader(); renderClients(); });
    let lastClock = '';
    const offClock = U.on('survival:changed', () => { const c = E.Sim.clock(); if (c.text !== lastClock) { lastClock = c.text; stat('time', `${c.text} · ${c.night ? 'Movimento noturno' : 'Movimento diurno'}`); } });
    renderHeader(); renderInventory(); renderStocks(); renderClients();
    UI.open(el, () => { off(); offClock(); });
    return el;
  };
})();
