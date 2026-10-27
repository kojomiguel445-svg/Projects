/* Ilustrações dos Ecos (espíritos guardiões no estilo dos Stands de JoJo), em SVG com sombreamento de anime.
   Cada Eco tem os traços marcantes da sua inspiração. viewBox 200×260, de frente, flutuando: as pernas somem
   em névoa. Poses: idle0/idle1 (guarda) e punch (rajada de socos). No mundo e no combate o SVG vira um
   canvas em alta resolução (como os monstros pintados). */
(() => {
  const EA = {};
  const VW = 200, VH = 260;
  const sh = (c, a) => E.SP.shade(c, a);
  const LN = '#1a1028';
  const mirror = (s) => `<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;
  const both = (s) => s + mirror(s);
  const P_ = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" stroke="${LN}" stroke-width="2" stroke-linejoin="round" ${extra}/>`;
  const L_ = (d, col, w = 1.6, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const heartP = (x, y, s) => `M${x} ${y + s * 0.9} C${x - s * 1.3} ${y} ${x - s * 1.1} ${y - s * 0.9} ${x} ${y - s * 0.35} C${x + s * 1.1} ${y - s * 0.9} ${x + s * 1.3} ${y} ${x} ${y + s * 0.9} Z`;
  const starP = (x, y, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rr).toFixed(1)} ${(y + Math.sin(a) * rr).toFixed(1)} `; } return d + 'Z'; };

  // ------------------------------------------------------------------ base humanoide
  function defs(P) {
    return `<defs>
      <linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(P.skin, 0.28)}"/><stop offset=".45" stop-color="${P.skin}"/><stop offset="1" stop-color="${sh(P.skin, -0.32)}"/></linearGradient>
      <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(P.acc, 0.35)}"/><stop offset=".5" stop-color="${P.acc}"/><stop offset="1" stop-color="${sh(P.acc, -0.35)}"/></linearGradient>
      <linearGradient id="a2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(P.acc2 || P.acc, 0.35)}"/><stop offset=".5" stop-color="${P.acc2 || P.acc}"/><stop offset="1" stop-color="${sh(P.acc2 || P.acc, -0.35)}"/></linearGradient>
      <radialGradient id="au" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="${P.aura}" stop-opacity=".75"/><stop offset=".55" stop-color="${P.aura}" stop-opacity=".22"/><stop offset="1" stop-color="${P.aura}" stop-opacity="0"/></radialGradient>
      <linearGradient id="fadeG" x1="0" y1="0" x2="0" y2="1"><stop offset=".62" stop-color="#fff"/><stop offset=".9" stop-color="#000"/></linearGradient>
      <mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="260"><rect x="0" y="0" width="200" height="260" fill="url(#fadeG)"/></mask>
      <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>`;
  }
  const aura = () => `<ellipse cx="100" cy="118" rx="96" ry="118" fill="url(#au)"/>`;
  // névoa no lugar das pernas
  const mist = (P) => `<path d="M70 196 Q62 222 76 246 Q84 236 90 250 Q98 236 104 252 Q112 238 120 248 Q136 226 130 196 Z" fill="${P.aura}" opacity=".55" filter="url(#bl)"/>`;
  const legs = (P, over = '') => `<g mask="url(#fade)">${both(P_('M78 162 L100 166 L98 206 Q90 214 80 208 Q74 186 78 162 Z', 'url(#sk)') + P_('M81 206 L98 206 L96 246 L84 246 Z', 'url(#sk)'))}${over}</g>`;
  const torso = (P) => {
    const t = P_('M82 76 Q68 80 62 92 Q58 108 64 124 Q70 138 76 150 L78 164 L122 164 L124 150 Q130 138 136 124 Q142 108 138 92 Q132 80 118 76 Q100 72 82 76 Z', 'url(#sk)');
    const pec = both(P_('M70 90 Q84 84 98 90 L98 110 Q84 116 72 108 Q65 99 70 90 Z', 'url(#sk)') + L_('M74 106 Q86 112 97 108', sh(P.skin, -0.45), 1.4));
    let abs = '';
    [117, 129, 141].forEach((y, i) => { const w = 11 - i; abs += both(`<path d="M${99 - w} ${y + 1} Q${99 - w / 2} ${y - 1.5} 98.6 ${y + 0.5} L98.6 ${y + 10} Q${99 - w / 2} ${y + 12} ${99 - w} ${y + 10} Q${97.6 - w} ${y + 5} ${99 - w} ${y + 1} Z" fill="${sh(P.skin, 0.12)}" stroke="${sh(P.skin, -0.38)}" stroke-width="1.1"/><path d="M${100 - w} ${y + 2.5} Q${99 - w / 2} ${y + 1} 97 ${y + 2.5}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>`); });
    const ser = both(L_('M68 116 l7 3 M70 124 l7 3 M72 132 l6 3', sh(P.skin, -0.45), 1.3));
    return t + pec + abs + ser + L_('M100 90 L100 160', sh(P.skin, -0.45), 1.2) + `<path d="M64 96 Q66 120 80 156" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="3"/>`;
  };
  // braços: idle (punhos ao lado do corpo) ou punch (soco vindo na direção do jogador + punhos-fantasma)
  // punho fechado visto de frente (cx, cy = centro; s = escala)
  const fist = (P, cx, cy, s, op = 1) => {
    const f = P.fist || 'url(#sk)', d = sh(P.fist || P.skin, -0.5);
    return `<g transform="translate(${cx} ${cy}) scale(${s})" opacity="${op}">${P_('M-26 -12 Q-26 -26 -15 -26 Q-11 -31 -5 -27 Q1 -31 7 -27 Q13 -31 19 -26 Q27 -24 27 -12 L25 12 Q23 26 8 26 L-12 26 Q-26 24 -26 10 Z', f)}${L_('M-12 -25 L-12 -8 M0 -27 L0 -8 M12 -26 L12 -8 M-24 -8 L25 -8', d, 1.8)}${P_('M-26 0 Q-10 -6 2 4 Q0 14 -14 14 Q-26 12 -26 4 Z', f)}${L_('M-18 -20 Q-14 -24 -9 -21', '#fff', 1.6, 'stroke-opacity=".5"')}</g>`;
  };
  const armL = (P, cuff) => P_('M50 96 Q43 116 47 134 L64 136 Q71 118 73 102 Q63 91 50 96 Z', 'url(#sk)') + P_('M47 132 Q40 152 45 170 L61 172 Q67 154 64 134 Z', 'url(#sk)') +
    (cuff || '') + fist(P, 53, 178, 0.48) + `<ellipse cx="62" cy="94" rx="14" ry="14" fill="url(#sk)" stroke="${LN}" stroke-width="2"/>`;
  function arms(P, pose, F) {
    if (pose !== 'punch') return both(armL(P, F.cuff ? F.cuff() : ''));
    let s = armL(P, F.cuff ? F.cuff() : ''); // braço esquerdo na guarda
    // punhos-fantasma da rajada
    const ghosts = [[150, 70, .55], [44, 66, .5], [160, 140, .6], [30, 128, .45], [128, 40, .5], [70, 44, .45], [176, 104, .45]];
    for (const [x, y, s2] of ghosts) s += fist(P, x, y, s2 * 0.95, 0.42);
    // braço direito vindo para a frente (encurtado) e punho grande
    s += P_('M150 92 Q160 112 146 126 L126 128 Q132 108 138 96 Z', 'url(#sk)') + `<ellipse cx="138" cy="94" rx="14" ry="14" fill="url(#sk)" stroke="${LN}" stroke-width="2"/>`;
    s += fist(P, 130, 116, 1.02);
    s += `<g stroke="#fff" stroke-width="2" opacity=".7">${[[96, 112, 70, 116], [98, 124, 66, 132], [104, 136, 80, 154], [150, 84, 170, 64], [158, 120, 186, 128]].map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}"/>`).join('')}</g>`;
    return s;
  }
  const neck = (P) => P_('M90 60 L110 60 L112 78 Q100 84 88 78 Z', sh(P.skin, -0.12));
  const faceShape = 'M82 40 Q82 18 100 17 Q118 18 118 40 Q118 56 110 64 Q100 72 90 64 Q82 56 82 40 Z';
  // olhos de anime, intensos
  const eyes = (P, o = {}) => both(`<path d="M85 42 Q91 37 98 41 Q92 45.5 85 42 Z" fill="${o.white || '#ffffff'}" stroke="${LN}" stroke-width="1.6"/><circle cx="92.5" cy="41.6" r="2.3" fill="${P.eye}" ${P.glowEye ? 'filter="url(#gl)"' : ''}/>` + L_(o.brow || 'M84 36.5 L97.5 38.5', LN, 2.8));
  function figure(P, pose, F) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}${F.menace || ''}
      ${F.back ? F.back() : ''}${mist(P)}${legs(P, F.legs ? F.legs() : '')}
      ${torso(P)}${F.torso ? F.torso() : ''}
      ${arms(P, pose, F)}${F.arms ? F.arms(pose) : ''}
      ${neck(P)}${P_(faceShape, 'url(#sk)')}${F.face ? F.face() : eyes(P)}${F.head ? F.head() : ''}
      ${F.front ? F.front(pose) : ''}</svg>`;
  }
  // "ゴゴゴ" ameaçador ao fundo (só nos retratos)
  const menace = (col) => `<g font-family="sans-serif" font-weight="900" fill="${col}" opacity=".55" stroke="${LN}" stroke-width="1.5">${[[8, 40, 26, -12], [16, 76, 22, -6], [168, 34, 24, 10], [172, 70, 20, 14]].map(([x, y, s, r]) => `<text x="${x}" y="${y}" font-size="${s}" transform="rotate(${r} ${x} ${y})">ゴ</text>`).join('')}</g>`;

  // ------------------------------------------------------------------ cada Eco
  const D = {};
  // Punho Estelar — Star Platinum: pele violeta, juba negra selvagem, faixa dourada, cachecol vermelho, ombreiras e braceletes dourados
  D.punho_estelar = (pose, v) => {
    const P = { skin: '#8d6fe0', acc: '#e8b830', acc2: '#d8302a', eye: v ? '#ffe08a' : '#3ae0ff', aura: v ? '#ffd98a' : '#a98bff', glowEye: true };
    return figure(P, pose, {
      back: () => P_('M84 26 Q60 34 54 64 Q48 94 40 120 L58 104 L54 138 L70 108 L72 150 L82 106 L88 70 L112 70 L118 106 L128 150 L130 108 L146 138 L142 104 L160 120 Q152 94 146 64 Q140 34 116 26 Q100 16 84 26 Z', '#1c1a30') + L_('M60 70 Q56 96 50 112 M140 70 Q144 96 150 112', '#3a3660', 2),
      torso: () => P_('M76 154 L124 154 L127 168 L73 168 Z', 'url(#ac)') + P_('M88 168 L112 168 L108 200 L100 194 L92 200 Z', 'url(#a2)') + `<circle cx="100" cy="161" r="5" fill="${sh(P.acc, -0.2)}" stroke="${LN}" stroke-width="1.6"/>`,
      cuff: () => P_('M45 158 L64 158 L64 170 L44 170 Z', 'url(#ac)'),
      arms: () => both(P_('M48 84 Q60 74 76 82 L74 98 Q60 92 48 100 Z', 'url(#ac)') + `<path d="${starP(62, 90, 4)}" fill="#fff6c8" stroke="${LN}" stroke-width=".8"/>`),
      face: () => eyes(P, { brow: 'M84 35 L98 39' }) + L_('M100 44 L98 51 L101 52', sh(P.skin, -0.5), 1.4) + L_('M94 58 Q100 56 106 58', LN, 2),
      head: () => P_('M80 30 Q100 22 120 30 L120 35 Q100 28 80 35 Z', 'url(#ac)') + `<circle cx="100" cy="29" r="3.2" fill="#d8302a" stroke="${LN}" stroke-width="1.2"/>` +
        P_('M80 28 Q82 10 100 8 Q118 10 120 28 L114 20 L110 30 L104 18 L100 30 L96 18 L90 30 L86 20 Z', '#1c1a30'),
      front: () => P_('M84 70 Q100 82 116 70 L120 80 Q100 92 80 80 Z', 'url(#a2)') + P_('M114 78 Q134 86 150 76 Q144 92 156 100 Q134 104 118 90 Z', 'url(#a2)'),
    });
  };
  // Instante Dourado — The World: corpo amarelo com detalhes verde-escuros, máscara com marcas de lágrima, corações nos joelhos, tanques nas costas
  D.instante_dourado = (pose) => {
    const P = { skin: '#f4c838', acc: '#1f6a42', acc2: '#e8e8ee', eye: '#ffffff', aura: '#ffe28a' };
    return figure(P, pose, {
      back: () => both(P_('M60 70 L72 60 L78 104 L66 112 Z', 'url(#ac)') + `<circle cx="70" cy="64" r="5" fill="url(#a2)" stroke="${LN}" stroke-width="1.6"/>`),
      legs: () => both(`<path d="${heartP(89, 212, 9)}" fill="url(#ac)" stroke="${LN}" stroke-width="2"/>`),
      torso: () => both(L_('M66 96 Q70 120 80 150', P.acc, 3)) + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)') + `<path d="${heartP(100, 160, 7)}" fill="${P.skin}" stroke="${LN}" stroke-width="1.6"/>` + both(`<path d="${heartP(84, 100, 5)}" fill="url(#ac)" stroke="${LN}" stroke-width="1.4"/>`),
      cuff: () => P_('M45 160 L63 160 L63 166 L44 166 Z', 'url(#ac)'),
      arms: () => both(P_('M47 86 Q62 74 78 84 L72 96 Q60 90 50 98 Z', 'url(#ac)')),
      face: () => P_('M86 48 L114 48 L112 62 Q100 70 88 62 Z', 'url(#a2)') + L_('M90 52 L110 52 M91 56 L109 56', sh(P.acc2, -0.4), 1.2) + both(`<path d="M86 40 L97 40 L96 44 L87 44 Z" fill="#fff" stroke="${LN}" stroke-width="1.4"/><circle cx="91.5" cy="42" r="1.4" fill="${LN}"/>` + L_('M88 45 L86 54 M93 45 L92 52', P.acc, 2.4)) + L_('M84 36 L97 38', LN, 2.6) + L_('M116 36 L103 38', LN, 2.6),
      head: () => P_('M80 34 Q80 14 100 12 Q120 14 120 34 L113 28 L100 32 L87 28 Z', 'url(#ac)') + P_('M78 32 L68 18 L84 28 Z', 'url(#ac)') + P_('M122 32 L132 18 L116 28 Z', 'url(#ac)') + `<path d="${heartP(100, 22, 4)}" fill="${P.skin}" stroke="${LN}" stroke-width="1.2"/>`,
    });
  };
  // Diamante Rosa — Crazy Diamond: corpo rosa, armadura azul-clara com corações, capacete com canos dos lados
  D.diamante_rosa = (pose) => {
    const P = { skin: '#ff94cc', acc: '#7fe2ea', acc2: '#ffffff', eye: '#3ae0ff', aura: '#ffb0e0', glowEye: true };
    return figure(P, pose, {
      back: () => both(L_('M84 38 Q66 44 66 70 Q66 86 74 92', '#6ac8d0', 5) + L_('M84 38 Q66 44 66 70 Q66 86 74 92', LN, 1, 'opacity=".6"')),
      legs: () => both(`<path d="${heartP(89, 210, 9)}" fill="url(#ac)" stroke="${LN}" stroke-width="2"/>`),
      torso: () => P_('M80 82 Q100 92 120 82 L118 98 Q100 106 82 98 Z', 'url(#ac)') + `<path d="${heartP(100, 112, 9)}" fill="url(#ac)" stroke="${LN}" stroke-width="2"/>` + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)') + `<path d="${heartP(100, 160, 6)}" fill="${P.skin}" stroke="${LN}" stroke-width="1.4"/>`,
      cuff: () => P_('M44 156 L64 156 L64 170 L44 170 Z', 'url(#ac)') + `<path d="${heartP(54, 163, 4)}" fill="${P.skin}" stroke="${LN}" stroke-width="1"/>`,
      arms: () => both(`<path d="${heartP(62, 92, 14)}" fill="url(#ac)" stroke="${LN}" stroke-width="2"/>`),
      face: () => eyes(P, { brow: 'M84 36 L97 39' }) + L_('M86 50 L94 50 M106 50 L114 50', sh(P.skin, -0.45), 1.6) + L_('M95 58 L105 58', LN, 2) + `<path d="${heartP(100, 30, 4)}" fill="url(#ac)" stroke="${LN}" stroke-width="1.2"/>`,
      head: () => P_('M80 34 Q80 12 100 10 Q120 12 120 34 Q112 26 100 26 Q88 26 80 34 Z', 'url(#ac)') + both(P_('M78 30 L72 32 L72 46 L80 46 Z', 'url(#ac)')),
    });
  };
  // Vida Áurea — Gold Experience: dourado, três cachos no alto da cabeça, joaninhas no peito e na testa
  D.vida_aurea = (pose) => {
    const P = { skin: '#f2c43c', acc: '#3a5a32', acc2: '#d8302a', eye: '#3ae08a', aura: '#fff2a8', glowEye: true };
    const bug = (x, y, r) => `<g><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.1}" fill="url(#a2)" stroke="${LN}" stroke-width="1.4"/><path d="M${x} ${y - r * 1.1} L${x} ${y + r * 1.1}" stroke="${LN}" stroke-width="1.2"/>${[[-0.45, -0.3], [0.45, -0.3], [-0.4, 0.4], [0.4, 0.4]].map(([a, b]) => `<circle cx="${(x + a * r).toFixed(1)}" cy="${(y + b * r).toFixed(1)}" r="${(r * 0.18).toFixed(1)}" fill="${LN}"/>`).join('')}<circle cx="${x}" cy="${y - r * 1.15}" r="${r * 0.38}" fill="${LN}"/></g>`;
    return figure(P, pose, {
      torso: () => both(L_('M70 88 Q78 100 74 112 M66 118 Q72 132 80 150', P.acc, 2.4)) + bug(100, 100, 7) + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)') + bug(100, 160, 4.5),
      cuff: () => P_('M45 160 L63 160 L63 166 L44 166 Z', 'url(#ac)'),
      arms: () => both(bug(62, 92, 6)),
      face: () => eyes(P) + both(L_('M86 46 L84 56', P.acc, 2)) + L_('M95 58 L105 58', LN, 2) + P_('M86 30 L114 30 L112 36 L88 36 Z', 'url(#ac)'),
      head: () => [[84, 20], [100, 14], [116, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="url(#sk)" stroke="${LN}" stroke-width="2"/><path d="M${x - 4} ${y} Q${x} ${y - 6} ${x + 4} ${y} Q${x} ${y + 4} ${x - 2} ${y}" fill="none" stroke="${sh(P.skin, -0.45)}" stroke-width="1.4"/>`).join('') + bug(100, 28, 4),
    });
  };
  // Cavaleiro de Prata — Silver Chariot: armadura prateada esguia, elmo com crista, rapieira
  D.cavaleiro_prata = (pose) => {
    const P = { skin: '#d6dde8', acc: '#e0b840', acc2: '#3a62c8', eye: '#9fe3ff', aura: '#cfe0ff', fist: '#c0c8d6', glowEye: true };
    return figure(P, pose, {
      back: () => pose === 'punch' ? '' : L_('M150 176 L188 20', '#eef4ff', 3) + L_('M150 176 L188 20', LN, .8),
      torso: () => P_('M72 86 Q100 78 128 86 L124 126 Q100 136 76 126 Z', '#e8eef6') + L_('M100 84 L100 132 M80 100 Q100 108 120 100 M78 116 Q100 124 122 116', '#8a96a8', 1.6) + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)'),
      arms: (pose2) => both(P_('M44 84 Q60 70 80 82 L76 100 Q62 92 46 102 Z', '#eef2f8') + P_('M44 84 L38 72 L52 80 Z', 'url(#ac)')) + (pose2 === 'punch' ? `<g stroke="#eef4ff" stroke-width="3">${[[110, 116, 190, 40], [110, 120, 196, 96], [110, 124, 170, 180], [108, 118, 128, 10]].map(([a, b, c, d]) => `<path d="M${a} ${b} L${c} ${d}"/>`).join('')}</g>` : P_('M146 170 L156 166 L160 174 L150 178 Z', 'url(#ac)')),
      face: () => P_('M84 30 L116 30 L116 54 Q100 66 84 54 Z', '#e8eef6') + `<rect x="86" y="40" width="28" height="4" rx="2" fill="${LN}"/><rect x="88" y="41" width="9" height="2" fill="${P.eye}" filter="url(#gl)"/><rect x="103" y="41" width="9" height="2" fill="${P.eye}" filter="url(#gl)"/>` + L_('M100 46 L100 62 M90 50 L110 50', '#8a96a8', 1.4),
      head: () => P_('M80 34 Q82 12 100 10 Q118 12 120 34 Z', '#eef2f8') + P_('M96 12 L104 12 L114 -4 L110 16 Z', 'url(#a2)') + L_('M100 12 L100 30', '#8a96a8', 1.4),
    });
  };
  // Rainha Explosiva — Killer Queen: rosa, orelhas de gato, listras no rosto, caveira no cinto, luvas escuras
  D.rainha_explosiva = (pose, v) => {
    const P = { skin: v ? '#dc96d0' : '#e8a2d6', acc: '#3a2a48', acc2: '#f0ece6', eye: '#ffffff', aura: v ? '#b07aff' : '#ff9a6a', fist: '#4a3a58' };
    const skull = (x, y, s) => `<g><path d="M${x - 6 * s} ${y} Q${x - 6 * s} ${y - 8 * s} ${x} ${y - 8 * s} Q${x + 6 * s} ${y - 8 * s} ${x + 6 * s} ${y} L${x + 4 * s} ${y + 3 * s} L${x - 4 * s} ${y + 3 * s} Z" fill="url(#a2)" stroke="${LN}" stroke-width="1.2"/><circle cx="${x - 2.4 * s}" cy="${y - 3 * s}" r="${1.6 * s}" fill="${LN}"/><circle cx="${x + 2.4 * s}" cy="${y - 3 * s}" r="${1.6 * s}" fill="${LN}"/></g>`;
    return figure(P, pose, {
      legs: () => both(skull(89, 212, 1.3)),
      torso: () => both(L_('M66 100 Q70 118 78 132', '#b070a8', 2.4)) + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)') + skull(100, 163, 1.2) + both(`<circle cx="82" cy="160" r="1.8" fill="#c8c8d0"/><circle cx="90" cy="160" r="1.8" fill="#c8c8d0"/>`),
      cuff: () => P_('M45 156 L63 156 L63 168 L44 168 Z', 'url(#ac)') + both(`<circle cx="50" cy="162" r="1.4" fill="#c8c8d0"/><circle cx="57" cy="162" r="1.4" fill="#c8c8d0"/>`),
      face: () => both(`<path d="M86 40 L98 41 L96 45 L87 44 Z" fill="#fff" stroke="${LN}" stroke-width="1.4"/><circle cx="91.5" cy="42.4" r="1.6" fill="#7a3a6a"/>` + L_('M84 48 L96 50 M84 52 L95 54', '#7a3a6a', 1.6)) + L_('M95 58 L105 58', LN, 2),
      head: () => both(P_('M82 30 L80 4 L96 22 Z', 'url(#sk)') + P_('M84 26 L83 12 L92 22 Z', '#ffd0ec')) + P_('M82 36 Q84 18 100 17 Q116 18 118 36 Q100 28 82 36 Z', 'url(#sk)'),
    });
  };
  // Ave de Brasa — Magician's Red: corpo vermelho-alaranjado, cabeça de ave de rapina, chamas e ankh de fogo
  D.ave_brasa = (pose) => {
    const P = { skin: '#e8643a', acc: '#ffcf3a', acc2: '#ff9a2a', eye: '#fff2a8', aura: '#ff9a3a', glowEye: true };
    const flame = (x, y, s) => `<path d="M${x} ${y + 12 * s} Q${x - 10 * s} ${y + 4 * s} ${x - 4 * s} ${y - 8 * s} Q${x - 2 * s} ${y} ${x + 1 * s} ${y - 3 * s} Q${x} ${y - 12 * s} ${x + 6 * s} ${y - 16 * s} Q${x + 4 * s} ${y - 4 * s} ${x + 9 * s} ${y + 2 * s} Q${x + 10 * s} ${y + 10 * s} ${x} ${y + 12 * s} Z" fill="url(#a2)" stroke="${LN}" stroke-width="1.2" opacity=".95"/><path d="M${x + 1 * s} ${y + 9 * s} Q${x - 4 * s} ${y + 3 * s} ${x + 1 * s} ${y - 4 * s} Q${x + 5 * s} ${y + 2 * s} ${x + 1 * s} ${y + 9 * s} Z" fill="#fff2a8"/>`;
    return figure(P, pose, {
      back: () => [[40, 140, 1.3], [160, 136, 1.4], [34, 90, 1], [168, 86, 1.1], [56, 50, .9], [146, 46, 1]].map(([x, y, s]) => flame(x, y, s)).join(''),
      torso: () => [0, 1, 2].map((i) => both(`<path d="M${88 - i * 2} ${96 + i * 10} Q${94 - i * 2} ${104 + i * 10} ${100} ${100 + i * 10}" fill="none" stroke="${sh(P.skin, -0.4)}" stroke-width="1.6"/>`)).join('') + P_('M76 154 L124 154 L126 166 L74 166 Z', '#3a2418') + P_('M90 166 L110 166 L106 196 L100 190 L94 196 Z', 'url(#ac)'),
      cuff: () => P_('M45 156 L63 156 L63 168 L44 168 Z', 'url(#ac)'),
      face: () => P_('M86 42 L114 42 L104 56 L100 70 L96 56 Z', 'url(#ac)') + L_('M96 56 L104 56', LN, 1.4) + both(`<path d="M84 34 L96 36 L95 40 L85 39 Z" fill="${P.eye}" filter="url(#gl)" stroke="${LN}" stroke-width="1.2"/>`),
      head: () => P_('M82 30 Q86 4 100 2 Q114 4 118 30 Q110 20 100 20 Q90 20 82 30 Z', 'url(#sk)') + both(P_('M86 16 L74 6 L88 22 Z', 'url(#a2)') + P_('M90 10 L82 -4 L94 14 Z', 'url(#a2)')),
      front: (pose2) => pose2 === 'punch' ? `<g transform="translate(150 60)">${flame(0, 0, 1.6)}<path d="M-6 -30 Q-12 -44 0 -48 Q12 -44 6 -30 L14 -30 L14 -22 L4 -22 L4 4 L-4 4 L-4 -22 L-14 -22 L-14 -30 Z" fill="url(#a2)" stroke="${LN}" stroke-width="1.6" filter="url(#gl)"/></g>` : '',
    });
  };
  // Sacerdote Esmeralda — Hierophant Green: esguio, verde com listras de melão, olhos grandes, fitas no lugar das pernas
  D.sacerdote_esmeralda = (pose) => {
    const P = { skin: '#46c872', acc: '#b8ffc8', acc2: '#1a7a44', eye: '#e8fff0', aura: '#7fffb0', glowEye: true };
    const ribbon = (x0, x1, c) => `<path d="M${x0} 160 Q${x0 - 10} 200 ${x1} 252" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="M${x0} 160 Q${x0 - 10} 200 ${x1} 252" fill="none" stroke="${LN}" stroke-width="1" opacity=".4"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${ribbon(84, 60, '#2a9a5a')}${ribbon(96, 92, '#46c872')}${ribbon(108, 118, '#2a9a5a')}${ribbon(118, 146, '#46c872')}
      ${P_('M80 80 Q100 72 120 80 Q130 100 124 128 Q118 148 112 162 L88 162 Q82 148 76 128 Q70 100 80 80 Z', 'url(#sk)')}
      ${[84, 92, 100, 108, 116].map((x) => L_(`M${x} 80 Q${x + (x - 100) * 0.2} 120 ${x - (x - 100) * 0.3} 160`, '#b8ffc8', 1.4)).join('')}
      ${both(P_('M76 84 Q62 100 60 124 Q58 140 66 150 L74 148 Q70 128 82 100 Z', 'url(#sk)') + L_('M68 104 L66 140', '#b8ffc8', 1.2))}
      ${pose === 'punch' ? [[150, 60], [166, 90], [140, 30], [176, 126], [130, 120], [46, 48]].map(([x, y]) => `<path d="M${x} ${y - 7} L${x + 6} ${y} L${x} ${y + 7} L${x - 6} ${y} Z" fill="#7fffb0" stroke="${LN}" stroke-width="1.2" filter="url(#gl)"/>`).join('') : ''}
      ${P_('M90 62 L110 62 L112 80 Q100 86 88 80 Z', sh(P.skin, -0.15))}
      ${P_('M80 40 Q80 14 100 12 Q120 14 120 40 Q120 60 100 68 Q80 60 80 40 Z', 'url(#sk)')}
      ${[88, 94, 100, 106, 112].map((x) => L_(`M${x} 14 Q${x} 40 ${x} 66`, '#b8ffc8', 1.2)).join('')}
      ${both(`<ellipse cx="91" cy="40" rx="7" ry="5" fill="${LN}"/><ellipse cx="91" cy="40" rx="5" ry="3" fill="${P.eye}" filter="url(#gl)"/>`)}
      ${L_('M90 54 L110 54 M92 58 L108 58', '#1a7a44', 1.6)}</svg>`;
  };
  // Fio Livre — Stone Free: azul com faixas claras de fio, visor tipo óculos, fios saindo dos dedos
  D.fio_livre = (pose) => {
    const P = { skin: '#3c8ad8', acc: '#9fe3ff', acc2: '#1a3a6a', eye: '#e8fbff', aura: '#9fe3ff' };
    return figure(P, pose, {
      torso: () => [96, 108, 120, 132, 144].map((y) => both(L_(`M${70 + (y - 96) * 0.1} ${y} Q86 ${y + 4} 99 ${y}`, '#c8f0ff', 1.6, 'stroke-dasharray="3 2"'))).join('') + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#a2)') + `<path d="${starP(100, 160, 5)}" fill="#fff6c8" stroke="${LN}" stroke-width="1"/>`,
      arms: (pose2) => pose2 === 'punch' ? '' : both(L_('M48 186 Q40 210 52 236 Q60 220 56 206', '#c8f0ff', 1.6)),
      face: () => P_('M82 36 L118 36 L116 48 L84 48 Z', '#1a3a6a') + both(`<rect x="86" y="38" width="11" height="7" rx="2" fill="${P.acc}" filter="url(#gl)"/>`) + L_('M95 58 L105 58', LN, 2),
      head: () => P_('M80 34 Q80 12 100 10 Q120 12 120 34 Q100 26 80 34 Z', 'url(#a2)') + both(`<circle cx="84" cy="14" r="8" fill="url(#a2)" stroke="${LN}" stroke-width="2"/>`) + L_('M86 22 Q100 18 114 22', '#9fe3ff', 1.4),
    });
  };
  // Eco Sonoro — Echoes. Ato 1: cabeção verde com sulcos, olhos enormes, corpinho branco de larva, cauda e letras de som
  const soundTxt = (list) => list.map(([t, x, y, s, r, c]) => `<text x="${x}" y="${y}" font-family="Impact, 'Arial Black', sans-serif" font-weight="900" font-size="${s}" fill="${c || '#e8ffd8'}" stroke="${LN}" stroke-width="2.4" paint-order="stroke" transform="rotate(${r} ${x} ${y})">${t}</text>`).join('');
  D.eco_sonoro = (pose) => {
    const P = { skin: '#7cd05a', acc: '#f4f6f0', acc2: '#3a3a44', eye: '#3a3a44', aura: '#c8ffb0' };
    const sw = pose === 'idle1' ? 6 : 0;
    const letters = pose === 'punch' ? [['BUM!', 124, 60, 26, -10, '#fff6a8'], ['DOOM', 24, 76, 20, 12]] : [['S', 28, 64, 28, -10], ['H', 160, 52, 26, 12], ['Z', 156, 126, 24, -6]];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${P_(`M108 168 Q${140 + sw} 196 ${150 + sw} 230 Q${154 + sw} 244 ${140 + sw} 246 L${132 + sw} 236 Q128 206 100 186 Z`, 'url(#sk)')}
      ${[0, 1, 2, 3].map((k) => L_(`M${112 + k * 9 + sw * k / 4} ${178 + k * 15} l8 -6`, sh(P.skin, -0.4), 1.4)).join('')}
      ${P_(`M${138 + sw} 230 L${164 + sw} 234 L${146 + sw} 252 Z`, 'url(#sk)')}
      ${P_('M100 112 Q130 116 132 150 Q132 184 100 190 Q68 184 68 150 Q70 116 100 112 Z', 'url(#ac)')}${L_('M74 136 Q100 146 126 136 M72 154 Q100 164 128 154', '#c8ccc0', 1.4)}
      ${both(P_('M70 128 Q56 138 58 156 L66 158 Q68 144 76 136 Z', 'url(#sk)') + P_('M57 154 L54 162 L60 160 L62 166 L66 157 Z', 'url(#sk)').replace('stroke-width="2"', 'stroke-width="1.4"'))}
      ${P_('M100 30 Q144 30 144 76 Q144 118 100 118 Q56 118 56 76 Q56 30 100 30 Z', 'url(#sk)')}
      ${L_('M64 56 Q100 40 136 56 M60 70 Q100 54 140 70', sh(P.skin, -0.35), 1.6)}${L_('M100 31 L100 50', sh(P.skin, -0.35), 1.6)}
      ${[[70, 46, 3], [130, 46, 3], [62, 92, 2.6], [138, 92, 2.6], [84, 38, 2.2], [116, 38, 2.2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${sh(P.skin, -0.45)}"/>`).join('')}
      <path d="M68 44 Q84 32 104 34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
      ${both(`<ellipse cx="84" cy="82" rx="13" ry="16" fill="#fff" stroke="${LN}" stroke-width="2"/><ellipse cx="86" cy="85" rx="6.5" ry="8.5" fill="${LN}"/><circle cx="83" cy="80" r="2.8" fill="#fff"/><circle cx="88.5" cy="89" r="1.2" fill="#fff"/>`)}
      ${L_('M96 106 Q100 109 104 106', LN, 1.8)}
      ${soundTxt(letters)}</svg>`;
  };
  // Ato 2: corpo maior e listrado, cabeça alongada para trás, cauda grossa que carimba palavras de som (BOING!, CHIII!)
  D['eco_sonoro~1'] = (pose) => {
    const P = { skin: '#6cc84e', acc: '#f4f6f0', acc2: '#2e3a2a', eye: '#22301e', aura: '#b8ffa0' };
    const atk = pose === 'punch', sw = pose === 'idle1' ? 5 : 0;
    const stamp = atk ? [150, 70] : [150 + sw, 214 - sw];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${P_(atk ? 'M112 176 Q150 196 166 160 Q176 132 160 96 L146 88 Q160 124 152 152 Q142 176 110 160 Z' : `M112 176 Q120 214 ${142 + sw} ${222 - sw} Q${150 + sw} ${226 - sw} ${152 + sw} ${206 - sw} L${140 + sw} ${206 - sw} Q130 206 122 168 Z`, 'url(#sk)')}
      ${atk ? [0, 1, 2].map((k) => L_(`M${150 + k * 6} ${150 - k * 20} l10 2`, sh(P.skin, -0.4), 1.4)).join('') : [0, 1, 2].map((k) => L_(`M${118 + k * 6} ${184 + k * 10} l9 -3`, sh(P.skin, -0.4), 1.4)).join('')}
      <g transform="translate(${stamp[0]} ${stamp[1]})">${P_('M-20 0 Q-20 -14 0 -14 Q20 -14 20 0 Q20 14 0 14 Q-20 14 -20 0 Z', 'url(#ac)')}${P_('M-14 0 Q-14 -9 0 -9 Q14 -9 14 0 Q14 9 0 9 Q-14 9 -14 0 Z', 'url(#sk)')}<text x="0" y="4" text-anchor="middle" font-family="Impact, sans-serif" font-weight="900" font-size="10" fill="#f4f6f0" stroke="${LN}" stroke-width="1.4" paint-order="stroke">${atk ? 'CHIII' : 'BOING'}</text></g>
      ${P_('M100 98 Q126 100 130 126 Q134 154 122 176 Q110 192 100 192 Q90 192 78 176 Q66 154 70 126 Q74 100 100 98 Z', 'url(#ac)')}
      ${both(P_('M72 120 Q66 140 72 164 Q78 176 88 184 Q84 160 86 132 Q86 114 92 104 Q78 106 72 120 Z', 'url(#sk)'))}
      ${[132, 146, 160, 174].map((y) => L_(`M86 ${y} Q100 ${y + 5} 114 ${y}`, '#b8c0b0', 1.6)).join('')}${L_('M100 104 L100 188', '#c8ccc0', 1.2)}
      ${both(P_('M72 116 Q58 120 54 138 Q52 150 58 158 L66 156 Q64 144 70 134 Z', 'url(#sk)') + P_('M54 156 L50 166 L57 163 L59 170 L64 162 L66 156 Z', 'url(#sk)').replace('stroke-width="2"', 'stroke-width="1.4"'))}
      ${P_('M70 70 Q66 40 96 32 Q128 26 150 4 Q148 34 134 54 Q138 74 130 88 Q118 104 100 104 Q78 104 70 86 Z', 'url(#sk)')}
      ${[0, 1, 2, 3].map((k) => L_(`M${80 + k * 12} ${38 - k * 4} Q${110 + k * 8} ${24 - k * 6} ${140 + k * 2} ${12 - k * 2}`, sh(P.skin, -0.35), 1.5)).join('')}
      ${[[84, 50], [106, 44], [126, 34], [96, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${sh(P.skin, -0.45)}"/>`).join('')}
      <path d="M76 52 Q88 38 108 36" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
      ${both(`<path d="M76 68 Q86 58 98 66 Q98 80 88 82 Q76 80 76 68 Z" fill="#fff" stroke="${LN}" stroke-width="2"/><ellipse cx="89" cy="71" rx="5" ry="6.5" fill="${P.eye}"/><circle cx="87" cy="68" r="2" fill="#fff"/>` + L_('M80 84 L78 96 M86 85 L85 94', sh(P.skin, -0.5), 1.8))}
      ${L_('M94 96 Q100 99 106 96', LN, 1.8)}
      ${soundTxt(atk ? [['CHIIII!', 18, 92, 22, -14, '#ffb08a'], ['BOING!', 112, 30, 18, 10, '#fff6a8']] : [['BOING', 14, 120, 18, -12], ['!', 70, 112, 18, -12]])}
      ${atk ? `<g opacity=".9">${[[30, 104], [52, 112], [40, 124]].map(([x, y]) => `<path d="M${x} ${y} q-4 -8 2 -14 q1 6 5 4 q-1 -6 3 -10 q4 8 0 16 Z" fill="#ff8a3a" stroke="${LN}" stroke-width="1"/>`).join('')}</g>` : ''}</svg>`;
  };
  // Ato 3: humanoide baixinho e forte, verde e branco, capacete com abas, o número 3 nos ombros e o golpe "3 FREEZE"
  D['eco_sonoro~2'] = (pose) => {
    const P = { skin: '#7ccf58', acc: '#f4f6f0', acc2: '#2a4024', eye: '#1e3a1a', aura: '#c8ffb0', fist: '#f4f6f0' };
    const body = figure(P, pose, {
      legs: () => both(P_('M80 176 L98 178 L97 196 L82 194 Z', 'url(#ac)')),
      torso: () => P_('M80 82 Q100 92 120 82 L118 112 Q100 122 82 112 Z', 'url(#ac)') + L_('M86 98 Q100 104 114 98', '#b8c0b0', 1.4) +
        P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#a2)') + [84, 100, 116].map((x) => `<circle cx="${x}" cy="160" r="2.4" fill="${P.acc}"/>`).join('') +
        both(`<circle cx="70" cy="128" r="2.6" fill="${sh(P.skin, -0.45)}"/><circle cx="74" cy="140" r="2" fill="${sh(P.skin, -0.45)}"/>`),
      cuff: () => P_('M44 156 L64 156 L64 168 L44 168 Z', 'url(#ac)'),
      arms: () => both(P_('M46 86 Q60 70 80 82 L76 102 Q60 94 46 104 Z', 'url(#ac)')) + [57, 135].map((x) => `<text x="${x}" y="99" font-family="Impact, sans-serif" font-weight="900" font-size="14" fill="${P.skin}" stroke="${LN}" stroke-width="1.2" paint-order="stroke">3</text>`).join(''),
      face: () => P_('M84 42 Q100 36 116 42 L116 56 Q100 70 84 56 Z', 'url(#ac)') + both(`<path d="M85 42 Q92 36 99 42 Q97 50 91 50 Q85 49 85 42 Z" fill="#e4f8d8" stroke="${LN}" stroke-width="1.8"/><circle cx="92" cy="44" r="2.6" fill="${P.eye}"/><circle cx="91" cy="43" r=".9" fill="#fff"/>` + L_('M84 39 Q92 34 100 39', LN, 2.4) + L_('M88 51 L87 58 M92 51 L92 57', sh(P.skin, -0.5), 1.4)) +
        P_('M94 58 L106 58 L105 63 L95 63 Z', '#2a4024') + L_('M97 58 L97 63 M100 58 L100 63 M103 58 L103 63', '#7ccf58', 1),
      head: () => P_('M80 38 Q78 12 100 8 Q122 12 120 38 Q112 30 100 30 Q88 30 80 38 Z', 'url(#sk)') + both(P_('M80 36 L62 22 L68 44 L82 46 Z', 'url(#sk)') + `<circle cx="72" cy="34" r="2.2" fill="${sh(P.skin, -0.45)}"/>`) + P_('M96 8 L100 -2 L104 8 Z', 'url(#sk)') + [[90, 18], [110, 18], [100, 14]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${sh(P.skin, -0.45)}"/>`).join(''),
      front: (p2) => p2 === 'punch' ? soundTxt([['3 FREEZE!', 46, 238, 26, -6, '#fff6a8']]) + `<g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85">${[[146, 150], [166, 168], [130, 176]].map(([x, y]) => `<path d="M${x} ${y} l0 18 m-6 -6 l6 6 l6 -6"/>`).join('')}</g>` : '',
    });
    // o Ato 3 é baixinho: desenha o corpo menor e mais largo
    return body.replace(/(<\/defs>)/, '$1<g transform="translate(100 150) scale(1.06 .88) translate(-100 -138)">').replace(/<\/svg>$/, '</g></svg>');
  };
  // Videira Púrpura — Hermit Purple: luva com videiras roxas espinhosas subindo em espiral
  D.videira_purpura = (pose) => {
    const P = { skin: '#9a5ac8', acc: '#e8c050', acc2: '#5a2a7a', eye: '#fff', aura: '#d0a0ff' };
    let vines = '';
    for (let k = 0; k < 3; k++) {
      let d = '', thorns = '';
      for (let t = 0; t <= 1.0001; t += 0.04) {
        const a = t * Math.PI * (pose === 'punch' ? 5 : 4) + k * 2.1, r = 8 + t * 34, x = 100 + Math.cos(a) * r, y = 200 - t * 180;
        d += `${t ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)} `;
        if (Math.round(t * 25) % 3 === 0) thorns += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a) * 6).toFixed(1)} ${(-3).toFixed(1)}" stroke="${LN}" stroke-width="1.6"/>`;
      }
      vines += `<path d="${d}" fill="none" stroke="${LN}" stroke-width="7" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${k === 1 ? '#7a3aa8' : '#9a5ac8'}" stroke-width="4.4" stroke-linejoin="round"/>${thorns}`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}${vines}
      ${[[60, 60], [140, 90], [74, 140], [126, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="4" fill="#6ab84a" stroke="${LN}" stroke-width="1.2" transform="rotate(-30 ${x} ${y})"/>`).join('')}
      ${[[84, 168], [93, 162], [102, 160], [111, 164]].map(([x, y]) => P_(`M${x} 200 L${x} ${y + 6} Q${x} ${y} ${x + 4} ${y} Q${x + 8} ${y} ${x + 8} ${y + 6} L${x + 8} 200 Z`, '#2a2230') + L_(`M${x + 1} ${y + 14} L${x + 7} ${y + 14}`, '#4a3a58', 1.2)).join('')}
      ${P_('M80 230 L80 196 Q80 188 88 188 L116 188 Q122 190 122 198 L122 230 Z', '#2a2230')}${P_('M80 206 Q68 196 70 182 Q74 178 78 184 Q80 196 88 202 Z', '#2a2230')}
      ${L_('M86 196 Q100 202 116 196', '#4a3a58', 1.4)}${P_('M78 226 L124 226 L124 240 L78 240 Z', 'url(#ac)')}${L_('M84 233 L118 233', sh(P.acc, -0.4), 1.2)}
      ${P_('M76 240 L126 240 L122 256 L80 256 Z', '#3a3040')}</svg>`;
  };
  // Seis Balas — Sex Pistols: seis espiritinhos com cabeça de bala e números na testa (1, 2, 3, 5, 6, 7 — o 4 dá azar!)
  D.seis_balas = (pose) => {
    const P = { skin: '#f2ead0', acc: '#c8302a', acc2: '#e8c050', eye: LN, aura: '#fff2a8' };
    const spots = pose === 'punch' ? [[40, 60], [100, 40], [160, 60], [52, 150], [112, 130], [168, 170]] : [[44, 70], [100, 50], [156, 70], [56, 170], [104, 150], [152, 186]];
    const nums = ['1', '2', '3', '5', '6', '7'];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${spots.map(([x, y], i) => `<g transform="translate(${x} ${y})">${P_('M-14 -2 Q-14 -26 0 -32 Q14 -26 14 -2 L14 18 L-14 18 Z', 'url(#sk)')}${P_('M-14 6 L14 6 L14 12 L-14 12 Z', 'url(#ac)')}
        <circle cx="-6" cy="-6" r="3.2" fill="#fff" stroke="${LN}" stroke-width="1.2"/><circle cx="6" cy="-6" r="3.2" fill="#fff" stroke="${LN}" stroke-width="1.2"/><circle cx="-5.5" cy="-5.5" r="1.5" fill="${LN}"/><circle cx="6.5" cy="-5.5" r="1.5" fill="${LN}"/>
        ${L_(i % 2 ? 'M-4 2 Q0 5 4 2' : 'M-4 3 L4 3', LN, 1.6)}<text x="0" y="-15" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="10" fill="${P.acc}">${nums[i]}</text>
        ${P_('M-12 18 L-8 30 L-4 18 Z M4 18 L8 30 L12 18 Z', 'url(#sk)')}${pose === 'punch' ? `<path d="M16 -2 l14 -4 l2 4 l-14 4 Z" fill="url(#a2)" stroke="${LN}" stroke-width="1"/>` : ''}</g>`).join('')}</svg>`;
  };
  // ------------------------------------------------------------------ formas evoluídas
  const inject = (svg, back = '', front = '') => svg.replace('</defs>', `</defs>${back}`).replace(/<\/svg>$/, `${front}</svg>`);
  // relógio parado atrás do Eco (Punho Estelar: O Mundo)
  const clock = (cx, cy, r, col, op = 0.5) => {
    let s = `<g opacity="${op}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="4"/><circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="${col}" stroke-width="1.4" stroke-dasharray="2 5"/>`;
    const RN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    for (let k = 0; k < 12; k++) { const a = -Math.PI / 2 + k * Math.PI / 6, x = cx + Math.cos(a) * (r - 18), y = cy + Math.sin(a) * (r - 18); s += `<text x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="9" fill="${col}">${RN[k]}</text>`; }
    return s + `<path d="M${cx} ${cy} L${cx} ${cy - r + 26} M${cx} ${cy} L${cx + r * 0.4} ${cy + 4}" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="4" fill="${col}"/></g>`;
  };
  D['punho_estelar~1'] = (pose) => inject(D.punho_estelar(pose, 1),
    `${clock(100, 104, 92, '#ffe08a', 0.42)}${[110, 124].map((r) => `<circle cx="100" cy="104" r="${r}" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="1 9" opacity=".5"/>`).join('')}`,
    pose === 'punch' ? soundTxt([['O MUNDO!', 18, 246, 24, -4, '#ffe08a']]) : [[30, 150], [170, 160], [40, 40], [166, 30]].map(([x, y]) => spark(x, y, 5, '#ffe08a')).join(''));

  // Vida Áurea Réquiem — Gold Experience Requiem: mais dourado e solene, abas brancas na cabeça, pérolas, besouro-flecha no peito e na testa, raios de luz
  D['vida_aurea~1'] = (pose) => {
    const P = { skin: '#f7d24a', acc: '#faf4e2', acc2: '#2a2a34', eye: '#7fffb0', aura: '#fff3b0', glowEye: true };
    const pearl = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#ac)" stroke="${LN}" stroke-width="1.4"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.3}" fill="#fff"/>`;
    const beetle = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">${P_('M-3 -2 Q-16 -10 -18 4 Q-10 10 -3 6 Z', 'url(#ac)')}${P_('M3 -2 Q16 -10 18 4 Q10 10 3 6 Z', 'url(#ac)')}${P_('M0 -16 L8 -4 L-8 -4 Z', '#b88a1a')}<ellipse cx="0" cy="4" rx="6" ry="8" fill="#3ae08a" stroke="${LN}" stroke-width="1.8"/><path d="M0 -4 L0 12" stroke="${LN}" stroke-width="1.2"/><circle cx="-2" cy="1" r="1.6" fill="#fff" opacity=".7"/></g>`;
    const rays = Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8 + (pose === 'idle1' ? 0.1 : 0); return `<path d="M100 104 L${(100 + Math.cos(a - 0.06) * 140).toFixed(1)} ${(104 + Math.sin(a - 0.06) * 140).toFixed(1)} L${(100 + Math.cos(a + 0.06) * 140).toFixed(1)} ${(104 + Math.sin(a + 0.06) * 140).toFixed(1)} Z" fill="#fff6c8" opacity=".3"/>`; }).join('');
    return figure(P, pose, {
      back: () => rays + [[26, 60], [176, 70], [20, 150], [182, 160], [60, 24], [144, 20]].map(([x, y]) => pearl(x, y, 4)).join(''),
      legs: () => both(beetle(89, 212, 0.7)),
      torso: () => both(P_('M68 82 Q84 74 99 82 L96 96 Q82 90 70 98 Z', 'url(#ac)') + L_('M74 90 L94 88', sh(P.acc, -0.3), 1)) + beetle(100, 116, 1.1) +
        both(L_('M68 112 Q72 128 80 146', '#c89a20', 2.2)) + P_('M76 154 L124 154 L126 166 L74 166 Z', 'url(#ac)') + [86, 100, 114].map((x) => pearl(x, 160, 3)).join(''),
      cuff: () => P_('M45 158 L63 158 L63 168 L44 168 Z', 'url(#ac)') + pearl(54, 163, 2.4),
      arms: () => both(pearl(52, 86, 5) + pearl(60, 78, 5) + pearl(70, 74, 5)),
      face: () => eyes(P, { brow: 'M84 36 L98 39' }) + both(L_('M86 46 L84 58 M90 47 L89 54', '#c89a20', 1.8)) + L_('M100 44 L98 51 L101 52', sh(P.skin, -0.45), 1.3) + L_('M94 59 L106 59', LN, 2),
      head: () => both(P_('M82 34 Q64 20 60 -2 Q76 10 88 22 Z', 'url(#ac)') + L_('M80 28 Q70 18 66 6', sh(P.acc, -0.3), 1)) +
        P_('M82 36 Q82 14 100 12 Q118 14 118 36 Q100 26 82 36 Z', 'url(#sk)') + P_('M94 14 L100 0 L106 14 Z', 'url(#sk)') + beetle(100, 26, 0.62),
      front: (p2) => p2 === 'punch' ? soundTxt([['MUDA!', 112, 34, 22, 10, '#fff6a8'], ['MUDA!', 14, 70, 18, -12, '#fff6a8']]) : '',
    });
  };

  // Cavaleiro Réquiem — Chariot Requiem: figura escura e alta com desenhos prateados, olho em fenda, a Flecha na testa e almas girando em volta
  D['cavaleiro_prata~1'] = (pose) => {
    const P = { skin: '#2f3142', acc: '#c9d2e2', acc2: '#e8c050', eye: '#f4f8ff', aura: '#9a8ad8', glowEye: true, fist: '#3a3c50' };
    const ph = pose === 'idle1' ? 0.6 : 0;
    const soul = (x, y, s, r) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})" opacity=".9"><path d="M0 -8 Q8 -8 8 0 Q8 6 2 8 Q-2 16 -12 20 Q-6 12 -6 6 Q-8 0 -6 -4 Q-4 -8 0 -8 Z" fill="#e8f0ff" stroke="#8a9ad8" stroke-width="1.2" filter="url(#gl)"/><circle cx="-1" cy="-1" r="1.2" fill="#3a3c50"/><circle cx="3" cy="-1" r="1.2" fill="#3a3c50"/></g>`;
    const souls = [0, 1, 2, 3, 4].map((k) => { const a = k * 1.256 + ph + (pose === 'punch' ? 0.3 : 0), rx = pose === 'punch' ? 92 : 78; return soul(100 + Math.cos(a) * rx, 120 + Math.sin(a) * 40, 0.9, a * 57 + 90); }).join('');
    return figure(P, pose, {
      back: () => P_('M70 74 Q36 120 42 206 L60 178 L56 238 L80 186 L92 246 L104 188 L120 244 L130 184 L148 232 L146 176 L160 204 Q166 120 130 74 Z', '#151624') + souls,
      torso: () => both(L_('M70 92 Q80 100 96 96 M68 108 Q76 112 84 108 L90 122 M74 132 Q84 128 92 138', P.acc, 1.8) + `<circle cx="84" cy="100" r="2" fill="${P.acc}"/>`) + L_('M100 88 L100 150', P.acc, 1.4) +
        P_('M76 154 L124 154 L126 166 L74 166 Z', '#1d1e2c') + L_('M80 160 L120 160', P.acc, 1.4) + `<path d="M64 98 Q70 120 82 152" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="5"/>`,
      cuff: () => P_('M45 158 L63 158 L63 168 L44 168 Z', 'url(#ac)'),
      arms: () => both(P_('M44 86 Q58 72 80 82 L76 98 Q62 92 46 102 Z', 'url(#ac)') + P_('M44 86 L36 70 L54 80 Z', 'url(#ac)')),
      face: () => P_('M84 30 L116 30 L116 54 Q100 68 84 54 Z', '#1d1e2c') + `<rect x="86" y="40" width="28" height="4.4" rx="2.2" fill="${P.eye}" filter="url(#gl)"/>` + L_('M100 47 L100 62 M92 52 L92 58 M108 52 L108 58', P.acc, 1.2),
      head: () => P_('M80 34 Q78 4 100 -4 Q122 4 120 34 Z', 'url(#sk)') + both(L_('M86 30 Q86 12 96 2', P.acc, 1.6)) +
        `<g filter="url(#gl)">${P_('M100 6 L108 22 L103 22 L103 30 L97 30 L97 22 L92 22 Z', 'url(#a2)')}</g>`,
      front: (p2) => p2 === 'punch' ? soundTxt([['Z', 150, 48, 24, 10, '#cfe0ff'], ['z', 172, 30, 18, 14, '#cfe0ff'], ['Z', 24, 60, 22, -10, '#cfe0ff']]) + [70, 96].map((r) => `<ellipse cx="100" cy="120" rx="${r}" ry="${r * 0.45}" fill="none" stroke="#cfe0ff" stroke-width="2" opacity=".5"/>`).join('') : '',
    });
  };

  // Rainha Explosiva: Mordida do Pó — Bites the Dust: espiral do tempo voltando, poeira subindo e faíscas de explosão
  D['rainha_explosiva~1'] = (pose) => {
    const ph = pose === 'idle1' ? 0.5 : 0;
    const spiral = swirl(100, 104, 96, 2.4, '#c8a0ff', 2.4, ph) + swirl(100, 104, 80, 2, '#ffb08a', 1.4, ph + 2);
    const arrows = [0, 1, 2, 3].map((k) => { const a = k * Math.PI / 2 + ph, x = 100 + Math.cos(a) * 92, y = 104 + Math.sin(a) * 92; return `<path d="M0 -6 L-8 0 L0 6 Z" fill="#c8a0ff" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(a * 57 + 180).toFixed(0)})"/>`; }).join('');
    const dust = Array.from({ length: 14 }, (_, k) => { const x = 20 + ((k * 53) % 160), y = 240 - ((k * 37 + (ph ? 20 : 0)) % 200); return `<circle cx="${x}" cy="${y}" r="${1.4 + (k % 3)}" fill="#e8d8c0" opacity="${0.35 + (k % 3) * 0.15}"/>`; }).join('');
    return inject(D.rainha_explosiva(pose, 1), `<g opacity=".55">${spiral}${arrows}</g>`,
      dust + (pose === 'punch' ? `<g transform="translate(150 70)"><path d="${starP(0, 0, 30)}" fill="#ffb84d" stroke="${LN}" stroke-width="1.6" opacity=".9"/><path d="${starP(0, 0, 16)}" fill="#fff6c8"/></g>` + soundTxt([['KABUM!', 112, 30, 22, 8, '#ffb08a']]) : ''));
  };

  // ★3 — criaturas originais
  D.sombra_leal = (pose) => {
    const P = { skin: '#3a3d66', acc: '#1a1c34', acc2: '#7a8aff', eye: '#9fe3ff', aura: '#7a8aff', glowEye: true };
    return figure(P, pose, {
      back: () => P_('M70 74 Q40 120 50 200 L70 170 L64 230 L90 180 L100 240 L110 180 L136 230 L130 170 L150 200 Q160 120 130 74 Z', '#14152a'),
      face: () => both(`<path d="M85 41 L97 41 L95 45 L87 45 Z" fill="${P.eye}" filter="url(#gl)"/>`),
      head: () => P_('M78 40 Q78 6 100 4 Q122 6 122 40 Q112 22 100 22 Q88 22 78 40 Z', '#14152a'),
    });
  };
  D.vagalume = () => {
    const P = { skin: '#fff6a8', acc: '#bfffc0', acc2: '#ffffff', eye: LN, aura: '#fff6a8' };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${both(`<path d="M96 120 Q60 60 30 80 Q40 120 92 130 Z" fill="#dfffe0" fill-opacity=".75" stroke="#7ad08a" stroke-width="2"/><path d="M96 136 Q56 150 46 186 Q80 184 96 146 Z" fill="#dfffe0" fill-opacity=".6" stroke="#7ad08a" stroke-width="2"/>`)}
      <circle cx="100" cy="132" r="34" fill="#fff6a8" opacity=".55" filter="url(#bl)"/><circle cx="100" cy="132" r="22" fill="url(#sk)" stroke="#e8d060" stroke-width="2"/><circle cx="100" cy="132" r="10" fill="#fff"/>
      <circle cx="94" cy="128" r="2.4" fill="${LN}"/><circle cx="106" cy="128" r="2.4" fill="${LN}"/>${L_('M96 136 Q100 139 104 136', LN, 1.6)}</svg>`;
  };
  D.golem_bolso = () => {
    const P = { skin: '#a08f7c', acc: '#6a5a48', acc2: '#7fe0ff', eye: '#7fe0ff', aura: '#d8c8a8' };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${both(P_('M60 120 L36 132 L32 186 L54 192 L62 150 Z', 'url(#ac)') + P_('M74 186 L94 186 L96 238 L72 238 Z', 'url(#ac)'))}
      ${P_('M62 100 L138 100 L146 150 L132 194 L68 194 L54 150 Z', 'url(#sk)')}${L_('M76 120 L90 140 L84 160 M120 116 L112 136 L124 150', sh(P.skin, -0.45), 2)}
      <circle cx="100" cy="146" r="9" fill="${P.acc2}" stroke="${LN}" stroke-width="2" filter="url(#gl)"/>
      ${P_('M74 50 L126 50 L130 100 L70 100 Z', 'url(#sk)')}${both(`<rect x="82" y="68" width="12" height="7" rx="2" fill="${P.eye}" stroke="${LN}" stroke-width="1.4" filter="url(#gl)"/>`)}
      ${P_('M82 50 L90 38 L100 46 L110 36 L118 50 Z', '#7cc45a')}</svg>`;
  };
  // Espírito da Brisa — uma sílfide do vento: cabelo esvoaçante, véu celestial, cauda de vento em espiral, folhas e brilhos
  const spark = (x, y, r, c = '#ffffff', op = 1) => `<path d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${c}" opacity="${op}"/>`;
  const leaf = (x, y, s, r, c1 = '#9fe07a', c2 = '#4aa84a') => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="M-9 0 Q-2 -7 10 0 Q-2 7 -9 0 Z" fill="${c1}" stroke="${c2}" stroke-width="1.2"/><path d="M-8 0 L8 0" stroke="${c2}" stroke-width=".9"/><path d="M-2 0 L2 -3 M2 0 L5 -2.5 M-2 0 L2 3 M2 0 L5 2.5" stroke="${c2}" stroke-width=".7"/></g>`;
  const swirl = (cx, cy, r, turns, col, w, ph = 0) => { let d = ''; const n = Math.round(turns * 24); for (let k = 0; k <= n; k++) { const t = k / n, a = ph + t * turns * Math.PI * 2, rr = r * (1 - t * 0.85); d += `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)} `; } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
  D.brisa = (pose) => {
    const ph = pose === 'idle1' ? 1 : 0, sw = ph ? 4 : 0, atk = pose === 'punch';
    const ln = '#1f3a4a';
    const S = (d, fill, w = 1.8, ex = '') => `<path d="${d}" fill="${fill}" stroke="${ln}" stroke-width="${w}" stroke-linejoin="round" ${ex}/>`;
    const gust = (d, w = 2.2, op = 0.8) => `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}"><defs>
      <radialGradient id="au" cx=".5" cy=".42" r=".55"><stop offset="0" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".35" stop-color="#bff7ea" stop-opacity=".55"/><stop offset=".75" stop-color="#7fe0d0" stop-opacity=".18"/><stop offset="1" stop-color="#7fe0d0" stop-opacity="0"/></radialGradient>
      <linearGradient id="hr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c4f6ea"/><stop offset="1" stop-color="#3fc4ae"/></linearGradient>
      <linearGradient id="hr2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8fff9"/><stop offset="1" stop-color="#5fd6c0"/></linearGradient>
      <linearGradient id="sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eefcf6"/><stop offset="1" stop-color="#c8eee4"/></linearGradient>
      <linearGradient id="dr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ee0c4"/><stop offset="1" stop-color="#1f9c88"/></linearGradient>
      <linearGradient id="tl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3fc8b0"/><stop offset=".55" stop-color="#9ff0de" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff" stop-opacity=".55"/></linearGradient>
      <linearGradient id="vl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".85"/><stop offset=".5" stop-color="#9ff0de" stop-opacity=".7"/><stop offset="1" stop-color="#5fd6c0" stop-opacity=".35"/></linearGradient>
      <linearGradient id="ir" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b4f4a"/><stop offset=".55" stop-color="#1fb39c"/><stop offset="1" stop-color="#8ff5e0"/></linearGradient>
      <radialGradient id="orb" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#bff7ea"/><stop offset="1" stop-color="#3fc4ae" stop-opacity=".2"/></radialGradient>
      <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
    </defs>
      <ellipse cx="100" cy="122" rx="98" ry="122" fill="url(#au)"/>
      ${gust(`M14 ${150 + sw} Q44 ${136 + sw} 64 ${146 + sw} Q74 ${154 + sw} 66 ${160 + sw} Q58 ${162 + sw} 60 ${154 + sw}`, 2.2, 0.75)}
      ${gust(`M150 ${196 - sw} Q178 ${184 - sw} 192 ${196 - sw}`, 1.8, 0.6)}${gust(`M8 ${84 - sw} Q28 ${74 - sw} 44 ${80 - sw}`, 1.6, 0.6)}
      <!-- véu celestial atrás do corpo -->
      ${S(`M74 128 Q44 ${118 - sw} 36 ${88 - sw} Q30 ${62 - sw} 46 ${44 - sw} Q42 ${66 - sw} 52 ${84 - sw} Q62 ${104 - sw} 80 ${112} Z`, 'url(#vl)', 1.2, 'stroke-opacity=".45"')}
      ${S(`M120 112 Q150 ${126 + sw} 164 ${152 + sw} Q174 ${172 + sw} 192 ${178 + sw} Q174 ${186 + sw} 158 ${170 + sw} Q144 ${148 + sw} 118 ${124} Z`, 'url(#vl)', 1.2, 'stroke-opacity=".45"')}
      <!-- cabelo de trás, levado pelo vento -->
      ${S(`M84 50 Q70 70 74 96 Q70 112 62 120 Q78 120 86 106 Q90 92 88 76 Z`, 'url(#hr2)')}
      ${S(`M110 44 Q146 ${34 + sw} 164 ${58 + sw} Q182 ${84 + sw} 170 ${112 + sw} Q166 ${124 + sw} 154 ${122 + sw} Q166 ${110 + sw} 160 ${100 + sw} Q156 ${114 + sw} 140 ${116 + sw} Q152 ${102 + sw} 146 ${88 + sw} Q140 ${102 + sw} 124 ${100 + sw} Q136 ${88 + sw} 130 ${72 + sw} Q122 ${84 + sw} 112 ${84} Z`, 'url(#hr)')}
      ${swirl(160, 118 + sw, 7, 1.1, '#ffffff', 1.6, 2.2)}${swirl(150, 128 + sw, 5, 1, '#e8fff9', 1.4, 1)}
      <!-- cauda de vento em espiral (no lugar das pernas) -->
      ${S('M86 138 C68 172 64 210 96 230 C118 244 150 238 150 218 C150 202 130 198 123 209 C118 217 125 224 132 220 C122 230 102 222 101 204 C100 184 110 162 114 138 Z', 'url(#tl)')}
      ${gust('M92 150 C80 178 80 206 104 222', 1.6, 0.85)}${gust('M104 152 C98 176 96 200 112 214', 1.2, 0.6)}${gust('M124 230 C140 232 146 220 140 212', 1.4, 0.7)}
      ${spark(70, 236, 4, '#ffffff', 0.9)}${spark(150, 246, 3, '#ffffff', 0.8)}
      <!-- corpo: vestido de folhas -->
      ${S('M90 98 Q100 94 110 98 L114 108 Q110 124 110 140 L90 140 Q90 124 86 108 Z', 'url(#sk)')}
      ${S('M85 108 Q100 120 115 108 L113 128 Q111 134 114 142 Q100 150 86 142 Q89 134 87 128 Z', 'url(#dr)')}
      ${['M86 108 Q90 118 100 120 Q96 110 86 108 Z', 'M114 108 Q110 118 100 120 Q104 110 114 108 Z'].map((d) => S(d, '#9fe07a', 1.2)).join('')}
      ${L_('M100 122 L100 146', '#147a6a', 1.2)}${L_('M90 132 Q100 136 110 132', '#147a6a', 1.1)}
      <circle cx="100" cy="121" r="3" fill="#ffe8a8" stroke="${ln}" stroke-width="1" filter="url(#gl)"/>
      <!-- braço esquerdo: manga esvoaçante -->
      ${S('M89 102 Q76 108 72 124 Q69 138 70 150 L77 150 Q78 136 82 126 Q86 116 92 110 Z', 'url(#sk)')}
      ${S(`M88 102 Q70 106 64 ${124 + sw / 2} Q60 ${134 + sw} 52 ${140 + sw} Q66 ${140 + sw} 74 ${128} Q78 116 90 110 Z`, 'url(#vl)', 1.2)}
      ${S('M70 149 Q66 156 70 160 Q74 162 77 156 L78 150 Z', 'url(#sk)', 1.4)}
      ${atk ? `
        <!-- rajada: um tornado sai da palma em direção ao alvo -->
        ${S('M112 102 Q130 98 146 88 L152 96 Q138 108 116 116 Z', 'url(#sk)')}${S('M148 86 Q158 80 162 88 Q160 96 152 98 Z', 'url(#sk)', 1.4)}
        <ellipse cx="178" cy="92" rx="26" ry="40" fill="#dffff8" opacity=".45" filter="url(#bl)"/>
        ${[0, 1, 2, 3].map((k) => swirl(176 + k * 6, 92 - k * 2, 30 - k * 5, 1.4, k % 2 ? '#bff7ea' : '#ffffff', 2.6 - k * 0.4, k)).join('')}
        ${leaf(184, 60, 1.1, -30)}${leaf(190, 128, 1, 40)}${leaf(168, 140, 0.9, 10)}${leaf(176, 46, 0.8, 70)}
        ${gust('M120 70 Q160 56 196 64', 2.4, 0.9)}${gust('M126 128 Q160 140 196 126', 2.4, 0.9)}` : `
        ${S('M111 102 Q126 108 136 100 Q144 94 148 88 L153 93 Q146 104 138 110 Q124 118 112 116 Z', 'url(#sk)')}
        ${S(`M112 102 Q130 104 140 96 Q150 ${88 - sw} 162 ${88 - sw} Q150 ${96 - sw} 146 104 Q132 114 114 114 Z`, 'url(#vl)', 1.2)}
        ${S('M148 86 Q156 82 158 88 Q156 94 151 95 Z', 'url(#sk)', 1.4)}
        <circle cx="156" cy="${72 - sw / 2}" r="15" fill="#bff7ea" opacity=".6" filter="url(#bl)"/>
        <circle cx="156" cy="${72 - sw / 2}" r="11" fill="url(#orb)" stroke="#ffffff" stroke-width="1.4"/>
        ${swirl(156, 72 - sw / 2, 9, 1.6, '#1fa890', 1.6, ph * 1.5)}`}
      <!-- pescoço e rosto -->
      ${S('M95 86 L105 86 L106 99 Q100 102 94 99 Z', '#dff6ee', 1.4)}
      ${both(S('M83 62 L66 52 Q72 62 84 72 Z', 'url(#sk)', 1.6) + L_('M80 62 L71 56', '#a8dccf', 1))}
      ${S('M82 62 Q82 40 100 39 Q118 40 118 62 Q118 78 108 86 Q100 92 92 86 Q82 78 82 62 Z', 'url(#sk)')}
      <!-- olhos grandes e brilhantes -->
      ${both(`<path d="M84 63 Q90 58.5 97 61.5 L97 70 Q90 73 85 69 Z" fill="#ffffff"/><ellipse cx="91.2" cy="66" rx="4.4" ry="5.6" fill="url(#ir)" stroke="${ln}" stroke-width=".8"/><ellipse cx="91.2" cy="66.6" rx="2" ry="2.8" fill="#073a36"/><circle cx="89.6" cy="63.8" r="1.7" fill="#fff"/><circle cx="93" cy="69" r=".9" fill="#fff"/>` + L_('M83.4 63.2 Q90 57.4 97.6 61', ln, 2.4) + L_('M83.4 63.2 L81.6 61.8', ln, 1.4) + L_('M86 55.6 Q91 54 96 55.4', '#5a9a8e', 1.2) + `<ellipse cx="88.5" cy="75" rx="4.2" ry="2" fill="#ff9ab8" opacity=".38"/>`)}
      ${L_('M98.6 74 L100 75.6', '#9ac8bc', 1)}${L_('M97 79 Q100 81.6 103 79', '#b04a6a', 1.5)}
      <!-- franja e mechas do rosto -->
      ${S('M80 60 Q77 36 100 33 Q123 36 120 60 Q116 50 110 53 Q108 44 102 51 Q98 42 92 51 Q88 46 84 55 Z', 'url(#hr)')}
      ${S('M83 54 Q74 74 79 96 Q84 86 86 70 Z', 'url(#hr2)', 1.4)}${S('M117 54 Q126 74 121 96 Q116 86 114 70 Z', 'url(#hr2)', 1.4)}
      ${S('M98 34 Q102 20 116 20 Q122 22 120 28 Q114 24 108 28 Q104 30 104 36 Z', 'url(#hr)', 1.4)}
      ${L_('M86 50 Q92 42 100 40', '#ffffff', 1.4, 'opacity=".8"')}
      <!-- folhas e flor no cabelo -->
      ${leaf(80, 44, 0.9, -130)}${leaf(86, 38, 0.8, -100, '#bff07a', '#4aa84a')}
      <g transform="translate(115 40)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.6" ry="4" fill="#ffffff" stroke="#9ad8c8" stroke-width=".8" transform="rotate(${a})"/>`).join('')}<circle r="2.2" fill="#ffe08a"/></g>
      <!-- folhas soltas e brilhos -->
      ${atk ? '' : leaf(40, 118 - sw, 1, 30) + leaf(156, 156 + sw, 0.9, -40) + leaf(30, 196 + sw, 0.8, 70)}
      ${spark(48, 52, 5)}${spark(150, 36, 4, '#fffbe0')}${spark(30, 170, 3.5)}${spark(172, 168, 4)}${spark(124, 186, 3, '#ffffff', 0.8)}
      </svg>`;
  };
  D.lobo_etereo = (pose) => {
    const P = { skin: '#d6e4ff', acc: '#8a9ae0', acc2: '#ffffff', eye: '#9fe3ff', aura: '#cfe0ff' };
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      ${P_('M44 150 Q20 130 14 100 Q34 118 54 128 Z', 'url(#sk)', 'opacity=".9"')}
      <g mask="url(#fade)">${[[66, 180], [84, 184], [116, 184], [132, 180]].map(([x, y]) => P_(`M${x - 6} ${y - 30} L${x + 6} ${y - 30} L${x + 5} ${y + 40} L${x - 5} ${y + 40} Z`, 'url(#sk)')).join('')}</g>
      ${P_('M44 136 Q60 106 104 108 Q140 108 152 130 Q158 160 138 172 Q100 186 62 172 Q40 160 44 136 Z', 'url(#sk)')}${L_('M60 130 Q90 120 120 126', '#8a9ae0', 2)}
      ${P_('M126 118 Q130 86 156 78 L168 64 L172 86 L188 92 Q190 104 176 108 L178 118 Q160 130 140 128 Z', 'url(#sk)')}
      ${P_('M150 80 L148 54 L162 72 Z', 'url(#sk)')}${P_('M162 74 L170 50 L174 76 Z', 'url(#sk)')}
      <path d="M160 92 L172 90 L170 96 Z" fill="${P.eye}" stroke="${LN}" stroke-width="1.2" filter="url(#gl)"/>${pose === 'punch' ? L_('M176 108 L186 112 L180 116 M178 112 L190 104', LN, 1.6) : ''}</svg>`;
  };
  D.coruja_arcana = (pose) => {
    const P = { skin: '#c8a070', acc: '#7a5232', acc2: '#ffd36b', eye: '#ffd36b', aura: '#e8d0a0' };
    const wing = pose === 'punch' ? 'M66 120 Q20 70 6 96 Q26 120 18 150 Q46 150 70 156 Z' : 'M66 116 Q40 130 44 176 Q58 176 72 160 Z';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${defs(P)}${aura()}
      <circle cx="100" cy="40" r="22" fill="none" stroke="${P.acc2}" stroke-width="1.6" opacity=".8" filter="url(#gl)"/><path d="${starP(100, 40, 12)}" fill="none" stroke="${P.acc2}" stroke-width="1.4" opacity=".8"/>
      ${both(P_(wing, 'url(#ac)'))}
      ${P_('M100 74 Q140 76 142 136 Q142 196 100 200 Q58 196 58 136 Q60 76 100 74 Z', 'url(#sk)')}${P_('M100 120 Q124 124 124 160 Q122 190 100 192 Q78 190 76 160 Q76 124 100 120 Z', '#f0dcb8')}
      ${[132, 146, 160, 174].map((y) => L_(`M86 ${y} Q100 ${y + 5} 114 ${y}`, '#b8946a', 1.4)).join('')}
      ${both(P_('M70 80 L66 58 L86 76 Z', 'url(#ac)') + `<circle cx="84" cy="100" r="14" fill="#fff" stroke="${LN}" stroke-width="2"/><circle cx="84" cy="100" r="7" fill="${P.eye}" filter="url(#gl)"/><circle cx="84" cy="100" r="3.4" fill="${LN}"/>`)}
      ${P_('M94 108 L106 108 L100 122 Z', '#ffb84d')}${both(P_('M84 198 L80 210 L88 206 L92 212 L94 198 Z', '#ffb84d'))}</svg>`;
  };

  // ------------------------------------------------------------------ API
  EA.svg = (id, frame = 'idle0', opts = {}) => {
    const f = D[id] || D.sombra_leal;
    let s = f(frame === 'punch' ? 'punch' : frame === 'idle1' ? 'idle1' : 'idle');
    if (opts.menace) { const [b, f] = id.split('~'), d = E.ECO.form(b, +f || 0) || {}, look = d.look || {}; s = s.replace('</defs>', `</defs>${menace(look.aura || '#b89aff')}`); }
    return s;
  };
  const urlCache = {};
  EA.url = (id, frame = 'idle0', opts = {}) => { const k = id + frame + (opts.menace ? 'm' : ''); return urlCache[k] || (urlCache[k] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(EA.svg(id, frame, opts))); };
  // retrato para as telas (vetor nítido; o "zoom" antigo é ignorado)
  EA.portrait = (id) => EA.url(id, 'idle0', { menace: true });
  // canvas em alta resolução para o mundo 3D (desenhado assim que o SVG carrega)
  const cache = {};
  EA.draw = (id, frame = 'idle0') => {
    const key = id + '|' + frame;
    if (cache[key]) return cache[key];
    const cv = document.createElement('canvas');
    cv.width = VW * 1.4; cv.height = VH * 1.4; cv._res = 4; cv._ready = false; cv._cbs = [];
    const img = new Image();
    img.onload = () => { const x = cv.getContext('2d'); x.clearRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height); cv._ready = true; cv._cbs.forEach((f) => f(cv)); cv._cbs = []; };
    img.src = EA.url(id, frame);
    cache[key] = cv;
    return cv;
  };
  EA.onReady = (cv, fn) => { if (!cv) return; if (cv._ready) fn(cv); else (cv._cbs = cv._cbs || []).push(fn); };
  // pré-carrega o Eco do herói ativo (os outros são desenhados quando aparecem)
  EA.preload = () => { const h = E.Store && E.Store.hero(), e = h && E.Eco && E.Eco.equipped(h); if (e) for (const f of ['idle0', 'idle1', 'punch']) EA.draw(e.art, f); };
  E.ECOART = EA;
  setTimeout(() => { try { EA.preload(); } catch (e) { /* sem DOM */ } }, 1200);
})();
