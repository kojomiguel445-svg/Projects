/* Carteira de trabalho: um vínculo por vez, histórico de empregos e entrevista com resposta livre.
   A entrevista é avaliada por um SISTEMA DE REGRAS local (palavras-chave, negações e critérios fixos),
   não por IA generativa: nada sai do navegador e as respostas do jogador não são guardadas. */
(() => {
  'use strict';
  const U = E.U, SS = E.Settlements, K = {};
  const hero = () => E.Store.hero();
  const clock = () => E.Sim ? E.Sim.clock() : { day: 1, elapsed: 0 };
  const save = () => { E.Store.save(); U.emit('settlement:changed'); };
  const result = (ok, message, extra = {}) => Object.assign({ ok, message }, extra);
  const MAX_CHARS = 240, PASS = 58;

  // ------------------------------------------------------------ carteira e vínculo único
  K.card = (h = hero()) => {
    const d = SS.data(h); if (!d) return null;
    const c = d.card = d.card && typeof d.card === 'object' ? d.card : {};
    c.history = Array.isArray(c.history) ? c.history.slice(-12) : [];
    if (c.hired && typeof c.hired !== 'object') c.hired = null;
    return c;
  };
  const contracts = (h) => Object.entries(SS.data(h).jobs).filter(([, j]) => j && j.contract && SS.JOBS[j.contract]);
  const archive = (h, region, j, reason) => {
    const c = K.card(h), def = SS.JOBS[j.contract], from = c.hired && c.hired.region === region && c.hired.job === j.contract ? c.hired.day : null;
    c.history.push({ job: j.contract, title: def ? def.name : j.contract, place: def ? def.place : '', region, from, to: clock().day, shifts: j.shifts || 0, reason });
    c.history = c.history.slice(-12);
  };
  // Saves antigos, nuvem ou duas abas podem trazer contratos em regiões diferentes: só um permanece.
  K.normalize = (h = hero()) => {
    if (!h) return null;
    const c = K.card(h), list = contracts(h);
    if (list.length > 1) {
      const keep = list.find(([r, j]) => c.hired && c.hired.region === r && c.hired.job === j.contract)
        || list.slice().sort((a, b) => (b[1].lastShiftDay || 0) - (a[1].lastShiftDay || 0) || (b[1].shifts || 0) - (a[1].shifts || 0))[0];
      for (const [r, j] of list) if (j !== keep[1]) { archive(h, r, j, 'Encerrado: só é permitido um emprego por vez'); j.contract = null; j.appointment = null; }
      const d = SS.data(h); if (d.activeShift && d.activeShift.region !== keep[0]) d.activeShift = null;
      E.Store.save();
    }
    const now = contracts(h)[0];
    if (now && !(c.hired && c.hired.region === now[0] && c.hired.job === now[1].contract)) c.hired = { job: now[1].contract, region: now[0], day: c.hired && c.hired.day || clock().day };
    if (!now) c.hired = null;
    return now ? { id: now[1].contract, region: now[0], def: SS.JOBS[now[1].contract], data: now[1], since: c.hired.day } : null;
  };
  K.current = (h = hero()) => K.normalize(h);
  // Regra única usada pela entrevista nova e pelas rotas antigas de contratação.
  K.canApply = (h, r, id) => {
    const cur = K.current(h), def = SS.JOBS[id];
    if (!def) return result(false, 'Vaga inexistente.');
    if (cur && cur.id === id && cur.region === SS.region(r)) return result(false, `Você já trabalha como ${def.name} aqui.`);
    if (cur) return result(false, `Sua carteira já registra ${cur.def.name} em ${SS.regionName(cur.region)}. Peça demissão antes de aceitar outra vaga.`);
    return result(true, '');
  };
  const hire = (h, r, id) => {
    const gate = K.canApply(h, r, id); if (!gate.ok) return gate;
    const j = legacyJobData(h, r); j.contract = id; j.appointment = null; j.shifts = 0; j.lastShiftDay = 0;
    K.card(h).hired = { job: id, region: SS.region(r), day: clock().day };
    return result(true, '');
  };
  // As funções antigas continuam existindo (painéis e testes antigos), mas passam pela mesma regra.
  const legacySchedule = SS.scheduleInterview, legacyInterview = SS.interview, legacyResign = SS.resign, legacyJobData = SS.jobData;
  SS.jobData = (h, r) => { K.normalize(h); return legacyJobData(h, r); };
  SS.scheduleInterview = (h, r, id, o) => { const g = K.canApply(h, r, id); return g.ok ? legacySchedule(h, r, id, o) : g; };
  SS.interview = (h, r, answer) => {
    const j = SS.jobData(h, r), a = j.appointment, g = a ? K.canApply(h, r, a.id) : result(true, '');
    if (!g.ok) { j.appointment = null; save(); return g; }
    const res = legacyInterview(h, r, answer);
    if (res.ok) K.card(h).hired = { job: j.contract, region: SS.region(r), day: clock().day }, save();
    return res;
  };
  SS.resign = (h, r) => {
    const j = SS.jobData(h, r);
    if (j.contract) archive(h, SS.region(r), j, 'Pediu demissão');
    const res = legacyResign(h, r);
    if (res.ok) K.card(h).hired = null; save();
    return res;
  };

  // ------------------------------------------------------------ avaliação por regras
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // Negações e intenções contrárias ("para evitar roubos") anulam o sinal da palavra seguinte.
  const NEG = new Set(['nao', 'nunca', 'jamais', 'nem', 'sem', 'evitar', 'evito', 'impedir', 'impeco', 'prevenir', 'contra', 'combater']);
  // Quando quem grita ou xinga é o cliente, a frase descreve a situação, não a conduta do candidato.
  const OTHER = new Set(['cliente', 'ele', 'ela', 'eles', 'elas', 'pessoa', 'alguem', 'fregues']);
  // Cada grupo tem um nome legível usado nas reações e na justificativa final.
  const G = {
    polite: ['bom dia', 'boa tarde', 'boa noite', 'ola', 'obrigad', 'por favor', 'prazer', 'com licenca', 'senhor', 'senhora'],
    motive: ['aprender', 'crescer', 'gosto', 'gostaria', 'vontade', 'ajudar', 'atender', 'pessoas', 'clientes', 'cliente', 'comunidade', 'vila', 'loja', 'emporio', 'oportunidade', 'dedica', 'sustentar', 'familia', 'juntar', 'economizar', 'conhecer', 'servir', 'ganhar a vida', 'independ'],
    exp: ['trabalhei', 'ja trabalh', 'experiencia', 'ajudava', 'ajudei', 'cuidava', 'cuidei', 'vendi', 'vendia', 'feira', 'barraca', 'banca', 'contas', 'calcul', 'contava', 'contei', 'atendi', 'atendia', 'balcao', 'mercado', 'padaria', 'armazem', 'taverna', 'meu pai', 'minha mae', 'meu tio', 'minha tia', 'anos', 'aprendi'],
    money: ['caixa', 'troco', 'moeda', 'dinheiro', 'pagamento', 'preco', 'valor', 'conta', 'nota', 'gaveta', 'ouro'],
    calm: ['calma', 'calmo', 'respir', 'paciencia', 'paciente', 'tranquil', 'sereno', 'educad', 'gentil', 'respeit', 'cordial'],
    listen: ['ouvir', 'ouco', 'escut', 'entender', 'entendo', 'pergunt', 'explic', 'mostr'],
    check: ['confer', 'recont', 'contar de novo', 'conto de novo', 'verific', 'checar', 'checo', 'revis', 'comprovante', 'recibo', 'registro', 'anot'],
    fix: ['corrig', 'corrijo', 'devolv', 'devolvo', 'resolv', 'diferenca', 'acert', 'compens', 'reembols', 'troco certo'],
    sorry: ['desculp', 'peco perdao', 'perdao', 'lamento', 'sinto muito', 'assumo', 'reconheco', 'admito', 'erro foi meu', 'minha culpa'],
    escalate: ['chamar o', 'chamo o', 'gerente', 'responsavel', 'dono', 'patrao', 'supervisor', 'mestre bento', 'avisar o', 'aviso o'],
    pace: ['organiz', 'fila', 'ordem', 'atencao', 'foco', 'concentr', 'separ', 'um de cada vez', 'um por vez', 'ritmo', 'agil', 'rapid', 'preparad', 'antes de abrir'],
    trust: ['pontual', 'horario', 'cedo', 'cumpr', 'confianca', 'confiar', 'confiavel', 'honest', 'compromisso', 'serio', 'responsabilidade', 'todos os dias', 'sempre', 'disponivel', 'manha', 'tarde', 'turno'],
  };
  const LABEL = { motive: 'vontade de ajudar e aprender', exp: 'experiência anterior', money: 'cuidado com o dinheiro', calm: 'manter a calma', listen: 'ouvir o cliente', check: 'conferir antes de concluir', fix: 'corrigir a diferença', sorry: 'assumir o erro', escalate: 'chamar o responsável quando preciso', pace: 'organização e ritmo', trust: 'compromisso com o horário', polite: 'educação' };
  // Sinais negativos só contam sem negação próxima ("nunca roubaria" não é alerta).
  const FLAGS = [['roub', 'falar em roubar'], ['furt', 'falar em furtar'], ['embols', 'embolsar dinheiro'], ['desvi', 'desviar dinheiro'], ['engan', 'enganar o cliente'], ['ment', 'mentir'], ['escond', 'esconder problemas'], ['xing', 'xingar o cliente'], ['bater', 'agressão'], ['brig', 'brigar com o cliente'], ['expuls', 'expulsar o cliente'], ['ignor', 'ignorar o cliente'], ['grit', 'gritar'], ['idiota', 'desrespeito'], ['otario', 'desrespeito'], ['tanto faz', 'desinteresse'], ['preguic', 'desinteresse'], ['atras', 'atrasos']];
  const negated = (words, i, span = 2) => words.slice(Math.max(0, i - span), i).some(p => NEG.has(p));
  // Palavra: começa com o radical e não está negada logo antes. Expressão: aparece inteira.
  const hits = (t, list) => {
    const words = t.split(' '), pad = ' ' + t + ' ';
    return list.filter(k => k.includes(' ') ? pad.includes(' ' + k + ' ') || pad.includes(' ' + k) : words.some((w, i) => w.startsWith(k) && !negated(words, i))).length;
  };
  function flags(t) {
    const words = t.split(' '), out = [];
    words.forEach((w, i) => {
      for (const [stem, label] of FLAGS) {
        if (stem.includes(' ') || !w.startsWith(stem)) continue;
        if (stem === 'ment' && !/^ment(ir|i|ia|iria|indo|ira)$/.test(w)) continue;
        if (stem === 'atras' && !/^atras(ar|o|os|ado|ada|ando)$/.test(w)) continue;
        if (negated(words, i, 3) || words.slice(Math.max(0, i - 2), i).some(p => OTHER.has(p))) continue;
        out.push(label);
      }
    });
    for (const [stem, label] of FLAGS) {
      if (!stem.includes(' ')) continue;
      const at = (' ' + t + ' ').indexOf(' ' + stem + ' '), before = at < 0 ? [] : t.slice(0, at).split(' ').filter(Boolean);
      if (at >= 0 && !negated(before, before.length, 3)) out.push(label);
    }
    const away = /(mando|mandar|mandaria|boto|botar|ponho|por) (o cliente |ele |ela |o fregues )?(embora|pra fora|para fora)/.exec(t);
    if (away) { const before = t.slice(0, away.index).split(' ').filter(Boolean); if (!negated(before, before.length, 3)) out.push('mandar o cliente embora'); }
    // Ficar com dinheiro do caixa, mesmo sem a palavra "roubar".
    const take = /(pego|pegar|pegaria|guardo|guardar|fico com|ficar com|ficaria com|levo|levar)( [a-z]+){0,3} (moedas?|dinheiro|troco|ouro)( [a-z]+){0,3} (pra mim|para mim|no bolso|pro bolso|pro meu bolso)/.exec(t);
    if (take) { const before = t.slice(0, take.index).split(' ').filter(Boolean); if (!negated(before, before.length, 3)) out.push('ficar com dinheiro do caixa'); }
    return [...new Set(out)];
  }
  function gibberish(raw, t) {
    const words = t.split(' ').filter(Boolean);
    if (!words.length) return true;
    const odd = words.filter(w => w.length > 3 && !/[aeiou]/.test(w) || /(.)\1\1/.test(w) || /^(k|h|a|s|d|f)+$/.test(w)).length;
    return odd / words.length > .45;
  }
  K.analyze = (raw, topics) => {
    const t = norm(raw), words = t ? t.split(' ') : [], n = words.length, g = {};
    for (const k of Object.keys(G)) g[k] = hits(t, G[k]);
    const extra = topics.extra ? hits(t, topics.extra) : 0;
    const junk = gibberish(raw, t), caps = raw.length > 12 && raw === raw.toUpperCase() && /[A-Z]/.test(raw);
    let comm = n < 3 ? .15 : n < 7 ? .5 : n <= 45 ? 1 : .8;
    if (g.polite) comm += .1; if (caps) comm -= .25; if (junk) comm = .05;
    const topicHits = Math.min(4, topics.groups.reduce((s, k) => s + Math.min(2, g[k]), 0) + Math.min(2, extra));
    const coh = junk ? 0 : Math.min(1, .2 + topicHits * .22 + (n >= 7 ? .1 : 0));
    const fl = flags(t);
    return { n, g, extra, junk, caps, comm: U.clamp(comm, 0, 1), coh, flags: fl, groups: Object.keys(G).filter(k => g[k] && k !== 'polite') };
  };

  // ------------------------------------------------------------ perguntas (adaptativas)
  const PERSON = {
    acolhedor: { name: 'acolhedor', w: { coh: .2, comm: .2, motive: .24, situ: .22, trust: .14 }, ok: ['Que bom ouvir isso.', 'Gosto dessa maneira de pensar.', 'Isso me deixa tranquilo.'], meh: ['Entendo.', 'Certo, vamos seguir.', 'Hum, compreendo.'], bad: ['Isso me preocupa um pouco.', 'Não era bem isso que eu esperava ouvir.'] },
    exigente: { name: 'exigente', w: { coh: .22, comm: .16, motive: .14, situ: .32, trust: .16 }, ok: ['Correto.', 'É exatamente o que eu cobro aqui.', 'Bom. Precisão é tudo no caixa.'], meh: ['Hum. Poderia ser mais preciso.', 'Anotado.', 'Vago, mas vamos adiante.'], bad: ['Isso não serve para o meu caixa.', 'Resposta fraca.'] },
    pratico: { name: 'prático', w: { coh: .24, comm: .26, motive: .14, situ: .24, trust: .12 }, ok: ['Direto ao ponto. Gosto disso.', 'Ótimo, sem rodeios.', 'Entendido, faz sentido.'], meh: ['Certo.', 'Tá, e daí?', 'Pode ser.'], bad: ['Não me convenceu.', 'Isso não funciona aqui.'] },
  };
  const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  K.personality = (r, place) => ['acolhedor', 'exigente', 'pratico'][hash(SS.region(r) + ':' + place) % 3];
  // O caixa do empório tem perguntas próprias; os demais ofícios usam as tarefas já existentes do emprego.
  const STOP = new Set(['para', 'como', 'antes', 'depois', 'quando', 'pelo', 'pela', 'com', 'que', 'uma', 'umas', 'uns', 'dos', 'das', 'nos', 'nas', 'sem', 'este', 'esta', 'essa', 'esse', 'conforme']);
  const keywords = (s) => [...new Set(norm(s).split(' ').filter(w => w.length > 3 && !STOP.has(w)).map(w => w.slice(0, Math.max(4, w.length - 2))))];
  function script(id) {
    const def = SS.JOBS[id], cashier = id === 'clerk';
    const task = def.tasks[1] || def.tasks[0], extra = cashier ? [] : keywords(task.a[task.ok]);
    return {
      cashier, extra,
      q1: cashier ? 'Por que você quer trabalhar no caixa do empório?' : `Por que você quer trabalhar como ${def.name.toLowerCase()} aqui?`,
      q3: cashier ? 'Um cliente volta ao balcão dizendo que recebeu o troco errado e começa a se exaltar na frente da fila. O que você faz?' : `Imagine a situação: ${task.q.replace(/\.\.\.$/, '').trim()} O que você faria?`,
      q3groups: cashier ? ['calm', 'listen', 'check', 'fix', 'sorry', 'escalate', 'money'] : ['calm', 'listen', 'check', 'fix', 'escalate', 'sorry'],
    };
  }
  function nextQuestion(s) {
    const a = s.answers, last = a[a.length - 1];
    if (s.step === 1) return { key: 'q1', text: s.script.q1, groups: ['motive', 'exp', 'trust'] };
    if (s.step === 2) return last && last.g.exp
      ? { key: 'q2', text: s.script.cashier ? 'Você comentou que já trabalhou antes. O que aprendeu lidando com dinheiro e com clientes?' : 'Você comentou que já trabalhou antes. O que aprendeu nesse serviço?', groups: ['exp', 'money', 'listen', 'check', 'pace'] }
      : { key: 'q2', text: s.script.cashier ? 'Já precisou fazer contas, cuidar de dinheiro ou atender alguém? Conte como foi.' : 'Já fez algum trabalho parecido, mesmo ajudando a família? Conte como foi.', groups: ['exp', 'money', 'listen', 'check', 'pace'] };
    if (s.step === 3) return { key: 'q3', text: s.script.q3, groups: s.script.q3groups, extra: s.script.extra };
    if (s.step === 4) {
      const avg = a.reduce((x, y) => x + y.n, 0) / a.length, q3 = a[2] || {};
      if (a.some(x => x.flags.length)) return { key: 'q4', text: 'Uma coisa que você disse me deixou com a pulga atrás da orelha. Se ninguém estivesse olhando a gaveta do caixa, como você agiria?', groups: ['trust', 'check', 'money'], honesty: true };
      if (avg < 6) return { key: 'q4', text: 'Suas respostas estão bem curtas. Me dê um exemplo concreto: uma vez em que você resolveu um problema com calma.', groups: ['calm', 'fix', 'listen', 'exp'] };
      if ((q3.situ || 0) < .34) return { key: 'q4', text: 'E se, ao recontar, você descobrir que o erro foi seu? O que diz ao cliente?', groups: ['sorry', 'fix', 'calm', 'check'] };
      return { key: 'q4', text: s.script.cashier ? 'No fim da tarde a fila dobra de tamanho. Como você mantém o ritmo sem errar o troco?' : 'Em dias de muito movimento, como você mantém o ritmo sem perder a qualidade?', groups: ['pace', 'check', 'calm'] };
    }
    if (s.step === 5) return { key: 'q5', text: 'Para terminar: que horários você consegue cumprir, e por que eu deveria confiar este trabalho a você?', groups: ['trust', 'motive'] };
    return null;
  }

  // ------------------------------------------------------------ sessão de entrevista
  let session = null;
  K.session = () => session;
  K.begin = (h, r, id, place) => {
    r = SS.region(r); const def = SS.JOBS[id], j = SS.jobData(h, r), cl = clock();
    if (!def || !SS.availableJobs(h, r, place).some(x => x.id === id) || def.place !== place) return result(false, 'Esta vaga não é oferecida neste estabelecimento.');
    const g = K.canApply(h, r, id); if (!g.ok) return g;
    if (j.interviewDay === cl.day) return result(false, 'Você já fez uma entrevista nesta vila hoje. Volte amanhã.');
    // A tentativa é registrada no início: sair no meio não dá direito a outra no mesmo dia.
    j.interviewDay = cl.day; j.appointment = null; save();
    const owner = (E.Interior && E.Interior.kit && E.Interior.kit.merchantNames[place]) || 'O responsável';
    session = { token: U.uid(), id, region: r, place, owner, mood: K.personality(r, place), step: 1, answers: [], script: script(id), done: false };
    session.question = nextQuestion(session);
    return result(true, '', { session, question: session.question });
  };
  K.cancel = () => { session = null; };
  K.answer = (token, raw) => {
    const s = session; raw = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_CHARS);
    if (!s || s.token !== token || s.done) return result(false, 'A entrevista não está em andamento.');
    if (raw.length < 2) return result(false, 'Escreva sua resposta antes de enviar.');
    const q = s.question, a = K.analyze(raw, { groups: q.groups, extra: q.extra });
    const situGroups = ['calm', 'listen', 'check', 'fix', 'sorry', 'escalate', 'pace'];
    a.situ = Math.min(1, situGroups.filter(k => a.g[k]).length / 3 + Math.min(2, a.extra) * .17);
    a.motive = Math.min(1, (a.g.motive ? .55 : 0) + (a.g.exp ? .2 : 0) + (a.n >= 7 ? .25 : 0));
    a.trust = Math.min(1, a.g.trust * .35 + (a.g.check ? .15 : 0) + (q.honesty && !a.flags.length && a.n >= 4 ? .4 : 0));
    a.key = q.key; s.answers.push(a);
    const P = PERSON[s.mood], strong = q.groups.filter(k => a.g[k] && LABEL[k]);
    let reaction;
    if (a.junk) reaction = 'Desculpe, não entendi o que você quis dizer.';
    else if (a.flags.length) reaction = `${U.pick(P.bad)} (${a.flags[0]} não combina com este trabalho.)`;
    else if (a.coh >= .7 && strong.length) reaction = `${U.pick(P.ok)} Gostei de você falar em ${LABEL[strong[0]]}${strong[1] ? ' e em ' + LABEL[strong[1]] : ''}.`;
    else if (a.n < 4) reaction = s.mood === 'pratico' ? 'Curto. Tudo bem, mas preciso entender melhor.' : 'Pode falar um pouco mais da próxima vez.';
    else reaction = U.pick(P.meh);
    s.step++;
    s.question = nextQuestion(s);
    if (!s.question) { s.done = true; return Object.assign(result(true, ''), { reaction, done: true }); }
    return Object.assign(result(true, ''), { reaction, question: s.question });
  };
  K.score = (s) => {
    const A = s.answers, avg = (f, keys) => { const l = A.filter(a => !keys || keys.includes(a.key)); return l.length ? l.reduce((x, a) => x + f(a), 0) / l.length : 0; };
    const c = {
      coh: avg(a => a.coh),
      comm: avg(a => a.comm),
      motive: Math.max(avg(a => a.motive, ['q1']), avg(a => a.motive, ['q1', 'q5'])),
      situ: Math.max(avg(a => a.situ, ['q3']), avg(a => a.situ, ['q3', 'q4'])),
      trust: Math.min(1, avg(a => a.trust, ['q5', 'q4']) + (avg(a => a.g.exp ? 1 : 0, ['q2']) ? .2 : 0)),
    };
    const P = PERSON[s.mood], flagList = [...new Set(A.flatMap(a => a.flags))];
    if (s.mood === 'pratico' && A.some(a => a.n > 60)) c.comm = Math.max(0, c.comm - .15);
    let total = Object.entries(P.w).reduce((x, [k, w]) => x + w * c[k], 0) * 100;
    total -= Math.min(40, flagList.length * (s.mood === 'exigente' ? 18 : 14));
    total += Math.min(4, Math.floor((SS.data(hero()).reputation || 0) / 20));
    return { criteria: c, flags: flagList, total: Math.round(U.clamp(total, 0, 100)) };
  };
  const NAMES = { coh: 'Coerência', comm: 'Comunicação', motive: 'Interesse', situ: 'Resolução de situações', trust: 'Confiabilidade' };
  const WEAK = { coh: 'as respostas fugiram do que eu perguntei', comm: 'suas respostas foram curtas ou confusas demais para eu conhecer você', motive: 'não ficou claro por que você quer este trabalho', situ: 'não ficou claro como você resolveria o problema do cliente', trust: 'faltou mostrar compromisso com horário e responsabilidade' };
  const GOOD = { coh: 'você respondeu exatamente ao que eu perguntei', comm: 'você se expressa com clareza', motive: 'dá para ver que você quer mesmo trabalhar aqui', situ: 'você pensou com cuidado em como resolver a situação', trust: 'passou confiança sobre horário e responsabilidade' };
  K.finish = (h, token) => {
    const s = session;
    if (!s || s.token !== token || !s.done || s.answers.length !== 5) return result(false, 'A entrevista ainda não terminou.');
    session = null;
    const sc = K.score(s), order = Object.keys(sc.criteria).sort((a, b) => sc.criteria[b] - sc.criteria[a]);
    let ok = sc.total >= PASS && !sc.flags.some(f => /roubar|furtar|embolsar|desviar|dinheiro do caixa/.test(f));
    let text;
    if (ok) {
      const r = hire(h, s.region, s.id); if (!r.ok) return r;
      const first = GOOD[order[0]];
      text = `${s.owner} fecha o caderno e estende a mão: — ${first[0].toUpperCase() + first.slice(1)}, e ${GOOD[order[1]]}. A vaga de ${SS.JOBS[s.id].name.toLowerCase()} é sua. Seu nome já está na carteira.`;
    } else {
      const weak = sc.flags.length ? `o que você disse sobre ${sc.flags[0]} pesou contra` : WEAK[order[order.length - 1]];
      text = `${s.owner} respira fundo: — Obrigado pela conversa, mas ${weak}. Por hoje vou ficar com outro candidato. Volte amanhã, se quiser tentar de novo.`;
    }
    const c = K.card(h); c.interviews = (Number(c.interviews) || 0) + 1;
    save();
    return result(ok, text, { score: sc.total, pass: PASS, criteria: Object.entries(sc.criteria).map(([k, v]) => ({ key: k, name: NAMES[k], value: Math.round(v * 100) })), flags: sc.flags, job: s.id, region: s.region });
  };
  K.PASS = PASS; K.MAX_CHARS = MAX_CHARS;
  K.method = 'Avaliação por regras locais (palavras-chave, negações e critérios fixos). Não usa IA generativa e não guarda suas respostas.';

  // ------------------------------------------------------------ carteira na interface
  K.cardHtml = (h = hero()) => {
    const cur = K.current(h), c = K.card(h), esc = U.esc;
    const row = (k, v) => `<div class="wc-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`;
    const status = cur ? 'Empregado' : 'Desempregado';
    const job = cur ? [row('Emprego atual', cur.def.name), row('Estabelecimento', `${SS.placeName(cur.def.place)} · ${SS.regionName(cur.region)}`), row('Função', cur.def.name), row('Salário', `${SS.jobPay(cur.id, cur.region)} po por turno`), row('Desde', `dia ${cur.since}`), row('Turnos pagos', String(cur.data.shifts || 0))].join('') : row('Emprego atual', 'Nenhum');
    const hist = c.history.slice().reverse().map(x => `<li><b>${esc(x.title)}</b> · ${esc(SS.regionName(x.region))}<small>${x.from ? 'dia ' + x.from + ' a ' : 'até '}dia ${x.to} · ${x.shifts || 0} turno(s) · ${esc(x.reason)}</small></li>`).join('');
    return `<div class="work-card"><div class="wc-head"><span class="wc-photo" aria-hidden="true">${esc((h.name || '?').slice(0, 1).toUpperCase())}</span><div><small>Carteira de trabalho</small><strong>${esc(h.name || 'Viajante')}</strong></div><span class="wc-status ${cur ? 'on' : ''}">${status}</span></div>${job}<div class="wc-hist"><small>Histórico profissional</small>${hist ? `<ul>${hist}</ul>` : '<p>Nenhum emprego anterior registrado.</p>'}</div><p class="wc-note">Apenas um emprego por vez. Para aceitar outra vaga, peça demissão no estabelecimento atual.</p></div>`;
  };
  K.openCard = () => {
    const h = hero(); if (!h || !E.WorldServices) return;
    E.UI.closeAll && E.UI.closeAll();
    const cur = K.current(h);
    E.WorldServices.open({ title: 'Carteira de trabalho', icon: 'journal', eyebrow: 'DOCUMENTOS', text: '', html: K.cardHtml(h), actions: cur ? [{ label: 'Mostrar meu local de trabalho', run: () => E.WorldServices.guide(cur.def.place, cur.region) }] : [{ label: 'Procurar vagas na Casa dos Ofícios', run: () => E.WorldServices.guide('guild') }] });
  };
  // ------------------------------------------------------------ expediente no caixa
  // Valores em peças de prata (pp): 1 po = 10 pp. O dinheiro da gaveta é da loja; o salário sai uma vez por dia.
  K.ACTIVITY = { clerk: 'cashier' };
  K.activity = (id) => K.ACTIVITY[id] || null;
  K.COINS = [{ id: 'po10', v: 100, label: '10 po' }, { id: 'po5', v: 50, label: '5 po' }, { id: 'po1', v: 10, label: '1 po' }, { id: 'pp5', v: 5, label: '5 pp' }, { id: 'pp1', v: 1, label: '1 pp' }];
  K.money = (v) => { v = Math.round(v); const po = Math.floor(v / 10), pp = v % 10; return po && pp ? `${po} po ${pp} pp` : po ? `${po} po` : `${pp} pp`; };
  // Cada estabelecimento pode ganhar o próprio catálogo; o empório é o primeiro com caixa jogável.
  K.CATALOG = { general: [
    { id: 'pao', name: 'Pão de viagem', price: 4, color: '#c99a5b' }, { id: 'vela', name: 'Vela de sebo', price: 2, color: '#efe3c0' },
    { id: 'isca', name: 'Isca de minhoca', price: 3, color: '#8d6b4f' }, { id: 'linha', name: 'Linha de pesca', price: 7, color: '#d9d2b8' },
    { id: 'sabao', name: 'Sabão de cinzas', price: 6, color: '#b9c7b1' }, { id: 'pederneira', name: 'Pederneira', price: 8, color: '#6f7378' },
    { id: 'corda', name: 'Corda de cânhamo', price: 12, color: '#b58b53' }, { id: 'cantil', name: 'Cantil de couro', price: 15, color: '#7b5236' },
    { id: 'mapa', name: 'Mapa da região', price: 20, color: '#e2cf9a' }, { id: 'lanterna', name: 'Lanterna de mão', price: 35, color: '#d6a640' },
  ] };
  const FLOAT = { po10: 0, po5: 2, po1: 6, pp5: 6, pp1: 10 }, CUSTOMERS = 5;
  const coinSum = (coins) => K.COINS.reduce((t, c) => t + (coins[c.id] || 0) * c.v, 0);
  const coinsOf = (v) => { const out = {}; for (const c of K.COINS) { const n = Math.floor(v / c.v); if (n) { out[c.id] = n; v -= n * c.v; } } return out; };
  K.coinSum = coinSum;
  // Às vezes o cliente paga o valor exato; nas outras, entrega a próxima quantia redonda.
  function payWith(total) {
    if (U.rand() < .2) return coinsOf(total);
    const options = [10, 20, 50, 100, 200].filter(v => v > total);
    return coinsOf(options[Math.min(options.length - 1, Math.floor(U.rand() * 2))]);
  }
  function customer(cat, i) {
    const pool = cat.slice(), lines = [], n = 1 + Math.floor(U.rand() * 3);
    for (let k = 0; k < n; k++) { const it = pool.splice(Math.floor(U.rand() * pool.length), 1)[0]; lines.push({ id: it.id, name: it.name, price: it.price, color: it.color, qty: it.price < 10 && U.rand() < .3 ? 2 : 1, scanned: 0 }); }
    const total = lines.reduce((t, l) => t + l.price * l.qty, 0), pay = payWith(total);
    return { i, lines, total, pay, paid: coinSum(pay), state: 'shopping', tries: 0 };
  }
  let shift = null;
  K.shift = () => shift;
  K.shiftStart = (h, r) => {
    r = SS.region(r); const cur = K.current(h), cl = clock(), d = SS.data(h);
    if (!cur || cur.region !== r || K.activity(cur.id) !== 'cashier') return result(false, 'Você não está contratado para o caixa desta loja.');
    if (cur.data.lastShiftDay === cl.day) return result(false, 'O turno de hoje já foi pago. Volte amanhã.');
    if (d.activeShift) return result(false, 'Termine o turno que já está em andamento.');
    const cat = K.CATALOG[cur.def.place] || K.CATALOG.general;
    shift = { token: U.uid(), region: r, job: cur.id, day: cl.day, customers: Array.from({ length: CUSTOMERS }, (_, i) => customer(cat, i)), served: 0, errors: 0, sales: 0, drawer: { ...FLOAT }, tray: {}, at: -1 };
    shift.float = coinSum(shift.drawer);
    return result(true, 'Ponto registrado. Assuma o caixa atrás do balcão.', { shift });
  };
  const live = (token) => shift && shift.token === token ? shift : null;
  const front = (s) => s && s.at >= 0 ? s.customers[s.at] : null;
  // O cliente só é atendido quando chega ao balcão e o anterior já foi embora.
  K.arrive = (token, i) => {
    const s = live(token), cur = front(s); if (!s || !s.customers[i] || cur && cur.state !== 'done') return null;
    s.at = i; s.customers[i].state = 'scan'; s.tray = {}; return s.customers[i];
  };
  K.scan = (token, li) => {
    const c = front(live(token)), l = c && c.state === 'scan' && c.lines[li]; if (!l || l.scanned >= l.qty) return null;
    l.scanned++; return { line: l, all: c.lines.every(x => x.scanned === x.qty) };
  };
  K.bill = (token) => {
    const c = front(live(token)); if (!c || c.state !== 'scan' || !c.lines.every(x => x.scanned === x.qty)) return null;
    c.state = 'pay'; return { total: c.total, pay: { ...c.pay }, paid: c.paid };
  };
  K.receive = (token) => {
    const s = live(token), c = front(s); if (!c || c.state !== 'pay') return null;
    for (const [k, n] of Object.entries(c.pay)) s.drawer[k] = (s.drawer[k] || 0) + n;
    c.state = 'change'; return { total: c.total, paid: c.paid };
  };
  K.tray = (token, id, delta) => {
    const s = live(token), c = front(s); if (!c || c.state !== 'change' || !K.COINS.some(x => x.id === id)) return null;
    const from = delta > 0 ? s.drawer : s.tray, to = delta > 0 ? s.tray : s.drawer;
    if (!(from[id] > 0)) return coinSum(s.tray);
    from[id]--; to[id] = (to[id] || 0) + 1; return coinSum(s.tray);
  };
  K.giveChange = (token) => {
    const s = live(token), c = front(s); if (!c || c.state !== 'change') return null;
    const due = c.paid - c.total, given = coinSum(s.tray);
    if (given !== due) {
      // O cliente devolve as moedas para o caixa recontar; os dois primeiros erros contam no turno.
      for (const [k, n] of Object.entries(s.tray)) s.drawer[k] = (s.drawer[k] || 0) + n;
      s.tray = {}; c.tries++; if (c.tries <= 2) s.errors++;
      return { ok: false, short: given < due, hint: c.tries >= 2 ? K.money(due) : null };
    }
    s.tray = {}; c.state = 'done'; s.sales += c.total; s.served++;
    return { ok: true, change: due, last: s.served === s.customers.length };
  };
  K.shiftFinish = (h, token) => {
    const s = live(token); if (!s || s.served !== s.customers.length) return result(false, 'Atenda todos os clientes antes de fechar o caixa.');
    const j = legacyJobData(h, s.region), cl = clock(), d = SS.data(h);
    if (j.contract !== s.job || j.lastShiftDay === cl.day || !Number.isFinite(h.gold)) { shift = null; return result(false, 'Este turno não pode ser pago.'); }
    const drawer = coinSum(s.drawer), balanced = drawer === s.float + s.sales;
    const acc = Math.max(0, 1 - s.errors / (s.customers.length * 1.5)), pay = Math.round(SS.jobPay(s.job, s.region) * (.6 + .4 * acc));
    j.lastShiftDay = cl.day; j.shifts = (j.shifts || 0) + 1; d.reputation += Math.max(0, 3 - s.errors); h.gold += pay;
    if (E.Sim) { const sd = E.Sim.data(h); sd.hunger = Math.max(0, sd.hunger - 3); }
    if (E.Life && E.Life.addXp && E.L && E.L.PROFS && E.L.PROFS.comercio) E.Life.addXp(h, 'comercio', 4 + Math.round(acc * 6));
    shift = null; save();
    return result(true, `Caixa fechado: ${s.served} clientes, ${K.money(s.sales)} em vendas${balanced ? ', gaveta conferida' : ''}. Salário: ${pay} po.`, { pay, errors: s.errors, sales: s.sales, served: s.served, balanced });
  };
  K.shiftAbort = () => { shift = null; };
  // O turno antigo de perguntas não vale para quem trabalha no caixa: um caminho só por emprego.
  const legacyStart = SS.startShift;
  SS.startShift = (h, r) => { const j = SS.jobData(h, r); return K.activity(j.contract) === 'cashier' ? result(false, 'O caixa do empório é operado no balcão: entre no salão e assuma o caixa.') : legacyStart(h, r); };
  E.Work = K;
})();
