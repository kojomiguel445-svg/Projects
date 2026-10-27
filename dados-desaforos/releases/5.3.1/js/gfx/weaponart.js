/* Ilustrações vetoriais (SVG) das armas, por tipo e raridade. */
(() => {
  const WA = {};
  let uid = 0;
  const sh = (c, a) => E.SP.shade(c, a);

  function defs(id, c1, c2, rar) {
    const gold = rar >= 5 ? '#ffd98a' : rar === 4 ? '#e2c6ff' : rar === 3 ? '#cfe4ff' : '#d9dee5';
    return {
      gold,
      xml: `<defs>
        <linearGradient id="bl${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="${c1}"/><stop offset="1" stop-color="${sh(c1, -0.45)}"/></linearGradient>
        <linearGradient id="gd${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(gold, 0.4)}"/><stop offset=".5" stop-color="${gold}"/><stop offset="1" stop-color="${sh(gold, -0.5)}"/></linearGradient>
        <radialGradient id="gm${id}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".3" stop-color="${sh(c2, 0.3)}"/><stop offset="1" stop-color="${sh(c2, -0.4)}"/></radialGradient>
        <linearGradient id="wd${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a22"/><stop offset=".5" stop-color="#8a5a32"/><stop offset="1" stop-color="#4a2a18"/></linearGradient>
        <filter id="gl${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="sd${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".45"/></filter>
      </defs>`,
    };
  }

  const gem = (id, x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#gm${id})" filter="url(#gl${id})"/><circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="#fff" opacity=".8"/>`;

  function sword(id, d, v, rar) {
    const curved = d.base === 'cimitarra', thin = d.base === 'rapieira', short = d.base === 'espada_curta' || d.base === 'adaga';
    const L = short ? 0.72 : 1;
    let blade;
    if (curved) blade = `<path d="M40 60 Q 58 38 80 14 Q 72 34 46 66 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}" stroke-width=".8"/>`;
    else if (thin) blade = `<path d="M42 58 L 84 16 L 86 14 L 84 18 L 46 62 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}" stroke-width=".8"/>`;
    else blade = `<path d="M38 56 L ${38 + 42 * L} ${56 - 44 * L} L ${42 + 44 * L} ${52 - 46 * L} L ${44 + 42 * L} ${60 - 44 * L} L 46 64 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}" stroke-width=".8"/><path d="M42 60 L ${40 + 44 * L} ${54 - 44 * L}" stroke="#fff" stroke-width="1" opacity=".7"/>`;
    const guard = thin
      ? `<path d="M34 58 Q 40 48 50 54 Q 46 64 42 66 Q 36 66 34 58 Z" fill="url(#gd${id})" stroke="${sh('#000', 0)}" stroke-opacity=".3"/>`
      : `<path d="M28 54 L 34 50 L 52 68 L 48 72 Z" fill="url(#gd${id})"/>`;
    const deco = rar >= 4 ? `<path d="M${50 + 8 * L} ${48 - 8 * L} l 8 -2 l -2 8" fill="none" stroke="url(#gd${id})" stroke-width="2"/>` : '';
    return `${blade}${deco}${guard}<path d="M38 64 L 22 80" stroke="url(#wd${id})" stroke-width="6" stroke-linecap="round"/><path d="M36 66 l -2 2 M32 70 l -2 2 M28 74 l -2 2" stroke="#2a1a10" stroke-width="1.2"/>${gem(id, 20, 82, rar >= 4 ? 4.5 : 3.5)}${rar >= 3 ? gem(id, 40, 61, 2.6) : ''}`;
  }
  function claymore(id, d, v, rar) {
    const axe = d.base === 'machado_grande' || d.base === 'machado_batalha', hammer = d.base === 'malho' || d.base === 'martelo_guerra';
    if (axe) return `<path d="M24 84 L 74 26" stroke="url(#wd${id})" stroke-width="5" stroke-linecap="round"/><path d="M60 22 Q 86 18 90 42 Q 76 46 66 38 Q 60 44 56 52 Q 48 30 60 22 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}"/><path d="M58 28 L 70 40" stroke="url(#gd${id})" stroke-width="3"/>${gem(id, 66, 34, rar >= 4 ? 4 : 3)}`;
    if (hammer) return `<path d="M22 86 L 66 34" stroke="url(#wd${id})" stroke-width="5" stroke-linecap="round"/><g transform="rotate(-48 70 28)"><rect x="50" y="16" width="40" height="24" rx="4" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}"/><rect x="66" y="14" width="8" height="28" fill="url(#gd${id})"/></g>${gem(id, 70, 29, rar >= 4 ? 5 : 3.5)}`;
    return `<path d="M32 60 L 78 12 L 92 10 L 90 24 L 44 70 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}" stroke-width=".9"/><path d="M38 64 L 86 16" stroke="#fff" stroke-width="1.2" opacity=".6"/><path d="M24 54 L 32 48 L 54 70 L 48 76 Z" fill="url(#gd${id})"/><path d="M38 70 L 16 92" stroke="url(#wd${id})" stroke-width="7" stroke-linecap="round"/>${gem(id, 40, 62, rar >= 4 ? 4.2 : 3)}${rar >= 5 ? `<path d="M60 40 l 10 -10 M66 46 l 10 -10" stroke="url(#gd${id})" stroke-width="1.6"/>` : ''}`;
  }
  function polearm(id, d, v, rar) {
    const tri = d.base === 'tridente', glaive = d.base === 'glaive' || d.base === 'alabarda', staff = d.base === 'bordao';
    let head;
    if (tri) head = `<path d="M76 24 L 88 6 L 84 22 Z M76 24 L 92 14 L 82 28 Z M70 22 L 74 4 L 78 20 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}"/><path d="M66 30 L 82 18" stroke="url(#gd${id})" stroke-width="4"/>`;
    else if (glaive) head = `<path d="M70 30 Q 84 8 94 4 Q 92 22 76 36 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}"/>${d.base === 'alabarda' ? `<path d="M66 26 Q 58 14 66 8 Q 72 20 74 28 Z" fill="url(#bl${id})"/>` : ''}`;
    else if (staff) head = `<circle cx="80" cy="18" r="6" fill="url(#gd${id})"/>`;
    else head = `<path d="M74 26 L 92 6 L 82 30 Z" fill="url(#bl${id})" stroke="${sh(d.art.c1, -0.6)}"/><path d="M70 30 L 78 22" stroke="url(#gd${id})" stroke-width="5"/>`;
    return `<path d="M12 92 L 76 26" stroke="url(#wd${id})" stroke-width="4.5" stroke-linecap="round"/><path d="M30 74 l 4 4 M44 60 l 4 4" stroke="url(#gd${id})" stroke-width="2.2"/>${head}${gem(id, 70, 32, rar >= 4 ? 3.8 : 2.8)}${rar >= 5 ? `<path d="M66 24 q 10 -14 22 -6" fill="none" stroke="${d.art.c2}" stroke-width="1.4" opacity=".8" filter="url(#gl${id})"/>` : ''}`;
  }
  function bow(id, d, v, rar) {
    const xbow = (d.base || '').startsWith('besta');
    if (xbow) return `<path d="M20 80 L 70 30" stroke="url(#wd${id})" stroke-width="7" stroke-linecap="round"/><path d="M48 18 Q 78 22 86 52" fill="none" stroke="url(#gd${id})" stroke-width="5" stroke-linecap="round"/><path d="M48 18 L 86 52" stroke="#e8e8f0" stroke-width="1.2"/><path d="M58 40 L 88 10" stroke="url(#bl${id})" stroke-width="2.5"/><path d="M86 8 l 4 -2 l -2 4 Z" fill="${d.art.c1}"/>${gem(id, 64, 36, rar >= 4 ? 4.2 : 3)}`;
    return `<path d="M22 14 Q 74 26 86 78" fill="none" stroke="url(#wd${id})" stroke-width="5" stroke-linecap="round"/><path d="M22 14 Q 74 26 86 78" fill="none" stroke="url(#gd${id})" stroke-width="1.6" stroke-dasharray="3 6"/><path d="M22 14 L 86 78" stroke="#eef" stroke-width="1"/><path d="M16 50 L 64 40" stroke="url(#bl${id})" stroke-width="2"/><path d="M64 40 l -6 -4 l 10 3 l -8 5 Z" fill="${d.art.c1}"/>${gem(id, 58, 40, rar >= 4 ? 4.6 : 3.2)}<path d="M18 10 l 6 -4 M84 82 l 6 4" stroke="url(#gd${id})" stroke-width="3" stroke-linecap="round"/>`;
  }
  function catalyst(id, d, v, rar) {
    const c2 = d.art.c2, c1 = d.art.c1;
    const ring = (r, w, op = 1) => `<circle cx="50" cy="50" r="${r}" fill="none" stroke="url(#gd${id})" stroke-width="${w}" opacity="${op}"/>`;
    if (v === 2) { // tomo
      return `<g filter="url(#sd${id})"><path d="M20 30 L 50 24 L 80 30 L 80 78 L 50 72 L 20 78 Z" fill="${sh(c2, -0.35)}"/><path d="M24 32 L 50 27 L 50 70 L 24 75 Z" fill="${sh(c1, 0.1)}"/><path d="M76 32 L 50 27 L 50 70 L 76 75 Z" fill="${c1}"/><path d="M50 24 L 50 72" stroke="url(#gd${id})" stroke-width="2"/></g>${gem(id, 50, 48, rar >= 4 ? 6 : 4.5)}<path d="M30 40 h12 M30 46 h10 M58 40 h12 M58 46 h12" stroke="${sh(c2, -0.4)}" stroke-width="1.2" opacity=".6"/>`;
    }
    if (v === 1) { // lanterna / símbolo
      return `<path d="M50 10 L 50 20" stroke="url(#gd${id})" stroke-width="2.5"/><path d="M36 22 L 64 22 L 70 34 L 66 72 L 34 72 L 30 34 Z" fill="none" stroke="url(#gd${id})" stroke-width="3"/><path d="M38 34 L 62 34 L 60 68 L 40 68 Z" fill="${c1}" opacity=".35"/>${gem(id, 50, 50, rar >= 4 ? 9 : 7)}<path d="M32 76 L 68 76" stroke="url(#gd${id})" stroke-width="4" stroke-linecap="round"/>`;
    }
    // orbe / astrolábio
    return `${ring(34, 2.5)}${rar >= 4 ? `<ellipse cx="50" cy="50" rx="40" ry="14" fill="none" stroke="url(#gd${id})" stroke-width="1.6" transform="rotate(-25 50 50)"/>` : ''}${rar >= 5 ? `<ellipse cx="50" cy="50" rx="14" ry="40" fill="none" stroke="url(#gd${id})" stroke-width="1.4" transform="rotate(-25 50 50)"/>` : ''}<circle cx="50" cy="50" r="22" fill="url(#gm${id})" filter="url(#gl${id})"/><circle cx="43" cy="42" r="6" fill="#fff" opacity=".55"/>${[0, 1, 2, 3].map((i) => `<circle cx="${50 + Math.cos(i * 1.57 + 0.4) * 34}" cy="${50 + Math.sin(i * 1.57 + 0.4) * 34}" r="2.6" fill="url(#gd${id})"/>`).join('')}`;
  }

  // still: ícones pequenos sem animações nem filtros de brilho (leve para listas e celulares)
  WA.svg = (def, opts = {}) => {
    const out = svgFull(def, opts);
    return opts.still ? out.replace(/<animate(Transform)?[^>]*\/>/g, '').replace(/ filter="url\(#(gl|lb|bl2)[^)]*\)"/g, '') : out;
  };
  function svgFull(def, opts) {
    if (!def) return '';
    const id = 'w' + uid++;
    const rar = def.rarity || 1;
    const art = def.art || { c1: '#c9d1d9', c2: '#9aa3ad', v: 0 };
    const d = Object.assign({}, def, { art });
    const D = defs(id, art.c1, art.c2, rar);
    let body = '';
    // armas de linhagem (espécie + classe): desenho próprio por modelo
    if (art.tpl && E.WL && E.WL.T[art.tpl]) {
      const auraCol = art.c2 || '#ffd36b';
      return `<svg class="wart r5 lin ${opts.cls || ''}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${D.xml.replace('</defs>', E.WL.defs(id, Object.assign({ c1: '#d8dde6', c2: '#ffd36b', c3: '#d4af37' }, art)) + (E.WSIG ? E.WSIG.defs(id) : '') + '</defs>')}${opts.aura !== false && E.WSIG ? E.WSIG.aura(id, auraCol) : ''}<g transform="translate(50 50) scale(.86) translate(-50 -50)"><g filter="url(#sd${id})">${E.WL.draw(id, def)}</g></g></svg>`;
    }
    const sigId = Object.keys(E.W.CATALOG).find((k) => E.W.CATALOG[k] === def);
    if (rar >= 5 && E.WSIG && sigId && E.WSIG[sigId]) {
      const auraCol = art.c2 || '#ffd36b';
      return `<svg class="wart r5 ${opts.cls || ''}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${D.xml.replace('</defs>', E.WSIG.defs(id) + (E.WSIG.defsV3 ? E.WSIG.defsV3(id) : '') + '</defs>')}${opts.aura !== false ? E.WSIG.aura(id, auraCol) : ''}<g transform="translate(50 50) scale(.84) translate(-50 -50)"><g filter="url(#sd${id})">${E.WSIG[sigId](id)}</g></g></svg>`;
    }
    if (def.type === 'espada') body = sword(id, d, art.v, rar);
    else if (def.type === 'espadao') body = claymore(id, d, art.v, rar);
    else if (def.type === 'haste') body = polearm(id, d, art.v, rar);
    else if (def.type === 'arco') body = bow(id, d, art.v, rar);
    else body = catalyst(id, d, art.v, rar);
    const sparkle = rar >= 4 ? `<g opacity=".9" filter="url(#gl${id})">${[[78, 70, 2.4], [26, 26, 1.8], [84, 40, 1.4]].map(([x, y, r]) => `<path d="M${x} ${y - r * 2} L${x + r * 0.5} ${y - r * 0.5} L${x + r * 2} ${y} L${x + r * 0.5} ${y + r * 0.5} L${x} ${y + r * 2} L${x - r * 0.5} ${y + r * 0.5} L${x - r * 2} ${y} L${x - r * 0.5} ${y - r * 0.5} Z" fill="${D.gold}"/>`).join('')}</g>` : '';
    return `<svg class="wart r${rar} ${opts.cls || ''}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${D.xml}<g transform="translate(50 50) scale(.88) translate(-50 -50)"><g filter="url(#sd${id})">${body}</g></g>${sparkle}</svg>`;
  }

  WA.stars = (n) => `<span class="stars r${n}">${'★'.repeat(n)}</span>`;
  WA.typeIcon = (type) => {
    const p = {
      espada: '<path d="M4 20 L 16 8 L 19 5 L 18 8 L 6 20 Z M3 17 l 4 4 M2 22 l 2 -2" />',
      espadao: '<path d="M3 21 L 15 9 L 20 4 L 19 10 L 7 21 Z M2 18 l 4 4" />',
      haste: '<path d="M3 21 L 18 6 M15 4 l 6 -1 -1 6 Z" />',
      arco: '<path d="M6 3 Q 21 8 21 18 M6 3 L 21 18 M4 14 L 15 11" fill="none"/>',
      catalisador: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="9.5" fill="none"/>',
    }[type] || '';
    return `<svg class="ticon" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${p}</svg>`;
  };

  E.WA = WA;
})();
