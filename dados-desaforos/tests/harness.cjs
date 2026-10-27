/* Harness de verificação visual: cria um herói de teste, entra no mundo e fotografa pontos do mapa.
   Uso: node tests/harness.cjs <roteiro.json> <pasta-de-saída>  (servidor estático em http://localhost:8765) */
const { chromium } = require('playwright');
const fs = require('fs');
const [,, planFile, outDir = 'shots'] = process.argv;
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: plan.viewport || { width: 1280, height: 720 }, isMobile: !!plan.mobile, hasTouch: !!plan.mobile, serviceWorkers: 'block' });
  const p = await ctx.newPage();
  // testa o código-fonte da raiz, não a cópia publicada em releases/<versão>/
  if (!plan.release) await p.route(/\/releases\/[^/]+\/(?!index\.html)/, (r) => r.continue({ url: r.request().url().replace(/\/releases\/[^/]+\//, '/') }));
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto((plan.url || 'http://localhost:8765/index.html'));
  await p.waitForFunction(() => window.E && E.Title && !document.getElementById('loading'), null, { timeout: 60000 });
  await p.evaluate(async (setup) => {
    const st = E.state;
    if (setup.noBatch && E.ScenePerf) E.ScenePerf.batch = () => {};
    if (!E.Store.hero()) {
      const h = E.C.create({ name: 'Teste', cls: 'guerreiro', species: 'humano', background: 'soldado', base: { for: 15, des: 14, con: 13, int: 12, sab: 10, car: 8 }, bgBonus: { for: 2, con: 1 }, skills: [] });
      Object.assign(h, setup.hero || {});
      st.heroes.push(h); st.activeHero = h.id;
    }
    st.seenVersion = E.Title.VERSION;
    Object.assign(st, setup.state || {});
    E.Store.save();
    const t = document.getElementById('title'); if (t) t.remove();
    if (E.WG.disposeTitle) E.WG.disposeTitle();
    await E.Game.enterWorld(false);
    // câmera livre para vistas aéreas: window.__cam = { pos: [x, y, z], look: [x, y, z] }
    window.__wrap = () => {
      const w = E.WG.world; if (!w || w.__wrapped) return;
      const u = w.update.bind(w);
      w.update = (dt) => { u(dt); const c = window.__cam; if (c) { w.camera.position.set(...c.pos); w.camera.lookAt(...c.look); } };
      w.__wrapped = true;
    };
    window.__wrap();
  }, plan.setup || {});
  await p.waitForTimeout(1500);
  fs.mkdirSync(outDir, { recursive: true });
  for (const step of plan.steps) {
    if (step.region) { await p.evaluate((id) => E.Game.travel(id, { quiet: true }), step.region); await p.waitForTimeout(2500); }
    await p.evaluate(() => window.__wrap && window.__wrap());
    if (step.eval) { const r = await p.evaluate(step.eval); if (r !== undefined) console.log(step.name || 'eval', JSON.stringify(r)); }
    if (step.wait) await p.waitForTimeout(step.wait);
    if (step.shot) { await p.waitForTimeout(step.settle || 900); await p.screenshot({ path: `${outDir}/${step.shot}.png` }); console.log('shot', step.shot); }
  }
  console.log('errors:', JSON.stringify(errs.slice(0, 15)));
  await b.close();
})().catch((e) => { console.error('HARNESS FAIL', e); process.exit(1); });
