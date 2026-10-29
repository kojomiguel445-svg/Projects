/* Sprites em pixel art gerados por código: heróis, NPCs e monstros.
   Desenha formas simples numa grade e aplica sombreamento + contorno automáticos. */
(() => {
  const SP = {};

  // ---------- cores ----------
  const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const shade = (h, amt) => { const [r, g, b] = hex2rgb(h); if (amt >= 0) return rgb2hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt); return rgb2hex(r * (1 + amt), g * (1 + amt), b * (1 + amt)); };
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  SP.shade = shade; SP.mix = mix; SP.hex2rgb = hex2rgb;

  // ---------- grade de pixels ----------
  class Px {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); this.glow = new Set(); }
    set(x, y, c, glow) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return; const i = y * this.w + x; this.d[i] = c; if (glow) this.glow.add(i); else this.glow.delete(i); }
    get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; }
    rect(x, y, w, h, c, glow) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c, glow); }
    ell(cx, cy, rx, ry, c, glow) {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c, glow);
      }
    }
    line(x0, y0, x1, y1, c, glow, wd = 1) {
      const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), n = Math.max(dx, dy, 1);
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; this.rect(Math.round(x - (wd - 1) / 2), Math.round(y - (wd - 1) / 2), wd, wd, c, glow); }
    }
    poly(pts, c, glow) {
      const ys = pts.map((p) => p[1]), minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
      const xs = pts.map((p) => p[0]), minX = Math.floor(Math.min(...xs)), maxX = Math.ceil(Math.max(...xs));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5, py = y + 0.5; let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, c, glow);
      }
    }
    mirror() { // espelha a metade esquerda para a direita (simetria)
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w / 2; x++) { const i = y * this.w + x; if (this.d[i]) this.set(this.w - 1 - x, y, this.d[i], this.glow.has(i)); }
    }
    // sombreamento + contorno → canvas
    toCanvas(opts = {}) {
      const { w, h } = this, out = new Array(w * h).fill(null);
      const lightAmt = opts.light ?? 0.16, darkAmt = opts.dark ?? 0.2;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, c = this.d[i];
        if (!c) continue;
        if (this.glow.has(i)) { out[i] = c; continue; }
        let col = c;
        const up = this.get(x, y - 1), left = this.get(x - 1, y), down = this.get(x, y + 1), right = this.get(x + 1, y);
        if (!up || (up !== c && !this.glow.has(i - w))) col = shade(c, lightAmt);
        else if (!left) col = shade(c, lightAmt * 0.5);
        if (!down || !right) col = shade(c, -darkAmt);
        out[i] = col;
      }
      const cv = document.createElement('canvas');
      const pad = 1;
      cv.width = w + pad * 2; cv.height = h + pad * 2;
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(cv.width, cv.height);
      const put = (x, y, hexc, a = 255) => { const [r, g, b] = hex2rgb(hexc); const k = ((y + pad) * cv.width + (x + pad)) * 4; img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = a; };
      // contorno
      const outline = opts.outline || null;
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (x >= 0 && y >= 0 && x < w && y < h && this.d[y * w + x]) continue;
        let n = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = this.get(x + dx, y + dy); if (c) { n = c; break; } }
        if (n) {
          const k = ((y + pad) * cv.width + (x + pad)) * 4;
          if (k < 0 || k >= img.data.length) continue;
          const [r, g, b] = hex2rgb(outline || shade(n, -0.72));
          img.data[k] = r; img.data[k + 1] = g; img.data[k + 2] = b; img.data[k + 3] = 255;
        }
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = out[y * w + x]; if (c) put(x, y, c); }
      ctx.putImageData(img, 0, 0);
      return cv;
    }
  }
  SP.Px = Px;

  // ============================================================ HUMANOIDES
  const W = 48, HH = 48, CX = 24;
  const OUTFITS = {
    guerreiro: { body: '#9aa3ad', trim: '#6b4a2a', legs: '#4a5160', boots: '#3a2a20', armor: true },
    paladino: { body: '#e6e9ef', trim: '#d4af37', legs: '#c0c6d0', boots: '#6b7280', armor: true, cape: '#3a62c8' },
    barbaro: { body: 'skin', trim: '#7a5232', legs: '#6b4a2a', boots: '#3a2a20', fur: '#9a7a52' },
    ladino: { body: '#3a3f4a', trim: '#6b4a2a', legs: '#2c3038', boots: '#1f2228', hood: '#2c3038', mask: true },
    monge: { body: '#e08a3c', trim: '#3a2a20', legs: '#e08a3c', boots: '#3a2a20', sash: '#6b2a2a', bareArms: true },
    patrulheiro: { body: '#5a7a3a', trim: '#6b4a2a', legs: '#4a3a2a', boots: '#3a2a20', hood: '#3f6a3a', quiver: true },
    clerigo: { body: '#f2ead0', trim: '#d4af37', legs: '#f2ead0', boots: '#8a6a3a', robe: true, symbol: true },
    druida: { body: '#5f8a4a', trim: '#8a5a32', legs: '#5f8a4a', boots: '#4a3a2a', robe: true, leaves: true },
    bardo: { body: '#c0392b', trim: '#f1c40f', legs: '#5b2340', boots: '#3a2a20', hat: 'bard' },
    bruxo: { body: '#3b2a5a', trim: '#9b6bff', legs: '#2a1f40', boots: '#1a1424', robe: true, hood: '#2a1f40', eye: true },
    feiticeiro: { body: '#a8325a', trim: '#ffcf5a', legs: '#5b2340', boots: '#2a1a20', robe: true, runes: true },
    mago: { body: '#2f5fb3', trim: '#ffcf5a', legs: '#2f5fb3', boots: '#2a2a40', robe: true, hat: 'wizard' },
    plebeu: { body: '#8a6a48', trim: '#5a4630', legs: '#5a4632', boots: '#3a2a20' },
  };

  function drawWeapon(p, type, o, atk) {
    const hx = CX + 8, hy = 34; // mão direita (na tela)
    const blade = (o.weaponColor && o.weaponColor.c1) || '#dfe6ee', accent = (o.weaponColor && o.weaponColor.c2) || '#d4af37';
    if (!type) return;
    if (atk) {
      if (type === 'arco') { p.line(hx + 1, 22, hx + 6, 28, '#8a5a32', false, 2); p.line(hx + 6, 28, hx + 1, 40, '#8a5a32', false, 2); p.line(hx + 1, 22, hx + 1, 40, '#e8e8e8'); p.line(hx - 2, 31, hx + 8, 31, '#d9c7a0'); return; }
      if (type === 'catalisador') { p.ell(hx + 6, 28, 4, 4, accent, true); p.ell(hx + 6, 28, 2, 2, '#ffffff', true); p.set(hx + 11, 24, '#ffffff', true); p.set(hx + 2, 22, '#ffffff', true); return; }
      // golpe horizontal
      const len = type === 'espadao' ? 18 : type === 'haste' ? 20 : 13;
      const wd = type === 'espadao' ? 3 : 2;
      p.rect(hx - 1, 28, 3, 3, '#8a5a32');
      p.line(hx + 2, 29, hx + 2 + len, 27, type === 'haste' ? '#8a5a32' : blade, false, wd);
      if (type === 'haste') p.poly([[hx + 2 + len, 24], [hx + 7 + len, 27], [hx + 2 + len, 30]], blade);
      else p.rect(hx + 1, 26, 2, 6, accent);
      return;
    }
    if (type === 'espada') { p.rect(hx + 1, 16, 2, 16, blade); p.set(hx + 1, 15, blade); p.rect(hx - 1, 31, 6, 2, accent); p.rect(hx + 1, 33, 2, 3, '#6b4a2a'); }
    if (type === 'espadao') { p.line(hx + 2, 34, hx + 10, 8, blade, false, 3); p.line(hx - 1, 32, hx + 5, 34, accent, false, 2); p.rect(hx, 34, 2, 4, '#6b4a2a'); }
    if (type === 'haste') { p.rect(hx + 2, 6, 1, 40, '#8a5a32'); p.poly([[hx + 2.5, 0], [hx + 5.5, 7], [hx - 0.5, 7]], blade); p.rect(hx, 7, 5, 1, accent); }
    if (type === 'arco') { p.line(hx + 3, 18, hx + 7, 26, '#8a5a32', false, 2); p.line(hx + 7, 26, hx + 7, 34, '#8a5a32', false, 2); p.line(hx + 7, 34, hx + 3, 42, '#8a5a32', false, 2); p.line(hx + 3, 18, hx + 3, 42, '#e8e8e8'); p.rect(hx + 6, 29, 2, 3, accent); }
    if (type === 'catalisador') { p.ell(hx + 6, 26, 3.5, 3.5, accent, true); p.ell(hx + 5.5, 25.5, 1.5, 1.5, '#ffffff', true); p.set(hx + 10, 22, '#ffffff', true); }
  }

  // o: {skin, hair, hairStyle, outfit(classe), species, weaponType, frame, colors{body}}
  function drawHumanoid(o) {
    const p = new Px(W, HH);
    const f = o.frame || 'idle0';
    const of = Object.assign({}, OUTFITS[o.cls] || OUTFITS.plebeu);
    if (o.outfitColor) of.body = o.outfitColor;
    const skin = o.skin || '#e3b892', hair = o.hair || '#3a2a20';
    const body = of.body === 'skin' ? skin : of.body;
    const bob = f === 'idle1' || f === 'walk1' || f === 'walk3' ? 1 : 0;
    const atk = f === 'atk';
    // perna esquerda/direita (na tela)
    let lL = 0, rL = 0, aL = 0, aR = 0;
    if (f === 'walk0') { lL = -2; rL = 1; aL = 1; aR = -1; }
    if (f === 'walk2') { lL = 1; rL = -2; aL = -1; aR = 1; }
    const sp = o.species;
    // capa
    if (of.cape) p.rect(CX - 9, 24 + bob, 18, 18, of.cape);
    if (of.quiver) { p.rect(CX + 4, 18 + bob, 4, 12, '#6b4a2a'); p.rect(CX + 4, 15 + bob, 1, 3, '#e8e8e8'); p.rect(CX + 6, 14 + bob, 1, 4, '#e8e8e8'); }
    // cauda (tiferino)
    if (sp === 'tiferino') { p.line(CX + 3, 38, CX + 9, 40, skin, false, 2); p.line(CX + 9, 40, CX + 11, 35, skin, false, 2); p.poly([[CX + 10, 32], [CX + 13, 35], [CX + 10, 36]], shade(skin, -0.2)); }
    // pernas
    const legTop = 36;
    const legColor = of.legs;
    p.rect(CX - 5, legTop + bob, 4, 9 + lL - bob, legColor);
    p.rect(CX + 1, legTop + bob, 4, 9 + rL - bob, legColor);
    p.rect(CX - 6, 43 + lL, 5, 3, of.boots);
    p.rect(CX + 1, 43 + rL, 5, 3, of.boots);
    // túnica / robe
    const ty = 23 + bob;
    if (of.robe) p.poly([[CX - 7, ty], [CX + 7, ty], [CX + 9, 42], [CX - 9, 42]], body);
    p.rect(CX - 7, ty, 14, 13, body);
    p.rect(CX - 8, ty, 16, 3, body);
    if (of.armor) { p.rect(CX - 10, ty - 1, 4, 4, shade(body, -0.1)); p.rect(CX + 6, ty - 1, 4, 4, shade(body, -0.1)); p.rect(CX - 6, ty + 5, 12, 1, shade(body, -0.25)); p.rect(CX - 1, ty + 1, 2, 8, of.trim); }
    if (of.fur) { p.rect(CX - 9, ty - 1, 18, 3, of.fur); p.rect(CX - 3, ty + 4, 6, 1, shade(skin, -0.15)); }
    if (of.sash) p.rect(CX - 7, ty + 9, 14, 2, of.sash);
    if (of.symbol) { p.rect(CX - 1, ty + 3, 2, 6, of.trim, true); p.rect(CX - 3, ty + 5, 6, 2, of.trim, true); }
    if (of.eye) { p.rect(CX - 2, ty + 4, 4, 2, '#b98cff', true); p.set(CX, ty + 4, '#ffffff', true); }
    if (of.runes) { p.set(CX - 4, ty + 6, of.trim, true); p.set(CX + 3, ty + 8, of.trim, true); p.set(CX - 2, ty + 10, of.trim, true); }
    if (of.leaves) { p.set(CX - 5, ty + 3, '#8fd16a'); p.set(CX + 4, ty + 7, '#8fd16a'); }
    p.rect(CX - 7, ty + 11, 14, 2, of.trim); // cinto
    p.rect(CX - 1, ty + 11, 2, 2, '#d4af37');
    // braços
    const armColor = of.bareArms || of.body === 'skin' ? skin : body;
    p.rect(CX - 10, ty + 1 + aL, 3, 10, armColor);
    p.rect(CX - 10, ty + 10 + aL, 3, 3, skin);
    if (atk) { p.rect(CX + 7, ty + 3, 6, 3, armColor); p.rect(CX + 12, ty + 3, 2, 3, skin); }
    else { p.rect(CX + 7, ty + 1 + aR, 3, 10, armColor); p.rect(CX + 7, ty + 10 + aR, 3, 3, skin); }
    if (sp === 'golias') { p.set(CX - 9, ty + 4, '#4a4f5a'); p.set(CX - 9, ty + 6, '#4a4f5a'); p.set(CX + 8, ty + 5, '#4a4f5a'); }
    // cabeça
    const hy = 14 + bob;
    if (o.hairStyle === 1 && !of.hood) p.rect(CX - 9, hy - 2, 18, 15, hair); // cabelo longo atrás
    if (sp === 'elfo' || sp === 'orc' || sp === 'gnomo') {
      const l = sp === 'elfo' ? 4 : 2;
      p.poly([[CX - 7, hy], [CX - 7 - l, hy - 3], [CX - 7, hy + 3]], skin);
      p.poly([[CX + 7, hy], [CX + 7 + l, hy - 3], [CX + 7, hy + 3]], skin);
    }
    p.ell(CX, hy, 8, 8, skin);
    if (sp === 'draconato') { p.rect(CX - 4, hy + 2, 8, 6, skin); p.rect(CX - 3, hy + 7, 6, 2, shade(skin, -0.12)); p.set(CX - 2, hy + 4, shade(skin, -0.4)); p.set(CX + 1, hy + 4, shade(skin, -0.4)); }
    // olhos
    const ey = hy + 1;
    const eyeC = sp === 'tiferino' ? '#ffcf5a' : sp === 'aasimar' ? '#9fe3ff' : sp === 'draconato' ? '#ffcf5a' : '#2a1f2f';
    p.rect(CX - 4, ey, 2, 3, eyeC, sp === 'tiferino' || sp === 'aasimar');
    p.rect(CX + 2, ey, 2, 3, eyeC, sp === 'tiferino' || sp === 'aasimar');
    p.set(CX - 4, ey, '#ffffff', true); p.set(CX + 2, ey, '#ffffff', true);
    p.rect(CX - 6, ey + 3, 2, 1, shade(skin, -0.08)); p.rect(CX + 4, ey + 3, 2, 1, shade(skin, -0.08));
    if (sp === 'orc') { p.set(CX - 2, hy + 5, '#f2ead0'); p.set(CX + 1, hy + 5, '#f2ead0'); p.set(CX - 2, hy + 4, '#f2ead0'); p.set(CX + 1, hy + 4, '#f2ead0'); }
    if (sp === 'golias') { p.set(CX - 5, hy - 2, '#4a4f5a'); p.set(CX - 4, hy - 3, '#4a4f5a'); p.set(CX + 4, hy + 4, '#4a4f5a'); }
    // cabelo / capuz / chapéu
    if (of.hood) {
      p.ell(CX, hy - 2, 9, 8, of.hood);
      p.rect(CX - 9, hy - 2, 3, 10, of.hood); p.rect(CX + 6, hy - 2, 3, 10, of.hood);
      p.ell(CX, hy + 1, 6, 5, skin);
      p.rect(CX - 4, ey, 2, 3, eyeC); p.rect(CX + 2, ey, 2, 3, eyeC); p.set(CX - 4, ey, '#ffffff', true); p.set(CX + 2, ey, '#ffffff', true);
      if (of.mask) p.rect(CX - 6, hy + 4, 12, 4, '#1f2228');
    } else if (sp !== 'draconato') {
      p.ell(CX, hy - 4, 9, 5.5, hair);
      // franja
      for (let x = -7; x <= 7; x += 2) p.rect(CX + x, hy - 1, 2, (Math.abs(x) % 4 === 1 ? 2 : 1), hair);
      if (o.hairStyle === 2) { p.rect(CX + 7, hy - 2, 3, 3, hair); p.line(CX + 9, hy, CX + 11, hy + 10, hair, false, 2); }
      if (o.hairStyle === 3) { p.poly([[CX - 8, hy - 5], [CX - 6, hy - 12], [CX - 3, hy - 6], [CX, hy - 13], [CX + 3, hy - 6], [CX + 6, hy - 12], [CX + 8, hy - 5]], hair); }
      if (o.hairStyle === 1) { p.rect(CX - 9, hy - 3, 3, 13, hair); p.rect(CX + 6, hy - 3, 3, 13, hair); }
    } else {
      p.poly([[CX - 3, hy - 7], [CX, hy - 12], [CX + 3, hy - 7]], shade(skin, -0.25));
      p.poly([[CX - 7, hy - 4], [CX - 9, hy - 9], [CX - 4, hy - 6]], shade(skin, -0.25));
      p.poly([[CX + 7, hy - 4], [CX + 9, hy - 9], [CX + 4, hy - 6]], shade(skin, -0.25));
    }
    if (sp === 'anao') { p.poly([[CX - 6, hy + 3], [CX + 6, hy + 3], [CX + 4, hy + 11], [CX, hy + 13], [CX - 4, hy + 11]], hair); p.rect(CX - 2, hy + 4, 4, 1, shade(skin, -0.2)); }
    if (sp === 'tiferino') { p.line(CX - 5, hy - 7, CX - 8, hy - 12, '#3a2a3a', false, 2); p.line(CX + 4, hy - 7, CX + 7, hy - 12, '#3a2a3a', false, 2); }
    if (of.hat === 'wizard') { p.poly([[CX - 11, hy - 6], [CX + 11, hy - 6], [CX + 3, hy - 9], [CX + 6, hy - 20], [CX - 3, hy - 9]], body); p.rect(CX - 11, hy - 7, 22, 2, shade(body, -0.2)); p.set(CX + 1, hy - 12, of.trim, true); }
    if (of.hat === 'bard') { p.ell(CX, hy - 7, 11, 2.5, '#5b2340'); p.ell(CX, hy - 9, 6, 3, '#5b2340'); p.line(CX + 4, hy - 9, CX + 11, hy - 17, '#f1c40f', false, 2); }
    if (of.leaves) { p.set(CX - 6, hy - 8, '#8fd16a'); p.set(CX - 3, hy - 9, '#6fbf4a'); p.set(CX + 2, hy - 9, '#8fd16a'); p.set(CX + 5, hy - 8, '#6fbf4a'); }
    if (sp === 'aasimar') { for (let a = 0; a < Math.PI * 2; a += 0.25) p.set(CX + Math.cos(a) * 7, hy - 12 + Math.sin(a) * 1.6, '#ffe9a8', true); }
    drawWeapon(p, o.weaponType, o, atk);
    return p.toCanvas();
  }

  // ============================================================ MONSTROS
  const MON = {};
  const eye = (p, x, y, c = '#ffd36b', s = 1) => { p.rect(x, y, s, s, c, true); };
  MON.wolf = (pal, o = {}) => {
    const p = new Px(48, 40), [c1, c2, c3] = pal;
    p.poly([[34, 6], [38, 2], [39, 9]], c2); p.poly([[42, 7], [45, 2], [45, 10]], c2);
    p.ell(22, 22, 14, 8, c1);
    p.ell(39, 14, 7, 6, c1);
    p.poly([[42, 15], [48, 18], [42, 20]], c1);
    p.rect(45, 17, 2, 1, '#1a1a1a');
    p.ell(22, 26, 10, 4, c3);
    p.poly([[8, 18], [1, 12], [4, 20]], c1);
    for (const x of [11, 17, 27, 33]) p.rect(x, 27, 3, 11, c1);
    for (const x of [11, 17, 27, 33]) p.rect(x, 36, 4, 2, c2);
    eye(p, 40, 12, o.fire ? '#ffd36b' : '#ffe08a', 2);
    if (o.fire) { p.ell(4, 13, 3, 4, '#ff6a3c', true); p.ell(40, 22, 3, 2, '#ff9a52', true); }
    return p;
  };
  MON.spider = (pal) => {
    const p = new Px(56, 40), [c1, c2, c3] = pal;
    for (let i = 0; i < 4; i++) {
      const y = 16 + i * 4;
      p.line(26, y, 6 - i * 1, 6 + i * 8, c1, false, 2); p.line(6 - i, 6 + i * 8, 2 + i * 3, 36, c1, false, 2);
      p.line(30, y, 50 + i, 6 + i * 8, c1, false, 2); p.line(50 + i, 6 + i * 8, 54 - i * 3, 36, c1, false, 2);
    }
    p.ell(28, 16, 11, 9, c1);
    p.ell(28, 26, 7, 6, c1);
    p.rect(22, 12, 12, 2, c2, true);
    for (const [x, y] of [[24, 25], [27, 24], [30, 24], [33, 25], [25, 27], [32, 27]]) eye(p, x, y, c3);
    p.rect(25, 30, 2, 4, '#e8e8e8'); p.rect(30, 30, 2, 4, '#e8e8e8');
    return p;
  };
  MON.bear = (pal, o = {}) => {
    const p = new Px(56, 52), [c1, c2, c3] = pal;
    p.ell(28, 30, 18, 15, c1);
    p.ell(28, 14, 11, 10, c1);
    p.ell(19, 6, 4, 4, c1); p.ell(37, 6, 4, 4, c1);
    p.ell(28, 18, 5, 4, c3);
    p.rect(26, 15, 4, 2, '#1a1a1a');
    eye(p, 23, 11, '#1a1a1a', 2); eye(p, 32, 11, '#1a1a1a', 2);
    p.ell(28, 32, 10, 9, shade(c1, 0.12));
    for (const x of [12, 40]) { p.rect(x, 30, 6, 16, c1); p.rect(x - 1, 44, 8, 3, c2); }
    for (const x of [21, 31]) { p.rect(x, 40, 5, 9, c1); p.rect(x - 1, 47, 7, 3, c2); }
    return p;
  };
  MON.owlbear = (pal) => {
    const p = MON.bear([pal[0], shade(pal[0], -0.3), pal[1]]);
    const [c1, c2, c3] = pal;
    p.ell(28, 14, 11, 10, c2);
    p.ell(23, 12, 4, 4, '#ffffff'); p.ell(33, 12, 4, 4, '#ffffff');
    eye(p, 22, 11, '#1a1a1a', 2); eye(p, 32, 11, '#1a1a1a', 2);
    p.poly([[25, 16], [31, 16], [28, 23]], c3);
    p.poly([[17, 4], [20, 0], [22, 6]], c2); p.poly([[39, 4], [36, 0], [34, 6]], c2);
    return p;
  };
  MON.rat = (pal) => {
    const p = new Px(40, 28), [c1, c2, c3] = pal;
    p.line(4, 18, 0, 8, c2, false, 2);
    p.ell(18, 17, 11, 7, c1);
    p.ell(30, 14, 7, 5, c1);
    p.ell(27, 8, 3, 3, c2); p.ell(33, 8, 3, 3, c2);
    p.rect(36, 14, 3, 2, c2);
    eye(p, 31, 12, '#ff4d4d', 2);
    for (const x of [10, 15, 22, 27]) p.rect(x, 22, 3, 5, c1);
    return p;
  };
  MON.crab = (pal) => {
    const p = new Px(52, 36), [c1, c2, c3] = pal;
    p.ell(26, 22, 15, 9, c1);
    p.ell(26, 20, 10, 5, shade(c1, 0.15));
    p.ell(8, 12, 6, 5, c1); p.ell(44, 12, 6, 5, c1);
    p.poly([[4, 8], [10, 4], [9, 11]], c2); p.poly([[48, 8], [42, 4], [43, 11]], c2);
    p.line(14, 18, 9, 15, c1, false, 2); p.line(38, 18, 43, 15, c1, false, 2);
    for (let i = 0; i < 3; i++) { p.line(14, 26 + i * 2, 4 + i * 2, 34, c1, false, 2); p.line(38, 26 + i * 2, 48 - i * 2, 34, c1, false, 2); }
    p.rect(21, 9, 2, 6, c1); p.rect(29, 9, 2, 6, c1);
    eye(p, 20, 7, c3, 3); eye(p, 29, 7, c3, 3);
    return p;
  };
  MON.shark = (pal) => {
    const p = new Px(56, 32), [c1, c2, c3] = pal;
    p.poly([[2, 6], [10, 16], [2, 26]], c1);
    p.ell(28, 16, 20, 8, c1);
    p.ell(30, 19, 16, 4, c2);
    p.poly([[26, 9], [32, 0], [34, 10]], c1);
    p.poly([[44, 18], [52, 16], [46, 22]], c2);
    for (let x = 38; x < 48; x += 2) p.set(x, 20, '#ffffff');
    eye(p, 42, 13, c3, 2);
    return p;
  };
  MON.humanoid = (pal, o = {}) => {
    const outfit = o.robed ? 'manto' : o.hat ? 'nobre' : o.gear === 'mace' ? 'tribal' : 'ladrao';
    const look = { skin: pal[2], hair: pal[1], hairStyle: o.hat ? 3 : 0, eyes: '#2a1f1a', outfit, c1: pal[0], c2: E.SP.shade(pal[0], -0.4), acc: o.robed ? 'capuz' : 'nenhum', build: o.gear === 'mace' ? 'forte' : 'medio', beard: o.gear === 'mace' };
    const wt = o.gear === 'sword' || o.gear === 'mace' || o.gear === 'dagger' ? 'espada' : o.robed ? 'catalisador' : null;
    return { canvasFn: (frame) => E.CH.draw({ look, species: 'humano', frame, weaponType: wt, weaponColor: { c1: '#c9d1d9', c2: o.robed ? '#c9a0ff' : '#8a8f99' }, weaponRarity: 1 }) };
  };
  MON.goblin = (pal, o = {}) => {
    const p = new Px(40, 40), [c1, c2, c3] = pal;
    p.rect(14, 30, 4, 8, c2); p.rect(22, 30, 4, 8, c2);
    p.rect(12, 20, 16, 11, c2);
    p.rect(13, 27, 14, 2, c3);
    p.rect(9, 21, 3, 8, c1); p.rect(28, 21, 3, 8, c1);
    p.ell(20, 13, 8, 7, c1);
    p.poly([[13, 12], [2, 7], [12, 16]], c1); p.poly([[27, 12], [38, 7], [28, 16]], c1);
    eye(p, 16, 12, '#ffd36b', 2); eye(p, 22, 12, '#ffd36b', 2);
    p.rect(17, 17, 6, 1, '#3a1a1a'); p.set(18, 18, '#ffffff'); p.set(21, 18, '#ffffff');
    if (o.gear === 'sword' || true) { p.line(31, 28, 37, 14, o.gear === 'sword' ? '#c9d1d9' : '#c9b37a', false, 2); p.rect(29, 27, 3, 3, '#6b4a2a'); }
    return p;
  };
  MON.skeleton = (pal, o = {}) => {
    const p = new Px(40, 48), [c1, c2, c3] = pal;
    p.rect(14, 34, 3, 12, c1); p.rect(23, 34, 3, 12, c1);
    p.rect(13, 32, 14, 3, c1);
    for (let y = 21; y < 31; y += 2) p.rect(13, y, 14, 1, c1);
    p.rect(19, 20, 2, 13, c1);
    if (o.armor) { p.rect(12, 20, 16, 10, '#4a4f5a'); p.rect(12, 20, 16, 2, '#6b7280'); }
    p.rect(9, 21, 2, 12, c1); p.rect(29, 21, 2, 12, c1);
    p.ell(20, 12, 7, 7, c1);
    p.rect(15, 16, 10, 3, c1);
    p.rect(15, 11, 4, 4, '#1a1a1a'); p.rect(21, 11, 4, 4, '#1a1a1a');
    eye(p, 16, 12, c3, 2); eye(p, 22, 12, c3, 2);
    for (let x = 16; x < 25; x += 2) p.set(x, 18, '#1a1a1a');
    p.line(31, 33, 36, 12, '#c9d1d9', false, 2); p.rect(29, 31, 4, 2, '#8a8370');
    return p;
  };
  MON.zombie = (pal) => {
    const p = new Px(40, 48), [c1, c2, c3] = pal;
    p.rect(14, 34, 5, 12, c2); p.rect(22, 34, 5, 12, c2);
    p.rect(12, 20, 17, 15, c2);
    p.rect(14, 24, 3, 3, c1); p.rect(23, 28, 4, 2, c1);
    p.rect(4, 22, 12, 4, c1); p.rect(25, 24, 12, 4, c1);
    p.ell(20, 12, 7, 8, c1);
    eye(p, 16, 11, c3, 2); eye(p, 22, 12, c3, 2);
    p.rect(17, 17, 6, 2, '#3a2a2a');
    p.rect(14, 4, 3, 2, '#3a3a2a'); p.rect(21, 4, 4, 2, '#3a3a2a');
    return p;
  };
  MON.ghoul = (pal) => {
    const p = new Px(44, 48), [c1, c2, c3] = pal;
    p.rect(15, 34, 4, 12, c1); p.rect(24, 34, 4, 12, c1);
    p.poly([[13, 20], [31, 20], [29, 36], [15, 36]], c2);
    p.line(13, 22, 4, 34, c1, false, 3); p.line(31, 22, 40, 34, c1, false, 3);
    for (const x of [2, 5, 38, 41]) p.rect(x, 34, 1, 4, '#e8e2d0');
    p.ell(22, 13, 7, 8, c1);
    eye(p, 18, 12, c3, 2); eye(p, 24, 12, c3, 2);
    p.rect(18, 17, 8, 3, '#1a1a1a');
    for (let x = 18; x < 26; x += 2) p.set(x, 17, '#e8e2d0');
    return p;
  };
  MON.ghost = (pal) => {
    const p = new Px(44, 52), [c1, c2, c3] = pal;
    p.poly([[10, 18], [34, 18], [38, 46], [32, 40], [27, 50], [22, 42], [16, 50], [12, 40], [6, 46]], c1);
    p.ell(22, 16, 11, 11, c1);
    p.ell(22, 14, 8, 6, c2);
    eye(p, 17, 13, c3, 3); eye(p, 24, 13, c3, 3);
    p.line(8, 22, 1, 32, c1, false, 3); p.line(36, 22, 43, 32, c1, false, 3);
    return p;
  };
  MON.harpy = (pal) => {
    const p = new Px(56, 48), [c1, c2, c3] = pal;
    p.poly([[22, 18], [2, 4], [6, 16], [0, 22], [8, 26], [20, 28]], c1);
    p.poly([[34, 18], [54, 4], [50, 16], [56, 22], [48, 26], [36, 28]], c1);
    p.rect(22, 18, 12, 14, c2);
    p.rect(23, 32, 3, 10, c1); p.rect(30, 32, 3, 10, c1);
    p.rect(21, 42, 5, 2, '#d4af37'); p.rect(30, 42, 5, 2, '#d4af37');
    p.ell(28, 11, 6, 7, c2);
    p.ell(28, 7, 7, 5, c3);
    p.rect(21, 7, 3, 12, c3); p.rect(32, 7, 3, 12, c3);
    eye(p, 25, 11, '#ffd36b'); eye(p, 30, 11, '#ffd36b');
    return p;
  };
  MON.fishman = (pal) => {
    const p = new Px(52, 52), [c1, c2, c3] = pal;
    p.poly([[14, 48], [26, 36], [38, 48], [26, 44]], c1);
    p.ell(26, 32, 13, 11, c1);
    p.ell(26, 34, 9, 8, c2);
    p.ell(26, 14, 10, 9, c1);
    p.poly([[18, 6], [26, 0], [34, 6]], c3);
    eye(p, 21, 12, '#ffd36b', 2); eye(p, 29, 12, '#ffd36b', 2);
    p.rect(21, 18, 10, 2, c3);
    p.line(10, 24, 6, 40, c1, false, 3); p.line(42, 24, 46, 40, c1, false, 3);
    p.line(46, 46, 48, 2, '#8a8f99', false, 2); p.poly([[45, 4], [48, 0], [51, 4]], '#c9d1d9');
    return p;
  };
  MON.hag = (pal) => {
    const p = new Px(44, 48), [c1, c2, c3] = pal;
    p.poly([[12, 20], [32, 20], [36, 46], [8, 46]], c2);
    p.line(12, 22, 4, 36, c1, false, 3); p.line(32, 22, 40, 36, c1, false, 3);
    p.ell(22, 14, 8, 8, c1);
    p.rect(13, 6, 18, 14, '#2d3b2f');
    p.ell(22, 15, 6, 6, c1);
    p.poly([[22, 15], [26, 22], [21, 19]], shade(c1, -0.2));
    eye(p, 18, 13, c3, 2); eye(p, 24, 13, c3, 2);
    return p;
  };
  MON.brute = (pal, o = {}) => {
    const p = new Px(60, 64), [c1, c2, c3] = pal;
    p.rect(19, 46, 8, 16, c2); p.rect(33, 46, 8, 16, c2);
    p.ell(30, 36, 18, 14, c1);
    p.rect(16, 40, 28, 8, c2);
    p.ell(30, 38, 11, 8, c3);
    p.rect(6, 26, 8, 22, c1); p.rect(46, 26, 8, 22, c1);
    p.ell(30, 18, 10, 9, c1);
    eye(p, 25, 16, '#ffd36b', 2); eye(p, 33, 16, '#ffd36b', 2);
    p.rect(25, 22, 10, 2, '#2a1a1a'); p.set(26, 21, '#f2ead0'); p.set(33, 21, '#f2ead0');
    p.line(54, 48, 58, 20, '#7a5232', false, 4);
    p.ell(57, 18, 4, 5, '#5a3d26');
    return p;
  };
  MON.griffon = (pal) => {
    const p = new Px(60, 52), [c1, c2, c3] = pal;
    p.poly([[22, 18], [4, 2], [10, 20], [2, 26], [20, 30]], c1);
    p.ell(30, 30, 16, 10, c1);
    p.ell(40, 18, 8, 9, c2);
    p.poly([[46, 18], [56, 22], [46, 24]], '#d4af37');
    eye(p, 42, 15, '#1a1a1a', 2);
    for (const x of [20, 26, 34, 40]) p.rect(x, 36, 4, 12, c1);
    for (const x of [34, 40]) p.rect(x - 1, 46, 6, 3, '#d4af37');
    p.line(14, 30, 4, 40, c1, false, 2); p.ell(3, 41, 2, 2, c3);
    return p;
  };
  MON.gargoyle = (pal) => {
    const p = new Px(56, 52), [c1, c2, c3] = pal;
    p.poly([[20, 14], [2, 2], [6, 24], [18, 28]], c2);
    p.poly([[36, 14], [54, 2], [50, 24], [38, 28]], c2);
    p.ell(28, 30, 11, 12, c1);
    p.rect(20, 40, 5, 10, c1); p.rect(31, 40, 5, 10, c1);
    p.ell(28, 14, 8, 8, c1);
    p.poly([[21, 9], [18, 1], [24, 7]], c2); p.poly([[35, 9], [38, 1], [32, 7]], c2);
    eye(p, 24, 13, c3, 2); eye(p, 31, 13, c3, 2);
    p.rect(24, 18, 8, 2, '#1a1a1a');
    return p;
  };
  MON.wyvern = (pal) => {
    const p = new Px(64, 56), [c1, c2, c3] = pal;
    p.poly([[24, 20], [2, 2], [8, 14], [0, 22], [10, 26], [4, 34], [22, 32]], c2);
    p.poly([[40, 20], [62, 2], [56, 14], [64, 22], [54, 26], [60, 34], [42, 32]], c2);
    p.ell(32, 32, 12, 12, c1);
    p.ell(32, 34, 7, 8, c3);
    p.line(32, 22, 32, 10, c1, false, 5);
    p.ell(32, 8, 6, 5, c1);
    p.poly([[28, 4], [26, 0], [30, 3]], c3); p.poly([[36, 4], [38, 0], [34, 3]], c3);
    eye(p, 29, 7, '#ffd36b'); eye(p, 34, 7, '#ffd36b');
    p.line(40, 40, 54, 50, c1, false, 3); p.poly([[52, 46], [60, 54], [50, 54]], c3);
    p.rect(25, 42, 5, 10, c1); p.rect(34, 42, 5, 10, c1);
    return p;
  };
  MON.wisp = (pal) => {
    const p = new Px(32, 32), [c1, c2, c3] = pal;
    p.ell(16, 16, 12, 12, c3, true);
    p.ell(16, 16, 9, 9, c1, true);
    p.ell(16, 15, 5, 5, c2, true);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; p.set(16 + Math.cos(a) * 14, 16 + Math.sin(a) * 14, c2, true); }
    return p;
  };
  MON.imp = (pal) => {
    const p = new Px(40, 40), [c1, c2, c3] = pal;
    p.poly([[16, 16], [2, 6], [6, 20]], c2); p.poly([[24, 16], [38, 6], [34, 20]], c2);
    p.ell(20, 24, 7, 8, c1);
    p.rect(16, 30, 3, 8, c1); p.rect(21, 30, 3, 8, c1);
    p.line(24, 30, 34, 36, c1, false, 2); p.poly([[33, 33], [38, 36], [33, 38]], c1);
    p.ell(20, 12, 7, 6, c1);
    p.poly([[14, 9], [12, 2], [17, 7]], c2); p.poly([[26, 9], [28, 2], [23, 7]], c2);
    eye(p, 17, 11, c3, 2); eye(p, 21, 11, c3, 2);
    p.rect(17, 15, 6, 1, '#1a1a1a');
    return p;
  };
  MON.elemental = (pal) => {
    const p = new Px(56, 60), [c1, c2, c3] = pal;
    for (let i = 0; i < 9; i++) { const y = 8 + i * 5.5, r = 6 + i * 2.2; p.ell(28 + Math.sin(i) * 3, y, r, 3.2, i % 2 ? c1 : c2); }
    p.ell(28, 12, 8, 6, c3, true);
    eye(p, 24, 11, '#3a7bd5', 2); eye(p, 31, 11, '#3a7bd5', 2);
    return p;
  };
  MON.mimic = (pal) => {
    const p = new Px(48, 40), [c1, c2, c3] = pal;
    p.rect(6, 18, 36, 18, c1);
    p.rect(6, 18, 36, 2, c2); p.rect(6, 34, 36, 2, c2); p.rect(22, 18, 4, 18, c2);
    p.poly([[4, 18], [44, 18], [42, 6], [6, 6]], c1);
    p.rect(6, 6, 36, 2, c2);
    for (let x = 8; x < 42; x += 4) { p.poly([[x, 18], [x + 2, 13], [x + 4, 18]], '#f2ead0'); p.poly([[x, 18], [x + 2, 22], [x + 4, 18]], '#f2ead0'); }
    p.ell(24, 18, 8, 2, c3);
    p.line(42, 26, 47, 34, c3, false, 3);
    eye(p, 14, 10, '#ffd36b', 2); eye(p, 32, 10, '#ffd36b', 2);
    return p;
  };
  MON.doppel = (pal) => {
    const p = new Px(40, 48), [c1, c2, c3] = pal;
    p.rect(14, 34, 4, 12, c2); p.rect(22, 34, 4, 12, c2);
    p.rect(12, 20, 16, 15, c2);
    p.rect(8, 21, 3, 13, c1); p.rect(29, 21, 3, 13, c1);
    p.ell(20, 12, 8, 9, c1);
    p.rect(14, 11, 4, 3, c3); p.rect(22, 11, 4, 3, c3);
    eye(p, 15, 12, '#ffffff', 1); eye(p, 23, 12, '#ffffff', 1);
    return p;
  };
  MON.satyr = (pal) => {
    const p = new Px(40, 48), [c1, c2, c3] = pal;
    p.rect(13, 32, 5, 9, c1); p.rect(22, 32, 5, 9, c1);
    p.rect(14, 40, 3, 6, c1); p.rect(23, 40, 3, 6, c1);
    p.rect(13, 45, 4, 2, '#2a1a1a'); p.rect(22, 45, 4, 2, '#2a1a1a');
    p.rect(12, 20, 16, 13, c2);
    p.rect(8, 21, 3, 11, c2); p.rect(29, 21, 3, 11, c2);
    p.ell(20, 12, 7, 7, c2);
    p.poly([[14, 8], [9, 1], [16, 5]], '#d9c7a0'); p.poly([[26, 8], [31, 1], [24, 5]], '#d9c7a0');
    p.ell(20, 8, 8, 4, c1);
    eye(p, 16, 11, '#2a1a1a', 2); eye(p, 22, 11, '#2a1a1a', 2);
    p.rect(17, 16, 6, 4, c1);
    p.rect(30, 22, 6, 2, c3);
    return p;
  };
  MON.tree = (pal) => {
    const p = new Px(60, 72), [c1, c2, c3] = pal;
    p.ell(30, 18, 24, 16, c2);
    p.ell(16, 24, 12, 10, shade(c2, -0.1)); p.ell(44, 24, 12, 10, shade(c2, -0.1));
    for (let i = 0; i < 9; i++) p.ell(10 + (i * 37) % 42, 10 + (i * 23) % 22, 2, 2, c3, true);
    p.rect(22, 30, 16, 34, c1);
    p.line(22, 40, 6, 30, c1, false, 4); p.line(38, 40, 54, 32, c1, false, 4);
    p.rect(18, 62, 8, 8, c1); p.rect(34, 62, 8, 8, c1);
    eye(p, 25, 40, '#ffd36b', 3); eye(p, 32, 40, '#ffd36b', 3);
    p.rect(26, 48, 8, 3, '#2a1a10');
    return p;
  };
  MON.dryad = (pal) => {
    const p = new Px(40, 52), [c1, c2, c3] = pal;
    p.poly([[13, 22], [27, 22], [31, 48], [9, 48]], c1);
    p.rect(9, 23, 3, 13, c2); p.rect(28, 23, 3, 13, c2);
    p.ell(20, 14, 7, 8, c2);
    p.ell(20, 9, 11, 7, c1);
    p.rect(9, 9, 4, 18, c1); p.rect(27, 9, 4, 18, c1);
    for (const [x, y] of [[12, 4], [20, 2], [28, 4], [10, 14], [30, 16]]) p.ell(x, y, 2, 2, c3, true);
    eye(p, 17, 14, '#2a5a2a', 2); eye(p, 22, 14, '#2a5a2a', 2);
    return p;
  };
  MON.horse = (pal) => {
    const p = new Px(60, 52), [c1, c2, c3] = pal;
    p.ell(28, 26, 18, 10, c1);
    p.line(42, 22, 48, 8, c1, false, 7);
    p.ell(50, 8, 6, 5, c1);
    p.poly([[40, 4], [46, 0], [44, 16], [36, 22]], c2, true);
    p.poly([[10, 22], [2, 14], [4, 34]], c2, true);
    for (const x of [14, 20, 34, 40]) { p.rect(x, 32, 4, 16, c1); p.rect(x - 1, 46, 6, 3, c2, true); }
    eye(p, 51, 6, c3, 2);
    return p;
  };
  MON.minotaur = (pal) => {
    const p = MON.brute([pal[0], pal[1], shade(pal[0], 0.2)]);
    p.rect(20, 6, 20, 18, pal[0]);
    p.ell(30, 18, 10, 9, pal[0]);
    p.poly([[20, 12], [8, 2], [12, 12]], pal[2]); p.poly([[40, 12], [52, 2], [48, 12]], pal[2]);
    p.ell(30, 22, 6, 4, shade(pal[0], 0.15));
    eye(p, 25, 15, '#ff4d4d', 2); eye(p, 33, 15, '#ff4d4d', 2);
    p.rect(28, 24, 4, 2, '#d4af37');
    p.line(54, 52, 58, 14, '#7a5232', false, 3); p.poly([[52, 12], [60, 6], [60, 22]], '#c9d1d9');
    return p;
  };
  MON.queen = (pal) => {
    const p = new Px(64, 72), [c1, c2, c3] = pal;
    p.poly([[8, 70], [16, 30], [48, 30], [56, 70]], c1);
    p.poly([[14, 70], [22, 34], [42, 34], [50, 70]], shade(c1, -0.25));
    p.poly([[4, 36], [20, 26], [14, 52]], c1); p.poly([[60, 36], [44, 26], [50, 52]], c1);
    p.ell(32, 20, 9, 10, c2);
    p.rect(25, 18, 14, 6, '#241838');
    eye(p, 27, 19, c3, 3); eye(p, 34, 19, c3, 3);
    // coroa de nove pontas
    for (let i = 0; i < 9; i++) { const x = 18 + i * 3.5; p.poly([[x, 10], [x + 1.5, 1 + (i % 2) * 3], [x + 3, 10]], '#d8b8ff', true); }
    p.rect(18, 9, 28, 3, '#a98cd8', true);
    p.line(50, 60, 60, 14, '#c9d1d9', false, 2);
    return p;
  };

  // mapeia nomes de sprite → funções
  const ALIAS = { human: 'humanoid', robed: 'humanoid' };

  // ---------- cache de texturas ----------
  const cache = new Map();
  const remember = (key, canvas) => {
    cache.set(key, canvas);
    // Outfits/equipment previews can create many combinations during a long session.
    while (cache.size > 768) cache.delete(cache.keys().next().value);
    return canvas;
  };
  SP.hero = (h, frame = 'idle0', weaponType) => {
    const look = E.CH.normalize(h.look, h.cls, h.species, h.ancestry);
    const wi = SP.heroWeaponInfo(h);
    const wt = weaponType === undefined ? wi.type : weaponType;
    // Identity, both palette colors and base silhouette matter; equal rarity is not equal art.
    const key = `h|${h.species}|${JSON.stringify(look)}|${wt}|${wi.identity}|${wi.base}|${wi.c1}|${wi.c2}|${wi.c3}|${wi.rar}|${wi.refine}|${JSON.stringify(wi.def && wi.def.art)}|${wi.shape}|${wi.twoHands}|${frame}`;
    if (cache.has(key)) return cache.get(key);
    const cv = E.CH.draw({ look, species: h.species, frame, weaponType: wt,
      weaponColor: wi, weaponDef: wi.def, weaponRarity: wi.rar, twoHands: wi.twoHands });
    cv._weaponIdentity = wi.identity; cv._weaponBase = wi.base; cv._twoHands = wi.twoHands;
    return remember(key, cv);
  };
  // CanvasTextures can subscribe once; SVG inventory art is rasterized once per weapon.
  SP.onReady = (canvas, callback) => {
    if (!canvas || typeof callback !== 'function') return;
    if (canvas._weaponPending) (canvas._readyCallbacks || (canvas._readyCallbacks = new Set())).add(callback);
    else callback(canvas);
  };
  SP.heroWeaponInfo = (h) => {
    const fallback = { c1: '#dfe6ee', c2: '#d4af37', rar: 1, shape: '', base: '', identity: 'unarmed', twoHands: false, type: null, def: null };
    if (!h.equip || !E.Store.weapon) return fallback;
    const wt = SP.heroWeaponType(h);
    const eq = wt === 'catalisador' ? E.C.equipped(h, 'focus') : E.C.equipped(h, 'weapon');
    if (!eq) return fallback;
    const def = E.C.weaponDef && E.C.weaponDef(eq.entry) || eq.def;
    const art = def.art || {}, base = def.base || '';
    const rule = E.R && E.R.WEAPONS && E.R.WEAPONS[base];
    const props = rule && rule.props || [];
    return { c1: art.c1 || '#dfe6ee', c2: art.c2 || '#d4af37', c3: art.c3 || art.c2 || '#d4af37',
      rar: def.rarity || 1, refine: eq.entry && eq.entry.refine || 1, shape: art.shape || art.tpl || base || wt,
      base, identity: (eq.entry && (eq.entry.uid || eq.entry.id)) || def.id || def.name || base,
      twoHands: wt !== 'catalisador' && (props.includes('duas_maos') || !!(rule && rule.vers && !h.equip.shield)),
      type: wt, def };
  };
  SP.npc = (npc, frame = 'idle0') => {
    const key = `n|${npc.name}|${frame}`;
    if (cache.has(key)) return cache.get(key);
    let cv;
    if (npc.dragon && E.DR) cv = E.DR.paint(npc.dragon, frame === 'idle1' ? 1 : 0);
    else if (npc.beast) {
      const p = npc.name.includes('Cervo') ? deer(npc.look) : MON.wyvern(['#8f96a3', '#4b4d55', '#ffcf5a']);
      cv = p.toCanvas();
    } else {
      cv = E.CH.draw({ look: E.CH.npcLook(npc), species: npc.name.includes('Ossos') ? 'humano' : 'humano', frame });
    }
    return remember(key, cv);
  };
  function deer(look) {
    const p = new Px(48, 48);
    const c = look.skin, c2 = look.outfit;
    p.ell(22, 28, 13, 7, c, true);
    for (const x of [12, 17, 27, 32]) p.rect(x, 32, 3, 14, c, true);
    p.line(32, 24, 38, 12, c, false, 5);
    p.ell(39, 10, 5, 4, c, true);
    p.line(37, 6, 32, 0, c2, true, 1); p.line(41, 6, 46, 0, c2, true, 1); p.line(34, 3, 30, 4, c2, true); p.line(44, 3, 47, 5, c2, true);
    p.set(40, 9, '#1a3a5a', true);
    return p;
  }
  SP.monster = (key, frame = 'idle0') => {
    const def = E.M.MONSTERS[key];
    const k = `m|${key}|${frame}`;
    if (cache.has(k)) return cache.get(k);
    let cv;
    // bestiário ilustrado (bestiary.js) tem prioridade
    if (E.MS) { cv = E.MS.draw(def.sprite, def, frame); if (cv) return remember(k, cv); }
    let fn = MON[ALIAS[def.sprite] || def.sprite] || MON.goblin;
    const res = fn(def.pal, { fire: def.fire, gear: def.gear, armor: def.armor, hat: def.hat, robed: def.sprite === 'robed' });
    if (res && res.canvasFn) cv = res.canvasFn(frame === 'idle1' ? 'idle1' : 'idle0');
    else {
      if (frame === 'idle1') { // respiração: desloca 1px a metade superior
        const q = new Px(res.w, res.h);
        for (let y = 0; y < res.h; y++) for (let x = 0; x < res.w; x++) { const i = y * res.w + x; if (res.d[i]) q.set(x, y < res.h * 0.55 ? y + 1 : y, res.d[i], res.glow.has(i)); }
        cv = q.toCanvas();
      } else cv = res.toCanvas();
    }
    return remember(k, cv);
  };
  // retrato (recorte do rosto) em data URL para a interface
  SP.portrait = (cv, scale = 4) => {
    const c = document.createElement('canvas');
    scale = Math.max(1, Math.round(scale / (cv._res || 1)));
    c.width = cv.width * scale; c.height = cv.height * scale;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(cv, 0, 0, c.width, c.height);
    return c.toDataURL();
  };
  SP.heroWeaponType = (h) => {
    const w = E.C.equipped(h, 'weapon');
    if (h.equip && h.equip.visualSlot === 'weapon') return w ? w.def.type : null;
    if ((h.equip && h.equip.visualSlot === 'focus') || (E.C.cls(h).caster && ['bruxo', 'feiticeiro', 'mago'].includes(h.cls))) {
      const f = E.C.equipped(h, 'focus');
      if (f) return 'catalisador';
    }
    return w ? w.def.type : null;
  };

  E.SP = SP;
})();
