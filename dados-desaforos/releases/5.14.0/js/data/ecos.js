/* Ecos — espíritos guardiões (no estilo dos Stands de JoJo) que flutuam atrás do herói, dão um bônus
   permanente e, uma vez por combate, fazem uma Investida (Ação Bônus). Vêm da Invocação de Ecos no Oráculo.
   Cópias repetidas aumentam a Sincronia (1 a 5), que fortalece o bônus e a Investida. */
(() => {
  const EC = {};
  // fx: valores por Sincronia (índice 0..4). Chaves aceitas pelo motor de regras: ac, init, initAdv, toHit,
  //     saveBonus, healBonus, startTemp, killTemp, resist, hitDmg ({ dice, type, once, when, label })
  // rush: Investida (1×/combate). kind strike = um alvo (TR para metade); aoe = todos os inimigos.
  const S = (a) => a; // legibilidade
  EC.CATALOG = {
    // ===================== ★5
    punho_estelar: { name: 'Punho Estelar', rarity: 5, title: 'Eco de Combate Corpo a Corpo', insp: 'Star Platinum (JoJo’s Bizarre Adventure)', cry: 'ORA ORA ORA ORA!', look: { body: 'muscular', c1: '#7a5ac8', c2: '#2a2a44', c3: '#ffd36b', aura: '#b89aff' },
      buff: (i) => ({ hitDmg: { dice: S(['1d6', '1d8', '1d10', '2d6', '2d8'])[i], type: 'energia', once: true, label: 'Punho Estelar' }, init: [2, 2, 3, 3, 4][i] }),
      buffText: (i) => `Uma vez por turno, +${['1d6', '1d8', '1d10', '2d6', '2d8'][i]} de Energia ao acertar; +${[2, 2, 3, 3, 4][i]} na Iniciativa.`,
      rush: { name: 'Rajada Estelar', kind: 'strike', type: 'energia', dice: ['6d6', '7d6', '8d6', '9d6', '10d6'], save: 'con', cond: 'atordoado', desc: 'Uma chuva de socos: {d} de Energia; TR de CON para metade, e quem falhar fica Atordoado.' } },
    instante_dourado: { name: 'Instante Dourado', rarity: 5, title: 'Eco do Tempo', insp: 'The World (JoJo’s Bizarre Adventure)', cry: 'TEMPO, PARE!', look: { body: 'golden', c1: '#f2c43a', c2: '#2a8a4a', c3: '#ffffff', aura: '#ffe08a' },
      buff: (i) => ({ initAdv: true, init: [2, 3, 3, 4, 5][i], ac: i >= 2 ? 1 : 0 }),
      buffText: (i) => `Vantagem na Iniciativa e +${[2, 3, 3, 4, 5][i]}${i >= 2 ? '; +1 na CA' : ''}.`,
      rush: { name: 'Tempo Parado', kind: 'strike', type: 'energia', dice: ['5d6', '6d6', '7d6', '8d6', '9d6'], save: 'des', extraAction: true, desc: 'O tempo para: {d} de Energia (TR DES para metade) e você ganha uma Ação extra neste turno.' } },
    diamante_rosa: { name: 'Diamante Rosa', rarity: 5, title: 'Eco da Restauração', insp: 'Crazy Diamond (JoJo’s Bizarre Adventure)', cry: 'DORARARARA!', look: { body: 'heart', c1: '#ff8ac8', c2: '#3ac8b8', c3: '#ffd36b', aura: '#ffb0e0' },
      buff: (i) => ({ healBonus: [2, 3, 4, 5, 6][i], startTemp: [4, 5, 6, 8, 10][i] }),
      buffText: (i) => `Curas recuperam +${[2, 3, 4, 5, 6][i]} PV; começa o combate com ${[4, 5, 6, 8, 10][i]} PV temporários.`,
      rush: { name: 'Restauração Furiosa', kind: 'strike', type: 'concussao', dice: ['5d6', '6d6', '7d6', '8d6', '9d6'], save: 'con', drain: 0.5, cleanse: true, desc: '{d} de Concussão (TR CON para metade); você recupera metade do dano e se livra de condições negativas.' } },
    vida_aurea: { name: 'Vida Áurea', rarity: 5, title: 'Eco da Vida', insp: 'Gold Experience (JoJo’s Bizarre Adventure)', cry: 'MUDA MUDA MUDA!', look: { body: 'ladybug', c1: '#f2c43a', c2: '#c8302a', c3: '#2a2a34', aura: '#fff2a8' },
      buff: (i) => ({ killTemp: [4, 5, 6, 8, 10][i], saveBonus: i >= 1 ? 1 : 0 }),
      buffText: (i) => `Ao derrotar um inimigo, ganha ${[4, 5, 6, 8, 10][i]} PV temporários${i >= 1 ? '; +1 nos testes de resistência' : ''}.`,
      rush: { name: 'Sopro de Vida', kind: 'strike', type: 'radiante', dice: ['5d6', '6d6', '7d6', '8d6', '9d6'], save: 'con', heal: ['2d8', '2d10', '3d8', '3d10', '4d10'], desc: '{d} Radiante (TR CON para metade) e você recupera {h} PV.' } },
    cavaleiro_prata: { name: 'Cavaleiro de Prata', rarity: 5, title: 'Eco da Esgrima', insp: 'Silver Chariot (JoJo’s Bizarre Adventure)', cry: 'EN GARDE!', look: { body: 'knight', c1: '#d8dee8', c2: '#3a62c8', c3: '#ffd36b', aura: '#cfe0ff' },
      buff: (i) => ({ ac: [1, 1, 1, 2, 2][i], toHit: i >= 2 ? 1 : 0 }),
      buffText: (i) => `+${[1, 1, 1, 2, 2][i]} na CA${i >= 2 ? ' e +1 nas jogadas de ataque com armas' : ''}.`,
      rush: { name: 'Mil Estocadas', kind: 'strike', type: 'perfurante', dice: ['7d6', '8d6', '9d6', '10d6', '11d6'], save: 'des', desc: 'A rapieira vira um borrão: {d} Perfurante (TR DES para metade).' } },
    rainha_explosiva: { name: 'Rainha Explosiva', rarity: 5, title: 'Eco da Detonação', insp: 'Killer Queen (JoJo’s Bizarre Adventure)', cry: 'Ela já tocou em você.', look: { body: 'cat', c1: '#ff9ad5', c2: '#3a3a44', c3: '#e8e8f0', aura: '#ff9a6a' },
      buff: (i) => ({ hitDmg: { dice: ['1d6', '1d8', '1d10', '2d6', '2d8'][i], type: 'fogo', once: true, when: { hurt: true }, label: 'Rainha Explosiva' } }),
      buffText: (i) => `Uma vez por turno, +${['1d6', '1d8', '1d10', '2d6', '2d8'][i]} de Fogo contra alvos feridos.`,
      rush: { name: 'Primeira Bomba', kind: 'aoe', type: 'fogo', dice: ['5d6', '6d6', '7d6', '8d6', '9d6'], save: 'des', desc: 'Tudo que ela tocou explode: todos os inimigos sofrem {d} de Fogo (TR DES para metade).' } },
    // ===================== ★4
    ave_brasa: { name: 'Ave de Brasa', rarity: 4, title: 'Eco do Fogo', insp: 'Magician’s Red (JoJo’s Bizarre Adventure)', cry: 'Furacão Cruzado de Fogo!', look: { body: 'bird', c1: '#ff7a3a', c2: '#c8302a', c3: '#ffd36b', aura: '#ff9a3a' },
      buff: (i) => ({ resist: ['fogo'], hitDmg: { dice: ['1d4', '1d4', '1d6', '1d6', '1d8'][i], type: 'fogo', once: true, label: 'Ave de Brasa' } }),
      buffText: (i) => `Resistência a Fogo. Uma vez por turno, +${['1d4', '1d4', '1d6', '1d6', '1d8'][i]} de Fogo ao acertar.`,
      rush: { name: 'Furacão Cruzado', kind: 'aoe', type: 'fogo', dice: ['3d6', '4d6', '4d6', '5d6', '6d6'], save: 'des', desc: 'Uma cruz de fogo: todos os inimigos sofrem {d} de Fogo (TR DES para metade).' } },
    sacerdote_esmeralda: { name: 'Sacerdote Esmeralda', rarity: 4, title: 'Eco à Distância', insp: 'Hierophant Green (JoJo’s Bizarre Adventure)', cry: 'Splash de Esmeraldas!', look: { body: 'melon', c1: '#3ac870', c2: '#1a6a3a', c3: '#9fffb0', aura: '#7fffb0' },
      buff: (i) => ({ init: [2, 2, 3, 3, 4][i], saveBonus: i >= 3 ? 1 : 0 }),
      buffText: (i) => `+${[2, 2, 3, 3, 4][i]} na Iniciativa${i >= 3 ? '; +1 nos testes de resistência' : ''}.`,
      rush: { name: 'Splash de Esmeraldas', kind: 'aoe', type: 'energia', dice: ['3d6', '4d6', '4d6', '5d6', '6d6'], save: 'des', desc: 'Uma rajada de esmeraldas: todos os inimigos sofrem {d} de Energia (TR DES para metade).' } },
    fio_livre: { name: 'Fio Livre', rarity: 4, title: 'Eco dos Fios', insp: 'Stone Free (JoJo’s Bizarre Adventure)', cry: 'ORA ORA!', look: { body: 'string', c1: '#3a9ad8', c2: '#1a3a5a', c3: '#9fe3ff', aura: '#9fe3ff' },
      buff: (i) => ({ ac: 1, startTemp: [0, 2, 3, 4, 5][i] }),
      buffText: (i) => `+1 na CA${i >= 1 ? `; começa o combate com ${[0, 2, 3, 4, 5][i]} PV temporários` : ''}.`,
      rush: { name: 'Rede de Fios', kind: 'strike', type: 'concussao', dice: ['4d6', '5d6', '5d6', '6d6', '7d6'], save: 'for', cond: 'contido', desc: '{d} de Concussão (TR FOR para metade); quem falhar fica Contido nos fios.' } },
    eco_sonoro: { name: 'Eco Sonoro', short: 'Ato 1', rarity: 4, title: 'Eco do Som', insp: 'Echoes Act 1 (JoJo’s Bizarre Adventure)', cry: 'S-H-H-H... BUM!', look: { body: 'echo', c1: '#7cc45a', c2: '#e8e8f0', c3: '#3a3a44', aura: '#c8ffb0' },
      buff: (i) => ({ saveBonus: 1, init: [0, 1, 1, 2, 2][i] }),
      buffText: (i) => `+1 nos testes de resistência${i >= 1 ? ` e +${[0, 1, 1, 2, 2][i]} na Iniciativa` : ''}.`,
      rush: { name: 'Som que Ecoa', kind: 'strike', type: 'trovejante', dice: ['4d6', '5d6', '5d6', '6d6', '7d6'], save: 'sab', cond: 'amedrontado', desc: 'Uma palavra de som gruda no alvo e não para de ecoar: {d} Trovejante (TR SAB para metade), e quem falhar fica Amedrontado.' } },
    videira_purpura: { name: 'Videira Púrpura', rarity: 4, title: 'Eco da Vidência', insp: 'Hermit Purple (JoJo’s Bizarre Adventure)', cry: 'Overdrive!', look: { body: 'vines', c1: '#9a5ac8', c2: '#5a2a7a', c3: '#ffd36b', aura: '#d0a0ff' },
      buff: (i) => ({ initAdv: true, init: [1, 1, 2, 2, 3][i] }),
      buffText: (i) => `Vantagem na Iniciativa e +${[1, 1, 2, 2, 3][i]}.`,
      rush: { name: 'Overdrive das Videiras', kind: 'strike', type: 'eletrico', dice: ['4d6', '5d6', '5d6', '6d6', '7d6'], save: 'con', cond: 'contido', desc: '{d} Elétrico (TR CON para metade); quem falhar fica Contido nas videiras.' } },
    seis_balas: { name: 'Seis Balas', rarity: 4, title: 'Eco dos Disparos', insp: 'Sex Pistols (JoJo’s Bizarre Adventure)', cry: 'Passa, passa!', look: { body: 'tiny', c1: '#f2ead0', c2: '#3a3a44', c3: '#c8302a', aura: '#fff2a8' },
      buff: (i) => ({ hitDmg: { dice: ['1d4', '1d4', '1d6', '1d6', '1d8'][i], type: 'perfurante', once: true, when: { ranged: true }, label: 'Seis Balas' }, toHit: i >= 2 ? 1 : 0 }),
      buffText: (i) => `Uma vez por turno, +${['1d4', '1d4', '1d6', '1d6', '1d8'][i]} Perfurante em ataques à distância${i >= 2 ? '; +1 nas jogadas de ataque com armas' : ''}.`,
      rush: { name: 'Ricochete dos Seis', kind: 'strike', type: 'perfurante', dice: ['6d4', '7d4', '8d4', '9d4', '10d4'], save: 'des', desc: 'Seis espíritos desviam a bala até o alvo: {d} Perfurante (TR DES para metade).' } },
    // ===================== ★3
    sombra_leal: { name: 'Sombra Leal', rarity: 3, title: 'Eco Guardião', insp: 'os espíritos-sombra dos animes de luta', cry: 'Hah!', look: { body: 'shadow', c1: '#3a3a5a', c2: '#1a1a2a', c3: '#9fe3ff', aura: '#7a8aff' },
      buff: (i) => ({ ac: i >= 4 ? 2 : 1 }), buffText: (i) => `+${i >= 4 ? 2 : 1} na CA.`,
      rush: { name: 'Golpe da Sombra', kind: 'strike', type: 'necrotico', dice: ['3d6', '3d6', '4d6', '4d6', '5d6'], save: 'con', desc: '{d} Necrótico (TR CON para metade).' } },
    vagalume: { name: 'Vaga-lume Guardião', rarity: 3, title: 'Eco da Cura', insp: 'as fadas guias dos RPGs clássicos', cry: 'Hey, escute!', look: { body: 'firefly', c1: '#fff6a8', c2: '#7cc45a', c3: '#ffffff', aura: '#fff6a8' },
      buff: (i) => ({ healBonus: [1, 1, 2, 2, 3][i] }), buffText: (i) => `Curas recuperam +${[1, 1, 2, 2, 3][i]} PV.`,
      rush: { name: 'Luz Curativa', kind: 'strike', type: 'radiante', dice: ['2d6', '2d6', '3d6', '3d6', '4d6'], save: 'con', heal: ['1d8', '1d8', '2d8', '2d8', '3d8'], desc: '{d} Radiante (TR CON para metade) e você recupera {h} PV.' } },
    golem_bolso: { name: 'Golem de Bolso', rarity: 3, title: 'Eco de Pedra', insp: 'os golens de pedra dos jogos de fantasia', cry: 'GRUUUM!', look: { body: 'golem', c1: '#9a8a7a', c2: '#5a4a3a', c3: '#7fe0ff', aura: '#c8b8a0' },
      buff: (i) => ({ startTemp: [3, 4, 5, 6, 7][i] }), buffText: (i) => `Começa o combate com ${[3, 4, 5, 6, 7][i]} PV temporários.`,
      rush: { name: 'Pancada de Pedra', kind: 'strike', type: 'concussao', dice: ['3d6', '3d6', '4d6', '4d6', '5d6'], save: 'for', cond: 'caido', desc: '{d} de Concussão (TR FOR para metade); quem falhar fica Caído.' } },
    brisa: { name: 'Espírito da Brisa', rarity: 3, title: 'Eco do Vento', insp: 'os espíritos do vento de Ghibli', cry: 'Fuuu!', look: { body: 'breeze', c1: '#bff4e8', c2: '#6bdcc8', c3: '#ffffff', aura: '#bff4e8' },
      buff: (i) => ({ init: [1, 2, 2, 3, 3][i] }), buffText: (i) => `+${[1, 2, 2, 3, 3][i]} na Iniciativa.`,
      rush: { name: 'Lufada', kind: 'aoe', type: 'trovejante', dice: ['2d6', '2d6', '3d6', '3d6', '4d6'], save: 'for', desc: 'Todos os inimigos sofrem {d} Trovejante (TR FOR para metade).' } },
    lobo_etereo: { name: 'Lobo Etéreo', rarity: 3, title: 'Eco Caçador', insp: 'os lobos espirituais das lendas', cry: 'Auuuu!', look: { body: 'wolf', c1: '#cfe0ff', c2: '#7a8ad0', c3: '#9fe3ff', aura: '#cfe0ff' },
      buff: (i) => ({ hitDmg: { dice: ['1d4', '1d4', '1d4', '1d6', '1d6'][i], type: 'energia', once: true, label: 'Lobo Etéreo' } }), buffText: (i) => `Uma vez por turno, +${['1d4', '1d4', '1d4', '1d6', '1d6'][i]} de Energia ao acertar.`,
      rush: { name: 'Mordida Fantasma', kind: 'strike', type: 'energia', dice: ['3d6', '3d6', '4d6', '4d6', '5d6'], save: 'for', cond: 'caido', desc: '{d} de Energia (TR FOR para metade); quem falhar fica Caído.' } },
    coruja_arcana: { name: 'Coruja Arcana', rarity: 3, title: 'Eco Sábio', insp: 'as corujas mensageiras das escolas de magia', cry: 'Hu-huuu!', look: { body: 'owl', c1: '#c8a070', c2: '#6a4a2e', c3: '#ffd36b', aura: '#e8d0a0' },
      buff: (i) => ({ saveBonus: i >= 4 ? 2 : 1 }), buffText: (i) => `+${i >= 4 ? 2 : 1} nos testes de resistência.`,
      rush: { name: 'Olhar Arcano', kind: 'strike', type: 'psiquico', dice: ['3d6', '3d6', '4d6', '4d6', '5d6'], save: 'sab', cond: 'amedrontado', desc: '{d} Psíquico (TR SAB para metade); quem falhar fica Amedrontado.' } },
  };
  // ===================== Evoluções
  // Só evoluem os Ecos cujo Stand evolui no anime: Echoes (Ato 1 → Ato 2 → Ato 3), Star Platinum (→ The World, depois de
  // enfrentar o senhor da noite), Gold Experience e Silver Chariot (→ Requiem, pela Flecha) e Killer Queen (→ Bites the Dust,
  // também pela Flecha). Cada forma pede Sincronia, nível do herói, muitos recursos e uma Provação: ondas de inimigos
  // seguidas, sem descanso entre elas, vencidas pelo herói com o Eco equipado (sem ajuda do grupo online).
  // req: sync, level, gold (po), frags { fragN: n } (Lanternas), cores (Núcleo de Covil), escama (Escama Iridescente),
  //      arrow (Fragmentos da Flecha — 5 fazem uma Flecha inteira)
  // fx extras: zeroReturn (Retorno a Zero) · rush.rewind (o tempo volta: recupera os PV perdidos no combate)
  EC.EVO = {
    eco_sonoro: [
      { name: 'Eco Sonoro · Ato 2', short: 'Ato 2', title: 'Eco das Onomatopeias', insp: 'Echoes Act 2 (JoJo’s Bizarre Adventure)', cry: 'BOING! CHIIIII!', look: { aura: '#b8ffa0' },
        lore: 'O Eco trocou de pele outra vez. O Ato 2 nasce quando o usuário precisa proteger alguém de uma obsessão: a cauda passa a carimbar palavras de som que fazem o que dizem.',
        buff: (i) => ({ saveBonus: 1, init: [1, 2, 2, 3, 3][i], hitDmg: { dice: ['1d4', '1d6', '1d6', '1d8', '1d8'][i], type: 'trovejante', once: true, label: 'Eco Sonoro · Ato 2' } }),
        buffText: (i) => `+1 nos testes de resistência e +${[1, 2, 2, 3, 3][i]} na Iniciativa; uma vez por turno, +${['1d4', '1d6', '1d6', '1d8', '1d8'][i]} Trovejante ao acertar.`,
        rush: { name: 'Carimbo Sonoro', kind: 'strike', type: 'fogo', dice: ['6d6', '7d6', '7d6', '8d6', '9d6'], save: 'des', cond: 'caido', desc: 'A cauda carimba “CHIIIII!” no alvo: {d} de Fogo (TR DES para metade), e o “BOING!” derruba quem falhar (Caído).' },
        req: { sync: 2, level: 5, gold: 4000, frags: { frag2: 6 }, escama: 2 },
        trial: { name: 'O Canto da Bruxa', lore: 'Uma Bruxa do Mar guarda vozes roubadas em conchas, e as Harpias cantam para atrair quem passa. O Eco só cresce se a voz dele vencer o canto delas.', waves: [['harpia', 'harpia', 'harpia', 'bruxa_mar'], ['bruxa_mar', 'merrow', 'merrow']] } },
      { name: 'Eco Sonoro · Ato 3', short: 'Ato 3', title: 'Eco do Peso', insp: 'Echoes Act 3 (JoJo’s Bizarre Adventure)', cry: 'ATO 3… FREEZE!', look: { aura: '#c8ffb0' },
        lore: 'Diante de algo que não parava de perseguir, o Eco ganhou corpo, punhos e voz própria. O Ato 3 deixa o alvo pesado como chumbo.',
        buff: (i) => ({ saveBonus: 2, init: [2, 2, 3, 3, 4][i], hitDmg: { dice: ['1d6', '1d8', '1d8', '1d10', '2d6'][i], type: 'concussao', once: true, label: 'Eco Sonoro · Ato 3' } }),
        buffText: (i) => `+2 nos testes de resistência e +${[2, 2, 3, 3, 4][i]} na Iniciativa; uma vez por turno, +${['1d6', '1d8', '1d8', '1d10', '2d6'][i]} de Concussão ao acertar.`,
        rush: { name: '3 FREEZE', kind: 'strike', type: 'concussao', dice: ['8d6', '9d6', '10d6', '11d6', '12d6'], save: 'for', cond: 'contido', desc: '“3 FREEZE!” — o alvo fica pesado como chumbo: {d} de Concussão (TR FOR para metade), e quem falhar fica Contido, grudado no chão.' },
        req: { sync: 4, level: 8, gold: 12000, frags: { frag3: 6 }, cores: 2, escama: 4 },
        trial: { name: 'A Bomba que Persegue', lore: 'Cães Infernais seguem o calor de quem foge, e um colosso costurado não para nunca. O Ato 3 desperta diante do que não para: faça-os parar.', waves: [['cao_infernal', 'cao_infernal', 'cao_infernal'], ['colosso_sinos', 'gargula', 'gargula']] } },
    ],
    punho_estelar: [
      { name: 'Punho Estelar: O Mundo', short: 'O Mundo', title: 'Eco do Tempo Parado', insp: 'Star Platinum: The World (JoJo’s Bizarre Adventure)', cry: 'PUNHO ESTELAR: O MUNDO! Tempo, pare!', look: { aura: '#ffd98a' },
        lore: 'Quem encara de frente o senhor da noite descobre que o seu Eco é do mesmo tipo que o dele: por um instante, o tempo também para para você.',
        buff: (i) => ({ hitDmg: { dice: ['2d6', '2d8', '2d8', '2d10', '3d8'][i], type: 'energia', once: true, label: 'Punho Estelar' }, init: [3, 3, 4, 4, 5][i], initAdv: true }),
        buffText: (i) => `Vantagem na Iniciativa e +${[3, 3, 4, 4, 5][i]}; uma vez por turno, +${['2d6', '2d8', '2d8', '2d10', '3d8'][i]} de Energia ao acertar.`,
        rush: { name: 'Rajada no Tempo Parado', kind: 'strike', type: 'energia', dice: ['8d6', '9d6', '10d6', '11d6', '12d6'], save: 'con', cond: 'atordoado', extraAction: true, desc: 'O tempo para e chovem socos: {d} de Energia (TR CON para metade), quem falhar fica Atordoado, e você ganha uma Ação extra.' },
        req: { sync: 2, level: 9, gold: 25000, frags: { frag4: 5 }, cores: 4, escama: 6 },
        trial: { name: 'A Mansão da Noite', lore: 'Os servos mortos-vivos guardam a mansão, e no salão espera a Soberana das Nove Sombras. Só encarando a senhora da noite o Punho aprende a parar o tempo.', waves: [['carnical', 'carnical', 'inumano', 'inumano'], ['soberana', 'aparicao', 'espectro', 'espectro']] } },
    ],
    vida_aurea: [
      { name: 'Vida Áurea Réquiem', short: 'Réquiem', title: 'Eco do Retorno a Zero', insp: 'Gold Experience Requiem (JoJo’s Bizarre Adventure)', cry: 'MUDA MUDA MUDA! Você nunca chegará à verdade.', look: { aura: '#fff3b0' },
        lore: 'A Flecha atravessou o Eco e ele virou outra coisa. Tudo o que tenta te derrubar volta a zero — e nunca chega a acontecer.',
        buff: (i) => ({ killTemp: [8, 10, 12, 14, 16][i], saveBonus: 2, zeroReturn: true }),
        buffText: (i) => `Retorno a Zero: uma vez por combate, o golpe que te derrubaria nunca acontece. Ao derrotar um inimigo, ${[8, 10, 12, 14, 16][i]} PV temporários; +2 nos testes de resistência.`,
        rush: { name: 'Retorno a Zero', kind: 'strike', type: 'radiante', dice: ['8d6', '9d6', '10d6', '11d6', '12d6'], save: 'con', cond: 'atordoado', heal: ['3d10', '4d10', '4d10', '5d10', '6d10'], desc: '{d} Radiante (TR CON para metade); quem falhar fica Atordoado, preso num instante que nunca termina, e você recupera {h} PV.' },
        req: { sync: 2, level: 10, gold: 30000, frags: { frag4: 6 }, cores: 5, escama: 8, arrow: 5 },
        trial: { name: 'O Coliseu do Chefe', lore: 'O Chefe nunca mostra o rosto: manda sósias no lugar dele. No fim do Coliseu, Ignarax, o Rei Rubro, guarda a Flecha.', waves: [['doppelganger', 'doppelganger'], ['ignarax']] } },
    ],
    cavaleiro_prata: [
      { name: 'Cavaleiro Réquiem', short: 'Réquiem', title: 'Eco das Almas', insp: 'Chariot Requiem (JoJo’s Bizarre Adventure)', cry: 'Durma… e acorde na alma de outro.', look: { aura: '#9a8ad8' },
        lore: 'Com a Flecha, o Cavaleiro perdeu a armadura e ganhou uma sombra. Quem chega perto adormece — e acorda com a alma fora do lugar.',
        buff: (i) => ({ ac: [2, 2, 2, 3, 3][i], toHit: 1, saveBonus: 1, init: [1, 1, 2, 2, 3][i] }),
        buffText: (i) => `+${[2, 2, 2, 3, 3][i]} na CA, +1 nas jogadas de ataque com armas e nos testes de resistência; +${[1, 1, 2, 2, 3][i]} na Iniciativa.`,
        rush: { name: 'Almas Trocadas', kind: 'aoe', type: 'psiquico', dice: ['6d6', '7d6', '8d6', '9d6', '10d6'], save: 'sab', cond: 'adormecido', desc: 'Uma onda de sono: todos os inimigos sofrem {d} Psíquico (TR SAB para metade), e quem falhar adormece com a alma fora do lugar.' },
        req: { sync: 2, level: 10, gold: 30000, frags: { frag4: 6 }, cores: 5, escama: 8, arrow: 5 },
        trial: { name: 'O Duelo das Almas', lore: 'No Coliseu, as almas dos duelistas derrotados ainda vagam, e uma serpe guarda a Flecha no alto da arena. Vença as duas.', waves: [['aparicao', 'espectro', 'espectro', 'espectro'], ['serpe', 'gargula', 'gargula']] } },
    ],
    rainha_explosiva: [
      { name: 'Rainha Explosiva: Mordida do Pó', short: 'Mordida do Pó', title: 'Eco do Tempo que Volta', insp: 'Killer Queen: Bites the Dust (JoJo’s Bizarre Adventure)', cry: 'Mordida do Pó.', look: { aura: '#b07aff' },
        lore: 'Encurralada, a Rainha tocou a Flecha. Agora quem descobre o seu segredo explode — e o tempo volta, como se nada tivesse acontecido.',
        buff: (i) => ({ hitDmg: { dice: ['2d6', '2d8', '2d8', '3d6', '3d8'][i], type: 'fogo', once: true, when: { hurt: true }, label: 'Rainha Explosiva' }, saveBonus: 1 }),
        buffText: (i) => `Uma vez por turno, +${['2d6', '2d8', '2d8', '3d6', '3d8'][i]} de Fogo contra alvos feridos; +1 nos testes de resistência.`,
        rush: { name: 'Terceira Bomba', kind: 'aoe', type: 'fogo', dice: ['7d6', '8d6', '9d6', '10d6', '11d6'], save: 'des', rewind: true, desc: 'A terceira bomba: todos os inimigos explodem: {d} de Fogo (TR DES para metade). Depois o tempo volta: você recupera os PV que perdeu desde o começo do combate e se livra das condições negativas.' },
        req: { sync: 2, level: 9, gold: 25000, frags: { frag4: 5 }, cores: 4, escama: 6, arrow: 5 },
        trial: { name: 'Encurralada', lore: 'Espiões descobriram quem você é, e a cidade inteira começou a caçar. Escape dos que sabem demais — e do fogo que vem atrás deles.', waves: [['espiao', 'espiao', 'espiao', 'capitao_bandido', 'capitao_bandido'], ['cao_infernal', 'cao_infernal', 'pesadelo']] } },
    ],
  };
  // forma f (0 = base) com tudo o que muda: nome, bônus, Investida, grito, aura e a chave da arte
  const formCache = {};
  EC.form = (id, f = 0) => {
    const base = EC.CATALOG[id], ev = f > 0 && EC.EVO[id] && EC.EVO[id][f - 1];
    if (!base) return null;
    if (!ev) return base;
    const k = id + '~' + f;
    return formCache[k] || (formCache[k] = Object.assign({}, base, ev, { base: id, form: f, look: Object.assign({}, base.look, ev.look), art: k, baseName: base.name }));
  };
  EC.artKey = (id, f = 0) => (f > 0 && EC.EVO[id] && EC.EVO[id][f - 1] ? id + '~' + f : id);
  EC.MAX_SYNC = 5;
  EC.ROTATE_MS = 90 * 60 * 1000;
  EC.byRarity = (r) => Object.keys(EC.CATALOG).filter((id) => EC.CATALOG[id].rarity === r);
  // destaque do estandarte de Ecos: muda junto com o de armas (a cada 1h30)
  EC.featured = () => { const five = EC.byRarity(5), four = EC.byRarity(4); const k = E.W.windowIndex ? E.W.windowIndex() : 0; return { five: five[((k % five.length) + five.length) % five.length], four: [four[((k % four.length) + four.length) % four.length], four[(((k + 3) % four.length) + four.length) % four.length]] }; };
  EC.rushText = (id, sync = 1, f = 0) => { const e = EC.form(id, f), r = e.rush, i = Math.max(0, Math.min(4, sync - 1)); return r.desc.replace('{d}', r.dice[i]).replace('{h}', r.heal ? r.heal[i] : ''); };
  EC.buffText = (id, sync = 1, f = 0) => EC.form(id, f).buffText(Math.max(0, Math.min(4, sync - 1)));
  E.ECO = EC;
})();
