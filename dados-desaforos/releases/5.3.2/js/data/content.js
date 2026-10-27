/* Conteúdo das regiões (v4): grutas de mineração, NPCs novos com missões em cadeia, Lumes colecionáveis,
   Corridas das Lanternas e Domínios. Cada região passa a ter bem mais coisa para fazer. */
(() => {
  const WD = E.WD;
  const CT = {};

  // ---------------------------------------------------------------- grutas (mineração)
  // Cada região (menos Aurenna) tem uma gruta. Lá dentro ficam os veios de minério (precisa de picareta),
  // um lago subterrâneo com peixes cegos, baús e alguns monstros.
  WD.BIOMES.cave = { ground: ['#4a4450', '#5a5462', '#6e6876'], high: '#3a3440', water: '#1e3a5a', sky: ['#0c0a12', '#14101c'], fog: '#120e18', props: ['stalag', 'stalag', 'crystal', 'rock', 'mush', 'rock'], density: 0.9, light: '#ffd8a8', night: true, accent: '#46607a', pave: '#5a5462', roof: '#3a3440', cave: true };
  const CV = (parent, name, tint, ores, mons, level, extra = {}) => Object.assign({ parent, name, biome: 'cave', cave: true, tint, ores, level, seed: [...parent].reduce((a, c) => a * 31 + c.charCodeAt(0), 17) % 9973, npcs: [], neighbors: [parent], herb: null, short: 'Veios de minério, ecos e um lago escuro.', summary: 'Uma gruta funda onde os mineiros de Elarion buscam ferro, prata, cristais e obsidiana.', weather: 'Gotas e ecos', mons }, extra);
  WD.CAVES = {
    gruta_bosque: CV('bosque', 'Gruta das Raízes', '#5a7a5a', ['ferro', 'ferro', 'prata'], ['aranha_gigante', 'rato_gigante', 'goblin'], 1),
    gruta_cidade: CV('cidade', 'Galerias sob as Pontes', '#6a6a80', ['ferro', 'prata'], ['rato_gigante', 'bandido', 'cultista'], 2),
    gruta_ruinas: CV('ruinas', 'Catacumbas Afogadas', '#6a6250', ['prata', 'ferro', 'cristal'], ['esqueleto', 'zumbi', 'carnical'], 3),
    gruta_costa: CV('costa', 'Caverna do Eco Marinho', '#3a6a7a', ['prata', 'cristal'], ['caranguejo_gigante', 'merrow', 'harpia'], 3),
    gruta_vazios: CV('vazios', 'Mina do Mercador Sumido', '#7a4a6a', ['prata', 'cristal'], ['mimico', 'quasit', 'doppelganger'], 4),
    gruta_abismo: CV('abismo', 'Fenda de Véspera', '#4a2a6a', ['obsidiana', 'cristal'], ['sombra', 'inumano', 'espectro'], 5),
    gruta_montanhas: CV('montanhas', 'Minas da Forja Celeste', '#7a5a3a', ['ferro', 'prata', 'cristal', 'obsidiana'], ['gargula', 'ogro', 'troll'], 6),
    gruta_astrolabio: CV('astrolabio', 'Gruta das Estrelas Caídas', '#4a4a8a', ['cristal', 'prata', 'obsidiana'], ['gargula', 'fogo_fatuo', 'diabrete'], 6),
    gruta_jardins: CV('jardins', 'Caverna das Raízes Douradas', '#7a6a3a', ['cristal', 'prata'], ['arvore_desperta', 'driade', 'satiro'], 7),
  };
  for (const [id, c] of Object.entries(WD.CAVES)) { E.M.BY_REGION[id] = c.mons; WD.REGIONS[c.parent].caveId = id; }
  E.L.ORE_BY_BIOME.cave = ['ferro', 'prata'];
  // região "de verdade" (as grutas pertencem à região de fora)
  WD.reg = (id) => WD.REGIONS[id] || WD.CAVES[id] || null;
  WD.home = (id) => (WD.CAVES[id] ? WD.CAVES[id].parent : id);

  // ---------------------------------------------------------------- NPCs novos
  const N = (id, region, o) => { WD.NPCS[id] = o; if (!WD.REGIONS[region].npcs.includes(id)) WD.REGIONS[region].npcs.push(id); o.region = region; };
  N('dende', 'aurenna', { name: 'Mestre Dendê', title: 'Pescador da Baía de Todos os Mares', fisher: true, pos: { x: -7, z: 39 }, look: { skin: '#6e432c', hair: '#e8e8e8', outfit: '#f2c43a' },
    lines: ['Ô, meu rei! Chegue mais, chegue. Aqui a maré é mansa e o peixe é arretado de bom!', 'Oxente, vai pescar de mão abanando? Pegue uma isca, pelo amor de Deus.', 'Na Baía de Todos os Mares a gente diz: peixe grande não tem pressa. Nem pescador bom.', 'Ó paí, ó! Cada canto de Elarion tem um peixe lendário. Já pegou algum? É barril dobrado!'],
    chain: 'dende' });
  N('bruna', 'bosque', { name: 'Bruna Picareta', title: 'Mineira da Gruta das Raízes', miner: true, nearCave: true, look: { skin: '#c98d68', hair: '#c84b3a', outfit: '#8a5a32' },
    lines: ['Quer minério? Picareta na mão e coragem no peito. A gruta é logo ali.', 'Sem picareta não se tira nem pedrinha. Eu vendo, eu compro o que você trouxer, eu ensino.', 'Ferro é o começo. Prata lá no fundo. Cristal… só com picareta boa.'],
    chain: 'bruna' });
  N('benedito', 'bosque', { name: 'Tio Benedito', title: 'Lenhador Aposentado', look: { skin: '#e3b892', hair: '#d8d8d8', outfit: '#5f8a4a' },
    lines: ['No meu tempo, as lanternas do bosque nunca apagavam.', 'As aranhas estão tecendo teia nas trilhas de novo. Que coisa…', 'Um dia eu corri as lanternas todas antes do sino tocar. Será que você consegue?'],
    chain: 'benedito' });
  N('lia', 'bosque', { name: 'Lia Vaga-lume', title: 'Menina das Luzes', look: { skin: '#f6dcc4', hair: '#ffcf5a', outfit: '#9fe3ff' },
    lines: ['Você viu os Lumes? São as luzinhas que flutuam pelo bosque! Alguns ficam alto — tem que pular!', 'Se juntar Lumes e levar para a estátua, ela agradece com presentes!'],
    chain: 'lia' });
  N('ines', 'bosque', { name: 'Inês do Arco', title: 'Caçadora das Trilhas', look: { skin: '#a8694a', hair: '#2a1f1a', outfit: '#3f7a4a' },
    lines: ['Rastros de lobo por toda parte. O Lobo-Rei voltou a uivar.', 'Caçar não é só matar: é saber quando parar.'],
    chain: 'ines' });
  N('celeste', 'cidade', { name: 'Irmã Celeste', title: 'Curandeira do Templo', look: { skin: '#f0d8c0', hair: '#5a3a22', outfit: '#f2ead0' },
    lines: ['Os feridos das pontes chegam todo dia. Poção nunca é demais.', 'Quem cura também precisa de cuidado, sabia?'],
    chain: 'celeste' });
  N('ze_carteiro', 'cidade', { name: 'Zé das Cartas', title: 'Carteiro das Sete Pontes', look: { skin: '#c98d68', hair: '#2a2a34', outfit: '#3a62a8' },
    lines: ['Carta pra todo canto de Elarion e só eu pra entregar! Me dá uma mão?', 'Já atravessei as sete pontes trezentas vezes hoje. Ou foram sete vezes trezentas?'],
    chain: 'ze' });
  N('vera', 'ruinas', { name: 'Vera Pá-e-Pincel', title: 'Arqueóloga', look: { skin: '#e3b892', hair: '#8a5a32', outfit: '#c8a878' },
    lines: ['Cada pedra daqui é uma página de história. Cuidado onde pisa!', 'Dizem que o Arquileitor era o bibliotecário-chefe. Agora é uma múmia — e não gosta de visitas.'],
    chain: 'vera' });
  N('osvaldo', 'ruinas', { name: 'Osvaldo', title: 'Coveiro Insone', look: { skin: '#c9c9d6', hair: '#3a3a44', outfit: '#4a4a5a' },
    lines: ['Os mortos das catacumbas não querem ficar deitados. E eu não durmo há dez anos.', 'Pá, lanterna e paciência. É só disso que um coveiro precisa.'],
    chain: 'osvaldo' });
  N('tavinho', 'costa', { name: 'Tavinho Maré-Mansa', title: 'Marujo', look: { skin: '#6e432c', hair: '#1a1a22', outfit: '#3f7a9a' },
    lines: ['O mar violeta tem peixe que brilha no escuro! Quer aprender a pescar de verdade?', 'Meu avô dizia: quem tem vara boa não volta de mão vazia.'],
    chain: 'tavinho' });
  N('dora', 'costa', { name: 'Dora do Farol', title: 'Faroleira', look: { skin: '#e3b892', hair: '#e8e8e8', outfit: '#d9573b' },
    lines: ['As harpias quebraram a lente do farol de novo!', 'Daqui de cima eu vejo cada navio, cada ilha e cada baleia.'],
    chain: 'dora' });
  N('lua_cambista', 'vazios', { name: 'Lua Cambista', title: 'Trocadora de Moedas', look: { skin: '#f6e1cf', hair: '#5b2340', outfit: '#d4af37' },
    lines: ['Compro barato, vendo caro, durmo tranquila.', 'Uma moeda bem trocada vale duas. Quer aprender?'],
    chain: 'lua' });
  N('penitente', 'abismo', { name: 'O Penitente', title: 'Peregrino da Véspera', look: { skin: '#5a4a68', hair: '#c8a8ff', outfit: '#2a1a3a' },
    lines: ['Eu carrego as dúvidas dos outros. Pesam menos do que as minhas.', 'As sombras daqui aprendem o seu nome se você ficar parado.'],
    chain: 'penitente' });
  N('grim', 'montanhas', { name: 'Grim Barba-de-Ferro', title: 'Minerador Anão', miner: true, nearCave: true, look: { skin: '#c98d68', hair: '#c84b3a', outfit: '#5a4630' },
    lines: ['As Minas da Forja Celeste têm de tudo — até obsidiana viva. Mas só com picareta rúnica!', 'Eu compro minério de qualquer um. Pago justo. Bem… quase justo.'],
    chain: 'grim' });
  N('orion', 'astrolabio', { name: 'Órion', title: 'Aprendiz de Astrônomo', look: { skin: '#7c6a8f', hair: '#fff6c8', outfit: '#3b3f6e' },
    lines: ['Os Lumes daqui são estrelinhas que caíram. Ajudo a Tessera a contá-las.', 'Se o céu está em reverso, será que eu estou de cabeça para baixo?'],
    chain: 'orion' });
  N('rosa', 'jardins', { name: 'Rosa', title: 'Abelheira dos Jardins', look: { skin: '#e2b896', hair: '#5a3a22', outfit: '#ffcf5a' },
    lines: ['As abelhas daqui fazem mel de pétala-solar. É o mais doce de Elarion!', 'Uma flor por dia, uma abelha feliz.'],
    chain: 'rosa' });

  // ---------------------------------------------------------------- missões em cadeia
  // goal.ev: kill (target, n, region) · gather (target, n) · fish (n, minR, region) · ore (n) · oreSold (n) · pick (tier, estado)
  //          chest (n, region) · cook · craft · profit (n = ouro) · visit (region) · lume (n) · challenge (region) · domain (n)
  //          dex (n, estado) · legend (n, estado) · aqua (n, estado) · boss (key) · deliver (item, n — entrega o item)
  CT.CHAINS = {
    dende: { title: 'O Pescador da Baía', steps: [
      { title: 'Primeira Rede', text: 'Pesque 3 peixes, de qualquer tamanho. Peixe pequeno também é peixe, meu rei!', goal: { ev: 'fish', n: 3 }, reward: { gold: 60, gems: 60, bait: 5, adv: 80 }, done: 'Ê, beleza! Leve essas iscas. Minhoca de primeira, da Baía!' },
      { title: 'Moqueca de Respeito', text: 'Traga 2 peixes ★3 ou mais. Vou te ensinar a moqueca da minha mainha.', goal: { ev: 'fish', n: 2, minR: 3 }, reward: { gold: 120, gems: 80, recipe: 'moqueca_baiana', adv: 120 }, done: 'Agora você sabe fazer a Moqueca Baiana. Com dendê, viu? Sem dendê é ensopado!' },
      { title: 'Os Bichos de Cada Canto', text: 'Registre 15 espécies diferentes no Pescadex. Cada canto de Elarion tem seu peixe.', goal: { ev: 'dex', n: 15 }, reward: { gems: 150, escama: 4, lbait: 2, adv: 200 }, done: 'Arretado! Tome essas Escamas Iridescentes — os ferreiros usam pra ascender arma. E duas Iscas Lendárias!' },
      { title: 'O Peixe da Lenda', text: 'Pesque um peixe LENDÁRIO de qualquer região. Use a Isca Lendária e respeite a hora dele.', goal: { ev: 'legend', n: 1 }, reward: { gems: 250, weapon: 'fisgada', escama: 4, adv: 300 }, done: 'Ó paí, ó! Você é dos meus! Leve A Fisgada — a lança que meu pai fez com o arpão dele.' },
      { title: 'Mestre dos Sete Mares', text: 'Pesque 4 peixes lendários diferentes e doe 10 peixes para o Aquário.', goal: { ev: 'legend', n: 4, aqua: 10 }, reward: { gems: 500, rod: 4, escama: 8, lbait: 3, adv: 500, title: 'Mestre dos Sete Mares', outfit: 'mestre_pescador' }, done: 'Agora você é mestre. Fique com a minha vara de dendê — e com a roupa de mestre, que pescador de respeito anda alinhado. Ela já sabe onde o peixe está!' },
    ] },
    bruna: { title: 'Picareta na Mão', steps: [
      { title: 'Ferramenta de Trabalho', text: 'Compre uma Picareta de Ferro (comigo mesmo!).', goal: { ev: 'pick', tier: 1 }, reward: { gold: 40, adv: 60 }, done: 'Agora sim parece mineira de verdade.' },
      { title: 'A Gruta das Raízes', text: 'Entre na Gruta das Raízes e minere 5 vezes.', goal: { ev: 'ore', n: 5 }, reward: { gold: 80, gems: 60, ores: { ferro: 3 }, adv: 120 }, done: 'Mãos sujas, bolso cheio! Bom trabalho.' },
      { title: 'Negócio Honesto', text: 'Venda 6 minérios para um ferreiro (eu compro!).', goal: { ev: 'oreSold', n: 6 }, reward: { gold: 100, gems: 80, frags: { frag1: 3 }, adv: 150 }, done: 'Com minério vendido você compra picareta melhor. É assim que se cresce.' },
      { title: 'Prata no Fundo', text: 'Compre a Picareta de Aço e traga 3 Pratas Lunares (minere no fundo da gruta).', goal: { ev: 'pick', tier: 2, deliverOre: { prata: 3 } }, reward: { gold: 300, gems: 120, frags: { frag2: 2 }, escama: 1, adv: 250 }, done: 'Prata Lunar! Agora você é das minhas.' },
    ] },
    benedito: { title: 'As Lanternas do Bosque', steps: [
      { title: 'Teias nas Trilhas', text: 'Derrote 2 Aranhas Gigantes no Bosque.', goal: { ev: 'kill', target: 'aranha_gigante', n: 2 }, reward: { gold: 70, gems: 50, adv: 100 }, done: 'As trilhas agradecem. E meus joelhos também.' },
      { title: 'Óleo para as Lanternas', text: 'Colete 3 Ervas-lanterna.', goal: { ev: 'gather', target: 'Erva-lanterna', n: 3 }, reward: { gold: 50, gems: 40, items: { pocao_cura: 2 }, adv: 80 }, done: 'Com isso as lanternas aguentam mais um inverno.' },
      { title: 'A Corrida das Lanternas', text: 'Toque o sino do altar e passe pelas lanternas antes do tempo acabar.', goal: { ev: 'challenge', region: 'bosque' }, reward: { gold: 120, gems: 120, adv: 200 }, done: 'Mais rápido que eu na sua idade! Tome, você mereceu.' },
    ] },
    lia: { title: 'Luzinhas Perdidas', steps: [
      { title: 'Cinco Lumes', text: 'Encontre 5 Lumes no Bosque (as luzes que flutuam; algumas só pulando).', goal: { ev: 'lume', n: 5, region: 'bosque' }, reward: { gems: 80, adv: 100 }, done: 'Que lindo! Agora ofereça os Lumes na estátua de teleporte.' },
      { title: 'Todas as Luzes', text: 'Encontre todos os 10 Lumes do Bosque.', goal: { ev: 'lume', n: 10, region: 'bosque' }, reward: { gems: 200, gold: 100, adv: 200 }, done: 'O bosque está todinho aceso! Obrigada!' },
    ] },
    ines: { title: 'A Matilha Azul', steps: [
      { title: 'Pegadas', text: 'Derrote 4 lobos no Bosque.', goal: { ev: 'kill', target: 'lobo', n: 4 }, reward: { gold: 60, gems: 50, adv: 100 }, done: 'Boa caçada.' },
      { title: 'O Maior da Matilha', text: 'Derrote um Lobo Atroz.', goal: { ev: 'kill', target: 'lobo_atroz', n: 1 }, reward: { gold: 100, gems: 80, adv: 150 }, done: 'Esse era do tamanho de um cavalo!' },
      { title: 'O Lobo-Rei', text: 'Derrote o Lobo Invernal no covil do Bosque.', goal: { ev: 'boss', key: 'rei_lanterna' }, reward: { gold: 250, gems: 200, frags: { frag1: 4, frag2: 1 }, adv: 300 }, done: 'O uivo azul finalmente silenciou. Você é uma lenda das trilhas.' },
    ] },
    celeste: { title: 'Mãos que Curam', steps: [
      { title: 'Estoque do Templo', text: 'Entregue 2 Poções de Cura.', goal: { ev: 'deliver', item: 'pocao_cura', n: 2 }, reward: { gold: 80, gems: 60, adv: 100 }, done: 'Que a luz te proteja, como você protege os outros.' },
      { title: 'Lírios da Lua', text: 'Colete 4 Lírios-lunares.', goal: { ev: 'gather', target: 'Lírio-lunar', n: 4 }, reward: { gold: 60, gems: 60, items: { pocao_maior: 1 }, adv: 100 }, done: 'Vou fazer um chá para os feridos.' },
      { title: 'Alquimista Aprendiz', text: 'Fabrique 2 itens de alquimia ou forja.', goal: { ev: 'craft', n: 2 }, reward: { gold: 120, gems: 100, adv: 150 }, done: 'Você tem mãos de curandeira!' },
    ] },
    ze: { title: 'Correio Expresso', steps: [
      { title: 'Carta para o Bosque', text: 'Leve a carta até o Bosque das Lanternas.', goal: { ev: 'visit', region: 'bosque' }, reward: { gold: 40, gems: 40, adv: 60 }, done: 'Entregue! Próxima…' },
      { title: 'Carta para a Costa', text: 'Leve a carta até a Costa das Baleias de Vidro.', goal: { ev: 'visit', region: 'costa' }, reward: { gold: 80, gems: 60, adv: 100 }, done: 'A Capitã Lys vai adorar a carta da mãe dela.' },
      { title: 'Carta para as Montanhas', text: 'Leve a carta até as Montanhas da Forja Celeste.', goal: { ev: 'visit', region: 'montanhas' }, reward: { gold: 150, gems: 120, adv: 200 }, done: 'A Mestra Forgem nem acreditou. Você é o carteiro mais rápido de Elarion!' },
    ] },
    vera: { title: 'Escavação Arriscada', steps: [
      { title: 'Relíquias Escondidas', text: 'Abra 2 baús nas Ruínas da Aurora Afogada.', goal: { ev: 'chest', n: 2, region: 'ruinas' }, reward: { gold: 80, gems: 80, adv: 120 }, done: 'Cerâmica do Primeiro Crepúsculo! Inestimável!' },
      { title: 'As Catacumbas', text: 'Derrote 3 esqueletos (dentro ou fora das Catacumbas Afogadas).', goal: { ev: 'kill', target: 'esqueleto', n: 3 }, reward: { gold: 100, gems: 80, adv: 150 }, done: 'Ossos no lugar, finalmente.' },
      { title: 'O Arquileitor', text: 'Derrote a Múmia do covil das Ruínas.', goal: { ev: 'boss', key: 'arquileitor' }, reward: { gold: 300, gems: 200, frags: { frag2: 3 }, adv: 300 }, done: 'O bibliotecário descansa. A biblioteca é nossa!' },
    ] },
    osvaldo: { title: 'Insônia', steps: [
      { title: 'Mortos Andarilhos', text: 'Derrote 3 zumbis.', goal: { ev: 'kill', target: 'zumbi', n: 3 }, reward: { gold: 90, gems: 70, adv: 120 }, done: 'Hoje eu durmo. Talvez.' },
      { title: 'Fome de Carniçal', text: 'Derrote 2 carniçais.', goal: { ev: 'kill', target: 'carnical', n: 2 }, reward: { gold: 140, gems: 100, items: { antitoxina: 2 }, adv: 160 }, done: 'Silêncio no cemitério. Que coisa linda.' },
    ] },
    tavinho: { title: 'Lições de Marujo', steps: [
      { title: 'Rede da Costa', text: 'Pesque 4 peixes na Costa.', goal: { ev: 'fish', n: 4, region: 'costa' }, reward: { gold: 80, gems: 60, bait: 5, adv: 100 }, done: 'Leva jeito, hein!' },
      { title: 'A Arraia Violeta', text: 'Pesque um peixe ★4 ou mais.', goal: { ev: 'fish', n: 1, minR: 4 }, reward: { gold: 200, gems: 120, escama: 2, adv: 200 }, done: 'Isso aí meu avô ia querer ver!' },
    ] },
    dora: { title: 'A Luz do Farol', steps: [
      { title: 'Harpias no Farol', text: 'Derrote 2 harpias.', goal: { ev: 'kill', target: 'harpia', n: 2 }, reward: { gold: 100, gems: 80, adv: 140 }, done: 'O canto delas me dava dor de cabeça.' },
      { title: 'Lente Nova', text: 'Entregue 2 Pratas Lunares para a lente do farol.', goal: { ev: 'deliverOre', ore: 'prata', n: 2 }, reward: { gold: 160, gems: 120, frags: { frag2: 2 }, adv: 180 }, done: 'O farol brilha de novo! Os navios agradecem.' },
    ] },
    lua: { title: 'Câmbio Negro', steps: [
      { title: 'Lucro Rápido', text: 'Lucre 300 po comerciando mercadorias.', goal: { ev: 'profit', n: 300 }, reward: { gold: 150, gems: 100, adv: 150 }, done: 'Você tem faro para negócio.' },
      { title: 'Grande Negócio', text: 'Lucre mais 1.500 po.', goal: { ev: 'profit', n: 1500 }, reward: { gold: 500, gems: 200, adv: 300 }, done: 'Magnata em formação!' },
    ] },
    penitente: { title: 'O Peso das Dúvidas', steps: [
      { title: 'Sombras Famintas', text: 'Derrote 3 sombras.', goal: { ev: 'kill', target: 'sombra', n: 3 }, reward: { gold: 150, gems: 100, adv: 180 }, done: 'Uma dúvida a menos.' },
      { title: 'Domínio das Sombras', text: 'Complete 1 Domínio (em qualquer região).', goal: { ev: 'domain', n: 1 }, reward: { gold: 200, gems: 150, frags: { frag3: 2 }, adv: 250 }, done: 'Você não teme o que espera nos domínios. Admirável.' },
    ] },
    grim: { title: 'Coração de Pedra', steps: [
      { title: 'Picareta de Mithral', text: 'Tenha a Picareta de Mithral.', goal: { ev: 'pick', tier: 3 }, reward: { gold: 300, gems: 120, adv: 200 }, done: 'Agora sim, uma ferramenta de respeito.' },
      { title: 'Veio de Cristal', text: 'Minere 8 vezes (cristal brilha nas Minas da Forja Celeste).', goal: { ev: 'ore', n: 8 }, reward: { gold: 300, gems: 150, frags: { frag3: 2 }, escama: 2, adv: 250 }, done: 'Cristal Estelar! Isso vale mais que ouro.' },
      { title: 'Obsidiana Viva', text: 'Tenha a Picareta Rúnica.', goal: { ev: 'pick', tier: 4 }, reward: { gold: 800, gems: 300, frags: { frag4: 2 }, adv: 400 }, done: 'Até eu tenho inveja dessa picareta!' },
    ] },
    orion: { title: 'Estrelas Caídas', steps: [
      { title: 'Poeira de Estrela', text: 'Colete 4 Poeiras-estelares.', goal: { ev: 'gather', target: 'Poeira-estelar', n: 4 }, reward: { gold: 120, gems: 100, adv: 160 }, done: 'A Tessera vai ficar orgulhosa!' },
      { title: 'Lumes Estelares', text: 'Encontre 6 Lumes no Observatório dos Nomes.', goal: { ev: 'lume', n: 6, region: 'astrolabio' }, reward: { gold: 200, gems: 160, adv: 220 }, done: 'Cada Lume é uma estrela de volta ao céu.' },
    ] },
    rosa: { title: 'Mel do Último Sol', steps: [
      { title: 'Pétalas', text: 'Colete 4 Pétalas-solares.', goal: { ev: 'gather', target: 'Pétala-solar', n: 4 }, reward: { gold: 140, gems: 100, adv: 160 }, done: 'As abelhas vão fazer festa!' },
      { title: 'Chef dos Jardins', text: 'Cozinhe 3 pratos.', goal: { ev: 'cook', n: 3 }, reward: { gold: 200, gems: 150, adv: 220 }, done: 'Com mel, fica ainda melhor!' },
    ] },
  };

  // ---------------------------------------------------------------- Lumes, Corridas e Domínios
  CT.LUMES_PER_REGION = 10;
  CT.LUME_OFFER = [ // oferendas na estátua de teleporte (a cada Lume entregue o nível sobe)
    { n: 3, gems: 60, adv: 60 }, { n: 6, gems: 100, gold: 100, adv: 100 }, { n: 10, gems: 160, frags: { frag1: 2 }, adv: 150 },
  ];
  CT.CHALLENGE = { rings: 6, time: 45, reward: { gems: 60, gold: 80, adv: 60 } };
  CT.DOMAIN = { waves: 2, perDay: 3, reward: { adv: 150, gold: 150 } };
  // tier do Fragmento conforme o nível do herói
  CT.domainTier = (lvl) => (lvl <= 3 ? 1 : lvl <= 5 ? 2 : lvl <= 8 ? 3 : 4);

  // receita exclusiva do Mestre Dendê
  E.L.RECIPES.cozinha.push({ id: 'moqueca_baiana', name: 'Moqueca Baiana do Dendê', icon: '🥘', buff: 'pescador', mins: 60, need: { fish: 2, fishR: 1, 'Alga-de-vidro': 1 }, gold: 20, locked: true, desc: 'Receita da mainha do Mestre Dendê: Faro de Pescador por 1 hora e o peixe ainda vem sorrindo.' });

  // arma exclusiva da missão do pescador (inspirada na lança dos pescadores)
  E.W.CATALOG.fisgada = { name: 'A Fisgada', type: 'haste', rarity: 4, base: 'tridente', exclusive: true,
    passive: { name: 'Maré Favorável', kind: 'extra', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], dtype: 'perfurante', init: 2, desc: '+2 na Iniciativa. Uma vez por turno, +{v} ao acertar. (Refine com cópias trocadas com o Mestre Dendê.)' },
    lore: 'O arpão do pai do Mestre Dendê, encabado de novo. Ainda cheira a maresia e a moqueca.', art: { c1: '#9fe3ff', c2: '#f2c43a', v: 1 } };

  E.CT = CT;
})();
