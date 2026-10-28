/* Espécies, Antecedentes, Talentos e Classes — D&D 2024 (Livro do Jogador / SRD 5.2). Textos resumidos com palavras próprias. */
(() => {
  const H = {};

  // ---------- Espécies ----------
  H.SPECIES = {
    humano: {
      name: 'Humano', size: 'Médio', speed: 9, dark: 0,
      blurb: 'Versáteis e ambiciosos, os humanos se espalharam por todas as nove regiões de Elarion.',
      traits: [
        ['Engenhoso', 'Recebe Inspiração Heroica a cada Descanso Longo.'],
        ['Habilidoso', 'Proficiência em uma perícia à sua escolha.'],
        ['Versátil', 'Recebe um Talento de Origem extra à sua escolha.'],
      ],
      hooks: { heroicOnLongRest: true, extraSkill: 1, extraFeat: true },
      look: { skin: ['#f1c9a5', '#d9a07a', '#a8694a', '#6e432c'], ears: 'round' },
    },
    elfo: {
      name: 'Elfo', size: 'Médio', speed: 9, dark: 18,
      blurb: 'Filhos da magia feérica, os elfos guardam memórias de séculos sob as copas do Bosque das Lanternas.',
      traits: [
        ['Visão no Escuro', '18 metros.'],
        ['Ancestralidade Feérica', 'Vantagem em testes de resistência para evitar ou encerrar a condição Enfeitiçado.'],
        ['Sentidos Aguçados', 'Proficiência em Intuição, Percepção ou Sobrevivência.'],
        ['Transe', 'Completa um Descanso Longo em 4 horas de meditação.'],
        ['Linhagem Élfica', 'Alta: truque Prestidigitação extra · Silvestre: deslocamento 10,5 m · Drow: Visão no Escuro 36 m.'],
      ],
      hooks: { skillChoice: ['intuicao', 'percepcao', 'sobrevivencia'] },
      look: { skin: ['#f6dcc4', '#e3b892', '#b98a6a', '#7c6a8f'], ears: 'long' },
    },
    anao: {
      name: 'Anão', size: 'Médio', speed: 9, dark: 36,
      blurb: 'Forjados como o metal das Montanhas da Forja Celeste, os anões são resistentes e teimosos.',
      traits: [
        ['Visão no Escuro', '36 metros.'],
        ['Resiliência Anã', 'Resistência a dano de Veneno e Vantagem contra a condição Envenenado.'],
        ['Robustez Anã', '+1 Ponto de Vida máximo por nível.'],
        ['Sentido de Pedra', 'Ação Bônus: Sentido Sísmico de 18 m (PB vezes por Descanso Longo).'],
      ],
      hooks: { hpPerLevel: 1, resist: ['veneno'], advVsPoison: true },
      look: { skin: ['#efc19d', '#c98d68', '#8e5a3e'], ears: 'round', beard: true, scale: 0.88 },
    },
    pequenino: {
      name: 'Pequenino', size: 'Pequeno', speed: 9, dark: 0,
      blurb: 'Pequeninos são corajosos e sortudos, sempre achando um jeito de escapar de encrenca.',
      traits: [
        ['Bravura', 'Vantagem em testes de resistência contra a condição Amedrontado.'],
        ['Agilidade Pequenina', 'Pode atravessar o espaço de criaturas maiores.'],
        ['Sorte', 'Quando tirar 1 no d20 de um Teste de d20, role de novo e use o novo resultado.'],
        ['Furtividade Natural', 'Pode se esconder atrás de criaturas maiores.'],
      ],
      hooks: { luck: true, advVsFear: true },
      look: { skin: ['#f3cba8', '#d79e78', '#9b6648'], ears: 'small', scale: 0.74 },
    },
    draconato: {
      name: 'Draconato', size: 'Médio', speed: 9, dark: 18,
      blurb: 'Descendentes de dragões, os draconatos carregam o sopro dos ancestrais nos pulmões.',
      traits: [
        ['Ancestralidade Dracônica', 'Escolhe um dragão ancestral que define o tipo de dano do sopro e da resistência.'],
        ['Arma de Sopro', 'Substitui um ataque: cone de 4,5 m, TR de Destreza (CD 8 + CON + BP), 1d10 de dano (2d10 no nível 5). Usos = BP por Descanso Longo.'],
        ['Resistência a Dano', 'Resistência ao tipo de dano da sua ancestralidade.'],
        ['Visão no Escuro', '18 metros.'],
      ],
      hooks: { breath: true },
      look: { skin: ['#c84b3a', '#3a7bd5', '#2f9e5a', '#c9a227', '#d8dde3', '#4a4a5a', '#b87333'], ears: 'none', snout: true, scale: 1.08 },
      ancestries: { fogo: 'Vermelho (Fogo)', frio: 'Branco (Frio)', eletrico: 'Azul (Elétrico)', acido: 'Preto (Ácido)', veneno: 'Verde (Veneno)' },
    },
    gnomo: {
      name: 'Gnomo', size: 'Pequeno', speed: 9, dark: 18,
      blurb: 'Inventores e ilusionistas, os gnomos enxergam magia em cada engrenagem.',
      traits: [
        ['Visão no Escuro', '18 metros.'],
        ['Astúcia Gnômica', 'Vantagem em testes de resistência de Inteligência, Sabedoria e Carisma.'],
        ['Linhagem Gnômica', 'Da Floresta (Ilusão Menor) ou das Rochas (Prestidigitação e Reparar).'],
      ],
      hooks: { advMentalSaves: true },
      look: { skin: ['#f6d3b5', '#dfa883', '#a66e50'], ears: 'small', scale: 0.72 },
    },
    golias: {
      name: 'Golias', size: 'Médio', speed: 10.5, dark: 0,
      blurb: 'Com sangue de gigantes, os golias medem a vida pelos picos que conquistam.',
      traits: [
        ['Ancestralidade Gigante', 'Dádiva de gigante usada BP vezes por Descanso Longo (Fogo: +1d10 de fogo ao acertar).'],
        ['Forma Grande', 'A partir do nível 5, pode se tornar Grande por 10 minutos (1×/Descanso Longo).'],
        ['Constituição Poderosa', 'Vantagem para encerrar Agarrado e conta como um tamanho maior para carga.'],
      ],
      hooks: { giantFire: true },
      look: { skin: ['#b7b9c4', '#9aa0ad', '#8b8a96'], ears: 'round', marks: true, scale: 1.25 },
    },
    orc: {
      name: 'Orc', size: 'Médio', speed: 9, dark: 36,
      blurb: 'Abençoados pela resistência de Gruumsh, os orcs não caem facilmente.',
      traits: [
        ['Surto de Adrenalina', 'Ação Bônus: Disparada e ganha PV temporários iguais ao BP (BP vezes por Descanso Curto ou Longo).'],
        ['Visão no Escuro', '36 metros.'],
        ['Resistência Implacável', 'Quando cair a 0 PV sem morrer, fica com 1 PV (1×/Descanso Longo).'],
      ],
      hooks: { relentless: true, adrenaline: true },
      look: { skin: ['#7f9f6a', '#6c8c5a', '#8a9a7d'], ears: 'pointy', tusks: true, scale: 1.1 },
    },
    tiferino: {
      name: 'Tiferino', size: 'Médio', speed: 9, dark: 18,
      blurb: 'Marcados por um legado infernal, os tiferinos lutam contra o preconceito com astúcia.',
      traits: [
        ['Visão no Escuro', '18 metros.'],
        ['Legado Ínfero', 'Infernal: Resistência a Fogo e o truque Raio de Fogo.'],
        ['Presença Sobrenatural', 'Conhece o truque Taumaturgia.'],
      ],
      hooks: { resist: ['fogo'], cantrip: 'raio_fogo' },
      look: { skin: ['#c4586a', '#9a4a8a', '#d98a70', '#6d4c8f'], ears: 'pointy', horns: true, tail: true },
    },
    aasimar: {
      name: 'Aasimar', size: 'Médio', speed: 9, dark: 18,
      blurb: 'Tocados pelos planos superiores, os aasimar carregam uma centelha de luz celestial.',
      traits: [
        ['Resistência Celestial', 'Resistência a dano Necrótico e Radiante.'],
        ['Mãos Curativas', 'Ação de Magia: cura BP d4 PV (1×/Descanso Longo).'],
        ['Portador da Luz', 'Conhece o truque Luz.'],
        ['Revelação Celestial', 'Nível 3+: ao se transformar, +BP de dano radiante uma vez por turno.'],
      ],
      hooks: { resist: ['necrotico', 'radiante'], healingHands: true },
      look: { skin: ['#f6e1cf', '#e2b896', '#b9845f', '#8a5a3c'], ears: 'round', halo: true },
    },
  };

  // ---------- Talentos de Origem ----------
  H.FEATS = {
    alerta: { name: 'Alerta', desc: 'Some o Bônus de Proficiência à Iniciativa e pode trocar a Iniciativa com um aliado.' },
    iniciado_magia: { name: 'Iniciado em Magia', desc: 'Aprende dois truques e uma magia de 1º círculo de uma lista (Clérigo, Druida ou Mago).' },
    atacante_selvagem: { name: 'Atacante Selvagem', desc: 'Uma vez por turno, role os dados de dano da arma duas vezes e use o maior.' },
    habilidoso: { name: 'Habilidoso', desc: 'Proficiência em três perícias ou ferramentas.' },
    vigoroso: { name: 'Vigoroso', desc: 'Seus Pontos de Vida máximos aumentam em 2 por nível.' },
    curandeiro: { name: 'Curandeiro', desc: 'Usar um kit de curandeiro cura 1d6 + 4 PV + dados de vida; rerrola 1 nos dados de cura.' },
    sortudo: { name: 'Sortudo', desc: 'Pontos de Sorte iguais ao BP por Descanso Longo: gaste 1 para ter Vantagem num Teste de d20.' },
    musico: { name: 'Músico', desc: 'Ao terminar um descanso, concede Inspiração Heroica a aliados.' },
    brigao: { name: 'Brigão de Taverna', desc: 'Ataque desarmado causa 1d4 + FOR; rerrola 1 no dano; pode empurrar ao acertar.' },
    artesao: { name: 'Artesão', desc: 'Proficiência em ferramentas e 20% de desconto em itens não mágicos.' },
  };
  // Talentos Gerais do Livro do Jogador 2024 (nível 4+, no lugar do Aumento de Valor de Atributo). Cada um dá +1 num atributo da lista.
  const HASTE = ['glaive', 'alabarda', 'pique', 'bordao', 'lanca'];
  Object.assign(H.FEATS, {
    mestre_armas_grandes: { general: true, name: 'Mestre de Armas Grandes', abil: ['for'], desc: '+1 FOR. Ao acertar com uma arma Pesada, causa dano extra igual ao seu Bônus de Proficiência (1×/turno).', fx: { heavyPb: true } },
    atirador_elite: { general: true, name: 'Atirador de Elite', abil: ['des'], desc: '+1 DES. Seus disparos ignoram cobertura (+2 nas jogadas de ataque à distância) e alvos Caídos não impõem Desvantagem.', fx: { rangedHit: 2, sharpshooter: true } },
    mestre_haste: { general: true, name: 'Mestre em Armas de Haste', abil: ['for', 'des'], desc: '+1 FOR ou DES. Com Glaive, Alabarda, Pique, Bordão ou Lança, Ação Bônus: golpe com o cabo (1d4 Concussão).',
      powers: [{ id: 'golpe_cabo', lvl: 1, name: 'Golpe com o Cabo', icon: '🔱', desc: '1d4 Concussão + atributo', cost: 'b', req: (h) => { const w = E.C.equipped(h, 'weapon'); return !!w && HASTE.includes(w.def.base); }, reqTxt: 'Requer arma de haste', effect: { weaponAttack: { dice: '1d4', type: 'concussao', name: 'Golpe com o Cabo' } } }] },
    mestre_escudos: { general: true, name: 'Mestre de Escudos', abil: ['for'], desc: '+1 FOR. Com escudo: Golpe de Escudo ao acertar (1×/turno, TR de Força ou Caído); ao passar num TR de Destreza contra uma habilidade especial, não sofre dano.', fx: { shieldMaster: true } },
    resiliente: { general: true, name: 'Resiliente', abil: 'any', choose: 'save', desc: '+1 num atributo à escolha e proficiência nos testes de resistência dele.', fx: (h) => ({ saveProf: [(h.featData || {}).resiliente].filter(Boolean) }) },
    mestre_armadura_pesada: { general: true, name: 'Mestre em Armadura Pesada', abil: ['for', 'con'], desc: '+1 FOR ou CON. Usando armadura pesada, reduz o dano Contundente, Cortante e Perfurante de cada golpe em um valor igual ao seu Bônus de Proficiência.', fx: { heavyArmorRed: true } },
    conjurador_guerra: { general: true, name: 'Conjurador de Guerra', abil: ['int', 'sab', 'car'], desc: '+1 INT, SAB ou CAR. Vantagem nos testes de Constituição para manter a Concentração.', fx: { concAdv: true } },
    duelista_defensivo: { general: true, name: 'Duelista Defensivo', abil: ['des'], desc: '+1 DES. Empunhando arma de Acuidade, Reação: some seu Bônus de Proficiência à CA contra um ataque que te acertaria.', fx: { defDuelist: true } },
    duravel: { general: true, name: 'Durável', abil: ['con'], desc: '+1 CON. Vantagem nos testes contra a morte.', fx: { deathAdv: true } },
    matador_magos: { general: true, name: 'Matador de Magos', abil: ['for', 'des'], desc: '+1 FOR ou DES. Mente Protegida: uma vez por combate, uma falha em TR de INT, SAB ou CAR vira sucesso.', fx: { guardedMind: true } },
    lider_inspirador: { general: true, name: 'Líder Inspirador', abil: ['sab', 'car'], desc: '+1 SAB ou CAR. Começa cada combate com PV temporários = nível + SAB ou CAR.', fx: { startTemp: (h) => h.level + Math.max(E.C.mod(h, 'sab'), E.C.mod(h, 'car')) } },
    adepto_elemental: { general: true, name: 'Adepto Elemental', abil: ['int', 'sab', 'car'], choose: 'element', desc: '+1 INT, SAB ou CAR. Escolha Ácido, Elétrico, Fogo, Frio ou Trovejante: suas magias ignoram Resistência a esse tipo.', fx: (h) => ({ elemAdept: (h.featData || {}).adepto_elemental }) },
    perfurador: { general: true, name: 'Perfurador', abil: ['for', 'des'], desc: '+1 FOR ou DES. Em acertos críticos com dano Perfurante, role um dado de dano extra.', fx: { piercer: true } },
    esmagador: { general: true, name: 'Esmagador', abil: ['for', 'con'], desc: '+1 FOR ou CON. Uma vez por turno, acertar com dano Contundente empurra o alvo; num crítico, ataques contra ele têm Vantagem.', fx: { crusher: true } },
    retalhador: { general: true, name: 'Retalhador', abil: ['for', 'des'], desc: '+1 FOR ou DES. Uma vez por turno, acertar com dano Cortante deixa o alvo Lento; num crítico, ele tem Desvantagem no próximo ataque.', fx: { slasher: true } },
  });
  // talentos de origem que também podem ser escolhidos no lugar do Aumento de Atributo (não repetíveis)
  H.FEATS_AT_ASI = ['alerta', 'atacante_selvagem', 'vigoroso', 'sortudo', 'brigao', 'curandeiro', 'musico', 'habilidoso', 'artesao'];

  // ---------- Antecedentes (atributos, talento, perícias) ----------
  H.BACKGROUNDS = {
    acolito: { name: 'Acólito', abilities: ['int', 'sab', 'car'], feat: 'iniciado_magia', featList: 'clerigo', skills: ['intuicao', 'religiao'], blurb: 'Serviu num templo de Lunária e ouviu os sinos dos deuses.' },
    artesao: { name: 'Artesão', abilities: ['for', 'des', 'int'], feat: 'artesao', skills: ['investigacao', 'persuasao'], blurb: 'Aprendeu um ofício nas oficinas das Sete Pontes.' },
    charlatao: { name: 'Charlatão', abilities: ['des', 'con', 'car'], feat: 'habilidoso', skills: ['enganacao', 'prestidigitacao'], blurb: 'Vendeu promessas no Mercado das Mãos Vazias.' },
    criminoso: { name: 'Criminoso', abilities: ['des', 'con', 'int'], feat: 'alerta', skills: ['prestidigitacao', 'furtividade'], blurb: 'Conhece cada beco escuro de Lunária.' },
    artista: { name: 'Artista', abilities: ['for', 'des', 'car'], feat: 'musico', skills: ['acrobacia', 'atuacao'], blurb: 'Encantou plateias de praça em praça.' },
    fazendeiro: { name: 'Fazendeiro', abilities: ['for', 'con', 'sab'], feat: 'vigoroso', skills: ['adestrar', 'natureza'], blurb: 'Cresceu entre plantações à beira do Bosque das Lanternas.' },
    guarda: { name: 'Guarda', abilities: ['for', 'int', 'sab'], feat: 'alerta', skills: ['atletismo', 'percepcao'], blurb: 'Vigiou as muralhas e os portões da cidade.' },
    guia: { name: 'Guia', abilities: ['des', 'con', 'sab'], feat: 'iniciado_magia', featList: 'druida', skills: ['furtividade', 'sobrevivencia'], blurb: 'Conduziu viajantes por trilhas que só você conhece.' },
    eremita: { name: 'Eremita', abilities: ['con', 'sab', 'car'], feat: 'curandeiro', skills: ['medicina', 'religiao'], blurb: 'Viveu isolado buscando respostas no silêncio.' },
    mercador: { name: 'Mercador', abilities: ['con', 'int', 'car'], feat: 'sortudo', skills: ['adestrar', 'persuasao'], blurb: 'Negociou mercadorias entre a Costa e a Cidade.' },
    nobre: { name: 'Nobre', abilities: ['for', 'int', 'car'], feat: 'habilidoso', skills: ['historia', 'persuasao'], blurb: 'Herdeiro de uma das três casas de Lunária.' },
    sabio: { name: 'Sábio', abilities: ['con', 'int', 'sab'], feat: 'iniciado_magia', featList: 'mago', skills: ['arcanismo', 'historia'], blurb: 'Estudou no Observatório dos Nomes.' },
    marinheiro: { name: 'Marinheiro', abilities: ['for', 'des', 'sab'], feat: 'brigao', skills: ['acrobacia', 'percepcao'], blurb: 'Navegou sobre as Baleias de Vidro.' },
    escriba: { name: 'Escriba', abilities: ['des', 'int', 'sab'], feat: 'habilidoso', skills: ['investigacao', 'percepcao'], blurb: 'Copiou tomos proibidos nas Ruínas da Aurora.' },
    soldado: { name: 'Soldado', abilities: ['for', 'des', 'con'], feat: 'atacante_selvagem', skills: ['atletismo', 'intimidacao'], blurb: 'Lutou nas guerras não declaradas das três casas.' },
    andarilho: { name: 'Andarilho', abilities: ['des', 'sab', 'car'], feat: 'sortudo', skills: ['intuicao', 'furtividade'], blurb: 'Sobreviveu nas ruas com sorte e esperteza.' },
  };

  // ---------- Estilos de Luta ----------
  H.FIGHTING_STYLES = {
    defesa: { name: 'Defesa', desc: '+1 na CA enquanto usar armadura.' },
    duelismo: { name: 'Duelismo', desc: '+2 de dano com arma corpo a corpo em uma mão e nenhuma outra arma.' },
    grande: { name: 'Combate com Armas Grandes', desc: 'Trate 1 e 2 nos dados de dano de armas de Duas Mãos/Versáteis como 3.' },
    arquearia: { name: 'Arquearia', desc: '+2 nas jogadas de ataque com armas à distância.' },
    duas_armas: { name: 'Combate com Duas Armas', desc: 'Some o modificador de atributo ao dano do ataque extra com arma Leve.', fx: { twf: true } },
    cegas: { name: 'Combate às Cegas', desc: 'Percepção às cegas: estar Cego não te atrapalha nos ataques nem dá Vantagem aos inimigos.', fx: { blindFight: true } },
    arremesso: { name: 'Combate com Arremesso', desc: '+2 de dano com armas de Arremesso.', fx: { thrownDmg: 2 } },
    desarmado: { name: 'Combate Desarmado', desc: 'Golpes desarmados causam 1d6 + FOR (1d8 sem escudo).', fx: { unarmedFight: true } },
    protecao: { name: 'Proteção', desc: 'Com escudo, Reação: impõe Desvantagem num ataque contra um aliado do grupo (modo online).', fx: { protection: true } },
    interceptacao: { name: 'Interceptação', desc: 'Reação: reduz em 1d10 + BP o dano de um golpe num aliado do grupo (modo online).', fx: { interception: true } },
  };

  // Tabelas de espaços de magia
  const FULL = [[], [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2]];
  const HALF = [[], [2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2]];
  H.slotsFor = (casterType, level) => {
    if (casterType === 'full') return FULL[level].slice();
    if (casterType === 'half') return HALF[level].slice();
    if (casterType === 'third') return [[], [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3]][level].slice(); // Cavaleiro Arcano / Trapaceiro Arcano
    if (casterType === 'pact') {
      const n = level === 1 ? 1 : 2;
      const lv = Math.min(5, Math.ceil(level / 2));
      const arr = [0, 0, 0, 0, 0];
      arr[lv - 1] = n;
      return arr;
    }
    return [];
  };

  // ---------- Classes ----------
  // features: [nível, id, nome, descrição]
  H.CLASSES = {
    barbaro: {
      name: 'Bárbaro', hd: 12, primary: ['for'], saves: ['for', 'con'], armor: ['leve', 'media', 'escudo'], weapons: 'marcial',
      skills: { n: 2, from: ['adestrar', 'atletismo', 'intimidacao', 'natureza', 'percepcao', 'sobrevivencia'] },
      caster: null, color: '#d9534f', icon: '🪓', masteryCount: 2,
      equip: { weapon: 'machado_grande', armor: 'nenhuma', shield: false, gold: 15, potions: 1 },
      unarmored: 'con',
      blurb: 'Um guerreiro feroz movido pela Fúria primal.',
      role: 'Linha de frente · dano alto · muitos PV',
      features: [
        [1, 'furia', 'Fúria', 'Ação Bônus: +2 de dano com ataques de Força, Resistência a dano Cortante, Perfurante e de Concussão e Vantagem em testes de Força. (+3 de dano no nível 9.)'],
        [1, 'defesa_sem_armadura', 'Defesa sem Armadura', 'Sem armadura, sua CA é 10 + DES + CON.'],
        [1, 'maestria', 'Maestria em Armas', 'Usa a propriedade de Maestria de 2 tipos de arma.'],
        [2, 'ataque_descuidado', 'Ataque Descuidado', 'Vantagem nos ataques de Força neste turno, mas ataques contra você têm Vantagem até seu próximo turno.'],
        [2, 'sentido_perigo', 'Sentido de Perigo', 'Vantagem em testes de resistência de Destreza.'],
        [5, 'ataque_extra', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar.'],
        [7, 'instinto_feral', 'Instinto Feral', 'Vantagem nas jogadas de Iniciativa.'],
        [9, 'golpe_brutal', 'Golpe Brutal', 'Ao usar Ataque Descuidado, abre mão da Vantagem em um ataque para causar +1d10 e um efeito.'],
      ],
    },
    bardo: {
      name: 'Bardo', hd: 8, primary: ['car'], saves: ['des', 'car'], armor: ['leve'], weapons: 'simples',
      skills: { n: 3, from: Object.keys({ acrobacia: 1, adestrar: 1, arcanismo: 1, atletismo: 1, atuacao: 1, enganacao: 1, furtividade: 1, historia: 1, intimidacao: 1, intuicao: 1, investigacao: 1, medicina: 1, natureza: 1, percepcao: 1, persuasao: 1, prestidigitacao: 1, religiao: 1, sobrevivencia: 1 }) },
      caster: { type: 'full', ab: 'car' }, color: '#c77dff', icon: '🎻', masteryCount: 0,
      equip: { weapon: 'adaga', armor: 'couro', shield: false, gold: 19, potions: 1, focus: 'instrumento' },
      blurb: 'Um artista cuja música molda a realidade.',
      role: 'Suporte · magias versáteis · Inspiração',
      cantrips: 2, spellList: 'bardo',
      features: [
        [1, 'inspiracao_bardica', 'Inspiração Bárdica', 'Ação Bônus: concede um dado de Inspiração (d6; d8 no nível 5; d10 no 10) para somar a um Teste de d20. Usos = CAR por Descanso Longo.'],
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Bardo usando Carisma.'],
        [2, 'pau_pra_toda_obra', 'Pau para Toda Obra', 'Soma metade do BP em testes de perícia sem proficiência.'],
        [5, 'fonte_inspiracao', 'Fonte de Inspiração', 'Recupera Inspiração Bárdica em Descanso Curto.'],
      ],
    },
    bruxo: {
      name: 'Bruxo', hd: 8, primary: ['car'], saves: ['sab', 'car'], armor: ['leve'], weapons: 'simples',
      skills: { n: 2, from: ['arcanismo', 'enganacao', 'historia', 'intimidacao', 'investigacao', 'natureza', 'religiao'] },
      caster: { type: 'pact', ab: 'car' }, color: '#7b5cff', icon: '👁', masteryCount: 0,
      equip: { weapon: 'foice_curta', armor: 'couro', shield: false, gold: 15, potions: 1, focus: 'orbe' },
      blurb: 'Um conjurador que firmou um pacto com um ser poderoso.',
      role: 'Dano à distância consistente · Magia de Pacto',
      cantrips: 2, spellList: 'bruxo',
      features: [
        [1, 'invocacoes', 'Invocações Místicas', 'Fragmentos de saber proibido. No nível 2 você recebe Rajada Agonizante (+CAR no dano de Rajada Mística).'],
        [1, 'magia_pacto', 'Magia de Pacto', 'Espaços de magia que sempre são do círculo mais alto e voltam em Descanso Curto.'],
        [2, 'astucia_magica', 'Astúcia Mágica', 'Recupera metade dos espaços de Pacto com 1 minuto de rito (1×/Descanso Longo).'],
      ],
    },
    clerigo: {
      name: 'Clérigo', hd: 8, primary: ['sab'], saves: ['sab', 'car'], armor: ['leve', 'media', 'escudo'], weapons: 'simples',
      skills: { n: 2, from: ['historia', 'intuicao', 'medicina', 'persuasao', 'religiao'] },
      caster: { type: 'full', ab: 'sab' }, color: '#f0c75e', icon: '✚', masteryCount: 0,
      equip: { weapon: 'maca', armor: 'camisao', shield: true, gold: 7, potions: 1, focus: 'simbolo' },
      blurb: 'Um sacerdote que canaliza o poder divino.',
      role: 'Cura · proteção · dano radiante',
      cantrips: 3, spellList: 'clerigo',
      features: [
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Clérigo usando Sabedoria.'],
        [1, 'ordem_divina', 'Ordem Divina · Protetor', 'Treinamento com armas marciais e armadura pesada.'],
        [2, 'canalizar', 'Canalizar Divindade · Centelha Divina', 'Ação de Magia: cura 1d8 + SAB a um aliado ou causa 1d8 + SAB de dano radiante/necrótico (TR CON para metade). 2 usos/Descanso Longo.'],
        [7, 'golpes_abencoados', 'Golpes Abençoados', 'Uma vez por turno, +1d8 de dano radiante em um ataque com arma ou truque.'],
      ],
    },
    druida: {
      name: 'Druida', hd: 8, primary: ['sab'], saves: ['int', 'sab'], armor: ['leve', 'escudo'], weapons: 'simples',
      skills: { n: 2, from: ['arcanismo', 'adestrar', 'intuicao', 'medicina', 'natureza', 'percepcao', 'religiao', 'sobrevivencia'] },
      caster: { type: 'full', ab: 'sab' }, color: '#5fbf77', icon: '🌿', masteryCount: 0,
      equip: { weapon: 'foice_curta', armor: 'couro', shield: true, gold: 9, potions: 1, focus: 'cajado' },
      blurb: 'Um guardião da natureza que comanda as forças primais.',
      role: 'Controle · cura · magias da natureza',
      cantrips: 2, spellList: 'druida',
      features: [
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Druida usando Sabedoria.'],
        [1, 'ordem_primal', 'Ordem Primal · Guardião', 'Treinamento com armas marciais e armadura média.'],
        [2, 'forma_selvagem', 'Forma Selvagem', 'Ação Bônus: assume forma de fera; ganha PV temporários iguais ao nível de Druida.'],
      ],
    },
    guerreiro: {
      name: 'Guerreiro', hd: 10, primary: ['for', 'des'], saves: ['for', 'con'], armor: ['leve', 'media', 'pesada', 'escudo'], weapons: 'marcial',
      skills: { n: 2, from: ['acrobacia', 'adestrar', 'atletismo', 'historia', 'intuicao', 'intimidacao', 'persuasao', 'percepcao', 'sobrevivencia'] },
      caster: null, color: '#e08a3c', icon: '⚔', masteryCount: 3,
      equip: { weapon: 'espada_grande', armor: 'cota', shield: false, gold: 4, potions: 2 },
      blurb: 'Um mestre do combate armado e da tática.',
      role: 'Linha de frente · versátil · resiliente',
      fightingStyleAt: 1,
      features: [
        [1, 'estilo_luta', 'Estilo de Luta', 'Escolha um Estilo de Luta.'],
        [1, 'retomar_folego', 'Retomar o Fôlego', 'Ação Bônus: recupera 1d10 + nível de Guerreiro PV. 2 usos (3 no nível 4, 4 no nível 10), recupera 1 em Descanso Curto.'],
        [1, 'maestria', 'Maestria em Armas', 'Usa a propriedade de Maestria de 3 tipos de arma.'],
        [2, 'surto_acao', 'Surto de Ação', 'Ganha uma ação extra neste turno (1×/Descanso Curto).'],
        [5, 'ataque_extra', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar.'],
        [9, 'indomavel', 'Indomável', 'Rerrola um teste de resistência falho somando seu nível de Guerreiro (1×/Descanso Longo).'],
      ],
    },
    ladino: {
      name: 'Ladino', hd: 8, primary: ['des'], saves: ['des', 'int'], armor: ['leve'], weapons: 'ladino',
      skills: { n: 4, from: ['acrobacia', 'atletismo', 'enganacao', 'intuicao', 'intimidacao', 'investigacao', 'percepcao', 'persuasao', 'prestidigitacao', 'furtividade'] },
      caster: null, color: '#5a6b7d', icon: '🗡', masteryCount: 2,
      equip: { weapon: 'espada_curta', armor: 'couro', shield: false, gold: 8, potions: 1 },
      blurb: 'Um especialista em furtividade e golpes precisos.',
      role: 'Dano preciso · Ataque Furtivo · perícias',
      features: [
        [1, 'ataque_furtivo', 'Ataque Furtivo', 'Uma vez por turno, +Xd6 de dano com arma de Acuidade ou à distância se tiver Vantagem. (1d6 no nível 1, +1d6 a cada 2 níveis.)'],
        [1, 'especializacao', 'Especialização', 'Dobra o BP em duas perícias.'],
        [1, 'maestria', 'Maestria em Armas', 'Usa a propriedade de Maestria de 2 tipos de arma.'],
        [2, 'acao_ardilosa', 'Ação Ardilosa', 'Ação Bônus: Disparada, Desengajar ou Esconder.'],
        [3, 'mira_firme', 'Mira Firme', 'Ação Bônus: Vantagem no próximo ataque deste turno (se não se mover).'],
        [5, 'esquiva_sobrenatural', 'Esquiva Sobrenatural', 'Reação: reduz à metade o dano de um ataque que você vê.'],
        [7, 'evasao', 'Evasão', 'Em TR de Destreza para metade do dano, sucesso = nenhum dano.'],
      ],
    },
    feiticeiro: {
      name: 'Feiticeiro', hd: 6, primary: ['car'], saves: ['con', 'car'], armor: [], weapons: 'simples',
      skills: { n: 2, from: ['arcanismo', 'enganacao', 'intuicao', 'intimidacao', 'persuasao', 'religiao'] },
      caster: { type: 'full', ab: 'car' }, color: '#ff6b8b', icon: '✷', masteryCount: 0,
      equip: { weapon: 'lanca', armor: 'nenhuma', shield: false, gold: 28, potions: 1, focus: 'cristal' },
      blurb: 'Um conjurador com magia inata no sangue.',
      role: 'Dano mágico explosivo · Metamagia',
      cantrips: 4, spellList: 'feiticeiro',
      features: [
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Feiticeiro usando Carisma.'],
        [1, 'feiticaria_inata', 'Feitiçaria Inata', 'Ação Bônus: por 1 minuto, +1 na CD das magias e Vantagem em ataques mágicos. 2 usos/Descanso Longo.'],
        [2, 'fonte_magia', 'Fonte de Magia', 'Pontos de Feitiçaria iguais ao nível; converte em espaços de magia.'],
      ],
    },
    mago: {
      name: 'Mago', hd: 6, primary: ['int'], saves: ['int', 'sab'], armor: [], weapons: 'simples',
      skills: { n: 2, from: ['arcanismo', 'historia', 'intuicao', 'investigacao', 'medicina', 'natureza', 'religiao'] },
      caster: { type: 'full', ab: 'int' }, color: '#4ea8ff', icon: '📖', masteryCount: 0,
      equip: { weapon: 'bordao', armor: 'nenhuma', shield: false, gold: 5, potions: 1, focus: 'grimorio' },
      blurb: 'Um estudioso arcano que domina magia por meio de livros.',
      role: 'Controle e dano em área · maior lista de magias',
      cantrips: 3, spellList: 'mago',
      features: [
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Mago usando Inteligência.'],
        [1, 'recuperacao_arcana', 'Recuperação Arcana', 'Em um Descanso Curto, recupera espaços de magia somando até metade do nível.'],
      ],
    },
    monge: {
      name: 'Monge', hd: 8, primary: ['des', 'sab'], saves: ['for', 'des'], armor: [], weapons: 'monge',
      skills: { n: 2, from: ['acrobacia', 'atletismo', 'historia', 'intuicao', 'religiao', 'furtividade'] },
      caster: null, color: '#3ec7b3', icon: '☯', masteryCount: 0,
      equip: { weapon: 'lanca', armor: 'nenhuma', shield: false, gold: 11, potions: 2 },
      unarmored: 'sab',
      blurb: 'Um artista marcial que canaliza o Foco interior.',
      role: 'Muitos golpes por turno · mobilidade',
      features: [
        [1, 'artes_marciais', 'Artes Marciais', 'Ataques desarmados e armas de monge usam d6 (d8 no nível 5) e Destreza; Ação Bônus: um golpe desarmado.'],
        [1, 'defesa_sem_armadura', 'Defesa sem Armadura', 'Sem armadura nem escudo, CA = 10 + DES + SAB.'],
        [2, 'foco', 'Foco do Monge', 'Pontos de Foco = nível. Rajada de Golpes (2 golpes extras), Defesa Paciente, Passo do Vento.'],
        [3, 'desviar', 'Desviar Ataques', 'Reação: reduz o dano de um ataque em 1d10 + DES + nível.'],
        [5, 'ataque_extra', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar.'],
        [5, 'golpe_atordoante', 'Golpe Atordoante', 'Gaste 1 Foco ao acertar: TR de CON ou Atordoado até seu próximo turno.'],
      ],
    },
    paladino: {
      name: 'Paladino', hd: 10, primary: ['for', 'car'], saves: ['sab', 'car'], armor: ['leve', 'media', 'pesada', 'escudo'], weapons: 'marcial',
      skills: { n: 2, from: ['atletismo', 'intuicao', 'intimidacao', 'medicina', 'persuasao', 'religiao'] },
      caster: { type: 'half', ab: 'car' }, color: '#ffd166', icon: '🛡', masteryCount: 2,
      equip: { weapon: 'espada_longa', armor: 'cota', shield: true, gold: 9, potions: 1, focus: 'simbolo' },
      blurb: 'Um guerreiro sagrado unido a um Juramento.',
      role: 'Tanque · Golpe Divino · cura',
      fightingStyleAt: 2, spellList: 'paladino',
      features: [
        [1, 'impor_maos', 'Impor as Mãos', 'Ação Bônus: reserva de cura igual a 5 × nível de Paladino.'],
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Paladino usando Carisma.'],
        [1, 'maestria', 'Maestria em Armas', 'Usa a propriedade de Maestria de 2 tipos de arma.'],
        [2, 'estilo_luta', 'Estilo de Luta', 'Escolha um Estilo de Luta.'],
        [2, 'golpe_paladino', 'Golpe do Paladino', 'Sempre tem Golpe Divino preparado e pode conjurá-lo sem espaço 1×/Descanso Longo.'],
        [5, 'ataque_extra', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar.'],
        [6, 'aura_protecao', 'Aura de Proteção', 'Soma CAR (mín. +1) a todos os seus testes de resistência.'],
      ],
    },
    patrulheiro: {
      name: 'Patrulheiro', hd: 10, primary: ['des', 'sab'], saves: ['for', 'des'], armor: ['leve', 'media', 'escudo'], weapons: 'marcial',
      skills: { n: 3, from: ['adestrar', 'atletismo', 'intuicao', 'investigacao', 'natureza', 'percepcao', 'furtividade', 'sobrevivencia'] },
      caster: { type: 'half', ab: 'sab' }, color: '#7cb342', icon: '🏹', masteryCount: 2,
      equip: { weapon: 'arco_longo', armor: 'couro_batido', shield: false, gold: 7, potions: 1 },
      blurb: 'Um caçador das fronteiras selvagens.',
      role: 'Dano à distância · Marca do Caçador',
      fightingStyleAt: 2, spellList: 'patrulheiro',
      features: [
        [1, 'inimigo_favorito', 'Inimigo Favorito', 'Marca do Caçador sempre preparada; conjura sem espaço 2×/Descanso Longo.'],
        [1, 'conjuracao', 'Conjuração', 'Conjura magias de Patrulheiro usando Sabedoria.'],
        [1, 'maestria', 'Maestria em Armas', 'Usa a propriedade de Maestria de 2 tipos de arma.'],
        [2, 'estilo_luta', 'Estilo de Luta', 'Escolha um Estilo de Luta.'],
        [5, 'ataque_extra', 'Ataque Extra', 'Ataca duas vezes ao usar a ação Atacar.'],
      ],
    },
  };

  H.CLASS_ORDER = ['guerreiro', 'barbaro', 'paladino', 'patrulheiro', 'ladino', 'monge', 'clerigo', 'druida', 'bardo', 'bruxo', 'feiticeiro', 'mago'];

  E.H = H;
})();
