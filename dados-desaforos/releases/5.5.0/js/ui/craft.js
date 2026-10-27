/* Ofícios de fabricação: cozinha (Taverna), alquimia, forja — e o Píer (varas e iscas). */
(() => {
  const U = E.U, UI = E.UI;
  const CR = {};
  const TITLES = { cozinha: '🍲 Taverna do Caneco Dourado', alquimia: '⚗ Alquimista das Mil Cores', forja: '🔨 Forja da Bigorna Celeste', pier: '🎣 Píer dos Pescadores' };
  const LEADS = {
    cozinha: 'Prepare e coma pratos com peixes e ervas: cada prato recupera 25 de saciedade e dá um efeito temporário. Para guardar comida na mochila, prepare as porções na fogueira.',
    alquimia: 'Transforme ervas em poções. Ervas de qualquer região servem como “Erva (qualquer)”.',
    forja: 'Funda minérios em mercadorias valiosas ou em Essência de Refino para melhorar armas ★3 e ★4.',
    pier: 'Varas melhores aumentam a zona de captura e atraem peixes raros. Iscas deixam peixes raros mais frequentes (uma por lançamento).',
  };

  CR.open = (kind) => {
    const h = E.Store.hero(); if (!h) return;
    const d = E.Life.data(h);
    const el = UI.screen(TITLES[kind], { right: '<span class="chip gold" data-gold></span>' });
    const body = el.querySelector('.screen-body');
    const draw = () => {
      el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po`;
      body.innerHTML = `<p class="muted tr-tip">${LEADS[kind]}</p>`;
      if (kind === 'pier') return pier();
      const prof = kind === 'cozinha' ? 'culinaria' : kind;
      const pr = E.Life.progress(h, prof);
      body.appendChild(U.h(`<div class="prof-mini"><span>${E.L.PROFS[prof].icon} ${E.L.PROFS[prof].name} Nv. ${pr.lv}</span><div class="bar xp"><i style="width:${pr.pct}%"></i></div><small>${E.L.PROFS[prof].perk(pr.lv)}</small></div>`));
      if (kind === 'cozinha') {
        const act = E.Life.activeBuffs(h);
        if (act.length) body.appendChild(U.h(`<div class="buffs-row">${act.map((b) => `<span class="chip gold">${E.L.BUFFS[b.id].icon} ${E.L.BUFFS[b.id].name} · ${b.left} min</span>`).join('')}</div>`));
      }
      for (const r of E.L.RECIPES[kind]) {
        if (r.locked && !(d.recipes || []).includes(r.id)) continue; // receitas exclusivas (missões)
        const can = E.Life.canCraft(h, r);
        const ing = Object.entries(r.need).map(([k, n]) => { const have = E.Life.have(h, k); return `<span class="ing ${have >= n ? 'ok' : 'no'}">${E.Life.keyName(k)} ${have}/${n}</span>`; }).join('');
        const eff = r.buff ? `${E.L.BUFFS[r.buff].icon} ${E.L.BUFFS[r.buff].desc} (${r.mins} min)` : r.desc;
        const row = U.h(`<div class="shop-item recipe ${can ? '' : 'cant'}"><div class="si">${r.icon}</div><div class="sx"><b>${r.name}</b><small>${eff}</small><div class="ings">${ing}${r.gold ? `<span class="ing ${h.gold >= r.gold ? 'ok' : 'no'}">🪙 ${r.gold}</span>` : ''}</div></div><button class="btn sm primary" ${can ? '' : 'disabled'}>${kind === 'cozinha' ? 'Cozinhar' : 'Fabricar'}</button></div>`);
        row.querySelector('button').onclick = async () => {
          const out = E.Life.craft(h, kind, r);
          if (!out) return;
          E.Audio.sfx(kind === 'forja' ? 'impact' : 'heal');
          const fx = U.h(`<div class="craft-pop"><span>${r.icon}</span></div>`); document.body.appendChild(fx); setTimeout(() => fx.remove(), 900);
          if (out.buff) UI.loot(E.L.BUFFS[out.buff].icon, `${E.L.BUFFS[out.buff].name} por ${out.mins} min`);
          if (out.hunger) UI.toast(`Refeição consumida: +${out.hunger} de saciedade.`);
          if (out.n) UI.loot(r.icon, `${r.name} ×${out.n}`);
          if (out.refined) UI.toast(`✴ ${out.refined}`, 'gold');
          if (out.saved) UI.toast('🔨 Golpe perfeito: os materiais não foram gastos!', 'gold');
          draw();
        };
        body.appendChild(row);
      }
    };
    const pier = () => {
      E.L.RODS.forEach((rd, i) => {
        const owned = d.rod >= i;
        if (rd.exclusive) { body.appendChild(U.h(`<div class="shop-item"><div class="si">🎣</div><div class="sx"><b>${rd.name}</b><small>${rd.desc} · ${rd.exclusive}</small></div>${owned ? '<span class="chip">✔ Sua</span>' : '<span class="chip">🔒</span>'}</div>`)); return; }
        const cost = rd.cost ? `${rd.cost.gold} po${rd.cost.ore ? ' + ' + Object.entries(rd.cost.ore).map(([o, n]) => `${n} ${E.L.ORES[o].name}`).join(', ') : ''}` : '';
        const row = U.h(`<div class="shop-item"><div class="si">🎣</div><div class="sx"><b>${rd.name}</b><small>${rd.desc}${cost && !owned ? ' · ' + cost : ''}</small></div>${owned ? '<span class="chip">✔ Sua</span>' : `<button class="btn sm primary" ${i !== d.rod + 1 ? 'disabled' : ''}>Comprar</button>`}</div>`);
        const b = row.querySelector('button');
        if (b) b.onclick = () => {
          const c = rd.cost;
          if (h.gold < c.gold) return UI.toast('Ouro insuficiente.');
          for (const [o, n] of Object.entries(c.ore || {})) if ((d.ores[o] || 0) < n) return UI.toast(`Faltam minérios: ${E.L.ORES[o].name}.`);
          h.gold -= c.gold; for (const [o, n] of Object.entries(c.ore || {})) d.ores[o] -= n;
          d.rod = i; E.Store.save(); E.Audio.sfx('levelup'); draw();
        };
        body.appendChild(row);
      });
      const bait = U.h(`<div class="shop-item"><div class="si">🪱</div><div class="sx"><b>Iscas Brilhantes ×5</b><small>Você tem ${d.bait} (e ${d.lbait} Iscas Lendárias — só com o Mestre Dendê, aqui no píer). Peixes raros +20% enquanto durarem.</small></div><button class="btn sm primary"><span class="ico">🪙</span>40 po</button></div>`);
      bait.querySelector('button').onclick = () => { if (h.gold < 40) return UI.toast('Ouro insuficiente.'); h.gold -= 40; d.bait += 5; E.Store.save(); draw(); };
      body.appendChild(bait);
      const sell = U.h('<button class="btn dark"><span class="ico">🐟</span>Vender peixes (peixaria)</button>');
      sell.onclick = () => { UI.close(el); E.Trade.open('aurenna', { tab: 'sell' }); };
      body.appendChild(sell);
    };
    draw();
    UI.open(el);
  };

  E.Craft = CR;
})();
