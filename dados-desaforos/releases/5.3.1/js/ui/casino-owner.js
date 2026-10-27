/* Licenciamento e operação junto aos objetos do salão do jogador. */
(() => {
  'use strict';
  const O={},H=()=>E.Store.hero(),B=()=>E.CasinoBusiness,S=()=>E.Settlements,U=E.U;
  const note=r=>{if(r&&r.message)E.UI.toast(r.message,r.ok?'gold':'');if(E.HUD)E.HUD.update();return r;};
  const card=(it,opts)=>E.WorldServices.open({...opts,anchor:it,icon:opts.icon||'casino'});
  const refresh=(it,fn)=>r=>{note(r);if(E.CasinoLife&&E.WG.world)E.CasinoLife.sync(E.WG.world);fn(it);};
  function license(it){
    const h=H(),r=it.region,p=S().property(h,r,'casino'),price=B().prices(r),actions=[];
    if(B().access(h,r))return vault(it);
    if(p&&p.mode==='rent')actions.push({label:'Regularizar aluguel do salão',run:()=>refresh(it,license)(B().payRent(h,r))});
    if(!p)actions.push({label:`Alugar salão · ${price.rent} po/dia`,disabled:h.gold<price.rent,run:()=>refresh(it,license)(B().acquire(h,r,'rent'))});
    if(!p||p.mode!=='owned')actions.push({label:`Comprar salão · ${price.buy} po`,disabled:h.gold<price.buy,run:()=>refresh(it,license)(B().acquire(h,r,'buy'))});
    card(it,{title:'Seu cassino em Aurenna',text:`Este salão pode ser seu. Aluguel: ${price.rent} po por dia; compra: ${price.buy} po. As mesas e a reserva para pagar prêmios são separadas. Você pode trabalhar nas próprias mesas ou contratar crupiê e caixa.`,actions});
  }
  function vault(it){
    if(!B().access(H(),it.region))return license(it);
    const d=B().data(H(),it.region),required=B().requiredReserve(H(),it.region);
    card(it,{title:'Caixa do seu cassino',text:`Salão ${d.open?'aberto':'fechado'} · caixa ${d.cash} po · ${d.tables.length} mesa(s). Reserve pelo menos ${required} po para os prêmios. O ouro do caixa pertence ao negócio e pode diminuir quando os visitantes ganham.`,actions:[
      {label:d.open?'Fechar as mesas':'Abrir as mesas',run:()=>refresh(it,vault)(B().setOpen(H(),it.region,!d.open))},
      {label:'Depositar ou retirar ouro',run:()=>funds(it)},
      {label:'Instalar e conhecer mesas',run:()=>tables(it)},
      {label:'Contratar e pagar equipe',run:()=>staff(it)},
      {label:'Conferir o livro-caixa',primary:false,run:()=>ledger(it)}
    ]});
  }
  function funds(it){
    const d=B().data(H(),it.region),minimum=Math.max(1,B().requiredReserve(H(),it.region)-d.cash);
    card(it,{title:'Reserva para os prêmios',text:`Seu bolso: ${H().gold} po. Caixa do cassino: ${d.cash} po. O depósito transfere o seu ouro; os prêmios são pagos exclusivamente desta reserva.`,html:`<label>Quantia em ouro<input data-casino-amount type="number" inputmode="numeric" min="1" max="99999999" value="${minimum}"></label>`,actions:[
      {label:'Depositar no caixa',run:el=>refresh(it,funds)(B().deposit(H(),it.region,Number(el.querySelector('[data-casino-amount]').value)))},
      {label:'Retirar para a mochila',primary:false,run:el=>refresh(it,funds)(B().withdraw(H(),it.region,Number(el.querySelector('[data-casino-amount]').value)))},
      {label:'Voltar ao caixa',primary:false,run:()=>vault(it)}
    ]});
  }
  function tables(it,page=0){
    const ids=Object.keys(B().TABLES),type=ids[((page%ids.length)+ids.length)%ids.length],def=B().TABLES[type],d=B().data(H(),it.region),owned=d.tables.some(t=>t.type===type);
    card(it,{title:def.name,text:`${def.desc} Instalação: ${def.cost} po. Reserva mínima do salão: ${def.reserve} po. A mesa aparece neste salão e recebe visitantes enquanto a casa estiver aberta.`,actions:[
      {label:owned?'Mesa já instalada':`Instalar esta mesa · ${def.cost} po`,disabled:owned||H().gold<def.cost,run:()=>refresh(it,i=>tables(i,page))(B().buyTable(H(),it.region,type))},
      {label:'Conhecer outra mesa',primary:false,run:()=>tables(it,page+1)},
      {label:'Voltar ao caixa',primary:false,run:()=>vault(it)}
    ]});
  }
  function staff(it,page=0,hiring=false){
    const h=H(),r=it.region,crew=B().staff(h,r),candidates=B().candidates(h,r),rows=hiring?candidates:crew;
    if(!rows.length&&!hiring)return card(it,{title:'Equipe do cassino',text:'Você pode conduzir as rodadas pessoalmente. Um crupiê pago atende os visitantes; um caixa organiza a recepção. Os salários usam os dias do calendário do jogo.',actions:[{label:'Conhecer candidatos do cassino',run:()=>staff(it,0,true)},{label:'Voltar ao caixa',primary:false,run:()=>vault(it)}]});
    const e=rows[((page%rows.length)+rows.length)%rows.length];
    if(!e)return card(it,{title:'Equipe completa',text:'Os candidatos já foram contratados. Confira o salário e a situação da sua equipe.',actions:[{label:'Ver minha equipe',run:()=>staff(it)}]});
    if(hiring)return card(it,{title:e.name,text:`${e.desc} Contratação: ${e.fee} po + ${e.wage} po do primeiro dia. Depois: ${e.wage} po por dia.`,actions:[{label:`Contratar ${e.name} · ${e.fee+e.wage} po`,disabled:h.gold<e.fee+e.wage,run:()=>refresh(it,staff)(B().hire(h,r,e.id))},{label:'Próximo candidato',primary:false,run:()=>staff(it,page+1,true)},{label:'Ver minha equipe',primary:false,run:()=>staff(it)}]});
    card(it,{title:e.name+' · '+(e.role==='dealer'?'Crupiê':'Caixa'),text:`Salário: ${e.wage} po/dia. ${e.active?'Em serviço.':`Pagamento pendente: ${e.arrears||0} po. Serviço suspenso.`}`,actions:[{label:'Regularizar salários',disabled:!crew.some(x=>x.arrears>0),run:()=>refresh(it,staff)(B().payWages(h,r))},{label:'Contratar outra pessoa',run:()=>staff(it,0,true)},{label:'Próximo funcionário',primary:false,disabled:crew.length<2,run:()=>staff(it,page+1)},{label:'Encerrar este contrato',primary:false,run:()=>refresh(it,staff)(B().dismiss(h,r,e.id))},{label:'Voltar ao caixa',primary:false,run:()=>vault(it)}]});
  }
  function ledger(it){
    const d=B().data(H(),it.region);
    card(it,{title:'Livro-caixa do salão',text:`${d.rounds} rodada(s). Apostas recebidas: ${d.revenue} po. Prêmios pagos: ${d.payouts} po. Resultado das mesas: ${d.revenue-d.payouts} po. Caixa disponível: ${d.cash} po.`,html:d.history.slice(0,4).map(e=>`<p>${U.esc(e.client||e.name||'Rodada')} · ${U.esc(e.game||e.type||'mesa')} · ${Number(e.net)||0} po</p>`).join(''),actions:[{label:'Voltar ao caixa',run:()=>vault(it)}]});
  }
  function guest(it){
    const d=B().data(H(),it.region),c=d.clients.find(c=>c.id===it.clientId),t=c&&d.tables.find(t=>t.id===c.tableId);
    if(!c||!t)return card(it,{title:'Mesa do salão',text:'Este visitante já encerrou a rodada. Outro cliente pode chegar com o salão aberto.',actions:[]});
    if(!c.arrivedAtCounter)return card(it,{title:c.name,text:'O visitante está se aproximando da mesa. Aguarde a chegada para conduzir a rodada.',actions:[]});
    const def=B().TABLES[t.type];
    card(it,{title:c.name+' · '+def.name,text:`O visitante trouxe a própria carteira e quer apostar ${c.stake} po. ${def.desc} O prêmio sai do caixa da casa.`,actions:[{label:'Conduzir esta rodada',run:()=>{
      const res=note(B().play(H(),it.region,c.id,t.id));if(!res.ok)return guest(it);
      if(E.CasinoLife)E.CasinoLife.animate(E.WG.world,t.id,res);
      card(it,{title:res.payout?'O visitante recebeu o prêmio':'Rodada encerrada',text:`Aposta: ${res.stake} po. Prêmio: ${res.payout} po. Resultado da casa: ${res.net} po.${res.cards?` Cartas: visitante ${res.cards.guestTotal}; casa ${res.cards.dealerTotal}.`:res.roll!=null?` Resultado: ${res.roll}.`:''} Caixa atual: ${B().data(H(),it.region).cash} po.`,actions:[{label:'Encerrar atendimento',run:()=>E.WorldServices.close()}]});
    }}]});
  }
  O.use=it=>{
    if(!B())return;
    if(!B().access(H(),it.region))return license(it);
    return ({'casino-license':vault,'casino-vault':vault,'casino-staff':staff,'casino-build':tables,'casino-table':guest,'casino-guest':guest}[it.action]||vault)(it);
  };
  E.CasinoOwner=O;
})();
