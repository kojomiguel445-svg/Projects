/* Vida em Elarion — ofícios, peixes, mercadorias, minérios, receitas, contratos, diárias e conquistas. */
(() => {
  const L = {};

  // ------------------------------------------------------------ ofícios
  // cada ofício tem 10 níveis; títulos liberados nos níveis 1, 3, 6 e 10
  L.PROFS = {
    pesca: { name: 'Pesca', icon: '🎣', titles: ['Pescador de Domingo', 'Pescador', 'Mestre Pescador', 'Lenda dos Sete Mares'], perk: (lv) => `Zona de captura ${8 + lv * 3}% maior · peixes raros +${lv * 4}%` },
    comercio: { name: 'Comércio', icon: '⚖', titles: ['Mascate', 'Comerciante', 'Magnata', 'Barão das Sete Pontes'], perk: (lv) => `Compra ${(lv * 1.5).toFixed(1)}% mais barata · venda ${(lv * 1.5).toFixed(1)}% mais cara${lv >= 3 ? ' · Banca em Aurenna liberada' : ' · Banca no nível 3'}` },
    coleta: { name: 'Coleta', icon: '🌿', titles: ['Catador', 'Herbalista', 'Botânico', 'Voz das Raízes'], perk: (lv) => `${lv * 8}% de chance de colher em dobro` },
    mineracao: { name: 'Mineração', icon: '⛏', titles: ['Cavador', 'Mineiro', 'Mestre das Galerias', 'Coração de Pedra'], perk: (lv) => `${lv * 8}% de chance de minério extra · ${lv * 3}% de achar gema` },
    culinaria: { name: 'Culinária', icon: '🍲', titles: ['Ajudante de Cozinha', 'Cozinheiro', 'Chef', 'Paladar Lendário'], perk: (lv) => `Efeitos de comida duram +${lv * 10}%` },
    alquimia: { name: 'Alquimia', icon: '⚗', titles: ['Aprendiz de Alquimista', 'Alquimista', 'Mestre dos Frascos', 'Destilador de Estrelas'], perk: (lv) => `${lv * 6}% de chance de poção extra` },
    forja: { name: 'Forja', icon: '🔨', titles: ['Aprendiz de Ferreiro', 'Ferreiro', 'Mestre-Ferreiro', 'Martelo do Sol'], perk: (lv) => `${lv * 5}% de chance de economizar materiais` },
    jogatina: { name: 'Jogatina', icon: '🎰', titles: ['Curioso', 'Apostador', 'Tubarão das Mesas', 'Rei do Cassino'], perk: () => 'Só fama — a casa sempre ganha.' },
    gladiador: { name: 'Gladiador', icon: '🏟', titles: ['Novato da Areia', 'Gladiador', 'Campeão', 'Lenda da Arena'], perk: (lv) => `Recompensas da Arena +${lv * 6}%` },
    cacador: { name: 'Caça-Recompensas', icon: '🎯', titles: ['Rastreador', 'Caçador', 'Caçador de Elite', 'Terror das Fronteiras'], perk: (lv) => `Recompensas de contratos +${lv * 6}%` },
  };
  L.MAX_PROF = 10;
  L.profXpFor = (lv) => 60 * lv * lv; // XP total para chegar ao nível lv+1

  // ------------------------------------------------------------ peixes
  // [id, nome, raridade, cor1, cor2, preço, cm mín, cm máx, dificuldade 1-5, forma, descrição]
  const F = (id, name, r, c1, c2, price, min, max, diff, shape, desc) => ({ id, name, r, c1, c2, price, min, max, diff, shape, desc });
  L.FISH_BY_BIOME = {
    forest: [
      F('carpa_lanterna', 'Carpa-lanterna', 1, '#ffb347', '#ffe9a8', 8, 20, 45, 1, 'fish', 'Brilha fraquinho quando sonha.'),
      F('truta_musgo', 'Truta-de-musgo', 1, '#6f9a5a', '#c8e0a0', 10, 25, 50, 2, 'fish', 'Tem gosto de chuva na floresta.'),
      F('bagre_raiz', 'Bagre-raiz', 2, '#6b5a4a', '#a89070', 18, 30, 80, 2, 'fish', 'Os bigodes parecem raízes — e funcionam como raízes.'),
      F('peixe_vagalume', 'Peixe-vaga-lume', 3, '#2a4a6a', '#9fffd0', 45, 10, 20, 3, 'fish', 'Pequeno, rápido e cheio de luz.'),
      F('enguia_lanterna', 'Enguia da Lanterna Azul', 4, '#1a3a7a', '#8fe8ff', 120, 60, 140, 4, 'eel', 'Enrola-se nas lanternas submersas.'),
      F('koi_ancestral', 'Koi Ancestral', 5, '#fff6e0', '#ff5d3a', 400, 70, 120, 5, 'fish', 'Dizem que viu o bosque nascer.'),
    ],
    city: [
      F('sardinha_ponte', 'Sardinha-da-ponte', 1, '#a8b8c8', '#e8f0f8', 6, 10, 20, 1, 'fish', 'Vive em cardumes debaixo das sete pontes.'),
      F('tilapia_sineira', 'Tilápia-sineira', 1, '#c8a878', '#f0e0c0', 9, 20, 40, 1, 'fish', 'Faz "plim" quando pula.'),
      F('robalo_lunar', 'Robalo Lunar', 2, '#8a9ab8', '#e8ecff', 22, 30, 70, 2, 'fish', 'Prateado como as pedras de Lunária.'),
      F('peixe_moeda', 'Peixe-moeda', 3, '#d4af37', '#fff2b0', 60, 8, 18, 3, 'puffer', 'Engole moedas jogadas no canal. Literalmente vale ouro.'),
      F('lagosta_nobre', 'Lagosta Nobre', 4, '#c0392b', '#ffb38a', 140, 25, 50, 3, 'crab', 'Só aceita ser servida em prato de prata.'),
      F('esturjao_dourado', 'Esturjão Dourado', 5, '#e8b73a', '#fff6c8', 450, 90, 200, 5, 'fish', 'O peixe preferido dos banqueiros.'),
    ],
    ruins: [
      F('lambari_eco', 'Lambari-eco', 1, '#9aa0a8', '#d8dce0', 7, 8, 16, 1, 'fish', 'Repete o barulho do anzol.'),
      F('peixe_cinza', 'Peixe-cinza', 1, '#7a7a80', '#b8b8c0', 9, 20, 40, 2, 'fish', 'Coberto de cinzas do Primeiro Crepúsculo.'),
      F('peixe_osso', 'Peixe-osso', 2, '#e8e2d0', '#8a8370', 25, 20, 50, 2, 'fish', 'Nadou tanto que esqueceu a carne.'),
      F('raia_runa', 'Raia-de-runa', 3, '#4a5a6a', '#7fe8ff', 55, 40, 90, 3, 'ray', 'As runas nas costas mudam de lugar.'),
      F('enguia_fantasma', 'Enguia-fantasma', 4, '#c8d8f0', '#6bdcff', 130, 60, 130, 4, 'eel', 'Atravessa a rede. Às vezes, atravessa você.'),
      F('celacanto', 'Celacanto do Crepúsculo', 5, '#3a4a6a', '#ffd36b', 420, 100, 180, 5, 'fish', 'Fóssil vivo que ainda lembra do deus caído.'),
    ],
    coast: [
      F('cavalinha_violeta', 'Cavalinha-violeta', 1, '#8a6ab8', '#e0d0ff', 8, 20, 40, 1, 'fish', 'Fica violeta na maré violeta.'),
      F('linguado_vidro', 'Linguado-de-vidro', 1, '#bfe6ff', '#ffffff', 11, 20, 45, 2, 'ray', 'Transparente. Você vê o almoço dele.'),
      F('palhaco_real', 'Peixe-palhaço-real', 2, '#ff8a3a', '#ffffff', 24, 8, 16, 2, 'fish', 'Usa uma coroa de anêmona.'),
      F('agua_viva_lunar', 'Água-viva-lunar', 3, '#e0b8ff', '#ffffff', 50, 15, 40, 3, 'jelly', 'Brilha mais na lua cheia.'),
      F('polvo_contrabandista', 'Polvo-contrabandista', 4, '#c0392b', '#ffd36b', 135, 40, 110, 4, 'squid', 'Sempre tem algo escondido em um dos braços.'),
      F('baleia_vidro_ana', 'Baleia-de-vidro-anã', 5, '#7fd8ff', '#e8fbff', 480, 120, 260, 5, 'whale', 'Um filhote dos leviatãs que formam as ilhas.'),
    ],
    mountain: [
      F('truta_glacial', 'Truta-glacial', 1, '#9fc8e8', '#ffffff', 10, 25, 50, 2, 'fish', 'Gelada até depois de assada.'),
      F('peixe_forja', 'Peixe-forja', 2, '#5a5a62', '#ff9a52', 22, 20, 45, 2, 'fish', 'As escamas soltam faíscas.'),
      F('salmao_brasa', 'Salmão-de-brasa', 2, '#ff6a3c', '#ffd36b', 28, 40, 80, 3, 'fish', 'Sobe cachoeiras de lava.'),
      F('esturjao_gelo', 'Esturjão-de-gelo', 3, '#c8e6ff', '#7a9ab8', 65, 80, 160, 3, 'fish', 'Hiberna dentro de icebergs.'),
      F('enguia_magma', 'Enguia-de-magma', 4, '#2a1a1a', '#ff6a3c', 145, 60, 140, 4, 'eel', 'Não pegue com a mão.'),
      F('dragao_dagua', 'Dragão-d\'água Prateado', 5, '#d8dce8', '#9fe3ff', 500, 150, 300, 5, 'eel', 'Neto distante do Último Dragão Cinzento.'),
    ],
    astral: [
      F('peixe_cometa', 'Peixe-cometa', 2, '#6a74d0', '#fff6c8', 20, 15, 35, 2, 'fish', 'Deixa um rastro de luz.'),
      F('peixe_constelacao', 'Peixe-constelação', 2, '#2a2f6e', '#ffe9a8', 30, 20, 45, 3, 'fish', 'Cada pinta é uma estrela de verdade.'),
      F('arraia_nebulosa', 'Arraia-nebulosa', 3, '#7a5ae0', '#ff9ad5', 70, 50, 110, 3, 'ray', 'Nada no céu quando ninguém está olhando.'),
      F('agua_viva_estelar', 'Água-viva-estelar', 4, '#c6b4ff', '#ffffff', 150, 20, 60, 4, 'jelly', 'Uma pequena galáxia gelatinosa.'),
      F('leviata_bolso', 'Leviatã-de-Bolso', 5, '#1e1a50', '#bfa6ff', 520, 60, 120, 5, 'whale', 'Um universo inteiro do tamanho de um gato.'),
    ],
    market: [
      F('peixe_incenso', 'Peixe-de-incenso', 1, '#c8a0d8', '#ffe0c0', 9, 15, 30, 1, 'fish', 'Perfuma a água ao redor.'),
      F('linguado_feira', 'Linguado-de-feira', 1, '#b48e66', '#f0d8b8', 10, 20, 45, 2, 'ray', 'Sempre achatado de tanto barganhar.'),
      F('peixe_lembranca', 'Peixe-lembrança', 3, '#ff9ad5', '#ffffff', 60, 10, 25, 3, 'fish', 'Quem o come lembra de algo que esqueceu.'),
      F('mimico_anzol', 'Mímico-de-anzol', 4, '#8a5a2a', '#d4af37', 160, 30, 60, 4, 'puffer', 'Parece um baú. Morde como um baú.'),
      F('carpa_promessa', 'Carpa da Promessa', 5, '#ffcf5a', '#ff5d79', 480, 60, 110, 5, 'fish', 'Concede um desejo pequeno — e cobra um grande.'),
    ],
    garden: [
      F('peixe_petala', 'Peixe-pétala', 1, '#ff9ad5', '#ffe8f0', 9, 10, 25, 1, 'fish', 'Nada como uma flor caindo.'),
      F('carpa_sol', 'Carpa-sol', 2, '#ffd36b', '#ff9a3a', 24, 30, 70, 2, 'fish', 'Sempre de frente para o sol.'),
      F('peixe_polen', 'Peixe-pólen', 2, '#e8e070', '#ffffff', 26, 10, 20, 3, 'puffer', 'Espirra brilho.'),
      F('koi_aurora', 'Koi-aurora', 4, '#ffb8c8', '#7fe8ff', 150, 60, 110, 4, 'fish', 'Muda de cor a cada hora.'),
      F('peixe_ultimo_sol', 'Peixe-do-Último-Sol', 5, '#ffcf5a', '#ffffff', 520, 80, 140, 5, 'fish', 'Nada em direção ao fim do mundo — devagar.'),
    ],
    abyss: [
      F('peixe_sombra', 'Peixe-sombra', 2, '#2a2238', '#b07aff', 22, 15, 35, 2, 'fish', 'Só existe enquanto você não olha.'),
      F('tamboril_vazio', 'Tamboril-do-vazio', 3, '#1a1420', '#ffd36b', 75, 30, 70, 3, 'puffer', 'A lanterna dele atrai pescadores.'),
      F('enguia_duvida', 'Enguia-das-dúvidas', 4, '#3a2a48', '#ff5d79', 150, 70, 150, 4, 'eel', 'Tem certeza de que quer puxar?'),
      F('lula_coroa', 'Lula-coroa', 4, '#41235f', '#f9baff', 160, 50, 120, 4, 'squid', 'Usa uma coroa de nove tentáculos.'),
      F('rei_abissal', 'Rei Abissal', 5, '#0b0812', '#c07aff', 560, 150, 320, 5, 'whale', 'Mora onde a luz desiste.'),
    ],
  };
  L.FISH_BY_BIOME.metro = L.FISH_BY_BIOME.city;
  // peixes de cada lugar do mapa: um raro (★4) e um LENDÁRIO, que só existem naquela região.
  // when: 'noite' (19h–5h), 'dia' (6h–18h) ou qualquer hora. Os lendários pedem a Vara de Carvalho (ou melhor) ou a Isca Lendária.
  const RF = (region, id, name, r, c1, c2, price, min, max, diff, shape, desc, when) => ({ id, region, name, r, c1, c2, price, min, max, diff, shape, desc, when: when || null, legend: r >= 5 });
  L.FISH_REGION = {
    bosque: [RF('bosque', 'lanterna_viva', 'Peixe-Lanterna Azul', 4, '#1f4a8a', '#8fe8ff', 160, 25, 45, 3, 'fish', 'Carrega uma faísca da lamparina azul do coração do bosque.'),
      RF('bosque', 'guardiao_raizes', 'Guardião das Raízes', 5, '#4a3a22', '#9fffb0', 700, 120, 220, 5, 'eel', 'A raiz mais velha do bosque aprendeu a nadar. Só sai à noite.', 'noite')],
    cidade: [RF('cidade', 'carpa_sete_pontes', 'Carpa das Sete Pontes', 4, '#c8d0e0', '#ffcf5a', 170, 40, 80, 3, 'fish', 'Tem sete escamas douradas: uma para cada ponte de Lunária.'),
      RF('cidade', 'esturjao_lua_cheia', 'Esturjão da Lua Cheia', 5, '#e8ecff', '#9aa8d8', 720, 140, 260, 5, 'fish', 'Prateado como a lua — e só aparece sob ela.', 'noite')],
    aurenna: [RF('aurenna', 'peixe_ficha', 'Peixe-Ficha do Cassino', 4, '#a8242c', '#ffd36b', 180, 10, 22, 3, 'puffer', 'Engoliu tantas fichas que virou uma.'),
      RF('aurenna', 'baleia_moeda', 'Baleia-Moeda Dourada', 5, '#e8b73a', '#fff6c8', 760, 180, 320, 5, 'whale', 'Dizem que quem a pesca nunca mais passa fome. Prefere o sol do meio-dia.', 'dia')],
    ruinas: [RF('ruinas', 'leitor_afogado', 'Leitor Afogado', 4, '#5a6a7a', '#e8e2d0', 175, 30, 60, 3, 'fish', 'Nas costas, letras de um livro que ninguém terminou.'),
      RF('ruinas', 'eco_deus_caido', 'Eco do Deus Caído', 5, '#2a2f4a', '#ffd36b', 780, 150, 260, 5, 'ray', 'Um pedaço da última palavra do deus, nadando em círculos.')],
    costa: [RF('costa', 'arraia_mare', 'Arraia da Maré Violeta', 4, '#6a4ab8', '#e0d0ff', 180, 60, 120, 3, 'ray', 'Muda de cor com a maré.'),
      RF('costa', 'leviata_infante', 'Leviatã Infante', 5, '#7fd8ff', '#e8fbff', 800, 240, 420, 5, 'whale', 'Um filhote de ilha. Quando cresce, vira um arquipélago.', 'dia')],
    vazios: [RF('vazios', 'peixe_promessa', 'Peixe da Promessa Quebrada', 4, '#8a3a6a', '#ffd08a', 185, 20, 40, 3, 'fish', 'Quem o come cumpre uma promessa esquecida.'),
      RF('vazios', 'mercador_profundo', 'O Mercador das Profundezas', 5, '#41235f', '#ffd36b', 820, 90, 160, 5, 'squid', 'Troca sua isca por algo que você vai precisar amanhã.', 'noite')],
    abismo: [RF('abismo', 'enguia_veu', 'Enguia do Véu', 4, '#2a1a3a', '#c07aff', 190, 80, 160, 4, 'eel', 'Atravessa o véu entre a água e o nada.'),
      RF('abismo', 'soberano_vespera', 'Soberano da Véspera', 5, '#0b0812', '#ff5d79', 880, 260, 480, 5, 'whale', 'O rei de um mar que fica embaixo do mundo. Só acorda de noite.', 'noite')],
    montanhas: [RF('montanhas', 'truta_forja', 'Truta da Forja Celeste', 4, '#5a5a62', '#ffb86a', 190, 40, 80, 4, 'fish', 'As escamas saem quentes como lingotes.'),
      RF('montanhas', 'serpente_cinzenta', 'Serpente-de-Rio Cinzenta', 5, '#8f96a3', '#dfe6ff', 860, 200, 380, 5, 'eel', 'Dizem que é o Último Dragão Cinzento, quando ainda era filhote.')],
    astrolabio: [RF('astrolabio', 'peixe_nomes', 'Peixe-dos-Nomes', 4, '#3b3f6e', '#bfa6ff', 195, 20, 40, 4, 'fish', 'Cada pinta é o nome de alguém que ainda vai nascer.'),
      RF('astrolabio', 'cometa_nadador', 'Cometa que Nada', 5, '#1e1a50', '#fff6c8', 900, 100, 200, 5, 'fish', 'Atravessa o lago do observatório uma vez por noite.', 'noite')],
    jardins: [RF('jardins', 'carpa_florada', 'Carpa da Florada Final', 4, '#ff9ad5', '#ffe8f0', 195, 50, 90, 4, 'fish', 'Floresce uma vez por era.'),
      RF('jardins', 'koi_ultimo_sol', 'Koi do Último Sol', 5, '#ffcf5a', '#ff5d3a', 920, 110, 180, 5, 'fish', 'Nada em direção ao último pôr do sol — e só aparece de dia.', 'dia')],
  };
  // as grutas têm seus próprios peixes cegos (lagos subterrâneos)
  L.FISH_BY_BIOME.cave = [
    F('peixe_cego', 'Peixe-Cego', 1, '#e8e2f0', '#c8c0d8', 12, 10, 25, 1, 'fish', 'Nunca viu a luz — e não sente falta.'),
    F('bagre_gruta', 'Bagre-de-Gruta', 2, '#6a6470', '#a8a0b8', 26, 30, 70, 2, 'fish', 'Tateia o fundo com bigodes enormes.'),
    F('enguia_cristal', 'Enguia-de-Cristal', 3, '#9fe3ff', '#ffffff', 70, 40, 90, 3, 'eel', 'Brilha como os cristais das paredes.'),
    F('lagosta_mina', 'Lagosta-de-Mina', 4, '#c84b3a', '#ffcf5a', 150, 25, 50, 4, 'crab', 'Come minério e cospe pepitas.'),
  ];
  // Offshore catches are distinct from lake and river fish. Better rods reach deeper schools.
  L.FISH_BY_BIOME.sea = [
    {...F('sardinha_oceanica','Sardinha do Mar Aberto',1,'#7097b4','#e4f1ec',16,18,32,1,'fish','Forma cardumes longe da arrebentação.'),seaOnly:true},
    {...F('dourado_vela','Dourado das Velas',2,'#d9b95e','#d9eee6',38,50,110,2,'fish','Segue os barcos nas águas abertas.'),seaOnly:true},
    {...F('atum_violeta','Atum da Corrente Violeta',3,'#506b9c','#d5dfee',92,80,170,3,'fish','Veloz e forte; pede uma vara de carvalho ou melhor.'),seaOnly:true,minRod:1},
    {...F('peixe_espada_aurora','Peixe-Espada da Aurora',4,'#63829a','#e5d6a9',220,130,280,4,'fish','Vive nas correntes profundas, além dos píeres.'),seaOnly:true,minRod:2},
    {...F('lula_luar_marinho','Lula do Luar Marinho',4,'#a58ac1','#e7d9ee',250,70,160,4,'squid','Só visita a superfície no mar à noite.'),seaOnly:true,minRod:2,when:'noite'},
    {...F('marlin_coroa','Marlim da Coroa Celeste',5,'#416b94','#eacb78',680,180,360,5,'fish','Um troféu do mar aberto, atraído por equipamento de alto nível.'),seaOnly:true,minRod:3,when:'dia'},
    {...F('tainha_espuma','Tainha-da-Espuma',1,'#9fb2bd','#eef4f2',14,25,45,1,'fish','Salta entre as cristas quando o vento vira.'),seaOnly:true},
    {...F('cavala_corrente','Cavala da Corrente Fria',2,'#3f6f8a','#c9e2ea',34,30,60,2,'fish','Nada contra a corrente só para provar que consegue.'),seaOnly:true},
    {...F('garoupa_recife','Garoupa do Recife Afundado',3,'#8a5a3a','#f0c890',96,60,140,3,'fish','Mora no casco de um galeão e não aceita visitas.'),seaOnly:true,minRod:1},
    {...F('tubarao_lanterna','Tubarão-Lanterna',4,'#2b3f5a','#9fe8ff',240,140,260,4,'fish','Uma luz azul sob o queixo atrai cardumes inteiros à noite.'),seaOnly:true,minRod:2,when:'noite'},
    {...F('lula_colossal_fossa','Lula-Colossal da Fossa',5,'#5a2440','#ff9ab8',720,300,520,5,'squid','Sobe da fossa nas noites sem lua. Os marinheiros contam os tentáculos e nunca chegam ao mesmo número.'),seaOnly:true,minRod:3,when:'noite'},
  ];
  // Raridade: nome e cor (★1 a ★5). Os ★5 são lendários.
  L.RARITY = [null, { name: 'Comum', color: '#c9d1d9' }, { name: 'Incomum', color: '#8fe39b' }, { name: 'Raro', color: '#6fb8ff' }, { name: 'Épico', color: '#c08bff' }, { name: 'Lendário', color: '#ffc457' }];
  L.FISH = {};
  for (const [b, list] of Object.entries(L.FISH_BY_BIOME)) for (const f of list) if (!L.FISH[f.id]) L.FISH[f.id] = Object.assign({ biome: b }, f);
  for (const list of Object.values(L.FISH_REGION)) for (const f of list) L.FISH[f.id] = f;
  // Aquário de Elarion: um tanque para cada lugar do mapa, com os peixes mais raros de lá
  L.AQUARIUM = Object.fromEntries(Object.keys(L.FISH_REGION).map((rid) => {
    const biome = { bosque: 'forest', cidade: 'city', aurenna: 'city', ruinas: 'ruins', costa: 'coast', vazios: 'market', abismo: 'abyss', montanhas: 'mountain', astrolabio: 'astral', jardins: 'garden' }[rid];
    const list = [...L.FISH_BY_BIOME[biome].filter((f) => f.r >= 4).map((f) => f.id), ...L.FISH_REGION[rid].map((f) => f.id)];
    return [rid, [...new Set(list)]];
  }));
  L.AQUARIUM.grutas = L.FISH_BY_BIOME.cave.map((f) => f.id);
  L.AQUA_REWARD = { gems: 250, escama: 3, gold: 400 };
  // iscas e vales de troca do pescador
  L.BAITS = {
    isca: { name: 'Isca de Minhoca', icon: '🪱', price:40, pack:5, key:'bait', bonus:.20, desc: 'Peixes raros aparecem mais.' },
    isca_brilhante: {name:'Isca Luminescente',icon:'fishing',price:100,pack:5,key:'pbait',bonus:.35,desc:'Atrai cardumes raros em lagos e no mar.'},
    isca_marinha: {name:'Isca de Corrente Profunda',icon:'fishing',price:220,pack:5,key:'sbait',bonus:.65,desc:'Isca especial para peixes de mar aberto; é preservada ao pescar em lagos.'},
    isca_lendaria: { name: 'Isca Lendária de Dendê', icon: '🌶', desc: 'Atrai o peixe lendário da região (se for a hora certa).' },
  };
  // coisas que não são peixe
  L.JUNK = [
    { id: 'bota', name: 'Bota Velha', icon: '🥾', w: 6, desc: 'Ninguém sabe de quem era.' },
    { id: 'garrafa', name: 'Garrafa com Mensagem', icon: '🍾', w: 3, gems: 30, desc: 'Um mapa rabiscado e algumas Gemas Estelares!' },
    { id: 'bau_afogado', name: 'Baú Afogado', icon: '🧰', w: 2, gold: [30, 90], desc: 'Cheio de moedas molhadas.' },
  ];
  // Atributos (1–10): resistência (tensão que a linha aguenta), controle (faixa segura e puxada suave),
  // alcance (lançamento mais longe; peixes de águas fundas aparecem um pouco mais) e fisgada (espera menor e mais tempo para reagir).
  L.RODS = [
    { id: 0, name: 'Vara de Bambu', bonus: 0, stats: { res: 3, ctl: 3, reach: 3, hook: 3 }, desc: 'Simples e honesta.' },
    { id: 1, name: 'Vara de Carvalho', bonus: 1, stats: { res: 5, ctl: 4, reach: 4, hook: 4 }, retail:260, cost: { gold: 150, ore: { ferro: 2 } }, desc: 'Linha mais firme. Já dá para tentar os lendários.' },
    { id: 2, name: 'Vara Encantada', bonus: 2, stats: { res: 6, ctl: 6, reach: 5, hook: 6 }, retail:1100, cost: { gold: 600, ore: { prata: 3, cristal: 1 } }, desc: 'Atrai peixes raros.' },
    { id: 3, name: 'Vara Lendária das Marés', bonus: 3, stats: { res: 8, ctl: 7, reach: 7, hook: 7 }, retail:4800, cost: { gold: 2500, ore: { cristal: 3, obsidiana: 2 } }, desc: 'Os peixes ★5 sonham com ela.' },
    { id: 4, name: 'Vara de Dendê', bonus: 4, stats: { res: 9, ctl: 9, reach: 8, hook: 9 }, exclusive: 'Presente do Mestre Dendê (missão “Mestre dos Sete Mares”).', desc: 'A vara do maior pescador da Baía de Todos os Mares. Os lendários vêm sozinhos.' },
  ];
  L.ROD_STATS = { res: 'Resistência', ctl: 'Controle', reach: 'Alcance', hook: 'Fisgada' };

  // ------------------------------------------------------------ mercadorias (comércio entre regiões)
  // prod: região que produz (barato); want: regiões que pagam caro
  L.GOODS = {
    madeira: { name: 'Madeira-lanterna', icon: '🪵', base: 20, prod: 'bosque', want: ['vazios', 'montanhas', 'aurenna'] },
    mel: { name: 'Mel de Vaga-lume', icon: '🍯', base: 28, prod: 'bosque', want: ['abismo', 'astrolabio'] },
    vinho: { name: 'Vinho das Sete Pontes', icon: '🍷', base: 42, prod: 'cidade', want: ['montanhas', 'jardins', 'costa'] },
    reliquia: { name: 'Relíquias do Crepúsculo', icon: '🏺', base: 90, prod: 'ruinas', want: ['aurenna', 'vazios'] },
    perola: { name: 'Pérolas Violetas', icon: '🦪', base: 110, prod: 'costa', want: ['aurenna', 'cidade', 'jardins'] },
    sal: { name: 'Sal Marinho', icon: '🧂', base: 14, prod: 'costa', want: ['montanhas', 'abismo', 'bosque'] },
    especiaria: { name: 'Especiarias Impossíveis', icon: '🌶', base: 36, prod: 'vazios', want: ['cidade', 'costa', 'ruinas'] },
    seda: { name: 'Seda de Sombra', icon: '🧵', base: 72, prod: 'vazios', want: ['aurenna', 'jardins'] },
    lingote: { name: 'Lingotes Celestes', icon: '⚙', base: 58, prod: 'montanhas', want: ['cidade', 'aurenna', 'costa'] },
    cristal_bruto: { name: 'Cristal Estelar Bruto', icon: '🔮', base: 120, prod: 'astrolabio', want: ['montanhas', 'vazios', 'ruinas'] },
    nectar: { name: 'Néctar do Último Sol', icon: '🌸', base: 64, prod: 'jardins', want: ['abismo', 'cidade'] },
    essencia: { name: 'Essência Sombria', icon: '🌑', base: 150, prod: 'abismo', want: ['astrolabio', 'aurenna'] },
    cha: { name: 'Chá Dourado de Aurenna', icon: '🍵', base: 30, prod: 'aurenna', want: ['bosque', 'ruinas', 'montanhas'] },
    joia: { name: 'Joias Lapidadas', icon: '💍', base: 210, prod: 'aurenna', want: ['vazios', 'jardins', 'abismo'] },
  };
  L.CARTS = [
    { cap: 10, name: 'Mochila de Mascate' },
    { cap: 20, name: 'Carrinho de Mão', price: 300 },
    { cap: 40, name: 'Carroça', price: 1200 },
    { cap: 80, name: 'Carroção com Bois', price: 4000 },
    { cap: 150, name: 'Caravana Própria', price: 12000 },
  ];
  L.STALL_PRICE = 2000;

  // ------------------------------------------------------------ minérios
  L.ORES = {
    ferro: { name: 'Minério de Ferro', icon: '🪨', color: '#a8a8b0', price: 12, pick: 1 },
    prata: { name: 'Prata Lunar', icon: '🥈', color: '#dfe6ff', price: 30, pick: 2 },
    cristal: { name: 'Cristal Estelar', icon: '💠', color: '#9fe3ff', price: 70, pick: 3 },
    obsidiana: { name: 'Obsidiana Viva', icon: '⬛', color: '#5a3a7a', price: 90, pick: 4 },
  };
  // picaretas (vendidas pelos ferreiros): cada uma abre um tipo de veio nas grutas
  L.PICKAXES = [
    { name: 'Sem picareta' },
    { name: 'Picareta de Ferro', icon: '⛏', gold: 120, desc: 'Minera Minério de Ferro.' },
    { name: 'Picareta de Aço', icon: '⛏', gold: 650, ore: { ferro: 6 }, desc: 'Minera também Prata Lunar.' },
    { name: 'Picareta de Mithral', icon: '⛏', gold: 2200, ore: { prata: 6, ferro: 6 }, desc: 'Minera também Cristal Estelar.' },
    { name: 'Picareta Rúnica', icon: '⛏', gold: 6000, ore: { cristal: 8, prata: 6 }, desc: 'Minera até Obsidiana Viva.' },
  ];
  L.ORE_BY_BIOME = { forest: ['ferro'], city: ['ferro', 'prata'], metro: ['ferro'], ruins: ['ferro', 'prata'], coast: ['prata'], mountain: ['ferro', 'prata', 'cristal', 'obsidiana'], astral: ['cristal', 'prata'], market: ['prata'], garden: ['ferro'], abyss: ['obsidiana', 'cristal'] };
  L.GEMSTONE = { name: 'Gema Bruta', icon: '💎' }; // achado raro na mineração → vira Gemas Estelares

  // ------------------------------------------------------------ comidas (buffs) e receitas
  L.BUFFS = {
    vigor: { name: 'Vigor', icon: '💪', desc: 'Começa cada combate com PV temporários (2 × nível).' },
    foco: { name: 'Inspiração', icon: '🎯', desc: 'Começa cada combate com Inspiração Heroica (rolar de novo um d20).' },
    fortuna: { name: 'Fortuna', icon: '🪙', desc: '+25% de ouro das batalhas.' },
    sabedoria: { name: 'Sabedoria', icon: '📘', desc: '+20% de XP das batalhas.' },
    pescador: { name: 'Faro de Pescador', icon: '🐟', desc: 'Peixes raros aparecem com muito mais frequência.' },
  };
  // ingredientes: fish (qualquer peixe), fishR (peixe ★3+), herb (qualquer erva), 'Nome da erva', ore:<id>
  L.RECIPES = {
    cozinha: [
      { id: 'assado', name: 'Peixe Assado com Ervas', icon: '🐟', buff: 'vigor', mins: 30, need: { fish: 2, herb: 1 }, gold: 5, desc: 'Simples, cheiroso e reconfortante.' },
      { id: 'moqueca', name: 'Moqueca da Maré Violeta', icon: '🥘', buff: 'fortuna', mins: 30, need: { fish: 3, 'Alga-de-vidro': 1 }, gold: 15, desc: 'Dizem que atrai moedas.' },
      { id: 'torta', name: 'Torta de Pétala-solar', icon: '🥧', buff: 'sabedoria', mins: 30, need: { 'Pétala-solar': 2, fish: 1 }, gold: 20, desc: 'Cada mordida ensina algo.' },
      { id: 'caldo', name: 'Caldo Estelar', icon: '🍜', buff: 'foco', mins: 30, need: { fishR: 1, 'Poeira-estelar': 1 }, gold: 25, desc: 'As estrelas ficam nítidas.' },
      { id: 'sushi', name: 'Sushi do Pescador', icon: '🍣', buff: 'pescador', mins: 30, need: { fish: 3 }, gold: 10, desc: 'Peixe atrai peixe.' },
      { id: 'ensopado', name: 'Ensopado de Lanterna', icon: '🍲', buff: 'vigor', mins: 60, need: { fishR: 1, 'Erva-lanterna': 2 }, gold: 30, desc: 'Esquenta até a alma.' },
    ],
    alquimia: [
      { id: 'p_cura', name: 'Poção de Cura', icon: '🧪', item: 'pocao_cura', n: 1, need: { herb: 2 }, gold: 10, desc: 'Recupera 2d4+2 PV.' },
      { id: 'p_maior', name: 'Poção de Cura Maior', icon: '🧪', item: 'pocao_maior', n: 1, need: { herb: 3, fishR: 1 }, gold: 40, desc: 'Recupera 4d4+4 PV.' },
      { id: 'p_superior', name: 'Poção de Cura Superior', icon: '⚗', item: 'pocao_superior', n: 1, need: { herb: 4, 'ore:cristal': 1 }, gold: 120, desc: 'Recupera 8d4+8 PV.' },
      { id: 'antitox', name: 'Antitoxina', icon: '💉', item: 'antitoxina', n: 2, need: { 'Musgo-eco': 1, herb: 1 }, gold: 10, desc: 'Vantagem contra veneno.' },
    ],
    forja: [
      { id: 'lingote', name: 'Lingotes Celestes (mercadoria)', icon: '⚙', good: 'lingote', n: 1, need: { 'ore:ferro': 2 }, gold: 5, desc: 'Mercadoria valorizada em Lunária e Aurenna.' },
      { id: 'joia', name: 'Joia Lapidada (mercadoria)', icon: '💍', good: 'joia', n: 1, need: { 'ore:prata': 2, 'ore:cristal': 1 }, gold: 40, desc: 'Vale muito no Mercado das Mãos Vazias.' },
      { id: 'essencia', name: 'Essência de Refino', icon: '✴', special: 'refine', need: { 'ore:prata': 3, 'ore:cristal': 1 }, gold: 200, desc: 'Refina uma arma ★3 ou ★4 equipada em +1 (até R5).' },
    ],
  };

  // ------------------------------------------------------------ diárias (estilo "comissões")
  L.DAILY_POOL = [
    { id: 'fish3', text: 'Pesque 3 peixes', ev: 'fish', n: 3 },
    { id: 'win2', text: 'Vença 2 batalhas', ev: 'win', n: 2 },
    { id: 'chest1', text: 'Abra 1 baú', ev: 'chest', n: 1 },
    { id: 'herb3', text: 'Colha 3 ervas', ev: 'herb', n: 3 },
    { id: 'ore2', text: 'Minere 2 vezes', ev: 'ore', n: 2 },
    { id: 'trade1', text: 'Venda mercadorias com lucro', ev: 'profit', n: 1 },
    { id: 'cook1', text: 'Cozinhe 1 prato', ev: 'cook', n: 1 },
    { id: 'casino3', text: 'Jogue 3 rodadas no Cassino', ev: 'bet', n: 3 },
    { id: 'craft1', text: 'Fabrique 1 item (alquimia ou forja)', ev: 'craft', n: 1 },
    { id: 'bounty1', text: 'Conclua 1 contrato da Guilda', ev: 'bounty', n: 1 },
  ];
  L.DAILY_GEMS = 40; L.DAILY_BONUS = 80;

  // ------------------------------------------------------------ Arena dos Gladiadores
  L.ARENA = [
    { id: 'bronze', name: 'Liga de Bronze', lvl: 1, waves: [['goblin', 'goblin'], ['lobo', 'lobo', 'goblin'], ['hobgoblin']], gold: 80, gems: 60 },
    { id: 'prata', name: 'Liga de Prata', lvl: 3, waves: [['bandido', 'bandido', 'brutamontes'], ['esqueleto', 'esqueleto', 'carnical'], ['minotauro']], gold: 220, gems: 120 },
    { id: 'ouro', name: 'Liga de Ouro', lvl: 5, waves: [['merrow', 'bruxa_mar'], ['ogro', 'gargula'], ['troll']], gold: 500, gems: 200 },
    { id: 'platina', name: 'Liga de Platina', lvl: 7, waves: [['cao_infernal', 'pesadelo'], ['elemental_ar', 'gargula'], ['serpe']], gold: 1100, gems: 320, seals: 1 },
    { id: 'lenda', name: 'Desafio das Lendas', lvl: 8, waves: [['aparicao', 'espectro'], ['arvore_desperta', 'driade'], ['serpe_obsidiana']], gold: 2400, gems: 500, seals: 3 },
  ];

  // ------------------------------------------------------------ conquistas
  L.ACHIEVEMENTS = [
    { id: 'first_fish', name: 'Primeira Fisgada', desc: 'Pesque seu primeiro peixe.', test: (s) => s.fishCaught >= 1, gems: 20 },
    { id: 'fish50', name: 'Rede Cheia', desc: 'Pesque 50 peixes.', test: (s) => s.fishCaught >= 50, gems: 100 },
    { id: 'fish5star', name: 'O Que Ninguém Viu', desc: 'Pesque um peixe ★5.', test: (s) => s.fish5 >= 1, gems: 150 },
    { id: 'dex_half', name: 'Ictiólogo', desc: 'Registre metade dos peixes no Pescadex.', test: (s, L2) => s.dexCount >= Math.ceil(Object.keys(L2.FISH).length / 2), gems: 200 },
    { id: 'profit1k', name: 'Negócio da China', desc: 'Lucre 1.000 po no comércio.', test: (s) => s.profit >= 1000, gems: 120 },
    { id: 'profit10k', name: 'Magnata de Elarion', desc: 'Lucre 10.000 po no comércio.', test: (s) => s.profit >= 10000, gems: 300 },
    { id: 'broke', name: 'Faliu!', desc: 'Fique com 0 de ouro e 0 fichas depois de apostar.', test: (s) => s.broke >= 1, gems: 30 },
    { id: 'jackpot', name: 'Jackpot!', desc: 'Ganhe o prêmio acumulado do caça-níquel.', test: (s) => s.jackpots >= 1, gems: 200 },
    { id: 'bj', name: 'Vinte e Um', desc: 'Faça um Blackjack natural.', test: (s) => s.blackjacks >= 1, gems: 30 },
    { id: 'boss3', name: 'Caçador de Covis', desc: 'Derrote 3 chefes de covil.', test: (s, L2, g) => (g.bosses || 0) >= 3, gems: 200 },
    { id: 'arena_gold', name: 'Glória na Areia', desc: 'Vença a Liga de Ouro da Arena.', test: (s) => (s.arenaWins || []).includes('ouro'), gems: 200 },
    { id: 'bounty10', name: 'Procurado', desc: 'Conclua 10 contratos da Guilda.', test: (s) => s.bounties >= 10, gems: 150 },
    { id: 'cook10', name: 'Mão na Massa', desc: 'Cozinhe 10 pratos.', test: (s) => s.cooked >= 10, gems: 80 },
    { id: 'ore30', name: 'Pé na Pedra', desc: 'Minere 30 vezes.', test: (s) => s.mined >= 30, gems: 100 },
    { id: 'prof_max', name: 'O Melhor no Que Faz', desc: 'Leve um ofício ao nível 10.', test: (s, L2, g, h) => Object.values((h.life && h.life.xp) || {}).some((x) => x >= L2.profXpFor(9)), gems: 400 },
  ];

  // The new calendar controls these catches; other common fish remain available all day.
  for (const list of Object.values(L.FISH_BY_BIOME)) for (const fish of list) {
    if (['peixe_vagalume','enguia_lanterna','robalo_lunar','agua_viva_lunar','esturjao_gelo','peixe_estrela','peixe_sombra'].includes(fish.id)) { fish.when = 'noite'; if (L.FISH[fish.id]) L.FISH[fish.id].when = 'noite'; }
  }
  E.L = L;
})();
