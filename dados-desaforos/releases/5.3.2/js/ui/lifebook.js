/* Livro da Vida: ofícios e títulos, Pescadex, carga/materiais e conquistas. */
(() => {
  const U = E.U, UI = E.UI;
  const LB = {};
  const BIOME_NAME = { forest: 'Bosque', city: 'Lunária e Aurenna', ruins: 'Ruínas', coast: 'Costa', mountain: 'Montanhas', astral: 'Observatório', market: 'Mercado', garden: 'Jardins', abyss: 'Abismo' };

  LB.open = (tab = 'oficios') => {
    const h = E.Store.hero(); if (!h) return;
    const d = E.Life.data(h);
    const el = UI.screen('📘 Vida & Ofícios');
    const body = el.querySelector('.screen-body');
    const draw = () => {
      body.innerHTML = `<div class="sheet-tabs" style="padding:0 0 10px">${[['oficios', '🛠 Ofícios'], ['dex', '📖 Pescadex'], ['carga', '🎒 Carga'], ['conq', '🏆 Conquistas']].map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="lb-body"></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const box = body.querySelector('.lb-body');
      ({ oficios, dex, carga, conq })[tab](box);
    };
    const oficios = (box) => {
      box.innerHTML = `<p class="muted tr-tip">Em Elarion você pode ser o que quiser: pescador, magnata, gladiador, chef… Cada ofício sobe de nível com a prática, dá Gemas a cada nível e libera títulos. Título atual: <b>${U.esc(d.title || 'nenhum')}</b>.</p><div class="prof-grid"></div>`;
      const grid = box.querySelector('.prof-grid');
      for (const [id, P] of Object.entries(E.L.PROFS)) {
        const pr = E.Life.progress(h, id);
        const started = (d.xp[id] || 0) > 0;
        const card = U.h(`<div class="prof-card ${started ? '' : 'new'}"><div class="pc-h"><span class="pc-i">${P.icon}</span><div><b>${P.name}</b><small>Nível ${pr.lv}${pr.lv >= 10 ? ' (máx.)' : ''}</small></div></div><div class="bar xp"><i style="width:${started ? pr.pct : 0}%"></i></div><small class="pc-p">${P.perk(pr.lv)}</small><div class="pc-t">${P.titles.map((t, i) => { const need = [1, 3, 6, 10][i]; const ok = started && pr.lv >= need; return `<button class="tt ${ok ? '' : 'lock'} ${d.title === t ? 'on' : ''}" ${ok ? '' : 'disabled'} title="Nível ${need}">${ok ? '' : '🔒 '}${t}</button>`; }).join('')}</div></div>`);
        card.querySelectorAll('.tt:not([disabled])').forEach((b) => (b.onclick = () => { d.title = d.title === b.textContent ? null : b.textContent; E.Store.save(); E.HUD.update(); draw(); }));
        grid.appendChild(card);
      }
    };
    const dex = (box) => {
      const all = Object.values(E.L.FISH), got = Object.keys(d.dex).length;
      box.innerHTML = `<p class="muted tr-tip">Registrados: <b>${got}/${all.length}</b>. Cada região tem seus próprios peixes — alguns raríssimos (★5). Peixes desconhecidos aparecem como silhuetas.</p>`;
      for (const [b, list] of Object.entries(E.L.FISH_BY_BIOME)) {
        if (b === 'metro') continue;
        const sec = U.h(`<div class="dex-sec"><h4>${BIOME_NAME[b]}</h4><div class="dex-grid"></div></div>`);
        for (const f of list) {
          const known = d.dex[f.id];
          const c = U.h(`<div class="dex-c r${f.r} ${known ? '' : 'unk'}" title="${known ? U.esc(f.desc) : '???'}"><img src="${E.Fishing.art(f, 3)}" alt=""><b>${known ? f.name : '???'}</b><small>${'★'.repeat(f.r)}${known ? ` · recorde ${known} cm` : ''}</small></div>`);
          sec.querySelector('.dex-grid').appendChild(c);
        }
        box.appendChild(sec);
      }
    };
    const carga = (box) => {
      const buffs = E.Life.activeBuffs(h);
      const rows = [];
      rows.push(`<div class="detail"><h4>🍲 Efeitos ativos</h4>${buffs.length ? buffs.map((b) => `<span class="chip gold">${E.L.BUFFS[b.id].icon} ${E.L.BUFFS[b.id].name} · ${b.left} min</span>`).join(' ') : '<small>Nenhum. Cozinhe na Taverna de Aurenna.</small>'}</div>`);
      rows.push(`<div class="detail"><h4>📦 Mercadorias (${E.Life.cargoCount(h)}/${E.Life.cap(h)} · ${E.L.CARTS[d.cart].name})</h4>${Object.entries(d.cargo).map(([g, n]) => `<span class="chip">${E.L.GOODS[g].icon} ${E.L.GOODS[g].name} ×${n} <small>(pagou ${d.cost[g]})</small></span>`).join(' ') || '<small>Vazio. Compre em um Posto Comercial ⚖.</small>'}</div>`);
      rows.push(`<div class="detail"><h4>🐟 Peixes</h4>${Object.entries(d.fish).map(([id, n]) => `<span class="chip">${E.L.FISH[id].name} ×${n}</span>`).join(' ') || '<small>Nenhum.</small>'}</div>`);
      rows.push(`<div class="detail"><h4>⛏ Minérios</h4>${Object.entries(d.ores).filter(([, n]) => n > 0).map(([id, n]) => `<span class="chip">${E.L.ORES[id].icon} ${E.L.ORES[id].name} ×${n}</span>`).join(' ') || '<small>Nenhum.</small>'}</div>`);
      rows.push(`<div class="detail"><h4>🌿 Ervas e materiais</h4>${Object.entries(h.materials || {}).filter(([, n]) => n > 0).map(([k, n]) => `<span class="chip">${U.esc(k)} ×${n}</span>`).join(' ') || '<small>Nenhum.</small>'}</div>`);
      rows.push(`<div class="detail"><h4>🎣 Equipamento</h4><span class="chip">${E.L.RODS[d.rod].name}</span> <span class="chip">🪱 Iscas ×${d.bait}</span> <span class="chip">🟡 Fichas de cassino ×${d.chips}</span></div>`);
      box.innerHTML = rows.join('');
    };
    const conq = (box) => {
      const n = Object.keys(d.ach).length;
      box.innerHTML = `<p class="muted tr-tip">${n}/${E.L.ACHIEVEMENTS.length} conquistas.</p>`;
      for (const a of E.L.ACHIEVEMENTS) box.appendChild(U.h(`<div class="shop-item ${d.ach[a.id] ? '' : 'cant'}"><div class="si">${d.ach[a.id] ? '🏆' : '🔒'}</div><div class="sx"><b>${a.name}</b><small>${a.desc}</small></div><span class="chip gold">💎 ${a.gems}</span></div>`));
    };
    draw();
    UI.open(el);
  };

  E.LifeBook = LB;
})();
