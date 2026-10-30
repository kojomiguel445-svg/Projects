/* Aurenna: a walkable market city. Commerce happens in open arcades in the world,
   with a residential quarter, a working quay and clear pedestrian streets. */
(() => {
  'use strict';
  const U=E.U,MT={};
  const TAU=Math.PI*2;
  MT.BUILDINGS=[
    {id:'cassino',service:'casino',name:'Fortuna Dourada',icon:'casino',x:-23,z:-25,w:13,d:9,h:3.5,rotation:0,color:'#e3d6bd',roofC:'#8e445a',accent:'#d1ac61',style:'casino'},
    {id:'bolsa',service:'market',name:'Galeria dos Mercadores',icon:'scales',x:-6,z:-27,w:13,d:8,h:3.6,rotation:0,color:'#eadfc9',roofC:'#5f8580',accent:'#c6a46a',style:'loggia'},
    {id:'guilda',service:'guild',name:'Casa dos Ofícios',icon:'journal',x:11,z:-26,w:11,d:9,h:3.5,rotation:0,color:'#ddd7c9',roofC:'#546f8d',accent:'#c6ac74',style:'guild'},
    {id:'arena',service:'arena',name:'Coliseu de Aurenna',icon:'shield',x:29,z:-24,w:14,d:12,h:3.1,rotation:0,color:'#d6c3a1',roofC:'#a35f51',accent:'#b99865',style:'arena'},
    {id:'forja',service:'smith',name:'Oficina da Bigorna Celeste',icon:'anvil',x:-27,z:-7,w:10,d:8,h:3.3,rotation:Math.PI/2,color:'#c8c1ad',roofC:'#627779',accent:'#b79b65',style:'smith'},
    {id:'taverna',service:'food',name:'Caneco Dourado',icon:'cooking',x:-27,z:9,w:12,d:8,h:3.2,rotation:Math.PI/2,color:'#e4d3b6',roofC:'#ad7458',accent:'#d1b17a',style:'tavern'},
    {id:'emporio',service:'general',name:'Empório dos Viajantes',icon:'shop',x:25,z:-6,w:10,d:8,h:3.25,rotation:-Math.PI/2,color:'#e8dfc7',roofC:'#548b80',accent:'#c3a669',style:'general'},
    {id:'marcenaria',service:'furniture',name:'Ateliê Madeira & Linho',icon:'home',x:26,z:10,w:11,d:8,h:3.25,rotation:-Math.PI/2,color:'#e0d5bc',roofC:'#8e8078',accent:'#c5a369',style:'furniture'},
    {id:'alquimista',service:'alchemy',name:'Mil Cores — Botica',icon:'potion',x:27,z:26,w:10,d:8,h:3.4,rotation:-Math.PI/2,color:'#ddd2d4',roofC:'#80729b',accent:'#c5b182',style:'alchemy'},
    {id:'meu-ponto',service:'player-shop',name:'Seu Ponto na Praça',icon:'scales',x:8,z:28,w:10,d:8,h:3.3,rotation:Math.PI,color:'#e7ddc4',roofC:'#5c898c',accent:'#d2b376',style:'player-shop'},
    {id:'pousada',service:'inn',name:'Pousada das Sete Janelas',icon:'bed',x:-8,z:29,w:10,d:9,h:5,rotation:Math.PI,color:'#ebdfc6',roofC:'#886953',accent:'#c6a66b',style:'inn'},
    {id:'residencia',service:'home',name:'Casa do Bairro do Porto',icon:'home',x:-28,z:29,w:10,d:8,h:3.5,rotation:Math.PI,color:'#eadfc9',roofC:'#6e8b82',accent:'#b99c66',style:'home'},
    {id:'casino-owner',service:'player-casino',name:'Salão das Cartas · Ponto licenciado',icon:'casino',x:-28,z:-43,w:14,d:9,h:3.7,rotation:0,color:'#e3d9c4',roofC:'#514f78',accent:'#d8b675',style:'licensed-casino'},
    {id:'pier',service:'pier',name:'Casa dos Pescadores',icon:'fish',x:-16,z:38,w:9,d:6,h:3.1,rotation:Math.PI,color:'#e0d2b7',roofC:'#5d8199',accent:'#c4a671',style:'pier'},
  ];
  MT.enter=id=>{
    const b=MT.BUILDINGS.find(b=>b.id===id),w=E.WG.world;if(!b||!w)return;
    if(b.service==='inn'||b.service==='home')return E.Settlements.enter(b.service,w.id);
    const v=(w.venues||[]).find(v=>v.id===id);
    if(E.WorldServices&&E.WorldServices.guide)return E.WorldServices.guide(b.service,w.id);
    E.UI.toast(`${b.name} tem a fachada aberta. Entre pelo corredor e aproxime-se dos produtos ou do balcão.`);
    return v;
  };
  // Preserve the terrain of existing saved games and the coast's waterline.
  MT.height=(world,x,z)=>{
    const n=world.noise,dc=Math.hypot(x,z);
    let h=.4+n.fbm(x*.05,z*.05,2)*.12*U.clamp((dc-50)/10,0,1);
    const sea=(z-40)/6;if(sea>0)h-=Math.min(1,sea)*3.2+Math.max(0,sea-1)*.6;
    const edge=U.clamp((dc-62)/12,0,1),K=world.K||1;
    if(z<38){if(K>1){const far=U.clamp((dc-70*K)/12,0,1);h+=edge*(2.2+n.fbm(x*.022,z*.022,4)*4.5)+far*far*18;}
      else h+=edge*edge*14+n.fbm(x*.03,z*.03,3)*4*edge;}
    return h;
  };
  function material(w,c,extra={}){
    const cache=w._metroMaterials||(w._metroMaterials=new Map()),params={};for(const [k,v]of Object.entries(extra))params[k]=v&&v.isTexture?v.uuid:v;const key=c+'|'+JSON.stringify(params);
    if(!cache.has(key))cache.set(key,new THREE.MeshStandardMaterial({color:c,roughness:.9,flatShading:true,...extra}));
    return cache.get(key);
  }
  function box(w,g,c,x,y,z,sx,sy,sz){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material(w,c));m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m;}
  function cyl(w,g,c,x,y,z,r,h,n=8,rt=r){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,r,h,n),material(w,c));m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m;}
  function lineColliders(w,a,b,r=.28){const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/(r*1.7)));for(let i=0;i<=n;i++)w.colliders.push({x:U.lerp(a.x,b.x,i/n),z:U.lerp(a.z,b.z,i/n),r,city:true});}
  function textTexture(text,small){const c=document.createElement('canvas');c.width=512;c.height=small?80:112;const x=c.getContext('2d');x.fillStyle='#2f4b52';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#d3b87c';x.lineWidth=3;x.strokeRect(6,6,c.width-12,c.height-12);x.fillStyle='#f2e6c9';x.textAlign='center';x.textBaseline='middle';x.font=`${small?'bold 28px Nunito':'bold 46px Cinzel'},serif`;x.fillText(text,256,c.height/2+1,480);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
  function nameplate(w,g,text,x,y,z,width=5,rotation=0,standing=false){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.18),new THREE.MeshBasicMaterial({map:textTexture(text,true)}));m.position.set(x,y,z);m.rotation.y=rotation;g.add(E.Shopfronts.readable(m));
    if(standing){const frame=new THREE.Group();frame.name='district-sign-support';frame.position.set(x,0,z);frame.rotation.y=rotation;g.add(frame);const top=y+width*.09;
      for(const side of[-1,1]){const lx=side*width*.43,px=x+Math.cos(rotation)*lx,pz=z-Math.sin(rotation)*lx,bottom=w.groundAt(px,pz);box(w,frame,'#80684e',lx,(bottom+top)/2,-.07,.12,top-bottom,.14);}
      box(w,frame,'#80684e',0,top-.05,-.07,width+.12,.12,.16);
    }return m;
  }
  function pavingTexture(w){return E.Villages.pavingTexture(w,'#b8b09a');}
  function stoneMaterial(w){return material(w,'#f1eee1',{map:pavingTexture(w),roughness:.96,side:THREE.DoubleSide});}
  function pavement(w,g){
    E.Villages.pave(w,g,{x:0,z:-19,w:154,d:118,rotation:0,edgeFade:8},material(w,'#ded9c9',{map:pavingTexture(w),side:THREE.DoubleSide}),.045,'city-precinct');
    // The historic centre is exactly flat; its visible paving and the hero's
    // support share a height. The quays retain their own physical platforms.
    (w.groundPlatforms||(w.groundPlatforms=[])).push({x:0,z:-7,w:94,d:88,rotation:0,y:.458,cityPaving:true});
  }
  function road(w,g,x,z,sx,sz){w.mapShapes.roads.push([x,z,sx,sz]);}
  function finishRoads(w,g){
    // Partition the union before drawing: crossroads used to have several
    // almost-coplanar boxes, so their surfaces flickered as the camera moved.
    const rects=w.mapShapes.roads.map(([x,z,sx,sz])=>({x,z,w:sx,d:sz})),xs=[...new Set(rects.flatMap(r=>[r.x-r.w/2,r.x+r.w/2]))].sort((a,b)=>a-b),zs=[...new Set(rects.flatMap(r=>[r.z-r.d/2,r.z+r.d/2]))].sort((a,b)=>a-b);
    const fill=Array.from({length:zs.length-1},(_,iz)=>Array.from({length:xs.length-1},(_,ix)=>{const x=(xs[ix]+xs[ix+1])/2,z=(zs[iz]+zs[iz+1])/2;return rects.some(r=>Math.abs(x-r.x)<r.w/2&&Math.abs(z-r.z)<r.d/2);}));
    const mat=stoneMaterial(w),trim=material(w,'#dfc896',{side:THREE.DoubleSide});
    for(let iz=0;iz<zs.length-1;iz++)for(let ix=0;ix<xs.length-1;ix++)if(fill[iz][ix]){
      const x=(xs[ix]+xs[ix+1])/2,z=(zs[iz]+zs[iz+1])/2,sx=xs[ix+1]-xs[ix],sz=zs[iz+1]-zs[iz];
      E.Villages.pave(w,g,{x,z,w:sx,d:sz,rotation:0},mat,.058,'city-street');
      for(const side of[-1,1]){
        if(!fill[iz]?.[ix+side])E.Villages.pave(w,g,{x:x+side*sx/2,z,w:.095,d:sz,rotation:0},trim,.074,'city-street-border');
        if(!fill[iz+side]?.[ix])E.Villages.pave(w,g,{x,z:z+side*sz/2,w:sx,d:.095,rotation:0},trim,.074,'city-street-border');
      }
    }
  }
  function bench(w,g,x,z,rotation=0){const b=new THREE.Group();b.position.set(x,w.height(x,z)+.04,z);b.rotation.y=rotation;g.add(b);box(w,b,'#936f4a',0,.57,0,2.1,.14,.62);box(w,b,'#a67f55',0,.95,-.28,2.1,.7,.10);for(const s of[-1,1])box(w,b,'#48575a',s*.77,.3,0,.13,.57,.55);const ca=Math.cos(rotation),sa=Math.sin(rotation);for(const lx of[-.75,0,.75])w.colliders.push({x:x+ca*lx,z:z-sa*lx,r:.37,city:true});}
  function tree(w,g,x,z,size=1){const y=w.height(x,z);cyl(w,g,'#b2a58a',x,y+.18,z,1.3*size,.36,10);cyl(w,g,'#897456',x,y+1.7*size,z,.17*size,3.3*size,7);for(const [dx,dz,dy,s]of [[0,0,3.7,1.6],[-.7,.2,3.1,1.15],[.7,-.1,3.3,1.2]]){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(s*size,1),material(w,dy>3.5?'#6e987c':'#547e68'));m.position.set(x+dx*size,y+dy*size,z+dz*size);g.add(m);}w.colliders.push({x,z,r:1.32*size,city:true});}
  function planter(w,g,x,z,rotation=0){const p=new THREE.Group();p.position.set(x,w.height(x,z)+.04,z);p.rotation.y=rotation;g.add(p);box(w,p,'#bba78a',0,.22,0,2.0,.44,.62);for(let k=0;k<6;k++){const leaf=new THREE.Mesh(new THREE.OctahedronGeometry(.27,0),material(w,k%2?'#7b9b76':'#94ac7b'));leaf.scale.y=1.25;leaf.position.set((k-2.5)*.3,.56,.02);p.add(leaf);if(k%2){const flower=new THREE.Mesh(new THREE.SphereGeometry(.11,6,4),material(w,k%3?'#ccaaa0':'#d6c18f'));flower.position.set((k-2.5)*.3,.82,.02);p.add(flower);}}const ca=Math.cos(rotation),sa=Math.sin(rotation);for(const lx of[-.6,0,.6])w.colliders.push({x:x+ca*lx,z:z-sa*lx,r:.36,city:true});}
  function marketCart(w,city,x,z,rotation,name,product,colour){
    const g=new THREE.Group();g.position.set(x,w.groundAt(x,z)+.06,z);g.rotation.y=rotation;city.add(g);
    const v={id:'street-'+product,service:'food',name,region:w.id,x,z,y:g.position.y,rotation,w:3.0,d:2.3,group:g,arch:g,palette:E.Shopfronts.palette({roof:colour,accent:'#c8a46d',wood:'#826044'}),fixtures:[],open:true,merchantAt:{x:0,z:-.72}};
    const it=E.Shopfronts.fixture(w,v,{action:'food',product,label:'Comprar '+E.Sim.FOODS[product].name.toLowerCase(),model:'food',icon:'cooking'},0,.30);
    for(const side of[-1,1]){box(w,g,'#876343',side*1.25,1.35,0,.10,2.7,.10);const wheel=new THREE.Mesh(new THREE.TorusGeometry(.31,.065,4,10),material(w,'#564b3e'));wheel.position.set(side*1.3,.30,.22);wheel.rotation.y=Math.PI/2;g.add(wheel);}
    for(let k=0;k<6;k++){const m=box(w,g,k%2?'#efe1bb':colour,(k-2.5)*.49,2.78,0,.50,.08,2.4);m.rotation.x=-.08;box(w,g,k%2?'#efe1bb':colour,(k-2.5)*.49,2.63,1.22,.50,.28,.06);}
    box(w,g,'#9a774e',0,.22,0,2.6,.12,1.5);nameplate(w,g,name,0,2.32,1.29,2.3);
    v.frontAt=E.Shopfronts.point(v,0,2.25);(w.venues||(w.venues=[])).push(v);if(E.ScenePerf)E.ScenePerf.batch(g,{exclude:[it.group],cellSize:30});
  }
  function contactShadows(w){
    const cv=document.createElement('canvas');cv.width=cv.height=64;const c=cv.getContext('2d'),gr=c.createRadialGradient(32,32,4,32,32,31);gr.addColorStop(0,'#17252152');gr.addColorStop(.50,'#17252127');gr.addColorStop(1,'#17252100');c.fillStyle=gr;c.fillRect(0,0,64,64);
    const tex=new THREE.CanvasTexture(cv),geo=new THREE.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false});
    const points=(w.venues||[]).flatMap(v=>(v.fixtures||[]).map(f=>({x:f.x,z:f.z,s:2.1}))).concat([{x:-12,z:-7,s:3.6},{x:12,z:-11,s:3.6},{x:-11,z:15,s:3.8},{x:13,z:15,s:3.6}]);
    const inst=new THREE.InstancedMesh(geo,mat,points.length),m=new THREE.Matrix4();for(let i=0;i<points.length;i++){const p=points[i];m.makeScale(p.s,1,p.s*.68);m.setPosition(p.x,w.groundAt(p.x,p.z)+.07,p.z);inst.setMatrixAt(i,m);}inst.name='market-contact-shadows';inst.renderOrder=1;w.scene.add(inst);
  }
  function lamp(w,g,x,z){const y=w.height(x,z);cyl(w,g,'#526063',x,y+1.6,z,.065,3.2,6);box(w,g,'#526063',x,y+3.04,z,.45,.08,.45);const light=new THREE.Mesh(new THREE.BoxGeometry(.26,.38,.26),material(w,'#e6cd95',{emissive:'#d7b875',emissiveIntensity:.5}));light.position.set(x,y+3.3,z);g.add(light);box(w,g,'#526063',x,y+3.52,z,.37,.08,.37);w.colliders.push({x,z,r:.20,city:true});}
  function windowMaterial(w,warm=false){
    const key=warm?'warm':'blue';w._metroWindows=w._metroWindows||{};if(w._metroWindows[key])return w._metroWindows[key];
    const cv=document.createElement('canvas');cv.width=64;cv.height=96;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    c.fillStyle='#594b3d';c.fillRect(0,0,64,96);c.fillStyle='#d0b98d';c.fillRect(3,3,58,90);c.fillStyle=warm?'#bca569':'#526e7a';c.fillRect(8,8,48,77);
    c.fillStyle=warm?'#efcf86':'#9db8bc';c.fillRect(12,11,18,31);c.fillRect(34,11,18,31);c.fillStyle=warm?'#cfa75e':'#6e949e';c.fillRect(12,47,18,32);c.fillRect(34,47,18,32);
    c.fillStyle='#d8c496';c.fillRect(29,7,6,78);c.fillRect(8,41,48,6);c.fillStyle='#f1deac';c.fillRect(5,3,54,3);c.fillRect(3,5,3,84);c.fillStyle='#8c7758';c.fillRect(5,87,54,5);
    const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;map.magFilter=THREE.NearestFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
    return w._metroWindows[key]=material(w,'#ffffff',{map,roughness:.86,side:THREE.FrontSide});
  }
  function windowPane(w,g,x,y,z,width=1.0,height=1.5,rotation=0,warm=false){const m=new THREE.Mesh(new THREE.PlaneGeometry(width,height),windowMaterial(w,warm));m.position.set(x,y,z);m.rotation.y=rotation;g.add(m);return m;}
  function freePlot(w,x,z,width,depth,rotation){
    const c=Math.cos(rotation),s=Math.sin(rotation),important=(w.chestPos||[]).concat(w.herbPos||[]);
    return !important.some(p=>{const dx=p.x-x,dz=p.z-z;return Math.abs(c*dx-s*dz)<width/2+1.8&&Math.abs(s*dx+c*dz)<depth/2+1.8;});
  }
  function house(w,g,x,z,width,depth,height,roof,rotation,style='residential'){
    if(!freePlot(w,x,z,width,depth,rotation))return null;
    const h=new THREE.Group(),ca=Math.cos(rotation),sa=Math.sin(rotation),heights=[];
    for(const lx of[-width/2,0,width/2])for(const lz of[-depth/2,0,depth/2])heights.push(w.terrainAt?w.terrainAt(x+ca*lx+sa*lz,z-sa*lx+ca*lz):w.height(x+ca*lx+sa*lz,z-sa*lx+ca*lz));
    const y=Math.max(...heights)+.02,low=Math.min(...heights),foundationHeight=Math.max(.16,y-low+.16),floors=Math.max(2,Math.floor(height/2.8));h.name='urban-'+style;h.position.set(x,y,z);h.rotation.y=rotation;g.add(h);
    box(w,h,'#b7aa8e',0,-foundationHeight/2,0,width+.12,foundationHeight,depth+.12);
    const facade=box(w,h,style==='financial'?'#d6d3c6':style==='warehouse'?'#a88d70':'#dbd4c2',0,height/2,0,width,height,depth);w.camBlockers.push(facade);
    for(const side of[-1,1])box(w,h,'#a69072',side*(width/2-.15),height/2,depth/2+.06,.28,height,.14);
    box(w,h,'#887156',0,.34,depth/2+.07,width,.68,.16);box(w,h,'#c7b99b',0,2.9,depth/2+.12,width+.30,.19,.30);
    for(let floor=0;floor<floors;floor++){
      const wy=1.65+floor*2.8;
      if(floor>0){box(w,h,'#bba98a',0,wy-1.23,depth/2+.11,width+.22,.15,.25);for(const side of[-1,1])box(w,h,'#bba98a',side*(width/2+.04),wy-1.23,0,.18,.15,depth);}
      for(let k=0;k<3;k++){const wx=(k-1)*width*.29;if(floor===0&&k===1)continue;windowPane(w,h,wx,wy,depth/2+.16,Math.min(1.25,width*.18),1.70,0,(floor+k+Math.round(x))%5===0);}
      for(const side of[-1,1])for(const lz of[-depth*.26,depth*.26])windowPane(w,h,side*(width/2+.035),wy,lz,1.10,1.70,side*Math.PI/2,(floor+Math.round(z))%5===0);
      if(floor>0&&floor%2===0&&E.state.settings.quality!=='baixo'){
        box(w,h,'#a8916d',0,wy-.94,depth/2+.42,width*.72,.14,.75);box(w,h,'#596566',0,wy-.54,depth/2+.77,width*.72,.07,.07);
        for(const side of[-1,1])box(w,h,'#596566',side*width*.34,wy-.73,depth/2+.64,.055,.45,.42);
      }
    }
    box(w,h,'#654f3c',0,1.1,depth/2+.12,1.25,2.2,.17);box(w,h,'#c9ae76',.33,1.03,depth/2+.23,.09,.15,.08);
    box(w,h,'#e4d6b8',0,height+.04,0,width+.50,.28,depth+.45);
    const r=new THREE.Mesh(new THREE.ConeGeometry((width+.6)/Math.SQRT2,2.4,4).rotateY(Math.PI/4),material(w,roof));r.scale.z=(depth+.6)/(width+.6);r.position.y=height+1.34;h.add(r);
    for(const side of[-1,1]){box(w,h,'#b49b77',side*width*.29,height+1.4,-depth*.15,.65,2.5,.62);box(w,h,'#d8c6a4',side*width*.29,height+2.66,-depth*.15,.81,.14,.78);}
    for(let lx=-width/2+.45;lx<=width/2-.2;lx+=1)for(let lz=-depth/2+.45;lz<=depth/2-.2;lz+=1)w.colliders.push({x:x+ca*lx+sa*lz,z:z-sa*lx+ca*lz,r:.63,city:true});
    w.mapShapes.blocks.push({x,z,w:Math.abs(ca)*width+Math.abs(sa)*depth,d:Math.abs(ca)*depth+Math.abs(sa)*width,c:roof,height,floors});
    w.metroArchitecture.buildings++;w.metroArchitecture.floors+=floors;w.metroArchitecture.maxHeight=Math.max(w.metroArchitecture.maxHeight,height+2.7);
    return h;
  }
  // The outer quarters meet the countryside through gardens, not a cut wall: loose rows of
  // trees and shrubs behind the perimeter buildings, leaving roads and the north gate open.
  function greenBelt(w,g){
    const rng=U.seeded(1331*7+5),spots=[];
    for(const side of[-1,1])for(let z=-58;z<=30;z+=5.5)spots.push([side*(74.5+rng()*3.5),z+rng()*2.4]);
    for(let x=-72;x<=72;x+=5.5)if(Math.abs(x)>15)spots.push([x+rng()*2.4,-81-rng()*3.5]);
    for(const [x,z]of spots){
      if(w.roadDist&&w.roadDist(x,z)<4.5)continue;
      if(rng()<.55)tree(w,g,x,z,.62+rng()*.3);
      else{const y=w.height(x,z);for(let k=0;k<3;k++){const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.55+rng()*.35,0),material(w,k%2?'#6f9273':'#86a477'));m.position.set(x+(k-1)*.75,y+.38,z+(rng()-.5)*.6);m.scale.y=.8;g.add(m);}w.colliders.push({x,z,r:1.1,city:true});}
    }
  }
  function clockTower(w,g,x,z){
    const h=house(w,g,x,z,6.6,6.6,19,'#526b78',0,'financial');if(!h)return;
    box(w,h,'#d5c4a0',0,20.0,0,7.6,.48,7.6);cyl(w,h,'#c9b081',0,22.1,0,2.8,3.9,8);const spire=new THREE.Mesh(new THREE.ConeGeometry(3.2,5.8,8),material(w,'#627783'));spire.position.y=26.5;h.add(spire);cyl(w,h,'#d0aa64',0,29.7,0,.075,1.4,6);
    const cv=document.createElement('canvas');cv.width=cv.height=128;const c=cv.getContext('2d');c.fillStyle='#303f43';c.fillRect(0,0,128,128);c.fillStyle='#e4d1a2';c.beginPath();c.arc(64,64,59,0,TAU);c.fill();c.strokeStyle='#8a704d';c.lineWidth=4;c.beginPath();c.arc(64,64,51,0,TAU);c.stroke();c.fillStyle='#4f554b';for(let k=0;k<12;k++){const a=k/12*TAU;c.fillRect(62+Math.sin(a)*43,62-Math.cos(a)*43,4,4);}const map=new THREE.CanvasTexture(cv);map.colorSpace=THREE.SRGBColorSpace;map.magFilter=THREE.NearestFilter;
    for(let side=0;side<4;side++){const a=side*Math.PI/2,m=new THREE.Mesh(new THREE.PlaneGeometry(2.50,2.50),new THREE.MeshBasicMaterial({map}));m.position.set(Math.sin(a)*3.36,17.4,Math.cos(a)*3.36);m.rotation.y=a;h.add(m);}
    const hands=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material(w,'#35474b'),8);hands.name='city-clock-hands';hands.frustumCulled=false;w.scene.add(hands);w.metroClock={hands,x,z,y:h.position.y+17.4,last:-1};
    nameplate(w,h,'TORRE DO CONSELHO',0,3.40,3.42,5.8);w.metroArchitecture.maxHeight=30.4;
  }
  function clearUrbanProps(w){
    const inside=(x,z)=>Math.abs(x)<76&&z>-77&&z<39;
    const removed=[];for(const [type,list]of Object.entries(w.propGroups||{}))w.propGroups[type]=list.filter(p=>{if(inside(p.x,p.z)){removed.push(p);return false;}return true;});
    w.colliders=w.colliders.filter(c=>!removed.some(p=>Math.hypot(c.x-p.x,c.z-p.z)<.11));const matrix=new THREE.Matrix4();
    for(const o of w.scene.children)if(o.isInstancedMesh){let count=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);if(inside(matrix.elements[12],matrix.elements[14]))continue;if(count!==i)o.setMatrixAt(count,matrix);count++;}if(count!==o.count){o.count=count;o.instanceMatrix.needsUpdate=true;if(count)o.computeBoundingSphere();else o.visible=false;}}
    for(const o of [...w.scene.children])if(o.isSprite&&o.material&&o.material.blending===THREE.AdditiveBlending&&removed.some(p=>Math.hypot(o.position.x-p.x,o.position.z-p.z)<1.3)){w.scene.remove(o);if(w.retire)w.retire(o);}
  }
  function skyline(w,g){
    const roofs=['#876d5d','#697e85','#aa7860','#7b8075','#a18e78'];
    // Four/five-storey quarters frame streets with an unmistakably urban skyline.
    for(const side of[-1,1])for(let i=0;i<5;i++){const z=-38+i*15.5;house(w,g,side*49,z,8.7,8.0,10.5+(i%3)*2.8,roofs[(i+(side+1))%5],-side*Math.PI/2);}
    for(const side of[-1,1])for(let i=0;i<5;i++){const z=-40+i*15;house(w,g,side*67,z,8.8,9.5,11.8+(i%2)*2.8,roofs[(i+2)%5],-side*Math.PI/2);}
    for(let i=0;i<7;i++){const x=-57+i*19;house(w,g,x,-65,10.5,8.3,11.5+(i%3)*2.5,roofs[i%5],0,i%2?'financial':'residential');}
    house(w,g,-10,-46,9.0,8.0,12.0,'#65858a',0,'financial');
    const bank=house(w,g,16,-46,12.4,8.5,14.6,'#617486',0,'financial');if(bank)nameplate(w,bank,'CÂMARA DO COMÉRCIO',0,3.55,4.38,10);
    clockTower(w,g,36,-46);
    // High northern gate: the avenue visibly continues into the city beyond the square.
    for(const side of[-1,1]){
      for(let i=0;i<10;i++){const x=side*(12+i*6.2),y=w.height(x,-76);box(w,g,'#b9ac90',x,y+2,-76,6.3,4,1.4);box(w,g,'#d6c7a8',x,y+4.05,-76,6.4,.20,1.58);}lineColliders(w,{x:side<0?-72:9,z:-76},{x:side<0?-9:72,z:-76},.75);
      const tower=house(w,g,side*8.2,-75.5,5.4,5.5,13,'#64798a',0,'financial');if(tower)for(const s of[-1,1])box(w,tower,'#b8a787',s*1.8,15.2,0,.60,.90,5.7);
    }
    nameplate(w,g,'AURENNA · METRÓPOLE DOURADA',0,8.1,-74.90,15.2);
  }
  function upperGallery(w,city,v){
    if(!v.open||['arena','pier','player-casino'].includes(v.service))return;
    const h=new THREE.Group();h.name='urban-upper-gallery';h.position.set(v.x,v.y,v.z);h.rotation.y=v.rotation;city.add(h);const depth=2.6,z=-v.d/2+depth/2,base=v.h+.30,height=5.8;
    box(w,h,'#c2ae88',0,base-.14,z,v.w+.12,.28,depth+.12);
    const body=box(w,h,'#dfd7c2',0,base+height/2,z,v.w-.1,height,depth);w.camBlockers.push(body);
    for(let floor=0;floor<2;floor++){const y=base+1.45+floor*2.8;box(w,h,'#c2ae88',0,y-1.3,z+depth/2+.07,v.w+.24,.19,.21);for(let k=-1;k<=1;k++)windowPane(w,h,k*v.w*.29,y,z+depth/2+.12,1.15,1.65,0,(k+floor+v.w)%3===0);}
    box(w,h,'#bca67e',0,base+height+.10,z,v.w+.50,.30,depth+.40);const roof=box(w,h,v.palette.roof,0,base+height+.37,z,v.w+.68,.30,depth+.62);roof.rotation.x=-.05;
    for(const side of[-1,1]){const lx=side*(v.w/2-.45);cyl(w,h,'#d3c2a0',lx,base/2,z,.19,base,8);const p=E.Shopfronts.point(v,lx,z);w.colliders.push({...p,r:.24,city:true});}
    w.metroArchitecture.galleries++;w.metroArchitecture.maxHeight=Math.max(w.metroArchitecture.maxHeight,base+height+.6);
  }
  function embellish(w,city,v){
    const b=MT.BUILDINGS.find(b=>b.id===v.id);if(!b||!v.open)return;
    const g=new THREE.Group();g.name='district-detail-'+v.id;g.position.set(v.x,v.y,v.z);g.rotation.y=v.rotation;city.add(g);const hd=v.d/2;
    if(v.service==='casino'||v.service==='player-casino'){
      box(w,g,'#d6bf82',0,3.62,-hd+.5,v.w+.3,.30,1.05);
      for(const x of[-3.8,0,3.8]){const fan=new THREE.Mesh(new THREE.CircleGeometry(.74,12,0,Math.PI),material(w,'#d1ad64',{side:THREE.DoubleSide}));fan.position.set(x,4.0,-hd+.99);g.add(fan);}
      const coin=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,.14,16),material(w,'#d8b56d',{metalness:.35,roughness:.48}));coin.rotation.x=Math.PI/2;coin.position.set(0,4.78,-hd+.5);g.add(coin);w.metroCoin=coin;
    }else if(v.service==='guild'){
      box(w,g,'#b8b5a4',-v.w/2+1.1,4.8,-hd+.8,2.3,3.2,2.0);const roof=new THREE.Mesh(new THREE.ConeGeometry(1.9,2.0,4),material(w,'#5d7892'));roof.rotation.y=Math.PI/4;roof.position.set(-v.w/2+1.1,7.35,-hd+.8);g.add(roof);
      const shield=new THREE.Mesh(new THREE.CircleGeometry(.59,5),material(w,'#d2be89'));shield.position.set(-v.w/2+1.1,5.15,-hd+1.83);g.add(shield);
    }else if(v.service==='market'){
      for(const x of[-v.w/2+.7,v.w/2-.7])cyl(w,g,'#e9e0cc',x,1.82,hd,.23,3.64,8);
      box(w,g,'#d0c2a3',0,3.85,-hd+.5,v.w+.5,.28,1.0);
    }else if(v.service==='arena'){
      // A supported arena gateway replaces only this venue's awning; the city footprint stays intact.
      if(v.awning)v.awning.visible=false;
      for(let k=0;k<3;k++){const width=v.w-1.8+k*.15,z=-hd+.48+k*.50;box(w,g,'#c4b08d',0,.35+k*.42,z,width,.65,.52);}
      for(const side of[-1,1]){
        const px=side*3.0;box(w,g,'#ad9576',px,2.5,hd+.12,.78,5,1.05);box(w,g,'#d7c6a3',px,4.95,hd+.12,1.08,.28,1.28);
        const pt=E.Shopfronts.point(v,px,hd+.12);w.colliders.push({...pt,r:.49,city:true,venue:v.id});
        box(w,g,'#a75c4d',side*5.0,3.35,hd+.17,1.15,2.8,.08);box(w,g,'#d4b87e',side*5.0,4.82,hd+.25,1.45,.16,.19);
        cyl(w,g,'#bba276',side*5.0,3.2,hd,.07,3.5,6);
      }
      box(w,g,'#d2bd95',0,5.1,hd+.12,7.25,.5,1.18);box(w,g,'#a58a65',0,5.48,hd+.12,7.7,.22,1.32);
      const arch=new THREE.Mesh(new THREE.TorusGeometry(2.52,.21,5,18,Math.PI),material(w,'#c8b18b'));arch.position.set(0,2.7,hd+.69);g.add(arch);
      // Hinged gates animate open when the visitor enters the Coliseum.
      w.coliseumGate={panels:[],open:0,target:0};
      for(const side of[-1,1]){const gate=new THREE.Group();gate.userData.noStaticBatch=true;gate.userData.side=side;gate.position.set(side*2.5,0,hd+.26);g.add(gate);for(let k=0;k<7;k++)box(w,gate,'#655c4c',-side*(k*.35+.1),1.34,0,.075,2.56,.075);for(const yy of[.35,1.35,2.48])box(w,gate,'#8b7958',-side*1.18,yy,0,2.46,.11,.12);w.coliseumGate.panels.push(gate);}
      for(let x=-2.1;x<=2.11;x+=.6){const pt=E.Shopfronts.point(v,x,hd+.26);w.colliders.push({...pt,r:.41,city:true,venue:v.id,arenaGateBarrier:true});}
      if(v.signMesh){v.signMesh.position.set(0,5.12,hd+.78);v.signMesh.scale.set(1.35,.92,1);}
    }else if(v.service==='alchemy'){
      for(const x of[-2.2,2.2]){const orb=new THREE.Mesh(new THREE.OctahedronGeometry(.40,0),material(w,x<0?'#9badb6':'#bf9eaa'));orb.position.set(x,3.75,-hd+.4);g.add(orb);}
    }
  }
  function fountain(w,g){
    const x=-5,z=-12,y=w.height(x,z);w.mapShapes.fountain={x,z,r:3.1};
    cyl(w,g,'#c7baa0',x,y+.14,z,3.65,.28,24);cyl(w,g,'#ede2c8',x,y+.46,z,3.14,.65,24);const water=E.Water.make({...w.B,water:'#529b9d'},6,y+.8,{size:7,terrainAt:()=>y+.15});water.geometry.dispose();water.geometry=new THREE.CircleGeometry(2.88,32);water.position.set(x,y+.80,z);g.add(water);w.metroBasin=water;cyl(w,g,'#b7aa8d',x,y+1.23,z,.46,1.2,10,.32);cyl(w,g,'#eadabe',x,y+1.90,z,1.35,.15,16);cyl(w,g,'#bca578',x,y+2.43,z,.15,1.0,8);
    const statue=new THREE.Mesh(new THREE.OctahedronGeometry(.44,0),material(w,'#c7a467',{metalness:.5,roughness:.4}));statue.scale.y=1.55;statue.position.set(x,y+3.02,z);g.add(statue);w.metroFountain=statue;
    const jets=[];for(let i=0;i<6;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,5,3),new THREE.MeshBasicMaterial({color:'#d5eddf',transparent:true,opacity:.8,depthWrite:false}));g.add(m);jets.push({m,a:i/6*TAU,ph:i/6});}w.metroJets={jets,fx:x,fy:y,fz:z};w.colliders.push({x,z,r:3.22,city:true});
  }
  function quay(w,g){
    const y=.45;box(w,g,'#a2825a',0,y-.18,39,56,.36,6);box(w,g,'#c0a67e',0,y-.005,39,56,.05,6);
    for(let x=-27;x<28;x+=1.2)box(w,g,'#7f6648',x,y+.025,39,.025,.012,6);
    (w.groundPlatforms||(w.groundPlatforms=[])).push({x:0,z:39,w:56,d:6,rotation:0,y:y+.028});
    for(let x=-27;x<=27;x+=4)for(const z of[37,41])cyl(w,g,'#756047',x,-.2,z,.13,1.5,6);
    box(w,g,'#98724b',-4,y-.10,49,3.5,.25,19);for(let z=40;z<59;z+=.8)box(w,g,'#b7976a',-4,y+.045,z,3.5,.045,.73);
    w.groundPlatforms.push({x:-4,z:49,w:3.5,d:19,rotation:0,y:y+.068});
    for(const x of[-5.9,-2.1])for(const z of[43,48,53,58]){cyl(w,g,'#806241',x,-.35,z,.13,2.1,6);w.colliders.push({x,z,r:.18,city:true});}
    for(const [x,z,r]of[[16,51,.3],[-21,54,-.22]]){
      const boat=new THREE.Group();boat.name='harbour-sailboat';const hull=new THREE.Mesh(new THREE.CylinderGeometry(1.05,.72,4.5,8,1,false),material(w,'#6b6054'));hull.rotation.x=Math.PI/2;hull.rotation.z=Math.PI/8;boat.add(hull);box(w,boat,'#b3a17f',0,.47,0,1.3,.13,3.6);cyl(w,boat,'#786347',0,2.2,0,.055,4.4,6);const sail=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.6),material(w,'#ece4ce',{side:THREE.DoubleSide}));sail.position.set(1.0,2.7,0);boat.add(sail);boat.position.set(x,w.waterLevel+.25,z);boat.rotation.y=r;g.add(boat);(w.metroBoats||(w.metroBoats=[])).push(boat);if(E.ScenePerf)E.ScenePerf.batch(boat);
    }
    // The physical pier and fishing target share the same stable saved depletion key.
    const s={x:-4,z:55,wx:-4,wz:59,i:90,left:6,rings:[]},dep=(E.state.world.fishDep||{})[w.id+':90'];if(dep&&Date.now()-dep<4*60e3)s.left=0;
    for(let k=0;k<2;k++){const m=new THREE.Mesh(new THREE.RingGeometry(.45,.49,20),new THREE.MeshBasicMaterial({color:'#e4eee3',transparent:true,opacity:.5,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(s.wx,w.waterLevel+.035+k*.002,s.wz);w.scene.add(m);s.rings.push(m);}
    s.ia={kind:'fish',spot:s,x:s.x,z:s.z,r:2.6,label:'Pescar na ponta do cais',icon:E.Icons.html('fish',{decorative:true})};w.interactables.push(s.ia);(w.fishSpots||(w.fishSpots=[])).push(s);
  }
  MT.build=w=>{
    const city=new THREE.Group();city.name='aurenna-city';w.scene.add(city);w.camBlockers=[];w.metroArchitecture={buildings:0,floors:0,galleries:0,maxHeight:0};clearUrbanProps(w);if(w.scene.fog){w.scene.fog.near=70;w.scene.fog.far=220;}
    w.mapShapes={roads:[],blocks:[],fountain:null};w.metroDoors=[];w.metroVenues=[];
    pavement(w,city);
    road(w,city,0,-19,8.2,125);road(w,city,0,0,111,5.4);road(w,city,0,-16,75,5.2);road(w,city,0,18,72,5.0);road(w,city,-16,1,4.2,38);road(w,city,16,1,4.2,38);road(w,city,0,23,56,4.0);road(w,city,0,-35.5,143,5.8);road(w,city,-58,-12,5.0,107);road(w,city,58,-12,5.0,107);road(w,city,-38,-54,40,5.2);road(w,city,34,-54,52,5.2);finishRoads(w,city);
    const plaza=new THREE.Mesh(new THREE.CircleGeometry(16.6,48),stoneMaterial(w)),pp=plaza.geometry.attributes.position,pu=plaza.geometry.attributes.uv;for(let i=0;i<pu.count;i++)pu.setXY(i,pp.getX(i)/2.8,-pp.getY(i)/2.8);pu.needsUpdate=true;plaza.rotation.x=-Math.PI/2;plaza.position.set(0,.475,1);city.add(plaza);w.groundPlatforms.push({x:0,z:1,r:16.6,y:.475,cityPaving:true});
    const inlay=new THREE.Mesh(new THREE.RingGeometry(11.6,11.75,48),material(w,'#b9a682'));inlay.rotation.x=-Math.PI/2;inlay.position.set(0,.481,1);city.add(inlay);
    skyline(w,city);greenBelt(w,city);
    for(const b of MT.BUILDINGS){
      const opts={...b,palette:{wall:b.color,roof:b.roofC,wood:'#80684e',accent:b.accent,stone:'#b4aa91'}};
      const closed=b.service==='inn'||b.service==='home';const v=closed?E.Shopfronts.closed(w,opts):E.Shopfronts.add(w,opts);w.metroVenues.push(v);
      const rear=v.arch.children.find(o=>o.isMesh&&o.geometry&&o.geometry.parameters&&Math.abs(o.geometry.parameters.width-v.w)<.01&&o.geometry.parameters.height>2.5&&(o.geometry.parameters.depth<.3||Math.abs(o.geometry.parameters.depth-v.d)<.01));if(rear)w.camBlockers.push(rear);
      const p=v.frontAt;w.metroDoors.push({x:p.x,z:p.z,icon:E.Icons.html(b.icon,{decorative:true}),name:b.name,service:b.service,venueId:v.id});
      const turn=Math.abs(Math.sin(v.rotation))>.5;w.mapShapes.blocks.push({x:v.x,z:v.z,w:turn?v.d:v.w,d:turn?v.w:v.d,c:b.roofC,special:true,round:false});embellish(w,city,v);upperGallery(w,city,v);
    }
    fountain(w,city);
    for(const [x,z,s]of[[-12,-7,.8],[12,-11,.78],[-11,15,.8],[13,15,.75],[-36,-29,.9],[38,29,.85]])tree(w,city,x,z,s);
    for(const [x,z,r]of[[-11,3,Math.PI/2],[12,5,-Math.PI/2],[-10,19,0],[10,20,Math.PI]])bench(w,city,x,z,r);
    for(const [x,z,r]of[[-17,-13,Math.PI/2],[17,-12,Math.PI/2],[-17,15,Math.PI/2],[18,16,Math.PI/2],[-10,24,0],[14,23,0]])planter(w,city,x,z,r);
    marketCart(w,city,-12,-1,Math.PI/2,'Pães da Aurora','pao','#a76352');marketCart(w,city,12,0,-Math.PI/2,'Pomar da Praça','fruta','#648f79');
    for(const [x,z,r]of[[-7,5,0],[7,8,Math.PI/2]])planter(w,city,x,z,r);
    for(const [x,z]of[[-5,-35],[5,-35],[-5,33],[5,33],[-18,-17],[18,-17],[-18,19],[18,19],[-39,-3],[40,3]])lamp(w,city,x,z);
    // Small outdoor tables extend the tavern into its street terrace.
    for(const z of[5,12]){const y=w.height(-19,z);cyl(w,city,'#9d7c54',-19,y+.95,z,.68,.11,10);cyl(w,city,'#80674b',-19,y+.48,z,.09,.9,6);w.colliders.push({x:-19,z,r:.70,city:true});}
    nameplate(w,city,'PRAÇA DOS ENCONTROS',0,3.5,-17.8,6.3,0,true);nameplate(w,city,'AVENIDA DOS MERCADORES',-41,3.8,-35.5,8.5,0,true);nameplate(w,city,'DISTRITO FINANCEIRO',17,5.8,-37.2,9.0,0,true);nameplate(w,city,'BAIRRO DO PORTO',-4,3.0,34,5.0,Math.PI,true);
    quay(w,city);
    contactShadows(w);
    // Routes follow wide, continuous paving; local crowd avoidance handles people and planters.
    w.crowdRoutes=[
      [{x:-9,z:-4,pause:true},{x:9,z:-4},{x:9,z:12,pause:true},{x:-9,z:12}],
      [{x:-15,z:-16},{x:16,z:-16,pause:true},{x:16,z:18},{x:-15,z:18,pause:true}],
      [{x:-2,z:21},{x:3,z:21,pause:true},{x:3,z:35},{x:-2,z:35,pause:true}],
      [{x:-35,z:-16},{x:-35,z:0,pause:true},{x:-15,z:0},{x:-15,z:-16}],
      [{x:-35,z:-35.5,pause:true},{x:0,z:-35.5},{x:40,z:-35.5,pause:true},{x:58,z:-35.5},{x:58,z:0},{x:37,z:0}],
      [{x:-58,z:-35.5},{x:-58,z:18,pause:true},{x:-36,z:18},{x:-36,z:-16},{x:-35,z:-35.5}],
      [{x:0,z:-35.5},{x:0,z:-69,pause:true},{x:-3,z:-69},{x:-3,z:-35.5}],
    ];
    w.metroDistricts=[{id:'praca',name:'Praça dos Encontros',x:0,z:1},{id:'galerias',name:'Galerias do Norte',x:0,z:-25},{id:'porto',name:'Bairro do Porto',x:-4,z:35},{id:'financeiro',name:'Distrito Financeiro',x:17,z:-43},{id:'residencial',name:'Quarteirões das Lanternas',x:-58,z:-10}];
    if(E.ScenePerf)w.metroBatch=E.ScenePerf.batch(city,{cellSize:34,exclude:[w.metroFountain,w.metroCoin,...(w.metroBoats||[]),...(w.metroJets?w.metroJets.jets.map(j=>j.m):[])]});
  };
  MT.update=(w,t,dt)=>{
    if(w.coliseumGate){const g=w.coliseumGate;g.open=U.lerp(g.open,g.target,Math.min(1,(dt||0)*12));for(const p of g.panels)p.rotation.y=p.userData.side*g.open*1.15;}
    if(w.metroClock){const c=w.metroClock,clock=E.Sim?E.Sim.clock():{hour:8,minute:0},minute=clock.hour*60+clock.minute;if(c.last!==minute){c.last=minute;const face=new THREE.Matrix4(),rotate=new THREE.Matrix4(),shift=new THREE.Matrix4(),scale=new THREE.Matrix4(),matrix=new THREE.Matrix4();for(let side=0;side<4;side++){const a=side*Math.PI/2;face.makeRotationY(a);face.setPosition(c.x+Math.sin(a)*3.43,c.y,c.z+Math.cos(a)*3.43);for(let hand=0;hand<2;hand++){const length=hand?1.03:.72,angle=hand?clock.minute/60*TAU:(clock.hour%12+clock.minute/60)/12*TAU;rotate.makeRotationZ(-angle);shift.makeTranslation(0,length*.45,0);scale.makeScale(hand ? .045 : .07,length,.035);matrix.copy(face).multiply(rotate).multiply(shift).multiply(scale);c.hands.setMatrixAt(side*2+hand,matrix);}}c.hands.instanceMatrix.needsUpdate=true;}}
    if(w.metroBasin){w.metroBasin.material.uniforms.t.value=t;E.Water.setNight(w.metroBasin,w.cycle?w.cycle.lastNight?1:0:0);}
    if(w.metroJets){const {jets,fx,fy,fz}=w.metroJets;for(const j of jets){const k=(t*.75+j.ph)%1;j.m.position.set(fx+Math.cos(j.a)*k*2.4,fy+2.35+Math.sin(k*Math.PI)*.9-k*1.65,fz+Math.sin(j.a)*k*2.4);}}
    if(w.metroCoin)w.metroCoin.rotation.z=Math.sin(t*.6)*.08;
    for(const [i,b]of(w.metroBoats||[]).entries()){b.position.y=w.waterLevel+.25+Math.sin(t*1.1+i)*.08;b.rotation.z=Math.sin(t*.8+i)*.025;}
  };
  E.Metro=MT;
})();
