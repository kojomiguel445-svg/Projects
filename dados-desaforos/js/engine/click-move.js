/* Mouse destinations feed the existing movement/physics in world3d and interiors. */
(() => {
  'use strict';
  const STEP = .8, MAX_NODES = 5000, ZERO = () => ({x:0,y:0,sprint:false});
  let route = null;
  const distance = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
  const roomFloor = (c,x,z) => c.floorAt ? c.floorAt(x,z) : .085;
  const covered = () => !!((E.UI && E.UI.anyOpen()) || document.querySelector('.modal-bg') || (E.WorldServices && E.WorldServices.active));
  function context() {
    const mode = E.WG.mode();
    if (mode === 'world' && E.WG.world && !E.WG.locked) return {mode,world:E.WG.world};
    const c = E.Interior && E.Interior.current;
    if (mode === 'interior' && c && !c.edit && !c.sleeping && !c.lockMove) return {mode,room:c};
    return null;
  }
  const owner = c => c.world || c.room;
  const hero = c => owner(c).hero;
  function free(c,x,z,from) {
    if (c.mode === 'interior') return E.Interior.physics.free(c.room,x,z);
    const w=c.world,h=w.hero,y=w.groundAt(x,z);
    if (!Number.isFinite(y) || Math.hypot(x,z)>w.bound) return false;
    if (h.boat && E.Maritime && E.Maritime.blocked(w,x,z)) return false;
    if (w.cave && (y<w.waterLevel-.35 || (from && y-w.groundAt(from.x,from.z)>1.6))) return false;
    // Keep route waypoints a fraction of a footstep away from open pit edges;
    // floating point rounding must not turn an exactly tangent path into a fall.
    if (w.cave && [[.18,0],[-.18,0],[0,.18],[0,-.18]].some(([dx,dz])=>w.groundAt(x+dx,z+dz)<w.waterLevel-.35)) return false;
    return !w.nearColliders(x,z).some(o => Math.hypot(x-o.x,z-o.z)<o.r+.35+.025);
  }
  function clear(c,a,b) {
    const n=Math.max(1,Math.ceil(distance(a,b)/.18));let last=a;
    for(let i=1;i<=n;i++) {
      const p={x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n};
      if(!free(c,p.x,p.z,last))return false;
      last=p;
    }
    return true;
  }
  // One bounded, local A* search. Every edge uses the same floor/collider rules
  // as movement; both orthogonal neighbours must be clear before a diagonal.
  function plan(c,destination) {
    const start={x:hero(c).x,z:hero(c).z};
    if(!free(c,destination.x,destination.z))return null;
    if(clear(c,start,destination))return [destination];
    const nodes=new Map(),heap=[];
    const push=n=>{heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;};
    const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;};
    const root={ix:0,iz:0,x:start.x,z:start.z,g:0,f:distance(start,destination),prev:null};
    nodes.set('0,0',root);push(root);let visited=0;
    while(heap.length&&visited++<MAX_NODES) {
      const a=pop();if(a.closed)continue;a.closed=true;
      if(distance(a,destination)<STEP*1.5&&clear(c,a,destination)) {
        const points=[destination];for(let n=a;n.prev;n=n.prev)points.push({x:n.x,z:n.z});points.reverse();
        // Remove only waypoints whose whole replacement segment is walkable.
        const smooth=[];let from=start,i=0;
        while(i<points.length){let j=i;while(j+1<points.length&&clear(c,from,points[j+1]))j++;smooth.push(points[j]);from=points[j];i=j+1;}
        return smooth;
      }
      for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++) {
        if(!ix&&!iz)continue;
        const nx=a.ix+ix,nz=a.iz+iz,key=nx+','+nz,p={x:start.x+nx*STEP,z:start.z+nz*STEP};
        if(!clear(c,a,p))continue;
        if(ix&&iz&&(!clear(c,a,{x:p.x,z:a.z})||!clear(c,a,{x:a.x,z:p.z})))continue;
        const g=a.g+STEP*Math.hypot(ix,iz),old=nodes.get(key);
        if(old&&old.g<=g)continue;
        const n={ix:nx,iz:nz,x:p.x,z:p.z,g,f:g+distance(p,destination),prev:a};nodes.set(key,n);push(n);
      }
    }
    return null;
  }
  function targets(c) {
    if(c.mode==='interior')return (c.room.fixtures||[]).filter(it=>it.g).map(it=>({it,obj:it.g}));
    const w=c.world;
    return (w.interactables||[]).map(it=>({it,obj:it.group||it.sprite||(it.citizen&&it.citizen.sp)||(it.customer&&it.customer.sprite)||(it.kind==='npc'&&(w.npcs||[]).find(n=>n.id===it.id)?.sprite)||(it.obj&&(it.obj.g||it.obj.sprite))})).filter(t=>t.obj&&t.obj.isObject3D);
  }
  function destination(c,p,target) {
    const h=hero(c),options=[];
    if(!target&&free(c,p.x,p.z))return p;
    const base=target?Math.max(.7,(target.r||2)-.4):.4;
    // Approach from the hero's side first, then try other clear sides.
    const angle=Math.atan2(h.z-p.z,h.x-p.x);
    for(let ring=0;ring<5;ring++)for(let i=0;i<16;i++) {
      const r=target?Math.max(.5,base-ring*.3):base+ring*.6,a=angle+i*Math.PI/8;
      const q={x:p.x+Math.cos(a)*r,z:p.z+Math.sin(a)*r};
      if(free(c,q.x,q.z))options.push(q);
    }
    options.sort((a,b)=>distance(a,h)-distance(b,h));
    return options.find(q=>clear(c,h,q))||options[0]||null;
  }
  function cancel() { route=null; }
  function finish(c) {
    const target=route&&route.target;cancel();
    if(!target||covered()||distance(hero(c),target)>(target.r||2)+.1)return;
    if(c.mode==='world'&&E.Interact)E.Interact.run(target);
    else if(c.mode==='interior') { c.room.near=target;E.Interior.interact(); }
  }
  E.ClickMove={
    cancel,modeChanged:cancel,
    click(e,canvas) {
      if(e.button!==0||(e.pointerType&&e.pointerType!=='mouse')||covered())return false;
      const c=context();if(!c)return false;
      const o=owner(c),rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return false;
      o.scene.updateMatrixWorld(true);o.camera.updateMatrixWorld(true);
      const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),o.camera);
      const list=targets(c),hits=ray.intersectObjects(o.scene.children,true);let point=null,target=null;
      for(const hit of hits) {
        if(!hit.object.visible)continue;
        let obj=hit.object,entry=null;while(obj&&!entry){entry=list.find(t=>t.obj===obj);obj=obj.parent;}
        if(entry){target=entry.it;point={x:target.x,z:target.z};break;}
        // A real upward-facing mesh at the physics floor height. This includes
        // terrain triangles, bridges, shop ramps and decorated room floors.
        if(!hit.face)continue;
        const normal=hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        const floor=c.mode==='world'?o.groundAt(hit.point.x,hit.point.z):roomFloor(o,hit.point.x,hit.point.z);
        if(normal.y>.45&&Math.abs(hit.point.y-floor)<.22){point={x:hit.point.x,z:hit.point.z};break;}
      }
      cancel();if(!point)return false;
      const goal=destination(c,point,target);if(!goal)return false;
      const path=plan(c,goal);if(!path)return false;
      route={owner:o,mode:c.mode,path,goal,target,elapsed:0,stuck:0,last:{x:hero(c).x,z:hero(c).z},targetAt:target?{x:target.x,z:target.z}:null,replans:0};
      return true;
    },
    motion(c,raw) {
      if(Math.abs(raw.x)+Math.abs(raw.y)>.02){cancel();return raw;}
      if(!route)return raw;
      if(route.owner!==owner(c)||route.mode!==c.mode||c.blocked||covered()){cancel();return ZERO();}
      const h=hero(c),dt=Math.max(0,c.dt||0);route.elapsed+=dt;
      if(distance(h,route.last)<.004)route.stuck+=dt;else route.stuck=0;
      route.last={x:h.x,z:h.z};
      const targetMoved=route.target&&distance(route.target,route.targetAt)>.55;
      let next=route.path[0];
      while(next&&distance(h,next)<.16&&(route.path.length===1||distance(h,next)<.005||clear(c,h,route.path[1]))){route.path.shift();next=route.path[0];}
      if(!next){finish(c);return ZERO();}
      const aheadScale=Math.min(1,1.6/distance(h,next)),ahead={x:h.x+(next.x-h.x)*aheadScale,z:h.z+(next.z-h.z)*aheadScale};
      if(targetMoved||!clear(c,h,ahead)||route.stuck>.55) {
        if(route.replans++>6){cancel();return ZERO();}
        if(route.target){route.goal=destination(c,route.target,route.target);route.targetAt={x:route.target.x,z:route.target.z};}
        const path=route.goal&&plan(c,route.goal);if(!path){cancel();return ZERO();}
        route.path=path;route.stuck=0;next=path[0];
      }
      const d=distance(h,next);if(d<.001){finish(c);return ZERO();}
      // Slow the final fraction of a step so ordinary movement never overshoots.
      const speed=c.mode==='interior'?3.25:5.2,scale=Math.min(1,d/Math.max(.01,speed*dt)),dx=(next.x-h.x)/d*scale,dz=(next.z-h.z)/d*scale;
      if(c.mode==='interior'){const det=.82*.82+.57*.57;return {x:(.82*dx-.57*dz)/det,y:(-.57*dx-.82*dz)/det,sprint:false};}
      const yaw=c.world.cam.yaw;return {x:Math.cos(yaw)*dx-Math.sin(yaw)*dz,y:-Math.sin(yaw)*dx-Math.cos(yaw)*dz,sprint:false};
    },
    // Read-only status is useful for focused browser checks and the destination HUD.
    status:()=>route?{mode:route.mode,goal:{...route.goal},remaining:route.path.length,replans:route.replans}:null,
  };
})();
