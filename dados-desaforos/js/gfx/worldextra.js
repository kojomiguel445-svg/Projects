/* Detalhes do mundo: material de terreno procedural, praça central, marcos de região,
   acampamentos, vida selvagem, nuvens e o modelo de baú. Usado por world3d.js. */
(() => {
  const U = E.U;
  const surface = (w, x, z) => w.terrainAt ? w.terrainAt(x, z) : w.height(x, z);
  const WX = {};
  const col = (h) => new THREE.Color(h);
  const BIOME_ID = { metro: 1, forest: 0, city: 1, ruins: 2, coast: 3, mountain: 4, astral: 5, market: 6, garden: 7, abyss: 8, cave: 8 };

  // ============================================================ material do terreno
  const GLSL_NOISE = `
    float wxHash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
    float wxNoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(wxHash(i), wxHash(i+vec2(1,0)), u.x), mix(wxHash(i+vec2(0,1)), wxHash(i+vec2(1,1)), u.x), u.y); }
    float wxFbm(vec2 p){ float s = 0.0, a = 0.5;
      #if ELARION_TERRAIN_DETAIL >= 2
        for(int i=0;i<4;i++){ s += a*wxNoise(p); p *= 2.03; a *= 0.5; } return s;
      #elif ELARION_TERRAIN_DETAIL == 1
        for(int i=0;i<2;i++){ s += a*wxNoise(p); p *= 2.03; a *= 0.5; } return s*1.25;
      #else
        return wxNoise(p)*0.9375;
      #endif
    }
    vec3 wxCell(vec2 p){ vec2 f = fract(p)-0.5; return vec3(length(f),0.5-max(abs(f.x),abs(f.y)),wxHash(floor(p))); }
    // voronoi: x = distância à célula, y = distância à borda, z = id da célula
    vec3 wxVoro(vec2 p){ vec2 n = floor(p), f = fract(p); float md = 8.0, md2 = 8.0; vec2 mr; float id = 0.0;
      for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g = vec2(float(i),float(j)); vec2 o = vec2(wxHash(n+g), wxHash(n+g+17.3)); vec2 r = g+o-f; float d = dot(r,r);
        if(d<md){ md2 = md; md = d; mr = r; id = wxHash(n+g+3.1); } else if(d<md2) md2 = d; }
      return vec3(sqrt(md), sqrt(md2)-sqrt(md), id); }
  `;

  // Detail is compiled out, rather than evaluating costly noise and discarding it later.
  WX.setTerrainQuality = (material, quality) => {
    if (!material) return;
    const detail = quality === 'alto' ? 2 : quality === 'baixo' ? 0 : 1;
    material.defines = material.defines || {};
    if (material.defines.ELARION_TERRAIN_DETAIL !== detail) {
      material.defines.ELARION_TERRAIN_DETAIL = detail;
      material.needsUpdate = true;
    }
  };
  WX.terrainMaterial = (biome, B, plaza, waterLevel) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93 });
    const uni = {
      uBiome: { value: BIOME_ID[biome] || 0 }, uPlaza: { value: plaza }, uWater: { value: waterLevel }, uTime: { value: 0 },
      uAccent: { value: col(B.accent || B.light) }, uPave: { value: col(B.pave || '#b9b1a3') },
    };
    m.userData.uniforms = uni;
    m.defines = { ELARION_BIOME: BIOME_ID[biome] || 0 };
    WX.setTerrainQuality(m, E.state && E.state.settings && E.state.settings.quality);
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = 'varying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n vWN = normalize(mat3(modelMatrix) * objectNormal);');
      sh.fragmentShader = `varying vec3 vWP;\nvarying vec3 vWN;\nuniform float uBiome; uniform float uPlaza; uniform float uWater; uniform float uTime; uniform vec3 uAccent; uniform vec3 uPave;\n${GLSL_NOISE}\n` +
        sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec2 p = vWP.xz;
          float b = float(ELARION_BIOME);
          vec3 c = diffuseColor.rgb;
          float n1 = wxFbm(p*0.22);
          #if ELARION_TERRAIN_DETAIL >= 2
            float n2 = wxFbm(p*1.3+7.0), n3 = wxNoise(p*9.0);
          #elif ELARION_TERRAIN_DETAIL == 1
            float n2 = wxNoise(p*0.65+7.0)*0.9375, n3 = n2;
          #else
            float n2 = n1, n3 = n1;
          #endif
          float slope = 1.0 - clamp(vWN.y, 0.0, 1.0);
          // variação natural: manchas grandes + granulado fino
          c *= 0.84 + 0.3*n1;
          c *= 0.93 + 0.12*n2;
          c *= 0.96 + 0.08*n3;
          // rocha nas encostas, com estratos
          float rock = smoothstep(0.28, 0.5, slope);
          #if ELARION_TERRAIN_DETAIL >= 2
            float rockNoise = wxFbm(vec2(p.x+p.y, vWP.y*3.0));
          #else
            float rockNoise = n2;
          #endif
          vec3 rockC = mix(vec3(0.42,0.41,0.4), vec3(0.6,0.58,0.55), rockNoise);
          rockC *= 0.85 + 0.15*sin(vWP.y*7.0 + n2*4.0);
          if (b > 4.5 && b < 5.5) rockC = mix(vec3(0.33,0.33,0.55), vec3(0.55,0.5,0.8), n2);
          if (b > 7.5) rockC = mix(vec3(0.18,0.15,0.24), vec3(0.32,0.27,0.4), n2);
          c = mix(c, rockC, rock*0.85);
          vec3 glow = vec3(0.0);
          // bosque / jardim / cidade: florzinhas e trevos
          if (b < 0.5 || (b > 6.5 && b < 7.5) || (b > 0.5 && b < 1.5)) {
            float clover = smoothstep(0.62, 0.7, wxFbm(p*0.6+3.0));
            c = mix(c, c*vec3(0.78,0.92,0.72), clover*0.6);
            float fl = step(0.985 - (b > 6.5 ? 0.02 : 0.0), wxHash(floor(p*3.0)));
            vec3 flc = mix(vec3(1.0,0.75,0.88), vec3(1.0,0.92,0.5), wxHash(floor(p*3.0)+1.7));
            float fd = length(fract(p*3.0)-0.5);
            c = mix(c, flc, fl*smoothstep(0.22, 0.12, fd)*(1.0-rock));
          }
          // ruínas: lajes rachadas com musgo
          if (b > 1.5 && b < 2.5) {
            #if ELARION_TERRAIN_DETAIL >= 2
              vec3 v = wxVoro(p*0.55);
            #else
              vec3 v = wxCell(p*0.55);
            #endif
            float slab = smoothstep(0.45, 0.6, wxFbm(p*0.08+11.0));
            vec3 stone = mix(vec3(0.55,0.53,0.48), vec3(0.7,0.68,0.6), v.z) * (0.85+0.15*n2);
            stone = mix(stone*0.55, stone, smoothstep(0.02, 0.08, v.y));
            c = mix(c, stone, slab*(1.0-rock));
            c = mix(c, c*vec3(0.75,1.0,0.7), smoothstep(0.55,0.75,n2)*0.5);
          }
          // costa: ondulações e areia molhada
          if (b > 2.5 && b < 3.5) {
            float rip = sin(p.x*1.8 + p.y*0.7 + n1*6.0)*0.5+0.5;
            c *= 0.95 + 0.07*rip;
            float wet = smoothstep(uWater+1.2, uWater+0.2, vWP.y);
            c = mix(c, c*vec3(0.72,0.7,0.68), wet*0.7);
            float sh = step(0.992, wxHash(floor(p*2.0)));
            c = mix(c, vec3(1.0,0.86,0.9), sh*smoothstep(0.25,0.1,length(fract(p*2.0)-0.5)));
          }
          // montanhas: neve fofa e brilho
          if (b > 3.5 && b < 4.5) {
            float snow = smoothstep(0.55, 0.7, wxFbm(p*0.12) + vWP.y*0.04 - slope*0.6);
            c = mix(c, vec3(0.93,0.95,0.99)*(0.95+0.05*n3), snow);
            glow += vec3(0.6,0.7,0.9)*step(0.997, wxHash(floor(p*6.0)))*snow*0.6;
          }
          // observatório: chão de cristal com constelações
          if (b > 4.5 && b < 5.5) {
            #if ELARION_TERRAIN_DETAIL >= 2
              vec3 v = wxVoro(p*0.18);
            #else
              vec3 v = wxCell(p*0.18);
            #endif
            float edge = smoothstep(0.035, 0.0, v.y) * smoothstep(0.45, 0.7, wxFbm(p*0.05+2.0));
            c = mix(c, c*1.2, smoothstep(0.4,0.9,v.z)*0.3);
            glow += uAccent * edge * (0.18 + 0.12*sin(uTime*1.5 + v.z*20.0));
            float star = step(0.993, wxHash(floor(p*5.0)));
            glow += vec3(1.0,0.95,1.0) * star * smoothstep(0.3,0.0,length(fract(p*5.0)-0.5)) * (0.6+0.4*sin(uTime*3.0+wxHash(floor(p*5.0))*30.0));
          }
          // mercado: arenito com ladrilhos coloridos
          if (b > 5.5 && b < 6.5) {
            vec2 t = floor(p*0.5);
            float tile = step(0.7, wxHash(t));
            vec3 tc = mix(vec3(0.75,0.35,0.35), vec3(0.35,0.45,0.75), wxHash(t+4.0));
            vec2 fp = fract(p*0.5);
            float frame = step(0.08, fp.x)*step(fp.x,0.92)*step(0.08,fp.y)*step(fp.y,0.92);
            c = mix(c, mix(c, tc, 0.55), tile*frame*smoothstep(0.5,0.3,n1)*(1.0-rock));
          }
          // abismo: rachaduras com luz violeta
          if (b > 7.5) {
            #if ELARION_TERRAIN_DETAIL >= 2
              vec3 v = wxVoro(p*0.4);
            #else
              vec3 v = wxCell(p*0.4);
            #endif
            float crack = smoothstep(0.05, 0.0, v.y) * smoothstep(0.35, 0.6, wxFbm(p*0.15+5.0));
            c = mix(c, c*0.5, crack);
            glow += uAccent * crack * (0.5 + 0.3*sin(uTime*2.0 + p.x*0.3));
            glow += uAccent * 0.6 * step(0.996, wxHash(floor(p*4.0)));
          }
          // praça central calçada (todas as regiões)
          float pr = length(p);
          if (pr < uPlaza + 1.5) {
            #if ELARION_TERRAIN_DETAIL >= 2
              vec3 v = wxVoro(p*1.9);
            #else
              vec3 v = wxCell(p*1.9);
            #endif
            vec3 cob = uPave * (0.82 + 0.25*v.z) * (0.9+0.1*n3);
            cob = mix(cob*0.55, cob, smoothstep(0.03, 0.09, v.y));
            float ring = smoothstep(0.35, 0.0, abs(pr - uPlaza*0.55)) * 0.25;
            cob = mix(cob, uPave*1.25, ring);
            float k = smoothstep(uPlaza + 1.5, uPlaza - 0.5, pr + n2*1.5);
            c = mix(c, cob, k);
          }
          diffuseColor.rgb = c;
          totalEmissiveRadiance += glow;
        }`);
    };
    return m;
  };

  // ============================================================ utilidades de malha
  const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, flatShading: true, roughness: 0.8 }, o));
  const glowMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
  WX.radial = null; // definido por world3d
  // vórtice de portal (Domínio, Fenda): espirais girando com brilho no centro
  WX.vortexMat = (c1, c2) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { t: { value: 0 }, c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float t; uniform vec3 c1; uniform vec3 c2; varying vec2 vUv;
      void main(){ vec2 p = vUv * 2.0 - 1.0; float r = length(p); float a = atan(p.y, p.x);
        float s1 = sin(a * 3.0 + r * 11.0 - t * 3.2) * 0.5 + 0.5, s2 = sin(a * 5.0 - r * 16.0 + t * 2.1) * 0.5 + 0.5;
        vec3 col = mix(c1 * 0.55, c2, s1 * 0.65 + s2 * 0.35);
        col = mix(col, vec3(0.08, 0.02, 0.18), smoothstep(0.15, 0.75, r) * 0.35 * (1.0 - s1));
        col += vec3(1.0, 0.95, 1.0) * pow(max(0.0, 1.0 - r * 1.6), 3.0) * 1.2;
        col += c2 * smoothstep(0.82, 0.98, r) * 0.9;
        float al = smoothstep(1.0, 0.9, r) * (0.82 + 0.18 * s2);
        gl_FragColor = vec4(col, al); }`,
  });

  // junta as malhas estáticas de um grupo por material (menos chamadas de desenho no celular)
  WX.mergeStatic = (root, skip = new Set()) => {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map(), victims = [];
    root.traverse((o) => {
      if (!o.isMesh || skip.has(o) || o.material.transparent) return;
      for (let q = o.parent; q && q !== root; q = q.parent) if (skip.has(q)) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!geo.attributes.normal) geo.computeVertexNormals();
      (buckets.get(o.material) || buckets.set(o.material, []).get(o.material)).push(geo);
      victims.push(o);
    });
    victims.forEach((o) => o.parent.remove(o));
    for (const [mat, geos] of buckets) {
      const n = geos.reduce((a, g) => a + g.attributes.position.count, 0);
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      let off = 0;
      for (const g of geos) { pos.set(g.attributes.position.array, off * 3); nor.set(g.attributes.normal.array, off * 3); off += g.attributes.position.count; g.dispose(); }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      bg.computeBoundingSphere();
      root.add(mesh(bg, mat));
    }
    return root;
  };

  // ============================================================ baú
  // Corpo oco (dá para ver o tesouro ao abrir), tampa abaulada com dobradiça na traseira,
  // ferragens, fechadura e um visual próprio para cada raridade.
  WX.chest = (tier) => {
    const T = {
      comum: { wood: '#8a5a2e', wood2: '#5e3a1c', metal: '#8f969e', trim: '#6d737a', gem: null, glow: '#fff2c8', velvet: '#5a1f1f', coin: '#e8b84a' },
      requintado: { wood: '#4f6f98', wood2: '#2f4566', metal: '#e4ebf2', trim: '#b9c6d4', gem: '#7fe8ff', glow: '#bfe9ff', velvet: '#1d2f5a', coin: '#e8c45a' },
      precioso: { wood: '#6e3c92', wood2: '#45215f', metal: '#ffd36b', trim: '#d9a83e', gem: '#ff8fd0', glow: '#e9c8ff', velvet: '#3a0f45', coin: '#ffd86b' },
      luxuoso: { wood: '#e0ae46', wood2: '#a8761f', metal: '#fff6d6', trim: '#ffe08a', gem: '#7fe8ff', glow: '#ffd98a', velvet: '#7a1530', coin: '#ffe27a' },
    }[tier];
    const g = new THREE.Group();
    const W = 1.15, D = 0.78, Hb = 0.52, t = 0.07, R = D / 2, LS = 0.62; // LS achata a tampa
    // um leve brilho próprio deixa o baú visível mesmo na sombra e à noite
    const timber = { roughness: .78, emissive: '#1a1713', emissiveIntensity: .14, side: THREE.DoubleSide };
    const wood = std(T.wood, timber), wood2 = std(T.wood2, timber);
    const hardware = { metalness: .55, roughness: .38, flatShading: false, emissive: '#322e23', emissiveIntensity: .1 };
    const metal = std(T.metal, hardware), trim = std(T.trim, hardware);
    const velvet = std(T.velvet, timber), lidWood = std(T.wood, timber);
    // ---- corpo: fundo + 4 paredes
    g.add(mesh(new THREE.BoxGeometry(W, 0.08, D), wood2, 0, 0.04, 0));
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(W, Hb, t), wood, 0, Hb / 2, s * (D / 2 - t / 2)));
      g.add(mesh(new THREE.BoxGeometry(t, Hb, D - 2 * t), wood, s * (W / 2 - t / 2), Hb / 2, 0));
    }
    // tábuas (frisos escuros na frente, atrás e nos lados)
    for (const x of [-0.29, 0, 0.29]) for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.018, Hb * 0.9, 0.012), wood2, x, Hb / 2, s * (D / 2 + 0.004)));
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.012, Hb * 0.9, 0.018), wood2, s * (W / 2 + 0.004), Hb / 2, 0));
    // forro de veludo e o tesouro lá dentro
    const floor = mesh(new THREE.BoxGeometry(W - 2 * t, 0.02, D - 2 * t), velvet, 0, 0.09, 0);
    g.add(floor);
    const loot = new THREE.Group();
    const coinM = std(T.coin, { metalness: 0.9, roughness: 0.25, emissive: T.coin, emissiveIntensity: 0.25 });
    const pile = mesh(new THREE.SphereGeometry(0.36, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), coinM, 0, 0.08, 0);
    pile.scale.set(1.25, 0.62, 0.78); loot.add(pile);
    const coinG = new THREE.CylinderGeometry(0.055, 0.055, 0.016, 10);
    const rng = U.seeded(tier.length * 31 + 7);
    for (let i = 0; i < 16; i++) {
      const a = rng() * Math.PI * 2, r = 0.1 + rng() * 0.3;
      const c = mesh(coinG, coinM, Math.cos(a) * r * 1.2, 0.17 + rng() * 0.12, Math.sin(a) * r * 0.55);
      c.rotation.set(rng() * 1.2 - 0.6, 0, rng() * 1.2 - 0.6); loot.add(c);
    }
    if (T.gem) for (let i = 0; i < 3; i++) { const gm = mesh(new THREE.OctahedronGeometry(0.06 + i * 0.012, 0), glowMat(i === 1 ? T.gem : '#ffffff'), -0.25 + i * 0.25, 0.27 + (i % 2) * 0.04, -0.06 + i * 0.05); gm.scale.y = 1.4; loot.add(gm); }
    loot.position.y = 0.04;
    g.add(loot);
    // brilho interno (aparece ao abrir)
    const inner = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.95, D * 0.9), new THREE.MeshBasicMaterial({ color: T.glow, map: WX.radial ? WX.radial(T.glow) : null, toneMapped: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    inner.rotation.x = -Math.PI / 2; inner.position.y = Hb - 0.04;
    g.add(inner);
    // ---- ferragens do corpo: cantoneiras, aro de cima, base e alças
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.11, Hb + 0.03, 0.11), metal, sx * (W / 2 - 0.035), (Hb + 0.03) / 2, sz * (D / 2 - 0.035)));
    for (const s of [-1, 1]) {
      g.add(mesh(new THREE.BoxGeometry(W + 0.02, 0.045, 0.03), trim, 0, Hb - 0.02, s * (D / 2 + 0.008)));
      g.add(mesh(new THREE.BoxGeometry(0.03, 0.045, D + 0.02), trim, s * (W / 2 + 0.008), Hb - 0.02, 0));
      if (tier !== 'luxuoso') {
        const handle = mesh(new THREE.TorusGeometry(0.085, 0.018, 5, 12, Math.PI), metal, s * (W / 2 + 0.03), Hb * 0.58, 0);
        handle.rotation.set(Math.PI, Math.PI / 2, 0); g.add(handle);
        g.add(mesh(new THREE.BoxGeometry(0.03, 0.06, 0.24), metal, s * (W / 2 + 0.012), Hb * 0.58, 0));
      }
    }
    g.add(mesh(new THREE.BoxGeometry(W + 0.05, 0.07, D + 0.05), metal, 0, 0.035, 0));
    // espelho da fechadura no corpo
    g.add(mesh(new THREE.BoxGeometry(0.2, 0.17, 0.025), metal, 0, Hb - 0.13, D / 2 + 0.014));
    g.add(mesh(new THREE.BoxGeometry(0.035, 0.07, 0.01), std('#141414', timber), 0, Hb - 0.15, D / 2 + 0.03));
    // ---- tampa: pivô na quina de trás, abre girando em X
    const lid = new THREE.Group();
    lid.position.set(0, Hb, -D / 2);
    const dome = new THREE.CylinderGeometry(R, R, W, 16, 1, false, 0, Math.PI);
    dome.rotateZ(Math.PI / 2); dome.scale(1, LS, 1);
    lid.add(mesh(dome, lidWood, 0, 0, D / 2));
    lid.add(mesh(new THREE.BoxGeometry(W - 0.01, 0.035, D - 0.01), wood2, 0, 0.018, D / 2)); // forro da tampa
    for (const x of [-(W / 2 - 0.05), -(W / 2 - 0.3), W / 2 - 0.3, W / 2 - 0.05]) {
      const band = new THREE.TorusGeometry(R + 0.012, 0.028, 5, 16, Math.PI);
      band.rotateY(Math.PI / 2); band.scale(1, LS, 1);
      lid.add(mesh(band, Math.abs(x) > W / 2 - 0.1 ? metal : trim, x, 0, D / 2));
    }
    lid.add(mesh(new THREE.BoxGeometry(W + 0.03, 0.05, 0.035), metal, 0, 0.025, D + 0.005)); // lábio da frente
    // trinco que desce sobre a fechadura
    const hasp = mesh(new THREE.BoxGeometry(0.15, 0.2, 0.03), metal, 0, -0.06, D + 0.03);
    lid.add(hasp);
    if (T.gem) {
      const gm = mesh(new THREE.OctahedronGeometry(0.06, 0), glowMat(T.gem), 0, -0.05, D + 0.055); gm.scale.set(1, 1.3, 0.6); lid.add(gm);
    } else lid.add(mesh(new THREE.TorusGeometry(0.04, 0.012, 4, 10), metal, 0, -0.1, D + 0.05));
    // enfeite no topo da tampa
    if (tier !== 'comum') {
      const top = mesh(new THREE.OctahedronGeometry(tier === 'luxuoso' ? 0.12 : 0.08, 0), tier === 'requintado' ? metal : glowMat(T.gem), 0, R * LS + 0.06, D / 2);
      top.scale.y = 1.5; lid.add(top);
      lid.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.04, 8), metal, 0, R * LS + 0.005, D / 2));
    }
    g.add(lid);
    // ---- baú luxuoso: asas douradas de penas nas laterais
    if (tier === 'luxuoso') {
      const wingM = std('#ffe7a0', { metalness: 0.35, roughness: 0.45, emissive: '#a87a18', emissiveIntensity: 0.4, side: THREE.DoubleSide, flatShading: false });
      for (const s of [-1, 1]) {
        const wing = new THREE.Group();
        for (let f = 0; f < 5; f++) {
          const sh = new THREE.Shape();
          const len = 0.52 - f * 0.07, wd = 0.13;
          sh.moveTo(0, -wd * 0.3); sh.quadraticCurveTo(len * 0.45, wd * 1.1, len, wd * 0.15); sh.quadraticCurveTo(len * 0.6, -wd * 0.55, 0, -wd * 0.3);
          const fm = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 1, curveSegments: 6 }), wingM, 0, 0, -f * 0.012);
          fm.rotation.z = 0.95 - f * 0.26;
          wing.add(fm);
        }
        // espelhada no lado esquerdo (material dupla face) e varrida para trás
        wing.position.set(s * (W / 2 + 0.03), Hb * 0.62, -0.05);
        wing.scale.x = s;
        wing.rotation.y = s * 0.45;
        g.add(wing);
      }
    }
    // Body and hinged lid stay independent; vertex colours keep each tier's artwork.
    WX.mergeStatic(lid); WX.mergeStatic(loot); WX.mergeStatic(g, new Set([lid, loot, inner]));
    if (E.ScenePerf) { E.ScenePerf.batch(lid); E.ScenePerf.batch(loot); E.ScenePerf.batch(g, { exclude: [lid, loot, inner] }); }
    loot.visible = false; inner.visible = false; // Hidden contents do not need a GPU submission.
    Object.assign(g.userData, { lid, inner, loot, tier, glowColor: T.glow });
    return g;
  };
  // anima a abertura: tampa gira, luz sobe, faíscas
  WX.openChest = (world, obj) => new Promise((res) => {
    const { lid, inner, loot } = obj.group.userData;
    if (loot) loot.visible = true; inner.visible = true;
    // o herói dá um passo para o lado (em relação à câmera) e vira para o baú, para que a abertura fique visível
    if (world.hero && world.cam) {
      const gp = obj.group.position, rx = Math.cos(world.cam.yaw), rz = -Math.sin(world.cam.yaw);
      const side = ((world.hero.x - gp.x) * rx + (world.hero.z - gp.z) * rz) >= 0 ? 1 : -1;
      const nx = gp.x + rx * 1.7 * side, nz = gp.z + rz * 1.7 * side;
      if (surface(world, nx, nz) > world.waterLevel - 0.3) { world.hero.x = nx; world.hero.z = nz; }
      world.hero.dir = side > 0 ? -1 : 1;
    }
    const t0 = performance.now();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: obj.group.userData.glowColor, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(0, 2.4, 0);
    obj.group.add(beam);
    const sparks = [];
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 900);
      const e = U.ease.outBack(Math.min(1, k * 1.4));
      lid.rotation.x = -e * 1.9;
      inner.material.opacity = Math.min(1, k * 2) * (1 - Math.max(0, k - 0.75) * 1.6);
      if (loot) { const lk = U.ease.outBack(U.clamp((k - 0.15) / 0.6, 0, 1)); loot.scale.setScalar(0.75 + lk * 0.25); loot.position.y = 0.04 + Math.sin(U.clamp((k - 0.15) / 0.6, 0, 1) * Math.PI) * 0.12; }
      beam.material.opacity = Math.sin(k * Math.PI) * 0.55;
      beam.scale.y = 0.4 + k;
      if (k < 0.8 && Math.random() < 0.7) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: WX.radial(obj.group.userData.glowColor), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        s.scale.setScalar(0.25 + Math.random() * 0.2);
        s.position.set((Math.random() - 0.5) * 0.8, 0.6, (Math.random() - 0.5) * 0.5);
        s.v = new THREE.Vector3((Math.random() - 0.5) * 1.2, 2.5 + Math.random() * 2, (Math.random() - 0.5) * 1.2);
        obj.group.add(s); sparks.push(s);
      }
      for (const s of sparks) { s.position.addScaledVector(s.v, 0.016); s.v.y -= 0.06; s.material.opacity *= 0.97; }
      if (k < 1) requestAnimationFrame(step);
      else {
        obj.group.remove(beam); sparks.forEach((s) => obj.group.remove(s)); res();
        // o herói "recolhe" o tesouro: as moedas encolhem e o brilho apaga
        const t1 = performance.now() + 900;
        const take = () => {
          const q = U.clamp((performance.now() - t1) / 500, 0, 1);
          if (loot) loot.scale.setScalar(Math.max(0.001, 1 - U.ease.inOutCubic(q)));
          inner.material.opacity = 0.6 * (1 - q);
          if (q < 1) requestAnimationFrame(take); else { if (loot) loot.visible = false; inner.visible = false; }
        };
        requestAnimationFrame(take);
      }
    };
    step();
  });

  // ============================================================ praça central
  WX.plaza = (world) => {
    const sc = world.scene, B = world.B, biome = world.reg.biome, rng = U.seeded(world.reg.seed + 77);
    const g = new THREE.Group();
    const hAt = (x, z) => surface(world, x, z);
    const stoneM = std(B.pave ? E.SP.shade(B.pave, -0.15) : '#a8a090');
    const woodM = std('#7a5232');
    // fogueira com luz tremeluzente
    const fx = 4.5, fz = 3.5, fy = hAt(fx, fz);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(mesh(new THREE.DodecahedronGeometry(0.22, 0), stoneM, fx + Math.cos(a) * 0.6, fy + 0.1, fz + Math.sin(a) * 0.6)); }
    for (let i = 0; i < 3; i++) { const l = mesh(new THREE.CylinderGeometry(0.07, 0.08, 1, 5), woodM, fx, fy + 0.2, fz); l.rotation.set(Math.PI / 2, i, 0.4); g.add(l); }
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.8, 6), glowMat('#ffb347'));
    flame.position.set(fx, fy + 0.55, fz);
    const flame2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 6), glowMat('#fff2a8'));
    flame2.position.set(fx, fy + 0.45, fz);
    g.add(flame, flame2);
    const fire = new THREE.PointLight('#ffa040', 2.2, 12, 1.6);
    fire.position.set(fx, fy + 1.2, fz);
    g.add(fire);
    world.colliders.push({ x: fx, z: fz, r: 0.9 });
    world.fire = { light: fire, flame, flame2, pos: new THREE.Vector3(fx, fy + 1, fz) };
    // bancos de toras
    for (const [a, r] of [[0.3, 2.0], [2.4, 2.1], [4.4, 2.0]]) {
      const bx = fx + Math.cos(a) * r, bz = fz + Math.sin(a) * r;
      const log = mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.4, 7), woodM, bx, hAt(bx, bz) + 0.22, bz);
      log.rotation.set(0, -a, Math.PI / 2);
      g.add(log);
    }
    // placa de direção
    const sx = 3, sz = -6.5, sy = hAt(sx, sz);
    g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.4, 6), woodM, sx, sy + 1.2, sz));
    const names = world.reg.neighbors.slice(0, 3);
    names.forEach((n, i) => {
      const board = mesh(new THREE.BoxGeometry(1.3, 0.28, 0.06), std('#c8a06a'), sx + (i % 2 ? -0.5 : 0.5), sy + 2.0 - i * 0.38, sz);
      board.rotation.y = i * 0.9;
      g.add(board);
    });
    world.colliders.push({ x: sx, z: sz, r: 0.3 });
    // poço
    const wx = -7.5, wz = -4.5, wy = hAt(wx, wz);
    g.add(mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.8, 12, 1, true), stoneM, wx, wy + 0.4, wz));
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), new THREE.MeshStandardMaterial({ color: B.water, roughness: 0.1 }));
    water.rotation.x = -Math.PI / 2; water.position.set(wx, wy + 0.5, wz); g.add(water);
    for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), woodM, wx + s * 0.9, wy + 1.2, wz));
    const roof = mesh(new THREE.ConeGeometry(1.4, 0.8, 4), std(B.roof || '#9a4a3a'), wx, wy + 2.4, wz); roof.rotation.y = Math.PI / 4; g.add(roof);
    world.colliders.push({ x: wx, z: wz, r: 1.2 });
    // bandeirolas entre postes
    const posts = [[-10, 9], [10, 10], [11, -9], [-11, -8]];
    const flagCols = ['#e85d75', '#ffd36b', '#5aa0ff', '#7cd17c', '#c77dff'];
    posts.forEach(([x, z]) => { g.add(mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 6), woodM, x, hAt(x, z) + 1.6, z)); world.colliders.push({ x, z, r: 0.25 }); });
    posts.forEach(([x, z], i) => {
      const y = hAt(x, z);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), new THREE.MeshStandardMaterial({ color: flagCols[i % flagCols.length], side: THREE.DoubleSide }));
      fl.position.set(x + 0.48, y + 2.5, z);
      g.add(fl);
      world.flags = world.flags || [];
      world.flags.push(fl);
      g.add(mesh(new THREE.SphereGeometry(0.12, 6, 4), std('#d4af37', { metalness: 0.7 }), x, y + 3.3, z));
    });
    // barracas/caixotes (cidade, mercado) ou vasos de flores
    if (biome === 'city' || biome === 'market') {
      for (const [x, z, a] of [[-4, 8, 0.4], [7.5, -1, -1.2], [-9, 2, 1.6]]) {
        const y = hAt(x, z);
        const st = new THREE.Group();
        st.add(mesh(new THREE.BoxGeometry(1.8, 0.8, 0.9), woodM, 0, 0.4, 0));
        for (const sx2 of [-0.85, 0.85]) st.add(mesh(new THREE.BoxGeometry(0.08, 2, 0.08), woodM, sx2, 1, 0.4));
        const awn = mesh(new THREE.BoxGeometry(2, 0.06, 1.3), std(U.pick(['#e85d75', '#5aa0ff', '#ffd36b', '#7cd17c'])), 0, 2, 0.15);
        awn.rotation.x = 0.2; st.add(awn);
        for (let k = 0; k < 4; k++) st.add(mesh(new THREE.SphereGeometry(0.12, 6, 4), std(U.pick(['#ff7a5a', '#ffd36b', '#9fd46a', '#c77dff'])), -0.6 + k * 0.4, 0.9, 0));
        st.position.set(x, y, z); st.rotation.y = a;
        g.add(st);
        world.colliders.push({ x, z, r: 1.1 });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + 0.3, r = world.plaza + 0.4, x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (world.roadDist(x, z) < 2) continue;
        const y = hAt(x, z);
        g.add(mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.5, 8), std('#b86a4a'), x, y + 0.25, z));
        for (let k = 0; k < 3; k++) g.add(mesh(new THREE.IcosahedronGeometry(0.16, 0), std(U.pick(['#ff9ad5', '#ffd36b', '#ffffff', '#c7a6ff'])), x + (rng() - 0.5) * 0.4, y + 0.62, z + (rng() - 0.5) * 0.4));
      }
    }
    sc.add(g);
    if (E.ScenePerf) E.ScenePerf.batch(g, { exclude: [flame, flame2, ...(world.flags || [])] });
  };

  // ============================================================ marcos de região (um grande por mapa)

  // ============================================================ vida: posto comercial, pontos de pesca e veios de minério
  WX.tradePost = (world, x = -1.5, z = -9.5) => {
    world.tradePos = { x, z };
    const g = new THREE.Group(), y = surface(world, x, z);
    const woodM = std('#7a5232'), wood2 = std('#a8743c');
    const bed = mesh(new THREE.BoxGeometry(2.6, 0.35, 1.5), wood2, 0, 0.75, 0);
    g.add(bed);
    for (const [wx, wz] of [[-0.9, 0.8], [0.9, 0.8], [-0.9, -0.8], [0.9, -0.8]]) { const wh = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 12), woodM, wx, 0.42, wz); wh.rotation.x = Math.PI / 2; g.add(wh); }
    const crates = ['#c8a06a', '#a8743c', '#8a5a32'];
    for (let i = 0; i < 4; i++) g.add(mesh(new THREE.BoxGeometry(0.55, 0.5, 0.55), std(crates[i % 3]), -0.85 + i * 0.55, 1.18, (i % 2 ? 0.3 : -0.3)));
    for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 8), std(['#7a3b3b', '#3f7a6e', '#d4af37'][i]), 0.9, 1.2, -0.45 + i * 0.45));
    // toldo listrado
    for (let i = 0; i < 5; i++) { const st = mesh(new THREE.BoxGeometry(0.56, 0.05, 1.9), std(i % 2 ? '#fff2d6' : '#2f8f7a'), -1.12 + i * 0.56, 2.45, 0); st.rotation.x = 0.12; g.add(st); }
    for (const [px, pz] of [[-1.25, 0.9], [1.25, 0.9], [-1.25, -0.8], [1.25, -0.8]]) g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 5), woodM, px, 1.6, pz));
    // placa com balança
    const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x2 = c.getContext('2d');
    x2.fillStyle = '#3b2410'; x2.fillRect(0, 0, 256, 64); x2.strokeStyle = '#d4af37'; x2.lineWidth = 4; x2.strokeRect(4, 4, 248, 56);
    x2.fillStyle = '#ffe9a8'; x2.font = 'bold 30px serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText('Posto Comercial', 150, 34, 194);
    const signTexture = new THREE.CanvasTexture(c);
    E.Icons.paint(x2, 'scales', 10, 10, 44, () => { signTexture.needsUpdate = true; });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: signTexture }));
    sign.position.set(0, 2.95, 0.95); g.add(E.Shopfronts ? E.Shopfronts.readable(sign) : sign);
    g.position.set(x, y, z); g.rotation.y = Math.atan2(-x, -z); g.userData.groundSupport = { radius: 1.6 };
    world.scene.add(g);
    if (E.ScenePerf) E.ScenePerf.batch(g);
    world.colliders.push({ x, z, r: 1.5 });
    world.interactables.push({ kind: 'trade', x, z, r: 3, label: 'Posto Comercial (mercadorias)', icon: '⚖' });
  };

  WX.fishSpots = (world, n = 4) => {
    const rng = U.seeded(world.reg.seed + 4242), wl = world.waterLevel, spots = [];
    for (let i = 0; i < 1200 && spots.length < n; i++) {
      const a = rng() * Math.PI * 2, r = 14 + rng() * (world.cave ? 60 : world.bound - 20);
      const x = Math.cos(a) * r, z = Math.sin(a) * r, h = surface(world, x, z);
      if (h < wl + 0.15 || h > wl + 0.9) continue;
      // água logo à frente
      let wx = null, wz = null;
      for (let k = 0; k < 12 && wx === null; k++) { const b = k / 12 * Math.PI * 2, tx = x + Math.cos(b) * 4, tz = z + Math.sin(b) * 4; if (surface(world, tx, tz) < wl - 0.35) { wx = tx; wz = tz; } }
      if (wx === null || spots.some((s) => Math.hypot(s.x - x, s.z - z) < 18)) continue;
      spots.push({ x, z, wx, wz, i: spots.length });
    }
    world.fishSpots = spots;
    for (const s of spots) {
      const key = `${world.id}:${s.i}`; const dep = (E.state.world.fishDep || {})[key];
      s.left = dep && Date.now() - dep < 4 * 60e3 ? 0 : 4;
      // círculos na água e uma estaca com lanterna
      const rings = [];
      for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.set(s.wx, wl + 0.06, s.wz); world.scene.add(m); rings.push(m); }
      const post = mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.6, 6), std('#7a5232'), s.x, surface(world, s.x, s.z) + 0.8, s.z);
      const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat('#9fe3ff')); lamp.position.set(s.x, surface(world, s.x, s.z) + 1.7, s.z);
      world.scene.add(post, lamp);
      s.rings = rings; s.post = [post, lamp];
      if (!world.cave && s.i % 2 === 0) WX.fishBench(world, s);
      s.ia = { kind: 'fish', spot: s, x: s.x, z: s.z, r: 2.8, label: s.bench ? 'Sentar e pescar' : 'Pescar', icon: '🎣' };
      world.interactables.push(s.ia);
    }
  };
  // Banco de madeira ao lado da estaca, de frente para a água: quem pesca ali pesca sentado.
  WX.fishBench = (world, s) => {
    const wl = world.waterLevel, dx = s.wx - s.x, dz = s.wz - s.z, l = Math.hypot(dx, dz) || 1, ux = dx / l, uz = dz / l;
    const bx = s.x - uz * 1.5, bz = s.z + ux * 1.5, rot = Math.atan2(ux, uz);
    const feet = [[-0.6, -0.12], [0.6, -0.12], [-0.6, 0.18], [0.6, 0.18]].map(([a, b]) => surface(world, bx + Math.cos(rot) * a + Math.sin(rot) * b, bz - Math.sin(rot) * a + Math.cos(rot) * b));
    const lo = Math.min(...feet), hi = Math.max(...feet);
    if (lo < wl + 0.1 || hi - lo > 0.35) return;
    const g = new THREE.Group(), wood = std('#8a5e3a'), dark = std('#5e3f27');
    const box = (m, x, y, z, sx, sy, sz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
    for (const k of [-0.08, 0.08]) box(wood, 0, 0.46, k + 0.03, 1.34, 0.06, 0.15);
    for (const k of [-1, 1]) { box(dark, k * 0.56, 0.21 - (hi - lo) / 2, 0.03, 0.08, 0.48 + (hi - lo), 0.34); box(dark, k * 0.56, 0.7, -0.15, 0.07, 0.5, 0.07); }
    box(wood, 0, 0.78, -0.16, 1.3, 0.12, 0.05); box(wood, 0, 0.62, -0.16, 1.3, 0.08, 0.05);
    g.position.set(bx, hi, bz); g.rotation.y = rot; g.name = 'fishing-bench';
    world.scene.add(g);
    s.bench = { x: bx, z: bz, y: hi, rot, seat: 0.49, group: g };
    (world.benches || (world.benches = [])).push(s.bench);
  };
  WX.animFishSpots = (world, t) => {
    for (const s of world.fishSpots || []) s.rings.forEach((m, k) => { const ph = (t * 0.6 + k / 3) % 1; m.scale.setScalar(0.6 + ph * 2.2); m.material.opacity = (s.left > 0 ? 0.55 : 0.12) * (1 - ph); });
  };

  WX.oreNodes = (world, n = 5, ores) => {
    const pool = ores || E.L.ORE_BY_BIOME[world.reg.biome] || ['ferro'];
    const rng = U.seeded(world.reg.seed + 7331), nodes = [];
    const cave = world.cave, R0 = cave ? 7 : 20, R1 = cave ? world.bound - 3 : 74, gap = cave ? 4.2 : 14;
    for (let i = 0; i < 600 && nodes.length < n; i++) {
      const a = rng() * Math.PI * 2, r = R0 + rng() * (R1 - R0), x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (surface(world, x, z) < world.waterLevel + 0.5 || world.slope(x, z) > 0.8) continue;
      if (nodes.some((o) => Math.hypot(o.x - x, o.z - z) < gap)) continue;
      // nas grutas, os veios mais valiosos ficam mais ao fundo
      const deep = cave ? (r - R0) / (R1 - R0) : 0;
      const k = cave ? Math.min(pool.length - 1, Math.floor(Math.pow(rng(), 1.3 - deep) * pool.length)) : nodes.length % pool.length;
      nodes.push({ x, z, i: nodes.length, ore: pool[k] });
    }
    world.oreNodes = nodes;
    for (const o of nodes) WX.addOre(world, o);
  };
  WX.addOre = (world, o) => {
    const key = `${world.id}:${o.i}`, t = (E.state.world.mined || {})[key];
    if (t && Date.now() - t < 6 * 60e3) return;
    const g = new THREE.Group(), y = surface(world, o.x, o.z), col = E.L.ORES[o.ore].color;
    const rockM = std('#6a6470'), crM = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, flatShading: true, roughness: 0.3, metalness: 0.2 });
    g.add(mesh(new THREE.DodecahedronGeometry(1.0, 0), rockM, 0, 0.5, 0), mesh(new THREE.DodecahedronGeometry(0.65, 0), rockM, 0.8, 0.3, 0.4));
    for (let k = 0; k < 6; k++) { const c = mesh(new THREE.OctahedronGeometry(0.22 + (k % 3) * 0.08, 0), crM, Math.cos(k) * 0.6, 0.9 + (k % 2) * 0.3, Math.sin(k) * 0.5); c.scale.y = 1.8; c.rotation.z = (k - 3) * 0.2; g.add(c); }
    g.position.set(o.x, y, o.z); g.rotation.y = o.i; g.userData.groundSupport = { radius: 1.15, localBase: -.35 };
    world.scene.add(g);
    world.colliders.push({ x: o.x, z: o.z, r: 1.1 });
    o.obj = { group: g };
    const pk = E.L.PICKAXES[E.L.ORES[o.ore].pick || 1];
    o.ia = { kind: 'ore', node: o, x: o.x, z: o.z, r: 2.8, label: `Minerar ${E.L.ORES[o.ore].name} (${pk.name})`, icon: '⛏', obj: o.obj };
    world.interactables.push(o.ia);
  };

  // ============================================================ covil do chefe regional
  WX.lairBase = (world, p) => {
    const g = new THREE.Group(), h = surface(world, p.x, p.z);
    const key = E.M.LAIR[world.id], def = E.M.MONSTERS[key];
    const B = world.B;
    const stoneM = std(B.pave ? E.SP.shade(B.pave, -0.25) : '#8a8478');
    const darkM = std(E.SP.shade(B.pave || '#8a8478', -0.5));
    const plat = mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.5, 12), stoneM, 0, 0, 0);
    const plat2 = mesh(new THREE.CylinderGeometry(4.6, 5.2, 0.16, 12), darkM, 0, 0.3, 0);
    g.add(plat, plat2);
    // pilares partidos em círculo com braseiros
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.3, r = 6.6, hp = 2.4 + (i % 3) * 1.1;
      const pil = mesh(new THREE.CylinderGeometry(0.45, 0.55, hp, 6), stoneM, Math.cos(a) * r, hp / 2, Math.sin(a) * r);
      g.add(pil);
      if (i % 2 === 0) {
        const bowl = mesh(new THREE.CylinderGeometry(0.5, 0.25, 0.35, 8), darkM, Math.cos(a) * r, hp + 0.15, Math.sin(a) * r);
        const fl = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 6), glowMat(def.bossColor || '#ff6a3c'));
        fl.position.set(Math.cos(a) * r, hp + 0.7, Math.sin(a) * r);
        g.add(bowl, fl);
      }
    }
    // runas no chão
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'); x.translate(128, 128); x.strokeStyle = def.bossColor || '#ff5d79'; x.lineWidth = 5; x.shadowColor = x.strokeStyle; x.shadowBlur = 12;
    x.beginPath(); x.arc(0, 0, 112, 0, 7); x.stroke(); x.lineWidth = 3;
    x.beginPath(); for (let i = 0; i <= 5; i++) { const a = (i * 2 / 5) * Math.PI * 2 - Math.PI / 2; i ? x.lineTo(Math.cos(a) * 108, Math.sin(a) * 108) : x.moveTo(Math.cos(a) * 108, Math.sin(a) * 108); } x.stroke();
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8 }));
    rune.rotation.x = -Math.PI / 2; rune.position.y = 0.4;
    g.add(rune);
    // ossos e caveiras
    for (let i = 0; i < 7; i++) { const a = Math.random() * 6.28, r = 2 + Math.random() * 3; const b = mesh(new THREE.CapsuleGeometry(0.06, 0.5, 2, 4), std('#e8e2d0'), Math.cos(a) * r, 0.42, Math.sin(a) * r); b.rotation.set(Math.PI / 2, 0, Math.random() * 6); g.add(b); }
    g.position.set(p.x, h - .25, p.z); g.userData.groundSupport = { radius: 6.8, localBase: -.25, floor: .38 };
    world.scene.add(g);
    world.lairGroup = g;
    if (E.ScenePerf) E.ScenePerf.batch(g);
  };

  WX.landmark = (world, p) => {
    const biome = world.reg.biome, B = world.B, y = surface(world, p.x, p.z);
    const g = new THREE.Group();
    const anim = [];
    let name = '', radius = 3;
    if (biome === 'forest') {
      name = 'Árvore das Lanternas';
      const bark = std('#6a4a32');
      g.add(mesh(new THREE.CylinderGeometry(1.2, 2.2, 9, 9), bark, 0, 4.5, 0));
      for (let i = 0; i < 5; i++) { const r = mesh(new THREE.CylinderGeometry(0.3, 0.6, 3.5, 6), bark, Math.cos(i * 1.26) * 2, 0.6, Math.sin(i * 1.26) * 2); r.rotation.set(Math.sin(i * 1.26) * 0.9, 0, -Math.cos(i * 1.26) * 0.9); g.add(r); }
      const leafC = [B.ground[1], B.ground[2], '#3f7a4a'];
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; g.add(mesh(new THREE.IcosahedronGeometry(3 + (i % 3) * 0.6, 0), std(leafC[i % 3]), Math.cos(a) * 3.2, 10 + (i % 2) * 1.5, Math.sin(a) * 3.2)); }
      g.add(mesh(new THREE.IcosahedronGeometry(4, 0), std(leafC[0]), 0, 12.5, 0));
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * Math.PI * 2, r = 4 + (i % 3);
        const ly = 7.5 + (i % 4) * 0.6;
        const lt = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), glowMat('#8fe8ff'));
        lt.position.set(Math.cos(a) * r, ly, Math.sin(a) * r);
        g.add(lt);
        anim.push((t) => { lt.position.y = ly + Math.sin(t * 1.5 + i) * 0.15; });
        world.addGlow(p.x + Math.cos(a) * r, y + ly, p.z + Math.sin(a) * r, '#8fe8ff', 2.4);
      }
      radius = 2.4;
    } else if (biome === 'city') {
      name = 'Torre do Sino de Lunária';
      const st = std('#d8d2c4'), roof = std('#3a62a8');
      g.add(mesh(new THREE.BoxGeometry(4, 12, 4), st, 0, 6, 0));
      g.add(mesh(new THREE.BoxGeometry(4.6, 0.5, 4.6), std('#b8b0a0'), 0, 12, 0));
      for (const s of [-1, 1]) for (const t of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(0.5, 3, 0.5), st, s * 1.8, 13.7, t * 1.8));
      const r = mesh(new THREE.ConeGeometry(3.4, 4, 4), roof, 0, 17, 0); r.rotation.y = Math.PI / 4; g.add(r);
      const bell = mesh(new THREE.CylinderGeometry(0.4, 1, 1.4, 12), std('#d4af37', { metalness: 0.8, roughness: 0.3, flatShading: false }), 0, 13.4, 0);
      g.add(bell);
      anim.push((t) => { bell.rotation.z = Math.sin(t * 1.2) * 0.25; });
      for (let k = 0; k < 4; k++) g.add(mesh(new THREE.BoxGeometry(0.7, 1.2, 0.1), glowMat('#ffe9a8'), Math.cos(k * 1.57) * 2.02 * (k % 2 ? 0 : 1), 8, Math.sin(k * 1.57) * 2.02 + (k % 2 ? 0 : 0)));
      radius = 3;
    } else if (biome === 'ruins') {
      name = 'Cabeça do Deus Caído';
      const st = std('#a8a294');
      const head = mesh(new THREE.IcosahedronGeometry(4, 1), st, 0, 2.5, 0); head.scale.set(1, 1.15, 0.95); head.rotation.z = 0.5; g.add(head);
      for (const s of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(1.2, 0.5, 0.5), std('#3a3a3a'), s * 1.4, 3.6, 3.6));
      const eye1 = mesh(new THREE.SphereGeometry(0.35, 8, 6), glowMat('#7fe8ff'), -1.4, 3.3, 3.75); const eye2 = mesh(new THREE.SphereGeometry(0.35, 8, 6), glowMat('#7fe8ff'), 1.4, 3.3, 3.75);
      g.add(eye1, eye2);
      const crown = mesh(new THREE.TorusGeometry(3.4, 0.35, 6, 16), std('#c8a64a', { metalness: 0.6 }), 0.6, 5.6, -0.4); crown.rotation.set(1.2, 0.2, 0.5); g.add(crown);
      const hand = new THREE.Group();
      for (let f = 0; f < 4; f++) hand.add(mesh(new THREE.CylinderGeometry(0.45, 0.55, 3.5 + f * 0.3, 7), st, f * 1.1 - 1.6, 1.8, 0));
      hand.position.set(8, 0, 3); hand.rotation.z = 0.2; g.add(hand);
      world.addGlow(p.x - 1.4, y + 3.3, p.z + 3.8, '#7fe8ff', 2.5); world.addGlow(p.x + 1.4, y + 3.3, p.z + 3.8, '#7fe8ff', 2.5);
      radius = 4.2;
    } else if (biome === 'coast') {
      name = 'Esqueleto da Baleia de Vidro';
      const glass = new THREE.MeshStandardMaterial({ color: '#bfefff', transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.2 });
      for (let i = 0; i < 9; i++) {
        const r = 3.5 - Math.abs(i - 3) * 0.3;
        const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.18, 6, 16, Math.PI), glass);
        rib.position.set(i * 1.5 - 6, 0, 0); rib.rotation.y = Math.PI / 2;
        g.add(rib);
      }
      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.15, 15, 8), glass); spine.rotation.z = Math.PI / 2; spine.position.y = 3.4; g.add(spine);
      const skull = new THREE.Mesh(new THREE.ConeGeometry(2.4, 5, 8), glass); skull.rotation.z = Math.PI / 2; skull.position.set(9.5, 1.5, 0); g.add(skull);
      radius = 6;
    } else if (biome === 'market') {
      name = 'Grande Tenda do Leilão';
      const stripes = ['#c0392b', '#f6e7c1'];
      for (let i = 0; i < 12; i++) { const seg = new THREE.Mesh(new THREE.ConeGeometry(6, 6, 12, 1, true, i / 12 * Math.PI * 2, Math.PI / 6), std(stripes[i % 2], { side: THREE.DoubleSide })); seg.position.y = 7; g.add(seg); }
      for (let i = 0; i < 12; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 12, 1, true, i / 12 * Math.PI * 2, Math.PI / 6), std(stripes[(i + 1) % 2], { side: THREE.DoubleSide })); seg.position.y = 2; g.add(seg); }
      const flag = mesh(new THREE.BoxGeometry(1.4, 0.8, 0.05), std('#ffd36b'), 0.8, 11, 0); g.add(flag);
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6), std('#5a3a22'), 0, 10.6, 0));
      anim.push((t) => { flag.rotation.y = Math.sin(t * 2) * 0.4; });
      g.add(mesh(new THREE.BoxGeometry(2.2, 3, 0.2), glowMat('#ffd08a'), 0, 1.5, 6.02));
      radius = 6.2;
    } else if (biome === 'mountain') {
      name = 'Forja Celeste';
      const st = std('#5a5f6a');
      g.add(mesh(new THREE.CylinderGeometry(4, 5, 4, 8), st, 0, 2, 0));
      g.add(mesh(new THREE.CylinderGeometry(1.4, 2, 10, 8), st, -1.5, 8, -1.5));
      const mouth = mesh(new THREE.BoxGeometry(2.4, 1.8, 0.4), glowMat('#ff7a2a'), 0, 1.6, 4.8); g.add(mouth);
      const anvil = new THREE.Group();
      anvil.add(mesh(new THREE.BoxGeometry(1.8, 0.6, 0.8), std('#2a2a30', { metalness: 0.7 }), 0, 1.4, 0));
      anvil.add(mesh(new THREE.BoxGeometry(0.8, 1.1, 0.6), std('#2a2a30', { metalness: 0.7 }), 0, 0.55, 0));
      anvil.position.set(5, 0, 6); g.add(anvil);
      const ember = new THREE.PointLight('#ff7a2a', 2.5, 18, 1.5); ember.position.set(0, 3, 6); g.add(ember);
      anim.push((t) => { ember.intensity = 2.2 + Math.sin(t * 9) * 0.4 + Math.sin(t * 13) * 0.3; });
      world.addGlow(p.x, y + 1.6, p.z + 5.2, '#ff9a4a', 5);
      radius = 5.2;
    } else if (biome === 'astral') {
      name = 'Grande Astrolábio';
      const gold = std('#e8c46a', { metalness: 0.8, roughness: 0.25, flatShading: false });
      g.add(mesh(new THREE.CylinderGeometry(1.2, 2, 3, 8), std('#3a3f6e'), 0, 1.5, 0));
      const rings = [];
      for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(4 + i * 1.2, 0.12, 8, 64), gold); r.position.y = 7; g.add(r); rings.push(r); }
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 1), glowMat('#c6b4ff')); core.position.y = 7; g.add(core);
      anim.push((t) => { rings[0].rotation.set(t * 0.4, t * 0.2, 0); rings[1].rotation.set(0, t * 0.3, t * 0.5); rings[2].rotation.set(t * 0.25, 0, t * 0.15); core.rotation.y = t; });
      world.addGlow(p.x, y + 7, p.z, '#c6b4ff', 9);
      radius = 2.4;
    } else if (biome === 'garden') {
      name = 'Flor do Último Sol';
      g.add(mesh(new THREE.CylinderGeometry(0.5, 0.8, 9, 8), std('#5f9a4a'), 0, 4.5, 0));
      for (let i = 0; i < 8; i++) { const pt = mesh(new THREE.SphereGeometry(2.2, 8, 6), std(i % 2 ? '#ff9ad5' : '#ffb3d9'), Math.cos(i * 0.785) * 2.6, 9.5, Math.sin(i * 0.785) * 2.6); pt.scale.set(1, 0.35, 0.6); pt.rotation.y = -i * 0.785; g.add(pt); }
      const sun = mesh(new THREE.SphereGeometry(1.4, 12, 8), glowMat('#ffd36b'), 0, 9.8, 0); g.add(sun);
      for (let i = 0; i < 4; i++) { const lf = mesh(new THREE.SphereGeometry(1.4, 6, 4), std('#6fbf4a'), Math.cos(i * 1.57) * 1.5, 2.5 + i, Math.sin(i * 1.57) * 1.5); lf.scale.set(1, 0.2, 0.5); g.add(lf); }
      world.addGlow(p.x, y + 9.8, p.z, '#ffd36b', 7);
      radius = 1.6;
    } else if (biome === 'abyss') {
      name = 'Portão dos Sete Selos';
      const st = std('#3a2f48');
      for (const s of [-1, 1]) { g.add(mesh(new THREE.BoxGeometry(1.6, 11, 1.6), st, s * 4, 5.5, 0)); g.add(mesh(new THREE.OctahedronGeometry(0.6, 0), glowMat('#b07aff'), s * 4, 11.8, 0)); }
      g.add(mesh(new THREE.BoxGeometry(10, 1.4, 1.8), st, 0, 11, 0));
      const portal = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32), new THREE.MeshBasicMaterial({ color: '#6a2aa8', transparent: true, opacity: 0.75, side: THREE.DoubleSide, toneMapped: false }));
      portal.position.y = 5.5; g.add(portal);
      const swirl = new THREE.Mesh(new THREE.RingGeometry(1, 3.3, 32, 1), new THREE.MeshBasicMaterial({ color: '#d0a8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, toneMapped: false, wireframe: true }));
      swirl.position.y = 5.5; g.add(swirl);
      anim.push((t) => { swirl.rotation.z = t * 0.6; portal.material.opacity = 0.6 + Math.sin(t * 2) * 0.15; });
      for (let i = 0; i < 7; i++) g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), glowMat('#ff5d79'), -3 + i, 9.6, 0.95));
      world.addGlow(p.x, y + 5.5, p.z, '#9b4dff', 9);
      radius = 4.6;
    }
    g.position.set(p.x, y - 0.1, p.z);
    g.rotation.y = Math.atan2(-p.x, -p.z); // vira para o centro
    world.scene.add(g);
    world.colliders.push({ x: p.x, z: p.z, r: radius });
    const LORE = {
      forest: 'Dizem que cada lanterna desta árvore guarda o nome de um viajante que nunca voltou. A luz azul pisca quando alguém se lembra deles.',
      city: 'O sino de Lunária só toca sozinho quando uma promessa é quebrada dentro das muralhas. Hoje ele está em silêncio — por enquanto.',
      ruins: 'O deus caiu do céu no Primeiro Crepúsculo. Seus olhos ainda brilham, procurando quem roubou sua coroa.',
      coast: 'A baleia de vidro encalhou há mil anos. As crianças da costa juram que, nas noites de maré violeta, ela ainda canta.',
      market: 'Dentro da Grande Tenda, a Dama do Leilão vende o que não tem preço. A entrada custa uma lembrança feliz.',
      mountain: 'Aqui os anões forjaram o sol antigo. A brasa no fundo da fornalha nunca se apagou.',
      astral: 'Cada anel do astrolábio marca um futuro possível. Quando você decide algo, um deles muda de direção.',
      garden: 'A flor só se abre para celebrar o fim de algo. Ela floresceu no dia em que a última lanterna começou a apagar.',
      abyss: 'Sete selos fecham o portão. Seis já racharam. O que está do outro lado espera pelo sétimo.',
    };
    const ia = { kind: 'landmark', x: p.x, z: p.z, r: radius + 3.5, label: `Contemplar: ${name}`, icon: '👁', name, lore: LORE[biome] };
    if (!((E.state.world.landmarks || {})[world.id])) world.interactables.push(ia);
    g.userData.groundSupport = { radius: Math.min(6, Math.max(2, radius)), localBase: 0 };
    world.landmark = { name, x: p.x, z: p.z, group: g, anim, ia };
    if (!anim.length && E.ScenePerf) E.ScenePerf.batch(g);
  };

  // ============================================================ acampamentos e ruínas espalhados
  WX.outposts = (world, spots) => {
    const g = new THREE.Group(), B = world.B, rng = U.seeded(world.reg.seed + 9);
    spots.forEach((p, i) => {
      const y = surface(world, p.x, p.z);
      const kind = i % 3;
      if (kind === 0) { // acampamento de viajantes
        for (let k = 0; k < 2; k++) {
          const tx = p.x + (k ? 2.2 : -2.2), tz = p.z + (k ? -1 : 1);
          const t = mesh(new THREE.ConeGeometry(1.4, 2, 4), std(U.pick(['#c88a3a', '#6a8a4a', '#8a4a5a', '#4a6a8a'])), tx, surface(world, tx, tz) + 1, tz);
          t.rotation.y = rng() * 6; g.add(t); world.colliders.push({ x: tx, z: tz, r: 1.2 });
        }
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(mesh(new THREE.DodecahedronGeometry(0.16, 0), std('#8a8478'), p.x + Math.cos(a) * 0.45, y + 0.08, p.z + Math.sin(a) * 0.45)); }
        g.add(mesh(new THREE.ConeGeometry(0.2, 0.55, 5), glowMat('#ffb347'), p.x, y + 0.3, p.z));
        world.addGlow(p.x, y + .6, p.z, '#ffb347', 2.6);
        world.interactables.push({kind:'campfire', id:'campfire'+i, x:p.x,z:p.z,r:2.5,label:'Cozinhar na fogueira',icon:E.Icons ? E.Icons.html('cooking') : 'Cozinhar'});
        g.add(mesh(new THREE.BoxGeometry(0.7, 0.5, 0.5), std('#8a5a2e'), p.x + 1, surface(world,p.x+1,p.z+1.6) + 0.25, p.z + 1.6));
        world.colliders.push({x:p.x+1,z:p.z+1.6,r:.38});
      } else if (kind === 1) { // círculo de pedras rúnicas
        for (let k = 0; k < 7; k++) {
          const a = k / 7 * Math.PI * 2, x = p.x + Math.cos(a) * 3, z = p.z + Math.sin(a) * 3;
          const s = mesh(new THREE.BoxGeometry(0.8, 2.2 + rng() * 1.2, 0.5), std('#9a968c'), x, surface(world, x, z) + 1.1, z);
          s.rotation.y = -a; g.add(s); world.colliders.push({ x, z, r: 0.5 });
          g.add(mesh(new THREE.BoxGeometry(0.3, 0.3, 0.05), glowMat(B.accent || '#7fe8ff'), x + Math.cos(a) * -0.27, surface(world, x, z) + 1.4, z + Math.sin(a) * -0.27));
        }
      } else { // ruína de casa / muro
        for (let k = 0; k < 5; k++) {
          const x = p.x + (k - 2) * 1.1, z = p.z;
          const hgt = 0.6 + rng() * 2;
          g.add(mesh(new THREE.BoxGeometry(1.05, hgt, 0.6), std('#b4ac9c'), x, surface(world, x, z) + hgt / 2, z));
          world.colliders.push({ x, z, r: 0.6 });
        }
        for (let k = 0; k < 3; k++) { const x = p.x + 2.4, z = p.z + 1 + k * 1.1; const hgt = 0.6 + rng() * 1.6; g.add(mesh(new THREE.BoxGeometry(.6, hgt, 1.05), std('#a8a090'), x, surface(world, x, z) + hgt / 2, z)); world.colliders.push({x,z,r:.58}); }
        g.add(mesh(new THREE.BoxGeometry(0.8, 0.3, 0.5), std('#9a9080'), p.x - 0.5, surface(world,p.x-.5,p.z+2) + 0.15, p.z + 2));
        world.colliders.push({x:p.x-.5,z:p.z+2,r:.4});
      }
    });
    world.scene.add(g);
    if (E.ScenePerf) E.ScenePerf.batch(g);
  };

  // ============================================================ vida selvagem e nuvens
  function butterflyTex(colr) {
    // asas arredondadas com degradê, pintinhas e antenas (32 px)
    const c = document.createElement('canvas'); c.width = c.height = 32;
    const x = c.getContext('2d');
    const wing = (cx, cy, rx, ry, rot) => { x.save(); x.translate(cx, cy); x.rotate(rot); x.beginPath(); x.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); x.restore(); };
    const grad = x.createRadialGradient(16, 14, 2, 16, 14, 16); grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.35, colr); grad.addColorStop(1, E.SP.shade(colr, -0.35));
    x.fillStyle = grad;
    for (const s of [-1, 1]) { wing(16 + s * 7.5, 11, 7.5, 6.5, s * 0.5); x.fill(); wing(16 + s * 6, 21, 5, 4.5, -s * 0.4); x.fill(); }
    x.strokeStyle = 'rgba(40,24,40,.75)'; x.lineWidth = 1.2;
    for (const s of [-1, 1]) { wing(16 + s * 7.5, 11, 7.5, 6.5, s * 0.5); x.stroke(); wing(16 + s * 6, 21, 5, 4.5, -s * 0.4); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,.85)'; for (const s of [-1, 1]) { x.beginPath(); x.arc(16 + s * 9, 10, 1.6, 0, 7); x.fill(); }
    x.fillStyle = '#2a1e2a'; x.beginPath(); x.ellipse(16, 16, 1.6, 7, 0, 0, 7); x.fill();
    x.strokeStyle = '#2a1e2a'; x.lineWidth = 1; x.beginPath(); x.moveTo(15.5, 9.5); x.quadraticCurveTo(13, 4, 11, 3); x.moveTo(16.5, 9.5); x.quadraticCurveTo(19, 4, 21, 3); x.stroke();
    return new THREE.CanvasTexture(c);
  }
  function birdTex() {
    const c = document.createElement('canvas'); c.width = 16; c.height = 8;
    const x = c.getContext('2d'); x.fillStyle = '#2a2a34';
    x.fillRect(0, 2, 3, 1); x.fillRect(3, 3, 3, 1); x.fillRect(6, 4, 4, 2); x.fillRect(10, 3, 3, 1); x.fillRect(13, 2, 3, 1);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; return t;
  }
  function cloudTex() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    for (let i = 0; i < 14; i++) { const cx = 40 + Math.random() * 176, cy = 64 + (Math.random() - 0.5) * 30, r = 22 + Math.random() * 28; const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }
    return new THREE.CanvasTexture(c);
  }
  WX.wildlife = (world) => {
    const B = world.B, biome = world.reg.biome, rng = U.seeded(world.reg.seed + 31);
    const life = [];
    // borboletas (ou vaga-lumes coloridos à noite)
    if (!B.night) {
      const cols = biome === 'garden' ? ['#ff9ad5', '#ffd36b', '#ffffff'] : ['#ffd36b', '#9fd4ff', '#ff9ad5'];
      const textures = cols.map(butterflyTex);
      for (let i = 0; i < 26 + 14 * (world.K - 1); i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textures[i % textures.length], transparent: true, alphaTest: 0.5 }));
        s.scale.set(0.35, 0.35, 1);
        const a = rng() * 6.28, r = 6 + rng() * 55 * world.K;
        const home = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
        world.scene.add(s);
        life.push({ s, home, ph: rng() * 10, kind: 'fly' });
      }
    }
    // pássaros (bando circulando)
    if (biome !== 'abyss' && biome !== 'astral') {
      const tex = birdTex();
      for (let f = 0; f < 3 + 2 * (world.K - 1); f++) {
        const cx = (rng() - 0.5) * 80 * world.K, cz = (rng() - 0.5) * 80 * world.K, rad = 18 + rng() * 15, hgt = 22 + rng() * 10;
        for (let i = 0; i < 5; i++) {
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false }));
          s.scale.set(1.2, 0.6, 1);
          world.scene.add(s);
          life.push({ s, cx, cz, rad, hgt, off: i * 0.07 + (i % 2) * 0.03, side: (i - 2) * 1.2, ph: rng() * 6, kind: 'bird', sp: 0.12 + rng() * 0.05 });
        }
      }
    }
    // nuvens
    if (!B.night) {
      const ct = cloudTex();
      for (let i = 0; i < 9 + 7 * (world.K - 1); i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ct, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
        s.scale.set(40 + rng() * 30, 18 + rng() * 10, 1);
        s.position.set((rng() - 0.5) * 300 * world.K, 70 + rng() * 30, (rng() - 0.5) * 300 * world.K);
        world.scene.add(s);
        life.push({ s, kind: 'cloud', sp: 0.6 + rng() });
      }
    }
    world.life = life;
  };

  // ============================================================ plantas de coleta e objetos de missão
  WX.HERB_COLOR = { 'Erva-lanterna': '#7fe8ff', 'Lírio-lunar': '#eaf0ff', 'Musgo-eco': '#9fffb0', 'Alga-de-vidro': '#7fd8ff', 'Incenso-raro': '#ffb07a', 'Flor-de-brasa': '#ff7a3a', 'Poeira-estelar': '#c6b4ff', 'Pétala-solar': '#ffd36b', 'Lírio-do-vazio': '#c07aff', 'Trevo-de-ouro': '#ffd36b' };
  // planta com folhas e "lanternas" luminosas penduradas; big = versão da história (maior e mais brilhante)
  WX.herb = (name, big) => {
    const col = WX.HERB_COLOR[name] || '#b8fff0';
    const g = new THREE.Group();
    const leafM = std(E.SP.shade(col, -0.55), { roughness: 0.6 });
    const leafM2 = std(E.SP.shade(col, -0.35), { roughness: 0.6 });
    const n = big ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      const leaf = mesh(new THREE.ConeGeometry(0.12, 0.85, 4), i % 2 ? leafM : leafM2, Math.cos(a) * 0.14, 0.32, Math.sin(a) * 0.14);
      leaf.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7);
      leaf.scale.set(1, 1, 0.35);
      g.add(leaf);
    }
    const stemM = std('#3f6a3a', { roughness: .6 });
    const bulbs = [];
    const nb = big ? 5 : 3;
    for (let i = 0; i < nb; i++) {
      const a = i / nb * Math.PI * 2 + 0.4, hgt = 0.75 + (i % 2) * 0.25;
      const st = mesh(new THREE.CylinderGeometry(0.02, 0.03, hgt, 4), stemM, Math.cos(a) * 0.12, hgt / 2, Math.sin(a) * 0.12);
      st.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
      g.add(st);
      const bx = Math.cos(a) * (0.12 + hgt * 0.25), bz = Math.sin(a) * (0.12 + hgt * 0.25), by = hgt + 0.02;
      const cap = mesh(new THREE.ConeGeometry(0.11, 0.1, 6), std(E.SP.shade(col, -0.4), { roughness: .6 }), bx, by + 0.1, bz);
      const bulb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), glowMat(col));
      bulb.position.set(bx, by, bz);
      g.add(cap, bulb);
      bulbs.push(bulb);
    }
    // halo
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: WX.radial(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: big ? 0.9 : 0.6 }));
    halo.scale.setScalar(big ? 2.6 : 1.6); halo.position.y = 0.85;
    g.add(halo);
    // vagalumes
    const motes = [];
    const ambientCount = big ? 8 : E.state.settings.quality === 'alto' ? 3 : E.state.settings.quality === 'baixo' ? 0 : 1;
    for (let i = 0; i < ambientCount; i++) {
      const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: WX.radial(col), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.scale.setScalar(0.18); g.add(m); motes.push({ m, a: Math.random() * 6, r: 0.4 + Math.random() * 0.5, s: 0.6 + Math.random() });
    }
    if (big) g.scale.setScalar(1.6);
    g.userData = { bulbs, halo, motes, col, big };
    // Leaves, stems and caps keep their colours in one opaque batch. Lights animate separately.
    if (E.ScenePerf) E.ScenePerf.batch(g, { exclude: [...bulbs, halo, ...motes.map(m => m.m)] });
    return g;
  };
  WX.animHerb = (g, t) => {
    const u = g.userData; if (!u || !u.bulbs) return;
    u.bulbs.forEach((b, i) => { b.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.15); });
    u.halo.material.opacity = (u.big ? 0.75 : 0.45) + Math.sin(t * 2) * 0.15;
    for (const m of u.motes) { const a = m.a + t * m.s; m.m.position.set(Math.cos(a) * m.r, 0.6 + Math.sin(t * m.s * 1.7 + m.a) * 0.35, Math.sin(a) * m.r); }
  };
  // pedra com selo rúnico que brilha (investigação)
  WX.sealStone = () => {
    const g = new THREE.Group();
    const stoneM = std('#7a7484');
    const base = mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.5, 8), stoneM, 0, 0.25, 0);
    const slab = mesh(new THREE.BoxGeometry(1.6, 2.4, 0.5), std('#8a8494'), 0, 1.6, 0);
    slab.rotation.z = 0.06;
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.strokeStyle = '#9fe3ff'; x.lineWidth = 6; x.shadowColor = '#9fe3ff'; x.shadowBlur = 14;
    x.beginPath(); x.arc(64, 64, 46, 0, 7); x.stroke();
    x.beginPath(); x.arc(64, 64, 30, 0, 7); x.stroke();
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; x.beginPath(); x.moveTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30); x.lineTo(64 + Math.cos(a) * 46, 64 + Math.sin(a) * 46); x.stroke(); }
    x.font = 'bold 34px serif'; x.fillStyle = '#d8f6ff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ᛟ', 64, 66);
    const rune = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, toneMapped: false, depthWrite: false }));
    rune.position.set(0, 1.7, 0.26);
    const rune2 = rune.clone(); rune2.rotation.y = Math.PI; rune2.position.z = -0.26;
    slab.add; g.add(base, slab, rune, rune2);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const r = mesh(new THREE.DodecahedronGeometry(0.25, 0), stoneM, Math.cos(a) * 1.9, 0.15, Math.sin(a) * 1.9); g.add(r); }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: WX.radial('#9fe3ff'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
    halo.scale.setScalar(3.2); halo.position.y = 1.7; g.add(halo);
    g.userData = { halo, rune, rune2 };
    return g;
  };
  WX.animSeal = (g, t) => { const u = g.userData; if (!u || !u.rune) return; const k = 0.6 + Math.sin(t * 2.4) * 0.4; u.rune.material.opacity = k; u.halo.material.opacity = 0.35 + k * 0.4; };

  WX.updateLife = (world, t, dt) => {
    // Ambient animation is independent of collision/interaction logic. Use accumulated
    // time so clouds keep the same speed when updates are less frequent.
    world._lifeDt = (world._lifeDt || 0) + dt;
    if (world._lifeDt < 1 / 30) return;
    const elapsed = world._lifeDt; world._lifeDt = 0;
    for (const f of world.flags || []) f.rotation.y = Math.sin(t * 2 + f.position.x) * 0.35;
    for (const l of world.life || []) {
      if (l.kind === 'fly') {
        const x = l.home.x + Math.sin(t * 0.5 + l.ph) * 3, z = l.home.z + Math.cos(t * 0.37 + l.ph) * 3;
        const hr = world.hero;
        const visible = !hr || (x - hr.x) ** 2 + (z - hr.z) ** 2 < 70 * 70;
        l.s.visible = visible;
        if (!visible) continue;
        if (l.ground === undefined || t >= l.nextGround) {
          l.ground = surface(world, x, z); l.nextGround = t + 0.2;
          if (l.groundY === undefined) l.groundY = l.ground;
        }
        l.groundY += (l.ground - l.groundY) * Math.min(1, elapsed * 14);
        l.s.position.set(x, l.groundY + 0.9 + Math.sin(t * 3 + l.ph) * 0.4, z);
        l.s.scale.x = 0.38 * (0.45 + Math.abs(Math.sin(t * 10 + l.ph)) * 0.55);
      } else if (l.kind === 'bird') {
        const a = t * l.sp + l.ph - l.off;
        l.s.position.set(l.cx + Math.cos(a) * (l.rad + l.side), l.hgt + Math.sin(t + l.ph) * 1.5, l.cz + Math.sin(a) * (l.rad + l.side));
        l.s.scale.y = 0.6 * (0.6 + Math.abs(Math.sin(t * 8 + l.ph)) * 0.4);
      } else if (l.kind === 'cloud') {
        l.s.position.x += elapsed * l.sp;
        if (l.s.position.x > 160 * world.K) l.s.position.x = -160 * world.K;
      }
    }
  };

  // ============================================================ grutas
  const caveTex = (() => { let t = null; return () => t || (t = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,220,160,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })()); })();
  const glowSprite = (color, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: caveTex(), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.set(s, s, 1); return sp; };
  // teto em cúpula com estalactites, tochas nas paredes, trilhos e escoras de mina perto da entrada
  WX.caveInterior = (world) => {
    const sc = world.scene, rng = U.seeded(world.reg.seed + 99), tint = world.reg.tint;
    const rockM = new THREE.MeshStandardMaterial({ color: E.SP.shade(tint, -0.55), flatShading: true, roughness: 0.95, side: THREE.BackSide });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(36, 40, 18, 0, Math.PI * 2, 0, Math.PI / 2), rockM);
    const P = dome.geometry.attributes.position;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const k = 1 + world.noise.fbm(x * 0.08, z * 0.08 + y * 0.05, 3) * 0.18; P.setXYZ(i, x * k, y * k, z * k); }
    dome.geometry.computeVertexNormals();
    dome.scale.set(1, 0.42, 1); dome.position.y = -1;
    sc.add(dome);
    // estalactites (instanciadas)
    const stG = new THREE.ConeGeometry(0.5, 3, 6); stG.rotateX(Math.PI); stG.translate(0, -1.5, 0);
    const stM = new THREE.MeshStandardMaterial({ color: E.SP.shade(tint, -0.4), flatShading: true, roughness: 0.9 });
    const N = 70, im = new THREE.InstancedMesh(stG, stM, N), d = new THREE.Object3D();
    for (let i = 0; i < N; i++) { const a = rng() * 6.28, r = 3 + Math.sqrt(rng()) * 26; const x = Math.cos(a) * r, z = Math.sin(a) * r; const top = Math.sqrt(Math.max(0, 1 - (r / 37) ** 2)) * 36 * 0.42 - 1.2; d.position.set(x, top, z); d.scale.set(0.6 + rng() * 0.8, 0.5 + rng() * 1.4, 0.6 + rng() * 0.8); d.rotation.y = rng() * 6; d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
    sc.add(im);
    // tochas: luz quente que dança + chamas
    world.torches = [];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + 0.4, r = 22 + rng() * 4;
      let x = Math.cos(a) * r, z = Math.sin(a) * r;
      const y = surface(world, x, z);
      const g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 5), std('#5a3a22'), 0, 0.8, 0));
      const fl = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 6), glowMat('#ffb84d')); fl.position.y = 1.78; g.add(fl);
      const gl = glowSprite('#ffb86a', 2.6); gl.position.y = 1.8; g.add(gl);
      g.position.set(x, y, z); sc.add(g);
      const light = new THREE.PointLight('#ffb86a', 14, 16, 1.7); light.position.set(x, y + 2, z);
      if (i % 2 === 0 || E.state.settings.quality === 'alto') { sc.add(light); world.torches.push({ light, fl, base: 14, ph: i * 1.7 }); }
      else world.torches.push({ light: null, fl, ph: i * 1.7 });
      world.colliders.push({ x, z, r: 0.3 });
    }
    // luz no centro (da abertura) e do lago
    const shaft = new THREE.PointLight(E.SP.mix('#bfe6ff', tint, 0.3), 26, 26, 1.4); shaft.position.set(0, 9, 0); sc.add(shaft);
    const pl = new THREE.PointLight('#7fd8ff', 10, 14, 1.6); pl.position.set(world.pond.x, world.waterLevel + 2, world.pond.z); sc.add(pl);
    // escoras de madeira e trilhos de mina saindo da entrada
    const woodM = std('#7a5232');
    for (let i = 0; i < 3; i++) {
      const z = -4 - i * 3.2, g = new THREE.Group();
      g.add(mesh(new THREE.BoxGeometry(0.25, 3, 0.25), woodM, -1.8, 1.5, 0), mesh(new THREE.BoxGeometry(0.25, 3, 0.25), woodM, 1.8, 1.5, 0), mesh(new THREE.BoxGeometry(4, 0.3, 0.3), woodM, 0, 3, 0));
      g.position.set(0, surface(world, 0, z), z); sc.add(g);
      world.colliders.push({ x: -1.8, z, r: 0.25 }, { x: 1.8, z, r: 0.25 });
    }
    const railM = std('#8a8a94');
    for (let s = -1; s <= 1; s += 2) { const rail = mesh(new THREE.BoxGeometry(0.08, 0.08, 12), railM, s * 0.6, surface(world, 0, -8) + 0.1, -8); sc.add(rail); }
    for (let i = 0; i < 9; i++) sc.add(mesh(new THREE.BoxGeometry(1.6, 0.08, 0.25), woodM, 0, surface(world, 0, -3 - i * 1.3) + 0.05, -3 - i * 1.3));
    const cart = new THREE.Group();
    cart.add(mesh(new THREE.BoxGeometry(1.3, 0.7, 1.7), std('#6a5a4a'), 0, 0.6, 0));
    for (const [cx, cz] of [[-0.6, 0.6], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6]]) { const wh = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.1, 10), std('#3a3a40'), cx, 0.22, cz); wh.rotation.z = Math.PI / 2; cart.add(wh); }
    for (let k = 0; k < 5; k++) cart.add(mesh(new THREE.DodecahedronGeometry(0.22, 0), std(['#a8a8b0', '#dfe6ff', '#9fe3ff'][k % 3]), -0.35 + k * 0.18, 1.05, (k % 2) * 0.3 - 0.15));
    cart.position.set(0, surface(world, 0, -10), -10); sc.add(cart);
    world.colliders.push({ x: 0, z: -10, r: 1.0 });
    // cristais nas paredes (brilham)
    const crM = new THREE.MeshBasicMaterial({ color: E.SP.mix('#9fe3ff', tint, 0.3), toneMapped: false });
    for (let i = 0; i < 26; i++) {
      const a = rng() * 6.28, r = 26 + rng() * 3, x = Math.cos(a) * r, z = Math.sin(a) * r, y = surface(world, x, z);
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(0.3 + rng() * 0.4, 0), crM); c.position.set(x, y + 0.3 + rng() * 2, z); c.scale.y = 2; c.rotation.z = rng() - 0.5; sc.add(c);
      if (i % 3 === 0) { const g = glowSprite(crM.color.getStyle(), 2.2); g.position.copy(c.position); sc.add(g); }
    }
    // poeira no ar
    world.dust = [];
    for (let i = 0; i < 40; i++) { const s = glowSprite('#ffe9c8', 0.25); s.material.opacity = 0.5; s.position.set((rng() - 0.5) * 40, 1 + rng() * 8, (rng() - 0.5) * 40); s.userData.ph = rng() * 6; sc.add(s); world.dust.push(s); }
  };
  WX.caveExit = (world, p) => {
    const g = new THREE.Group(), y = surface(world, p.x, p.z);
    const stone = std('#6a6070');
    g.add(mesh(new THREE.BoxGeometry(0.7, 3.2, 0.7), stone, -1.6, 1.6, 0), mesh(new THREE.BoxGeometry(0.7, 3.2, 0.7), stone, 1.6, 1.6, 0), mesh(new THREE.BoxGeometry(4, 0.6, 0.8), stone, 0, 3.4, 0));
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3), new THREE.MeshBasicMaterial({ color: '#cfe8ff', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    portal.position.y = 1.6; g.add(portal);
    g.position.set(p.x, y, p.z - 1.5);
    world.scene.add(g);
    world.caveExitObj = portal;
    world.interactables.push({ kind: 'caveExit', x: p.x, z: p.z - 1.2, r: 3, label: `Sair para ${E.WD.REGIONS[world.reg.parent].name}`, icon: '🚪' });
  };

  // ============================================================ novidades de cada região (v4)
  WX.regionExtras = (world) => {
    const ex = world.extra; if (!ex) return;
    const sc = world.scene;
    // entrada da gruta: rochas, escoras de mina e uma boca escura
    if (ex.cave && world.reg.caveId) {
      const p = ex.cave, y = surface(world, p.x, p.z), g = new THREE.Group();
      const rockM = std('#7a7480'), woodM = std('#7a5232');
      for (let i = 0; i < 7; i++) { const a = Math.PI * (i / 6), r = 2.6; g.add(mesh(new THREE.DodecahedronGeometry(1.3 + (i % 3) * 0.3, 0), rockM, Math.cos(a) * r, Math.sin(a) * 2.4 + 0.4, -0.6)); }
      g.add(mesh(new THREE.DodecahedronGeometry(2.4, 0), rockM, 0, 3.6, -1.4));
      const mouth = new THREE.Mesh(new THREE.CircleGeometry(1.7, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#0a0810' })); mouth.position.set(0, 0.05, 0.3); g.add(mouth);
      g.add(mesh(new THREE.BoxGeometry(0.22, 2.4, 0.22), woodM, -1.5, 1.2, 0.5), mesh(new THREE.BoxGeometry(0.22, 2.4, 0.22), woodM, 1.5, 1.2, 0.5), mesh(new THREE.BoxGeometry(3.3, 0.25, 0.25), woodM, 0, 2.4, 0.5));
      const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), glowMat('#ffb84d')); lamp.position.set(1.5, 2.1, 0.75); g.add(lamp);
      const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x2 = c.getContext('2d');
      x2.fillStyle = '#3b2410'; x2.fillRect(0, 0, 256, 64); x2.strokeStyle = '#d4af37'; x2.lineWidth = 4; x2.strokeRect(4, 4, 248, 56);
      x2.fillStyle = '#ffe9a8'; x2.font = 'bold 26px serif'; x2.textAlign = 'center'; x2.textBaseline = 'middle'; x2.fillText(E.WD.CAVES[world.reg.caveId].name, 153, 34, 184);
      const signTexture = new THREE.CanvasTexture(c);
      E.Icons.paint(x2, 'pickaxe', 10, 10, 44, () => { signTexture.needsUpdate = true; });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: signTexture })); sign.position.set(0, 2.85, 0.7); g.add(E.Shopfronts ? E.Shopfronts.readable(sign) : sign);
      g.position.set(p.x, y, p.z); g.rotation.y = Math.atan2(-p.x, -p.z);
      sc.add(g);
      world.colliders.push({ x: p.x, z: p.z, r: 2.2 });
      world.addGlow(p.x, y + 2.2, p.z, '#ffb84d', 2.4);
      world.interactables.push({ kind: 'cave', cave: world.reg.caveId, x: p.x + Math.sin(g.rotation.y) * 2.6, z: p.z + Math.cos(g.rotation.y) * 2.6, r: 3.2, label: `Entrar: ${E.WD.CAVES[world.reg.caveId].name}`, icon: '⛏' });
    }
    // Lumes (colecionáveis): alguns flutuam alto — é preciso pular
    world.lumes = [];
    const got = E.Chains ? E.Chains.lumesIn(world.id) : [];
    ex.lumes.forEach((p, i) => {
      if (got.includes(i)) return;
      const y = surface(world, p.x, p.z) + (p.high ? 2.3 : 1.15);
      const g = new THREE.Group();
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glowMat('#fff6c8'));
      const halo = glowSprite(world.B.accent || '#9fe3ff', 1.5);
      g.add(core, halo);
      g.position.set(p.x, y, p.z);
      sc.add(g);
      world.lumes.push({ i, g, y, x: p.x, z: p.z, high: p.high });
    });
    // altar da Corrida das Lanternas
    if (ex.altar) {
      const p = ex.altar, y = surface(world, p.x, p.z), g = new THREE.Group();
      g.add(mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.5, 8), std('#b8b0a0'), 0, 0.25, 0));
      g.add(mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.1, 6), std('#5a4a3a'), 0, 1.3, 0), mesh(new THREE.BoxGeometry(1.4, 0.12, 0.12), std('#5a4a3a'), 0, 2.3, 0));
      const bell = mesh(new THREE.CylinderGeometry(0.18, 0.36, 0.5, 10), std('#d4af37', { metalness: 0.6, roughness: 0.3 }), 0.5, 2.0, 0); g.add(bell);
      g.position.set(p.x, y, p.z); g.userData.groundSupport = { radius: 1.4, floor: .5 }; sc.add(g);
      world.colliders.push({ x: p.x, z: p.z, r: 1.1 });
      world.altarBell = bell;
      world.interactables.push({ kind: 'challenge', x: p.x, z: p.z, r: 2.8, label: 'Corrida das Lanternas', icon: '🔔' });
    }
    // portal do Domínio (v4.5): plataforma com degraus, pilares com cristais, arco de pedra rúnica e um vórtice animado
    if (ex.domain) {
      const p = ex.domain, y = Math.max(...[[0, 0], [3, 3], [-3, 3], [3, -3], [-3, -3]].map(([dx, dz]) => surface(world, p.x + dx, p.z + dz))), g = new THREE.Group();
      const stone = std('#5a5470'), dark = std('#3a3448'), gold = std('#d4af37', { metalness: 0.6, roughness: 0.35 });
      const vc = '#b07aff', vc2 = '#ff7ad8';
      // degraus
      for (let k = 0; k < 3; k++) g.add(mesh(new THREE.CylinderGeometry(5.2 - k * 0.9, 5.5 - k * 0.9, 0.45, 8), k % 2 ? dark : stone, 0, 0.22 + k * 0.45, 0));
      const runeRing = new THREE.Mesh(new THREE.RingGeometry(2.9, 3.25, 48), glowMat(vc)); runeRing.material.transparent = true; runeRing.material.opacity = 0.75; runeRing.material.side = THREE.DoubleSide; runeRing.rotation.x = -Math.PI / 2; runeRing.position.y = 1.36; g.add(runeRing);
      const runeIn = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.05, 8), glowMat(vc2)); runeIn.material.transparent = true; runeIn.material.opacity = 0.6; runeIn.material.side = THREE.DoubleSide; runeIn.rotation.x = -Math.PI / 2; runeIn.position.y = 1.37; g.add(runeIn);
      // pilares com faixas douradas e cristais flutuando no topo
      const crystals = [];
      for (const sx of [-1, 1]) {
        g.add(mesh(new THREE.BoxGeometry(1.3, 7.6, 1.3), stone, sx * 3.3, 5.1, 0), mesh(new THREE.BoxGeometry(1.7, 0.6, 1.7), dark, sx * 3.3, 1.6, 0), mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), dark, sx * 3.3, 8.95, 0));
        for (const yy of [3.4, 6.4]) g.add(mesh(new THREE.BoxGeometry(1.42, 0.22, 1.42), gold, sx * 3.3, yy, 0));
        for (const yy of [2.6, 4.2, 5.6, 7.2]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.06), glowMat(vc)); r.position.set(sx * 3.3, yy, 0.67); g.add(r); }
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), glowMat(vc2)); cr.scale.y = 1.6; cr.position.set(sx * 3.3, 10.3, 0); g.add(cr);
        const ch = glowSprite(vc2, 3); ch.position.copy(cr.position); g.add(ch);
        crystals.push(cr);
      }
      // arco de pedras com a pedra-chave brilhando
      for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8, x = Math.cos(a) * 3.3, yy = 8.95 + Math.sin(a) * 2.2; const b = mesh(new THREE.BoxGeometry(1.25, 0.9, 1.4), k % 2 ? dark : stone, x, yy, 0); b.rotation.z = a - Math.PI / 2; g.add(b); }
      const key = new THREE.Mesh(new THREE.OctahedronGeometry(0.75, 0), glowMat('#ffe08a')); key.position.set(0, 11.6, 0.2); g.add(key);
      g.add(mesh(new THREE.ConeGeometry(0.5, 1.2, 4), gold, 0, 12.6, 0));
      // vórtice (shader) e anéis de runas girando
      const vMat = WX.vortexMat(vc, vc2);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(2.75, 48), vMat); disc.position.set(0, 5.6, 0); disc.scale.y = 1.55; g.add(disc);
      const back = new THREE.Mesh(new THREE.CircleGeometry(2.75, 48), vMat); back.position.set(0, 5.6, -0.02); back.rotation.y = Math.PI; back.scale.y = 1.55; g.add(back);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(2.85, 0.12, 8, 48), glowMat(vc)); ring.position.set(0, 5.6, 0); ring.scale.y = 1.55; g.add(ring);
      const orbit = [0, 1].map((k) => { const o = new THREE.Mesh(new THREE.TorusGeometry(3.6 + k * 0.5, 0.05, 6, 64), glowMat(k ? vc2 : '#ffe08a')); o.position.set(0, 5.6, 0); g.add(o); return o; });
      const halo = glowSprite(vc, 11); halo.position.set(0, 5.6, 0.3); g.add(halo);
      // partículas subindo do portal
      const parts = [];
      for (let k = 0; k < 14; k++) { const s = glowSprite(k % 2 ? vc : vc2, 0.45); g.add(s); parts.push({ s, ph: k / 14, a: k * 1.7, r: 1 + (k % 4) * 0.5 }); }
      g.position.set(p.x, y - .05, p.z); g.rotation.y = Math.atan2(-p.x, -p.z); g.userData.groundSupport = { radius: 5.5, floors: [{r:5.2,y:.45},{r:4.3,y:.9},{r:3.4,y:1.35}] };
      sc.add(g);
      world.domainObj = { group: g, ring, disc, mat: vMat, orbit, crystals, key, runeIn, parts, halo };
      if (E.ScenePerf) E.ScenePerf.batch(g, {exclude:[ring,disc,back,...orbit,...crystals,key,runeIn,halo,...parts.map(p=>p.s)]});
      for (const sx of [-1, 1]) { const a = g.rotation.y; world.colliders.push({ x: p.x + Math.cos(a) * sx * 3.3, z: p.z - Math.sin(a) * sx * 3.3, r: 1.0 }); }
      world.addGlow(p.x, y + 5.6, p.z, vc, 5);
      const fx = p.x + Math.sin(g.rotation.y) * 4.6, fz = p.z + Math.cos(g.rotation.y) * 4.6;
      world.interactables.push({ kind: 'domain', x: fx, z: fz, r: 3.6, label: 'Domínio dos Fragmentos', icon: '🌀' });
    }
  };
  // lanternas da corrida (aparecem durante o desafio)
  WX.startChallenge = (world) => {
    const ex = world.extra; if (!ex || world.race) return;
    const rings = ex.rings.map((p, k) => {
      const y = surface(world, p.x, p.z);
      const g = new THREE.Group();
      const r = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.1, 8, 28), glowMat(k === 0 ? '#ffd36b' : '#9fe3ff'));
      r.position.y = 1.4; g.add(r);
      const halo = glowSprite('#ffd36b', 2.6); halo.position.y = 1.4; g.add(halo);
      g.position.set(p.x, y, p.z); world.scene.add(g);
      return { g, r, x: p.x, z: p.z, done: false };
    });
    world.race = { rings, i: 0, t: E.CT.CHALLENGE.time, start: performance.now() };
  };
  WX.endChallenge = (world) => { if (!world.race) return; for (const r of world.race.rings) world.scene.remove(r.g); world.race = null; };
  WX.updateExtras = (world, dt) => {
    const hr = world.hero, t = world.t;
    for (const tc of world.torches || []) { const f = 0.8 + Math.sin(t * 13 + tc.ph) * 0.12 + Math.sin(t * 5.1 + tc.ph) * 0.08; if (tc.light) tc.light.intensity = tc.base * f; tc.fl.scale.set(1, f, 1); }
    for (const s of world.dust || []) { s.position.y += Math.sin(t * 0.6 + s.userData.ph) * dt * 0.15; s.position.x += Math.cos(t * 0.3 + s.userData.ph) * dt * 0.1; }
    if (world.caveExitObj) world.caveExitObj.material.opacity = 0.28 + Math.sin(t * 2) * 0.1;
    const D = world.domainObj;
    if (D) {
      if (D.mat) D.mat.uniforms.t.value = t;
      D.ring.rotation.z = t * 0.8;
      if (D.orbit) { D.orbit[0].rotation.set(t * 0.5, t * 0.3, 0); D.orbit[1].rotation.set(-t * 0.4, 0, t * 0.6); }
      if (D.crystals) D.crystals.forEach((c, k) => { c.rotation.y = t * 1.3; c.position.y = 10.3 + Math.sin(t * 2 + k) * 0.25; });
      if (D.key) D.key.rotation.y = t * 1.6;
      if (D.runeIn) D.runeIn.rotation.z = -t * 0.5;
      if (D.halo) D.halo.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.15;
      if (D.parts) for (const q of D.parts) { const ph = (q.ph + t * 0.18) % 1; q.s.position.set(Math.cos(q.a + t) * q.r, 1.6 + ph * 9, Math.sin(q.a + t) * q.r * 0.4 + 0.4); q.s.material.opacity = 0.9 * (1 - ph); }
    }
    // Lumes: flutuam e são pegos ao encostar (os altos, só pulando)
    for (const l of world.lumes || []) {
      if (l.taken) continue;
      l.g.position.y = l.y + Math.sin(t * 2 + l.i) * 0.15;
      l.g.children[0].rotation.y = t * 2;
      const dy = Math.abs(l.g.position.y - (hr.y + hr.jump + 1.0));
      if (Math.hypot(l.x - hr.x, l.z - hr.z) < 1.15 && dy < 1.0) {
        l.taken = true; world.scene.remove(l.g);
        if (E.Chains) E.Chains.takeLume(world.id, l.i);
        if (E.HUD) E.HUD.update();
      }
    }
    // corrida das lanternas
    const race = world.race;
    if (race) {
      race.t -= dt;
      const cur = race.rings[race.i];
      for (const [k, r] of race.rings.entries()) { r.r.rotation.y = t * 2; r.g.visible = k >= race.i; r.r.material.color.set(k === race.i ? '#ffd36b' : '#9fe3ff'); }
      if (cur && Math.hypot(cur.x - hr.x, cur.z - hr.z) < 1.6) {
        cur.done = true; race.i++;
        E.Audio.sfx('star');
        if (race.i >= race.rings.length) { const secs = Math.round((performance.now() - race.start) / 100) / 10; WX.endChallenge(world); E.U.emit('challenge:done', secs); }
      }
      if (world.race && race.t <= 0) { WX.endChallenge(world); E.U.emit('challenge:fail'); }
      // Display uses tenths of a second; avoid rebuilding its DOM at the render rate.
      const hudTick = Math.round(race.t * 10);
      if (world.race && (race._hudTick !== hudTick || race._hudRing !== race.i)) {
        race._hudTick = hudTick; race._hudRing = race.i;
        E.U.emit('challenge:tick', { left: Math.max(0, race.t), i: race.i, n: race.rings.length });
      }
    }
  };

  E.WX = WX;
})();
