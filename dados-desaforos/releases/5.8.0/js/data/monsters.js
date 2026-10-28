/* Bestiário — blocos de estatísticas baseados no SRD 5.2 / Manual dos Monstros (2024).
   ataque: { n:nome, b:bônus, d:dano, t:tipo, x:[dano extra, tipo], fx:{efeito}, r:'dist' }  */
(() => {
  const M = {};
  const A = (f, d, c, i, s, ca) => ({ for: f, des: d, con: c, int: i, sab: s, car: ca });

  M.MONSTERS = {
    // -------------------- Bosque --------------------
    lobo: {
      name: 'Lobo', cr: 0.25, type: 'besta', size: 'Médio', ac: 12, hp: '2d8+2', ab: A(14, 15, 12, 3, 12, 6),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 4, d: '1d6+2', t: 'perfurante', fx: { cond: 'caido' } }],
      sprite: 'wolf', pal: ['#8a8f99', '#5d626b', '#d8dbe0'], desc: 'Caçadores em matilha que cercam a presa até derrubá-la.',
    },
    lobo_atroz: {
      name: 'Lobo Atroz', cr: 1, type: 'besta', size: 'Grande', ac: 14, hp: '3d10+6', ab: A(17, 15, 15, 3, 12, 7),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 5, d: '1d10+3', t: 'perfurante', fx: { cond: 'caido' } }],
      sprite: 'wolf', pal: ['#4b4f5a', '#2e3139', '#b9c0cc'], scale: 1.3, desc: 'Um lobo do tamanho de um cavalo, de olhos cor de lanterna.',
    },
    goblin: {
      name: 'Goblin Guerreiro', cr: 0.25, type: 'fada', size: 'Pequeno', ac: 15, hp: '3d6', ab: A(8, 15, 10, 10, 8, 8),
      traits: [['fuga_agil', 'Fuga Ágil', 'Pode Desengajar ou Esconder como Ação Bônus.']],
      attacks: [{ n: 'Cimitarra', b: 4, d: '1d6+2', t: 'cortante', advBonus: '1d4' }, { n: 'Arco Curto', b: 4, d: '1d6+2', t: 'perfurante', r: 'dist' }],
      sprite: 'goblin', pal: ['#6fae4b', '#4a3a2a', '#c9b37a'], desc: 'Pequenos, cruéis e numerosos — e muito mais espertos do que parecem.',
    },
    aranha_gigante: {
      name: 'Aranha Gigante', cr: 1, type: 'besta', size: 'Grande', ac: 14, hp: '4d10+4', ab: A(14, 16, 12, 2, 11, 4),
      traits: [['patas_aranha', 'Escalada de Aranha', 'Escala superfícies difíceis, inclusive tetos.']],
      attacks: [{ n: 'Mordida', b: 5, d: '1d8+3', t: 'perfurante', x: ['2d8', 'veneno'] }],
      special: { n: 'Teia', recharge: 5, save: 'des', dc: 13, cond: 'contido', desc: 'Lança teia: TR de Destreza CD 13 ou fica Contido.' },
      sprite: 'spider', pal: ['#3b3248', '#a96bff', '#ffd36b'], desc: 'Tece teias entre as lanternas para capturar viajantes distraídos.',
    },
    urso_marrom: {
      name: 'Urso-Pardo', cr: 1, type: 'besta', size: 'Grande', ac: 11, hp: '3d10+6', ab: A(17, 12, 15, 2, 13, 7),
      multi: 2, attacks: [{ n: 'Mordida', b: 5, d: '1d8+3', t: 'perfurante' }, { n: 'Garra', b: 5, d: '1d4+3', t: 'cortante', fx: { cond: 'caido' } }],
      sprite: 'bear', pal: ['#7a5232', '#4f341f', '#d9b48a'], desc: 'O dono da clareira não gosta de visitas.',
    },
    urso_coruja: {
      name: 'Urso-Coruja', cr: 3, type: 'monstruosidade', size: 'Grande', ac: 13, hp: '7d10+21', ab: A(20, 12, 17, 3, 12, 7),
      multi: 2, attacks: [{ n: 'Dilacerar', b: 7, d: '2d8+5', t: 'cortante' }],
      sprite: 'owlbear', pal: ['#8a6a48', '#e8d7b0', '#e3a33b'], desc: 'Metade urso, metade coruja, completamente furioso.',
    },
    driade: {
      name: 'Dríade', cr: 1, type: 'fada', size: 'Médio', ac: 16, hp: '5d8+5', ab: A(10, 12, 11, 14, 15, 18),
      traits: [['resistencia_magica', 'Resistência à Magia', 'Vantagem em testes de resistência contra magias.']],
      attacks: [{ n: 'Vinha', b: 6, d: '2d4+4', t: 'cortante' }, { n: 'Raio Espinhoso', b: 6, d: '2d6+4', t: 'perfurante', r: 'dist' }],
      special: { n: 'Encanto Feérico', recharge: 6, save: 'sab', dc: 14, cond: 'adormecido', desc: 'TR de Sabedoria CD 14 ou fica Encantado (Incapacitado).' },
      sprite: 'dryad', pal: ['#5fbf77', '#9b6b3c', '#ffd1e8'], desc: 'O espírito de um carvalho que jurou proteger a mata.',
    },

    // -------------------- Cidade --------------------
    bandido: {
      name: 'Bandido', cr: 0.125, type: 'humanoide', size: 'Médio', ac: 12, hp: '2d8+2', ab: A(11, 12, 12, 10, 10, 10),
      attacks: [{ n: 'Cimitarra', b: 3, d: '1d6+1', t: 'cortante' }, { n: 'Besta Leve', b: 3, d: '1d8+1', t: 'perfurante', r: 'dist' }],
      sprite: 'human', pal: ['#7a3b3b', '#2f2a2a', '#d9a07a'], gear: 'sword', desc: 'Assaltantes que cobram “pedágio” nas Sete Pontes.',
    },
    cultista: {
      name: 'Cultista', cr: 0.125, type: 'humanoide', size: 'Médio', ac: 12, hp: '2d8', ab: A(11, 12, 10, 10, 11, 10),
      attacks: [{ n: 'Foice Ritual', b: 3, d: '1d4+1', t: 'cortante', x: ['1', 'necrotico'] }],
      sprite: 'robed', pal: ['#5b2340', '#1c1220', '#c9a0ff'], desc: 'Devotos da Coroa das Nove Vozes, sempre sussurrando.',
    },
    brutamontes: {
      name: 'Brutamontes', cr: 0.5, type: 'humanoide', size: 'Médio', ac: 12, hp: '5d8+10', ab: A(15, 11, 14, 10, 10, 11),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Maça', b: 4, d: '1d6+2', t: 'concussao' }, { n: 'Besta Pesada', b: 2, d: '1d10', t: 'perfurante', r: 'dist' }],
      sprite: 'human', pal: ['#5a4632', '#2b2b2b', '#c98d68'], gear: 'mace', scale: 1.1, desc: 'Músculos de aluguel das casas nobres.',
    },
    espiao: {
      name: 'Espião', cr: 1, type: 'humanoide', size: 'Médio', ac: 12, hp: '6d8', ab: A(10, 15, 10, 12, 14, 16),
      traits: [['ataque_furtivo', 'Ataque Furtivo', '1×/turno: +2d6 de dano se tiver Vantagem.']],
      multi: 2, attacks: [{ n: 'Espada Curta', b: 4, d: '1d6+2', t: 'perfurante', sneak: '2d6' }],
      sprite: 'human', pal: ['#2c3e50', '#1a1a1a', '#e3b892'], gear: 'dagger', desc: 'Trabalha para a juíza da máscara vazia.',
    },
    capitao_bandido: {
      name: 'Capitão Bandido', cr: 2, type: 'humanoide', size: 'Médio', ac: 15, hp: '8d8+16', ab: A(15, 16, 14, 14, 11, 14),
      multi: 2, attacks: [{ n: 'Cimitarra', b: 5, d: '1d6+3', t: 'cortante' }, { n: 'Pistola', b: 5, d: '1d10+3', t: 'perfurante', r: 'dist' }],
      traits: [['aparar', 'Aparar', 'Reação: +2 na CA contra um ataque corpo a corpo.']],
      sprite: 'human', pal: ['#9a2d2d', '#d4af37', '#d9a07a'], gear: 'sword', hat: true, desc: 'Líder carismático que se acha herói da própria história.',
    },
    rato_gigante: {
      name: 'Rato Gigante', cr: 0.125, type: 'besta', size: 'Pequeno', ac: 13, hp: '2d6', ab: A(7, 16, 11, 2, 10, 4),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 5, d: '1d4+3', t: 'perfurante' }],
      sprite: 'rat', pal: ['#6b5b4b', '#d99a9a', '#2a2420'], desc: 'Do tamanho de um cão, com dentes do tamanho de dedos.',
    },
    hobgoblin: {
      name: 'Hobgoblin Guerreiro', cr: 0.5, type: 'fada', size: 'Médio', ac: 18, hp: '2d8+2', ab: A(13, 12, 12, 10, 10, 9),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Espada Longa', b: 3, d: '2d10+1', t: 'cortante' }, { n: 'Arco Longo', b: 3, d: '1d10+1', t: 'perfurante', r: 'dist' }],
      sprite: 'goblin', pal: ['#c8643c', '#3a3f4a', '#8c8c8c'], scale: 1.2, gear: 'sword', desc: 'Disciplinados e implacáveis, marcham em formação.',
    },

    // -------------------- Ruínas --------------------
    esqueleto: {
      name: 'Esqueleto', cr: 0.25, type: 'morto-vivo', size: 'Médio', ac: 14, hp: '2d8+4', ab: A(10, 16, 15, 6, 8, 5),
      vuln: ['concussao'], immune: ['veneno'], condImm: ['envenenado'],
      attacks: [{ n: 'Espada Curta', b: 5, d: '1d6+3', t: 'perfurante' }, { n: 'Arco Curto', b: 5, d: '1d6+3', t: 'perfurante', r: 'dist' }],
      sprite: 'skeleton', pal: ['#e8e2d0', '#8a8370', '#6bdcff'], desc: 'Ossos animados que ainda guardam as ruínas.',
    },
    zumbi: {
      name: 'Zumbi', cr: 0.25, type: 'morto-vivo', size: 'Médio', ac: 8, hp: '2d8+6', ab: A(13, 6, 16, 3, 6, 5),
      immune: ['veneno'], condImm: ['envenenado'],
      traits: [['fortitude_morto', 'Fortitude de Morto-Vivo', 'Se cair a 0 PV, faz TR de CON (CD 5 + dano); se passar, fica com 1 PV — exceto contra Radiante ou Crítico.']],
      attacks: [{ n: 'Pancada', b: 3, d: '1d8+1', t: 'concussao' }],
      sprite: 'zombie', pal: ['#7f9a6a', '#4a3f5a', '#c7c27a'], desc: 'Arrasta-se sem descanso, sempre faminto.',
    },
    carnical: {
      name: 'Carniçal', cr: 1, type: 'morto-vivo', size: 'Médio', ac: 12, hp: '5d8', ab: A(13, 15, 10, 7, 10, 6),
      immune: ['veneno'], condImm: ['envenenado'],
      multi: 2, attacks: [{ n: 'Mordida', b: 4, d: '1d6+2', t: 'perfurante', x: ['1d6', 'necrotico'] }, { n: 'Garra', b: 4, d: '1d4+2', t: 'cortante', fx: { cond: 'paralisado', save: 'con', dc: 10, noElf: true } }],
      sprite: 'ghoul', pal: ['#9aa38a', '#3b3b46', '#ff4d4d'], desc: 'Seu toque paralisa; sua fome não tem fim.',
    },
    sombra: {
      name: 'Sombra', cr: 0.5, type: 'morto-vivo', size: 'Médio', ac: 12, hp: '3d8+3', ab: A(6, 14, 13, 6, 10, 8),
      resist: ['acido', 'frio', 'fogo', 'eletrico', 'trovejante'], vuln: ['radiante'], immune: ['necrotico', 'veneno'],
      attacks: [{ n: 'Drenar Força', b: 4, d: '2d6+2', t: 'necrotico', fx: { drainStr: '1d4' } }],
      sprite: 'ghost', pal: ['#1d1b2e', '#3e3a5e', '#b9a6ff'], desc: 'Um pedaço de escuridão que rouba o vigor dos vivos.',
    },
    espectro: {
      name: 'Espectro', cr: 1, type: 'morto-vivo', size: 'Médio', ac: 12, hp: '5d8', ab: A(1, 14, 11, 10, 10, 11),
      resist: ['acido', 'frio', 'fogo', 'eletrico', 'trovejante'], immune: ['necrotico', 'veneno'],
      attacks: [{ n: 'Drenar Vida', b: 4, d: '3d6', t: 'necrotico', fx: { drainMax: true } }],
      sprite: 'ghost', pal: ['#6c7a9a', '#2f3650', '#d6f0ff'], desc: 'Uma alma presa entre o mundo e o silêncio.',
    },
    inumano: {
      name: 'Inumano', cr: 3, type: 'morto-vivo', size: 'Médio', ac: 14, hp: '6d8+18', ab: A(15, 14, 16, 10, 13, 15),
      resist: ['necrotico'], immune: ['veneno'],
      multi: 2, attacks: [{ n: 'Espada Longa', b: 4, d: '1d8+2', t: 'cortante' }, { n: 'Drenar Vida', b: 4, d: '1d6+2', t: 'necrotico', fx: { drainMax: true } }],
      sprite: 'skeleton', pal: ['#5a5a6e', '#1e1e28', '#ff5d79'], gear: 'sword', armor: true, desc: 'Um senhor da guerra que recusou a morte.',
    },
    minotauro: {
      name: 'Minotauro', cr: 3, type: 'monstruosidade', size: 'Grande', ac: 14, hp: '9d10+36', ab: A(18, 11, 16, 6, 16, 9),
      attacks: [{ n: 'Machado Grande', b: 6, d: '2d12+4', t: 'cortante' }, { n: 'Chifrada', b: 6, d: '2d8+4', t: 'perfurante', fx: { cond: 'caido', save: 'for', dc: 14 } }],
      sprite: 'minotaur', pal: ['#6b4226', '#3a2416', '#e8dcc0'], desc: 'O guardião do labirinto sob a Aurora Afogada.',
    },

    // -------------------- Costa --------------------
    caranguejo_gigante: {
      name: 'Caranguejo Gigante', cr: 0.125, type: 'besta', size: 'Médio', ac: 15, hp: '3d8', ab: A(13, 15, 11, 1, 9, 3),
      attacks: [{ n: 'Pinça', b: 3, d: '1d6+1', t: 'concussao', fx: { cond: 'agarrado' } }],
      sprite: 'crab', pal: ['#d9573b', '#f2b37a', '#2a1a1a'], desc: 'Pinças que quebram escudos.',
    },
    tubarao: {
      name: 'Tubarão de Recife', cr: 0.5, type: 'besta', size: 'Médio', ac: 12, hp: '4d8+4', ab: A(14, 15, 13, 1, 10, 4),
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 4, d: '2d8+2', t: 'perfurante' }],
      sprite: 'shark', pal: ['#5d7d99', '#dfe8ef', '#1d2a36'], desc: 'Ronda as quilhas dos navios encalhados.',
    },
    harpia: {
      name: 'Harpia', cr: 1, type: 'monstruosidade', size: 'Médio', ac: 11, hp: '7d8+7', ab: A(12, 13, 12, 7, 10, 13),
      attacks: [{ n: 'Garras', b: 3, d: '2d4+1', t: 'cortante' }],
      special: { n: 'Canção Sedutora', recharge: 5, save: 'sab', dc: 11, cond: 'adormecido', desc: 'TR de Sabedoria CD 11 ou fica Encantado (Incapacitado).' },
      sprite: 'harpy', pal: ['#8a6a9a', '#e3c6a0', '#3b2a4a'], desc: 'Seu canto atrai marinheiros para as rochas.',
    },
    merrow: {
      name: 'Merrow', cr: 2, type: 'monstruosidade', size: 'Grande', ac: 13, hp: '6d10+12', ab: A(18, 10, 15, 8, 10, 9),
      multi: 2, attacks: [{ n: 'Mordida', b: 6, d: '1d8+4', t: 'perfurante' }, { n: 'Arpão', b: 6, d: '2d6+4', t: 'perfurante' }],
      sprite: 'fishman', pal: ['#3f7a6e', '#a8d8c8', '#1d3a34'], desc: 'Um tritão corrompido pelas marés violetas.',
    },
    bruxa_mar: {
      name: 'Bruxa do Mar', cr: 2, type: 'fada', size: 'Médio', ac: 14, hp: '7d8+21', ab: A(16, 13, 16, 12, 12, 13),
      attacks: [{ n: 'Garras', b: 5, d: '2d6+3', t: 'cortante' }],
      special: { n: 'Aparência Horrenda', recharge: 6, save: 'sab', dc: 11, cond: 'amedrontado', desc: 'TR de Sabedoria CD 11 ou fica Amedrontada.' },
      sprite: 'hag', pal: ['#5f8a6a', '#2d3b2f', '#c8f0a0'], desc: 'Guarda segredos afogados em vidros de conserva.',
    },

    // -------------------- Montanhas --------------------
    ogro: {
      name: 'Ogro', cr: 2, type: 'gigante', size: 'Grande', ac: 11, hp: '8d10+24', ab: A(19, 8, 16, 5, 7, 7),
      attacks: [{ n: 'Clava Grande', b: 6, d: '2d8+4', t: 'concussao' }, { n: 'Azagaia', b: 6, d: '2d6+4', t: 'perfurante', r: 'dist' }],
      sprite: 'brute', pal: ['#b0956a', '#5a4630', '#e8d7b0'], desc: 'Grande, faminto e sem paciência para conversas.',
    },
    grifo: {
      name: 'Grifo', cr: 2, type: 'monstruosidade', size: 'Grande', ac: 12, hp: '7d10+21', ab: A(18, 15, 16, 2, 13, 8),
      multi: 2, attacks: [{ n: 'Bico/Garras', b: 6, d: '1d8+4', t: 'cortante' }],
      sprite: 'griffon', pal: ['#c9a227', '#f2ead0', '#6b4a2a'], desc: 'Guarda os ninhos de neve de prata.',
    },
    gargula: {
      name: 'Gárgula', cr: 2, type: 'elemental', size: 'Médio', ac: 15, hp: '7d8+21', ab: A(15, 11, 16, 6, 11, 7),
      resist: ['concussao', 'cortante', 'perfurante'], immune: ['veneno'],
      multi: 2, attacks: [{ n: 'Garra', b: 4, d: '1d6+2', t: 'cortante' }],
      sprite: 'gargoyle', pal: ['#7d7f86', '#4b4d55', '#ffcf5a'], desc: 'Uma estátua que espera, paciente, por intrusos.',
    },
    troll: {
      name: 'Troll', cr: 5, type: 'gigante', size: 'Grande', ac: 15, hp: '8d10+40', ab: A(18, 13, 20, 7, 9, 7),
      traits: [['regeneracao', 'Regeneração', 'Recupera 10 PV no início do turno, a menos que tenha sofrido dano de Ácido ou Fogo.']],
      multi: 3, attacks: [{ n: 'Garra', b: 7, d: '2d6+4', t: 'cortante' }],
      regen: 10, sprite: 'brute', pal: ['#5f8a5a', '#2f4a2a', '#c9d98a'], scale: 1.1, desc: 'Corte-o e ele cresce de novo. Queime-o.',
    },
    serpe: {
      name: 'Serpe', cr: 6, type: 'dragao', size: 'Grande', ac: 14, hp: '13d10+39', ab: A(19, 10, 16, 5, 12, 6),
      multi: 2, attacks: [{ n: 'Mordida', b: 7, d: '2d6+4', t: 'perfurante' }, { n: 'Ferrão', b: 7, d: '2d6+4', t: 'perfurante', x: ['7d6', 'veneno'], xSave: { ab: 'con', dc: 15 } }],
      sprite: 'wyvern', pal: ['#6b3a4a', '#c9a0a0', '#f2d06b'], scale: 1.21, desc: 'Prima menor dos dragões, com um ferrão letal.',
    },

    // -------------------- Observatório (astral) --------------------
    fogo_fatuo: {
      name: 'Fogo-Fátuo', cr: 2, type: 'morto-vivo', size: 'Miúdo', ac: 19, hp: '9d4', ab: A(1, 28, 10, 13, 14, 11),
      immune: ['eletrico', 'veneno'], resist: ['acido', 'frio', 'fogo', 'necrotico', 'trovejante'],
      attacks: [{ n: 'Choque', b: 4, d: '2d8', t: 'eletrico' }],
      sprite: 'wisp', pal: ['#8fe3ff', '#ffffff', '#3a7bd5'], desc: 'Uma luz que guia viajantes para longe da estrada.',
    },
    diabrete: {
      name: 'Diabrete', cr: 1, type: 'corruptor', size: 'Miúdo', ac: 13, hp: '3d4+3', ab: A(6, 17, 13, 11, 12, 14),
      resist: ['frio'], immune: ['fogo', 'veneno'],
      attacks: [{ n: 'Ferrão', b: 5, d: '1d4+3', t: 'perfurante', x: ['2d6', 'veneno'] }],
      sprite: 'imp', pal: ['#c0392b', '#3a1010', '#ffd36b'], desc: 'Um mensageiro infernal com língua afiada.',
    },
    elemental_ar: {
      name: 'Elemental do Ar', cr: 5, type: 'elemental', size: 'Grande', ac: 15, hp: '12d10+24', ab: A(14, 20, 14, 6, 10, 6),
      resist: ['concussao', 'cortante', 'perfurante', 'eletrico', 'trovejante'], immune: ['veneno'],
      multi: 2, attacks: [{ n: 'Pancada de Vento', b: 8, d: '2d8+5', t: 'concussao' }],
      special: { n: 'Redemoinho', recharge: 4, save: 'for', dc: 13, dmg: '3d8+2', type: 'concussao', cond: 'caido', desc: 'TR de Força CD 13 ou 3d8+2 de Concussão e Caído.' },
      sprite: 'elemental', pal: ['#bfe6ff', '#6fa8d8', '#ffffff'], desc: 'Uma tempestade com vontade própria.',
    },

    // -------------------- Mercado --------------------
    mimico: {
      name: 'Mímico', cr: 2, type: 'monstruosidade', size: 'Médio', ac: 12, hp: '9d8+18', ab: A(17, 12, 15, 5, 13, 8),
      immune: ['acido'], condImm: ['caido'],
      attacks: [{ n: 'Mordida', b: 5, d: '1d8+3', t: 'perfurante', x: ['1d8', 'acido'] }, { n: 'Pseudópode', b: 5, d: '1d8+3', t: 'concussao', fx: { cond: 'agarrado' } }],
      sprite: 'mimic', pal: ['#8a5a2a', '#d4af37', '#ff4d6d'], desc: 'Aquele baú parecia bom demais para ser verdade.',
    },
    doppelganger: {
      name: 'Doppelganger', cr: 3, type: 'monstruosidade', size: 'Médio', ac: 14, hp: '8d8+16', ab: A(11, 18, 14, 11, 12, 14),
      multi: 2, attacks: [{ n: 'Pancada', b: 6, d: '1d6+4', t: 'concussao', firstRound: '3d6' }],
      sprite: 'doppel', pal: ['#c9c9d6', '#6a6a7a', '#1a1a22'], desc: 'Pode ter o seu rosto. Pode já ter tido.',
    },
    quasit: {
      name: 'Quasit', cr: 1, type: 'corruptor', size: 'Miúdo', ac: 13, hp: '4d4', ab: A(5, 17, 10, 7, 10, 10),
      resist: ['frio', 'fogo', 'eletrico'], immune: ['veneno'],
      attacks: [{ n: 'Garras', b: 4, d: '1d4+3', t: 'cortante', x: ['2d4', 'veneno'], xSave: { ab: 'con', dc: 10 } }],
      sprite: 'imp', pal: ['#4a7a3a', '#1a2a10', '#ff5d79'], desc: 'Pequeno demônio que vende mentiras pela metade do preço.',
    },

    // -------------------- Jardins --------------------
    satiro: {
      name: 'Sátiro', cr: 0.5, type: 'fada', size: 'Médio', ac: 14, hp: '7d8', ab: A(12, 16, 11, 12, 10, 14),
      traits: [['resistencia_magica', 'Resistência à Magia', 'Vantagem em testes de resistência contra magias.']],
      attacks: [{ n: 'Chifrada', b: 3, d: '2d4+1', t: 'concussao' }, { n: 'Arco Curto', b: 5, d: '1d6+3', t: 'perfurante', r: 'dist' }],
      sprite: 'satyr', pal: ['#9b6b3c', '#e3b892', '#5fbf77'], desc: 'Festeja o fim do mundo com flauta e vinho.',
    },
    arvore_desperta: {
      name: 'Árvore Desperta', cr: 2, type: 'planta', size: 'Enorme', ac: 13, hp: '7d12+14', ab: A(19, 6, 15, 10, 10, 7),
      resist: ['concussao', 'perfurante'], vuln: ['fogo'],
      attacks: [{ n: 'Pancada', b: 6, d: '3d6+4', t: 'concussao' }],
      sprite: 'tree', pal: ['#5a3d26', '#4f9a5a', '#ff9ad5'], desc: 'O jardim inteiro se move quando ela anda.',
    },

    // -------------------- Abismo --------------------
    cao_infernal: {
      name: 'Cão Infernal', cr: 3, type: 'corruptor', size: 'Médio', ac: 15, hp: '7d8+14', ab: A(17, 12, 14, 6, 13, 6),
      immune: ['fogo'],
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 5, d: '1d8+3', t: 'perfurante', x: ['2d6', 'fogo'] }],
      special: { n: 'Sopro de Fogo', recharge: 5, save: 'des', dc: 12, dmg: '6d6', type: 'fogo', half: true, desc: 'Cone de 4,5 m: TR de Destreza CD 12, 6d6 de Fogo (metade se passar).' },
      sprite: 'wolf', pal: ['#2a1a1a', '#ff6a3c', '#ffd36b'], fire: true, desc: 'Fareja medo e exala brasas.',
    },
    pesadelo: {
      name: 'Pesadelo', cr: 3, type: 'corruptor', size: 'Grande', ac: 13, hp: '8d10+24', ab: A(18, 15, 16, 10, 13, 15),
      immune: ['fogo'],
      attacks: [{ n: 'Cascos', b: 6, d: '2d8+4', t: 'concussao', x: ['2d6', 'fogo'] }],
      sprite: 'horse', pal: ['#1a1420', '#ff6a3c', '#ffd36b'], desc: 'Um corcel de chamas que galopa entre planos.',
    },
    aparicao: {
      name: 'Aparição', cr: 5, type: 'morto-vivo', size: 'Médio', ac: 13, hp: '9d8+27', ab: A(6, 16, 16, 12, 14, 15),
      resist: ['acido', 'frio', 'fogo', 'eletrico', 'trovejante'], immune: ['necrotico', 'veneno'],
      attacks: [{ n: 'Drenar Vida', b: 6, d: '4d8+3', t: 'necrotico', fx: { drainMax: true } }],
      sprite: 'ghost', pal: ['#14121e', '#5b2340', '#ff5d79'], scale: 1.2, desc: 'Ódio puro, envolto em mortalha.',
    },


    // -------------------- Chefes regionais (covis) --------------------
    // Cada covil abriga uma criatura do Manual dos Monstros 2024 (com um nome e um título próprios de Elarion)
    // e a escolta que faz sentido para ela. Nada de fases ou fúrias inventadas: só o que o bloco de estatísticas tem.
    rei_lanterna: {
      name: 'Lobo Invernal', title: 'O Lobo-Rei das Lanternas', cr: 3, type: 'monstruosidade', size: 'Grande', ac: 13, hp: '10d10+20', ab: A(18, 13, 14, 7, 12, 8),
      boss: true, lvl: 5, bossColor: '#8fe8ff', region: 'bosque', immune: ['frio'], escort: ['lobo', 'lobo'],
      traits: [['tatica_bando', 'Táticas de Bando', 'Vantagem no ataque se um aliado estiver ao lado do alvo.']],
      attacks: [{ n: 'Mordida', b: 6, d: '2d6+4', t: 'perfurante', fx: { cond: 'caido' } }],
      special: { n: 'Sopro Gélido', recharge: 5, save: 'con', dc: 12, dmg: '4d8', type: 'frio', half: true, desc: 'Cone de 4,5 m: TR de Constituição CD 12, 4d8 de Frio (metade se passar).' },
      sprite: 'wolf', pal: ['#c8d8ee', '#7f93b5', '#eef6ff'], flame: ['#3a7bd5', '#b8f4ff'], fire: true, scale: 1.6, desc: 'Um lobo invernal que carrega nas costas o fogo frio da lanterna que roubou há cem anos. Sua matilha anda sempre junto.',
    },
    colosso_sinos: {
      name: 'Golem de Carne', title: 'O Colosso dos Sinos', cr: 5, type: 'constructo', size: 'Médio', ac: 9, hp: '11d8+44', ab: A(19, 9, 18, 6, 10, 5),
      boss: true, lvl: 7, bossColor: '#ffd36b', region: 'cidade', immune: ['eletrico', 'veneno'], condImm: ['amedrontado', 'envenenado', 'paralisado', 'adormecido'], absorb: 'eletrico', aversion: 'fogo',
      traits: [['resistencia_magica', 'Resistência à Magia', 'Vantagem em testes de resistência contra magias.'], ['absorcao_raio', 'Absorção de Relâmpago', 'Dano Elétrico cura o golem em vez de feri-lo.'], ['aversao_fogo', 'Aversão ao Fogo', 'Depois de sofrer dano de Fogo, tem Desvantagem nos ataques até o fim do próximo turno.'], ['forma_imutavel', 'Forma Imutável', 'Imune a efeitos que alterem sua forma.']],
      multi: 2, attacks: [{ n: 'Pancada', b: 7, d: '2d8+4', t: 'concussao' }],
      sprite: 'brute', pal: ['#b07a3a', '#5a3a1a', '#ffd36b'], scale: 1.15, desc: 'Costurado com os sinos das sete pontes e animado por um raio, ainda obedece a uma ordem de três séculos atrás.',
    },
    arquileitor: {
      name: 'Múmia', title: 'O Arquileitor Esquecido', cr: 3, type: 'morto-vivo', size: 'Médio', ac: 11, hp: '9d8+18', ab: A(16, 8, 15, 6, 10, 12),
      boss: true, lvl: 5, bossColor: '#c07aff', region: 'ruinas', vuln: ['fogo'], immune: ['necrotico', 'veneno'], condImm: ['amedrontado', 'envenenado', 'paralisado', 'adormecido'], escort: ['esqueleto', 'esqueleto'],
      traits: [['podridao_mumia', 'Podridão de Múmia', 'Quem é atingido pelo Punho Podre fica amaldiçoado e não recupera PV (até o fim do combate em Elarion).']],
      attacks: [{ n: 'Punho Podre', b: 5, d: '1d10+3', t: 'concussao', x: ['3d6', 'necrotico'], fx: { rot: true } }],
      special: { n: 'Olhar Aterrador', recharge: 4, save: 'sab', dc: 11, cond: 'amedrontado', desc: 'TR de Sabedoria CD 11 ou fica Amedrontado.' },
      sprite: 'skeleton', armor: true, pal: ['#d8d0b0', '#5a4a2a', '#c07aff'], scale: 1.45, desc: 'O bibliotecário-chefe foi embalsamado com a própria tinta. Dois leitores de osso guardam as estantes dele.',
    },
    rei_caranguejo: {
      name: 'Chuul', title: 'O Rei-Caranguejo da Maré Violeta', cr: 4, type: 'aberracao', size: 'Grande', ac: 16, hp: '11d10+33', ab: A(19, 10, 16, 5, 11, 5),
      boss: true, lvl: 6, bossColor: '#7fd8ff', region: 'costa', immune: ['veneno'], condImm: ['envenenado'],
      traits: [['anfibio', 'Anfíbio', 'Respira ar e água.'], ['sentir_magia', 'Sentir Magia', 'Sente magia a até 36 m.']],
      multi: 2, attacks: [{ n: 'Pinça', b: 6, d: '2d6+4', t: 'concussao', fx: { cond: 'agarrado' } }],
      special: { n: 'Tentáculos Paralisantes', recharge: 4, save: 'con', dc: 13, cond: 'paralisado', desc: 'Num alvo agarrado: TR de Constituição CD 13 ou fica Envenenado e Paralisado (repete o TR no fim de cada turno).' },
      sprite: 'crab', pal: ['#7fd8ff', '#d8f6ff', '#1a2a3a'], scale: 1.8, desc: 'Uma carapaça de pinças e tentáculos que guarda os tesouros dos navios que afundou.',
    },
    mimico_leiloeiro: {
      name: 'Mímico', title: 'O Lote que Ninguém Arrematou', cr: 2, type: 'monstruosidade', size: 'Médio', ac: 12, hp: '9d8+18', ab: A(17, 12, 15, 5, 13, 8),
      boss: true, lvl: 6, bossColor: '#ffd36b', region: 'vazios', immune: ['acido'], condImm: ['caido'], escort: ['mimico', 'mimico'],
      traits: [['adesivo', 'Adesivo', 'Gruda em quem toca (Agarrado).'], ['metamorfo', 'Metamorfo', 'Pode se disfarçar de objeto.']],
      attacks: [{ n: 'Mordida', b: 5, d: '1d8+3', t: 'perfurante', x: ['1d8', 'acido'] }, { n: 'Pseudópode', b: 5, d: '1d8+3', t: 'concussao', x: ['1d8', 'acido'], fx: { cond: 'agarrado' } }],
      sprite: 'mimic', pal: ['#c99a3a', '#ffe08a', '#ff4d6d'], scale: 1.5, desc: 'O baú dourado foi a leilão mil vezes e comeu todos os compradores. Outros dois "lotes" esperam ao lado.',
    },
    serpe_obsidiana: {
      name: 'Serpe', title: 'A Fornalha Viva da Forja Celeste', cr: 6, type: 'dragao', size: 'Grande', ac: 14, hp: '13d10+39', ab: A(19, 10, 16, 5, 12, 6),
      boss: true, lvl: 9, bossColor: '#ff7a3a', region: 'montanhas',
      traits: [['visao_escuro', 'Visão no Escuro', 'Enxerga no escuro a até 36 m.']],
      multi: 2, attacks: [{ n: 'Mordida', b: 7, d: '2d6+4', t: 'perfurante' }, { n: 'Ferrão', b: 7, d: '2d6+4', t: 'perfurante', x: ['7d6', 'veneno'], xSave: { ab: 'con', dc: 15 } }],
      sprite: 'wyvern', pal: ['#3a2a30', '#ff6a3c', '#ffd36b'], scale: 1.12, desc: 'A maior serpe das montanhas dorme dentro da fornalha mais antiga e acorda faminta.',
    },
    constelacao_viva: {
      name: 'Elemental do Ar', title: 'A Constelação Viva', cr: 5, type: 'elemental', size: 'Grande', ac: 15, hp: '12d10+24', ab: A(14, 20, 14, 6, 10, 6),
      boss: true, lvl: 8, bossColor: '#ffe9a8', region: 'astrolabio', resist: ['concussao', 'cortante', 'perfurante', 'eletrico'], immune: ['veneno', 'trovejante'], condImm: ['envenenado', 'paralisado', 'caido', 'contido', 'agarrado', 'adormecido'],
      traits: [['forma_ar', 'Forma de Ar', 'Passa por frestas de 2,5 cm.']],
      multi: 2, attacks: [{ n: 'Pancada Trovejante', b: 8, d: '2d8+5', t: 'trovejante' }],
      special: { n: 'Redemoinho', recharge: 4, save: 'for', dc: 13, dmg: '4d10+2', type: 'trovejante', half: true, cond: 'caido', desc: 'TR de Força CD 13: 4d10+2 Trovejante, arremessado e Caído (metade e de pé se passar).' },
      sprite: 'elemental', stars: true, pal: ['#2a2f6e', '#5a62b0', '#ffe9a8'], scale: 1.35, desc: 'Um turbilhão que engoliu uma estrela cadente e agora gira no alto do observatório.',
    },
    arvore_ancia: {
      name: 'Ente', title: 'A Árvore Anciã do Último Sol', cr: 9, type: 'planta', size: 'Enorme', ac: 16, hp: '12d12+60', ab: A(23, 8, 21, 12, 16, 12),
      boss: true, lvl: 10, bossColor: '#ffd36b', region: 'jardins', resist: ['concussao', 'perfurante'], vuln: ['fogo'],
      traits: [['cerco', 'Monstro de Cerco', 'Causa dano dobrado a objetos e estruturas.']],
      multi: 2, attacks: [{ n: 'Pancada', b: 10, d: '3d6+6', t: 'concussao' }, { n: 'Rocha', b: 10, d: '4d10+6', t: 'concussao', r: 'dist' }],
      summonAct: { kind: 'animate', name: 'Animar Árvores (1/dia)', key: 'arvore_desperta', n: 2 },
      sprite: 'tree', pal: ['#6a4a2a', '#e8c46a', '#ff9ad5'], scale: 1.1, desc: 'Plantada no primeiro amanhecer. Uma vez por dia, desperta duas árvores do jardim para lutar ao seu lado.',
    },

    // -------------------- Chefe final --------------------
    soberana: {
      name: 'Aparição', title: 'A Soberana das Nove Sombras', cr: 5, type: 'morto-vivo', size: 'Médio', ac: 13, hp: '9d8+27', ab: A(6, 16, 16, 12, 14, 15),
      resist: ['acido', 'frio', 'fogo', 'eletrico', 'trovejante'], immune: ['necrotico', 'veneno'], condImm: ['envenenado', 'paralisado', 'caido', 'contido', 'agarrado'],
      boss: true, bossColor: '#b77dff', region: 'abismo',
      traits: [['sensivel_sol', 'Sensibilidade à Luz do Sol', 'Desvantagem sob a luz do sol.'], ['incorporeo', 'Movimento Incorpóreo', 'Atravessa criaturas e objetos.']],
      attacks: [{ n: 'Drenar Vida', b: 6, d: '4d8+3', t: 'necrotico', fx: { drainMax: true } }],
      summonAct: { kind: 'raise', name: 'Criar Espectro', key: 'espectro', max: 7 },
      sprite: 'queen', pal: ['#41235f', '#a98cd8', '#f9baff'], scale: 1.4, desc: 'A Coroa das Nove Vozes despertou uma aparição que se chama de rainha. Quem morre perto dela volta como espectro.',
    },

    // -------------------- Dragões (SRD 5.2): filhotes de oito cores, jovens e o chefe Ignarax --------------------
    dragao_verde_filhote: {
      name: 'Filhote de Dragão Verde', cr: 2, type: 'dragao', size: 'Médio', ac: 17, hp: '7d8+7', ab: A(15, 12, 13, 14, 11, 13), immune: ['veneno'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 4, d: '1d10+2', t: 'cortante', x: ['1d6', 'veneno'] }],
      special: { n: 'Sopro Venenoso', recharge: 5, save: 'con', dc: 11, dmg: '6d6', type: 'veneno', half: true, desc: 'Nuvem tóxica: TR de Constituição CD 11, 6d6 de Veneno (metade se passar).' },
      sprite: 'dragon', dragon: 'verde', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#2b8a48', '#d6ec74', '#173a22'], desc: 'Esconde-se nas copas e fala docemente antes de morder.',
    },
    dragao_branco_filhote: {
      name: 'Filhote de Dragão Branco', cr: 2, type: 'dragao', size: 'Médio', ac: 16, hp: '5d8+10', ab: A(14, 10, 14, 5, 10, 11), immune: ['frio'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 4, d: '1d10+2', t: 'cortante', x: ['1d4', 'frio'] }],
      special: { n: 'Sopro Gélido', recharge: 5, save: 'con', dc: 12, dmg: '5d8', type: 'frio', half: true, desc: 'Cone de gelo: TR de Constituição CD 12, 5d8 de Frio (metade se passar).' },
      sprite: 'dragon', dragon: 'branco', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#e6f0f8', '#a8cce8', '#5a7a9c'], desc: 'Pequeno, faminto e mais frio que o pico onde nasceu.',
    },
    dragao_negro_filhote: {
      name: 'Filhote de Dragão Negro', cr: 2, type: 'dragao', size: 'Médio', ac: 17, hp: '6d8+6', ab: A(15, 14, 13, 10, 11, 13), immune: ['acido'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 4, d: '1d10+2', t: 'cortante', x: ['1d4', 'acido'] }],
      special: { n: 'Sopro Ácido', recharge: 5, save: 'des', dc: 11, dmg: '5d8', type: 'acido', half: true, desc: 'Linha de ácido: TR de Destreza CD 11, 5d8 de Ácido (metade se passar).' },
      sprite: 'dragon', dragon: 'negro', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#2a2a36', '#5c5a46', '#d6ceb0'], desc: 'Gosta de ruínas alagadas e de coisas que apodrecem devagar.',
    },
    dragao_bronze_filhote: {
      name: 'Filhote de Dragão de Bronze', cr: 2, type: 'dragao', size: 'Médio', ac: 17, hp: '6d8+12', ab: A(17, 10, 15, 12, 11, 15), immune: ['eletrico'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 5, d: '1d10+3', t: 'cortante' }],
      special: { n: 'Sopro Relampejante', recharge: 5, save: 'des', dc: 12, dmg: '3d10', type: 'eletrico', half: true, desc: 'Linha de raios: TR de Destreza CD 12, 3d10 Elétrico (metade se passar).' },
      sprite: 'dragon', dragon: 'bronze', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#b4722a', '#f0d48e', '#3a6a5a'], desc: 'Curioso com os navios — e com o que eles carregam.',
    },
    dragao_prata_filhote: {
      name: 'Filhote de Dragão de Prata', cr: 2, type: 'dragao', size: 'Médio', ac: 17, hp: '6d8+18', ab: A(19, 10, 17, 12, 11, 15), immune: ['frio'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 6, d: '1d10+4', t: 'cortante' }],
      special: { n: 'Sopro Gélido', recharge: 5, save: 'con', dc: 13, dmg: '4d8', type: 'frio', half: true, desc: 'Cone gelado: TR de Constituição CD 13, 4d8 de Frio (metade se passar).' },
      sprite: 'dragon', dragon: 'prata', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#c6d0dc', '#ffffff', '#6a7a9c'], desc: 'Protege os picos e testa a coragem de quem sobe.',
    },
    dragao_azul_filhote: {
      name: 'Filhote de Dragão Azul', cr: 3, type: 'dragao', size: 'Médio', ac: 17, hp: '10d8+20', ab: A(17, 10, 15, 12, 11, 15), immune: ['eletrico'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 5, d: '1d10+3', t: 'cortante', x: ['1d6', 'eletrico'] }],
      special: { n: 'Sopro de Raio', recharge: 5, save: 'des', dc: 12, dmg: '4d10', type: 'eletrico', half: true, desc: 'Linha de relâmpago: TR de Destreza CD 12, 4d10 Elétrico (metade se passar).' },
      sprite: 'dragon', dragon: 'azul', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#2c62c8', '#c8e6ff', '#eef2f8'], desc: 'Cava ninhos sob as areias do mercado e ronca trovões.',
    },
    dragao_ouro_filhote: {
      name: 'Filhote de Dragão Dourado', cr: 3, type: 'dragao', size: 'Médio', ac: 17, hp: '8d8+24', ab: A(19, 14, 17, 14, 11, 16), immune: ['fogo'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 6, d: '1d10+4', t: 'cortante' }],
      special: { n: 'Sopro de Fogo', recharge: 5, save: 'des', dc: 13, dmg: '4d10', type: 'fogo', half: true, desc: 'Cone de chamas: TR de Destreza CD 13, 4d10 de Fogo (metade se passar).' },
      sprite: 'dragon', dragon: 'ouro', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#e6b42e', '#fff0b4', '#8a5a10'], desc: 'Nobre desde o ovo. Só ataca quem acha indigno.',
    },
    dragao_vermelho_filhote: {
      name: 'Filhote de Dragão Vermelho', cr: 4, type: 'dragao', size: 'Médio', ac: 17, hp: '10d8+30', ab: A(19, 10, 17, 12, 11, 15), immune: ['fogo'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 6, d: '1d10+4', t: 'cortante', x: ['1d6', 'fogo'] }],
      special: { n: 'Sopro de Fogo', recharge: 5, save: 'des', dc: 13, dmg: '7d6', type: 'fogo', half: true, desc: 'Cone de chamas: TR de Destreza CD 13, 7d6 de Fogo (metade se passar).' },
      sprite: 'dragon', dragon: 'vermelho', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#b8262c', '#f2b46a', '#3a1812'], desc: 'Arrogante, ganancioso e já do tamanho de um cavalo.',
    },
    dragao_latao_filhote: {
      name: 'Filhote de Dragão de Latão', cr: 1, type: 'dragao', size: 'Médio', ac: 15, hp: '4d8+4', ab: A(15, 10, 13, 10, 11, 13), immune: ['fogo'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 4, d: '1d10+2', t: 'cortante' }],
      special: { n: 'Sopro do Sono', recharge: 5, save: 'con', dc: 11, cond: 'adormecido', desc: 'Gás sonífero: TR de Constituição CD 11 ou fica Inconsciente (adormecido) — ou Sopro de Fogo em linha.' },
      sprite: 'dragon', dragon: 'latao', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#c89a3a', '#f2d48a', '#6a4a1a'], desc: 'Tagarela, curioso e capaz de conversar por horas antes de decidir se te ataca.',
    },
    dragao_cobre_filhote: {
      name: 'Filhote de Dragão de Cobre', cr: 1, type: 'dragao', size: 'Médio', ac: 16, hp: '5d8+5', ab: A(15, 12, 13, 14, 11, 13), immune: ['acido'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 4, d: '1d10+2', t: 'cortante' }],
      special: { n: 'Sopro Ácido', recharge: 5, save: 'des', dc: 11, dmg: '4d8', type: 'acido', half: true, desc: 'Linha de ácido: TR de Destreza CD 11, 4d8 de Ácido (metade se passar).' },
      sprite: 'dragon', dragon: 'cobre', dragonOpts: { age: 0 }, scale: 1.17, pal: ['#b8673a', '#6ac8a0', '#4a2a1a'], desc: 'Adora piadas e enigmas — e pune quem não ri.',
    },
    dragao_branco_jovem: {
      name: 'Dragão Branco Jovem', cr: 6, type: 'dragao', size: 'Grande', ac: 17, hp: '13d10+52', ab: A(18, 10, 18, 6, 11, 12), immune: ['frio'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 7, d: '2d6+4', t: 'cortante', x: ['1d8', 'frio'] }],
      special: { n: 'Sopro Gélido', recharge: 5, save: 'con', dc: 15, dmg: '10d8', type: 'frio', half: true, desc: 'Cone de gelo: TR de Constituição CD 15, 10d8 de Frio (metade se passar).' },
      sprite: 'dragon', dragon: 'branco', scale: 1.36, pal: ['#e6f0f8', '#a8cce8', '#5a7a9c'], desc: 'Caça nas nevascas. Quando a neve para, ele já está em cima de você.',
    },
    dragao_negro_jovem: {
      name: 'Dragão Negro Jovem', cr: 7, type: 'dragao', size: 'Grande', ac: 18, hp: '15d10+45', ab: A(19, 14, 17, 12, 11, 15), immune: ['acido'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 2, attacks: [{ n: 'Dilacerar', b: 7, d: '2d6+4', t: 'cortante', x: ['1d6', 'acido'] }],
      special: { n: 'Sopro Ácido', recharge: 5, save: 'des', dc: 14, dmg: '11d8', type: 'acido', half: true, desc: 'Linha de ácido: TR de Destreza CD 14, 11d8 de Ácido (metade se passar).' },
      sprite: 'dragon', dragon: 'negro', scale: 1.36, pal: ['#2a2a36', '#5c5a46', '#d6ceb0'], desc: 'Mora no fundo do abismo, onde nem a luz das lanternas chega.',
    },
    ignarax: {
      name: 'Dragão Vermelho Jovem', title: 'Ignarax, o Rubro', cr: 10, type: 'dragao', size: 'Grande', ac: 18, hp: '17d10+85', ab: A(23, 10, 21, 14, 11, 19), saves: { des: 4, con: 9, sab: 4, car: 8 },
      boss: true, lvl: 10, group: true, bossColor: '#ff5a2a', region: 'abismo', immune: ['fogo'],
      traits: [['visao_cega', 'Percepção Dracônica', 'Sente criaturas próximas mesmo no escuro.']],
      multi: 3, attacks: [{ n: 'Dilacerar', b: 10, d: '2d6+6', t: 'cortante', x: ['1d6', 'fogo'] }],
      special: { n: 'Sopro de Fogo', recharge: 5, save: 'des', dc: 17, dmg: '16d6', type: 'fogo', half: true, desc: 'Cone de 9 m: TR de Destreza CD 17, 16d6 de Fogo (metade se passar).' },
      sprite: 'dragon', dragon: 'vermelho', dragonOpts: { age: 2 }, scale: 0.98, pal: ['#b8262c', '#f2b46a', '#3a1812'], desc: 'O último dragão vermelho de Elarion ainda é jovem — e já derrete quem toca no seu tesouro. Recomendado para grupos.',
    },
  };

  // Encontros por região
  M.BY_REGION = {
    bosque: ['lobo', 'goblin', 'aranha_gigante', 'lobo_atroz', 'urso_marrom', 'driade', 'urso_coruja', 'dragao_verde_filhote'],
    cidade: ['bandido', 'cultista', 'rato_gigante', 'brutamontes', 'hobgoblin', 'espiao', 'capitao_bandido'],
    ruinas: ['esqueleto', 'zumbi', 'sombra', 'carnical', 'espectro', 'inumano', 'minotauro', 'dragao_negro_filhote'],
    costa: ['caranguejo_gigante', 'tubarao', 'harpia', 'merrow', 'bruxa_mar', 'dragao_bronze_filhote'],
    montanhas: ['ogro', 'grifo', 'gargula', 'troll', 'serpe', 'dragao_branco_filhote', 'dragao_prata_filhote', 'dragao_vermelho_filhote', 'dragao_branco_jovem'],
    astrolabio: ['fogo_fatuo', 'diabrete', 'gargula', 'espectro', 'elemental_ar', 'dragao_prata_filhote', 'dragao_ouro_filhote'],
    vazios: ['quasit', 'diabrete', 'mimico', 'doppelganger', 'espiao', 'dragao_azul_filhote', 'dragao_latao_filhote'],
    jardins: ['satiro', 'driade', 'arvore_desperta', 'urso_coruja', 'dragao_verde_filhote', 'dragao_ouro_filhote', 'dragao_cobre_filhote'],
    abismo: ['sombra', 'inumano', 'cao_infernal', 'pesadelo', 'aparicao', 'espectro', 'dragao_negro_filhote', 'dragao_negro_jovem'],
    aurenna: ['rato_gigante', 'bandido', 'espiao'],
  };

  // chefe do covil de cada região
  M.LAIR = { bosque: 'rei_lanterna', cidade: 'colosso_sinos', ruinas: 'arquileitor', costa: 'rei_caranguejo', vazios: 'mimico_leiloeiro', montanhas: 'serpe_obsidiana', astrolabio: 'constelacao_viva', jardins: 'arvore_ancia', abismo: 'ignarax' };

  M.TYPES = { aberracao: 'Aberração', celestial: 'Celestial', constructo: 'Constructo', besta: 'Besta', humanoide: 'Humanoide', 'morto-vivo': 'Morto-Vivo', monstruosidade: 'Monstruosidade', corruptor: 'Corruptor', elemental: 'Elemental', fada: 'Fada', gigante: 'Gigante', dragao: 'Dragão', planta: 'Planta' };

  E.M = M;
})();
