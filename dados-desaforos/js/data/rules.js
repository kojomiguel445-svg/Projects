/* Regras centrais D&D 5.5 (2024) — baseadas no SRD 5.2 (CC-BY-4.0) e no Livro do Jogador 2024. */
(() => {
  const R = {};

  R.ABILITIES = [
    { id: 'for', name: 'Força', short: 'FOR' },
    { id: 'des', name: 'Destreza', short: 'DES' },
    { id: 'con', name: 'Constituição', short: 'CON' },
    { id: 'int', name: 'Inteligência', short: 'INT' },
    { id: 'sab', name: 'Sabedoria', short: 'SAB' },
    { id: 'car', name: 'Carisma', short: 'CAR' },
  ];
  R.AB = Object.fromEntries(R.ABILITIES.map((a) => [a.id, a]));

  R.SKILLS = {
    acrobacia: { name: 'Acrobacia', ab: 'des' },
    adestrar: { name: 'Adestrar Animais', ab: 'sab' },
    arcanismo: { name: 'Arcanismo', ab: 'int' },
    atletismo: { name: 'Atletismo', ab: 'for' },
    atuacao: { name: 'Atuação', ab: 'car' },
    enganacao: { name: 'Enganação', ab: 'car' },
    furtividade: { name: 'Furtividade', ab: 'des' },
    historia: { name: 'História', ab: 'int' },
    intimidacao: { name: 'Intimidação', ab: 'car' },
    intuicao: { name: 'Intuição', ab: 'sab' },
    investigacao: { name: 'Investigação', ab: 'int' },
    medicina: { name: 'Medicina', ab: 'sab' },
    natureza: { name: 'Natureza', ab: 'int' },
    percepcao: { name: 'Percepção', ab: 'sab' },
    persuasao: { name: 'Persuasão', ab: 'car' },
    prestidigitacao: { name: 'Prestidigitação', ab: 'des' },
    religiao: { name: 'Religião', ab: 'int' },
    sobrevivencia: { name: 'Sobrevivência', ab: 'sab' },
  };

  R.STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
  R.POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  R.POINT_BUY_TOTAL = 27;

  R.MAX_LEVEL = 10;
  // XP necessário para alcançar cada nível (LdJ 2024)
  R.XP_TABLE = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000];
  R.profBonus = (level) => 2 + Math.floor((level - 1) / 4);

  // XP por Nível de Desafio
  R.CR_XP = { 0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900 };
  R.crLabel = (cr) => (cr === 0.125 ? '1/8' : cr === 0.25 ? '1/4' : cr === 0.5 ? '1/2' : String(cr));

  // Orçamento de XP por personagem (Livro do Mestre 2024): baixa / moderada / alta
  R.ENCOUNTER_BUDGET = {
    1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100],
    6: [600, 1000, 1400], 7: [750, 1300, 1700], 8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100],
  };

  // Tipos de dano com cores de "elemento" para os números de dano
  R.DAMAGE = {
    cortante: { name: 'Cortante', color: '#f2f2f2', icon: '⚔' },
    perfurante: { name: 'Perfurante', color: '#f2f2f2', icon: '➶' },
    concussao: { name: 'Concussão', color: '#f2f2f2', icon: '✊' },
    fogo: { name: 'Fogo', color: '#ff9a52', icon: '🔥' },
    frio: { name: 'Frio', color: '#9de7ff', icon: '❄' },
    eletrico: { name: 'Elétrico', color: '#d39bff', icon: '⚡' },
    trovejante: { name: 'Trovejante', color: '#7fb0ff', icon: '♒' },
    acido: { name: 'Ácido', color: '#b7f05a', icon: '☣' },
    veneno: { name: 'Veneno', color: '#6ee08a', icon: '☠' },
    radiante: { name: 'Radiante', color: '#ffe08a', icon: '☀' },
    necrotico: { name: 'Necrótico', color: '#9be3b8', icon: '☾' },
    psiquico: { name: 'Psíquico', color: '#ff9ad5', icon: '✺' },
    energia: { name: 'Energia', color: '#c6b4ff', icon: '✦' },
  };

  R.CONDITIONS = {
    enfeiticado: { name: 'Enfeitiçado', desc: 'Não pode atacar quem o enfeitiçou nem alvejá-lo com habilidades ou efeitos mágicos nocivos. Quem o enfeitiçou tem Vantagem nos testes de atributo para interagir socialmente com ele.' }, // SRD 5.2.1 p178, Charmed
    caido: { name: 'Caído', desc: 'Ataques corpo a corpo contra ele têm Vantagem; seus ataques têm Desvantagem. Levanta-se gastando movimento.' },
    envenenado: { name: 'Envenenado', desc: 'Desvantagem em jogadas de ataque e testes de atributo.' },
    amedrontado: { name: 'Amedrontado', desc: 'Desvantagem em ataques e testes enquanto a fonte do medo estiver à vista.' },
    contido: { name: 'Contido', desc: 'Ataques contra ele têm Vantagem; seus ataques têm Desvantagem.' },
    paralisado: { name: 'Paralisado', desc: 'Incapacitado. Ataques têm Vantagem e acertos a 1,5 m são Críticos.' },
    atordoado: { name: 'Atordoado', desc: 'Incapacitado. Ataques contra ele têm Vantagem.' },
    agarrado: { name: 'Agarrado', desc: 'Deslocamento 0; Desvantagem para atacar alvos que não sejam quem o agarra.' },
    cego: { name: 'Cego', desc: 'Seus ataques têm Desvantagem; ataques contra ele têm Vantagem.' },
    incapacitado: { name: 'Incapacitado', desc: 'Não pode realizar ações, ações bônus ou reações.' },
    lento: { name: 'Lento', desc: 'Deslocamento reduzido em 3 m (Maestria Lentidão).' },
    enfraquecido: { name: 'Enfraquecido', desc: 'Desvantagem na próxima jogada de ataque (Maestria Enfraquecer).' },
    marcado: { name: 'Marcado', desc: 'Sofre dano extra dos ataques de quem o marcou.' },
    abencoado: { name: 'Abençoado', desc: '+1d4 em jogadas de ataque e testes de resistência.' },
    iluminado: { name: 'Iluminado', desc: 'O próximo ataque contra ele tem Vantagem (Raio Guia).' },
    esquivando: { name: 'Esquivando', desc: 'Ataques contra ele têm Desvantagem; Vantagem em resistências de Destreza.' },
    furia: { name: 'Fúria', desc: 'Dano extra com Força, Resistência a dano Cortante, Perfurante e de Concussão.' },
    adormecido: { name: 'Inconsciente', desc: 'Incapacitado e sem percepção dos arredores. Ataques contra ele têm Vantagem; falha automaticamente em resistências de FOR e DES. A duração e as formas de despertar dependem do efeito.' }, // SRD 5.2.1 p191, Unconscious
    banido: { name: 'Banido', desc: 'Enviado a outro plano enquanto durar a Concentração.' },
    atormentado: { name: 'Atormentado', desc: 'O próximo ataque contra ele tem Vantagem (Maestria Atormentar).' },
    perdicao: { name: 'Perdição', desc: 'Subtrai 1d4 das jogadas de ataque e dos testes de resistência.' },
    lentificado: { name: 'Lentificado', desc: '−2 na CA e só um ataque por turno (magia Lentidão).' },
    mistico: { name: 'Mente Abalada', desc: 'Desvantagem no próximo TR contra as suas magias.' },
    iluminado_conc: { name: 'Delineado', desc: 'Todos os ataques contra ele têm Vantagem enquanto durar o efeito (Fogo das Fadas / Golpe Brilhante).' },
    empurrado: { name: 'Empurrado', desc: 'Afastado 3 m (Maestria Empurrar): fugir dele é automático neste turno.' },
  };

  // ---------- Armaduras ----------
  R.ARMOR = {
    nenhuma: { name: 'Sem armadura', base: 10, dex: 99, type: 'none' },
    acolchoada: { name: 'Acolchoada', base: 11, dex: 99, type: 'leve', stealthDis: true },
    couro: { name: 'Couro', base: 11, dex: 99, type: 'leve' },
    couro_batido: { name: 'Couro Batido', base: 12, dex: 99, type: 'leve' },
    gibao: { name: 'Gibão de Peles', base: 12, dex: 2, type: 'media' },
    camisao: { name: 'Camisão de Malha', base: 13, dex: 2, type: 'media' },
    brunea: { name: 'Brunea', base: 14, dex: 2, type: 'media', stealthDis: true },
    peitoral: { name: 'Peitoral', base: 14, dex: 2, type: 'media' },
    meia: { name: 'Meia-Armadura', base: 15, dex: 2, type: 'media', stealthDis: true },
    cota: { name: 'Cota de Malha', base: 16, dex: 0, type: 'pesada', str: 13, stealthDis: true },
    talas: { name: 'Cota de Talas', base: 17, dex: 0, type: 'pesada', str: 15, stealthDis: true },
    placas: { name: 'Armadura de Placas', base: 18, dex: 0, type: 'pesada', str: 15, stealthDis: true },
  };

  // ---------- Maestrias de arma (2024) ----------
  R.MASTERY = {
    trespassar: { name: 'Trespassar', en: 'Cleave', desc: 'Ao acertar, faça um segundo ataque contra outra criatura próxima (sem somar o modificador ao dano). 1×/turno.' },
    raspao: { name: 'Raspão', en: 'Graze', desc: 'Se errar o ataque, ainda causa dano igual ao modificador de atributo usado.' },
    agil: { name: 'Ágil', en: 'Nick', desc: 'O ataque extra da arma Leve faz parte da ação Atacar, sem gastar a Ação Bônus.' },
    empurrar: { name: 'Empurrar', en: 'Push', desc: 'Ao acertar, empurra o alvo 3 m para longe: ele perde a próxima investida e você foge com Vantagem.' },
    enfraquecer: { name: 'Enfraquecer', en: 'Sap', desc: 'Ao acertar, o alvo tem Desvantagem na próxima jogada de ataque.' },
    lentidao: { name: 'Lentidão', en: 'Slow', desc: 'Ao acertar, o deslocamento do alvo cai 3 m; fugir dele passa a ser automático.' },
    derrubar: { name: 'Derrubar', en: 'Topple', desc: 'Ao acertar, o alvo faz TR de Constituição (CD 8 + mod + BP) ou fica Caído.' },
    atormentar: { name: 'Atormentar', en: 'Vex', desc: 'Ao acertar, você tem Vantagem no próximo ataque contra o alvo.' },
  };

  // ---------- Armas base (LdJ 2024) ----------
  // cat: simples|marcial · kind: cac|dist · dmg: dado · type: tipo de dano
  R.WEAPONS = {
    // simples corpo a corpo
    clava: { name: 'Clava', cat: 'simples', kind: 'cac', dmg: '1d4', type: 'concussao', props: ['leve'], mastery: 'lentidao' },
    adaga: { name: 'Adaga', cat: 'simples', kind: 'cac', dmg: '1d4', type: 'perfurante', props: ['acuidade', 'leve', 'arremesso'], mastery: 'agil' },
    clava_grande: { name: 'Clava Grande', cat: 'simples', kind: 'cac', dmg: '1d8', type: 'concussao', props: ['duas_maos'], mastery: 'empurrar' },
    machadinha: { name: 'Machadinha', cat: 'simples', kind: 'cac', dmg: '1d6', type: 'cortante', props: ['leve', 'arremesso'], mastery: 'atormentar' },
    azagaia: { name: 'Azagaia', cat: 'simples', kind: 'cac', dmg: '1d6', type: 'perfurante', props: ['arremesso'], mastery: 'lentidao' },
    martelo_leve: { name: 'Martelo Leve', cat: 'simples', kind: 'cac', dmg: '1d4', type: 'concussao', props: ['leve', 'arremesso'], mastery: 'agil' },
    maca: { name: 'Maça', cat: 'simples', kind: 'cac', dmg: '1d6', type: 'concussao', props: [], mastery: 'enfraquecer' },
    bordao: { name: 'Bordão', cat: 'simples', kind: 'cac', dmg: '1d6', vers: '1d8', type: 'concussao', props: ['versatil'], mastery: 'derrubar' },
    foice_curta: { name: 'Foice Curta', cat: 'simples', kind: 'cac', dmg: '1d4', type: 'cortante', props: ['leve'], mastery: 'agil' },
    lanca: { name: 'Lança', cat: 'simples', kind: 'cac', dmg: '1d6', vers: '1d8', type: 'perfurante', props: ['arremesso', 'versatil'], mastery: 'enfraquecer' },
    // simples à distância
    dardo: { name: 'Dardo', cat: 'simples', kind: 'dist', dmg: '1d4', type: 'perfurante', props: ['acuidade', 'arremesso'], mastery: 'atormentar' },
    besta_leve: { name: 'Besta Leve', cat: 'simples', kind: 'dist', dmg: '1d8', type: 'perfurante', props: ['municao', 'recarga', 'duas_maos'], mastery: 'lentidao' },
    arco_curto: { name: 'Arco Curto', cat: 'simples', kind: 'dist', dmg: '1d6', type: 'perfurante', props: ['municao', 'duas_maos'], mastery: 'atormentar' },
    funda: { name: 'Funda', cat: 'simples', kind: 'dist', dmg: '1d4', type: 'concussao', props: ['municao'], mastery: 'lentidao' },
    // marciais corpo a corpo
    machado_batalha: { name: 'Machado de Batalha', cat: 'marcial', kind: 'cac', dmg: '1d8', vers: '1d10', type: 'cortante', props: ['versatil'], mastery: 'derrubar' },
    mangual: { name: 'Mangual', cat: 'marcial', kind: 'cac', dmg: '1d8', type: 'concussao', props: [], mastery: 'enfraquecer' },
    glaive: { name: 'Glaive', cat: 'marcial', kind: 'cac', dmg: '1d10', type: 'cortante', props: ['pesada', 'alcance', 'duas_maos'], mastery: 'raspao' },
    machado_grande: { name: 'Machado Grande', cat: 'marcial', kind: 'cac', dmg: '1d12', type: 'cortante', props: ['pesada', 'duas_maos'], mastery: 'trespassar' },
    espada_grande: { name: 'Espada Grande', cat: 'marcial', kind: 'cac', dmg: '2d6', type: 'cortante', props: ['pesada', 'duas_maos'], mastery: 'raspao' },
    alabarda: { name: 'Alabarda', cat: 'marcial', kind: 'cac', dmg: '1d10', type: 'cortante', props: ['pesada', 'alcance', 'duas_maos'], mastery: 'trespassar' },
    lanca_montaria: { name: 'Lança de Montaria', cat: 'marcial', kind: 'cac', dmg: '1d10', type: 'perfurante', props: ['pesada', 'alcance', 'duas_maos'], mastery: 'derrubar' },
    espada_longa: { name: 'Espada Longa', cat: 'marcial', kind: 'cac', dmg: '1d8', vers: '1d10', type: 'cortante', props: ['versatil'], mastery: 'enfraquecer' },
    malho: { name: 'Malho', cat: 'marcial', kind: 'cac', dmg: '2d6', type: 'concussao', props: ['pesada', 'duas_maos'], mastery: 'derrubar' },
    maca_estrela: { name: 'Maça-Estrela', cat: 'marcial', kind: 'cac', dmg: '1d8', type: 'perfurante', props: [], mastery: 'enfraquecer' },
    pique: { name: 'Pique', cat: 'marcial', kind: 'cac', dmg: '1d10', type: 'perfurante', props: ['pesada', 'alcance', 'duas_maos'], mastery: 'empurrar' },
    rapieira: { name: 'Rapieira', cat: 'marcial', kind: 'cac', dmg: '1d8', type: 'perfurante', props: ['acuidade'], mastery: 'atormentar' },
    cimitarra: { name: 'Cimitarra', cat: 'marcial', kind: 'cac', dmg: '1d6', type: 'cortante', props: ['acuidade', 'leve'], mastery: 'agil' },
    espada_curta: { name: 'Espada Curta', cat: 'marcial', kind: 'cac', dmg: '1d6', type: 'perfurante', props: ['acuidade', 'leve'], mastery: 'atormentar' },
    tridente: { name: 'Tridente', cat: 'marcial', kind: 'cac', dmg: '1d8', vers: '1d10', type: 'perfurante', props: ['arremesso', 'versatil'], mastery: 'derrubar' },
    martelo_guerra: { name: 'Martelo de Guerra', cat: 'marcial', kind: 'cac', dmg: '1d8', vers: '1d10', type: 'concussao', props: ['versatil'], mastery: 'empurrar' },
    picareta: { name: 'Picareta de Guerra', cat: 'marcial', kind: 'cac', dmg: '1d8', vers: '1d10', type: 'perfurante', props: ['versatil'], mastery: 'enfraquecer' },
    chicote: { name: 'Chicote', cat: 'marcial', kind: 'cac', dmg: '1d4', type: 'cortante', props: ['acuidade', 'alcance'], mastery: 'lentidao' },
    // marciais à distância
    besta_mao: { name: 'Besta de Mão', cat: 'marcial', kind: 'dist', dmg: '1d6', type: 'perfurante', props: ['municao', 'leve', 'recarga'], mastery: 'atormentar' },
    besta_pesada: { name: 'Besta Pesada', cat: 'marcial', kind: 'dist', dmg: '1d10', type: 'perfurante', props: ['municao', 'pesada', 'recarga', 'duas_maos'], mastery: 'empurrar' },
    arco_longo: { name: 'Arco Longo', cat: 'marcial', kind: 'dist', dmg: '1d8', type: 'perfurante', props: ['municao', 'pesada', 'duas_maos'], mastery: 'lentidao' },
    // ataque desarmado (usado por Monges e por quem não tem arma)
    desarmado: { name: 'Ataque Desarmado', cat: 'simples', kind: 'cac', dmg: '1', type: 'concussao', props: [], mastery: null },
  };

  R.PROP_NAMES = {
    acuidade: 'Acuidade', leve: 'Leve', arremesso: 'Arremesso', duas_maos: 'Duas Mãos', versatil: 'Versátil',
    municao: 'Munição', recarga: 'Recarga', pesada: 'Pesada', alcance: 'Alcance',
  };

  // Itens consumíveis
  R.ITEMS = {
    pocao_cura: { name: 'Poção de Cura', heal: '2d4+2', price: 50, rarity: 'Comum', desc: 'Recupera 2d4 + 2 PV. Beber é uma Ação Bônus.' },
    pocao_maior: { name: 'Poção de Cura Maior', heal: '4d4+4', price: 150, rarity: 'Incomum', desc: 'Recupera 4d4 + 4 PV. Beber é uma Ação Bônus.' },
    pocao_superior: { name: 'Poção de Cura Superior', heal: '8d4+8', price: 500, rarity: 'Rara', desc: 'Recupera 8d4 + 8 PV. Beber é uma Ação Bônus.' },
    fogo_alquimico: { name: 'Fogo Alquímico', price: 50, rarity: 'Comum', desc: 'Arremesso (Ação): TR de Destreza CD 10+DES+BP ou 1d4 de fogo e fica em chamas.' },
    antitoxina: { name: 'Antitoxina', price: 50, rarity: 'Comum', desc: 'Vantagem contra a condição Envenenado por 1 hora.' },
  };

  E.R = R;
})();
