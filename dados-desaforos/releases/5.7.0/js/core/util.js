/* Elarion — utilidades base: RNG, dados, DOM e eventos. */
window.E = window.E || {};
(() => {
  const U = {};

  // ---------- aleatoriedade ----------
  U.rand = () => {
    if (window.crypto && crypto.getRandomValues) {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] / 4294967296;
    }
    return Math.random();
  };
  U.die = (sides) => 1 + Math.floor(U.rand() * sides);
  U.pick = (arr) => arr[Math.floor(U.rand() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(U.rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // RNG determinístico (mundo procedural)
  U.seeded = (seed) => {
    let s = seed >>> 0 || 1;
    return () => {
      s ^= s << 13; s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  };

  // ---------- notação de dados ----------
  // "2d6+3" -> {n:2, s:6, mod:3}
  U.parseDice = (expr) => {
    if (typeof expr === 'number') return { n: 0, s: 0, mod: expr };
    const m = String(expr).replace(/\s/g, '').match(/^(\d*)d(\d+)([+-]\d+)?$/i);
    if (!m) return { n: 0, s: 0, mod: Number(expr) || 0 };
    return { n: Number(m[1] || 1), s: Number(m[2]), mod: Number(m[3] || 0) };
  };
  U.avgDice = (expr) => {
    const d = U.parseDice(expr);
    return Math.floor(d.n * (d.s + 1) / 2) + d.mod;
  };
  U.diceStr = (n, s, mod = 0) => `${n}d${s}${mod ? (mod > 0 ? '+' + mod : mod) : ''}`;

  U.mod = (score) => Math.floor((score - 10) / 2);
  U.sign = (n) => (n >= 0 ? '+' + n : '−' + Math.abs(n));
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.ease = {
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
  };
  U.wait = (ms) => new Promise((r) => setTimeout(r, ms));
  U.uid = () => Date.now().toString(36) + Math.floor(U.rand() * 1e9).toString(36);

  // ---------- DOM ----------
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    const el = t.content.firstElementChild;
    if (E.Icons) E.Icons.hydrate(el);
    return el;
  };

  // ---------- barramento de eventos ----------
  const listeners = {};
  U.on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); return () => U.off(ev, fn); };
  U.off = (ev, fn) => { listeners[ev] = (listeners[ev] || []).filter((f) => f !== fn); };
  U.emit = (ev, data) => { (listeners[ev] || []).slice().forEach((f) => { try { f(data); } catch (e) { console.error(e); } }); };

  // ---------- armazenamento seguro ----------
  U.load = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  };
  U.save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  };

  U.isTouch = () => matchMedia('(pointer: coarse)').matches;
  U.reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || (E.state && E.state.settings && E.state.settings.reducedMotion);

  E.U = U;
})();
