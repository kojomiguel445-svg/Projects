/* Editor de aparência (criação de personagem) e Guarda-roupa (trocar o visual a qualquer momento). */
(() => {
  const U = E.U, UI = E.UI, CH = E.CH;
  const WR = {};

  // roupas de prêmio: ficam liberadas quando a conquista já foi feita (também para saves antigos)
  const EARNED = {
    mestre_pescador: () => !!((E.state.chains || {}).dende || {}).done,
    gladiador: () => (E.state.heroes || []).some((h) => h.life && h.life.stats && (h.life.stats.arenaWins || []).includes('prata')),
  };
  const owns = (id) => { const o = CH.OUTFITS[id]; return (!o.premium && !o.reward) || !!(E.state.outfits || {})[id] || !!(o.reward && EARNED[id] && EARNED[id]()); };
  WR.owns = owns;

  // Monta os controles dentro de `box`. `get()` devolve o objeto look atual; `onChange` redesenha.
  WR.editor = (box, ctx) => {
    const draw = () => {
      const L = ctx.get();
      const sp = E.H.SPECIES[ctx.species()];
      box.innerHTML = '';
      const sec = (title, inner) => { const d = U.h(`<div class="detail ap-sec"><h4>${title}</h4></div>`); inner(d); box.appendChild(d); };
      const swatches = (d, key, colors, custom = true) => {
        const row = U.h('<div class="swatches"></div>');
        colors.forEach((col) => { const b = U.h(`<button class="sw ${L[key] === col ? 'on' : ''}" style="background:${col}" aria-label="Cor ${col}"></button>`); b.onclick = () => set(key, col); row.appendChild(b); });
        if (custom) {
          const lab = U.h(`<label class="sw sw-custom ${!colors.includes(L[key]) ? 'on' : ''}" title="Cor personalizada" style="background:${!colors.includes(L[key]) ? L[key] : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)'}"><input type="color" value="${L[key]}" aria-label="Cor personalizada"></label>`);
          lab.querySelector('input').oninput = (e) => set(key, e.target.value, true);
          lab.querySelector('input').onchange = () => draw();
          row.appendChild(lab);
        }
        d.appendChild(row);
      };
      const seg = (d, key, opts) => {
        const row = U.h('<div class="seg seg-wrap"></div>');
        for (const [v, n] of opts) { const b = U.h(`<button class="${String(L[key]) === String(v) ? 'on' : ''}">${n}</button>`); b.onclick = () => set(key, v); row.appendChild(b); }
        d.appendChild(row);
      };
      sec('Roupa', (d) => {
        const grid = U.h('<div class="outfit-grid"></div>');
        for (const [id, o] of Object.entries(CH.OUTFITS)) {
          const locked = !owns(id);
          const prev = E.SP.portrait(CH.draw({ look: Object.assign({}, L, { outfit: id, acc: L.acc === 'classe' ? 'nenhum' : L.acc }), species: ctx.species(), frame: 'idle0' }), 2);
          const b = U.h(`<button class="outfit ${L.outfit === id ? 'on' : ''} ${locked ? 'locked' : ''} ${o.premium ? 'premium' : ''}" title="${U.esc(o.desc)}"><img src="${prev}" alt=""><span>${o.name}</span>${locked ? `<small>${o.casino ? '🎰 Cassino' : o.reward ? `${o.icon || '🏅'} Prêmio` : `💎 ${o.premium}`}</small>` : ''}</button>`);
          b.onclick = async () => {
            if (locked) {
              if (o.casino) return UI.toast('Este traje é um prêmio do Cassino Fortuna Dourada, em Aurenna.');
              if (o.reward) return UI.alert(o.name, `${o.desc}<br><br><b>Como ganhar:</b> ${o.reward}`);
              if (E.state.gems < o.premium) return UI.toast(`Você precisa de ${o.premium} Gemas Estelares.`);
              if (!(await UI.confirm(o.name, `${o.desc} Comprar por ${o.premium} 💎 Gemas Estelares? Ele fica disponível para todos os seus heróis.`, 'Comprar'))) return;
              E.state.gems -= o.premium;
              E.state.outfits = E.state.outfits || {};
              E.state.outfits[id] = true;
              E.Store.save();
              E.Audio.sfx('star5');
            }
            set('outfit', id);
          };
          grid.appendChild(b);
        }
        d.appendChild(grid);
        d.appendChild(U.h('<div class="ap-lab">Cor principal</div>'));
        swatches(d, 'c1', CH.CLOTH);
        d.appendChild(U.h('<div class="ap-lab">Cor de detalhe</div>'));
        swatches(d, 'c2', CH.CLOTH);
      });
      sec('Cabelo', (d) => {
        seg(d, 'hairStyle', CH.HAIR_STYLES.map((n, i) => [i, n]));
        d.appendChild(U.h('<div class="ap-lab">Cor</div>'));
        swatches(d, 'hair', CH.HAIR);
        const bt = U.h(`<label class="toggle-row"><input type="checkbox" ${L.beard ? 'checked' : ''}> Barba</label>`);
        bt.querySelector('input').onchange = (e) => set('beard', e.target.checked);
        d.appendChild(bt);
      });
      sec('Rosto e corpo', (d) => {
        d.appendChild(U.h('<div class="ap-lab">Tom de pele</div>'));
        swatches(d, 'skin', sp.look.skin.concat(['#f6dcc4', '#c98d68', '#6e432c'].filter((x) => !sp.look.skin.includes(x))));
        d.appendChild(U.h('<div class="ap-lab">Olhos</div>'));
        swatches(d, 'eyes', CH.EYES);
        d.appendChild(U.h('<div class="ap-lab">Porte</div>'));
        seg(d, 'build', Object.entries(CH.BUILDS));
        if (L.build === 'gordo') d.appendChild(U.h('<p class="ap-note" style="font-size:12px;margin:4px 0 8px;opacity:.8">Gordo (mecânica do jogo, não é regra de D&amp;D): a fome cai 25% mais rápido e há 8% de chance de <b>Refletir Golpes</b> — devolver ao atacante 25% do dano corpo a corpo recebido, no máximo uma vez por rodada.</p>'));
        const hl = U.h(`<div class="ap-lab">Altura: <b>${Math.round(L.height * 100)}%</b></div>`);
        d.appendChild(hl);
        const r = U.h(`<input type="range" class="ap-range" min="0.85" max="1.15" step="0.01" value="${L.height}" aria-label="Altura">`);
        r.oninput = () => { L.height = Number(r.value); hl.innerHTML = `Altura: <b>${Math.round(L.height * 100)}%</b>`; ctx.onChange(); };
        d.appendChild(r);
      });
      sec('Acessório', (d) => seg(d, 'acc', Object.entries(CH.ACCESSORIES).filter(([k]) => k !== 'classe')));
      sec('Capa', (d) => seg(d, 'cape', Object.entries(CH.CAPES)));
      const reset = U.h('<button class="btn sm dark"><span class="ico">↺</span>Visual padrão da classe</button>');
      reset.onclick = () => { const def = CH.defaultLook(ctx.cls(), ctx.species()); const L2 = ctx.get(); Object.assign(L2, { outfit: def.outfit, c1: def.c1, c2: def.c2, acc: def.acc, cape: 'auto' }); ctx.onChange(); draw(); };
      box.appendChild(reset);
    };
    const set = (k, v, silent) => { ctx.get()[k] = v; ctx.onChange(); if (!silent) draw(); };
    draw();
    return { redraw: draw };
  };

  // ------------------------------------------------ Guarda-roupa
  WR.open = () => {
    const h = E.Store.hero();
    if (!h) return;
    const look = CH.normalize(h.look, h.cls, h.species);
    const el = U.h(`<section class="screen paper"><div class="sheet">
      <div class="stage"><img class="pv" alt=""><div class="stxt"><div class="sname">${U.esc(h.name)}</div><div class="ssub">GUARDA-ROUPA</div></div></div>
      <div class="cpanel"><header class="screen-head"><h2>Guarda-roupa</h2><div class="grow"></div><span class="chip gold" data-gems>💎 ${E.state.gems}</span><button class="close" aria-label="Fechar">✕</button></header><div class="cbody"></div>
      <div class="cfoot"><button class="btn dark" data-a="cancel"><span class="ico">✕</span>Cancelar</button><button class="btn primary" data-a="save"><span class="ico">✓</span>Salvar visual</button></div></div>
    </div></section>`);
    const pv = () => {
      el.querySelector('.pv').src = E.SP.portrait(E.CH.draw({ look, species: h.species, frame: 'idle0', weaponType: E.SP.heroWeaponType(h), weaponColor: E.SP.heroWeaponInfo(h), weaponRarity: E.SP.heroWeaponInfo(h).rar }), 6);
      el.querySelector('.pv').style.transform = `scale(${look.height * E.WG.speciesScale(h.species)})`;
      el.querySelector('[data-gems]').textContent = `💎 ${E.state.gems}`;
    };
    WR.editor(el.querySelector('.cbody'), { get: () => look, cls: () => h.cls, species: () => h.species, onChange: pv });
    pv();
    el.querySelector('.close').onclick = () => UI.close(el);
    el.querySelector('[data-a=cancel]').onclick = () => UI.close(el);
    el.querySelector('[data-a=save]').onclick = () => {
      h.look = Object.assign({}, look);
      E.Store.save();
      if (E.WG.world) { E.WG.world.refreshHeroFrames(); }
      E.HUD.update();
      UI.toast('✦ Visual salvo!', 'gold');
      UI.close(el);
    };
    UI.open(el);
  };

  E.Wardrobe = WR;
})();
