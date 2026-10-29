/* Aurenna landmarks: recognizable silhouettes on the existing venue footprints.
   All decoration stays outside the open central doorways; no additional lights. */
(() => {
  'use strict';
  const L={},TAU=Math.PI*2;
  function material(s,color,extra={}){
    const key=color+JSON.stringify(extra);
    if(!s.materials.has(key))s.materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,flatShading:true,...extra}));
    return s.materials.get(key);
  }
  function mesh(g,geometry,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.receiveShadow=true;g.add(m);return m;}
  function box(s,g,color,x,y,z,w,h,d,extra){return mesh(g,new THREE.BoxGeometry(w,h,d),material(s,color,extra),x,y,z);}
  function cylinder(s,g,color,x,y,z,r,h,n=8){return mesh(g,new THREE.CylinderGeometry(r,r,h,n),material(s,color),x,y,z);}
  function texture(s,w,h,paint){
    const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
    paint(x,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;s.textures.push(t);return t;
  }
  function face(s,g,map,x,y,z,w,h,name,backOffset=.012,backMap){
    const m=mesh(g,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,toneMapped:false}),x,y,z);m.name=name||'landmark-sign';
    const back=new THREE.Mesh(m.geometry,backMap?new THREE.MeshBasicMaterial({map:backMap,toneMapped:false}):m.material);back.name='landmark-sign-back';back.rotation.y=Math.PI;back.position.z=-backOffset;m.add(back);return m;
  }
  function board(s,g,title,subtitle,x,y,z,w,h,bg='#392342',fg='#ffdf86'){
    const t=texture(s,1024,256,(c,cw,ch)=>{
      c.fillStyle=bg;c.fillRect(0,0,cw,ch);c.strokeStyle=fg;c.lineWidth=12;c.strokeRect(10,10,cw-20,ch-20);
      c.lineWidth=3;c.strokeRect(28,28,cw-56,ch-56);c.textAlign='center';c.textBaseline='middle';c.fillStyle=fg;
      c.font='900 '+(subtitle?132:156)+'px Georgia,serif';c.fillText(title,cw/2,subtitle?105:132,cw-88);
      if(subtitle){c.fillStyle='#fff4d7';c.font='bold 43px Georgia,serif';c.fillText(subtitle,cw/2,204,cw-90);}
    });
    box(s,g,'#bb8d39',x,y,z-.18,w+.24,h+.24,.32);
    return face(s,g,t,x,y,z+.015,w,h,'landmark-'+title.toLowerCase(),.38);
  }
  function localGroup(s,v,name){const g=new THREE.Group();g.name=name;g.position.set(v.x,v.y,v.z);g.rotation.y=v.rotation||0;s.group.add(g);return g;}
  function support(s,w,v,g,x,z,h,color,width=.52){
    box(s,g,color,x,h/2,z,width,h,.66);box(s,g,'#e3c378',x,.18,z,width+.30,.36,.88);
    const p=E.Shopfronts.point(v,x,z);w.colliders.push({...p,r:width*.57,city:true,venue:v.id,landmark:true});
  }
  function bulbs(s,g,points){
    const geo=new THREE.SphereGeometry(.115,6,4),matrix=new THREE.Matrix4();
    for(let phase=0;phase<3;phase++){
      const pts=points.filter((_,i)=>i%3===phase),mat=new THREE.MeshBasicMaterial({color:'#ffdf8c',toneMapped:false});
      const inst=new THREE.InstancedMesh(geo,mat,pts.length);inst.name='marquee-bulbs-'+phase;inst.userData.noStaticBatch=true;
      pts.forEach((p,i)=>{matrix.makeTranslation(...p);inst.setMatrixAt(i,matrix);});g.add(inst);s.bulbs.push({mat,phase});
    }
  }
  function playingCard(s,g,x,y,z,rank,suit,angle){
    const card=new THREE.Group();card.position.set(x,y,z);card.rotation.z=angle;g.add(card);
    box(s,card,'#e4bd67',0,0,0,1.85,2.65,.20);
    const t=texture(s,160,224,c=>{
      c.fillStyle='#fff2ce';c.fillRect(0,0,160,224);c.strokeStyle='#b68a44';c.lineWidth=6;c.strokeRect(5,5,150,214);
      c.fillStyle=suit==='♠'?'#2c343c':'#a94151';c.textAlign='left';c.font='bold 45px Georgia,serif';c.fillText(rank,17,48);
      c.textAlign='center';c.font='bold 105px Georgia,serif';c.fillText(suit,80,157);
    });
    face(s,card,t,0,0,.115,1.71,2.50,'casino-card-'+rank,.23);
  }
  function die(s,g,x,y,z,angle){
    const d=new THREE.Group();d.position.set(x,y,z);d.rotation.set(.14,angle,.12);g.add(d);box(s,d,'#fae8bc',0,0,0,1.42,1.42,1.42);
    const mat=material(s,'#54324f'),geo=new THREE.CircleGeometry(.115,8);
    for(const [a,b]of[[-.37,-.37],[.37,-.37],[0,0],[-.37,.37],[.37,.37]])mesh(d,geo,mat,a,b,.718);
    for(const [a,b]of[[-.33,-.33],[.33,.33]]){const p=mesh(d,geo,mat,.718,a,b);p.rotation.y=Math.PI/2;}
    for(const [a,b]of[[-.33,-.33],[.33,.33],[0,0]]){const p=mesh(d,geo,mat,a,.718,b);p.rotation.x=-Math.PI/2;}
  }
  function casino(s,w,v){
    const g=localGroup(s,v,'landmark-casino-fortuna'),front=v.d/2+.30;
    for(const side of[-1,1]){
      support(s,w,v,g,side*5.72,front,7.25,'#68456f',.64);
      box(s,g,'#e2bb65',side*5.72,3.5,front+.36,.19,6.35,.10);
      box(s,g,'#e2bb65',side*5.72,7.20,front,1.04,.35,1.05);
      // A pair of giant dice anchors the sign to the portico capitals.
      die(s,g,side*5.25,8.14,front,side*.22);
    }
    board(s,g,'CASSINO','FORTUNA DOURADA',0,6.25,front+.46,10.55,2.28);
    // Shopfronts.update toggles the old mesh; its unique material stays hidden.
    if(v.signMesh&&v.signMesh.material)v.signMesh.material.visible=false;
    const oldSign=w.scene.getObjectByName('fortuna-readable-facade');if(oldSign)oldSign.visible=false;
    box(s,g,'#64426f',0,4.90,front,12.2,.28,1.20);
    box(s,g,'#e2bb65',0,4.73,front+.58,12.35,.12,.15);
    // The crown is deliberately oversized so it reads across the plaza.
    playingCard(s,g,-2.05,9.30,front-.12,'A','♦',.27);
    playingCard(s,g,2.05,9.30,front-.12,'K','♠',-.27);
    playingCard(s,g,0,9.55,front+.05,'A','♥',0);
    board(s,g,'777','',0,8.25,front+.53,3.6,1.10,'#6f3156','#ffe197');
    const pts=[];
    for(let x=-5.45;x<=5.46;x+=.47){pts.push([x,5.00,front+.72],[x,7.50,front+.72]);}
    for(const x of[-5.45,5.45])for(let y=5.42;y<7.4;y+=.43)pts.push([x,y,front+.72]);
    bulbs(s,g,pts);
    s.landmarks.push({service:'casino',x:v.x,z:v.z,top:v.y+11.10});
  }
  function ellipseBand(s,g,y,rx,rz,color,height=.25,doorGap=false){
    // A shallow, faceted ring gives the arena its curved Roman silhouette.
    const outer=new THREE.Shape(),hole=new THREE.Path(),n=36;
    const angle=i=>doorGap?.52+i/n*(TAU-1.04):i/n*TAU;
    for(let i=0;i<=n;i++){const a=angle(i),x=Math.sin(a)*rx,z=Math.cos(a)*rz;i?outer.lineTo(x,z):outer.moveTo(x,z);}
    for(let i=n;i>=0;i--){const a=angle(i),x=Math.sin(a)*(rx-.42),z=Math.cos(a)*(rz-.42);if(doorGap)outer.lineTo(x,z);else i<n?hole.lineTo(x,z):hole.moveTo(x,z);}
    if(doorGap)outer.closePath();else outer.holes.push(hole);
    const geo=new THREE.ExtrudeGeometry(outer,{depth:height,bevelEnabled:false,curveSegments:1});geo.rotateX(Math.PI/2);
    return mesh(g,geo,material(s,color),0,y,0);
  }
  function shield(s,g,x,y,z,width=2.1,height=2.65){
    const shape=new THREE.Shape();shape.moveTo(-.5,.5);shape.lineTo(.5,.5);shape.lineTo(.46,-.12);shape.lineTo(0,-.56);shape.lineTo(-.46,-.12);shape.closePath();
    const shield=mesh(g,new THREE.ShapeGeometry(shape),material(s,'#e2bd6b',{side:THREE.DoubleSide}),x,y,z);shield.scale.set(width,height,1);
    let map;
    map=texture(s,256,256,c=>{
      c.clearRect(0,0,256,256);c.fillStyle='#7f3442';c.beginPath();c.moveTo(29,27);c.lineTo(227,27);c.lineTo(213,149);c.lineTo(128,225);c.lineTo(43,149);c.closePath();c.fill();
      if(E.Icons)E.Icons.paint(c,'dragon',57,47,142,()=>{if(map)map.needsUpdate=true;});
    });
    const emblem=mesh(g,new THREE.PlaneGeometry(width*.94,height*.91),new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.05,toneMapped:false}),x,y,z+.02);emblem.name='aurenna-dragon-shield';
  }
  function coliseum(s,w,v){
    const g=localGroup(s,v,'landmark-coliseum-arcades'),rx=v.w/2-.35,rz=v.d/2-.45,n=18;
    for(const y of[.32,4.62,8.98])ellipseBand(s,g,y,rx+.18,rz+.18,y>8?'#dcc9a3':'#b49b73',y>8?.40:.28,y<1);
    for(let i=0;i<n;i++){
      const a=i/n*TAU,x=Math.sin(a)*rx,z=Math.cos(a)*rz;
      // The front bay is the actual open doorway; its nearest piers are ±3.3.
      if(Math.cos(a)>.85&&Math.abs(x)<2.8)continue;
      const p=new THREE.Group();p.position.set(x,0,z);p.rotation.y=a;g.add(p);
      box(s,p,'#c9b38c',0,4.48,0,.47,8.96,.54);
      for(const y of[.3,4.56,8.92])box(s,p,'#e2d1ac',0,y,.01,.72,.25,.77);
      const at=E.Shopfronts.point(v,x,z);w.colliders.push({...at,r:.30,city:true,venue:v.id,landmark:true});
      if(i===0)continue;
      const mid=(i+.5)/n*TAU,mx=Math.sin(mid)*rx,mz=Math.cos(mid)*rz;
      if(Math.cos(mid)>.85&&Math.abs(mx)<2.8)continue;
      const arch=new THREE.Group();arch.position.set(mx,0,mz);arch.rotation.y=mid;g.add(arch);
      for(const y of[3.08,7.42]){
        const arc=mesh(arch,new THREE.TorusGeometry(.82,.18,4,12,Math.PI),material(s,'#dfcca6'),0,y,.10);arc.scale.y=1.10;
        for(const side of[-1,1])box(s,arch,'#d7c29a',side*.82,y-.64,.10,.22,1.32,.36);
      }
    }
    // Thick gateway piers carry the main sign and remain outside the walk-in lane.
    for(const side of[-1,1]){
      support(s,w,v,g,side*3.30,v.d/2+.18,6.10,'#b79c75',.72);
      box(s,g,'#d9c59f',side*3.30,5.93,v.d/2+.18,1.0,.35,1.0);
      box(s,g,'#913f4f',side*5.05,7.18,v.d/2+.25,1.22,2.45,.08);
      box(s,g,'#d6b775',side*5.05,8.48,v.d/2+.26,1.55,.15,.20);
      shield(s,g,side*5.05,7.30,v.d/2+.31,.72,.95);
    }
    board(s,g,'COLISEU','DE AURENNA',0,5.72,v.d/2+.91,9.25,1.40,'#65313b','#f6df9c');
    box(s,g,'#b49b73',0,7.34,v.d/2+.13,3.20,3.15,.60);
    shield(s,g,0,7.87,v.d/2+.49,2.72,2.92);
    for(const a of[-2.15,-1.08,1.08,2.15]){
      const x=Math.sin(a)*rx,z=Math.cos(a)*rz;cylinder(s,g,'#ac8b56',x,9.82,z,.055,1.6,5);
      const pennant=box(s,g,'#9c4654',x+.40,10.20,z,.82,.60,.035);pennant.rotation.y=a;
      mesh(g,new THREE.OctahedronGeometry(.14,0),material(s,'#e8c778'),x,10.68,z);
    }
    s.landmarks.push({service:'arena',x:v.x,z:v.z,top:v.y+10.82});
  }
  function wayfinding(s,w){
    const x=2.8,z=-12.5,g=new THREE.Group();g.name='aurenna-landmark-signpost';g.position.set(x,w.groundAt(x,z),z);s.group.add(g);
    cylinder(s,g,'#806042',0,2.02,0,.105,4.04,6);cylinder(s,g,'#b69a61',0,.16,0,.31,.32,8);
    mesh(g,new THREE.OctahedronGeometry(.23,0),material(s,'#e1c277'),0,4.27,0);
    const names=[['CASSINO',-1,'#4c2b5d'],['COLISEU',1,'#6a3640']];
    names.forEach(([label,dir,color],i)=>{
      const y=3.72-i*.80,draw=direction=>texture(s,512,128,(c,cw,ch)=>{
        c.fillStyle=color;c.fillRect(0,0,cw,ch);c.strokeStyle='#ecd18e';c.lineWidth=6;c.strokeRect(4,4,cw-8,ch-8);
        c.fillStyle='#fff0bc';c.font='bold 60px Georgia,serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,cw/2+(direction<0?22:-22),66,cw-120);
        c.beginPath();if(direction<0){c.moveTo(27,64);c.lineTo(77,30);c.lineTo(77,98);}else{c.moveTo(485,64);c.lineTo(435,30);c.lineTo(435,98);}c.closePath();c.fill();
      });
      box(s,g,'#856542',0,y,0,3.72,.72,.17);face(s,g,draw(dir),0,y,.101,3.62,.65,'wayfinding-'+label.toLowerCase(),.202,draw(-dir));
    });
    w.colliders.push({x,z,r:.24,city:true,landmark:true});
  }
  function entranceCarpet(s,w,v){
    const g=localGroup(s,v,'landmark-entrance-carpet-'+v.service),hd=v.d/2;
    const strip=(left,right,near,far,color,offset)=>{
      const zs=[near,hd+2.2,far].filter((z,i,a)=>z>=near&&z<=far&&a.indexOf(z)===i).sort((a,b)=>a-b),positions=[];
      const point=(x,z)=>{const p=E.Shopfronts.point(v,x,z);return[x,w.groundAt(p.x,p.z)-v.y+offset,z];};
      for(let i=0;i<zs.length-1;i++){
        const a=point(left,zs[i]),b=point(right,zs[i]),c=point(left,zs[i+1]),d=point(right,zs[i+1]);positions.push(...a,...c,...b,...b,...c,...d);
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();mesh(g,geo,material(s,color,{side:THREE.DoubleSide}));
    };
    strip(-1.48,1.48,hd+.50,hd+3,'#9d384e',.021);
    for(const side of[-1,1])strip(side<0?-1.55:1.48,side<0?-1.48:1.55,hd+.50,hd+3,'#e1bb64',.023);
    strip(-1.55,1.55,hd+2.90,hd+3,'#e1bb64',.023);
  }
  L.build=w=>{
    if(!w||w.cave||!w.reg||!w.reg.metro||w.landmarkFacades)return;
    const s=w.landmarkFacades={group:new THREE.Group(),materials:new Map(),textures:[],bulbs:[],landmarks:[],lightStep:-1};s.group.name='aurenna-landmark-facades';w.scene.add(s.group);
    const casinoVenue=(w.venues||[]).find(v=>v.service==='casino'),arenaVenue=(w.venues||[]).find(v=>v.service==='arena');
    if(casinoVenue){casino(s,w,casinoVenue);entranceCarpet(s,w,casinoVenue);}if(arenaVenue){coliseum(s,w,arenaVenue);entranceCarpet(s,w,arenaVenue);}wayfinding(s,w);
    if(E.ScenePerf)s.batch=E.ScenePerf.batch(s.group,{cellSize:36});L.update(w,0,0);
  };
  L.update=(w,t)=>{
    const s=w&&w.landmarkFacades;if(!s)return;const step=Math.floor((t||0)*5);if(step===s.lightStep)return;s.lightStep=step;
    for(const b of s.bulbs)b.mat.color.setHex((step+b.phase)%3===0?0xffffff:0xffc85c);
  };
  // The world's shared scene disposer owns geometry/material/texture cleanup.
  L.dispose=w=>{if(w)w.landmarkFacades=null;};
  E.LandmarkFacades=L;
})();
