/* Tela "Configurar grupo": três vagas, como a Equipe do Genshin. Toque numa vaga e escolha quem entra nela;
   quem está em campo não sai do grupo, mas pode ser trocado em "Entrar em campo". */
(() => {
  'use strict';
  const U = E.U, UI = E.UI, C = E.C, PU = {};
  let sel = 0;
  const pic = (h) => E.Portrait ? E.Portrait.url(h) : UI.heroPortrait(h);

  PU.open = () => {
    if (!E.Party || !E.Store.hero()) return;
    UI.closeAll && UI.closeAll();
    const el = UI.screen('Configurar grupo', { cls: 'party-screen' });
    const body = el.querySelector('.screen-body');
    sel = Math.max(0, E.Party.ids().indexOf(E.state.activeHero));
    const draw = () => {
      const ids = E.Party.ids(), act = E.Store.hero(), roster = E.state.heroes.filter((h) => !h.deleted);
      const slot = (i) => {
        const h = E.state.heroes.find((x) => x.id === ids[i]);
        if (!h) return `<button class="pts-slot empty ${sel === i ? 'sel' : ''}" data-slot="${i}"><span class="pts-n">${i + 1}</span><span class="pts-face"><b>＋</b></span><span class="pts-name">Vaga livre</span><small>Escolha um personagem abaixo</small></button>`;
        const pct = Math.max(0, Math.min(100, h.hp / C.maxHp(h) * 100));
        return `<button class="pts-slot ${sel === i ? 'sel' : ''} ${act && h.id === act.id ? 'field' : ''}" data-slot="${i}" style="--el:${E.Portrait.element(h)}"><span class="pts-n">${i + 1}</span><span class="pts-face" style="background-image:url(${pic(h)})"></span><span class="pts-name">${U.esc(h.name)}</span><small>Nv. ${h.level} · ${C.cls(h).name} · ${C.species(h).name}</small><i class="pts-hp"><b style="width:${pct}%"></b></i>${act && h.id === act.id ? '<em>Em campo</em>' : ''}</button>`;
      };
      const card = (h) => {
        const at = ids.indexOf(h.id), dead = !!h.dead;
        return `<button class="pts-hero ${at >= 0 ? 'in' : ''}" data-hero="${h.id}" ${dead ? 'disabled' : ''} style="--el:${E.Portrait.element(h)}"><span class="pts-mini" style="background-image:url(${pic(h)})"></span><b>${U.esc(h.name)}</b><small>${dead ? '☠ Caído' : `Nv. ${h.level} ${C.cls(h).name}`}</small>${at >= 0 ? `<em>Vaga ${at + 1}</em>` : ''}</button>`;
      };
      const cur = E.state.heroes.find((x) => x.id === ids[sel]);
      body.innerHTML = `<div class="pts">
        <p class="pts-tip">Até ${E.Party.MAX} personagens. Quem está no grupo aparece à direita da tela, troca com as teclas 1–${E.Party.MAX} e entra junto nas lutas. Cada um guarda os próprios PV, XP, ouro e empregos.</p>
        <div class="pts-slots">${[0, 1, 2].map(slot).join('')}</div>
        <div class="pts-actions">
          <button class="btn sm" data-a="field" ${!cur || (act && cur.id === act.id) ? 'disabled' : ''}><span class="ico">⇄</span>Entrar em campo</button>
          <button class="btn dark sm" data-a="remove" ${!cur || (act && cur.id === act.id) ? 'disabled' : ''}><span class="ico">✕</span>Tirar do grupo</button>
          <button class="btn dark sm" data-a="new"><span class="ico">＋</span>Novo personagem</button>
        </div>
        <h4 class="pts-h">Personagens</h4>
        <div class="pts-roster">${roster.map(card).join('')}</div>
      </div>`;
      body.querySelectorAll('[data-slot]').forEach((b) => (b.onclick = () => { sel = +b.dataset.slot; E.Audio.sfx('click'); draw(); }));
      body.querySelectorAll('[data-hero]').forEach((b) => (b.onclick = () => put(b.dataset.hero)));
      body.querySelector('[data-a=field]').onclick = () => { const id = E.Party.ids()[sel]; if (!id) return; UI.close(el); if (E.HUD && E.HUD.switchHero) E.HUD.switchHero(id); };
      body.querySelector('[data-a=remove]').onclick = () => { const next = E.Party.ids().slice(); next.splice(sel, 1); const r = E.Party.set(next); if (!r.ok) UI.toast(r.message); E.Audio.sfx('click'); draw(); };
      body.querySelector('[data-a=new]').onclick = () => { UI.closeAll(); E.Creator.open(); };
    };
    // coloca o personagem na vaga escolhida; se ele já estava em outra vaga, as duas trocam de lugar
    const put = (id) => {
      const ids = E.Party.ids().slice(), from = ids.indexOf(id);
      if (from === sel) return;
      if (from >= 0) { const other = ids[sel]; ids[sel] = id; if (other) ids[from] = other; else ids.splice(from, 1); }
      else if (sel < ids.length) ids[sel] = id;
      else ids.push(id);
      const r = E.Party.set(ids);
      if (!r.ok) UI.toast(r.message); else { E.Audio.sfx('open'); sel = Math.min(Math.max(0, E.Party.ids().indexOf(id)), E.Party.MAX - 1); }
      draw();
    };
    draw();
    E.WG.locked = true;
    UI.open(el, () => { E.WG.locked = false; if (E.HUD && E.HUD.party) { E.HUD.party(true); } });
  };
  addEventListener('keydown', (event) => {
    if (event.code !== 'KeyL' || event.repeat || (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName))) return;
    if (!E.WG || E.WG.mode() !== 'world' || E.WG.locked || E.UI.anyOpen() || document.querySelector('.modal-bg') || (E.WorldServices && E.WorldServices.active) || E.BattleUI.current) return;
    event.preventDefault(); PU.open();
  });
  E.PartyUI = PU;
})();
