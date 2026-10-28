/* Comércio dentro do cenário: cada bancada abre apenas a interação daquele objeto. */
(() => {
  'use strict';
  const U=E.U, W={active:false}, hero=()=>E.Store.hero(), S=()=>E.Settlements;
  const icon=k=>E.Icons?E.Icons.html(k||'chat',{decorative:true}):'';
  const retail=(r,n)=>S().price?S().price(r,n):n;
  const esc=s=>U.esc(String(s==null?'':s));
  let current=null, source=null;
  const notify=r=>{
    if(r==null)return;
    const bad=typeof r==='string'||r.error||r.ok===false;
    const msg=typeof r==='string'?r:r.error||r.message;
    if(msg&&E.UI)E.UI.toast(msg,bad?'':'gold');
    E.HUD&&E.HUD.update();
    if(!bad&&E.Audio)E.Audio.sfx('chest');
    return !bad;
  };
  const save=()=>{E.Store.save();E.HUD&&E.HUD.update();};
  const transaction=(fn,again)=>{const r=fn();notify(r);if(again)again();return r;};
  const actor=()=>E.Interior&&E.Interior.current?E.Interior.current.hero:E.WG.world&&E.WG.world.hero;
  W.close=()=>{
    document.body.classList.remove('world-interacting');
    if(!current){W.active=false;source=null;return;}
    const c=current;current=null;source=null;W.active=false;c.el.remove();
    if(E.WG){E.WG.input.keys={};E.WG.input.sprint=false;E.WG.locked=E.WG.mode()==='interior'?true:c.wasLocked;}
    if(c.onClose)c.onClose();
  };
  W.open=(opts={})=>{
    const old=current,wasLocked=old?old.wasLocked:!!(E.WG&&E.WG.locked),p=actor(),anchor=opts.anchor||source||old&&old.anchor||(p?{x:p.x,z:p.z,r:2,interior:!!(E.Interior&&E.Interior.current)}:null);
    if(old){current=null;W.active=false;old.el.remove();if(old.onClose)old.onClose();}
    const el=U.h(`<aside class="world-service-panel" role="dialog" aria-modal="false" aria-label="${esc(opts.title||'Interagir')}"><div class="ws-eyebrow">${esc(opts.eyebrow||(anchor&&anchor.venue&&anchor.venue.name)||(E.Interior&&E.Interior.current&&E.Interior.current.title)||(W.currentPlace&&W.currentPlace()&&W.currentPlace().venue&&W.currentPlace().venue.name)||'ELARION')}</div><button class="ws-close" aria-label="Encerrar conversa">${icon('close')}</button><header><span class="ws-emblem">${icon(opts.icon||'chat')}</span><div><h3>${esc(opts.title||'Interagir')}</h3><small class="ws-wallet"></small></div></header><p class="ws-copy"></p><div class="ws-content"></div><div class="ws-actions"></div><small class="ws-exit">Esc ou caminhar para encerrar</small></aside>`);
    el.querySelector('.ws-copy').textContent=opts.text||'';
    if(opts.html)el.querySelector('.ws-content').innerHTML=opts.html;
    const buttons=el.querySelector('.ws-actions');
    (opts.actions||[]).forEach((action,i)=>{
      const b=U.h(`<button class="ws-action ${action.primary===false?'secondary':''}" ${action.disabled?'disabled':''}><span class="ws-key" aria-hidden="true">${i+1}</span><span>${esc(action.label)}</span></button>`);
      b.dataset.action=String(i);b.onclick=async()=>{
        if(b.disabled||!current||current.el!==el)return;
        E.Audio&&E.Audio.sfx('click');
        try{await action.run(el);}catch(e){console.error(e);E.UI.toast('Não foi possível concluir essa interação.');}
      };buttons.appendChild(b);
    });
    const root=document.getElementById('ui')||document.body;root.appendChild(el);
    current={el,anchor,wasLocked,onClose:opts.onClose,poll:opts.update||opts.onUpdate,pollAt:0,mode:E.WG&&E.WG.mode(),world:E.WG&&E.WG.world};W.active=true;document.body.classList.add('world-interacting');
    if(E.WG){E.WG.locked=true;E.WG.input.keys={};E.WG.input.sprint=false;E.WG.input.joy.active=false;}
    el.querySelector('.ws-close').onclick=W.close;
    (opts.mount||opts.onMount||opts.afterOpen||(()=>{}))(el);
    W.update(0);
    return el;
  };
  W.update=dt=>{
    const spin=source&&source.group&&source.group.userData.serviceSpin;
    if(spin){spin.elapsed=(spin.elapsed||0)+(dt||0);const k=Math.min(1,spin.elapsed/1.25),ease=1-Math.pow(1-k,3),wheel=source.group.userData.wheel;
      if(wheel)wheel.rotation.y=spin.from+(spin.to-spin.from)*ease;
      for(const [i,d]of(source.group.userData.dice||[]).entries()){const face=(spin.rolls||[3,3])[i],base=({1:[0,Math.PI/2],2:[0,-Math.PI/2],3:[0,0],4:[Math.PI,0],5:[-Math.PI/2,0],6:[Math.PI/2,0]})[face];d.rotation.set(base[0]+(1-k)*Math.PI*(5+i),0,base[1]+(1-k)*Math.PI*(4+i));d.position.y=1.22+Math.sin(k*Math.PI)*.55;}
      if(k>=1)delete source.group.userData.serviceSpin;
    }
    const c=current;if(!c)return;
    if(!E.Store.hero()||E.WG&&c.mode!==E.WG.mode()||E.WG&&c.world!==E.WG.world){W.close();return;}
    const p=actor(),a=c.anchor;
    if(p&&a&&!a.interior&&Number.isFinite(a.x)&&Number.isFinite(a.z)&&Math.hypot(p.x-a.x,p.z-a.z)>Math.max(4.8,(a.r||2)+2)){W.close();return;}
    c.pollAt-=dt||0;if(c.pollAt>0)return;c.pollAt=.25;
    const h=hero(),clock=E.Sim&&E.Sim.clock();c.el.querySelector('.ws-wallet').textContent=`${h.gold} po${clock?' · '+clock.time:''}`;
    if(c.poll)c.poll(c.el);
  };
  W.currentPlace=()=>{
    if(E.Interior&&E.Interior.current)return E.Interior.current;
    const w=E.WG&&E.WG.world,p=w&&w.hero;if(!w||!p)return null;
    for(const v of w.venues||[]){
      const dx=p.x-v.x,dz=p.z-v.z,c=Math.cos(v.rotation||0),s=Math.sin(v.rotation||0),x=c*dx-s*dz,z=s*dx+c*dz;
      if(Math.abs(x)<v.w/2-.1&&Math.abs(z)<v.d/2+.5)return {kind:v.service,region:v.region,venue:v,hero:p};
    }
    return null;
  };
  addEventListener('keydown',e=>{
    if(!W.active||e.defaultPrevented)return;
    if(/INPUT|TEXTAREA|SELECT/.test(e.target&&e.target.tagName||'')){if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();W.close();}return;}
    if(['Escape','KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();W.close();return;}
    if(/^Digit[1-9]$/.test(e.code)){e.preventDefault();e.stopImmediatePropagation();const b=current&&current.el.querySelector(`[data-action="${+e.code.slice(5)-1}"]`);if(b&&!b.disabled)b.click();return;}
    if(['Space','KeyF','KeyE','KeyM','KeyI','KeyO','KeyC','KeyJ'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  addEventListener('blur',()=>{if(current)W.close();});
  U.on('world:travel',W.close);

  const furnitureModels={bed:'bed',hearth:'furniture',table:'table',chair:'furniture',chest:'crate',wardrobe:'shelf',bookshelf:'shelf',lamp:'furniture'};
  W.decorate=(w,v)=>{
    if(v.servicesDecorated)return;v.servicesDecorated=true;
    const f=(action,product,label,model,lx,lz,extra={})=>E.Shopfronts.fixture(w,v,{action,product,label,model,icon:{glider:'glider',cook:'cooking',food:'cooking',potion:'potion',weapon:'arsenal',upgrade:'anvil',furniture:'home',jobs:'journal',contracts:'quest',work:'hammer',inn:'bed',home:'home',trade:'scales',alchemy:'potion',pier:'fish',fish:'fish',roulette:'dice',cashier:'coin',arena:'shield',register:'scales',stock:'inventory',display:'shop',contract:'quill',wholesale:'package',staff:'party',professions:'hammer'}[action]||'chat',...extra},lx,lz);
    const x=Math.max(1.5,v.w*.29),back=-v.d*.27,front=v.d*.13;
    if(v.service==='general'){
      f('glider',null,'Examinar planador','glider',-x,back);
      f('pick',null,'Escolher ferramenta de mineração','weapon',-x,front);
      f('potion','pocao_cura','Examinar poções','shelf',x,back);
      f('pier',null,'Equipamento de pesca','shelf',x,front);
      if(!w.reg.metro)f('wholesale',null,'Comprar lotes do fornecedor','wholesale',-x,back+v.d*.32,{r:2.2});
      f('work',null,'Conversar com o responsável','counter',0,back);
    }else if(v.service==='food'){
      f('food','pao','Comprar pão fresco','food',x,back);
      f('food','ensopado_caseiro','Pedir um ensopado','food',x,front);
      f('cook',null,'Usar a panela de ferro','pot',-x,back);
      f('eat',null,'Sentar para comer','table',-x,front);
      f('work',null,'Conversar com a cozinheira','counter',0,back);
    }else if(v.service==='smith'){
      f('weapon','m_espada_longa','Examinar armas da oficina','weapon',-x,back);
      f('upgrade',null,'Trabalhar na bigorna','anvil',x,back);
      f('smelt',null,'Usar a fundição','pot',-x,front);
      f('work',null,'Conversar com o mestre ferreiro','counter',x,front);
    }else if(v.service==='furniture'){
      ['bed','hearth','chair','table','chest','wardrobe','bookshelf','lamp'].forEach((id,i)=>f('furniture',id,`Examinar ${S().FURNITURE[id].name.toLowerCase()}`,furnitureModels[id],i%2?x:-x,back+Math.floor(i/2)*v.d*.25,{itemId:id}));
    }else if(v.service==='guild'){
      f('jobs',null,'Ler o quadro de vagas','noticeboard',-x,back);
      f('contracts',null,'Examinar contratos de aventura','noticeboard',x,back);
      f('work',null,'Falar com a responsável pelos ofícios','counter',0,back);
      f('professions',null,'Escolher um ofício por conta própria','recruitment',x,front,{itemId:'professions'});
    }else if(v.service==='inn'){ /* Reception is inside the inn; its door remains a physical entrance. */ }
    else if(v.service==='home')f('home',null,'Ler a placa da residência','noticeboard',x,v.d*.56);
    else if(v.service==='player-shop'){
      f('register',null,'Usar o caixa do seu ponto','cashbox',0,back);
      f('stock',null,'Abastecer a banca','crate',-x,back);
      f('display',null,'Organizar o mostruário','shelf',x,back);
      f('contract',null,'Contrato deste ponto','noticeboard',x,v.d*.55);
      f('staff',null,'Contratar e organizar funcionários','recruitment',-x,v.d*.28,{itemId:'staff'});
    }else if(v.service==='market'){
      const goods=Object.keys(E.L.GOODS).filter(id=>E.L.GOODS[id].prod===v.region);const rest=Object.keys(E.L.GOODS).filter(id=>!goods.includes(id));
      [...goods,...rest].slice(0,2).forEach((id,i)=>f('trade',id,`Negociar ${E.L.GOODS[id].name.toLowerCase()}`,'crate',x,back+i*v.d*.38));
      f('wholesale',null,'Falar com Bento · fornecedor atacadista','wholesale',-x,back,{r:2.3});
      f('wholesale',null,'Consultar lotes para revenda','wholesale',-x,front,{r:2.3});
      f('cart',null,'Examinar carroças de carga','crate',0,back);
    }else if(v.service==='alchemy'){
      f('alchemy',null,'Preparar uma fórmula','pot',-x,back);
      f('potion','pocao_cura','Examinar frascos de cura','shelf',x,back);
      f('potion','antitoxina','Examinar antídotos','shelf',x,front);
    }else if(v.service==='pier'){
      f('pier',null,'Examinar varas e iscas','shelf',-x,back);
      f('fish',null,'Negociar pescado','food',x,back);
      f('boat',null,'Alugar barco e pescar no mar','noticeboard',-x,front);
    }else if(v.service==='player-casino'){
      f('casino-license',null,'Licença e contrato do cassino','noticeboard',x,v.d/2-.7);
      f('casino-vault',null,'Caixa e abertura do seu cassino','cashbox',0,back);
      f('casino-staff',null,'Contratar equipe do cassino','recruitment',-v.w*.40,-v.d*.30);
      f('casino-build',null,'Instalar mesas de jogo','noticeboard',x,back);
    }else if(v.service==='casino'){
      f('roulette',null,'Jogar na roleta','roulette',-x,back);
      f('dice',null,'Jogar dados na mesa','dice-table',x,back);
      f('cashier',null,'Trocar fichas com o caixa','cashbox',0,back);
      f('blackjack',null,'Sentar na mesa de Vinte-e-Um','cards-table',-x,front);
      f('slots',null,'Usar a máquina do Dragão','slots',x,front);
    }else if(v.service==='arena'){
      f('arena',null,'Falar com o mestre da arena','counter',-x,back);
      f('contracts',null,'Ler os desafios da guilda','noticeboard',x,back);
    }
    // A visible vacancy plaque belongs to the operating establishment itself.
    // It sits beside the entrance so the broad walking aisle stays clear.
    if(v.open&&!['player-shop','player-casino','guild'].includes(v.service))f('jobs',null,'Pedir emprego neste estabelecimento','recruitment',v.w/2-.90,v.d/2-.7,{r:1.9});
  };

  function glider(it){
    const h=hero(),d=E.Sim.data(h),price=retail(it.region,80);
    W.open({title:'Planador do viajante',icon:'glider',text:d.gliderOwned?'Confira os tirantes junto à bancada antes de sair. No ar: segure Espaço, ou toque pular uma vez no celular.':`O tecido reforçado está estendido na bancada. Asa e armação custam ${price} po.`,actions:[{label:d.gliderOwned?(d.gliderEquipped?'Guardar planador':'Vestir o planador'):`Comprar por ${price} po`,disabled:!d.gliderOwned&&h.gold<price,run:()=>transaction(()=>d.gliderOwned?E.Sim.equipGlider(h,!d.gliderEquipped):E.Sim.buyGlider(h,price),()=>glider(it))}]});
  }
  function food(it){const h=hero(),f=E.Sim.FOODS[it.product]||E.Sim.FOODS.pao,id=f.id,price=retail(it.region,f.price);W.open({title:f.name,icon:f.iconKey,text:`${f.desc} Uma porção custa ${price} po e recupera ${f.hunger} de saciedade. Você tem ${E.Sim.data(h).food[id]||0}.`,actions:[{label:`Levar uma porção · ${price} po`,disabled:h.gold<price,run:()=>transaction(()=>{if(h.gold<price)return{ok:false,message:'Ouro insuficiente.'};const r=E.Sim.addFood(h,id,1);if(!r.ok)return r;h.gold-=price;save();return{ok:true,message:'Porção guardada na mochila.'};},()=>food(it))},{label:'Comer uma porção da mochila',disabled:!(E.Sim.data(h).food[id]>0)||E.Sim.data(h).hunger>=99.99,primary:false,run:()=>transaction(()=>E.Sim.eat(h,id),()=>food(it))}]});}
  function meal(it,cooking=false,page=0){const h=hero(),items=E.Sim.foodItems(h).filter(f=>cooking?!!f.cookTo:!f.raw&&f.hunger>0),f=items[((page%items.length)+items.length)%items.length];
    if(!f)return W.open({title:cooking?'Panela sobre o fogo':'Mesa de refeição',icon:cooking?'cooking':'cup',text:cooking?'Você ainda não trouxe carne, peixe ou legumes para preparar. A carne vem da caça e o pescado das margens dos lagos.':'Sua mochila não tem uma refeição pronta. Compre pão na banca ou prepare ingredientes na panela.',actions:[]});
    W.open({title:cooking?'Preparar '+f.name:f.name,icon:f.iconKey||'cooking',text:`${f.n} porção(ões) na mochila.${cooking?' O fogo está aceso; prepare uma porção.':` Recupera ${f.hunger} de saciedade. Você está com ${Math.round(E.Sim.data(h).hunger)}/100.`}`,actions:[{label:cooking?'Preparar uma porção':'Comer uma porção',disabled:!cooking&&E.Sim.data(h).hunger>=99.99,run:()=>transaction(()=>cooking?E.Sim.cook(h,f.id,{fire:true}):E.Sim.eat(h,f.id),()=>meal(it,cooking,page))},...(items.length>1?[{label:'Outro ingrediente da mochila',primary:false,run:()=>meal(it,cooking,page+1)}]:[])]});}
  function potion(it,page=null){const h=hero(),stock=['pocao_cura','pocao_maior','pocao_superior','antitoxina'],id=page!==null?stock[page%stock.length]:it.product||'pocao_cura',d=E.R.ITEMS[id],price=retail(it.region,Math.round(d.price*(E.C.hasFeat(h,'artesao')?.8:1)));W.open({title:d.name,icon:'potion',text:`${d.desc} Frasco: ${price} po. Você carrega ${h.inventory[id]||0}.`,actions:[{label:`Comprar um frasco · ${price} po`,disabled:h.gold<price,run:()=>transaction(()=>{if(h.gold<price)return{ok:false,message:'Ouro insuficiente.'};h.gold-=price;h.inventory[id]=(h.inventory[id]||0)+1;save();return{ok:true,message:'Frasco guardado com cuidado.'};},()=>potion(it,page))},{label:'Examinar o próximo frasco',primary:false,run:()=>potion(it,(stock.indexOf(id)+1)%stock.length)}]});}
  function pick(it){const h=hero(),d=E.Life.data(h),tier=d.pick+1,pk=E.L.PICKAXES[tier];W.open({title:pk?pk.name:'Ferramenta rúnica',icon:'pickaxe',text:pk?`${pk.desc} Custa ${pk.gold} po${Object.entries(pk.ore||{}).map(([id,n])=>` e ${n} ${E.L.ORES[id].name}`).join('')}.`:'Você já possui a melhor ferramenta desta oficina.',actions:pk?[{label:`Comprar · ${pk.gold} po`,disabled:h.gold<pk.gold,run:()=>transaction(()=>{const error=E.Life.buyPick(h,tier);return error||{ok:true,message:'Ferramenta pronta para as grutas.'};},()=>pick(it))}]:[]});}
  function weapons(it,page=0){const h=hero(),stock=E.Forge.stock(),preferred=stock.findIndex(s=>s.key===it.product),index=page||Math.max(0,preferred),d=stock[index%stock.length],price=E.Forge.priceFor(h,d);W.open({title:d.def.name,icon:'arsenal',text:`${d.def.lore||'Peça da oficina de Elarion.'} ${price} po · nível ${d.lvl} necessário.`,html:E.WA?`<div class="ws-weapon-art">${E.WA.svg(d.def,{still:true,aura:false})}</div>`:'',actions:[{label:`Comprar esta arma · ${price} po`,disabled:h.gold<price||h.level<d.lvl,run:()=>transaction(()=>{const r=E.Forge.buy(h,d);return r.error?r:{ok:true,message:'Arma comprada. Ela está no seu arsenal.'};},()=>weapons(it,index))},{label:'Examinar a peça seguinte',primary:false,run:()=>weapons(it,index+1)}]});}
  function upgrade(it){const h=hero(),eq=E.C.equipped(h,h.equip&&h.equip.visualSlot==='focus'?'focus':'weapon')||E.C.equipped(h,'focus');if(!eq)return W.open({title:'Bigorna da oficina',icon:'anvil',text:'Equipe uma arma para trabalhar nela. Os minérios necessários vêm das grutas ou do fornecedor.',actions:[]});const entry=E.Forge.norm(eq.entry),def=eq.def,ores=E.Forge.ores(h),check=E.Forge.ascCheck(h,entry);const actions=Object.entries(E.Forge.ORE_EXP).filter(([id])=>ores[id]>0).slice(0,2).map(([id])=>({label:`Trabalhar com 1 ${E.L.ORES[id].name}`,run:()=>transaction(()=>{const r=E.Forge.levelUp(h,entry,{[id]:1});if(r.error)return r;E.WG.world&&E.WG.world.refreshHeroFrames();return{ok:true,message:`Arma trabalhada: nível ${r.lv}. Custo ${r.gold} po.`};},()=>upgrade(it))}));if(check.ok)actions.push({label:`Ascender · ${check.cost.gold} po`,run:()=>transaction(()=>{const r=E.Forge.ascend(h,entry);E.WG.world&&E.WG.world.refreshHeroFrames();return{ok:!!r,message:r?'Ascensão concluída.':'Faltam materiais.'};},()=>upgrade(it))});if(!actions.length)actions.push({label:'Comprar 1 Minério de Ferro · 25 po',disabled:h.gold<25,run:()=>transaction(()=>({ok:E.Forge.buyOre(h,'ferro'),message:'Confira sua reserva de minérios.'}),()=>upgrade(it))});W.open({title:def.name,icon:'anvil',text:`Nível ${entry.lv} / ${E.Forge.cap(entry,def)}. A bigorna melhora a arma que você realmente equipou.${check.miss&&check.miss.length?' Para ascender faltam: '+check.miss.join(', ')+'.':''}`,actions});}
  function craft(it,kind='alquimia',page=0){const h=hero(),d=E.Life.data(h),list=(E.L.RECIPES[kind]||[]).filter(r=>!r.locked||(d.recipes||[]).includes(r.id)),r=list[page%list.length];if(!r)return;const need=Object.entries(r.need).map(([k,n])=>`${E.Life.keyName(k)} ${E.Life.have(h,k)}/${n}`).join(' · ');W.open({title:r.name,icon:kind==='forja'?'anvil':'potion',text:`${r.desc||'Prepare esta fórmula na bancada.'} ${need}${r.gold?' · '+r.gold+' po':''}.`,actions:[{label:kind==='forja'?'Trabalhar esta receita':'Misturar esta fórmula',disabled:!E.Life.canCraft(h,r),run:()=>transaction(()=>{const out=E.Life.craft(h,kind,r);return{ok:!!out,message:out?r.name+' concluído.':'Faltam ingredientes.'};},()=>craft(it,kind,page))},{label:'Ler a próxima receita',primary:false,run:()=>craft(it,kind,page+1)}]});}
  function furniture(it){const h=hero(),id=it.product,def=S().FURNITURE[id];if(!def)return;const price=retail(it.region,def.price);W.open({title:def.name,icon:def.icon,text:`${def.desc} Esta peça custa ${price} po e será guardada na sua casa desta vila para posicionar.`,actions:[{label:`Comprar esta peça · ${price} po`,disabled:h.gold<price,run:()=>transaction(()=>S().buyFurniture(h,it.region,id),()=>furniture(it))}]});}
  function property(it,kind='home'){const h=hero(),p=S().property(h,it.region,kind),access=S().hasAccess(h,it.region,kind),price=S().prices?S().prices(it.region,kind):S().PRICES[kind],actions=[];
    if(!p){actions.push({label:`Alugar · ${price.rent} po por dia`,disabled:h.gold<price.rent,run:()=>transaction(()=>S().acquire(h,it.region,kind,'rent'),()=>property(it,kind))});}
    if(!p||p.mode!=='owned')actions.push({label:`Comprar · ${price.buy} po`,disabled:h.gold<price.buy,run:()=>transaction(()=>S().acquire(h,it.region,kind,'buy'),()=>property(it,kind))});
    if(p&&!access)actions.push({label:`Regularizar aluguel${p.arrears?' · '+p.arrears+' po':''}`,run:()=>transaction(()=>S().payRent(h,it.region,kind),()=>property(it,kind))});
    if(access&&kind==='home')actions.unshift({label:'Abrir a porta e entrar',run:()=>{W.close();S().enter('home',it.region);}});
    if(access&&kind==='shop')actions.unshift({label:'Assumir o balcão',run:()=>{W.close();E.StallLife&&E.StallLife.counter(it.region,'register');}});
    W.open({title:kind==='home'?'Residência da vila':'Seu ponto comercial',icon:kind==='home'?'home':'shop',text:p?(p.mode==='owned'?'A propriedade é sua.':`Contrato: ${price.rent} po por dia.${p.arrears?' Há aluguel em atraso.':' O aluguel está em dia.'}`):'A placa oferece este espaço. A chave e o contrato ficam com o responsável da vila.',actions});
  }
  function inn(it){const h=hero(),has=S().hasAccess(h,it.region,'room'),price=(S().prices?S().prices(it.region,'room'):S().PRICES.room).rent;W.open({title:'Recepção da estalagem',icon:'bed',text:has?'Seu quarto está reservado. Suba e use a cama para dormir.':`Uma chave repousa sobre o balcão. O quarto custa ${price} po por estadia, até você dormir ou a reserva vencer.`,actions:[{label:has?'Pegar a chave e entrar no quarto':`Reservar quarto · ${price} po`,disabled:!has&&h.gold<price,run:()=>{if(!has){const r=S().acquire(h,it.region,'room','rent');notify(r);if(!r.ok)return;}W.close();S().enter('room',it.region);}}]});}
  function jobs(it,page=0){
    const h=hero(),j=S().jobData(h,it.region),a=j.appointment,cl=E.Sim.clock(),atEmployer=it.service!=='guild',place=atEmployer?it.service:null;
    if(a){
      const def=S().JOBS[a.id],where=a.place||'guild';
      if(where!==it.service)return W.open({title:'Sua entrevista está marcada',icon:'calendar',text:`${def.name}: compareça em ${S().placeName(where)}. O responsável deste estabelecimento anuncia as próprias vagas.`,actions:[{label:'Mostrar o local da entrevista',run:()=>W.guide(where,it.region)},{label:'Consultar vagas daqui',primary:false,run:()=>jobListing(it,page)}]});
      if(cl.elapsed>=a.at&&cl.elapsed<=a.until)return W.open({title:'Entrevista: '+def.name,icon:'chat',text:'O responsável chama você para conversar. Como pretende trabalhar?',actions:def.interview.map((label,i)=>({label,run:()=>transaction(()=>S().interview(h,it.region,i),()=>jobs(it,page))}))});
      return W.open({title:'Entrevista marcada',icon:'calendar',text:cl.elapsed>a.until?'O horário da entrevista passou. Fale com o responsável para reagendar.':`Aguarde aqui em ${S().placeName(where)}. A entrevista começa em ${Math.max(0,Math.ceil(a.at-cl.elapsed))} segundos de jogo.`,actions:[{label:cl.elapsed>a.until?'Encerrar o agendamento':'Aguardar a chamada',disabled:cl.elapsed<a.at,run:()=>{if(E.Sim.clock().elapsed>a.until){j.appointment=null;save();}jobs(it,page);}}],update:el=>{const now=E.Sim.clock().elapsed,b=el.querySelector('[data-action="0"]');if(now>=a.at){b.disabled=false;b.querySelector('span:last-child').textContent=now<=a.until?'Conversar com o entrevistador':'Encerrar o agendamento';}else el.querySelector('.ws-copy').textContent=`Aguarde aqui. O responsável chama você em ${Math.ceil(a.at-now)} segundos de jogo.`;}});
    }
    return jobListing(it,page);
  }
  function jobListing(it,page=0){
    const h=hero(),j=S().jobData(h,it.region),atEmployer=it.service!=='guild';
    const list=S().availableJobs?S().availableJobs(h,it.region,atEmployer?it.service:undefined):Object.entries(S().JOBS).filter(([id,d])=>!atEmployer||d.place===it.service).map(([id,d])=>({id,...d}));
    if(!list.length)return W.open({title:'Vagas deste estabelecimento',icon:'journal',text:'Este local não está contratando agora. A Casa dos Ofícios reúne os anúncios da região; Aurenna possui a maior variedade de empregos.',actions:[{label:'Encontrar a Casa dos Ofícios',run:()=>W.guide('guild',it.region)}]});
    const def=list[((page%list.length)+list.length)%list.length],id=def.id,actions=[];
    if(j.contract===id){
      actions.push({label:atEmployer?'Começar meu trabalho aqui':'Mostrar meu local de trabalho',run:()=>atEmployer?work(it):W.guide(def.place,it.region)});
      actions.push({label:'Deixar este emprego',primary:false,run:()=>W.open({title:'Encerrar contrato de trabalho',icon:'journal',text:'Você pode escolher outro caminho. Um turno ainda não concluído não gera salário.',actions:[{label:'Encerrar meu contrato',run:()=>transaction(()=>S().resign(h,it.region),()=>jobListing(it,page))},{label:'Continuar neste emprego',primary:false,run:()=>jobListing(it,page)}]})});
    }
    else actions.push({label:atEmployer?'Perguntar sobre a vaga ao responsável':'Encontrar este empregador',run:()=>atEmployer?(E.Workplace?E.Workplace.invite(it,id):transaction(()=>S().scheduleInterview(h,it.region,id,{atEmployer:true}),()=>jobs(it,page))):W.guide(def.place,it.region)});
    if(list.length>1)actions.push({label:'Ler a próxima vaga',primary:false,run:()=>jobListing(it,page+1)});
    if(it.service==='guild')actions.push({label:'Quero um ofício por conta própria',primary:false,run:()=>professions(it)});
    if(E.Work)actions.push({label:'Ver minha carteira de trabalho',primary:false,run:()=>E.Work.openCard()});
    W.open({title:def.name,icon:def.icon,text:`${S().jobPay?S().jobPay(id,it.region):def.pay} po por turno · ${def.duration} segundos. ${S().placeName(def.place)}. ${j.contract===id?'Você já foi contratado para esta vaga.':atEmployer?'Pergunte ao responsável sobre a vaga; a entrevista acontece na sala dos fundos.':'Visite a loja indicada e fale com o responsável ou com a placa VAGAS.'}${list.length>1?` Anúncio ${((page%list.length)+list.length)%list.length+1}/${list.length}.`:''}`,actions});
  }
  function work(it){
    const h=hero(),d=S().data(h),j=S().jobData(h,it.region),def=S().JOBS[j.contract],shift=d.activeShift;
    if(def&&E.Shopfloor&&E.Work&&E.Work.activity(j.contract)==='cashier'&&def.place===it.service)return E.Shopfloor.enter(it);
    if(!def||def.place!==it.service&&!(shift&&shift.region===it.region&&S().JOBS[shift.id].place===it.service))return jobs(it);
    if(j.appointment)return jobs(it);
    if(!shift)return W.open({title:def.name,icon:def.icon,text:`O responsável fornece o material. O turno leva ${def.duration} segundos de trabalho no local e paga até ${S().jobPay?S().jobPay(j.contract,it.region):def.pay} po.`,actions:[{label:'Iniciar meu turno aqui',disabled:j.lastShiftDay===E.Sim.clock().day,run:()=>transaction(()=>S().startShift(h,it.region),()=>work(it))},{label:'Consultar outras vagas daqui',primary:false,run:()=>jobListing(it)}]});
    const sd=S().JOBS[shift.id],step=shift.answers.length,task=sd.tasks[step];if(task)return W.open({title:`Etapa ${step+1} · ${sd.name}`,icon:sd.icon,text:task.q,actions:task.a.map((label,i)=>({label,run:()=>transaction(()=>S().answerTask(h,step,i),()=>work(it))}))});
    W.open({title:'Encerramento do turno',icon:'coin',text:`Trabalho registrado: ${Math.floor(shift.worked)}/${sd.duration} segundos. Permaneça no estabelecimento para concluir a jornada.`,actions:[{label:'Conferir o serviço e receber',disabled:shift.worked<sd.duration,run:()=>transaction(()=>S().finishShift(h,it.region),()=>work(it))}],update:el=>{const s=S().data(h).activeShift;if(!s)return;el.querySelector('.ws-copy').textContent=`Trabalho registrado: ${Math.floor(s.worked)}/${sd.duration} segundos. O responsável confere sua estação.`;el.querySelector('[data-action="0"]').disabled=s.worked<sd.duration;}});
  }
  function professions(it,page=0){
    const SS=S(),h=hero(),ids=Object.keys(SS.PROFESSIONS||{}),id=ids[((page%ids.length)+ids.length)%ids.length],def=id&&SS.PROFESSIONS[id];
    if(!def)return W.open({title:'Ofícios de Elarion',icon:'hammer',text:'Pesca, coleta, cozinha e comércio podem ser praticados livremente. Visite as bancadas da cidade e comece com as ferramentas adequadas.',actions:[]});
    const chosen=SS.profession&&SS.profession(h),currentId=typeof chosen==='string'?chosen:chosen&&chosen.id;
    W.open({title:def.name,icon:def.icon||'hammer',text:`${def.desc||def.description||'Pratique este ofício livremente para desenvolver suas habilidades.'} Não precisa de entrevista e não paga salário automático: o resultado vem dos produtos e atividades que você realizar.`,actions:[{label:currentId===id?'Este é meu ofício':`Quero ser ${def.name.toLowerCase()}`,disabled:currentId===id,run:()=>transaction(()=>SS.chooseProfession(h,id),()=>professions(it,page))},{label:'Onde posso praticar?',primary:false,run:()=>W.guide(def.service||def.place||'guild',it.region)},{label:'Conhecer outro ofício',primary:false,run:()=>professions(it,page+1)}]});
  }
  function wholesale(it,page=0){
    const B=E.Business,h=hero();if(!B)return W.open({title:'Fornecedor atacadista',icon:'package',text:'O fornecedor está organizando seus lotes. Volte em breve.',actions:[]});
    const catalogue=B.wholesale(it.region),list=Array.isArray(catalogue)?catalogue:catalogue.items||catalogue.catalogue||[],d=list[((page%list.length)+list.length)%list.length];
    if(!d)return W.open({title:'Bento · fornecedor atacadista',icon:'package',text:'O depósito aguarda uma nova entrega. Confira os lotes no próximo dia do jogo.',actions:[]});
    const pack=d.packSize||5,price=d.packPrice,stock=Number(d.stock??d.packsAvailable??0),packs=Number(d.packsAvailable??Math.floor(stock/pack)),retail=d.retailPrice;
    W.open({title:d.name,icon:d.icon||d.iconKey||'package',text:`Bento fornece caixas fechadas para comerciantes. Cada lote tem ${pack} unidades por ${price} po (${Math.round(price/pack*100)/100} po/unidade). ${packs} lotes disponíveis hoje.${retail?` Preço sugerido de revenda: ${retail} po/unidade.`:''} A compra vai para a sua mochila; leve os produtos ao seu ponto para expor.`,html:`<div class="stall-item-preview">${icon(d.icon||d.iconKey||'package')}<b>${pack} unidades / lote</b></div><label>Quantidade de lotes<input data-wholesale-packs type="number" inputmode="numeric" min="1" max="${Math.max(1,packs)}" value="1"></label><p data-wholesale-total>${price} po por ${pack} unidades</p>`,actions:[{label:`Comprar lote de ${pack} unidades`,disabled:packs<1||h.gold<price,run:el=>transaction(()=>B.buyWholesale(h,it.region,d.id,Number(el.querySelector('[data-wholesale-packs]').value)),()=>wholesale(it,page))},{label:'Examinar o próximo lote',primary:false,run:()=>wholesale(it,page+1)},{label:'Mostrar meu ponto comercial',primary:false,run:()=>W.guide('player-shop',it.region)}],mount:el=>{const input=el.querySelector('[data-wholesale-packs]');input.addEventListener('input',()=>{const n=Number(input.value);el.querySelector('[data-wholesale-total]').textContent=Number.isInteger(n)&&n>0?`${n*price} po por ${n*pack} unidades`:'Informe um número inteiro de lotes.';});}});
  }
  function contracts(it,page=0){const h=hero(),g=E.Life.ensureGuild(),c=g.board[page%g.board.length];if(!c)return;const mon=E.M.MONSTERS[c.mon],reg=E.WD.REGIONS[c.region],actions=[];if(c.state==='open')actions.push({label:'Retirar este contrato do quadro',run:()=>transaction(()=>({ok:E.Life.acceptContract(c.id),message:'Contrato conferido na guilda.'}),()=>contracts(it,page))});else if(c.state==='active'&&c.p>=c.n)actions.push({label:`Entregar e receber ${c.gold} po`,run:()=>transaction(()=>{const r=E.Life.turnInContract(c.id);return{ok:!!r,message:r?`Contrato pago: ${r.gold} po.`:'O contrato ainda não foi concluído.'};},()=>contracts(it,page))});actions.push({label:'Ler o próximo pergaminho',primary:false,run:()=>contracts(it,page+1)});W.open({title:`${c.boss?'Caçada: ':''}${mon.name} × ${c.n}`,icon:'quest',text:`${reg.name}. Recompensa: ${c.gold} po e ${c.rep} de reputação. ${c.state==='active'?`Progresso: ${c.p}/${c.n}.`:c.state==='done'?'Contrato já encerrado.':'O selo da guilda está intacto.'}`,actions});}
  function trade(it,page=null){const h=hero(),ids=Object.keys(E.L.GOODS),id=page!==null?ids[page%ids.length]:it.product||ids[0],def=E.L.GOODS[id],d=E.Life.data(h),buy=E.Life.buyPrice(h,id,it.region),sell=E.Life.sellPrice(h,id,it.region);W.open({title:def.name,icon:'package',text:`No caixote: compra ${buy} po; venda ${sell} po. Sua carga: ${d.cargo[id]||0}. Espaço usado ${E.Life.cargoCount(h)}/${E.Life.cap(h)}.`,actions:[{label:`Comprar uma unidade · ${buy} po`,disabled:h.gold<buy,run:()=>transaction(()=>E.Life.buy(h,id,1,it.region)||{ok:true,message:'Mercadoria colocada na carga.'},()=>trade(it,page))},{label:`Vender uma unidade · ${sell} po`,disabled:!(d.cargo[id]>0),primary:false,run:()=>transaction(()=>{const r=E.Life.sell(h,id,1,it.region);return typeof r==='string'?r:{ok:!!r,message:r?`${r.gain} po recebidos.`:'Mercadoria indisponível.'};},()=>trade(it,page))},{label:'Examinar o próximo caixote',primary:false,run:()=>trade(it,(ids.indexOf(id)+1)%ids.length)}]});}
  function cart(it){const h=hero(),d=E.Life.data(h),tier=d.cart+1,def=E.L.CARTS[tier];if(!def)return W.open({title:'Carroça de carga',icon:'package',text:`Sua carroça já comporta ${E.Life.cap(h)} unidades de mercadorias.`,actions:[]});W.open({title:def.name,icon:'package',text:`Capacidade base ${def.cap} unidades. Compra: ${def.price} po.`,actions:[{label:`Comprar · ${def.price} po`,disabled:h.gold<def.price,run:()=>transaction(()=>{if(h.gold<def.price)return{ok:false,message:'Ouro insuficiente.'};h.gold-=def.price;d.cart=tier;save();return{ok:true,message:'A carroça foi entregue junto ao armazém.'};},()=>cart(it))}]});}
  function fishingTools(it){const h=hero(),d=E.Life.data(h),rod=E.L.RODS[d.rod+1],actions=[];if(rod&&rod.cost)actions.push({label:`Comprar ${rod.name} · ${rod.cost.gold} po`,disabled:h.gold<rod.cost.gold,run:()=>transaction(()=>{const cost=rod.cost;if(h.gold<cost.gold)return{ok:false,message:'Ouro insuficiente.'};for(const [id,n]of Object.entries(cost.ore||{}))if((d.ores[id]||0)<n)return{ok:false,message:`Faltam ${n} ${E.L.ORES[id].name}.`};h.gold-=cost.gold;for(const[id,n]of Object.entries(cost.ore||{}))d.ores[id]-=n;d.rod++;save();return{ok:true,message:'Vara entregue e equipada.'};},()=>fishingTools(it))});actions.push({label:'Levar 5 iscas · 40 po',disabled:h.gold<40,run:()=>transaction(()=>{if(h.gold<40)return{ok:false,message:'Ouro insuficiente.'};h.gold-=40;d.bait+=5;save();return{ok:true,message:'Cinco iscas guardadas.'};},()=>fishingTools(it))});W.open({title:'Bancada do pescador',icon:'fish',text:`Vara atual: ${E.L.RODS[d.rod].name}. Iscas: ${d.bait}.${rod&&rod.cost?' A próxima vara também exige '+Object.entries(rod.cost.ore||{}).map(([id,n])=>`${n} ${E.L.ORES[id].name}`).join(', ')+'.':''}`,actions});}
  function fish(it,page=0){const h=hero(),bag=E.Life.data(h).fish,ids=Object.keys(bag).filter(id=>bag[id]>0),id=ids[page%ids.length],def=id&&E.L.FISH[id];if(!def)return W.open({title:'Peixaria do cais',icon:'fish',text:'Traga o pescado das margens dos lagos. Você pode vender uma unidade por vez ou preparar na cozinha.',actions:[]});const price=E.Life.fishValue(id);W.open({title:def.name,icon:'fish',text:`Você trouxe ${bag[id]}. O peixeiro oferece ${price} po por unidade.`,actions:[{label:`Entregar um peixe · receber ${price} po`,run:()=>transaction(()=>{const n=E.Life.sellFish(h,id,1);return{ok:n>0,message:n?`${n} po recebidos.`:'O peixe já foi usado.'};},()=>fish(it,page))},...(ids.length>1?[{label:'Mostrar outra espécie',primary:false,run:()=>fish(it,page+1)}]:[])]});}
  function arena(it,page=0){const h=hero(),a=E.L.ARENA[page%E.L.ARENA.length];W.open({title:a.name,icon:'shield',text:`Três ondas no anfiteatro. Recomendado nível ${a.lvl}. Prêmio base: ${a.gold} po e ${a.gems} gemas. O mestre de armas aguarda sua confirmação.`,actions:[{label:'Entrar na pista da arena',disabled:h.level<a.lvl,run:()=>{W.close();E.Guild.runArena(a);}},{label:'Consultar a próxima liga',primary:false,run:()=>arena(it,page+1)}]});}
  function cashier(it){const h=hero(),d=E.Life.data(h);W.open({title:'Caixa Fortuna Dourada',icon:'coin',text:`${d.chips} fichas no seu bolso. Uma ficha vale uma moeda de ouro do jogo.`,actions:[{label:'Trocar 10 po por 10 fichas',disabled:h.gold<10,run:()=>transaction(()=>{if(h.gold<10)return{ok:false,message:'Ouro insuficiente.'};h.gold-=10;d.chips+=10;save();return{ok:true,message:'Dez fichas sobre o balcão.'};},()=>cashier(it))},{label:'Trocar minhas fichas por ouro',disabled:d.chips<1,primary:false,run:()=>transaction(()=>{const n=d.chips;if(!Number.isSafeInteger(n)||n<1)return{ok:false,message:'Você não tem fichas.'};h.gold+=n;d.chips=0;save();return{ok:true,message:`${n} po recebidos.`};},()=>cashier(it))},{label:'Examinar os prêmios deste balcão',primary:false,run:()=>E.Casino.open({game:'premios',atTable:true,anchor:it})}]});}
  function casino(it,kind='roulette'){const h=hero(),d=E.Life.data(h);W.open({title:kind==='roulette'?'Mesa de roleta':'Mesa dos Desaforos',icon:'dice',text:`Aposta: 5 fichas. Você tem ${d.chips}. ${kind==='roulette'?'A bola percorre a roda; o zero pertence à casa.':'Dois dados: aposte acima ou abaixo de sete; sete pertence à casa.'}`,actions:(kind==='roulette'?[['Vermelho','red'],['Preto','black']]:[['Acima de sete','above'],['Abaixo de sete','below']]).map(([label,choice])=>({label,disabled:d.chips<5,run:()=>{
      if(d.chips<5)return notify({ok:false,message:'Troque ouro por fichas no caixa.'});d.chips-=5;save();const rolls=kind==='roulette'?null:[U.die(6),U.die(6)],n=kind==='roulette'?Math.floor(U.rand()*37):rolls[0]+rolls[1],red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n),won=kind==='roulette'?n!==0&&(choice==='red'?red:!red):(choice==='above'?n>7:n<7),gain=won?10:0;d.chips+=gain;E.Life.addXp(h,'jogatina',2);E.Life.ev('bet');save();
      if(it.group){const wheel=it.group.userData.wheel,from=wheel?wheel.rotation.y:0;let to=-n/37*Math.PI*2;while(to<from+Math.PI*6)to+=Math.PI*2;it.group.userData.serviceSpin={elapsed:0,from,to,rolls};}
      W.open({title:kind==='roulette'?`A bola parou no ${n}`:`Os dados somam ${n}`,icon:'dice',text:won?`Você recolhe 10 fichas. Saldo: ${d.chips}.`:`A banca recolhe a aposta. Saldo: ${d.chips}.`,actions:[{label:'Fazer outra aposta',run:()=>casino(it,kind)}]});
    }}))});}

  W.use=it=>{
    if(!it||!hero())return;source=it;
    if(it.service==='player-casino')return E.CasinoOwner&&E.CasinoOwner.use(it);
    if(E.Harbor&&['pier','fish','boat'].includes(it.action))return E.Harbor.open(it,it.action==='fish'?'sell':it.action==='boat'?'boat':'tools');
    const handlers={glider,food,potion,pick,weapon:weapons,upgrade,furniture,home:i=>property(i,'home'),contract:i=>property(i,'shop'),inn,cook:i=>meal(i,true),eat:i=>meal(i,false),jobs,work,professions,wholesale,contracts,trade,cart,pier:fishingTools,fish,alchemy:i=>craft(i,'alquimia'),smelt:i=>craft(i,'forja'),arena,cashier,roulette:i=>casino(i,'roulette'),dice:i=>casino(i,'dice'),blackjack:i=>E.Casino.open({game:'bj',atTable:true,anchor:i}),slots:i=>E.Casino.open({game:'slots',atTable:true,anchor:i})};
    if(it.service==='player-shop'&&it.action!=='contract')return E.StallLife&&E.StallLife.counter(it.region,it.action||'register');
    return (handlers[it.action]||handlers[{general:'glider',food:'food',smith:'weapon',furniture:'furniture',guild:'jobs',inn:'inn',home:'home',market:'trade',alchemy:'alchemy',pier:'pier',arena:'arena',casino:'roulette'}[it.service]]||(()=>W.open({title:'Estabelecimento',text:'Aproxime-se de uma bancada, produto ou morador para interagir.',actions:[]})))(it);
  };
  W.foodBag=(page=0)=>{
    const h=hero();if(!h)return;source={interior:!!(E.Interior&&E.Interior.current)};
    const d=E.Sim.data(h),items=E.Sim.foodItems(h).filter(f=>!f.raw&&f.hunger>0),f=items[page%items.length],actions=[];
    if(f)actions.push({label:`Comer ${f.name} · +${f.hunger}`,disabled:d.hunger>=99.99,run:()=>transaction(()=>E.Sim.eat(h,f.id),()=>W.foodBag(page))});
    if(items.length>1)actions.push({label:'Ver outra refeição da mochila',primary:false,run:()=>W.foodBag(page+1)});
    if(d.gliderOwned)actions.push({label:d.gliderEquipped?'Guardar planador':'Vestir meu planador',primary:false,run:()=>transaction(()=>E.Sim.equipGlider(h,!d.gliderEquipped),()=>W.foodBag(page))});
    W.open({title:'Mochila de viagem',icon:'backpack',text:`Saciedade ${Math.round(d.hunger)}/100. ${f?`${f.name}: ${f.n} porção(ões).`:'Você não tem uma refeição pronta.'} ${d.gliderOwned?(d.gliderEquipped?'O planador está equipado.':'O planador está guardado.'):'Compre seu planador no armazém da vila.'}`,actions});
  };
  W.guide=(kind,region)=>{
    W.close();const w=E.WG&&E.WG.world,h=w&&w.hero;
    if(!w||!h||!w.venues||!w.venues.length)return E.UI.toast('Saia da gruta e procure a vila da região.');
    const aliases={shop:'player-shop',room:'inn',kitchen:'food',trabalho:'guild'},service=aliases[kind]||kind;
    const venues=w.venues.filter(v=>v.service===service),v=venues.sort((a,b)=>Math.hypot(a.x-h.x,a.z-h.z)-Math.hypot(b.x-h.x,b.z-h.z))[0];
    if(!v)return E.UI.toast('Este serviço fica em Aurenna. Procure o estabelecimento no mapa da cidade.');
    if(E.Crowds&&E.Crowds.guide)E.Crowds.guide(w,v);
    E.UI.toast(`${v.name}: siga a indicação no chão e aproxime-se de uma bancada.`,'gold');
    return v;
  };
  W.service=(kind,region)=>{
    const w=E.WG&&E.WG.world,p=actor(),inside=E.Interior&&E.Interior.current,r=region||S().region();
    const primary={general:'glider',food:'cook',smith:'upgrade',furniture:'furniture',guild:'jobs',inn:'inn',home:'home',market:'trade',alchemy:'alchemy',pier:'pier',arena:'arena',casino:'roulette','player-shop':'register','player-casino':'casino-license'}[kind];
    if(inside){
      if(inside.kind!==kind)return E.UI.toast('Saia para a rua e procure o estabelecimento indicado.');
      return W.use({service:kind,action:primary,product:kind==='furniture'?'bed':undefined,region:r,interior:true});
    }
    const venues=(w&&w.venues||[]).filter(v=>v.service===kind&&v.region===r),v=p&&venues.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    if(!v)return W.guide(kind,r);
    if(kind==='inn'){
      const d=v.frontAt||v;return Math.hypot(p.x-d.x,p.z-d.z)<=4.2?S().enter('inn',r):W.guide(kind,r);
    }
    let fixtures=(v.fixtures||[]).filter(f=>f.action===primary);if(!fixtures.length&&kind==='food')fixtures=(v.fixtures||[]).filter(f=>f.action==='food');const it=fixtures.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0],place=W.currentPlace();
    if(!it||(!place||place.venue!==v)&&Math.hypot(p.x-it.x,p.z-it.z)>(it.r||2)+.8)return W.guide(kind,r);
    return W.use(it);
  };
  E.WorldServices=W;
})();
