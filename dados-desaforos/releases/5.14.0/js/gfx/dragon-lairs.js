/* Covis exploráveis de Elarion. Cenário autoral; fichas oficiais referenciadas em WD.DRAGON_LAIRS.
   Reutiliza o mundo de grutas, sprites, controles, áudio e combate do jogo. */
(() => {
  const DL = {}, U = E.U, WD = E.WD;
  for (const [id, def] of Object.entries(WD.DRAGON_LAIRS)) { WD.CAVES[id] = def; E.M.BY_REGION[id] = []; }
  const entries = Object.entries(WD.DRAGON_LAIRS);
  const entryFor = (key) => entries.find(([, def]) => def.dragonLair === key);
  const config = (w) => w && WD.DRAGON_LAIRS[w.id];
  DL.handles = (key) => !!entryFor(key);
  DL.relocated = (region) => entries.some(([, def]) => def.legacyBossRegion === region);
  const saved = (key) => {
    const world = E.state.world;
    world.dragonLairs = world.dragonLairs || {};
    return world.dragonLairs[key] || (world.dragonLairs[key] = {});
  };
  DL.status = (key = 'ignarax', now = Date.now()) => {
    const entry = entryFor(key); if (!entry) return { ok: false, reason: 'unknown' };
    const [id, def] = entry, rec = (E.state.world.dragonLairs || {})[key] || {}, killed = E.state.world.bossKilled || {};
    // Ambas as chaves antigas preservam a vitória, mesmo se o jogo fechou na tela de recompensa.
    const clearedAt = rec.clearedAt || killed[id] || killed[def.legacyBossRegion] || 0;
    const remaining = Math.max(0, (rec.attemptAt || 0) + def.retryMs - now);
    return { ok: !clearedAt && !remaining, reason: clearedAt ? 'cleared' : remaining ? 'cooldown' : null, clearedAt, remaining };
  };
  const segDistance = (x, z, a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, n = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / n));
    return Math.hypot(x - a.x - dx * t, z - a.z - dz * t);
  };
  DL.pathDistance = (def, x, z) => {
    let distance = Infinity;
    for (const path of def.paths) for (let i = 1; i < path.length; i++) distance = Math.min(distance, segDistance(x, z, path[i - 1], path[i]) - 3.5);
    for (const room of def.rooms) distance = Math.min(distance, Math.hypot(x - room.x, z - room.z) - room.r);
    return distance;
  };
  DL.height = (world, x, z) => {
    const distance = Math.max(0, DL.pathDistance(config(world), x, z));
    const wall = Math.min(1, distance / 1.8);
    return 0.4 + wall * wall * 9; // piso plano conectado; paredões fora das galerias
  };
  DL.layout = (world) => {
    const def = config(world); if (!def) return false;
    world.spawn = { ...def.spawn }; world.waypoint = { ...def.exit }; world.pond = { x: 24, z: 22 };
    world.npcPos = []; world.campPos = []; world.chestPos = []; world.herbPos = [];
    world.storyPos = { x: 0, z: 20 }; world.questPos = { x: 8, z: 10 };
    world.plaza = 3; world.landmarkPos = { x: 999, z: 999 }; world.outpostPos = []; world.lairPos = { ...def.encounter };
    world.roads = def.paths.flatMap((path) => path.slice(1).map((p, i) => [path[i], p]));
    world.extra = {}; return true;
  };
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...extra });
  const piece = (geometry, mat, x, y, z) => { const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); return m; };
  const label = (text, color = '#ffe6af') => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = 'rgba(18,12,16,.88)'; ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#ad7246'; ctx.lineWidth = 5; ctx.strokeRect(3, 3, 506, 122);
    ctx.fillStyle = color; ctx.font = 'bold 28px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    text.split('\n').forEach((line, i, arr) => ctx.fillText(line, 256, 64 + (i - (arr.length - 1) / 2) * 38, 490));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
    s.scale.set(8, 2, 1); return s;
  };
  const bones = (world, x, z, scale = 1) => {
    const g = new THREE.Group(), m = material('#d9c9a8'); g.name = 'dragon-lair-bones';
    for (let i = 0; i < 5; i++) {
      const rib = piece(new THREE.TorusGeometry(0.55 + i * 0.04, 0.08, 4, 10, Math.PI), m, i * 0.3 - 0.6, 0.15, 0);
      rib.rotation.y = Math.PI / 2; g.add(rib);
    }
    g.add(piece(new THREE.BoxGeometry(2.4, 0.12, 0.12), m, 0, 0.12, 0));
    const skull = piece(new THREE.DodecahedronGeometry(0.4, 0), m, 1.35, 0.26, 0); skull.scale.set(1.35, 0.8, 0.85); g.add(skull);
    for (const sz of [-0.15, 0.15]) g.add(piece(new THREE.SphereGeometry(0.1, 5, 4), material('#302a29'), 1.57, 0.42, sz));
    g.scale.setScalar(scale); g.rotation.y = x * 0.4; g.position.set(x, world.groundAt(x, z) + 0.06, z); world.scene.add(g);
  };
  DL.interior = (world) => {
    const def = config(world); if (!def) return;
    const sc = world.scene, stone = material('#3b292d'), warm = material('#743728', { emissive: '#3a1208' });
    const shell = piece(new THREE.SphereGeometry(36, 36, 16, 0, Math.PI * 2, 0, Math.PI / 2), material('#241e24', { side: THREE.BackSide }), 0, -1, 0);
    shell.name = 'dragon-lair-vault'; shell.scale.y = 0.62; sc.add(shell);
    // Contorno sólido das galerias: pulo/planador e navegação por clique não atravessam os paredões.
    // A grade espacial existente do mundo consulta estes mesmos círculos na movimentação.
    for (let x = -28; x <= 28; x += 0.9) for (let z = -28; z <= 28; z += 0.9) {
      if (Math.abs(DL.pathDistance(def, x, z)) < 0.6) world.colliders.push({ x, z, r: 0.62, dragonLair: true, wall: true });
    }
    // Estalagmites nas margens, com colisão: nenhuma invade o eixo das trilhas.
    const rocks = [[-5, 17], [4.4, 19], [-11.8, 11], [-2.6, 5], [-13, -4], [5, -9], [-8.5, -17], [8.5, -17], [-6, -24], [6, -24], [-22, 5], [12, 11]];
    for (let i = 0; i < rocks.length; i++) {
      const [x, z] = rocks[i], y = world.groundAt(x, z), h = 1.7 + i % 3;
      const rock = piece(new THREE.ConeGeometry(0.8, h, 5), stone, x, y + h / 2, z); sc.add(rock);
      world.colliders.push({ x, z, r: 0.8, dragonLair: true });
    }
    for (const [x, z, s] of [[-10, 8, 1], [-17, 4, 1.3], [10, 10, 0.8], [-4, -16, 1.2], [5, -23, 1]]) bones(world, x, z, s);
    // Três sulcos paralelos na pedra mostram a passagem do dragão, sem criar uma armadilha.
    const clawM = material('#130d10');
    for (const [x, z] of [[-6, 5], [0, -12], [3, -19]]) for (let j = -1; j <= 1; j++) {
      const mark = piece(new THREE.BoxGeometry(0.09, 0.025, 2.3), clawM, x + j * 0.3, world.groundAt(x, z) + 0.035, z);
      mark.rotation.y = -0.55; mark.name = 'dragon-lair-claw-mark'; sc.add(mark);
    }
    world.dragonLairLights = [];
    for (const [x, z, color] of [[3.5, 20, '#a6d7ff'], [-11, 0, '#ffb75b'], [5, -20, '#ff7038']]) {
      const y = world.groundAt(x, z); sc.add(piece(new THREE.CylinderGeometry(0.15, 0.3, 1.8, 6), stone, x, y + 0.9, z));
      const flame = piece(new THREE.OctahedronGeometry(0.35, 0), material(color, { emissive: color, emissiveIntensity: 1.5 }), x, y + 2, z); flame.scale.y = 1.7; sc.add(flame);
      const light = new THREE.PointLight(color, 1.4, 18, 1.2); light.position.set(x, y + 2.3, z); sc.add(light); world.dragonLairLights.push(light);
    }
    const entrySign = label('GARGANTA RUBRA\nExploração livre · saída atrás de você'); entrySign.position.set(0, 3.1, 18); sc.add(entrySign);
    const warning = label('IGNARAX, O RUBRO · ND 10\nCâmara opcional · desafie para lutar', '#ffc09a'); warning.position.set(0, 3.4, -13.5); sc.add(warning);
    const retreat = label('← Galeria de saída\nO duelo só começa por sua escolha'); retreat.position.set(-17, 2.4, 3); sc.add(retreat);
    world.dragonLairSigns = [entrySign, warning, retreat];
    // Tesouro cenográfico; os únicos prêmios vêm da vitória já processada pelo combate.
    const gold = material('#c99a32', { metalness: 0.7, roughness: 0.3 });
    const hoard = new THREE.Group(); hoard.name = 'dragon-lair-treasure';
    const rng = U.seeded(def.seed);
    for (let i = 0; i < 34; i++) { const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 3.7; hoard.add(piece(new THREE.DodecahedronGeometry(0.24 + rng() * 0.33, 0), gold, Math.cos(a) * r, 0.1 + rng() * 0.4, Math.sin(a) * r)); }
    hoard.position.set(0, 0.42, -22); sc.add(hoard);
    // A saída usa a posição de retorno de qualquer entrada antiga, inclusive saves do Abismo.
    for (const it of world.interactables) if (it.kind === 'caveExit') { it.kind = 'dragonCave'; it.action = 'exit'; it.label = 'Sair livremente do covil'; it.group = world.caveExitObj; }
    // A estátua oculta criada por buildPOIs não deve bloquear a porta da gruta.
    world.colliders = world.colliders.filter((c) => c.dragonLair || Math.hypot(c.x - def.exit.x, c.z - def.exit.z) > 0.1);
    DL.refresh(world); world.dragonLairSoundAt = 4;
  };
  DL.refresh = (world) => {
    const def = config(world); if (!def) return;
    const status = DL.status(def.dragonLair);
    if (!world.dragonLairSprite && !status.clearedAt) {
      const cv = E.SP.monster(def.dragonLair), sprite = world.makeSprite(cv, 6.2);
      sprite.position.set(def.encounter.x, world.groundAt(def.encounter.x, def.encounter.z) + 0.05, def.encounter.z);
      world.scene.add(sprite); world.dragonLairSprite = sprite;
    }
    if (world.dragonLairSprite) world.dragonLairSprite.visible = !status.clearedAt;
    if (!world.dragonLairChallenge) {
      const it = { kind: 'dragonChallenge', key: def.dragonLair, x: def.encounter.x, z: def.encounter.z + 2, r: 6, sprite: world.dragonLairSprite, label: 'Observar Ignarax · desafio opcional', icon: '🐉' };
      world.dragonLairChallenge = it; world.interactables.push(it);
    }
    world.dragonLairChallenge.label = status.clearedAt ? 'Ignarax derrotado · covil em silêncio' : status.remaining ? 'Ignarax observa · aguarde para tentar' : 'Observar Ignarax · desafio opcional';
  };
  DL.exterior = (world) => {
    if (world.id !== 'montanhas') return;
    const avoid = [world.spawn, world.waypoint, ...world.npcPos, ...world.campPos, ...world.chestPos, world.landmarkPos, world.lairPos, world.extra.cave];
    let p;
    for (let i = 0; i < 100; i++) { const q = world.findSpot(38, 70); if (world.slope(q.x, q.z) < 0.35 && avoid.every((a) => !a || Math.hypot(a.x - q.x, a.z - q.z) > 10) && world.colliders.every((c) => Math.hypot(c.x - q.x, c.z - q.z) > c.r + 5)) { p = q; break; } }
    if (!p) { const c = world.extra.cave; p = c ? { x: c.x + 10, z: c.z + 5 } : { x: 13, z: 0 }; }
    world.extra.dragonCave = p;
    const y = world.groundAt(p.x, p.z), g = new THREE.Group(), rock = material('#49383d'); g.name = 'dragon-lair-entrance';
    for (const x of [-2.6, 2.6]) g.add(piece(new THREE.DodecahedronGeometry(1.75, 0), rock, x, 1.8, 0));
    g.add(piece(new THREE.BoxGeometry(7.2, 1.8, 2), rock, 0, 4.2, 0));
    g.add(piece(new THREE.PlaneGeometry(4, 3.7), new THREE.MeshBasicMaterial({ color: '#180f14', side: THREE.DoubleSide }), 0, 1.85, -0.3));
    const sign = label('COVIL DE IGNARAX\nEntrar para explorar · ND 10 opcional'); sign.position.set(0, 5.7, 0); g.add(sign);
    g.position.set(p.x, y, p.z); world.scene.add(g);
    for (const x of [-2.6, 2.6]) world.colliders.push({ x: p.x + x, z: p.z, r: 1.3 });
    world.interactables.push({ kind: 'dragonCave', cave: 'covil_ignarax', key: 'ignarax', x: p.x, z: p.z + 2.5, r: 3.2, group: g, label: 'Entrar: Covil de Ignarax (exploração livre)', icon: '🐉' });
  };
  DL.enter = async (it) => {
    const w = E.WG.world, id = it.cave || (entryFor(it.key) || [])[0]; if (!w || !WD.DRAGON_LAIRS[id]) return;
    if (E.CoopWorld && E.CoopWorld.guest && !E.CoopWorld.canTravel(id)) { E.UI.toast('O anfitrião precisa abrir este covil antes da visita.'); return; }
    E.state.world.caveReturn = { region: w.id, x: w.hero.x, z: w.hero.z };
    await E.Game.travel(id, { quiet: true });
  };
  DL.leave = async () => {
    const w = E.WG.world, def = config(w); if (!def) return;
    const ret = E.state.world.caveReturn, region = ret && WD.REGIONS[ret.region] ? ret.region : def.parent;
    await E.Game.travel(region, { quiet: true });
    const next = E.WG.world;
    if (ret && ret.region === region) { next.hero.x = ret.x; next.hero.z = ret.z; next.hero.y = next.groundAt(ret.x, ret.z); E.state.world.pos = { x: ret.x, z: ret.z }; }
    E.Store.save(); E.HUD.update();
  };
  let pending = false;
  DL.challenge = async (it) => {
    const w = E.WG.world, def = config(w); if (!def || it.key !== def.dragonLair || pending || E.BattleUI.current) return;
    if (E.CoopWorld && E.CoopWorld.guest) { E.UI.toast('O anfitrião inicia o desafio e convida o grupo pelo combate cooperativo.'); return; }
    const status = DL.status(it.key);
    if (!status.ok) { await E.UI.alert('Covil de Ignarax', status.reason === 'cleared' ? 'Ignarax já foi derrotado neste salvamento. A exploração e a saída continuam livres; os prêmios da vitória são únicos.' : `Aguarde ${Math.ceil(status.remaining / 1000)} segundos antes de tentar novamente. Você pode sair agora.`); return; }
    pending = true;
    try {
      const monster = E.M.MONSTERS[it.key], source = monster.rulesSource;
      const go = await E.UI.confirm(monster.title, `<p><b>Dragão Vermelho Jovem · ND ${monster.cr}</b> — extremamente perigoso. Recomendado nível ${def.level}+ e grupo preparado.</p><p>Entrar nesta câmara não inicia combate. Você pode voltar pela galeria e sair livremente.</p><p>Se desafiar, será usado o combate normal, com a ação <b>Fugir</b>. A vitória concede os prêmios de covil uma única vez neste salvamento.</p><p class="muted">Ficha: ${source.officialName}, SRD 5.2.1, p. ${source.pages.join(', ')}. Implementação parcial; cones, voo e distâncias são simplificados. Cenário e nome Ignarax: conteúdo original de Elarion.</p>`, 'Desafiar Ignarax', 'Recuar sem lutar');
      if (!go || E.WG.world !== w || !DL.status(it.key).ok) return;
      saved(it.key).attemptAt = Date.now(); E.Store.save(); DL.refresh(w);
      const off = U.on('battle:end', (res) => {
        off(); pending = false;
        if (res.outcome === 'win' && (res.kills || []).includes(it.key)) {
          const time = Date.now(); saved(it.key).clearedAt = time;
          const killed = E.state.world.bossKilled || (E.state.world.bossKilled = {}); killed[w.id] = time; killed[def.legacyBossRegion] = time;
        }
        if (E.WG.world === w) { w.hero.x = -2; w.hero.z = -10; w.hero.y = w.groundAt(-2, -10); DL.refresh(w); }
        E.Store.save();
      });
      try { await E.Game.startBattle([it.key], { lair: true, dragonLair: w.id }); }
      catch (error) { off(); throw error; }
    } finally { pending = false; } // o combate ativo já é protegido por BattleUI.current, inclusive no modo Hardcore
  };
  DL.run = (it) => it.action === 'exit' ? DL.leave() : it.kind === 'dragonChallenge' ? DL.challenge(it) : DL.enter(it);
  DL.paintMap = (world) => {
    const def = config(world), canvas = world.minimap; if (!def || !canvas) return;
    const x = canvas.getContext('2d'), scale = canvas.width / world.size, pos = (n) => (n + world.size / 2) * scale;
    x.fillStyle = '#281e25'; x.fillRect(0, 0, canvas.width, canvas.height);
    x.strokeStyle = '#97735d'; x.fillStyle = '#97735d'; x.lineWidth = 7 * scale; x.lineCap = 'round'; x.lineJoin = 'round';
    for (const path of def.paths) { x.beginPath(); path.forEach((p, i) => i ? x.lineTo(pos(p.x), pos(p.z)) : x.moveTo(pos(p.x), pos(p.z))); x.stroke(); }
    for (const room of def.rooms) { x.beginPath(); x.arc(pos(room.x), pos(room.z), room.r * scale, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#cfe8ff'; x.beginPath(); x.arc(pos(def.exit.x), pos(def.exit.z), 1.5 * scale, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ea7b43'; x.beginPath(); x.arc(pos(def.encounter.x), pos(def.encounter.z), 2 * scale, 0, Math.PI * 2); x.fill();
    world.dragonLairMapReady = true;
  };
  DL.update = (world, dt) => {
    const def = config(world); if (!def) return;
    if (!world.dragonLairMapReady) DL.paintMap(world);
    const t = world.t;
    for (const sign of world.dragonLairSigns || []) sign.visible = Math.hypot(world.hero.x - sign.position.x, world.hero.z - sign.position.z) > 5 && Math.hypot(world.camera.position.x - sign.position.x, world.camera.position.z - sign.position.z) > 7;
    for (const light of world.dragonLairLights || []) light.intensity = 1.35 + Math.sin(t * 3.1 + light.position.x) * 0.12;
    if (world.dragonLairSprite) world.dragonLairSprite.position.y = 0.45 + Math.sin(t * 1.1) * 0.035;
    if (t >= (world.dragonLairRefreshAt || 0)) { DL.refresh(world); world.dragonLairRefreshAt = t + 1; }
    if (t >= world.dragonLairSoundAt && !E.WG.locked && !document.hidden && !(E.UI.anyOpen && E.UI.anyOpen())) {
      world.dragonLairSoundAt = t + 17;
      if (!DL.status(def.dragonLair).clearedAt) E.Audio.sfx(Math.hypot(world.hero.x - def.encounter.x, world.hero.z - def.encounter.z) < 18 ? 'impact' : 'step');
    }
    void dt;
  };
  E.DragonLairs = DL;
})();
