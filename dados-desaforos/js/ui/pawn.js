/* O balcão mostra a avaliação completa antes de qualquer transação. */
(() => {
  'use strict';
  const P=E.Pawn,U=E.U,esc=v=>U.esc(String(v==null?'':v)),UI={};
  UI.open=anchor=>{
    const h=E.Store.hero();if(!h||!P.data(h))return E.UI.toast('Registro de penhores indisponível.');
    const panel=E.WorldServices.open({title:'Nara · Penhores',icon:'sword',anchor,text:'Armas e focos com identidade própria podem ficar no cofre em troca de ouro do jogo. Armaduras, escudos e consumíveis não são aceitos neste balcão.'});
    panel.classList.add('pawn-panel');const body=panel.querySelector('.ws-content');
    let preview=null,message='';
    const notify=r=>{message=r.message||'';if(!r.ok)E.UI.toast(message);if(E.HUD)E.HUD.update();};
    const draw=()=>{
      if(!panel.isConnected)return;
      body.innerHTML=`<p class="pawn-terms">${esc(P.TERMS)}</p><p class="pawn-message" role="status">${esc(message)}</p><div data-preview></div><h4>Equipamentos do arsenal</h4><div data-inventory></div><h4>Guardados no cofre</h4><div data-held></div><div class="pawn-backup"><button class="btn sm dark" data-backup>Baixar cópia do salvamento</button><small>Guarde este arquivo para recuperar seu progresso, incluindo os penhores.</small></div>`;
      const wallet=panel.querySelector('.ws-wallet');if(wallet)wallet.textContent=h.gold+' po';
      if(preview){
        const q=preview,box=U.h(`<section class="pawn-quote"><h4>${esc(q.item.name)}</h4><p>★${q.item.rarity} · Nível ${q.item.level} · R${q.item.refine} · Ascensão ${q.item.ascension}</p><dl><dt>Avaliação da casa</dt><dd>${q.item.value} po</dd><dt>Você recebe agora</dt><dd>${q.received} po</dd><dt>Taxa única, já incluída no resgate</dt><dd>${q.fee} po</dd><dt>Total para resgatar</dt><dd>${q.redemption} po</dd></dl><p>Sem vencimento. O mesmo item, com suas melhorias, fica reservado para este personagem.</p><div class="pawn-actions"><button class="btn primary" data-confirm>Confirmar penhor · receber ${q.received} po</button><button class="btn dark" data-cancel>Cancelar</button></div></section>`);
        box.querySelector('[data-confirm]').onclick=()=>{const r=P.confirm(h,q.id,true);notify(r);preview=null;draw();};
        box.querySelector('[data-cancel]').onclick=()=>{preview=null;draw();};body.querySelector('[data-preview]').appendChild(box);
      }
      const list=body.querySelector('[data-inventory]'),items=P.inventory(h);
      if(!items.length)list.innerHTML='<p class="muted">Nenhuma arma no arsenal.</p>';
      for(const entry of items){
        const m=entry.item,row=U.h(`<div class="pawn-item"><div><b>${esc(m?m.name:'Equipamento sem avaliação')}</b><small>${esc(entry.reason||(m?'★'+m.rarity+' · Nível '+m.level+' · R'+m.refine:''))}</small></div><button class="btn sm dark" ${entry.reason?'disabled':''}>Avaliar</button></div>`);
        row.querySelector('button').onclick=()=>{const r=P.quote(h,entry.uid);if(r.ok){preview=r.quote;message='Confira o ouro recebido e o custo fixo de resgate.';}else notify(r);draw();};list.appendChild(row);
      }
      const held=P.data(h).records.filter(r=>r.status==='held'),safe=body.querySelector('[data-held]');
      if(!held.length)safe.innerHTML='<p class="muted">Nenhum equipamento sob penhor.</p>';
      for(const r of held){
        const q=r.quote,row=U.h(`<div class="pawn-item"><div><b>${esc(q.item.name)}</b><small>Recebido: ${q.received} po · Resgate: ${q.redemption} po<br>Sem prazo · Recibo ${esc(r.id)}</small></div><button class="btn sm primary" ${h.gold<q.redemption?'disabled':''}>Resgatar</button></div>`);
        row.querySelector('button').onclick=()=>{
          const box=U.h(`<section class="pawn-quote"><h4>Resgatar ${esc(q.item.name)}</h4><p>Pagar ${q.redemption} po do jogo e receber de volta a mesma arma, com identidade, arte e melhorias preservadas.</p><div class="pawn-actions"><button class="btn primary" data-redeem>Confirmar resgate · ${q.redemption} po</button><button class="btn dark" data-cancel>Cancelar</button></div></section>`);
          const target=body.querySelector('[data-preview]');target.replaceChildren(box);preview=null;
          box.querySelector('[data-redeem]').onclick=()=>{notify(P.redeem(h,r.id,true));draw();};box.querySelector('[data-cancel]').onclick=draw;
          box.scrollIntoView({block:'nearest',behavior:'smooth'});
        };safe.appendChild(row);
      }
      const recent=P.data(h).records.filter(r=>r.status==='redeemed').slice(-3).reverse();
      for(const r of recent)safe.appendChild(U.h(`<p class="pawn-receipt">✓ ${esc(r.quote.item.name)} devolvido · ${esc(r.receipt.redemption.id)}</p>`));
      body.querySelector('[data-backup]').onclick=()=>{
        const blob=new Blob([E.Store.exportSave()],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='dados-e-desaforos-salvamento-'+new Date().toISOString().slice(0,10)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      };
    };draw();return panel;
  };
  E.PawnUI=UI;
})();
