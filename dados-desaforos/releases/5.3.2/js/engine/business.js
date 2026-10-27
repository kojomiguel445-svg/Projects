/* Fornecedor atacadista e funcionários: mercadoria e trabalho reais, sem API.
   O relógio do jogo cobra os salários; abas fechadas não simulam vendas. */
(() => {
  'use strict';
  const B={},U=E.U;
  const hero=()=>E.Store.hero(),region=r=>E.Settlements.region(r);
  const clock=()=>E.Sim.clock();
  const result=(ok,message,extra={})=>Object.assign({ok,message},extra);
  const whole=(n,max=999999)=>Number.isSafeInteger(Number(n))&&Number(n)>0&&Number(n)<=max;
  const save=(h,r)=>{E.Store.save();U.emit('business:changed',{heroId:h&&h.id,region:r});};
  const currentPlace=()=>E.Interior&&E.Interior.current||E.WorldServices&&E.WorldServices.currentPlace&&E.WorldServices.currentPlace();
  const at=(r,kinds)=>{
    r=region(r);const c=currentPlace();
    if(c&&c.region===r&&kinds.includes(c.kind))return true;
    const w=E.WG&&E.WG.world,p=w&&w.hero;if(!w||w.id!==r||!p||E.Interior&&E.Interior.current)return false;
    return(w.venues||[]).some(v=>{if(!kinds.includes(v.service))return false;const dx=p.x-v.x,dz=p.z-v.z,a=v.rotation||0,x=Math.cos(a)*dx-Math.sin(a)*dz,z=Math.sin(a)*dx+Math.cos(a)*dz;return Math.abs(x)<v.w/2+.5&&Math.abs(z)<v.d/2+.8;});
  };
  const city=r=>region(r)==='aurenna'||!!(E.WD.REGIONS[region(r)]||{}).metro;
  const access=(h,r)=>!!h&&E.Settlements.hasAccess(h,r,'shop');
  const CANDIDATES=Object.freeze([
    {id:'lia',name:'Lia Monteiro',role:'seller',wage:38,fee:140,desc:'Atendente cuidadosa. Explica o uso real dos produtos e respeita o preço da etiqueta.'},
    {id:'breno',name:'Breno Vale',role:'stockkeeper',wage:26,fee:120,desc:'Estoquista. Repõe produtos já expostos usando unidades que você deixou na mochila.'},
    {id:'nara',name:'Nara Leme',role:'seller',wage:45,fee:180,desc:'Vendedora experiente. Atende quem chega ao balcão, sem vender abaixo da etiqueta.'},
    {id:'otto',name:'Otto Carvalho',role:'stockkeeper',wage:32,fee:140,desc:'Organiza a reposição do mostruário; não compra nada sem você e não cria mercadorias.'}
  ]);
  B.ROLES=Object.freeze({seller:{name:'Atendimento',desc:'Atende clientes que chegaram ao balcão e tenta vender uma unidade ao preço da etiqueta.'},stockkeeper:{name:'Reposição',desc:'Repõe até cinco unidades de um produto já exposto usando o estoque da sua mochila.'}});
  B.data=(h=hero())=>{
    if(!h)return null;const d=h.business=h.business&&typeof h.business==='object'&&!Array.isArray(h.business)?h.business:{};
    d.version=1;d.shops=d.shops&&typeof d.shops==='object'&&!Array.isArray(d.shops)?d.shops:{};d.serial=Number.isSafeInteger(d.serial)&&d.serial>=0?d.serial:0;
    return d;
  };
  const shopData=(h,r)=>{
    const d=B.data(h);if(!d)return null;r=region(r);
    const s=d.shops[r]=d.shops[r]||{};s.staff=Array.isArray(s.staff)?s.staff:[];s.history=Array.isArray(s.history)?s.history:[];
    s.staff=s.staff.filter(e=>e&&typeof e.id==='string'&&whole(e.wage,10000)&&B.ROLES[e.role]);
    return s;
  };
  B.staff=(h=hero(),r)=>{
    const s=shopData(h,r);if(!s)return[];const cl=clock(),valid=access(h,region(r));
    return s.staff.map(e=>({...e,active:valid&&!cl.night&&!e.arrears&&e.paidThrough>=cl.day,status:!valid?'Contrato do ponto pendente':e.arrears?'Salário pendente':cl.night?'Expediente encerrado':'Em serviço'}));
  };
  B.candidates=(h=hero(),r)=>{
    const s=shopData(h,r);if(!s)return[];
    return CANDIDATES.filter(c=>!s.staff.some(e=>e.candidateId===c.id)).map(c=>{const wage=Math.ceil(c.wage*(city(r)?1.8:1)),fee=Math.ceil(c.fee*(city(r)?1.6:1));return{...c,wage,fee,totalCost:fee+wage};});
  };
  B.hire=(h,r,candidateId)=>{
    r=region(r);if(!at(r,['player-shop']))return result(false,'Converse sobre a contratação no seu ponto comercial.');
    if(!access(h,r))return result(false,'Regularize o contrato do ponto antes de contratar.');
    const s=shopData(h,r),candidate=B.candidates(h,r).find(c=>c.id===candidateId);
    if(!candidate)return result(false,'Este candidato não está disponível.');
    if(s.staff.length>=2)return result(false,'Este ponto comporta até dois funcionários.');
    if(s.staff.some(e=>e.arrears))return result(false,'Quite os salários pendentes antes de contratar outra pessoa.');
    const total=candidate.fee+candidate.wage;if(!Number.isFinite(h.gold)||h.gold<total)return result(false,`Contratação: ${candidate.fee} po de admissão + ${candidate.wage} po do primeiro dia (${total} po).`);
    const day=clock().day,d=B.data(h),employee={id:'employee-'+(++d.serial),candidateId:candidate.id,name:candidate.name,role:candidate.role,wage:candidate.wage,paidThrough:day,billedThrough:day,arrears:0,worked:0,actions:0,hiredDay:day};
    h.gold-=total;s.staff.push(employee);save(h,r);return result(true,`${employee.name} contratado. Primeiro dia pago; salário de ${employee.wage} po por dia do jogo.`,{employee:{...employee,active:true},cost:total});
  };
  B.assign=(h,r,id,role)=>{
    r=region(r);if(!at(r,['player-shop']))return result(false,'Atribua o trabalho junto ao balcão da sua loja.');
    const s=shopData(h,r),employee=s&&s.staff.find(e=>e.id===id);if(!employee||!B.ROLES[role])return result(false,'Funcionário ou função inválidos.');
    if(!access(h,r))return result(false,'Regularize o contrato do ponto.');
    employee.role=role;employee.worked=0;save(h,r);return result(true,`${employee.name}: ${B.ROLES[role].name}.`);
  };
  B.dismiss=(h,r,id)=>{
    r=region(r);if(!at(r,['player-shop']))return result(false,'Encerre o contrato no seu ponto comercial.');
    const s=shopData(h,r),i=s&&s.staff.findIndex(e=>e.id===id);if(i==null||i<0)return result(false,'Funcionário não encontrado.');
    if(s.staff[i].arrears)return result(false,'Quite o salário pendente antes de encerrar o contrato.');
    const [e]=s.staff.splice(i,1);save(h,r);return result(true,`Contrato de ${e.name} encerrado. Os dias já pagos não são reembolsados.`);
  };
  B.wagesDue=(h,r)=>{const s=shopData(h,r);return s?s.staff.reduce((n,e)=>n+Math.max(0,Number(e.arrears)||0),0):0;};
  B.payWages=(h,r)=>{
    r=region(r);if(!at(r,['player-shop']))return result(false,'Quite os salários no caixa da sua loja.');
    const due=B.wagesDue(h,r);if(!due)return result(false,'Todos os salários já estão em dia.',{cost:0});
    if(!Number.isFinite(h.gold)||h.gold<due)return result(false,`Salários pendentes: ${due} po.`,{cost:due});
    h.gold-=due;for(const e of shopData(h,r).staff){e.arrears=0;e.paidThrough=clock().day;e.billedThrough=clock().day;}save(h,r);return result(true,`Salários regularizados: ${due} po.`,{cost:due});
  };
  B.billDay=(h,day)=>{
    if(!h||!Number.isSafeInteger(day)||day<1)return;const d=B.data(h);let changed=false;
    for(const[r,s]of Object.entries(d.shops)){
      for(const e of shopData(h,r).staff){
        const billed=Number.isSafeInteger(e.billedThrough)?e.billedThrough:Number.isSafeInteger(e.paidThrough)?e.paidThrough:day;
        if(day<=billed)continue;const cost=(day-billed)*e.wage;e.billedThrough=day;e.arrears=(Number(e.arrears)||0)+cost;
        if(Number.isFinite(h.gold)&&h.gold>=e.arrears){h.gold-=e.arrears;e.arrears=0;e.paidThrough=day;}
        e.worked=0;changed=true;
      }
    }
    if(changed)save(h,null);
  };
  // Catalogue definitions are made from the same item metadata used by actual bags.
  const catalogue=r=>{
    const foods=E.SIM_DATA.FOODS,items=E.R&&E.R.ITEMS||{},ores=E.L&&E.L.ORES||{},goods=E.L&&E.L.GOODS||{};
    const rows=[
      ['pao','food','pao',10,300,'pie'],['racao','food','racao',10,180,'backpack'],
      ['vegetais','food','vegetais',20,400,'herb'],['fruta','food','fruta',20,400,'cherry'],
      ['pocao_cura','inventory','pocao_cura',5,120,'potion'],['antitoxina','inventory','antitoxina',5,80,'potion'],
      ['ferro','ore','ferro',20,300,'rock'],['cha','cargo','cha',5,100,'cup']
    ];
    if(city(r))rows.push(['pocao_maior','inventory','pocao_maior',5,100,'potion'],['joia','cargo','joia',5,80,'diamond'],['lingote','cargo','lingote',5,160,'package'],['seda','cargo','seda',5,160,'package'],['reliquia','cargo','reliquia',5,100,'package'],['perola','cargo','perola',5,100,'diamond']);
    return rows.flatMap(([id,kind,itemId,packSize,stock,icon])=>{
      const def=kind==='food'?foods[itemId]:kind==='inventory'?items[itemId]:kind==='ore'?ores[itemId]:goods[itemId];if(!def)return[];
      const retailPrice=E.Settlements.price(r,Number(def.price||def.base)||1),packPrice=Math.max(1,Math.ceil(retailPrice*packSize*.65));
      return[{id,kind,itemId,name:def.name,packSize,packPrice,retailPrice,icon,stock,category:kind==='food'?'Alimentos':kind==='inventory'?'Botica':kind==='ore'?'Materiais':'Mercadorias'}];
    });
  };
  const supply=(r,rows)=>{
    const state=E.state.businessSupply=E.state.businessSupply&&typeof E.state.businessSupply==='object'?E.state.businessSupply:{};
    const day=clock().day;let s=state[r];if(!s||s.day!==day)s=state[r]={day,stock:Object.fromEntries(rows.map(i=>[i.id,i.stock]))};
    return s;
  };
  B.wholesale=(h,r)=>{
    if(typeof h==='string'||h==null){r=h||r;h=hero();}r=region(r);
    const rows=catalogue(r),s=supply(r,rows);return rows.map(row=>({...row,stock:Math.max(0,Number(s.stock[row.id])||0),packsAvailable:Math.floor((Number(s.stock[row.id])||0)/row.packSize),supplier:'Bento · Companhia das Caravanas',region:r}));
  };
  B.buyWholesale=(h,r,id,packs)=>{
    r=region(r);const place=city(r)?'market':'general';if(!h||!at(r,[place]))return result(false,`Compre os lotes com o fornecedor no ${E.Settlements.placeName(place)} desta região.`);
    if(!whole(packs,100))return result(false,'Informe de 1 a 100 lotes inteiros.');packs=Number(packs);
    const row=B.wholesale(h,r).find(i=>i.id===id);if(!row)return result(false,'O fornecedor não trabalha com este produto.');
    const n=packs*row.packSize,cost=packs*row.packPrice;if(n>row.stock)return result(false,'O fornecedor não tem essa quantidade hoje. O próximo carroção chega amanhã.');
    if(!Number.isFinite(h.gold)||h.gold<cost)return result(false,`O pedido custa ${cost} po.`,{cost});
    const bag=row.kind==='food'?E.Sim.data(h).food:row.kind==='inventory'?(h.inventory=h.inventory||{}):row.kind==='ore'?E.Life.data(h).ores:E.Life.data(h).cargo;
    const old=Number(bag[row.itemId])||0;if(!Number.isSafeInteger(old)||old<0||old+n>999999)return result(false,'Não há espaço para esse produto no inventário.');
    if(row.kind==='cargo'&&E.Life.cargoCount(h)+n>E.Life.cap(h))return result(false,'Essa carga excede a capacidade da sua carroça. Compre menos lotes ou amplie o transporte.');
    const s=supply(r,catalogue(r));if((s.stock[row.id]||0)<n)return result(false,'O lote acabou de ser reservado; confira o estoque novamente.');
    h.gold-=cost;bag[row.itemId]=old+n;s.stock[row.id]-=n;save(h,r);U.emit('survival:changed');return result(true,`${row.name} ×${n} comprado(s) por ${cost} po. Leve os produtos aos caixotes da sua loja.`,{cost,quantity:n,item:row,remaining:s.stock[row.id]});
  };
  function restock(h,r,s){
    const inventory=E.Vendor.inventory(h);
    const tags=shopData(h,r).restockTags||[];
    const target=s.stocks.find(e=>e.quantity>0&&e.quantity<3&&e.kind!=='weapon'&&inventory.some(i=>i.key===e.key&&i.quantity>0));
    const tag=target||tags.find(t=>!s.stocks.some(e=>e.key===t.key)&&inventory.some(i=>i.key===t.key&&i.quantity>0));if(!tag)return false;
    const item=inventory.find(i=>i.key===tag.key),oldQuantity=target?target.quantity:0,n=Math.min(5,item.quantity,8-oldQuantity);if(n<1)return false;
    const res=E.Vendor.addStock(h,r,tag.key,n,tag.price);if(!res.ok)return false;
    // Merge the newly escrowed lot only after Vendor has removed the real units.
    const added=res.stock;if(target&&added&&added!==target){target.quantity=oldQuantity+n;s.stocks=s.stocks.filter(e=>e!==added);}
    return true;
  }
  function attend(h,r,s,e){
    const c=s.clients.find(c=>c.state==='waiting'&&c.arrivedAtCounter===true&&!c.employeeReserved);if(!c)return false;
    c.employeeSeen=Array.isArray(c.employeeSeen)?c.employeeSeen:[];
    const stock=s.stocks.filter(x=>x.quantity>0&&x.item.category===c.need&&!c.employeeSeen.includes(x.id)).sort((a,b)=>a.price-b.price)[0];
    // A visitor whom we cannot serve must not hold the whole queue indefinitely.
    if(!stock){E.Vendor.dismiss(h,r,c.id);return true;}
    c.employeeSeen.push(stock.id);c.employeeSeen=c.employeeSeen.slice(-20);
    const item=stock.item,pitch=`Bom dia! Posso ajudar com ${item.name}. ${item.category==='comida'?'Esta refeição pronta é prática para a viagem.':item.category==='ingredientes'?'Este ingrediente pode ser preparado em sua cozinha.':item.category==='cura'?'Este produto ajuda na recuperação de ferimentos conforme o rótulo.':item.category==='armas'?'Este equipamento tem uso real em combate.':item.category==='peixes'?'Este pescado pode ser preparado para sua refeição.':'O produto é útil para seu trabalho e tem a qualidade apresentada.'} Obrigado pela visita, este é o preço da etiqueta.`;
    const res=E.Vendor.negotiate(h,r,stock.id,pitch,stock.price,c.id);
    if(res.ok&&res.outcome==='sold'){
      const history=s.history[0];if(history)history.employee=e.name;
      const d=shopData(h,r);d.history.unshift({day:clock().day,employee:e.name,item:item.name,kind:'sale',gold:res.price});d.history.length=Math.min(20,d.history.length);save(h,r);
    }
    return res.ok;
  }
  B.arrivalInterval=(h,r)=>clock().night?65:city(r)?10:16;
  B.tick=dt=>{
    const h=hero();if(!h||!Number.isFinite(dt)||dt<=0||typeof document!=='undefined'&&document.hidden)return;
    if(E.WG&&typeof E.WG.mode==='function'&&!['world','interior'].includes(E.WG.mode()))return;
    const d=B.data(h),cl=clock();if(cl.night)return;
    for(const[r,sd]of Object.entries(d.shops)){
      if(!access(h,r))continue;const s=E.Vendor.shop(h,r);if(!s.open)continue;
      // In an unloaded region, the same visitor walks to the store on game time.
      // The visible region still waits for the actual 3D route to reach its counter.
      if(E.WG&&E.WG.world&&E.WG.world.id!==r)for(const client of s.clients){
        const created=Number.isFinite(client.createdAt)?client.createdAt:client.expires-100;
        if(client.state==='waiting'&&client.expires>cl.elapsed&&cl.elapsed>=created+20)client.arrivedAtCounter=true;
      }
      if(shopData(h,r).staff.some(e=>e.role==='stockkeeper')){
        sd.restockTags=Array.isArray(sd.restockTags)?sd.restockTags.slice(-30):[];
        for(const entry of s.stocks.filter(e=>e.kind!=='weapon')){
          const tag=sd.restockTags.find(t=>t.key===entry.key);
          if(tag)tag.price=entry.price;else sd.restockTags.push({key:entry.key,price:entry.price});
        }
        if(sd.restockTags.length>30)sd.restockTags=sd.restockTags.slice(-30);
      }
      for(const e of shopData(h,r).staff){
        if(e.arrears||e.paidThrough<cl.day)continue;
        const cadence=e.role==='seller'?10:12;e.worked=Math.min(cadence,(Number(e.worked)||0)+Math.min(.25,dt));
        if(e.worked<cadence)continue;
        if(e.role==='seller'&&E.WorldServices&&E.WorldServices.active)continue;
        const acted=e.role==='seller'?attend(h,r,s,e):restock(h,r,s);
        // Bounded attempts; even a stubborn client is processed only once per interval.
        e.worked=0;if(acted){e.actions=(Number(e.actions)||0)+1;save(h,r);}
      }
    }
  };
  U.on('calendar:day',({day})=>{const h=hero();if(h)B.billDay(h,day);});
  E.Business=B;
})();
