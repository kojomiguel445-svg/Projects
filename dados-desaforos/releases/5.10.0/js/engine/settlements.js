/* Vida nas vilas: contratos de moradia, mobiliário, trabalho e acesso a interiores.
   O calendário é do jogo; nenhum aluguel ou pagamento usa o relógio do aparelho. */
(() => {
  'use strict';
  const U = E.U, SS = {};
  const hero = () => E.Store.hero();
  const currentPlace = () => (E.Interior && E.Interior.current) || (E.WorldServices && E.WorldServices.currentPlace && E.WorldServices.currentPlace());
  const clock = () => E.Sim ? E.Sim.clock() : {day:1,hour:8,minute:0,elapsed:0,night:false,text:'Dia 1 · 08:00'};
  const save = () => { E.Store.save(); U.emit('settlement:changed'); };
  const result = (ok,message,extra={}) => Object.assign({ok,message},extra);
  const integer = (n,min,max) => Number.isInteger(Number(n)) && Number(n)>=min && Number(n)<=max;
  SS.PRICES = Object.freeze({home:Object.freeze({buy:9000,rent:180}),shop:Object.freeze({buy:6500,rent:120}),room:Object.freeze({rent:45}),casino:Object.freeze({buy:22000,rent:450})});
  const CITY_PRICES=Object.freeze({home:Object.freeze({buy:28000,rent:540}),shop:Object.freeze({buy:18000,rent:360}),room:Object.freeze({rent:120}),casino:Object.freeze({buy:48000,rent:900})});
  SS.isMetro=r=>SS.region(r)==='aurenna'||!!((E.WD.REGIONS[SS.region(r)]||{}).metro);
  SS.prices=(r,kind)=>{const table=SS.isMetro(r)?CITY_PRICES:SS.PRICES;return kind?table[kind]:table;};
  SS.marketScale=r=>SS.isMetro(r)?1.65:1;
  SS.price=(r,base)=>Math.max(0,Math.ceil((Number(base)||0)*SS.marketScale(r)));
  SS.jobPay=(id,r)=>Math.round((SS.JOBS[id]&&SS.JOBS[id].pay||0)*(SS.isMetro(r)?1.8:1));
  SS.WALLS = Object.freeze({cream:{name:'Cal de marfim',color:'#ded6bd',price:0},sage:{name:'Verde sálvia',color:'#93aa8d',price:16},indigo:{name:'Azul de Lunária',color:'#788aac',price:22},clay:{name:'Argila de Záhara',color:'#bd8c6b',price:18},plum:{name:'Ameixa astral',color:'#9b83a9',price:26},stripes:{name:'Papel listrado de linho',color:'#e6dabd',accent:'#c9b58b',pattern:'stripes',price:30},flowers:{name:'Papel floral de Lunária',color:'#cdd6e6',accent:'#7d8fb6',pattern:'flowers',price:38},check:{name:'Papel xadrez do campo',color:'#dccdab',accent:'#b49a69',pattern:'check',price:34},panel:{name:'Lambri de madeira',color:'#a27b55',accent:'#7b5a3c',pattern:'panel',price:42}});
  SS.FLOORS = Object.freeze({oak:{name:'Tábuas de carvalho',color:'#9a7a52',line:'#6c503b',pattern:'planks',price:0},walnut:{name:'Tábuas de nogueira',color:'#6e4f37',line:'#4a3424',pattern:'planks',price:28},tiles:{name:'Ladrilho xadrez',color:'#ddd5c4',line:'#8796a3',pattern:'check',price:36},stone:{name:'Pedra polida',color:'#a19d93',line:'#77736b',pattern:'stone',price:40},terracotta:{name:'Lajota de terracota',color:'#bb7652',line:'#8c5136',pattern:'tiles',price:30}});
  SS.SKINS = Object.freeze({linen:{name:'Linho e madeira',color:'#d7c49a',price:0},forest:{name:'Jardim do mercador',color:'#79aa89',price:35},royal:{name:'Mercado azul',color:'#7998bb',price:45},sunset:{name:'Toldo do poente',color:'#c7927b',price:45},astral:{name:'Armazém astral',color:'#a795cf',price:65}});
  SS.FURNITURE = Object.freeze({
    bed:{name:'Cama de carvalho',icon:'bed',price:65,action:'Dormir',desc:'Durma até o próximo amanhecer e recupere seus PV.',w:1.8,d:2.3},
    hearth:{name:'Fogão de pedra',icon:'cooking',price:48,action:'Cozinhar',desc:'Prepare e coma os ingredientes da sua despensa.',w:1.5,d:1.2},
    table:{name:'Mesa de jantar',icon:'cup',price:24,action:'Comer',desc:'Abra a despensa e escolha uma refeição.',w:1.7,d:1.1},
    chair:{name:'Cadeira acolchoada',icon:'home',price:12,action:'Sentar e descansar',desc:'Recupere vigor em uma pausa; não substitui dormir.',w:.7,d:.7},
    chest:{name:'Baú de armazenamento',icon:'chest',price:32,action:'Guardar e retirar',desc:'Transfira consumíveis, alimentos e carga sem perder itens.',w:1.4,d:.8},
    wardrobe:{name:'Guarda-roupa',icon:'wardrobe',price:46,action:'Trocar de roupa',desc:'Vista os trajes que você já possui.',w:1.4,d:.8},
    bookshelf:{name:'Estante de estudo',icon:'books',price:28,action:'Ler',desc:'Consulte as regras e o seu diário de aventura.',w:1.6,d:.6},
    lamp:{name:'Luminária de mesa',icon:'lantern',price:18,action:'Acender / apagar',desc:'Uma luz quente para a sua casa.',w:.5,d:.5},
    sofa:{name:'Sofá estofado',icon:'home',price:58,action:'Sentar no sofá',desc:'Um sofá largo para descansar e recuperar o vigor.',w:2.0,d:.9},
    tv:{name:'Tela de cristal (TV)',icon:'eye',price:90,action:'Ligar a tela',desc:'Um televisor de cristal encantado que mostra imagens das terras de Elarion.',w:1.4,d:.55},
    fridge:{name:'Geladeira de gelo-eterno',icon:'snowflake',price:70,action:'Abrir a geladeira',desc:'Mantém as refeições frescas: escolha uma porção da despensa.',w:.9,d:.8},
    cabinet:{name:'Armário de cozinha',icon:'chest',price:40,action:'Guardar e retirar',desc:'Portas e prateleiras para guardar consumíveis, alimentos e carga.',w:1.4,d:.6},
    counter:{name:'Bancada de cozinha',icon:'cooking',price:44,action:'Preparar comida',desc:'Bancada com pia e tábua para preparar os ingredientes.',w:1.6,d:.7}
  });
  // Planta do interior da casa (10 x 9): paredes internas, passagem da porta e bancada de decoração ficam livres.
  SS.HOME = Object.freeze({grid:.25,maxX:4.8,back:-4.3,front:3.2,clear:Object.freeze([{x:0,z:3.35,w:2.6,d:2.3},{x:3.65,z:1.85,w:.95,d:.75}])});
  // Regra única de posição: usada pela prévia na tela e pela gravação no motor.
  SS.canPlaceFurniture = (p,uid,id,x,z,turn=0) => {
    const size=SS.FURNITURE[id];if(!p||!size||!Number.isFinite(+x)||!Number.isFinite(+z))return 'Posição inválida.';
    const H=SS.HOME,swap=Math.abs(Math.round(+turn||0))%2,w=swap?size.d:size.w,d=swap?size.w:size.d;x=+x;z=+z;
    if(Math.abs(x)+w/2>H.maxX+1e-6||z-d/2<H.back-1e-6||z+d/2>H.front+1e-6)return 'O móvel precisa caber inteiro dentro da casa, sem atravessar as paredes.';
    if(H.clear.some(a=>Math.abs(a.x-x)<(a.w+w)/2&&Math.abs(a.z-z)<(a.d+d)/2))return 'Deixe livres a passagem da porta e a bancada de decoração.';
    if((p.furniture||[]).some(o=>{if(o.uid===uid||o.stored)return false;const of=SS.FURNITURE[o.id];if(!of)return false;const os=Math.abs(Math.round((o.r||0)/(Math.PI/2)))%2;return Math.abs(o.x-x)<(w+(os?of.d:of.w))/2+.08&&Math.abs(o.z-z)<(d+(os?of.w:of.d))/2+.08;}))return 'Outro móvel ocupa esse lugar.';
    return '';
  };
  const baseJobs = {
    cook:{name:'Ajudante de cozinha',place:'food',icon:'cooking',pay:150,duration:25,interview:['Organizo os ingredientes e mantenho a bancada limpa.','Uso o que estiver mais perto, sem conferir.','Prometo servir tudo cru para ganhar tempo.'],answer:0,tasks:[{q:'A panela está quente. Qual é a primeira etapa?',a:['Separar ingredientes e lavar as mãos','Servir sem cozinhar','Misturar produtos de limpeza'],ok:0},{q:'Um cliente tem alergia. Como agir?',a:['Ignorar o pedido','Separar utensílios e confirmar os ingredientes','Esconder o ingrediente'],ok:1},{q:'Terminou o preparo. O que falta?',a:['Abandonar a bancada','Cobrar de novo pelo mesmo prato','Conferir o ponto e limpar a estação'],ok:2}]},
    smith:{name:'Auxiliar da forja',place:'smith',icon:'hammer',pay:180,duration:30,interview:['Trabalho sem luvas para ser mais rápido.','Respeito as etapas e confiro as ferramentas.','Apago a forja com óleo.'],answer:1,tasks:[{q:'Vai mover uma peça aquecida.',a:['Pegá-la com a mão','Usar tenaz e proteção','Deixá-la no caminho'],ok:1},{q:'A lâmina saiu empenada.',a:['Conferir o alinhamento e corrigir na bigorna','Vender como nova','Esconder a peça'],ok:0},{q:'Ao fechar o turno...',a:['Deixar brasas soltas','Guardar ferramenta quente na palha','Organizar ferramentas e verificar o braseiro'],ok:2}]},
    fisher:{name:'Aprendiz da peixaria',place:'general',icon:'fish',pay:130,duration:25,interview:['Separo espécies, tamanho e estado de conservação.','Vendo qualquer peixe como lendário.','Nunca confiro a rede.'],answer:0,tasks:[{q:'Chegou uma cesta de pescado.',a:['Separar espécies e tamanhos','Misturar tudo com minério','Deixar ao sol'],ok:0},{q:'Um peixe está impróprio para consumo.',a:['Cobrir com tempero','Separá-lo e avisar ao responsável','Vender mais caro'],ok:1},{q:'O pedido está pronto.',a:['Inventar o peso','Entregar sem contar','Conferir peso, espécie e embalagem'],ok:2}]},
    courier:{name:'Mensageiro da vila',place:'guild',icon:'mail',pay:120,duration:24,interview:['Abro as encomendas para descobrir o conteúdo.','Confiro destinatário e organizo a rota.','Entrego todos os pacotes na mesma casa.'],answer:1,tasks:[{q:'Há duas encomendas parecidas.',a:['Conferir os nomes nos lacres','Trocar as etiquetas','Abrir ambas'],ok:0},{q:'O destinatário não está disponível.',a:['Largar na rua','Registrar a tentativa e guardar em segurança','Entregar a qualquer pessoa'],ok:1},{q:'Concluiu as entregas.',a:['Pedir o mesmo salário duas vezes','Jogar fora o registro','Conferir recibos com o responsável'],ok:2}]},
    clerk:{name:'Atendente do empório',place:'general',icon:'shop',pay:140,duration:27,interview:['Prometo descontos que não posso dar.','Escondo defeitos dos produtos.','Escuto a necessidade do cliente e confiro o preço.'],answer:2,tasks:[{q:'O cliente procura uma ferramenta.',a:['Perguntar qual trabalho ele fará','Vender a mais cara sem perguntar','Ignorá-lo'],ok:0},{q:'O preço na etiqueta está errado.',a:['Cobrar em segredo','Conferir com o responsável antes de concluir','Inventar outro valor'],ok:1},{q:'Ao fechar o caixa...',a:['Guardar moedas no próprio bolso','Apagar as vendas','Conferir recibos, troco e estoque'],ok:2}]}
  };
  // Aurenna has the specialist employers; villages keep the essential trades.
  const task=(q,a,ok)=>({q,a,ok});
  const specialist=(name,place,icon,pay,skill,question,answers,correct,tasks)=>({name,place,icon,pay,duration:30,skill,cityOnly:true,interview:answers,answer:correct,tasks});
  const extraJobs={
    carpenter:{name:'Auxiliar da marcenaria',place:'furniture',icon:'home',pay:160,duration:28,skill:'forja',interview:['Meço as peças, confiro o desenho e protejo a bancada.','Corto sem medir.','Uso madeira molhada e escondo rachaduras.'],answer:0,tasks:[task('A peça será cortada.', ['Medir e marcar conforme o desenho','Cortar no escuro','Ignorar os nós da madeira'],0),task('Uma farpa ficou na borda.', ['Cobrir com pano','Lixar e conferir o acabamento','Entregar assim mesmo'],1),task('A cadeira está montada.', ['Conferir encaixes e estabilidade','Usá-la ainda sem fixação','Retirar uma perna'],0)]},
    baker:specialist('Padeiro da Praça','food','pie',185,'culinaria','', ['Peso os ingredientes e respeito o tempo da massa.','Troco farinha por qualquer pó.','Entrego a massa crua.'],0,[task('A massa será preparada.', ['Pesar os ingredientes e conferir a receita','Misturar sem medir','Pular a fermentação'],0),task('O forno aqueceu.', ['Deixar a porta aberta','Conferir a temperatura e o tempo','Assar perto de produtos de limpeza'],1),task('O pão está pronto.', ['Conferir o ponto e separar o lote','Embalar ainda cru','Deixar cair na bancada suja'],0)]),
    receptionist:specialist('Recepcionista da pousada','inn','bed',170,'comercio','', ['Entrego qualquer chave sem conferir.','Confirmo a reserva, explico a diária e registro a chave.','Cobro uma diária sem avisar.'],1,[task('Chegou uma reserva.', ['Confirmar nome e quarto disponível','Entregar um quarto ocupado','Esquecer o registro'],0),task('O hóspede precisa de descanso.', ['Gritar no corredor','Orientar sobre o quarto e o horário','Esconder a chave'],1),task('No encerramento...', ['Conferir chaves e reservas','Apagar todas as reservas','Cobrar duas vezes'],0)]),
    housekeeper:specialist('Camareiro da pousada','inn','home',150,'comercio','', ['Reutilizo roupa de cama suja.','Entro sem bater em todos os quartos.','Respeito os hóspedes e separo roupas limpas e usadas.'],2,[task('O quarto acaba de desocupar.', ['Conferir objetos esquecidos e separar a roupa usada','Misturar roupas usadas com limpas','Retirar objetos do hóspede para si'],0),task('Há produto de limpeza na bancada.', ['Misturar todos os frascos','Conferir o rótulo e usar a diluição correta','Deixar aberto na cama'],1),task('Antes de liberar o quarto...', ['Conferir limpeza, enxoval e chave','Anunciar antes de terminar','Trancar a saída'],0)]),
    dealer:specialist('Crupiê do Fortuna Dourada','casino','cards',230,'jogatina','', ['Anuncio apostas e resultados com clareza, seguindo as regras da mesa.','Prometo vitória garantida.','Mudo as regras depois da aposta.'],0,[task('As apostas estão abertas.', ['Confirmar valores e limites da mesa','Mudar as fichas do jogador','Aceitar apostas escondidas'],0),task('O giro terminou.', ['Girar outra vez sem avisar','Conferir o resultado e anunciar a rodada','Inventar outro resultado'],1),task('Um jogador questionou o pagamento.', ['Conferir a tabela e chamar o responsável','Ridicularizá-lo','Pagar um valor aleatório'],0)]),
    casinoCashier:specialist('Caixa do cassino','casino','coin',210,'comercio','', ['Confiro fichas, troco e comprovante em cada operação.','Escondo a taxa até o final.','Misturo o caixa com meu dinheiro.'],0,[task('Vai trocar moedas por fichas.', ['Mostrar a cotação e confirmar a quantia','Entregar fichas sem contar','Cobrar uma taxa secreta'],0),task('O troco não confere.', ['Ignorar a diferença','Recontar e corrigir antes de concluir','Culpar o cliente'],1),task('No fechamento do caixa...', ['Conferir fichas, valores e recibos','Levar a sobra para casa','Apagar o registro'],0)]),
    warehouse:specialist('Conferente do entreposto','market','package',200,'comercio','', ['Recebo a carga sem contar.','Confiro lotes, quantidades e comprovantes do fornecedor.','Troco as etiquetas para terminar antes.'],1,[task('Chegou um carroção.', ['Comparar volumes e nota de entrega','Assinar sem olhar','Abrir todas as embalagens'],0),task('Um lote está danificado.', ['Misturá-lo ao estoque novo','Separar e registrar a ocorrência','Cobrir o dano'],1),task('Antes de despachar...', ['Confirmar destino, lote e quantidade','Enviar para qualquer loja','Retirar os lacres'],0)]),
    dockhand:specialist('Estivador do porto','pier','anchor',190,'comercio','', ['Prendo a carga e respeito a capacidade dos carrinhos.','Empilho até não enxergar o caminho.','Deixo os volumes na borda do cais.'],0,[task('A carga será movida.', ['Conferir peso e amarração','Puxar pelo lacre','Deixar a rota bloqueada'],0),task('O cais está molhado.', ['Correr com caixas','Reduzir o passo e usar a faixa segura','Empilhar sobre a passagem'],1),task('A entrega terminou.', ['Conferir volumes com o responsável','Jogar as cordas na água','Deixar o carrinho solto'],0)]),
    fishmonger:specialist('Peixeiro do cais','pier','fish',180,'pesca','', ['Respeito a conservação e identifico a espécie do pescado.','Chamo todo peixe de raro.','Deixo o pescado o dia todo ao sol.'],0,[task('A pesca foi descarregada.', ['Separar espécies e conferir conservação','Misturar com combustível','Deixar tudo aberto'],0),task('Há um peixe em mau estado.', ['Vender mais caro','Separar e avisar o responsável','Misturar com os demais'],1),task('No pedido do cliente...', ['Conferir peso e embalagem','Inventar a procedência','Trocar os nomes'],0)]),
    apothecary:specialist('Assistente de boticário','alchemy','potion',240,'alquimia','', ['Confiro fórmulas, rótulos e medidas antes de preparar.','Misturo frascos sem rótulo.','Prometo curar qualquer doença.'],0,[task('Vai começar uma fórmula.', ['Conferir receita e ingredientes','Misturar pelo cheiro','Dispensar medidas'],0),task('Um frasco perdeu o rótulo.', ['Vender como cura','Separar e pedir identificação segura','Provar o conteúdo'],1),task('O preparado está pronto.', ['Rotular e guardar conforme a fórmula','Deixar aberto ao sol','Misturar aos ingredientes crus'],0)]),
    steward:specialist('Monitor da arena','arena','shield',220,'gladiador','', ['Verifico equipamentos e separo o público da área de combate.','Abro a passagem durante o combate.','Ignoro uma arma quebrada.'],0,[task('Uma rodada vai começar.', ['Conferir a área e o equipamento','Deixar o público entrar','Soltar os combatentes sem aviso'],0),task('Um participante pede atendimento.', ['Mandá-lo lutar assim mesmo','Sinalizar a pausa e chamar o responsável','Esconder o pedido'],1),task('Depois da rodada...', ['Conferir o local e registrar o resultado','Anunciar um vencedor inventado','Guardar tudo sem olhar'],0)]),
    jeweler:specialist('Aprendiz de lapidação','furniture','diamond',260,'forja','', ['Uso proteção e confiro as medidas antes de lapidar.','Escondo defeitos com tinta.','Prometo que toda pedra é lendária.'],0,[task('A pedra chegou à oficina.', ['Identificar e registrar a peça','Misturar às pedras de outro cliente','Iniciar sem conferir'],0),task('A lapidação precisa de ajuste.', ['Forçar a pedra','Conferir o desenho e avançar aos poucos','Esconder a trinca'],1),task('Ao entregar...', ['Conferir acabamento e registro da peça','Trocar a identificação','Dispensar o recibo'],0)]),
    waiter:specialist('Atendente da taverna','food','cup',175,'culinaria','', ['Escuto o pedido e confirmo ingredientes e preço.','Prometo pratos que não existem.','Entrego qualquer pedido à primeira mesa.'],0,[task('O cliente fez um pedido.', ['Confirmar prato e restrições alimentares','Ignorar a alergia','Cobrar antes de informar o valor'],0),task('A cozinha liberou o prato.', ['Deixar esfriar no chão','Conferir o pedido e a mesa','Trocar de prato'],1),task('No encerramento...', ['Conferir a conta e limpar a mesa','Cobrar novamente uma conta paga','Esquecer os utensílios'],0)])
  };
  const skills={cook:'culinaria',smith:'forja',fisher:'pesca',courier:'comercio',clerk:'comercio'};
  SS.JOBS=Object.freeze(Object.fromEntries(Object.entries({...baseJobs,...extraJobs}).map(([id,def])=>[id,Object.freeze({...def,skill:def.skill||skills[id]||'comercio'})])));
  SS.PROFESSIONS=Object.freeze({
    fisher:{name:'Pescador',skill:'pesca',service:'pier',icon:'fish',desc:'Pesque nos lagos e venda o pescado. A experiência vem de pescar de verdade.'},
    miner:{name:'Mineiro',skill:'mineracao',service:'smith',icon:'pickaxe',desc:'Compre uma picareta, extraia minérios e venda ou use na forja.'},
    cook:{name:'Cozinheiro',skill:'culinaria',service:'food',icon:'cooking',desc:'Cozinhe ingredientes reais em fogueiras e cozinhas; venda suas refeições.'},
    smith:{name:'Ferreiro',skill:'forja',service:'smith',icon:'anvil',desc:'Trabalhe nas bancadas de forja e transforme os seus materiais.'},
    alchemist:{name:'Alquimista',skill:'alquimia',service:'alchemy',icon:'potion',desc:'Recolha ingredientes e prepare fórmulas nos locais de alquimia.'},
    herbalist:{name:'Herbalista',skill:'coleta',service:'general',icon:'herb',desc:'Colete plantas pelo mundo, complete o herbário e negocie ingredientes.'},
    trader:{name:'Comerciante itinerante',skill:'comercio',service:'market',icon:'scales',desc:'Compre mercadorias, planeje a carga e negocie nas regiões que as valorizam.'},
    merchant:{name:'Lojista',skill:'comercio',service:'player-shop',icon:'shop',desc:'Contrate um ponto, compre lotes do fornecedor e negocie com os clientes.'},
    hunter:{name:'Caçador de recompensas',skill:'cacador',service:'guild',icon:'quest',desc:'Aceite contratos e cumpra os objetivos da guilda para receber a recompensa.'}
  });
  SS.availableJobs=(h,r,service)=>Object.entries(SS.JOBS).filter(([,j])=>(!j.cityOnly||SS.region(r)==='aurenna'||!!(E.WD.REGIONS[SS.region(r)]||{}).metro)&&(!service||service==='guild'||j.place===service)).map(([id,j])=>({id,...j,basePay:j.pay,pay:SS.jobPay(id,r)}));
  SS.jobsFor=(service,r,h=hero())=>SS.availableJobs(h,r,service);
  SS.chooseProfession=(h,id)=>{if(!h||!SS.PROFESSIONS[id])return result(false,'Profissão desconhecida.');SS.data(h).profession=id;save();return result(true,`Você escolheu seguir como ${SS.PROFESSIONS[id].name}. Pratique as atividades para evoluir; os outros ofícios continuam disponíveis.`,{profession:{id,...SS.PROFESSIONS[id]}});};
  SS.profession=(h=hero())=>{const id=h&&SS.data(h).profession;return id&&SS.PROFESSIONS[id]?{id,...SS.PROFESSIONS[id]}:null;};
  SS.region = (r) => { r = r || (E.Interior && E.Interior.current && E.Interior.current.region) || (E.WG.world && E.WG.world.id) || E.state.world.region || 'bosque'; const d=E.WD.REGIONS[r]; return d ? (d.cave ? d.parent : r) : 'bosque'; };
  SS.regionName = (r) => { const d=E.WD.REGIONS[SS.region(r)]; return d ? d.name : 'Vila de Elarion'; };
  SS.data = (h=hero()) => {
    if (!h) return null;
    const d=h.settlement=h.settlement||{};
    d.properties=d.properties||{};d.jobs=d.jobs||{};d.reputation=Math.max(0,Number(d.reputation)||0);d.lastBilledDay=d.lastBilledDay||clock().day;
    return d;
  };
  const propKey = (r,k) => `${SS.region(r)}:${k==='player-shop'?'shop':k}`;
  SS.property = (h,r,k) => {const d=SS.data(h);return d&&d.properties[propKey(r,k)]||null;};
  SS.getShop = (h,r) => SS.property(h,r,'shop');
  SS.hasAccess = (h,r,k) => {
    const p=SS.property(h,r,k);if(!p)return false;
    if(p.mode==='owned')return true;
    if(p.kind==='room')return p.nights>0&&clock().elapsed<=p.expiresAt;
    return !p.arrears && p.paidThrough>=clock().day;
  };
  const basicFurniture = () => [{uid:U.uid(),id:'bed',x:-2.3,z:-1.3,r:0},{uid:U.uid(),id:'table',x:1.4,z:-.8,r:0},{uid:U.uid(),id:'chair',x:1.4,z:.4,r:0}];
  SS.acquire = (h,r,kind,mode='rent') => {
    r=SS.region(r);kind=kind==='player-shop'?'shop':kind;
    if(!h||!SS.PRICES[kind]||!['rent','buy'].includes(mode)||(kind==='room'&&mode!=='rent'))return result(false,'Contrato inválido.');
    const d=SS.data(h),old=SS.property(h,r,kind),price=SS.prices(r,kind)[mode];
    if(old&&old.mode==='owned')return result(false,'Esta propriedade já é sua.');
    if(old&&SS.hasAccess(h,r,kind)&&mode==='rent')return result(false,'Você já tem um contrato ativo aqui.');
    if(old&&kind!=='room'&&mode==='rent')return result(false,'Regularize o aluguel do contrato existente para recuperar o acesso.');
    if(!Number.isFinite(h.gold)||h.gold<price)return result(false,`Você precisa de ${price} po.`);
    h.gold-=price;
    const p=d.properties[propKey(r,kind)]=Object.assign({region:r,kind,name:kind==='home'?'Meu lar':kind==='shop'?'Minha banca':kind==='casino'?'Meu cassino':'Quarto alugado',furniture:kind==='home'?basicFurniture():[],wall:'cream',wallUnlocks:['cream'],skin:'linen',skinUnlocks:['linen'],storage:{inventory:{},food:{},cargo:{}}},old||{}, {mode:mode==='buy'?'owned':'rent',paidThrough:clock().day,arrears:0,createdDay:clock().day});
    if(kind==='room'){p.nights=1;p.expiresAt=clock().elapsed+240;p.furniture=basicFurniture();}
    save();return result(true,kind==='room'?'Quarto reservado. Entre e use a cama para dormir.':mode==='buy'?'Compra concluída. A propriedade é sua.':`Contrato iniciado: ${price} po por dia do jogo.`,{property:p});
  };
  SS.payRent = (h,r,kind) => {
    const p=SS.property(h,r,kind);if(!p||p.mode==='owned'||kind==='room')return result(false,'Não há aluguel pendente.');
    if(p.paidThrough>=clock().day&&!p.arrears)return result(false,'O aluguel de hoje já está pago.');
    const days=Math.max(1,clock().day-p.paidThrough),cost=days*SS.prices(p.region,p.kind).rent;
    if(!Number.isFinite(h.gold)||h.gold<cost)return result(false,`Aluguel pendente: ${cost} po. Seus itens continuam guardados.`);
    h.gold-=cost;p.paidThrough=clock().day;p.arrears=0;save();return result(true,`Aluguel regularizado: ${cost} po.`);
  };
  SS.billDay = (h,day) => {
    const d=SS.data(h);if(!d||day<=d.lastBilledDay)return;
    for(const p of Object.values(d.properties)){
      if(p.mode!=='rent'||p.kind==='room'||p.paidThrough>=day)continue;
      const cost=(day-p.paidThrough)*SS.prices(p.region,p.kind).rent;
      if(h.gold>=cost){h.gold-=cost;p.paidThrough=day;p.arrears=0;}
      else p.arrears=cost;
    }
    d.lastBilledDay=day;save();
  };
  U.on('calendar:day',({day})=>{const h=hero();if(h)SS.billDay(h,day);});
  SS.canSleep = (h=hero()) => {const c=E.Interior&&E.Interior.current;return !!(c&&['home','room'].includes(c.kind)&&SS.hasAccess(h,c.region,c.kind));};
  SS.sleep = (h=hero()) => {
    if(!SS.canSleep(h))return result(false,'Durma na cama de um quarto alugado ou da sua casa.');
    const c=E.Interior.current,p=SS.property(h,c.region,c.kind),cl=clock();
    const hour=Number.isFinite(cl.decimalHour)?cl.decimalHour:Number(cl.hour)+(Number.isInteger(cl.hour)?(cl.minute||0)/60:0);
    let until=((8-hour+24)%24)*10;if(until<5)until+=240;
    const d=SS.data(h);if(d.activeShift)d.activeShift=null;
    if(c.kind==='room')p.nights=0;
    E.Sim.advance(until);E.C.longRest(h);
    const sd=E.Sim.data(h);sd.hunger=Math.max(0,sd.hunger-5);
    if(E.WG.world&&E.WG.world.hero)E.WG.world.hero.st=E.WG.STAMINA;
    save();U.emit('survival:changed');
    return result(true,'Você acordou às 08:00, descansado. Uma refeição ainda é importante.',{roomConsumed:c.kind==='room'});
  };
  SS.buyFurniture = (h,r,id) => {
    const p=SS.property(h,r,'home'),f=SS.FURNITURE[id];
    if(!p||!SS.hasAccess(h,r,'home'))return result(false,'Você precisa de acesso a uma casa nesta vila.');
    if(!f)return result(false,'Móvel desconhecido.');
    p.furniture=p.furniture||[];if(p.furniture.length>=18)return result(false,'A casa comporta até 18 móveis. Guarde ou reorganize os que já possui.');
    const price=SS.price(r,f.price);if(!Number.isFinite(h.gold)||h.gold<price)return result(false,`Você precisa de ${price} po.`);
    h.gold-=price;const n=p.furniture.length,placed={uid:U.uid(),id,x:-3+(n%4)*2,z:-2+Math.floor(n/4)*1.3,r:0,stored:true};p.furniture.push(placed);save();return result(true,'Móvel comprado. Escolha o lugar dele na casa e confirme.',{item:placed});
  };
  SS.placeFurniture = (h,r,uid,x,z,rotation=0) => {
    const p=SS.property(h,r,'home'),f=p&&(p.furniture||[]).find(v=>v.uid===uid);
    if(!f||!SS.hasAccess(h,r,'home'))return result(false,'Só o morador pode reorganizar os móveis desta casa.');
    const g=SS.HOME.grid,turn=Number.isFinite(+rotation)?Math.round(+rotation):0;x=Math.round(+x/g)*g;z=Math.round(+z/g)*g;
    const why=SS.canPlaceFurniture(p,uid,f.id,x,z,turn);if(why)return result(false,why);
    f.x=x;f.z=z;f.r=((turn%4)+4)%4*Math.PI/2;f.stored=false;save();return result(true,'Móvel posicionado.');
  };
  SS.storeFurniture = (h,r,uid) => {const p=SS.property(h,r,'home'),f=p&&(p.furniture||[]).find(v=>v.uid===uid);if(!f||!SS.hasAccess(h,r,'home'))return result(false,'Você precisa de acesso à casa para reorganizar os móveis.');f.stored=true;save();return result(true,'Móvel guardado. Você continua sendo o dono.');};
  SS.decorate = (h,r,type,id) => {
    const spec={skin:[SS.SKINS,'shop','linen'],wall:[SS.WALLS,'home','cream'],floor:[SS.FLOORS,'home','oak']}[type];
    const kind=spec&&spec[1],p=spec&&SS.property(h,r,kind),def=spec&&spec[0][id];
    if(!p||!SS.hasAccess(h,r,kind)||!def)return result(false,'A decoração não está disponível.');
    const field=type,unlock=field+'Unlocks';p[unlock]=p[unlock]||[spec[2]];
    if(!p[unlock].includes(id)){const price=SS.price(r,def.price);if(!Number.isFinite(h.gold)||h.gold<price)return result(false,`Você precisa de ${price} po.`);h.gold-=price;p[unlock].push(id);}
    p[field]=id;save();return result(true,'Decoração atualizada.');
  };
  SS.renameShop = (h,r,name) => {const p=SS.property(h,r,'shop');name=String(name||'').trim().slice(0,24);if(!p||!name||!SS.hasAccess(h,r,'shop'))return result(false,'Nome ou contrato inválido.');p.name=name;save();return result(true,'Nome da loja atualizado.');};
  SS.transfer = (h,r,kind,id,n,toStorage=true) => {
    const p=SS.property(h,r,'home');n=Number(n);
    if(!p||!SS.hasAccess(h,r,'home')||!['inventory','food','cargo'].includes(kind)||!integer(n,1,999))return result(false,'Transferência inválida.');
    p.storage=p.storage||{inventory:{},food:{},cargo:{}};p.storage[kind]=p.storage[kind]||{};
    const source=kind==='food'?E.Sim.data(h).food:kind==='cargo'?E.Life.data(h).cargo:h.inventory;
    if(!source)return result(false,'Inventário indisponível.');
    const a=toStorage?source:p.storage[kind],b=toStorage?p.storage[kind]:source;
    if((Number(a[id])||0)<n)return result(false,'Quantidade insuficiente.');
    if(!toStorage&&kind==='cargo'&&E.Life.cargoCount(h)+n>E.Life.cap(h))return result(false,'Sua carroça não comporta essa carga.');
    a[id]-=n;if(!a[id])delete a[id];b[id]=(Number(b[id])||0)+n;save();return result(true,toStorage?'Itens guardados.':'Itens retirados.');
  };
  const jobs = (h,r) => {const d=SS.data(h),k=SS.region(r);return d.jobs[k]=d.jobs[k]||{interviewDay:0,lastShiftDay:0};};
  SS.jobData = (h,r) => jobs(h,r);
  SS.resign=(h,r)=>{const d=SS.data(h),j=jobs(h,r);if(!j.contract)return result(false,'Você não tem contrato de trabalho nesta região.');if(d.activeShift&&d.activeShift.region===SS.region(r))d.activeShift=null;const name=SS.JOBS[j.contract]&&SS.JOBS[j.contract].name||'emprego';j.contract=null;j.appointment=null;save();return result(true,`Você encerrou o contrato de ${name}. Um turno não concluído não gera salário.`);};
  SS.scheduleInterview = (h,r,id,options={}) => {
    const def=SS.JOBS[id];if(!def||!SS.availableJobs(h,r).some(j=>j.id===id))return result(false,'Esta vaga não está disponível nesta região. Procure os empregadores de Aurenna.');const j=jobs(h,r),cl=clock(),where=currentPlace(),place=options.atEmployer?def.place:'guild';
    if(!where||where.region!==SS.region(r)||where.kind!==place)return result(false,`Peça a entrevista no estabelecimento: ${SS.placeName(place)}.`);
    if(j.interviewDay===cl.day)return result(false,'Você já fez uma entrevista nesta vila hoje. Volte amanhã.');
    if(j.appointment&&j.appointment.until>cl.elapsed)return result(false,'Você já tem uma entrevista marcada.');
    j.appointment={id,place,at:cl.elapsed+10,until:cl.elapsed+50};save();return result(true,'Entrevista marcada para daqui a uma hora do jogo (10 segundos de jogo ativo).');
  };
  SS.interview = (h,r,answer) => {
    const j=jobs(h,r),a=j.appointment,cl=clock(),where=currentPlace();
    if(!where||where.kind!==(a&&a.place||'guild')||where.region!==SS.region(r))return result(false,`Compareça a ${SS.placeName(a&&a.place||'guild')} nesta região para fazer a entrevista.`);
    if(!a||cl.elapsed<a.at)return result(false,'A entrevista ainda não começou.');
    if(cl.elapsed>a.until){j.appointment=null;save();return result(false,'Você perdeu o horário. Marque outra entrevista.');}
    const def=SS.JOBS[a.id];if(!integer(answer,0,def.interview.length-1))return result(false,'Resposta inválida.');
    j.interviewDay=cl.day;j.appointment=null;const fit=+answer===def.answer,roll=U.die(20),bonus=fit?7:0,rep=Math.min(3,Math.floor(SS.data(h).reputation/20));
    const ok=roll+bonus+rep>=12;if(ok)j.contract=a.id;
    save();return result(ok,ok?`Contratado como ${def.name}! O empregador fornece os materiais do turno.`:'O responsável escolheu outro candidato. Você pode tentar novamente no próximo dia.',{roll,bonus,reputation:rep});
  };
  SS.startShift = (h,r) => {
    const d=SS.data(h),j=jobs(h,r),def=SS.JOBS[j.contract],c=currentPlace();
    if(!def)return result(false,'Você ainda precisa ser contratado.');
    if(d.activeShift)return result(false,'Você já tem um turno em andamento.');
    if(!Number.isFinite(h.gold))return result(false,'Saldo de ouro inválido.');
    if(j.lastShiftDay===clock().day)return result(false,'O turno de hoje já foi pago. Volte amanhã.');
    if(!c||c.region!==SS.region(r)||c.kind!==def.place)return result(false,`Vá ao local de trabalho: ${SS.placeName(def.place)}.`);
    d.activeShift={id:j.contract,region:SS.region(r),day:clock().day,worked:0,answers:[],finished:false};save();return result(true,'Turno iniciado. Faça as três etapas e permaneça no estabelecimento até terminar.');
  };
  SS.workTick = (dt,current) => {
    const h=hero(),d=h&&SS.data(h),s=d&&d.activeShift;if(!s||!current||s.region!==current.region||SS.JOBS[s.id].place!==current.kind||(typeof document!=='undefined'&&document.hidden))return;
    if(Number.isFinite(dt)&&dt>0)s.worked=Math.min(SS.JOBS[s.id].duration,s.worked+Math.min(dt,.25));
  };
  SS.answerTask = (h,index,answer) => {const s=SS.data(h).activeShift,def=s&&SS.JOBS[s.id];if(!def||index!==s.answers.length||!def.tasks[index]||!integer(answer,0,def.tasks[index].a.length-1))return result(false,'Etapa inválida.');s.answers.push(+answer);save();return result(true,'Etapa registrada.');};
  SS.finishShift = (h,r) => {
    const d=SS.data(h),s=d.activeShift,def=s&&SS.JOBS[s.id],j=jobs(h,r),c=currentPlace();
    if(!s||s.region!==SS.region(r)||!def||s.worked<def.duration||s.answers.length!==def.tasks.length)return result(false,'Conclua as etapas e o tempo do turno.');
    if(!c||c.region!==s.region||c.kind!==def.place)return result(false,'Receba seu salário no estabelecimento onde trabalhou.');
    if(!Number.isFinite(h.gold)||j.lastShiftDay===clock().day)return result(false,'Este pagamento já foi registrado ou o saldo é inválido.');
    const correct=s.answers.filter((a,i)=>a===def.tasks[i].ok).length,pay=Math.round(SS.jobPay(s.id,s.region)*(.55+.15*correct));
    j.lastShiftDay=clock().day;j.shifts=(j.shifts||0)+1;d.reputation+=correct;h.gold+=pay;d.activeShift=null;
    if(E.Sim){const sd=E.Sim.data(h);sd.hunger=Math.max(0,sd.hunger-3);}if(E.Life&&E.Life.addXp&&E.L&&E.L.PROFS&&E.L.PROFS[def.skill])E.Life.addXp(h,def.skill,correct*3);save();return result(true,`Turno concluído: ${correct}/3 etapas corretas. Salário: ${pay} po.`,{pay,correct});
  };
  SS.placeName = (kind) => ({inn:'Pousada',room:'Quarto da pousada',home:'Sua casa',general:'Empório e peixaria',smith:'Forja',food:'Cozinha e mercearia',furniture:'Marcenaria',guild:'Casa dos ofícios','player-shop':'Sua loja','player-casino':'Seu cassino',casino:'Cassino Fortuna Dourada',market:'Bolsa de Mercadorias',arena:'Arena dos Gladiadores',alchemy:'Alquimista das Mil Cores',pier:'Píer dos Pescadores'})[kind]||'Estabelecimento';
  SS.canEnter = (kind,r) => {
    r=SS.region(r);const c=E.Interior&&E.Interior.current;
    if(c&&c.region===r&&((c.kind==='inn'&&kind==='room')||(c.kind==='room'&&kind==='inn')||c.kind===kind))return true;
    if(c)return false;
    const w=E.WG.world,p=w&&w.hero;if(!w||!p||w.id!==r)return false;
    const cityKinds={cassino:'casino',guilda:'guild',bolsa:'market',arena:'arena',taverna:'food',alquimista:'alchemy',forja:'smith',emporio:'general',pier:'pier'};
    return (w.interactables||[]).some(it=>{
      const service=it.kind==='settlement'?it.service:it.kind==='building'?cityKinds[it.b]:null;
      return service===kind&&Math.hypot(p.x-it.x,p.z-it.z)<=(it.r||3)+1;
    });
  };
  SS.enter = (kind,r,id) => {
    const h=hero();if(!h)return;
    r=SS.region(r);kind=({taverna:'food',forja:'smith',emporio:'general',guilda:'guild',bolsa:'market',casa:'home',loja:'player-shop',hotel:'inn'})[kind]||kind;
    if(E.WorldServices&&!['home','inn','room'].includes(kind))return E.WorldServices.service(kind,r);
    if(kind==='home'&&!SS.hasAccess(h,r,'home'))return SS.open(r,'moradia');
    if(kind==='player-shop'&&!SS.hasAccess(h,r,'shop'))return SS.open(r,'loja');
    if(kind==='room'&&!SS.hasAccess(h,r,'room'))return SS.open(r,'pousada');
    if(!SS.canEnter(kind,r)){E.UI.toast(`Vá até a porta de ${SS.placeName(kind)} na vila para entrar. Se estiver dentro de outro prédio, saia primeiro.`);return result(false,'Aproxime-se da porta do estabelecimento.');}
    E.UI.closeAll();E.Interior.open({kind,region:r,title:SS.placeName(kind),id});
  };
  SS.open = (r,tab) => {
    r=SS.region(r);
    if(E.WorldServices){const kind=({emporio:'general',comida:'food',pousada:'inn',moradia:'home',loja:'player-shop',moveis:'furniture',organizar:'home',trabalho:'guild'})[tab]||'guild';return E.WorldServices.service(kind,r);}
    return E.SettlementUI&&E.SettlementUI.open(r,tab);
  };
  SS.service = (kind,r) => {
    if(E.WorldServices)return E.WorldServices.service(kind,SS.region(r));
    if(kind==='casino')return E.Casino.open();
    if(kind==='market')return E.Trade.open(r,{bolsa:true});
    if(kind==='arena')return E.Guild.open('arena');
    if(kind==='alchemy')return E.Craft.open('alquimia');
    if(kind==='pier')return E.Craft.open('pier');
    if(kind==='smith')return E.Armory.open({title:'Forja da vila'});
    if(kind==='player-shop')return E.Vendor?E.Vendor.open(r):SS.open(r,'loja');
    if(kind==='furniture')return SS.open(r,'moveis');
    if(kind==='guild')return SS.open(r,'trabalho');
    if(kind==='inn')return SS.open(r,'pousada');
    if(kind==='general')return SS.open(r,'emporio');
    if(kind==='food')return SS.open(r,'comida');
    if(kind==='home')return SS.open(r,'organizar');
    return SS.open(r);
  };
  E.Settlements=SS;
})();
