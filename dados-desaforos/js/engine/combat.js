/* Motor de combate por turnos — regras de D&D 2024.
   O motor decide os números; o "presenter" (interface) só anima e exibe. */
(() => {
  const U = E.U, R = E.R, C = E.C, S = E.S, M = E.M, W = E.W;

  const INCAP = ['paralisado', 'atordoado', 'adormecido', 'banido', 'incapacitado'];
  const dmgName = (t) => (R.DAMAGE[t] ? R.DAMAGE[t].name : t);

  // Rola N dados de S lados
  const rollDice = (expr, crit = false, opts = {}) => {
    const d = U.parseDice(expr);
    const n = d.n * (crit ? 2 : 1);
    const vals = [];
    for (let i = 0; i < n; i++) {
      let v = U.die(d.s);
      if (opts.gwf && v < 3) v = 3;
      vals.push(v);
    }
    return { s: d.s, vals, mod: d.mod, total: vals.reduce((a, b) => a + b, 0) + d.mod };
  };

  class Battle {
    constructor(opts) {
      this.P = opts.presenter;
      this.h = opts.hero;
      this.region = opts.region;
      this.isBoss = !!opts.boss;
      this.noLair = !!opts.noLair; // Provações de Eco: chefes não contam como covil
      this.startHp = opts.hero.hp;
      this.round = 1;
      this.over = false;
      this.result = null;
      this.busy = false;
      this.log = [];
      this.hc = { cond: {}, conc: null, dodge: false, reckless: false, hidden: 0, raging: false, rageRounds: 0, blessed: false, shieldOfFaith: false,
        mark: null, weaponSpirit: false, innate: 0, firstAttackDone: false, sacred: false, steady: false, revelation: false, dots: [], wild: false,
        sb: {}, ward: undefined, wardMax: 0, portent: [], vow: null, phantom: 0, firstHitHalve: false, illusory: false, rescue: false, hitsBy: {} };
      this.enemies = opts.enemies.map((key, i) => this.makeEnemy(key, i));
      // aliados do modo online (outros jogadores do grupo); agem por rede através do presenter
      this.allies = (opts.allies || []).map((a) => Object.assign({}, a, { uid: 'ally_' + a.id, down: a.hp <= 0, dodge: false }));
      this.turn = null;
      this.useLuck = false;
    }

    makeEnemy(key, i) {
      const def = M.MONSTERS[key];
      const hp = U.avgDice(def.hp);
      const letters = 'ABCDEFG';
      return {
        uid: 'e' + i + '_' + key, key, def, name: def.name, hp, maxHp: hp, ac: def.ac, cond: {}, ready: true,
        tag: '', idx: i, dead: false, tookFireAcid: false, lr: def.lr || 0, summoned: false, letter: letters[i] || '', acted: false, averse: 0,
      };
    }
    alive() { return this.enemies.filter((e) => !e.dead && !e.cond.banido); }
    ally(uid) { return this.allies.find((a) => a.uid === uid); }
    nameOf(o) { return o.side === 'hero' ? this.h.name : o.side === 'ally' ? (this.ally(o.uid) || {}).name : (this.enemy(o.uid) || {}).name; }
    enemy(uid) { return this.enemies.find((e) => e.uid === uid); }

    // ------------------------------------------------------------ início
    async start() {
      const h = this.h;
      // nomes únicos
      const counts = {};
      this.enemies.forEach((e) => { counts[e.key] = (counts[e.key] || 0) + 1; });
      const seen = {};
      this.enemies.forEach((e) => { if (counts[e.key] > 1) { seen[e.key] = (seen[e.key] || 0) + 1; e.name = `${e.def.name} ${'ABCDEFG'[seen[e.key] - 1]}`; } });
      // PV temporários de armas
      for (const slot of ['weapon', 'focus']) {
        const w = C.equipped(h, slot);
        if (w && w.def.passive) {
          const p = w.def.passive;
          if (p.kind === 'temp') h.tempHp = Math.max(h.tempHp || 0, p.vals[w.refine - 1]);
          if (p.tempVals) h.tempHp = Math.max(h.tempHp || 0, p.tempVals[w.refine - 1]);
        }
      }
      // subclasses: PV temporários, Proteção Arcana, Presságio…
      const hc = this.hc;
      if (C.hasFx(h, 'inspiringLeader') && C.res(h, 'lider') > 0) { C.spend(h, 'lider'); const n = h.level + Math.max(C.mod(h, 'sab'), C.mod(h, 'car')); if (n > (h.tempHp || 0)) { h.tempHp = n; this.say(`Líder Inspirador: ${n} PV temporários.`, 'good'); } }
      for (const f of C.fxVals(h, 'startTemp')) { const n = typeof f === 'function' ? f(h) : f; if (n > (h.tempHp || 0)) { h.tempHp = n; this.say(`PV temporários da subclasse: ${n}.`, 'good'); } }
      // Proteção Arcana (Abjurador): criada por uma Abjuração com espaço e mantida até o Descanso Longo
      if (C.hasFx(h, 'arcaneWard')) { hc.wardMax = 2 * h.level + C.mod(h, 'int'); if (h.ward !== undefined) { hc.ward = Math.min(hc.wardMax, h.ward); this.say(`Proteção Arcana: ${hc.ward} PV de proteção.`, 'good'); } }
      // Presságio (Adivinho): dois d20 rolados depois do Descanso Longo
      if (C.hasFx(h, 'portent')) { if (!h.portent) h.portent = [U.die(20), U.die(20)].sort((a, b) => a - b); hc.portent = h.portent; if (hc.portent.length) this.say(`Presságio: você guarda os números ${hc.portent.join(' e ')}.`, 'good'); }
      hc.illusory = C.hasFx(h, 'illusorySelf');
      // Presságio Cósmico (Círculo das Estrelas): Bem ou Mal até o próximo Descanso Longo
      if (C.hasFx(h, 'cosmicOmen') && !h.omen) h.omen = U.die(2) === 1 ? 'bem' : 'mal';
      // Metabolismo Sobrenatural (Monge 2)
      if (C.hasFx(h, 'uncannyMetabolism') && ((h.used || {}).foco || 0) > 0 && C.res(h, 'metabolismo') > 0) {
        C.spend(h, 'metabolismo'); h.used.foco = 0;
        const x = rollDice(`1d${this.martialDie()}`);
        h.hp = Math.min(C.maxHp(h), h.hp + x.total + h.level);
        this.say(`Metabolismo Sobrenatural: Foco restaurado e +${x.total + h.level} PV.`, 'good');
      }
      // comida "Inspiração" (Livro do Mestre: Inspiração Heroica como recompensa)
      if (E.Life && E.Life.buff(h, 'foco') && !h.heroic) { h.heroic = true; this.say('Caldo Estelar: você começa com Inspiração Heroica.', 'good'); }
      // comida "Vigor"
      if (E.Life && E.Life.buff(h, 'vigor')) { h.tempHp = Math.max(h.tempHp || 0, 2 * h.level); this.say(`Vigor (refeição): ${2 * h.level} PV temporários.`, 'good'); }
      // Bênção sobrenatural (Livro do Mestre: Dádivas) concedida pela última lanterna na luta final
      if (this.isBoss) {
        h.tempHp = Math.max(h.tempHp || 0, 4 * h.level);
        this.say(`Bênção da Última Lanterna: ${4 * h.level} PV temporários!`, 'good');
      }
      // iniciativa
      const adv = C.has(h, 'instinto_feral') || C.hasFx(h, 'initAdv');
      const hr = this.d20(adv, false, true);
      let foco = 0;
      // Passos em Conjunto (Colégio da Dança): gasta Inspiração Bárdica e soma o dado
      if (C.hasFx(h, 'tandemFootwork') && C.res(h, 'inspiracao') >= 2) { C.spend(h, 'inspiracao'); foco = U.die(this.inspDie()); this.say(`Passos em Conjunto: +${foco} na Iniciativa.`, 'good'); }
      const hInit = hr.nat + C.initiative(h) + foco;
      await this.P.rollD20({ who: 'hero', label: 'Iniciativa', rolls: hr.rolls, nat: hr.nat, bonus: C.initiative(h) + foco, total: hInit, adv, kind: 'init' });
      this.order = [{ side: 'hero', init: hInit, dex: C.score(h, 'des') }];
      for (const e of this.enemies) {
        const ei = U.die(20) + U.mod(e.def.ab.des);
        e.init = ei;
        this.order.push({ side: 'enemy', uid: e.uid, init: ei, dex: e.def.ab.des });
      }
      for (const a of this.allies) { const ai = U.die(20) + (a.init || 0); a.initRoll = ai; this.order.push({ side: 'ally', uid: a.uid, init: ai, dex: 10 + (a.init || 0) * 2 }); }
      this.order.sort((a, b) => b.init - a.init || b.dex - a.dex || (a.side === 'hero' ? -1 : 1));
      this.say(`Iniciativa: ${this.order.map((o) => this.nameOf(o) + ' ' + o.init).join(' · ')}`, 'sys');
      this.turnIdx = -1;
      this.round = 1;
      await this.next();
    }

    say(text, kind = 'info') {
      this.log.unshift({ text, kind });
      this.log = this.log.slice(0, 40);
      this.P.log(text, kind);
    }

    // ------------------------------------------------------------ dados
    d20(adv, dis, isHero) {
      let a = U.die(20), b = U.die(20);
      if (isHero && C.species(this.h).hooks.luck) { if (a === 1) a = U.die(20); if (b === 1) b = U.die(20); }
      if (adv && !dis) return { nat: Math.max(a, b), rolls: [a, b], mode: 'adv' };
      if (dis && !adv) return { nat: Math.min(a, b), rolls: [a, b], mode: 'dis' };
      return { nat: a, rolls: [a], mode: 'normal' };
    }

    // ------------------------------------------------------------ fluxo de turnos
    async next() {
      if (this.checkEnd()) return;
      this.turnIdx = (this.turnIdx + 1) % this.order.length;
      if (this.turnIdx === 0 && this.turn) this.round++;
      const cur = this.order[this.turnIdx];
      if (cur.side === 'hero') return this.heroTurnStart();
      if (cur.side === 'ally') {
        const a = this.ally(cur.uid);
        if (a && !a.down) await this.allyTurn(a);
        if (!this.over) await this.next();
        return;
      }
      const e = this.enemy(cur.uid);
      if (!e || e.dead) return this.next();
      await this.enemyTurn(e);
      if (!this.over) await this.next();
    }

    async heroTurnStart() {
      const h = this.h, hc = this.hc;
      this.turn = { action: 1, bonus: 1, attacksLeft: 0, once: {}, sneak: false, surge: false, bonusAttack: false, attacked: false };
      hc.dodge = false;
      hc.reckless = false;
      hc.shieldSpell = false;
      this.reactionUsed = false;
      // encerra efeitos que duram "até o início do seu próximo turno"
      for (const e of this.enemies) {
        delete e.cond.lento; delete e.cond.empurrado; delete e.cond.atordoado;
        if (e.cond.enfraquecido && e.cond.enfraquecido.src === 'hero') delete e.cond.enfraquecido;
        if (e.cond.atormentado && e.cond.atormentado.turns-- <= 0) delete e.cond.atormentado;
      }
      if (hc.cond.caido) { delete hc.cond.caido; this.say(`${h.name} se levanta.`, 'sys'); }
      if (hc.innate > 0) hc.innate--;
      // subclasses: efeitos que agem no começo do seu turno e contagem dos efeitos temporários
      hc.flareRound = false; hc.dupRound = false; hc.hitsBy = {};
      if (C.hasFx(h, 'heroicEachTurn') && h.hp > 0) h.heroic = true;
      // Força Vital (Árvore do Mundo): PV temporários para um aliado enquanto em Fúria
      if (hc.raging && C.hasFx(h, 'lifeGiving')) { const a = this.allies.find((x) => !x.down); if (a) { const x = rollDice(`${C.rageDamage(h)}d6`); a.temp = Math.max(a.temp || 0, x.total); this.say(`Força Vital: ${a.name} ganha ${x.total} PV temporários.`, 'good'); } }
      if (h.hp > 0) await this.startOfTurnSubFx();
      if (hc.sb.heroism && h.hp > 0) this.giveTemp(Math.max(1, C.mod(h, C.castAb(h))), 'Heroísmo');
      if (hc.sb.haste && h.hp > 0) this.turn.attacksLeft = 1;
      for (const k of Object.keys(hc.sb)) { if (k === 'advNext' || k === 'advD20') continue; if (--hc.sb[k] <= 0) { delete hc.sb[k]; if (k === 'dup') this.say('O duplo ilusório se desfaz.', 'sys'); } }
      if (hc.raging) { hc.rageRounds++; if (hc.rageRounds > 100) { hc.raging = false; this.say('A Fúria se esgota.', 'sys'); } }
      // inconsciente: teste de resistência contra a morte (estabilizado, espera o grupo terminar a luta)
      if (h.hp > 0) hc.stable = false;
      if (h.hp <= 0 && hc.stable) {
        if (!this.allies.some((a) => !a.down)) { this.say('Sem ninguém de pé no grupo, as criaturas perdem o interesse e vão embora…', 'sys'); return this.finish('down'); }
        this.say(`${h.name} está estabilizado e inconsciente. O grupo continua a luta.`, 'sys');
        await U.wait(400);
        return this.endHeroTurn(true);
      }
      if (h.hp <= 0) return this.deathSave();
      // efeitos contínuos (Raio Lunar, Guardiões Espirituais…)
      if (hc.dots.length && hc.conc) await this.tickDots();
      if (this.checkEnd()) return;
      if (INCAP.some((c) => hc.cond[c])) {
        this.say(`${h.name} está ${R.CONDITIONS[Object.keys(hc.cond).find((c) => INCAP.includes(c))]?.name || 'incapacitado'} e perde o turno.`, 'bad');
        await this.heroEndOfTurnSaves();
        return this.endHeroTurn(true);
      }
      this.P.update();
      this.P.heroTurn();
    }

    async deathSave() {
      const h = this.h;
      h.deathSaves = h.deathSaves || { s: 0, f: 0 };
      // o jogador rola o próprio teste contra a morte (botão ou tecla)
      if (this.P.awaitDeathRoll) await this.P.awaitDeathRoll({ s: h.deathSaves.s, f: h.deathSaves.f });
      const r = this.d20(C.hasFx(h, 'deathAdv'), false, true);
      let out;
      if (r.nat === 20) out = 'crit';
      else if (r.nat === 1) out = 'fumble';
      else out = r.nat >= 10 ? 'success' : 'fail';
      await this.P.rollD20({ who: 'hero', label: 'Teste contra a Morte', rolls: r.rolls, nat: r.nat, bonus: 0, total: r.nat, dc: 10, outcome: out === 'crit' ? 'crit' : out === 'success' ? 'success' : 'fail', kind: 'death' });
      if (out === 'crit') {
        h.hp = 1; h.deathSaves = { s: 0, f: 0 };
        this.say(`20 natural! ${h.name} recobra a consciência com 1 PV!`, 'good');
        this.P.update();
        this.P.heroTurn();
        return;
      }
      if (out === 'success') h.deathSaves.s++;
      if (out === 'fail') h.deathSaves.f++;
      if (out === 'fumble') h.deathSaves.f += 2;
      h.deathSaves.f = Math.min(3, h.deathSaves.f);
      this.say(`Teste contra a morte: ${h.deathSaves.s} sucesso(s), ${h.deathSaves.f} falha(s).`, out === 'success' ? 'info' : 'bad');
      this.P.update();
      if (h.deathSaves.f >= 3) return this.finish('dead');
      if (h.deathSaves.s >= 3) {
        // com companheiros de pé, a luta continua; o herói estabilizado não faz mais testes
        if (this.allies.some((a) => !a.down)) { this.hc.stable = true; h.deathSaves = { s: 0, f: 0 }; this.say(`${h.name} se estabiliza. O grupo continua lutando!`, 'sys'); await U.wait(400); return this.endHeroTurn(true); }
        this.say(`${h.name} se estabiliza. As criaturas perdem o interesse e vão embora…`, 'sys');
        return this.finish('down');
      }
      await U.wait(500);
      return this.endHeroTurn(true);
    }

    async endHeroTurn(skipSaves) {
      if (this.over) return;
      if (!skipSaves) await this.heroEndOfTurnSaves();
      // Revelação Celestial: Radiância Interior no fim do turno, Mortalha expira, a transformação dura 1 minuto (10 rodadas)
      const hc0 = this.hc;
      if (hc0.revelation) {
        if (hc0.revelation === 'radiancia' && this.h.hp > 0) for (const e of this.alive()) { this.say(`Radiância Interior: ${e.name} sofre ${C.pb(this.h)} de dano Radiante.`, 'spell'); if (await this.damageEnemy(e, [{ amount: C.pb(this.h), type: 'radiante' }], {})) this.onKill(e); if (this.over) return; }
        if (--hc0.revelationRounds <= 0) { hc0.revelation = false; this.say('A Revelação Celestial termina.', 'sys'); }
      }
      for (const e of this.enemies) if (e.cond.amedrontado && e.cond.amedrontado.src === 'mortalha' && this.round >= e.cond.amedrontado.until) delete e.cond.amedrontado;
      if (C.hasFx(this.h, 'selfRestore') && this.h.hp > 0) for (const c of ['adormecido', 'amedrontado', 'envenenado']) if (this.hc.cond[c]) { delete this.hc.cond[c]; this.say(`Autorrestauração: ${R.CONDITIONS[c].name} termina.`, 'good'); }
      this.P.lock();
      // fim do turno: alvos atormentados expiram, ações lendárias
      const boss = this.alive().find((e) => e.def.legendary && !INCAP.some((c) => e.cond[c]));
      if (boss && this.h.hp > 0) await this.legendary(boss);
      if (!this.over) await this.next();
    }

    async heroEndOfTurnSaves() {
      const hc = this.hc;
      for (const c of ['amedrontado', 'contido', 'paralisado', 'adormecido', 'envenenado', 'agarrado', 'cego']) {
        const cd = hc.cond[c];
        if (!cd || !cd.save) continue;
        if (cd.turns !== undefined && --cd.turns <= 0) { delete hc.cond[c]; this.say(`${R.CONDITIONS[c].name} termina.`, 'good'); continue; }
        const ok = await this.heroSave(cd.save, cd.dc, `Encerrar ${R.CONDITIONS[c].name}`);
        if (ok) { delete hc.cond[c]; this.say(`${this.h.name} se livra: ${R.CONDITIONS[c].name}.`, 'good'); }
      }
    }

    // ------------------------------------------------------------ testes do herói
    async heroSave(ab, dc, label, opts = {}) {
      const h = this.h, hc = this.hc;
      let adv = false, dis = false;
      if (ab === 'des' && (hc.dodge || C.has(h, 'sentido_perigo'))) adv = true;
      if (['int', 'sab', 'car'].includes(ab) && C.species(h).hooks.advMentalSaves) adv = true;
      if (ab === 'for' && hc.raging) adv = true;
      if (opts.poison && (C.species(h).hooks.advVsPoison)) adv = true;
      if (opts.fear && C.species(h).hooks.advVsFear) adv = true;
      if (opts.charm && h.species === 'elfo') adv = true;
      if (ab === 'des' && hc.cond.contido) dis = true;
      if (C.fxArr(h, 'saveAdv').includes(ab) || hc.sb.zeal) adv = true;
      const advVs = C.fxArr(h, 'saveAdvVs');
      if ((opts.fear && advVs.includes('fear')) || (opts.charm && advVs.includes('charm'))) adv = true;
      if (hc.sb.advD20) { adv = true; delete hc.sb.advD20; }
      if (opts.conc && C.hasFx(h, 'concAdv')) adv = true;
      let bonus = C.saveBonus(h, ab);
      let blessDie = 0;
      if (hc.blessed) blessDie = U.die(4);
      const r = this.d20(adv, dis, true);
      let total = r.nat + bonus + blessDie;
      if ((r.nat === 1 && !(ab === 'con' && opts.death))) { /* falha natural não é automática em TR (apenas testes de morte) */ }
      let ok = total >= dc;
      await this.P.rollD20({ who: 'hero', label: `TR de ${R.AB[ab].name}${label ? ' · ' + label : ''}`, rolls: r.rolls, nat: r.nat, bonus: bonus + blessDie, total, dc, adv: r.mode === 'adv', dis: r.mode === 'dis', outcome: ok ? 'success' : 'fail', kind: 'save' });
      // Presságio (Adivinho): troca o d20 por um número visto no início do combate
      if (!ok && hc.portent.length) {
        const hi = Math.max(...hc.portent);
        if (hi + bonus + blessDie >= dc) {
          const ch = await this.P.ask({ title: 'Presságio', text: `Você falhou (${total} vs CD ${dc}). Trocar o d20 pelo Presságio ${hi}?`, options: [{ id: 'yes', label: `Usar Presságio (${hi})` }, { id: 'no', label: 'Guardar' }] });
          if (ch === 'yes') { hc.portent.splice(hc.portent.indexOf(hi), 1); total = hi + bonus + blessDie; ok = true; this.say(`Presságio! O destino já estava escrito: ${total} → sucesso.`, 'good'); }
        }
      }
      // Foco Fanático (Zelote): uma vez por Fúria, rerrola somando o dano de Fúria
      if (!ok && hc.raging && C.hasFx(h, 'fanaticalFocus') && !hc.fanatic) {
        hc.fanatic = true;
        const r2 = U.die(20);
        total = r2 + bonus + blessDie + C.rageDamage(h); ok = total >= dc;
        this.say(`Foco Fanático: nova rolagem ${r2} + ${bonus + blessDie + C.rageDamage(h)} = ${total} (${ok ? 'sucesso' : 'falha'}).`, ok ? 'good' : 'bad');
      }
      // Presságio Cósmico · Bem (Círculo das Estrelas)
      if (!ok && h.omen === 'bem' && C.hasFx(h, 'cosmicOmen') && C.res(h, 'presagio_cosmico') > 0 && !this.reactionUsed && dc - total <= 6) {
        C.spend(h, 'presagio_cosmico'); this.reactionUsed = true;
        const x = U.die(6); total += x; ok = total >= dc;
        this.say(`Presságio Cósmico (Bem): +${x} → ${total} (${ok ? 'sucesso' : 'falha'}).`, ok ? 'good' : 'bad');
      }
      // Sorte do Próprio Sombrio (Ínfero): +1d10 (CAR vezes por Descanso Longo)
      if (!ok && C.hasFx(h, 'saveRescue') && C.res(h, 'sorte_sombria') > 0 && dc - total <= 10) {
        C.spend(h, 'sorte_sombria');
        const x = U.die(10);
        total += x; ok = total >= dc;
        this.say(`Sorte do Próprio Sombrio: +${x} → ${total} (${ok ? 'sucesso' : 'falha'}).`, ok ? 'good' : 'bad');
      }
      // Matador de Magos: Mente Protegida
      if (!ok && ['int', 'sab', 'car'].includes(ab) && C.hasFx(h, 'guardedMind') && C.res(h, 'mente_protegida') > 0) { C.spend(h, 'mente_protegida'); ok = true; this.say('Mente Protegida: você transforma a falha em sucesso!', 'good'); }
      if (!ok && C.res(h, 'indomavel') > 0 && dc - total <= h.level + 10) {
        C.spend(h, 'indomavel');
        const r2 = U.die(20);
        total = r2 + bonus + h.level;
        ok = total >= dc;
        this.say(`Indomável! Nova rolagem: ${r2} + ${bonus + h.level} = ${total} → ${ok ? 'sucesso' : 'falha'}.`, ok ? 'good' : 'bad');
      }
      return ok;
    }

    async skillCheck(sk, dc, label, advX) {
      const h = this.h, hc = this.hc;
      const bonus = C.skillBonus(h, sk);
      // Forma Grande (Golias): Vantagem em testes de Força
      const adv = this.useLuck || advX || !!hc.sb.advD20 || (hc.large && R.SKILLS[sk] && R.SKILLS[sk].ab === 'for');
      delete hc.sb.advD20;
      const r = this.d20(adv, hc.cond.envenenado || hc.cond.amedrontado, true);
      if (C.hasFx(h, 'reliableTalent') && (h.skills || []).includes(sk) && r.nat < 10) r.nat = 10;
      let total = r.nat + bonus;
      let ok = total >= dc;
      await this.P.rollD20({ who: 'hero', label: `${R.SKILLS[sk].name}${label ? ' · ' + label : ''}`, rolls: r.rolls, nat: r.nat, bonus, total, dc, adv: r.mode === 'adv', dis: r.mode === 'dis', outcome: ok ? 'success' : 'fail', kind: 'check' });
      if (!ok && C.hasFx(h, 'tacticalMind') && C.res(h, 'folego') > 0) { const x = U.die(10); if (total + x >= dc) { C.spend(h, 'folego'); total += x; ok = true; this.say(`Mente Tática: +${x} → ${total} (sucesso).`, 'good'); } }
      return { ok, total };
    }

    // ------------------------------------------------------------ vantagem/desvantagem do herói
    heroAttackMods(target, prof, isSpell) {
      const hc = this.hc, h = this.h, tc = target.cond;
      const adv = [], dis = [];
      const melee = !prof.ranged;
      if (tc.caido && (melee || !C.hasFx(h, 'sharpshooter'))) (melee ? adv : dis).push(melee ? 'alvo Caído' : 'alvo Caído (à distância)');
      if (tc.contido) adv.push('alvo Contido');
      if (tc.paralisado) adv.push('alvo Paralisado');
      if (tc.atordoado) adv.push('alvo Atordoado');
      if (tc.adormecido) adv.push('alvo Incapacitado');
      if (tc.cego) adv.push('alvo Cego');
      if (tc.iluminado) adv.push('Raio Guia');
      if (tc.iluminado_conc) adv.push('Fogo das Fadas');
      if (tc.atormentado) adv.push('Atormentar');
      if (hc.hidden) adv.push('escondido');
      if (hc.reckless && !isSpell && !prof.ranged && prof.ability === 'for' && !hc.brutalNext) adv.push('Ataque Descuidado');
      if (hc.steady) adv.push('Mira Firme');
      if (isSpell && hc.innate > 0) adv.push('Feitiçaria Inata');
      if (this.round === 1 && C.hasFx(h, 'firstRoundAdv') && !target.acted) adv.push('Assassinar');
      if (hc.clair && hc.clair === target.uid) adv.push('Combatente Clarividente');
      if (hc.sb.dup) adv.push('Duplicidade');
      if (hc.sb.zeal) adv.push('Presença Zelosa');
      if (hc.sb.advNext || hc.sb.advD20) adv.push('Vantagem preparada');
      if (hc.vow && hc.vow === target.uid) adv.push('Voto de Inimizade');
      if (!isSpell && !hc.firstAttackDone) {
        const w = C.equipped(h, 'weapon');
        if (w && w.def.passive && (w.def.passive.kind === 'firstAdv' || w.def.passive.adv)) adv.push(w.def.passive.name);
      }
      if (this.useLuck) adv.push('Sorte');
      if (hc.cond.envenenado) dis.push('Envenenado');
      if (hc.cond.amedrontado) dis.push('Amedrontado');
      if (hc.cond.contido) dis.push('Contido');
      if (hc.cond.cego && !C.hasFx(h, 'blindFight')) dis.push('Cego');
      if (!isSpell && prof.heavy) {
        const need = prof.ranged ? C.score(h, 'des') : C.score(h, 'for');
        if (need < 13) dis.push('arma Pesada (atributo < 13)');
      }
      if (h.species === 'pequenino' || h.species === 'gnomo') { if (!isSpell && prof.heavy && !dis.includes('arma Pesada (atributo < 13)')) dis.push('arma Pesada para criatura Pequena'); }
      return { adv, dis };
    }

    // ------------------------------------------------------------ ações do herói
    canAct() { return !this.over && !this.busy && this.turn && this.h.hp > 0; }

    async heroAttack(targetUid, opts = {}) {
      if (!this.canAct()) return;
      const t = this.turn;
      if (t.attacksLeft <= 0) {
        if (t.action <= 0) return;
        t.action--;
        t.attacksLeft = C.attacksPerAction(this.h);
      }
      t.attacksLeft--;
      this.busy = true;
      try {
        const target = this.enemy(targetUid) || this.alive()[0];
        if (opts.breath) await this.breathWeapon(target);
        else await this.weaponAttack(target, opts);
      } finally { this.busy = false; }
      this.afterHeroAction();
    }

    async weaponAttack(target, opts = {}) {
      const h = this.h, hc = this.hc, t = this.turn;
      let prof = C.attackProfile(h, { unarmed: opts.unarmed });
      if (opts.override) prof = Object.assign({}, prof, { dice: opts.override.dice, type: opts.override.type || prof.type, name: opts.override.name || prof.name, mastery: null });
      // Bordão Místico e Golpe Certeiro usam o atributo de conjuração
      const shill = hc.sb.shillelagh && ['bordao', 'clava'].includes(prof.base);
      if (shill || opts.castAb) {
        const cm = C.mod(h, C.castAb(h));
        if (cm > prof.abMod) prof = Object.assign({}, prof, { toHit: prof.toHit - prof.abMod + cm + (prof.proficient ? 0 : C.pb(h)), dmgMod: prof.dmgMod - prof.abMod + cm, abMod: cm });
        if (shill) prof = Object.assign({}, prof, { dice: h.level >= 5 ? '1d10' : '1d8', name: prof.name + ' (Bordão Místico)' });
      }
      if (hc.sb.magicWeapon || hc.sb.elemWeapon) prof = Object.assign({}, prof, { toHit: prof.toHit + 1 });
      if (opts.reckless && C.has(h, 'ataque_descuidado') && !t.attacked) hc.reckless = true;
      const { adv, dis } = this.heroAttackMods(target, prof, false);
      if (opts.sig && opts.sig.adv) adv.push(opts.sig.name);
      const r = this.d20(adv.length > 0, dis.length > 0, true);
      this.useLuck && (C.spend(h, 'sorte'), (this.useLuck = false));
      let bonus = prof.toHit;
      const brutal = !!(hc.brutalNext && hc.reckless && !prof.ranged && prof.ability === 'for');
      if (brutal) hc.brutalNext = false;
      if (hc.sacred) bonus += Math.max(1, C.mod(h, 'car'));
      let blessDie = hc.blessed ? U.die(4) : 0;
      const ac = target.ac;
      let total = r.nat + bonus + blessDie;
      const autoCrit = (target.cond.paralisado || target.cond.adormecido) && !prof.ranged;
      let crit = r.nat >= prof.crit;
      let hit = r.nat !== 1 && (crit || total >= ac);
      if (hit && autoCrit) crit = true;
      if (hit && opts.sig && opts.sig.autoCrit) crit = true;
      t.attacked = true;
      hc.firstAttackDone = true;
      const hiddenBefore = hc.hidden;
      if (hc.hidden && !hc.sb.ginvis) hc.hidden = 0;
      if (hc.steady) hc.steady = false;
      delete hc.sb.advNext; delete hc.sb.advD20;
      if (target.cond.iluminado) delete target.cond.iluminado;
      if (target.cond.atormentado) delete target.cond.atormentado;
      await this.P.rollD20({ who: 'hero', label: `${prof.name} → ${target.name}`, rolls: r.rolls, nat: r.nat, bonus: bonus + blessDie, total, ac, adv: r.mode === 'adv', dis: r.mode === 'dis', advWhy: adv, disWhy: dis, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
      // Inspiração Heroica: rolar de novo após errar
      if (!hit && h.heroic) {
        const ch = await this.P.ask({ title: 'Inspiração Heroica', text: `Você errou (${total} vs CA ${ac}). Gastar sua Inspiração Heroica para rolar o d20 de novo?`, options: [{ id: 'yes', label: 'Rolar de novo ✦' }, { id: 'no', label: 'Aceitar' }] });
        if (ch === 'yes') {
          h.heroic = false;
          const r2 = this.d20(false, false, true);
          total = r2.nat + bonus + blessDie;
          crit = r2.nat >= prof.crit;
          hit = r2.nat !== 1 && (crit || total >= ac);
          if (hit && autoCrit) crit = true;
          await this.P.rollD20({ who: 'hero', label: 'Inspiração Heroica', rolls: r2.rolls, nat: r2.nat, bonus: bonus + blessDie, total, ac, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
        }
      }
      // subclasses: Ataque Guiado, Ataque Preciso, Golpes Teleguiados
      if (!hit && r.nat !== 1) { const fix = await this.missRescue(total, ac); if (fix) { total += fix; hit = total >= ac; } }
      await this.P.anim({ actor: 'hero', target: target.uid, kind: prof.ranged ? 'ranged' : 'melee', wtype: prof.weapon ? prof.weapon.def.type : 'unarmed' });
      if (!hit) {
        this.say(`${prof.name}: ${total} contra CA ${ac} — errou.`, 'miss');
        this.P.float(target.uid, 'Errou', 'miss');
        if (prof.mastery === 'raspao' && prof.abMod > 0) {
          this.say(`Maestria Raspão: ${prof.abMod} de dano mesmo errando.`, 'info');
          await this.damageEnemy(target, [{ amount: prof.abMod, type: prof.type }], {});
        }
        return false;
      }
      if (crit) h.stats_crit = (h.stats_crit || 0) + 1;
      await this.resolveWeaponHit(target, prof, crit, { r, offhand: opts.offhand, trueStrike: opts.trueStrike, brutal, hiddenBefore, sig: opts.sig });
      return true;
    }

    // o alvo resiste (ou é imune) a este tipo de dano?
    resists(e, type) { return (e.def.immune || []).includes(type) || (e.def.resist || []).includes(type); }
    // melhor tipo de dano entre as opções contra um alvo (vulnerável > normal > resistente)
    bestType(e, current, options) {
      const score = (t) => ((e.def.vuln || []).includes(t) ? 2 : (e.def.immune || []).includes(t) ? -2 : (e.def.resist || []).includes(t) ? -1 : 0);
      let best = current, bs = score(current);
      for (const o of options) { const s = score(o); if (s > bs) { best = o; bs = s; } }
      return best;
    }
    // tipo elemental que menos inimigos resistem (Explosão Elemental)
    bestElement() {
      const opts = ['acido', 'frio', 'fogo', 'eletrico', 'trovejante'];
      let best = 'fogo', bs = -99;
      for (const t of opts) { const s = this.alive().reduce((a, e) => a + ((e.def.vuln || []).includes(t) ? 2 : (e.def.immune || []).includes(t) ? -3 : (e.def.resist || []).includes(t) ? -1 : 0), 0); if (s > bs) { best = t; bs = s; } }
      return best;
    }

    async resolveWeaponHit(target, prof, crit, ctx = {}, cleave = false) {
      const h = this.h, hc = this.hc, t = this.turn;
      const parts = [];
      // dano da arma (Atacante Selvagem: rola duas vezes 1×/turno)
      let main = rollDice(prof.dice, crit, { gwf: prof.gwf });
      if (C.hasFeat(h, 'atacante_selvagem') && !t.once.savage && main.vals.length) {
        const alt = rollDice(prof.dice, crit, { gwf: prof.gwf });
        if (alt.total > main.total) main = alt;
        t.once.savage = true;
      }
      let mod = cleave || (ctx.offhand && !C.hasFx(h, 'twf')) ? Math.min(0, prof.dmgMod) : prof.dmgMod;
      if (hc.raging && prof.ability === 'for' && !prof.ranged) mod += C.rageDamage(h);
      if (hc.sb.magicWeapon) mod += 1;
      const ua = prof.base === 'desarmado' || (h.cls === 'monge' && C.isMonkWeapon(h, prof.base));
      let mainType = prof.type;
      if (hc.wild && C.hasFx(h, 'moonRadiant')) mainType = this.bestType(target, mainType, ['radiante']);
      if (ua && hc.sb.elem && C.hasFx(h, 'elemAttune')) mainType = this.bestType(target, mainType, ['acido', 'frio', 'fogo', 'eletrico', 'trovejante']);
      if (ua && C.hasFx(h, 'empoweredStrikes')) mainType = this.bestType(target, mainType, ['energia']);
      if (mainType !== prof.type) this.say(`Dano ${dmgName(mainType)} em vez de ${dmgName(prof.type)}.`, 'info');
      parts.push({ amount: Math.max(1, main.total + mod), type: mainType, dice: main, label: prof.name, mod });
      const extraRolls = [];
      const addExtra = (dice, type, label) => {
        const x = rollDice(dice, crit);
        parts.push({ amount: x.total, type, dice: x, label });
        extraRolls.push(label);
      };
      // Ataque Furtivo
      const advNow = ctx.r && ctx.r.mode === 'adv';
      if (h.cls === 'ladino' && !t.sneak && prof.finesseOrRanged && advNow) {
        t.sneak = true;
        let nd = C.sneakDice(h);
        const cs = C.hasFx(h, 'cunningStrike') ? await this.cunningStrike(target, nd, ctx) : null;
        if (cs) nd -= cs.cost;
        if (nd > 0) addExtra(`${nd}d6`, prof.type, 'Ataque Furtivo');
        if (cs && cs.after) target.pendingCS = cs.after;
        if (C.hasFx(h, 'assassinate') && this.round === 1) parts.push({ amount: h.level, type: prof.type, label: 'Assassinar' });
      }
      if (ctx.sig) addExtra(ctx.sig.dice, ctx.sig.type, ctx.sig.name);
      if (ctx.brutal) { addExtra('1d10', prof.type, 'Golpe Brutal'); target.cond.empurrado = { src: 'hero' }; this.say(`Golpe Brutal · Golpe Contundente: ${target.name} é empurrado.`, 'info'); }
      // Frenesi
      if (C.has(h, 'frenesi') && hc.raging && hc.reckless && !t.once.frenzy) { addExtra(`${C.rageDamage(h)}d6`, prof.type, 'Frenesi'); t.once.frenzy = true; }
      // Marca do Caçador / Maldição
      if (hc.mark && hc.mark.uid === target.uid) addExtra('1d6', hc.mark.type, hc.mark.name);
      // Matador de Colossos
      if (C.has(h, 'presa_cacador') && !t.once.colossus && target.hp < target.maxHp) { addExtra('1d8', prof.type, 'Matador de Colossos'); t.once.colossus = true; }
      // Golpes Abençoados
      if (C.has(h, 'golpes_abencoados') && !t.once.blessed) { addExtra('1d8', 'radiante', 'Golpes Abençoados'); t.once.blessed = true; }
      // magias que reforçam a arma
      if (hc.sb.divineFavor) addExtra('1d4', 'radiante', 'Favor Divino');
      if (hc.sb.mantle) addExtra('1d4', 'radiante', 'Manto do Cruzado');
      if (hc.sb.shroud) addExtra('1d8', 'radiante', 'Mortalha Espiritual');
      if (hc.sb.elemWeapon) addExtra('1d4', 'fogo', 'Arma Elemental');
      if (hc.sb.enlarge) addExtra('1d4', prof.type, 'Aumentar');
      if (ctx.trueStrike && h.level >= 5) addExtra(h.level >= 11 ? '2d6' : '1d6', 'radiante', 'Golpe Certeiro');
      // talentos: Mestre de Armas Grandes, Perfurador
      if (prof.heavy && !cleave && C.hasFx(h, 'heavyPb') && !t.once.gwm) { parts.push({ amount: C.pb(h), type: prof.type, label: 'Mestre de Armas Grandes' }); t.once.gwm = true; }
      if (crit && prof.type === 'perfurante' && C.hasFx(h, 'piercer')) { const x = rollDice(`1d${U.parseDice(prof.dice).s}`); parts.push({ amount: x.total, type: prof.type, dice: x, label: 'Perfurador' }); }
      // subclasses: dano extra condicional
      const unarmedLike = prof.base === 'desarmado' || (h.cls === 'monge' && C.isMonkWeapon(h, prof.base));
      C.fxVals(h, 'hitDmg').forEach((d, i) => {
        const w2 = d.when || {};
        if (w2.raging && !hc.raging) return;
        if (w2.melee && prof.ranged) return;
        if (w2.ranged && !prof.ranged) return;
        if (w2.finesse && !(prof.finesseOrRanged || unarmedLike)) return;
        if (w2.hurt && !(target.hp < target.maxHp)) return;
        const key = 'hd' + i;
        if (d.once && t.once[key]) return;
        t.once[key] = true;
        let ty = d.type && d.type !== 'arma' ? d.type : prof.type;
        if (d.alt) ty = this.bestType(target, ty, [d.alt]);
        addExtra(d.dice + (d.halfLvl ? `+${Math.floor(h.level / 2)}` : ''), ty, d.label || C.subFeatures(h).find((f) => f[4] && f[4].hitDmg === d)?.[2] || 'Subclasse');
      });
      // Golpe Terrível (Perseguidor Sombrio): +2d6 Psíquico, 1×/turno, SAB vezes por Descanso Longo
      const ds = C.fxVals(h, 'dreadfulStrike')[0];
      if (ds && !t.once.dread && C.res(h, 'golpe_terrivel') > 0) { C.spend(h, 'golpe_terrivel'); t.once.dread = true; addExtra(ds, 'psiquico', 'Golpe Terrível'); }
      // Revelação Celestial
      if (hc.revelation && !t.once.revelation) { parts.push({ amount: C.pb(h), type: hc.revelation === 'mortalha' ? 'necrotico' : 'radiante', label: 'Revelação Celestial' }); t.once.revelation = true; }
      // Golias (Fogo)
      const gi = C.giant(h);
      if (gi && C.res(h, 'gigante') > 0 && !t.once.giant && ['fogo', 'gelo', 'colina'].includes(gi.id)) {
        const big = ['Enorme', 'Imenso'].includes(target.def.size);
        if (gi.id === 'fogo') { C.spend(h, 'gigante'); t.once.giant = true; addExtra('1d10', 'fogo', 'Queimadura do Fogo'); }
        else if (gi.id === 'gelo') { C.spend(h, 'gigante'); t.once.giant = true; addExtra('1d6', 'frio', 'Frio do Gelo'); target.cond.lento = { src: 'hero' }; }
        else if (gi.id === 'colina' && !big && !(target.def.condImm || []).includes('caido') && !target.cond.caido) { C.spend(h, 'gigante'); t.once.giant = true; target.cond.caido = { src: 'hero' }; this.say(`Tombo da Colina: ${target.name} cai!`, 'good'); }
      }
      // passivos de arma
      const w = prof.weapon;
      if (w && w.def.passive) {
        const p = w.def.passive, i = w.refine - 1;
        if (p.kind === 'extra' && !t.once.passive) {
          let okp = true;
          if (p.vs && !p.vs.includes(target.def.type)) okp = false;
          if (p.hurt && !(target.hp < target.maxHp)) okp = false;
          if (p.first && this.hc.firstHitDone) okp = false;
          if (okp) { addExtra(p.vals[i], p.dtype || prof.type, p.name); t.once.passive = true; }
        }
        if (p.kind === 'firstAdv' && !this.hc.firstHitDone && p.extraVals) {
          const xv = p.extraVals[i];
          if (typeof xv === 'number') { if (xv) parts.push({ amount: xv, type: p.dtype || prof.type, label: p.name }); }
          else addExtra(xv, p.dtype || prof.type, p.name);
        }
        if (crit && p.kind === 'critExtra') addExtra(p.vals[i], prof.type, p.name);
        if (crit && p.critDice) addExtra(p.critDice[i], p.dtype || prof.type, p.name);
        if (crit && p.kind === 'critHeal' && !t.once.critHeal) {
          const heal = rollDice(p.vals[i]).total;
          t.once.critHeal = true;
          this.healHero(heal, p.name);
        }
      }
      this.hc.firstHitDone = true;
      const tech = await this.hitTechnique(target, prof, unarmedLike);
      if (tech) { if (tech.dice) addExtra(tech.dice, tech.type || prof.type, tech.label); if (tech.after) target.pendingTech = tech.after; }
      // Golpe Divino (Paladino) — perguntar
      if (!prof.ranged && this.turn.bonus > 0) {
        const smites = this.smiteOptions();
        if (smites.length) {
          const ch = await this.P.ask({ title: 'Golpe Divino', text: `Você acertou ${target.name}! Gastar a Ação Bônus para canalizar um Golpe?`, options: smites.concat([{ id: 'no', label: 'Não usar' }]) });
          if (ch && ch !== 'no') {
            const [spellId, lvlStr] = ch.split('@');
            const lvl = Number(lvlStr);
            const sp = S.SPELLS[spellId];
            if (lvl === 0) C.spend(h, 'golpe_gratis'); else this.useSlot(lvl);
            this.turn.bonus--;
            let dice = U.parseDice(sp.dmg);
            let n = dice.n + (sp.up ? Math.max(0, (lvl || sp.level) - sp.level) : 0);
            if (spellId === 'golpe_divino' && ['morto-vivo', 'corruptor'].includes(target.def.type)) n += 1;
            addExtra(`${n}d${dice.s}`, sp.type, sp.name);
            if (sp.cond && sp.condSave) target.pendingCond = { cond: sp.cond, save: sp.condSave, dc: C.spellDC(h, sp) };
            else if (sp.cond) target.cond[sp.cond] = { src: 'hero' };
            if (sp.later) target.later = { dice: sp.later, type: sp.type, name: sp.name };
            if (C.hasFx(h, 'smiteTemp') && spellId === 'golpe_divino' && C.res(h, 'canalizar') > 0) {
              const gi = await this.P.ask({ title: 'Golpe Inspirador', text: 'Gastar Canalizar Divindade para ganhar 2d8 + nível PV temporários?', options: [{ id: 'yes', label: 'Inspirar (Canalizar Divindade)' }, { id: 'no', label: 'Não' }] });
              if (gi === 'yes') { C.spend(h, 'canalizar'); this.giveTemp(rollDice('2d8').total + h.level, 'Golpe Inspirador'); }
            }
          }
        }
      }
      // Golpe Atordoante (Monge)
      let stun = false;
      if (C.has(h, 'golpe_atordoante') && !t.once.stun && C.res(h, 'foco') > 0 && !prof.ranged && (prof.base === 'desarmado' || C.isMonkWeapon(h, prof.base)) && !target.cond.atordoado) {
        const ch = await this.P.ask({ title: 'Golpe Atordoante', text: `Gastar 1 Ponto de Foco para tentar Atordoar ${target.name}?`, options: [{ id: 'yes', label: 'Atordoar (1 Foco)' }, { id: 'no', label: 'Não' }] });
        if (ch === 'yes') { C.spend(h, 'foco'); t.once.stun = true; stun = true; }
      }
      const total = parts.reduce((a, p) => a + p.amount, 0);
      await this.P.rollDamage({ who: 'hero', label: crit ? 'CRÍTICO! Dano dobrado' : 'Dano', parts, total, crit });
      const killed = await this.damageEnemy(target, parts, { crit, weapon: true });
      // efeitos de maestria
      if (!killed && prof.mastery) await this.applyMastery(prof, target, cleave);
      else if (killed && prof.mastery === 'trespassar' && !cleave && !t.once.cleave) await this.applyMastery(prof, target, cleave);
      if (!killed && stun) {
        const ok = this.enemySave(target, 'con', 8 + C.mod(h, 'sab') + C.pb(h));
        await this.showEnemySave(target, 'con', ok, 8 + C.mod(h, 'sab') + C.pb(h), 'Golpe Atordoante');
        if (!ok.ok) { target.cond.atordoado = { src: 'hero' }; this.say(`${target.name} fica Atordoado!`, 'good'); }
        else { target.cond.iluminado = { src: 'hero' }; this.say(`${target.name} resiste, mas fica vulnerável (próximo ataque com Vantagem).`, 'info'); }
      }
      if (!killed && target.pendingTech) {
        const pt = target.pendingTech; delete target.pendingTech;
        let fail = true;
        if (!pt.auto) { const ok = this.enemySave(target, pt.save, pt.dc); await this.showEnemySave(target, pt.save, ok, pt.dc, pt.name); fail = !ok.ok; }
        if (fail && !(target.def.condImm || []).includes(pt.cond)) { target.cond[pt.cond] = { src: 'hero', save: pt.save, dc: pt.dc }; this.say(`${target.name}: ${R.CONDITIONS[pt.cond] ? R.CONDITIONS[pt.cond].name : pt.cond}!`, 'good'); }
      }
      // Poder do Carneiro (Coração Selvagem)
      if (!killed && hc.raging && !prof.ranged && !t.once.rageCond) {
        const rc = C.fxVals(h, 'rageHitCond')[0];
        if (rc && !target.cond[rc.cond]) {
          t.once.rageCond = true;
          const dc = 8 + C.mod(h, 'for') + C.pb(h);
          const ok = this.enemySave(target, rc.save, dc);
          await this.showEnemySave(target, rc.save, ok, dc, 'Poder do Carneiro');
          if (!ok.ok) { target.cond[rc.cond] = { src: 'hero' }; this.say(`${target.name} é derrubado!`, 'good'); }
        }
      }
      if (!killed && C.hasFx(h, 'mysticStrike')) target.cond.mistico = { src: 'hero' };
      // Raízes Golpeadoras (Árvore do Mundo): Maestria Derrubar extra com armas Pesadas ou Versáteis
      if (!killed && C.hasFx(h, 'batteringRoots') && !prof.ranged && (prof.heavy || (R.WEAPONS[prof.base] || {}).vers) && prof.mastery !== 'derrubar' && !target.cond.caido && !(target.def.condImm || []).includes('caido')) {
        const dc = 8 + prof.abMod + C.pb(h);
        const ok = this.enemySave(target, 'con', dc);
        await this.showEnemySave(target, 'con', ok, dc, 'Raízes Golpeadoras');
        if (!ok.ok) { target.cond.caido = { src: 'hero' }; this.say(`Raízes Golpeadoras: ${target.name} cai!`, 'good'); }
      }
      if (!killed && target.pendingCS) {
        const pc = target.pendingCS; delete target.pendingCS;
        if (!(target.def.condImm || []).includes(pc.cond)) {
          const ok = this.enemySave(target, pc.save, pc.dc);
          await this.showEnemySave(target, pc.save, ok, pc.dc, pc.name);
          if (!ok.ok) { target.cond[pc.cond] = { src: 'hero', save: pc.save, dc: pc.dc }; this.say(`${pc.name}: ${target.name} fica ${R.CONDITIONS[pc.cond].name}!`, 'good'); }
        }
      }
      if (!killed && prof.type === 'concussao' && C.hasFx(h, 'crusher') && !t.once.crush) { t.once.crush = true; target.cond.empurrado = { src: 'hero' }; if (crit) target.cond.iluminado = { src: 'hero' }; this.say(`Esmagador: ${target.name} é empurrado${crit ? ' e fica exposto (Vantagem)' : ''}.`, 'info'); }
      if (!killed && prof.type === 'cortante' && C.hasFx(h, 'slasher') && !t.once.slash) { t.once.slash = true; target.cond.lento = { src: 'hero' }; if (crit) target.cond.enfraquecido = { src: 'hero' }; this.say(`Retalhador: ${target.name} fica Lento${crit ? ' e Enfraquecido' : ''}.`, 'info'); }
      if (!killed && target.pendingCond) {
        const pc = target.pendingCond; delete target.pendingCond;
        const ok = this.enemySave(target, pc.save, pc.dc);
        await this.showEnemySave(target, pc.save, ok, pc.dc, R.CONDITIONS[pc.cond].name);
        if (!ok.ok) { target.cond[pc.cond] = { save: pc.save, dc: pc.dc, src: 'hero' }; this.say(`${target.name}: ${R.CONDITIONS[pc.cond].name}!`, 'good'); }
      }
      // habilidade única da arma ★5: condição, dreno e PV temporários
      if (ctx.sig) {
        const sg = ctx.sig, dealt = parts.reduce((a, q) => a + q.amount, 0);
        if (!killed && sg.cond && !(target.def.condImm || []).includes(sg.cond)) {
          const dc = this.sigDC('weapon'), ok = this.enemySave(target, sg.save, dc);
          await this.showEnemySave(target, sg.save, ok, dc, sg.name);
          if (!ok.ok) { target.cond[sg.cond] = { src: 'hero', save: sg.save, dc }; this.say(`${sg.name}: ${target.name} fica ${R.CONDITIONS[sg.cond].name}!`, 'good'); }
        }
        if (sg.drain) this.healHero(Math.max(1, Math.floor(dealt * sg.drain)), sg.name);
        if (killed && sg.killTemp) this.giveTemp(sg.killTemp, sg.name);
      }
      if (killed) {
        this.onKill(target);
        const w2 = prof.weapon;
        if (w2 && w2.def.passive) {
          const p = w2.def.passive;
          if (p.kind === 'killHeal') this.healHero(rollDice(p.vals[w2.refine - 1]).total, p.name);
          if (p.killTemp) this.giveTemp(p.killTemp, p.name);
        }
      }
    }

    // Golpe Astuto (Ladino 5) e Ataque Furtivo Sorrateiro (Ladrão 9): troca d6 do Ataque Furtivo por um efeito
    async cunningStrike(target, nd, ctx) {
      const h = this.h, dc = 8 + C.mod(h, 'des') + C.pb(h);
      if (nd < 2) return null;
      const imm = (c) => (target.def.condImm || []).includes(c);
      const opts = [];
      if (!imm('envenenado')) opts.push({ id: 'poison', label: `Envenenar (−1d6 · TR Con CD ${dc} ou Envenenado)` });
      if (!imm('caido') && target.def.size !== 'Enorme' && target.def.size !== 'Imenso') opts.push({ id: 'trip', label: `Derrubar (−1d6 · TR Des CD ${dc} ou Caído)` });
      if (C.hasFx(h, 'supremeSneak') && ctx && ctx.hiddenBefore) opts.push({ id: 'stealth', label: 'Ataque Sorrateiro (−1d6 · continua escondido)' });
      if (!opts.length) return null;
      const ch = await this.P.ask({ title: 'Golpe Astuto', text: `Ataque Furtivo de ${nd}d6 em ${target.name}. Trocar 1d6 por um efeito?`, options: opts.concat([{ id: 'no', label: 'Todo o dano' }]) });
      if (ch === 'poison') return { cost: 1, after: { save: 'con', dc, cond: 'envenenado', name: 'Golpe Astuto' } };
      if (ch === 'trip') return { cost: 1, after: { save: 'des', dc, cond: 'caido', name: 'Golpe Astuto' } };
      if (ch === 'stealth') { this.hc.hidden = ctx.hiddenBefore; this.say('Ataque Sorrateiro: você continua escondido.', 'good'); return { cost: 1 }; }
      return null;
    }

    smiteOptions() {
      const h = this.h, out = [];
      if (h.cls !== 'paladino' && h.cls !== 'patrulheiro') return out;
      const known = C.knownSpells(h).filter((id) => S.SPELLS[id] && S.SPELLS[id].time === 'smite');
      const slots = C.slotsLeft(h);
      for (const id of known) {
        const sp = S.SPELLS[id];
        if (id === 'golpe_divino' && C.res(h, 'golpe_gratis') > 0) out.push({ id: `${id}@0`, label: `${sp.name} (grátis)` });
        slots.forEach((n, i) => { if (n > 0 && i + 1 >= sp.level) out.push({ id: `${id}@${i + 1}`, label: `${sp.name} · ${i + 1}º círculo` }); });
      }
      return out.slice(0, 6);
    }

    async applyMastery(prof, target, cleave) {
      const h = this.h, t = this.turn;
      const m = prof.mastery, dc = 8 + prof.abMod + C.pb(h);
      if (m === 'atormentar') { target.cond.atormentado = { src: 'hero', turns: 1 }; this.say(`Maestria Atormentar: Vantagem no próximo ataque contra ${target.name}.`, 'info'); }
      if (m === 'enfraquecer') { target.cond.enfraquecido = { src: 'hero' }; this.say(`Maestria Enfraquecer: ${target.name} terá Desvantagem no próximo ataque.`, 'info'); }
      if (m === 'lentidao') { target.cond.lento = { src: 'hero' }; this.say(`Maestria Lentidão: ${target.name} fica mais lento.`, 'info'); }
      if (m === 'empurrar') { target.cond.empurrado = { src: 'hero' }; this.say(`Maestria Empurrar: ${target.name} é empurrado 3 m.`, 'info'); }
      if (m === 'derrubar' && !target.def.condImm?.includes('caido')) {
        const ok = this.enemySave(target, 'con', dc);
        await this.showEnemySave(target, 'con', ok, dc, 'Derrubar');
        if (!ok.ok) { target.cond.caido = { src: 'hero' }; this.say(`Maestria Derrubar: ${target.name} cai!`, 'good'); }
      }
      if (m === 'trespassar' && !cleave && !t.once.cleave) {
        const other = this.alive().find((e) => e.uid !== target.uid);
        if (other) {
          t.once.cleave = true;
          this.say(`Maestria Trespassar: o golpe continua até ${other.name}!`, 'info');
          const { adv, dis } = this.heroAttackMods(other, prof, false);
          const r = this.d20(adv.length > 0, dis.length > 0, true);
          const total = r.nat + prof.toHit;
          const crit = r.nat >= prof.crit;
          const hit = r.nat !== 1 && (crit || total >= other.ac);
          await this.P.rollD20({ who: 'hero', label: `Trespassar → ${other.name}`, rolls: r.rolls, nat: r.nat, bonus: prof.toHit, total, ac: other.ac, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
          if (hit) await this.resolveWeaponHit(other, prof, crit, { r }, true);
          else this.P.float(other.uid, 'Errou', 'miss');
        }
      }
    }

    async breathWeapon(targetUid) {
      const h = this.h;
      if (C.res(h, 'sopro') <= 0) return;
      // Cone de 4,5 m ou linha de 9 m (Livro do Jogador 2024). No combate do jogo, sem grade:
      // o cone alcança o alvo e até dois inimigos próximos; a linha, o alvo e um inimigo atrás dele.
      const shape = (this.alive().length > 1 && this.P.ask) ? await this.P.ask({ title: 'Arma de Sopro', text: 'Escolha a forma da exalação.', options: [{ id: 'cone', label: 'Cone de 4,5 m (até 3 inimigos próximos)' }, { id: 'linha', label: 'Linha de 9 m (até 2 inimigos em fila)' }] }) : 'cone';
      if (!shape || shape === 'no') return;
      C.spend(h, 'sopro');
      const type = C.ancestryType(h);
      const dice = `${h.level >= 17 ? 4 : h.level >= 11 ? 3 : h.level >= 5 ? 2 : 1}d10`;
      const dc = 8 + C.mod(h, 'con') + C.pb(h);
      await this.P.anim({ actor: 'hero', kind: 'breath', type });
      const roll = rollDice(dice);
      await this.P.rollDamage({ who: 'hero', label: `Arma de Sopro (TR Des CD ${dc})`, parts: [{ amount: roll.total, type, dice: roll }], total: roll.total });
      const first = this.enemy(targetUid) && !this.enemy(targetUid).dead ? this.enemy(targetUid) : this.alive()[0];
      const hit = [first, ...this.alive().filter((e) => e !== first)].slice(0, shape === 'linha' ? 2 : 3);
      for (const e of hit) {
        const ok = this.enemySave(e, 'des', dc);
        await this.showEnemySave(e, 'des', ok, dc, 'Arma de Sopro');
        const amt = ok.ok ? Math.floor(roll.total / 2) : roll.total;
        if (await this.damageEnemy(e, [{ amount: amt, type }], {})) this.onKill(e);
      }
    }

    // ------------------------------------------------------------ subclasses
    // CD das características que não são magia (Manobras, Explosão Elemental…)
    classDC(ab) {
      const h = this.h;
      if (!ab && C.caster(h) && C.cls(h).caster) return C.spellDC(h);
      const a = ab || ({ monge: 'sab', ladino: 'des', barbaro: 'for', guerreiro: C.mod(h, 'for') >= C.mod(h, 'des') ? 'for' : 'des' }[h.cls] || C.castAb(h));
      return 8 + C.pb(h) + C.mod(h, a);
    }
    supDie() { return this.h.level >= 10 ? 10 : 8; }
    psiDie() { return this.h.level >= 11 ? 10 : this.h.level >= 5 ? 8 : 6; }
    martialDie() { return this.h.level >= 11 ? 10 : this.h.level >= 5 ? 8 : 6; }
    inspDie() { return this.h.level >= 10 ? 10 : this.h.level >= 5 ? 8 : 6; }

    // começo do turno: o espírito fantasmagórico do Ilusionista ataca
    async startOfTurnSubFx() {
      const hc = this.hc;
      if (hc.phantom > 0 && !this.over) await this.phantomAttack();
    }
    async seaPulse() {
      const h = this.h;
      const e = U.pick(this.alive());
      if (!e) return;
      const n = Math.max(1, C.mod(h, 'sab'));
      const dc = C.spellDC(h);
      const x = rollDice(`${n}d6`);
      await this.P.anim({ actor: 'hero', target: e.uid, kind: 'spell', type: 'frio' });
      const ok = this.enemySave(e, 'con', dc, true);
      await this.showEnemySave(e, 'con', ok, dc, 'Ira do Mar');
      if (ok.ok) { this.say(`Ira do Mar: ${e.name} resiste às ondas geladas.`, 'info'); return; }
      await this.P.rollDamage({ who: 'hero', label: 'Ira do Mar', parts: [{ amount: x.total, type: 'frio', dice: x }], total: x.total, quick: true });
      if (await this.damageEnemy(e, [{ amount: x.total, type: 'frio' }], { spell: true })) this.onKill(e);
    }
    async phantomAttack() {
      const h = this.h, hc = this.hc;
      hc.phantom--;
      const e = this.alive()[0];
      if (!e) return;
      const r = this.d20(false, false, true);
      const bonus = C.spellAttack(h), total = r.nat + bonus, crit = r.nat === 20, hit = r.nat !== 1 && (crit || total >= e.ac);
      await this.P.rollD20({ who: 'hero', label: `Fada Fantasmagórica → ${e.name}`, rolls: r.rolls, nat: r.nat, bonus, total, ac: e.ac, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack', quick: true });
      await this.P.anim({ actor: 'hero', target: e.uid, kind: 'spell', type: 'psiquico' });
      if (!hit) { this.P.float(e.uid, 'Errou', 'miss'); this.say(`A fada fantasmagórica erra ${e.name}.`, 'miss'); return; }
      const x = rollDice('2d6+6', crit);
      await this.P.rollDamage({ who: 'hero', label: 'Lâmina Feérica', parts: [{ amount: x.total, type: 'energia', dice: x }], total: x.total, crit, quick: true });
      if (await this.damageEnemy(e, [{ amount: x.total, type: 'energia' }], { crit, spell: true })) this.onKill(e);
      if (hc.phantom <= 0) this.say('A fada fantasmagórica se desfaz.', 'sys');
    }

    // ao errar: Ataque Guiado (Guerra), Ataque Preciso (Mestre de Batalha), Golpes Teleguiados (Lâmina da Alma)
    async missRescue(total, ac) {
      const h = this.h, need = ac - total;
      if (need <= 0) return 0;
      const opts = [];
      if (C.hasFx(h, 'guidedStrike') && C.res(h, 'canalizar') > 0 && need <= 10) opts.push({ id: 'guided', label: 'Ataque Guiado: +10 (Canalizar Divindade)' });
      if (C.hasFx(h, 'maneuvers') && C.res(h, 'superioridade') > 0 && need <= this.supDie()) opts.push({ id: 'precise', label: `Ataque Preciso: +d${this.supDie()} (1 dado de superioridade)` });
      if (C.hasFx(h, 'homing') && C.res(h, 'psionico') > 0 && need <= this.psiDie()) opts.push({ id: 'homing', label: `Golpes Teleguiados: +d${this.psiDie()} (gasto só se acertar)` });
      if (!opts.length) return 0;
      const ch = await this.P.ask({ title: 'Quase!', text: `Você errou por ${need} (${total} vs CA ${ac}). Usar uma técnica da subclasse?`, options: opts.concat([{ id: 'no', label: 'Aceitar o erro' }]) });
      if (!ch || ch === 'no') return 0;
      let add = 0, label = '';
      if (ch === 'guided') { C.spend(h, 'canalizar'); add = 10; label = 'Ataque Guiado'; }
      if (ch === 'precise') { C.spend(h, 'superioridade'); add = U.die(this.supDie()); label = 'Ataque Preciso'; }
      if (ch === 'homing') { add = U.die(this.psiDie()); label = 'Golpes Teleguiados'; if (total + add >= ac) C.spend(h, 'psionico'); }
      const ok = total + add >= ac;
      this.say(`${label}: +${add} → ${total + add} contra CA ${ac} — ${ok ? 'ACERTA!' : 'ainda erra.'}`, ok ? 'good' : 'miss');
      return add;
    }

    // ao acertar (1×/turno): Manobras, Golpe Psiônico, Inspiração em Combate, Mão do Dano
    async hitTechnique(target, prof, unarmedLike) {
      const h = this.h, t = this.turn;
      if (!t || t.once.tech) return null;
      const opts = [];
      const immune = (c) => (target.def.condImm || []).includes(c);
      if (C.hasFx(h, 'maneuvers') && C.res(h, 'superioridade') > 0) {
        const d = `d${this.supDie()}`;
        if (!immune('caido')) opts.push({ id: 'trip', label: `Derrubar (+1${d}, TR For ou Caído)` });
        if (!immune('amedrontado')) opts.push({ id: 'menace', label: `Ameaçar (+1${d}, TR Sab ou Amedrontado)` });
        opts.push({ id: 'disarm', label: `Desarmar (+1${d}, TR For ou Enfraquecido)` });
        opts.push({ id: 'push', label: `Empurrar (+1${d}, TR For ou Empurrado)` });
      }
      if (C.hasFx(h, 'psiStrike') && C.res(h, 'psionico') > 0) {
        opts.push({ id: 'psi', label: `Golpe Psiônico (+1d${this.psiDie()} + INT Energia)` });
        if (C.hasFx(h, 'psiTopple') && !immune('caido')) opts.push({ id: 'psi_topple', label: `Golpe Telecinético (+1d${this.psiDie()} + INT, TR For ou Caído)` });
      }
      if (C.hasFx(h, 'shieldMaster') && h.equip.shield && !prof.ranged && !immune('caido')) opts.push({ id: 'shield', label: 'Golpe de Escudo (TR For ou Caído)' });
      if (C.hasFx(h, 'harmHand') && unarmedLike && C.res(h, 'foco') > 0) opts.push({ id: 'harm', label: `Mão do Dano (+1d${this.martialDie()} + SAB Necrótico${C.hasFx(h, 'harmPoison') ? ', Envenena' : ''} · 1 Foco)` });
      if (!opts.length) return null;
      const ch = await this.P.ask({ title: 'Técnica', text: `Você acertou ${target.name}! Usar uma técnica?`, options: opts.slice(0, 5).concat([{ id: 'no', label: 'Não usar' }]) });
      if (!ch || ch === 'no') return null;
      t.once.tech = true;
      const sd = `1d${this.supDie()}`, mDC = 8 + C.pb(h) + Math.max(C.mod(h, 'for'), C.mod(h, 'des'));
      const intm = Math.max(0, C.mod(h, 'int'));
      switch (ch) {
        case 'trip': C.spend(h, 'superioridade'); return { dice: sd, label: 'Derrubar', after: { save: 'for', dc: mDC, cond: 'caido', name: 'Derrubar' } };
        case 'menace': C.spend(h, 'superioridade'); return { dice: sd, label: 'Ameaçar', after: { save: 'sab', dc: mDC, cond: 'amedrontado', name: 'Ameaçar' } };
        case 'disarm': C.spend(h, 'superioridade'); return { dice: sd, label: 'Desarmar', after: { save: 'for', dc: mDC, cond: 'enfraquecido', name: 'Desarmar' } };
        case 'push': C.spend(h, 'superioridade'); return { dice: sd, label: 'Empurrar', after: { save: 'for', dc: mDC, cond: 'empurrado', name: 'Empurrar' } };
        case 'psi': C.spend(h, 'psionico'); return { dice: `1d${this.psiDie()}+${intm}`, type: 'energia', label: 'Golpe Psiônico' };
        case 'psi_topple': C.spend(h, 'psionico'); return { dice: `1d${this.psiDie()}+${intm}`, type: 'energia', label: 'Golpe Telecinético', after: { save: 'for', dc: 8 + C.pb(h) + C.mod(h, 'int'), cond: 'caido', name: 'Impulso Telecinético' } };
        case 'shield': return { label: 'Golpe de Escudo', after: { save: 'for', dc: 8 + C.pb(h) + C.mod(h, 'for'), cond: 'caido', name: 'Golpe de Escudo' } };
        case 'harm': C.spend(h, 'foco'); return { dice: `1d${this.martialDie()}+${Math.max(0, C.mod(h, 'sab'))}`, type: 'necrotico', label: 'Mão do Dano', after: C.hasFx(h, 'harmPoison') ? { save: 'con', dc: this.classDC('sab'), cond: 'envenenado', name: 'Toque do Médico', auto: true } : null };
      }
      return null;
    }

    // Surto de Magia Selvagem (tabela curta)
    async wildSurge() {
      const h = this.h, hc = this.hc;
      const roll = U.die(10);
      this.say(`🌀 SURTO DE MAGIA SELVAGEM! (d10 = ${roll})`, 'boss');
      await this.P.anim({ actor: 'hero', kind: 'buff', type: 'psiquico' });
      if (roll === 1) {
        const x = rollDice('2d6');
        this.say('Uma explosão de fogo selvagem atinge todos — inclusive você!', 'spell');
        for (const e of this.alive()) if (await this.damageEnemy(e, [{ amount: x.total, type: 'fogo' }], { spell: true })) this.onKill(e);
        if (!this.over) await this.damageHero([{ amount: Math.ceil(x.total / 2), type: 'fogo' }]);
      } else if (roll === 2) { const x = rollDice('2d10'); this.healHero(x.total, 'Surto: luz curativa'); }
      else if (roll === 3) this.giveTemp(rollDice('2d6').total + h.level, 'Surto: pele de cristal');
      else if (roll === 4) { hc.sb.surgeAc = 3; this.say('Surto: um campo de força te envolve (+2 CA por 3 rodadas).', 'good'); }
      else if (roll === 5) { const used = (h.used || {}).feiticaria || 0; const back = Math.min(used, U.die(4)); if (back) { h.used.feiticaria -= back; this.say(`Surto: você recupera ${back} Ponto(s) de Feitiçaria.`, 'good'); } else this.say('Surto: faíscas coloridas dançam ao seu redor. Nada acontece.', 'info'); }
      else if (roll === 6) { hc.sb.advD20 = 1; this.say('Surto: o destino sorri — Vantagem no próximo Teste de d20.', 'good'); }
      else if (roll === 7) {
        const e = U.pick(this.alive());
        if (e) {
          const x = rollDice('3d10'), dc = C.spellDC(h);
          await this.P.anim({ actor: 'hero', target: e.uid, kind: 'spell', type: 'eletrico' });
          const ok = this.enemySave(e, 'des', dc, true);
          await this.showEnemySave(e, 'des', ok, dc, 'Raio Selvagem');
          const amt = ok.ok ? Math.floor(x.total / 2) : x.total;
          this.say(`Surto: um raio cai do nada sobre ${e.name}!`, 'spell');
          if (await this.damageEnemy(e, [{ amount: amt, type: 'eletrico' }], { spell: true })) this.onKill(e);
        }
      } else if (roll === 8) { hc.sb.blur = 1; this.say('Surto: você fica translúcido — ataques contra você têm Desvantagem até seu próximo turno.', 'good'); }
      else if (roll === 9) { hc.hidden = 20; this.say('Surto: você fica Invisível por um instante (escondido).', 'good'); }
      else {
        this.say('Surto: sua pele fica azul-celeste por um minuto. Só isso.', 'info');
      }
      this.P.update();
    }

    // ------------------------------------------------------------ poderes da subclasse (botões)
    powerCost(p) { return typeof p.cost === 'function' ? p.cost(this.h) : p.cost; }
    powerUse(p) { return typeof p.use === 'function' ? p.use(this.h) : p.use || 1; }
    // por que o poder não pode ser usado agora (null = pode)
    powerBlock(p) {
      const h = this.h, hc = this.hc, t = this.turn;
      if (!t) return 'Fora do seu turno';
      const cost = this.powerCost(p);
      if (cost === 'a' && t.action <= 0) return 'Sem Ação';
      if (cost === 'b' && t.bonus <= 0) return 'Sem Ação Bônus';
      if (p.needBuff && !hc.sb[p.needBuff]) return 'Precisa do efeito ativo';
      if (p.needAllies && !this.allies.some((a) => !a.down)) return 'Só afeta aliados (cooperativo)';
      if (p.effect && p.effect.needAttacked && !t.attacked) return 'Depois de atacar';
      if (p.effect && p.effect.brutal) { if (!hc.reckless) return 'Use Ataque Descuidado antes'; if (hc.brutalNext || t.once.brutal) return 'Já usado neste turno'; }
      if (p.effect && p.effect.resurgence && t.once.resurg) return 'Já usado neste turno';
      if (p.effect && p.effect.clair && hc.clair) return 'Já ativo';
      if (p.sig && hc.sigUsed) return 'Uma vez por combate';
      if (p.eco && hc.ecoUsed) return 'Uma vez por combate';
      if (p.eco && !this.alive().length) return 'Sem alvo';
      if (p.sig && p.sig.slot === 'weapon' && W.SIGNATURE[p.sig.id].kind === 'strike' && !this.alive().length) return 'Sem alvo';
      if (p.req && !p.req(h)) return p.reqTxt || 'Requisito não atendido';
      if (p.effect && p.effect.buff && hc.sb[p.effect.buff] && !p.effect.heal && !p.effect.temp) return 'Já ativo';
      if (p.effect && p.effect.phantom && hc.phantom > 0) return 'Já ativo';
      if (p.res) { const use = this.powerUse(p); if (use <= 0 || C.res(h, p.res) < use) return 'Sem usos'; }
      return null;
    }
    async subPower(id, targetUid) {
      if (!this.canAct()) return;
      const h = this.h, hc = this.hc, t = this.turn;
      const p = C.subPowers(h).find((x) => x.id === id);
      if (!p || this.powerBlock(p)) return;
      const cost = this.powerCost(p), use = this.powerUse(p), ef = p.effect || {};
      this.busy = true;
      try {
        if (cost === 'a') t.action--; else if (cost === 'b') t.bonus--;
        if (p.res) C.spend(h, p.res, use);
        const target = this.enemy(targetUid) && !this.enemy(targetUid).dead ? this.enemy(targetUid) : this.alive()[0];
        this.say(`${h.name} usa ${p.name}!`, 'spell');
        if (ef.aoe) await this.powerAoe(ef.aoe, p);
        if (ef.aoeCond) await this.powerAoeCond(ef.aoeCond, p);
        if (ef.sig) await this.signature(p, target);
        if (ef.ecoRush) await this.ecoRush(target);
        if (ef.turnUndead) await this.turnUndead();
        if (ef.castFree) await this.freeCast(ef.castFree, target, { noConc: !!ef.noConc });
        if (ef.seaPulse) await this.seaPulse();
        if (ef.intervention) await this.divineIntervention(target);
        if (ef.resurgence) { const i = C.slotsLeft(h).findIndex((n) => n > 0); if (i >= 0) { this.useSlot(i + 1); h.used.forma = Math.max(0, (h.used.forma || 0) - 1); t.once.resurg = true; this.say(`Ressurgência Selvagem: um espaço de ${i + 1}º círculo vira 1 uso de Forma Selvagem.`, 'good'); } }
        if (ef.brutal) { hc.brutalNext = true; t.once.brutal = true; this.say('Golpe Brutal: o próximo ataque abre mão da Vantagem do Ataque Descuidado — se acertar, +1d10 e Golpe Contundente.', 'info'); }
        if (ef.clair && target) {
          const dc = C.spellDC(h);
          await this.P.anim({ actor: 'hero', target: target.uid, kind: 'spell', type: 'psiquico' });
          const ok = this.enemySave(target, 'sab', dc, true);
          await this.showEnemySave(target, 'sab', ok, dc, p.name);
          if (!ok.ok) { hc.clair = target.uid; this.say(`Vínculo telepático: Vantagem contra ${target.name}, e ele tem Desvantagem contra você.`, 'good'); }
        }
        if (ef.allyTemp) { const x = rollDice(ef.allyTemp(h)); const n = x.total * (ef.allyMult || 1); for (const a of this.allies.filter((q) => !q.down).slice(0, Math.max(1, C.mod(h, 'car')))) { a.temp = Math.max(a.temp || 0, n); this.say(`${p.name}: ${a.name} ganha ${n} PV temporários.`, 'good'); } }
        if (ef.allyAdv) { for (const a of this.allies.filter((q) => !q.down)) a.advT = 1; this.say(`${p.name}: aliados com Vantagem até o seu próximo turno.`, 'good'); }
        if (ef.cleanse) { const list = ef.cleanse(h).filter((c) => hc.cond[c]); list.forEach((c) => delete hc.cond[c]); if (list.length) this.say(`${p.name}: ${list.map((c) => R.CONDITIONS[c].name).join(', ')} encerrado.`, 'good'); }
        if (ef.target && target) await this.powerTarget(ef.target, p, target);
        if (ef.weaponAttack && target) await this.weaponAttack(target, typeof ef.weaponAttack === 'object' ? { override: ef.weaponAttack } : {});
        if (ef.heal) {
          const expr = String(ef.heal(h, use));
          const x = /^\d+$/.test(expr) ? null : rollDice(expr);
          const amt = x ? x.total : Number(expr);
          await this.P.anim({ actor: 'hero', kind: 'heal' });
          await this.P.rollDamage({ who: 'hero', label: p.name, parts: [{ amount: amt, type: 'cura', dice: x || undefined }], total: amt, heal: true });
          this.healHero(amt, p.name);
        }
        if (ef.temp) { await this.P.anim({ actor: 'hero', kind: 'buff', type: 'energia' }); this.giveTemp(rollDice(ef.temp(h, use)).total, p.name); }
        if (ef.buff) {
          hc.sb[ef.buff] = ef.rounds || 1;
          if (!ef.heal && !ef.temp) await this.P.anim({ actor: 'hero', kind: 'buff', type: { seaAura: 'frio', starry: 'radiante', elem: 'fogo', zeal: 'radiante', dup: 'psiquico' }[ef.buff] || 'energia' });
          const txt = { majesty: 'uma aparência majestosa — Comando como Ação Bônus.', zeal: 'Vantagem nos ataques e testes de resistência.', blur: 'ataques contra você têm Desvantagem até seu próximo turno.', dup: 'um duplo ilusório distrai os inimigos.', advNext: 'Vantagem no próximo ataque.', seaAura: 'ondas geladas giram ao seu redor.', starry: 'uma constelação de arqueiro brilha em você.', elem: 'seus golpes ganham força elemental.' }[ef.buff];
          if (txt) this.say(`${p.name}: ${txt}`, 'good');
          if (ef.buff === 'seaAura' && !this.over) await this.seaPulse();
          if (ef.buff === 'starry' && !this.over) { const arrow = C.subPowers(h).find((x) => x.needBuff === 'starry'); const tg = this.alive().find((e) => e.uid === targetUid) || this.alive()[0]; if (arrow && tg) await this.powerTarget(arrow.effect.target, arrow, tg); }
        }
        if (ef.vow && target) { hc.vow = target.uid; await this.P.anim({ actor: 'hero', target: target.uid, kind: 'spell', type: 'radiante' }); this.say(`Voto de Inimizade: Vantagem contra ${target.name}.`, 'good'); }
        if (ef.hide) { hc.hidden = 20; this.say('Você some nas sombras (escondido).', 'good'); }
        if (ef.luck) { hc.sb.advD20 = 1; hc.chaos = true; this.say('Maré do Caos: Vantagem no próximo Teste de d20 — e a próxima magia vai liberar um surto!', 'good'); }
        if (ef.phantom) { hc.phantom = 10; this.say('Uma criatura ilusória surge e investe contra os inimigos!', 'good'); await this.phantomAttack(); }
      } finally { this.busy = false; }
      this.afterHeroAction();
    }
    // CD das habilidades únicas das armas: 8 + BP + FOR/DES (arma) ou atributo de conjuração (catalisador)
    sigDC(slot) { const h = this.h; return 8 + C.pb(h) + (slot === 'focus' ? C.mod(h, C.castAb(h)) : Math.max(C.mod(h, 'for'), C.mod(h, 'des'))); }
    // habilidade única da arma ★5 (uma vez por combate)
    async signature(p, target) {
      const h = this.h, hc = this.hc, i = p.sig.tier - 1;
      // ressonância das armas de linhagem: +2 dados (Classe) ou +4 dados (Total) na habilidade única
      const k = (p.sig.res || 0) * 2;
      const more = (arr) => arr && arr.map((x) => { if (!k || !x) return x; const d = U.parseDice(x); return U.diceStr(d.n + k, d.s, d.mod); });
      const base = W.SIGNATURE[p.sig.id], sg = Object.assign({}, base, { dice: more(base.dice), heal: more(base.heal) });
      hc.sigUsed = true;
      if (k) this.say(`${W.RES_NAMES[p.sig.res]}: a arma vibra junto com ${h.name}!`, 'good');
      this.say(`✦ ${sg.name}! (${['despertada', 'fortalecida', 'completa'][i]})`, 'boss');
      await this.P.anim({ actor: 'hero', kind: 'buff', type: sg.type || 'radiante' });
      if (sg.kind === 'strike') {
        if (target) await this.weaponAttack(target, { sig: { name: sg.name, dice: sg.dice[i], type: sg.type, adv: sg.adv && sg.adv[i], autoCrit: sg.autoCrit && sg.autoCrit[i], cond: sg.cond && sg.cond[i], save: sg.save, drain: sg.drain && sg.drain[i], killTemp: sg.killTemp && sg.killTemp[i] } });
        if (sg.buff && sg.buff[i]) hc.sb[sg.buff[i]] = 1;
        return;
      }
      if (sg.kind === 'aoe') {
        const dc = this.sigDC(p.sig.slot), x = rollDice(sg.dice[i]);
        await this.P.anim({ actor: 'hero', kind: 'spell', type: sg.type, aoe: true });
        await this.P.rollDamage({ who: 'hero', label: `${sg.name} · TR ${R.AB[sg.save].name} CD ${dc}`, parts: [{ amount: x.total, type: sg.type, dice: x }], total: x.total });
        let first = true;
        for (const e of this.alive()) {
          const ok = this.enemySave(e, sg.save, dc);
          await this.showEnemySave(e, sg.save, ok, dc, sg.name);
          const amt = ok.ok ? Math.floor(x.total / 2) : x.total;
          if (first && sg.drain && sg.drain[i]) this.healHero(Math.max(1, Math.floor(amt * sg.drain[i])), sg.name);
          first = false;
          if (await this.damageEnemy(e, [{ amount: amt, type: sg.type }], {})) { this.onKill(e); continue; }
          const cond = sg.cond && sg.cond[i];
          if (!ok.ok && cond && !(e.def.condImm || []).includes(cond)) { e.cond[cond] = { src: 'hero', save: sg.save, dc }; if (cond === 'lentificado') e.ac -= 2; this.say(`${e.name}: ${R.CONDITIONS[cond].name}!`, 'good'); }
        }
      }
      if (sg.kind === 'self' && sg.heal) { const x = rollDice(sg.heal[i]); await this.P.anim({ actor: 'hero', kind: 'heal' }); await this.P.rollDamage({ who: 'hero', label: sg.name, parts: [{ amount: x.total, type: 'cura', dice: x }], total: x.total, heal: true }); this.healHero(x.total, sg.name); }
      if (sg.cleanse && sg.cleanse[i]) { const list = Object.keys(hc.cond).filter((c) => ['envenenado', 'amedrontado', 'cego', 'atordoado', 'paralisado', 'contido', 'agarrado', 'adormecido', 'caido'].includes(c)); list.forEach((c) => delete hc.cond[c]); if (list.length) this.say(`${sg.name}: ${list.map((c) => R.CONDITIONS[c].name).join(', ')} encerrado.`, 'good'); }
      if (sg.temp && sg.temp[i]) this.giveTemp(sg.temp[i], sg.name);
    }

    // Investida do Eco: o espírito guardião sai de trás do herói e ataca (1×/combate, Ação Bônus)
    async ecoRush(target) {
      const h = this.h, hc = this.hc, eco = E.Eco.equipped(h);
      if (!eco) return;
      hc.ecoUsed = true;
      const rs = eco.def.rush, i = eco.sync - 1, dc = E.Eco.dc(h);
      this.say(`「${eco.def.cry}」 ${eco.def.name}: ${rs.name}!`, 'boss');
      const targets = rs.kind === 'aoe' ? this.alive() : [target || this.alive()[0]].filter(Boolean);
      await this.P.anim({ actor: 'hero', target: targets[0] && targets[0].uid, kind: 'eco', type: rs.type, eco: eco.id, cry: eco.def.cry, aoe: rs.kind === 'aoe' });
      const x = rollDice(rs.dice[i]);
      await this.P.rollDamage({ who: 'hero', label: `${rs.name} · TR ${R.AB[rs.save].name} CD ${dc}`, parts: [{ amount: x.total, type: rs.type, dice: x }], total: x.total });
      let first = true;
      for (const e of targets) {
        const ok = this.enemySave(e, rs.save, dc);
        await this.showEnemySave(e, rs.save, ok, dc, rs.name);
        const amt = ok.ok ? Math.floor(x.total / 2) : x.total;
        if (first && rs.drain) this.healHero(Math.max(1, Math.floor(amt * rs.drain)), rs.name);
        first = false;
        if (await this.damageEnemy(e, [{ amount: amt, type: rs.type }], {})) { this.onKill(e); continue; }
        if (!ok.ok && rs.cond && !(e.def.condImm || []).includes(rs.cond)) { e.cond[rs.cond] = { src: 'hero', save: rs.save, dc }; this.say(`${e.name}: ${R.CONDITIONS[rs.cond].name}!`, 'good'); }
      }
      if (rs.heal) { const hx = rollDice(rs.heal[i]); this.healHero(hx.total, rs.name); }
      if (rs.cleanse) { const list = Object.keys(hc.cond).filter((c) => ['envenenado', 'amedrontado', 'cego', 'atordoado', 'paralisado', 'contido', 'agarrado', 'adormecido', 'caido', 'lento'].includes(c)); list.forEach((c) => delete hc.cond[c]); if (list.length) this.say(`${rs.name}: ${list.map((c) => R.CONDITIONS[c].name).join(', ')} encerrado.`, 'good'); }
      if (rs.extraAction && this.turn) { this.turn.action++; this.say('O tempo parou: você ganha uma Ação extra neste turno!', 'good'); }
      // Mordida do Pó: o tempo volta ao começo do combate (PV perdidos e condições negativas)
      if (rs.rewind) {
        const back = Math.min(C.maxHp(h), this.startHp || 0) - h.hp;
        if (back > 0) this.healHero(back, rs.name);
        const list = Object.keys(hc.cond).filter((c) => ['envenenado', 'amedrontado', 'cego', 'atordoado', 'paralisado', 'contido', 'agarrado', 'adormecido', 'caido', 'lento', 'perdicao'].includes(c));
        list.forEach((c) => delete hc.cond[c]);
        this.say(`Mordida do Pó: o tempo volta${back > 0 ? ` e você recupera ${back} PV` : ''}${list.length ? `; ${list.map((c) => R.CONDITIONS[c].name).join(', ')} desfeito` : ''}.`, 'good');
      }
    }

    // Canalizar Divindade: Expulsar Mortos-Vivos (Clérigo 2) e Queimar Mortos-Vivos (Clérigo 5)
    async turnUndead() {
      const h = this.h, dc = C.spellDC(h);
      await this.P.anim({ actor: 'hero', kind: 'spell', type: 'radiante', aoe: true });
      const und = this.alive().filter((e) => e.def.type === 'morto-vivo');
      if (!und.length) { this.say('Nenhum morto-vivo para expulsar.', 'info'); return; }
      const sear = h.level >= 5 ? rollDice(`${Math.max(1, C.mod(h, 'sab'))}d8`) : null;
      for (const e of und) {
        const ok = this.enemySave(e, 'sab', dc, false);
        await this.showEnemySave(e, 'sab', ok, dc, 'Expulsar Mortos-Vivos');
        if (ok.ok) continue;
        if (!(e.def.condImm || []).includes('amedrontado')) { e.cond.amedrontado = { src: 'hero', turned: true }; e.cond.incapacitado = { src: 'hero', turned: true }; this.say(`${e.name} foge da luz sagrada (Amedrontado e Incapacitado).`, 'good'); }
        if (sear && await this.damageEnemy(e, [{ amount: sear.total, type: 'radiante' }], { sear: true })) this.onKill(e);
      }
    }
    // Intervenção Divina (Clérigo 10)
    async divineIntervention(target) {
      const h = this.h;
      const list = Object.entries(S.SPELLS).filter(([, s]) => s.level >= 1 && s.level <= 5 && s.classes.includes('clerigo') && s.time !== 'reacao' && s.time !== 'smite').sort((a, b) => b[1].level - a[1].level);
      const known = list.filter(([id]) => C.knownSpells(h).includes(id));
      const opts = (known.length >= 4 ? known : list).slice(0, 8).map(([id, s]) => ({ id, label: `${s.name} (${s.level}º)` }));
      const ch = await this.P.ask({ title: 'Intervenção Divina', text: 'Qual magia seu deus concede?', options: opts });
      if (ch && S.SPELLS[ch]) await this.freeCast(ch, target, {});
    }

    async powerAoe(a, p) {
      const h = this.h, dc = this.classDC();
      if (a.type === 'elemental') a = Object.assign({}, a, { type: this.bestElement() });
      const x = rollDice(a.dice(h));
      await this.P.anim({ actor: 'hero', kind: 'spell', type: a.type, aoe: true });
      await this.P.rollDamage({ who: 'hero', label: `${p.name} · TR ${R.AB[a.save].name} CD ${dc}`, parts: [{ amount: x.total, type: a.type, dice: x }], total: x.total });
      for (const e of this.alive()) {
        const ok = this.enemySave(e, a.save, dc, true);
        await this.showEnemySave(e, a.save, ok, dc, p.name);
        const amt = ok.ok ? (a.half ? Math.floor(x.total / 2) : 0) : x.total;
        if (amt > 0 && await this.damageEnemy(e, [{ amount: amt, type: a.type }], { spell: true })) this.onKill(e);
      }
    }
    async powerAoeCond(a, p) {
      const dc = this.classDC();
      await this.P.anim({ actor: 'hero', kind: 'spell', type: a.cond === 'amedrontado' ? 'radiante' : 'veneno', aoe: true });
      for (const e of this.alive().slice(0, a.max ? a.max(this.h) : 99)) {
        if ((e.def.condImm || []).includes(a.cond)) { this.say(`${e.name} é imune.`, 'info'); continue; }
        const ok = this.enemySave(e, a.save, dc, true);
        await this.showEnemySave(e, a.save, ok, dc, p.name);
        if (!ok.ok) { e.cond[a.cond] = { save: a.save, dc, src: 'hero' }; this.say(`${e.name}: ${R.CONDITIONS[a.cond].name}!`, 'good'); }
      }
    }
    async powerTarget(tg, p, target) {
      const h = this.h, hc = this.hc, t = this.turn;
      const type = typeof tg.type === 'function' ? tg.type(h) : tg.type || 'energia';
      if (tg.save) {
        const dc = this.classDC();
        await this.P.anim({ actor: 'hero', target: target.uid, kind: 'spell', type: 'psiquico' });
        if (tg.cond && (target.def.condImm || []).includes(tg.cond)) { this.say(`${target.name} é imune.`, 'info'); return; }
        const ok = this.enemySave(target, tg.save, dc, true);
        await this.showEnemySave(target, tg.save, ok, dc, p.name);
        if (!ok.ok && tg.cond) { target.cond[tg.cond] = { src: 'hero', save: tg.save, dc }; this.say(`${target.name}: ${R.CONDITIONS[tg.cond].name}!`, 'good'); }
        return;
      }
      // jogada de ataque: mágica (bônus de magia) ou "com arma" (DES + proficiência, como a Lâmina Psíquica)
      const weaponLike = tg.attack === 'weapon';
      const prof = { ranged: true, ability: 'des', finesseOrRanged: true };
      const { adv, dis } = this.heroAttackMods(target, prof, !weaponLike);
      const r = this.d20(adv.length > 0, dis.length > 0, true);
      const bonus = weaponLike ? C.pb(h) + C.mod(h, 'des') : C.spellAttack(h);
      const total = r.nat + bonus, crit = r.nat === 20, hit = r.nat !== 1 && (crit || total >= target.ac);
      if (hc.hidden && !hc.sb.ginvis) hc.hidden = 0;
      delete hc.sb.advNext; delete hc.sb.advD20;
      if (target.cond.iluminado) delete target.cond.iluminado;
      await this.P.rollD20({ who: 'hero', label: `${p.name} → ${target.name}`, rolls: r.rolls, nat: r.nat, bonus, total, ac: target.ac, adv: r.mode === 'adv', dis: r.mode === 'dis', advWhy: adv, disWhy: dis, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
      await this.P.anim({ actor: 'hero', target: target.uid, kind: weaponLike ? 'ranged' : 'spell', type });
      if (!hit) { this.P.float(target.uid, 'Errou', 'miss'); this.say(`${p.name}: ${total} contra CA ${target.ac} — errou.`, 'miss'); return; }
      const parts = [];
      const x = rollDice(tg.dice(h), crit);
      parts.push({ amount: Math.max(1, x.total), type, dice: x, label: p.name });
      if (tg.sneak && h.cls === 'ladino' && t && !t.sneak && r.mode === 'adv') { const s = rollDice(`${C.sneakDice(h)}d6`, crit); parts.push({ amount: s.total, type, dice: s, label: 'Ataque Furtivo' }); t.sneak = true; }
      const total2 = parts.reduce((a, q) => a + q.amount, 0);
      await this.P.rollDamage({ who: 'hero', label: crit ? 'CRÍTICO! Dano dobrado' : p.name, parts, total: total2, crit });
      if (await this.damageEnemy(target, parts, { crit })) this.onKill(target);
    }

    // ------------------------------------------------------------ magias
    spellSlotsFor(spellId) {
      const sp = S.SPELLS[spellId], h = this.h;
      if (sp.level === 0) return [0];
      const out = [];
      const free = (spellId === 'marca_cacador' && C.res(h, 'marca_gratis') > 0) || (h.mi && h.mi.spell === spellId && C.res(h, 'mi_spell') > 0) || C.res(h, 'sp_' + spellId) > 0;
      if (free) out.push('free');
      C.slotsLeft(h).forEach((n, i) => { if (n > 0 && i + 1 >= sp.level) out.push(i + 1); });
      return out;
    }
    useSlot(lvl) {
      const h = this.h;
      h.slotsUsed = h.slotsUsed || [];
      h.slotsUsed[lvl - 1] = (h.slotsUsed[lvl - 1] || 0) + 1;
    }

    // Metamagia (Feiticeiro 2): opções conhecidas e custo em Pontos de Feitiçaria
    metamagicOptions(spellId) {
      const h = this.h, sp = S.SPELLS[spellId], t = this.turn;
      if (!C.hasFx(h, 'metamagic') || !sp || !t) return [];
      const sp2 = C.res(h, 'feiticaria'), out = [];
      if (sp.dmg && sp2 >= 1) out.push({ id: 'empowered', cost: 1, label: 'Potencializada (1 PF): rerrola dados baixos' });
      if (sp.attack && sp2 >= 1) out.push({ id: 'seeking', cost: 1, label: 'Busca (1 PF): rerrola o d20 se errar' });
      if (sp.time === 'acao' && sp2 >= 2 && t.bonus > 0 && t.action > 0) out.push({ id: 'quickened', cost: 2, label: 'Acelerada (2 PF): conjura como Ação Bônus' });
      if (sp.save && h.level >= 10 && sp2 >= 2) out.push({ id: 'heightened', cost: 2, label: 'Elevada (2 PF): Desvantagem no TR do alvo' });
      return out;
    }

    async castSpell(spellId, slot, targetUid, meta) {
      if (!this.canAct()) return;
      const h = this.h, hc = this.hc, t = this.turn;
      let sp = S.SPELLS[spellId];
      if (hc.raging) return;
      const mm = meta ? this.metamagicOptions(spellId).find((m) => m.id === meta) : null;
      const isBonus = sp.time === 'bonus' || (mm && mm.id === 'quickened');
      // Magia de Guerra (Cavaleiro Arcano, 2024): um truque pode substituir um dos ataques da ação Atacar
      const warSwap = !isBonus && sp.level === 0 && this.warMagicReady();
      if (!warSwap && (isBonus ? t.bonus <= 0 : t.action <= 0)) return;
      // regra de 2024: só um espaço de magia por turno
      if (slot !== 0 && slot !== 'free' && t.once.slotSpell) { this.say('Só é possível gastar um espaço de magia por turno.', 'bad'); return; }
      this.busy = true;
      try {
        if (warSwap) { if (t.attacksLeft > 0) t.attacksLeft--; else { t.action--; t.attacksLeft = C.attacksPerAction(h) - 1; } }
        else if (isBonus) t.bonus--; else t.action--;
        let lvl = sp.level;
        if (slot === 'free') {
          if (spellId === 'marca_cacador') C.spend(h, 'marca_gratis'); else if (C.res(h, 'sp_' + spellId) > 0) C.spend(h, 'sp_' + spellId); else C.spend(h, 'mi_spell');
        } else if (slot > 0) { this.useSlot(slot); lvl = slot; t.once.slotSpell = true; }
        if (sp.conc) this.startConc(spellId);
        const target = this.enemy(targetUid) || this.alive()[0];
        if (mm) { C.spend(h, 'feiticaria', mm.cost); this.say(`Metamagia ${mm.label.split(' (')[0]}!`, 'spell'); }
        // Feitiços Psíquicos (Grande Antigo): dano de magia de Bruxo pode virar Psíquico
        if (C.hasFx(h, 'psychicSpells') && sp.type && sp.classes.includes('bruxo') && target && this.bestType(target, sp.type, ['psiquico']) === 'psiquico' && sp.type !== 'psiquico') { sp = Object.assign({}, sp, { type: 'psiquico' }); this.say(`Feitiços Psíquicos: ${sp.name} causa dano Psíquico.`, 'info'); }
        this.say(`${h.name} conjura ${sp.name}${lvl > 0 ? ` (${lvl}º círculo)` : ''}.`, 'spell');
        await this.P.anim({ actor: 'hero', target: target && target.uid, kind: sp.heal ? 'heal' : sp.buff ? 'buff' : 'spell', type: sp.type || 'energia', aoe: !!sp.aoe });
        // Grimório das Mãos Vazias
        const f = C.equipped(h, 'focus');
        if (f && f.def.passive && f.def.passive.spellTemp && lvl > 0) this.giveTemp(f.def.passive.spellTemp[f.refine - 1], f.def.passive.name);
        this.castCtx = { sp, hiddenDis: !!hc.hidden && C.hasFx(h, 'hiddenSpellDis'), modDone: false, empowered: mm && mm.id === 'empowered', seeking: mm && mm.id === 'seeking', heightened: mm && mm.id === 'heightened' };
        await this.resolveSpell(sp, spellId, lvl, target);
        this.castCtx = null;
        // subclasses: Proteção Arcana (criada e recarregada por Abjurações); Surto de Magia Selvagem; Magia Sedutora
        if (C.hasFx(h, 'arcaneWard') && sp.school === 'Abjuração' && lvl > 0) {
          if (hc.ward === undefined) { hc.wardMax = 2 * h.level + C.mod(h, 'int'); hc.ward = hc.wardMax; this.say(`Proteção Arcana: um escudo de ${hc.ward} PV envolve você.`, 'good'); }
          else { hc.ward = Math.min(hc.wardMax, hc.ward + 2 * lvl); this.say(`Proteção Arcana recarregada: ${hc.ward} PV.`, 'good'); }
        }
        if (C.hasFx(h, 'wildMagic') && lvl > 0 && !this.over && sp.classes.includes('feiticeiro')) {
          const forced = hc.chaos;
          let surge = forced;
          if (!surge && !t.once.surgeRoll) { t.once.surgeRoll = true; const d = U.die(20); surge = d === 20; this.say(`Surto de Magia Selvagem: d20 = ${d}${surge ? '!' : '.'}`, surge ? 'boss' : 'sys'); }
          if (surge) { hc.chaos = false; if (h.used && h.used.caos) h.used.caos = 0; await this.wildSurge(); }
        }
        if (C.hasFx(h, 'beguilingMagic') && lvl > 0 && ['Encantamento', 'Ilusão'].includes(sp.school) && !this.over) await this.beguilingMagic();
      } finally { this.busy = false; }
      this.afterHeroAction();
    }

    // Magia Sedutora (Colégio do Glamour)
    async beguilingMagic() {
      const h = this.h;
      const free = C.res(h, 'fascinio') > 0, insp = C.res(h, 'inspiracao') > 0;
      const e = this.alive().find((x) => !(x.def.condImm || []).includes('amedrontado'));
      if (!e || (!free && !insp)) return;
      const ch = await this.P.ask({ title: 'Magia Sedutora', text: `Fazer ${e.name} testar Sabedoria ou ficar Amedrontado?`, options: [{ id: 'yes', label: free ? 'Sim (1×/Descanso Longo)' : 'Sim (gasta Inspiração Bárdica)' }, { id: 'no', label: 'Não' }] });
      if (ch !== 'yes') return;
      C.spend(h, free ? 'fascinio' : 'inspiracao');
      const dc = C.spellDC(h);
      const ok = this.enemySave(e, 'sab', dc, true);
      await this.showEnemySave(e, 'sab', ok, dc, 'Magia Sedutora');
      if (!ok.ok) { e.cond.amedrontado = { src: 'hero', save: 'sab', dc }; this.say(`${e.name} fica Amedrontado!`, 'good'); }
    }

    // conjura uma magia sem gastar espaço (Bênção do Deus da Guerra, Mapa Estelar, Intervenção Divina…)
    async freeCast(spellId, target, o = {}) {
      const h = this.h, sp = S.SPELLS[spellId];
      if (!sp) return;
      const lvl = o.lvl || sp.level;
      if (sp.conc && !o.noConc) this.startConc(spellId);
      const tgt = target && !target.dead ? target : this.alive()[0];
      this.say(`${h.name} conjura ${sp.name} sem gastar espaço${o.noConc && sp.conc ? ' (sem Concentração)' : ''}.`, 'spell');
      await this.P.anim({ actor: 'hero', target: tgt && tgt.uid, kind: sp.heal ? 'heal' : sp.buff ? 'buff' : 'spell', type: sp.type || 'energia', aoe: !!sp.aoe });
      this.castCtx = { sp, hiddenDis: false, modDone: false };
      await this.resolveSpell(sp, spellId, lvl, tgt);
      this.castCtx = null;
    }

    // Metamagia Potencializada: rerrola os dados mais baixos (até CAR)
    empower(x) {
      const ctx = this.castCtx;
      if (!ctx || !ctx.empowered || ctx.empDone || !x || !x.vals) return x;
      ctx.empDone = true;
      let n = Math.max(1, C.mod(this.h, 'car'));
      const idx = x.vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
      for (const [v, i] of idx) { if (n <= 0 || v > x.s / 2) break; x.vals[i] = U.die(x.s); n--; }
      x.total = x.vals.reduce((a, b) => a + b, 0) + x.mod;
      this.say('Magia Potencializada: dados baixos rerrolados.', 'info');
      return x;
    }

    warMagicReady() {
      const t = this.turn;
      return !!t && C.hasFx(this.h, 'warMagic') && (t.attacksLeft > 0 || t.action > 0);
    }

    spellExtraDamage(baseType) {
      // bônus de catalisador (1×/turno)
      const h = this.h, t = this.turn, parts = [];
      // subclasses: atributo somado ao dano (Evocação Potencializada, Alma Radiante…) e dano psíquico extra
      const ctx = this.castCtx;
      if (ctx && !ctx.modDone) {
        ctx.modDone = true;
        for (const m of C.fxVals(h, 'spellDmgMod')) if ((m.types && m.types.includes(baseType)) || (m.schools && m.schools.includes(ctx.sp.school))) { const v = C.mod(h, m.ab); if (v > 0) parts.push({ amount: v, type: baseType, label: C.sub(h) ? C.sub(h).name : 'Subclasse' }); }
        for (const d of C.fxVals(h, 'spellDmg')) if (d.schools.includes(ctx.sp.school)) { const x = rollDice(d.dice); parts.push({ amount: x.total, type: d.type, dice: x, label: 'Feitiços Psíquicos' }); }
      }
      if (ctx && ctx.sp.level === 0 && !ctx.potentDone && C.fxVals(h, 'potentCantrip')[0] && ctx.sp.classes.includes(h.cls)) { ctx.potentDone = true; const v = C.mod(h, C.fxVals(h, 'potentCantrip')[0]); if (v > 0) parts.push({ amount: v, type: baseType, label: 'Conjuração Potente' }); }
      const f = C.equipped(h, 'focus');
      if (f && f.def.passive && f.def.passive.kind === 'spell' && !t.once.focus) {
        const v = f.def.passive.vals[f.refine - 1];
        t.once.focus = true;
        if (typeof v === 'number') parts.push({ amount: v, type: baseType, label: f.def.passive.name });
        else { const x = rollDice(v); parts.push({ amount: x.total, type: baseType, dice: x, label: f.def.passive.name }); }
      }
      // catalisador aprimorado: dano extra fixo 1×/turno
      if (f && f.dmgUp > 0 && !t.once.focusUp) { t.once.focusUp = true; parts.push({ amount: f.dmgUp, type: baseType, label: `${f.def.name} Nv. ${f.lv}` }); }
      return parts;
    }

    async resolveSpell(sp, id, lvl, target) {
      const h = this.h, hc = this.hc, t = this.turn;
      const dc = C.spellDC(h, sp) + (hc.innate > 0 ? 1 : 0);
      const castMod = C.mod(h, C.castAb(h));
      const upN = (expr) => {
        const d = U.parseDice(expr);
        const up = sp.up ? U.parseDice(sp.up) : null;
        const extra = up && lvl > sp.level ? (lvl - sp.level) * up.n : 0;
        return U.diceStr(d.n + extra, d.s, d.mod);
      };
      // ---- cura
      if (sp.heal) {
        let x = rollDice(upN(sp.heal));
        let amt = x.total + (sp.healMod ? castMod : 0);
        if (C.has(h, 'discipulo_vida') && lvl > 0) amt += 2 + lvl;
        amt += C.fxNum(h, 'healBonus');
        for (const slot of ['focus', 'weapon']) {
          const w = C.equipped(h, slot);
          if (w && w.def.passive && w.def.passive.kind === 'heal') amt += w.def.passive.vals[w.refine - 1];
        }
        await this.P.rollDamage({ who: 'hero', label: sp.name, parts: [{ amount: amt, type: 'cura', dice: x }], total: amt, heal: true });
        this.healHero(amt, sp.name);
        return;
      }
      // ---- efeitos pessoais das magias de 2024
      if (sp.cleanse) {
        const gone = sp.cleanse.filter((c) => hc.cond[c]);
        gone.forEach((c) => delete hc.cond[c]);
        this.say(gone.length ? `${sp.name}: ${gone.map((c) => R.CONDITIONS[c].name).join(', ')} encerrado.` : `${sp.name}: nenhuma condição para curar.`, 'good');
        this.P.update();
        return;
      }
      if (sp.temp) { this.giveTemp(rollDice(sp.temp).total + (sp.tempUp || 0) * Math.max(0, lvl - sp.level), sp.name); return; }
      if (sp.agathys) { hc.agathys = sp.agathys * lvl; this.giveTemp(sp.agathys * lvl, sp.name); this.say(`Gelo espectral te cobre: quem te acertar corpo a corpo sofre ${hc.agathys} de Frio.`, 'good'); return; }
      if (sp.mirror) { hc.mirror = sp.mirror; this.say(`${sp.mirror} duplicatas ilusórias surgem ao seu redor!`, 'good'); this.P.update(); return; }
      if (sp.sb) {
        hc.sb[sp.sb] = sp.conc ? 999 : sp.rounds || 10;
        if (sp.conc) hc.concSb = sp.sb;
        if (sp.sb === 'invis' || sp.sb === 'ginvis') hc.hidden = 99;
        if (sp.sb === 'heroism') { delete hc.cond.amedrontado; this.giveTemp(Math.max(1, castMod), sp.name); }
        const txt = { shillelagh: 'sua arma brilha com poder druídico.', heroism: 'coragem inabalável!', divineFavor: '+1d4 Radiante nos ataques com arma.', blur: 'ataques contra você têm Desvantagem.', invis: 'você desaparece!', ginvis: 'você desaparece — mesmo atacando!', magicWeapon: '+1 nos ataques e no dano com arma.', barkskin: 'sua CA mínima vira 17.', enlarge: 'você cresce: +1d4 de dano com arma.', haste: '+2 na CA e um ataque extra por turno!', mantle: '+1d4 Radiante nos ataques.', elemWeapon: '+1 no ataque e +1d4 de Fogo.', shroud: '+1d8 Radiante nos ataques.', stoneskin: 'Resistência a dano físico.', fireShield: 'Resistência a Frio e chamas retaliam.', deathWard: 'a morte terá que esperar.' }[sp.sb];
        this.say(`${sp.name}: ${txt || 'efeito ativo.'}`, 'good');
        this.P.update();
        return;
      }
      if (sp.weaponCast) { if (target) await this.weaponAttack(target, { castAb: true, trueStrike: true }); return; }
      if (sp.autoDmg) {
        const x = rollDice(upN(sp.dmg));
        const parts = [{ amount: x.total, type: sp.type, dice: x, label: sp.name }, ...this.spellExtraDamage(sp.type)];
        const total = parts.reduce((a, q) => a + q.amount, 0);
        await this.P.rollDamage({ who: 'hero', label: sp.name, parts, total });
        if (await this.damageEnemy(target, parts, { spell: true })) this.onKill(target);
        if (sp.dot) hc.dots = [{ id, lvl, targets: target.uid }];
        return;
      }
      // ---- buffs
      if (sp.buff) {
        if (sp.buff === 'abencoado') { hc.blessed = true; this.say('Bênção: +1d4 em ataques e testes de resistência.', 'good'); }
        if (sp.buff === 'escudo_fe') { hc.shieldOfFaith = true; this.say('Escudo da Fé: +2 na CA.', 'good'); }
        if (sp.buff === 'marca' || sp.buff === 'maldicao') { hc.mark = { uid: target.uid, type: sp.type, name: sp.name }; this.say(`${sp.name} em ${target.name}: +1d6 de ${dmgName(sp.type)} em cada acerto.`, 'good'); }
        if (sp.buff === 'armadura_arcana') { h.buffs.armadura_arcana = true; this.say(`Armadura Arcana: CA ${C.ac(h)}.`, 'good'); }
        if (sp.buff === 'auxilio') { h.buffs.auxilio = true; h.hp += 5; this.say('Auxílio: +5 PV máximos e atuais.', 'good'); }
        this.P.update();
        return;
      }
      if (sp.escape) { this.say('Você se teleporta para longe do combate!', 'good'); return this.finish('flee'); }
      // ---- invocação (Arma Espiritual)
      if (sp.summon) { hc.weaponSpirit = { dice: upN(sp.dmg), type: sp.type }; }
      // ---- mísseis mágicos
      if (sp.auto) {
        const darts = sp.darts + (lvl - sp.level);
        const parts = [];
        for (let i = 0; i < darts; i++) { const x = rollDice(sp.dmg); parts.push({ amount: x.total, type: sp.type, dice: x, label: `Dardo ${i + 1}` }); }
        parts.push(...this.spellExtraDamage(sp.type));
        const total = parts.reduce((a, p) => a + p.amount, 0);
        await this.P.rollDamage({ who: 'hero', label: sp.name, parts, total });
        if (await this.damageEnemy(target, parts, { spell: true })) this.onKill(target);
        return;
      }
      // ---- ataques mágicos (inclui raios múltiplos)
      if (sp.attack) {
        let shots = 1;
        if (sp.rays) shots = sp.rays + Math.max(0, lvl - sp.level);
        if (sp.beams) shots = h.level >= 11 ? 3 : h.level >= 5 ? 2 : 1;
        // Ataque do Aço Ventoso: cada golpe num inimigo diferente
        const spread = sp.spread ? [target, ...this.alive().filter((e) => e !== target)].slice(0, shots) : null;
        if (spread) shots = spread.length;
        for (let s = 0; s < shots; s++) {
          const tgt = spread ? (spread[s].dead ? null : spread[s]) : target.dead ? this.alive()[0] : target;
          if (!tgt) break;
          const prof = { ranged: sp.attack === 'dist', ability: C.castAb(h) };
          const { adv, dis } = this.heroAttackMods(tgt, prof, true);
          const r = this.d20(adv.length > 0, dis.length > 0, true);
          if (this.useLuck) { C.spend(h, 'sorte'); this.useLuck = false; }
          const blessDie = hc.blessed ? U.die(4) : 0;
          const bonus = C.spellAttack(h) + blessDie;
          let total = r.nat + bonus;
          let crit = r.nat === 20 || ((tgt.cond.paralisado || tgt.cond.adormecido) && sp.attack === 'cac');
          let hit = r.nat !== 1 && (r.nat === 20 || total >= tgt.ac);
          if (!hit && this.castCtx && this.castCtx.seeking && !this.castCtx.seekDone) {
            this.castCtx.seekDone = true;
            const r2 = this.d20(false, false, true);
            this.say(`Magia de Busca: novo d20 = ${r2.nat}.`, 'info');
            r.rolls = r2.rolls; r.nat = r2.nat; r.mode = r2.mode;
            total = r.nat + bonus; crit = r.nat === 20; hit = r.nat !== 1 && (crit || total >= tgt.ac);
          }
          if (hc.hidden && !hc.sb.ginvis) hc.hidden = 0;
          if (tgt.cond.iluminado) delete tgt.cond.iluminado;
          await this.P.rollD20({ who: 'hero', label: `${sp.name}${shots > 1 ? ` (${s + 1}/${shots})` : ''} → ${tgt.name}`, rolls: r.rolls, nat: r.nat, bonus, total, ac: tgt.ac, adv: r.mode === 'adv', dis: r.mode === 'dis', advWhy: adv, disWhy: dis, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
          if (!hit) { this.P.float(tgt.uid, 'Errou', 'miss'); this.say(`${sp.name} erra ${tgt.name}.`, 'miss'); if (sp.burst && sp.burst.all) await this.spellBurst(sp, lvl, tgt, dc); continue; }
          const dice = sp.level === 0 ? C.cantripDice(h, sp) : upN(sp.dmg);
          const x = this.empower(rollDice(dice, crit));
          const parts = [{ amount: x.total, type: sp.type, dice: x, label: sp.name }];
          if (id === 'rajada_mistica' && h.cls === 'bruxo' && h.level >= 2) parts.push({ amount: C.mod(h, 'car'), type: sp.type, label: 'Rajada Agonizante' });
          if (C.has(h, 'golpes_abencoados') && sp.level === 0 && !t.once.blessed) { const b = rollDice('1d8', crit); parts.push({ amount: b.total, type: 'radiante', dice: b, label: 'Golpes Abençoados' }); t.once.blessed = true; }
          if (hc.mark && hc.mark.uid === tgt.uid && id !== 'rajada_mistica') { /* marca só com ataques que acertam — magias também contam */ }
          if (hc.mark && hc.mark.uid === tgt.uid) { const m = rollDice('1d6', crit); parts.push({ amount: m.total, type: hc.mark.type, dice: m, label: hc.mark.name }); }
          parts.push(...this.spellExtraDamage(sp.type));
          const total2 = parts.reduce((a, p) => a + p.amount, 0);
          await this.P.rollDamage({ who: 'hero', label: crit ? 'CRÍTICO! ' + sp.name : sp.name, parts, total: total2, crit });
          const killed = await this.damageEnemy(tgt, parts, { spell: true, crit });
          if (killed) { this.onKill(tgt); continue; }
          if (sp.drain) this.healHero(Math.floor(total2 / 2), sp.name);
          if (sp.cond) {
            if (sp.condSave) {
              const ok = this.enemySave(tgt, sp.condSave, dc, true);
              await this.showEnemySave(tgt, sp.condSave, ok, dc, sp.name);
              if (!ok.ok) { tgt.cond[sp.cond] = { src: 'hero', save: sp.condSave, dc }; this.say(`${tgt.name}: ${R.CONDITIONS[sp.cond].name}.`, 'good'); }
            } else { tgt.cond[sp.cond] = { src: 'hero' }; this.say(`${tgt.name}: ${R.CONDITIONS[sp.cond]?.name || sp.cond}.`, 'info'); }
          }
          if (sp.later) tgt.later = { dice: sp.later, type: sp.type, name: sp.name };
          if (sp.burst) await this.spellBurst(sp, lvl, tgt, dc);
        }
        return;
      }
      // ---- magias de teste de resistência
      if (sp.save) {
        let targets = sp.aoe ? this.alive().slice(0, sp.aoe) : [target];
        if (sp.onlyType && target.def.type !== sp.onlyType) {
          this.say(`${sp.name} só afeta ${M.TYPES[sp.onlyType]}s — ${target.name} não é afetado.`, 'bad');
          if (sp.conc) this.endConc();
          return;
        }
        let roll = null;
        if (sp.dmg) {
          const base = sp.hurtDmg && target.hp < target.maxHp ? Object.assign({}, sp, { dmg: sp.hurtDmg }) : sp;
          const dice = sp.level === 0 ? C.cantripDice(h, base) : upN(base.dmg);
          roll = this.empower(rollDice(dice));
          const parts = [{ amount: roll.total, type: sp.type, dice: roll, label: sp.name }, ...this.spellExtraDamage(sp.type)];
          const total = parts.reduce((a, p) => a + p.amount, 0);
          roll.total = total;
          await this.P.rollDamage({ who: 'hero', label: `${sp.name} · TR de ${R.AB[sp.save].name} CD ${dc}`, parts, total });
        }
        for (const e of targets) {
          const ok = this.enemySave(e, sp.save, dc, true);
          await this.showEnemySave(e, sp.save, ok, dc, sp.name);
          if (roll) {
            let amt = ok.ok ? (sp.half ? Math.floor(roll.total / 2) : (sp.level === 0 && C.has(h, 'truque_potente') ? Math.floor(roll.total / 2) : 0)) : roll.total;
            if (amt > 0 && await this.damageEnemy(e, [{ amount: amt, type: sp.type }], { spell: true })) { this.onKill(e); continue; }
            if (amt === 0) this.P.float(e.uid, 'Resistiu', 'miss');
          }
          if (!ok.ok && sp.cond && !e.dead) {
            const cond = sp.cond === 'iluminado_conc' ? 'iluminado_conc' : sp.cond;
            if (e.def.condImm && e.def.condImm.includes(cond)) { this.say(`${e.name} é imune a ${R.CONDITIONS[cond]?.name || cond}.`, 'info'); continue; }
            if (cond === 'lentificado' && !e.cond.lentificado) e.ac -= 2;
            e.cond[cond] = { src: 'hero', save: sp.save, dc, conc: !!sp.conc };
            if (cond === 'banido') this.say(`${e.name} desaparece para outro plano!`, 'good');
            else this.say(`${e.name}: ${R.CONDITIONS[cond]?.name || cond}!`, 'good');
          }
        }
        if (sp.dot) hc.dots = [{ id, lvl, targets: sp.aoe ? 'all' : target.uid }];
        if (sp.conc && !sp.dot && !this.alive().some((e) => Object.values(e.cond).some((c) => c.conc))) {
          // nenhum alvo afetado: concentração se mantém só se houver efeito
          if (!sp.buff) this.endConc(true);
        }
        return;
      }
      // ---- Arma Espiritual (ataque inicial)
      if (sp.summon) await this.spiritAttack(target, true);
    }

    async spiritAttack(target, initial) {
      const h = this.h, hc = this.hc;
      if (!hc.weaponSpirit) return;
      if (!initial) { if (this.turn.bonus <= 0) return; this.turn.bonus--; }
      const tgt = target && !target.dead ? target : this.alive()[0];
      if (!tgt) return;
      this.busy = true;
      try {
        const r = this.d20(false, false, true);
        const bonus = C.spellAttack(h);
        const total = r.nat + bonus;
        const crit = r.nat === 20;
        const hit = r.nat !== 1 && (crit || total >= tgt.ac);
        await this.P.anim({ actor: 'hero', target: tgt.uid, kind: 'spell', type: 'energia' });
        await this.P.rollD20({ who: 'hero', label: `Arma Espiritual → ${tgt.name}`, rolls: r.rolls, nat: r.nat, bonus, total, ac: tgt.ac, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack' });
        if (hit) {
          const x = rollDice(hc.weaponSpirit.dice, crit);
          const parts = [{ amount: x.total + C.mod(h, C.castAb(h)), type: 'energia', dice: x, label: 'Arma Espiritual' }];
          await this.P.rollDamage({ who: 'hero', label: 'Arma Espiritual', parts, total: parts[0].amount, crit });
          if (await this.damageEnemy(tgt, parts, { spell: true })) this.onKill(tgt);
        } else this.P.float(tgt.uid, 'Errou', 'miss');
      } finally { this.busy = false; }
      if (!initial) this.afterHeroAction();
    }

    async tickDots() {
      const h = this.h, hc = this.hc;
      for (const d of hc.dots) {
        const sp = S.SPELLS[d.id];
        const dc = C.spellDC(h);
        const targets = d.targets === 'all' ? this.alive() : [this.enemy(d.targets)].filter((e) => e && !e.dead);
        if (!targets.length) continue;
        const dice = U.diceStr(U.parseDice(sp.dmg).n + (sp.up ? Math.max(0, d.lvl - sp.level) : 0), U.parseDice(sp.dmg).s, U.parseDice(sp.dmg).mod);
        const x = rollDice(dice);
        this.say(`${sp.name} continua ativo.`, 'spell');
        await this.P.rollDamage({ who: 'hero', label: `${sp.name} (contínuo)`, parts: [{ amount: x.total, type: sp.type, dice: x }], total: x.total });
        for (const e of targets) {
          const ok = sp.save ? this.enemySave(e, sp.save, dc, true) : { ok: false };
          const amt = ok.ok ? Math.floor(x.total / 2) : x.total;
          if (await this.damageEnemy(e, [{ amount: amt, type: sp.type }], { spell: true })) this.onKill(e);
        }
      }
    }

    // explosão secundária (Faca de Gelo, Flecha Relâmpago)
    async spellBurst(sp, lvl, tgt, dc) {
      const b = sp.burst;
      const up = b.up && lvl > sp.level ? U.parseDice(b.up).n * (lvl - sp.level) : 0;
      const d = U.parseDice(b.dice);
      const y = rollDice(U.diceStr(d.n + up, d.s, d.mod));
      for (const o of this.alive().filter((e) => b.all || e.uid !== tgt.uid)) {
        const ok = this.enemySave(o, b.save, dc, true);
        await this.showEnemySave(o, b.save, ok, dc, sp.name);
        const amt = ok.ok ? Math.floor(y.total / 2) : y.total;
        if (amt > 0 && await this.damageEnemy(o, [{ amount: amt, type: b.type }], { spell: true })) this.onKill(o);
      }
    }
    // remove uma condição de um inimigo (desfaz a penalidade de CA da Lentidão)
    dropCond(e, c) {
      if (c === 'lentificado' && e.cond.lentificado) e.ac += 2;
      delete e.cond[c];
    }

    startConc(id) {
      if (this.hc.conc) this.endConc();
      this.hc.conc = id;
      this.say(`Concentrando em ${S.SPELLS[id].name}.`, 'sys');
    }
    endConc(silent) {
      const hc = this.hc;
      if (!hc.conc) return;
      const name = S.SPELLS[hc.conc].name;
      hc.conc = null; hc.blessed = false; hc.shieldOfFaith = false; hc.mark = null; hc.weaponSpirit = false; hc.dots = [];
      if (hc.concSb) { if ((hc.concSb === 'invis' || hc.concSb === 'ginvis') && hc.hidden === 99) hc.hidden = 0; delete hc.sb[hc.concSb]; hc.concSb = null; }
      for (const e of this.enemies) for (const [k, v] of Object.entries(e.cond)) if (v.conc) this.dropCond(e, k);
      if (!silent) this.say(`A concentração em ${name} se desfaz.`, 'bad');
      this.P.update();
    }

    // ------------------------------------------------------------ outras ações
    async dodge() {
      if (!this.canAct() || this.turn.action <= 0) return;
      this.turn.action--;
      this.hc.dodge = true;
      this.say(`${this.h.name} assume postura defensiva (Esquivar): ataques contra você têm Desvantagem.`, 'info');
      this.afterHeroAction();
    }
    async hide(bonus) {
      if (!this.canAct()) return;
      const t = this.turn;
      if (bonus) { if (t.bonus <= 0) return; t.bonus--; } else { if (t.action <= 0) return; t.action--; }
      this.busy = true;
      try {
        const res = await this.skillCheck('furtividade', 15, 'Esconder', C.hasFx(this.h, 'hideAdv'));
        if (res.ok) { this.hc.hidden = res.total; this.say('Você se esconde nas sombras: próximo ataque com Vantagem.', 'good'); }
        else this.say('Não há onde se esconder — você foi visto.', 'bad');
      } finally { this.busy = false; }
      this.afterHeroAction();
    }
    async flee() {
      if (!this.canAct() || this.turn.action <= 0) return;
      const hc = this.hc;
      if (hc.cond.agarrado) { this.say('Você está Agarrado e não consegue fugir!', 'bad'); return; }
      this.turn.action--;
      this.busy = true;
      try {
        const alive = this.alive();
        if (alive.every((e) => e.cond.lento || e.cond.empurrado || INCAP.some((c) => e.cond[c]))) {
          this.say('Os inimigos não conseguem acompanhar. Você escapa!', 'good');
          return this.finish('flee');
        }
        const sk = C.skillBonus(this.h, 'acrobacia') >= C.skillBonus(this.h, 'atletismo') ? 'acrobacia' : 'atletismo';
        const dc = 10 + alive.length + (this.isBoss ? 5 : 0);
        const res = await this.skillCheck(sk, dc, 'Fugir (Desengajar)');
        if (res.ok) { this.say('Você Desengaja e corre para longe!', 'good'); return this.finish('flee'); }
        this.say('Os inimigos bloqueiam sua rota de fuga.', 'bad');
      } finally { this.busy = false; }
      this.afterHeroAction();
    }
    async usePotion(itemId) {
      const h = this.h, t = this.turn;
      if (!this.canAct() || t.bonus <= 0 || !(h.inventory[itemId] > 0)) return;
      const it = R.ITEMS[itemId];
      t.bonus--;
      h.inventory[itemId]--;
      this.busy = true;
      try {
        const x = rollDice(it.heal);
        await this.P.anim({ actor: 'hero', kind: 'heal' });
        await this.P.rollDamage({ who: 'hero', label: it.name, parts: [{ amount: x.total, type: 'cura', dice: x }], total: x.total, heal: true });
        this.healHero(x.total, it.name);
      } finally { this.busy = false; }
      this.afterHeroAction();
    }

    // Propriedade Leve (2024): depois de atacar com arma Leve, um ataque extra com a outra mão como Ação Bônus
    // (com a Maestria Ágil, o ataque extra faz parte da ação Atacar)
    canOffhand() {
      const t = this.turn;
      if (!t || !t.attacked || t.once.offhand) return false;
      const prof = C.attackProfile(this.h);
      if (prof.base === 'desarmado' || !prof.light) return false;
      return t.bonus > 0 || prof.mastery === 'agil';
    }
    async offhandAttack(targetUid) {
      if (!this.canAct() || !this.canOffhand()) return;
      const t = this.turn, nick = C.attackProfile(this.h).mastery === 'agil';
      if (!nick) t.bonus--;
      t.once.offhand = true;
      this.busy = true;
      try {
        const target = this.enemy(targetUid) && !this.enemy(targetUid).dead ? this.enemy(targetUid) : this.alive()[0];
        this.say(nick ? 'Maestria Ágil: ataque extra com a arma Leve, sem gastar a Ação Bônus.' : 'Ataque extra com a outra arma Leve.', 'info');
        if (target) await this.weaponAttack(target, { offhand: true });
      } finally { this.busy = false; }
      this.afterHeroAction();
    }

    // Recursos de classe e espécie (Ação Bônus ou especiais)
    async classAbility(id, targetUid) {
      if (!this.canAct()) return;
      const h = this.h, hc = this.hc, t = this.turn;
      const needBonus = ['furia', 'folego', 'impor', 'adrenalina', 'inata', 'mira', 'esconder_b', 'artes', 'rajada', 'paciente', 'revelacao', 'arma_espiritual', 'forma', 'salto_nuvens', 'forma_grande'].includes(id);
      const needAction = ['centelha', 'centelha_dano', 'maos_curativas'].includes(id);
      if (needBonus && t.bonus <= 0) return;
      if (needAction && t.action <= 0) return;
      this.busy = true;
      try {
        if (id === 'furia') {
          if (C.res(h, 'furia') <= 0 || hc.raging) return;
          C.spend(h, 'furia'); t.bonus--; hc.raging = true; hc.rageRounds = 0; hc.fanatic = false;
          if (hc.conc) this.endConc();
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'fogo' });
          this.say(`${h.name} entra em FÚRIA! +${C.rageDamage(h)} de dano e Resistência a dano ${C.hasFx(h, 'rageResistAll') ? 'de todos os tipos (exceto Energia, Necrótico, Psíquico e Radiante)' : 'físico'}.`, 'good');
          for (const c of C.fxArr(h, 'condImmRage')) if (hc.cond[c]) { delete hc.cond[c]; this.say(`A Fúria Irracional encerra: ${R.CONDITIONS[c].name}.`, 'good'); }
          if (C.hasFx(h, 'rageTemp')) this.giveTemp(h.level, 'Vitalidade da Árvore');
        }
        if (id === 'folego') {
          if (C.res(h, 'folego') <= 0) return;
          C.spend(h, 'folego'); t.bonus--;
          const x = rollDice('1d10');
          const amt = x.total + h.level;
          await this.P.anim({ actor: 'hero', kind: 'heal' });
          await this.P.rollDamage({ who: 'hero', label: 'Retomar o Fôlego', parts: [{ amount: amt, type: 'cura', dice: x }], total: amt, heal: true });
          this.healHero(amt, 'Retomar o Fôlego');
        }
        if (id === 'surto') {
          if (C.res(h, 'surto') <= 0 || t.surge) return;
          C.spend(h, 'surto'); t.action++; t.surge = true;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'energia' });
          this.say('SURTO DE AÇÃO! Você ganha uma ação extra.', 'good');
        }
        if (id === 'descuidado') { hc.reckless = !hc.reckless; this.say(hc.reckless ? 'Ataque Descuidado: Vantagem nos ataques de Força, mas os inimigos também terão Vantagem.' : 'Ataque Descuidado cancelado.', 'info'); }
        if (id === 'impor') {
          const pool = C.res(h, 'impor');
          const missing = C.maxHp(h) - h.hp;
          if (pool <= 0 || missing <= 0) return;
          const amt = Math.min(pool, missing);
          C.spend(h, 'impor', amt); t.bonus--;
          await this.P.anim({ actor: 'hero', kind: 'heal' });
          this.healHero(amt, 'Impor as Mãos');
        }
        if (id === 'adrenalina') {
          if (C.res(h, 'adrenalina') <= 0) return;
          C.spend(h, 'adrenalina'); t.bonus--;
          this.giveTemp(C.pb(h), 'Surto de Adrenalina');
        }
        if (id === 'inata') {
          if (C.res(h, 'inata') <= 0) return;
          C.spend(h, 'inata'); t.bonus--; hc.innate = 10;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'psiquico' });
          this.say('Feitiçaria Inata: +1 na CD e Vantagem em ataques mágicos.', 'good');
        }
        if (id === 'mira') { t.bonus--; hc.steady = true; this.say('Mira Firme: Vantagem no próximo ataque.', 'good'); }
        if (id === 'esconder_b') { t.bonus++; this.busy = false; t.bonus--; await this.hide(true); return; }
        if (id === 'artes') {
          t.bonus--;
          const target = this.enemy(targetUid) || this.alive()[0];
          await this.weaponAttack(target, { unarmed: true });
        }
        if (id === 'rajada') {
          if (C.res(h, 'foco') <= 0) return;
          C.spend(h, 'foco'); t.bonus--;
          this.say('RAJADA DE GOLPES!', 'good');
          for (let i = 0; i < (C.hasFx(h, 'heightenedFocus') ? 3 : 2); i++) {
            const target = this.enemy(targetUid) && !this.enemy(targetUid).dead ? this.enemy(targetUid) : this.alive()[0];
            if (!target) break;
            const landed = await this.weaponAttack(target, { unarmed: true });
            if (landed && C.has(h, 'mao_aberta') && !target.dead && !target.cond.caido) {
              const dc = 8 + C.mod(h, 'sab') + C.pb(h);
              const ok = this.enemySave(target, 'des', dc);
              await this.showEnemySave(target, 'des', ok, dc, 'Mão Aberta');
              if (!ok.ok) { target.cond.caido = { src: 'hero' }; this.say(`${target.name} é derrubado!`, 'good'); }
            }
            if (this.checkEnd()) break;
          }
        }
        if (id === 'paciente') {
          t.bonus--;
          if (C.res(h, 'foco') > 0) { C.spend(h, 'foco'); hc.dodge = true; this.say('Defesa Paciente: Desengajar + Esquivar.', 'good'); if (C.hasFx(h, 'heightenedFocus')) this.giveTemp(rollDice(`2d${this.martialDie()}`).total, 'Foco Elevado'); }
        }
        if (id === 'centelha' || id === 'centelha_dano') {
          if (C.res(h, 'canalizar') <= 0) return;
          C.spend(h, 'canalizar'); t.action--;
          const dice = h.level >= 7 ? '2d8' : '1d8';
          const x = rollDice(dice);
          const amt = x.total + C.mod(h, 'sab');
          if (id === 'centelha') {
            await this.P.anim({ actor: 'hero', kind: 'heal' });
            await this.P.rollDamage({ who: 'hero', label: 'Centelha Divina', parts: [{ amount: amt, type: 'cura', dice: x }], total: amt, heal: true });
            this.healHero(amt, 'Centelha Divina');
          } else {
            const target = this.enemy(targetUid) || this.alive()[0];
            const dc = C.spellDC(h);
            await this.P.anim({ actor: 'hero', target: target.uid, kind: 'spell', type: 'radiante' });
            await this.P.rollDamage({ who: 'hero', label: `Centelha Divina · TR Con CD ${dc}`, parts: [{ amount: amt, type: 'radiante', dice: x }], total: amt });
            const ok = this.enemySave(target, 'con', dc, true);
            await this.showEnemySave(target, 'con', ok, dc, 'Centelha Divina');
            if (await this.damageEnemy(target, [{ amount: ok.ok ? Math.floor(amt / 2) : amt, type: 'radiante' }], { spell: true })) this.onKill(target);
          }
        }
        if (id === 'arma_sagrada') {
          if (C.res(h, 'canalizar') <= 0 || hc.sacred) return;
          C.spend(h, 'canalizar'); hc.sacred = true;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'radiante' });
          this.say(`Arma Sagrada: +${Math.max(1, C.mod(h, 'car'))} nas jogadas de ataque.`, 'good');
        }
        if (id === 'maos_curativas') {
          if (C.res(h, 'maos_curativas') <= 0) return;
          C.spend(h, 'maos_curativas'); t.action--;
          const x = rollDice(`${C.pb(h)}d4`);
          await this.P.anim({ actor: 'hero', kind: 'heal' });
          await this.P.rollDamage({ who: 'hero', label: 'Mãos Curativas', parts: [{ amount: x.total, type: 'cura', dice: x }], total: x.total, heal: true });
          this.healHero(x.total, 'Mãos Curativas');
        }
        if (id === 'revelacao') {
          if (h.level < 3 || hc.revelation || (h.used || {}).revelacao) return;
          const form = this.P.ask ? await this.P.ask({ title: 'Revelação Celestial', text: 'Escolha a transformação (1 minuto).', options: [{ id: 'asas', label: 'Asas Celestiais (Deslocamento de Voo)' }, { id: 'radiancia', label: 'Radiância Interior (dano Radiante ao redor no fim de cada turno seu)' }, { id: 'mortalha', label: 'Mortalha Necrótica (TR de Carisma ou Amedrontado)' }] }) : 'asas';
          if (!form || form === 'no') return;
          C.spend(h, 'revelacao'); t.bonus--; hc.revelation = form; hc.revelationRounds = 10;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: form === 'mortalha' ? 'necrotico' : 'radiante' });
          this.say(`Revelação Celestial (${{ asas: 'Asas Celestiais', radiancia: 'Radiância Interior', mortalha: 'Mortalha Necrótica' }[form]}): +${C.pb(h)} de dano ${form === 'mortalha' ? 'Necrótico' : 'Radiante'} uma vez por turno.`, 'good');
          if (form === 'mortalha') {
            const dc = 8 + C.mod(h, 'car') + C.pb(h);
            for (const e of this.alive()) {
              if ((e.def.condImm || []).includes('amedrontado')) continue;
              const ok = this.enemySave(e, 'car', dc); await this.showEnemySave(e, 'car', ok, dc, 'Mortalha Necrótica');
              if (!ok.ok) e.cond.amedrontado = { src: 'mortalha', until: this.round + 1 };
            }
          }
        }
        if (id === 'salto_nuvens') {
          const gi = C.giant(h); if (!gi || gi.id !== 'nuvem' || C.res(h, 'gigante') <= 0) return;
          C.spend(h, 'gigante'); t.bonus--;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'energia' });
          this.say('Salto das Nuvens: você se teletransporta 9 m para longe dos inimigos e escapa!', 'good');
          return this.finish('flee');
        }
        if (id === 'forma_grande') {
          if (h.species !== 'golias' || h.level < 5 || hc.large || C.res(h, 'forma_grande') <= 0) return;
          C.spend(h, 'forma_grande'); t.bonus--; hc.large = true;
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'concussao' });
          this.say('Forma Grande: você cresce até o tamanho Grande (Vantagem em testes de Força).', 'good');
        }
        if (id === 'forma') {
          if (C.res(h, 'forma') <= 0) return;
          C.spend(h, 'forma'); t.bonus--;
          const wf = C.fxVals(h, 'wildForm')[0];
          await this.P.anim({ actor: 'hero', kind: 'buff', type: 'veneno' });
          if (wf) { hc.wild = true; this.giveTemp(wf.tempMult * h.level, 'Formas do Círculo'); this.say(`Forma Selvagem de combate: CA mínima ${wf.acBase + C.mod(h, 'sab')}.`, 'good'); }
          else this.giveTemp(h.level, 'Forma Selvagem');
        }
        if (id === 'sorte') { if (C.res(h, 'sorte') > 0) { this.useLuck = !this.useLuck; this.say(this.useLuck ? 'Sorte: o próximo Teste de d20 terá Vantagem.' : 'Sorte guardada.', 'info'); } }
        if (id === 'criar_espaco') {
          // Fonte de Magia: converte Pontos de Feitiçaria em um espaço de 1º círculo (2 pontos)
          if (C.res(h, 'feiticaria') < 2) return;
          C.spend(h, 'feiticaria', 2); t.bonus--;
          const su = h.slotsUsed || [];
          if (su[0] > 0) su[0]--; h.slotsUsed = su;
          this.say('Fonte de Magia: você converte 2 Pontos de Feitiçaria num espaço de 1º círculo.', 'good');
        }
      } finally { this.busy = false; }
      this.afterHeroAction();
    }

    afterHeroAction() {
      this.P.update();
      if (this.checkEnd()) return;
      if (this.h.hp <= 0) return this.endHeroTurn(true);
      this.P.heroTurn();
    }

    // ------------------------------------------------------------ dano e cura
    healHero(amt, src) {
      const h = this.h;
      if (this.hc.noHeal) { this.say(`${src}: a Podridão de Múmia impede a cura.`, 'bad'); return; }
      const before = h.hp;
      h.hp = Math.min(C.maxHp(h), Math.max(0, h.hp) + amt);
      if (before <= 0 && h.hp > 0) { h.deathSaves = { s: 0, f: 0 }; this.say(`${h.name} volta à consciência!`, 'good'); }
      this.P.float('hero', '+' + (h.hp - Math.max(0, before)), 'heal');
      this.say(`${src}: ${h.name} recupera ${h.hp - Math.max(0, before)} PV.`, 'good');
      this.P.update();
    }
    giveTemp(n, src) {
      const h = this.h;
      if (n > (h.tempHp || 0)) {
        h.tempHp = n;
        this.P.float('hero', `+${n} PV temp.`, 'temp');
        this.say(`${src}: ${n} PV temporários.`, 'good');
      }
      this.P.update();
    }

    // aplica dano ao inimigo; retorna true se morreu
    async damageEnemy(e, parts, opts = {}) {
      if (e.dead) return false;
      let total = 0;
      const def = e.def;
      for (const p of parts) {
        let amt = p.amount;
        if (def.absorb && p.type === def.absorb) { const hl = Math.min(amt, e.maxHp - e.hp); e.hp += hl; this.P.float(e.uid, '+' + hl, 'heal'); this.say(`${e.name} absorve o dano ${dmgName(p.type)} e recupera ${hl} PV!`, 'bad'); continue; }
        if ((def.immune || []).includes(p.type)) { amt = 0; this.P.float(e.uid, 'Imune', 'miss'); }
        else if ((def.resist || []).includes(p.type) && !(opts.spell && C.fxVals(this.h, 'elemAdept')[0] === p.type)) amt = Math.floor(amt / 2);
        else if ((def.vuln || []).includes(p.type)) amt *= 2;
        if (p.type === 'fogo' || p.type === 'acido') e.tookFireAcid = true;
        if (def.aversion && p.type === def.aversion && amt > 0 && !e.averse) { e.averse = 2; this.say(`${e.name} recua diante do fogo (Desvantagem nos ataques).`, 'info'); }
        if (amt > 0) this.P.float(e.uid, amt, p.type, { crit: opts.crit });
        total += amt;
      }
      if (total <= 0) return false;
      e.hp -= total;
      delete e.cond.adormecido;
      if (!opts.sear && e.cond.incapacitado && e.cond.incapacitado.turned) { delete e.cond.incapacitado; delete e.cond.amedrontado; }
      this.say(`${e.name} sofre ${total} de dano.`, 'dmg');
      await this.P.hit(e.uid, opts.crit);
      // Fortitude de Morto-Vivo
      if (e.hp <= 0 && def.traits && def.traits.some((t) => t[0] === 'fortitude_morto') && !opts.crit && !parts.some((p) => p.type === 'radiante')) {
        const dc = 5 + total;
        const sv = this.enemySave(e, 'con', dc);
        if (sv.ok) { e.hp = 1; this.say(`${e.name} se recusa a cair! (Fortitude de Morto-Vivo)`, 'bad'); this.P.update(); return false; }
      }
      if (e.hp <= 0) {
        e.hp = 0; e.dead = true;
        await this.P.death(e.uid);
        return true;
      }
      this.P.update();
      return false;
    }

    // criatura nova no combate (Animar Árvores do Ente, Criar Espectro da Aparição)
    async summonEnemy(key, src, label) {
      const s = this.makeEnemy(key, this.enemies.length);
      const n = this.enemies.filter((x) => x.key === key).length;
      s.name = `${s.def.name} ${label || 'ABCDEFG'[n] || ''}`.trim();
      s.init = src.init - 1; s.summonedBy = src.uid;
      this.enemies.push(s);
      this.order.splice(this.order.findIndex((o) => o.uid === src.uid) + 1, 0, { side: 'enemy', uid: s.uid, init: s.init, dex: s.def.ab.des });
      await this.P.summon(s);
      return s;
    }
    // ações de invocação do Manual dos Monstros (só quando o bloco de estatísticas tem)
    async enemySummonAction(e) {
      const sa = e.def.summonAct;
      if (!sa) return false;
      if (sa.kind === 'animate' && !e.summonUsed && (e.hp < e.maxHp || this.round >= 2)) {
        e.summonUsed = true;
        this.say(`${e.name} usa ${sa.name}!`, 'boss');
        for (let i = 0; i < sa.n; i++) await this.summonEnemy(sa.key, e);
        return true;
      }
      if (sa.kind === 'raise') {
        const corpse = this.enemies.find((x) => x.dead && !x.raised && x.def.type === 'humanoide');
        if (corpse && this.enemies.filter((x) => x.key === sa.key && !x.dead).length < (sa.max || 7)) {
          corpse.raised = true;
          this.say(`${e.name} usa ${sa.name}: o espírito de ${corpse.name} se ergue!`, 'boss');
          await this.summonEnemy(sa.key, e);
          return true;
        }
      }
      return false;
    }

    onKill(e) {
      const h = this.h;
      this.say(`${e.name} foi derrotado!`, 'good');
      if (C.has(h, 'bencao_sombrio')) this.giveTemp(C.mod(h, 'car') + h.level, 'Bênção do Sombrio');
      for (const kt of C.fxVals(h, 'killTemp')) this.giveTemp(typeof kt === 'function' ? kt(h) : kt, 'Subclasse');
      if (this.hc.mark && this.hc.mark.uid === e.uid) this.hc.mark.uid = null;
    }

    // dano no herói; retorna dano efetivo
    // Refletir Golpes (tipo físico Gordo) — mecânica própria do jogo, não é regra de D&D: chance de devolver parte do
    // dano corpo a corpo realmente sofrido a quem atacou; no máximo uma vez por rodada e nunca refletindo um reflexo.
    async reflectBlow(taken, parts, opts) {
      const cfg = E.C.REFLECT, h = this.h, hc = this.hc, src = opts.src;
      if (!cfg || !(taken > 0) || !opts.attack || !opts.melee || opts.reflected || !src || src.dead || h.hp <= 0) return 0;
      if (!h.look || h.look.build !== 'gordo' || hc.reflectRound === this.round) return 0;
      if (Math.random() >= cfg.chance) return 0;
      hc.reflectRound = this.round;
      const amount = Math.max(1, Math.floor(taken * cfg.fraction));
      this.say(`Refletir Golpes! ${h.name} absorve o impacto com o corpo e devolve ${amount} de dano a ${src.name}.`, 'good');
      if (this.P.reflect) await this.P.reflect(src.uid);
      if (await this.damageEnemy(src, [{ amount, type: (parts[0] && parts[0].type) || 'concussao' }], { reflected: true })) this.onKill(src);
      return amount;
    }
    async damageHero(parts, opts = {}) {
      const h = this.h, hc = this.hc;
      let total = 0;
      for (const p of parts) {
        let amt = p.amount;
        const res = C.speciesResist(h);
        if (hc.raging) res.push('concussao', 'cortante', 'perfurante');
        res.push(...C.fxArr(h, 'resist'));
        if (hc.raging && C.hasFx(h, 'rageResistAll') && !['energia', 'necrotico', 'psiquico', 'radiante'].includes(p.type)) res.push(p.type);
        if (hc.sb.seaAura && C.hasFx(h, 'stormborn')) res.push('frio', 'eletrico', 'trovejante');
        if (hc.sb.stoneskin) res.push('concussao', 'cortante', 'perfurante');
        if (hc.sb.fireShield) res.push('frio');
        const w = C.equipped(h, 'weapon');
        if (w && w.def.passive && w.def.passive.resist) res.push(w.def.passive.resist);
        if (res.includes(p.type)) amt = Math.floor(amt / 2);
        total += amt;
      }
      // Desviar Ataques (Monge 3)
      if (opts.attack && C.has(h, 'desviar') && !this.reactionUsed && parts.some((p) => ['concussao', 'cortante', 'perfurante'].includes(p.type))) {
        const red = U.die(10) + C.mod(h, 'des') + h.level;
        total = Math.max(0, total - red);
        this.reactionUsed = true;
        this.say(`Desviar Ataques reduz o dano em ${red}.`, 'good');
      }
      // Esquiva Sobrenatural (Ladino 5)
      if (opts.attack && C.has(h, 'esquiva_sobrenatural') && !this.reactionUsed && total > 0) {
        total = Math.floor(total / 2);
        this.reactionUsed = true;
        this.say('Esquiva Sobrenatural: dano reduzido à metade.', 'good');
      }
      // Mestre em Armadura Pesada
      if (C.hasFx(h, 'heavyArmorRed') && R.ARMOR[h.equip.armor] && R.ARMOR[h.equip.armor].type === 'pesada' && total > 0 && parts.some((p) => ['concussao', 'cortante', 'perfurante'].includes(p.type))) { const red = Math.min(total, C.pb(h)); total -= red; this.say(`Mestre em Armadura Pesada: −${red} de dano.`, 'good'); }
      // Defesas Sedutoras (Arquifada 10): Reação depois de ser atingido — metade do dano e reflexo psíquico
      if (opts.attack && opts.src && !opts.src.dead && total >= 6 && C.hasFx(h, 'beguilingDefenses') && C.res(h, 'defesas') > 0 && !this.reactionUsed && h.hp > 0) {
        const ch = await this.P.ask({ title: 'Defesas Sedutoras', text: `Você vai sofrer ${total} de dano. Usar a Reação para reduzir à metade e devolver o dano como Psíquico?`, options: [{ id: 'yes', label: 'Seduzir o atacante' }, { id: 'no', label: 'Não' }] });
        if (ch === 'yes') {
          C.spend(h, 'defesas'); this.reactionUsed = true; total = Math.floor(total / 2);
          const dc = C.spellDC(h), ok = this.enemySave(opts.src, 'sab', dc, true);
          await this.showEnemySave(opts.src, 'sab', ok, dc, 'Defesas Sedutoras');
          if (!ok.ok && await this.damageEnemy(opts.src, [{ amount: total, type: 'psiquico' }], { spell: true })) this.onKill(opts.src);
        }
      }
      // Campo Protetor (Guerreiro Psíquico)
      if (opts.attack && total >= 4 && C.hasFx(h, 'psiShield') && !this.reactionUsed && C.res(h, 'psionico') > 0 && h.hp > 0) {
        const ch = await this.P.ask({ title: 'Campo Protetor', text: `Você vai sofrer ${total} de dano. Usar a reação e 1 dado psiônico para reduzir em 1d${this.psiDie()} + INT?`, options: [{ id: 'yes', label: 'Erguer o Campo Protetor' }, { id: 'no', label: 'Não' }] });
        if (ch === 'yes') { C.spend(h, 'psionico'); this.reactionUsed = true; const red = U.die(this.psiDie()) + Math.max(0, C.mod(h, 'int')); total = Math.max(0, total - red); this.say(`Campo Protetor reduz o dano em ${red}.`, 'good'); }
      }
      // Escudo do Pensamento (Grande Antigo 10): quem causa dano Psíquico sofre o mesmo
      if (opts.src && !opts.src.dead && C.hasFx(h, 'thoughtShield')) { const psy = parts.filter((p) => p.type === 'psiquico').reduce((a, p) => a + Math.floor(p.amount / 2), 0); if (psy > 0) { this.say(`Escudo do Pensamento: ${opts.src.name} sofre ${psy} de dano Psíquico.`, 'good'); if (await this.damageEnemy(opts.src, [{ amount: psy, type: 'psiquico' }], {})) this.onKill(opts.src); } }
      // Golias: Resistência da Pedra (reduz 1d12 + CON) ou Trovão da Tempestade (1d8 Trovejante em quem causou o dano)
      const gi = C.giant(h);
      if (gi && total > 0 && !this.reactionUsed && h.hp > 0 && C.res(h, 'gigante') > 0) {
        if (gi.id === 'pedra' && total >= 4) { C.spend(h, 'gigante'); this.reactionUsed = true; const red = Math.max(0, U.die(12) + C.mod(h, 'con')); total = Math.max(0, total - red); this.say(`Resistência da Pedra reduz o dano em ${red}.`, 'good'); }
        else if (gi.id === 'tempestade' && opts.src && !opts.src.dead) { C.spend(h, 'gigante'); this.reactionUsed = true; const x = rollDice('1d8'); this.say(`Trovão da Tempestade: ${opts.src.name} sofre ${x.total} de dano Trovejante.`, 'good'); if (await this.damageEnemy(opts.src, [{ amount: x.total, type: 'trovejante' }], {})) this.onKill(opts.src); }
      }
      if (total <= 0) return 0;
      let rest = total;
      // Proteção Arcana (Abjurador) absorve antes dos PV temporários
      if (hc.ward > 0) { const ab = Math.min(hc.ward, rest); hc.ward -= ab; rest -= ab; this.say(`Proteção Arcana absorve ${ab} de dano (restam ${hc.ward}).`, 'good'); if (rest <= 0) { this.P.float('hero', 'Proteção', 'miss'); this.P.update(); return total; } }
      if (h.tempHp > 0) { const ab = Math.min(h.tempHp, rest); h.tempHp -= ab; rest -= ab; }
      const prevHp = h.hp;
      h.hp -= rest;
      for (const p of parts) this.P.float('hero', p.amount, p.type, { crit: opts.crit });
      await this.P.hit('hero', opts.crit);
      delete hc.cond.adormecido;
      await this.reflectBlow(rest, parts, opts);
      // Fuga Nebulosa (Arquifada 6): Reação ao sofrer dano — Passo Nebuloso com Passo Aterrador
      if (h.hp > 0 && h.hp < C.maxHp(h) / 2 && opts.src && !opts.src.dead && C.hasFx(h, 'mistyEscape') && C.res(h, 'passo_feerico') > 0 && !this.reactionUsed) {
        C.spend(h, 'passo_feerico'); this.reactionUsed = true;
        this.say('Fuga Nebulosa! Você some numa névoa prateada e reaparece longe do golpe.', 'good');
        const dc = C.spellDC(h), ok = this.enemySave(opts.src, 'sab', dc, true);
        await this.showEnemySave(opts.src, 'sab', ok, dc, 'Passo Aterrador');
        if (!ok.ok) { const x = rollDice('2d10'); if (await this.damageEnemy(opts.src, [{ amount: x.total, type: 'psiquico' }], { spell: true })) this.onKill(opts.src); }
      }
      // concentração
      if (hc.conc && total > 0 && h.hp > 0) {
        const dc = Math.min(30, Math.max(10, Math.floor(total / 2)));
        const ok = await this.heroSave('con', dc, 'Concentração', { conc: true });
        if (!ok) this.endConc();
      }
      // Retorno a Zero (Vida Áurea Réquiem): uma vez por combate, o golpe que derrubaria o herói nunca acontece
      if (h.hp <= 0 && C.hasFx(h, 'zeroReturn') && !hc.zeroUsed) {
        hc.zeroUsed = true; h.hp = Math.max(1, prevHp);
        this.say('Retorno a Zero! O golpe que derrubaria você volta ao zero e nunca chega a acontecer.', 'good');
        this.P.update();
        return 0;
      }
      if (h.hp <= 0) {
        // dano maciço
        if (-h.hp >= C.maxHp(h)) { h.hp = 0; this.say('Dano massivo! Morte instantânea.', 'bad'); this.P.update(); await this.finish('dead'); return total; }
        const wph = C.equipped(h, 'weapon');
        if (hc.sb.deathWard) {
          delete hc.sb.deathWard; h.hp = 1;
          this.say('Proteção contra a Morte! Você fica com 1 PV.', 'good');
        } else if (wph && wph.def.passive && wph.def.passive.phoenix && !hc.phoenixUsed) {
          // Asa da Fênix Rubra: renasce uma vez por combate
          hc.phoenixUsed = true;
          const heal = rollDice(wph.def.passive.phoenix[wph.refine - 1]).total;
          h.hp = Math.min(C.maxHp(h), Math.max(1, heal));
          this.say(`${wph.def.passive.name}! ${h.name} renasce em chamas com ${h.hp} PV!`, 'good');
          if (this.P.anim) await this.P.anim({ actor: 'hero', target: 'hero', kind: 'heal', type: 'fogo' });
        } else if (C.res(h, 'implacavel') > 0) {
          C.spend(h, 'implacavel'); h.hp = 1;
          this.say('Resistência Implacável! Você se recusa a cair e fica com 1 PV.', 'good');
        } else {
          h.hp = 0;
          h.deathSaves = { s: 0, f: 0 };
          if (hc.conc) this.endConc();
          hc.raging = false;
          this.say(`${h.name} cai inconsciente!`, 'bad');
          await this.P.down();
        }
      }
      this.P.update();
      return total;
    }

    // ------------------------------------------------------------ inimigos
    enemySave(e, ab, dc, isSpell) {
      let adv = false, dis = false;
      if (isSpell && e.def.traits && e.def.traits.some((t) => t[0] === 'resistencia_magica')) adv = true;
      if (isSpell && this.castCtx && this.castCtx.hiddenDis) dis = true;
      if (isSpell && e.cond.mistico) { dis = true; delete e.cond.mistico; }
      if (isSpell && this.castCtx && this.castCtx.heightened && !this.castCtx.hDone) { dis = true; this.castCtx.hDone = true; }
      if (isSpell && this.castCtx && this.castCtx.sp && this.castCtx.sp.foeAdv) adv = true;
      if (ab === 'sab' && this.hc.mark && this.hc.mark.uid === e.uid && this.hc.mark.name === 'Maldição' && C.hasFx(this.h, 'eldritchHex')) dis = true;
      if (ab === 'des' && e.cond.contido) dis = true;
      if (['for', 'des'].includes(ab) && (e.cond.paralisado || e.cond.atordoado)) return { ok: false, nat: 0, total: 0, auto: true };
      const r = this.d20(adv, dis);
      let bonus = e.def.saves && e.def.saves[ab] !== undefined ? e.def.saves[ab] : U.mod(e.def.ab[ab]);
      if (e.cond.perdicao) bonus -= U.die(4);
      const total = r.nat + bonus;
      let ok = total >= dc;
      let legendary = false;
      if (!ok && e.lr > 0) { e.lr--; ok = true; legendary = true; }
      return { ok, nat: r.nat, rolls: r.rolls, total, bonus, legendary };
    }
    async showEnemySave(e, ab, res, dc, label) {
      if (res.auto) { this.say(`${e.name} falha automaticamente no TR de ${R.AB[ab].name}.`, 'good'); return; }
      await this.P.rollD20({ who: 'enemy', label: `${e.name}: TR de ${R.AB[ab].name} · ${label}`, rolls: res.rolls, nat: res.nat, bonus: res.bonus, total: res.total, dc, outcome: res.ok ? 'success' : 'fail', kind: 'esave', quick: true });
      if (res.legendary) this.say(`${e.name} usa Resistência Lendária e transforma a falha em sucesso!`, 'boss');
    }

    async enemyTurn(e) {
      if (e.dead) return;
      const h = this.h, hc = this.hc;
      this.turnFlags = {};
      this.P.activeEnemy(e.uid);
      e.acted = true;
      // início do turno
      if (e.cond.caido) { delete e.cond.caido; this.say(`${e.name} se levanta.`, 'sys'); }
      if (e.def.regen && !e.tookFireAcid && e.hp > 0 && e.hp < e.maxHp) { const amt = Math.min(e.def.regen, e.maxHp - e.hp); e.hp += amt; this.P.float(e.uid, '+' + amt, 'heal'); this.say(`${e.name} se regenera (${amt} PV).`, 'bad'); }
      e.tookFireAcid = false;
      if (e.later) { const x = rollDice(e.later.dice); const l = e.later; delete e.later; this.say(`${l.name} continua corroendo ${e.name}.`, 'spell'); if (await this.damageEnemy(e, [{ amount: x.total, type: l.type }], {})) { this.onKill(e); return; } }
      if (e.def.special && !e.ready) { const rr = U.die(6); if (rr >= e.def.special.recharge) e.ready = true; }
      if (INCAP.some((c) => e.cond[c])) {
        this.say(`${e.name} está incapacitado e perde o turno.`, 'info');
        await U.wait(350);
        await this.enemyEndSaves(e);
        return;
      }
      // com aliados no grupo, o inimigo escolhe quem atacar
      const standing = this.allies.filter((a) => !a.down);
      if (standing.length && (h.hp <= 0 || U.rand() < standing.length / (standing.length + 1))) {
        const a = U.pick(standing);
        const melee2 = e.def.attacks.filter((x) => x.r !== 'dist');
        const list2 = melee2.length ? melee2 : e.def.attacks;
        for (let i = 0; i < (e.def.multi || 1) && !a.down && !this.over; i++) await this.enemyAttackAlly(e, list2[i % list2.length], a);
        await this.enemyEndSaves(e);
        return;
      }
      if (h.hp <= 0) { this.say(`${e.name} rosna sobre seu corpo caído…`, 'sys'); await U.wait(300); return; }
      // procurar o herói escondido
      if (hc.hidden) {
        const per = U.die(20) + U.mod(e.def.ab.sab);
        if (per >= hc.hidden) { hc.hidden = 0; this.say(`${e.name} encontra seu esconderijo!`, 'bad'); }
      }
      // ações de invocação do bloco de estatísticas (Ente, Aparição)
      if (await this.enemySummonAction(e)) { await this.enemyEndSaves(e); if (e.averse) e.averse--; return; }
      // habilidade especial
      if (e.def.special && e.ready && (e.def.boss || U.rand() < 0.65)) {
        e.ready = false;
        await this.enemySpecial(e);
        await this.enemyEndSaves(e);
        return;
      }
      const n = e.cond.lentificado ? 1 : e.def.multi || 1;
      const melee = e.def.attacks.filter((a) => a.r !== 'dist');
      const list = melee.length ? melee : e.def.attacks;
      delete hc.hitsBy[e.uid];
      for (let i = 0; i < n; i++) {
        if (this.over || h.hp <= 0 || e.dead) break;
        const atk = e.def.multi && list.length > 1 && e.def.multi === list.length ? list[i] : list[i % list.length];
        await this.enemyAttack(e, atk);
      }
      await this.enemyEndSaves(e);
      if (e.averse) e.averse--;
    }

    // ------------------------------------------------------------ aliados (modo online)
    async allyTurn(a) {
      a.dodge = false;
      if (this.P.activeAlly) this.P.activeAlly(a);
      let act = null;
      try { act = this.P.allyAction ? await this.P.allyAction(a) : null; } catch (err) { act = null; }
      if (this.over) return;
      if (act && act.kind === 'potion' && a.potions > 0) {
        a.potions--;
        const x = rollDice('2d4+2');
        a.hp = Math.min(a.maxHp, a.hp + x.total);
        this.say(`${a.name} bebe uma Poção de Cura (+${x.total} PV).`, 'good');
        this.P.float(a.uid, '+' + x.total, 'heal');
        if (this.P.anim) await this.P.anim({ actor: a.uid, kind: 'heal', ally: true });
      } else if (act && act.kind === 'dodge') {
        a.dodge = true;
        this.say(`${a.name} se prepara para Esquivar.`, 'info');
      } else {
        const tgt = act && this.enemy(act.target) && !this.enemy(act.target).dead ? this.enemy(act.target) : this.alive()[0];
        if (!tgt) return;
        const r = this.d20(a.advT > 0, false);
        if (a.advT) a.advT = 0;
        const total = r.nat + a.toHit, crit = r.nat === 20, hit = r.nat !== 1 && (crit || total >= tgt.ac);
        await this.P.rollD20({ who: 'ally', label: `${a.name}: ${a.atkName}`, rolls: r.rolls, nat: r.nat, bonus: a.toHit, total, ac: tgt.ac, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'attack', quick: true });
        await this.P.anim({ actor: a.uid, target: tgt.uid, kind: a.ranged ? 'ranged' : 'melee', type: a.dtype, ally: true });
        if (!hit) { this.P.float(tgt.uid, 'Errou', 'miss'); this.say(`${a.name} usa ${a.atkName} e erra ${tgt.name} (${total} vs CA ${tgt.ac}).`, 'miss'); this.P.update(); return; }
        const x = rollDice(a.dmg, crit), amt = Math.max(1, x.total);
        await this.P.rollDamage({ who: 'ally', label: `${a.atkName} de ${a.name}`, parts: [{ amount: amt, type: a.dtype, dice: x }], total: amt, crit, quick: true });
        this.say(`${a.name} acerta ${tgt.name} com ${a.atkName}: ${amt} de dano.`, 'good');
        if (await this.damageEnemy(tgt, [{ amount: amt, type: a.dtype }], { crit })) this.say(`${tgt.name} foi derrotado por ${a.name}!`, 'good');
      }
      this.P.update();
      this.checkEnd();
    }
    async enemyAttackAlly(e, atk, a) {
      const rage = 0, h = this.h;
      const guard = !this.reactionUsed && h.hp > 0 && h.equip.shield && C.hasFx(h, 'protection');
      if (guard) { this.reactionUsed = true; this.say(`Proteção: ${h.name} ergue o escudo diante de ${a.name}.`, 'good'); }
      const r = this.d20(false, !!a.dodge || guard);
      const total = r.nat + atk.b + rage, crit = r.nat === 20, hit = r.nat !== 1 && (crit || total >= a.ac);
      await this.P.rollD20({ who: 'enemy', label: `${e.name} → ${a.name}: ${atk.n}`, rolls: r.rolls, nat: r.nat, bonus: atk.b + rage, total, ac: a.ac, dis: r.mode === 'dis', disWhy: a.dodge ? ['Esquiva'] : [], outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'eattack', quick: true });
      await this.P.anim({ actor: e.uid, target: a.uid, kind: atk.r === 'dist' ? 'eranged' : 'emelee', type: atk.t, ally: true });
      if (!hit) { this.P.float(a.uid, 'Errou', 'miss'); this.say(`${e.name} ataca ${a.name} e erra.`, 'miss'); return; }
      const main = rollDice(atk.d, crit); let amt = Math.max(1, main.total + rage);
      if (atk.x) amt += rollDice(atk.x[0], crit).total;
      if (!this.reactionUsed && h.hp > 0 && C.hasFx(h, 'interception')) { this.reactionUsed = true; const red = U.die(10) + C.pb(h); amt = Math.max(0, amt - red); this.say(`Interceptação: ${h.name} desvia ${red} do dano em ${a.name}.`, 'good'); }
      if (a.temp > 0) { const ab = Math.min(a.temp, amt); a.temp -= ab; amt -= ab; }
      a.hp = Math.max(0, a.hp - amt);
      this.P.float(a.uid, amt, atk.t, { crit });
      this.say(`${e.name} acerta ${a.name}: ${amt} de dano.`, 'hurt');
      if (this.P.hit) await this.P.hit(a.uid, crit);
      if (a.hp <= 0) { a.down = true; this.say(`${a.name} cai inconsciente!`, 'bad'); if (this.P.allyDown) await this.P.allyDown(a); }
      this.P.update();
    }

    async enemyEndSaves(e) {
      for (const c of ['contido', 'paralisado', 'adormecido', 'amedrontado', 'cego', 'envenenado', 'incapacitado', 'lentificado']) {
        const cd = e.cond[c];
        if (!cd || !cd.save) continue;
        const res = this.enemySave(e, cd.save, cd.dc, true);
        if (res.ok && !res.legendary) { this.dropCond(e, c); this.say(`${e.name} se livra: ${R.CONDITIONS[c].name}.`, 'info'); }
        else if (res.legendary) { this.dropCond(e, c); this.say(`${e.name} usa Resistência Lendária para se libertar!`, 'boss'); }
      }
      this.P.update();
    }

    enemyAdv(e, atk) {
      const hc = this.hc;
      const adv = [], dis = [];
      const melee = atk.r !== 'dist';
      if (e.def.traits && e.def.traits.some((t) => t[0] === 'tatica_bando') && this.alive().filter((x) => !INCAP.some((c) => x.cond[c])).length >= 2) adv.push('Táticas de Bando');
      if (hc.cond.caido) (melee ? adv : dis).push('você está Caído');
      if (hc.cond.contido || hc.cond.paralisado || hc.cond.adormecido || (hc.cond.cego && !C.hasFx(this.h, 'blindFight'))) adv.push('você está vulnerável');
      if (hc.reckless) adv.push('Ataque Descuidado');
      if (hc.dodge) dis.push('Esquivar');
      if (hc.hidden) dis.push('você está escondido');
      if (e.cond.enfraquecido) dis.push('Enfraquecido');
      if (e.cond.envenenado) dis.push('Envenenado');
      if (e.cond.amedrontado) dis.push('Amedrontado');
      if (e.cond.contido) dis.push('Contido');
      if (e.cond.cego) dis.push('Cego');
      if (hc.sb.blur) dis.push('você está difuso');
      if (e.averse) dis.push('Aversão ao Fogo');
      if (hc.sb.protEvil && ['aberracao', 'celestial', 'elemental', 'fada', 'corruptor', 'morto-vivo'].includes(e.def.type)) dis.push('Proteção contra o Bem e o Mal');
      if (hc.clair && hc.clair === e.uid) dis.push('Combatente Clarividente');
      if (C.hasFx(this.h, 'multiDefense') && hc.hitsBy[e.uid]) dis.push('Defesa contra Multiataque');
      return { adv, dis };
    }

    heroImmune(cond) { return C.condImm(this.h, cond, this.hc.raging) || (cond === 'amedrontado' && !!this.hc.sb.heroism); }

    // CA atual do herói com efeitos de combate (Escudo da Fé, Escudo Arcano, Forma Selvagem do Círculo da Lua…)
    heroAC() {
      const h = this.h, hc = this.hc;
      let ac = C.ac(h) + (hc.shieldOfFaith ? 2 : 0) + (hc.shieldSpell ? 5 : 0) + (hc.sb.surgeAc ? 2 : 0);
      if (hc.wild) { const wf = C.fxVals(h, 'wildForm')[0]; if (wf) ac = Math.max(ac, wf.acBase + C.mod(h, 'sab')); }
      if (hc.sb.haste) ac += 2;
      if (hc.sb.barkskin) ac = Math.max(ac, 17);
      return ac;
    }

    async enemyAttack(e, atk) {
      const h = this.h, hc = this.hc;
      if (e.dead) return;
      const { adv, dis } = this.enemyAdv(e, atk);
      // reações e defesas das subclasses que agem antes da rolagem
      if (h.hp > 0) {
        if (adv.length && !dis.length && !this.reactionUsed && C.hasFx(h, 'cancelEnemyAdv') && C.res(h, 'equilibrio') > 0) { C.spend(h, 'equilibrio'); this.reactionUsed = true; dis.push('Restaurar o Equilíbrio'); this.say('Restaurar o Equilíbrio: você anula a Vantagem do inimigo.', 'good'); }
        else if (!dis.length && !this.reactionUsed && C.hasFx(h, 'wardingFlare') && C.res(h, 'labareda') > 0) { C.spend(h, 'labareda'); this.reactionUsed = true; dis.push('Labareda Protetora'); this.say(`Labareda Protetora: um clarão ofusca ${e.name}.`, 'good'); if (C.hasFx(h, 'improvedFlare')) this.giveTemp(rollDice('2d6').total + Math.max(0, C.mod(h, 'sab')), 'Labareda Aprimorada'); }
      }
      const r = this.d20(adv.length > 0, dis.length > 0);
      if (e.cond.enfraquecido) delete e.cond.enfraquecido;
      let ac = this.heroAC();
      const rage = 0;
      const md = e.cond.perdicao ? U.die(4) : 0;
      let total = r.nat + atk.b + rage - md;
      let crit = r.nat === 20 || ((hc.cond.paralisado || hc.cond.adormecido) && atk.r !== 'dist');
      let hit = r.nat !== 1 && (r.nat === 20 || total >= ac);
      if (hit && (hc.cond.paralisado || hc.cond.adormecido) && atk.r !== 'dist') crit = true;
      // Escudo Arcano (reação): +5 na CA se isso transformar o acerto em erro
      if (hit && !crit && !this.reactionUsed && C.knownSpells(h).includes('escudo_arcano') && total < ac + 5 && C.slotsLeft(h).some((n) => n > 0) && h.hp > 0) {
        const ch = await this.P.ask({ title: 'Escudo Arcano', text: `${e.name} acertaria (${total} vs CA ${ac}). Gastar um espaço de 1º círculo e sua reação para +5 na CA?`, options: [{ id: 'yes', label: 'Conjurar Escudo Arcano (+5 CA)' }, { id: 'no', label: 'Não' }] });
        if (ch === 'yes') {
          const lvl = C.slotsLeft(h).findIndex((n) => n > 0) + 1;
          this.useSlot(lvl);
          this.reactionUsed = true;
          hc.shieldSpell = true;
          ac += 5;
          hit = total >= ac;
          this.say(`Escudo Arcano! Sua CA sobe para ${ac}.`, 'good');
          if (this.P.anim) await this.P.anim({ actor: 'hero', kind: 'buff', type: 'energia' });
        }
      }
      // Duelista Defensivo (reação): + BP na CA empunhando arma de Acuidade
      if (hit && !crit && !this.reactionUsed && C.hasFx(h, 'defDuelist') && h.hp > 0 && C.attackProfile(h).finesse && total < ac + C.pb(h)) { this.reactionUsed = true; ac += C.pb(h); hit = false; this.say(`Duelista Defensivo! Você apara o golpe (CA ${ac}).`, 'good'); }
      // Palavras Cortantes (Bardo 3)
      if (hit && !crit && !this.reactionUsed && C.has(h, 'palavras_cortantes') && C.res(h, 'inspiracao') > 0) {
        const die = h.level >= 10 ? 10 : h.level >= 5 ? 8 : 6;
        const cw = U.die(die);
        if (total - cw < ac) { C.spend(h, 'inspiracao'); total -= cw; hit = false; this.reactionUsed = true; this.say(`Palavras Cortantes! Você subtrai ${cw} do ataque de ${e.name}.`, 'good'); }
      }
      // Presságio (Adivinho): troca o d20 do inimigo por um número baixo
      if (hit && hc.portent.length && h.hp > 0) {
        const lo = Math.min(...hc.portent);
        if (lo + atk.b + rage - md < ac) {
          const ch = await this.P.ask({ title: 'Presságio', text: `${e.name} vai te acertar (${total} vs CA ${ac}). Trocar o d20 dele pelo Presságio ${lo}?`, options: [{ id: 'yes', label: `Usar Presságio (${lo})` }, { id: 'no', label: 'Guardar' }] });
          if (ch === 'yes') { hc.portent.splice(hc.portent.indexOf(lo), 1); total = lo + atk.b + rage - md; hit = false; crit = false; this.say(`Presságio! O golpe de ${e.name} vira ${total} — erra.`, 'good'); }
        }
      }
      // Imagem Espelhada: o golpe pode acertar uma duplicata
      if (hit && hc.mirror > 0 && h.hp > 0 && U.die(20) >= ({ 3: 6, 2: 8, 1: 11 }[hc.mirror])) { hc.mirror--; hit = false; crit = false; this.say(`${e.name} acerta uma imagem espelhada! (restam ${hc.mirror})`, 'good'); }
      // Presságio Cósmico · Mal (Círculo das Estrelas) e Dobrar a Sorte (Feitiçaria Selvagem): Reação que tira pontos do ataque
      if (hit && !crit && !this.reactionUsed && h.hp > 0 && h.omen === 'mal' && C.hasFx(h, 'cosmicOmen') && C.res(h, 'presagio_cosmico') > 0 && total - ac < 6) { C.spend(h, 'presagio_cosmico'); this.reactionUsed = true; const x = U.die(6); total -= x; hit = total >= ac; this.say(`Presságio Cósmico (Mal): −${x} no ataque de ${e.name}${hit ? '' : ' — erra!'}`, 'good'); }
      if (hit && !crit && !this.reactionUsed && h.hp > 0 && C.hasFx(h, 'bendLuck') && C.res(h, 'feiticaria') > 0 && total - ac < 4) { C.spend(h, 'feiticaria'); this.reactionUsed = true; const x = U.die(4); total -= x; hit = total >= ac; this.say(`Dobrar a Sorte: −${x} no ataque de ${e.name}${hit ? '' : ' — erra!'}`, 'good'); }
      // Eu Ilusório (Ilusionista 10): Reação — o ataque atinge uma ilusão (1×/Descanso Curto)
      if (hit && hc.illusory && !this.reactionUsed && C.res(h, 'eu_ilusorio') > 0 && h.hp > 0) { C.spend(h, 'eu_ilusorio'); this.reactionUsed = true; hit = false; crit = false; this.say(`Eu Ilusório: ${e.name} acerta apenas uma ilusão!`, 'good'); }
      await this.P.rollD20({ who: 'enemy', label: `${e.name}: ${atk.n}`, rolls: r.rolls, nat: r.nat, bonus: atk.b + rage - md, total, ac, adv: r.mode === 'adv', dis: r.mode === 'dis', advWhy: adv, disWhy: dis, outcome: crit && hit ? 'crit' : hit ? 'hit' : 'miss', kind: 'eattack', quick: true });
      await this.P.anim({ actor: e.uid, target: 'hero', kind: atk.r === 'dist' ? 'eranged' : 'emelee', type: atk.t });
      if (!hit) { this.P.float('hero', 'Errou', 'miss'); this.say(`${e.name} usa ${atk.n} e erra (${total} vs CA ${ac}).`, 'miss'); return; }
      const parts = [];
      const main = rollDice(atk.d, crit);
      parts.push({ amount: Math.max(1, main.total + rage), type: atk.t, dice: main, label: atk.n });
      if (atk.x) {
        const x = rollDice(atk.x[0], crit);
        let amt = x.total;
        if (atk.xSave) {
          const ok = await this.heroSave(atk.xSave.ab, atk.xSave.dc, atk.n, { poison: atk.x[1] === 'veneno' });
          if (ok) amt = Math.floor(amt / 2);
        }
        parts.push({ amount: amt, type: atk.x[1], dice: x, label: R.DAMAGE[atk.x[1]].name });
      }
      if (atk.advBonus && r.mode === 'adv') { const x = rollDice(atk.advBonus, crit); parts.push({ amount: x.total, type: atk.t, dice: x, label: 'Vantagem' }); }
      if (atk.sneak && r.mode === 'adv' && !(this.turnFlags || {}).sneak) { const x = rollDice(atk.sneak, crit); parts.push({ amount: x.total, type: atk.t, dice: x, label: 'Ataque Furtivo' }); this.turnFlags.sneak = true; }
      if (atk.firstRound && this.round === 1) { const x = rollDice(atk.firstRound, crit); parts.push({ amount: x.total, type: atk.t, dice: x, label: 'Ataque Surpresa' }); }
      const total2 = parts.reduce((a, p) => a + p.amount, 0);
      await this.P.rollDamage({ who: 'enemy', label: crit ? `CRÍTICO de ${e.name}!` : `${atk.n} de ${e.name}`, parts, total: total2, crit, quick: true });
      hc.hitsBy[e.uid] = true;
      const dealt = await this.damageHero(parts, { crit, attack: true, src: e, melee: atk.r !== 'dist' });
      this.say(`${e.name} acerta ${atk.n}: ${dealt} de dano.`, 'hurt');
      if (this.over || h.hp <= 0) return;
      // Armadura de Agathys e Escudo de Fogo
      if (atk.r !== 'dist' && !e.dead) {
        if (hc.agathys && h.tempHp > 0) { this.say(`Armadura de Agathys: ${e.name} congela!`, 'good'); if (await this.damageEnemy(e, [{ amount: hc.agathys, type: 'frio' }], { spell: true })) { this.onKill(e); return; } }
        if (hc.sb.fireShield) { const x = rollDice('2d8'); this.say('Escudo de Fogo: chamas devolvem o golpe!', 'good'); if (await this.damageEnemy(e, [{ amount: x.total, type: 'fogo' }], { spell: true })) { this.onKill(e); return; } }
      }
      // Repreensão Infernal (reação)
      if (!e.dead && !this.reactionUsed && h.hp > 0 && C.knownSpells(h).includes('repreensao_infernal') && C.slotsLeft(h).some((n) => n > 0)) {
        const ch = await this.P.ask({ title: 'Repreensão Infernal', text: `Gastar sua reação e um espaço de magia para envolver ${e.name} em chamas?`, options: [{ id: 'yes', label: 'Conjurar (2d10 Fogo)' }, { id: 'no', label: 'Não' }] });
        if (ch === 'yes') {
          const lvl = C.slotsLeft(h).findIndex((n) => n > 0) + 1;
          this.useSlot(lvl); this.reactionUsed = true;
          const sp = S.SPELLS.repreensao_infernal, dc = C.spellDC(h, sp);
          const x = rollDice(`${2 + (lvl - 1)}d10`);
          await this.P.anim({ actor: 'hero', target: e.uid, kind: 'spell', type: 'fogo' });
          const ok = this.enemySave(e, 'des', dc, true);
          await this.showEnemySave(e, 'des', ok, dc, sp.name);
          if (await this.damageEnemy(e, [{ amount: ok.ok ? Math.floor(x.total / 2) : x.total, type: 'fogo' }], { spell: true })) { this.onKill(e); return; }
        }
      }
      // Retaliação (Berserker): reação de ataque corpo a corpo
      if (atk.r !== 'dist' && C.hasFx(h, 'retaliate') && !this.reactionUsed && this.turn && !e.dead) {
        this.reactionUsed = true;
        this.say('Retaliação! Você devolve o golpe.', 'good');
        const saved = this.turn;
        this.turn = { action: 0, bonus: 0, attacksLeft: 0, once: {}, sneak: false, attacked: true };
        try { await this.weaponAttack(e); } finally { this.turn = saved; }
        if (e.dead) return;
      }
      // efeitos
      const fx = atk.fx;
      if (fx) {
        if (fx.cond && !hc.cond[fx.cond]) {
          let resisted = false;
          if (fx.noElf && h.species === 'elfo') resisted = true;
          if (this.heroImmune(fx.cond)) { resisted = true; this.say(`Você é imune: ${R.CONDITIONS[fx.cond].name}.`, 'good'); }
          if (fx.save) resisted = resisted || await this.heroSave(fx.save, fx.dc, R.CONDITIONS[fx.cond].name);
          if (fx.cond === 'caido' && h.species === 'golias' && !fx.save) resisted = false;
          if (!resisted) {
            hc.cond[fx.cond] = fx.cond === 'paralisado' ? { turns: 1, save: 'con', dc: fx.dc || 10 } : fx.cond === 'agarrado' ? { save: 'for', dc: 13 } : {};
            this.say(`Você fica ${R.CONDITIONS[fx.cond].name}!`, 'bad');
          }
        }
        if (fx.drainStr) { const d = rollDice(fx.drainStr).total; h.strDrain = (h.strDrain || 0) + d; this.say(`Sua Força diminui em ${d} até um Descanso Longo.`, 'bad'); if (C.score(h, 'for') <= 1 + 0 && h.strDrain >= (h.base.for || 10)) { this.say('Sua Força chega a zero…', 'bad'); } }
        if (fx.rot && !hc.noHeal) { hc.noHeal = true; this.say('Podridão de Múmia: você está amaldiçoado e não recupera PV neste combate.', 'bad'); }
        if (fx.drainMax) { h.maxHpReduce = (h.maxHpReduce || 0) + dealt; if (h.hp > C.maxHp(h)) h.hp = C.maxHp(h); this.say(`Seus PV máximos diminuem em ${dealt} até um Descanso Longo.`, 'bad'); }
      }
      this.P.update();
    }

    async enemySpecial(e) {
      const sp = e.def.special, h = this.h;
      this.say(`${e.name} usa ${sp.n}!`, 'boss');
      await this.P.anim({ actor: e.uid, target: 'hero', kind: 'especial', type: sp.type || 'psiquico', name: sp.n });
      const ok = await this.heroSave(sp.save, sp.dc, sp.n, { poison: sp.type === 'veneno', fear: sp.cond === 'amedrontado', charm: sp.cond === 'adormecido' });
      if (sp.dmg) {
        const x = rollDice(sp.dmg);
        let amt = ok ? (sp.half ? Math.floor(x.total / 2) : 0) : x.total;
        if (ok && sp.save === 'des' && (C.has(h, 'evasao') || (C.hasFx(h, 'shieldMaster') && h.equip.shield))) amt = 0;
        else if (!ok && sp.save === 'des' && C.has(h, 'evasao')) amt = Math.floor(x.total / 2);
        if (amt > 0) {
          await this.P.rollDamage({ who: 'enemy', label: sp.n, parts: [{ amount: amt, type: sp.type, dice: x }], total: amt, quick: true });
          const dealt = await this.damageHero([{ amount: amt, type: sp.type }], { special: true, src: e });
          this.say(`${sp.n}: ${dealt} de dano ${R.DAMAGE[sp.type] ? R.DAMAGE[sp.type].name : ''}.`, 'hurt');
        }
      }
      if (!ok && sp.cond && h.hp > 0 && this.heroImmune(sp.cond)) this.say(`Você é imune: ${R.CONDITIONS[sp.cond].name}.`, 'good');
      else if (!ok && sp.cond && h.hp > 0) {
        this.hc.cond[sp.cond] = { save: sp.save, dc: sp.dc };
        this.say(`Você fica ${R.CONDITIONS[sp.cond].name}!`, 'bad');
      }
      this.P.update();
    }

    async legendary(boss) {
      const la = boss.def.legendaryActions;
      if (!la || this.h.hp <= 0) return;
      this.say(`Ação Lendária: ${boss.name}!`, 'boss');
      await this.enemyAttack(boss, la[0]);
    }

    // ------------------------------------------------------------ fim
    checkEnd() {
      if (this.over) return true;
      if (this.alive().length === 0) { this.finish('win'); return true; }
      return false;
    }

    async finish(outcome) {
      if (this.over) return;
      this.over = true;
      const h = this.h;
      if (this.hc.conc) this.hc.conc = null;
      this.hc.raging = false;
      // Proteção Arcana dura até o Descanso Longo
      if (this.hc.ward !== undefined) h.ward = Math.max(0, this.hc.ward);
      const defeated = this.enemies.filter((e) => e.dead || e.cond.banido);
      const xp = outcome === 'win' ? defeated.reduce((a, e) => a + (R.CR_XP[e.def.cr] || 0), 0) : 0;
      let gold = 0, gems = 0, cores = 0;
      const frags = {};
      if (outcome === 'win') {
        for (const e of defeated) {
          const cr = e.def.cr;
          gold += Math.max(1, Math.round((U.die(6) + U.die(6)) * Math.max(0.5, cr) * (e.def.type === 'besta' ? 0.3 : 1)));
          gems += 5 + Math.round(cr * 8);
        }
        if (this.isBoss) { gems += 300; gold += 250; }
        // chefes de covil: recompensa extra + Selo Estelar
        for (const e of defeated) if (e.def.boss && !this.isBoss && !this.noLair && !e.summonedBy) { gems += 150; gold += Math.round(60 * e.def.cr); this.lairWin = e.key; }
        // Núcleos de Covil (ascensão de armas): chefes sempre deixam; criaturas fortes às vezes
        if (this.lairWin) cores += 2 + (defeated.find((e) => e.key === this.lairWin).def.cr >= 6 ? 1 : 0);
        if (this.isBoss) cores += 2;
        for (const e of defeated) if (!e.def.boss && !e.summonedBy && e.def.cr >= 3 && U.rand() < 0.1 + e.def.cr * 0.02) cores += 1;
        // Fragmentos de Domínio (ascensão de armas): o nível do fragmento acompanha o ND; o Nível de Mundo aumenta a chance
        const wl = E.Adv ? E.Adv.worldWL() : 0;
        const tierOf = (cr) => (cr < 2 ? 1 : cr < 5 ? 2 : cr < 8 ? 3 : 4);
        for (const e of defeated) {
          if (e.def.boss) { const t = tierOf(e.def.cr); frags['frag' + t] = (frags['frag' + t] || 0) + 3; if (t < 4) frags['frag' + (t + 1)] = (frags['frag' + (t + 1)] || 0) + 1; continue; }
          if (e.def.cr >= 0.5 && U.rand() < 0.07 + wl * 0.02) { const t = tierOf(e.def.cr); frags['frag' + t] = (frags['frag' + t] || 0) + 1; }
        }
      }
      h.tempHp = 0;
      this.result = { outcome, xp, gold, gems, kills: defeated.map((e) => e.key), boss: this.isBoss, lair: this.lairWin || null, seals: this.lairWin ? 2 : 0, cores, frags, allies: this.allies.map((a) => ({ id: a.id, hp: a.hp, down: a.down, potions: a.potions })) };
      this.P.update();
      await this.P.end(this.result);
    }
  }

  E.Battle = Battle;
  E.rollDice = rollDice;
})();
