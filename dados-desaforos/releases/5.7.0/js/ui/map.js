/* Mapa-múndi de Elarion com teleporte entre estátuas. */
(() => {
  const U = E.U, UI = E.UI;
  const MP = {};
  const BIOME_COL = { forest: ['#5fbf77', '#2f6a3a'], city: ['#d9c7a0', '#7a6a4a'], ruins: ['#a8a090', '#5a5448'], coast: ['#6bdcff', '#2a6a9a'], mountain: ['#e8eef2', '#7a8a9a'], astral: ['#b8a6ff', '#4a3a8a'], market: ['#ff9ad5', '#7a3a6a'], garden: ['#ffd36b', '#9a6a2a'], abyss: ['#8a5aa8', '#2a1a3a'], metro: ['#ffe9a8', '#b8862a'] };
  const BIOME_IC = { forest: '🌲', city: '🏰', ruins: '🏛', coast: '🌊', mountain: '🏔', astral: '🔭', market: '🎪', garden: '🌸', abyss: '🕳', metro: '🏙' };

  MP.canTravel = (id) => {
    if (E.CoopWorld && E.CoopWorld.guest) return E.CoopWorld.canTravel(id);
    const v = E.state.world.visited;
    if (v[id]) return true;
    return Object.keys(v).some((k) => E.WD.REGIONS[k] && E.WD.REGIONS[k].neighbors.includes(id));
  };

  MP.open = () => {
    const el = UI.screen('Mapa de Elarion', { paper: false });
    const body = el.querySelector('.screen-body');
    body.style.display = 'flex'; body.style.flexDirection = 'column'; body.style.padding = '0';
    const cur = E.WD.home(E.WG.world ? E.WG.world.id : E.state.world.region);
    const ch = E.Quests.chapter();
    body.innerHTML = `<p class="muted" style="margin:0 22px 10px;font-size:13px">Toque numa região para ver detalhes. Você pode viajar para regiões já visitadas e para as vizinhas delas. O nível indicado é o recomendado.</p><div class="atlas"><canvas class="atlas-art"></canvas></div>`;
    const atlas = body.querySelector('.atlas');
    for (const [id, r] of Object.entries(E.WD.REGIONS)) {
      const [c1, c2] = BIOME_COL[r.biome];
      const can = MP.canTravel(id);
      const pin = U.h(`<button class="region-pin ${id === cur ? 'cur' : ''} ${can ? '' : 'locked'}" style="left:${r.x * 100}%;top:${r.y * 100}%"><span class="isl" style="background:radial-gradient(circle at 40% 35%, ${c1}, ${c2})">${BIOME_IC[r.biome]}${ch && !E.state.story.complete && ch.region === id ? '<span class="story">!</span>' : ''}</span><span class="rn">${r.name}</span><span class="rl">Nv. ${r.level}+${E.state.world.visited[id] ? ' · ✦' : ''}</span></button>`);
      pin.onclick = () => info(id, el);
      atlas.appendChild(pin);
    }
    const cv = atlas.querySelector('canvas');
    let last = '';
    const paint = () => { const k = cv.clientWidth + 'x' + cv.clientHeight; if (k === last || !cv.clientWidth) return; last = k; E.AA.paint(cv, { canTravel: MP.canTravel }); };
    const ro = new ResizeObserver(() => paint()); ro.observe(atlas);
    requestAnimationFrame(paint);
    E.WG.locked = true;
    UI.open(el, () => { ro.disconnect(); E.WG.locked = !!E.BattleUI.current; });
  };

  async function info(id, screen) {
    const r = E.WD.REGIONS[id];
    const cur = E.WG.world ? E.WD.home(E.WG.world.id) : null;
    const can = MP.canTravel(id);
    const h = E.Store.hero();
    const npcs = r.npcs.map((n) => E.WD.NPCS[n].name).join(', ');
    const mons = E.M.BY_REGION[id].map((k) => E.M.MONSTERS[k].name).join(', ');
    const buttons = [{ label: 'Fechar', value: false }];
    if (id !== cur && can) buttons.push({ label: E.state.world.visited[id] ? 'Teletransportar' : 'Viajar', value: true, cls: 'primary' });
    const go = await UI.modal({
      title: r.name,
      html: `<div style="font-size:13px;line-height:1.6;color:#4a5366"><p style="text-align:center;font-style:italic">“${r.short}”</p><p>${r.summary}</p><p><b>Clima:</b> ${r.weather} · <b>Nível recomendado:</b> ${r.level}+${h && h.level < r.level ? ' <span style="color:#c0392b">(perigoso para você!)</span>' : ''}</p><p><b>Habitantes:</b> ${npcs}</p><p><b>Criaturas:</b> ${mons}</p>${!can ? '<p style="color:#8a6a3a"><b>Ainda não é possível viajar para cá.</b> Visite uma região vizinha primeiro.</p>' : ''}</div>`,
      buttons,
    });
    if (go) { UI.close(screen); E.Game.travel(id); }
  }

  E.Map = MP;
})();
