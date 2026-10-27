/* Mesas compradas, equipe e visitantes do salão pertencem ao próprio cenário. */
(() => {
  'use strict';
  const C={},slots=[[-3.2,-.7],[3.2,-.7],[-3.2,2.2]],B=()=>E.CasinoBusiness;
  let appearances=null;
  function frames(){
    if(!appearances)appearances=Array.from({length:5},(_,i)=>{
      const n={name:'Visitante do salão',look:{skin:['#f1d2b2','#c88b64','#986346'][i%3],hair:['#302c3b','#865537','#c7a872'][i%3],outfit:['#71587f','#a6864f','#557f83','#913f57','#354e70'][i]}};
      return ['idle0','idle1','walk0','walk1','walk2','walk3'].map(f=>E.SP.npc(n,f));
    });return appearances;
  }
  const world=(v,x,z)=>E.Shopfronts.point(v,x,z);
  const ground=(w,p)=>w.groundAt(p.x,p.z)+.03;
  function tex(s,canvas){if(!s.textures.has(canvas)){const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;s.textures.set(canvas,t);}return s.textures.get(canvas);}
  function actor(w,s,key,name,it){
    const fs=frames()[s.serial++%5],sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex(s,fs[0]),transparent:true,alphaTest:.4}));sp.center.set(.5,.02);sp.scale.set(2.05*fs[0].width/fs[0].height,2.05,1);sp.name=name;s.group.add(sp);
    const node={key,sp,frames:fs,x:0,z:0,phase:'arriving',time:0,frameAt:0,next:0,width:sp.scale.x};
    if(it){node.it={...it,kind:'venue',service:'player-casino',region:w.id,venue:s.venue,venueId:s.venue.id,sprite:sp,group:sp,r:1.9,icon:E.Icons.html('chat',{decorative:true})};w.interactables.push(node.it);}
    return node;
  }
  function retire(w,s,node){s.group.remove(node.sp);node.sp.material.dispose();if(node.it)w.interactables=w.interactables.filter(it=>it!==node.it);}
  C.build=w=>{
    if(!w||w.cave||w.casinoLife||!B())return;
    const venue=(w.venues||[]).find(v=>v.service==='player-casino');if(!venue)return;
    const group=new THREE.Group();group.name='player-casino-life';w.scene.add(group);
    w.casinoLife={venue,group,tables:new Map(),guests:new Map(),staff:new Map(),textures:new Map(),serial:0,time:0,nextSync:0,lastRound:null};C.sync(w);
  };
  C.sync=w=>{
    const s=w&&w.casinoLife,h=E.Store.hero();if(!s||!h)return;
    const data=B().data(h,w.id),valid=B().access(h,w.id);
    for(const [index,table]of data.tables.entries())if(!s.tables.has(table.id)){
      const def=B().TABLES[table.type],[x,z]=slots[index],it=E.Shopfronts.fixture(w,s.venue,{action:'casino-table',tableId:table.id,label:def.name,model:def.model,icon:'dice'},x,z);
      s.tables.set(table.id,{it,table,x,z});if(w.buildColliderGrid)w.buildColliderGrid();
    }
    const crew=valid?B().staff(h,w.id):[];
    for(const[id,node]of s.staff)if(!crew.some(e=>e.id===id)){retire(w,s,node);s.staff.delete(id);}
    crew.forEach((e,i)=>{
      let node=s.staff.get(e.id);if(!node){node=actor(w,s,e.id,'casino-employee',{action:'casino-staff',label:'Falar com '+e.name});s.staff.set(e.id,node);}
      const p=world(s.venue,i?1.2:-1.3,-s.venue.d*.32);node.x=p.x;node.z=p.z;node.active=e.active;node.sp.material.opacity=e.active?1:.55;
      if(node.it)Object.assign(node.it,{x:p.x,z:p.z});node.sp.position.set(p.x,ground(w,p),p.z);
    });
    const live=valid?data.clients.filter(c=>c.state==='waiting'):[];
    for(const[id,node]of s.guests)if(!live.some(c=>c.id===id)&&node.phase!=='leaving'){
      node.phase='leaving';node.next=0;node.route=[world(s.venue,0,s.venue.d/2-.4),world(s.venue,0,s.venue.d/2+5.8)];node.client.arrivedAtCounter=false;
      if(node.it){w.interactables=w.interactables.filter(it=>it!==node.it);node.it=null;}
    }
    live.forEach((client,index)=>{
      if(s.guests.has(client.id))return;const table=s.tables.get(client.tableId);if(!table)return;
      const node=actor(w,s,client.id,'casino-guest',{action:'casino-guest',clientId:client.id,label:'Receber '+client.name});node.client=client;client.arrivedAtCounter=false;
      const start=world(s.venue,0,s.venue.d/2+4.2),ahead=live.slice(0,index).filter(c=>c.tableId===client.tableId).length;
      node.x=start.x;node.z=start.z;node.route=[world(s.venue,0,s.venue.d/2-.1),world(s.venue,table.x,table.z+1.4+ahead*.85)];
      node.sp.position.set(node.x,ground(w,node),node.z);Object.assign(node.it,{x:node.x,z:node.z});s.guests.set(client.id,node);
    });
    const latest=data.history[0];if(latest&&latest.id!==s.lastRound){s.lastRound=latest.id;const table=data.tables.find(t=>t.type===latest.game);if(table)C.animate(w,table.id,latest);}
  };
  C.animate=(w,id,result)=>{
    const s=w&&w.casinoLife,node=s&&s.tables.get(id);if(!node)return;
    node.spin={time:0,roll:Number(result.roll)||0,from:node.it.group.userData.wheel?.rotation.y||0};
    if(result.round)s.lastRound=result.round.id;
  };
  C.update=(w,dt)=>{
    const s=w&&w.casinoLife;if(!s)return;dt=Math.min(.1,Math.max(0,dt||0));s.time+=dt;
    if(s.time>=s.nextSync){s.nextSync=s.time+.25;C.sync(w);}
    for(const node of s.staff.values())if(s.time>=node.frameAt){node.frameAt=s.time+.25;node.sp.material.map=tex(s,node.frames[Math.floor(s.time*1.5)%2]);}
    for(const[id,node]of s.guests){
      node.time+=dt;const target=node.route[node.next];let walking=false,dx=0,dz=0;
      if(target){dx=target.x-node.x;dz=target.z-node.z;const d=Math.hypot(dx,dz);if(d<.1)node.next++;else{walking=true;const step=Math.min(d,1.5*dt);node.x+=dx/d*step;node.z+=dz/d*step;}}
      else if(node.phase==='leaving'){retire(w,s,node);s.guests.delete(id);continue;}
      else{node.phase='waiting';node.client.arrivedAtCounter=true;}
      node.sp.position.set(node.x,ground(w,node),node.z);if(node.it)Object.assign(node.it,{x:node.x,z:node.z});
      if(s.time>=node.frameAt){node.frameAt=s.time+.13;node.sp.material.map=tex(s,node.frames[walking?2+Math.floor(node.time*7)%4:Math.floor(node.time*1.5)%2]);if(Math.abs(dx)>.01)node.sp.scale.x=node.width*(dx<0?-1:1);}
      node.sp.visible=!w.hero||Math.hypot(w.hero.x-node.x,w.hero.z-node.z)<65;
    }
    for(const n of s.tables.values())if(n.spin){
      const spin=n.spin;spin.time+=dt;const k=Math.min(1,spin.time/1.1),g=n.it.group.userData;
      if(g.wheel)g.wheel.rotation.y=spin.from+(Math.PI*8+spin.roll/37*Math.PI*2)*(1-Math.pow(1-k,3));
      for(const [i,die]of(g.dice||[]).entries()){die.rotation.set((1-k)*(7+i)*Math.PI,0,(1-k)*(5+i)*Math.PI+spin.roll*.22);die.position.y=1.22+Math.sin(k*Math.PI)*.5;}
      if(k===1)n.spin=null;
    }
  };
  C.dispose=w=>{const s=w&&w.casinoLife;if(!s)return;for(const n of [...s.guests.values(),...s.staff.values()])retire(w,s,n);for(const t of s.textures.values())t.dispose();w.casinoLife=null;};
  E.CasinoLife=C;
})();
