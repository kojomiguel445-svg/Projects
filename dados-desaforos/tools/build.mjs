/* Build no Vercel para deploys enviados pelo conector (sem Git): parte da versão base imutável,
   aplica as diferenças de tools/deploy-plan.json, sobrepõe os arquivos novos enviados e gera
   releases/<versão>/. Resultado em dist/. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const root = process.cwd(), out = path.join(root, 'dist');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'tools/deploy-plan.json'), 'utf8'));
const sha1 = (b) => crypto.createHash('sha1').update(b).digest('hex');
const put = (rel, data) => { const f = path.join(out, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data); };
async function fetchBase(rel, optional = false, from = plan.base) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(from + '/' + rel);
      if (r.status === 404 && optional) return null;
      if (!r.ok) throw new Error(r.status + ' ' + rel);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (attempt === 3) throw e; await new Promise((ok) => setTimeout(ok, 800 * (attempt + 1))); }
  }
}
async function pool(items, fn, n = 12) { const q = [...items]; await Promise.all(Array.from({ length: n }, async () => { while (q.length) await fn(q.shift()); })); }

// lista da base compactada por pasta: "pasta:a,b;outra:c"
plan.baseFiles = plan.baseFiles.split(';').flatMap((g) => { const [d, f] = g.split(':'); return f.split(',').map((n) => (d ? d + '/' : '') + n); });
// Arquivos buscados no repositório público num commit fixo (plan.src), conferidos por SHA-1 (plan.fetched).
const fetched = plan.fetched || {};
const releaseFiles = [...new Set([...plan.baseFiles, ...plan.uploaded, ...Object.keys(fetched)])].filter((f) => /^(css|fonts|js|vendor)\//.test(f) || /^icons\/[^/]+\.png$/.test(f)).concat('index.html');
fs.rmSync(out, { recursive: true, force: true });
// 1. arquivos da base que não foram enviados nem removidos
await pool(plan.baseFiles.filter((f) => !plan.uploaded.includes(f) && !plan.removed.includes(f) && !fetched[f]), async (rel) => {
  let data = await fetchBase(rel);
  const p = plan.patches[rel];
  if (p) {
    if (sha1(data) !== p.sha) throw new Error('base diferente da esperada: ' + rel);
    let s = data.toString('utf8');
    for (const [at, del, ins] of [...p.ops].sort((a, b) => b[0] - a[0])) s = s.slice(0, at) + ins + s.slice(at + del);
    data = Buffer.from(s, 'utf8');
    if (sha1(data) !== p.result) throw new Error('diferença aplicada não confere: ' + rel);
  }
  put(rel, data);
});
// 2. arquivos novos ou substituídos enviados neste deploy
for (const rel of plan.uploaded) {
  const data = fs.readFileSync(path.join(root, rel));
  if (plan.sums && plan.sums[rel] && sha1(data) !== plan.sums[rel]) throw new Error('arquivo enviado não confere: ' + rel);
  put(rel, data);
}
// 2b. arquivos alterados ou novos baixados do GitHub (commit imutável)
await pool(Object.keys(fetched), async (rel) => {
  const data = await fetchBase(rel, false, plan.src);
  if (sha1(data) !== fetched[rel]) throw new Error('arquivo do repositório não confere: ' + rel);
  put(rel, data);
});
// 3. ícones SVG avulsos (idênticos aos embutidos em icons-data.js)
const ctx = { E: {} }; vm.runInNewContext(fs.readFileSync(path.join(out, 'js/gfx/icons-data.js'), 'utf8'), ctx);
for (const [k, e] of Object.entries(ctx.E.IconCatalog)) put(`icons/ui/${k}.svg`, Buffer.from(e.src.split(',')[1], 'base64'));
// 4. versão atual completa + versões anteriores (abas antigas terminam a partida com os próprios arquivos)
const copyTree = (from, to) => { for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); if (e.isDirectory()) copyTree(a, b); else { fs.mkdirSync(to, { recursive: true }); fs.copyFileSync(a, b); } } };
const rel = path.join(out, 'releases', plan.release);
for (const dir of ['css', 'fonts', 'js', 'vendor']) copyTree(path.join(out, dir), path.join(rel, dir));
fs.mkdirSync(path.join(rel, 'icons'), { recursive: true });
for (const f of fs.readdirSync(path.join(out, 'icons'))) if (f.endsWith('.png')) fs.copyFileSync(path.join(out, 'icons', f), path.join(rel, 'icons', f));
fs.copyFileSync(path.join(out, 'index.html'), path.join(rel, 'index.html'));
for (const [v, from] of plan.oldReleases) await pool(releaseFiles.map((f) => `releases/${v}/${f}`), async (f) => { const data = await fetchBase(f, true, from); if (data) put(f, data); });
console.log(`dist pronto: versão ${plan.release}, ${plan.baseFiles.length} da base, ${Object.keys(plan.patches).length} com diferenças, ${plan.uploaded.length} enviados, ${Object.keys(fetched).length} do repositório`);
