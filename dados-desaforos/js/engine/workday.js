/* Dia de trabalho: cada emprego tem uma atividade prática (sem questionário). O motor gera as tarefas,
   confere cada ação do jogador e paga uma vez por dia: salário, XP de nível e XP da especialidade do ramo.
   Também guarda o contrato de fornecedor de pescado com a peixaria. Sistema de regras locais, sem IA generativa. */
(() => {
  'use strict';
  const U = E.U, SS = E.Settlements, WD = {};
  const hero = () => E.Store.hero();
  const clock = () => E.Sim ? E.Sim.clock() : { day: 1, elapsed: 0 };
  const save = () => { E.Store.save(); U.emit('settlement:changed'); };
  const result = (ok, message, extra = {}) => Object.assign({ ok, message }, extra);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const hash = (s) => [...String(s)].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
  const pick = (a, rnd) => a[Math.floor(rnd() * a.length)];
  const shuffle = (a, rnd) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ------------------------------------------------------------ tipos de trabalho
  WD.FAMILY = { clerk: 'cashier', cook: 'kitchen', baker: 'kitchen', waiter: 'kitchen', apothecary: 'kitchen', fisher: 'fish', fishmonger: 'fish', smith: 'forge', carpenter: 'forge', jeweler: 'forge', courier: 'sort', warehouse: 'sort', dockhand: 'sort', housekeeper: 'sort', steward: 'sort', receptionist: 'payout', casinoCashier: 'payout', dealer: 'payout' };
  WD.family = (job) => WD.FAMILY[job] || 'sort';
  WD.FAMILY_NAMES = { cashier: 'Caixa da loja', kitchen: 'Preparo de pedidos', fish: 'Bancada do pescado', forge: 'Bancada de ofício', sort: 'Organização e entregas', payout: 'Caixa e troco' };

  // Especialidade = nível do ofício ligado ao emprego. Cada nível acima do 1 aumenta o salário em 5%.
  WD.RANKS = ['Aprendiz', 'Auxiliar', 'Profissional', 'Especialista', 'Mestre'];
  WD.specialty = (h, job) => {
    const def = SS.JOBS[job], skill = (def && def.skill) || 'comercio', prof = (E.L && E.L.PROFS[skill]) || { name: skill };
    const pr = E.Life ? E.Life.progress(h, skill) : { lv: 1, pct: 0, cur: 0, next: 60 };
    return { skill, name: prof.name, lv: pr.lv, pct: pr.pct, cur: pr.cur, next: pr.next, rank: WD.RANKS[Math.min(4, Math.floor((pr.lv - 1) / 2))], bonus: (pr.lv - 1) * 5 };
  };
  WD.pay = (h, job, region) => Math.round(SS.jobPay(job, region) * (1 + WD.specialty(h, job).bonus / 100));
  // XP de nível por dia trabalhado: até 15% do que falta entre o nível atual e o próximo (metade com desempenho zero).
  WD.levelXp = (h, acc) => {
    const T = E.R.XP_TABLE, gap = T[h.level + 1] ? T[h.level + 1] - T[h.level] : 0;
    return gap ? Math.max(20, Math.round(gap * .15 * (.5 + .5 * acc))) : 0;
  };
  WD.specialtyXp = (acc) => Math.round(18 + 22 * acc);

  // Recompensa única do dia (usada também pelo caixa da loja).
  WD.reward = (h, job, region, acc) => {
    const j = SS.jobData(h, region), cl = clock(), d = SS.data(h), def = SS.JOBS[job];
    if (!def || j.contract !== job) return result(false, 'Você não está contratado para este emprego.');
    if (j.lastShiftDay === cl.day) return result(false, 'O dia de trabalho de hoje já foi pago. Volte amanhã.');
    if (!Number.isFinite(h.gold)) return result(false, 'Saldo de ouro inválido.');
    acc = clamp(Number(acc) || 0, 0, 1);
    const before = WD.specialty(h, job), pay = Math.round(WD.pay(h, job, region) * (.6 + .4 * acc));
    const xp = WD.levelXp(h, acc), sxp = WD.specialtyXp(acc);
    j.lastShiftDay = cl.day; j.shifts = (j.shifts || 0) + 1; j.bestAcc = Math.max(j.bestAcc || 0, acc);
    d.reputation += Math.round(1 + 2 * acc); h.gold += pay;
    if (E.Sim) { const sd = E.Sim.data(h); sd.hunger = Math.max(0, sd.hunger - 3); }
    const levels = xp ? E.C.addXp(h, xp) : 0;
    if (E.Life && E.Life.addXp) E.Life.addXp(h, before.skill, sxp);
    save(); if (E.HUD) E.HUD.update();
    return result(true, `Dia de trabalho concluído. Salário: ${pay} po.`, { pay, xp, levels, level: h.level, sxp, specialty: WD.specialty(h, job), before, acc: Math.round(acc * 100), job, shifts: j.shifts });
  };

  // ------------------------------------------------------------ conteúdo das atividades
  const ING = {
    peixe: ['Peixe fresco', 'fish'], carne: ['Carne', 'meat-stew'], legumes: ['Legumes', 'herb'], ervas: ['Ervas', 'leaf'], pimenta: ['Pimenta', 'chili'], limao: ['Limão', 'lemon'], sal: ['Sal', 'salt'], ovo: ['Ovo', 'egg'], massa: ['Massa', 'noodles'], mel: ['Mel', 'honey'],
    farinha: ['Farinha', 'package'], leite: ['Leite', 'bottle'], fermento: ['Fermento', 'sprout'], fruta: ['Frutas', 'cherry'], agua: ['Água', 'water'],
    cerveja: ['Cerveja', 'beer'], vinho: ['Vinho', 'wine'], cha: ['Chá', 'tea'], ensopado: ['Ensopado', 'meat-stew'], pao: ['Pão', 'pie'], sopa: ['Sopa', 'cup'], torta: ['Torta', 'cherry'],
    erva: ['Erva-lanterna', 'herb'], raiz: ['Raiz amarga', 'sprout'], cristal: ['Pó de cristal', 'gem'], flor: ['Flor-do-sol', 'flower'], trevo: ['Trevo', 'clover'],
  };
  WD.ING = ING;
  const KITCHEN = {
    cook: { title: 'Cozinha', bowl: 'Panela', cook: 'Levar ao fogo', stop: 'Tirar do fogo', zone: 'ponto certo', pantry: ['peixe', 'carne', 'legumes', 'ervas', 'pimenta', 'limao', 'sal', 'ovo', 'massa', 'mel'], dishes: [
      ['Peixe grelhado com limão', { peixe: 1, limao: 1, sal: 1 }], ['Ensopado da vila', { carne: 1, legumes: 2, sal: 1 }], ['Omelete de ervas', { ovo: 2, ervas: 1, sal: 1 }],
      ['Massa apimentada', { massa: 1, pimenta: 1, legumes: 1 }], ['Caldo de peixe', { peixe: 1, legumes: 1, ervas: 1, sal: 1 }], ['Carne ao mel', { carne: 1, mel: 1, pimenta: 1 }]] },
    baker: { title: 'Padaria', bowl: 'Tigela', cook: 'Assar no forno', stop: 'Tirar do forno', zone: 'dourado perfeito', pantry: ['farinha', 'ovo', 'leite', 'mel', 'fermento', 'sal', 'fruta', 'agua'], dishes: [
      ['Pão de fermentação', { farinha: 2, fermento: 1, agua: 1, sal: 1 }], ['Bolo de mel', { farinha: 1, ovo: 2, mel: 1, leite: 1 }], ['Torta de frutas', { farinha: 1, fruta: 2, mel: 1 }],
      ['Broa de leite', { farinha: 1, leite: 1, ovo: 1 }], ['Pão doce', { farinha: 2, leite: 1, mel: 1, fermento: 1 }]] },
    waiter: { title: 'Salão da taverna', bowl: 'Bandeja', cook: 'Equilibrar a bandeja', stop: 'Servir a mesa', zone: 'bandeja firme', pantry: ['cerveja', 'vinho', 'cha', 'agua', 'ensopado', 'pao', 'sopa', 'torta'], dishes: [
      ['Mesa 2', { cerveja: 2, ensopado: 1 }], ['Mesa 5', { cha: 1, torta: 1 }], ['Mesa 1', { vinho: 1, pao: 2 }], ['Balcão', { agua: 1, sopa: 1, pao: 1 }], ['Mesa 4', { cerveja: 1, vinho: 1, ensopado: 2 }], ['Mesa 3', { cha: 2, torta: 1, pao: 1 }]] },
    apothecary: { title: 'Bancada do boticário', bowl: 'Caldeirão', cook: 'Aquecer o caldeirão', stop: 'Engarrafar', zone: 'cor certa', pantry: ['erva', 'raiz', 'agua', 'cristal', 'mel', 'flor', 'sal', 'trevo'], dishes: [
      ['Poção de cura', { erva: 2, agua: 1, cristal: 1 }], ['Antídoto', { raiz: 1, mel: 1, agua: 1 }], ['Tônico de vigor', { flor: 1, mel: 1, erva: 1 }], ['Bálsamo de trevo', { trevo: 2, sal: 1, agua: 1 }], ['Elixir do sol', { flor: 2, cristal: 1, mel: 1 }]] },
  };
  const FORGE = {
    smith: { title: 'Bigorna', verb: 'Martelar', zone: 'metal no ponto', pieces: ['Ferradura', 'Lâmina curta', 'Cravos de ferro', 'Dobradiça', 'Ponta de lança'], icon: 'anvil' },
    carpenter: { title: 'Bancada de marcenaria', verb: 'Serrar', zone: 'marca do lápis', pieces: ['Pé de mesa', 'Prateleira', 'Moldura', 'Cabo de ferramenta', 'Tampa de baú'], icon: 'wood' },
    jeweler: { title: 'Mesa de lapidação', verb: 'Lapidar', zone: 'ângulo da face', pieces: ['Ametista', 'Topázio', 'Esmeralda', 'Safira', 'Granada'], icon: 'gem' },
  };
  // Triagem: cada item tem uma caixa certa, e a regra fica escrita na própria caixa.
  const SORT = {
    courier: { title: 'Mesa de encomendas', icon: 'mail', bins: [['forja', 'Forja'], ['pousada', 'Pousada'], ['oficios', 'Casa dos Ofícios'], ['emporio', 'Empório']], items: (rnd) => {
      const who = ['Mestre Bento', 'Dona Iara', 'Taren', 'Mira', 'Ravi', 'Cora', 'Nilo', 'Suri'], b = pick(['forja', 'pousada', 'oficios', 'emporio'], rnd), place = { forja: 'Forja', pousada: 'Pousada', oficios: 'Casa dos Ofícios', emporio: 'Empório' }[b];
      return { label: `${pick(['Carta', 'Pacote', 'Caixa', 'Encomenda'], rnd)} para ${pick(who, rnd)}`, detail: `Destino: ${place}`, icon: pick(['mail', 'package'], rnd), bin: b };
    } },
    warehouse: { title: 'Conferência do entreposto', icon: 'package', bins: [['a', 'Prateleira A'], ['b', 'Prateleira B'], ['c', 'Prateleira C'], ['dano', 'Avariados']], items: (rnd) => {
      const L = pick(['A', 'B', 'C'], rnd), n = String(1 + Math.floor(rnd() * 40)).padStart(2, '0'), broken = rnd() < .22;
      return { label: `Lote ${L}-${n}`, detail: broken ? 'Caixa rasgada e úmida' : pick(['Caixa lacrada', 'Etiqueta conferida', 'Fardo amarrado'], rnd), icon: 'package', bin: broken ? 'dano' : L.toLowerCase() };
    } },
    dockhand: { title: 'Cais de carga', icon: 'boat', bins: [['mao', 'Carrinho de mão · até 20 kg'], ['carroca', 'Carroça · 21 a 60 kg'], ['guindaste', 'Guindaste · acima de 60 kg']], items: (rnd) => {
      const kg = pick([4, 8, 12, 15, 18, 20, 22, 30, 38, 45, 55, 60, 65, 80, 95, 120], rnd);
      return { label: `${pick(['Saca de grãos', 'Barril', 'Caixote', 'Fardo de tecido', 'Rede de pesca', 'Âncora'], rnd)}`, detail: `${kg} kg`, icon: 'package', bin: kg <= 20 ? 'mao' : kg <= 60 ? 'carroca' : 'guindaste' };
    } },
    housekeeper: { title: 'Rouparia da pousada', icon: 'bed', bins: [['lavar', 'Lavanderia · sujo'], ['armario', 'Armário · limpo'], ['descarte', 'Descarte · rasgado']], items: (rnd) => {
      const thing = pick(['Lençol', 'Toalha', 'Fronha', 'Cobertor', 'Cortina'], rnd), st = pick(['limpo', 'limpo', 'sujo', 'sujo', 'rasgado'], rnd);
      const fem = ['Toalha', 'Fronha', 'Cortina'].includes(thing), adj = fem ? st.replace(/o$/, 'a') : st;
      return { label: `${thing} ${adj}`, detail: st === 'rasgado' ? 'Tecido com rasgo largo' : st === 'sujo' ? 'Manchas e cheiro de uso' : 'Dobrado e perfumado', icon: 'fabric', bin: st === 'limpo' ? 'armario' : st === 'sujo' ? 'lavar' : 'descarte' };
    } },
    steward: { title: 'Conferência de equipamentos', icon: 'shield', bins: [['ok', 'Aprovado'], ['reparo', 'Reparo · dano leve'], ['recusa', 'Recusado · perigoso']], items: (rnd) => {
      const thing = pick(['Espada', 'Escudo', 'Lança', 'Machado', 'Elmo'], rnd), st = pick(['ok', 'ok', 'reparo', 'recusa'], rnd);
      const det = { ok: 'Sem marcas, tudo firme', reparo: pick(['Alça frouxa', 'Cabo arranhado', 'Rebite solto'], rnd), recusa: pick(['Lâmina rachada', 'Ponta quebrada', 'Cabo partido ao meio'], rnd) }[st];
      return { label: thing, detail: det, icon: thing === 'Escudo' || thing === 'Elmo' ? 'shield' : 'sword', bin: st };
    } },
  };
  const PAYOUT = {
    receptionist: { title: 'Recepção da pousada', unit: 'po', coins: [50, 20, 10, 5, 1], make: (rnd) => {
      const n = 1 + Math.floor(rnd() * 3), rate = pick([8, 9, 10, 12, 15], rnd), extra = pick([[0, ''], [2, ' + café da manhã (2 po)'], [3, ' + banho quente (3 po)']], rnd), bill = n * rate + extra[0], paid = bill <= 50 ? 50 : 100;
      return { text: `${n} diária${n > 1 ? 's' : ''} de ${rate} po${extra[1]} = ${bill} po. O hóspede pagou com ${paid} po. Entregue o troco.`, amount: paid - bill, bill, paid };
    } },
    casinoCashier: { title: 'Caixa do cassino', unit: 'fichas', coins: [50, 20, 10, 5, 1], make: (rnd) => {
      const v = pick([12, 18, 25, 33, 37, 46, 58, 64, 75, 88], rnd);
      return rnd() < .5 ? { text: `O cliente quer trocar ${v} po por fichas (1 ficha = 1 po). Entregue as fichas.`, amount: v } : { text: `O cliente devolve ${v} fichas e quer ouro (1 ficha = 1 po). Entregue as moedas.`, amount: v };
    } },
    dealer: { title: 'Mesa de roleta', unit: 'fichas', coins: [50, 20, 10, 5, 1], make: (rnd) => {
      const kind = pick([['cor', 'no vermelho', 1], ['cor', 'no preto', 1], ['dúzia', 'na primeira dúzia', 2], ['coluna', 'na segunda coluna', 2], ['número', 'no número 17', 35]], rnd);
      const bet = kind[2] === 35 ? pick([1, 2], rnd) : pick([5, 8, 10, 12, 15, 20, 25], rnd);
      return { text: `Aposta de ${bet} ficha${bet > 1 ? 's' : ''} ${kind[1]} — e ganhou! A ${kind[0]} paga ${kind[2]} por 1. Pague o prêmio (sem devolver a aposta).`, amount: bet * kind[2] };
    } },
  };
  // Peixes da região (sem os de mar aberto e sem lendários), usados na bancada e nas encomendas.
  WD.regionFish = (r) => {
    const reg = E.WD.REGIONS[SS.region(r)] || {}, L = E.L;
    const list = [...(L.FISH_BY_BIOME[reg.biome] || []), ...((L.FISH_REGION || {})[SS.region(r)] || [])].filter((f) => !f.seaOnly && f.r <= 4);
    return list.length ? list : (L.FISH_BY_BIOME.forest || []);
  };

  const GEN = {
    kitchen: (job, rnd, sp) => {
      const k = KITCHEN[job] || KITCHEN.cook, width = .16 + Math.min(10, sp.lv) * .012;
      return shuffle(k.dishes, rnd).slice(0, 5).map(([dish, need]) => { const c = .2 + rnd() * .6; return { dish, need, zone: [clamp(c - width / 2, .04, .96 - width), clamp(c - width / 2, .04, .96 - width) + width], limit: 26, bowl: {}, phase: 'prep' }; });
    },
    fish: (job, rnd, sp, region) => {
      const pool = WD.regionFish(region);
      return Array.from({ length: 8 }, () => {
        const f = pick(pool.filter((x) => x.r <= (rnd() < .25 ? 4 : 2)), rnd) || pick(pool, rnd), small = rnd() < .28;
        const span = f.max - f.min, cm = Math.round(small ? f.min + rnd() * span * .25 : f.min + span * (.35 + rnd() * .65));
        const minKeep = Math.round(f.min + span * .3);
        return { fish: { id: f.id, name: f.name, r: f.r, cm, minKeep }, bin: cm < minKeep ? 'rio' : f.r >= 3 ? 'vitrine' : 'gelo', phase: 'sort', taps: 0 };
      });
    },
    forge: (job, rnd, sp) => {
      const f = FORGE[job] || FORGE.smith, width = .14 + Math.min(10, sp.lv) * .01;
      return shuffle(f.pieces, rnd).slice(0, 3).map((piece, i) => ({ piece, strikes: 4, hits: [], speed: 1.25 + i * .3, width, zone: null }));
    },
    sort: (job, rnd, sp) => { const s = SORT[job] || SORT.courier; return Array.from({ length: 10 }, () => Object.assign({ limit: 8 + Math.min(10, sp.lv) * .4 }, s.items(rnd))); },
    payout: (job, rnd) => { const p = PAYOUT[job] || PAYOUT.receptionist; return Array.from({ length: 6 }, () => Object.assign({ given: [], tries: 0 }, p.make(rnd))); },
  };
  WD.theme = (job) => { const f = WD.family(job); return f === 'kitchen' ? KITCHEN[job] || KITCHEN.cook : f === 'forge' ? FORGE[job] || FORGE.smith : f === 'sort' ? SORT[job] || SORT.courier : f === 'payout' ? PAYOUT[job] || PAYOUT.receptionist : { title: 'Bancada do pescado' }; };
  WD.FISH_BINS = [['gelo', 'Gelo · venda do dia', 'Comuns e incomuns (★1–★2) do tamanho certo'], ['vitrine', 'Vitrine nobre', 'Raros (★3 ou mais) do tamanho certo'], ['rio', 'Devolver ao rio', 'Abaixo do tamanho mínimo']];

  // ------------------------------------------------------------ sessão do dia
  let session = null;
  const mine = (s) => { const h = hero(); return !!(s && h && s.hero === h.id); };
  WD.session = () => { if (session && !mine(session)) session = null; return session; };
  WD.task = () => { const s = WD.session(); return s && s.tasks[s.i] || null; };
  WD.begin = (h, region) => {
    const j = SS.jobData(h, region), job = j.contract, def = SS.JOBS[job], cl = clock();
    if (!def) return result(false, 'Você ainda precisa ser contratado.');
    if (j.lastShiftDay === cl.day) return result(false, 'O dia de trabalho de hoje já foi pago. Volte amanhã.');
    const family = WD.family(job);
    if (family === 'cashier') return result(false, 'Este emprego é no caixa da loja.');
    const rnd = U.seeded(hash(`${h.id}|${job}|${cl.day}|${cl.elapsed}`)), sp = WD.specialty(h, job);
    session = { hero: h.id, job, family, region: SS.region(region), day: cl.day, tasks: GEN[family](job, rnd, sp, region), i: 0, scores: [], t0: now(), taskAt: now() };
    return result(true, '', { session });
  };
  WD.abort = () => { session = null; };
  const next = (s, score, note) => {
    s.scores.push(clamp(score, 0, 1)); s.last = { score: clamp(score, 0, 1), note }; s.i++; s.taskAt = now();
    return result(true, note, { score: s.last.score, done: s.i >= s.tasks.length });
  };
  // Agulha que vai e volta (cozinha e bancada de ofício): o motor e a tela usam a mesma fórmula.
  WD.needle = (t0, speed = 1) => { const t = (now() - t0) / 1000 * speed; return .5 - .5 * Math.cos(t * Math.PI * 1.25); };

  // cozinha / padaria / salão / boticário
  WD.add = (id) => { const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'kitchen' || t.phase !== 'prep' || !ING[id]) return result(false, ''); const n = Object.values(t.bowl).reduce((a, b) => a + b, 0); if (n >= 7) return result(false, `${WD.theme(s.job).bowl} cheia.`); t.bowl[id] = (t.bowl[id] || 0) + 1; return result(true, ''); };
  WD.remove = (id) => { const t = WD.task(), s = WD.session(); if (!s || !t || s.family !== 'kitchen' || t.phase !== 'prep' || !t.bowl[id]) return result(false, ''); if (!--t.bowl[id]) delete t.bowl[id]; return result(true, ''); };
  WD.cook = () => { const t = WD.task(), s = WD.session(); if (!s || !t || s.family !== 'kitchen' || t.phase !== 'prep') return result(false, ''); if (!Object.keys(t.bowl).length) return result(false, 'Coloque os ingredientes do pedido primeiro.'); t.phase = 'cook'; t.cookAt = now(); return result(true, ''); };
  WD.stop = () => {
    const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'kitchen' || t.phase !== 'cook') return result(false, '');
    const pos = WD.needle(t.cookAt), inZone = pos >= t.zone[0] && pos <= t.zone[1], dist = inZone ? 0 : Math.min(Math.abs(pos - t.zone[0]), Math.abs(pos - t.zone[1]));
    const timing = inZone ? 1 : Math.max(0, 1 - dist * 5);
    const keys = new Set([...Object.keys(t.need), ...Object.keys(t.bowl)]); let right = 0, total = 0;
    for (const k of keys) { const a = t.need[k] || 0, b = t.bowl[k] || 0; right += Math.min(a, b); total += Math.max(a, b); }
    const ing = total ? right / total : 0, late = (now() - s.taskAt) / 1000 > t.limit ? .15 : 0;
    t.phase = 'done'; t.pos = pos;
    const score = .6 * ing + .4 * timing - late;
    return next(s, score, ing === 1 ? (inZone ? 'Perfeito! Pedido entregue.' : 'Ingredientes certos, mas passou do ponto.') : ing >= .6 ? 'Quase: faltou ou sobrou algum ingrediente.' : 'O pedido voltou: ingredientes errados.');
  };
  // bancada do pescado
  WD.sortFish = (bin) => {
    const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'fish' || t.phase !== 'sort') return result(false, '');
    t.chosen = bin; const ok = bin === t.bin;
    if (ok && bin !== 'rio') { t.phase = 'clean'; return result(true, 'Certo! Agora limpe o peixe.', { clean: true }); }
    return next(s, ok ? 1 : 0, ok ? 'Certo! Devolvido ao rio com cuidado.' : t.bin === 'rio' ? `Pequeno demais: abaixo de ${t.fish.minKeep} cm volta ao rio.` : t.bin === 'vitrine' ? 'Era raro: vai para a vitrine nobre.' : 'Esse ia para o gelo.');
  };
  WD.clean = () => { const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'fish' || t.phase !== 'clean') return result(false, ''); t.taps++; if (t.taps < 4) return result(true, '', { taps: t.taps }); return next(s, 1, 'Peixe limpo e guardado.'); };
  // bigorna / marcenaria / lapidação
  WD.strike = () => {
    const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'forge') return result(false, '');
    if (!t.zone) return result(false, '');
    const pos = WD.needle(t.at, t.speed), mid = (t.zone[0] + t.zone[1]) / 2, half = (t.zone[1] - t.zone[0]) / 2, d = Math.abs(pos - mid);
    const q = d <= half * .35 ? 1 : d <= half ? .75 : d <= half + .07 ? .35 : 0;
    t.hits.push({ pos, q }); t.zone = null;
    if (t.hits.length >= t.strikes) return next(s, t.hits.reduce((a, b) => a + b.q, 0) / t.strikes, `${t.piece} pronta.`);
    return result(true, q >= 1 ? 'Golpe perfeito!' : q >= .75 ? 'Bom golpe.' : q > 0 ? 'Quase.' : 'Errou o ponto.', { q });
  };
  WD.aim = () => { const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'forge' || t.zone) return t && t.zone; const c = .18 + Math.random() * .64; t.zone = [clamp(c - t.width / 2, .03, .97 - t.width), clamp(c - t.width / 2, .03, .97 - t.width) + t.width]; t.at = now(); return t.zone; };
  // triagem
  WD.sortItem = (bin) => {
    const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'sort') return result(false, '');
    const ok = bin === t.bin, late = (now() - s.taskAt) / 1000 > t.limit;
    const right = (WD.theme(s.job).bins.find((b) => b[0] === t.bin) || [])[1];
    return next(s, ok ? (late ? .6 : 1) : 0, ok ? (late ? 'Certo, mas demorou.' : 'Certo!') : `Era para: ${right}.`);
  };
  // caixa e troco
  WD.give = (v) => { const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'payout' || !WD.theme(s.job).coins.includes(v)) return result(false, ''); if (t.given.length >= 20) return result(false, ''); t.given.push(v); return result(true, ''); };
  WD.take = (i) => { const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'payout' || !(i >= 0 && i < t.given.length)) return result(false, ''); t.given.splice(i, 1); return result(true, ''); };
  WD.confirm = () => {
    const s = WD.session(), t = WD.task(); if (!s || !t || s.family !== 'payout') return result(false, '');
    const sum = t.given.reduce((a, b) => a + b, 0);
    if (sum === t.amount) return next(s, t.tries ? .6 : 1, t.tries ? 'Agora sim, valor certo.' : 'Valor certo!');
    t.tries++;
    if (t.tries >= 2) return next(s, 0, `O certo era ${t.amount} ${WD.theme(s.job).unit}.`);
    t.given = [];
    return result(true, sum > t.amount ? `Passou: você entregou ${sum}. Confira a conta e tente de novo.` : `Faltou: você entregou ${sum}. Confira a conta e tente de novo.`, { retry: true });
  };
  WD.finish = () => {
    const s = WD.session(), h = hero(); if (!s || !h) return result(false, 'Nenhum dia de trabalho em andamento.');
    if (s.i < s.tasks.length) return result(false, 'Termine as tarefas do dia primeiro.');
    const acc = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
    const r = WD.reward(h, s.job, s.region, acc); session = null; return r;
  };

  // ------------------------------------------------------------ fornecedor de pescado
  const TIERS = [{ min: 0, name: 'Fornecedor iniciante' }, { min: 12, name: 'Parceiro da peixaria' }, { min: 35, name: 'Fornecedor oficial' }, { min: 80, name: 'Fornecedor-mestre' }];
  WD.supplier = (h = hero()) => {
    if (!h) return null;
    const d = h.supplier = h.supplier && typeof h.supplier === 'object' ? h.supplier : {};
    d.rep = Math.max(0, Number(d.rep) || 0); d.delivered = Number(d.delivered) || 0; d.earned = Number(d.earned) || 0;
    d.boards = d.boards && typeof d.boards === 'object' ? d.boards : {};
    return d;
  };
  WD.tier = (h = hero()) => { const r = WD.supplier(h).rep; let i = 0; TIERS.forEach((t, k) => { if (r >= t.min) i = k; }); return Object.assign({ i, rep: r, bonus: i * 5, next: TIERS[i + 1] || null }, TIERS[i]); };
  WD.orders = (h, region) => {
    region = SS.region(region); const d = WD.supplier(h), day = clock().day; let b = d.boards[region];
    if (!b || b.day !== day) {
      const rnd = U.seeded(hash(`${h.id}|${region}|${day}|peixaria`)), t = WD.tier(h), pool = shuffle(WD.regionFish(region).filter((f) => f.r <= 3), rnd);
      const orders = pool.slice(0, 3 + (t.i >= 2 ? 1 : 0)).map((f, i) => ({ id: `${day}-${i}`, fish: f.id, qty: f.r >= 3 ? 1 : f.r === 2 ? 1 + Math.floor(rnd() * 2) : 2 + Math.floor(rnd() * 3), unit: Math.round(f.price * (1.5 + t.i * .1)), done: false }));
      b = d.boards[region] = { day, orders }; E.Store.save();
    }
    return b.orders;
  };
  const fishBag = (h) => E.Life.data(h).fish;
  WD.deliver = (h, region, id) => {
    const o = WD.orders(h, region).find((x) => x.id === id), f = o && E.L.FISH[o.fish];
    if (!o || !f) return result(false, 'Encomenda não encontrada.');
    if (o.done) return result(false, 'Essa encomenda já foi entregue.');
    const bag = fishBag(h), have = bag[o.fish] || 0;
    if (have < o.qty) return result(false, `Faltam ${o.qty - have} × ${f.name}. Pesque nos lagos e rios desta região.`);
    bag[o.fish] = have - o.qty; if (!bag[o.fish]) delete bag[o.fish];
    const gold = o.unit * o.qty, d = WD.supplier(h), before = WD.tier(h).i;
    h.gold += gold; o.done = true; d.rep += o.qty * (f.r || 1); d.delivered += o.qty; d.earned += gold;
    if (E.Life) E.Life.addXp(h, 'pesca', 6 * o.qty * (f.r || 1));
    const xp = 8 * o.qty * (f.r || 1), levels = E.C.addXp(h, xp);
    save(); if (E.HUD) E.HUD.update();
    const t = WD.tier(h);
    return result(true, `Encomenda entregue: ${o.qty} × ${f.name}. +${gold} po · +${xp} XP.${t.i > before ? ` Agora você é ${t.name}!` : ''}`, { gold, xp, levels, tierUp: t.i > before });
  };
  WD.fishPrice = (h, id) => { const f = E.L.FISH[id]; return f ? Math.round(f.price * (1 + WD.tier(h).bonus / 100)) : 0; };
  WD.sellFish = (h, id, n) => {
    const f = E.L.FISH[id], bag = fishBag(h); n = Math.floor(Number(n));
    if (!f || !(n > 0) || (bag[id] || 0) < n) return result(false, 'Você não tem esse peixe nessa quantidade.');
    const gold = WD.fishPrice(h, id) * n, d = WD.supplier(h);
    bag[id] -= n; if (!bag[id]) delete bag[id];
    h.gold += gold; d.earned += gold; d.sold = (Number(d.sold) || 0) + n; if (d.sold % 4 < n) d.rep += 1;
    if (E.Life) E.Life.addXp(h, 'pesca', Math.min(20, n * 2));
    save(); if (E.HUD) E.HUD.update();
    return result(true, `${n} × ${f.name} vendido(s) à peixaria por ${gold} po.`, { gold, n });
  };
  E.Workday = WD;
})();
