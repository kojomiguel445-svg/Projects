/* Cria uma versão do jogo: atualiza os números de versão e copia os arquivos para releases/<versão>/.
   Uso: node tools/release.mjs 5.3.2 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const next = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(next || '')) { console.error('Uso: node tools/release.mjs <x.y.z>'); process.exit(1); }
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
const current = read('js/ui/title.js').match(/T\.VERSION = '([\d.]+)'/)[1];
const swap = (f, pairs) => { let s = read(f); for (const [a, b] of pairs) { if (!s.includes(a)) throw new Error(`${f}: "${a}" não encontrado`); s = s.split(a).join(b); } write(f, s); };

swap('index.html', [[`content="${current}"`, `content="${next}"`], [`/releases/${current}/`, `/releases/${next}/`]]);
swap('sw.js', [[`const RELEASE = '${current}'`, `const RELEASE = '${next}'`], [`elarion-v${current}-`, `elarion-v${next}-`]]);
swap('js/core/hosting.js', [[`"release": "${current}"`, `"release": "${next}"`], [`/releases/${current}/`, `/releases/${next}/`]]);
swap('js/ui/title.js', [[`T.VERSION = '${current}'`, `T.VERSION = '${next}'`]]);
swap('vercel.json', [[`/releases/${current}/index.html`, `/releases/${next}/index.html`]]);

// A versão publicada leva uma cópia completa dos arquivos que o index.html referencia.
const dest = path.join(root, 'releases', next);
fs.rmSync(dest, { recursive: true, force: true });
for (const dir of ['css', 'fonts', 'js', 'vendor']) fs.cpSync(path.join(root, dir), path.join(dest, dir), { recursive: true });
fs.mkdirSync(path.join(dest, 'icons'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'icons'))) if (f.endsWith('.png')) fs.copyFileSync(path.join(root, 'icons', f), path.join(dest, 'icons', f));
fs.copyFileSync(path.join(root, 'index.html'), path.join(dest, 'index.html'));
console.log(`versão ${current} → ${next}`);
