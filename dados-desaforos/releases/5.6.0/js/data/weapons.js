/* Arsenal de Elarion — armas mágicas obtidas no Oráculo (gacha).
   Tipos inspirados em Genshin Impact, regras de D&D 2024:
   ★1 Comum (mundana) · ★3 Incomum (+1) · ★4 Rara (+2) · ★5 Muito Rara (+3).
   Refinamento R1–R5 (cópias duplicadas) melhora o efeito passivo. */
(() => {
  const W = {};

  W.TYPES = {
    espada: { name: 'Espada', icon: '🗡', bases: ['espada_longa', 'rapieira', 'cimitarra', 'espada_curta', 'adaga'], desc: 'Lâminas de uma mão: equilíbrio entre precisão e dano.' },
    espadao: { name: 'Espadão', icon: '⚔', bases: ['espada_grande', 'machado_grande', 'malho', 'machado_batalha', 'martelo_guerra'], desc: 'Armas pesadas de duas mãos: golpes devastadores.' },
    haste: { name: 'Haste', icon: '🔱', bases: ['lanca', 'glaive', 'alabarda', 'tridente', 'pique', 'bordao'], desc: 'Armas de haste: alcance e controle do campo.' },
    arco: { name: 'Arco', icon: '🏹', bases: ['arco_longo', 'arco_curto', 'besta_leve', 'besta_pesada', 'besta_mao'], desc: 'Armas à distância: ataque seguro e preciso.' },
    catalisador: { name: 'Catalisador', icon: '🔮', bases: [], desc: 'Focos arcanos e símbolos sagrados: fortalecem magias (ataque mágico e CD).' },
  };
  W.TYPE_ORDER = ['espada', 'espadao', 'haste', 'arco', 'catalisador'];

  W.RARITY = {
    1: { name: 'Comum', bonus: 0, color: '#9aa3ad', glow: '#c9d1d9', bg: ['#4b5563', '#2c333d'] },
    3: { name: 'Incomum', bonus: 1, color: '#5aa0ff', glow: '#7fc0ff', bg: ['#3a5f9e', '#1f2f52'] },
    4: { name: 'Rara', bonus: 2, color: '#b77dff', glow: '#d3a8ff', bg: ['#6b44a8', '#2f1f52'] },
    5: { name: 'Muito Rara', bonus: 3, color: '#ffb84d', glow: '#ffd98a', bg: ['#b36b1f', '#4a2a10'] },
  };

  // Tipo do item base → tipo de arma
  W.typeOfBase = (base) => {
    for (const [t, def] of Object.entries(W.TYPES)) if (def.bases.includes(base)) return t;
    const w = E.R.WEAPONS[base];
    if (!w) return 'espada';
    return w.kind === 'dist' ? 'arco' : w.props.includes('duas_maos') ? 'espadao' : 'espada';
  };

  // Efeitos passivos. vals = valores para R1..R5. {v} no texto é substituído.
  // kinds: extra (dano extra 1×/turno), crit (margem de crítico), ac, init, temp (PV temp. no início), killHeal,
  //        firstAdv, spell (dano extra de magia 1×/turno), heal (cura extra), save, resist, critHeal
  W.CATALOG = {
    // ===================== ★3 =====================
    lamina_viajante: { name: 'Lâmina do Viajante', type: 'espada', rarity: 3, base: 'espada_longa',
      passive: { name: 'Fôlego da Estrada', kind: 'killHeal', vals: ['1d6', '1d6+1', '1d6+2', '1d6+3', '1d6+4'], desc: 'Ao reduzir um inimigo a 0 PV, recupera {v} PV.' },
      lore: 'Forjada para quem nunca dorme duas noites no mesmo lugar.', art: { c1: '#cfd8e3', c2: '#5aa0ff', v: 0 } },
    fio_prata: { name: 'Fio de Prata Lunar', type: 'espada', rarity: 3, base: 'rapieira',
      passive: { name: 'Luar Purificador', kind: 'extra', vs: ['morto-vivo', 'corruptor'], vals: ['1d4', '1d6', '1d8', '1d10', '1d12'], dtype: 'radiante', desc: 'Uma vez por turno, +{v} Radiante contra Mortos-Vivos e Corruptores.' },
      lore: 'Prata das pontes de Lunária, banhada em água benta.', art: { c1: '#e6ecff', c2: '#7fc0ff', v: 1 } },
    clava_sinos: { name: 'Malho da Ferreira de Sinos', type: 'espadao', rarity: 3, base: 'malho',
      passive: { name: 'Badalada', kind: 'temp', vals: [3, 4, 5, 6, 7], desc: 'Começa cada combate com {v} PV temporários.' },
      lore: 'Ila testava seus sinos com este martelo. Ainda ressoa.', art: { c1: '#b8a07a', c2: '#5aa0ff', v: 0 } },
    machado_fronteira: { name: 'Machado da Fronteira', type: 'espadao', rarity: 3, base: 'machado_grande',
      passive: { name: 'Golpe de Misericórdia', kind: 'extra', hurt: true, vals: ['1d4', '1d6', '1d8', '1d10', '1d12'], dtype: 'cortante', desc: 'Uma vez por turno, +{v} contra alvos abaixo da metade dos PV.' },
      lore: 'Lenhadores da fronteira juram que ele corta medo.', art: { c1: '#9aa7b5', c2: '#5aa0ff', v: 1 } },
    lanca_guarda: { name: 'Lança da Guarda Lunar', type: 'haste', rarity: 3, base: 'lanca',
      passive: { name: 'Vigília', kind: 'init', vals: [2, 3, 3, 4, 5], desc: '+{v} na Iniciativa.' },
      lore: 'Padrão da guarda das Sete Pontes.', art: { c1: '#c9d1d9', c2: '#5aa0ff', v: 0 } },
    glaive_peregrino: { name: 'Glaive do Peregrino', type: 'haste', rarity: 3, base: 'glaive',
      passive: { name: 'Lâmina Larga', kind: 'critExtra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], desc: 'Acertos críticos causam +{v} de dano.' },
      lore: 'O peregrino das mil mãos deixou muitas armas pelo caminho.', art: { c1: '#d6dbe2', c2: '#5aa0ff', v: 1 } },
    arco_corvo: { name: 'Arco Curto do Corvo', type: 'arco', rarity: 3, base: 'arco_curto',
      passive: { name: 'Primeiro Voo', kind: 'firstAdv', vals: [1, 1, 1, 1, 1], extraVals: [0, 1, 2, 3, 4], desc: 'Vantagem no primeiro ataque de cada combate (+{x} de dano nele).' },
      lore: 'Penas negras na corda: nunca perde o primeiro tiro.', art: { c1: '#3a3f4a', c2: '#5aa0ff', v: 0 } },
    besta_contrabandista: { name: 'Besta do Contrabandista', type: 'arco', rarity: 3, base: 'besta_leve',
      passive: { name: 'Carga Escondida', kind: 'extra', first: true, vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'perfurante', desc: 'O primeiro acerto de cada combate causa +{v}.' },
      lore: 'Desmontável, cabe num barril de peixe.', art: { c1: '#8a6a48', c2: '#5aa0ff', v: 1 } },
    orbe_aprendiz: { name: 'Orbe do Aprendiz', type: 'catalisador', rarity: 3, base: null,
      passive: { name: 'Foco Estudado', kind: 'spell', vals: [1, 2, 2, 3, 3], desc: 'Uma vez por turno, magias causam +{v} de dano.' },
      lore: 'Todo mago do Observatório começa com uma destas.', art: { c1: '#9fd4ff', c2: '#5aa0ff', v: 0 } },
    simbolo_lanterna: { name: 'Símbolo da Lanterna', type: 'catalisador', rarity: 3, base: null,
      passive: { name: 'Chama Gentil', kind: 'heal', vals: [1, 2, 3, 4, 5], desc: 'Magias de cura recuperam +{v} PV.' },
      lore: 'Um pingente com a luz azul do Bosque.', art: { c1: '#9fe3ff', c2: '#5aa0ff', v: 1 } },

    // ===================== ★4 =====================
    lamina_juramento: { name: 'Lâmina do Juramento', type: 'espada', rarity: 4, base: 'espada_longa',
      passive: { name: 'Promessa Cumprida', kind: 'critHeal', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], desc: 'Ao acertar um Crítico, recupera {v} PV (1×/turno).' },
      lore: 'Entregue aos cavaleiros que juram diante da juíza.', art: { c1: '#f2f4f8', c2: '#b77dff', v: 2 } },
    gume_mares: { name: 'Gume das Marés', type: 'espada', rarity: 4, base: 'cimitarra',
      passive: { name: 'Corte Salgado', kind: 'extra', vals: ['1d4', '1d6', '1d6+1', '1d8', '1d8+2'], dtype: 'frio', desc: 'Uma vez por turno, +{v} de Frio ao acertar.' },
      lore: 'Curva como uma onda; fria como o fundo do mar.', art: { c1: '#bfe9ff', c2: '#b77dff', v: 1 } },
    florete_leilao: { name: 'Florete do Leilão', type: 'espada', rarity: 4, base: 'rapieira',
      passive: { name: 'Lance Final', kind: 'crit', vals: [19, 19, 19, 18, 18], desc: 'Seus ataques com esta arma são Críticos com {v}–20.' },
      lore: 'Arrematado pela Dama do Leilão — e por ninguém mais.', art: { c1: '#e8e2ff', c2: '#ffcf5a', v: 0 } },
    espadao_brasa: { name: 'Espadão da Brasa', type: 'espadao', rarity: 4, base: 'espada_grande',
      passive: { name: 'Lâmina Incandescente', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'fogo', desc: 'Uma vez por turno, +{v} de Fogo ao acertar.' },
      lore: 'Temperado na chaminé de uma estrela apagada.', art: { c1: '#ffb08a', c2: '#b77dff', v: 1 } },
    rocha_forja: { name: 'Rocha da Forja Celeste', type: 'espadao', rarity: 4, base: 'malho',
      passive: { name: 'Bastião', kind: 'ac', vals: [1, 1, 1, 2, 2], tempVals: [4, 6, 8, 10, 12], desc: '+{v} na CA e {t} PV temporários no início do combate.' },
      lore: 'Meteorito martelado pelos anões da forja.', art: { c1: '#8f96a3', c2: '#b77dff', v: 0 } },
    machado_sinfonico: { name: 'Machado Sinfônico', type: 'espadao', rarity: 4, base: 'machado_grande',
      passive: { name: 'Coro de Batalha', kind: 'killHeal', vals: ['2d6', '2d6+2', '2d8+2', '2d8+4', '3d8+4'], desc: 'Ao reduzir um inimigo a 0 PV, recupera {v} PV.' },
      lore: 'Cada golpe soa como uma nota de órgão.', art: { c1: '#d7c3ff', c2: '#b77dff', v: 2 } },
    tridente_navegante: { name: 'Tridente do Navegante', type: 'haste', rarity: 4, base: 'tridente',
      passive: { name: 'Trovão das Ondas', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'trovejante', desc: 'Uma vez por turno, +{v} Trovejante ao acertar.' },
      lore: 'O navegante sem memória só lembra como usá-lo.', art: { c1: '#9fd4e8', c2: '#b77dff', v: 1 } },
    alabarda_conclave: { name: 'Alabarda do Conclave', type: 'haste', rarity: 4, base: 'alabarda',
      passive: { name: 'Disciplina', kind: 'init', vals: [3, 4, 5, 6, 7], adv: true, desc: '+{v} na Iniciativa e Vantagem no primeiro ataque do combate.' },
      lore: 'Arma de cerimônia do Conclave da Forja.', art: { c1: '#e0e6ee', c2: '#ffcf5a', v: 0 } },
    lanca_seiva: { name: 'Lança Espinho-de-Seiva', type: 'haste', rarity: 4, base: 'lanca',
      passive: { name: 'Seiva Amarga', kind: 'extra', hurt: true, vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: 'veneno', desc: 'Uma vez por turno, +{v} de Veneno contra alvos feridos (abaixo do PV máximo).' },
      lore: 'Cresceu, não foi forjada.', art: { c1: '#a8e6a1', c2: '#b77dff', v: 2 } },
    arco_pontes: { name: 'Arco das Sete Pontes', type: 'arco', rarity: 4, base: 'arco_longo',
      passive: { name: 'Mira do Sentinela', kind: 'crit', vals: [19, 19, 19, 18, 18], desc: 'Seus ataques com esta arma são Críticos com {v}–20.' },
      lore: 'Os arqueiros das pontes acertam sinos a 300 passos.', art: { c1: '#d9c7a0', c2: '#b77dff', v: 0 } },
    corda_prismatica: { name: 'Corda Prismática', type: 'arco', rarity: 4, base: 'arco_curto',
      passive: { name: 'Flecha de Luz Partida', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'energia', desc: 'Uma vez por turno, +{v} de Energia ao acertar.' },
      lore: 'A corda é um raio de luz preso entre dois chifres.', art: { c1: '#c6f0ff', c2: '#ff9ad5', v: 1 } },
    besta_sentinela: { name: 'Besta Sentinela', type: 'arco', rarity: 4, base: 'besta_pesada',
      passive: { name: 'Tiro Preparado', kind: 'firstAdv', vals: [1, 1, 1, 1, 1], extraVals: ['1d8', '1d10', '2d6', '2d8', '3d6'], desc: 'Vantagem no primeiro ataque de cada combate e +{x} de dano nele.' },
      lore: 'Paciência é a melhor munição.', art: { c1: '#7d8796', c2: '#b77dff', v: 2 } },
    lanterna_pactos: { name: 'Lanterna dos Pactos', type: 'catalisador', rarity: 4, base: null,
      passive: { name: 'Chama Contratual', kind: 'spell', vals: [2, 3, 4, 5, 6], desc: 'Uma vez por turno, magias causam +{v} de dano.' },
      lore: 'Cada pacto firmado acende uma nova chama.', art: { c1: '#9fd4ff', c2: '#b77dff', v: 1 } },
    tomo_ossos: { name: 'Tomo do Bibliotecário', type: 'catalisador', rarity: 4, base: null,
      passive: { name: 'Nomes Recuperados', kind: 'save', vals: [1, 1, 2, 2, 3], desc: '+{v} em todos os seus testes de resistência.' },
      lore: 'Contém os nomes apagados das Ruínas da Aurora.', art: { c1: '#e8dcc0', c2: '#b77dff', v: 2 } },
    concha_rei: { name: 'Concha do Rei das Marés', type: 'catalisador', rarity: 4, base: null,
      passive: { name: 'Maré Curativa', kind: 'heal', vals: [2, 3, 4, 5, 6], tempVals: [3, 4, 5, 6, 7], desc: 'Magias de cura recuperam +{v} PV; começa o combate com {t} PV temporários.' },
      lore: 'Encoste no ouvido: dá para ouvir o futuro.', art: { c1: '#ffd1e8', c2: '#b77dff', v: 0 } },

    // ===================== Armaria (só na loja, nunca no Oráculo) =====================
    sabre_guarda: { name: 'Sabre da Guarda Dourada', type: 'espada', rarity: 3, base: 'cimitarra', shop: { price: 900, lvl: 2 },
      passive: { name: 'Prontidão', kind: 'init', vals: [2, 3, 3, 4, 5], desc: '+{v} na Iniciativa.' },
      lore: 'Padrão da guarda que patrulha as avenidas de Aurenna.', art: { c1: '#f6e3a8', c2: '#5aa0ff', v: 0 } },
    adaga_acendedor: { name: 'Adaga do Acendedor', type: 'espada', rarity: 3, base: 'adaga', shop: { price: 750, lvl: 1 },
      passive: { name: 'Pavio Curto', kind: 'killHeal', vals: ['1d4+1', '1d4+2', '1d6+2', '1d6+3', '1d8+3'], desc: 'Ao reduzir um inimigo a 0 PV, recupera {v} PV.' },
      lore: 'Os acendedores de lampiões carregam uma por via das dúvidas.', art: { c1: '#ffe2b0', c2: '#5aa0ff', v: 0 } },
    martelo_cais: { name: 'Martelo do Cais', type: 'espadao', rarity: 3, base: 'martelo_guerra', shop: { price: 900, lvl: 2 },
      passive: { name: 'Casco Firme', kind: 'temp', vals: [4, 5, 6, 7, 8], desc: 'Começa cada combate com {v} PV temporários.' },
      lore: 'Pregou metade das tábuas do porto de Aurenna.', art: { c1: '#b9c2cc', c2: '#5aa0ff', v: 0 } },
    pique_caravana: { name: 'Pique da Caravana', type: 'haste', rarity: 3, base: 'pique', shop: { price: 950, lvl: 2 },
      passive: { name: 'Escolta', kind: 'extra', hurt: true, vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'perfurante', desc: 'Uma vez por turno, +{v} contra alvos abaixo da metade dos PV.' },
      lore: 'Mantém bandidos a três passos das carroças.', art: { c1: '#d0d6de', c2: '#5aa0ff', v: 0 } },
    besta_recompensa: { name: 'Besta do Caçador de Recompensas', type: 'arco', rarity: 3, base: 'besta_mao', shop: { price: 1000, lvl: 2 },
      passive: { name: 'Alvo Marcado', kind: 'crit', vals: [19, 19, 19, 18, 18], desc: 'Seus ataques com esta arma são Críticos com {v}–20.' },
      lore: 'Pequena, silenciosa e cobrada por cabeça.', art: { c1: '#6f7682', c2: '#5aa0ff', v: 0 } },
    cajado_bolsa: { name: 'Cetro da Bolsa de Aurenna', type: 'catalisador', rarity: 3, base: null, shop: { price: 950, lvl: 2 },
      passive: { name: 'Investimento Seguro', kind: 'save', vals: [1, 1, 1, 2, 2], desc: '+{v} em todos os seus testes de resistência.' },
      lore: 'Os corretores juram que ele protege contra quedas — de preço e de penhasco.', art: { c1: '#ffe9a8', c2: '#5aa0ff', v: 1 } },
    lamina_duelista: { name: 'Lâmina do Duelista Dourado', type: 'espada', rarity: 4, base: 'rapieira', shop: { price: 4200, lvl: 5 },
      passive: { name: 'Finta Dourada', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'radiante', desc: 'Uma vez por turno, +{v} Radiante ao acertar.' },
      lore: 'Campeã de cem duelos na Arena — e de nenhum funeral.', art: { c1: '#fff1c2', c2: '#ffb84d', v: 0 } },
    machado_vulcao: { name: 'Machado da Forja Vulcânica', type: 'espadao', rarity: 4, base: 'machado_batalha', shop: { price: 4500, lvl: 5 },
      passive: { name: 'Magma Vivo', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'fogo', desc: 'Uma vez por turno, +{v} de Fogo ao acertar.' },
      lore: 'A lâmina ainda brilha como lava quando faz frio.', art: { c1: '#ffb08a', c2: '#ff5a2a', v: 0 } },
    glaive_tempestade: { name: 'Glaive da Tempestade', type: 'haste', rarity: 4, base: 'glaive', shop: { price: 4500, lvl: 5 },
      passive: { name: 'Relâmpago Acorrentado', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'eletrico', desc: 'Uma vez por turno, +{v} Elétrico ao acertar.' },
      lore: 'Forjada no topo das Montanhas durante uma tempestade de sete dias.', art: { c1: '#e2d4ff', c2: '#9a6bff', v: 0 } },
    arco_real: { name: 'Arco Real de Aurenna', type: 'arco', rarity: 4, base: 'arco_longo', shop: { price: 4800, lvl: 5 },
      passive: { name: 'Salva Real', kind: 'firstAdv', vals: [1, 1, 1, 1, 1], extraVals: ['1d10', '2d6', '2d8', '3d6', '3d8'], desc: 'Vantagem no primeiro ataque de cada combate e +{x} de dano nele.' },
      lore: 'Dispara a flecha que abre o Festival da Moeda.', art: { c1: '#f2d48a', c2: '#ffb84d', v: 0 } },
    orbe_fortuna: { name: 'Orbe da Fortuna', type: 'catalisador', rarity: 4, base: null, shop: { price: 4600, lvl: 5 },
      passive: { name: 'Aposta Arcana', kind: 'spell', vals: [2, 3, 4, 5, 6], desc: 'Uma vez por turno, magias causam +{v} de dano.' },
      lore: 'Ganhado numa mesa do Cassino. O dono anterior ainda procura por ele.', art: { c1: '#ffe27a', c2: '#ff6bb0', v: 0 } },

    // ===================== ★5 =====================
    aurora_elarion: { name: 'Aurora de Elarion', type: 'espada', rarity: 5, base: 'espada_longa',
      passive: { name: 'Alvorada Eterna', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: 'radiante', ac: 1, desc: '+1 na CA. Uma vez por turno, +{v} Radiante ao acertar.' },
      lore: 'A espada que acendeu a primeira lanterna. Dizem que ela ainda lembra do sol.', art: { c1: '#fff4cc', c2: '#ffb84d', v: 3 } },
    veu_juiza: { name: 'Véu da Juíza Vazia', type: 'espada', rarity: 5, base: 'rapieira',
      passive: { name: 'Sentença', kind: 'crit', vals: [19, 19, 18, 18, 18], critDice: ['2d6', '2d8', '2d8', '3d8', '4d8'], dtype: 'psiquico', desc: 'Crítico com {v}–20; Críticos causam +{c} Psíquico.' },
      lore: 'A juíza da máscara vazia nunca erra um veredito.', art: { c1: '#f0e6ff', c2: '#ff9ad5', v: 2 } },
    coroa_partida: { name: 'Coroa Partida', type: 'espadao', rarity: 5, base: 'espada_grande',
      passive: { name: 'Ruína das Nove Vozes', kind: 'extra', hurt: true, vals: ['2d6', '2d8', '3d6', '3d8', '4d8'], dtype: 'necrotico', killTemp: 8, desc: 'Uma vez por turno, +{v} Necrótico contra alvos feridos. Ao derrotar um inimigo, ganha 8 PV temporários.' },
      lore: 'Forjada com um fragmento da Coroa das Nove Vozes. Às vezes sussurra.', art: { c1: '#d8b8ff', c2: '#7b2cff', v: 3 } },
    martelo_sol: { name: 'Martelo do Sol Antigo', type: 'espadao', rarity: 5, base: 'malho',
      passive: { name: 'Fornalha Estelar', kind: 'extra', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], dtype: 'fogo', resist: 'fogo', desc: 'Resistência a Fogo. Uma vez por turno, +{v} de Fogo ao acertar.' },
      lore: 'O último dragão cinzento o guardou por mil anos.', art: { c1: '#ffcf8a', c2: '#ff6a3c', v: 2 } },
    chifre_cervo: { name: 'Chifre do Cervo de Cristal', type: 'haste', rarity: 5, base: 'lanca',
      passive: { name: 'Passo Cristalino', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: 'frio', init: 5, adv: true, desc: '+5 na Iniciativa e Vantagem no primeiro ataque. Uma vez por turno, +{v} de Frio.' },
      lore: 'O cervo de cristal deixou o chifre para quem salvasse o bosque.', art: { c1: '#d9f6ff', c2: '#6bdcff', v: 3 } },
    leviata: { name: 'Leviatã Adormecido', type: 'haste', rarity: 5, base: 'tridente',
      passive: { name: 'Maré Abissal', kind: 'extra', vals: ['2d6', '2d8', '3d6', '3d8', '4d8'], dtype: 'trovejante', tempVals: [6, 8, 10, 12, 15], desc: 'Começa o combate com {t} PV temporários. Uma vez por turno, +{v} Trovejante.' },
      lore: 'Arrancado do dorso de uma ilha viva.', art: { c1: '#9fe3ff', c2: '#3a7bd5', v: 2 } },
    lanterna_eterna: { name: 'Lanterna Eterna', type: 'arco', rarity: 5, base: 'arco_longo',
      passive: { name: 'Novecentos Anos de Luz', kind: 'extra', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], dtype: 'radiante', crit: 19, desc: 'Crítico com 19–20. Uma vez por turno, +{v} Radiante ao acertar.' },
      lore: 'A chama azul do coração do Bosque, presa a uma corda.', art: { c1: '#bfe9ff', c2: '#ffb84d', v: 3 } },
    seteceus: { name: 'Setecéus', type: 'arco', rarity: 5, base: 'besta_pesada',
      passive: { name: 'Constelação Disparada', kind: 'firstAdv', vals: [1, 1, 1, 1, 1], extraVals: ['3d8', '4d8', '5d8', '6d8', '7d8'], dtype: 'energia', desc: 'Vantagem no primeiro ataque de cada combate e +{x} de Energia nele.' },
      lore: 'Cada virote é uma estrela que o Oráculo tirou do céu.', art: { c1: '#e8e2ff', c2: '#c6b4ff', v: 2 } },
    astrolabio: { name: 'Astrolábio dos Nomes', type: 'catalisador', rarity: 5, base: null,
      passive: { name: 'Céu em Reverso', kind: 'spell', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], save: 1, desc: '+1 em testes de resistência. Uma vez por turno, magias causam +{v} de dano.' },
      lore: 'Um modelo do céu que muda quando você decide.', art: { c1: '#ffe9a8', c2: '#c6b4ff', v: 3 } },
    grimorio_maos: { name: 'Grimório das Mãos Vazias', type: 'catalisador', rarity: 5, base: null,
      passive: { name: 'Preço Pago', kind: 'heal', vals: [4, 5, 6, 7, 8], spellTemp: [4, 5, 6, 8, 10], desc: 'Curas recuperam +{v} PV. Ao conjurar magia com espaço, ganha {s} PV temporários.' },
      lore: 'As páginas ficam em branco até você pagar com uma lembrança.', art: { c1: '#ffd1e8', c2: '#ff6b8b', v: 2 } },
    // ---- ★5 da v3 ----
    asa_fenix: { name: 'Asa da Fênix Rubra', type: 'espada', rarity: 5, base: 'espada_longa',
      passive: { name: 'Renascer das Cinzas', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: 'fogo', phoenix: ['2d8', '2d10', '3d8', '3d10', '4d10'], desc: 'Uma vez por turno, +{v} de Fogo ao acertar. Uma vez por combate, ao cair a 0 PV, você renasce em chamas com {p} PV.' },
      lore: 'Uma pena da última fênix, forjada em lâmina. Ela se recusa a deixar o dono morrer — pelo menos uma vez.', art: { c1: '#ffcf6a', c2: '#ff4a2a', v: 0 } },
    lua_devoradora: { name: 'Lua Devoradora', type: 'espadao', rarity: 5, base: 'espada_grande',
      passive: { name: 'Fome do Eclipse', kind: 'extra', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], dtype: 'psiquico', killTemp: 10, desc: 'Uma vez por turno, +{v} Psíquico ao acertar. Ao derrotar um inimigo, ganha 10 PV temporários.' },
      lore: 'Na noite em que a lua sumiu do céu de Elarion, um ferreiro acordou com ela na bigorna.', art: { c1: '#e6e2ff', c2: '#9a6bff', v: 0 } },
    serpente_celeste: { name: 'Serpente Celeste', type: 'haste', rarity: 5, base: 'glaive',
      passive: { name: 'Dança do Dragão de Jade', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: 'eletrico', ac: 1, init: 3, desc: '+1 na CA e +3 na Iniciativa. Uma vez por turno, +{v} Elétrico ao acertar.' },
      lore: 'O dragão de jade dorme enrolado na haste. Quando acorda, o céu troveja.', art: { c1: '#b8ffe0', c2: '#3ac890', v: 0 } },
    harpa_ventos: { name: 'Harpa dos Ventos Eternos', type: 'arco', rarity: 5, base: 'arco_longo',
      passive: { name: 'Canção do Vendaval', kind: 'extra', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], dtype: 'trovejante', crit: 19, adv: true, desc: 'Crítico com 19–20 e Vantagem no primeiro ataque do combate. Uma vez por turno, +{v} Trovejante ao acertar.' },
      lore: 'Cada corda é um vento diferente. A última ninguém ouviu — e quem ouviu não voltou.', art: { c1: '#e6f6ff', c2: '#4a8ad8', v: 0 } },
    coracao_elarion: { name: 'Coração de Elarion', type: 'catalisador', rarity: 5, base: null,
      passive: { name: 'Pulso do Mundo', kind: 'spell', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], spellTemp: [3, 4, 5, 6, 8], desc: 'Uma vez por turno, magias causam +{v} de dano. Ao conjurar magia com espaço, ganha {s} PV temporários.' },
      lore: 'Dizem que é o coração do próprio mundo. Ele bate mais rápido perto de quem precisa de ajuda.', art: { c1: '#ffc2e0', c2: '#ff5a9a', v: 0 } },
  };

  // (o nível das armas, 1–90 com ascensões, fica em engine/forge.js)

  // ---------------------------------------------------------------- afinidade
  // Cada classe tem afinidade com os tipos de arma do seu treinamento. Com afinidade a arma funciona normalmente;
  // sem afinidade o herói não soma o bônus de proficiência no ataque, não usa a Maestria e a arma não "desperta"
  // (passivo, níveis e habilidade única ficam desligados). As regras de proficiência do D&D continuam valendo por cima.
  W.AFFINITY = {
    barbaro: { types: ['espadao', 'haste'], bases: ['machadinha', 'azagaia', 'clava_grande'], why: 'Armas pesadas de duas mãos e de haste.' },
    bardo: { types: ['espada', 'catalisador'], bases: [], why: 'Lâminas leves e elegantes, além do instrumento.' },
    bruxo: { types: ['catalisador'], bases: ['foice_curta'], why: 'O foco do pacto (e a foice ritual).' },
    clerigo: { types: ['catalisador'], bases: ['maca', 'maca_estrela', 'mangual', 'martelo_leve', 'martelo_guerra', 'malho', 'clava'], why: 'Símbolo sagrado, maças e martelos.' },
    druida: { types: ['catalisador'], bases: ['foice_curta', 'bordao', 'lanca', 'cimitarra', 'clava', 'azagaia', 'funda', 'dardo'], why: 'Foco druídico e armas simples da natureza.' },
    feiticeiro: { types: ['catalisador'], bases: ['lanca', 'bordao', 'dardo'], why: 'Focos arcanos (e uma lança ou bordão).' },
    guerreiro: { types: ['espada', 'espadao', 'haste', 'arco'], bases: [], why: 'Mestre de todas as armas marciais.' },
    ladino: { types: ['espada', 'arco'], bases: [], why: 'Lâminas leves e de acuidade, arcos e bestas.' },
    mago: { types: ['catalisador'], bases: ['bordao'], why: 'Grimórios, orbes, cajados — magos não lutam com lâminas.' },
    monge: { types: ['haste', 'espada'], bases: ['clava', 'machadinha', 'martelo_leve', 'foice_curta'], why: 'Armas de monge: bordões, lanças e lâminas leves.' },
    paladino: { types: ['espada', 'espadao', 'haste', 'catalisador'], bases: ['maca', 'mangual', 'maca_estrela'], why: 'Armas de cavaleiro e o símbolo sagrado.' },
    patrulheiro: { types: ['arco', 'espada', 'catalisador'], bases: ['lanca', 'machadinha', 'azagaia'], why: 'Arcos, lâminas de caçador e foco druídico.' },
  };
  W.hasAffinity = (cls, def, caster) => {
    if (!def) return true;
    const a = W.AFFINITY[cls];
    if (!a) return true;
    if (def.type === 'catalisador') return a.types.includes('catalisador') || !!caster;
    return a.types.includes(def.type) || (!!def.base && a.bases.includes(def.base));
  };
  W.affinityText = (cls) => {
    const a = W.AFFINITY[cls]; if (!a) return '';
    const bases = a.bases.map((b) => (E.R.WEAPONS[b] || {}).name).filter(Boolean);
    return a.types.map((t) => W.TYPES[t].name).join(', ') + (bases.length ? ` · ${bases.join(', ')}` : '');
  };

  // ---------------------------------------------------------------- habilidades únicas das ★5
  // Despertam com a ascensão: Ascensão 2 (passou do Nv. 40), fortalecem na 4 (Nv. 60) e se completam na 6 (Nv. 80).
  // Uma vez por combate, como poder no menu de Ação. tiers = valores para [despertar, fortalecer, completar].
  W.SIG_ASC = [2, 4, 6];
  W.SIGNATURE = {
    aurora_elarion: { name: 'Primeira Alvorada', icon: '🌅', kind: 'strike', type: 'radiante', dice: ['3d8', '5d8', '7d8'], cond: [null, 'cego', 'cego'], save: 'con', drain: [0, 0, 0.5],
      desc: ['Golpe de luz: ataque com a arma +{d} Radiante.', 'O alvo também faz TR de CON ou fica Cego.', 'Você recupera metade do dano causado.'] },
    veu_juiza: { name: 'Veredito Final', icon: '⚖', kind: 'strike', type: 'psiquico', dice: ['3d8', '4d8', '6d8'], adv: [true, true, true], cond: [null, 'amedrontado', 'amedrontado'], save: 'sab', autoCrit: [false, false, true],
      desc: ['Ataque com Vantagem +{d} Psíquico.', 'O alvo faz TR de SAB ou fica Amedrontado.', 'Se acertar, é um Acerto Crítico.'] },
    coroa_partida: { name: 'Coro das Nove Vozes', icon: '👑', kind: 'aoe', type: 'necrotico', dice: ['3d10', '5d10', '7d10'], save: 'con', temp: [0, 0, 12],
      desc: ['Todos os inimigos: {d} Necrótico (TR CON metade).', 'Mais dano.', 'Você ganha 12 PV temporários.'] },
    martelo_sol: { name: 'Queda do Sol Antigo', icon: '☀', kind: 'aoe', type: 'fogo', dice: ['4d8', '6d8', '8d8'], save: 'des', cond: [null, 'caido', 'caido'],
      desc: ['Todos os inimigos: {d} Fogo (TR DES metade).', 'Quem falhar fica Caído.', 'Mais dano.'] },
    chifre_cervo: { name: 'Galope Cristalino', icon: '🦌', kind: 'strike', type: 'frio', dice: ['3d8', '4d8', '6d8'], cond: [null, 'contido', 'contido'], save: 'for', buff: [null, null, 'advNext'],
      desc: ['Investida: ataque com a arma +{d} Frio.', 'O alvo faz TR de FOR ou fica Contido no gelo.', 'Vantagem no próximo ataque.'] },
    leviata: { name: 'Despertar do Leviatã', icon: '🌊', kind: 'aoe', type: 'trovejante', dice: ['3d10', '5d10', '7d10'], save: 'for', cond: [null, 'caido', 'caido'], temp: [0, 0, 15],
      desc: ['Onda: todos os inimigos {d} Trovejante (TR FOR metade).', 'Quem falhar fica Caído.', 'Você ganha 15 PV temporários.'] },
    lanterna_eterna: { name: 'Chuva de Lanternas', icon: '🏮', kind: 'aoe', type: 'radiante', dice: ['3d8', '5d8', '7d8'], save: 'des', cond: [null, 'iluminado', 'iluminado'],
      desc: ['Todos os inimigos: {d} Radiante (TR DES metade).', 'Quem falhar fica marcado: o próximo ataque contra ele tem Vantagem.', 'Mais dano.'] },
    seteceus: { name: 'Sete Céus', icon: '🌠', kind: 'strike', type: 'energia', dice: ['4d10', '6d10', '8d10'], adv: [true, true, true],
      desc: ['Virote estelar com Vantagem +{d} Energia.', 'Mais dano.', 'Dano máximo de estrela cadente.'] },
    astrolabio: { name: 'Céu em Reverso', icon: '🔭', kind: 'aoe', type: 'radiante', dice: ['3d8', '5d8', '7d8'], save: 'sab', cond: [null, 'lentificado', 'lentificado'],
      desc: ['Todos os inimigos: {d} Radiante (TR SAB metade).', 'Quem falhar fica Lentificado.', 'Mais dano.'] },
    grimorio_maos: { name: 'Página em Branco', icon: '📖', kind: 'self', heal: ['3d8', '5d8', '7d8'], temp: [5, 8, 12], cleanse: [false, true, true],
      desc: ['Recupera {h} PV e ganha PV temporários.', 'Também encerra Envenenado, Amedrontado e Cego.', 'Mais cura.'] },
    asa_fenix: { name: 'Voo da Fênix', icon: '🔥', kind: 'aoe', type: 'fogo', dice: ['3d8', '5d8', '7d8'], save: 'des', drain: [0, 0.5, 0.5], temp: [0, 0, 10],
      desc: ['Asas de fogo: todos os inimigos {d} Fogo (TR DES metade).', 'Você recupera metade do dano causado ao primeiro alvo.', 'E ganha 10 PV temporários.'] },
    lua_devoradora: { name: 'Eclipse Total', icon: '🌑', kind: 'strike', type: 'psiquico', dice: ['4d8', '6d8', '8d8'], cond: [null, 'amedrontado', 'amedrontado'], save: 'sab', killTemp: [0, 0, 20],
      desc: ['Golpe do eclipse: ataque com a arma +{d} Psíquico.', 'O alvo faz TR de SAB ou fica Amedrontado.', 'Se o alvo cair, você ganha 20 PV temporários.'] },
    serpente_celeste: { name: 'Dragão de Jade', icon: '🐉', kind: 'aoe', type: 'eletrico', dice: ['3d10', '5d10', '7d10'], save: 'des', cond: [null, 'lento', 'atordoado'],
      desc: ['O dragão desce: todos os inimigos {d} Elétrico (TR DES metade).', 'Quem falhar fica Lento.', 'Quem falhar fica Atordoado.'] },
    harpa_ventos: { name: 'A Última Corda', icon: '🎼', kind: 'aoe', type: 'trovejante', dice: ['3d8', '5d8', '7d8'], save: 'con', cond: [null, 'empurrado', 'caido'],
      desc: ['Vendaval: todos os inimigos {d} Trovejante (TR CON metade).', 'Quem falhar é empurrado.', 'Quem falhar fica Caído.'] },
    coracao_elarion: { name: 'Pulso do Mundo', icon: '💗', kind: 'self', heal: ['4d8', '6d8', '8d8'], temp: [5, 10, 15], cleanse: [false, false, true],
      desc: ['O mundo bate por você: recupera {h} PV e ganha PV temporários.', 'Mais cura e PV temporários.', 'Também encerra todas as condições negativas.'] },
  };
  W.sigTier = (asc) => (asc >= W.SIG_ASC[2] ? 3 : asc >= W.SIG_ASC[1] ? 2 : asc >= W.SIG_ASC[0] ? 1 : 0);
  // texto completo da habilidade (para a ficha da arma)
  W.sigText = (id, tier) => {
    const s = W.SIGNATURE[id]; if (!s) return '';
    const i = Math.max(0, Math.min(2, (tier || 1) - 1));
    return s.desc.slice(0, i + 1).join(' ').replace('{d}', s.dice ? s.dice[i] : '').replace('{h}', s.heal ? s.heal[i] : '');
  };

  // Armas mundanas iniciais (★1) por classe
  W.starterFor = (base) => ({ name: E.R.WEAPONS[base] ? E.R.WEAPONS[base].name : base, type: W.typeOfBase(base), rarity: 1, base, passive: null, lore: 'Equipamento inicial.', art: { c1: '#c9d1d9', c2: '#9aa3ad', v: 0 } });
  W.FOCUS_NAMES = { instrumento: 'Alaúde Simples', orbe: 'Orbe Opaco', simbolo: 'Símbolo Sagrado', cajado: 'Cajado de Freixo', cristal: 'Cristal Arcano', grimorio: 'Grimório de Estudante' };

  // Estandartes
  W.BANNERS = {
    evento: [
      { id: 'eclipse', name: 'Eclipse da Fênix', featured5: ['asa_fenix', 'lua_devoradora'], featured4: ['lamina_juramento', 'espadao_brasa', 'machado_sinfonico', 'corda_prismatica', 'lanterna_pactos'], tint: ['#ff6a2a', '#9a6bff'], isNew: true },
      { id: 'jade', name: 'Vento do Dragão de Jade', featured5: ['serpente_celeste', 'harpa_ventos'], featured4: ['gume_mares', 'tridente_navegante', 'lanca_seiva', 'arco_pontes', 'tomo_ossos'], tint: ['#3ac890', '#4a8ad8'], isNew: true },
      { id: 'coracao', name: 'Pulso do Mundo', featured5: ['coracao_elarion', 'aurora_elarion'], featured4: ['florete_leilao', 'rocha_forja', 'alabarda_conclave', 'besta_sentinela', 'concha_rei'], tint: ['#ff5a9a', '#ffd36b'], isNew: true },
      { id: 'forja_estrelas', name: 'Forja das Estrelas Caídas', featured5: ['aurora_elarion', 'coroa_partida'], featured4: ['florete_leilao', 'espadao_brasa', 'alabarda_conclave', 'arco_pontes', 'lanterna_pactos'], tint: ['#ffb84d', '#7b2cff'] },
      { id: 'mare_violeta', name: 'Canção da Maré Violeta', featured5: ['leviata', 'lanterna_eterna'], featured4: ['gume_mares', 'machado_sinfonico', 'tridente_navegante', 'corda_prismatica', 'concha_rei'], tint: ['#6bdcff', '#3a7bd5'] },
      { id: 'observatorio', name: 'Céu em Reverso', featured5: ['astrolabio', 'chifre_cervo'], featured4: ['lamina_juramento', 'rocha_forja', 'lanca_seiva', 'besta_sentinela', 'tomo_ossos'], tint: ['#c6b4ff', '#ffe9a8'] },
      { id: 'juiza', name: 'Leilão da Juíza Vazia', featured5: ['veu_juiza', 'martelo_sol'], featured4: ['florete_leilao', 'rocha_forja', 'tridente_navegante', 'besta_sentinela', 'lanterna_pactos'], tint: ['#ff9ad5', '#ff6a3c'] },
    ],
    padrao: { id: 'oraculo_errante', name: 'Oráculo Errante', tint: ['#7fc0ff', '#b77dff'] },
  };
  // rotação de 14 dias a partir do lançamento da v3 (os estandartes novos vêm primeiro)
  W.BANNER_EPOCH = Date.UTC(2026, 9, 19) / 86400000;
  W.currentEventBanner = () => {
    const days = Math.floor(Date.now() / 86400000 - W.BANNER_EPOCH);
    const n = W.BANNERS.evento.length;
    return W.BANNERS.evento[((Math.floor(days / 14) % n) + n) % n];
  };
  W.bannerEndsIn = () => {
    const days = Date.now() / 86400000 - W.BANNER_EPOCH;
    const end = (Math.floor(days / 14) + 1) * 14;
    return Math.ceil(end - days);
  };

  // Texto do passivo para um refinamento
  W.passiveText = (def, r = 1) => {
    if (!def || !def.passive) return '';
    const p = def.passive, i = Math.max(0, Math.min(4, r - 1));
    return p.desc
      .replace('{v}', p.vals ? p.vals[i] : '')
      .replace('{x}', p.extraVals ? p.extraVals[i] : '')
      .replace('{t}', p.tempVals ? p.tempVals[i] : '')
      .replace('{c}', p.critDice ? p.critDice[i] : '')
      .replace('{s}', p.spellTemp ? p.spellTemp[i] : '')
      .replace('{p}', p.phoenix ? p.phoenix[i] : '');
  };

  E.W = W;
})();
