/* Mapa-múndi ilustrado: continente pintado proceduralmente (costas, biomas, estradas, rios, rosa dos ventos, névoa). */
(() => {
  const AA = {};
  const GROUND = { forest: [79, 154, 85], city: [158, 190, 104], ruins: [165, 152, 118], coast: [120, 196, 150], market: [222, 176, 110], mountain: [150, 158, 166], astral: [122, 116, 196], garden: [226, 196, 98], abyss: [78, 60, 98], metro: [214, 196, 150] };

  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function noise(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 5; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; }

  // campo de terra: blobs nas regiões + ruído; >0.5 é terra
  function field(regs, u, v, asp) {
    let m = 0;
    for (const r of regs) { const dx = (u - r.x) * asp, dy = v - r.y; m = Math.max(m, Math.exp(-(dx * dx + dy * dy) / 0.045)); }
    const n = fbm(u * 5.2 + 3.1, v * 5.2 + 7.7);
    const edge = Math.min(u, 1 - u, v, 1 - v);
    return m * 0.9 + (n - 0.5) * 0.75 + (edge < 0.06 ? (edge - 0.06) * 4 : 0) + 0.12;
  }
  function nearest(regs, u, v, asp) {
    const wu = u + (fbm(u * 7 + 11, v * 7) - 0.5) * 0.12, wv = v + (fbm(u * 7, v * 7 + 23) - 0.5) * 0.12;
    let best = null, bd = 1e9;
    for (const r of regs) { const dx = (wu - r.x) * asp, dy = wv - r.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = r; } }
    return best;
  }

  AA.paint = (canvas, opts) => {
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const g = canvas.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const regs = Object.entries(E.WD.REGIONS).map(([id, r]) => ({ id, ...r }));
    const asp = W / H;
    const S = Math.min(W, H) / 520; // escala dos símbolos

    // ---- base em baixa resolução (suavizada ao ampliar) ----
    const lw = Math.min(420, Math.round(W / 2.2)), lh = Math.round(lw * H / W);
    const off = document.createElement('canvas'); off.width = lw; off.height = lh;
    const F = new Float32Array(lw * lh);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) F[y * lw + x] = field(regs, x / lw, y / lh, asp);
    const owner = new Array(lw * lh);
    const SEA = new Float32Array(lw * lh * 3), LAND = new Float32Array(lw * lh * 3);
    for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
      const i = y * lw + x, u = x / lw, v = y / lh, f = F[i];
      // oceano: mais claro perto da costa, ondulação sutil
      const depth = Math.max(0, Math.min(1, (0.5 - f) / 0.45));
      const wave = noise(u * 60, v * 22) * 0.06;
      SEA[i * 3] = 24 + 60 * (1 - depth) + wave * 200; SEA[i * 3 + 1] = 58 + 90 * (1 - depth) + wave * 200; SEA[i * 3 + 2] = 98 + 80 * (1 - depth) + wave * 160;
      const r = nearest(regs, u, v, asp); if (f >= 0.5) owner[i] = r.id;
      let c = GROUND[r.biome].slice();
      const fx = x < lw - 1 ? F[i + 1] - f : 0, fy = y < lh - 1 ? F[i + lw] - f : 0;
      const sh = Math.max(-0.35, Math.min(0.35, (-fx - fy) * 9));
      const tex = (fbm(u * 26, v * 26) - 0.5) * 0.28;
      if (r.biome === 'mountain' && f > 0.95) c = [236, 240, 246];
      const k = 1 + sh + tex;
      LAND[i * 3] = c[0] * k; LAND[i * 3 + 1] = c[1] * k; LAND[i * 3 + 2] = c[2] * k;
    }
    // composição em resolução cheia com interpolação bilinear → costas suaves
    const HW = Math.round(W), HH = Math.round(H);
    const img = g.createImageData(HW, HH), D = img.data;
    for (let Y = 0; Y < HH; Y++) {
      const fy = Math.min(lh - 1.001, Math.max(0, Y / HH * lh - 0.5)), y0 = fy | 0, ty = fy - y0;
      for (let X = 0; X < HW; X++) {
        const fx = Math.min(lw - 1.001, Math.max(0, X / HW * lw - 0.5)), x0 = fx | 0, tx = fx - x0;
        const i00 = y0 * lw + x0, i10 = i00 + 1, i01 = i00 + lw, i11 = i01 + 1;
        const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
        const f = F[i00] * w00 + F[i10] * w10 + F[i01] * w01 + F[i11] * w11;
        const src = f >= 0.5 ? LAND : SEA;
        let r = src[i00 * 3] * w00 + src[i10 * 3] * w10 + src[i01 * 3] * w01 + src[i11 * 3] * w11;
        let gg = src[i00 * 3 + 1] * w00 + src[i10 * 3 + 1] * w10 + src[i01 * 3 + 1] * w01 + src[i11 * 3 + 1] * w11;
        let b = src[i00 * 3 + 2] * w00 + src[i10 * 3 + 2] * w10 + src[i01 * 3 + 2] * w01 + src[i11 * 3 + 2] * w11;
        if (f >= 0.5 && f < 0.535) { const t = (f - 0.5) / 0.035; r = 232 * (1 - t * 0.3) + r * t * 0.3; gg = 214 * (1 - t * 0.3) + gg * t * 0.3; b = 160 * (1 - t * 0.3) + b * t * 0.3; } // praia
        if (f >= 0.5 && f < 0.506) { r *= 0.55; gg *= 0.5; b *= 0.45; } // contorno
        else if (f < 0.5 && f > 0.47) { r += 60; gg += 60; b += 45; } // espuma
        else if (f < 0.44 && f > 0.425) { r += 22; gg += 26; b += 22; } // segunda linha de espuma
        const o = (Y * HW + X) * 4; D[o] = r; D[o + 1] = gg; D[o + 2] = b; D[o + 3] = 255;
      }
    }
    off.width = HW; off.height = HH; off.getContext('2d').putImageData(img, 0, 0);
    g.drawImage(off, 0, 0, W, H);
    const land = (u, v) => { const x = Math.min(lw - 1, Math.max(0, Math.floor(u * lw))), y = Math.min(lh - 1, Math.max(0, Math.floor(v * lh))); return F[y * lw + x] >= 0.5; };
    const own = (u, v) => { const x = Math.min(lw - 1, Math.max(0, Math.floor(u * lw))), y = Math.min(lh - 1, Math.max(0, Math.floor(v * lh))); return owner[y * lw + x]; };

    // ondas decorativas no mar
    const R = rng(7);
    g.strokeStyle = 'rgba(200,235,255,.35)'; g.lineWidth = 1.3 * S;
    for (let i = 0; i < 70; i++) {
      const u = R(), v = R(); if (land(u, v) || field(regs, u, v, asp) > 0.4) continue;
      const x = u * W, y = v * H, s = 7 * S;
      g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - s * 0.6, x, y); g.quadraticCurveTo(x + s / 2, y - s * 0.6, x + s, y); g.stroke();
    }

    // rios: do pico da montanha e do bosque até o mar
    const river = (sx, sy, seed) => {
      const r2 = rng(seed); let u = sx, v = sy, dir = r2() * Math.PI * 2;
      const pts = [[u, v]];
      for (let i = 0; i < 80 && land(u, v); i++) {
        // desce o campo (rumo à costa)
        const e = 0.01, f0 = field(regs, u, v, asp);
        const gx = field(regs, u + e, v, asp) - f0, gy = field(regs, u, v + e, asp) - f0;
        const want = Math.atan2(-gy, -gx * asp);
        dir += (want - dir) * 0.25 + (r2() - 0.5) * 0.5;
        u += Math.cos(dir) * 0.012 / asp; v += Math.sin(dir) * 0.012; pts.push([u, v]);
      }
      g.strokeStyle = 'rgba(90,170,230,.95)'; g.lineCap = 'round';
      for (let i = 1; i < pts.length; i++) { g.lineWidth = (1 + i / pts.length * 3) * S; g.beginPath(); g.moveTo(pts[i - 1][0] * W, pts[i - 1][1] * H); g.lineTo(pts[i][0] * W, pts[i][1] * H); g.stroke(); }
    };
    const RG = E.WD.REGIONS;
    river(RG.montanhas.x + 0.04, RG.montanhas.y - 0.07, 3);
    river(RG.bosque.x - 0.05, RG.bosque.y + 0.06, 11);
    river(RG.astrolabio.x - 0.06, RG.astrolabio.y + 0.08, 5);

    // estradas curvas entre vizinhos
    const roads = [];
    for (const r of regs) for (const n of r.neighbors) if (r.id < n) roads.push([r, RG[n], n]);
    for (const [a, b, bid] of roads) {
      const ax = a.x * W, ay = a.y * H, bx = b.x * W, by = b.y * H;
      const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
      const bend = (hash(ax, by) - 0.5) * 0.22 * L;
      const cx = mx - dy / L * bend, cy = my + dx / L * bend;
      const open = opts.canTravel(a.id) && opts.canTravel(bid);
      g.lineCap = 'round';
      g.globalAlpha = open ? 1 : 0.4;
      g.strokeStyle = 'rgba(50,34,18,.55)'; g.lineWidth = (open ? 4.5 : 3) * S; g.setLineDash([]);
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cx, cy, bx, by); g.stroke();
      g.strokeStyle = open ? 'rgba(255,226,160,.95)' : 'rgba(200,180,150,.55)'; g.lineWidth = 2.2 * S; g.setLineDash([7 * S, 6 * S]);
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(cx, cy, bx, by); g.stroke();
    }
    g.setLineDash([]); g.globalAlpha = 1;

    // símbolos de bioma espalhados
    const SYM = {
      forest(x, y, s) { g.fillStyle = '#2f6b3a'; g.beginPath(); g.moveTo(x, y - 12 * s); g.lineTo(x + 6 * s, y); g.lineTo(x - 6 * s, y); g.fill(); g.fillStyle = '#4c9a52'; g.beginPath(); g.moveTo(x, y - 12 * s); g.lineTo(x + 2 * s, y - 1 * s); g.lineTo(x - 6 * s, y); g.fill(); g.fillStyle = '#5a3a22'; g.fillRect(x - 1 * s, y, 2 * s, 3 * s); },
      mountain(x, y, s) { g.fillStyle = '#6f7884'; g.beginPath(); g.moveTo(x - 11 * s, y); g.lineTo(x, y - 15 * s); g.lineTo(x + 11 * s, y); g.fill(); g.fillStyle = '#8d97a3'; g.beginPath(); g.moveTo(x - 11 * s, y); g.lineTo(x, y - 15 * s); g.lineTo(x - 1 * s, y); g.fill(); g.fillStyle = '#f4f7fb'; g.beginPath(); g.moveTo(x - 4 * s, y - 9.5 * s); g.lineTo(x, y - 15 * s); g.lineTo(x + 4 * s, y - 9.5 * s); g.lineTo(x + 1 * s, y - 11 * s); g.fill(); },
      city(x, y, s) { g.fillStyle = '#efe4cc'; g.fillRect(x - 5 * s, y - 6 * s, 10 * s, 6 * s); g.fillStyle = '#c0533e'; g.beginPath(); g.moveTo(x - 6.5 * s, y - 6 * s); g.lineTo(x, y - 11 * s); g.lineTo(x + 6.5 * s, y - 6 * s); g.fill(); g.fillStyle = '#5b4632'; g.fillRect(x - 1 * s, y - 3.5 * s, 2 * s, 3.5 * s); },
      ruins(x, y, s) { g.fillStyle = '#ddd3bd'; g.fillRect(x - 6 * s, y - 10 * s, 3 * s, 10 * s); g.fillRect(x + 2 * s, y - 6 * s, 3 * s, 6 * s); g.fillRect(x - 7 * s, y - 11 * s, 5 * s, 1.6 * s); g.fillStyle = '#9c917a'; g.fillRect(x - 4 * s, y - 10 * s, 1 * s, 10 * s); },
      coast(x, y, s) { g.strokeStyle = '#7a5532'; g.lineWidth = 1.6 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2 * s, y - 6 * s, x + 1 * s, y - 11 * s); g.stroke(); g.fillStyle = '#3f9a5a'; for (const a of [-2.6, -1.9, -1.2, -0.5]) { g.beginPath(); g.ellipse(x + 1 * s + Math.cos(a) * 4 * s, y - 11 * s + Math.sin(a) * 2 * s + 1.5 * s, 4.5 * s, 1.4 * s, a + 1.57 * 0.0 + (a < -1.5 ? 0.4 : -0.4), 0, 7); g.fill(); } },
      metro(x, y, s) { for (const [ox, h2, c] of [[-5, 10, '#efe4cc'], [0, 15, '#e8d2b0'], [5, 8, '#d9b48a']]) { g.fillStyle = c; g.fillRect(x + ox * s - 2.2 * s, y - h2 * s, 4.4 * s, h2 * s); g.fillStyle = '#b8452a'; g.beginPath(); g.moveTo(x + ox * s - 2.8 * s, y - h2 * s); g.lineTo(x + ox * s, y - h2 * s - 3 * s); g.lineTo(x + ox * s + 2.8 * s, y - h2 * s); g.fill(); } g.fillStyle = '#ffd36b'; g.fillRect(x - 0.5 * s, y - 19 * s, 1 * s, 3 * s); },
      market(x, y, s) { g.fillStyle = '#c84f72'; g.beginPath(); g.moveTo(x - 7 * s, y); g.lineTo(x, y - 10 * s); g.lineTo(x + 7 * s, y); g.fill(); g.fillStyle = '#f6d9a0'; g.beginPath(); g.moveTo(x - 2.5 * s, y); g.lineTo(x, y - 10 * s); g.lineTo(x + 2.5 * s, y); g.fill(); g.fillStyle = '#ffd36b'; g.fillRect(x - 0.6 * s, y - 13 * s, 1.2 * s, 3 * s); },
      astral(x, y, s) { g.fillStyle = '#c9b8ff'; g.beginPath(); g.moveTo(x, y - 13 * s); g.lineTo(x + 3.5 * s, y - 4 * s); g.lineTo(x, y); g.lineTo(x - 3.5 * s, y - 4 * s); g.fill(); g.fillStyle = '#8a74e8'; g.beginPath(); g.moveTo(x, y - 13 * s); g.lineTo(x + 3.5 * s, y - 4 * s); g.lineTo(x, y); g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x + 6 * s, y - 12 * s, 1.1 * s, 0, 7); g.fill(); },
      garden(x, y, s) { for (const [ox, oy, col] of [[-4, -2, '#ff8fb8'], [3, -4, '#ffd36b'], [0, 1, '#ffffff']]) { g.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.arc(x + ox * s + Math.cos(a) * 1.8 * s, y + oy * s + Math.sin(a) * 1.8 * s, 1.4 * s, 0, 7); g.fill(); } g.fillStyle = '#e0912a'; g.beginPath(); g.arc(x + ox * s, y + oy * s, 1 * s, 0, 7); g.fill(); } },
      abyss(x, y, s) { g.fillStyle = '#2a1a3a'; g.beginPath(); g.moveTo(x - 6 * s, y); g.lineTo(x - 2 * s, y - 2 * s); g.lineTo(x + 1 * s, y + 1 * s); g.lineTo(x + 6 * s, y - 1 * s); g.lineTo(x + 2 * s, y + 2.5 * s); g.lineTo(x - 2 * s, y + 1 * s); g.fill(); g.fillStyle = '#b88aff'; g.beginPath(); g.moveTo(x + 3 * s, y - 1 * s); g.lineTo(x + 5 * s, y - 10 * s); g.lineTo(x + 6.5 * s, y - 1 * s); g.fill(); },
    };
    const R2 = rng(42), placed = [];
    for (let i = 0; i < 1400; i++) {
      const u = 0.03 + R2() * 0.94, v = 0.04 + R2() * 0.93;
      if (!land(u, v) || field(regs, u, v, asp) < 0.6) continue;
      const id = own(u, v); if (!id) continue;
      const r = RG[id];
      const pd = Math.hypot((u - r.x) * W, (v - r.y) * H); if (pd < 58 * S + 30) continue;
      if (placed.some(([px, py]) => Math.hypot(px - u * W, py - v * H) < 15 * S)) continue;
      placed.push([u * W, v * H, r.biome]);
      if (placed.length > 170) break;
    }
    placed.sort((a, b) => a[1] - b[1]);
    for (const [x, y, b] of placed) {
      const s = S * (0.85 + hash(x, y) * 0.4);
      g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y + 1 * s, 6 * s, 1.8 * s, 0, 0, 7); g.fill();
      SYM[b](x, y, s);
    }

    // navio e serpente marinha em mar aberto
    const findSea = (u0, v0) => { for (let k = 0; k < 30; k++) { const u = u0 + (hash(k, 3) - 0.5) * 0.2, v = v0 + (hash(k, 9) - 0.5) * 0.2; if (field(regs, u, v, asp) < 0.3) return [u * W, v * H]; } return null; };
    const ship = findSea(0.9, 0.12);
    if (ship) { const [x, y] = ship, s = S * 1.4; g.fillStyle = '#6b4024'; g.beginPath(); g.moveTo(x - 9 * s, y); g.lineTo(x + 9 * s, y); g.lineTo(x + 6 * s, y + 4 * s); g.lineTo(x - 6 * s, y + 4 * s); g.fill(); g.fillStyle = '#f6efe0'; g.beginPath(); g.moveTo(x, y - 14 * s); g.lineTo(x + 7 * s, y - 2 * s); g.lineTo(x, y - 2 * s); g.fill(); g.beginPath(); g.moveTo(x - 1 * s, y - 12 * s); g.lineTo(x - 6 * s, y - 2 * s); g.lineTo(x - 1 * s, y - 2 * s); g.fill(); g.fillStyle = '#c0533e'; g.fillRect(x - 0.5 * s, y - 17 * s, 4 * s, 2.4 * s); }
    const serp = findSea(0.1, 0.9) || findSea(0.08, 0.2);
    if (serp) { const [x, y] = serp, s = S * 1.3; g.strokeStyle = '#2f8f7a'; g.lineWidth = 3.2 * s; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + k * 9 * s, y, 4 * s, Math.PI, 0); g.stroke(); } g.fillStyle = '#2f8f7a'; g.beginPath(); g.ellipse(x + 29 * s, y - 3 * s, 4 * s, 2.6 * s, -0.4, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 30 * s, y - 4 * s, 0.9 * s, 0, 7); g.fill(); }

    // névoa sobre regiões ainda inalcançáveis
    for (const r of regs) {
      if (opts.canTravel(r.id)) continue;
      const x = r.x * W, y = r.y * H, rad = 70 * S + 20;
      for (let k = 0; k < 9; k++) {
        const a = k / 9 * Math.PI * 2, d = rad * 0.45 * hash(k, r.x * 9);
        const gr = g.createRadialGradient(x + Math.cos(a) * d, y + Math.sin(a) * d, 0, x + Math.cos(a) * d, y + Math.sin(a) * d, rad * 0.7);
        gr.addColorStop(0, 'rgba(215,222,240,.4)'); gr.addColorStop(1, 'rgba(225,230,245,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * 0.7, 0, 7); g.fill();
      }
    }

    // rosa dos ventos
    {
      const cx = 46 * S + 14, cy = H - 52 * S - 14, s = S * 1.25;
      g.save(); g.translate(cx, cy);
      g.strokeStyle = 'rgba(255,231,168,.8)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 26 * s, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 22 * s, 0, 7); g.stroke();
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, L = (k % 2 ? 18 : 32) * s, w = (k % 2 ? 3.5 : 5.5) * s;
        g.save(); g.rotate(a);
        g.fillStyle = '#f6e3b0'; g.beginPath(); g.moveTo(0, -L); g.lineTo(w, 0); g.lineTo(0, 0); g.fill();
        g.fillStyle = '#b0874a'; g.beginPath(); g.moveTo(0, -L); g.lineTo(-w, 0); g.lineTo(0, 0); g.fill();
        g.restore();
      }
      g.fillStyle = '#fff7df'; g.font = `900 ${11 * s}px serif`; g.textAlign = 'center'; g.fillText('N', 0, -35 * s);
      g.restore();
    }
    // cartela do título
    {
      const s = S, x = 18, y = 16;
      g.save();
      g.font = `700 ${22 * s + 6}px "Cinzel", "Georgia", serif`;
      const tw0 = g.measureText('Elarion').width;
      g.font = `700 ${7 * s + 5}px sans-serif`; const tw = Math.max(tw0, g.measureText('O CONTINENTE DAS CRÔNICAS').width);
      g.font = `700 ${22 * s + 6}px "Cinzel", "Georgia", serif`;
      g.fillStyle = 'rgba(244,232,204,.92)'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 2;
      const bw = tw + 34, bh = 30 * s + 18;
      g.beginPath(); g.roundRect ? g.roundRect(x, y, bw, bh, 10) : g.rect(x, y, bw, bh); g.fill(); g.stroke();
      g.fillStyle = '#5a3a1e'; g.textBaseline = 'middle'; g.fillText('Elarion', x + 17, y + bh / 2 - 4 * s);
      g.font = `700 ${7 * s + 5}px sans-serif`; g.fillStyle = '#8a6a3a'; g.fillText('O CONTINENTE DAS CRÔNICAS', x + 17, y + bh - 9 * s);
      g.restore();
    }
    // moldura/vinheta
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,14,30,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  };

  E.AA = AA;
})();
