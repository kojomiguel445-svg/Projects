/* Magias (D&D 2024 / SRD 5.2) adaptadas ao combate de Elarion.
   attack: 'dist'|'cac' (jogada de ataque mágico) · save: atributo do TR · dmg: dano · up: dados extras por círculo acima
   aoe: atinge todos os inimigos · time: 'acao'|'bonus' */
(() => {
  const S = {};
  const B = 'bardo', CL = 'clerigo', D = 'druida', F = 'feiticeiro', M = 'mago', W = 'bruxo', P = 'paladino', PT = 'patrulheiro';

  S.SPELLS = {
    // ---------------- Truques ----------------
    raio_fogo: { name: 'Raio de Fogo', level: 0, school: 'Evocação', classes: [F, M], time: 'acao', attack: 'dist', dmg: '1d10', type: 'fogo', desc: 'Um cisco de fogo: ataque mágico à distância, 1d10 de dano de Fogo.' },
    raio_gelo: { name: 'Raio de Gelo', level: 0, school: 'Evocação', classes: [F, M], time: 'acao', attack: 'dist', dmg: '1d8', type: 'frio', cond: 'lento', desc: 'Ataque mágico à distância: 1d8 de Frio e o deslocamento do alvo cai 3 m.' },
    toque_chocante: { name: 'Toque Chocante', level: 0, school: 'Evocação', classes: [F, M], time: 'acao', attack: 'cac', dmg: '1d8', type: 'eletrico', desc: 'Ataque mágico corpo a corpo: 1d8 Elétrico; o alvo não pode fazer Ataques de Oportunidade.' },
    toque_arrepiante: { name: 'Toque Arrepiante', level: 0, school: 'Necromancia', classes: [F, M, W], time: 'acao', attack: 'cac', dmg: '1d10', type: 'necrotico', desc: 'Ataque mágico corpo a corpo: 1d10 Necrótico e o alvo não recupera PV até seu próximo turno.' },
    respingo_acido: { name: 'Respingo Ácido', level: 0, school: 'Evocação', classes: [F, M], time: 'acao', save: 'des', dmg: '1d6', type: 'acido', aoe: 2, desc: 'Esfera de 1,5 m: TR de Destreza ou 1d6 de Ácido (até 2 alvos).' },
    espirro_veneno: { name: 'Borrifo Venenoso', level: 0, school: 'Necromancia', classes: [D, F, W, M], time: 'acao', attack: 'dist', dmg: '1d12', type: 'veneno', desc: 'Ataque mágico à distância: 1d12 de dano de Veneno.' },
    chama_sagrada: { name: 'Chama Sagrada', level: 0, school: 'Evocação', classes: [CL], time: 'acao', save: 'des', dmg: '1d8', type: 'radiante', desc: 'Chamas descem sobre o alvo: TR de Destreza ou 1d8 Radiante (ignora cobertura).' },
    palavra_radiante: { name: 'Palavra de Esplendor', level: 0, school: 'Evocação', classes: [CL], time: 'acao', save: 'con', dmg: '1d6', type: 'radiante', aoe: 99, desc: 'Luz explode ao seu redor: cada inimigo adjacente faz TR de CON ou sofre 1d6 Radiante.' },
    zombaria: { name: 'Zombaria Viciosa', level: 0, school: 'Encantamento', classes: [B], time: 'acao', save: 'sab', dmg: '1d6', type: 'psiquico', cond: 'enfraquecido', desc: 'Insulto mágico: TR de Sabedoria ou 1d6 Psíquico e Desvantagem no próximo ataque.' },
    rajada_mistica: { name: 'Rajada Mística', level: 0, school: 'Evocação', classes: [W], time: 'acao', attack: 'dist', dmg: '1d10', type: 'energia', beams: true, desc: 'Raio de energia crepitante: 1d10 de Energia. Dispara 2 raios no nível 5 e 3 no nível 11.' },
    produzir_chama: { name: 'Produzir Chama', level: 0, school: 'Conjuração', classes: [D], time: 'acao', attack: 'dist', dmg: '1d8', type: 'fogo', desc: 'Arremessa a chama da mão: ataque mágico à distância, 1d8 de Fogo.' },
    chicote_espinhos: { name: 'Chicote de Espinhos', level: 0, school: 'Transmutação', classes: [D], time: 'acao', attack: 'cac', dmg: '1d6', type: 'perfurante', desc: 'Vinha espinhosa: ataque mágico corpo a corpo, 1d6 Perfurante e puxa o alvo.' },

    // ---------------- 1º círculo ----------------
    misseis_magicos: { name: 'Mísseis Mágicos', level: 1, school: 'Evocação', classes: [F, M], time: 'acao', auto: true, darts: 3, dmg: '1d4+1', type: 'energia', desc: 'Três dardos que nunca erram: cada um causa 1d4 + 1 de Energia. +1 dardo por círculo acima.' },
    maos_flamejantes: { name: 'Mãos Flamejantes', level: 1, school: 'Evocação', classes: [F, M], time: 'acao', save: 'des', half: true, dmg: '3d6', up: '1d6', type: 'fogo', aoe: 99, desc: 'Cone de 4,5 m: TR de Destreza, 3d6 de Fogo (metade se passar).' },
    onda_trovejante: { name: 'Onda Trovejante', level: 1, school: 'Evocação', classes: [B, D, F, M], time: 'acao', save: 'con', half: true, dmg: '2d8', up: '1d8', type: 'trovejante', aoe: 99, desc: 'Cubo de 4,5 m: TR de Constituição, 2d8 Trovejante e empurra 3 m (metade se passar).' },
    orbe_cromatico: { name: 'Orbe Cromático', level: 1, school: 'Evocação', classes: [F, M], time: 'acao', attack: 'dist', dmg: '3d8', up: '1d8', type: 'eletrico', desc: 'Orbe de energia: ataque mágico à distância, 3d8 (Ácido, Frio, Fogo, Elétrico, Veneno ou Trovejante).' },
    raio_nauseante: { name: 'Raio Nauseante', level: 1, school: 'Necromancia', classes: [F, M], time: 'acao', attack: 'dist', dmg: '2d8', up: '1d8', type: 'veneno', cond: 'envenenado', condSave: 'con', desc: 'Ataque mágico à distância: 2d8 de Veneno; TR de CON ou fica Envenenado.' },
    curar_ferimentos: { name: 'Curar Ferimentos', level: 1, school: 'Abjuração', classes: [B, CL, D, P, PT], time: 'acao', heal: '2d8', up: '2d8', healMod: true, desc: 'Toque curativo: recupera 2d8 + modificador de conjuração PV.' },
    palavra_curativa: { name: 'Palavra Curativa', level: 1, school: 'Abjuração', classes: [B, CL, D], time: 'bonus', heal: '2d4', up: '2d4', healMod: true, desc: 'Ação Bônus: recupera 2d4 + modificador de conjuração PV à distância.' },
    raio_guia: { name: 'Raio Guia', level: 1, school: 'Evocação', classes: [CL], time: 'acao', attack: 'dist', dmg: '4d6', up: '1d6', type: 'radiante', cond: 'iluminado', desc: 'Lampejo de luz: 4d6 Radiante e o próximo ataque contra o alvo tem Vantagem.' },
    infligir_ferimentos: { name: 'Infligir Ferimentos', level: 1, school: 'Necromancia', classes: [CL], time: 'acao', save: 'con', half: true, dmg: '2d10', up: '1d10', type: 'necrotico', desc: 'Toque necrótico: TR de CON, 2d10 Necrótico (metade se passar).' },
    bencao: { name: 'Bênção', level: 1, school: 'Encantamento', classes: [CL, P], time: 'acao', buff: 'abencoado', conc: true, desc: 'Concentração: +1d4 em jogadas de ataque e testes de resistência.' },
    escudo_fe: { name: 'Escudo da Fé', level: 1, school: 'Abjuração', classes: [CL, P], time: 'bonus', buff: 'escudo_fe', conc: true, desc: 'Ação Bônus, Concentração: +2 na CA.' },
    golpe_divino: { name: 'Golpe Divino', level: 1, school: 'Evocação', classes: [P], time: 'smite', dmg: '2d8', up: '1d8', type: 'radiante', desc: 'Ação Bônus logo após acertar: +2d8 Radiante (+1d8 por círculo; +1d8 contra Corruptores e Mortos-Vivos).' },
    marca_cacador: { name: 'Marca do Caçador', level: 1, school: 'Adivinhação', classes: [PT], time: 'bonus', buff: 'marca', conc: true, extra: '1d6', type: 'energia', desc: 'Ação Bônus, Concentração: seus acertos causam +1d6 de Energia ao alvo marcado.' },
    maldicao: { name: 'Maldição', level: 1, school: 'Encantamento', classes: [W], time: 'bonus', buff: 'maldicao', conc: true, extra: '1d6', type: 'necrotico', desc: 'Ação Bônus, Concentração: seus acertos causam +1d6 Necrótico ao alvo amaldiçoado.' },
    bracos_hadar: { name: 'Braços de Hadar', level: 1, school: 'Conjuração', classes: [W], time: 'acao', save: 'for', half: true, dmg: '2d6', up: '1d6', type: 'necrotico', aoe: 99, desc: 'Tentáculos sombrios: TR de Força, 2d6 Necrótico a todos ao redor.' },
    sussurros: { name: 'Sussurros Dissonantes', level: 1, school: 'Encantamento', classes: [B], time: 'acao', save: 'sab', half: true, dmg: '3d6', up: '1d6', type: 'psiquico', desc: 'Melodia que só o alvo ouve: TR de Sabedoria, 3d6 Psíquico e foge de medo.' },
    fogo_fadas: { name: 'Fogo das Fadas', level: 1, school: 'Evocação', classes: [B, D], time: 'acao', save: 'des', cond: 'iluminado_conc', aoe: 99, conc: true, desc: 'Concentração: quem falhar no TR de Destreza fica delineado — ataques contra ele têm Vantagem.' },
    enredar: { name: 'Constrição', level: 1, school: 'Conjuração', classes: [D], time: 'acao', save: 'for', cond: 'contido', aoe: 99, conc: true, desc: 'Concentração: vinhas brotam; TR de Força ou fica Contido.' },
    enfeiticar_pessoa: { name: 'Enfeitiçar Pessoa', level: 1, school: 'Encantamento', classes: [B, D, F, M, W], time: 'acao', save: 'sab', cond: 'adormecido', onlyType: 'humanoide', foeAdv: true, desc: 'Um humanoide faz TR de Sabedoria (com Vantagem se você estiver lutando com ele) ou fica Enfeitiçado.' },
    protecao_mal_bem: { name: 'Proteção contra o Bem e o Mal', level: 1, school: 'Abjuração', classes: [CL, M, P, W], time: 'acao', sb: 'protEvil', conc: true, desc: 'Concentração: Aberrações, Celestiais, Elementais, Fadas, Corruptores e Mortos-Vivos têm Desvantagem nos ataques contra você.' },
    golpe_constritor: { name: 'Golpe Constritor', level: 1, school: 'Conjuração', classes: [PT], time: 'smite', dmg: '1d6', up: '1d6', type: 'perfurante', cond: 'contido', condSave: 'for', desc: 'Ação Bônus após acertar: vinhas espinhosas — TR de Força ou o alvo fica Contido e sofre 1d6 Perfurante.' },
    sono: { name: 'Sono', level: 1, school: 'Encantamento', classes: [B, F, M], time: 'acao', save: 'sab', cond: 'adormecido', aoe: 2, conc: true, desc: 'Concentração: TR de Sabedoria ou o alvo fica Incapacitado e adormece.' },
    escudo_arcano: { name: 'Escudo Arcano', level: 1, school: 'Abjuração', classes: [F, M], time: 'reacao', desc: 'Reação ao ser atingido: +5 na CA até o início do seu próximo turno (pode transformar o acerto em erro).' },
    armadura_arcana: { name: 'Armadura Arcana', level: 1, school: 'Abjuração', classes: [F, M], time: 'acao', buff: 'armadura_arcana', ritualOut: true, desc: 'Sem armadura, sua CA base vira 13 + DES por 8 horas.' },

    // ---------------- 2º círculo ----------------
    raio_ardente: { name: 'Raio Ardente', level: 2, school: 'Evocação', classes: [F, M], time: 'acao', attack: 'dist', rays: 3, dmg: '2d6', type: 'fogo', desc: 'Três raios de fogo: cada um é um ataque mágico, 2d6 de Fogo. +1 raio por círculo acima.' },
    despedacar: { name: 'Despedaçar', level: 2, school: 'Evocação', classes: [B, F, M, W], time: 'acao', save: 'con', half: true, dmg: '3d8', up: '1d8', type: 'trovejante', aoe: 99, desc: 'Estrondo ensurdecedor: TR de Constituição, 3d8 Trovejante.' },
    arma_espiritual: { name: 'Arma Espiritual', level: 2, school: 'Evocação', classes: [CL], time: 'bonus', attack: 'cac', dmg: '1d8', up: '1d8', type: 'energia', summon: 'arma_espiritual', conc: true, desc: 'Ação Bônus, Concentração: arma flutuante ataca (1d8 + mod de Energia) e repete o ataque como Ação Bônus.' },
    imobilizar_pessoa: { name: 'Imobilizar Pessoa', level: 2, school: 'Encantamento', classes: [B, CL, D, F, W, M], time: 'acao', save: 'sab', cond: 'paralisado', onlyType: 'humanoide', conc: true, desc: 'Concentração: um Humanoide faz TR de Sabedoria ou fica Paralisado (repete o TR a cada turno).' },
    passo_nebuloso: { name: 'Passo Nebuloso', level: 2, school: 'Conjuração', classes: [F, W, M], time: 'bonus', escape: true, desc: 'Ação Bônus: teleporta 9 m. Em combate, garante a fuga.' },
    raio_lunar: { name: 'Raio Lunar', level: 2, school: 'Evocação', classes: [D], time: 'acao', save: 'con', half: true, dmg: '2d10', up: '1d10', type: 'radiante', conc: true, dot: true, desc: 'Concentração: feixe prateado causa 2d10 Radiante (TR de CON metade) e repete a cada turno.' },
    flecha_acida: { name: 'Flecha Ácida', level: 2, school: 'Evocação', classes: [M], time: 'acao', attack: 'dist', dmg: '4d4', up: '1d4', type: 'acido', later: '2d4', desc: 'Ataque mágico: 4d4 de Ácido agora e 2d4 no fim do próximo turno do alvo.' },
    auxilio: { name: 'Auxílio', level: 2, school: 'Abjuração', classes: [B, CL, D, P, PT], time: 'acao', buff: 'auxilio', desc: 'Seus PV máximo e atuais aumentam em 5 por 8 horas.' },

    // ---------------- 3º círculo ----------------
    bola_fogo: { name: 'Bola de Fogo', level: 3, school: 'Evocação', classes: [F, M], time: 'acao', save: 'des', half: true, dmg: '8d6', up: '1d6', type: 'fogo', aoe: 99, desc: 'Explosão de 6 m: TR de Destreza, 8d6 de Fogo (metade se passar).' },
    relampago: { name: 'Relâmpago', level: 3, school: 'Evocação', classes: [F, M], time: 'acao', save: 'des', half: true, dmg: '8d6', up: '1d6', type: 'eletrico', aoe: 99, desc: 'Linha de 30 m: TR de Destreza, 8d6 Elétrico (metade se passar).' },
    guardioes_espirituais: { name: 'Guardiões Espirituais', level: 3, school: 'Conjuração', classes: [CL], time: 'acao', save: 'sab', half: true, dmg: '3d8', up: '1d8', type: 'radiante', aoe: 99, conc: true, dot: true, desc: 'Concentração: espíritos causam 3d8 Radiante (TR de SAB metade) a todo inimigo próximo, todo turno.' },
    convocar_relampago: { name: 'Invocar Relâmpagos', level: 3, school: 'Conjuração', classes: [D], time: 'acao', save: 'des', half: true, dmg: '3d10', up: '1d10', type: 'eletrico', conc: true, dot: true, desc: 'Concentração: nuvem de tempestade derruba raios de 3d10 Elétrico a cada turno.' },
    toque_vampirico: { name: 'Toque Vampírico', level: 3, school: 'Necromancia', classes: [W, M], time: 'acao', attack: 'cac', dmg: '3d6', up: '1d6', type: 'necrotico', drain: true, desc: 'Ataque mágico corpo a corpo: 3d6 Necrótico e você recupera metade do dano causado.' },
    padrao_hipnotico: { name: 'Padrão Hipnótico', level: 3, school: 'Ilusão', classes: [B, F, W, M], time: 'acao', save: 'sab', cond: 'adormecido', aoe: 99, conc: true, desc: 'Concentração: cores hipnóticas; TR de Sabedoria ou Incapacitado.' },
    golpe_cegante: { name: 'Golpe Cegante', level: 3, school: 'Evocação', classes: [P], time: 'smite', dmg: '3d8', type: 'radiante', cond: 'cego', condSave: 'con', desc: 'Ação Bônus após acertar: +3d8 Radiante e TR de CON ou fica Cego.' },
    flecha_relampago: { name: 'Flecha Relâmpago', level: 3, school: 'Transmutação', classes: [PT], time: 'acao', attack: 'dist', dmg: '4d8', up: '1d8', type: 'eletrico', aoe: 99, burst: { dice: '2d8', up: '1d8', type: 'eletrico', save: 'des' }, desc: 'Sua flecha vira relâmpago: 4d8 Elétrico no alvo e 2d8 aos demais (TR de DES).' },
    fome_hadar: { name: 'Fome de Hadar', level: 3, school: 'Conjuração', classes: [W], time: 'acao', save: 'des', half: true, dmg: '4d6', up: '1d6', type: 'frio', aoe: 99, conc: true, dot: true, desc: 'Concentração: vazio gélido; 2d6 Frio + 2d6 Ácido por turno.' },

    // ---------------- 4º círculo ----------------
    murchar: { name: 'Murchar', level: 4, school: 'Necromancia', classes: [D, F, W, M], time: 'acao', save: 'con', half: true, dmg: '8d8', up: '1d8', type: 'necrotico', desc: 'Drena a vida: TR de CON, 8d8 Necrótico (metade se passar).' },
    tempestade_gelo: { name: 'Tempestade de Gelo', level: 4, school: 'Evocação', classes: [D, F, M], time: 'acao', save: 'des', half: true, dmg: '6d8', up: '1d8', type: 'frio', aoe: 99, desc: 'Granizo: TR de Destreza, 2d10 Concussão + 4d6 Frio a todos.' },
    guardiao_fe: { name: 'Guardião da Fé', level: 4, school: 'Conjuração', classes: [CL], time: 'acao', save: 'des', half: true, dmg: '20', type: 'radiante', dot: true, desc: 'Guardião espectral: 20 de dano Radiante (TR de DES metade) a quem se aproximar, por turno.' },
    banimento: { name: 'Banimento', level: 4, school: 'Abjuração', classes: [CL, P, F, W, M], time: 'acao', save: 'car', cond: 'banido', conc: true, desc: 'Concentração: TR de Carisma ou o alvo some para outro plano.' },
    assassino_fantasmagorico: { name: 'Assassino Fantasmagórico', level: 4, school: 'Ilusão', classes: [B, M], time: 'acao', save: 'sab', half: true, dmg: '4d10', up: '1d10', type: 'psiquico', desc: 'Pesadelo vivo: TR de Sabedoria, 4d10 Psíquico (metade se passar).' },

    // ---------------- 5º círculo ----------------
    cone_frio: { name: 'Cone de Frio', level: 5, school: 'Evocação', classes: [F, M], time: 'acao', save: 'con', half: true, dmg: '8d8', up: '1d8', type: 'frio', aoe: 99, desc: 'Rajada gélida de 18 m: TR de CON, 8d8 de Frio.' },
    coluna_chamas: { name: 'Coluna de Chamas', level: 5, school: 'Evocação', classes: [CL], time: 'acao', save: 'des', half: true, dmg: '10d6', up: '1d6', type: 'radiante', aoe: 99, desc: 'Pilar divino: TR de Destreza, 5d6 Fogo + 5d6 Radiante.' },
    curar_massa: { name: 'Curar Ferimentos em Massa', level: 5, school: 'Abjuração', classes: [B, CL, D], time: 'acao', heal: '5d8', up: '1d8', healMod: true, desc: 'Onda curativa: recupera 5d8 + mod de conjuração PV.' },
    imobilizar_monstro: { name: 'Imobilizar Monstro', level: 5, school: 'Encantamento', classes: [B, F, W, M], time: 'acao', save: 'sab', cond: 'paralisado', conc: true, desc: 'Concentração: TR de Sabedoria ou a criatura fica Paralisada.' },
    praga_insetos: { name: 'Praga de Insetos', level: 5, school: 'Conjuração', classes: [CL, D, F], time: 'acao', save: 'con', half: true, dmg: '4d10', up: '1d10', type: 'perfurante', aoe: 99, conc: true, dot: true, desc: 'Concentração: enxame de gafanhotos, 4d10 Perfurante (TR de CON metade) por turno.' },

    // ================ Livro do Jogador 2024: mais magias ================
    // truques
    estilhaco_mental: { name: 'Estilhaço Mental', level: 0, school: 'Encantamento', classes: [F, W, M], time: 'acao', save: 'int', dmg: '1d6', type: 'psiquico', cond: 'mistico', desc: 'Lasca psíquica: TR de Inteligência ou 1d6 Psíquico e Desvantagem no próximo TR contra suas magias.' },
    explosao_feiticeira: { name: 'Explosão Feiticeira', level: 0, school: 'Evocação', classes: [F], time: 'acao', attack: 'dist', dmg: '1d8', type: 'eletrico', desc: 'Rajada de pura feitiçaria: ataque mágico à distância, 1d8 de dano elemental.' },
    lampejo_estelar: { name: 'Lampejo Estelar', level: 0, school: 'Evocação', classes: [B, D], time: 'acao', attack: 'dist', dmg: '1d8', type: 'radiante', desc: 'Uma faísca de luz estelar: ataque mágico à distância, 1d8 Radiante.' },
    estrondo: { name: 'Estrondo', level: 0, school: 'Evocação', classes: [B, D, F, W, M], time: 'acao', save: 'con', dmg: '1d6', type: 'trovejante', aoe: 99, desc: 'Um trovão ao seu redor: cada inimigo próximo faz TR de CON ou sofre 1d6 Trovejante.' },
    dobre_mortos: { name: 'Dobre dos Mortos', level: 0, school: 'Necromancia', classes: [CL, W, M], time: 'acao', save: 'sab', dmg: '1d8', hurtDmg: '1d12', type: 'necrotico', desc: 'Um sino fúnebre: TR de Sabedoria ou 1d8 Necrótico (1d12 se o alvo já estiver ferido).' },
    golpe_certeiro: { name: 'Golpe Certeiro', level: 0, school: 'Adivinhação', classes: [B, F, W, M], time: 'acao', weaponCast: true, desc: 'Ataque com a sua arma usando o atributo de conjuração; +1d6 Radiante no nível 5 (2d6 no 11).' },
    bordao_mistico: { name: 'Bordão Místico', level: 0, school: 'Transmutação', classes: [D], time: 'bonus', sb: 'shillelagh', rounds: 10, desc: 'Ação Bônus: seu Bordão ou Clava usa Sabedoria e causa 1d8 (1d10 no nível 5).' },
    // 1º círculo
    comando: { name: 'Comando', level: 1, school: 'Encantamento', classes: [B, CL, P], time: 'acao', save: 'sab', cond: 'caido', desc: '“Rasteje!”: TR de Sabedoria ou o alvo se joga no chão (Caído).' },
    perdicao: { name: 'Perdição', level: 1, school: 'Encantamento', classes: [B, CL], time: 'acao', save: 'car', cond: 'perdicao', aoe: 3, conc: true, desc: 'Concentração: até 3 inimigos fazem TR de Carisma ou subtraem 1d4 dos ataques e TRs.' },
    riso_histerico: { name: 'Riso Histérico', level: 1, school: 'Encantamento', classes: [B, M], time: 'acao', save: 'sab', cond: 'incapacitado', conc: true, desc: 'Concentração: TR de Sabedoria ou o alvo cai na gargalhada, Incapacitado.' },
    faca_gelo: { name: 'Faca de Gelo', level: 1, school: 'Conjuração', classes: [D, F, M], time: 'acao', attack: 'dist', dmg: '1d10', type: 'perfurante', burst: { dice: '2d6', up: '1d6', type: 'frio', save: 'des', all: true }, aoe: 99, desc: 'Ataque mágico: 1d10 Perfurante; a faca explode — todos fazem TR de DES ou sofrem 2d6 de Frio.' },
    raio_bruxa: { name: 'Raio de Bruxa', level: 1, school: 'Evocação', classes: [F, W, M], time: 'acao', attack: 'dist', dmg: '2d12', up: '1d12', type: 'eletrico', desc: 'Arco de relâmpago azul: ataque mágico à distância, 2d12 Elétrico.' },
    vida_falsa: { name: 'Vida Falsa', level: 1, school: 'Necromancia', classes: [F, M], time: 'acao', temp: '2d4+4', tempUp: 5, desc: 'Ganha 2d4 + 4 PV temporários (+5 por círculo acima).' },
    armadura_agathys: { name: 'Armadura de Agathys', level: 1, school: 'Abjuração', classes: [W], time: 'bonus', agathys: 5, desc: 'Ação Bônus: 5 PV temporários por círculo; quem te acertar corpo a corpo sofre 5 de Frio por círculo.' },
    heroismo: { name: 'Heroísmo', level: 1, school: 'Encantamento', classes: [B, P], time: 'acao', sb: 'heroism', conc: true, desc: 'Concentração: imune a Amedrontado e ganha PV temporários = mod de conjuração no início de cada turno.' },
    favor_divino: { name: 'Favor Divino', level: 1, school: 'Transmutação', classes: [P], time: 'bonus', sb: 'divineFavor', rounds: 10, desc: 'Ação Bônus: seus ataques com arma causam +1d4 Radiante por 1 minuto.' },
    golpe_trovejante: { name: 'Golpe Trovejante', level: 1, school: 'Evocação', classes: [P], time: 'smite', dmg: '2d6', up: '1d6', type: 'trovejante', cond: 'caido', condSave: 'for', desc: 'Ação Bônus após acertar: +2d6 Trovejante e TR de Força ou o alvo é arremessado e fica Caído.' },
    golpe_colerico: { name: 'Golpe Colérico', level: 1, school: 'Necromancia', classes: [P], time: 'smite', dmg: '1d6', up: '1d6', type: 'psiquico', cond: 'amedrontado', condSave: 'sab', desc: 'Ação Bônus após acertar: +1d6 Psíquico e TR de Sabedoria ou fica Amedrontado.' },
    golpe_ardente: { name: 'Golpe Ardente', level: 1, school: 'Evocação', classes: [P], time: 'smite', dmg: '1d6', up: '1d6', type: 'fogo', later: '1d6', desc: 'Ação Bônus após acertar: +1d6 de Fogo e o alvo continua queimando (1d6 no turno dele).' },
    repreensao_infernal: { name: 'Repreensão Infernal', level: 1, school: 'Evocação', classes: [W], time: 'reacao', save: 'des', half: true, dmg: '2d10', up: '1d10', type: 'fogo', desc: 'Reação ao sofrer dano: chamas envolvem o agressor — TR de DES, 2d10 de Fogo.' },
    // 2º círculo
    esfera_flamejante: { name: 'Esfera Flamejante', level: 2, school: 'Conjuração', classes: [D, F, M], time: 'acao', save: 'des', half: true, dmg: '2d6', up: '1d6', type: 'fogo', conc: true, dot: true, desc: 'Concentração: uma bola de fogo rola até o alvo — TR de DES, 2d6 de Fogo a cada turno.' },
    nuvem_adagas: { name: 'Nuvem de Adagas', level: 2, school: 'Conjuração', classes: [B, F, W, M], time: 'acao', autoDmg: true, dmg: '4d4', up: '2d4', type: 'cortante', conc: true, dot: true, desc: 'Concentração: adagas giram em volta do alvo — 4d4 Cortante agora e a cada turno, sem TR.' },
    imagem_espelhada: { name: 'Imagem Espelhada', level: 2, school: 'Ilusão', classes: [B, F, W, M], time: 'acao', mirror: 3, desc: 'Três duplicatas ilusórias confundem os inimigos: ataques podem acertar uma imagem em vez de você.' },
    nublar: { name: 'Nublar', level: 2, school: 'Ilusão', classes: [F, M], time: 'acao', sb: 'blur', conc: true, desc: 'Concentração: seu corpo fica borrado — ataques contra você têm Desvantagem.' },
    invisibilidade: { name: 'Invisibilidade', level: 2, school: 'Ilusão', classes: [B, F, W, M], time: 'acao', sb: 'invis', conc: true, desc: 'Concentração: você some — o próximo ataque tem Vantagem e os inimigos têm Desvantagem até você atacar.' },
    arma_magica: { name: 'Arma Mágica', level: 2, school: 'Transmutação', classes: [P, PT, M], time: 'bonus', sb: 'magicWeapon', rounds: 99, desc: 'Ação Bônus: sua arma vira mágica, +1 nas jogadas de ataque e de dano.' },
    pele_arvore: { name: 'Pele de Árvore', level: 2, school: 'Transmutação', classes: [D, PT], time: 'bonus', sb: 'barkskin', rounds: 99, desc: 'Ação Bônus: sua pele vira casca — sua CA não pode ser menor que 17.' },
    teia: { name: 'Teia', level: 2, school: 'Conjuração', classes: [F, M], time: 'acao', save: 'des', cond: 'contido', aoe: 99, conc: true, desc: 'Concentração: teias grudentas; TR de Destreza ou fica Contido.' },
    raio_enfraquecimento: { name: 'Raio de Enfraquecimento', level: 2, school: 'Necromancia', classes: [W, M], time: 'acao', save: 'con', cond: 'enfraquecido', conc: true, desc: 'Concentração: TR de Constituição ou o alvo fica Enfraquecido (Desvantagem nos ataques).' },
    restauracao_menor: { name: 'Restauração Menor', level: 2, school: 'Abjuração', classes: [B, CL, D, P, PT], time: 'bonus', cleanse: ['cego', 'envenenado', 'paralisado'], desc: 'Ação Bônus: encerra Cego, Envenenado ou Paralisado em você.' },
    golpe_brilhante: { name: 'Golpe Brilhante', level: 2, school: 'Transmutação', classes: [P], time: 'smite', dmg: '2d6', up: '1d6', type: 'radiante', cond: 'iluminado', desc: 'Ação Bônus após acertar: +2d6 Radiante e o alvo brilha (Vantagem no próximo ataque contra ele).' },
    aumentar: { name: 'Aumentar/Reduzir', level: 2, school: 'Transmutação', classes: [D, F, M], time: 'acao', sb: 'enlarge', conc: true, desc: 'Concentração: você cresce — seus ataques com arma causam +1d4 de dano.' },
    // 3º círculo
    velocidade: { name: 'Velocidade', level: 3, school: 'Transmutação', classes: [F, M], time: 'acao', sb: 'haste', conc: true, desc: 'Concentração: +2 na CA e um ataque com arma extra em cada turno.' },
    lentidao_magia: { name: 'Lentidão', level: 3, school: 'Transmutação', classes: [B, F, M], time: 'acao', save: 'sab', cond: 'lentificado', aoe: 6, conc: true, desc: 'Concentração: até 6 inimigos fazem TR de Sabedoria ou perdem 2 de CA e só atacam uma vez por turno.' },
    medo: { name: 'Medo', level: 3, school: 'Ilusão', classes: [B, F, W, M], time: 'acao', save: 'sab', cond: 'amedrontado', aoe: 99, conc: true, desc: 'Concentração: visões terríveis; TR de Sabedoria ou fica Amedrontado.' },
    nevoa_fetida: { name: 'Névoa Fétida', level: 3, school: 'Conjuração', classes: [B, F, M], time: 'acao', save: 'con', cond: 'envenenado', aoe: 99, conc: true, desc: 'Concentração: nuvem nauseante; TR de Constituição ou fica Envenenado.' },
    palavra_curativa_massa: { name: 'Palavra Curativa em Massa', level: 3, school: 'Abjuração', classes: [B, CL], time: 'bonus', heal: '2d4', up: '1d4', healMod: true, desc: 'Ação Bônus: recupera 2d4 + modificador de conjuração PV.' },
    manto_cruzado: { name: 'Manto do Cruzado', level: 3, school: 'Evocação', classes: [P], time: 'acao', sb: 'mantle', conc: true, desc: 'Concentração: aura sagrada — seus ataques com arma causam +1d4 Radiante.' },
    arma_elemental: { name: 'Arma Elemental', level: 3, school: 'Transmutação', classes: [D, P, PT], time: 'acao', sb: 'elemWeapon', conc: true, desc: 'Concentração: +1 nas jogadas de ataque e +1d4 de Fogo em cada acerto com arma.' },
    mortalha_espiritual: { name: 'Mortalha Espiritual', level: 3, school: 'Necromancia', classes: [CL, P, W, M], time: 'bonus', sb: 'shroud', conc: true, desc: 'Ação Bônus, Concentração: espíritos te cercam — seus ataques causam +1d8 Radiante.' },
    // 4º círculo
    muralha_fogo: { name: 'Muralha de Fogo', level: 4, school: 'Evocação', classes: [D, F, M], time: 'acao', save: 'des', half: true, dmg: '5d8', up: '1d8', type: 'fogo', aoe: 99, conc: true, dot: true, desc: 'Concentração: muralha de chamas; TR de Destreza, 5d8 de Fogo a cada turno.' },
    pele_pedra: { name: 'Pele de Pedra', level: 4, school: 'Transmutação', classes: [D, PT, F, M], time: 'acao', sb: 'stoneskin', conc: true, desc: 'Concentração: Resistência a dano Contundente, Cortante e Perfurante.' },
    invisibilidade_maior: { name: 'Invisibilidade Maior', level: 4, school: 'Ilusão', classes: [B, F, M], time: 'acao', sb: 'ginvis', conc: true, desc: 'Concentração: invisível mesmo atacando — Vantagem nos ataques e Desvantagem para os inimigos.' },
    tentaculos_negros: { name: 'Tentáculos Negros', level: 4, school: 'Conjuração', classes: [M], time: 'acao', save: 'for', half: true, dmg: '3d6', up: '1d6', type: 'concussao', cond: 'contido', aoe: 99, conc: true, dot: true, desc: 'Concentração: tentáculos de ébano; TR de Força, 3d6 Contundente e Contido.' },
    escudo_fogo: { name: 'Escudo de Fogo', level: 4, school: 'Evocação', classes: [F, M], time: 'acao', sb: 'fireShield', rounds: 99, desc: 'Chamas te envolvem: Resistência a Frio e quem te acertar corpo a corpo sofre 2d8 de Fogo.' },
    protecao_morte: { name: 'Proteção contra a Morte', level: 4, school: 'Abjuração', classes: [CL, P], time: 'acao', sb: 'deathWard', rounds: 99, desc: 'A primeira vez que cairia a 0 PV, fica com 1 PV.' },
    golpe_estonteante: { name: 'Golpe Estonteante', level: 4, school: 'Encantamento', classes: [P], time: 'smite', dmg: '4d6', type: 'psiquico', cond: 'atordoado', condSave: 'sab', desc: 'Ação Bônus após acertar: +4d6 Psíquico e TR de Sabedoria ou fica Atordoado.' },
    porta_dimensional: { name: 'Porta Dimensional', level: 4, school: 'Conjuração', classes: [B, F, W, M], time: 'acao', escape: true, desc: 'Teleporta até 150 m: garante a fuga do combate.' },
    // 5º círculo
    onda_destrutiva: { name: 'Onda Destrutiva', level: 5, school: 'Evocação', classes: [P], time: 'acao', save: 'con', half: true, dmg: '10d6', type: 'trovejante', cond: 'caido', aoe: 99, desc: 'Você golpeia o chão: TR de CON, 5d6 Trovejante + 5d6 Radiante e os inimigos caem.' },
    golpe_banidor: { name: 'Golpe Banidor', level: 5, school: 'Conjuração', classes: [P], time: 'smite', dmg: '5d10', type: 'energia', desc: 'Ação Bônus após acertar: +5d10 de Energia.' },
    estatica_sinaptica: { name: 'Estática Sináptica', level: 5, school: 'Encantamento', classes: [B, F, W, M], time: 'acao', save: 'int', half: true, dmg: '8d6', up: '1d6', type: 'psiquico', aoe: 99, desc: 'Explosão psíquica: TR de Inteligência, 8d6 Psíquico.' },
    nevoa_mortal: { name: 'Névoa Mortal', level: 5, school: 'Conjuração', classes: [F, M], time: 'acao', save: 'con', half: true, dmg: '5d8', up: '1d8', type: 'veneno', aoe: 99, conc: true, dot: true, desc: 'Concentração: nuvem venenosa; TR de CON, 5d8 de Veneno a cada turno.' },
    contagio: { name: 'Contágio', level: 5, school: 'Necromancia', classes: [CL, D], time: 'acao', save: 'con', dmg: '11d8', type: 'necrotico', cond: 'envenenado', desc: 'Toque pestilento: TR de CON ou 11d8 Necrótico e fica Envenenado.' },
    ataque_aco_vento: { name: 'Ataque do Aço Ventoso', level: 5, school: 'Conjuração', classes: [PT, M], time: 'acao', attack: 'cac', rays: 5, spread: true, dmg: '6d10', type: 'energia', desc: 'Você some e reaparece golpeando até 5 inimigos diferentes: 6d10 de Energia cada.' },
  };

  // Quantidade de magias preparadas por nível (LdJ 2024)
  S.PREPARED = {
    bardo: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15],
    clerigo: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15],
    druida: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15],
    mago: [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15],
    feiticeiro: [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15],
    bruxo: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10],
    paladino: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9],
    patrulheiro: [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9],
  };
  // truques conhecidos: +1 no nível 4 e +1 no nível 10
  S.cantripsKnown = (cls, level) => {
    const base = (E.H.CLASSES[cls] && E.H.CLASSES[cls].cantrips) || 0;
    if (!base) return 0;
    return base + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0);
  };
  S.listFor = (cls) => Object.entries(S.SPELLS).filter(([, s]) => s.classes.includes(cls)).map(([id]) => id);
  S.SCHOOL_COLORS = { Evocação: '#ff8a5b', Abjuração: '#7fd3ff', Conjuração: '#ffd36b', Necromancia: '#9be3b8', Encantamento: '#ff9ad5', Ilusão: '#c3a6ff', Adivinhação: '#b8f0ff', Transmutação: '#b7f05a' };

  E.S = S;
})();
