(() => {
  'use strict';
  const P=E.Poker,U=E.U,UI={};
  UI.open=anchor=>{
    const h=E.Store.hero();if(!h)return;
    const panel=E.WorldServices.open({title:'Íris · Pôquer de cinco cartas',icon:'cards',anchor,text:'Regra da casa: você e o crupiê recebem 5 cartas de um baralho único de 52 cartas, sem coringas. Uma troca de até 3 cartas. Maior mão vence: prêmio total 2× a aposta. Empate exato devolve a aposta.'});
    panel.classList.add('poker-panel');const body=panel.querySelector('.ws-content');let stake=10,selected=new Set(),busy=false;
    const card=(c,i,hidden,selectable)=>`<button class="pk-card ${hidden?'pk-back':''} ${c&&'♥♦'.includes(c.s)?'pk-red':''} ${selectable&&selected.has(i)?'pk-selected':''}" style="--card-delay:${i*55}ms" ${!selectable||busy?'disabled':''} ${selectable?'data-card="'+i+'" aria-pressed="'+selected.has(i)+'"':''} aria-label="${hidden?'Carta fechada':c.r+' '+c.s+(selectable?(selected.has(i)?', trocar':', manter'):'')}">${hidden?'<span>✦</span>':'<b>'+c.r+'</b><span>'+c.s+'</span>'}${selectable?'<small>'+(selected.has(i)?'TROCAR':'MANTER')+'</small>':''}</button>`;
    const draw=animate=>{
      if(!panel.isConnected)return;
      const r=P.current(h),active=r&&r.status==='active',wallet=panel.querySelector('.ws-wallet');wallet.textContent=h.gold+' po · '+E.Life.data(h).chips+' fichas';
      body.innerHTML=`<div class="poker-table ${animate?'pk-dealing':''}"><b class="poker-dealer">ÍRIS · CRUPIÊ</b><div class="pk-hand" aria-label="Mão do crupiê">${r?r.dealer.map((c,i)=>card(c,i,active,false)).join(''):'<p>O baralho está pronto.</p>'}</div><p class="pk-rank">${r&&!active?r.dealerRank+(r.dealerDraw?' · Trocou '+r.dealerDraw+' carta(s)':' · Manteve as cinco'):active?'Cartas do crupiê serão reveladas após a troca.':''}</p><b>SUA MÃO</b><div class="pk-hand" aria-label="Sua mão">${r?r.player.map((c,i)=>card(c,i,false,active)).join(''):''}</div><p class="pk-rank">${r?(active?P.rank(r.player).name:r.playerRank):''}</p><p class="pk-message" role="status">${active?'Selecione até 3 cartas para trocar, ou mantenha todas.':r?r.message+' '+(r.payout?'Retorno: '+r.payout+' fichas.':'Sem retorno de fichas.'):'Escolha a aposta e distribua as cartas.'}</p></div><div class="cs-bet" data-bets><span>Aposta:</span>${[5,10,25,50,100,250].map(v=>`<button data-stake="${v}" class="${v===stake?'on':''}" ${active||busy?'disabled':''}>${v}</button>`).join('')}</div><button class="btn primary pk-go" ${busy?'disabled':''}>${active?(selected.size?'Trocar '+selected.size+' carta(s)':'Manter as cinco'):r?'Nova mão':'Distribuir'}</button><details class="pk-rules"><summary>Ordem das mãos e desempate</summary><p>Straight flush → quadra → full house → flush → sequência → trinca → dois pares → par → carta alta. As cartas relevantes e depois os desempates são comparados da maior para a menor. Naipes não desempatam. Ás vale alto, ou baixo apenas em A–2–3–4–5.</p><p>O crupiê mantém sequências, flushes e mãos melhores. Nas demais, mantém grupos e troca até 3 cartas soltas; sem par, troca as 3 menores. A mão ativa fica salva se você sair ou recarregar.</p></details>`;
      body.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.card);if(selected.has(i))selected.delete(i);else if(selected.size<3)selected.add(i);else return E.UI.toast('Você pode trocar até três cartas.');draw(false);});
      body.querySelectorAll('[data-stake]').forEach(b=>b.onclick=()=>{stake=Number(b.dataset.stake);draw(false);});
      body.querySelector('.pk-go').onclick=()=>{
        if(busy)return;
        const result=active?P.draw(h,[...selected]):P.deal(h,stake);if(result.error)return E.UI.toast(result.error);
        selected.clear();busy=true;if(E.Audio)E.Audio.sfx('click');draw(true);
        setTimeout(()=>{busy=false;draw(false);},550);
      };
    };draw(false);return panel;
  };
  E.PokerUI=UI;
})();
