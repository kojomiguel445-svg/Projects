/* Bestiário ilustrado: monstros pintados com Canvas 2D (gradientes, volumes, brilhos) em baixa resolução
   e depois "pixelizados" (borda dura + contorno escuro) para combinar com o estilo do jogo.
   Quadrúpedes olham para a direita; humanoides ficam de frente. */
(() => {
  const SP = E.SP, sh = (c, a) => SP.shade(c, a), mix = (a, b, t) => SP.mix(a, b, t);
  const MS = {};

  // ------------------------------------------------------------ kit de pintura
  const K = {
    // elipse com volume (luz no alto à esquerda)
    blob(g, cx, cy, rx, ry, col, o = {}) {
      g.save(); g.translate(cx, cy); g.rotate(o.rot || 0);
      const gr = g.createRadialGradient(-rx * 0.35, -ry * 0.45, Math.min(rx, ry) * 0.1, 0, 0, Math.max(rx, ry) * 1.05);
      gr.addColorStop(0, sh(col, o.light ?? 0.3)); gr.addColorStop(0.55, col); gr.addColorStop(1, sh(col, -(o.dark ?? 0.42)));
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
    },
    // polígono/curva com gradiente vertical
    shape(g, pts, col, o = {}) {
      const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const xs = pts.map((p) => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
      const gr = o.horiz ? g.createLinearGradient(x0, 0, x1, 0) : g.createLinearGradient(0, y0, 0, y1 + 0.01);
      gr.addColorStop(0, sh(col, o.light ?? 0.25)); gr.addColorStop(0.5, col); gr.addColorStop(1, sh(col, -(o.dark ?? 0.4)));
      g.fillStyle = gr; g.beginPath();
      if (o.smooth) { // curva suave pelos pontos
        g.moveTo((pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2);
        for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      } else { pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); }
      g.closePath(); g.fill();
    },
    // membro/traço grosso com ponta arredondada
    limb(g, pts, w, col, o = {}) {
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      const path = (dx, dy) => { g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); };
      g.strokeStyle = sh(col, -(o.dark ?? 0.3)); g.lineWidth = w; path(0, 0); g.stroke();
      g.strokeStyle = col; g.lineWidth = Math.max(1, w * 0.7); path(-w * 0.1, -w * 0.06); g.stroke();
      if (o.hi !== false && w >= 6) { g.globalAlpha = 0.45; g.strokeStyle = sh(col, 0.28); g.lineWidth = Math.max(1, w * 0.18); path(-w * 0.24, -w * 0.16); g.stroke(); }
      g.restore();
    },
    line(g, pts, w, col) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); },
    curve(g, x0, y0, cx, cy, x1, y1, w, col) { g.save(); g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke(); g.restore(); },
    // olho: brilhante (monstros) ou com esclera
    eye(g, x, y, r, col, o = {}) {
      if (o.sclera) { g.fillStyle = '#f4efe6'; g.beginPath(); g.ellipse(x, y, r * 1.25, r, 0, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(x + (o.look || 0), y, r * 0.7, 0, 7); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x + (o.look || 0), y, r * 0.35, 0, 7); g.fill(); }
      else { g.fillStyle = sh(col, -0.3); g.beginPath(); g.ellipse(x, y, r * 1.2, r, 0, 0, 7); g.fill(); g.fillStyle = col; g.beginPath(); g.ellipse(x, y, r * 0.85, r * 0.75, 0, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff'; g.fillRect(Math.round(x - r * 0.45), Math.round(y - r * 0.55), Math.max(1, Math.round(r * 0.5)), Math.max(1, Math.round(r * 0.5)));
    },
    teeth(g, x0, y, x1, n, h, col = '#f4efe0', down = true) {
      g.fillStyle = col;
      const step = (x1 - x0) / n;
      for (let i = 0; i < n; i++) { const x = x0 + i * step; g.beginPath(); g.moveTo(x, y); g.lineTo(x + step, y); g.lineTo(x + step / 2, y + (down ? h : -h)); g.closePath(); g.fill(); }
    },
    // pelos/penas/escamas: tracinhos
    strokes(g, cx, cy, rx, ry, col, n, len, seed = 1, ang = -0.6) {
      g.save(); g.strokeStyle = col; g.lineWidth = 1; g.lineCap = 'round';
      let s = seed * 9301;
      const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < n; i++) {
        const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd());
        const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); g.stroke();
      }
      g.restore();
    },
    dots(g, pts, r, col) { g.fillStyle = col; for (const [x, y] of pts) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } },
    flame(g, x, y, w, h, c1 = '#ff6a3c', c2 = '#ffd36b', lean = 0) {
      const gr = g.createLinearGradient(0, y, 0, y - h);
      gr.addColorStop(0, c1); gr.addColorStop(0.6, mix(c1, c2, 0.6)); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x - w * 0.6, y - h * 0.5, x + lean, y - h); g.quadraticCurveTo(x + w * 0.6, y - h * 0.5, x + w / 2, y); g.closePath(); g.fill();
    },
    // asa membranosa (morcego/dragão): braço até o "pulso", dedos em leque e borda recortada
    wing(g, bx, by, span, h, col, dir = -1, ribs = 4) {
      const X = (f) => bx + dir * span * f, Y = (f) => by + h * f;
      const wrist = [X(0.45), Y(-0.95)], tip = [X(1), Y(-1.05)];
      const ends = [];
      for (let i = 1; i <= ribs; i++) { const t = i / ribs; ends.push([X(1 - 0.85 * t), Y(-0.5 + 0.92 * t)]); }
      g.save();
      const gr = g.createRadialGradient(wrist[0], wrist[1], 1, wrist[0], wrist[1], Math.max(span, h));
      gr.addColorStop(0, sh(col, 0.25)); gr.addColorStop(0.6, col); gr.addColorStop(1, sh(col, -0.35));
      g.fillStyle = gr; g.beginPath(); g.moveTo(bx, by); g.lineTo(wrist[0], wrist[1]); g.lineTo(tip[0], tip[1]);
      let prev = tip;
      for (const e of ends) { const mx = (prev[0] + e[0]) / 2, my = (prev[1] + e[1]) / 2; g.quadraticCurveTo(mx + (wrist[0] - mx) * 0.3, my + (wrist[1] - my) * 0.3, e[0], e[1]); prev = e; }
      g.closePath(); g.fill(); g.restore();
      const bone = sh(col, -0.45);
      for (const e of [tip, ...ends.slice(0, -1)]) K.line(g, [wrist, e], 1.3, bone);
      K.limb(g, [[bx, by], wrist], 3.2, sh(col, -0.2), { hi: false });
      K.line(g, [wrist, [wrist[0] - dir * 1.5, wrist[1] - 3]], 1.4, '#e8e0d0');
    },
    // asa com penas: leque de rêmiges + coberteiras
    featherWing(g, bx, by, span, h, col, dir = -1) {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const ang = -Math.PI / 2 + dir * (0.25 + t * 1.05);
        const L = span * (1.0 - t * 0.38) * (0.55 + 0.45 * Math.min(1, h / span));
        const ox = bx + dir * t * span * 0.12, oy = by - t * h * 0.05;
        K.blob(g, ox + Math.cos(ang) * L / 2, oy + Math.sin(ang) * L / 2, L / 2, 2.4 + t * 0.8, sh(col, -0.28 + t * 0.22), { rot: ang, light: 0.25, dark: 0.45 });
        K.line(g, [[ox + Math.cos(ang) * 3, oy + Math.sin(ang) * 3], [ox + Math.cos(ang) * L * 0.9, oy + Math.sin(ang) * L * 0.9]], 0.8, sh(col, -0.5));
      }
      const ca = -Math.PI / 2 + dir * 0.7;
      K.blob(g, bx + Math.cos(ca) * span * 0.22, by + Math.sin(ca) * span * 0.22, span * 0.26, h * 0.2 + 2, sh(col, 0.1), { rot: ca });
      for (let i = 0; i < 3; i++) K.curve(g, bx + dir * (2 + i * 4), by - 4 - i * 3, bx + dir * (6 + i * 4), by - 1 - i * 3, bx + dir * (10 + i * 4), by - 5 - i * 3, 0.8, sh(col, -0.3));
    },
    // chifre curvo: sai para o lado e sobe (curl controla o quanto sobe/enrola)
    horn(g, x, y, len, curl, w, col, dir = 1) {
      g.save(); g.lineCap = 'round';
      const c = Math.min(2.4, curl);
      const cx = x + dir * len * 0.95, cy = y + len * 0.05;
      const ex = x + dir * len * (1.0 - 0.3 * c), ey = y - len * (0.25 + 0.4 * c);
      const P = (t) => [(1 - t) * (1 - t) * x + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) * (1 - t) * y + 2 * (1 - t) * t * cy + t * t * ey];
      const N = 8;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N, a = P(t0), b = P(t1);
        g.strokeStyle = sh(col, -0.35 + (i % 2 ? 0.05 : 0)); g.lineWidth = w * (1 - t0 * 0.8) + 1; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        g.strokeStyle = sh(col, 0.15 - t0 * 0.2); g.lineWidth = Math.max(0.8, w * (1 - t0 * 0.8) * 0.55); g.beginPath(); g.moveTo(a[0] - 0.4, a[1] - 0.4); g.lineTo(b[0] - 0.4, b[1] - 0.4); g.stroke();
      }
      g.restore();
    },
    mouth(g, x, y, w, h, teethN = 4) {
      g.fillStyle = '#2a0c10'; g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, 7); g.fill();
      g.fillStyle = '#b8343c'; g.beginPath(); g.ellipse(x, y + h * 0.22, w * 0.3, h * 0.2, 0, 0, 7); g.fill();
      K.teeth(g, x - w / 2 + 1, y - h / 2 + 0.5, x + w / 2 - 1, teethN, h * 0.35);
      K.teeth(g, x - w / 2 + 2, y + h / 2 - 0.5, x + w / 2 - 2, teethN - 1, h * 0.3, '#f4efe0', false);
    },
  };

  // ------------------------------------------------------------ pós-processo: silhueta limpa + contorno uniforme
  // Os bichos são pintados em alta resolução (RES×). Aqui a silhueta é endurecida, os pixels soltos e os
  // furinhos de 1 px (as "rebarbas") são removidos e o contorno é desenhado com espessura constante, sem pontilhado.
  const discCache = {};
  const disc = (r) => discCache[r] || (discCache[r] = (() => { const o = []; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const dd = x * x + y * y; if (dd && dd <= r * r + r * 0.6) o.push([x, y, dd]); } return o.sort((p, q) => p[2] - q[2]); })());
  function finalize(c, o = {}) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    const res = o.res || c._res || 1;
    const img = g.getImageData(0, 0, W, H), d = img.data;
    let a = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) {
      const al = d[i * 4 + 3];
      if (al >= 110) a[i] = 1; // getImageData já devolve cores não pré-multiplicadas
    }
    // limpeza morfológica: tira pontas e pixels soltos, fecha buracos minúsculos
    const solid = (m, x, y) => (x >= 0 && y >= 0 && x < W && y < H ? m[y * W + x] : 0);
    for (let pass = 0; pass < 2; pass++) {
      const b = a.slice();
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const n4 = solid(a, x + 1, y) + solid(a, x - 1, y) + solid(a, x, y + 1) + solid(a, x, y - 1);
        const n8 = n4 + solid(a, x + 1, y + 1) + solid(a, x - 1, y - 1) + solid(a, x - 1, y + 1) + solid(a, x + 1, y - 1);
        if (a[i] && (n8 <= 1 || (n4 <= 1 && n8 <= 2))) b[i] = 0;
        else if (!a[i] && n4 >= 3 && n8 >= 6) {
          b[i] = 1;
          let r = 0, gg = 0, bb = 0, n = 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (solid(a, x + dx, y + dy)) { const j = ((y + dy) * W + x + dx) * 4; r += d[j]; gg += d[j + 1]; bb += d[j + 2]; n++; }
          d[i * 4] = r / n; d[i * 4 + 1] = gg / n; d[i * 4 + 2] = bb / n;
        }
      }
      a = b;
    }
    // contorno de espessura constante (disco), cor = tom escuro do pixel sólido mais próximo
    const t = o.thick || (res >= 3 ? 2 : 1);
    const offs = disc(t);
    const OW = W + 2 * t, OH = H + 2 * t;
    const out = new ImageData(OW, OH), od = out.data;
    const oc = o.outline ? SP.hex2rgb(o.outline) : null;
    let sr = 0, sg = 0, sb = 0, sn = 0;
    for (let y = -t; y < H + t; y++) for (let x = -t; x < W + t; x++) {
      const k = ((y + t) * OW + (x + t)) * 4;
      if (solid(a, x, y)) {
        const i = (y * W + x) * 4;
        od[k] = d[i]; od[k + 1] = d[i + 1]; od[k + 2] = d[i + 2]; od[k + 3] = 255;
        continue;
      }
      for (const [dx, dy] of offs) {
        if (!solid(a, x + dx, y + dy)) continue;
        const n = ((y + dy) * W + (x + dx)) * 4;
        const col = oc || [d[n] * 0.2 + 8, d[n + 1] * 0.18 + 6, d[n + 2] * 0.24 + 12];
        od[k] = col[0]; od[k + 1] = col[1]; od[k + 2] = col[2]; od[k + 3] = 255;
        sr += col[0]; sg += col[1]; sb += col[2]; sn++;
        break;
      }
    }
    // pixels transparentes recebem a cor do contorno (alfa 0): a filtragem suave não cria halo claro
    if (sn) { sr /= sn; sg /= sn; sb /= sn; for (let k = 0; k < od.length; k += 4) if (!od[k + 3]) { od[k] = sr; od[k + 1] = sg; od[k + 2] = sb; } }
    const cv = document.createElement('canvas');
    if (o.crop) { // recorta o espaço vazio (o pé fica rente à base do sprite)
      let x0 = OW, y0 = OH, x1 = 0, y1 = 0;
      for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++) if (od[(y * OW + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const pad = 2;
      x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(OW - 1, x1 + pad); y1 = Math.min(OH - 1, y1 + 1);
      const tmp = document.createElement('canvas'); tmp.width = OW; tmp.height = OH; tmp.getContext('2d').putImageData(out, 0, 0);
      cv.width = x1 - x0 + 1; cv.height = y1 - y0 + 1;
      cv.getContext('2d').drawImage(tmp, -x0, -y0);
    } else { cv.width = OW; cv.height = OH; cv.getContext('2d').putImageData(out, 0, 0); }
    cv._res = res;
    return cv;
  }
  // todos os bichos são pintados em resolução triplicada: bordas lisas mesmo quando aparecem grandes na tela
  const RES = 3;
  let HI = RES;
  function paint(w, h, fn) {
    const c = document.createElement('canvas'); c.width = w * HI; c.height = h * HI;
    const g = c.getContext('2d');
    if (HI !== 1) g.scale(HI, HI);
    fn(g);
    c._res = HI;
    return finalize(c);
  }

  // ------------------------------------------------------------ criaturas
  // b = respiração (0/1): desloca o tronco/cabeça 1px
  MS.wolf = (P, o, b) => paint(76, 58, (g) => {
    const [c1, c2, c3] = P;
    const fire = o.fire, [fa, fb] = o.flame || ['#ff6a3c', '#ffe08a'];
    // cauda
    K.shape(g, [[16, 26], [4, 14 + b], [1, 22], [6, 30], [14, 33]], c1, { smooth: true });
    if (fire) K.flame(g, 4, 22, 8, 16, fa, fb, -3);
    // patas de trás (mais escuras, atrás)
    K.limb(g, [[22, 36], [18, 45], [21, 54]], 5, sh(c1, -0.25)); K.limb(g, [[44, 36], [46, 46], [44, 54]], 5, sh(c1, -0.25));
    // corpo
    K.blob(g, 32, 32 + b * 0.5, 21, 11, c1);
    K.blob(g, 31, 38 + b * 0.5, 15, 5, c3, { light: 0.15, dark: 0.2 }); // barriga
    K.strokes(g, 30, 25, 16, 4, sh(c1, -0.35), 26, 3, 3, -2.6);
    // peito e pescoço com juba
    K.blob(g, 50, 29 + b * 0.5, 10, 11, c1);
    K.strokes(g, 50, 34, 6, 6, c3, 14, 3, 5, 1.9);
    // patas da frente
    K.limb(g, [[28, 38], [26, 47], [28, 55]], 5.5, c1); K.limb(g, [[52, 37], [54, 47], [53, 55]], 5.5, c1);
    for (const x of [21, 28, 44, 53]) K.blob(g, x + 1, 54.5, 3.5, 2, sh(c2, -0.1));
    // cabeça
    const hy = 20 + b;
    K.blob(g, 59, hy, 10, 8.5, c1);
    K.shape(g, [[62, hy - 3], [75, hy + 2], [74, hy + 6], [63, hy + 7]], c1, { light: 0.15 }); // focinho
    K.shape(g, [[63, hy + 5], [74, hy + 6], [71, hy + 9], [64, hy + 9]], sh(c1, -0.3)); // mandíbula
    K.teeth(g, 64, hy + 6, 73, 4, 2.2);
    K.blob(g, 74, hy + 2.5, 1.8, 1.5, '#1a1418');
    // orelhas
    K.shape(g, [[52, hy - 5], [53, hy - 16], [58, hy - 7]], c1); K.shape(g, [[54, hy - 7], [54.5, hy - 13], [57, hy - 8]], c2);
    K.shape(g, [[58, hy - 6], [62, hy - 16], [64, hy - 6]], sh(c1, -0.15));
    K.eye(g, 63, hy - 2, 1.8, fire ? fb : '#ffe08a');
    K.strokes(g, 57, hy - 3, 5, 3, sh(c1, -0.3), 8, 2, 7, -2.4);
    if (fire) { K.flame(g, 50, 24, 9, 14, fa, fb, 3); K.flame(g, 44, 24, 7, 11, sh(fa, -0.15), fb, 2); K.flame(g, 36, 24, 6, 9, fa, fb, 1); K.blob(g, 63, hy - 2, 2.2, 1.8, fb); }
  });

  MS.spider = (P, o, b) => paint(86, 60, (g) => {
    const [c1, c2, c3] = P;
    const leg = (x, y, kx, ky, fx, fy, back) => { K.limb(g, [[x, y], [kx, ky], [fx, fy]], back ? 3 : 3.6, back ? sh(c1, -0.35) : c1); K.line(g, [[kx, ky], [kx, ky]], 4, sh(c1, 0.15)); };
    // pernas de trás
    for (let i = 0; i < 4; i++) leg(40 + i * 3, 30, 22 + i * 12 - 8, 8 + i * 2, 10 + i * 18, 57, true);
    // abdômen
    K.blob(g, 26, 26 + b, 20, 16, c1);
    K.shape(g, [[14, 20], [24, 16], [34, 20], [26, 26]], c2, { smooth: true });
    K.dots(g, [[18, 30], [26, 32], [34, 30]], 2, sh(c2, -0.1));
    K.strokes(g, 24, 28, 14, 10, sh(c1, -0.4), 30, 2, 2, -1.2);
    // cefalotórax
    K.blob(g, 54, 32, 13, 11, sh(c1, 0.08));
    // pernas da frente
    for (let i = 0; i < 4; i++) leg(56 + i * 2, 34, 54 + i * 9 + 6, 12 + i * 3, 50 + i * 10 + 12, 58);
    // quelíceras e olhos
    K.limb(g, [[62, 38], [66, 46], [63, 49]], 3, sh(c1, -0.2)); K.limb(g, [[58, 39], [60, 47], [57, 50]], 3, sh(c1, -0.2));
    K.dots(g, [[66, 47.5], [61, 49.5]], 1, '#f4efe0');
    for (const [x, y, r] of [[60, 28, 2.2], [65, 29, 2.2], [57, 31, 1.4], [68, 31, 1.4], [61, 33, 1.1], [65, 33, 1.1]]) K.eye(g, x, y + b * 0.5, r, c3);
  });

  MS.bear = (P, o, b) => paint(70, 72, (g) => {
    const [c1, c2, c3] = P;
    // de pé, rugindo
    K.limb(g, [[24, 50], [22, 62], [24, 70]], 10, sh(c1, -0.1)); K.limb(g, [[46, 50], [48, 62], [46, 70]], 10, sh(c1, -0.1));
    K.blob(g, 23, 69, 7, 3, sh(c2, -0.2)); K.blob(g, 47, 69, 7, 3, sh(c2, -0.2));
    K.blob(g, 35, 42 + b, 21, 20, c1);
    K.blob(g, 35, 47 + b, 12, 12, c3, { light: 0.15, dark: 0.25 });
    K.strokes(g, 35, 40, 18, 16, sh(c1, -0.35), 50, 3, 4, 1.3);
    // braços erguidos com garras
    K.limb(g, [[16, 34 + b], [7, 26], [6, 14]], 9, c1); K.limb(g, [[54, 34 + b], [63, 26], [64, 14]], 9, c1);
    for (const [x, d] of [[6, -1], [64, 1]]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2.5, 11], [x + i * 3 + d, 6]], 1.6, '#efe6d2');
    // cabeça
    const hy = 18 + b;
    K.blob(g, 25, hy - 8, 5, 5, c1); K.blob(g, 45, hy - 8, 5, 5, c1); K.blob(g, 25, hy - 8, 2.5, 2.5, c3);
    K.blob(g, 45, hy - 8, 2.5, 2.5, c3);
    K.blob(g, 35, hy, 13, 11, c1);
    K.blob(g, 35, hy + 5, 7, 6, c3, { light: 0.2 });
    K.mouth(g, 35, hy + 8, 9, 6, 4);
    K.blob(g, 35, hy + 2, 2.6, 2, '#1a1414');
    K.eye(g, 29.5, hy - 2, 1.6, '#2a1a10', {}); K.eye(g, 40.5, hy - 2, 1.6, '#2a1a10');
  });

  MS.owlbear = (P, o, b) => paint(72, 76, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[24, 54], [22, 66], [24, 74]], 10, sh(c1, -0.1)); K.limb(g, [[48, 54], [50, 66], [48, 74]], 10, sh(c1, -0.1));
    for (const x of [24, 48]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 3, 73], [x + i * 4, 76]], 1.6, '#3a2a1a');
    K.blob(g, 36, 45 + b, 22, 22, c1);
    // penas do peito em escamas
    for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - (r % 2); i++) K.blob(g, 27 + i * 6 + (r % 2) * 3, 40 + r * 6 + b, 3.6, 3, c2, { light: 0.25 });
    K.limb(g, [[15, 38 + b], [8, 50], [10, 60]], 9, c1); K.limb(g, [[57, 38 + b], [64, 50], [62, 60]], 9, c1);
    for (const [x, d] of [[10, -1], [62, 1]]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2.5, 61], [x + i * 3 + d, 66]], 1.8, '#f4efe0');
    const hy = 20 + b;
    // tufos
    K.shape(g, [[20, hy - 6], [16, hy - 18], [27, hy - 10]], c1); K.shape(g, [[52, hy - 6], [56, hy - 18], [45, hy - 10]], c1);
    K.blob(g, 36, hy, 17, 14, c1);
    // disco facial
    K.blob(g, 29, hy, 8, 8, c2, { light: 0.2, dark: 0.2 }); K.blob(g, 43, hy, 8, 8, c2, { light: 0.2, dark: 0.2 });
    K.eye(g, 29, hy, 3.4, '#ffb238', { sclera: false }); K.eye(g, 43, hy, 3.4, '#ffb238');
    K.dots(g, [[29, hy], [43, hy]], 1.4, '#1a1010');
    K.shape(g, [[33, hy + 4], [39, hy + 4], [36, hy + 12]], c3, { light: 0.35 });
    K.strokes(g, 36, hy - 8, 12, 4, sh(c1, -0.35), 16, 2, 5, -1.6);
  });

  MS.rat = (P, o, b) => paint(66, 44, (g) => {
    const [c1, c2, c3] = P;
    K.curve(g, 12, 28, 0, 30, 4, 12, 2.5, c2);
    K.limb(g, [[18, 30], [15, 37], [18, 42]], 4, sh(c1, -0.2)); K.limb(g, [[38, 31], [40, 38], [38, 42]], 4, sh(c1, -0.2));
    K.blob(g, 27, 26 + b * 0.5, 17, 11, c1);
    K.strokes(g, 25, 21, 13, 5, sh(c1, -0.35), 30, 3, 9, -2.8);
    K.blob(g, 26, 32, 11, 4, sh(c1, 0.25), { light: 0.1 });
    K.limb(g, [[42, 32], [44, 38], [46, 42]], 3.5, c1);
    const hy = 22 + b;
    K.shape(g, [[38, hy - 7], [56, hy - 1], [64, hy + 4], [56, hy + 7], [40, hy + 6]], c1, { smooth: true });
    K.blob(g, 63, hy + 3.5, 2, 1.8, c2);
    K.blob(g, 44, hy - 8, 6, 6, c2, { light: 0.25 }); K.blob(g, 44, hy - 8, 3.5, 3.5, sh(c2, -0.15));
    K.eye(g, 52, hy - 1, 1.6, '#ff3b3b');
    K.line(g, [[62, hy + 4], [66, hy + 1]], 0.8, '#e8e0d8'); K.line(g, [[62, hy + 5], [66, hy + 7]], 0.8, '#e8e0d8');
    K.teeth(g, 57, hy + 6, 61, 2, 2.5, '#f6e9a8');
  });

  MS.crab = (P, o, b) => paint(80, 58, (g) => {
    const [c1, c2, c3] = P;
    for (let i = 0; i < 3; i++) { K.limb(g, [[28 - i * 2, 40], [16 - i * 4, 44], [12 - i * 4, 56]], 3, sh(c1, -0.2)); K.limb(g, [[52 + i * 2, 40], [64 + i * 4, 44], [68 + i * 4, 56]], 3, sh(c1, -0.2)); }
    // garras
    for (const d of [-1, 1]) {
      const bx = 40 + d * 20;
      K.limb(g, [[40 + d * 10, 36], [bx + d * 4, 28], [bx + d * 8, 18]], 5, c1);
      K.blob(g, bx + d * 10, 14 + b, 9, 7, c1, { rot: d * -0.5 });
      K.shape(g, [[bx + d * 6, 10 + b], [bx + d * 20, 2 + b], [bx + d * 16, 10 + b]], sh(c1, 0.1));
      K.shape(g, [[bx + d * 8, 16 + b], [bx + d * 20, 16 + b], [bx + d * 12, 20 + b]], sh(c1, -0.15));
    }
    K.blob(g, 40, 36 + b * 0.5, 22, 13, c1);
    K.blob(g, 40, 42 + b * 0.5, 16, 5, c2, { light: 0.15, dark: 0.2 });
    K.dots(g, [[30, 31], [40, 29], [50, 31], [35, 35], [45, 35]], 1.4, sh(c1, 0.3));
    for (const x of [35, 45]) { K.limb(g, [[x, 26], [x, 18]], 2, c1); K.eye(g, x, 17 + b, 2.6, c3, { sclera: true }); }
    K.mouth(g, 40, 43, 8, 3, 3);
  });

  MS.shark = (P, o, b) => paint(90, 48, (g) => {
    const [c1, c2, c3] = P;
    K.shape(g, [[6, 14], [16, 24], [6, 36], [12, 24]], sh(c1, -0.15)); // cauda
    K.shape(g, [[12, 24], [40, 12 + b], [70, 16], [88, 26], [70, 34], [40, 36], [14, 28]], c1, { smooth: true });
    K.shape(g, [[30, 32], [56, 34], [80, 30], [70, 36], [40, 38]], c2, { light: 0.1, dark: 0.15, smooth: true });
    K.shape(g, [[42, 14 + b], [50, 0 + b], [56, 14]], sh(c1, -0.05));
    K.shape(g, [[46, 33], [52, 44], [58, 34]], sh(c1, -0.2));
    for (let i = 0; i < 3; i++) K.line(g, [[62 + i * 3, 22], [61 + i * 3, 30]], 1, sh(c1, -0.45));
    K.eye(g, 74, 22, 1.8, '#1a1a1a');
    K.shape(g, [[74, 29], [87, 27], [80, 33]], '#3a0e14');
    K.teeth(g, 75, 29, 86, 5, 2.4); K.teeth(g, 76, 32, 83, 3, 1.8, '#f4efe0', false);
  });

  MS.goblin = (P, o, b) => paint(52, 58, (g) => {
    const [c1, c2, c3] = P;
    const big = o.armor || o.gear === 'sword' && c1 !== '#6fae4b';
    K.limb(g, [[20, 42], [19, 52], [18, 56]], 6, c2); K.limb(g, [[32, 42], [33, 52], [34, 56]], 6, c2);
    K.blob(g, 18, 56, 4, 2, '#2a1f18'); K.blob(g, 34, 56, 4, 2, '#2a1f18');
    K.shape(g, [[15, 30 + b], [37, 30 + b], [39, 45], [13, 45]], c2, { smooth: false });
    K.shape(g, [[16, 31 + b], [36, 31 + b], [34, 38], [18, 38]], sh(c3, -0.2));
    K.line(g, [[14, 41], [38, 41]], 2, '#5a3a20'); K.blob(g, 26, 41, 2, 1.5, '#d4af37');
    // braços
    K.limb(g, [[14, 32 + b], [9, 40], [10, 46]], 4.5, c1); K.limb(g, [[38, 32 + b], [43, 39], [42, 44]], 4.5, c1);
    // arma
    if (o.gear === 'sword' || big) { K.limb(g, [[44, 44], [50, 20]], 2.6, '#dfe6ee'); K.line(g, [[40, 42], [47, 40]], 2, '#8a6a3a'); }
    else { K.limb(g, [[43, 44], [49, 26]], 3, '#8a5a32'); K.blob(g, 49, 25, 3.5, 3.5, '#6a4a2a'); }
    // cabeça com orelhas pontudas
    const hy = 19 + b;
    K.shape(g, [[13, hy], [0, hy - 8], [6, hy + 3]], c1); K.shape(g, [[39, hy], [52, hy - 8], [46, hy + 3]], c1);
    K.shape(g, [[11, hy - 2], [4, hy - 6], [8, hy + 1]], sh(c1, -0.25)); K.shape(g, [[41, hy - 2], [48, hy - 6], [44, hy + 1]], sh(c1, -0.25));
    K.blob(g, 26, hy, 13, 11, c1);
    K.blob(g, 26, hy + 3, 3, 3.5, sh(c1, -0.12));
    K.eye(g, 21, hy - 1, 2.2, '#ffd36b'); K.eye(g, 31, hy - 1, 2.2, '#ffd36b');
    K.line(g, [[17, hy - 5], [23, hy - 3]], 1.4, sh(c1, -0.5)); K.line(g, [[35, hy - 5], [29, hy - 3]], 1.4, sh(c1, -0.5));
    K.mouth(g, 26, hy + 7, 10, 3.5, 4);
    if (o.armor) { K.shape(g, [[14, hy - 6], [26, hy - 14], [38, hy - 6], [38, hy - 3], [14, hy - 3]], '#8c8c8c'); K.line(g, [[26, hy - 14], [26, hy - 3]], 1.5, '#5a5a5a'); }
  });

  MS.skeleton = (P, o, b) => paint(52, 64, (g) => {
    const [c1, c2, c3] = P;
    const bone = c1, dark = c2;
    // pernas
    K.limb(g, [[21, 40], [20, 52], [19, 62]], 3, bone); K.limb(g, [[31, 40], [32, 52], [33, 62]], 3, bone);
    K.blob(g, 20, 52, 2, 2, bone); K.blob(g, 32, 52, 2, 2, bone);
    K.blob(g, 26, 39, 8, 4, bone);
    // coluna e costelas
    K.line(g, [[26, 22 + b], [26, 38]], 3, sh(bone, -0.15));
    for (let i = 0; i < 4; i++) { const y = 24 + i * 3.2 + b; K.curve(g, 26, y, 15 + i, y + 2, 17 + i * 0.6, y + 4, 2, bone); K.curve(g, 26, y, 37 - i, y + 2, 35 - i * 0.6, y + 4, 2, bone); }
    // ombros e braços
    K.line(g, [[15, 23 + b], [37, 23 + b]], 2.5, bone);
    K.limb(g, [[15, 23 + b], [11, 33], [12, 42]], 2.6, bone); K.limb(g, [[37, 23 + b], [41, 32], [40, 40]], 2.6, bone);
    // armadura (inumano)
    if (o.armor) { K.shape(g, [[13, 21 + b], [39, 21 + b], [37, 36], [15, 36]], dark); K.shape(g, [[11, 20 + b], [18, 18 + b], [18, 26], [11, 26]], sh(dark, 0.2)); K.shape(g, [[34, 18 + b], [41, 20 + b], [41, 26], [34, 26]], sh(dark, 0.2)); K.line(g, [[26, 22], [26, 35]], 1, c3); }
    // espada
    K.limb(g, [[40, 40], [47, 14]], 2.6, '#c9d1d9'); K.line(g, [[37, 38], [44, 39]], 2.2, '#6a5a3a');
    // crânio
    const hy = 13 + b;
    K.blob(g, 26, hy, 9, 9, bone);
    K.shape(g, [[20, hy + 4], [32, hy + 4], [30, hy + 10], [22, hy + 10]], bone);
    for (let i = 0; i < 4; i++) K.line(g, [[22.5 + i * 2.3, hy + 6], [22.5 + i * 2.3, hy + 9]], 0.8, sh(bone, -0.5));
    K.blob(g, 22, hy, 3.2, 3.6, '#120e14', { light: 0, dark: 0 }); K.blob(g, 30, hy, 3.2, 3.6, '#120e14', { light: 0, dark: 0 });
    K.eye(g, 22, hy + 0.5, 1.4, c3); K.eye(g, 30, hy + 0.5, 1.4, c3);
    K.shape(g, [[25, hy + 3], [27, hy + 3], [26, hy + 5.5]], '#120e14');
    if (o.armor) { K.shape(g, [[16, hy - 2], [26, hy - 11], [36, hy - 2], [34, hy - 6], [26, hy - 8], [18, hy - 6]], dark); K.horn(g, 18, hy - 5, 8, 1.2, 2.5, '#2a2a34', -1); K.horn(g, 34, hy - 5, 8, 1.2, 2.5, '#2a2a34', 1); }
  });

  MS.zombie = (P, o, b) => paint(54, 62, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[21, 42], [19, 52], [18, 60]], 5.5, sh(c2, -0.1)); K.limb(g, [[32, 42], [34, 52], [36, 60]], 5.5, sh(c2, -0.1));
    K.shape(g, [[14, 26 + b], [38, 26 + b], [40, 44], [35, 42], [32, 46], [27, 43], [22, 46], [18, 42], [12, 44]], c2);
    K.blob(g, 22, 34, 3, 4, c1); K.line(g, [[30, 30], [34, 38]], 1, sh(c2, -0.5));
    // braços estendidos para a frente
    K.limb(g, [[15, 29 + b], [6, 30], [1, 31]], 5, c1); K.limb(g, [[37, 29 + b], [46, 28], [52, 29]], 5, c1);
    K.dots(g, [[1, 30], [52, 28]], 2, sh(c1, -0.2));
    const hy = 16 + b;
    K.blob(g, 26, hy, 10, 10, c1, { rot: 0.2 });
    K.shape(g, [[17, hy - 6], [24, hy - 11], [34, hy - 8], [35, hy - 4], [17, hy - 3]], '#3a3428');
    K.eye(g, 22, hy, 2.2, c3); K.blob(g, 31, hy, 2.6, 2.6, '#1a1418');
    K.mouth(g, 26, hy + 6, 8, 3, 3);
    K.blob(g, 31, hy + 3, 2, 1.5, sh(c1, -0.35));
  });

  MS.ghoul = (P, o, b) => paint(56, 60, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[22, 40], [16, 50], [18, 58]], 4.5, sh(c1, -0.15)); K.limb(g, [[33, 40], [38, 50], [36, 58]], 4.5, sh(c1, -0.15));
    K.shape(g, [[14, 24 + b], [40, 22 + b], [38, 42], [16, 42]], c1, { smooth: true });
    for (let i = 0; i < 4; i++) K.curve(g, 18, 28 + i * 3.5 + b, 27, 30 + i * 3.5 + b, 36, 28 + i * 3.5 + b, 1, sh(c1, -0.35));
    K.shape(g, [[15, 38], [39, 38], [41, 46], [13, 46]], c2);
    // braços longos com garras
    K.limb(g, [[15, 26 + b], [6, 38], [4, 50]], 4, c1); K.limb(g, [[39, 25 + b], [48, 36], [50, 48]], 4, c1);
    for (const [x, d] of [[4, -1], [50, 1]]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2, 50], [x + i * 2.4 + d * 2, 56]], 1.2, '#efe6d2');
    const hy = 16 + b;
    K.blob(g, 27, hy, 10, 9, c1);
    K.blob(g, 22, hy - 1, 3, 3, '#1a1014', { light: 0, dark: 0 }); K.blob(g, 32, hy - 1, 3, 3, '#1a1014', { light: 0, dark: 0 });
    K.eye(g, 22, hy - 1, 1.6, c3); K.eye(g, 32, hy - 1, 1.6, c3);
    K.mouth(g, 27, hy + 5, 11, 5, 5);
  });

  MS.ghost = (P, o, b) => paint(60, 72, (g) => {
    const [c1, c2, c3] = P;
    // rastro esfarrapado
    const pts = [[12, 30], [30, 6 + b], [48, 30], [52, 54], [46, 66], [41, 58], [36, 70], [30, 60], [24, 71], [19, 58], [13, 68], [8, 52]];
    K.shape(g, pts, c1, { light: 0.35, dark: 0.15, smooth: true });
    K.shape(g, [[18, 34], [30, 26], [42, 34], [40, 56], [20, 56]], sh(c1, 0.12), { smooth: true });
    // braços espectrais
    K.limb(g, [[14, 34], [4, 44], [2, 54]], 4, c2); K.limb(g, [[46, 34], [56, 42], [58, 50]], 4, c2);
    for (const [x, d] of [[2, -1], [58, 1]]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2, 54 - (d > 0 ? 4 : 0)], [x + i * 2.5 + d, 59 - (d > 0 ? 4 : 0)]], 1.2, sh(c2, 0.3));
    // capuz
    K.blob(g, 30, 22 + b, 13, 13, c2);
    K.blob(g, 30, 25 + b, 9, 9, '#07060c', { light: 0.05, dark: 0 });
    K.eye(g, 26, 25 + b, 2.2, c3); K.eye(g, 34, 25 + b, 2.2, c3);
    K.strokes(g, 30, 50, 14, 12, sh(c1, 0.25), 18, 4, 3, 1.5);
  });

  MS.harpy = (P, o, b) => paint(80, 68, (g) => {
    const [c1, c2, c3] = P;
    // asas no lugar dos braços
    K.featherWing(g, 30, 30 + b, 34, 30, c1, -1); K.featherWing(g, 50, 30 + b, 34, 30, sh(c1, -0.08), 1);
    // pernas de ave
    K.limb(g, [[35, 48], [32, 58], [34, 65]], 3.4, '#c9a24a'); K.limb(g, [[45, 48], [48, 58], [46, 65]], 3.4, '#c9a24a');
    for (const x of [34, 46]) for (let i = -1; i <= 1; i++) K.line(g, [[x, 65], [x + i * 3.5, 67.5]], 1.4, '#2a1a10');
    // saia de penas
    K.shape(g, [[30, 40], [50, 40], [54, 52], [47, 49], [40, 54], [33, 49], [26, 52]], c1, { smooth: false });
    K.strokes(g, 40, 46, 10, 4, sh(c1, -0.35), 12, 3, 4, 1.5);
    // tronco
    K.shape(g, [[33, 27 + b], [47, 27 + b], [48, 42], [32, 42]], c2, { smooth: true });
    K.shape(g, [[32, 31 + b], [48, 31 + b], [47, 36 + b], [33, 36 + b]], sh(c1, 0.1));
    const hy = 18 + b;
    // cabelo selvagem
    K.shape(g, [[28, hy], [32, hy - 11], [40, hy - 14], [48, hy - 11], [52, hy], [55, hy + 14], [48, hy + 8], [32, hy + 8], [25, hy + 14]], c3, { smooth: true });
    K.blob(g, 40, hy, 7.5, 8.5, c2);
    K.shape(g, [[33, hy - 4], [40, hy - 9], [47, hy - 4], [45, hy - 6], [35, hy - 6]], c3);
    K.eye(g, 37, hy, 1.7, '#ffd36b'); K.eye(g, 43, hy, 1.7, '#ffd36b');
    K.line(g, [[34.5, hy - 3], [38.5, hy - 2]], 1, sh(c3, -0.3)); K.line(g, [[45.5, hy - 3], [41.5, hy - 2]], 1, sh(c3, -0.3));
    K.mouth(g, 40, hy + 5, 5, 2.2, 3);
  });

  MS.fishman = (P, o, b) => paint(66, 74, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[24, 52], [21, 64], [18, 72]], 7, sh(c1, -0.15)); K.limb(g, [[40, 52], [43, 64], [46, 72]], 7, sh(c1, -0.15));
    K.shape(g, [[14, 72], [22, 70], [22, 74], [12, 74]], c3); K.shape(g, [[44, 70], [52, 72], [54, 74], [44, 74]], c3);
    K.blob(g, 32, 42 + b, 19, 18, c1);
    K.blob(g, 32, 47 + b, 12, 12, c2, { light: 0.2 });
    for (let r = 0; r < 4; r++) K.curve(g, 22, 40 + r * 4 + b, 32, 43 + r * 4 + b, 42, 40 + r * 4 + b, 1, sh(c2, -0.25));
    K.strokes(g, 30, 34, 16, 8, sh(c1, -0.3), 20, 2, 3, 0.5);
    K.limb(g, [[14, 36 + b], [7, 46], [9, 56]], 6, c1); K.limb(g, [[50, 36 + b], [56, 44], [56, 52]], 6, c1);
    K.limb(g, [[58, 72], [58, 6]], 2.4, '#8a8f99');
    for (const dx of [-4, 0, 4]) K.line(g, [[58 + dx, 10], [58 + dx, 2]], 1.6, '#c9d1d9');
    K.line(g, [[54, 10], [62, 10]], 1.6, '#c9d1d9');
    const hy = 20 + b;
    K.shape(g, [[16, hy - 2], [24, hy - 14], [32, hy - 6], [40, hy - 14], [48, hy - 2]], c3, { smooth: false });
    K.blob(g, 32, hy, 14, 12, c1);
    K.eye(g, 25, hy - 1, 3, '#ffd36b', { sclera: false }); K.eye(g, 39, hy - 1, 3, '#ffd36b');
    K.mouth(g, 32, hy + 7, 14, 4, 6);
    K.shape(g, [[17, hy + 2], [10, hy - 2], [14, hy + 7]], c3); K.shape(g, [[47, hy + 2], [54, hy - 2], [50, hy + 7]], c3);
  });

  MS.hag = (P, o, b) => paint(56, 68, (g) => {
    const [c1, c2, c3] = P;
    K.shape(g, [[12, 30 + b], [44, 30 + b], [50, 66], [6, 66]], c2, { smooth: false });
    for (let i = 0; i < 6; i++) K.line(g, [[10 + i * 7, 52 + (i % 2) * 3], [9 + i * 7, 66]], 1.5, sh(c2, -0.35));
    K.limb(g, [[13, 34 + b], [6, 44], [4, 52]], 4, c1); K.limb(g, [[43, 34 + b], [50, 42], [50, 50]], 4, c1);
    for (const [x, d] of [[4, -1], [50, 1]]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2, 52 - (d > 0 ? 2 : 0)], [x + i * 2.5 + d, 58 - (d > 0 ? 2 : 0)]], 1.3, '#2a2a20');
    const hy = 20 + b;
    // cabelo de algas
    K.shape(g, [[12, hy - 6], [28, hy - 14], [44, hy - 6], [48, hy + 22], [40, hy + 12], [16, hy + 12], [8, hy + 22]], sh(c3, -0.45), { smooth: true });
    K.blob(g, 28, hy, 10, 11, c1);
    K.shape(g, [[27, hy - 1], [30, hy - 1], [31, hy + 8], [28, hy + 9]], sh(c1, -0.1)); // nariz
    K.dots(g, [[31, hy + 6]], 1, sh(c1, -0.4));
    K.eye(g, 23, hy - 2, 2, c3); K.eye(g, 34, hy - 2, 2, c3);
    K.mouth(g, 28, hy + 8, 9, 3, 3);
    K.strokes(g, 28, hy - 6, 14, 4, sh(c3, -0.2), 12, 4, 2, 1.4);
  });

  MS.brute = (P, o, b) => paint(74, 84, (g) => {
    const [c1, c2, c3] = P;
    const troll = c1 === '#5f8a5a';
    K.limb(g, [[26, 60], [24, 72], [24, 82]], 11, c1); K.limb(g, [[48, 60], [50, 72], [50, 82]], 11, c1);
    K.blob(g, 24, 81, 8, 3, sh(c1, -0.3)); K.blob(g, 50, 81, 8, 3, sh(c1, -0.3));
    K.blob(g, 37, 46 + b, 26, 24, c1);
    K.blob(g, 37, 54 + b, 17, 13, c3, { light: 0.15, dark: 0.3 });
    K.shape(g, [[14, 58], [60, 58], [56, 70], [44, 66], [37, 72], [30, 66], [18, 70]], c2);
    K.line(g, [[14, 58], [60, 58]], 3, sh(c2, -0.3));
    K.dots(g, [[37, 58]], 2.5, '#d4af37');
    if (troll) K.strokes(g, 37, 36, 20, 10, sh(c1, -0.35), 30, 3, 6, 1.2);
    // braços enormes + clava
    K.limb(g, [[12, 38 + b], [4, 52], [6, 64]], 11, c1); K.limb(g, [[62, 38 + b], [68, 50], [66, 60]], 11, c1);
    K.limb(g, [[66, 62], [70, 14]], 6, '#7a5232');
    K.blob(g, 70, 14, 7, 10, '#6a4a2a'); K.dots(g, [[66, 10], [74, 14], [69, 20], [72, 6]], 1.6, '#c9c9c9');
    const hy = 20 + b;
    K.blob(g, 37, hy, 13, 12, c1);
    K.shape(g, [[24, hy - 4], [50, hy - 4], [48, hy - 1], [26, hy - 1]], sh(c1, -0.35)); // sobrancelha
    K.eye(g, 31, hy, 2, '#ffd36b'); K.eye(g, 43, hy, 2, '#ffd36b');
    if (troll) K.shape(g, [[35, hy], [40, hy], [44, hy + 10], [36, hy + 8]], sh(c1, 0.05));
    else K.blob(g, 37, hy + 3, 3.5, 3, sh(c1, -0.15));
    K.mouth(g, 37, hy + 8, 12, 4, 4);
    K.line(g, [[31, hy + 8], [30, hy + 4]], 2, '#f4efe0'); K.line(g, [[43, hy + 8], [44, hy + 4]], 2, '#f4efe0');
    K.blob(g, 23, hy - 1, 3, 4, c1); K.blob(g, 51, hy - 1, 3, 4, c1);
    if (!troll) K.strokes(g, 37, hy - 10, 8, 2, '#3a2a1a', 10, 3, 4, -1.6);
  });

  MS.griffon = (P, o, b) => paint(86, 68, (g) => {
    const [c1, c2, c3] = P;
    K.curve(g, 20, 38, 6, 30, 8, 18, 3, c1); K.blob(g, 8, 18, 3.5, 4, sh(c1, -0.3));
    K.featherWing(g, 40, 30 + b, 34, 30, sh(c1, -0.12), -1);
    K.limb(g, [[24, 44], [20, 56], [22, 66]], 6, sh(c1, -0.2)); K.limb(g, [[54, 44], [56, 56], [54, 66]], 5, sh(c2, -0.2));
    K.blob(g, 38, 40 + b * 0.5, 22, 13, c1);
    K.strokes(g, 36, 36, 18, 7, sh(c1, -0.35), 22, 3, 2, -2.5);
    K.blob(g, 58, 34 + b * 0.5, 12, 14, c2);
    for (let i = 0; i < 4; i++) K.curve(g, 52, 32 + i * 4 + b, 58, 35 + i * 4 + b, 64, 32 + i * 4 + b, 1, sh(c2, -0.2));
    K.limb(g, [[60, 44], [64, 54], [62, 64]], 4.5, '#c9a24a');
    for (const x of [22, 54, 62]) for (let i = -1; i <= 1; i++) K.line(g, [[x, 65], [x + i * 3, 67]], 1.2, '#2a1a10');
    K.featherWing(g, 50, 26 + b, 30, 28, c1, -1);
    const hy = 18 + b;
    K.blob(g, 66, hy, 10, 9, c2);
    K.shape(g, [[72, hy - 4], [84, hy + 1], [80, hy + 8], [73, hy + 4]], c3 === '#6b4a2a' ? '#e8b73a' : c3, { light: 0.35 });
    K.line(g, [[74, hy + 3], [81, hy + 5]], 0.8, '#5a3a10');
    K.eye(g, 69, hy - 2, 1.8, '#ffb238');
    K.shape(g, [[58, hy - 6], [56, hy - 14], [63, hy - 8]], c2);
  });

  MS.gargoyle = (P, o, b) => paint(70, 68, (g) => {
    const [c1, c2, c3] = P;
    K.wing(g, 22, 30 + b, 24, 28, mix(c1, c3, 0.12), -1, 4); K.wing(g, 48, 30 + b, 24, 28, mix(c1, c3, 0.12), 1, 4);
    K.limb(g, [[26, 50], [20, 58], [24, 66]], 7, sh(c1, -0.15)); K.limb(g, [[44, 50], [50, 58], [46, 66]], 7, sh(c1, -0.15));
    K.blob(g, 35, 42 + b, 15, 15, c1);
    K.strokes(g, 35, 42, 12, 12, sh(c1, -0.3), 14, 3, 8, 0.8);
    K.limb(g, [[22, 36 + b], [16, 46], [18, 56]], 6, c1); K.limb(g, [[48, 36 + b], [54, 46], [52, 56]], 6, c1);
    for (const x of [18, 52, 24, 46]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2, x === 24 || x === 46 ? 66 : 56], [x + i * 2.5, (x === 24 || x === 46 ? 66 : 56) + 3]], 1.3, '#1a1a1e');
    const hy = 22 + b;
    K.horn(g, 28, hy - 6, 12, 1.6, 3.5, sh(c1, -0.4), -1); K.horn(g, 42, hy - 6, 12, 1.6, 3.5, sh(c1, -0.4), 1);
    K.blob(g, 35, hy, 11, 10, c1);
    K.shape(g, [[26, hy - 3], [44, hy - 3], [42, hy], [28, hy]], sh(c1, -0.35));
    K.eye(g, 30, hy + 1, 2, c3); K.eye(g, 40, hy + 1, 2, c3);
    K.mouth(g, 35, hy + 6, 10, 4, 4);
    if (o.stars) { // constelação: estrelas pelo corpo e uma estrela no peito
      K.dots(g, [[27, 38], [42, 36], [31, 47], [40, 50], [24, 46], [46, 44], [12, 22], [58, 22], [8, 30], [62, 30]], 1, '#fff6c8');
      K.blob(g, 35, 42 + b, 4, 4, '#fff2b0', { light: 0.6, dark: 0 });
      K.line(g, [[35, 36 + b], [35, 48 + b]], 1, '#fff6c8'); K.line(g, [[29, 42 + b], [41, 42 + b]], 1, '#fff6c8');
    }
    K.line(g, [[30, hy + 6], [29, hy + 10]], 1.6, '#f4efe0'); K.line(g, [[40, hy + 6], [41, hy + 10]], 1.6, '#f4efe0');
  });

  MS.wyvern = (P, o, b) => paint(96, 76, (g) => {
    const [c1, c2, c3] = P;
    // cauda com ferrão
    K.curve(g, 34, 50, 10, 64, 4, 46, 5, c1);
    K.shape(g, [[2, 40], [8, 44], [1, 52], [6, 46]], c3, { light: 0.4 });
    K.wing(g, 44, 36 + b, 40, 26, sh(c2, -0.15), -1, 5);
    K.limb(g, [[38, 52], [34, 62], [36, 72]], 7, sh(c1, -0.15)); K.limb(g, [[56, 52], [60, 62], [58, 72]], 7, sh(c1, -0.15));
    for (const x of [36, 58]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 2, 72], [x + i * 3.5, 75]], 1.5, '#1a1014');
    K.blob(g, 46, 46 + b * 0.5, 20, 13, c1);
    for (let i = 0; i < 5; i++) K.curve(g, 34 + i * 5, 53, 36 + i * 5, 56, 38 + i * 5, 53, 1, sh(c2, -0.2));
    K.blob(g, 46, 52, 13, 4, c2, { light: 0.2, dark: 0.2 });
    // pescoço longo
    K.limb(g, [[58, 42 + b], [68, 30], [72, 20 + b]], 10, c1);
    for (let i = 0; i < 4; i++) K.shape(g, [[56 + i * 4, 38 - i * 5 + b], [58 + i * 4, 31 - i * 5 + b], [61 + i * 4, 37 - i * 5 + b]], c3);
    K.wing(g, 54, 34 + b, 40, 28, sh(c2, 0.1), 1, 5);
    const hy = 16 + b;
    K.blob(g, 76, hy, 10, 7, c1);
    K.shape(g, [[80, hy - 3], [94, hy + 2], [92, hy + 6], [80, hy + 6]], c1);
    K.shape(g, [[80, hy + 5], [92, hy + 6], [88, hy + 10], [80, hy + 9]], sh(c1, -0.3));
    K.teeth(g, 81, hy + 6, 91, 5, 2);
    K.horn(g, 72, hy - 4, 12, 1.4, 3, c3, -1); K.horn(g, 76, hy - 5, 10, 1.4, 2.5, sh(c3, -0.2), -1);
    K.eye(g, 80, hy - 1, 1.8, '#ffd36b');
    K.dots(g, [[92, hy + 2]], 1, '#1a1014');
  });

  MS.wisp = (P, o, b) => paint(44, 48, (g) => {
    const [c1, c2, c3] = P;
    const cy = 22 + b;
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; K.flame(g, 22 + Math.cos(a) * 11, cy + 14 + Math.sin(a) * 3, 6, 10 + (i % 2) * 6, c3, c1); }
    K.blob(g, 22, cy, 14, 14, c3, { light: 0.5, dark: 0.2 });
    K.blob(g, 22, cy, 10, 10, c1, { light: 0.6, dark: 0.05 });
    K.blob(g, 22, cy, 5, 5, c2, { light: 0.2, dark: 0 });
    K.dots(g, [[6, 8], [38, 12], [36, 40], [8, 38], [22, 2]], 1.2, c2);
    K.eye(g, 18, cy, 1.4, sh(c3, -0.5)); K.eye(g, 26, cy, 1.4, sh(c3, -0.5));
  });

  MS.imp = (P, o, b) => paint(60, 56, (g) => {
    const [c1, c2, c3] = P;
    K.wing(g, 22, 24 + b, 20, 18, sh(c1, -0.3), -1, 3); K.wing(g, 38, 24 + b, 20, 18, sh(c1, -0.3), 1, 3);
    K.curve(g, 34, 40, 50, 46, 52, 34, 2, c1); K.shape(g, [[50, 30], [56, 33], [51, 37]], c3);
    K.limb(g, [[26, 40], [23, 48], [25, 54]], 4, sh(c1, -0.15)); K.limb(g, [[34, 40], [37, 48], [35, 54]], 4, sh(c1, -0.15));
    K.blob(g, 30, 34 + b, 10, 10, c1);
    K.limb(g, [[21, 31 + b], [16, 38], [17, 44]], 3.5, c1); K.limb(g, [[39, 31 + b], [44, 38], [43, 44]], 3.5, c1);
    const hy = 18 + b;
    K.horn(g, 24, hy - 5, 9, 1.4, 3, c2, -1); K.horn(g, 36, hy - 5, 9, 1.4, 3, c2, 1);
    K.blob(g, 30, hy, 10, 9, c1);
    K.eye(g, 26, hy, 2, c3); K.eye(g, 34, hy, 2, c3);
    K.mouth(g, 30, hy + 5, 8, 3, 3);
    K.shape(g, [[19, hy - 1], [12, hy - 5], [19, hy + 3]], c1); K.shape(g, [[41, hy - 1], [48, hy - 5], [41, hy + 3]], c1);
  });

  MS.elemental = (P, o, b) => paint(70, 84, (g) => {
    const [c1, c2, c3] = P;
    // tornado em camadas
    for (let i = 0; i < 9; i++) {
      const y = 80 - i * 8, w = 6 + i * 3.4, off = Math.sin(i * 1.3 + b) * 4;
      K.shape(g, [[35 + off - w, y], [35 + off + w, y - 3], [35 + off + w * 0.9, y - 9], [35 + off - w * 0.9, y - 7]], i % 2 ? c1 : c2, { smooth: true, light: 0.4, dark: 0.2 });
      K.curve(g, 35 + off - w * 0.8, y - 4, 35 + off, y - 8, 35 + off + w * 0.8, y - 6, 1.2, c3);
    }
    K.blob(g, 35, 24 + b, 14, 12, c1, { light: 0.5 });
    K.eye(g, 30, 22 + b, 2.6, '#3a7bd5'); K.eye(g, 40, 22 + b, 2.6, '#3a7bd5');
    K.curve(g, 30, 30 + b, 35, 33 + b, 40, 30 + b, 1.5, sh(c2, -0.4));
    K.dots(g, [[6, 20], [64, 30], [10, 54], [62, 60]], 1.5, c3);
  });

  MS.mimic = (P, o, b) => paint(70, 58, (g) => {
    const [c1, c2, c3] = P;
    // pseudópodes
    K.limb(g, [[14, 46], [6, 52], [4, 57]], 4, '#8a6a7a'); K.limb(g, [[56, 46], [64, 52], [66, 57]], 4, '#8a6a7a');
    K.shape(g, [[8, 30], [62, 30], [62, 54], [8, 54]], c1);
    for (let i = 0; i < 4; i++) K.line(g, [[8, 34 + i * 6], [62, 34 + i * 6]], 1, sh(c1, -0.35));
    K.shape(g, [[6, 28], [64, 28], [64, 32], [6, 32]], c2); K.shape(g, [[6, 50], [64, 50], [64, 54], [6, 54]], c2);
    K.shape(g, [[30, 34], [40, 34], [40, 44], [30, 44]], c2); K.blob(g, 35, 39, 2, 2.5, '#2a1a10');
    // tampa aberta com boca
    K.shape(g, [[6, 26], [64, 26], [60, 8 - b], [10, 8 - b]], c1);
    K.shape(g, [[6, 26], [64, 26], [60, 22], [10, 22]], '#3a0e14');
    K.shape(g, [[10, 26], [60, 26], [54, 32], [16, 32]], '#2a0810');
    K.teeth(g, 9, 22, 61, 10, 4); K.teeth(g, 11, 27, 59, 9, 4, '#f4efe0', false);
    K.curve(g, 40, 30, 54, 38, 50, 48, 4, c3); K.blob(g, 50, 48, 3, 2, sh(c3, 0.1));
    K.shape(g, [[8, 10 - b], [62, 10 - b], [62, 13 - b], [8, 13 - b]], c2);
    K.eye(g, 18, 16 - b, 3, '#ffd36b', { sclera: true, look: 1 }); K.eye(g, 52, 16 - b, 3, '#ffd36b', { sclera: true, look: -1 });
  });

  MS.doppel = (P, o, b) => paint(50, 64, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[20, 42], [19, 54], [18, 62]], 5, c2); K.limb(g, [[30, 42], [31, 54], [32, 62]], 5, c2);
    K.shape(g, [[14, 24 + b], [36, 24 + b], [34, 44], [16, 44]], c1, { smooth: true });
    K.limb(g, [[14, 27 + b], [9, 38], [8, 48]], 4, c1); K.limb(g, [[36, 27 + b], [41, 38], [42, 48]], 4, c1);
    for (const x of [8, 42]) for (let i = -1; i <= 1; i++) K.line(g, [[x + i * 1.6, 48], [x + i * 2, 54]], 1, sh(c1, -0.2));
    const hy = 13 + b;
    K.blob(g, 25, hy, 9, 11, c1);
    K.blob(g, 21, hy, 3.4, 4.6, c3, { light: 0.25, dark: 0 }); K.blob(g, 29, hy, 3.4, 4.6, c3, { light: 0.25, dark: 0 });
    K.dots(g, [[20, hy - 2], [28, hy - 2]], 0.8, '#ffffff');
    K.line(g, [[23, hy + 7], [27, hy + 7]], 1, sh(c1, -0.4));
  });

  MS.satyr = (P, o, b) => paint(52, 64, (g) => {
    const [c1, c2, c3] = P;
    // pernas de bode
    K.limb(g, [[20, 40], [16, 50], [20, 56], [18, 62]], 6, c1); K.limb(g, [[32, 40], [36, 50], [32, 56], [34, 62]], 6, c1);
    K.blob(g, 18, 62, 3.5, 2, '#2a1a10'); K.blob(g, 34, 62, 3.5, 2, '#2a1a10');
    K.strokes(g, 26, 46, 10, 6, sh(c1, -0.3), 20, 3, 4, 1.6);
    K.shape(g, [[16, 24 + b], [36, 24 + b], [35, 42], [17, 42]], c2, { smooth: true });
    K.limb(g, [[16, 27 + b], [12, 34], [20, 34]], 4, c2); K.limb(g, [[36, 27 + b], [38, 34], [30, 34]], 4, c2);
    // flauta de pã
    for (let i = 0; i < 5; i++) K.line(g, [[20 + i * 2.2, 30 + b], [20 + i * 2.2, 36 + b - i]], 1.8, c3);
    const hy = 14 + b;
    K.horn(g, 20, hy - 5, 9, 2.4, 3, '#e8dcc0', -1); K.horn(g, 32, hy - 5, 9, 2.4, 3, '#e8dcc0', 1);
    K.blob(g, 26, hy - 4, 10, 5, sh(c1, -0.2));
    K.blob(g, 26, hy, 8, 9, c2);
    K.eye(g, 23, hy, 1.5, '#2a1a1a'); K.eye(g, 29, hy, 1.5, '#2a1a1a');
    K.shape(g, [[22, hy + 5], [30, hy + 5], [26, hy + 12]], c1);
    K.curve(g, 23, hy + 4, 26, hy + 6, 29, hy + 4, 1, '#7a3a2a');
  });

  MS.tree = (P, o, b) => paint(84, 110, (g) => {
    const [c1, c2, c3] = P;
    // raízes
    for (const [x, d] of [[30, -1], [42, 0], [54, 1]]) K.limb(g, [[x, 92], [x + d * 10, 102], [x + d * 16, 108]], 6, sh(c1, -0.15));
    K.shape(g, [[28, 96], [32, 50], [52, 50], [58, 96]], c1, { horiz: true });
    for (let i = 0; i < 5; i++) K.curve(g, 32 + i * 5, 54, 30 + i * 5, 74, 33 + i * 5, 94, 1, sh(c1, -0.4));
    // braços-galhos
    K.limb(g, [[32, 62], [16, 54], [6, 40], [2, 28]], 6, c1); K.limb(g, [[54, 62], [68, 52], [78, 42], [80, 30]], 6, c1);
    K.limb(g, [[10, 46], [2, 46]], 2.5, c1); K.limb(g, [[74, 46], [82, 48]], 2.5, c1);
    // copa
    for (const [x, y, r] of [[24, 34, 18], [60, 34, 18], [42, 24, 22], [30, 18, 14], [56, 16, 14]]) K.blob(g, x, y + b, r, r * 0.85, c2);
    K.strokes(g, 42, 28, 32, 16, sh(c2, -0.3), 50, 3, 3, -2.2);
    K.dots(g, [[18, 26], [32, 12], [48, 10], [64, 22], [70, 38], [14, 40], [40, 36], [56, 40]], 2.2, c3);
    K.dots(g, [[18, 26], [32, 12], [48, 10], [64, 22]], 0.9, '#ffffff');
    // rosto no tronco
    K.blob(g, 36, 64, 3.4, 2.6, '#1a0e08', { light: 0, dark: 0 }); K.blob(g, 48, 64, 3.4, 2.6, '#1a0e08', { light: 0, dark: 0 });
    K.eye(g, 36, 64, 1.8, '#ffd36b'); K.eye(g, 48, 64, 1.8, '#ffd36b');
    K.shape(g, [[36, 74], [48, 74], [46, 80], [38, 80]], '#1a0e08');
  });

  MS.dryad = (P, o, b) => paint(54, 68, (g) => {
    const [c1, c2, c3] = P;
    K.shape(g, [[16, 30 + b], [36, 30 + b], [44, 66], [8, 66]], c1, { smooth: false });
    for (let i = 0; i < 5; i++) K.shape(g, [[10 + i * 8, 58], [14 + i * 8, 68], [18 + i * 8, 58]], sh(c1, -0.2));
    K.strokes(g, 26, 48, 14, 14, sh(c1, -0.3), 24, 4, 5, 1.4);
    K.limb(g, [[17, 33 + b], [10, 42], [12, 50]], 3.6, c2); K.limb(g, [[35, 33 + b], [42, 42], [40, 50]], 3.6, c2);
    const hy = 20 + b;
    // cabelo de folhas
    K.shape(g, [[12, hy - 2], [26, hy - 14], [40, hy - 2], [44, hy + 16], [36, hy + 10], [16, hy + 10], [8, hy + 16]], sh(c1, 0.05), { smooth: true });
    for (let i = 0; i < 7; i++) K.shape(g, [[10 + i * 5, hy - 6 + (i % 2) * 3], [13 + i * 5, hy - 12 + (i % 2) * 3], [15 + i * 5, hy - 5 + (i % 2) * 3]], sh(c1, -0.15 + (i % 2) * 0.2));
    K.blob(g, 26, hy, 8, 9, c2 === '#9b6b3c' ? '#c99a6a' : c2);
    K.eye(g, 23, hy, 1.6, '#2a5a2a'); K.eye(g, 29, hy, 1.6, '#2a5a2a');
    K.curve(g, 24, hy + 5, 26, hy + 6, 28, hy + 5, 1, '#7a3a3a');
    K.dots(g, [[14, hy - 4], [38, hy - 2], [26, hy - 12]], 2.2, c3); K.dots(g, [[14, hy - 4], [38, hy - 2], [26, hy - 12]], 0.8, '#ffffff');
  });

  MS.horse = (P, o, b) => paint(90, 70, (g) => {
    const [c1, c2, c3] = P;
    // cauda de fogo
    K.flame(g, 12, 40, 10, 26, c2, c3, -8); K.flame(g, 9, 44, 7, 18, sh(c2, -0.2), c3, -6);
    K.limb(g, [[24, 44], [20, 56], [22, 66]], 6, sh(c1, 0.12)); K.limb(g, [[58, 44], [62, 56], [60, 66]], 6, sh(c1, 0.12));
    K.blob(g, 40, 38 + b * 0.5, 24, 13, c1, { light: 0.4 });
    K.limb(g, [[30, 46], [30, 58], [32, 66]], 6, c1); K.limb(g, [[52, 46], [54, 58], [54, 66]], 6, c1);
    for (const x of [22, 32, 54, 60]) K.flame(g, x, 69, 7, 8, c2, c3);
    // pescoço e cabeça
    K.shape(g, [[54, 30 + b], [66, 12 + b], [74, 14 + b], [66, 40]], c1, { light: 0.35 });
    K.shape(g, [[66, 10 + b], [86, 18 + b], [84, 26 + b], [70, 22 + b]], c1, { light: 0.35, smooth: true });
    K.eye(g, 73, 15 + b, 2, c3);
    K.dots(g, [[84, 21 + b]], 1.2, c2);
    for (let i = 0; i < 5; i++) K.flame(g, 56 + i * 3, 30 - i * 4 + b, 6, 12, c2, c3, -4);
    K.shape(g, [[66, 10 + b], [68, 2 + b], [71, 10 + b]], c1);
  });

  MS.minotaur = (P, o, b) => paint(80, 86, (g) => {
    const [c1, c2, c3] = P;
    K.limb(g, [[30, 60], [26, 72], [28, 84]], 10, c2); K.limb(g, [[50, 60], [54, 72], [52, 84]], 10, c2);
    K.blob(g, 28, 84, 6, 2.5, '#1a1410'); K.blob(g, 52, 84, 6, 2.5, '#1a1410');
    K.strokes(g, 40, 70, 16, 8, sh(c2, -0.3), 26, 3, 9, 1.6);
    K.shape(g, [[24, 56], [56, 56], [54, 66], [26, 66]], '#7a2a2a'); K.line(g, [[24, 57], [56, 57]], 2, '#d4af37');
    K.blob(g, 40, 42 + b, 22, 18, c1);
    K.blob(g, 33, 38 + b, 7, 6, sh(c1, 0.1)); K.blob(g, 47, 38 + b, 7, 6, sh(c1, 0.1));
    K.line(g, [[40, 30], [40, 54]], 1, sh(c1, -0.4));
    // braços + machado
    K.limb(g, [[18, 32 + b], [10, 46], [12, 58]], 9, c1); K.limb(g, [[62, 32 + b], [70, 42], [70, 52]], 9, c1);
    K.limb(g, [[70, 64], [70, 6]], 3.5, '#6a4a2a');
    K.shape(g, [[70, 8], [80, 2], [80, 26], [70, 20]], '#c9d1d9', { horiz: true }); K.shape(g, [[70, 8], [62, 4], [62, 22], [70, 20]], '#a8b0ba', { horiz: true });
    const hy = 20 + b;
    K.horn(g, 32, hy - 6, 18, 1.6, 5, c3, -1); K.horn(g, 48, hy - 6, 18, 1.6, 5, c3, 1);
    K.shape(g, [[27, hy - 2], [18, hy - 5], [24, hy + 3]], c1); K.shape(g, [[53, hy - 2], [62, hy - 5], [56, hy + 3]], c1);
    K.blob(g, 40, hy - 1, 12, 10, c1);
    K.strokes(g, 40, hy - 7, 9, 3, sh(c1, -0.35), 12, 3, 6, -1.6);
    K.shape(g, [[31, hy + 1], [49, hy + 1], [47, hy + 14], [33, hy + 14]], sh(c1, 0.1), { smooth: true });
    K.blob(g, 40, hy + 11, 7, 4.5, sh(c1, 0.28), { light: 0.15 });
    K.dots(g, [[37, hy + 11], [43, hy + 11]], 1.3, '#1a0e08');
    K.curve(g, 37.5, hy + 13, 40, hy + 17, 42.5, hy + 13, 1.3, '#e8c46a');
    K.shape(g, [[31, hy - 5], [39, hy - 2], [39, hy], [31, hy - 2]], sh(c1, -0.45)); K.shape(g, [[49, hy - 5], [41, hy - 2], [41, hy], [49, hy - 2]], sh(c1, -0.45));
    K.eye(g, 35, hy - 1, 1.8, '#ff4d4d'); K.eye(g, 45, hy - 1, 1.8, '#ff4d4d');
  });

  // ---------------- chefe: Soberana das Nove Sombras (grande e imponente)
  MS.queen = (P, o, b) => paint(124, 132, (g) => {
    const [c1, c2, c3] = P;
    const cx = 62;
    // asas de sombra (4) atrás
    for (const [d, s, hh] of [[-1, 50, 56], [1, 50, 56], [-1, 38, 40], [1, 38, 40]]) {
      const by = 54 + b;
      K.shape(g, [[cx + d * 10, by], [cx + d * s, by - hh], [cx + d * (s + 8), by - hh + 18], [cx + d * (s - 2), by - hh + 30], [cx + d * (s + 4), by - hh + 44], [cx + d * (s - 10), by - 4], [cx + d * 18, by + 18]], s > 40 ? sh(c1, -0.35) : sh(c1, -0.1), { smooth: true, dark: 0.5 });
      for (let i = 0; i < 3; i++) K.curve(g, cx + d * 12, by, cx + d * (s * 0.6), by - hh * 0.6 + i * 10, cx + d * (s - 4), by - hh + 14 + i * 14, 1.2, c2);
    }
    // tentáculos de sombra no chão
    for (let i = 0; i < 7; i++) { const x = 24 + i * 13; K.curve(g, x, 130, x + (i % 2 ? 8 : -8), 112, x + (i % 2 ? -4 : 4), 100, 4, sh(c1, -0.45)); }
    // vestido longo
    K.shape(g, [[cx - 14, 60 + b], [cx + 14, 60 + b], [cx + 34, 130], [cx - 34, 130]], c1, { dark: 0.55 });
    K.shape(g, [[cx - 4, 64 + b], [cx + 4, 64 + b], [cx + 12, 130], [cx - 12, 130]], sh(c1, 0.15));
    for (let i = 0; i < 7; i++) K.line(g, [[cx - 30 + i * 10, 126], [cx - 26 + i * 9, 118]], 1, c2);
    K.line(g, [[cx - 34, 129], [cx + 34, 129]], 2, c2);
    // tronco com armadura
    K.shape(g, [[cx - 13, 42 + b], [cx + 13, 42 + b], [cx + 11, 64 + b], [cx - 11, 64 + b]], sh(c1, 0.1));
    K.shape(g, [[cx - 9, 46 + b], [cx + 9, 46 + b], [cx, 60 + b]], c2, { light: 0.3 });
    K.blob(g, cx, 52 + b, 3.4, 3.4, c3, { light: 0.6 });
    // ombreiras com pontas
    for (const d of [-1, 1]) { K.blob(g, cx + d * 16, 44 + b, 8, 6, c2); for (let i = 0; i < 3; i++) K.shape(g, [[cx + d * (11 + i * 4), 40 + b], [cx + d * (13 + i * 5), 30 + b - i * 2], [cx + d * (15 + i * 4), 40 + b]], sh(c2, 0.2)); }
    // braços: um segura o cetro, outro conjura
    K.limb(g, [[cx - 18, 46 + b], [cx - 28, 60], [cx - 30, 72]], 5, sh(c1, 0.15));
    K.limb(g, [[cx + 18, 46 + b], [cx + 30, 54], [cx + 38, 50]], 5, sh(c1, 0.15));
    K.limb(g, [[cx - 30, 104], [cx - 30, 24]], 3, '#2a1838');
    K.blob(g, cx - 30, 20 + b, 6, 6, c3, { light: 0.7 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; K.line(g, [[cx - 30 + Math.cos(a) * 5, 20 + b + Math.sin(a) * 5], [cx - 30 + Math.cos(a) * 10, 20 + b + Math.sin(a) * 10]], 1.4, c2); }
    // orbe de sombra na mão
    K.blob(g, cx + 42, 46, 7, 7, '#1a0f28', { light: 0.1 }); K.blob(g, cx + 42, 46, 4, 4, c3, { light: 0.6 });
    // cabeça
    const hy = 30 + b;
    K.shape(g, [[cx - 11, hy - 6], [cx + 11, hy - 6], [cx + 16, hy + 20], [cx - 16, hy + 20]], '#140a20', { smooth: true }); // cabelo
    K.blob(g, cx, hy, 8.5, 10, '#e2d6f2');
    K.blob(g, cx - 4, hy - 1, 3, 2.2, '#3a2058', { light: 0, dark: 0 }); K.blob(g, cx + 4, hy - 1, 3, 2.2, '#3a2058', { light: 0, dark: 0 });
    K.eye(g, cx - 4, hy - 1, 1.6, c3); K.eye(g, cx + 4, hy - 1, 1.6, c3);
    K.line(g, [[cx - 1, hy + 2], [cx, hy + 3]], 0.8, '#b8a6d0');
    K.shape(g, [[cx - 3, hy + 5.5], [cx + 3, hy + 5.5], [cx, hy + 7]], '#6a2a7a');
    // marcas de sombra que escorrem dos olhos
    K.line(g, [[cx - 5, hy + 1], [cx - 6, hy + 7]], 0.8, '#5a3a8a'); K.line(g, [[cx + 5, hy + 1], [cx + 6, hy + 7]], 0.8, '#5a3a8a');
    // coroa de nove pontas
    K.shape(g, [[cx - 12, hy - 7], [cx + 12, hy - 7], [cx + 11, hy - 11], [cx - 11, hy - 11]], '#d4af37');
    for (let i = 0; i < 9; i++) { const x = cx - 12 + i * 3; const hgt = i === 4 ? 14 : i % 2 ? 7 : 10; K.shape(g, [[x - 1, hy - 10], [x + 1, hy - 10 - hgt], [x + 3, hy - 10]], '#e8c46a', { light: 0.4 }); }
    K.dots(g, [[cx - 8, hy - 9], [cx, hy - 9], [cx + 8, hy - 9]], 1.3, c3);
    K.dots(g, [[cx + 1, hy - 23]], 1.6, '#ffffff');
  });

  // as funções novas substituem as antigas por tipo de sprite
  MS.draw = (spriteKey, def, frame) => {
    const fn = MS[spriteKey];
    if (!fn) return null;
    HI = RES;
    return fn(def.pal, { fire: def.fire, flame: def.flame, stars: def.stars, gear: def.gear, armor: def.armor, hat: def.hat }, frame === 'idle1' ? 1 : 0);
  };

  MS.K = K; MS.finalize = finalize; MS.RES = RES;
  E.MS = MS;
})();
