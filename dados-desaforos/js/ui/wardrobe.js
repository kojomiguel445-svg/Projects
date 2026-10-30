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

  // Miniaturas saem do mesmo renderizador do herói. Cache limitado evita refazer
  // centenas de desenhos ao trocar uma opção ou ao reabrir o guarda-roupa.
  const thumbCache = new Map();
  const thumbnail = (look, cls, species, ancestry, kind) => {
    const L = CH.normalize(look, cls, species, ancestry);
    if (kind !== 'outfit') Object.assign(L, { acc: 'nenhum', outfit: 'aventureiro', cape: 'nenhuma' });
    const key = `${species}|${kind}|${JSON.stringify(L)}`;
    if (thumbCache.has(key)) return thumbCache.get(key);
    const source = CH.draw({ look: L, species, frame: 'idle0' });
    let src;
    if (kind === 'outfit') src = E.SP.portrait(source, 2);
    else {
      const cv = document.createElement('canvas');
      cv.width = 64; cv.height = 54;
      const p = cv.getContext('2d');
      p.imageSmoothingEnabled = false;
      if (kind === 'eyes') p.drawImage(source, 16, 13, 32, 18, 0, 9, 64, 36);
      else if (kind === 'mouths') p.drawImage(source, 16, 22, 32, 18, 0, 9, 64, 36);
      else p.drawImage(source, 0, 0, 64, 54, 0, 0, 64, 54);
      src = cv.toDataURL();
    }
    thumbCache.set(key, src);
    while (thumbCache.size > 600) thumbCache.delete(thumbCache.keys().next().value);
    return src;
  };

  // Monta os controles dentro de `box`. `get()` devolve o objeto look atual; `onChange` redesenha.
  WR.editor = (box, ctx) => {
    const savedPage = (key) => { const m = /-(\d+)$/.exec(ctx.get()[key] || ''); return m ? Math.floor((Number(m[1]) - 1) / 25) : 0; };
    const pages = { hair: savedPage('hairPreset'), eyes: savedPage('eyeShape'), mouths: savedPage('mouthShape') };
    let hairGroup = (ctx.get().hairPreset || '').startsWith('fh-') ? 'feminino' : 'masculino';
    let bindings = [], observer, generation = 0, pendingFrame = 0;
    const pendingImages = new Map();
    const destroy = () => {
      if (observer) observer.disconnect();
      pendingImages.clear();
      if (pendingFrame) cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
    };
    const ancestry = () => typeof ctx.ancestry === 'function' ? ctx.ancestry() : null;
    const value = (key) => ctx.get()[key] ?? ({ presentation: 'neutra', dragonHorns: 'auto', dragonSnout: 'auto', dragonCrest: 'auto', scalePattern: 'auto' }[key] ?? null);
    const refresh = () => bindings.forEach((f) => f());
    const flushImages = () => {
      pendingFrame = 0;
      let budget = 6;
      for (const [img, job] of pendingImages) {
        pendingImages.delete(img);
        if (job.generation !== generation || !box.contains(img)) continue;
        const src = job.render();
        if (img.getAttribute('src') !== src) img.src = src;
        if (--budget === 0) break;
      }
      if (pendingImages.size) pendingFrame = requestAnimationFrame(flushImages);
    };
    const queueImage = (img) => {
      pendingImages.set(img, { render: img._skinRender, generation });
      if (!pendingFrame) pendingFrame = requestAnimationFrame(flushImages);
    };
    const image = (img, render) => {
      img.loading = 'lazy'; img.decoding = 'async'; img._skinRender = render;
      bindings.push(() => { if (img._skinVisible || !observer) queueImage(img); });
      if (observer) observer.observe(img); else queueImage(img);
    };
    const setMany = (changes) => {
      Object.assign(ctx.get(), changes);
      ctx.onChange();
      refresh();
    };
    const set = (key, next) => setMany({ [key]: next });
    const draw = () => {
      generation++;
      destroy();
      bindings = [];
      observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver((entries) => {
        if (!box.isConnected) { destroy(); return; }
        entries.forEach(({ target, isIntersecting }) => {
          target._skinVisible = isIntersecting;
          if (isIntersecting) queueImage(target);
        });
      }, { rootMargin: '120px' }) : null;
      const L = ctx.get();
      const sp = E.H.SPECIES[ctx.species()];
      const skins = E.Skins || {};
      box.innerHTML = '';
      const sec = (title, inner) => { const d = U.h(`<div class="detail ap-sec"><h4>${title}</h4></div>`); inner(d); box.appendChild(d); };
      const swatches = (d, key, colors, custom = true) => {
        const row = U.h('<div class="swatches"></div>');
        colors.forEach((col) => {
          const b = U.h(`<button type="button" class="sw" style="background:${col}" aria-label="Cor ${col}"></button>`);
          bindings.push(() => { const selected = value(key) === col; b.classList.toggle('on', selected); b.setAttribute('aria-pressed', String(selected)); });
          b.onclick = () => set(key, col); row.appendChild(b);
        });
        if (custom) {
          const lab = U.h('<label class="sw sw-custom" title="Cor personalizada"><input type="color" aria-label="Cor personalizada"></label>');
          const input = lab.querySelector('input');
          bindings.push(() => {
            const selected = !colors.includes(value(key));
            lab.classList.toggle('on', selected);
            lab.style.background = selected ? value(key) : 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)';
            input.value = value(key);
          });
          input.oninput = (e) => set(key, e.target.value);
          row.appendChild(lab);
        }
        d.appendChild(row);
      };
      const seg = (d, key, opts, choose = (v) => set(key, v), selected = (v) => String(value(key)) === String(v)) => {
        const row = U.h('<div class="seg seg-wrap"></div>');
        for (const [v, n] of opts) {
          const b = U.h(`<button type="button">${U.esc(n)}</button>`);
          bindings.push(() => { const on = selected(v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
          b.onclick = () => choose(v); row.appendChild(b);
        }
        d.appendChild(row);
        return row;
      };
      const catalog = (d, kind, key, title) => {
        const list = skins[kind] || [];
        if (!list.length) return;
        const details = U.h(`<details class="skin-catalog" ${kind === 'hair' ? 'open' : ''}><summary class="skin-summary">${title} · <span class="skin-count"></span></summary><div class="skin-catalog-body"></div></details>`);
        const body = details.querySelector('.skin-catalog-body');
        const count = details.querySelector('.skin-count');
        let filter;
        if (kind === 'hair') {
          filter = seg(body, key, [['masculino', 'Masculinos (50)'], ['feminino', 'Femininos (50)']], (group) => {
            hairGroup = group; pages[kind] = 0; renderPage(); refresh();
          }, (group) => group === hairGroup);
          filter.classList.add('skin-filter');
          body.appendChild(U.h('<p class="skin-note">Todos os cabelos estão disponíveis para qualquer apresentação.</p>'));
        }
        const original = U.h(`<button type="button" class="btn sm dark skin-original">${kind === 'hair' ? 'Usar estilo clássico' : 'Formato original da espécie'}</button>`);
        original.onclick = () => set(key, null);
        body.appendChild(original);
        const grid = U.h(`<div class="skin-grid" role="group" aria-label="${title}"></div>`);
        const pager = U.h(`<div class="skin-pager"><button type="button" class="btn sm dark" aria-label="Página anterior de ${title}">‹ Anterior</button><span aria-live="polite"></span><button type="button" class="btn sm dark" aria-label="Próxima página de ${title}">Próxima ›</button></div>`);
        const [prev, next] = pager.querySelectorAll('button');
        const pageLabel = pager.querySelector('span');
        body.appendChild(grid); body.appendChild(pager);
        let pageBindings = [], visibleList = [], renderedPage = -1, renderedGroup = '';
        const renderPage = () => {
          visibleList = kind === 'hair' ? list.filter((item) => item.group === hairGroup) : list;
          const pageCount = Math.max(1, Math.ceil(visibleList.length / 25));
          pages[kind] = Math.max(0, Math.min(pages[kind], pageCount - 1));
          const start = pages[kind] * 25;
          prev.disabled = pages[kind] === 0; next.disabled = pages[kind] >= pageCount - 1;
          pageLabel.textContent = `${start + 1}–${Math.min(start + 25, visibleList.length)} de ${visibleList.length}`;
          if (!details.open || (renderedPage === pages[kind] && renderedGroup === hairGroup)) return;
          grid.querySelectorAll('img').forEach((img) => { if (observer) observer.unobserve(img); pendingImages.delete(img); });
          grid.innerHTML = ''; pageBindings = [];
          renderedPage = pages[kind]; renderedGroup = hairGroup;
          visibleList.slice(start, start + 25).forEach((item) => {
            const b = U.h(`<button type="button" class="skin-option" title="${U.esc(item.label)}"><img alt="" width="64" height="54"><span class="skin-label">${U.esc(item.label)}</span></button>`);
            const img = b.querySelector('img');
            img.loading = 'lazy'; img.decoding = 'async';
            img._skinRender = () => thumbnail(Object.assign({}, ctx.get(), { [key]: item.id }), ctx.cls(), ctx.species(), ancestry(), kind);
            if (observer) observer.observe(img); else queueImage(img);
            pageBindings.push(() => {
              const on = value(key) === item.id;
              b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
              if (img._skinVisible || !observer) queueImage(img);
            });
            b.onclick = () => set(key, item.id);
            grid.appendChild(b);
          });
        };
        prev.onclick = () => { pages[kind]--; renderPage(); refresh(); };
        next.onclick = () => { pages[kind]++; renderPage(); refresh(); };
        details.ontoggle = () => { if (details.open) { renderPage(); refresh(); } };
        bindings.push(() => {
          const selected = list.find((item) => item.id === value(key));
          count.textContent = selected ? selected.label : 'Original';
          original.classList.toggle('on', !selected);
          original.setAttribute('aria-pressed', String(!selected));
          pageBindings.forEach((f) => f());
        });
        d.appendChild(details);
        renderPage();
      };
      sec('Roupa', (d) => {
        const grid = U.h('<div class="outfit-grid"></div>');
        for (const [id, o] of Object.entries(CH.OUTFITS)) {
          const locked = !owns(id);
          const b = U.h(`<button type="button" class="outfit ${o.premium ? 'premium' : ''}" title="${U.esc(o.desc)}"><img alt="" width="64" height="78"><span>${o.name}</span>${locked ? `<small>${o.casino ? '🎰 Cassino' : o.reward ? `${o.icon || '🏅'} Prêmio` : `💎 ${o.premium}`}</small>` : ''}</button>`);
          image(b.querySelector('img'), () => {
            const current = ctx.get();
            return thumbnail(Object.assign({}, current, { outfit: id, acc: current.acc === 'classe' ? 'nenhum' : current.acc }), ctx.cls(), ctx.species(), ancestry(), 'outfit');
          });
          bindings.push(() => {
            const on = value('outfit') === id, locked = !owns(id);
            b.classList.toggle('on', on); b.classList.toggle('locked', locked); b.setAttribute('aria-pressed', String(on));
            if (b.querySelector('small')) b.querySelector('small').hidden = !locked;
          });
          b.onclick = async () => {
            const locked = !owns(id);
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
      sec('Apresentação', (d) => {
        seg(d, 'presentation', [['neutra', 'Neutra'], ['feminina', 'Feminina'], ['masculina', 'Masculina']]);
      });
      sec('Cabelo', (d) => {
        catalog(d, 'hair', 'hairPreset', '100 cabelos');
        const classic = U.h(`<details class="skin-classics" ${!L.hairPreset ? 'open' : ''}><summary>15 estilos clássicos</summary></details>`);
        seg(classic, 'hairStyle', CH.HAIR_STYLES.map((n, i) => [i, n]), (v) => setMany({ hairStyle: v, hairPreset: null }), (v) => !value('hairPreset') && value('hairStyle') === v);
        d.appendChild(classic);
        d.appendChild(U.h('<div class="ap-lab">Cor</div>'));
        swatches(d, 'hair', CH.HAIR);
        const bt = U.h(`<label class="toggle-row"><input type="checkbox" ${L.beard ? 'checked' : ''}> Barba</label>`);
        bt.querySelector('input').onchange = (e) => set('beard', e.target.checked);
        bindings.push(() => { bt.querySelector('input').checked = !!value('beard'); });
        d.appendChild(bt);
      });
      sec('Rosto e corpo', (d) => {
        if (ctx.species() === 'draconato') {
          const col = skins.ancestryColor ? skins.ancestryColor(ancestry()) : L.skin;
          const lineage = (sp.ancestries || {})[ancestry()] || 'Ancestralidade original';
          const note = U.h(`<div class="skin-ancestry"><span class="skin-ancestry-swatch" aria-hidden="true"></span><p>Cor das escamas: <b>${U.esc(lineage)}</b>. Ancestralidade escolhida em Espécie.</p></div>`);
          note.querySelector('span').style.background = col;
          d.appendChild(note);
          for (const [label, key, options] of [['Chifres', 'dragonHorns', skins.horns], ['Focinho', 'dragonSnout', skins.snouts], ['Crista', 'dragonCrest', skins.crests], ['Escamas', 'scalePattern', skins.patterns]]) {
            if (!options) continue;
            d.appendChild(U.h(`<div class="ap-lab">${label}</div>`));
            seg(d, key, Object.entries(options));
          }
        } else {
          d.appendChild(U.h('<div class="ap-lab">Tom de pele</div>'));
          swatches(d, 'skin', sp.look.skin.concat(['#f6dcc4', '#c98d68', '#6e432c'].filter((x) => !sp.look.skin.includes(x))));
        }
        catalog(d, 'eyes', 'eyeShape', '50 formatos de olhos');
        d.appendChild(U.h('<div class="ap-lab">Cor dos olhos</div>'));
        swatches(d, 'eyes', CH.EYES);
        catalog(d, 'mouths', 'mouthShape', '50 formatos de boca');
        d.appendChild(U.h('<div class="ap-lab">Porte</div>'));
        seg(d, 'build', Object.entries(CH.BUILDS));
        if (E.Sim && E.Sim.BALANCE) {
          const fat = E.Sim.BALANCE.fat, pct = n => Math.round(n * 100);
          d.appendChild(U.h(`<small class="muted">Gordo: corrida ${pct(1-fat.run)}% mais lenta, fome ${pct(fat.hunger-1)}% mais rápida, salto ${pct(1-fat.jump)}% menor e descida com paraquedas ${pct(fat.glideDescent-1)}% mais rápida. Seus atributos não mudam.</small>`));
        if (E.C && E.C.REFLECT) d.appendChild(U.h(`<small class="muted">Refletir Golpes (mecânica do jogo, não é regra de D&amp;D): ${Math.round(E.C.REFLECT.chance * 100)}% de chance de devolver ${Math.round(E.C.REFLECT.fraction * 100)}% do dano corpo a corpo recebido ao atacante, no máximo uma vez por rodada.</small>`));
        }
        const hl = U.h(`<div class="ap-lab">Altura: <b>${Math.round(L.height * 100)}%</b></div>`);
        d.appendChild(hl);
        const r = U.h(`<input type="range" class="ap-range" min="0.85" max="1.15" step="0.01" value="${L.height}" aria-label="Altura">`);
        r.oninput = () => { L.height = Number(r.value); hl.innerHTML = `Altura: <b>${Math.round(L.height * 100)}%</b>`; ctx.onChange(); };
        d.appendChild(r);
      });
      sec('Acessório', (d) => seg(d, 'acc', Object.entries(CH.ACCESSORIES).filter(([k]) => k !== 'classe')));
      sec('Capa', (d) => seg(d, 'cape', Object.entries(CH.CAPES)));
      const reset = U.h('<button class="btn sm dark"><span class="ico">↺</span>Visual padrão da classe</button>');
      reset.onclick = () => { const def = CH.defaultLook(ctx.cls(), ctx.species()); setMany({ outfit: def.outfit, c1: def.c1, c2: def.c2, acc: def.acc, cape: 'auto' }); };
      box.appendChild(reset);
      refresh();
    };
    draw();
    return { redraw: draw, destroy };
  };

  // ------------------------------------------------ Guarda-roupa
  WR.open = () => {
    const h = E.Store.hero();
    if (!h) return;
    const look = CH.normalize(h.look, h.cls, h.species, h.ancestry);
    const el = U.h(`<section class="screen paper"><div class="sheet">
      <div class="stage"><img class="pv" alt=""><div class="stxt"><div class="sname">${U.esc(h.name)}</div><div class="ssub">GUARDA-ROUPA</div></div></div>
      <div class="cpanel"><header class="screen-head"><h2>Guarda-roupa</h2><div class="grow"></div><span class="chip gold" data-gems>💎 ${E.state.gems}</span><button class="close" aria-label="Fechar">✕</button></header><div class="cbody"></div>
      <div class="cfoot"><button class="btn dark" data-a="cancel"><span class="ico">✕</span>Cancelar</button><button class="btn primary" data-a="save"><span class="ico">✓</span>Salvar visual</button></div></div>
    </div></section>`);
    const pv = () => {
      el.querySelector('.pv').src = E.SP.portrait(E.CH.draw({ look: CH.normalize(look, h.cls, h.species, h.ancestry), species: h.species, frame: 'idle0', weaponType: E.SP.heroWeaponType(h), weaponColor: E.SP.heroWeaponInfo(h), weaponRarity: E.SP.heroWeaponInfo(h).rar }), 6);
      el.querySelector('.pv').style.transform = `scale(${look.height * E.WG.speciesScale(h.species)})`;
      el.querySelector('[data-gems]').textContent = `💎 ${E.state.gems}`;
    };
    const editor = WR.editor(el.querySelector('.cbody'), { get: () => look, cls: () => h.cls, species: () => h.species, ancestry: () => h.ancestry, onChange: pv });
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
    UI.open(el, editor.destroy);
  };

  E.Wardrobe = WR;
})();
