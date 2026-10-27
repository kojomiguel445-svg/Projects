/* Ecos 5.3: full silhouettes drawn on a 100×130 pixel grid. Each guardian has
   its own anatomy, helmet, armour and effects. No downloaded art or per-frame
   image generation: portraits and the three world poses share bounded caches. */
(() => {
  'use strict';
  const EA={},D={},W=200,H=260,INK='#182036';
  const P=(pts,c,sw=1.1,stroke=INK)=>`<polygon points="${pts}" fill="${c}"${sw?` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="bevel"`:''}/>`;
  const R=(x,y,w,h,c,sw=0,stroke=INK)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${sw?` stroke="${stroke}" stroke-width="${sw}"`:''}/>`;
  const C=(x,y,r,c,sw=1,stroke=INK)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"${sw?` stroke="${stroke}" stroke-width="${sw}"`:''}/>`;
  const ELL=(x,y,rx,ry,c,sw=1,stroke=INK)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${c}"${sw?` stroke="${stroke}" stroke-width="${sw}"`:''}/>`;
  const L=(pts,c=INK,w=1)=>`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linejoin="bevel"/>`;
  const G=(s,x=0,y=0,sx=1,sy=sx,op=1)=>`<g transform="translate(${x} ${y}) scale(${sx} ${sy})" opacity="${op}">${s}</g>`;
  const mirror=s=>s+`<g transform="translate(100 0) scale(-1 1)">${s}</g>`;
  const heart=(x,y,n,c)=>P(`${x-n},${y-n*.45} ${x-n*.45},${y-n} ${x},${y-n*.45} ${x+n*.45},${y-n} ${x+n},${y-n*.45} ${x+n},${y+n*.15} ${x},${y+n} ${x-n},${y+n*.15}`,c,.75);
  const diamond=(x,y,n,c)=>P(`${x},${y-n} ${x+n},${y} ${x},${y+n} ${x-n},${y}`,c,.7);
  const star=(x,y,n,c)=>P(`${x},${y-n} ${x+n*.3},${y-n*.3} ${x+n},${y-n*.3} ${x+n*.5},${y+n*.2} ${x+n*.65},${y+n} ${x},${y+n*.55} ${x-n*.65},${y+n} ${x-n*.5},${y+n*.2} ${x-n},${y-n*.3} ${x-n*.3},${y-n*.3}`,c,.7);
  function halo(c,pose){
    const n=pose==='punch'?2:0;
    return `<g opacity=".14">${P(`50,3 77,15 93,43 95,85 75,117 50,129 25,117 5,85 7,43 23,15`,c,0)}${P('50,12 72,22 85,45 86,80 69,110 50,120 31,110 14,80 15,45 28,22',c,0)}</g>`+
      [ [13,30,2],[84,19,2],[9,92,2],[87,104,3],[31,12,1],[66,122,1] ].map(([x,y,s],i)=>R(x,y+(i%2?n:-n),s,s,c)).join('');
  }
  function fist(p,x,y,size=1,op=1){
    return G(P('-7,-7 -4,-9 4,-9 8,-5 8,5 4,8 -5,8 -8,4',p.glove||p.body)+P('-7,-5 -3,-6 -2,1 -5,3 -8,1',p.light,.6)+L('-3,-7 -3,-1 1,-7 1,-1 5,-6 5,0',p.dark,.8)+L('-4,5 5,5',p.dark,.8),x,y,size,size,op);
  }
  function legs(p,style='plain'){
    let out=mirror(P('36,80 49,82 49,102 46,121 34,121 32,114 34,99',p.body)+P('35,100 43,102 42,117 35,117',p.dark,0)+P('36,84 41,85 39,99 35,99',p.light,0)+P('33,116 46,116 47,124 30,124 29,122',p.armor||p.dark));
    if(style==='heart')out+=mirror(heart(40,102,4,p.armor));
    if(style==='knight')out+=mirror(P('34,90 46,91 46,100 41,105 33,101',p.armor)+L('35,110 45,110',p.light));
    if(style==='gold')out+=mirror(ELL(40,103,4,6,p.dark,.7)+R(35,114,9,3,p.armor));
    return out;
  }
  function torso(p,slim=false){
    const a=slim?32:28,b=slim?68:72;
    return P(`${a},45 41,41 58,41 ${b},46 ${b+2},59 65,72 62,84 38,84 35,72 ${a-2},59`,p.body)+
      mirror(P('31,49 40,46 49,49 48,60 40,62 32,58',p.light,.7,p.dark)+P('37,67 47,66 48,72 39,73',p.light,.65,p.dark)+P('40,76 48,75 48,80 41,81',p.light,.6,p.dark))+
      P('29,59 34,62 40,82 36,82 30,70',p.dark,0)+L('50,48 50,81',p.dark,.8)+mirror(L('32,63 38,65 34,68 39,70',p.dark,.7));
  }
  function arms(p,pose,style='plain'){
    const cuff=(x,y)=>G(P('-7,-5 7,-5 7,5 -7,5',p.armor)+R(-5,-3,2,6,p.alight||p.light),x,y);
    const left=P('28,46 20,51 18,65 23,73 32,69 34,55',p.body)+P('20,53 24,52 24,65 20,66',p.light,0)+P('23,70 17,76 17,89 27,93 32,86 31,73',p.body)+P('27,75 30,77 28,86 25,89',p.dark,0)+cuff(23,84)+fist(p,23,94,.8);
    if(pose!=='punch')return mirror(left);
    let out=left;
    for(const [x,y,s]of[[82,35,.7],[89,77,.65],[15,38,.6],[50,20,.45]])out+=fist(p,x,y,s,.3);
    return out+P('70,47 80,48 85,58 79,68 68,65 66,56',p.body)+P('74,49 78,50 81,58 77,60',p.light,0)+cuff(78,64)+fist(p,75,69,1.35)+L('86,55 96,49',p.light,1.8)+L('86,83 97,89',p.light,1.5);
  }
  function face(p,opts={}){
    let out=P('40,20 46,16 56,17 62,23 60,37 55,43 45,42 39,35',p.body)+P('55,21 61,24 58,36 54,40 52,35',p.dark,0);
    out+=mirror(P('41,27 48,28 47,31 41,30',opts.eyeWhite||'#f5f2dc',.6)+R(45,28,2,3,p.eye)+L('40,25 48,27',INK,1.2));
    return out+L('50,29 48,35 51,35',p.dark,.8)+L('46,38 54,38',INK,.8);
  }
  const PALETTES={
    star:{body:'#805ac3',dark:'#443b83',light:'#b694e0',armor:'#ccb46c',alight:'#fff0b1',eye:'#76dabd',hair:'#20243f',cloth:'#af343e',aura:'#b29ae8'},
    world:{body:'#d9b64f',dark:'#8f743d',light:'#fff2a6',armor:'#52736d',alight:'#92bda2',eye:'#e44a61',hair:'#bda14d',cloth:'#5a7668',aura:'#f3d779'},
    diamond:{body:'#d989ac',dark:'#945879',light:'#ffc7db',armor:'#78b4c7',alight:'#c9edf1',eye:'#6ce2ea',hair:'#6d9cae',cloth:'#83c2cd',aura:'#f6aecb'},
    gold:{body:'#d6b35c',dark:'#8d7442',light:'#fff0a5',armor:'#965489',alight:'#d6a2c1',eye:'#8ce6b9',hair:'#ead18a',cloth:'#6c506b',aura:'#f5d99a'},
    silver:{body:'#b8c5d2',dark:'#627689',light:'#f5f8e9',armor:'#d6dfe1',alight:'#ffffff',eye:'#9fe5ee',hair:'#dddfe2',cloth:'#778aa4',aura:'#becddd'},
    queen:{body:'#dac5d6',dark:'#a082aa',light:'#faf0df',armor:'#58455f',alight:'#9a819d',eye:'#d94c65',hair:'#d9c3dd',cloth:'#735569',aura:'#e0a2c7'},
    red:{body:'#b94f43',dark:'#763c3b',light:'#f3925d',armor:'#e0ae62',alight:'#ffe8a4',eye:'#f9df7d',hair:'#9b353b',cloth:'#5d3b45',aura:'#f39750'},
    green:{body:'#5a9d79',dark:'#365f5c',light:'#b3d4a5',armor:'#e0e4ca',alight:'#f8fae3',eye:'#f4ce65',hair:'#477e69',cloth:'#335e58',aura:'#9bd9af'},
    string:{body:'#659ab5',dark:'#345c79',light:'#b1d9da',armor:'#d4c2a0',alight:'#fff1c7',eye:'#e9ad61',hair:'#4284a0',cloth:'#36758e',aura:'#9bd2df'},
    weather:{body:'#e1e6de',dark:'#779cb2',light:'#ffffff',armor:'#aecdd4',alight:'#ffffff',eye:'#8ecfe3',hair:'#d7dfdf',cloth:'#778aa9',aura:'#d6edf0'}
  };
  function humanoid(id,pose){
    const base=id.split('~')[0],evo=id.includes('~');
    const kind=({punho_estelar:'star',instante_dourado:'world',diamante_rosa:'diamond',vida_aurea:'gold',cavaleiro_prata:'silver',rainha_explosiva:'queen',ave_brasa:'red',sacerdote_esmeralda:'green',fio_livre:'string',brisa:'weather'})[base];
    let p={...PALETTES[kind]},back='',front='',head='',body='',extra='';
    if(base==='cavaleiro_prata'&&evo)p={...p,body:'#323647',dark:'#171d2c',light:'#636977',armor:'#505562',alight:'#969cac',eye:'#f2df8d',cloth:'#2d3346',aura:'#aba3cd'};
    if(base==='punho_estelar'){
      back=P('41,18 28,29 27,44 18,57 30,52 26,73 39,59 37,85 49,64 62,82 60,57 76,68 70,46 78,47 69,28 57,15',p.hair)+L('34,30 30,48 39,39 35,61 43,52',p.dark,.8);
      head=P('38,21 37,14 42,7 49,12 53,6 57,14 64,11 64,25 58,20 55,26 50,17 46,25 43,19',p.hair)+P('38,22 61,22 62,26 39,26',p.armor)+diamond(50,24,2.5,'#b45967');
      front=P('40,41 48,45 60,41 63,46 56,51 43,49 37,45',p.cloth)+P('59,45 72,44 80,50 88,47 84,55 92,59 76,60 63,53',p.cloth);
      body=mirror(P('21,46 28,42 36,45 38,53 27,55 20,51',p.armor)+star(28,48,2.3,p.alight));
      extra=P('36,81 64,81 65,88 35,88',p.armor)+P('45,88 58,88 57,106 50,102 43,105',p.cloth)+C(50,84,2.4,p.dark);
      if(evo)back=clock(p.aura)+back,head+=star(60,17,3,'#f7e6aa');
    }else if(base==='instante_dourado'){
      back=mirror(P('28,39 34,36 39,57 33,62 28,51',p.armor)+C(32,37,3,p.alight)+L('33,40 35,54',p.dark,1.3));
      head=P('38,23 37,11 43,7 57,7 63,11 62,23 55,20 50,23 45,20',p.body)+P('38,12 43,8 57,8 62,12 59,18 41,18',p.armor)+L('50,8 50,18',p.light,2)+P('39,31 46,33 54,33 61,31 58,40 42,40',p.armor)+L('42,35 58,35',p.light,.8)+mirror(L('42,31 42,36 46,36',p.dark,1.1));
      body=mirror(P('20,46 28,42 37,45 36,52 25,54 20,51',p.armor)+heart(39,53,3,p.armor));
      extra=P('36,81 64,81 64,88 36,88',p.armor)+heart(50,85,3,p.body);
    }else if(base==='diamante_rosa'){
      back=mirror(L('39,19 31,23 31,40 36,44',p.dark,4)+L('39,19 31,23 31,40 36,44',p.armor,2.2));
      head=P('38,26 36,19 39,10 46,7 57,10 63,17 62,27 58,22 55,18 44,18 41,24',p.armor)+heart(50,14,3.6,p.body)+mirror(R(35,21,4,9,p.armor,1));
      body=mirror(heart(28,49,7,p.armor))+P('35,46 43,49 57,49 65,46 63,56 54,60 46,60 37,56',p.armor)+heart(50,66,4,p.armor);
      extra=P('36,81 64,81 65,88 35,88',p.armor)+heart(50,84,3,p.body);
    }else if(base==='vida_aurea'){
      body=mirror(P('31,48 36,47 40,61 37,71 32,65',p.armor)+bug(28,49,4.2))+bug(50,55,4.5);
      head=P('39,25 39,17 44,12 56,12 62,18 61,25 55,21 44,21',p.armor)+[42,50,58].map((x,i)=>C(x,14-(i===1?3:0),4.3,p.body)+L(`${x-2},${14-(i===1?3:0)} ${x},${12-(i===1?3:0)} ${x+2},${14-(i===1?3:0)} ${x},${16-(i===1?3:0)}`,p.dark,.6)).join('')+bug(50,22,2.4);
      extra=P('36,81 64,81 65,87 35,87',p.armor)+bug(50,84,2.5);
      if(evo){
        head=P('35,23 34,16 41,8 39,4 47,8 50,1 54,8 62,4 60,10 67,15 65,23 60,19 58,31 53,40 47,40 42,31 40,19',p.body)+P('42,20 48,18 50,22 53,18 59,20 56,28 51,29 45,27',p.armor)+mirror(P('42,26 47,25 48,29 43,30',p.eye,.6))+diamond(50,15,4,'#f4e6b6');
        body+=mirror(C(35,66,2,p.armor));back=clock('#e4ce88')+mirror(L('29,25 21,17 17,25 20,33',p.armor,2));
      }
    }else if(base==='cavaleiro_prata'){
      body=P('32,46 39,43 60,43 68,47 64,65 58,70 41,70 34,65',p.armor)+L('50,45 50,69 35,60 65,60',p.dark,.9)+mirror(P('18,48 26,42 37,47 34,54 22,55',p.armor)+P('18,48 15,42 24,45',p.light));
      head=P('38,27 38,17 43,10 50,8 58,13 62,19 62,34 55,43 45,43 38,35',p.armor)+P('49,9 51,9 59,2 54,14 50,16',p.cloth)+R(39,26,22,4,p.dark)+mirror(R(42,27,6,1.4,p.eye))+L('50,31 50,42 43,35 58,35',p.dark,1);
      extra=P('36,79 64,79 65,86 35,86',p.dark)+mirror(P('36,85 49,86 47,93 34,91',p.armor));
      front=pose==='punch'?L('72,66 96,14',p.light,1.6)+L('72,66 95,37',p.light,.6)+P('66,65 73,62 77,66 71,70',p.armor):L('79,88 93,18',p.light,1.7)+P('74,86 82,85 85,90 77,92',p.armor)+C(80,88,2,p.light);
      if(evo){back=P('31,44 19,59 26,87 20,119 38,113 40,128 50,118 61,128 62,112 80,119 74,85 80,59 67,44',p.body)+L('29,69 34,113 41,91 50,112 59,91 66,113 71,68',p.dark,1.2);head=P('35,24 32,19 35,16 39,16 38,6 59,6 62,15 68,18 68,23 61,25 59,38 53,43 44,41 40,27',p.body)+R(39,24,22,3,p.dark)+mirror(R(42,28,5,2,p.eye))+R(39,13,21,3,'#b9a55f');body+=P('42,52 58,52 57,80 43,80',p.dark)+mirror(L('43,57 50,60 43,67 50,70 43,77',p.light,1));front='';}
    }else if(base==='rainha_explosiva'){
      head=P('38,29 37,10 45,18 55,18 64,8 62,31 58,39 50,43 42,38',p.body)+P('39,14 43,20 39,24',p.dark)+P('61,13 57,20 61,24',p.dark)+mirror(P('41,27 48,28 47,32 42,32',p.eye,.7)+L('43,33 47,35',p.dark,1))+L('50,31 49,35 52,35 47,39 54,39',p.dark,.9);
      body=mirror(heart(28,49,3.3,p.dark))+P('37,81 63,81 64,88 36,88',p.armor)+skull(50,84,3);
      extra=mirror(P('35,103 47,103 46,108 34,108',p.armor));
      if(evo)back=clock('#b5a1d3')+P('13,71 18,65 23,71 18,76','#e2a984',.6),front+=skull(76,108,6)+L('73,110 83,114','#ebba8c',1);
    }else if(base==='ave_brasa'){
      back=mirror(P('27,43 18,42 7,51 17,59 14,76 28,70 35,53',p.dark)+P('16,46 9,54 19,56 19,69 28,62',p.body));
      head=P('38,31 35,25 39,13 44,9 44,3 51,8 59,8 58,14 66,21 60,33 54,40 44,39',p.body)+P('45,28 56,28 65,37 54,39 47,35',p.armor)+P('45,31 53,33 59,37 51,36',p.alight,.4)+R(42,23,7,3,p.eye,.6)+L('39,20 48,22',INK,1.2);
      body=mirror(P('32,49 36,45 40,55 37,64 31,60',p.light,.6,p.dark));extra=P('35,81 65,81 64,88 36,88',p.cloth)+P('43,89 51,90 53,103 47,98 43,108',p.armor);
      front=mirror(P('33,117 45,118 46,123 50,126 43,126 39,123 35,126 28,126 33,121',p.armor));
      for(const[x,y]of[[12,31],[85,42],[14,91],[89,103]])back+=flame(x,y,pose==='punch'?1.35:1);
    }else if(base==='sacerdote_esmeralda'){
      head=P('40,38 36,31 35,19 39,10 47,6 56,8 64,16 65,29 59,39 53,44 46,43',p.body)+P('42,24 58,23 61,31 55,39 44,38 40,31',p.armor)+mirror(ELL(39,25,4,5,p.light,.8)+R(37,24,3,2,p.eye))+L('45,29 55,29 54,33 46,33 49,38',p.dark,1);
      body=mirror(P('30,45 36,44 39,57 34,69 31,64',p.armor,.8));
      const grid=[];for(let y=49;y<82;y+=5)grid.push(L(`31,${y} 65,${y-5}`,p.dark,.65));for(let x=34;x<66;x+=5)grid.push(L(`${x},47 ${x-6},79`,p.light,.65));body+=grid.join('');
      extra=P('38,80 62,80 62,87 38,87',p.armor);front=pose==='punch'?[[10,29,4],[18,64,3],[85,18,4],[88,49,5],[91,102,3]].map(([x,y,n])=>diamond(x,y,n,'#a8ebc0')).join(''):mirror(L('21,98 17,109 26,114 22,125',p.light,1.2));
    }else if(base==='fio_livre'){
      head=P('38,25 37,17 42,11 49,9 59,12 63,19 61,31 57,40 45,40 39,34',p.body)+mirror(ELL(37,24,3,5,p.armor)+R(34,22,3,4,p.dark))+P('38,23 62,23 62,30 38,30',p.armor)+mirror(R(41,25,7,3,p.eye,.65))+L('50,23 50,30',p.dark,.8)+L('47,36 55,36',p.dark,.8)+R(44,13,13,4,p.light);
      for(let y=48;y<80;y+=4)body+=L(`34,${y} 64,${y}`,p.dark,.6);for(let x=35;x<64;x+=5)body+=L(`${x},48 ${x+2},79`,p.light,.6);
      body+=mirror(P('21,48 28,44 35,48 33,54 22,55',p.body));extra=P('36,81 64,81 64,87 36,87',p.armor)+R(41,83,18,2,p.dark);
      front=mirror(L('24,94 16,97 12,106 20,115 29,110 24,101 18,108',p.light,1.1));if(pose==='punch')front+=L('76,72 91,64 93,85 64,104 79,118 96,100',p.light,1.2);
    }else if(base==='brisa'){
      head=P('39,24 39,16 46,12 56,12 63,18 62,29 58,39 47,41 40,34',p.body)+mirror(P('39,22 34,15 33,9 37,10 42,18',p.armor))+R(42,18,16,5,p.armor)+mirror(R(43,27,5,3,p.eye,.7))+L('49,32 49,36 54,36',p.dark,.8);
      body=mirror(P('25,45 29,41 33,43 36,48 33,52 27,52 24,49',p.light)+C(37,51,3,p.light,.5))+mirror(C(34,70,2,p.dark,0)+C(38,76,2,p.dark,0));
      back=mirror(cloud(20,90,1)+cloud(24,23,.7));front=cloud(72,112,1.1)+star(59,54,3,'#e1bc78');if(pose==='punch')front+=L('75,62 92,59 95,63 87,68 95,73',p.light,2)+L('72,76 91,81 95,88',p.light,2);
    }
    const legStyle=['world','diamond'].includes(kind)?'heart':kind==='silver'?'knight':kind==='gold'?'gold':'plain';
    let baseFigure=legs(p,legStyle)+torso(p,kind==='silver'||kind==='gold')+body+arms(p,pose)+P('44,37 56,37 57,45 50,48 43,44',p.body)+face(p)+head+extra+front;
    return {aura:p.aura,body:back+G(baseFigure,pose==='idle1'?1:0,pose==='idle1'?-1:0)};
  }
  function bug(x,y,r){return ELL(x,y,r,r*1.12,'#a44e79',.7)+L(`${x},${y-r} ${x},${y+r}`,INK,.7)+C(x-r*.45,y-r*.25,r*.17,INK,0)+C(x+r*.45,y+r*.25,r*.17,INK,0)+C(x,y-r*1.1,r*.35,INK,.4);}
  function skull(x,y,r){return P(`${x-r},${y-2} ${x-r*.7},${y-r} ${x+r*.7},${y-r} ${x+r},${y-2} ${x+r*.6},${y+r*.5} ${x-r*.6},${y+r*.5}`,'#e6dbd7',.6)+R(x-r*.6,y-r*.4,r*.4,r*.5,INK)+R(x+r*.2,y-r*.4,r*.4,r*.5,INK)+L(`${x-r*.3},${y+r*.5} ${x-r*.3},${y+r} ${x+r*.3},${y+r} ${x+r*.3},${y+r*.5}`,INK,.5);}
  function flame(x,y,s=1){return G(P('0,-8 3,-3 2,0 5,-1 5,4 2,7 -3,6 -5,2 -3,-2 -2,1','#e59b50',.7)+P('0,-2 2,2 1,5 -2,4 -2,2','#fff0ae',0),x,y,s);}
  function cloud(x,y,s=1){return G(P('-12,3 -12,-2 -9,-2 -9,-6 -4,-6 -4,-8 2,-8 2,-5 7,-5 7,-2 12,-2 12,3 8,6 -8,6','#e6efeb',.6,'#92aeb8')+L('-9,3 -2,3 1,1 8,1','#bed5d9',.8),x,y,s);}
  function clock(col){
    let out=`<g opacity=".55">${ELL(50,61,44,53,'none',.8,col)}${ELL(50,61,39,48,'none',.8,col)}`;
    for(let i=0;i<12;i++){const a=i*Math.PI/6,x=50+Math.sin(a)*42,y=61-Math.cos(a)*51;out+=G(R(-1,-2,2,4,col),x,y);}
    return out+L('50,61 50,26 50,61 72,71',col,1.3)+'</g>';
  }
  function echoes(id,pose){
    const form=Number(id.split('~')[1])||0,atk=pose==='punch',shift=pose==='idle1'?-2:0,p={body:'#81b584',dark:'#416957',light:'#d1e4ba',armor:'#e3e6d0',alight:'#ffffff',eye:'#f0d779',aura:'#afd9a5'};
    if(form===2){
      let b=legs(p)+torso(p,true)+arms(p,pose)+P('34,49 44,43 57,43 68,50 65,59 35,59',p.armor)+mirror(C(28,49,5,p.armor)+R(25,48,6,1,p.dark))+P('40,82 60,82 61,88 39,88',p.dark)+R(45,84,3,2,p.light)+R(52,84,3,2,p.light);
      b+=P('36,29 36,20 42,14 58,14 65,21 63,33 56,42 44,42',p.body)+P('34,24 34,16 40,18 43,12 58,12 62,18 67,18 66,25 58,24 50,28 42,24',p.body)+mirror(P('39,25 47,27 46,32 40,32',p.armor,.7)+R(43,28,2,3,INK))+L('42,35 58,35 55,39 45,39',p.dark,.8);
      b+=G(number(3,p.dark),47,64,1.5)+mirror(G(number(3,p.dark),26,46,.65));
      return {aura:p.aura,body:G(b,0,shift)};
    }
    const tail=atk?P('55,91 68,95 84,79 91,72 96,76 88,87 75,105 60,107',p.body)+ELL(92,74,5,4,p.armor):P('53,91 66,101 74,115 71,126 63,126 66,116 60,109 48,103',p.body)+L('64,108 68,111 66,114 70,117',p.dark,.7);
    let b=tail+mirror(P('37,68 28,80 28,92 35,87 42,76',p.body))+ELL(50,82,15,22,p.armor)+L('37,73 63,73 37,82 63,82 38,91 62,91',p.dark,.8);
    if(form===0){
      b+=P('29,45 33,32 42,24 56,24 65,31 70,45 68,57 58,65 42,64 32,57',p.body)+P('31,43 39,39 59,39 68,45 63,57 56,61 43,60 35,55',p.light,.6)+mirror(ELL(40,48,7,9,'#edf1db',.9)+ELL(41,48,3,5,INK,.6)+R(40,44,1,2,'#fff'))+P('47,56 53,56 50,60',p.dark,.6)+mirror(L('33,38 35,28 40,24',p.dark,1))+C(42,30,1.2,p.dark,0)+C(52,29,1.2,p.dark,0)+C(60,34,1.2,p.dark,0);
    }else{
      b+=P('29,42 34,30 47,25 57,23 67,10 67,26 73,34 71,49 64,59 50,64 36,58 30,51',p.body)+P('33,44 42,39 62,39 68,45 64,56 54,60 42,58 35,54',p.light,.7)+mirror(ELL(42,48,5,7,'#f2eed5')+ELL(43,48,2,4,INK,.4))+L('45,56 58,56',p.dark,.8)+mirror(P('37,69 33,80 35,94 42,86',p.body))+mirror(P('38,99 38,112 44,114 46,102',p.body));
      if(atk)b+=P('84,69 96,68 98,75 92,81 84,77','#e3e6d0')+L('87,72 94,72 90,76',p.dark,1);
    }
    if(atk)b+=L('10,31 18,31 18,39 10,39 10,47 18,47',p.armor,2)+L('83,37 91,37 91,44 83,44 83,50 91,50',p.armor,2);
    return {aura:p.aura,body:G(b,0,shift)};
  }
  function number(n,col=INK){const p={0:[[0,0,4,1],[0,1,1,5],[3,1,1,5],[0,6,4,1]],1:[[2,0,1,7],[1,1,1,1],[1,6,3,1]],2:[[0,0,4,1],[3,1,1,2],[0,3,4,1],[0,4,1,2],[0,6,4,1]],3:[[0,0,4,1],[3,1,1,5],[1,3,2,1],[0,6,4,1]],5:[[0,0,4,1],[0,1,1,2],[0,3,4,1],[3,4,1,2],[0,6,4,1]],6:[[0,0,4,1],[0,1,1,5],[0,3,4,1],[3,4,1,2],[0,6,4,1]],7:[[0,0,4,1],[3,1,1,3],[2,4,1,3]]}[n]||[];return p.map(a=>R(...a,col)).join('');}
  function vines(pose){
    const atk=pose==='punch',purple='#9a70ad',shade='#5c4f7e',light='#d7b6df';let b='';
    const line=(pts,w=3)=>L(pts,INK,w+1.4)+L(pts,purple,w)+L(pts,light,.7);
    const tips=atk?[[14,17],[88,12],[89,65]]:[[23,24],[77,29],[63,12]];
    b+=P('37,99 63,99 66,127 34,127','#b6ad89')+P('37,100 37,67 40,54 44,48 49,55 49,36 53,32 57,37 57,59 61,47 65,46 68,50 66,68 70,61 74,61 77,66 71,87 64,99','#b9a5a3')+L('41,57 43,72 48,77 49,58 55,62 57,81 63,75',shade,.8);
    b+=line(`48,107 32,92 66,76 32,60 67,42 ${tips[0]}`)+line(`59,104 72,88 39,73 75,56 50,34 ${tips[1]}`)+line(`43,102 52,86 48,70 50,48 ${tips[2]}`,2);
    for(const[x,y,d]of[[34,61,-1],[64,44,1],[68,75,1],[33,91,-1],[71,57,1],[40,74,-1],[52,49,1]])b+=P(`${x},${y} ${x+d*6},${y-6} ${x+d*3},${y+2}`,purple,.7);
    if(atk)b+=L('13,15 8,8 18,12 14,3',light,1.2)+L('85,12 95,7 92,17',light,1.2);
    return {aura:'#c4a0d1',body:G(b,0,pose==='idle1'?-1:0)};
  }
  function six(pose){
    const positions=[[29,35],[54,23],[75,45],[22,84],[54,75],[77,98]],nums=[1,2,3,5,6,7];let b='';
    for(let i=0;i<positions.length;i++){
      const[x,y]=positions[i],s=pose==='punch'&&i%2?1.15:1,dy=pose==='idle1'?(i%2?2:-2):0;
      const unit=P('-6,5 -7,-2 -5,-10 0,-16 6,-11 8,-2 6,6 3,10 -3,10','#dbbd6c')+P('-5,-9 0,-13 5,-10 5,-6 -5,-6','#f6e1a0',0)+P('-6,7 6,7 6,13 3,17 1,12 -1,12 -3,18 -6,15','#c1a35c')+L('-6,0 -10,5 -11,11  -9,13',INK,1.3)+L('7,0 11,5 12,11 10,13',INK,1.3)+ELL(-3,-1,2,2.4,'#f4f0dc',.6)+ELL(3,-1,2,2.4,'#f4f0dc',.6)+R(-3.6,-1.5,1.2,2,INK)+R(2.4,-1.5,1.2,2,INK)+P('-5,3 5,3 3,6 -3,6','#f4f0dc',.6)+G(number(nums[i],'#b4575f'),-1.5,-9,.65);
      b+=G(unit,x,y+dy,s,s);if(pose==='punch')b+=L(`${x-7},${y+13} ${x-14},${y+20}`,'#f7de96',1.3);
    }
    return {aura:'#f0da9c',body:b};
  }
  function sabbath(pose){
    const atk=pose==='punch',gold='#cab36d',dark='#27253b',p={body:dark,dark:'#141c2c',light:'#535069',armor:gold,glove:'#656070'};
    let b=P('33,40 20,52 17,80 8,117 28,110 29,129 43,119 51,129 59,116 78,125 74,106 91,112 80,76 78,52 65,40',dark)+P('37,49 48,60 43,98 37,121 30,112 33,80','#3e354d')+P('58,48 51,69 55,103 65,120 73,119 64,74','#151d2c')+L('25,57 35,61 31,90 24,110',gold,1)+L('74,57 64,61 68,93 76,110',gold,1)+P('32,42 24,36 30,30 30,16 38,9 61,9 70,18 70,30 77,36 67,43 57,47 43,47',dark)+P('31,31 40,24 60,24 70,32 64,37 58,39 42,39 35,36',gold)+P('37,29 43,26 58,27 65,31 60,36 40,36','#302d42')+mirror(P('40,29 48,30 46,33 40,32','#d9c9a6',.5))+P('43,36 58,36 58,40 43,40','#ece2bf',.5)+L('46,37 46,40 50,37 50,40 54,37 54,40',dark,.6)+P('36,15 41,11 58,12 64,17 64,23 36,23','#493d51')+C(50,17,3,gold,.7)+diamond(50,17,1.4,'#e7d796');
    b+=P('24,54 17,61 12,84 21,88 31,63','#4d465e')+fist(p,17,88,.75)+P(atk?'74,54 84,48 93,60 89,70 77,65':'75,54 83,66 87,87 76,91 69,63','#4d465e')+fist(p,atk?88:81,atk?68:92,atk?1:.75)+mirror(C(31,48,3,gold,.7));
    return {aura:'#8d83ab',body:G(b,0,pose==='idle1'?-1:0)};
  }
  function harvest(pose){
    let b='';const spots=[[50,58,1.1],[26,86,.8],[76,88,.8],[31,35,.6],[73,30,.6]];
    for(const[x,y,s]of spots){const unit=P('-10,-12 -9,-23 -5,-28 5,-28 10,-23 11,-12 7,-3 -7,-3','#d6ba5e')+P('-8,-24 -4,-26 4,-26 8,-23 8,-19 -8,-19','#f6e5a2',0)+P('-10,-13 -8,-18 -1,-19 0,-13 -2,-7 -8,-7','#668c73',.7)+P('1,-19 8,-18 11,-13 8,-7 2,-7 0,-13','#668c73',.7)+R(-7,-15,4,3,'#c9e0b7')+R(3,-15,4,3,'#c9e0b7')+P('-7,-3 7,-3 11,7 8,20 -8,20 -11,7','#dbbd68')+P('-5,1 5,1 7,14 -7,14','#f3e4ab')+L('-7,5 7,5 -8,10 8,10',INK,.7)+mirror(P('-8,2 -15,7 -15,15 -11,14 -9,8','#c49d4f'))+mirror(P('-6,20 -1,20 -1,28 -7,29 -9,26','#b28c48'))+C(0,-22,1.7,'#8d7156',0);
      b+=G(unit,x,y+(pose==='idle1'?(s<1?2:-1):0),s,s);if(pose==='punch')b+=C(x+10,y-30,2,'#f4d882',0);
    }
    return {aura:'#ddd49b',body:b};
  }
  function stone(pose){
    const d=pose==='idle1'?1:0;let b=P('25,41 39,27 60,26 77,40 83,61 79,83 64,100 42,106 24,95 16,75 17,55','#a4a399')+P('26,45 41,33 58,32 73,44 76,66 67,87 44,96 27,86 21,68','#cbc8af',0)+P('66,38 77,44 83,61 77,85 63,101 43,106 33,97 57,90 70,72','#777e7c',0)+P('34,46 45,41 62,43 68,54 64,68 57,74 44,71 35,61','#a9ad9d')+L('39,51 46,49 46,56 39,57 39,51 54,51 61,52 61,58 54,57 54,51 51,59 48,64 54,65 45,68 56,69',INK,1)+L('31,38 33,44 27,52 28,61 23,66', '#787d77',1.2)+L('73,57 67,64 70,74 62,79', '#b9bca4',1.2)+L('40,81 40,90 61,87 61,78 40,81 47,81 51,87 54,80', '#5b6765',1.4)+[ [24,48],[29,86],[66,37] ].map(([x,y])=>R(x,y,4,2,'#718b72')).join('');
    if(pose==='punch')b=G(b,0,5)+P('7,109 19,103 29,109 15,112','#a4a399')+P('76,108 89,101 96,109 83,113','#a4a399')+L('18,15 24,28 17,22 15,33','#dedbc8',1.6);
    return {aura:'#b6bca7',body:G(b,d,0)};
  }
  function fool(pose){
    const atk=pose==='punch';let b=cloud(34,103,1.4)+cloud(66,111,1.6)+P('23,80 18,66 25,54 38,47 61,53 72,66 70,85 57,99 37,99','#b69b65')+P('27,59 35,54 58,60 63,75 57,88 38,90 28,81','#e0ca8f')+P('28,55 35,45 45,49 47,61 39,68','#7f8790')+P('53,55 63,48 69,58 68,73 60,79 55,68','#7f8790')+mirror(P('29,84 40,85 39,105 33,110 22,110 22,106 28,101','#838b8f'))+mirror(C(29,85,8,'#484e59')+C(29,85,4,'#bec2b6'));
    b+=P(atk?'58,54 62,36 74,28 89,32 94,41 90,49 96,57 90,66 73,64 66,73':'55,52 59,35 70,24 83,29 90,39 88,50 96,58 89,66 71,61 66,71','#b69961')+P('65,36 70,25 71,14 78,28 85,18 86,35','#c2ad79')+P('65,38 75,32 85,37 87,48 78,53 68,49','#d1c49c')+P('68,39 75,41 72,45 66,44',INK,.5)+P('79,41 86,40 85,45 80,46',INK,.5)+P('76,49 84,49 89,55 83,58 75,54','#5a5c62')+P('74,57 88,58 85,64 77,62','#d8dbd1')+L('77,59 85,60',INK,.8)+P('19,67 10,54 8,43 16,51 26,57','#b69b65')+mirror(P('25,56 18,48 20,45 29,51','#d8dbd1'));
    return {aura:'#d8c49a',body:G(b,pose==='idle1'?1:0,pose==='idle1'?-1:0)};
  }
  function thoth(pose){
    const atk=pose==='punch';let b=P('23,28 76,21 84,98 29,110','#9d554b')+P('25,25 77,20 81,99 29,107','#d7c49b')+P('29,27 72,23 77,95 33,102','#efe4c4')+P('32,30 69,27 74,90 36,96','#b1685b')+P('35,36 66,32 70,84 39,90','#e3d6b8')+L('29,29 33,101 77,95', '#6f484c',1.1)+L('34,99 76,93 34,101 76,95', '#9a8d72',.7)+P('37,40 39,35 46,33 48,37 58,35 64,39 66,48 61,56 59,70 48,73 40,65','#4d4851')+P('41,44 47,40 61,41 64,51 58,57 59,67 48,70 42,64','#e9dec7')+ELL(46,48,3,4,'#fff7db',.8)+C(46,49,1.4,INK,0)+ELL(57,47,3,4,'#fff7db',.8)+C(57,48,1.4,INK,0)+P('47,56 61,55 58,62 49,64','#986959',.6)+L('50,58 59,57', '#ede0c0',.8)+P('39,37 35,29 42,31 48,27 54,31 63,27 64,36','#3c3c49')+L('41,80 65,77 41,83 62,80', '#53464b',1)+diamond(51,85,2,'#c49a5e');
    if(atk)b+=P('17,42 6,35 13,52 6,59 22,59','#eee1bf')+L('12,43 17,48 12,55', '#aa6358',1.5)+P('81,55 93,48 88,63 97,70 83,73','#eee1bf')+L('88,55 85,63 91,68','#aa6358',1.3);
    return {aura:'#d5baa0',body:G(b,0,pose==='idle1'?-2:0)};
  }
  const humanIds=['punho_estelar','instante_dourado','diamante_rosa','vida_aurea','cavaleiro_prata','rainha_explosiva','ave_brasa','sacerdote_esmeralda','fio_livre','brisa'];
  for(const id of humanIds)D[id]=(pose)=>humanoid(id,pose);
  for(const id of ['punho_estelar~1','vida_aurea~1','cavaleiro_prata~1','rainha_explosiva~1'])D[id]=(pose)=>humanoid(id,pose);
  for(const id of ['eco_sonoro','eco_sonoro~1','eco_sonoro~2'])D[id]=(pose)=>echoes(id,pose);
  D.videira_purpura=vines;D.seis_balas=six;D.sombra_leal=sabbath;D.vagalume=harvest;D.golem_bolso=stone;D.lobo_etereo=fool;D.coruja_arcana=thoth;
  EA.references=Object.freeze({punho_estelar:'Star Platinum',instante_dourado:'The World',diamante_rosa:'Crazy Diamond',vida_aurea:'Gold Experience',cavaleiro_prata:'Silver Chariot',rainha_explosiva:'Killer Queen',ave_brasa:'Magician’s Red',sacerdote_esmeralda:'Hierophant Green',fio_livre:'Stone Free',eco_sonoro:'Echoes',videira_purpura:'Hermit Purple',seis_balas:'Sex Pistols',sombra_leal:'Black Sabbath',vagalume:'Harvest',golem_bolso:'Rolling Stones',brisa:'Weather Report',lobo_etereo:'The Fool',coruja_arcana:'Thoth'});
  const svgCache=new Map(),urlCache=new Map(),canvasCache=new Map();
  const frameName=f=>f==='punch'?'punch':f==='idle1'?'idle1':'idle0';
  function canonical(id){id=String(id||'');return D[id]?id:'sombra_leal';}
  EA.svg=(id,frame='idle0',opts={})=>{
    id=canonical(id);frame=frameName(frame);const key=id+'|'+frame+'|'+!!opts.menace;if(svgCache.has(key))return svgCache.get(key);
    const art=D[id](frame),runes=opts.menace?`<g fill="${art.aura}" stroke="${INK}" stroke-width=".8" opacity=".6" font-family="sans-serif" font-weight="900"><text x="4" y="28" font-size="15" transform="rotate(-12 4 28)">ゴ</text><text x="78" y="19" font-size="15" transform="rotate(10 78 19)">ゴ</text><text x="3" y="73" font-size="12">ゴ</text></g>`:'';
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 100 130" shape-rendering="crispEdges"><title>${EA.references[id.split('~')[0]]||'Eco'} · ${frame}</title>${halo(art.aura,frame)}${runes}${art.body}</svg>`;
    svgCache.set(key,svg);return svg;
  };
  EA.url=(id,frame='idle0',opts={})=>{id=canonical(id);frame=frameName(frame);const key=id+'|'+frame+'|'+!!opts.menace;if(!urlCache.has(key))urlCache.set(key,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(EA.svg(id,frame,opts)));return urlCache.get(key);};
  EA.portrait=id=>EA.url(id,'idle0',{menace:true});
  EA.draw=(id,frame='idle0')=>{
    id=canonical(id);frame=frameName(frame);const key=id+'|'+frame;if(canvasCache.has(key))return canvasCache.get(key);
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv._res=1;cv._ready=false;cv._cbs=[];canvasCache.set(key,cv);
    const img=new Image();img.onload=()=>{const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);ctx.drawImage(img,0,0,W,H);cv._ready=true;for(const fn of cv._cbs.splice(0))fn(cv);};img.onerror=()=>{cv._ready=true;for(const fn of cv._cbs.splice(0))fn(cv);};img.src=EA.url(id,frame);return cv;
  };
  EA.onReady=(cv,fn)=>{if(!cv)return;if(cv._ready)fn(cv);else(cv._cbs=cv._cbs||[]).push(fn);};
  EA.preload=()=>{const h=E.Store&&E.Store.hero(),eq=h&&E.Eco&&E.Eco.equipped(h);if(eq)for(const f of ['idle0','idle1','punch'])EA.draw(eq.art,f);};
  EA.stats=()=>({svg:svgCache.size,urls:urlCache.size,canvases:canvasCache.size,forms:Object.keys(D).length});
  E.ECOART=EA;
})();
