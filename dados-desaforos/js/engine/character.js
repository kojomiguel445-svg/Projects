/* Ficha do personagem: criação, valores derivados e progressão (regras de 2024). */
(() => {
  const U = E.U, R = E.R, H = E.H, S = E.S, W = E.W;
  const C = {};

  // ---------------- armas do inventário ----------------
  // Entrada do inventário → definição completa
  C.weaponDef = (entry) => {
    if (!entry) return null;
    if (entry.custom) return entry.custom;
    return W.CATALOG[entry.id] || null;
  };
  C.makeStarter = (base) => ({ name: (R.WEAPONS[base] || {}).name || base, type: W.typeOfBase(base), rarity: 1, base, passive: null, lore: 'Equipamento inicial, simples e confiável.', art: { c1: '#c9d1d9', c2: '#9aa3ad', v: 0 } });
  C.makeFocus = (kind) => ({ name: W.FOCUS_NAMES[kind] || 'Foco Arcano', type: 'catalisador', rarity: 1, base: null, passive: null, lore: 'Um foco de conjuração comum.', art: { c1: '#c9d1d9', c2: '#9aa3ad', v: kind === 'simbolo' ? 1 : 0 } });

  C.equipped = (h, slot = 'weapon') => {
    const uid = h.equip && h.equip[slot];
    const entry = uid ? E.Store.weapon(uid) : null;
    const def = C.weaponDef(entry);
    if (!def) return null;
    // nível e ascensão da arma (estilo Genshin, ver forge.js)
    const F = E.Forge;
    if (F && !entry.lv) F.norm(entry);
    const lv = entry.lv || 1, asc = entry.asc || 0;
    // sem afinidade com o tipo de arma, ela não desperta: sem passivo, sem bônus de nível e sem habilidade única
    const aff = W.hasAffinity(h.cls, def, !!C.caster(h));
    const d2 = aff ? def : Object.assign({}, def, { passive: null });
    // armas de linhagem: ressonância com a classe (1) ou com classe e espécie (2)
    const res = aff && W.resonance ? W.resonance(h, def) : 0;
    return { entry, def: d2, refine: Math.min(5, (entry.refine || 1) + (res >= 2 ? 1 : 0)), bonus: W.RARITY[def.rarity].bonus, lv, asc, aff, res, hitUp: (aff && F ? F.hitUp(entry) : 0) + res, dmgUp: (aff && F ? F.dmgUp(entry, def) : 0) + res };
  };

  // ---------------- atributos ----------------
  C.score = (h, ab) => {
    let v = (h.base[ab] || 10) + ((h.bgBonus && h.bgBonus[ab]) || 0) + ((h.asi && h.asi[ab]) || 0);
    v = Math.min(20, v);
    if (ab === 'for' && h.strDrain) v = Math.max(1, v - h.strDrain);
    return v;
  };
  C.mod = (h, ab) => U.mod(C.score(h, ab));
  C.pb = (h) => R.profBonus(h.level);
  C.cls = (h) => H.CLASSES[h.cls];
  C.species = (h) => H.SPECIES[h.species];
  // ---------------- subclasses (escolhidas no nível 3) ----------------
  C.subId = (h) => h.sub || (h.level >= H.SUB_LEVEL ? H.SUB_DEFAULT[h.cls] : null);
  C.sub = (h) => { const id = C.subId(h); return id ? (H.SUBCLASSES[h.cls] || {})[id] || null : null; };
  C.subFeatures = (h) => { const sb = C.sub(h); return sb ? sb.features.filter(([lv]) => h.level >= lv) : []; };
  C.has = (h, featureId) => C.cls(h).features.some(([lv, id]) => id === featureId && h.level >= lv) || C.subFeatures(h).some(([, id]) => id === featureId);
  C.hasFeat = (h, feat) => (h.feats || []).includes(feat);
  C.features = (h) => [...C.cls(h).features.filter(([lv]) => h.level >= lv), ...C.subFeatures(h)].sort((a, b) => a[0] - b[0]);
  // efeitos passivos das subclasses e talentos (ver js/data/subclasses.js)
  C.styles = (h) => [h.fightingStyle, h.fightingStyle2].filter(Boolean);
  C.hasStyle = (h, id) => C.styles(h).includes(id);
  C.fxList = (h) => [...C.cls(h).features.filter(([lv]) => h.level >= lv).map((f) => f[4]).filter(Boolean), ...C.styles(h).map((s) => (H.FIGHTING_STYLES[s] || {}).fx).filter(Boolean), ...C.subFeatures(h).map((f) => f[4]).filter(Boolean), ...(h.feats || []).map((f) => { const fx = (H.FEATS[f] || {}).fx; return typeof fx === 'function' ? fx(h) : fx; }).filter(Boolean), ...(E.Eco ? E.Eco.fx(h) : [])];
  C.hasFx = (h, key) => C.fxList(h).some((f) => f[key]);
  C.fxVals = (h, key) => C.fxList(h).map((f) => f[key]).filter((v) => v !== undefined && v !== false);
  C.fxNum = (h, key) => C.fxVals(h, key).reduce((a, v) => a + (typeof v === 'number' ? v : typeof v === 'string' ? Math.max(0, C.mod(h, v)) : typeof v === 'function' ? v(h) : 0), 0);
  C.fxArr = (h, key) => C.fxVals(h, key).flat();
  C.caster = (h) => C.cls(h).caster || (C.fxVals(h, 'caster')[0] || null);
  C.subPowers = (h) => {
    const sb = C.sub(h);
    const own = sb && sb.powers ? sb.powers.filter((p) => h.level >= p.lvl).map((p) => Object.assign({ tag: sb.name }, p)) : [];
    for (const f of h.feats || []) for (const p of (H.FEATS[f] || {}).powers || []) own.push(Object.assign({ tag: H.FEATS[f].name }, p));
    for (const p of (H.CLASS_POWERS || {})[h.cls] || []) if (h.level >= p.lvl) own.push(Object.assign({ tag: C.cls(h).name }, p));
    // Investida do Eco (espírito guardião)
    const ecoP = E.Eco && E.Eco.power(h); if (ecoP) own.push(ecoP);
    // habilidade única da arma ★5 (desperta com a ascensão)
    for (const slot of ['weapon', 'focus']) {
      const w = C.equipped(h, slot);
      const sg = w && w.aff && w.entry && W.SIGNATURE[w.entry.id];
      let tier = sg ? W.sigTier(w.asc) : 0;
      if (sg && w.res >= 2 && w.asc >= 1) tier = Math.max(tier, 1); // Ressonância Total: desperta na Ascensão 1
      if (sg && tier > 0 && (slot === 'weapon' || w.def.type === 'catalisador')) own.push({ id: 'sig_' + w.entry.id, tag: `${w.def.name} ★5`, lvl: 1, name: sg.name, icon: sg.icon, desc: W.sigText(w.entry.id, tier) + (w.res ? ` ${W.RES_NAMES[w.res]}: +${w.res * 2} dados.` : ''), cost: 'a', sig: { id: w.entry.id, tier, slot, res: w.res || 0 }, effect: { sig: true } });
    }
    return own;
  };
  C.condImm = (h, cond, raging) => C.fxArr(h, 'condImm').includes(cond) || (raging && C.fxArr(h, 'condImmRage').includes(cond));

  // ---------------- proficiências ----------------
  C.proficientWith = (h, base) => {
    if (!base) return true;
    const w = R.WEAPONS[base];
    if (!w) return false;
    if (w.cat === 'simples') return true;
    const rule = C.cls(h).weapons;
    if (rule === 'marcial' || C.fxVals(h, 'weapons').includes('marcial')) return true;
    if (h.cls === 'clerigo' || h.cls === 'druida') return true; // Ordem Divina Protetor / Ordem Primal Guardião
    if (rule === 'ladino') return w.props.includes('acuidade') || w.props.includes('leve');
    if (rule === 'monge') return w.props.includes('leve');
    return false;
  };
  C.isMonkWeapon = (h, base) => {
    if (h.cls !== 'monge' || !base) return false;
    const w = R.WEAPONS[base];
    return w && w.kind === 'cac' && (w.cat === 'simples' || w.props.includes('leve')) && !w.props.includes('pesada');
  };
  C.canCast = (h) => !!C.caster(h) || (h.mi && h.mi.spell);
  C.hasArmorTraining = (h, type) => (C.cls(h).armor || []).includes(type) || C.fxArr(h, 'armor').includes(type)
    || (type === 'pesada' && h.cls === 'clerigo' && C.has(h, 'ordem_divina'))
    || (type === 'media' && h.cls === 'druida' && C.has(h, 'ordem_primal'));

  // ---------------- PV ----------------
  C.hpPerLevel = (h) => {
    let extra = 0;
    if (C.species(h).hooks.hpPerLevel) extra += 1;
    if (C.hasFeat(h, 'vigoroso')) extra += 2;
    extra += C.fxNum(h, 'hpPerLevel');
    return extra;
  };
  C.maxHp = (h) => {
    const hd = C.cls(h).hd, con = C.mod(h, 'con');
    let hp = hd + con + (h.level - 1) * (Math.floor(hd / 2) + 1 + con);
    hp += h.level * C.hpPerLevel(h);
    hp += C.aidBonus(h);
    hp -= h.maxHpReduce || 0;
    return Math.max(1, hp);
  };
  // SRD 5.2.1 p107 Aid; p106 Combining Spell Effects. Legacy boolean saves mean +5.
  C.aidBonus = (h) => {
    const value = h.buffs && h.buffs.auxilio;
    return typeof value === 'number' ? Math.max(0, value) : value ? 5 : 0;
  };
  C.applyAid = (h, slotLevel = 2) => {
    const old = C.aidBonus(h), bonus = Math.max(old, 5 * Math.max(1, slotLevel - 1));
    h.buffs = h.buffs || {};
    h.buffs.auxilio = bonus;
    const increase = bonus - old;
    h.hp = Math.min(C.maxHp(h), h.hp + increase);
    return { bonus, increase };
  };

  // ---------------- CA ----------------
  C.acBreakdown = (h) => {
    const dex = C.mod(h, 'des');
    const armor = R.ARMOR[h.equip.armor || 'nenhuma'] || R.ARMOR.nenhuma;
    let formula, parts;
    const part = (label, value, source, custom = false) => ({ label, value, source, custom });
    if (armor.type === 'none') {
      formula = '10 + DES';
      parts = [part('Base sem armadura', 10, 'SRD 5.2.1 p7'), part('Destreza', dex, 'SRD 5.2.1 p7')];
      const alternative = (label, base, ability, source) => {
        const next = [part(label, base, source), part('Destreza', dex, source)];
        if (ability) next.push(part(R.AB[ability].name, C.mod(h, ability), source));
        if (next.reduce((n, p) => n + p.value, 0) > parts.reduce((n, p) => n + p.value, 0)) {
          parts = next; formula = `${base} + DES${ability ? ' + ' + R.AB[ability].short : ''}`;
        }
      };
      const ud = C.cls(h).unarmored;
      if (ud === 'con') alternative('Defesa sem Armadura', 10, 'con', 'SRD 5.2.1 p29');
      if (ud === 'sab' && !h.equip.shield) alternative('Defesa sem Armadura', 10, 'sab', 'SRD 5.2.1 p50');
      for (const ab of C.fxVals(h, 'unarmored')) if (!h.equip.shield || ab !== 'car' || h.cls === 'feiticeiro') alternative('Característica de subclasse', 10, ab, C.sub(h) ? C.sub(h).name : 'Subclasse');
      if (h.buffs && h.buffs.armadura_arcana) alternative('Armadura Arcana', 13, null, 'SRD 5.2.1, Mage Armor');
    } else {
      formula = armor.name;
      parts = [part(armor.name, armor.base, 'SRD 5.2.1 p92')];
      if (armor.type !== 'pesada') parts.push(part('Destreza (limite da armadura)', Math.min(dex, armor.dex), 'SRD 5.2.1 p92'));
      if (C.hasStyle(h, 'defesa')) parts.push(part('Estilo Defesa', 1, 'SRD 5.2.1 p88'));
    }
    if (h.equip.shield) parts.push(part(C.hasArmorTraining(h, 'escudo') ? 'Escudo (treinado)' : 'Escudo (sem treinamento)', C.hasArmorTraining(h, 'escudo') ? 2 : 0, 'SRD 5.2.1 p92'));
    for (const fx of C.fxList(h)) if (fx.ac) {
      const value = typeof fx.ac === 'number' ? fx.ac : typeof fx.ac === 'string' ? Math.max(0, C.mod(h, fx.ac)) : typeof fx.ac === 'function' ? fx.ac(h) : 0;
      parts.push(part(fx.eco ? 'Eco (autoral)' : 'Característica ou talento', value, fx.eco ? 'Dados e Desaforos — Ecos' : 'Característica/talento', !!fx.eco));
    }
    if (armor.type !== 'none' && C.hasFx(h, 'armorAc')) parts.push(part('Talento de armadura', 1, 'Talento equipado'));
    const w = C.equipped(h, 'weapon');
    if (w && w.def.passive) {
      const p = w.def.passive;
      if (p.kind === 'ac') parts.push(part(`Passiva: ${p.name || w.def.name} (autoral)`, p.vals[w.refine - 1], 'Dados e Desaforos — Armas', true));
      if (p.ac) parts.push(part(`Passiva: ${p.name || w.def.name} (autoral)`, p.ac, 'Dados e Desaforos — Armas', true));
    }
    return { total: parts.reduce((n, p) => n + p.value, 0), formula, parts };
  };
  C.ac = (h) => C.acBreakdown(h).total;

  // ---------------- iniciativa / testes ----------------
  C.initiative = (h) => {
    let v = C.mod(h, 'des');
    if (C.hasFeat(h, 'alerta')) v += C.pb(h);
    v += C.fxNum(h, 'init');
    const w = C.equipped(h, 'weapon');
    if (w && w.def.passive) {
      if (w.def.passive.kind === 'init') v += w.def.passive.vals[w.refine - 1];
      if (w.def.passive.init) v += w.def.passive.init;
    }
    return v;
  };
  C.saveBonus = (h, ab) => {
    let v = C.mod(h, ab);
    if (C.cls(h).saves.includes(ab) || C.fxArr(h, 'saveProf').includes(ab)) v += C.pb(h);
    if (C.has(h, 'aura_protecao')) v += Math.max(1, C.mod(h, 'car'));
    v += C.fxNum(h, 'saveBonus');
    for (const sb of C.fxVals(h, 'saveAbBonus')) if (sb[ab]) v += Math.max(0, C.mod(h, sb[ab]));
    for (const slot of ['weapon', 'focus']) {
      const w = C.equipped(h, slot);
      if (w && w.def.passive) {
        if (w.def.passive.kind === 'save') v += w.def.passive.vals[w.refine - 1];
        if (w.def.passive.save) v += w.def.passive.save;
      }
    }
    return v;
  };
  C.skillBonus = (h, sk) => {
    const def = R.SKILLS[sk];
    let v = C.mod(h, def.ab);
    if ((h.skills || []).includes(sk)) v += C.pb(h) * ((h.expertise || []).includes(sk) ? 2 : 1);
    else if (C.has(h, 'pau_pra_toda_obra')) v += Math.floor(C.pb(h) / 2);
    return v;
  };
  C.passivePerception = (h) => 10 + C.skillBonus(h, 'percepcao');

  // ---------------- ataque com arma ----------------
  C.attackProfile = (h, opts = {}) => {
    const w = C.equipped(h, 'weapon');
    let base = w ? w.def.base : null;
    if (opts.unarmed || !base) base = 'desarmado';
    const wd = R.WEAPONS[base];
    const ranged = wd.kind === 'dist';
    const str = C.mod(h, 'for'), dex = C.mod(h, 'des');
    // SRD p50: Martial Arts requires no armor, no Shield, and only Monk weapons.
    const monk = h.cls === 'monge' && (h.equip.armor || 'nenhuma') === 'nenhuma' && !h.equip.shield && (base === 'desarmado' || C.isMonkWeapon(h, base)) && (!w || !w.def.base || C.isMonkWeapon(h, w.def.base));
    let ability = ranged ? 'des' : 'for';
    if (wd.props.includes('acuidade') || monk) ability = dex > str ? 'des' : 'for';
    const abMod = ability === 'des' ? dex : str;
    const armed = w && base !== 'desarmado' && !opts.unarmed;
    const proficient = base === 'desarmado' || C.proficientWith(h, base);
    const magic = armed ? w.bonus : 0;
    let toHit = abMod + (proficient ? C.pb(h) : 0) + magic + (armed ? w.hitUp : 0) + (base !== 'desarmado' ? C.fxNum(h, 'toHit') : 0);
    if (ranged && C.hasStyle(h, 'arquearia')) toHit += 2;
    if (ranged) toHit += C.fxNum(h, 'rangedHit');
    // dado de dano
    let dice = wd.dmg;
    const twoHanding = wd.vers && !h.equip.shield;
    if (twoHanding) dice = wd.vers;
    if (monk) {
      const md = h.level >= 5 ? 8 : 6;
      const cur = U.parseDice(dice);
      if (base === 'desarmado' || cur.s < md) dice = `1d${md}`;
    }
    if (base === 'desarmado' && !monk) dice = C.hasFx(h, 'unarmedFight') ? (h.equip.shield ? '1d6' : '1d8') : C.hasFeat(h, 'brigao') ? '1d4' : '1';
    // Passos Deslumbrantes (Colégio da Dança): Golpe Desarmado = dado de Inspiração + DES, sem armadura nem escudo
    const dance = base === 'desarmado' && C.hasFx(h, 'danceUnarmed') && (h.equip.armor || 'nenhuma') === 'nenhuma' && !h.equip.shield;
    if (dance) { dice = `1d${h.level >= 15 ? 12 : h.level >= 10 ? 10 : h.level >= 5 ? 8 : 6}`; if (dex > str) { ability = 'des'; } }
    let dmgMod = (dance ? Math.max(abMod, dex) : abMod) + magic + (armed ? w.dmgUp : 0);
    if (dance && dex > abMod) toHit += dex - abMod;
    if (wd.props.includes('arremesso')) dmgMod += C.fxNum(h, 'thrownDmg');
    if (C.hasStyle(h, 'duelismo') && !ranged && !wd.props.includes('duas_maos') && !twoHanding) dmgMod += 2;
    let crit = 20;
    if (C.has(h, 'critico_aprimorado')) crit = 19;
    for (const c of C.fxVals(h, 'crit')) crit = Math.min(crit, c);
    if (w && w.def.passive && !opts.unarmed) {
      const p = w.def.passive;
      if (p.kind === 'crit') crit = Math.min(crit, p.vals[w.refine - 1]);
      if (p.crit) crit = Math.min(crit, p.crit);
    }
    const hungerPenalty = E.Sim ? E.Sim.penalty(h) : 0;
    toHit -= hungerPenalty; dmgMod -= hungerPenalty;
    const masteryOk = C.cls(h).masteryCount > 0 && wd.mastery && (h.masteries || []).includes(base) && (!armed || w.aff);
    const makePart = (label, value, source, custom = false) => ({ label, value, source, custom });
    const finalMod = dance ? Math.max(abMod, dex) : abMod;
    const resonance = armed ? w.res || 0 : 0;
    const ecoHit = base !== 'desarmado' ? C.fxList(h).filter((f) => f.eco && typeof f.toHit === 'number').reduce((n, f) => n + f.toHit, 0) : 0;
    const hitParts = [makePart(R.AB[ability].name, finalMod, 'SRD 5.2.1 p22'), makePart(proficient ? 'Proficiência' : 'Sem proficiência', proficient ? C.pb(h) : 0, 'SRD 5.2.1 p7')];
    const damageParts = [makePart(R.AB[ability].name, finalMod, 'SRD 5.2.1 p22')];
    if (magic) { hitParts.push(makePart('Raridade da arma (autoral)', magic, 'Dados e Desaforos — Armas', true)); damageParts.push(makePart('Raridade da arma (autoral)', magic, 'Dados e Desaforos — Armas', true)); }
    if (armed && w.hitUp - resonance) hitParts.push(makePart('Forja/ascensão (autoral)', w.hitUp - resonance, 'Dados e Desaforos — Forja', true));
    if (armed && w.dmgUp - resonance) damageParts.push(makePart('Forja/nível (autoral)', w.dmgUp - resonance, 'Dados e Desaforos — Forja', true));
    if (resonance) { hitParts.push(makePart('Ressonância (autoral)', resonance, 'Dados e Desaforos — Linhagem', true)); damageParts.push(makePart('Ressonância (autoral)', resonance, 'Dados e Desaforos — Linhagem', true)); }
    if (ecoHit) hitParts.push(makePart('Eco (autoral)', ecoHit, 'Dados e Desaforos — Ecos', true));
    if (hungerPenalty) { hitParts.push(makePart('Fome (autoral)', -hungerPenalty, 'Dados e Desaforos — Sobrevivência', true)); damageParts.push(makePart('Fome (autoral)', -hungerPenalty, 'Dados e Desaforos — Sobrevivência', true)); }
    const hitOther = toHit - hitParts.reduce((n, p) => n + p.value, 0), damageOther = dmgMod - damageParts.reduce((n, p) => n + p.value, 0);
    if (hitOther) hitParts.push(makePart('Características e estilos', hitOther, 'Características/talentos/estilos'));
    if (damageOther) damageParts.push(makePart('Características e estilos', damageOther, 'Características/talentos/estilos'));
    return {
      name: opts.unarmed || !w ? (monk ? 'Golpe Desarmado' : 'Ataque Desarmado') : w.def.name,
      base, ranged, ability, abMod, proficient, toHit, dice, dmgMod, type: wd.type, crit,
      mastery: masteryOk ? wd.mastery : null,
      gwf: C.hasStyle(h, 'grande') && (wd.props.includes('duas_maos') || twoHanding) && !ranged,
      finesseOrRanged: ranged || wd.props.includes('acuidade'),
      weapon: opts.unarmed ? null : w,
      heavy: wd.props.includes('pesada'),
      light: wd.props.includes('leve'),
      finesse: wd.props.includes('acuidade'),
      breakdown: { toHit: { total: toHit, parts: hitParts }, damage: { total: dmgMod, parts: damageParts } },
    };
  };
  C.attacksPerAction = (h) => (C.has(h, 'ataque_extra') || C.hasFx(h, 'extraAttack') ? 2 : 1);

  // ---------------- magia ----------------
  // SRD p23: the feature granting a spell determines its casting ability; Magic Initiate p87.
  C.spellSourceInfo = (h, spellOrId, source) => {
    const id = typeof spellOrId === 'string' ? spellOrId : Object.keys(S.SPELLS).find((key) => S.SPELLS[key] === spellOrId);
    const spell = id ? S.SPELLS[id] : null;
    const caster = C.caster(h), fallback = caster ? caster.ab : h.mi && R.AB[h.mi.ab] ? h.mi.ab : 'int';
    const featOwns = !!(id && h.mi && R.AB[h.mi.ab] && (h.mi.spell === id || (h.mi.cantrips || []).includes(id)));
    const classOwns = !!(spell && caster && (((h.cantrips || []).includes(id) || (h.prepared || []).includes(id))
      || (h.cls === 'paladino' && h.level >= 2 && id === 'golpe_divino') || (h.cls === 'patrulheiro' && id === 'marca_cacador')
      || C.fxVals(h, 'grantSpells').some((list) => list.some(([level, ...ids]) => h.level >= level && ids.includes(id)))));
    const options = [classOwns && 'class', featOwns && 'mi'].filter(Boolean);
    const stored = h.spellSources && options.includes(h.spellSources[id]) ? h.spellSources[id] : null;
    const selected = options.includes(source) ? source : stored;
    const useFeat = featOwns && (selected === 'mi' || (!classOwns && selected !== 'class'));
    return { id, ability: useFeat ? h.mi.ab : fallback, origin: useFeat ? 'mi' : caster ? 'class' : featOwns ? 'mi' : 'default', ambiguous: featOwns && classOwns && !selected, options, selected: selected || (useFeat ? 'mi' : classOwns ? 'class' : null), stored: !!stored };
  };
  C.setSpellSource = (h, id, source) => {
    if (!C.spellSourceInfo(h, id).options.includes(source)) return { error: 'Esta origem não concede a magia ao personagem.' };
    h.spellSources = Object.assign({}, h.spellSources, { [id]: source });
    return { ok: true };
  };
  C.magicInitiateAbilityChoices = (h) => h.mi && !h.mi.abilityChosen ? ['int', 'sab', 'car'] : [];
  C.chooseMagicInitiateAbility = (h, ability) => {
    if (!C.magicInitiateAbilityChoices(h).includes(ability)) return { error: 'Escolha um atributo de conjuração disponível para Iniciado em Magia.' };
    h.mi = Object.assign({}, h.mi, { ab: ability, abilityChosen: true });
    return { ok: true };
  };
  C.castAb = (h, spellOrId, source) => C.spellSourceInfo(h, spellOrId, source).ability;
  C.spellMod = (h, spellOrId, source) => C.mod(h, C.castAb(h, spellOrId, source));
  C.focusBonus = (h) => {
    const f = C.equipped(h, 'focus');
    return f && f.aff ? f.bonus + f.hitUp : 0;
  };
  C.spellAttack = (h, spellOrId, source) => C.pb(h) + C.spellMod(h, spellOrId, source) + C.focusBonus(h) - (E.Sim ? E.Sim.penalty(h) : 0);
  C.spellDC = (h, spellOrId, source) => {
    const sp = typeof spellOrId === 'string' ? S.SPELLS[spellOrId] : spellOrId;
    return 8 + C.pb(h) + C.spellMod(h, spellOrId, source) + C.focusBonus(h) + (sp ? C.fxVals(h, 'spellDc').reduce((a, d) => a + (d.schools.includes(sp.school) ? d.bonus : 0), 0) : 0);
  };
  C.slotsMax = (h) => (C.caster(h) ? H.slotsFor(C.caster(h).type, h.level) : []);
  C.slotsLeft = (h) => C.slotsMax(h).map((n, i) => Math.max(0, n - ((h.slotsUsed || [])[i] || 0)));
  C.maxSpellLevel = (h) => {
    const s = C.slotsMax(h);
    for (let i = s.length - 1; i >= 0; i--) if (s[i] > 0) return i + 1;
    return 0;
  };
  C.knownSpells = (h) => {
    const list = [...(h.cantrips || []), ...(h.prepared || [])];
    if (h.mi) list.push(...(h.mi.cantrips || []), h.mi.spell);
    if (h.cls === 'paladino' && h.level >= 2 && !list.includes('golpe_divino')) list.push('golpe_divino');
    if (h.cls === 'patrulheiro' && !list.includes('marca_cacador')) list.push('marca_cacador');
    if (C.species(h).hooks.cantrip && !list.includes(C.species(h).hooks.cantrip)) list.push(C.species(h).hooks.cantrip);
    // magias da subclasse (sempre preparadas)
    for (const g of C.fxVals(h, 'grantSpells')) for (const [lv, ...ids] of g) if (h.level >= lv) for (const id of ids) if (S.SPELLS[id] && (S.SPELLS[id].level <= Math.max(0, C.maxSpellLevel(h)) || S.SPELLS[id].level === 0)) list.push(id);
    return [...new Set(list.filter(Boolean))];
  };
  C.cantripDice = (h, spell) => {
    const d = U.parseDice(spell.dmg);
    if (spell.level > 0 || spell.beams) return spell.dmg;
    const n = d.n * (h.level >= 11 ? 3 : h.level >= 5 ? 2 : 1);
    return U.diceStr(n, d.s, d.mod);
  };
  // Conjura uma magia fora de combate (cura ou efeito duradouro). Retorna texto do resultado ou null.
  C.castOutside = (h, id) => {
    const sp = S.SPELLS[id];
    if (!sp || !(sp.heal || ['armadura_arcana', 'auxilio'].includes(sp.buff))) return null;
    const left = C.slotsLeft(h);
    const free = h.mi && h.mi.spell === id && C.res(h, 'mi_spell') > 0;
    const lvl = free ? sp.level : left.findIndex((n, i) => n > 0 && i + 1 >= sp.level) + 1;
    if (!free && lvl <= 0) return { error: 'Sem espaços de magia disponíveis.' };
    if (free) C.spend(h, 'mi_spell');
    else { h.slotsUsed = h.slotsUsed || []; h.slotsUsed[lvl - 1] = (h.slotsUsed[lvl - 1] || 0) + 1; }
    if (sp.heal) {
      const d = E.U.parseDice(sp.heal), up = sp.up ? E.U.parseDice(sp.up) : null;
      const n = d.n + (up && lvl > sp.level ? (lvl - sp.level) * up.n : 0);
      let amt = 0;
      for (let i = 0; i < n; i++) amt += E.U.die(d.s);
      amt += d.mod + (sp.healMod ? C.spellMod(h, id, free ? 'mi' : undefined) : 0);
      if (C.has(h, 'discipulo_vida')) amt += 2 + lvl;
      amt += C.fxNum(h, 'healBonus');
      const before = h.hp;
      h.hp = Math.min(C.maxHp(h), h.hp + Math.max(1, amt));
      return { text: `${sp.name}: +${h.hp - before} PV` };
    }
    h.buffs = h.buffs || {};
    if (sp.buff === 'auxilio') {
      const aid = C.applyAid(h, lvl);
      return { text: `Auxílio: +${aid.bonus} PV máximos; +${aid.increase} PV atuais (efeitos iguais não acumulam).` };
    }
    h.buffs[sp.buff] = true;
    return { text: `Armadura Arcana: CA ${C.ac(h)} até o Descanso Longo.` };
  };
  C.preparedMax = (h) => (S.PREPARED[h.cls] ? S.PREPARED[h.cls][h.level] : 0);

  // ---------------- recursos de classe ----------------
  C.resourcesMax = (h) => {
    const L = h.level, pb = C.pb(h), r = {};
    if (h.cls === 'barbaro') r.furia = L >= 9 ? 4 : L >= 6 ? 4 : L >= 3 ? 3 : 2;
    if (h.cls === 'guerreiro') { r.folego = L >= 10 ? 4 : L >= 4 ? 3 : 2; if (L >= 2) r.surto = 1; if (L >= 9) r.indomavel = 1; }
    if (h.cls === 'monge' && L >= 2) r.foco = L;
    if (h.cls === 'monge' && L >= 2) r.metabolismo = 1;
    if (h.cls === 'paladino') { r.impor = 5 * L; if (L >= 2) r.golpe_gratis = 1; if (L >= 3) r.canalizar = L >= 11 ? 3 : 2; }
    if (h.cls === 'patrulheiro') { r.marca_gratis = L >= 9 ? 4 : L >= 5 ? 3 : 2; if (L >= 10) r.incansavel = Math.max(1, C.mod(h, 'sab')); }
    if (h.cls === 'clerigo' && L >= 10) r.intervencao = 1;
    if (h.cls === 'clerigo' && L >= 2) r.canalizar = L >= 6 ? 3 : 2;
    if (h.cls === 'bardo') r.inspiracao = Math.max(1, C.mod(h, 'car'));
    if (h.cls === 'feiticeiro') { r.inata = 2; if (L >= 2) r.feiticaria = L; }
    if (h.cls === 'druida' && L >= 2) r.forma = L >= 17 ? 4 : L >= 6 ? 3 : 2;
    if (h.cls === 'mago') r.recuperacao = 1;
    if (h.cls === 'bruxo' && L >= 2) r.astucia = 1;
    const sp = C.species(h).hooks;
    if (sp.breath) r.sopro = pb;
    if (sp.relentless) r.implacavel = 1;
    if (sp.adrenaline) r.adrenalina = pb;
    if (sp.healingHands) r.maos_curativas = 1;
    if (sp.giantFire) r.gigante = pb;
    if (C.hasFeat(h, 'sortudo')) r.sorte = pb;
    if (h.mi && h.mi.spell) r.mi_spell = 1;
    // recursos da subclasse e dos talentos
    const sb = C.sub(h);
    if (sb && sb.resources) for (const [k, fn] of Object.entries(sb.resources)) { const n = fn(h); if (n > 0) r[k] = n; }
    for (const f of h.feats || []) { const ft = H.FEATS[f]; if (ft && ft.resources) for (const [k, fn] of Object.entries(ft.resources)) r[k] = fn(h); }
    return r;
  };
  C.res = (h, key) => {
    const max = C.resourcesMax(h)[key] || 0;
    return Math.max(0, max - ((h.used || {})[key] || 0));
  };
  C.spend = (h, key, n = 1) => {
    h.used = h.used || {};
    h.used[key] = (h.used[key] || 0) + n;
  };
  C.rageDamage = (h) => (h.level >= 9 ? 3 : 2);
  C.sneakDice = (h) => Math.ceil(h.level / 2);

  // ---------------- descanso ----------------
  C.longRest = (h) => {
    h.used = {};
    h.slotsUsed = [];
    h.hdUsed = 0;
    delete h.portent; delete h.ward; delete h.omen;
    h.maxHpReduce = 0;
    h.strDrain = 0;
    h.buffs = {};
    h.hp = C.maxHp(h);
    h.tempHp = 0;
    h.dead = false;
    h.deathSaves = { s: 0, f: 0 };
    h.buffs = {};
    if (C.species(h).hooks.heroicOnLongRest) h.heroic = true;
    // Maestria em Armas: atualiza para incluir a arma equipada (troca permitida no Descanso Longo)
    C.refreshMasteries(h);
  };
  C.refreshMasteries = (h) => {
    const n = C.cls(h).masteryCount;
    if (!n) { h.masteries = []; return; }
    const w = C.equipped(h, 'weapon');
    const base = w ? w.def.base : null;
    let list = (h.masteries || []).slice();
    if (base && !list.includes(base)) {
      list.unshift(base);
      list = list.slice(0, n);
    }
    h.masteries = list;
  };
  C.shortRestHeal = (h) => {
    // gasta um Dado de Vida
    if ((h.hdUsed || 0) >= h.level) return null;
    h.hdUsed = (h.hdUsed || 0) + 1;
    const roll = U.die(C.cls(h).hd);
    const heal = Math.max(1, roll + C.mod(h, 'con'));
    h.hp = Math.min(C.maxHp(h), h.hp + heal);
    return { roll, heal };
  };
  C.shortRest = (h) => {
    // recursos de descanso curto
    const u = h.used || {};
    if (h.cls === 'guerreiro') { u.surto = 0; if (u.folego) u.folego = Math.max(0, u.folego - 1); }
    if (h.cls === 'monge') u.foco = 0;
    if (h.cls === 'bruxo') h.slotsUsed = [];
    if (h.cls === 'clerigo' && u.canalizar) u.canalizar = Math.max(0, u.canalizar - 1);
    if (h.cls === 'paladino' && u.canalizar) u.canalizar = Math.max(0, u.canalizar - 1);
    // recursos de subclasse que voltam no Descanso Curto
    for (const k of ['superioridade', 'sacerdote', 'eu_ilusorio', 'clarividente']) if (u[k]) u[k] = 0;
    if (u.psionico) u.psionico = Math.max(0, u.psionico - 1);
    if (u.labareda && C.hasFx(h, 'improvedFlare')) u.labareda = 0;
    // Restauração Feiticeira (Feiticeiro 5)
    if (h.cls === 'feiticeiro' && h.level >= 5 && u.feiticaria && !u.restauracao) { u.feiticaria = Math.max(0, u.feiticaria - Math.floor(h.level / 2)); u.restauracao = 1; }
    if (h.cls === 'bardo' && h.level >= 5) u.inspiracao = 0;
    if (h.cls === 'druida' && u.forma) u.forma = Math.max(0, u.forma - 1);
    if (C.species(h).hooks.adrenaline) u.adrenalina = 0;
    if (h.cls === 'mago' && !u.recuperacao) {
      // Recuperação Arcana: recupera espaços somando até metade do nível (arredondado p/ cima)
      let budget = Math.ceil(h.level / 2);
      const su = h.slotsUsed || [];
      for (let i = Math.min(5, su.length) - 1; i >= 0; i--) {
        while (su[i] > 0 && budget >= i + 1) { su[i]--; budget -= i + 1; }
      }
      u.recuperacao = 1;
    }
    h.used = u;
  };

  // ---------------- XP e níveis ----------------
  C.xpForNext = (h) => (h.level >= R.MAX_LEVEL ? null : R.XP_TABLE[h.level + 1]);
  // SRD 5.2.1 pp86–87: Human Versatile grants an Origin feat, never a General feat.
  // The old creator stored [background feat, extra feat] and applied no ability increase.
  C.reconcileOriginFeat = (h) => {
    if (!h || h.species !== 'humano' || h.level >= 4 || Math.max(h.peak || 0, h.level) >= 4 || h.pendingOriginFeat || (h.ruleBackups && h.ruleBackups.humanOrigin)) return false;
    const bg = H.BACKGROUNDS[h.background], feats = h.feats || [];
    if (!bg || feats.length !== 2 || feats[0] !== bg.feat || !H.FEATS[feats[1]] || !H.FEATS[feats[1]].general) return false;
    // Without a proven grant ledger, do not infer/reverse ability changes in an ambiguous save.
    if (Object.values(h.asi || {}).some((n) => n !== 0)) return false;
    const removed = feats[1];
    h.ruleBackups = Object.assign({}, h.ruleBackups, { humanOrigin: JSON.parse(JSON.stringify({ feats, featData: h.featData || {}, asi: h.asi || {}, hp: h.hp, source: '5.12.1 creator: General feat offered as Human Origin feat', removed })) });
    h.feats = [bg.feat];
    h.pendingOriginFeat = { removed, source: 'SRD 5.2.1 pp86–87 — Human Versatile / feat categories' };
    return true;
  };
  C.originFeatChoices = (h) => h.pendingOriginFeat && h.species === 'humano'
    ? Object.keys(H.FEATS).filter((id) => !H.FEATS[id].general && (H.FEATS[id].repeatable || !(h.feats || []).includes(id))) : [];
  C.chooseOriginFeat = (h, id) => {
    if (!C.originFeatChoices(h).includes(id)) return { error: 'Escolha um talento de Origem elegível.' };
    const before = C.maxHp(h);
    h.feats = [...(h.feats || []), id];
    if (id === 'iniciado_magia' && !h.mi) h.mi = { cantrips: ['raio_fogo', 'raio_gelo'], spell: 'misseis_magicos', ab: 'int' };
    h.hp += Math.max(0, C.maxHp(h) - before);
    delete h.pendingOriginFeat;
    return { ok: true };
  };
  // Explicit choices, never guessed from class recommendations. SRD 5.2.1 pp29,32,59,61,78,87.
  const ruleSources = (h) => {
    const sources = [], all = Object.keys(R.SKILLS);
    const add = (id, kind, count, name, level, source, pool = all) => {
      if (h.level >= level) sources.push({ id, kind, count, name, source, pool });
    };
    if (h.cls === 'ladino') {
      add('rogue_expertise_1', 'expertise', 2, 'Especialização de Ladino (nível 1)', 1, 'SRD 5.2.1 p61');
      add('rogue_expertise_6', 'expertise', 2, 'Especialização de Ladino (nível 6)', 6, 'SRD 5.2.1 p61');
    }
    if (h.cls === 'bardo') {
      add('bard_expertise_2', 'expertise', 2, 'Especialização de Bardo (nível 2)', 2, 'SRD 5.2.1 p32');
      add('bard_expertise_9', 'expertise', 2, 'Especialização de Bardo (nível 9)', 9, 'SRD 5.2.1 p32');
      if (h.subChosen && C.subId(h) === 'conhecimento') add('lore_skills_3', 'skill', 3, 'Proficiências do Colégio do Conhecimento', 3, 'SRD 5.2.1 p35');
    }
    if (h.cls === 'patrulheiro') {
      add('ranger_expertise_2', 'expertise', 1, 'Explorador Hábil', 2, 'SRD 5.2.1 p59');
      add('ranger_expertise_9', 'expertise', 2, 'Especialização de Patrulheiro (nível 9)', 9, 'SRD 5.2.1 p59');
    }
    if (h.cls === 'mago') add('wizard_scholar_2', 'expertise', 1, 'Erudito', 2, 'SRD 5.2.1 p78', ['arcanismo', 'historia', 'investigacao', 'medicina', 'natureza', 'religiao']);
    if (h.cls === 'barbaro') add('barbarian_skill_3', 'skill', 1, 'Conhecimento Primal', 3, 'SRD 5.2.1 p29', C.cls(h).skills.from);
    (h.feats || []).forEach((feat, index) => {
      if (feat === 'habilidoso') add('skilled_' + index, 'skill', 3, 'Habilidoso — perícias', 1, 'SRD 5.2.1 p87 (ferramentas ainda indisponíveis)');
    });
    return sources;
  };
  C.progressionChoices = (h) => {
    const sources = ruleSources(h), grants = h.ruleGrants || {};
    const skills = [...new Set((h.skills || []).filter((s) => R.SKILLS[s]))];
    const expertise = [...new Set((h.expertise || []).filter((s) => skills.includes(s)))];
    const marked = sources.filter((s) => s.kind === 'expertise').flatMap((s) => grants[s.id] || []).filter((s) => R.SKILLS[s]);
    const legacyExpertise = expertise.filter((s) => !marked.includes(s));
    const sp = C.species(h).hooks || {}, bg = H.BACKGROUNDS[h.background];
    const baseline = Array.isArray(h.ruleBaseSkills) ? h.ruleBaseSkills.length
      : new Set((bg && bg.skills) || []).size + C.cls(h).skills.n + (sp.extraSkill || (sp.skillChoice ? 1 : 0));
    const markedSkills = sources.filter((s) => s.kind === 'skill').flatMap((s) => grants[s.id] || []);
    let legacySkillCredit = Math.max(0, skills.length - baseline - new Set(markedSkills).size);
    const pending = [];
    for (const src of sources) {
      const owns = src.kind === 'expertise' ? expertise : skills;
      const explicit = [...new Set(grants[src.id] || [])].filter((s) => src.pool.includes(s) && owns.includes(s));
      let remaining = Math.max(0, src.count - explicit.length);
      if (src.kind === 'expertise') {
        for (let i = 0; i < legacyExpertise.length && remaining > 0;) {
          if (src.pool.includes(legacyExpertise[i])) { legacyExpertise.splice(i, 1); remaining--; }
          else i++;
        }
      } else {
        // Credit already-held legacy extra skills without replacing or inventing their choices.
        const credit = Math.min(remaining, legacySkillCredit);
        legacySkillCredit -= credit; remaining -= credit;
      }
      const options = src.pool.filter((s) => src.kind === 'expertise' ? skills.includes(s) && !expertise.includes(s) : !skills.includes(s));
      if (remaining) pending.push({ id: src.id, kind: src.kind, count: Math.min(remaining, options.length), unavailableCount: Math.max(0, remaining - options.length), name: src.name, source: src.source, options });
    }
    return pending;
  };
  C.applyProgressionChoice = (h, id, values) => {
    if (!Array.isArray(values) || new Set(values).size !== values.length) return { error: 'Escolha perícias diferentes.' };
    const choice = C.progressionChoices(h).find((c) => c.id === id);
    if (!choice) {
      const old = h.ruleGrants && h.ruleGrants[id];
      return Array.isArray(old) && values.length && values.every((s) => old.includes(s)) ? { ok: true, already: true } : { error: 'Esta escolha não está disponível.' };
    }
    if (!choice.count) return { error: 'As escolhas restantes dependem de opções ainda indisponíveis (por exemplo, ferramentas).' };
    if (values.length !== choice.count || values.some((s) => !choice.options.includes(s))) return { error: `Escolha ${choice.count} perícia(s) elegível(is).` };
    const key = choice.kind === 'expertise' ? 'expertise' : 'skills';
    h[key] = [...new Set([...(h[key] || []), ...values])];
    h.ruleGrants = h.ruleGrants || {};
    h.ruleGrants[id] = [...new Set([...(h.ruleGrants[id] || []), ...values])];
    return { ok: true };
  };
  C.ruleChoices = C.progressionChoices;
  C.chooseRule = C.applyProgressionChoice;
  // Penalidade de morte (fora do modo Hardcore): perde um nível (ou XP no nível 1), 30% do ouro e parte dos itens.
  C.deathPenalty = (h) => {
    const out = { from: h.level, to: h.level, levelLost: false, xp: 0, gold: 0, items: [] };
    h.peak = Math.max(h.peak || 0, h.level);
    if (h.level > 1) {
      h.level--; out.to = h.level; out.levelLost = true;
      h.xp = R.XP_TABLE[h.level];
    } else { out.xp = h.xp; h.xp = 0; }
    out.gold = Math.floor(h.gold * 0.3); h.gold -= out.gold;
    // itens: perde 1/3 (arredondado para cima) de cada pilha de materiais e de até 2 consumíveis aleatórios
    for (const [k, n] of Object.entries(h.materials || {})) {
      if (n <= 0) continue;
      const lost = Math.ceil(n / 3); h.materials[k] = n - lost; out.items.push({ name: k, n: lost });
    }
    const cons = Object.entries(h.inventory || {}).filter(([, n]) => n > 0);
    for (let i = 0; i < 2 && cons.length; i++) {
      const [k, n] = cons.splice(Math.floor(U.rand() * cons.length), 1)[0];
      const lost = Math.max(1, Math.floor(n / 2)); h.inventory[k] = n - lost;
      out.items.push({ name: (R.ITEMS && R.ITEMS[k] ? R.ITEMS[k].name : k), n: lost });
    }
    if (E.Life && E.Life.onDeath) E.Life.onDeath(h, out);
    h.hp = Math.max(1, Math.floor(C.maxHp(h) / 2));
    h.deathSaves = { s: 0, f: 0 };
    return out;
  };

  C.addXp = (h, xp) => {
    h.xp += xp;
    let gained = 0;
    h.lastFresh = 0;
    while (h.level < R.MAX_LEVEL && h.xp >= R.XP_TABLE[h.level + 1]) {
      const before = C.maxHp(h);
      h.level++;
      gained++;
      h.hp += C.maxHp(h) - before;
      C.autoLearn(h);
      // ao recuperar um nível perdido na morte não se ganha de novo o Aumento de Atributo
      const fresh = h.level > (h.peak || 0);
      if (fresh) { h.peak = h.level; h.lastFresh++; }
      if (fresh && (h.level === 4 || h.level === 8 || (h.cls === 'guerreiro' && h.level === 6) || (h.cls === 'ladino' && h.level === 10))) h.pendingAsi = (h.pendingAsi || 0) + 1; // SRD pp47,62
      if ((h.cls === 'paladino' || h.cls === 'patrulheiro') && h.level === 2 && !h.fightingStyle) h.pendingStyle = true;
    }
    U.emit('hero:xp', { hero: h, id: h.id, xp: h.xp, level: h.level, gained: xp });
    return gained;
  };
  // Mantém truques/magias preparadas no limite, completando automaticamente com as melhores opções
  C.autoLearn = (h) => {
    const cls = C.cls(h);
    if (!cls.caster) return;
    const list = S.listFor(h.cls);
    const maxLv = C.maxSpellLevel(h);
    const ck = S.cantripsKnown(h.cls, h.level);
    h.cantrips = h.cantrips || [];
    // prioriza truques de dano mais fortes (ex.: Rajada Mística para Bruxos)
    const cval = (id) => { const sp = S.SPELLS[id]; return (sp.dmg ? E.U.avgDice(sp.dmg) : 0) + (sp.beams ? 6 : 0) + (sp.attack === 'dist' || sp.save ? 1 : 0) + (sp.aoe ? 1 : 0); };
    const cantrips = list.filter((id) => S.SPELLS[id].level === 0 && !h.cantrips.includes(id)).sort((a, b) => cval(b) - cval(a));
    while (h.cantrips.length < ck && cantrips.length) h.cantrips.push(cantrips.shift());
    h.prepared = (h.prepared || []).filter((id) => S.SPELLS[id] && S.SPELLS[id].level <= maxLv);
    const pm = C.preparedMax(h);
    const sval = (id) => { const sp = S.SPELLS[id]; return sp.level * 10 + (sp.dmg ? 5 : 0) + (sp.heal ? 4 : 0) + (sp.aoe ? 2 : 0) + (id === 'escudo_arcano' ? 8 : 0) + (sp.buff === 'armadura_arcana' ? 4 : 0) - (sp.time === 'smite' ? 20 : 0); };
    const avail = list.filter((id) => S.SPELLS[id].level > 0 && S.SPELLS[id].level <= maxLv && !h.prepared.includes(id))
      .sort((a, b) => sval(b) - sval(a));
    while (h.prepared.length < pm && avail.length) h.prepared.push(avail.shift());
  };

  // ---------------- criação ----------------
  C.create = (o) => {
    const cls = H.CLASSES[o.cls], sp = H.SPECIES[o.species], bg = H.BACKGROUNDS[o.background];
    const extra = o.species === 'humano' && H.FEATS[o.extraFeat] && !H.FEATS[o.extraFeat].general && (o.extraFeat !== bg.feat || o.extraFeat === 'habilidoso') ? o.extraFeat : null;
    const h = {
      id: U.uid(), name: o.name || 'Viajante', cls: o.cls, species: o.species, background: o.background,
      ancestry: o.ancestry || null,
      base: o.base, bgBonus: o.bgBonus, asi: {},
      level: 1, xp: 0, hp: 1, tempHp: 0, hdUsed: 0, slotsUsed: [], used: {},
      skills: [...new Set([...(bg.skills || []), ...(o.skills || [])])],
      expertise: [],
      feats: [bg.feat].concat(extra ? [extra] : []),
      fightingStyle: o.fightingStyle || null,
      masteries: [],
      cantrips: o.cantrips || [], prepared: o.prepared || [],
      equip: { weapon: null, focus: null, armor: cls.equip.armor, shield: !!cls.equip.shield },
      inventory: { pocao_cura: cls.equip.potions || 1 },
      gold: cls.equip.gold,
      look: o.look || { skin: sp.look.skin[0], hair: '#3a2a20', outfit: cls.color, hairStyle: 0 },
      heroic: !!sp.hooks.heroicOnLongRest,
      buffs: {}, quests: {}, created: Date.now(), dead: false, deathSaves: { s: 0, f: 0 },
      kills: {}, materials: {},
    };
    h.ruleGrants = {};
    h.ruleBaseSkills = h.skills.slice();
    // Iniciado em Magia do antecedente
    if (bg.feat === 'iniciado_magia' || extra === 'iniciado_magia') {
      const lst = bg.featList || 'mago';
      const presets = {
        clerigo: { cantrips: ['chama_sagrada', 'palavra_radiante'], spell: 'curar_ferimentos', ab: 'sab' },
        druida: { cantrips: ['produzir_chama', 'chicote_espinhos'], spell: 'curar_ferimentos', ab: 'sab' },
        mago: { cantrips: ['raio_fogo', 'raio_gelo'], spell: 'misseis_magicos', ab: 'int' },
      };
      h.mi = Object.assign({}, presets[lst]);
    }
    // armas iniciais
    const start = E.Store.addWeapon('starter:' + cls.equip.weapon, { custom: C.makeStarter(cls.equip.weapon) });
    h.equip.weapon = start.uid;
    if (cls.equip.focus) {
      const f = E.Store.addWeapon('focus:' + cls.equip.focus, { custom: C.makeFocus(cls.equip.focus) });
      h.equip.focus = f.uid;
    }
    C.autoLearn(h);
    C.refreshMasteries(h);
    h.hp = C.maxHp(h);
    return h;
  };

  // Sugestão de distribuição do Conjunto Padrão por classe
  C.suggestArray = (clsId) => {
    const pri = {
      barbaro: ['for', 'con', 'des', 'sab', 'car', 'int'], bardo: ['car', 'des', 'con', 'sab', 'int', 'for'],
      bruxo: ['car', 'con', 'des', 'sab', 'int', 'for'], clerigo: ['sab', 'con', 'for', 'des', 'car', 'int'],
      druida: ['sab', 'con', 'des', 'int', 'car', 'for'], guerreiro: ['for', 'con', 'des', 'sab', 'car', 'int'],
      ladino: ['des', 'con', 'int', 'sab', 'car', 'for'], feiticeiro: ['car', 'con', 'des', 'sab', 'int', 'for'],
      mago: ['int', 'con', 'des', 'sab', 'car', 'for'], monge: ['des', 'sab', 'con', 'for', 'int', 'car'],
      paladino: ['for', 'car', 'con', 'sab', 'des', 'int'], patrulheiro: ['des', 'sab', 'con', 'for', 'int', 'car'],
    }[clsId];
    const out = {};
    pri.forEach((ab, i) => { out[ab] = R.STANDARD_ARRAY[i]; });
    return out;
  };
  // Sugere +2/+1 do antecedente favorecendo os atributos principais da classe
  C.suggestBgBonus = (clsId, bgId, base) => {
    const bg = H.BACKGROUNDS[bgId];
    const order = bg.abilities.slice().sort((a, b) => (base[b] || 10) - (base[a] || 10));
    const primary = H.CLASSES[clsId].primary;
    order.sort((a, b) => (primary.includes(b) ? 1 : 0) - (primary.includes(a) ? 1 : 0));
    const out = {};
    out[order[0]] = 2;
    out[order[1]] = 1;
    return out;
  };

  E.C = C;
})();
