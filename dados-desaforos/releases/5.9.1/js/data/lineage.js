/* Armas de Linhagem ★5 — uma para cada espécie com cada classe (10 × 12 = 120).
   Cada uma é inspirada numa arma famosa de jogos, animes, filmes ou lendas (citada na descrição) e foi
   redesenhada para Elarion. Ressonância: a arma desperta mais forte nas mãos da sua classe — e mais ainda
   quando a espécie também combina. */
(() => {
  const W = E.W, R = E.R;
  // [espécie, classe, nome, tipo, base, foco, modelo, c1, c2, c3, dano, inspirada em, habilidade, ícone, lenda, extras do desenho]
  const ROWS = [
    // ---------------- Guerreiro
    ['humano', 'guerreiro', 'Lâmina do Despertar', 'espada', 'espada_longa', null, 'mestra', '#e6ecf8', '#3a5ad0', '#ffd36b', 'radiante', 'a Espada Mestra (The Legend of Zelda)', 'Raio da Lâmina Sagrada', '⚔', 'Só quem tem coragem consegue tirá-la da pedra.'],
    ['elfo', 'guerreiro', 'Divisor da Névoa Lunar', 'espada', 'espada_longa', null, 'katana', '#dfeaff', '#5a8aff', '#d4af37', 'eletrico', 'a Mistsplitter Reforged (Genshin Impact)', 'Corte da Névoa', '🌫', 'Corta a névoa e o que se esconde nela.', { tsuba: 'flor', glow: true, edge: '#9fd0ff' }],
    ['anao', 'guerreiro', 'Machado Leviatã Rúnico', 'espadao', 'machado_batalha', null, 'leviathan', '#d8eef8', '#5ab8e8', '#8a6a3a', 'frio', 'o Machado Leviatã (God of War)', 'Retorno do Leviatã', '🪓', 'Arremessado, ele sempre volta para a mão do anão que o forjou.'],
    ['pequenino', 'guerreiro', 'Ferroada Azul', 'espada', 'espada_curta', null, 'sting', '#eef4ff', '#6bb8ff', '#b88a4a', 'radiante', 'a Ferroada de Bilbo (O Senhor dos Anéis)', 'Brilho do Alerta', '💠', 'Brilha azul quando orcs e goblins estão por perto.'],
    ['draconato', 'guerreiro', 'Matadora de Dragões', 'espadao', 'espada_grande', null, 'dragonslayer', '#8a8f99', '#c03a1a', '#3a2a20', 'fogo', 'a Dragonslayer de Guts (Berserk)', 'Golpe do Espadachim Negro', '🗡', 'Grande demais para ser chamada de espada. Um pedaço bruto de ferro.'],
    ['gnomo', 'guerreiro', 'Pistolâmina Coração de Leão', 'espada', 'espada_longa', null, 'gunblade', '#e0e6ee', '#7fc0ff', '#c8a050', 'trovejante', 'a Gunblade de Squall (Final Fantasy VIII)', 'Fúria Contínua', '🦁', 'O gatilho dá um tranco no golpe. Os gnomos acharam genial.'],
    ['golias', 'guerreiro', 'Espada Destruidora', 'espadao', 'espada_grande', null, 'buster', '#cfd6e0', '#5fd36b', '#8a6a3a', 'trovejante', 'a Buster Sword de Cloud (Final Fantasy VII)', 'Cometa Partido', '☄', 'Herdada de um amigo. As duas esferas verdes guardam memórias.'],
    ['orc', 'guerreiro', 'Lápide do Lobo', 'espadao', 'espada_grande', null, 'wolfgrave', '#d6dae2', '#c8302a', '#c8a050', 'trovejante', 'a Wolf’s Gravestone (Genshin Impact)', 'Uivo da Lápide', '🐺', 'Um lobo tombado em batalha empresta a ela o seu último uivo.'],
    ['tiferino', 'guerreiro', 'Lamento Gélido', 'espadao', 'espada_grande', null, 'frostmourne', '#cfeaff', '#6bc8ff', '#4a4a5a', 'frio', 'a Frostmourne (Warcraft)', 'Fome da Lâmina', '❄', 'Toda alma que ela toma sussurra no punho.'],
    ['aasimar', 'guerreiro', 'Espada do Criador', 'espada', 'espada_longa', null, 'creator', '#ece4d0', '#ff4a2a', '#a07a3a', 'radiante', 'a Espada do Criador (Fire Emblem: Three Houses)', 'Chicote Divino', '🔗', 'Os segmentos se soltam e voltam como uma serpente de luz.'],
    // ---------------- Bárbaro
    ['humano', 'barbaro', 'Rugido Rubro do Oni', 'espadao', 'espada_grande', null, 'redhorn', '#e8604a', '#ff9a6a', '#ffd36b', 'fogo', 'a Redhorn Stonethresher (Genshin Impact)', 'Investida do Oni', '👹', 'Um chifre de oni virou lâmina. O dono herdou o temperamento.'],
    ['elfo', 'barbaro', 'Orgulho Celeste', 'espadao', 'espada_grande', null, 'skyward_pride', '#eef8ff', '#6bdcff', '#e8c46a', 'energia', 'a Skyward Pride (Genshin Impact)', 'Lâmina do Vácuo', '🪽', 'Lâminas fantasmas flutuam ao redor e cortam junto.'],
    ['anao', 'barbaro', 'Martelo do Trovão Ancestral', 'espadao', 'martelo_guerra', null, 'mjolnir', '#b8c0ca', '#9fd8ff', '#8a5a32', 'eletrico', 'o Mjölnir (mitologia nórdica)', 'Queda do Trovão', '⚡', 'Só quem é digno o levanta. Os anões juram que é só questão de força.'],
    ['pequenino', 'barbaro', 'Kanabō do Oni Pequeno', 'espadao', 'clava_grande', null, 'kanabo', '#4a3a2e', '#c8302a', '#c8c8d0', 'trovejante', 'o kanabō dos onis (folclore japonês)', 'Pancada do Oni', '👺', 'Maior que o dono. Ninguém ri disso duas vezes.'],
    ['draconato', 'barbaro', 'Presa Escarlate', 'espadao', 'espada_grande', null, 'tessaiga', '#ff6a4a', '#ffd36b', '#c03a3a', 'fogo', 'a Tessaiga de Inuyasha (Inuyasha)', 'Ferida Escarlate', '🐉', 'Parece uma faca enferrujada até sentir sangue de dragão.', { scales: true }],
    ['gnomo', 'barbaro', 'Martelo a Jato', 'espadao', 'malho', null, 'jethammer', '#d84a3a', '#ffd36b', '#c8c8d0', 'fogo', 'o Martelo a Jato do Kirby (Kirby)', 'Martelada Supersônica', '🚀', 'Gnomo pequeno, martelo com motor. A física que se vire.'],
    ['golias', 'barbaro', 'Canção dos Pinheiros Partidos', 'espadao', 'espada_grande', null, 'broken_pines', '#e6f0ea', '#3ac890', '#c8a050', 'frio', 'a Song of Broken Pines (Genshin Impact)', 'Hino da Tempestade', '🎏', 'A bandeira ainda tremula com o vento das montanhas geladas.'],
    ['orc', 'barbaro', 'Uivo Sangrento', 'espadao', 'machado_grande', null, 'gorehowl', '#c8ced8', '#c8302a', '#6a4a2e', 'trovejante', 'o Gorehowl (Warcraft)', 'Grito de Guerra', '📣', 'Os furos nas lâminas uivam a cada golpe.'],
    ['tiferino', 'barbaro', 'Rebelião Infernal', 'espadao', 'espada_grande', null, 'rebellion', '#d8dde6', '#c8302a', '#d4af37', 'fogo', 'a Rebellion de Dante (Devil May Cry)', 'Gatilho do Diabo', '😈', 'O crânio na guarda ri quando você erra.'],
    ['aasimar', 'barbaro', 'Farol do Mar de Juncos', 'espadao', 'espada_grande', null, 'beacon', '#f2d8a0', '#ff5a3a', '#d4af37', 'radiante', 'a Beacon of the Reed Sea (Genshin Impact)', 'Sol do Deserto', '🌞', 'Guiava caravanas pelas areias. Agora guia a fúria.'],
    // ---------------- Paladino
    ['humano', 'paladino', 'Excalibur Renascida', 'espada', 'espada_longa', null, 'excalibur', '#f4f6ff', '#7fb0ff', '#ffd36b', 'radiante', 'a Excalibur (lenda arturiana)', 'Promessa da Vitória', '👑', 'Devolvida ao lago e reforjada por quem jurou proteger Elarion.'],
    ['elfo', 'paladino', 'Lâmina Celeste', 'espada', 'espada_longa', null, 'skyward_blade', '#eef8ff', '#7fc0ff', '#ffd36b', 'radiante', 'a Skyward Blade (Genshin Impact)', 'Juramento do Céu', '🕊', 'O fragmento da ponta flutua sozinho, como uma promessa.'],
    ['anao', 'paladino', 'Portadora das Cinzas', 'espadao', 'espada_grande', null, 'ashbringer', '#fff8e0', '#ffe08a', '#d4af37', 'radiante', 'a Ashbringer (Warcraft)', 'Luz Purificadora', '🔆', 'Uma lâmina tão pura que transforma mortos-vivos em cinzas.'],
    ['pequenino', 'paladino', 'Juramento da Liberdade', 'espada', 'rapieira', null, 'rapier', '#eafff4', '#3ac890', '#d4af37', 'radiante', 'a Freedom-Sworn (Genshin Impact)', 'Canção da Resistência', '🍃', 'Pequena, leve e firme como o juramento de quem a carrega.'],
    ['draconato', 'paladino', 'Lança do Último Juízo', 'haste', 'lanca', null, 'longinus', '#ff4a3a', '#c8201a', '#ffd36b', 'fogo', 'a Lança de Longinus (Neon Genesis Evangelion)', 'Perfuração Absoluta', '🔺', 'Duas hélices rubras que atravessam qualquer barreira.'],
    ['gnomo', 'paladino', 'Chave do Reino', 'espada', 'espada_longa', null, 'keyblade', '#d8dee8', '#ffd36b', '#e8c050', 'radiante', 'a Keyblade (Kingdom Hearts)', 'Trava de Luz', '🗝', 'Abre portas e tranca corações sombrios.'],
    ['golias', 'paladino', 'Vencedor do Vórtice', 'haste', 'alabarda', null, 'vortex', '#f2e6c0', '#e8a030', '#d4af37', 'trovejante', 'a Vortex Vanquisher (Genshin Impact)', 'Muralha de Jade', '🛡', 'Pesada como uma montanha, firme como um contrato.'],
    ['orc', 'paladino', 'Lâmina do Cavaleiro Negro', 'espadao', 'espada_grande', null, 'blackknight', '#3a3a44', '#ff8a3a', '#2a2228', 'fogo', 'a espada do Cavaleiro Negro (Dark Souls)', 'Brasa do Primeiro Fogo', '🔥', 'Ainda brilha com as brasas da guerra contra os demônios.'],
    ['tiferino', 'paladino', 'Coração em Chamas', 'espada', 'espada_longa', null, 'katana', '#ff8a3a', '#ff4a1a', '#ffd36b', 'fogo', 'a lâmina nichirin de Rengoku (Demon Slayer)', 'Purgatório', '🔥', '"Mantenha o coração em chamas." Ele manteve.', { tsuba: 'chama', glow: true, edge: '#fff2a8', wrapBase: '#f2ead0', wrapLine: '#c03a1a' }],
    ['aasimar', 'paladino', 'Lâmina Suprema', 'espadao', 'espada_grande', null, 'ultima', '#eef4ff', '#9fd8ff', '#e8c46a', 'radiante', 'a Ultima Weapon (Final Fantasy)', 'Fim Celestial', '💎', 'Brilha mais quanto mais vida tem quem a empunha.'],
    // ---------------- Patrulheiro
    ['humano', 'patrulheiro', 'Arco do Anseio', 'arco', 'arco_longo', null, 'amos', '#f4ecd8', '#7fc0ff', '#e8c46a', 'radiante', 'o Amos’ Bow (Genshin Impact)', 'Flecha do Anseio', '🏹', 'Quanto mais longe voa, mais forte acerta.'],
    ['elfo', 'patrulheiro', 'Arco da Floresta Dourada', 'arco', 'arco_longo', null, 'galadhrim', '#c8a050', '#7cc45a', '#d4af37', 'energia', 'o arco dos Galadhrim de Legolas (O Senhor dos Anéis)', 'Chuva da Floresta Dourada', '🍂', 'Presente da senhora de uma floresta onde o tempo não passa.'],
    ['anao', 'patrulheiro', 'Besta do Caçador de Monstros', 'arco', 'besta_pesada', null, 'xbow', '#9aa3ad', '#c8302a', '#c8a050', 'trovejante', 'a besta de Geralt (The Witcher)', 'Virote de Prata', '🐺', 'O medalhão do lobo vibra quando há monstros na mira.'],
    ['pequenino', 'patrulheiro', 'Arco das Rosas', 'arco', 'arco_curto', null, 'madoka', '#ffd6ea', '#ff6bb5', '#ffd36b', 'radiante', 'o arco de Madoka (Puella Magi Madoka Magica)', 'Flecha da Esperança', '🌹', 'Cada flecha carrega um desejo — e nenhum é egoísta.'],
    ['draconato', 'patrulheiro', 'Pulso Trovejante', 'arco', 'arco_longo', null, 'thundering', '#2a2a34', '#ff4a3a', '#d4af37', 'fogo', 'a Thundering Pulse (Genshin Impact)', 'Estrondo do Olho Rubro', '👁', 'O olho no punho se abre quando o alvo entra na mira.'],
    ['gnomo', 'patrulheiro', 'Simulacro Aquático', 'arco', 'arco_longo', null, 'aqua', '#9fdcff', '#3ab8ff', '#e8c46a', 'frio', 'a Aqua Simulacra (Genshin Impact)', 'Gota Infinita', '💧', 'Feito de água que se recusa a cair.'],
    ['golias', 'patrulheiro', 'Arco da Luz Sagrada', 'arco', 'arco_longo', null, 'lightbow', '#ffe9a8', '#fff6c8', '#d4af37', 'radiante', 'o Arco da Luz (The Legend of Zelda)', 'Flecha de Luz', '✨', 'Disparou a flecha que selou a escuridão — e pode disparar de novo.'],
    ['orc', 'patrulheiro', 'Elegia do Fim', 'arco', 'arco_longo', null, 'elegy', '#e6f6ee', '#3ac890', '#c8a050', 'trovejante', 'a Elegy for the End (Genshin Impact)', 'Adeus ao Vento', '🍃', 'A canção de despedida de um mundo que quase acabou.'],
    ['tiferino', 'patrulheiro', 'Arco Purificador', 'arco', 'arco_longo', null, 'sacred_bow', '#c8a080', '#ff9ad5', '#c03a3a', 'radiante', 'o arco sagrado de Kagome (Inuyasha)', 'Flecha Sagrada', '🎯', 'Ironia: uma tiferina disparando flechas que purificam demônios.'],
    ['aasimar', 'patrulheiro', 'Harpa Celeste', 'arco', 'arco_longo', null, 'skyward_harp', '#f4f6ff', '#7fc0ff', '#e8c46a', 'radiante', 'a Skyward Harp (Genshin Impact)', 'Eco do Firmamento', '🎶', 'Cada disparo soa como uma corda de harpa no céu.'],
    // ---------------- Ladino
    ['humano', 'ladino', 'Kunai do Deus Relâmpago', 'espada', 'adaga', null, 'kunai', '#d8e0ea', '#ffd36b', '#c8c8d0', 'eletrico', 'a kunai de Minato (Naruto)', 'Deus do Trovão Voador', '⚡', 'Onde ela cair, o dono aparece num piscar de olhos.'],
    ['elfo', 'ladino', 'Lâmina Oculta do Credo', 'espada', 'adaga', null, 'hiddenblade', '#e8eef6', '#c8302a', '#d4af37', 'psiquico', 'a Lâmina Oculta (Assassin’s Creed)', 'Salto de Fé', '🦅', 'Nada é verdade, tudo é permitido — inclusive atacar pelas costas.'],
    ['anao', 'ladino', 'Besta de Mão Engenhosa', 'arco', 'besta_mao', null, 'handxbow', '#9aa3ad', '#ffd36b', '#c8a050', 'trovejante', 'as bestas de Van Helsing (Van Helsing)', 'Rajada de Engrenagens', '⚙', 'Gira e dispara sozinha. O anão inventor ainda pede a patente.'],
    ['pequenino', 'ladino', 'Agulha', 'espada', 'rapieira', null, 'rapier', '#eef4ff', '#9fd0ff', '#b8c0c8', 'energia', 'a Agulha de Arya Stark (Game of Thrones)', 'Ponta Afiada', '🪡', '"Espete com a ponta." Simples assim.', { thin: true }],
    ['draconato', 'ladino', 'Yamato Escarlate', 'espada', 'cimitarra', null, 'katana', '#ece4ff', '#6b5aff', '#d4af37', 'energia', 'a Yamato de Vergil (Devil May Cry)', 'Corte Dimensional', '🌀', 'Corta o espaço entre você e o alvo.', { tsuba: 'redondo', glow: true, edge: '#c6b4ff', wrapBase: '#2a2a4a', wrapLine: '#9a8aff' }],
    ['gnomo', 'ladino', 'Elucidador e Repulsor', 'espada', 'espada_curta', null, 'dualswords', '#2a2a34', '#3ac8b8', '#c8c8d0', 'energia', 'as espadas de Kirito (Sword Art Online)', 'Explosão Estelar', '✴', 'Duas lâminas, dezesseis golpes, nenhuma chance para o inimigo.'],
    ['golias', 'ladino', 'Presa da Lua Negra', 'espada', 'cimitarra', null, 'katana', '#1a1a22', '#c8302a', '#c8c8d0', 'necrotico', 'a Tensa Zangetsu de Ichigo (Bleach)', 'Corte da Lua Negra', '🌙', 'Uma lâmina negra que dispara cortes em forma de lua.', { tsuba: 'manji', glow: true, edge: '#ff6a6a', chain: true, wrapBase: '#1a1a22', wrapLine: '#c8c8d0' }],
    ['orc', 'ladino', 'Presas Gêmeas da Fera', 'espada', 'espada_curta', null, 'serrated', '#c8ced8', '#4a8ad0', '#d8d0c0', 'necrotico', 'as lâminas serrilhadas de Inosuke (Demon Slayer)', 'Respiração da Fera', '🐗', 'Lascadas de propósito: rasgam em vez de cortar.'],
    ['tiferino', 'ladino', 'Lâmina do Filho da Noite', 'espada', 'espada_curta', null, 'alucard', '#e6e0ea', '#c8203a', '#d4af37', 'necrotico', 'a espada de Alucard (Castlevania)', 'Dança do Vampiro', '🦇', 'Herança de um pai que ninguém quer conhecer.'],
    ['aasimar', 'ladino', 'Estrela Polar', 'arco', 'arco_curto', null, 'polarstar', '#1a2a4a', '#6bb8ff', '#e8c46a', 'radiante', 'a Polar Star (Genshin Impact)', 'Estrela do Norte', '⭐', 'Aponta para o norte — e para o coração do inimigo.'],
    // ---------------- Monge
    ['humano', 'monge', 'Bastão do Rei Macaco', 'haste', 'bordao', null, 'ruyi', '#e8402a', '#ff5a3a', '#ffd36b', 'energia', 'o Ruyi Jingu Bang de Sun Wukong (Jornada ao Oeste e Dragon Ball)', 'Estique, Bastão!', '🐒', 'Encolhe até caber na orelha e cresce até tocar as nuvens.'],
    ['elfo', 'monge', 'Lança de Jade Primordial', 'haste', 'lanca', null, 'jadespear', '#eafff4', '#3ac890', '#d4af37', 'trovejante', 'a Primordial Jade Winged-Spear (Genshin Impact)', 'Asas de Jade', '🟢', 'Feita do jade mais antigo de Elarion.'],
    ['anao', 'monge', 'Bō do Casco Roxo', 'haste', 'bordao', null, 'bo_staff', '#8a5a32', '#9a6bff', '#d4af37', 'trovejante', 'o bō do Donatello (As Tartarugas Ninja)', 'Rodopio do Bō', '🐢', 'Leve, resistente e cheio de truques.'],
    ['pequenino', 'monge', 'Sais do Casco Rubro', 'espada', 'adaga', null, 'sai', '#d8dde6', '#c8302a', '#d4af37', 'trovejante', 'os sais do Raphael (As Tartarugas Ninja)', 'Fúria Ninja', '🔱', 'Pequenos, rápidos e sempre de mau humor.'],
    ['draconato', 'monge', 'Báculo Flamejante de Homa', 'haste', 'lanca', null, 'homa', '#ffd6c0', '#ff4a2a', '#ffd36b', 'fogo', 'a Staff of Homa (Genshin Impact)', 'Borboleta de Sangue', '🦋', 'A chama da vida que não se apaga.'],
    ['gnomo', 'monge', 'Espinha Celeste', 'haste', 'lanca', null, 'skyward_spine', '#eef8ff', '#7fc0ff', '#e8c46a', 'eletrico', 'a Skyward Spine (Genshin Impact)', 'Rasgo Celeste', '💨', 'A coluna de um dragão do céu, ainda veloz.'],
    ['golias', 'monge', 'Relâmpago Devorador', 'haste', 'lanca', null, 'engulfing', '#e8deff', '#c06bff', '#e8c46a', 'eletrico', 'a Engulfing Lightning (Genshin Impact)', 'Eternidade Absoluta', '🌩', 'Corta como um raio — e para o tempo por um instante.'],
    ['orc', 'monge', 'Supressora de Calamidades', 'haste', 'lanca', null, 'calamity', '#dff4ff', '#6bdcff', '#c8c8d0', 'frio', 'a Calamity Queller (Genshin Impact)', 'Lanterna das Neves', '🏮', 'Abate desastres antes que eles aconteçam.'],
    ['tiferino', 'monge', 'Foice do Ceifador Sorridente', 'espada', 'foice_curta', null, 'scythe', '#2a2a34', '#c8302a', '#c8c8d0', 'necrotico', 'a foice de Maka (Soul Eater)', 'Caçada à Bruxa', '💀', 'Ela tem alma própria — e um péssimo senso de humor.'],
    ['aasimar', 'monge', 'Gungnir', 'haste', 'lanca', null, 'gungnir', '#f4ecd8', '#9fd8ff', '#e8c46a', 'radiante', 'a Gungnir de Odin (mitologia nórdica)', 'Lança que Nunca Erra', '🎯', 'Nunca erra o alvo. Nunca mesmo.'],
    // ---------------- Clérigo
    ['humano', 'clerigo', 'Guardiã da Princesa', 'catalisador', null, 'cajado', 'aerith', '#f2ead0', '#ff9ad5', '#e8c46a', 'radiante', 'o cajado de Aerith (Final Fantasy VII)', 'Grande Evangelho', '🌸', 'A flor da igreja abandonada ainda cresce no cajado.'],
    ['elfo', 'clerigo', 'Verdade dos Sinos', 'catalisador', null, 'sino', 'kagura', '#f4ecd8', '#c8302a', '#e8c46a', 'radiante', 'a Kagura’s Verity (Genshin Impact)', 'Dança Sagrada', '🔔', 'Cada sino toca uma oração diferente.'],
    ['anao', 'clerigo', 'Lanterna da Vontade Esmeralda', 'catalisador', null, 'lanterna', 'lantern', '#5a6a62', '#3ae08a', '#c8c8d0', 'radiante', 'a Lanterna Verde (DC Comics)', 'Juramento da Luz Verde', '💚', '"No dia mais claro, na noite mais densa..."'],
    ['pequenino', 'clerigo', 'Cetro Lunar', 'catalisador', null, 'varinha', 'moonstick', '#ffffff', '#ff9ad5', '#ffd36b', 'radiante', 'o Cetro Lunar de Sailor Moon (Sailor Moon)', 'Cura Lunar', '🌙', 'Em nome da lua, ele cura os amigos.'],
    ['draconato', 'clerigo', 'Fragmento da Triforça', 'catalisador', null, 'simbolo', 'triforce', '#ffe9a8', '#ff6a2a', '#e8c050', 'fogo', 'a Triforça (The Legend of Zelda)', 'Fogo de Din', '🔺', 'O triângulo do Poder, aquecido pelo sopro de um dragão.'],
    ['gnomo', 'clerigo', 'Pedra Filosofal', 'catalisador', null, 'cristal', 'philostone', '#e6e0d0', '#ff3a3a', '#c8a050', 'energia', 'a Pedra Filosofal (Fullmetal Alchemist)', 'Troca Equivalente', '🜍', 'Ignora a troca equivalente — mas cobra de outro jeito.'],
    ['golias', 'clerigo', 'Cajado do Sábio da Savana', 'catalisador', null, 'cajado', 'rafiki', '#c8a050', '#ffd36b', '#c8a050', 'radiante', 'o cajado de Rafiki (O Rei Leão)', 'Ciclo da Vida', '🦁', 'Bate na cabeça de quem esquece quem é.'],
    ['orc', 'clerigo', 'Cálice Sagrado', 'catalisador', null, 'calice', 'grail', '#ffe08a', '#ff6a6a', '#e8c050', 'radiante', 'o Santo Graal (lenda arturiana e Fate)', 'Graça do Cálice', '🏆', 'Quem bebe dele lembra do que é ser bom.'],
    ['tiferino', 'clerigo', 'Livro dos Mortos', 'catalisador', null, 'tomo', 'necronomicon', '#6a4a3a', '#3ae08a', '#c8a050', 'necrotico', 'o Necronomicon (Evil Dead e H. P. Lovecraft)', 'Klaatu Barada Nikto', '📕', 'Leia em voz alta só se souber terminar a frase.'],
    ['aasimar', 'clerigo', 'Bastão de Asclépio', 'catalisador', null, 'cajado', 'asclepius', '#e8e2d0', '#5fd36b', '#e8c46a', 'radiante', 'o bastão de Asclépio (mitologia grega)', 'Toque do Curandeiro', '🐍', 'O símbolo de toda cura, em mãos celestiais.'],
    // ---------------- Druida
    ['humano', 'druida', 'Cajado do Mago Castanho', 'catalisador', null, 'cajado', 'radagast', '#8a6a4a', '#7cc45a', '#c8a050', 'veneno', 'o cajado de Radagast (O Hobbit)', 'Chamado dos Bichos', '🐦', 'Tem um ninho de passarinho no topo. Os passarinhos pagam aluguel.'],
    ['elfo', 'druida', 'Galho de Yggdrasil', 'catalisador', null, 'cajado', 'yggdrasil', '#c8e8b0', '#ffd36b', '#ffe08a', 'energia', 'a árvore Yggdrasil (mitologia nórdica)', 'Raízes dos Nove Mundos', '🌳', 'Um galho da árvore que sustenta todos os mundos.'],
    ['anao', 'druida', 'Coração da Montanha', 'catalisador', null, 'cristal', 'arkenstone', '#ffffff', '#9fe3ff', '#e8e8f0', 'trovejante', 'a Pedra Arken (O Hobbit)', 'Coração de Pedra', '💎', 'A joia mais bela que já saiu de dentro de uma montanha.'],
    ['pequenino', 'druida', 'Folha-Guarda-Chuva do Espírito', 'catalisador', null, 'folha', 'totoroleaf', '#7cc45a', '#5f9a3a', '#c8a050', 'frio', 'a folha do Totoro (Meu Amigo Totoro)', 'Chuva de Sementes', '🍃', 'Protege da chuva e faz sementes brotarem em uma noite.'],
    ['draconato', 'druida', 'Coração de Te Fiti', 'catalisador', null, 'cristal', 'tefiti', '#ff9a2a', '#3ac870', '#e8c46a', 'fogo', 'o coração de Te Fiti (Moana)', 'Te Ka Desperta', '🌋', 'Vida e lava na mesma pedra.'],
    ['gnomo', 'druida', 'Espírito do Kodama', 'catalisador', null, 'orbe', 'kodama', '#f4f6f0', '#7cc45a', '#c8a050', 'veneno', 'os kodamas (Princesa Mononoke)', 'Floresta Viva', '🌲', 'Quando o espírito chacoalha a cabeça, a floresta toda ouve.'],
    ['golias', 'druida', 'Galhada do Deus Cervo', 'catalisador', null, 'cajado', 'antler', '#c8a080', '#9fffb0', '#c8a050', 'radiante', 'o Deus Cervo (Princesa Mononoke)', 'Dádiva e Fim', '🦌', 'Dá vida com um passo e a tira com o outro.'],
    ['orc', 'druida', 'Presa do Deus Javali', 'catalisador', null, 'orbe', 'tusk', '#f2ead8', '#c8302a', '#c8a050', 'trovejante', 'Okkoto, o deus javali (Princesa Mononoke)', 'Investida do Clã Javali', '🐗', 'Guarda a teimosia de um deus que não aceitou perder.'],
    ['tiferino', 'druida', 'Rosa Encantada', 'catalisador', null, 'cristal', 'rose', '#ffd6e0', '#e8304a', '#c8a050', 'necrotico', 'a rosa encantada (A Bela e a Fera)', 'Última Pétala', '🥀', 'Cada pétala que cai é uma chance a menos.'],
    ['aasimar', 'druida', 'Flor Dourada da Torre', 'catalisador', null, 'orbe', 'sundrop', '#ffe08a', '#ffd36b', '#ffcf3a', 'radiante', 'a flor dourada de Rapunzel (Enrolados)', 'Canção da Flor', '🌼', '"Flor que dá vida, seu poder vai brilhar..."'],
    // ---------------- Bardo
    ['humano', 'bardo', 'Ocarina do Tempo', 'catalisador', null, 'instrumento', 'ocarina', '#9fd0ff', '#5a8ad0', '#e8c46a', 'trovejante', 'a Ocarina do Tempo (The Legend of Zelda)', 'Canção do Tempo', '🎵', 'Toque a melodia certa e o tempo obedece.'],
    ['elfo', 'bardo', 'Lira dos Mil Ventos', 'catalisador', null, 'instrumento', 'lyre', '#eafff4', '#3ac890', '#e8c46a', 'trovejante', 'a lira de Venti (Genshin Impact)', 'Balada do Vento', '🎼', 'O bardo que a tocava jurava ser um deus. Ninguém acreditou.'],
    ['anao', 'bardo', 'Trompa do Chamado', 'catalisador', null, 'instrumento', 'horn', '#d8c8a0', '#c8a070', '#c8c8d0', 'trovejante', 'a Trompa de Gondor (O Senhor dos Anéis)', 'Chamado do Socorro', '📯', 'Quando ela soa, todos os aliados ouvem — e vêm.'],
    ['pequenino', 'bardo', 'Flauta Mágica', 'catalisador', null, 'instrumento', 'flute', '#e8d8b0', '#9a6bff', '#e8c46a', 'psiquico', 'A Flauta Mágica (ópera de Mozart)', 'Melodia Encantadora', '🪈', 'Faz feras dançarem e vilões dormirem.'],
    ['draconato', 'bardo', 'Baixo Rugido do Dragão', 'catalisador', null, 'instrumento', 'guitar', '#2a2a34', '#ff4a3a', '#d4af37', 'fogo', 'o baixo da Haruko (FLCL)', 'Solo Incendiário', '🎸', 'Toca alto — e bate mais alto ainda.'],
    ['gnomo', 'bardo', 'Violino de Abril', 'catalisador', null, 'instrumento', 'violin', '#c8a080', '#ffb0c8', '#e8c46a', 'psiquico', 'o violino da Kaori (Shigatsu wa Kimi no Uso)', 'Melodia da Primavera', '🎻', 'Uma música que devolve as cores ao mundo.'],
    ['golias', 'bardo', 'Tambores do Deus Trovão', 'catalisador', null, 'instrumento', 'drums', '#d8c8a0', '#9fd8ff', '#e8c46a', 'trovejante', 'os tambores de Raijin (mitologia japonesa)', 'Rufar da Tempestade', '🥁', 'Cada batida é um trovão. Os vizinhos reclamam.'],
    ['orc', 'bardo', 'Alaúde do Dente-de-Leão', 'catalisador', null, 'instrumento', 'lute', '#c8a070', '#ffd36b', '#c8a050', 'psiquico', 'o alaúde do Jaskier (The Witcher)', 'Moeda pro Bruxo', '🪕', 'Uma canção grudenta que derruba o moral do inimigo.'],
    ['tiferino', 'bardo', 'Violino do Diabo', 'catalisador', null, 'instrumento', 'violin', '#4a1a1a', '#ff3a3a', '#d4af37', 'necrotico', 'a lenda do "Trilo do Diabo" de Tartini', 'Trilo do Diabo', '🎻', 'Dizem que o diabo tocou para o primeiro dono. A tiferina aprendeu.'],
    ['aasimar', 'bardo', 'Harpa de Orfeu', 'catalisador', null, 'instrumento', 'harp', '#ffe9a8', '#9fe3ff', '#e8c46a', 'radiante', 'a lira de Orfeu (mitologia grega)', 'Canto que Comove os Deuses', '🎶', 'Fez até o senhor dos mortos chorar.'],
    // ---------------- Bruxo
    ['humano', 'bruxo', 'Grimório do Trevo de Cinco Folhas', 'catalisador', null, 'tomo', 'grimoire_clover', '#2a2a34', '#5a3a3a', '#c8c8d0', 'necrotico', 'o grimório do Asta (Black Clover)', 'Antimagia', '♣', 'A quinta folha guarda um demônio. O pacto já está assinado.'],
    ['elfo', 'bruxo', 'Espelho da Rainha', 'catalisador', null, 'espelho', 'mirror', '#d8e8f0', '#9a6bff', '#e8c46a', 'psiquico', 'o espelho mágico (Branca de Neve)', 'Espelho, Espelho Meu', '🪞', 'Sempre responde a verdade. Quase sempre dói.'],
    ['anao', 'bruxo', 'Anel do Poder', 'catalisador', null, 'anel', 'onering', '#ffd36b', '#ff6a2a', '#e8c050', 'fogo', 'o Um Anel (O Senhor dos Anéis)', 'Olho que Tudo Vê', '💍', 'Um anel para a todos governar. O anão jura que é só um enfeite.'],
    ['pequenino', 'bruxo', 'Lâmpada do Gênio', 'catalisador', null, 'lampada', 'genielamp', '#ffd36b', '#6bb8ff', '#e8c050', 'energia', 'a lâmpada do Gênio (Aladdin)', 'Três Desejos', '🪔', 'O gênio cumpre o pacto. Com letras miúdas.'],
    ['draconato', 'bruxo', 'Cajado do Dragão dos Desejos', 'catalisador', null, 'cajado', 'dragonstaff', '#5a3a22', '#3ac870', '#ffd36b', 'fogo', 'Shenlong e as Esferas do Dragão (Dragon Ball)', 'Desejo Atendido', '🐲', 'O dragão enrolado no cajado guarda uma esfera de quatro estrelas.'],
    ['gnomo', 'bruxo', 'Cubo do Lamento', 'catalisador', null, 'cubo', 'puzzlebox', '#e8c050', '#c8302a', '#c8a050', 'necrotico', 'a caixa de quebra-cabeça (Hellraiser)', 'Abertura Proibida', '🧩', 'Gnomos não resistem a um quebra-cabeça. Esse foi um erro.'],
    ['golias', 'bruxo', 'Ídolo do Grande Antigo', 'catalisador', null, 'idolo', 'cthulhu', '#2a4a3a', '#3a8a6a', '#9fffb0', 'psiquico', 'Cthulhu (H. P. Lovecraft)', 'Chamado das Profundezas', '🐙', 'Ele sonha. E às vezes você sonha junto.'],
    ['orc', 'bruxo', 'Cajado do Crânio de Carneiro', 'catalisador', null, 'cajado', 'havoc', '#4a3a5a', '#c03aff', '#c8a050', 'necrotico', 'o cajado do Esqueleto (He-Man)', 'Poder do Castelo', '💀', 'O crânio de carneiro ri de todos os heróis.'],
    ['tiferino', 'bruxo', 'Caderno da Morte', 'catalisador', null, 'tomo', 'deathnote', '#1a1a22', '#c8302a', '#c8c8d0', 'necrotico', 'o Death Note (Death Note)', 'Nome Escrito', '📓', 'Escreva um nome. O resto é com o pacto.'],
    ['aasimar', 'bruxo', 'Olho de Agamotto', 'catalisador', null, 'amuleto', 'agamotto', '#3a3a44', '#3ae08a', '#e8c050', 'radiante', 'o Olho de Agamotto (Doutor Estranho)', 'Laço do Tempo', '👁', 'Abra o olho e o tempo volta um pouquinho.'],
    // ---------------- Feiticeiro
    ['humano', 'feiticeiro', 'Oração aos Ventos Sagrados', 'catalisador', null, 'orbe', 'lostprayer', '#dff4ff', '#6bdcff', '#e8c46a', 'trovejante', 'a Lost Prayer to the Sacred Winds (Genshin Impact)', 'Tufão Sagrado', '🌪', 'Quanto mais tempo em batalha, mais forte o vento.'],
    ['elfo', 'feiticeiro', 'Memória da Poeira', 'catalisador', null, 'orbe', 'memorydust', '#fff0c8', '#ffd36b', '#e8c050', 'energia', 'a Memory of Dust (Genshin Impact)', 'Escudo de Ouro', '🪙', 'Guarda a memória de um deus que virou poeira.'],
    ['anao', 'feiticeiro', 'Bastão Estelar', 'catalisador', null, 'varinha', 'starrod', '#ffe27a', '#ffd36b', '#e8c050', 'radiante', 'o Bastão Estelar (Kirby)', 'Chuva de Estrelas', '⭐', 'Uma estrela de verdade presa num bastão. Ela sorri.'],
    ['pequenino', 'feiticeiro', 'Varinha das Varinhas', 'catalisador', null, 'varinha', 'elderwand', '#c8b8a0', '#9fd8ff', '#c8a050', 'energia', 'a Varinha das Varinhas (Harry Potter)', 'Desarmar Supremo', '🪄', 'A varinha mais poderosa já feita. Troca de dono com facilidade.'],
    ['draconato', 'feiticeiro', 'Ovo do Dragão Rubro', 'catalisador', null, 'ovo', 'dragonegg', '#c8302a', '#c8302a', '#e8c050', 'fogo', 'os ovos de dragão de Daenerys (Game of Thrones)', 'Nascido do Fogo', '🥚', 'Choca no fogo. O dono não se queima.'],
    ['gnomo', 'feiticeiro', 'Manopla das Seis Joias', 'catalisador', null, 'luva', 'gauntlet', '#e8c050', '#ff9a2a', '#e8c050', 'energia', 'a Manopla do Infinito (Marvel)', 'Estalo', '✋', 'Um estalo e metade dos inimigos some. Bem, alguns deles.'],
    ['golias', 'feiticeiro', 'Raio-Mestre', 'catalisador', null, 'raio', 'masterbolt', '#fff6c8', '#9fd8ff', '#ffe08a', 'eletrico', 'o Raio-Mestre de Zeus (mitologia grega)', 'Ira do Céu', '🌩', 'Roubado do rei dos deuses. Ele ainda está procurando.'],
    ['orc', 'feiticeiro', 'Cajado da Explosão', 'catalisador', null, 'cajado', 'megumin', '#5a3a22', '#ff3a3a', '#c8a050', 'fogo', 'o cajado da Megumin (Konosuba)', 'EXPLOSÃO!', '💥', 'Só faz uma coisa — e faz muito bem.'],
    ['tiferino', 'feiticeiro', 'Cetro da Fada Sombria', 'catalisador', null, 'cajado', 'maleficent', '#2a2a34', '#5fe08a', '#c8c8d0', 'necrotico', 'o cetro da Malévola (A Bela Adormecida)', 'Fogo Verde', '🐦‍⬛', 'O fogo verde nunca apaga — nem a mágoa.'],
    ['aasimar', 'feiticeiro', 'Pena da Fênix', 'catalisador', null, 'pena', 'phoenixfeather', '#ffd6a0', '#ff6a2a', '#ffe08a', 'fogo', 'a fênix Fawkes (Harry Potter)', 'Renascimento', '🪶', 'Lágrimas de fênix curam qualquer ferida.'],
    // ---------------- Mago
    ['humano', 'mago', 'Cajado do Mago Cinzento', 'catalisador', null, 'cajado', 'gandalf', '#7a6a5a', '#fff6c8', '#c8c8d0', 'radiante', 'o cajado de Gandalf (O Senhor dos Anéis)', 'Você Não Passará', '🧙', 'Madeira velha e uma vontade inquebrável.'],
    ['elfo', 'mago', 'Cajado da Elfa Viajante', 'catalisador', null, 'cajado', 'frieren', '#e8e0d0', '#ff3a3a', '#e8c050', 'energia', 'o cajado da Frieren (Frieren e a Jornada para o Além)', 'Raio Mata-Demônios', '✨', 'Mil anos de magia para descobrir o que importa de verdade.'],
    ['anao', 'mago', 'Tomo dos Olhos Rúnicos', 'catalisador', null, 'tomo', 'tome_runes', '#5a3a22', '#3ae08a', '#e8c050', 'energia', 'o Livro de Cagliostro (Doutor Estranho)', 'Escudo Rúnico', '📖', 'Um tomo proibido acorrentado. O anão perdeu a chave.'],
    ['pequenino', 'mago', 'Lareira de Calcifer', 'catalisador', null, 'lanterna', 'calcifer', '#3a3a44', '#ff7a2a', '#c8c8d0', 'fogo', 'o Calcifer (O Castelo Animado)', 'Demônio do Fogo', '🔥', 'Um demônio do fogo que reclama de tudo — e esquenta o castelo.'],
    ['draconato', 'mago', 'Cajado da Mão Branca', 'catalisador', null, 'cajado', 'saruman', '#1a1a22', '#f4f4ff', '#c8c8d0', 'fogo', 'o cajado de Saruman (O Senhor dos Anéis)', 'Palavra de Comando', '🖐', 'Um mago branco que escolheu mal o lado. O cajado não esqueceu.'],
    ['gnomo', 'mago', 'Vira-Tempo', 'catalisador', null, 'amuleto', 'timeturner', '#e8c050', '#9fd8ff', '#e8c050', 'energia', 'o Vira-Tempo (Harry Potter)', 'Volta no Tempo', '⏳', 'Três voltas, três horas. Mais que isso, ninguém volta igual.'],
    ['golias', 'mago', 'Cajado do Espírito do Inverno', 'catalisador', null, 'cajado', 'jackfrost', '#a8c8d8', '#9fe3ff', '#e8e8f0', 'frio', 'o cajado de Jack Frost (A Origem dos Guardiões)', 'Primeira Nevasca', '❄', 'Um galho torto que congela tudo o que toca.'],
    ['orc', 'mago', 'Cetro da Serpente', 'catalisador', null, 'cajado', 'jafar', '#2a1a1a', '#ff3a3a', '#e8c050', 'psiquico', 'o cetro do Jafar (Aladdin)', 'Hipnose da Serpente', '🐍', 'Olhe nos olhos da cobra. Agora obedeça.'],
    ['tiferino', 'mago', 'Grande Cajado do Guardião', 'catalisador', null, 'cajado', 'atiesh', '#3a2a3a', '#9a6bff', '#e8c050', 'necrotico', 'Atiesh, o Grande Cajado do Guardião (Warcraft)', 'Portal do Guardião', '🐦', 'Um corvo de pedra que viu o fim de um mundo.'],
    ['aasimar', 'mago', 'Báculo do Selo Estelar', 'catalisador', null, 'varinha', 'sakurawand', '#ffb0d8', '#ff6bb5', '#ffd36b', 'radiante', 'o báculo de Sakura (Sakura Card Captor)', 'Liberte-se!', '🌸', '"Chave que guarda o poder das estrelas..."'],
  ];

  // passivos e habilidades únicas por classe (o tipo de dano vem de cada arma)
  const dn = (t) => (R.DAMAGE[t] || {}).name || t;
  const PASS = {
    guerreiro: (t) => ({ name: 'Fio do Campeão', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: t, ac: 1, desc: `+1 na CA. Uma vez por turno, +{v} de ${dn(t)} ao acertar.` }),
    barbaro: (t) => ({ name: 'Fúria Ancestral', kind: 'extra', hurt: true, vals: ['2d6', '2d8', '3d6', '3d8', '4d8'], dtype: t, killTemp: 8, desc: `Uma vez por turno, +{v} de ${dn(t)} contra alvos feridos. Ao derrotar um inimigo, ganha 8 PV temporários.` }),
    paladino: (t) => ({ name: 'Juramento Radiante', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: t, tempVals: [5, 6, 8, 10, 12], desc: `Começa o combate com {t} PV temporários. Uma vez por turno, +{v} de ${dn(t)} ao acertar.` }),
    patrulheiro: (t) => ({ name: 'Olho do Caçador', kind: 'extra', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], dtype: t, crit: 19, adv: true, desc: `Crítico com 19–20 e Vantagem no primeiro ataque do combate. Uma vez por turno, +{v} de ${dn(t)}.` }),
    ladino: (t) => ({ name: 'Golpe na Sombra', kind: 'crit', vals: [19, 19, 18, 18, 18], critDice: ['2d6', '2d8', '3d6', '3d8', '4d8'], dtype: t, desc: `Crítico com {v}–20; Críticos causam +{c} de ${dn(t)}.` }),
    monge: (t) => ({ name: 'Fluxo Interior', kind: 'extra', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], dtype: t, ac: 1, init: 4, desc: `+1 na CA e +4 na Iniciativa. Uma vez por turno, +{v} de ${dn(t)} ao acertar.` }),
    clerigo: () => ({ name: 'Graça Divina', kind: 'heal', vals: [4, 5, 6, 7, 8], spellTemp: [4, 5, 6, 8, 10], save: 1, desc: '+1 nos testes de resistência. Curas recuperam +{v} PV. Ao conjurar magia com espaço, ganha {s} PV temporários.' }),
    druida: () => ({ name: 'Seiva Primordial', kind: 'spell', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], spellTemp: [3, 4, 5, 6, 8], desc: 'Uma vez por turno, magias causam +{v} de dano. Ao conjurar magia com espaço, ganha {s} PV temporários.' }),
    bardo: () => ({ name: 'Melodia Encantada', kind: 'spell', vals: ['1d6', '1d8', '1d10', '2d6', '2d8'], save: 1, init: 3, desc: '+1 nos testes de resistência e +3 na Iniciativa. Uma vez por turno, magias causam +{v} de dano.' }),
    bruxo: () => ({ name: 'Preço do Pacto', kind: 'spell', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], spellTemp: [3, 4, 5, 6, 8], desc: 'Uma vez por turno, magias causam +{v} de dano. Ao conjurar magia com espaço, ganha {s} PV temporários.' }),
    feiticeiro: () => ({ name: 'Sangue Arcano', kind: 'spell', vals: ['1d10', '2d6', '2d8', '3d6', '3d8'], init: 3, desc: '+3 na Iniciativa. Uma vez por turno, magias causam +{v} de dano.' }),
    mago: () => ({ name: 'Fórmula Perfeita', kind: 'spell', vals: ['1d8', '1d10', '2d6', '2d8', '3d6'], save: 1, desc: '+1 nos testes de resistência. Uma vez por turno, magias causam +{v} de dano.' }),
  };
  const SIG = {
    guerreiro: (t) => ({ kind: 'strike', type: t, dice: ['4d8', '6d8', '8d8'], adv: [true, true, true], cond: [null, 'caido', 'caido'], save: 'for', autoCrit: [false, false, true], desc: [`Golpe lendário com Vantagem: ataque com a arma +{d} de ${dn(t)}.`, 'O alvo faz TR de FOR ou fica Caído.', 'Se acertar, é um Acerto Crítico.'] }),
    barbaro: (t) => ({ kind: 'aoe', type: t, dice: ['3d10', '5d10', '7d10'], save: 'for', cond: [null, 'caido', 'caido'], temp: [0, 0, 15], desc: [`Golpe sísmico: todos os inimigos sofrem {d} de ${dn(t)} (TR FOR reduz à metade).`, 'Quem falhar fica Caído.', 'Você ganha 15 PV temporários.'] }),
    paladino: (t) => ({ kind: 'strike', type: t, dice: ['3d8', '5d8', '7d8'], cond: [null, 'cego', 'cego'], save: 'con', drain: [0, 0, 0.5], desc: [`Golpe sagrado: ataque com a arma +{d} de ${dn(t)}.`, 'O alvo faz TR de CON ou fica Cego.', 'Você recupera metade do dano causado.'] }),
    patrulheiro: (t) => ({ kind: 'aoe', type: t, dice: ['3d8', '5d8', '7d8'], save: 'des', cond: [null, 'iluminado', 'iluminado'], desc: [`Chuva de flechas: todos os inimigos sofrem {d} de ${dn(t)} (TR DES reduz à metade).`, 'Quem falhar fica marcado: o próximo ataque contra ele tem Vantagem.', 'Mais dano.'] }),
    ladino: (t) => ({ kind: 'strike', type: t, dice: ['3d8', '5d8', '6d8'], adv: [true, true, true], autoCrit: [false, true, true], cond: [null, null, 'envenenado'], save: 'con', desc: [`Golpe nas sombras com Vantagem: +{d} de ${dn(t)}.`, 'Se acertar, é um Acerto Crítico.', 'O alvo faz TR de CON ou fica Envenenado.'] }),
    monge: (t) => ({ kind: 'strike', type: t, dice: ['3d8', '5d8', '7d8'], cond: [null, 'atordoado', 'atordoado'], save: 'con', buff: [null, null, 'advNext'], desc: [`Rajada lendária: ataque com a arma +{d} de ${dn(t)}.`, 'O alvo faz TR de CON ou fica Atordoado.', 'Vantagem no próximo ataque.'] }),
    clerigo: () => ({ kind: 'self', heal: ['3d8', '5d8', '7d8'], temp: [5, 8, 12], cleanse: [false, true, true], desc: ['Bênção: recupera {h} PV e ganha PV temporários.', 'Também encerra Envenenado, Amedrontado, Cego e outras condições.', 'Mais cura e mais PV temporários.'] }),
    druida: (t) => ({ kind: 'aoe', type: t, dice: ['3d8', '5d8', '7d8'], save: 'for', cond: [null, 'contido', 'contido'], desc: [`A natureza responde: todos os inimigos sofrem {d} de ${dn(t)} (TR FOR reduz à metade).`, 'Quem falhar fica Contido.', 'Mais dano.'] }),
    bardo: (t) => ({ kind: 'aoe', type: t, dice: ['3d8', '5d8', '7d8'], save: 'sab', cond: [null, 'amedrontado', 'atordoado'], desc: [`Acorde lendário: todos os inimigos sofrem {d} de ${dn(t)} (TR SAB reduz à metade).`, 'Quem falhar fica Amedrontado.', 'Quem falhar fica Atordoado.'] }),
    bruxo: (t) => ({ kind: 'aoe', type: t, dice: ['3d10', '5d10', '7d10'], save: 'sab', cond: [null, 'amedrontado', 'amedrontado'], drain: [0, 0.5, 0.5], desc: [`O patrono cobra: todos os inimigos sofrem {d} de ${dn(t)} (TR SAB reduz à metade).`, 'Quem falhar fica Amedrontado, e você recupera metade do dano do primeiro alvo.', 'Mais dano.'] }),
    feiticeiro: (t) => ({ kind: 'aoe', type: t, dice: ['4d8', '6d8', '8d8'], save: 'des', cond: [null, 'caido', 'atordoado'], desc: [`Poder bruto: todos os inimigos sofrem {d} de ${dn(t)} (TR DES reduz à metade).`, 'Quem falhar fica Caído.', 'Quem falhar fica Atordoado.'] }),
    mago: (t) => ({ kind: 'aoe', type: t, dice: ['4d8', '6d8', '8d8'], save: 'des', cond: [null, 'lentificado', 'lentificado'], temp: [0, 0, 10], desc: [`Fórmula perfeita: todos os inimigos sofrem {d} de ${dn(t)} (TR DES reduz à metade).`, 'Quem falhar fica Lentificado.', 'Você ganha 10 PV temporários (escudo arcano).'] }),
  };

  W.LINEAGE = {};
  for (const r of ROWS) {
    const [sp, cls, name, type, base, focus, tpl, c1, c2, c3, dtype, insp, sigName, sigIcon, lore, extra] = r;
    const id = `lin_${sp}_${cls}`;
    W.CATALOG[id] = {
      name, type, rarity: 5, base, focus: focus || undefined, lineage: { species: sp, cls },
      passive: PASS[cls](dtype), insp, lore: `${lore} Inspirada em ${insp}.`,
      art: Object.assign({ tpl, c1, c2, c3, v: 0, shape: focus || type }, extra || {}),
    };
    W.SIGNATURE[id] = Object.assign({ name: sigName, icon: sigIcon }, SIG[cls](dtype));
    (W.LINEAGE[sp] = W.LINEAGE[sp] || {})[cls] = id;
  }
  W.lineageOf = (sp, cls) => (W.LINEAGE[sp] || {})[cls] || null;

  // Ressonância: 0 = nenhuma · 1 = de Classe · 2 = Total (classe e espécie)
  W.RES_NAMES = ['Sem ressonância', 'Ressonância de Classe', 'Ressonância Total'];
  W.resonance = (h, def) => {
    if (!h || !def || !def.lineage) return 0;
    if (def.lineage.cls !== h.cls) return 0;
    return def.lineage.species === h.species ? 2 : 1;
  };
  // dados extras da habilidade única por nível de ressonância
  W.RES_SIG_DICE = ['', '2d8', '4d8'];
  W.lineageName = (def) => def && def.lineage ? `${(E.H.SPECIES[def.lineage.species] || {}).name} · ${(E.H.CLASSES[def.lineage.cls] || {}).name}` : '';
  W.resonanceText = (def) => {
    if (!def || !def.lineage) return '';
    const sp = (E.H.SPECIES[def.lineage.species] || {}).name, cl = (E.H.CLASSES[def.lineage.cls] || {}).name;
    return `<b>Ressonância de Classe</b> (${cl}): +1 no ataque e no dano (catalisador: ataque mágico e CD) e a habilidade única causa +2 dados. <b>Ressonância Total</b> (${sp} ${cl}): +2, o passivo conta como 1 refinamento a mais, a habilidade única causa +4 dados e desperta já na Ascensão 1.`;
  };
})();

