/* Ilustrações dos alimentos: cada prato e ingrediente tem a própria imagem, desenhada no aparelho com curvas
   suaves (mesmo estilo dos retratos). Variantes de qualidade usam a imagem do prato base. */
(() => {
  'use strict';
  const FA = {}, cache = new Map();
  const sh = (c, a) => E.SP.shade(c, a);
  const path = (x, fill, line, w = 1.2) => { if (fill) { x.fillStyle = fill; x.fill(); } if (line) { x.lineWidth = w; x.strokeStyle = line; x.stroke(); } };
  const ell = (x, cx, cy, rx, ry, fill, line, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2); path(x, fill, line); };
  function plate(x, wood) {
    if (wood) { x.beginPath(); x.roundRect(12, 58, 76, 28, 8); path(x, '#9a6a3e', '#5a3a1e'); x.strokeStyle = 'rgba(90,58,30,.4)'; x.lineWidth = 1; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(16, 64 + i * 7); x.lineTo(84, 64 + i * 7); x.stroke(); } return; }
    ell(x, 50, 70, 40, 15, '#e9e4da', '#9a9284'); ell(x, 50, 68, 30, 10, '#f7f3ea', null);
  }
  function bowl(x, liquid) {
    x.beginPath(); x.moveTo(14, 54); x.bezierCurveTo(16, 84, 84, 84, 86, 54); x.closePath(); path(x, '#b8764a', '#6a3e22');
    x.beginPath(); x.moveTo(20, 74); x.bezierCurveTo(40, 82, 60, 82, 80, 74); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,.18)'; x.stroke();
    ell(x, 50, 54, 36, 10, liquid, sh(liquid, -.35));
  }
  function steam(x) { x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 2.4; x.lineCap = 'round'; for (const ox of [38, 50, 62]) { x.beginPath(); x.moveTo(ox, 40); x.bezierCurveTo(ox - 6, 32, ox + 6, 26, ox, 16); x.stroke(); } }
  function fishShape(x, cx, cy, len, body, belly, grill) {
    x.beginPath(); x.moveTo(cx - len / 2, cy); x.bezierCurveTo(cx - len / 4, cy - len * .28, cx + len / 4, cy - len * .26, cx + len * .36, cy); x.bezierCurveTo(cx + len / 4, cy + len * .26, cx - len / 4, cy + len * .28, cx - len / 2, cy); path(x, body, sh(body, -.45));
    x.beginPath(); x.moveTo(cx + len * .32, cy); x.lineTo(cx + len * .56, cy - len * .18); x.lineTo(cx + len * .56, cy + len * .18); x.closePath(); path(x, sh(body, -.1), sh(body, -.45));
    ell(x, cx - len * .05, cy + len * .08, len * .3, len * .07, belly, null);
    ell(x, cx - len * .36, cy - len * .04, 2.2, 2.2, '#20140c', null);
    if (grill) { x.strokeStyle = 'rgba(40,20,8,.75)'; x.lineWidth = 2.6; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(cx + i * 8 - 4, cy - len * .2); x.lineTo(cx + i * 8 + 4, cy + len * .2); x.stroke(); } }
  }
  function drumstick(x, cx, cy, rot, color) {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.beginPath(); x.roundRect(8, -3, 20, 6, 3); path(x, '#f4ead6', '#a89878');
    ell(x, 30, -3.5, 4, 4, '#f4ead6', '#a89878'); ell(x, 30, 3.5, 4, 4, '#f4ead6', '#a89878');
    ell(x, -4, 0, 16, 12, color, sh(color, -.45));
    ell(x, -8, -4, 6, 3, sh(color, .3), null);
    x.restore();
  }
  const DRAW = {
    lobo_assado: (x) => { plate(x, true); ell(x, 48, 58, 30, 18, '#7a3e22', '#3a1a0a'); ell(x, 42, 52, 14, 6, '#a85a32', null); x.beginPath(); x.roundRect(68, 52, 22, 8, 4); path(x, '#f4ead6', '#a89878'); ell(x, 90, 52, 5, 5, '#f4ead6', '#a89878'); ell(x, 90, 60, 5, 5, '#f4ead6', '#a89878'); x.strokeStyle = 'rgba(30,12,4,.6)'; x.lineWidth = 2.2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(30 + i * 12, 48); x.lineTo(36 + i * 12, 68); x.stroke(); } },
    caca_assada: (x) => { plate(x); for (let i = 0; i < 3; i++) { ell(x, 38 + i * 12, 62 - i * 2, 12, 8, '#8a3e26', '#3a1608', .3); ell(x, 38 + i * 12, 62 - i * 2, 7, 4, '#c8705a', null, .3); } ell(x, 70, 66, 6, 3, '#4f8a3a', null, .6); ell(x, 76, 62, 5, 2.6, '#6aa84a', null, -.4); },
    ave_assada: (x) => { plate(x); drumstick(x, 40, 64, -.35, '#c87a32'); drumstick(x, 58, 60, .25, '#b8682a'); },
    peixe_assado: (x) => { plate(x); fishShape(x, 46, 64, 58, '#b88a52', '#e8c890', true); ell(x, 78, 70, 8, 8, '#f2e04a', '#a89a20'); ell(x, 78, 70, 5, 5, '#fff6a0', null); },
    legumes_assados: (x) => { plate(x); const c = ['#e07a2a', '#5fa040', '#c83a2a', '#e8c040', '#e07a2a', '#5fa040', '#7a4aa0']; c.forEach((col, i) => ell(x, 28 + (i % 4) * 14, 60 + Math.floor(i / 4) * 10, 7, 5, col, sh(col, -.45), i)); },
    ensopado_caseiro: (x) => { steam(x); bowl(x, '#7a4a22'); for (const [cx, cy, col] of [[38, 54, '#5a2e14'], [52, 52, '#e07a2a'], [62, 56, '#5a2e14'], [46, 57, '#e8c040']]) ell(x, cx, cy, 5, 3.4, col, sh(col, -.4)); },
    sopa_peixe: (x) => { steam(x); bowl(x, '#e8d9a8'); ell(x, 42, 54, 9, 4, '#f4f0e6', '#b8a88a'); ell(x, 60, 53, 8, 3.6, '#f4f0e6', '#b8a88a'); ell(x, 52, 57, 4, 2, '#5fa040', null); ell(x, 34, 56, 3, 1.6, '#e07a2a', null); },
    guisado_ave: (x) => { steam(x); bowl(x, '#d8a040'); for (const [cx, cy] of [[38, 54], [56, 52], [64, 56]]) ell(x, cx, cy, 6, 4, '#e8c890', '#a8804a'); ell(x, 48, 56, 4, 2.6, '#5fa040', null); ell(x, 46, 51, 3.4, 2.2, '#e07a2a', null); },
    torta_frutas: (x) => { plate(x); x.beginPath(); x.moveTo(18, 64); x.bezierCurveTo(18, 40, 82, 40, 82, 64); x.bezierCurveTo(82, 74, 18, 74, 18, 64); path(x, '#d8a050', '#8a5a22'); ell(x, 50, 58, 28, 10, '#b8243a', '#6a1020'); x.strokeStyle = '#e8b868'; x.lineWidth = 3; for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(50 + i * 10 - 6, 49); x.lineTo(50 + i * 10 + 6, 67); x.stroke(); x.beginPath(); x.moveTo(50 + i * 10 + 6, 49); x.lineTo(50 + i * 10 - 6, 67); x.stroke(); } },
    pao_tostado: (x) => { plate(x, true); for (const ox of [30, 56]) { x.beginPath(); x.roundRect(ox - 12, 48, 24, 22, 7); path(x, '#c88a42', '#7a4a1a'); x.beginPath(); x.roundRect(ox - 9, 51, 18, 16, 5); path(x, '#f0c878', null); } ell(x, 30, 58, 5, 5, '#c83a4a', null); ell(x, 56, 58, 5, 5, '#e8a030', null); },
    comida_queimada: (x) => { plate(x); ell(x, 50, 62, 24, 12, '#1e1a18', '#000'); ell(x, 44, 58, 8, 3, '#3a3430', null); x.strokeStyle = 'rgba(80,80,80,.7)'; x.lineWidth = 3; x.lineCap = 'round'; for (const ox of [42, 56]) { x.beginPath(); x.moveTo(ox, 48); x.bezierCurveTo(ox - 8, 36, ox + 8, 28, ox, 14); x.stroke(); } },
    // ingredientes
    carne_caca: (x) => { plate(x, true); ell(x, 50, 62, 26, 15, '#c8505a', '#7a2028'); ell(x, 44, 58, 9, 5, '#f0a0a0', null); ell(x, 60, 66, 7, 3, '#f4f0e6', null); },
    carne_lobo: (x) => { plate(x, true); ell(x, 50, 62, 27, 14, '#a83a44', '#6a1820'); ell(x, 58, 58, 8, 4, '#e88a92', null); },
    carne_ave: (x) => { plate(x, true); drumstick(x, 50, 62, 0, '#f0c0a8'); },
    peixe_cru: (x) => { plate(x, true); x.beginPath(); x.moveTo(20, 64); x.bezierCurveTo(30, 48, 74, 48, 84, 62); x.bezierCurveTo(74, 74, 30, 76, 20, 64); path(x, '#f4a088', '#b8604a'); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 1.6; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(32 + i * 12, 54); x.quadraticCurveTo(36 + i * 12, 62, 32 + i * 12, 70); x.stroke(); } },
    vegetais: (x) => { for (const [cx, rot, col] of [[38, -.5, '#e07a2a'], [52, 0, '#e07a2a'], [64, .4, '#c83a2a']]) { x.save(); x.translate(cx, 60); x.rotate(rot); x.beginPath(); x.moveTo(-6, -18); x.lineTo(6, -18); x.lineTo(0, 22); x.closePath(); path(x, col, sh(col, -.4)); ell(x, 0, -22, 8, 5, '#4f8a3a', '#2a5a1a'); x.restore(); } },
    fruta: (x) => { ell(x, 40, 60, 16, 15, '#c8303a', '#6a1018'); ell(x, 62, 62, 14, 13, '#e8a030', '#8a5a10'); ell(x, 36, 54, 4, 3, 'rgba(255,255,255,.55)', null); x.beginPath(); x.moveTo(40, 46); x.lineTo(42, 38); x.lineWidth = 2; x.strokeStyle = '#5a3a1e'; x.stroke(); ell(x, 47, 40, 6, 3, '#4f8a3a', null, -.4); },
    pao: (x) => { x.beginPath(); x.moveTo(16, 66); x.bezierCurveTo(16, 38, 84, 38, 84, 66); x.bezierCurveTo(84, 76, 16, 76, 16, 66); path(x, '#c88a42', '#7a4a1a'); x.strokeStyle = '#f0c878'; x.lineWidth = 2.4; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(32 + i * 14, 48); x.lineTo(40 + i * 14, 58); x.stroke(); } },
    racao: (x) => { x.beginPath(); x.roundRect(20, 44, 60, 32, 6); path(x, '#b8a070', '#6a5a30'); x.beginPath(); x.moveTo(20, 58); x.lineTo(80, 58); x.lineWidth = 3; x.strokeStyle = '#8a3a2a'; x.stroke(); ell(x, 50, 58, 6, 6, '#8a3a2a', null); },
    ensopado: null,
  };
  const BASE = (id) => { const f = E.SIM_DATA && E.SIM_DATA.FOODS[id]; return f && f.base ? f.base : id; };
  FA.has = (id) => (typeof id === 'string' && id.startsWith('fish:')) || !!DRAW[BASE(id)];
  FA.draw = (id, size = 160) => {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const x = cv.getContext('2d'); x.scale(size / 100, size / 100); x.lineJoin = 'round';
    const fn = DRAW[BASE(id)];
    if (fn) fn(x); else { plate(x); ell(x, 50, 62, 18, 10, '#c8a060', '#7a5a2a'); }
    return cv;
  };
  // URL em cache; peixes pescados ("fish:id") usam a arte do próprio peixe.
  FA.url = (id, size = 160) => {
    if (typeof id === 'string' && id.startsWith('fish:')) { try { return E.Fishing.art(E.L.FISH[id.slice(5)], 4); } catch (e) { return ''; } }
    const key = BASE(id) + '|' + size;
    if (!cache.has(key)) { try { cache.set(key, FA.draw(id, size).toDataURL()); } catch (e) { cache.set(key, ''); } }
    return cache.get(key);
  };
  FA.stars = (id) => { const f = E.SIM_DATA && E.SIM_DATA.FOODS[id]; return f && f.q ? f.q : 0; };
  E.FoodArt = FA;
})();
