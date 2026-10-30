/* A physical, player-owned casino. Guests bring finite wallets; every game
   transfers its actual stake and payout through a separate, finite house float. */
(() => {
  'use strict';
  const CB={},U=E.U,S=()=>E.Settlements,hero=()=>E.Store.hero(),clock=()=>E.Sim.clock();
  const region=r=>S().region(r),whole=(n,max=99999999)=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<=max;
  const result=(ok,message,more={})=>Object.assign({ok,message},more);
  const save=(h,r)=>{E.Store.save();U.emit('casino:changed',{heroId:h&&h.id,region:r});};
  const place=()=>E.Interior&&E.Interior.current||E.WorldServices&&E.WorldServices.currentPlace&&E.WorldServices.currentPlace();
  function at(r){
    r=region(r);const p=place();if(p&&p.region===r&&p.kind==='player-casino')return true;
    const w=E.WG&&E.WG.world,h=w&&w.hero;if(!w||w.id!==r||!h||E.Interior&&E.Interior.current)return false;
    return(w.venues||[]).some(v=>{if(v.service!=='player-casino')return false;const dx=h.x-v.x,dz=h.z-v.z,c=Math.cos(v.rotation||0),s=Math.sin(v.rotation||0);return Math.abs(c*dx-s*dz)<v.w/2+.25&&Math.abs(s*dx+c*dz)<v.d/2+.5;});
  }
  const active=(employee)=>!employee.arrears&&employee.paidThrough>=clock().day;
  CB.TABLES=Object.freeze({
    roulette:Object.freeze({name:'Roleta do salão',model:'roulette',cost:3200,reserve:5000,stake:200,maxStake:700,payout:2,sides:37,wins:18,desc:'Apostas de cor: 18 resultados ganham em 37. Vitória devolve duas vezes a aposta.'}),
    dice:Object.freeze({name:'Mesa de Dados da Fortuna',model:'dice-table',cost:2400,reserve:5000,stake:150,maxStake:500,payout:5,sides:6,wins:1,desc:'O visitante aposta em um resultado do dado. Um acerto em seis devolve cinco vezes a aposta.'}),
    blackjack:Object.freeze({name:'Mesa de Vinte-e-Um',model:'cards-table',cost:4800,reserve:5000,stake:300,maxStake:900,payout:2.5,desc:'Vinte-e-Um com baralho de 52 cartas. Visitante e casa param em 17; empate devolve a aposta, vitória paga 2× e blackjack natural paga 2,5×.'})
  });
  CB.CANDIDATES=Object.freeze([
    Object.freeze({id:'silvia',name:'Sílvia Moura',role:'dealer',wage:260,fee:1200,desc:'Crupiê: conduz as rodadas dos visitantes que chegam às mesas.'}),
    Object.freeze({id:'dante',name:'Dante Reis',role:'cashier',wage:180,fee:900,desc:'Caixa e recepção: organiza a entrada, permitindo atender mais visitantes.'})
  ]);
  CB.prices=r=>S().prices(region(r),'casino');
  CB.access=(h=hero(),r)=>!!h&&S().isMetro(r)&&S().hasAccess(h,region(r),'casino');
  CB.data=(h=hero(),r)=>{
    if(!h)return null;r=region(r);
    const d=h.casinoBusiness=h.casinoBusiness&&typeof h.casinoBusiness==='object'&&!Array.isArray(h.casinoBusiness)?h.casinoBusiness:{version:1,venues:{}};
    d.version=1;d.venues=d.venues&&typeof d.venues==='object'&&!Array.isArray(d.venues)?d.venues:{};
    const s=d.venues[r]=d.venues[r]||{};
    s.cash=Number.isSafeInteger(s.cash)&&s.cash>=0?s.cash:0;s.open=!!s.open;s.serial=Number.isSafeInteger(s.serial)&&s.serial>=0?s.serial:0;
    s.tables=Array.isArray(s.tables)?s.tables.filter(t=>t&&CB.TABLES[t.type]&&typeof t.id==='string').slice(0,3):[];
    s.staff=Array.isArray(s.staff)?s.staff.filter(e=>e&&typeof e.id==='string'&&['dealer','cashier'].includes(e.role)).slice(0,2):[];
    s.clients=Array.isArray(s.clients)?s.clients.filter(c=>c&&typeof c.id==='string'&&c.state==='waiting').slice(0,3):[];
    s.history=Array.isArray(s.history)?s.history.slice(0,30):[];
    for(const key of ['revenue','payouts','rounds','arrival','worked'])s[key]=Number.isFinite(s[key])&&s[key]>=0?s[key]:0;
    s.net=Number.isFinite(s.net)?s.net:0;
    return s;
  };
  const guard=(h,r)=>!h?result(false,'Escolha um personagem.'):!S().isMetro(r)?result(false,'O licenciamento de cassino está disponível em Aurenna.'):!at(r)?result(false,'Vá ao balcão do seu ponto de cassino.'):null;
  CB.requiredReserve=(h=hero(),r)=>{const s=CB.data(h,r);return s&&s.tables.length?Math.max(...s.tables.map(t=>CB.TABLES[t.type].reserve)):5000;};
  CB.liability=(h=hero(),r)=>{const s=CB.data(h,r);return s&&s.tables.length?Math.max(...s.tables.map(t=>Math.ceil(CB.TABLES[t.type].maxStake*(CB.TABLES[t.type].payout-1)))):0;};
  CB.acquire=(h,r,mode='rent')=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;
    const res=S().acquire(h,r,'casino',mode);if(!res.ok)return res;
    CB.data(h,r);save(h,r);return result(true,mode==='buy'?'Ponto de cassino comprado. Instale as mesas e deposite a reserva do salão.':'Ponto de cassino alugado. O aluguel usa o calendário do jogo; instale as mesas e o caixa.',{property:res.property});
  };
  CB.payRent=(h,r)=>{const blocked=guard(h,r);return blocked||S().payRent(h,region(r),'casino');};
  CB.deposit=(h,r,amount)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;if(!CB.access(h,r))return result(false,'Regularize o contrato do cassino.');
    if(!whole(amount)||!Number.isFinite(h.gold)||h.gold<Number(amount))return result(false,'Informe um depósito inteiro que caiba na sua bolsa.');
    const s=CB.data(h,r);amount=Number(amount);if(!Number.isSafeInteger(s.cash+amount))return result(false,'O caixa não comporta esse valor.');
    h.gold-=amount;s.cash+=amount;save(h,r);return result(true,`${amount} po depositados no caixa do salão.`,{cash:s.cash});
  };
  CB.withdraw=(h,r,amount)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;
    const s=CB.data(h,r);if(!whole(amount)||Number(amount)>s.cash||!Number.isFinite(h.gold))return result(false,'O caixa não contém essa quantia.');
    amount=Number(amount);if(s.open&&s.cash-amount<CB.requiredReserve(h,r))return result(false,'Feche as mesas antes de retirar a reserva de pagamento.');
    h.gold+=amount;s.cash-=amount;save(h,r);return result(true,`${amount} po retirados do caixa.`,{cash:s.cash});
  };
  CB.buyTable=(h,r,type)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;if(!CB.access(h,r))return result(false,'Regularize o contrato do cassino.');
    const s=CB.data(h,r),def=CB.TABLES[type];if(!def)return result(false,'Mesa desconhecida.');
    if(s.tables.some(t=>t.type===type)||s.tables.length>=3)return result(false,'Este salão comporta uma mesa de cada modalidade, até três mesas.');
    if(!Number.isFinite(h.gold)||h.gold<def.cost)return result(false,`A instalação custa ${def.cost} po.`);
    h.gold-=def.cost;const table={id:'table-'+(++s.serial),type,rounds:0};s.tables.push(table);save(h,r);return result(true,`${def.name} instalada no salão.`,{table});
  };
  CB.setOpen=(h,r,open)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;const s=CB.data(h,r);
    if(open&&(!CB.access(h,r)||!s.tables.length))return result(false,'É preciso um contrato em dia e pelo menos uma mesa instalada.');
    if(open&&s.cash<CB.requiredReserve(h,r))return result(false,`Deposite uma reserva de pelo menos ${CB.requiredReserve(h,r)} po para pagar as possíveis vitórias.`);
    s.open=!!open;if(!open){for(const c of s.clients)c.state='left';s.clients=[];}
    save(h,r);return result(true,open?'Mesas abertas. Receba os visitantes ou contrate um crupiê para conduzir as rodadas.':'Mesas fechadas. A reserva continua guardada no salão.');
  };
  CB.candidates=(h=hero(),r)=>{const s=CB.data(h,r);return s?CB.CANDIDATES.filter(c=>!s.staff.some(e=>e.candidateId===c.id)).map(c=>({...c})):[];};
  CB.staff=(h=hero(),r)=>{const s=CB.data(h,r);return s?s.staff.map(e=>({...e,active:CB.access(h,r)&&active(e)})):[];};
  CB.hire=(h,r,id)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;if(!CB.access(h,r))return result(false,'Regularize o contrato do cassino.');
    const s=CB.data(h,r),candidate=CB.candidates(h,r).find(c=>c.id===id);if(!candidate||s.staff.length>=2)return result(false,'Este candidato não está disponível.');
    const cost=candidate.fee+candidate.wage;if(!Number.isFinite(h.gold)||h.gold<cost)return result(false,`A admissão e a primeira diária custam ${cost} po.`);
    h.gold-=cost;const employee={...candidate,candidateId:candidate.id,id:'casino-employee-'+(++s.serial),paidThrough:clock().day,billedThrough:clock().day,arrears:0};s.staff.push(employee);save(h,r);return result(true,`${employee.name} contratado; primeira diária paga.`,{employee});
  };
  CB.payWages=(h,r)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;const s=CB.data(h,r),due=s.staff.reduce((n,e)=>n+(e.arrears||0),0);
    if(!due)return result(false,'Os salários estão em dia.');if(!Number.isFinite(h.gold)||h.gold<due)return result(false,`Salários pendentes: ${due} po.`);
    h.gold-=due;for(const e of s.staff){e.arrears=0;e.paidThrough=e.billedThrough=clock().day;}save(h,r);return result(true,`${due} po de salários regularizados.`);
  };
  CB.dismiss=(h,r,id)=>{
    r=region(r);const blocked=guard(h,r);if(blocked)return blocked;const s=CB.data(h,r),index=s.staff.findIndex(e=>e.id===id);
    if(index<0)return result(false,'Funcionário não encontrado.');if(s.staff[index].arrears)return result(false,'Quite o salário pendente antes de encerrar o contrato.');
    const[e]=s.staff.splice(index,1);save(h,r);return result(true,`Contrato de ${e.name} encerrado. A diária já paga não é reembolsada.`);
  };
  function admit(h,r){
    const s=CB.data(h,r);if(!CB.access(h,r)||!s.open||s.clients.length>=3||!s.tables.length)return result(false,'As mesas não podem receber mais visitantes agora.');
    const table=s.tables[Math.floor(U.seeded((s.serial+1)*1789+clock().day*31)()*s.tables.length)],def=CB.TABLES[table.type],id=++s.serial;
    const rng=U.seeded(id*2731+clock().day*17),stake=Math.floor((def.stake+rng()*(def.maxStake-def.stake))/10)*10;
    if(s.cash<stake*(def.payout-1))return result(false,'O salão precisa recompor a reserva antes de aceitar esta aposta.');
    const client={id:'casino-guest-'+id,name:['Amélia','Lourenço','Cora','Dante','Isadora','Nilo','Celina','Tomás'][Math.floor(rng()*8)],portrait:Math.floor(rng()*8),budget:Math.max(stake,Math.floor(1000+rng()*7000)),stake,betColor:rng()<.5?'red':'black',tableId:table.id,state:'waiting',arrivedAtCounter:false,createdAt:clock().elapsed,expires:clock().elapsed+100};
    s.clients.push(client);save(h,r);return result(true,`${client.name} chegou ao salão.`,{client});
  }
  CB.admit=(h,r)=>{r=region(r);const blocked=guard(h,r);return blocked||admit(h,r);};
  const RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  function blackjack(){
    const deck=Array.from({length:52},(_,id)=>({rank:id%13+1,suit:['clubs','diamonds','hearts','spades'][Math.floor(id/13)]}));
    for(let i=deck.length-1;i>0;i--){const j=Math.max(0,Math.min(i,U.die(i+1)-1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    const total=cards=>{let n=cards.reduce((sum,c)=>sum+(c.rank===1?11:Math.min(c.rank,10)),0),aces=cards.filter(c=>c.rank===1).length;while(n>21&&aces-->0)n-=10;return n;};
    const guest=[deck.pop(),deck.pop()],dealer=[deck.pop(),deck.pop()];
    const guestNatural=total(guest)===21,dealerNatural=total(dealer)===21;
    if(!guestNatural&&!dealerNatural){while(total(guest)<17)guest.push(deck.pop());if(total(guest)<=21)while(total(dealer)<17)dealer.push(deck.pop());}
    const guestTotal=total(guest),dealerTotal=total(dealer);
    const push=(guestNatural&&dealerNatural)||guestTotal<=21&&guestTotal===dealerTotal;
    const won=!push&&guestTotal<=21&&(guestNatural&&!dealerNatural||!dealerNatural&&(dealerTotal>21||guestTotal>dealerTotal));
    return{guest,dealer,guestTotal,dealerTotal,guestNatural,dealerNatural,push,won,multiplier:push?1:won?(guestNatural?2.5:2):0};
  }
  function resolve(h,r,clientId,tableId){
    const s=CB.data(h,r),client=s.clients.find(c=>c.id===clientId&&c.state==='waiting'),table=s.tables.find(t=>t.id===(tableId||client&&client.tableId));
    if(!CB.access(h,r)||!s.open)return result(false,'As mesas estão fechadas ou o contrato está pendente.');
    if(!client||client.expires<=clock().elapsed)return result(false,'Este visitante já seguiu caminho.');
    if(!client.arrivedAtCounter)return result(false,'Aguarde o visitante chegar à mesa.');
    if(!table||client.tableId!==table.id)return result(false,'Este visitante está aguardando outra mesa.');
    const def=CB.TABLES[table.type],stake=Number(client.stake);
    if(!whole(stake,def.maxStake)||stake<def.stake||client.budget<stake)return result(false,'A aposta não é válida para esta mesa.');
    if(s.cash<stake*(def.payout-1)){s.open=false;save(h,r);return result(false,'Reserva insuficiente. As mesas foram fechadas antes de aceitar a aposta.');}
    const cards=table.type==='blackjack'?blackjack():null,roll=cards?cards.guestTotal:table.type==='roulette'?U.die(37)-1:U.die(6),won=cards?cards.won:table.type==='dice'?roll===6:roll!==0&&(RED.has(roll)?'red':'black')===client.betColor,payout=cards?Math.round(stake*cards.multiplier):won?stake*def.payout:0,net=stake-payout;
    s.cash+=net;client.budget+=payout-stake;client.state='played';s.clients=s.clients.filter(c=>c!==client);table.rounds=(table.rounds||0)+1;s.rounds++;s.revenue+=stake;s.payouts+=payout;s.net+=net;
    const entry={id:'round-'+(++s.serial),day:clock().day,client:client.name,clientId:client.id,game:table.type,stake,payout,net,roll,won,push:!!(cards&&cards.push),betColor:client.betColor,cards};s.history.unshift(entry);s.history.length=Math.min(30,s.history.length);
    if(s.cash<CB.liability(h,r))s.open=false;
    save(h,r);return result(true,cards&&cards.push?`${client.name} empatou. A aposta foi devolvida pelo caixa.`:won?`${client.name} venceu: ${payout} po pagos pelo caixa do salão.`:`${client.name} encerrou a rodada. A aposta de ${stake} po entrou no caixa.`,{outcome:cards&&cards.push?'push':won?'won':'lost',roll,stake,payout,net,cards,betColor:client.betColor,game:table.type,client,table,round:entry,cash:s.cash});
  }
  CB.play=(h,r,clientId,tableId)=>{r=region(r);const blocked=guard(h,r);return blocked||resolve(h,r,clientId,tableId);};
  CB.billDay=(h,day)=>{
    if(!h||!Number.isSafeInteger(day)||day<1)return;const d=h.casinoBusiness;if(!d||!d.venues)return;let changed=false;
    for(const r of Object.keys(d.venues))for(const e of CB.data(h,r).staff){
      const last=Number.isSafeInteger(e.billedThrough)?e.billedThrough:e.paidThrough||day;if(day<=last)continue;
      e.billedThrough=day;e.arrears=(e.arrears||0)+(day-last)*e.wage;
      if(Number.isFinite(h.gold)&&h.gold>=e.arrears){h.gold-=e.arrears;e.arrears=0;e.paidThrough=day;}changed=true;
    }
    if(changed)save(h,null);
  };
  CB.tick=dt=>{
    const h=hero();if(!h||h.dead||!Number.isFinite(dt)||dt<=0||typeof document!=='undefined'&&document.hidden)return;
    if(E.WG&&E.WG.mode&&!['world','interior'].includes(E.WG.mode()))return;
    const d=h.casinoBusiness;if(!d||!d.venues)return;dt=Math.min(.25,dt);
    for(const r of Object.keys(d.venues)){
      const s=CB.data(h,r);if(!s.open)continue;
      if(!CB.access(h,r)||s.cash<CB.liability(h,r)){s.open=false;save(h,r);continue;}
      const dealer=s.staff.find(e=>e.role==='dealer'&&active(e)),owner=at(r);if(!dealer&&!owner)continue;
      const before=s.clients.length;s.clients=s.clients.filter(c=>c.state==='waiting'&&c.expires>clock().elapsed);if(before!==s.clients.length)save(h,r);
      s.arrival=Math.min(14,s.arrival+dt);const cadence=s.staff.some(e=>e.role==='cashier'&&active(e))?5:7;
      if(s.arrival>=cadence&&s.clients.length<3){s.arrival-=cadence;admit(h,r);}
      const w=E.WG&&E.WG.world;if(w&&w.id!==r)for(const c of s.clients)if(clock().elapsed>=c.createdAt+20)c.arrivedAtCounter=true;
      if(!dealer)continue;s.worked=Math.min(5,s.worked+dt);if(s.worked<5)continue;
      const p=place();if(E.WorldServices&&E.WorldServices.active&&p&&p.kind==='player-casino'&&p.region===r)continue;
      const client=s.clients.find(c=>c.arrivedAtCounter);if(client){resolve(h,r,client.id,client.tableId);s.worked=0;}
    }
  };
  U.on('calendar:day',({day})=>{const h=hero();if(h)CB.billDay(h,day);});
  E.CasinoBusiness=CB;
})();
