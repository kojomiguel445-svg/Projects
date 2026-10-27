/* Ilustrações exclusivas das armas ★5 (cada uma com desenho próprio) e aura animada. */
(() => {
  const SIG = {};
  const star = (x, y, r, fill, extra = '') => `<path d="M${x} ${y - r * 2.2} Q${x + r * 0.3} ${y - r * 0.3} ${x + r * 2.2} ${y} Q${x + r * 0.3} ${y + r * 0.3} ${x} ${y + r * 2.2} Q${x - r * 0.3} ${y + r * 0.3} ${x - r * 2.2} ${y} Q${x - r * 0.3} ${y - r * 0.3} ${x} ${y - r * 2.2} Z" fill="${fill}" ${extra}/>`;
  const twinkle = (id, pts, fill) => pts.map(([x, y, r], i) => `<g>${star(x, y, r, fill, `filter="url(#gl${id})"`)}<animate attributeName="opacity" values="1;.25;1" dur="${1.6 + i * 0.37}s" repeatCount="indefinite"/></g>`).join('');

  // defs extras usadas pelas assinaturas
  SIG.defs = (id) => `
    <linearGradient id="sun${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="#fff4c8"/><stop offset=".6" stop-color="#ffd36b"/><stop offset="1" stop-color="#ff9a2a"/></linearGradient>
    <linearGradient id="core${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>
    <linearGradient id="vio${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2a1040"/><stop offset=".5" stop-color="#5a2a8a"/><stop offset="1" stop-color="#b07aff"/></linearGradient>
    <linearGradient id="ice${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#e6fbff"/><stop offset=".5" stop-color="#9fe3ff"/><stop offset="1" stop-color="#3a9ad0"/></linearGradient>
    <linearGradient id="sea${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0a3a5a"/><stop offset=".5" stop-color="#2f8ac0"/><stop offset="1" stop-color="#9fe3ff"/></linearGradient>
    <linearGradient id="fire${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a1a"/><stop offset=".5" stop-color="#ffa040"/><stop offset="1" stop-color="#fff2a8"/></linearGradient>
    <linearGradient id="pink${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffc6e8"/><stop offset="1" stop-color="#ff6bb5"/></linearGradient>
    <radialGradient id="halo${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".9"/><stop offset=".45" stop-color="#ffd36b" stop-opacity=".35"/><stop offset="1" stop-color="#ffb84d" stop-opacity="0"/></radialGradient>
    <filter id="bl2${id}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>`;

  // aura animada atrás da arma (círculo rúnico girando + brilho)
  SIG.aura = (id, color = '#ffd36b') => `<g opacity=".95">
    <circle cx="50" cy="50" r="40" fill="${color}" opacity=".18" filter="url(#bl2${id})"/>
    <g transform="translate(50 50)"><g>
      <circle r="44" fill="none" stroke="${color}" stroke-width=".6" opacity=".55" stroke-dasharray="1 3"/>
      <circle r="40" fill="none" stroke="${color}" stroke-width=".9" opacity=".45"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<path d="M${Math.cos(a) * 40} ${Math.sin(a) * 40} l${Math.cos(a) * 4} ${Math.sin(a) * 4}" stroke="${color}" stroke-width="1" opacity=".6"/>`; }).join('')}
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite"/></g></g>
  </g>`;

  SIG.aurora_elarion = (id) => `
    <g>
      <circle cx="40" cy="62" r="20" fill="url(#halo${id})"><animate attributeName="r" values="18;23;18" dur="3s" repeatCount="indefinite"/></circle>
      ${Array.from({ length: 9 }, (_, i) => { const a = (-150 + i * 30) * Math.PI / 180; return `<path d="M${40 + Math.cos(a) * 9} ${62 + Math.sin(a) * 9} L${40 + Math.cos(a) * 19} ${62 + Math.sin(a) * 19}" stroke="#ffd36b" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`; }).join('')}
    </g>
    <path d="M36 58 L 86 8 L 92 6 L 90 12 L 42 64 Z" fill="url(#sun${id})" stroke="#b8862a" stroke-width=".7"/>
    <path d="M40 60 L 89 9" stroke="url(#core${id})" stroke-width="2.4" stroke-linecap="round" filter="url(#gl${id})"><animate attributeName="opacity" values=".6;1;.6" dur="2s" repeatCount="indefinite"/></path>
    <path d="M58 40 l6 -2 -2 6 M70 28 l5 -1.5 -1.5 5" fill="none" stroke="#fff" stroke-width=".8" opacity=".8"/>
    <path d="M28 52 Q40 46 52 70 Q44 68 40 62 Q34 58 28 52 Z" fill="url(#gd${id})" stroke="#8a5a10" stroke-width=".6"/>
    <circle cx="40" cy="62" r="5.2" fill="url(#gd${id})" stroke="#8a5a10" stroke-width=".6"/>
    <circle cx="40" cy="62" r="3.4" fill="#fff6c8" filter="url(#gl${id})"/>
    <path d="M38 66 L 20 84" stroke="#f6f1e7" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M36 68 l -2 2 M32 72 l -2 2 M28 76 l -2 2 M24 80 l -1.5 1.5" stroke="#d4af37" stroke-width="1.4"/>
    <path d="M17 81 l4 -4 4 4 -4 4 Z" fill="url(#gm${id})" filter="url(#gl${id})"/>
    ${twinkle(id, [[80, 22, 1.6], [62, 30, 1.1], [90, 34, 1.2], [56, 18, 0.9]], '#fff6c8')}`;

  SIG.veu_juiza = (id) => `
    <path d="M22 86 Q 10 70 18 58 Q 24 70 34 74 Q 26 80 22 86 Z" fill="url(#pink${id})" opacity=".55"><animate attributeName="d" values="M22 86 Q 10 70 18 58 Q 24 70 34 74 Q 26 80 22 86 Z;M22 86 Q 6 74 14 60 Q 24 72 34 74 Q 26 80 22 86 Z;M22 86 Q 10 70 18 58 Q 24 70 34 74 Q 26 80 22 86 Z" dur="3s" repeatCount="indefinite"/></path>
    <path d="M44 56 L 90 10 L 91 9 L 90 11 L 46 58 Z" fill="url(#bl${id})" stroke="#9a6a9a" stroke-width=".5"/>
    <path d="M45 57 L 89 11" stroke="#fff" stroke-width=".8" opacity=".9"/>
    <path d="M30 60 Q 34 44 48 46 Q 56 50 54 58 Q 50 70 38 70 Q 30 68 30 60 Z" fill="none" stroke="url(#gd${id})" stroke-width="2.2"/>
    <path d="M34 62 Q 38 52 48 52 M36 66 Q 44 64 50 56" fill="none" stroke="url(#gd${id})" stroke-width="1.2"/>
    <path d="M38 52 Q 46 46 54 50 Q 52 56 46 56 Q 42 58 38 56 Z" fill="#f0e6ff" stroke="#8a5a8a" stroke-width=".6"/>
    <path d="M41 52.5 l3 1 M48 52 l3 0" stroke="#3a1a3a" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M38 66 L 26 78" stroke="#3a1a3a" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="24" cy="80" r="3.6" fill="url(#gm${id})" filter="url(#gl${id})"/>
    ${twinkle(id, [[74, 20, 1.3], [62, 36, 1], [86, 30, 1.1]], '#ffc6e8')}`;

  SIG.coroa_partida = (id) => `
    <path d="M30 62 L 74 16 L 92 8 L 86 26 L 42 72 Z" fill="url(#vio${id})" stroke="#1a0a28" stroke-width=".8"/>
    <path d="M44 56 L 52 50 L 50 44 L 60 38 L 58 32 L 70 24" fill="none" stroke="#e2c6ff" stroke-width="1.4" filter="url(#gl${id})"><animate attributeName="opacity" values=".5;1;.5" dur="1.8s" repeatCount="indefinite"/></path>
    <path d="M36 66 L 82 18" stroke="#b07aff" stroke-width=".7" opacity=".7"/>
    <path d="M18 56 L 22 46 L 26 54 L 30 42 L 34 52 L 38 40 L 42 50 L 46 40 L 48 50 L 54 46 L 50 58 L 30 76 L 22 70 Z" fill="url(#gd${id})" stroke="#5a3a10" stroke-width=".7"/>
    <path d="M30 68 L 40 58" stroke="#5a3a10" stroke-width=".8"/>
    <circle cx="36" cy="60" r="4" fill="#2a0a3a" stroke="#ffd36b" stroke-width="1"/>
    <circle cx="36" cy="60" r="2" fill="#ff5d79" filter="url(#gl${id})"><animate attributeName="r" values="1.6;2.4;1.6" dur="2.2s" repeatCount="indefinite"/></circle>
    <path d="M36 70 L 14 92" stroke="#2a1a3a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M32 74 l -3 3 M27 79 l -3 3 M22 84 l -3 3" stroke="#b07aff" stroke-width="1.2"/>
    <path d="M60 60 q 6 4 4 10 q -2 6 2 10" fill="none" stroke="#8a8f99" stroke-width="1.4" stroke-dasharray="2.4 1.2"/>
    <circle cx="20" cy="40" r="10" fill="#7b2cff" opacity=".25" filter="url(#bl2${id})"/>
    ${twinkle(id, [[80, 34, 1.3], [66, 12, 1], [90, 50, 1]], '#d8b8ff')}`;

  SIG.martelo_sol = (id) => `
    <path d="M18 88 L 58 40" stroke="#4a2a18" stroke-width="5" stroke-linecap="round"/>
    <path d="M26 79 l 4 3 M34 69 l 4 3 M42 60 l 4 3" stroke="#ffd36b" stroke-width="2"/>
    <g transform="rotate(-48 66 32)">
      <rect x="44" y="18" width="46" height="28" rx="5" fill="#2a2228" stroke="#120a0a" stroke-width="1"/>
      <rect x="46" y="20" width="42" height="24" rx="4" fill="url(#fire${id})" opacity=".95"><animate attributeName="opacity" values=".75;1;.75" dur="1.2s" repeatCount="indefinite"/></rect>
      <path d="M48 22 L 56 34 L 52 42 M62 20 L 68 32 L 64 44 M76 20 L 80 30 L 86 42" fill="none" stroke="#2a1a1a" stroke-width="2.2"/>
      <rect x="62" y="14" width="10" height="36" rx="2" fill="url(#gd${id})" stroke="#6a4a10"/>
      <circle cx="67" cy="32" r="4.2" fill="#fff2a8" filter="url(#gl${id})"/>
      <path d="M44 18 l-6 -4 l2 8 Z M90 18 l6 -4 l-2 8 Z M44 46 l-6 4 l2 -8 Z M90 46 l6 4 l-2 -8 Z" fill="url(#gd${id})"/>
    </g>
    ${[0, 1, 2, 3].map((i) => `<path d="M${60 + i * 6} ${18 - i * 2} q 3 -6 0 -10" fill="none" stroke="#ff9a4a" stroke-width="1.6" opacity=".8" filter="url(#gl${id})"><animate attributeName="transform" attributeType="XML" type="translate" values="0 0;0 -6;0 0" dur="${1.2 + i * 0.3}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0;.9" dur="${1.2 + i * 0.3}s" repeatCount="indefinite"/></path>`).join('')}`;

  SIG.chifre_cervo = (id) => `
    <path d="M10 94 L 62 36" stroke="#cfd8e3" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M10 94 L 62 36" stroke="#7a8aa0" stroke-width="1" stroke-dasharray="3 5"/>
    <path d="M62 36 L 72 16 L 76 4 L 78 14 L 88 6 L 82 20 L 96 18 L 84 28 L 74 34 Z" fill="url(#ice${id})" stroke="#e6fbff" stroke-width=".7" filter="url(#gl${id})"/>
    <path d="M66 34 L 76 10 M72 30 L 90 12 M74 32 L 92 22" stroke="#fff" stroke-width=".8" opacity=".85"/>
    <path d="M56 42 L 48 34 L 46 26 L 52 32 L 54 22 L 58 32 L 60 40 Z" fill="url(#ice${id})" stroke="#e6fbff" stroke-width=".5"/>
    <circle cx="60" cy="40" r="3.4" fill="#e6fbff" filter="url(#gl${id})"/>
    ${[[30, 70], [40, 60], [24, 52], [70, 50]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><path d="M0 -3 V3 M-3 0 H3 M-2 -2 L2 2 M-2 2 L2 -2" stroke="#e6fbff" stroke-width=".7"/><animateTransform attributeName="transform" type="translate" values="${x} ${y};${x + 2} ${y + 6};${x} ${y}" dur="${3 + i}s" repeatCount="indefinite"/></g>`).join('')}
    ${twinkle(id, [[86, 40, 1.2], [92, 8, 1]], '#ffffff')}`;

  SIG.leviata = (id) => `
    <path d="M10 92 L 64 34" stroke="url(#sea${id})" stroke-width="4.4" stroke-linecap="round"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${18 + i * 9} ${84 - i * 9.7} q 3 -1 2 -4" fill="none" stroke="#9fe3ff" stroke-width="1" opacity=".7"/>`).join('')}
    <path d="M60 38 Q 62 24 74 20 Q 70 28 76 30 Q 70 36 60 38 Z" fill="url(#sea${id})" stroke="#9fe3ff" stroke-width=".6"/>
    <path d="M64 34 L 86 6 L 82 20 Z" fill="url(#bl${id})" stroke="#e6fbff" stroke-width=".5"/>
    <path d="M66 36 Q 80 30 94 14 Q 88 28 80 34 Q 72 40 66 36 Z" fill="url(#bl${id})" stroke="#e6fbff" stroke-width=".5"/>
    <path d="M60 32 Q 58 18 66 4 Q 68 18 64 30 Z" fill="url(#bl${id})" stroke="#e6fbff" stroke-width=".5"/>
    <circle cx="62" cy="36" r="4" fill="#f6f1e7" stroke="#d4af37" stroke-width="1.2"/>
    <path d="M78 46 L 72 54 L 78 54 L 70 66" fill="none" stroke="#fff6a8" stroke-width="1.6" filter="url(#gl${id})"><animate attributeName="opacity" values="0;1;0;0;1;0" dur="2.4s" repeatCount="indefinite"/></path>
    <path d="M20 70 q 6 -6 12 0 t 12 0" fill="none" stroke="#9fe3ff" stroke-width="1.4" opacity=".6"><animate attributeName="opacity" values=".2;.7;.2" dur="3s" repeatCount="indefinite"/></path>`;

  SIG.lanterna_eterna = (id) => `
    <path d="M20 10 Q 52 14 74 40 Q 88 58 90 84" fill="none" stroke="#6a4a2e" stroke-width="5" stroke-linecap="round"/>
    <path d="M20 10 Q 52 14 74 40 Q 88 58 90 84" fill="none" stroke="#e8c46a" stroke-width="1.3" stroke-dasharray="6 5"/>
    ${[[34, 12, -20], [58, 24, 20], [84, 62, 60], [88, 76, 80]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2" transform="rotate(${r} ${x} ${y})" fill="#7cc45a"/>`).join('')}
    <path d="M20 10 L 90 84" stroke="#bfe9ff" stroke-width="1.1" filter="url(#gl${id})"><animate attributeName="opacity" values=".5;1;.5" dur="2s" repeatCount="indefinite"/></path>
    <path d="M60 52 L 56 60" stroke="#d4af37" stroke-width="1.4"/>
    <path d="M50 60 L 62 60 L 64 64 L 62 76 L 50 76 L 48 64 Z" fill="none" stroke="url(#gd${id})" stroke-width="2"/>
    <path d="M56 74 Q 50 68 56 62 Q 62 68 56 74 Z" fill="#8fe8ff" filter="url(#gl${id})"><animate attributeName="d" values="M56 74 Q 50 68 56 62 Q 62 68 56 74 Z;M56 74 Q 49 67 56 60 Q 63 67 56 74 Z;M56 74 Q 50 68 56 62 Q 62 68 56 74 Z" dur="1.4s" repeatCount="indefinite"/></path>
    <circle cx="56" cy="68" r="10" fill="#8fe8ff" opacity=".25" filter="url(#bl2${id})"/>
    <path d="M14 44 L 62 38" stroke="url(#bl${id})" stroke-width="1.6"/>
    <path d="M62 38 l -7 -4 l 12 3 l -10 5 Z" fill="#fff4cc"/>
    ${twinkle(id, [[30, 30, 1.2], [76, 22, 1], [72, 86, 1.1]], '#bfe9ff')}`;

  SIG.seteceus = (id) => {
    const stars7 = [[40, 18], [52, 14], [64, 18], [74, 26], [82, 38], [86, 50], [88, 62]];
    return `
    <path d="M16 84 L 62 38" stroke="#2a2a4a" stroke-width="8" stroke-linecap="round"/>
    <path d="M16 84 L 62 38" stroke="#c6b4ff" stroke-width="1" stroke-dasharray="2 3"/>
    <path d="M40 18 Q 74 18 88 62" fill="none" stroke="url(#gd${id})" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M40 18 L 88 62" stroke="#e8e2ff" stroke-width="1"/>
    <path d="M${stars7.map((p) => p.join(' ')).join(' L ')}" fill="none" stroke="#c6b4ff" stroke-width=".6" opacity=".8"/>
    ${stars7.map(([x, y], i) => `<g>${star(x, y, 1.3, '#fff', `filter="url(#gl${id})"`)}<animate attributeName="opacity" values="1;.3;1" dur="${1.4 + i * 0.25}s" repeatCount="indefinite"/></g>`).join('')}
    <path d="M52 48 L 90 10" stroke="url(#bl${id})" stroke-width="2.4"/>
    ${star(90, 10, 2.2, '#fff6c8', `filter="url(#gl${id})"`)}
    <circle cx="58" cy="44" r="4" fill="url(#gm${id})" filter="url(#gl${id})"/>`;
  };

  SIG.astrolabio = (id) => `
    <circle cx="50" cy="50" r="30" fill="#c6b4ff" opacity=".18" filter="url(#bl2${id})"/>
    <g transform="translate(50 50)">
      <circle r="36" fill="none" stroke="url(#gd${id})" stroke-width="2.6"/>
      ${Array.from({ length: 24 }, (_, i) => { const a = i * 15 * Math.PI / 180; return `<path d="M${Math.cos(a) * 33} ${Math.sin(a) * 33} L${Math.cos(a) * (i % 2 ? 35 : 31)} ${Math.sin(a) * (i % 2 ? 35 : 31)}" stroke="#ffe9a8" stroke-width=".8"/>`; }).join('')}
      <g><ellipse rx="40" ry="13" fill="none" stroke="url(#gd${id})" stroke-width="1.6" transform="rotate(-25)"/><circle cx="40" cy="0" r="3" fill="#9fe3ff" transform="rotate(-25)" filter="url(#gl${id})"/><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="14s" repeatCount="indefinite"/></g>
      <g><ellipse rx="13" ry="40" fill="none" stroke="url(#gd${id})" stroke-width="1.4" transform="rotate(-25)"/><circle cx="0" cy="-40" r="2.4" fill="#ff9ad5" transform="rotate(-25)" filter="url(#gl${id})"/><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="20s" repeatCount="indefinite"/></g>
      <circle r="17" fill="url(#gm${id})" filter="url(#gl${id})"/>
      ${star(0, 0, 4, '#fff', `filter="url(#gl${id})"`)}
    </g>
    ${twinkle(id, [[14, 16, 1.2], [88, 84, 1.3], [86, 14, 1]], '#ffe9a8')}`;

  SIG.grimorio_maos = (id) => `
    <g filter="url(#sd${id})">
      <path d="M16 30 L 50 22 L 84 30 L 84 82 L 50 74 L 16 82 Z" fill="#5a1a3a"/>
      <path d="M20 32 L 50 25 L 50 72 L 20 79 Z" fill="#fff4e6"/>
      <path d="M80 32 L 50 25 L 50 72 L 80 79 Z" fill="#f6e6d6"/>
      <path d="M50 22 L 50 74" stroke="url(#gd${id})" stroke-width="2.4"/>
      <path d="M16 30 L 50 22 L 84 30" fill="none" stroke="url(#gd${id})" stroke-width="2"/>
      <path d="M28 50 q 4 -10 10 -6 q 2 4 -2 10 q -6 2 -8 -4 Z M72 50 q -4 -10 -10 -6 q -2 4 2 10 q 6 2 8 -4 Z" fill="none" stroke="#ff6b8b" stroke-width="1.4"/>
      <path d="M26 40 h14 M26 60 h12 M60 40 h14 M62 60 h12" stroke="#c9a0a0" stroke-width="1" opacity=".7"/>
    </g>
    ${['ᚱ', 'ᛟ', 'ᚨ', 'ᛉ', 'ᛞ'].map((r, i) => `<text x="${30 + i * 10}" y="20" font-size="7" fill="#ff9ad5" filter="url(#gl${id})" text-anchor="middle">${r}<animate attributeName="y" values="${24 - (i % 2) * 3};${8 - (i % 2) * 2};${24 - (i % 2) * 3}" dur="${2.6 + i * 0.4}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${2.6 + i * 0.4}s" repeatCount="indefinite"/></text>`).join('')}
    <circle cx="50" cy="50" r="6" fill="url(#gm${id})" filter="url(#gl${id})"/>
    <path d="M50 74 L 50 84 L 46 88" fill="none" stroke="#8a8f99" stroke-width="1.6" stroke-dasharray="2 1"/>`;


  // ===================== ★5 da v3: arte ainda mais caprichada =====================
  const f1 = (n) => Math.round(n * 10) / 10;
  // pena: base (x0,y0), ângulo (graus, 0 = direita, -90 = cima), comprimento, largura
  const feather = (x0, y0, ang, len, wid, fill, rachis = '#fff6c8') => {
    const a = ang * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
    const tx = x0 + ux * len, ty = y0 + uy * len, mx = x0 + ux * len * 0.5, my = y0 + uy * len * 0.5;
    return `<path d="M${f1(x0)} ${f1(y0)} Q${f1(mx + px * wid)} ${f1(my + py * wid)} ${f1(tx)} ${f1(ty)} Q${f1(mx - px * wid * 0.45)} ${f1(my - py * wid * 0.45)} ${f1(x0)} ${f1(y0)} Z" fill="${fill}" stroke="rgba(90,20,10,.45)" stroke-width=".4"/><path d="M${f1(x0)} ${f1(y0)} L${f1(x0 + ux * len * 0.92)} ${f1(y0 + uy * len * 0.92)}" stroke="${rachis}" stroke-width=".5" opacity=".75"/>`;
  };
  // fagulhas subindo
  const embers = (pts, color) => pts.map(([x, y, r, d, b]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}"><animate attributeName="cy" values="${y};${y - 22}" dur="${d}s" begin="${b}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${b}s" repeatCount="indefinite"/></circle>`).join('');

  SIG.defsV3 = (id) => `
    <linearGradient id="blz${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff6d8"/><stop offset=".3" stop-color="#ffcf6a"/><stop offset=".65" stop-color="#ff6a2a"/><stop offset="1" stop-color="#c8183a"/></linearGradient>
    <radialGradient id="emb${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".95"/><stop offset=".4" stop-color="#ff7a2a" stop-opacity=".45"/><stop offset="1" stop-color="#c8183a" stop-opacity="0"/></radialGradient>
    <linearGradient id="moon${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#e2dcff"/><stop offset="1" stop-color="#7a68c8"/></linearGradient>
    <radialGradient id="neb${id}" cx=".55" cy=".4" r=".7"><stop offset="0" stop-color="#f2b6ff"/><stop offset=".35" stop-color="#7a3ac8"/><stop offset=".75" stop-color="#2a1050"/><stop offset="1" stop-color="#120624"/></radialGradient>
    <radialGradient id="orb${id}" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#e6e2ff"/><stop offset="1" stop-color="#9a8ad8"/></radialGradient>
    <linearGradient id="jade${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#0f6a4a"/><stop offset=".5" stop-color="#3ac890"/><stop offset="1" stop-color="#b8ffe0"/></linearGradient>
    <linearGradient id="jbl${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#d8fff0"/><stop offset=".45" stop-color="#ffffff"/><stop offset="1" stop-color="#5ad8a8"/></linearGradient>
    <linearGradient id="lac${id}" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#6a0f14"/><stop offset=".5" stop-color="#c8302a"/><stop offset="1" stop-color="#ff7a4a"/></linearGradient>
    <radialGradient id="prl${id}" cx=".38" cy=".35" r=".65"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d8fff6"/><stop offset="1" stop-color="#5ad8c0"/></radialGradient>
    <linearGradient id="sky${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#bfe9ff"/><stop offset="1" stop-color="#4a8ad8"/></linearGradient>
    <linearGradient id="rose${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#ffc2e0"/><stop offset=".75" stop-color="#ff5a9a"/><stop offset="1" stop-color="#a8104a"/></linearGradient>
    <radialGradient id="hgl${id}" cx=".5" cy=".55" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#ffe0f0" stop-opacity=".8"/><stop offset="1" stop-color="#ff7ab0" stop-opacity="0"/></radialGradient>`;

  // ---- Asa da Fênix Rubra: lâmina de fogo com asas de fênix na guarda
  SIG.asa_fenix = (id) => {
    const gx = 40, gy = 60;
    const wingL = [[-168, 24, 4.2, '#c8183a'], [-152, 29, 4.6, '#ff4a2a'], [-136, 30, 4.6, '#ff8a2a'], [-120, 24, 4, '#ffcf6a']];
    const wingR = wingL.map(([a, l, w, c]) => [-90 - a, l, w, c]);
    const tufts = [0.22, 0.4, 0.58, 0.74].map((t) => { const x = 38 + 46 * t, y = 58 - 46 * t; return `<path d="M${f1(x)} ${f1(y)} q -6 -1 -8 -7 q 4 2.5 8.5 3 Z" fill="${t > 0.5 ? '#ffcf6a' : '#ff7a2a'}" opacity=".9"/>`; }).join('');
    return `
    <circle cx="${gx}" cy="${gy}" r="30" fill="url(#emb${id})"><animate attributeName="r" values="26;32;26" dur="2.6s" repeatCount="indefinite"/></circle>
    <g filter="url(#gl${id})" opacity=".95">${wingL.map(([a, l, w, c]) => feather(gx, gy, a, l, w, c)).join('')}${wingR.map(([a, l, w, c]) => feather(gx, gy, a, l, w, c)).join('')}</g>
    ${tufts}
    <path d="M38 58 L 84 12 L 93 5 L 88 16 L 44 64 Z" fill="url(#blz${id})" stroke="#8a1020" stroke-width=".7"/>
    <path d="M41 60 L 89 10" stroke="#fffbe8" stroke-width="2" stroke-linecap="round" filter="url(#gl${id})"><animate attributeName="opacity" values=".55;1;.55" dur="1.4s" repeatCount="indefinite"/></path>
    <path d="M46 55 Q 56 48 62 40 Q 70 34 76 24 Q 82 18 88 12" fill="none" stroke="#fff2a8" stroke-width="1.1" filter="url(#gl${id})" opacity=".85"><animate attributeName="d" values="M46 55 Q 56 48 62 40 Q 70 34 76 24 Q 82 18 88 12;M46 55 Q 52 44 62 40 Q 74 36 76 24 Q 80 14 88 12;M46 55 Q 56 48 62 40 Q 70 34 76 24 Q 82 18 88 12" dur="1.8s" repeatCount="indefinite"/></path>
    <path d="M37 65 L 21 81" stroke="#5a0f1a" stroke-width="5.6" stroke-linecap="round"/>
    <path d="M35 67 l -2.2 2.2 M31 71 l -2.2 2.2 M27 75 l -2.2 2.2" stroke="#ffd36b" stroke-width="1.4"/>
    <circle cx="${gx}" cy="${gy}" r="5.4" fill="url(#gd${id})" stroke="#8a5a10" stroke-width=".6"/>
    <circle cx="${gx}" cy="${gy}" r="3.2" fill="#ff3a3a" filter="url(#gl${id})"><animate attributeName="fill" values="#ff3a3a;#ffb347;#ff3a3a" dur="2s" repeatCount="indefinite"/></circle>
    <path d="M18 76 Q 24 82 18 89 Q 12 82 18 76 Z" fill="url(#fire${id})" filter="url(#gl${id})"><animate attributeName="d" values="M18 76 Q 24 82 18 89 Q 12 82 18 76 Z;M18 74 Q 25 82 18 89 Q 11 82 18 74 Z;M18 76 Q 24 82 18 89 Q 12 82 18 76 Z" dur="1.2s" repeatCount="indefinite"/></path>
    ${embers([[50, 52, 0.9, 2.2, 0], [62, 42, 0.7, 2.8, 0.6], [30, 54, 0.8, 2.5, 1.1], [72, 30, 0.6, 2.1, 0.3], [44, 70, 0.7, 2.6, 1.6], [56, 64, 0.6, 3, 0.9]], '#ffcf6a')}
    ${twinkle(id, [[84, 26, 1.3], [66, 20, 1], [92, 40, 1.1]], '#fff2a8')}`;
  };

  // ---- Lua Devoradora: espadão em forma de lua crescente, com nebulosa por dentro e eclipse atrás
  SIG.lua_devoradora = (id) => {
    const outer = 'M33 70 Q 22 22 91 7 Q 54 26 47 74 Z';
    const inner = 'M37 66 Q 30 28 80 13 Q 52 30 45 68 Z';
    const stars = [[44, 40, 0.7], [52, 30, 0.5], [40, 52, 0.6], [60, 22, 0.55], [47, 58, 0.45], [68, 17, 0.5], [42, 32, 0.4]];
    return `
    <circle cx="58" cy="36" r="24" fill="#120624" opacity=".55"/>
    <circle cx="58" cy="36" r="24" fill="none" stroke="#e6d8ff" stroke-width="2.4" opacity=".7" filter="url(#bl2${id})"><animate attributeName="r" values="23;26;23" dur="4s" repeatCount="indefinite"/></circle>
    <circle cx="58" cy="36" r="24" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".6"/>
    <defs><clipPath id="lc${id}"><path d="${inner}"/></clipPath></defs>
    <path d="${outer}" fill="url(#moon${id})" stroke="#4a3a8a" stroke-width=".8"/>
    <path d="${inner}" fill="url(#neb${id})"/>
    <g clip-path="url(#lc${id})">${stars.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"><animate attributeName="opacity" values="1;.2;1" dur="${1.4 + i * 0.3}s" repeatCount="indefinite"/></circle>`).join('')}
      <path d="M30 60 Q 50 40 84 12" stroke="#f2b6ff" stroke-width="3" opacity=".35" fill="none" filter="url(#gl${id})"/></g>
    <path d="M33 70 Q 22 22 91 7" fill="none" stroke="#fff" stroke-width="1.1" opacity=".9"/>
    <g transform="translate(58 36)"><g>
      ${[0, 120, 240].map((a) => { const r = a * Math.PI / 180; return `<path d="M${f1(Math.cos(r) * 30)} ${f1(Math.sin(r) * 30 - 3)} l2 3 -2 3 -2 -3 Z" fill="#e6e2ff" filter="url(#gl${id})"/>`; }).join('')}
      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="9s" repeatCount="indefinite"/></g></g>
    <path d="M27 62 L 45 80" stroke="#3a3458" stroke-width="5" stroke-linecap="round"/>
    <path d="M27 62 L 45 80" stroke="url(#gd${id})" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    <path d="M34 74 L 13 94" stroke="#241c3a" stroke-width="6.5" stroke-linecap="round"/>
    <path d="M31 77 l -2.4 2.4 M27 81 l -2.4 2.4 M23 85 l -2.4 2.4 M19 89 l -2 2" stroke="#c6b4ff" stroke-width="1.3"/>
    <circle cx="36" cy="71" r="7" fill="url(#orb${id})" stroke="#4a3a8a" stroke-width=".7" filter="url(#gl${id})"/>
    <circle cx="34" cy="69.5" r="1.4" fill="#b8b0e8" opacity=".7"/><circle cx="38.5" cy="73" r="1" fill="#b8b0e8" opacity=".7"/><circle cx="37.5" cy="68" r=".7" fill="#b8b0e8" opacity=".7"/>
    <path d="M10 92 q 4 -6 9 -3 q -5 0 -6 6 Z" fill="url(#moon${id})"/>
    ${twinkle(id, [[86, 30, 1.3], [74, 52, 1], [26, 34, 1.1], [92, 18, 0.9]], '#f2e6ff')}`;
  };

  // ---- Serpente Celeste: glaive com um dragão de jade enrolado na haste
  SIG.serpente_celeste = (id) => {
    // corpo sinuoso acompanhando a haste (de 12,92 até 64,40)
    const pts = [];
    for (let i = 0; i <= 18; i++) { const t = 0.08 + i / 18 * 0.84, bx = 12 + 52 * t, by = 92 - 52 * t, off = Math.sin(t * Math.PI * 3.2) * 6.5; pts.push([bx + off * 0.707, by + off * 0.707]); }
    const body = 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L');
    return `
    <g opacity=".7"><path d="M8 84 q 6 -8 14 -4 q 6 -6 12 0 q -4 2 -8 1 q -6 6 -12 2 q -4 2 -6 1 Z" fill="#ffffff" opacity=".35"/>
      <path d="M14 80 q 3 -4 6 -1 M26 78 q 3 -4 6 -1" fill="none" stroke="url(#gd${id})" stroke-width=".9"/></g>
    <path d="M10 94 L 66 38" stroke="url(#lac${id})" stroke-width="4.4" stroke-linecap="round"/>
    <path d="M18 86 l 3 3 M30 74 l 3 3 M42 62 l 3 3 M54 50 l 3 3" stroke="url(#gd${id})" stroke-width="2.2"/>
    <path d="${body}" fill="none" stroke="#0a3a2a" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${body}" fill="none" stroke="url(#jade${id})" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${body}" fill="none" stroke="#ffd36b" stroke-width="2.2" stroke-dasharray="1.2 1.8" stroke-linecap="round" opacity=".85"/>
    <path d="${body}" fill="none" stroke="#e8fff6" stroke-width=".6" opacity=".7"/>
    <path d="M68 34 Q 80 10 97 2 Q 93 22 75 41 Z" fill="url(#jbl${id})" stroke="#1a6a4a" stroke-width=".7"/>
    <path d="M70 35 Q 82 14 95 4" fill="none" stroke="#fff" stroke-width="1" opacity=".9"/>
    <g transform="translate(66 40) scale(1.4) translate(-66 -40)">
    <path d="M58 46 q -6 -2 -7 -8 q 3 1 5 3 q -1 -5 2 -8 q 1 4 4 6 q 0 -4 3 -6 q 0 5 2 7" fill="#ff7a3a" stroke="#8a1a0a" stroke-width=".4"/>
    <path d="M60 46 Q 60 36 68 32 Q 76 30 78 36 Q 74 40 70 41 Q 66 46 60 46 Z" fill="url(#jade${id})" stroke="#0a3a2a" stroke-width=".7"/>
    <path d="M66 33 q -2 -6 -7 -8 M69 32 q 0 -6 -3 -10" fill="none" stroke="#ffd36b" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="71" cy="35.5" r="1.1" fill="#ffe08a" filter="url(#gl${id})"/>
    <path d="M77 38 q 8 4 12 12" fill="none" stroke="#ffe9a8" stroke-width=".7"><animate attributeName="d" values="M77 38 q 8 4 12 12;M77 38 q 10 2 14 10;M77 38 q 8 4 12 12" dur="2.6s" repeatCount="indefinite"/></path>
    <path d="M76 40 q 4 8 2 14" fill="none" stroke="#ffe9a8" stroke-width=".7"><animate attributeName="d" values="M76 40 q 4 8 2 14;M76 40 q 6 7 5 13;M76 40 q 4 8 2 14" dur="3s" repeatCount="indefinite"/></path>
    </g>
    <circle cx="84" cy="44" r="4.2" fill="url(#prl${id})" filter="url(#gl${id})"><animate attributeName="r" values="3.8;4.6;3.8" dur="2.2s" repeatCount="indefinite"/></circle>
    ${twinkle(id, [[90, 22, 1.2], [80, 56, 1], [52, 28, 1]], '#d8fff0')}`;
  };

  // ---- Harpa dos Ventos Eternos: arco-harpa com cordas de luz e penas que flutuam
  SIG.harpa_ventos = (id) => {
    const strings = [[0.28, 0.36], [0.42, 0.5], [0.56, 0.64], [0.7, 0.76]].map(([t, s], i) => {
      // ponto no arco (Bézier 20,12 → ctrl 84,16 → 88,80) e ponto na corda (reta 20,12 → 88,80)
      const ax = (1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 84 + t * t * 88, ay = (1 - t) * (1 - t) * 12 + 2 * (1 - t) * t * 16 + t * t * 80;
      const sx = 20 + 68 * s, sy = 12 + 68 * s;
      return `<path d="M${f1(ax)} ${f1(ay)} L${f1(sx)} ${f1(sy)}" stroke="#f2fbff" stroke-width="1.2" filter="url(#gl${id})"><animate attributeName="opacity" values=".35;1;.35" dur="${1.6 + i * 0.35}s" repeatCount="indefinite"/></path>`;
    }).join('');
    const tuft = (x, y, a0) => [0, 1, 2, 3, 4].map((k) => feather(x, y, a0 + k * 15, 18 - k * 2, 3.6, k % 2 ? '#ffffff' : '#cfeeff', '#7fb8e8')).join('');
    return `
    <circle cx="58" cy="44" r="30" fill="#bfe9ff" opacity=".18" filter="url(#bl2${id})"/>
    <path d="M10 60 q 20 -10 34 2 q 10 8 22 0" fill="none" stroke="#e6f6ff" stroke-width="1" stroke-dasharray="4 5" opacity=".7"><animate attributeName="stroke-dashoffset" values="0;-18" dur="1.6s" repeatCount="indefinite"/></path>
    <path d="M40 92 q 14 -14 30 -6 q 12 6 22 -4" fill="none" stroke="#e6f6ff" stroke-width=".8" stroke-dasharray="3 5" opacity=".6"><animate attributeName="stroke-dashoffset" values="0;-16" dur="2s" repeatCount="indefinite"/></path>
    <g filter="url(#gl${id})">${tuft(20, 12, -205)}${tuft(88, 80, 35)}</g>
    <path d="M20 12 L 88 80" stroke="#ffffff" stroke-width=".9" opacity=".9"/>
    ${strings}
    <path d="M20 12 Q 84 16 88 80" fill="none" stroke="#3a5a8a" stroke-width="6.2" stroke-linecap="round"/>
    <path d="M20 12 Q 84 16 88 80" fill="none" stroke="url(#sky${id})" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M20 12 Q 84 16 88 80" fill="none" stroke="url(#gd${id})" stroke-width="1.2" stroke-dasharray="2 4"/>
    <path d="M62 24 q 8 -2 12 6 q 2 6 -2 10 q -6 -2 -10 -8 Z" fill="url(#gd${id})" stroke="#8a6a20" stroke-width=".6"/>
    <path d="M64 26 q 6 0 8 6 M63 30 q 5 1 7 6" fill="none" stroke="#fff6c8" stroke-width=".6"/>
    <path d="M36 62 L 84 18" stroke="#9fe3ff" stroke-width="1.8" filter="url(#gl${id})"><animate attributeName="opacity" values=".7;1;.7" dur="1.2s" repeatCount="indefinite"/></path>
    <path d="M84 18 l -7 1 l 4 -4 l 1 -5 Z" fill="#ffffff" filter="url(#gl${id})"/>
    <path d="M38 60 l -5 -1 l 3 3 Z M40 58 l -5 -1 l 3 3 Z" fill="#cfeeff"/>
    <circle cx="69" cy="31" r="3" fill="url(#gm${id})" filter="url(#gl${id})"/>
    <g>${feather(30, 40, -60, 9, 2.2, '#ffffff', '#7fb8e8')}<animateTransform attributeName="transform" type="translate" values="0 0;3 -6;0 0" dur="4s" repeatCount="indefinite"/></g>
    <g>${feather(74, 62, -30, 8, 2, '#dff4ff', '#7fb8e8')}<animateTransform attributeName="transform" type="translate" values="0 0;-3 -5;0 0" dur="3.4s" repeatCount="indefinite"/></g>
    ${twinkle(id, [[50, 24, 1.2], [78, 46, 1], [30, 74, 1.1]], '#e6f6ff')}`;
  };

  // ---- Coração de Elarion: coração de cristal com anéis dourados em órbita
  SIG.coracao_elarion = (id) => {
    const heart = 'M50 74 C 22 56 24 30 40 30 C 46 30 50 35 50 39 C 50 35 54 30 60 30 C 76 30 78 56 50 74 Z';
    const ring = (rot, dur, gem) => `<g transform="rotate(${rot} 50 52)"><ellipse cx="50" cy="52" rx="40" ry="12" fill="none" stroke="url(#gd${id})" stroke-width="1.6"/><ellipse cx="50" cy="52" rx="40" ry="12" fill="none" stroke="#fff6c8" stroke-width=".5" stroke-dasharray="1 4"/><circle r="2.6" fill="${gem}" filter="url(#gl${id})"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M10 52 A 40 12 0 1 0 90 52 A 40 12 0 1 0 10 52"/></circle></g>`;
    return `
    <g transform="translate(50 52)"><g opacity=".55">
      <circle r="44" fill="none" stroke="#ffd36b" stroke-width=".5" stroke-dasharray="2 3"/>
      ${Array.from({ length: 16 }, (_, i) => { const a = i * 22.5 * Math.PI / 180; return `<path d="M${f1(Math.cos(a) * 36)} ${f1(Math.sin(a) * 36)} L${f1(Math.cos(a) * 42)} ${f1(Math.sin(a) * 42)}" stroke="#ffe9a8" stroke-width="${i % 2 ? 0.5 : 1.1}"/>`; }).join('')}
      <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="50s" repeatCount="indefinite"/></g></g>
    <circle cx="50" cy="52" r="26" fill="url(#hgl${id})" opacity=".55"><animate attributeName="r" values="24;28;24" dur="1.6s" repeatCount="indefinite"/></circle>
    ${ring(-28, 7, '#7fe8ff')}
    <path d="${heart}" fill="url(#rose${id})" stroke="#8a1040" stroke-width=".8"/>
    <path d="M50 39 L 40 30 M50 39 L 60 30 M50 39 L 30 46 M50 39 L 70 46 M50 39 L 50 74 M50 39 L 36 60 M50 39 L 64 60" stroke="#ffffff" stroke-width=".5" opacity=".45"/>
    <path d="M38 36 Q 33 42 35 50" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
    <path d="${heart}" fill="url(#hgl${id})" opacity=".6" transform="translate(50 52) scale(.55) translate(-50 -52)"><animate attributeName="opacity" values=".35;.95;.5;.95;.35" keyTimes="0;.15;.3;.45;1" dur="1.6s" repeatCount="indefinite"/></path>
    <path d="${heart}" fill="none" stroke="url(#gd${id})" stroke-width="1.3" transform="translate(50 52) scale(1.12) translate(-50 -52)"/>
    <path d="M50 26 l 2.5 -5 2.5 5 -2.5 -2 Z M44 25 l 1.5 -3 1.5 3 Z M53 25 l 1.5 -3 1.5 3 Z" fill="url(#gd${id})"/>
    ${ring(32, 9, '#ffd36b')}
    ${twinkle(id, [[16, 28, 1.2], [86, 30, 1.1], [80, 80, 1], [20, 78, 0.9]], '#ffe6f2')}`;
  };

  E.WSIG = SIG;
})();
