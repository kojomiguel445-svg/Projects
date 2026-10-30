/* Ficha do personagem (estilo tela de Personagem do Genshin). */
(() => {
  const U = E.U, UI = E.UI, C = E.C, R = E.R, H = E.H, S = E.S, W = E.W;
  const SH = {};
  let tab = 'atributos';

  const breakdown = (title, detail) => {
    if (!detail || !detail.parts || !detail.parts.length) return '';
    return `<details class="feat" style="margin-top:10px"><summary>${U.esc(title)}${detail.total === undefined ? '' : `: ${detail.total}`}</summary>${detail.formula ? `<p>${U.esc(detail.formula)}</p>` : ''}<div class="attr-list">${detail.parts.map((part) => `<div class="attr"><span>${U.esc(part.label)}${part.custom ? ' <small>· regra autoral</small>' : ''}${part.source ? `<small style="display:block">${U.esc(part.source)}</small>` : ''}</span><b>${typeof part.value === 'number' ? U.sign(part.value) : U.esc(String(part.value))}</b></div>`).join('')}</div></details>`;
  };
  SH.chooseMagicInitiateAbility = async (h) => {
    const choices = C.magicInitiateAbilityChoices ? C.magicInitiateAbilityChoices(h) : [];
    if (!choices.length) return false;
    if (E.BattleUI.current) { UI.toast('Escolha o atributo do talento depois do combate.'); return false; }
    const ability = await UI.choose({ title: 'Atributo de Iniciado em Magia', text: 'Escolha uma vez o atributo usado por todas as magias deste talento. As magias da sua classe mantêm o atributo da classe.', options: choices.map((id) => ({ id, label: `${R.AB[id].name} (${U.sign(C.mod(h, id))})` })).concat([{ id: 'later', label: 'Decidir depois' }]) });
    if (!ability || ability === 'later') return false;
    const result = C.chooseMagicInitiateAbility(h, ability);
    if (!result.ok) { UI.toast(result.error); return false; }
    E.Store.save();
    if (E.HUD.update) E.HUD.update();
    return true;
  };
  let resolvingChoices = null;
  SH.resolveProgression = (h) => {
    if (resolvingChoices) return resolvingChoices;
    resolvingChoices = (async () => {
      if (!C.progressionChoices || !C.applyProgressionChoice) return false;
      if (E.BattleUI.current) { UI.toast('Escolha suas características depois do combate.'); return false; }
      let changed = false;
      if (C.reconcileOriginFeat && C.reconcileOriginFeat(h)) { changed = true; E.Store.save(); }
      if (h.pendingOriginFeat && C.originFeatChoices) {
        const removed = H.FEATS[h.pendingOriginFeat.removed];
        const picked = await UI.choose({ title: 'Talento de Origem do Humano', text: `Uma versão anterior oferecia talentos Gerais nesta escolha de Origem. ${removed ? removed.name + ' foi retirado dessa escolha e ficou registrado para recuperação. ' : ''}Escolha seu talento de Origem; o antecedente foi preservado.`, options: C.originFeatChoices(h).map((id) => ({ id, label: H.FEATS[id].name })).concat([{ id: 'later', label: 'Decidir depois' }]) });
        if (!picked || picked === 'later') return changed;
        const result = C.chooseOriginFeat(h, picked);
        if (!result.ok) { UI.toast(result.error); return changed; }
        changed = true; E.Store.save();
        if (E.HUD.update) E.HUD.update();
      }
      if (C.magicInitiateAbilityChoices && C.magicInitiateAbilityChoices(h).length) {
        const selected = await SH.chooseMagicInitiateAbility(h);
        if (!selected) return changed;
        changed = true;
      }
      for (;;) {
        const choice = C.progressionChoices(h)[0];
        if (!choice) return changed;
        if (!choice.count) {
          UI.toast(choice.id.startsWith('skilled_') ? 'Não há mais perícias disponíveis. A escolha de ferramentas de Habilidoso continua pendente.' : 'Não há perícias elegíveis para esta escolha. O benefício continua pendente.');
          return changed;
        }
        const selected = new Set();
        const p = UI.modal({ title: choice.name, html: `<p>Escolha ${choice.count} ${choice.kind === 'expertise' ? 'perícia(s) com proficiência para receber Especialização' : 'perícia(s) para receber proficiência'}.</p><p class="lead" data-count></p><div class="checks"></div>`, cls: 'wide', buttons: [{ label: 'Decidir depois', value: false }, { label: 'Confirmar', value: true, cls: 'primary' }] });
        const body = UI._modalBody, box = body.querySelector('.checks');
        const confirm = body.parentElement.querySelector('.row .primary');
        const draw = () => {
          body.querySelector('[data-count]').textContent = `${selected.size} de ${choice.count} escolhida(s)`;
          confirm.disabled = selected.size !== choice.count;
          box.innerHTML = '';
          for (const id of choice.options) {
            const skill = R.SKILLS[id];
            if (!skill) continue;
            const active = selected.has(id);
            const b = U.h(`<button class="check ${active ? 'on' : ''}" aria-pressed="${active}"><i>${active ? '✓' : ''}</i>${U.esc(skill.name)} (${R.AB[skill.ab].short})</button>`);
            b.onclick = () => { if (active) selected.delete(id); else if (selected.size < choice.count) selected.add(id); draw(); };
            box.appendChild(b);
          }
        };
        draw();
        if (!(await p)) return changed;
        const result = C.applyProgressionChoice(h, choice.id, [...selected]);
        if (!result || !result.ok) { UI.toast(result?.error || 'Não foi possível aplicar esta escolha.'); return changed; }
        changed = true;
        E.Store.save();
        if (E.HUD.update) E.HUD.update();
      }
    })().finally(() => { resolvingChoices = null; });
    return resolvingChoices;
  };

  SH.open = (startTab) => {
    const h = E.Store.hero();
    if (!h) return;
    if (startTab) tab = startTab;
    const el = U.h(`<section class="screen paper"><div class="sheet">
      <div class="stage"><img class="pv" alt=""><div class="stxt"><div class="sname"></div><div class="ssub"></div></div></div>
      <div class="cpanel"><header class="screen-head"><h2>Personagem</h2><div class="grow"></div><button class="close" aria-label="Fechar">✕</button></header><div class="sheet-tabs"></div><div class="cbody"></div></div>
    </div></section>`);
    el.querySelector('.close').onclick = () => UI.close(el);
    const draw = () => {
      el.querySelector('.pv').src = E.SP.portrait(E.SP.hero(h, 'idle0', E.SP.heroWeaponType(h)), 6);
      el.querySelector('.sname').textContent = h.name;
      el.querySelector('.ssub').textContent = `NÍVEL ${h.level} · ${C.cls(h).name.toUpperCase()}${C.sub(h) ? ' (' + C.sub(h).name.toUpperCase() + ')' : ''} · ${C.species(h).name.toUpperCase()}`;
      const tabs = [['atributos', 'Atributos'], ['arma', 'Arma'], ['caracteristicas', 'Características'], ...(C.canCast(h) ? [['magias', 'Magias']] : []), ['pericias', 'Perícias']];
      el.querySelector('.sheet-tabs').innerHTML = tabs.map(([id, n]) => `<button data-t="${id}" class="${tab === id ? 'on' : ''}">${n}</button>`).join('');
      el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
      const body = el.querySelector('.cbody');
      body.innerHTML = '';
      ({ atributos, arma, caracteristicas, magias, pericias })[tab](body, h, draw, el);
    };
    draw();
    UI.open(el);
  };

  function atributos(body, h, draw) {
    const next = C.xpForNext(h);
    const prof = C.attackProfile(h);
    body.innerHTML = `<div class="abil" style="margin-bottom:14px">${R.ABILITIES.map((a) => `<div class="ab"><div class="k">${a.short}</div><div class="v">${C.score(h, a.id)}</div><span class="m">${U.sign(C.mod(h, a.id))}</span><div class="bonus">${C.cls(h).saves.includes(a.id) ? 'TR prof.' : ''}</div></div>`).join('')}</div>
      <div class="attr-list">
        <div class="attr"><span>Pontos de Vida</span><b>${h.hp} / ${C.maxHp(h)}${h.tempHp ? ` (+${h.tempHp} temp.)` : ''}</b></div>
        <div class="attr"><span>Classe de Armadura</span><b>${C.ac(h)}</b></div>
        <div class="attr"><span>Iniciativa</span><b>${U.sign(C.initiative(h))}</b></div>
        <div class="attr"><span>Deslocamento</span><b>${String(C.speed(h)).replace('.', ',')} m</b></div>
        ${C.darkvision(h) ? `<div class="attr"><span>Visão no Escuro</span><b>${C.darkvision(h)} m</b></div>` : ''}
        ${h.look && h.look.build === 'gordo' ? `<div class="attr" title="Mecânica própria do jogo, não é regra de D&D"><span>Refletir Golpes <small style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:999px;background:#efe4f7;color:#5a3a7a;margin-left:4px">jogo</small></span><b>${Math.round(C.REFLECT.chance * 100)}% · ${Math.round(C.REFLECT.fraction * 100)}%</b></div>` : ''}
        <div class="attr"><span>Bônus de Proficiência</span><b>+${C.pb(h)}</b></div>
        <div class="attr"><span>Percepção Passiva</span><b>${C.passivePerception(h)}</b></div>
        <div class="attr"><span>Dados de Vida</span><b>${h.level - (h.hdUsed || 0)}/${h.level} d${C.cls(h).hd}</b></div>
        <div class="attr"><span>Ataque com arma</span><b>${U.sign(prof.toHit)} · ${prof.dice}${prof.dmgMod ? U.sign(prof.dmgMod) : ''} ${R.DAMAGE[prof.type].name}</b></div>
        ${C.sub(h) ? `<div class="attr"><span>Subclasse</span><b>${C.sub(h).icon} ${U.esc(C.sub(h).name)}</b></div>` : ''}
        ${C.canCast(h) ? `<div class="attr"><span>Ataque mágico / CD</span><b>${U.sign(C.spellAttack(h))} / ${C.spellDC(h)}</b></div>` : ''}
        <div class="attr"><span>Armadura</span><b>${R.ARMOR[h.equip.armor].name}${h.equip.shield ? ' + Escudo' : ''}</b></div>
        <div class="attr"><span>Testes de Resistência</span><b>${R.ABILITIES.map((a) => `${a.short} ${U.sign(C.saveBonus(h, a.id))}`).join(' · ')}</b></div>
        <div class="attr"><span>Experiência</span><b>${h.xp} XP${next ? ` / ${next}` : ' (nível máximo)'}</b></div>
        <div class="attr"><span>Ouro</span><b>${h.gold} po</b></div>
        <div class="attr"><span>Antecedente</span><b>${H.BACKGROUNDS[h.background].name}</b></div>
        <div class="attr"><span>Talentos</span><b>${(h.feats || []).map((f) => (H.FEATS[f] ? H.FEATS[f].name : f)).join(', ')}</b></div>
        ${h.fightingStyle ? `<div class="attr"><span>Estilo de Luta</span><b>${C.styles(h).map((s) => H.FIGHTING_STYLES[s].name).join(' + ')}</b></div>` : ''}
        ${C.cls(h).masteryCount ? `<div class="attr"><span>Maestria em Armas (${C.cls(h).masteryCount})</span><b>${(h.masteries || []).map((b) => `${R.WEAPONS[b].name} (${R.MASTERY[R.WEAPONS[b].mastery].name})`).join(', ') || '—'}</b></div>` : ''}
      </div>
      ${breakdown('Como a Classe de Armadura foi calculada', C.acBreakdown ? C.acBreakdown(h) : null)}
      ${breakdown('Bônus de ataque com arma', prof.breakdown?.toHit)}
      ${h.pendingOriginFeat || (C.magicInitiateAbilityChoices && C.magicInitiateAbilityChoices(h).length) || (C.progressionChoices && C.progressionChoices(h).length) ? '<div style="margin-top:14px"><button class="btn primary" data-a="rules"><span class="ico">✦</span>Escolher características pendentes</button></div>' : ''}
      ${h.pendingAsi ? '<div style="margin-top:14px"><button class="btn primary" data-a="asi"><span class="ico">✦</span>Aumento de Atributo ou Talento disponível!</button></div>' : ''}
      ${h.pendingStyle ? '<div style="margin-top:10px"><button class="btn primary" data-a="style"><span class="ico">⚔</span>Escolher Estilo de Luta</button></div>' : ''}
      ${h.level >= H.SUB_LEVEL && !h.subChosen ? '<div style="margin-top:10px"><button class="btn primary" data-a="sub"><span class="ico">✦</span>Escolher sua Subclasse</button></div>' : ''}
      <p style="margin-top:16px"><a href="regras-fontes.html" target="_blank" rel="noopener">Regras e fontes: referência oficial e conteúdo de Elarion</a></p>`;
    const asi = body.querySelector('[data-a=asi]');
    const rules = body.querySelector('[data-a=rules]');
    if (rules) rules.onclick = async () => { await SH.resolveProgression(h); draw(); };
    if (asi) asi.onclick = async () => { await SH.asi(h); draw(); };
    const sty = body.querySelector('[data-a=style]');
    if (sty) sty.onclick = async () => { await SH.style(h); draw(); };
    const sb = body.querySelector('[data-a=sub]');
    if (sb) sb.onclick = async () => { await SH.subclass(h); draw(); };
  }

  function arma(body, h, draw) {
    for (const slot of ['weapon', 'focus']) {
      if (slot === 'focus' && !C.caster(h)) continue;
      const eq = C.equipped(h, slot);
      const box = U.h(`<div class="feat" style="display:flex;gap:14px;align-items:center"><div class="wcard r${eq ? eq.def.rarity : 1}" style="width:96px;flex:none"><div class="wimg">${eq ? E.WA.svg(eq.def) : ''}</div></div><div style="flex:1"><div class="fh"><span>${slot === 'weapon' ? 'Arma' : 'Catalisador (foco)'}</span><small>${eq ? E.WA.stars(eq.def.rarity) : ''}</small></div><p><b>${eq ? U.esc(eq.def.name) : 'Nenhum'}</b>${eq && eq.bonus ? ` · +${eq.bonus}` : ''}${eq && eq.def.passive ? `<br>${U.esc(eq.def.passive.name)} (R${eq.refine}): ${U.esc(W.passiveText(eq.def, eq.refine))}` : ''}</p><button class="btn sm dark" style="margin-top:8px"><span class="ico">⇄</span>Trocar</button></div></div>`);
      box.querySelector('button').onclick = () => E.Arsenal.open({ pickFor: slot, onPick: draw });
      body.appendChild(box);
    }
    const prof = C.attackProfile(h);
    body.appendChild(U.h(`<div class="feat"><div class="fh"><span>Perfil de ataque</span></div><p>${U.esc(prof.name)}: ${U.sign(prof.toHit)} para acertar (${R.AB[prof.ability].name}${prof.proficient ? ' + proficiência' : ', <b>sem proficiência</b>'}), dano ${prof.dice}${prof.dmgMod ? U.sign(prof.dmgMod) : ''} ${R.DAMAGE[prof.type].name}. Crítico em ${prof.crit}–20.${prof.mastery ? ` Maestria: <b>${R.MASTERY[prof.mastery].name}</b> — ${R.MASTERY[prof.mastery].desc}` : C.cls(h).masteryCount ? ' A maestria desta arma fica ativa depois de um Descanso Longo.' : ''}</p></div>`));
    for (const [title, detail] of [['Bônus de ataque', prof.breakdown?.toHit], ['Modificadores de dano', prof.breakdown?.damage]]) {
      const html = breakdown(title, detail);
      if (html) body.appendChild(U.h(html));
    }
  }

  function caracteristicas(body, h, draw) {
    const sp = C.species(h);
    body.appendChild(U.h(`<h3>${C.cls(h).icon} ${C.cls(h).name}</h3>`));
    for (const [lv, , n, d] of C.cls(h).features) {
      body.appendChild(U.h(`<div class="feat" style="${h.level < lv ? 'opacity:.5' : ''}"><div class="fh"><span>${n}</span><small>Nível ${lv}</small></div><p>${d}</p></div>`));
    }
    // subclasse
    const sb = C.sub(h) || (H.SUBCLASSES[h.cls] || {})[H.SUB_DEFAULT[h.cls]];
    if (sb) {
      const box = U.h(`<div class="sub-card"><div class="sc-h"><span class="sc-i">${sb.icon}</span><div><b>${U.esc(sb.name)}</b><small>${h.level >= H.SUB_LEVEL ? 'Subclasse' : `Subclasse — escolhida no nível ${H.SUB_LEVEL}`} · ${sb.srd ? 'SRD 5.2.1 · resumo adaptado' : 'Livro do Jogador 2024 · referência não conferida'}</small></div></div><p class="sc-b">${U.esc(sb.blurb)}</p></div>`);
      for (const [lv, , n, d] of sb.features) box.appendChild(U.h(`<div class="feat" style="${h.level < lv ? 'opacity:.5' : ''}"><div class="fh"><span>${n}</span><small>Nível ${lv}</small></div><p>${d}</p></div>`));
      const pw = (sb.powers || []).filter((p) => h.level >= p.lvl);
      if (pw.length) box.appendChild(U.h(`<p class="sc-p">No combate: ${pw.map((p) => `<b>${p.icon} ${U.esc(p.name)}</b>`).join(' · ')}</p>`));
      if (h.level >= H.SUB_LEVEL) {
        const b = U.h(`<button class="btn sm ${h.subChosen ? 'dark' : 'primary'}" style="margin-top:6px"><span class="ico">⇄</span>${h.subChosen ? 'Trocar subclasse (300 po)' : 'Escolher subclasse'}</button>`);
        b.onclick = async () => { if (E.BattleUI.current) return UI.toast('Não dá para trocar durante o combate.'); await SH.subclass(h, { retrain: !!h.subChosen }); draw(); };
        box.appendChild(b);
      }
      body.appendChild(box);
    }
    body.appendChild(U.h(`<h3>${sp.name}</h3>`));
    for (const [n, d] of sp.traits) body.appendChild(U.h(`<div class="feat"><div class="fh"><span>${n}</span></div><p>${d}</p></div>`));
    // escolhas da espécie feitas na criação (regras 2024)
    const picks = [C.lineage(h) && [sp.lineageLabel, `${C.lineage(h).name} — ${C.lineage(h).l1}${C.lineage(h).l3 ? ` Nível 3: ${C.lineage(h).l3}${h.level >= 3 ? ' ✓' : ''}. Nível 5: ${C.lineage(h).l5}${h.level >= 5 ? ' ✓' : ''}.` : ''}`], C.legacy(h) && [sp.legacyLabel, `${C.legacy(h).name} — ${C.legacy(h).l1} Nível 3: ${C.legacy(h).l3}${h.level >= 3 ? ' ✓' : ''}. Nível 5: ${C.legacy(h).l5}${h.level >= 5 ? ' ✓' : ''}.`], C.dragon(h) && ['Ancestralidade Dracônica', `${C.dragon(h).name} · ${R.DAMAGE[C.dragon(h).type] ? R.DAMAGE[C.dragon(h).type].name : ''}`], C.giant(h) && [sp.giantLabel, `${C.giant(h).name}: ${C.giant(h).desc}`], h.size && ['Tamanho', h.size]].filter(Boolean);
    for (const [n, d] of picks) body.appendChild(U.h(`<div class="feat"><div class="fh"><span>${U.esc(n)}</span></div><p>${U.esc(d)}</p></div>`));
    if (sp.source) body.appendChild(U.h(`<p class="lead" style="font-size:11px">Fonte: ${U.esc(sp.source)}.</p>`));
    body.appendChild(U.h('<h3>Talentos</h3>'));
    for (const f of h.feats || []) if (H.FEATS[f]) body.appendChild(U.h(`<div class="feat"><div class="fh"><span>${H.FEATS[f].name}</span><small>${H.FEATS[f].general ? 'Geral' : 'Origem'}</small></div><p>${H.FEATS[f].desc}${h.featData && h.featData[f] ? ` <b>(${R.AB[h.featData[f]] ? R.AB[h.featData[f]].name : R.DAMAGE[h.featData[f]] ? R.DAMAGE[h.featData[f]].name : h.featData[f]})</b>` : ''}</p></div>`));
    for (const st of C.styles(h)) if (H.FIGHTING_STYLES[st]) body.appendChild(U.h(`<div class="feat"><div class="fh"><span>${H.FIGHTING_STYLES[st].name}</span><small>Estilo de Luta</small></div><p>${H.FIGHTING_STYLES[st].desc}</p></div>`));
  }

  function magias(body, h, draw) {
    const cls = C.cls(h);
    // magias concedidas pela subclasse (sempre preparadas)
    const own = new Set([...(h.cantrips || []), ...(h.prepared || []), ...(h.mi ? [...(h.mi.cantrips || []), h.mi.spell] : [])]);
    const granted = new Set(C.knownSpells(h).filter((id) => !own.has(id)));
    if (!cls.caster) {
      const sc = C.caster(h);
      body.innerHTML = `${sc ? `<p class="lead">${U.esc(C.sub(h).name)}: conjura magias de Mago com <b>${R.AB[sc.ab].name}</b> · Ataque ${U.sign(C.spellAttack(h))} · CD ${C.spellDC(h)}. As magias da subclasse ficam sempre preparadas.</p>` : ''}${h.mi && h.mi.spell ? `<p class="lead">Iniciado em Magia: você conhece ${(h.mi.cantrips || []).map((s) => S.SPELLS[s].name).join(', ')} e pode conjurar ${S.SPELLS[h.mi.spell].name} uma vez por Descanso Longo.</p>` : ''}`;
      spellOrigins(body, h, draw);
      const ids = [...new Set([...granted, ...(h.mi ? [...(h.mi.cantrips || []), h.mi.spell] : [])])].filter((id) => S.SPELLS[id]).sort((a, b) => S.SPELLS[a].level - S.SPELLS[b].level);
      for (const id of ids) body.appendChild(spellRow(h, id, true, true, draw));
      return;
    }
    const pm = C.preparedMax(h), maxLv = C.maxSpellLevel(h), ck = S.cantripsKnown(h.cls, h.level);
    body.innerHTML = `<p class="lead">Atributo: <b>${R.AB[cls.caster.ab].name}</b> · Ataque ${U.sign(C.spellAttack(h))} · CD ${C.spellDC(h)}. Truques ${h.cantrips.length}/${ck} · Preparadas ${h.prepared.length}/${pm}. Toque para preparar/desmarcar (fora de combate).${granted.size ? ' Magias da subclasse ficam sempre preparadas e não contam no limite.' : ''}</p>`;
    spellOrigins(body, h, draw);
    const featSpells = h.mi ? [...(h.mi.cantrips || []), h.mi.spell].filter((id) => S.SPELLS[id]) : [];
    const list = [...new Set([...S.listFor(h.cls).filter((id) => S.SPELLS[id].level <= maxLv && S.SPELLS[id].time !== 'smite' || (id === 'golpe_cegante' && maxLv >= 3)), ...granted, ...featSpells])];
    list.sort((a, b) => S.SPELLS[a].level - S.SPELLS[b].level);
    let lastLv = -1;
    for (const id of list) {
      const s = S.SPELLS[id];
      if (s.level !== lastLv) { lastLv = s.level; body.appendChild(U.h(`<h4 style="font-family:var(--display);margin:12px 0 6px">${s.level ? s.level + 'º Círculo' : 'Truques'}</h4>`)); }
      const arr = s.level === 0 ? h.cantrips : h.prepared;
      const max = s.level === 0 ? ck : pm;
      const always = (h.cls === 'paladino' && id === 'golpe_divino') || (h.cls === 'patrulheiro' && id === 'marca_cacador') || granted.has(id);
      const classOn = arr.includes(id), featOwns = featSpells.includes(id);
      const on = always || classOn || featOwns;
      const b = spellRow(h, id, on, always, draw);
      b.onclick = () => {
        if (always) return;
        if (E.BattleUI.current) return UI.toast('Não dá para trocar magias durante o combate.');
        if (!S.listFor(h.cls).includes(id)) return;
        if (classOn) arr.splice(arr.indexOf(id), 1);
        else if (arr.length < max) arr.push(id);
        else return UI.toast('Limite atingido — desmarque outra magia.');
        E.Store.save(); draw();
      };
      body.appendChild(b);
    }
  }

  function spellOrigins(body, h, draw) {
    if (!h.mi || !R.AB[h.mi.ab] || !C.spellSourceInfo) return;
    body.appendChild(U.h(`<p class="lead">Iniciado em Magia usa <b>${R.AB[h.mi.ab].name}</b>. A magia de 1º círculo pode ser conjurada gratuitamente uma vez por Descanso Longo, usando esse atributo.</p>`));
    if (C.magicInitiateAbilityChoices && C.magicInitiateAbilityChoices(h).length) {
      const ability = U.h('<button class="btn sm dark" data-mi-ability>Escolher atributo do talento</button>');
      ability.onclick = async () => { if (await SH.chooseMagicInitiateAbility(h)) draw(); };
      body.appendChild(ability);
    }
    for (const id of [...new Set([...(h.mi.cantrips || []), h.mi.spell])]) {
      if (!S.SPELLS[id]) continue;
      const info = C.spellSourceInfo(h, id);
      if (info.options.length < 2) continue;
      const selected = info.origin === 'mi' ? 'Iniciado em Magia' : C.cls(h).name;
      const button = U.h(`<button class="btn sm dark" style="display:block;max-width:100%;white-space:normal;text-align:left;line-height:1.4;margin:4px 0 10px" data-spell-source="${id}">${U.esc(S.SPELLS[id].name)}: ${U.esc(selected)} (${R.AB[info.ability].short}) · escolher origem</button>`);
      button.onclick = async () => {
        if (E.BattleUI.current) return UI.toast('Escolha a origem das magias depois do combate.');
        const source = await UI.choose({ title: S.SPELLS[id].name, text: 'Qual característica você usa para conjurar esta magia? O uso gratuito de Iniciado em Magia sempre usa o atributo do talento.', options: info.options.map((value) => ({ id: value, label: `${value === 'mi' ? 'Iniciado em Magia' : C.cls(h).name} · ${R.AB[C.castAb(h, id, value)].name} · Ataque ${U.sign(C.spellAttack(h, id, value))} / CD ${C.spellDC(h, id, value)}` })).concat([{ id: 'cancel', label: 'Cancelar' }]) });
        if (!source || source === 'cancel') return;
        const result = C.setSpellSource(h, id, source);
        if (!result.ok) return UI.toast(result.error);
        E.Store.save(); draw();
      };
      body.appendChild(button);
    }
  }

  // linha de magia (com botão Conjurar para curas e efeitos duradouros)
  function spellRow(h, id, on, always, draw) {
    const s = S.SPELLS[id];
    const b = U.h(`<button class="spell-row ${on ? 'on' : ''}"><span class="lv" style="background:${S.SCHOOL_COLORS[s.school] || '#888'}">${s.level || 'T'}</span><span><div class="sn">${s.name} <small style="color:#8a7a5a">· ${s.school}${s.conc ? ' · Concentração' : ''}${s.time === 'bonus' ? ' · Ação Bônus' : ''}${always ? ' · sempre preparada' : ''}</small></div><div class="sd">${s.desc}</div></span></button>`);
    const castable = on && (s.heal || ['armadura_arcana', 'auxilio'].includes(s.buff));
    if (castable) {
      const cb = U.h('<span class="btn sm primary" style="margin-left:auto;flex:none" role="button"><span class="ico">✦</span>Conjurar</span>');
      cb.onclick = (ev) => {
        ev.stopPropagation();
        if (E.BattleUI.current) return UI.toast('Use o menu de combate.');
        const r = C.castOutside(h, id);
        if (!r) return;
        if (r.error) return UI.toast(r.error);
        E.Audio.sfx('heal'); UI.toast('✦ ' + r.text); E.Store.save(); E.HUD.update(); draw();
      };
      b.appendChild(cb);
    }
    return b;
  }

  function pericias(body, h) {
    body.innerHTML = '<div class="attr-list"></div>';
    const l = body.querySelector('.attr-list');
    for (const [id, s] of Object.entries(R.SKILLS)) {
      const prof = (h.skills || []).includes(id), exp = (h.expertise || []).includes(id);
      l.appendChild(U.h(`<div class="attr"><span>${prof ? (exp ? '◆◆ ' : '◆ ') : '◇ '}${s.name} <small style="color:#8a8070">(${R.AB[s.ab].short})</small></span><b>${U.sign(C.skillBonus(h, id))}</b></div>`));
    }
  }

  // Nível 4 e 8: Aumento de Valor de Atributo OU um talento (regra de 2024)
  SH.asi = async (h) => {
    const ch = await UI.choose({ title: 'Aumento de Atributo ou Talento', text: 'Escolha +2 em atributos ou um talento cujos pré-requisitos você cumpra. Talentos de Origem não aumentam atributos.', options: [{ id: 'asi', label: 'Aumento de Valor de Atributo (+2 / +1 e +1)', icon: '⬆' }, { id: 'feat', label: 'Escolher um Talento', icon: '✦' }, { id: 'no', label: 'Decidir depois' }] });
    if (ch === 'feat') { if (!(await SH.feat(h))) return SH.asi(h); return true; }
    if (ch === 'asi') return SH.asiScores(h);
    return false;
  };
  SH.featOptions = (h) => Object.entries(H.FEATS).filter(([id, f]) => (f.general || H.FEATS_AT_ASI.includes(id)) && (f.repeatable || !(h.feats || []).includes(id)));
  SH.feat = async (h) => {
    const list = SH.featOptions(h).sort((a, b) => (b[1].general ? 1 : 0) - (a[1].general ? 1 : 0));
    let ch = null;
    const p = UI.modal({ title: '✦ Talentos', html: '<p class="sub-lead">Talentos Gerais dão +1 num atributo; os de Origem não. Toque para escolher.</p><div class="feat-pick"></div>', cls: 'wide', buttons: [{ label: 'Voltar', value: false }, { label: 'Escolher', value: true, cls: 'primary' }] });
    const box = UI._modalBody.querySelector('.feat-pick');
    for (const [id, f] of list) {
      const b = U.h(`<button class="feat"><div class="fh"><span>${f.name}</span><small>${f.general ? 'Geral' : 'Origem'}</small></div><p>${f.desc}</p></button>`);
      b.onclick = () => { ch = id; box.querySelectorAll('.feat').forEach((x) => x.classList.toggle('on', x === b)); E.Audio.sfx('click'); };
      box.appendChild(b);
    }
    if (!(await p) || !ch) return false;
    const f = H.FEATS[ch];
    h.featData = h.featData || {};
    // escolha extra: atributo do Resiliente / tipo do Adepto Elemental
    let ab = null;
    if (f.abil) {
      const pool = (f.abil === 'any' ? R.ABILITIES.map((a) => a.id) : f.abil).filter((a) => C.score(h, a) < 20);
      if (pool.length > 1) {
        ab = await UI.choose({ title: f.name, text: f.choose === 'save' ? 'Qual atributo? (+1 e proficiência nos testes de resistência)' : 'Qual atributo recebe +1?', options: pool.map((a) => ({ id: a, label: `${R.AB[a].name} (${C.score(h, a)} → ${C.score(h, a) + 1})` })) });
        if (!ab) return false;
      } else ab = pool[0] || null;
    }
    if (f.choose === 'save') h.featData[ch] = ab || 'con';
    if (f.choose === 'element') {
      const el = await UI.choose({ title: f.name, text: 'Escolha o tipo de dano.', options: ['acido', 'eletrico', 'fogo', 'frio', 'trovejante'].map((t) => ({ id: t, label: R.DAMAGE[t].name })) });
      if (!el) return false;
      h.featData[ch] = el;
    }
    const before = C.maxHp(h);
    if (ab) h.asi[ab] = (h.asi[ab] || 0) + 1;
    h.feats = (h.feats || []).concat([ch]);
    h.hp += Math.max(0, C.maxHp(h) - before);
    h.pendingAsi--;
    E.Store.save();
    UI.toast(`✦ Talento: ${f.name}`, 'gold');
    if (C.progressionChoices && C.progressionChoices(h).length) await SH.resolveProgression(h);
    return true;
  };
  SH.asiScores = async (h) => {
    let pick = {};
    const html = `<p style="font-size:13px;color:#5a6378;text-align:center">Aumente um atributo em +2 ou dois atributos em +1 (máximo 20).</p><div class="abil" id="asiGrid"></div>`;
    const p = UI.modal({ title: 'Aumento de Valor de Atributo', html, buttons: [{ label: 'Cancelar', value: false }, { label: 'Confirmar', value: true, cls: 'primary' }] });
    const grid = document.getElementById('asiGrid');
    const draw = () => {
      grid.innerHTML = '';
      const used = Object.values(pick).reduce((a, b) => a + b, 0);
      for (const a of R.ABILITIES) {
        const v = C.score(h, a.id) + (pick[a.id] || 0);
        const b = U.h(`<button class="ab" style="cursor:pointer"><div class="k">${a.short}</div><div class="v">${v}</div><div class="bonus">${pick[a.id] ? '+' + pick[a.id] : ''}</div></button>`);
        b.onclick = () => { if ((pick[a.id] || 0) && used >= 2) { delete pick[a.id]; } else if (used < 2 && v < 20) pick[a.id] = (pick[a.id] || 0) + 1; else delete pick[a.id]; draw(); };
        grid.appendChild(b);
      }
    };
    draw();
    const ok = await p;
    if (ok && Object.values(pick).reduce((a, b) => a + b, 0) === 2) {
      const before = C.maxHp(h);
      for (const [k, v] of Object.entries(pick)) h.asi[k] = (h.asi[k] || 0) + v;
      h.hp += C.maxHp(h) - before;
      h.pendingAsi--;
      E.Store.save();
      UI.toast('✦ Atributos aumentados!', 'gold');
      return true;
    }
    return false;
  };
  SH.style = async (h, n = 1) => {
    const ch = await UI.choose({ title: n === 2 ? 'Estilo de Luta Adicional' : 'Estilo de Luta', text: n === 2 ? 'Campeão 7: escolha um segundo Estilo de Luta.' : 'Escolha um Estilo de Luta.', options: Object.entries(H.FIGHTING_STYLES).filter(([id]) => n === 1 || id !== h.fightingStyle).map(([id, s]) => ({ id, label: `${s.name} — ${s.desc}` })) });
    if (ch && n === 2) { h.fightingStyle2 = ch; E.Store.save(); }
    else if (ch) { h.fightingStyle = ch; h.pendingStyle = false; E.Store.save(); }
  };

  // Escolha (ou troca) da subclasse — nível 3
  SH.RETRAIN = 300;
  SH.subclass = async (h, o = {}) => {
    const subs = H.subclassesOf(h.cls);
    if (!subs.length) return false;
    let pick = C.subId(h) || subs[0].id;
    const cost = o.retrain ? SH.RETRAIN : 0;
    const html = `<p class="sub-lead">${o.retrain ? `Trocar de subclasse custa <b>${cost} po</b> (você tem ${h.gold} po).` : `Todo ${U.esc(C.cls(h).name)} escolhe um caminho no nível ${H.SUB_LEVEL}. Você pode trocar depois na ficha (Características) por ${SH.RETRAIN} po.`}</p><div class="sub-grid"></div><div class="sub-info"></div>`;
    const p = UI.modal({ title: o.retrain ? 'Trocar subclasse' : `✦ Subclasse de ${U.esc(C.cls(h).name)}`, html, cls: 'wide', buttons: [{ label: o.retrain ? 'Cancelar' : 'Depois', value: false }, { label: cost ? `Trocar (${cost} po)` : 'Escolher', value: true, cls: 'primary' }] });
    const body = UI._modalBody;
    const grid = body.querySelector('.sub-grid'), info = body.querySelector('.sub-info');
    const draw = () => {
      grid.innerHTML = '';
      for (const sb of subs) {
        const b = U.h(`<button class="sub-opt ${sb.id === pick ? 'on' : ''}"><span class="so-i">${sb.icon}</span><b>${U.esc(sb.name)}</b>${sb.srd ? '<small>SRD</small>' : ''}</button>`);
        b.onclick = () => { pick = sb.id; E.Audio.sfx('click'); draw(); };
        grid.appendChild(b);
      }
      const sb = subs.find((x) => x.id === pick);
      info.innerHTML = `<p class="sc-b">${U.esc(sb.blurb)}</p>${sb.features.map(([lv, , n, d]) => `<div class="feat" style="${h.level < lv ? 'opacity:.6' : ''}"><div class="fh"><span>${n}</span><small>Nível ${lv}</small></div><p>${d}</p></div>`).join('')}${(sb.powers || []).length ? `<p class="sc-p">Botões no combate: ${sb.powers.map((x) => `<b>${x.icon} ${U.esc(x.name)}</b> (nv. ${x.lvl})`).join(' · ')}</p>` : ''}`;
    };
    draw();
    const ok = await p;
    if (!ok) { h.subAsked = true; E.Store.save(); return false; }
    if (o.retrain && pick === C.subId(h)) return false;
    if (cost) { if (h.gold < cost) { UI.toast('Ouro insuficiente.'); return false; } h.gold -= cost; }
    h.sub = pick; h.subChosen = true; h.subAsked = true;
    const sb = subs.find((x) => x.id === pick);
    E.Store.save();
    E.Audio.sfx('levelup');
    UI.toast(`✦ ${sb.icon} ${sb.name}`, 'gold');
    if (E.HUD.update) E.HUD.update();
    if (C.progressionChoices && C.progressionChoices(h).length) await SH.resolveProgression(h);
    return true;
  };

  E.Sheet = SH;
  E.RuleChoices = { resolve: SH.resolveProgression };
})();
