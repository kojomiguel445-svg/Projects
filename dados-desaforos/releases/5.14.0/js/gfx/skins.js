/* Appearance pieces painted onto the existing Px grid. This module never reads
   or changes character rules. Curves are rasterized once into hard pixel masks. */
(() => {
  'use strict';
  const S=E.Skins={},C=E.SkinCatalog;
  S.hair=C.hair;S.eyes=C.eyes;S.mouths=C.mouths;
  S.horns={auto:'Originais',none:'Sem chifres',short:'Curtos',swept:'Curvados',crown:'Coroa',ram:'Carneiro'};
  S.snouts={auto:'Original',short:'Curto',broad:'Largo',long:'Alongado'};
  S.crests={auto:'Original',none:'Sem crista',spikes:'Espinhos',fin:'Barbatana',frill:'Gola'};
  S.patterns={auto:'Original',smooth:'Lisas',speckled:'Pintadas',bands:'Faixas',plates:'Placas'};
  const ancestryColors=Object.freeze({fogo:'#bd4939',frio:'#dde8ed',eletrico:'#4386c4',acido:'#353c47',veneno:'#4d9659'});
  S.ancestryColor=id=>ancestryColors[id]||null;
  const maps={hair:new Map(S.hair.map(x=>[x.id,x])),eyes:new Map(S.eyes.map(x=>[x.id,x])),mouths:new Map(S.mouths.map(x=>[x.id,x]))};
  S.has=(category,id)=>!!maps[category]?.has(id);
  const masks=new Map(),MAX_MASKS=320;
  const shade=(c,n)=>E.SP.shade(c,n);
  function palette(L){return {hair:L.hair,hairDark:shade(L.hair,-.2),hairLight:shade(L.hair,.32),gold:'#e8c46a',outline:'#1c1725',
    white:'#fff7e8',iris:L.eyes||'#3a2a20',pupil:'#120c1a',skinDark:shade(L.skin,-.28),lip:E.SP.mix(L.skin,'#be6979',.52),lipDark:E.SP.mix(L.skin,'#592c37',.65),teeth:'#f6efda',tongue:'#d77b89',none:null};}
  function mask(id,shapes,matrix){
    if(masks.has(id))return masks.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=78;const ctx=canvas.getContext('2d',{willReadFrequently:true}),layers=[];
    const sample=(shape,stroke)=>{
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,64,78);ctx.setTransform(...matrix);ctx.fillStyle=ctx.strokeStyle='#fff';ctx.lineJoin='round';ctx.lineCap='round';
      const path=new Path2D(shape.d);
      if(stroke){
        // A thick minimum outline can erase a two-pixel iris. Keep its authored
        // fine border while giving eyelids and hair a readable native outline.
        ctx.lineWidth=shape.fill==='iris'?(shape.sw||.25):Math.max(shape.sw||.65,.75/Math.min(Math.abs(matrix[0]),Math.abs(matrix[3])));
        ctx.stroke(path);
      }else ctx.fill(path);
      const data=ctx.getImageData(0,0,64,78).data,points=[];
      for(let i=3;i<data.length;i+=4)if(data[i]>=100)points.push((i-3)/4);
      if(points.length)layers.push({color:stroke?shape.stroke:shape.fill,points:new Uint16Array(points)});
    };
    for(const shape of shapes){if(shape.fill&&shape.fill!=='none')sample(shape,false);if(shape.stroke)sample(shape,true);}
    masks.set(id,layers);if(masks.size>MAX_MASKS)masks.delete(masks.keys().next().value);return layers;
  }
  function paint(p,id,shapes,matrix,L,dx=0,dy=0){
    const pal=palette(L),layers=mask(id,shapes,matrix);
    for(const layer of layers){const color=pal[layer.color];if(!color)continue;for(const i of layer.points)p.set(i%64+dx,Math.floor(i/64)+dy,color);}
  }
  S.hairPart=(p,L,CX,hy,part)=>{
    const item=maps.hair.get(L.hairPreset);if(!item)return false;
    paint(p,item.id+':'+part,item[part]||[],[.78,0,0,.62,32-48*.78,21-34*.62],L,CX-32,hy-21);return true;
  };
  S.drawEyes=(p,L,CX,hy,dragon=false)=>{
    const item=maps.eyes.get(L.eyeShape);if(!item)return false;
    // Keep the original eye centres and head size; only the eye geometry changes.
    for(const side of[-1,1])paint(p,item.id+':'+side,item.shapes,[side<0?.68:-.68,0,0,.9,32+side*6.5,24.5],L,CX-32,hy-21+(dragon?-3.5:0));return true;
  };
  S.drawMouth=(p,L,CX,hy,dragon=false)=>{
    const item=maps.mouths.get(L.mouthShape);if(!item)return false;
    const mouthOffset=dragon?({short:-1,broad:1,long:4}[L.dragonSnout]??1):0;
    paint(p,item.id,item.shapes,[.85,0,0,.65,32,30],L,CX-32,hy-21+mouthOffset);return true;
  };
  S.dragonHorns=(p,L,CX,hy,hooded=false)=>{
    const type=L.dragonHorns;if(!type||type==='auto'||hooded)return;
    const ivory=E.SP.mix(L.skin,'#efe4cc',.7),dark=shade(ivory,-.3);
    for(const s of[-1,1]){
      if(type==='short'){p.poly([[CX+s*6,hy-7],[CX+s*9,hy-18],[CX+s*11,hy-7]],dark);p.line(CX+s*8,hy-9,CX+s*9,hy-17,ivory,false,2);}
      if(type==='swept'){p.line(CX+s*7,hy-7,CX+s*14,hy-14,dark,false,4);p.line(CX+s*14,hy-14,CX+s*16,hy-21,ivory,false,3);p.set(CX+s*16,hy-22,shade(ivory,.2));}
      if(type==='crown'){p.poly([[CX+s*4,hy-7],[CX+s*5,hy-21],[CX+s*9,hy-15],[CX+s*12,hy-20],[CX+s*12,hy-7]],dark);p.line(CX+s*6,hy-9,CX+s*5,hy-19,ivory,false,2);p.line(CX+s*10,hy-10,CX+s*12,hy-18,ivory);}
      if(type==='ram'){p.ell(CX+s*13,hy-9,7,9,dark);p.ell(CX+s*13,hy-9,5,7,ivory);p.ell(CX+s*13,hy-8,3,4,dark);p.ell(CX+s*12,hy-7,2,3,L.skin);p.line(CX+s*14,hy-15,CX+s*16,hy-11,shade(ivory,-.15));}
    }
  };
  S.dragonCrest=(p,L,CX,hy)=>{
    const type=L.dragonCrest,dark=shade(L.skin,-.28),light=shade(L.skin,.24);
    if(type==='spikes')for(const [x,y]of[[-6,-9],[0,-14],[6,-9]]){p.poly([[CX+x-3,hy-6],[CX+x,hy+y-4],[CX+x+3,hy-6]],dark);p.line(CX+x,hy+y-2,CX+x+1,hy-7,light);}
    if(type==='fin'){p.poly([[CX-5,hy-8],[CX-6,hy-19],[CX,hy-22],[CX+6,hy-17],[CX+5,hy-7]],dark);for(const x of[-3,0,3])p.line(CX,hy-8,CX+x,hy-18,light);}
    if(type==='frill')for(const s of[-1,1]){p.poly([[CX+s*9,hy-7],[CX+s*19,hy-10],[CX+s*16,hy-3],[CX+s*20,hy+2],[CX+s*11,hy+6]],dark);p.line(CX+s*11,hy-3,CX+s*16,hy-7,light);p.line(CX+s*11,hy+1,CX+s*17,hy+2,light);}
  };
  S.dragonSnout=(p,L,CX,hy)=>{
    const type=L.dragonSnout;if(!type||type==='auto')return;
    const light=E.SP.mix(L.skin,'#f4e8c8',.28),dark=shade(L.skin,-.35),length=type==='long'?16:type==='short'?10:13,width=type==='broad'?10:type==='long'?6:7;
    p.poly([[CX-width,hy+3],[CX+width,hy+3],[CX+width-1,hy+length-3],[CX+3,hy+length],[CX-3,hy+length],[CX-width+1,hy+length-3]],light);
    p.line(CX-width,hy+3,CX-width+1,hy+length-3,shade(L.skin,-.12));p.line(CX+width,hy+3,CX+width-1,hy+length-3,shade(L.skin,-.18));
    p.rect(CX-4,hy+5,2,1,dark);p.rect(CX+3,hy+5,2,1,dark);
    if(!L.mouthShape){p.line(CX-width+2,hy+length-4,CX+width-2,hy+length-4,dark);p.set(CX-3,hy+length-3,'#f6efda');p.set(CX+3,hy+length-3,'#f6efda');}
  };
  S.dragonPattern=(p,L,CX,hy)=>{
    const type=L.scalePattern,hi=shade(L.skin,.2),dark=shade(L.skin,-.24);
    if(type==='speckled')for(const [x,y]of[[-7,-7],[-3,-8],[3,-8],[7,-7],[-9,-2],[9,-2],[-7,5],[7,5],[-2,-4],[2,-4]]){p.set(CX+x,hy+y,hi);p.set(CX+x+1,hy+y+1,dark);}
    if(type==='bands')for(const s of[-1,1])for(const y of[-6,-2,5])p.line(CX+s*7,hy+y,CX+s*10,hy+y+1,dark,false,2);
    if(type==='plates')for(const [x,y]of[[-6,-7],[0,-8],[6,-7],[-8,-2],[8,-2],[-6,5],[6,5]]){p.poly([[CX+x,hy+y-1],[CX+x+2,hy+y],[CX+x,hy+y+2],[CX+x-2,hy+y]],dark);p.set(CX+x,hy+y,hi);}
  };
  S.cacheInfo=()=>({masks:masks.size,limit:MAX_MASKS});
})();
