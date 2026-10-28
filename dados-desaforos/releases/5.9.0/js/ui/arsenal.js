/* Arsenal: inventário de armas no estilo Genshin (grade + painel de detalhes). */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R, W = E.W, G = E.G;
  const AR = {};
  // afinidade da classe com a arma (ver W.AFFINITY)
  AR.affBox = (h, def) => {
    const aff = W.hasAffinity(h.cls, def, !!C.caster(h));
    const cls = C.cls(h).name;
    return AR.linBox(h, def, aff) + `<div class="aff ${aff ? 'ok' : 'no'}"><b>${aff ? '✔ Afinidade' : '✖ Sem afinidade'}</b> ${aff ? `— ${U.esc(cls)}s sabem usar esta arma: ela funciona normalmente.` : `— ${U.esc(cls)}s não treinam com ela: sem Bônus de Proficiência no ataque, sem Maestria, e a arma não desperta (passivo, bônus de nível e habilidade única desligados).`}<small>Afinidade de ${U.esc(cls)}: ${U.esc(W.affinityText(h.cls))}</small></div>`;
  };
  // armas de linhagem: espécie + classe, inspiração e ressonância com o herói
  AR.linBox = (h, def, aff = true) => {
    if (!def || !def.lineage) return '';
    const r = aff ? W.resonance(h, def) : 0;
    const st = r === 2 ? `<b class="res2">✦ Ressonância Total ativa</b> — ${U.esc(h.name)} é ${U.esc(W.lineageName(def))}: +2 no ataque e no dano, passivo +1 refinamento, habilidade única +4 dados e desperta na Ascensão 1.` : r === 1 ? `<b class="res1">◆ Ressonância de Classe ativa</b> — +1 no ataque e no dano e habilidade única +2 dados. Um(a) ${U.esc((E.H.SPECIES[def.lineage.species] || {}).name)} teria Ressonância Total.` : `<b>◇ Sem ressonância</b> — a arma funciona, mas desperta mais forte nas mãos de ${U.esc((E.H.CLASSES[def.lineage.cls] || {}).name)}.`;
    return `<div class="lin-box r${r}"><div class="lh">🧬 Arma de Linhagem · ${U.esc(W.lineageName(def))}</div><p>${st}</p><small>${W.resonanceText(def)}</small><small class="li">Inspirada em ${U.esc(def.insp || '')}.</small></div>`;
  };
  // habilidade única das ★5 e as ascensões que a despertam
  AR.sigBox = (id, asc = 0) => {
    const s = W.SIGNATURE[id]; if (!s) return '';
    const tier = W.sigTier(asc);
    const steps = ['Despertar', 'Fortalecer', 'Completar'];
    return `<div class="sig"><div class="sh">${s.icon} ${U.esc(s.name)} <small>Habilidade única ★5</small></div>${s.desc.map((d, i) => `<div class="st ${tier > i ? 'on' : ''}"><span>${tier > i ? '◆' : '◇'} ${steps[i]} · Ascensão ${W.SIG_ASC[i]}</span><p>${U.esc(d.replace('{d}', s.dice ? s.dice[i] : '').replace('{h}', s.heal ? s.heal[i] : ''))}</p></div>`).join('')}<p class="sn">${tier ? 'Ativa: 1× por combate, na aba Ação.' : `Bloqueada — ascenda a arma até a Ascensão ${W.SIG_ASC[0]} (passar do Nv. 40) para despertar.`}</p></div>`;
  };

  AR.open = (opts = {}) => {
    const h = E.Store.hero();
    let filter = opts.pickFor === 'focus' ? 'catalisador' : 'todas';
    let sel = null;
    const el = UI.screen(opts.pickFor ? (opts.pickFor === 'focus' ? 'Escolher Catalisador' : 'Escolher Arma') : opts.refineMode ? 'Forja · Refinar Armas' : 'Arsenal', { right: '<button class="btn sm dark" data-a="melt"><span class="ico">♻</span>Fundir excedentes</button>' });
    const body = el.querySelector('.screen-body');
    body.style.padding = '0';
    body.innerHTML = `<div class="arsenal"><div class="left"><div class="filters"></div><div class="wgrid"></div></div><aside class="wdetail"></aside></div>`;
    el.querySelector('[data-a=melt]').onclick = async () => {
      const ok = await UI.confirm('Fundir excedentes', 'Cópias de armas além das necessárias para R5 (e que não estejam equipadas ou travadas) viram Gemas Estelares: ★3 = 15, ★4 = 60, ★5 = 300.');
      if (!ok) return;
      const g = G.meltExtras();
      UI.toast(g ? `💎 +${g} Gemas Estelares` : 'Nada para fundir.');
      draw();
    };
    const groups = () => {
      // agrupa por id; mostra a melhor cópia e a contagem
      const map = new Map();
      for (const w of E.state.weapons) {
        const def = C.weaponDef(w);
        if (!def) continue;
        if (filter !== 'todas' && def.type !== filter) continue;
        const key = W.CATALOG[w.id] ? w.id : w.uid;
        const g = map.get(key) || { def, list: [] };
        g.list.push(w);
        map.set(key, g);
      }
      const arr = [...map.values()];
      arr.forEach((g) => g.list.sort((a, b) => (G.isEquipped(b.uid) ? 1 : 0) - (G.isEquipped(a.uid) ? 1 : 0) || b.refine - a.refine));
      arr.sort((a, b) => b.def.rarity - a.def.rarity || W.TYPE_ORDER.indexOf(a.def.type) - W.TYPE_ORDER.indexOf(b.def.type) || a.def.name.localeCompare(b.def.name));
      return arr;
    };
    const draw = () => {
      const fl = el.querySelector('.filters');
      fl.innerHTML = '';
      for (const f of ['todas', ...W.TYPE_ORDER]) {
        if (opts.pickFor === 'weapon' && f === 'catalisador') continue;
        if (opts.pickFor === 'focus' && f !== 'catalisador') continue;
        const b = U.h(`<button class="${filter === f ? 'on' : ''}">${f === 'todas' ? 'Todas' : E.WA.typeIcon(f) + W.TYPES[f].name}</button>`);
        b.onclick = () => { filter = f; sel = null; draw(); };
        fl.appendChild(b);
      }
      const grid = el.querySelector('.wgrid');
      grid.innerHTML = '';
      const gs = groups();
      if (!sel && gs.length) sel = gs[0].list[0].uid;
      for (const g of gs) {
        const w = g.list[0];
        const eqd = G.isEquipped(w.uid);
        const card = U.h(`<button class="wcard r${g.def.rarity} ${g.list.some((x) => x.uid === sel) ? 'sel' : ''}"><div class="wimg">${E.WA.svg(g.def, { still: true })}<span class="wst">${'★'.repeat(g.def.rarity)}</span></div>${g.def.rarity > 1 && g.def.passive ? `<span class="wr">R${w.refine}</span>` : ''}<span class="wup">Nv.${(E.Forge.norm(w), w.lv || 1)}</span>${W.hasAffinity(h.cls, g.def, !!C.caster(h)) ? '' : '<span class="wnaff" title="Sem afinidade">✖</span>'}${eqd ? `<span class="weq"><img src="${UI.heroPortrait(h)}" style="width:150%;image-rendering:pixelated;margin-top:40%" alt=""></span>` : g.list.length > 1 ? `<span class="wn">×${g.list.length}</span>` : ''}<div class="wlab">${U.esc(g.def.name)}</div></button>`);
        card.onclick = () => { sel = w.uid; draw(); };
        grid.appendChild(card);
      }
      if (!gs.length) grid.innerHTML = '<p style="grid-column:1/-1;color:#5a6378">Nenhuma arma deste tipo ainda. Visite o Oráculo!</p>';
      detail();
    };
    const detail = () => {
      const box = el.querySelector('.wdetail');
      const w = E.Store.weapon(sel);
      if (!w) { box.innerHTML = ''; return; }
      const def = C.weaponDef(w), rar = W.RARITY[def.rarity];
      box.className = `wdetail r${def.rarity}`;
      const base = def.base ? R.WEAPONS[def.base] : null;
      const slot = def.type === 'catalisador' ? 'focus' : 'weapon';
      const prof = def.base ? C.proficientWith(h, def.base) : !!C.caster(h);
      const eqd = h.equip[slot] === w.uid;
      const copies = W.CATALOG[w.id] ? G.copies(w.id).filter((x) => x.uid !== w.uid && !G.isEquipped(x.uid) && !x.lock && x.refine === 1).length : 0;
      const F = E.Forge; F.norm(w);
      box.innerHTML = `<div class="wtop"><div class="wname">${U.esc(def.name)} <span class="wup big">Nv.${w.lv || 1}</span></div><div class="wtype">${E.WA.typeIcon(def.type)}${W.TYPES[def.type].name}${base ? ` · ${base.name}` : ''} · ${E.WA.stars(def.rarity)}</div>${E.WA.svg(def, { cls: 'wbig' })}</div>
        <div class="wbody">
          <div class="wstat"><span>Raridade</span><b>${rar.name}${rar.bonus ? ` (+${rar.bonus})` : ''}</b></div>
          <div class="wstat"><span>Nível</span><b>${w.lv || 1} / ${F.cap(w, def)} · Ascensão ${w.asc || 0}/${F.maxAsc(def)}${F.hitUp(w) || F.dmgUp(w, def) ? ` · ${F.hitUp(w) ? `+${F.hitUp(w)} ataque, ` : ''}+${F.dmgUp(w, def)} dano` : ''}</b></div>
          ${base ? `<div class="wstat"><span>Dano</span><b>${base.dmg}${base.vers ? ` (${base.vers} em duas mãos)` : ''} ${R.DAMAGE[base.type].name}</b></div>
          <div class="wstat"><span>Bônus mágico</span><b>${rar.bonus ? `+${rar.bonus} no ataque e no dano` : '—'}</b></div>
          <div class="wstat"><span>Propriedades</span><b>${base.props.map((p) => R.PROP_NAMES[p]).join(', ') || '—'}</b></div>
          <div class="wstat"><span>Categoria</span><b>${base.cat === 'simples' ? 'Simples' : 'Marcial'} · ${base.kind === 'cac' ? 'Corpo a corpo' : 'À distância'}</b></div>
          ${base.mastery ? `<div class="wstat"><span>Maestria</span><b title="${U.esc(R.MASTERY[base.mastery].desc)}">${R.MASTERY[base.mastery].name} (${R.MASTERY[base.mastery].en})</b></div>` : ''}`
        : `<div class="wstat"><span>Bônus de conjuração</span><b>${rar.bonus ? `+${rar.bonus} no ataque mágico e na CD` : '—'}</b></div>`}
          ${def.passive ? `<div class="passive"><div class="ph">${U.esc(def.passive.name)}</div><p>${U.esc(W.passiveText(def, w.refine))}</p><div class="refine">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= w.refine ? 'on' : ''}"></i>`).join('')}</div><p style="font-size:11px;opacity:.7">Refinamento R${w.refine} · cópias disponíveis: ${copies}</p></div>` : ''}
          ${AR.sigBox(w.id, w.asc || 0)}
          ${base && base.mastery ? `<p style="font-size:12px;opacity:.8;line-height:1.5;margin-top:10px">${R.MASTERY[base.mastery].desc}</p>` : ''}
          ${AR.affBox(h, def)}
          <div class="lore">${U.esc(def.lore || '')}</div>
          ${!prof ? `<div class="warn">⚠ ${def.type === 'catalisador' ? `${C.cls(h).name}s não conjuram magias com este foco.` : `${C.cls(h).name}s não têm proficiência com ${base.name}: o Bônus de Proficiência não é somado ao ataque.`}</div>` : ''}
          ${base && base.props.includes('pesada') && (h.species === 'pequenino' || h.species === 'gnomo') ? '<div class="warn">⚠ Arma Pesada: criaturas Pequenas atacam com Desvantagem.</div>' : ''}
        </div>
        <div class="wactions"></div>`;
      const act = box.querySelector('.wactions');
      const canEquip = def.type !== 'catalisador' || !!C.caster(h);
      if (canEquip) {
        const b = U.h(`<button class="btn ${eqd ? 'dark' : 'primary'}" ${eqd ? 'disabled' : ''}><span class="ico">${eqd ? '✓' : '⚔'}</span>${eqd ? 'Equipada' : 'Equipar'}</button>`);
        b.onclick = () => {
          h.equip[slot] = w.uid; h.equip.visualSlot = slot;
          if (slot === 'weapon' && def.base && R.WEAPONS[def.base].props.includes('duas_maos')) h.equip.shield = false;
          if (slot === 'weapon' && C.cls(h).masteryCount && !(h.masteries || []).includes(def.base)) UI.toast('Maestria desta arma: disponível após um Descanso Longo.');
          E.Store.save();
          if (E.WG.world) E.WG.world.refreshHeroFrames();
          E.HUD.update();
          UI.toast(`⚔ ${def.name} equipada.`);
          if (opts.onPick) { opts.onPick(); UI.close(el); return; }
          draw();
        };
        act.appendChild(b);
      }
      if ((w.lv || 1) < F.maxLv(def) || (w.asc || 0) < F.maxAsc(def)) {
        const b = U.h(`<button class="btn dark"><span class="ico">⬆</span>${(w.lv || 1) >= F.cap(w, def) ? 'Ascender' : 'Subir de nível'}</button>`);
        b.onclick = () => { UI.close(el); E.Armory.open({ tab: 'aprimorar', uid: w.uid, title: 'Forja' }); };
        act.appendChild(b);
      }
      if (def.passive && w.refine < 5) {
        const b = U.h(`<button class="btn dark" ${copies ? '' : 'disabled'}><span class="ico">⚒</span>Refinar (R${w.refine}→R${w.refine + 1})</button>`);
        b.onclick = async () => {
          if (!await UI.confirm('Refinar arma', `Consumir 1 cópia de ${def.name} para subir para R${w.refine + 1}?`)) return;
          if (G.refine(w.uid)) { E.Audio.sfx('levelup'); UI.toast(`⚒ ${def.name} agora é R${w.refine}!`, 'gold'); }
          draw();
        };
        act.appendChild(b);
      }
      if (W.CATALOG[w.id]) {
        const b = U.h(`<button class="btn dark sm"><span class="ico">${w.lock ? '🔒' : '🔓'}</span>${w.lock ? 'Travada' : 'Travar'}</button>`);
        b.onclick = () => { w.lock = !w.lock; E.Store.save(); draw(); };
        act.appendChild(b);
      }
    };
    draw();
    UI.open(el);
  };

  E.Arsenal = AR;
})();
