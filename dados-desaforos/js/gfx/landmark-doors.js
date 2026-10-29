/* Duas portas físicas de Aurenna: atravesse a soleira para entrar ou sair. */
(() => {
  'use strict';
  const D = {}, states = new WeakMap();
  const local = (v, p) => {
    const dx = p.x-v.x, dz = p.z-v.z, c = Math.cos(v.rotation||0), s = Math.sin(v.rotation||0);
    return { x:c*dx-s*dz, z:s*dx+c*dz };
  };
  const point = (v,x,z) => E.Shopfronts.point(v,x,z);
  const available = () => E.Store.hero() && !E.UI.anyOpen() && !document.querySelector('.flash') && !(E.WorldServices && E.WorldServices.active);
  D.build = w => {
    if (!w.reg.metro) return;
    const doors = (w.venues||[]).filter(v=>v.service==='casino'||v.service==='arena');
    states.set(w,{ doors, previous:{x:w.hero.x,z:w.hero.z}, cooldown:0 });
    // The automatic threshold opens the gate before the player reaches its bars.
    w.colliders = w.colliders.filter(c=>!c.arenaGateBarrier);
    for (const v of doors) {
      if (v.service==='casino') {
        const p=point(v,0,v.d/2+1.35);
        w.interactables.push({kind:'venue',service:'casino',action:'casino-enter',region:w.id,venue:v,venueId:v.id,...p,r:1.9,label:'Entrar no Cassino · caminhe pela porta',icon:E.Icons.html('casino',{decorative:true})});
      }
    }
  };
  D.enter = async (w,v) => {
    const state=states.get(w);
    if (!state || state.pending || E.WG.world!==w || E.WG.mode()!=='world' || !available()) return false;
    const wasLocked=E.WG.locked; state.pending=true; E.WG.locked=true;
    try {
      return v.service==='arena' ? await E.ArenaLife.enter(w.id) : !!(await E.CasinoInterior.enter(v));
    } catch (error) {
      console.error(error); E.UI.toast('Não foi possível abrir a porta.'); return false;
    } finally {
      state.pending=false;
      if (E.WG.world===w && !E.Interior.current) E.WG.locked=wasLocked;
    }
  };
  D.update = (w,dt) => {
    const state=states.get(w); if (!state) return;
    const h=w.hero, previous=state.previous; state.previous={x:h.x,z:h.z};
    state.cooldown=Math.max(0,state.cooldown-dt);
    if (state.pending || state.cooldown>0 || E.WG.mode()!=='world' || E.WG.locked || !h.moving || h.jump>.15 || h.swim || h.boat || !available()) return;
    for (const v of state.doors) {
      const before=local(v,previous), now=local(v,h), threshold=v.d/2+1.35;
      if (Math.abs(now.x)<1.95 && before.z>threshold && now.z<=threshold && now.z>threshold-1.0) {
        D.enter(w,v); return;
      }
    }
  };
  D.opened = c => {
    if (!['casino','coliseum'].includes(c.kind)) return;
    const w=E.WG.world, state=states.get(w); if (!state) return;
    const v=c.worldVenue||state.doors.find(v=>v.service===(c.kind==='casino'?'casino':'arena')); if (!v) return;
    c.worldVenue=v;
    c.doorway=c.doorway||{x:0,z:8.8,width:2.5};
    c._doorPrevious={x:c.hero.x,z:c.hero.z};
    const beforeClose=c.onClose;
    c.onClose=room=>{
      if (beforeClose) beforeClose(room);
      if (E.WG.world!==w) return;
      const p=point(v,0,v.d/2+3.05),h=w.hero;
      Object.assign(h,{x:p.x,z:p.z,y:w.groundAt(p.x,p.z),jump:0,vy:0,moving:false,casinoSeat:false});
      if (w.closeGlider) w.closeGlider();
      state.previous={x:p.x,z:p.z}; state.cooldown=.6;
      E.state.world.pos={x:p.x,z:p.z};
    };
  };
  D.updateInterior = c => {
    if (!c.doorway || !c.worldVenue || !c._doorPrevious) return false;
    const before=c._doorPrevious,h=c.hero,door=c.doorway;c._doorPrevious={x:h.x,z:h.z};
    if (c.moving && available() && Math.abs(h.x-door.x)<door.width/2 && before.z<door.z && h.z>=door.z) {
      E.Interior.close();return true;
    }
    return false;
  };
  E.LandmarkDoors=D;
})();
