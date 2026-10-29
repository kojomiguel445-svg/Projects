/* Mesas compradas, equipe e visitantes do salão pertencem ao próprio cenário. */
(() => {
  'use strict';
  const C={},slots=[[-3.2,-.7],[3.2,-.7],[-3.2,2.2]],B=()=>E.CasinoBusiness;
  let appearances=null;
  function frames(){
    if(!appearances)appearances=Array.from({length:5},(_,i)=>{
      const n={name:'Visitante do salão '+(i+1),look:{skin:['#f1d2b2','#c88b64','#986346'][i%3],hair:['#302c3b','#865537','#c7a872'][i%3],outfit:['#71587f','#a6864f','#557f83','#913f57','#354e70'][i]}};
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
  function buildHouse(w){
    if(w.fortunaLife)return;const venue=(w.venues||[]).find(v=>v.service==='casino');if(!venue)return;
    const group=new THREE.Group();group.name='fortuna-house-life';w.scene.add(group);
    const s=w.fortunaLife={venue,group,textures:new Map(),serial:0,time:0,actors:[],machines:[],lights:[]};
    const m=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...extra});
    const box=(g,color,x,y,z,sx,sy,sz,extra={})=>{const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m(color,extra));o.position.set(x,y,z);g.add(o);return o;};
    const arch=new THREE.Group();arch.position.set(venue.x,venue.y,venue.z);arch.rotation.y=venue.rotation||0;group.add(arch);const front=venue.d/2+.16;
    for(const x of[-venue.w/2+.55,venue.w/2-.55]){
      box(arch,'#cfb277',x,1.92,front,.22,3.84,.25);const lamp=box(arch,'#ffe3a0',x,3.53,front+.22,.31,.30,.18,{emissive:'#e9ba61',emissiveIntensity:.8});s.lights.push(lamp);
      const p=world(venue,x,front);w.colliders.push({...p,r:.20,city:true});
    }
    box(arch,'#ba9657',0,3.91,front,venue.w-.8,1.18,.22);
    const cv=document.createElement('canvas');cv.width=1024;cv.height=128;const c=cv.getContext('2d');c.fillStyle='#243c40';c.fillRect(0,0,1024,128);c.strokeStyle='#e4c178';c.lineWidth=5;c.strokeRect(8,8,1008,112);c.textAlign='center';c.fillStyle='#f4dc9c';c.font='bold 58px Cinzel,serif';c.fillText('CASSINO',512,63);c.fillStyle='#f7edd4';c.font='bold 28px Nunito,serif';c.fillText('F O R T U N A   D O U R A D A',512,104);
    const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;s.textures.set(cv,t);const sign=new THREE.Mesh(new THREE.PlaneGeometry(venue.w-1.02,1.05),new THREE.MeshBasicMaterial({map:t}));sign.name='fortuna-readable-facade';sign.position.set(0,3.91,front+.125);arch.add(E.Shopfronts.readable(sign));
    for(const [index,key]of ['cashier','blackjack','dice'].entries()){
      const fixture=(venue.fixtures||[]).find(f=>f.action===key);if(!fixture)continue;
      const n=actor(w,s,'house-staff-'+index,['Caixa Dália','Crupiê de Vinte-e-Um','Croupier dos dados'][index]);
      const p={x:fixture.x,z:fixture.z-.83};n.x=p.x;n.z=p.z;n.station=p;n.staff=true;n.sp.name='fortuna-staff-'+key;n.sp.position.set(p.x,ground(w,p),p.z);s.actors.push(n);
    }
    const routes=[[[0,3.5],[1.4,1.6],[1.4,-1.4],[4.9,-1.4],[4.9,3.5]],[[0,3.6],[-1.5,2.8],[-5.1,2.8],[-5.1,-1.4],[-1.5,-1.4]]];
    for(let i=0;i<5;i++){
      const n=actor(w,s,'house-visitor-'+i,'Visitante de Fortuna Dourada');n.route=routes[i%2].map(([x,z])=>world(venue,x,z));n.next=i%n.route.length;n.x=n.route[n.next].x;n.z=n.route[n.next].z;n.pause=i*.7;n.sp.position.set(n.x,ground(w,n),n.z);s.actors.push(n);
    }
    for(const fixture of venue.fixtures||[]){
      if(fixture.action==='blackjack'){
        const chair=new THREE.Group();fixture.group.add(chair);chair.name='blackjack-player-chair';chair.position.z=1.15;
        box(chair,'#704b39',0,.48,0,.65,.12,.60);box(chair,'#a17c4c',0,.86,.25,.65,.72,.10);for(const x of[-.24,.24])for(const z of[-.22,.22])box(chair,'#704b39',x,.24,z,.09,.48,.09);
      }
      if(fixture.action!=='slots')continue;
      const overlay=new THREE.Group();fixture.group.add(overlay);overlay.name='fortuna-animated-machine';
      const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;s.textures.set(canvas,texture);
      const face=new THREE.Mesh(new THREE.PlaneGeometry(1.07,.55),new THREE.MeshBasicMaterial({map:texture}));face.position.set(0,1.55,.535);overlay.add(face);
      const lever=new THREE.Group();lever.position.set(.91,.82,0);overlay.add(lever);box(lever,'#e0c080',0,.30,0,.07,.60,.07);const knob=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),m('#bd544a'));knob.position.y=.65;lever.add(knob);
      fixture.group.userData.casinoMachine={canvas,texture,lever,elapsed:0,reels:[0,2,5],round:null};s.machines.push(fixture.group.userData.casinoMachine);drawMachine(fixture.group.userData.casinoMachine);
    }
  }
  function drawMachine(machine){
    const x=machine.canvas.getContext('2d'),symbols=E.CasinoGames.SYMBOLS;x.fillStyle='#213a3e';x.fillRect(0,0,256,128);
    for(let i=0;i<3;i++){
      x.fillStyle='#f2e9cf';x.fillRect(8+i*83,12,74,102);x.fillStyle=['#a44843','#928145','#a47a27','#b28a31','#467e8e','#b34e43','#436f5a'][machine.reels[i]];x.font='bold 52px Georgia,serif';x.textAlign='center';x.textBaseline='middle';if(machine.reels[i]===6&&E.Icons)E.Icons.paint(x,'dragon',16+i*83,34,58,()=>{machine.texture.needsUpdate=true;});else x.fillText(symbols[machine.reels[i]].mark,45+i*83,65,64);
    }machine.texture.needsUpdate=true;
  }
  C.seat=anchor=>{
    if(anchor&&anchor.interior&&E.CasinoInterior)return E.CasinoInterior.seat(anchor);
    const w=E.WG&&E.WG.world,h=w&&w.hero;if(!h||!anchor||!anchor.venue)return;
    const rot=anchor.venue.rotation||0,p={x:anchor.x+Math.sin(rot)*1.15,z:anchor.z+Math.cos(rot)*1.15};
    h.casinoSeatReturn={x:h.x,z:h.z};h.x=p.x;h.z=p.z;h.casinoSeat=true;h.moving=false;
  };
  C.stand=()=>{if(E.CasinoInterior&&E.CasinoInterior.stand())return;const h=E.WG&&E.WG.world&&E.WG.world.hero;if(!h||!h.casinoSeat)return;h.casinoSeat=false;if(h.casinoSeatReturn){h.x=h.casinoSeatReturn.x;h.z=h.casinoSeatReturn.z;delete h.casinoSeatReturn;}};
  C.animateGame=(anchor,round)=>{
    if(anchor&&anchor.interior&&E.CasinoInterior)return E.CasinoInterior.animateGame(anchor,round);
    if(!anchor||!anchor.group)return;const machine=anchor.group.userData.casinoMachine;
    if(machine&&round.kind==='slots'){machine.round=round;machine.elapsed=0;machine.drawAt=-1;}
    const w=E.WG&&E.WG.world,s=w&&w.fortunaLife;if(s)s.cheer=1.6;
  };
  function updateHouse(w,dt){
    const s=w.fortunaLife;if(!s)return;s.time+=dt;s.cheer=Math.max(0,(s.cheer||0)-dt);
    for(const lamp of s.lights)lamp.material.emissiveIntensity=.72+Math.sin(s.time*2)*.10;
    for(const n of s.actors){
      let walking=false,dx=0;
      if(n.route){n.pause=Math.max(0,(n.pause||0)-dt);const p=n.route[n.next];dx=p.x-n.x;const dz=p.z-n.z,d=Math.hypot(dx,dz);if(n.pause<=0){if(d<.10){n.next=(n.next+1)%n.route.length;n.pause=1.3+n.next*.3;}else{walking=true;const step=Math.min(d,1.15*dt);n.x+=dx/d*step;n.z+=dz/d*step;}}}
      n.sp.position.set(n.x,ground(w,n)+(s.cheer&&!n.staff?Math.abs(Math.sin(s.time*9))*.09:0),n.z);
      if(s.time>=n.frameAt){n.frameAt=s.time+.14;n.sp.material.map=tex(s,n.frames[walking?2+Math.floor(s.time*6)%4:Math.floor(s.time*1.7)%2]);if(Math.abs(dx)>.02)n.sp.scale.x=n.width*(dx<0?-1:1);}
      n.sp.visible=!w.hero||Math.hypot(w.hero.x-n.x,w.hero.z-n.z)<65;
    }
    for(const m of s.machines)if(m.round){
      m.elapsed+=dt;const k=Math.min(1,m.elapsed/2.35);m.lever.rotation.x=-Math.sin(Math.min(1,m.elapsed/.55)*Math.PI)*.85;
      const frame=Math.floor(m.elapsed*18);if(frame!==m.drawAt){m.drawAt=frame;m.reels=m.reels.map((old,i)=>m.elapsed>[.5,1.26,2.30][i]?m.round.reels[i]:(frame+i*2)%7);drawMachine(m);}
      if(k===1){m.reels=[...m.round.reels];drawMachine(m);m.lever.rotation.x=0;m.round=null;}
    }
  }
  C.build=w=>{
    if(!w||w.cave)return;buildHouse(w);if(w.casinoLife||!B())return;
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
    dt=Math.min(.1,Math.max(0,dt||0));if(w)updateHouse(w,dt);const s=w&&w.casinoLife;if(!s)return;s.time+=dt;
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
  C.dispose=w=>{C.stand();const house=w&&w.fortunaLife;if(house){for(const t of house.textures.values())t.dispose();w.fortunaLife=null;}const s=w&&w.casinoLife;if(!s)return;for(const n of [...s.guests.values(),...s.staff.values()])retire(w,s,n);for(const t of s.textures.values())t.dispose();w.casinoLife=null;};
  E.CasinoLife=C;
})();
