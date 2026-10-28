/* Moradores seguem as ruas, visitam bancas e conversam. Sem chamadas de rede,
   geração de arte por quadro ou busca quadrática entre todos os pedestres. */
(() => {
  'use strict';
  const C = {}, U = E.U, CELL = 3, RADIUS = .28;
  const NAMES = ['Lia', 'Tomás', 'Nilo', 'Sora', 'Bento', 'Cora', 'Ivo', 'Mira', 'Ravi', 'Dália', 'Caio', 'Nina'];
  const OUTFITS = ['#688e89', '#a56b58', '#76688f', '#c5a368', '#526e92', '#8d9b6b', '#ae788f', '#668d9c'];
  const SKINS = ['#f6dcc4', '#e3b892', '#c98d68', '#8e5a3e'];
  const HAIR = ['#3a2a20', '#7a4a2a', '#d4af37', '#c84b3a', '#d9d6cc', '#242531', '#5b3d31', '#272c41'];
  const ROLES = ['Mercador', 'Marujo', 'Jardineira', 'Carteiro', 'Mineiro', 'Costureiro', 'Sentinela', 'Alquimista'];
  const SERVICES = { general: 'armazém', food: 'cozinha', smith: 'forja', furniture: 'marcenaria', guild: 'Casa dos Ofícios', inn: 'pousada', casino: 'cassino', market: 'bolsa de mercadorias', alchemy: 'alquimista', pier: 'píer', arena: 'arena', home: 'residência', 'player-shop': 'ponto comercial' };
  const MERCHANTS = { general: 'Dona Teresa', food: 'Cozinheira Alba', smith: 'Mestre Olavo', furniture: 'Marceneira Íris', guild: 'Escrivã Vânia', casino: 'Crupiê Silas', market: 'Corretora Celina', alchemy: 'Alquimista Lume', pier: 'Pescador Bento', arena: 'Árbitra Joana' };
  let library = null;
  function appearances() {
    if (library) return library;
    library = OUTFITS.map((outfit, i) => {
      const npc = { name: 'Morador das ruas ' + i, title: ROLES[i], look: { skin: SKINS[i % SKINS.length], hair: HAIR[i], outfit } };
      return ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3'].map(frame => E.SP.npc(npc, frame));
    });
    return library;
  }
  const gridKey = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  const surface = (w, x, z) => w.groundAt ? w.groundAt(x, z) : w.terrainAt ? w.terrainAt(x, z) : w.height(x, z);
  function rebuildSolids(w, s) {
    s.solids.clear();
    for (const o of w.colliders || []) {
      const reach = o.r || Math.max(o.w || 0, o.d || 0) * .71 || .4;
      const minX = Math.floor((o.x - reach) / CELL), maxX = Math.floor((o.x + reach) / CELL);
      const minZ = Math.floor((o.z - reach) / CELL), maxZ = Math.floor((o.z + reach) / CELL);
      for (let x = minX; x <= maxX; x++) for (let z = minZ; z <= maxZ; z++) {
        const k = x + ',' + z;
        if (!s.solids.has(k)) s.solids.set(k, []);
        s.solids.get(k).push(o);
      }
    }
    s.colliderCount = (w.colliders || []).length;
  }
  function blocked(s, x, z, radius = RADIUS) {
    const gx = Math.floor(x / CELL), gz = Math.floor(z / CELL);
    for (let ix = -1; ix <= 1; ix++) for (let iz = -1; iz <= 1; iz++) {
      const list = s.solids.get((gx + ix) + ',' + (gz + iz));
      if (!list) continue;
      for (const o of list) {
        if (o.r != null) {
          const r = o.r + radius;
          if ((x - o.x) ** 2 + (z - o.z) ** 2 < r * r) return true;
        } else if (o.w && o.d) {
          const a = o.rotation || 0, dx = x - o.x, dz = z - o.z;
          if (Math.abs(dx * Math.cos(a) - dz * Math.sin(a)) < o.w / 2 + radius && Math.abs(dx * Math.sin(a) + dz * Math.cos(a)) < o.d / 2 + radius) return true;
        }
      }
    }
    return false;
  }
  function clearSegment(s, a, b, radius = RADIUS + .13) {
    const d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / .55));
    for (let i = 0; i <= n; i++) if (blocked(s, a.x + (b.x - a.x) * i / n, a.z + (b.z - a.z) * i / n, radius)) return false;
    return true;
  }
  function makeGraph(w, s) {
    const graph = [], lookup = new Map();
    const node = p => {
      const k = Math.round(p.x * 10) + ',' + Math.round(p.z * 10);
      if (lookup.has(k)) { const n = graph[lookup.get(k)]; n.pause = n.pause || !!p.pause; return n; }
      const n = { id: graph.length, x: p.x, z: p.z, pause: !!p.pause, edges: [] };
      graph.push(n); lookup.set(k, n.id); return n;
    };
    const connect = (a, b) => {
      if (a.id === b.id || a.edges.includes(b.id) || !clearSegment(s, a, b)) return;
      a.edges.push(b.id); b.edges.push(a.id);
    };
    for (const raw of w.crowdRoutes || []) {
      const route = Array.isArray(raw) ? raw : raw.points;
      if (!route || route.length < 2) continue;
      const nodes = route.map((p, i) => ({...p, pause: p.pause || !!(raw.pauseIndices && raw.pauseIndices.includes(i))})).filter(p => Number.isFinite(p.x) && Number.isFinite(p.z)).map(node);
      for (let i = 1; i < nodes.length; i++) connect(nodes[i - 1], nodes[i]);
      if (raw.closed !== false && nodes.length > 2) connect(nodes[nodes.length - 1], nodes[0]);
    }
    // Clear connectors let a resident change streets rather than repeat one tiny loop.
    for (const a of graph) {
      if (a.edges.length > 2) continue;
      let nearest = null, distance = 15;
      for (const b of graph) {
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (b.id !== a.id && !a.edges.includes(b.id) && b.edges.length < 4 && d > 2 && d < distance && clearSegment(s, a, b, .65)) { nearest = b; distance = d; }
      }
      if (nearest) connect(a, nearest);
    }
    return graph;
  }
  function bubbleTexture() {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 40;
    const x = cv.getContext('2d'); x.fillStyle = '#f8efd6'; x.beginPath();
    x.roundRect ? x.roundRect(3, 2, 58, 29, 10) : x.rect(3, 2, 58, 29); x.fill();
    x.beginPath(); x.moveTo(14, 29); x.lineTo(12, 39); x.lineTo(27, 29); x.fill();
    x.fillStyle = '#677788'; for (const cx of [20, 32, 44]) { x.beginPath(); x.arc(cx, 17, 2.2, 0, Math.PI * 2); x.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function addActor(w, s, appearance, name, x, z, merchant) {
    const frames = appearances()[appearance % OUTFITS.length], height = merchant ? 2.05 : 1.93 + s.rng() * .28;
    const sp = w.makeSprite(frames[0], height); sp.name = merchant ? 'street-merchant' : 'street-resident'; sp.position.set(x, surface(w, x, z), z); w.scene.add(sp);
    const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: s.bubbleTexture, transparent: true, depthWrite: false, opacity: .9 }));
    bubble.scale.set(.72, .45, 1); bubble.visible = false; sp.add(bubble); bubble.position.set(0, 1.16, 0);
    const a = { id: s.actors.length, name, x, z, y: sp.position.y, vy: sp.position.y, frames, sp, bubble, height, width: height * frames[0].width / frames[0].height,
      speed: .92 + s.rng() * .4, stride: s.rng() * 4, pause: 0, state: merchant ? 'working' : 'walking', merchant: merchant || null,
      alpha: 1, enabled: true, target: null, from: null, stall: 0, cooldown: 7 + s.rng() * 12, nextFrame: 0, frame: -1, dx: 0, dz: 0 };
    const it = a.interaction = { kind: 'citizen', id: w.id + ':resident:' + a.id, citizen: a, x, z, r: 1.85, label: merchant ? `Conversar com ${name}` : `Falar com ${name}`, icon: E.Icons ? E.Icons.html('chat', { decorative: true }) : '' };
    w.interactables.push(it); s.actors.push(a); return a;
  }
  function worldPoint(v, p) {
    const a = v.rotation || 0;
    return { x: v.x + p.x * Math.cos(a) + p.z * Math.sin(a), z: v.z - p.x * Math.sin(a) + p.z * Math.cos(a) };
  }
  C.build = w => {
    if (!w || w.cave || w.streetLife) return w && w.streetLife;
    const s = w.streetLife = { time: 0, aiAt: 0, framesAt: 0, actors: [], walkers: [], merchants: [], solids: new Map(), peers: new Map(), rng: U.seeded(w.reg.seed * 719 + 31), colliderCount: -1, guide: null };
    rebuildSolids(w, s); s.graph = makeGraph(w, s);
    const available = s.graph.filter(n => n.edges.length);
    if (!available.length && !(w.venues || []).length) return s;
    s.bubbleTexture = bubbleTexture();
    const quality = E.state.settings.quality, metro = !!w.reg.metro;
    const count = available.length ? (metro ? quality === 'baixo' ? 10 : quality === 'alto' ? 18 : 14 : quality === 'baixo' ? 4 : quality === 'alto' ? 8 : 6) : 0;
    const used = [];
    for (let i = 0; i < count; i++) {
      let from, to, x, z, found = false;
      for (let k = 0; k < 35 && !found; k++) {
        from = available[(i * 3 + Math.floor(s.rng() * available.length)) % available.length]; to = s.graph[from.edges[Math.floor(s.rng() * from.edges.length)]];
        const t = .12 + s.rng() * .76, length = Math.hypot(to.x - from.x, to.z - from.z), lane = .32;
        x = from.x + (to.x - from.x) * t + (to.z - from.z) / length * lane;
        z = from.z + (to.z - from.z) * t - (to.x - from.x) / length * lane;
        found = !blocked(s, x, z) && used.every(p => Math.hypot(p.x - x, p.z - z) > 1.0);
      }
      if (!found) continue;
      const a = addActor(w, s, i % 8, NAMES[i % NAMES.length], x, z, null); a.from = from.id; a.target = to.id;
      a.pause = i % 5 === 0 ? 1 + s.rng() * 2 : 0; s.walkers.push(a); used.push(a);
    }
    // The shopkeeper stands behind the open counter; the player's shop is staffed by the player.
    for (const v of w.venues || []) {
      if (v.open === false || ['home', 'inn', 'player-shop', 'player-casino'].includes(v.service)) continue;
      const at = v.merchantAt || { x: 0, z: -v.d * .34 }, p = at.world ? at : worldPoint(v, at);
      const a = addActor(w, s, (s.merchants.length * 3 + 2) % 8, v.service === 'market' ? 'Bento · Atacadista' : MERCHANTS[v.service] || 'Comerciante', p.x, p.z, v);
      a.interaction.venueId = v.id; s.merchants.push(a);
    }
    if (s.actors.length) {
      const geo = new THREE.CircleGeometry(.32, 8); geo.rotateX(-Math.PI / 2);
      s.shadows = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#15212a', transparent: true, opacity: .2, depthWrite: false }), s.actors.length);
      s.shadows.name = 'resident-shadows'; s.shadows.frustumCulled = false; s.shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage); w.scene.add(s.shadows); s.matrix = new THREE.Matrix4();
    }
    C.update(w, 0); return s;
  };
  function neighborActors(s, a, fn) {
    const gx = Math.floor(a.x / CELL), gz = Math.floor(a.z / CELL);
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) {
      const list = s.peers.get((gx + x) + ',' + (gz + z)); if (list) for (const b of list) if (b !== a && b.enabled) fn(b);
    }
  }
  function chooseNext(s, a) {
    const at = s.graph[a.target]; if (!at || !at.edges.length) return;
    const options = at.edges.filter(id => id !== a.from), previous = a.from;
    a.from = at.id; a.target = (options.length ? options : at.edges)[Math.floor(s.rng() * (options.length || at.edges.length))];
    const nodePause = at.pause || s.rng() < .18;
    if (nodePause) { a.pause = 1.4 + s.rng() * 3; a.state = at.pause ? 'shopping' : 'resting'; }
    if (a.target === previous && s.rng() < .35) { a.pause = 1.0; a.state = 'resting'; }
  }
  function think(w, s) {
    if (s.colliderCount !== (w.colliders || []).length) rebuildSolids(w, s);
    s.peers.clear();
    const night = !!(E.Sim && E.Sim.clock().night), active = Math.max(2, Math.ceil(s.walkers.length * (night ? .42 : 1)));
    s.walkers.forEach((a, i) => { a.enabled = i < active; });
    for (const a of s.actors) if (a.enabled) { const k = gridKey(a.x, a.z); if (!s.peers.has(k)) s.peers.set(k, []); s.peers.get(k).push(a); }
    for (const a of s.actors) {
      a.vy = surface(w, a.x, a.z); a.y += (a.vy - a.y) * .8;
      if (!a.enabled || a.merchant) continue;
      a.cooldown = Math.max(0, a.cooldown - .22);
      let partner = null;
      if (a.cooldown <= 0 && (a.pause > .5 || s.rng() < .025)) neighborActors(s, a, b => {
        if (!partner && !b.merchant && b.cooldown <= 0 && Math.hypot(a.x - b.x, a.z - b.z) < 1.7) partner = b;
      });
      if (partner) {
        a.pause = partner.pause = 2.7 + s.rng() * 1.8; a.state = partner.state = 'talking'; a.cooldown = partner.cooldown = 18 + s.rng() * 12;
        a.face = partner.x > a.x ? 1 : -1; partner.face = -a.face;
      }
    }
  }
  C.update = (w, dt) => {
    const s = w && w.streetLife; if (!s || !s.actors.length) return;
    dt = Math.min(.12, Math.max(0, dt || 0)); s.time += dt;
    if (s.time >= s.aiAt) { s.aiAt = s.time + .22; think(w, s); }
    const hero = w.hero, far = E.state.settings.quality === 'baixo' ? 55 : 78, yaw = w.cam ? w.cam.yaw : 0;
    for (const a of s.actors) {
      a.alpha += ((a.enabled ? 1 : 0) - a.alpha) * Math.min(1, dt * 3.5);
      const nearby = !hero || (a.x - hero.x) ** 2 + (a.z - hero.z) ** 2 < far * far;
      a.sp.visible = nearby && a.alpha > .025; a.sp.material.opacity = a.alpha; a.interaction.r = a.enabled && nearby ? 1.85 : 0;
      a.bubble.visible = a.sp.visible && a.state === 'talking';
      if (a.merchant) {
        a.y += (a.vy - a.y) * Math.min(1, dt * 10);
      } else if (a.enabled) {
        if (a.pause > 0) { a.pause -= dt; a.dx = a.dz = 0; }
        else if (a.target != null) {
          a.state = 'walking'; const to = s.graph[a.target], from = s.graph[a.from];
          if (!to || !from) continue;
          const length = Math.hypot(to.x - from.x, to.z - from.z) || 1;
          const tx = to.x + (to.z - from.z) / length * .32, tz = to.z - (to.x - from.x) / length * .32;
          const dx = tx - a.x, dz = tz - a.z, distance = Math.hypot(dx, dz), step = Math.min(distance, a.speed * dt);
          if (distance < .3) chooseNext(s, a);
          else {
            let yieldTo = false;
            if (hero && Math.hypot(a.x - hero.x, a.z - hero.z) < .88) yieldTo = true;
            neighborActors(s, a, b => { if (b.id < a.id && Math.hypot(a.x - b.x, a.z - b.z) < .68) yieldTo = true; });
            const vx = dx / distance, vz = dz / distance, nx = a.x + vx * step, nz = a.z + vz * step;
            if (!yieldTo && !blocked(s, nx, nz)) {
              a.x = nx; a.z = nz; a.dx = vx; a.dz = vz; a.stride += step * 3.4; a.stall = 0;
            } else {
              a.dx = a.dz = 0; a.stall += dt;
              // An obstacle can appear after the city was built; turn back along the same clear street.
              if (a.stall > 1.7) { const old = a.from; a.from = a.target; a.target = old; a.stall = 0; a.pause = .25 + s.rng() * .4; }
            }
          }
        }
        a.y += (a.vy - a.y) * Math.min(1, dt * 10);
      }
      if (a.sp.visible && s.time >= a.nextFrame) {
        a.nextFrame = s.time + (nearby ? .12 : .4);
        const walking = !a.merchant && a.enabled && a.pause <= 0 && (Math.abs(a.dx) + Math.abs(a.dz) > .05);
        const f = walking ? 2 + Math.floor(a.stride) % 4 : Math.floor(s.time * 1.2 + a.id) % 2;
        if (f !== a.frame) { a.frame = f; a.sp.material.map = w.tex(a.frames[f]); }
        const face = a.state === 'talking' ? a.face : a.merchant ? Math.sin(a.merchant.rotation || 0) * Math.cos(yaw) - Math.cos(a.merchant.rotation || 0) * Math.sin(yaw) : a.dx * Math.cos(yaw) - a.dz * Math.sin(yaw);
        if (Math.abs(face || 0) > .06) a.sp.scale.x = a.width * (face > 0 ? 1 : -1);
      }
      a.sp.position.set(a.x, a.y + .025, a.z); a.interaction.x = a.x; a.interaction.z = a.z;
      if (s.shadows) { s.matrix.makeScale(a.sp.visible ? a.alpha : 0, 1, a.sp.visible ? a.alpha : 0); s.matrix.setPosition(a.x, a.y + .038, a.z); s.shadows.setMatrixAt(a.id, s.matrix); }
    }
    if (s.shadows) s.shadows.instanceMatrix.needsUpdate = true;
    if (s.guide) {
      s.guide.left -= dt; s.guide.line.material.opacity = Math.min(.78, s.guide.left / 2);
      if (s.guide.left <= 0 || hero && Math.hypot(hero.x - s.guide.target.x, hero.z - s.guide.target.z) < 2) removeGuide(w, s);
    }
  };
  function removeGuide(w, s) {
    if (!s.guide) return;
    w.scene.remove(s.guide.line); s.guide.line.geometry.dispose(); s.guide.line.material.dispose(); s.guide = null;
  }
  function nearest(graph, p) {
    let id = null, best = Infinity;
    for (const n of graph) if (n.edges.length) { const d = (n.x - p.x) ** 2 + (n.z - p.z) ** 2; if (d < best) { best = d; id = n.id; } }
    return id;
  }
  C.guide = (w, venue) => {
    const s = w && w.streetLife; if (!s || !venue || !w.hero) return false;
    removeGuide(w, s);
    const target = venue.frontAt || worldPoint(venue, { x: 0, z: venue.d / 2 + 1.1 }), start = nearest(s.graph, w.hero), end = nearest(s.graph, target), path = [];
    if (start != null && end != null) {
      const distance = new Map([[start, 0]]), previous = new Map(), remaining = new Set(s.graph.filter(n => n.edges.length).map(n => n.id));
      while (remaining.size) {
        let id = null, best = Infinity; for (const key of remaining) if ((distance.get(key) ?? Infinity) < best) { best = distance.get(key); id = key; }
        if (id == null) break; remaining.delete(id); if (id === end) break;
        for (const next of s.graph[id].edges) { const a = s.graph[id], b = s.graph[next], d = best + Math.hypot(b.x - a.x, b.z - a.z); if (d < (distance.get(next) ?? Infinity)) { distance.set(next, d); previous.set(next, id); } }
      }
      if (start === end || previous.has(end)) { let id = end; path.unshift(s.graph[id]); while (previous.has(id)) { id = previous.get(id); path.unshift(s.graph[id]); } }
    }
    const stops = [{ x: w.hero.x, z: w.hero.z }, ...path, target], vertices = [];
    for (let i = 1; i < stops.length; i++) {
      const a = stops[i - 1], b = stops[i], d = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(d / 1.3));
      for (let k = 0; k < n; k++) { const x = a.x + (b.x - a.x) * k / n, z = a.z + (b.z - a.z) * k / n; vertices.push(new THREE.Vector3(x, surface(w, x, z) + .09, z)); }
    }
    vertices.push(new THREE.Vector3(target.x, surface(w, target.x, target.z) + .09, target.z));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(vertices), new THREE.LineDashedMaterial({ color: '#edd39b', dashSize: .42, gapSize: .72, transparent: true, opacity: .78, depthWrite: false }));
    line.computeLineDistances(); line.name = 'walking-directions'; w.scene.add(line); s.guide = { line, target, left: 35 };
    return true;
  };
  function directions(w, it, kinds) {
    const available = (w.venues || []).filter(v => kinds.includes(v.service));
    available.sort((a, b) => Math.hypot(a.x - it.x, a.z - it.z) - Math.hypot(b.x - it.x, b.z - it.z));
    const v = available[0];
    if (!v) { E.UI.toast('Este serviço fica em outra parte da região. Procure as placas das ruas.'); return; }
    const p = v.frontAt || v, dx = p.x - w.hero.x, dz = p.z - w.hero.z, distance = Math.round(Math.hypot(dx, dz));
    const compass = Math.abs(dx) > Math.abs(dz) * 1.6 ? dx > 0 ? 'leste' : 'oeste' : Math.abs(dz) > Math.abs(dx) * 1.6 ? dz > 0 ? 'sul' : 'norte' : (dz > 0 ? 'sud' : 'nord') + (dx > 0 ? 'este' : 'oeste');
    E.WorldServices.open({ title: it.citizen.name, text: `${v.name || SERVICES[v.service]} fica a ${distance} passos para ${compass}. Vá pela rua até a fachada; você pode entrar e usar os objetos lá dentro.`, anchor: it, region: w.id,
      actions: [{ label: 'Mostrar o caminho no chão', run: () => { C.guide(w, v); E.WorldServices.close(); } }, { label: 'Obrigado!', run: () => E.WorldServices.close() }] });
  }
  C.talk = it => {
    const w = E.WG && E.WG.world, a = it && it.citizen;
    if (!w || !a || !a.enabled || Math.hypot(w.hero.x - a.x, w.hero.z - a.z) > 3.4) return;
    const previousState = a.state;
    a.pause = 9; a.state = a.merchant ? 'working' : 'talking'; a.face = w.hero.x > a.x ? 1 : -1;
    const night = !!(E.Sim && E.Sim.clock().night);
    const text = a.merchant ? `Bem-vindo à ${SERVICES[a.merchant.service] || 'loja'}. Os produtos e as ferramentas estão expostos. Aproxime-se do que você quer usar; cada bancada tem seu próprio atendimento.`
      : previousState === 'shopping' ? 'Estou dando uma volta pela feira. Gosto de ver os produtos antes de gastar minhas moedas.'
      : night ? 'As ruas ficam mais tranquilas à noite. Vou encerrar as compras e voltar para casa. Se precisar descansar, procure a pousada.'
      : ['Estou indo ver as novidades das bancas. Hoje a cidade está cheia de movimento.', 'Acabei de passar pela praça. É bom ver as lojas abertas e os vizinhos na rua.', 'Vou encontrar uma amiga perto da feira. Você já conhece as ruas daqui?', 'Dá para trabalhar nos estabelecimentos daqui. A Casa dos Ofícios anuncia as vagas.'][a.id % 4];
    if (!E.WorldServices) { E.UI.toast(`${a.name}: ${text}`); return; }
    E.WorldServices.open({ title: a.name, text, anchor: it, region: w.id, actions: [
      ...(a.merchant ? [{ label: 'Pedir emprego aqui', run: () => E.WorldServices.use({ kind: 'venue', service: a.merchant.service, action: 'jobs', region: w.id, venue: a.merchant, venueId: a.merchant.id, x: a.x, z: a.z, r: 3.4, label: 'Trabalhar neste estabelecimento' }) }] : []),
      ...(a.merchant && (a.merchant.service === 'market' || a.merchant.service === 'general' && !w.reg.metro) ? [{ label: 'Comprar produtos no atacado', run: () => E.WorldServices.use({ kind: 'venue', service: a.merchant.service, action: 'wholesale', region: w.id, venue: a.merchant, venueId: a.merchant.id, x: a.x, z: a.z, r: 3.4, label: 'Produtos do fornecedor atacadista' }) }] : []),
      { label: 'Onde comprar suprimentos?', run: () => directions(w, it, ['general', 'food']) },
      { label: 'Onde posso dormir?', run: () => directions(w, it, ['inn']) },
      { label: 'Quero encontrar trabalho', run: () => directions(w, it, ['guild']) },
      ...(!a.merchant&&w.reg.metro?[{label:'Quero abrir meu próprio cassino',run:()=>directions(w,it,['player-casino'])}]:[]),
      { label: 'Até logo', run: () => E.WorldServices.close() },
    ] });
  };
  C.dispose = w => { const s = w && w.streetLife; if (!s) return; removeGuide(w, s); w.interactables = w.interactables.filter(it => it.kind !== 'citizen'); w.streetLife = null; };
  C.stats = w => { const s = w && w.streetLife; return s ? { walkers: s.walkers.length, merchants: s.merchants.length, active: s.walkers.filter(a => a.enabled).length, nodes: s.graph.length, edges: s.graph.reduce((n, p) => n + p.edges.length, 0) / 2, atlasAppearances: OUTFITS.length } : null; };
  E.Crowds = C;
})();
