/* O calendário dirige luz, noite e encontros; nenhuma consulta por pixel ou por NPC. */
(() => {
  const C={},U=E.U,nightSky=new THREE.Color('#111b35'),nightFog=new THREE.Color('#26364c');
  const nightAmount=hour=>hour>=7&&hour<=17.5?0:hour>=19.5||hour<5?1:hour<7?1-(hour-5)/2:(hour-17.5)/2;
  C.update=(w,dt)=>{
    if(!w||!E.Sim)return;
    const clock=E.Sim.clock();
    if(!w.cycle){
      const sky=w.scene.children.find(o=>o.material&&o.material.uniforms&&o.material.uniforms.top&&o.material.uniforms.bot);
      const hemi=w.scene.children.find(o=>o.isHemisphereLight);
      w.cycle={last:-Infinity,sky,hemi,sun:w.sun,baseTop:new THREE.Color(w.B.sky[0]),baseBottom:new THREE.Color(w.B.sky[1]),baseFog:new THREE.Color(w.B.fog),baseSun:w.sun?w.sun.intensity:1,baseHemi:hemi?hemi.intensity:1,nightCamps:[],nightKey:null,lastNight:clock.night};
    }
    const v=w.cycle;
    if(Math.abs(clock.elapsed-v.last)<.5)return;v.last=clock.elapsed;
    const n=nightAmount(clock.decimalHour),visual=w.B.night?Math.max(.65,n):n;
    if(!w.cave){
      if(v.sun)v.sun.intensity=v.baseSun*(1-visual*.82);
      if(v.hemi)v.hemi.intensity=v.baseHemi*(1-visual*.46);
      if(v.sky){const un=v.sky.material.uniforms;un.top.value.copy(v.baseTop).lerp(nightSky,visual*.9);un.bot.value.copy(v.baseBottom).lerp(nightFog,visual*.87);un.night.value=visual;}
      if(w.scene.fog)w.scene.fog.color.copy(v.baseFog).lerp(nightFog,visual*.82);
      if(E.Water&&w.water)E.Water.setNight(w.water,visual);
    }
    w.isNight=clock.night;
    if(v.lastNight!==clock.night){v.lastNight=clock.night;if(E.WG.mode()==='world'){E.Audio.music(clock.night?'noite':'calma');E.UI.toast(clock.night?'A noite chegou: criaturas saem para caçar e os peixes noturnos despertam.':'Amanheceu. As lojas recebem mais visitantes.');}}
    if(w.cave||w.reg.metro||E.WG.mode()!=='world'||(E.CoopWorld&&E.CoopWorld.guest))return;
    const key=w.id+':'+clock.day;
    if(clock.night&&v.nightKey!==key){
      v.nightKey=key;
      const rng=U.seeded(w.reg.seed+clock.day*1781),h=E.Store.hero();
      for(let i=0;i<2;i++){
        let p=null;
        for(let j=0;j<70&&!p;j++){
          const a=rng()*6.283,r=64+rng()*36,x=Math.cos(a)*r,z=Math.sin(a)*r;
          if(w.terrainAt(x,z)>w.waterLevel+.5&&w.slope(x,z)<.6&&Math.hypot(x-w.hero.x,z-w.hero.z)>25&&(!w.village||w.village.doors.every(d=>Math.hypot(x-d.x,z-d.z)>24)))p={x,z};
        }
        if(p){const enc=E.EN.build(w.id,E.Adv?E.Adv.encounterLevel(h.level):h.level,'baixa',rng);const camp=w.addCamp('night:'+clock.day+':'+i,p,{enc,diff:'baixa'});if(camp){camp.night=true;v.nightCamps.push(camp);}}
      }
    }
    if(!clock.night&&v.nightCamps.length){
      for(const camp of v.nightCamps)if(!camp.dead)w.clearCamp(camp,{remote:true});
      const old=new Set(v.nightCamps);w.camps=w.camps.filter(c=>!old.has(c));v.nightCamps=[];
    }
  };
  C.nightAmount=nightAmount;
  E.Cycle=C;
})();
