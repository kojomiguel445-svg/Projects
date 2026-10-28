/* Villages are small market streets. Open stalls, shared paths and residential doors. */
(() => {
  'use strict';
  const V={},U=E.U,S=()=>E.Shopfronts;
  const SERVICES=[['inn','Estalagem das Lanternas','bed'],['general','Armazém do Viajante','shop'],['food','Cozinha da Vila','cooking'],['smith','Oficina e Forja','anvil'],['furniture','Marcenaria','home'],['guild','Casa dos Ofícios','journal'],['home','Residência','home'],['player-shop','Seu Ponto Comercial','scales']];
  const PALETTES={
    forest:{wall:'#ddd6bc',wood:'#6c513d',roof:'#598579',accent:'#d7b573',stone:'#a8a58e'},
    city:{wall:'#eee3cc',wood:'#80604c',roof:'#557f94',accent:'#cbb17d',stone:'#b7b4a3'},
    ruins:{wall:'#d0c9b6',wood:'#776558',roof:'#74867b',accent:'#bfa77b',stone:'#aaa491'},
    coast:{wall:'#f1debc',wood:'#9b7148',roof:'#bb806d',accent:'#d6b478',stone:'#c7b79d'},
    mountain:{wall:'#dedcd1',wood:'#705f50',roof:'#6f7e8a',accent:'#c3ad87',stone:'#a3a5a0'},
    astral:{wall:'#cfc9dc',wood:'#7c6b80',roof:'#7e73a7',accent:'#cab49a',stone:'#a19bae'},
    market:{wall:'#e7ceaa',wood:'#8c684c',roof:'#9c6b87',accent:'#d4ad75',stone:'#b6a28a'},
    garden:{wall:'#f0e2ca',wood:'#8a6d52',roof:'#b78393',accent:'#cfb482',stone:'#bbb39c'},
    abyss:{wall:'#bdb4c3',wood:'#726379',roof:'#776885',accent:'#bba693',stone:'#91899c'},
  };
  // A settlement keeps its services and open fronts, but belongs to its island.
  // These silhouettes and surfaces are authored separately from world terrain.
  const PROFILES={
    forest:{name:'Vila das Raízes',inn:'Pousada do Carvalho',trade:'das Raízes',style:'timber-moss',h:3.15,roofRise:.85,feature:'timber-gables'},
    city:{name:'Burgo do Relógio',inn:'Estalagem do Relógio',trade:'de Lunária',style:'clockwork-burgh',h:3.5,roofRise:.65,feature:'stone-colonnades'},
    ruins:{name:'Pátio dos Arcos',inn:'Abrigo dos Antigos',trade:'dos Arcos',style:'ruined-arcades',h:3.6,roofRise:0,feature:'broken-arches'},
    coast:{name:'Porto das Marés',inn:'Estalagem da Âncora',trade:'das Marés',style:'nautical-quay',h:3.0,roofRise:.55,feature:'sails-and-rigging'},
    mountain:{name:'Refúgio da Geada',inn:'Pousada da Lareira',trade:'da Geada',style:'alpine-stone',h:3.5,roofRise:1.3,feature:'snow-gables'},
    astral:{name:'Mirante de Cristal',inn:'Pousada das Constelações',trade:'Estelar',style:'crystal-observatory',h:3.65,roofRise:0,feature:'crystal-crowns'},
    market:{name:'Caravana dos Tecelões',inn:'Pousada das Sete Cores',trade:'dos Tecelões',style:'woven-caravan',h:3.1,roofRise:.9,feature:'fabric-pavilions'},
    garden:{name:'Vila das Flores',inn:'Pousada da Primavera',trade:'das Flores',style:'garden-pergolas',h:3.2,roofRise:0,feature:'flower-trellises'},
    abyss:{name:'Vigia de Obsidiana',inn:'Abrigo da Última Luz',trade:'de Obsidiana',style:'basalt-sanctuary',h:3.6,roofRise:0,feature:'basalt-stepped-roofs'},
  };
  const ground=(w,x,z)=>w.terrainAt?w.terrainAt(x,z):w.height(x,z);
  const worldPoint=(p,x,z)=>({x:p.x+Math.cos(p.rotation)*x+Math.sin(p.rotation)*z,z:p.z-Math.sin(p.rotation)*x+Math.cos(p.rotation)*z});
  const localPoint=(p,x,z)=>({x:Math.cos(p.rotation)*(x-p.x)-Math.sin(p.rotation)*(z-p.z),z:Math.sin(p.rotation)*(x-p.x)+Math.cos(p.rotation)*(z-p.z)});
  // Paving is clipped out of the actual terrain triangles. Re-sampling an
  // arbitrary road grid used to put parts of the road *inside* those triangles.
  // The same vertices now drive both the visible surface and groundAt physics.
  function pave(w,group,rect,mat,offset=.045,kind='paving'){
    const a=rect.rotation||0,c=Math.cos(a),s=Math.sin(a),hw=rect.w/2,hd=rect.d/2,positions=[],uv=[];
    const local=p=>({u:c*(p.x-rect.x)-s*(p.z-rect.z),v:s*(p.x-rect.x)+c*(p.z-rect.z),x:p.x,z:p.z,y:p.y});
    const clip=(poly,key,limit,sign)=>{const out=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],pi=sign*p[key]<=limit+1e-8,qi=sign*q[key]<=limit+1e-8;if(pi)out.push(p);if(pi!==qi){const t=(sign*limit-p[key])/(q[key]-p[key]);const r={};for(const k of['u','v','x','y','z'])r[k]=U.lerp(p[k],q[k],t);out.push(r);}}return out;};
    const triangle=points=>{let poly=points.map(local);for(const [k,l,d]of[['u',hw,1],['u',hw,-1],['v',hd,1],['v',hd,-1]]){poly=clip(poly,k,l,d);if(poly.length<3)return;}
      for(let i=1;i<poly.length-1;i++)for(const p of[poly[0],poly[i],poly[i+1]]){positions.push(p.x,p.y+offset,p.z);uv.push(p.x/2.8,p.z/2.8);}
    };
    const g=w.terrainGrid;
    if(g&&g.positions){
      const corners=[[-hw,-hd],[hw,-hd],[-hw,hd],[hw,hd]].map(([u,v])=>({x:rect.x+c*u+s*v,z:rect.z-s*u+c*v})),step=g.size/g.segments,half=g.size/2;
      const ix0=Math.max(0,Math.floor((Math.min(...corners.map(p=>p.x))+half)/step)),ix1=Math.min(g.segments-1,Math.floor((Math.max(...corners.map(p=>p.x))+half)/step));
      const iz0=Math.max(0,Math.floor((Math.min(...corners.map(p=>p.z))+half)/step)),iz1=Math.min(g.segments-1,Math.floor((Math.max(...corners.map(p=>p.z))+half)/step));
      const at=i=>({x:g.positions[i*3],y:g.positions[i*3+1],z:g.positions[i*3+2]});
      for(let iz=iz0;iz<=iz1;iz++)for(let ix=ix0;ix<=ix1;ix++){const k=iz*g.stride+ix,A=at(k),B=at(k+g.stride),D=at(k+1),C=at(k+g.stride+1);triangle([A,B,D]);triangle([D,B,C]);}
    }else{
      // Small isolated render tests have no world terrain grid.
      const n=Math.max(1,Math.ceil(rect.w/1.5)),m=Math.max(1,Math.ceil(rect.d/1.5)),at=(i,j)=>{const u=(i/n-.5)*rect.w,v=(j/m-.5)*rect.d,x=rect.x+c*u+s*v,z=rect.z-s*u+c*v;return{x,z,y:ground(w,x,z)};};
      for(let j=0;j<m;j++)for(let i=0;i<n;i++){const A=at(i,j),B=at(i,j+1),D=at(i+1,j),C=at(i+1,j+1);triangle([A,B,D]);triangle([D,B,C]);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();
    // Only the city's outer apron blends into the existing ground; its terrain
    // and all village/forest paths keep exactly the same vertices and materials.
    if(rect.edgeFade){const colours=[];
      for(let i=0;i<positions.length;i+=3){const p=local({x:positions[i],y:positions[i+1],z:positions[i+2]}),edge=Math.min(hw-Math.abs(p.u),hd-Math.abs(p.v));
        const width=rect.edgeFade*(.8+.2*Math.sin(p.x*.43+Math.sin(p.z*.31))),t=U.clamp(edge/width,0,1);colours.push(1,1,1,t*t*(3-2*t));}
      geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,4));mat=mat.clone();mat.vertexColors=true;mat.transparent=true;mat.depthWrite=false;
    }
    const mesh=new THREE.Mesh(geometry,mat);mesh.name='town-'+kind;mesh.receiveShadow=true;mesh.userData.pavement={...rect,offset,kind};group.add(mesh);(w.pavingSurfaces||(w.pavingSurfaces=[])).push(mesh);return mesh;
  }
  function pavingTexture(w,colour='#b4aa94'){
    if(w._pavingTexture)return w._pavingTexture;
    const cv=document.createElement('canvas');cv.width=cv.height=256;const x=cv.getContext('2d'),rng=U.seeded(91357),base=new THREE.Color(colour).convertLinearToSRGB(),rgb=[base.r,base.g,base.b].map(v=>Math.round(v*255));
    const shade=(v,alpha=1)=>`rgba(${rgb.map(c=>Math.max(0,Math.min(255,c+v))).join(',')},${alpha})`;
    x.fillStyle=shade(-36);x.fillRect(0,0,256,256);
    for(let row=-1;row<9;row++)for(let col=-1;col<5;col++){const px=col*64+(row%2?32:0)+2,py=row*32+2,s=Math.floor(rng()*20)-8;
      x.fillStyle=shade(s-16);x.fillRect(px,py,60,28);x.fillStyle=shade(s+3);x.fillRect(px+2,py+2,56,23);x.fillStyle=shade(s+20);x.fillRect(px+3,py+2,53,2);x.fillRect(px+2,py+4,2,19);x.fillStyle=shade(s-11);x.fillRect(px+4,py+24,53,2);
      for(let n=0;n<8;n++){x.fillStyle=shade(s+(n%2?10:-8),.32);x.fillRect(px+5+Math.floor(rng()*49),py+6+Math.floor(rng()*15),2+Math.floor(rng()*4),1);}
    }
    const biome=w.reg&&w.reg.biome;
    if(biome==='coast'){
      x.fillStyle='#526c6b';x.fillRect(0,0,256,256);
      for(let r=0;r<8;r++){x.fillStyle=r%2?'#b7986c':'#c3a77e';x.fillRect(2,r*32+2,252,28);x.fillStyle='#ddc7a0';x.fillRect(4,r*32+3,246,2);x.fillStyle='#7f694f';x.fillRect(4,r*32+27,246,2);for(const a of[13,241]){x.fillRect(a,r*32+9,3,3);x.fillRect(a,r*32+22,3,3);}for(let n=0;n<5;n++){x.fillStyle='#9b805d88';x.fillRect(25+n*43,r*32+11+(n%3)*4,30,1);}}
    }else if(biome==='forest'||biome==='ruins'){
      for(let n=0;n<100;n++){const px=Math.floor(rng()*128)*2,py=Math.floor(rng()*128)*2;x.fillStyle=n%3?'#6482655b':'#8da17b78';x.fillRect(px,py,2+(n%3)*2,2);}
    }else if(biome==='mountain'){
      for(let n=0;n<65;n++){x.fillStyle=n%3?'#eff4ec88':'#afc6cb66';x.fillRect(Math.floor(rng()*128)*2,Math.floor(rng()*128)*2,2+(n%2)*2,2);}
    }else if(biome==='astral'||biome==='abyss'){
      x.strokeStyle=biome==='astral'?'#adaddc99':'#67537caa';x.lineWidth=2;for(let k=-1;k<5;k++){x.beginPath();x.moveTo(k*64,0);x.lineTo(k*64+256,256);x.stroke();}
      for(let k=0;k<8;k++){x.fillStyle=biome==='astral'?'#e3d8f4aa':'#b9a1c077';x.fillRect(13+k*32,13+k*32,4,4);}
    }else if(biome==='market'||biome==='garden'){
      x.strokeStyle=biome==='market'?'#b77b7455':'#78977d66';x.lineWidth=2;for(let k=0;k<4;k++){x.strokeRect(k*64+16,16,32,32);x.strokeRect(k*64+16,144,32,32);}
    }
    const t=w._pavingTexture=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.NearestFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.anisotropy=4;return t;
  }
  const plots=[
    {service:'inn',x:-8.5,z:-17.2},{service:'guild',x:8.5,z:-17.2},
    {service:'furniture',x:-8.5,z:-5.8},{service:'smith',x:8.5,z:-5.8},
    {service:'food',x:-8.5,z:5.8},{service:'general',x:8.5,z:5.8},
    {service:'home',x:-8.5,z:17.2},{service:'player-shop',x:8.5,z:17.2},
  ];
  function layout(w){
    const rng=U.seeded(w.reg.seed*835+91);let best=null,bestScore=Infinity;
    const fixed=w.interactables.filter(i=>!['herb','lume'].includes(i.kind)).concat((w.camps||[]).map(c=>({...c,kind:'camp'})),(w.outpostPos||[]).map(p=>({...p,kind:'outpost'})),[w.landmarkPos,w.lairPos].filter(Boolean).map(p=>({...p,kind:'landmark'})),(w.torchShrines||[]).map(p=>({...p,kind:'shrine'}))); 
    const key=p=>Math.round(p.x*100)+','+Math.round(p.z*100),removable=new Set(Object.values(w.propGroups||{}).flat().map(key));
    const protectedSolids=(w.colliders||[]).filter(c=>!removable.has(key(c)));
    const intersects=(q,x,z,hw,hd,r)=>Math.max(0,Math.abs(q.x-x)-hw)**2+Math.max(0,Math.abs(q.z-z)-hd)**2<r*r;
    const site=(a,r)=>({x:Math.cos(a)*r,z:Math.sin(a)*r,rotation:Math.atan2(-Math.cos(a),-Math.sin(a))});
    const forest=w.reg.biome==='forest'&&typeof w.roadDist==='function',trees=forest?[...((w.propGroups||{}).tree||[]),...((w.propGroups||{}).pine||[])]:[];
    const score=(p,r)=>{
      let cost=r*.035;
      for(const plot of plots){
        const q=worldPoint(p,plot.x,plot.z),hs=[];
        for(const dx of[-3.5,0,3.5])for(const dz of[-3.5,0,3.5])hs.push(ground(w,q.x+dx,q.z+dz));
        const low=Math.min(...hs),range=Math.max(...hs)-low;
        cost+=range*range*2.6+Math.max(0,w.waterLevel+.5-low)*70;
        for(const it of fixed){const d=Math.hypot(q.x-it.x,q.z-it.z);if(d<8)cost+=(8-d)*(it.kind==='chest'?5:16);}
      }
      for(const it of fixed){
        const ip=localPoint(p,it.x,it.z);if(Math.abs(ip.x)<13.2&&Math.abs(ip.z)<23)cost+=it.kind==='camp'?180:it.kind==='chest'?18:60;
        // A chest is a protected world POI, not street furniture. Prefer another
        // site rather than placing the market's walking lane over its pedestal.
        const lane=(Math.abs(ip.x)<3.9&&Math.abs(ip.z)<25.6)||(Math.abs(ip.x)<6.2&&[-17.2,-5.8,5.8,17.2].some(z=>Math.abs(ip.z-z)<1.65));
        if(lane&&!['npc','fish','herb','lume'].includes(it.kind))cost+=280;
        // Preserve access to authored chests, quest characters and landmarks.
        // Their centres cannot be swallowed by an open shop's raised floor.
        if(!['fish','herb','lume','campfire'].includes(it.kind)&&plots.some(plot=>Math.abs(ip.x-plot.x)<4.15&&Math.abs(ip.z-plot.z)<4.65))cost+=1800;
      }
      // Some landmarks have a wide solid footprint whose centre is outside
      // the lane. Honour the actual footprint as well as the POI marker.
      for(const solid of protectedSolids){const q=localPoint(p,solid.x,solid.z),r=(solid.r||Math.hypot(solid.w||0,solid.d||0)/2||.3)+.4;
        if(intersects(q,0,0,3.65,25.5,r)||plots.some(plot=>intersects(q,plot.x,plot.z,3.4,4.0,r)))cost+=6000;
      }
      const samples=[[-3,25],[3,25],[-3,-24],[3,-24],[0,0]].map(([x,z])=>worldPoint(p,x,z));
      for(const q of samples)cost+=Math.max(0,w.waterLevel+.25-ground(w,q.x,q.z))*80;
      // Na Floresta das Lanternas a vila não pode cobrir as trilhas e deve derrubar o mínimo de árvores.
      if(forest){
        for(let lx=-15;lx<=15;lx+=2.5)for(let lz=-27;lz<=27;lz+=3){const q=worldPoint(p,lx,lz);if(w.roadDist(q.x,q.z)<3.2)cost+=400;}
        for(const t of trees){const ip=localPoint(p,t.x,t.z);if(Math.abs(ip.x)<20&&Math.abs(ip.z)<32)cost+=6;}
      }
      return cost;
    };
    for(let attempt=0;attempt<350;attempt++){
      const a=rng()*Math.PI*2,r=38+rng()*20,p=site(a,r),cost=score(p,r);
      if(cost<bestScore){best=p;bestScore=cost;}
      if(cost<12)break;
    }
    best.score=bestScore;
    // A hillside site turns the street into a ramp and lifts shops onto tall plinths.
    // Only then search a wider ring where the whole street's rise also counts.
    // In the Lantern Forest the same search also keeps the trails clear and spares trees (see score).
    if(rise(w,best)>8){
      const rng2=U.seeded(w.reg.seed*977+13);let flat=best,flatScore=bestScore+rise(w,best)**2*6;
      for(let attempt=0;attempt<500;attempt++){
        const a=rng2()*Math.PI*2,r=26+rng2()*44,p=site(a,r),cost=score(p,r)+rise(w,p)**2*6;
        if(cost<flatScore){flat=p;flatScore=cost;}
      }
      flat.score=flatScore;return flat;
    }
    return best;
  }
  // Height range along the street and its shop rows.
  function rise(w,p){
    const hs=[];for(let lx=-12;lx<=12;lx+=6)for(let lz=-25;lz<=25;lz+=5){const q=worldPoint(p,lx,lz);hs.push(ground(w,q.x,q.z));}
    return Math.max(...hs)-Math.min(...hs);
  }
  // The street sits on a terrace: the terrain under the plan eases onto a gentle plane
  // (at most 6% along the street) and blends back over a margin. The rendered mesh,
  // w.height and the scattered props all follow the same levelled surface.
  function level(w,plan){
    const mesh=w.terrain,grid=w.terrainGrid;if(!mesh||!grid)return;
    const HX=14.5,HZ=27,M=10,pts=[];
    for(let lx=-10;lx<=10;lx+=5)for(let lz=-24;lz<=24;lz+=4){const q=worldPoint(plan,lx,lz);pts.push([lz,w.height(q.x,q.z)]);}
    const mean=pts.reduce((t,q)=>t+q[1],0)/pts.length,cov=pts.reduce((t,q)=>t+q[0]*(q[1]-mean),0),vz=pts.reduce((t,q)=>t+q[0]*q[0],0);
    // The lowest end of the sloped terrace must stay above the water, not just its centre.
    const grade=U.clamp(cov/vz,-.06,.06),floorY=Math.max(mean,w.waterLevel+.7+Math.abs(grade)*HZ),target=lz=>floorY+grade*lz;
    const weight=(x,z)=>{const p=localPoint(plan,x,z),d=Math.hypot(Math.max(0,Math.abs(p.x)-HX),Math.max(0,Math.abs(p.z)-HZ));if(d>=M)return null;const t=1-d/M;return{k:t*t*(3-2*t),lz:U.clamp(p.z,-HZ,HZ)};};
    const original=w.height.bind(w);
    w.height=(x,z)=>{const h=original(x,z),q=weight(x,z);return q?h+(target(q.lz)-h)*q.k:h;};
    const R=Math.hypot(HX,HZ)+M,P=mesh.geometry.attributes.position;
    for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i);if(Math.hypot(x-plan.x,z-plan.z)<R)P.setY(i,w.height(x,z));}
    P.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();mesh.geometry.computeBoundingBox();
    // Trees and rocks near the new terrace follow the ground they stand on.
    const matrix=new THREE.Matrix4();
    for(const o of w.scene.children)if(o.isInstancedMesh){
      let moved=false;
      for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const e=matrix.elements;if(Math.hypot(e[12]-plan.x,e[14]-plan.z)>R||!weight(e[12],e[14]))continue;e[13]+=w.height(e[12],e[14])-original(e[12],e[14]);o.setMatrixAt(i,matrix);moved=true;}
      if(moved){o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
    }
    for(const list of Object.values(w.propGroups||{}))for(const it of list){const q=weight(it.x,it.z);if(q){const dy=w.height(it.x,it.z)-original(it.x,it.z);it.h+=dy;if(it.y!==undefined)it.y+=dy;}}
    for(const b of w.benches||[])if(weight(b.x,b.z)){const dy=w.height(b.x,b.z)-original(b.x,b.z);b.y+=dy;b.group.position.y+=dy;}
    plan.level={floorY,grade};
  }
  function road(w,group,a,b,width,mat,offset=.055,kind='street',edgeFade=0){
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<.05)return;
    return pave(w,group,{x:(a.x+b.x)/2,z:(a.z+b.z)/2,w:width,d:length,rotation:Math.atan2(dx,dz),edgeFade},mat,offset,kind);
  }
  function clearTown(w,plan){
    const entrance=worldPoint(plan,0,25),end={x:entrance.x*.3,z:entrance.z*.3},dx=end.x-entrance.x,dz=end.z-entrance.z,ll=dx*dx+dz*dz;
    const inside=(x,z)=>{const p=localPoint(plan,x,z);if(Math.abs(p.x)<13.35&&Math.abs(p.z)<25.35)return true;const t=Math.max(0,Math.min(1,((x-entrance.x)*dx+(z-entrance.z)*dz)/(ll||1)));return Math.hypot(x-entrance.x-t*dx,z-entrance.z-t*dz)<2.1;};
    const removed=[],apron=(x,z)=>{const p=localPoint(plan,x,z);return Math.abs(p.x)<20&&Math.abs(p.z)<32;};
    // Houses and tents also keep clear of the paved apron around the curb.
    for(const [type,list]of Object.entries(w.propGroups||{}))w.propGroups[type]=list.filter(p=>{if(inside(p.x,p.z)||(type==='house'||type==='tent')&&apron(p.x,p.z)){removed.push(p);return false;}return true;});
    w.colliders=w.colliders.filter(c=>!removed.some(p=>Math.hypot(c.x-p.x,c.z-p.z)<.11));
    const matrix=new THREE.Matrix4();
    for(const o of w.scene.children)if(o.isInstancedMesh){
      let count=0;for(let i=0;i<o.count;i++){o.getMatrixAt(i,matrix);const x=matrix.elements[12],z=matrix.elements[14];if(inside(x,z)||removed.some(p=>Math.abs(p.x-x)<.01&&Math.abs(p.z-z)<.01))continue;if(count!==i)o.setMatrixAt(count,matrix);count++;}
      if(count!==o.count){o.count=count;o.instanceMatrix.needsUpdate=true;if(count)o.computeBoundingSphere();else o.visible=false;}
    }
    // Decorative halos tied to removed lanterns do not hang over the new street.
    for(const o of [...w.scene.children])if(o.isSprite&&o.material&&o.material.blending===THREE.AdditiveBlending&&removed.some(p=>Math.hypot(o.position.x-p.x,o.position.z-p.z)<1.3)){w.scene.remove(o);if(w.retire)w.retire(o);}
  }
  function regionalName(profile,service){
    return {inn:profile.inn,general:'Empório '+profile.trade,food:'Cozinha '+profile.trade,smith:'Forja '+profile.trade,furniture:'Marcenaria '+profile.trade,guild:'Ofícios '+profile.trade,home:'Residência '+profile.trade,'player-shop':'Seu Ponto '+profile.trade}[service];
  }
  function regionalArchitecture(w,v,profile){
    const g=new THREE.Group();g.name='regional-'+profile.style;v.arch.add(g);v.regionalStyle=profile.style;
    const p=v.palette,hw=v.w/2,hd=v.d/2,h=v.open?v.h:3.4,back=-hd-.13;
    const b=(color,x,y,z,sx,sy,sz,extra)=>S().box(w,g,color,x,y,z,sx,sy,sz,extra);
    const c=(color,x,y,z,r,ht,n=8)=>S().cylinder(w,g,color,x,y,z,r,ht,n);
    const prism=(color,x,y,z,r,ht,n=6)=>{const m=new THREE.Mesh(new THREE.ConeGeometry(r,ht,n),S().material(w,color));m.position.set(x,y,z);g.add(m);return m;};
    const beam=(color,a,bp,width=.12)=>{const aa=new THREE.Vector3(...a),bb=new THREE.Vector3(...bp),d=bb.clone().sub(aa),m=new THREE.Mesh(new THREE.BoxGeometry(width,d.length(),width),S().material(w,color));m.position.copy(aa.add(bb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(m);return m;};
    const foliage=(color,x,y,z,r=.28)=>{const m=new THREE.Mesh(new THREE.DodecahedronGeometry(r,0),S().material(w,color));m.position.set(x,y,z);g.add(m);return m;};
    const gable=(color,rise,depth=v.d*.42,lift=0)=>{
      const width=v.w+.6,y=h+.27+lift,z=-v.d*.32,positions=[];
      const A=[-width/2,y,z-depth/2],B=[-width/2,y,z+depth/2],C=[0,y+rise,z-depth/2],D=[0,y+rise,z+depth/2],F=[width/2,y,z-depth/2],G=[width/2,y,z+depth/2];
      for(const tri of [[A,B,C],[B,D,C],[C,D,F],[D,G,F],[A,C,F],[B,G,D]])for(const q of tri)positions.push(...q);
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,S().material(w,color,{side:THREE.DoubleSide}));m.receiveShadow=true;g.add(m);
      beam(p.wood,[-width/2,y,z+depth/2],[0,y+rise,z+depth/2],.12);beam(p.wood,[width/2,y,z+depth/2],[0,y+rise,z+depth/2],.12);
    };
    if(profile.style==='timber-moss'){
      for(const x of[-hw+.13,0,hw-.13])b(p.wood,x,h*.48,back,.15,h*.96,.18);
      for(const side of[-1,1])beam(p.wood,[side*(hw-.2),.3,back-.05],[0,h-.3,back-.05],.14);
      if(v.open)gable(p.roof,profile.roofRise);
      for(let k=0;k<7;k++){const x=(k/6-.5)*v.w,roofY=h+.27+profile.roofRise*(1-Math.abs(x)/(hw+.3));foliage(k%2?'#6f8970':'#819a73',x,roofY+.08,-v.d*.47,.28);}
      for(const side of[-1,1]){b('#73573c',side*hw,1.1,hd-.23,.28,2.2,.28);for(let k=0;k<3;k++)foliage('#7b986f',side*hw,1.7+k*.3,hd-.23,.23);}
    }else if(profile.style==='clockwork-burgh'){
      b(p.accent,0,h+.28,back,v.w+.55,.22,.56);b(p.wall,0,h+.48,back,v.w+.25,.21,.4);
      for(const side of[-1,1]){c(p.stone,side*hw,1.42,hd-.2,.23,2.84,10);c(p.accent,side*hw,2.9,hd-.2,.35,.17,10);c(p.accent,side*hw,.12,hd-.2,.35,.24,10);}
      if(v.open)gable('#728494',profile.roofRise);
      for(let i=0;i<5;i++)b(p.accent,(i/4-.5)*(v.w-.6),h+.12,back+.24,.12,.22,.2);
    }else if(profile.style==='ruined-arcades'){
      for(const side of[-1,1]){for(let k=0;k<5;k++)b(k%2?'#b5ae91':p.stone,side*(hw-.1),.28+k*.55,back,.6,.53,.68);b(p.accent,side*(hw-.1),2.95,back,.85,.24,.85);}
      b('#b9ad8d',-.25,h+.08,back,v.w*.6,.4,.8);b('#a79c81',v.w*.34,h+.23,back,v.w*.22,.25,.72);
      for(let k=0;k<8;k++){const angle=(k+.5)/8*Math.PI,m=b(p.stone,Math.cos(angle)*(hw-.3),h-.15+Math.sin(angle)*1.2,back,.65,.42,.68);m.rotation.z=angle-Math.PI/2;}
      for(let k=0;k<5;k++)foliage('#7b916d',-hw+.2,h-k*.43,back+.4,.25);
    }else if(profile.style==='nautical-quay'){
      for(const side of[-1,1]){b('#f3e7cd',side*hw,.7,-.7,.22,1.4,v.d*.66);b('#4b8394',side*hw,1.43,-.7,.28,.15,v.d*.66);beam('#dccdaa',[side*hw,3.5,back],[side*hw,2.2,hd],.055);}
      if(v.open)gable('#5b8791',profile.roofRise);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.34,.09,5,10),S().material(w,'#eadbc1'));ring.position.set(-hw-.06,1.7,hd-.8);ring.rotation.y=Math.PI/2;g.add(ring);for(const sign of[-1,1])b('#c77862',-hw-.04,1.7+sign*.30,hd-.8,.16,.15,.16);
      for(const side of[-1,1]){c('#956b45',side*(hw-.23),.3,back-.35,.25,.6,8);for(let k=0;k<3;k++)c('#d5bd85',side*(hw-.23),.44+k*.055,back-.35,.27,.025,8);}
    }else if(profile.style==='alpine-stone'){
      for(let k=0;k<4;k++)for(const side of[-1,1])b(k%2?'#9b9c93':'#b9b5a6',side*hw,.23+k*.42,-v.d*.17,.3,.39,v.d*.72);
      if(v.open){gable('#667b8d',profile.roofRise);gable('#e7efeb',profile.roofRise*.96,v.d*.39,.10);}
      for(const side of[-1,1])b('#e9eeea',side*hw,1.05,-v.d*.17,.39,.12,v.d*.73);
      b('#756e64',hw-.4,h+.62,back+.5,.53,1.4,.54);b('#d8e3df',hw-.4,h+1.32,back+.5,.67,.16,.68);
      for(const side of[-1,1])beam(p.wood,[side*hw,2.5,hd-.1],[side*(hw-.8),3.05,hd-.1],.18);
    }else if(profile.style==='crystal-observatory'){
      b('#8b829e',0,h+.18,back,v.w+.25,.3,.65);b('#c9bed4',0,h+.39,back,v.w-.2,.14,.5);
      for(const side of[-1,1]){const m=prism('#bab7e4',side*(hw-.12),h+.8,back,.46,1.5,5);m.material=S().material(w,'#aba9dc',{emissive:'#676baf',emissiveIntensity:.16});c('#d3c09b',side*hw,1.45,hd-.15,.13,2.9,6);prism('#b9c5e2',side*hw,3.1,hd-.15,.29,.62,5);}
      for(let k=0;k<3;k++)prism(k%2?'#9faad4':'#c4b1d5',(k-1)*.8,h+.6,back,.23,.75+(k%2)*.4,5);
      const orbit=new THREE.Mesh(new THREE.TorusGeometry(.9,.042,4,20),S().material(w,'#d7bd85'));orbit.position.set(0,h+.9,back);orbit.rotation.y=.35;g.add(orbit);
    }else if(profile.style==='woven-caravan'){
      if(v.open)gable('#ae746d',profile.roofRise);
      for(const side of[-1,1]){b('#b58a57',side*hw,1.6,hd-.15,.14,3.2,.14);prism(p.accent,side*hw,3.3,hd-.15,.18,.32,6);const cloth=b(side<0?'#97748e':'#698e8c',side*(hw-.25),1.6,back+.22,.58,2.25,.04);for(let k=0;k<4;k++)b(p.accent,cloth.position.x,.8+k*.43,back+.25,.54,.07,.025);}
      for(const x of[-hw+.6,hw-.6]){b('#b68d64',x,.12,back+.9,.9,.18,1.25);b('#966d83',x,.23,back+.9,.78,.04,1.16);for(let k=0;k<3;k++)b('#ddbd88',x,.255,back+.5+k*.4,.7,.015,.045);}
      for(let k=0;k<4;k++)b('#e5ce91',(k-1.5)*.9,h+.42,-v.d*.12,.16,.16,.16);
    }else if(profile.style==='garden-pergolas'){
      for(const side of[-1,1]){b('#e2d4b2',side*hw,1.6,hd-.2,.15,3.2,.15);b('#8b9d76',side*hw,1.55,back+.22,.06,2.8,.08);for(let k=0;k<5;k++)foliage('#74936e',side*hw,1.1+k*.45,back+.23,.25);}
      for(let k=0;k<6;k++)b('#a99065',(k/5-.5)*v.w,h+.27,-v.d*.29,.14,.15,v.d*.56);
      for(const side of[-1,1]){b('#a88a63',side*(hw-.5),.34,back+.65,.65,.68,.72);for(let k=0;k<5;k++){foliage('#729771',side*(hw-.5)+(k%2-.5)*.28,.92,back+.65+(Math.floor(k/2)-1)*.15,.24);foliage(k%2?'#d9a3a5':'#e2c88b',side*(hw-.5)+(k%2-.5)*.28,1.12,back+.65+(Math.floor(k/2)-1)*.15,.12);}}
      for(let k=0;k<5;k++)foliage(k%2?'#bb8e9e':'#80a07b',(k/4-.5)*v.w,h+.42,-v.d*.38,.27);
    }else{
      for(const side of[-1,1]){for(let k=0;k<4;k++)b(k%2?'#67616d':'#807684',side*hw,.28+k*.55,back,.5,.52,.7);prism('#514957',side*hw,h+.53,back,.35,1.25,4);}
      for(let k=0;k<3;k++)b(k%2?'#6c6175':'#81718b',0,h+.16+k*.25,back,v.w+.55-k*.65,.25,1.3-k*.24);
      for(const side of[-1,1]){b('#6a6074',side*hw,1.55,hd-.14,.22,3.1,.25);b('#b5a0c3',side*hw,1.65,hd-.29,.07,.9,.025,{emissive:'#5f417a',emissiveIntensity:.17});}
    }
    // New details join the shared static architecture batch, not a per-frame painter.
    return g;
  }
  function regionalSquare(w,plan,town,profile,colors){
    const at=worldPoint(plan,0,24.1),gate=new THREE.Group();gate.name='village-regional-gateway';gate.position.set(at.x,ground(w,at.x,at.z),at.z);gate.rotation.y=plan.rotation;town.add(gate);
    const stone=['ruined-arcades','alpine-stone','basalt-sanctuary'].includes(profile.style),postColor=stone?colors.stone:colors.wood;
    const postBases=[-1,1].map(side=>{const p=worldPoint(plan,side*4.6,24.1);return{side,p,y:ground(w,p.x,p.z)-gate.position.y};}),top=Math.max(0,...postBases.map(p=>p.y))+4.2;
    for(const {side,p,y}of postBases){S().box(w,gate,postColor,side*4.6,(top+y)/2,0,stone?.55:.24,top-y,stone?.65:.28);w.colliders.push({...p,r:stone?.37:.20,villageDecor:true});S().box(w,gate,colors.accent,side*4.6,top+.08,0,.68,.2,.7);}
    S().box(w,gate,postColor,0,top-.08,0,9.6,.24,.25);
    if(profile.style==='woven-caravan'||profile.style==='nautical-quay'){for(let k=0;k<8;k++){const pennant=new THREE.Mesh(new THREE.ConeGeometry(.18,.42,3),S().material(w,k%2?colors.roof:colors.accent));pennant.rotation.z=Math.PI;pennant.position.set((k-3.5)*.9,top-.4,.07);gate.add(pennant);}}
    else if(profile.style==='crystal-observatory'||profile.style==='basalt-sanctuary'){for(const side of[-1,1]){const shard=new THREE.Mesh(new THREE.ConeGeometry(.29,.95,5),S().material(w,colors.roof,{emissive:colors.roof,emissiveIntensity:.12}));shard.position.set(side*4.6,top+.64,0);gate.add(shard);}}
    else if(profile.style==='garden-pergolas'||profile.style==='timber-moss'){for(let k=0;k<8;k++){const leaf=new THREE.Mesh(new THREE.DodecahedronGeometry(.23,0),S().material(w,k%2?'#789773':colors.roof));leaf.position.set((k-3.5)*1.05,top+.05,.06);gate.add(leaf);}}
    else if(profile.style==='alpine-stone')S().box(w,gate,'#e6efeb',0,top+.1,0,9.7,.15,.42);
    const cv=document.createElement('canvas');cv.width=512;cv.height=96;const x=cv.getContext('2d');x.fillStyle='#293f45';x.fillRect(0,0,512,96);x.strokeStyle=colors.accent;x.lineWidth=4;x.strokeRect(3,3,506,90);x.fillStyle='#f2e3c4';x.textAlign='center';x.textBaseline='middle';x.font='bold 32px Nunito,sans-serif';x.fillText(profile.name,256,49,480);const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(4.6,.86),new THREE.MeshBasicMaterial({map:texture}));sign.position.set(0,top-.55,.19);gate.add(S().readable(sign));
    // The side monument occupies the gap between plots, never the main walking lane.
    const site=worldPoint(plan,10.8,0),heights=[[-.7,-.7],[.7,-.7],[0,0],[-.7,.7],[.7,.7]].map(([x,z])=>ground(w,site.x+x,site.z+z)),y=Math.max(...heights)+.025,foundation=y-Math.min(...heights)+.08,g=new THREE.Group();g.name='regional-square-landmark';g.position.set(site.x,y,site.z);g.rotation.y=plan.rotation;town.add(g);S().cylinder(w,g,colors.stone,0,-foundation/2,0,.84,foundation,8);S().cylinder(w,g,colors.stone,0,.17,0,.83,.34,8);w.colliders.push({...site,r:.84,villageDecor:true});
    if(profile.style==='clockwork-burgh'){
      S().box(w,g,colors.wall,0,2.35,0,.8,4.4,.8);S().box(w,g,colors.wood,0,4.68,0,1.25,.2,1.25);const roof=new THREE.Mesh(new THREE.ConeGeometry(.95,1.4,4),S().material(w,colors.roof));roof.rotation.y=Math.PI/4;roof.position.y=5.45;g.add(roof);const dial=new THREE.Mesh(new THREE.CircleGeometry(.34,16),S().material(w,'#e4d5aa'));dial.position.set(-.414,3.75,0);dial.rotation.y=-Math.PI/2;g.add(dial);S().box(w,g,colors.wood,-.438,3.8,0,.025,.32,.045);S().box(w,g,colors.wood,-.445,3.76,.1,.025,.045,.25);
    }else if(profile.style==='nautical-quay'){
      S().cylinder(w,g,colors.wood,0,2.1,0,.08,4.0,8);const sail=new THREE.Mesh(new THREE.BufferGeometry(),S().material(w,'#efe0bd',{side:THREE.DoubleSide}));sail.geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,1.1,0,0,3.85,0,1.35,1.25,0],3));sail.geometry.computeVertexNormals();g.add(sail);S().box(w,g,'#6595a1',.14,.48,0,1.25,.2,.65);
    }else if(profile.style==='astral'||profile.style==='crystal-observatory'||profile.style==='basalt-sanctuary'){
      const shard=new THREE.Mesh(new THREE.OctahedronGeometry(1.15,0),S().material(w,colors.roof,{emissive:colors.roof,emissiveIntensity:.15}));shard.scale.set(.6,1.6,.6);shard.position.y=2.0;g.add(shard);const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.1,.06,5,20),S().material(w,colors.accent));orbit.position.y=2.0;orbit.rotation.x=.7;g.add(orbit);
    }else if(profile.style==='garden-pergolas'||profile.style==='timber-moss'){
      S().cylinder(w,g,colors.wood,0,1.5,0,.18,2.8,6);for(const [dx,dz,dy]of[[0,0,3.3],[-.55,.15,2.8],[.55,-.2,2.9]]){const leaves=new THREE.Mesh(new THREE.DodecahedronGeometry(.85,1),S().material(w,profile.style==='garden-pergolas'?'#9baf87':'#678f72'));leaves.position.set(dx,dy,dz);g.add(leaves);}
    }else{
      for(let k=0;k<4;k++)S().box(w,g,k%2?colors.stone:colors.accent,0,.65+k*.6,0,1.08-k*.16,.55,.85-k*.12);const cap=new THREE.Mesh(new THREE.ConeGeometry(.65,.7,4),S().material(w,profile.style==='alpine-stone'?'#dfe8e6':colors.roof));cap.rotation.y=Math.PI/4;cap.position.y=3.1;g.add(cap);
    }
    w.regionalTown={style:profile.style,feature:profile.feature,gateway:gate,landmark:g};
  }
  function streets(w,plan,town,colors){
    const map=pavingTexture(w,colors.stone),base=S().material(w,'#f0e9d8',{map,side:THREE.DoubleSide}),street=S().material(w,'#c9c7b8',{map,side:THREE.DoubleSide}),trim=S().material(w,'#ead8af',{side:THREE.DoubleSide});
    // Worn pavers outside the curb thin out into the ground instead of a cut-out edge.
    pave(w,town,{x:plan.x,z:plan.z,w:36,d:60,rotation:plan.rotation,edgeFade:5},S().material(w,colors.stone,{map,side:THREE.DoubleSide}),.03,'apron');
    pave(w,town,{x:plan.x,z:plan.z,w:26,d:50,rotation:plan.rotation},base,.045,'precinct');
    const a=worldPoint(plan,0,-25),b=worldPoint(plan,0,25);road(w,town,a,b,6.4,street,.058);
    // Keep a single continuous surface at every crossing. Borders are split at
    // the four shop lanes instead of stacking coplanar strips over each other.
    const gaps=[-17.2,-5.8,5.8,17.2],segments=[[-25,-18.3],[-16.1,-6.9],[-4.7,4.7],[6.9,16.1],[18.3,25]];
    for(const sign of[-1,1])for(const [from,to]of segments)road(w,town,worldPoint(plan,sign*3.35,from),worldPoint(plan,sign*3.35,to),.12,trim,.074,'street-border');
    for(const z of gaps)for(const sign of[-1,1])road(w,town,worldPoint(plan,sign*3.2,z),worldPoint(plan,sign*5.8,z),2.0,street,.058,'shop-approach');
    const start=worldPoint(plan,0,25),near={x:start.x*.3,z:start.z*.3};road(w,town,start,near,3.0,street,.058,'entry-path',1.3);
    // The outer curb belongs to the paving, leaving grass outside the village.
    for(const sign of[-1,1]){road(w,town,worldPoint(plan,sign*12.8,-24.8),worldPoint(plan,sign*12.8,24.8),.16,trim,.074,'outer-curb');road(w,town,worldPoint(plan,-12.8,sign*24.8),worldPoint(plan,12.8,sign*24.8),.16,trim,.074,'outer-curb');}
    const loop=[[-3,-23],[-3,23],[3,23],[3,-23]].map(([x,z])=>worldPoint(plan,x,z));loop.pauseIndices=[1,3];(w.crowdRoutes||(w.crowdRoutes=[])).push(loop);
    // A second short loop gives passers-by places to pause without blocking shop aisles.
    const small=[[-2.8,-7],[-2.8,7],[2.8,7],[2.8,-7]].map(([x,z])=>worldPoint(plan,x,z));small.pauseIndices=[0,2];w.crowdRoutes.push(small);
    const box=(...args)=>S().box(w,town,...args),cyl=(...args)=>S().cylinder(w,town,...args);
    for(const z of[-23,0,23])for(const sign of[-1,1]){
      const p=worldPoint(plan,sign*4.3,z),y=ground(w,p.x,p.z);cyl(colors.wood,p.x,y+1.38,p.z,.065,2.76,6);cyl(colors.accent,p.x,y+2.85,p.z,.23,.32,6);w.colliders.push({x:p.x,z:p.z,r:.18,villageDecor:true});
    }
    for(const sign of[-1,1]){
      const p=worldPoint(plan,sign*4.75,0),y=ground(w,p.x,p.z),g=new THREE.Group();g.position.set(p.x,y,p.z);g.rotation.y=plan.rotation;town.add(g);
      S().box(w,g,colors.wood,0,.48,0,.72,.13,2.15);S().box(w,g,colors.wood,sign*.3,.93,0,.1,.9,2.15);for(const z of[-.8,.8])S().box(w,g,colors.wood,0,.24,z,.5,.45,.13);w.colliders.push({x:p.x,z:p.z,r:.64,villageDecor:true});
      const pot=worldPoint(plan,sign*5.1,2.0),py=ground(w,pot.x,pot.z);cyl('#ad8561',pot.x,py+.3,pot.z,.38,.6,8,.44);for(let k=0;k<4;k++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.26,6,4),S().material(w,k%2?'#6e9376':'#9eaf83'));leaf.scale.set(.8,1.4,.8);leaf.position.set(pot.x+Math.cos(k*1.57)*.2,py+.9,pot.z+Math.sin(k*1.57)*.2);town.add(leaf);}w.colliders.push({x:pot.x,z:pot.z,r:.4,villageDecor:true});
    }
    return loop;
  }
  function fires(w){
    w.cookingFires=w.cookingFires||[];
    if(w.fire&&w.fire.pos&&!w.interactables.some(i=>i.kind==='campfire'&&Math.hypot(i.x-w.fire.pos.x,i.z-w.fire.pos.z)<1)){const p=w.fire.pos,it={kind:'campfire',x:p.x,z:p.z,r:3.2,label:'Preparar comida na fogueira',icon:E.Icons.html('flame')};w.interactables.push(it);w.cookingFires.push(it);}
    if(w.reg.metro)return;
    const colors=PALETTES[w.reg.biome]||PALETTES.forest;
    for(let i=0;i<2;i++){
      const rng=U.seeded(w.reg.seed*17+i*321);let p=null;
      for(let j=0;j<70&&!p;j++){const a=rng()*6.283,r=65+rng()*35,x=Math.cos(a)*r,z=Math.sin(a)*r,y=ground(w,x,z);if(y>w.waterLevel+.6&&w.slope(x,z)<.45&&w.interactables.every(o=>Math.hypot(x-o.x,z-o.z)>8))p={x,z,y};}
      if(!p)continue;
      const g=new THREE.Group();g.name='road-cooking-fire';g.position.set(p.x,p.y,p.z);for(let k=0;k<7;k++){const a=k/7*Math.PI*2;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.24,0),S().material(w,colors.stone));rock.position.set(Math.cos(a)*.65,.16,Math.sin(a)*.65);g.add(rock);}
      for(let k=0;k<3;k++){const log=new THREE.Mesh(new THREE.CylinderGeometry(.09,.1,1.05,5),S().material(w,colors.wood));log.rotation.set(Math.PI/2,k*1.04,.22);log.position.y=.23;g.add(log);}
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.28,.7,6),S().material(w,'#efb05d',{emissive:'#efb05d',emissiveIntensity:.6}));flame.position.y=.58;g.add(flame);w.scene.add(g);w.colliders.push({x:p.x,z:p.z,r:.7});const it={kind:'campfire',x:p.x,z:p.z,r:3,label:'Cozinhar na fogueira',icon:E.Icons.html('flame')};w.interactables.push(it);w.cookingFires.push(it);if(E.ScenePerf)E.ScenePerf.batch(g);
    }
  }
  V.build=w=>{
    if(w.cave||w.village||!S())return;
    if(w.reg.metro){fires(w);return;}
    const plan=layout(w),colors=PALETTES[w.reg.biome]||PALETTES.forest,profile=PROFILES[w.reg.biome]||PROFILES.forest,town=new THREE.Group();town.name='village-streets';w.scene.add(town);clearTown(w,plan);if(rise(w,plan)<=8)level(w,plan);pavingTexture(w,colors.stone);const doors=[],venues=[];
    for(const plot of plots){
      const p=worldPoint(plan,plot.x,plot.z),def=SERVICES.find(s=>s[0]===plot.service),rotation=plan.rotation+(plot.x<0?Math.PI/2:-Math.PI/2);
      const opts={id:'village-'+plot.service,service:plot.service,name:regionalName(profile,plot.service)||def[1],x:p.x,z:p.z,rotation,w:plot.service==='inn'?7.8:7.2,d:plot.service==='inn'?6.5:6.0,h:profile.h,palette:colors,style:profile.style};
      const venue=['inn','home'].includes(plot.service)?S().closed(w,opts):S().add(w,opts);regionalArchitecture(w,venue,profile);venues.push(venue);if(venue.door)doors.push(venue.door);
    }
    streets(w,plan,town,colors);regionalSquare(w,plan,town,profile,colors);if(E.ScenePerf)E.ScenePerf.batch(town,{cellSize:60});
    w.village={group:town,doors,venues,plan,name:profile.name,style:profile.style};
    fires(w);
  };
  V.services=SERVICES;V.palettes=PALETTES;V.profiles=PROFILES;V.pave=pave;V.pavingTexture=pavingTexture;E.Villages=V;
})();
