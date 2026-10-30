/* Zonas seguras (mecânica do jogo, não regra de D&D): interiores (lojas, casas, estalagens, cozinhas), o centro das
   vilas e a área civil de Aurenna. Ali a arma é guardada na bainha — continua equipada e na mochila —, as criaturas não
   iniciam combate e a barra rápida mostra a arma indisponível. Todo o resto do jogo consulta este módulo. */
(() => {
  'use strict';
  const U = E.U;
  const Z = { safe: false, kind: null, name: '' };
  // Meia-largura/meia-profundidade do centro da vila (o calçamento tem 36×60) e o retângulo urbano de Aurenna,
  // que coincide com a área onde o mundo já não cria acampamentos de criaturas.
  Z.CONFIG = Object.freeze({ villageHalfW: 21, villageHalfD: 33, city: { minX: -74, maxX: 74, minZ: -94, maxZ: 48 } });
  const NONE = Object.freeze({ safe: false, kind: null, name: '' });

  Z.at = (w, x, z) => {
    const inside = E.Interior && E.Interior.current;
    if (inside) return { safe: true, kind: 'interior', name: inside.title || inside.name || 'Interior' };
    if (!w || w.cave || !Number.isFinite(x) || !Number.isFinite(z)) return NONE;
    if (w.reg && w.reg.metro) {
      const c = Z.CONFIG.city;
      return x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ ? { safe: true, kind: 'city', name: 'Aurenna' } : NONE;
    }
    const p = w.village && w.village.plan;
    if (p) {
      const dx = x - p.x, dz = z - p.z, c = Math.cos(p.rotation || 0), s = Math.sin(p.rotation || 0);
      const lx = c * dx - s * dz, lz = s * dx + c * dz;
      if (Math.abs(lx) <= Z.CONFIG.villageHalfW && Math.abs(lz) <= Z.CONFIG.villageHalfD) return { safe: true, kind: 'village', name: w.village.name || 'Vila' };
    }
    return NONE;
  };
  Z.here = () => { const w = E.WG && E.WG.world, h = w && w.hero; return Z.at(w, h ? h.x : NaN, h ? h.z : NaN); };
  // Tipo de arma a desenhar no herói: null (guardada) dentro de zona segura.
  Z.weaponType = (h, w) => ((w && w.hero ? Z.at(w, w.hero.x, w.hero.z) : Z.here()).safe ? null : E.SP.heroWeaponType(h));
  Z.canFight = () => !Z.here().safe;

  let last = 0, lastWorld = null;
  Z.tick = (mode, w) => {
    if (mode === 'arena') return;
    const now = performance.now();
    if (now - last < 125 && lastWorld === w) return; // ~8 verificações por segundo bastam
    last = now; lastWorld = w;
    Z.refresh();
  };
  Z.refresh = (quiet = false) => {
    const at = Z.here(), w0 = E.WG && E.WG.world;
    // Região nova: o mundo pode ter desenhado o herói antes de virar o mundo atual; redesenha em silêncio.
    if (w0 !== Z.world) { Z.world = w0; if (w0 && w0.refreshHeroFrames && at.safe === Z.safe && E.WG.mode() === 'world') w0.refreshHeroFrames(); }
    if (at.safe === Z.safe && at.kind === Z.kind) return false;
    const was = Z.safe;
    Z.safe = at.safe; Z.kind = at.kind; Z.name = at.name;
    if (was !== Z.safe) {
      const w = E.WG && E.WG.world, mode = E.WG && E.WG.mode && E.WG.mode();
      if (w && mode === 'world' && w.refreshHeroFrames) { w.refreshHeroFrames(); if (!quiet && E.Hotbar && E.Hotbar.sheatheFx) E.Hotbar.sheatheFx(Z.safe); }
      else if (E.Net && E.Net.connected) E.Net.hello();
      if (!quiet && mode === 'world' && E.UI && E.UI.toast) E.UI.toast(Z.safe ? `${Z.name}: área protegida. Sua arma foi guardada.` : 'Você saiu da área protegida. Arma em mãos.');
    }
    U.emit('zone:changed', { safe: Z.safe, kind: Z.kind, name: Z.name });
    return true;
  };
  E.Zones = Z;
})();
