/* Comércio: posto comercial de cada região e a Bolsa de Mercadorias de Aurenna. */
(() => {
  const U = E.U, UI = E.UI;
  const TR = {};
  const L = () => E.L;

  const nextChange = () => { const p = 30 * 60e3; const left = p - (Date.now() % p); const m = Math.floor(left / 60e3), s = Math.floor(left / 1000) % 60; return `${m}:${String(s).padStart(2, '0')}`; };

  TR.open = (rid, opts = {}) => {
    const h = E.Store.hero(); if (!h) return;
    const d = E.Life.data(h);
    const reg = E.WD.REGIONS[rid];
    const bolsa = !!opts.bolsa;
    const el = UI.screen(bolsa ? '⚖ Bolsa de Mercadorias de Aurenna' : `⚖ Posto Comercial — ${reg.name}`, { right: '<span class="chip gold" data-gold></span><span class="chip" data-cargo></span>' });
    const body = el.querySelector('.screen-body');
    let tab = opts.tab || 'goods';
    const tabs = [['goods', 'Mercadorias'], ['sell', 'Vender peixes e minérios'], ['gazeta', 'Gazeta de preços'], ...(bolsa ? [['carts', 'Carroças'], ['stall', 'Sua Banca']] : [])];
    const draw = () => {
      el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po`;
      el.querySelector('[data-cargo]').textContent = `📦 ${E.Life.cargoCount(h)}/${E.Life.cap(h)}`;
      body.innerHTML = `<div class="sheet-tabs" style="padding:0 0 10px">${tabs.map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="tr-body"></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const box = body.querySelector('.tr-body');
      if (tab === 'goods') goods(box);
      else if (tab === 'sell') sellTab(box);
      else if (tab === 'gazeta') gazeta(box);
      else if (tab === 'carts') carts(box);
      else if (tab === 'stall') stall(box);
    };
    const goods = (box) => {
      box.innerHTML = `<p class="muted tr-tip">Compre barato onde a mercadoria é <b>produzida</b> e venda caro onde ela é <b>procurada</b>. Os preços mudam a cada 30 minutos (próxima mudança em <b data-nc>${nextChange()}</b>). Comércio Nv. ${E.Life.level(h, 'comercio')}.</p>`;
      const ids = Object.keys(L().GOODS).sort((a, b) => (L().GOODS[a].prod === rid ? -1 : 0) - (L().GOODS[b].prod === rid ? -1 : 0));
      for (const g of ids) {
        const G = L().GOODS[g], have = d.cargo[g] || 0;
        const buy = E.Life.buyPrice(h, g, rid), sell = E.Life.sellPrice(h, g, rid), tr = E.Life.trend(g, rid);
        const tag = G.prod === rid ? '<span class="tag-p">produz aqui · barato</span>' : G.want.includes(rid) ? '<span class="tag-w">procurado aqui · caro</span>' : '';
        const pl = have ? sell - (d.cost[g] || 0) : 0;
        const row = U.h(`<div class="shop-item tr-row"><div class="si">${G.icon}</div><div class="sx"><b>${G.name} ${tag}</b><small>Compra <b>${buy}</b> · Venda <b>${sell}</b> po <span class="trend ${tr > 0 ? 'up' : tr < 0 ? 'down' : ''}">${tr > 0 ? '▲' : tr < 0 ? '▼' : '•'}</span>${have ? ` · Você tem <b>${have}</b> (pagou ${d.cost[g]} cada) <span class="${pl >= 0 ? 'pl-up' : 'pl-down'}">${pl >= 0 ? '+' : ''}${pl}/un.</span>` : ''}</small></div>
          <div class="tr-btns"><button class="btn sm primary" data-b="1">+1</button><button class="btn sm primary" data-b="5">+5</button>${have ? `<button class="btn sm dark" data-s="1">−1</button><button class="btn sm dark" data-s="${have}">Vender tudo</button>` : ''}</div></div>`);
        row.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => { const err = E.Life.buy(h, g, Number(b.dataset.b), rid); if (err) UI.toast(err); else E.Audio.sfx('click'); draw(); }));
        row.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { const r = E.Life.sell(h, g, Number(b.dataset.s), rid); if (typeof r === 'string') UI.toast(r); else { E.Audio.sfx('chest'); UI.loot('🪙', `${r.gain} po${r.profit > 0 ? ` (lucro ${r.profit})` : r.profit < 0 ? ` (prejuízo ${-r.profit})` : ''}`); } draw(); }));
        box.appendChild(row);
      }
    };
    const sellTab = (box) => {
      const fish = Object.entries(d.fish), ores = Object.entries(d.ores).filter(([, n]) => n > 0);
      if (!fish.length && !ores.length) { box.innerHTML = '<p class="muted tr-tip">Você não tem peixes nem minérios para vender. Procure os pontos de pesca 🎣 e os veios de minério ⛏ pelo mapa.</p>'; return; }
      box.innerHTML = '';
      const total = fish.reduce((a, [id, n]) => a + E.Life.fishValue(id) * n, 0);
      if (fish.length) {
        const all = U.h(`<div class="shop-item"><div class="si">🧺</div><div class="sx"><b>Vender todos os peixes</b><small>${fish.reduce((a, [, n]) => a + n, 0)} peixes · ${total} po (guarde os de que precisa para cozinhar!)</small></div><button class="btn sm primary"><span class="ico">🪙</span>${total} po</button></div>`);
        all.querySelector('button').onclick = () => { let g = 0; for (const [id, n] of fish) g += E.Life.sellFish(h, id, n); UI.loot('🪙', `${g} po`); E.Audio.sfx('chest'); draw(); };
        box.appendChild(all);
      }
      for (const [id, n] of fish) {
        const f = L().FISH[id]; if (!f) continue;
        const row = U.h(`<div class="shop-item"><div class="si fishic"><img src="${E.Fishing.art(f, 2)}" alt=""></div><div class="sx"><b>${f.name} <span class="stars r${f.r}">${'★'.repeat(f.r)}</span></b><small>×${n} · ${f.price} po cada</small></div><div class="tr-btns"><button class="btn sm dark" data-n="1">−1</button><button class="btn sm primary" data-n="${n}">Vender ${n}</button></div></div>`);
        row.querySelectorAll('[data-n]').forEach((b) => (b.onclick = () => { const g = E.Life.sellFish(h, id, Number(b.dataset.n)); UI.loot('🪙', `${g} po`); draw(); }));
        box.appendChild(row);
      }
      for (const [id, n] of ores) {
        const o = L().ORES[id];
        const row = U.h(`<div class="shop-item"><div class="si">${o.icon}</div><div class="sx"><b>${o.name}</b><small>×${n} · ${o.price} po cada (usado na Forja e na Alquimia)</small></div><button class="btn sm dark">Vender 1</button></div>`);
        row.querySelector('button').onclick = () => { d.ores[id]--; h.gold += o.price; E.Store.save(); draw(); };
        box.appendChild(row);
      }
    };
    const gazeta = (box) => {
      const visited = E.state.world.visited;
      const regs = Object.keys(E.WD.REGIONS);
      box.innerHTML = `<p class="muted tr-tip">Preço de venda estimado em cada região. Regiões que você ainda não visitou aparecem como “?”. <span class="tag-p">verde</span> = mais barato · <span class="tag-w">dourado</span> = mais caro.</p><div class="gz-wrap"><table class="gazeta"><thead><tr><th></th>${regs.map((r) => `<th title="${U.esc(E.WD.REGIONS[r].name)}">${U.esc(E.WD.REGIONS[r].name.split(/[ ,]/)[0])}</th>`).join('')}</tr></thead><tbody>${Object.entries(L().GOODS).map(([g, G]) => {
        const vals = regs.map((r) => (visited[r] ? E.Life.sellPrice(h, g, r) : null));
        const known = vals.filter((v) => v !== null); const mx = Math.max(...known), mn = Math.min(...known);
        return `<tr><td>${G.icon} ${G.name}</td>${vals.map((v) => `<td class="${v === null ? 'unk' : v === mx && known.length > 1 ? 'hi' : v === mn && known.length > 1 ? 'lo' : ''}">${v === null ? '?' : v}</td>`).join('')}</tr>`;
      }).join('')}</tbody></table></div>`;
    };
    const carts = (box) => {
      box.innerHTML = '';
      L().CARTS.forEach((c, i) => {
        const owned = d.cart >= i;
        const row = U.h(`<div class="shop-item"><div class="si">${['🎒', '🛒', '🐴', '🐂', '🐫'][i]}</div><div class="sx"><b>${c.name}</b><small>Capacidade ${c.cap} unidades</small></div>${owned ? '<span class="chip">✔ Seu</span>' : `<button class="btn sm primary" ${i !== d.cart + 1 ? 'disabled' : ''}><span class="ico">🪙</span>${c.price} po</button>`}</div>`);
        const b = row.querySelector('button');
        if (b) b.onclick = () => { if (h.gold < c.price) return UI.toast('Ouro insuficiente.'); h.gold -= c.price; d.cart = i; E.Store.save(); E.Audio.sfx('levelup'); draw(); };
        box.appendChild(row);
      });
    };
    const stall = (box) => {
      const lv = E.Life.level(h, 'comercio');
      if (!d.stall) {
        box.innerHTML = `<div class="detail"><h4>🏪 Banca no Grande Mercado</h4><p>Com uma banca, suas mercadorias vendem sozinhas enquanto você aventura (1 unidade a cada 3 minutos, pagando 10% acima do preço de Aurenna, por até 8 horas).</p><p>Requer <b>Comércio nível 3</b> (você: ${lv}) e <b>${L().STALL_PRICE} po</b>.</p></div>`;
        const b = U.h(`<button class="btn primary" ${lv < 3 ? 'disabled' : ''}><span class="ico">🏪</span>Comprar banca (${L().STALL_PRICE} po)</button>`);
        b.onclick = () => { if (h.gold < L().STALL_PRICE) return UI.toast('Ouro insuficiente.'); h.gold -= L().STALL_PRICE; d.stall = { goods: {}, cost: {}, t: Date.now(), earned: 0 }; E.Store.save(); E.Audio.sfx('levelup'); draw(); };
        box.appendChild(b);
        return;
      }
      E.Life.stallTick(h);
      const st = d.stall, left = Object.values(st.goods).reduce((a, b) => a + b, 0);
      box.innerHTML = `<div class="detail"><h4>🏪 Sua banca</h4><p>Em exposição: <b>${left}</b> unidades · Vendido e não retirado: <b>${st.earned} po</b>. Uma unidade é vendida a cada 3 minutos.</p></div>`;
      const take = U.h(`<button class="btn primary" ${st.earned ? '' : 'disabled'}><span class="ico">🪙</span>Retirar ${st.earned} po</button>`);
      take.onclick = () => { h.gold += st.earned; UI.loot('🪙', `${st.earned} po da banca`); st.earned = 0; E.Store.save(); draw(); };
      box.appendChild(take);
      for (const [g, n] of Object.entries(d.cargo)) {
        const G = L().GOODS[g];
        const row = U.h(`<div class="shop-item"><div class="si">${G.icon}</div><div class="sx"><b>${G.name}</b><small>Na carga: ${n} · vende por ~${Math.round(E.Life.price(g, 'aurenna') * 1.1)} po na banca</small></div><button class="btn sm primary">Expor tudo</button></div>`);
        row.querySelector('button').onclick = () => { st.cost[g] = d.cost[g] || 0; st.goods[g] = (st.goods[g] || 0) + n; delete d.cargo[g]; delete d.cost[g]; if (left === 0) st.t = Date.now(); E.Store.save(); draw(); };
        box.appendChild(row);
      }
      for (const [g, n] of Object.entries(st.goods)) box.appendChild(U.h(`<div class="shop-item"><div class="si">${L().GOODS[g].icon}</div><div class="sx"><b>${L().GOODS[g].name}</b><small>Em exposição: ${n}</small></div></div>`));
    };
    draw();
    const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); if (tab === 'goods') { const t = el.querySelector("[data-nc]"); if (t) t.textContent = nextChange(); } }, 1000);
    UI.open(el, () => clearInterval(iv));
  };

  E.Trade = TR;
})();
