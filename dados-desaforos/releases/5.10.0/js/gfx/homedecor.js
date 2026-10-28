/* Personalizar casa: móveis novos (sofá, TV, geladeira, armário e bancada), papel de parede e piso com
   prévia ao vivo, e o painel que compra, posiciona, gira e guarda peças. As regras (preço, posição,
   dono da casa) continuam em E.Settlements; aqui ficam os modelos, as superfícies e o painel. */
(() => {
  'use strict';
  const U = E.U, I = E.Interior, D = {};
  const SS = () => E.Settlements;
  const icon = (k) => E.Icons ? E.Icons.html(k, { decorative: true }) : '';
  const note = (r) => { if (r && r.message) E.UI.toast(r.message, r.ok ? 'gold' : ''); return r || {}; };
  const card = (opts) => E.WorldServices && E.WorldServices.open(opts);
  const own = (c, item) => { const p = SS().property(E.Store.hero(), c.region, 'home'); return c.kind === 'home' && p && SS().hasAccess(E.Store.hero(), c.region, 'home') && (p.furniture || []).some(f => f.uid === item.uid); };
  const moveAction = (c, item) => own(c, item) ? [{ label: 'Reposicionar este móvel', run: () => { E.WorldServices.close(); I.beginPlacement(item.uid); } }] : [];

  // ------------------------------------------------------------ modelos dos móveis novos
  I.models.sofa = (c, g, item, preview, q) => {
    const k = I.kit, fabric = '#7d6a9c', dark = '#5e4f78';
    k.box(c, g, 0, .3, .02, 2.0, .38, .84, dark); for (const x of [-.48, .48]) k.box(c, g, x, .56, .08, .9, .16, .68, fabric);
    k.box(c, g, 0, .82, -.32, 2.0, .62, .22, fabric); for (const x of [-.92, .92]) k.box(c, g, x, .62, .02, .18, .5, .84, dark);
    for (const x of [-.85, .85]) for (const z of [-.32, .34]) k.box(c, g, x, .06, z, .08, .12, .08, '#4a3a2c');
    k.box(c, g, -.55, .78, -.17, .38, .3, .12, '#c9a46a');
    q.run = (f) => card({ title: 'Sofá estofado', icon: 'home', text: c.seated ? 'Você descansa no sofá. Mova-se quando quiser levantar.' : 'Almofadas macias. Sentar recupera o vigor, mas não substitui dormir.', actions: [{ label: c.seated ? 'Levantar' : 'Sentar no sofá', run: () => { E.WorldServices.close(); if (c.seated) { c.seated = false; if (c.seatReturn) Object.assign(c.hero, c.seatReturn); } else { c.seatReturn = { x: c.hero.x, z: c.hero.z }; c.hero.x = f.x; c.hero.z = f.z; c.seated = true; if (E.WG.world) E.WG.world.hero.st = E.WG.STAMINA; } } }, ...moveAction(c, item)] });
  };
  const CHANNELS = [['Cachoeiras de Lunária', 0.55], ['Mercado de Aurenna', 0.1], ['Torneio da arena', 0.0], ['Céu do astrolábio', 0.72]];
  I.models.tv = (c, g, item, preview, q) => {
    const k = I.kit;
    k.box(c, g, 0, .32, 0, 1.4, .64, .52, '#5d4636'); k.box(c, g, 0, .66, 0, 1.46, .05, .56, '#7a5c43');
    for (const x of [-.36, .36]) k.box(c, g, x, .33, .265, .58, .46, .02, '#6b5040');
    k.box(c, g, 0, 1.18, -.08, 1.26, .78, .1, '#2b2f38'); k.box(c, g, 0, .74, -.08, .3, .1, .2, '#2b2f38');
    // A tela anima com cores do canal enquanto estiver ligada (sem entrar no lote estático).
    const m = new THREE.MeshStandardMaterial({ color: '#10141c', emissive: '#000000', roughness: .4 });
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.1, .62, .02), m); screen.position.set(0, 1.18, -.025); screen.userData.noStaticBatch = true; g.add(screen);
    const cr = new THREE.Mesh(new THREE.OctahedronGeometry(.07), I.kit.mat('#9fd7e0', { emissive: '#4fa3b8', emissiveIntensity: .5 })); cr.position.set(0, 1.66, -.08); g.add(cr);
    screen.onBeforeRender = () => { if (!item.on) { m.emissive.setRGB(0, 0, 0); return; } const t = performance.now() / 1000, hue = CHANNELS[(item.ch || 0) % CHANNELS.length][1]; m.emissive.setHSL((hue + Math.sin(t * .7) * .04 + 1) % 1, .55, .32 + Math.sin(t * 3.1) * .05); };
    q.run = () => {
      const ch = CHANNELS[(item.ch || 0) % CHANNELS.length][0];
      card({ title: 'Tela de cristal', icon: 'eye', text: item.on ? `Passando agora: ${ch}.` : 'A tela de cristal está desligada.', actions: [{ label: item.on ? 'Desligar' : 'Ligar a tela', run: () => { item.on = !item.on; E.Store.save(); q.run(); } }, { label: 'Mudar de canal', primary: false, disabled: !item.on, run: () => { item.ch = ((item.ch || 0) + 1) % CHANNELS.length; E.Store.save(); q.run(); } }, ...moveAction(c, item)] });
    };
  };
  I.models.fridge = (c, g, item, preview, q) => {
    const k = I.kit;
    k.box(c, g, 0, 1.0, 0, .9, 1.96, .76, '#d9dee3'); k.box(c, g, 0, 1.36, .385, .86, .02, .01, '#aab3bc'); k.box(c, g, 0, 1.38, .39, .84, .012, .012, '#9aa3ad');
    for (const y of [1.7, .95]) k.box(c, g, .3, y, .4, .05, .34, .05, '#9aa3ad');
    k.box(c, g, -.2, 1.68, .39, .16, .16, .01, '#8fc9da'); k.box(c, g, 0, .03, 0, .86, .06, .72, '#7d858e');
    q.run = () => card({ title: 'Geladeira de gelo-eterno', icon: 'snowflake', text: 'Um frio suave conserva as porções prontas. Escolha uma refeição da despensa.', actions: [{ label: 'Pegar uma porção', run: () => E.WorldServices.use({ service: 'food', action: 'eat', region: c.region, interior: true }) }, ...moveAction(c, item)] });
  };
  I.models.cabinet = (c, g, item, preview, q) => {
    const k = I.kit;
    k.box(c, g, 0, .95, 0, 1.4, 1.86, .58, '#8a6a4a'); k.box(c, g, 0, 1.92, 0, 1.48, .08, .64, '#a5825a');
    k.box(c, g, 0, .95, .295, .02, 1.7, .01, '#5e4632'); k.box(c, g, 0, 1.05, .295, 1.3, .02, .01, '#5e4632');
    for (const x of [-.09, .09]) for (const y of [.75, 1.3]) k.cylinder(c, g, x, y, .31, .03, .05, '#d7ba7d');
    q.run = () => card({ title: 'Armário de cozinha', icon: 'chest', text: 'Prateleiras para guardar consumíveis, alimentos e carga da mochila.', actions: [{ label: 'Abrir o armário', run: () => I.openStorage() }, ...moveAction(c, item)] });
  };
  I.models.counter = (c, g, item, preview, q) => {
    const k = I.kit;
    k.box(c, g, 0, .5, 0, 1.6, 1.0, .68, '#7d5f43'); k.box(c, g, 0, 1.03, 0, 1.66, .08, .74, '#cfc6b4');
    k.box(c, g, .42, 1.05, .02, .5, .04, .38, '#8d9aa6'); k.cylinder(c, g, .42, 1.18, -.24, .025, .24, '#a8b0b8');
    k.box(c, g, -.38, 1.09, .03, .46, .03, .3, '#b98d5b'); for (const x of [-.4, .4]) k.box(c, g, x, .55, .345, .62, .78, .01, '#6b4f37');
    q.run = () => card({ title: 'Bancada de cozinha', icon: 'cooking', text: 'Pia, tábua e facas. Prepare aqui um ingrediente da mochila.', actions: [{ label: 'Preparar uma porção', run: () => E.WorldServices.use({ service: 'food', action: 'cook', region: c.region, interior: true }) }, ...moveAction(c, item)] });
  };

  // ------------------------------------------------------------ papel de parede e piso
  const swatches = new Map();
  function pattern(kind, base, accent) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 64, 64); x.fillStyle = accent; x.strokeStyle = accent;
    if (kind === 'stripes') { for (let i = 0; i < 64; i += 16) { x.globalAlpha = .55; x.fillRect(i, 0, 6, 64); x.globalAlpha = .25; x.fillRect(i + 9, 0, 2, 64); } }
    else if (kind === 'flowers') { for (const [a, b] of [[12, 12], [44, 28], [20, 48], [52, 58]]) { x.globalAlpha = .75; for (const [dx, dy] of [[0, -3], [3, 0], [0, 3], [-3, 0]]) x.fillRect(a + dx - 1, b + dy - 1, 3, 3); x.fillStyle = '#f2e6bf'; x.fillRect(a - 1, b - 1, 2, 2); x.fillStyle = accent; } }
    else if (kind === 'check') { x.globalAlpha = .35; for (let i = 0; i < 64; i += 16) { x.fillRect(i, 0, 8, 64); x.fillRect(0, i, 64, 8); } }
    else if (kind === 'panel') { x.globalAlpha = 1; x.fillRect(0, 34, 64, 30); x.fillStyle = base; x.globalAlpha = .35; for (let i = 4; i < 64; i += 16) x.fillRect(i, 38, 8, 22); x.globalAlpha = 1; x.fillStyle = '#5a412c'; x.fillRect(0, 32, 64, 3); }
    else if (kind === 'planks') { x.globalAlpha = .9; for (let r = 0; r < 4; r++) { x.fillRect(0, r * 16, 64, 1); const o = (r * 23) % 64; x.fillRect(o, r * 16, 1, 16); x.fillRect((o + 37) % 64, r * 16, 1, 16); } }
    else if (kind === 'check-floor') { x.globalAlpha = .85; x.fillRect(0, 0, 32, 32); x.fillRect(32, 32, 32, 32); }
    else if (kind === 'tiles') { x.globalAlpha = .9; for (let i = 0; i < 64; i += 32) { x.fillRect(i, 0, 2, 64); x.fillRect(0, i, 64, 2); } }
    else if (kind === 'stone') { x.globalAlpha = .9; const rows = [[0, 22, 44], [10, 34, 54], [0, 18, 40], [14, 30, 50]]; rows.forEach((cols, r) => { x.fillRect(0, r * 16, 64, 1); for (const cx of cols) x.fillRect(cx, r * 16, 1, 16); }); x.globalAlpha = .12; x.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) x.fillRect((i * 37) % 60, (i * 19) % 60, 9, 6); }
    x.globalAlpha = 1; return cv;
  }
  const wallPattern = (w) => pattern(w.pattern || 'plain', w.color, w.accent || w.color);
  const floorPattern = (f) => pattern(f.pattern === 'check' ? 'check-floor' : f.pattern, f.color, f.line);
  function swatch(kind, id) {
    const key = kind + ':' + id; if (swatches.has(key)) return swatches.get(key);
    const def = kind === 'wall' ? SS().WALLS[id] : SS().FLOORS[id], url = (kind === 'wall' ? wallPattern(def) : floorPattern(def)).toDataURL();
    swatches.set(key, url); return url;
  }
  function texture(c, cv, rx, ry) {
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); c.textures.add(t); return t;
  }
  function plane(c, w, h, map) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map, roughness: .9 })); c.scene.add(m); return m; }
  // Superfícies por cima das paredes e do piso; trocar o material dá a prévia ao vivo sem reconstruir a casa.
  function surfaces(c, wallId, floorId) {
    for (const m of c.surfaces || []) { c.scene.remove(m); m.geometry.dispose(); m.material.dispose(); }
    c.surfaces = [];
    const p = SS().property(E.Store.hero(), c.region, 'home'), w = SS().WALLS[wallId || p && p.wall] || SS().WALLS.cream, fid = floorId || p && p.floor, f = fid && SS().FLOORS[fid];
    if (w.pattern || wallId) {
      const back = plane(c, 10, 3.2, texture(c, wallPattern(w), 5, w.pattern === 'panel' ? 1 : 1.6)); back.position.set(0, 1.6, -4.37);
      const left = plane(c, 9, 2.7, texture(c, wallPattern(w), 4.5, w.pattern === 'panel' ? 1 : 1.35)); left.rotation.y = Math.PI / 2; left.position.set(-4.87, 1.35, 0);
      c.surfaces.push(back, left);
    }
    if (f) { const floor = plane(c, 10, 9, texture(c, floorPattern(f), 5, 4.5)); floor.rotation.x = -Math.PI / 2; floor.position.y = .02; c.surfaces.push(floor); }
  }

  // ------------------------------------------------------------ painel Personalizar casa
  const state = { tab: 'furniture', sel: 'sofa', wall: null, floor: null, reopen: null };
  const access = (c) => c && c.kind === 'home' && SS().hasAccess(E.Store.hero(), c.region, 'home');
  I.onOpen = (c) => {
    if (c.kind !== 'home') return;
    surfaces(c);
    if (!access(c)) return;
    const b = U.h(`<button class="hd-open" data-customize>${icon('home')}<span>Personalizar casa</span></button>`);
    c.overlay.appendChild(b); b.onclick = () => D.open(c);
    if (state.reopen) { const t = state.reopen; state.reopen = null; D.open(c, t); }
  };
  I.customize = (c) => D.open(c);
  D.open = (c, tab) => {
    if (!access(c)) return E.UI.toast('Somente o morador pode personalizar esta casa.');
    D.close(c, true); if (E.WorldServices) E.WorldServices.close();
    if (tab) state.tab = tab; state.wall = state.floor = null;
    c.decor = U.h(`<section class="hd-panel" aria-label="Personalizar casa"><header><div><strong>Personalizar casa</strong><small data-gold></small></div><button class="ws-close" data-close aria-label="Fechar">${icon('close')}</button></header><nav class="hd-tabs">${[['furniture', 'Móveis'], ['wall', 'Paredes'], ['floor', 'Piso']].map(([k, n]) => `<button data-tab="${k}">${n}</button>`).join('')}</nav><div class="hd-body" data-body></div></section>`);
    c.overlay.appendChild(c.decor); c.overlay.classList.add('decorating');
    // A câmera desliza para a casa ficar na parte livre da tela enquanto o painel está aberto.
    c.panel = c.decor; if (!c.onUpdate && E.Workplace && E.Workplace.slide) c.onUpdate = (dt, cc) => E.Workplace.slide(cc, dt);
    c.decor.onclick = (e) => click(c, e.target.closest('button'));
    // Durante o posicionamento o painel some; volta sozinho se o jogador cancelar.
    c.decorWatch = setInterval(() => {
      if (I.current !== c || !c.decor) return clearInterval(c.decorWatch);
      const hide = !!c.edit; if (c.decor.hidden !== hide) { c.decor.hidden = hide; if (!hide) { state.reopen = null; render(c); } }
    }, 200);
    render(c);
  };
  D.close = (c, quiet) => {
    if (!c || !c.decor) return;
    clearInterval(c.decorWatch); c.decor.remove(); c.decor = c.panel = null; c.overlay.classList.remove('decorating');
    if (state.wall || state.floor) { state.wall = state.floor = null; surfaces(c); }
  };
  function place(c, uid) { state.reopen = 'furniture'; if (!I.beginPlacement(uid)) { state.reopen = null; E.UI.toast('Não foi possível pegar este móvel agora.'); } }
  function refresh(c, tab) { state.reopen = tab; I.refresh(); }
  function click(c, b) {
    if (!b || b.disabled) return;
    const S = SS(), h = E.Store.hero(), d = b.dataset;
    if (d.close != null) return D.close(c);
    if (d.tab) { if (state.wall || state.floor) { state.wall = state.floor = null; surfaces(c); } state.tab = d.tab; return render(c); }
    if (d.sel) { state.sel = d.sel; return render(c); }
    if (d.buy) { const r = note(S.buyFurniture(h, c.region, d.buy)); if (r.ok) place(c, r.item.uid); return render(c); }
    if (d.place) return place(c, d.place);
    if (d.store) { if (note(S.storeFurniture(h, c.region, d.store)).ok) refresh(c, 'furniture'); return; }
    if (d.wall) { state.wall = d.wall; surfaces(c, state.wall, null); return render(c); }
    if (d.floor) { state.floor = d.floor; surfaces(c, null, state.floor); return render(c); }
    if (d.apply) { const id = state[d.apply]; if (id && note(S.decorate(h, c.region, d.apply, id)).ok) { state.wall = state.floor = null; refresh(c, d.apply); } return; }
    if (d.revert != null) { state.wall = state.floor = null; surfaces(c); return render(c); }
  }
  function render(c) {
    const el = c.decor; if (!el) return;
    const S = SS(), h = E.Store.hero(), p = S.property(h, c.region, 'home'), price = (n) => S.price ? S.price(c.region, n) : n;
    el.querySelector('[data-gold]').textContent = `${h.gold} po · ${(p.furniture || []).length}/18 móveis`;
    for (const t of el.querySelectorAll('[data-tab]')) t.classList.toggle('on', t.dataset.tab === state.tab);
    const body = el.querySelector('[data-body]');
    if (state.tab === 'furniture') {
      const list = p.furniture || [], def = S.FURNITURE[state.sel] || S.FURNITURE.bed, id = S.FURNITURE[state.sel] ? state.sel : 'bed';
      const mine = list.filter(f => f.id === id), stored = mine.filter(f => f.stored), placed = mine.filter(f => !f.stored), cost = price(def.price);
      body.innerHTML = `<div class="hd-grid">${Object.entries(S.FURNITURE).map(([k, f]) => { const n = list.filter(x => x.id === k).length; return `<button class="hd-card ${k === id ? 'on' : ''}" data-sel="${k}"><span class="hd-ico">${icon(f.icon)}</span><b>${U.esc(f.name)}</b><small>${n ? `Você tem ${n}` : `${price(f.price)} po`}</small></button>`; }).join('')}</div>
        <div class="hd-detail"><strong>${U.esc(def.name)}</strong><p>${U.esc(def.desc)} Ocupa ${def.w.toFixed(1)} × ${def.d.toFixed(1)} m.</p>
        <div class="hd-actions"><button class="btn sm primary" data-buy="${id}" ${h.gold < cost || list.length >= 18 ? 'disabled' : ''}>Comprar e posicionar · ${cost} po</button>${stored.length ? `<button class="btn sm dark" data-place="${stored[0].uid}">Colocar peça guardada (${stored.length})</button>` : ''}</div>
        ${placed.length ? `<ul class="hd-list">${placed.map((f, i) => `<li><span>${U.esc(def.name)} ${placed.length > 1 ? i + 1 : ''}</span><button class="btn sm dark" data-place="${f.uid}">Mover ou girar</button><button class="btn sm dark" data-store="${f.uid}">Guardar</button></li>`).join('')}</ul>` : ''}</div>`;
    } else {
      const kind = state.tab, cat = kind === 'wall' ? S.WALLS : S.FLOORS, cur = kind === 'wall' ? (p.wall || 'cream') : p.floor, sel = state[kind];
      const unlocked = p[kind + 'Unlocks'] || [kind === 'wall' ? 'cream' : 'oak'], def = sel && cat[sel], cost = def && !unlocked.includes(sel) ? price(def.price) : 0;
      body.innerHTML = `<div class="hd-grid swatches">${Object.entries(cat).map(([k, w]) => `<button class="hd-swatch ${k === sel ? 'on' : ''} ${k === cur ? 'cur' : ''}" data-${kind}="${k}"><i style="background-image:url(${swatch(kind, k)})"></i><b>${U.esc(w.name)}</b><small>${k === cur ? 'Em uso' : unlocked.includes(k) || !w.price ? 'Disponível' : price(w.price) + ' po'}</small></button>`).join('')}</div>
        <div class="hd-detail">${def ? `<strong>Prévia: ${U.esc(def.name)}</strong><p>Veja como fica na casa antes de confirmar.${cost ? ` A aplicação custa ${cost} po.` : ''}</p><div class="hd-actions"><button class="btn sm primary" data-apply="${kind}" ${sel === cur || h.gold < cost ? 'disabled' : ''}>${sel === cur ? 'Já aplicado' : `Aplicar${cost ? ' · ' + cost + ' po' : ''}`}</button><button class="btn sm dark" data-revert>Desfazer prévia</button></div>` : `<p>Toque em ${kind === 'wall' ? 'um papel de parede ou uma pintura' : 'um piso'} para ver a prévia na casa.</p>`}</div>`;
    }
  }
  E.HomeDecor = D;
})();
