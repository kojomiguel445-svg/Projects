/* Salão Fortuna Dourada: espaço caminhável e mesas dos jogos já existentes. */
(() => {
  'use strict';
  const C={},I=E.Interior;
  const BOUNDS={left:-8.65,right:8.65,back:-6.6,front:7.0};
  const GOLD='#d6ae57',PURPLE='#663b79',DARK='#33233f',FELT='#206d60';
  const close=()=>E.WorldServices.close();
  function fixture(c,kit,id,x,z,label,icon,r=.8){
    const f=kit.fixture(c,id,x,z,{label,icon,r});
    Object.assign(f,{group:f.g,interior:true,service:'casino',region:c.region,venue:c.worldVenue});c.fixtures.push(f);return f;
  }
  function canvas(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);return cv;}
  function face(c,kit,parent,cv,x,y,z,w,h,flat=false){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:kit.texture(c,cv),side:THREE.DoubleSide}));
    m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;parent.add(m);return m;
  }
  function sign(c,kit,parent,text,x,y,z,w=2.2){
    const cv=canvas(512,112,(p,W,H)=>{p.fillStyle=DARK;p.fillRect(0,0,W,H);p.strokeStyle=GOLD;p.lineWidth=8;p.strokeRect(7,7,W-14,H-14);p.fillStyle='#ffebae';p.font='bold 41px Georgia,serif';p.textAlign='center';p.textBaseline='middle';p.fillText(text,W/2,H/2,W-30);});
    return face(c,kit,parent,cv,x,y,z,w,w*112/512);
  }
  function stool(c,kit,g,x,z){
    kit.cylinder(c,g,x,.20,z,.34,.15,GOLD);kit.cylinder(c,g,x,.49,z,.085,.62,'#6b5546');kit.cylinder(c,g,x,.83,z,.40,.18,PURPLE);
  }
  function chips(c,kit,g,x,z,color=GOLD,count=3){for(let i=0;i<count;i++)kit.cylinder(c,g,x,1.18+i*.055,z,.105,.045,color);}
  function batch(f,exclude=[]){if(E.ScenePerf)E.ScenePerf.batch(f.g,{exclude});}
  function play(c,f,game){if(I.current!==c||!E.Casino)return;c.activeTable=f;E.Casino.open({game,atTable:true,anchor:f});}
  function drawMachine(m){
    const p=m.canvas.getContext('2d'),symbols=E.CasinoGames&&E.CasinoGames.SYMBOLS||[],cols=['#b84555','#b49431','#ad7c25','#b58b25','#398caa','#c34855','#37785b'];
    p.fillStyle='#1c1930';p.fillRect(0,0,300,132);
    for(let i=0;i<3;i++){const n=m.reels[i],symbol=symbols[n];p.fillStyle='#fff2cd';p.fillRect(8+i*98,9,88,113);p.strokeStyle='#c69d50';p.lineWidth=4;p.strokeRect(8+i*98,9,88,113);p.fillStyle=cols[n];p.textAlign='center';p.textBaseline='middle';p.font='bold 61px Georgia,serif';p.fillText(symbol?symbol.mark:['7','★','◇'][i],52+i*98,68,79);}
    m.texture.needsUpdate=true;
  }
  function machine(c,kit,index,x){
    const f=fixture(c,kit,'slots-'+index,x,-5.18,'Jogar na máquina '+(index+1)+' · três rolos','slots',.66),g=f.g;
    g.name='casino-three-reel-machine-'+index;
    kit.box(c,g,0,.67,0,1.25,1.24,.94,DARK);kit.box(c,g,0,1.65,-.04,1.35,1.13,.88,PURPLE);kit.box(c,g,0,2.30,-.04,1.46,.20,1.02,GOLD);
    kit.box(c,g,0,1.61,.43,1.22,.68,.08,GOLD);kit.box(c,g,0,.97,.43,1.27,.13,.49,GOLD);kit.box(c,g,0,.99,.55,.30,.08,.10,'#d95469');kit.box(c,g,0,.53,.50,.55,.18,.04,'#141c2b');
    sign(c,kit,g,'DRAGÃO · 777',0,2.28,.49,1.31);
    const cv=canvas(300,132,()=>{}),texture=kit.texture(c,cv),screen=face(c,kit,g,cv,0,1.65,.48,1.09,.50);screen.userData.noStaticBatch=true;
    const lever=new THREE.Group();lever.position.set(.79,1.02,.02);g.add(lever);lever.userData.noStaticBatch=true;
    kit.box(c,lever,0,.30,0,.075,.66,.075,GOLD);const knob=new THREE.Mesh(new THREE.SphereGeometry(.145,8,6),kit.mat('#d8536b'));knob.position.y=.65;lever.add(knob);
    const m={canvas:cv,texture,lever,reels:[index%7,(index+3)%7,(index+5)%7],time:0,drawAt:-1};f.g.userData.casinoMachine=m;c.casinoMachines.push(m);drawMachine(m);
    stool(c,kit,g,0,1.28);c.colliders.push({x,z:-5.18,hw:.66,hd:.5});f.run=()=>play(c,f,'slots');batch(f,[lever,screen]);return f;
  }
  function table(c,kit,id,x,z,label,game,w=3.1,d=1.7){
    const f=fixture(c,kit,id,x,z,label,game==='bj'?'cards':game==='roleta'?'roulette':'dice',.9),g=f.g;
    g.name='casino-table-'+id;
    for(const side of[-1,1])kit.box(c,g,side*(w/2-.40),.56,0,.22,1.05,d-.45,DARK);
    kit.box(c,g,0,1.05,0,w,.20,d,GOLD);kit.box(c,g,0,1.17,0,w-.16,.06,d-.16,FELT);
    c.colliders.push({x,z,hw:w/2,hd:d/2});f.game=game;f.run=()=>play(c,f,game);return f;
  }
  function felt(c,kit,f,w,d,title,draw){
    const cv=canvas(600,340,(p,W,H)=>{p.fillStyle=FELT;p.fillRect(0,0,W,H);p.strokeStyle='#e5c47c';p.lineWidth=4;p.strokeRect(15,15,W-30,H-30);p.fillStyle='#f6dfaa';p.textAlign='center';p.font='bold 31px Georgia,serif';p.fillText(title,W/2,48);draw(p,W,H);});
    return face(c,kit,f.g,cv,0,1.207,0,w,d,true);
  }
  function roulette(c,kit){
    const f=table(c,kit,'roulette',-4.3,-.6,'Jogar na roleta europeia','roleta',3.4,1.95);
    felt(c,kit,f,3.16,1.71,'ROLETA',(p)=>{for(let n=0;n<12;n++){p.fillStyle=n%2?'#292333':'#b74653';p.fillRect(246+(n%4)*75,81+Math.floor(n/4)*65,70,59);p.fillStyle='#fff2cf';p.font='24px Georgia';p.fillText(String(n+1),281+(n%4)*75,120+Math.floor(n/4)*65);}});
    const wheel=new THREE.Group();wheel.position.set(-.92,1.225,.08);f.g.add(wheel);wheel.userData.noStaticBatch=true;
    kit.cylinder(c,wheel,0,.025,0,.66,.12,'#6d403b');
    const cv=canvas(256,256,(p)=>{p.translate(128,128);for(let n=0;n<37;n++){p.beginPath();p.moveTo(0,0);p.arc(0,0,119,n/37*Math.PI*2,(n+1)/37*Math.PI*2);p.closePath();p.fillStyle=n===0?'#2e9370':n%2?'#ba4150':'#231f2c';p.fill();p.save();p.rotate((n+.5)/37*Math.PI*2);p.fillStyle='#fff1c7';p.font='bold 12px Georgia';p.textAlign='center';p.fillText(String(n),96,4);p.restore();}p.beginPath();p.arc(0,0,61,0,Math.PI*2);p.fillStyle=GOLD;p.fill();p.beginPath();p.arc(0,0,44,0,Math.PI*2);p.fillStyle='#6d403b';p.fill();});
    face(c,kit,wheel,cv,0,.093,0,1.25,1.25,true);kit.cylinder(c,wheel,0,.18,0,.07,.25,GOLD);for(let n=0;n<4;n++){const a=n*Math.PI/2,b=kit.box(c,wheel,Math.sin(a)*.15,.20,Math.cos(a)*.15,.04,.04,.46,GOLD);b.rotation.y=a;}
    const ball=new THREE.Mesh(new THREE.SphereGeometry(.055,6,4),kit.mat('#fff6dc'));ball.position.set(.52,.14,0);wheel.add(ball);f.g.userData.wheel=wheel;f.g.userData.ball=ball;
    chips(c,kit,f.g,1.04,.48,'#c74d69',4);chips(c,kit,f.g,1.36,.48,'#e9ca76',3);batch(f,[wheel]);return f;
  }
  function blackjack(c,kit){
    const f=table(c,kit,'blackjack',4.25,-.6,'Sentar e jogar Vinte-e-Um','bj',3.3,1.75);
    felt(c,kit,f,3.06,1.51,'VINTE E UM',(p,W,H)=>{p.strokeStyle='#f5daa1';p.lineWidth=4;p.beginPath();p.ellipse(W/2,160,220,125,0,0,Math.PI);p.stroke();p.font='22px Georgia';p.fillStyle='#f6dfaa';p.fillText('BLACKJACK PAGA 3:2',W/2,91);for(let n=0;n<3;n++){p.save();p.translate(157+n*140,229);p.rotate((n-1)*-.17);p.fillStyle='#fff4d6';p.fillRect(-26,-38,52,73);p.fillStyle=n===1?'#b84251':'#292330';p.font='bold 32px Georgia';p.fillText(['A','♥','K'][n],0,7);p.restore();}});
    chips(c,kit,f.g,-1.15,-.45,'#e5c16d',4);chips(c,kit,f.g,1.15,-.45,'#bd4669',3);
    for(const x of[-1.06,1.06])stool(c,kit,f.g,x,1.30);
    // The central chair accepts the player's own seated sprite; its legs do not block entry.
    kit.box(c,f.g,0,.48,1.30,.72,.14,.68,PURPLE);kit.box(c,f.g,0,.89,1.58,.72,.80,.12,GOLD);for(const x of[-.27,.27])for(const z of[1.05,1.55])kit.box(c,f.g,x,.24,z,.09,.48,.09,DARK);
    f.seat={x:f.x,z:f.z+1.3};batch(f);return f;
  }
  function dice(c,kit){
    const f=table(c,kit,'dice',-4.3,3.1,'Jogar Dados do Desaforo','dados',3.35,1.85);
    felt(c,kit,f,3.11,1.61,'DADOS DO DESAFORO',(p,W)=>{p.strokeStyle='#e4c27c';p.lineWidth=3;for(let n=0;n<3;n++){p.strokeRect(34+n*183,85,171,183);p.fillStyle='#f6dfaa';p.font='bold 31px Georgia';p.fillText(['< 7','= 7','> 7'][n],120+n*183,177);}p.font='19px Georgia';p.fillText('DOIS D6 · ESCOLHA SUA APOSTA',W/2,310);});
    const dieMaterials=Array.from({length:6},(_,n)=>{const cv=canvas(96,96,p=>{p.fillStyle='#fff1ce';p.fillRect(0,0,96,96);p.strokeStyle='#d2ad62';p.lineWidth=5;p.strokeRect(3,3,90,90);const dots=[[[48,48]],[[25,25],[71,71]],[[25,25],[48,48],[71,71]],[[25,25],[71,25],[25,71],[71,71]],[[25,25],[71,25],[48,48],[25,71],[71,71]],[[25,23],[71,23],[25,48],[71,48],[25,73],[71,73]]][n];p.fillStyle='#5a315c';for(const [x,y]of dots){p.beginPath();p.arc(x,y,8,0,Math.PI*2);p.fill();}});return new THREE.MeshStandardMaterial({map:kit.texture(c,cv),roughness:.6});});
    f.g.userData.dice=[-.43,.43].map((x,index)=>{const die=new THREE.Mesh(new THREE.BoxGeometry(.38,.38,.38),dieMaterials);die.position.set(x,1.42,.08);die.rotation.set(index*.4,.3+index*.6,.1);die.userData.noStaticBatch=true;f.g.add(die);return die;});
    chips(c,kit,f.g,-1.24,-.50,'#c74c6a',4);chips(c,kit,f.g,1.24,-.50,'#e8ca79',4);batch(f,f.g.userData.dice);return f;
  }
  function cashier(c,kit){
    const f=fixture(c,kit,'cashier',0,-5.18,'Trocar fichas com o caixa','coin',.95);f.action='cashier';
    kit.box(c,f.g,0,.65,0,3.2,1.20,1.0,DARK);kit.box(c,f.g,0,1.30,0,3.42,.15,1.16,GOLD);kit.box(c,f.g,0,.72,.51,2.96,.70,.035,PURPLE);
    kit.box(c,f.g,.62,1.55,0,.70,.40,.50,'#b69c6c');kit.box(c,f.g,.62,1.65,.28,.55,.14,.025,'#2f3a3c');chips(c,kit,f.g,-.84,.1,'#e4c675',5);chips(c,kit,f.g,-1.18,.1,'#c24f6d',4);
    sign(c,kit,f.g,'CAIXA · FICHAS',0,.77,.545,2.60);
    c.colliders.push({x:0,z:-5.18,hw:1.7,hd:.58});f.run=()=>E.WorldServices.use(f);batch(f);return f;
  }
  function pawnCounter(c,kit){
    const f=fixture(c,kit,'pawn-counter',7.55,.2,'Avaliar ou resgatar equipamento com Nara','sword',.9),g=f.g;
    g.name='casino-pawn-counter';
    kit.box(c,g,0,.58,0,1.65,1.10,1.05,DARK);kit.box(c,g,0,1.17,0,1.78,.15,1.18,GOLD);
    kit.box(c,g,0,.62,.54,1.48,.71,.035,PURPLE);sign(c,kit,g,'PENHORES',0,.72,.565,1.4);
    kit.box(c,g,-.42,1.30,0,.39,.10,.28,'#ede0ba');chips(c,kit,g,.45,.12,GOLD,4);
    // Cofre físico atrás do balcão: nenhuma retirada por inventário de mobília.
    kit.box(c,g,0,.84,-1.70,1.44,1.68,.48,'#51465b');kit.box(c,g,0,.86,-1.44,1.18,1.37,.035,'#796a76');
    kit.cylinder(c,g,.28,.86,-1.39,.18,.06,GOLD).rotation.x=Math.PI/2;
    sign(c,kit,g,'COFRE',0,1.58,-1.42,1.02);
    c.colliders.push({x:7.55,z:.2,hw:.89,hd:.59},{x:7.55,z:-1.50,hw:.73,hd:.26});
    f.run=()=>{if(I.current===c&&E.PawnUI)E.PawnUI.open(f);};batch(f);return f;
  }
  function poker(c,kit){
    const f=table(c,kit,'poker',4.95,3.05,'Jogar pôquer de cinco cartas com Íris','poker',1.75,1.35);
    felt(c,kit,f,1.59,1.19,'PÔQUER · 5 CARTAS',(p,W)=>{for(let i=0;i<5;i++){p.fillStyle='#fff0cf';p.fillRect(88+i*87,104,66,108);p.fillStyle=i%2?'#b84251':'#292330';p.font='bold 38px Georgia';p.fillText(['A','K','Q','J','10'][i],121+i*87,172);}p.fillStyle='#f4ddaa';p.font='22px Georgia';p.fillText('UMA TROCA · ATÉ 3 CARTAS',W/2,288);});
    chips(c,kit,f.g,-.59,.45,'#d45172',3);chips(c,kit,f.g,.59,.45,GOLD,4);
    f.run=()=>{if(I.current===c&&E.PokerUI)E.PokerUI.open(f);};batch(f);return f;
  }
  function community(c,kit,tables,cash){
    const defs=[
      {name:'Dália · Caixa',color:'#75427f',x:-.65,z:-6.28,route:[[-.65,-6.28],[.65,-6.28]],target:cash},
      {name:'Crupiê Lia',color:'#526b75',x:3.60,z:-2.38,route:[[3.60,-2.38],[4.93,-2.38]],target:tables.bj},
      {name:'Crupiê Bento',color:'#6a477e',x:-4.95,z:-2.5,route:[[-4.95,-2.5],[-3.55,-2.5]],target:tables.roleta},
      {name:'Crupiê Teo',color:'#516d67',x:-4.95,z:1.35,route:[[-4.95,1.35],[-3.55,1.35]],target:tables.dados},
      {name:'Visitante Âmbar',color:'#a36d49',x:-7.55,z:-3.25,route:[[-7.55,-3.25],[-7.55,4.85],[-2.15,4.85],[-2.15,-3.25]]},
      {name:'Visitante Rubi',color:'#a44e68',x:7.45,z:4.75,route:[[7.45,4.75],[2.15,4.75],[2.15,-3.25],[7.45,-3.25],[6.28,-1.75],[6.28,1.48],[7.45,1.95]]},
      {name:'Visitante Safira',color:'#527d9c',x:-1.05,z:1.3,route:[[-1.05,1.3],[-1.05,4.75],[1.05,4.75],[1.05,-3.30],[-1.05,-3.30]]},
      {name:'Visitante Esmeralda',color:'#4f806d',x:-6.9,z:5.7,route:[[-6.9,5.7],[-3.0,5.7],[-3.0,6.35],[-6.9,6.35]]},
      {name:'Nara · Penhores',color:'#816343',x:7.55,z:-.83,route:[[7.55,-.83],[7.66,-.83]],target:tables.pawn},
      {name:'Crupiê Íris',color:'#675380',x:4.65,z:4.20,route:[[4.65,4.20],[5.20,4.20]],target:tables.poker},
    ];
    c.casinoActors=defs.map((def,index)=>{
      const npc={name:'Fortuna Interior '+def.name,look:{skin:['#e6b48d','#b57b58','#edc3a1','#915c46'][index%4],hair:['#3b2a38','#b88f55','#5b3d29','#c5bbb0'][index%4],outfit:def.color}},frames=['idle0','idle1',...Array.from({length:12},(_,i)=>'w'+i)].map(f=>E.SP.npc(npc,f));
      const s=kit.sprite(c,frames[0],2.05),shadow=kit.contact(c,c.scene,.33);c.scene.add(s);
      const f=fixture(c,kit,'casino-person-'+index,def.x,def.z,def.target?def.target.label:'Conversar com '+def.name,'chat',.62),collider={x:def.x,z:def.z,r:.23};c.colliders.push(collider);
      const n={def,frames,s,shadow,f,collider,x:def.x,z:def.z,next:1,stride:0,dir:index%2?-1:1,pause:index*.24};
      f.run=()=>def.target?def.target.run():E.WorldServices.open({title:def.name,icon:'chat',anchor:f,text:['Vim passear pelo salão. As máquinas do Dragão ficam ao fundo; a roleta, o Vinte-e-Um e os dados têm suas próprias mesas.','Dália troca ouro do jogo por fichas no caixa. Gosto de passear e escolher uma mesa com calma.','As poltronas são um bom lugar para descansar entre as partidas. A saída fica no tapete dourado, bem à frente.','O salão está movimentado hoje. Você pode procurar vagas no quadro ao lado da entrada.'][index-4],actions:[{label:'Até logo',run:close}]});
      return n;
    });
  }
  function decorate(c,kit){
    c.bounds=BOUNDS;c.frameHalfH=10.6;c.frameHalfW=12.8;c.hero={x:0,z:5.95,dir:1,stride:0};c.doorway={x:0,z:6.8,width:2.4};
    c.casinoMachines=[];c.casinoLamps=[];c.scene.background=new THREE.Color('#292039');c.scene.fog=new THREE.Fog('#292039',35,65);
    c.camera.position.set(10.8,14.3,18.1);c.camera.lookAt(0,.65,0);
    const box=(x,y,z,w,h,d,color,extra)=>kit.box(c,c.room,x,y,z,w,h,d,color,extra);
    box(0,-.15,0,18.3,.30,14.7,'#342a40');
    for(let x=-8.4;x<9;x+=1.2)for(let z=-6.6;z<7.2;z+=1.2)if(Math.round(x/1.2+z/1.2)%2===0)box(x,.008,z,1.18,.015,1.18,'#44344c');
    box(0,2.0,-7.15,18.3,4,.27,PURPLE);box(-9.0,1.6,0,.25,3.2,14.5,DARK);box(9.0,.36,0,.25,.72,14.5,DARK);
    box(0,3.84,-6.94,17.8,.20,.20,GOLD);box(0,.16,-6.94,17.8,.27,.15,GOLD);box(-8.81,.16,0,.15,.27,14.2,GOLD);box(8.81,.16,0,.15,.27,14.2,GOLD);
    for(const x of[-8.65,-2.25,2.25,8.65]){box(x,1.95,-6.94,.25,3.8,.25,GOLD);box(x,3.66,-6.9,.55,.20,.42,GOLD);}
    for(const x of[-5.45,5.45]){box(x,2.86,-6.98,4.75,1.55,.08,'#32243e');box(x,2.86,-6.92,4.49,1.28,.035,'#77528b');sign(c,kit,c.room,x<0?'TRÊS ROLOS · DRAGÃO':'FORTUNA DOURADA',x,3.05,-6.85,4.2);}
    sign(c,kit,c.room,'CASSINO',0,3.30,-6.85,3.65);
    kit.rug(c,0,.2,3.05,12.9,PURPLE);kit.rug(c,0,6.28,2.4,1.35,'#b28a45');
    // The cutaway front wall exposes an unobstructed doorway and its actual walking threshold.
    for(const side of[-1,1]){box(side*5.15,.26,7.15,7.35,.52,.22,DARK);box(side*1.50,1.03,7.1,.21,2.06,.28,GOLD);}
    sign(c,kit,c.room,'SAÍDA',0,.22,6.92,1.35);
    const exit=fixture(c,kit,'exit',0,6.83,'Sair pela porta do cassino','door',.65);exit.run=()=>I.leave();
    for(const x of[-6.65,-4.55,4.55,6.65])machine(c,kit,c.casinoMachines.length,x);
    const cash=cashier(c,kit),tables={roleta:roulette(c,kit),bj:blackjack(c,kit),dados:dice(c,kit)};c.casinoTables=tables;
    // Velvet lounge occupies the spare bay; the front and central corridors stay open.
    kit.rug(c,4.7,3.05,4.7,2.7,'#523862');
    for(const x of[3.35,6.5]){box(x,.39,3.15,1.15,.43,1.18,DARK);box(x,.66,3.15,1.15,.20,1.18,PURPLE);box(x,.99,3.66,1.18,.73,.15,PURPLE);for(const side of[-1,1])box(x+side*.53,.85,3.15,.15,.45,1.1,GOLD);c.colliders.push({x,z:3.15,hw:.59,hd:.6});}
    tables.poker=poker(c,kit);tables.pawn=pawnCounter(c,kit);
    const jobs=fixture(c,kit,'casino-jobs',7.05,5.73,'Pedir emprego no cassino','journal',.63);jobs.action='jobs';jobs.run=()=>E.WorldServices.use(jobs);
    kit.box(c,jobs.g,0,1.18,0,1.35,1.0,.14,GOLD);kit.box(c,jobs.g,0,1.18,.09,1.17,.83,.035,'#f0dcaa');sign(c,kit,jobs.g,'VAGAS',0,1.27,.115,1.05);for(const side of[-1,1])kit.box(c,jobs.g,side*.48,.52,0,.09,1.04,.12,DARK);c.colliders.push({x:jobs.x,z:jobs.z,hw:.68,hd:.16});batch(jobs);
    for(const x of[-8.40,8.40])for(const z of[-3.2,4.9]){
      kit.cylinder(c,c.room,x,.13,z,.25,.18,GOLD);kit.cylinder(c,c.room,x,1.35,z,.06,2.42,GOLD);
      const lamp=new THREE.Mesh(new THREE.OctahedronGeometry(.30,0),kit.mat('#ffe3a3',{emissive:'#d79c49',emissiveIntensity:.55}));lamp.position.set(x,2.64,z);c.room.add(lamp);c.casinoLamps.push(lamp.material);
    }
    community(c,kit,tables,cash);
    c.onUpdate=dt=>update(c,kit,dt);c.onClose=()=>{C.stand();c.activeTable=null;};
    update(c,kit,0);
  }
  function actorFree(c,n,x,z){
    if(x<BOUNDS.left+.23||x>BOUNDS.right-.23||z<BOUNDS.back+.23||z>BOUNDS.front-.23)return false;
    return !c.colliders.some(o=>{if(o===n.collider)return false;if(o.hw!=null)return Math.abs(x-o.x)<o.hw+.24&&Math.abs(z-o.z)<o.hd+.24;return Math.hypot(x-o.x,z-o.z)<(o.r||0)+.24;});
  }
  function update(c,kit,dt){
    for(const [index,n]of c.casinoActors.entries()){
      const target=n.def.route[n.next],dx=target[0]-n.x,dz=target[1]-n.z,d=Math.hypot(dx,dz);let moving=false;
      n.pause=Math.max(0,n.pause-dt);
      if(d<.10){n.next=(n.next+1)%n.def.route.length;n.pause=n.def.target?1.5:1.0;}
      else if(!n.pause&&Math.hypot(n.x-c.hero.x,n.z-c.hero.z)>.68){const step=Math.min(d,dt*(n.def.target?.46:.72)),nx=n.x+dx/d*step,nz=n.z+dz/d*step;if(actorFree(c,n,nx,nz)){n.x=nx;n.z=nz;n.stride+=step;moving=step>0;if(Math.abs(dx)>.04)n.dir=dx<0?-1:1;}}
      const frame=moving?2+Math.floor(n.stride/3.3*12)%12:Math.floor(c.t*1.5+index)%2,cv=n.frames[frame];n.s.material.map=kit.texture(c,cv);n.s.scale.set(2.05*cv.width/cv.height*n.dir,2.05,1);n.s.position.set(n.x,.085,n.z);n.shadow.position.set(n.x,.078,n.z);n.f.x=n.collider.x=n.x;n.f.z=n.collider.z=n.z;
    }
    for(const m of c.casinoMachines)if(m.round){
      m.time+=dt;m.lever.rotation.x=-Math.sin(Math.min(1,m.time/.55)*Math.PI)*.85;const frame=Math.floor(m.time*18);
      if(frame!==m.drawAt){m.drawAt=frame;m.reels=m.reels.map((old,i)=>m.time>[.58,1.26,2.3][i]?m.round.reels[i]:(frame+i*2)%7);drawMachine(m);}
      if(m.time>=2.4){m.reels=[...m.round.reels];drawMachine(m);m.lever.rotation.x=0;m.round=null;}
    }
    for(const f of Object.values(c.casinoTables))if(f.spin){
      const s=f.spin;s.time+=dt;const k=Math.min(1,s.time/2.4),ease=1-Math.pow(1-k,3);
      if(f.g.userData.wheel){f.g.userData.wheel.rotation.y=s.from+(Math.PI*8+(s.number||0)/37*Math.PI*2)*ease;const ball=f.g.userData.ball;ball.position.set(Math.cos(-ease*18)*.52,.14,Math.sin(-ease*18)*.52);}
      for(const [i,d]of(f.g.userData.dice||[]).entries()){const value=(s.dice||[3,3])[i],poses={1:[0,0,Math.PI/2],2:[0,0,-Math.PI/2],3:[0,0,0],4:[Math.PI,0,0],5:[-Math.PI/2,0,0],6:[Math.PI/2,0,0]},p=poses[value]||poses[3];d.rotation.set(p[0]+(1-ease)*(5+i)*Math.PI,p[1],p[2]+(1-ease)*(4+i)*Math.PI);d.position.y=1.42+Math.sin(k*Math.PI)*.55;}
      if(k===1)f.spin=null;
    }
    for(const [index,m]of c.casinoLamps.entries())m.emissiveIntensity=.50+Math.sin(c.t*1.6+index)*.09;
    if(c.casinoSeat&&c.sprite){const cv=c.casinoSitFrames[Math.floor(c.t*1.7)%2],height=E.WG.heroHeight(E.Store.hero())||2.3;c.sprite.material.map=kit.texture(c,cv);c.sprite.scale.set(height*cv.width/cv.height*c.hero.dir,height,1);c.sprite.position.set(c.hero.x,.43,c.hero.z);c.heroShadow.visible=false;}
  }
  C.enter=venue=>{
    if(!E.WG||!E.WG.world||!venue||I.current)return false;
    I.open({kind:'casino',region:venue.region||E.WG.world.id,title:'Cassino Fortuna Dourada',worldVenue:venue});return true;
  };
  C.seat=anchor=>{
    const c=I.current;if(!c||c.kind!=='casino'||!anchor||!anchor.seat)return false;
    if(c.casinoSeat)return true;
    c.seatReturn={x:c.hero.x,z:c.hero.z};Object.assign(c.hero,anchor.seat);c.seated=c.casinoSeat=true;c.moving=false;
    const h=E.Store.hero();c.casinoSitFrames=['sit0','sit1'].map(f=>E.SP.hero(h,f,E.SP.heroWeaponType(h)));return true;
  };
  C.stand=()=>{
    const c=I.current;if(!c||!c.casinoSeat)return false;c.seated=c.casinoSeat=false;if(c.seatReturn)Object.assign(c.hero,c.seatReturn);delete c.seatReturn;return true;
  };
  C.animateGame=(anchor,round)=>{
    const c=I.current;if(!c||c.kind!=='casino'||!anchor||!round)return;
    const machine=anchor.group&&anchor.group.userData.casinoMachine;
    if(machine&&round.kind==='slots'){machine.round=round;machine.time=0;machine.drawAt=-1;}
    if(round.kind==='roleta'||round.kind==='dados')anchor.spin={time:0,from:anchor.g.userData.wheel?anchor.g.userData.wheel.rotation.y:0,number:round.number,dice:round.dice};
  };
  C.bounds=BOUNDS;I.decorators.casino=decorate;E.CasinoInterior=C;
})();
