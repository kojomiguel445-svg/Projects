/* Dragões: pintor próprio, grande e detalhado (pintado em 3× para bordas lisas).
   Cada cor tem anatomia própria, como no Manual dos Monstros: o vermelho é maciço e de chifres enormes para trás,
   o azul tem um chifre no focinho e orelhas em leque, o verde uma crista que corre da cabeça à cauda, o negro
   tem cara de caveira e chifres virados para a frente, o branco é atarracado com coroa de gelo, o dourado é
   sinuoso, com bigodes e asas que vão até a cauda, o prateado tem escudo na cabeça e barba, o bronze tem
   leques nas orelhas e cauda de remo, o latão um grande escudo-crista e o cobre chifres segmentados.
   Forma 'dragon' (quatro patas + asas) ou 'wyvern' (serpe: patas de trás e asas que servem de braços). */
(() => {
  const SP = E.SP, sh = (c, a) => SP.shade(c, a), mix = (a, b, t) => SP.mix(a, b, t);
  const DR = {};
  const RES = 3, LW = 180, LH = 112, GROUND = 106;

  // ------------------------------------------------------------ variações
  // body: comprimento/altura do tronco · leg: grossura/altura · neck: comprimento/grossura · tail: comprimento/ponta
  // head: focinho, largura, chifres, crista, enfeites · back: dorso · wing: tamanho/forma · mark: desenho nas escamas
  const V = (o) => Object.assign({ body: [1, 1], leg: [1, 1], neck: [1, 1], tail: [1, 1, 'spade'], head: { len: 1, w: 1 }, back: 'spikes', wing: [1, 'bat'], mark: null }, o);
  DR.VARIANTS = {
    vermelho: V({ c1: '#b8262c', c2: '#f2b46a', c3: '#3a1812', mem: '#8a1a22', eye: '#ffd34a', glow: '#ff8a2a',
      body: [1.12, 1.1], leg: [1.2, 1], neck: [1, 1.15], tail: [1.05, 1.15, 'spade'], head: { len: 1.05, w: 1.15, horns: 'swept2', cheek: 'spikes', snoutHorn: true },
      back: 'bigSpikes', wing: [1.22, 'ragged'] }),
    azul: V({ c1: '#2c62c8', c2: '#c8e6ff', c3: '#eef2f8', mem: '#1e4a9a', eye: '#fff6b0', glow: '#9fe3ff',
      body: [1.02, 0.98], neck: [0.95, 1], tail: [1.1, 0.95, 'blade'], head: { len: 1.1, w: 1.08, horns: 'nub', noseHorn: 'big', ears: 'fan', jaw: 'hornlets' },
      back: 'smallSpikes', wing: [1.08, 'bat'], mark: 'bolts' }),
    verde: V({ c1: '#2b8a48', c2: '#d6ec74', c3: '#173a22', mem: '#1e6a3a', eye: '#ffe24a', glow: '#a8ff5a',
      body: [1.02, 0.9], leg: [0.85, 1.08], neck: [1.3, 0.88], tail: [1.2, 0.85, 'leaf'], head: { len: 1.12, w: 0.92, horns: 'short', crest: 'sail', jaw: 'spikes' },
      back: 'sail', wing: [1.02, 'bat'], mark: 'spots' }),
    branco: V({ c1: '#e6f0f8', c2: '#a8cce8', c3: '#5a7a9c', mem: '#b8d4ea', eye: '#4ad8ff', glow: '#d8f8ff',
      body: [0.88, 1.05], leg: [1.25, 0.82], neck: [0.75, 1.15], tail: [0.85, 1.1, 'spikes'], head: { len: 0.85, w: 1.15, horns: 'crown', jaw: 'frost' },
      back: 'iceShards', wing: [0.9, 'short'] }),
    negro: V({ c1: '#2a2a36', c2: '#5c5a46', c3: '#d6ceb0', mem: '#1c1c26', eye: '#c8ff4a', glow: '#b8ff4a',
      body: [1, 0.82], leg: [0.85, 1.05], neck: [1.05, 0.85], tail: [1.1, 0.85, 'spikes'], head: { len: 1, w: 0.95, horns: 'forward', skull: true, jaw: 'fins' },
      back: 'ridge', wing: [1.05, 'tattered'], mark: 'drip' }),
    ouro: V({ c1: '#e6b42e', c2: '#fff0b4', c3: '#8a5a10', mem: '#c8902a', eye: '#ff6a3a', glow: '#ffcf5a',
      body: [1.18, 0.9], leg: [0.95, 1], neck: [1.25, 0.95], tail: [1.25, 0.95, 'fin'], head: { len: 1.05, w: 1, horns: 'regal', whiskers: true, frills: 'gold' },
      back: 'fins', wing: [1.12, 'tailMembrane'] }),
    prata: V({ c1: '#c6d0dc', c2: '#ffffff', c3: '#6a7a9c', mem: '#9aa8c0', eye: '#4ac8ff', glow: '#e6fbff',
      body: [1.05, 0.95], leg: [1, 1.05], neck: [1.15, 0.95], tail: [1.1, 0.95, 'feather'], head: { len: 1, w: 1, horns: 'swept1', shield: true, beard: 'frill' },
      back: 'smooth', wing: [1.12, 'spurred'] }),
    bronze: V({ c1: '#b4722a', c2: '#f0d48e', c3: '#3a6a5a', mem: '#8a5420', eye: '#7fe8ff', glow: '#9fe3ff',
      body: [1.08, 1], leg: [1.1, 0.95], neck: [1, 1.05], tail: [1.05, 1.1, 'paddle'], head: { len: 1.05, w: 1.05, horns: 'cheekRidge', ears: 'web', beard: 'tendrils' },
      back: 'ridge', wing: [1.1, 'bat'], webbed: true, mark: 'bands' }),
    latao: V({ c1: '#c99a3a', c2: '#f6e2a8', c3: '#7a5418', mem: '#b07a2a', eye: '#ffef8a', glow: '#ffd36b',
      body: [1.1, 0.88], leg: [0.9, 1.05], neck: [1.2, 0.9], tail: [1.15, 0.9, 'blade'], head: { len: 1.05, w: 1, horns: 'none', plate: true, jaw: 'spikes' },
      back: 'smallSpikes', wing: [1.3, 'long'] }),
    cobre: V({ c1: '#c4643a', c2: '#f4c2a0', c3: '#4a8a7a', mem: '#a04a2a', eye: '#bff6ff', glow: '#7fe8ff',
      body: [1, 0.95], leg: [1, 1], neck: [1.05, 1], tail: [1.15, 0.95, 'spikes'], head: { len: 1, w: 1.05, horns: 'segmented', beard: 'spines' },
      back: 'smallSpikes', wing: [1.05, 'ridged'], mark: 'verdigris' }),
    cinzento: V({ c1: '#8a909c', c2: '#d6d8de', c3: '#3a3c46', mem: '#5a5e6a', eye: '#ffd36b', glow: '#ffd36b', age: 2,
      body: [1.1, 1.05], leg: [1.1, 1], neck: [1.05, 1.1], tail: [1, 1.1, 'club'], head: { len: 1, w: 1.1, horns: 'ram', beard: 'long' },
      back: 'ridge', wing: [1.1, 'tattered'] }),
    obsidiana: V({ c1: '#2a1e24', c2: '#5a3a30', c3: '#ffd36b', mem: '#3a1e1a', eye: '#ffd34a', glow: '#ff6a2a', form: 'wyvern',
      body: [1, 1], tail: [1.15, 1, 'stinger'], head: { len: 1, w: 1, horns: 'swept1', jaw: 'spikes' }, back: 'bigSpikes', wing: [1.1, 'ragged'], mark: 'lava' }),
    serpe: V({ c1: '#6b3a4a', c2: '#d8b0a0', c3: '#f2d06b', mem: '#5a2a3a', eye: '#ffd36b', glow: '#c8ff6a', form: 'wyvern',
      body: [0.95, 0.95], tail: [1.2, 0.95, 'stinger'], head: { len: 1.05, w: 0.95, horns: 'short' }, back: 'smallSpikes', wing: [1.05, 'bat'] }),
  };

  // ------------------------------------------------------------ geometria
  const spline = (pts, n = 28) => {
    const out = [], seg = pts.length - 1, steps = Math.max(2, Math.ceil(n / seg));
    for (let i = 0; i < seg; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(seg, i + 2)];
      for (let s = 0; s < steps; s++) {
        const t = s / steps, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[seg]);
    return out;
  };
  const fillPoly = (g, pts, col, o = {}) => {
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const gr = g.createLinearGradient(0, y0, 0, y1 + 0.01);
    gr.addColorStop(0, sh(col, o.light ?? 0.28)); gr.addColorStop(0.55, col); gr.addColorStop(1, sh(col, -(o.dark ?? 0.38)));
    g.fillStyle = gr; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill();
  };
  const tube = (g, pts, w0, w1, col, o = {}) => {
    const S = spline(pts, o.n || 30), A = [], B = [], N = [];
    for (let i = 0; i < S.length; i++) {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const t = i / (S.length - 1), w = (w0 + (w1 - w0) * Math.pow(t, o.pow || 1)) / 2;
      A.push([S[i][0] - ty * w, S[i][1] + tx * w]); B.push([S[i][0] + ty * w, S[i][1] - tx * w]); N.push([ty, -tx, w]);
    }
    fillPoly(g, A.concat(B.slice().reverse()), col, o);
    return { S, A, B, N };
  };
  const blob = (g, cx, cy, rx, ry, col, o = {}) => {
    g.save(); g.translate(cx, cy); g.rotate(o.rot || 0);
    const gr = g.createRadialGradient(-rx * 0.3, -ry * 0.5, Math.min(rx, ry) * 0.1, 0, 0, Math.max(rx, ry) * 1.05);
    gr.addColorStop(0, sh(col, o.light ?? 0.3)); gr.addColorStop(0.55, col); gr.addColorStop(1, sh(col, -(o.dark ?? 0.42)));
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.restore();
  };
  const line = (g, pts, w, col) => { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); };
  const curve = (g, pts, w, col) => line(g, spline(pts, 18), w, col);
  const horn = (g, pts, w, col) => tube(g, pts, w, 0.3, col, { n: 16, light: 0.42, dark: 0.45 });
  // espinhos ao longo de uma borda de tubo (k de 0 a 1)
  const spinesOn = (g, T, side, from, to, n, len, col, o = {}) => {
    const E2 = T[side], s = side === 'A' ? 1 : -1;
    for (let k = 0; k < n; k++) {
      const u = from + (to - from) * (k + 0.5) / n, i = Math.round(u * (T.S.length - 1)), j = Math.min(T.S.length - 1, i + (o.wide || 2));
      const p = E2[i], q = E2[j], nn = T.N[i];
      const L = len * (o.even ? 1 : 0.65 + 0.35 * Math.sin((k / Math.max(1, n - 1)) * Math.PI)) * (o.taper ? 1 - u * 0.6 : 1);
      const back = o.rake || 0.5;
      const tip = [(p[0] + q[0]) / 2 - nn[0] * L * s - (q[0] - p[0]) * back, (p[1] + q[1]) / 2 - nn[1] * L * s - (q[1] - p[1]) * back];
      fillPoly(g, [p, tip, q], col, { light: 0.4 });
    }
  };
  const plates = (g, T, side, from, to, n, col) => {
    const E2 = T[side];
    for (let k = 0; k <= n; k++) {
      const i = Math.round((from + (to - from) * k / n) * (T.S.length - 1)), c = T.S[i], e = E2[i];
      line(g, [[c[0] + (e[0] - c[0]) * 0.25, c[1] + (e[1] - c[1]) * 0.25], [e[0] + (c[0] - e[0]) * 0.05, e[1] + (c[1] - e[1]) * 0.05]], 0.7, sh(col, -0.35));
    }
  };
  const scaleTex = (g, cx, cy, rx, ry, col, step = 3.4) => {
    g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, 7); g.clip();
    g.strokeStyle = sh(col, -0.32); g.globalAlpha = 0.34; g.lineWidth = 0.5;
    for (let y = cy - ry, r = 0; y < cy + ry; y += step * 0.72, r++) for (let x = cx - rx + (r % 2) * step / 2; x < cx + rx; x += step) { g.beginPath(); g.arc(x, y, step * 0.42, 0.15, Math.PI - 0.15); g.stroke(); }
    g.restore();
  };

  // ------------------------------------------------------------ asas
  // base no ombro; wrist = articulação; tips = pontas dos dedos; attach = onde a membrana prende no corpo
  function wing(g, P, base, wrist, tips, attach, mem, bone, flap, far) {
    const W = [wrist[0], wrist[1] - flap], T = tips.map(([x, y], i) => [x, y - flap * (1 - i * 0.18)]);
    const shape = P.wing[1];
    const gr = g.createRadialGradient(W[0], W[1], 1, W[0], W[1], 70);
    gr.addColorStop(0, sh(mem, 0.28)); gr.addColorStop(0.5, mem); gr.addColorStop(1, sh(mem, -0.32));
    g.fillStyle = gr; g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(W[0], W[1]); g.lineTo(T[0][0], T[0][1]);
    let prev = T[0];
    for (const e of [...T.slice(1), ...attach]) {
      const mx = (prev[0] + e[0]) / 2, my = (prev[1] + e[1]) / 2;
      const sag = shape === 'ragged' || shape === 'tattered' ? 0.34 : shape === 'long' ? 0.12 : 0.22;
      g.quadraticCurveTo(mx + (W[0] - mx) * sag, my + (W[1] - my) * sag, e[0], e[1]); prev = e;
    }
    g.closePath(); g.fill();
    // rasgos (negro e cinzento)
    if (shape === 'tattered' && !far) { g.save(); g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < T.length - 1; i++) { const a = T[i], b = T[i + 1], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; g.beginPath(); g.moveTo(m[0] + 2, m[1]); g.lineTo(m[0] + (W[0] - m[0]) * 0.25, m[1] + (W[1] - m[1]) * 0.25 + 1); g.lineTo(m[0] - 2, m[1] + 1); g.fill(); } g.restore(); }
    for (let i = 0; i < T.length; i++) line(g, [W, T[i]], i === 0 ? 1.7 : 1.15, sh(bone, -0.12));
    if (shape === 'ridged') for (let i = 0; i < T.length; i++) for (let k = 1; k < 4; k++) { const q = [W[0] + (T[i][0] - W[0]) * k / 4, W[1] + (T[i][1] - W[1]) * k / 4]; line(g, [[q[0] - 1, q[1] - 0.6], [q[0] + 1, q[1] + 0.6]], 0.7, sh(bone, 0.25)); }
    if (shape === 'spurred' || shape === 'ragged') for (const t of T) fillPoly(g, [[t[0] - 0.9, t[1]], [t[0] - 1.8, t[1] - 3.2], [t[0] + 0.9, t[1] - 0.4]], '#efe6d2', { light: 0.2 });
    const elbow = [(base[0] + W[0]) / 2 + 5, (base[1] + W[1]) / 2 + 3];
    tube(g, [base, elbow, W], 5.2, 2.6, bone, { n: 14 });
    fillPoly(g, [[W[0] - 1, W[1]], [W[0] + 1.4, W[1] - 4.8], [W[0] + 1.8, W[1] + 0.6]], '#efe6d2', { light: 0.2 }); // garra do polegar
  }

  // ------------------------------------------------------------ patas (coxa grossa + canela + pé com garras)
  function leg(g, P, pts, w, col, far, front) {
    const c = far ? sh(col, -0.24) : col;
    tube(g, pts, w, w * 0.5, c, { n: 18, light: 0.32 });
    const f = pts[pts.length - 1];
    blob(g, f[0] + 1.4, f[1] - 0.8, 3.8 * Math.max(0.8, w / 7), 1.9, c, { light: 0.22 });
    if (P.webbed) fillPoly(g, [[f[0] - 0.5, f[1] - 0.5], [f[0] + 6.8, f[1] + 0.6], [f[0] + 2, f[1] + 1]], mix(P.mem, c, 0.4), { light: 0.2 });
    for (let k = 0; k < 3; k++) { const x = f[0] + 1.6 + k * 2.2, y = f[1] + 0.4; fillPoly(g, [[x - 1, y - 1.5], [x + 2.6, y + 0.6], [x - 0.6, y + 0.9]], '#efe6d2', { light: 0.35, dark: 0.5 }); }
    if (!front && !far) line(g, [[pts[0][0] - 1, pts[0][1] + 2], [pts[1][0] - 1, pts[1][1]]], 0.8, sh(c, -0.3));
  }

  // ------------------------------------------------------------ cabeça (olha para a direita)
  function head(g, hx, hy, s, P, age, b) {
    const H = P.head, X = (v) => hx + v * s, Y = (v) => hy + v * s;
    const hk = [0.65, 1, 1.35][age], L = H.len, Wd = H.w;
    const body = P.c1, c3 = P.c3;
    // ---- enfeites atrás do crânio
    const hornBack = {
      swept2: () => { horn(g, [[X(-2), Y(-4)], [X(-10), Y(-10 * hk)], [X(-20 * hk), Y(-12 * hk)], [X(-25 * hk), Y(-9 * hk)]], 3.8 * s, c3); horn(g, [[X(-3), Y(-1)], [X(-11), Y(-3)], [X(-17 * hk), Y(0)]], 2.6 * s, sh(c3, -0.15)); },
      swept1: () => horn(g, [[X(-2), Y(-4)], [X(-10), Y(-9 * hk)], [X(-18 * hk), Y(-9 * hk)]], 3.1 * s, c3),
      nub: () => { horn(g, [[X(-2), Y(-4)], [X(-7), Y(-7 * hk)]], 2.2 * s, c3); horn(g, [[X(-4), Y(-2)], [X(-9), Y(-4 * hk)]], 1.8 * s, c3); },
      short: () => horn(g, [[X(-2), Y(-4)], [X(-7), Y(-8 * hk)], [X(-10 * hk), Y(-9 * hk)]], 2.2 * s, c3),
      crown: () => { for (let i = 0; i < 7; i++) { const a = (-178 + i * 22) * Math.PI / 180, l = (6 + (i % 2) * 3.5) * hk; horn(g, [[X(-1.5), Y(-2.5)], [X(-1.5 + Math.cos(a) * l * 0.55), Y(-2.5 + Math.sin(a) * l * 0.55)], [X(-1.5 + Math.cos(a) * l), Y(-2.5 + Math.sin(a) * l)]], 1.9 * s, i % 2 ? sh(c3, 0.25) : c3); } },
      forward: () => horn(g, [[X(-3), Y(-3)], [X(-9), Y(-11 * hk)], [X(-3), Y(-17 * hk)], [X(6 * hk), Y(-15 * hk)], [X(9 * hk), Y(-11 * hk)]], 3.4 * s, c3),
      regal: () => { horn(g, [[X(-1), Y(-4.5)], [X(-10), Y(-12 * hk)], [X(-20 * hk), Y(-17 * hk)]], 2.9 * s, c3); horn(g, [[X(-3), Y(-3)], [X(-12), Y(-7 * hk)], [X(-19 * hk), Y(-8 * hk)]], 2.2 * s, sh(c3, -0.2)); },
      ram: () => horn(g, [[X(-1), Y(-4)], [X(-7), Y(-9 * hk)], [X(-13 * hk), Y(-5)], [X(-11 * hk), Y(2 * hk)], [X(-5), Y(2)]], 4.4 * s, c3),
      cheekRidge: () => { horn(g, [[X(-1), Y(1)], [X(-9), Y(-1)], [X(-17 * hk), Y(-4 * hk)]], 3 * s, c3); horn(g, [[X(-1), Y(-3.5)], [X(-8), Y(-7 * hk)], [X(-14 * hk), Y(-9 * hk)]], 2.4 * s, sh(c3, 0.1)); for (let i = 0; i < 4; i++) line(g, [[X(-4 - i * 3), Y(-0.4 - i * 0.6)], [X(-4.5 - i * 3), Y(1.4 - i * 0.6)]], 0.6, sh(c3, -0.4)); },
      segmented: () => { const pts = [[X(-2), Y(-4)], [X(-8), Y(-8 * hk)], [X(-15 * hk), Y(-9 * hk)], [X(-21 * hk), Y(-7 * hk)]]; horn(g, pts, 3.2 * s, c3); const S2 = spline(pts, 12); for (let i = 2; i < S2.length - 2; i += 2) line(g, [[S2[i][0], S2[i][1] - 1.4], [S2[i][0] + 0.6, S2[i][1] + 1.2]], 0.8, sh(c3, -0.45)); },
      none: () => {},
    };
    // escudo/leque (prata), placa (latão), crista vela (verde), leques de orelha (azul, bronze)
    if (H.plate) { const pl = [[X(-4), Y(-1)], [X(-9), Y(-12 * hk)], [X(-2), Y(-19 * hk)], [X(8), Y(-16 * hk)], [X(9), Y(-5)]]; fillPoly(g, pl, mix(P.c2, body, 0.35), { light: 0.35 }); for (let i = 1; i < 4; i++) line(g, [[X(1), Y(-4)], pl[i]], 0.8, sh(body, -0.25)); line(g, pl.concat([pl[0]]), 0.9, sh(c3, 0.1)); }
    if (H.shield) { const fan = [[X(-2), Y(-3.5)], [X(-8), Y(-13 * hk)], [X(-3), Y(-16 * hk)], [X(3), Y(-14 * hk)], [X(4), Y(-5)]]; fillPoly(g, fan, mix(P.c2, body, 0.25), { light: 0.4 }); for (const t of [fan[1], fan[2], fan[3]]) line(g, [[X(0), Y(-4)], t], 0.7, sh(body, -0.2)); }
    if (H.ears === 'fan' || H.ears === 'web') {
      const col = H.ears === 'web' ? mix(P.c3, body, 0.35) : mix(P.c2, body, 0.45);
      const fan = [[X(-3), Y(-2)], [X(-12), Y(-9)], [X(-10), Y(-4.5)], [X(-15), Y(-2)], [X(-11), Y(0)], [X(-14), Y(4)], [X(-4), Y(2.5)]];
      fillPoly(g, fan, col, { light: 0.35 });
      for (const t of [fan[1], fan[3], fan[5]]) line(g, [[X(-3), Y(0)], t], 0.85, sh(H.ears === 'web' ? P.c3 : body, -0.3));
    }
    if (H.frills === 'gold') { for (let i = 0; i < 3; i++) fillPoly(g, [[X(-2), Y(-1 + i * 2.5)], [X(-12 - i * 2), Y(-3 + i * 4)], [X(-3), Y(1 + i * 2.5)]], mix(P.c2, body, 0.4), { light: 0.4 }); }
    (hornBack[H.horns] || hornBack.none)();
    // ---- crânio (forma muda com a cor)
    const skullRx = 7.2 * s * Wd, skullRy = 5.8 * s * (H.skull ? 0.92 : 1);
    blob(g, X(0), Y(0), skullRx, skullRy, body);
    const sn = 14.5 * L;
    const snout = H.skull
      ? [[X(2), Y(-4)], [X(10 * L), Y(-3)], [X(sn), Y(-1.4)], [X(sn + 1.6), Y(0.4)], [X(sn + 1), Y(2)], [X(3), Y(2.6)]]
      : [[X(2), Y(-4.4)], [X(10 * L), Y(-3.6 * Wd)], [X(sn), Y(-2.2)], [X(sn + 2.5), Y(-0.6)], [X(sn + 1.9), Y(1.6)], [X(3), Y(2.6)]];
    fillPoly(g, snout, body, { light: 0.32 });
    if (H.skull) { // cara de caveira: órbita funda e placas ósseas claras
      fillPoly(g, [[X(1), Y(-4.2)], [X(10), Y(-3.2)], [X(12.5), Y(-1.4)], [X(4), Y(-0.6)]], mix(c3, body, 0.25), { light: 0.25 });
      g.fillStyle = '#0c0a10'; g.beginPath(); g.ellipse(X(5.6), Y(-1.6), 2.9 * s, 2.3 * s, 0, 0, 7); g.fill();
    }
    // boca
    const open = 1.3 + b * 0.5;
    fillPoly(g, [[X(2), Y(2.2)], [X(sn + 0.8), Y(1.8)], [X(sn - 0.6), Y(2.6 + open)], [X(2), Y(3 + open)]], '#3a0a10', { light: 0.1, dark: 0.1 });
    if (age > 0) fillPoly(g, [[X(6), Y(2.6)], [X(sn - 0.6), Y(2.4)], [X(sn - 1.6), Y(2.4 + open * 0.8)], [X(6), Y(2.8 + open * 0.8)]], P.glow, { light: 0.4, dark: 0.1 });
    fillPoly(g, [[X(-1), Y(2.8 + open)], [X(sn - 0.4), Y(3.2 + open)], [X(sn - 2.2), Y(6 + open)], [X(-1), Y(6.2)]], sh(body, -0.12));
    fillPoly(g, [[X(1), Y(4.4 + open)], [X(sn - 2.4), Y(4.4 + open)], [X(sn - 3.4), Y(6 + open)], [X(1), Y(6.3)]], P.c2, { light: 0.2 });
    g.fillStyle = '#f6efe0';
    const nT = Math.round(5 + L * 1.5);
    for (let i = 0; i < nT; i++) { const x = X(4 + i * (sn - 5) / nT); g.beginPath(); g.moveTo(x, Y(2.2)); g.lineTo(x + 0.9 * s, Y(2.2)); g.lineTo(x + 0.45 * s, Y(2.2 + 1.4)); g.closePath(); g.fill(); }
    for (let i = 0; i < nT - 1; i++) { const x = X(5 + i * (sn - 6) / nT); g.beginPath(); g.moveTo(x, Y(2.9 + open)); g.lineTo(x + 0.9 * s, Y(2.9 + open)); g.lineTo(x + 0.45 * s, Y(1.8 + open)); g.closePath(); g.fill(); }
    // narina, sobrancelha, olho
    g.fillStyle = sh(body, -0.6); g.beginPath(); g.ellipse(X(sn + 0.5), Y(-1.2), 1.1 * s, 0.6 * s, -0.3, 0, 7); g.fill();
    if (!H.skull) fillPoly(g, [[X(0.5), Y(-4.8)], [X(9.5), Y(-3.8)], [X(8.2), Y(-2.1)], [X(1), Y(-2.6)]], sh(body, -0.08), { light: 0.4 });
    const ex = X(5.6), ey = Y(-1.5), er = (H.skull ? 1.15 : age === 0 ? 1.8 : 1.45) * s;
    g.fillStyle = sh(P.eye, -0.45); g.beginPath(); g.ellipse(ex, ey, er * 1.3, er, -0.15, 0, 7); g.fill();
    g.fillStyle = P.eye; g.beginPath(); g.ellipse(ex, ey, er, er * 0.78, -0.15, 0, 7); g.fill();
    g.fillStyle = '#140808'; g.beginPath(); g.ellipse(ex + 0.2 * s, ey, er * 0.28, er * 0.72, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.fillRect(ex - er * 0.6, ey - er * 0.6, Math.max(1, er * 0.45), Math.max(1, er * 0.45));
    // ---- enfeites da frente
    if (H.noseHorn === 'big') { horn(g, [[X(sn - 3), Y(-2.6)], [X(sn - 1.2), Y(-8 * hk)], [X(sn - 3.6), Y(-13 * hk)]], 3.6 * s, c3); horn(g, [[X(sn - 7), Y(-3.4)], [X(sn - 6), Y(-6.5 * hk)]], 1.7 * s, c3); }
    if (H.snoutHorn) horn(g, [[X(sn - 1.5), Y(-2.4)], [X(sn - 0.8), Y(-4.2)], [X(sn - 1.4), Y(-5.4)]], 1.4 * s, c3);
    if (H.cheek === 'spikes') for (let i = 0; i < 3; i++) horn(g, [[X(-3 + i), Y(1 + i * 1.5)], [X(-8 - i), Y(1 + i * 2.5)], [X(-12 - i * 1.5), Y(2 + i * 3)]], 1.8 * s, c3);
    if (H.jaw === 'spikes') for (let i = 0; i < 4; i++) horn(g, [[X(-2 + i * 2.2), Y(5.6)], [X(-4 + i * 2.2), Y(8)], [X(-6 + i * 2.2), Y(9.6)]], 1.6 * s, c3);
    if (H.jaw === 'hornlets') for (let i = 0; i < 5; i++) horn(g, [[X(i * 2.3), Y(5.8)], [X(i * 2.3 - 1), Y(8.4)]], 1.3 * s, c3);
    if (H.jaw === 'frost') for (let i = 0; i < 4; i++) fillPoly(g, [[X(-1 + i * 2.6), Y(5.8)], [X(-0.2 + i * 2.6), Y(9.5 + (i % 2) * 2)], [X(1 + i * 2.6), Y(5.8)]], '#ffffff', { light: 0.1, dark: 0.25 });
    if (H.jaw === 'fins') fillPoly(g, [[X(-2), Y(4)], [X(-10), Y(7)], [X(-6), Y(9)], [X(2), Y(6)]], mix(P.c2, body, 0.5), { light: 0.3 });
    if (H.beard === 'frill') { const fr = [[X(0), Y(5.5)], [X(-6), Y(12)], [X(-1), Y(10)], [X(3), Y(13)], [X(6), Y(6)]]; fillPoly(g, fr, mix(P.c2, body, 0.3), { light: 0.35 }); }
    if (H.beard === 'tendrils' || H.beard === 'long') for (let i = 0; i < 5; i++) horn(g, [[X(1 + i * 2), Y(6)], [X(i * 2), Y(9 + (i % 2) * 2)], [X(-1 + i * 2), Y((H.beard === 'long' ? 14 : 11) + (i % 2) * 3)]], 1.8 * s, sh(P.c2, -0.1));
    if (H.beard === 'spines') for (let i = 0; i < 5; i++) horn(g, [[X(i * 2.4), Y(5.8)], [X(i * 2.4 - 2), Y(10 + (i % 2) * 1.5)]], 1.4 * s, c3);
    if (H.whiskers) { curve(g, [[X(sn), Y(0.6)], [X(sn - 4), Y(8)], [X(6), Y(13)], [X(-4), Y(15)]], 0.9 * s, c3); curve(g, [[X(sn - 1), Y(-1.5)], [X(sn + 3), Y(-6)], [X(sn + 5), Y(-12)]], 0.8 * s, c3); }
  }

  // ------------------------------------------------------------ dorso
  function backRow(g, P, body, bx, by, rx, ry, bob) {
    const kind = P.back, c3 = P.c3;
    const n = 8, top = (t) => [bx - rx * 0.85 + t * rx * 1.6, by - ry * Math.sqrt(Math.max(0, 1 - Math.pow((t * 1.6 - 0.85), 2))) + 0.6 + bob];
    if (kind === 'sail') { // vela contínua com raios (verde)
      const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12, p = top(t); pts.push([p[0], p[1] - (7 + Math.sin(t * Math.PI) * 5) * (i % 2 ? 0.75 : 1)]); }
      const base = []; for (let i = 12; i >= 0; i--) { const p = top(i / 12); base.push([p[0], p[1] + 2]); }
      fillPoly(g, pts.concat(base), mix(P.c2, P.c1, 0.55), { light: 0.35 });
      for (let i = 0; i <= 12; i += 2) { const p = top(i / 12); line(g, [[p[0], p[1] + 1], pts[i]], 0.9, sh(P.c1, -0.35)); }
      return;
    }
    if (kind === 'smooth') return;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, p = top(t);
      const big = kind === 'bigSpikes' ? 5.4 : kind === 'smallSpikes' ? 2.6 : kind === 'ridge' ? 2 : kind === 'fins' ? 4 : kind === 'iceShards' ? 4.6 : 3.4;
      const Lh = big * (0.7 + 0.3 * Math.sin(t * Math.PI));
      if (kind === 'fins') fillPoly(g, [[p[0] - 2.4, p[1] + 1], [p[0] - 1.4, p[1] - Lh], [p[0] + 1.4, p[1] - Lh * 0.7], [p[0] + 2.4, p[1] + 1]], mix(P.c2, P.c1, 0.4), { light: 0.4 });
      else if (kind === 'ridge') fillPoly(g, [[p[0] - 2.2, p[1] + 1], [p[0] - 0.4, p[1] - Lh], [p[0] + 2.2, p[1] + 1]], sh(P.c1, -0.25), { light: 0.3 });
      else if (kind === 'iceShards') fillPoly(g, [[p[0] - 1.6, p[1] + 1], [p[0] - 0.8 + (i % 2), p[1] - Lh * (i % 2 ? 0.7 : 1)], [p[0] + 1.6, p[1] + 1]], i % 2 ? '#ffffff' : '#cfeaff', { light: 0.1, dark: 0.3 });
      else fillPoly(g, [[p[0] - 1.9, p[1] + 1.4], [p[0] - 1.1, p[1] - Lh], [p[0] + 1.9, p[1] + 1.4]], c3, { light: 0.42 });
    }
  }

  // ------------------------------------------------------------ desenho nas escamas
  function marks(g, P, bx, by, rx, ry) {
    const m = P.mark;
    if (!m) return;
    g.save(); g.beginPath(); g.ellipse(bx, by, rx, ry, 0, 0, 7); g.clip();
    if (m === 'bolts') for (let i = 0; i < 4; i++) { const x = bx - rx * 0.7 + i * rx * 0.45; line(g, [[x, by - ry * 0.8], [x + 2, by - ry * 0.35], [x - 1, by - ry * 0.15], [x + 2.5, by + ry * 0.3]], 0.9, mix(P.c2, P.c1, 0.3)); }
    if (m === 'spots') for (let i = 0; i < 9; i++) { g.fillStyle = sh(P.c1, -0.22); g.beginPath(); g.ellipse(bx - rx * 0.75 + (i % 5) * rx * 0.36 + (i > 4 ? rx * 0.18 : 0), by - ry * 0.55 + (i > 4 ? ry * 0.35 : 0), 1.6, 1.1, 0, 0, 7); g.fill(); }
    if (m === 'drip') for (let i = 0; i < 5; i++) { const x = bx - rx * 0.6 + i * rx * 0.3; line(g, [[x, by - ry * 0.4], [x + 0.3, by + ry * 0.2]], 0.9, mix(P.glow, P.c1, 0.55)); }
    if (m === 'bands') for (let i = 0; i < 5; i++) { const x = bx - rx * 0.75 + i * rx * 0.36; line(g, [[x, by - ry], [x + 3, by + ry]], 1.6, sh(P.c1, -0.18)); }
    if (m === 'verdigris') for (let i = 0; i < 10; i++) { g.fillStyle = mix(P.c3, P.c1, 0.35); g.globalAlpha = 0.7; g.beginPath(); g.ellipse(bx - rx * 0.8 + (i * 7.3) % (rx * 1.6), by - ry * 0.6 + ((i * 5.1) % (ry * 0.9)), 2.1, 1.3, i, 0, 7); g.fill(); }
    if (m === 'lava') { const L = sh(P.glow, 0.1); line(g, [[bx - rx * 0.6, by - 3], [bx - rx * 0.3, by + 2], [bx, by - 2], [bx + rx * 0.35, by + 3], [bx + rx * 0.6, by]], 1.1, L); line(g, [[bx - rx * 0.2, by + 5], [bx + rx * 0.1, by + 3], [bx + rx * 0.3, by + 6]], 0.9, L); }
    g.restore();
  }

  // ------------------------------------------------------------ pintura completa (coordenadas 180 × 112, pintada em 3× e recortada)
  DR.paint = (variant, frame = 0, opts = {}) => {
    const base = DR.VARIANTS[variant] || DR.VARIANTS.vermelho;
    const P = Object.assign({}, base, opts, { head: Object.assign({}, base.head, opts.head || {}) });
    const age = P.age ?? 1, wyv = P.form === 'wyvern', b = frame ? 1 : 0;
    const c = document.createElement('canvas'); c.width = LW * RES; c.height = LH * RES;
    const g = c.getContext('2d');
    g.scale(RES, RES);
    const flap = b * 1.8, bob = b * 0.6;
    const c1 = P.c1;
    // proporções: filhotes têm cabeça grande, pescoço e asas curtos
    const young = age === 0, old = age === 2;
    const bodyL = P.body[0] * (young ? 0.86 : 1), bodyH = P.body[1] * (young ? 1.05 : 1);
    const rx = 22 * bodyL, ry = 11.5 * bodyH;
    const legLen = P.leg[1] * (young ? 0.85 : 1), legW = 8.4 * P.leg[0];
    const neckL = P.neck[0] * (young ? 0.7 : 1), neckW = P.neck[1];
    const wingS = P.wing[0] * (young ? 0.72 : old ? 1.08 : 1);
    const footY = GROUND - 0.5, legH = 21 * legLen;
    const by = (wyv ? footY - legH - 4 : footY - legH - ry * 0.35), bx = 14 + rx * 1.25 + 29 * P.tail[0] + 12;
    const hipX = bx - rx * 0.58, shX = bx + rx * 0.55;
    // ---- asa de lá
    const wingBase = [bx + rx * 0.3, by - ry * 0.82 + bob];
    const shape = P.wing[1];
    // cada forma de asa tem envergadura e pontas próprias
    const WS = { bat: [1, 1], ragged: [1.12, 1.1], tattered: [1.05, 1.05], short: [0.8, 0.75], long: [1.35, 0.9], ridged: [1, 1], spurred: [1.05, 1.05], tailMembrane: [1.2, 0.7] }[shape] || [1, 1];
    const span = 34 * wingS * WS[0], lift = 34 * wingS * WS[1];
    const wy = (k) => Math.max(3, by - lift * k);
    const tailMembrane = shape === 'tailMembrane';
    const attachFar = tailMembrane ? [[bx - rx * 0.8, by - ry * 0.5], [bx - rx * 1.5, by + 4]] : [[bx - rx * 0.05, by - ry * 0.95]];
    const tipsFar = [[wingBase[0] - span * 0.95, wy(1.12)], [wingBase[0] - span * 1.25, wy(0.8)], [wingBase[0] - span * 1.2, wy(0.45)], [wingBase[0] - span * 0.8, wy(0.16)]];
    if (!wyv) wing(g, P, [wingBase[0] - 3, wingBase[1] - 1], [wingBase[0] - 12, wy(1.08)], tailMembrane ? tipsFar.concat([[bx - rx * 1.45, by - 2]]) : tipsFar, attachFar, sh(P.mem, -0.28), sh(c1, -0.35), flap, true);
    // ---- cauda
    const tl = P.tail[0], tw = P.tail[1];
    const tailPts = [[bx - rx * 0.86, by + 1], [bx - rx * 1.25, by + 9], [bx - rx * 1.25 - 14 * tl, by + 13], [bx - rx * 1.25 - 24 * tl, by + 8], [bx - rx * 1.25 - 29 * tl, by - 2]];
    const tail = tube(g, tailPts, 12 * tw * bodyH, 1.8, c1, { pow: 0.7 });
    if (P.back === 'sail') spinesOn(g, tail, 'B', 0.05, 0.8, 6, 4.5, mix(P.c2, c1, 0.55), { wide: 3 });
    else if (P.back !== 'smooth') spinesOn(g, tail, 'B', 0.05, 0.85, 7, P.back === 'bigSpikes' ? 3.4 : 2.4, P.back === 'iceShards' ? '#ffffff' : P.c3, { taper: true });
    plates(g, tail, 'A', 0.05, 0.8, 9, P.c2);
    const end = tail.S[tail.S.length - 1], pre = tail.S[tail.S.length - 4], ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
    g.save(); g.translate(end[0], end[1]); g.rotate(ang);
    const tip = P.tail[2];
    if (tip === 'spade') fillPoly(g, [[-1, 0], [2, -5.5], [10, -1.5], [11, 0], [10, 1.5], [2, 5.5]], P.c3, { light: 0.45 });
    if (tip === 'blade') fillPoly(g, [[-2, -0.6], [10, -3.4], [3, 2.6]], P.c3, { light: 0.4 });
    if (tip === 'spikes') for (const a of [-0.8, -0.25, 0.3, 0.85]) fillPoly(g, [[-1, -1], [Math.cos(a) * 7.5, Math.sin(a) * 7.5], [-1, 1]], P.back === 'iceShards' ? '#ffffff' : P.c3, { light: 0.4 });
    if (tip === 'leaf') fillPoly(g, [[-1, 0], [3, -4.5], [11, 0], [3, 4.5]], mix(P.c2, c1, 0.4), { light: 0.4 });
    if (tip === 'fin') fillPoly(g, [[-3, 0], [2, -6], [7, -5], [9, 0], [7, 5], [2, 6]], mix(P.c2, c1, 0.35), { light: 0.4 });
    if (tip === 'feather') for (let i = 0; i < 3; i++) fillPoly(g, [[-2, 0], [4 + i, -5 + i * 4], [9, -2 + i * 2], [3, 1 + i]], mix(P.c2, c1, 0.25 + i * 0.1), { light: 0.4 });
    if (tip === 'paddle') fillPoly(g, [[-4, -1], [3, -6], [10, -4], [12, 0], [10, 4], [3, 6], [-4, 1]], mix(P.c3, c1, 0.35), { light: 0.35 });
    if (tip === 'club') { blob(g, 2.5, 0, 4.4, 3.6, sh(c1, -0.1)); for (const a of [-1.2, -0.4, 0.4, 1.2]) fillPoly(g, [[2.5 + Math.cos(a) * 3, Math.sin(a) * 3 - 1], [2.5 + Math.cos(a) * 7, Math.sin(a) * 7], [2.5 + Math.cos(a) * 3, Math.sin(a) * 3 + 1]], P.c3); }
    if (tip === 'stinger') { fillPoly(g, [[-1, -2.4], [11, 0], [-1, 2.4]], P.c3, { light: 0.4 }); fillPoly(g, [[1, -1.6], [4.5, -5], [3.4, -1]], P.c3); }
    g.restore();
    // ---- patas de lá (mais escuras)
    const hindLeg = (x, far) => leg(g, P, [[x, by + ry * 0.3], [x + 5, by + ry * 0.3 + legH * 0.42], [x - 1.5, by + ry * 0.3 + legH * 0.76], [x + 1, footY]], legW * (wyv ? 1.25 : 1), c1, far, false);
    const foreLeg = (x, far) => leg(g, P, [[x, by + ry * 0.35], [x - 3, by + ry * 0.35 + legH * 0.45], [x + 1, by + ry * 0.35 + legH * 0.8], [x + 2, footY]], legW * 0.88, c1, far, true);
    if (wyv) hindLeg(bx - 3, true);
    else { hindLeg(hipX + 4, true); foreLeg(shX + 4, true); }
    // ---- tronco
    blob(g, bx, by + bob * 0.5, rx, ry, c1);
    scaleTex(g, bx, by - 1 + bob * 0.5, rx * 0.92, ry * 0.85, c1);
    g.save(); g.beginPath(); g.ellipse(bx, by + bob * 0.5, rx, ry, 0, 0, 7); g.clip();
    blob(g, bx + 1, by + ry * 0.8 + bob * 0.5, rx * 0.82, ry * 0.45, P.c2, { light: 0.25, dark: 0.25 });
    for (let i = 0; i < 8; i++) line(g, [[bx - rx * 0.7 + i * rx * 0.2, by + ry * 0.45 + bob * 0.5], [bx - rx * 0.66 + i * rx * 0.2, by + ry]], 0.7, sh(P.c2, -0.35));
    g.restore();
    marks(g, P, bx, by + bob * 0.5, rx, ry);
    // ---- asa de cá (erguida para trás, a membrana prende no dorso: não cobre as patas)
    const attachNear = tailMembrane ? [[bx - rx * 0.6, by - ry * 0.7], [bx - rx * 1.35, by + 1]] : [[bx + rx * 0.08, by - ry * 0.92]];
    const tipsNear = [[wingBase[0] - span * 0.55, wy(0.98)], [wingBase[0] - span * 0.9, wy(0.66)], [wingBase[0] - span * 0.88, wy(0.36)], [wingBase[0] - span * 0.55, wy(0.12)]];
    if (!wyv) wing(g, P, wingBase, [wingBase[0] - 4, wy(0.9)], tailMembrane ? tipsNear.concat([[bx - rx * 1.2, by - 4]]) : tipsNear, attachNear, P.mem, sh(c1, -0.08), flap, false);
    // ---- dorso (vela/espinhos) por cima da raiz da asa, para a silhueta de cada cor aparecer
    backRow(g, P, c1, bx, by, rx, ry, bob * 0.5);
    // ---- patas de cá
    if (wyv) { blob(g, bx - 7, by + ry * 0.35, legW * 1.1, ry * 0.75, c1, { light: 0.35 }); hindLeg(bx - 8, false); }
    else {
      blob(g, hipX + 1, by + ry * 0.3, legW * 0.95, ry * 0.7, c1, { light: 0.35 }); hindLeg(hipX, false);
      blob(g, shX + 0.5, by + ry * 0.32, legW * 0.75, ry * 0.6, c1, { light: 0.35 }); foreLeg(shX, false);
    }
    // ---- pescoço
    const hx = bx + rx + 18 * neckL + (wyv ? 2 : 0), hy = by - 26 * neckL - (young ? 0 : 4) + bob;
    const neck = tube(g, [[bx + rx * 0.62, by - ry * 0.15 + bob * 0.5], [bx + rx + 4 * neckL, by - 10 * neckL], [hx - 8 * neckL, hy + 9 * neckL], [hx - 3, hy + 2]], 15 * neckW * bodyH, 8.5 * neckW, c1, { n: 26 });
    plates(g, neck, 'A', 0.12, 0.9, 8, P.c2);
    for (let i = 2; i < neck.S.length - 2; i += 3) { const p = neck.A[i], q = neck.S[i]; line(g, [[q[0] + (p[0] - q[0]) * 0.45, q[1] + (p[1] - q[1]) * 0.45], p], 2.2, mix(P.c2, c1, 0.25)); }
    if (P.back === 'sail' || P.head.crest === 'sail') spinesOn(g, neck, 'B', 0.05, 0.95, 6, 6, mix(P.c2, c1, 0.55), { wide: 3, even: true });
    else if (P.back === 'fins') spinesOn(g, neck, 'B', 0.1, 0.9, 5, 4, mix(P.c2, c1, 0.4), { wide: 3 });
    else if (P.back !== 'smooth') spinesOn(g, neck, 'B', 0.1, 0.92, 5, P.back === 'bigSpikes' ? 4.4 : 3, P.back === 'iceShards' ? '#ffffff' : P.c3);
    // ---- serpe: as asas viram braços apoiados no chão (como um morcego)
    if (wyv) {
      const sx = bx + rx * 0.55, sy = by - ry * 0.4;
      const wristFar = [sx + 12, footY - 1], wristNear = [sx + 7, footY];
      for (const [wr, far] of [[wristFar, true], [wristNear, false]]) {
        const bone = far ? sh(c1, -0.3) : sh(c1, -0.06), memc = far ? sh(P.mem, -0.28) : P.mem;
        const dy = far ? -3 : 0, elbow = [sx - 4, sy + 6 + dy];
        // asa dobrada: a membrana fica em leque acima do antebraço, os dedos apontam para trás e para cima
        const tips = [[sx - 6, sy - 24 + dy - flap], [sx - 20, sy - 20 + dy - flap], [sx - 28, sy - 8 + dy - flap * 0.5]];
        g.save();
        const gr = g.createLinearGradient(0, sy - 26, 0, sy + 8); gr.addColorStop(0, sh(memc, 0.25)); gr.addColorStop(1, sh(memc, -0.3));
        g.fillStyle = gr; g.beginPath(); g.moveTo(elbow[0], elbow[1]); g.lineTo(tips[0][0], tips[0][1]);
        g.quadraticCurveTo(sx - 12, sy - 16 + dy, tips[1][0], tips[1][1]); g.quadraticCurveTo(sx - 20, sy - 8 + dy, tips[2][0], tips[2][1]);
        g.quadraticCurveTo(sx - 18, sy + 2 + dy, elbow[0] - 6, elbow[1] + 1); g.closePath(); g.fill(); g.restore();
        for (const t of tips) line(g, [elbow, t], 1.1, sh(bone, -0.1));
        tube(g, [[sx + 2, sy - 1 + dy], elbow], 6, 4.6, bone, { n: 10 });
        tube(g, [elbow, [elbow[0] + 6, elbow[1] + 8], wr], 4.6, 2.8, bone, { n: 14 });
        for (let k = 0; k < 3; k++) fillPoly(g, [[wr[0] + k * 1.8, wr[1] - 1.4], [wr[0] + 2.6 + k * 1.8, wr[1] + 0.6], [wr[0] + k * 1.8, wr[1] + 0.8]], '#efe6d2', { light: 0.35 });
      }
    }
    // ---- cabeça
    head(g, hx, hy, young ? 1.18 : old ? 1.06 : 1, P, age, b);
    // ---- fumaça/brasas/gelo do sopro saindo das narinas
    if (age > 0) { const nx = hx + (14.5 * P.head.len + 2) * (old ? 1.06 : 1), ny = hy - 1.4; g.save(); g.globalAlpha = 0.85; g.fillStyle = P.glow; g.beginPath(); g.ellipse(nx + 1.2, ny - 0.6 - b * 0.5, 1.1, 0.7, -0.4, 0, 7); g.fill(); g.restore(); }
    c._res = RES;
    return E.MS.finalize(c, { res: RES, crop: true });
  };

  // monstros com sprite 'dragon' (variação em def.dragon) e serpes ganham o pintor novo
  const prev = E.MS.draw;
  E.MS.draw = (spriteKey, def, frame) => {
    if (spriteKey === 'dragon' || spriteKey === 'wyvern') {
      const v = def.dragon || (def.boss ? 'obsidiana' : 'serpe');
      return DR.paint(v, frame === 'idle1' ? 1 : 0, def.dragonOpts || {});
    }
    return prev(spriteKey, def, frame);
  };

  E.DR = DR;
})();
