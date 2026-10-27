/* Métrica de assentamento das construções espalhadas (executada no navegador pelo harness).
   gap = quanto a base fica acima do terreno mais baixo sob ela; bury = quanto o terreno sobe acima da base. */
(() => {
  const w = E.WG.world, R = { house: [1.6, 1.4], tent: [1.1, 1.1], crate: [0.9, 0.5], pillar: [0.55, 0.55], arch: [2, 0.4] }, res = {};
  const venues = (w.venues || []).map((v) => ({ x: v.x, z: v.z, r: Math.hypot(v.w, v.d) / 2 + 1 }));
  for (const [kind, [hx, hz]] of Object.entries(R)) {
    const list = (w.propGroups || {})[kind] || []; let floating = 0, buried = 0, overlap = 0, worstGap = 0, worstBury = 0;
    list.forEach((p, i) => {
      const ca = Math.cos(p.r || 0), sa = Math.sin(p.r || 0), s = p.s || 1;
      const hs = [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]].map(([a, b]) => w.terrainAt(p.x + (a * ca + b * sa) * s, p.z + (-a * sa + b * ca) * s));
      const base = p.y !== undefined ? p.y : p.h, gap = base - Math.min(...hs) - (p.plinth || 0), bury = Math.max(...hs) - base;
      if (gap > 0.35) floating++; if (bury > 0.5) buried++;
      worstGap = Math.max(worstGap, gap); worstBury = Math.max(worstBury, bury);
      if (kind === 'house' && (list.some((q, j) => j !== i && Math.hypot(q.x - p.x, q.z - p.z) < 5.5) || venues.some((v) => Math.hypot(v.x - p.x, v.z - p.z) < v.r + 2))) overlap++;
    });
    if (list.length) res[kind] = { n: list.length, floating, buried, overlap, worstGap: +worstGap.toFixed(2), worstBury: +worstBury.toFixed(2) };
  }
  return res;
})()
