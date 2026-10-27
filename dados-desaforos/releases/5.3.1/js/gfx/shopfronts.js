/* Open commercial architecture shared by regional villages and Aurenna.
   The shop floor is part of the world: no facade-sized collider or transition. */
(() => {
  'use strict';
  const S={},U=E.U,TAU=Math.PI*2;
  const DEFAULT={wall:'#e8dfc7',wood:'#75583d',roof:'#4d7f7d',accent:'#d7b577',stone:'#a59b85'};
  const palette=p=>Array.isArray(p)?{...DEFAULT,wall:p[0],roof:p[1],wood:p[2]}:{...DEFAULT,...p};
  function material(w,color,extra={}){
    const cache=w._shopMaterials||(w._shopMaterials=new Map()),params={};for(const[k,v]of Object.entries(extra))params[k]=v&&v.isTexture?v.uuid:v;const key=color+'|'+JSON.stringify(params);
    if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color,roughness:.87,flatShading:true,...extra}));
    return cache.get(key);
  }
  function box(w,g,color,x,y,z,sx,sy,sz,extra){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material(w,color,extra));o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=false;g.add(o);return o;}
  function cyl(w,g,color,x,y,z,r,h,n=8,top=r){const o=new THREE.Mesh(new THREE.CylinderGeometry(top,r,h,n),material(w,color));o.position.set(x,y,z);o.receiveShadow=true;g.add(o);return o;}
  function point(v,lx,lz){const c=Math.cos(v.rotation),s=Math.sin(v.rotation);return{x:v.x+c*lx+s*lz,z:v.z-s*lx+c*lz};}
  function wall(w,v,lx,lz,length,axis,r=.2){
    const steps=Math.max(1,Math.ceil(length/(r*1.8)));
    for(let i=0;i<=steps;i++){const a=length*(i/steps-.5),p=point(v,lx+(axis==='x'?a:0),lz+(axis==='z'?a:0));w.colliders.push({...p,r,venue:v.id});}
  }
  function floor(w,v){
    const hs=[];for(let ix=-2;ix<=2;ix++)for(let iz=-2;iz<=2;iz++){const p=point(v,ix*v.w/4,iz*v.d/4);hs.push(w.terrainAt?w.terrainAt(p.x,p.z):w.height(p.x,p.z));}
    const low=Math.min(...hs),max=Math.max(...hs);v.y=Number.isFinite(v.y)?Math.max(v.y,max+.035):max+.035;v.group.position.y=v.y;
    const ht=Math.max(.22,v.y-low+.18);
    box(w,v.arch,v.palette.stone,0,-ht/2,0,v.w+.24,ht,v.d+.24);
    box(w,v.arch,v.palette.wood,0,.012,0,v.w,.055,v.d);
    for(let z=-v.d/2+.42;z<v.d/2;z+=.6)box(w,v.arch,'#5d4938',0,.043,z,v.w,.014,.014);
    (w.groundPlatforms||(w.groundPlatforms=[])).push({x:v.x,z:v.z,w:v.w+.26,d:v.d+.26,rotation:v.rotation,y:v.y+.045,venue:v.id});
    // An actual shallow ramp joins the shop floor to the surrounding paving.
    const fp=point(v,0,v.d/2+1.15),edge=point(v,0,v.d/2+2.2),fy=w.groundAt?w.groundAt(edge.x,edge.z):w.terrainAt?w.terrainAt(edge.x,edge.z):w.height(edge.x,edge.z),joinOffset=w.reg&&w.reg.metro?.005:.060;
    const ramp=new THREE.BufferGeometry(),near=v.d/2+.1,far=near+2.1,top=.045,bottom=fy-v.y+joinOffset;
    ramp.setAttribute('position',new THREE.Float32BufferAttribute([-1.7,top,near,1.7,top,near,-1.7,bottom,far,1.7,top,near,1.7,bottom,far,-1.7,bottom,far],3));ramp.computeVertexNormals();
    if(w._pavingTexture){const pos=ramp.attributes.position,uv=[];for(let i=0;i<pos.count;i++){const p=point(v,pos.getX(i),pos.getZ(i));uv.push(p.x/2.8,p.z/2.8);}ramp.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
    const m=new THREE.Mesh(ramp,material(w,v.palette.stone,{side:THREE.DoubleSide,...(w._pavingTexture?{map:w._pavingTexture}:{})}));m.receiveShadow=true;v.arch.add(m);
    (w.groundPlatforms||(w.groundPlatforms=[])).push({x:fp.x,z:fp.z,w:3.4,d:2.1,rotation:v.rotation,y:v.y+.045,fromY:fy+joinOffset,toY:v.y+.045,ramp:true,venue:v.id});
    v.frontAt=point(v,0,v.d/2+1.4);v.frontAt.y=fy;
  }
  function sign(w,v,text){
    const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');
    const draw=()=>{x.clearRect(0,0,512,96);x.fillStyle='#233e47';x.fillRect(3,3,506,90);x.strokeStyle='#d8bb82';x.lineWidth=3;x.strokeRect(8,8,496,80);x.font='bold 31px Nunito, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#f5e7ca';x.fillText(v.name,256,49,472);};draw();
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
    const mount=v.awning||v.arch,beam=v.open?v.h:v.service==='inn'?3.05:3.4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(v.w-.45,5.1),.83),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));mesh.position.set(0,beam-.25,v.d/2+.68);mount.add(mesh);for(const side of[-1,1])box(w,mount,v.palette.wood,side*Math.min(1.7,v.w*.3),beam+.04,v.d/2+.32,.08,.08,.76);v.signMesh=mesh;v.signTexture=tex;v.updateSign=name=>{v.name=String(name||v.name);draw();tex.needsUpdate=true;};
    return mesh;
  }
  function make(w,opts,closed){
    const group=new THREE.Group(),arch=new THREE.Group();group.add(arch);group.name=(closed?'residence-':'open-venue-')+opts.id;
    const v={...opts,id:opts.id||opts.service,service:opts.service||'general',region:w.id,x:opts.x,z:opts.z,y:opts.y,rotation:opts.rotation||0,w:opts.w||7.2,d:opts.d||6,h:opts.h||3.15,group,arch,palette:palette(opts.palette),fixtures:[],open:!closed};
    group.position.set(v.x,0,v.z);group.rotation.y=v.rotation;v.merchantAt={x:0,z:-v.d*.34};floor(w,v);w.scene.add(group);(w.venues||(w.venues=[])).push(v);
    return v;
  }
  S.add=(w,opts)=>{
    const v=make(w,opts,false),p=v.palette,g=v.arch,hw=v.w/2,hd=v.d/2,h=v.h;
    box(w,g,p.wall,0,h*.5,-hd,v.w,h,.2);wall(w,v,0,-hd,v.w,'x',.24);
    // Rear returns provide structure while shop fronts and the broad centre remain open.
    for(const side of[-1,1]){
      box(w,g,p.wall,side*hw,.55,-v.d*.12,.18,1.1,v.d*.76);wall(w,v,side*hw,-v.d*.12,v.d*.76,'z',.21);
      box(w,g,p.wood,side*hw,h*.48,hd,.2,h,.2);const pt=point(v,side*hw,hd);w.colliders.push({...pt,r:.18,venue:v.id});
      box(w,g,p.wood,side*hw,h*.5,-hd,.21,h+.15,.21);
      // Framed rear shelving is decoration; product fixtures stay separately interactive.
      box(w,g,p.wood,side*(hw-.95),1.24,-hd+.26,1.3,.10,.45);box(w,g,p.wood,side*(hw-.95),2.02,-hd+.26,1.3,.10,.45);
      for(let k=0;k<3;k++)cyl(w,g,[p.accent,'#92a59b','#be8a63'][k],side*(hw-.95)+(k-1)*.28,1.48,-hd+.26,.11,.38,6,.08);
    }
    box(w,g,p.wood,0,h,-hd,v.w+.3,.18,.24);box(w,g,p.wood,0,h,hd,v.w+.3,.18,.24);
    // Roof covers only the back third: the camera can read the merchandise and actors.
    const roof=box(w,g,p.roof,0,h+.14,-v.d*.34,v.w+.54,.16,v.d*.36);roof.rotation.x=-.09;
    const awningGroup=new THREE.Group();awningGroup.name='shop-awning';v.group.add(awningGroup);v.awning=awningGroup;
    const tint=material(w,p.roof).clone();tint.userData.awningTint=true;
    for(let k=0;k<7;k++){
      const stripeW=(v.w+.4)/7,awning=box(w,awningGroup,k%2?p.roof:'#eadfc6',-v.w/2+stripeW*(k+.5)-.2,h-.02,hd-.1,stripeW+.025,.10,1.18);awning.rotation.x=.11;if(k%2)awning.material=tint;
      const valance=box(w,awningGroup,k%2?p.roof:'#eadfc6',-v.w/2+stripeW*(k+.5)-.2,h-.23,hd+.48,stripeW+.025,.33,.07);if(k%2)valance.material=tint;
    }
    // Different trades have silhouettes visible from the street.
    if(v.service==='smith'){
      box(w,g,'#80796f',-hw+.55,1.0,-hd+.58,1.2,2,1.05);box(w,g,'#625c58',-hw+.55,2.75,-hd+.58,.62,2.3,.6);
      box(w,g,'#e6a456',-hw+.55,.65,-hd+1.13,.62,.62,.04,{emissive:'#f39937',emissiveIntensity:.7});
    }else if(v.service==='guild'){
      for(const side of[-1,1]){const banner=box(w,g,p.roof,side*(hw-.38),1.7,-hd+.15,.52,1.55,.07);box(w,g,p.accent,side*(hw-.38),2.48,-hd+.20,.68,.07,.09);}
    }else if(v.service==='food'){
      for(const side of[-1,1]){const basket=cyl(w,g,'#af8750',side*(hw-.6),.38,hd-.3,.35,.45,8);for(let k=0;k<4;k++){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.12,6,4),material(w,k%2?'#a9b76b':'#cf8856'));fruit.position.set(side*(hw-.6)+(k%2-.5)*.22,.65,hd-.3+(Math.floor(k/2)-.5)*.2);g.add(fruit);}}
    }else if(v.service==='player-shop'){
      box(w,g,p.accent,0,1.8,-hd+.16,1.25,.85,.1);for(const side of[-1,1])cyl(w,g,p.accent,side*hw,3.28,hd,.22,.12,8);
    }
    sign(w,v,v.name);
    if(E.ScenePerf)E.ScenePerf.batch(awningGroup,{cellSize:80,bakeColors:false});
    v.awningMaterials=[];awningGroup.traverse(o=>{if(o.material&&o.material.userData.awningTint&&!v.awningMaterials.includes(o.material))v.awningMaterials.push(o.material);});
    if(E.ScenePerf)E.ScenePerf.batch(g,{cellSize:80});
    if(E.WorldServices&&E.WorldServices.decorate)E.WorldServices.decorate(w,v);
    return v;
  };
  S.closed=(w,opts)=>{
    const v=make(w,opts,true),p=v.palette,g=v.arch,hw=v.w/2,hd=v.d/2,inn=v.service==='inn',h=inn?4.9:3.4;
    box(w,g,p.wall,0,h/2,0,v.w,h,v.d);
    for(const side of[-1,1])box(w,g,p.wood,side*(hw-.12),h/2,hd+.02,.18,h,.14);
    const roof=new THREE.Mesh(new THREE.ConeGeometry((v.w+.6)/Math.SQRT2,inn?2.05:1.65,4).rotateY(Math.PI/4),material(w,p.roof));roof.scale.z=(v.d+.6)/(v.w+.6);roof.position.y=h+(inn?1.02:.82);g.add(roof);
    box(w,g,p.wood,0,1.14,hd+.13,1.35,2.28,.12);box(w,g,p.accent,.38,1.15,hd+.23,.1,.12,.09);
    for(const side of[-1,1]){
      box(w,g,p.wood,side*hw*.58,1.91,hd+.13,1.3,1.15,.15);box(w,g,'#b8d2d2',side*hw*.58,1.91,hd+.23,.95,.86,.05);
      box(w,g,p.wood,side*hw*.58,1.94,hd+.27,.055,.94,.035);
      box(w,g,p.wood,side*hw*.58,1.36,hd+.42,1.45,.24,.48);for(let k=0;k<3;k++)cyl(w,g,k%2?'#8ca078':'#b798a2',side*hw*.58+(k-1)*.37,1.61,hd+.43,.16,.24,6);
      if(inn){box(w,g,'#c5d9d6',side*hw*.58,3.8,hd+.16,1.05,.9,.09);box(w,g,p.wood,side*hw*.58,3.33,hd+.2,1.3,.12,.2);}
    }
    if(inn){box(w,g,p.wood,0,3.05,hd+.27,v.w+.2,.20,.75);for(let k=-3;k<=3;k++)box(w,g,p.wood,k*v.w/7,3.47,hd+.63,.07,.8,.07);box(w,g,p.wood,0,3.9,hd+.63,v.w,.09,.09);}
    box(w,g,p.stone,hw-.65,h+.5,-hd+.7,.7,1.7,.7);
    // Deliberately solid residential buildings retain a real door and indoor room.
    for(let x=-hw+.3;x<=hw-.2;x+=.57)for(let z=-hd+.3;z<=hd-.2;z+=.57){const q=point(v,x,z);w.colliders.push({...q,r:.37,venue:v.id});}
    sign(w,v,v.name);if(E.ScenePerf)E.ScenePerf.batch(g,{cellSize:80});
    const d=point(v,0,hd+1.3);v.door={kind:'settlement',service:v.service,region:w.id,...d,r:2.6,label:'Entrar: '+v.name,icon:E.Icons.html(v.service==='inn'?'bed':'home',{decorative:true}),building:v.group,venueId:v.id};w.interactables.push(v.door);
    if(E.WorldServices&&E.WorldServices.decorate)E.WorldServices.decorate(w,v);
    return v;
  };
  function prop(w,g,model,itemId,p){
    const c=p.accent,wood=p.wood;
    if(['roulette','dice-table','cards-table'].includes(model)){
      box(w,g,wood,0,.94,0,2.25,.24,1.65);box(w,g,'#477362',0,1.075,0,2.08,.035,1.47);for(const side of[-1,1])box(w,g,wood,side*.8,.46,0,.22,.9,1.10);
      if(model==='roulette'){
        if(!w._rouletteTexture){const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d'),reds=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];x.fillStyle='#b99452';x.fillRect(0,0,256,256);for(let n=0;n<37;n++){const a=n*Math.PI*2/37,b=(n+1)*Math.PI*2/37;x.beginPath();x.moveTo(128,128);x.arc(128,128,119,a,b);x.closePath();x.fillStyle=n===0?'#3a815e':reds.includes(n)?'#a64943':'#283a3b';x.fill();x.save();x.translate(128,128);x.rotate(a+(b-a)/2);x.fillStyle='#f3e4bd';x.font='bold 11px sans-serif';x.textAlign='center';x.fillText(String(n),99,4);x.restore();}x.beginPath();x.arc(128,128,78,0,Math.PI*2);x.fillStyle='#d2b36d';x.fill();x.beginPath();x.arc(128,128,65,0,Math.PI*2);x.fillStyle='#73533c';x.fill();w._rouletteTexture=new THREE.CanvasTexture(cv);w._rouletteTexture.colorSpace=THREE.SRGBColorSpace;}
        cyl(w,g,p.accent,0,1.12,0,.75,.10,32);const wheel=g.userData.wheel=new THREE.Group();g.add(wheel);const disc=new THREE.Mesh(new THREE.CircleGeometry(.69,48),new THREE.MeshStandardMaterial({map:w._rouletteTexture,roughness:.6}));disc.rotation.x=-Math.PI/2;disc.position.y=1.18;wheel.add(disc);cyl(w,wheel,p.accent,0,1.24,0,.055,.13,8);box(w,wheel,p.accent,0,1.25,0,.77,.045,.035);box(w,wheel,p.accent,0,1.25,0,.035,.045,.77);box(w,g,'#f1e4b9',.73,1.24,0,.12,.15,.12);
      }else if(model==='dice-table'){
        if(!w._tableDiceMats){w._tableDiceMats=Array.from({length:6},(_,i)=>{const cv=document.createElement('canvas');cv.width=cv.height=48;const x=cv.getContext('2d');x.fillStyle='#f0e4c8';x.fillRect(0,0,48,48);x.fillStyle='#334748';const pips=[[[24,24]],[[13,13],[35,35]],[[13,13],[24,24],[35,35]],[[13,13],[35,13],[13,35],[35,35]],[[13,13],[35,13],[24,24],[13,35],[35,35]],[[13,12],[35,12],[13,24],[35,24],[13,36],[35,36]]][i];for(const[a,b]of pips){x.beginPath();x.arc(a,b,3.6,0,Math.PI*2);x.fill();}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshStandardMaterial({map:t,roughness:.6});});}
        g.userData.dice=[];for(const side of[-1,1]){const die=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.25),w._tableDiceMats);die.position.set(side*.32,1.22,side*.12);g.add(die);g.userData.dice.push(die);}
      }else{
        for(let i=0;i<3;i++){box(w,g,'#efe4c8',(i-1)*.35,1.108,0,.27,.018,.40);const suit=new THREE.Mesh(new THREE.CircleGeometry(.057,i%2?4:12),material(w,i%2?'#a8463d':'#263b3b'));suit.rotation.x=-Math.PI/2;suit.position.set((i-1)*.35,1.122,0);g.add(suit);}for(let k=0;k<4;k++)cyl(w,g,p.accent,.76,1.12+k*.035,.35,.09,.03,10);
      }
    }else if(model==='slots'){
      box(w,g,wood,0,1.0,0,1.3,2.0,.85);box(w,g,p.accent,0,2.10,0,1.42,.22,.95);box(w,g,'#254443',0,1.55,.45,1.15,.65,.06);
      const cv=document.createElement('canvas');cv.width=256;cv.height=128;const x=cv.getContext('2d');x.fillStyle='#1c393b';x.fillRect(0,0,256,128);for(let k=0;k<3;k++){x.fillStyle='#f1e4bd';x.fillRect(8+k*83,18,74,94);}const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;for(const [i,key]of ['dragon','gem','star'].entries())E.Icons.paint(x,key,13+i*83,34,65,()=>{t.needsUpdate=true;});const face=new THREE.Mesh(new THREE.PlaneGeometry(1.06,.54),new THREE.MeshBasicMaterial({map:t}));face.position.set(0,1.55,.49);g.add(face);box(w,g,p.accent,0,.83,.47,.61,.06,.08);cyl(w,g,p.accent,.76,1.05,0,.055,.65,6);const knob=new THREE.Mesh(new THREE.SphereGeometry(.13,7,5),material(w,'#a55047'));knob.position.set(.76,1.4,0);g.add(knob);
    }else if(model==='wholesale'){
      // A pallet with strapped cases reads as bulk stock from the street.
      for(const sx of[-.62,0,.62])box(w,g,wood,sx,.10,0,.20,.20,1.12);
      for(const z of[-.43,0,.43])box(w,g,'#a88757',0,.23,z,1.65,.10,.30);
      for(const [x,y,z]of[[-.43,.65,-.15],[.43,.65,-.15],[0,1.38,-.15]]){
        box(w,g,'#a78251',x,y,z,.78,.72,.78);for(const side of[-1,1])box(w,g,p.accent,x+side*.23,y,z+.41,.07,.71,.035);box(w,g,'#c8af7d',x,y+.1,z+.43,.34,.23,.025);
      }
      box(w,g,'#ddcfaa',.58,1.48,.32,.30,.4,.05);
    }else if(model==='recruitment'){
      for(const side of[-1,1])box(w,g,wood,side*.40,.60,0,.10,1.18,.10);
      box(w,g,wood,0,1.24,0,1.2,.94,.13);box(w,g,p.accent,0,1.24,.082,1.08,.82,.035);
      const word=itemId==='staff'?'EQUIPE':itemId==='professions'?'OFÍCIOS':'VAGAS';
      const cache=w._recruitmentTextures||(w._recruitmentTextures={});
      if(!cache[word]){const cv=document.createElement('canvas');cv.width=160;cv.height=112;const x=cv.getContext('2d');x.fillStyle='#243f43';x.fillRect(0,0,160,112);x.strokeStyle='#d9b970';x.lineWidth=4;x.strokeRect(4,4,152,104);x.fillStyle='#f4e2b7';x.textAlign='center';x.font='bold 24px monospace';x.fillText(word,80,45);x.fillStyle='#99b8a1';x.font='bold 11px monospace';x.fillText(itemId==='staff'?'CONTRATAR':itemId==='professions'?'APRENDER':'FALE CONOSCO',80,77);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;cache[word]=t;}
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.00,.70),new THREE.MeshBasicMaterial({map:cache[word],side:THREE.DoubleSide}));face.position.set(0,1.24,.115);g.add(face);
    }else if(model==='anvil'){
      box(w,g,'#806146',0,.32,0,.85,.64,.70);box(w,g,'#586166',0,.75,0,.95,.20,.75);box(w,g,'#6f7c80',0,1.02,0,.45,.42,.53);box(w,g,'#a5aca9',0,1.26,0,1.20,.16,.54);const horn=new THREE.Mesh(new THREE.ConeGeometry(.24,.65,5),material(w,'#919e9c'));horn.rotation.z=-Math.PI/2;horn.position.set(.83,1.25,0);g.add(horn);box(w,g,'#73523b',-.37,1.44,.10,.08,.5,.08);box(w,g,'#626f70',-.37,1.67,.10,.38,.18,.19);
    }else if(model==='counter'||model==='cashbox'){
      box(w,g,wood,0,.51,0,model==='counter'?1.6:.65,model==='counter'?1.02:.46,.72);box(w,g,p.accent,0,model==='counter'?1.06:.77,0,model==='counter'?1.78:.75,.10,.84);
      if(model==='cashbox')for(let k=0;k<3;k++)cyl(w,g,'#d6b66e',k*.13-.13,.86,0,.055,.035,8);
    }else if(model==='food'){
      box(w,g,wood,0,.41,0,1.22,.82,.74);box(w,g,'#e4d0a5',0,.85,0,1.3,.1,.81);
      for(let k=0;k<5;k++){const o=new THREE.Mesh(new THREE.SphereGeometry(.15,7,5),material(w,['#cfa965','#bd7f56','#92aa64'][k%3]));o.scale.set(1.3,.65,.85);o.position.set((k%3-1)*.28,1.0,(Math.floor(k/3)-.5)*.27);g.add(o);}
    }else if(model==='glider'){
      box(w,g,wood,0,.5,0,.9,.98,.72);const wing=new THREE.Mesh(new THREE.BufferGeometry(),material(w,p.roof,{side:THREE.DoubleSide}));wing.geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1.1,1.6,0,0,2.0,-.15,1.1,1.6,0,-1.1,1.6,0,1.1,1.6,0,0,1.35,.2],3));wing.geometry.computeVertexNormals();g.add(wing);box(w,g,p.accent,0,1.55,.05,.07,.9,.07);
    }else if(model==='weapon'){
      box(w,g,wood,0,.55,0,1.1,1.1,.5);box(w,g,'#b8c8cf',0,1.57,0,.15,1.1,.07);box(w,g,p.accent,0,1.03,0,.58,.10,.12);box(w,g,'#4f3c30',0,.8,0,.13,.36,.12);
    }else if(model==='noticeboard'||model==='sign'){
      for(const side of[-1,1])box(w,g,wood,side*.5,.8,0,.11,1.6,.11);box(w,g,'#98794f',0,1.45,0,1.48,1.25,.15);
      for(let k=0;k<4;k++)box(w,g,k%2?'#e5d7b6':'#d8c29b',(k%2-.5)*.59,1.2+Math.floor(k/2)*.53,.09,.43,.4,.035);
    }else if(model==='pot'){
      box(w,g,p.stone,0,.4,0,.95,.8,.85);cyl(w,g,'#4b5757',0,.92,0,.38,.35,10,.42);cyl(w,g,'#c6a166',0,1.1,0,.28,.035,10);box(w,g,'#aa7b48',.31,1.28,.08,.07,.55,.07);
    }else if(model==='bed'||(model==='furniture'&&itemId==='bed')){
      box(w,g,wood,0,.35,0,1.4,.55,2.1);box(w,g,'#eadcc4',0,.67,0,1.34,.18,2.02);box(w,g,p.roof,0,.8,.25,1.36,.1,1.15);box(w,g,'#faf0da',0,.83,-.65,1.05,.2,.43);box(w,g,wood,0,.78,-1.07,1.5,1.3,.13);
    }else if(model==='shelf'||(model==='furniture'&&['bookshelf','wardrobe'].includes(itemId))){
      const tall=itemId==='wardrobe';for(const side of[-1,1])box(w,g,wood,side*.58,1.02,0,.12,2.04,.52);for(const y of[.12,.8,1.48,2.0])box(w,g,wood,0,y,0,1.27,.1,.58);for(let k=0;k<7;k++)box(w,g,['#a99166','#6f9695','#c88c7a'][k%3],(k%4-1.5)*.24,k<4?1.1:1.73,0,.16,.45,.32);if(tall)box(w,g,p.wall,0,1.06,.3,1.1,1.84,.06);
    }else if(model==='crate'||(model==='furniture'&&itemId==='chest')){
      box(w,g,wood,0,.4,0,1.05,.8,.72);box(w,g,p.accent,0,.86,0,1.12,.15,.79);for(const side of[-1,1])box(w,g,p.accent,side*.31,.45,.38,.09,.73,.04);
    }else if(model==='furniture'&&itemId==='hearth'){
      box(w,g,p.stone,0,.6,0,1.3,1.2,.8);box(w,g,'#4c4237',0,.48,.43,.82,.63,.04);const flame=new THREE.Mesh(new THREE.ConeGeometry(.22,.48,6),material(w,'#efa75b',{emissive:'#efa75b',emissiveIntensity:.7}));flame.position.set(0,.5,.49);g.add(flame);
    }else if(model==='furniture'&&itemId==='lamp'){
      cyl(w,g,p.accent,0,.08,0,.25,.14);cyl(w,g,wood,0,.8,0,.05,1.5,6);const shade=new THREE.Mesh(new THREE.ConeGeometry(.43,.45,8),material(w,'#e7d4a2'));shade.position.y=1.65;g.add(shade);
    }else if(model==='furniture'&&itemId==='chair'){
      box(w,g,wood,0,.58,0,.75,.15,.75);box(w,g,wood,0,1.06,-.3,.75,.9,.12);for(const x of[-.27,.27])for(const z of[-.27,.27])box(w,g,wood,x,.27,z,.1,.55,.1);
    }else{
      box(w,g,wood,0,.92,0,1.5,.14,.85);for(const side of[-1,1])box(w,g,wood,side*.55,.45,0,.14,.9,.65);
    }
  }
  S.fixture=(w,v,spec,lx=0,lz=0)=>{
    const g=new THREE.Group();g.name='venue-fixture-'+(spec.action||'service');const at=point(v,lx,lz),gy=Math.abs(lz)>v.d/2+.15?(w.terrainAt?w.terrainAt(at.x,at.z):w.height(at.x,at.z))-v.y:0;g.position.set(lx,gy,lz);v.group.add(g);prop(w,g,spec.model||'counter',spec.itemId||spec.product,v.palette);
    if(E.ScenePerf){E.ScenePerf.batch(g,{cellSize:20,exclude:[g.userData.wheel,...(g.userData.dice||[])].filter(Boolean)});if(g.userData.wheel)E.ScenePerf.batch(g.userData.wheel);}
    const p=point(v,lx,lz),it={...spec,kind:'venue',venueId:v.id,service:v.service,region:v.region,x:p.x,z:p.z,r:spec.r||2,label:spec.label||v.name,icon:E.Icons.html(spec.icon||'chat',{decorative:true}),group:g,venue:v};
    // Products occupy a compact footprint; interaction remains possible from the open aisle.
    if(spec.solid!==false){let radius=['roulette','dice-table','cards-table'].includes(spec.model)?.85:spec.model==='slots'?.65:spec.model==='anvil'?.6:spec.model==='bed'?.7:spec.model==='noticeboard'?.55:spec.model==='recruitment'?.40:spec.model==='wholesale'?.75:spec.model==='counter'?.64:.43;w.colliders.push({...p,r:radius,venue:v.id,fixture:it});}
    w.interactables.push(it);v.fixtures.push(it);return it;
  };
  S.restyle=(v,color)=>{if(v&&color)for(const m of v.awningMaterials||[])m.color.set(color);};
  S.batchTown=w=>{
    if(w.shopArchitecture||!E.ScenePerf)return;
    const root=w.shopArchitecture=new THREE.Group();root.name='shared-market-architecture';w.scene.add(root);w.scene.updateMatrixWorld(true);
    for(const v of w.venues||[])if(v.arch&&v.arch!==v.group)root.attach(v.arch);
    E.ScenePerf.batch(root,{cellSize:38});
  };
  S.update=w=>{
    const p=w.hero;if(!p)return;
    for(const v of w.venues||[])if(v.open&&v.awning){const a=v.rotation||0,dx=p.x-v.x,dz=p.z-v.z,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz,inside=Math.abs(lx)<v.w/2+.12&&lz<v.d/2+.05&&lz>-v.d/2;
      v.awning.visible=!inside;if(v.signMesh&&!v.signMesh.userData.scenePerfSource)v.signMesh.visible=!inside;
    }
  };
  S.point=point;S.material=material;S.box=box;S.cylinder=cyl;S.palette=palette;
  E.Shopfronts=S;
})();
