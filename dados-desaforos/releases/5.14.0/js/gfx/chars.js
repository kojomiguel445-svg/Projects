/* Personagens em pixel art de alta definição (64×78): heróis, NPCs e inimigos humanoides.
   Aparência totalmente configurável: cabelo, olhos, pele, porte, roupa, cores e acessórios. */
(() => {
  const CH = {};
  const W = 64, H = 78, CX = 32;
  const sh = (c, a) => E.SP.shade(c, a);

  // ---------------- catálogos de aparência ----------------
  CH.HAIR_STYLES = ['Curto', 'Longo', 'Rabo de cavalo', 'Espetado', 'Coque', 'Tranças', 'Chanel', 'Cacheado', 'Raspado', 'Moicano', 'Maria-chiquinha', 'Black power', 'Coque samurai', 'Ondulado longo', 'Franja de lado'];
  CH.BUILDS = { magro: 'Magro', medio: 'Médio', forte: 'Musculoso', gordo: 'Gordo' };
  CH.EYES = ['#3a2a20', '#2f6fb3', '#3f8a4a', '#8a5a2a', '#9b6bff', '#d4a017', '#c0392b', '#5a6b7d'];
  CH.HAIR = ['#2a1f1a', '#5a3a22', '#8a5a32', '#c8873a', '#e8c46a', '#f2ead0', '#c84b3a', '#e86a9a', '#3a62c8', '#4a9a6a', '#8a5ad8', '#9aa3ad'];
  CH.CLOTH = ['#e08a3c', '#c0392b', '#3a62c8', '#2c3e50', '#5f8a4a', '#7b5cff', '#f0c75e', '#a8325a', '#3ec7b3', '#f2ead0', '#4a4f5a', '#8a5a32'];
  CH.ACCESSORIES = { nenhum: 'Nenhum', classe: 'Da classe', tiara: 'Tiara', faixa: 'Faixa', flor: 'Flor no cabelo', folhas: 'Coroa de folhas', capuz: 'Capuz', chapeu_mago: 'Chapéu de mago', chapeu_bardo: 'Chapéu com pena', oculos: 'Óculos de aventura', chapeu_palha: 'Chapéu de palha', chapeu_aba: 'Chapéu de viajante', tricornio: 'Chapéu de pirata', boina: 'Boina', coroa: 'Coroa', elmo: 'Elmo', capacete_mineiro: 'Capacete de mineiro', bandana: 'Bandana', laco: 'Laço', orelhas_gato: 'Orelhas de gato', mascara: 'Máscara ninja', tapa_olho: 'Tapa-olho', cachecol: 'Cachecol' };
  CH.CAPES = { auto: 'Da roupa', nenhuma: 'Sem capa', curta: 'Curta', longa: 'Longa', esfarrapada: 'Esfarrapada', pele: 'Manto de pele' };
  CH.OUTFITS = {
    aventureiro: { name: 'Aventureiro', desc: 'Túnica, cinto e capa curta.' },
    cavaleiro: { name: 'Cavaleiro', desc: 'Armadura de placas com tabardo e capa.' },
    manto: { name: 'Manto Arcano', desc: 'Manto longo com mangas largas.' },
    ladrao: { name: 'Sombra', desc: 'Couro justo, lenço e braçadeiras.' },
    explorador: { name: 'Explorador', desc: 'Jaqueta com gola de pele e bolsa.' },
    oriental: { name: 'Hanfu', desc: 'Traje de gola cruzada com faixa (estilo Liyue).' },
    nobre: { name: 'Nobre', desc: 'Casaca longa com botões dourados.' },
    tribal: { name: 'Tribal', desc: 'Manto de pele e saiote de couro.' },
    sacerdote: { name: 'Sacerdote', desc: 'Veste branca com tabardo sagrado.' },
    vestido: { name: 'Vestido de Festa', desc: 'Corpete e saia rodada com laço.' },
    campones: { name: 'Camponês', desc: 'Camisa de linho, suspensórios e calça remendada.' },
    pirata: { name: 'Pirata', desc: 'Camisa aberta, colete, faixa na cintura e botas altas.' },
    mineiro: { name: 'Mineiro', desc: 'Macacão com joelheiras e luvas de couro.' },
    pescador: { name: 'Pescador', desc: 'Camisa listrada, colete de bolsos e calça dobrada.' },
    samurai: { name: 'Samurai', desc: 'Armadura de lâminas, ombreiras largas e hakama.' },
    ninja: { name: 'Shinobi', desc: 'Traje escuro com faixas nos braços e nas pernas.' },
    mercador: { name: 'Mercador', desc: 'Túnica longa, xale e bolsinha de moedas.' },
    menestrel: { name: 'Menestrel', desc: 'Gibão de duas cores, gola de babados e meias listradas.' },
    guarda: { name: 'Guarda Real', desc: 'Gibão acolchoado, cota de malha e tabardo com brasão.' },
    inverno: { name: 'Casaco de Inverno', desc: 'Casaco grosso com pelo na gola, nos punhos e nas botas.' },
    verao: { name: 'Roupa de Verão', desc: 'Regata florida, bermuda e sandálias.' },
    academia: { name: 'Uniforme da Academia', desc: 'Blazer com gravata e saia pregueada (Academia de Lunária).' },
    cacador: { name: 'Caçador', desc: 'Gibão de couro, braçadeiras e aljava nas costas.' },
    alquimista: { name: 'Alquimista', desc: 'Jaleco aberto, avental e frascos no peito.' },
    militar: { name: 'Casaca Militar', desc: 'Casaca com dragonas douradas, faixa e botas altas.' },
    dancarina: { name: 'Dançarina do Deserto', desc: 'Top bordado, saia rodada e moedas douradas.' },
    mestre_pescador: { name: 'Mestre Pescador 🎣', desc: 'Camisa de linho, colete cor de dendê, guias coloridas e fitinhas no pulso.', reward: 'Conclua a missão “Mestre dos Sete Mares” do Mestre Dendê, no píer de Aurenna.', icon: '🎣' },
    gladiador: { name: 'Gladiador ⚔', desc: 'Saiote de tiras, ombreira de aço e grevas.', reward: 'Vença a Liga de Prata da Arena (Guilda de Aurenna).', icon: '🏟' },
    estelar: { name: 'Manto Estelar ✦', desc: 'Traje lendário que brilha com constelações.', premium: 960 },
    aurora: { name: 'Armadura da Aurora ✦', desc: 'Placas brancas e douradas com gemas de luz.', premium: 960 },
    dragonico: { name: 'Armadura Dracônica ✦', desc: 'Escamas rubras, ombreiras com chifres e asas de dragão.', premium: 960 },
    eclipse: { name: 'Vestes do Eclipse ✦', desc: 'Manto negro e dourado com coroa de luz do eclipse.', premium: 960 },
    sakura: { name: 'Quimono das Cerejeiras ✦', desc: 'Quimono rosado com faixa obi e pétalas que brilham.', premium: 960 },
    apostador: { name: 'Terno do Apostador 🎩', desc: 'Prêmio do Cassino Fortuna Dourada: terno preto, colete vermelho e lapelas de ouro.', premium: 99999, casino: true },
  };
  CH.CLASS_DEFAULT = {
    guerreiro: { outfit: 'cavaleiro', c1: '#9aa3ad', c2: '#c0392b', acc: 'nenhum' },
    barbaro: { outfit: 'tribal', c1: '#9a7a52', c2: '#6b4a2a', acc: 'nenhum' },
    paladino: { outfit: 'cavaleiro', c1: '#e6e9ef', c2: '#3a62c8', acc: 'nenhum' },
    patrulheiro: { outfit: 'explorador', c1: '#5a7a3a', c2: '#8a5a32', acc: 'capuz' },
    ladino: { outfit: 'ladrao', c1: '#3a3f4a', c2: '#a8325a', acc: 'nenhum' },
    monge: { outfit: 'oriental', c1: '#e08a3c', c2: '#6b2a2a', acc: 'faixa' },
    clerigo: { outfit: 'sacerdote', c1: '#f2ead0', c2: '#d4af37', acc: 'nenhum' },
    druida: { outfit: 'manto', c1: '#5f8a4a', c2: '#8a5a32', acc: 'folhas' },
    bardo: { outfit: 'nobre', c1: '#c0392b', c2: '#f1c40f', acc: 'chapeu_bardo' },
    bruxo: { outfit: 'manto', c1: '#3b2a5a', c2: '#9b6bff', acc: 'capuz' },
    feiticeiro: { outfit: 'oriental', c1: '#a8325a', c2: '#ffcf5a', acc: 'tiara' },
    mago: { outfit: 'manto', c1: '#2f5fb3', c2: '#ffcf5a', acc: 'chapeu_mago' },
  };
  // aparência padrão (também usada para salvar personagens antigos)
  CH.defaultLook = (cls, species) => {
    const d = CH.CLASS_DEFAULT[cls] || CH.CLASS_DEFAULT.guerreiro;
    const sp = E.H.SPECIES[species] || E.H.SPECIES.humano;
    return { skin: sp.look.skin[0], hair: '#5a3a22', hairStyle: 0, eyes: '#3a2a20', outfit: d.outfit, c1: d.c1, c2: d.c2, acc: d.acc, build: 'medio', height: 1, beard: species === 'anao' };
  };
  // completa aparências criadas na versão anterior
  CH.normalize = (look, cls, species, ancestry) => {
    const base = CH.defaultLook(cls, species);
    const l = Object.assign({}, base, look || {});
    if (!CH.OUTFITS[l.outfit]) { if (typeof l.outfit === 'string' && l.outfit.startsWith('#')) l.c1 = l.outfit; l.outfit = base.outfit; }
    if (l.hairStyle == null || l.hairStyle >= CH.HAIR_STYLES.length) l.hairStyle = 0;
    if (!CH.ACCESSORIES[l.acc]) l.acc = base.acc;
    if (!CH.CAPES[l.cape]) l.cape = 'auto';
    if (!['neutra', 'masculina', 'feminina'].includes(l.presentation)) l.presentation = 'neutra';
    for (const [key, kind] of [['hairPreset', 'hair'], ['eyeShape', 'eyes'], ['mouthShape', 'mouths']]) {
      if (!E.Skins || !E.Skins.has(kind, l[key])) l[key] = null;
    }
    for (const [key, options] of [['dragonHorns', E.Skins?.horns], ['dragonSnout', E.Skins?.snouts], ['dragonCrest', E.Skins?.crests], ['scalePattern', E.Skins?.patterns]]) {
      if (!options || !Object.prototype.hasOwnProperty.call(options, l[key])) l[key] = 'auto';
    }
    // Read the existing ancestry only to colour the visual copy; never mutate the hero or rules.
    if (species === 'draconato' && E.Skins?.ancestryColor(ancestry)) l.skin = E.Skins.ancestryColor(ancestry);
    return l;
  };

  // ---------------- roupas novas (v4.1), descritas por partes e encaixadas no mesmo desenho ----------------
  // torso/sleeve/pants/boots/glove: cores; robe: saia ou casaco longo; back: camada de trás; legs: por cima das pernas;
  // detail: por cima do tronco; after: por cima do cinto; arms: por cima dos braços. k = medidas do quadro atual.
  const stripeRows = (k, y0, y1, step, col) => {
    const { p, CX, ty, bob, shoulder, waist } = k;
    for (let y = y0; y < y1; y += step) { const f = (y - ty) / (50 + bob - ty), half = Math.round(shoulder - (shoulder - waist) * f) - 1; p.line(CX - half, y, CX + half, y, col); }
  };
  const tallBoots = (k, col, top = 63) => { const { p, lx, rx, legW, lL, rL } = k; for (const [x, d] of [[lx, lL], [rx, rL]]) { p.rect(x - 1, top + d, legW + 2, 74 - top, col); p.rect(x - 1, top + d, legW + 2, 2, sh(col, 0.28)); } };
  const ankles = (k, col) => { const { p, lx, rx, legW, lL, rL } = k; for (const [x, d] of [[lx, lL], [rx, rL]]) { p.rect(x, 66 + d, legW, 4, k.skin); p.rect(x, 65 + d, legW, 1, col); } };
  const swingArms = (k, fn) => { if (k.arms === 'swing') fn(k.armL, k.aL); if (k.rArm === 'swing') fn(k.armR, k.aR); };
  const XO = {
    campones: {
      torso: () => '#ece2cc', sleeve: () => '#ece2cc', pants: (c1) => sh(c1, -0.1), boots: () => '#5a3a22',
      detail: (k) => { const { p, CX, ty, bob, c2, skin } = k; p.poly([[CX - 3, ty], [CX + 3, ty], [CX, ty + 4]], skin); p.line(CX - 5, ty + 1, CX - 4, 48 + bob, c2, false, 2); p.line(CX + 4, ty + 1, CX + 3, 48 + bob, c2, false, 2); p.set(CX, ty + 7, '#b8a888'); p.set(CX, ty + 11, '#b8a888'); },
      legs: (k) => { const { p, lx, lL, c1 } = k; p.rect(lx + 1, 60 + lL, 3, 3, sh(c1, 0.18)); p.set(lx + 1, 60 + lL, sh(c1, -0.2)); },
      arms: (k) => swingArms(k, (x, d) => k.p.rect(x, k.ty + 8 + d, 4, 5, k.skin)),
    },
    pirata: {
      torso: () => '#f2ede2', sleeve: () => '#f2ede2', pants: () => '#3a3040', boots: () => '#1e1a1e', belt: (c1, c2) => c2, buckle: false,
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c1, skin } = k; p.poly([[CX - 4, ty], [CX + 4, ty], [CX, ty + 8]], skin); p.poly([[CX - shoulder, ty + 1], [CX - 4, ty + 1], [CX - 3, 48 + bob], [CX - waist, 48 + bob]], c1); p.poly([[CX + 4, ty + 1], [CX + shoulder, ty + 1], [CX + waist, 48 + bob], [CX + 3, 48 + bob]], c1); p.line(CX - 4, ty + 1, CX - 3, 47 + bob, sh(c1, 0.3)); p.line(CX + 4, ty + 1, CX + 3, 47 + bob, sh(c1, 0.3)); },
      after: (k) => { const { p, CX, bob, waist, c2 } = k; p.poly([[CX + waist - 4, 50 + bob], [CX + waist - 1, 50 + bob], [CX + waist + 1, 59 + bob], [CX + waist - 2, 58 + bob]], c2); },
      legs: (k) => tallBoots(k, '#1e1a1e'),
    },
    mineiro: {
      torso: (c1, c2) => c2, sleeve: (c1, c2) => c2, pants: (c1) => c1, boots: () => '#4a3424', glove: () => '#a0703a', noBelt: true,
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c1 } = k; p.rect(CX - 6, ty + 6, 12, 48 + bob - ty - 6, c1); p.rect(CX - waist, 46 + bob, waist * 2, 5, c1); p.line(CX - 6, ty + 6, CX - shoulder + 2, ty + 1, c1, false, 2); p.line(CX + 5, ty + 6, CX + shoulder - 2, ty + 1, c1, false, 2); p.set(CX - 5, ty + 7, '#ffd36b'); p.set(CX + 4, ty + 7, '#ffd36b'); p.rect(CX - 3, ty + 9, 6, 4, sh(c1, -0.15)); p.rect(CX - 3, ty + 9, 6, 1, sh(c1, 0.2)); },
      legs: (k) => { const { p, lx, rx, legW, lL, rL } = k; p.rect(lx, 60 + Math.round(lL / 2), legW, 3, '#6a5a4a'); p.rect(rx, 60 + Math.round(rL / 2), legW, 3, '#6a5a4a'); },
    },
    pescador: {
      torso: () => '#f4f0e6', sleeve: () => '#f4f0e6', pants: (c1) => sh(c1, -0.2), boots: () => '#8a5a32',
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c1, c2 } = k; stripeRows(k, ty + 3, 48 + bob, 3, c2); p.poly([[CX - shoulder, ty + 1], [CX - 3, ty + 1], [CX - 3, 48 + bob], [CX - waist, 48 + bob]], c1); p.poly([[CX + 3, ty + 1], [CX + shoulder, ty + 1], [CX + waist, 48 + bob], [CX + 3, 48 + bob]], c1); for (const x of [CX - 8, CX + 4]) { p.rect(x, ty + 9, 4, 4, sh(c1, -0.18)); p.rect(x, ty + 9, 4, 1, sh(c1, 0.22)); } },
      legs: (k) => ankles(k, sh(k.c1, 0.1)),
    },
    samurai: {
      torso: (c1) => c1, sleeve: (c1) => sh(c1, -0.15), pants: (c1, c2) => sh(c2, -0.3), boots: () => '#2a2228', belt: (c1, c2) => c2, buckle: false,
      robe: { hem: 72, flare: 5, color: (c1, c2) => sh(c2, -0.3), pleats: true, split: true },
      detail: (k) => { const { p, CX, ty, bob, c1, c2 } = k; stripeRows(k, ty + 4, 47 + bob, 3, sh(c1, -0.22)); for (let y = ty + 5; y < 46 + bob; y += 6) { p.set(CX - 4, y, c2); p.set(CX + 3, y, c2); } p.poly([[CX - 4, ty], [CX + 4, ty], [CX, ty + 5]], '#f4f0e6'); },
      arms: (k) => { const { p, CX, ty, shoulder, c1, c2 } = k; for (const x of [CX - shoulder - 6, CX + shoulder - 2]) { p.rect(x, ty, 8, 9, sh(c1, -0.08)); for (let y = ty + 2; y < ty + 9; y += 2) p.rect(x, y, 8, 1, sh(c1, -0.28)); p.rect(x, ty, 8, 1, c2); } },
    },
    ninja: {
      torso: (c1) => E.SP.mix(c1, '#1a1c24', 0.75), sleeve: (c1) => E.SP.mix(c1, '#1a1c24', 0.75), pants: (c1) => E.SP.mix(c1, '#1a1c24', 0.8), boots: () => '#16171c', glove: (c1) => E.SP.mix(c1, '#101118', 0.85), belt: (c1, c2) => c2, buckle: false,
      detail: (k) => { const { p, CX, ty, shoulder, c1, c2 } = k; const d = E.SP.mix(c1, '#1a1c24', 0.75); p.line(CX - shoulder + 2, ty + 1, CX + 3, ty + 12, sh(d, 0.22), false, 2); p.line(CX + shoulder - 2, ty + 1, CX - 2, ty + 9, sh(d, 0.14), false, 2); p.rect(CX - 6, ty - 1, 12, 3, c2); p.poly([[CX + 4, ty], [CX + 9, ty + 1], [CX + 7, ty + 11]], sh(c2, -0.15)); },
      legs: (k) => { const { p, lx, rx, legW, lL, rL, c1 } = k; const w = sh(E.SP.mix(c1, '#1a1c24', 0.8), 0.25); for (const [x, d] of [[lx, lL], [rx, rL]]) for (const y of [62, 65, 68]) p.rect(x, y + d, legW, 1, w); },
      arms: (k) => swingArms(k, (x, d) => { const w = sh(E.SP.mix(k.c1, '#1a1c24', 0.75), 0.25); k.p.rect(x, k.ty + 8 + d, 4, 1, w); k.p.rect(x, k.ty + 10 + d, 4, 1, w); }),
    },
    mercador: {
      torso: (c1) => c1, sleeve: (c1) => c1, wide: true, pants: (c1) => sh(c1, -0.3), boots: () => '#4a3022', belt: (c1, c2) => sh(c2, -0.2), buckle: false,
      robe: { hem: 68, flare: 5, color: (c1) => c1, trim: (c1, c2) => c2 },
      detail: (k) => { const { p, CX, ty, bob, shoulder, c2 } = k; p.rect(CX - 1, ty + 2, 2, 46 + bob - ty, c2); p.poly([[CX - shoulder, ty], [CX + shoulder, ty], [CX + 4, ty + 6], [CX - 4, ty + 6]], c2); p.rect(CX - shoulder, ty, shoulder * 2, 1, sh(c2, 0.25)); },
      after: (k) => { const { p, CX, bob, waist } = k; p.ell(CX + waist - 1, 53 + bob, 3, 3, '#c8a040'); p.rect(CX + waist - 2, 50 + bob, 2, 1, '#7a5a22'); p.set(CX + waist - 2, 52 + bob, '#ffe08a', true); },
    },
    menestrel: {
      torso: (c1) => c1, sleeve: (c1) => c1, pants: (c1, c2) => c2, boots: () => '#4a3022',
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c2 } = k; p.poly([[CX, ty + 1], [CX + shoulder, ty + 1], [CX + waist, 50 + bob], [CX, 50 + bob]], c2); p.rect(CX, ty, shoulder, 3, c2); p.rect(CX - 7, ty - 1, 14, 3, '#f4f0e6'); for (let x = -6; x <= 6; x += 2) p.set(CX + x, ty + 1, '#d8d0c0'); for (let y = ty + 5; y < 46 + bob; y += 4) p.set(CX - 1, y, '#ffd36b'); },
      legs: (k) => { const { p, rx, legW, legTop, rL, c1 } = k; p.rect(rx, legTop, legW, 70 + rL - legTop, c1); },
      arms: (k) => { const { p, ty, armL, armR, c1, c2 } = k; p.ell(armL + 2, ty + 3, 4, 4, c2); p.ell(armR + 2, ty + 3, 4, 4, c1); p.line(armL, ty + 3, armL + 4, ty + 3, sh(c2, 0.25)); p.line(armR, ty + 3, armR + 4, ty + 3, sh(c1, 0.25)); },
    },
    guarda: {
      torso: (c1) => sh(c1, -0.05), sleeve: (c1) => c1, pants: () => '#3a3a44', boots: () => '#3a3036',
      detail: (k) => { const { p, CX, ty, bob, shoulder, c1, c2 } = k; for (const x of [CX - shoulder + 2, CX + shoulder - 3]) p.line(x, ty + 2, x, 47 + bob, sh(c1, -0.18)); p.poly([[CX - 6, ty + 2], [CX + 6, ty + 2], [CX + 5, 59 + bob], [CX - 5, 59 + bob]], c2); p.rect(CX - 6, ty + 2, 12, 1, sh(c2, 0.25)); p.rect(CX - 2, ty + 6, 4, 5, '#ffd36b'); p.set(CX - 3, ty + 6, '#ffd36b'); p.set(CX + 2, ty + 6, '#ffd36b'); p.set(CX, ty + 11, '#ffd36b'); p.rect(CX - 5, ty - 1, 10, 2, '#9aa3ad'); },
    },
    inverno: {
      torso: (c1) => c1, sleeve: (c1) => c1, pants: (c1) => sh(c1, -0.35), boots: () => '#5a4030', glove: (c1, c2) => c2,
      robe: { hem: 60, flare: 3, color: (c1) => c1, trim: () => '#f4f0e8' },
      detail: (k) => { const { p, CX, ty, bob, shoulder, c1 } = k; p.rect(CX, ty + 3, 1, 46 + bob - ty, sh(c1, -0.25)); for (let y = ty + 6; y < 46 + bob; y += 5) p.rect(CX + 1, y, 2, 2, '#8a5a32'); p.ell(CX, ty + 1, shoulder + 1, 3, '#f4f0e8'); for (let x = -shoulder; x <= shoulder; x += 3) p.set(CX + x, ty + 2, '#d8d0c4'); },
      arms: (k) => swingArms(k, (x, d) => k.p.rect(x - 1, k.ty + 11 + d, 6, 2, '#f4f0e8')),
      legs: (k) => { const { p, lx, rx, legW, lL, rL } = k; p.rect(lx - 1, 68 + lL, legW + 2, 2, '#f4f0e8'); p.rect(rx - 1, 68 + rL, legW + 2, 2, '#f4f0e8'); },
    },
    verao: {
      torso: (c1) => c1, sleeve: (c1, c2, skin) => skin, pants: (c1, c2) => c2, boots: () => '#c8873a', noBelt: true,
      detail: (k) => { const { p, CX, ty, shoulder, c1, c2, skin } = k; p.rect(CX - shoulder, ty, 3, 3, skin); p.rect(CX + shoulder - 3, ty, 3, 3, skin); p.ell(CX, ty, 4, 3, skin); for (const [x, y] of [[-5, 8], [3, 11], [-2, 15], [5, 5]]) { p.set(CX + x, ty + y, c2); p.set(CX + x + 1, ty + y, sh(c2, 0.3)); } p.rect(CX - 5, ty + 2, 10, 1, sh(c1, 0.2)); },
      legs: (k) => { const { p, lx, rx, legW, lL, rL, skin, c2 } = k; p.rect(lx, 59, legW, 70 + lL - 59, skin); p.rect(rx, 59, legW, 70 + rL - 59, skin); p.rect(lx, 58, legW, 1, sh(c2, 0.2)); p.rect(rx, 58, legW, 1, sh(c2, 0.2)); },
    },
    academia: {
      torso: (c1) => c1, sleeve: (c1) => c1, pants: () => '#2a2a34', boots: () => '#1e1a1e', noBelt: true,
      robe: { hem: 61, flare: 4, color: (c1, c2) => c2, trim: (c1, c2) => sh(c2, -0.3), pleats: true },
      detail: (k) => { const { p, CX, ty, c1, c2 } = k; p.poly([[CX - 4, ty], [CX + 4, ty], [CX, ty + 9]], '#f4f0e6'); p.rect(CX - 1, ty + 1, 2, 8, c2); p.poly([[CX - 2, ty + 8], [CX + 2, ty + 8], [CX, ty + 11]], c2); p.line(CX - 5, ty, CX - 1, ty + 10, sh(c1, 0.28)); p.line(CX + 5, ty, CX + 1, ty + 10, sh(c1, 0.28)); p.rect(CX - 9, ty + 5, 3, 3, '#ffd36b'); },
    },
    cacador: {
      torso: (c1) => E.SP.mix('#7a5232', c1, 0.3), sleeve: (c1) => c1, pants: (c1) => sh(c1, -0.35), boots: () => '#4a3022',
      back: (k) => { const { p, CX, ty, c2 } = k; p.line(CX + 16, ty - 9, CX + 6, ty + 12, '#6b4a2a', false, 4); p.line(CX + 17, ty - 9, CX + 7, ty + 12, '#8a5a32'); for (const dx of [0, 3, 6]) { p.line(CX + 13 + dx, ty - 15, CX + 13 + dx, ty - 9, '#c8b088'); p.poly([[CX + 12 + dx, ty - 17], [CX + 14 + dx, ty - 17], [CX + 13 + dx, ty - 12]], dx === 3 ? '#f4f0e6' : c2); } },
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c1 } = k; p.line(CX + shoulder - 1, ty + 1, CX - waist, 48 + bob, '#4a3022', false, 2); p.rect(CX - 6, ty - 1, 12, 3, sh(c1, -0.2)); for (let y = ty + 4; y < ty + 12; y += 3) { p.set(CX - 1, y, '#d8c8a0'); p.set(CX + 1, y + 1, '#d8c8a0'); } },
      arms: (k) => swingArms(k, (x, d) => { k.p.rect(x, k.ty + 9 + d, 4, 4, k.c2); k.p.rect(x, k.ty + 9 + d, 4, 1, sh(k.c2, 0.25)); }),
    },
    alquimista: {
      torso: (c1) => c1, sleeve: (c1) => c1, pants: () => '#3a3a44', boots: () => '#4a3022', noBelt: true,
      robe: { hem: 66, flare: 4, color: (c1) => c1, open: true },
      detail: (k) => { const { p, CX, ty, bob, waist } = k; p.poly([[CX - 4, ty], [CX + 4, ty], [CX, ty + 6]], '#f4f0e6'); p.poly([[CX - 6, ty + 5], [CX + 6, ty + 5], [CX + 7, 64], [CX - 7, 64]], '#d8ccb0'); p.rect(CX - 6, ty + 5, 12, 1, '#efe6d0'); p.rect(CX - waist, 47 + bob, waist * 2, 1, '#b8ac90'); p.rect(CX - 6, ty + 11, 12, 1, '#6b4a2a'); p.rect(CX - 5, ty + 12, 2, 3, '#7fe8a0', true); p.rect(CX - 1, ty + 12, 2, 3, '#ff7a8a', true); p.rect(CX + 3, ty + 12, 2, 3, '#9fe3ff', true); p.rect(CX - 3, 56, 6, 3, '#c8bc9e'); },
    },
    militar: {
      torso: (c1) => c1, sleeve: (c1) => c1, pants: () => '#f0ece2', boots: () => '#141418',
      robe: { hem: 61, flare: 2, color: (c1) => c1, trim: (c1, c2) => c2, open: true },
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, c2 } = k; for (let y = ty + 4; y < 46 + bob; y += 4) { p.set(CX - 3, y, '#ffd36b', true); p.set(CX + 2, y, '#ffd36b', true); } p.rect(CX - 5, ty - 1, 10, 3, c2); p.line(CX - shoulder + 1, ty + 2, CX + waist - 1, 47 + bob, c2, false, 2); },
      arms: (k) => { const { p, CX, ty, shoulder, c2 } = k; for (const x of [CX - shoulder - 4, CX + shoulder - 3]) { p.rect(x, ty - 1, 7, 3, '#ffd36b'); for (let i = 0; i < 7; i += 2) p.set(x + i, ty + 2, '#e8b830'); } swingArms(k, (x, d) => p.rect(x, k.ty + 11 + d, 4, 2, c2)); },
      legs: (k) => tallBoots(k, '#141418', 61),
    },
    dancarina: {
      torso: (c1, c2, skin) => skin, sleeve: (c1, c2, skin) => skin, pants: (c1, c2) => c2, boots: () => '#c8873a', belt: () => '#ffd36b', buckle: false,
      robe: { hem: 72, flare: 8, color: (c1, c2) => c2, trim: () => '#ffd36b' },
      detail: (k) => { const { p, CX, ty, shoulder, c1, skin } = k; p.rect(CX - shoulder + 1, ty + 3, shoulder * 2 - 2, 7, c1); p.rect(CX - shoulder + 1, ty + 9, shoulder * 2 - 2, 1, '#ffd36b'); for (let x = -shoulder + 2; x < shoulder - 1; x += 3) p.set(CX + x, ty + 10, '#ffd36b', true); p.rect(CX - 4, ty, 8, 1, '#ffd36b'); p.rect(CX - 1, ty + 13, 2, 1, sh(skin, -0.2)); },
      after: (k) => { const { p, CX, bob, waist } = k; for (let x = -waist; x <= waist; x += 3) p.set(CX + x, 51 + bob, '#ffd36b', true); },
      arms: (k) => swingArms(k, (x, d) => { k.p.rect(x, k.ty + 11 + d, 4, 1, '#ffd36b'); k.p.rect(x, k.ty + 6 + d, 4, 1, '#ffd36b'); }),
    },
    mestre_pescador: {
      torso: () => '#f8f6f0', sleeve: () => '#f8f6f0', pants: () => '#f2efe6', boots: () => '#8a5a32', belt: () => '#e8b830', buckle: false,
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist } = k; const v = '#e0662a', t = '#ffcf3a'; p.poly([[CX - shoulder, ty + 1], [CX - 3, ty + 1], [CX - 3, 48 + bob], [CX - waist, 48 + bob]], v); p.poly([[CX + 3, ty + 1], [CX + shoulder, ty + 1], [CX + waist, 48 + bob], [CX + 3, 48 + bob]], v); p.line(CX - 3, ty + 1, CX - 3, 47 + bob, t); p.line(CX + 3, ty + 1, CX + 3, 47 + bob, t); const beads = ['#ff4d4d', '#ffd36b', '#3ec7b3', '#7b5cff', '#ffffff', '#5fd36b']; for (let i = 0; i <= 10; i++) { const a = Math.PI * (0.15 + 0.7 * i / 10); p.set(CX + Math.cos(a) * 6, ty + Math.sin(a) * 6, beads[i % beads.length], true); } p.rect(CX - 8, ty + 10, 4, 3, sh(v, -0.2)); p.rect(CX + 4, ty + 10, 4, 3, sh(v, -0.2)); },
      arms: (k) => { const cols = ['#ff4d4d', '#ffd36b', '#3ec7b3', '#7b5cff']; swingArms(k, (x, d) => { for (let i = 0; i < 4; i++) k.p.set(x + i, k.ty + 12 + d, cols[i]); }); },
      legs: (k) => ankles(k, '#e8e2d2'),
    },
    gladiador: {
      torso: (c1, c2, skin) => skin, sleeve: (c1, c2, skin) => skin, pants: (c1, c2, skin) => skin, boots: () => '#6b4a2a', belt: () => '#6b4a2a',
      detail: (k) => { const { p, CX, ty, bob, shoulder, waist, skin } = k; p.rect(CX - 3, ty + 9, 6, 1, sh(skin, -0.18)); p.rect(CX - 4, ty + 12, 3, 1, sh(skin, -0.15)); p.rect(CX + 1, ty + 12, 3, 1, sh(skin, -0.15)); p.line(CX - shoulder + 1, ty + 1, CX + waist - 1, 47 + bob, '#6b4a2a', false, 3); p.set(CX - 2, ty + 9, '#c8a050'); },
      after: (k) => { const { p, CX, bob, waist, c1 } = k; for (let x = -waist - 1, i = 0; x <= waist - 1; x += 3, i++) p.rect(CX + x, 51 + bob, 2, 9, i % 2 ? sh(c1, -0.22) : c1); },
      legs: (k) => { const { p, lx, rx, legW, lL, rL } = k; for (const [x, d] of [[lx, lL], [rx, rL]]) { p.rect(x, 62 + d, legW, 8, '#b8c0c8'); p.rect(x, 62 + d, legW, 1, '#e0e6ec'); } },
      arms: (k) => { const { p, ty, armL } = k; p.ell(armL + 2, ty + 2, 5, 4, '#b8c0c8'); p.line(armL - 2, ty + 2, armL + 6, ty + 2, '#8a939d'); p.line(armL - 1, ty + 4, armL + 5, ty + 4, '#8a939d'); swingArms(k, (x, d) => k.p.rect(x, k.ty + 9 + d, 4, 4, '#6b4a2a')); },
    },
    dragonico: {
      torso: () => '#8a1c1c', sleeve: () => '#7a1818', pants: () => '#3a1414', boots: () => '#2a1010', glove: () => '#5a1010', belt: () => '#2a1010',
      back: (k) => { const { p, CX, ty } = k; for (const s of [-1, 1]) { p.poly([[CX + s * 4, ty + 2], [CX + s * 22, ty - 14], [CX + s * 27, ty + 2], [CX + s * 19, ty + 17]], '#5a1010'); for (const [a, b] of [[[22, -14], [12, 14]], [[25, -4], [16, 16]]]) p.line(CX + s * a[0], ty + a[1], CX + s * b[0], ty + b[1], '#8a2a1a'); p.poly([[CX + s * 21, ty - 15], [CX + s * 23, ty - 19], [CX + s * 24, ty - 13]], '#efe4cc'); } },
      detail: (k) => { const { p, CX, ty, bob } = k; for (let y = ty + 3, r = 0; y < 47 + bob; y += 3, r++) for (let x = -10 + (r % 2) * 2; x <= 10; x += 4) { p.set(CX + x, y, '#b83a2a'); p.set(CX + x + 1, y + 1, '#5a1010'); } p.poly([[CX - 5, ty + 3], [CX + 5, ty + 3], [CX, ty + 12]], '#d4a017'); p.rect(CX - 1, ty + 5, 2, 2, '#ff7a3a', true); },
      arms: (k) => { const { p, CX, ty, shoulder } = k; for (const [x, s] of [[CX - shoulder - 4, -1], [CX + shoulder - 3, 1]]) { p.rect(x, ty - 1, 7, 5, '#5a1010'); p.rect(x, ty - 1, 7, 1, '#b83a2a'); p.poly([[x + (s < 0 ? 0 : 6), ty - 1], [x + (s < 0 ? -3 : 9), ty - 8], [x + 3, ty - 1]], '#efe4cc'); } },
    },
    eclipse: {
      torso: () => '#14121c', sleeve: () => '#14121c', wide: true, pants: () => '#0e0c14', boots: () => '#0e0c14', belt: () => '#ffd36b', buckle: false,
      robe: { hem: 72, flare: 6, color: () => '#14121c', trim: () => '#ffd36b' },
      back: (k) => { const { p, CX, hy } = k; for (let a = 0; a < Math.PI * 2; a += 0.13) p.set(CX + Math.cos(a) * 16, hy - 3 + Math.sin(a) * 16, a > Math.PI ? '#ffd36b' : '#c8a8ff', true); },
      detail: (k) => { const { p, CX, ty, shoulder } = k; p.rect(CX - shoulder, ty, shoulder * 2, 2, '#ffd36b'); for (let a = 0; a < Math.PI * 2; a += 0.4) p.set(CX + Math.cos(a) * 4, ty + 9 + Math.sin(a) * 4, '#ffd36b', true); p.ell(CX + 1, ty + 9, 2.5, 2.5, '#d8d8f0'); p.ell(CX + 2, ty + 8, 2, 2, '#14121c'); for (const [x, y] of [[-8, 26], [7, 29], [-3, 33], [9, 22]]) p.set(CX + x, ty + y, '#c8a8ff', true); },
    },
    sakura: {
      torso: () => '#f7c6d6', sleeve: () => '#f7c6d6', wide: true, pants: () => '#c8507a', boots: () => '#3a2a2a', noBelt: true,
      robe: { hem: 72, flare: 5, color: () => '#f2b3c8', trim: () => '#c8507a' },
      detail: (k) => { const { p, CX, ty, shoulder } = k; p.line(CX - shoulder + 2, ty, CX + 3, ty + 12, '#ffffff', false, 2); p.line(CX + shoulder - 2, ty, CX - 2, ty + 9, '#f0e0e6', false, 2); for (const [x, y] of [[-7, 4], [6, 7], [-4, 15], [5, 2], [-2, 27], [7, 31], [-8, 34], [3, 37]]) { p.set(CX + x, ty + y, '#ffffff', true); p.set(CX + x + 1, ty + y, '#ff8ab0', true); } },
      after: (k) => { const { p, CX, bob, waist } = k; p.rect(CX - waist - 1, 44 + bob, waist * 2 + 2, 6, '#c8507a'); p.rect(CX - waist - 1, 44 + bob, waist * 2 + 2, 1, '#e87aa0'); p.rect(CX - 2, 45 + bob, 4, 4, '#ffd36b'); p.set(CX - 1, 46 + bob, '#fff2b8', true); },
      arms: (k) => swingArms(k, (x, d) => { k.p.set(x + 1, k.ty + 5 + d, '#ffffff', true); k.p.set(x + 2, k.ty + 9 + d, '#ff8ab0', true); }),
    },
  };
  CH.XO = XO;

  // ---------------- desenho ----------------
  CH.draw = (o) => {
    const p = new E.SP.Px(W, H);
    // quadros de pesca podem levar o tipo da vara: 'fhold:2'
    let [f, rodTier] = (o.frame || 'idle0').split(':');
    // sentado: 's' antes do quadro de pesca ('sfhold:2') ou parado numa cadeira ('sit0'/'sit1'); o corpo desce e as pernas dobram
    const seated = /^s(f(cast0|cast1|hold|bite|reel0|reel1|catch)|it[01])$/.test(f);
    if (seated) f = f.startsWith('sit') ? 'idle' + f[3] : f.slice(1);
    const L = o.look, sp = o.species || 'humano';
    const customHair = E.Skins && E.Skins.has('hair', L.hairPreset);
    const skin = L.skin, hair = L.hair, c1 = L.c1, c2 = L.c2;
    const atk = f === 'atk';
    // ---- pose: ciclo de caminhada de 12 quadros (w0…w11), pulo (jump0 agachar, jump1 subir, jump2 cair, land pousar)
    //      e pesca (fcast0/fcast1 lançar, fhold segurar, freel0/freel1 puxar, fcatch mostrar o peixe)
    let bob = f === 'idle1' ? 1 : 0, lL = 0, rL = 0, aL = 0, aR = 0, arms = 'swing', spread = 0, crouch = 0, sway = 0;
    let rArm = atk ? 'atk' : 'swing';
    const fishPose = /^f(cast0|cast1|hold|bite|reel0|reel1|catch)$/.test(f);
    const fastSwim = f.startsWith('swimfast');
    const swim = /^swim(?:fast)?([0-7])$/.exec(f), swimPhase = swim ? Number(swim[1]) / 8 * Math.PI * 2 : 0;
    const twoHands = !!o.twoHands && !fishPose && !swim;
    if (swim) { bob = Math.round(Math.sin(swimPhase * 2) * (fastSwim ? 1.5 : 1)); arms = rArm = 'swim'; }
    if (fastSwim && swim) { lL = Math.round(Math.sin(swimPhase) * 5); rL = -lL; }

    const wm = /^w(\d+)$/.exec(f) || /^walk(\d)$/.exec(f);
    if (wm) {
      const i = f.startsWith('walk') ? +wm[1] * 3 : +wm[1];
      const ph = i / 12 * Math.PI * 2, sn = Math.sin(ph);
      lL = -Math.round(Math.max(0, sn) * 3.6); rL = -Math.round(Math.max(0, -sn) * 3.6);
      aL = Math.round(-sn * 2.6); aR = -aL;
      bob = Math.abs(sn) < 0.4 ? 1 : 0;
      sway = Math.round(Math.cos(ph) * 0.6);
    }
    if (f === 'fcast0') { rArm = 'up'; sway = -1; aL = -1; }
    if (f === 'fcast1') { rArm = 'fwdHi'; sway = 1; aL = 1; }
    if (f === 'fhold') rArm = 'fwd';
    if (f === 'fbite') { rArm = 'fwd'; sway = 1; aL = 1; }
    if (f === 'freel0') { rArm = 'fwd'; sway = -1; lL = -1; aL = -2; }
    if (f === 'freel1') { rArm = 'fwdLo'; sway = -1; bob += 1; aL = -1; rL = -1; }
    if (f === 'fcatch') { rArm = 'up'; arms = 'up'; }
    if (f === 'jump0' || f === 'land') { crouch = 3; aL = aR = 2; }
    if (f === 'jump1') { lL = rL = -5; arms = 'up'; }
    if (f === 'jump2') { spread = 2; arms = 'out'; lL = -1; }
    if (twoHands) arms = rArm = 'grip';
    if (seated) { lL = rL = 0; sway = Math.max(-1, Math.min(1, sway)); crouch = 0; bob = (f === 'freel1' || f === 'idle1' ? 1 : 0) + 8; }
    bob += crouch;
    // Medidas nativas de cada porte: músculo afunila na cintura; volume arredonda o abdômen.
    // Médio e magro conservam as medidas antigas; espécie soma apenas a sua estrutura visual.
    const build = L.build === 'forte' || L.build === 'gordo' || L.build === 'magro' ? L.build : 'medio';
    const muscular = build === 'forte', stout = build === 'gordo';
    const speciesWidth = sp === 'anao' || sp === 'golias' ? 2 : sp === 'orc' ? 1 : 0;
    const measures = { magro: [9, 7, 5], medio: [10, 8, 6], forte: [13, 8, 8], gordo: [11, 14, 8] }[build];
    const shoulder = measures[0] + speciesWidth, waist = measures[1] + speciesWidth;
    const legW = muscular || stout ? measures[2] + Math.round(speciesWidth / 2) : 5 + Math.round(((build === 'magro' ? 0 : 1) + speciesWidth) / 2);
    const belly = stout ? waist + 3 : waist;
    const outfit = L.outfit;
    const XS = XO[outfit] || null;
    const dark = sh(c1, -0.3), light = sh(c1, 0.22);
    const boots = XS && XS.boots ? XS.boots(c1, c2) : outfit === 'cavaleiro' || outfit === 'aurora' ? sh(c1, -0.35) : '#4a3022';
    const pants = XS && XS.pants ? XS.pants(c1, c2, skin) : { manto: sh(c1, -0.2), oriental: sh(c1, -0.35), sacerdote: '#e8e2d0', nobre: '#2a2a34', vestido: sh(c1, -0.2), tribal: '#6b4a2a', estelar: '#1a1d3a', aurora: '#e6e9ef', apostador: '#1a1a22' }[outfit] || sh(c2, -0.25);
    const ty = 33 + bob; // topo do tronco
    const hy = 21 + bob + (fastSwim && swim ? 2 : 0); // aceleração: cabeça baixa na água
    const longRobe = ['manto', 'sacerdote', 'vestido', 'oriental', 'estelar'].includes(outfit);
    const k = { p, CX, ty, hy, bob, shoulder, waist, c1, c2, skin, hair, legW, lL, rL, aL, aR, arms, rArm, build, belly };

    // ===== camadas de trás =====
    const hasCape = ['aventureiro', 'cavaleiro', 'nobre', 'estelar', 'aurora'].includes(outfit);
    const cape = L.cape && L.cape !== 'auto' ? L.cape : hasCape ? 'curta' : 'nenhuma';
    const cc = outfit === 'aurora' ? '#e8c46a' : outfit === 'estelar' ? '#1c2150' : sh(c2, -0.28);
    if (cape === 'curta') p.poly([[CX - shoulder + 1, ty + 1], [CX + shoulder - 1, ty + 1], [CX + shoulder + 3, 59], [CX - shoulder - 3, 59]], cc);
    if (cape === 'longa') { p.poly([[CX - shoulder + 1, ty + 1], [CX + shoulder - 1, ty + 1], [CX + shoulder + 5, 73], [CX - shoulder - 5, 73]], cc); p.rect(CX - shoulder - 5, 72, (shoulder + 5) * 2, 1, sh(cc, 0.2)); }
    if (cape === 'esfarrapada') { const ec = sh(cc, -0.1); p.poly([[CX - shoulder + 1, ty + 1], [CX + shoulder - 1, ty + 1], [CX + shoulder + 4, 66], [CX - shoulder - 4, 66]], ec); for (let x = -shoulder - 4, i = 0; x < shoulder + 4; x += 4, i++) p.poly([[CX + x, 66], [CX + x + 4, 66], [CX + x + 2, 70 + (i % 2) * 3]], ec); }
    if (cape === 'pele') p.poly([[CX - shoulder, ty], [CX + shoulder, ty], [CX + shoulder + 3, 55], [CX - shoulder - 3, 55]], '#6b4a2e');
    if (XS && XS.back) XS.back(k);
    if (customHair) { if (L.acc !== 'capuz') E.Skins.hairPart(p, L, CX, hy, 'back'); }
    else {
    if (L.hairStyle === 10) for (const s of [-1, 1]) { p.poly([[CX + s * 14, hy - 1], [CX + s * 19, hy + 2], [CX + s * 18, hy + 17], [CX + s * 14, hy + 13]], sh(hair, -0.08)); p.ell(CX + s * 15, hy - 3, 3.5, 3.5, hair); p.rect(CX + s * 15 - 1, hy, 3, 2, c2); }
    if (L.hairStyle === 11) p.ell(CX, hy - 6, 18, 15, sh(hair, -0.12));
    if (L.hairStyle === 13) { p.poly([[CX - 13, hy - 6], [CX + 13, hy - 6], [CX + 15, 54], [CX - 15, 54]], sh(hair, -0.18)); for (let y = hy; y < 54; y += 5) { p.ell(CX - 15, y, 2, 2.5, sh(hair, -0.18)); p.ell(CX + 15, y + 2, 2, 2.5, sh(hair, -0.18)); } }
    if (L.hairStyle === 1) p.poly([[CX - 13, hy - 6], [CX + 13, hy - 6], [CX + 14, 50], [CX - 14, 50]], sh(hair, -0.18));
    if (L.hairStyle === 2) { p.ell(CX + 12, hy - 4, 4, 4, hair); p.poly([[CX + 11, hy - 2], [CX + 17, hy + 2], [CX + 19, hy + 22], [CX + 14, hy + 26], [CX + 13, hy + 8]], sh(hair, -0.08)); }
    }
    if (sp === 'tiferino') { p.line(CX + 5, 58, CX + 14, 62, skin, false, 3); p.line(CX + 14, 62, CX + 17, 54, skin, false, 3); p.poly([[CX + 15, 49], [CX + 20, 53], [CX + 16, 55]], sh(skin, -0.25)); }
    if (L.acc === 'capuz' || (outfit === 'ladrao' && L.acc === 'classe')) p.poly([[CX - 14, hy], [CX + 14, hy], [CX + 12, ty + 6], [CX - 12, ty + 6]], sh(c1, -0.25));

    // Batidas alternadas: pés rompem a superfície atrás dos flancos no nado acelerado.
    if (fastSwim && swim) for (const side of [-1, 1]) {
      const kick = Math.sin(swimPhase + (side < 0 ? Math.PI : 0));
      const hipX = CX + side * (waist - 2), kneeX = CX + side * (waist + 4 + Math.max(0, kick) * 2);
      const kneeY = 51 + kick * 2, footX = kneeX + side * (2 + Math.max(0, kick) * 2);
      p.line(hipX, 52 + bob, kneeX, kneeY, pants, false, legW);
      p.line(kneeX, kneeY, footX, 49 - Math.max(0, kick) * 4, boots, false, Math.max(3, legW - 2));
      p.line(footX, 49 - Math.max(0, kick) * 4, footX + side * 2, 48 - Math.max(0, kick) * 4, sh(boots, .2), false, 3);
    }

    // ===== pernas =====
    const legTop = 52 + bob;
    const lx = CX - 1 - legW - spread + sway, rx = CX + 1 + spread + sway;
    Object.assign(k, { legTop, lx, rx });
    // Sentado mantém as pernas dobradas; o contorno em pé usa joelhos em alturas fixas.
    if ((muscular || stout) && !seated) {
      for (const [x, d] of [[lx, lL], [rx, rL]]) {
        if (muscular) {
          // Coxa cheia, joelho estreito e panturrilha própria; a animação mantém os mesmos pés.
          p.poly([[x, legTop], [x + legW, legTop], [x + legW, 58 + d], [x + legW - 1, 61 + d], [x + legW, 65 + d], [x + legW - 1, 71 + d], [x + 2, 71 + d], [x + 1, 66 + d], [x, 64 + d], [x + 1, 60 + d]], pants);
          p.line(x + 1, legTop + 2, x + 2, 58 + d, sh(pants, 0.22), false, 2);
          p.line(x + legW - 2, legTop + 3, x + legW - 2, 58 + d, sh(pants, -0.2));
          p.line(x + 2, 63 + d, x + 2, 67 + d, sh(pants, 0.16));
          p.line(x + legW - 2, 64 + d, x + legW - 3, 69 + d, sh(pants, -0.24));
          p.rect(x + 2, 60 + d, legW - 3, 1, sh(pants, -0.14));
        } else {
          p.poly([[x, legTop], [x + legW, legTop], [x + legW, 62 + d], [x + legW - 1, 69 + d], [x + legW - 1, 72 + d], [x + 1, 72 + d], [x, 67 + d]], pants);
          p.line(x + 1, legTop + 2, x + 1, 66 + d, sh(pants, 0.13));
          p.line(x + legW - 1, 57 + d, x + legW - 2, 69 + d, sh(pants, -0.13));
        }
      }
    } else {
      p.rect(lx, legTop, legW, 72 - legTop + lL, pants);
      p.rect(rx, legTop, legW, 72 - legTop + rL, pants);
      p.rect(lx, legTop, 1, 72 - legTop + lL, sh(pants, 0.15));
    }
    if (seated) { // coxas voltadas para a frente (topo claro) e joelhos marcados
      p.rect(lx - 1, legTop, legW + 1, 4, sh(pants, 0.12)); p.rect(rx, legTop, legW + 1, 4, sh(pants, 0.12));
      p.rect(lx - 1, legTop, legW + 1, 1, sh(pants, 0.3)); p.rect(rx, legTop, legW + 1, 1, sh(pants, 0.3));
      p.rect(lx, legTop + 4, legW, 1, sh(pants, -0.2)); p.rect(rx, legTop + 4, legW, 1, sh(pants, -0.2));
    }
    if (sp === 'pequenino') { // pés descalços e peludos
      for (const [x, d] of [[lx, lL], [rx, rL]]) { p.rect(x - 1, 70 + d, legW + 3, 4, skin); p.rect(x - 1, 73 + d, legW + 3, 1, sh(skin, -0.25)); p.set(x, 70 + d, hair); p.set(x + 2, 69 + d, hair); p.set(x + legW - 1, 70 + d, hair); for (let k = 0; k < 3; k++) p.set(x + legW - 1 + k, 73 + d, sh(skin, -0.38)); }
    } else {
      p.rect(lx - 1, 70 + lL, legW + 2, 5, boots);
      p.rect(rx - 1, 70 + rL, legW + 2, 5, boots);
      p.rect(lx - 1, 70 + lL, legW + 2, 1, sh(boots, 0.25));
      p.rect(rx - 1, 70 + rL, legW + 2, 1, sh(boots, 0.25));
    }

    if (XS && XS.legs) XS.legs(k);

    // ===== saia / robe =====
    if (XS && XS.robe) {
      const R = XS.robe, rc = R.color(c1, c2), flare = R.flare, hem = R.hem;
      p.poly([[CX - waist, 48 + bob], [CX + waist, 48 + bob], [CX + waist + flare, hem], [CX - waist - flare, hem]], rc);
      if (R.pleats) for (let x = -waist - flare + 3; x < waist + flare - 1; x += 3) p.line(CX + Math.round(x * 0.8), 52 + bob, CX + x, hem - 1, sh(rc, -0.16));
      if (R.split) p.rect(CX - 1, 56 + bob, 2, hem - 56 - bob, sh(rc, -0.3));
      if (R.open) p.poly([[CX - 1, 50 + bob], [CX + 1, 50 + bob], [CX + 3, hem], [CX - 3, hem]], pants);
      if (R.trim) p.rect(CX - waist - flare, hem - 2, (waist + flare) * 2, 2, R.trim(c1, c2));
    }
    if (longRobe) {
      const hem = outfit === 'vestido' ? 64 : 71;
      const flare = outfit === 'vestido' ? 9 : 4;
      const rc = outfit === 'oriental' ? sh(c1, -0.15) : outfit === 'estelar' ? '#1f2350' : c1;
      p.poly([[CX - waist, 48 + bob], [CX + waist, 48 + bob], [CX + waist + flare, hem], [CX - waist - flare, hem]], rc);
      p.rect(CX - waist - flare, hem - 2, (waist + flare) * 2, 2, outfit === 'estelar' ? '#ffd36b' : c2);
      if (outfit === 'vestido') for (let x = -waist - flare + 2; x < waist + flare; x += 4) p.rect(CX + x, 52 + bob, 1, hem - 54 - bob, sh(c1, -0.12));
      if (outfit === 'oriental') p.rect(CX - 1, 48 + bob, 2, hem - 48 - bob, c2);
    }
    if (outfit === 'tribal') p.poly([[CX - waist - 1, 48 + bob], [CX + waist + 1, 48 + bob], [CX + waist + 3, 60], [CX - waist - 3, 60]], c2);

    // ===== tronco =====
    const torso = XS && XS.torso ? XS.torso(c1, c2, skin) : outfit === 'tribal' ? skin : outfit === 'estelar' ? '#232a5e' : outfit === 'aurora' ? '#f2f2f6' : outfit === 'apostador' ? '#1e1e26' : c1;
    if (muscular) {
      p.poly([[CX - shoulder + 2, ty], [CX + shoulder - 2, ty], [CX + shoulder, ty + 3], [CX + shoulder - 1, ty + 8], [CX + waist, 50 + bob], [CX - waist, 50 + bob], [CX - shoulder + 1, ty + 8], [CX - shoulder, ty + 3]], torso);
      const bare = torso === skin, contour = sh(torso, bare ? -0.25 : -0.13), sheen = sh(torso, bare ? 0.18 : 0.1);
      // Peitorais e laterais em grupos de pixels, sem desenhar abdominais sobre armadura.
      p.poly([[CX - shoulder + 2, ty + 3], [CX - 2, ty + 3], [CX - 2, ty + 8], [CX - shoulder + 4, ty + 8]], sheen);
      p.line(CX - shoulder + 3, ty + 8, CX - 3, ty + 9, contour);
      p.line(CX + 2, ty + 9, CX + shoulder - 3, ty + 8, contour);
      p.line(CX - shoulder + 3, ty + 10, CX - waist + 1, ty + 15, contour);
      p.line(CX + shoulder - 3, ty + 10, CX + waist - 1, ty + 15, contour);
      if (bare) {
        p.line(CX, ty + 4, CX, ty + 10, contour);
        for (const y of [ty + 11, ty + 14]) { p.rect(CX - 4, y, 3, 1, contour); p.rect(CX + 1, y, 3, 1, contour); p.rect(CX - 3, y - 1, 2, 1, sheen); }
      }
    } else if (stout) {
      p.poly([[CX - shoulder + 1, ty], [CX + shoulder - 1, ty], [CX + shoulder + 1, ty + 4], [CX + belly - 1, ty + 8], [CX + belly, ty + 12], [CX + belly - 1, ty + 15], [CX + waist, 50 + bob], [CX - waist, 50 + bob], [CX - belly + 1, ty + 15], [CX - belly, ty + 12], [CX - belly + 1, ty + 8], [CX - shoulder - 1, ty + 4]], torso);
      p.poly([[CX - shoulder + 2, ty + 4], [CX - 3, ty + 5], [CX - 4, ty + 14], [CX - belly + 3, ty + 13], [CX - belly + 2, ty + 9]], sh(torso, 0.11));
      p.line(CX + belly - 2, ty + 8, CX + belly - 2, ty + 13, sh(torso, -0.19));
      p.line(CX - waist + 3, ty + 16, CX + waist - 3, ty + 16, sh(torso, -0.14));
      if (torso === skin) { p.rect(CX, ty + 12, 2, 1, sh(skin, -0.24)); p.set(CX + 1, ty + 13, sh(skin, 0.14)); }
    } else {
      p.poly([[CX - shoulder, ty + 1], [CX + shoulder, ty + 1], [CX + waist, 50 + bob], [CX - waist, 50 + bob]], torso);
      p.rect(CX - shoulder, ty, shoulder * 2, 3, torso);
    }
    if (outfit === 'tribal') { p.poly([[CX - shoulder - 2, ty - 1], [CX + shoulder + 2, ty - 1], [CX + shoulder - 2, ty + 6], [CX - shoulder + 2, ty + 6]], c1); if (!muscular && !stout) { p.rect(CX - 3, ty + 9, 6, 1, sh(skin, -0.18)); p.rect(CX - 4, ty + 12, 3, 1, sh(skin, -0.15)); p.rect(CX + 1, ty + 12, 3, 1, sh(skin, -0.15)); } }
    if (outfit === 'cavaleiro' || outfit === 'aurora') {
      const metal = outfit === 'aurora' ? '#f6f2e4' : c1, trim = outfit === 'aurora' ? '#ffd36b' : sh(c1, 0.35);
      p.rect(CX - shoulder - 3, ty - 1, 6, 6, metal); p.rect(CX + shoulder - 3, ty - 1, 6, 6, metal);
      p.rect(CX - shoulder - 3, ty - 1, 6, 1, trim); p.rect(CX + shoulder - 3, ty - 1, 6, 1, trim);
      p.poly([[CX - 5, ty + 4], [CX + 5, ty + 4], [CX + 4, 54 + bob], [CX - 4, 54 + bob]], outfit === 'aurora' ? '#ffd98a' : c2);
      p.rect(CX - 1, ty + 7, 2, 6, outfit === 'aurora' ? '#fff' : '#ffd36b', outfit === 'aurora'); p.rect(CX - 3, ty + 9, 6, 2, outfit === 'aurora' ? '#fff' : '#ffd36b', outfit === 'aurora');
      if (outfit === 'aurora') { p.rect(CX - shoulder - 1, ty + 1, 2, 2, '#7fe8ff', true); p.rect(CX + shoulder - 1, ty + 1, 2, 2, '#7fe8ff', true); }
    }
    if (outfit === 'aventureiro') { p.poly([[CX - 4, ty], [CX + 4, ty], [CX, ty + 6]], sh(c1, -0.25)); p.rect(CX - shoulder, ty, shoulder * 2, 2, c2); }
    if (outfit === 'ladrao') { p.rect(CX - 6, ty - 1, 12, 4, c2); p.poly([[CX + 4, ty + 2], [CX + 8, ty + 2], [CX + 7, ty + 9]], c2); p.line(CX - shoulder + 1, ty + 2, CX + waist, 48 + bob, sh(c1, -0.35)); }
    if (outfit === 'explorador') { p.rect(CX - shoulder - 1, ty - 1, shoulder * 2 + 2, 4, '#e8dcc0'); p.rect(CX - 1, ty + 3, 2, 14, sh(c1, -0.25)); p.line(CX - shoulder, ty + 2, CX + waist + 2, 50, '#6b4a2a', false, 2); p.rect(CX + waist - 1, 46 + bob, 5, 5, '#8a5a32'); p.rect(CX - 5, ty - 2, 10, 3, c2); }
    if (outfit === 'oriental') { p.line(CX - shoulder + 2, ty, CX + 3, ty + 12, c2, false, 2); p.line(CX + shoulder - 2, ty, CX - 2, ty + 9, sh(c2, -0.2), false, 2); }
    if (outfit === 'nobre') { p.poly([[CX - 4, ty], [CX + 4, ty], [CX + 3, 50 + bob], [CX - 3, 50 + bob]], c2); for (let y = ty + 4; y < 48; y += 4) { p.set(CX - 5, y + bob, '#ffd36b'); p.set(CX + 4, y + bob, '#ffd36b'); } p.rect(CX - 2, ty, 4, 3, '#ffffff'); p.rect(CX - shoulder, ty, 2, 16, '#ffd36b'); p.rect(CX + shoulder - 2, ty, 2, 16, '#ffd36b'); }
    if (outfit === 'apostador') { p.poly([[CX - 4, ty], [CX + 4, ty], [CX + 3, 47 + bob], [CX - 3, 47 + bob]], '#a8242c'); p.poly([[CX - 2, ty], [CX + 2, ty], [CX, ty + 6]], '#ffffff'); p.rect(CX - 1, ty + 1, 2, 2, '#1a1a1a'); p.line(CX - 5, ty, CX - 3, ty + 10, '#ffd36b'); p.line(CX + 4, ty, CX + 2, ty + 10, '#ffd36b'); for (let y = ty + 8; y < 46; y += 4) p.set(CX, y + bob, '#ffd36b', true); }
    if (outfit === 'sacerdote') { p.poly([[CX - 4, ty], [CX + 4, ty], [CX + 4, 70], [CX - 4, 70]], c2); p.rect(CX - 1, ty + 4, 2, 8, '#ffffff', true); p.rect(CX - 3, ty + 6, 6, 2, '#ffffff', true); }
    if (outfit === 'manto') { p.rect(CX - shoulder, ty, shoulder * 2, 2, c2); p.rect(CX - 1, ty + 2, 2, 46 - ty, c2); }
    if (outfit === 'vestido') { p.poly([[CX - 3, ty + 1], [CX + 3, ty + 1], [CX, ty + 5]], skin); p.rect(CX - 5, 47 + bob, 10, 2, c2); p.poly([[CX - 5, 46 + bob], [CX - 1, 48 + bob], [CX - 5, 50 + bob]], c2); p.poly([[CX + 5, 46 + bob], [CX + 1, 48 + bob], [CX + 5, 50 + bob]], c2); }
    if (outfit === 'estelar') { for (const [sx, sy] of [[-5, 4], [4, 7], [-2, 12], [6, 13], [-6, 20], [2, 24], [-3, 30], [5, 31]]) p.set(CX + sx, ty + sy, '#fff6c8', true); p.rect(CX - shoulder, ty, shoulder * 2, 2, '#ffd36b'); p.rect(CX - 1, ty + 2, 2, 12, '#ffd36b'); }
    if (XS && XS.detail) XS.detail(k);
    // cinto
    if (!['vestido', 'sacerdote', 'tribal'].includes(outfit) && !(XS && XS.noBelt)) { p.rect(CX - waist, 48 + bob, waist * 2, 3, XS && XS.belt ? XS.belt(c1, c2) : outfit === 'oriental' ? c2 : '#5a3a22'); if (!XS || XS.buckle !== false) p.rect(CX - 2, 48 + bob, 4, 3, '#ffd36b'); }
    if (XS && XS.after) XS.after(k);

    // ===== braços =====
    const sleeve = XS && XS.sleeve ? XS.sleeve(c1, c2, skin) : ['tribal'].includes(outfit) ? skin : outfit === 'estelar' ? '#232a5e' : outfit === 'aurora' ? '#f2f2f6' : c1;
    const wide = ['manto', 'oriental', 'sacerdote', 'estelar'].includes(outfit) || !!(XS && XS.wide);
    const armL = CX - shoulder - 4, armR = CX + shoulder;
    Object.assign(k, { armL, armR });
    const gl = XS && XS.glove ? XS.glove(c1, c2) : skin; // mãos (luvas em algumas roupas)
    const armMass = muscular ? 2 : stout ? 1 : 0;
    const limbBar = (x, y, w, h, col) => {
      if (!armMass) { p.rect(x, y, w, h, col); return; }
      if (h > w) {
        if (muscular) {
          p.poly([[x - 1, y], [x + 5, y], [x + 6, y + 3], [x + 6, y + 6], [x + 4, y + 9], [x + 5, y + 11], [x + 4, y + h], [x, y + h], [x - 1, y + 11], [x, y + 9], [x - 2, y + 6], [x - 2, y + 3]], col);
          p.line(x - 1, y + 3, x - 1, y + 6, sh(col, 0.23));
          p.line(x + 4, y + 4, x + 4, y + 7, sh(col, -0.24));
          p.rect(x + 1, y + 8, 3, 1, sh(col, -0.2));
          p.line(x, y + 10, x, y + 12, sh(col, 0.16));
        } else {
          p.poly([[x, y], [x + 4, y], [x + 5, y + 3], [x + 5, y + 9], [x + 4, y + h], [x, y + h], [x - 1, y + 9], [x - 1, y + 3]], col);
          p.line(x, y + 3, x, y + h - 3, sh(col, 0.12));
          p.line(x + 4, y + 4, x + 4, y + h - 3, sh(col, -0.13));
        }
      } else {
        p.poly([[x, y - 1], [x + 3, y - armMass], [x + w - 3, y - armMass], [x + w, y], [x + w, y + 4], [x + w - 3, y + 4 + armMass], [x + 3, y + 4 + armMass], [x, y + 5]], col);
        p.line(x + 2, y - 1, x + w - 3, y - 1, sh(col, muscular ? 0.22 : 0.11));
        p.line(x + 3, y + 4, x + w - 3, y + 4, sh(col, muscular ? -0.23 : -0.12));
      }
    };
    const limbLine = (x0, y0, x1, y1, col, width) => {
      p.line(x0, y0, x1, y1, col, false, width + (armMass ? muscular ? 2 : 1 : 0));
      if (armMass) p.line(x0 - 1, y0 - 1, x1 - 1, y1 - 1, sh(col, muscular ? 0.17 : 0.1));
    };
    let weaponPalm = [armR + 2, ty + 15 + aR], secondPalm = null;
    if (swim) {
      const stroke = (side, phase) => {
        const shoulderX = CX + side * shoulder, elbowX = CX + side * (shoulder + 5 + Math.cos(phase) * 3);
        // Normal: remada aberta. Acelerado: recuperação alta e puxada alternada de crawl.
        const elbowY = ty + (fastSwim ? -1 + Math.sin(phase) * 10 : 7 + Math.sin(phase) * 4);
        const palmX = CX + side * (fastSwim ? shoulder + 2 + Math.cos(phase + .6) * 5 : shoulder + 8 + Math.cos(phase + .6) * 5);
        const palmY = ty + (fastSwim ? -6 + Math.sin(phase + .6) * 13 : 9 + Math.sin(phase + .6) * 5);
        limbLine(shoulderX, ty + 3, elbowX, elbowY, sleeve, 4);
        limbLine(elbowX, elbowY, palmX, palmY, skin, 3);
        if (armMass) p.ell(shoulderX, ty + 3, muscular ? 4 : 3, 3, sleeve);
        p.ell(palmX, palmY, 2.3, 1.8, skin);
      };
      stroke(-1, swimPhase); stroke(1, swimPhase + Math.PI);
    } else if (twoHands) {
      weaponPalm = [CX + (atk ? 14 : 10), ty + (atk ? 7 : 14)];
      secondPalm = [weaponPalm[0] - 4, weaponPalm[1] + 4];
      // Both forearms meet the same handle; the left hand is lower on the grip.
      limbLine(armL + 2, ty + 3, CX - 1, ty + 14, sleeve, 4);
      limbLine(CX - 1, ty + 14, secondPalm[0], secondPalm[1], sleeve, 4);
      limbLine(armR + 1, ty + 3, weaponPalm[0] + 1, weaponPalm[1] - 4, sleeve, 4);
      if (armMass) { p.ell(armL + 2, ty + 3, muscular ? 4 : 3, 3, sleeve); p.ell(armR + 1, ty + 3, muscular ? 4 : 3, 3, sleeve); }
      p.ell(secondPalm[0], secondPalm[1], 2.7, 2.2, gl);
      p.ell(weaponPalm[0], weaponPalm[1], 2.7, 2.2, gl);
    } else if (arms === 'up') { limbBar(armL, ty - 11, 4, 13, sleeve); p.rect(armL, ty - 14, 4, 4, gl); }
    else if (arms === 'out') { limbBar(armL - 9, ty + 1, 13, 4, sleeve); p.rect(armL - 12, ty + 1, 4, 4, gl); }
    else {
      if (wide) p.poly([[armL - armMass, ty + 1], [armL + 4 + armMass, ty + 1], [armL + 5 + armMass, 46 + aL], [armL - 2 - armMass, 46 + aL]], sleeve);
      else limbBar(armL, ty + 1 + aL, 4, 13, sleeve);
      p.rect(armL, ty + 13 + aL, 4, 4, gl);
    }
    let hand = null;
    if (swim || twoHands) { /* arms already posed above */ }
    else if (rArm === 'atk') { limbBar(armR, ty + 3, 10, 4, sleeve); p.rect(armR + 9, ty + 3, 4, 4, gl); weaponPalm = [armR + 11, ty + 5]; }
    else if (rArm === 'up') { limbBar(armR, ty - 11, 4, 13, sleeve); p.rect(armR, ty - 14, 4, 4, gl); hand = [armR + 2, ty - 12]; }
    else if (rArm === 'fwdHi') { limbBar(armR, ty - 1, 10, 4, sleeve); p.rect(armR + 9, ty - 2, 4, 4, gl); hand = [armR + 11, ty]; }
    else if (rArm === 'fwd') { limbBar(armR, ty + 3, 9, 4, sleeve); p.rect(armR + 8, ty + 3, 4, 4, gl); hand = [armR + 10, ty + 5]; }
    else if (rArm === 'fwdLo') { limbBar(armR, ty + 6, 8, 4, sleeve); p.rect(armR + 7, ty + 6, 4, 4, gl); hand = [armR + 9, ty + 8]; }
    else {
      if (wide) p.poly([[armR - armMass, ty + 1], [armR + 4 + armMass, ty + 1], [armR + 6 + armMass, 46 + aR], [armR - 1 - armMass, 46 + aR]], sleeve);
      else limbBar(armR, ty + 1 + aR, 4, 13, sleeve);
      p.rect(armR, ty + 13 + aR, 4, 4, gl);
    }
    if ((outfit === 'ladrao' || outfit === 'cavaleiro') && arms === 'swing') { p.rect(armL - (armMass ? 1 : 0), ty + 10 + aL, 4 + (armMass ? 2 : 0), 3, outfit === 'ladrao' ? '#5a3a22' : sh(c1, -0.2)); if (!atk) p.rect(armR - (armMass ? 1 : 0), ty + 10 + aR, 4 + (armMass ? 2 : 0), 3, outfit === 'ladrao' ? '#5a3a22' : sh(c1, -0.2)); }
    // golias: marcas de pedra (litodermas) nos braços
    if (sp === 'golias') { const mk = sh(skin, -0.42); for (const ax of [armR, arms === 'swing' ? armL : null]) if (ax !== null) { p.line(ax, ty + 4, ax + 3, ty + 7, mk); p.line(ax + 3, ty + 7, ax + 1, ty + 10, mk); p.set(ax + 2, ty + 3, mk); } }

    if (XS && XS.arms && !fastSwim) XS.arms(k);
    if (cape === 'pele') { p.ell(CX, ty + 1, shoulder + 4, 3.5, '#e8e0d0'); for (let x = -shoulder - 3; x <= shoulder + 3; x += 2) p.set(CX + x, ty + 3 + (x % 4 ? 1 : 0), '#c8bca8'); }

    // ===== feições de cada espécie (Livro do Jogador 2024) =====
    const HS = Object.assign({ rx: 12, ry: 11.5, jaw: 6, ears: null, nose: 'small', eyeH: 6, brow: false }, {
      humano: { ears: 'round' },
      elfo: { rx: 11, ry: 12, jaw: 4, ears: 'elf', eyeH: 4, nose: 'thin' },
      anao: { rx: 12.5, ry: 11, jaw: 8, ears: 'round', nose: 'big', brow: true, neck: 1 },
      pequenino: { rx: 12.5, ry: 12, jaw: 6, ears: 'round', nose: 'button', eyeH: 6 },
      gnomo: { rx: 12, ry: 11.5, jaw: 5, ears: 'gnome', nose: 'round', eyeH: 7 },
      orc: { rx: 12.5, ry: 11, jaw: 9, ears: 'orc', nose: 'flat', brow: true, eyeH: 5, neck: 2 },
      golias: { rx: 12, ry: 11.5, jaw: 8, ears: 'round', nose: 'small', brow: true, eyeH: 5, neck: 2 },
      tiferino: { ears: 'orc', eyeH: 6 },
      aasimar: { ears: 'round' },
    }[sp] || {});

    if (L.presentation === 'feminina') HS.jaw = Math.max(3, HS.jaw - 1);
    if (L.presentation === 'masculina') HS.jaw = Math.min(10, HS.jaw + 1);

    // ===== pescoço e cabeça =====
    const drac = sp === 'draconato';
    const eyeC = sp === 'tiferino' ? '#ffcf5a' : sp === 'aasimar' ? '#9fe3ff' : drac ? (L.eyes === '#3a2a20' ? '#ffcf5a' : L.eyes) : L.eyes;
    // draconato: cabeça de dragão vista de frente (focinho, placas da garganta, chifres, babados e olhos de réptil)
    const dragonHead = (hooded) => {
      const belly = E.SP.mix(skin, '#f4e8c8', 0.5), dk = sh(skin, -0.32), dk2 = sh(skin, -0.55), hl = sh(skin, 0.24);
      const hornC = E.SP.mix(skin, '#efe4cc', 0.7), hornD = sh(hornC, -0.3);
      if (E.Skins) { E.Skins.dragonHorns(p, L, CX, hy, hooded); if (!hooded) E.Skins.dragonCrest(p, L, CX, hy); }
      if (!hooded && (!L.dragonHorns || L.dragonHorns === 'auto')) for (const s of [-1, 1]) {
        p.line(CX + s * 6, hy - 7, CX + s * 12, hy - 14, hornD, false, 4);
        p.line(CX + s * 12, hy - 14, CX + s * 15, hy - 21, hornC, false, 3);
        p.line(CX + s * 15, hy - 21, CX + s * 14, hy - 26, hornC, false, 2);
        p.line(CX + s * 7, hy - 9, CX + s * 12, hy - 16, sh(hornC, 0.25));
        p.line(CX + s * 9, hy - 5, CX + s * 15, hy - 9, hornD, false, 2); // chifre menor de trás
      }
      if (!L.dragonCrest || ['auto', 'frill'].includes(L.dragonCrest)) for (const s of [-1, 1]) { // babados das bochechas
        p.poly([[CX + s * 9, hy - 3], [CX + s * 18, hy - 6], [CX + s * 15, hy - 2], [CX + s * 11, hy + 1]], dk);
        p.poly([[CX + s * 9, hy + 1], [CX + s * 17, hy + 2], [CX + s * 11, hy + 6]], sh(skin, -0.18));
      }
      p.ell(CX, hy - 2, 11, 10, skin);
      p.poly([[CX - 8, hy + 1], [CX + 8, hy + 1], [CX + 7, hy + 9], [CX + 4, hy + 14], [CX - 4, hy + 14], [CX - 7, hy + 9]], skin);
      if (!L.dragonSnout || L.dragonSnout === 'auto') {
      p.poly([[CX - 6, hy + 10], [CX + 6, hy + 10], [CX + 4, hy + 14], [CX - 4, hy + 14]], belly);
      p.rect(CX - 4, hy + 12, 8, 1, sh(belly, -0.18));
      if (!E.Skins?.has('mouths', L.mouthShape)) {
      p.line(CX - 6, hy + 10, CX + 6, hy + 10, dk2); p.set(CX - 7, hy + 9, dk2); p.set(CX + 7, hy + 9, dk2);
      p.set(CX - 5, hy + 11, '#f6f0e0'); p.set(CX + 5, hy + 11, '#f6f0e0'); p.set(CX - 3, hy + 11, '#f6f0e0'); p.set(CX + 3, hy + 11, '#f6f0e0');
      }
      p.rect(CX - 4, hy + 6, 2, 1, dk2); p.rect(CX + 3, hy + 6, 2, 1, dk2); // narinas
      p.line(CX - 7, hy + 2, CX - 5, hy + 9, sh(skin, -0.14)); p.line(CX + 7, hy + 2, CX + 5, hy + 9, sh(skin, -0.2)); // laterais do focinho
      p.rect(CX - 1, hy - 1, 2, 7, hl); p.set(CX - 2, hy + 5, hl); p.set(CX + 1, hy + 5, hl); // ponte do focinho
      } else if (E.Skins) E.Skins.dragonSnout(p, L, CX, hy);
      if (!L.dragonCrest || L.dragonCrest === 'auto') for (let k = 0; k < 3; k++) p.poly([[CX - 2, hy - 9 + k * 3], [CX, hy - 14 + k * 3], [CX + 2, hy - 9 + k * 3]], k ? dk : sh(dk, 0.1)); // crista
      if (!L.scalePattern || L.scalePattern === 'auto') {
      for (const [x, y] of [[-7, -7], [-4, -9], [4, -9], [7, -7], [-9, -2], [9, -2], [-6, 4], [6, 4], [-2, -6], [2, -6]]) p.set(CX + x, hy + y, hl);
      for (const [x, y] of [[-8, -5], [8, -5], [-6, 7], [6, 7], [-10, 1], [10, 1]]) p.set(CX + x, hy + y, dk);
      } else if (E.Skins) E.Skins.dragonPattern(p, L, CX, hy);
      const customDragonEyes = E.Skins && E.Skins.drawEyes(p, L, CX, hy, true);
      if (!customDragonEyes) for (const ex of [CX - 9, CX + 4]) { // olhos de réptil com pupila em fenda
        p.rect(ex, hy - 2, 5, 4, '#fff6dc');
        p.rect(ex + 1, hy - 2, 4, 4, eyeC, true);
        p.rect(ex + 1, hy, 4, 2, sh(eyeC, 0.25), true);
        p.rect(ex + 2, hy - 2, 1, 4, '#1a0a08');
        p.set(ex + 4, hy - 2, '#ffffff', true);
      }
      if (!customDragonEyes) { p.line(CX - 10, hy - 5, CX - 4, hy - 3, dk, false, 2); p.line(CX + 3, hy - 3, CX + 9, hy - 5, dk, false, 2); // sobrancelhas ósseas
      }
    };
    if (drac) {
      p.rect(CX - 4, hy + 9, 8, 6, sh(skin, -0.1));
      p.rect(CX - 2, hy + 10, 4, 5, E.SP.mix(skin, '#f4e8c8', 0.45));
      dragonHead(false);
    } else {
      p.rect(CX - 3 - (HS.neck || 0), hy + 9, 6 + (HS.neck || 0) * 2, 5, sh(skin, -0.12));
      const inner = E.SP.mix(skin, '#c0505a', 0.25);
      for (const sgn of [-1, 1]) {
        const ex = CX + sgn * (HS.rx - 1);
        if (HS.ears === 'elf') { p.poly([[ex, hy - 1], [ex + sgn * 9, hy - 10], [ex + sgn * 2, hy + 4]], skin); p.line(ex + sgn * 1, hy, ex + sgn * 6, hy - 6, inner); }
        if (HS.ears === 'gnome') { p.poly([[ex, hy - 3], [ex + sgn * 7, hy - 7], [ex + sgn * 6, hy + 1], [ex + sgn * 1, hy + 5]], skin); p.line(ex + sgn * 1, hy - 1, ex + sgn * 4, hy - 3, inner); }
        if (HS.ears === 'orc') { p.poly([[ex, hy - 2], [ex + sgn * 6, hy - 4], [ex + sgn * 1, hy + 4]], skin); p.set(ex + sgn * 2, hy - 1, inner); }
        if (HS.ears === 'round') p.ell(ex + sgn * 1, hy + 2, 2, 3, skin);
      }
      p.ell(CX, hy, HS.rx, HS.ry, skin);
      p.poly([[CX - HS.rx + 1, hy + 2], [CX + HS.rx - 1, hy + 2], [CX + HS.jaw, hy + 11], [CX - HS.jaw, hy + 11]], skin);
    }
    // rosto
    const ey = hy + 1;
    const lash = sh(hair, -0.5);
    const glowEye = sp === 'tiferino' || sp === 'aasimar';
    const eh = HS.eyeH || 6, e0 = ey + (6 - eh);
    const drawEyes = (lidC) => {
      for (const ex of [CX - 9, CX + 4]) {
        if (sp === 'tiferino') { // olhos de uma cor só, sem branco
          p.rect(ex, e0, 5, eh, eyeC, true); p.rect(ex, e0 + Math.floor(eh / 2), 5, Math.ceil(eh / 2), sh(eyeC, -0.2), true); p.set(ex + 1, e0, '#ffffff', true);
        } else {
          p.rect(ex, e0, 5, eh, '#ffffff');
          p.rect(ex + 1, e0, 4, eh, eyeC, glowEye);
          p.rect(ex + 1, e0 + Math.ceil(eh / 2), 4, Math.floor(eh / 2), sh(eyeC, 0.28), glowEye);
          p.rect(ex + 2, e0 + 1, 2, Math.max(2, eh - 3), '#120c1a');
          p.rect(ex + 1, e0, 1, 2, '#ffffff', true);
          p.set(ex + 4, e0 + eh - 2, '#ffffff', true);
        }
        p.rect(ex - 1, e0 - 1, 7, 1, lidC);
        p.set(ex + (ex < CX ? -1 : 5), e0, lidC);
        if (sp === 'elfo') p.set(ex + (ex < CX ? -1 : 5), e0 - 2 + (ex < CX ? 0 : 0), lidC); // canto puxado (olho amendoado)
      }
    };
    if (!drac) {
      const customEyes = E.Skins && E.Skins.drawEyes(p, L, CX, hy);
      if (!customEyes) drawEyes(lash);
      // sobrancelhas: grossas e baixas em anões, orcs e golias
      if (!customEyes && HS.brow) { const bc = sp === 'anao' ? hair : sh(skin, -0.38); p.rect(CX - 10, e0 - 3, 7, 2, bc); p.rect(CX + 3, e0 - 3, 7, 2, bc); }
      else if (!customEyes) { p.rect(CX - 9, ey - 3, 5, 1, sh(hair, -0.25)); p.rect(CX + 4, ey - 3, 5, 1, sh(hair, -0.25)); }
      // nariz
      const nd = sh(skin, -0.2);
      if (HS.nose === 'big') { p.ell(CX, hy + 6, 2.6, 2.4, sh(skin, -0.05)); p.set(CX - 1, hy + 5, sh(skin, 0.2)); p.set(CX - 2, hy + 8, nd); p.set(CX + 2, hy + 8, nd); }
      else if (HS.nose === 'round') { p.ell(CX, hy + 6, 2.2, 2, E.SP.mix(skin, '#e0707a', 0.3)); p.set(CX - 1, hy + 5, sh(skin, 0.25)); }
      else if (HS.nose === 'flat') { p.rect(CX - 2, hy + 6, 5, 2, sh(skin, -0.1)); p.set(CX - 2, hy + 7, nd); p.set(CX + 2, hy + 7, nd); }
      else if (HS.nose === 'button') p.rect(CX, hy + 6, 2, 1, nd);
      else if (HS.nose === 'thin') { p.set(CX, hy + 5, nd); p.set(CX, hy + 7, nd); }
      else p.set(CX, hy + 7, sh(skin, -0.16));
      if (!E.Skins?.has('mouths', L.mouthShape)) p.rect(CX - 1, hy + 9, 3, 1, E.SP.mix(sh(skin, -0.35), '#c0505a', 0.35));
      const blush = sp === 'pequenino' || sp === 'gnomo' ? 0.45 : 0.3;
      p.rect(CX - 10, hy + 8, 3, sp === 'pequenino' ? 2 : 1, E.SP.mix(skin, '#ff7a8a', blush)); p.rect(CX + 7, hy + 8, 3, sp === 'pequenino' ? 2 : 1, E.SP.mix(skin, '#ff7a8a', blush));
    }
    // orc: presas inferiores que sobem do lábio
    if (sp === 'orc') { for (const x of [CX - 4, CX + 3]) { p.rect(x, hy + 7, 2, 3, '#f2ead0'); p.set(x, hy + 7, '#ffffff'); } p.rect(CX - 5, hy + 10, 11, 1, sh(skin, -0.25)); }
    // golias: marcas de pedra no rosto
    if (sp === 'golias') { const mk = sh(skin, -0.42); p.line(CX - 9, hy - 4, CX - 6, hy - 1, mk); p.line(CX - 6, hy - 1, CX - 8, hy + 3, mk); p.line(CX + 6, hy + 3, CX + 9, hy + 6, mk); p.set(CX + 1, hy - 8, mk); p.set(CX + 3, hy - 7, mk); }
    // aasimar: sardas de luz sob os olhos
    if (sp === 'aasimar') for (const [x, y] of [[-8, 7], [-6, 8], [-10, 6], [6, 8], [8, 7], [10, 6]]) p.set(CX + x, hy + y, '#fff2b8', true);
    if ((L.beard && !drac) || sp === 'anao') { p.poly([[CX - 9, hy + 4], [CX + 9, hy + 4], [CX + 7, hy + 14], [CX, hy + 18], [CX - 7, hy + 14]], hair); p.rect(CX - 3, hy + 8, 6, 1, sh(skin, -0.3)); p.rect(CX - 4, hy + 4, 8, 2, hair); }

    // ===== cabelo (frente) =====
    if (E.Skins) E.Skins.drawMouth(p, L, CX, hy, drac);
    const hiH = sh(hair, 0.32), loH = sh(hair, -0.2);
    const hood = L.acc === 'capuz';
    if (customHair && !hood) E.Skins.hairPart(p, L, CX, hy, 'front');
    if (!customHair && !hood && sp !== 'draconato' && L.hairStyle !== 8 && L.hairStyle !== 9) {
      const vol = L.hairStyle === 7 ? 2 : L.hairStyle === 11 ? 3 : 0;
      p.ell(CX, hy - 7, 13 + vol, 7 + vol, hair);
      p.rect(CX - 12 - vol, hy - 7, 24 + vol * 2, 4, hair);
      if (L.hairStyle === 7) for (let a = 0; a < Math.PI * 2; a += 0.6) p.ell(CX + Math.cos(a) * 13, hy - 6 + Math.sin(a) * 8, 3.5, 3.5, hair);
      if (L.hairStyle === 11) for (let a = Math.PI * 0.95; a < Math.PI * 2.05; a += 0.35) p.ell(CX + Math.cos(a) * 16, hy - 6 + Math.sin(a) * 13, 3.5, 3.5, hair);
      // franja em mechas (para cima dos olhos)
      const tips = L.hairStyle === 6 ? [[-11, 0], [-6, 0], [-1, 0], [4, 0], [9, 0]] : L.hairStyle === 14 ? [[-11, 4], [-7, 3], [-3, 2], [1, 0], [5, -2], [9, -3]] : [[-11, -1], [-7, 1], [-2, -2], [2, 0], [7, -1], [10, 1]];
      for (const [x, d] of tips) p.poly([[CX + x - 2, hy - 4], [CX + x + 3, hy - 4], [CX + x + 1, hy - 1 + d]], hair);
      // laterais
      const sideLen = { 0: 8, 1: 14, 2: 7, 3: 6, 4: 7, 5: 10, 6: 12, 7: 11, 10: 8, 11: 12, 12: 6, 13: 16, 14: 10 }[L.hairStyle] || 8;
      p.rect(CX - 13, hy - 5, 3, sideLen, hair); p.rect(CX + 10, hy - 5, 3, sideLen, hair);
      if (L.hairStyle === 6) { p.rect(CX - 13, hy + 6, 4, 2, hair); p.rect(CX + 9, hy + 6, 4, 2, hair); }
      if (L.hairStyle === 1) { p.rect(CX - 14, hy, 4, 22, hair); p.rect(CX + 10, hy, 4, 22, hair); }
      if (L.hairStyle === 13) { p.rect(CX - 14, hy, 4, 24, hair); p.rect(CX + 10, hy, 4, 24, hair); for (let y = hy + 3; y < hy + 24; y += 7) { p.ell(CX - 15, y, 1.6, 2.2, hair); p.ell(CX + 14, y + 3, 1.6, 2.2, hair); } p.rect(CX - 13, hy + 4, 1, 16, loH); p.rect(CX + 12, hy + 6, 1, 14, loH); }
      if (L.hairStyle === 14) { p.poly([[CX - 13, hy - 7], [CX - 1, hy - 7], [CX - 11, hy + 3]], hair); p.line(CX - 10, hy - 6, CX - 5, hy - 4, hiH); }
      if (L.hairStyle === 12) { p.rect(CX - 2, hy - 20, 5, 7, hair); p.ell(CX + 2, hy - 20, 4, 2.5, hair); p.rect(CX - 2, hy - 15, 5, 1, '#f4f0e6'); }
      if (L.hairStyle === 3) p.poly([[CX - 12, hy - 8], [CX - 9, hy - 19], [CX - 5, hy - 11], [CX - 1, hy - 21], [CX + 3, hy - 11], [CX + 8, hy - 19], [CX + 12, hy - 8]], hair);
      if (L.hairStyle === 4) { p.ell(CX, hy - 15, 6, 5, hair); p.rect(CX - 6, hy - 13, 12, 1, loH); }
      if (L.hairStyle === 5) for (const s of [-1, 1]) for (let k = 0; k < 6; k++) p.ell(CX + s * 12, hy + 6 + k * 3.4, 2.4, 2, k % 2 ? loH : hair);
      // brilho e sombra
      p.rect(CX - 7, hy - 11, 3, 1, hiH); p.rect(CX - 4, hy - 12, 4, 1, hiH); p.rect(CX + 1, hy - 12, 2, 1, hiH); p.set(CX - 8, hy - 10, hiH);
      p.set(CX - 12, hy - 2, loH); p.set(CX + 11, hy - 2, loH);
    }
    if (!customHair && L.hairStyle === 8 && !hood && sp !== 'draconato') { p.ell(CX, hy - 7, 11, 5, sh(hair, -0.1)); p.rect(CX - 2, hy - 13, 4, 8, hair); }
    if (!customHair && L.hairStyle === 9 && !hood && sp !== 'draconato') { p.ell(CX, hy - 7, 11, 5, sh(skin, -0.12)); for (let i = 0; i < 5; i++) p.poly([[CX - 3, hy - 9 - i * 3], [CX + 3, hy - 9 - i * 3], [CX + 1 + i, hy - 16 - i * 3]], i % 2 ? sh(hair, -0.1) : hair); p.rect(CX - 3, hy - 12, 6, 6, hair); }
    if (drac && customHair && !hood && E.Skins) { E.Skins.dragonHorns(p, L, CX, hy); E.Skins.dragonCrest(p, L, CX, hy); }
    if (sp === 'tiferino') { p.line(CX - 7, hy - 9, CX - 12, hy - 18, '#3a2a3a', false, 3); p.line(CX - 12, hy - 18, CX - 9, hy - 21, '#3a2a3a', false, 2); p.line(CX + 6, hy - 9, CX + 11, hy - 18, '#3a2a3a', false, 3); p.line(CX + 11, hy - 18, CX + 8, hy - 21, '#3a2a3a', false, 2); }

    // ===== acessórios =====
    const acc = L.acc;
    if (hood) {
      const hc = sh(c1, -0.12);
      p.ell(CX, hy - 3, 14, 12, hc);
      p.rect(CX - 11, hy - 9, 22, 2, sh(hc, 0.15));
      if (drac) dragonHead(true);
      else {
        p.ell(CX, hy + 3, 10, 8.5, skin);
        // olhos de novo por cima do capuz
        drawEyes(sh(hc, -0.45));
        p.rect(CX - 1, hy + 9, 3, 1, E.SP.mix(sh(skin, -0.35), '#c0505a', 0.35));
      }
    }
    if (acc === 'chapeu_mago') { p.poly([[CX - 17, hy - 8], [CX + 17, hy - 8], [CX + 5, hy - 12], [CX + 9, hy - 30], [CX - 4, hy - 12]], c1); p.rect(CX - 17, hy - 9, 34, 3, sh(c1, -0.25)); p.rect(CX - 8, hy - 12, 16, 2, c2); p.set(CX + 2, hy - 18, '#fff6c8', true); p.set(CX - 1, hy - 15, '#fff6c8', true); }
    if (acc === 'chapeu_bardo') { p.ell(CX, hy - 10, 16, 3.5, sh(c2, -0.4)); p.ell(CX, hy - 13, 9, 5, sh(c2, -0.4)); p.line(CX + 6, hy - 14, CX + 16, hy - 26, c2, false, 3); p.line(CX + 8, hy - 15, CX + 15, hy - 24, sh(c2, 0.3)); }
    if (acc === 'tiara') { p.rect(CX - 9, hy - 10, 18, 2, '#ffd36b'); p.poly([[CX - 3, hy - 10], [CX, hy - 15], [CX + 3, hy - 10]], '#ffd36b'); p.set(CX, hy - 12, c2, true); }
    if (acc === 'faixa') { p.rect(CX - 12, hy - 7, 24, 3, c2); p.poly([[CX + 11, hy - 7], [CX + 18, hy - 3], [CX + 16, hy + 2]], c2); }
    if (acc === 'flor') { p.ell(CX + 9, hy - 8, 3, 3, '#ff9ad5'); p.set(CX + 9, hy - 8, '#ffd36b', true); p.ell(CX + 6, hy - 6, 2, 2, '#ffffff'); }
    if (acc === 'folhas') for (let a = -2.6; a <= -0.5; a += 0.42) p.ell(CX + Math.cos(a) * 12, hy - 4 + Math.sin(a) * 9, 2.4, 1.6, Math.round(a * 10) % 2 ? '#7cc45a' : '#5a9a3a');
    if (acc === 'chapeu_palha') { p.ell(CX, hy - 8, 19, 3.5, '#e2c06a'); p.ell(CX, hy - 12, 10, 5.5, '#d8b252'); p.rect(CX - 10, hy - 11, 20, 2, c2); for (let x = -16; x <= 16; x += 4) p.set(CX + x, hy - 8, '#b8923a'); for (let x = -7; x <= 7; x += 3) p.set(CX + x, hy - 15, '#c8a248'); p.set(CX - 19, hy - 7, '#b8923a'); p.set(CX + 18, hy - 6, '#b8923a'); }
    if (acc === 'chapeu_aba') { p.ell(CX, hy - 8, 20, 3, '#5a3e26'); p.poly([[CX - 9, hy - 9], [CX + 9, hy - 9], [CX + 8, hy - 19], [CX - 8, hy - 19]], '#6a4a2e'); p.rect(CX - 9, hy - 12, 18, 2, c2); p.rect(CX - 3, hy - 19, 6, 1, '#4a3220'); p.rect(CX - 6, hy - 17, 3, 1, '#8a6a4a'); }
    if (acc === 'tricornio') { p.ell(CX, hy - 14, 9, 5, '#2a2228'); p.poly([[CX - 18, hy - 9], [CX + 18, hy - 9], [CX + 12, hy - 18], [CX, hy - 13], [CX - 12, hy - 18]], '#2a2228'); p.line(CX - 18, hy - 9, CX - 12, hy - 18, '#ffd36b'); p.line(CX + 18, hy - 9, CX + 12, hy - 18, '#ffd36b'); p.line(CX - 17, hy - 9, CX + 17, hy - 9, '#c8962a'); p.rect(CX - 1, hy - 13, 3, 2, '#f4f0e6'); p.set(CX, hy - 11, '#f4f0e6'); }
    if (acc === 'boina') { p.ell(CX + 2, hy - 11, 14, 5, c2); p.ell(CX + 2, hy - 8, 13, 1.6, sh(c2, -0.22)); p.rect(CX + 1, hy - 17, 2, 2, sh(c2, -0.3)); p.rect(CX - 6, hy - 14, 4, 1, sh(c2, 0.25)); }
    if (acc === 'coroa') { p.rect(CX - 9, hy - 13, 18, 4, '#ffd36b'); for (const x of [-9, -4, 1, 6]) p.poly([[CX + x, hy - 13], [CX + x + 3, hy - 13], [CX + x + 1.5, hy - 19]], '#ffd36b'); p.rect(CX - 9, hy - 10, 18, 1, '#c8962a'); p.set(CX - 6, hy - 12, '#c0392b', true); p.set(CX, hy - 12, '#3a62c8', true); p.set(CX + 5, hy - 12, '#3ec7b3', true); }
    if (acc === 'elmo') { p.ell(CX, hy - 8, 13.5, 7.5, '#aab3bd'); p.rect(CX - 13, hy - 4, 27, 3, '#8a939d'); p.rect(CX - 1, hy - 4, 3, 10, '#8a939d'); p.rect(CX - 13, hy - 1, 3, 9, '#8a939d'); p.rect(CX + 11, hy - 1, 3, 9, '#8a939d'); p.rect(CX - 7, hy - 13, 4, 1, '#e0e6ec'); p.set(CX - 10, hy - 3, '#e0e6ec'); p.set(CX + 10, hy - 3, '#e0e6ec'); p.rect(CX - 1, hy - 15, 3, 3, c2); }
    if (acc === 'capacete_mineiro') { p.ell(CX, hy - 9, 13, 7, '#e8b830'); p.rect(CX - 15, hy - 5, 30, 2, '#c8961a'); p.rect(CX - 3, hy - 12, 6, 4, '#5a5a62'); p.rect(CX - 2, hy - 11, 4, 2, '#fff6c8', true); p.rect(CX - 8, hy - 14, 4, 1, '#ffe08a'); }
    if (acc === 'bandana') { p.rect(CX - 13, hy - 8, 26, 4, c2); p.rect(CX - 13, hy - 8, 26, 1, sh(c2, 0.22)); for (let x = -11; x < 12; x += 4) p.set(CX + x, hy - 6, '#ffffff'); p.poly([[CX + 12, hy - 7], [CX + 18, hy - 3], [CX + 15, hy]], c2); p.poly([[CX + 12, hy - 6], [CX + 17, hy + 2], [CX + 13, hy + 3]], sh(c2, -0.2)); }
    if (acc === 'laco') { const bx = CX + 8, by = hy - 13; p.poly([[bx, by], [bx - 7, by - 4], [bx - 7, by + 4]], c2); p.poly([[bx, by], [bx + 7, by - 4], [bx + 7, by + 4]], c2); p.rect(bx - 1, by - 2, 3, 4, sh(c2, -0.25)); p.set(bx - 5, by - 2, sh(c2, 0.3)); p.set(bx + 4, by - 2, sh(c2, 0.3)); }
    if (acc === 'orelhas_gato') for (const s of [-1, 1]) { p.poly([[CX + s * 4, hy - 12], [CX + s * 12, hy - 22], [CX + s * 13, hy - 9]], hair); p.poly([[CX + s * 7, hy - 12], [CX + s * 11, hy - 19], [CX + s * 11, hy - 11]], '#f2a0b4'); }
    if (acc === 'mascara' && !drac) { const mc = E.SP.mix(c1, '#1a1c24', 0.7); p.poly([[CX - HS.rx + 1, hy + 7], [CX + HS.rx - 1, hy + 7], [CX + HS.jaw, hy + 11], [CX - HS.jaw, hy + 12]], mc); p.rect(CX - HS.rx + 1, hy + 7, (HS.rx - 1) * 2, 1, sh(mc, 0.22)); }
    if (acc === 'tapa_olho') { const py = drac ? hy - 3 : e0 - 1, ph = drac ? 6 : eh + 2; p.rect(CX + 3, py, 7, ph, '#1a1a1a'); p.line(CX + 3, py + 1, CX - 12, hy - 7, '#1a1a1a'); p.line(CX + 9, py + 1, CX + 13, py, '#1a1a1a'); p.set(CX + 5, py + 1, '#4a4a4a'); }
    if (acc === 'cachecol') { p.rect(CX - 7, hy + 11, 14, 4, c2); p.rect(CX - 7, hy + 12, 14, 1, sh(c2, 0.25)); p.rect(CX - 6, hy + 14, 4, 12, c2); p.rect(CX - 6, hy + 18, 4, 1, sh(c2, 0.25)); for (let x = 0; x < 4; x += 2) p.set(CX - 6 + x, hy + 26, sh(c2, -0.2)); }
    if (acc === 'oculos') { p.rect(CX - 10, hy - 9, 20, 2, '#5a3a22'); p.ell(CX - 5, hy - 9, 3, 2.5, '#9fe3ff', true); p.ell(CX + 5, hy - 9, 3, 2.5, '#9fe3ff', true); }
    if (sp === 'aasimar') for (let a = 0; a < Math.PI * 2; a += 0.2) p.set(CX + Math.cos(a) * 10, hy - 19 + Math.sin(a) * 2.2, '#ffe9a8', true);
    if (outfit === 'estelar') { p.set(CX - 13, hy - 14, '#fff6c8', true); p.set(CX + 14, hy - 9, '#fff6c8', true); }

    // ===== arma =====
    const held = !fishPose && !swim && o.weaponType ? heldArt(o.weaponDef) : null;
    if (!fishPose && !swim && (!held || !held.image)) drawWeapon(p, o.weaponType, o.weaponColor, atk, ty, o.weaponRarity, weaponPalm);
    if (!fishPose && !swim && o.weaponType) {
      p.ell(weaponPalm[0], weaponPalm[1], 2, 2, gl);
      if (secondPalm) p.ell(secondPalm[0], secondPalm[1], 2, 2, gl);
    }


    // ===== proporções: pequeninos, gnomos e anões têm pernas mais curtas (remove linhas na altura das pernas)
    const squash = { pequenino: 6, gnomo: 6, anao: 4 }[sp] || 0;
    if (squash) {
      const y0 = 56;
      for (let y = y0 + squash - 1; y >= squash; y--) for (let x = 0; x < W; x++) { const i = y * W + x, j = (y - squash) * W + x; p.d[i] = p.d[j]; if (p.glow.has(j)) p.glow.add(i); else p.glow.delete(i); }
      for (let y = 0; y < squash; y++) for (let x = 0; x < W; x++) { p.d[y * W + x] = null; p.glow.delete(y * W + x); }
    }
    // ===== sombreamento lateral (luz vinda da esquerda) =====
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, c = p.d[i];
      if (!c || p.glow.has(i)) continue;
      if (x > CX + 5) p.d[i] = sh(c, -0.1 - (x - CX - 5) * 0.008);
      else if (x < CX - 7) p.d[i] = sh(c, 0.05);
    }
    let out = p.toCanvas({ light: 0.12, dark: 0.16 });
    if (swim) {
      const ctx = out.getContext('2d'), image = ctx.getImageData(0, 0, out.width, out.height);
      const line = 50 + Math.sin(swimPhase * 2) * .7;
      for (let y = 0; y < out.height; y++) for (let x = 0; x < out.width; x++) {
        const edge = line + Math.sin(x * .24 + swimPhase) * .7;
        if (y > edge) image.data[(y * out.width + x) * 4 + 3] *= Math.max(0, 1 - (y - edge) / 3);
      }
      ctx.putImageData(image, 0, 0); out._waterlineF = line / out.height; out._cy = .02; out._k = 1;
    } else if (!fishPose && o.weaponType) {
      // Symmetric horizontal padding keeps long blades/axe heads visible, without moving the hero center.
      const base = out, pad = 20;
      out = document.createElement('canvas'); out.width = base.width + pad * 2; out.height = base.height;
      const ctx = out.getContext('2d'); ctx.drawImage(base, pad, 0);
      const adjusted = (pt) => [pt[0] + 1 + pad, pt[1] + 1 + (squash && pt[1] < 56 + squash ? squash : 0)];
      const palm = adjusted(weaponPalm), other = secondPalm && adjusted(secondPalm);
      out._weaponGripF = [palm[0] / out.width, palm[1] / out.height]; out._twoHands = twoHands;
      if (held && held.image) {
        out._weaponArtReady = true;
        const wt = o.weaponType, scale = wt === 'espadao' ? ((o.weaponColor && o.weaponColor.base === 'machado_batalha') ? .41 : .48) : wt === 'haste' ? .48 : wt === 'arco' ? .44 : .40;
        const grip = wt === 'arco' ? [56, 43] : wt === 'catalisador' ? [50, 74] : o.weaponDef && o.weaponDef.art && o.weaponDef.art.tpl ? [34, 69] : [32, 73];
        ctx.save(); ctx.translate(palm[0], palm[1]); ctx.rotate(atk && wt !== 'catalisador' ? .48 : -.10);
        ctx.imageSmoothingEnabled = true; ctx.drawImage(held.image, -grip[0] * scale, -grip[1] * scale, 100 * scale, 100 * scale); ctx.restore();
        // Palms sit in front of the handle, rather than the weapon floating over the fingers.
        ctx.fillStyle = gl; ctx.fillRect(Math.round(palm[0] - 2), Math.round(palm[1] - 1.5), 4, 3);
        ctx.fillStyle = sh(gl, -.2); ctx.fillRect(Math.round(palm[0] - 2), Math.round(palm[1] + 1.5), 4, 1);
        if (other) { ctx.fillStyle = gl; ctx.fillRect(Math.round(other[0] - 2), Math.round(other[1] - 1.5), 4, 3); }
      } else if (held && !held.failed) {
        out._weaponPending = true;
        held.callbacks.add(() => {
          const fresh = CH.draw(o), target = out.getContext('2d');
          target.clearRect(0, 0, out.width, out.height); target.drawImage(fresh, 0, 0);
          out._weaponPending = false; out._weaponArtReady = !!fresh._weaponArtReady;
          for (const callback of out._readyCallbacks || []) callback(out);
          if (out._readyCallbacks) out._readyCallbacks.clear();
        });
      }
    }

    // posição da mão (fração do quadro) para a vara de pesca em 3D
    if (hand) {
      const hp = [hand[0], hand[1] + (squash && hand[1] < 56 + squash ? squash : 0)];
      out._handF = [(hp[0] + 1) / out.width, (hp[1] + 1) / out.height];
      if (fishPose) return fishRod(out, f, hp, +rodTier || 0);
    }
    return out;
  };

  // ---------------- vara de pesca em pixel art, presa no punho do herói ----------------
  // O quadro de pesca é maior que o normal (espaço para a vara); _k diz quanto maior, _cy onde ficam os pés
  // e _tipF onde está a ponta da vara (a linha 3D sai dali).
  const ROD_LOOK = [
    { c: '#c9a85a', band: '#8a6a2a', tip: '#efe2b0', every: 7 },              // bambu (com nós)
    { c: '#7a4a28', band: '#d9c08a', tip: '#c8a070', every: 0 },              // carvalho
    { c: '#5a4aa0', band: '#c9b8ff', tip: '#9fe3ff', every: 11, glow: true }, // encantada
    { c: '#245f80', band: '#ffd36b', tip: '#7ff0ff', every: 9, glow: true },  // lendária das marés
    { c: '#d0471c', band: '#ffcf3a', tip: '#ffe08a', every: 8, glow: true },  // dendê
  ];
  // [ângulo (0 = em pé, positivo = para a água), comprimento, curvatura, vara atrás da cabeça] de cada quadro
  const ROD_POSE = { fcast0: [-0.7, 50, -0.12, true], fcast1: [1.2, 52, -0.3], fhold: [0.78, 54, 0.15], fbite: [0.92, 54, 0.8], freel0: [0.5, 52, 0.95], freel1: [0.42, 50, 1.3], fcatch: [0.62, 50, 0.2] };
  const PADX = 48, PADT = 34;
  function fishRod(base, f, hand, tier) {
    const [a0, len, bend, behind] = ROD_POSE[f] || ROD_POSE.fhold;
    const look = ROD_LOOK[tier] || ROD_LOOK[0];
    const BW = base.width + PADX * 2, BH = base.height + PADT;
    const p = new E.SP.Px(BW - 2, BH - 2);
    // coordenadas do Px da vara: (x + 1, y + 1) no quadro final; o herói entra deslocado em (PADX, PADT)
    const hx = hand[0] + 1 + PADX - 1, hy = hand[1] + 1 + PADT - 1;
    const dir = (a) => [Math.sin(a), -Math.cos(a)];
    const N = 60, s0 = -0.16, ds = (1 - s0) / N;
    let [dx, dy] = dir(a0);
    let x = hx - dx * -s0 * len, y = hy - dy * -s0 * len;
    const pts = [[x, y, s0]];
    for (let i = 1; i <= N; i++) {
      const s = s0 + i * ds, a = a0 + bend * Math.max(0, s) * Math.max(0, s);
      [dx, dy] = dir(a); x += dx * ds * len; y += dy * ds * len; pts.push([x, y, s]);
    }
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0, s] = pts[i - 1], [x1, y1] = pts[i];
      acc += Math.hypot(x1 - x0, y1 - y0);
      const grip = s < 0.02, tipPart = s > 0.84;
      const band = look.every && !grip && Math.floor(acc) % look.every === 0;
      const col = grip ? '#5a3a22' : tipPart ? look.tip : band ? look.band : look.c;
      p.line(x0, y0, x1, y1, col, tipPart && look.glow, s < 0.5 ? 2 : 1);
    }
    // carretilha logo à frente da mão, do lado de baixo da vara
    const [rx, ry] = pts[Math.round((0.1 - s0) / ds)];
    const [ndx, ndy] = dir(a0 + Math.PI / 2);
    p.ell(rx + ndx * 2.5, ry + ndy * 2.5, 2, 2, '#c8c8d0');
    p.set(rx + ndx * 2.5, ry + ndy * 2.5, '#6a6a78');
    const rod = p.toCanvas({ light: 0.18, dark: 0.22 });
    const out = document.createElement('canvas');
    out.width = rod.width; out.height = rod.height;
    const ctx = out.getContext('2d');
    // no lançamento a vara vai para trás, por cima do ombro: fica atrás da cabeça
    if (behind) { ctx.drawImage(rod, 0, 0); ctx.drawImage(base, PADX, PADT); } else { ctx.drawImage(base, PADX, PADT); ctx.drawImage(rod, 0, 0); }
    // o punho por cima da vara: a mão segura a vara de verdade
    ctx.drawImage(base, hand[0] - 2, hand[1] - 2, 6, 6, hand[0] - 2 + PADX, hand[1] - 2 + PADT, 6, 6);
    const [tx, ty] = pts[pts.length - 1];
    out._tipF = [(tx + 1) / out.width, (ty + 1) / out.height];
    out._handF = [(hx + 1) / out.width, (hy + 1) / out.height];
    out._k = out.height / base.height;
    out._cy = (out.height - PADT - base.height + base.height * 0.02) / out.height;
    return out;
  }

  // Inventory art is rasterized once per actual definition, then shared by all animation frames.
  const heldArtCache = new Map();
  function heldArt(def) {
    if (!def || !E.WA || typeof E.WA.svg !== 'function' || typeof Image === 'undefined') return null;
    const key = JSON.stringify([def.name, def.type, def.base, def.rarity, def.art]);
    if (heldArtCache.has(key)) return heldArtCache.get(key);
    const record = { image: null, failed: false, callbacks: new Set() };
    if (heldArtCache.size >= 96) {
      const oldest = [...heldArtCache].find(([, entry]) => entry.image || entry.failed);
      if (oldest) heldArtCache.delete(oldest[0]);
    }
    heldArtCache.set(key, record);
    try {
      // No aura or animation: only the same authored silhouette shown in the inventory.
      let svg = E.WA.svg(def, { still: true, aura: false });
      svg = svg.replace(/<animate(?:Transform)?\b[^>]*\/>/g, '').replace(/<animate(?:Transform)?\b[\s\S]*?<\/animate(?:Transform)?>/g, '');
      const image = new Image();
      image.onload = () => { record.image = image; for (const callback of record.callbacks) callback(); record.callbacks.clear(); };
      image.onerror = () => { record.failed = true; for (const callback of record.callbacks) callback(); record.callbacks.clear(); };
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } catch { record.failed = true; }
    return record;
  }
  function drawWeapon(p, type, wc, atk, ty, rar, palm) {
    if (!type) return;
    wc = wc || {};
    const blade = wc.c1 || '#dfe6ee', accent = wc.c2 || '#d4af37', dark = sh(blade, -.38), bright = sh(blade, .38);
    const base = wc.base || '', shape = String(wc.shape || '');
    const axe = /machado|axe/.test(base + shape), hammer = /martelo|malho|hammer/.test(base + shape), club = /clava|bordao|maca/.test(base);
    const u = atk ? [.96, -.28] : [.22, -.98], v = [-u[1], u[0]];
    const at = (a,b=0) => [palm[0] + u[0]*a + v[0]*b, palm[1] + u[1]*a + v[1]*b];
    const line = (a,b,c,d,color,width=1) => { const q=at(a,b),r=at(c,d);p.line(q[0],q[1],r[0],r[1],color,false,width); };
    const poly = (points,color) => p.poly(points.map(([a,b])=>at(a,b)),color);
    const jewel = (a,b,r=1.4) => {const q=at(a,b);p.ell(q[0],q[1],r,r,accent,rar>=4);};
    const len = type === 'haste' ? 32 : type === 'espadao' ? 29 : base === 'adaga' ? 13 : base === 'espada_curta' ? 19 : 24;
    line(-7,0,2,0,'#63462e',3); line(-6,1,1,1,sh(accent,-.3));
    for (let a=-6;a<1;a+=2) line(a,-1,a+1,1,accent);
    jewel(-8,0,1.6);
    if (type === 'arco') {
      const bend = base.startsWith('besta') ? 13 : 17;
      line(-bend,0,-9,6,'#8b623b',2);line(-9,6,0,9,'#8b623b',2);line(0,9,9,6,'#8b623b',2);line(9,6,bend,0,'#8b623b',2);
      line(-bend,0,bend,0,'#e9dec7');line(-bend+2,1,-8,5,accent);line(8,5,bend-2,1,accent);
      if(atk){line(0,-7,0,19,blade);poly([[0,23],[-2,17],[2,17]],blade);}jewel(0,8,2);return;
    }
    if (type === 'catalisador') {
      if (/cajado|bordao/.test(shape+base)) {line(-11,0,30,0,'#79543a',3);line(-9,0,29,0,accent);jewel(33,0,4);line(27,-4,33,-6,blade,2);line(27,4,33,6,blade,2);}
      else if (/tomo|livro/.test(shape)) {poly([[0,-7],[15,-7],[17,0],[15,7],[0,7]],accent);poly([[2,-5],[14,-5],[15,0],[3,0]],'#eee6cf');poly([[3,0],[15,0],[14,5],[2,5]],'#d4c8ae');line(2,0,15,0,blade);}
      else if (/instrumento/.test(shape)) {jewel(4,0,5);line(8,0,23,0,'#845438',3);line(0,0,24,0,blade);}
      else {jewel(10,0,5);for(let i=0;i<6;i++){const a=i*Math.PI/3;const q=at(10+Math.cos(a)*8,Math.sin(a)*8);p.set(q[0],q[1],bright,rar>=4);}}
      return;
    }
    if (type === 'haste' || axe || hammer || club) {
      line(-12,0,len-5,0,'#795233',3);line(-10,-.7,len-6,-.7,'#caa572');
      if (axe) {poly([[len-14,-1],[len-11,-8],[len-4,-11],[len+1,-7],[len,-3],[len-7,0]],blade);poly([[len-11,-7],[len-4,-10],[len,-7],[len-1,-5],[len-7,-3]],bright);if(base==='machado_grande'||/dupl/.test(shape))poly([[len-14,1],[len-11,8],[len-4,11],[len+1,7],[len,3],[len-7,0]],blade);jewel(len-9,0,2);}
      else if (hammer) {poly([[len-13,-8],[len-3,-8],[len-3,8],[len-13,8]],blade);poly([[len-13,-8],[len-3,-8],[len-5,-5],[len-11,-5]],bright);line(len-8,-8,len-8,8,accent,3);}
      else if (club) {line(len-10,0,len,0,dark,6);line(len-9,-2,len-1,-2,bright,2);}
      else if(base==='tridente'){line(len-8,-5,len-1,-5,blade,2);line(len-8,5,len-1,5,blade,2);line(len-9,-5,len-9,5,accent,2);poly([[len+3,0],[len-4,-2],[len-4,2]],blade);}
      else {poly([[len+1,0],[len-8,-4],[len-5,0],[len-8,4]],blade);if(base==='alabarda')poly([[len-13,0],[len-11,8],[len-3,6],[len-6,1]],blade);line(len-8,0,len,0,bright);}
      return;
    }
    const rapier=base==='rapieira', curved=base==='cimitarra', width=type==='espadao'?3.2:rapier?.7:1.7;
    if(curved){poly([[2,-width],[len-5,-width],[len, -5],[len-3,1],[2,width]],blade);line(3,-1,len-4,-1,bright);}
    else{poly([[2,-width],[len-5,-width],[len,0],[len-5,width],[2,width]],blade);line(4,-.5,len-4,-.5,bright);line(4,width,len-5,width,dark);}
    line(1,-6,1,6,accent,2);jewel(2,0,1.7);
    if(rar>=4)for(let a=8;a<len-3;a+=6)jewel(a,0,.8);
  }

  // retrato do NPC: roupa coerente com o papel
  CH.npcLook = (npc) => {
    const t = (npc.title + ' ' + npc.name).toLowerCase();
    let outfit = 'aventureiro', acc = 'nenhum';
    if (/mercador|leiloeira|maré|lorde|juíza|príncipe|herdeiro|dama/.test(t)) outfit = 'nobre';
    if (/bibliotec|astrônom|arquivista|oráculo|alfaiate|testemunha/.test(t)) { outfit = 'manto'; }
    if (/sentinela|guardião|constructo/.test(t)) outfit = 'cavaleiro';
    if (/monge|peregrino/.test(t)) { outfit = 'oriental'; acc = 'faixa'; }
    if (/ferreir|forjador|artífice/.test(t)) outfit = 'tribal';
    if (/jardineira|guardiã|eterna|criança/.test(t)) { outfit = 'vestido'; acc = 'flor'; }
    if (/contrabandista|capitã|navegante|perdido/.test(t)) outfit = 'explorador';
    if (/eco|reflexo|memória|rei/.test(t)) outfit = 'estelar';
    // roupas da v4.1 para os personagens novos
    if (/pescador da baía/.test(t)) { outfit = 'mestre_pescador'; acc = 'chapeu_palha'; }
    if (/mineir|minerador/.test(t)) { outfit = 'mineiro'; acc = 'capacete_mineiro'; }
    if (/lenhador/.test(t)) { outfit = 'campones'; acc = 'chapeu_aba'; }
    if (/carteiro/.test(t)) { outfit = 'campones'; acc = 'boina'; }
    if (/marujo/.test(t)) { outfit = 'pirata'; acc = 'bandana'; }
    if (/faroleira|coveiro/.test(t)) outfit = 'inverno';
    if (/caçadora/.test(t)) outfit = 'cacador';
    if (/curandeira/.test(t)) outfit = 'sacerdote';
    if (/arqueóloga/.test(t)) { outfit = 'explorador'; acc = 'chapeu_aba'; }
    if (/trocadora|corretor|mercador/.test(t)) outfit = 'mercador';
    if (/alquimista/.test(t)) { outfit = 'alquimista'; acc = 'oculos'; }
    if (/abelheira/.test(t)) { outfit = 'campones'; acc = 'chapeu_palha'; }
    if (/aprendiz de astrônomo/.test(t)) outfit = 'academia';
    if (/mestra da guilda/.test(t)) outfit = 'militar';
    if (/costureiro/.test(t)) { outfit = 'menestrel'; acc = 'boina'; }
    if (/gerente do cassino/.test(t)) outfit = 'apostador';
    const hs = [...npc.name].reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return { skin: npc.look.skin, hair: npc.look.hair, hairStyle: hs % 8, eyes: CH.EYES[hs % CH.EYES.length], outfit, c1: npc.look.outfit, c2: sh(npc.look.outfit, -0.35), acc, build: hs % 3 === 0 ? 'forte' : 'medio', beard: /forjador|ferreiro|peregrino|bibliotec/.test(t) && hs % 2 === 0 };
  };

  E.CH = CH;
})();
