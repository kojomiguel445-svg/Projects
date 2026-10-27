/* Serviços das vilas: contratos claros, estoque real, trabalho e organização da casa. */
(() => {
  'use strict';
  const U=E.U,UI=E.UI,S=()=>E.Settlements,hero=()=>E.Store.hero();
  const SU={};
  const icon=(key)=>E.Icons?E.Icons.html(key,{decorative:true}):'';
  const esc=U.esc;
  const note=(r)=>{if(r&&r.message)UI.toast(r.message,r.ok?'gold':'');if(r&&r.ok){E.HUD&&E.HUD.update();E.Interior&&E.Interior.refresh&&E.Interior.refresh();}return r;};
  const tabs=[['servicos','Vila'],['emporio','Empório'],['comida','Comida'],['pousada','Pousada'],['moradia','Moradia'],['loja','Minha loja'],['moveis','Móveis'],['organizar','Organizar casa'],['trabalho','Trabalho']];
  const shopFoodIds=()=>Object.entries(E.Sim.FOODS).filter(([,f])=>!f.raw&&f.price>0).slice(0,6).map(([id])=>id);
  const FOOD_PRICES={};
  SU.open=(region,initial='servicos')=>{
    const h=hero();if(!h)return;
    region=S().region(region);let tab=tabs.some(x=>x[0]===initial)?initial:'servicos';
    const el=UI.screen(S().regionName(region),{cls:'settlement-screen',right:'<span class="chip gold" data-coins></span>'});
    const body=el.querySelector('.screen-body');body.classList.add('settlement-body');
    let panel=null,jobInterval=null;
    const refresh=()=>{
      if(jobInterval){clearInterval(jobInterval);jobInterval=null;}
      el.querySelector('[data-coins]').innerHTML=icon('coin')+' '+h.gold+' po';
      body.innerHTML=`<nav class="sett-tabs" aria-label="Serviços da vila">${tabs.map(([id,n])=>`<button data-tab="${id}" class="${tab===id?'on':''}">${n}</button>`).join('')}</nav><div class="sett-pane"></div>`;
      body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;refresh();});
      panel=body.querySelector('.sett-pane');({servicos:services,emporio:general,comida:food,pousada:inn,moradia:home,loja:shop,moveis:furniture,organizar:arrange,trabalho:work}[tab]||services)();
    };
    const heading=(eyebrow,title,text)=>`<div class="sett-heading"><span>${eyebrow}</span><h3>${title}</h3><p>${text}</p></div>`;
    const button=(label,fn,cls='primary',disabled=false)=>{const b=U.h(`<button class="btn ${cls}" ${disabled?'disabled':''}>${label}</button>`);b.onclick=fn;return b;};
    const card=(ic,title,text)=>{const c=U.h(`<article class="sett-card"><div class="sett-card-icon">${icon(ic)}</div><h4>${title}</h4><p>${text}</p><div class="sett-actions"></div></article>`);panel.querySelector('.sett-grid').appendChild(c);return c.querySelector('.sett-actions');};
    const perform=(fn)=>{note(fn());refresh();};
    function services(){
      panel.innerHTML=heading('VIDA EM ELARION','Uma vila para viver','Entre nos estabelecimentos, encontre trabalho e transforme seu ouro em um lar. Um dia do calendário dura quatro minutos de jogo ativo.')+'<div class="sett-grid"></div>';
      [['general','shop','Empório e peixaria','Compre ferramentas de viagem e converse sobre o ofício de atendimento.'],['food','cooking','Cozinha e mercearia','Refeições prontas, ingredientes e uma cozinha comunitária.'],['smith','hammer','Forja','Armas, aprimoramentos e trabalho de auxiliar.'],['inn','bed','Pousada','Alugue um quarto, entre e durma na cama.'],['furniture','home','Marcenaria','Móveis de verdade para decorar e usar.'],['guild','mail','Casa dos ofícios','Marque uma entrevista e candidate-se a um trabalho.']].forEach(([kind,ic,name,text])=>card(ic,name,text).appendChild(button('Entrar',()=>{UI.close(el);S().enter(kind,region);}))); 
      card('home','Minha casa','Compre ou alugue um lar nesta vila.').appendChild(button('Ver moradias',()=>{tab='moradia';refresh();},'dark'));
      card('scales','Meu ponto comercial','Alugue uma loja e negocie com clientes de personalidade própria.').appendChild(button('Ver pontos',()=>{tab='loja';refresh();},'dark'));
    }
    function general(){
      const d=E.Sim.data(h);
      panel.innerHTML=heading('EMPÓRIO','Equipamento de viagem','O planador só funciona depois de comprado e equipado. No computador, segure Espaço no ar; no celular, toque no pulo uma vez enquanto estiver no ar.')+'<div class="sett-grid"></div>';
      const box=card('glider','Planador do viajante',d.gliderOwned?'Você já possui este equipamento.':'Asa de tecido, armação de madeira e tirantes. Compra única: 80 po.');
      if(!d.gliderOwned)box.appendChild(button('Comprar · 80 po',()=>perform(()=>E.Sim.buyGlider(h,80)), 'primary',h.gold<80));
      else box.appendChild(button(d.gliderEquipped?'Desequipar':'Equipar',()=>perform(()=>E.Sim.equipGlider(h,!d.gliderEquipped))));
      card('fish','Ferramentas de pesca','Varas, iscas e trocas continuam disponíveis no píer e com os pescadores.').appendChild(button('Ver ofícios de pesca',()=>E.Craft.open('pier'),'dark'));
      card('inventory','Seus itens','Abra o inventário para usar consumíveis e conferir o que pode levar à sua loja.').appendChild(button('Inventário',()=>E.Journal.inventory(),'dark'));
      workplace('general');
    }
    function food(){
      panel.innerHTML=heading('MERCEARIA','A viagem começa com uma refeição','A fome aumenta andando, correndo e batalhando. Com a barra vazia você não consegue correr e fica mais fraco no combate.')+'<div class="sett-food-status"></div><div class="sett-grid"></div>';
      panel.querySelector('.sett-food-status').textContent=`Saciedade: ${Math.round(E.Sim.data(h).hunger)}/100`;
      for(const id of shopFoodIds()){
        const f=E.Sim.FOODS[id],price=Math.max(1,Math.round(f.price));FOOD_PRICES[id]=price;
        card(f.iconKey||'cooking',esc(f.name),`${f.hunger||0} pontos de saciedade · ${price} po`).appendChild(button('Comprar uma porção',()=>perform(()=>{
          if(h.gold<price)return {ok:false,message:'Ouro insuficiente.'};h.gold-=price;E.Sim.addFood(h,id,1);E.Store.save();return {ok:true,message:`${f.name} comprado.`};
        }),'primary',h.gold<price));
      }
      card('cooking','Cozinha comunitária','Entre na cozinha da vila e use o fogão para preparar os seus ingredientes.').appendChild(button('Cozinhar / comer',()=>E.Sim.openFood({fire:E.Sim.canCook(h)}),'dark'));
      workplace('food');
    }
    function inn(){
      const p=S().property(h,region,'room'),access=S().hasAccess(h,region,'room');
      panel.innerHTML=heading('POUSADA','Uma noite de descanso',`A diária custa ${(S().prices?S().prices(region,'room'):S().PRICES.room).rent} po. O quarto é um interior visitável; use a cama para dormir até o próximo amanhecer. A estadia inclui um descanso e não fornece comida.`)+'<div class="sett-grid"></div>';
      const box=card('bed',access?'Seu quarto está reservado':'Quarto disponível',access?'A chave está com você. Entre e procure a cama.':'A reserva fica válida por até um dia do jogo, ou até você usar a cama.');
      box.appendChild(button(access?'Entrar no quarto':`Reservar · ${(S().prices?S().prices(region,'room'):S().PRICES.room).rent} po`,()=>{if(!access){const r=S().acquire(h,region,'room','rent');note(r);if(!r.ok)return;}UI.close(el);S().enter('room',region);},'primary',!access&&h.gold<(S().prices?S().prices(region,'room'):S().PRICES.room).rent));
      card('home','Um lar permanente','Uma casa sua também permite dormir e manter móveis, comida e itens guardados.').appendChild(button('Ver moradias',()=>{tab='moradia';refresh();},'dark'));
    }
    function contract(kind){
      const p=S().property(h,region,kind),access=S().hasAccess(h,region,kind),price=S().prices?S().prices(region,kind):S().PRICES[kind];
      const label=kind==='home'?'casa':'loja';
      const box=card(kind==='home'?'home':'shop',kind==='home'?'Casa de viajante':'Ponto comercial',p?`${p.mode==='owned'?'Compra quitada':`Aluguel: ${price.rent} po por dia`}${p.arrears?` · Pendente: ${p.arrears} po. Seus itens permanecem guardados.`:''}`:`Compra: ${price.buy} po · aluguel: ${price.rent} po por dia do calendário.`);
      if(access)box.appendChild(button(`Entrar na ${label}`,()=>{UI.close(el);S().enter(kind==='home'?'home':'player-shop',region);}));
      if(p&&p.mode==='rent'&&!access)box.appendChild(button('Regularizar aluguel',()=>perform(()=>S().payRent(h,region,kind))));
      if(!p)box.appendChild(button(`Alugar · ${price.rent} po/dia`,()=>perform(()=>S().acquire(h,region,kind,'rent')),'dark',h.gold<price.rent));
      if(!p||p.mode!=='owned')box.appendChild(button(`Comprar · ${price.buy} po`,()=>perform(()=>S().acquire(h,region,kind,'buy')),'dark',h.gold<price.buy));
      return {p,access};
    }
    function home(){
      panel.innerHTML=heading('MORADIA','Uma porta só sua','O aluguel é cobrado uma vez por dia do calendário. Se faltar ouro, o acesso fica suspenso; seus móveis e itens não somem. Uma casa comprada não tem aluguel.')+'<div class="sett-grid"></div>';
      const {p,access}=contract('home');
      if(p){card('bed','Sua mobília',`${(p.furniture||[]).length} móveis comprados ou incluídos no contrato. Você pode reposicionar e guardar sem vender.`).appendChild(button('Organizar',()=>{tab='organizar';refresh();},'dark',!access));}
    }
    function shop(){
      panel.innerHTML=heading('COMÉRCIO','Seu ponto na vila','Compre ou alugue uma loja, escolha o visual do ponto e venda seus próprios itens. Durante a noite chegam menos clientes.')+'<div class="sett-grid"></div>';
      const {p,access}=contract('shop');
      if(!p||!access)return;
      const name=card('quill','Nome da loja','Um nome curto aparece na fachada e nas negociações.');
      const inp=U.h(`<input class="field" maxlength="24" aria-label="Nome da loja" value="${esc(p.name)}">`);name.appendChild(inp);name.appendChild(button('Salvar nome',()=>perform(()=>S().renameShop(h,region,inp.value)),'dark'));
      for(const [id,skin]of Object.entries(S().SKINS))card('fabric',skin.name,(p.skinUnlocks||[]).includes(id)?'Visual já adquirido.':`${skin.price} po · compra única.`).appendChild(button(p.skin===id?'Em uso':'Aplicar',()=>perform(()=>S().decorate(h,region,'skin',id)),'dark',p.skin===id));
    }
    function furniture(){
      panel.innerHTML=heading('MARCENARIA','Móveis que fazem parte da casa','As compras ficam nesta vila. Depois de comprar, abra Organizar casa para posicionar o móvel e entre para usá-lo.')+'<div class="sett-grid"></div>';
      for(const [id,f]of Object.entries(S().FURNITURE))card(f.icon,f.name,`${f.desc} · ${f.price} po`).appendChild(button(`Comprar · ${f.price} po`,()=>perform(()=>S().buyFurniture(h,region,id)),'primary',h.gold<f.price));
    }
    function arrange(){
      const p=S().property(h,region,'home');
      panel.innerHTML=heading('MEU LAR','Seu espaço, do seu jeito','Escolha um móvel e uma posição. A entrada deve permanecer livre; móveis guardados continuam sendo seus.')+'<div class="sett-grid"></div>';
      if(!p||!S().hasAccess(h,region,'home')){contract('home');return;}
      for(const f of p.furniture||[]){
        const def=S().FURNITURE[f.id];if(!def)continue;
        const row=card(def.icon,def.name,f.stored?'Guardado na casa.':`Posição ${f.x.toFixed(1)}, ${f.z.toFixed(1)}.`);
        const select=U.h('<select class="field" aria-label="Posição do móvel"></select>');
        const slots=[[-2.8,-2.2],[0,-2.2],[2.8,-2.2],[-2.8,0],[0,0],[2.8,0],[-2.8,2.2],[2.8,2.2]];
        slots.forEach(([x,z],i)=>{const option=document.createElement('option');option.value=i;option.textContent=['Fundo esquerdo','Fundo central','Fundo direito','Lado esquerdo','Centro','Lado direito','Frente esquerda','Frente direita'][i];select.appendChild(option);});
        row.appendChild(select);row.appendChild(button('Posicionar',()=>{const pos=slots[+select.value];perform(()=>S().placeFurniture(h,region,f.uid,pos[0],pos[1],Math.round((f.r||0)/(Math.PI/2))));},'dark'));
        row.appendChild(button('Girar',()=>perform(()=>S().placeFurniture(h,region,f.uid,f.x,f.z,Math.round((f.r||0)/(Math.PI/2))+1)),'dark',f.stored));
        if(!f.stored)row.appendChild(button('Guardar móvel',()=>perform(()=>S().storeFurniture(h,region,f.uid)),'dark'));
      }
      for(const [id,w]of Object.entries(S().WALLS))card('home',w.name,(p.wallUnlocks||[]).includes(id)?'Acabamento já adquirido.':`${w.price} po para pintar as paredes.`).appendChild(button(p.wall===id?'Aplicado':'Pintar',()=>perform(()=>S().decorate(h,region,'wall',id)),'dark',p.wall===id));
    }
    function workplace(kind){
      const j=S().jobData(h,region),def=S().JOBS[j.contract];if(!def||def.place!==kind)return;
      card(def.icon,`Seu trabalho: ${def.name}`,`Turno remunerado: ${def.pay} po, ajustados pela qualidade das três etapas.`).appendChild(button('Abrir turno',()=>{tab='trabalho';refresh();},'dark'));
    }
    function work(){
      const j=S().jobData(h,region),data=S().data(h),cl=E.Sim.clock();
      panel.innerHTML=heading('CASA DOS OFÍCIOS','Trabalho que paga a próxima viagem','Marque uma entrevista, compareça na Casa dos Ofícios e tente conquistar a vaga. Depois, entre no estabelecimento do seu empregador para cumprir um turno. Cada vila paga um turno por dia.')+'<div class="sett-job-status"></div><div class="sett-grid"></div>';
      if(data.activeShift){
        const sh=data.activeShift,def=S().JOBS[sh.id];
        const area=card(def.icon,def.name,`O empregador fornece os materiais. O tempo conta apenas dentro do local de trabalho: ${S().placeName(def.place)}.`);
        const status=U.h('<p class="sett-shift-progress"></p>');area.appendChild(status);
        if(sh.answers.length<def.tasks.length){const task=def.tasks[sh.answers.length],q=U.h(`<strong>${esc(task.q)}</strong>`);area.appendChild(q);task.a.forEach((a,i)=>area.appendChild(button(esc(a),()=>perform(()=>S().answerTask(h,sh.answers.length,i)),'dark')));}
        const finish=button('Concluir e receber',()=>perform(()=>S().finishShift(h,region)));area.appendChild(finish);
        if(!E.Interior.current||E.Interior.current.kind!==def.place)area.appendChild(button('Ir ao local de trabalho',()=>{UI.close(el);S().enter(def.place,sh.region);},'dark'));
        const tick=()=>{status.textContent=`Tempo trabalhado: ${Math.floor(sh.worked)}/${def.duration}s · Etapas ${sh.answers.length}/3`;finish.disabled=sh.worked<def.duration||sh.answers.length<3;};tick();jobInterval=setInterval(tick,250);return;
      }
      if(j.contract){const def=S().JOBS[j.contract];const area=card(def.icon,`Contrato: ${def.name}`,`Salário-base ${def.pay} po · ${def.duration}s trabalhando dentro de ${S().placeName(def.place)}.`);area.appendChild(button('Iniciar turno',()=>perform(()=>S().startShift(h,region)),'primary',j.lastShiftDay===cl.day));area.appendChild(button('Entrar no local de trabalho',()=>{UI.close(el);S().enter(def.place,region);},'dark'));}
      if(j.appointment){
        const a=j.appointment,def=S().JOBS[a.id],area=card('calendar',`Entrevista: ${def.name}`,'Compareça à Casa dos Ofícios durante o horário reservado.');
        const time=U.h('<p class="sett-appointment-time"></p>');area.appendChild(time);
        const choices=document.createElement('div');choices.className='sett-interview';area.appendChild(choices);
        def.interview.forEach((answer,i)=>choices.appendChild(button(esc(answer),()=>perform(()=>S().interview(h,region,i)),'dark')));
        area.appendChild(button('Entrar na Casa dos Ofícios',()=>{UI.close(el);S().enter('guild',region);},'dark'));
        const tick=()=>{const now=E.Sim.clock().elapsed,at=a.at-now,end=a.until-now;time.textContent=at>0?`Começa em ${Math.ceil(at)}s de jogo ativo.`:end>0?`Entrevista aberta por mais ${Math.ceil(end)}s.`:'Horário encerrado. Marque outra entrevista.';choices.querySelectorAll('button').forEach(b=>b.disabled=at>0||end<=0||!E.Interior.current||E.Interior.current.kind!=='guild');};tick();jobInterval=setInterval(tick,250);
      }
      for(const [id,def]of Object.entries(S().JOBS))card(def.icon,def.name,`${def.pay} po por turno bem feito. Materiais e ferramentas fornecidos pelo empregador.`).appendChild(button('Marcar entrevista',()=>perform(()=>S().scheduleInterview(h,region,id)),'dark',j.interviewDay===cl.day||!!(j.appointment&&j.appointment.until>cl.elapsed)));
    }
    UI.open(el,()=>{if(jobInterval)clearInterval(jobInterval);});refresh();
  };
  SU.storage=(region)=>{
    const h=hero(),p=S().property(h,region,'home');if(!p||!S().hasAccess(h,region,'home'))return;
    const el=UI.screen('Baú da casa',{cls:'settlement-screen'}),body=el.querySelector('.screen-body');
    const draw=()=>{
      body.innerHTML='<div class="sett-heading"><h3>Seus itens ficam guardados aqui</h3><p>Consumíveis, alimentos e mercadorias. Armas equipadas e itens bloqueados permanecem com você.</p></div><div class="sett-storage"></div>';
      const box=body.querySelector('.sett-storage');let count=0;
      for(const kind of ['inventory','food','cargo']){
        const inv=kind==='inventory'?h.inventory:kind==='food'?E.Sim.data(h).food:E.Life.data(h).cargo,stored=(p.storage&&p.storage[kind])||{},ids=[...new Set([...Object.keys(inv),...Object.keys(stored)])];
        for(const id of ids){const n=inv[id]||0,m=stored[id]||0;if(!n&&!m)continue;count++;const def=kind==='food'?E.Sim.FOODS[id]:kind==='cargo'?E.L.GOODS[id]:E.R.ITEMS[id];const row=U.h(`<div class="sett-storage-row"><div><b>${esc(def?def.name:id)}</b><small>Com você: ${n} · No baú: ${m}</small></div><div class="sett-actions"></div></div>`);const actions=row.querySelector('.sett-actions');
          if(n)actions.appendChild(U.h('<button class="btn sm dark" data-store>Guardar 1</button>'));
          if(m)actions.appendChild(U.h('<button class="btn sm primary" data-take>Retirar 1</button>'));
          const put=row.querySelector('[data-store]'),take=row.querySelector('[data-take]');if(put)put.onclick=()=>{note(S().transfer(h,region,kind,id,1,true));draw();};if(take)take.onclick=()=>{note(S().transfer(h,region,kind,id,1,false));draw();};box.appendChild(row);
        }
      }
      if(!count)box.innerHTML='<p class="muted">Não há itens para transferir agora.</p>';
    };UI.open(el);draw();
  };
  E.SettlementUI=SU;
})();
