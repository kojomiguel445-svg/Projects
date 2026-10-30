/* Rodadas locais persistidas: aposta debitada antes do sorteio e prêmio liquidado uma vez. */
(() => {
  'use strict';
  const G = {}, U = E.U;
  G.SYMBOLS = [
    { id:'cherry', name:'Cerejas', icon:'food', mark:'●●', w:30, pay:8 },
    { id:'lemon', name:'Limão', icon:'plant', mark:'◆', w:25, pay:10 },
    { id:'bell', name:'Sino', icon:'bell', mark:'♜', w:18, pay:15 },
    { id:'star', name:'Estrela', icon:'star', mark:'★', w:12, pay:30 },
    { id:'gem', name:'Gema', icon:'gem', mark:'◇', w:7, pay:60 },
    { id:'seven', name:'Sete', icon:'dice', mark:'7', w:5, pay:120 },
    { id:'dragon', name:'Dragão', icon:'dragon', mark:'D', w:3, pay:'J' }
  ];
  const save = () => E.Store.save();
  const data = h => {
    const life = E.Life.data(h);
    if (!life.casinoGames) life.casinoGames = { serial:0, active:{}, history:[] };
    return life.casinoGames;
  };
  G.current = (h, kind) => data(h).active[kind] || null;
  G.begin = (h, kind, stake) => {
    const d=E.Life.data(h), games=data(h), old=games.active[kind];
    if (old && old.status === 'active') return { error:'Termine a rodada atual antes de apostar novamente.' };
    if (!Number.isSafeInteger(stake) || stake < 1 || !Number.isSafeInteger(d.chips) || d.chips < stake) return { error:'Fichas insuficientes. Troque ouro por fichas no caixa.' };
    d.chips -= stake;
    const round={ id:++games.serial, kind, stake, status:'active', payout:0, phase:'bet' };
    games.active[kind]=round; save();
    E.Life.addXp(h,'jogatina',Math.min(12,1+Math.round(stake/20))); E.Life.ev('bet');
    return round;
  };
  G.settle = (h, round, payout, message) => {
    const games=data(h), live=games.active[round && round.kind];
    if (!live || live.id !== round.id || live.status !== 'active') return false;
    if (!Number.isSafeInteger(payout) || payout < 0) return false;
    const d=E.Life.data(h); if (!Number.isSafeInteger(d.chips + payout)) return false;
    live.status='settled'; live.phase='done'; live.payout=payout; live.message=message || '';
    d.chips+=payout;
    games.history.unshift({id:live.id,kind:live.kind,stake:live.stake,payout}); games.history.length=Math.min(games.history.length,12);
    E.Life.checkAch(h); save(); return true;
  };
  G.value = cards => {
    let n=0,aces=0;
    for (const c of cards) { if(c.r==='A'){n+=11;aces++;}else n+=['J','Q','K'].includes(c.r)?10:Number(c.r); }
    while(n>21&&aces){n-=10;aces--;}return n;
  };
  G.deck = () => {
    const deck=[];for(let k=0;k<4;k++)for(const s of ['♠','♥','♦','♣'])for(const r of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])deck.push({r,s});
    return U.shuffle(deck);
  };
  G.slots = (h, stake) => {
    const r=G.begin(h,'slots',stake);if(r.error)return r;
    E.state.jackpot=(E.state.jackpot||1500)+Math.ceil(stake*.05);
    const total=G.SYMBOLS.reduce((n,s)=>n+s.w,0), pick=()=>{let n=U.rand()*total;for(let i=0;i<G.SYMBOLS.length;i++){n-=G.SYMBOLS[i].w;if(n<0)return i;}return 0;};
    r.reels=[pick(),pick(),pick()];const symbols=r.reels.map(i=>G.SYMBOLS[i]);let payout=0,message='Nada desta vez…';
    if(r.reels.every(i=>i===r.reels[0])){
      if(symbols[0].pay==='J'){payout=E.state.jackpot;E.state.jackpot=1500;E.Life.data(h).stats.jackpots++;message='JACKPOT!';}
      else{payout=stake*symbols[0].pay;message='Três '+symbols[0].name+'!';}
    }else if(r.reels.filter(i=>i===0).length===2){payout=stake*2;message='Duas cerejas!';}
    G.settle(h,r,payout,message);return r;
  };
  G.deal = (h, stake) => {
    const current=G.current(h,'bj');if(current&&current.status==='active'&&current.player)return current;
    const r=G.begin(h,'bj',stake);if(r.error)return r;
    r.deck=G.deck();r.player=[r.deck.pop(),r.deck.pop()];r.dealer=[r.deck.pop(),r.deck.pop()];r.phase='play';r.doubled=false;
    if(G.value(r.player)===21){
      E.Life.data(h).stats.blackjacks++;
      G.settle(h,r,G.value(r.dealer)===21?stake:Math.floor(stake*2.5),G.value(r.dealer)===21?'Dois blackjacks — empate.':'BLACKJACK! Pagamento de 3:2.');
    }else if(G.value(r.dealer)===21)G.settle(h,r,0,'O crupiê tem blackjack. A casa vence.');
    else save();return r;
  };
  const active = h => {const r=G.current(h,'bj');return r&&r.status==='active'&&r.phase==='play'?r:null;};
  G.stand = h => {
    const r=active(h);if(!r)return null;
    r.phase='dealer';
    while(G.value(r.dealer)<17)r.dealer.push(r.deck.pop());
    const p=G.value(r.player),d=G.value(r.dealer);
    G.settle(h,r,d>21||p>d?r.stake*2:p===d?r.stake:0,d>21?'O crupiê estourou!':p>d?'Sua mão vence!':p===d?'Empate. Aposta devolvida.':'A casa vence.');return r;
  };
  G.hit = h => {
    const r=active(h);if(!r)return null;r.player.push(r.deck.pop());
    if(G.value(r.player)>21)G.settle(h,r,0,'Você estourou com '+G.value(r.player)+'.');
    else if(G.value(r.player)===21){r.dealerBefore=r.dealer.length;G.stand(h);}else save();return r;
  };
  G.double = h => {
    const r=active(h),d=E.Life.data(h);if(!r||r.player.length!==2||r.doubled||d.chips<r.stake)return null;
    d.chips-=r.stake;r.stake*=2;r.doubled=true;save();r.player.push(r.deck.pop());
    if(G.value(r.player)>21)G.settle(h,r,0,'Você dobrou e estourou.');else{r.dealerBefore=r.dealer.length;G.stand(h);}return r;
  };
  E.CasinoGames=G;
})();
