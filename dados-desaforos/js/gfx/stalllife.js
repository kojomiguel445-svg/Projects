/* A banca existe no mundo: mercadoria no balcão, clientes chegam a pé e cada
   venda continua usando a custódia atômica do motor offline E.Vendor. */
(() => {
  'use strict';
  const S = {}, U = E.U;
  const hero = () => E.Store.hero();
  const icon = key => E.Icons ? E.Icons.html(key, { decorative: true }) : '';
  const esc = U.esc;
  const state = w => w && w.stallLife;
  const localPoint = (v, x, z) => {
    const a = v.rotation || 0, c = Math.cos(a), s = Math.sin(a);
    return { x: v.x + x * c + z * s, z: v.z - x * s + z * c };
  };
  const floor = (w, x, z) => w.groundAt ? w.groundAt(x, z) : w.terrainAt ? w.terrainAt(x, z) : w.height(x, z);
  const fingerprint = shop => shop.stocks.map(e => [e.id, e.quantity, e.price].join(':')).join('|');
  const notify = r => { if (r && r.message) E.UI.toast(r.message, r.ok ? 'gold' : ''); if (E.HUD) E.HUD.update(); return r; };
  const open = options => E.WorldServices && E.WorldServices.open ? E.WorldServices.open(options) : null;
  const close = () => { if (E.WorldServices) E.WorldServices.close(); };
  const shopVenue = (w, region) => (w && w.venues || []).find(v => v.service === 'player-shop' && (!region || v.region === region));
  const actualWorld = () => E.WG && E.WG.world;
  function nearby(region, quiet = false) {
    const w = actualWorld(), v = shopVenue(w, region);
    const a=v&&(v.rotation||0),dx=v&&w.hero?w.hero.x-v.x:Infinity,dz=v&&w.hero?w.hero.z-v.z:Infinity,lx=v?dx*Math.cos(a)-dz*Math.sin(a):Infinity,lz=v?dx*Math.sin(a)+dz*Math.cos(a):Infinity;
    if (!w || !v || !w.hero || Math.abs(lx)>(v.w||8)/2+.8 || Math.abs(lz)>(v.d||7)/2+1.8) {
      if (!quiet) {
        if (v && w.hero) {
          const dx = v.x - w.hero.x, dz = v.z - w.hero.z;
          const dir = Math.abs(dx) > Math.abs(dz) ? dx > 0 ? 'leste' : 'oeste' : dz > 0 ? 'sul' : 'norte';
          E.UI.toast(`Sua banca fica ${Math.round(Math.hypot(dx, dz))} m a ${dir}. Vá até o balcão para atender.`);
          if (E.WorldServices && E.WorldServices.guide) E.WorldServices.guide('player-shop',region);
        } else E.UI.toast('Visite seu ponto comercial na vila para organizar o balcão.');
      }
      return null;
    }
    return { w, v, anchor: { x: v.x, z: v.z, r: Math.max(v.w || 8, v.d || 7), region: v.region, venueId: v.id } };
  }
  function contract(region) {
    const h = hero(), p = E.Settlements.property(h, region, 'shop'), price = E.Settlements.prices?E.Settlements.prices(region,'shop'):E.Settlements.PRICES.shop;
    const context = nearby(region); if (!context) return;
    return open({ title: 'Chave do ponto comercial', anchor: context.anchor, text: p ? `O contrato deste balcão está pendente. Seus produtos permanecem guardados. ${p.arrears || 0} po em atraso.` : `Este espaço está disponível: ${price.rent} po por dia ou ${price.buy} po para comprar. O balcão, os caixotes e o mostruário são usados aqui no cenário.`, actions: p ? [
      { label: 'Pagar aluguel', run: () => { notify(E.Settlements.payRent(h, region, 'shop')); S.counter(region); } },
    ] : [
      { label: `Alugar · ${price.rent} po/dia`, disabled: h.gold < price.rent, run: () => { notify(E.Settlements.acquire(h, region, 'shop', 'rent')); S.counter(region); } },
      { label: `Comprar · ${price.buy} po`, disabled: h.gold < price.buy, run: () => { notify(E.Settlements.acquire(h, region, 'shop', 'buy')); S.counter(region); } },
    ] });
  }
  S.visit = (region = E.Settlements.region()) => {
    if (!nearby(region)) return;
    return S.counter(region);
  };
  S.counter = (region = E.Settlements.region(), action = 'register') => {
    const context = nearby(region); if (!context) return;
    if (!E.Vendor.access(hero(), region)) return contract(region);
    // Balcão, caixotes e mostruário abrem o mesmo painel simples da loja.
    if (['register', 'stock', 'display'].includes(action)) { close(); return E.Vendor.open(region); }
    if (action === 'custom') return customize(region);
    if (action === 'staff') return employees(region);
    const h = hero(), shop = E.Vendor.shop(h, region), p = E.Vendor.property(h, region);
    const first = shop.clients.find(c => c.state === 'waiting');
    return open({ title: p.name || 'Seu balcão', anchor: context.anchor, text: `${shop.open ? 'Banca aberta' : 'Placa virada: fechado'} · ${shop.stocks.reduce((n,e) => n + e.quantity, 0)} produtos expostos · ${shop.sales} vendas. ${first ? `${first.name} está chegando ou aguardando atendimento.` : 'Os clientes vêm a pé até o mostruário.'} Use os caixotes para abastecer e fale com cada visitante para negociar.`, actions: [
      { label: shop.open ? 'Virar placa: fechar' : 'Virar placa: abrir', run: () => { notify(shop.open ? E.Vendor.closeShop(h, region) : E.Vendor.openShop(h, region)); S.counter(region); } },
      { label: 'Nome e toldo', run: () => customize(region) },
      { label: 'Conferir caixa', run: () => ledger(region) },
      { label: 'Contratar e organizar funcionários', run: () => employees(region) },
      { label: 'Onde comprar produtos no atacado?', run: () => E.WorldServices.guide(context.w.reg.metro?'market':'general',region) },
    ] });
  };
  function stock(region, index = 0) {
    const context = nearby(region); if (!context) return;
    const h = hero(), list = E.Vendor.inventory(h);
    if (!list.length) return open({ title: 'Caixotes de abastecimento', anchor: context.anchor, text: 'Sua mochila não contém mercadorias disponíveis. O fornecedor vende caixas com vários produtos: visite a Bolsa de Mercadorias em Aurenna ou o armazém das vilas. Você também pode vender o que pescar, cozinhar e recolher. Armas equipadas ou travadas ficam protegidas.',actions:[{label:'Encontrar o fornecedor',run:()=>E.WorldServices.guide(context.w.reg.metro?'market':'general',region)}] });
    index = (index + list.length) % list.length; const item = list[index];
    return open({ title: 'Abastecer o balcão', anchor: context.anchor, text: `${item.name} · ${item.quantity} na mochila. A mercadoria sai da mochila e fica sob custódia da banca até ser vendida ou retirada.`, html: `<div class="stall-item-preview">${icon(item.iconKey)}<span>${index + 1} / ${list.length}</span></div><div class="stall-fields"><label>Quantidade<input data-stall-quantity type="number" inputmode="numeric" min="1" max="${item.quantity}" value="1"></label><label>Preço por unidade<input data-stall-price type="number" inputmode="numeric" min="1" max="999999" value="${E.Settlements.price?E.Settlements.price(region,item.baseValue):item.baseValue}"></label></div>`, actions: [
      { label: 'Anterior', disabled: list.length < 2, run: () => stock(region, index - 1) },
      { label: 'Expor produto', run: el => { const q = Number(el.querySelector('[data-stall-quantity]').value), p = Number(el.querySelector('[data-stall-price]').value); const r = notify(E.Vendor.addStock(h, region, item.key, q, p)); if (r.ok) stock(region, index); } },
      { label: 'Próximo', disabled: list.length < 2, run: () => stock(region, index + 1) },
    ] });
  }
  function display(region, index = 0) {
    const context = nearby(region); if (!context) return;
    const h = hero(), stocks = E.Vendor.shop(h, region).stocks;
    if (!stocks.length) return open({ title: 'Mostruário vazio', anchor: context.anchor, text: 'O balcão está pronto. Leve mercadorias aos caixotes de abastecimento ao lado da banca.' });
    index = (index + stocks.length) % stocks.length; const e = stocks[index];
    return open({ title: e.item.name, anchor: context.anchor, text: `${e.quantity} unidade(s) no mostruário · ${index + 1} / ${stocks.length}. Retirar devolve as unidades ao inventário, sem vendê-las.`, html: `<div class="stall-item-preview">${icon(e.item.iconKey)}</div><label>Preço da etiqueta<input class="field" data-stall-price type="number" inputmode="numeric" min="1" max="999999" value="${e.price}"></label>`, actions: [
      { label: 'Guardar na mochila', run: () => { notify(E.Vendor.withdrawStock(h, region, e.id)); display(region, index); } },
      { label: 'Mudar etiqueta', run: el => { notify(E.Vendor.setPrice(h, region, e.id, Number(el.querySelector('[data-stall-price]').value))); display(region, index); } },
      { label: 'Próximo produto', disabled: stocks.length < 2, run: () => display(region, index + 1) },
    ] });
  }
  function customize(region, index) {
    const context = nearby(region); if (!context) return;
    const h = hero(), p = E.Vendor.property(h, region), skins = Object.entries(E.Settlements.SKINS);
    if (index === undefined) index = Math.max(0, skins.findIndex(([id]) => id === p.skin));
    index = (index + skins.length) % skins.length; const [id, sourceSkin] = skins[index], skin = {...sourceSkin,price:E.Settlements.price?E.Settlements.price(region,sourceSkin.price):sourceSkin.price}, owned = (p.skinUnlocks || []).includes(id);
    return open({ title: 'Placa e tecido da banca', anchor: context.anchor, text: `${skin.name} · ${owned ? 'Tecido já adquirido' : `${skin.price} po, compra única`}. A mudança é aplicada à banca aqui no mundo.`, html: `<label>Nome pintado na placa<input class="field" data-stall-name maxlength="24" value="${esc(p.name || '')}"></label><div class="stall-cloth" style="--stall-cloth:${skin.color}"></div>`, actions: [
      { label: 'Outro tecido', run: () => customize(region, index + 1) },
      { label: 'Pintar placa', run: el => { notify(E.Settlements.renameShop(h, region, el.querySelector('[data-stall-name]').value)); customize(region, index); } },
      { label: p.skin === id ? 'Tecido em uso' : `Aplicar${owned ? '' : ` · ${skin.price} po`}`, disabled: p.skin === id || (!owned && h.gold < skin.price), run: () => { notify(E.Settlements.decorate(h, region, 'skin', id)); customize(region, index); } },
    ] });
  }
  function employees(region, index = 0, hiring = false) {
    const context=nearby(region);if(!context)return;
    const B=E.Business,h=hero();if(!B)return open({title:'Equipe do ponto',anchor:context.anchor,text:'O livro de funcionários está sendo preparado.'});
    const staff=B.staff(h,region),candidates=B.candidates(h,region),rows=hiring?candidates:staff,employee=rows.length?rows[((index%rows.length)+rows.length)%rows.length]:null;
    if(!hiring&&!employee)return open({title:'Uma equipe para sua loja',anchor:context.anchor,text:'Funcionários são opcionais. Um atendente chama mais clientes para a loja; um repositor reabastece as prateleiras com os produtos iguais da sua mochila. A diária é cobrada sozinha a cada dia do jogo.',actions:[{label:'Conhecer candidatos',run:()=>employees(region,0,true)}]});
    if(!employee)return open({title:'Candidatos do dia',anchor:context.anchor,text:'Não há mais candidatos disponíveis hoje. Confira a equipe contratada ou volte no próximo dia do jogo.',actions:[{label:'Minha equipe',run:()=>employees(region)}]});
    const wage=employee.wage||0,role=employee.role==='stockkeeper'?'Repositor':'Atendente',arrears=Number(employee.arrears)||0,active=employee.active!==false&&!arrears;
    if(hiring)return open({title:employee.name,anchor:context.anchor,icon:'party',text:`${employee.desc||employee.description||'Procura um posto no comércio local.'} Diária de ${wage} po${employee.fee?` e contratação de ${employee.fee} po`:''}. Atendentes trazem mais clientes; repositores reabastecem as prateleiras com produtos da sua mochila.`,actions:[{label:`Contratar · ${wage+(employee.fee||0)} po hoje`,disabled:h.gold<wage+(employee.fee||0),run:()=>{notify(B.hire(h,region,employee.id));employees(region);}},{label:'Próximo candidato',disabled:candidates.length<2,run:()=>employees(region,index+1,true)},{label:'Voltar à equipe',run:()=>employees(region)}]});
    return open({title:employee.name+' · '+role,anchor:context.anchor,icon:'party',text:`Diária: ${wage} po. ${active?'Pagamento em dia; funcionário disponível no ponto.':'Trabalho suspenso até regularizar os salários.'}${arrears?` Há ${arrears} po pendentes.`:''} ${employee.role==='stockkeeper'?'Repõe apenas produtos já etiquetados usando seu estoque da mochila.':'Chama clientes para a loja: cerca de 60% mais visitantes durante o dia.'}`,actions:[{label:employee.role==='stockkeeper'?'Designar para atendimento':'Designar para reposição',run:()=>{notify(B.assign(h,region,employee.id,employee.role==='stockkeeper'?'seller':'stockkeeper'));employees(region,index);}},{label:'Regularizar salários da equipe',disabled:!staff.some(e=>e.arrears>0||e.active===false),run:()=>{notify(B.payWages(h,region));employees(region,index);}},{label:'Próximo funcionário',disabled:staff.length<2,run:()=>employees(region,index+1)},{label:'Contratar mais uma pessoa',run:()=>employees(region,0,true)},{label:'Encerrar contrato deste funcionário',primary:false,run:()=>open({title:'Encerrar contrato',anchor:context.anchor,text:`Dispensar ${employee.name}? A diária já paga não é devolvida e os produtos permanecem na sua loja.`,actions:[{label:'Confirmar dispensa',run:()=>{notify(B.dismiss(h,region,employee.id));employees(region);}},{label:'Continuar com a equipe',run:()=>employees(region,index)}]})}]});
  }
  function ledger(region) {
    const context = nearby(region); if (!context) return;
    const s = E.Vendor.shop(hero(), region), last = s.history.slice(0, 3);
    return open({ title: 'Livro-caixa', anchor: context.anchor, text: `${s.sales} vendas · ${s.revenue} po recebidos · reputação ${s.reputation}/100.`, html: last.length ? `<div class="stall-receipts">${last.map(r => `<p>${esc(r.client)} · ${esc(r.item)}<strong>+${r.gold} po</strong></p>`).join('')}</div>` : '<p>A primeira venda ainda será anotada.</p>' });
  }
  S.use = it => { const w = actualWorld(), st = state(w), node = st && st.clients.get(it.clientId); E.UI.toast(node && node.event ? node.event.text : 'Os clientes compram sozinhos no balcão.'); };
  function conversation(w, node, client, index, previousDraft = '', previousPrice) {
    const h = hero(), region = w.id, shop = E.Vendor.shop(h, region), stocks = shop.stocks, desc = E.Vendor.describeClient(client);
    if (!stocks.length) return open({ title: client.name, anchor: node.ia, text: 'Não há produtos expostos neste momento. Leve mais mercadorias aos caixotes.', actions: [{ label: 'Agradecer a visita', run: () => { notify(E.Vendor.dismiss(h, region, client.id)); close(); } }] });
    index = (index + stocks.length) % stocks.length; const e = stocks[index];
    const line = client.messages.filter(m => m.who === 'client').slice(-1)[0];
    return open({ title: `${client.name} · ${desc.role}`, anchor: node.ia, text: `${line ? line.text : ''} ${desc.clue} (${desc.turnsLeft} tentativa(s).)`, html: `<div class="stall-offer-product">${icon(e.item.iconKey)}<span><b>${esc(e.item.name)}</b><small>${e.quantity} em exposição · ${index + 1}/${stocks.length}</small></span></div><label>Sua explicação<textarea data-stall-pitch maxlength="600" rows="2" placeholder="Explique como o produto atende ao pedido.">${esc(previousDraft)}</textarea></label><label>Preço da oferta (po)<input class="field" data-stall-offer type="number" inputmode="numeric" min="1" max="999999" value="${previousPrice || e.price}"></label>`, actions: [
      { label: 'Outro produto', disabled: stocks.length < 2, run: el => conversation(w, node, client, index + 1, el.querySelector('[data-stall-pitch]').value) },
      { label: 'Fazer oferta', run: el => offer(w, node, client, e, el.querySelector('[data-stall-pitch]').value, Number(el.querySelector('[data-stall-offer]').value), index) },
      ...(client.counter ? [{ label: `Aceitar · ${client.counter.price} po`, run: () => { const entry = shop.stocks.find(s => s.id === client.counter.stockId); if (entry) offer(w, node, client, entry, 'Aceito sua contraproposta. O produto tem as características apresentadas. Obrigado pela visita.', client.counter.price, stocks.indexOf(entry)); } }] : [{ label: 'Até logo', run: () => { notify(E.Vendor.dismiss(h, region, client.id)); close(); } }]),
    ] });
  }
  function offer(w, node, client, entry, pitch, price, index) {
    const r = E.Vendor.negotiate(hero(), w.id, entry.id, pitch, price, client.id);
    if (!r.ok) return notify(r);
    if (r.outcome === 'sold' || r.outcome === 'left') {
      notify(r);
      return open({ title: client.name, anchor: node.ia, text: r.message, actions: [{ label: r.outcome === 'sold' ? 'Obrigado pela visita' : 'Até a próxima', run: close }] });
    }
    return conversation(w, node, client, index, '', r.counterOffer || price);
  }
  function appearance(i) {
    const outfits = ['#7a9eac','#bb9171','#7e9b76','#a58aaa','#baaa76','#6f91b0','#b77780','#7faaa1'];
    const skins = ['#e2b894','#bc8a68','#9f6c52','#e7c4a7'];
    const npc = { name: `Visitante da banca ${i}`, look: { skin: skins[i % skins.length], hair: ['#4d382b','#93714f','#2d2b31','#bea17d'][i % 4], outfit: outfits[i % 8] } };
    return { idle: [E.SP.npc(npc, 'idle0'), E.SP.npc(npc, 'idle1')], walk: ['walk0','walk1','walk2','walk3'].map(f => E.SP.npc(npc, f)) };
  }
  function texture(st, cv) {
    if (!st.textures.has(cv)) {
      const t = new THREE.CanvasTexture(cv);t.colorSpace = THREE.SRGBColorSpace;t.magFilter = THREE.NearestFilter;t.minFilter = THREE.NearestFilter;t.generateMipmaps = false;
      st.textures.set(cv, t);
    }
    return st.textures.get(cv);
  }
  function pathStart(w, v) {
    const door = localPoint(v, 0, (v.d || 7) / 2 + 1.7), points = (w.crowdRoutes || []).flat();
    const ca=Math.cos(v.rotation||0),sa=Math.sin(v.rotation||0);
    const clear = points.filter(p => {
      const localZ=(p.x-v.x)*sa+(p.z-v.z)*ca;
      return localZ>(v.d||7)/2+1 && Math.hypot(p.x-door.x,p.z-door.z)>5 && Math.hypot(p.x-door.x,p.z-door.z)<18;
    });
    let p = clear.reduce((a, b) => !a || Math.hypot(b.x - door.x, b.z - door.z) < Math.hypot(a.x - door.x, a.z - door.z) ? b : a, null);
    if (!p) p = localPoint(v, 0, (v.d || 7) / 2 + 8);
    return [{ x: p.x, z: p.z }, door];
  }
  function addClient(w, st, c) {
    c.arrivedAtCounter=false;
    const style = Math.abs((c.portrait || 0) + c.id.length) % st.styles.length, frames = st.styles[style], cv = frames.idle[0];
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture(st, cv), transparent: true, alphaTest: .4 }));
    sprite.center.set(.5,.025);sprite.scale.set(2.05 * cv.width / cv.height,2.05,1);
    const route = pathStart(w, st.venue), node = { id: c.id, client: c, frames, sprite, x: route[0].x, z: route[0].z, route, next: 1, phase: 'arriving', speed: 1.5 + style * .035, t: 0, frameAt: 0, width: 2.05 * cv.width / cv.height };
    sprite.position.set(node.x, floor(w,node.x,node.z), node.z); st.group.add(sprite);
    node.ia = { kind: 'customer', clientId: c.id, region: w.id, x: node.x, z: node.z, r: 1.9, label: `Conversar com ${c.name}`, icon: icon('chat'),sprite };
    st.clients.set(c.id,node);return node;
  }
  function removeClient(w, st, node) {
    st.group.remove(node.sprite);node.sprite.material.dispose();
    st.clients.delete(node.id);w.interactables = w.interactables.filter(i => i !== node.ia);w.nearKey = null;
  }
  function leave(w, st, node) {
    if (node.phase === 'leaving') return;
    node.client.arrivedAtCounter=false;
    node.phase = 'leaving';node.route = pathStart(w,st.venue).slice().reverse();node.next = 0;
    w.interactables = w.interactables.filter(i => i !== node.ia);w.nearKey = null;
  }
  function stockDisplay(w, st, shop, property) {
    if (st.display) {
      st.venue.group.remove(st.display);
      const geos = new Set(), mats = new Set(), tex = new Set();st.display.traverse(o => {if(o.geometry)geos.add(o.geometry);for(const m of o.material ? [o.material] : []){mats.add(m);if(m.map)tex.add(m.map);}});
      for(const g of geos)g.dispose();for(const t of tex)t.dispose();for(const m of mats)m.dispose();
    }
    const g = st.display = new THREE.Group();g.name = 'actual-stock-display';
    const body = (geometry,color,x,y,z) => {const m = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.85}));m.position.set(x,y,z);g.add(m);return m;};
    const color = (E.Settlements.SKINS[property && property.skin] || E.Settlements.SKINS.linen).color;
    // The small cloth and the label visibly change when the shop is customized.
    const sx = -(st.venue.w || 8) * .29;
    body(new THREE.BoxGeometry(1.7,.035,2.9),color,sx,1.01,.15);
    body(new THREE.BoxGeometry(1.74,.16,2.94),'#805b3e',sx,.91,.15);
    for(const lx of [-.66,.66])for(const lz of [-1.13,1.43])body(new THREE.BoxGeometry(.11,.86,.11),'#78583e',sx+lx,.43,lz);
    const exposed = shop.stocks.slice(0,4);
    for (let i=0;i<exposed.length;i++) {
      const e = exposed[i], z = -.85+i*.68, x = sx;
      if(e.kind==='fish') {const f=body(new THREE.SphereGeometry(.22,6,4),'#8bb8bd',x,1.18,z);f.scale.set(1.8,.65,.8);body(new THREE.ConeGeometry(.18,.24,3),'#6b8e99',x+.35,1.18,z).rotation.z=Math.PI/2;}
      else if(e.kind==='food'){body(new THREE.SphereGeometry(.21,6,4),'#c9a063',x,1.2,z);body(new THREE.BoxGeometry(.24,.03,.035),'#edd6a6',x,1.39,z);}
      else if(e.kind==='inventory'){body(new THREE.CylinderGeometry(.16,.19,.32,6),'#8dbba5',x,1.2,z);body(new THREE.CylinderGeometry(.07,.07,.13,5),'#d2b17b',x,1.42,z);}
      else if(e.kind==='weapon'){body(new THREE.BoxGeometry(.07,.75,.07),'#becbd1',x,1.48,z);body(new THREE.BoxGeometry(.43,.06,.1),'#c1a16a',x,1.14,z);body(new THREE.BoxGeometry(.08,.2,.08),'#72563b',x,1.0,z);}
      else{const m=body(new THREE.DodecahedronGeometry(.25,0),e.kind==='ore'?'#9ba0aa':e.kind==='material'?'#7f9b68':'#ba9771',x,1.2,z);m.rotation.y=i*.8;}
    }
    const c=document.createElement('canvas');c.width=384;c.height=80;const ctx=c.getContext('2d');ctx.fillStyle='#26424a';ctx.fillRect(0,0,384,80);ctx.strokeStyle='#d5bc86';ctx.lineWidth=3;ctx.strokeRect(3,3,378,74);ctx.fillStyle='#f7e5bf';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 24px Nunito,sans-serif';ctx.fillText(property && property.name || 'Seu ponto comercial',192,29,360);ctx.font='16px Nunito,sans-serif';ctx.fillStyle='#c4d6cf';ctx.fillText(shop.open?'ABERTO · atendimento no balcão':'FECHADO',192,59);
    const t = new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const label=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.4),new THREE.MeshBasicMaterial({map:t}));label.position.set((st.venue.w||8)*.32,1.85,(st.venue.d||7)/2+.06);g.add(E.Shopfronts.readable(label));
    if(E.ScenePerf)E.ScenePerf.batch(g,{exclude:[label]});
    st.venue.group.add(g);
    if(E.Shopfronts && E.Shopfronts.restyle)E.Shopfronts.restyle(st.venue,color);
    if(st.venue.updateSign&&property&&property.name)st.venue.updateSign(property.name);
  }
  S.build = w => {
    if (!w || w.cave || state(w)) return;
    const v = shopVenue(w,w.id); if (!v) return;
    const group = new THREE.Group();group.name='visitors-at-player-stall';w.scene.add(group);
    w.stallLife={venue:v,group,clients:new Map(),employees:new Map(),styles:Array.from({length:8},(_,i)=>appearance(i)),textures:new Map(),nextSync:0,t:0,lastStock:null};
    for(const lz of[-.8,.15,1.1])w.colliders.push({...localPoint(v,-(v.w||8)*.29,lz),r:.73,venue:v.id,stallDisplay:true});
    if(w.buildColliderGrid)w.buildColliderGrid();
    S.update(w,0);
  };
  S.update = (w, dt) => {
    const st=state(w),h=hero();if(!st||!h)return;
    st.t+=Math.min(.1,Math.max(0,dt));
    const shop=E.Vendor.shop(h,w.id),p=E.Vendor.property(h,w.id),valid=E.Vendor.access(h,w.id);
    if(st.t>=st.nextSync){
      st.nextSync=st.t+.3;
      syncEmployees(w,st);
      const sig=`${h.id}|${p&&p.name}|${p&&p.skin}|${shop.open}|${fingerprint(shop)}`;
      if(sig!==st.lastStock){st.lastStock=sig;stockDisplay(w,st,shop,p);}
      // Cada visita registrada pelo motor vira um visitante que vem até o balcão, compra (ou não) e vai embora.
      st.seen=st.seen||new Set();const nowT=E.Sim.clock().elapsed;
      for(const ev of (shop.events||[]).slice(0,4).reverse()){
        if(st.seen.has(ev.id))continue;st.seen.add(ev.id);
        if(!(shop.open&&valid)||!(ev.at>nowT-12)||st.clients.size>=5)continue;
        const node=addClient(w,st,{id:ev.id,name:ev.name,portrait:ev.portrait||0});node.event=ev;
      }
      let q=0;for(const n of st.clients.values()){if(n.phase==='leaving')continue;n.target=localPoint(st.venue,0,(st.venue.d||7)*.12+q*1.08);q++;}
    }
    for(const node of [...st.clients.values()]){
      node.t+=dt;let goal;
      if(node.phase==='leaving'){goal=node.route[node.next];if(!goal){removeClient(w,st,node);continue;}}
      else if(node.phase==='arriving')goal=node.route[node.next]||node.target;
      else goal=node.target;
      if(!goal)continue;
      let dx=goal.x-node.x,dz=goal.z-node.z,d=Math.hypot(dx,dz);
      const playerOnGoal=w.hero&&Math.hypot(w.hero.x-goal.x,w.hero.z-goal.z)<.7;
      const moving=d>(node.phase==='arriving'?.58:.10)&&!(playerOnGoal&&d<.75);
      if(moving){const step=Math.min(d,node.speed*Math.max(0,Math.min(.1,dt)));let nx=node.x+dx/d*step,nz=node.z+dz/d*step;
        // Waiting visitors leave a little room around the player instead of stacking on them.
        const hr=w.hero;if(hr){const hx=nx-hr.x,hz=nz-hr.z,hd=Math.hypot(hx,hz);if(hd>.01&&hd<.58){nx=hr.x+hx/hd*.58;nz=hr.z+hz/hd*.58;}}
        node.x=nx;node.z=nz;
      } else if(node.phase==='leaving'){node.next++;}
      else if(node.phase==='arriving'){
        if(node.next<node.route.length)node.next++;
        else{node.phase='waiting';node.waited=0;}
      }
      else if(node.phase==='waiting'){node.waited=(node.waited||0)+dt;if(node.waited>1.8)leave(w,st,node);}
      node.sprite.position.set(node.x,floor(w,node.x,node.z)+.025,node.z);
      node.ia.x=node.x;node.ia.z=node.z;
      const far=w.hero&&Math.hypot(w.hero.x-node.x,w.hero.z-node.z)>65;node.sprite.visible=!far;
      if(!far&&st.t>=node.frameAt){node.frameAt=st.t+.14;const frames=moving?node.frames.walk:node.frames.idle,cv=frames[Math.floor(node.t*(moving?7:1.5))%frames.length];node.sprite.material.map=texture(st,cv);const toward=Math.abs(dx)>.1?dx:1;node.sprite.scale.x=(toward<0?-1:1)*node.width;}
    }
  };
  function syncEmployees(w,st){
    if(!st.employees)st.employees=new Map();
    const h=hero(),rows=E.Business&&E.Business.staff?E.Business.staff(h,w.id):[],valid=E.Vendor.access(h,w.id),live=valid?rows:[];
    for(const[id,node]of st.employees)if(!live.some(e=>e.id===id)){st.group.remove(node.sprite);node.sprite.material.dispose();w.interactables=w.interactables.filter(i=>i!==node.ia);st.employees.delete(id);}
    for(const [i,e]of live.entries()){
      let n=st.employees.get(e.id);if(!n){const frames=st.styles[(i+2)%st.styles.length],cv=frames.idle[0],sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture(st,cv),transparent:true,alphaTest:.4}));sprite.center.set(.5,.025);sprite.scale.set(2.04*cv.width/cv.height,2.04,1);sprite.name='hired-shop-employee';st.group.add(sprite);const ia={kind:'venue',service:'player-shop',region:w.id,venueId:st.venue.id,action:'staff',sprite,r:1.8,label:'Conversar com '+e.name,icon:icon('chat')};w.interactables.push(ia);n={sprite,ia,frames,index:i};st.employees.set(e.id,n);}
      const active=e.active!==false&&!(e.arrears>0),v=st.venue,lx=e.role==='stockkeeper'?(v.w||8)*.25:1.0+(i%2)*.50,lz=e.role==='stockkeeper'?-.25:-(v.d||7)*.34;
      const p=localPoint(v,lx,lz);n.sprite.position.set(p.x,floor(w,p.x,p.z)+.025,p.z);n.ia.x=p.x;n.ia.z=p.z;n.ia.label=`${e.name} · ${active?(e.role==='stockkeeper'?'Reposição':'Atendimento'):'Salário pendente'}`;
      n.sprite.visible=!!(shopVenue(w,w.id)&&(!w.hero||Math.hypot(w.hero.x-p.x,w.hero.z-p.z)<65));n.sprite.material.opacity=active?1:.65;n.sprite.material.map=texture(st,n.frames.idle[Math.floor(st.t*1.5)%n.frames.idle.length]);
    }
  }
  S.dispose = w => {
    const st=state(w);if(!st)return;for(const n of [...st.clients.values()])removeClient(w,st,n);for(const n of(st.employees||new Map()).values()){st.group.remove(n.sprite);n.sprite.material.dispose();w.interactables=w.interactables.filter(i=>i!==n.ia);}if(st.employees)st.employees.clear();for(const t of st.textures.values())t.dispose();st.textures.clear();w.stallLife=null;
  };
  E.StallLife=S;
})();
