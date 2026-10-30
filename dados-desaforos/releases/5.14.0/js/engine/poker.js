/* Pôquer da casa: cinco cartas contra o crupiê, uma troca de até três cartas. */
(() => {
  'use strict';
  const P={},G=E.CasinoGames,ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const names=['Carta alta','Um par','Dois pares','Trinca','Sequência','Flush','Full house','Quadra','Straight flush'];
  P.deck=()=>E.U.shuffle(['♠','♥','♦','♣'].flatMap(s=>ranks.map(r=>({r,s}))));
  const compare=(a,b)=>{for(let i=0;i<Math.max(a.length,b.length);i++){const n=(a[i]||0)-(b[i]||0);if(n)return Math.sign(n);}return 0;};
  P.rank=cards=>{
    if(!Array.isArray(cards)||cards.length!==5||cards.some(c=>!c||!ranks.includes(c.r)||!['♠','♥','♦','♣'].includes(c.s))||new Set(cards.map(c=>c.r+c.s)).size!==5)return null;
    const values=cards.map(c=>ranks.indexOf(c.r)+2).sort((a,b)=>b-a),counts={};values.forEach(v=>counts[v]=(counts[v]||0)+1);
    const groups=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]||b-a),flush=cards.every(c=>c.s===cards[0].s),unique=[...new Set(values)];
    const straight=unique.length===5?(values[0]-values[4]===4?values[0]:values.join(',')==='14,5,4,3,2'?5:0):0;
    let value;
    if(flush&&straight)value=[8,straight];
    else if(counts[groups[0]]===4)value=[7,...groups];
    else if(counts[groups[0]]===3&&counts[groups[1]]===2)value=[6,...groups];
    else if(flush)value=[5,...values];
    else if(straight)value=[4,straight];
    else if(counts[groups[0]]===3)value=[3,...groups];
    else if(counts[groups[0]]===2&&counts[groups[1]]===2)value=[2,...groups];
    else if(counts[groups[0]]===2)value=[1,...groups];
    else value=[0,...values];
    return {value,name:names[value[0]]};
  };
  P.compare=(a,b)=>{const A=P.rank(a),B=P.rank(b);return A&&B?compare(A.value,B.value):null;};
  P.current=h=>G.current(h,'poker');
  P.deal=(h,stake)=>{
    const current=P.current(h);if(current&&current.status==='active')return current;
    // Reserva aritmética para o pagamento máximo, antes de debitar qualquer ficha.
    const chips=E.Life.data(h).chips;if(!Number.isSafeInteger(stake)||stake<1||!Number.isSafeInteger(chips)||!Number.isSafeInteger(chips+stake))return {error:'Aposta inválida.'};
    const deck=P.deck(),player=deck.splice(-5),dealer=deck.splice(-5);
    const r=G.begin(h,'poker',stake);if(r.error)return r;
    Object.assign(r,{deck,player,dealer,phase:'draw',discarded:[],draws:0});E.Store.save();return r;
  };
  const dealerDiscards=cards=>{
    const rank=P.rank(cards);if(rank.value[0]>=4)return [];
    const counts={};cards.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
    if(rank.value[0]>=1)return cards.map((c,i)=>counts[c.r]===1?i:-1).filter(i=>i>=0).slice(0,3);
    return cards.map((c,i)=>({i,v:ranks.indexOf(c.r)})).sort((a,b)=>a.v-b.v).slice(0,3).map(c=>c.i);
  };
  P.draw=(h,indices)=>{
    const r=P.current(h);if(!r||r.status!=='active'||r.phase!=='draw')return {error:'Não há mão aguardando troca.'};
    if(!Array.isArray(indices)||indices.length>3||indices.some(i=>!Number.isInteger(i)||i<0||i>4)||new Set(indices).size!==indices.length)return {error:'Escolha de zero a três cartas diferentes.'};
    if(!P.rank(r.player)||!P.rank(r.dealer)||!Array.isArray(r.deck)||r.deck.length!==42)return {error:'Mão inválida. Restaure uma cópia do salvamento.'};
    const all=[...r.player,...r.dealer,...r.deck];if(all.some(c=>!c||!ranks.includes(c.r)||!['♠','♥','♦','♣'].includes(c.s))||new Set(all.map(c=>c.r+c.s)).size!==52)return {error:'Baralho inválido.'};
    const d=dealerDiscards(r.dealer),player=r.player.map(c=>({...c})),dealer=r.dealer.map(c=>({...c})),deck=r.deck.slice(),discarded=[];
    for(const i of indices){discarded.push(player[i]);player[i]=deck.pop();}
    for(const i of d){discarded.push(dealer[i]);dealer[i]=deck.pop();}
    const playerRank=P.rank(player),dealerRank=P.rank(dealer),winner=P.compare(player,dealer),payout=winner>0?r.stake*2:winner===0?r.stake:0;
    if(!Number.isSafeInteger(payout)||!Number.isSafeInteger(E.Life.data(h).chips+payout))return {error:'Saldo não comporta o pagamento.'};
    Object.assign(r,{player,dealer,deck,discarded,draws:1,playerDraw:indices.slice(),dealerDraw:d.length,playerRank:playerRank.name,dealerRank:dealerRank.name});
    G.settle(h,r,payout,winner>0?'Sua mão vence!':winner===0?'Empate exato. Aposta devolvida.':'A mão do crupiê vence.');return r;
  };
  E.Poker=P;
})();
