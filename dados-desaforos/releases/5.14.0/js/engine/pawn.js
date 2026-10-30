/* Penhor local: a instância sai do arsenal e só volta após o resgate em ouro. */
(() => {
  'use strict';
  const P = {}, copy = v => JSON.parse(JSON.stringify(v));
  const fail = message => ({ok:false, message});
  const whole = n => Number.isSafeInteger(n) && n >= 0;
  const heroes = () => E.state.heroes || [];
  const validHero = h => h && !h.deleted && heroes().includes(h) && E.Store.hero() === h;
  const key = () => E.Acc ? E.Acc.saveKey() : 'elarion-save-v1';
  P.TERMS = 'Regra da casa: recebe 50% da avaliação; resgate pelo valor recebido + taxa única de 10% (mínimo 1 po). Sem prazo, juros adicionais ou perda definitiva. Somente ouro do jogo. A arma fica indisponível até o resgate.';
  P.data = h => {
    if (!h) return null;
    if (!h.pawns) h.pawns = {v:1, serial:0, quotes:[], records:[]};
    const d=h.pawns;
    return d.v===1 && whole(d.serial) && Array.isArray(d.quotes) && Array.isArray(d.records) ? d : null;
  };
  const allRecords = () => heroes().flatMap(h => h.pawns && Array.isArray(h.pawns.records) ? h.pawns.records : []);
  P.isHeld = uid => allRecords().some(r => r.status==='held' && r.item && r.item.uid===uid);
  const equipped = uid => heroes().some(h => h.equip && Object.values(h.equip).includes(uid));
  // Catálogo real ou arma/foco mundano conhecido; metadados desconhecidos não viram ouro.
  const metadata = w => {
    if (!w || typeof w.uid!=='string' || !w.uid || typeof w.id!=='string') return null;
    const catalog=E.W.CATALOG[w.id], def=E.C.weaponDef(w);
    if (!def || !E.W.RARITY[def.rarity] || !E.W.TYPES[def.type]) return null;
    const ordinary=w.id.match(/^(?:m_|starter:)(.+)$/), focus=w.id.match(/^(?:f_|focus:)(.+)$/);
    const mundane=ordinary && E.Forge.MUNDANE.find(([id]) => id===ordinary[1] && def.base===id);
    const foci=focus && E.Forge.FOCI.find(([id]) => id===focus[1] && def.type==='catalisador');
    if (!catalog && !(def.rarity===1 && (mundane || foci))) return null;
    const lv=w.lv===undefined?1:w.lv, refine=w.refine===undefined?1:w.refine, asc=w.asc===undefined?0:w.asc;
    if (!Number.isInteger(lv)||lv<1||lv>90||!Number.isInteger(refine)||refine<1||refine>5||!Number.isInteger(asc)||asc<0||asc>6) return null;
    const base=catalog ? catalog.shop && catalog.shop.price || ({1:20,3:900,4:4200,5:16000})[def.rarity] : (mundane || foci)[1];
    const value=Math.max(2,Math.floor(base*(100+(lv-1)*2+(refine-1)*15+asc*10)/100));
    if (!whole(value)) return null;
    return {name:def.name, rarity:def.rarity, level:lv, refine, ascension:asc, value};
  };
  const usable = (h,w) => {
    const d=E.C.weaponDef(w);
    return d && d.base && E.R.WEAPONS[d.base] && (!E.C.proficientWith || E.C.proficientWith(h,d.base));
  };
  P.reason = (h,w) => {
    if (!validHero(h)) return 'Selecione seu personagem ativo.';
    if (!P.data(h)) return 'Registro de penhores inválido. Restaure uma cópia do salvamento.';
    if (!metadata(w)) return 'Equipamento desconhecido ou sem avaliação segura.';
    if ((E.state.weapons||[]).filter(v=>v.uid===w.uid).length!==1 || P.isHeld(w.uid)) return 'Instância indisponível ou UID duplicado.';
    if (w.lock || w.locked || w.bound || w.soulbound || w.quest || w.mission || w.questItem || w.unsellable || [w.custom,E.W.CATALOG[w.id]].some(d=>d&&(d.bound||d.soulbound||d.quest||d.mission||d.questItem||d.unsellable))) return 'Item travado, vinculado ou de missão não pode ser penhorado.';
    if (equipped(w.uid)) return 'Equipado por um personagem. Desequipe antes de avaliar.';
    if ([w.ownerHeroId,w.heroId].some(id=>id && id!==h.id) || w.ownerId && ![h.id,E.state.uid].includes(w.ownerId)) return 'Este equipamento pertence a outro personagem.';
    if (usable(h,w) && !(E.state.weapons||[]).some(v=>v.uid!==w.uid && !P.isHeld(v.uid) && usable(h,v) && !heroes().some(other=>other.id!==h.id&&other.equip&&Object.values(other.equip).includes(v.uid)))) return 'Guarde ao menos uma arma utilizável para continuar a aventura.';
    return null;
  };
  P.inventory = h => (E.state.weapons||[]).map(w=>({uid:w.uid, item:metadata(w), reason:P.reason(h,w)}));
  // O salvamento inteiro é uma escrita local atômica. Em falha, reverta o estado em memória.
  const commit = (h,fn) => {
    const before={gold:h.gold, weapons:E.state.weapons.slice(), pawns:copy(h.pawns)};
    try {
      const result=fn();
      if (E.U.save) {if (E.U.save(key(),E.state)!==true) throw new Error('storage');}
      else E.Store.save();
      return result;
    } catch (_) {
      h.gold=before.gold; E.state.weapons=before.weapons; h.pawns=before.pawns;
      return fail('Não foi possível salvar. Nenhum ouro ou item foi alterado. Baixe uma cópia e libere espaço no navegador.');
    }
  };
  P.quote = (h,uid) => {
    const w=E.Store.weapon(uid),reason=P.reason(h,w); if(reason)return fail(reason);
    const d=P.data(h),m=metadata(w),snapshot=JSON.stringify(w);
    const previous=d.quotes.find(q=>q.uid===uid && q.snapshot===snapshot && !q.confirmed);
    if(previous)return {ok:true,quote:copy(previous)};
    if(!whole(d.serial+1))return fail('Limite de registros atingido.');
    const received=Math.floor(m.value/2),fee=Math.max(1,Math.ceil(received/10)),redemption=received+fee;
    return commit(h,()=>{
      const q={id:'pawn-'+(++d.serial),uid,heroId:h.id,accountId:E.state.uid,snapshot,item:m,received,fee,redemption,terms:P.TERMS,created:Date.now(),confirmed:false};
      d.quotes=d.quotes.filter(v=>v.uid!==uid || v.confirmed);d.quotes.push(q);
      return {ok:true,quote:copy(q)};
    });
  };
  P.confirm = (h,quoteId,confirmed=false) => {
    if(!validHero(h)||!P.data(h))return fail('Selecione seu personagem ativo.');
    const d=P.data(h),old=d.records.find(r=>r.id===quoteId);
    if(old)return {ok:true,repeated:true,record:copy(old),message:'Este penhor já foi registrado.'};
    if(confirmed!==true)return fail('Confirme os valores e os termos antes de penhorar.');
    const q=d.quotes.find(v=>v.id===quoteId),w=q&&E.Store.weapon(q.uid);
    if(!q||q.heroId!==h.id||q.accountId!==E.state.uid)return fail('Avaliação não encontrada para este personagem.');
    const reason=P.reason(h,w);if(reason)return fail(reason);
    if(q.snapshot!==JSON.stringify(w))return fail('O equipamento mudou. Faça uma nova avaliação.');
    if(!whole(h.gold)||![q.received,q.fee,q.redemption].every(whole)||q.received<1||q.fee<1||q.redemption!==q.received+q.fee||!whole(h.gold+q.received))return fail('Valor de ouro inválido.');
    return commit(h,()=>{
      const record={id:q.id,heroId:h.id,accountId:E.state.uid,status:'held',item:copy(w),quote:copy(q),pledgedAt:Date.now(),receipt:{pledge:q.id+':pledge',gold:q.received}};
      E.state.weapons=E.state.weapons.filter(v=>v.uid!==w.uid);h.gold+=q.received;q.confirmed=true;d.records.push(record);
      return {ok:true,record:copy(record),message:'Equipamento guardado. Você recebeu '+q.received+' po.'};
    });
  };
  P.redeem = (h,id,confirmed=false) => {
    if(!validHero(h)||!P.data(h))return fail('Selecione seu personagem ativo.');
    const r=P.data(h).records.find(v=>v.id===id);
    if(!r||r.heroId!==h.id||r.accountId!==E.state.uid)return fail('Este penhor pertence a outro personagem.');
    if(r.status==='redeemed')return {ok:true,repeated:true,record:copy(r),message:'Este equipamento já foi resgatado.'};
    if(confirmed!==true)return fail('Confirme o custo antes de resgatar.');
    const price=r.quote&&r.quote.redemption;
    if(r.status!=='held'||!r.item||!whole(price)||price<1||!whole(h.gold))return fail('Registro de penhor inválido.');
    if(h.gold<price)return fail('Ouro insuficiente. O equipamento continua guardado, sem prazo.');
    const uid=r.item.uid;
    const otherEscrow=heroes().some(hero=>hero.vendor&&Object.values(hero.vendor.shops||{}).some(s=>(s.stocks||[]).some(v=>v.weapon&&v.weapon.uid===uid)));
    if((E.state.weapons||[]).some(w=>w.uid===uid)||allRecords().filter(v=>v.status==='held'&&v.item&&v.item.uid===uid).length!==1||otherEscrow||equipped(uid))return fail('UID já utilizado ou em outra custódia. Resgate cancelado para evitar duplicação.');
    return commit(h,()=>{
      E.state.weapons.push(copy(r.item));h.gold-=price;r.status='redeemed';r.redeemedAt=Date.now();r.receipt.redemption={id:r.id+':redeem',gold:price};
      return {ok:true,record:copy(r),message:'Equipamento devolvido ao arsenal com sua identidade e melhorias.'};
    });
  };
  // A forja recebe objetos diretamente; bloqueie também referências antigas de telas já fechadas.
  if(E.Forge){
    const F=E.Forge,canSell=F.canSell,levelUp=F.levelUp,ascend=F.ascend;
    F.canSell=entry=>entry&&P.isHeld(entry.uid)?'Equipamento sob penhor. Resgate no cassino.':canSell(entry);
    F.levelUp=(h,entry,...args)=>entry&&P.isHeld(entry.uid)?{error:'Equipamento sob penhor.'}:levelUp(h,entry,...args);
    F.ascend=(h,entry,...args)=>entry&&P.isHeld(entry.uid)?null:ascend(h,entry,...args);
  }
  E.Pawn=P;
})();
