/* Coliseu de Aurenna: cenário visitável, comunidade e acesso às ligas já existentes. */
(() => {
  'use strict';
  const A={}, I=E.Interior, U=E.U;
  const BOUNDS={left:-10.15,right:10.15,back:-9.35,front:9.2};
  const community=[
    {name:'Rhaz',ancestry:'fogo',activity:'fighter',x:-1.7,z:-1.0,outfit:'gladiador',build:'forte',line:'Este lugar também é o nosso refúgio. Muitos de nós chegaram aqui afastados de suas antigas casas; juntos, mantemos a comunidade de pé.'},
    {name:'Sira',ancestry:'eletrico',activity:'fighter',x:1.7,z:-1.0,outfit:'gladiador',build:'medio',line:'Durante o treino, observamos o parceiro e respeitamos seus limites. Na liga, as regras e os adversários são os mesmos que você já conhece.'},
    {name:'Vesh',ancestry:'veneno',activity:'trainer',x:-7.2,z:4.7,outfit:'viajante',build:'forte',line:'Cada pessoa traz suas próprias tradições. Aqui compartilhamos o espaço de treino e nos ajudamos a encontrar um novo começo.'},
    {name:'Iria',ancestry:'frio',activity:'rest',x:7.3,z:6.3,outfit:'viajante',build:'gordo',line:'O exílio não resume quem somos. Entre um treino e outro, conversamos, descansamos e cuidamos de quem acaba de chegar.'},
    {name:'Khar',ancestry:'acido',activity:'patrol',x:-6.15,z:-4.9,outfit:'cavaleiro',build:'forte',route:[[-6.15,-4.9],[-6.15,3.0],[0,7.4],[6.15,3.0],[6.15,-4.9]],line:'Patrulhamos os corredores para que lutadores e visitantes possam circular. A pista central e as arquibancadas ficam abertas a quem respeitar este refúgio.'},
    {name:'Neris',ancestry:'eletrico',activity:'social',x:6.8,z:2.2,outfit:'viajante',build:'magro',route:[[6.8,2.2],[7.7,3.3],[6.8,4.0]],line:'A arquibancada também é um ponto de encontro. Conversamos sobre o passado sem deixar de construir uma vida aqui.'},
    {name:'Tarra',ancestry:'veneno',activity:'spectator',x:3.0,z:-8.0,outfit:'viajante',build:'medio',line:'Observe os pés dos lutadores e o momento de cada defesa. Os confrontos da pista são exercícios entre companheiros, sem apostas.'},
    {name:'Mestre Arven',ancestry:'frio',activity:'master',x:-3.0,z:6.2,outfit:'cavaleiro',build:'medio',line:'O Coliseu acolhe nossa comunidade e mantém as ligas da arena. Consulte as inscrições antes de entrar na pista: as ondas e as recompensas não mudaram.'},
  ];
  const panel=opts=>E.WorldServices.open(opts);
  const close=()=>E.WorldServices.close();
  function fixture(c,kit,id,x,z,label,icon,run,r=1){
    const f=kit.fixture(c,id,x,z,{label,icon,r});f.run=run;c.fixtures.push(f);return f;
  }
  function floorAt(x,z){
    // The rear bleachers have broad, traversable stone steps; the circulation ring stays flat.
    if(z<-6.3){if(z<-8.5)return .99;if(z<-7.8)return .71;if(z<-7.1)return .43;return .15;}
    return .085;
  }
  function talk(c,node){
    panel({title:node.def.name+' · '+E.H.SPECIES.draconato.ancestries[node.def.ancestry],icon:'chat',text:node.def.line,actions:[
      {label:'Como posso participar?',run:()=>panel({title:'A vida no Coliseu',icon:'shield',text:'Caminhe pela pista e pelos corredores, suba à arquibancada, use os bonecos no espaço de treino ou procure Mestre Arven para as ligas da arena.',actions:[{label:'Encerrar conversa',run:close}]})},
      ...(node.def.activity==='master'?[{label:'Consultar inscrições',run:()=>A.enroll(c)}]:[]),
      {label:'Até logo',primary:false,run:close},
    ]});
  }
  A.enroll=(c,page=0)=>{
    if(!c||I.current!==c)return;
    const h=E.Store.hero(),league=E.L.ARENA[((page%E.L.ARENA.length)+E.L.ARENA.length)%E.L.ARENA.length];
    panel({title:league.name,icon:'shield',text:`${league.waves.length} ondas · nível recomendado ${league.lvl}. Prêmio base: ${league.gold} po e ${league.gems} gemas. São as ligas e o sistema de combate existentes; prepare sua comida e seus equipamentos antes de competir.`,actions:[
      {label:'Inscrever-se e entrar na pista',disabled:h.level<league.lvl||c.enrolling,run:()=>{
        if(c.enrolling||I.current!==c||E.Store.hero().level<league.lvl)return;
        c.enrolling=true;close();
        // Guild.runArena owns every wave, reward and first-win guard. Never award anything here.
        Promise.resolve(E.Guild.runArena(league)).catch(err=>{console.error(err);E.UI.toast('Não foi possível iniciar a liga.');}).finally(()=>{c.enrolling=false;});
      }},
      {label:'Próxima liga',primary:false,run:()=>A.enroll(c,page+1)},
      {label:'Continuar explorando',primary:false,run:close},
    ]});
  };
  function train(c,target){
    const h=E.Store.hero();
    panel({title:'Espaço de treinamento',icon:'shield',text:'Pratique um movimento contra o boneco. O exercício é livre, não concede recompensas nem altera seus atributos. Para enfrentar adversários de verdade, inscreva-se em uma liga com Mestre Arven.',actions:[
      {label:'Executar um golpe de treino',run:()=>{
        close();if(I.current!==c)return;
        c.drill={time:0,target,frames:[E.SP.hero(h,'atk',E.SP.heroWeaponType(h)),E.SP.hero(h,'idle0',E.SP.heroWeaponType(h))]};
        E.Audio&&E.Audio.sfx('swing');
      }},
      {label:'Consultar as ligas de combate',primary:false,run:()=>A.enroll(c)},
    ]});
  }
  function spectate(c){
    panel({title:'Arquibancada · confronto de treino',icon:'shield',text:'Rhaz e Sira alternam ataques e defesas na pista. Este é um exercício visível da comunidade, sem apostas ou prêmios.',html:'<p data-arena-round></p>',update:el=>{
      const n=el.querySelector('[data-arena-round]');if(n)n.textContent=`Assalto ${1+Math.floor(c.t/8)%4} · ${Math.floor(c.t/1.6)%2?'Sira avança; Rhaz recua.':'Rhaz avança; Sira observa a guarda.'}`;
    },actions:[{label:'Voltar a circular',run:close}]});
  }
  function decorate(c,kit){
    c.bounds=BOUNDS;c.frameHalfH=12.6;c.frameHalfW=14.5;c.floorAt=floorAt;c.hero={x:0,z:8.1,dir:1,stride:0};
    const box=(x,y,z,w,h,d,col)=>kit.box(c,c.room,x,y,z,w,h,d,col);
    const stone='#bca986',light='#ddcfb0',dark='#80694d',red='#a15d52';
    box(0,-.16,0,21.2,.32,20.2,stone);
    for(let x=-10;x<=10;x+=1.05)box(x,.012,0,.022,.018,19.7,'#9b886a');
    for(let z=-9.5;z<=9.5;z+=1.05)box(0,.013,z,20.8,.018,.022,'#a18d6e');
    box(0,2.2,-10,21.2,4.4,.3,light);box(-10.6,1.5,0,.3,3,20.2,light);box(10.6,.38,0,.3,.76,20.2,light);
    for(const side of[-1,1])for(let z=-8.9;z<=7;z+=4.1){box(side*10.25,1.8,z,.44,3.6,.5,dark);box(side*10.25,3.57,z,.64,.2,.7,stone);}
    for(let x=-8;x<=8;x+=4){box(x,2.7,-9.78,.16,2.6,.14,dark);box(x,2.7,-9.65,1.12,2.1,.05,red);}
    // Sand floor and low curb leave wide entrances at north/south and both side aisles.
    const sand=new THREE.Mesh(new THREE.CircleGeometry(5.5,40),kit.mat('#cfb27d'));sand.rotation.x=-Math.PI/2;sand.scale.y=.8;sand.position.set(0,.035,-1.0);c.room.add(sand);
    const edge=new THREE.Mesh(new THREE.RingGeometry(5.5,5.68,40),kit.mat('#8f7855'));edge.rotation.x=-Math.PI/2;edge.scale.y=.8;edge.position.set(0,.04,-1.0);c.room.add(edge);
    // Rear bleachers are physically accessible by their shallow steps. Side seating remains solid.
    for(let n=0;n<4;n++)box(0,.07+n*.14,-6.65-n*.70,18,.14+n*.28,.72,n%2?light:stone);
    for(const side of[-1,1])for(let n=0;n<3;n++){
      const x=side*(8.1+n*.65);box(x,.24+n*.2,-1.8,.66,.48+n*.4,8.6,n%2?light:stone);
      c.colliders.push({x,z:-1.8,hw:.33,hd:4.3});
    }
    kit.plaque(c,'COLISEU DE AURENNA',0,3.45,-9.78,5.4);
    kit.rug(c,0,8.1,3.2,1.6,red);
    fixture(c,kit,'exit',0,8.8,'Abrir os portões e sair','door',()=>I.close(),1.2);
    // Preparation and resting bays occupy the same open room, connected by the front corridor.
    kit.plaque(c,'PREPARAÇÃO',-6.9,2.2,8.2,2.5);kit.plaque(c,'DESCANSO',7.0,2.2,8.2,2.5);
    for(const x of[-6.9,7.0])for(const side of[-1,1])box(x+side*.95,1.10,8.14,.09,2.2,.12,dark);
    for(const x of[-8.6,-5.2]){box(x,.53,7.2,2.2,.16,.85,dark);for(const side of[-1,1])box(x+side*.8,.27,7.2,.12,.55,.6,dark);c.colliders.push({x,z:7.2,hw:1.1,hd:.43});}
    box(-8.8,1.05,5.7,.15,2.1,.18,dark);box(-8.8,1.82,5.7,1.1,.12,.14,dark);
    for(let n=0;n<3;n++)box(-9.2+n*.4,1.03,5.7,.07,1.68,.08,'#858a8a');
    for(const z of[5.5,7.3]){box(7.5,.45,z,3.0,.15,.9,dark);box(7.5,.73,z-.4,3.0,.55,.1,red);c.colliders.push({x:7.5,z,hw:1.5,hd:.45});}
    // Real targets receive a visible recoil while the player uses their own attack sprite.
    for(const z of[2.5,4.0]){
      const f=fixture(c,kit,'training',-7,z,'Treinar no boneco de palha','shield',null,.8);f.run=()=>train(c,f);
      kit.box(c,f.g,0,.76,0,.13,1.5,.13,dark);kit.box(c,f.g,0,1.31,0,1.05,.14,.14,dark);kit.cylinder(c,f.g,0,1.30,0,.29,.78,'#bca467');kit.cylinder(c,f.g,0,1.92,0,.22,.34,'#ccb67c');
      c.colliders.push({x:-7,z,hw:.48,hd:.32});
    }
    fixture(c,kit,'spectate',0,-7.65,'Assistir ao confronto de treino','shield',()=>spectate(c),1.3);
    const board=fixture(c,kit,'enroll',-3.9,5.2,'Ler inscrições e ligas','journal',()=>A.enroll(c),1.0);
    kit.box(c,board.g,0,1.1,0,1.45,1.1,.16,dark);kit.box(c,board.g,0,1.1,.1,1.22,.89,.025,'#e6d8b5');for(const s of[-1,1])kit.box(c,board.g,s*.57,.43,0,.10,.86,.12,dark);c.colliders.push({x:board.x,z:board.z,hw:.72,hd:.14});
    c.arenaNPCs=community.map((def,index)=>{
      const fake={species:'draconato',ancestry:def.ancestry,cls:'guerreiro',look:{build:def.build,outfit:E.CH.OUTFITS[def.outfit]?def.outfit:'viajante',hairStyle:10,hair:'#4c3544',eyes:['#edc66b','#b9daf1','#f2c971'][index%3],dragonHorns:['short','swept','ram','crown'][index%4],dragonSnout:index%2?'long':'broad',scalePattern:index%2?'plates':'smooth'}};
      const armed=['fighter','trainer','patrol'].includes(def.activity),frames=['idle0','idle1','atk','hit',...Array.from({length:12},(_,i)=>'w'+i)].map(f=>E.SP.hero(fake,f,armed?'espada':null));
      const s=kit.sprite(c,frames[0],2.15),shadow=kit.contact(c,c.scene,.36);c.scene.add(s);
      const f=fixture(c,kit,'community-'+index,def.x,def.z,'Conversar com '+def.name,'chat',null,.78),collider={x:def.x,z:def.z,r:.24};c.colliders.push(collider);
      const node={def,s,shadow,f,collider,frames,x:def.x,z:def.z,way:0,stride:0,next:0,dir:def.x>0?-1:1};f.run=()=>talk(c,node);return node;
    });
    c.onUpdate=dt=>update(c,kit,dt);
    c.onClose=()=>{const w=E.WG&&E.WG.world;if(w&&w.coliseumGate)w.coliseumGate.target=0;};
    update(c,kit,0);
  }
  function update(c,kit,dt){
    const sceneT=c.t,cycle=Math.floor(sceneT/1.6)%2,beat=sceneT%1.6;
    for(const [i,n]of c.arenaNPCs.entries()){
      let moving=false,frame=Math.floor(sceneT*1.5+i)%2;
      const activity=n.def.activity;
      if(n.def.route){
        const [tx,tz]=n.def.route[n.way],dx=tx-n.x,dz=tz-n.z,dist=Math.hypot(dx,dz);
        if(dist<.12){n.way=(n.way+1)%n.def.route.length;n.pause=(activity==='social'?2.3:1.1);}
        if(n.pause>0)n.pause-=dt;
        else if(dist>.01&&Math.hypot(n.x-c.hero.x,n.z-c.hero.z)>.65){const step=Math.min(dist,dt*(activity==='patrol'?.75:.50));n.x+=dx/dist*step;n.z+=dz/dist*step;n.stride+=step;if(Math.abs(dx)>.05)n.dir=dx<0?-1:1;moving=step>0;}
      }else if(activity==='fighter'){
        const active=i===cycle,shift=Math.sin(Math.min(1,beat/.8)*Math.PI)*.5;n.x=n.def.x+(i===0?1:-1)*shift;n.z=n.def.z+Math.sin(sceneT*1.2+i)*.22;
        n.dir=i===0?1:-1;frame=active&&beat>.35&&beat<.80?2:!active&&beat>.45&&beat<.85?3:frame;
      }else if(activity==='trainer')frame=sceneT%3.2<.45?2:frame;
      if(moving)frame=4+Math.floor(n.stride/3.3*12)%12;
      n.s.material.map=kit.texture(c,n.frames[frame]);const height=activity==='rest'?1.82:2.15;
      n.s.scale.set(height*n.frames[frame].width/n.frames[frame].height*n.dir,height,1);n.s.position.set(n.x,floorAt(n.x,n.z),n.z);n.shadow.position.set(n.x,floorAt(n.x,n.z)-.007,n.z);
      n.f.x=n.collider.x=n.x;n.f.z=n.collider.z=n.z;
    }
    if(c.drill){const d=c.drill;d.time+=dt;const k=Math.min(1,d.time/.55);d.target.g.rotation.z=Math.sin(k*Math.PI)*.12;const cv=d.frames[k<.7?0:1],h=E.WG.heroHeight(E.Store.hero())||2.3;c.sprite.material.map=kit.texture(c,cv);c.sprite.scale.set(h*cv.width/cv.height*c.hero.dir,h,1);if(k===1){d.target.g.rotation.z=0;c.drill=null;E.UI.toast('Movimento de treino concluído.');}}
  }
  A.enter=async region=>{
    const w=E.WG&&E.WG.world;if(!w||!w.reg||!w.reg.metro||A.entering)return false;
    A.entering=true;const wasLocked=E.WG.locked;E.WG.locked=true;
    try{
      if(w.coliseumGate){w.coliseumGate.target=1;await U.wait(360);}
      if(E.WG.world!==w||E.WG.mode()!=='world'||E.UI.anyOpen()||document.querySelector('.flash'))return false;
      E.Interior.open({kind:'coliseum',region:region||w.id,title:'Coliseu de Aurenna · Refúgio Draconato'});return true;
    }finally{A.entering=false;if(E.WG.world===w&&!I.current)E.WG.locked=wasLocked;}
  };
  A.community=community;A.bounds=BOUNDS;
  I.decorators.coliseum=decorate;
  E.ArenaLife=A;
})();
