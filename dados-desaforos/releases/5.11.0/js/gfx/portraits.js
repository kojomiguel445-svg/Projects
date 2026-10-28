/* Retratos ilustrados (estilo dos ícones de personagem do Genshin) desenhados com curvas suaves a partir da
   aparência do herói: pele, cabelo, penteado, olhos, roupa, espécie e acessório. Usados no HUD, no menu e na luta,
   no lugar do sprite em pixel art. Tudo é gerado no aparelho e guardado em cache por aparência. */
(() => {
  'use strict';
  const PR = {}, cache = new Map();
  const sh = (c, a) => E.SP.shade(c, a), mix = (a, b, t) => E.SP.mix(a, b, t);
  // "Visões" por classe: a cor acompanha a troca de personagem e o anel do retrato.
  PR.ELEMENT = { barbaro: '#ff8a4c', guerreiro: '#ff8a4c', bardo: '#4cc2ff', ladino: '#4cc2ff', bruxo: '#c08cff', feiticeiro: '#c08cff', clerigo: '#f7c244', paladino: '#f7c244', druida: '#9be04b', patrulheiro: '#72e2c2', monge: '#72e2c2', mago: '#9fe8ff' };
  PR.element = (h) => PR.ELEMENT[h && h.cls] || '#ece5d8';

  const S = 2; // desenho em grade 100×100, renderizado em 200×200 (nítido em telas de alta densidade)
  function path(ctx, fill, line, w = 1.1) { if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (line) { ctx.lineWidth = w; ctx.strokeStyle = line; ctx.stroke(); } }
  const ink = (c) => sh(c, -0.5);

  function backHair(ctx, L, hair) {
    const d = sh(hair, -0.18), st = L.hairStyle;
    ctx.beginPath();
    if (st === 1) { ctx.moveTo(24, 44); ctx.bezierCurveTo(18, 70, 20, 92, 26, 100); ctx.lineTo(74, 100); ctx.bezierCurveTo(80, 92, 82, 70, 76, 44); ctx.closePath(); }
    else if (st === 13) { ctx.moveTo(24, 44); ctx.bezierCurveTo(14, 66, 24, 78, 17, 100); ctx.lineTo(83, 100); ctx.bezierCurveTo(76, 78, 86, 66, 76, 44); ctx.closePath(); }
    else if (st === 6) { ctx.moveTo(25, 44); ctx.bezierCurveTo(22, 62, 22, 74, 28, 79); ctx.lineTo(72, 79); ctx.bezierCurveTo(78, 74, 78, 62, 75, 44); ctx.closePath(); }
    else if (st === 11) { ctx.ellipse(50, 40, 34, 31, 0, 0, Math.PI * 2); }
    else if (st === 7) { for (let a = Math.PI * .85; a < Math.PI * 2.16; a += .42) { ctx.moveTo(50 + Math.cos(a) * 25 + 8, 46 + Math.sin(a) * 22); ctx.arc(50 + Math.cos(a) * 25, 46 + Math.sin(a) * 22, 8, 0, Math.PI * 2); } }
    else if (st === 2) { ctx.moveTo(70, 34); ctx.bezierCurveTo(90, 38, 92, 64, 84, 84); ctx.bezierCurveTo(80, 70, 78, 54, 68, 46); ctx.closePath(); }
    else if (st === 10) { for (const s of [-1, 1]) { ctx.moveTo(50 + s * 22, 36); ctx.bezierCurveTo(50 + s * 40, 38, 50 + s * 42, 66, 50 + s * 34, 84); ctx.bezierCurveTo(50 + s * 30, 66, 50 + s * 30, 50, 50 + s * 20, 44); ctx.closePath(); } }
    else return;
    path(ctx, d, ink(hair));
  }

  function body(ctx, L, skin, sp) {
    const c1 = L.c1 || '#3a62c8', c2 = L.c2 || '#ffcf5a', big = sp === 'golias' || sp === 'orc' || sp === 'draconato';
    // pescoço
    ctx.beginPath(); ctx.moveTo(42, 70); ctx.lineTo(42, 86); ctx.lineTo(58, 86); ctx.lineTo(58, 70); ctx.closePath(); path(ctx, sh(skin, -0.16), ink(skin), .9);
    // ombros e roupa
    const sx = big ? 8 : 12;
    ctx.beginPath(); ctx.moveTo(sx, 101); ctx.bezierCurveTo(sx + 2, 90, 24, 84, 40, 82); ctx.lineTo(50, 90); ctx.lineTo(60, 82); ctx.bezierCurveTo(76, 84, 100 - sx - 2, 90, 100 - sx, 101); ctx.closePath();
    const g = ctx.createLinearGradient(0, 80, 0, 100); g.addColorStop(0, sh(c1, .12)); g.addColorStop(1, sh(c1, -.18));
    path(ctx, g, ink(c1));
    // gola em V com acabamento
    ctx.beginPath(); ctx.moveTo(38, 82); ctx.lineTo(50, 97); ctx.lineTo(62, 82); ctx.lineTo(57, 81); ctx.lineTo(50, 90); ctx.lineTo(43, 81); ctx.closePath(); path(ctx, c2, ink(c2), .8);
    ctx.beginPath(); ctx.arc(50, 95, 2.4, 0, Math.PI * 2); path(ctx, '#ffe9a8', '#8a6a2a', .7);
  }

  function ears(ctx, kind, skin) {
    const ln = ink(skin);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      if (kind === 'long') { ctx.moveTo(50 + s * 20, 50); ctx.quadraticCurveTo(50 + s * 34, 38, 50 + s * 37, 33); ctx.quadraticCurveTo(50 + s * 31, 52, 50 + s * 21, 61); ctx.closePath(); }
      else if (kind === 'pointy' || kind === 'small') { const k = kind === 'small' ? .7 : 1; ctx.moveTo(50 + s * 20, 52); ctx.quadraticCurveTo(50 + s * (24 + 6 * k), 44, 50 + s * (25 + 6 * k), 41); ctx.quadraticCurveTo(50 + s * 27, 54, 50 + s * 21, 61); ctx.closePath(); }
      else if (kind === 'none') continue;
      else { ctx.ellipse(50 + s * 21, 57, 3.6, 5.4, 0, 0, Math.PI * 2); }
      path(ctx, skin, ln, .9);
      ctx.beginPath(); ctx.ellipse(50 + s * 22, 55, 1.2, 2.6, s * .3, 0, Math.PI * 2); path(ctx, sh(skin, -.18));
    }
  }

  function face(ctx, skin, sp) {
    const wide = sp === 'anao' || sp === 'golias' || sp === 'orc' ? 2 : 0, round = sp === 'pequenino' || sp === 'gnomo' ? 2 : 0;
    ctx.beginPath(); ctx.moveTo(29 - wide, 46); ctx.bezierCurveTo(29 - wide, 64 - round, 40 - wide, 75 - round, 50, 77 - round); ctx.bezierCurveTo(60 + wide, 75 - round, 71 + wide, 64 - round, 71 + wide, 46); ctx.bezierCurveTo(71, 26, 29, 26, 29 - wide, 46); ctx.closePath();
    const g = ctx.createLinearGradient(30, 30, 70, 78); g.addColorStop(0, sh(skin, .08)); g.addColorStop(1, sh(skin, -.06));
    path(ctx, g, ink(skin));
    // sombra da franja e bochechas
    ctx.save(); ctx.clip(); ctx.beginPath(); ctx.ellipse(50, 41, 26, 8, 0, 0, Math.PI * 2); path(ctx, sh(skin, -.12)); ctx.restore();
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(50 + s * 13, 65, 4, 2, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,110,120,.24)'; ctx.fill(); }
  }

  function eyes(ctx, L, sp) {
    const col = L.eyes || '#3a2a20', big = sp === 'gnomo' || sp === 'pequenino' ? 1.15 : sp === 'orc' || sp === 'golias' ? .88 : 1;
    const slit = sp === 'draconato' || sp === 'tiferino';
    for (const s of [-1, 1]) {
      const cx = 50 + s * 10.5, cy = 57;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(big, big);
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(0, -6.4, 6, -.6); ctx.quadraticCurveTo(0, 7, -6, 0); ctx.closePath();
      ctx.fillStyle = '#fffaf2'; ctx.fill();
      ctx.save(); ctx.clip();
      const g = ctx.createLinearGradient(0, -5, 0, 6); g.addColorStop(0, sh(col, -.45)); g.addColorStop(.55, col); g.addColorStop(1, sh(col, .45));
      ctx.beginPath(); ctx.ellipse(s * .4, 1, 4.3, 5.4, 0, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); if (slit) ctx.ellipse(s * .4, 1, .9, 3.6, 0, 0, Math.PI * 2); else ctx.ellipse(s * .4, 1.3, 2, 2.7, 0, 0, Math.PI * 2); ctx.fillStyle = sh(col, -.7); ctx.fill();
      ctx.beginPath(); ctx.arc(-1.6 + s * .4, -1.4, 1.5, 0, Math.PI * 2); ctx.arc(1.9 + s * .4, 3.4, .75, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.restore();
      // pálpebra superior com cílios e risco inferior
      ctx.beginPath(); ctx.moveTo(-6.6, .6); ctx.quadraticCurveTo(0, -7.4, 6.4, -1); ctx.lineCap = 'round'; ctx.lineWidth = 1.9; ctx.strokeStyle = '#2a1d1a'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 6.4, -1 * (s > 0 ? 1 : -.6)); ctx.lineTo(s * 8, -2.6); ctx.lineWidth = 1.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3.4, 5.4); ctx.quadraticCurveTo(0, 6.6, 3.4, 5.2); ctx.lineWidth = .7; ctx.strokeStyle = 'rgba(42,29,26,.55)'; ctx.stroke();
      ctx.restore();
    }
  }

  function brows(ctx, hair) {
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 6, 48.6); ctx.quadraticCurveTo(50 + s * 11, 46.4, 50 + s * 16, 48.4); ctx.lineWidth = 1.5; ctx.strokeStyle = sh(hair, -.35); ctx.stroke(); }
  }

  function mouth(ctx, skin, sp) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(50.2, 63.4); ctx.lineTo(49.4, 65.6); ctx.lineWidth = .9; ctx.strokeStyle = sh(skin, -.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(46.4, 69.4); ctx.quadraticCurveTo(50, 71.6, 53.6, 69.3); ctx.lineWidth = 1.2; ctx.strokeStyle = '#8a4040'; ctx.stroke();
    if (sp === 'orc') for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 3.4, 71); ctx.lineTo(50 + s * 4.8, 66.2); ctx.lineTo(50 + s * 6, 71); ctx.closePath(); path(ctx, '#fbf4e2', '#9a8a6a', .6); }
  }

  // franja e mechas da frente, por penteado
  function frontHair(ctx, L, hair, sp) {
    const st = L.hairStyle, ln = ink(hair), lt = sh(hair, .28);
    const g = ctx.createLinearGradient(0, 18, 0, 58); g.addColorStop(0, sh(hair, .12)); g.addColorStop(1, sh(hair, -.12));
    if (st === 8) { // raspado: só a sombra do cabelo curto
      ctx.beginPath(); ctx.moveTo(29, 46); ctx.bezierCurveTo(28, 24, 72, 24, 71, 46); ctx.bezierCurveTo(64, 36, 36, 36, 29, 46); ctx.closePath(); path(ctx, sh(hair, -.05), ln, .8); return;
    }
    if (st === 9) { // moicano: laterais raspadas e crista curva
      ctx.beginPath(); ctx.moveTo(29, 46); ctx.bezierCurveTo(28, 24, 72, 24, 71, 46); ctx.bezierCurveTo(64, 36, 36, 36, 29, 46); ctx.closePath(); path(ctx, sh(hair, -.35) + '55');
      ctx.beginPath(); ctx.moveTo(43, 42); ctx.bezierCurveTo(40, 30, 40, 18, 46, 8); ctx.quadraticCurveTo(48, 16, 50, 10); ctx.quadraticCurveTo(52, 16, 55, 9); ctx.bezierCurveTo(60, 18, 60, 30, 57, 42); ctx.quadraticCurveTo(50, 38, 43, 42); ctx.closePath(); path(ctx, g, ln);
      ctx.beginPath(); ctx.moveTo(48, 16); ctx.quadraticCurveTo(46, 26, 47, 36); ctx.lineWidth = 1.4; ctx.strokeStyle = lt + '99'; ctx.stroke(); return;
    }
    // calota
    ctx.beginPath();
    if (st === 3) { ctx.moveTo(26, 52); const tips = [[24, 30], [30, 14], [40, 20], [47, 6], [55, 18], [64, 10], [70, 22], [78, 28], [74, 52]]; for (let i = 0; i < tips.length; i++) { const [x, y] = tips[i]; ctx.lineTo(x, y); if (i < tips.length - 1) ctx.lineTo((x + tips[i + 1][0]) / 2, Math.max(y, tips[i + 1][1]) + 8); } }
    else if (st === 11) { ctx.moveTo(25, 50); ctx.bezierCurveTo(16, 22, 84, 22, 75, 50); }
    else if (st === 12) { ctx.moveTo(28, 48); ctx.bezierCurveTo(26, 22, 74, 22, 72, 48); }
    else { ctx.moveTo(26, 54); ctx.bezierCurveTo(22, 20, 78, 20, 74, 54); }
    // borda da franja
    if (st === 12) { ctx.bezierCurveTo(64, 36, 36, 36, 28, 48); }
    else if (st === 6) { ctx.lineTo(70, 47); ctx.lineTo(30, 47); }
    else if (st === 14) { ctx.lineTo(70, 46); ctx.quadraticCurveTo(52, 40, 34, 58); ctx.lineTo(30, 50); }
    else if (st === 7 || st === 11) { for (let x = 72; x >= 28; x -= 7.3) { ctx.quadraticCurveTo(x - 1, 50, x - 3.6, 44); ctx.quadraticCurveTo(x - 5, 39, x - 7.3, 45); } }
    else { const pts = [[70, 50], [64, 43], [60, 52], [55, 42], [50, 51], [45, 42], [40, 52], [36, 43], [30, 51]]; for (const [x, y] of pts) ctx.lineTo(x, y); }
    ctx.closePath(); path(ctx, g, ln);
    // mechas laterais emoldurando o rosto
    if (st !== 12) {
      const len = st === 1 || st === 13 ? 82 : st === 6 ? 76 : st === 11 || st === 7 ? 60 : 64;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 24, 40); ctx.bezierCurveTo(50 + s * 30, 52, 50 + s * 28, len - 8, 50 + s * 24.5, len); ctx.bezierCurveTo(50 + s * 23, len - 10, 50 + s * 20.5, 52, 50 + s * 19, 44); ctx.closePath(); path(ctx, g, ln, .9); }
    }
    // coques e caudas que ficam por cima
    if (st === 4) { ctx.beginPath(); ctx.ellipse(50, 17, 10, 8, 0, 0, Math.PI * 2); path(ctx, g, ln); }
    if (st === 12) { ctx.beginPath(); ctx.ellipse(50, 18, 5, 5.6, 0, 0, Math.PI * 2); path(ctx, g, ln); ctx.beginPath(); ctx.rect(46.5, 22, 7, 2.2); path(ctx, '#f4f0e6'); }
    if (st === 5) for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(50 + s * 25, 66 + k * 5.6, 3.6, 3.2, 0, 0, Math.PI * 2); path(ctx, k % 2 ? sh(hair, -.1) : hair, ln, .8); }
    // brilho de cabelo ("anel de luz")
    ctx.beginPath(); ctx.ellipse(50, 33, 17, 6, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.lineWidth = 2.6; ctx.strokeStyle = lt + 'aa'; ctx.lineCap = 'round'; ctx.stroke();
  }

  function species(ctx, look, L, skin, sp) {
    if (look.horns) for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 10, 30); ctx.bezierCurveTo(50 + s * 14, 16, 50 + s * 24, 10, 50 + s * 30, 12); ctx.bezierCurveTo(50 + s * 24, 16, 50 + s * 20, 22, 50 + s * 17, 32); ctx.closePath(); const g = ctx.createLinearGradient(0, 10, 0, 32); g.addColorStop(0, '#d9c8b8'); g.addColorStop(1, '#4a3440'); path(ctx, g, '#2a1a24'); }
    if (look.marks) { ctx.lineCap = 'round'; ctx.strokeStyle = sh(skin, -.38); ctx.lineWidth = 1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 15, 61); ctx.lineTo(50 + s * 19, 66); ctx.moveTo(50 + s * 14, 65); ctx.lineTo(50 + s * 17, 69); ctx.stroke(); } }
    if (look.halo) { ctx.beginPath(); ctx.ellipse(50, 14, 17, 4.4, 0, 0, Math.PI * 2); ctx.lineWidth = 2.4; ctx.strokeStyle = '#ffe9a0'; ctx.shadowColor = '#fff2b0'; ctx.shadowBlur = 8; ctx.stroke(); ctx.shadowBlur = 0; }
    if (L.beard && sp !== 'draconato') {
      const hair = L.hair, g = ctx.createLinearGradient(0, 60, 0, 96); g.addColorStop(0, hair); g.addColorStop(1, sh(hair, -.2));
      ctx.beginPath(); ctx.moveTo(30, 58); ctx.bezierCurveTo(30, 84, 42, 96, 50, 97); ctx.bezierCurveTo(58, 96, 70, 84, 70, 58); ctx.bezierCurveTo(64, 70, 58, 66, 50, 67); ctx.bezierCurveTo(42, 66, 36, 70, 30, 58); ctx.closePath(); path(ctx, g, ink(hair));
      ctx.beginPath(); ctx.moveTo(42, 68.5); ctx.quadraticCurveTo(50, 64, 58, 68.5); ctx.quadraticCurveTo(50, 67.4, 42, 68.5); path(ctx, sh(hair, -.12), ink(hair), .7);
    }
  }

  // Draconato: cabeça própria (focinho, escamas, chifres e crista), sem cabelo.
  function dragonHead(ctx, L, skin) {
    const ln = ink(skin), dk = sh(skin, -.22);
    // chifres para trás e espinhos da bochecha
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(50 + s * 13, 32); ctx.bezierCurveTo(50 + s * 22, 22, 50 + s * 28, 14, 50 + s * 31, 4); ctx.bezierCurveTo(50 + s * 30, 18, 50 + s * 27, 28, 50 + s * 21, 38); ctx.closePath();
      const g = ctx.createLinearGradient(0, 4, 0, 38); g.addColorStop(0, '#f2e8d2'); g.addColorStop(1, '#a8946e'); path(ctx, g, '#5a4a30');
      ctx.beginPath(); ctx.moveTo(50 + s * 25, 56); ctx.lineTo(50 + s * 33, 52); ctx.lineTo(50 + s * 26, 62); ctx.closePath(); path(ctx, dk, ln, .8);
    }
    // crânio largo que afina num focinho curto
    ctx.beginPath(); ctx.moveTo(26, 50); ctx.bezierCurveTo(25, 28, 75, 28, 74, 50); ctx.bezierCurveTo(74, 60, 68, 64, 64, 70); ctx.bezierCurveTo(60, 79, 40, 79, 36, 70); ctx.bezierCurveTo(32, 64, 26, 60, 26, 50); ctx.closePath();
    const g = ctx.createLinearGradient(30, 28, 70, 80); g.addColorStop(0, sh(skin, .16)); g.addColorStop(1, sh(skin, -.16)); path(ctx, g, ln);
    // placas do focinho e da testa
    ctx.beginPath(); ctx.moveTo(42, 64); ctx.quadraticCurveTo(50, 60, 58, 64); ctx.lineTo(56, 74); ctx.quadraticCurveTo(50, 77, 44, 74); ctx.closePath(); path(ctx, sh(skin, .06), ln, .7);
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 2.4, 68); ctx.lineTo(50 + s * 4.6, 66.4); ctx.lineWidth = 1.2; ctx.strokeStyle = sh(skin, -.6); ctx.lineCap = 'round'; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(39, 72); ctx.quadraticCurveTo(50, 78.5, 61, 72); ctx.lineWidth = 1.1; ctx.strokeStyle = sh(skin, -.5); ctx.stroke();
    ctx.fillStyle = dk; for (const [x, y, r] of [[38, 40, 2], [44, 35, 1.7], [56, 35, 1.7], [62, 40, 2], [33, 50, 1.6], [67, 50, 1.6], [36, 60, 1.3], [64, 60, 1.3]]) { ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fill(); }
    // crista no alto da cabeça na cor secundária da roupa
    ctx.beginPath(); ctx.moveTo(44, 32); ctx.lineTo(47, 20); ctx.lineTo(50, 28); ctx.lineTo(53, 20); ctx.lineTo(56, 32); ctx.closePath(); path(ctx, sh(L.c2 || skin, -.05), ln, .8);
  }

  function accessory(ctx, acc, L, hair) {
    const c1 = L.c1 || '#3a62c8', c2 = L.c2 || '#ffcf5a';
    const brim = (y, rx, col, crown) => { ctx.beginPath(); ctx.ellipse(50, y, rx, 6, 0, 0, Math.PI * 2); path(ctx, col, ink(col)); crown(); };
    switch (acc) {
      case 'capuz': { ctx.beginPath(); ctx.moveTo(12, 101); ctx.bezierCurveTo(10, 60, 18, 16, 50, 14); ctx.bezierCurveTo(82, 16, 90, 60, 88, 101); ctx.lineTo(70, 101); ctx.bezierCurveTo(76, 76, 78, 50, 72, 40); ctx.bezierCurveTo(64, 28, 36, 28, 28, 40); ctx.bezierCurveTo(22, 50, 24, 76, 30, 101); ctx.closePath(); const g = ctx.createLinearGradient(0, 14, 0, 100); g.addColorStop(0, sh(c1, .02)); g.addColorStop(1, sh(c1, -.3)); path(ctx, g, ink(c1)); break; }
      case 'chapeu_mago': brim(30, 34, sh(c1, -.1), () => { ctx.beginPath(); ctx.moveTo(32, 30); ctx.bezierCurveTo(38, 14, 52, 4, 72, 0); ctx.bezierCurveTo(64, 10, 66, 20, 68, 30); ctx.closePath(); path(ctx, sh(c1, -.04), ink(c1)); ctx.beginPath(); ctx.moveTo(33, 27); ctx.quadraticCurveTo(50, 22, 67.5, 27); ctx.lineWidth = 3; ctx.strokeStyle = c2; ctx.stroke(); }); break;
      case 'chapeu_bardo': brim(29, 30, sh(c2, -.4), () => { ctx.beginPath(); ctx.ellipse(50, 23, 17, 10, 0, Math.PI, 0); path(ctx, sh(c2, -.4), ink(c2)); ctx.beginPath(); ctx.moveTo(60, 24); ctx.bezierCurveTo(72, 10, 82, 4, 88, 2); ctx.bezierCurveTo(80, 12, 72, 20, 64, 27); ctx.closePath(); path(ctx, c2, ink(c2), .8); }); break;
      case 'chapeu_palha': brim(30, 38, '#e2c06a', () => { ctx.beginPath(); ctx.ellipse(50, 24, 18, 11, 0, Math.PI, 0); path(ctx, '#d8b252', '#8a6a2a'); ctx.beginPath(); ctx.rect(32, 22.5, 36, 3.6); path(ctx, c2); }); break;
      case 'chapeu_aba': brim(29, 37, '#5a3e26', () => { ctx.beginPath(); ctx.moveTo(33, 29); ctx.lineTo(35, 12); ctx.quadraticCurveTo(50, 8, 65, 12); ctx.lineTo(67, 29); ctx.closePath(); path(ctx, '#6a4a2e', '#2e1e10'); ctx.beginPath(); ctx.rect(34, 23, 32, 3.6); path(ctx, c2); }); break;
      case 'tricornio': { ctx.beginPath(); ctx.moveTo(12, 30); ctx.quadraticCurveTo(50, 40, 88, 30); ctx.quadraticCurveTo(76, 8, 64, 16); ctx.quadraticCurveTo(50, 6, 36, 16); ctx.quadraticCurveTo(24, 8, 12, 30); ctx.closePath(); path(ctx, '#2a2228', '#0e0a0c'); ctx.beginPath(); ctx.moveTo(14, 30); ctx.quadraticCurveTo(50, 39, 86, 30); ctx.lineWidth = 1.6; ctx.strokeStyle = '#ffd36b'; ctx.stroke(); break; }
      case 'boina': { ctx.beginPath(); ctx.ellipse(46, 25, 27, 11, -.12, 0, Math.PI * 2); path(ctx, c1, ink(c1)); ctx.beginPath(); ctx.arc(44, 14, 2, 0, Math.PI * 2); path(ctx, c1, ink(c1)); break; }
      case 'coroa': { ctx.beginPath(); ctx.moveTo(34, 30); ctx.lineTo(32, 14); ctx.lineTo(40, 22); ctx.lineTo(45, 10); ctx.lineTo(50, 20); ctx.lineTo(55, 10); ctx.lineTo(60, 22); ctx.lineTo(68, 14); ctx.lineTo(66, 30); ctx.closePath(); path(ctx, '#f2c94c', '#8a6a1a'); ctx.beginPath(); ctx.arc(50, 25, 2.4, 0, Math.PI * 2); path(ctx, '#e0453a'); break; }
      case 'tiara': { ctx.beginPath(); ctx.moveTo(30, 40); ctx.quadraticCurveTo(50, 28, 70, 40); ctx.lineWidth = 2.2; ctx.strokeStyle = '#f2c94c'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(50, 28); ctx.lineTo(53.5, 33.5); ctx.lineTo(50, 39); ctx.lineTo(46.5, 33.5); ctx.closePath(); path(ctx, c2 === '#ffcf5a' ? '#7fd4ff' : c2, '#8a6a1a', .8); break; }
      case 'elmo': { ctx.beginPath(); ctx.moveTo(24, 58); ctx.bezierCurveTo(20, 18, 80, 18, 76, 58); ctx.lineTo(70, 58); ctx.bezierCurveTo(70, 42, 62, 38, 50, 38); ctx.bezierCurveTo(38, 38, 30, 42, 30, 58); ctx.closePath(); const g = ctx.createLinearGradient(0, 20, 0, 58); g.addColorStop(0, '#e0e6ec'); g.addColorStop(1, '#7a838d'); path(ctx, g, '#3a424a'); ctx.beginPath(); ctx.rect(48, 22, 4, 16); path(ctx, c2); break; }
      case 'capacete_mineiro': { ctx.beginPath(); ctx.moveTo(24, 40); ctx.bezierCurveTo(24, 14, 76, 14, 76, 40); ctx.closePath(); path(ctx, '#e8b830', '#8a6a10'); ctx.beginPath(); ctx.ellipse(50, 40, 30, 4, 0, 0, Math.PI * 2); path(ctx, '#c8961a', '#8a6a10'); ctx.beginPath(); ctx.arc(50, 28, 5, 0, Math.PI * 2); path(ctx, '#fff6c8', '#5a5a62'); break; }
      case 'bandana': case 'faixa': { ctx.beginPath(); ctx.moveTo(27, 42); ctx.quadraticCurveTo(50, 32, 73, 42); ctx.lineTo(73, 48); ctx.quadraticCurveTo(50, 38, 27, 48); ctx.closePath(); path(ctx, acc === 'bandana' ? c1 : c2, ink(acc === 'bandana' ? c1 : c2), .8); if (acc === 'bandana') { ctx.beginPath(); ctx.moveTo(73, 44); ctx.lineTo(84, 40); ctx.lineTo(80, 50); ctx.closePath(); path(ctx, c1, ink(c1), .8); } break; }
      case 'flor': case 'laco': { const x = 70, y = 36; if (acc === 'flor') { for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 3.6, y + Math.sin(a) * 3.6, 3, 3, 0, 0, Math.PI * 2); path(ctx, '#ff9ac0', '#a84a70', .6); } ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); path(ctx, '#ffe07a'); } else { for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + s * 9, y - 5); ctx.lineTo(x + s * 9, y + 5); ctx.closePath(); path(ctx, c2, ink(c2), .8); } ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); path(ctx, sh(c2, -.15)); } break; }
      case 'folhas': { for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + k * .13); const x = 50 + Math.cos(a) * 24, y = 40 + Math.sin(a) * 16; ctx.beginPath(); ctx.ellipse(x, y, 4.4, 2.2, a + Math.PI / 2, 0, Math.PI * 2); path(ctx, k % 2 ? '#7fbf5a' : '#5f9a44', '#2e5a22', .6); } break; }
      case 'oculos': { ctx.beginPath(); ctx.moveTo(26, 38); ctx.quadraticCurveTo(50, 30, 74, 38); ctx.lineWidth = 2.4; ctx.strokeStyle = '#5a3e26'; ctx.stroke(); for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(50 + s * 9, 35, 5.6, 0, Math.PI * 2); path(ctx, 'rgba(160,220,255,.75)', '#8a6a2a', 1.6); } break; }
      case 'orelhas_gato': for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(50 + s * 10, 24); ctx.lineTo(50 + s * 22, 8); ctx.lineTo(50 + s * 25, 30); ctx.closePath(); path(ctx, hair, ink(hair)); ctx.beginPath(); ctx.moveTo(50 + s * 14, 24); ctx.lineTo(50 + s * 21, 13); ctx.lineTo(50 + s * 22, 27); ctx.closePath(); path(ctx, '#f4a8b8'); } break;
      case 'mascara': { ctx.beginPath(); ctx.moveTo(29, 61); ctx.quadraticCurveTo(50, 58, 71, 61); ctx.bezierCurveTo(70, 70, 60, 77, 50, 78); ctx.bezierCurveTo(40, 77, 30, 70, 29, 61); ctx.closePath(); path(ctx, '#2c3340', '#11151c'); break; }
      case 'tapa_olho': { ctx.beginPath(); ctx.moveTo(26, 46); ctx.lineTo(74, 54); ctx.lineWidth = 1.4; ctx.strokeStyle = '#1a1a1a'; ctx.stroke(); ctx.beginPath(); ctx.ellipse(60.5, 57, 6.4, 5.6, 0, 0, Math.PI * 2); path(ctx, '#1f1f24', '#000'); break; }
      case 'cachecol': { ctx.beginPath(); ctx.moveTo(34, 78); ctx.quadraticCurveTo(50, 88, 66, 78); ctx.lineTo(68, 86); ctx.quadraticCurveTo(50, 96, 32, 86); ctx.closePath(); path(ctx, c2, ink(c2)); ctx.beginPath(); ctx.moveTo(58, 88); ctx.lineTo(64, 101); ctx.lineTo(56, 101); ctx.closePath(); path(ctx, c2, ink(c2), .8); break; }
      default: break;
    }
  }

  // Desenha o retrato num canvas (tamanho em px); a área circular é preenchida pelo próprio elemento.
  PR.draw = (who, size = 100 * S) => {
    const sp = who.species || 'humano', cls = who.cls || 'guerreiro';
    const L = E.CH ? E.CH.normalize(who.look || {}, cls, sp) : (who.look || {});
    const look = (E.H && E.H.SPECIES[sp] && E.H.SPECIES[sp].look) || {};
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const ctx = cv.getContext('2d'); ctx.scale(size / 100, size / 100); ctx.lineJoin = 'round';
    let acc = L.acc === 'classe' ? ((E.CH.CLASS_DEFAULT || {})[cls] || {}).acc : L.acc;
    const skin = L.skin || '#e3b892', hair = L.hair || '#5a3a22';
    if (look.snout || sp === 'draconato') {
      body(ctx, L, skin, sp); dragonHead(ctx, L, skin); eyes(ctx, L, sp);
      if (acc && !/^(capuz|mascara|oculos|tapa_olho|laco|flor|bandana|faixa|orelhas_gato)$/.test(acc)) accessory(ctx, acc, L, hair);
      return cv;
    }
    const hood = acc === 'capuz';
    if (hood) { ctx.save(); ctx.beginPath(); ctx.moveTo(12, 101); ctx.bezierCurveTo(10, 60, 18, 16, 50, 14); ctx.bezierCurveTo(82, 16, 90, 60, 88, 101); ctx.closePath(); path(ctx, sh(L.c1 || '#3b2a5a', -.42)); ctx.restore(); }
    else backHair(ctx, L, hair);
    body(ctx, L, skin, sp);
    ears(ctx, hood ? 'none' : look.ears, skin);
    face(ctx, skin, sp);
    eyes(ctx, L, sp);
    brows(ctx, hair);
    mouth(ctx, skin, sp);
    species(ctx, look, L, skin, sp);
    frontHair(ctx, L, hair, sp);
    if (acc && acc !== 'nenhum') accessory(ctx, acc, L, hair);
    return cv;
  };
  // URL em cache; a chave muda quando a aparência muda (guarda-roupa, nova arma não interfere)
  PR.url = (who, size) => {
    if (!who) return '';
    const key = [who.cls, who.species, JSON.stringify(who.look || {}), size || 0].join('|');
    if (!cache.has(key)) { try { cache.set(key, PR.draw(who, size).toDataURL()); } catch (err) { cache.set(key, ''); } if (cache.size > 60) cache.delete(cache.keys().next().value); }
    return cache.get(key);
  };
  E.Portrait = PR;
})();
