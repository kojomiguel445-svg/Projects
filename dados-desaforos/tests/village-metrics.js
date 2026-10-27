/* Desnível da rua da vila e altura dos pedestais das lojas (executado no navegador). */
(() => {
  const w = E.WG.world, v = w.village; if (!v) return null;
  const p = v.plan, ca = Math.cos(p.rotation), sa = Math.sin(p.rotation), hs = [];
  for (let lx = -12; lx <= 12; lx += 3) for (let lz = -25; lz <= 25; lz += 2.5) hs.push(w.terrainAt(p.x + ca * lx + sa * lz, p.z - sa * lx + ca * lz));
  const plinths = v.venues.map((q) => { let lo = Infinity; for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) { const x = q.x + Math.cos(q.rotation) * a * q.w / 2 + Math.sin(q.rotation) * b * q.d / 2, z = q.z - Math.sin(q.rotation) * a * q.w / 2 + Math.cos(q.rotation) * b * q.d / 2; lo = Math.min(lo, w.terrainAt(x, z)); } return q.y - lo; });
  return { span: +(Math.max(...hs) - Math.min(...hs)).toFixed(1), maxPlinth: +Math.max(...plinths).toFixed(1), score: +(p.score || 0).toFixed(0) };
})()
