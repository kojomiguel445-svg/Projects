/* Fishing skiffs and their little harbours. Geometry is authored once; only
   transforms move while sailing. Boat physics and rental ownership live in Maritime. */
(() => {
  'use strict';
  const G={};
  function material(s,color,extra={}){
    const key=color+JSON.stringify(extra);if(!s.materials.has(key))s.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.88,flatShading:true,...extra}));
    return s.materials.get(key);
  }
  function box(s,parent,color,x,y,z,w,h,d,extra){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(s,color,extra));m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
  function pole(s,parent,color,x,y,z,r,h){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,6),material(s,color));m.position.set(x,y,z);parent.add(m);return m;}
  function hull(s,parent){
    const sections=[[-2.12,0],[-1.68,.69],[-.75,.92],[.65,.91],[1.56,.59],[2.22,0]],positions=[],colors=[];
    const shades=['#684c3c','#94704a','#477776','#6e9590'].map(c=>new THREE.Color(c));
    const tri=(a,b,c,tint)=>{for(const p of[a,b,c]){positions.push(...p);colors.push(tint.r,tint.g,tint.b);}};
    for(let i=0;i<sections.length-1;i++){
      const [z,a]=sections[i],[zz,b]=sections[i+1];
      for(const sign of[-1,1]){
        const A=[sign*a*.57,-.24,z],B=[sign*b*.57,-.24,zz],C=[sign*b,.35,zz],D=[sign*a,.35,z];
        tri(A,B,C,shades[i%2?2:3]);tri(A,C,D,shades[i%2?2:3]);
        const E=[sign*a*.84,.32,z],F=[sign*b*.84,.32,zz];tri(D,C,F,shades[1]);tri(D,F,E,shades[1]);
      }
      tri([-a*.57,-.24,z],[b*.57,-.24,zz],[-b*.57,-.24,zz],shades[0]);tri([-a*.57,-.24,z],[a*.57,-.24,z],[b*.57,-.24,zz],shades[0]);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9,flatShading:true,side:THREE.DoubleSide});s.extraMaterials.add(mat);parent.add(new THREE.Mesh(geo,mat));
  }
  function boat(s){
    const root=new THREE.Group(),body=new THREE.Group();root.name='rented-fishing-skiff';root.add(body);hull(s,body);
    // Deck boards, gunwales and cross-benches make the hull readable from above.
    for(let i=-3;i<=3;i++)box(s,body,i%2?'#ae8858':'#bc9865',i*.19,.035,-.03,.17,.08,2.82);
    for(const z of[-1.0,1.0])box(s,body,'#cfad77',0,.35,z,1.48,.12,.33);
    for(const side of[-1,1]){
      const rail=box(s,body,'#dec18c',side*.85,.38,-.06,.10,.10,2.67);rail.rotation.y=side*.015;
      const end=box(s,body,'#d2b77f',side*.49,.38,1.68,.10,.10,1.05);end.rotation.y=-side*.57;
      const stern=box(s,body,'#c5a774',side*.49,.38,-1.72,.10,.10,.87);stern.rotation.y=side*.65;
    }
    box(s,body,'#b58d53',0,.36,1.82,.44,.1,.44).rotation.y=Math.PI/4;
    box(s,body,'#7e9b94',.36,.54,-1.04,.53,.34,.40);box(s,body,'#d9cb9e',.36,.73,-1.04,.56,.05,.44);
    // A small basket, coiled line and stowed rod identify a working fishing boat.
    const basket=pole(s,body,'#b28b54',-.38,.48,-1.15,.23,.29);basket.scale.z=.8;
    for(let n=0;n<3;n++){const rope=new THREE.Mesh(new THREE.TorusGeometry(.17+n*.045,.025,3,12),material(s,'#c9b786'));rope.rotation.x=Math.PI/2;rope.position.set(-.35,.33,.8);body.add(rope);}
    const rod=box(s,body,'#5c4b3b',-.45,.50,-.65,.035,.035,2.6);rod.rotation.y=-.18;
    // Low furled sail and a tiny pennant keep the hero's silhouette unobstructed.
    pole(s,body,'#886544',0,.96,-1.53,.047,1.65);box(s,body,'#eee0bb',.15,1.39,-1.53,.30,.69,.09);
    const flag=new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,1.78,-1.53,.53,1.65,-1.53,0,1.51,-1.53],3)),material(s,'#4e8582',{side:THREE.DoubleSide}));flag.geometry.computeVertexNormals();body.add(flag);
    s.oars=[];
    for(const side of[-1,1]){
      const oar=new THREE.Group();oar.position.set(side*.77,.35,-.13);oar.rotation.y=side*.45;root.add(oar);
      box(s,oar,'#b68e57',side*.63,0,0,1.55,.055,.07);box(s,oar,'#6a8e86',side*1.36,-.015,0,.55,.07,.22);s.oars.push(oar);
    }
    if(E.ScenePerf){E.ScenePerf.batch(body,{cellSize:80});for(const oar of s.oars)E.ScenePerf.batch(oar,{cellSize:80});}
    return root;
  }
  function marker(s,dock){
    pole(s,dock,'#74573e',-1.50,1.10,-.12,.065,2.20);
    const board=new THREE.Group();board.position.set(-1.50,1.67,-.12);dock.add(board);
    box(s,board,'#d0af71',0,0,0,1.22,.64,.10);box(s,board,'#284b51',0,0,.061,1.10,.52,.025);
    // The pictogram is built from clean pixel-sized bars, with no external font.
    for(const [x,y,w,h]of [[-.30,-.10,.60,.08],[-.21,-.18,.42,.08],[0,.08,.07,.35],[.16,.10,.26,.08]])box(s,board,'#e8d4a1',x,y,.082,w,h,.025);
    return board;
  }
  G.build=w=>{
    if(!w||w.cave||!w.maritimeHarbor||w.maritimeVisual)return w&&w.maritimeVisual;
    const harbor=w.maritimeHarbor,shore=harbor.shore,launch=harbor.launch;if(!shore||!launch)return;
    const s=w.maritimeVisual={time:0,materials:new Map(),extraMaterials:new Set(),interactions:[],platforms:[],colliders:[]};
    const group=s.group=new THREE.Group();group.name='fishing-harbor';w.scene.add(group);
    const dx=launch.x-shore.x,dz=launch.z-shore.z,distance=Math.hypot(dx,dz)||1,yaw=Math.atan2(dx,dz),deckY=Math.max(w.waterLevel+.34,Number.isFinite(shore.y)?shore.y+.045:w.waterLevel+.34),length=Math.max(.85,Math.min(4,distance-2.35));
    const dock=s.dock=new THREE.Group();dock.position.set(shore.x,deckY,shore.z);dock.rotation.y=yaw;group.add(dock);s.yaw=yaw;
    for(let i=0;i<Math.ceil((length+1.3)/.32);i++){const z=-.65+i*.32;box(s,dock,i%2?'#b19364':'#c0a373',0,-.07,z,2.25,.14,.29);}
    for(const side of[-1,1]){
      box(s,dock,'#735b43',side*1.02,-.23,length*.5,.17,.22,length+1.3);
      for(const z of[-.5,length-.1]){pole(s,dock,'#785e43',side*1.02,-.55,z,.10,1.7);pole(s,dock,'#b49a6a',side*1.02,.25,z,.115,.15);}
      if(length>1.5)box(s,dock,'#92754e',side*1.05,.53,length*.34,.08,.10,Math.max(.8,length-.65));
    }
    const sign=marker(s,dock);box(s,dock,'#896444',1.50,.23,-.20,.7,.46,.7);box(s,dock,'#b89560',1.50,.50,-.20,.75,.08,.75);
    const solid=(lx,lz,r)=>{const c={x:shore.x+Math.cos(yaw)*lx+Math.sin(yaw)*lz,z:shore.z-Math.sin(yaw)*lx+Math.cos(yaw)*lz,r,maritime:true};w.colliders.push(c);s.colliders.push(c);};
    for(const side of[-1,1])for(let z=-.5;z<length;z+=.5)solid(side*1.05,z,.12);solid(-1.5,-.12,.18);solid(1.5,-.20,.45);
    const floor={x:shore.x+Math.sin(yaw)*(length-.65)/2,z:shore.z+Math.cos(yaw)*(length-.65)/2,w:2.3,d:length+1.3,rotation:yaw,y:deckY+.005,maritime:true};
    (w.groundPlatforms||(w.groundPlatforms=[])).push(floor);s.platforms.push(floor);
    const icon=E.Icons?E.Icons.html('boat',{decorative:true}):'';
    const boardIt={kind:'venue',service:'pier',action:'boat',region:w.id,x:shore.x,z:shore.z,r:3.1,label:'Cais · barcos e pescaria',icon,group:sign,boatHarbor:true};
    const vessel=s.boat=boat(s);group.add(vessel);
    const boatIt={kind:'venue',service:'pier',action:'boat',region:w.id,x:launch.x,z:launch.z,r:2.9,label:'Barco de pesca · embarcar',icon,group:vessel,boatHarbor:true};
    w.interactables.push(boardIt,boatIt);s.interactions.push(boardIt,boatIt);s.boatInteraction=boatIt;
    if(E.ScenePerf)E.ScenePerf.batch(dock,{cellSize:80,exclude:[sign]});
    G.update(w,0);return s;
  };
  G.update=(w,dt)=>{
    const s=w&&w.maritimeVisual,h=w&&w.hero,harbor=w&&w.maritimeHarbor;if(!s||!h||!harbor)return;
    s.time+=Math.max(0,Math.min(.1,dt||0));const aboard=!!h.boat,p=aboard?h:harbor.launch;
    const yaw=aboard&&Number.isFinite(h.boatYaw)?h.boatYaw:s.yaw,water=w.waterLevel+.09;
    s.boat.position.set(p.x,water+Math.sin(s.time*1.8)*.025,p.z);s.boat.rotation.set(Math.sin(s.time*1.2)*.009,yaw,Math.sin(s.time*1.7)*.018);
    const rowing=aboard&&h.moving;for(const[i,oar]of s.oars.entries()){const side=i?1:-1;oar.rotation.y=side*(.45+(rowing?Math.sin(s.time*5)*.32:0));oar.rotation.z=side*(rowing?Math.sin(s.time*5+.6)*.13:.04);}
    s.boatInteraction.x=p.x;s.boatInteraction.z=p.z;s.boatInteraction.label=aboard?'Barco · pescar ou voltar ao cais':'Barco de pesca · embarcar';
  };
  G.dispose=w=>{
    const s=w&&w.maritimeVisual;if(!s)return;
    w.interactables=w.interactables.filter(it=>!s.interactions.includes(it));w.groundPlatforms=(w.groundPlatforms||[]).filter(p=>!s.platforms.includes(p));
    w.colliders=(w.colliders||[]).filter(c=>!s.colliders.includes(c));w.scene.remove(s.group);const geos=new Set(),mats=new Set();s.group.traverse(o=>{if(o.geometry)geos.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])mats.add(m);});
    for(const m of s.materials.values())mats.add(m);for(const m of s.extraMaterials)mats.add(m);
    for(const g of geos)g.dispose();for(const m of mats)m.dispose();w.maritimeVisual=null;
  };
  E.MaritimeGfx=G;
})();
