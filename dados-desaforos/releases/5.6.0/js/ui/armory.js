/* Armaria: comprar armas, subir o nível (1–90, estilo Genshin) e ascender, vender e comprar minérios. */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R, W = E.W;
  const AM = {};
  const TABS = [['comprar', '🛒 Comprar'], ['aprimorar', '⬆ Nível e Ascensão'], ['vender', '🪙 Vender'], ['minerios', '⛏ Materiais']];

  // bônus de D&D para um estado (nível/ascensão) da arma
  const statLines = (def, st = { lv: 1, asc: 0 }) => {
    const F = E.Forge, base = def.base ? R.WEAPONS[def.base] : null;
    const rar = W.RARITY[def.rarity];
    const hu = F.hitUp(st), du = F.dmgUp(st, def);
    const hit = rar.bonus + hu, dmg = rar.bonus + du;
    if (!base) return `<div class="wstat"><span>Conjuração</span><b>${hit ? `+${hit} no ataque mágico e na CD` : '—'}</b></div>${du ? `<div class="wstat"><span>Dano de magia</span><b>+${du} (1×/turno)</b></div>` : ''}`;
    return `<div class="wstat"><span>Dano</span><b>${base.dmg}${base.vers ? ` (${base.vers} em duas mãos)` : ''} ${R.DAMAGE[base.type].name}</b></div>
      <div class="wstat"><span>Bônus total</span><b>${hit || dmg ? `+${hit} no ataque · +${dmg} no dano` : '—'}</b></div>
      <div class="wstat"><span>Propriedades</span><b>${base.props.map((p) => R.PROP_NAMES[p]).join(', ') || '—'}</b></div>
      ${base.mastery ? `<div class="wstat"><span>Maestria</span><b>${R.MASTERY[base.mastery].name}</b></div>` : ''}`;
  };
  const passiveBox = (def, r = 1) => (def.passive ? `<div class="passive"><div class="ph">${U.esc(def.passive.name)}</div><p>${U.esc(W.passiveText(def, r))}</p></div>` : '');
  const upBadge = (w) => { E.Forge.norm(w); return `<span class="wup">Nv.${w.lv || 1}</span>`; };

  AM.open = (opts = {}) => {
    const h = E.Store.hero(); if (!h) return;
    const F = E.Forge;
    let tab = opts.tab || 'comprar', filter = 'todas', sel = opts.uid || null;
    const el = UI.screen(`⚒ ${U.esc(opts.title || 'Armaria')}`, { right: '<span class="chip gold" data-gold></span>' });
    const body = el.querySelector('.screen-body');
    body.style.padding = '0';
    body.style.display = 'flex'; body.style.flexDirection = 'column';

    const owned = () => E.state.weapons.map((w) => ({ w, def: C.weaponDef(w) })).filter((x) => x.def && (filter === 'todas' || x.def.type === filter))
      .sort((a, b) => (E.G.isEquipped(b.w.uid) ? 1 : 0) - (E.G.isEquipped(a.w.uid) ? 1 : 0) || b.def.rarity - a.def.rarity || (b.w.lv || 1) - (a.w.lv || 1) || a.def.name.localeCompare(b.def.name));

    const draw = () => {
      el.querySelector('[data-gold]').textContent = `🪙 ${h.gold} po · ${F.CORE_ICON} ${F.cores(h)} · ${Object.entries(F.FRAGS).map(([k, f]) => `${f.icon}${F.frags()[k] || 0}`).join(' ')}`;
      body.innerHTML = `<div class="sheet-tabs arm-tabs">${TABS.map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('')}</div><div class="arm-body"></div>`;
      body.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; sel = null; draw(); }));
      const box = body.querySelector('.arm-body');
      if (tab === 'minerios') return ores(box);
      box.innerHTML = '<div class="arsenal"><div class="left"><div class="filters"></div><div class="wgrid"></div></div><aside class="wdetail"></aside></div>';
      const fl = box.querySelector('.filters');
      for (const f of ['todas', ...W.TYPE_ORDER]) {
        const b = U.h(`<button class="${filter === f ? 'on' : ''}">${f === 'todas' ? 'Todas' : E.WA.typeIcon(f) + W.TYPES[f].name}</button>`);
        b.onclick = () => { filter = f; sel = null; draw(); };
        fl.appendChild(b);
      }
      const grid = box.querySelector('.wgrid'), det = box.querySelector('.wdetail');
      if (tab === 'comprar') return shop(grid, det);
      const list = owned().filter((x) => tab !== 'vender' || x.def.rarity < 5);
      if (!sel || !list.some((x) => x.w.uid === sel)) sel = list.length ? list[0].w.uid : null;
      for (const { w, def } of list) {
        const eqd = E.G.isEquipped(w.uid);
        const card = U.h(`<button class="wcard r${def.rarity} ${w.uid === sel ? 'sel' : ''}"><div class="wimg">${E.WA.svg(def, { still: true })}<span class="wst">${'★'.repeat(def.rarity)}</span></div>${upBadge(w)}${eqd ? '<span class="wn">E</span>' : ''}<div class="wlab">${U.esc(def.name)}</div></button>`);
        card.onclick = () => { sel = w.uid; draw(); };
        grid.appendChild(card);
      }
      if (!list.length) grid.innerHTML = `<p class="arm-empty">${tab === 'vender' ? 'Nada para vender.' : 'Nenhuma arma deste tipo.'}</p>`;
      const w = E.Store.weapon(sel);
      if (!w) return;
      if (tab === 'aprimorar') upgradePanel(det, w);
      else sellPanel(det, w);
    };

    // ---------------- comprar ----------------
    let shopSel = null;
    const shop = (grid, det) => {
      const items = F.stock().filter((it) => filter === 'todas' || it.def.type === filter);
      if (!shopSel || !items.some((i) => i.key === shopSel)) shopSel = items.length ? items[0].key : null;
      for (const it of items) {
        const price = F.priceFor(h, it), lock = h.level < it.lvl;
        const card = U.h(`<button class="wcard r${it.def.rarity} ${it.key === shopSel ? 'sel' : ''} ${lock ? 'locked' : ''}"><div class="wimg">${E.WA.svg(it.def, { still: true })}<span class="wst">${'★'.repeat(it.def.rarity)}</span></div>${it.kind === 'catalog' ? '<span class="wr">Armaria</span>' : ''}<div class="wlab">${U.esc(it.def.name)}</div><div class="wprice ${h.gold >= price ? '' : 'no'}">${lock ? `🔒 Nv. ${it.lvl}` : `🪙 ${price}`}</div></button>`);
        card.onclick = () => { shopSel = it.key; draw(); };
        grid.appendChild(card);
      }
      const it = items.find((i) => i.key === shopSel);
      if (!it) return;
      const def = it.def, price = F.priceFor(h, it), base = def.base ? R.WEAPONS[def.base] : null;
      const prof = def.base ? C.proficientWith(h, def.base) : !!C.caster(h);
      const have = E.state.weapons.filter((x) => (it.kind === 'catalog' ? x.id === it.id : x.id === it.key)).length;
      det.className = `wdetail r${def.rarity}`;
      det.innerHTML = `<div class="wtop"><div class="wname">${U.esc(def.name)}</div><div class="wtype">${E.WA.typeIcon(def.type)}${W.TYPES[def.type].name}${base ? ` · ${base.name}` : ''} · ${E.WA.stars(def.rarity)}</div>${E.WA.svg(def, { cls: 'wbig' })}</div>
        <div class="wbody">${statLines(def)}<div class="wstat"><span>Nível máximo</span><b>${F.maxLv(def)} (${F.maxAsc(def)} ascensões)</b></div>${passiveBox(def)}${E.Arsenal.sigBox(it.id || it.key)}${E.Arsenal.affBox(h, def)}<div class="lore">${U.esc(def.lore || '')}</div>
        ${have ? `<p class="arm-note">Você já tem ${have}. ${it.kind === 'catalog' ? 'Cópias extras servem para Refinar (R2…R5).' : ''}</p>` : ''}
        ${!prof ? `<div class="warn">⚠ ${def.type === 'catalisador' ? `${C.cls(h).name}s não conjuram com focos.` : `${C.cls(h).name}s não têm proficiência com ${base.name}.`}</div>` : ''}</div>
        <div class="wactions"><button class="btn primary" data-buy ${h.gold >= price && h.level >= it.lvl ? '' : 'disabled'}><span class="ico">🪙</span>${h.level < it.lvl ? `Nível ${it.lvl} necessário` : `Comprar · ${price} po`}</button></div>`;
      det.querySelector('[data-buy]').onclick = async () => {
        if (!await UI.confirm('Comprar arma', `Comprar <b>${U.esc(def.name)}</b> por ${price} po?`, 'Comprar', 'Cancelar')) return;
        const r = F.buy(h, it);
        if (r.error) return UI.toast(r.error);
        E.Audio.sfx('chest'); UI.loot(def.type === 'catalisador' ? '🔮' : '🗡', def.name);
        draw();
        const slot = def.type === 'catalisador' ? 'focus' : 'weapon';
        if ((def.type !== 'catalisador' || C.caster(h)) && await UI.confirm('Equipar agora?', `Quer equipar ${U.esc(def.name)}?`, 'Equipar', 'Depois')) {
          h.equip[slot] = r.weapon.uid; h.equip.visualSlot = slot;
          if (slot === 'weapon' && base && base.props.includes('duas_maos')) h.equip.shield = false;
          E.Store.save(); if (E.WG.world) E.WG.world.refreshHeroFrames(); E.HUD.update();
          UI.toast(`⚔ ${def.name} equipada.`);
        }
      };
    };

    // ---------------- nível e ascensão (estilo Genshin) ----------------
    let pick = { ferro: 0, prata: 0, cristal: 0 }, eat = new Set(), pickFor = null;
    const upgradePanel = (det, w) => {
      F.norm(w);
      const def = C.weaponDef(w), cap = F.cap(w, def), max = F.maxLv(def), lv = w.lv || 1;
      if (pickFor !== w.uid) { pick = { ferro: 0, prata: 0, cristal: 0 }; eat = new Set(); pickFor = w.uid; }
      det.className = `wdetail r${def.rarity}`;
      const asc = w.asc || 0, maxAsc = F.maxAsc(def);
      const stars = Array.from({ length: maxAsc }, (_, i) => `<i class="${i < asc ? 'on' : ''}">◆</i>`).join('');
      const need = F.expNext(lv, def.rarity);
      const oreHave = F.ores(h);
      // EXP escolhida
      let exp = 0; for (const [k, n] of Object.entries(pick)) exp += F.ORE_EXP[k] * n;
      for (const uid of eat) { const x = E.Store.weapon(uid); if (x) exp += F.fodderExp(x); }
      const sim = F.simulate(w, def, exp), gold = Math.ceil(sim.used * F.GOLD_PER_EXP);
      const toCap = F.expToCap(w, def);
      const head = `<div class="wtop"><div class="wname">${U.esc(def.name)}</div><div class="wtype">${E.WA.typeIcon(def.type)}${W.TYPES[def.type].name} · ${E.WA.stars(def.rarity)}</div>${E.WA.svg(def, { cls: 'wbig' })}</div>`;
      const lvBox = `<div class="wlv"><div class="wl-n">Nv. <b>${lv}</b>/${cap}</div><div class="wl-asc">${stars}</div></div>${lv < cap ? `<div class="bar wexp"><i style="width:${Math.min(100, (w.exp || 0) / need * 100)}%"></i>${exp ? `<i class="gain" style="width:${sim.lv > lv ? 100 : Math.min(100, ((w.exp || 0) + sim.used) / need * 100)}%"></i>` : ''}</div><small class="wexp-t">${w.exp || 0} / ${need} EXP${exp ? ` · +${exp} EXP → <b>Nv. ${sim.lv}</b>${sim.wasted ? ` (sobra ${sim.wasted})` : ''}` : ''}</small>` : ''}`;
      // estado atual → depois
      const after = { lv: sim.lv, asc };
      const rb = W.RARITY[def.rarity].bonus, dNow = F.dmgUp({ lv, asc }, def), dAft = F.dmgUp(after, def);
      const cmp = exp && sim.lv > lv ? `<div class="wcmp"><span>Depois (Nv. ${sim.lv}):</span> ${dAft > dNow ? `<b>+${rb + dAft} no dano</b> (agora +${rb + dNow})` : 'o próximo bônus de dano vem em níveis mais altos'}</div>` : '';
      let panel = '';
      if (lv >= max && asc >= maxAsc) panel = '<p class="arm-note gold">✦ Nível máximo! Esta arma chegou ao auge.</p>';
      else if (lv >= cap) {
        const ck = F.ascCheck(h, w), c = ck.cost;
        const row = (ok, icon, txt) => `<span class="ing ${ok ? 'ok' : 'no'}">${icon} ${txt}</span>`;
        const fr = F.frags();
        panel = `<div class="up-cost"><div class="kicker">✦ Ascensão ${asc + 1} → nível máximo ${F.CAPS[asc + 1]}</div><div class="ings">${row(h.gold >= c.gold, '🪙', `${c.gold} po`)}${row((fr[c.frag] || 0) >= c.fragN, F.FRAGS[c.frag].icon, `${F.FRAGS[c.frag].name} ${fr[c.frag] || 0}/${c.fragN}`)}${c.cores ? row(F.cores(h) >= c.cores, F.CORE_ICON, `${F.CORE} ${F.cores(h)}/${c.cores}`) : ''}${c.escama ? row(E.Life.escamas() >= c.escama, '🐚', `Escama Iridescente ${E.Life.escamas()}/${c.escama}`) : ''}</div>
          <p class="arm-note">Depois da ascensão: ${F.HIT_BY_ASC[asc + 1] > F.HIT_BY_ASC[asc] ? `<b>+1 nas jogadas de ataque</b> e ` : ''}o nível pode subir até ${F.CAPS[asc + 1]}. Fragmentos caem nos Domínios (portais 🌀 das regiões); Núcleos, dos chefes; Escamas Iridescentes, do Mestre Dendê (pescador do Píer de Aurenna).</p></div>`;
        panel += `<div class="wactions"><button class="btn primary" data-asc ${ck.ok ? '' : 'disabled'}><span class="ico">✦</span>Ascender</button>${!ck.ok ? `<small class="arm-miss">Falta: ${ck.miss.join(', ')}</small>` : ''}</div>`;
      } else {
        const candidates = E.state.weapons.filter((x) => x.uid !== w.uid && !E.G.isEquipped(x.uid) && !x.lock && C.weaponDef(x) && C.weaponDef(x).rarity <= 3);
        panel = `<div class="up-cost"><div class="kicker">Materiais de aprimoramento · faltam ${toCap} EXP para o Nv. ${cap}</div>
          <div class="ore-pick">${Object.entries(F.ORE_EXP).map(([k, e]) => `<div class="op ${pick[k] ? 'on' : ''}"><span class="op-i">${E.L.ORES[k].icon}</span><b>${E.L.ORES[k].name}</b><small>${e} EXP · tem ${oreHave[k] || 0}</small><div class="op-b"><button data-ore="${k}" data-d="-1">−</button><em>${pick[k]}</em><button data-ore="${k}" data-d="1">+</button></div></div>`).join('')}</div>
          ${candidates.length ? `<div class="kicker" style="margin-top:8px">Armas para consumir (★1 e ★3 livres)</div><div class="fod">${candidates.slice(0, 18).map((x) => { const d = C.weaponDef(x); return `<button class="fd r${d.rarity} ${eat.has(x.uid) ? 'on' : ''}" data-eat="${x.uid}" title="${U.esc(d.name)} · ${F.fodderExp(x)} EXP">${E.WA.svg(d, { still: true })}<small>${F.fodderExp(x)}</small></button>`; }).join('')}</div>` : ''}
          <div class="cs-row" style="justify-content:flex-start;margin-top:8px"><button class="btn sm dark" data-auto>⚡ Automático</button><button class="btn sm dark" data-clear>Limpar</button></div></div>
          <div class="wactions"><button class="btn primary" data-lvup ${exp && h.gold >= gold ? '' : 'disabled'}><span class="ico">⬆</span>Subir de nível${exp ? ` · ${gold} po` : ''}</button>${exp && h.gold < gold ? '<small class="arm-miss">Ouro insuficiente.</small>' : ''}</div>`;
      }
      det.innerHTML = `${head}<div class="wbody">${lvBox}${statLines(def, { lv, asc })}${cmp}${panel}${passiveBox(def, w.refine)}${E.Arsenal.sigBox(w.id, asc)}</div>`;
      det.querySelectorAll('[data-ore]').forEach((b) => (b.onclick = () => { const k = b.dataset.ore, d = +b.dataset.d; pick[k] = Math.max(0, Math.min(oreHave[k] || 0, pick[k] + d)); E.Audio.sfx('click'); upgradePanel(det, w); }));
      det.querySelectorAll('[data-eat]').forEach((b) => (b.onclick = () => { const u = b.dataset.eat; if (eat.has(u)) eat.delete(u); else eat.add(u); upgradePanel(det, w); }));
      const au = det.querySelector('[data-auto]');
      if (au) au.onclick = () => { // usa os minérios menores primeiro até chegar ao limite da ascensão
        pick = { ferro: 0, prata: 0, cristal: 0 }; eat = new Set();
        let left = F.expToCap(w, def);
        for (const k of ['cristal', 'prata', 'ferro']) { const e = F.ORE_EXP[k]; const n = Math.min(oreHave[k] || 0, Math.floor(left / e)); pick[k] = n; left -= n * e; }
        for (const k of ['ferro', 'prata', 'cristal']) { if (left <= 0) break; if ((oreHave[k] || 0) > pick[k]) { pick[k]++; left -= F.ORE_EXP[k]; } }
        upgradePanel(det, w);
      };
      const cl = det.querySelector('[data-clear]'); if (cl) cl.onclick = () => { pick = { ferro: 0, prata: 0, cristal: 0 }; eat = new Set(); upgradePanel(det, w); };
      const fx = async (big, txt) => {
        E.Audio.sfx('impact'); setTimeout(() => E.Audio.sfx(big ? 'levelup' : 'chest'), 260); E.App.buzz(big ? 120 : 40);
        const f = U.h(`<div class="forge-fx ${big ? 'asc' : ''}"><div class="ff-ring"></div><div class="ff-txt">${txt}</div></div>`);
        det.querySelector('.wtop').appendChild(f); await U.wait(big ? 900 : 560);
      };
      const lb = det.querySelector('[data-lvup]');
      if (lb) lb.onclick = async () => {
        const r = F.levelUp(h, w, pick, [...eat]);
        if (r.error) return UI.toast(r.error);
        pick = { ferro: 0, prata: 0, cristal: 0 }; eat = new Set();
        await fx(false, `<b>Nv. ${r.lv}</b>`);
        if (E.WG.world) E.WG.world.refreshHeroFrames();
        draw();
      };
      const ab = det.querySelector('[data-asc]');
      if (ab) ab.onclick = async () => { const r = F.ascend(h, w); if (!r) return; await fx(true, `ASCENSÃO ${r.asc}!<b>Nv. máx. ${F.CAPS[r.asc]}</b>`); draw(); };
    };

    // ---------------- vender ----------------
    const sellPanel = (det, w) => {
      const def = C.weaponDef(w), why = F.canSell(w), price = F.sellPrice(w);
      det.className = `wdetail r${def.rarity}`;
      det.innerHTML = `<div class="wtop"><div class="wname">${U.esc(def.name)} <span class="wup big">Nv.${w.lv || 1}</span></div><div class="wtype">${E.WA.typeIcon(def.type)}${W.TYPES[def.type].name} · ${E.WA.stars(def.rarity)}</div>${E.WA.svg(def, { cls: 'wbig' })}</div>
        <div class="wbody">${statLines(def, w)}${why ? `<div class="warn">${why}</div>` : `<p class="arm-note">O armeiro paga <b>${price} po</b> por ela${(w.lv || 1) > 1 ? ' (inclui parte do que você gastou nela)' : ''}.</p>`}</div>
        <div class="wactions"><button class="btn dark" data-sell ${why ? 'disabled' : ''}><span class="ico">🪙</span>Vender · ${price} po</button></div>`;
      det.querySelector('[data-sell]').onclick = async () => {
        if (!await UI.confirm('Vender arma', `Vender <b>${U.esc(def.name)} (Nv. ${w.lv || 1})</b> por ${price} po? Isso não pode ser desfeito.`, 'Vender', 'Cancelar')) return;
        const v = F.sell(h, w);
        if (v) { E.Audio.sfx('chest'); UI.loot('🪙', `${v} po`); sel = null; draw(); }
      };
    };

    // ---------------- minérios ----------------
    const ores = (box) => {
      const o = F.ores(h);
      box.innerHTML = `<div class="arm-ores"><p class="muted tr-tip">Minérios dão EXP às armas: <b>Ferro</b> 400 · <b>Prata Lunar</b> 2.000 · <b>Cristal Estelar</b> 10.000 (e custam 1 po a cada 10 EXP usados). Eles <b>não são vendidos</b>: compre uma picareta com um ferreiro ou mineiro e entre numa gruta (⛏). O que sobrar, os ferreiros compram.</p></div>`;
      const wrap = box.querySelector('.arm-ores');
      for (const id of Object.keys(E.L.ORES)) {
        const ore = E.L.ORES[id];
        wrap.appendChild(U.h(`<div class="shop-item"><div class="si">${ore.icon}</div><div class="sx"><b>${ore.name}</b><small>Você tem: ${o[id] || 0} · precisa da ${E.L.PICKAXES[ore.pick].name}</small></div></div>`));
      }
      wrap.appendChild(U.h(`<div class="shop-item"><div class="si">🐚</div><div class="sx"><b>Escama Iridescente</b><small>Você tem: ${E.Life.escamas()} · necessária da Ascensão 3 em diante. Ganhe com o Mestre Dendê (missões, trocas de peixes e o Aquário).</small></div></div>`));
      wrap.appendChild(U.h(`<div class="shop-item"><div class="si">${F.CORE_ICON}</div><div class="sx"><b>${F.CORE}</b><small>Você tem: ${F.cores(h)} · usado nas ascensões 3 a 6. Não está à venda: derrote chefes!</small></div></div>`));
      for (const [k, f] of Object.entries(F.FRAGS)) wrap.appendChild(U.h(`<div class="shop-item"><div class="si">${f.icon}</div><div class="sx"><b>${f.name}</b><small>Você tem: ${F.frags()[k] || 0} · Fragmento de Domínio (nível ${f.tier}) para ascender armas. Cai nos Domínios da Guilda e, às vezes, de monstros (mais com Nível de Mundo alto).</small></div></div>`));
    };

    draw();
    UI.open(el);
  };

  E.Armory = AM;
})();
