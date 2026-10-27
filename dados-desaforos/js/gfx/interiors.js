/* Interiores visitáveis. Compartilham o renderizador do mundo: nenhuma segunda WebGLContext. */
(() => {
  'use strict';
  const U=E.U,I={current:null},keyState={x:0,y:0};
  // A circular footprint moves on the floor independently of the upright pixel artwork.
  const FOOT=.29,BOUNDS={left:-4.55,right:4.55,back:-4.03,front:4.14};
  function free(c,x,z){
    if(x<BOUNDS.left||x>BOUNDS.right||z<BOUNDS.back||z>BOUNDS.front)return false;
    return !c.colliders.some(o=>{
      if(o.hw!=null){const dx=Math.max(Math.abs(x-o.x)-o.hw,0),dz=Math.max(Math.abs(z-o.z)-o.hd,0);return dx*dx+dz*dz<FOOT*FOOT-1e-8;}
      return Math.hypot(x-o.x,z-o.z)<(o.r||0)+FOOT-1e-8;
    });
  }
  function move(c,dx,dz){
    const h=c.hero,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.09)),sx=dx/steps,sz=dz/steps;
    // Substeps and axis sliding stop both fast-frame tunnelling and corner penetration.
    for(let i=0;i<steps;i++){
      if(free(c,h.x+sx,h.z))h.x+=sx;
      if(free(c,h.x,h.z+sz))h.z+=sz;
    }
  }
  function recover(c){
    const h=c.hero;if(free(c,h.x,h.z))return;
    let best=null,dist=Infinity;
    for(let z=BOUNDS.back+.1;z<BOUNDS.front;z+=.18)for(let x=BOUNDS.left+.1;x<BOUNDS.right;x+=.18){const d=Math.hypot(x-h.x,z-h.z);if(d<dist&&free(c,x,z)){best={x,z};dist=d;}}
    if(best)Object.assign(h,best);
  }
  function floorY(c,x,z){
    if(c.kind==='inn'&&Math.abs(x+3.35)<.825){for(let k=3;k>=0;k--)if(Math.abs(z-(-2.18-k*.3))<.17)return .22+k*.26;}
    return .085;
  }
  // Fixed orthographic framing keeps floor pixels, furniture and characters at one scale.
  function fitCamera(c){
    const aspect=innerWidth/innerHeight;if(c.frameAspect===aspect)return;c.frameAspect=aspect;
    const halfH=Math.max(6.8,8.2/aspect),camera=c.camera;camera.left=-halfH*aspect;camera.right=halfH*aspect;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
  }
  I.physics={radius:FOOT,bounds:BOUNDS,free,move,recover};
  I.decorators={};
  const busy=()=>!!(E.WorldServices&&E.WorldServices.active);
  const closeCard=()=>{if(E.WorldServices)E.WorldServices.close();};
  const note=r=>{if(r&&r.message)E.UI.toast(r.message,r.ok?'gold':'');return r;};
  const card=opts=>{if(E.WorldServices)return E.WorldServices.open(opts);E.UI.toast(opts.text||opts.title);};
  const icon=(key)=>E.Icons?E.Icons.html(key,{decorative:true}):'';
  const names={inn:'Pousada do Caminhante',room:'Quarto da pousada',home:'Meu lar',general:'Empório da vila',smith:'Forja da vila',food:'Cozinha da vila',furniture:'Marcenaria',guild:'Casa dos Ofícios','player-shop':'Meu ponto comercial',casino:'Cassino Fortuna Dourada',market:'Bolsa de Mercadorias',arena:'Arena dos Gladiadores',alchemy:'Alquimista das Mil Cores',pier:'Píer dos Pescadores'};
  const merchantNames={inn:'Dona Amélia',general:'Mestre Bento',smith:'Ferreira Iris',food:'Cozinheira Lia',furniture:'Mestre Junco',guild:'Capataz Teo','player-shop':'Seu estabelecimento',casino:'Crupiê Dália',market:'Mercadora Aline',arena:'Mestre da Arena',alchemy:'Alquimista Lume',pier:'Mestre Dendê'};
  const mat=(color,extra={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:.87},extra));
  function box(c,parent,x,y,z,w,h,d,color,extra){const key=color+'|'+JSON.stringify(extra||{});let m=c.materials[key];if(!m)m=c.materials[key]=mat(color,extra);const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o;}
  function cylinder(c,parent,x,y,z,r,h,color){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),c.materials[color]||(c.materials[color]=mat(color)));o.position.set(x,y,z);parent.add(o);return o;}
  function texture(c,canvas){if(!c.textureCache.has(canvas)){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;c.textureCache.set(canvas,t);c.textures.add(t);if(E.SP.onReady)E.SP.onReady(canvas,()=>{t.needsUpdate=true;});}return c.textureCache.get(canvas);}
  function sprite(c,canvas,height){
    // A vertical billboard stands on its feet. THREE.Sprite tilts toward the camera,
    // which made its legs overlap beds and the floor despite a correct floor position.
    const geo=new THREE.PlaneGeometry(1,1);geo.translate(0,.5,0);
    const s=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:texture(c,canvas),transparent:true,alphaTest:.42,depthWrite:true,side:THREE.DoubleSide}));
    s.rotation.y=Math.atan2(c.camera.position.x,c.camera.position.z);s.scale.set(height*canvas.width/canvas.height,height,1);return s;
  }
  function contact(c,parent,r=.45){
    const shadow=new THREE.Mesh(new THREE.CircleGeometry(r,20),new THREE.MeshBasicMaterial({color:'#302724',transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.y=.65;shadow.position.y=.078;parent.add(shadow);return shadow;
  }
  function fixture(c,id,x,z,def={}){const g=new THREE.Group();g.position.set(x,0,z);c.room.add(g);return {id,g,x,z,r:def.r||.75,label:def.label||id,action:def.action,icon:def.icon||'hand',furniture:def.furniture};}
  function addFurniture(c,item,preview=false){
    const f=E.Settlements.FURNITURE[item.id];if(!f||item.stored)return;
    const q=fixture(c,item.id,item.x,item.z,{label:f.action,icon:f.icon,furniture:item});const g=q.g;g.rotation.y=item.r||0;q.r=Math.max(f.w,f.d)*.45;
    if(item.id==='bed'){
      box(c,g,0,.24,0,1.65,.36,2.2,'#79543b');box(c,g,0,.55,.02,1.58,.35,2.1,'#e1d5b7');box(c,g,0,.76,.32,1.61,.13,1.35,'#597d91');box(c,g,0,.77,-.74,1.15,.17,.4,'#fff2d5');box(c,g,0,.9,-1.12,1.8,1.15,.12,'#916741');
    }else if(item.id==='hearth'){
      box(c,g,0,.55,0,1.5,1.1,1.0,'#79716a');box(c,g,0,.4,.52,.86,.56,.03,'#342a25');box(c,g,0,1.15,0,1.7,.14,1.16,'#a99a7d');cylinder(c,g,0,1.3,.04,.3,.18,'#4c4e54');
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.22,.45,6),new THREE.MeshBasicMaterial({color:'#edb16d'}));flame.position.set(0,.42,.57);flame.userData.noStaticBatch=true;g.add(flame);if(!preview)c.flames.push(flame);
    }else if(item.id==='table'){
      box(c,g,0,1.02,0,1.75,.16,1.05,'#a77c4b');for(const x of [-.65,.65])for(const z of [-.35,.35])box(c,g,x,.5,z,.12,.95,.12,'#674b35');cylinder(c,g,.3,1.15,0,.16,.1,'#e7d8b5');
    }else if(item.id==='chair'){
      box(c,g,0,.57,0,.72,.14,.72,'#83603e');box(c,g,0,1.02,-.3,.72,.86,.13,'#a27b4f');for(const x of [-.25,.25])for(const z of [-.25,.25])box(c,g,x,.25,z,.1,.54,.1,'#674b35');
    }else if(item.id==='chest'){
      box(c,g,0,.4,0,1.3,.72,.75,'#896039');box(c,g,0,.83,0,1.35,.2,.8,'#ad8150');for(const x of [-.43,.43])box(c,g,x,.51,.405,.11,.8,.04,'#c3a369');box(c,g,0,.7,.43,.2,.22,.05,'#d7ba7d');
    }else if(item.id==='wardrobe'){
      box(c,g,0,1.13,0,1.35,2.2,.7,'#8c6745');box(c,g,0,1.15,.37,.035,1.9,.035,'#b38e5e');for(const x of [-.09,.09])cylinder(c,g,x,1.1,.42,.04,.1,'#e4bd74');
    }else if(item.id==='bookshelf'){
      box(c,g,0,1.1,0,1.6,2.1,.4,'#674d38');for(const y of [.35,.92,1.5]){box(c,g,0,y,.16,1.58,.1,.57,'#997548');for(let k=0;k<6;k++)box(c,g,-.58+k*.23,y+.23,.16,.14,.36,.34,['#7c9c99','#b08476','#b5a076'][k%3]);}
    }else if(item.id==='lamp'){
      cylinder(c,g,0,.13,0,.22,.15,'#96764e');cylinder(c,g,0,.63,0,.055,1.0,'#bd9d60');const shade=new THREE.Mesh(new THREE.ConeGeometry(.38,.46,8,1,true),mat(item.lit===false?'#786d5a':'#f1d899',{side:THREE.DoubleSide,emissive:item.lit===false?'#000000':'#a77f35',emissiveIntensity:.35}));shade.position.y=1.25;shade.userData.noStaticBatch=true;g.add(shade);q.shade=shade;
    }
    const swap=Math.abs(Math.round((item.r||0)/(Math.PI/2)))%2;
    if(!preview){c.fixtures.push(q);c.colliders.push({x:item.x,z:item.z,hw:(swap?f.d:f.w)/2,hd:(swap?f.w:f.d)/2,uid:item.uid});}
    if(E.ScenePerf)E.ScenePerf.batch(g,{exclude:[...c.flames,q.shade].filter(Boolean)});
    return q;
  }
  function plaque(c,text,x,y,z,width=1.8){
    const cv=document.createElement('canvas');cv.width=256;cv.height=80;const cx=cv.getContext('2d');cx.fillStyle='#283e45';cx.fillRect(0,0,256,80);cx.strokeStyle='#d0b77c';cx.lineWidth=4;cx.strokeRect(4,4,248,72);cx.font='bold 22px Georgia';cx.fillStyle='#f1e5c9';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,128,42,235);
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;c.textures.add(t);const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.3125),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);c.room.add(m);
  }
  function rug(c,x,z,w,d,color){
    box(c,c.room,x,.022,z,w,.035,d,'#d6c195');box(c,c.room,x,.045,z,w-.15,.018,d-.15,color);
    for(const side of [-1,1])box(c,c.room,x+side*(w/2-.22),.06,z,.055,.015,d-.4,'#d6c195');
    for(const side of [-1,1])box(c,c.room,x,.06,z+side*(d/2-.22),w-.4,.015,.055,'#d6c195');
  }
  function decorateRoom(c){
    // Cômodos de outros módulos (loja com expediente, sala de entrevista) montam a própria cena.
    if(I.decorators[c.kind]){I.decorators[c.kind](c,I.kit);if(E.ScenePerf)E.ScenePerf.batch(c.room,{exclude:[...c.fixtures.map(f=>f.g).filter(Boolean),...c.flames].filter(Boolean)});return;}
    const S=E.Settlements,h=E.Store.hero(),property=S.property(h,c.region,c.kind==='player-shop'?'shop':c.kind),wall=property&&S.WALLS[property.wall]||S.WALLS.cream;
    const regional={costa:['#b38a5e','#699caa'],montanhas:['#8a786b','#8195a9'],astrolabio:['#81718e','#a08cbb'],abismo:['#76657f','#9485b0'],vazios:['#a27e58','#aa6e78'],jardins:['#9a7e5d','#8eaa85']}[c.region]||['#997651','#6f9391'];
    c.accent=regional[1];c.wall=wall;
    box(c,c.room,0,-.15,0,10,.3,9,regional[0]);for(let z=-4.2;z<4.5;z+=.58)box(c,c.room,0,.008,z,10,.018,.022,'#6c503b');
    box(c,c.room,0,1.6,-4.5,10,3.2,.25,wall.color);box(c,c.room,-5,1.35,0,.25,2.7,9,wall.color);box(c,c.room,5,.47,0,.25,.94,9,wall.color);
    for(const x of [-4.8,-1.15,4.8])box(c,c.room,x,1.6,-4.32,.18,3.2,.17,'#73553e');
    box(c,c.room,0,3.08,-4.26,10,.19,.2,'#73553e');box(c,c.room,0,.13,-4.32,10,.24,.16,'#7d5d3b');box(c,c.room,-4.82,.13,0,.16,.24,9,'#7d5d3b');
    // The near walls remain cut away; shutters, curtains and framing give each room depth.
    const wx=c.kind==='inn'?2.75:2.3;
    box(c,c.room,wx,2.06,-4.32,1.8,1.46,.05,'#7c6245');const glass=box(c,c.room,wx,2.06,-4.27,1.57,1.23,.04,'#a8cbd1',{emissive:'#7eabbd',emissiveIntensity:.35});c.window=glass;
    box(c,c.room,wx,2.06,-4.22,.07,1.3,.04,'#e4d9bc');box(c,c.room,wx,2.06,-4.22,1.66,.07,.04,'#e4d9bc');
    for(const side of [-1,1]){box(c,c.room,wx+side*.99,2.05,-4.17,.3,1.52,.08,regional[1]);box(c,c.room,wx+side*1.01,1.7,-4.10,.34,.075,.09,'#d6bf87');}
    box(c,c.room,wx,1.27,-4.10,2.08,.11,.26,'#a98254');
    const pot=cylinder(c,c.room,wx-.62,1.45,-4.08,.14,.27,'#b07858');cylinder(c,c.room,wx-.62,1.72,-4.08,.11,.25,'#74966c');
    rug(c,0,3.45,2.0,1.45,regional[1]);c.fixtures.push({id:'exit',x:0,z:3.75,r:1.25,label:c.kind==='room'?'Voltar à pousada':'Sair para a vila',icon:'door'});
    if(c.kind==='home'||c.kind==='room'){
      rug(c,-.4,-.3,4.3,3.0,c.kind==='room'?'#a77d72':regional[1]);
      const list=property&&property.furniture||[];for(const f of list)addFurniture(c,f);
      // A small family picture, wall shelf and baskets make the house feel inhabited.
      box(c,c.room,-3.5,2.15,-4.27,1.0,.86,.07,'#74563d');box(c,c.room,-3.5,2.15,-4.21,.82,.68,.03,'#d7bd88');box(c,c.room,-3.5,2.06,-4.18,.65,.18,.025,regional[1]);
      box(c,c.room,.15,1.92,-4.17,1.6,.10,.45,'#906947');for(let n=0;n<4;n++)box(c,c.room,-.42+n*.25,2.15,-4.12,.15,.38,.22,['#718c86','#a8796e','#b49a63'][n%3]);
      if(c.kind==='room'){
        addFurniture(c,{id:'lamp',uid:'room-lamp',x:-4.05,z:-2.7,r:0});plaque(c,'Quarto do viajante',.15,2.55,-4.22,1.8);
      }else{
        const lect=fixture(c,'manage',3.65,1.85,{label:'Decorar a casa',icon:'home',r:.8});c.colliders.push({x:3.65,z:1.85,hw:.4,hd:.29});box(c,lect.g,0,.87,0,.8,.11,.58,'#b69a6c');box(c,lect.g,0,.44,0,.13,.86,.13,'#6c543c');box(c,lect.g,-.17,.99,0,.24,.12,.2,'#8ba28a');box(c,lect.g,.18,.99,0,.24,.12,.2,'#b9917e');c.fixtures.push(lect);
      }
    }else{
      const skin=S.SKINS[property&&property.skin]||S.SKINS.linen;
      const counter=fixture(c,'service',c.kind==='inn'?.5:0,-1.5,{label:c.kind==='player-shop'?'Atender no balcão':c.kind==='inn'?'Conversar com a recepcionista':'Falar com o responsável',icon:c.kind==='inn'?'bed':'chat',r:1.65});
      box(c,counter.g,0,.63,0,3.2,1.18,1.05,'#77543a');box(c,counter.g,0,1.24,0,3.42,.16,1.18,'#b18b58');box(c,counter.g,0,.72,.55,3.0,.5,.035,skin.color);c.fixtures.push(counter);c.colliders.push({x:counter.x,z:counter.z,hw:1.6,hd:.53});
      box(c,counter.g,.8,1.42,.1,.55,.18,.38,'#c9b38a');box(c,counter.g,-.75,1.4,.12,.65,.12,.45,'#efe0be');
      if(c.kind==='inn'){
        rug(c,.4,.8,4.7,3.7,'#a5786b');
        addFurniture(c,{id:'hearth',uid:'community-hearth',x:3.55,z:-2.95,r:0});
        addFurniture(c,{id:'table',uid:'inn-table',x:-2.65,z:.1,r:0});addFurniture(c,{id:'chair',uid:'inn-chair',x:-2.65,z:1.25,r:0});
        addFurniture(c,{id:'chair',uid:'inn-chair-2',x:-3.85,z:.05,r:Math.PI/2});
        // Short stairs and a real room door replace the old instant-room menu.
        for(let k=0;k<4;k++)box(c,c.room,-3.35,.11+k*.13,-2.18-k*.3,1.65,.22+k*.26,.34,'#9e7c54');
        box(c,c.room,-3.35,1.54,-4.28,1.5,2.54,.12,'#5f4635');box(c,c.room,-3.35,1.54,-4.18,1.23,2.30,.10,'#a0784e');cylinder(c,c.room,-2.95,1.37,-4.04,.065,.12,'#d1b677');
        c.fixtures.push({id:'room-door',x:-3.35,z:-2.5,r:.95,label:'Abrir a porta do quarto',icon:'bed'});c.colliders.push({x:-3.35,z:-3.55,hw:.85,hd:.35});
        plaque(c,'Quartos',-3.35,2.9,-4.06,1.45);plaque(c,'Pousada · '+(S.prices?S.prices(c.region,'room'):S.PRICES.room).rent+' po',.5,2.5,-4.20,2.0);
        c.npcX=.5;
      }else{
        if(c.kind==='food')addFurniture(c,{id:'hearth',uid:'community-hearth',x:-3.25,z:-2.9,r:0});
        for(const side of [-1,1]){box(c,c.room,side*3.6,.3,-3.4,1.55,.6,.9,'#9b774a');for(let i=0;i<3;i++)cylinder(c,c.room,side*3.6+(i-1)*.36,.85,-3.4,.13,.45,['#79a58b','#d1b475','#b5817e'][i]);}
      }
      if(c.kind!=='player-shop'){
        const npc={name:merchantNames[c.kind]||'Morador da vila',title:names[c.kind]||'Morador',cls:'bardo',look:{skin:'#e3b892',hair:'#5c422a',outfit:'#779995'}};
        c.npcFrames=[E.SP.npc(npc,'idle0'),E.SP.npc(npc,'idle1')];c.npc=sprite(c,c.npcFrames[0],2.0);c.npc.position.set(c.npcX||0,.085,-2.9);c.scene.add(c.npc);c.npcShadow=contact(c,c.scene,.37);c.npcShadow.position.set(c.npcX||0,.078,-2.9);c.colliders.push({x:c.npcX||0,z:-2.9,r:.27});
      }
    }
    if(E.ScenePerf)E.ScenePerf.batch(c.room,{exclude:[...c.fixtures.map(f=>f.g),...c.flames].filter(Boolean)});
  }
  I.kit={box,cylinder,sprite,contact,fixture,plaque,rug,texture,mat,addFurniture,names,merchantNames};
  function property(c){return E.Settlements.property(E.Store.hero(),c.region,'home');}
  function owned(c,f){const p=property(c);return !!(c.kind==='home'&&f.furniture&&p&&(p.furniture||[]).some(v=>v.uid===f.furniture.uid));}
  function readBook(page=0){
    const passages=[['A casa e a estrada','Um lar guarda suas coisas, mas a estrada ainda pede preparo. Cozinhe sua caça, leve comida e confira o planador antes de partir. À noite há menos viajantes e mais criaturas fora da vila.'],['O ofício do mercador','Observe o que o cliente procura antes de falar do preço. Uma boa conversa não torna um produto milagroso: apresente vantagens reais e respeite o orçamento de quem está à sua frente.'],['O calendário das lanternas','Cada estação tem vinte e oito dias. Os moradores trabalham sob o sol e voltam para suas casas ao cair da noite. Uma cama em casa ou um quarto reservado permitem descansar até o amanhecer.']];
    const p=passages[page%passages.length];card({title:p[0],text:p[1],actions:[{label:'Virar a página',run:()=>readBook(page+1)}]});
  }
  function wardrobe(page=0){
    const h=E.Store.hero(),list=Object.entries(E.CH.OUTFITS).filter(([id])=>!E.Wardrobe||E.Wardrobe.owns(id));if(!list.length)return;
    const [id,outfit]=list[((page%list.length)+list.length)%list.length];
    card({title:'Guarda-roupa · '+outfit.name,text:'Experimente seus trajes diante do espelho. Estas roupas já pertencem a você.',actions:[{label:'Vestir este traje',run:()=>{h.look=E.CH.normalize(h.look,h.cls,h.species);h.look.outfit=id;E.Store.save();if(E.WG.world)E.WG.world.refreshHeroFrames();closeCard();I.refresh();E.UI.toast('Você vestiu '+outfit.name+'.');}},{label:'Próximo cabide',run:()=>wardrobe(page+1)}]});
  }
  function storage(c,page=0){
    const h=E.Store.hero(),p=property(c);if(!p||!E.Settlements.hasAccess(h,c.region,'home'))return E.UI.toast('Você precisa ter acesso à sua casa.');
    const maps={inventory:h.inventory||{},food:E.Sim.data(h).food,cargo:E.Life.data(h).cargo},rows=[];
    for(const kind of ['inventory','food','cargo'])for(const id of new Set([...Object.keys(maps[kind]),...Object.keys(p.storage[kind]||{})])){
      const n=Number(maps[kind][id])||0,st=Number((p.storage[kind]||{})[id])||0;if(n+st<=0)continue;
      const def=kind==='inventory'?(E.R.ITEMS[id]||{}):kind==='food'?(E.Sim.FOODS[id]||{}):((E.L.GOODS||{})[id]||{});
      rows.push({kind,id,n,st,name:def.name||id});
    }
    if(!rows.length)return card({title:'Baú de casa',text:'O baú está vazio. Traga consumíveis, comida ou mercadorias na mochila para guardar aqui.',actions:[]});
    const i=((page%rows.length)+rows.length)%rows.length,r=rows[i];
    const move=to=>{note(E.Settlements.transfer(h,c.region,r.kind,r.id,1,to));storage(c,i);};
    card({title:'Baú · '+r.name,text:`Mochila: ${r.n} · Guardado: ${r.st}. Item ${i+1} de ${rows.length}.`,actions:[{label:'Guardar uma unidade',disabled:r.n<1,run:()=>move(true)},{label:'Retirar uma unidade',disabled:r.st<1,run:()=>move(false)},{label:'Item anterior',disabled:rows.length<2,run:()=>storage(c,i-1)},{label:'Próximo item',disabled:rows.length<2,run:()=>storage(c,i+1)}]});
  }
  function paint(c,page=0){
    const S=E.Settlements,p=property(c),list=Object.entries(S.WALLS),i=((page%list.length)+list.length)%list.length,[id,w]=list[i];if(!p)return;
    const unlocked=(p.wallUnlocks||[]).includes(id),cost=unlocked?0:(S.price?S.price(c.region,w.price):w.price);
    card({title:'Pintura · '+w.name,text:`Acabamento ${i+1} de ${list.length}. ${cost?cost+' po pela pintura.':'Tinta já disponível.'} Suas paredes atuais permanecem até você escolher pintar.`,actions:[{label:p.wall===id?'Já aplicado':`Pintar${cost?' · '+cost+' po':''}`,disabled:p.wall===id,run:()=>{const r=note(S.decorate(E.Store.hero(),c.region,'wall',id));if(r.ok){closeCard();I.refresh();}}},{label:'Próxima amostra',run:()=>paint(c,i+1)}]});
  }
  function arrange(c,page=0){
    const p=property(c),list=p&&p.furniture||[];if(!list.length)return E.UI.toast('Compre móveis na marcenaria e traga-os para cá.');
    const i=((page%list.length)+list.length)%list.length,f=list[i],d=E.Settlements.FURNITURE[f.id];
    card({title:d.name,text:`${f.stored?'Guardado, pronto para colocar.':'Colocado na casa.'} Móvel ${i+1} de ${list.length}. Mova a peça diretamente pelo chão da casa.`,actions:[{label:f.stored?'Colocar no cômodo':'Reposicionar',run:()=>{closeCard();I.beginPlacement(f.uid);}},{label:'Próximo móvel',disabled:list.length<2,run:()=>arrange(c,i+1)},{label:'Guardar esta peça',disabled:f.stored,run:()=>{const r=note(E.Settlements.storeFurniture(E.Store.hero(),c.region,f.uid));if(r.ok){closeCard();I.refresh();}}}]});
  }
  function decorate(c){card({title:'Seu lar',text:'A bancada de pintura guarda as amostras; seus móveis podem ser colocados diretamente no cômodo. Deixe a passagem da porta livre.',actions:[{label:'Mover ou colocar um móvel',run:()=>arrange(c)},{label:'Escolher tinta para as paredes',run:()=>paint(c)}]});}
  function canPlace(c,e){
    const S=E.Settlements,p=property(c),d=S.FURNITURE[e.item.id],swap=Math.abs(e.turn)%2,w=swap?d.d:d.w,depth=swap?d.w:d.d;
    if(!p||!S.hasAccess(E.Store.hero(),c.region,'home')||Math.abs(e.x)>3.4||Math.abs(e.z)>2.6||Math.abs(e.x)<1.1&&e.z>1.9||Math.abs(e.x)+w/2>4.55||Math.abs(e.z)+depth/2>3.8)return false;
    return !p.furniture.some(o=>{if(o.uid===e.item.uid||o.stored)return false;const od=S.FURNITURE[o.id],os=Math.round((o.r||0)/(Math.PI/2))%2;return Math.abs(o.x-e.x)<(w+(os?od.d:od.w))/2+.12&&Math.abs(o.z-e.z)<(depth+(os?od.w:od.d))/2+.12;});
  }
  function clearPlacement(c){
    const e=c&&c.edit;if(!e)return;
    if(e.original)e.original.visible=true;c.room.remove(e.preview.g);e.preview.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});for(const m of e.materials)m.dispose();e.bar.remove();c.edit=null;c.hudAt=0;c.act.style.display='';c.label.style.display='';c.overlay.classList.remove('placing-furniture');
  }
  I.beginPlacement=uid=>{
    const c=I.current,p=c&&property(c),item=p&&(p.furniture||[]).find(f=>f.uid===uid);if(!c||c.kind!=='home'||!item||!E.Settlements.hasAccess(E.Store.hero(),c.region,'home'))return false;
    closeCard();clearPlacement(c);const old=c.fixtures.find(f=>f.furniture&&f.furniture.uid===uid);const copy={...item,stored:false,x:U.clamp(item.stored?c.hero.x:item.x,-3.4,3.4),z:U.clamp(item.stored?c.hero.z-1:item.z,-2.6,2.6)};
    const preview=addFurniture(c,copy,true),materials=new Set();preview.g.traverse(o=>{if(o.material){const source=o.material,m=source.clone();if(!Object.values(c.materials).includes(source))source.dispose();m.transparent=true;m.opacity=.60;m.depthWrite=false;m.emissive=new THREE.Color('#3eaf81');m.emissiveIntensity=.4;o.material=m;materials.add(m);}});
    if(old)old.g.visible=false;
    const bar=U.h(`<div class="interior-placement"><div><strong>${U.esc(E.Settlements.FURNITURE[item.id].name)}</strong><small data-placement-status></small></div><button class="btn sm dark" data-rotate>${icon('swap')} Girar</button><button class="btn sm primary" data-place>Colocar</button><button class="btn sm dark" data-cancel>Cancelar</button></div>`);c.overlay.appendChild(bar);
    c.edit={item,preview,materials,original:old&&old.g,x:copy.x,z:copy.z,turn:Math.round((item.r||0)/(Math.PI/2)),bar,status:bar.querySelector('[data-placement-status]'),valid:false};
    bar.querySelector('[data-rotate]').onclick=()=>{if(c.edit)c.edit.turn=(c.edit.turn+1)%4;};bar.querySelector('[data-place]').onclick=()=>I.confirmPlacement();bar.querySelector('[data-cancel]').onclick=()=>I.cancelPlacement();
    c.overlay.classList.add('placing-furniture');c.act.style.display='none';c.label.style.display='none';return true;
  };
  I.cancelPlacement=()=>{const c=I.current;if(c)clearPlacement(c);};
  I.confirmPlacement=()=>{const c=I.current,e=c&&c.edit;if(!e)return false;const r=note(E.Settlements.placeFurniture(E.Store.hero(),c.region,e.item.uid,e.x,e.z,e.turn));if(r.ok){clearPlacement(c);I.refresh();}return r.ok;};
  function reception(c){
    const S=E.Settlements,h=E.Store.hero(),access=S.hasAccess(h,c.region,'room'),price=(S.prices?S.prices(c.region,'room'):S.PRICES.room).rent;
    card({title:'Dona Amélia · Recepção',text:access?'A sua chave está reservada. Suba os pequenos degraus à esquerda do balcão e abra a porta do quarto.':`Boa viagem até aqui? Um quarto custa ${price} po. A cama dá direito a um descanso até o amanhecer; a comida é servida à parte.`,actions:[{label:access?'Sua chave já está reservada':`Alugar quarto · ${price} po`,disabled:access||h.gold<price,run:()=>{const r=note(S.acquire(h,c.region,'room','rent'));if(r.ok)reception(c);}},{label:'Onde fica o quarto?',run:()=>card({title:'Quartos da pousada',text:'A porta de madeira fica no fundo esquerdo, logo depois dos degraus. Aproxime-se dela e use Interagir para entrar.',actions:[]})}]});
  }
  async function sleep(c){
    closeCard();c.sleeping=true;c.overlay.classList.add('interior-sleeping');await U.wait(240);if(I.current!==c)return;
    const r=note(E.Settlements.sleep(E.Store.hero()));c.sleeping=false;c.overlay.classList.remove('interior-sleeping');
    if(r.ok&&r.roomConsumed)I.leave();
  }
  function dispose(c){
    if(!c)return;clearPlacement(c);const geometry=new Set(),materials=new Set();c.scene.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of c.textures)t.dispose();
    if(c.overlay)c.overlay.remove();
  }
  I.open=(opts)=>{
    closeCard();keyState.x=keyState.y=0;
    const previous=I.current,pos=opts.keepPosition&&previous?{...previous.hero}:null;
    if(previous){if(previous.onClose)previous.onClose(previous);dispose(previous);}
    const scene=new THREE.Scene();scene.background=new THREE.Color('#25364a');scene.fog=new THREE.Fog('#25364a',22,48);
    const camera=new THREE.OrthographicCamera(-10,10,6.8,-6.8,.1,65);camera.position.set(9.3,10.8,13.1);camera.lookAt(0,.65,0);
    const h=E.Store.hero();const c=I.current={...opts,scene,camera,room:new THREE.Group(),materials:{},textures:new Set(),textureCache:new WeakMap(),fixtures:[],colliders:[],flames:[],hero:pos||{x:0,z:2.5,dir:1,stride:0},moving:false,sprinting:false,t:0,hudAt:0,near:null};
    c.region=E.Settlements.region(c.region);c.title=opts.title||names[c.kind]||'Interior';
    scene.add(c.room);c.ambient=new THREE.HemisphereLight('#f0e6ca','#565c6a',1.7);scene.add(c.ambient);const sun=new THREE.DirectionalLight('#fff2d4',2.1);sun.position.set(2,8,7);scene.add(sun);
    decorateRoom(c);recover(c);fitCamera(c);
    const F=f=>E.SP.hero(h,f,E.SP.heroWeaponType(h));c.frames={idle:[F('idle0'),F('idle1')],walk:Array.from({length:12},(_,i)=>F('w'+i))};
    c.sprite=sprite(c,c.frames.idle[0],E.WG.heroHeight(h)||2.3);c.scene.add(c.sprite);c.sprite.position.set(c.hero.x,floorY(c,c.hero.x,c.hero.z),c.hero.z);c.heroShadow=contact(c,c.scene,.43);
    c.overlay=U.h(`<div class="interior-hud lived-interior"><header class="interior-header"><div><span class="interior-kicker">${U.esc(E.Settlements.regionName(c.region))}</span><h2>${U.esc(c.title)}</h2><small class="interior-clock"></small></div><button class="btn sm dark" data-exit>${icon('door')} Sair</button></header><div class="interior-tip">WASD ou setas para andar · F para interagir</div><div class="interior-pad" aria-label="Movimento no interior"><button data-dir="up" aria-label="Andar para frente">${icon('arrow-up')}</button><button data-dir="left" aria-label="Andar para a esquerda">${icon('arrow-right')}</button><button data-dir="down" aria-label="Andar para trás">${icon('arrow-down')}</button><button data-dir="right" aria-label="Andar para a direita">${icon('arrow-right')}</button></div><button class="interior-act btn primary" data-act>Interagir</button><div class="interior-object-label"></div></div>`);
    document.getElementById('ui').appendChild(c.overlay);c.label=c.overlay.querySelector('.interior-object-label');c.act=c.overlay.querySelector('[data-act]');c.clock=c.overlay.querySelector('.interior-clock');
    c.overlay.querySelector('[data-exit]').onclick=()=>I.leave();c.act.onclick=()=>I.interact();
    const held=new Set();const updatePad=()=>{keyState.x=(held.has('right')?1:0)-(held.has('left')?1:0);keyState.y=(held.has('up')?1:0)-(held.has('down')?1:0);};
    c.overlay.querySelectorAll('[data-dir]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();held.add(b.dataset.dir);updatePad();b.setPointerCapture(e.pointerId);};const release=()=>{held.delete(b.dataset.dir);updatePad();};b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;});
    E.HUD.show(false);E.WG.locked=true;E.WG.setMode('interior');I.update(0);
  };
  I.refresh=()=>{if(I.current){const c=I.current;I.open({kind:c.kind,region:c.region,title:c.title,id:c.id,keepPosition:true});}};
  I.resize=()=>{if(I.current)fitCamera(I.current);};
  I.leave=()=>{const c=I.current;if(!c)return;if(c.kind==='room')return E.Settlements.enter('inn',c.region);I.close();};
  I.close=()=>{
    const c=I.current;if(!c)return;closeCard();if(c.onClose)c.onClose(c);I.current=null;keyState.x=keyState.y=0;dispose(c);E.WG.input.keys={};E.WG.locked=false;E.WG.setMode('world');E.HUD.show(true);E.HUD.update();
  };
  I.update=(dt)=>{
    const c=I.current;if(!c)return;dt=U.clamp(Number(dt)||0,0,.25);fitCamera(c);c.t+=dt;const h=c.hero,canMove=!E.UI.anyOpen()&&!document.querySelector('.modal-bg')&&!busy()&&!c.sleeping&&!c.edit&&!c.lockMove;
    const k=E.WG.input.move(),mx=keyState.x||k.x,my=keyState.y||k.y;
    c.moving=canMove&&(Math.abs(mx)+Math.abs(my)>.05);c.sprinting=false;
    if(c.edit){const e=c.edit,n=Math.max(1,Math.hypot(mx,my));e.x=U.clamp(e.x+(mx*.82-my*.57)/n*2.4*dt,-3.4,3.4);e.z=U.clamp(e.z+(-mx*.57-my*.82)/n*2.4*dt,-2.6,2.6);e.preview.g.position.set(e.x,.02,e.z);e.preview.g.rotation.y=e.turn*Math.PI/2;e.valid=canPlace(c,e);for(const m of e.materials)m.emissive.set(e.valid?'#3eaf81':'#be665b');e.bar.querySelector('[data-place]').disabled=!e.valid;if(c.t>=(e.nextText||0)){e.nextText=c.t+.2;e.status.textContent=e.valid?'Mova com WASD ou os botões · R gira · Enter coloca':'Este espaço está ocupado ou bloqueia a entrada';}}
    if(c.moving&&c.seated){c.seated=false;if(c.seatReturn){h.x=c.seatReturn.x;h.z=c.seatReturn.z;}}
    if(c.moving){
      // Camera-relative movement for the isometric room; normalize diagonals.
      const n=Math.max(1,Math.hypot(mx,my)),x=(mx*.82-my*.57)/n,z=(-mx*.57-my*.82)/n,speed=3.25;
      const oldX=h.x,oldZ=h.z;move(c,x*speed*dt,z*speed*dt);
      const moved=Math.hypot(h.x-oldX,h.z-oldZ);h.stride=(h.stride+moved)%3.3;c.moving=moved>.0001;if(Math.abs(mx)>0.05)h.dir=mx>0?1:-1;
    }
    const cv=c.moving?c.frames.walk[Math.floor(h.stride/3.3*12)%12]:c.frames.idle[Math.floor(c.t*1.7)%2];const hh=E.WG.heroHeight(E.Store.hero())||2.3;c.sprite.material.map=texture(c,cv);c.sprite.scale.set(hh*cv.width/cv.height*h.dir,hh*(c.seated ? .78 : 1),1);c.sprite.position.set(h.x,c.seated ? .43 : floorY(c,h.x,h.z),h.z);c.heroShadow.position.set(h.x,floorY(c,h.x,h.z)-.007,h.z);c.heroShadow.visible=!c.seated;
    if(c.npc)c.npc.material.map=texture(c,c.npcFrames[Math.floor(c.t*1.4)%2]);
    for(const f of c.flames)f.scale.y=.85+Math.sin(c.t*8)*.12;
    if(E.Settlements.workTick)E.Settlements.workTick(dt,c);
    if(c.onUpdate)c.onUpdate(dt,c);
    if(c.t>=c.hudAt){c.hudAt=c.t+.2;const cl=E.Sim.clock();c.clock.textContent=`${cl.text} · Saciedade ${Math.round(E.Sim.data(E.Store.hero()).hunger)}/100`;const lamps=c.fixtures.filter(f=>f.id==='lamp'&&f.furniture.lit!==false).length;c.ambient.intensity=(cl.night?1.15:1.65)+Math.min(.25,lamps*.10);
      let nearest=null,best=Infinity;for(const f of c.fixtures){const d=Math.hypot(h.x-f.x,h.z-f.z);if(d<f.r+1.05&&d<best){best=d;nearest=f;}}
      c.near=nearest;c.act.disabled=!nearest;c.act.innerHTML=nearest?`${icon(nearest.icon)} ${U.esc(nearest.label)}`:'Aproxime-se de um móvel';c.label.textContent=nearest?nearest.label:'';
    }
  };
  I.interact=async()=>{
    const c=I.current,f=c&&c.near;if(!f||c.edit||c.sleeping||c.lockMove||busy()||E.UI.anyOpen()||document.querySelector('.modal-bg'))return;
    const S=E.Settlements,h=E.Store.hero(),movable=owned(c,f),extra=movable?[{label:'Reposicionar este móvel',run:()=>{closeCard();I.beginPlacement(f.furniture.uid);}}]:[];
    if(f.run)return f.run(f,c);
    if(f.id==='exit')return I.leave();
    if(f.id==='service')return c.kind==='inn'?reception(c):E.WorldServices&&E.WorldServices.service(c.kind,c.region);
    if(f.id==='room-door'){
      if(!S.hasAccess(h,c.region,'room'))return card({title:'Porta do quarto',text:`A porta está trancada. Reserve uma diária de ${(S.prices?S.prices(c.region,'room'):S.PRICES.room).rent} po com Dona Amélia no balcão da pousada.`,actions:[]});
      closeCard();return S.enter('room',c.region);
    }
    if(f.id==='anvil')return E.WorldServices&&E.WorldServices.service(c.kind,c.region);
    if(f.id==='work')return E.WorldServices&&E.WorldServices.use({service:c.kind,action:'work',region:c.region,interior:true});
    if(f.id==='manage')return decorate(c);
    if(f.id==='bed')return card({title:'Cama de carvalho',text:S.canSleep(h)?'Uma cama limpa e silenciosa. Dormir recupera seus recursos até o amanhecer; você ainda vai precisar comer.':'Esta cama não está disponível para descanso.',actions:[{label:'Dormir até o amanhecer',disabled:!S.canSleep(h),run:()=>sleep(c)},...extra]});
    if(f.id==='hearth'||f.id==='table')return card({title:f.id==='hearth'?'Fogão aceso':'À mesa',text:f.id==='hearth'?'Escolha um ingrediente da mochila para preparar aqui.':'A mesa está posta. Escolha uma porção pronta da sua mochila.',actions:[{label:f.id==='hearth'?'Preparar uma porção':'Comer uma porção',run:()=>E.WorldServices&&E.WorldServices.use({service:'food',action:f.id==='hearth'?'cook':'eat',region:c.region,interior:true})},...extra]});
    if(f.id==='chair')return card({title:'Cadeira acolchoada',text:c.seated?'Você descansa por um instante. Mova-se quando quiser levantar.':'Uma pausa à sombra da janela. Sentar recupera seu vigor, mas não substitui dormir.',actions:[{label:c.seated?'Levantar':'Sentar',run:()=>{closeCard();if(c.seated){c.seated=false;if(c.seatReturn)Object.assign(c.hero,c.seatReturn);}else{c.seatReturn={x:c.hero.x,z:c.hero.z};c.hero.x=f.x;c.hero.z=f.z;c.seated=true;if(E.WG.world)E.WG.world.hero.st=E.WG.STAMINA;}}},...extra]});
    if(f.id==='chest')return card({title:'Baú de armazenamento',text:'Seus pertences ficam nesta casa. Guarde ou retire uma unidade por vez sem sair do cômodo.',actions:[{label:'Abrir o baú',run:()=>storage(c)},...extra]});
    if(f.id==='wardrobe')return card({title:'Guarda-roupa',text:'Seus trajes estão pendurados aqui. Escolha uma roupa que já pertence a você.',actions:[{label:'Olhar os cabides',run:()=>wardrobe()},...extra]});
    if(f.id==='bookshelf')return card({title:'Estante de viagem',text:'Cadernos e livros usados por viajantes. A lombada guarda marcas de muitas jornadas.',actions:[{label:'Abrir um livro',run:()=>readBook()},...extra]});
    if(f.id==='lamp')return card({title:'Luminária',text:f.furniture.lit===false?'O pavio está apagado.':'Uma luz quente preenche o canto da casa.',actions:[{label:f.furniture.lit===false?'Acender':'Apagar',run:()=>{f.furniture.lit=f.furniture.lit===false;f.shade.material.color.set(f.furniture.lit?'#f1d899':'#786d5a');f.shade.material.emissive.set(f.furniture.lit?'#a77f35':'#000000');E.Store.save();closeCard();c.hudAt=0;}},...extra]});
  };
  addEventListener('keydown',(e)=>{
    if(!I.current||e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(I.current.edit){if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();I.cancelPlacement();}else if(e.code==='KeyR'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();I.current.edit.turn=(I.current.edit.turn+1)%4;}else if(e.code==='Enter'&&!e.repeat){e.preventDefault();e.stopImmediatePropagation();I.confirmPlacement();}return;}
    if(I.current.sleeping)return;
    if(busy())return;
    if(e.code==='Escape'&&!E.UI.anyOpen()&&!document.querySelector('.modal-bg')){e.preventDefault();e.stopImmediatePropagation();I.leave();}
    else if((e.code==='KeyF'||e.code==='KeyE')&&!e.repeat&&!E.UI.anyOpen()){e.preventDefault();e.stopImmediatePropagation();I.interact();}
  },true);
  addEventListener('blur',()=>{keyState.x=keyState.y=0;});
  E.Interior=I;
})();
