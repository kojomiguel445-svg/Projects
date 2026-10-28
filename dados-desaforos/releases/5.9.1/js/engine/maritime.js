/* Fishing boats use the active game calendar. A rental never abandons a player at sea. */
(() => {
  'use strict';
  const M={},hero=()=>E.Store.hero(),clock=()=>E.Sim.clock(),result=(ok,message,extra={})=>Object.assign({ok,message},extra);
  const terrain=(w,x,z)=>w.terrainAt?w.terrainAt(x,z):w.height(x,z);
  const surface=(w,x,z)=>w.groundAt?w.groundAt(x,z):terrain(w,x,z);
  const clear=(w,x,z,r=.95)=>{if(Math.hypot(x,z)>w.bound-2)return false;for(const[dx,dz]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]])if(w.waterLevel-terrain(w,x+dx,z+dz)<.62)return false;return true;};
  const solid=(w,x,z)=> (w.nearColliders?w.nearColliders(x,z):w.colliders||[]).some(c=>Math.hypot(x-c.x,z-c.z)<(c.r||.3)+.5);
  const near=(w,p,r=5)=>w&&w.hero&&p&&Math.hypot(w.hero.x-p.x,w.hero.z-p.z)<=r;
  M.data=(h=hero())=>{if(!h)return null;const d=h.maritime=h.maritime&&typeof h.maritime==='object'?h.maritime:{};d.version=1;return d;};
  M.isSailing=w=>!!(w&&w.hero&&w.hero.boat);
  M.rental=(h=hero())=>{const d=M.data(h);return d&&d.rental||null;};
  M.price=r=>E.Settlements&&E.Settlements.price?E.Settlements.price(r,180):r==='aurenna'?297:180;
  M.duration=480; // Two full game days, with a free escorted return when time expires.
  function openSea(w,x,z){
    if(!(w.reg.metro||w.reg.biome==='coast'))return false;
    for(let k=0;k<12;k++){const a=k*Math.PI/6,dx=Math.cos(a),dz=Math.sin(a);let water=true,edge=false;for(let r=3;r<w.bound*2;r+=3){const px=x+dx*r,pz=z+dz*r;if(Math.hypot(px,pz)>w.bound-4){edge=true;break;}if(w.waterLevel-terrain(w,px,pz)<.62){water=false;break;}}if(water&&edge)return true;}
    return false;
  }
  M.findHarbor=w=>{
    if(!w||w.cave)return null;const spots=(w.fishSpots||[]).flatMap(s=>{const distance=Math.hypot(s.wx-s.x,s.wz-s.z)||1,dx=(s.wx-s.x)/distance,dz=(s.wz-s.z)/distance;return[-2.8,2.8,-5.6,5.6].map(side=>({x:s.x-dz*side,z:s.z+dx*side,wx:s.wx-dz*side,wz:s.wz+dx*side}));});
    // On coastal regions prefer the open ocean, rather than an inland pond.
    if(w.reg.metro)for(let z=30;z<=42;z+=1.5)for(const x of[-16,-12,-20,-8,0,8,16,24])spots.unshift({x,z,wx:x,wz:z+7});
    if(w.reg.biome==='coast')for(let z=-45;z<=45;z+=5)for(let x=12;x<=65;x+=3)if(surface(w,x,z)>w.waterLevel+.08&&surface(w,x,z)<w.waterLevel+1.5)spots.push({x,z,wx:x+7,wz:z});
    const occupied=(x,z)=>(w.venues||[]).some(v=>{const a=v.rotation||0,c=Math.cos(a),s=Math.sin(a),dx=x-v.x,dz=z-v.z;return Math.abs(c*dx-s*dz)<v.w/2+1.25&&Math.abs(s*dx+c*dz)<v.d/2+1.25;})||(w.interactables||[]).some(i=>!['venue','citizen','customer','herb','lume'].includes(i.kind)&&Math.hypot(x-i.x,z-i.z)<(i.kind==='fish'?2.4:3.5));
    let best=null,score=Infinity;const reference=(w.venues||[]).find(v=>v.service==='pier')||w.village&&w.village.plan||{x:0,z:0};
    for(const s of spots){const sy=surface(w,s.x,s.z);if(!Number.isFinite(sy)||sy<w.waterLevel+.08||sy>w.waterLevel+2.5||solid(w,s.x,s.z)||occupied(s.x,s.z))continue;
      const dist=Math.hypot(s.wx-s.x,s.wz-s.z);if(dist<.1)continue;const dx=(s.wx-s.x)/dist,dz=(s.wz-s.z)/dist;
      for(let r=5;r<=11;r+=1.5){const x=s.x+dx*r,z=s.z+dz*r;if(!clear(w,x,z)||solid(w,x,z))continue;const dockLength=Math.max(.85,Math.min(4,r-2.35));let crossing=false;for(let k=1;k<=3;k++)if(occupied(s.x+dx*dockLength*k/3,s.z+dz*dockLength*k/3)){crossing=true;break;}if(crossing)continue;
        const sea=openSea(w,x,z),cost=Math.hypot(s.x-reference.x,s.z-reference.z)+(sea?-150:0);if(cost<score){score=cost;best={shore:{x:s.x,z:s.z,y:sy},launch:{x,z},region:w.id,sea,name:sea?'Cais do Mar Aberto':'Ancoradouro do Lago'};}break;
      }
    }
    return best;
  };
  M.build=w=>{
    if(!w||w.cave)return null;w.maritimeHarbor=M.findHarbor(w);if(w.maritimeHarbor&&E.MaritimeGfx)E.MaritimeGfx.build(w);
    const r=M.rental();if(r&&r.region===w.id&&r.expiresAt<=clock().elapsed){if(w.hero&&terrain(w,w.hero.x,w.hero.z)<w.waterLevel-.5&&w.maritimeHarbor)M.returnToHarbor(hero(),w,true);else{M.data().rental=null;E.Store.save();}}
    else if(r&&r.region===w.id&&w.hero&&clear(w,w.hero.x,w.hero.z)){Object.assign(w.hero,{boat:true,y:w.waterLevel+.32,jump:0,vy:0,swim:false});w.maritimeLast={x:w.hero.x,z:w.hero.z};}
    return w.maritimeHarbor;
  };
  M.rent=(h=hero(),w=E.WG.world)=>{
    const harbor=w&&w.maritimeHarbor;if(!h||!harbor||!near(w,harbor.shore))return result(false,'Vá à placa do ancoradouro para alugar o barco.');
    const old=M.rental(h);if(old&&old.expiresAt>clock().elapsed)return result(false,'Você já possui um barco alugado. Devolva-o no cais antes de fazer outro contrato.');
    const cost=M.price(w.id);if(!Number.isFinite(h.gold)||h.gold<cost)return result(false,`O aluguel custa ${cost} po por dois dias do jogo.`);
    h.gold-=cost;M.data(h).rental={region:w.id,startedAt:clock().elapsed,expiresAt:clock().elapsed+M.duration,cost,shore:{...harbor.shore},launch:{...harbor.launch},sea:harbor.sea};E.Store.save();return result(true,'Barco reservado por dois dias do jogo. Aproxime-se e embarque; o retorno ao cais está incluído.',{cost});
  };
  M.embark=(h=hero(),w=E.WG.world)=>{
    const r=M.rental(h),harbor=w&&w.maritimeHarbor;if(!r||!harbor||r.region!==w.id||r.expiresAt<=clock().elapsed)return result(false,'Alugue um barco válido neste ancoradouro.');
    if(!near(w,harbor.shore,7)&&!near(w,harbor.launch,4))return result(false,'Aproxime-se do cais para embarcar.');
    if(!clear(w,harbor.launch.x,harbor.launch.z))return result(false,'A passagem para o barco está obstruída.');
    const p=w.hero;Object.assign(p,{x:harbor.launch.x,z:harbor.launch.z,y:w.waterLevel+.32,boat:true,boatYaw:Math.atan2(harbor.launch.x-harbor.shore.x,harbor.launch.z-harbor.shore.z),jump:0,vy:0,swim:false,sprinting:false,climb:false});if(w.closeGlider)w.closeGlider();w.maritimeLast={x:p.x,z:p.z};E.WG.input.keys={};E.Store.save();return result(true,'A bordo. Use os controles de movimento para remar. Interagir abre a linha de pesca ou o retorno ao cais.');
  };
  M.returnToHarbor=(h=hero(),w=E.WG.world,expired=false)=>{
    if(!w||!w.hero)return result(false,'Barco indisponível.');const r=M.rental(h),p=w.maritimeHarbor&&w.maritimeHarbor.shore||r&&r.shore;if(!p)return result(false,'Ancoradouro indisponível.');
    if(E.Fishing&&E.Fishing.cancel)E.Fishing.cancel();Object.assign(w.hero,{x:p.x,z:p.z,y:surface(w,p.x,p.z),boat:false,swim:false,jump:0,vy:0,sprinting:false,moving:false});E.WG.input.keys={};w.maritimeLast=null;
    if(expired)M.data(h).rental=null;E.Store.save();return result(true,expired?'O aluguel terminou. O barqueiro acompanhou seu retorno ao cais, sem cobrança extra.':'Você atracou em segurança. O barco continua disponível até o contrato vencer.');
  };
  M.endRental=(h=hero(),w=E.WG.world)=>{if(!w||!w.maritimeHarbor||!near(w,w.maritimeHarbor.shore,7))return result(false,'Devolva o barco na placa do cais.');if(M.isSailing(w))M.returnToHarbor(h,w);M.data(h).rental=null;E.Store.save();return result(true,'Barco devolvido. Não há cobrança adicional; o período pago não é reembolsado.');};
  M.blocked=(w,x,z)=>!clear(w,x,z)||solid(w,x,z);
  M.fishingSpot=w=>{
    if(!M.isSailing(w)||!M.rental()||M.blocked(w,w.hero.x,w.hero.z))return null;const p=w.hero,sea=!!(w.maritimeHarbor&&w.maritimeHarbor.sea)&&openSea(w,p.x,p.z),key=`barco:${Math.floor(p.x/10)}:${Math.floor(p.z/10)}`;
    const spots=w.maritimeFishing||(w.maritimeFishing=new Map());let spot=spots.get(key);if(!spot){spot={i:key,left:8,post:[],fromBoat:true};spots.set(key,spot);if(spots.size>32)spots.delete(spots.keys().next().value);}
    const yaw=p.boatYaw||0;Object.assign(spot,{x:p.x,z:p.z,wx:p.x+Math.sin(yaw+.8)*3,wz:p.z+Math.cos(yaw+.8)*3,biome:sea?'sea':w.reg.biome,seaOnly:sea,fromBoat:true});return spot;
  };
  M.update=(w,dt)=>{
    if(!w||!w.hero)return;const h=hero(),p=w.hero,r=M.rental(h);
    if(p.boat){if(!r||r.region!==w.id||r.expiresAt<=clock().elapsed){const res=M.returnToHarbor(h,w,true);E.UI&&E.UI.toast(res.message);}
      else{const prev=w.maritimeLast||{x:p.x,z:p.z},dx=p.x-prev.x,dz=p.z-prev.z;if(M.blocked(w,p.x,p.z)){p.x=prev.x;p.z=prev.z;}else if(Math.hypot(dx,dz)>.003)p.boatYaw=Math.atan2(dx,dz);Object.assign(p,{y:w.waterLevel+.32,jump:0,vy:0,swim:false,climb:false,sprinting:false});w.maritimeLast={x:p.x,z:p.z};}
    }else if(r&&r.expiresAt<=clock().elapsed){M.data(h).rental=null;E.Store.save();}
    if(E.MaritimeGfx)E.MaritimeGfx.update(w,dt||0);
    if(p.boat&&!(w.maritimeVisual&&w.maritimeVisual.boatInteraction)){if(!w.maritimeInteraction){w.maritimeInteraction={kind:'venue',service:'pier',action:'boat',region:w.id,r:2.3,label:'Pescar do barco ou voltar ao cais',boatHarbor:true};w.interactables.push(w.maritimeInteraction);}Object.assign(w.maritimeInteraction,{x:p.x,z:p.z});}
    else if(w.maritimeInteraction){w.interactables=w.interactables.filter(i=>i!==w.maritimeInteraction);w.maritimeInteraction=null;}
  };
  M.dispose=w=>{if(E.MaritimeGfx)E.MaritimeGfx.dispose(w);if(w&&w.hero)w.hero.boat=false;};
  E.Maritime=M;
})();