// ---------------------------------------------------------------- estandarte de evento rotativo
// Muda a cada 1h30 e passa por TODAS as armas ★5 (duas em destaque por vez); a ordem é sorteada de novo
// a cada volta completa, então os pares mudam de uma volta para outra.
(() => {
  const W = E.W;
  W.ROTATE_MS = 90 * 60 * 1000;
  W.ROT_EPOCH = Date.UTC(2026, 9, 24, 0, 0, 0);
  let pool5 = null, pool4 = null;
  W.rotationPool = () => pool5 || (pool5 = Object.entries(W.CATALOG).filter(([, d]) => d.rarity === 5 && !d.shop && !d.exclusive).map(([id]) => id).sort());
  const pool4f = () => pool4 || (pool4 = Object.entries(W.CATALOG).filter(([, d]) => d.rarity === 4 && !d.shop && !d.exclusive).map(([id]) => id).sort());
  const seeded = (seed) => { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; };
  const shuffle = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const orders = {};
  W.windowIndex = (t = Date.now()) => Math.floor((t - W.ROT_EPOCH) / W.ROTATE_MS);
  W.bannerAt = (k) => {
    const pool = W.rotationPool(), per = Math.ceil(pool.length / 2);
    const cyc = Math.floor(k / per), j = ((k % per) + per) % per;
    const order = orders[cyc] || (orders[cyc] = shuffle(pool, seeded(cyc * 7919 + 104729)));
    const a = order[j * 2], b = order[j * 2 + 1] || order[(j * 2 + 3) % order.length];
    const A = W.CATALOG[a], B = W.CATALOG[b];
    return { id: 'rot' + k, k, name: A.name, featured5: [a, b], featured4: shuffle(pool4f(), seeded(k * 31 + 7)).slice(0, 5), tint: [A.art.c2 || '#ffb84d', B.art.c2 || '#7b2cff'], isNew: !!(A.lineage || B.lineage), start: W.ROT_EPOCH + k * W.ROTATE_MS, end: W.ROT_EPOCH + (k + 1) * W.ROTATE_MS };
  };
  W.currentEventBanner = () => W.bannerAt(W.windowIndex());
  W.bannerEndsInMs = () => W.ROT_EPOCH + (W.windowIndex() + 1) * W.ROTATE_MS - Date.now();
  W.bannerEndsIn = () => Math.max(1, Math.ceil(W.bannerEndsInMs() / 60000)); // minutos
  // próxima janela em que a arma fica em destaque (índice da janela ou -1)
  W.nextFeatured = (id, from = W.windowIndex(), max = 220) => { for (let k = from; k < from + max; k++) if (W.bannerAt(k).featured5.includes(id)) return k; return -1; };
  W.fmtDur = (ms) => { const m = Math.max(0, Math.round(ms / 60000)); const h = Math.floor(m / 60); return h ? `${h}h ${String(m % 60).padStart(2, '0')}min` : `${m}min`; };
})();
