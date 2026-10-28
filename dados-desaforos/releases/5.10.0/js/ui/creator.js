/* Criação de personagem — ordem do Livro do Jogador 2024. */
(() => {
  const U = E.U, UI = E.UI, R = E.R, H = E.H, S = E.S, C = E.C;
  const CR = {};
  const NAMES = ['Aelin', 'Bram', 'Caelum', 'Dara', 'Elowen', 'Fenris', 'Galen', 'Helena', 'Isolde', 'Joran', 'Kael', 'Lyra', 'Mirela', 'Nyx', 'Orin', 'Petra', 'Quill', 'Rhea', 'Soren', 'Talia', 'Ulric', 'Vesna', 'Wren', 'Yara', 'Zeno', 'Tainá', 'Iberê', 'Jacira', 'Raoni', 'Moema'];
  const HAIR = ['#2a1f1a', '#5a3a22', '#a8652a', '#d4af37', '#e8e2d0', '#c84b3a', '#3a4a8a', '#5fbf77', '#b77dff', '#ff9ad5'];
  const OUTFITS = ['#e08a3c', '#3a62c8', '#c0392b', '#5f8a4a', '#7b5cff', '#2c3e50', '#f0c75e', '#a8325a', '#3ec7b3', '#9aa3ad'];
  const STEPS = ['Classe', 'Antecedente', 'Espécie', 'Atributos', 'Perícias', 'Magias', 'Aparência'];

  let c, el, step;

  const needsSpells = () => !!H.CLASSES[c.cls].caster;
  const stepList = () => STEPS.filter((s) => s !== 'Magias' || needsSpells());

  CR.open = () => {
    c = { cls: 'guerreiro', background: 'soldado', species: 'humano', ancestry: 'fogo', method: 'padrao', base: C.suggestArray('guerreiro'), pb: { for: 8, des: 8, con: 8, int: 8, sab: 8, car: 8 }, bgBonus: null, skills: [], extra: [], cantrips: [], prepared: [], fightingStyle: 'grande', extraFeat: 'vigoroso', look: Object.assign(E.CH.defaultLook('guerreiro', 'humano'), { skin: H.SPECIES.humano.look.skin[1] }), name: U.pick(NAMES) };
    step = 0;
    el = U.h(`<section class="screen paper" data-noesc="1"><div class="creator">
      <div class="stage"><img class="pv" alt=""><div class="stxt"><div class="sname"></div><div class="ssub"></div></div></div>
      <div class="cpanel"><div class="steps"></div><div class="cbody"></div>
        <div class="cfoot"><button class="btn dark" data-a="back"><span class="ico">‹</span>Voltar</button><button class="btn primary" data-a="next"><span class="ico">›</span>Próximo</button></div></div>
    </div></section>`);
    el.querySelector('[data-a=back]').onclick = () => { if (step > 0) { step--; render(); } else if (E.state.heroes.some((h) => !h.dead && !h.deleted)) { UI.close(el); } };
    el.querySelector('[data-a=next]').onclick = next;
    UI.open(el);
    render();
  };

  function preview() {
    const fake = { cls: c.cls, species: c.species, look: c.look, equip: {} };
    const wt = E.W.typeOfBase(H.CLASSES[c.cls].equip.weapon);
    const cv = E.SP.hero(fake, 'idle0', ['bruxo', 'feiticeiro', 'mago'].includes(c.cls) ? 'catalisador' : wt);
    el.querySelector('.pv').src = E.SP.portrait(cv, 6);
    el.querySelector('.pv').style.transform = `scale(${(c.look.height || 1) * E.WG.speciesScale(c.species)})`;
    el.querySelector('.sname').textContent = c.name || '—';
    el.querySelector('.ssub').textContent = `${H.CLASSES[c.cls].name.toUpperCase()} · ${H.SPECIES[c.species].name.toUpperCase()}`;
  }

  function render() {
    const list = stepList();
    const name = list[step];
    el.querySelector('.steps').innerHTML = list.map((s, i) => `<span class="step ${i === step ? 'on' : i < step ? 'done' : ''}">${i < step ? '✓ ' : ''}${s}</span>`).join('');
    const body = el.querySelector('.cbody');
    body.scrollTop = 0;
    body.innerHTML = '';
    el.querySelector('[data-a=next]').innerHTML = step === list.length - 1 ? '<span class="ico">✓</span>Começar aventura' : '<span class="ico">›</span>Próximo';
    ({ Classe: stClass, Antecedente: stBackground, 'Espécie': stSpecies, Atributos: stAbilities, 'Perícias': stSkills, Magias: stSpells, 'Aparência': stLook })[name](body);
    preview();
  }

  function next() {
    const list = stepList();
    const err = validate(list[step]);
    if (err) { UI.toast('⚠ ' + err); return; }
    if (step < list.length - 1) { step++; render(); E.Audio.sfx('click'); return; }
    finish();
  }

  function validate(name) {
    if (name === 'Atributos') {
      if (c.method === 'padrao') { const vals = Object.values(c.base).sort((a, b) => b - a); if (vals.join() !== R.STANDARD_ARRAY.join()) return 'Use cada valor do Conjunto Padrão uma única vez.'; }
      else if (pointsLeft() < 0) return 'Você gastou pontos demais.';
      if (!c.bgBonus) return 'Distribua os bônus do antecedente.';
    }
    if (name === 'Perícias') {
      const need = H.CLASSES[c.cls].skills.n + extraSkillCount();
      if (c.skills.length + c.extra.length < need) return `Escolha ${need} perícia(s).`;
    }
    if (name === 'Magias') {
      if (c.cantrips.length < S.cantripsKnown(c.cls, 1)) return `Escolha ${S.cantripsKnown(c.cls, 1)} truque(s).`;
      if (c.prepared.length < S.PREPARED[c.cls][1]) return `Prepare ${S.PREPARED[c.cls][1]} magia(s).`;
    }
    if (name === 'Aparência' && !c.name.trim()) return 'Dê um nome ao seu herói.';
    return null;
  }

  // ------------------------------------------------ passos
  function stClass(body) {
    body.innerHTML = `<h3>Escolha sua Classe</h3><p class="lead">A classe define como você luta, que magias usa e quais Dados de Vida tem. As 12 classes seguem o Livro do Jogador 2024.</p><div class="pick-grid"></div><div class="detail"></div>`;
    const grid = body.querySelector('.pick-grid');
    for (const id of H.CLASS_ORDER) {
      const k = H.CLASSES[id];
      const b = U.h(`<button class="pick ${c.cls === id ? 'on' : ''}"><span class="tag" style="background:${k.color}">d${k.hd}</span><div class="pi">${k.icon}</div><div class="pn">${k.name}</div><div class="pd">${k.role}</div></button>`);
      b.onclick = () => { c.cls = id; c.base = C.suggestArray(id); c.bgBonus = null; c.skills = []; c.cantrips = []; c.prepared = []; const d = E.CH.CLASS_DEFAULT[id]; Object.assign(c.look, { outfit: d.outfit, c1: d.c1, c2: d.c2, acc: d.acc }); render(); };
      grid.appendChild(b);
    }
    const k = H.CLASSES[c.cls];
    body.querySelector('.detail').innerHTML = `<h4>${k.icon} ${k.name}</h4><div>${k.blurb}</div>
      <div class="kv"><span><b>Dado de Vida:</b> d${k.hd}</span><span><b>Atributo principal:</b> ${k.primary.map((a) => R.AB[a].name).join(' ou ')}</span><span><b>Resistências:</b> ${k.saves.map((a) => R.AB[a].name).join(', ')}</span><span><b>Armaduras:</b> ${k.armor.length ? k.armor.map((a) => ({ leve: 'Leve', media: 'Média', pesada: 'Pesada', escudo: 'Escudo' }[a])).join(', ') : 'Nenhuma'}</span><span><b>Armas:</b> ${{ marcial: 'Simples e Marciais', simples: 'Simples', ladino: 'Simples + Marciais (Acuidade/Leve)', monge: 'Simples + Marciais Leves' }[k.weapons]}</span><span><b>Conjuração:</b> ${k.caster ? ({ full: 'Completa', half: 'Meia', pact: 'Magia de Pacto' }[k.caster.type] + ' · ' + R.AB[k.caster.ab].name) : '—'}</span></div>
      <ul>${k.features.filter(([lv]) => lv <= 3).map(([lv, , n, d]) => `<li><b>Nv ${lv} · ${n}:</b> ${d}</li>`).join('')}</ul>
      <div class="sub-prev"><b>Subclasses (escolha no nível ${H.SUB_LEVEL}):</b>${H.subclassesOf(c.cls).map((sb) => `<span title="${U.esc(sb.blurb)}">${sb.icon} ${U.esc(sb.name)}</span>`).join('')}</div>`;
    if (k.fightingStyleAt === 1) {
      const fs = U.h(`<div class="detail"><h4>Estilo de Luta</h4><div class="checks"></div></div>`);
      for (const [id, s] of Object.entries(H.FIGHTING_STYLES)) {
        const b = U.h(`<button class="check ${c.fightingStyle === id ? 'on' : ''}"><i>${c.fightingStyle === id ? '✓' : ''}</i><span><b>${s.name}</b><br><small style="margin:0">${s.desc}</small></span></button>`);
        b.onclick = () => { c.fightingStyle = id; render(); };
        fs.querySelector('.checks').appendChild(b);
      }
      body.appendChild(fs);
    }
  }

  function stBackground(body) {
    body.innerHTML = `<h3>Escolha seu Antecedente</h3><p class="lead">Em 2024, o antecedente define seus aumentos de atributo (+2/+1 ou +1/+1/+1 entre três atributos), um Talento de Origem e duas perícias.</p><div class="pick-grid"></div><div class="detail"></div>`;
    const grid = body.querySelector('.pick-grid');
    for (const [id, b0] of Object.entries(H.BACKGROUNDS)) {
      const b = U.h(`<button class="pick ${c.background === id ? 'on' : ''}"><div class="pn">${b0.name}</div><div class="pd">${b0.abilities.map((a) => R.AB[a].short).join(' · ')}<br>${H.FEATS[b0.feat].name}</div></button>`);
      b.onclick = () => { c.background = id; c.bgBonus = null; c.skills = []; render(); };
      grid.appendChild(b);
    }
    const bg = H.BACKGROUNDS[c.background];
    body.querySelector('.detail').innerHTML = `<h4>${bg.name}</h4><div>${bg.blurb}</div><div class="kv"><span><b>Atributos:</b> ${bg.abilities.map((a) => R.AB[a].name).join(', ')}</span><span><b>Perícias:</b> ${bg.skills.map((s) => R.SKILLS[s].name).join(', ')}</span></div><p><b>Talento de Origem — ${H.FEATS[bg.feat].name}:</b> ${H.FEATS[bg.feat].desc}</p>`;
  }

  function stSpecies(body) {
    body.innerHTML = `<h3>Escolha sua Espécie</h3><p class="lead">A espécie concede traços especiais (em 2024 ela não altera atributos — isso vem do antecedente).</p><div class="pick-grid"></div><div class="detail"></div>`;
    const grid = body.querySelector('.pick-grid');
    for (const [id, s] of Object.entries(H.SPECIES)) {
      const b = U.h(`<button class="pick ${c.species === id ? 'on' : ''}"><div class="pn">${s.name}</div><div class="pd">${s.size} · ${String(s.speed).replace('.', ',')} m${s.dark ? ` · Visão no Escuro ${s.dark} m` : ''}</div></button>`);
      b.onclick = () => { c.species = id; c.look.skin = s.look.skin[0]; c.look.beard = id === 'anao'; c.extra = []; render(); };
      grid.appendChild(b);
    }
    const s = H.SPECIES[c.species];
    const det = body.querySelector('.detail');
    det.innerHTML = `<h4>${s.name}</h4><div>${s.blurb}</div><ul>${s.traits.map(([n, d]) => `<li><b>${n}:</b> ${d}</li>`).join('')}</ul>`;
    if (c.species === 'draconato') {
      const box = U.h('<div style="margin-top:10px"><b>Ancestralidade:</b><div class="checks" style="margin-top:6px"></div></div>');
      for (const [t, n] of Object.entries(s.ancestries)) {
        const b = U.h(`<button class="check ${c.ancestry === t ? 'on' : ''}"><i>${c.ancestry === t ? '✓' : ''}</i>${n}</button>`);
        b.onclick = () => { c.ancestry = t; render(); };
        box.querySelector('.checks').appendChild(b);
      }
      det.appendChild(box);
    }
    if (c.species === 'humano') {
      const box = U.h('<div style="margin-top:10px"><b>Versátil — Talento de Origem extra:</b><div class="checks" style="margin-top:6px"></div></div>');
      for (const [id, f] of Object.entries(H.FEATS)) {
        if (id === H.BACKGROUNDS[c.background].feat) continue;
        const b = U.h(`<button class="check ${c.extraFeat === id ? 'on' : ''}" title="${f.desc}"><i>${c.extraFeat === id ? '✓' : ''}</i>${f.name}</button>`);
        b.onclick = () => { c.extraFeat = id; render(); };
        box.querySelector('.checks').appendChild(b);
      }
      det.appendChild(box);
    }
  }

  const pointsLeft = () => R.POINT_BUY_TOTAL - Object.values(c.pb).reduce((a, v) => a + R.POINT_BUY_COST[v], 0);
  function stAbilities(body) {
    const bg = H.BACKGROUNDS[c.background];
    if (!c.bgBonus) c.bgBonus = C.suggestBgBonus(c.cls, c.background, c.method === 'padrao' ? c.base : c.pb);
    body.innerHTML = `<h3>Valores de Atributo</h3><p class="lead">Distribua o <b>Conjunto Padrão</b> (15, 14, 13, 12, 10, 8) ou use a <b>Compra de Pontos</b> (27 pontos). Depois aplique os bônus do antecedente ${bg.name}.</p>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><div class="seg"><button data-m="padrao" class="${c.method === 'padrao' ? 'on' : ''}">Conjunto Padrão</button><button data-m="compra" class="${c.method === 'compra' ? 'on' : ''}">Compra de Pontos</button></div>
      <button class="btn sm dark" data-a="sug"><span class="ico">✦</span>Sugerido para ${H.CLASSES[c.cls].name}</button>${c.method === 'compra' ? `<span class="chip" style="color:var(--ink)">Pontos restantes: <b>${pointsLeft()}</b></span>` : ''}</div>
      <div class="abil"></div>
      <div class="detail"><h4>Bônus do Antecedente</h4><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><div class="seg"><button data-b="21" class="${Object.values(c.bgBonus).includes(2) ? 'on' : ''}">+2 / +1</button><button data-b="111" class="${!Object.values(c.bgBonus).includes(2) ? 'on' : ''}">+1 / +1 / +1</button></div></div><div class="bgb" style="display:flex;gap:10px;flex-wrap:wrap"></div><p style="margin:8px 0 0;font-size:12px;color:#5a6378">Nenhum atributo pode passar de 20.</p></div>`;
    body.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { c.method = b.dataset.m; c.bgBonus = null; render(); }));
    body.querySelector('[data-a=sug]').onclick = () => { c.method = 'padrao'; c.base = C.suggestArray(c.cls); c.bgBonus = C.suggestBgBonus(c.cls, c.background, c.base); render(); };
    body.querySelectorAll('[data-b]').forEach((b) => (b.onclick = () => {
      const abs = bg.abilities;
      if (b.dataset.b === '111') c.bgBonus = { [abs[0]]: 1, [abs[1]]: 1, [abs[2]]: 1 };
      else c.bgBonus = C.suggestBgBonus(c.cls, c.background, c.method === 'padrao' ? c.base : c.pb);
      render();
    }));
    const grid = body.querySelector('.abil');
    const src = c.method === 'padrao' ? c.base : c.pb;
    for (const a of R.ABILITIES) {
      const base = src[a.id], bonus = c.bgBonus[a.id] || 0, total = Math.min(20, base + bonus);
      const card = U.h(`<div class="ab"><div class="k">${a.short}</div><div class="v">${total}</div><span class="m">${U.sign(U.mod(total))}</span><div class="bonus">${bonus ? `+${bonus} antecedente` : ''}</div></div>`);
      if (c.method === 'padrao') {
        const sel = U.h(`<select aria-label="${a.name}">${R.STANDARD_ARRAY.map((v) => `<option ${v === base ? 'selected' : ''}>${v}</option>`).join('')}</select>`);
        sel.onchange = () => {
          const v = Number(sel.value);
          const other = Object.keys(c.base).find((k) => k !== a.id && c.base[k] === v);
          if (other) c.base[other] = c.base[a.id];
          c.base[a.id] = v;
          render();
        };
        card.appendChild(sel);
      } else {
        const pb = U.h(`<div class="pb"><button aria-label="diminuir">−</button><button aria-label="aumentar">+</button></div>`);
        const [minus, plus] = pb.querySelectorAll('button');
        minus.onclick = () => { if (c.pb[a.id] > 8) { c.pb[a.id]--; render(); } };
        plus.onclick = () => { if (c.pb[a.id] < 15 && R.POINT_BUY_COST[c.pb[a.id] + 1] - R.POINT_BUY_COST[c.pb[a.id]] <= pointsLeft()) { c.pb[a.id]++; render(); } };
        card.appendChild(pb);
      }
      grid.appendChild(card);
    }
    const bgb = body.querySelector('.bgb');
    const is21 = Object.values(c.bgBonus).includes(2);
    for (const ab of bg.abilities) {
      const box = U.h(`<div class="seg"><span style="padding:6px 10px;font-weight:900">${R.AB[ab].short}</span></div>`);
      for (const v of is21 ? [2, 1, 0] : [1]) {
        const b = U.h(`<button class="${(c.bgBonus[ab] || 0) === v ? 'on' : ''}">${v ? '+' + v : '0'}</button>`);
        b.onclick = () => {
          if (!is21) return;
          const cur = Object.entries(c.bgBonus).find(([k, x]) => x === v && k !== ab);
          const mine = c.bgBonus[ab] || 0;
          if (cur && v) c.bgBonus[cur[0]] = mine;
          c.bgBonus[ab] = v;
          for (const k of Object.keys(c.bgBonus)) if (!c.bgBonus[k]) delete c.bgBonus[k];
          render();
        };
        box.appendChild(b);
      }
      bgb.appendChild(box);
    }
  }

  const extraSkillCount = () => (c.species === 'humano' ? 1 : 0) + (c.species === 'elfo' ? 1 : 0);
  function stSkills(body) {
    const k = H.CLASSES[c.cls], bg = H.BACKGROUNDS[c.background];
    const fromBg = bg.skills;
    c.skills = c.skills.filter((s) => !fromBg.includes(s) && k.skills.from.includes(s));
    c.extra = c.extra.filter((s) => !fromBg.includes(s) && !c.skills.includes(s));
    body.innerHTML = `<h3>Perícias</h3><p class="lead">Escolha <b>${k.skills.n}</b> perícia(s) da lista de ${k.name}. As do antecedente já estão marcadas.${extraSkillCount() ? ` Sua espécie concede <b>+1</b> perícia extra.` : ''}</p><div class="checks"></div>`;
    const box = body.querySelector('.checks');
    for (const [id, s] of Object.entries(R.SKILLS)) {
      const locked = fromBg.includes(id);
      const inClass = k.skills.from.includes(id);
      const on = locked || c.skills.includes(id) || c.extra.includes(id);
      const elfOk = c.species !== 'elfo' || H.SPECIES.elfo.hooks.skillChoice.includes(id);
      const b = U.h(`<button class="check ${on ? 'on' : ''} ${locked ? 'lock' : ''}"><i>${on ? '✓' : ''}</i>${s.name}<small>${R.AB[s.ab].short}${inClass ? '' : extraSkillCount() && elfOk ? ' · extra' : ''}</small></button>`);
      if (!inClass && !(extraSkillCount() && elfOk) && !locked) b.style.opacity = 0.4;
      b.onclick = () => {
        if (locked) return;
        if (c.skills.includes(id)) c.skills = c.skills.filter((x) => x !== id);
        else if (c.extra.includes(id)) c.extra = c.extra.filter((x) => x !== id);
        else if (inClass && c.skills.length < k.skills.n) c.skills.push(id);
        else if (extraSkillCount() && elfOk && c.extra.length < extraSkillCount()) c.extra.push(id);
        else return UI.toast('Limite de perícias atingido.');
        render();
      };
      box.appendChild(b);
    }
  }

  function stSpells(body) {
    const nc = S.cantripsKnown(c.cls, 1), np = S.PREPARED[c.cls][1];
    const list = S.listFor(c.cls);
    body.innerHTML = `<h3>Magias</h3><p class="lead">${H.CLASSES[c.cls].name}s usam <b>${R.AB[H.CLASSES[c.cls].caster.ab].name}</b> para conjurar. ${nc ? `Escolha <b>${nc}</b> truque(s) e ` : ''}prepare <b>${np}</b> magia(s) de 1º círculo. Você pode trocar as preparadas depois de um Descanso Longo.</p><div class="sp"></div>`;
    const box = body.querySelector('.sp');
    const row = (id, arr, max) => {
      const s = S.SPELLS[id];
      const on = arr.includes(id);
      const b = U.h(`<button class="spell-row ${on ? 'on' : ''}"><span class="lv" style="background:${S.SCHOOL_COLORS[s.school] || '#888'}">${s.level || 'T'}</span><span><div class="sn">${s.name} <small style="color:#8a7a5a">· ${s.school}${s.conc ? ' · Concentração' : ''}${s.time === 'bonus' ? ' · Ação Bônus' : ''}</small></div><div class="sd">${s.desc}</div></span></button>`);
      b.onclick = () => { if (on) arr.splice(arr.indexOf(id), 1); else if (arr.length < max) arr.push(id); else return UI.toast('Limite atingido — desmarque outra.'); render(); };
      box.appendChild(b);
    };
    if (nc) { box.appendChild(U.h(`<h4 style="font-family:var(--display);margin:6px 0">Truques (${c.cantrips.length}/${nc})</h4>`)); list.filter((id) => S.SPELLS[id].level === 0).forEach((id) => row(id, c.cantrips, nc)); }
    box.appendChild(U.h(`<h4 style="font-family:var(--display);margin:14px 0 6px">1º Círculo (${c.prepared.length}/${np})</h4>`));
    list.filter((id) => S.SPELLS[id].level === 1 && !(c.cls === 'paladino' && id === 'golpe_divino') && !(c.cls === 'patrulheiro' && id === 'marca_cacador')).forEach((id) => row(id, c.prepared, np));
    if (c.cls === 'paladino') box.appendChild(U.h('<p class="lead" style="margin-top:8px">Golpe Divino fica sempre preparado a partir do nível 2.</p>'));
    if (c.cls === 'patrulheiro') box.appendChild(U.h('<p class="lead" style="margin-top:8px">Marca do Caçador fica sempre preparada (Inimigo Favorito).</p>'));
  }

  function stLook(body) {
    body.innerHTML = `<h3>Aparência e Nome</h3><p class="lead">Monte o visual do seu herói. Dá para mudar tudo depois no Guarda-roupa (menu principal).</p>
      <div class="detail"><h4>Nome</h4><div style="display:flex;gap:8px;flex-wrap:wrap"><input class="field" id="heroName" maxlength="18" value="${U.esc(c.name)}" aria-label="Nome do herói" style="flex:1;min-width:0"><button class="btn dark" data-a="rnd"><span class="ico">🎲</span>Aleatório</button></div></div><div class="ap"></div>`;
    const inp = body.querySelector('input');
    inp.oninput = () => { c.name = inp.value; el.querySelector('.sname').textContent = c.name || '—'; };
    body.querySelector('[data-a=rnd]').onclick = () => { c.name = U.pick(NAMES); inp.value = c.name; el.querySelector('.sname').textContent = c.name; };
    E.Wardrobe.editor(body.querySelector('.ap'), { get: () => c.look, cls: () => c.cls, species: () => c.species, onChange: preview });
  }

  function finish() {
    const base = c.method === 'padrao' ? c.base : c.pb;
    const h = C.create({
      name: c.name.trim(), cls: c.cls, species: c.species, background: c.background, ancestry: c.species === 'draconato' ? c.ancestry : null,
      base: { ...base }, bgBonus: { ...c.bgBonus }, skills: [...c.skills, ...c.extra], cantrips: [...c.cantrips], prepared: [...c.prepared],
      fightingStyle: H.CLASSES[c.cls].fightingStyleAt === 1 ? c.fightingStyle : null, extraFeat: c.species === 'humano' ? c.extraFeat : null, look: { ...c.look },
    });
    C.longRest(h);
    E.state.heroes.push(h);
    E.state.activeHero = h.id;
    E.state.world.pos = null;
    E.state.world.region = 'bosque';
    E.Store.save();
    UI.close(el);
    E.Game.enterWorld(true);
  }

  E.Creator = CR;
})();
